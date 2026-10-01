// Web Audio API & HTML5 Audio Alert Engine for Real-Time Store POS Order Alerts
// Uses the provided "Beeping Sound Effect.mp3" for incoming and updated order alerts

const BEEP_MP3_PATH = '/Beeping%20Sound%20Effect.mp3';
const BEEP_MP3_ALT_PATH = '/beeping-sound-effect.mp3';
const BEEP_MP3_SOUNDS_PATH = '/sounds/Beeping%20Sound%20Effect.mp3';
const BEEP_MP3_SOUNDS_ALT_PATH = '/sounds/beeping-sound-effect.mp3';

class SoundFX {
  private ctx: AudioContext | null = null;
  private continuousAlertTimer: any = null;
  private isContinuousAlerting: boolean = false;
  private isAutoplayBlocked: boolean = false;
  private alertAudio: HTMLAudioElement | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private activeBufferSource: AudioBufferSourceNode | null = null;
  private isBufferLoading: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
      // Pre-load Beeping Sound Effect.mp3 right away
      setTimeout(() => {
        this.getAlertAudio();
        this.loadAudioBuffer();
      }, 300);
    }
  }

  // Pre-load and initialize HTML5 Audio Element for "Beeping Sound Effect.mp3"
  private getAlertAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.alertAudio) {
      try {
        const audio = new Audio();
        audio.src = BEEP_MP3_PATH;
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 1.0;

        // Loop failsafe for older browsers
        audio.addEventListener('ended', () => {
          if (this.isContinuousAlerting) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        });

        // Fallback chain across alternative public paths
        const fallbackSources = [BEEP_MP3_ALT_PATH, BEEP_MP3_SOUNDS_PATH, BEEP_MP3_SOUNDS_ALT_PATH];
        let nextFallback = 0;
        audio.addEventListener('error', () => {
          if (nextFallback >= fallbackSources.length) return;
          console.warn('Audio source fallback for Beeping Sound Effect.mp3');
          audio.src = fallbackSources[nextFallback++];
          audio.load();
        });

        this.alertAudio = audio;
      } catch (err) {
        console.warn('Could not initialize Beeping Sound Effect audio element:', err);
        this.alertAudio = null;
      }
    }
    return this.alertAudio;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Pre-load and decode "Beeping Sound Effect.mp3" into Web Audio buffer
  private loadAudioBuffer() {
    if (typeof window === 'undefined' || this.audioBuffer || this.isBufferLoading) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isBufferLoading = true;

    const fetchMp3 = (url: string): Promise<ArrayBuffer> => {
      return fetch(url).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      });
    };

    fetchMp3(BEEP_MP3_PATH)
      .catch(() => fetchMp3(BEEP_MP3_ALT_PATH))
      .catch(() => fetchMp3(BEEP_MP3_SOUNDS_PATH))
      .then((arrayBuffer) => ctx.decodeAudioData(arrayBuffer))
      .then((decodedBuffer) => {
        this.audioBuffer = decodedBuffer;
        this.isBufferLoading = false;
        // If alert is already active and HTML5 audio didn't start, start buffer playback now
        if (this.isContinuousAlerting && (!this.alertAudio || this.alertAudio.paused)) {
          this.startWebAudioBufferPlayback();
        }
      })
      .catch((err) => {
        console.warn('Could not load or decode Beeping Sound Effect.mp3 buffer:', err);
        this.isBufferLoading = false;
      });
  }

  // Unlock audio contexts and media playback on user interaction
  init() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      const wasUnlocked = this.isUnlocked;
      this.isUnlocked = true;

      const ctx = this.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const audio = this.getAlertAudio();
      // load() resets a playing element, so only prime it on the first interaction
      if (audio && !wasUnlocked && audio.paused) {
        audio.load();
      }

      if (this.isContinuousAlerting) {
        // Only (re)start if the mp3 isn't already playing, so taps don't restart the beep
        if (!audio || audio.paused) {
          this.isAutoplayBlocked = false;
          this.startContinuousNewOrderAlert(false);
        }
      } else {
        this.isAutoplayBlocked = false;
        this.loadAudioBuffer();
      }
    };

    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  // Web Audio buffer playback for "Beeping Sound Effect.mp3"
  private startWebAudioBufferPlayback() {
    if (!this.isContinuousAlerting) return;
    const ctx = this.getContext();
    if (!ctx || !this.audioBuffer) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (this.activeBufferSource) {
        try {
          this.activeBufferSource.stop();
          this.activeBufferSource.disconnect();
        } catch {}
        this.activeBufferSource = null;
      }

      const source = ctx.createBufferSource();
      source.buffer = this.audioBuffer;
      source.loop = true;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      this.activeBufferSource = source;
    } catch (err) {
      console.warn('Web Audio buffer start error:', err);
      this.startSynthesizerFallbackLoop();
    }
  }

  // Synthesizer failsafe tone (1046.5 Hz C6 beep) matching the sound effect pitch
  private playToneBeep() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.setValueAtTime(0.7, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  private startSynthesizerFallbackLoop() {
    if (!this.isContinuousAlerting) return;
    this.playToneBeep();

    if (this.continuousAlertTimer) {
      clearInterval(this.continuousAlertTimer);
    }
    this.continuousAlertTimer = setInterval(() => {
      if (!this.isContinuousAlerting) {
        if (this.continuousAlertTimer) clearInterval(this.continuousAlertTimer);
        return;
      }
      this.playToneBeep();
    }, 750);
  }

  // Continuous repeating alert using provided "Beeping Sound Effect.mp3"
  // Plays until order is accepted by Store POS
  startContinuousNewOrderAlert(forceRestart: boolean = false) {
    this.isContinuousAlerting = true;

    // 1. Resume AudioContext
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 2. Play HTML5 Audio element for "Beeping Sound Effect.mp3"
    const audio = this.getAlertAudio();
    if (audio) {
      try {
        if (forceRestart || audio.paused || audio.currentTime === 0) {
          audio.currentTime = 0;
        }
        audio.loop = true;
        audio.volume = 1.0;

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.isAutoplayBlocked = false;
              // Successfully playing HTML5 audio, stop any secondary buffer source
              if (this.activeBufferSource) {
                try {
                  this.activeBufferSource.stop();
                  this.activeBufferSource.disconnect();
                } catch {}
                this.activeBufferSource = null;
              }
              if (this.continuousAlertTimer) {
                clearInterval(this.continuousAlertTimer);
                this.continuousAlertTimer = null;
              }
            })
            .catch((err) => {
              // Alert was stopped (pause() aborts the pending play) - don't start a fallback loop
              if (!this.isContinuousAlerting || err?.name === 'AbortError') return;
              console.warn('HTML5 audio play blocked by browser policy, using Web Audio buffer:', err);
              this.isAutoplayBlocked = true;

              // Fallback to Web Audio buffer playback
              if (this.audioBuffer) {
                this.startWebAudioBufferPlayback();
              } else {
                this.loadAudioBuffer();
                this.startSynthesizerFallbackLoop();
              }
            });
        }
      } catch (err) {
        console.warn('Audio play exception:', err);
        if (this.audioBuffer) {
          this.startWebAudioBufferPlayback();
        } else {
          this.startSynthesizerFallbackLoop();
        }
      }
    } else {
      // Audio element unavailable, use Web Audio
      if (this.audioBuffer) {
        this.startWebAudioBufferPlayback();
      } else {
        this.loadAudioBuffer();
        this.startSynthesizerFallbackLoop();
      }
    }
  }

  // Explicitly trigger the uploaded Beeping Sound Effect for a newly placed Staff order
  triggerStaffOrderBeep() {
    this.startContinuousNewOrderAlert(true);
  }

  // Immediately stop continuous beep when orders are accepted
  stopContinuousNewOrderAlert() {
    this.isContinuousAlerting = false;
    this.isAutoplayBlocked = false;

    // 1. Stop and reset HTML5 audio
    if (this.alertAudio) {
      try {
        this.alertAudio.pause();
        this.alertAudio.currentTime = 0;
      } catch {}
    }

    // 2. Stop Web Audio buffer source
    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.stop();
        this.activeBufferSource.disconnect();
      } catch {}
      this.activeBufferSource = null;
    }

    // 3. Clear synth interval
    if (this.continuousAlertTimer) {
      clearInterval(this.continuousAlertTimer);
      this.continuousAlertTimer = null;
    }
  }

  getIsContinuousAlerting(): boolean {
    return this.isContinuousAlerting;
  }

  getIsAutoplayBlocked(): boolean {
    return this.isAutoplayBlocked;
  }

  // Single beep for new notification (1 notification = 1 single gentle chime)
  playNotificationBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Quick success click / beep
  playSuccessBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // Ascending positive two-tone chime for order acceptance
  playSuccessChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.14); // A5
      gain2.gain.setValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.14);
      osc2.stop(now + 0.5);
    } catch {}
  }

  // Error buzz
  playError() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  orderReceived() {
    this.playNotificationBeep();
  }

  success() {
    this.playSuccessBeep();
  }

  error() {
    this.playError();
  }

  click() {
    this.playSuccessBeep();
  }

  tap() {
    this.playSuccessBeep();
  }

  chime() {
    this.playSuccessChime();
  }
}

export const soundFX = new SoundFX();
