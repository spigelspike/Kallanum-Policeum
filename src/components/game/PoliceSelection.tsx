import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { avatarKeyToUrl } from '../../utils/avatarMap'
import { useProfileStore } from '../../stores/profileStore'
import { supabase } from '../../lib/supabase'
import { useLanguageStore } from '../../stores/languageStore'

interface PoliceSelectionProps {
  selectedId: string | null
  onClearSelection: () => void
  timeLeft: number
}

export default function PoliceSelection({ selectedId, onClearSelection }: PoliceSelectionProps) {
  const room = useGameStore((s) => s.room)
  const players = useGameStore((s) => s.players)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const policeId = useGameStore((s) => s.policeId)
  const { avatar: myAvatar } = useProfileStore()
  const { t } = useLanguageStore()

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (myPlayerId !== policeId) return null

  const selectedPlayer = players.find((p) => p.id === selectedId)

  async function handleAccuse(forcedAccuseId?: string) {
    const targetId = typeof forcedAccuseId === 'string' ? forcedAccuseId : selectedId
    if (!room || !targetId) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const response = await supabase.functions.invoke('make-accusation', {
        body: { roomId: room.id, accusedPlayerId: targetId },
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
        setError(msg)
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit accusation')
    } finally {
      setLoading(false)
    }
  }

  // Auto-accuse on timeout is now handled globally in DiscussionPhase.tsx
  if (submitted) {
    return (
      <div className="w-full rounded-lg py-3 text-center" style={{
        background: 'linear-gradient(180deg, rgba(120,53,15,0.8), rgba(80,30,10,0.9))',
        border: '1px solid rgba(251,146,60,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}>
        <span className="font-serif text-orange-300 text-xs sm:text-sm font-bold tracking-wider animate-pulse">
          {t.game.accusationSubmitted}
        </span>
      </div>
    )
  }

  // ─── Confirmation dialog ───
  if (selectedId && selectedPlayer) {
    const resolvedAvatar = avatarKeyToUrl(selectedPlayer.avatarKey) || (selectedPlayer.id === myPlayerId ? myAvatar : null)

    return (
      <div className="w-full rounded-xl overflow-hidden" style={{
        background: 'linear-gradient(180deg, rgba(26,15,8,0.95), rgba(13,7,4,0.95))',
        border: '1px solid rgba(90,66,41,0.5)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
      }}>
        <div className="px-4 py-4 flex flex-col items-center gap-3">
          {/* Target avatar */}
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#c89f59] shadow-lg" style={{
            boxShadow: '0 0 20px rgba(212,175,55,0.3)',
          }}>
            {resolvedAvatar ? (
              <img src={resolvedAvatar} alt={selectedPlayer.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1a0f08] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>

          <p className="font-serif text-sm text-[#c89f59] text-center">
            {t.game.accusePrompt.replace('{{name}}', selectedPlayer.username)}
          </p>

          <div className="flex gap-3 w-full">
            {/* Cancel */}
            <button
              onClick={onClearSelection}
              disabled={loading}
              className="flex-1 rounded-lg py-2.5 transition-all active:scale-95 focus:outline-none disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, rgba(60,42,26,0.9), rgba(30,20,10,0.9))',
                border: '1px solid rgba(90,66,41,0.4)',
                color: '#c89f59',
              }}
            >
              <span className="font-serif font-bold text-xs uppercase tracking-widest">{t.common.cancel}</span>
            </button>

            {/* Confirm */}
            <button
              onClick={() => handleAccuse()}
              disabled={loading}
              className="flex-[2] relative group rounded-lg active:scale-95 transition-all focus:outline-none disabled:opacity-50"
            >
              <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                background: 'linear-gradient(180deg, #ffe58f, #a67c00)',
              }} />
              <div className="relative rounded-lg py-2.5 flex items-center justify-center" style={{
                background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4)',
              }}>
                <span className="font-serif font-black text-xs tracking-[0.15em] uppercase" style={{
                  background: 'linear-gradient(180deg, #fff8e1, #ffe58f, #d4af37)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  {loading ? t.game.submittingAccusation : t.game.confirmAccusation}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Empty state (waiting for selection) ───
  return (
    <div className="w-full">
      <div className="w-full rounded-lg py-3 text-center" style={{
        background: 'linear-gradient(180deg, rgba(13,7,4,0.9), rgba(26,15,8,0.85))',
        border: '1px solid rgba(90,66,41,0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}>
        <span className="font-serif text-[#c89f59] text-xs sm:text-sm italic tracking-wide animate-pulse">
          {t.game.tapToAccuse}
        </span>
      </div>
      {error && (
        <div className="mt-2 text-center">
          <span className="text-[#ff6b6b] font-serif text-xs font-bold">{error}</span>
        </div>
      )}
    </div>
  )
}
