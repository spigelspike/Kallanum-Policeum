import AgoraRTC from 'agora-rtc-sdk-ng'

import { useGameStore } from '../../stores/gameStore'
import { useVoiceStore } from '../../stores/voiceStore'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Create a single global client instance for Agora
// We use the RTC mode and vp8 codec which is standard for high quality audio/video
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

// Map to track timeouts for the speaking indicator debounce
const speakingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {}

// Track generation of joins to prevent strict-mode race conditions with singleton client
let globalJoinCount = 0;

const getNumericUid = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
  }
  // Ensure the ID is exactly between 1 and 65535
  return (Math.abs(hash) % 65534) + 1;
}

export default function AgoraVoiceManager() {
  const roomCode = useGameStore(s => s.room?.code)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const players = useGameStore(s => s.players)
  const { isMuted, isDeafened, setSpeaking, resetVoice, localVolumeMap, localMutedMap } = useVoiceStore()

  const [localTrack, setLocalTrack] = useState<any | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<any[]>([])

  const playersRef = useRef(players)
  const isMutedRef = useRef(isMuted)
  const isDeafenedRef = useRef(isDeafened)
  const myPlayerIdRef = useRef(myPlayerId)

  // Sync refs to avoid stale closures in listeners
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])
  useEffect(() => { isDeafenedRef.current = isDeafened }, [isDeafened])
  useEffect(() => { myPlayerIdRef.current = myPlayerId }, [myPlayerId])

  // Reset voice store on mount and cleanup on unmount
  useEffect(() => {
    resetVoice()
    return () => resetVoice()
  }, [resetVoice])

  // Manage joining the room and publishing our mic track
  useEffect(() => {
    const appId = import.meta.env.VITE_AGORA_APP_ID
    if (!appId || !roomCode || !myPlayerId) {
      return
    }

    let active = true
    let micTrack: any | null = null
    const numericUid = getNumericUid(myPlayerId)
    const myJoinId = ++globalJoinCount;

    const getAgoraToken = async (rCode: string, uId: number) => {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agora-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ roomCode: rCode, uid: uId })
        }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch Agora token')
      }
      const { token } = await response.json()
      return token
    }

    const setupVoice = async () => {
      try {
        console.log("[Agora] Joining channel:", roomCode, "with UID:", numericUid)
        const token = await getAgoraToken(roomCode, numericUid)
        await client.join(appId, roomCode, token, numericUid)
        
        client.on('token-privilege-will-expire', async () => {
          if (!active) return
          console.log("[Agora] Token expiring, renewing...")
          try {
            const newToken = await getAgoraToken(roomCode, numericUid)
            await client.renewToken(newToken)
          } catch(e) {
            console.error("[Agora] Failed to renew token", e)
          }
        })

        if (!active) {
          await client.leave()
          return
        }

        console.log("[Agora] Creating microphone track...")
        micTrack = await AgoraRTC.createMicrophoneAudioTrack({
          ANS: true,
          AEC: true
        })

        if (!active) {
          micTrack.close()
          if (myJoinId === globalJoinCount) await client.leave()
          return
        }

        setLocalTrack(micTrack)
        // Set initial mute state
        await micTrack.setMuted(isMutedRef.current)

        console.log("[Agora] Publishing microphone track...")
        await client.publish(micTrack)
        console.log("[Agora] Successfully joined channel and published track.")
      } catch (err: any) {
        const isAborted = err?.code === 'OPERATION_ABORTED' || err?.message?.includes('OPERATION_ABORTED')
        if (isAborted) {
          console.log("[Agora] Join/Publish aborted (likely due to room change or StrictMode cleanup).")
        } else {
          console.error("[Agora] Error during channel join or publish:", err)
          if (err?.name === 'NotAllowedError' || err?.message?.includes('NotAllowedError') || err?.message?.includes('Permission denied')) {
            alert("Voice Chat Error: Microphone access was denied. Please allow microphone permissions in your browser settings and refresh the page to use Voice Chat.")
          } else if (err?.message?.includes('Failed to fetch Agora token')) {
            alert("Voice Chat Error: Server failed to generate a secure voice token. The game owner needs to configure Agora Secrets.")
          }
        }
      }
    }

    setupVoice()

    return () => {
      active = false
      setLocalTrack(null)
      const cleanup = async () => {
        if (micTrack) {
          console.log("[Agora] Unpublishing and closing local track...")
          try {
            await client.unpublish(micTrack)
          } catch (e) {}
          micTrack.close()
        }
        if (myJoinId === globalJoinCount) {
          try {
            console.log("[Agora] Leaving channel...")
            await client.leave()
          } catch (e) {}
        }
      }
      cleanup()
    }
  }, [roomCode, myPlayerId])

  // Handle local mute state changes
  useEffect(() => {
    if (localTrack) {
      localTrack.setMuted(isMuted)
      if (isMuted && myPlayerId) {
        if (speakingTimeouts[myPlayerId]) {
          clearTimeout(speakingTimeouts[myPlayerId])
          delete speakingTimeouts[myPlayerId]
        }
        setSpeaking(myPlayerId, false)
      }
    }
  }, [isMuted, localTrack, myPlayerId, setSpeaking])

  // Track remote users and subscribe/play their audio tracks
  useEffect(() => {
    const handleUserPublished = async (user: any, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        console.log("[Agora] Remote user published audio:", user.uid)
        try {
          await client.subscribe(user, 'audio')
          setRemoteUsers(prev => {
            if (prev.find(u => u.uid === user.uid)) return prev
            return [...prev, user]
          })
          // Only play audio if we are not deafened
          if (!isDeafenedRef.current && user.audioTrack) {
            user.audioTrack.play()
          }
        } catch (err) {
          console.error("[Agora] Subscribe remote user audio error:", err)
        }
      }
    }

    const handleUserUnpublished = (user: any, mediaType: 'audio' | 'video') => {
      if (mediaType === 'audio') {
        console.log("[Agora] Remote user unpublished audio:", user.uid)
        if (user.audioTrack) {
          user.audioTrack.stop()
        }
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
      }
    }

    const handleUserLeft = (user: any) => {
      console.log("[Agora] Remote user left:", user.uid)
      if (user.audioTrack) {
        user.audioTrack.stop()
      }
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
    }

    client.on("user-published", handleUserPublished)
    client.on("user-unpublished", handleUserUnpublished)
    client.on("user-left", handleUserLeft)

    return () => {
      client.off("user-published", handleUserPublished)
      client.off("user-unpublished", handleUserUnpublished)
      client.off("user-left", handleUserLeft)
    }
  }, [])

  // Handle deafen toggle: stop or play remote audio tracks
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        if (isDeafened) {
          user.audioTrack.stop()
        } else {
          user.audioTrack.play()
        }
      }
    })
  }, [isDeafened, remoteUsers])

  // Apply local volume and mute controls to remote tracks
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        let pId: string | undefined
        // Reverse lookup: find which player ID matches this numeric UID
        const matchedPlayer = players.find(p => getNumericUid(p.id) === user.uid)
        if (matchedPlayer) {
          pId = matchedPlayer.id
        }

        if (pId) {
          const isLocallyMuted = localMutedMap[pId]
          if (isLocallyMuted || isDeafened) {
            user.audioTrack.setVolume(0)
          } else {
            const vol = localVolumeMap[pId] ?? 100
            user.audioTrack.setVolume(vol)
          }
        }
      }
    })
  }, [localVolumeMap, localMutedMap, remoteUsers, isDeafened, players])

  // Set up volume indicators to power the glowing green rings around avatars!
  useEffect(() => {
    client.enableAudioVolumeIndicator()

    const handleVolumeIndicator = (volumes: { uid: string | number, level: number }[]) => {
      volumes.forEach((vol) => {
        // level goes from 0 to 100. >2 is a good sensitive threshold
        const speaking = vol.level > 2
        const numericUid = Number(vol.uid)
        
        let pId: string | undefined = undefined

        if (numericUid === 0 && myPlayerIdRef.current) {
          // Agora Web SDK sometimes reports local user as 0
          pId = myPlayerIdRef.current
        } else {
          // Reverse lookup: find which player ID matches this numeric UID
          const speakingPlayer = playersRef.current.find(p => getNumericUid(p.id) === numericUid)
          if (speakingPlayer) {
            pId = speakingPlayer.id
          }
        }
        
        if (pId) {
          if (speaking) {
            // Cancel any pending timeout that would remove the speaking ring
            if (speakingTimeouts[pId]) {
              clearTimeout(speakingTimeouts[pId])
              delete speakingTimeouts[pId]
            }
            
            // Show speaking (unless it's us and we are muted locally to prevent echo visuals)
            if (pId !== myPlayerIdRef.current || !isMutedRef.current) {
              setSpeaking(pId, true)
            }
          } else {
            // Debounce the stop-speaking indicator to prevent flickering
            if (!speakingTimeouts[pId]) {
              speakingTimeouts[pId] = setTimeout(() => {
                setSpeaking(pId, false)
                delete speakingTimeouts[pId]
              }, 300)
            }
          }
        }
      })
    }

    client.on("volume-indicator", handleVolumeIndicator)

    return () => {
      client.off("volume-indicator", handleVolumeIndicator)
    }
  }, [setSpeaking])

  return null
}
