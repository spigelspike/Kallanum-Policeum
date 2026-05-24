import { create } from 'zustand'

interface VoiceState {
  isMuted: boolean
  isDeafened: boolean
  speakingPlayers: Record<string, boolean> // playerId -> isSpeaking
  remoteMutedMap: Record<string, boolean> // playerId -> isMuted (remote)
  localVolumeMap: Record<string, number> // playerId -> volume (0-100)
  localMutedMap: Record<string, boolean> // playerId -> isMuted (local)
  
  toggleMute: () => void
  toggleDeafen: () => void
  setSpeaking: (playerId: string, speaking: boolean) => void
  setRemoteMuted: (playerId: string, isMuted: boolean) => void
  setLocalVolume: (playerId: string, volume: number) => void
  toggleLocalMute: (playerId: string) => void
  resetVoice: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isMuted: true, // Start muted by default to prevent sudden noise
  isDeafened: false,
  speakingPlayers: {},
  remoteMutedMap: {},
  localVolumeMap: {},
  localMutedMap: {},

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

  setLocalVolume: (playerId, volume) => set((state) => ({
    localVolumeMap: {
      ...state.localVolumeMap,
      [playerId]: Math.max(0, Math.min(100, volume))
    }
  })),

  toggleLocalMute: (playerId) => set((state) => ({
    localMutedMap: {
      ...state.localMutedMap,
      [playerId]: !state.localMutedMap[playerId]
    }
  })),

  resetVoice: () => set({
    isMuted: true,
    isDeafened: false,
    speakingPlayers: {},
    remoteMutedMap: {},
    localVolumeMap: {},
    localMutedMap: {}
  })
}))
