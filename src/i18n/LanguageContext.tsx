import React, { createContext, useContext, useState } from 'react';
import { Language, translations, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  defaultCurrency: 'BRL' | 'USD';
  setDefaultCurrency: (currency: 'BRL' | 'USD') => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'discoteca_language';
const CURRENCY_STORAGE_KEY = 'discoteca_currency';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (saved === 'pt-BR' || saved === 'en') return saved;
    // Detect browser language
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('pt')) {
      return 'pt-BR';
    }
    return 'pt-BR'; // Default to Brazilian Portuguese as requested
  });
  const [defaultCurrency, setDefaultCurrencyState] = useState<'BRL' | 'USD'>(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved === 'BRL' || saved === 'USD') return saved;
    return navigator.language?.startsWith('pt') ? 'BRL' : 'USD';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const setDefaultCurrency = (currency: 'BRL' | 'USD') => {
    setDefaultCurrencyState(currency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  };

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, defaultCurrency, setDefaultCurrency, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
