// 게임 상태 + 갱신/렌더 + 이벤트 스크립트 API
import { World, TW, TH } from './world.js';
import { Player, Janitor, Ghost, Actor, dirVec } from './actors.js';
import { Lighting } from './light.js';
import { sprites } from './sprites.js';
import { input } from './input.js';
import { markSeen } from './mapview.js';

const VIEW_W = 9 * TW; // 세로 화면 기준 가로 9타일

export class Game {
  constructor({ canvas, ui, audio, story }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.audio = audio;
    this.story = story;
    this.light = new Lighting();
    this.cam = { x: 0, y: 0, w: VIEW_W, h: 600 };
    this.shake = 0;
    this.t = 0;
    this.reset();
  }

  reset() {
    this.gen = (this.gen || 0) + 1; // 이전 게임의 스크립트가 재개되지 않도록 세대 번호
    this.flags = {};
    this.inv = [];        // 아이템 id 목록 (중복 허용: 동전 등)
    this.docs = [];       // 읽은 문서/괴담 id
    this.hp = 100;
    this.lighter = false; // 라이터 켜짐
    this.busy = 0;        // >0 이면 컷신(플레이어 조작 잠금)
    this.actors = [];
    this.world = null;
    this.player = new Player({});
    this.timer = null;    // { left, label, onEnd(스크립트 이름) }
    this.laters = [];     // 지연 실행 [{ t, run }]
    this.headPending = null;
    this.loopT = {};
    this.over = false;
    this.invuln = 0;
  }

  // ---------------- 상태 ----------------
  doorState(mapId, d) {
    const k = `door:${mapId}:${d.x},${d.y}`;
    const s = this.flags[k];
    return { open: s === 'open' ? true : s === 'closed' ? false : !!d.open, locked: s ? false : (d.locked || null) };
  }
  has(id) { return this.inv.includes(id); }
  count(id) { return this.inv.filter(i => i === id).length; }
  give(id, n = 1) { for (let i = 0; i < n; i++) this.inv.push(id); this.ui.refreshHud(this); }
  take(id, n = 1) {
    for (let i = 0; i < n; i++) { const k = this.inv.indexOf(id); if (k >= 0) this.inv.splice(k, 1); }
    this.ui.refreshHud(this);
  }

  docOf(id) {
    const d = this.story.docs[id];
    return d && typeof d.body === 'function' ? { ...d, body: d.body(this) } : d;
  }

  // ---------------- 맵 ----------------
  enterMap(id, x, y, dir) {
    const def = this.story.maps[id];
    this.world = new World(def, this);
    this.mapId = id;
    this.player.x = x; this.player.y = y; this.player.dir = dir || this.player.dir;
    this.player.route = null;
    this.actors = [];
    for (const a of def.actors || []) {
      if (a.cond && !a.cond(this)) continue;
      this.spawn(a);
    }
    this.headPending = null;
    this.idleAnchor = null;
    this.ui.setLocation(def.name);
    this.audio?.ambience(def.ambience || 'school');
    this.snapCamera();
    const ev = this.story.onEnter?.[id];
    if (ev) this.run(ev);
  }

  spawn(a) {
    const C = a.kind === 'janitor' ? Janitor : a.kind === 'ghost' ? Ghost : Actor;
    const act = new C({ ...a });
    this.actors.push(act);
    return act;
  }
  actor(id) { return this.actors.find(a => a.id === id); }
  despawn(id) { this.actors = this.actors.filter(a => a.id !== id); }

  // ---------------- 스크립트 ----------------
  async run(fn) {
    if (typeof fn === 'string') fn = this.story.scripts[fn];
    if (fn && typeof fn !== 'function') { console.warn('스크립트 아님', fn); return; }
    if (!fn) return;
    this.busy++;
    input.x = input.y = 0;
    try { await fn(this.api()); }
    catch (e) { if (e !== GAME_OVER) console.error(e); }
    finally {
      this.busy = Math.max(0, this.busy - 1);
      if (!this.busy) this.ui.cinema(false);
      this.ui.refreshHud(this);
    }
  }

  api() {
    const g = this, gen = this.gen;
    // 비동기 호출 뒤 게임이 리셋(게임오버/불러오기)됐으면 스크립트 중단
    const G = p => Promise.resolve(p).then(v => { if (g.gen !== gen || g.over) throw GAME_OVER; return v; });
    return {
      g,
      say: (who, text, face) => G(g.ui.say(who, text, face)),
      // 서술(조사·사건)은 주인공의 반응 초상화와 함께: face = 표정(없으면 기본)
      narrate: (text, face) => G(g.ui.say(null, text, face || 'default')),
      choice: (q, opts, o) => G(g.ui.choice(q, opts, o)),
      qte: (label, taps, sec) => G(g.ui.qte(label, taps, sec)),
      switches: (title, labels, hint) => G(g.ui.switches(title, labels, hint)),
      objective: t => { g.flags.objective = t; g.ui.objective(t); },
      hide: (x, y) => g.hide(x, y),
      later: (sec, run) => g.laters.push({ t: sec, run }),
      refresh: () => g.world.refresh(),
      player: () => g.player,
      alert: (x, y) => g.alertJanitors(x, y),
      // 체크포인트: 게임오버 화면에서 이 지점부터 다시 (불러오기·재시도 사이에도 유지)
      checkpoint: label => { g.checkpointData = { ...g.snapshot(), label }; },
      clearCheckpoint: () => { g.checkpointData = null; },
      toast: t => G(g.ui.toast(t)),
      wait: s => G(new Promise(r => setTimeout(r, s * 1000))),
      flag: (k, v) => (v === undefined ? g.flags[k] : (g.flags[k] = v)),
      has: id => g.has(id),
      give: async (id, n = 1) => { g.give(id, n); g.audio?.pickup(); await G(g.ui.toast(`${g.story.items[id]?.name || id}${n > 1 ? ` ×${n}` : ''} 획득`)); },
      take: (id, n) => g.take(id, n),
      doc: async id => { if (!g.docs.includes(id)) g.docs.push(id); await G(g.ui.doc(g.docOf(id))); },
      fade: (to, s = 0.6) => G(g.ui.fade(to, s)),
      card: (title, sub) => G(g.ui.card(title, sub)),
      cg: (key, caption) => G(g.ui.cg(key, caption)),
      cinema: on => g.ui.cinema(on),
      sfx: name => g.audio?.play(name),
      shake: (s = 0.4) => { g.shake = s; },
      warp: async (map, x, y, dir) => { await G(g.ui.fade(1, 0.35)); g.enterMap(map, x, y, dir); await G(g.ui.fade(0, 0.35)); },
      spawn: a => g.spawn(a),
      despawn: id => g.despawn(id),
      actor: id => g.actor(id),
      move: (id, x, y, speed) => G((id === 'player' ? g.player : g.actor(id)).goTo(g.world, x, y, speed)),
      face: (id, dir) => { (id === 'player' ? g.player : g.actor(id)).dir = dir; },
      door: (x, y, st) => g.setDoor(x, y, st),
      timer: (sec, label, onEnd) => { g.timer = { left: sec, label, onEnd }; },
      stopTimer: () => { g.timer = null; g.ui.timer(null); },
      lighterOn: v => { g.lighter = v; },
      damage: n => { g.damage(n); if (g.over) throw GAME_OVER; },
      keypad: (title, len) => G(g.ui.keypad(title, len)),
      save: () => G(g.ui.saveMenu(g)),
      heal: n => { g.hp = Math.min(100, g.hp + n); g.ui.refreshHud(g); },
      gameOver: reason => { g.gameOver(reason); throw GAME_OVER; },
      endChapter: (t, s) => G(g.ui.endChapter(t, s, g)),
    };
  }

  setDoor(x, y, st) {
    const d = this.world.door(x, y);
    if (!d) return;
    if (st === 'unlock') { d.locked = null; this.flags[`door:${this.mapId}:${x},${y}`] = d.open ? 'open' : 'closed'; return; }
    d.open = st === 'open';
    if (st === 'open' || st === 'closed') { d.locked = null; this.flags[`door:${this.mapId}:${x},${y}`] = st; }
    if (st === 'lock') { d.open = false; d.locked = true; delete this.flags[`door:${this.mapId}:${x},${y}`]; }
  }

  // ---------------- 조사(상호작용) ----------------
  // 바라보는 방향 앞쪽(가까운 지점부터)에서 조사 대상을 찾는다. 모바일 조작이라 약간 넉넉하게 잡는다.
  focus() {
    const p = this.player;
    const [fx, fy] = dirVec(p.dir);
    for (const k of [0.6, 0.9]) {
      const f = this.focusAt(p.x + fx * k, p.y + fy * k);
      if (f) return f;
    }
    return null;
  }

  focusAt(tx, ty) {
    for (const a of this.actors) {
      if (!a.visible || !a.talk) continue;
      if (Math.hypot(a.x - tx, a.y - ty) < 0.75) return { kind: 'actor', a, x: a.x, y: a.y };
    }
    const c = Math.floor(tx), r = Math.floor(ty);
    for (const ev of this.world.def.events || []) {
      if (ev.on !== 'act' || this.evDone(ev) || (ev.cond && !ev.cond(this))) continue;
      const w = ev.w || 1, h = ev.h || 1;
      if (c >= ev.x && c < ev.x + w && r >= ev.y && r < ev.y + h) return { kind: 'event', ev, x: ev.x + w / 2, y: ev.y + h / 2 };
    }
    const d = this.world.door(c, r);
    if (d) return { kind: 'door', d, x: c + 0.5, y: r + 0.5 };
    return null;
  }

  act() {
    const f = this.focus();
    if (!f) return;
    if (f.kind === 'actor') this.run(f.a.talk);
    else if (f.kind === 'event') this.fire(f.ev);
    else if (f.kind === 'door') this.useDoor(f.d);
  }

  useDoor(d) {
    if (d.locked) {
      const key = typeof d.locked === 'string' ? d.locked : null;
      if (key && this.has(key)) {
        this.setDoor(d.x, d.y, 'open');
        this.audio?.play('unlock');
        this.ui.toast(`${this.story.items[key]?.name || '열쇠'}로 문을 열었다`);
        return;
      }
      this.audio?.play('locked');
      this.run(async s => s.narrate(d.lockedText || '잠겨 있다.', d.lockedFace));
      return;
    }
    // 문틀에 누가 서 있으면 닫지 않는다
    if (d.open && [this.player, ...this.actors].some(a => a.x + a.rad > d.x && a.x - a.rad < d.x + 1 && a.y + a.rad > d.y && a.y - a.rad < d.y + 1)) return;
    this.setDoor(d.x, d.y, d.open ? 'closed' : 'open');
    this.audio?.door();
  }

  checkTouch() {
    const p = this.player;
    const c = Math.floor(p.x), r = Math.floor(p.y);
    for (const ev of this.world.def.events || []) {
      if (ev.on !== 'touch' || this.evDone(ev) || (ev.cond && !ev.cond(this))) continue;
      const w = ev.w || 1, h = ev.h || 1;
      if (c >= ev.x && c < ev.x + w && r >= ev.y && r < ev.y + h) { this.fire(ev); return; }
    }
  }

  evDone(ev) { return (ev.once || ev.item) && this.flags['ev:' + ev.id]; }

  // 이벤트 실행: item(줍기) / text(한 줄 조사) / run(스크립트 이름 또는 함수)
  fire(ev) {
    if (ev.once || ev.item) { this.flags['ev:' + ev.id] = true; this.world.refresh(); }
    if (ev.item) {
      return this.run(async s => {
        if (ev.text) await s.narrate(ev.text, ev.face);
        await s.give(ev.item, ev.n || 1);
        if (ev.after) await (typeof ev.after === 'function' ? ev.after(s) : this.story.scripts[ev.after](s));
      });
    }
    if (ev.text && !ev.run) return this.run(async s => s.narrate(ev.text, ev.face));
    this.run(ev.run);
  }

  pickups() {
    return (this.world.def.events || []).filter(ev => ev.item && !this.flags['ev:' + ev.id] && (!ev.cond || ev.cond(this)));
  }

  // ---------------- 숨기 ----------------
  hide(x, y) {
    const p = this.player;
    const seen = this.actors.some(a => a instanceof Janitor && a.state === 'chase' && a.sees(this, p));
    if (seen) {
      this.ui.toast('들켰다!');
      this.damage(25);
      return false;
    }
    p.hiddenFrom = [p.x, p.y];
    p.x = x; p.y = y;
    p.hidden = true; p.visible = false; p.moving = false; p.noise = 0;
    this.lighter = false;
    this.ui.toast('숨었다 · 조사 버튼으로 나가기');
    return true;
  }
  unhide() {
    const p = this.player;
    [p.x, p.y] = p.hiddenFrom;
    p.hidden = false; p.visible = true;
  }

  alertJanitors(x, y) {
    for (const a of this.actors) if (a instanceof Janitor && a.state !== 'chase') { a.state = 'investigate'; a.lastSeen = [x, y]; a.path = null; }
  }

  // ---------------- 피해 ----------------
  damage(n) {
    if (this.invuln > 0 || this.over) return;
    this.hp = Math.max(0, this.hp - n);
    this.invuln = 1.2;
    this.shake = 0.35;
    this.ui.hurt();
    this.audio?.play('hit');
    this.ui.refreshHud(this);
    if (this.hp <= 0) this.gameOver('정신을 잃었다…');
  }

  gameOver(reason) {
    if (this.over) return;
    this.over = true;
    this.timer = null;
    this.ui.timer(null);
    this.audio?.play('stinger');
    this.ui.gameOver(reason, this);
  }

  // 머리귀신: 한 구역(반경 4타일)에 오래 머물면 종소리 4번 뒤 나타나 천천히 다가온다.
  // 닿으면 피해 + 수위가 그 자리로 온다. 멀리 떨어져 있으면 흐려지며 사라진다.
  headGhost(dt) {
    const H = this.story.headGhost;
    const hg = this.actor('head');
    if (!H || !this.flags[H.flag] || this.world.def.noHeadGhost || this.qaSafe) {
      if (hg) this.despawn('head');
      this.headPending = null;
      return;
    }
    const p = this.player;
    if (this.headPending) {
      this.headPending -= dt;
      if (this.headPending <= 0) { this.headPending = null; this.spawnHead(H); }
      return;
    }
    if (hg) {
      const d = Math.hypot(hg.x - p.x, hg.y - p.y);
      hg.far = d > 5 ? (hg.far || 0) + dt : 0;
      hg.alpha = Math.max(0.15, 1 - (hg.far || 0) / 5);
      if (hg.far > 5) this.despawn('head');
      return;
    }
    const A = this.idleAnchor;
    if (!A || A.map !== this.mapId || Math.hypot(p.x - A.x, p.y - A.y) > 4) { this.idleAnchor = { map: this.mapId, x: p.x, y: p.y, t: 0 }; return; }
    A.t += dt;
    if (A.t < H.after) return;
    A.t = -9999; // 한 번 나타나면 이동하기 전까지 재출현 없음
    this.audio?.play('headbell'); // 괴담대로 종소리 4번
    this.headPending = 2.6;       // 게임 시간 기준(맵 이동·불러오기·메뉴 중에는 흐르지 않음)
  }

  spawnHead(H) {
    const p = this.player;
    const [fx, fy] = dirVec(p.dir);
    for (const k of [5, 4, 3]) {
      const x = p.x + fx * k, y = p.y + fy * k;
      if (!this.world.isSolid(Math.floor(x), Math.floor(y))) {
        this.spawn({ id: 'head', kind: 'ghost', sprite: H.sprite, x, y, chase: true, speed: 0.85, dmg: H.dmg, glow: '170,190,220', onTouch: 'head' });
        this.audio?.play('creak');
        return;
      }
    }
  }

  onJanitorSpot() { this.audio?.play('whistle'); }
  onJanitorHit() { this.damage(25); }
  onGhostTouch(gh) {
    this.damage(gh.dmg || 40);
    if (gh.onTouch === 'head') { this.despawn(gh.id); this.alertJanitors(this.player.x, this.player.y); }
  }

  // ---------------- 루프 ----------------
  update(dt) {
    if (!this.world || this.over) { input.endFrame(); return; }
    this.t += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    markSeen(this);
    const free = !this.busy && !this.ui.modal;
    if (free && input.consume('lighter') && this.has('lighter')) { this.lighter = !this.lighter; this.audio?.play('switch'); this.ui.refreshHud(this); }
    if (free) this.tickLaters(dt);
    this.tickLoops(dt);
    if (free && this.player.hidden) {
      if (input.consume('action')) this.unhide();
      if (input.consume('menu')) this.ui.openMenu(this);
      if (input.consume('map')) this.ui.openMap(this);
    } else if (free) {
      if (input.consume('menu')) { this.ui.openMenu(this); input.endFrame(); return; }
      if (input.consume('map')) { this.ui.openMap(this); input.endFrame(); return; }
      if (input.consume('action')) this.act();
      this.player.control(dt, this, input);
      this.checkTouch();
      this.headGhost(dt);
    } else {
      this.player.followRoute(this.world, dt) || (this.player.moving = false);
      this.player.noise = 0;
    }
    for (const a of this.actors) {
      if (!free && !a.route) continue; // 대사·메뉴·컷신 중에는 수위·귀신 AI 정지 (스크립트 이동만 진행)
      a.update(dt, this);
    }
    if (this.timer && free) {
      this.timer.left -= dt;
      this.ui.timer(this.timer);
      if (this.timer.left <= 0) { const t = this.timer; this.timer = null; this.ui.timer(null); this.run(t.onEnd); }
    }
    this.updateDanger(dt);
    input.endFrame();
  }

  tickLaters(dt) {
    for (const L of this.laters) L.t -= dt;
    const due = this.laters.filter(L => L.t <= 0);
    this.laters = this.laters.filter(L => L.t > 0);
    for (const L of due) this.run(L.run);
  }

  // 맵의 반복 효과음 (예: 경보가 울리는 동안 사이렌)
  tickLoops(dt) {
    for (const L of this.world.def.loops || []) {
      if (L.flag && !this.flags[L.flag]) continue;
      const k = L.sfx;
      this.loopT[k] = (this.loopT[k] ?? 0) - dt;
      if (this.loopT[k] <= 0) { this.loopT[k] = L.every; this.audio?.play(L.sfx); }
    }
  }

  updateDanger() {
    let danger = 0;
    for (const a of this.actors) {
      if (!(a instanceof Janitor) && !(a instanceof Ghost && a.chase)) continue;
      const d = Math.hypot(a.x - this.player.x, a.y - this.player.y);
      const chasing = a.state === 'chase' || a.chase;
      danger = Math.max(danger, chasing ? 1 : Math.max(0, 1 - d / 7) * 0.6);
      this.audio?.keys(a, d);
    }
    this.danger = danger;
    this.audio?.heartbeat(danger);
    this.ui.danger(danger);
  }

  snapCamera() {
    const p = this.player;
    this.cam.x = p.x * TW - this.cam.w / 2;
    this.cam.y = p.y * TH - this.cam.h * 0.48;
    this.clampCam();
  }
  clampCam() {
    const W = this.world.cols * TW, H = this.world.rows * TH;
    this.cam.x = W <= this.cam.w ? (W - this.cam.w) / 2 : Math.max(0, Math.min(W - this.cam.w, this.cam.x));
    this.cam.y = H + 40 <= this.cam.h ? (H - this.cam.h) / 2 : Math.max(-40, Math.min(H - this.cam.h + 40, this.cam.y));
  }

  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.scale = this.canvas.width / VIEW_W;
    this.cam.h = this.canvas.height / this.scale;
    this.light.resize(this.canvas.width, this.canvas.height);
    if (this.world) this.snapCamera();
  }

  render(dt) {
    const ctx = this.ctx, cv = this.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cv.width, cv.height);
    if (!this.world) return;
    const p = this.player;
    // 카메라: 부드럽게 추적 (조이스틱이 화면 아래를 가리므로 플레이어를 약간 위에 둔다)
    const tx = p.x * TW - this.cam.w / 2, ty = p.y * TH - this.cam.h * 0.42;
    const k = Math.min(1, dt * 6);
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.clampCam();
    let sx = 0, sy = 0;
    if (this.shake > 0) { this.shake -= dt; sx = (Math.random() - 0.5) * 6; sy = (Math.random() - 0.5) * 6; }
    const s = this.scale;
    ctx.imageSmoothingEnabled = false; // 도트: 최근접 확대
    ctx.setTransform(s, 0, 0, s, Math.round((-this.cam.x + sx) * s), Math.round((-this.cam.y + sy) * s));

    this.world.drawFloor(ctx, this.cam, sprites);
    const list = [];
    this.world.collectDrawables(list, this.cam, sprites);
    for (const a of this.actors) if (a.visible) list.push({ key: a.y, k2: 1, actor: a });
    if (p.visible && !p.hidden) list.push({ key: p.y, k2: 1, actor: p });
    list.sort((a, b) => a.key - b.key || a.k2 - b.k2);
    for (const d of list) {
      if (d.actor) {
        if (d.actor === p && this.invuln > 0 && Math.floor(this.t * 16) % 2) continue;
        d.actor.draw(ctx, sprites);
      } else sprites.draw(ctx, d.s, d.x * TW, d.y * TH - (d.lift || 0));
    }
    // 벽 뒤에 가려진 플레이어 실루엣
    if (p.visible && !p.hidden && (this.world.isWall(Math.floor(p.x), Math.floor(p.y) + 1) || this.world.ch(Math.floor(p.x), Math.floor(p.y) + 1) === 'D')) {
      ctx.globalAlpha = 0.35;
      p.draw(ctx, sprites);
      ctx.globalAlpha = 1;
    }

    this.light.ambient = this.world.def.ambient || '#0b0d16';
    this.light.render(ctx, this.world, this.cam, s, this.lights());
    this.drawGlows(ctx);
    this.drawFocus(ctx);
  }

  lights() {
    const p = this.player, L = [];
    // 플레이어 주변 최소 시야
    L.push({ x: p.x, y: p.y - 0.2, r: 2.4, color: '150,160,190', a: 0.55, los: true });
    if (this.lighter) L.push({ x: p.x, y: p.y - 0.25, r: 4.6, color: '255,190,120', a: 0.95 + Math.sin(this.t * 23) * 0.04 });
    for (const l of this.world.def.lights || []) if (!l.flag || this.flags[l.flag]) L.push(l);
    for (const a of this.actors) {
      if (!a.visible) continue;
      if (a.light) L.push(a.light());
      if (a.glow) L.push({ x: a.x, y: a.y - 0.4, r: 1.8, color: a.glow, a: 0.5, los: false });
    }
    return L;
  }

  drawGlows(ctx) {
    // 비상구 유도등처럼 어둠 속에서도 보이는 표식 + 주울 수 있는 물건 반짝임
    ctx.globalCompositeOperation = 'lighter';
    for (const ev of this.pickups()) {
      const x = (ev.x + 0.5) * TW, y = (ev.y + 0.6) * TH - 6;
      const a = 0.35 + 0.35 * Math.sin(this.t * 4 + ev.x * 1.7);
      ctx.fillStyle = `rgba(255,240,200,${a})`;
      ctx.beginPath();
      ctx.moveTo(x, y - 5); ctx.lineTo(x + 1.2, y - 1.2); ctx.lineTo(x + 5, y); ctx.lineTo(x + 1.2, y + 1.2);
      ctx.lineTo(x, y + 5); ctx.lineTo(x - 1.2, y + 1.2); ctx.lineTo(x - 5, y); ctx.lineTo(x - 1.2, y - 1.2);
      ctx.closePath(); ctx.fill();
    }
    for (const gl of this.world.def.glows || []) {
      const x = gl.x * TW, y = gl.y * TH;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
      g.addColorStop(0, `rgba(${gl.color},0.9)`);
      g.addColorStop(1, `rgba(${gl.color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - 14, y - 14, 28, 28);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // 조사할 수 있으면 플레이어 머리 위에 빨간 말풍선 (사람: …, 그 외: ?)
  drawFocus(ctx) {
    if (this.busy || this.ui.modal || this.player.hidden) return;
    const f = this.focus();
    if (!f) return;
    const x = Math.round(this.player.x * TW), y = Math.round(this.player.y * TH - 37 + Math.sin(this.t * 5) * 1.2);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 8, y - 14, 16, 12);
    ctx.beginPath(); ctx.moveTo(x - 4, y - 3); ctx.lineTo(x + 2, y - 3); ctx.lineTo(x - 3, y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0282e';
    ctx.fillRect(x - 7, y - 13, 14, 10);
    ctx.beginPath(); ctx.moveTo(x - 3, y - 4); ctx.lineTo(x + 1, y - 4); ctx.lineTo(x - 2, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '9px Galmuri11, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.kind === 'actor' ? '…' : '?', x, y - 8);
  }

  // ---------------- 저장 ----------------
  snapshot() {
    const p = this.player;
    const timer = this.timer && { left: this.timer.left, label: this.timer.label, onEnd: this.timer.onEnd };
    const laters = this.laters.filter(L => typeof L.run === 'string').map(L => ({ t: L.t, run: L.run }));
    return { v: 1, map: this.mapId, x: p.x, y: p.y, dir: p.dir, hp: this.hp, inv: [...this.inv], docs: [...this.docs], flags: { ...this.flags }, lighter: this.lighter, timer, laters, at: Date.now() };
  }
  restore(s) {
    this.reset();
    Object.assign(this, { hp: s.hp, inv: [...s.inv], docs: [...s.docs], flags: { ...s.flags }, lighter: s.lighter, timer: s.timer ? { ...s.timer } : null, laters: (s.laters || []).map(L => ({ ...L })) });
    this.ui.clear();
    this.enterMap(s.map, s.x, s.y, s.dir);
    this.ui.objective(this.flags.objective);
    this.ui.refreshHud(this);
  }
}

export const GAME_OVER = Symbol('gameover');
