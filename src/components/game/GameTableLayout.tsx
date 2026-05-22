import { useMemo, useState, useEffect } from 'react'
import type { Player } from '../../types/game'
import { avatarKeyToUrl } from '../../utils/avatarMap'
import { useProfileStore } from '../../stores/profileStore'
import { useGameStore } from '../../stores/gameStore'
import mainGameMobile from '../../assets/main_game.png'
import mainGameDesktop from '../../assets/main_game_desktop.png'

interface GameTableLayoutProps {
  players: Player[]
  myPlayerId: string | null
  policeId: string | null
  /** Currently selected player (for police selection highlight) */
  selectedPlayerId?: string | null
  /** Called when a player seat is tapped */
  onPlayerTap?: (playerId: string) => void
  /** Whether player tapping is enabled */
  interactable?: boolean
  /** Center content (e.g. role info, round info, etc.) */
  centerContent?: React.ReactNode
  /** Bottom bar content (role card, action buttons, etc.) */
  bottomContent?: React.ReactNode
  /** Top bar content (round info, etc.) */
  topContent?: React.ReactNode
}

export default function GameTableLayout({
  players,
  myPlayerId,
  policeId,
  selectedPlayerId,
  onPlayerTap,
  interactable = false,
  centerContent,
  bottomContent,
  topContent,
}: GameTableLayoutProps) {
  const { avatar: myAvatar } = useProfileStore()
  const pointers = useGameStore((s) => s.pointers)
  const emotes = useGameStore((s) => s.emotes)
  const [now, setNow] = useState(Date.now())

  // Force re-render periodically to clear old emotes
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate positions for each player around the circle
  const playerPositions = useMemo(() => {
    const count = players.length
    if (count === 0) return []

    return players.map((player, index) => {
      // Start from top (-90deg) and go clockwise
      const angle = ((index / count) * 2 * Math.PI) - (Math.PI / 2)
      // Use percentage-based positioning (50% = center)
      const radiusX = 38 // % from center
      const radiusY = 34 // % from center (slightly less for oval)
      const x = 50 + radiusX * Math.cos(angle)
      const y = 50 + radiusY * Math.sin(angle)
      return { player, x, y, angle }
    })
  }, [players])

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0604]">
      {/* Backgrounds */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mainGameDesktop})` }}
      />
      <div
        className="md:hidden absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${mainGameMobile})` }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Top Content */}
      {topContent && (
        <div className="absolute top-0 left-0 right-0 z-30 pt-3 pb-2 px-4 flex justify-center">
          {topContent}
        </div>
      )}

      {/* ═══ THE TABLE ═══ */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-[500px] aspect-square">

          {/* Table circle visual (subtle overlay to define the table area) */}
          <div className="absolute inset-[8%] rounded-full pointer-events-none" style={{
            background: 'radial-gradient(circle, rgba(90,55,20,0.08) 0%, transparent 70%)',
          }} />

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="flex flex-col items-center pointer-events-auto">
              {centerContent || <DefaultCenterContent />}
            </div>
          </div>

          {/* SVG Layer for Finger Pointing Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15" style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.6))' }}>
            <defs>
              <linearGradient id="pointerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4af37" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {Object.entries(pointers).map(([fromId, toId]) => {
              const fromPos = playerPositions.find(p => p.player.id === fromId)
              const toPos = playerPositions.find(p => p.player.id === toId)
              if (!fromPos || !toPos) return null

              return (
                <line
                  key={`${fromId}-${toId}`}
                  x1={`${fromPos.x}%`}
                  y1={`${fromPos.y}%`}
                  x2={`${toPos.x}%`}
                  y2={`${toPos.y}%`}
                  stroke="url(#pointerGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  className="opacity-70"
                  style={{ animation: 'dashMove 2s linear infinite' }}
                />
              )
            })}
          </svg>

          {/* Player seats */}
          {playerPositions.map(({ player, x, y }) => {
            const isMe = player.id === myPlayerId
            const isPolice = player.id === policeId
            const isSelected = player.id === selectedPlayerId
            const resolvedAvatar = avatarKeyToUrl(player.avatarKey) || (isMe ? myAvatar : null)
            const activeEmote = emotes[player.id]
            const isEmoting = activeEmote && (now - activeEmote.timestamp < 3500)

            return (
              <div
                key={player.id}
                className="absolute z-20"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <button
                  onClick={() => interactable && onPlayerTap?.(player.id)}
                  disabled={!interactable}
                  className={`flex flex-col items-center gap-1 transition-all duration-300 focus:outline-none ${
                    interactable ? 'cursor-pointer active:scale-95' : 'cursor-default'
                  } ${isSelected ? 'scale-110' : ''}`}
                >
                  {/* Police badge above avatar */}
                  {isPolice && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 animate-pulse">
                      <div className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1" style={{
                        background: 'linear-gradient(180deg, #3b82f6, #1d4ed8)',
                        color: '#eff6ff',
                        boxShadow: '0 0 15px rgba(59,130,246,0.8), 0 4px 6px rgba(0,0,0,0.6)',
                        border: '1px solid rgba(147,197,253,0.8)',
                      }}>
                        <svg className="w-3 h-3 text-blue-200" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        </svg>
                        Police
                      </div>
                    </div>
                  )}

                  {/* Floating Emote */}
                  {isEmoting && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
                         style={{ animation: 'floatUpAndFade 3s ease-out forwards' }}>
                      <span className="text-4xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter">
                        {activeEmote.emoji}
                      </span>
                    </div>
                  )}

                  {/* Avatar container with ornate border */}
                  <div className={`relative transition-all duration-300 ${isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-transparent' : ''}`} style={{ borderRadius: '50%' }}>
                    {/* Outer golden or blue ring */}
                    <div className="rounded-full p-[2.5px]" style={{
                      background: isPolice
                        ? 'linear-gradient(135deg, #60a5fa, #2563eb, #60a5fa)'
                        : isSelected
                        ? 'linear-gradient(135deg, #ffe58f, #d4af37, #ffe58f)'
                        : isMe
                        ? 'linear-gradient(135deg, #d4af37, #8a6b20, #d4af37)'
                        : 'linear-gradient(135deg, #8a6b20, #5a3e15, #8a6b20)',
                      boxShadow: isPolice
                        ? '0 0 20px rgba(59,130,246,0.8), 0 0 40px rgba(59,130,246,0.4)'
                        : isSelected
                        ? '0 0 20px rgba(212,175,55,0.6), 0 0 40px rgba(212,175,55,0.2)'
                        : isMe
                        ? '0 0 12px rgba(212,175,55,0.3)'
                        : '0 4px 8px rgba(0,0,0,0.6)',
                    }}>
                      {/* Inner dark ring */}
                      <div className="rounded-full p-[1.5px]" style={{
                        background: 'linear-gradient(180deg, #1a0f08, #0d0704)',
                      }}>
                        {/* Inner gold accent */}
                        <div className="rounded-full p-[1px]" style={{
                          background: 'linear-gradient(135deg, #c89f59, #5a3e15)',
                        }}>
                          {/* Avatar image */}
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full overflow-hidden flex items-center justify-center" style={{
                            background: 'linear-gradient(180deg, #1a0f08, #0d0704)',
                            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.9)',
                          }}>
                            {resolvedAvatar ? (
                              <img src={resolvedAvatar} alt={player.username} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connection indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d0704] ${
                      player.isConnected
                        ? 'bg-[#5ce65c] shadow-[0_0_6px_rgba(92,230,92,0.6)]'
                        : 'bg-[#e65c5c]'
                    }`} />
                  </div>

                  {/* Player name */}
                  <div className="mt-1 px-2 py-0.5 rounded-md max-w-[80px] sm:max-w-[90px]" style={{
                    background: 'rgba(13,7,4,0.85)',
                    border: '1px solid rgba(90,66,41,0.3)',
                  }}>
                    <span className={`text-[9px] sm:text-[10px] font-serif font-bold tracking-wider truncate block text-center ${
                      isMe ? 'text-[#ffe58f]' : 'text-[#c89f59]'
                    }`}>
                      {player.username}
                      {isMe && <span className="text-[#8a6b20] ml-0.5">(You)</span>}
                    </span>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom Content */}
      {bottomContent && (
        <div className="fixed bottom-0 left-0 right-0 z-30 pb-4 px-4 flex flex-col items-center gap-2 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-[420px]">
            {bottomContent}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dashMove {
          from { stroke-dashoffset: 14; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes floatUpAndFade {
          0% { opacity: 0; transform: translate(-50%, 10px) scale(0.5); }
          15% { opacity: 1; transform: translate(-50%, -10px) scale(1.2); }
          30% { transform: translate(-50%, -5px) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -20px) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -40px) scale(0.8); }
        }
      `}</style>
    </div>
  )
}

function DefaultCenterContent() {
  return (
    <div className="flex flex-col items-center opacity-40">
      {/* Mask watermark */}
      <svg width="60" height="44" viewBox="0 0 40 28" fill="none" className="drop-shadow-lg">
        <path d="M20 2C14 2 10 8 10 12C10 16 14 20 16 20C18 20 18 18 20 16C22 18 22 20 24 20C26 20 30 16 30 12C30 8 26 2 20 2Z" fill="#c89f59" stroke="#5a3e15" strokeWidth="0.8"/>
        <circle cx="15" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5"/>
        <circle cx="25" cy="11" r="2.5" fill="#0d0704" stroke="#5a3e15" strokeWidth="0.5"/>
        <path d="M17 16 Q20 19 23 16" stroke="#5a3e15" strokeWidth="0.8" fill="none"/>
      </svg>
    </div>
  )
}
