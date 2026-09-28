import { Song, EqualizerBands } from '../types/music';

type AudioTimeUpdateCallback = (currentTime: number, duration: number) => void;
type AudioEndedCallback = () => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private vocalFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;

  // HTML5 audio for URLs & Blobs
  private audioElement: HTMLAudioElement | null = null;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;

  // Synthesizer state for procedural playback
  private synthInterval: number | null = null;
  private synthStep = 0;
  private isSynthPlaying = false;
  private synthStartTime = 0;
  private synthCurrentOffset = 0;

  // State
  private currentSong: Song | null = null;
  private isPlaying = false;
  private volume = 0.85;
  private isKaraokeMode = false;
  private equalizer: EqualizerBands = { bass: 0, mid: 0, treble: 0, spatialWidth: 0.8 };

  // Callbacks
  private onTimeUpdateListeners: Set<AudioTimeUpdateCallback> = new Set();
  private onEndedListeners: Set<AudioEndedCallback> = new Set();
  private timeTicker: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (!this.analyser) {
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.82;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;

      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 200;
      this.bassFilter.gain.value = this.equalizer.bass;

      this.midFilter = this.ctx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.value = 1000;
      this.midFilter.Q.value = 1.0;
      this.midFilter.gain.value = this.equalizer.mid;

      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.value = 3500;
      this.trebleFilter.gain.value = this.equalizer.treble;

      // Vocal cancellation / suppression filter for Karaoke Mode
      this.vocalFilter = this.ctx.createBiquadFilter();
      this.vocalFilter.type = 'peaking';
      this.vocalFilter.frequency.value = 1800;
      this.vocalFilter.Q.value = 0.7;
      this.vocalFilter.gain.value = 0; // 0 = normal, -18 dB = vocal suppressed

      try {
        if (this.ctx.createStereoPanner) {
          this.stereoPanner = this.ctx.createStereoPanner();
        }
      } catch {
        this.stereoPanner = null;
      }

      // Chain: Source -> bass -> mid -> treble -> vocalFilter -> analyser -> masterGain -> destination
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.vocalFilter);
      this.vocalFilter.connect(this.analyser);
      this.analyser.connect(this.masterGain);

      if (this.stereoPanner) {
        this.masterGain.connect(this.stereoPanner);
        this.stereoPanner.connect(this.ctx.destination);
      } else {
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  public async playSong(song: Song, resumeTime = 0) {
    this.initContext();
    this.stopCurrent();

    this.currentSong = song;
    this.isPlaying = true;

    if (song.audio_source_type === 'blob' || (song.audio_source_type === 'url' && song.audio_url)) {
      this.playHtmlAudio(song.audio_url, resumeTime);
    } else {
      this.playSynthPreset(song, resumeTime);
    }

    this.startTimeTicker();
  }

  private playHtmlAudio(url: string, startTime = 0) {
    if (!this.ctx) return;

    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.preload = 'auto';

      try {
        if (this.bassFilter) {
          this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
          this.mediaSourceNode.connect(this.bassFilter);
        }
      } catch {
        // In case CORS blocks WebAudio node routing, the HTMLAudioElement still plays direct audio
      }

      this.audioElement.addEventListener('ended', () => {
        this.onSongEnded();
      });
    }

    this.audioElement.src = url;
    this.audioElement.volume = this.volume;
    if (startTime > 0) {
      this.audioElement.currentTime = startTime;
    }

    const playPromise = this.audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Direct stream playback error, falling back to procedural audio:', err);
        if (this.currentSong) {
          this.playSynthPreset(this.currentSong, startTime);
        }
      });
    }
  }

  // High-fidelity multi-timbral procedural audio engine
  private playSynthPreset(song: Song, startTime = 0) {
    this.isSynthPlaying = true;
    this.synthStartTime = (this.ctx?.currentTime || 0) - startTime;
    this.synthCurrentOffset = startTime;
    this.synthStep = Math.floor((startTime * (song.bpm || 120)) / 60 * 4);

    const bpm = song.bpm || 120;
    const stepDuration = 60 / bpm / 4; // 16th note in seconds

    // Root scales per genre
    const scales: Record<string, number[]> = {
      romantic_night: [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392], // A minor
      edm_workout: [130.81, 146.83, 155.56, 174.61, 196.00, 207.65, 233.08], // C minor
      lofi_chill: [174.61, 196.00, 220.00, 246.94, 261.63, 329.63], // F Maj7 pentatonic
      desi_trap: [146.83, 155.56, 185.00, 196.00, 220.00, 246.94], // Bhairav / D Phrygian Dominant
      acoustic_monsoon: [196.00, 220.00, 246.94, 293.66, 329.63, 392.00], // G major
      cyber_synthwave: [110.00, 130.81, 146.83, 164.81, 196.00, 220.00], // A minor synth
      sufi_ambient: [146.83, 164.81, 196.00, 220.00, 261.63, 293.66], // D Dorian
    };

    const activeScale = scales[song.synth_preset || 'romantic_night'] || scales.romantic_night;

    const playStep = () => {
      if (!this.isSynthPlaying || !this.ctx || !this.bassFilter) return;

      const now = this.ctx.currentTime;
      const step = this.synthStep % 16;
      const isKick = step % 4 === 0;
      const isSnare = step % 8 === 4;
      const isHiHat = step % 2 === 0;

      // 1. Kick Drum
      if (isKick) {
        this.triggerDrum(now, 120, 40, 0.25, 'sine', 0.8);
      }

      // 2. Snare / Clap
      if (isSnare) {
        this.triggerSnare(now);
      }

      // 3. Hi-Hat
      if (isHiHat) {
        this.triggerHiHat(now, step % 4 === 2 ? 0.3 : 0.15);
      }

      // 4. Bassline
      if (step % 2 === 0) {
        const rootFreq = activeScale[0] / 2;
        const bassNote = activeScale[(this.synthStep % 4)] / 2 || rootFreq;
        this.triggerSynthNote(now, bassNote, stepDuration * 1.8, 'sawtooth', 0.35, 300);
      }

      // 5. Melodic Chords & Arpeggios
      if (step % 4 === 0 || step === 2 || step === 10) {
        const noteIndex = (this.synthStep * 2 + (step % 3)) % activeScale.length;
        const melodyFreq = activeScale[noteIndex] * (step % 8 === 0 ? 2 : 1);
        this.triggerSynthNote(now, melodyFreq, stepDuration * 2.5, 'triangle', 0.25, 2400);
      }

      // 6. Atmospheric Pad Drone
      if (this.synthStep % 16 === 0) {
        const padFreq = activeScale[1] || 220;
        this.triggerSynthNote(now, padFreq, stepDuration * 16, 'sine', 0.18, 1200);
      }

      this.synthStep++;
      this.synthCurrentOffset += stepDuration;

      // Check duration
      if (this.currentSong && this.synthCurrentOffset >= this.currentSong.duration) {
        this.onSongEnded();
      }
    };

    // Run rhythmic loop
    this.synthInterval = window.setInterval(playStep, stepDuration * 1000);
  }

  private triggerDrum(time: number, startFreq: number, endFreq: number, duration: number, type: OscillatorType, gainVal: number) {
    if (!this.ctx || !this.bassFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), time + duration);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.bassFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.midFilter) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 900;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.midFilter);

    noise.start(time);
  }

  private triggerHiHat(time: number, vol = 0.2) {
    if (!this.ctx || !this.trebleFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(8000 + Math.random() * 2000, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain);
    gain.connect(this.trebleFilter);

    osc.start(time);
    osc.stop(time + 0.05);
  }

  private triggerSynthNote(time: number, freq: number, duration: number, type: OscillatorType, maxGain = 0.3, filterFreq = 1800) {
    if (!this.ctx || !this.bassFilter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, time);
    filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.4, time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(maxGain, time + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bassFilter);

    osc.start(time);
    osc.stop(time + duration);
  }

  private startTimeTicker() {
    this.stopTimeTicker();
    this.timeTicker = window.setInterval(() => {
      if (!this.isPlaying || !this.currentSong) return;

      let current = 0;
      if (this.audioElement && this.currentSong.audio_source_type !== 'synth') {
        current = this.audioElement.currentTime;
      } else {
        current = this.synthCurrentOffset;
      }

      this.onTimeUpdateListeners.forEach((cb) => cb(current, this.currentSong?.duration || 180));
    }, 250);
  }

  private stopTimeTicker() {
    if (this.timeTicker !== null) {
      clearInterval(this.timeTicker);
      this.timeTicker = null;
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
    }
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.isSynthPlaying = false;
  }

  public resume() {
    if (!this.currentSong) return;
    this.initContext();
    this.isPlaying = true;

    if (this.audioElement && this.currentSong.audio_source_type !== 'synth') {
      this.audioElement.play().catch(() => {});
    } else {
      this.playSynthPreset(this.currentSong, this.synthCurrentOffset);
    }
    this.startTimeTicker();
  }

  public seek(seconds: number) {
    if (!this.currentSong) return;
    if (this.audioElement && this.currentSong.audio_source_type !== 'synth') {
      this.audioElement.currentTime = seconds;
    } else {
      this.synthCurrentOffset = seconds;
      if (this.isPlaying) {
        if (this.synthInterval !== null) {
          clearInterval(this.synthInterval);
        }
        this.playSynthPreset(this.currentSong, seconds);
      }
    }
    this.onTimeUpdateListeners.forEach((cb) => cb(seconds, this.currentSong?.duration || 180));
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // Toggle Karaoke Mode (Center-channel vocal suppression)
  public setKaraokeMode(enabled: boolean) {
    this.isKaraokeMode = enabled;
    if (this.vocalFilter && this.ctx) {
      // Attenuate vocal frequency spectrum (around 1kHz - 3kHz) significantly
      const targetGain = enabled ? -22 : 0;
      this.vocalFilter.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public getKaraokeMode(): boolean {
    return this.isKaraokeMode;
  }

  // Adjust Equalizer Bands
  public setEqualizer(bands: Partial<EqualizerBands>) {
    this.equalizer = { ...this.equalizer, ...bands };
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.bassFilter && bands.bass !== undefined) {
      this.bassFilter.gain.setTargetAtTime(bands.bass, now, 0.05);
    }
    if (this.midFilter && bands.mid !== undefined) {
      this.midFilter.gain.setTargetAtTime(bands.mid, now, 0.05);
    }
    if (this.trebleFilter && bands.treble !== undefined) {
      this.trebleFilter.gain.setTargetAtTime(bands.treble, now, 0.05);
    }
    if (this.stereoPanner && bands.spatialWidth !== undefined) {
      // Spatial panning spread
      this.stereoPanner.pan.setTargetAtTime((bands.spatialWidth - 0.5) * 0.4, now, 0.05);
    }
  }

  public getEqualizer(): EqualizerBands {
    return { ...this.equalizer };
  }

  // Provide raw frequency & waveform data to Visualizer
  public getVisualizerData(): { frequency: Uint8Array; waveform: Uint8Array } {
    if (!this.analyser) {
      return {
        frequency: new Uint8Array(64),
        waveform: new Uint8Array(64).fill(128),
      };
    }
    const freq = new Uint8Array(this.analyser.frequencyBinCount);
    const wave = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteFrequencyData(freq);
    this.analyser.getByteTimeDomainData(wave);
    return { frequency: freq, waveform: wave };
  }

  public stopCurrent() {
    this.pause();
    this.stopTimeTicker();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  private onSongEnded() {
    this.stopCurrent();
    this.onEndedListeners.forEach((cb) => cb());
  }

  public subscribeTimeUpdate(cb: AudioTimeUpdateCallback): () => void {
    this.onTimeUpdateListeners.add(cb);
    return () => this.onTimeUpdateListeners.delete(cb);
  }

  public subscribeEnded(cb: AudioEndedCallback): () => void {
    this.onEndedListeners.add(cb);
    return () => this.onEndedListeners.delete(cb);
  }

  public getCurrentSong(): Song | null {
    return this.currentSong;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new AudioEngine();
