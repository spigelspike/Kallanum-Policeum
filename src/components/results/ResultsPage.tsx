import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../../stores/gameStore'
import { supabase } from '../../lib/supabase'
import type { FinalScore } from '../../types/game'

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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-violet-600/10 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-10 z-10">
        <p className="text-xs text-slate-400 uppercase tracking-[0.2em] font-semibold mb-2">
          Kallanum Policeum
        </p>
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
          Final Results
        </h1>
        {roomCode && (
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Room Code: {roomCode.toUpperCase()}
          </p>
        )}
      </div>

      {/* Podium section for Top 3 */}
      {localScores.length > 0 && (
        <div className="w-full max-w-lg flex items-end justify-center gap-2 mb-10 z-10 min-h-[260px] px-2">
          {/* 2nd Place */}
          {secondPlace ? (
            <div className="flex-1 flex flex-col items-center group">
              <div className="mb-2 text-center">
                <span className="text-2xl">🥈</span>
                <p className="text-sm font-semibold text-slate-300 truncate max-w-[100px]" title={secondPlace.username}>
                  {secondPlace.username}
                </p>
                <p className="text-xs font-mono text-slate-400">{secondPlace.totalScore} pts</p>
              </div>
              <div className="w-full bg-slate-900 border border-slate-700/50 rounded-t-2xl flex items-center justify-center h-28 shadow-lg transition-transform group-hover:-translate-y-1 duration-300">
                <span className="text-3xl font-black text-slate-500">2</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 h-0" />
          )}

          {/* 1st Place (Winner) */}
          {firstPlace && (
            <div className="flex-1 flex flex-col items-center group">
              <div className="mb-2 text-center scale-110">
                <span className="text-3xl block animate-bounce duration-1000">👑</span>
                <p className="text-base font-bold text-amber-300 truncate max-w-[120px]" title={firstPlace.username}>
                  {firstPlace.username}
                </p>
                <p className="text-xs font-mono text-amber-400/90 font-semibold">{firstPlace.totalScore} pts</p>
              </div>
              <div className="w-full bg-gradient-to-b from-amber-400/20 to-amber-950/40 border border-amber-400/40 rounded-t-2xl flex items-center justify-center h-36 shadow-[0_0_30px_rgba(251,191,36,0.15)] transition-transform group-hover:-translate-y-1 duration-300">
                <span className="text-4xl font-black text-amber-400">1</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace ? (
            <div className="flex-1 flex flex-col items-center group">
              <div className="mb-2 text-center">
                <span className="text-2xl">🥉</span>
                <p className="text-sm font-semibold text-amber-700 truncate max-w-[100px]" title={thirdPlace.username}>
                  {thirdPlace.username}
                </p>
                <p className="text-xs font-mono text-slate-400">{thirdPlace.totalScore} pts</p>
              </div>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-t-2xl flex items-center justify-center h-20 shadow-md transition-transform group-hover:-translate-y-1 duration-300">
                <span className="text-2xl font-black text-amber-700">3</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 h-0" />
          )}
        </div>
      )}

      {/* Runner ups and full list */}
      {runnerUps.length > 0 && (
        <div className="w-full max-w-sm mb-10 z-10">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Other Standings</p>
          <div className="space-y-2">
            {runnerUps.map((player) => (
              <div key={player.playerId} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-5">#{player.rank}</span>
                  <span className="text-slate-300 font-medium">{player.username}</span>
                </div>
                <span className="font-mono font-semibold text-slate-400">{player.totalScore} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="w-full max-w-sm z-10">
        <button
          onClick={handleLobbyRedirect}
          className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-amber-500/10"
        >
          Return to Lobby
        </button>
      </div>
    </div>
  )
}
