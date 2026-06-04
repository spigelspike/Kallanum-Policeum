import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { supabase } from '../../lib/supabase'
import { playClick } from '../../utils/sounds'
import { useLanguageStore } from '../../stores/languageStore'
import type { FinalScore } from '../../types/game'
import mainGameDesktopBg from '../../assets/main_game_desktop.webp'
import mobileBg from '../../assets/main_game.webp'
import { avatarKeyToUrl } from '../../utils/avatarMap'
import { Users, AlertCircle, RefreshCw, Home, BarChart2, X } from 'lucide-react'
import { useRoom } from '../../hooks/useRoom'
import { useProfileStore } from '../../stores/profileStore'

export default function ResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('room')

  const finalScores = useGameStore((s) => s.finalScores)
  const setFinalScores = useGameStore((s) => s.setFinalScores)
  const players = useGameStore((s) => s.players) // Use players to get avatarKey
  const resetStore = useGameStore((s) => s.reset)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const { t } = useLanguageStore()
  
  const { joinRoom, quickPlay } = useRoom()
  const { name, avatar: myAvatar } = useProfileStore()

  // Capture isQuickPlay from room data before it gets reset
  const room = useGameStore((s) => s.room)
  const [isQuickPlay] = useState(() => room?.isQuickPlay ?? false)

  const [localScores, setLocalScores] = useState<FinalScore[]>([])
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [showScoreboard, setShowScoreboard] = useState(false)

  useEffect(() => {
    async function loadResults() {
      if (finalScores && finalScores.length > 0) {
        setLocalScores(finalScores)
        return
      }

      if (!roomCode) {
        setError('No room code provided.')
        return
      }

      setLoading(true)
      try {
        const { data: roomData, error: roomErr } = await supabase
          .from('rooms')
          .select('id')
          .eq('code', roomCode.toUpperCase())
          .maybeSingle()

        if (roomErr || !roomData) {
          setError('Room not found.')
          return
        }

        const { data: playersData, error: playersErr } = await supabase
          .from('room_players')
          .select('player_id, username, score, avatar_key')
          .eq('room_id', roomData.id)

        if (playersErr || !playersData) {
          setError('Failed to fetch player scores.')
          return
        }

        const sorted = [...playersData]
          .sort((a, b) => b.score - a.score)
          .map((p, idx) => {
            const storePlayer = players.find(sp => sp.id === p.player_id)
            return {
              playerId: p.player_id,
              username: p.username,
              totalScore: p.score,
              rank: idx + 1,
              avatarKey: storePlayer?.avatarKey || p.avatar_key || null,
            }
          })

        setLocalScores(sorted as any)
        setFinalScores(sorted as any)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results.')
      } finally {
        setLoading(false)
      }
    }
    loadResults()
  }, [roomCode, finalScores, setFinalScores, players])

  function handleLobbyRedirect() {
    playClick()
    resetStore()
    navigate('/')
  }

  async function handlePlayAgain() {
    playClick()
    setResetting(true)
    setError(null)
    try {
      if (isQuickPlay) {
        // Quick play: queue into a fresh match
        resetStore()
        const code = await quickPlay()
        if (code) {
          navigate(`/room/${code}`)
          return
        } else {
          setError('Failed to find a match. Try again.')
        }
      } else {
        // Private room: try to reset and rejoin
        const { data: { session } } = await supabase.auth.getSession()
        if (!session || !roomCode) return
        
        const { data: roomData } = await supabase
          .from('rooms')
          .select('id, host_id')
          .eq('code', roomCode.toUpperCase())
          .maybeSingle()
          
        if (roomData) {
          if (roomData.host_id === myPlayerId) {
            const response = await supabase.functions.invoke('reset-game', {
              body: { roomId: roomData.id },
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
            if (response.error) {
               console.error("Reset failed:", response.error)
            }
          }
          
          await new Promise(r => setTimeout(r, 500))
          
          const joinedCode = await joinRoom(name.trim(), roomCode)
          if (joinedCode) {
            resetStore()
            navigate(`/room/${joinedCode}`)
            return
          } else {
             setError(roomData.host_id === myPlayerId ? "Failed to restart game." : "Waiting for host to play again...")
          }
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
        <div className="animate-spin h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full mb-4" />
        <p className="text-[#c89f59] text-sm font-serif font-bold uppercase tracking-widest">{t.game.calculatingStandings}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-900/40 border border-red-500/50 rounded-full flex items-center justify-center text-red-500 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-serif font-black text-white uppercase tracking-widest mb-2">{t.game.errorLoadingStandings}</h2>
        <p className="text-slate-400 max-w-sm mb-8 text-sm font-mono">{error}</p>
        <button onClick={handleLobbyRedirect}
          className="px-8 py-3 rounded-md font-serif font-bold uppercase tracking-widest bg-gradient-to-b from-[#d4af37] to-[#8a6b20] text-black hover:brightness-110 transition-all border border-[#ffe58f]">
          {t.game.backToLobby}
        </button>
      </div>
    )
  }

  const firstPlace = localScores[0]
  const secondPlace = localScores[1]
  const thirdPlace = localScores[2]

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#050505] text-white flex flex-col items-center select-none font-serif">
      
      {/* Background Overlay */}
      <div className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity" style={{ backgroundImage: `url(${mainGameDesktopBg})` }} />
      <div className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity" style={{ backgroundImage: `url(${mobileBg})` }} />
      
      {/* Heavy vignette / darkness layer to match the dungeon vibe */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.85) 100%)' }} />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* --- TOP NAVIGATION BAR --- */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-50 pointer-events-none">
        
        {/* Left: Players */}
        <button className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded border border-[#d4af37]/40 bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-sm">
          <Users size={16} className="text-[#d4af37]" />
          <span className="text-[#ffe58f] text-[10px] md:text-xs font-bold uppercase tracking-widest">{localScores.length} PLAYERS</span>
        </button>

        {/* Center: Title */}
        <div className="flex flex-col items-center mt-[-4px] md:mt-0 text-center">
          <p className="text-[#d4af37] text-[9px] md:text-xs font-black uppercase tracking-[0.3em] opacity-80 mb-1">
            KALLANUM POLICEUM
          </p>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest" style={{
            background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 30%, #d4af37 70%, #8a6b20 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.8))'
          }}>
            FINAL RESULTS
          </h1>
          
          <div className="flex items-center gap-3 mt-3 md:mt-4 opacity-80">
            <div className="w-8 md:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#d4af37]" />
            <div className="w-1.5 h-1.5 rotate-45 border border-[#d4af37]" />
            <span className="text-[#ffe58f] text-[9px] md:text-xs font-mono font-bold tracking-[0.2em] px-2">ROOM CODE: {roomCode}</span>
            <div className="w-1.5 h-1.5 rotate-45 border border-[#d4af37]" />
            <div className="w-8 md:w-12 h-[1px] bg-gradient-to-l from-transparent to-[#d4af37]" />
          </div>
        </div>

        {/* Right: Empty spacer to balance layout */}
        <div className="hidden md:block w-[120px]"></div>
      </div>

      {/* --- PODIUM --- */}
      <div className="relative z-20 flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-center gap-8 md:gap-4 lg:gap-8 px-4 pt-40 md:pt-32 pb-48">
        
        {/* 2nd Place */}
        {secondPlace && (
          <div className="order-2 md:order-1 relative w-[220px] md:w-[240px] md:mb-6 animate-[fadeInUp_0.8s_ease-out]">
            {/* Rank Badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full z-10 flex items-center justify-center border-2 border-[#e2e8f0]" style={{
              background: 'linear-gradient(180deg, #94a3b8, #475569)',
              boxShadow: '0 0 15px rgba(148, 163, 184, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)'
            }}>
              <span className="text-2xl font-black text-white drop-shadow-md">2</span>
            </div>
            
            {/* Card Body */}
            <div className="pt-10 pb-8 px-6 rounded-lg bg-[#0f1115]/90 backdrop-blur-md border border-[#64748b] flex flex-col items-center" style={{
              boxShadow: '0 10px 30px -10px rgba(148, 163, 184, 0.2), inset 0 0 40px rgba(0,0,0,0.8)'
            }}>
              <div className="w-20 h-20 rounded-full border-2 border-[#94a3b8] overflow-hidden bg-black mb-4 shadow-[0_0_15px_rgba(148,163,184,0.3)]">
                {avatarKeyToUrl((secondPlace as any).avatarKey) || (secondPlace.playerId === myPlayerId ? myAvatar : null) ? (
                  <img src={avatarKeyToUrl((secondPlace as any).avatarKey) || (secondPlace.playerId === myPlayerId ? myAvatar : undefined) || ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1 text-center w-full truncate">{secondPlace.username}</h3>
              <p className="text-[#3b82f6] font-mono font-bold">{secondPlace.totalScore} PTS</p>
            </div>
          </div>
        )}

        {/* 1st Place */}
        {firstPlace && (
          <div className="order-1 md:order-2 relative w-[260px] md:w-[300px] z-30 animate-[fadeInUp_0.6s_ease-out]">
            {/* Rank Badge */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full z-10 flex items-center justify-center border-2 border-[#ffe58f]" style={{
              background: 'linear-gradient(180deg, #d4af37, #8a6b20)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.6), inset 0 2px 4px rgba(255,255,255,0.4)'
            }}>
              <span className="text-3xl font-black text-[#fff8e1] drop-shadow-md">1</span>
            </div>
            
            {/* Card Body */}
            <div className="pt-12 pb-10 px-6 rounded-lg bg-[#141005]/95 backdrop-blur-md border border-[#d4af37] flex flex-col items-center" style={{
              boxShadow: '0 15px 40px -10px rgba(212, 175, 55, 0.4), inset 0 0 50px rgba(0,0,0,0.9), 0 0 10px rgba(212, 175, 55, 0.3)'
            }}>
              {/* Laurel Wreath decorative SVG (simulated with CSS for now or skipped) */}
              <div className="relative w-28 h-28 mb-5">
                {/* Glow behind avatar */}
                <div className="absolute inset-0 bg-[#d4af37] opacity-20 blur-xl rounded-full" />
                
                <div className="absolute inset-1 rounded-full border-[3px] border-[#d4af37] overflow-hidden bg-black shadow-[0_0_20px_rgba(212,175,55,0.6)] z-10">
                  {avatarKeyToUrl((firstPlace as any).avatarKey) || (firstPlace.playerId === myPlayerId ? myAvatar : null) ? (
                    <img src={avatarKeyToUrl((firstPlace as any).avatarKey) || (firstPlace.playerId === myPlayerId ? myAvatar : undefined) || ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-[#d4af37] uppercase tracking-widest mb-1 text-center w-full truncate drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                {firstPlace.username}
              </h3>
              <p className="text-[#ffe58f] font-mono font-bold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{firstPlace.totalScore} PTS</p>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {thirdPlace && (
          <div className="order-3 md:order-3 relative w-[220px] md:w-[240px] md:mb-12 animate-[fadeInUp_1s_ease-out]">
            {/* Rank Badge */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full z-10 flex items-center justify-center border-2 border-[#e6a15c]" style={{
              background: 'linear-gradient(180deg, #b87333, #733c16)',
              boxShadow: '0 0 15px rgba(184, 115, 51, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)'
            }}>
              <span className="text-2xl font-black text-white drop-shadow-md">3</span>
            </div>
            
            {/* Card Body */}
            <div className="pt-10 pb-8 px-6 rounded-lg bg-[#150d05]/90 backdrop-blur-md border border-[#8b4513] flex flex-col items-center" style={{
              boxShadow: '0 10px 30px -10px rgba(139, 69, 19, 0.3), inset 0 0 40px rgba(0,0,0,0.8)'
            }}>
              <div className="w-20 h-20 rounded-full border-2 border-[#b87333] overflow-hidden bg-black mb-4 shadow-[0_0_15px_rgba(184,115,51,0.3)]">
                {avatarKeyToUrl((thirdPlace as any).avatarKey) || (thirdPlace.playerId === myPlayerId ? myAvatar : null) ? (
                  <img src={avatarKeyToUrl((thirdPlace as any).avatarKey) || (thirdPlace.playerId === myPlayerId ? myAvatar : undefined) || ''} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider mb-1 text-center w-full truncate">{thirdPlace.username}</h3>
              <p className="text-[#d97706] font-mono font-bold">{thirdPlace.totalScore} PTS</p>
            </div>
          </div>
        )}

      </div>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex justify-center items-end z-50 pointer-events-none">
        
        {/* Center: Main Actions */}
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 w-full max-w-md md:max-w-none md:w-auto px-4 md:px-0">
          <button onClick={handlePlayAgain} disabled={resetting} className="pointer-events-auto flex items-center justify-center gap-3 w-full md:w-48 py-3.5 rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-[#334155] hover:border-[#475569] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] group disabled:opacity-50">
            <RefreshCw size={16} className={`text-slate-400 transition-transform duration-500 ${resetting ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">{resetting ? 'LOADING...' : isQuickPlay ? 'QUICK PLAY AGAIN' : 'PLAY AGAIN'}</span>
          </button>

          <button onClick={handleLobbyRedirect} className="pointer-events-auto flex items-center justify-center gap-3 w-full md:w-56 py-4 rounded-full transition-all hover:scale-105 shadow-[0_5px_20px_rgba(0,0,0,0.6)] group border border-[#ffe58f]" style={{
            background: 'linear-gradient(180deg, #d4af37 0%, #b8860b 40%, #8a6b20 100%)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 5px 20px rgba(0,0,0,0.8)'
          }}>
            <Home size={18} className="text-black" />
            <span className="text-black text-[13px] sm:text-[14px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] drop-shadow-sm">RETURN TO LOBBY</span>
          </button>

          <button onClick={() => { playClick(); setShowScoreboard(true); }} className="pointer-events-auto flex items-center justify-center gap-3 w-full md:w-48 py-3.5 rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] border border-[#334155] hover:border-[#475569] transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] group">
            <BarChart2 size={16} className="text-slate-400" />
            <span className="text-slate-300 text-sm font-bold uppercase tracking-widest">SCOREBOARD</span>
          </button>
        </div>
      </div>

      {/* --- SCOREBOARD MODAL --- */}
      {showScoreboard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowScoreboard(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#0a0a0a] border border-[#d4af37]/40 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            <div className="p-4 border-b border-[#d4af37]/20 flex justify-between items-center bg-gradient-to-r from-transparent via-[#d4af37]/5 to-transparent">
              <h3 className="text-[#ffe58f] font-black tracking-widest uppercase">FULL SCOREBOARD</h3>
              <button onClick={() => setShowScoreboard(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {localScores.map((player) => (
                <div key={player.playerId} className="flex items-center justify-between p-3 rounded-lg bg-[#111] border border-[#333] hover:border-[#d4af37]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm font-black text-[#8a6b20]">#{player.rank}</span>
                    <div className="w-8 h-8 rounded-full border border-[#d4af37]/50 overflow-hidden">
                      {avatarKeyToUrl((player as any).avatarKey) || (player.playerId === myPlayerId ? myAvatar : null) ? (
                        <img src={avatarKeyToUrl((player as any).avatarKey) || (player.playerId === myPlayerId ? myAvatar : undefined) || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-slate-200">{player.username}</span>
                  </div>
                  <span className="font-mono text-[#d4af37]">{player.totalScore} PTS</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
