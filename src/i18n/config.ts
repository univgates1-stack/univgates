import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

type TranslationRecord = Record<string, unknown>;

const localeModules = import.meta.glob('../locales/**/*.json', {
  eager: true,
}) as Record<string, { default: TranslationRecord } | TranslationRecord>;

const isRecord = (value: unknown): value is TranslationRecord => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const mergeDeep = (target: TranslationRecord, source: TranslationRecord): TranslationRecord => {
  const output: TranslationRecord = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (isRecord(value)) {
      const existing = isRecord(output[key]) ? output[key] as TranslationRecord : {};
      output[key] = mergeDeep(existing, value);
    } else {
      output[key] = value;
    }
  });

  return output;
};

const buildResources = () => {
  const resources: Record<string, { translation: TranslationRecord }> = {};

  Object.entries(localeModules).forEach(([path, module]) => {
    const match = path.match(/\.\.\/locales\/([^/]+)\/.*\.json$/);
    if (!match) return;

    const language = match[1];
    const payload = ('default' in module ? module.default : module) as TranslationRecord;

    if (!resources[language]) {
      resources[language] = { translation: {} };
    }

    resources[language].translation = mergeDeep(resources[language].translation, payload);
  });

  return resources;
};

const resources = buildResources();
const fallbackLng = resources.en ? 'en' : Object.keys(resources)[0] ?? 'en';

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: fallbackLng,
    fallbackLng,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export default i18n;
