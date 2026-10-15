// 맵: ASCII 그리드 → 충돌/시야/렌더. 3/4 탑뷰 정사영 (블렌더 스프라이트와 동일 투영)
// 타일: 화면 가로 32px, 바닥 깊이 24px. 벽 스프라이트는 32x56(윗면 24 + 정면 32).

export const TW = 32;
export const TH = 24;
export const WALL_FRONT = 32;

// 그리드 문자
//  ' ' 빈 공간(밖)   '#' 벽   'W' 바깥 창문 벽   'w' 복도-교실 창문 벽   'D' 문(문 목록과 좌표 매칭)
//  '.' 복도 바닥    ',' 교실 마루   '_' 화장실 타일   ':' 현관 바닥   '=' 계단   '~' 환기구 철판
const WALLS = new Set(['#', 'W', 'w']);
const FLOOR_STYLE = { '.': 'corridor', ',': 'wood', '_': 'tile', ':': 'stone', '=': 'stairs', '~': 'metal' };

// 배경 디테일(도트 데칼): 바닥 얼룩·종이·금, 벽 금·얼룩. 칸 좌표로 정해지는 고정 배치라 다시 열어도 같은 자리
const FLOOR_DECALS = {
  corridor: ['decal_stain_0', 'decal_stain_1', 'decal_crack_0', 'decal_crack_1', 'decal_paper_0'],
  wood: ['decal_paper_0', 'decal_paper_1', 'decal_stain_1'],
  tile: ['decal_stain_0', 'decal_crack_1', 'decal_stain_1'],
  stone: ['decal_crack_0', 'decal_stain_0', 'decal_leaves'],
  metal: ['decal_stain_0', 'decal_stain_1'],
};
const WALL_DECALS = ['wall_crack', 'wall_stain'];
function rnd(c, r, k) {
  let h = Math.imul(c + 1, 374761393) ^ Math.imul(r + 1, 668265263) ^ Math.imul(k + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class World {
  constructor(def, state) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.rows = def.grid.length;
    this.cols = Math.max(...def.grid.map(r => r.length));
    this.cells = def.grid.map(r => r.padEnd(this.cols, ' '));
    this.doors = new Map();
    for (const d of def.doors || []) {
      const st = state.doorState(def.id, d);
      this.doors.set(d.x + ',' + d.y, { ...d, open: st.open, locked: st.locked });
    }
    this.state = state;
    this.refresh();
    this.makeDecals();
  }

  makeDecals() {
    const seed = [...this.id].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 100000;
    const propAt = new Set((this.def.props || []).flatMap(p => Array.from({ length: p.w || 1 }, (_, i) => `${p.x + i},${p.y}`)));
    this.decals = [];
    this.wallDecals = [];
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const ch = this.ch(c, r), st = FLOOR_STYLE[ch];
      if (st && FLOOR_DECALS[st] && rnd(c, r, seed) < 0.12) {
        const list = FLOOR_DECALS[st];
        this.decals.push({ s: list[Math.floor(rnd(c, r, seed + 1) * list.length)], x: c + rnd(c, r, seed + 2) * 0.55, y: r + 1 - rnd(c, r, seed + 3) * 0.45 });
      }
      // 벽 앞면이 보이는 칸(아래가 바닥)에만, 소품이 붙은 칸은 피한다
      if (ch === '#' && FLOOR_STYLE[this.ch(c, r + 1)] && !propAt.has(`${c},${r}`) && rnd(c, r, seed + 4) < 0.16) {
        this.wallDecals.push({ s: WALL_DECALS[Math.floor(rnd(c, r, seed + 5) * 2)], x: c + 0.15 + rnd(c, r, seed + 6) * 0.5, y: r + 1, lift: 8 + Math.floor(rnd(c, r, seed + 7) * 12) });
      }
    }
  }

  // 소품: when(state)로 표시 여부, s가 함수면 상태에 따라 스프라이트 변경, floor=true면 바닥 데칼
  refresh() {
    this.props = (this.def.props || []).filter(p => !p.when || p.when(this.state)).map(p => ({ w: 1, h: 1, ...p }));
    this.solidProps = new Set();
    for (const p of this.props) {
      if (!p.solid) continue;
      for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) this.solidProps.add((p.x + x) + ',' + (p.y + y));
    }
  }

  propSprite(p) { return typeof p.s === 'function' ? p.s(this.state) : p.s; }

  ch(c, r) { return (r < 0 || r >= this.rows || c < 0 || c >= this.cols) ? ' ' : this.cells[r][c]; }
  door(c, r) { return this.doors.get(c + ',' + r); }
  isWall(c, r) { return WALLS.has(this.ch(c, r)); }

  isSolid(c, r) {
    const ch = this.ch(c, r);
    if (ch === ' ' || WALLS.has(ch)) return true;
    if (ch === 'D') return !this.door(c, r)?.open;
    return this.solidProps.has(c + ',' + r);
  }

  // 시야/빛 차단 (소품은 빛을 막지 않음)
  isOpaque(c, r) {
    const ch = this.ch(c, r);
    if (ch === ' ' || WALLS.has(ch)) return true;
    if (ch === 'D') return !this.door(c, r)?.open;
    return false;
  }

  floorStyle(c, r) {
    const ch = this.ch(c, r);
    if (ch === 'D') return this.floorStyle(c, r + 1) || this.floorStyle(c, r - 1);
    return FLOOR_STYLE[ch] || null;
  }

  // 원(반지름 rad)과 고체 셀 충돌
  blocked(x, y, rad) {
    const c0 = Math.floor(x - rad), c1 = Math.floor(x + rad);
    const r0 = Math.floor(y - rad), r1 = Math.floor(y + rad);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (!this.isSolid(c, r)) continue;
      const nx = Math.max(c, Math.min(x, c + 1)), ny = Math.max(r, Math.min(y, r + 1));
      if ((x - nx) ** 2 + (y - ny) ** 2 < rad * rad) return true;
    }
    return false;
  }

  // 축 분리 이동(벽 따라 미끄러짐)
  move(a, dx, dy, rad) {
    if (dx && !this.blocked(a.x + dx, a.y, rad)) a.x += dx;
    if (dy && !this.blocked(a.x, a.y + dy, rad)) a.y += dy;
  }

  // 두 점 사이 시야 (DDA)
  los(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0, n = Math.ceil(Math.hypot(dx, dy) * 4);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (this.isOpaque(Math.floor(x0 + dx * t), Math.floor(y0 + dy * t))) return false;
    }
    return true;
  }

  // 광선: 불투명 셀에 닿는 거리와, 남쪽 면(정면이 보이는 면)에 닿았는지
  ray(x, y, ang, maxD) {
    const dx = Math.cos(ang), dy = Math.sin(ang);
    let c = Math.floor(x), r = Math.floor(y);
    const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
    const tdx = Math.abs(1 / dx), tdy = Math.abs(1 / dy);
    let tx = dx > 0 ? (c + 1 - x) * tdx : (x - c) * tdx;
    let ty = dy > 0 ? (r + 1 - y) * tdy : (y - r) * tdy;
    let d = 0, southFace = false;
    while (d < maxD) {
      if (tx < ty) { d = tx; tx += tdx; c += sx; southFace = false; }
      else { d = ty; ty += tdy; r += sy; southFace = sy < 0; }
      if (d >= maxD) break;
      if (this.isOpaque(c, r)) return { d, southFace };
    }
    return { d: maxD, southFace: false };
  }

  // A* (8방향, 모서리 끼임 금지). 반환: [[c,r], ...] (시작 제외)
  path(sx, sy, tx, ty, limit = 2400) {
    const c0 = Math.floor(sx), r0 = Math.floor(sy), c1 = Math.floor(tx), r1 = Math.floor(ty);
    if (this.isSolid(c1, r1) && !this.passableDoor(c1, r1)) return null;
    const key = (c, r) => r * this.cols + c;
    const open = [[c0, r0, 0, 0]];
    const g = new Map([[key(c0, r0), 0]]);
    const from = new Map();
    let n = 0;
    while (open.length && n++ < limit) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i][3] < open[bi][3]) bi = i;
      const [c, r, gc] = open.splice(bi, 1)[0];
      if (c === c1 && r === r1) {
        const out = [];
        let k = key(c, r);
        while (from.has(k)) { out.push([k % this.cols, Math.floor(k / this.cols)]); k = from.get(k); }
        return out.reverse();
      }
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dc && !dr) continue;
        const nc = c + dc, nr = r + dr;
        if (this.isSolid(nc, nr) && !this.passableDoor(nc, nr)) continue;
        if (dc && dr && (this.isSolid(c + dc, r) || this.isSolid(c, r + dr))) continue;
        const ng = gc + (dc && dr ? 1.414 : 1);
        const k = key(nc, nr);
        if (g.has(k) && g.get(k) <= ng) continue;
        g.set(k, ng); from.set(k, key(c, r));
        open.push([nc, nr, ng, ng + Math.hypot(c1 - nc, r1 - nr)]);
      }
    }
    return null;
  }

  // 경비원은 열쇠가 있어 닫힌 문도 통과 경로로 본다
  passableDoor(c, r) { return this.pathDoors && this.ch(c, r) === 'D'; }

  // ---------- 렌더 ----------
  wallSprite(c, r) {
    const ch = this.ch(c, r);
    const south = this.floorStyle(c, r + 1);
    if (!south) return 'wall_top';
    const st = { wood: 'wood', tile: 'tile', metal: 'vent' }[south] || 'corridor';
    if (st === 'vent') return 'wall_vent';
    if (ch === 'W') return 'wall_window_' + st;
    if (ch === 'w' && st !== 'tile') return 'wall_inner_window_' + st;
    return 'wall_' + st;
  }

  isVerticalDoor(c, r) { return this.isWall(c, r - 1) && this.isWall(c, r + 1); }

  // 세로 벽(남북으로 벽이 이어짐)에 낀 문은 위에서 본 모양(_v) 스프라이트를 쓴다
  doorSprite(c, r) {
    const d = this.door(c, r);
    const base = d.sprite || 'door';
    const v = this.isVerticalDoor(c, r) ? '_v' : '';
    if (d.open) return base + v + '_open';
    return base === 'door' && !v ? 'door_closed' : base + v;
  }

  collectDrawables(list, cam, sprites) {
    const c0 = Math.max(0, Math.floor(cam.x / TW) - 1), c1 = Math.min(this.cols - 1, Math.ceil((cam.x + cam.w) / TW) + 1);
    const r0 = Math.max(0, Math.floor(cam.y / TH) - 1), r1 = Math.min(this.rows - 1, Math.ceil((cam.y + cam.h + WALL_FRONT * 2) / TH) + 1);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const ch = this.ch(c, r);
      if (WALLS.has(ch)) list.push({ key: r + 1, k2: 0, s: this.wallSprite(c, r), x: c, y: r + 1 });
      else if (ch === 'D') {
        // 열린 세로 문은 바닥처럼 취급: 문 칸을 지나는 캐릭터보다 먼저 그린다
        const flat = this.isVerticalDoor(c, r) && this.door(c, r).open;
        list.push({ key: flat ? r + 0.01 : r + 1, k2: 0, s: this.doorSprite(c, r), x: c, y: r + 1 });
      }
    }
    for (const d of this.wallDecals) {
      if (d.x < c0 - 1 || d.x > c1 + 1 || d.y < r0 || d.y > r1 + 1) continue;
      list.push({ key: d.y, k2: 0.2, s: d.s, x: d.x, y: d.y, lift: d.lift });
    }
    for (const p of this.props) {
      if (p.floor || p.x + p.w < c0 || p.x > c1 + 1 || p.y + p.h < r0 || p.y > r1 + 3) continue;
      list.push({ key: p.y + p.h, k2: p.layer || 0.5, s: this.propSprite(p), x: p.x, y: p.y + p.h, lift: p.lift || 0 });
    }
  }

  drawFloor(ctx, cam, sprites) {
    const c0 = Math.max(0, Math.floor(cam.x / TW)), c1 = Math.min(this.cols - 1, Math.ceil((cam.x + cam.w) / TW));
    const r0 = Math.max(0, Math.floor(cam.y / TH)), r1 = Math.min(this.rows - 1, Math.ceil((cam.y + cam.h) / TH));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const st = this.floorStyle(c, r);
      if (!st || this.isWall(c, r)) continue;
      sprites.draw(ctx, 'floor_' + st, c * TW, (r + 1) * TH);
    }
    for (const d of this.decals) if (d.x >= c0 - 1 && d.x <= c1 + 1 && d.y >= r0 && d.y <= r1 + 1) sprites.draw(ctx, d.s, d.x * TW, d.y * TH);
    for (const p of this.props) if (p.floor) sprites.draw(ctx, this.propSprite(p), p.x * TW, (p.y + p.h) * TH);
  }
}
