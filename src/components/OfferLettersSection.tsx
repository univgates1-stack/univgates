import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, FileText } from 'lucide-react';
import { OfferLetterUpload } from '@/components/OfferLetterUpload';

interface OfferLetter {
  id: string;
  file_name: string;
  file_path: string;
  uploaded_at: string;
  notes: string | null;
}

interface OfferLettersSectionProps {
  applicationId: string;
  userRole: string;
}

export function OfferLettersSection({ applicationId, userRole }: OfferLettersSectionProps) {
  const [offerLetters, setOfferLetters] = useState<OfferLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOfferLetters = async () => {
    try {
      const { data, error } = await supabase
        .from('offer_letters')
        .select('*')
        .eq('application_id', applicationId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setOfferLetters(data || []);
    } catch (error) {
      console.error('Failed to fetch offer letters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferLetters();
  }, [applicationId]);

  const handleDownload = async (offerLetter: OfferLetter) => {
    try {
      const { data, error } = await supabase.storage
        .from('offer-letters')
        .download(offerLetter.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = offerLetter.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Offer letter downloaded successfully.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Unable to download the offer letter.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {userRole === 'university_official' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Offer Letter</CardTitle>
          </CardHeader>
          <CardContent>
            <OfferLetterUpload 
              applicationId={applicationId} 
              onUploadSuccess={fetchOfferLetters}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {offerLetters.length > 0 ? 'Offer Letters' : 'No Offer Letters Yet'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : offerLetters.length === 0 ? (
            <p className="text-muted-foreground">
              {userRole === 'university_official'
                ? 'Upload an offer letter to share with the student.'
                : 'No offer letters have been uploaded yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {offerLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{letter.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(letter.uploaded_at).toLocaleDateString()}
                      </p>
                      {letter.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Note: {letter.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(letter)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
