import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { supabase } from '../../lib/supabase'
import { playClick } from '../../utils/sounds'
import type { FinalScore } from '../../types/game'
import mainMenuDesktopBg from '../../assets/main_menu_desktop.webp'
import mobileBg from '../../assets/main_menu_bg.webp'

export default function ResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const roomCode = searchParams.get('room')

  const finalScores = useGameStore((s) => s.finalScores)
  const setFinalScores = useGameStore((s) => s.setFinalScores)
  const resetStore = useGameStore((s) => s.reset)

  const [localScores, setLocalScores] = useState<FinalScore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          .select('player_id, username, score')
          .eq('room_id', roomData.id)

        if (playersErr || !playersData) {
          setError('Failed to fetch player scores.')
          return
        }

        const sorted = [...playersData]
          .sort((a, b) => b.score - a.score)
          .map((p, idx) => ({
            playerId: p.player_id,
            username: p.username,
            totalScore: p.score,
            rank: idx + 1,
          }))

        setLocalScores(sorted)
        setFinalScores(sorted)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results.')
      } finally {
        setLoading(false)
      }
    }
    loadResults()
  }, [roomCode, finalScores, setFinalScores])

  function handleLobbyRedirect() {
    playClick()
    resetStore()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="animate-spin h-10 w-10 border-4 border-amber-400 border-t-transparent rounded-full mb-4" />
        <p className="text-slate-400 text-sm font-medium">Calculating final standings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 text-2xl mb-4 font-bold">
          !
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Error Loading Standings</h2>
        <p className="text-slate-400 max-w-sm mb-6 text-sm">{error}</p>
        <button onClick={handleLobbyRedirect}
          className="px-6 py-2.5 rounded-xl font-semibold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all cursor-pointer">
          Back to Lobby
        </button>
      </div>
    )
  }

  const firstPlace = localScores[0]
  const secondPlace = localScores[1]
  const thirdPlace = localScores[2]
  const runnerUps = localScores.slice(3)

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 text-white flex flex-col items-center justify-start px-4 py-8 md:py-12">
      {/* --- Backgrounds --- */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80"
        style={{ backgroundImage: `url(${mainMenuDesktopBg})` }}
      />
      <div
        className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-80"
        style={{ backgroundImage: `url(${mobileBg})` }}
      />
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />

      {/* --- Layout Wrapper --- */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-10">
          <p className="text-xs text-[#c89f59] uppercase tracking-[0.25em] font-serif font-black mb-2 drop-shadow-md">
            Kallanum Policeum
          </p>
          <h1 className="text-4xl sm:text-5xl font-serif font-black uppercase tracking-widest" style={{
            background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 40%, #b8860b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.9))',
          }}>
            Final Results
          </h1>
          {roomCode && (
            <p className="text-xs text-amber-500/80 mt-2 font-mono tracking-widest uppercase">
              Room Code: {roomCode}
            </p>
          )}
        </div>

        {/* Podium section for Top 3 */}
        {localScores.length > 0 && (
          <div className="w-full flex flex-col sm:flex-row items-end justify-center gap-3 sm:gap-4 mb-10 min-h-[220px] sm:min-h-[260px] px-2">
            
            {/* 2nd Place */}
            <div className="order-2 sm:order-1 flex-1 flex flex-col items-center group w-full sm:w-auto mt-4 sm:mt-0">
              {secondPlace ? (
                <>
                  <div className="mb-2 text-center w-full px-2">
                    <span className="text-2xl sm:text-3xl drop-shadow-lg">🥈</span>
                    <p className="text-sm font-serif font-bold text-slate-300 truncate w-full" title={secondPlace.username}>
                      {secondPlace.username}
                    </p>
                    <p className="text-xs font-mono text-[#c89f59]">{secondPlace.totalScore} pts</p>
                  </div>
                  <div className="w-full rounded-t-xl sm:rounded-t-2xl flex items-center justify-center h-16 sm:h-28 transition-transform group-hover:-translate-y-1 duration-300" style={{
                    background: 'linear-gradient(180deg, #334155, #0f172a)',
                    border: '2px solid #64748b',
                    borderBottom: 'none',
                    boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.1), 0 10px 20px rgba(0,0,0,0.6)'
                  }}>
                    <span className="text-3xl sm:text-4xl font-serif font-black text-slate-400 opacity-80">2</span>
                  </div>
                </>
              ) : (
                <div className="h-0 w-full" />
              )}
            </div>

            {/* 1st Place (Winner) */}
            <div className="order-1 sm:order-2 flex-1 flex flex-col items-center group w-full sm:w-auto">
              {firstPlace ? (
                <>
                  <div className="mb-2 text-center scale-110 w-full px-2">
                    <span className="text-4xl block drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] mb-1">👑</span>
                    <p className="text-base font-serif font-black text-amber-300 truncate w-full" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }} title={firstPlace.username}>
                      {firstPlace.username}
                    </p>
                    <p className="text-sm font-mono text-amber-400 font-bold">{firstPlace.totalScore} pts</p>
                  </div>
                  <div className="w-full rounded-t-xl sm:rounded-t-2xl flex items-center justify-center h-20 sm:h-36 transition-transform group-hover:-translate-y-1 duration-300 relative overflow-hidden" style={{
                    background: 'linear-gradient(180deg, #d4af37, #8a6b20)',
                    border: '2px solid #ffe58f',
                    borderBottom: 'none',
                    boxShadow: 'inset 0 4px 15px rgba(255,255,255,0.3), 0 0 30px rgba(212,175,55,0.3), 0 10px 20px rgba(0,0,0,0.8)'
                  }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="text-4xl sm:text-5xl font-serif font-black text-[#fff8e1] relative z-10" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.6)' }}>1</span>
                  </div>
                </>
              ) : (
                <div className="h-0 w-full" />
              )}
            </div>

            {/* 3rd Place */}
            <div className="order-3 flex-1 flex flex-col items-center group w-full sm:w-auto mt-4 sm:mt-0">
              {thirdPlace ? (
                <>
                  <div className="mb-2 text-center w-full px-2">
                    <span className="text-2xl sm:text-3xl drop-shadow-lg">🥉</span>
                    <p className="text-sm font-serif font-bold text-orange-400 truncate w-full" title={thirdPlace.username}>
                      {thirdPlace.username}
                    </p>
                    <p className="text-xs font-mono text-[#c89f59]">{thirdPlace.totalScore} pts</p>
                  </div>
                  <div className="w-full rounded-t-xl sm:rounded-t-2xl flex items-center justify-center h-12 sm:h-20 transition-transform group-hover:-translate-y-1 duration-300" style={{
                    background: 'linear-gradient(180deg, #9a5f2a, #4a2810)',
                    border: '2px solid #b87333',
                    borderBottom: 'none',
                    boxShadow: 'inset 0 4px 10px rgba(255,255,255,0.1), 0 10px 20px rgba(0,0,0,0.6)'
                  }}>
                    <span className="text-2xl sm:text-3xl font-serif font-black text-orange-300/80">3</span>
                  </div>
                </>
              ) : (
                <div className="h-0 w-full" />
              )}
            </div>
            
          </div>
        )}

        {/* Runner ups */}
        {runnerUps.length > 0 && (
          <div className="w-full mb-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#c89f59]/50" />
              <p className="text-xs font-serif font-bold text-[#c89f59] uppercase tracking-[0.2em] whitespace-nowrap">Other Standings</p>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#c89f59]/50" />
            </div>
            <div className="space-y-3">
              {runnerUps.map((player) => (
                <div key={player.playerId} className="flex items-center justify-between px-5 py-3 rounded-xl transition-all" style={{
                  background: 'linear-gradient(180deg, rgba(20,12,7,0.8) 0%, rgba(10,6,3,0.9) 100%)',
                  border: '1px solid rgba(200,159,89,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-serif font-black text-[#c89f59] w-6 opacity-60">#{player.rank}</span>
                    <span className="text-[15px] font-serif font-bold text-white/90">{player.username}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-500">{player.totalScore} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="w-full mt-4">
          <button
            onClick={handleLobbyRedirect}
            className="w-full relative group rounded-xl p-[2px] transition-all duration-150 active:scale-[0.98] focus:outline-none"
            style={{
              background: 'linear-gradient(180deg, #ffe58f, #a67c00)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.8)'
            }}
          >
            <div className="w-full py-4 rounded-[10px] flex items-center justify-center transition-all group-hover:brightness-110" style={{
              background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
              boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4)'
            }}>
              <span className="font-serif font-black text-lg tracking-[0.15em] uppercase" style={{
                background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 50%, #d4af37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))'
              }}>
                Return to Main Menu
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
