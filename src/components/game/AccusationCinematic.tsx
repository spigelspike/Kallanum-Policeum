import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { avatarKeyToUrl } from '../../utils/avatarMap'
import { useProfileStore } from '../../stores/profileStore'
import { useLanguageStore } from '../../stores/languageStore'
import { playFlip, playReveal } from '../../utils/sounds'
import mainGameMobile from '../../assets/main_game.webp'
import mainGameDesktop from '../../assets/main_game_desktop.webp'
import coverCardImg from '../../assets/cover_card.webp'
import revealCardImg from '../../assets/reveal_card.webp'

type CinematicStage = 'spotlight' | 'reveal' | 'verdict'

export default function AccusationCinematic() {
  const lastResult = useGameStore((s) => s.lastResult)
  const players = useGameStore((s) => s.players)
  const setPhase = useGameStore((s) => s.setPhase)
  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const { avatar: myAvatar } = useProfileStore()
  const { t } = useLanguageStore()

  const [stage, setStage] = useState<CinematicStage>('spotlight')

  const accusedPlayer = players.find((p) => p.id === lastResult?.accusedId)
  const policePlayer = players.find((p) => p.id === lastResult?.policeId)

  const accusedAvatar =
    avatarKeyToUrl(accusedPlayer?.avatarKey) ||
    (accusedPlayer?.id === myPlayerId ? myAvatar : null)
  const policeAvatar =
    avatarKeyToUrl(policePlayer?.avatarKey) ||
    (policePlayer?.id === myPlayerId ? myAvatar : null)

  useEffect(() => {
    if (!lastResult) return

    const timers = [
      setTimeout(() => {
        playFlip()
        setStage('reveal')
      }, 1400),
      setTimeout(() => {
        playReveal()
        setStage('verdict')
      }, 2800),
      setTimeout(() => {
        setPhase('ROUND_RESULT')
      }, 4800),
    ]

    return () => timers.forEach(clearTimeout)
  }, [lastResult, setPhase])

  // Fallback: skip if data is missing
  if (!lastResult || !accusedPlayer) {
    setPhase('ROUND_RESULT')
    return null
  }

  const isCorrect = lastResult.correctGuess
  const roleName =
    t.roles[lastResult.accusedRole.toLowerCase() as keyof typeof t.roles] ||
    lastResult.accusedRole

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0604]">
      {/* Background — same as game table */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${mainGameDesktop})` }}
      />
      <div
        className="md:hidden absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${mainGameMobile})` }}
      />

      {/* Dark vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, transparent 0%, rgba(0,0,0,0.85) 70%)',
        }}
      />

      {/* ─── Content ─── */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Police banner at top */}
        <div
          className="absolute top-8 left-1/2 -translate-x-1/2"
          style={{ animation: 'cin-fadeSlideDown 0.8s ease-out forwards' }}
        >
          <div
            className="flex items-center gap-3 px-5 py-2.5 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(30,58,138,0.8), rgba(15,23,42,0.9))',
              border: '1px solid rgba(59,130,246,0.4)',
              boxShadow: '0 0 30px rgba(59,130,246,0.2)',
            }}
          >
            {/* Police avatar */}
            <div
              className="w-8 h-8 rounded-full overflow-hidden border border-blue-400/60 flex-shrink-0"
              style={{ boxShadow: '0 0 8px rgba(59,130,246,0.4)' }}
            >
              {policeAvatar ? (
                <img
                  src={policeAvatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1e3a8a] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-300"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-blue-200 font-serif font-bold text-xs tracking-wider">
                {policePlayer?.username}
              </span>
              <span className="text-blue-400/70 font-serif text-[9px] tracking-widest uppercase">
                {t.game.isThePolice || 'accuses'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── Center: Accused Player (3D Card) ─── */}
        <div
          className="flex flex-col items-center mt-12"
          style={{ 
            animation: 'cin-zoomIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            perspective: '1200px'
          }}
        >
          {/* Spotlight glow behind card */}
          <div
            className="absolute w-[350px] h-[350px] rounded-full pointer-events-none"
            style={{
              background: isCorrect
                ? stage === 'verdict'
                  ? 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)'
                : stage === 'verdict'
                  ? 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)',
              transition: 'background 0.6s ease',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: -1,
            }}
          />

          {/* 3D Flip Container */}
          <div 
            className="relative w-56 h-80 sm:w-64 sm:h-96 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{
              transformStyle: 'preserve-3d',
              transform: (stage === 'reveal' || stage === 'verdict') ? 'rotateY(180deg)' : 'rotateY(0deg)'
            }}
          >
            {/* Front: Cover Card + Avatar */}
            <div 
              className="absolute inset-0 rounded-[16px] overflow-hidden shadow-2xl border border-white/10"
              style={{ 
                backfaceVisibility: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.1)'
              }}
            >
              <img src={coverCardImg} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
                <span className="font-serif text-[10px] uppercase tracking-[0.3em] text-[#d4af37] mb-6 opacity-80 text-center">
                  {policePlayer?.username || 'POLICE'} CHOSE
                </span>
                
                {/* Ornate avatar frame */}
                <div className="rounded-full p-[2px] bg-gradient-to-br from-[#ffe58f] via-[#d4af37] to-[#8a6b20] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  <div className="rounded-full p-[2px] bg-black">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900">
                      {accusedAvatar ? (
                        <img
                          src={accusedAvatar}
                          alt={accusedPlayer.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-12 h-12 text-[#c89f59] opacity-50"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-1.5 rounded-full bg-black/60 border border-[#d4af37]/30 backdrop-blur-sm">
                  <span
                    className="font-serif font-black text-base sm:text-lg tracking-[0.15em] uppercase"
                    style={{
                      background: 'linear-gradient(180deg, #fff8e1, #ffe58f, #d4af37)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {accusedPlayer.username}
                  </span>
                </div>
              </div>
            </div>

            {/* Back: Reveal Card + Role */}
            <div 
              className="absolute inset-0 rounded-[16px] overflow-hidden shadow-2xl border border-[#d4af37]"
              style={{ 
                backfaceVisibility: 'hidden', 
                transform: 'rotateY(180deg)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(212,175,55,0.3)'
              }}
            >
              <img src={revealCardImg} alt="Reveal" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
              
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <span className="font-serif text-[11px] uppercase tracking-[0.35em] text-[#d4af37] mb-3 opacity-90">
                  THEIR ROLE
                </span>
                <h2
                  className="font-serif font-black text-4xl sm:text-5xl tracking-wider"
                  style={{
                    background:
                      lastResult.accusedRole === 'Thief'
                        ? 'linear-gradient(180deg, #fca5a5, #ef4444, #dc2626)'
                        : lastResult.accusedRole === 'Police'
                          ? 'linear-gradient(180deg, #93c5fd, #3b82f6, #2563eb)'
                          : 'linear-gradient(180deg, #fff8e1, #ffe58f, #d4af37)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9))',
                  }}
                >
                  {roleName}
                </h2>
              </div>
            </div>
          </div>

          {/* ─── Verdict ─── */}
          {stage === 'verdict' && (
            <div
              className="mt-8 flex flex-col items-center"
              style={{
                animation: 'cin-verdictPop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Verdict icon */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3"
                style={{
                  background: isCorrect
                    ? 'linear-gradient(180deg, rgba(34,197,94,0.2), rgba(22,163,74,0.3))'
                    : 'linear-gradient(180deg, rgba(239,68,68,0.2), rgba(220,38,38,0.3))',
                  border: isCorrect
                    ? '2px solid rgba(34,197,94,0.5)'
                    : '2px solid rgba(239,68,68,0.5)',
                  boxShadow: isCorrect
                    ? '0 0 30px rgba(34,197,94,0.3)'
                    : '0 0 30px rgba(239,68,68,0.3)',
                }}
              >
                {isCorrect ? (
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-green-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-red-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              {/* Verdict text */}
              <h3
                className="font-serif font-black text-xl sm:text-2xl tracking-[0.2em] uppercase"
                style={{
                  background: isCorrect
                    ? 'linear-gradient(180deg, #86efac, #22c55e, #16a34a)'
                    : 'linear-gradient(180deg, #fca5a5, #ef4444, #dc2626)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: isCorrect
                    ? 'drop-shadow(0 3px 8px rgba(34,197,94,0.4))'
                    : 'drop-shadow(0 3px 8px rgba(239,68,68,0.4))',
                }}
              >
                {isCorrect
                  ? t.game.thiefCaught || 'THIEF CAUGHT'
                  : t.game.thiefEscaped || 'THIEF ESCAPED'}
              </h3>
            </div>
          )}
        </div>

        {/* Connecting line from police to accused */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[1px] pointer-events-none"
          style={{
            height: 'calc(50% - 120px)',
            background:
              'linear-gradient(180deg, rgba(59,130,246,0.3) 0%, rgba(212,175,55,0.2) 50%, transparent 100%)',
            animation: 'cin-lineGrow 1s ease-out forwards',
          }}
        />
      </div>

      {/* Screen flash on verdict */}
      {stage === 'verdict' && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{
            animation: 'cin-flash 0.4s ease-out forwards',
            background: isCorrect
              ? 'rgba(34,197,94,0.15)'
              : 'rgba(239,68,68,0.15)',
          }}
        />
      )}

      <style>{`
        @keyframes cin-fadeSlideDown {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes cin-zoomIn {
          0% { opacity: 0; transform: scale(0.6); }
          60% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cin-roleReveal {
          0% { opacity: 0; transform: translateY(15px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cin-verdictPop {
          0% { opacity: 0; transform: scale(0.5); }
          60% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cin-lineGrow {
          0% { opacity: 0; clip-path: inset(0 0 100% 0); }
          100% { opacity: 1; clip-path: inset(0 0 0 0); }
        }
        @keyframes cin-flash {
          0% { opacity: 0.6; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
