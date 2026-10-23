import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from '../locales/translations';

const STORAGE_KEY = 'app_language';

export const LanguageContext = createContext({
  language: 'vi',
  changeLanguage: () => {},
  t: (key, fallback) => fallback || key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'vi') {
        return stored;
      }
    }
    return 'vi';
  });

  const changeLanguage = useCallback((newLang) => {
    const validLang = newLang === 'en' ? 'en' : 'vi';
    setLanguage(validLang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, validLang);
      document.documentElement.lang = validLang;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = useCallback((key, fallback) => {
    const langDict = translations[language] || translations.vi;
    return langDict[key] ?? fallback ?? key;
  }, [language]);

  const value = {
    language,
    changeLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
