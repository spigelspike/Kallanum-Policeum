export type GamePhase =
  | 'WAITING'
  | 'ROLE_ASSIGNMENT'
  | 'DISCUSSION'
  | 'POLICE_SELECTION'
  | 'ROUND_RESULT'
  | 'FINAL_RESULTS'

export interface Player {
  id: string
  username: string
  score: number
  isConnected: boolean
  isHost: boolean
  avatarKey?: string | null
  isBot?: boolean
}

export interface Room {
  id: string
  code: string
  hostId: string
  phase: GamePhase
  currentRound: number
  totalRounds: number
  phaseEndsAt?: string | null
  isQuickPlay?: boolean
}

export interface RoleAssignment {
  playerId: string
  role: string
  points: number
}

export interface RoundResult {
  roundNumber: number
  policeId: string
  accusedId: string
  accusedUsername: string
  accusedRole: string
  correctGuess: boolean
  thiefId: string
  scores: Record<string, number>
}

export interface FinalScore {
  playerId: string
  username: string
  totalScore: number
  rank: number
}
