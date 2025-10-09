import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCountries } from '@/hooks/useCountries';
import { Loader2 } from 'lucide-react';

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export const CountrySelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Select a country", 
  disabled = false,
  required = false 
}: CountrySelectProps) => {
  const { countries, loading, error } = useCountries();

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading countries...
          </div>
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Error loading countries" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select 
      value={value} 
      onValueChange={onValueChange} 
      disabled={disabled}
      required={required}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {countries.map((country) => (
          <SelectItem key={country.id} value={country.name}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};