// 배경음악: 외부 음원 없이 WebAudio로 합성한다(효과음과 같은 ctx·master 를 빌려 쓴다).
// 곡을 틀고 끄는 대신, 지속되는 층 셋(드론·공기·맥)과 오르골 단음 스케줄러 하나를 unlock() 때 한 번만 만들어 두고
// 장면이 바뀌면 프리셋에서 숫자 몇 개를 꺼내 게인과 드론 기음만 setTargetAtTime 으로 미끄러뜨린다.
//   · 노드를 stop·재생성하는 곳이 한 군데도 없다 → 교차 페이드·끊김 처리·맵 전환 재생성 코드가 통째로 없다.
//   · 장면·긴장도를 매 프레임 g 에서 다시 계산한다 → 체크포인트 복귀·불러오기에 음악 복원 코드가 0줄이다.
//   · 음계는 메나리토리(미·솔·라·도·레) 비율 고정표. 장면마다 선율을 쓰지 않고 root 하나만 바꾸면 드론과 같은 조성이 된다.
//     기존 곡을 인용하지 않는다 — 합성이라 음원도 악보도 없다.
// 버스 하나를 master 아래에 다는 구조라 소리 끄기(toggle)·앱 전환(suspend/resume)이 음악에도 그대로 적용된다.

// 프리셋. root = 드론 기음(Hz) / drone·air = 층 게인 / hz·q = 공기층 밴드패스 / gap = 오르골 간격(초, 0이면 단음 없음) / sm = 전환 시간(초)
// root 를 100~200Hz 대에 두는 이유: 휴대폰 스피커는 그 아래를 거의 못 내보낸다(심장 박동이 안 들리는 것과 같은 이유).
export const SCENES = {
  title:  { root: 110,    drone: 0.10, air: 0.05, hz: 420, q: 0.8, gap: 4.5, sm: 1.5 }, // 타이틀·챕터 선택·갤러리
  school: { root: 146.83, drone: 0.09, air: 0.07, hz: 180, q: 0.9, gap: 6,   sm: 1.2 }, // 본관 — 기본
  vent:   { root: 73.42,  drone: 0.08, air: 0.16, hz: 300, q: 1.1, gap: 0,   sm: 1.0 }, // 환기구 — 단음 없음이 연출
  annex:  { root: 130.81, drone: 0.09, air: 0.06, hz: 240, q: 1.0, gap: 7,   sm: 1.2 }, // 신관·강당 — 넓고 비었다
  rest:   { root: 174.61, drone: 0.07, air: 0.04, hz: 520, q: 0.7, gap: 3,   sm: 1.5 }, // 소파 휴식 — 공포가 걷히는 자리
  fire:   { root: 98,     drone: 0.15, air: 0.12, hz: 110, q: 0.6, gap: 0,   sm: 0.4 }, // 강당 화재
  maze:   { root: 196,    drone: 0.06, air: 0.09, hz: 90,  q: 0.7, gap: 3,   sm: 1.2 }, // 하얀 미궁 — 학교 소리가 아니다
  over:   { root: 110,    drone: 0.11, air: 0,    hz: 140, q: 0.8, gap: 0,   sm: 0.25 }, // 게임오버 — 환경음을 끊고 테일만
};
const TORI = [4, 4.757, 5.339, 6.349, 7.127]; // 메나리토리 5음을 root 의 비율로(2옥타브 위)
const PULSE = 0.44;   // 맥 층 최대 게인. 고Q 밴드패스는 통과 대역이 좁아 큰 값이 필요하다
const LOOK = 0.6, TICK = 200; // 단음 예약: 200ms마다 0.6초 앞까지만(메인 스레드 예약을 쌓지 않는다)
const STEP = 0.2;     // update 스로틀(초) — 매 프레임 AudioParam 예약 금지

// 장면: 먼저 맞는 것 하나. 오디오를 건드리지 않는 순수 함수라 가짜 g 로 그대로 검사할 수 있다
export function sceneOf(g) {
  if (!g.world) return 'title';
  if (g.over) return 'over';
  if (g.world.def.music) return g.world.def.music; // 맵이 직접 고르는 탈출구
  const f = g.flags || {};
  if (f.fireOn && !f.fireOut) return 'fire';
  if (g.mapId === 'maze') return 'maze';
  if (g.mapId === 'vent') return 'vent';
  if (f.resting) return 'rest';
  return /^(shingwan|auditorium)_/.test(g.mapId) ? 'annex' : 'school';
}

// 긴장도 0~1: 기존 g.danger(경계 0~0.6, 추격 1)를 받아 바닥값만 올린다
export function tensionOf(g) {
  if (!g.world || g.over) return 0;
  const f = g.flags || {};
  let t = g.danger || 0;
  if (g.timer) t = Math.max(t, g.timer.left < 60 ? 0.8 : g.timer.left < 150 ? 0.55 : 0.35);
  // 쫓아오지 않는 귀신(거울 도플갱어·옥상 인어·아기)은 danger 가 0이라 여기서 깔아 준다
  if ((f.mirrorRound > 0 && !f.mirrorDone) || (g.mapId === 'shingwan_roof' && !f.poolDrained)
    || (g.mapId === 'main2_4f' && !f.babyDone)) t = Math.max(t, 0.55);
  if (f.collapsed) t = Math.max(t, 0.8);
  return Math.min(1, t);
}

export class Music {
  // audio 의 ctx·master·noiseBuf 를 받아서 쓴다(직접 만들지 않는다) — OfflineAudioContext 를 든 가짜 audio 로도 그대로 생성된다
  constructor(audio) {
    const ctx = this.ctx = audio.ctx;
    this.a = audio;
    this.bus = ctx.createGain();
    this.bus.connect(audio.master);
    // 드론: 빈 5도(3도가 없어 장·단조가 정해지지 않는다) + 0.23% 디튠으로 6초쯤 되는 맥놀이
    this.k = [1, 1.0023, 1.5];
    this.osc = ['sawtooth', 'sawtooth', 'triangle'].map((type, i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = SCENES.title.root * this.k[i];
      return o;
    });
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 0.7;
    this.droneG = ctx.createGain(); this.droneG.gain.value = 0;
    for (const o of this.osc) { o.connect(lp); o.start(); }
    lp.connect(this.droneG).connect(this.bus);
    // 공기: 기존 ambience() 의 고정 노이즈를 대신한다. 밴드패스 중심이 40초 주기로 왕복한다
    this.airF = ctx.createBiquadFilter(); this.airF.type = 'bandpass';
    this.airG = ctx.createGain(); this.airG.gain.value = 0;
    this.loop(audio.noiseBuf).connect(this.airF).connect(this.airG).connect(this.bus);
    // 맥: 긴장도 전용. 활로 금속을 긋는 '웅—'. 중심이 root×6(440~1200Hz)이라
    //     휘파람(2400)·열쇠(3300+)·심장(55)과 대역이 겹치지 않는다
    this.pulF = ctx.createBiquadFilter(); this.pulF.type = 'bandpass'; this.pulF.Q.value = 24;
    this.pulG = ctx.createGain(); this.pulG.gain.value = 0;
    this.loop(audio.noiseBuf).connect(this.pulF).connect(this.pulG).connect(this.bus);
    // 오르골: 배음 1·3·6·9·13차. 파형 하나를 구워 모든 단음이 돌려 쓴다
    const re = new Float32Array(14), im = new Float32Array(14);
    for (const [h, v] of [[1, 1], [3, 0.42], [6, 0.2], [9, 0.11], [13, 0.06]]) im[h] = v;
    this.wave = ctx.createPeriodicWave(re, im);

    this.scene = 'title'; this.P = SCENES.title;
    this.ten = 0; this.duck = 1; this.acc = 0; this.next = 0; this.swept = -1;
    this.sweep();
    this.apply(0.02);
    this.onResume();
  }

  loop(buf) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf; s.loop = true; s.start();
    return s;
  }

  // 맵 def.ambience 가 들어오는 자리(game.js enterMap). 장면이 기본값일 때만 프리셋을 좁힌다 —
  // 음악 상태가 두 벌로 갈라지지 않게 판정은 언제나 sceneOf 가 먼저 한다
  ambience(name) {
    if (name && !SCENES[name]) console.warn('알 수 없는 환경음', name);
    this.amb = SCENES[name] ? name : null;
  }

  update(g, dt) {
    if (!this.ctx) return;
    this.acc += dt || 0;
    if (this.acc < STEP) return;
    this.acc = 0;
    let scene = sceneOf(g);
    if (scene === 'school' && this.amb) scene = this.amb;
    const changed = scene !== this.scene;
    if (changed) { this.scene = scene; this.P = SCENES[scene]; this.sweep(); }
    // 비대칭 스무딩: 올라갈 땐 빨리(발각이 컷처럼 들어온다), 내려갈 땐 천천히(추격이 끝나도 꼬리를 끈다)
    const goal = tensionOf(g);
    this.ten += (goal - this.ten) * Math.min(1, STEP / (goal > this.ten ? 0.25 : 2.5));
    this.duck = (g.busy || g.ui?.modal) ? 0.45 : g.player?.hidden ? 0.3 : 1;
    this.apply(changed ? this.P.sm : 0.3);
    if (this.ctx.currentTime > this.swept) this.sweep();
  }

  apply(sm) {
    const t = this.ctx.currentTime, P = this.P, ten = this.ten, k = Math.max(0.02, sm) / 3;
    this.bus.gain.setTargetAtTime(this.duck, t, 0.25);
    this.droneG.gain.setTargetAtTime(P.drone * (1 + 0.6 * ten), t, k);
    this.airG.gain.setTargetAtTime(P.air * (1 - 0.35 * ten), t, k); // 긴장이 오르면 환경음이 뒤로 물러난다
    this.pulG.gain.setTargetAtTime(PULSE * Math.max(0, (ten - 0.35) / 0.65), t, k);
    this.pulF.frequency.setTargetAtTime(P.root * 6, t, 0.5);
    this.airF.Q.setTargetAtTime(P.q, t, 0.5);
    for (let i = 0; i < 3; i++) this.osc[i].frequency.setTargetAtTime(P.root * this.k[i], t, Math.max(0.02, sm) / 2);
  }

  // 공기층 중심 주파수를 40초에 걸쳐 ±1.8배 왕복. 주기마다 예약을 지우고 둘만 다시 걸어 이벤트가 쌓이지 않게 한다
  sweep() {
    const t = this.ctx.currentTime, f = this.airF.frequency, lo = Math.max(20, this.P.hz / 1.8);
    f.cancelScheduledValues(t);
    f.setValueAtTime(lo, t);
    f.linearRampToValueAtTime(this.P.hz * 1.8, t + 20);
    f.linearRampToValueAtTime(lo, t + 40);
    this.swept = t + 40;
  }

  // 오르골 단음: 노드 2개, 2.7초 뒤 스스로 사라진다
  note(f, at) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.setPeriodicWave(this.wave);
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 24;
    // exponentialRamp 는 0 에서 시작하거나 끝낼 수 없다(RangeError, 또는 램프 구간이 통째로 무음)
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.055, at + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);
    o.connect(g).connect(this.bus);
    o.start(at); o.stop(at + 2.7);
  }

  tick() {
    if (this.a.muted || !this.P.gap) return;
    const t = this.ctx.currentTime;
    if (this.next < t) this.next = t + 0.3;
    while (this.next < t + LOOK) {
      this.note(this.P.root * TORI[Math.floor(Math.random() * TORI.length)], this.next);
      this.next += this.P.gap * (1 - 0.55 * this.ten) * (0.7 + Math.random() * 0.6);
    }
  }

  // ctx 가 멈추면 currentTime 도 멈추는데 setInterval 은 계속 돈다 —
  // 그대로 두면 복귀 순간 과거 시각으로 예약된 음이 한꺼번에 쏟아진다
  onSuspend() { clearInterval(this.iv); this.iv = 0; }
  onResume() { if (!this.iv) { this.next = 0; this.iv = setInterval(() => this.tick(), TICK); } }
}
