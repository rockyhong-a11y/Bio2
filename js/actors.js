// 캐릭터: 플레이어, NPC, 경비원(순찰→의심→추격→수색), 귀신(스크립트 제어)
// 스프라이트 키: `${skin}_${dir}_${frame}`  dir: down|up|left|right, frame 0=서기 1=왼발 2=오른발
import { TW, TH } from './world.js';

const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const WALK = [1, 0, 2, 0];
const STRIDE = 0.3; // 이 거리(타일)마다 걷기 프레임 1칸

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
    const running = input.run && m > 0.5;
    const sp = (running ? this.runSpeed : this.walk) * (running ? 1 : m) * (game.world.def.speedMul || 1);
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
    if (!this.path || !this.path.length) { this.moving = false; return true; }
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
        if (this.walkPath(game, tx, ty, this.patrolSpeed, dt)) { this.pi++; this.path = null; this.state = 'pause'; this.timer = 1.2; }
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
        if (!seen && arrived) { this.state = 'search'; this.timer = 4; this.path = null; }
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
