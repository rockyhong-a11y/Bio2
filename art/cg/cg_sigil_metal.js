// cg_sigil_metal — 기계실습실을 높은 곳에서 내려다본 장면. 경보 벨이 울리고 붉은 경보등이 방을 물들인다.
// 돌바닥 한가운데 새겨진 문양이 바랜 금빛으로 희미하게 빛난다(네온 마법진 아님):
//   바깥 고리 두 겹(사이에 짧은 막대와 작은 마름모가 번갈아) + 꼭짓점이 안쪽 고리에 닿는 오각별(꼭짓점마다 작은 원)
//   + 별 선이 멈추는 가운데 작은 고리 속 '金' 한 글자.
// 둘레: 종이 한 장 놓인 작업대, 그늘 속 선반·밀링 기계, 무거운 철제 금고와 꺼진 램프 넷 달린 배전반,
// 왼쪽 위 벽 높이 잘려 열린 환기구, 닫힌 철문, 창으로 드는 가는 달빛. 희민은 환기구 아래에 작게, 막 내려와 굳어 선 채 문양 쪽을 본다.
import fs from 'fs';
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'sm';
const EINK = '#07060a';
const GEUM = fs.readFileSync(new URL('../fonts/noto-serif-kr-geum.woff2', import.meta.url)).toString('base64');

// ---------------------------------------------------------------- 카메라(높은 시점, 아래로 기울임)
// 세계 좌표(m): x 오른쪽, y 위, z 안쪽. 바닥 y=0. 방: x -3.5..3.5, z -1..7(뒷벽), 높이 3.2
const CAM = [0.25, 5.3, -1.1], PITCH = 50 * Math.PI / 180, FOC = 1120, C0 = [512, 690];
const cs = Math.cos(PITCH), sn = Math.sin(PITCH);
function pr([x, y, z]) {
  const dx = x - CAM[0], dy = y - CAM[1], dz = z - CAM[2];
  const yc = dy * cs + dz * sn, zc = -dy * sn + dz * cs;
  return [C0[0] + FOC * dx / zc, C0[1] - FOC * yc / zc];
}
const depth = ([x, y, z]) => -(y - CAM[1]) * sn + (z - CAM[2]) * cs;
const poly3 = pts => 'M' + pts.map(p => pt(pr(p))).join(' L') + ' Z';
const line3 = pts => 'M' + pts.map(p => pt(pr(p))).join(' L');
const RX = 3.5, BZ = 7, RH = 3.2;

// 상자: 보이는 면(윗면·앞면·옆면)을 칠함. col = { top, front, side, line }
function box(x0, x1, y0, y1, z0, z1, col, lw = 2.5) {
  let s = '';
  s += P(poly3([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]), col.top, col.line || EINK, lw);
  if (CAM[0] < x0) s += P(poly3([[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]]), col.side, col.line || EINK, lw);
  if (CAM[0] > x1) s += P(poly3([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]), col.side, col.line || EINK, lw);
  s += P(poly3([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]]), col.front, col.line || EINK, lw);
  return s;
}
// 벽면 위 직사각형(뒷벽 z=BZ)
const onBack = (x0, x1, y0, y1, z = BZ) => poly3([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]);

// ---------------------------------------------------------------- 방
function room() {
  let s = '';
  // 뒷벽·왼벽·오른벽·바닥
  s += P(onBack(-RX, RX, 0, RH + 1), '#1e2026', EINK, 3);
  s += P(poly3([[-RX, 0, -1], [-RX, 0, BZ], [-RX, RH + 1, BZ], [-RX, RH + 1, -1]]), '#17191e', EINK, 3);
  s += P(poly3([[RX, 0, -1], [RX, 0, BZ], [RX, RH + 1, BZ], [RX, RH + 1, -1]]), '#1a1c22', EINK, 3);
  s += P(poly3([[-RX, 0, -1.5], [RX, 0, -1.5], [RX, 0, BZ], [-RX, 0, BZ]]), '#2b2d33', EINK, 3);
  // 벽 아래쪽 띠(페인트 경계) + 걸레받이
  s += P(onBack(-RX, RX, 0, 1.2), '#25272e', 'none') + P(line3([[-RX, 1.2, BZ], [RX, 1.2, BZ]]), 'none', '#101116', 3);
  s += P(poly3([[-RX, 0, -1], [-RX, 0, BZ], [-RX, 1.2, BZ], [-RX, 1.2, -1]]), '#1d1f25', 'none');
  s += P(line3([[-RX, 1.2, BZ], [-RX, 1.2, -1]]), 'none', '#101116', 3);
  // 돌바닥 판석 줄눈
  let g = '';
  for (let x = -3.5; x <= 3.51; x += 0.7) g += line3([[x, 0, -1.5], [x, 0, BZ]]) + ' ';
  for (let z = -1.4; z <= BZ; z += 0.7) g += line3([[-RX, 0, z], [RX, 0, z]]) + ' ';
  s += P(g, 'none', '#16171b', 2.2);
  // 바닥의 얼룩(기름 자국)
  s += `<g filter="url(#${ID}b6)" opacity="0.5">` + P(poly3([[-1.9, 0, 1.6], [-1.2, 0, 1.4], [-0.9, 0, 2.0], [-1.6, 0, 2.3]]), '#18191d') + P(poly3([[1.6, 0, 5.2], [2.3, 0, 5.0], [2.4, 0, 5.6], [1.8, 0, 5.8]]), '#18191d') + '</g>';
  return s;
}

// 창(뒷벽 오른쪽 위) + 바닥에 떨어진 가는 달빛
function windowAndMoon() {
  let s = P(onBack(1.75, 3.15, 1.95, 2.85), '#0b1424', EINK, 3);
  s += P(onBack(1.82, 3.08, 2.02, 2.78), '#24375a', 'none');
  s += P(line3([[2.45, 1.95, BZ], [2.45, 2.85, BZ]]) + ' ' + line3([[1.75, 2.4, BZ], [3.15, 2.4, BZ]]), 'none', '#0b0f17', 5);
  s += P(onBack(1.82, 2.4, 2.02, 2.38), '#6f8cbf', 'none', 0, 'opacity="0.45"');
  s += P(line3([[1.75, 1.95, BZ], [3.15, 1.95, BZ]]), 'none', '#4a5d80', 3);
  return s;
}
function moonBeam() {
  // 창에서 바닥으로 비스듬히 떨어진 좁은 빛줄기(바닥 위 평행사변형)
  const q = [[0.9, 0, 6.6], [1.5, 0, 6.6], [0.2, 0, 1.0], [-0.35, 0, 1.0]];
  return P(poly3([q[0], q[1], q[2], q[3]]), '#8fb0e6', 'none', 0, `opacity="0.2" filter="url(#${ID}b6)"`) +
    P(poly3([[1.0, 0, 6.4], [1.3, 0, 6.4], [0.05, 0, 1.3], [-0.2, 0, 1.3]]), '#b9d0f6', 'none', 0, `opacity="0.12" filter="url(#${ID}b6)"`);
}

// 닫힌 철문(뒷벽 가운데 왼쪽)
function ironDoor() {
  const x0 = -0.95, x1 = 0.15, h = 2.1;
  let s = P(onBack(x0 - 0.08, x1 + 0.08, 0, h + 0.08), '#101116', EINK, 3);
  s += P(onBack(x0, x1, 0, h), '#3a3d45', EINK, 3);
  s += P(onBack(x0 + 0.08, x1 - 0.08, 1.15, h - 0.1), 'none', '#24262c', 3) + P(onBack(x0 + 0.08, x1 - 0.08, 0.1, 1.0), 'none', '#24262c', 3);
  let rv = '';
  for (const [x, y] of [[x0 + 0.05, 0.05], [x1 - 0.05, 0.05], [x0 + 0.05, h - 0.05], [x1 - 0.05, h - 0.05], [x0 + 0.05, 1.07], [x1 - 0.05, 1.07]]) {
    const p = pr([x, y, BZ]);
    rv += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.6" fill="#5a5e68"/>`;
  }
  s += rv;
  s += P(onBack(x1 - 0.2, x1 - 0.1, 0.95, 1.12), '#6b6f79', EINK, 2); // 손잡이
  return s;
}

// 경보 벨(문 오른쪽 위): 둥근 종 + 망치, 떨림을 가로 흐림으로
function alarmBell() {
  const c = pr([0.75, 2.35, BZ]);
  const r = 26;
  let bell = `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="#a3302c" stroke="${EINK}" stroke-width="3"/>` +
    `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r * 0.55}" fill="none" stroke="#6b1a18" stroke-width="3"/>` +
    `<ellipse cx="${f1(c[0] - 8)}" cy="${f1(c[1] - 9)}" rx="8" ry="5" fill="#e46d5f" opacity="0.8"/>`;
  let s = `<rect x="${f1(c[0] - 8)}" y="${f1(c[1] + r - 4)}" width="16" height="24" fill="#2a2b30" stroke="${EINK}" stroke-width="2"/>`; // 받침
  s += P(`M${f1(c[0] + 4)} ${f1(c[1] + r + 6)} L${f1(c[0] + 16)} ${f1(c[1] + r - 2)}`, 'none', '#55575e', 4);
  s += `<g filter="url(#${ID}mblur)" opacity="0.55"><g transform="translate(-7 0)">${bell}</g><g transform="translate(7 0)">${bell}</g></g>`;
  s += bell;
  // 떨림 자국(짧은 호 두 줄, 벨 양옆 — 벨 그림의 일부)
  s += P(`M${f1(c[0] - r - 10)} ${f1(c[1] - 14)} Q${f1(c[0] - r - 18)} ${f1(c[1])} ${f1(c[0] - r - 10)} ${f1(c[1] + 14)} M${f1(c[0] + r + 10)} ${f1(c[1] - 14)} Q${f1(c[0] + r + 18)} ${f1(c[1])} ${f1(c[0] + r + 10)} ${f1(c[1] + 14)}`, 'none', '#ff9a8a', 2.5, 'opacity="0.55"');
  // 붉은 경보등(벨 옆 작은 램프)
  const l = pr([1.2, 2.5, BZ]);
  s += `<circle cx="${f1(l[0])}" cy="${f1(l[1])}" r="60" fill="#ff2a2a" opacity="0.45" filter="url(#${ID}b20)"/>`;
  s += `<rect x="${f1(l[0] - 9)}" y="${f1(l[1] - 6)}" width="18" height="22" rx="3" fill="#2a2b30" stroke="${EINK}" stroke-width="2"/>`;
  s += `<path d="M${f1(l[0] - 11)} ${f1(l[1] - 4)} A11 13 0 0 1 ${f1(l[0] + 11)} ${f1(l[1] - 4)} Z" fill="#ff5a4e" stroke="${EINK}" stroke-width="2"/>`;
  s += `<ellipse cx="${f1(l[0] - 3)}" cy="${f1(l[1] - 11)}" rx="4" ry="3" fill="#ffd2c8"/>`;
  return s;
}

// 잘려 열린 환기구(왼쪽 위 벽 높이): 검은 구멍 + 잘린 테두리, 떼어 낸 격자 덮개는 바닥에
function vent() {
  const x0 = -2.85, x1 = -2.05, y0 = 2.15, y1 = 2.62;
  let s = P(onBack(x0 - 0.06, x1 + 0.06, y0 - 0.06, y1 + 0.06), '#4a4d55', EINK, 2.5);
  s += P(onBack(x0, x1, y0, y1), '#030304', EINK, 2.5);
  // 안쪽 덕트 깊이(위·오른쪽 안벽)
  s += P(poly3([[x0, y1, BZ], [x1, y1, BZ], [x1 - 0.06, y1 - 0.05, BZ + 0.5], [x0 + 0.06, y1 - 0.05, BZ + 0.5]]), '#15161a', 'none');
  // 잘린 격자 끄트머리(테두리에 남은 날카로운 쇠 조각)
  let stubs = '';
  for (let k = 1; k < 7; k++) {
    const x = x0 + (x1 - x0) * k / 7;
    stubs += line3([[x, y1, BZ], [x, y1 - 0.05, BZ]]) + ' ' + line3([[x, y0, BZ], [x + 0.01, y0 + 0.04, BZ]]) + ' ';
  }
  s += P(stubs, 'none', '#8a8e98', 2.5);
  // 바닥에 떨어진 격자 덮개(비스듬히)
  const g = [[-2.95, 0.02, 6.2], [-2.2, 0.02, 6.05], [-2.12, 0.02, 6.5], [-2.86, 0.02, 6.66]];
  s += P(poly3(g), '#5a5e68', EINK, 2.5);
  let bars = '';
  for (let k = 1; k < 7; k++) {
    const t = k / 7;
    const a = [g[0][0] + (g[1][0] - g[0][0]) * t, 0.03, g[0][2] + (g[1][2] - g[0][2]) * t];
    const b = [g[3][0] + (g[2][0] - g[3][0]) * t, 0.03, g[3][2] + (g[2][2] - g[3][2]) * t];
    bars += line3([a, b]) + ' ';
  }
  s += P(bars, 'none', '#2a2c32', 2.5);
  return s;
}

// 배전반(꺼진 램프 넷) + 금고
function switchboard() {
  const x0 = 1.1, x1 = 1.7, y0 = 0.95, y1 = 1.65;
  let s = P(onBack(x0, x1, y0, y1, BZ - 0.02), '#4b4e57', EINK, 2.5);
  s += P(onBack(x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, BZ - 0.03), '#3b3e46', '#24262b', 1.5);
  for (let k = 0; k < 4; k++) {
    const p = pr([x0 + 0.12 + k * 0.12, y1 - 0.15, BZ - 0.03]);
    s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="5.5" fill="#26282d" stroke="${EINK}" stroke-width="1.8"/><circle cx="${f1(p[0] - 1.5)}" cy="${f1(p[1] - 1.5)}" r="1.6" fill="#6a6e78"/>`;
    const q = pr([x0 + 0.12 + k * 0.12, y0 + 0.2, BZ - 0.03]);
    s += `<rect x="${f1(q[0] - 3)}" y="${f1(q[1] - 9)}" width="6" height="14" rx="2" fill="#16171a" stroke="${EINK}" stroke-width="1"/>`;
  }
  s += P(line3([[x0 + 0.3, y0, BZ - 0.02], [x0 + 0.3, 0.2, BZ - 0.02]]), 'none', '#16171b', 4); // 배선관
  return s;
}
function safe() {
  const x0 = 2.25, x1 = 3.3, z0 = 6.15, z1 = 6.95, h = 1.35;
  let s = box(x0, x1, 0, h, z0, z1, { top: '#5b5f69', front: '#454952', side: '#363940' }, 3);
  const F = (x, y) => pr([x, y, z0]);
  s += P(poly3([[x0 + 0.08, 0.1, z0], [x1 - 0.08, 0.1, z0], [x1 - 0.08, h - 0.1, z0], [x0 + 0.08, h - 0.1, z0]]), 'none', '#2b2d33', 3);
  const d = F(x0 + 0.42, 0.85), w = F(x0 + 0.42, 0.48);
  s += `<circle cx="${f1(d[0])}" cy="${f1(d[1])}" r="13" fill="#8c9099" stroke="${EINK}" stroke-width="2.5"/><circle cx="${f1(d[0])}" cy="${f1(d[1])}" r="4" fill="#3a3c43"/>`;
  s += `<circle cx="${f1(w[0])}" cy="${f1(w[1])}" r="16" fill="none" stroke="#9a9ea8" stroke-width="3"/>` +
    P(`M${f1(w[0] - 16)} ${f1(w[1])} L${f1(w[0] + 16)} ${f1(w[1])} M${f1(w[0])} ${f1(w[1] - 16)} L${f1(w[0])} ${f1(w[1] + 16)}`, 'none', '#9a9ea8', 3);
  const hg = F(x1 - 0.1, 1.0), hg2 = F(x1 - 0.1, 0.35);
  s += `<rect x="${f1(hg[0] - 4)}" y="${f1(hg[1])}" width="8" height="12" fill="#22242a"/><rect x="${f1(hg2[0] - 4)}" y="${f1(hg2[1])}" width="8" height="12" fill="#22242a"/>`;
  s += P(line3([[x0, h, z0], [x1, h, z0]]), 'none', '#9fb8e2', 2, 'opacity="0.4"'); // 윗모서리 달빛
  return s;
}

// 밀링 기계(오른쪽): 받침 + 기둥 + 머리 + 작업대
function millingMachine() {
  const c = { top: '#3d4a44', front: '#2f3a35', side: '#26302b' };
  let s = '';
  s += box(2.35, 3.25, 0, 0.9, 3.9, 4.8, c);
  s += box(2.55, 3.05, 0.9, 1.9, 4.35, 4.8, c);
  s += box(2.45, 3.15, 1.9, 2.15, 3.95, 4.8, c);
  s += box(2.68, 2.84, 1.5, 1.9, 4.05, 4.2, { top: '#7c838d', front: '#5b616a', side: '#4a4f57' }, 2); // 주축
  s += box(2.2, 3.4, 0.9, 1.02, 3.8, 4.35, { top: '#525a60', front: '#3c4348', side: '#30363a' }); // 작업대
  return s;
}

// 선반(왼쪽 벽을 따라): 긴 받침대 + 주축대 + 척 + 심압대
function lathe(z0, z1) {
  const c = { top: '#3d4a44', front: '#2f3a35', side: '#26302b' };
  let s = box(-3.3, -2.55, 0, 0.85, z0, z1, c);
  s += box(-3.25, -2.6, 0.85, 1.05, z0 + 0.05, z1 - 0.05, { top: '#4c5753', front: '#38423e', side: '#2e3733' });
  s += box(-3.3, -2.55, 1.05, 1.45, z1 - 0.55, z1, c); // 주축대(안쪽 끝)
  const ch = pr([-2.92, 1.25, z1 - 0.6]);
  s += `<ellipse cx="${f1(ch[0])}" cy="${f1(ch[1])}" rx="17" ry="12" fill="#6a7079" stroke="${EINK}" stroke-width="2.5"/>`;
  s += box(-3.2, -2.68, 1.05, 1.3, z0 + 0.1, z0 + 0.4, c); // 심압대
  s += box(-2.98, -2.86, 1.12, 1.18, z0 + 0.4, z1 - 0.62, { top: '#8b919a', front: '#6a7079', side: '#5a6068' }, 1.5); // 가공물 봉
  return s;
}

// 작업대(앞쪽 왼쪽) + 종이 한 장
function workbench() {
  const x0 = -2.25, x1 = -0.75, z0 = 0.35, z1 = 1.15, h = 0.86;
  let s = '';
  // 다리
  for (const [x, z] of [[x0 + 0.06, z0 + 0.06], [x1 - 0.1, z0 + 0.06]]) s += box(x, x + 0.06, 0, h - 0.06, z, z + 0.06, { top: '#2a2b30', front: '#2a2b30', side: '#1f2024' }, 2);
  s += box(x0, x1, h - 0.07, h, z0, z1, { top: '#5a4632', front: '#3b2d20', side: '#33271c' }, 3);
  s += box(x0 + 0.05, x1 - 0.05, 0.12, 0.17, z0 + 0.05, z1 - 0.05, { top: '#2e2a26', front: '#24211e', side: '#1c1a18' }, 2); // 아래 선반
  // 종이 한 장(살짝 비스듬히)
  s += P(poly3([[-1.75, h + 0.005, 0.55], [-1.35, h + 0.005, 0.5], [-1.29, h + 0.005, 0.95], [-1.7, h + 0.005, 1.0]]), '#d8d2c2', EINK, 2);
  s += P(line3([[-1.65, h + 0.006, 0.65], [-1.42, h + 0.006, 0.62]]) + ' ' + line3([[-1.64, h + 0.006, 0.74], [-1.4, h + 0.006, 0.71]]) + ' ' + line3([[-1.62, h + 0.006, 0.83], [-1.45, h + 0.006, 0.81]]), 'none', '#9c9585', 2, 'opacity="0.7"'); // 손글씨 흔적(읽히지 않는 선)
  // 공구 몇 개
  s += P(line3([[-2.1, h + 0.01, 0.6], [-1.9, h + 0.01, 0.9]]), 'none', '#7c828c', 5) + P(line3([[-1.0, h + 0.01, 0.5], [-0.9, h + 0.01, 0.85]]), 'none', '#6a5038', 6);
  return s;
}

// ---------------------------------------------------------------- 바닥 문양
// 지역 좌표(u, v: m) → 바닥(y=0)의 중심 SC 주변, 모든 점을 실제 투시로
const SC = [0.15, 0, 3.35], SR = 1.62;
const sp = (u, v) => pr([SC[0] + u, 0, SC[2] + v]);
const ring = (r, n = 96) => 'M' + Array.from({ length: n }, (_, i) => pt(sp(r * Math.cos(2 * Math.PI * i / n), r * Math.sin(2 * Math.PI * i / n)))).join(' L') + ' Z';
function sigilGeom() {
  const R1 = SR, R2 = SR * 0.88, RC = SR * 0.3;
  let rings = ring(R1) + ' ' + ring(R2);
  // 두 고리 사이: 짧은 막대와 작은 마름모를 번갈아
  let bars = '', dias = '';
  const N = 40, rm = (R1 + R2) / 2, hw = (R1 - R2) * 0.32;
  for (let i = 0; i < N; i++) {
    const a = 2 * Math.PI * i / N;
    const ca = Math.cos(a), sa = Math.sin(a);
    if (i % 2 === 0) bars += `M${pt(sp(ca * (rm - hw), sa * (rm - hw)))} L${pt(sp(ca * (rm + hw), sa * (rm + hw)))} `;
    else {
      const d = (R1 - R2) * 0.18, ta = [-sa, ca];
      dias += `M${pt(sp(ca * (rm - d), sa * (rm - d)))} L${pt(sp(ca * rm + ta[0] * d, sa * rm + ta[1] * d))} L${pt(sp(ca * (rm + d), sa * (rm + d)))} L${pt(sp(ca * rm - ta[0] * d, sa * rm - ta[1] * d))} Z `;
    }
  }
  // 오각별: 꼭짓점이 안쪽 고리(R2)에 닿고, 선은 가운데 고리(RC)에서 멈춤
  const V = Array.from({ length: 5 }, (_, k) => { const a = -Math.PI / 2 + 2 * Math.PI * k / 5; return [R2 * Math.cos(a), R2 * Math.sin(a)]; });
  let star = '';
  for (let k = 0; k < 5; k++) {
    const A = V[k], B = V[(k + 2) % 5];
    // A→B 선분 중 가운데 고리 안쪽은 빼고 그림
    const segs = clipOutside(A, B, RC);
    for (const [p, q] of segs) star += `M${pt(sp(...p))} L${pt(sp(...q))} `;
  }
  let caps = '';
  for (const [u, v] of V) caps += ring0(u, v, (R1 - R2) * 0.55) + ' ';
  return { rings, bars, dias, star, caps, center: ring(RC, 64) };
}
// 꼭짓점의 작은 원(바닥 위 원을 투시)
function ring0(cu, cv, r, n = 24) {
  return 'M' + Array.from({ length: n }, (_, i) => pt(sp(cu + r * Math.cos(2 * Math.PI * i / n), cv + r * Math.sin(2 * Math.PI * i / n)))).join(' L') + ' Z';
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
// 金: 바닥 면에 눕힌 글자(가운데에서의 투시를 아핀 근사)
function geumMatrix() {
  const o = sp(0, 0), eu = sp(0.01, 0), ev = sp(0, 0.01);
  // 글자 좌표 1단위 = 1mm. 위쪽(-y)이 안쪽(+v, 뒷벽 쪽)을 향하게
  const a = (eu[0] - o[0]) / 10, b = (eu[1] - o[1]) / 10, c = -(ev[0] - o[0]) / 10, d = -(ev[1] - o[1]) / 10;
  return `matrix(${a.toFixed(4)} ${b.toFixed(4)} ${c.toFixed(4)} ${d.toFixed(4)} ${f1(o[0])} ${f1(o[1])})`;
}
function sigil() {
  const g = sigilGeom();
  const all = `${g.rings} ${g.bars} ${g.star} ${g.center}`;
  const text = (fill, extra = '') => `<text x="0" y="0" transform="${geumMatrix()}" font-family="SerifKR" font-weight="700" font-size="400" text-anchor="middle" dominant-baseline="central" fill="${fill}" ${extra}>金</text>`;
  let s = '';
  // 바닥에 스민 아주 흐린 금빛(문양 둘레)
  s += `<path d="${ring(SR * 1.15)}" fill="#c9a253" opacity="0.13" filter="url(#${ID}b30)"/>`;
  // 새긴 홈: 어두운 그늘(바깥) → 홈 안의 바랜 금빛 → 흐린 번짐
  s += P(all, 'none', '#0c0b0a', 9) + P(g.dias + ' ' + g.caps, '#0c0b0a', '#0c0b0a', 6);
  s += text('#0c0b0a', 'stroke="#0c0b0a" stroke-width="40"');
  s += `<g filter="url(#${ID}b6)" opacity="0.8">` + P(all, 'none', '#d6b264', 7) + P(g.dias + ' ' + g.caps, '#d6b264', '#d6b264', 4) + text('#d6b264') + '</g>';
  s += P(all, 'none', '#c7a560', 3.4) + P(g.dias + ' ' + g.caps, '#b8954f', '#c7a560', 2.4);
  s += text('#c9a862');
  s += P(all, 'none', '#f1dfaa', 1.2, 'opacity="0.6"');
  return s;
}

// ---------------------------------------------------------------- 희민(작게, 환기구 아래): 막 내려와 굳어 선 채 문양 쪽(그림 오른쪽 아래)을 봄
const BOY_AT = [-2.35, 0, 6.35];
function boy() {
  const foot = pr(BOY_AT), head = pr([BOY_AT[0], 1.72, BOY_AT[2]]);
  const k = (foot[1] - head[1]) / 300; // 지역 좌표 300 = 키
  const SK = { base: '#f2d9c9', shade: '#c7a595', line: '#3a2420' }, HR = { base: '#1e1d24', shade: '#0f0e13', hi: '#6a6878' };
  const N = K.NAVY, SL = { base: '#3d3f49', shade: '#2a2c34' };
  let s = '';
  // 지역 좌표: 정수리 (0,0), 발바닥 y=300, 몸은 그림 오른쪽으로 살짝 돌림
  // 발그림자
  s += `<ellipse cx="4" cy="300" rx="34" ry="8" fill="#000" opacity="0.45"/>`;
  // 다리(조금 벌리고 버팀) + 구두
  s += P('M-14 168 L-24 292 L-6 294 L2 182 Z', SL.base, EINK, 2.2) + P('M2 182 L12 294 L30 292 L20 168 Z', SL.shade, EINK, 2.2);
  s += P('M-28 290 Q-30 300 -18 301 L-4 300 L-5 290 Z', '#3a2a20', EINK, 2) + P('M10 290 L12 300 L28 301 Q38 300 34 290 Z', '#3a2a20', EINK, 2);
  // 몸통(블레이저) — 어깨가 굳어 올라감
  s += P('M-26 70 C-34 74 -38 86 -38 100 L-34 178 L34 178 L38 100 C38 86 34 74 26 70 Z', N.base, EINK, 2.4);
  s += P('M12 72 L26 70 C34 74 38 86 38 100 L34 178 L18 178 Z', N.shade, 'none', 0, 'opacity="0.9"');
  s += P('M-6 72 L6 72 L2 112 Z', K.SHIRT.base, EINK, 1.5) + P('M-1 76 L3 76 L3 108 L0 112 L-2 108 Z', '#6b2131', 'none');
  s += P('M-10 70 L-2 112 L-12 92 Z M10 70 L2 112 L12 92 Z', N.light, EINK, 1.4);
  s += P('M0 112 L0 176', 'none', N.line, 1.6);
  // 팔: 몸에서 살짝 떨어져 뻣뻣하게(놀라 굳음), 손은 펴짐
  s += P('M-34 80 C-46 100 -50 130 -50 158 L-40 160 C-40 132 -36 108 -28 92 Z', N.base, EINK, 2.2);
  s += P('M34 80 C46 100 52 128 54 154 L44 158 C42 130 38 108 30 92 Z', N.shade, EINK, 2.2);
  s += P('M-51 158 C-54 168 -50 178 -44 178 C-40 176 -38 168 -40 160 Z', SK.base, SK.line, 1.6) + P('M45 156 C44 166 48 176 54 175 C58 172 58 162 54 154 Z', SK.shade, SK.line, 1.6);
  // 목 + 얼굴(반쯤 그늘)
  s += P('M-7 56 L-7 72 L7 72 L7 56 Z', SK.shade, SK.line, 1.6);
  s += P('M-22 26 C-23 44 -16 58 -3 62 C10 62 20 52 22 34 C22 14 12 4 0 4 C-12 4 -22 12 -22 26 Z', SK.base, SK.line, 2);
  s += P('M2 8 C14 10 22 22 22 34 C20 52 10 62 -3 62 C6 52 8 34 2 8 Z', SK.shade, 'none', 0, 'opacity="0.95"'); // 얼굴 오른쪽 반 그늘
  // 눈(크게 뜨고 문양 쪽 = 그림 오른쪽 아래를 봄), 굳은 입
  s += `<ellipse cx="-8" cy="36" rx="4.2" ry="5" fill="#fff" stroke="${EINK}" stroke-width="1.4"/><ellipse cx="9" cy="36" rx="4.4" ry="5.2" fill="#e8ddd8" stroke="${EINK}" stroke-width="1.4"/>`;
  s += `<circle cx="-6.6" cy="37.6" r="2.3" fill="#2a1a14"/><circle cx="10.6" cy="37.8" r="2.3" fill="#2a1a14"/>`;
  s += P('M-13 28 Q-8 25 -3 27 M5 27 Q10 25 15 28', 'none', '#241c20', 1.6);
  s += P('M-4 52 L4 52', 'none', '#7a4040', 1.6);
  // 머리카락: 짧고 검은 머리, 들쭉날쭉한 앞머리
  s += P('M-25 30 C-28 12 -18 -2 -2 -3 C14 -4 26 6 26 24 L24 36 L20 26 L16 30 L13 20 L7 26 L3 17 L-2 25 L-7 17 L-11 26 L-16 19 L-19 28 L-22 24 Z', HR.base, EINK, 2);
  s += P('M8 -2 C18 2 26 10 26 24 L24 36 L20 26 L16 30 L13 20 C16 12 14 4 8 -2 Z', HR.shade, 'none', 0, 'opacity="0.9"');
  s += P('M-14 4 Q0 -2 16 6', 'none', HR.hi, 2.4, 'opacity="0.6" stroke-dasharray="8 3 6 3"');
  // 붉은 경보 빛이 몸 왼쪽(벨 쪽 반대) 테두리에, 달빛은 없음
  return `<g transform="translate(${f1(foot[0])} ${f1(head[1])}) scale(${k.toFixed(4)})">${s}</g>`;
}

// ---------------------------------------------------------------- 그리기
export function draw() {
  const defs =
    `<style>@font-face{font-family:'SerifKR';src:url(data:font/woff2;base64,${GEUM}) format('woff2');}</style>` +
    `<filter id="${ID}b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="${ID}mblur" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="5 0.5"/></filter>` +
    // 붉은 경보 빛(곱하기로 방 전체를 물들이고, 벨 쪽에서 가산으로 퍼짐)
    `<radialGradient id="${ID}red" cx="${f1(pr([0.9, 2.4, BZ])[0])}" cy="${f1(pr([0.9, 2.4, BZ])[1])}" r="1250" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#ff7a6a"/><stop offset="0.35" stop-color="#d0444a"/><stop offset="1" stop-color="#5a1824"/></radialGradient>` +
    `<radialGradient id="${ID}redAdd" cx="${f1(pr([0.9, 2.4, BZ])[0])}" cy="${f1(pr([0.9, 2.4, BZ])[1])}" r="700" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#ff3a30" stop-opacity="0.35"/><stop offset="1" stop-color="#ff3a30" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="${f1(sp(0, 0)[0])}" cy="${f1(sp(0, 0)[1] - 60)}" r="900" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    `<linearGradient id="${ID}bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>`;

  let s = `<rect width="1024" height="1536" fill="#0a0a0d"/>`;
  s += room() + windowAndMoon() + ironDoor() + switchboard() + vent();
  s += moonBeam();
  s += sigil();
  // 물체는 먼 것부터
  s += safe() + boy() + millingMachine() + lathe(2.4, 4.6) + lathe(-0.9, 1.4) + workbench();
  // 붉은 경보 빛: 곱하기로 전체를 물들이고(문양의 금빛은 아래에서 다시 살림), 벨 근처는 가산
  s += `<rect width="1024" height="1536" fill="url(#${ID}red)" style="mix-blend-mode:multiply"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}redAdd)" style="mix-blend-mode:screen"/>`;
  s += alarmBell();
  // 문양의 빛은 붉은 빛 위로 은은하게 다시
  s += `<g style="mix-blend-mode:screen" opacity="0.55">${sigilGlowOnly()}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<rect y="1260" width="1024" height="276" fill="url(#${ID}bot)"/>`;
  return K.svg(s, { defs });
}
function sigilGlowOnly() {
  const g = sigilGeom();
  const all = `${g.rings} ${g.bars} ${g.star} ${g.center}`;
  return `<g filter="url(#${ID}b6)">` + P(all, 'none', '#b8944c', 6) + P(g.dias + ' ' + g.caps, '#b8944c', '#b8944c', 3) +
    `<text x="0" y="0" transform="${geumMatrix()}" font-family="SerifKR" font-weight="700" font-size="400" text-anchor="middle" dominant-baseline="central" fill="#b8944c">金</text></g>` +
    P(all, 'none', '#a88a4e', 2.4, 'opacity="0.8"') +
    `<text x="0" y="0" transform="${geumMatrix()}" font-family="SerifKR" font-weight="700" font-size="400" text-anchor="middle" dominant-baseline="central" fill="#a88a4e" opacity="0.8">金</text>`;
}
