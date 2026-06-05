/**
 * Tiny zero-asset audio kit. Synthesises all SFX with the WebAudio API (no
 * files to ship) and plays a gentle looping music bed. Everything is wrapped
 * defensively so it can never crash gameplay, and it self-unlocks on the first
 * user gesture (browsers suspend audio until then).
 *
 * Usage:  import { audio } from '../config/audio';  audio.sfx('jump');
 */

type Wave = OscillatorType;

class AudioKit {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private unlocked = false;

  muted = false;
  musicOn = true;

  /** Lazily create the context + mixer graph. */
  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor() as AudioContext;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.master);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.14;
      this.musicGain.connect(this.master);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  /** Call once; wires window gestures to resume the suspended context. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const resume = () => {
      const ctx = this.ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    };
    ['pointerdown', 'touchstart', 'keydown'].forEach((ev) =>
      window.addEventListener(ev, resume, { passive: true })
    );
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  // -------------------------------------------------------------------
  // Low-level tone helper
  // -------------------------------------------------------------------
  private tone(opts: {
    freq: number;
    dur: number;
    type?: Wave;
    vol?: number;
    slideTo?: number;
    delay?: number;
    attack?: number;
  }) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || this.muted) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'square';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + opts.dur);
    const vol = opts.vol ?? 0.4;
    const atk = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + opts.dur + 0.02);
  }

  private noise(dur: number, vol = 0.3, hp = 600) {
    const ctx = this.ensure();
    if (!ctx || !this.sfxGain || this.muted) return;
    const t0 = ctx.currentTime;
    const frames = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);
    src.start(t0);
  }

  // -------------------------------------------------------------------
  // Named SFX
  // -------------------------------------------------------------------
  sfx(name: string) {
    switch (name) {
      case 'jump':
        this.tone({ freq: 320, slideTo: 620, dur: 0.16, type: 'square', vol: 0.32 });
        break;
      case 'land':
        this.tone({ freq: 200, slideTo: 90, dur: 0.1, type: 'triangle', vol: 0.28 });
        this.noise(0.06, 0.12, 400);
        break;
      case 'cork':
        this.tone({ freq: 700, slideTo: 1100, dur: 0.08, type: 'square', vol: 0.22 });
        this.noise(0.05, 0.1, 1200);
        break;
      case 'stomp':
        this.tone({ freq: 520, slideTo: 160, dur: 0.18, type: 'square', vol: 0.34 });
        this.noise(0.08, 0.18, 500);
        break;
      case 'pop': // enemy defeated
        this.tone({ freq: 440, slideTo: 880, dur: 0.12, type: 'triangle', vol: 0.3 });
        this.noise(0.07, 0.14, 900);
        break;
      case 'hurt':
        this.tone({ freq: 300, slideTo: 120, dur: 0.3, type: 'sawtooth', vol: 0.34 });
        break;
      case 'coin': // cork pickup
        this.tone({ freq: 880, dur: 0.06, type: 'square', vol: 0.18 });
        this.tone({ freq: 1320, dur: 0.09, type: 'square', vol: 0.16, delay: 0.05 });
        break;
      case 'bottle':
        this.tone({ freq: 660, dur: 0.1, type: 'triangle', vol: 0.28 });
        this.tone({ freq: 990, dur: 0.12, type: 'triangle', vol: 0.24, delay: 0.09 });
        this.tone({ freq: 1320, dur: 0.16, type: 'triangle', vol: 0.22, delay: 0.18 });
        break;
      case 'powerup':
        this.tone({ freq: 440, slideTo: 1200, dur: 0.4, type: 'square', vol: 0.26 });
        break;
      case 'life':
        this.tone({ freq: 523, dur: 0.1, type: 'square', vol: 0.26 });
        this.tone({ freq: 784, dur: 0.1, type: 'square', vol: 0.26, delay: 0.1 });
        this.tone({ freq: 1047, dur: 0.2, type: 'square', vol: 0.26, delay: 0.2 });
        break;
      case 'bosshit':
        this.tone({ freq: 240, slideTo: 80, dur: 0.14, type: 'sawtooth', vol: 0.3 });
        this.noise(0.06, 0.14, 300);
        break;
      case 'bossdie':
        this.tone({ freq: 400, slideTo: 40, dur: 1.2, type: 'sawtooth', vol: 0.4 });
        this.noise(0.6, 0.25, 200);
        break;
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone({ freq: f, dur: 0.18, type: 'square', vol: 0.28, delay: i * 0.12 })
        );
        break;
      case 'lose':
        [392, 330, 262].forEach((f, i) =>
          this.tone({ freq: f, dur: 0.3, type: 'sawtooth', vol: 0.3, delay: i * 0.18 })
        );
        break;
      case 'dash':
        this.tone({ freq: 180, slideTo: 520, dur: 0.16, type: 'sawtooth', vol: 0.2 });
        this.noise(0.1, 0.12, 800);
        break;
      case 'shield':
        this.tone({ freq: 300, slideTo: 700, dur: 0.18, type: 'triangle', vol: 0.26 });
        break;
      case 'ui':
        this.tone({ freq: 660, dur: 0.05, type: 'square', vol: 0.2 });
        break;
      default:
        break;
    }
  }

  // -------------------------------------------------------------------
  // Music: a slow, low-volume two-bar wine-cellar groove (bass + arp)
  // -------------------------------------------------------------------
  startMusic(mood: 'level' | 'menu' | 'boss' = 'level') {
    if (!this.musicOn) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.stopMusic();
    // minor-key step sequence (Hz) — moody but not grating
    const bass = mood === 'boss'
      ? [73.42, 73.42, 87.31, 65.41]   // D2 D2 F2 C2
      : [98.0, 98.0, 110.0, 87.31];    // G2 G2 A2 F2
    const arp = mood === 'boss'
      ? [293.66, 349.23, 440.0, 349.23]
      : [392.0, 466.16, 587.33, 466.16];
    const stepMs = mood === 'boss' ? 260 : 340;
    this.musicStep = 0;
    const play = () => {
      if (!this.musicGain || this.muted || !this.musicOn) return;
      const ctx2 = this.ctx!;
      const s = this.musicStep % 4;
      // bass
      this.musicNote(bass[s], stepMs / 1000 * 0.9, 'triangle', 0.5);
      // arp every step, lighter
      if (this.musicStep % 1 === 0) this.musicNote(arp[s], stepMs / 1000 * 0.5, 'square', 0.18);
      this.musicStep++;
      void ctx2;
    };
    play();
    this.musicTimer = setInterval(play, stepMs);
  }

  private musicNote(freq: number, dur: number, type: Wave, vol: number) {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const audio = new AudioKit();
