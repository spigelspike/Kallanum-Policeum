import Ably from 'ably'
import { useGameStore } from '../stores/gameStore'
import { supabase } from './supabase'

let ablyClient: Ably.Realtime | null = null

export function getAblyClient(): Ably.Realtime {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      authCallback: async (_tokenParams, callback) => {
        try {
          const session = await supabase.auth.getSession()
          const token = session.data.session?.access_token
          if (!token) throw new Error('Not authenticated')

          const res = await supabase.functions.invoke('ably-auth', {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (res.error) throw new Error(res.error.message || 'Failed to get Ably token')
          
          callback(null, res.data)
        } catch (err) {
          console.error('[Ably Auth Error]', err)
          callback(err as any, null)
        }
      },
      clientId: useGameStore.getState().myPlayerId ?? 'anonymous',
    })
  }
  return ablyClient
}
