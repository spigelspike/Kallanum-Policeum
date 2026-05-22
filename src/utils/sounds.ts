import { useSoundStore } from '../stores/soundStore'

// Initialize AudioContext lazily to comply with browser autoplay policies
let audioCtx: AudioContext | null = null

let hasBoundInteraction = false

function bindGlobalInteraction() {
  if (hasBoundInteraction || typeof window === 'undefined') return
  hasBoundInteraction = true
  
  const unlockAudio = () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    window.removeEventListener('click', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
  }
  
  window.addEventListener('click', unlockAudio, { once: true })
  window.addEventListener('touchstart', unlockAudio, { once: true })
  window.addEventListener('keydown', unlockAudio, { once: true })
}

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    bindGlobalInteraction()
  }
  return audioCtx
}

// Crisp subtle pop for buttons/tapping
export const playClick = () => {
  if (useSoundStore.getState().isMuted) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1)
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch (e) {
    console.warn("Audio playback failed", e)
  }
}

// Swoosh/whoosh sound for card flip
export const playFlip = () => {
  if (useSoundStore.getState().isMuted) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3)
    
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {
    console.warn("Audio playback failed", e)
  }
}

// Bright chime for emotes
export const playEmote = () => {
  if (useSoundStore.getState().isMuted) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc1.type = 'sine'
    osc2.type = 'triangle'
    
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime) // E5
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime) // G#5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    
    osc1.start()
    osc2.start()
    osc1.stop(ctx.currentTime + 0.4)
    osc2.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.warn("Audio playback failed", e)
  }
}

// Dramatic majestic chord for role reveal
export const playReveal = () => {
  if (useSoundStore.getState().isMuted) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Create a rich majestic chord (C major: C, E, G, C)
    const frequencies = [261.63, 329.63, 392.00, 523.25]
    const gain = ctx.createGain()
    
    // Smooth envelope for a majestic reveal
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5)

    frequencies.forEach(freq => {
      const osc = ctx.createOscillator()
      // Mix of sine and triangle for a richer tone
      osc.type = 'triangle'
      osc.frequency.value = freq
      osc.connect(gain)
      osc.start()
      osc.stop(ctx.currentTime + 1.5)
    })

    // Add a low bass rumble for impact
    const bassOsc = ctx.createOscillator()
    bassOsc.type = 'square'
    bassOsc.frequency.setValueAtTime(65.41, ctx.currentTime) // Low C
    
    // Lowpass filter for the bass
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(400, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.0)
    
    const bassGain = ctx.createGain()
    bassGain.gain.setValueAtTime(0, ctx.currentTime)
    bassGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)
    bassGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0)
    
    bassOsc.connect(filter)
    filter.connect(bassGain)
    bassGain.connect(ctx.destination)
    
    bassOsc.start()
    bassOsc.stop(ctx.currentTime + 1.0)

    gain.connect(ctx.destination)

  } catch (e) {
    console.warn("Audio playback failed", e)
  }
}

// Dramatic "wah wah wah wahhh" sad trombone losing sound
export const playLose = () => {
  if (useSoundStore.getState().isMuted) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Sad trombone — Bb4, A4, Ab4, G4 descending
    const notes = [
      { freq: 466.16, start: 0.0, duration: 0.35 },
      { freq: 440.00, start: 0.35, duration: 0.35 },
      { freq: 415.30, start: 0.70, duration: 0.35 },
      { freq: 392.00, start: 1.05, duration: 0.90 }, // final note slides down
    ]

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      // Sawtooth for brass-like tone
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

      // Slide the final note down dramatically
      if (start === 1.05) {
        osc.frequency.exponentialRampToValueAtTime(
          180,
          ctx.currentTime + start + duration
        )
      }

      // Envelope — quick attack, held, quick release
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start)
      gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + start + 0.04)
      gainNode.gain.setValueAtTime(0.18, ctx.currentTime + start + duration - 0.08)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)

      // Warm lowpass filter — makes it sound like a muted trombone
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1400, ctx.currentTime + start)
      filter.frequency.linearRampToValueAtTime(
        600,
        ctx.currentTime + start + duration
      )
      filter.Q.value = 3

      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration + 0.05)
    })

    // Low thud underneath for extra drama
    const thudOsc = ctx.createOscillator()
    const thudGain = ctx.createGain()
    thudOsc.type = 'sine'
    thudOsc.frequency.setValueAtTime(80, ctx.currentTime + 1.05)
    thudOsc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.8)
    thudGain.gain.setValueAtTime(0.3, ctx.currentTime + 1.05)
    thudGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.95)
    thudOsc.connect(thudGain)
    thudGain.connect(ctx.destination)
    thudOsc.start(ctx.currentTime + 1.05)
    thudOsc.stop(ctx.currentTime + 2.0)

  } catch (e) {
    console.warn("Audio playback failed", e)
  }
}

// Upbeat chime for winning/success
export const playWin = () => {
  if (useSoundStore.getState().isMuted) return
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Fanfare — C5, E5, G5, C6 ascending with final chord
    const melody = [
      { freq: 523.25, start: 0.0,  duration: 0.15 }, // C5
      { freq: 523.25, start: 0.15, duration: 0.15 }, // C5 repeated
      { freq: 523.25, start: 0.30, duration: 0.15 }, // C5 again
      { freq: 415.30, start: 0.45, duration: 0.25 }, // Ab4 (dip)
      { freq: 523.25, start: 0.70, duration: 0.35 }, // C5 (bounce back)
      { freq: 659.25, start: 1.05, duration: 0.35 }, // E5
      { freq: 783.99, start: 1.40, duration: 0.60 }, // G5 (held)
    ]

    melody.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)

      // Punchy envelope — fast attack, slight decay, clean release
      gainNode.gain.setValueAtTime(0, ctx.currentTime + start)
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + start + 0.02)
      gainNode.gain.setValueAtTime(0.10, ctx.currentTime + start + duration - 0.05)
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration)

      // Brighten the tone — trumpet-like
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1800, ctx.currentTime + start)
      filter.Q.value = 1.5

      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration + 0.05)
    })

    // Final triumphant chord — C, E, G together
    const chordFreqs = [523.25, 659.25, 783.99] // C5, E5, G5
    chordFreqs.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + 2.0)

      gainNode.gain.setValueAtTime(0, ctx.currentTime + 2.0)
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2.05)
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + 2.5)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3.2)

      filter.type = 'lowpass'
      filter.frequency.value = 3000

      osc.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(ctx.destination)

      osc.start(ctx.currentTime + 2.0)
      osc.stop(ctx.currentTime + 3.3)
    })

    // Snare-like percussive hit on the final chord
    const snareBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate)
    const snareData = snareBuffer.getChannelData(0)
    for (let i = 0; i < snareData.length; i++) {
      snareData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snareData.length, 2)
    }
    const snareSource = ctx.createBufferSource()
    snareSource.buffer = snareBuffer
    const snareGain = ctx.createGain()
    snareGain.gain.setValueAtTime(0.15, ctx.currentTime + 2.0)
    snareGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.2)
    snareSource.connect(snareGain)
    snareGain.connect(ctx.destination)
    snareSource.start(ctx.currentTime + 2.0)

  } catch (e) {
    console.warn("Audio playback failed", e)
  }
}
