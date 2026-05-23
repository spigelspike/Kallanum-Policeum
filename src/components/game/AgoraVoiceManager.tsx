import { AgoraRTCProvider, useJoin, useLocalMicrophoneTrack, useRemoteUsers, useRemoteAudioTracks, RemoteAudioTrack, useRTCClient, usePublish } from 'agora-rtc-react'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { useGameStore } from '../../stores/gameStore'
import { useVoiceStore } from '../../stores/voiceStore'
import { useEffect, useState } from 'react'

// Create a single global client instance for Agora
// We use the RTC mode and vp8 codec which is standard for high quality audio/video
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })

export default function AgoraVoiceManager() {
  return (
    <AgoraRTCProvider client={client}>
      <VoiceLogic />
    </AgoraRTCProvider>
  )
}

// Map to track timeouts for the speaking indicator debounce
const speakingTimeouts: Record<string, ReturnType<typeof setTimeout>> = {}

function VoiceLogic() {
  const roomCode = useGameStore(s => s.room?.code)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  const players = useGameStore(s => s.players) // Need this to reverse-lookup the speaking player
  
  const { isMuted, isDeafened, setSpeaking, resetVoice } = useVoiceStore()
  const rtcClient = useRTCClient()
  
  const appId = import.meta.env.VITE_AGORA_APP_ID

  // We only connect to the voice channel if we are in a room, have a player ID, and an App ID
  const shouldJoin = !!(appId && roomCode && myPlayerId)

  // Agora has a known bug with String UIDs crashing during track publishing (invalid data channel id).
  // Furthermore, its internal DataChannel expects IDs under 65535! 
  // We use a safe numeric hash of the player UUID instead, squashed into 16 bits!
  const getNumericUid = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = Math.imul(31, hash) + id.charCodeAt(i) | 0;
    }
    // Ensure the ID is exactly between 1 and 65535
    return (Math.abs(hash) % 65534) + 1;
  }

  const myNumericUid = myPlayerId ? getNumericUid(myPlayerId) : undefined;

  // useJoin handles automatically joining and leaving the channel
  useJoin({
    appid: appId,
    channel: roomCode || 'lobby',
    token: null, // Null is allowed for "Testing Mode" projects in Agora
    uid: myNumericUid 
  }, shouldJoin)

  // Request microphone access and create the local audio track
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(shouldJoin)
  const remoteUsers = useRemoteUsers()
  
  // We MUST explicitly subscribe to remote users' audio tracks!
  const { audioTracks } = useRemoteAudioTracks(remoteUsers)

  // CRITICAL: We must actually publish the track to the server so others can hear it!
  usePublish(localMicrophoneTrack ? [localMicrophoneTrack] : [])

  // Ensure we start muted and clean up when leaving
  useEffect(() => {
    resetVoice()
    return () => resetVoice()
  }, [resetVoice])

  // Handle local mute/unmute
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setMuted(isMuted)
      
      // If we mute ourselves, we should immediately stop showing our own speaking ring
      if (isMuted && myPlayerId) {
        if (speakingTimeouts[myPlayerId]) {
          clearTimeout(speakingTimeouts[myPlayerId])
          delete speakingTimeouts[myPlayerId]
        }
        setSpeaking(myPlayerId, false)
      }
    }
  }, [isMuted, localMicrophoneTrack, myPlayerId, setSpeaking])

  // Set up volume indicators to power the glowing green rings around avatars!
  useEffect(() => {
    // Tell Agora to report volume levels every 200ms
    rtcClient.enableAudioVolumeIndicator()

    const handleVolumeIndicator = (volumes: { uid: string | number, level: number }[]) => {
      volumes.forEach((vol) => {
        // level goes from 0 to 100. >5 is a good threshold for speaking vs background noise
        const speaking = vol.level > 5
        const numericUid = Number(vol.uid)
        
        // Reverse lookup: find which player ID matches this numeric UID
        const speakingPlayer = players.find(p => getNumericUid(p.id) === numericUid)
        
        if (speakingPlayer) {
          const pId = speakingPlayer.id
          
          if (speaking) {
            // Cancel any pending timeout that would remove the speaking ring
            if (speakingTimeouts[pId]) {
              clearTimeout(speakingTimeouts[pId])
              delete speakingTimeouts[pId]
            }
            
            // Show speaking (unless it's us and we are muted locally to prevent echo visuals)
            if (pId !== myPlayerId || !isMuted) {
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

    rtcClient.on("volume-indicator", handleVolumeIndicator)

    return () => {
      rtcClient.off("volume-indicator", handleVolumeIndicator)
    }
  }, [rtcClient, setSpeaking, myPlayerId, isMuted, players])

  return (
    <>
      {/* If the user is NOT deafened, render the audio streams of everyone else */}
      {!isDeafened && audioTracks.map(track => (
        <RemoteAudioTrack key={track.getUserId()} track={track} play={true} />
      ))}
    </>
  )
}
