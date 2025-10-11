import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2 } from 'lucide-react';

interface OfferLetterUploadProps {
  applicationId: string;
  onUploadSuccess?: () => void;
}

export function OfferLetterUpload({ applicationId, onUploadSuccess }: OfferLetterUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select an offer letter to upload.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get university official ID
      const { data: official, error: officialError } = await supabase
        .from('university_officials')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (officialError) throw officialError;

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${applicationId}_${Date.now()}.${fileExt}`;
      const filePath = `${applicationId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('offer-letters')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('offer_letters')
        .insert({
          application_id: applicationId,
          file_name: file.name,
          file_path: filePath,
          uploaded_by: official.id,
          notes: notes || null,
        });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Offer letter uploaded successfully.',
      });

      setFile(null);
      setNotes('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload offer letter.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <Label htmlFor="offer-letter">Offer Letter (PDF, JPG, or PNG)</Label>
        <Input
          id="offer-letter"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {file && (
          <p className="text-sm text-muted-foreground mt-1">
            Selected: {file.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about the offer..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={uploading}
        />
      </div>

      <Button onClick={handleUpload} disabled={uploading || !file}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload Offer Letter
          </>
        )}
      </Button>
    </div>
  );
}
