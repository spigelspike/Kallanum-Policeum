import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TutorialState {
  hasSeenTutorial: boolean
  completeTutorial: () => void
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set) => ({
      hasSeenTutorial: false,
      completeTutorial: () => set({ hasSeenTutorial: true }),
    }),
    {
      name: 'kallanum-tutorial-storage',
    }
  )
)
