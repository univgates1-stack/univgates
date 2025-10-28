import { useState, useEffect, useMemo } from 'react';
import { Country as CSCountry } from 'country-state-city';
import { supabase } from '@/integrations/supabase/client';

export interface CountryOption {
  id: string;
  name: string;
  code: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

const buildFallbackCountries = (): CountryOption[] => {
  const fallback = CSCountry.getAllCountries().map((country) => ({
    id: country.isoCode,
    name: country.name,
    code: country.isoCode,
  }));

  return fallback.sort((a, b) => a.name.localeCompare(b.name));
};

export const useCountries = () => {
  const [countries, setCountries] = useState<CountryOption[]>(() => buildFallbackCountries());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fallbackMap = new Map<string, CountryOption>();
    countries.forEach((country) => {
      fallbackMap.set(normalize(country.name), country);
    });

    const fetchCountries = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('countries')
          .select('id, name')
          .order('name');

        if (queryError) {
          throw queryError;
        }

        const merged = new Map<string, CountryOption>(fallbackMap);

        (data ?? []).forEach((record) => {
          if (!record?.name) return;
          const name = record.name.trim();
          if (!name) return;

          const key = normalize(name);
          const fallbackCountry = fallbackMap.get(key);

          if (fallbackCountry) {
            merged.set(key, {
              ...fallbackCountry,
              id: record.id ?? fallbackCountry.id,
            });
          } else {
            merged.set(key, {
              id: record.id ?? name,
              name,
              code: name,
            });
          }
        });

        const mergedCountries = Array.from(merged.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        if (!cancelled) {
          setCountries(mergedCountries);
          setError(null);
        }
      } catch (fetchError: any) {
        console.error('Error fetching countries:', fetchError);
        if (!cancelled) {
          setCountries(buildFallbackCountries());
          setError(fetchError?.message ?? 'Failed to load countries');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  const memoizedCountries = useMemo(
    () => countries.map((country) => ({ ...country })),
    [countries]
  );

  return { countries: memoizedCountries, loading, error };
};
