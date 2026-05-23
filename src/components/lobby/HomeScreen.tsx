import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoom } from '../../hooks/useRoom'
import { useProfileStore } from '../../stores/profileStore'
import { useSoundStore } from '../../stores/soundStore'
import { playClick } from '../../utils/sounds'
import CreateProfileModal from './CreateProfileModal'
import HowToPlayModal from './HowToPlayModal'
import mainMenuDesktopBg from '../../assets/main_menu_desktop.webp'
import mobileBg from '../../assets/main_menu_bg.webp'
import typoLogo from '../../assets/typo_logo.webp'
import bgMusic from '../../assets/sound/game_bg.mp3'

type Mode = 'idle' | 'create' | 'join'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { loading, error, createRoom, joinRoom } = useRoom()

  // Profile Store
  const { hasProfile, name, avatar } = useProfileStore()

  const [mode, setMode] = useState<Mode>('idle')
  const [roomCode, setRoomCode] = useState('')
  const [totalRounds, setTotalRounds] = useState(3)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  // Sound Store
  const { isMuted, toggleMute } = useSoundStore()

  const displayError = localError || error

  function validateRoomCode(value: string): string | null {
    const trimmed = value.trim().toUpperCase()
    if (trimmed.length !== 6) return 'Room code must be exactly 6 characters'
    if (!/^[A-Z0-9]+$/.test(trimmed))
      return 'Room code can only contain letters and numbers'
    return null
  }

  async function handleCreate() {
    playClick()
    setLocalError(null)
    const code = await createRoom(name.trim(), totalRounds)
    if (code) {
      navigate(`/room/${code}`)
    }
  }

  async function handleJoin() {
    playClick()
    setLocalError(null)
    const codeErr = validateRoomCode(roomCode)
    if (codeErr) {
      setLocalError(codeErr)
      return
    }

    const code = await joinRoom(name.trim(), roomCode.trim().toUpperCase())
    if (code) {
      navigate(`/room/${code}`)
    }
  }



  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background Music (Autoplays when unmuted if browser allows, otherwise waits for interaction) */}
      <audio src={bgMusic} autoPlay loop muted={isMuted} />

      {/* Profile Creation Modal */}
      {!hasProfile && <CreateProfileModal />}

      {/* How To Play Modal */}
      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}

      {/* --- Backgrounds --- */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80"
        style={{ backgroundImage: `url(${mainMenuDesktopBg})` }}
      />
      <div
        className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80"
        style={{ backgroundImage: `url(${mobileBg})` }}
      />

      {/* --- Layout Wrapper --- */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between py-8 px-4 sm:px-6 md:py-12 md:px-8">

        {/* Absolute Mute Toggle Button */}
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => {
              playClick()
              toggleMute()
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all text-white/80 hover:text-amber-400"
          >
            {isMuted ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>

        {/* Absolute Report Bug Button */}
        <div className="absolute bottom-4 right-4 z-50">
          <a
            href="https://github.com/spigelspike/Kallanum-Policeum/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playClick()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-red-900/50 hover:border-red-500/50 transition-all text-white/60 hover:text-red-400 text-xs font-serif tracking-widest uppercase"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
            </svg>
            Report Bug
          </a>
        </div>

        {/* Top Header: Logo & Profile */}
        <div className="w-full flex flex-col items-center gap-4 mt-8 md:mt-0">
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mt-2 animate-in fade-in slide-in-from-top-8 duration-700">
            <img src={typoLogo} alt="Kallanum Policeum" className="w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]" />
          </div>

          {hasProfile && (
            <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg animate-in fade-in duration-1000">
              {avatar && <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-amber-400/50" />}
              <span className="text-white font-bold text-sm uppercase tracking-wider">{name}</span>
            </div>
          )}
        </div>

        <div className="flex-grow"></div>

        {/* Bottom Actions Area */}
        <div className="w-full max-w-[340px] md:max-w-[420px] flex flex-col gap-3 sm:gap-4 md:gap-4 mb-2 md:mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {mode === 'idle' && (
            <>


              {/* Create Room Button (Blue) */}
              <MainButton
                onClick={() => { playClick(); setMode('create') }}
                title="CREATE ROOM"
                subtitle="CREATE YOUR OWN ROOM"
                gradientOuter="from-[#2970d1] to-[#072457]"
                gradientInner="from-[#1b5cb1] to-[#124285]"
                shadow="shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
                icon={
                  <svg className="w-7 h-7 md:w-9 md:h-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                  </svg>
                }
              />

              {/* Join Room Button (Purple) */}
              <MainButton
                onClick={() => { playClick(); setMode('join') }}
                title="JOIN ROOM"
                subtitle="JOIN WITH ROOM CODE"
                gradientOuter="from-[#7c33b3] to-[#270b47]"
                gradientInner="from-[#602193] to-[#401369]"
                shadow="shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
                icon={
                  <svg className="w-7 h-7 md:w-9 md:h-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                  </svg>
                }
              />

              {/* How To Play Button (Gold/Brown) */}
              <MainButton
                onClick={() => { playClick(); setShowHowToPlay(true) }}
                title="HOW TO PLAY"
                subtitle="LEARN THE RULES"
                gradientOuter="from-[#a67c00] to-[#5a3e15]"
                gradientInner="from-[#8a6b20] to-[#3f2a0d]"
                shadow="shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
                icon={
                  <svg className="w-7 h-7 md:w-9 md:h-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/>
                  </svg>
                }
              />
            </>
          )}

          {/* Form Area for Create / Join / Quick */}
          {mode !== 'idle' && (
            <div className="w-full max-w-[440px] relative mt-4" style={{ animation: 'plateReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>

              {/* ── Crown on top ── */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
                <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
                  <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" fill="url(#crownGold)" stroke="#5a3e15" strokeWidth="1" />
                  <circle cx="24" cy="4" r="2.5" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5" />
                  <circle cx="13" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5" />
                  <circle cx="35" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5" />
                  <rect x="14" y="20" width="20" height="4" rx="1" fill="url(#crownGold)" stroke="#5a3e15" strokeWidth="0.5" />
                  <defs>
                    <linearGradient id="crownGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffe58f" />
                      <stop offset="50%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#8a6b20" />
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
                        <div className="absolute inset-0 pointer-events-none" style={{
                          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.5)'
                        }} />

                        {/* Decorative inner filigree border */}
                        <div className="absolute inset-[14px] pointer-events-none rounded-lg" style={{ border: '1px solid rgba(200,159,89,0.2)' }}>
                          <svg className="absolute -top-[6px] -left-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M2 18 C2 10, 10 2, 18 2" /><path d="M6 18 C6 12, 12 6, 18 6" />
                          </svg>
                          <svg className="absolute -top-[6px] -right-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M18 18 C18 10, 10 2, 2 2" /><path d="M14 18 C14 12, 8 6, 2 6" />
                          </svg>
                          <svg className="absolute -bottom-[6px] -left-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M2 2 C2 10, 10 18, 18 18" /><path d="M6 2 C6 8, 12 14, 18 14" />
                          </svg>
                          <svg className="absolute -bottom-[6px] -right-[6px] w-5 h-5 text-[#c89f59] opacity-60" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M18 2 C18 10, 10 18, 2 18" /><path d="M14 2 C14 8, 8 14, 2 14" />
                          </svg>
                        </div>

                        {/* ════ CONTENT ════ */}
                        <div className="relative z-10 px-8 pt-10 pb-6 flex flex-col items-center">

                          <h2 className="font-serif font-black text-center uppercase tracking-widest mb-8 text-[22px] sm:text-[26px]" style={{
                            background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 40%, #b8860b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
                          }}>
                            {mode === 'create' ? 'Create a Room' : 'Join a Room'}
                          </h2>

                          <div className="w-full space-y-6">

                            {/* Create flow specific fields */}
                            {mode === 'create' && (
                              <div className="w-full px-2 mb-2">
                                <label htmlFor="totalRounds" className="block text-[11px] font-serif font-bold text-[#c89f59] uppercase tracking-[0.25em] mb-2 drop-shadow-md">
                                  Number of Rounds
                                </label>
                                <div className="relative rounded-lg overflow-hidden" style={{
                                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9), inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(200,159,89,0.1)',
                                }}>
                                  <select
                                    id="totalRounds"
                                    value={totalRounds}
                                    onChange={(e) => { playClick(); setTotalRounds(Number(e.target.value)) }}
                                    className="w-full pl-5 pr-12 py-3.5 bg-transparent text-[#ffe58f] text-left font-serif tracking-widest text-lg focus:outline-none transition-all appearance-none cursor-pointer"
                                    style={{ background: 'linear-gradient(180deg, rgba(10,6,3,0.95) 0%, rgba(20,12,7,0.9) 100%)', border: '1px solid rgba(90,66,41,0.5)' }}
                                    onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.6)' }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(90,66,41,0.5)' }}
                                  >
                                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                      <option key={n} value={n} className="bg-slate-900 text-white">
                                        {n} {n === 1 ? 'ROUND' : 'ROUNDS'}
                                      </option>
                                    ))}
                                  </select>
                                  {/* Custom dropdown arrow */}
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
                                    <svg className="w-5 h-5 text-[#c89f59]" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M7 10l5 5 5-5z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Join flow specific fields */}
                            {mode === 'join' && (
                              <div className="w-full px-2 mb-2">
                                <label htmlFor="roomCode" className="block text-[11px] font-serif font-bold text-[#c89f59] uppercase tracking-[0.25em] mb-2 drop-shadow-md">
                                  Room Code
                                </label>
                                <div className="relative rounded-lg overflow-hidden" style={{
                                  boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.9), inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 0 rgba(200,159,89,0.1)',
                                }}>
                                  <input
                                    id="roomCode"
                                    type="text"
                                    maxLength={6}
                                    placeholder="ABC123"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                    className="w-full pl-5 pr-12 py-3.5 bg-transparent text-[#ffe58f] placeholder-[#5a4229] text-center font-serif tracking-widest text-lg focus:outline-none transition-all uppercase"
                                    style={{ background: 'linear-gradient(180deg, rgba(10,6,3,0.95) 0%, rgba(20,12,7,0.9) 100%)', border: '1px solid rgba(90,66,41,0.5)' }}
                                    onFocus={(e) => { e.target.style.borderColor = 'rgba(212,175,55,0.6)' }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(90,66,41,0.5)' }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Error display */}
                            {displayError && (
                              <div className="w-full px-2 mt-2 mb-1">
                                <div className="px-4 py-2 rounded text-center font-serif text-xs font-bold text-[#ff6b6b]" style={{
                                  background: 'rgba(80,20,20,0.6)', border: '1px solid rgba(180,60,60,0.3)'
                                }}>
                                  {displayError}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>

                        {/* Actions (Back + Create/Join) */}
                        <div className="relative z-10 px-8 pb-6 flex gap-4">
                          {/* Rustic Back Button */}
                          <button
                            onClick={() => { playClick(); setMode('idle'); setLocalError(null) }}
                            disabled={loading}
                            className="flex-1 relative rounded-lg overflow-hidden transition-all duration-200 focus:outline-none active:scale-[0.97] disabled:opacity-50"
                            style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)' }}
                          >
                            <div className="py-3.5 text-center font-serif font-bold uppercase tracking-[0.2em] text-[13px] transition-all" style={{
                              background: 'linear-gradient(180deg, rgba(60,42,26,0.9) 0%, rgba(30,20,10,0.9) 100%)',
                              border: '1px solid rgba(90,66,41,0.4)',
                              color: '#c89f59',
                              borderRadius: '8px',
                            }}>
                              Back
                            </div>
                          </button>

                          {/* Glowing Gold Action Button */}
                          <button
                            onClick={mode === 'create' ? handleCreate : handleJoin}
                            disabled={loading}
                            className="flex-1 relative group rounded-lg active:scale-[0.97] transition-transform duration-100 focus:outline-none disabled:opacity-50"
                          >
                            <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                              background: 'linear-gradient(180deg, #ffe58f, #a67c00)',
                            }} />
                            <div className="relative rounded-lg py-3.5 flex items-center justify-center h-full" style={{
                              background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
                              boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.7)',
                            }}>
                              <span className="font-serif font-black text-[14px] tracking-[0.2em] uppercase whitespace-nowrap" style={{
                                background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 50%, #d4af37 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
                              }}>
                                {loading ? '...' : mode === 'create' ? 'Create' : 'Join'}
                              </span>
                            </div>
                          </button>
                        </div>

                        {/* Bottom decorative mask ornament */}
                        <div className="flex justify-center pb-4 relative z-10">
                          <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
                            <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" fill="url(#maskGold2)" stroke="#5a3e15" strokeWidth="0.8" />
                            <circle cx="15" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5" />
                            <circle cx="25" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5" />
                            <path d="M17 16 Q20 19 23 16" stroke="#5a3e15" strokeWidth="0.8" fill="none" />
                            <defs>
                              <linearGradient id="maskGold2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#d4af37" />
                                <stop offset="100%" stopColor="#8a6b20" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <style>{`
                @keyframes plateReveal {
                  0% { opacity: 0; transform: scale(0.92) translateY(20px); }
                  100% { opacity: 1; transform: scale(1) translateY(0); }
                }
              `}</style>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}


/* ─── Reusable Main Menu Button ─── */
function MainButton({
  onClick,
  title,
  subtitle,
  icon,
  gradientOuter,
  gradientInner,
  shadow
}: {
  onClick: () => void,
  title: string,
  subtitle: string,
  icon: React.ReactNode,
  gradientOuter: string,
  gradientInner: string,
  shadow: string
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-xl md:rounded-2xl p-[2px] md:p-[3px] bg-gradient-to-b ${gradientOuter} ${shadow} active:scale-[0.98] transition-all duration-150`}
    >
      <div className={`flex items-center px-4 md:px-5 py-3 md:py-4 bg-gradient-to-b ${gradientInner} rounded-[10px] md:rounded-[13px] border border-white/10 group-hover:brightness-110 transition-all`}>
        <div className="flex-shrink-0 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] mr-2 md:mr-0">
          {icon}
        </div>
        <div className="flex flex-col items-center flex-grow">
          <span className="text-white font-black tracking-tight drop-shadow-md leading-tight text-lg sm:text-xl md:text-2xl">
            {title}
          </span>
          <span className="text-white/80 font-bold tracking-widest uppercase leading-tight mt-0.5 text-[9px] sm:text-[10px] md:text-[11px]">
            {subtitle}
          </span>
        </div>
        {/* Invisible spacer for perfectly centering text */}
        <div className="flex-shrink-0 w-7 sm:w-7 md:w-9 opacity-0 ml-2 md:ml-0" />
      </div>
    </button>
  )
}

