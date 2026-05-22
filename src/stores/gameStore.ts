import { create } from 'zustand'
import type { Player, Room, GamePhase, RoundResult, FinalScore } from '../types/game'

interface GameState {
  // Room data
  room: Room | null
  players: Player[]
  myPlayerId: string | null

  // Role data (current round)
  policeId: string | null
  myRole: string | null
  myRolePoints: number | null

  // Round result
  lastResult: RoundResult | null

  // Final results
  finalScores: FinalScore[]

  // Ephemeral Interactive State
  pointers: Record<string, string> // fromPlayerId -> toPlayerId
  emotes: Record<string, { emoji: string; timestamp: number }>

  // Actions — room
  setRoom: (room: Room) => void
  setPlayers: (players: Player[]) => void
  addPlayer: (player: Player) => void
  removePlayer: (playerId: string) => void
  updatePlayerConnection: (playerId: string, isConnected: boolean) => void
  setMyPlayerId: (id: string) => void
  setPhase: (phase: GamePhase) => void
  setCurrentRound: (round: number) => void
  updatePlayerScore: (playerId: string, score: number) => void

  // Actions — role
  setPoliceId: (id: string) => void
  setMyRole: (role: string | null, points: number | null) => void

  // Actions — results
  setLastResult: (result: RoundResult) => void
  setFinalScores: (scores: FinalScore[]) => void

  // Actions — Interactive
  setPointer: (fromId: string, toId: string | null) => void
  setEmote: (playerId: string, emoji: string) => void
  clearInteractiveState: () => void

  // Reset
  reset: () => void
}

const initialState = {
  room: null,
  players: [],
  myPlayerId: null,
  policeId: null,
  myRole: null,
  myRolePoints: null,
  lastResult: null,
  finalScores: [],
  pointers: {},
  emotes: {},
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setRoom: (room) => set({ room }),

  setPlayers: (players) => set({ players }),

  addPlayer: (player) =>
    set((state) => ({
      players: state.players.some((p) => p.id === player.id)
        ? state.players
        : [...state.players, player],
    })),

  removePlayer: (playerId) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    })),

  updatePlayerConnection: (playerId, isConnected) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, isConnected } : p
      ),
    })),

  setMyPlayerId: (id) => set({ myPlayerId: id }),

  setPhase: (phase) =>
    set((state) => ({
      room: state.room ? { ...state.room, phase } : null,
    })),

  setCurrentRound: (round) =>
    set((state) => ({
      room: state.room ? { ...state.room, currentRound: round } : null,
    })),

  updatePlayerScore: (playerId, score) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, score } : p
      ),
    })),

  setPoliceId: (id) => set({ policeId: id }),

  setMyRole: (role, points) => set({ myRole: role, myRolePoints: points }),

  setLastResult: (result) => set({ lastResult: result }),

  setFinalScores: (scores) => set({ finalScores: scores }),

  setPointer: (fromId, toId) => set((state) => {
    const newPointers = { ...state.pointers }
    if (toId) newPointers[fromId] = toId
    else delete newPointers[fromId]
    return { pointers: newPointers }
  }),

  setEmote: (playerId, emoji) => set((state) => ({
    emotes: {
      ...state.emotes,
      [playerId]: { emoji, timestamp: Date.now() },
    }
  })),

  clearInteractiveState: () => set({ pointers: {}, emotes: {} }),

  reset: () => set(initialState),
}))
