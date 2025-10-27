import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, GraduationCap, Calendar, DollarSign, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface Program {
  id: string;
  name_id: string;
  description_id: string;
  study_levels: string[] | null;
  languages: string[] | null;
  tuition_fee: number | null;
  currency: string | null;
  intake_dates: string[] | null;
  application_deadline: string | null;
  minimum_gpa: number | null;
  seats: number | null;
}

interface UniversityProgramsDialogProps {
  universityId: string | null;
  universityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UniversityProgramsDialog = ({ 
  universityId, 
  universityName, 
  open, 
  onOpenChange 
}: UniversityProgramsDialogProps) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && universityId) {
      loadPrograms();
    }
  }, [open, universityId]);

  const loadPrograms = async () => {
    if (!universityId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('university_id', universityId);

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load programs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return 'Contact university';
    return `${amount.toLocaleString()} ${currency || 'USD'}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Programs at {universityName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No programs available at this time</p>
          </div>
        ) : (
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">Program {program.id.slice(0, 8)}</h3>
                      {program.description_id && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ID: {program.description_id}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {program.study_levels?.map((level) => (
                        <Badge key={level} variant="secondary">
                          <GraduationCap className="h-3 w-3 mr-1" />
                          {level}
                        </Badge>
                      ))}
                      {program.languages?.map((lang) => (
                        <Badge key={lang} variant="outline">
                          <Languages className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Tuition Fee
                        </p>
                        <p className="font-medium">
                          {formatCurrency(program.tuition_fee, program.currency)}
                        </p>
                      </div>

                      {program.minimum_gpa !== null && program.minimum_gpa !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Min. Grade (out of 100)</p>
                          <p className="font-medium">{program.minimum_gpa}</p>
                        </div>
                      )}

                      {program.seats && (
                        <div>
                          <p className="text-muted-foreground">Available Seats</p>
                          <p className="font-medium">{program.seats}</p>
                        </div>
                      )}

                      {program.application_deadline && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Deadline
                          </p>
                          <p className="font-medium">
                            {new Date(program.application_deadline).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {program.intake_dates && program.intake_dates.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Intake Dates</p>
                          <p className="font-medium">
                            {program.intake_dates.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>

                    <Button className="w-full" variant="outline">
                      Apply Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UniversityProgramsDialog;
