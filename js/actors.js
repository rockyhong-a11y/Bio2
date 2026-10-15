// 캐릭터: 플레이어, NPC, 경비원(순찰→의심→추격→수색), 귀신(스크립트 제어)
// 스프라이트 키: `${skin}_${dir}_${frame}`  dir: down|up|left|right, frame 0=서기 1=왼발 2=오른발
import { TW, TH } from './world.js';

const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const WALK = [1, 0, 2, 0];
const STRIDE = 0.3; // 이 거리(타일)마다 걷기 프레임 1칸
export const RUN_AT = 0.85; // 이동 입력 세기가 이 이상이면 달리기

export function dirOf(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
export const dirVec = d => DIRS[d];

export class Actor {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, dir: 'down', skin: 'heemin', rad: 0.28, moving: false, walkT: 0, visible: true, alpha: 1 }, o);
    this.route = null;
  }

  get key() { return this.y; }

  frame() { return this.moving ? WALK[Math.floor(this.walkT) % 4] : 0; }

  draw(ctx, sprites) {
    if (!this.visible) return;
    const x = this.x * TW, y = this.y * TH;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    sprites.draw(ctx, this.sprite || `${this.skin}_${this.dir}_${this.frame()}`, x, y);
    ctx.globalAlpha = 1;
  }

  step(world, vx, vy, dt) {
    this.moving = !!(vx || vy);
    if (!this.moving) return;
    this.dir = dirOf(vx, vy);
    const ox = this.x, oy = this.y;
    world.move(this, vx * dt, vy * dt, this.rad);
    const moved = Math.hypot(this.x - ox, this.y - oy);
    this.walkT += moved / STRIDE;
    this.lastMoved = moved;
  }

  // 스크립트 이동: 경로를 따라 이동, 도착 시 resolve
  goTo(world, tx, ty, speed = 2) {
    const p = world.path(this.x, this.y, tx, ty);
    const pts = (p || []).map(([c, r]) => [c + 0.5, r + 0.5]);
    if (pts.length) pts[pts.length - 1] = [tx, ty]; else pts.push([tx, ty]);
    return new Promise(done => { this.route = { pts, speed, done, ghost: !p }; });
  }

  followRoute(world, dt) {
    const R = this.route;
    if (!R) return false;
    const [tx, ty] = R.pts[0];
    const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
    const s = R.speed * dt;
    if (d <= s) {
      this.x = tx; this.y = ty;
      R.pts.shift();
      if (!R.pts.length) { this.route = null; this.moving = false; R.done(); return true; }
    } else {
      this.dir = dirOf(dx, dy);
      this.x += dx / d * s; this.y += dy / d * s;
      this.walkT += s / STRIDE;
      this.moving = true;
    }
    return true;
  }

  update(dt, game) { this.followRoute(game.world, dt); }
}

export class Player extends Actor {
  constructor(o) {
    super({ skin: 'heemin', walk: 2.2, runSpeed: 3.8, ...o });
    this.hidden = false;
    this.noise = 0;
  }

  control(dt, game, input) {
    if (this.followRoute(game.world, dt)) return;
    let { x: vx, y: vy } = input;
    const m = Math.min(1, Math.hypot(vx, vy));
    if (m === 0) { this.moving = false; this.noise = 0; return; }
    // 스틱(조이스틱)을 끝까지(RUN_AT 이상) 밀면 달리기, 덜 밀면 걷기 — 아주 살짝이면 더 천천히(키보드 방향키는 늘 끝까지)
    // 동행이 앞장서는 동안은 뒤에 붙어 걷는다(달리면 앞질러 짜증) — 수위에게 쫓길 때는 달릴 수 있다
    const escort = game.actors.some(a => a.lead?.length) && !game.actors.some(a => a instanceof Janitor && a.state === 'chase');
    const running = m >= RUN_AT && !escort;
    const sp = (running ? this.runSpeed : this.walk * Math.min(1, m / 0.6)) * (game.world.def.speedMul || 1);
    const n = Math.hypot(vx, vy);
    this.step(game.world, vx / n * sp, vy / n * sp, dt);
    // 소음 반경(타일): 달리면 경비원이 듣는다
    this.noise = !this.lastMoved ? 0 : running ? 6.5 : 1.6;
    if (this.moving && game.audio) game.audio.footstep(this, running);
  }
}

// ---------------- 경비원 ----------------
// 상태: patrol(순찰) → investigate(소리 확인) → chase(추격) → search(놓친 곳 수색) → patrol
export class Janitor extends Actor {
  constructor(o) {
    super({ skin: 'janitor', rad: 0.3, patrolSpeed: 1.5, chaseSpeed: 3.25, view: 6.5, fov: 0.75, ...o });
    this.state = 'patrol';
    this.pi = 0;
    this.repath = 0;
    this.path = null;
    this.timer = 0;
    this.lookAng = 0;
    this.hitCool = 0;
    this.lastSeen = null;
  }

  get facing() {
    const [dx, dy] = DIRS[this.dir];
    return Math.atan2(dy, dx) + this.lookAng;
  }

  sees(game, p) {
    if (p.hidden) return false;
    const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
    if (d < 1.2) return game.world.los(this.x, this.y, p.x, p.y);
    // 라이터 불빛은 더 멀리, 더 넓게 눈에 띈다
    if (d > this.view + (game.lighter ? 3 : 0)) return false;
    let da = Math.atan2(dy, dx) - this.facing;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (Math.abs(da) > this.fov + (game.lighter ? 0.5 : 0)) return false;
    return game.world.los(this.x, this.y, p.x, p.y);
  }

  hears(game, p) {
    if (!p.noise || p.hidden) return false;
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    const r = game.world.los(this.x, this.y, p.x, p.y) ? p.noise : p.noise * 0.55;
    return d < r;
  }

  walkPath(game, tx, ty, speed, dt) {
    const w = game.world;
    this.repath -= dt;
    if (!this.path || this.repath <= 0) {
      w.pathDoors = true;
      this.path = w.path(this.x, this.y, tx, ty);
      w.pathDoors = false;
      this.repath = 0.45;
      if (this.path) this.path = this.path.map(([c, r]) => [c + 0.5, r + 0.5]);
    }
    if (!this.path) { this.moving = false; return null; } // 경로 없음(도착 아님)
    if (!this.path.length) {
      // 마지막 칸 중앙에 왔으면 목표 지점까지 곧장
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), s = speed * dt;
      if (d < 0.05) { this.moving = false; return true; }
      const k = Math.min(1, s / d);
      this.x += dx * k; this.y += dy * k; this.dir = dirOf(dx, dy);
      this.moving = true;
      this.walkT += Math.min(s, d) / STRIDE;
      return true;
    }
    const [px, py] = this.path[0];
    // 닫힌 문은 열고 지나간다
    const door = w.door(Math.floor(px), Math.floor(py));
    if (door && !door.open) { door.open = true; game.audio?.door(); }
    const dx = px - this.x, dy = py - this.y, d = Math.hypot(dx, dy);
    const s = speed * dt;
    if (d <= s) { this.x = px; this.y = py; this.path.shift(); }
    else { this.x += dx / d * s; this.y += dy / d * s; this.dir = dirOf(dx, dy); }
    this.moving = true;
    this.walkT += s / STRIDE;
    return this.path.length === 0;
  }

  update(dt, game) {
    if (this.followRoute(game.world, dt)) return;
    if (this.frozen || game.qaSafe) { this.moving = false; return; }
    const p = game.player;
    this.hitCool -= dt;
    const seen = this.sees(game, p);
    if (seen) {
      if (this.state !== 'chase') { game.onJanitorSpot?.(this); this.path = null; }
      this.state = 'chase';
      this.lastSeen = [p.x, p.y];
      this.timer = 0;
    } else if (this.state !== 'chase' && this.hears(game, p)) {
      this.state = 'investigate';
      this.lastSeen = [p.x, p.y];
      this.path = null;
    }

    switch (this.state) {
      case 'patrol': {
        const pts = this.patrol || [[this.x, this.y]];
        const [tx, ty] = pts[this.pi % pts.length];
        // 도착했거나(true) 갈 수 없는 지점(null)이면 다음 순찰 지점으로
        if (this.walkPath(game, tx, ty, this.patrolSpeed, dt) !== false) { this.pi++; this.path = null; this.state = 'pause'; this.timer = 1.2; }
        break;
      }
      case 'pause':
        this.moving = false;
        this.timer -= dt;
        this.lookAng = Math.sin(this.timer * 3) * 0.6;
        if (this.timer <= 0) { this.lookAng = 0; this.state = 'patrol'; }
        break;
      case 'investigate':
      case 'chase': {
        const chasing = this.state === 'chase';
        const [tx, ty] = this.lastSeen;
        const arrived = this.walkPath(game, tx, ty, chasing ? this.chaseSpeed : this.patrolSpeed * 1.25, dt);
        if (chasing && Math.hypot(p.x - this.x, p.y - this.y) < 0.62 && this.hitCool <= 0) {
          this.hitCool = 1.4;
          game.onJanitorHit?.(this);
        }
        // 경로를 못 찾으면 1.5초 버티다 수색으로 (문 닫고 숨기만으로 추격이 끊기지 않게)
        this.noPath = arrived === null ? (this.noPath || 0) + dt : 0;
        if (!seen && (arrived === true || this.noPath > 1.5)) { this.state = 'search'; this.timer = 4; this.path = null; this.noPath = 0; }
        break;
      }
      case 'search':
        this.moving = false;
        this.timer -= dt;
        this.lookAng = Math.sin(this.timer * 2.2) * 1.2;
        if (this.timer <= 0) { this.lookAng = 0; this.state = 'patrol'; this.path = null; }
        break;
    }
  }

  light() {
    return { x: this.x, y: this.y - 0.05, r: 6, ang: this.facing, spread: 0.42, color: '255,236,190', a: 0.85 };
  }
}

// 귀신: 기본은 스크립트 이동. chase=true면 플레이어를 직선으로 쫓는다(phase=true면 벽 통과).
// zone=[x0,y0,x1,y1]: 플레이어가 이 구역을 벗어나면 흐려지며 사라지고 onGone 스크립트를 실행한다.
// 한 번 닿으면 stun 동안 멈춰 도망칠 틈을 준다.
export class Ghost extends Actor {
  constructor(o) { super({ skin: 'ghost', rad: 0.3, speed: 1.6, chase: false, phase: true, glow: '200,220,255', stun: 0, ...o }); }
  update(dt, game) {
    if (this.followRoute(game.world, dt)) return;
    if (!this.chase) { this.moving = false; return; }
    const p = game.player;
    const z = this.zone;
    if (z && !(p.x >= z[0] && p.x <= z[2] && p.y >= z[1] && p.y <= z[3])) {
      this.moving = false;
      this.alpha -= dt * 1.5;
      if (this.alpha <= 0.05) { game.despawn(this.id); if (this.onGone) game.run(this.onGone); }
      return;
    }
    this.alpha = Math.min(1, this.alpha + dt);
    if (this.stun > 0) { this.stun -= dt; this.moving = false; return; }
    const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
    if (d < 0.5) { game.onGhostTouch?.(this); this.stun = 1.2; return; }
    const s = this.speed * dt;
    this.dir = dirOf(dx, dy);
    if (this.phase) { this.x += dx / d * s; this.y += dy / d * s; }
    else game.world.move(this, dx / d * s, dy / d * s, this.rad);
    this.moving = true;
    this.walkT += s / STRIDE;
  }
}

// 동행 히로인: 플레이어를 따라온다(닫힌 문은 열고 지나간 뒤 다시 닫음, 잠긴 문은 못 지나감). lead = 경유점이면 앞장서 걷고 플레이어가 처지면 기다린다.
// 짜증: 멀리 두고 감(6칸 넘게 3초, 수위 추격 중 제외 — 앞장서던 중이면 앞장서기를 그만둔다) / 몸으로 막고 밀침(0.6칸 안에 2.5초) / 앞장설 때 앞질러 감 → game.onFollowerUpset
export class Follower extends Actor {
  constructor(o) {
    super({ rad: 0.28, ...o });
    this.path = null;
    this.repath = 0;
    this.farT = 0;
    this.blockT = 0;
    this.passT = 0;
    this.cool = 3;
  }

  walk(game, tx, ty, speed, dt) {
    const w = game.world;
    this.repath -= dt;
    if (!this.path || this.repath <= 0) {
      w.pathDoors = 'unlocked';
      const p = w.path(this.x, this.y, tx, ty, 1200);
      w.pathDoors = false;
      this.path = p && p.map(([c, r]) => [c + 0.5, r + 0.5]);
      this.repath = 0.4;
      if (!p) return false;
    }
    if (!this.path.length) {
      // 마지막 칸 중앙에 왔으면 목표 지점까지 곧장
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy), s = speed * dt;
      if (d < 0.05) { this.moving = false; return true; }
      const k = Math.min(1, s / d);
      this.x += dx * k; this.y += dy * k; this.dir = dirOf(dx, dy);
      this.moving = true;
      this.walkT += Math.min(s, d) / STRIDE;
      return true;
    }
    const [px, py] = this.path[0];
    const door = w.door(Math.floor(px), Math.floor(py));
    if (door && !door.open) { game.setDoor(door.x, door.y, 'open'); game.audio?.door(); this.reclose = door; }
    const dx = px - this.x, dy = py - this.y, d = Math.hypot(dx, dy), s = speed * dt;
    if (d <= s) { this.x = px; this.y = py; this.path.shift(); }
    else { this.x += dx / d * s; this.y += dy / d * s; this.dir = dirOf(dx, dy); }
    this.moving = true;
    this.walkT += s / STRIDE;
    return true;
  }

  update(dt, game) {
    if (this.followRoute(game.world, dt)) return;
    const p = game.player;
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    this.cool -= dt;
    // 닫혀 있던 문을 열고 지나갔으면 다시 닫는다(교장실처럼 문을 닫아 둬야 하는 곳에서 열어 두지 않게)
    const rc = this.reclose;
    if (rc && Math.hypot(this.x - rc.x - 0.5, this.y - rc.y - 0.5) > 1.1) {
      this.reclose = null;
      const inDoor = [p, ...game.actors].some(a => a.x + a.rad > rc.x && a.x - a.rad < rc.x + 1 && a.y + a.rad > rc.y && a.y - a.rad < rc.y + 1);
      if (rc.open && !inDoor) { game.setDoor(rc.x, rc.y, 'closed'); game.audio?.door(); }
    }
    const upset = reason => {
      if (this.cool > 0) return;
      this.cool = 10;
      this.farT = this.blockT = this.passT = 0;
      game.onFollowerUpset?.(this, reason);
    };
    const chased = game.actors.some(a => a instanceof Janitor && a.state === 'chase');
    if (this.lead?.length) {
      // 앞장서기: 플레이어가 3.5칸 안에 있을 때만 걷는다
      const [tx, ty] = this.lead[0];
      if (d < 3.5 && this.walk(game, tx, ty, 1.9, dt) && Math.hypot(tx - this.x, ty - this.y) < 0.15) { this.lead.shift(); this.path = null; }
      else if (d >= 3.5) this.moving = false;
      if (!this.lead.length) { this.moving = false; game.onFollowerLead?.(this); return; }
      const [ex, ey] = this.lead[this.lead.length - 1];
      this.passT = Math.hypot(ex - p.x, ey - p.y) < Math.hypot(ex - this.x, ey - this.y) - 1.2 ? this.passT + dt : 0;
      this.farT = d > 6 && !chased ? this.farT + dt : 0;
      if (this.passT > 1.5) upset('pass');
      else if (this.farT > 3) {
        // 멀리 가 버리면 앞장서기를 그만두고(짜증) 다시 따라온다. 끝 스크립트는 짜증 대사 뒤에
        upset('far');
        if (this.onLead) game.laters.push({ t: 0.1, run: this.onLead });
        this.lead = null; this.onLead = null; this.path = null;
      }
      return;
    }
    if (!this.follow || p.hidden) { this.moving = false; return; }
    if (d > 1.4) {
      // 길이 없으면(잠긴 문 너머 등) 플레이어 뒤로 옮겨 붙는다
      // 멀어지면 달리는 플레이어보다 조금 빠르게(키보드·방향패드는 늘 달리기라 3.5로는 계속 처져 짜증이 났다)
      if (!this.walk(game, p.x, p.y, d > 4 ? Math.max(3.5, p.runSpeed * 1.15) : 2.6, dt)) game.placeFollower?.(this);
    } else { this.moving = false; this.path = null; }
    this.farT = d > 6 && !chased ? this.farT + dt : 0;
    this.blockT = d < 0.6 ? this.blockT + dt : Math.max(0, this.blockT - dt);
    if (this.farT > 3) upset('far');
    else if (this.blockT > 2.5) upset('block');
  }
}
