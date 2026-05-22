import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../stores/gameStore'
import { useMyRole } from './useMyRole'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Player, RoundResult, FinalScore } from '../types/game'

interface UseRealtimeRoomParams {
  roomId: string
  roomCode: string
}

interface UseRealtimeRoomReturn {
  channel: RealtimeChannel | null
  connected: boolean
  broadcastPoint: (toId: string | null) => void
  broadcastEmote: (emoji: string) => void
  status: string
}

export function useRealtimeRoom({
  roomId,
  roomCode,
}: UseRealtimeRoomParams): UseRealtimeRoomReturn {
  const navigate = useNavigate()
  const [connected, setConnected] = useState(false)
  const [statusStr, setStatusStr] = useState<string>('CONNECTING')
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Use refs to avoid stale closures in channel callbacks
  const playersRef = useRef<Player[]>([])
  const roomRef = useRef(useGameStore.getState().room)

  const myPlayerId = useGameStore((s) => s.myPlayerId)
  const players = useGameStore((s) => s.players)
  const room = useGameStore((s) => s.room)
  const policeId = useGameStore((s) => s.policeId)
  const setPhase = useGameStore((s) => s.setPhase)
  const setPoliceId = useGameStore((s) => s.setPoliceId)
  const setMyRole = useGameStore((s) => s.setMyRole)
  const setLastResult = useGameStore((s) => s.setLastResult)
  const setFinalScores = useGameStore((s) => s.setFinalScores)
  const setCurrentRound = useGameStore((s) => s.setCurrentRound)
  const setPlayers = useGameStore((s) => s.setPlayers)
  const setRoom = useGameStore((s) => s.setRoom)
  const updatePlayerConnection = useGameStore((s) => s.updatePlayerConnection)
  const setPointer = useGameStore((s) => s.setPointer)
  const setEmote = useGameStore((s) => s.setEmote)
  const clearInteractiveState = useGameStore((s) => s.clearInteractiveState)

  const { fetchMyRole } = useMyRole()

  // Keep refs in sync
  useEffect(() => {
    playersRef.current = players
  }, [players])

  useEffect(() => {
    roomRef.current = room
  }, [room])

  useEffect(() => {
    if (!roomId || !myPlayerId) return

    const currentUsername =
      playersRef.current.find((p) => p.id === myPlayerId)?.username ?? 'Unknown'

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: myPlayerId },
      },
    })

    channelRef.current = channel

    // ── Broadcast: PLAYER_JOINED ──
    channel.on('broadcast', { event: 'PLAYER_JOINED' }, (message) => {
      const payload = message.payload as Player
      const exists = playersRef.current.some((p) => p.id === payload.id)
      if (!exists) {
        setPlayers([...playersRef.current, payload])
      }
    })

    // ── Presence: sync (updates connection status only) ──
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const presentIds = new Set<string>(Object.keys(state))

      if (playersRef.current.length > 0) {
        setPlayers(
          playersRef.current.map((p) => ({
            ...p,
            isConnected: presentIds.has(p.id),
          }))
        )
      }
    })

    // ── Presence: leave → detect disconnections ──
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (!key) return
      updatePlayerConnection(key, false)

      const currentRoom = roomRef.current

      // Host disconnect during WAITING → transfer host
      if (currentRoom?.phase === 'WAITING' && currentRoom.hostId === key && key !== myPlayerId) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return
          supabase.functions.invoke('transfer-host', {
            body: { roomId, disconnectedHostId: key },
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        })
      }

      // Mid-round disconnect → only host triggers handling
      if (
        currentRoom?.phase === 'DISCUSSION' ||
        currentRoom?.phase === 'POLICE_SELECTION'
      ) {
        if (myPlayerId === currentRoom.hostId) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return
            supabase.functions.invoke('handle-disconnect', {
              body: { roomId, disconnectedPlayerId: key },
              headers: { Authorization: `Bearer ${session.access_token}` },
            })
          })
        }
      }
    })

    // ── Broadcast: GAME_STARTED ──
    channel.on('broadcast', { event: 'GAME_STARTED' }, (message) => {
      const payload = message.payload as { policeId: string; phase: string }
      setPoliceId(payload.policeId)
      setPhase('DISCUSSION')
      clearInteractiveState()
      fetchMyRole()
    })

    // ── Broadcast: ACCUSATION_MADE ──
    channel.on('broadcast', { event: 'ACCUSATION_MADE' }, (message) => {
      const payload = message.payload as RoundResult
      setPhase('ROUND_RESULT')
      setLastResult(payload)
      if (payload.scores) {
        setPlayers(
          playersRef.current.map((p) => ({
            ...p,
            score: payload.scores[p.id] ?? p.score,
          }))
        )
      }
    })

    // ── Broadcast: ROUND_STARTED ──
    channel.on('broadcast', { event: 'ROUND_STARTED' }, (message) => {
      const payload = message.payload as {
        roundNumber: number; policeId: string; phase: string
      }
      setCurrentRound(payload.roundNumber)
      setPoliceId(payload.policeId)
      setPhase('DISCUSSION')
      setMyRole(null, null)
      clearInteractiveState()
      setTimeout(() => { fetchMyRole() }, 500)
    })

    // ── Broadcast: GAME_ENDED ──
    channel.on('broadcast', { event: 'GAME_ENDED' }, (message) => {
      const payload = message.payload as { finalScores: FinalScore[] }
      setPhase('FINAL_RESULTS')
      setFinalScores(payload.finalScores)
      clearInteractiveState()
      navigate(`/results?room=${roomCode}`)
    })

    // ── Broadcast: HOST_TRANSFERRED ──
    channel.on('broadcast', { event: 'HOST_TRANSFERRED' }, (message) => {
      const payload = message.payload as {
        newHostId: string; newHostUsername: string
      }
      const currentRoom = roomRef.current
      if (currentRoom) {
        setRoom({ ...currentRoom, hostId: payload.newHostId })
      }
      setPlayers(
        playersRef.current.map((p) => ({
          ...p,
          isHost: p.id === payload.newHostId,
        }))
      )
    })

    // ── Broadcast: ROUND_VOIDED ──
    channel.on('broadcast', { event: 'ROUND_VOIDED' }, () => {
      const currentRoom = roomRef.current
      setPhase('ROUND_RESULT')
      clearInteractiveState()
      setLastResult({
        roundNumber: currentRoom?.currentRound ?? 0,
        policeId: policeId ?? '',
        accusedId: '',
        accusedUsername: '',
        accusedRole: '',
        correctGuess: false,
        thiefId: '',
        scores: {},
      })
    })

    // ── Broadcast: POINTING ──
    channel.on('broadcast', { event: 'POINTING' }, (message) => {
      const payload = message.payload as { fromId: string; toId: string | null }
      setPointer(payload.fromId, payload.toId)
    })

    // ── Broadcast: EMOTE ──
    channel.on('broadcast', { event: 'EMOTE' }, (message) => {
      const payload = message.payload as { playerId: string; emoji: string }
      setEmote(payload.playerId, payload.emoji)
    })

    // ── Subscribe & track ──
    channel.subscribe(async (status, err) => {
      setStatusStr(status + (err ? ` (${err})` : ''))
      if (status === 'SUBSCRIBED') {
        setConnected(true)
        await channel.track({
          playerId: myPlayerId,
          username: currentUsername,
          online_at: new Date().toISOString(),
        })
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setConnected(false)
      }
    })

    return () => {
      setConnected(false)
      channelRef.current = null
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, myPlayerId])

  const broadcastPoint = (toId: string | null) => {
    if (!channelRef.current || !myPlayerId) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'POINTING',
      payload: { fromId: myPlayerId, toId },
    })
    useGameStore.getState().setPointer(myPlayerId, toId)
  }

  const broadcastEmote = (emoji: string) => {
    if (!channelRef.current || !myPlayerId) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'EMOTE',
      payload: { playerId: myPlayerId, emoji },
    })
    useGameStore.getState().setEmote(myPlayerId, emoji)
  }

  return { channel: channelRef.current, connected, broadcastPoint, broadcastEmote, status: statusStr }
}

