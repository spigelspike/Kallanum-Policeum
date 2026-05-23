import Ably from 'ably'
import { useGameStore } from '../stores/gameStore'

let ablyClient: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      key: import.meta.env.VITE_ABLY_API_KEY,
      clientId: useGameStore.getState().myPlayerId ?? 'anonymous',
    })
  }
  return ablyClient
}
