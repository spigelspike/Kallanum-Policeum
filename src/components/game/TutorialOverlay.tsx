import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTutorialStore } from '../../stores/tutorialStore'
import { playClick } from '../../utils/sounds'

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to the Table!',
    text: 'Your goal is to find the Thief—or bluff your way out if you are one.',
    position: 'center',
  },
  {
    title: 'The Clock is Ticking',
    text: 'You only have 60 seconds to discuss. Keep an eye on the timer at the top!',
    position: 'top',
  },
  {
    title: 'Point Fingers',
    text: 'Tap any player to point a finger at them. If you are the Police, this is how you make an arrest!',
    position: 'center',
  },
  {
    title: 'Express Yourself',
    text: 'Use the emotes at the bottom to react, laugh, or bluff in real-time.',
    position: 'bottom',
  }
]

export default function TutorialOverlay() {
  const { hasSeenTutorial, completeTutorial } = useTutorialStore()
  const [stepIndex, setStepIndex] = useState(0)

  if (hasSeenTutorial) return null

  const handleNext = () => {
    playClick()
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      completeTutorial()
    }
  }

  const handleSkip = () => {
    playClick()
    completeTutorial()
  }

  const currentStep = TUTORIAL_STEPS[stepIndex]

  const getPositionClasses = () => {
    if (currentStep.position === 'top') return 'top-[15%] left-1/2 -translate-x-1/2'
    if (currentStep.position === 'bottom') return 'bottom-[20%] left-1/2 -translate-x-1/2'
    return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  }

  return (
    <div className="absolute inset-0 z-[100] pointer-events-auto flex items-center justify-center overflow-hidden">
      {/* Dark Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`absolute w-[90%] max-w-[320px] ${getPositionClasses()}`}
        >
          {/* Tutorial Bubble */}
          <div className="relative rounded-2xl p-1 shadow-2xl" style={{
            background: 'linear-gradient(145deg, #d4af37, #8a6b20)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.2)'
          }}>
            <div className="rounded-xl px-6 py-5 flex flex-col items-center text-center relative overflow-hidden" style={{
              background: 'linear-gradient(180deg, #2c1a0e, #140b06)',
            }}>
              
              {/* Decorative corner stars */}
              <svg className="absolute top-2 left-2 w-4 h-4 text-[#c89f59] opacity-40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
              </svg>
              <svg className="absolute bottom-2 right-2 w-4 h-4 text-[#c89f59] opacity-40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/>
              </svg>

              <span className="font-serif font-black text-lg tracking-wider mb-2 text-[#ffe58f] drop-shadow-md mt-2">
                {currentStep.title}
              </span>
              
              <p className="font-serif text-sm text-[#c89f59] leading-relaxed mb-6">
                {currentStep.text}
              </p>

              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleSkip}
                  className="flex-1 py-2 rounded-lg font-serif font-bold text-xs uppercase tracking-widest text-[#c89f59] hover:bg-white/5 transition-colors focus:outline-none"
                >
                  Skip
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-2 rounded-lg font-serif font-black text-xs uppercase tracking-widest text-[#140b06] shadow-md active:scale-95 transition-all focus:outline-none"
                  style={{ background: 'linear-gradient(180deg, #ffe58f, #d4af37)' }}
                >
                  {stepIndex === TUTORIAL_STEPS.length - 1 ? "Let's Play!" : 'Next'}
                </button>
              </div>

              {/* Progress Dots */}
              <div className="flex gap-1.5 mt-4">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === stepIndex ? 'bg-[#ffe58f]' : 'bg-[#c89f59]/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
