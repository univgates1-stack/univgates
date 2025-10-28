import { Country } from 'country-state-city';

const turkishMatches = new Set([
  'tr',
  'turkey',
  'türkiye',
  'republic of turkey',
  'turkiye',
]);

export const isTurkishNationality = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const normalized = trimmed.toLowerCase();
  if (turkishMatches.has(normalized)) {
    return true;
  }

  const isoCandidate = trimmed.toUpperCase();
  const countryByCode = Country.getCountryByCode(isoCandidate);
  return countryByCode?.isoCode === 'TR';
};
