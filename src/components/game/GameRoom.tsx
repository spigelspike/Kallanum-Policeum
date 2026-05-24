import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { useRealtimeRoom } from '../../hooks/useRealtimeRoom'
import { useLanguageStore } from '../../stores/languageStore'
import WaitingLobby from './WaitingLobby'
import RoleReveal from './RoleReveal'
import DiscussionPhase from './DiscussionPhase'
import RoundResult from './RoundResult'
import AgoraVoiceManager from './AgoraVoiceManager'
import VoiceControls from './VoiceControls'

export default function GameRoom() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const room = useGameStore((s) => s.room)
  const phase = room?.phase ?? null
  const { t } = useLanguageStore()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)


  // Connect to realtime channel
  const { connected, status } = useRealtimeRoom({
    roomId: room?.id ?? '',
    roomCode: code ?? '',
  })

  // Redirect if no room data (e.g. direct URL access without joining)
  useEffect(() => {
    if (!room) {
      navigate('/not-found')
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
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 text-xs text-slate-400 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        {connected ? t.common.connected : `${t.common.reconnecting} (${status})`}
      </div>

      {/* Voice Chat System */}
      <AgoraVoiceManager />
      <VoiceControls />

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

      {/* Leave Game Button */}
      <button
        onClick={() => setShowLeaveConfirm(true)}
        className="fixed bottom-4 right-4 z-40 bg-red-900/40 hover:bg-red-900/60 text-red-200/80 hover:text-red-100 p-2 sm:p-2.5 rounded-full border border-red-500/20 backdrop-blur-md transition-all shadow-lg"
        title="Leave Game"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>

      {/* Leave Game Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)} />
          <div className="relative w-full max-w-sm p-6 rounded-xl text-center animate-in fade-in zoom-in-95" style={{
            background: 'linear-gradient(180deg, rgba(26,15,8,0.95), rgba(13,7,4,0.95))',
            border: '1px solid rgba(212,175,55,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
          }}>
            <h3 className="text-xl font-serif text-[#ffe58f] mb-4">Leave Game?</h3>
            <p className="text-sm text-slate-300 mb-8 font-serif">
              Are you sure you want to return to the main menu? You will disconnect from the current room.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-lg font-serif text-[#c89f59] border border-[#c89f59]/30 hover:bg-[#c89f59]/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 rounded-lg font-serif text-white bg-red-700 hover:bg-red-600 transition-colors shadow-lg"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
