/**
 * CRESCIVE Focus Sanctuary — Procedural Ambient Audio Engine
 * Lightweight Web Audio API synthesis: zero external audio files, zero latency, offline-ready.
 */

import { SoundscapeId } from "../types";

class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentSoundscape: SoundscapeId = "none";
  private activeNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
  private dropletIntervalId: number | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5; // Default 50%

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private initMaster(): GainNode | null {
    const ctx = this.getContext();
    if (!ctx) return null;
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  public getSoundscape(): SoundscapeId {
    return this.currentSoundscape;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.1);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.masterGain) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.2);
    }
    return this.isMuted;
  }

  public stop(): void {
    if (this.dropletIntervalId !== null) {
      window.clearInterval(this.dropletIntervalId);
      this.dropletIntervalId = null;
    }

    if (this.ctx && this.masterGain) {
      // Gentle fade out before disconnecting
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
      setTimeout(() => {
        this.activeNodes.forEach((node) => {
          try {
            if (node.stop) node.stop();
            node.disconnect();
          } catch {}
        });
        this.activeNodes = [];
        this.currentSoundscape = "none";
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        }
      }, 350);
    } else {
      this.activeNodes.forEach((node) => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch {}
      });
      this.activeNodes = [];
      this.currentSoundscape = "none";
    }
  }

  public play(soundscape: SoundscapeId): void {
    if (soundscape === "none") {
      this.stop();
      return;
    }

    // Stop current soundscape first
    this.stop();

    setTimeout(() => {
      const ctx = this.getContext();
      const master = this.initMaster();
      if (!ctx || !master) return;

      this.currentSoundscape = soundscape;
      master.gain.setValueAtTime(this.isMuted ? 0 : this.volume, ctx.currentTime);

      switch (soundscape) {
        case "rain":
          this.buildCyberRain(ctx, master);
          break;
        case "cosmic":
          this.buildCosmicDrone(ctx, master);
          break;
        case "focus":
          this.buildDeepFocus(ctx, master);
          break;
        case "cafe":
          this.buildCafeMurmur(ctx, master);
          break;
      }
    }, 100);
  }

  /**
   * 🌧️ Cyber Rain: Filtered brown/pink noise with subtle procedural droplet pings.
   */
  private buildCyberRain(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    // Generate brown noise
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft raindrops
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(destination);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, rainGain);

    // Procedural random water droplets ping
    this.dropletIntervalId = window.setInterval(() => {
      if (this.currentSoundscape !== "rain" || !this.ctx) return;
      try {
        const dropFreq = 1600 + Math.random() * 1200;
        const osc = this.ctx.createOscillator();
        const dropGain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(dropFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(dropFreq * 0.7, this.ctx.currentTime + 0.06);

        dropGain.gain.setValueAtTime(0.04 * (Math.random() * 0.5 + 0.5), this.ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

        osc.connect(dropGain);
        dropGain.connect(destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.07);
      } catch {}
    }, 450);
  }

  /**
   * 🌌 Cosmic Drone: Layered detuned sine and triangle waves with slow LFO resonant breathing.
   */
  private buildCosmicDrone(ctx: AudioContext, destination: GainNode): void {
    const freqs = [55, 110, 164.81]; // Root A1, Octave A2, Harmonic E3
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.25, ctx.currentTime);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    // LFO for cosmic breathing motion
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 12.5 second cycle
    lfoGain.gain.setValueAtTime(140, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.activeNodes.push(lfo, lfoGain);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime((idx - 1) * 4, ctx.currentTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(idx === 0 ? 0.35 : 0.15, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      this.activeNodes.push(osc, oscGain);
    });

    filter.connect(droneGain);
    droneGain.connect(destination);
    this.activeNodes.push(filter, droneGain);
  }

  /**
   * 🧘 Deep Focus: 432Hz fundamental with soft 6Hz binaural/theta frequency offset.
   */
  private buildDeepFocus(ctx: AudioContext, destination: GainNode): void {
    const focusGain = ctx.createGain();
    focusGain.gain.setValueAtTime(0.2, ctx.currentTime);

    // Left channel 432Hz
    const oscLeft = ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.setValueAtTime(432, ctx.currentTime);

    // Right channel 438Hz (6Hz theta differential)
    const oscRight = ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.setValueAtTime(438, ctx.currentTime);

    // Warm sub harmonic 216Hz
    const subOsc = ctx.createOscillator();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(216, ctx.currentTime);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.12, ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(focusGain);

    oscLeft.connect(focusGain);
    oscRight.connect(focusGain);

    focusGain.connect(destination);

    oscLeft.start();
    oscRight.start();
    subOsc.start();

    this.activeNodes.push(oscLeft, oscRight, subOsc, subGain, focusGain);
  }

  /**
   * ☕ Café Murmur: Muffled warm acoustic bandpass noise ambience.
   */
  private buildCafeMurmur(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Dual filtering for warm indoor café ambiance
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(350, ctx.currentTime);
    bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(650, ctx.currentTime);

    const cafeGain = ctx.createGain();
    cafeGain.gain.setValueAtTime(0.22, ctx.currentTime);

    whiteNoise.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(cafeGain);
    cafeGain.connect(destination);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, bandpass, lowpass, cafeGain);
  }
}

export const focusAudioEngine = new FocusAudioEngine();
