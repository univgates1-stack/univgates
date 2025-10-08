import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Country {
  id: string;
  name: string;
  description_en?: string;
  description_ar?: string;
  description_tr?: string;
}

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('*')
          .order('name');

        if (error) throw error;

        setCountries(data || []);
      } catch (err: any) {
        console.error('Error fetching countries:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
};