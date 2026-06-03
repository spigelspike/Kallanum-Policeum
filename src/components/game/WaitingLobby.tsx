import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { useProfileStore } from '../../stores/profileStore'
import { avatarKeyToUrl } from '../../utils/avatarMap'
import { playClick } from '../../utils/sounds'
import { supabase } from '../../lib/supabase'
import { useLanguageStore } from '../../stores/languageStore'
import lobbyBgMobile from '../../assets/lobby.webp'
import lobbyBgDesktop from '../../assets/lobby_desktop.webp'

export default function WaitingLobby() {
  const navigate = useNavigate()
  const room = useGameStore((s) => s.room)
  const players = useGameStore((s) => s.players)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const resetStore = useGameStore((s) => s.reset)
  const { avatar: myAvatar } = useProfileStore()
  const { t } = useLanguageStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isHost = room?.hostId === myPlayerId
  const playerCount = players.length
  const canStart = isHost && playerCount >= 3

  const [countdown, setCountdown] = useState(50)

  async function handleStartWithBots() {
    playClick()
    if (!room) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await supabase.functions.invoke('quick-play', {
        body: { action: 'fill-and-start', roomId: room.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (response.error) {
        let msg = response.error.message
        if ('context' in response.error && typeof (response.error as any).context?.json === 'function') {
          try {
            const body = await (response.error as any).context.json()
            if (body && body.error) {
              msg = body.error
            }
          } catch (_) {}
        }
        setError(msg || 'Failed to start quick play')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start quick play')
    } finally {
      setLoading(false)
    }
  }

  async function handleStartGame() {
    playClick()
    if (!room) return
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        return
      }

      const response = await supabase.functions.invoke('start-game', {
        body: { roomId: room.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (response.error) {
        let msg = response.error.message
        if ('context' in response.error && typeof (response.error as any).context?.json === 'function') {
          try {
            const body = await (response.error as any).context.json()
            if (body && body.error) {
              msg = body.error
            }
          } catch (_) {}
        }
        setError(msg || 'Failed to start game')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
    } finally {
      setLoading(false)
    }
  }

  // Timer effect for Quick Play rooms
  useEffect(() => {
    if (!room?.isQuickPlay) return
    if (countdown <= 0) {
      if (isHost && !loading) {
        handleStartWithBots()
      }
      return
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [room?.isQuickPlay, countdown, isHost, loading])

  function handleCopy() {
    playClick()
    if (!room) return
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleExit() {
    playClick()
    if (!room) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.functions.invoke('leave-room', {
          body: { roomId: room.id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
      }
    } catch (e) {
      console.error("Error leaving room:", e)
    } finally {
      resetStore()
      navigate('/home')
    }
  }

  if (!room) return null

  const roomCodeChars = room.code.split('')

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Backgrounds */}
      <div 
        className="hidden md:block absolute inset-0 bg-cover bg-center opacity-80" 
        style={{ backgroundImage: `url(${lobbyBgDesktop})` }} 
      />
      <div 
        className="md:hidden absolute inset-0 bg-cover bg-center opacity-80" 
        style={{ backgroundImage: `url(${lobbyBgMobile})` }} 
      />

      {/* Exit Button */}
      <button
        onClick={handleExit}
        disabled={loading}
        className="absolute top-4 left-4 z-50 flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-red-900/50 hover:border-red-500/50 transition-all text-white/80 hover:text-red-400"
        title="Leave Room"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
      
      {/* ── THE PLATE ── */}
      <div className="w-full max-w-[540px] relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Crown on top */}
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30">
          <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
            <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" fill="url(#crownGoldLobby)" stroke="#5a3e15" strokeWidth="1"/>
            <circle cx="24" cy="4" r="2.5" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <circle cx="13" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <circle cx="35" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
            <rect x="14" y="20" width="20" height="4" rx="1" fill="url(#crownGoldLobby)" stroke="#5a3e15" strokeWidth="0.5"/>
            <defs>
              <linearGradient id="crownGoldLobby" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffe58f"/>
                <stop offset="50%" stopColor="#d4af37"/>
                <stop offset="100%" stopColor="#8a6b20"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Layer 1: Outermost dark frame */}
        <div className="rounded-[22px] p-[3px]" style={{ background: 'linear-gradient(145deg, #2a1a0a, #0d0805, #2a1a0a)' }}>
          {/* Layer 2: Golden metallic rim */}
          <div className="rounded-[19px] p-[4px]" style={{ background: 'linear-gradient(160deg, #d4af37 0%, #a67c00 20%, #593d19 40%, #a67c00 60%, #d4af37 80%, #8a6b20 100%)' }}>
            {/* Layer 3: Inner dark edge */}
            <div className="rounded-[15px] p-[2px]" style={{ background: 'linear-gradient(145deg, #1a1008, #0a0604)' }}>
              {/* Layer 4: Inner golden trim */}
              <div className="rounded-[13px] p-[1px]" style={{ background: 'linear-gradient(160deg, #c89f59 0%, #5a4229 30%, #c89f59 60%, #5a4229 100%)' }}>
                {/* Layer 5: Main card body */}
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
                    {/* Corner scrollwork */}
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
                  <div className="relative z-10 px-6 sm:px-10 pt-12 pb-6 flex flex-col items-center">
                    
                    {/* ROOM CODE */}
                    <SectionDivider text={t.lobby.roomCode} />
                    <div className="flex justify-center gap-1.5 sm:gap-2 mb-2 mt-2">
                      {roomCodeChars.map((char, i) => (
                        <div key={i} className="w-10 h-12 sm:w-12 sm:h-14 rounded-md flex items-center justify-center border" style={{
                          background: 'linear-gradient(180deg, rgba(15,10,6,0.95) 0%, rgba(20,12,7,0.9) 100%)',
                          borderColor: 'rgba(90,66,41,0.6)',
                          boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                          <span className="text-2xl sm:text-3xl font-serif font-black" style={{
                            background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 40%, #b8860b 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))'
                          }}>
                            {char}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-8 w-full opacity-80">
                      <div className="w-6 h-[1px] bg-gradient-to-r from-transparent to-[#c89f59]/50" />
                      <button 
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 active:scale-95 transition-all"
                        title="Copy Room Code"
                      >
                        <p className="text-[10px] sm:text-xs text-[#c89f59] font-serif italic tracking-wide">
                          {copied ? t.lobby.copied : t.lobby.shareCode}
                        </p>
                        {!copied && (
                          <svg className="w-3 h-3 text-[#c89f59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <div className="w-6 h-[1px] bg-gradient-to-l from-transparent to-[#c89f59]/50" />
                    </div>

                    {/* PLAYERS LIST */}
                    <SectionDivider text={`${t.lobby.players} (${playerCount}/${room.totalRounds > 0 ? 15 : 15})`} />
                    
                    <div className="w-full space-y-2 mt-2 mb-6 max-h-[35vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#5a3e15] scrollbar-track-transparent">
                      {players.map((player) => {
                        // Resolve avatar: use avatarKey from server, fallback to local avatar for self
                        const resolvedAvatar = avatarKeyToUrl(player.avatarKey) || (player.id === myPlayerId ? myAvatar : null)
                        return (
                        <div key={player.id} className="relative rounded-lg p-[1px] shadow-md transition-all hover:brightness-110" style={{
                          background: 'linear-gradient(180deg, #b88c42, #5a3e15)'
                        }}>
                          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-[7px] border border-[#0d0704]" style={{
                            background: 'linear-gradient(90deg, #1a0f08, #2c1a0e)'
                          }}>
                            <div className="flex items-center gap-3">
                              {/* Avatar Box */}
                              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#c89f59] bg-[#0d0704] flex items-center justify-center overflow-hidden shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
                                {resolvedAvatar ? (
                                  <img src={resolvedAvatar} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#c89f59] opacity-70" viewBox="0 0 40 28" fill="currentColor">
                                    <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" />
                                    <circle cx="15" cy="11" r="2.5" fill="#0d0704" />
                                    <circle cx="25" cy="11" r="2.5" fill="#0d0704" />
                                  </svg>
                                )}
                              </div>
                              <span className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-[#5ce65c] shadow-[0_0_8px_rgba(92,230,92,0.6)]' : 'bg-[#e65c5c]'}`} />
                              <span className="font-serif font-bold text-[#ffe58f] text-sm sm:text-base tracking-wider drop-shadow-md">
                                {player.username}
                                {player.isBot && <span className="ml-1 opacity-70" title="Bot">🤖</span>}
                              </span>
                            </div>
                            
                            {player.isHost && (
                              <div className="flex items-center gap-1.5 border border-[#c89f59]/40 rounded-full px-2 sm:px-2.5 py-0.5" style={{ background: 'rgba(212,175,55,0.1)' }}>
                                <svg className="w-3 h-3 text-[#d4af37]" viewBox="0 0 48 36" fill="currentColor">
                                  <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" />
                                </svg>
                                <span className="text-[9px] sm:text-[10px] font-bold text-[#d4af37] tracking-widest uppercase">{t.lobby.host}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )})}
                    </div>

                    {/* WARNING / STATUS */}
                    <div className="w-full mb-4">
                      {room.isQuickPlay ? (
                        <div className="w-full bg-[#0f2d11]/80 border border-[#2b6a2f]/60 rounded-md py-2.5 flex flex-col justify-center items-center gap-1 shadow-inner px-4">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5ce65c] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5ce65c]"></span>
                            </span>
                            <span className="text-[#aee681] font-serif text-xs sm:text-sm drop-shadow-md text-center">
                              {countdown > 0 
                                ? `Matchmaking active. Game starts in ${countdown}s...`
                                : "Starting game..."}
                            </span>
                          </div>
                          <span className="text-[10px] text-white/50 text-center font-sans">
                            Waiting for other players to join.
                          </span>
                        </div>
                      ) : playerCount < 3 ? (
                        <div className="w-full bg-[#2a0808]/80 border border-[#8a1c1c]/60 rounded-md py-2.5 flex justify-center items-center gap-2 shadow-inner">
                          <svg className="w-4 h-4 text-[#ff6b6b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span className="text-[#ff8f8f] font-serif text-xs sm:text-sm drop-shadow-md">
                            {t.lobby.needPlayers} ({playerCount})
                          </span>
                        </div>
                      ) : !isHost ? (
                        <div className="w-full text-center py-2">
                          <span className="text-[#c89f59] font-serif text-xs sm:text-sm italic drop-shadow-md">
                            {t.lobby.waitingForHost}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* START BUTTON (HOST ONLY) */}
                    {isHost && (
                      <button
                        onClick={room.isQuickPlay ? handleStartWithBots : handleStartGame}
                        disabled={loading || (!room.isQuickPlay && !canStart)}
                        className="w-full relative group rounded-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                      >
                        <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                          background: 'linear-gradient(180deg, #ffe58f, #a67c00)'
                        }} />
                        <div className="relative rounded-lg py-4 flex items-center justify-center gap-3" style={{
                          background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
                          boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.7)',
                        }}>
                          {/* Left Mask Icon */}
                          <svg className="w-5 h-5 text-[#ffe58f] drop-shadow-md opacity-80" viewBox="0 0 40 28" fill="currentColor">
                            <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" />
                            <circle cx="15" cy="11" r="2.5" fill="#5a3e15" /><circle cx="25" cy="11" r="2.5" fill="#5a3e15" />
                          </svg>
                          
                          <span className="font-serif font-black text-[15px] sm:text-[17px] tracking-[0.15em] uppercase whitespace-nowrap" style={{
                            background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 50%, #d4af37 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))',
                          }}>
                            {loading 
                              ? t.lobby.starting 
                              : room.isQuickPlay 
                                ? playerCount >= 5 ? t.lobby.startGame : `${t.lobby.startGame} (${playerCount}/5)`
                                : `${t.lobby.startGame} (${playerCount})`}
                          </span>

                          {/* Right Mask Icon */}
                          <svg className="w-5 h-5 text-[#ffe58f] drop-shadow-md opacity-80" viewBox="0 0 40 28" fill="currentColor">
                            <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" />
                            <circle cx="15" cy="11" r="2.5" fill="#5a3e15" /><circle cx="25" cy="11" r="2.5" fill="#5a3e15" />
                          </svg>
                        </div>
                      </button>
                    )}

                    {error && (
                      <div className="w-full mt-3 text-center">
                        <span className="text-[#ff6b6b] font-serif text-sm font-bold">{error}</span>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionDivider({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-3 w-full">
      <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,159,89,0.4))' }} />
      <span className="font-serif font-bold text-[11px] sm:text-[13px] uppercase tracking-[0.25em] text-[#c89f59] whitespace-nowrap drop-shadow-md">
        {text}
      </span>
      <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(200,159,89,0.4), transparent)' }} />
    </div>
  )
}
