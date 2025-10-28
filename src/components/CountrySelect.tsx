import { useMemo } from 'react';
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

const normalize = (value: string) => value.trim().toLowerCase();

export const CountrySelect = ({
  value,
  onValueChange,
  placeholder = 'Select a country',
  disabled = false,
  required = false,
}: CountrySelectProps) => {
  const { countries, loading, error } = useCountries();

  const countriesWithFallback = useMemo(() => {
    if (!value) {
      return countries;
    }

    const normalizedValue = normalize(value);
    const exists = countries.some(
      (country) =>
        country.code.toLowerCase() === normalizedValue ||
        country.name.toLowerCase() === normalizedValue
    );

    if (exists) {
      return countries;
    }

    return [
      ...countries,
      {
        id: value,
        name: value,
        code: value,
      },
    ];
  }, [countries, value]);

  const selectedCode = useMemo(() => {
    if (!value) return undefined;

    const normalizedValue = normalize(value);
    const byCode = countriesWithFallback.find(
      (country) => country.code.toLowerCase() === normalizedValue
    );
    if (byCode) return byCode.code;

    const byName = countriesWithFallback.find(
      (country) => country.name.toLowerCase() === normalizedValue
    );
    return byName?.code;
  }, [countriesWithFallback, value]);

  const handleChange = (code: string) => {
    const selected = countriesWithFallback.find((country) => country.code === code);
    onValueChange(selected?.name ?? code);
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      value={selectedCode}
      onValueChange={handleChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {countriesWithFallback.map((country) => (
          <SelectItem key={`${country.code}-${country.id}`} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
