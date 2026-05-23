import { useState } from 'react'
import { useProfileStore } from '../../stores/profileStore'
import { avatarUrlToKey } from '../../utils/avatarMap'
import { playClick } from '../../utils/sounds'
import { useLanguageStore } from '../../stores/languageStore'
import male1 from '../../assets/avatar/male1.webp'
import male2 from '../../assets/avatar/male2.webp'
import male3 from '../../assets/avatar/male3.webp'
import female1 from '../../assets/avatar/female1.webp'
import female2 from '../../assets/avatar/female2.webp'
import female3 from '../../assets/avatar/female3.webp'

const AVATARS = {
  male: [male1, male2, male3],
  female: [female1, female2, female3],
}

export default function CreateProfileModal({ onClose }: { onClose?: () => void }) {
  const { name: storedName, gender: storedGender, avatar: storedAvatar, setProfile } = useProfileStore()
  const { t } = useLanguageStore()

  const [name, setName] = useState(storedName || '')
  const [gender, setGender] = useState<'male' | 'female' | null>(storedGender || null)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(storedAvatar || null)
  const [error, setError] = useState<string | null>(null)

  const handleGenderSelect = (g: 'male' | 'female') => {
    playClick()
    setGender(g)
    setSelectedAvatar(null)
  }

  const handleSave = () => {
    playClick()
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Please enter your name.'); return }
    if (trimmedName.length > 20) { setError('Name must be 20 characters or less.'); return }
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmedName)) { setError('Only letters, numbers, and spaces.'); return }
    if (!gender) { setError('Please select your gender.'); return }
    if (!selectedAvatar) { setError('Please choose an avatar.'); return }
    const key = avatarUrlToKey(selectedAvatar) || 'male1'
    setProfile(trimmedName, gender, selectedAvatar, key)
    if (onClose) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">

      {/* === THE PLATE === */}
      <div className="w-full max-w-[440px] relative" style={{ animation: 'plateReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>

        {/* ── Crown on top ── */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
            <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" fill="url(#crownGold)" stroke="#5a3e15" strokeWidth="1"/>
            <circle cx="24" cy="4" r="2.5" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <circle cx="13" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <circle cx="35" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <rect x="14" y="20" width="20" height="4" rx="1" fill="url(#crownGold)" stroke="#5a3e15" strokeWidth="0.5"/>
            <defs>
              <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
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

                  {/* Leather texture simulation with layered radials */}
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
                    {/* Corner scrollwork - SVG filigree */}
                    {/* Top-left */}
                    <svg className="absolute -top-[6px] -left-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M2 18 C2 10, 10 2, 18 2" /><path d="M6 18 C6 12, 12 6, 18 6" />
                    </svg>
                    {/* Top-right */}
                    <svg className="absolute -top-[6px] -right-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M18 18 C18 10, 10 2, 2 2" /><path d="M14 18 C14 12, 8 6, 2 6" />
                    </svg>
                    {/* Bottom-left */}
                    <svg className="absolute -bottom-[6px] -left-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M2 2 C2 10, 10 18, 18 18" /><path d="M6 2 C6 8, 12 14, 18 14" />
                    </svg>
                    {/* Bottom-right */}
                    <svg className="absolute -bottom-[6px] -right-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M18 2 C18 10, 10 18, 2 18" /><path d="M14 2 C14 8, 8 14, 2 14" />
                    </svg>
                  </div>

                  {/* ════ CONTENT ════ */}
                  <div className="relative z-10 px-8 pt-10 pb-6 flex flex-col items-center">

                    {/* Title */}
                    <h2 className="font-serif font-black text-center uppercase leading-[1.1] tracking-wider mb-8" style={{
                      fontSize: 'clamp(1.8rem, 6vw, 2.4rem)',
                      background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 40%, #b8860b 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
                    }}>
                      {onClose ? "Edit Profile" : (t.profile.title.split(' ')[0] + '\n' + t.profile.title.split(' ').slice(1).join(' '))}
                    </h2>

                    {onClose && (
                      <button onClick={onClose} className="absolute top-6 right-6 text-[#c89f59] hover:text-white transition-colors">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* ── Select Gender ── */}
                    <SectionLabel text={t.profile.selectGender} />
                    <div className="flex gap-3 w-full px-2 mb-7">
                      <GenderButton label={t.profile.male} active={gender === 'male'} onClick={() => handleGenderSelect('male')} />
                      <GenderButton label={t.profile.female} active={gender === 'female'} onClick={() => handleGenderSelect('female')} />
                    </div>

                    {/* ── Choose Avatar ── */}
                    <div className={`w-full transition-all duration-500 mb-7 ${gender ? 'opacity-100 translate-y-0' : 'opacity-20 translate-y-2 pointer-events-none'}`}>
                      <SectionLabel text="Choose your Avatar" />
                      <div className="flex justify-center gap-4 mt-1">
                        {(gender ? AVATARS[gender] : AVATARS.male).map((src, i) => (
                          <button key={i} onClick={() => { playClick(); setSelectedAvatar(src); }}
                            className="relative rounded-full transition-all duration-300 focus:outline-none"
                            style={{
                              transform: selectedAvatar === src ? 'scale(1.12)' : 'scale(1)',
                              filter: selectedAvatar === src ? 'grayscale(0) brightness(1.05)' : (selectedAvatar ? 'grayscale(0.5) brightness(0.7)' : 'grayscale(0.4) brightness(0.8)'),
                            }}
                          >
                            {/* Golden ring on selection */}
                            {selectedAvatar === src && (
                              <div className="absolute -inset-[4px] rounded-full animate-pulse" style={{
                                background: 'linear-gradient(135deg, #ffe58f, #d4af37, #8a6b20, #d4af37)',
                                boxShadow: '0 0 20px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.2)',
                              }} />
                            )}
                            <img src={src} alt="Avatar" className="relative z-10 w-[76px] h-[76px] rounded-full object-cover" style={{
                              boxShadow: selectedAvatar === src
                                ? '0 0 0 3px #1a0f08, 0 4px 12px rgba(0,0,0,0.8)'
                                : '0 0 0 2px rgba(90,66,41,0.4), 0 4px 8px rgba(0,0,0,0.6)',
                            }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── Your Name ── */}
                    <SectionLabel text={t.profile.yourName} />
                    <div className="w-full px-2 mb-2">
                      <div className="relative rounded-lg overflow-hidden" style={{
                        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9), inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(200,159,89,0.1)',
                      }}>
                        <input
                          id="profileName"
                          type="text"
                          maxLength={20}
                          placeholder={t.profile.placeholder}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-5 pr-12 py-3.5 bg-transparent text-[#ffe58f] placeholder-[#5a4229] text-center font-serif tracking-widest text-lg focus:outline-none transition-all"
                          style={{ background: 'linear-gradient(180deg, rgba(10,6,3,0.95) 0%, rgba(20,12,7,0.9) 100%)', border: '1px solid rgba(90,66,41,0.5)' }}
                          onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.6)' }}
                          onBlur={(e) => { e.target.style.borderColor = 'rgba(90,66,41,0.5)' }}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
                          <svg className="w-5 h-5 text-[#c89f59]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="w-full px-2 mt-2 mb-1">
                        <div className="px-4 py-2 rounded text-center font-serif text-xs font-bold text-[#ff6b6b]" style={{
                          background: 'rgba(80,20,20,0.6)', border: '1px solid rgba(180,60,60,0.3)'
                        }}>
                          {error}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ── LET'S GO Button ── */}
                  <div className="relative z-10 px-6 pb-6 pt-2">
                    <button onClick={handleSave}
                      className="w-full group relative rounded-lg active:scale-[0.97] transition-transform duration-100 focus:outline-none"
                    >
                      {/* Button outer glow */}
                      <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                        background: 'linear-gradient(180deg, #ffe58f, #a67c00)',
                      }} />
                      {/* Button body */}
                      <div className="relative rounded-lg py-4 flex items-center justify-center" style={{
                        background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
                        boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.7)',
                      }}>
                        <span className="font-serif font-black text-[15px] tracking-[0.2em] uppercase whitespace-nowrap" style={{
                          background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 50%, #d4af37 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
                        }}>
                          {t.profile.saveProfile}
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Bottom decorative mask ornament */}
                  <div className="flex justify-center pb-4 pt-1 relative z-10">
                    <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
                      <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" fill="url(#maskGold)" stroke="#5a3e15" strokeWidth="0.8"/>
                      <circle cx="15" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5"/>
                      <circle cx="25" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5"/>
                      <path d="M17 16 Q20 19 23 16" stroke="#5a3e15" strokeWidth="0.8" fill="none"/>
                      <defs>
                        <linearGradient id="maskGold" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#d4af37"/>
                          <stop offset="100%" stopColor="#8a6b20"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes plateReveal {
          0% { opacity: 0; transform: scale(0.92) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ═══ Sub-components ═══ */

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-3 w-full px-2">
      <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,159,89,0.4))' }} />
      <span className="font-serif font-bold text-[11px] uppercase tracking-[0.25em] text-[#c89f59] whitespace-nowrap" style={{
        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
      }}>
        {text}
      </span>
      <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(200,159,89,0.4), transparent)' }} />
    </div>
  )
}

function GenderButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex-1 relative rounded-md overflow-hidden transition-all duration-200 focus:outline-none group"
      style={{
        boxShadow: active
          ? 'inset 0 2px 8px rgba(0,0,0,0.7), 0 0 12px rgba(212,175,55,0.15)'
          : 'inset 0 2px 8px rgba(0,0,0,0.7)',
      }}
    >
      <div className="py-3 text-center font-serif font-bold uppercase tracking-[0.2em] text-sm transition-all" style={{
        background: active
          ? 'linear-gradient(180deg, rgba(60,42,26,0.9) 0%, rgba(30,20,10,0.9) 100%)'
          : 'linear-gradient(180deg, rgba(20,14,8,0.9) 0%, rgba(10,7,4,0.9) 100%)',
        border: `1px solid ${active ? 'rgba(212,175,55,0.7)' : 'rgba(90,66,41,0.4)'}`,
        color: active ? '#ffe58f' : '#6b5030',
        borderRadius: '6px',
      }}>
        {label}
      </div>
    </button>
  )
}
