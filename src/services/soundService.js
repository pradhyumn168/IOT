/**
 * Sound Service for ObjectSense
 * Handles playback of custom MP3 audio files with Web Audio API fallbacks,
 * preload management, and browser autoplay handling.
 */

let detectionAudio = null;
let audioUnlocked = false;

/**
 * Resolves the path to the detection sound MP3
 * Ensures correct path in both development and production (handles Vite base path)
 */
export function getDetectionAudioPath() {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : base + '/'}sounds/object-detected.mp3`;
}

/**
 * Initializes and caches the Audio instance for object-detected.mp3
 */
function getDetectionAudio() {
  if (typeof window === 'undefined') return null;

  if (!detectionAudio) {
    const audioPath = getDetectionAudioPath();
    detectionAudio = new Audio(audioPath);
    detectionAudio.preload = 'auto';
    detectionAudio.volume = 0.85;

    detectionAudio.addEventListener('error', (e) => {
      console.warn(
        `[SoundService] Notice: Could not load audio from "${audioPath}". Ensure the MP3 file is placed at "public/sounds/object-detected.mp3". Falling back to synthetic tone.`,
        e
      );
    });
  }
  return detectionAudio;
}

/**
 * Automatically unlock audio context / elements on first user interaction
 * to comply with modern browser autoplay policies.
 */
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;

    try {
      const audio = getDetectionAudio();
      if (audio) {
        // Pre-load the audio buffer
        audio.load();
      }
    } catch {
      // Ignore initial interaction errors
    }

    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
}

/**
 * Play the custom detection sound from public/sounds/object-detected.mp3
 * Falls back to synthetic Web Audio beep if the MP3 cannot be played.
 */
export function playObjectDetectedSound() {
  try {
    const audio = getDetectionAudio();
    if (!audio) {
      playDetectionBeep();
      return;
    }

    // Reset playback position so subsequent triggers play from start
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name === 'NotAllowedError') {
          console.debug('[SoundService] Autoplay blocked by browser until user interacts with the page.');
        } else {
          console.debug('[SoundService] MP3 playback failed, falling back to synth beep:', err);
          playDetectionBeep();
        }
      });
    }
  } catch (error) {
    console.debug('[SoundService] Error triggering detection audio:', error);
    playDetectionBeep();
  }
}

/**
 * Synthetic Web Audio API oscillator beep (used as fallback or for clicks)
 */
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Synthetic fallback radar ping
 */
export function playDetectionBeep(frequency = 880, duration = 0.08) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Graceful silent fail
  }
}

/**
 * Play subtle radar sweep click
 */
export function playSweepClick() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);

    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch {
    // Graceful silent fail
  }
}
