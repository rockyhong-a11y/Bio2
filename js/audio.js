// 효과음: 외부 파일 없이 WebAudio로 합성. 모바일은 첫 터치에서 unlock() 필요.

export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.stepT = 0;
    this.beatT = 0;
    this.keyT = 0;
  }

  unlock() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  // 앱 전환·가로 화면 동안 소리 멈춤
  suspend() { this.ctx?.suspend?.(); }
  resume() { if (this.ctx && !this.muted) this.ctx.resume?.(); }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.8;
  }

  get now() { return this.ctx.currentTime; }

  tone(freq, dur, { type = 'sine', vol = 0.2, at = 0, slide = 0, attack = 0.005 } = {}) {
    if (!this.ctx) return;
    const t = this.now + at;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise(dur, { vol = 0.2, at = 0, freq = 1200, q = 0.8, type = 'bandpass', sweep = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.now + at;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + sweep), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  footstep(actor, running) {
    if (!this.ctx) return;
    const t = performance.now();
    if (t - this.stepT < (running ? 230 : 380)) return;
    this.stepT = t;
    this.noise(0.06, { vol: running ? 0.22 : 0.09, freq: running ? 900 : 700, q: 1.2 });
  }

  door() { this.noise(0.45, { vol: 0.16, freq: 500, q: 0.6, sweep: 900 }); }
  pickup() { this.tone(880, 0.12, { vol: 0.12 }); this.tone(1320, 0.18, { vol: 0.1, at: 0.08 }); }

  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'unlock': this.noise(0.05, { vol: 0.2, freq: 3000 }); this.noise(0.08, { vol: 0.2, freq: 2000, at: 0.1 }); break;
      case 'locked': this.noise(0.07, { vol: 0.18, freq: 400 }); this.noise(0.07, { vol: 0.18, freq: 380, at: 0.12 }); break;
      case 'hit': this.noise(0.25, { vol: 0.5, freq: 200, q: 0.5, type: 'lowpass' }); this.tone(90, 0.3, { type: 'square', vol: 0.15 }); break;
      case 'whistle': this.tone(2400, 0.35, { type: 'triangle', vol: 0.14, attack: 0.02 }); this.tone(2400, 0.5, { type: 'triangle', vol: 0.14, at: 0.42, attack: 0.02 }); break;
      case 'stinger':
        for (const f of [146, 155, 233, 311]) this.tone(f, 2.2, { type: 'sawtooth', vol: 0.05, attack: 0.02 });
        this.noise(1.5, { vol: 0.2, freq: 3000, sweep: -2600 });
        break;
      case 'siren':
        for (let i = 0; i < 4; i++) this.tone(700, 0.5, { type: 'square', vol: 0.06, at: i * 0.6, slide: 400 });
        break;
      case 'bell':
        for (let i = 0; i < 10; i++) this.tone(1900 + (i % 2) * 60, 0.09, { type: 'square', vol: 0.06, at: i * 0.1 });
        break;
      case 'headbell':
        for (let i = 0; i < 4; i++) { this.tone(330, 0.55, { vol: 0.12, at: i * 0.6, attack: 0.01 }); this.tone(165, 0.6, { vol: 0.06, at: i * 0.6, attack: 0.01 }); }
        break;
      case 'rumble': this.noise(2.5, { vol: 0.35, freq: 90, type: 'lowpass', q: 0.4 }); break;
      case 'thud': this.noise(0.3, { vol: 0.45, freq: 120, type: 'lowpass' }); break;
      case 'creak': this.tone(180, 0.9, { type: 'sawtooth', vol: 0.05, slide: -80, attack: 0.2 }); break;
      case 'cry':
        for (let i = 0; i < 3; i++) this.tone(520 - i * 30, 0.7, { type: 'sine', vol: 0.05, at: i * 0.8, slide: -120, attack: 0.15 });
        break;
      case 'spray': this.noise(0.35, { vol: 0.25, freq: 5000, q: 0.3, type: 'highpass' }); break;
      case 'burst': this.noise(0.8, { vol: 0.5, freq: 300, type: 'lowpass', q: 0.3, sweep: -200 }); break;
      case 'valve': this.tone(110, 0.4, { type: 'square', vol: 0.06 }); this.noise(0.6, { vol: 0.12, freq: 2500, sweep: -2000 }); break;
      case 'switch': this.noise(0.03, { vol: 0.3, freq: 2500 }); break;
      case 'coin': this.tone(1800, 0.08, { vol: 0.1 }); this.tone(2400, 0.2, { vol: 0.08, at: 0.06 }); break;
      case 'drink': this.noise(0.4, { vol: 0.12, freq: 1500, q: 2 }); break;
      case 'phone':
        for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) this.tone(i % 2 ? 480 : 440, 0.05, { type: 'square', vol: 0.05, at: r * 1.6 + i * 0.05 });
        break;
      case 'chalk':
        for (let i = 0; i < 6; i++) this.noise(0.12, { vol: 0.12, freq: 3500 + i * 150, q: 6, at: i * 0.18 });
        break;
      case 'keys':
        for (let i = 0; i < 8; i++) this.tone(3000 + Math.random() * 2000, 0.06, { vol: 0.05, at: i * 0.07, type: 'triangle' });
        break;
    }
  }

  // 경비원 열쇠 꾸러미 소리: 가까울수록 크고 잦다
  keys(actor, d) {
    if (!this.ctx || actor.skin !== 'janitor' || !actor.moving || d > 9) return;
    const t = performance.now();
    if (t - (actor._keyT || 0) < 260 + d * 40) return;
    actor._keyT = t;
    const v = 0.07 * (1 - d / 9);
    for (let i = 0; i < 3; i++) this.tone(3200 + Math.random() * 1800, 0.06, { vol: v, at: i * 0.03, type: 'triangle' });
  }

  heartbeat(danger) {
    if (!this.ctx || danger < 0.15) return;
    const t = performance.now();
    const gap = 1100 - danger * 650;
    if (t - this.beatT < gap) return;
    this.beatT = t;
    const v = 0.12 + danger * 0.25;
    this.tone(55, 0.16, { vol: v });
    this.tone(50, 0.18, { vol: v * 0.8, at: 0.18 });
  }

  ambience(name) {
    if (!this.ctx || this.amb === name) return;
    this.amb = name;
    this.ambNode?.stop();
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = name === 'vent' ? 260 : 140;
    const g = this.ctx.createGain(); g.gain.value = name === 'vent' ? 0.12 : 0.06;
    s.connect(f).connect(g).connect(this.master);
    s.start();
    this.ambNode = s;
  }
}
