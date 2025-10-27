import { Country } from 'country-state-city';
import { supabase } from '@/integrations/supabase/client';

/**
 * Looks up a country ID by name, trying exact match first, then partial match
 */
export const getCountryId = async (countryIdentifier: string): Promise<string | null> => {
  try {
    if (!countryIdentifier) return null;

    const possibleCountry = resolveCountryByIdentifier(countryIdentifier);
    const lookupName = possibleCountry?.name ?? countryIdentifier;

    // Try exact match first
    const { data } = await supabase
      .from('countries')
      .select('id')
      .eq('name', lookupName)
      .maybeSingle();

    if (data?.id) {
      return data.id;
    }

    // Try partial match if exact match fails
    const partialResult = await supabase
      .from('countries')
      .select('id')
      .ilike('name', `%${lookupName}%`)
      .maybeSingle();

    return partialResult.data?.id || null;
  } catch (error) {
    console.error('Error looking up country:', error);
    return null;
  }
};

/**
 * Ensures that common countries exist in the database
 */
export const ensureCountriesExist = async () => {
  const commonCountries = [
    'Turkey',
    'United States',
    'USA',
    'Germany', 
    'France',
    'United Kingdom',
    'Canada'
  ];

  try {
    for (const country of commonCountries) {
      const { error } = await supabase
        .from('countries')
        .upsert({ name: country }, { onConflict: 'name' });
      
      if (error) {
        console.error(`Error upserting country ${country}:`, error);
      }
    }
  } catch (error) {
    console.error('Error ensuring countries exist:', error);
  }
};

export async function getOrCreateCountryId(countryIdentifier: string): Promise<string> {
  try {
    const countryData = resolveCountryByIdentifier(countryIdentifier);
    const targetName = countryData?.name ?? countryIdentifier;

    const { data: existingCountry, error: findError } = await supabase
      .from('countries')
      .select('id')
      .eq('name', targetName)
      .maybeSingle();

    if (findError) {
      console.error('Error finding country:', findError);
      throw findError;
    }

    if (existingCountry?.id) {
      return existingCountry.id;
    }

    const { data: newCountry, error: insertError } = await supabase
      .from('countries')
      .insert({
        name: targetName,
        description_en: targetName,
        description_tr: null,
        description_ar: null
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting country:', insertError);
      throw insertError;
    }

    return newCountry.id;
  } catch (error) {
    console.error('Error in getOrCreateCountryId:', error);
    throw error;
  }
}

export async function getOrCreateCityId(
  countryId: string,
  cityName: string,
  region?: string
): Promise<string | null> {
  const normalizedName = cityName?.trim();
  if (!countryId || !normalizedName) {
    throw new Error('City name and country are required');
  }

  try {
    const { data: existingCity, error: findError } = await supabase
      .from('cities')
      .select('id')
      .eq('country_id', countryId)
      .ilike('name', normalizedName)
      .maybeSingle();

    if (findError) {
      console.error('Error finding city:', findError);
      throw findError;
    }

    if (existingCity?.id) {
      return existingCity.id;
    }

    const { data: newCity, error: insertError } = await supabase
      .from('cities')
      .insert({
        name: normalizedName,
        country_id: countryId,
        region: region?.trim() || null,
      })
      .select('id')
      .single();

    if (insertError) {
      const insertCode = (insertError as { code?: string }).code;
      const insertMessage = (insertError as { message?: string }).message;
      if (insertCode === '42501' || insertMessage?.toLowerCase().includes('permission denied')) {
        // RLS prevents city creation for this client; fall back to plain string without logging an error
        return null;
      }
      console.error('Error inserting city:', insertError);
      throw insertError;
    }

    return newCity.id;
  } catch (error) {
    console.error('Error in getOrCreateCityId:', error);
    return null;
  }
}

function resolveCountryByIdentifier(countryIdentifier: string) {
  const trimmed = countryIdentifier.trim();
  if (trimmed.length <= 3) {
    return Country.getCountryByCode(trimmed);
  }

  return Country.getAllCountries().find(
    (country) => country.name.toLowerCase() === trimmed.toLowerCase()
  );
}
