import { useLanguageStore } from '../../stores/languageStore'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguageStore()

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
      className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#5a3e15]/60 hover:bg-black/80 transition-all shadow-lg active:scale-95"
      aria-label="Toggle Language"
    >
      <svg className="w-4 h-4 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
      <span className="text-[#ffe58f] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
        <span className="opacity-60 text-[10px] hidden sm:inline">Language:</span>
        {language === 'en' ? 'English' : 'മലയാളം'}
      </span>
    </button>
  )
}
