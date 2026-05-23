import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { supabase } from '../../lib/supabase'
import { playEmote, playClick } from '../../utils/sounds'
import { useLanguageStore } from '../../stores/languageStore'
import GameTableLayout from './GameTableLayout'
import PoliceSelection from './PoliceSelection'
import TutorialOverlay from './TutorialOverlay'

const EMOTES = ['🤨', '😇', '😡', '🤡', '🤫']

export default function DiscussionPhase() {
  const room = useGameStore((s) => s.room)
  const players = useGameStore((s) => s.players)
  const policeId = useGameStore((s) => s.policeId)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const myRole = useGameStore((s) => s.myRole)
  const myRolePoints = useGameStore((s) => s.myRolePoints)
  const { t } = useLanguageStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const isPolice = myPlayerId === policeId
  const policePlayer = players.find((p) => p.id === policeId)

  if (!room) return null

  // The server only uses DISCUSSION for both discussing and accusing
  const isPolicePhase = room.phase === 'DISCUSSION' || room.phase === 'POLICE_SELECTION'

  const [timeLeft, setTimeLeft] = useState(() => {
    if (!room || !room.phaseEndsAt) return 60
    return Math.max(0, Math.floor((new Date(room.phaseEndsAt).getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    if (!room || room.phase !== 'DISCUSSION') return
    const interval = setInterval(() => {
      setTimeLeft(() => {
        if (!room.phaseEndsAt) return 0
        const diff = Math.floor((new Date(room.phaseEndsAt).getTime() - Date.now()) / 1000)
        if (diff <= 0) {
          clearInterval(interval)
          return 0
        }
        return diff
      })
    }, 500) // 500ms for more responsive updates
    return () => clearInterval(interval)
  }, [room?.phase, room?.phaseEndsAt])

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0) {
      playClick() // Ticking sound effect for urgency
    }
  }, [timeLeft])

  const handleEmote = (emoji: string) => {
    if (!room || !myPlayerId) return
    playEmote()
    const channel = supabase.channel(`room:${room.id}`)
    channel.send({
      type: 'broadcast',
      event: 'EMOTE',
      payload: { playerId: myPlayerId, emoji }
    })
    useGameStore.getState().setEmote(myPlayerId, emoji)
  }

  const handlePlayerTap = (id: string) => {
    if (id === myPlayerId) return

    playClick()

    if (isPolice && isPolicePhase) {
      setSelectedId(id)
    } else {
      if (!room || !myPlayerId) return
      const currentPointer = useGameStore.getState().pointers[myPlayerId]
      const toId = currentPointer === id ? null : id
      
      const channel = supabase.channel(`room:${room.id}`)
      channel.send({
        type: 'broadcast',
        event: 'POINTING',
        payload: { fromId: myPlayerId, toId }
      })
      useGameStore.getState().setPointer(myPlayerId, toId)
    }
  }

  // ── Top bar: Round info + Police announcement ──
  const topContent = (
    <div className="flex flex-col items-center gap-1.5">
      {/* Round badge */}
      <div className="px-4 py-1.5 rounded-full" style={{
        background: 'linear-gradient(180deg, rgba(13,7,4,0.9), rgba(26,15,8,0.85))',
        border: '1px solid rgba(90,66,41,0.4)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
      }}>
        <span className="font-serif font-bold text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#c89f59]">
          {t.game.round} {room.currentRound} {t.game.of} {room.totalRounds}
        </span>
      </div>

      {/* Police announcement */}
      {policePlayer && (
        <div className="px-3 py-1 rounded-full flex items-center gap-2" style={{
          background: 'linear-gradient(180deg, rgba(30,58,138,0.7), rgba(15,23,42,0.8))',
          border: '1px solid rgba(59,130,246,0.3)',
          boxShadow: '0 0 15px rgba(59,130,246,0.15)',
        }}>
          <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
          </svg>
          <span className="text-blue-300 font-serif font-bold text-[10px] sm:text-xs tracking-wider">
            {policePlayer.username}
          </span>
          <span className="text-blue-400/60 text-[9px] sm:text-[10px] font-serif">{t.game.isThePolice}</span>
        </div>
      )}

      {/* Animated Timer Bar */}
      <div className={`w-full max-w-[180px] sm:max-w-[220px] mt-1 relative h-6 rounded-full overflow-hidden border shadow-lg ${timeLeft <= 10 ? 'border-red-500/60 animate-pulse' : 'border-[#c89f59]/40'}`} style={{
        background: 'linear-gradient(180deg, #1a0f08, #0a0604)',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.9)'
      }}>
        {/* Progress Fill */}
        <div 
          className="absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-linear"
          style={{ 
            width: `${(timeLeft / 60) * 100}%`,
            background: timeLeft <= 10 
              ? 'linear-gradient(90deg, #7f1d1d, #ef4444)' 
              : 'linear-gradient(90deg, #7a5a18, #d4af37)',
            boxShadow: timeLeft <= 10 ? '0 0 15px rgba(239,68,68,0.8)' : '0 0 10px rgba(212,175,55,0.4)',
          }}
        />
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`font-serif font-black text-[10px] sm:text-[11px] tracking-[0.25em] uppercase z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${timeLeft <= 10 ? 'text-[#fee2e2]' : 'text-[#fff8e1]'}`}>
            {timeLeft === 0 ? t.game.timeUp : `0:${timeLeft.toString().padStart(2, '0')}`}
          </span>
        </div>
      </div>

      {/* Phase indicator */}
      {isPolicePhase && (
        <div className="px-3 py-1 rounded-full" style={{
          background: 'linear-gradient(180deg, rgba(120,53,15,0.7), rgba(80,20,10,0.8))',
          border: '1px solid rgba(251,146,60,0.3)',
        }}>
          <span className="text-orange-300 font-serif font-bold text-[9px] sm:text-[10px] tracking-wider uppercase animate-pulse">
            {isPolice ? t.game.selectThief : t.game.policeIsChoosing}
          </span>
        </div>
      )}
    </div>
  )

  // ── Center content: Discussion phase indicator ──
  const centerContent = (
    <div className="flex flex-col items-center gap-2 opacity-50">
      {/* Mask watermark */}
      <svg width="50" height="36" viewBox="0 0 40 28" fill="none" className="drop-shadow-lg">
        <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" fill="#c89f59" stroke="#5a3e15" strokeWidth="0.8"/>
        <circle cx="15" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5"/>
        <circle cx="25" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5"/>
        <path d="M17 16 Q20 19 23 16" stroke="#5a3e15" strokeWidth="0.8" fill="none"/>
      </svg>
      <span className="text-[#c89f59] font-serif text-[10px] tracking-widest uppercase">
        {isPolicePhase ? t.game.accusation : t.game.discussion}
      </span>
    </div>
  )

  // ── Bottom content: Role card + Police selection ──
  const bottomContent = (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Police selection (only for police during POLICE_SELECTION phase) */}
      {isPolice && isPolicePhase && (
        <div className="w-full">
          <PoliceSelection 
            selectedId={selectedId}
            onClearSelection={() => setSelectedId(null)}
            timeLeft={timeLeft}
          />
        </div>
      )}

      {/* Non-police waiting message during selection */}
      {!isPolice && isPolicePhase && (
        <div className="w-full rounded-lg py-3 text-center" style={{
          background: 'linear-gradient(180deg, rgba(13,7,4,0.9), rgba(26,15,8,0.85))',
          border: '1px solid rgba(90,66,41,0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        }}>
          <span className="font-serif text-[#c89f59] text-xs sm:text-sm italic tracking-wide">
            {t.game.waitingForPolice}
          </span>
        </div>
      )}

      {/* Emote Bar */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-2 w-full">
        {EMOTES.map(emoji => (
          <button
            key={emoji}
            onClick={() => handleEmote(emoji)}
            className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full text-xl sm:text-2xl transition-transform active:scale-90 hover:scale-110"
            style={{
              background: 'linear-gradient(180deg, rgba(44,26,14,0.9), rgba(26,15,8,0.95))',
              border: '1px solid rgba(212,175,55,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* My role card */}
      {myRole && (
        <RoleCard role={myRole} points={myRolePoints} />
      )}
    </div>
  )

  return (
    <>
      <TutorialOverlay />
      <GameTableLayout
        players={players}
        myPlayerId={myPlayerId}
        policeId={policeId}
        selectedPlayerId={selectedId}
        onPlayerTap={handlePlayerTap}
        interactable={true}
        centerContent={centerContent}
        topContent={topContent}
        bottomContent={bottomContent}
      />
    </>
  )
}

/* ─── Role Card (bottom strip) ─── */
function RoleCard({ role, points }: { role: string; points: number | null }) {
  const { t } = useLanguageStore()
  const isPolice = role === 'Police'
  const isThief = role === 'Thief'

  const bgStyle = isPolice
    ? { background: 'linear-gradient(90deg, rgba(30,58,138,0.85), rgba(15,23,42,0.9))', border: '1px solid rgba(59,130,246,0.4)' }
    : isThief
    ? { background: 'linear-gradient(90deg, rgba(127,29,29,0.85), rgba(60,10,10,0.9))', border: '1px solid rgba(239,68,68,0.4)' }
    : { background: 'linear-gradient(90deg, rgba(26,15,8,0.9), rgba(13,7,4,0.9))', border: '1px solid rgba(90,66,41,0.4)' }

  const textColor = isPolice ? '#93c5fd' : isThief ? '#fca5a5' : '#ffe58f'
  const labelColor = isPolice ? '#3b82f6' : isThief ? '#ef4444' : '#c89f59'

  return (
    <div className="w-full rounded-lg px-4 py-2.5 flex items-center justify-between" style={{
      ...bgStyle,
      boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
    }}>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-serif uppercase tracking-widest" style={{ color: labelColor }}>
          {t.game.yourRole}
        </span>
        <span className="font-serif font-black text-base tracking-wider" style={{ color: textColor }}>
          {t.roles[role.toLowerCase() as keyof typeof t.roles] || role}
        </span>
      </div>
      {(points ?? 0) > 0 && (
        <span className="text-[10px] font-serif tracking-wider" style={{ color: labelColor }}>
          {points} {t.game.pointsPerRound}
        </span>
      )}
    </div>
  )
}
