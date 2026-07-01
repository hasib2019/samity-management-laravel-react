import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en/common.json';
import bn from './bn/common.json';

export const STORAGE_KEY = 'app_language';
export const SUPPORTED_LANGUAGES = ['en', 'bn'];

const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { common: en },
            bn: { common: bn },
        },
        lng: SUPPORTED_LANGUAGES.includes(storedLanguage) ? storedLanguage : 'bn',
        fallbackLng: 'bn',
        defaultNS: 'common',
        interpolation: { escapeValue: false },
    });

// Central place to change language so localStorage always stays in sync with
// i18next state (axios reads this on every request via api/axios.js).
export const setAppLanguage = (lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, lang);
    }
};

export default i18n;
