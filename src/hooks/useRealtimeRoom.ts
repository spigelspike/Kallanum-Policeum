import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../stores/gameStore'
import { useVoiceStore } from '../stores/voiceStore'
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
  const [channelObj, setChannelObj] = useState<RealtimeChannel | null>(null)
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

  // ── Reconcile player list from a broadcast payload ──
  const reconcilePlayersFromPayload = useCallback((payloadPlayers: Player[]) => {
    if (!payloadPlayers || !Array.isArray(payloadPlayers) || payloadPlayers.length === 0) return
    // Merge: use payload as truth for scores, add any missing players
    const currentPlayers = playersRef.current
    const payloadMap = new Map(payloadPlayers.map(p => [p.id, p]))
    const merged: Player[] = []
    // Update existing players and collect IDs we've seen
    const seenIds = new Set<string>()
    for (const p of currentPlayers) {
      const fromPayload = payloadMap.get(p.id)
      if (fromPayload) {
        merged.push({ ...p, ...fromPayload })
      } else {
        merged.push(p)
      }
      seenIds.add(p.id)
    }
    // Add any players from payload that we didn't have locally
    for (const p of payloadPlayers) {
      if (!seenIds.has(p.id)) {
        merged.push(p)
      }
    }
    setPlayers(merged)
  }, [setPlayers])

  // ── Reconcile from database (authoritative source) ──
  const reconcileFromDb = useCallback(async () => {
    const currentRoom = roomRef.current
    if (!currentRoom) return
    try {
      // 1. Fetch Room details
      const { data: dbRoom, error: roomErr } = await supabase
        .from('rooms')
        .select('phase, current_round, total_rounds, host_id, phase_ends_at, is_quick_play')
        .eq('id', currentRoom.id)
        .maybeSingle()

      if (roomErr || !dbRoom) return

      // 2. Fetch Police ID if game has started
      let dbPoliceId: string | null = null
      if (dbRoom.phase !== 'WAITING') {
        const { data: roleData } = await supabase
          .from('player_roles')
          .select('player_id')
          .eq('room_id', currentRoom.id)
          .eq('round_number', dbRoom.current_round)
          .eq('role', 'Police')
          .maybeSingle()
        if (roleData) {
          dbPoliceId = roleData.player_id
        }
      }

      // 3. Fetch Players
      const { data: dbPlayers, error: playersErr } = await supabase
        .from('room_players')
        .select('player_id, username, score, is_connected, avatar_key, is_bot')
        .eq('room_id', currentRoom.id)
      if (playersErr || !dbPlayers) return

      // 4. Apply all updates
      // Don't let DB reconciliation interrupt the accusation cinematic
      const localPhase = currentRoom.phase
      const dbPhase = dbRoom.phase as any
      const effectivePhase = (localPhase === 'ACCUSATION_CINEMATIC' && dbPhase === 'ROUND_RESULT')
        ? 'ACCUSATION_CINEMATIC'
        : dbPhase

      setRoom({
        ...currentRoom,
        phase: effectivePhase,
        currentRound: dbRoom.current_round,
        totalRounds: dbRoom.total_rounds,
        hostId: dbRoom.host_id,
        phaseEndsAt: dbRoom.phase_ends_at,
        isQuickPlay: dbRoom.is_quick_play,
      })

      if (dbPoliceId) {
        setPoliceId(dbPoliceId)
      }

      const freshPlayers: Player[] = dbPlayers.map((p) => ({
        id: p.player_id,
        username: p.username,
        score: p.score,
        isConnected: p.is_connected,
        isHost: p.player_id === dbRoom.host_id,
        avatarKey: p.avatar_key ?? null,
        isBot: p.is_bot ?? false,
      }))
      setPlayers(freshPlayers)

      // 5. Trigger fetching of client's own role
      fetchMyRole()
    } catch (err) {
      console.error('Reconciliation failed:', err)
    }
  }, [setPlayers, setRoom, setPoliceId, fetchMyRole])

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
    setChannelObj(channel)

    // ── Security: Verify broadcast authenticity ──
    const verifyBroadcastPhase = async (expectedPhase: string): Promise<boolean> => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;

        const response = await supabase.functions.invoke('verify-phase', {
          body: { roomId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (response.error) {
          console.error('[Security] Edge Function verification failed:', response.error);
          return false;
        }

        const actualPhase = response.data?.phase;
        if (actualPhase !== expectedPhase) {
          console.warn(`[Security] Ignored unauthorized broadcast. Expected ${expectedPhase}, got ${actualPhase}`)
          return false
        }
        return true
      } catch (e) {
        console.error('[Security] Verification failed:', e)
        return false
      }
    }

    // ── Broadcast: PLAYER_JOINED ──
    channel.on('broadcast', { event: 'PLAYER_JOINED' }, (message) => {
      const payload = message.payload as Player
      const exists = playersRef.current.some((p) => p.id === payload.id)
      if (!exists) {
        setPlayers([...playersRef.current, payload])
      }
    })

    // ── Broadcast: PLAYER_LEFT ──
    channel.on('broadcast', { event: 'PLAYER_LEFT' }, (message) => {
      const payload = message.payload as { playerId: string }
      setPlayers(playersRef.current.filter((p) => p.id !== payload.playerId))
    })

    // ── Presence: sync (updates connection status + detects unknown players) ──
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      
      // Extract playerIds from presence payloads
      const presentIds = new Set<string>()
      for (const presenceKey of Object.keys(state)) {
        const presences = state[presenceKey] as any[]
        for (const pres of presences) {
          if (pres.playerId) {
            presentIds.add(pres.playerId)
          }
        }
      }

      if (playersRef.current.length > 0) {
        // Check if any present player is unknown locally
        const knownIds = new Set(playersRef.current.map(p => p.id))
        let hasUnknown = false
        for (const pid of presentIds) {
          // Ignore bots when checking for unknown human players in presence
          if (pid.startsWith('bot-') || pid.startsWith('00000000-0000-0000-0000-')) continue
          if (!knownIds.has(pid)) {
            hasUnknown = true
            break
          }
        }

        // If unknown player detected, fetch full player list from DB
        if (hasUnknown) {
          reconcileFromDb()
        } else {
          // Just update connection status for known players
          setPlayers(
            playersRef.current.map((p) => ({
              ...p,
              isConnected: p.isBot ? true : presentIds.has(p.id),
            }))
          )
        }
      } else {
        // If local players list is empty, fetch from DB to initialize it
        reconcileFromDb()
      }
    })

    // ── Presence: leave → detect disconnections ──
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (!leftPresences || leftPresences.length === 0) return

      const leftPlayerIds = leftPresences.map((p: any) => p.playerId).filter(Boolean) as string[]
      
      for (const leftId of leftPlayerIds) {
        updatePlayerConnection(leftId, false)

        const currentRoom = roomRef.current

        // Host disconnect during WAITING → transfer host
        if (currentRoom?.phase === 'WAITING' && currentRoom.hostId === leftId && leftId !== myPlayerId) {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) return
            supabase.functions.invoke('transfer-host', {
              body: { roomId, disconnectedHostId: leftId },
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
                body: { roomId, disconnectedPlayerId: leftId },
                headers: { Authorization: `Bearer ${session.access_token}` },
              })
            })
          }
        }
      }
    })

    // ── Broadcast: GAME_STARTED ──
    channel.on('broadcast', { event: 'GAME_STARTED' }, async (message) => {
      if (!(await verifyBroadcastPhase('DISCUSSION'))) return
      
      const payload = message.payload as { policeId: string; phase: string; phaseEndsAt?: string; players?: Player[] }
      const currentRoom = useGameStore.getState().room
      if (currentRoom) {
        setRoom({ ...currentRoom, phaseEndsAt: payload.phaseEndsAt })
      }
      setPoliceId(payload.policeId)
      setPhase('DISCUSSION')
      clearInteractiveState()

      // Reconcile players from payload (contains the filled bots)
      if (payload.players) {
        reconcilePlayersFromPayload(payload.players)
      } else {
        reconcileFromDb()
      }

      fetchMyRole()
    })

    // ── Broadcast: ACCUSATION_MADE ──
    channel.on('broadcast', { event: 'ACCUSATION_MADE' }, async (message) => {
      const payload = message.payload as RoundResult & { players?: Player[] }

      // Apply scores and show cinematic before result
      setPhase('ACCUSATION_CINEMATIC')
      setLastResult(payload)

      // Reconcile full player list if server included it
      if (payload.players && Array.isArray(payload.players) && payload.players.length > 0) {
        reconcilePlayersFromPayload(payload.players)
      } else if (payload.scores) {
        // Fallback: apply scores from the scores map
        setPlayers(
          playersRef.current.map((p) => ({
            ...p,
            score: payload.scores![p.id] ?? p.score,
          }))
        )
      }

      // Verify in background (log-only, don't block state updates)
      verifyBroadcastPhase('ROUND_RESULT').then(valid => {
        if (!valid) console.warn('[Security] ACCUSATION_MADE phase mismatch detected — reconciling from DB')
        if (!valid) reconcileFromDb()
      })
    })

    // ── Broadcast: ROUND_STARTED ──
    channel.on('broadcast', { event: 'ROUND_STARTED' }, async (message) => {
      const payload = message.payload as {
        roundNumber: number; policeId: string; phase: string; phaseEndsAt?: string; players?: Player[]
      }

      // Apply state IMMEDIATELY
      const currentRoom = useGameStore.getState().room
      if (currentRoom) {
        setRoom({ ...currentRoom, phaseEndsAt: payload.phaseEndsAt })
      }
      setCurrentRound(payload.roundNumber)
      setPoliceId(payload.policeId)
      setPhase('DISCUSSION')
      setMyRole(null, null)
      clearInteractiveState()

      // Reconcile full player list if included
      if (payload.players) {
        reconcilePlayersFromPayload(payload.players)
      }

      setTimeout(() => { fetchMyRole() }, 500)

      // Verify in background
      verifyBroadcastPhase('DISCUSSION').then(valid => {
        if (!valid) {
          console.warn('[Security] ROUND_STARTED phase mismatch — reconciling from DB')
          reconcileFromDb()
        }
      })
    })

    // ── Broadcast: GAME_ENDED ──
    channel.on('broadcast', { event: 'GAME_ENDED' }, async (message) => {
      const payload = message.payload as { finalScores: FinalScore[]; players?: Player[] }

      // Apply state IMMEDIATELY
      setPhase('FINAL_RESULTS')
      setFinalScores(payload.finalScores)
      clearInteractiveState()

      // Reconcile player list for final scores display
      if (payload.players) {
        reconcilePlayersFromPayload(payload.players)
      }

      navigate(`/results?room=${roomCode}`)

      // Verify in background
      verifyBroadcastPhase('FINAL_RESULTS').then(valid => {
        if (!valid) console.warn('[Security] GAME_ENDED phase mismatch detected')
      })
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

    // ── Broadcast: VOICE_MUTED ──
    channel.on('broadcast', { event: 'VOICE_MUTED' }, (message) => {
      const payload = message.payload as { playerId: string; isMuted: boolean }
      useVoiceStore.getState().setRemoteMuted(payload.playerId, payload.isMuted)
    })

    // ── Subscribe & track ──
    let retryTimeoutId: ReturnType<typeof setTimeout>;
    let reconcileIntervalId: ReturnType<typeof setInterval>;
    
    const subscribeToChannel = () => {
      channel.subscribe(async (status, err) => {
        setStatusStr(status + (err ? ` (${err})` : ''))
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          await channel.track({
            playerId: myPlayerId,
            username: currentUsername,
            online_at: new Date().toISOString(),
          })

          // Reconcile immediately on (re)connect to catch any missed broadcasts
          reconcileFromDb()

          // Start periodic reconciliation (every 10 seconds)
          clearInterval(reconcileIntervalId)
          reconcileIntervalId = setInterval(() => {
            reconcileFromDb()
          }, 10_000)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnected(false)
          clearInterval(reconcileIntervalId)
          
          // Auto-reconnect after 3 seconds on transport failure
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(retryTimeoutId)
            retryTimeoutId = setTimeout(() => {
              setStatusStr('RECONNECTING...')
              subscribeToChannel()
            }, 3000)
          }
        }
      })
    }
    
    subscribeToChannel()

    return () => {
      clearTimeout(retryTimeoutId)
      clearInterval(reconcileIntervalId)
      setConnected(false)
      channelRef.current = null
      setChannelObj(null)
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

  // ── Auto-Broadcast: Local Mute State ──
  const isMuted = useVoiceStore((s) => s.isMuted)
  useEffect(() => {
    if (channelRef.current && myPlayerId && connected) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'VOICE_MUTED',
        payload: { playerId: myPlayerId, isMuted },
      })
    }
  }, [isMuted, myPlayerId, connected])

  return { channel: channelObj, connected, broadcastPoint, broadcastEmote, status: statusStr }
}

