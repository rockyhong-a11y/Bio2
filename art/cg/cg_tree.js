// cg_tree — 2학년 8반 교실, 밤. 눈높이 카메라가 교실 뒤쪽에서 칠판(앞) 쪽을 비스듬히 본다(왼쪽 벽에 창문).
// 나무 마루를 뚫고 검붉은 가시 뿌리들이 솟아 책상·의자를 넘어뜨리고, 나뭇조각과 먼지가 튄다.
// 굵은 뿌리 하나가 바닥 높이에서 소영의 발목을 잡아 칠판 쪽 어둠으로 팽팽히 당긴다. 소영(art/chars/soyoung.js 초상화)은
// 아직 선 채 뒤로 휘청이며 허리를 틀어 이쪽을 보고, 눈을 크게 뜬 채 한 손을 뻗는다. 넘어진 책상이 그녀의 무릎 아래를 가리고,
// 팽팽한 뿌리는 그 책상 뒤에서 뻗어 나간다. 뿌리는 바닥과 가구 둘레에만 있고 그녀의 다리·몸을 타고 오르지 않으며 교복은 단정하다.
// 바로 앞에는 뒷모습의 희민(art/chars/heemin.js 와 같은 머리·교복): 한 팔을 그녀 쪽으로 뻗고, 다른 손에서 분홍 일기장과
// 리본 맨 사탕 상자가 떨어진다. 옆 창으로 차가운 달빛이 비스듬히 들고, 바닥 틈에서만 흐린 검붉은 빛이 샌다.
import * as K from '../kit.js';
import { figure as soyoungFigure, defs as soyoungDefs } from '../chars/soyoung.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'tr';
const EINK = '#06070b';

// ---------------------------------------------------------------- 카메라(눈높이, 왼쪽 앞으로 조금 돌림)
const CAMP = [0.55, 1.5, 0], YAW = 14 * Math.PI / 180, PITCH = -4.5 * Math.PI / 180, FOC = 1300, C0 = [512, 540];
const FWD = [-Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH)];
const RGT = [Math.cos(YAW), 0, Math.sin(YAW)];
const UP = [FWD[1] * RGT[2] - FWD[2] * RGT[1], FWD[2] * RGT[0] - FWD[0] * RGT[2], FWD[0] * RGT[1] - FWD[1] * RGT[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const depth = p => dot(sub(p, CAMP), FWD);
function pr(p) {
  const d = sub(p, CAMP), z = Math.max(0.05, dot(d, FWD));
  return [C0[0] + FOC * dot(d, RGT) / z, C0[1] - FOC * dot(d, UP) / z];
}
// 카메라 기준 위치(가로 lat m, 깊이 dep m) → 바닥 위 세계 좌표
const onFloor = (lat, dep) => { const p = add(add(CAMP, mul(RGT, lat)), mul(FWD, dep)); return [p[0], 0, p[2]]; };
const poly3 = pts => 'M' + pts.map(p => pt(pr(p))).join(' L') + ' Z';
const line3 = pts => 'M' + pts.map(p => pt(pr(p))).join(' L');

// ---------------------------------------------------------------- 색
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');
// 달빛 방향(빛이 나아가는 방향): 왼쪽 창에서 방 안쪽(+x)·아래·조금 앞쪽으로
const MOON = (() => { const v = [1, -0.62, 0.32]; const l = Math.hypot(...v); return v.map(x => x / l); })();

// ---------------------------------------------------------------- 방(세계 좌표 m): 창쪽 벽 x=XL, 복도쪽 벽 x=XR, 칠판 벽 z=ZF, 천장 y=YC
const XL = -3.3, XR = 4.6, ZF = 8.6, ZB = -2, YC = 3.0;
const WINS = [[-1.0, 0.9], [1.3, 3.2], [3.6, 5.5], [5.9, 7.8]]; // 창 z 범위
const WY0 = 0.95, WY1 = 2.75;
function room() {
  let s = '';
  s += P(poly3([[XL, YC, ZB], [XR, YC, ZB], [XR, YC, ZF], [XL, YC, ZF]]), '#0d0f17', EINK, 3); // 천장
  s += P(poly3([[XL, 0, ZB], [XL, 0, ZF], [XL, YC, ZF], [XL, YC, ZB]]), '#161a28', EINK, 3); // 창쪽 벽
  s += P(poly3([[XL, 0, ZF], [XR, 0, ZF], [XR, YC, ZF], [XL, YC, ZF]]), '#1b2030', EINK, 3); // 칠판 벽
  s += P(poly3([[XR, 0, ZB], [XR, 0, ZF], [XR, YC, ZF], [XR, YC, ZB]]), '#141826', EINK, 3); // 복도쪽 벽
  s += P(poly3([[XL, 0, ZB], [XR, 0, ZB], [XR, 0, ZF], [XL, 0, ZF]]), '#2a2630', EINK, 3); // 마루
  // 마루 널 이음(앞뒤로 긴 널)
  let g = '';
  for (let x = XL + 0.18; x < XR; x += 0.18) g += line3([[x, 0, 0.6], [x, 0, ZF]]) + ' ';
  s += `<g clip-path="url(#${ID}floorC)">` + P(g, 'none', '#1a171e', 2) + '</g>';
  // 걸레받이
  s += P(line3([[XL, 0.1, ZB], [XL, 0.1, ZF]]) + ' ' + line3([[XL, 0.1, ZF], [XR, 0.1, ZF]]), 'none', '#0b0c12', 4);
  // 창: 바깥 밤하늘 → 창틀(알루미늄, 달빛 받아 밝음)
  for (const [z0, z1] of WINS) {
    s += P(poly3([[XL, WY0, z0], [XL, WY0, z1], [XL, WY1, z1], [XL, WY1, z0]]), `url(#${ID}sky)`, EINK, 3);
    const zm = (z0 + z1) / 2, ym = WY0 + (WY1 - WY0) * 0.62;
    s += P(line3([[XL, WY0, zm], [XL, WY1, zm]]) + ' ' + line3([[XL, ym, z0], [XL, ym, z1]]), 'none', '#8e98ae', 7);
    s += P(line3([[XL, WY0, z0], [XL, WY0, z1], [XL, WY1, z1], [XL, WY1, z0], [XL, WY0, z0]]), 'none', '#a3adc2', 8);
    s += P(line3([[XL + 0.08, WY0 - 0.03, z0], [XL + 0.08, WY0 - 0.03, z1]]), 'none', '#5f6880', 6); // 창턱
  }
  // 칠판(짙은 녹색) + 나무 테두리 + 분필 받침, 그 앞 교단·교탁
  const bx0 = -2.4, bx1 = 2.4, by0 = 0.95, by1 = 2.15, bz = ZF - 0.02;
  s += P(poly3([[bx0 - 0.07, by0 - 0.07, bz], [bx1 + 0.07, by0 - 0.07, bz], [bx1 + 0.07, by1 + 0.07, bz], [bx0 - 0.07, by1 + 0.07, bz]]), '#3d3128', EINK, 3);
  s += P(poly3([[bx0, by0, bz], [bx1, by0, bz], [bx1, by1, bz], [bx0, by1, bz]]), '#1f362f', EINK, 2.5);
  s += P(poly3([[bx0 + 0.3, by0 + 0.5, bz], [bx0 + 1.6, by0 + 0.7, bz], [bx0 + 1.5, by0 + 0.9, bz], [bx0 + 0.2, by0 + 0.6, bz]]), '#2f4a42', 'none', 0, 'opacity="0.6"'); // 지우개 자국
  s += P(poly3([[bx0, by0 - 0.02, bz], [bx1, by0 - 0.02, bz], [bx1, by0 - 0.02, bz - 0.08], [bx0, by0 - 0.02, bz - 0.08]]), '#4a3b30', EINK, 2);
  s += P(poly3([[XL, 0.2, ZF - 1.1], [XR, 0.2, ZF - 1.1], [XR, 0.2, ZF], [XL, 0.2, ZF]]), '#2d2830', EINK, 2.5); // 교단 윗면
  s += P(poly3([[XL, 0, ZF - 1.1], [XR, 0, ZF - 1.1], [XR, 0.2, ZF - 1.1], [XL, 0.2, ZF - 1.1]]), '#211d24', EINK, 2.5); // 교단 앞면
  s += solidBox([0.95, 0.2, ZF - 0.62], [0.32, 0.95, 0.22], 0, 0, 0, WOOD2);  // 교탁
  // 천장 형광등(꺼짐)
  for (const z of [1.5, 4.2, 6.9]) for (const x of [-1.5, 1.6]) s += P(poly3([[x - 0.6, YC - 0.01, z - 0.08], [x + 0.6, YC - 0.01, z - 0.08], [x + 0.6, YC - 0.01, z + 0.08], [x - 0.6, YC - 0.01, z + 0.08]]), '#22262f', EINK, 2);
  return s;
}

// ---------------------------------------------------------------- 단단한 상자(회전 가능), 면마다 달빛 명암
// c: 바닥 중심(세계), size: [가로, 높이, 깊이], 회전: ry(세로축) → rx(가로축으로 넘어짐) → rz(옆으로 넘어짐), 피벗은 바닥 중심
const WOOD = { lit: '#76665a', base: '#4a3e3b', shade: '#272127', line: EINK };
const WOOD2 = { lit: '#6e5c4e', base: '#463a36', shade: '#262027', line: EINK };
const STEEL = { lit: '#5a647c', base: '#383f52', shade: '#1f232f', line: EINK };
function rot(p, rx, ry, rz) {
  let [x, y, z] = p;
  if (rz) { const c = Math.cos(rz), s = Math.sin(rz); [x, y] = [x * c - y * s, x * s + y * c]; }
  if (rx) { const c = Math.cos(rx), s = Math.sin(rx); [y, z] = [y * c - z * s, y * s + z * c]; }
  if (ry) { const c = Math.cos(ry), s = Math.sin(ry); [x, z] = [x * c + z * s, -x * s + z * c]; }
  return [x, y, z];
}
// 지역 좌표 상자(min, max) → 면 목록(깊이와 함께)
function boxFaces(min, max, xf, col) {
  const v = [];
  for (const x of [min[0], max[0]]) for (const y of [min[1], max[1]]) for (const z of [min[2], max[2]]) v.push(xf([x, y, z]));
  // v 인덱스: x*4 + y*2 + z
  const F = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
  const out = [];
  const cen = mul(v.reduce((a, b) => add(a, b), [0, 0, 0]), 1 / 8);
  for (const f of F) {
    const q = f.map(i => v[i]);
    const fc = mul(q.reduce((a, b) => add(a, b), [0, 0, 0]), 0.25);
    let n = sub(fc, cen); const nl = Math.hypot(...n) || 1; n = mul(n, 1 / nl);
    if (dot(n, sub(CAMP, fc)) <= 0) continue; // 뒷면
    const lit = -dot(n, MOON);
    const fill = lit > 0.35 ? mix(col.base, col.lit, Math.min(1, (lit - 0.35) / 0.4 + 0.5)) : lit > -0.1 ? col.base : col.shade;
    out.push({ d: depth(fc), s: P(poly3(q), fill, col.line, 2.2) });
  }
  return out;
}
const placeXf = (c, rx, ry, rz, sh = [0, 0, 0]) => p => add(c, rot(add(p, sh), rx, ry, rz));
function solidBox(c, size, rx, ry, rz, col) {
  const [w, h, d] = size;
  return boxFaces([-w / 2, 0, -d / 2], [w / 2, h, d / 2], placeXf(c, rx, ry, rz), col).sort((a, b) => b.d - a.d).map(f => f.s).join('');
}
// 여러 부품(지역 상자)으로 된 물건: 부품 면을 모두 모아 먼 것부터
function assembly(parts, c, rx, ry, rz, sh) {
  const xf = placeXf(c, rx, ry, rz, sh);
  const faces = [];
  for (const [min, max, col] of parts) faces.push(...boxFaces(min, max, xf, col));
  return faces.sort((a, b) => b.d - a.d).map(f => f.s).join('');
}
// 학생 책상(나무 상판 + 쇠 책받침 + 쇠다리 넷 + 발 가로대). 지역: 바닥 중심, 앞(칠판 쪽) = +z
const DESK = (() => {
  const L = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.push([[sx * 0.28 - 0.016, 0, sz * 0.19 - 0.016], [sx * 0.28 + 0.016, 0.69, sz * 0.19 + 0.016], STEEL]);
  L.push([[-0.28, 0.1, 0.17], [0.28, 0.13, 0.2], STEEL]);
  L.push([[-0.29, 0.56, -0.2], [0.29, 0.69, 0.21], STEEL]);
  L.push([[-0.31, 0.69, -0.225], [0.31, 0.725, 0.225], WOOD]);
  return L;
})();
// 소영 앞 넘어진 책상: 뿌리 그늘 속이라 더 어둡게
const DESK_DARK = DESK.map(([a, b, c]) => [a, b, c === WOOD ? { lit: '#5a4c44', base: '#3a302e', shade: '#211c21', line: EINK } : { lit: '#465068', base: '#2c3242', shade: '#191c26', line: EINK }]);
const CHAIR = (() => {
  const L = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) L.push([[sx * 0.17 - 0.014, 0, sz * 0.16 - 0.014], [sx * 0.17 + 0.014, 0.42, sz * 0.16 + 0.014], STEEL]);
  for (const sx of [-1, 1]) L.push([[sx * 0.17 - 0.014, 0.42, -0.174], [sx * 0.17 + 0.014, 0.8, -0.146], STEEL]);
  L.push([[-0.19, 0.42, -0.18], [0.19, 0.445, 0.18], WOOD]);
  L.push([[-0.18, 0.56, -0.19], [0.18, 0.78, -0.17], WOOD]);
  return L;
})();
const desk = (x, z, ry = 0, rx = 0, rz = 0, dy = 0) => ({ d: depth([x, 0.4, z]), s: assembly(DESK, [x, dy, z], rx, ry, rz) });
const chair = (x, z, ry = 0, rx = 0, rz = 0, dy = 0) => ({ d: depth([x, 0.3, z]), s: assembly(CHAIR, [x, dy, z], rx, ry, rz) });

// ---------------------------------------------------------------- 책상 배치(두 개씩 붙인 줄, 뿌리가 솟은 곳은 넘어지고 밀림)
// 넘어진 책상: 옆으로 눕힘(side) / 한쪽이 들려 기움(tilt)
const W = (lat, dep, h = 0) => add(onFloor(lat, dep), [0, h, 0]);
const camRel = (x, z) => { const d = sub([x, 0, z], [CAMP[0], 0, CAMP[2]]); return [dot(d, RGT), dot(d, FWD)]; };
const BURSTS = [[-1.6, 3.75], [0.5, 6.7]]; // 뿌리가 솟은 자리(카메라 기준 lat, dep): 창 쪽, 칠판 앞
function furniture() {
  const list = [];
  const cols = [-2.55, -1.9, -0.7, -0.05, 1.15, 1.8, 3.0, 3.65];
  const rows = [1.2, 2.3, 3.4, 4.5, 5.6, 6.7];
  let n = 0;
  for (const x of cols) for (const z of rows) {
    const [lat, dep] = camRel(x, z);
    // 비울 곳: 카메라 바로 앞, 소영 둘레, 희민 둘레, 발목 뿌리가 칠판 앞까지 팽팽히 뻗은 길(뿌리에 쓸려 밀려남)
    if (dep < 1.8 || (lat > -0.75 && lat < 0.25 && dep < 3.3) || (lat > 0 && dep < 2.3)) continue;
    if (dep < 6.5 && lat > -0.15 && lat < 1.0) continue;
    const j = Math.sin(x * 7.1 + z * 3.3) * 0.05; // 조금씩 흐트러짐
    const near = BURSTS.some(([bl, bd]) => Math.hypot(lat - bl, dep - bd) < 0.85);
    n++;
    if (near) {
      const sgn = n % 2 ? 1 : -1;
      if (n % 3 === 0) list.push({ d: depth([x, 0.4, z]), s: assembly(DESK, [x + 0.1 * sgn, 0.31, z], 0.1 * sgn, j * 6 + 0.5 * sgn, sgn * Math.PI / 2) });
      else list.push({ d: depth([x, 0.4, z]), s: assembly(DESK, [x, 0.06, z], 0.15 * sgn, j * 4 + 0.3 * sgn, sgn * 0.42) });
      list.push(chair(x - 0.25 * sgn, z - 0.55, 0.9 * sgn, 0, sgn * 1.45, 0.17));
    } else list.push(desk(x + j, z, j * 1.5), chair(x - j, z - 0.5, -j * 2));
  }
  // 공중으로 튕겨 오른 의자 하나(뿌리 A 위)
  const fc = W(-1.95, 3.2, 0.95);
  list.push({ d: depth(fc), s: assembly(CHAIR, fc, 1.1, 0.6, 0.7) });
  return list;
}

// ---------------------------------------------------------------- 뿌리
const lerp = (a, b, t) => a + (b - a) * t;
// Catmull-Rom 곡선으로 3D 점들을 부드럽게 잇기
function spline(pts, n = 48) {
  const P4 = [pts[0], ...pts, pts[pts.length - 1]], out = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) * (pts.length - 1), k = Math.min(Math.floor(u), pts.length - 2), t = u - k;
    const [p0, p1, p2, p3] = [P4[k], P4[k + 1], P4[k + 2], P4[k + 3]];
    out.push([0, 1, 2].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t * t * t)));
  }
  return out;
}
const ROOT = { base: '#2e1513', shade: '#150808', lit: '#5e3026', line: '#070202' };
// 굵은 가시 뿌리: 3D 점들(pts), 반지름 r0 → r1(m), 가시 간격·길이
function root(pts, r0, r1, { thorns = 9, seed = 1, n = 56 } = {}) {
  const S = spline(pts, n);
  const scr = S.map(pr), rad = S.map((p, i) => { const t = i / (n - 1); return FOC * lerp(r0, r1, t) * (1 + 0.16 * Math.sin(t * 19 + seed * 2.1) + 0.09 * Math.sin(t * 47 + seed)) / depth(p); });
  const L = [], R = [], Ls = [], Lh = [];
  for (let i = 0; i < n; i++) {
    const a = scr[Math.max(0, i - 1)], b = scr[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = -ty, ny = tx, r = rad[i];
    L.push([scr[i][0] + nx * r, scr[i][1] + ny * r]); R.push([scr[i][0] - nx * r, scr[i][1] - ny * r]);
    // 그늘은 달빛 반대쪽(화면 오른쪽 아래)으로 치우친 띠
    const side = (nx * 0.8 + ny * 0.6) > 0 ? 1 : -1;
    Ls.push([scr[i][0] + side * nx * r * 0.15, scr[i][1] + side * ny * r * 0.15, side]);
    Lh.push([scr[i][0] - side * nx * r * 0.55, scr[i][1] - side * ny * r * 0.55]);
  }
  const body = 'M' + [...L, ...R.reverse()].map(pt).join(' L') + ' Z';
  R.reverse();
  // 그늘 띠: 중심선 조금 바깥 ~ 그늘쪽 가장자리
  const shadeSide = Ls.map((q, i) => q[2] > 0 ? L[i] : R[i]);
  const shade = 'M' + [...Ls.map(q => [q[0], q[1]]), ...shadeSide.reverse()].map(pt).join(' L') + ' Z';
  let thornS = '';
  let rnd = seed * 9301 + 49297;
  const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  for (let k = 0; k < thorns; k++) {
    const i = Math.floor(n * (0.08 + 0.84 * (k + rand() * 0.6) / thorns)), sd = (k + seed) % 2 ? 1 : -1;
    const E = sd > 0 ? L[i] : R[i], C = scr[i], r = rad[i];
    const nx = (E[0] - C[0]) / (r || 1), ny = (E[1] - C[1]) / (r || 1);
    const a = scr[Math.max(0, i - 1)], b = scr[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const len = r * (0.7 + rand() * 0.5) + 4, w = Math.max(2.5, r * 0.28);
    const tip = [E[0] + nx * len + tx * len * 0.35, E[1] + ny * len + ty * len * 0.35];
    thornS += `M${pt([E[0] - tx * w - nx * 2, E[1] - ty * w - ny * 2])} Q${pt([E[0] + nx * len * 0.5, E[1] + ny * len * 0.5])} ${pt(tip)} L${pt([E[0] + tx * w - nx * 2, E[1] + ty * w - ny * 2])} Z `;
  }
  // 나무껍질 결: 중심선을 따라 짧은 획
  let bark = '';
  for (let i = 4; i < n - 4; i += 5) {
    const j = i + 2, o = (i % 3 - 1) * 0.35;
    const p0 = [lerp(scr[i][0], L[i][0], o), lerp(scr[i][1], L[i][1], o)], p1 = [lerp(scr[j][0], L[j][0], o), lerp(scr[j][1], L[j][1], o)];
    bark += `M${pt(p0)} L${pt(p1)} `;
  }
  return P(thornS, ROOT.base, ROOT.line, 2.5) +
    P(body, ROOT.base, ROOT.line, 3.5) +
    P(shade, ROOT.shade, 'none', 0, 'opacity="0.85"') +
    P('M' + Lh.map(pt).join(' L'), 'none', ROOT.lit, Math.max(2, Math.min(6, rad[n >> 1] * 0.18)), `opacity="0.85" stroke-dasharray="${f1(rad[n >> 1] * 1.6)} ${f1(rad[n >> 1] * 0.7)} ${f1(rad[n >> 1] * 0.9)} ${f1(rad[n >> 1] * 0.5)}"`) +
    P(bark, 'none', ROOT.line, 2, 'opacity="0.55"') +
    P(body, 'none', ROOT.line, 3.5);
}
// 바닥이 갈라진 자리: 들뜬 널 조각 + 들쭉날쭉한 틈 + 틈에서 새는 흐린 검붉은 빛
function crack(c, rx, rz, seed = 1, ang = 0) {
  let rnd = seed * 7919;
  const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  const pts = [];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const a = ang + 2 * Math.PI * i / N, k = i % 2 ? 0.55 + rand() * 0.25 : 1 + rand() * 0.25;
    pts.push([c[0] + Math.cos(a) * rx * k, 0.002, c[2] + Math.sin(a) * rz * k]);
  }
  const sc = pr(c), w = FOC * rx / depth(c);
  let s = `<ellipse cx="${f1(sc[0])}" cy="${f1(sc[1])}" rx="${f1(w * 1.9)}" ry="${f1(w * 0.6)}" fill="#8e1a22" opacity="0.32" filter="url(#${ID}b12)"/>`;
  s += P(poly3(pts), '#050203', ROOT.line, 2.5);
  s += `<ellipse cx="${f1(sc[0])}" cy="${f1(sc[1] + 2)}" rx="${f1(w * 0.7)}" ry="${f1(w * 0.16)}" fill="#a3242c" opacity="0.55" filter="url(#${ID}b4)"/>`;
  // 들뜬 널 조각(깨진 마루판이 비스듬히 솟음)
  for (let k = 0; k < 3; k++) {
    const a = ang + k * 2.1 + rand(), d = Math.max(rx, rz) * (0.9 + rand() * 0.3);
    const b = [c[0] + Math.cos(a) * d, 0, c[2] + Math.sin(a) * d * 0.8];
    const len = 0.2 + rand() * 0.14, lift = 0.06 + rand() * 0.08, wd = 0.06;
    const dir = [Math.cos(a + 1.57) * wd, 0, Math.sin(a + 1.57) * wd];
    const tipP = [b[0] + Math.cos(a) * len * 0.6, lift, b[2] + Math.sin(a) * len * 0.6];
    const q = [sub(b, dir), add(b, dir), add(tipP, dir), sub(tipP, dir)];
    s += P(poly3(q), '#4b3e3c', EINK, 2.2) + P(line3([q[2], q[3]]), 'none', '#9a8c84', 2.5, 'opacity="0.7"');
  }
  return s;
}

// 솟아오른 뿌리들(바닥과 가구 둘레에만)
const ROOTS = [
  { pts: [W(-2.0, 3.25, -0.12), W(-1.95, 3.38, 0.55), W(-1.82, 3.58, 1.12), W(-1.6, 3.92, 1.02), W(-1.47, 4.15, 0.45), W(-1.44, 4.35, -0.12)], r0: 0.19, r1: 0.12, seed: 4, thorns: 14 },
  { pts: [W(-1.64, 3.65, 1.0), W(-1.85, 3.75, 1.38), W(-2.1, 3.85, 1.42), W(-2.24, 3.9, 1.22)], r0: 0.07, r1: 0.025, seed: 7, thorns: 5 },
  { pts: [W(0.78, 6.45, -0.12), W(0.74, 6.6, 0.5), W(0.55, 6.85, 0.85), W(0.3, 7.05, 0.75), W(0.12, 7.2, 0.3), W(0.06, 7.28, -0.12)], r0: 0.17, r1: 0.09, seed: 5, thorns: 10 },
];
const ROOT_HOLE = [W(0.74, 6.42), 0.36, 0.26, 4]; // 발목 뿌리와 칠판 앞 뿌리가 솟은 틈(발목 뿌리 끝이 틈 속으로 들어가게 뿌리 위에 다시 그림)
const CRACKS = [[W(-2.0, 3.25), 0.3, 0.24, 1], [W(-1.44, 4.35), 0.24, 0.2, 2], ROOT_HOLE, [W(0.06, 7.28), 0.2, 0.15, 5]];
const midDepth = pts => depth(pts[Math.floor(pts.length / 2)]);
// 튀는 나뭇조각(마루 파편)과 먼지
function debris() {
  let rnd = 4242;
  const rand = () => (rnd = (rnd * 9301 + 49297) % 233280) / 233280;
  let s = '', dust = '';
  for (const [bl, bd, cnt] of [[-1.75, 3.5, 9], [-0.75, 2.5, 6], [0.62, 6.3, 6], [0.05, 1.95, 4]]) {
    for (let i = 0; i < cnt; i++) {
      const c = W(bl + (rand() - 0.5) * 1.1, bd + (rand() - 0.5) * 0.6, 0.15 + rand() * 1.1);
      const sc = pr(c), k = FOC / depth(c);
      if (sc[0] > 170 && sc[0] < 480 && sc[1] > 330 && sc[1] < 1010) { rand(); rand(); rand(); continue; } // 소영 몸 위에는 겹치지 않게
      const len = (0.04 + rand() * 0.06) * k, wd = Math.max(2, 0.01 * k), a = rand() * 180;
      s += `<path d="M${f1(-len / 2)} ${f1(-wd)} L${f1(len / 2)} 0 L${f1(-len / 2)} ${f1(wd)} Z" transform="translate(${pt(sc)}) rotate(${f1(a)})" fill="${rand() > 0.5 ? '#8b7461' : '#5d4c42'}" stroke="${EINK}" stroke-width="1.5"/>`;
    }
    for (let i = 0; i < 4; i++) {
      const c = W(bl + (rand() - 0.5) * 0.9, bd + (rand() - 0.5) * 0.4, 0.1 + rand() * 0.35), sc = pr(c), k = FOC / depth(c);
      dust += `<ellipse cx="${f1(sc[0])}" cy="${f1(sc[1])}" rx="${f1(0.22 * k)}" ry="${f1(0.1 * k)}" fill="#8f96a8"/>`;
    }
  }
  return `<g opacity="0.16" filter="url(#${ID}b12)">${dust}</g>` + s;
}
// 옆 창으로 드는 달빛: 바닥에 비친 창 모양 + 공기 중의 흐린 빛줄기
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
const toFloor = p => { const t = p[1] / -MOON[1]; return [p[0] + MOON[0] * t, 0, p[2] + MOON[2] * t]; };
function moonlight() {
  let patches = '', shafts = '', bars = '';
  for (const [z0, z1] of WINS) {
    const win = [[XL, WY0, z0], [XL, WY0, z1], [XL, WY1, z1], [XL, WY1, z0]], fl = win.map(toFloor);
    patches += poly3(fl) + ' ';
    // 창살 그림자(가운데 세로·가로 창살)
    const zm = (z0 + z1) / 2, ym = WY0 + (WY1 - WY0) * 0.62;
    bars += line3([toFloor([XL, WY0, zm]), toFloor([XL, WY1, zm])]) + ' ' + line3([toFloor([XL, ym, z0]), toFloor([XL, ym, z1])]) + ' ';
    shafts += `<path d="M${hull([...win, ...fl].map(pr)).map(pt).join(' L')} Z"/>`;
  }
  return `<g clip-path="url(#${ID}floorC)" style="mix-blend-mode:screen"><path d="${patches}" fill="#6f86b8" opacity="0.32" filter="url(#${ID}b4)"/>` +
    `<path d="${bars}" stroke="#000" stroke-width="16" opacity="0.5" fill="none"/></g>` +
    `<g fill="#9fb6e6" opacity="0.13" style="mix-blend-mode:screen" filter="url(#${ID}b12)">${shafts}</g>`;
}

// ---------------------------------------------------------------- 소영(초상화 그림 + 아랫몸 + 뻗은 팔)
// 초상화 좌표 1단위 = 1/2117 m(머리 길이 487단위 ≈ 0.23 m). 정수리 226 ↔ 키 1.62 m, 발바닥 ↔ 3656
const UPM = 2117;
const SO = { lat: -0.2, dep: 2.05, lean: -11 };
const SO_FOOT = onFloor(SO.lat, SO.dep);
const SO_FACE = { eye: { open: 1.16, iris: 0.62, tilt: -8 }, brow: { dy: -18, inner: -14 }, mouth: 'o', blush: 0.12 };
const SO_HAIR = { base: '#1c2134', shade: '#0e111c', hi: '#5a6a98', line: '#06070d' };
const SO_SKIN = { base: '#fbece4', shade: '#e9cfc5', line: '#9a6a62' };
const NAVY = K.NAVY, SHIRT = K.SHIRT;
const SKIRT = { base: '#41485e', shade: '#272c3e', dark: '#20263d', band: '#7d86a0', line: '#0d1226' };
const mirrorX = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f1(1024 - x)} ${y}`);
// 손가락: 먹선(굵게) → 피부(가늘게)
const fingers = (list, skin, w = 17) => list.map(f => P(f, 'none', skin.line, w)).join('') + list.map(f => P(f, 'none', skin.base, w - 6.5)).join('');
function soLower() {
  let s = '';
  // 치마와 다리: 발목이 칠판 쪽으로 끌려 무릎 아래가 그림 왼쪽으로 쏠림(치마 자락도 따라 기울어짐)
  // 다리(넘어진 책상 뒤에 가려짐) — 무릎 아래는 그리지만 보이지 않음
  s += P('M420 2560 C414 2900 418 3300 426 3560 L496 3560 C500 3300 506 2900 506 2560 Z', SO_SKIN.base, SO_SKIN.line, 4);
  s += P('M520 2560 C522 2900 530 3300 536 3560 L604 3560 C612 3300 612 2900 606 2560 Z', SO_SKIN.shade, SO_SKIN.line, 4);
  s += `<g transform="translate(512 1640) skewX(-5) translate(-512 -1640)">`;
  // 치마(남색·회색 체크 주름치마, 무릎 길이)
  const sk = 'M318 1640 L706 1640 C736 1900 772 2240 800 2590 Q690 2650 500 2646 Q320 2644 206 2600 C240 2250 282 1900 318 1640 Z';
  s += P(sk, SKIRT.base, SKIRT.line, 4);
  s += `<g clip-path="url(#${ID}skC)">`;
  s += P('M640 1640 C680 1900 720 2250 760 2620 L820 2620 L740 1640 Z', SKIRT.shade, 'none', 0, 'opacity="0.9"');
  // 남색·회색 체크: 굵은 남색 띠(가로·세로, 겹친 곳이 더 진함). 가는 밝은 선은 비쳐 보이는 느낌이 나서 넣지 않음
  const vBands = 'M372 1640 C350 1980 326 2300 300 2650 M512 1640 L506 2650 M652 1640 C680 1980 706 2300 734 2650';
  const hBands = 'M260 1900 C420 1924 610 1924 760 1900 M232 2260 C410 2290 620 2290 784 2260';
  s += P(vBands + ' ' + hBands, 'none', SKIRT.dark, 30, 'opacity="0.55"');
  s += P('M318 1640 C282 1900 240 2250 206 2600 L262 2620 C292 2250 330 1900 360 1640 Z', SKIRT.shade, 'none', 0, 'opacity="0.55"'); // 왼쪽 옆면 그늘(입체감)
  for (const [x0, x1] of [[350, 290], [430, 390], [512, 500], [590, 610], [668, 720]]) s += P(`M${x0} 1700 L${x1} 2630`, 'none', SKIRT.line, 3, 'opacity="0.6"'); // 주름
  s += '</g>';
  s += P('M206 2600 Q320 2644 500 2646 Q690 2650 800 2590', 'none', SKIRT.line, 4);
  s += '</g>';
  // 블레이저 아랫단(엉덩이까지, 앞자락은 둘째 단추 아래로 둥글게 벌어짐)
  s += P('M318 1500 L316 1660 C360 1700 440 1714 500 1708 C504 1640 508 1590 512 1550 L512 1500 Z', NAVY.base, NAVY.line, 4);
  s += P('M512 1500 L512 1550 C518 1590 522 1640 526 1708 C600 1714 680 1696 714 1668 L716 1500 Z', NAVY.base, NAVY.line, 4);
  s += P('M512 1533 L512 1550', 'none', NAVY.line, 3.5);
  return s;
}
// 균형을 잃고 그림 왼쪽 뒤로 뻗친 오른팔(그림 왼쪽): 몸통 왼쪽 윤곽이 드러나고 손을 펼침
function soArmL() {
  let s = '';
  s += P('M318 940 C306 1100 296 1300 288 1520 L318 1520 Z', SO_HAIR.base, SO_HAIR.line, 3);
  s += P('M318 946 C318 1120 318 1330 318 1533', 'none', NAVY.line, 4);
  s += P('M314 868 C272 876 242 904 224 952 C202 1030 178 1130 156 1244 L232 1268 C248 1168 270 1072 294 992 C304 962 314 942 320 930 Z', NAVY.base, NAVY.line, 4);
  s += P('M232 1268 C248 1168 270 1072 294 992 C304 962 314 942 320 930 L320 990 C300 1050 278 1150 262 1272 Z', NAVY.shade, 'none', 0, 'opacity="0.85"');
  s += P('M300 880 C266 892 244 918 230 960', 'none', NAVY.light, 6, 'opacity="0.55"');
  s += P('M156 1244 L232 1268 L226 1298 L148 1274 Z', SHIRT.base, SHIRT.line, 3);
  const F = ['M170 1300 C156 1330 146 1360 140 1388', 'M190 1308 C184 1342 180 1372 180 1400', 'M208 1306 C210 1338 214 1366 220 1392', 'M150 1284 C130 1300 116 1318 106 1338'];
  s += fingers(F, SO_SKIN, 20);
  s += P('M150 1278 C146 1300 152 1322 170 1330 C190 1338 214 1330 222 1310 L226 1296 Z', SO_SKIN.base, SO_SKIN.line, 3.5);
  return s;
}
const SO_DRAPE_L = K.path('M358 640 C346 760 336 880 326 1000 C316 1120 306 1230 302 1352 L324 1316 L336 1370 L352 1300 C362 1180 374 1060 386 950 C396 850 400 740 394 650 Z', SO_HAIR.base, SO_HAIR.line, 4) +
  K.path('M372 700 C362 860 346 1040 330 1250', 'none', SO_HAIR.hi, 3, 'opacity="0.45"');
// 이쪽(보는 사람 쪽)으로 뻗은 왼팔(그림 오른쪽): 앞으로 내밀어 짧아 보이고 가까워질수록 굵어짐, 손바닥이 이쪽을 향해 손가락을 펼침
function soArm() {
  let s = '';
  // 몸통 오른쪽 윤곽(팔이 들려 드러남) + 그 뒤로 보이는 긴 뒷머리
  s += P('M712 930 C722 1100 732 1300 738 1520 L712 1520 Z', SO_HAIR.base, SO_HAIR.line, 3);
  s += P('M712 936 C714 1120 716 1330 716 1533', 'none', NAVY.line, 4);
  // 소매(어깨 → 앞으로 내민 손목): 손목 쪽이 더 굵음
  const sleeve = 'M716 856 C770 858 830 890 878 936 C906 962 924 996 930 1030 L842 1112 C808 1092 776 1060 752 1030 C730 1000 718 966 716 930 Z';
  s += P(sleeve, NAVY.base, NAVY.line, 4);
  s += P('M716 930 C718 966 730 1000 752 1030 C776 1060 808 1092 842 1112 L860 1094 C826 1070 794 1040 772 1010 C752 984 738 956 732 924 Z', NAVY.shade, 'none', 0, 'opacity="0.9"');
  s += P('M734 866 C784 872 836 900 874 940', 'none', NAVY.light, 6, 'opacity="0.6"');
  s += P('M790 920 Q800 960 784 1000', 'none', NAVY.line, 3, 'opacity="0.6"'); // 소매 주름
  // 소맷부리(이쪽을 향해 열린 타원) + 셔츠 소매
  s += `<ellipse cx="888" cy="1070" rx="58" ry="40" transform="rotate(-42 888 1070)" fill="${SHIRT.base}" stroke="${SHIRT.line}" stroke-width="3.5"/>`;
  // 손: 손바닥이 이쪽, 손가락을 펼쳐 뻗음(가까워 큼)
  const F = ['M956 1050 C982 1034 1008 1026 1034 1028', 'M966 1072 C996 1062 1024 1060 1050 1066', 'M966 1096 C994 1094 1020 1098 1042 1108', 'M956 1120 C976 1126 994 1134 1008 1146'];
  const TH = 'M898 1052 C902 1024 912 1002 928 986';
  s += fingers([...F, TH], SO_SKIN, 27);
  s += P('M888 1046 C912 1030 948 1034 966 1056 C980 1084 978 1118 960 1136 C936 1150 902 1146 884 1128 C870 1104 872 1066 888 1046 Z', SO_SKIN.base, SO_SKIN.line, 4);
  s += P('M896 1086 Q922 1096 952 1084 M902 1114 Q926 1120 948 1110', 'none', SO_SKIN.line, 2.2, 'opacity="0.55"'); // 손금
  s += P('M888 1126 C906 1142 934 1146 958 1134', 'none', SO_SKIN.shade, 7, 'opacity="0.8"');
  return s;
}
// 끌려가는 반동으로 그림 오른쪽으로 흩날리는 긴 뒷머리 몇 가닥(몸 뒤)
const SO_HAIR_SWING =
  K.path('M700 760 C760 860 818 990 866 1150 L842 1128 L840 1186 L812 1110 C780 990 732 880 688 800 Z', SO_HAIR.base, SO_HAIR.line, 4) +
  K.path('M716 1000 C770 1110 812 1240 838 1380 L816 1350 L808 1404 L790 1340 C770 1230 736 1120 704 1040 Z', SO_HAIR.shade, SO_HAIR.line, 4) +
  K.path('M712 820 C762 910 806 1010 846 1120', 'none', SO_HAIR.hi, 3, 'opacity="0.45"');
// 소영 오른쪽 옆머리 커튼(art/chars/soyoung.js 의 drapes 오른쪽과 같은 모양) — 팔 위로 다시 얹음
const SO_DRAPE_R = K.path('M666 640 C680 760 692 880 702 1000 C712 1120 722 1230 728 1352 L706 1316 L694 1370 L676 1300 C664 1180 652 1060 640 950 C630 850 626 740 632 650 Z', SO_HAIR.shade, SO_HAIR.line, 4) +
  K.path('M690 720 C700 900 712 1080 716 1260', 'none', SO_HAIR.hi, 3, 'opacity="0.45"');
function soyoung() {
  const foot = pr(SO_FOOT), k = FOC / depth(SO_FOOT) / UPM;
  const fig = soyoungFigure(SO_FACE, `${ID}s`).replace('rx="12" ry="16" fill="#6c2330"', 'rx="15" ry="21" fill="#6c2330"');
  const inner =
    `<clipPath id="${ID}skC"><path d="M318 1640 L706 1640 C736 1900 772 2240 800 2590 Q690 2650 500 2646 Q320 2644 206 2600 C240 2250 282 1900 318 1640 Z"/></clipPath>` +
    `<clipPath id="${ID}soB"><path d="M0 0 L1024 0 L1024 930 L712 930 L712 1533 L318 1533 L318 940 L0 940 Z"/></clipPath>` +
    SO_HAIR_SWING + soLower() + `<g clip-path="url(#${ID}soB)">${fig}</g>` + soArmL() + soArm() + SO_DRAPE_R + SO_DRAPE_L;
  return `<g id="${ID}so" transform="translate(${f1(foot[0])} ${f1(foot[1])}) rotate(${SO.lean}) scale(${k.toFixed(4)}) translate(-512 -3656)">${inner}</g>`;
}

// 소영 앞에 옆으로 넘어져 선 책상(상판이 이쪽을 향함): 무릎 아래를 가림
function toppledDesk() {
  const c = onFloor(SO.lat + 0.02, SO.dep - 0.26);
  // 상판을 원점으로 옮긴 뒤 옆으로 눕혀(상판이 세로로 서서 이쪽을 비스듬히 봄) 다리는 소영 쪽으로 뻗게, 솟은 뿌리에 걸려 조금 들림
  const args = [[c[0], 0.38, c[2]], 0.1, -Math.PI / 2 - YAW + 0.42, Math.PI / 2 + 0.12, [0, -0.72, 0]];
  const xf = placeXf(...args);
  let s = assembly(DESK_DARK, ...args);
  // 상판 나뭇결 · 긁힌 자국 · 달빛 받은 윗모서리
  let g = '';
  for (const [z, w] of [[-0.16, 0.02], [-0.07, -0.015], [0.05, 0.02], [0.15, -0.01]]) g += line3([xf([-0.29, 0.727, z]), xf([-0.05, 0.727, z + w]), xf([0.2, 0.727, z - w]), xf([0.29, 0.727, z])]) + ' ';
  s += P(g, 'none', '#1c1619', 2.5, 'opacity="0.7"');
  s += P(line3([xf([-0.1, 0.727, -0.12]), xf([0.08, 0.727, -0.02])]), 'none', '#6a5a52', 2, 'opacity="0.7"');
  s += P(line3([xf([0.305, 0.727, -0.22]), xf([0.305, 0.727, 0.22])]), 'none', '#8fa2c8', 3.5, 'opacity="0.85"');
  return s;
}
// 발목을 잡은 뿌리: 넘어진 책상 뒤(발목)에서 나와 칠판 앞 바닥 틈(뿌리가 솟은 자리)까지 거의 곧게, 바닥에서 살짝 떠 팽팽하게
const ANKLE_ROOT = [add(SO_FOOT, [0.02, 0.09, 0.05]), W(0.05, 2.35, 0.1), W(0.3, 3.2, 0.13), W(0.45, 4.3, 0.12), W(0.6, 5.5, 0.07), W(0.74, 6.42, -0.02)];

// ---------------------------------------------------------------- 희민 뒷모습(art/chars/heemin.js 와 같은 머리색·머리 모양·교복)
// 지역 좌표: 초상화와 같은 단위(1/2117 m), 정수리 (512, 214), 바닥 = 214 + 1.74 m
const BOY = { lat: 0.38, dep: 1.36 };
const BOY_FOOT = onFloor(BOY.lat, BOY.dep);
const HM_HAIR = { base: '#212027', shade: '#111015', hi: '#6a6878', line: '#050507' };
const HM_SKIN = { base: '#fae7d9', shade: '#e9c9b6', line: '#9a6a5c' };
const SLACK = { base: '#3d3f49', shade: '#2a2c34', line: '#0e0f14' };
const PINK = { base: '#ee9cb6', shade: '#c97391', light: '#fbd0dd', line: '#6e2c45' };
const BOX = { base: '#cdd6f0', shade: '#9ea9d0', top: '#e6ebfa', line: '#38406a' };
const RIB = { base: '#d2384c', shade: '#97202f', hi: '#f28c99', line: '#4b0c14' };
function boyBack() {
  let s = '';
  // 다리(바지) — 화면 아래로 잘림. 왼발을 그녀 쪽으로 내디딤
  s += P('M296 1760 C286 2200 276 2700 266 3300 L470 3300 C480 2800 496 2300 512 1860 Z', SLACK.base, SLACK.line, 4);
  s += P('M512 1860 C516 2300 524 2800 530 3300 L720 3300 C728 2800 734 2200 728 1760 Z', SLACK.shade, SLACK.line, 4);
  s += P('M512 1880 L512 2600', 'none', SLACK.line, 3, 'opacity="0.5"');
  // 오른팔(그림 오른쪽): 팔꿈치를 살짝 굽혀 내려뜨린 채, 막 손을 놓쳐 손가락이 벌어짐
  s += P('M736 868 C774 896 796 960 800 1050 C806 1250 828 1440 866 1640 C880 1720 884 1790 878 1830 L796 1838 C798 1780 790 1700 772 1630 C744 1440 726 1260 718 1100 Z', K.NAVY.shade, K.NAVY.line, 4);
  s += P('M790 1460 Q820 1480 846 1470', 'none', K.NAVY.line, 3, 'opacity="0.6"'); // 팔꿈치 주름
  s += P('M796 1838 L878 1830 L882 1862 L798 1872 Z', K.SHIRT.shade, K.SHIRT.line, 3);
  const RF = ['M812 1900 C810 1950 812 1990 818 2026', 'M838 1902 C846 1954 856 1992 868 2024', 'M860 1894 C878 1934 894 1966 912 1992', 'M800 1888 C784 1918 776 1948 772 1978'];
  s += RF.map(f => P(f, 'none', HM_SKIN.line, 22)).join('') + RF.map(f => P(f, 'none', HM_SKIN.shade, 15)).join('');
  s += P('M796 1870 C792 1906 802 1928 824 1932 C852 1934 878 1918 884 1888 L882 1862 Z', HM_SKIN.shade, HM_SKIN.line, 3.5);
  // 블레이저 등판(엉덩이까지) + 옆 솔기 + 가운데 솔기 + 아래 트임
  s += P('M406 830 C360 836 318 848 294 868 C262 896 250 960 248 1040 C250 1260 260 1420 268 1520 C262 1620 254 1720 250 1800 C340 1820 680 1820 774 1800 C770 1720 762 1620 756 1520 C764 1420 774 1260 776 1040 C774 960 762 896 730 868 C706 848 664 836 618 830 Z', K.NAVY.base, K.NAVY.line, 4);
  s += P('M730 868 C762 896 774 960 776 1040 C774 1260 764 1420 756 1520 C762 1620 770 1720 774 1800 C752 1806 726 1810 700 1812 C700 1600 694 1400 690 1060 C690 980 712 912 730 868 Z', K.NAVY.shade, 'none', 0, 'opacity="0.85"');
  s += P('M512 846 L512 1816 M512 1660 L536 1816 M360 1100 C366 1360 372 1560 366 1812 M664 1100 C658 1360 652 1560 658 1812', 'none', K.NAVY.line, 3.5, 'opacity="0.9"');
  s += P('M330 1200 Q420 1240 500 1230 M530 1240 Q610 1250 700 1210', 'none', K.NAVY.line, 2.5, 'opacity="0.4"'); // 등 주름(뻗은 팔 쪽으로 당겨짐)
  // 목(그늘) + 셔츠 깃 + 블레이저 깃
  s += P('M446 630 L440 800 L584 800 L578 630 Z', HM_SKIN.shade, HM_SKIN.line, 3.5);
  s += P('M446 640 L578 640 L580 716 C540 730 486 730 444 716 Z', '#c9a596', 'none', 0, 'opacity="0.6"'); // 머리카락이 목덜미에 드리운 그늘
  // 뒤 깃은 목을 높이 감싼다(셔츠 깃 위로 블레이저 깃)
  s += P('M440 716 C480 732 544 732 584 716 L594 800 C548 816 476 816 430 800 Z', K.SHIRT.base, K.SHIRT.line, 3);
  s += P('M424 760 C466 782 558 782 600 760 L624 846 C568 868 456 868 400 846 Z', K.NAVY.light, K.NAVY.line, 3.5);
  // 귀(양옆으로 보임)
  s += P('M356 462 C330 452 320 494 328 528 C334 556 350 568 364 562 Z', HM_SKIN.base, HM_SKIN.line, 3.5) + P('M344 486 C338 504 340 528 350 544', 'none', HM_SKIN.line, 2.2, 'opacity="0.7"');
  s += P('M668 462 C694 452 704 494 696 528 C690 556 674 568 660 562 Z', HM_SKIN.shade, HM_SKIN.line, 3.5) + P('M680 486 C686 504 684 528 674 544', 'none', HM_SKIN.line, 2.2, 'opacity="0.7"');
  // 뒷머리: 초상화와 같은 새까만 짧은 머리 — 덩어리진 윤곽, 정수리 삐침머리, 목덜미는 짧게 쳐서 끝이 작게 갈라짐
  const HB = 'M346 468 Q334 440 338 410 Q328 400 322 388 Q334 386 340 372 C346 318 370 278 396 258 Q410 240 432 230 Q424 214 410 203 Q432 206 448 220 Q474 207 508 207 Q542 201 574 210 C630 226 670 262 688 318 Q700 330 710 340 Q699 346 698 362 C704 410 700 456 690 486 C684 528 668 568 650 600 Q646 630 638 652 Q624 636 612 632 Q604 660 590 682 Q576 664 562 660 Q552 688 528 706 Q512 684 496 666 Q482 682 466 690 Q456 666 440 654 Q424 650 408 644 Q402 622 394 602 C372 568 352 524 346 468 Z';
  s += P(HB, HM_HAIR.base, HM_HAIR.line, 4);
  s += P('M574 210 C630 226 670 262 688 318 Q700 330 710 340 Q699 346 698 362 C704 410 700 456 690 486 C684 528 668 568 650 600 Q646 622 636 640 C652 566 662 486 658 404 C654 322 630 262 574 210 Z', HM_HAIR.shade, 'none', 0, 'opacity="0.85"');
  s += P('M394 602 C432 618 474 628 520 630 C562 630 604 620 646 604 L650 600 Q646 630 638 652 Q624 636 612 632 Q604 660 590 682 Q576 664 562 660 Q552 688 528 706 Q512 684 496 666 Q482 682 466 690 Q456 666 440 654 Q424 650 408 644 Q402 622 394 602 Z', HM_HAIR.shade, 'none', 0, 'opacity="0.75"'); // 목덜미 쪽 그늘
  // 결: 정수리 가마(그림 왼쪽 뒤)에서 퍼져 내려옴
  const CW = [462, 268];
  s += P([[358, 450], [378, 530], [408, 618], [466, 662], [526, 676], [588, 652], [632, 622], [660, 552], [684, 470], [690, 390]].map(([x, y], i) =>
    `M${CW[0] + (x - CW[0]) * 0.15} ${CW[1] + 10} Q${CW[0] + (x - CW[0]) * 0.75} ${CW[1] + (y - CW[1]) * 0.45 + (i % 2) * 14} ${x} ${y - 12}`).join(' '), 'none', HM_HAIR.line, 2.5, 'opacity="0.5"');
  s += P('M378 356 Q500 294 660 360', 'none', HM_HAIR.hi, 11, 'opacity="0.5" stroke-dasharray="34 12 22 10 40 14 20 12 30"'); // 천사의 고리
  // 왼팔(그림 왼쪽): 소영 쪽으로 앞으로 뻗음 — 위팔(가까움)이 아래팔(멂)을 조금 가리고, 멀어지며 가늘어짐, 손등이 보이고 손가락을 펼침
  s += P('M168 806 C130 790 92 776 56 766 L36 846 C74 852 112 862 150 874 Z', K.NAVY.base, K.NAVY.line, 4); // 아래팔
  s += P('M56 766 L36 846 L20 842 L38 762 Z', K.SHIRT.base, K.SHIRT.line, 3); // 셔츠 소맷부리
  s += P('M300 868 C262 852 214 830 168 806 C150 800 136 808 132 826 C128 848 140 872 162 884 C206 912 250 944 292 984 Z', K.NAVY.base, K.NAVY.line, 4); // 위팔
  s += P('M292 984 C250 944 206 912 162 884 C146 876 136 864 134 850 C160 866 210 890 252 916 C270 928 286 944 296 958 Z', K.NAVY.shade, 'none', 0, 'opacity="0.9"');
  s += P('M298 876 C258 860 214 838 172 816', 'none', K.NAVY.light, 7, 'opacity="0.55"');
  s += P('M150 842 Q168 856 176 878', 'none', K.NAVY.line, 3, 'opacity="0.7"'); // 팔꿈치 주름
  const LF = ['M-14 766 C-40 752 -64 742 -86 734', 'M-18 788 C-48 786 -74 786 -98 788', 'M-14 810 C-40 816 -64 824 -86 834', 'M-4 830 C-24 844 -42 856 -58 868'];
  const LT = 'M22 762 C10 742 -2 728 -16 716';
  s += [...LF, LT].map(f => P(f, 'none', HM_SKIN.line, 20)).join('') + [...LF, LT].map(f => P(f, 'none', HM_SKIN.base, 13.5)).join('');
  s += P('M36 762 C18 756 -2 760 -18 772 C-26 792 -24 818 -8 836 C10 846 26 846 38 840 Z', HM_SKIN.base, HM_SKIN.line, 3.5);
  s += P('M-4 786 L8 808 M-12 802 L2 826', 'none', HM_SKIN.shade, 3, 'opacity="0.8"'); // 손등 힘줄
  return s;
}
// 떨어지는 분홍 일기장과 리본 맨 사탕 상자(희민의 오른손 아래, 공중에서 뒤집히며)
function fallingItems() {
  let s = '';
  // 일기장: 표지가 비스듬히 보이며 떨어짐
  s += `<g transform="translate(590 2240) rotate(-28) scale(1.4)">`;
  s += P('M-120 -86 L120 -86 L120 86 L-120 86 Z', PINK.base, PINK.line, 5);
  s += P('M-120 86 L120 86 L128 98 L-112 98 Z', '#f3ece0', PINK.line, 4); // 책장 면
  s += P('M-120 -86 L-100 -86 L-100 86 L-120 86 Z', PINK.shade, 'none');
  s += P('M-92 -64 L96 -64 L96 64 L-92 64 Z', 'none', PINK.light, 5);
  s += P('M10 22 C-8 10 -18 2 -16 -8 C-14 -18 2 -20 10 -10 C18 -20 34 -18 36 -8 C38 2 28 10 10 22 Z', PINK.light, PINK.line, 3);
  s += '</g>';
  // 사탕 상자: 리본 십자 + 나비 매듭, 기울어 떨어짐
  s += `<g transform="translate(730 2540) rotate(22) scale(1.3)">`;
  s += P('M-80 -50 L80 -50 L96 -70 L-64 -70 Z', BOX.top, BOX.line, 4);
  s += P('M80 -50 L96 -70 L96 40 L80 60 Z', BOX.shade, BOX.line, 4);
  s += P('M-80 -50 L80 -50 L80 60 L-80 60 Z', BOX.base, BOX.line, 5);
  s += P('M-10 -50 L10 -50 L10 60 L-10 60 Z', RIB.base, RIB.line, 3);
  s += P('M-80 -6 L80 -6 L80 12 L-80 12 Z', RIB.base, RIB.line, 3);
  s += P('M0 -52 C-24 -86 -60 -84 -58 -64 C-56 -46 -24 -48 0 -52 Z', RIB.base, RIB.line, 3.5) + P('M0 -52 C24 -86 60 -84 58 -64 C56 -46 24 -48 0 -52 Z', RIB.shade, RIB.line, 3.5);
  s += `<ellipse cx="0" cy="-52" rx="11" ry="9" fill="${RIB.base}" stroke="${RIB.line}" stroke-width="3"/>`;
  s += P('M-4 -46 L-26 -14 L-14 -10 L0 -38 Z M4 -46 L26 -14 L14 -10 L0 -38 Z', RIB.shade, RIB.line, 3);
  s += '</g>';
  return s;
}
const boyT = () => {
  const foot = pr(BOY_FOOT), k = FOC / depth(BOY_FOOT) / UPM;
  // 그녀 쪽으로 몸을 조금 기울여 내달리려는 자세(발 기준)
  return `translate(${f1(foot[0])} ${f1(foot[1])}) rotate(-3.5) scale(${k.toFixed(4)}) translate(-512 ${f1(-(214 + 1.74 * UPM))})`;
};
// 앞쪽 그늘 속 뒷모습: 조금 어둡게 + 창 쪽(왼쪽) 가장자리에 달빛 테두리
function heemin() {
  return `<g id="${ID}boy" transform="${boyT()}">${boyBack()}</g>`;
}
function heeminLight() {
  return `<g mask="url(#${ID}rimM)"><use href="#${ID}boy" filter="url(#${ID}rim)" opacity="0.75"/></g>`;
}
function heeminItems() {
  return `<g transform="${boyT()}">${fallingItems()}</g>`;
}

// ---------------------------------------------------------------- 그리기
export function draw() {
  const defs = soyoungDefs(`${ID}s`) +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3d63"/><stop offset="1" stop-color="#4a6390"/></linearGradient>` +
    `<clipPath id="${ID}floorC"><path d="${poly3([[XL, 0, ZB], [XR, 0, ZB], [XR, 0, ZF], [XL, 0, ZF]])}"/></clipPath>` +
    `<filter id="${ID}b4" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}dim" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.62 0 0 0 0  0 0.64 0 0 0.005  0 0 0.74 0 0.02  0 0 0 1 0"/></filter>` +
    `<filter id="${ID}rim" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
    `<feMorphology in="SourceAlpha" operator="erode" radius="1.5" result="er"/><feOffset in="er" dx="4.5" dy="2.5" result="o1"/>` +
    `<feComposite in="er" in2="o1" operator="out" result="rim"/><feFlood flood-color="#bcd0f4"/><feComposite in2="rim" operator="in"/></filter>` +
    `<linearGradient id="${ID}rimG" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="1000"><stop offset="0" stop-color="#fff"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="${ID}rimM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}rimG)"/><rect x="0" y="0" width="${f1(pr(BOY_FOOT)[0] - 150)}" height="1536" fill="#000"/></mask>` +
    `<filter id="${ID}deskDim" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.74 0 0 0 0  0 0.76 0 0 0  0 0 0.84 0 0.01  0 0 0 1 0"/></filter>` +
    `<filter id="${ID}bg" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.74 0 0 0 0  0 0.76 0 0 0  0 0 0.86 0 0.01  0 0 0 1 0"/></filter>` +
    `<linearGradient id="${ID}rimSoG" gradientUnits="userSpaceOnUse" x1="0" y1="330" x2="0" y2="960"><stop offset="0" stop-color="#fff"/><stop offset="0.7" stop-color="#fff" stop-opacity="0.6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="${ID}rimSoM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}rimSoG)"/></mask>` +
    `<radialGradient id="${ID}vig" cx="470" cy="640" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.94"/></radialGradient>`;
  let s = `<rect width="1024" height="1536" fill="#07080c"/>`;
  // 먼 것부터: 가구 · 뿌리 · 소영(넘어진 책상 포함) · 희민. 소영보다 뒤의 것은 한 단계 어둡게(인물이 떠 보이게)
  const soD = depth(SO_FOOT);
  const items = furniture();
  ROOTS.forEach(r => items.push({ d: midDepth(r.pts), s: root(r.pts, r.r0, r.r1, r) }));
  items.push({ d: soD + 0.05, fg: true, s: root(ANKLE_ROOT, 0.042, 0.115, { thorns: 14, seed: 2 }) + crack(...ROOT_HOLE) });
  items.push({ d: soD, fg: true, s: soyoung() + `<g mask="url(#${ID}rimSoM)"><use href="#${ID}so" filter="url(#${ID}rim)" opacity="0.7"/></g>` });
  items.push({ d: soD - 0.27, s: `<g filter="url(#${ID}deskDim)">${toppledDesk()}</g>` }); // 앞쪽 그늘 속이라 한 단계 어둡게(인물보다 튀지 않게)
  items.sort((a, b) => b.d - a.d);
  const allCracks = [[W(-1.46, 4.5), 0.3, 0.24, 3], ...CRACKS];
  s += `<g filter="url(#${ID}bg)">` + room() + moonlight() + allCracks.map(([c, a, b, sd]) => crack(c, a, b, sd)).join('') +
    items.filter(o => o.d > soD + 0.01 && !o.fg).map(o => o.s).join('') + '</g>';
  // 바닥 틈에서 새는 흐린 검붉은 빛(어둡게 누르지 않음)
  s += '<g style="mix-blend-mode:screen">' + allCracks.map(([c, a]) => { const q = pr(c), w = FOC * a / depth(c); return `<ellipse cx="${f1(q[0])}" cy="${f1(q[1])}" rx="${f1(w * 1.5)}" ry="${f1(w * 0.45)}" fill="#a3202a" opacity="0.4" filter="url(#${ID}b12)"/>`; }).join('') + '</g>';
  s += items.filter(o => o.d <= soD + 0.01 || o.fg).map(o => o.s).join('');
  s += debris();
  s += `<g filter="url(#${ID}dim)">${heemin()}</g>` + heeminLight() + heeminItems();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
