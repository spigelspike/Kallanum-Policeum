import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../stores/gameStore'
import { useProfileStore } from '../stores/profileStore'
import type { Room, Player } from '../types/game'

interface UseRoomReturn {
  loading: boolean
  error: string | null
  createRoom: (username: string, totalRounds: number) => Promise<string | null>
  joinRoom: (username: string, code: string) => Promise<string | null>
  quickPlay: () => Promise<string | null>
}

export function useRoom(): UseRoomReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setRoom, setPlayers, setMyPlayerId } = useGameStore()

  async function ensureAuth(): Promise<string> {
    // Check for existing session first
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      return session.access_token
    }

    // No session — sign in anonymously
    const { data, error: signInError } = await supabase.auth.signInAnonymously()
    if (signInError || !data.session) {
      throw new Error('Failed to authenticate. Please try again.')
    }

    return data.session.access_token
  }

  async function createRoom(
    username: string,
    totalRounds: number
  ): Promise<string | null> {
    setLoading(true)
    setError(null)

    try {
      const token = await ensureAuth()
      const avatarKey = useProfileStore.getState().avatarKey

      const response = await supabase.functions.invoke('create-room', {
        body: { username, totalRounds, avatarKey },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.error) {
        let msg = response.error.message
        if ('context' in response.error && typeof (response.error as any).context?.json === 'function') {
          try {
            const body = await (response.error as any).context.json()
            if (body && body.error) {
              msg = body.error
            }
          } catch (_) {}
        }
        setError(msg)
        return null
      }

      const data = response.data as {
        roomCode: string
        roomId: string
        playerId: string
      }

      // Update Zustand store
      const room: Room = {
        id: data.roomId,
        code: data.roomCode,
        hostId: data.playerId,
        phase: 'WAITING',
        currentRound: 1,
        totalRounds,
      }

      const hostPlayer: Player = {
        id: data.playerId,
        username,
        score: 0,
        isConnected: true,
        isHost: true,
        avatarKey: avatarKey,
      }

      setRoom(room)
      setPlayers([hostPlayer])
      setMyPlayerId(data.playerId)

      return data.roomCode
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom(
    username: string,
    code: string
  ): Promise<string | null> {
    setLoading(true)
    setError(null)

    try {
      const token = await ensureAuth()
      const avatarKey = useProfileStore.getState().avatarKey

      const response = await supabase.functions.invoke('join-room', {
        body: { roomCode: code.toUpperCase(), username, avatarKey },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.error) {
        let msg = response.error.message
        if ('context' in response.error && typeof (response.error as any).context?.json === 'function') {
          try {
            const body = await (response.error as any).context.json()
            if (body && body.error) {
              msg = body.error
            }
          } catch (_) {}
        }
        setError(msg)
        return null
      }

      const data = response.data as {
        roomId: string
        roomCode: string
        players: Array<{
          id: string
          username: string
          score: number
          isConnected: boolean
          isHost: boolean
          avatarKey?: string | null
        }>
      }

      // Find current user in the returned players list
      const { data: { user } } = await supabase.auth.getUser()
      const me = data.players.find((p) => p.id === user?.id)

      const room: Room = {
        id: data.roomId,
        code: data.roomCode,
        hostId: data.players.find((p) => p.isHost)?.id ?? '',
        phase: 'WAITING',
        currentRound: 1,
        totalRounds: 3,
      }

      setRoom(room)
      setPlayers(data.players)
      if (me) setMyPlayerId(me.id)

      return data.roomCode
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function quickPlay(): Promise<string | null> {
    setLoading(true)
    setError(null)

    try {
      const token = await ensureAuth()
      const profileName = useProfileStore.getState().name
      const avatarKey = useProfileStore.getState().avatarKey

      const response = await supabase.functions.invoke('quick-play', {
        body: { action: 'join', username: profileName.trim(), avatarKey, totalRounds: 3 },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.error) {
        let msg = response.error.message
        if ('context' in response.error && typeof (response.error as any).context?.json === 'function') {
          try {
            const body = await (response.error as any).context.json()
            if (body && body.error) msg = body.error
          } catch (_) {}
        }
        setError(msg)
        return null
      }

      const data = response.data as {
        roomId: string
        roomCode: string
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const room: Room = {
        id: data.roomId,
        code: data.roomCode,
        hostId: user.id, // Will be corrected by reconcileFromDb if we joined an existing one
        phase: 'WAITING',
        currentRound: 1,
        totalRounds: 3,
        isQuickPlay: true,
      }

      setRoom(room)
      setMyPlayerId(user.id)

      return data.roomCode
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, createRoom, joinRoom, quickPlay }
}
