// cg_seal — 1장 마지막 컷. 木 패를 끼우자 결계문이 저절로 열린다(히로인 없음, A·B 루트 공용).
// 정면에서 본 낡고 검게 그을린 나무 두짝문(쇠띠 두 줄, 둥근 쇠징, 손잡이 없음)이 안쪽으로 열리며 끝없는 어둠의 복도가 드러난다.
// 문 이음매에 걸쳐 있던 쇠테 원반은 오른쪽 문짝에 붙은 채 木 자가 차가운 청록빛으로 빛난다.
// 문 오른쪽 벽: 이끼 낀 회색 석판의 오각형 홈에 끼운 나무 패(작은 木) — 남색 블레이저 소매의 손 하나가 막 놓는 중.
// 왼쪽: 셔터가 말려 올라간 계단 입구(안쪽에 희미한 초록 비상구 빛), 오른쪽 아래: 복도 저편 자판기의 흐린 붉은빛.
import fs from 'fs';
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#05070a';

const MOK = fs.readFileSync(new URL('../fonts/noto-serif-kr-mok.woff2', import.meta.url)).toString('base64');
const FONT = `<style>@font-face{font-family:'SerifKRMok';src:url(data:font/woff2;base64,${MOK}) format('woff2');}</style>`;

// ---------------------------------------------------------------- 한 점 투시(카메라는 문 한가운데를 정면으로 봄)
const FL = 600, VX = 470, VY = 680, EYE = 1.35;
const pr = (x, y, z) => [VX + FL * x / z, VY - FL * (y - EYE) / z];
const D = 2.1; // 문이 있는 벽까지 거리(m)
const DW = 0.75, DH = 2.6; // 문짝 폭·문 높이
const ALPHA = 42 * Math.PI / 180; // 문짝이 안쪽으로 열린 각도
const CA = Math.cos(ALPHA), SA = Math.sin(ALPHA);
// 문짝 위 한 점: side -1 왼짝, +1 오른짝, a = 경첩에서 떨어진 거리(0..DW), h = 높이
const leafP = (side, a, h) => [side * DW - side * a * CA, h, D + a * SA];
const L3 = (side, a, h) => pr(...leafP(side, a, h));
const wallP = (x, h) => pr(x, h, D);

// 원반 위치(오른짝 자유단, 이음매에 걸침)
const DISC_H = 1.52, DISC_R = 0.31;

// ---------------------------------------------------------------- 오른손(손등이 보이고 손가락은 왼쪽 위로, 엄지는 아래) — 지역 좌표: 손목 (0,0), 손가락 끝 x≈-92
const SKIN = { base: '#e9c6ad', shade: '#b98f7b', line: '#4a2c26' };
function hand() {
  let s = '';
  // 소매(남색 블레이저) + 셔츠 소맷부리
  s += P('M6 -30 C60 -34 140 -40 230 -52 L250 60 C160 56 80 48 10 34 Z', K.NAVY.base, K.NAVY.line, 4);
  s += P('M70 26 C130 34 190 44 246 50 L250 60 C160 56 80 48 10 34 Z', K.NAVY.shade, 'none');
  s += P('M28 -31 C30 -10 30 12 30 35', 'none', K.NAVY.line, 3);
  s += P('M40 -30 C60 -32 90 -35 120 -38', 'none', K.NAVY.light, 5, 'opacity="0.6"');
  for (const [x, y] of [[46, 2], [62, 4]]) s += `<circle cx="${x}" cy="${y}" r="4.5" fill="#b8913a" stroke="#4d3810" stroke-width="2"/>`;
  s += P('M-4 -24 C4 -26 10 -27 16 -28 L18 30 C10 30 2 28 -6 26 Z', K.SHIRT.base, K.SHIRT.line, 3);
  s += P('M6 -26 L8 29', 'none', K.SHIRT.shade, 3);
  // 손가락: 먹선(굵게) → 피부(가늘게). 위에서부터 새끼·약지·중지·검지
  const fingers = [
    'M-42 -22 C-56 -30 -66 -34 -76 -38',
    'M-46 -11 C-62 -16 -76 -20 -90 -22',
    'M-47 1 C-63 -1 -78 -2 -93 -2',
    'M-44 13 C-58 15 -72 17 -85 20',
  ];
  const thumb = 'M-14 16 C-22 26 -32 32 -46 34';
  for (const f of [...fingers, thumb]) s += P(f, 'none', SKIN.line, 17);
  s += P('M0 -24 C-14 -26 -30 -28 -44 -26 C-50 -16 -52 0 -48 16 C-34 20 -18 22 0 20 Z', SKIN.base, SKIN.line, 3.5);
  for (const f of [...fingers, thumb]) s += P(f, 'none', SKIN.base, 10.5);
  // 손등 그늘 · 손가락 마디 · 손톱 끝
  s += P('M-2 8 C-16 12 -32 14 -48 12 L-48 16 C-34 20 -18 22 0 20 Z', SKIN.shade, 'none', 0, 'opacity="0.7"');
  s += P('M-48 18 C-60 21 -72 22 -84 22', 'none', SKIN.shade, 4, 'opacity="0.55"');
  s += P('M-60 -31 l2 4 M-70 -19 l1 5 M-72 -4 l0 5 M-66 13 l-1 5', 'none', SKIN.line, 1.8, 'opacity="0.6"');
  s += P('M-28 -24 C-24 -10 -24 6 -28 18', 'none', SKIN.shade, 2.4, 'opacity="0.6"');
  return s;
}

// ---------------------------------------------------------------- 그리기
export function draw() {
  const rnd = (() => { let q = 7; return () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; }; })();
  // 원반 아핀 변환(오른짝 면 위): 지역 +u = 화면 오른쪽(경첩 쪽), +v = 아래
  const c3 = leafP(1, DW, DISC_H);
  const cC = pr(...c3);
  const cU = pr(c3[0] + DISC_R * CA, DISC_H, c3[2] - DISC_R * SA);
  const cV = pr(c3[0], DISC_H - DISC_R, c3[2]);
  const R = 100; // 원반 지역 반지름(1 m = 400 단위)
  const sDisc = DISC_R / R; // 지역 단위 → m
  const mtxL = `matrix(${[(cU[0] - cC[0]) / DISC_R * sDisc, (cU[1] - cC[1]) / DISC_R * sDisc, (cV[0] - cC[0]) / DISC_R * sDisc, (cV[1] - cC[1]) / DISC_R * sDisc, cC[0], cC[1]].map(v => Math.round(v * 10000) / 10000).join(' ')})`;

  const defs = FONT +
    `<radialGradient id="slGlow" cx="${f1(cC[0])}" cy="${f1(cC[1])}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7fe6dc" stop-opacity="0.75"/><stop offset="0.12" stop-color="#3fb7b3" stop-opacity="0.45"/><stop offset="0.4" stop-color="#1d6a73" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="slFloorGlow" cx="${f1(cC[0])}" cy="1010" r="420" gradientUnits="userSpaceOnUse" gradientTransform="translate(${f1(cC[0])} 1010) scale(1 0.42) translate(${f1(-cC[0])} -1010)"><stop offset="0" stop-color="#5fd0c8" stop-opacity="0.5"/><stop offset="0.4" stop-color="#2a8a8c" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="slReflect" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ff0e6" stop-opacity="0.5"/><stop offset="1" stop-color="#8ff0e6" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="slWallUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1f28"/><stop offset="1" stop-color="#232a33"/></linearGradient>` +
    `<linearGradient id="slFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2227"/><stop offset="1" stop-color="#090b0d"/></linearGradient>` +
    `<linearGradient id="slCeil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050608"/><stop offset="1" stop-color="#11151a"/></linearGradient>` +
    `<linearGradient id="slVoid" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(wallP(0, 0)[1])}" x2="0" y2="${VY}"><stop offset="0" stop-color="#0d1a1c"/><stop offset="1" stop-color="#010203"/></linearGradient>` +
    `<radialGradient id="slRed" cx="1040" cy="1060" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a8232a" stop-opacity="0.5"/><stop offset="0.5" stop-color="#5a1218" stop-opacity="0.14"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="slGreen" cx="40" cy="430" r="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3fae6a" stop-opacity="0.45"/><stop offset="0.5" stop-color="#1f5a38" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="slVig" cx="${f1(cC[0])}" cy="680" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.72" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    `<linearGradient id="slBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></linearGradient>` +
    `<linearGradient id="slReflG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<filter id="slB30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="slB10" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>` +
    `<filter id="slB4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>`;

  const floorY = wallP(0, 0)[1];      // 벽 밑선
  const ceilY = wallP(0, 3.25)[1];    // 벽 윗선
  const wainY = wallP(0, 1.1)[1];     // 허리벽 경계
  let s = `<rect width="1024" height="1536" fill="#07090c"/>`;

  // ---------------- 천장 · 벽 · 바닥
  s += `<rect x="0" y="0" width="1024" height="${f1(ceilY)}" fill="url(#slCeil)"/>`;
  // 꺼진 형광등(벽과 나란히)
  const fx0 = pr(-0.9, 3.25, 1.75), fx1 = pr(0.9, 3.25, 1.75), fy = pr(0, 3.25, 1.95);
  s += P(`M${f1(fx0[0])} ${f1(fy[1])} L${f1(fx1[0])} ${f1(fy[1])} L${f1(fx1[0] + 30)} ${f1(fx0[1])} L${f1(fx0[0] - 30)} ${f1(fx0[1])} Z`, '#14181e', INK, 3);
  s += P(`M${f1(fx0[0] + 20)} ${f1((fy[1] + fx0[1]) / 2)} L${f1(fx1[0] - 20)} ${f1((fy[1] + fx0[1]) / 2)}`, 'none', '#3a434e', 6, 'opacity="0.8"');
  s += `<rect x="0" y="${f1(ceilY)}" width="1024" height="${f1(wainY - ceilY)}" fill="url(#slWallUp)"/>`;
  s += `<rect x="0" y="${f1(wainY)}" width="1024" height="${f1(floorY - wainY)}" fill="#161d20"/>`;
  s += P(`M0 ${f1(wainY)} L1024 ${f1(wainY)}`, 'none', '#0b0f12', 5);
  s += P(`M0 ${f1(wainY - 4)} L1024 ${f1(wainY - 4)}`, 'none', '#3a454c', 2, 'opacity="0.6"');
  s += P(`M0 ${f1(ceilY)} L1024 ${f1(ceilY)}`, 'none', INK, 3);
  // 걸레받이
  s += `<rect x="0" y="${f1(floorY - 16)}" width="1024" height="16" fill="#0c0f12"/>`;
  // 바닥(테라조): 판 이음줄(소실점으로) + 드문드문 돌 알갱이
  s += `<rect x="0" y="${f1(floorY)}" width="1024" height="${f1(1536 - floorY)}" fill="url(#slFloor)"/>`;
  let grid = '';
  for (let x = -6; x <= 6; x += 1.2) { const a = pr(x, 0, D), b = pr(x, 0, 0.45); grid += `M${pt(a)} L${pt(b)} `; }
  for (const z of [1.55, 1.05, 0.72]) { const a = pr(-8, 0, z), b = pr(8, 0, z); grid += `M${pt(a)} L${pt(b)} `; }
  s += P(grid, 'none', '#2b3236', 2.5, 'opacity="0.55"');
  let chips = '';
  for (let i = 0; i < 160; i++) {
    const x = (rnd() - 0.5) * 6, z = 0.5 + rnd() * (D - 0.5), p = pr(x, 0, z);
    if (p[1] < floorY + 2 || p[0] < -10 || p[0] > 1034) continue;
    const r = 1.2 + 4.5 / z * rnd();
    chips += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(r * 1.6)}" ry="${f1(r * 0.7)}" fill="${rnd() < 0.5 ? '#3a4247' : '#0b0d0f'}"/>`;
  }
  s += `<g opacity="0.55">${chips}</g>`;

  // ---------------- 왼쪽: 셔터가 말려 올라간 계단 입구
  const st0 = wallP(-2.35, 0), st1 = wallP(-1.3, 2.35);
  s += P(poly([[st0[0], st1[1]], [st1[0], st1[1]], [st1[0], st0[1]], [st0[0], st0[1]]]), '#030405', INK, 3);
  s += `<rect x="0" y="${f1(st1[1])}" width="${f1(st1[0])}" height="${f1(st0[1] - st1[1])}" fill="url(#slGreen)"/>`;
  // 안쪽 벽의 비상구 표시등(글자·그림 없음, 흐린 초록)
  s += `<rect x="18" y="${f1(st1[1] + 60)}" width="70" height="30" rx="3" fill="#2f9a5c" opacity="0.55"/><rect x="18" y="${f1(st1[1] + 60)}" width="70" height="30" rx="3" fill="#8fe3ae" opacity="0.35" filter="url(#slB10)"/>`;
  // 계단 난간 실루엣
  s += P(`M-10 ${f1(st0[1] - 160)} L${f1(st1[0] - 30)} ${f1(st0[1] - 250)} M${f1(st1[0] - 40)} ${f1(st0[1] - 250)} L${f1(st1[0] - 40)} ${f1(st0[1] - 10)}`, 'none', '#0e1513', 6);
  // 셔터 통(위) + 말려 올라간 셔터 끝 + 가이드 레일
  const bx0 = wallP(-2.5, 2.35), bx1 = wallP(-1.2, 2.72);
  s += P(poly([[bx0[0], bx1[1]], [bx1[0], bx1[1]], [bx1[0], bx0[1]], [bx0[0], bx0[1]]]), '#2a3036', INK, 3);
  s += P(`M${f1(bx0[0])} ${f1(bx1[1] + 10)} L${f1(bx1[0])} ${f1(bx1[1] + 10)}`, 'none', '#4b555e', 3, 'opacity="0.8"');
  s += P(poly([[st0[0], bx0[1]], [st1[0], bx0[1]], [st1[0], bx0[1] + 12], [st0[0], bx0[1] + 12]]), '#3b434b', INK, 2.5);
  s += P(poly([[st1[0] - 4, bx0[1]], [st1[0] + 14, bx0[1]], [st1[0] + 14, st0[1]], [st1[0] - 4, st0[1]]]), '#262c32', INK, 2.5);

  // ---------------- 문 너머: 끝없이 이어지는 칠흑의 복도(소실점까지)
  const o = [wallP(-DW, 0), wallP(DW, 0), wallP(DW, DH), wallP(-DW, DH)];
  const ZF = 60;
  const far = [pr(-DW, 0, ZF), pr(DW, 0, ZF), pr(DW, DH, ZF), pr(-DW, DH, ZF)];
  s += P(poly(o), '#010203', INK, 3);
  s += P(poly([o[0], o[1], far[1], far[0]]), 'url(#slVoid)'); // 복도 바닥
  let hall = '';
  for (const z of [2.7, 3.6, 5.2]) { const a = pr(-DW, 0, z), b = pr(DW, 0, z); hall += `M${pt(a)} L${pt(b)} `; }
  s += P(hall, 'none', '#3d8c88', 2, 'opacity="0.22"');
  s += P(poly([pr(-DW, 0, D), pr(-DW, DH, D), pr(-DW, DH, ZF), pr(-DW, 0, ZF)]), '#020304', 'none', 0, 'opacity="0.9"');
  s += P(poly([pr(DW, 0, D), pr(DW, DH, D), pr(DW, DH, ZF), pr(DW, 0, ZF)]), '#020304', 'none', 0, 'opacity="0.9"');

  // ---------------- 문짝 두 개(안쪽으로 열림): 검게 그을린 세로 널빤지 + 쇠띠 두 줄 + 둥근 쇠징
  const leaf = side => {
    const near = side; // 경첩
    let g = '';
    const q = [L3(side, 0, 0), L3(side, DW, 0), L3(side, DW, DH), L3(side, 0, DH)];
    g += P(poly(q), side < 0 ? '#211a16' : '#2a211c', INK, 3.5);
    // 널빤지 이음
    let pl = '';
    for (const a of [0.15, 0.3, 0.45, 0.6]) pl += `M${pt(L3(side, a, 0.02))} L${pt(L3(side, a, DH - 0.02))} `;
    g += P(pl, 'none', '#0e0b09', 2.5);
    // 나뭇결·그을음 얼룩
    let gr = '';
    for (const a of [0.07, 0.22, 0.38, 0.52, 0.67]) gr += `M${pt(L3(side, a, 0.3 + (a * 7 % 0.5)))} L${pt(L3(side, a + 0.01, 1.0 + (a * 11 % 0.6)))} `;
    g += P(gr, 'none', '#3c3029', 2, 'opacity="0.6"');
    g += P(poly([L3(side, 0, 0), L3(side, DW, 0), L3(side, DW, 0.55), L3(side, 0.4, 0.4), L3(side, 0, 0.62)]), '#0a0807', 'none', 0, 'opacity="0.55"');
    // 쇠띠
    for (const [h0, h1] of [[0.48, 0.6], [2.06, 2.18]]) {
      g += P(poly([L3(side, 0, h0), L3(side, DW, h0), L3(side, DW, h1), L3(side, 0, h1)]), '#2b2f33', INK, 2.5);
      g += P(`M${pt(L3(side, 0, h1 - 0.012))} L${pt(L3(side, DW, h1 - 0.012))}`, 'none', '#59616a', 2, 'opacity="0.7"');
      for (let a = 0.07; a < DW; a += 0.15) {
        const c = L3(side, a, (h0 + h1) / 2), r = 0.022 * FL / leafP(side, a, 0)[2];
        g += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="#3c4248" stroke="${INK}" stroke-width="1.8"/><circle cx="${f1(c[0] - r * 0.3)}" cy="${f1(c[1] - r * 0.3)}" r="${f1(r * 0.35)}" fill="#8d97a1" opacity="0.8"/>`;
      }
    }
    // 띠 사이 쇠징(성기게)
    for (const h of [1.05, 1.5, 2.45]) for (let a = 0.14; a < DW; a += 0.2) {
      if (side > 0 && Math.abs(h - DISC_H) < 0.3 && a < 0.33) continue;
      const c = L3(side, a, h), r = 0.018 * FL / leafP(side, a, 0)[2];
      g += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="#33383d" stroke="${INK}" stroke-width="1.6"/>`;
    }
    // 자유단 두께(옆면)
    const e0 = L3(side, DW, 0), e1 = L3(side, DW, DH);
    g += P(poly([e0, e1, [e1[0] + side * 8, e1[1]], [e0[0] + side * 8, e0[1]]]), '#120e0c', INK, 2.5);
    return g;
  };
  s += leaf(-1) + leaf(1);
  // 원반 빛이 닿은 두 문짝의 자유단 가장자리
  for (const side of [-1, 1]) s += P(`M${pt(L3(side, DW - 0.02, 0.1))} L${pt(L3(side, DW - 0.02, DH - 0.1))}`, 'none', '#6fd9cf', 3, 'opacity="0.55"');

  // ---------------- 문틀(두꺼운 옛 나무) + 상인방 + 문지방
  const fw = 0.16;
  const jL = [wallP(-DW - fw, 0), wallP(-DW, 0), wallP(-DW, DH), wallP(-DW - fw, DH + fw)];
  const jR = [wallP(DW, 0), wallP(DW + fw, 0), wallP(DW + fw, DH + fw), wallP(DW, DH)];
  const lintel = [wallP(-DW - fw - 0.08, DH + fw), wallP(DW + fw + 0.08, DH + fw), wallP(DW + fw + 0.08, DH + fw + 0.2), wallP(-DW - fw - 0.08, DH + fw + 0.2)];
  // 문틀 안쪽 면(깊이)
  s += P(poly([wallP(-DW, 0), pr(-DW, 0, D + 0.22), pr(-DW, DH, D + 0.22), wallP(-DW, DH)]), '#0f0c0a', INK, 2.5);
  s += P(poly([wallP(DW, 0), pr(DW, 0, D + 0.22), pr(DW, DH, D + 0.22), wallP(DW, DH)]), '#1a1411', INK, 2.5);
  s += P(poly(jL), '#241c17', INK, 3.5) + P(poly(jR), '#1c1612', INK, 3.5);
  s += P(poly([wallP(-DW - fw, DH), wallP(DW + fw, DH), wallP(DW + fw, DH + fw), wallP(-DW - fw, DH + fw)]), '#211a15', INK, 3.5);
  s += P(poly(lintel), '#2b221c', INK, 3.5);
  s += P(`M${pt(wallP(-DW - fw + 0.03, 0.05))} L${pt(wallP(-DW - fw + 0.03, DH + fw - 0.03))} M${pt(lintel[3])} L${pt(lintel[2])}`, 'none', '#4b3d33', 2.5, 'opacity="0.7"');
  const th = [wallP(-DW - fw - 0.05, 0), wallP(DW + fw + 0.05, 0), pr(DW + fw + 0.05, 0, D - 0.12), pr(-DW - fw - 0.05, 0, D - 0.12)];
  s += P(poly(th), '#2a2622', INK, 3);

  // 반들한 바닥에 비친 문(흐리게, 아래로 갈수록 사라짐)
  const fyR = pr(0, 0, D - 0.12)[1] - 4;
  const refl = (x0, x1, col, op) => `<rect x="${f1(x0)}" y="${f1(fyR + 6)}" width="${f1(x1 - x0)}" height="230" fill="${col}" opacity="${op}" mask="url(#slReflMask)"/>`;
  s += refl(jL[0][0], jL[1][0], '#2a201a', 0.55) + refl(jR[0][0], jR[1][0], '#2a201a', 0.55);
  s += refl(L3(-1, 0, 0)[0], L3(-1, DW, 0)[0], '#241c17', 0.4) + refl(L3(1, DW, 0)[0], L3(1, 0, 0)[0], '#2a211c', 0.4);
  // ---------------- 청록빛(원반에서 문·벽·바닥으로 번짐)
  s += `<rect width="1024" height="1536" fill="url(#slGlow)" style="mix-blend-mode:screen"/>`;
  s += `<rect x="0" y="${f1(floorY - 30)}" width="1024" height="${f1(1536 - floorY + 30)}" fill="url(#slFloorGlow)" style="mix-blend-mode:screen"/>`;
  // 젖은 듯 반들한 바닥의 세로 반사
  s += P(`M${f1(cC[0] - 26)} ${f1(floorY + 8)} L${f1(cC[0] + 26)} ${f1(floorY + 8)} L${f1(cC[0] + 44)} 1300 L${f1(cC[0] - 44)} 1300 Z`, 'url(#slReflect)', 'none', 0, 'filter="url(#slB10)"');
  // 문 너머 복도 바닥에 닿은 빛(문틈으로 새어 나감)
  s += P(poly([pr(-0.12, 0, D + 0.1), pr(0.2, 0, D + 0.1), pr(0.06, 0, 9), pr(-0.02, 0, 9)]), '#5fd0c8', 'none', 0, 'opacity="0.22" filter="url(#slB4)"');

  // ---------------- 쇠테 원반 + 빛나는 木(오른짝에 붙어 이음매 너머로 걸침)
  let d = '';
  d += `<circle r="${R + 14}" fill="#1b2023" stroke="${INK}" stroke-width="5"/>`;
  d += `<circle r="${R + 14}" fill="none" stroke="#5a6871" stroke-width="4" stroke-dasharray="60 30 90 40" opacity="0.8"/>`;
  d += `<circle r="${R}" fill="#0f1d20" stroke="${INK}" stroke-width="4"/>`;
  d += `<circle r="${R - 8}" fill="none" stroke="#3a8e8f" stroke-width="3" opacity="0.7"/>`;
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.2; d += `<circle cx="${f1(Math.cos(a) * (R + 7))}" cy="${f1(Math.sin(a) * (R + 7))}" r="5" fill="#4b565e" stroke="${INK}" stroke-width="2"/>`; }
  const glyph = (fill, extra = '') => `<text x="0" y="${f1(R * 0.62)}" font-family="SerifKRMok" font-size="${R * 1.62}" font-weight="700" text-anchor="middle" fill="${fill}" ${extra}>木</text>`;
  d += glyph('#0a3236', 'stroke="#062022" stroke-width="10" stroke-linejoin="round"');
  d += `<g filter="url(#slB10)">${glyph('#59e8dc')}</g>`;
  d += glyph('#c9fff7', 'stroke="#4fd8cf" stroke-width="3"');
  s += `<g transform="${mtxL}">${d}</g>`;
  // 원반 둘레의 빛 무리
  s += `<ellipse cx="${f1(cC[0])}" cy="${f1(cC[1])}" rx="${f1(Math.abs(cU[0] - cC[0]) * 1.6)}" ry="${f1(Math.abs(cV[1] - cC[1]) * 1.5)}" fill="#64e3d8" opacity="0.28" filter="url(#slB30)" style="mix-blend-mode:screen"/>`;

  // ---------------- 오른쪽 벽: 이끼 낀 석판 + 오각형 홈 + 나무 패(작은 木)
  const sb = { x0: 1.0, x1: 1.54, y0: 0.74, y1: 1.62 };
  const sbP = (u, v) => wallP(sb.x0 + (sb.x1 - sb.x0) * u, sb.y0 + (sb.y1 - sb.y0) * v);
  const slabPts = [[0.02, 0.0], [0.5, -0.02], [0.98, 0.01], [1.0, 0.45], [0.99, 1.0], [0.55, 1.02], [0.01, 0.99], [-0.01, 0.5]].map(([u, v]) => sbP(u, v));
  s += P(poly([sbP(-0.04, -0.035), sbP(1.04, -0.035), sbP(1.04, 1.04), sbP(-0.04, 1.04)]), '#0a0c0e', INK, 3);
  s += P(`M${pt(sbP(-0.04, 1.04))} L${pt(sbP(1.04, 1.04))}`, 'none', '#3c474d', 2.5, 'opacity="0.7"');
  s += P(poly(slabPts), '#4a5052', INK, 4);
  s += P(poly([sbP(0.62, 0), sbP(1, 0.01), sbP(1, 1), sbP(0.55, 1.02), sbP(0.7, 0.6)]), '#353a3c', 'none', 0, 'opacity="0.8"');
  // 이끼
  s += P(`M${pt(sbP(0, 0.72))} C${pt(sbP(0.12, 0.66))} ${pt(sbP(0.22, 0.8))} ${pt(sbP(0.3, 0.86))} C${pt(sbP(0.38, 0.94))} ${pt(sbP(0.5, 0.92))} ${pt(sbP(0.6, 1.02))} L${pt(sbP(0.01, 0.99))} Z`, '#344126', INK, 2);
  s += P(`M${pt(sbP(0.72, 0))} C${pt(sbP(0.8, 0.08))} ${pt(sbP(0.9, 0.04))} ${pt(sbP(1, 0.12))} L${pt(sbP(0.98, 0.01))} Z M${pt(sbP(0.02, 0.0))} C${pt(sbP(0.05, 0.1))} ${pt(sbP(0.14, 0.08))} ${pt(sbP(0.2, 0.0))} Z`, '#2f3b22', INK, 2);
  s += P(`M${pt(sbP(0.08, 0.78))} l6 -5 M${pt(sbP(0.2, 0.86))} l5 -6 M${pt(sbP(0.42, 0.94))} l4 -6`, 'none', '#5d7040', 2.5, 'opacity="0.8"');
  // 금
  s += P(`M${pt(sbP(0.85, 0.3))} L${pt(sbP(0.78, 0.42))} L${pt(sbP(0.84, 0.55))} M${pt(sbP(0.15, 0.2))} L${pt(sbP(0.22, 0.32))}`, 'none', '#1d2123', 2.5);
  // 오각형 홈(밝은 화강암 테) + 나무 패
  const pc = sbP(0.5, 0.48);
  const penta = (r, rot = 0) => Array.from({ length: 5 }, (_, k) => { const a = -Math.PI / 2 + k * 2 * Math.PI / 5 + rot; return [pc[0] + Math.cos(a) * r, pc[1] + Math.sin(a) * r]; });
  s += P(poly(penta(58)), '#a7a59c', INK, 3.5);
  let speck = '';
  for (let k = 0; k < 26; k++) { const a = rnd() * Math.PI * 2, r = 44 + rnd() * 12; speck += `<circle cx="${f1(pc[0] + Math.cos(a) * r * 0.9)}" cy="${f1(pc[1] + Math.sin(a) * r * 0.9)}" r="${f1(1.2 + rnd() * 1.6)}" fill="${rnd() < 0.5 ? '#6b6a64' : '#d4d2c8'}"/>`; }
  s += `<g clip-path="url(#slPentaRim)">${speck}</g>`;
  s += P(poly(penta(42)), '#1a1b1a', INK, 3);
  s += P(poly(penta(38).map(p => [p[0] + 1, p[1] + 2])), '#7a5634', INK, 3);
  s += P(poly([penta(38)[0], penta(38)[1], penta(38)[2], [pc[0], pc[1] + 6]].map(p => [p[0] + 1, p[1] + 2])), '#5d3f25', 'none', 0, 'opacity="0.6"');
  s += P(`M${f1(pc[0] - 28)} ${f1(pc[1] - 10)} L${f1(pc[0] - 10)} ${f1(pc[1] - 32)}`, 'none', '#a77b4e', 3, 'opacity="0.7"');
  s += `<text x="${f1(pc[0] + 1)}" y="${f1(pc[1] + 14)}" font-family="SerifKRMok" font-size="34" font-weight="700" text-anchor="middle" fill="#3b2412" stroke="#2a180b" stroke-width="1.5">木</text>`;
  s += `<text x="${f1(pc[0] + 1)}" y="${f1(pc[1] + 14)}" font-family="SerifKRMok" font-size="34" font-weight="700" text-anchor="middle" fill="#62d8cf" opacity="0.45" filter="url(#slB4)">木</text>`;

  // ---------------- 붉은 자판기 빛(복도 저편, 오른쪽 아래로 흐리게)
  s += `<rect width="1024" height="1536" fill="url(#slRed)" style="mix-blend-mode:screen"/>`;

  // ---------------- 패를 막 놓는 손(오른쪽 가장자리에서)
  const hw = [pc[0] + 104, pc[1] + 116];
  s += `<g transform="translate(${f1(hw[0])} ${f1(hw[1])}) rotate(30) scale(1.05)">${hand()}</g>`;

  // ---------------- 비네트 · 아래 가장자리
  s += `<rect width="1024" height="1536" fill="url(#slVig)"/>`;
  s += `<rect y="1250" width="1024" height="286" fill="url(#slBot)"/>`;
  return K.svg(s, { defs: defs + `<mask id="slReflMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect x="0" y="${f1(pr(0, 0, D - 0.12)[1] + 2)}" width="1024" height="230" fill="url(#slReflG)"/></mask><clipPath id="slPentaRim"><path d="${poly(penta(58))} ${poly(penta(42))}" clip-rule="evenodd"/></clipPath>` });
}
