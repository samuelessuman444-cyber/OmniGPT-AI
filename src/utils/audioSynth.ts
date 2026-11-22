import type { MusicArtifact, SynthTrack } from '../types/gengpt';

const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

export function noteToFrequency(note: string): number {
  const num = Number(note);
  if (!Number.isNaN(num) && num > 20) return num;
  const match = /^([A-G][#b]?)(-?\d)$/.exec(note.trim());
  if (!match) return 440;
  const [, pitch, octStr] = match;
  const semitone = NOTE_OFFSETS[pitch] ?? 0;
  const octave = parseInt(octStr, 10);
  const midi = (octave + 1) * 12 + semitone;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function scheduleTrack(
  ctx: BaseAudioContext,
  destination: AudioNode,
  track: SynthTrack,
  bpm: number,
  startTimeOffset: number
) {
  const secPerBeat = 60 / Math.max(40, Math.min(240, bpm || 110));
  const trackGain = ctx.createGain();
  trackGain.gain.value = Math.min(0.65, Math.max(0.05, track.gain ?? 0.25));
  trackGain.connect(destination);

  for (const n of track.notes || []) {
    const t0 = startTimeOffset + Math.max(0, n.time) * secPerBeat;
    const dur = Math.max(0.05, (n.duration || 0.5) * secPerBeat);
    const vel = Math.min(1, Math.max(0.05, n.velocity ?? 0.8));

    if (track.instrument === 'perc') {
      // Synthesized percussive hit (kick / snare / hat based on note octave or pitch)
      const freq = noteToFrequency(n.note);
      if (freq < 140) {
        // Kick
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t0);
        osc.frequency.exponentialRampToValueAtTime(42, t0 + 0.14);
        env.gain.setValueAtTime(vel * 0.9, t0);
        env.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
        osc.connect(env);
        env.connect(trackGain);
        osc.start(t0);
        osc.stop(t0 + 0.24);
      } else {
        // Crisp noise/metallic hat or snare
        const bufferSize = Math.floor(ctx.sampleRate * Math.min(0.18, dur));
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = freq > 400 ? 'highpass' : 'bandpass';
        filter.frequency.value = freq > 400 ? 5500 : 1200;
        const env = ctx.createGain();
        env.gain.setValueAtTime(vel * 0.45, t0);
        env.gain.exponentialRampToValueAtTime(0.001, t0 + (freq > 400 ? 0.08 : 0.16));
        noise.connect(filter);
        filter.connect(env);
        env.connect(trackGain);
        noise.start(t0);
      }
      continue;
    }

    const freq = noteToFrequency(n.note);
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    let wave: OscillatorType = 'triangle';
    let attack = 0.015;
    let release = 0.12;
    let cutoff = 4200;

    switch (track.instrument) {
      case 'sine':
        wave = 'sine';
        attack = 0.02;
        release = 0.15;
        break;
      case 'sawtooth':
        wave = 'sawtooth';
        cutoff = 2600;
        break;
      case 'square':
        wave = 'square';
        cutoff = 2100;
        break;
      case 'pad':
        wave = 'sawtooth';
        attack = Math.min(0.35, dur * 0.4);
        release = 0.45;
        cutoff = 1400;
        break;
      case 'bass':
        wave = 'triangle';
        attack = 0.01;
        release = 0.08;
        cutoff = 900;
        break;
      case 'pluck':
        wave = 'sawtooth';
        attack = 0.005;
        release = 0.18;
        cutoff = 3200;
        break;
      default:
        wave = 'triangle';
    }

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t0);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t0);
    if (track.instrument === 'pluck') {
      filter.frequency.exponentialRampToValueAtTime(380, t0 + Math.min(dur, 0.35));
    }

    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(vel * 0.45, t0 + attack);
    const sustainEnd = Math.max(t0 + attack + 0.01, t0 + dur - 0.02);
    env.gain.setValueAtTime(vel * 0.38, sustainEnd);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + release);

    osc.connect(filter);
    filter.connect(env);
    env.connect(trackGain);

    osc.start(t0);
    osc.stop(t0 + dur + release + 0.02);
  }
}

export class MusicSynthPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: number | null = null;

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  play(artifact: MusicArtifact, onEnded: () => void): number {
    this.stop();
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    this.ctx = ctx;

    const compressor = ctx.createDynamicsCompressor();
    const master = ctx.createGain();
    master.gain.value = 0.85;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;

    compressor.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);

    this.masterGain = master;
    this.analyser = analyser;

    const startOffset = ctx.currentTime + 0.05;
    let maxEnd = 0;
    const secPerBeat = 60 / Math.max(40, Math.min(240, artifact.bpm || 110));

    for (const track of artifact.tracks || []) {
      scheduleTrack(ctx, compressor, track, artifact.bpm, startOffset);
      for (const n of track.notes || []) {
        const end = (n.time + (n.duration || 0.5)) * secPerBeat + 0.5;
        if (end > maxEnd) maxEnd = end;
      }
    }

    const totalSec = Math.max(artifact.durationSeconds || 4, maxEnd);
    this.timer = window.setTimeout(() => {
      this.stop();
      onEnded();
    }, totalSec * 1000);

    return totalSec;
  }

  stop() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.masterGain = null;
    this.analyser = null;
  }
}

function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export async function renderMusicToWavBlob(artifact: MusicArtifact): Promise<Blob> {
  const sampleRate = 44100;
  const secPerBeat = 60 / Math.max(40, Math.min(240, artifact.bpm || 110));
  let maxEnd = artifact.durationSeconds || 8;
  for (const track of artifact.tracks || []) {
    for (const n of track.notes || []) {
      const end = (n.time + (n.duration || 0.5)) * secPerBeat + 0.6;
      if (end > maxEnd) maxEnd = end;
    }
  }
  const duration = Math.min(45, Math.max(2, maxEnd));
  const offline = new OfflineAudioContext(2, Math.ceil(sampleRate * duration), sampleRate);
  const compressor = offline.createDynamicsCompressor();
  compressor.connect(offline.destination);

  for (const track of artifact.tracks || []) {
    scheduleTrack(offline, compressor, track, artifact.bpm, 0.05);
  }

  const rendered = await offline.startRendering();
  return encodeWavFromAudioBuffer(rendered);
}
