import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  MapPin,
  DollarSign,
  GraduationCap,
  Calendar,
  Plus,
  Loader2,
  ChevronsUpDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { createProgram, updateProgram } from '@/integrations/supabase/programs';
import { supabase } from '@/integrations/supabase/client';
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ApplicationDialog } from '@/components/ApplicationDialog';
import type { Database } from '@/integrations/supabase/types';

type ProgramRow = Database['public']['Tables']['programs']['Row'];

type Translation = {
  id?: string;
  language_code: string;
  translated_text: string;
};

type TranslationContainer = {
  id?: string;
  translations?: Translation[];
};

type ProgramQueryResult = (ProgramRow & { seats?: number | null }) & {
  name?: TranslationContainer;
  description?: TranslationContainer;
  university?: {
    name: string;
    country?: {
      name: string;
    } | null;
  } | null;
};

interface ProgramCardData {
  id: string;
  universityId: string;
  nameId: string | null;
  descriptionId: string | null;
  name: string;
  universityName: string;
  country: string | null;
  studyLevels: string[];
  languages: string[];
  intakeDates: string[];
  tuitionFee: number | null;
  currency: string | null;
  minimumGpa: number | null;
  applicationDeadline: string | null;
  description: string | null;
  seats: number | null;
  requiredDocuments?: any;
  acceptanceCriteria?: string | null;
}

interface ProgramFormState {
  name: string;
  language: string;
  minimumGpa: string;
  tuitionFee: string;
  currency: string;
  seats: string;
  studyLevels: string[];
  intakePeriods: string;
  applicationDeadline: string;
  description: string;
  requiredDocuments: string;
  acceptanceCriteria: string;
  universityId: string;
}

const languageOptions = ['English', 'Turkish', 'German', 'French'];
const studyLevelOptions = ['Associate', 'Bachelor', 'Master', 'Doctorate'];
const currencyOptions = ['USD', 'EUR', 'GBP', 'TRY'];

interface ProgramUniversityOption {
  id: string;
  name: string;
}

const defaultFormState: ProgramFormState = {
  name: '',
  language: '',
  minimumGpa: '',
  tuitionFee: '',
  currency: 'USD',
  seats: '',
  studyLevels: [],
  intakePeriods: '',
  applicationDeadline: '',
  description: '',
  requiredDocuments: '',
  acceptanceCriteria: '',
  universityId: '',
};

const normalize = (value: string) => value.trim().toLowerCase();

const formatTuition = (amount: number | null, currency: string | null) => {
  if (amount === null || amount === undefined || !currency) {
    return null;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency}`;
  }
};

const formatDeadline = (value: string | null) => {
  if (!value) return 'Rolling admissions';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const formatDateForInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
};

const getPreferredTranslation = (container?: TranslationContainer) => {
  const translations = container?.translations;
  if (!translations || translations.length === 0) return null;
  const english = translations.find((item) => item.language_code === 'en');
  return english?.translated_text ?? translations[0]?.translated_text ?? null;
};

const transformProgram = (program: ProgramQueryResult): ProgramCardData => {
  return {
    id: program.id,
    universityId: program.university_id,
    nameId: program.name_id ?? null,
    descriptionId: program.description_id ?? null,
    name: getPreferredTranslation(program.name) ?? 'Untitled Program',
    universityName: program.university?.name ?? 'Unknown University',
    country: program.university?.country?.name ?? null,
    studyLevels: program.study_levels ?? [],
    languages: program.languages ?? [],
    intakeDates: program.intake_dates ?? [],
    tuitionFee: program.tuition_fee,
    currency: program.currency,
    minimumGpa: program.minimum_gpa === null || program.minimum_gpa === undefined
      ? null
      : Math.max(0, Math.min(100, program.minimum_gpa)),
    applicationDeadline: program.application_deadline,
    description: getPreferredTranslation(program.description),
    seats: (program as ProgramRow & { seats?: number | null }).seats ?? null,
    requiredDocuments: program.required_documents,
    acceptanceCriteria: program.acceptance_criteria,
  };
};

const parseCommaSeparated = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

type FilterMultiSelectProps = {
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
};

const FilterMultiSelect = ({ placeholder, options, selected, onChange }: FilterMultiSelectProps) => {
  const toggleValue = (value: string) => {
    onChange(selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]);
  };

  const displayValue = selected.length
    ? `${selected.length} selected`
    : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded="false"
          className="w-full justify-between"
          disabled={options.length === 0}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">No options available</p>
          ) : (
            options.map((option) => {
              const isChecked = selected.includes(option);
              return (
                <label
                  key={option}
                  className="flex items-center space-x-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked === 'indeterminate') return;
                      toggleValue(option);
                    }}
                  />
                  <span className="truncate">{option}</span>
                </label>
              );
            })
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t px-2 py-1 text-xs text-muted-foreground">
            {selected.join(', ')}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

const Programs = () => {
  const [formValues, setFormValues] = useState<ProgramFormState>(defaultFormState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingProgram, setEditingProgram] = useState<ProgramCardData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programPendingDeletion, setProgramPendingDeletion] = useState<ProgramCardData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedProgramNames, setSelectedProgramNames] = useState<string[]>([]);
  const [minimumGradeFilter, setMinimumGradeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [applicationDialogOpen, setApplicationDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramCardData | null>(null);

  const matchesProgramFilters = useCallback(
    (
      program: ProgramCardData,
      options: {
        ignoreProgramNames?: boolean;
        ignoreLevels?: boolean;
        ignoreCountries?: boolean;
        ignoreUniversities?: boolean;
        ignoreMinimumGrade?: boolean;
      } = {}
    ) => {
      const normalizedSearch = normalize(searchQuery);

      if (normalizedSearch) {
        const haystack = [
          program.name,
          program.universityName,
          program.country ?? '',
          ...program.studyLevels,
          ...program.languages,
        ];

        const hasSearchMatch = haystack.some((field) => normalize(field).includes(normalizedSearch));
        if (!hasSearchMatch) {
          return false;
        }
      }

      if (!options.ignoreLevels && selectedLevels.length > 0) {
        const matchesLevel = selectedLevels.some((level) =>
          program.studyLevels.some((programLevel) => normalize(programLevel) === normalize(level))
        );
        if (!matchesLevel) {
          return false;
        }
      }

      if (!options.ignoreCountries && selectedCountries.length > 0) {
        const matchesCountry = selectedCountries.some((country) =>
          normalize(program.country ?? '') === normalize(country)
        );
        if (!matchesCountry) {
          return false;
        }
      }

      if (!options.ignoreUniversities && selectedUniversities.length > 0) {
        const matchesUniversity = selectedUniversities.some((university) =>
          normalize(program.universityName) === normalize(university)
        );
        if (!matchesUniversity) {
          return false;
        }
      }

      if (!options.ignoreProgramNames && selectedProgramNames.length > 0) {
        const matchesProgramName = selectedProgramNames.some((programName) =>
          normalize(program.name) === normalize(programName)
        );
        if (!matchesProgramName) {
          return false;
        }
      }

      if (!options.ignoreMinimumGrade && minimumGradeFilter.trim()) {
        const parsedFilter = Number.parseFloat(minimumGradeFilter);
        if (!Number.isNaN(parsedFilter)) {
          const programGrade = program.minimumGpa ?? 0;
          if (programGrade < parsedFilter) {
            return false;
          }
        }
      }

      return true;
    },
    [searchQuery, selectedLevels, selectedCountries, selectedUniversities, selectedProgramNames, minimumGradeFilter]
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { role, userData } = useUserRole();
  const { isComplete, completionPercentage, shouldShowModal } = useProfileCompletion();

  const universityId =
    role === 'university_official' &&
    userData &&
    typeof userData === 'object' &&
    'university_id' in userData
      ? ((userData as { university_id?: string | null }).university_id ?? null)
      : null;

  const userKey =
    (userData && typeof userData === 'object' && 'user_id' in userData && userData.user_id)
      ? (userData.user_id as string)
      : 'anonymous';
  const programsQueryKey = ['programs', role ?? 'public', userKey] as const;

  const {
    data: programsData = [],
    isLoading: isProgramsLoading,
    error: programsError,
  } = useQuery<ProgramCardData[]>({
    queryKey: programsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          id,
          university_id,
          tuition_fee,
          currency,
          minimum_gpa,
          languages,
          study_levels,
          intake_dates,
          application_deadline,
          is_active,
          name_id,
          description_id,
          seats,
          required_documents,
          acceptance_criteria,
          name:translatable_strings!programs_name_id_fkey (
            id,
            translations (
              language_code,
              translated_text
            )
          ),
          description:translatable_strings!programs_description_id_fkey (
            id,
            translations (
              language_code,
              translated_text
            )
          ),
          university:universities (
            name,
            country:countries ( name )
          )
        `)
        .eq('is_active', true)
        .order('tuition_fee', { ascending: true, nullsFirst: true });

      if (error) {
        throw new Error(error.message || 'Failed to fetch programs');
      }

      return (data as ProgramQueryResult[] | null)?.map(transformProgram) ?? [];
    },
  });

  const countryOptions = useMemo(() => {
    const countries = new Set<string>();
    programsData.forEach((program) => {
      if (program.country && matchesProgramFilters(program, { ignoreCountries: true, ignoreMinimumGrade: true })) {
        countries.add(program.country);
      }
    });
    selectedCountries.forEach((country) => countries.add(country));
    return Array.from(countries).sort((a, b) => a.localeCompare(b));
  }, [programsData, matchesProgramFilters, selectedCountries]);

  const universityOptions = useMemo(() => {
    const universities = new Set<string>();
    programsData.forEach((program) => {
      if (matchesProgramFilters(program, { ignoreUniversities: true, ignoreMinimumGrade: true })) {
        universities.add(program.universityName);
      }
    });
    selectedUniversities.forEach((university) => universities.add(university));
    return Array.from(universities).sort((a, b) => a.localeCompare(b));
  }, [programsData, matchesProgramFilters, selectedUniversities]);

  const programNameOptions = useMemo(() => {
    const names = new Set<string>();
    programsData.forEach((program) => {
      if (matchesProgramFilters(program, { ignoreProgramNames: true, ignoreMinimumGrade: true })) {
        names.add(program.name);
      }
    });
    selectedProgramNames.forEach((programName) => names.add(programName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [programsData, matchesProgramFilters, selectedProgramNames]);

  const {
    data: universityChoices = [],
    isLoading: isLoadingUniversities,
  } = useQuery<ProgramUniversityOption[]>({
    queryKey: ['program-university-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(error.message || 'Failed to load universities');
      }

      return (data ?? []).map((item) => ({ id: item.id, name: item.name }));
    },
    enabled: role === 'administrator',
    staleTime: 1000 * 60 * 5,
  });

  const resetFormValues = useCallback(
    (overrides: Partial<ProgramFormState> = {}) => {
      setFormValues({
        ...defaultFormState,
        universityId: role === 'university_official' && universityId ? universityId : '',
        ...overrides,
      });
    },
    [role, universityId]
  );

  useEffect(() => {
    if (role === 'university_official' && universityId && !formValues.universityId) {
      setFormValues((prev) => ({ ...prev, universityId }));
    }
  }, [role, universityId, formValues.universityId]);

  const canCreateProgram = role === 'administrator'
    ? Boolean(formValues.universityId)
    : Boolean(universityId);

  const addProgramMutation = useMutation({
    mutationFn: async (values: ProgramFormState) => {
      const targetUniversityId = role === 'administrator'
        ? values.universityId || null
        : universityId;

      if (!targetUniversityId) {
        throw new Error('Select a university before adding programs.');
      }

      const parsedMinimumGpa = values.minimumGpa?.trim()
        ? Number.parseFloat(values.minimumGpa)
        : null;
      const normalizedMinimumGpa = parsedMinimumGpa === null || Number.isNaN(parsedMinimumGpa)
        ? null
        : Math.max(0, Math.min(100, parsedMinimumGpa));

      return await createProgram(targetUniversityId, {
        name: values.name.trim(),
        nameLanguageCode: 'en',
        programLanguages: values.language ? [values.language] : [],
        minimumGpa: normalizedMinimumGpa,
        tuitionFee: values.tuitionFee ? Number.parseFloat(values.tuitionFee) : null,
        currency: values.currency || null,
        seats: values.seats ? Number.parseInt(values.seats, 10) : null,
        studyLevels: values.studyLevels,
        intakeDates: parseCommaSeparated(values.intakePeriods),
        applicationDeadline: values.applicationDeadline || null,
        description: values.description
          ? { text: values.description, languageCode: 'en' }
          : null,
        isActive: true,
        requiredDocuments: values.requiredDocuments 
          ? parseCommaSeparated(values.requiredDocuments) 
          : null,
        acceptanceCriteria: values.acceptanceCriteria || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programsQueryKey });
      toast({
        title: 'Program added',
        description: 'Your program is now visible to prospective students.',
      });
      resetFormValues();
      setIsDialogOpen(false);
      setDialogMode('create');
      setEditingProgram(null);
    },
    onError: (error) => {
      toast({
        title: 'Unable to add program',
        description: error instanceof Error ? error.message : 'Please review the details and try again.',
        variant: 'destructive',
      });
    },
  });

  const updateProgramMutation = useMutation({
    mutationFn: async ({ program, values }: { program: ProgramCardData; values: ProgramFormState }) => {
      const targetUniversityId = role === 'administrator'
        ? (values.universityId || program.universityId)
        : universityId;

      if (!targetUniversityId) {
        throw new Error('Select a university before saving changes.');
      }

      if (role !== 'administrator' && program.universityId !== targetUniversityId) {
        throw new Error('You can only edit programs that belong to your university.');
      }

      const parsedMinimumGpa = values.minimumGpa?.trim()
        ? Number.parseFloat(values.minimumGpa)
        : null;
      const normalizedMinimumGpa = parsedMinimumGpa === null || Number.isNaN(parsedMinimumGpa)
        ? null
        : Math.max(0, Math.min(100, parsedMinimumGpa));

      return await updateProgram(program.id, targetUniversityId, {
        name: values.name.trim(),
        nameLanguageCode: 'en',
        programLanguages: values.language ? [values.language] : [],
        minimumGpa: normalizedMinimumGpa,
        tuitionFee: values.tuitionFee ? Number.parseFloat(values.tuitionFee) : null,
        currency: values.currency || null,
        seats: values.seats ? Number.parseInt(values.seats, 10) : null,
        studyLevels: values.studyLevels,
        intakeDates: parseCommaSeparated(values.intakePeriods),
        applicationDeadline: values.applicationDeadline || null,
        description: values.description
          ? { text: values.description, languageCode: 'en' }
          : null,
        isActive: true,
        nameId: program.nameId,
        descriptionId: program.descriptionId,
        requiredDocuments: values.requiredDocuments 
          ? parseCommaSeparated(values.requiredDocuments) 
          : null,
        acceptanceCriteria: values.acceptanceCriteria || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programsQueryKey });
      toast({
        title: 'Program updated',
        description: 'Changes are now live for prospective students.',
      });
      setIsDialogOpen(false);
      setDialogMode('create');
      setEditingProgram(null);
      resetFormValues();
    },
    onError: (error) => {
      toast({
        title: 'Unable to update program',
        description: error instanceof Error ? error.message : 'Please review the details and try again.',
        variant: 'destructive',
      });
    },
  });

  const filteredPrograms = useMemo(() => {
    const filtered = programsData.filter((program) => matchesProgramFilters(program));

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tuition-low':
          return (a.tuitionFee ?? Number.POSITIVE_INFINITY) - (b.tuitionFee ?? Number.POSITIVE_INFINITY);
        case 'tuition-high':
          return (b.tuitionFee ?? Number.NEGATIVE_INFINITY) - (a.tuitionFee ?? Number.NEGATIVE_INFINITY);
        case 'deadline': {
          const aDate = a.applicationDeadline ? new Date(a.applicationDeadline).getTime() : Number.POSITIVE_INFINITY;
          const bDate = b.applicationDeadline ? new Date(b.applicationDeadline).getTime() : Number.POSITIVE_INFINITY;
          return aDate - bDate;
        }
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [programsData, matchesProgramFilters, sortBy]);

  const deleteProgramMutation = useMutation({
    mutationFn: async (program: ProgramCardData) => {
      const targetUniversityId = role === 'administrator' ? program.universityId : universityId;

      if (!targetUniversityId) {
        throw new Error('Unable to determine the university for this program.');
      }

      if (role !== 'administrator' && program.universityId !== targetUniversityId) {
        throw new Error('You can only delete programs that belong to your university.');
      }

      const { data, error } = await supabase
        .from('programs')
        .delete()
        .eq('id', program.id)
        .select('id');

      if (error) {
        throw new Error(error.message || 'Failed to delete program');
      }

      if (!data || data.length === 0) {
        throw new Error('Program not found or you lack permission to delete it.');
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: programsQueryKey });
      toast({
        title: 'Program removed',
        description: 'The program has been deleted successfully.',
      });
      setProgramPendingDeletion(null);
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Unable to delete program',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    },
  });

  const isSaving = addProgramMutation.isPending || updateProgramMutation.isPending;
  const isDeleting = deleteProgramMutation.isPending;

  const handleLevelToggle = (level: string) => {
    setFormValues((prev) => {
      const exists = prev.studyLevels.includes(level);
      const studyLevels = exists
        ? prev.studyLevels.filter((item) => item !== level)
        : [...prev.studyLevels, level];
      return { ...prev, studyLevels };
    });
  };

  const handleProgramSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.name.trim()) {
      toast({
        title: 'Program name is required',
        description: 'Please provide a name before saving the program.',
        variant: 'destructive',
      });
      return;
    }

    if (!formValues.language) {
      toast({
        title: 'Language is required',
        description: 'Select at least one instruction language.',
        variant: 'destructive',
      });
      return;
    }

    if (role === 'administrator' && !formValues.universityId) {
      toast({
        title: 'Select a university',
        description: 'Choose which university this program belongs to before saving.',
        variant: 'destructive',
      });
      return;
    }

    if (dialogMode === 'edit' && editingProgram) {
      updateProgramMutation.mutate({ program: editingProgram, values: formValues });
    } else {
      addProgramMutation.mutate(formValues);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLevels([]);
    setSelectedCountries([]);
    setSelectedUniversities([]);
    setSelectedProgramNames([]);
    setSortBy('name');
    setMinimumGradeFilter('');
  };

  const handleApplyNow = (program: ProgramCardData) => {
    setSelectedProgram(program);
    setApplicationDialogOpen(true);
  };

  const openProgramEditor = (program: ProgramCardData) => {
    setDialogMode('edit');
    setEditingProgram(program);
    setFormValues({
      name: program.name,
      language: program.languages[0] ?? '',
      minimumGpa: program.minimumGpa !== null && program.minimumGpa !== undefined
        ? String(program.minimumGpa)
        : '',
      tuitionFee: program.tuitionFee !== null && program.tuitionFee !== undefined
        ? String(program.tuitionFee)
        : '',
      currency: program.currency ?? 'USD',
      seats: program.seats !== null && program.seats !== undefined ? String(program.seats) : '',
      studyLevels: Array.isArray(program.studyLevels) ? [...program.studyLevels] : [],
      intakePeriods: program.intakeDates.length > 0 ? program.intakeDates.join(', ') : '',
      applicationDeadline: formatDateForInput(program.applicationDeadline),
      description: program.description ?? '',
      requiredDocuments: Array.isArray(program.requiredDocuments) 
        ? program.requiredDocuments.join(', ') 
        : '',
      acceptanceCriteria: program.acceptanceCriteria ?? '',
      universityId: program.universityId ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProgram = (program: ProgramCardData) => {
    setProgramPendingDeletion(program);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProgram = () => {
    if (!programPendingDeletion) return;
    deleteProgramMutation.mutate(programPendingDeletion);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Study Programs</h1>
          <p className="text-muted-foreground">
            Discover academic programs from universities worldwide
          </p>
        </div>

        {(role === 'university_official' || role === 'administrator') && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetFormValues();
                setDialogMode('create');
                setEditingProgram(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setDialogMode('create');
                  setEditingProgram(null);
                  const defaultOverrides =
                    role === 'administrator' && universityChoices.length > 0
                      ? { universityId: universityChoices[0].id }
                      : {};
                  resetFormValues(defaultOverrides);
                }}
                disabled={role === 'administrator' && universityChoices.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl sm:max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{dialogMode === 'edit' ? 'Edit Program' : 'Add Program'}</DialogTitle>
                <DialogDescription>
                  {dialogMode === 'edit'
                    ? 'Update program information to ensure students see the latest details.'
                    : 'Capture the essential details that students see in the catalog.'}
                </DialogDescription>
              </DialogHeader>

              {!canCreateProgram && (
                <Card className="border-destructive/40 bg-destructive/5">
                  <CardContent className="py-3 text-sm text-destructive">
                    {role === 'administrator'
                      ? 'Select a university before adding programs.'
                      : 'Your account must be linked to an approved university before adding programs.'}
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleProgramSubmit} className="space-y-4">
                {role === 'administrator' && (
                  <div className="space-y-2">
                    <Label htmlFor="program-university">University</Label>
                    <Select
                      value={formValues.universityId}
                      onValueChange={(value) => setFormValues((prev) => ({ ...prev, universityId: value }))}
                      disabled={isLoadingUniversities || isSaving}
                    >
                      <SelectTrigger id="program-university">
                        <SelectValue placeholder={isLoadingUniversities ? 'Loading universities…' : 'Select university'} />
                      </SelectTrigger>
                      <SelectContent>
                        {universityChoices.map((university) => (
                          <SelectItem key={university.id} value={university.id}>
                            {university.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {universityChoices.length === 0 && !isLoadingUniversities ? (
                      <p className="text-xs text-muted-foreground">
                        Add a university record before creating programs.
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="program-name">Program name</Label>
                  <Input
                    id="program-name"
                    placeholder="e.g. Bachelor of Computer Science"
                    value={formValues.name}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="program-language">Primary language</Label>
                    <Select
                      value={formValues.language}
                      onValueChange={(value) => setFormValues((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger id="program-language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageOptions.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="program-currency">Currency</Label>
                    <Select
                      value={formValues.currency}
                      onValueChange={(value) => setFormValues((prev) => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger id="program-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="program-gpa">Minimum Grade (out of 100)</Label>
                    <Input
                      id="program-gpa"
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      placeholder="e.g. 70"
                      value={formValues.minimumGpa}
                      onChange={(event) => {
                        const raw = event.target.value;
                        if (raw === '') {
                          setFormValues((prev) => ({ ...prev, minimumGpa: '' }));
                          return;
                        }
                        const parsed = Number.parseFloat(raw);
                        if (Number.isNaN(parsed)) return;
                        const clamped = Math.max(0, Math.min(100, parsed));
                        setFormValues((prev) => ({ ...prev, minimumGpa: clamped.toString() }));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Convert other grading scales to their percentage equivalent out of 100 before saving.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program-tuition">Tuition fee (annual)</Label>
                    <Input
                      id="program-tuition"
                      type="number"
                      min="0"
                      step="100"
                      placeholder="e.g. 12000"
                      value={formValues.tuitionFee}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, tuitionFee: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-seats">Available seats</Label>
                  <Input
                    id="program-seats"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 50"
                    value={formValues.seats}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, seats: event.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    This stays internal and is only visible to your team.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Study levels</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {studyLevelOptions.map((level) => (
                      <label key={level} className="flex items-center space-x-2 rounded-md border border-border bg-muted/30 p-2">
                        <Checkbox
                          checked={formValues.studyLevels.includes(level)}
                          onCheckedChange={(checked) => {
                            if (checked === 'indeterminate') return;
                            handleLevelToggle(level);
                          }}
                        />
                        <span className="text-sm">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="program-intakes">Intake periods</Label>
                    <Input
                      id="program-intakes"
                      placeholder="e.g. Fall, Spring"
                      value={formValues.intakePeriods}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, intakePeriods: event.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Separate multiple intakes with commas.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="program-deadline">Application deadline</Label>
                    <Input
                      id="program-deadline"
                      type="date"
                      value={formValues.applicationDeadline}
                      onChange={(event) => setFormValues((prev) => ({ ...prev, applicationDeadline: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-description">Short description</Label>
                  <Textarea
                    id="program-description"
                    placeholder="Highlight what makes this program unique"
                    value={formValues.description}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-acceptance">Acceptance criteria</Label>
                  <Textarea
                    id="program-acceptance"
                    placeholder="Describe the requirements for admission (e.g., minimum GPA, language proficiency, etc.)"
                    value={formValues.acceptanceCriteria}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, acceptanceCriteria: event.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program-documents">Required documents</Label>
                  <Textarea
                    id="program-documents"
                    placeholder="e.g. Transcript, Diploma, Language Test Results, Passport Copy"
                    value={formValues.requiredDocuments}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, requiredDocuments: event.target.value }))}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple documents with commas.
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={!canCreateProgram || isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {dialogMode === 'edit' ? 'Updating…' : 'Saving...'}
                      </>
                    ) : (
                      dialogMode === 'edit' ? 'Update program' : 'Save program'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search programs, universities, or fields..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <FilterMultiSelect
                placeholder="All study levels"
                options={studyLevelOptions}
                selected={selectedLevels}
                onChange={setSelectedLevels}
              />

              <FilterMultiSelect
                placeholder="All countries"
                options={countryOptions}
                selected={selectedCountries}
                onChange={setSelectedCountries}
              />

              <FilterMultiSelect
                placeholder="All universities"
                options={universityOptions}
                selected={selectedUniversities}
                onChange={setSelectedUniversities}
              />

              <FilterMultiSelect
                placeholder="All programs"
                options={programNameOptions}
                selected={selectedProgramNames}
                onChange={setSelectedProgramNames}
              />

              <div className="space-y-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  placeholder="Min grade ≥"
                  value={minimumGradeFilter}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === '') {
                      setMinimumGradeFilter('');
                      return;
                    }
                    const parsed = Number.parseFloat(raw);
                    if (Number.isNaN(parsed)) return;
                    const clamped = Math.max(0, Math.min(100, parsed));
                    setMinimumGradeFilter(String(clamped));
                  }}
                />
                <p className="text-xs text-muted-foreground">Show programs requiring at least this grade.</p>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Program name</SelectItem>
                  <SelectItem value="tuition-low">Tuition (low to high)</SelectItem>
                  <SelectItem value="tuition-high">Tuition (high to low)</SelectItem>
                  <SelectItem value="deadline">Application deadline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {programsError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            {programsError.message}
          </CardContent>
        </Card>
      )}

      {isProgramsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-2 text-lg font-semibold">No programs match your filters yet.</p>
            <p className="text-sm">
                Adjust your search criteria or
                {role === 'university_official' || role === 'administrator'
                  ? ' add a new program to get started.'
                  : ' check back soon for new additions.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredPrograms.map((program) => {
            const tuitionLabel = formatTuition(program.tuitionFee, program.currency) ?? 'Contact for pricing';
            const deadlineLabel = formatDeadline(program.applicationDeadline);
            const primaryLevel = program.studyLevels[0] ?? 'Program';
            const canManageProgramCard =
              role === 'administrator' || (universityId && universityId === program.universityId);

            return (
              <Card key={program.id} className="hover:shadow-soft transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{program.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center space-x-2">
                        <span>{program.universityName}</span>
                        {program.country && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{program.country}</span>
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{primaryLevel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {program.description && (
                    <p className="text-sm text-muted-foreground">{program.description}</p>
                  )}

                  {program.studyLevels.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {program.studyLevels.slice(1).map((level) => (
                        <Badge key={level} variant="outline" className="text-xs">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Minimum Grade (out of 100)</p>
                        <p className="font-semibold">{program.minimumGpa ?? 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Tuition</p>
                        <p className="font-semibold">{tuitionLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Application deadline: {deadlineLabel}</span>
                    </div>

                    {program.intakeDates.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {program.intakeDates.map((intake) => (
                          <Badge key={intake} variant="outline" className="text-xs">
                            {intake} intake
                          </Badge>
                        ))}
                      </div>
                    )}

                    {program.languages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {program.languages.map((language) => (
                          <Badge key={language} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {canManageProgramCard && (
                      <p className="text-xs text-muted-foreground">
                        Seats available: {program.seats ?? 'Not set'}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:space-x-2">
                    {canManageProgramCard ? (
                      <>
                        <Button
                          className="flex-1"
                          type="button"
                          variant="outline"
                          onClick={() => openProgramEditor(program)}
                          disabled={isDeleting}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleDeleteProgram(program)}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          {isDeleting ? 'Deleting…' : 'Delete'}
                        </Button>
                      </>
                    ) : (
                      <Button className="flex-1" onClick={() => handleApplyNow(program)}>
                        Apply now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleteProgramMutation.isPending) {
            setDeleteDialogOpen(false);
            setProgramPendingDeletion(null);
          } else if (open) {
            setDeleteDialogOpen(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete program</AlertDialogTitle>
            <AlertDialogDescription>
              {programPendingDeletion
                ? `Are you sure you want to delete "${programPendingDeletion.name}"? This action cannot be undone.`
                : 'Are you sure you want to delete this program?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProgramMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteProgramMutation.isPending}
              onClick={(event) => {
                event.preventDefault();
                confirmDeleteProgram();
              }}
            >
              {deleteProgramMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        completionPercentage={completionPercentage}
        action="apply"
      />

      {selectedProgram && (
        <ApplicationDialog
          open={applicationDialogOpen}
          onOpenChange={setApplicationDialogOpen}
          programId={selectedProgram.id}
          programName={selectedProgram.name}
          universityName={selectedProgram.universityName}
          requiredDocuments={selectedProgram.requiredDocuments}
          acceptanceCriteria={selectedProgram.acceptanceCriteria}
        />
      )}
    </div>
  );
};

export default Programs;
