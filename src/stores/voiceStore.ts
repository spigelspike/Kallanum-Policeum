import { create } from 'zustand'

interface VoiceState {
  isMuted: boolean
  isDeafened: boolean
  speakingPlayers: Record<string, boolean> // playerId -> isSpeaking
  
  toggleMute: () => void
  toggleDeafen: () => void
  setSpeaking: (playerId: string, speaking: boolean) => void
  resetVoice: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isMuted: true, // Start muted by default to prevent sudden noise
  isDeafened: false,
  speakingPlayers: {},

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  
  toggleDeafen: () => set((state) => ({ isDeafened: !state.isDeafened })),
  
  setSpeaking: (playerId, speaking) => set((state) => ({
    speakingPlayers: {
      ...state.speakingPlayers,
      [playerId]: speaking
    }
  })),

  resetVoice: () => set({
    isMuted: true,
    isDeafened: false,
    speakingPlayers: {}
  })
}))
