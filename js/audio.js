// 효과음: 외부 파일 없이 WebAudio로 합성. 모바일은 첫 터치에서 unlock() 필요.
// 큰 사건의 효과음에는 진동이 함께 난다(haptics.js, 소리를 꺼도·소리가 아직 안 풀렸어도 진동은 항상).
import { haptic, SFX_HAPTIC } from './haptics.js';
import { Music } from './music.js';

// 신관 수위 휘파람 가락 — 하나뿐이면 1.5초마다 같은 소리라 '다가온다'는 긴장이 죽는다
const WHISTLE = [[1, 1.122, 0.891], [1, 0.891, 0.841, 1], [1, 1.26, 1.122], [0.841, 1, 1.122, 1]];

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
    this.music = new Music(this); // master 아래 버스 하나 — toggle·suspend·resume 이 음악에도 그대로 걸린다
  }

  // 앱 전환·가로 화면 동안 소리 멈춤
  suspend() { this.music?.onSuspend(); this.ctx?.suspend?.(); }
  resume() { if (this.ctx && !this.muted) { this.ctx.resume?.(); this.music?.onResume(); } }

  toggle() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.now, 0.02);
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
    this.foot = !this.foot; // 좌/우 발을 번갈아 조금씩 다르게
    const r = 0.85 + Math.random() * 0.3;
    this.noise(0.06, { vol: (running ? 0.22 : 0.09) * r, freq: (running ? 900 : 700) * (this.foot ? r : 1 / r), q: 1.2 * r });
  }

  // 피아노 건반(도~높은 도)
  note(i) {
    const f = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25][i];
    this.tone(f, 1.1, { type: 'triangle', vol: 0.13 });
    this.tone(f * 2, 0.6, { vol: 0.03 });
  }

  // open=false 면 닫는 소리 — 쓸리는 방향을 뒤집고 끝에 걸쇠 '딸깍'을 붙인다
  door(open = true) {
    this.noise(0.45, { vol: 0.16, freq: open ? 500 : 1400, q: 0.6, sweep: open ? 900 : -900 });
    if (!open) this.noise(0.04, { vol: 0.22, freq: 2600, q: 1.5, at: 0.4 });
  }
  pickup() { this.tone(880, 0.12, { vol: 0.12 }); this.tone(1320, 0.18, { vol: 0.1, at: 0.08 }); }

  play(name) {
    haptic(SFX_HAPTIC[name]);
    if (!this.ctx) return;
    switch (name) {
      case 'unlock': this.noise(0.05, { vol: 0.2, freq: 3000 }); this.noise(0.08, { vol: 0.2, freq: 2000, at: 0.1 }); this.tone(880, 0.1, { vol: 0.08, at: 0.16, slide: 440 }); break; // 끝의 상승음이 '열렸다'를 알린다
      case 'locked': this.noise(0.07, { vol: 0.18, freq: 400 }); this.noise(0.07, { vol: 0.18, freq: 380, at: 0.12 }); break;
      case 'hit': this.noise(0.25, { vol: 0.5, freq: 200, q: 0.5, type: 'lowpass' }); this.tone(90, 0.3, { type: 'square', vol: 0.15 }); this.noise(0.06, { vol: 0.35, freq: 2600, q: 0.8, type: 'highpass' }); break; // 고역 어택으로 lever 와 구분
      case 'whistle': this.tone(2200, 0.1, { type: 'triangle', vol: 0.1, attack: 0.015, slide: 220 }); this.tone(2400, 0.3, { type: 'triangle', vol: 0.14, at: 0.08, attack: 0.01 }); this.tone(2400, 0.5, { type: 'triangle', vol: 0.14, at: 0.42, attack: 0.02 }); break; // 시작 벤드가 있어야 사람이 부는 소리로 들린다
      case 'stinger':
        for (const f of [146, 155, 233, 311]) this.tone(f, 2.2, { type: 'sawtooth', vol: 0.05, attack: 0.02 });
        this.noise(1.5, { vol: 0.2, freq: 3000, sweep: -2600 });
        break;
      case 'siren': // 1장 경보 중 2.6초마다 반복된다 — 사각파 그대로면 거의 끊김 없는 지속음이라 가장 먼저 귀가 아프다
        for (let i = 0; i < 4; i++) this.tone(700, 0.5, { type: 'triangle', vol: 0.045, at: i * 0.6, slide: 400 });
        break;
      case 'bell': // 종은 비정수배 부분음(1 : 2.76 : 5.4)과 긴 감쇠다. 사각파 연타는 종이 아니라 버저다
        for (let i = 0; i < 3; i++) for (const [k, v] of [[1, 0.07], [2.76, 0.035], [5.4, 0.018]])
          this.tone(660 * k, 1.6 - i * 0.3, { type: 'triangle', vol: v, at: i * 0.55, attack: 0.004 });
        break;
      case 'headbell': // 머리귀신 예고 — 가장 중요한 경고음이라 타격 트랜지언트와 비정수 배음을 넣는다
        for (let i = 0; i < 4; i++) {
          this.noise(0.05, { vol: 0.18, freq: 4000, q: 0.6, at: i * 0.6 });
          for (const [k, v] of [[1, 0.12], [2.76, 0.05], [5.4, 0.022]]) this.tone(330 * k, 1.5, { type: 'triangle', vol: v, at: i * 0.6, attack: 0.004 });
        }
        break;
      case 'rumble': this.noise(2.5, { vol: 0.35, freq: 90, type: 'lowpass', q: 0.4 }); break;
      case 'thunder': this.noise(0.3, { vol: 0.28, freq: 900, type: 'lowpass' }); this.noise(3.2, { vol: 0.4, freq: 70, type: 'lowpass', q: 0.3, at: 0.1 }); break;
      case 'squeak': this.tone(4200, 0.035, { type: 'sawtooth', vol: 0.05, slide: 2600 }); this.tone(5200, 0.03, { type: 'sawtooth', vol: 0.04, at: 0.055, slide: 2200 }); break; // 위로 꺾이는 '찍' — 수위 열쇠 소리와 헷갈리면 안 된다
      case 'drip': this.tone(1300, 0.06, { vol: 0.025, slide: 700 }); break;
      case 'thud': this.noise(0.3, { vol: 0.45, freq: 120, type: 'lowpass' }); break;
      case 'creak': this.tone(180, 0.9, { type: 'sawtooth', vol: 0.05, slide: -80, attack: 0.2 }); break;
      case 'cry':
        for (let i = 0; i < 3; i++) this.tone(520 - i * 30, 0.7, { type: 'sine', vol: 0.05, at: i * 0.8, slide: -120, attack: 0.15 });
        break;
      case 'spray': this.noise(0.35, { vol: 0.25, freq: 5000, q: 0.3, type: 'highpass' }); break;
      case 'burst': this.noise(0.8, { vol: 0.5, freq: 300, type: 'lowpass', q: 0.3, sweep: -200 }); break;
      case 'valve': this.tone(110, 0.4, { type: 'square', vol: 0.06 }); this.noise(0.6, { vol: 0.12, freq: 2500, sweep: -2000 }); break;
      case 'switch': this.noise(0.025, { vol: 0.3, freq: 2500 }); this.noise(0.02, { vol: 0.16, freq: 1800, at: 0.045 }); break; // 누름/튕김 2단 클릭 — unlock 과 구분
      case 'coin': this.tone(1800, 0.08, { vol: 0.1 }); this.tone(2400, 0.2, { vol: 0.08, at: 0.06 }); break;
      case 'drink': this.noise(0.4, { vol: 0.12, freq: 1500, q: 2 }); break;
      case 'phone':
        for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) this.tone(i % 2 ? 480 : 440, 0.05, { type: 'square', vol: 0.05, at: r * 1.6 + i * 0.05 });
        break;
      case 'chalk':
        for (let i = 0; i < 6; i++) this.noise(0.12, { vol: 0.12, freq: 3500 + i * 150, q: 6, at: i * 0.18 });
        break;
      case 'piano': // 피 묻은 건반: 낮은 불협화음을 마구 두드린다
        for (let i = 0; i < 9; i++) for (const f of [110, 116.5, 164.8]) this.tone(f * (1 + (i % 3) * 0.5), 0.5, { type: 'triangle', vol: 0.05, at: i * 0.16 });
        break;
      case 'baby':
        for (let i = 0; i < 3; i++) this.tone(620 + i * 25, 0.55, { type: 'sawtooth', vol: 0.035, at: i * 0.7, slide: -220, attack: 0.06 });
        break;
      case 'tape': // 거꾸로 돌린 테이프: 늘어지는 음 + 지직거림
        for (let i = 0; i < 4; i++) this.tone(300 - i * 40, 0.4, { type: 'sine', vol: 0.06, at: i * 0.35, slide: 160, attack: 0.3 });
        this.noise(1.5, { vol: 0.04, freq: 4000, q: 0.5, type: 'highpass' });
        break;
      case 'kiln': this.noise(1.6, { vol: 0.25, freq: 240, type: 'lowpass', q: 0.5, sweep: 300 }); break;
      case 'water': this.noise(1.4, { vol: 0.14, freq: 1800, q: 0.7 }); break;
      case 'drag': this.noise(0.35, { vol: 0.22, freq: 420, q: 1.5, sweep: -150 }); break;
      case 'glass': // 유리 깨짐
        this.noise(0.08, { vol: 0.5, freq: 6000, q: 0.4, type: 'highpass' });
        for (let i = 0; i < 9; i++) this.tone(2600 + Math.random() * 3200, 0.07, { type: 'triangle', vol: 0.06, at: 0.05 + i * 0.045 + Math.random() * 0.03 });
        break;
      case 'mirror': this.noise(0.25, { vol: 0.35, freq: 2800, q: 2 }); this.tone(1900, 0.5, { type: 'triangle', vol: 0.05, slide: -900 }); break;
      case 'orb': this.tone(300, 0.26, { type: 'sine', vol: 0.1, slide: -170, attack: 0.01 }); this.tone(600, 0.14, { type: 'triangle', vol: 0.045, slide: -340 }); this.noise(0.22, { vol: 0.05, freq: 900, q: 0.9, sweep: -500 }); break; // 거울 도플갱어의 탄 — 회피 단서로 쓰려면 들려야 한다
      case 'scream': // 은미의 비명
        for (let i = 0; i < 3; i++) this.tone(880 + i * 37, 1.8, { type: 'sawtooth', vol: 0.06, slide: 420, attack: 0.05 });
        this.noise(1.8, { vol: 0.18, freq: 2400, q: 1.2, sweep: 900 });
        break;
      case 'laugh': // 광소
        for (let i = 0; i < 7; i++) this.tone(420 + (i % 2) * 70, 0.12, { type: 'triangle', vol: 0.06, at: i * 0.16, slide: -60 });
        break;
      case 'splash': this.noise(0.6, { vol: 0.25, freq: 1400, q: 0.6, sweep: -900 }); break;
      case 'drain': this.noise(3, { vol: 0.2, freq: 300, type: 'lowpass', q: 0.8, sweep: -200 }); for (let i = 0; i < 6; i++) this.tone(200 + Math.random() * 120, 0.15, { vol: 0.04, at: 0.4 + i * 0.4 }); break;
      case 'lever': this.noise(0.22, { vol: 0.18, freq: 900, q: 4, sweep: -500 }); this.noise(0.18, { vol: 0.4, freq: 180, type: 'lowpass', at: 0.14 }); this.tone(90, 0.3, { type: 'square', vol: 0.05, at: 0.18 }); break; // 중역 '끼익'을 앞에 둬 피격음(hit)과 분리
      case 'fuse': this.noise(0.12, { vol: 0.3, freq: 4000, q: 3 }); this.tone(120, 0.6, { type: 'sawtooth', vol: 0.03, at: 0.1 }); break;
      case 'card': this.tone(1500, 0.07, { type: 'square', vol: 0.05 }); this.tone(2000, 0.12, { type: 'square', vol: 0.05, at: 0.09 }); break;
      case 'keys':
        for (let i = 0; i < 8; i++) this.tone(3000 + Math.random() * 2000, 0.06, { vol: 0.05, at: i * 0.07, type: 'triangle' });
        break;
      default: console.warn('알 수 없는 효과음', name); // 데이터에서 문자열로 넘기는 구조라 오타가 조용한 무음이 된다
    }
  }

  // 경비원 열쇠 꾸러미 소리: 가까울수록 크고 잦다
  keys(actor, d) {
    if (!this.ctx || actor.skin !== 'janitor' || !actor.moving || d > 9) return;
    const t = performance.now();
    if (t - (actor._keyT || 0) < 260 + d * 40) return;
    actor._keyT = t;
    const v = 0.07 * (1 - d / 9);
    // 금속 꾸러미답게 음을 겹쳐 쌓고 짧은 고역 '찰랑'을 섞는다 — 쥐 울음(squeak)과 떼어 놓는다
    for (let i = 0; i < 3; i++) {
      this.tone(2600 + Math.random() * 900, 0.09, { vol: v, at: i * 0.035, type: 'triangle' });
      this.tone(3900 + Math.random() * 1400, 0.06, { vol: v * 0.6, at: i * 0.035, type: 'triangle' });
    }
    this.noise(0.12, { vol: v * 0.8, freq: 6500, q: 0.5, type: 'highpass' });
  }

  // 신관 수위 휘파람: 순찰 중에만 짧은 가락, 가까울수록 크다. 멈추면(수상한 소리 확인·추격) 다가오는 신호
  whistleTune(actor, d) {
    if (!this.ctx || !['patrol', 'pause'].includes(actor.state) || d > 13) return;
    const t = performance.now();
    if (t - (actor._whT || 0) < 1500) return;
    actor._whT = t;
    if (Math.random() < 0.22) return; // 가끔 한 번 쉰다 — 박자가 읽히면 다가오는 긴장이 죽는다
    const v = 0.06 * (1 - d / 13), base = [784, 880, 659, 784][Math.floor(t / 1500) % 4];
    WHISTLE[Math.floor(Math.random() * WHISTLE.length)]
      .forEach((k, i) => this.tone(base * k, 0.22, { type: 'sine', vol: v, at: i * 0.24, attack: 0.03 }));
  }

  // live = false(메뉴·지도·대사가 열려 있음)면 소리만 — 진동은 멈춘다(그동안 수위·제한시간도 멈춰 있다)
  heartbeat(danger, live = true) {
    if (danger < 0.15) return;
    const t = performance.now();
    const gap = 1100 - danger * 650;
    if (t - this.beatT < gap) return;
    this.beatT = t;
    if (danger > 0.55 && live) haptic('beat'); // 위험이 클 때(추격 중 등)만 심장 박동 진동 — 소리(오디오)가 없어도
    if (!this.ctx) return;
    const v = 0.12 + danger * 0.25;
    // 55Hz 순음은 휴대폰 스피커 저역 롤오프에 거의 다 깎인다 — 작은 스피커가 실제로 내보내는 대역에
    // 배음(165Hz)과 짧은 '툭'(320Hz)을 얹어, 이어폰에서는 저음으로 폰에서는 두드림으로 들리게 한다
    this.tone(55, 0.16, { vol: v });
    this.tone(165, 0.1, { vol: v * 0.5, slide: -60 });
    this.noise(0.06, { vol: v * 0.4, freq: 320, q: 1.1 });
    this.tone(50, 0.18, { vol: v * 0.8, at: 0.18 });
    this.tone(150, 0.11, { vol: v * 0.35, at: 0.18, slide: -54 });
    this.noise(0.06, { vol: v * 0.28, freq: 300, q: 1.1, at: 0.18 });
  }

  // 환경음은 음악의 공기층이 맡는다(music.js SCENES 프리셋). 호출부(game.js enterMap)는 그대로다
  ambience(name) { this.music?.ambience(name); }
}
