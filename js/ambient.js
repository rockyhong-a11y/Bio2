// 움직이는 배경 디테일(도트): 정적인 학교에 살아 있는 느낌을 준다. 게임 진행에는 영향 없음(충돌·판정 없음).
//   조명: 형광등·자판기 불빛 깜빡임, 사이렌 회전등, 빛 속 먼지, 불빛 주위 나방
//   창밖 날씨: 바깥 창문에 빗줄기, 가끔 번개(실내가 잠깐 밝아짐) → 천둥
//   사물: 교실 커튼 흔들림, 거미줄에 매달린 거미, 로비 벽시계 초침, 공중전화 진동(벨이 울릴 때), 세면대 물방울
//   생물·괴이: 벽을 따라 지나가는 쥐·바퀴벌레, 복도 끝에 잠깐 서 있다 사라지는 그림자(붉은 눈), 이상한 화분 떨림
// 깊이 정렬이 필요한 것(커튼·거미·초침·쥐·그림자)은 collect()로 그리기 목록에 넣고, 먼지·나방은 조명 전, 빗줄기·눈빛은 조명 뒤에 그린다.
import { TW, TH } from './world.js';

const rnd = (a, b) => a + Math.random() * (b - a);
function hash(c, r) {
  let h = Math.imul(c + 11, 374761393) ^ Math.imul(r + 7, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const px = (ctx, x, y, w = 1, h = 1) => ctx.fillRect(Math.round(x), Math.round(y), w, h);
const lerpHex = (a, b, k) => {
  const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
const DUST = 26;

export class Ambient {
  constructor(game) {
    this.g = game;
    this.t = 0;
    this.windows = []; this.curtains = []; this.webs = []; this.sinks = []; this.clocks = []; this.phones = [];
    this.reset();
  }

  reset() {
    this.dust = [];
    this.critters = [];
    this.shadow = null;
    this.bolt = null;
    this.thunderIn = null;
    this.nextBolt = rnd(10, 22);
    this.nextCritter = rnd(5, 12);
    this.nextShadow = rnd(45, 90);
    this.ring = 0;
    this.flick = new Map(); // 광원 → { next, until }
  }

  // 맵에 들어갈 때: 창문·커튼·거미줄·세면대·시계·공중전화 위치를 모은다
  enter(world) {
    this.reset();
    this.w = world;
    this.windows = []; this.curtains = []; this.webs = [];
    for (let r = 0; r < world.rows; r++) for (let c = 0; c < world.cols; c++) {
      const ch = world.ch(c, r), below = world.floorStyle(c, r + 1);
      if (!below || world.ch(c, r + 1) === 'D') continue;
      if (ch === 'W') {
        this.windows.push([c, r]);
        if (below === 'wood') {
          if (world.ch(c - 1, r) !== 'W') this.curtains.push([c, r, 0]);
          if (world.ch(c + 1, r) !== 'W') this.curtains.push([c, r, 1]);
        }
      }
      if (ch === '#' && hash(c, r) < 0.07) this.webs.push([c, r, hash(r, c) * 6.28]);
    }
    const props = s => (world.def.props || []).filter(p => p.s === s);
    this.sinks = props('sink').map(p => ({ p, y: 0, t: rnd(0.5, 2.5) }));
    this.clocks = props('clock');
    this.phones = props('payphone');
  }

  event(name) { if (name === 'phone') this.ring = 1.6; }

  update(dt) {
    this.t += dt;
    const g = this.g;
    // 번개: 바깥 창문이 있는 맵에서만
    if (this.windows.length && (this.nextBolt -= dt) <= 0) this.strike();
    if (this.bolt) { this.bolt.t += dt; if (this.bolt.t > 0.7) this.bolt = null; }
    if (this.thunderIn != null && (this.thunderIn -= dt) <= 0) { g.audio?.play('thunder'); this.thunderIn = null; }
    this.ring = Math.max(0, this.ring - dt);
    // 먼지: 카메라 안에서 천천히 떠다닌다
    const cam = g.cam;
    while (this.dust.length < DUST) this.dust.push({ x: cam.x + rnd(0, cam.w), y: cam.y + rnd(0, cam.h), vx: rnd(-3, 3), vy: rnd(-2.5, 1.5), a: rnd(0.25, 0.6) });
    for (const d of this.dust) {
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < cam.x - 8 || d.x > cam.x + cam.w + 8 || d.y < cam.y - 8 || d.y > cam.y + cam.h + 8) { d.x = cam.x + rnd(0, cam.w); d.y = cam.y + rnd(0, cam.h); }
    }
    // 세면대 물방울
    for (const s of this.sinks) {
      if (s.y) { s.y += dt * 40; if (s.y > 7) { s.y = 0; s.splash = 0.25; if (this.near(s.p.x + 0.5, s.p.y + 0.5, 4)) g.audio?.play('drip'); } }
      else if ((s.t -= dt) <= 0) { s.y = 0.01; s.t = rnd(1.2, 3.2); }
      s.splash = Math.max(0, (s.splash || 0) - dt);
    }
    // 쥐·바퀴벌레
    const free = !g.busy && !g.ui.modal;
    if (free && (this.nextCritter -= dt) <= 0) { this.spawnCritter(); this.nextCritter = rnd(14, 32); }
    for (const c of this.critters) { c.x += c.v * dt; c.life -= dt; }
    this.critters = this.critters.filter(c => c.life > 0);
    // 복도 끝 그림자
    if (free && (this.nextShadow -= dt) <= 0) { this.spawnShadow(); this.nextShadow = rnd(55, 110); }
    if (this.shadow) { this.shadow.t += dt; this.shadow.x += this.shadow.v * dt; if (this.shadow.t > 2.6) this.shadow = null; }
  }

  near(x, y, r) { const p = this.g.player; return Math.hypot(p.x - x, p.y - y) < r; }

  strike() {
    this.bolt = { t: 0 };
    this.thunderIn = rnd(0.5, 1.6);
    this.nextBolt = rnd(18, 45);
  }

  // 번개 밝기 0..1 (번쩍-번쩍-잦아듦)
  flash() {
    if (!this.bolt) return 0;
    const t = this.bolt.t;
    return t < 0.06 ? 0.9 : t < 0.12 ? 0.15 : t < 0.2 ? 1 : Math.max(0, 1 - (t - 0.2) / 0.5);
  }

  ambientColor(base) { const f = this.flash(); return f ? lerpHex(base, '#9aa3c6', f * 0.8) : base; }

  // 맵 광원 효과(fx): fluo 형광등 깜빡임, vend 자판기 불빛 떨림, beacon 사이렌 회전등, pulse 맥박
  light(l) {
    if (!l.fx) return l;
    const t = this.t;
    if (l.fx === 'beacon') return { ...l, x: l.x + Math.cos(t * 3.2) * 0.9, y: l.y + Math.sin(t * 3.2) * 0.5, a: l.a * (0.45 + 0.55 * Math.max(0, Math.sin(t * 6.4))) };
    if (l.fx === 'pulse') return { ...l, a: l.a * (0.7 + 0.3 * Math.sin(t * 2.4)) };
    let f = this.flick.get(l);
    if (!f) this.flick.set(l, (f = { next: t + rnd(2, 8), until: 0 }));
    if (t > f.next) { f.until = t + rnd(0.2, 0.6); f.next = f.until + (l.fx === 'vend' ? rnd(8, 20) : rnd(4, 12)); }
    if (t < f.until) return { ...l, a: l.a * (Math.sin(t * 87) > 0.1 ? 1 : l.fx === 'vend' ? 0.45 : 0.12) };
    return l;
  }

  glowAlpha(gl) {
    let f = this.flick.get(gl);
    if (!f) this.flick.set(gl, (f = { next: this.t + rnd(6, 20), until: 0 }));
    if (this.t > f.next) { f.until = this.t + rnd(0.15, 0.4); f.next = f.until + rnd(10, 30); }
    return this.t < f.until && Math.sin(this.t * 70) < 0 ? 0.25 : 0.9;
  }

  jitter() { return Math.sin(this.t * 31) > 0.55 ? (Math.sin(this.t * 97) > 0 ? 1 : -1) : 0; }

  spawnCritter() {
    const g = this.g, w = this.w, cam = g.cam, p = g.player;
    const c0 = Math.floor(cam.x / TW), c1 = Math.floor((cam.x + cam.w) / TW), r0 = Math.floor(cam.y / TH), r1 = Math.floor((cam.y + cam.h) / TH);
    for (let i = 0; i < 20; i++) {
      const c = Math.floor(rnd(c0, c1 + 1)), r = Math.floor(rnd(r0, r1 + 1));
      if (!w.floorStyle(c, r) || w.isSolid(c, r) || !w.isWall(c, r - 1) || Math.hypot(c + 0.5 - p.x, r + 0.5 - p.y) < 2.5) continue;
      const dir = w.isSolid(c + 1, r) ? -1 : 1;
      const rat = Math.random() < 0.45;
      this.critters.push({ x: c + 0.5, y: r + 0.35, v: dir * (rat ? rnd(5, 7) : rnd(2.2, 3.4)), life: rnd(0.5, 0.9), rat });
      if (rat && this.near(c, r, 7)) g.audio?.play('squeak');
      return true;
    }
    return false;
  }

  // 플레이어가 복도(긴 바닥)에 있을 때 화면 안 어둠(3~4.2칸 옆)에 그림자가 잠깐 섰다 사라진다(화면 폭 9칸)
  spawnShadow() {
    const g = this.g, w = this.w, p = g.player;
    if (w.floorStyle(Math.floor(p.x), Math.floor(p.y)) !== 'corridor') return false;
    for (const side of Math.random() < 0.5 ? [1, -1] : [-1, 1]) {
      const x = p.x + side * rnd(3, 4.2), y = p.y;
      if (w.floorStyle(Math.floor(x), Math.floor(y)) !== 'corridor' || w.isSolid(Math.floor(x), Math.floor(y))) continue;
      this.shadow = { x, y, t: 0, v: side * rnd(0.1, 0.35) };
      return true;
    }
    return false;
  }

  // 깊이 정렬이 필요한 것들을 그리기 목록에 넣는다 (game.render 가 d.fx(ctx) 로 그린다)
  collect(list, cam) {
    const vis = (x, y) => x > cam.x / TW - 2 && x < (cam.x + cam.w) / TW + 2 && y > cam.y / TH - 2 && y < (cam.y + cam.h) / TH + 4;
    for (const [c, r, side] of this.curtains) if (vis(c, r)) list.push({ key: r + 1, k2: 0.3, fx: ctx => this.drawCurtain(ctx, c, r, side) });
    for (const [c, r, ph] of this.webs) if (vis(c, r)) list.push({ key: r + 1, k2: 0.3, fx: ctx => this.drawWeb(ctx, c, r, ph) });
    for (const p of this.clocks) if (vis(p.x, p.y)) list.push({ key: p.y + 1, k2: 0.6, fx: ctx => this.drawClockHand(ctx, p) });
    if (this.ring) for (const p of this.phones) if (vis(p.x, p.y)) list.push({ key: p.y + 1, k2: 0.6, fx: ctx => this.drawRing(ctx, p) });
    for (const s of this.sinks) if (vis(s.p.x, s.p.y)) list.push({ key: s.p.y + 1, k2: 0.6, fx: ctx => this.drawDrip(ctx, s) });
    for (const c of this.critters) list.push({ key: c.y, k2: 0.4, fx: ctx => this.drawCritter(ctx, c) });
    if (this.shadow) list.push({ key: this.shadow.y, k2: 0.9, fx: ctx => this.drawShadow(ctx) });
  }

  drawCurtain(ctx, c, r, side) {
    // 위 13줄은 고정(한 번에), 아래 9줄만 흔들린다
    const x0 = c * TW + (side ? TW - 6 : 1), top = (r + 1) * TH - 31;
    ctx.fillStyle = '#5e6a4c';
    px(ctx, x0, top, 5, 1);
    ctx.fillStyle = '#8c9a70';
    px(ctx, x0, top + 1, 5, 12);
    ctx.fillStyle = '#6c7a54';
    px(ctx, x0 + 2, top + 1, 1, 12);
    const k = Math.sin(this.t * 1.3 + c * 0.7);
    for (let i = 13; i < 22; i++) {
      const sway = Math.round(k * (i - 12) / 6);
      ctx.fillStyle = '#8c9a70';
      px(ctx, x0 + sway, top + i, 5, 1);
      ctx.fillStyle = '#6c7a54';
      px(ctx, x0 + sway + 2, top + i, 1, 1);
    }
  }

  drawWeb(ctx, c, r, ph) {
    const x = c * TW + 6 + Math.round(hash(c, r) * 18), top = (r + 1) * TH - 30;
    const len = 5 + Math.round((Math.sin(this.t * 0.9 + ph) + 1) * 2.5);
    ctx.fillStyle = 'rgba(210,214,224,0.45)';
    px(ctx, x, top, 1, len);
    ctx.fillStyle = '#141216';
    px(ctx, x - 1, top + len, 3, 2);
    px(ctx, x - 2, top + len + (Math.sin(this.t * 6 + ph) > 0 ? 0 : 1), 1, 1);
    px(ctx, x + 2, top + len + (Math.sin(this.t * 6 + ph) > 0 ? 1 : 0), 1, 1);
  }

  drawClockHand(ctx, p) {
    // props_room/clock: 22x16(게임 px), 칸 왼쪽에서 5px, 아래선에서 29px 위가 윗변 → 가운데 (16, 21)
    const cx = p.x * TW + 16, cy = (p.y + 1) * TH - 21;
    const a = Math.floor(this.t) * Math.PI / 30 - Math.PI / 2;
    ctx.fillStyle = '#a0202a';
    for (let i = 1; i <= 5; i++) px(ctx, cx + Math.cos(a) * i, cy + Math.sin(a) * i);
  }

  drawRing(ctx, p) {
    if (Math.sin(this.t * 40) < 0) return;
    const x = p.x * TW + 9, y = (p.y + 1) * TH - 26;
    ctx.fillStyle = '#e8e4d0';
    for (const [dx, dy] of [[-3, 0], [-4, 2], [-3, 4], [16, 0], [17, 2], [16, 4]]) px(ctx, x + dx, y + dy);
  }

  drawDrip(ctx, s) {
    // props_pixel/sink: 수도꼭지 끝은 칸 왼쪽에서 9px, 바닥 아래선에서 15px 위
    const fx = s.p.x * TW + 9, fy = (s.p.y + 1) * TH - 15;
    ctx.fillStyle = '#9cc8f0';
    if (s.y) px(ctx, fx, fy + s.y);
    if (s.splash) { px(ctx, fx - 2, fy + 7); px(ctx, fx + 2, fy + 7); }
  }

  drawCritter(ctx, c) {
    const x = c.x * TW, y = c.y * TH, d = Math.sign(c.v);
    if (c.rat) {
      ctx.fillStyle = '#5a5450';
      px(ctx, x - 3, y - 2, 6, 3);
      px(ctx, x + d * 3, y - 1, 2, 2);
      ctx.fillStyle = '#c08a8a';
      px(ctx, x - d * 4 - (d < 0 ? 0 : 3), y, 4, 1);
      ctx.fillStyle = '#1a1416';
      px(ctx, x + d * 4, y - 1);
    } else {
      ctx.fillStyle = '#3a2418';
      px(ctx, x - 1, y - 1, 3, 2);
      ctx.fillStyle = '#5c3a26';
      px(ctx, x + d * 2, y - 2);
      if (Math.sin(this.t * 50) > 0) px(ctx, x - 2, y);
    }
  }

  shadowAlpha() {
    const t = this.shadow?.t || 0;
    return t < 0.6 ? t / 0.6 : t < 1.8 ? 1 : Math.max(0, 1 - (t - 1.8) / 0.8);
  }

  drawShadow(ctx) {
    const s = this.shadow, x = Math.round(s.x * TW), y = Math.round(s.y * TH), a = this.shadowAlpha() * 0.85;
    ctx.fillStyle = `rgba(6,6,10,${a})`;
    px(ctx, x - 3, y - 30, 6, 6);
    px(ctx, x - 4, y - 24, 8, 3);
    px(ctx, x - 5, y - 21, 10, 14);
    px(ctx, x - 4, y - 7, 3, 7);
    px(ctx, x + 1, y - 7, 3, 7);
  }

  // 조명 전에(빛이 닿는 곳에서만 보임): 먼지, 나방
  drawFree(ctx) {
    ctx.fillStyle = 'rgb(232,226,210)';
    for (const d of this.dust) { ctx.globalAlpha = d.a; px(ctx, d.x, d.y); }
    ctx.globalAlpha = 1;
    for (const l of this.w.def.lights || []) {
      if (!l.fx || l.fx === 'beacon' || l.fx === 'pulse' || (l.flag && !this.g.flags[l.flag])) continue;
      for (let i = 0; i < 2; i++) {
        const k = this.t * (1.7 + i * 0.6) + i * 2.1;
        const mx = l.x * TW + Math.cos(k) * 14 + Math.sin(k * 2.3) * 4, my = l.y * TH - 18 + Math.sin(k * 1.4) * 8;
        ctx.fillStyle = '#d8d0b8';
        px(ctx, mx, my, 1, 1);
        px(ctx, mx + (Math.sin(this.t * 40 + i) > 0 ? 1 : -1), my, 1, 1);
      }
    }
  }

  // 조명 뒤에(어둠 속에서도 보임): 창문 빗줄기·번개 빛, 그림자의 붉은 눈
  drawAfterLight(ctx) {
    const cam = this.g.cam, f = this.flash();
    const c0 = Math.floor(cam.x / TW) - 1, c1 = Math.ceil((cam.x + cam.w) / TW) + 1, r0 = Math.floor(cam.y / TH) - 1, r1 = Math.ceil((cam.y + cam.h) / TH) + 2;
    for (const [c, r] of this.windows) {
      if (c < c0 || c > c1 || r < r0 || r > r1) continue;
      const x0 = c * TW + 4, top = (r + 1) * TH - 28;
      if (f) { ctx.fillStyle = `rgba(220,226,255,${f * 0.55})`; ctx.fillRect(x0, top, 24, 17); }
      ctx.fillStyle = 'rgba(160,184,230,0.32)';
      for (let i = 0; i < 4; i++) {
        const sx = x0 + 1 + Math.floor(hash(c * 4 + i, r) * 21);
        const sy = top + ((this.t * (38 + i * 9) + hash(r, c * 4 + i) * 17) % 15);
        px(ctx, sx, sy, 1, 3);
      }
    }
    const s = this.shadow;
    if (s && this.shadowAlpha() > 0.5 && !(s.t > 1.1 && s.t < 1.25)) {
      ctx.fillStyle = `rgba(255,40,40,${(this.shadowAlpha() - 0.5) * 1.6})`;
      const x = Math.round(s.x * TW), y = Math.round(s.y * TH);
      px(ctx, x - 2, y - 28); px(ctx, x + 1, y - 28);
    }
  }
}
