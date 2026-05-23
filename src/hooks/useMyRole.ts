import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../stores/gameStore'

interface UseMyRoleReturn {
  fetchMyRole: () => Promise<void>
  loading: boolean
  error: string | null
}

export function useMyRole(): UseMyRoleReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMyRole = useCallback(async () => {
    // Read directly from getState to avoid stale closures inside event listeners
    const state = useGameStore.getState()
    const myPlayerId = state.myPlayerId
    const room = state.room
    const setMyRole = state.setMyRole

    if (!myPlayerId || !room) {
      setError('Missing player or room information')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('player_roles')
        .select('role, role_points')
        .eq('player_id', myPlayerId)
        .eq('room_id', room.id)
        .eq('round_number', room.currentRound)
        .maybeSingle()

      if (queryError) {
        setError(queryError.message)
        return
      }

      if (data) {
        setMyRole(data.role, data.role_points)
      } else {
        // Role not yet assigned — clear previous role
        setMyRole(null, null)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch role'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchMyRole, loading, error }
}
