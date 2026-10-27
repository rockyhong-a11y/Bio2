// 복셀 연출: 강제 연출 구간(s.cinema(true) ~ false) 동안 탑다운 화면 대신 그 순간을 복셀 3D로 세워 보여 준다.
//   · 장면은 지금 월드에서 바로 세운다 — 벽·바닥은 맵 격자에서, 인물은 기존 도트 스프라이트를 픽셀 단위로 밀어내서.
//     그래서 연출마다 따로 그려 둘 그림이 없고, 맵을 고치면 연출도 같이 따라온다.
//   · 저해상도 버퍼에 Z버퍼 소프트웨어 래스터라이저로 그린 뒤 최근접 확대한다.
//     비용이 장면 복잡도가 아니라 버퍼 해상도에 묶여서 저사양 기기에서도 상한이 예측된다.
//   · 공포는 카메라가 만든다 — 올려다보기·내려다보기·기울기·천천한 접근(PRESETS).
import { sprites } from './sprites.js';

// 내부 버퍼는 화면 픽셀의 1/BUF_DIV 로 잡고 화면과 같은 비율로 둔다. 도트 느낌은 남기되
// 인물과 배경이 구분될 만큼은 또렷하게 — 1/2 이면 한 복셀이 화면 2픽셀이다.
const BUF_DIV = 2;
const BUF_MIN = 256;          // 아주 느린 기기에서도 이 아래로는 안 내려간다
const BUF_MAX = 760;          // 이 위로는 더 올려도 눈에 띄지 않는다(화면 픽셀에 거의 닿는다)
const RANGE = 11;             // 플레이어 둘레 몇 칸까지 세울지
const WALL_H = 2.0;           // 벽 높이(타일 단위)
// 스프라이트를 몇 픽셀씩 묶어 한 복셀로 볼지. 크게 묶을수록 덩어리지고 면 수가 제곱으로 준다.
// 인물은 얼굴이 보여야 하니 잘게, 소품은 실루엣만 보이면 되니 굵게.
const STEP_CH = 1, STEP_PROP = 3;
const VS = 1 / 32;            // 스프라이트 1픽셀 = 1/32 타일(탑다운과 같은 비율)
const DEEP = 6;               // 판 두께(스프라이트 픽셀)
const FACE_MAX = 9000;        // 면 예산 — 넘으면 소품을 그만 세운다(먼 것부터 빠진다)
const NEAR = 0.08;
const NEAR_CUT = 0.95;        // 카메라에 이보다 가까운 것은 그리지 않는다 — 벽·소품 한 장이 화면을 덮는 걸 막는다
// 프리셋 방위가 벽에 막혔을 때 카메라가 둘러보는 각(도). 원하던 쪽부터, 점점 크게 좌우로
const SWING = [0, 22, -22, 45, -45, 70, -70, 95, -95, 125, -125, 155, -155, 180];
// 인물은 배경보다 밝게. 교복과 머리가 어두워 어두운 벽·바닥과 같은 밝기 대역에 들어가면
// 사람이 서 있는지조차 안 보인다 — 영화에서 인물에만 키라이트를 주는 것과 같다.
const ACT_LIFT = 1.5, ACT_FLOOR = 18;
const FOG0 = 6.5, FOG1 = 20;  // 이 거리부터 어둠에 묻힌다 — 복셀 격자가 끝나는 자리를 가려 준다
                              // (옥상처럼 벽이 없는 곳은 멀리까지 보여야 하고, 복도는 어차피 벽이 가린다)
const FOG_RGB = [5, 6, 12];
const SKY_RGB = [20, 26, 42]; // 화면 위쪽(하늘·천장 너머)은 아주 조금 밝게 — 옥상처럼 벽이 없는 곳이 통째로 검어지지 않게
const SHADE = [1, 0.4, 0.84, 0.66, 0.76, 0.56]; // 면 방향별 밝기: +Y(위) -Y +X -X +Z -Z
const FLOOR = { corridor: 0x4a4e5c, wood: 0x5e4a36, tile: 0x545868, stone: 0x4c4e54, stairs: 0x575245, metal: 0x434956, pool: 0x2d6a82, void: 0x08090e };
const HOSTILE = /ghost|janitor|eunmi|head|baby|mermaid|child|bonggu|dalsu|naying|hang|crawl/i;
// 방위: 0 = 북, 90 = 서, 180 = 남, 270 = 동 (카메라 yaw 와 같은 기준)
const DIR_AZ = { up: 0, left: 90, down: 180, right: 270 };
const AZ_DIR = ['up', 'left', 'down', 'right'];
// 탑다운 스프라이트는 '남쪽에서 본 그림'이다. 카메라가 다른 방위에 있으면 그 방위에서 봤을 때의 그림을 골라야 한다 —
// 세계를 돌려 카메라를 남쪽에 놓았다고 보고 인물의 방향을 같이 돌린다.
function seenDir(dir, camAz) {
  const q = (Math.round(camAz / 90) * 90 % 360 + 360) % 360;
  return AZ_DIR[((((DIR_AZ[dir] ?? 180) + 180 - q) % 360 + 360) % 360) / 90];
}

// 카메라 프리셋. d=대상까지 거리(타일), h=바닥에서 잰 카메라 높이(타일), yaw=대상을 도는 각(도),
// tilt=대상을 똑바로 본 각에 더 얹는 기울기(+면 더 올려다봄), roll=화면 기울기(도), fov=화각(도).
// 2 가 붙은 값은 구간이 끝날 때의 값이고 그 사이를 천천히 지나간다.
// 복셀은 정면(0도)·45도에서 격자가 평평해 보이므로 yaw 를 어중간한 각으로 둔다.
// ease = 구간을 지나가는 방식, hold = 움직이기 전에 멈춰 있는 몫(0~1), shake = 손떨림 배율,
// fov2 = 끝 화각(거리와 반대로 움직이면 돌리줌 — 배경만 늘어나 멀미 나는 그 느낌).
export const PRESETS = {
  // 발치에서 올려다보며 다가온다
  low:   { d: 3.0, d2: 1.7, h: 0.18, h2: 0.12, yaw: 34, yaw2: 24, tilt: 4, tilt2: 11, roll: 0, roll2: 5, fov: 64, fov2: 70, ease: 'out', shake: 1.2 },
  // 덮쳐 온다 — 거리는 줄고 화각은 넓어지는 돌리줌, 끝으로 갈수록 빨라진다
  loom:  { d: 3.8, d2: 1.1, h: 0.14, h2: 0.10, yaw: 20, yaw2: 8, tilt: 7, tilt2: 16, roll: -4, roll2: -13, fov: 70, fov2: 88, ease: 'in', shake: 2.2 },
  // 위에서 내려다보며 천천히 멀어진다 — 사람이 작아진다(그래도 알아볼 수 있을 만큼만)
  over:  { d: 3.4, d2: 4.6, h: 2.90, h2: 3.60, yaw: 20, yaw2: 40, tilt: 0, tilt2: -4, roll: 2, roll2: -2, fov: 56, fov2: 52, ease: 'smooth', shake: 0.6 },
  // 기울어진 화면 — 기울기가 점점 커지고 끝에서 살짝 지나쳤다 돌아온다
  dutch: { d: 3.4, d2: 2.5, h: 1.15, h2: 0.95, yaw: 56, yaw2: 38, tilt: 0, tilt2: 2, roll: 9, roll2: 22, fov: 60, fov2: 64, ease: 'swing', shake: 1.6 },
  // 멈춰 있다가 훅 다가간다
  push:  { d: 5.6, d2: 1.9, h: 1.05, h2: 0.95, yaw: 27, yaw2: 27, tilt: 0, tilt2: 1, roll: 0, roll2: 0, fov: 58, fov2: 54, ease: 'out', hold: 0.22, shake: 1 },
  // 대상 둘레를 크게 돈다(96도)
  arc:   { d: 3.6, d2: 3.0, h: 1.35, h2: 1.05, yaw: -34, yaw2: 62, tilt: 0, tilt2: 2, roll: -2, roll2: 3, fov: 60, fov2: 62, ease: 'smooth', shake: 1 },
  // 얼굴 가까이 파고든다
  close: { d: 2.0, d2: 1.15, h: 1.02, h2: 1.00, yaw: 44, yaw2: 26, tilt: 0, tilt2: -2, roll: -4, roll2: 6, fov: 50, fov2: 44, ease: 'out', shake: 1.4 },
  // 공간이 넓고 사람이 작다 — 조금씩 조여든다
  wide:  { d: 7.2, d2: 5.2, h: 2.50, h2: 1.90, yaw: 46, yaw2: 30, tilt: 0, tilt2: 1, roll: 0, roll2: 0, fov: 70, fov2: 62, ease: 'smooth', shake: 0.8 },
};
// 구간을 지나가는 방식. 전부 같은 smoothstep 이면 어느 컷이나 똑같은 속도로 미끄러져 밋밋하다.
const EASE = {
  smooth: u => u * u * (3 - 2 * u),              // 처음과 끝이 부드럽다
  in:     u => u * u * u,                        // 천천히 시작해 끝에서 덮친다
  out:    u => 1 - (1 - u) ** 3,                 // 빠르게 출발해 가라앉는다
  swing:  u => 1 - (1 - u) ** 3 + Math.sin(u * Math.PI) * 0.12, // 살짝 지나쳤다 돌아온다
};
const DEFAULT = 'push';

// 스프라이트 → 가로로 이어진 같은 색을 한 덩어리로 묶은 복셀 목록. 키마다 한 번만 만든다
const voxCache = new Map();
function voxelize(key, step) {
  const ck = key + '|' + step;
  if (voxCache.has(ck)) return voxCache.get(ck);
  const im = sprites.img[key], m = sprites.meta[key];
  if (!im || !m) { voxCache.set(ck, null); return null; }
  const k = sprites.scale * step;
  const w = Math.max(1, Math.round(m.w / k)), h = Math.max(1, Math.round(m.h / k));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.drawImage(im, 0, 0, w, h); // 브라우저가 평균을 내 준다 = 덩어리 색
  const d = c.getImageData(0, 0, w, h).data;
  const runs = [];
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 110) { x++; continue; }
      const col = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
      let n = 1;
      while (x + n < w) {
        const j = (y * w + x + n) * 4;
        if (d[j + 3] < 110 || ((d[j] << 16) | (d[j + 1] << 8) | d[j + 2]) !== col) break;
        n++;
      }
      runs.push([x, y, n, col]);
      x += n;
    }
  }
  // ax·ay = 스프라이트 앵커(탑다운에서 이 점이 칸 좌표에 놓인다)를 복셀 단위로
  const out = { w, h, ax: m.ax / k, ay: m.ay / k, vs: step * VS, runs };
  voxCache.set(ck, out);
  return out;
}

// 스프라이트 한 장을 월드 (bx, bz) 자리에 세운다. 판은 늘 카메라를 마주 보게 세운다(axis: 'x' = 가로가 X축).
//   앵커(ax, ay)는 탑다운에서 칸 좌표에 놓이는 점이다. 앵커보다 **아래**에 있는 픽셀은 키가 아니라
//   '보는 사람 쪽으로 퍼진 바닥'이다(바닥을 기는 귀신의 몸통·발밑 그림자) — 세우지 말고 바닥에 눕힌다.
function plate(self, F, key, bx, bz, axis, step, toward) {
  const v = voxelize(key, step);
  if (!v) return null;
  const vs = v.vs, deep = DEEP * VS;
  for (const [rx, ry, n, col] of v.runs) {
    const len = n * vs, off = (rx - v.ax) * vs, up = (v.ay - ry - 1) * vs;
    if (up >= 0) { // 앵커 위 — 세운다
      if (axis === 'x') self.box(F, bx + off, up, bz - deep / 2, len, vs, deep, col);
      else self.box(F, bx - deep / 2, up, bz + off, deep, vs, len, col);
    } else { // 앵커 아래 — 바닥에 눕혀 보는 사람 쪽으로 편다
      const away = -up;
      if (axis === 'x') self.box(F, bx + off, 0, bz + toward * away, len, vs * 0.6, vs, col);
      else self.box(F, bx + toward * away, 0, bz + off, vs, vs * 0.6, len, col);
    }
  }
  return v;
}

export class Voxel {
  constructor() {
    this.active = false;
    this.cv = document.createElement('canvas');
    this.c2 = this.cv.getContext('2d');
    this.faces = [];   // 벽·바닥(한 번만)
    this.act = [];     // 인물(연출 중에 움직이므로 다시 세운다)
    this.t = 0; this.actT = 0;
    this.len = 7;   // 카메라가 처음 값에서 끝 값까지 가는 데 걸리는 시간(초)
    this.shot = DEFAULT;
    this.scale = 1; // 버퍼 크기 배율 — 기기가 느리면 저절로 내려간다(draw 끝에서 재조정)
  }

  // on=true 면 지금 월드로 장면을 세우고 카메라를 건다.
  //   shot = PRESETS 의 이름(없으면 장면에서 고른다), at = [칸x, 칸y] 로 볼 대상을 직접 지정(소품이 주인공일 때)
  set(on, shot, g, at) {
    if (!on || !g?.world) { this.active = false; return; }
    this.shot = PRESETS[shot] ? shot : this.pick(g);
    this.at = at || null;
    this.build(g);
    this.buildActors(g);
    this.t = this.actT = 0;
    this.active = true;
  }

  // 프리셋을 안 주면: 쫓는 상대가 가까이 있으면 덮쳐 오게, 다른 인물이 있으면 기울여서, 아무도 없으면 다가간다
  pick(g) {
    const p = g.player;
    const near = g.actors.filter(a => a.visible && Math.hypot(a.x - p.x, a.y - p.y) < 7);
    if (!near.length) return DEFAULT;
    return near.some(a => a.chase || a.state === 'chase' || HOSTILE.test(a.skin || '')) ? 'loom' : 'dutch';
  }

  // ---------- 장면 세우기
  build(g) {
    this.aim(g); // 소품·문도 카메라 방위에 맞춰 세워야 한다
    const F = this.faces; F.length = 0; // 같은 배열을 다시 쓴다 — 프레임마다 새로 만들면 GC 가 는다
    const w = g.world, p = g.player;
    const c0 = Math.max(0, Math.round(p.x) - RANGE), c1 = Math.min(w.cols - 1, Math.round(p.x) + RANGE);
    const r0 = Math.max(0, Math.round(p.y) - RANGE), r1 = Math.min(w.rows - 1, Math.round(p.y) + RANGE);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      if (w.isWall(c, r)) {
        // 옆이 또 벽인 면은 어차피 안 보인다 — 면 수를 크게 줄인다
        let m = 1; // 윗면은 늘
        if (!w.isWall(c + 1, r)) m |= 4;
        if (!w.isWall(c - 1, r)) m |= 8;
        if (!w.isWall(c, r + 1)) m |= 16;
        if (!w.isWall(c, r - 1)) m |= 32;
        this.box(F, c, 0, r, 1, WALL_H, 1, this.mul(0x6e6e7a, 0.9 + ((c * 11 + r * 5) % 4) * 0.05), m);
        continue;
      }
      const st = w.floorStyle(c, r);
      if (!st) continue;
      // 바닥은 윗면 한 장만 — 칸마다 아주 조금 다른 밝기를 줘서 복셀 격자가 보이게
      const k = 0.86 + ((c * 7 + r * 13) % 5) * 0.06;
      this.quad(F, c, 0, r, c + 1, 0, r, c + 1, 0, r + 1, c, 0, r + 1, this.mul(FLOOR[st] ?? FLOOR.corridor, k), 0);
      if (w.ch(c, r) === 'D') { // 문짝: 세로 문은 판이 Z축을 따라 선다
        const d = w.door(c, r);
        if (d && !d.open) plate(this, F, w.doorSprite(c, r), w.isVerticalDoor(c, r) ? c + 0.5 : c, r + 1, w.isVerticalDoor(c, r) ? 'z' : 'x', STEP_PROP, this.toward);
      }
    }
    // 소품: 책상·사물함·자판기… 없으면 방이 빈 상자로 보인다. 앵커는 탑다운과 같은 (x, y+h)
    const near = [...w.props].filter(pr => !pr.floor && pr.x + pr.w >= c0 && pr.x <= c1 && pr.y + pr.h >= r0 && pr.y <= r1)
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); // 가까운 것부터
    for (const pr of near) {
      if (F.length > FACE_MAX) break;
      const key = w.propSprite(pr);
      if (key) plate(this, F, key, pr.x, pr.y + pr.h, this.axis, STEP_PROP, this.toward);
    }
    this.mapId = g.mapId;
    // 카메라는 점이 아니라 지름 0.8칸짜리 공이라고 보고 벽을 피한다 — 벽에 바싹 붙으면 벽면이 화면을 가득 채운다
    const R = 0.4;
    this.solid = (x, z) => w.isWall(Math.floor(x - R), Math.floor(z - R)) || w.isWall(Math.floor(x + R), Math.floor(z - R))
      || w.isWall(Math.floor(x - R), Math.floor(z + R)) || w.isWall(Math.floor(x + R), Math.floor(z + R));
  }

  // 대상·카메라 방위·판의 축을 정한다. 소품·문도 같은 축으로 세워야 하므로 월드를 세우기 전에 먼저 부른다
  aim(g) {
    const p = g.player;
    const near = g.actors.filter(a => a.visible && !a.hidden && a.alpha !== 0
      && Math.abs(a.x - p.x) <= RANGE && Math.abs(a.y - p.y) <= RANGE);
    const dist = a => Math.hypot(a.x - p.x, a.y - p.y);
    const hostile = near.filter(a => a.chase || a.state === 'chase' || HOSTILE.test(a.skin || ''));
    const star = (hostile.length ? hostile : near).sort((a, b) => dist(a) - dist(b))[0] || p;
    this.subject = [star.x, 0.95, star.y];
    this.baseYaw = star === p ? 180 // 혼자면 탑다운과 같은 남쪽에서
      : Math.atan2(star.x - p.x, star.y - p.y) * 180 / Math.PI; // 대상이 있으면 플레이어 어깨 너머로
    if (this.at) { // 소품이 주인공이면 그쪽을 보고, 카메라는 플레이어가 선 쪽에 둔다
      this.subject = [this.at[0], this.at[2] ?? 0.9, this.at[1]];
      this.baseYaw = Math.atan2(this.at[0] - p.x, this.at[1] - p.y) * 180 / Math.PI;
    }
    // 판은 **카메라가 실제로 서는 쪽**으로 세운다. 카메라는 baseYaw 가 아니라 프리셋 각만큼 돌아간 자리에 있으므로
    // (dutch 52° · wide 41° · close 38°) baseYaw 로 세우면 인물이 비스듬히 서서 얇은 조각처럼 보인다.
    const P = PRESETS[this.shot] || {};
    this.camAz = this.baseYaw + ((P.yaw || 0) + (P.yaw2 || 0)) / 2;
    const q = (Math.round(((this.camAz % 360) + 360) % 360 / 90) * 90) % 360;
    this.axis = q === 90 || q === 270 ? 'z' : 'x'; // 동·서에서 보면 판이 Z축을 따라 선다
    this.toward = q === 0 || q === 270 ? -1 : 1;  // 카메라가 북/동이면 -쪽이 '보는 사람 쪽'
    this.eye = [p.x, 0.6, p.y];
    return { near, star };
  }

  // 인물은 연출 중에 나타나고 움직이므로 따로, 자주 다시 세운다(벽·바닥은 그대로 둔다)
  buildActors(g) {
    const F = this.act; F.length = 0;
    const { near, star } = this.aim(g);
    for (const a of [...near, g.player]) this.actor(F, a, a === star);
  }

  actor(F, a, isStar) {
    const key = a.anim ? a.anim[0] : a.sprite || `${a.skin}_${seenDir(a.dir, this.camAz)}_0`;
    const v = plate(this, F, key, a.x, a.y, this.axis, STEP_CH, this.toward)
      || plate(this, F, `${a.skin}_down_0`, a.x, a.y, this.axis, STEP_CH, this.toward);
    if (isStar && v) this.subject = [a.x, Math.max(0.5, v.ay * v.vs * 0.72), a.y]; // 대상의 가슴께를 본다
  }

  mul(rgb, k) {
    const R = Math.min(255, ((rgb >> 16) & 255) * k) | 0, G = Math.min(255, ((rgb >> 8) & 255) * k) | 0, B = Math.min(255, (rgb & 255) * k) | 0;
    return (R << 16) | (G << 8) | B;
  }

  // 축에 나란한 상자 하나 → 면 6장(보이지 않는 면은 래스터라이저가 와인딩으로 걸러낸다)
  // m = 낼 면 비트(1 위 · 2 아래 · 4 +X · 8 -X · 16 +Z · 32 -Z). 기본은 아래를 뺀 전부
  box(F, x, y, z, sx, sy, sz, col, m = 61) {
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    const X = x + sx, Y = y + sy, Z = z + sz;
    if (m & 1) this.quad(F, x, Y, z, X, Y, z, X, Y, Z, x, Y, Z, col, 0);
    if (m & 2) this.quad(F, x, y, Z, X, y, Z, X, y, z, x, y, z, col, 1);
    if (m & 4) this.quad(F, X, y, z, X, Y, z, X, Y, Z, X, y, Z, col, 2);
    if (m & 8) this.quad(F, x, y, Z, x, Y, Z, x, Y, z, x, y, z, col, 3);
    if (m & 16) this.quad(F, X, y, Z, X, Y, Z, x, Y, Z, x, y, Z, col, 4);
    if (m & 32) this.quad(F, x, y, z, x, Y, z, X, Y, z, X, y, z, col, 5);
  }

  quad(F, ...v) { F.push(v); } // [x0,y0,z0, x1,y1,z1, x2,y2,z2, x3,y3,z3, col, 면방향]

  // ---------- 카메라
  // 위치는 대상 둘레의 (yaw, d, h) 로 잡고, 방향은 **대상을 똑바로 본 각 + 프리셋 기울기** 로 낸다.
  // 방향을 절대 각으로 두면 대상이 화면 밖으로 나간다(높은 각에서 천장만 보이는 식).
  camAt(u) {
    const P = PRESETS[this.shot], S = this.subject;
    if (P.hold) u = Math.max(0, (u - P.hold) / (1 - P.hold)); // 먼저 멈춰 있다가 움직인다
    const e = (EASE[P.ease] || EASE.smooth)(u);
    const L = (a, b) => a + (b - a) * e, D = Math.PI / 180;
    const d = L(P.d, P.d2), yaw = ((this.baseYaw || 0) + L(P.yaw, P.yaw2)) * D;
    let y = Math.max(0.08, L(P.h, P.h2)); // 바닥 아래로 내려가면 바닥 뒷면만 보인다
    let x = S[0] - Math.sin(yaw) * d, z = S[2] - Math.cos(yaw) * d;
    if (this.solid) {
      // 프리셋 방위가 벽에 막히면 먼저 **둘레를 돌아** 트인 쪽을 찾는다. 복도처럼 한 칸짜리 통로에서는
      // 물러설 수 있는 방향이 복도 축뿐이라, 이걸 안 하면 벽에 바싹 붙은 채 위로만 올라가 벽 윗면만 보인다.
      let best = null;
      for (const a of SWING) {
        const ya = yaw + a * D;
        let cx = S[0] - Math.sin(ya) * d, cz = S[2] - Math.cos(ya) * d;
        let k = this.clear(S, cx, y, cz);
        if (k < 1) { cx = S[0] + (cx - S[0]) * k; cz = S[2] + (cz - S[2]) * k; }
        if (y < WALL_H) for (let i = 0; i < 10 && this.solid(cx, cz); i++) { cx += (S[0] - cx) * 0.18; cz += (S[2] - cz) * 0.18; k *= 0.82; }
        if (!best || k > best.k + 0.02) best = { x: cx, z: cz, k };
        if (k > 0.98) break; // 원하던 방위가 트였으면 더 돌 것 없다
      }
      x = best.x; z = best.z;
      // 어느 쪽으로도 못 물러섰으면 그만큼 위로 올라가 내려다본다 — 벽이 막지 않는 유일한 방향이다
      if (y < WALL_H) y += (1 - Math.min(1, best.k)) * 2.8;
    }
    const base = Math.atan2(S[1] - y, Math.hypot(S[0] - x, S[2] - z));
    // 손떨림: 느린 숨결 + 빠른 미세 떨림. 조여드는 컷일수록 크게 흔들어 들고 찍는 느낌을 낸다
    const t = this.t, sh = P.shake ?? 1;
    const w = (Math.sin(t * 0.9) * 0.004 + Math.sin(t * 2.3) * 0.002
      + Math.sin(t * 7.1) * 0.0012 + Math.sin(t * 11.3) * 0.0008) * sh;
    return {
      x, y, z,
      yaw: Math.atan2(S[0] - x, S[2] - z) + w * 0.7,
      pitch: base + L(P.tilt, P.tilt2) * D + w,
      roll: L(P.roll, P.roll2) * D + w * 1.5,
      fov: L(P.fov, P.fov2 ?? P.fov) * D,
    };
  }

  // 대상에서 카메라까지 벽에 막히지 않고 갈 수 있는 비율(1 = 끝까지 보인다).
  // 벽은 WALL_H 까지만 있으므로 가시선이 그보다 위로 지나는 구간은 막지 못한다 — 높은 카메라가 괜히 당겨지지 않게.
  clear(S, x, y, z) {
    const n = Math.max(1, Math.ceil(Math.hypot(x - S[0], z - S[2]) * 5));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (S[1] + (y - S[1]) * t >= WALL_H) break;
      if (this.solid(S[0] + (x - S[0]) * t, S[2] + (z - S[2]) * t)) return Math.max(0.25, (i - 1) / n * 0.9);
    }
    return 1;
  }

  // ---------- 그리기
  draw(main, g, dt) {
    this.t += dt || 0;
    this.actT += dt || 0;
    if (g.mapId !== this.mapId) { this.build(g); this.buildActors(g); this.actT = 0; } // 연출 중 맵이 바뀌면 다시 세운다
    else if (this.actT > 0.1) { this.buildActors(g); this.actT = 0; }                  // 10Hz — 연출 중 움직임은 느리다
    const W = main.canvas.width, H = main.canvas.height;
    // 버퍼는 **화면과 같은 비율**이어야 한다. 가로만 정하고 세로를 따로 묶으면(예전 상한 160)
    // 세로 화면에서 1.6:1 그림을 0.59:1 로 늘려 그리게 돼 인물이 세로로 네 배 뭉개졌다.
    const bw = Math.max(BUF_MIN, Math.min(BUF_MAX, Math.round(W / BUF_DIV * this.scale)));
    const bh = Math.max(96, Math.round(bw * H / W));
    if (this.cv.width !== bw || this.cv.height !== bh) {
      this.cv.width = bw; this.cv.height = bh;
      this.img = this.c2.createImageData(bw, bh);
      this.u32 = new Uint32Array(this.img.data.buffer); // 배경을 한 줄씩 fill 로 깐다
      this.z = new Float32Array(bw * bh);
    }
    const t0 = performance.now();
    this.render(this.camAt(Math.max(0, Math.min(1, this.t / this.len))), bw, bh, g);
    // 느린 기기 보호: 그리는 데 오래 걸리면 버퍼를 줄이고, 여유가 있으면 천천히 되돌린다
    this.ms = this.ms ? this.ms * 0.8 + (performance.now() - t0) * 0.2 : performance.now() - t0;
    if (this.ms > 20) this.scale = Math.max(0.45, this.scale * 0.9);
    else if (this.ms < 8) this.scale = Math.min(1, this.scale * 1.02);
    this.c2.putImageData(this.img, 0, 0);
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.imageSmoothingEnabled = false;
    main.drawImage(this.cv, 0, 0, W, H);
    const ov = g.world?.def.overlay?.(g); // 탑다운과 같은 전면 색(미궁이 하얗게 바래는 연출) — 연출 중에도 이어져야 한다
    if (ov) { main.fillStyle = ov; main.fillRect(0, 0, W, H); }
    g.view = { px: W / bw, ox: 0, oy: 0 }; // 그래픽 필터가 픽셀 격자를 맞추는 데 쓴다
  }

  render(cam, W, H, g) {
    const px = this.img.data, zb = this.z, u32 = this.u32;
    // 배경: 위에서 아래로 아주 옅은 기울기(하늘 → 안개). 평평한 검정보다 공간이 느껴진다.
    // 색이 y 에만 달렸으므로 한 줄을 통째로 fill 한다 — 픽셀마다 네 번 쓰는 것보다 훨씬 싸다
    for (let y = 0; y < H; y++) {
      const t = 1 - y / H;
      const r = FOG_RGB[0] + (SKY_RGB[0] - FOG_RGB[0]) * t | 0,
        g2 = FOG_RGB[1] + (SKY_RGB[1] - FOG_RGB[1]) * t | 0,
        b = FOG_RGB[2] + (SKY_RGB[2] - FOG_RGB[2]) * t | 0;
      u32.fill((255 << 24 | b << 16 | g2 << 8 | r) >>> 0, y * W, y * W + W); // 리틀엔디언 ABGR
    }
    zb.fill(0);
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const cr = Math.cos(cam.roll), sr = Math.sin(cam.roll);
    const f = (H / 2) / Math.tan(cam.fov / 2), hw = W / 2, hh = H / 2;
    const lit = g?.lighter ? 1 : 0.45, lx = this.eye[0], lz = this.eye[2];
    const X4 = this.X4 ??= new Float64Array(4), Y4 = this.Y4 ??= new Float64Array(4), Z4 = this.Z4 ??= new Float64Array(4);
    for (const L of this.lists ??= [this.faces, this.act]) {
    const act = L === this.act; // 인물은 배경보다 밝게 세운다(아래 ACT_LIFT 설명)
    for (const q of L) {
      let ok = true;
      for (let i = 0; i < 4; i++) {
        const dx = q[i * 3] - cam.x, dy = q[i * 3 + 1] - cam.y, dz = q[i * 3 + 2] - cam.z;
        const rx = dx * cy - dz * sy, rz0 = dx * sy + dz * cy;
        const ry = dy * cp - rz0 * sp, rz = dy * sp + rz0 * cp;
        // 카메라 코앞의 면은 통째로 버린다(3인칭 카메라의 흔한 처리) — 벽·소품 한 장이 화면을 덮는 걸 막고,
        // 안개가 짙어 사라진 티가 나지 않는다. 한 귀퉁이만 가까워도 버려야 커다란 판이 안 남는다
        if (rz <= NEAR_CUT) { ok = false; break; }
        X4[i] = hw + (rx * cr - ry * sr) * f / rz;
        Y4[i] = hh - (rx * sr + ry * cr) * f / rz;
        Z4[i] = 1 / rz;
      }
      if (!ok) continue;
      if ((X4[1] - X4[0]) * (Y4[2] - Y4[0]) - (X4[2] - X4[0]) * (Y4[1] - Y4[0]) <= 0) continue; // 뒷면
      // 면 밝기: 방향 + 플레이어 쪽 빛 웅덩이
      const dl = Math.hypot((q[0] + q[6]) / 2 - lx, (q[2] + q[8]) / 2 - lz);
      const k = SHADE[q[13]] * (0.68 + lit * Math.max(0, 1 - dl / 7)) * (act ? ACT_LIFT : 1);
      const col = q[12], base = act ? ACT_FLOOR : 0; // 검은 머리·교복도 실루엣이 남게 바닥값을 준다
      const R = Math.min(255, base + ((col >> 16) & 255) * k), G = Math.min(255, base + ((col >> 8) & 255) * k), B = Math.min(255, base + (col & 255) * k);
      this.tri(px, zb, W, H, X4, Y4, Z4, 0, 1, 2, R, G, B);
      this.tri(px, zb, W, H, X4, Y4, Z4, 0, 2, 3, R, G, B);
    }
    }
  }

  tri(px, zb, W, H, X, Y, Z, a, b, c, R, G, B) {
    const x0 = X[a], y0 = Y[a], x1 = X[b], y1 = Y[b], x2 = X[c], y2 = Y[c];
    const lo = Math.max(0, Math.floor(Math.min(x0, x1, x2))), hi = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2)));
    const to = Math.max(0, Math.floor(Math.min(y0, y1, y2))), bo = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
    if (lo > hi || to > bo) return;
    const d = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (d === 0) return;
    const inv = 1 / d, z0 = Z[a], z1 = Z[b], z2 = Z[c];
    // 무게중심 좌표는 x·y 의 1차식이다 — 픽셀마다 다시 곱하지 않고 한 칸씩 더해 간다(고해상도에서 이게 대부분의 비용이다)
    const dx0 = (y1 - y2) * inv, dy0 = (x2 - x1) * inv;
    const dx1 = (y2 - y0) * inv, dy1 = (x0 - x2) * inv;
    const px0 = lo + 0.5, py0 = to + 0.5;
    let r0 = ((x1 - px0) * (y2 - py0) - (x2 - px0) * (y1 - py0)) * inv;
    let r1 = ((x2 - px0) * (y0 - py0) - (x0 - px0) * (y2 - py0)) * inv;
    for (let y = to; y <= bo; y++, r0 += dy0, r1 += dy1) {
      let w0 = r0, w1 = r1;
      const row = y * W;
      for (let x = lo; x <= hi; x++, w0 += dx0, w1 += dx1) {
        if (w0 < 0 || w1 < 0) continue;
        const w2 = 1 - w0 - w1;
        if (w2 < 0) continue;
        const iz = w0 * z0 + w1 * z1 + w2 * z2;
        const i = row + x;
        if (iz <= zb[i]) continue;
        zb[i] = iz;
        // 거리 안개 — 복셀 격자가 끝나는 자리를 어둠이 가린다
        const dist = 1 / iz;
        const t = dist <= FOG0 ? 0 : dist >= FOG1 ? 1 : (dist - FOG0) / (FOG1 - FOG0);
        const n = 1 - t, j = i * 4;
        px[j] = R * n + FOG_RGB[0] * t;
        px[j + 1] = G * n + FOG_RGB[1] * t;
        px[j + 2] = B * n + FOG_RGB[2] * t;
      }
    }
  }
}
