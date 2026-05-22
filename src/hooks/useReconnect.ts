import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../stores/gameStore'
import type { Room, Player, GamePhase } from '../types/game'

export function useReconnect() {
  const setRoom = useGameStore((s) => s.setRoom)
  const setPlayers = useGameStore((s) => s.setPlayers)
  const setMyPlayerId = useGameStore((s) => s.setMyPlayerId)
  const setPoliceId = useGameStore((s) => s.setPoliceId)
  const setMyRole = useGameStore((s) => s.setMyRole)

  const reconnect = useCallback(async (roomCode: string): Promise<boolean> => {
    try {
      // 1. Session still valid?
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return false

      const userId = session.user.id

      // 2. Fetch room by code
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('id, code, host_id, phase, current_round, total_rounds, expires_at')
        .eq('code', roomCode)
        .maybeSingle()

      if (roomError || !roomData) return false

      // 3. Check expiry
      if (roomData.expires_at && new Date(roomData.expires_at) < new Date()) {
        return false
      }

      // 4. Check if player is still in the room
      const { data: allPlayers, error: playersError } = await supabase
        .from('room_players')
        .select('id, player_id, username, score, is_connected')
        .eq('room_id', roomData.id)

      if (playersError || !allPlayers) return false

      const me = allPlayers.find((p) => p.player_id === userId)
      if (!me) return false

      // 5. Mark as reconnected
      await supabase
        .from('room_players')
        .update({ is_connected: true })
        .eq('room_id', roomData.id)
        .eq('player_id', userId)

      // 6. Hydrate store
      const room: Room = {
        id: roomData.id,
        code: roomData.code,
        hostId: roomData.host_id,
        phase: roomData.phase as GamePhase,
        currentRound: roomData.current_round,
        totalRounds: roomData.total_rounds,
      }

      const players: Player[] = allPlayers.map((p) => ({
        id: p.player_id,
        username: p.username,
        score: p.score,
        isConnected: p.player_id === userId ? true : p.is_connected,
        isHost: p.player_id === roomData.host_id,
      }))

      setRoom(room)
      setPlayers(players)
      setMyPlayerId(me.player_id)

      // 7. Fetch current role if game is in progress
      if (
        roomData.phase === 'DISCUSSION' ||
        roomData.phase === 'POLICE_SELECTION' ||
        roomData.phase === 'ROUND_RESULT'
      ) {
        const { data: roleData } = await supabase
          .from('player_roles')
          .select('role, role_points')
          .eq('room_id', roomData.id)
          .eq('player_id', userId)
          .eq('round_number', roomData.current_round)
          .maybeSingle()

        if (roleData) {
          setMyRole(roleData.role, roleData.role_points)
        }

        // Fetch police from player_roles (the one with role = 'Police')
        const { data: policeData } = await supabase
          .from('player_roles')
          .select('player_id')
          .eq('room_id', roomData.id)
          .eq('round_number', roomData.current_round)
          .eq('role', 'Police')
          .maybeSingle()

        if (policeData) {
          setPoliceId(policeData.player_id)
        }
      }

      return true
    } catch {
      return false
    }
  }, [setRoom, setPlayers, setMyPlayerId, setPoliceId, setMyRole])

  return { reconnect }
}
