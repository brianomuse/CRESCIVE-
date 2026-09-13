// ==================== CRESCIVE 3D GAME AUDIO ENGINE ====================
// Pure Web Audio API: 100% original, zero external assets, seamless loops, lag-free on Android & mobile browsers.

const STORAGE_KEY_MUSIC = "crescive_game_music_enabled_v1";
const STORAGE_KEY_SFX = "crescive_game_sfx_enabled_v1";

let audioCtx: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let sfxGainNode: GainNode | null = null;

let isMusicPlaying = false;
let musicIntervalId: number | null = null;
let musicStep = 0;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Master Music Bus
    musicGainNode = audioCtx.createGain();
    musicGainNode.gain.setValueAtTime(isMusicEnabled() ? 0.22 : 0, audioCtx.currentTime);
    musicGainNode.connect(audioCtx.destination);

    // Master SFX Bus
    sfxGainNode = audioCtx.createGain();
    sfxGainNode.gain.setValueAtTime(isSfxEnabled() ? 0.35 : 0, audioCtx.currentTime);
    sfxGainNode.connect(audioCtx.destination);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isMusicEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MUSIC);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function setMusicEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_MUSIC, String(enabled));
    if (musicGainNode && audioCtx) {
      musicGainNode.gain.setTargetAtTime(enabled ? 0.22 : 0, audioCtx.currentTime, 0.05);
    }
    if (!enabled && isMusicPlaying) {
      stopGameMusic();
    } else if (enabled && !isMusicPlaying) {
      startGameMusic();
    }
  } catch (e) {
    console.error("Failed to set music preference", e);
  }
}

export function isSfxEnabled(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SFX);
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function setSfxEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_SFX, String(enabled));
    if (sfxGainNode && audioCtx) {
      sfxGainNode.gain.setTargetAtTime(enabled ? 0.35 : 0, audioCtx.currentTime, 0.05);
    }
  } catch (e) {
    console.error("Failed to set sfx preference", e);
  }
}

// ----------------- Procedural Upbeat Futuristic Music Synthesizer -----------------
// Scales in D Dorian / Cyber Minor (D, E, F, G, A, B, C)
// Motivational upbeat 124 BPM electronic arpeggio & bassline
const BASS_NOTES = [146.83, 146.83, 174.61, 196.00, 220.00, 196.00, 174.61, 130.81]; // D3, D3, F3, G3, A3, G3, F3, C3
const LEAD_NOTES = [
  293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 293.66,
  349.23, 440.0, 587.33, 659.25, 587.33, 523.25, 440.0, 392.0
];

function playSynthNote(ctx: AudioContext, dest: GainNode, freq: number, duration: number, type: OscillatorType = "sawtooth", peakVol = 0.15) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, ctx.currentTime);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(peakVol, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);

  osc.start();
  osc.stop(ctx.currentTime + duration + 0.05);
}

function playPercussion(ctx: AudioContext, dest: GainNode, isKick: boolean) {
  if (isKick) {
    // Cyber Kick drum
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } else {
    // Snappy Cyber Hi-Hat
    const bufferSize = ctx.sampleRate * 0.04;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6000, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start();
  }
}

export function startGameMusic(): void {
  if (isMusicPlaying || !isMusicEnabled()) return;

  const ctx = getAudioContext();
  isMusicPlaying = true;
  musicStep = 0;

  const stepDurationMs = 125; // 16th notes at 120 BPM

  musicIntervalId = window.setInterval(() => {
    if (!isMusicPlaying || !musicGainNode || !isMusicEnabled()) return;

    try {
      const now = ctx.currentTime;
      const beat = musicStep % 16;
      
      // Kick on 0, 4, 8, 12
      if (beat % 4 === 0) {
        playPercussion(ctx, musicGainNode, true);
      }
      // Hi-hat on every offbeat
      if (beat % 2 === 1) {
        playPercussion(ctx, musicGainNode, false);
      }

      // Bass note every 2 steps
      if (beat % 2 === 0) {
        const bassFreq = BASS_NOTES[(musicStep >> 1) % BASS_NOTES.length];
        playSynthNote(ctx, musicGainNode, bassFreq, 0.22, "triangle", 0.25);
      }

      // Lead melody note
      if (beat % 2 === 0 || beat === 3 || beat === 7 || beat === 11 || beat === 15) {
        const leadFreq = LEAD_NOTES[musicStep % LEAD_NOTES.length];
        playSynthNote(ctx, musicGainNode, leadFreq, 0.16, "sawtooth", 0.12);
      }

      musicStep++;
    } catch {
      // Audio clock tick safe
    }
  }, stepDurationMs);
}

export function stopGameMusic(): void {
  isMusicPlaying = false;
  if (musicIntervalId !== null) {
    clearInterval(musicIntervalId);
    musicIntervalId = null;
  }
}

// ----------------- High-Quality Procedural Sound Effects -----------------

export function playCollectXpSound(isRare = false): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!sfxGainNode) return;

  const notes = isRare ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 880.0];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.05 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.05 + 0.2);

    osc.connect(gain);
    gain.connect(sfxGainNode!);

    osc.start(ctx.currentTime + idx * 0.05);
    osc.stop(ctx.currentTime + idx * 0.05 + 0.22);
  });
}

export function playLevelCompleteSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!sfxGainNode) return;

  const chord = [392.0, 493.88, 587.33, 783.99, 987.77];
  chord.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + idx * 0.06 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.06 + 0.6);

    osc.connect(gain);
    gain.connect(sfxGainNode!);

    osc.start(ctx.currentTime + idx * 0.06);
    osc.stop(ctx.currentTime + idx * 0.06 + 0.65);
  });
}

export function playWinSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!sfxGainNode) return;

  // Grand ascending fanfare
  const arpeggio = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0];
  arpeggio.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + idx * 0.08 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.5);

    osc.connect(gain);
    gain.connect(sfxGainNode!);

    osc.start(ctx.currentTime + idx * 0.08);
    osc.stop(ctx.currentTime + idx * 0.08 + 0.55);
  });
}

export function playLoseSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!sfxGainNode) return;

  const notes = [220.0, 196.0, 164.81, 130.81];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

    gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + idx * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 0.35);

    osc.connect(gain);
    gain.connect(sfxGainNode!);

    osc.start(ctx.currentTime + idx * 0.1);
    osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
  });
}

export function playJumpSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!sfxGainNode) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.12);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

  osc.connect(gain);
  gain.connect(sfxGainNode);
  osc.start();
  osc.stop(ctx.currentTime + 0.15);
}

export function playLaneSwitchSound(): void {
  if (!isSfxEnabled()) return;
  const ctx = getAudioContext();
  if (!sfxGainNode) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(380, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(sfxGainNode);
  osc.start();
  osc.stop(ctx.currentTime + 0.09);
}
