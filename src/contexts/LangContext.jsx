import { createContext, useContext, useState } from 'react'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('adminLang') || 'fr')

  const setLang = (l) => {
    localStorage.setItem('adminLang', l)
    setLangState(l)
  }

  // t(french, arabic) — returns the string for the current language
  const t = (fr, ar) => lang === 'ar' ? ar : fr

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
