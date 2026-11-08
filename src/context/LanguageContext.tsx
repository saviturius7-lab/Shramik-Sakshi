import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../types';
import { TRANSLATIONS, TranslationDictionary } from '../i18n/translations';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'shramik_sakshi_lang_pref';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
      if (saved && ['en', 'kn', 'te', 'ta', 'ml', 'hi'].includes(saved)) {
        return saved;
      }
    } catch (e) {
      // Ignored
    }
    // Default to English ("overall however should be english until specific language is selected")
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      // Ignored
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
