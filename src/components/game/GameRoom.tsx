import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useRealtimeRoom } from '../../hooks/useRealtimeRoom'
import WaitingLobby from './WaitingLobby'
import RoleReveal from './RoleReveal'
import DiscussionPhase from './DiscussionPhase'
import RoundResult from './RoundResult'

export default function GameRoom() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const room = useGameStore((s) => s.room)
  const phase = room?.phase ?? null


  // Connect to realtime channel
  const { connected, status } = useRealtimeRoom({
    roomId: room?.id ?? '',
    roomCode: code ?? '',
  })

  // Redirect if no room data (e.g. direct URL access without joining)
  useEffect(() => {
    if (!room) {
      navigate('/')
    }
  }, [room, navigate])

  // Redirect to results on FINAL_RESULTS
  useEffect(() => {
    if (phase === 'FINAL_RESULTS') {
      navigate(`/results?room=${code}`)
    }
  }, [phase, code, navigate])

  if (!room || !code) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Connection indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 text-xs text-slate-400">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        {connected ? 'Connected' : `Reconnecting... (${status})`}
      </div>

      {/* Phase rendering */}
      {phase === 'WAITING' && <WaitingLobby />}

      {phase === 'DISCUSSION' && (
        <>
          {/* Show RoleReveal overlay if role just arrived and hasn't been dismissed */}
          <RoleReveal />
          <DiscussionPhase />
        </>
      )}

      {phase === 'POLICE_SELECTION' && <DiscussionPhase />}

      {phase === 'ROUND_RESULT' && <RoundResult />}
    </div>
  )
}
