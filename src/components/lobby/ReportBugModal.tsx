import { useState } from 'react'
import { playClick } from '../../utils/sounds'
import { useProfileStore } from '../../stores/profileStore'
import { useLanguageStore } from '../../stores/languageStore'

interface ReportBugModalProps {
  onClose: () => void
}

export default function ReportBugModal({ onClose }: ReportBugModalProps) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { name } = useProfileStore()
  const { t } = useLanguageStore()

  async function handleSubmit() {
    playClick()
    if (!description.trim()) {
      setError('Please describe the bug first.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const accessKey = import.meta.env.VITE_WEB3FORMS_KEY
      if (!accessKey) {
        throw new Error('Web3Forms Access Key is missing in .env')
      }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: 'New Bug Report - Kallanum Policeum',
          from_name: name || 'Anonymous Player',
          message: description.trim(),
        })
      })

      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.message || 'Failed to submit report')
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      {/* Container matching the golden rustic theme */}
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decorative Crown */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30">
          <svg width="40" height="28" viewBox="0 0 48 36" fill="none">
            <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" fill="url(#crownBug)" stroke="#5a3e15" strokeWidth="1" />
            <circle cx="24" cy="4" r="2.5" fill="#ff6b6b" stroke="#8b0000" strokeWidth="0.5" />
            <defs>
              <linearGradient id="crownBug" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe58f" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#8a6b20" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="rounded-[16px] p-[2px]" style={{ background: 'linear-gradient(145deg, #d4af37, #593d19, #8a6b20)' }}>
          <div className="rounded-[14px] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #1a0f08 0%, #0d0704 100%)' }}>
            
            <div className="absolute inset-0 pointer-events-none" style={{
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)'
            }} />

            <div className="relative z-10 px-6 pt-10 pb-6 flex flex-col items-center">
              
              <h2 className="font-serif font-black text-center uppercase tracking-widest mb-2 text-xl" style={{
                background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {t.bugReport.title}
              </h2>
              <p className="text-xs text-[#c89f59] text-center font-serif tracking-wider mb-6 opacity-80">
                {t.bugReport.subtitle}
              </p>

              {success ? (
                <div className="w-full py-8 flex flex-col items-center justify-center animate-in fade-in">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <p className="text-green-400 font-serif font-bold text-lg">{t.bugReport.success}</p>
                  <p className="text-green-400/70 text-sm mt-1">{t.bugReport.successSub}</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  
                  <div className="relative rounded-lg overflow-hidden" style={{
                    boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9), 0 1px 0 rgba(200,159,89,0.1)',
                  }}>
                    <textarea
                      placeholder={t.bugReport.placeholder}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full p-4 bg-transparent text-[#ffe58f] placeholder-[#5a4229] font-serif text-sm focus:outline-none transition-all resize-none"
                      style={{ background: 'linear-gradient(180deg, rgba(10,6,3,0.95) 0%, rgba(20,12,7,0.9) 100%)', border: '1px solid rgba(90,66,41,0.5)' }}
                      onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.6)' }}
                      onBlur={(e) => { e.target.style.borderColor = 'rgba(90,66,41,0.5)' }}
                    />
                  </div>

                  {error && (
                    <div className="px-4 py-2 rounded text-center font-serif text-xs font-bold text-[#ff6b6b]" style={{
                      background: 'rgba(80,20,20,0.6)', border: '1px solid rgba(180,60,60,0.3)'
                    }}>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { playClick(); onClose() }}
                      disabled={loading}
                      className="flex-1 py-3 text-center font-serif font-bold uppercase tracking-wider text-xs rounded-lg active:scale-95 transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(180deg, rgba(60,42,26,0.9) 0%, rgba(30,20,10,0.9) 100%)',
                        border: '1px solid rgba(90,66,41,0.4)',
                        color: '#c89f59',
                      }}
                    >
                      {t.common.cancel}
                    </button>

                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 py-3 text-center font-serif font-black uppercase tracking-wider text-xs rounded-lg active:scale-95 transition-all disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(180deg, #c9a033 0%, #7a5a18 100%)',
                        color: '#fff8e1',
                        boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), 0 4px 10px rgba(0,0,0,0.5)'
                      }}
                    >
                      {loading ? t.bugReport.submitting : t.bugReport.submit}
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
