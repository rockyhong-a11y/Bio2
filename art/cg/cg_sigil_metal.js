// cg_sigil_metal — 기계실습실을 높은 곳에서 내려다본 장면. 경보 벨이 울리고 붉은 경보등이 방을 물들인다.
// 돌바닥 한가운데 새겨진 문양이 바랜 금빛으로 희미하게 빛난다(네온 마법진 아님). 게임 속 바닥 그림과 같은 구조:
//   바깥 고리 두 겹(사이에 짧은 막대와 작은 마름모가 번갈아) + 꼭짓점이 안쪽 고리에 닿는 오각별(꼭짓점마다 작은 원,
//   한 꼭짓점이 안쪽 = 뒷벽 쪽을 향함) + 별 선이 멈추는 가운데 작은 고리 속 '金' 한 글자.
// 둘레: 종이 한 장 놓인 작업대, 그늘 속 선반 둘과 밀링 기계, 무거운 철제 금고와 꺼진 램프 넷 달린 배전반,
// 왼쪽 위 벽 높이 잘려 열린 환기구, 닫힌 철문, 창으로 드는 가는 달빛.
// 희민(art/chars/heemin.js 초상화를 작게 써서 머리·교복을 맞춤)은 환기구 아래에 작게, 막 내려와 굳어 선 채 문양 쪽을 본다.
import fs from 'fs';
import * as K from '../kit.js';
import { figure as heeminFigure, defs as heeminDefs } from '../chars/heemin.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'sm';
const EINK = '#07060a';
const GEUM = fs.readFileSync(new URL('../fonts/noto-serif-kr-geum.woff2', import.meta.url)).toString('base64');

// ---------------------------------------------------------------- 카메라(높은 시점, 아래로 기울임)
// 세계 좌표(m): x 오른쪽, y 위, z 안쪽. 바닥 y=0. 방: x -RX..RX, z -2..BZ(뒷벽), 높이 RH
const CAM = [0.1, 4.6, -1.8], PITCH = 40 * Math.PI / 180, FOC = 1120, C0 = [512, 690];
const cs = Math.cos(PITCH), sn = Math.sin(PITCH);
function pr([x, y, z]) {
  const dx = x - CAM[0], dy = y - CAM[1], dz = z - CAM[2];
  const yc = dy * cs + dz * sn, zc = -dy * sn + dz * cs;
  return [C0[0] + FOC * dx / zc, C0[1] - FOC * yc / zc];
}
const poly3 = pts => 'M' + pts.map(p => pt(pr(p))).join(' L') + ' Z';
const line3 = pts => 'M' + pts.map(p => pt(pr(p))).join(' L');
const RX = 3.6, BZ = 7, RH = 3.3;

// 상자: 보이는 면(윗면·앞면·옆면)을 칠함. col = { top, front, side, line }
function box(x0, x1, y0, y1, z0, z1, col, lw = 2.5) {
  let s = '';
  const L = col.line || EINK;
  s += P(poly3([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]), col.top, L, lw);
  if (CAM[0] < x0) s += P(poly3([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]]), col.side, L, lw);
  if (CAM[0] > x1) s += P(poly3([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]), col.side, L, lw);
  s += P(poly3([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]), col.front, L, lw);
  return s;
}
// 3D 원: 중심 c, 두 축 u·v(단위벡터), 반지름 r
function circle3(c, u, v, r, n = 40) {
  return 'M' + Array.from({ length: n }, (_, i) => {
    const a = 2 * Math.PI * i / n, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    return pt(pr([c[0] + u[0] * ca + v[0] * sa, c[1] + u[1] * ca + v[1] * sa, c[2] + u[2] * ca + v[2] * sa]));
  }).join(' L') + ' Z';
}
// 원기둥(축이 z 방향): 가까운 끝면(원판)
const discZ = (x, y, z, r, fill, lw = 2.5, stroke = EINK) => P(circle3([x, y, z], [1, 0, 0], [0, 1, 0], r, 32), fill, stroke, lw);
const onBack = (x0, x1, y0, y1, z = BZ) => poly3([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);

// ---------------------------------------------------------------- 방
function room() {
  let s = '';
  // 천장(어두운 띠) · 뒷벽 · 옆벽 · 바닥
  s += P(poly3([[-RX, RH, BZ], [RX, RH, BZ], [RX, RH, -3], [-RX, RH, -3]]), '#0e0f13', EINK, 3);
  s += P(onBack(-RX, RX, 0, RH), '#24262d', EINK, 3);
  s += P(poly3([[-RX, 0, -3], [-RX, 0, BZ], [-RX, RH, BZ], [-RX, RH, -3]]), '#1b1d23', EINK, 3);
  s += P(poly3([[RX, 0, -3], [RX, 0, BZ], [RX, RH, BZ], [RX, RH, -3]]), '#1e2027', EINK, 3);
  s += P(poly3([[-RX, 0, -3], [RX, 0, -3], [RX, 0, BZ], [-RX, 0, BZ]]), '#33353c', EINK, 3);
  // 벽 아래쪽 페인트 띠(어두운 회녹색) + 경계선
  s += P(onBack(-RX, RX, 0, 1.2), '#22292a', 'none') + P(line3([[-RX, 1.2, BZ], [RX, 1.2, BZ]]), 'none', '#0f1013', 3);
  s += P(poly3([[-RX, 0, -3], [-RX, 0, BZ], [-RX, 1.2, BZ], [-RX, 1.2, -3]]), '#1c2223', 'none') + P(line3([[-RX, 1.2, BZ], [-RX, 1.2, -3]]), 'none', '#0f1013', 3);
  s += P(poly3([[RX, 0, -3], [RX, 0, BZ], [RX, 1.2, BZ], [RX, 1.2, -3]]), '#1f2526', 'none') + P(line3([[RX, 1.2, BZ], [RX, 1.2, -3]]), 'none', '#0f1013', 3);
  // 천장의 꺼진 형광등 두 줄
  for (const z of [1.5, 4.5]) s += P(poly3([[-1.4, RH - 0.02, z - 0.08], [1.6, RH - 0.02, z - 0.08], [1.6, RH - 0.02, z + 0.08], [-1.4, RH - 0.02, z + 0.08]]), '#2a2c31', EINK, 2);
  // 돌바닥 판석 줄눈(큰 판, 문양 둘레는 그대로 보이게)
  let g = '';
  for (let x = -RX; x <= RX + 0.01; x += 0.9) g += line3([[x, 0, -3], [x, 0, BZ]]) + ' ';
  for (let z = -2.9; z <= BZ; z += 0.9) g += line3([[-RX, 0, z], [RX, 0, z]]) + ' ';
  s += P(g, 'none', '#1d1e23', 3);
  // 기름 얼룩
  s += `<g filter="url(#${ID}b6)" opacity="0.55">` + P(poly3([[-2.0, 0, 1.9], [-1.2, 0, 1.7], [-0.9, 0, 2.4], [-1.7, 0, 2.6]]), '#1b1c20') + P(poly3([[1.7, 0, 5.3], [2.4, 0, 5.1], [2.5, 0, 5.7], [1.9, 0, 5.9]]), '#1b1c20') + '</g>';
  return s;
}

// 창(뒷벽 오른쪽 위) — 바깥 밤하늘이 차갑게
function windowPane() {
  let s = P(onBack(1.85, 3.25, 1.75, 2.85), '#14161c', EINK, 3);
  s += P(onBack(1.92, 3.18, 1.82, 2.78), '#2c4064', 'none');
  s += P(onBack(1.92, 2.5, 1.82, 2.28), '#7e9ccb', 'none', 0, 'opacity="0.55"');
  s += P(line3([[2.55, 1.75, BZ], [2.55, 2.85, BZ]]) + ' ' + line3([[1.85, 2.3, BZ], [3.25, 2.3, BZ]]), 'none', '#0b0e15', 6);
  s += P(line3([[1.85, 1.75, BZ], [3.25, 1.75, BZ]]), 'none', '#56698e', 3);
  return s;
}
// 창에서 바닥으로 비스듬히 떨어진 달빛(붉은 빛 위에 차갑게 남김): 창 모양 그대로 바닥에 비친 네 칸 빛 + 공기 중의 흐린 빛기둥.
// 앞쪽의 밀링 기계·금고에 가려지는 부분은 가림 마스크로 뺀다.
const MOON = [-0.3, -1, -0.9]; // 빛이 나아가는 방향(아래·앞·조금 왼쪽)
const WIN = { x0: 1.92, x1: 3.18, y0: 1.82, y1: 2.78, mx: 2.55, my: 2.3 };
const toFloor = ([x, y, z]) => { const t = y / -MOON[1]; return [x + MOON[0] * t, 0.003, z + MOON[2] * t]; };
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return 'M' + [...lo.slice(0, -1), ...up.slice(0, -1)].map(pt).join(' L') + ' Z';
}
function moonBeam() {
  const { x0, x1, y0, y1, mx, my } = WIN;
  const win = [[x0, y0, BZ], [x1, y0, BZ], [x1, y1, BZ], [x0, y1, BZ]], fl = win.map(toFloor);
  let s = `<path d="${hull([...win, ...fl].map(pr))}" fill="#9cb8ea" opacity="0.1" filter="url(#${ID}b6)"/>`;
  s += P(poly3(fl), '#9cb8ea', 'none', 0, `opacity="0.3" filter="url(#${ID}b3)"`);
  // 창살 그림자(가운데 세로·가로)
  const bars = line3([toFloor([mx, y0, BZ]), toFloor([mx, y1, BZ])]) + ' ' + line3([toFloor([x0, my, BZ]), toFloor([x1, my, BZ])]);
  s += P(bars, 'none', '#000', 9, `opacity="0.55" filter="url(#${ID}b3)"`);
  return `<g mask="url(#${ID}moonM)">${s}</g>`;
}
const moonMask = () => `<mask id="${ID}moonM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="#fff"/>` +
  `<g filter="url(#${ID}blk)">${safe()}${millingMachine()}</g></mask>`; // 앞의 금고·밀링 기계 실루엣 그대로

// 닫힌 철문(뒷벽 가운데 왼쪽): 쇠판 두 칸, 리벳, 손잡이
function ironDoor() {
  const x0 = -1.05, x1 = 0.05, h = 2.1;
  let s = P(onBack(x0 - 0.09, x1 + 0.09, 0, h + 0.09), '#111216', EINK, 3);
  s += P(onBack(x0, x1, 0, h), '#3e424b', EINK, 3);
  s += P(onBack(x0 + 0.08, x1 - 0.08, 1.12, h - 0.1), '#353841', '#1e2025', 3) + P(onBack(x0 + 0.08, x1 - 0.08, 0.1, 1.0), '#353841', '#1e2025', 3);
  for (const [x, y] of [[x0 + 0.05, 0.05], [x1 - 0.05, 0.05], [x0 + 0.05, h - 0.05], [x1 - 0.05, h - 0.05], [x0 + 0.05, 1.06], [x1 - 0.05, 1.06]]) {
    const p = pr([x, y, BZ]);
    s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="3" fill="#6a6e78" stroke="${EINK}" stroke-width="1"/>`;
  }
  s += P(onBack(x1 - 0.22, x1 - 0.1, 0.96, 1.1), '#7a7e88', EINK, 2); // 손잡이
  s += P(line3([[x0, h, BZ], [x1, h, BZ]]), 'none', '#ff9c8a', 2, 'opacity="0.35"');
  return s;
}

// 경보 벨(문 오른쪽 위): 빨간 둥근 종 + 받침 상자 + 망치, 떨림은 가로 흐림(잔상)으로만
function alarmBell() {
  const c = pr([0.62, 2.45, BZ]);
  const r = 24;
  const bell = `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="#b0332d" stroke="${EINK}" stroke-width="3"/>` +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r * 0.52}" fill="#c2453b" stroke="#6b1a18" stroke-width="2.5"/>` +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="4" fill="#3a0e0c"/>` +
    `<ellipse cx="${f1(c[0] - 9)}" cy="${f1(c[1] - 10)}" rx="8" ry="5" fill="#f08a78" opacity="0.85"/>`;
  let s = `<rect x="${f1(c[0] - 10)}" y="${f1(c[1] + r - 4)}" width="20" height="22" rx="2" fill="#2c2d33" stroke="${EINK}" stroke-width="2"/>`; // 받침 상자
  s += P(`M${f1(c[0] + 3)} ${f1(c[1] + r + 4)} L${f1(c[0] + 15)} ${f1(c[1] + r - 6)}`, 'none', '#6a6c74', 4); // 망치
  s += `<g filter="url(#${ID}mblur)" opacity="0.6"><g transform="translate(-6 0)">${bell}</g><g transform="translate(6 0)">${bell}</g></g>`;
  s += bell;
  return s;
}
// 붉은 경보등(벨 오른쪽, 철망 덮개 달린 둥근 등) — 방 전체를 물들이는 빛의 근원
const LAMP = [1.15, 2.62, BZ];
function alarmLamp() {
  const l = pr(LAMP);
  let s = `<circle cx="${f1(l[0])}" cy="${f1(l[1])}" r="70" fill="#ff2a22" opacity="0.5" filter="url(#${ID}b20)"/>`;
  s += `<rect x="${f1(l[0] - 13)}" y="${f1(l[1] + 4)}" width="26" height="12" rx="2" fill="#2a2b30" stroke="${EINK}" stroke-width="2"/>`;
  s += `<path d="M${f1(l[0] - 14)} ${f1(l[1] + 5)} A14 17 0 0 1 ${f1(l[0] + 14)} ${f1(l[1] + 5)} Z" fill="#ff6a58" stroke="${EINK}" stroke-width="2"/>`;
  s += P(`M${f1(l[0] - 7)} ${f1(l[1] - 9)} L${f1(l[0] - 7)} ${f1(l[1] + 5)} M${f1(l[0] + 7)} ${f1(l[1] - 9)} L${f1(l[0] + 7)} ${f1(l[1] + 5)} M${f1(l[0] - 13)} ${f1(l[1] - 2)} L${f1(l[0] + 13)} ${f1(l[1] - 2)}`, 'none', '#4a1612', 2);
  s += `<ellipse cx="${f1(l[0] - 3)}" cy="${f1(l[1] - 5)}" rx="4" ry="3" fill="#ffe0d6"/>`;
  return s;
}

// 경보등의 도는 빛줄기: 왼쪽 벽과 바닥을 쓸고 지나가는 흐린 붉은 쐐기(번쩍이는 경보)
function beaconBeam() {
  const l = pr(LAMP), a = pr([-3.6, 0.2, 4.6]), b = pr([-3.6, 2.9, 6.4]);
  return `<g mask="url(#${ID}noBoy)"><path d="M${pt(l)} L${pt(a)} L${pt(b)} Z" fill="url(#${ID}beam)" style="mix-blend-mode:screen" filter="url(#${ID}b20)"/></g>`;
}

// 잘려 열린 환기구(왼쪽 위 벽 높이): 검은 구멍 + 남은 테두리와 잘린 쇠살 끄트머리, 떼어 낸 격자 덮개는 바닥에
const VENT = { x0: -3.05, x1: -2.15, y0: 2.2, y1: 2.72 };
function vent() {
  const { x0, x1, y0, y1 } = VENT;
  let s = P(onBack(x0 - 0.07, x1 + 0.07, y0 - 0.07, y1 + 0.07), '#4d5058', EINK, 2.5);
  s += P(onBack(x0, x1, y0, y1), '#030304', EINK, 2.5);
  // 안쪽 덕트 깊이(위·옆 안벽)
  s += P(poly3([[x0, y1, BZ], [x1, y1, BZ], [x1 - 0.08, y1 - 0.06, BZ + 0.6], [x0 + 0.08, y1 - 0.06, BZ + 0.6]]), '#17181c', 'none');
  s += P(poly3([[x1, y1, BZ], [x1, y0, BZ], [x1 - 0.08, y0 + 0.05, BZ + 0.6], [x1 - 0.08, y1 - 0.06, BZ + 0.6]]), '#101114', 'none');
  // 잘린 쇠살 끄트머리
  let stubs = '';
  for (let k = 1; k < 8; k++) {
    const x = x0 + (x1 - x0) * k / 8;
    stubs += line3([[x, y1, BZ], [x, y1 - 0.06, BZ]]) + ' ' + line3([[x, y0, BZ], [x + 0.012, y0 + 0.05, BZ]]) + ' ';
  }
  s += P(stubs, 'none', '#9a9ea8', 2.5);
  // 바닥에 떨어진 격자 덮개(비스듬히)
  const g = [[-3.2, 0.02, 5.75], [-2.4, 0.02, 5.55], [-2.3, 0.02, 6.05], [-3.1, 0.02, 6.25]];
  s += P(poly3(g), '#5c6069', EINK, 2.5);
  let bars = '';
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    const a = [g[0][0] + (g[1][0] - g[0][0]) * t, 0.03, g[0][2] + (g[1][2] - g[0][2]) * t];
    const b = [g[3][0] + (g[2][0] - g[3][0]) * t, 0.03, g[3][2] + (g[2][2] - g[3][2]) * t];
    bars += line3([a, b]) + ' ';
  }
  s += P(bars, 'none', '#2a2c32', 2.5);
  return s;
}

// 배전반(꺼진 램프 넷) — 금고 옆 벽
function switchboard() {
  const x0 = 1.15, x1 = 1.85, y0 = 0.95, y1 = 1.7, z = BZ - 0.02;
  let s = P(onBack(x0, x1, y0, y1, z), '#4e525b', EINK, 2.5);
  s += P(onBack(x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, z), '#3d4048', '#25272c', 1.5);
  for (let k = 0; k < 4; k++) {
    const p = pr([x0 + 0.14 + k * 0.14, y1 - 0.17, z]);
    s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="6.5" fill="#2a2c31" stroke="${EINK}" stroke-width="2"/><circle cx="${f1(p[0] - 1.8)}" cy="${f1(p[1] - 1.8)}" r="2" fill="#70747e"/>`;
    const q = pr([x0 + 0.14 + k * 0.14, y0 + 0.22, z]);
    s += `<rect x="${f1(q[0] - 3.5)}" y="${f1(q[1] - 10)}" width="7" height="15" rx="2" fill="#17181b" stroke="${EINK}" stroke-width="1"/>`;
  }
  s += P(line3([[x0 + 0.35, y0, z], [x0 + 0.35, 0.15, z]]), 'none', '#18191d', 5); // 배선관
  return s;
}
// 무거운 철제 금고(오른쪽 뒤 구석): 다이얼 + 십자 손잡이 + 경첩
function safe() {
  const x0 = 2.3, x1 = 3.35, z0 = 6.05, z1 = 6.95, h = 1.4;
  let s = box(x0, x1, 0, h, z0, z1, { top: '#5e626c', front: '#474b54', side: '#383b42' }, 3);
  const F = (x, y) => pr([x, y, z0]);
  s += P(poly3([[x0 + 0.09, 0.1, z0], [x1 - 0.09, 0.1, z0], [x1 - 0.09, h - 0.1, z0], [x0 + 0.09, h - 0.1, z0]]), 'none', '#2b2d33', 3);
  const d = F(x0 + 0.45, 0.9), w = F(x0 + 0.45, 0.5);
  s += `<circle cx="${f1(d[0])}" cy="${f1(d[1])}" r="14" fill="#8e929b" stroke="${EINK}" stroke-width="2.5"/><circle cx="${f1(d[0])}" cy="${f1(d[1])}" r="4.5" fill="#3a3c43"/>`;
  s += `<circle cx="${f1(w[0])}" cy="${f1(w[1])}" r="17" fill="none" stroke="#a0a4ae" stroke-width="3.5"/>` +
    P(`M${f1(w[0] - 17)} ${f1(w[1])} L${f1(w[0] + 17)} ${f1(w[1])} M${f1(w[0])} ${f1(w[1] - 17)} L${f1(w[0])} ${f1(w[1] + 17)}`, 'none', '#a0a4ae', 3.5);
  for (const y of [1.05, 0.35]) { const hg = F(x1 - 0.1, y); s += `<rect x="${f1(hg[0] - 4)}" y="${f1(hg[1])}" width="8" height="13" fill="#22242a"/>`; }
  s += P(line3([[x0, h, z0], [x1, h, z0]]), 'none', '#ff9c8a', 2.5, 'opacity="0.5"'); // 윗모서리에 붉은 빛
  return s;
}

const MACH = { top: '#4a5852', front: '#38443f', side: '#2c3632' }; // 기계 도색(어두운 회녹색)
const STEEL = { top: '#8e959e', front: '#6c737c', side: '#575d65' };
// 밀링 기계(오른쪽): 받침 → 기둥 → 니(knee) → 가로 작업대(핸들) → 위쪽 오버암 → 주축 머리
function millingMachine() {
  const x0 = 2.1, x1 = 3.1, z0 = 3.3, z1 = 4.3;
  let s = '';
  s += box(x0, x1, 0, 0.18, z0 - 0.1, z1 + 0.1, MACH); // 받침
  s += box(x0 + 0.3, x1, 0.18, 2.0, z1 - 0.45, z1, MACH); // 기둥(뒤쪽)
  s += box(x0 + 0.15, x1 - 0.1, 0.18, 0.95, z0 + 0.1, z1 - 0.45, MACH); // 니
  s += box(x0 - 0.3, x1 + 0.1, 0.95, 1.08, z0 + 0.15, z1 - 0.5, { top: '#59625f', front: '#424b48', side: '#363e3b' }); // 작업대
  s += P(line3([[x0 - 0.25, 1.081, z0 + 0.3], [x1 + 0.05, 1.081, z0 + 0.3]]) + ' ' + line3([[x0 - 0.25, 1.081, z0 + 0.38], [x1 + 0.05, 1.081, z0 + 0.38]]), 'none', '#2a302e', 2); // T홈
  s += box(x0 + 0.05, x0 + 0.35, 1.08, 1.22, z0 + 0.2, z0 + 0.42, STEEL, 2); // 바이스
  s += box(x0 + 0.1, x1, 2.0, 2.22, z0 - 0.05, z1, MACH); // 오버암
  s += box(x0 + 0.25, x0 + 0.65, 1.62, 2.0, z0, z0 + 0.4, MACH); // 주축 머리
  s += box(x0 + 0.4, x0 + 0.5, 1.3, 1.62, z0 + 0.15, z0 + 0.25, STEEL, 2); // 주축
  // 핸들 바퀴(작업대 앞, 니 앞)
  s += discZ(x0 - 0.36, 1.0, z0 + 0.3, 0.1, 'none', 3, '#8e959e') + discZ(x0 + 0.5, 0.6, z0 + 0.08, 0.11, 'none', 3, '#8e959e');
  s += P(line3([[x0 - 0.36, 1.0, z0 + 0.3], [x0 - 0.42, 1.08, z0 + 0.3]]), 'none', '#8e959e', 3);
  s += P(line3([[x0 - 0.3, 1.08, z0 + 0.15], [x1 + 0.1, 1.08, z0 + 0.15]]), 'none', '#ff9c8a', 2, 'opacity="0.45"');
  return s;
}

// 선반(왼쪽 벽을 따라, 깊이 방향으로 긴): 다리 상자 둘 + 긴 베드 + 안쪽 주축대(척) + 왕복대(핸들) + 심압대 + 가공물
function lathe(z0, z1, x0 = -3.2) {
  const x1 = x0 + 0.8;
  let s = '';
  s += box(x0, x1, 0, 0.82, z1 - 0.55, z1, MACH) + box(x0, x1, 0, 0.82, z0, z0 + 0.45, MACH); // 다리 상자
  s += box(x0 + 0.05, x1 - 0.05, 0.08, 0.6, z0 + 0.45, z1 - 0.55, { top: '#232826', front: '#1c201f', side: '#191d1c' }, 2); // 칩받이
  s += box(x0 - 0.02, x1 + 0.02, 0.82, 1.0, z0, z1, { top: '#5b6663', front: '#454f4c', side: '#3a4341' }); // 베드
  // 먼 것부터: 주축대(안쪽 끝, 높은 상자 + 기어 덮개) → 척 → 가공물 → 왕복대 → 심압대(앞쪽 끝)
  s += box(x0, x1, 1.0, 1.46, z1 - 0.5, z1, MACH); // 주축대
  s += box(x0 + 0.05, x1 - 0.1, 1.46, 1.56, z1 - 0.42, z1 - 0.05, { top: '#3f4b46', front: '#2f3934', side: '#27302c' }, 2); // 기어 덮개
  s += P(circle3([x1 - 0.4, 1.24, z1 - 0.52], [0, 1, 0], [1, 0, 0], 0.18, 30), '#7e858e', EINK, 2.5); // 척
  for (const a of [0.5, 2.6, 4.7]) s += P(line3([[x1 - 0.4 + 0.05 * Math.cos(a), 1.24 + 0.05 * Math.sin(a), z1 - 0.53], [x1 - 0.4 + 0.16 * Math.cos(a), 1.24 + 0.16 * Math.sin(a), z1 - 0.53]]), 'none', '#3a3d44', 4); // 척 조
  s += P(circle3([x1 - 0.4, 1.24, z1 - 0.53], [0, 1, 0], [1, 0, 0], 0.05, 16), '#3a3d44', EINK, 1.5);
  s += box(x1 - 0.44, x1 - 0.36, 1.2, 1.28, z0 + 0.4, z1 - 0.53, STEEL, 1.5); // 가공물 봉
  const zc = (z0 + z1) / 2;
  s += box(x0 + 0.02, x1 + 0.08, 1.0, 1.15, zc - 0.22, zc + 0.15, { top: '#55605c', front: '#3f4946', side: '#353d3a' }); // 왕복대
  s += box(x1 - 0.5, x1 - 0.3, 1.15, 1.3, zc - 0.12, zc + 0.05, STEEL, 1.5); // 공구대
  s += P(circle3([x1 + 0.1, 1.02, zc], [0, 1, 0], [0, 0, 1], 0.11, 24), 'none', '#9aa1aa', 3.5); // 핸들 바퀴
  s += box(x0 + 0.08, x1 - 0.08, 1.0, 1.32, z0 + 0.05, z0 + 0.4, MACH); // 심압대
  s += P(circle3([x1 + 0.0, 1.18, z0 + 0.2], [0, 1, 0], [0, 0, 1], 0.07, 20), 'none', '#9aa1aa', 3); // 심압대 핸들
  s += P(line3([[x1 + 0.02, 1.0, z0], [x1 + 0.02, 1.0, z1]]), 'none', '#ff9c8a', 2, 'opacity="0.4"');
  return s;
}

// 작업대(앞쪽 왼쪽, 나무 상판 + 쇠 다리) + 종이 한 장 + 공구
function workbench() {
  const x0 = -2.15, x1 = -0.6, z0 = -0.25, z1 = 0.55, h = 0.86;
  let s = '';
  for (const [x, z] of [[x0 + 0.06, z0 + 0.06], [x1 - 0.12, z0 + 0.06]]) s += box(x, x + 0.06, 0, h - 0.06, z, z + 0.06, { top: '#2c2d32', front: '#2c2d32', side: '#212226' }, 2);
  s += box(x0 + 0.05, x1 - 0.05, 0.14, 0.19, z0 + 0.05, z1 - 0.05, { top: '#2f2b27', front: '#25221f', side: '#1d1b19' }, 2); // 아래 선반
  s += box(x0, x1, h - 0.07, h, z0, z1, { top: '#6a5238', front: '#433324', side: '#3a2c20' }, 3);
  s += P(line3([[x0 + 0.02, h + 0.001, z0 + 0.25], [x1 - 0.02, h + 0.001, z0 + 0.22]]) + ' ' + line3([[x0 + 0.02, h + 0.001, z0 + 0.55], [x1 - 0.02, h + 0.001, z0 + 0.53]]), 'none', '#4e3c2a', 2, 'opacity="0.8"'); // 판자 이음
  // 종이 한 장(살짝 비스듬히) + 읽히지 않는 연필 자국
  s += P(poly3([[-1.6, h + 0.004, -0.05], [-1.17, h + 0.004, -0.1], [-1.11, h + 0.004, 0.38], [-1.55, h + 0.004, 0.43]]), '#ddd6c4', EINK, 2.2);
  const onTop = (a0, b0, a1, b1) => line3([[a0, h + 0.005, b0], [a1, h + 0.005, b1]]);
  s += P(onTop(-1.5, 0.06, -1.25, 0.03) + ' ' + onTop(-1.49, 0.16, -1.23, 0.13) + ' ' + onTop(-1.47, 0.26, -1.3, 0.24), 'none', '#9c9585', 2, 'opacity="0.6"');
  // 공구: 스패너, 망치
  s += P(line3([[-2.0, h + 0.01, 0.0], [-1.78, h + 0.01, 0.35]]), 'none', '#8a9099', 6) + P(line3([[-0.85, h + 0.01, -0.05], [-0.78, h + 0.01, 0.3]]), 'none', '#6e5238', 7);
  s += P(line3([[-0.92, h + 0.01, 0.32], [-0.68, h + 0.01, 0.3]]), 'none', '#7a8088', 10);
  s += P(line3([[x0, h, z0], [x1, h, z0]]), 'none', '#ff9c8a', 2, 'opacity="0.35"');
  return s;
}

// ---------------------------------------------------------------- 바닥 문양(게임 속 바닥 그림과 같은 비율)
const SC = [0.1, 0, 3.1], SR = 1.85;
const R1 = SR, R2 = SR * 0.82, RC = SR * 0.47, RV = SR * 0.075;
const sp = (u, v) => pr([SC[0] + u, 0, SC[2] + v]);
const ringAt = (cu, cv, r, n = 96) => 'M' + Array.from({ length: n }, (_, i) => pt(sp(cu + r * Math.cos(2 * Math.PI * i / n), cv + r * Math.sin(2 * Math.PI * i / n)))).join(' L') + ' Z';
const ring = (r, n) => ringAt(0, 0, r, n);
function sigilGeom() {
  const rings = ring(R1) + ' ' + ring(R2);
  // 두 고리 사이: 짧은 막대와 작은 마름모를 번갈아
  let bars = '', dias = '';
  const N = 30, rm = (R1 + R2) / 2, hw = (R1 - R2) * 0.27;
  for (let i = 0; i < N; i++) {
    const a = Math.PI / 2 + 2 * Math.PI * i / N;
    const ca = Math.cos(a), sa = Math.sin(a);
    if (i % 2 === 0) bars += `M${pt(sp(ca * (rm - hw), sa * (rm - hw)))} L${pt(sp(ca * (rm + hw), sa * (rm + hw)))} `;
    else {
      const d = (R1 - R2) * 0.2, ta = [-sa, ca];
      dias += `M${pt(sp(ca * (rm - d), sa * (rm - d)))} L${pt(sp(ca * rm + ta[0] * d, sa * rm + ta[1] * d))} L${pt(sp(ca * (rm + d), sa * (rm + d)))} L${pt(sp(ca * rm - ta[0] * d, sa * rm - ta[1] * d))} Z `;
    }
  }
  // 오각별: 꼭짓점 하나가 안쪽(+v, 뒷벽 쪽), 꼭짓점은 안쪽 고리(R2)에 닿고 선은 가운데 고리(RC)에서 멈춤
  const V = Array.from({ length: 5 }, (_, k) => { const a = Math.PI / 2 + 2 * Math.PI * k / 5; return [R2 * Math.cos(a), R2 * Math.sin(a)]; });
  let star = '';
  for (let k = 0; k < 5; k++) for (const [p, q] of clipOutside(V[k], V[(k + 2) % 5], RC)) star += `M${pt(sp(...p))} L${pt(sp(...q))} `;
  let caps = '', capDots = '';
  for (const [u, v] of V) { caps += ringAt(u, v, RV, 28) + ' '; capDots += ringAt(u, v, RV * 0.36, 16) + ' '; }
  return { rings, bars, dias, star, caps, capDots, center: ring(RC, 72) };
}
// 선분 AB에서 원점 중심 반지름 r 원 바깥 부분만
function clipOutside(A, B, r) {
  const d = [B[0] - A[0], B[1] - A[1]];
  const a = d[0] * d[0] + d[1] * d[1], b = 2 * (A[0] * d[0] + A[1] * d[1]), c = A[0] * A[0] + A[1] * A[1] - r * r;
  const disc = b * b - 4 * a * c;
  if (disc <= 0) return [[A, B]];
  const t1 = (-b - Math.sqrt(disc)) / (2 * a), t2 = (-b + Math.sqrt(disc)) / (2 * a);
  const L = t => [A[0] + d[0] * t, A[1] + d[1] * t];
  const out = [];
  if (t1 > 0) out.push([A, L(Math.min(t1, 1))]);
  if (t2 < 1) out.push([L(Math.max(t2, 0)), B]);
  return out;
}
// 金: 바닥 면에 눕힌 글자(문양 중심에서의 투시를 아핀 근사). 글자 좌표 1단위 = 1mm, 글자 위쪽이 뒷벽 쪽
function geumMatrix() {
  const o = sp(0, 0), eu = sp(0.01, 0), ev = sp(0, 0.01);
  const a = (eu[0] - o[0]) / 10, b = (eu[1] - o[1]) / 10, c = -(ev[0] - o[0]) / 10, d = -(ev[1] - o[1]) / 10;
  return `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${f1(o[0])} ${f1(o[1])})`;
}
const GEUM_SIZE = Math.round(RC * 1000 * 1.18);
const geumText = (fill, extra = '') =>
  `<text x="0" y="${Math.round(GEUM_SIZE * 0.04)}" transform="${geumMatrix()}" font-family="SerifKR" font-weight="700" font-size="${GEUM_SIZE}" text-anchor="middle" dominant-baseline="central" fill="${fill}" ${extra}>金</text>`;
// 새긴 홈(어둡게) → 홈 안의 바랜 금빛 선. glow: 붉은 빛 위에 다시 얹는 은은한 빛
function sigil() {
  const g = sigilGeom();
  const lines = `${g.rings} ${g.bars} ${g.star} ${g.center} ${g.caps}`;
  let s = '';
  s += `<path d="${ring(R1 * 1.12)}" fill="#b8975a" opacity="0.1" filter="url(#${ID}b30)"/>`; // 바닥에 스민 아주 흐린 금빛
  s += P(lines, 'none', '#0d0b09', 11) + P(g.dias + ' ' + g.capDots, '#0d0b09', '#0d0b09', 7);
  s += geumText('#0d0b09', 'stroke="#0d0b09" stroke-width="44" stroke-linejoin="round"');
  s += P(lines, 'none', '#9c8150', 4.2) + P(g.dias + ' ' + g.capDots, '#9c8150', '#9c8150', 2);
  s += geumText('#a08655');
  return s;
}
function sigilGlow() {
  const g = sigilGeom();
  const lines = `${g.rings} ${g.bars} ${g.star} ${g.center} ${g.caps}`;
  return `<g filter="url(#${ID}b5)" opacity="0.7">` + P(lines, 'none', '#c4a468', 8) + P(g.dias + ' ' + g.capDots, '#c4a468', '#c4a468', 4) + geumText('#c4a468', 'stroke="#c4a468" stroke-width="18"') + '</g>' +
    P(lines, 'none', '#c8ab72', 3) + P(g.dias + ' ' + g.capDots, '#c8ab72', '#c8ab72', 1.5) + geumText('#cdb27c') +
    P(lines, 'none', '#efe0b8', 1.1, 'opacity="0.55"');
}

// ---------------------------------------------------------------- 희민(작게, 환기구 아래)
// 초상화 그림(얼굴·머리·교복)을 작게 쓰고, 허리 아래(블레이저 아랫단·바지·구두)와 팔 아랫부분은 같은 그림체로 덧그림.
// 높은 시점이라 허리 아래를 조금 줄여 짧아 보이게 함. 놀라 굳은 얼굴, 눈은 문양 쪽(그림 오른쪽 아래)을 봄, 얼굴 왼쪽 반은 그늘.
const BOY_AT = [-2.25, 0, 6.2];
const BOY_FACE = { eye: { open: 1.1, iris: 0.66 }, brow: { dy: -16, inner: -14 }, mouth: 'scared', pale: true, blush: 0.04 };
const NAVY = K.NAVY;
const SLACK = { base: '#3d3f49', shade: '#2a2c34', line: '#0e0f14' };
const SHOE = { base: '#4a3022', shade: '#2e1d14', line: '#120a06' };
const SKIN = { base: '#fae7d9', shade: '#e9c9b6', line: '#9a6a5c' };
// 작게 줄여도 선이 보이게 가는 선만 굵힘(번짐용 굵은 획 · 머리 광택 띠는 그대로)
const thick = (svg, k) => svg.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${f1(+w < 10 ? w * k : w)}"`);
const lookAt = (svg, dx, dy) => svg.replace(/(<rect [^>]*fill="#fff"\/>)([\s\S]*?)(<rect [^>]*lidshade)/g, `$1<g transform="translate(${dx} ${dy})">$2</g>$3`);
function boyLower() {
  const W = 9; // 덧그림 선 굵기(작게 줄여도 보이게)
  let s = '';
  // 다리(조금 벌리고 버팀) + 구두
  s += P('M332 1780 C326 2200 330 2700 340 3340 L470 3340 C484 2800 500 2300 510 1900 Z', SLACK.base, SLACK.line, W);
  s += P('M514 1900 C524 2300 540 2800 556 3340 L690 3340 C700 2700 704 2200 696 1780 Z', SLACK.shade, SLACK.line, W);
  s += P('M332 3320 C310 3360 298 3420 320 3440 L472 3440 C480 3400 478 3360 472 3320 Z', SHOE.base, SHOE.line, W);
  s += P('M556 3320 C550 3360 548 3400 556 3440 L712 3440 C734 3420 722 3360 698 3320 Z', SHOE.shade, SHOE.line, W);
  // 블레이저 아랫단
  s += P('M300 1440 C298 1580 298 1700 302 1840 C380 1862 450 1866 496 1860 C502 1780 506 1690 512 1600 L512 1440 Z', NAVY.base, NAVY.line, W);
  s += P('M512 1440 L512 1600 C518 1690 522 1780 528 1860 C580 1866 650 1862 726 1840 C730 1700 730 1580 724 1440 Z', NAVY.base, NAVY.line, W);
  s += P('M704 1440 L724 1440 C730 1580 730 1700 726 1840 L700 1848 C706 1700 706 1580 704 1440 Z', NAVY.shade, 'none');
  return s;
}
// 팔 아랫부분: 몸에서 살짝 떨어져 뻣뻣하게 내린 팔, 손은 굳어 펴짐
function boyArms() {
  const W = 9;
  let s = '';
  s += P('M246 1500 C238 1620 232 1720 230 1820 L318 1830 C322 1720 328 1620 334 1500 Z', NAVY.base, NAVY.line, W);
  s += P('M790 1500 C798 1620 804 1720 806 1820 L718 1830 C714 1720 708 1620 702 1500 Z', NAVY.shade, NAVY.line, W);
  s += P('M232 1820 C226 1880 228 1960 246 2010 C262 2040 296 2036 306 2000 C316 1950 318 1880 316 1828 Z', SKIN.base, SKIN.line, 7);
  s += P('M720 1828 C718 1880 720 1950 730 2000 C740 2036 774 2040 790 2010 C808 1960 810 1880 804 1820 Z', SKIN.shade, SKIN.line, 7);
  return s;
}
function boy() {
  const foot = pr(BOY_AT), head = pr([BOY_AT[0], 1.72, BOY_AT[2]]);
  // 초상화 좌표: 정수리 ≈ 190, 발바닥 ≈ 3440(허리 아래 0.82배로 줄인 뒤 ≈ 3020)
  const SQ = 0.62, WAIST = 1500;
  const footY = WAIST + (3440 - WAIST) * SQ;
  const k = 1.18 * (foot[1] - head[1]) / (footY - 190); // 조금 크게(작아도 읽히게)
  // 붉은 빛 속에서도 새까만 머리로 읽히게 머리색만 한 단계 어둡게
  const fig = thick(lookAt(heeminFigure(BOY_FACE, `${ID}h`), 8, 6), 2.6).replace(/#212027/g, '#121116').replace(/#111015/g, '#08070a');
  // 얼굴 왼쪽 반 그늘(초상화의 얼굴 클립 안에서)
  const halfShade = `<g clip-path="url(#${ID}faceC)"><path d="M300 250 L520 250 C500 420 498 560 520 740 L300 740 Z" fill="#3a2a3a" opacity="0.5"/></g>`;
  const inner =
    `<g transform="translate(0 ${WAIST}) scale(1 ${SQ}) translate(0 ${-WAIST})">${boyLower()}${boyArms()}</g>` +
    `<clipPath id="${ID}bclip"><path d="M0 772 L1024 772 L1024 1500 L0 1500 Z"/></clipPath><clipPath id="${ID}hclip"><path d="M0 0 L1024 0 L1024 780 L0 780 Z"/></clipPath>` +
    `<g clip-path="url(#${ID}bclip)">${fig}</g>` +
    // 높은 시점: 머리를 조금 크게(목 아래 기준)
    `<g transform="translate(512 790) scale(1.14) translate(-512 -790)"><g clip-path="url(#${ID}hclip)">${fig}</g>${halfShade}</g>`;
  // 발그림자
  const sh = `<ellipse cx="${f1(foot[0] + 6)}" cy="${f1(foot[1] - 2)}" rx="${f1(46 * k / 0.075)}" ry="${f1(12 * k / 0.075)}" fill="#000" opacity="0.5"/>`;
  return sh + `<g id="${ID}boyG" transform="translate(${f1(foot[0] - 512 * k)} ${f1(foot[1] - footY * k)}) scale(${k.toFixed(4)})">${inner}</g>`;
}

// ---------------------------------------------------------------- 그리기
export function draw() {
  const lampP = pr(LAMP);
  const defs =
    `<style>@font-face{font-family:'SerifKR';src:url(data:font/woff2;base64,${GEUM}) format('woff2');}</style>` +
    heeminDefs(`${ID}h`) + moonMask() +
    `<filter id="${ID}blk" x="-5%" y="-5%" width="110%" height="110%"><feFlood flood-color="#000"/><feComposite in2="SourceAlpha" operator="in"/></filter>` +
    `<mask id="${ID}noBoy" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="#fff"/><use href="#${ID}boyG" filter="url(#${ID}blk)"/></mask>` + `<clipPath id="${ID}faceC"><path d="${K.FACE}"/></clipPath>` +
    `<filter id="${ID}b3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b5" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>` +
    `<filter id="${ID}b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="${ID}mblur" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="5 0.5"/></filter>` +
    // 붉은 경보 빛: 곱하기로 방 전체를 물들임(경보등 가까이 밝게, 멀수록 어둡게)
    `<radialGradient id="${ID}red" cx="${f1(lampP[0])}" cy="${f1(lampP[1])}" r="1350" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#ff9484"/><stop offset="0.3" stop-color="#e05e62"/><stop offset="0.7" stop-color="#a83846"/><stop offset="1" stop-color="#682030"/></radialGradient>` +
    `<radialGradient id="${ID}redAdd" cx="${f1(lampP[0])}" cy="${f1(lampP[1])}" r="760" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#ff3a30" stop-opacity="0.32"/><stop offset="1" stop-color="#ff3a30" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}beam" cx="${f1(lampP[0])}" cy="${f1(lampP[1])}" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff4a3c" stop-opacity="0.5"/><stop offset="1" stop-color="#ff4a3c" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="700" r="920" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0.42" stop-color="#000" stop-opacity="0"/><stop offset="0.78" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>` +
    `<linearGradient id="${ID}bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>`;

  let s = `<rect width="1024" height="1536" fill="#0a0a0d"/>`;
  s += room() + windowPane() + ironDoor() + switchboard() + vent();
  s += sigil();
  // 물체는 먼 것부터
  s += safe() + boy() + lathe(2.5, 4.5) + millingMachine() + lathe(-0.2, 1.7, -3.45) + workbench();
  // 붉은 경보 빛
  s += `<rect width="1024" height="1536" fill="url(#${ID}red)" style="mix-blend-mode:multiply"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}redAdd)" style="mix-blend-mode:screen"/>`;
  s += beaconBeam() + alarmBell() + alarmLamp();
  // 문양의 빛과 차가운 달빛은 붉은 빛 위에 은은하게 다시
  s += `<g style="mix-blend-mode:screen" opacity="0.5">${sigilGlow()}</g>`;
  s += `<g style="mix-blend-mode:screen">${moonBeam()}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<rect y="1240" width="1024" height="296" fill="url(#${ID}bot)"/>`;
  return K.svg(s, { defs });
}
