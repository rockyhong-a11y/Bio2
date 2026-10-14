// cg_prologue — 1장 첫 컷: 아직 열려 있는 현관 유리문을 등지고 선 희민(가슴 위, 크게).
// 인물은 힉스필드 초상화(assets/hf/portrait_heemin.webp)를 그대로 넣고 장면 조명에 맞춰 색을 누른다:
// 등 뒤 열린 문으로 드는 차가운 달빛(머리·어깨 테두리), 앞면은 어둡고 푸르게, 왼쪽 자판기의 붉은 반사광.
// 초상화 아래 잘린 단은 바로 앞 신발장(나무 칸칸이) 윗판이 가린다. 신발을 갈아 신으려고 그 위에 내려놓은
// 분홍 일기장과 리본 맨 사탕 상자, 책가방. 배경(현관·문·자판기·신발장·사다리·복도 입구)은 조금 흐려 인물에 초점.
import fs from 'fs';
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'pr'; // 이 그림의 id 접두어
const EINK = '#05060a'; // 배경 선

// ---------------------------------------------------------------- 한 점 투시(소실점 = 눈높이)
// 뒷벽(현관문 벽) 평면 좌표 (x, y)를 깊이 배율 s(1 = 뒷벽, 클수록 가까움)로 옮긴다
const VP = [536, 337];
const at = (s, x, y) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
const c = (s, x, y) => pt(at(s, x, y));
const quad = (a, b, d, e) => `M${a} L${b} L${d} L${e} Z`;
const WL = 100, WR = 900, WT = 40, FB = 760; // 뒷벽 왼쪽·오른쪽·위, 바닥선
const DL = 350, DR = 832, DT = 196; // 현관문(양쪽 문짝) 틀 안쪽
const DM = (DL + DR) / 2;

// ---------------------------------------------------------------- 힉스필드 초상화
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
const HM = portrait('heemin'); // 기본 얼굴: 옅은 미소(설렘 + 긴장)
// 배치: 초상화 정수리(초상화 y≈12)가 그림 y=BT, 몸 가운데(초상화 x = 폭/2)가 그림 x=BCX
const BS = 1.26, BCX = 508, BT = 178;
const BX = BCX - HM.w / 2 * BS, BY = BT - 12 * BS, BW = HM.w * BS, BH = HM.h * BS;
const BBOT = BY + BH; // 초상화 아래 잘린 단(신발장 윗판 뒤로 숨김)

// ---------------------------------------------------------------- 앞쪽 신발장 윗판(카메라 바로 앞, 가로로 길게)
// 윗판 평면: 가로 X(먼 변 기준 화면 px), 깊이 Z(같은 단위, 0 = 먼 변), 높이 H(윗판 위로) → 화면
const TF = 1000, TK = 623; // 초점 거리(단위), 먼 변에서 윗판까지 눈높이 차
const TOPZ = 300; // 윗판 깊이(먼 변 → 가까운 변)
const tp = (X, Z, H = 0) => { const d = 1 - Z / TF; return [VP[0] + X / d, VP[1] + (TK - H) / d]; };
const tq = (X, Z, H = 0) => pt(tp(X, Z, H));
const CAB_Y0 = tp(0, 0)[1], CAB_Y1 = tp(0, TOPZ)[1];
const WOODC = { top0: '#57463d', top1: '#2b211d', face: '#130e0c', hole: '#050403', line: '#060404', rim: '#a9c0e6' };
const PINK = { top0: '#d48aa6', top1: '#a35e7b', side: '#6e3550', page: '#b9ad9f', line: '#3a1424', hi: '#f2c3d3' };
const BOX = { top0: '#b6c0dc', top1: '#8e98ba', front: '#4c5474', side: '#384060', line: '#151a2c' };
const RIB = { base: '#b4303f', shade: '#6e1621', hi: '#e2808c', line: '#2e070c' };
const BAG = { base: '#25242b', shade: '#121115', light: '#3c3b45', line: '#040405' };

// 평면 위 직사각형(가로 X0..X1, 깊이 Z0..Z1, 높이 H)을 a 라디안 돌린 네 꼭짓점
function rectOnTop(cx, cz, w, dz, a, H = 0) {
  const ca = Math.cos(a), sa = Math.sin(a);
  return [[-w / 2, -dz / 2], [w / 2, -dz / 2], [w / 2, dz / 2], [-w / 2, dz / 2]].map(([u, v]) => [cx + u * ca - v * sa, cz + u * sa + v * ca, H]);
}
const polyT = pts => 'M' + pts.map(([X, Z, H]) => tq(X, Z, H)).join(' L') + ' Z';
// 납작한 상자(바닥 네 점 + 높이 h, 바닥 높이 h0): 카메라(X=0, Z=TF) 쪽을 향한 옆면 + 윗면
function slab(base, h0, h, col, lw = 2) {
  const cx = base.reduce((a, p) => a + p[0], 0) / 4, cz = base.reduce((a, p) => a + p[1], 0) / 4;
  let s = '';
  for (let i = 0; i < 4; i++) {
    const a = base[i], b = base[(i + 1) % 4];
    let nx = b[1] - a[1], nz = -(b[0] - a[0]);
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz; }
    if (nx * (0 - mx) + nz * (TF - mz) <= 0) continue; // 카메라 반대쪽 면
    const front = Math.abs(nz) > Math.abs(nx);
    s += P(`M${tq(a[0], a[1], h0)} L${tq(b[0], b[1], h0)} L${tq(b[0], b[1], h0 + h)} L${tq(a[0], a[1], h0 + h)} Z`, front ? col.front : col.side, col.line, lw);
  }
  s += P(polyT(base.map(([X, Z]) => [X, Z, h0 + h])), col.top, col.line, lw);
  return s;
}
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * t];
// 평면 위 사각형 네 점 안의 (u, v)(0..1) 위치
const inQuad = (q, u, v) => lerp2(lerp2(q[0], q[1], u), lerp2(q[3], q[2], u), v);

function cabinet() {
  let s = '';
  // 몸통 앞면(어둠 속) + 칸칸이
  const L = -900, R = 900;
  s += P(`M${tq(L, TOPZ, 0)} L${tq(R, TOPZ, 0)} L${tq(R, TOPZ, -900)} L${tq(L, TOPZ, -900)} Z`, WOODC.face);
  let holes = '', rims = '', slip = '';
  for (let row = 0; row < 2; row++) {
    const h0 = -46 - row * 250, h1 = h0 - 200;
    for (let X = -700; X < 700; X += 300) {
      const x0 = X + 14, x1 = X + 286;
      holes += `M${tq(x0, TOPZ, h0)} L${tq(x1, TOPZ, h0)} L${tq(x1, TOPZ, h1)} L${tq(x0, TOPZ, h1)} Z `;
      rims += `M${tq(x0, TOPZ, h0)} L${tq(x1, TOPZ, h0)} `;
      if ((X / 300 + row) % 2 === 0) { // 실내화 앞코 한 켤레
        const a = tp(X + 110, TOPZ - 20, h1 + 40), b = tp(X + 190, TOPZ - 20, h1 + 40);
        slip += `<ellipse cx="${f1(a[0])}" cy="${f1(a[1])}" rx="34" ry="20" fill="#4a4a50"/><ellipse cx="${f1(b[0])}" cy="${f1(b[1])}" rx="34" ry="20" fill="#3e3e44"/>`;
      }
    }
  }
  s += P(holes, WOODC.hole, WOODC.line, 2) + slip + P(rims, 'none', '#2d231e', 3);
  // 윗판 앞쪽 두께
  s += P(`M${tq(L, TOPZ, 0)} L${tq(R, TOPZ, 0)} L${tq(R, TOPZ, -26)} L${tq(L, TOPZ, -26)} Z`, '#2a1f1a', WOODC.line, 2);
  s += P(`M${tq(L, TOPZ, 0)} L${tq(R, TOPZ, 0)}`, 'none', '#6d5a50', 2, 'opacity="0.6"');
  // 윗판(뒤쪽이 달빛을 받아 조금 밝음) + 나뭇결
  s += P(`M${tq(L, 0)} L${tq(R, 0)} L${tq(R, TOPZ)} L${tq(L, TOPZ)} Z`, `url(#${ID}topG)`, WOODC.line, 2);
  let g = '';
  for (const [z, w] of [[38, 6], [84, -5], [131, 7], [176, -4], [222, 5], [262, -6]]) g += `M${tq(L, z)} C${tq(-300, z + w)} ${tq(200, z - w)} ${tq(R, z)} `;
  s += P(g, 'none', '#1b1411', 2, 'opacity="0.55"');
  // 먼 모서리에 맺힌 달빛
  s += P(`M${tq(L, 0)} L${tq(R, 0)}`, 'none', WOODC.rim, 3, 'opacity="0.55"');
  return s;
}

// 그림자: 빛이 등 뒤(먼 쪽)에서 오므로 물건 앞쪽(카메라 쪽)으로 짧게 드리움
const shadowOf = (base, len) => `<path d="${polyT(base.map(([X, Z]) => [X, Z + len, 0]).concat([]))}" fill="#000" opacity="0.55" filter="url(#${ID}b6)"/>` +
  `<path d="${polyT(base)}" fill="#000" opacity="0.6" filter="url(#${ID}b3)"/>`;

const DIARY = rectOnTop(-150, 150, 262, 186, -0.1);
const DIARY_H = 28;
const CBOX = rectOnTop(-100, 116, 128, 120, 0.16);
const CBOX_H = 62;
function diary() {
  let s = shadowOf(DIARY, 40);
  s += slab(DIARY, 0, DIARY_H, { top: `url(#${ID}pinkG)`, front: PINK.page, side: PINK.side, line: PINK.line }, 2.2);
  // 앞쪽 책장 면: 표지 두께(위·아래) 띠
  const q = DIARY;
  const band = (h0, h1, fill) => P(`M${tq(q[3][0], q[3][1], h0)} L${tq(q[2][0], q[2][1], h0)} L${tq(q[2][0], q[2][1], h1)} L${tq(q[3][0], q[3][1], h1)} Z`, fill, 'none');
  s += band(DIARY_H - 6, DIARY_H, PINK.side) + band(0, 5, PINK.side);
  s += P(`M${tq(q[3][0] + 6, q[3][1], 11)} L${tq(q[2][0] - 6, q[2][1], 11)} M${tq(q[3][0] + 6, q[3][1], 17)} L${tq(q[2][0] - 6, q[2][1], 17)}`, 'none', '#8f8476', 1.4, 'opacity="0.8"');
  // 책갈피 끈(빨강)이 책장 사이로 늘어짐
  const bm = inQuad(q, 0.7, 1);
  s += P(`M${tq(bm[0], bm[1], 14)} C${tq(bm[0] + 2, bm[1] + 4, 6)} ${tq(bm[0] + 4, bm[1] + 8, 0)} ${tq(bm[0] + 12, bm[1] + 16, 0)} L${tq(bm[0] + 18, bm[1] + 24, 0)}`, 'none', RIB.shade, 4.5);
  // 표지 테두리 장식 + 하트
  const T = q.map(([X, Z]) => [X, Z, DIARY_H]);
  const ins = [inQuad(T, 0.08, 0.1), inQuad(T, 0.92, 0.1), inQuad(T, 0.92, 0.9), inQuad(T, 0.08, 0.9)];
  s += P(polyT(ins), 'none', PINK.hi, 2.2, 'opacity="0.55"');
  const hc = inQuad(T, 0.36, 0.8), hw = 30, hd = 26;
  const H = (u, v) => tq(hc[0] + u * hw, hc[1] + v * hd, DIARY_H);
  s += P(`M${H(0, 0.55)} C${H(-0.5, 0.2)} ${H(-0.75, -0.1)} ${H(-0.6, -0.4)} C${H(-0.45, -0.7)} ${H(-0.05, -0.6)} ${H(0, -0.3)} C${H(0.05, -0.6)} ${H(0.45, -0.7)} ${H(0.6, -0.4)} C${H(0.75, -0.1)} ${H(0.5, 0.2)} ${H(0, 0.55)} Z`, '#e6a4bb', PINK.line, 1.6, 'opacity="0.9"');
  // 먼 모서리 달빛
  s += P(`M${tq(T[0][0], T[0][1], DIARY_H)} L${tq(T[1][0], T[1][1], DIARY_H)}`, 'none', '#f6d6e2', 2.4, 'opacity="0.75"');
  return s;
}
function candyBox() {
  const h0 = DIARY_H;
  let s = `<path d="${polyT(CBOX.map(([X, Z]) => [X, Z + 26, h0]))}" fill="#000" opacity="0.5" filter="url(#${ID}b6)"/>`;
  s += slab(CBOX, h0, CBOX_H, { top: `url(#${ID}boxG)`, front: BOX.front, side: BOX.side, line: BOX.line }, 2.2);
  const T = CBOX.map(([X, Z]) => [X, Z, h0 + CBOX_H]);
  // 리본 십자(윗면) + 앞면으로 내려감
  const strip = (u0, u1, v0, v1) => [inQuad(T, u0, v0), inQuad(T, u1, v0), inQuad(T, u1, v1), inQuad(T, u0, v1)];
  s += P(polyT(strip(0.44, 0.56, 0, 1)), RIB.base, RIB.line, 1.6) + P(polyT(strip(0, 1, 0.44, 0.56)), RIB.base, RIB.line, 1.6);
  const fa = inQuad(T, 0.44, 1), fb = inQuad(T, 0.56, 1);
  s += P(`M${tq(fa[0], fa[1], fa[2])} L${tq(fb[0], fb[1], fb[2])} L${tq(fb[0], fb[1], h0)} L${tq(fa[0], fa[1], h0)} Z`, RIB.shade, RIB.line, 1.6);
  // 오른쪽 옆면의 가로 리본
  const sa = inQuad(T, 1, 0.44), sb = inQuad(T, 1, 0.56);
  s += P(`M${tq(sa[0], sa[1], sa[2])} L${tq(sb[0], sb[1], sb[2])} L${tq(sb[0], sb[1], h0)} L${tq(sa[0], sa[1], h0)} Z`, '#5a121b', RIB.line, 1.4);
  // 나비 매듭(윗면 가운데에서 위로 솟음)
  const k = tp(...inQuad(T, 0.5, 0.5));
  const [x, y] = k;
  s += P(`M${x} ${y} C${x - 30} ${y - 40} ${x - 70} ${y - 34} ${x - 68} ${y - 12} C${x - 66} ${y + 8} ${x - 30} ${y + 6} ${x} ${y + 2} Z`, RIB.base, RIB.line, 2.2);
  s += P(`M${x} ${y} C${x + 30} ${y - 40} ${x + 70} ${y - 34} ${x + 68} ${y - 12} C${x + 66} ${y + 8} ${x + 30} ${y + 6} ${x} ${y + 2} Z`, '#8e2230', RIB.line, 2.2);
  s += P(`M${x - 4} ${y + 2} L${x - 30} ${y + 34} L${x - 16} ${y + 38} L${x} ${y + 12} Z M${x + 4} ${y + 2} L${x + 28} ${y + 36} L${x + 14} ${y + 40} L${x} ${y + 12} Z`, RIB.shade, RIB.line, 2);
  s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="12" ry="9" fill="${RIB.base}" stroke="${RIB.line}" stroke-width="2"/>`;
  s += P(`M${x - 56} ${y - 18} Q${x - 40} ${y - 30} ${x - 20} ${y - 14} M${x + 20} ${y - 20} Q${x + 40} ${y - 30} ${x + 54} ${y - 20}`, 'none', RIB.hi, 2.6, 'opacity="0.7"');
  // 먼 모서리 달빛
  s += P(`M${tq(T[0][0], T[0][1], T[0][2])} L${tq(T[1][0], T[1][1], T[1][2])}`, 'none', '#dfe8fb', 2.4, 'opacity="0.8"');
  return s;
}
// 열린 문짝(오른쪽 뒤)으로 든 달빛이 윗판 오른쪽에 비스듬히 떨어짐
function moonPatch() {
  return `<path d="${polyT([[150, 0, 0], [520, 0, 0], [380, TOPZ, 0], [-60, TOPZ, 0]])}" fill="#9fb8e2" opacity="0.16" filter="url(#${ID}b20)"/>` +
    `<path d="${polyT([[260, 0, 0], [440, 0, 0], [300, TOPZ * 0.9, 0], [110, TOPZ * 0.9, 0]])}" fill="#c4d6f4" opacity="0.1" filter="url(#${ID}b6)"/>`;
}

// ---------------------------------------------------------------- 희민(초상화)
function boy() {
  // 1) 장면 색으로 누른 초상화  2) 왼쪽 자판기 붉은 반사광  3) 아래(신발장 쪽)로 갈수록 그늘  4) 등 뒤 달빛 테두리
  let s = `<use href="#${ID}hm" filter="url(#${ID}grade)"/>`;
  s += `<g mask="url(#${ID}hmA)"><rect x="${f1(BX)}" y="${f1(BY)}" width="${f1(BW)}" height="${f1(BH)}" fill="url(#${ID}redG)" style="mix-blend-mode:screen"/>` +
    `<rect x="${f1(BX)}" y="${f1(BY)}" width="${f1(BW)}" height="${f1(BH)}" fill="url(#${ID}shadeG)"/>` +
    `<rect x="${f1(BX)}" y="${f1(BY)}" width="${f1(BW)}" height="${f1(BH)}" fill="url(#${ID}lowG)"/></g>`;
  s += `<g mask="url(#${ID}rimM)"><use href="#${ID}hm" filter="url(#${ID}rim)"/></g>`;
  return s;
}
// ---------------------------------------------------------------- 배경
function outside() {
  // 문틀 안으로 보이는 바깥: 남색 밤하늘, 달빛 받은 운동장, 먼 담장과 나무 실루엣
  let s = `<rect x="${DL}" y="${DT}" width="${DR - DL}" height="${FB - DT}" fill="url(#${ID}sky)"/>`;
  s += `<ellipse cx="${DR - 60}" cy="${DT + 40}" rx="140" ry="90" fill="#9fb6dc" opacity="0.35" filter="url(#${ID}b20)"/>`; // 문 위쪽 너머 달무리
  s += P(`M${DL} 356 C420 348 520 354 600 350 C680 346 760 354 ${DR} 352 L${DR} ${FB} L${DL} ${FB} Z`, `url(#${ID}yard)`);
  // 먼 담장 + 철망 기둥
  s += P(`M${DL} 334 L${DR} 334 L${DR} 356 L${DL} 356 Z`, '#2a3755');
  s += P(`M${DL} 322 L${DR} 322`, 'none', '#3c4c6e', 2);
  let posts = '';
  for (let x = DL + 20; x < DR; x += 46) posts += `M${x} 322 L${x} 336 `;
  s += P(posts, 'none', '#34425f', 2);
  // 앙상한 나무(먼 실루엣)
  s += P(`M392 336 L396 262 L384 236 M396 262 L410 228 M396 288 L374 262 M760 336 L756 244 L772 214 M756 270 L734 238 M758 294 L788 270 M812 336 L814 276 L828 254`, 'none', '#1a2236', 4);
  // 운동장 흙의 달빛 결
  s += P(`M${DL} 430 L${DR} 418 M${DL} 540 L${DR} 520 M${DL} 660 L${DR} 636`, 'none', '#b4c6e4', 2, 'opacity="0.22"');
  return s;
}

function doors() {
  let s = '';
  const fr = '#3a4254', frD = '#1c212c';
  // 왼쪽 문짝(닫힘): 유리 너머 바깥이 흐릿하게 + 반사
  s += P(`M${DL} ${DT} L${DM} ${DT} L${DM} ${FB} L${DL} ${FB} Z`, '#0b1222', 'none', 0, 'opacity="0.45"');
  s += P(`M${DL + 40} ${DT + 30} L${DL + 90} ${DT + 30} L${DL + 20} ${FB - 60} L${DL + 14} ${FB - 60} Z M${DL + 120} ${DT + 30} L${DL + 142} ${DT + 30} L${DL + 70} ${FB - 100} L${DL + 60} ${FB - 100} Z`, '#c8d8f2', 'none', 0, 'opacity="0.12"');
  s += P(`M${DL} ${DT} L${DM} ${DT} L${DM} ${FB} L${DL} ${FB} Z M${DL + 18} ${DT + 18} L${DM - 14} ${DT + 18} L${DM - 14} ${FB - 70} L${DL + 18} ${FB - 70} Z`, fr, EINK, 3, 'fill-rule="evenodd"');
  s += P(`M${DL + 30} 520 L${DM - 26} 520 L${DM - 26} 534 L${DL + 30} 534 Z`, '#55607a', EINK, 2.5);
  // 오른쪽 문짝(바깥으로 반쯤 열림): 문틀 밖으로 비스듬히 밀려 나가 좁고 짧아 보임
  const hx = DR, ox = DM + 110; // 경첩 쪽(오른쪽 문틀), 열린 문 끝
  s += P(`M${hx} ${DT} L${ox} ${DT + 44} L${ox} ${FB - 28} L${hx} ${FB} Z`, '#0d1628', 'none', 0, 'opacity="0.38"');
  s += P(`M${hx} ${DT} L${ox} ${DT + 44} L${ox} ${FB - 28} L${hx} ${FB} Z M${hx - 12} ${DT + 18} L${ox + 10} ${DT + 56} L${ox + 10} ${FB - 90} L${hx - 12} ${FB - 70} Z`, fr, EINK, 3, 'fill-rule="evenodd"');
  s += P(`M${ox + 4} ${DT + 44} L${ox + 4} ${FB - 28}`, 'none', '#c4d6f4', 3, 'opacity="0.85"'); // 열린 문 모서리에 맺힌 달빛
  s += P(`M${ox + 20} 510 L${hx - 20} 518 L${hx - 20} 530 L${ox + 20} 524 Z`, '#55607a', EINK, 2);
  // 바깥 문틀 + 가운데 기둥 + 문턱
  s += P(`M${DL - 16} ${DT - 16} L${DR + 16} ${DT - 16} L${DR + 16} ${FB} L${DR} ${FB} L${DR} ${DT} L${DL} ${DT} L${DL} ${FB} L${DL - 16} ${FB} Z`, frD, EINK, 3);
  s += P(`M${DM} ${DT} L${DM} ${FB}`, 'none', frD, 8);
  s += P(`M${DL - 16} ${FB - 4} L${DR + 16} ${FB - 4} L${DR + 16} ${FB + 8} L${DL - 16} ${FB + 8} Z`, '#2a3040', EINK, 2.5);
  return s;
}

function exitSign() {
  // 초록 비상구 표시등(뛰어나가는 사람 그림, 글자 없음): 문 위 오른쪽
  const x = 694, y = 120, w = 104, h = 46;
  let s = `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="120" ry="70" fill="#3ddc84" opacity="0.2" filter="url(#${ID}b20)"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#2fb36a" stroke="${EINK}" stroke-width="3"/>`;
  s += `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="#7af0ae"/>`;
  s += `<rect x="${x + 64}" y="${y + 10}" width="22" height="26" fill="#1f8a4f"/>`;
  s += `<circle cx="${x + 40}" cy="${y + 14}" r="4.5" fill="#1f8a4f"/>`;
  s += P(`M${x + 38} ${y + 19} L${x + 34} ${y + 30} M${x + 36} ${y + 24} L${x + 46} ${y + 22} L${x + 50} ${y + 27} M${x + 36} ${y + 24} L${x + 28} ${y + 22} M${x + 34} ${y + 30} L${x + 42} ${y + 35} M${x + 34} ${y + 30} L${x + 26} ${y + 36}`, 'none', '#1f8a4f', 3.4);
  s += P(`M${x + 52} ${y + 24} L${x + 60} ${y + 24}`, 'none', '#1f8a4f', 3);
  // 초록 빛이 문틀 위에 살짝 번짐
  s += P(`M${x - 40} ${DT - 16} L${x + w + 40} ${DT - 16}`, 'none', '#4fd08a', 3, 'opacity="0.35"');
  return s;
}

function walls() {
  let s = '';
  s += P(quad(c(1, WL, WT), c(1, WR, WT), c(4, WR, WT), c(4, WL, WT)), '#07090f', EINK, 3);
  s += P(quad(c(1, WL, WT), c(1, WL, FB), c(4, WL, FB), c(4, WL, WT)), '#0c1019', EINK, 3);
  s += P(quad(c(1, WR, WT), c(1, WR, FB), c(4, WR, FB), c(4, WR, WT)), '#0e121c', EINK, 3);
  s += P(quad(c(1, WL, WT), c(1, WR, WT), c(1, WR, FB), c(1, WL, FB)), '#10151f', EINK, 3);
  // 걸레받이
  s += P(`M${WL} ${FB - 16} L${DL - 16} ${FB - 16} M${DR + 16} ${FB - 16} L${WR} ${FB - 16}`, 'none', '#070a10', 4);
  // 천장의 꺼진 형광등
  for (const sd of [1.2, 1.7]) s += P(quad(c(sd, DM - 110, WT), c(sd, DM + 110, WT), c(sd + 0.1, DM + 110, WT), c(sd + 0.1, DM - 110, WT)), '#1a1f2b', EINK, 2);
  return s;
}

function floor() {
  let s = P(quad(c(1, WL, FB), c(1, WR, FB), c(4, WR, FB), c(4, WL, FB)), '#131925', EINK, 3);
  let g = '';
  for (let x = WL - 700; x <= WR + 700; x += 92) g += `M${c(1, x, FB)} L${c(4, x, FB)} `;
  for (const sd of [1.09, 1.2, 1.34, 1.52, 1.76, 2.08, 2.52, 3.16]) g += `M${c(sd, WL - 400, FB)} L${c(sd, WR + 400, FB)} `;
  s += `<g clip-path="url(#${ID}floorClip)">` + P(g, 'none', '#06080d', 2.5);
  // 열린 문틈과 유리로 쏟아져 들어온 달빛(바닥에 길게)
  s += P(quad(c(1, DM + 120, FB), c(1, DR, FB), c(2.9, DR - 70, FB), c(2.9, DM + 30, FB)), '#90b0e2', 'none', 0, `opacity="0.36" filter="url(#${ID}b4)"`);
  s += P(quad(c(1, DL + 20, FB), c(1, DM - 16, FB), c(2.9, DM - 90, FB), c(2.9, DL - 50, FB)), '#7f9dd0', 'none', 0, `opacity="0.15" filter="url(#${ID}b4)"`);
  s += P(quad(c(1, DM + 140, FB), c(1, DM + 190, FB), c(1.5, DM + 170, FB), c(1.5, DM + 128, FB)), '#cfe0fb', 'none', 0, `opacity="0.16" filter="url(#${ID}b4)"`);
  // 자판기의 붉은 빛이 바닥에 번짐
  s += `<ellipse cx="270" cy="840" rx="220" ry="80" fill="#c2303a" opacity="0.22" filter="url(#${ID}b20)"/>`;
  s += '</g>';
  return s;
}

// 신발장(옆 벽에 붙은 나무 칸칸이): side -1 = 왼쪽 벽, 1 = 오른쪽 벽
function shoeCabinet(side, s0, s1, rows, cols) {
  const wx = side < 0 ? WL : WR, fx = wx - side * 84, topY = 430;
  let s = '';
  s += P(quad(c(s0, wx, topY), c(s1, wx, topY), c(s1, fx, topY), c(s0, fx, topY)), '#3a2a20', EINK, 2.5);
  s += P(quad(c(s0, fx, topY), c(s1, fx, topY), c(s1, fx, FB), c(s0, fx, FB)), '#2a1e16', EINK, 3);
  s += P(quad(c(s0, fx, topY), c(s0, fx + side * 14, topY), c(s0, fx + side * 14, FB), c(s0, fx, FB)), '#352619', EINK, 2);
  let holes = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const a0 = s0 + (s1 - s0) * (i + 0.12) / cols, a1 = s0 + (s1 - s0) * (i + 0.88) / cols;
    const y0 = topY + 14 + (FB - topY - 40) * j / rows, y1 = topY + 14 + (FB - topY - 40) * (j + 0.8) / rows;
    holes += quad(c(a0, fx, y0), c(a1, fx, y0), c(a1, fx, y1), c(a0, fx, y1)) + ' ';
  }
  s += P(holes, '#0a0705', '#160f0a', 1.5);
  for (const [i, j] of [[1, 2], [2, 1], [0, 3], [1, 0], [2, 3]].filter(([i]) => i < cols)) {
    const a = s0 + (s1 - s0) * (i + 0.5) / cols, y = topY + 14 + (FB - topY - 40) * (j + 0.68) / rows;
    const p = at(a, fx, y);
    s += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(5 * a)}" ry="${f1(4 * a)}" fill="#6e6a64" opacity="0.55"/>`; // 실내화 앞코
  }
  s += P(`M${c(s0, fx, topY)} L${c(s1, fx, topY)}`, 'none', '#8ea6cf', 2, 'opacity="0.45"');
  return s;
}

function vendingMachine() {
  // 문 왼쪽 뒷벽에 붙은 음료 자판기: 어두운 붉은 몸통, 위쪽 견본 진열창이 희미하게 붉게 빛남, 동전 투입구, 아래 꺼내는 곳
  // 앞면은 깊이 SF(뒷벽보다 조금 앞), 오른쪽 옆면이 뒷벽까지 이어짐
  const SF = 1.06, X0 = 186, X1 = 324, Y0 = 290;
  const F = (x, y) => at(SF, x, y), Q = (x0, y0, x1, y1) => quad(pt(F(x0, y0)), pt(F(x1, y0)), pt(F(x1, y1)), pt(F(x0, y1)));
  const [fx0, fy0] = F(X0, Y0), [fx1, fy1] = F(X1, FB);
  let s = `<rect x="${f1(fx0 - 60)}" y="${f1(fy0 - 40)}" width="${f1(fx1 - fx0 + 120)}" height="${f1(fy1 - fy0 + 60)}" fill="#ff4b4f" opacity="0.1" filter="url(#${ID}b20)"/>`;
  s += P(quad(c(SF, X1, Y0), c(1, X1, Y0), c(1, X1, FB), c(SF, X1, FB)), '#2c0a0e', EINK, 2.5); // 오른쪽 옆면
  s += P(quad(c(SF, X0, Y0), c(1, X0, Y0), c(1, X1, Y0), c(SF, X1, Y0)), '#1c0609', EINK, 2); // 윗면(눈높이보다 위라 거의 안 보임)
  s += P(Q(X0, Y0, X1, FB), '#40101a', EINK, 3);
  s += P(Q(X0 + 3, Y0 + 4, X0 + 12, FB - 4), '#5a1820', 'none', 0, 'opacity="0.8"');
  // 견본 진열창(3단): 안쪽에서 흐린 분홍빛
  s += P(Q(X0 + 12, Y0 + 18, X1 - 12, Y0 + 200), '#8e4a50', EINK, 2.5);
  const canC = ['#8e2a31', '#a5652a', '#33507e', '#b3ab9c', '#3e6e44'];
  let cans = '';
  for (let j = 0; j < 3; j++) {
    const cy = Y0 + 30 + j * 58;
    for (let i = 0; i < 5; i++) {
      const cx = X0 + 22 + i * 22.6;
      cans += P(Q(cx, cy, cx + 15, cy + 32), canC[(i + j * 2) % 5], EINK, 1.5);
      const b = F(cx + 7.5, cy + 42);
      cans += `<circle cx="${f1(b[0])}" cy="${f1(b[1])}" r="3" fill="#d9a59a" stroke="${EINK}" stroke-width="1"/>`;
    }
  }
  s += cans;
  s += P(Q(X0 + 12, Y0 + 18, X1 - 12, Y0 + 200), '#ff8f8a', 'none', 0, 'opacity="0.18"');
  const g0 = F(X0 + 12, Y0 + 18), g1 = F(X0 + 50, Y0 + 18), g2 = F(X0 + 26, Y0 + 200), g3 = F(X0 + 12, Y0 + 200);
  s += P(`M${pt(g0)} L${pt(g1)} L${pt(g2)} L${pt(g3)} Z`, '#fff', 'none', 0, 'opacity="0.1"'); // 유리 반사
  // 동전 투입구·반환 레버, 꺼내는 곳
  s += P(Q(X1 - 50, Y0 + 222, X1 - 18, Y0 + 274), '#360c11', EINK, 2);
  s += P(Q(X1 - 38, Y0 + 230, X1 - 31, Y0 + 248), '#100406', 'none');
  s += P(Q(X0 + 22, FB - 100, X1 - 22, FB - 50), '#130406', EINK, 2.5);
  return s;
}

function ladder(sA, sB) {
  // 오른쪽 벽에 기대 세운 접이식 알루미늄 사다리(접힌 채)
  const top = 248, foot = 110;
  const a = at(sA, WR - 8, top), b = at(sB, WR - 8, top), d = at(sB + 0.03, WR - foot, FB), e = at(sA + 0.03, WR - foot, FB);
  let s = P(`M${pt(a)} L${pt(e)}`, 'none', '#6d7486', 9) + P(`M${pt(b)} L${pt(d)}`, 'none', '#555c6c', 9);
  s += P(`M${pt(a)} L${pt(e)} M${pt(b)} L${pt(d)}`, 'none', EINK, 2);
  let rungs = '';
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    const p = [a[0] + (e[0] - a[0]) * t, a[1] + (e[1] - a[1]) * t], q = [b[0] + (d[0] - b[0]) * t, b[1] + (d[1] - b[1]) * t];
    rungs += `M${pt(p)} L${pt(q)} `;
  }
  s += P(rungs, 'none', '#4d5363', 5);
  s += P(`M${pt(a)} L${pt(e)}`, 'none', '#b5c6e6', 2, 'opacity="0.5"');
  return s;
}

function corridorOpening(side, s0, s1) {
  // 가장자리의 어두운 복도 입구(옆 벽에 뚫린 큰 개구부)
  const wx = side < 0 ? WL : WR, top = 150;
  let s = P(quad(c(s0, wx, top), c(s1, wx, top), c(s1, wx, FB), c(s0, wx, FB)), '#010102', EINK, 3);
  s += P(quad(c(s0, wx, top), c(s0, wx - side * 70, top), c(s0, wx - side * 70, FB), c(s0, wx, FB)), '#090c13', EINK, 2);
  return s;
}


export function draw() {
  const lin = (id, x1, y1, x2, y2, stops) => `<linearGradient id="${ID}${id}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">` +
    stops.map(([o, col, op = 1]) => `<stop offset="${o}" stop-color="${col}" stop-opacity="${op}"/>`).join('') + '</linearGradient>';
  const dT = DIARY.map(([X, Z]) => tp(X, Z, DIARY_H)), bT = CBOX.map(([X, Z]) => tp(X, Z, DIARY_H + CBOX_H));
  const defs =
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4c"/><stop offset="0.24" stop-color="#3c5683"/><stop offset="0.3" stop-color="#4e6a99"/></linearGradient>` +
    `<linearGradient id="${ID}yard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f86ad"/><stop offset="0.5" stop-color="#9db3d6"/><stop offset="1" stop-color="#7b92ba"/></linearGradient>` +
    `<filter id="${ID}b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>` +
    `<filter id="${ID}dof" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="1.6"/></filter>` +
    // 앞쪽 신발장·소품: 어둠 속이라 한 단계 누르고, 카메라 바로 앞이라 아주 살짝 흐림
    `<filter id="${ID}fg" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.8 0 0 0 0  0 0.8 0 0 0  0 0 0.88 0 0.01  0 0 0 1 0"/><feGaussianBlur stdDeviation="0.7"/></filter>` +
    `<clipPath id="${ID}floorClip"><path d="${quad(c(1, WL, FB), c(1, WR, FB), c(4, WR, FB), c(4, WL, FB))}"/></clipPath>` +
    // 초상화
    `<image id="${ID}hm" href="${HM.uri}" x="${f1(BX)}" y="${f1(BY)}" width="${f1(BW)}" height="${f1(BH)}" preserveAspectRatio="none"/>` +
    `<mask id="${ID}hmA" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536" style="mask-type:alpha"><use href="#${ID}hm"/></mask>` +
    // 장면 조명: 역광이라 앞면은 어둡고 푸르게(얼굴은 읽히게) + 키운 만큼 살짝 또렷하게
    `<filter id="${ID}grade" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` +
    `<feColorMatrix type="matrix" values="0.64 0.02 0 0 0  0 0.68 0.03 0 0.004  0 0.03 0.82 0 0.03  0 0 0 1 0"/></filter>` +
    // 달빛 테두리: 실루엣 위·오른쪽(열린 문 쪽) 가장자리 안쪽에 가늘게 + 안으로 번지는 옅은 빛
    `<filter id="${ID}rim" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">` +
    `<feMorphology in="SourceAlpha" operator="erode" radius="2" result="er"/>` +
    `<feOffset in="er" dx="-4" dy="4" result="o1"/><feComposite in="er" in2="o1" operator="out" result="r1"/>` +
    `<feOffset in="er" dx="3" dy="4" result="o2"/><feComposite in="er" in2="o2" operator="out" result="r2"/>` +
    `<feComponentTransfer in="r2" result="r2w"><feFuncA type="linear" slope="0.4"/></feComponentTransfer>` +
    `<feMerge result="rr"><feMergeNode in="r1"/><feMergeNode in="r2w"/></feMerge>` +
    `<feGaussianBlur in="rr" stdDeviation="1.4" result="rb"/><feGaussianBlur in="rr" stdDeviation="9" result="gl0"/>` +
    `<feComponentTransfer in="gl0" result="gl"><feFuncA type="linear" slope="0.7"/></feComponentTransfer>` +
    `<feComposite in="gl" in2="SourceAlpha" operator="in" result="gli"/>` +
    `<feFlood flood-color="#aac4ee" flood-opacity="0.8" result="fc"/><feComposite in="fc" in2="rb" operator="in" result="c1"/>` +
    `<feComposite in="fc" in2="gli" operator="in" result="c2"/>` +
    `<feMerge><feMergeNode in="c2"/><feMergeNode in="c1"/></feMerge></filter>` +
    lin('rimG', 0, BY, 0, BBOT, [[0, '#fff'], [0.55, '#fff', 0.85], [0.8, '#fff', 0.35], [1, '#fff', 0]]) +
    `<mask id="${ID}rimM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}rimG)"/></mask>` +
    lin('redG', BX, 0, BX + BW * 0.3, 0, [[0, '#ff3d4b', 0.3], [1, '#ff3d4b', 0]]) +
    lin('shadeG', BX + BW * 0.85, BY + BH * 0.1, BX + BW * 0.1, BY + BH * 0.9, [[0, '#0a1020', 0], [0.5, '#0a1020', 0.12], [1, '#0a1020', 0.42]]) +
    lin('lowG', 0, BBOT - 300, 0, BBOT, [[0, '#04060a', 0], [1, '#04060a', 0.6]]) +
    // 신발장 윗판 · 일기장 · 상자(먼 쪽이 달빛을 받아 밝음)
    lin('topG', 0, CAB_Y0, 0, CAB_Y1, [[0, WOODC.top0], [1, WOODC.top1]]) +
    lin('pinkG', 0, Math.min(dT[0][1], dT[1][1]), 0, Math.max(dT[2][1], dT[3][1]), [[0, PINK.top0], [1, PINK.top1]]) +
    lin('boxG', 0, Math.min(bT[0][1], bT[1][1]), 0, Math.max(bT[2][1], bT[3][1]), [[0, BOX.top0], [1, BOX.top1]]) +
    `<radialGradient id="${ID}vig" cx="520" cy="620" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.74" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    `<linearGradient id="${ID}bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></linearGradient>` +
    `<radialGradient id="${ID}door" cx="${DM + 80}" cy="540" r="440" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9fbbe8" stop-opacity="0.32"/><stop offset="1" stop-color="#9fbbe8" stop-opacity="0"/></radialGradient>`;

  let s = `<rect width="1024" height="1536" fill="#05070b"/>`;
  // 배경(얕은 피사계 심도: 살짝 흐리게)
  let bg = walls() + outside() + doors() + floor();
  bg += corridorOpening(-1, 1.27, 1.6) + corridorOpening(1, 1.26, 1.6);
  bg += vendingMachine() + shoeCabinet(-1, 1.03, 1.3, 5, 3);
  bg += ladder(1.03, 1.08) + shoeCabinet(1, 1.11, 1.25, 5, 2);
  bg += exitSign();
  s += `<g filter="url(#${ID}dof)">${bg}</g>`;
  // 문으로 스며든 달빛이 공기에 번짐
  s += `<rect width="1024" height="1536" fill="url(#${ID}door)" style="mix-blend-mode:screen"/>`;
  s += boy();
  // 앞쪽 신발장과 그 위에 내려놓은 것들
  s += `<g filter="url(#${ID}fg)">${cabinet()}${moonPatch()}${diary()}${candyBox()}</g>`;
  // 비네트·아래 가장자리
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<rect y="1180" width="1024" height="356" fill="url(#${ID}bot)"/>`;
  return K.svg(s, { defs });
}
