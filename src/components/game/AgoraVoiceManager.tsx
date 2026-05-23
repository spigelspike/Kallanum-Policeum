import { AgoraRTCProvider, useJoin, useLocalMicrophoneTrack, useRemoteUsers, RemoteAudioTrack, useRTCClient } from 'agora-rtc-react'
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

function VoiceLogic() {
  const roomCode = useGameStore(s => s.room?.code)
  const myPlayerId = useGameStore(s => s.myPlayerId)
  
  const { isMuted, isDeafened, setSpeaking, resetVoice } = useVoiceStore()
  const rtcClient = useRTCClient()
  
  const appId = import.meta.env.VITE_AGORA_APP_ID

  // We only connect to the voice channel if we are in a room, have a player ID, and an App ID
  const shouldJoin = !!(appId && roomCode && myPlayerId)

  // useJoin handles automatically joining and leaving the channel
  useJoin({
    appid: appId,
    channel: roomCode || 'lobby',
    token: null, // Null is allowed for "Testing Mode" projects in Agora
    uid: myPlayerId || undefined // String UIDs are supported by Agora now!
  }, shouldJoin)

  // Request microphone access and create the local audio track
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(shouldJoin)
  const remoteUsers = useRemoteUsers()

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
        const uidStr = vol.uid.toString()
        
        // Prevent showing ourselves as speaking if we are muted (just in case of echo)
        if (uidStr === myPlayerId) {
          if (!isMuted) setSpeaking(myPlayerId, speaking)
        } else {
          setSpeaking(uidStr, speaking)
        }
      })
    }

    rtcClient.on("volume-indicator", handleVolumeIndicator)

    return () => {
      rtcClient.off("volume-indicator", handleVolumeIndicator)
    }
  }, [rtcClient, setSpeaking, myPlayerId, isMuted])

  return (
    <>
      {/* If the user is NOT deafened, render the audio streams of everyone else */}
      {!isDeafened && remoteUsers.map(user => (
        <RemoteAudioTrack key={user.uid} track={user.audioTrack} play={true} />
      ))}
    </>
  )
}
