import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { en } from '../i18n/en'
import { ml } from '../i18n/ml'

type Language = 'en' | 'ml'
type Dictionary = typeof en

interface LanguageState {
  language: Language
  setLanguage: (lang: Language) => void
  t: Dictionary
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      t: en,
      setLanguage: (lang) => set({ language: lang, t: lang === 'en' ? en : ml }),
    }),
    {
      name: 'kallanum-language-storage',
      // Only persist the language key, not the whole dictionary to save space
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        // When hydrating, make sure we also update the dictionary reference
        if (state) {
          state.t = state.language === 'en' ? en : ml
        }
      }
    }
  )
)
