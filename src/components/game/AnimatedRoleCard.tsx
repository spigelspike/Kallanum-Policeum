import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playFlip, playReveal } from '../../utils/sounds'
import coverCardImg from '../../assets/cover_card.webp'
import revealCardImg from '../../assets/reveal_card.webp'

interface AnimatedRoleCardProps {
  role: string
  points?: number | null
  onDismiss: () => void
}

export default function AnimatedRoleCard({ role, points, onDismiss }: AnimatedRoleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showRoleText, setShowRoleText] = useState(false)

  // Trigger role text fade-in after flip animation completes
  useEffect(() => {
    if (isFlipped) {
      const timer = setTimeout(() => {
        playReveal()
        setShowRoleText(true)
      }, 600) // Delay to wait for flip
      return () => clearTimeout(timer)
    }
  }, [isFlipped])

  const handleTap = () => {
    if (!isFlipped) {
      playFlip()
      setIsFlipped(true)
    } else {
      // If already flipped and text is shown, tapping again dismisses it
      if (showRoleText) {
        onDismiss()
      }
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={() => {
        if (isFlipped && showRoleText) {
          onDismiss()
        }
      }}
    >
      <div 
        className="relative w-full max-w-[320px] aspect-[2.5/3.5] md:max-w-[360px]"
        onClick={(e) => {
          e.stopPropagation()
          handleTap()
        }}
        style={{ perspective: 1200 }}
      >
        <motion.div
          className="w-full h-full relative cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          whileHover={!isFlipped ? { scale: 1.02 } : { scale: 1.02 }}
          whileTap={!isFlipped ? { scale: 0.98 } : {}}
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateY: isFlipped ? 180 : 0 }}
        >
          
          {/* Front of card (Cover) */}
          <div 
            className="absolute inset-0 w-full h-full rounded-[16px] overflow-hidden shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)'
            }}
          >
            <img src={coverCardImg} alt="Card Cover" className="w-full h-full object-cover" />
            
            {/* Subtle glow/gradient over cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Tap to Reveal Prompt */}
            {!isFlipped && (
              <motion.div 
                className="absolute bottom-8 left-0 right-0 flex justify-center"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="font-serif text-[#ffe58f] text-sm tracking-[0.3em] uppercase drop-shadow-md">
                  Tap to Reveal
                </span>
              </motion.div>
            )}
          </div>

          {/* Back of card (Revealed Role) */}
          <div 
            className="absolute inset-0 w-full h-full rounded-[16px] overflow-hidden shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.3)'
            }}
          >
            <img src={revealCardImg} alt="Card Reveal" className="w-full h-full object-cover" />

            {/* Darken overlay to make text pop */}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

            {/* Role Text Overlay */}
            <AnimatePresence>
              {showRoleText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                >
                  <p className="font-serif text-xs uppercase tracking-[0.4em] mb-3 text-[#d4af37] opacity-80">
                    Your Role
                  </p>
                  
                  <h2 className="font-serif font-black text-4xl sm:text-5xl tracking-wider mb-2" style={{
                    background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 40%, #d4af37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 12px rgba(212,175,55,0.4))',
                  }}>
                    {role}
                  </h2>

                  {(points ?? 0) > 0 && (
                    <p className="font-serif text-lg text-[#ffe58f] drop-shadow-md mt-2">
                      {points} points/round
                    </p>
                  )}

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-6 font-serif text-[10px] tracking-widest text-[#c89f59] uppercase"
                  >
                    Tap to Continue
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>
      </div>
    </div>
  )
}
