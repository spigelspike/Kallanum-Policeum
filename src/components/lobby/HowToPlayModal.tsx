import { playClick } from '../../utils/sounds'
import { useLanguageStore } from '../../stores/languageStore'

interface HowToPlayModalProps {
  onClose: () => void
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const { t } = useLanguageStore()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
      
      {/* === THE PLATE === */}
      <div className="w-full max-w-[500px] relative" style={{ animation: 'plateReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
        
        {/* ── Crown on top ── */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
            <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" fill="url(#crownGoldHTP)" stroke="#5a3e15" strokeWidth="1"/>
            <circle cx="24" cy="4" r="2.5" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <circle cx="13" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <circle cx="35" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <rect x="14" y="20" width="20" height="4" rx="1" fill="url(#crownGoldHTP)" stroke="#5a3e15" strokeWidth="0.5"/>
            <defs>
              <linearGradient id="crownGoldHTP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe58f"/>
                <stop offset="50%" stopColor="#d4af37"/>
                <stop offset="100%" stopColor="#8a6b20"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Layer 1: Outermost dark frame ── */}
        <div className="rounded-[22px] p-[3px]" style={{ background: 'linear-gradient(145deg, #2a1a0a, #0d0805, #2a1a0a)' }}>
          {/* ── Layer 2: Golden metallic rim ── */}
          <div className="rounded-[19px] p-[4px]" style={{ background: 'linear-gradient(160deg, #d4af37 0%, #a67c00 20%, #593d19 40%, #a67c00 60%, #d4af37 80%, #8a6b20 100%)' }}>
            {/* ── Layer 3: Inner dark edge ── */}
            <div className="rounded-[15px] p-[2px]" style={{ background: 'linear-gradient(145deg, #1a1008, #0a0604)' }}>
              {/* ── Layer 4: Inner golden trim ── */}
              <div className="rounded-[13px] p-[1px]" style={{ background: 'linear-gradient(160deg, #c89f59 0%, #5a4229 30%, #c89f59 60%, #5a4229 100%)' }}>
                {/* ── Layer 5: The main card body ── */}
                <div className="rounded-[12px] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #2c1a0e 0%, #1a0f08 30%, #140b06 70%, #0d0704 100%)' }}>

                  {/* Leather texture simulation */}
                  <div className="absolute inset-0 pointer-events-none opacity-60" style={{
                    background: `
                      radial-gradient(ellipse at 30% 20%, rgba(139,90,43,0.25) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, rgba(139,90,43,0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, rgba(90,55,20,0.3) 0%, transparent 70%)
                    `
                  }} />

                  {/* Warm vignette */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    boxShadow: 'inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.5)'
                  }} />

                  {/* Decorative inner filigree border */}
                  <div className="absolute inset-[14px] pointer-events-none rounded-lg" style={{
                    border: '1px solid rgba(200,159,89,0.2)',
                  }}>
                    {/* Corners */}
                    <svg className="absolute -top-[6px] -left-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 18 C2 10, 10 2, 18 2" /><path d="M6 18 C6 12, 12 6, 18 6" /></svg>
                    <svg className="absolute -top-[6px] -right-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M18 18 C18 10, 10 2, 2 2" /><path d="M14 18 C14 12, 8 6, 2 6" /></svg>
                    <svg className="absolute -bottom-[6px] -left-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 2 C2 10, 10 18, 18 18" /><path d="M6 2 C6 8, 12 14, 18 14" /></svg>
                    <svg className="absolute -bottom-[6px] -right-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M18 2 C18 10, 10 18, 2 18" /><path d="M14 2 C14 8, 8 14, 2 14" /></svg>
                  </div>

                  {/* ════ CONTENT ════ */}
                  <div className="relative z-10 px-6 sm:px-8 pt-10 pb-6 flex flex-col items-center max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#c89f59]/30 scrollbar-track-transparent">

                    <h2 className="font-serif font-black text-center uppercase leading-[1.1] tracking-wider mb-6" style={{
                      fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                      background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 40%, #b8860b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
                    }}>
                      {t.rules.title}
                    </h2>

                    <div className="space-y-6 w-full text-center">

                      {/* Goal Section */}
                      <div>
                        <SectionLabel text={t.rules.theGoal} />
                        <div className="font-serif text-sm text-[#ffe58f] leading-relaxed opacity-90 px-2 space-y-2">
                          <p>{(t.rules.goalDesc as any).main || t.rules.goalDesc}</p>
                          {(t.rules.goalDesc as any).sub && <p>{(t.rules.goalDesc as any).sub}</p>}
                        </div>
                      </div>

                      {/* Roles Section */}
                      <div>
                        <SectionLabel text={t.rules.theRoles} />
                        
                        <div className="space-y-4 mt-4">
                          
                          {/* Police Role */}
                          <div className="flex items-start gap-4 p-3 rounded-lg bg-[#0d0704]/60 border border-[#3b82f6]/30">
                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-900/40 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                              <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                              </svg>
                            </div>
                            <div className="text-left flex-1">
                              <h3 className="font-serif font-bold text-blue-400 text-base uppercase tracking-widest mb-1">{t.roles.police}</h3>
                              <p className="font-serif text-xs text-blue-200/80 leading-relaxed">{t.rules.policeDesc}</p>
                            </div>
                          </div>

                          {/* Thief Role */}
                          <div className="flex items-start gap-4 p-3 rounded-lg bg-[#0d0704]/60 border border-[#ef4444]/30">
                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-red-900/40 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                              <svg className="w-6 h-6 text-red-400" viewBox="0 0 40 28" fill="currentColor">
                                <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z"/>
                                <circle cx="15" cy="11" r="2.5" fill="#0d0704"/>
                                <circle cx="25" cy="11" r="2.5" fill="#0d0704"/>
                              </svg>
                            </div>
                            <div className="text-left flex-1">
                              <h3 className="font-serif font-bold text-red-400 text-base uppercase tracking-widest mb-1">{t.roles.thief}</h3>
                              <p className="font-serif text-xs text-red-200/80 leading-relaxed">{t.rules.thiefDesc}</p>
                            </div>
                          </div>

                          {/* Civilian Role */}
                          <div className="flex items-start gap-4 p-3 rounded-lg bg-[#0d0704]/60 border border-[#c89f59]/30">
                            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-amber-900/40 border border-amber-500/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                              <svg className="w-6 h-6 text-[#c89f59]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            </div>
                            <div className="text-left flex-1">
                              <h3 className="font-serif font-bold text-[#c89f59] text-base uppercase tracking-widest mb-1">{t.rules.civilianRole}</h3>
                              <p className="font-serif text-xs text-[#c89f59]/80 leading-relaxed">{t.rules.civilianDesc}</p>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ── Close Button ── */}
                  <div className="relative z-10 px-6 pb-6 pt-2 bg-gradient-to-t from-[#0d0704] via-[#0d0704]/80 to-transparent">
                    <button onClick={() => { playClick(); onClose(); }}
                      className="w-full relative group rounded-lg active:scale-95 transition-all focus:outline-none"
                    >
                      <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                        background: 'linear-gradient(180deg, #ffe58f, #a67c00)',
                      }} />
                      <div className="relative rounded-lg py-3 flex items-center justify-center" style={{
                        background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
                        boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.7)',
                      }}>
                        <span className="font-serif font-black text-sm tracking-[0.2em] uppercase" style={{
                          background: 'linear-gradient(180deg, #fff8e1, #ffe58f, #d4af37)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
                        }}>
                          {t.common.close}
                        </span>
                      </div>
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes plateReveal {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3 w-full px-2">
      <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,159,89,0.4))' }} />
      <span className="font-serif font-bold text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#c89f59] whitespace-nowrap drop-shadow-md">
        {text}
      </span>
      <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(200,159,89,0.4), transparent)' }} />
    </div>
  )
}
