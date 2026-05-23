import { create } from 'zustand'

interface VoiceState {
  isMuted: boolean
  isDeafened: boolean
  speakingPlayers: Record<string, boolean> // playerId -> isSpeaking
  remoteMutedMap: Record<string, boolean> // playerId -> isMuted
  
  toggleMute: () => void
  toggleDeafen: () => void
  setSpeaking: (playerId: string, speaking: boolean) => void
  setRemoteMuted: (playerId: string, isMuted: boolean) => void
  resetVoice: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isMuted: true, // Start muted by default to prevent sudden noise
  isDeafened: false,
  speakingPlayers: {},
  remoteMutedMap: {},

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  
  toggleDeafen: () => set((state) => ({ isDeafened: !state.isDeafened })),
  
  setSpeaking: (playerId, speaking) => set((state) => ({
    speakingPlayers: {
      ...state.speakingPlayers,
      [playerId]: speaking
    }
  })),

  setRemoteMuted: (playerId, isMuted) => set((state) => ({
    remoteMutedMap: {
      ...state.remoteMutedMap,
      [playerId]: isMuted
    }
  })),

  resetVoice: () => set({
    isMuted: true,
    isDeafened: false,
    speakingPlayers: {},
    remoteMutedMap: {}
  })
}))
