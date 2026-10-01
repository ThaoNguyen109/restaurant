// Web Audio API based notification sound for restaurant kitchen and staff
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * Play pleasant restaurant kitchen chime (ding-dong) when new orders or items arrive
 */
export function playKitchenAlert() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Tone 1: 880Hz (A5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.3, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.5)

    // Tone 2: 1174Hz (D6)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(1174.66, now + 0.15)
    gain2.gain.setValueAtTime(0.35, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.9)
  } catch (err) {
    console.warn('Audio notification error:', err)
  }
}

/**
 * Play subtle status change chime for staff/waiter
 */
export function playStaffNotification() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(659.25, now) // E5
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.35)
  } catch (err) {
    console.warn('Audio notification error:', err)
  }
}

/**
 * Play vibrant, cheerful 3-tone chime (Do-Mi-Sol bell) for new guest reservations
 */
export function playReservationAlert() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Note 1: 523.25 Hz (C5 - Do)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(523.25, now)
    gain1.gain.setValueAtTime(0.35, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.4)

    // Note 2: 659.25 Hz (E5 - Mi)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(659.25, now + 0.15)
    gain2.gain.setValueAtTime(0.4, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.15)
    osc2.stop(now + 0.65)

    // Note 3: 783.99 Hz (G5 - Sol) with pleasant bell harmonic decay
    const osc3 = ctx.createOscillator()
    const gain3 = ctx.createGain()
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(783.99, now + 0.3)
    gain3.gain.setValueAtTime(0.45, now + 0.3)
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2)
    osc3.connect(gain3)
    gain3.connect(ctx.destination)
    osc3.start(now + 0.3)
    osc3.stop(now + 1.2)

    // Note 4: 1046.50 Hz (C6 - High Do) subtle shimmer
    const osc4 = ctx.createOscillator()
    const gain4 = ctx.createGain()
    osc4.type = 'sine'
    osc4.frequency.setValueAtTime(1046.50, now + 0.45)
    gain4.gain.setValueAtTime(0.25, now + 0.45)
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 1.4)
    osc4.connect(gain4)
    gain4.connect(ctx.destination)
    osc4.start(now + 0.45)
    osc4.stop(now + 1.4)
  } catch (err) {
    console.warn('Audio notification error:', err)
  }
}
