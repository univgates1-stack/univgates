import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, Building2, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useTranslation } from 'react-i18next';

type UniversityOfficialRow = Database['public']['Tables']['university_officials']['Row'];

interface UserData {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string | null;
  language_preference?: string | null;
}

interface PhoneForm {
  countryCode: string;
  phoneNumber: string;
}

interface UniversityBankAccount {
  id: string;
  university_id: string;
  bank_name: string;
  branch_name: string | null;
  account_number: string;
  swift_code: string | null;
  iban: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface BankAccountForm {
  bankName: string;
  branchName: string;
  accountNumber: string;
  swiftCode: string;
  iban: string;
}

const UniversityOfficialProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [officialData, setOfficialData] = useState<UniversityOfficialRow | null>(null);
  const [directPhone, setDirectPhone] = useState<PhoneForm>({
    countryCode: '+90',
    phoneNumber: '',
  });
  const [bankAccounts, setBankAccounts] = useState<UniversityBankAccount[]>([]);
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountForm>({
    bankName: '',
    branchName: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
  });
  const [creatingBankAccount, setCreatingBankAccount] = useState(false);
  
  const { toast } = useToast();
  const { i18n } = useTranslation();

  useEffect(() => {
    const languageCode = i18n.language.split('-')[0];
    setUserData((prev) => (prev ? { ...prev, language_preference: languageCode } : prev));
  }, [i18n.language]);

  const fetchUserData = useCallback(async () => {
    try {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error) throw error;

      const user = authData.user;
      if (!user) return;

      // Fetch user data
      const { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      const preferredLanguage = userRecord?.language_preference ?? 'en';

      setUserData({
        id: user.id,
        email: userRecord?.email ?? user.email ?? '',
        first_name: userRecord?.first_name ?? '',
        last_name: userRecord?.last_name ?? '',
        profile_picture_url: userRecord?.profile_picture_url ?? null,
        language_preference: preferredLanguage,
      });

      await i18n.changeLanguage(preferredLanguage);

      // Fetch university official data
      const { data: officialRecord } = await supabase
        .from('university_officials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (officialRecord) {
        setOfficialData(officialRecord);

        // Parse direct phone if stored
        if (officialRecord.direct_phone) {
          const parts = officialRecord.direct_phone.split(' ');
          if (parts.length >= 2) {
            setDirectPhone({
              countryCode: parts[0],
              phoneNumber: parts.slice(1).join(' '),
            });
          } else {
            setDirectPhone({
              countryCode: '+90',
              phoneNumber: officialRecord.direct_phone,
            });
          }
        }

        if (officialRecord.university_id) {
          const { data: bankAccountRows, error: bankAccountsError } = await supabase
            .from('university_bank_accounts')
            .select('*')
            .eq('university_id', officialRecord.university_id);

          if (bankAccountsError) {
            throw bankAccountsError;
          }

          setBankAccounts((bankAccountRows as UniversityBankAccount[]) ?? []);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error loading profile',
        description: error instanceof Error ? error.message : 'Unable to load profile information.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast, i18n]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSaveProfile = async () => {
    if (!userData || !officialData) return;

    setSaving(true);
    try {
      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: userData.first_name,
          last_name: userData.last_name,
          language_preference: userData.language_preference ?? 'en',
          email: userData.email,
        })
        .eq('id', userData.id);

      if (userError) throw userError;

      // Update university_officials table
      const { error: officialError } = await supabase
        .from('university_officials')
        .update({
          authorized_person_name: `${userData.first_name} ${userData.last_name}`.trim(),
          authorized_person_email: officialData.authorized_person_email,
          position_title: officialData.position_title,
          direct_phone: `${directPhone.countryCode} ${directPhone.phoneNumber}`.trim(),
          bank_account_number: officialData.bank_account_number,
        })
        .eq('id', officialData.id);

      if (officialError) throw officialError;

      await i18n.changeLanguage(userData.language_preference ?? 'en');

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      await fetchUserData();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : 'Unable to save profile.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBankAccount = async () => {
    if (!officialData?.university_id) {
      toast({
        title: 'Unable to add bank account',
        description: 'University information is missing for this profile. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    if (!bankAccountForm.bankName.trim() || !bankAccountForm.accountNumber.trim()) {
      toast({
        title: 'Incomplete information',
        description: 'Bank name and account number are required.',
        variant: 'destructive',
      });
      return;
    }

    setCreatingBankAccount(true);
    try {
      const payload = {
        university_id: officialData.university_id,
        bank_name: bankAccountForm.bankName.trim(),
        branch_name: bankAccountForm.branchName.trim() || null,
        account_number: bankAccountForm.accountNumber.trim(),
        swift_code: bankAccountForm.swiftCode.trim() || null,
        iban: bankAccountForm.iban.trim() || null,
      };

      const { data, error } = await supabase
        .from('university_bank_accounts')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setBankAccounts((prev) => (data ? [...prev, data as UniversityBankAccount] : prev));
      setBankAccountForm({ bankName: '', branchName: '', accountNumber: '', swiftCode: '', iban: '' });

      toast({
        title: 'Bank account added',
        description: 'New university bank account has been saved.',
      });
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast({
        title: 'Error adding bank account',
        description: error instanceof Error ? error.message : 'Unable to add bank account.',
        variant: 'destructive',
      });
    } finally {
      setCreatingBankAccount(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!userData || !officialData) {
    return <div className="text-center">No profile data available.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            University Official Profile
          </CardTitle>
          <CardDescription>Manage your personal and contact information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={userData.first_name}
                onChange={(e) => setUserData({ ...userData, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={userData.last_name}
                onChange={(e) => setUserData({ ...userData, last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={officialData.authorized_person_email ?? ''}
              onChange={(e) => setOfficialData({ ...officialData, authorized_person_email: e.target.value })}
              placeholder="Enter email"
            />
          </div>

          {/* Position/Title */}
          <div className="space-y-2">
            <Label htmlFor="position" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Position/Title
            </Label>
            <Input
              id="position"
              value={officialData.position_title ?? ''}
              onChange={(e) => setOfficialData({ ...officialData, position_title: e.target.value })}
              placeholder="e.g., Admissions Director"
            />
          </div>

          {/* Direct Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Direct Phone
            </Label>
            <div className="flex gap-2">
              <Input
                className="w-24"
                value={directPhone.countryCode}
                onChange={(e) => setDirectPhone({ ...directPhone, countryCode: e.target.value })}
                placeholder="+90"
              />
              <Input
                className="flex-1"
                value={directPhone.phoneNumber}
                onChange={(e) => setDirectPhone({ ...directPhone, phoneNumber: e.target.value })}
                placeholder="Enter direct phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredLanguage">Preferred Language</Label>
            <Select
              value={userData.language_preference ?? 'en'}
              onValueChange={(value) => {
                setUserData({ ...userData, language_preference: value });
                void i18n.changeLanguage(value);
              }}
            >
              <SelectTrigger id="preferredLanguage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="tr">Turkish</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Badge */}
          <div className="space-y-2">
            <Label>Account Status</Label>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm ${
                officialData.status === 'approved' 
                  ? 'bg-green-100 text-green-800' 
                  : officialData.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {officialData.status?.charAt(0).toUpperCase() + officialData.status?.slice(1)}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            University Bank Accounts
          </CardTitle>
          <CardDescription>
            Add banking details for your institution. Existing accounts appear below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankAccountForm.bankName}
                onChange={(e) => setBankAccountForm((prev) => ({ ...prev, bankName: e.target.value }))}
                placeholder="e.g., Ziraat Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                value={bankAccountForm.branchName}
                onChange={(e) => setBankAccountForm((prev) => ({ ...prev, branchName: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={bankAccountForm.accountNumber}
                onChange={(e) => setBankAccountForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="Enter account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swiftCode">SWIFT/BIC</Label>
              <Input
                id="swiftCode"
                value={bankAccountForm.swiftCode}
                onChange={(e) => setBankAccountForm((prev) => ({ ...prev, swiftCode: e.target.value }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={bankAccountForm.iban}
              onChange={(e) => setBankAccountForm((prev) => ({ ...prev, iban: e.target.value }))}
              placeholder="Optional"
            />
          </div>

          <Button
            type="button"
            onClick={handleCreateBankAccount}
            disabled={creatingBankAccount}
            className="w-full md:w-auto"
          >
            {creatingBankAccount ? 'Adding...' : 'Add Bank Account'}
          </Button>

          {bankAccounts.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold">Existing Accounts</h4>
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="rounded-lg border p-4 space-y-1">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-medium">{account.bank_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.created_at ? new Date(account.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    {account.branch_name && (
                      <p className="text-sm text-muted-foreground">Branch: {account.branch_name}</p>
                    )}
                    <p className="text-sm">Account: {account.account_number}</p>
                    {account.iban && <p className="text-sm">IBAN: {account.iban}</p>}
                    {account.swift_code && <p className="text-sm">SWIFT: {account.swift_code}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UniversityOfficialProfile;
