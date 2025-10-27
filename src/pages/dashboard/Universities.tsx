import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  ExternalLink,
  Loader2,
  Globe,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import type { Database } from '@/integrations/supabase/types';
import { getOrCreateCityId, getOrCreateCountryId } from '@/utils/countryUtils';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import UniversityProgramsDialog from '@/components/UniversityProgramsDialog';

const STORAGE_BUCKET = 'profiles';

type UniversityRow = Database['public']['Tables']['universities']['Row'];
type UniversityUpdate = Database['public']['Tables']['universities']['Update'];
type AddressUpdate = Database['public']['Tables']['addresses']['Update'];
type AddressInsert = Database['public']['Tables']['addresses']['Insert'];

type AddressRecord = {
  id: string;
  street: string | null;
  state: string | null;
  postal_code: string | null;
  city: {
    id: string;
    name: string | null;
  } | null;
};

type UniversityProfileQuery = {
  university: (UniversityRow & {
    country?: {
      id: string;
      name: string | null;
    } | null;
  }) | null;
  address: AddressRecord | null;
};

interface UniversityProfileForm {
  name: string;
  logoPath: string | null;
  websiteUrl: string;
  generalEmail: string;
  telephone: string;
  promotionalVideoUrl: string;
  about: string;
  acceptanceCriteria: string;
  countryId: string | null;
  countryName: string;
  street: string;
  state: string;
  postalCode: string;
  cityId: string | null;
  cityName: string;
  addressId: string | null;
}

interface AdminUniversityRow {
  id: string;
  name: string;
  general_contact_email: string | null;
  telephone_number: string | null;
  website_url: string | null;
  acceptance_criteria: string | null;
  additional_notes: string | null;
  is_active: boolean;
  programs_count: number;
}

interface AdminUniversityFormState {
  name: string;
  generalEmail: string;
  telephone: string;
  website: string;
  acceptanceCriteria: string;
  additionalNotes: string;
  isActive: boolean;
}

const defaultAdminUniversityForm: AdminUniversityFormState = {
  name: '',
  generalEmail: '',
  telephone: '',
  website: '',
  acceptanceCriteria: '',
  additionalNotes: '',
  isActive: true,
};

type AdminUniversityQueryResult = Database['public']['Tables']['universities']['Row'] & {
  programs: { id: string }[] | null;
};

const sanitize = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getPublicLogoUrl = (path: string | null) => {
  if (!path) return null;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl ?? null;
};

const UniversityOfficialProfile = ({
  universityId,
  userId,
}: {
  universityId: string;
  userId: string;
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<UniversityProfileForm | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const profileQueryKey = ['university-profile', universityId] as const;

  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery<UniversityProfileQuery>({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const [{ data: university, error: universityError }, { data: addressData, error: addressError }] = await Promise.all([
        supabase
          .from('universities')
          .select(
            `
              id,
              name,
              logo_url,
              website_url,
              general_contact_email,
              telephone_number,
              promotional_video_url,
              additional_notes,
              acceptance_criteria,
              country_id,
              required_documents,
              country:countries ( id, name )
            `
          )
          .eq('id', universityId)
          .maybeSingle(),
        supabase
          .from('addresses')
          .select(
            `
              id,
              street,
              state,
              postal_code,
              city:cities ( id, name )
            `
          )
          .eq('university_id', universityId)
          .limit(1),
      ]);

      if (universityError) {
        throw new Error(universityError.message || 'Unable to load university profile');
      }

      if (addressError) {
        console.error('Failed to load address:', addressError.message);
      }

      const address = Array.isArray(addressData) ? (addressData[0] as AddressRecord | undefined) ?? null : null;

      return {
        university: university as UniversityProfileQuery['university'],
        address,
      } satisfies UniversityProfileQuery;
    },
    enabled: Boolean(universityId),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!profileData?.university) return;
    const { university, address } = profileData;
    setFormState({
      name: university.name,
      logoPath: university.logo_url ?? null,
      websiteUrl: university.website_url ?? '',
      generalEmail: university.general_contact_email ?? '',
      telephone: university.telephone_number ?? '',
      promotionalVideoUrl: university.promotional_video_url ?? '',
      about: university.additional_notes ?? '',
      acceptanceCriteria: university.acceptance_criteria ?? '',
      countryId: university.country_id ?? university.country?.id ?? null,
      countryName: university.country?.name ?? '',
      street: address?.street ?? '',
      state: address?.state ?? '',
      postalCode: address?.postal_code ?? '',
      cityId: address?.city?.id ?? null,
      cityName: address?.city?.name ?? '',
      addressId: address?.id ?? null,
    });
  }, [profileData]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }

    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const mutation = useMutation({
    mutationFn: async (values: UniversityProfileForm) => {
      let logoPath = values.logoPath ?? null;

      if (logoFile) {
        const extension = logoFile.name.split('.').pop() ?? 'png';
        const storagePath = `${userId}/logo_${Date.now()}.${extension}`;
        const { data: uploadResponse, error: uploadError } = await supabase
          .storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, logoFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message || 'Failed to upload logo');
        }

        logoPath = uploadResponse?.path ?? storagePath;
      }

      values.logoPath = logoPath;

      let countryId = values.countryId;
      if (!countryId && values.countryName) {
        countryId = await getOrCreateCountryId(values.countryName);
      }

      let cityId = values.cityId;
      if (countryId && values.cityName) {
        cityId = await getOrCreateCityId(countryId, values.cityName, values.state || undefined);
      }

      values.countryId = countryId ?? null;
      values.cityId = cityId ?? null;

      const universityPayload: UniversityUpdate = {
        name: values.name,
        website_url: sanitize(values.websiteUrl),
        general_contact_email: sanitize(values.generalEmail),
        telephone_number: sanitize(values.telephone),
        promotional_video_url: sanitize(values.promotionalVideoUrl),
        additional_notes: sanitize(values.about),
        acceptance_criteria: sanitize(values.acceptanceCriteria),
        logo_url: logoPath,
        country_id: countryId ?? null,
      };

      const { error: updateError } = await supabase
        .from('universities')
        .update(universityPayload)
        .eq('id', universityId);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update university profile');
      }

      const hasAddressValues = Boolean(
        values.street || values.state || values.postalCode || values.cityName
      );

      if (values.addressId || hasAddressValues) {
        let resolvedCityId: string | null = cityId ?? null;

        if (!resolvedCityId && (values.cityName ?? '').trim().length > 0) {
          try {
            const countryIdentifier = values.countryName || formState.countryName || '';
            if (countryIdentifier) {
              const resolvedCountryId = await getOrCreateCountryId(countryIdentifier);
              if (resolvedCountryId) {
                resolvedCityId = await getOrCreateCityId(
                  resolvedCountryId,
                  values.cityName,
                  values.state || undefined
                );
              }
            }
          } catch (cityError) {
            console.error('Failed to resolve campus city:', cityError);
          }
        }

        const addressPayloadBase = {
          street: sanitize(values.street),
          state: sanitize(values.state),
          postal_code: sanitize(values.postalCode),
          city: sanitize(values.cityName ?? ''),
          city_id: resolvedCityId,
          country: sanitize(values.countryName ?? ''),
        };

        if (values.addressId) {
          const { error: addressUpdateError } = await supabase
            .from('addresses')
            .update(addressPayloadBase as AddressUpdate)
            .eq('id', values.addressId);

          if (addressUpdateError) {
            throw new Error(addressUpdateError.message || 'Failed to update address');
          }
        } else if (hasAddressValues) {
          const addressPayload: AddressInsert = {
            university_id: universityId,
            user_id: userId,
            address_type: 'campus',
            ...addressPayloadBase,
          } as AddressInsert;

          const { data: addressRows, error: insertError } = await supabase
            .from('addresses')
            .insert(addressPayload)
            .select('id')
            .single();

          if (insertError) {
            throw new Error(insertError.message || 'Failed to save address');
          }

          values.addressId = addressRows?.id ?? values.addressId;
        }
      }

      return { ...values, logoPath };
    },
    onSuccess: async (updatedValues) => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setLogoFile(null);
      setLogoPreview(null);
      setFormState(updatedValues);
      toast({
        title: 'Profile updated',
        description: 'Your university details have been saved successfully.',
      });
    },
    onError: (mutationError: any) => {
      toast({
        title: 'Update failed',
        description: mutationError?.message ?? 'Please review the form and try again.',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (
    field: keyof UniversityProfileForm,
    value: string | null,
  ) => {
    setFormState((prev) => (prev ? { ...prev, [field]: value ?? '' } : prev));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState) return;
    mutation.mutate(formState);
  };

  const handleReset = () => {
    if (!profileData?.university) return;
    setLogoFile(null);
    setLogoPreview(null);
    const { university, address } = profileData;
    setFormState({
      name: university.name,
      logoPath: university.logo_url ?? null,
      websiteUrl: university.website_url ?? '',
      generalEmail: university.general_contact_email ?? '',
      telephone: university.telephone_number ?? '',
      promotionalVideoUrl: university.promotional_video_url ?? '',
      about: university.additional_notes ?? '',
      acceptanceCriteria: university.acceptance_criteria ?? '',
      countryId: university.country_id ?? university.country?.id ?? null,
      countryName: university.country?.name ?? '',
      street: address?.street ?? '',
      state: address?.state ?? '',
      postalCode: address?.postal_code ?? '',
      cityId: address?.city?.id ?? null,
      cityName: address?.city?.name ?? '',
      addressId: address?.id ?? null,
    });
  };

  const publicLogoUrl = useMemo(() => {
    if (logoPreview) return logoPreview;
    if (!formState?.logoPath) return null;
    return getPublicLogoUrl(formState.logoPath);
  }, [formState?.logoPath, logoPreview]);

  if (isLoading || !formState) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mb-3 h-6 w-6 animate-spin" />
        Loading your university profile...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unable to load university profile</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">University profile</h1>
          <p className="text-muted-foreground">
            Keep your institution details up to date so students see accurate information.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
          <Avatar className="h-14 w-14 border">
            {publicLogoUrl ? (
              <AvatarImage src={publicLogoUrl} alt={formState.name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {formState.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground">Institution</p>
            <p className="text-base font-semibold text-foreground">{formState.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Brand & overview</CardTitle>
            <CardDescription>
              Control how your university appears across the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex w-full flex-col gap-3 lg:w-1/2">
                <div className="space-y-2">
                  <Label htmlFor="university-name">University name</Label>
                  <Input
                    id="university-name"
                    value={formState.name}
                    onChange={(event) => handleInputChange('name', event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-about">About / description</Label>
                  <Textarea
                    id="university-about"
                    value={formState.about}
                    onChange={(event) => handleInputChange('about', event.target.value)}
                    placeholder="Highlight your campus culture, signature programs, and student experience."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-criteria">Acceptance criteria</Label>
                  <Textarea
                    id="university-criteria"
                    value={formState.acceptanceCriteria}
                    onChange={(event) => handleInputChange('acceptanceCriteria', event.target.value)}
                    placeholder="List academic requirements, language proficiency expectations, or portfolio needs."
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex w-full flex-col items-center gap-4 rounded-lg border bg-muted/30 p-6 lg:w-1/2">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="h-28 w-28 border">
                    {publicLogoUrl ? (
                      <AvatarImage src={publicLogoUrl} alt={`${formState.name} logo`} />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                        {formState.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-center text-sm text-muted-foreground">
                    Upload a square logo (PNG or SVG) for best results.
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <Label htmlFor="university-logo">Logo image</Label>
                  <Input
                    id="university-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We’ll store this securely and use it across the dashboard.
                  </p>
                  {formState.logoPath && !logoFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 self-start"
                      onClick={() => {
                        setFormState((prev) => (prev ? { ...prev, logoPath: null } : prev));
                      }}
                    >
                      Remove current logo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact & digital presence</CardTitle>
            <CardDescription>
              Provide links and channels students can use to reach your admissions team.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="university-website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="university-website"
                  type="url"
                  placeholder="https://university.edu"
                  className="pl-9"
                  value={formState.websiteUrl}
                  onChange={(event) => handleInputChange('websiteUrl', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="university-email">Contact email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="university-email"
                  type="email"
                  placeholder="admissions@university.edu"
                  className="pl-9"
                  value={formState.generalEmail}
                  onChange={(event) => handleInputChange('generalEmail', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="university-phone">Telephone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="university-phone"
                  placeholder="+90 555 000 0000"
                  className="pl-9"
                  value={formState.telephone}
                  onChange={(event) => handleInputChange('telephone', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="university-video">Promotional video URL</Label>
              <Input
                id="university-video"
                placeholder="https://youtu.be/..."
                value={formState.promotionalVideoUrl}
                onChange={(event) => handleInputChange('promotionalVideoUrl', event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campus location</CardTitle>
            <CardDescription>
              Share where your main admissions office or campus is located.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country-name">Country</Label>
                <Input
                  id="country-name"
                  placeholder="e.g. Turkey"
                  value={formState.countryName}
                  onChange={(event) =>
                    setFormState((prev) => (
                      prev
                        ? {
                            ...prev,
                            countryName: event.target.value,
                            countryId: null,
                          }
                        : prev
                    ))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city-name">City</Label>
                <Input
                  id="city-name"
                  placeholder="e.g. Istanbul"
                  value={formState.cityName}
                  onChange={(event) =>
                    setFormState((prev) => (
                      prev
                        ? {
                            ...prev,
                            cityName: event.target.value,
                            cityId: null,
                          }
                        : prev
                    ))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state-name">State / Region</Label>
                <Input
                  id="state-name"
                  placeholder="e.g. Marmara Region"
                  value={formState.state}
                  onChange={(event) => handleInputChange('state', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal-code">Postal code</Label>
                <Input
                  id="postal-code"
                  placeholder="e.g. 34000"
                  value={formState.postalCode}
                  onChange={(event) => handleInputChange('postalCode', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="street-address">Street address</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="street-address"
                  className="pl-9"
                  placeholder="Campus street and building details"
                  rows={3}
                  value={formState.street}
                  onChange={(event) => handleInputChange('street', event.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={mutation.isPending}
          >
            Reset changes
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

interface UniversityCard {
  id: string;
  name: string;
  country: string;
  programs: number;
  logo_url: string | null;
  website: string;
  description: string;
}

const AdminUniversitiesView = () => {
  const [universities, setUniversities] = useState<AdminUniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUniversity, setSelectedUniversity] = useState<AdminUniversityRow | null>(null);
  const [formState, setFormState] = useState<AdminUniversityFormState>(defaultAdminUniversityForm);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('universities')
        .select(`
          id,
          name,
          general_contact_email,
          telephone_number,
          website_url,
          acceptance_criteria,
          additional_notes,
          is_active,
          programs ( id )
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const formatted: AdminUniversityRow[] = ((data ?? []) as AdminUniversityQueryResult[]).map((item) => ({
        id: item.id,
        name: item.name,
        general_contact_email: item.general_contact_email ?? null,
        telephone_number: item.telephone_number ?? null,
        website_url: item.website_url ?? null,
        acceptance_criteria: item.acceptance_criteria ?? null,
        additional_notes: item.additional_notes ?? null,
        is_active: Boolean(item.is_active),
        programs_count: Array.isArray(item.programs) ? item.programs.length : 0,
      }));

      setUniversities(formatted);
    } catch (error) {
      console.error('Error loading universities for admin view:', error);
      toast({
        title: 'Unable to load universities',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedUniversity(null);
    setFormState(defaultAdminUniversityForm);
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setSelectedUniversity(null);
    setFormState(defaultAdminUniversityForm);
    setDialogOpen(true);
  };

  const openEditDialog = (university: AdminUniversityRow) => {
    setDialogMode('edit');
    setSelectedUniversity(university);
    setFormState({
      name: university.name,
      generalEmail: university.general_contact_email ?? '',
      telephone: university.telephone_number ?? '',
      website: university.website_url ?? '',
      acceptanceCriteria: university.acceptance_criteria ?? '',
      additionalNotes: university.additional_notes ?? '',
      isActive: university.is_active,
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (university: AdminUniversityRow, nextActive: boolean) => {
    setUpdatingId(university.id);
    try {
      const { error } = await supabase
        .from('universities')
        .update({ is_active: nextActive })
        .eq('id', university.id);

      if (error) throw error;

      setUniversities((prev) =>
        prev.map((item) => (item.id === university.id ? { ...item, is_active: nextActive } : item)),
      );
      toast({
        title: nextActive ? 'University activated' : 'University deactivated',
        description: university.name,
      });
    } catch (error) {
      console.error('Error updating university status:', error);
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) {
      toast({
        title: 'University name is required',
        description: 'Please provide a name before saving.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formState.name.trim(),
        general_contact_email: sanitize(formState.generalEmail),
        telephone_number: sanitize(formState.telephone),
        website_url: sanitize(formState.website),
        acceptance_criteria: sanitize(formState.acceptanceCriteria),
        additional_notes: sanitize(formState.additionalNotes),
        is_active: formState.isActive,
      } as UniversityUpdate;

      if (dialogMode === 'create') {
        const { error } = await supabase.from('universities').insert(payload);
        if (error) throw error;
        toast({
          title: 'University created',
          description: formState.name,
        });
      } else if (selectedUniversity) {
        const { error } = await supabase
          .from('universities')
          .update(payload)
          .eq('id', selectedUniversity.id);
        if (error) throw error;
        toast({
          title: 'University updated',
          description: formState.name,
        });
      }

      closeDialog();
      await loadUniversities();
    } catch (error) {
      console.error('Error saving university', error);
      toast({
        title: 'Failed to save university',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Universities</h1>
          <p className="text-muted-foreground">Add new partners or update existing university records.</p>
        </div>
        <Button onClick={openCreateDialog}>
          Add university
        </Button>
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-lg border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">University</TableHead>
                  <TableHead>Contact email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Programs</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.map((university) => (
                  <TableRow key={university.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{university.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {university.website_url ?? 'No website'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{university.general_contact_email ?? '—'}</TableCell>
                    <TableCell>{university.telephone_number ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={university.is_active ? 'default' : 'secondary'}>
                          {university.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={university.is_active}
                          onCheckedChange={(checked) => handleToggleActive(university, Boolean(checked))}
                          disabled={updatingId === university.id}
                        />
                      </div>
                    </TableCell>
                    <TableCell>{university.programs_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(university)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          } else {
            setDialogOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Add university' : `Edit ${selectedUniversity?.name ?? ''}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-university-name">University name</Label>
              <Input
                id="admin-university-name"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Istanbul Technical University"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-university-email">General contact email</Label>
                <Input
                  id="admin-university-email"
                  type="email"
                  value={formState.generalEmail}
                  onChange={(event) => setFormState((prev) => ({ ...prev, generalEmail: event.target.value }))}
                  placeholder="admissions@example.edu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-university-phone">Telephone number</Label>
                <Input
                  id="admin-university-phone"
                  value={formState.telephone}
                  onChange={(event) => setFormState((prev) => ({ ...prev, telephone: event.target.value }))}
                  placeholder="+90 212 285 00 00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-university-website">Website</Label>
              <Input
                id="admin-university-website"
                value={formState.website}
                onChange={(event) => setFormState((prev) => ({ ...prev, website: event.target.value }))}
                placeholder="https://example.edu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-university-acceptance">Acceptance criteria</Label>
              <Textarea
                id="admin-university-acceptance"
                value={formState.acceptanceCriteria}
                onChange={(event) => setFormState((prev) => ({ ...prev, acceptanceCriteria: event.target.value }))}
                placeholder="Describe high-level admission criteria"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-university-notes">Additional notes</Label>
              <Textarea
                id="admin-university-notes"
                value={formState.additionalNotes}
                onChange={(event) => setFormState((prev) => ({ ...prev, additionalNotes: event.target.value }))}
                placeholder="Internal notes or highlights about this institution"
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Show in catalog</p>
                <p className="text-xs text-muted-foreground">Toggle visibility for students and partners.</p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: Boolean(checked) }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const UniversityDiscoveryView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [universities, setUniversities] = useState<any[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [selectedUniversityName, setSelectedUniversityName] = useState('');
  const [programsDialogOpen, setProgramsDialogOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { isComplete, completionPercentage, shouldShowModal } = useProfileCompletion();
  const { toast } = useToast();

  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('universities')
        .select(`
          id,
          name,
          logo_url,
          website_url,
          additional_notes,
          country:countries (
            name
          ),
          programs (
            id
          )
        `);

      if (error) throw error;

      const formattedUniversities = data?.map((uni: any) => ({
        id: uni.id,
        name: uni.name,
        country: uni.country?.name || 'Unknown',
        logo_url: uni.logo_url,
        website: uni.website_url || '#',
        description: uni.additional_notes || 'Explore our programs and join our community.',
        programs: uni.programs?.length || 0,
      })) || [];

      setUniversities(formattedUniversities);

      // Extract unique countries
      const uniqueCountries = Array.from(
        new Set(formattedUniversities.map((u: any) => u.country).filter(Boolean))
      );
      setCountries(uniqueCountries as string[]);
    } catch (error) {
      console.error('Error loading universities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load universities',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPublicLogoUrl = (logoPath: string | null) => {
    if (!logoPath) return null;
    const { data } = supabase.storage.from('profiles').getPublicUrl(logoPath);
    return data.publicUrl;
  };

  const handleViewPrograms = (universityId: string, universityName: string) => {
    if (!isComplete && shouldShowModal) {
      setShowProfileModal(true);
      return;
    }
    setSelectedUniversityId(universityId);
    setSelectedUniversityName(universityName);
    setProgramsDialogOpen(true);
  };

  const filteredUniversities = useMemo(() => {
    return universities.filter((university) => {
      const matchesSearch = searchQuery
        ? university.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCountry = selectedCountry === 'all'
        ? true
        : university.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [universities, searchQuery, selectedCountry]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Universities</h1>
        <p className="text-muted-foreground">
          Explore universities worldwide and find your perfect match
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredUniversities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4 opacity-50" />
            <p>No universities found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUniversities.map((university) => {
            const logoUrl = getPublicLogoUrl(university.logo_url);
            
            return (
              <Card key={university.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-14 w-14">
                      {logoUrl ? (
                        <AvatarImage src={logoUrl} alt={university.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {university.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{university.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{university.country}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {university.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Programs</p>
                      <p className="font-semibold">{university.programs}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewPrograms(university.id, university.name)}
                    >
                      View Programs
                    </Button>
                    {university.website && university.website !== '#' && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={university.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <UniversityProgramsDialog
        universityId={selectedUniversityId}
        universityName={selectedUniversityName}
        open={programsDialogOpen}
        onOpenChange={setProgramsDialogOpen}
      />

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        completionPercentage={completionPercentage}
        action="search"
      />
    </div>
  );
};

const Universities = () => {
  const { role, userData } = useUserRole();

  if (role === 'administrator') {
    return <AdminUniversitiesView />;
  }

  if (role === 'university_official') {
    const universityId = (userData as { university_id?: string } | null)?.university_id;
    const userId = (userData as { user_id?: string } | null)?.user_id;

    if (!universityId || !userId) {
      return (
        <Alert>
          <AlertTitle>University profile not linked</AlertTitle>
          <AlertDescription>
            Your account is pending a university assignment. Please complete the onboarding flow or contact support.
          </AlertDescription>
        </Alert>
      );
    }

    return <UniversityOfficialProfile universityId={universityId} userId={userId} />;
  }

  return <UniversityDiscoveryView />;
};

export default Universities;
