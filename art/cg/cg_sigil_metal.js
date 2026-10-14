// cg_sigil_metal — 기계실습실을 높은 곳에서 내려다본 장면. 경보 벨이 울리고 붉은 경보등이 방을 물들인다.
// 돌바닥 한가운데 새겨진 문양이 바랜 금빛으로 희미하게 빛난다(네온 마법진 아님). 게임 속 바닥 그림과 같은 구조:
//   바깥 고리 두 겹(사이에 짧은 막대와 작은 마름모가 번갈아) + 꼭짓점이 안쪽 고리에 닿는 오각별(꼭짓점마다 작은 원,
//   한 꼭짓점이 안쪽 = 뒷벽 쪽을 향함) + 별 선이 멈추는 가운데 작은 고리 속 '金' 한 글자.
// 둘레: 종이 한 장 놓인 작업대, 그늘 속 선반 둘과 밀링 기계, 무거운 철제 금고와 꺼진 램프 넷 달린 배전반,
// 왼쪽 위 벽 높이 잘려 열린 환기구, 닫힌 철문, 창으로 드는 가는 달빛.
// 희민(힉스필드 초상화 assets/hf/portrait_heemin_surprised.webp 를 작게 씀)은 환기구 아래에 작게, 막 내려와 놀라 굳어 선다.
import fs from 'fs';
import * as K from '../kit.js';

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
// 힉스필드 초상화(assets/hf/portrait_heemin_surprised.webp, 놀라 굳은 얼굴)를 작게 써서 가슴 위를 그대로 보이고,
// 초상화가 잘린 가슴 아래(블레이저 아랫단·내린 팔·바지·구두)는 그늘 속 어두운 덧그림으로 잇는다(잘린 단은 그늘로 녹임).
// 높은 시점이라 가슴 아래를 SQ배로 줄여 짧아 보이게 함. 얼굴 왼쪽 반은 그늘.
const HF = new URL('../../assets/hf/', import.meta.url);
function webpSize(b) {
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >>> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}
function portrait(name) {
  const b = fs.readFileSync(new URL(`portrait_${name}.webp`, HF));
  const [w, h] = webpSize(b);
  return { w, h, uri: `data:image/webp;base64,${b.toString('base64')}` };
}
const HM = portrait('heemin_surprised');
const BOY_AT = [-1.98, 0, 5.75];
const BK = 0.142; // 초상화 px → 그림 px
const SQ = 0.72; // 가슴 아래 줄임(높은 시점)
const H0 = HM.h, CXP = HM.w / 2; // 초상화 아래 단, 몸 가운데
const SOLE = H0 + 1724; // 발바닥(줄이기 전)
const NAVYB = { base: '#2c3553', shade: '#1d2440', line: '#0b0e1a' };
const SLACK = { base: '#34363f', shade: '#24252c', line: '#0b0c10' };
const SHOE = { base: '#3e281c', shade: '#26170f', line: '#0d0805' };
const SKIN = { base: '#c9ada3', shade: '#a98d86', line: '#4a3430' };
const mx = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f1(2 * CXP - x)} ${y}`);
const yy = v => f1(H0 + v); // 초상화 아래 단 기준 세로 좌표
function boyLower() {
  const W = 7;
  let s = '';
  // 다리: 막 뛰어내려 한쪽(그림 왼쪽)에 체중을 싣고, 다른 쪽은 무릎을 살짝 굽혀 앞·바깥으로 디딘 채 굳음
  s += P(`M98 ${yy(540)} C94 ${yy(760)} 92 ${yy(940)} 96 ${yy(1100)} C94 ${yy(1300)} 92 ${yy(1480)} 94 ${yy(1640)} L178 ${yy(1640)} C182 ${yy(1480)} 190 ${yy(1300)} 196 ${yy(1110)} C204 ${yy(950)} 216 ${yy(780)} 228 ${yy(600)} Z`, SLACK.base, SLACK.line, W);
  s += P(`M228 ${yy(600)} C246 ${yy(760)} 262 ${yy(900)} 274 ${yy(1050)} C292 ${yy(1260)} 304 ${yy(1460)} 312 ${yy(1660)} L396 ${yy(1660)} C398 ${yy(1460)} 392 ${yy(1260)} 380 ${yy(1050)} C374 ${yy(900)} 366 ${yy(760)} 356 ${yy(540)} Z`, SLACK.shade, SLACK.line, W);
  s += P(`M108 ${yy(1100)} Q140 ${yy(1130)} 186 ${yy(1110)} M286 ${yy(1060)} Q330 ${yy(1100)} 374 ${yy(1070)}`, 'none', SLACK.line, 4, 'opacity="0.6"'); // 무릎 주름
  // 구두(앞코가 조금 바깥을 향함)
  s += P(`M80 ${yy(1626)} C60 ${yy(1660)} 54 ${yy(1712)} 70 ${yy(1726)} L190 ${yy(1726)} C196 ${yy(1690)} 192 ${yy(1656)} 184 ${yy(1626)} Z`, SHOE.base, SHOE.line, W);
  s += P(`M304 ${yy(1648)} C298 ${yy(1690)} 300 ${yy(1730)} 318 ${yy(1752)} L436 ${yy(1758)} C452 ${yy(1740)} 438 ${yy(1690)} 404 ${yy(1650)} Z`, SHOE.shade, SHOE.line, W);
  // 블레이저 몸통(초상화 아래 단보다 조금 위에서 시작해 단 뒤로 이어짐) + 아랫단 앞트임
  s += P(`M84 ${yy(-40)} L368 ${yy(-40)} C368 ${yy(150)} 362 ${yy(300)} 362 ${yy(380)} C366 ${yy(470)} 372 ${yy(540)} 378 ${yy(604)} C326 ${yy(620)} 264 ${yy(624)} 236 ${yy(616)} L228 ${yy(500)} L218 ${yy(614)} C188 ${yy(620)} 126 ${yy(616)} 76 ${yy(598)} C80 ${yy(540)} 86 ${yy(470)} 90 ${yy(380)} C90 ${yy(300)} 84 ${yy(150)} 84 ${yy(-40)} Z`, NAVYB.base, NAVYB.line, W);
  s += P(`M300 ${yy(-40)} L368 ${yy(-40)} C368 ${yy(150)} 362 ${yy(300)} 362 ${yy(380)} C366 ${yy(470)} 372 ${yy(540)} 378 ${yy(604)} C352 ${yy(610)} 328 ${yy(616)} 308 ${yy(618)} C312 ${yy(380)} 306 ${yy(150)} 300 ${yy(-40)} Z`, NAVYB.shade, 'none');
  // 넥타이 끝(단추 위로 조금) + 앞여밈 선 + 단추 둘
  s += P(`M203 ${yy(-20)} L223 ${yy(-20)} L222 ${yy(70)} L213 ${yy(84)} L204 ${yy(70)} Z`, '#5a2c3c', NAVYB.line, 4);
  s += P(`M186 ${yy(40)} C204 ${yy(70)} 220 ${yy(90)} 226 ${yy(110)} L228 ${yy(500)}`, 'none', NAVYB.line, 5);
  s += `<circle cx="227" cy="${yy(130)}" r="9" fill="#8a7448"/><circle cx="228" cy="${yy(350)}" r="9" fill="#8a7448"/>`;
  s += P(`M120 ${yy(300)} Q170 ${yy(330)} 210 ${yy(320)} M250 ${yy(330)} Q300 ${yy(336)} 340 ${yy(300)}`, 'none', NAVYB.line, 4, 'opacity="0.5"'); // 허리 주름
  return s;
}
// 팔: 초상화 가장자리(위팔)에서 이어져 놀라 몸에서 조금 떨어지게 벌리고 팔꿈치를 굽힘(양쪽 각도를 다르게), 손은 반쯤 펴짐
function boyArms() {
  const W = 7;
  // 그림 왼쪽 팔: 팔꿈치를 바깥으로, 아래팔은 엉덩이 옆으로 조금 들림
  const armL = `M12 ${yy(-40)} L90 ${yy(-40)} C92 ${yy(90)} 86 ${yy(200)} 72 ${yy(290)} C58 ${yy(380)} 40 ${yy(460)} 26 ${yy(540)} L-40 ${yy(512)} C-28 ${yy(430)} -18 ${yy(360)} -10 ${yy(290)} C-2 ${yy(170)} 4 ${yy(60)} 12 ${yy(-40)} Z`;
  const handL = `M-42 ${yy(506)} C-60 ${yy(546)} -74 ${yy(586)} -78 ${yy(626)} C-80 ${yy(646)} -68 ${yy(650)} -62 ${yy(632)} L-56 ${yy(610)} ` +
    `C-58 ${yy(640)} -56 ${yy(668)} -48 ${yy(684)} C-40 ${yy(694)} -30 ${yy(686)} -32 ${yy(670)} L-30 ${yy(632)} ` +
    `C-22 ${yy(660)} -14 ${yy(676)} -4 ${yy(680)} C6 ${yy(682)} 10 ${yy(670)} 4 ${yy(658)} C-2 ${yy(640)} 2 ${yy(610)} 10 ${yy(590)} ` +
    `C20 ${yy(588)} 32 ${yy(576)} 30 ${yy(560)} L28 ${yy(540)} Z`;
  // 그림 오른쪽 팔: 경보 쪽으로 조금 더 들려 손바닥이 앞을 향함(멈칫)
  const armR = `M362 ${yy(-40)} L440 ${yy(-40)} C452 ${yy(60)} 466 ${yy(160)} 474 ${yy(250)} C486 ${yy(330)} 500 ${yy(400)} 512 ${yy(466)} L448 ${yy(494)} C436 ${yy(424)} 418 ${yy(350)} 404 ${yy(280)} C392 ${yy(190)} 376 ${yy(90)} 362 ${yy(-40)} Z`;
  const handR = `M448 ${yy(490)} C452 ${yy(530)} 462 ${yy(566)} 478 ${yy(596)} C486 ${yy(612)} 498 ${yy(606)} 494 ${yy(590)} L488 ${yy(566)} ` +
    `C500 ${yy(596)} 512 ${yy(620)} 526 ${yy(630)} C538 ${yy(638)} 546 ${yy(626)} 538 ${yy(612)} L520 ${yy(576)} ` +
    `C534 ${yy(596)} 546 ${yy(606)} 556 ${yy(604)} C566 ${yy(600)} 564 ${yy(588)} 554 ${yy(578)} C540 ${yy(560)} 528 ${yy(530)} 522 ${yy(500)} ` +
    `C532 ${yy(494)} 540 ${yy(482)} 536 ${yy(470)} L512 ${yy(464)} Z`;
  let s = P(armL, NAVYB.base, NAVYB.line, W) + P(armR, NAVYB.shade, NAVYB.line, W);
  s += P(`M4 ${yy(240)} C-2 ${yy(320)} -12 ${yy(400)} -24 ${yy(490)} L-10 ${yy(494)} C0 ${yy(410)} 10 ${yy(330)} 20 ${yy(250)} Z`, '#3a4468', 'none', 0, 'opacity="0.55"');
  s += P(`M30 ${yy(270)} Q50 ${yy(300)} 70 ${yy(296)} M418 ${yy(270)} Q440 ${yy(300)} 470 ${yy(290)}`, 'none', NAVYB.line, 4, 'opacity="0.6"'); // 팔꿈치 주름
  s += P(handL, SKIN.shade, SKIN.line, 5) + P(handR, SKIN.base, SKIN.line, 5);
  return s;
}
function boy() {
  const foot = pr(BOY_AT);
  const T = `translate(${f1(foot[0] - CXP * BK)} ${f1(foot[1] - (H0 + (SOLE - H0) * SQ) * BK)}) scale(${BK})`;
  const lower = `<g transform="translate(0 ${H0}) scale(1 ${SQ}) translate(0 ${-H0})">${boyLower()}${boyArms()}</g>`;
  const bust = `<image href="${HM.uri}" x="0" y="0" width="${HM.w}" height="${HM.h}" preserveAspectRatio="none" filter="url(#${ID}bustG)"/>`;
  // 얼굴 왼쪽 반 그늘 + 가슴 아래로 갈수록 짙어지는 그늘(잘린 단을 녹임)
  const shade = `<g mask="url(#${ID}boyA)"><rect x="-40" y="-40" width="${HM.w + 80}" height="${SOLE + 80}" fill="url(#${ID}halfG)"/>` +
    `<rect x="-40" y="-40" width="${HM.w + 80}" height="${SOLE + 80}" fill="url(#${ID}lowG)"/>` +
    `<rect x="-40" y="-40" width="${HM.w + 80}" height="${SOLE + 80}" fill="url(#${ID}goldG)" style="mix-blend-mode:screen"/></g>`;
  const sh = `<ellipse cx="${f1(foot[0] + 4)}" cy="${f1(foot[1] - 1)}" rx="46" ry="12" fill="#000" opacity="0.55" filter="url(#${ID}b3)"/>`;
  return sh + `<g id="${ID}boyG" transform="${T}"><g id="${ID}boyC">${lower}${bust}</g></g>` +
    `<g transform="${T}">${shade}<g mask="url(#${ID}rimBM)"><use href="#${ID}boyC" filter="url(#${ID}rimB)"/></g></g>`;
}
const boyDefs = () =>
  `<filter id="${ID}bustG" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.86 0 0 0 0  0 0.84 0 0 0  0 0 0.88 0 0  0 0 0 1 0"/></filter>` +
  `<mask id="${ID}boyA" maskUnits="userSpaceOnUse" x="-100" y="-100" width="${HM.w + 200}" height="${SOLE + 200}" style="mask-type:alpha"><g transform="translate(0 ${H0}) scale(1 ${SQ}) translate(0 ${-H0})">${boyLower()}${boyArms()}</g><image href="${HM.uri}" x="0" y="0" width="${HM.w}" height="${HM.h}"/></mask>` +
  `<linearGradient id="${ID}halfG" gradientUnits="userSpaceOnUse" x1="${f1(CXP * 0.6)}" y1="0" x2="${f1(CXP * 1.1)}" y2="0"><stop offset="0" stop-color="#1a0c12" stop-opacity="0.55"/><stop offset="1" stop-color="#1a0c12" stop-opacity="0"/></linearGradient>` +
  // 앞쪽 바닥 문양의 흐린 금빛이 몸 앞·아래(그림 오른쪽 아래)에 아주 약하게
  `<linearGradient id="${ID}goldG" gradientUnits="userSpaceOnUse" x1="${HM.w}" y1="${SOLE}" x2="0" y2="${H0 - 200}"><stop offset="0" stop-color="#c9a466" stop-opacity="0.14"/><stop offset="1" stop-color="#c9a466" stop-opacity="0"/></linearGradient>` +
  `<linearGradient id="${ID}lowG" gradientUnits="userSpaceOnUse" x1="0" y1="${H0 - 120}" x2="0" y2="${H0 + 420}"><stop offset="0" stop-color="#08060a" stop-opacity="0"/><stop offset="0.35" stop-color="#08060a" stop-opacity="0.45"/><stop offset="1" stop-color="#08060a" stop-opacity="0.76"/></linearGradient>` +
  // 머리·어깨 위쪽 가장자리에 경보등 쪽(오른쪽 위)에서 오는 붉은 테두리 빛
  `<filter id="${ID}rimB" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">` +
  `<feMorphology in="SourceAlpha" operator="erode" radius="5" result="er"/><feOffset in="er" dx="-16" dy="16" result="o"/>` +
  `<feComposite in="er" in2="o" operator="out" result="r"/><feGaussianBlur in="r" stdDeviation="6" result="rb"/>` +
  `<feFlood flood-color="#ff9c84"/><feComposite in2="rb" operator="in" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="c"/></feMerge></filter>` +
  `<linearGradient id="${ID}rimBG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H0 + 300}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/></linearGradient>` +
  `<mask id="${ID}rimBM" maskUnits="userSpaceOnUse" x="-100" y="-100" width="${HM.w + 200}" height="${SOLE + 200}"><rect x="-100" y="-100" width="${HM.w + 200}" height="${SOLE + 200}" fill="url(#${ID}rimBG)"/></mask>`;

// ---------------------------------------------------------------- 그리기
export function draw() {
  const lampP = pr(LAMP);
  const defs =
    `<style>@font-face{font-family:'SerifKR';src:url(data:font/woff2;base64,${GEUM}) format('woff2');}</style>` +
    boyDefs() + moonMask() +
    `<filter id="${ID}blk" x="-5%" y="-5%" width="110%" height="110%"><feFlood flood-color="#000"/><feComposite in2="SourceAlpha" operator="in"/></filter>` +
    `<mask id="${ID}noBoy" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="#fff"/><use href="#${ID}boyG" filter="url(#${ID}blk)"/></mask>` +
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
