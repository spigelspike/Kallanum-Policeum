import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { avatarKeyToUrl } from '../../utils/avatarMap'
import { useProfileStore } from '../../stores/profileStore'
import { playWin, playLose } from '../../utils/sounds'
import { supabase } from '../../lib/supabase'
import { useLanguageStore } from '../../stores/languageStore'
import mainGameMobile from '../../assets/main_game.webp'
import mainGameDesktop from '../../assets/main_game_desktop.webp'

export default function RoundResult() {
  const room = useGameStore((s) => s.room)
  const players = useGameStore((s) => s.players)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const lastResult = useGameStore((s) => s.lastResult)
  const { avatar: myAvatar } = useProfileStore()
  const { t } = useLanguageStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHost = room?.hostId === myPlayerId
  const hostPlayer = players.find(p => p.id === room?.hostId)
  const isHostDisconnected = hostPlayer && !hostPlayer.isConnected
  const canAdvance = isHost || isHostDisconnected
  const isFinalRound = room ? room.currentRound >= room.totalRounds : false

  async function handleNextRound() {
    if (!room) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const response = await supabase.functions.invoke('next-round', {
        body: { roomId: room.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (response.error) {
        setError(response.error.message || 'Failed to proceed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed')
    } finally {
      setLoading(false)
    }
  }

  async function handleEndGame() {
    if (!room) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Not authenticated'); return }
      const response = await supabase.functions.invoke('next-round', {
        body: { roomId: room.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (response.error) {
        setError(response.error.message || 'Failed to end game')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end game')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!lastResult) return
    if (lastResult.correctGuess) {
      playWin()
    } else {
      playLose()
    }
  }, [lastResult?.correctGuess])

  if (!room || !lastResult) return null

  const thiefPlayer = players.find((p) => p.id === lastResult.thiefId)
  const accusedPlayer = players.find((p) => p.id === lastResult.accusedId)
  const policePlayer = players.find((p) => p.id === lastResult.policeId)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0604]">
      {/* Backgrounds */}
      <div className="hidden md:block absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${mainGameDesktop})` }} />
      <div className="md:hidden absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${mainGameMobile})` }} />
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 py-12">

        {/* ═══ Result Card (The Plate) ═══ */}
        <div className="w-full max-w-[460px]" style={{ animation: 'resultReveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>

          {/* Crown */}
          <div className="flex justify-center mb-[-12px] relative z-30">
            <svg width="48" height="36" viewBox="0 0 48 36" fill="none">
              <path d="M24 0L28 14L36 6L32 20H16L12 6L20 14L24 0Z" fill="url(#crownResult)" stroke="#5a3e15" strokeWidth="1"/>
              <circle cx="24" cy="4" r="2.5" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
              <circle cx="13" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
              <circle cx="35" cy="8" r="1.8" fill="#ffe58f" stroke="#a67c00" strokeWidth="0.5"/>
              <rect x="14" y="20" width="20" height="4" rx="1" fill="url(#crownResult)" stroke="#5a3e15" strokeWidth="0.5"/>
              <defs>
                <linearGradient id="crownResult" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffe58f"/><stop offset="50%" stopColor="#d4af37"/><stop offset="100%" stopColor="#8a6b20"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Layer 1 */}
          <div className="rounded-[22px] p-[3px]" style={{ background: 'linear-gradient(145deg, #2a1a0a, #0d0805, #2a1a0a)' }}>
            {/* Layer 2 */}
            <div className="rounded-[19px] p-[4px]" style={{ background: 'linear-gradient(160deg, #d4af37 0%, #a67c00 20%, #593d19 40%, #a67c00 60%, #d4af37 80%, #8a6b20 100%)' }}>
              {/* Layer 3 */}
              <div className="rounded-[15px] p-[2px]" style={{ background: 'linear-gradient(145deg, #1a1008, #0a0604)' }}>
                {/* Layer 4 */}
                <div className="rounded-[13px] p-[1px]" style={{ background: 'linear-gradient(160deg, #c89f59 0%, #5a4229 30%, #c89f59 60%, #5a4229 100%)' }}>
                  {/* Layer 5: Body */}
                  <div className="rounded-[12px] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #2c1a0e 0%, #1a0f08 30%, #140b06 70%, #0d0704 100%)' }}>

                    {/* Leather texture */}
                    <div className="absolute inset-0 pointer-events-none opacity-60" style={{
                      background: `radial-gradient(ellipse at 30% 20%, rgba(139,90,43,0.25) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, rgba(139,90,43,0.15) 0%, transparent 50%),
                        radial-gradient(ellipse at 50% 50%, rgba(90,55,20,0.3) 0%, transparent 70%)`
                    }} />
                    <div className="absolute inset-0 pointer-events-none" style={{
                      boxShadow: 'inset 0 0 80px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,0.5)'
                    }} />

                    {/* Content */}
                    <div className="relative z-10 px-6 sm:px-8 pt-8 pb-5">

                      {/* Round label */}
                      <SectionDivider text={t.game.roundResult.replace('{{round}}', lastResult.roundNumber.toString())} />

                      {/* Result Banner */}
                      <div className="flex flex-col items-center mt-4 mb-6">
                        {lastResult.correctGuess ? (
                          <>
                            <h2 className="font-serif font-black text-3xl sm:text-4xl tracking-wider mb-2" style={{
                              background: 'linear-gradient(180deg, #86efac, #22c55e, #16a34a)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: 'drop-shadow(0 3px 8px rgba(34,197,94,0.4))',
                            }}>
                              {t.game.thiefCaught}
                            </h2>
                            <p className="font-serif text-sm text-[#c89f59] text-center">
                              {t.game.correctlyAccused
                                .replace('{{police}}', policePlayer?.username || 'Police')
                                .replace('{{accused}}', accusedPlayer?.username || 'Thief')}
                            </p>
                          </>
                        ) : (
                          <>
                            <h2 className="font-serif font-black text-3xl sm:text-4xl tracking-wider mb-2" style={{
                              background: 'linear-gradient(180deg, #fca5a5, #ef4444, #dc2626)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              filter: 'drop-shadow(0 3px 8px rgba(239,68,68,0.4))',
                            }}>
                              {t.game.thiefEscaped}
                            </h2>
                            <p className="font-serif text-sm text-[#c89f59] text-center">
                              {t.game.wronglyAccused
                                .replace('{{police}}', policePlayer?.username || 'Police')
                                .replace('{{accused}}', accusedPlayer?.username || 'Player')
                                .replace('{{role}}', t.roles[lastResult.accusedRole.toLowerCase() as keyof typeof t.roles] || lastResult.accusedRole)}
                            </p>
                            <p className="font-serif text-xs text-[#8a6b20] mt-1">
                              {t.game.theThiefWas.replace('{{thief}}', thiefPlayer?.username || 'Thief')}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Scoreboard */}
                      <SectionDivider text={t.game.scores} />
                      <div className="space-y-1.5 mt-2 mb-4 max-h-[30vh] overflow-y-auto">
                        {sortedPlayers.map((player, idx) => {
                          const resolvedAvatar = avatarKeyToUrl(player.avatarKey) || (player.id === myPlayerId ? myAvatar : null)
                          const isMe = player.id === myPlayerId
                          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

                          return (
                            <div key={player.id} className="relative rounded-lg p-[1px]" style={{
                              background: isMe
                                ? 'linear-gradient(180deg, #d4af37, #5a3e15)'
                                : 'linear-gradient(180deg, #5a3e15, #2a1a0a)',
                            }}>
                              <div className="flex items-center justify-between px-3 py-2 rounded-[7px]" style={{
                                background: 'linear-gradient(90deg, #1a0f08, #2c1a0e)',
                              }}>
                                <div className="flex items-center gap-2.5">
                                  <span className="text-[11px] font-serif font-bold text-[#5a3e15] w-5 text-center">
                                    {medal || `#${idx + 1}`}
                                  </span>
                                  {/* Avatar */}
                                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[#5a3e15] flex-shrink-0" style={{ background: '#0d0704' }}>
                                    {resolvedAvatar ? (
                                      <img src={resolvedAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <svg className="w-3.5 h-3.5 text-[#c89f59] opacity-50" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <span className={`font-serif font-bold text-sm tracking-wider ${isMe ? 'text-[#ffe58f]' : 'text-[#c89f59]'}`}>
                                    {player.username}
                                    {isMe && <span className="text-[#8a6b20] text-[10px] ml-1">{t.game.you}</span>}
                                  </span>
                                </div>
                                <span className="font-serif font-black text-sm tracking-wider" style={{
                                  background: 'linear-gradient(180deg, #ffe58f, #d4af37)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>
                                  {player.score}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Host Actions (or fallback if host disconnects) */}
                      {canAdvance && (
                        <div className="mt-2">
                          {isFinalRound ? (
                            <button
                              onClick={handleEndGame}
                              disabled={loading}
                              className="w-full relative group rounded-lg active:scale-[0.97] transition-all focus:outline-none disabled:opacity-50"
                            >
                              <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                                background: 'linear-gradient(180deg, #c084fc, #7c3aed)',
                              }} />
                              <div className="relative rounded-lg py-3.5 flex items-center justify-center" style={{
                                background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 40%, #4c1d95 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(192,132,252,0.4), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.7)',
                              }}>
                                <span className="font-serif font-black text-[14px] tracking-[0.15em] uppercase" style={{
                                  background: 'linear-gradient(180deg, #f3e8ff, #c084fc, #a855f7)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>
                                  {loading ? t.game.loading : t.game.seeFinalResults}
                                </span>
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={handleNextRound}
                              disabled={loading}
                              className="w-full relative group rounded-lg active:scale-[0.97] transition-all focus:outline-none disabled:opacity-50"
                            >
                              <div className="absolute -inset-[1px] rounded-lg opacity-60 group-hover:opacity-80 transition-opacity" style={{
                                background: 'linear-gradient(180deg, #ffe58f, #a67c00)',
                              }} />
                              <div className="relative rounded-lg py-3.5 flex items-center justify-center gap-2" style={{
                                background: 'linear-gradient(180deg, #c9a033 0%, #9a7220 40%, #7a5a18 100%)',
                                boxShadow: 'inset 0 1px 1px rgba(255,229,143,0.5), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.7)',
                              }}>
                                <span className="font-serif font-black text-[14px] tracking-[0.15em] uppercase" style={{
                                  background: 'linear-gradient(180deg, #fff8e1, #ffe58f, #d4af37)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}>
                                  {loading ? t.game.loading : `${t.game.nextRound} (${room.currentRound + 1}/${room.totalRounds})`}
                                </span>
                              </div>
                            </button>
                          )}
                        </div>
                      )}

                      {!canAdvance && (
                        <div className="w-full text-center py-2 mt-2">
                          <span className="text-[#c89f59] font-serif text-xs italic tracking-wide">
                            {t.game.waitingForHostToContinue}
                          </span>
                        </div>
                      )}

                      {error && (
                        <div className="mt-2 text-center">
                          <span className="text-[#ff6b6b] font-serif text-xs font-bold">{error}</span>
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

      <style>{`
        @keyframes resultReveal {
          0% { opacity: 0; transform: scale(0.9) translateY(30px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
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
