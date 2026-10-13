// title_keyart — 타이틀 화면 배경(1080x1920). 교문 밖 낮은 시점에서 올려다본 밤의 본관.
// 위쪽: 달빛 받은 콘크리트 본관(위로 갈수록 좁아지는 3점 투시) + 왼쪽 끝 너머 밤하늘의 달·앙상한 가지.
// 2층 가운데 창 하나만 따뜻하게 희미한 빛, 그 안에 긴 생머리 소녀의 실루엣.
// 세로 28~72%(제목·버튼이 겹치는 띠): 불 꺼진 1층 벽과 그늘진 운동장, 어둡고 단순하게.
// 72% 아래: 닫힌 철 교문과 낮은 담의 검은 실루엣, 맨 아래는 검게.
import * as K from '../kit.js';

const W = 1080, H = 1920;
const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const INK = '#04050a';

// ---------------------------------------------------------------- 결정적 난수
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ---------------------------------------------------------------- 건물 투시
// 정면 외벽: 지면(y=GY)에서 폭 그대로, 위로 갈수록 소실점(VPY)으로 좁아짐
const GY = 864, VPY = -2400, CX = 540;
const sc = y => (y - VPY) / (GY - VPY);
const X = (u, y) => CX + u * sc(y);
const quad = (u0, u1, y0, y1) => `M${f1(X(u0, y0))} ${y0} L${f1(X(u1, y0))} ${y0} L${f1(X(u1, y1))} ${y1} L${f1(X(u0, y1))} ${y1} Z`;
const END_U = -410; // 건물 왼쪽 끝
const PITCH = 250, WIN_HALF = 96; // 창 간격·창 반폭(지면 기준 단위)
// 층별 창 위·아래(y)
const FLOORS = [
  { y0: 10, y1: 192, lit: false, f: 3 },
  { y0: 270, y1: 480, lit: true, f: 2 },
  { y0: 598, y1: 822, lit: false, f: 1 },
];
const LIT = { u0: -WIN_HALF, u1: WIN_HALF, y0: 270, y1: 480 };

// ---------------------------------------------------------------- 앙상한 나뭇가지(재귀, 끝으로 갈수록 가늘게)
// 굵은 줄기에서 몇 갈래로만 갈라지는 단정한 실루엣. keep(x,y)가 false인 곳(불 켜진 창 주변 등)으로는 뻗지 않는다.
function branch(out, r, x, y, ang, len, w, depth, keep) {
  const segs = 4;
  let cx = x, cy = y, a = ang;
  const L = [], R = [], bend = (r() - 0.5) * 0.24;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    pts.push([cx, cy, a]);
    if (i < segs) { a += bend + (r() - 0.5) * 0.12; cx += Math.cos(a) * len / segs; cy += Math.sin(a) * len / segs; }
  }
  if (!keep(cx, cy) || !keep(pts[2][0], pts[2][1])) return;
  pts.forEach(([px, py, pa], i) => {
    const t = i / segs, ww = Math.max(1.4, w * (1 - t * 0.42));
    const nx = Math.cos(pa + Math.PI / 2), ny = Math.sin(pa + Math.PI / 2);
    L.push([px + nx * ww / 2, py + ny * ww / 2]); R.push([px - nx * ww / 2, py - ny * ww / 2]);
  });
  out.push('M' + [...L, ...R.reverse()].map(p => `${f1(p[0])} ${f1(p[1])}`).join(' L') + ' Z');
  if (depth <= 0) return;
  // 곧게 이어지는 가지 + 옆으로 갈라지는 가지(번갈아 좌우), 위로 조금 끌림
  const side = r() < 0.5 ? -1 : 1;
  const up = (q) => q + (-Math.PI / 2 - q) * 0.12;
  branch(out, r, cx, cy, up(a + side * (0.12 + r() * 0.14)), len * (0.74 + r() * 0.1), w * 0.7, depth - 1, keep);
  branch(out, r, pts[2 + (r() < 0.5 ? 1 : 0)][0], pts[3][1], up(a - side * (0.55 + r() * 0.35)), len * (0.5 + r() * 0.16), w * 0.5, depth - 1, keep);
  if (depth >= 4 && r() < 0.55) branch(out, r, pts[1][0], pts[1][1], up(a + side * (0.7 + r() * 0.3)), len * 0.42, w * 0.4, depth - 2, keep);
}
function tree(seed, x, y, ang, len, w, depth, keep) {
  const out = [];
  branch(out, rng(seed), x, y, ang, len, w, depth, keep);
  return out.join(' ');
}
// 가지가 들어가면 안 되는 곳: 불 켜진 창 둘레, 그리고 제목 띠(28~72%) 안쪽 가운데
const awayFromWindow = (x, y) => !(x > 380 && x < 700 && y > 200 && y < 560) && !(y > 540 && x > 150 && x < 930);

// ---------------------------------------------------------------- 그리기
export function draw() {
  const defs =
    `<linearGradient id="tkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22345a"/><stop offset="0.5" stop-color="#16223d"/><stop offset="1" stop-color="#0b1122"/></linearGradient>` +
    `<radialGradient id="tkMoonHalo" cx="156" cy="214" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b9cbea" stop-opacity="0.55"/><stop offset="0.25" stop-color="#6f88b6" stop-opacity="0.25"/><stop offset="1" stop-color="#22345a" stop-opacity="0"/></radialGradient>` +
    // 외벽: 위쪽은 달빛에 푸르게, 1층(28% 아래)은 거의 검게
    `<linearGradient id="tkWall" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${GY}"><stop offset="0" stop-color="#4a5b7e"/><stop offset="0.3" stop-color="#36445f"/><stop offset="0.55" stop-color="#1c2335"/><stop offset="0.66" stop-color="#0d1019"/><stop offset="1" stop-color="#07080c"/></linearGradient>` +
    `<linearGradient id="tkMoonSide" gradientUnits="userSpaceOnUse" x1="150" y1="0" x2="1080" y2="300"><stop offset="0" stop-color="#9db4dc" stop-opacity="0.22"/><stop offset="0.6" stop-color="#9db4dc" stop-opacity="0.04"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></linearGradient>` +
    `<linearGradient id="tkGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a2440"/><stop offset="0.42" stop-color="#0b1020"/><stop offset="0.5" stop-color="#2a3a5e"/><stop offset="0.58" stop-color="#0c1222"/><stop offset="1" stop-color="#070a14"/></linearGradient>` +
    `<linearGradient id="tkGlassDim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a0d16"/><stop offset="0.5" stop-color="#0e121c"/><stop offset="1" stop-color="#06070b"/></linearGradient>` +
    `<radialGradient id="tkLit" cx="${CX}" cy="330" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f4e7c8"/><stop offset="0.55" stop-color="#d9bf8f"/><stop offset="1" stop-color="#a18259"/></radialGradient>` +
    `<radialGradient id="tkBloom" cx="${CX}" cy="380" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f3d9a6" stop-opacity="0.42"/><stop offset="0.45" stop-color="#c79a62" stop-opacity="0.14"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="tkYard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15151d"/><stop offset="0.35" stop-color="#0e0d13"/><stop offset="1" stop-color="#060508"/></linearGradient>` +
    `<radialGradient id="tkHaze" cx="${CX}" cy="1040" r="760" gradientUnits="userSpaceOnUse" gradientTransform="translate(0 1040) scale(1 0.36) translate(0 -1040)"><stop offset="0" stop-color="#3f0c18" stop-opacity="0.34"/><stop offset="0.6" stop-color="#2c0912" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="tkGateBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1b26" stop-opacity="0"/><stop offset="0.12" stop-color="#1d1b26" stop-opacity="0.9"/><stop offset="0.45" stop-color="#15141c" stop-opacity="0.8"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="tkBottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/></linearGradient>` +
    `<radialGradient id="tkVig" cx="${CX}" cy="760" r="1250" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></radialGradient>` +
    `<filter id="tkB40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>` +
    `<filter id="tkB12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="tkB4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<clipPath id="tkFacade"><path d="${quad(END_U, 2000, -10, GY)}"/></clipPath>` +
    `<clipPath id="tkLitWin"><path d="${quad(LIT.u0, LIT.u1, LIT.y0, LIT.y1)}"/></clipPath>`;

  let s = '';
  // ---------------- 하늘(건물 왼쪽 끝 너머) + 달
  s += `<rect width="${W}" height="${GY + 20}" fill="url(#tkSky)"/>`;
  s += `<rect width="${W}" height="${GY}" fill="url(#tkMoonHalo)"/>`;
  s += `<circle cx="156" cy="214" r="58" fill="#e3eaf4" stroke="#8ea3c6" stroke-width="3"/>`;
  s += `<g opacity="0.35"><ellipse cx="138" cy="200" rx="18" ry="13" fill="#a9b8d2"/><ellipse cx="174" cy="236" rx="13" ry="9" fill="#a9b8d2"/><ellipse cx="176" cy="190" rx="8" ry="6" fill="#a9b8d2"/></g>`;
  // 엷은 구름 띠
  s += P('M-20 320 C60 300 160 312 240 300 L240 318 C170 332 70 330 -20 344 Z', '#2c3c62', 'none', 0, 'opacity="0.7"');
  s += P('M-20 110 C40 98 110 104 200 92 L200 104 C130 116 50 114 -20 124 Z', '#2c3c62', 'none', 0, 'opacity="0.55"');

  // ---------------- 본관 외벽
  let b = '';
  b += `<rect x="0" y="-10" width="${W}" height="${GY + 10}" fill="url(#tkWall)"/>`;
  // 층 사이 슬래브 띠(달빛 받은 앞면) + 그 아래 그늘
  for (const [y0, y1] of [[214, 240], [520, 546]]) {
    b += P(quad(END_U, 2000, y0, y1), y0 < 300 ? '#56688e' : '#28324a', INK, 2.5);
    b += P(quad(END_U, 2000, y1, y1 + 12), '#000', 'none', 0, 'opacity="0.28"');
  }
  // 기둥(창 사이): 오른쪽 면은 그늘
  for (let k = -1; k <= 4; k++) {
    const u = (k - 0.5) * PITCH;
    b += P(quad(u + 10, u + 26, -10, GY), '#000', 'none', 0, 'opacity="0.22"');
    b += P(`M${f1(X(u - 26, -10))} -10 L${f1(X(u - 26, 520))} 520`, 'none', '#6c7fa6', 2.5, 'opacity="0.35"');
  }
  // 창(같은 모양이 줄지어)
  for (const fl of FLOORS) {
    const dim = fl.f === 1;
    for (let k = -1; k <= 4; k++) {
      const u0 = k * PITCH - WIN_HALF, u1 = k * PITCH + WIN_HALF;
      if (fl.lit && k === 0) continue;
      const tr = fl.y0 + (fl.y1 - fl.y0) * 0.2;
      // 창틀(알루미늄) → 유리 → 가로살(위 고정창) · 창턱
      b += P(quad(u0 - 8, u1 + 8, fl.y0 - 8, fl.y1 + 4), dim ? '#10131b' : '#45536f', INK, 3);
      b += P(quad(u0, u1, fl.y0, fl.y1), dim ? 'url(#tkGlassDim)' : 'url(#tkGlass)', INK, 2.5);
      b += P(quad(u0, u1, tr - 4, tr + 4), dim ? '#10131b' : '#3d4a64', INK, 2);
      if (!dim) {
        // 유리에 비친 달빛(사선 한 줄)
        const rx = u0 + (u1 - u0) * (0.18 + ((k + 4) % 3) * 0.08);
        b += P(`M${f1(X(rx, tr + 8))} ${tr + 8} L${f1(X(rx + 40, tr + 8))} ${tr + 8} L${f1(X(rx - 20, fl.y1))} ${fl.y1} L${f1(X(rx - 60, fl.y1))} ${fl.y1} Z`, '#7f97c4', 'none', 0, 'opacity="0.13"');
      }
      b += P(quad(u0 - 14, u1 + 14, fl.y1 + 4, fl.y1 + 14), dim ? '#0c0e14' : '#5a6b90', INK, 2.5);
      b += P(quad(u0 - 14, u1 + 14, fl.y1 + 14, fl.y1 + 26), '#000', 'none', 0, 'opacity="0.3"');
    }
  }
  // 1층 현관 쪽: 더 깊은 어둠(입구가 어둠에 묻힘)
  b += P(quad(-150, 150, 560, GY), '#030305', 'none', 0, 'opacity="0.55" filter="url(#tkB12)"');
  // 1층은 더 어둡게(달빛이 닿지 않음)
  b += `<rect x="0" y="548" width="${W}" height="${GY - 548}" fill="#030408" opacity="0.45"/>`;
  // 건물 밑단
  b += P(quad(END_U, 2000, GY - 22, GY), '#050609', INK, 2.5);
  // 달빛(왼쪽 위에서) 덧칠
  b += `<rect x="0" y="-10" width="${W}" height="600" fill="url(#tkMoonSide)"/>`;
  s += `<g clip-path="url(#tkFacade)">${b}</g>`;
  // 건물 왼쪽 모서리 선(달빛 받은 모서리)
  s += P(`M${f1(X(END_U, -10))} -10 L${f1(X(END_U, GY))} ${GY}`, 'none', INK, 4);
  s += P(`M${f1(X(END_U + 7, -10))} -10 L${f1(X(END_U + 7, 560))} 560`, 'none', '#9fb3d8', 3, 'opacity="0.55"');

  // ---------------- 불 켜진 2층 창 + 소녀 실루엣
  const lu0 = LIT.u0, lu1 = LIT.u1, ly0 = LIT.y0, ly1 = LIT.y1;
  s += `<rect x="0" y="0" width="${W}" height="${GY}" fill="url(#tkBloom)" style="mix-blend-mode:screen"/>`;
  s += P(quad(lu0 - 8, lu1 + 8, ly0 - 8, ly1 + 4), '#6a5a48', INK, 3);
  let w = '';
  w += `<rect x="300" y="200" width="480" height="320" fill="url(#tkLit)"/>`;
  // 소녀(창밖을 향해 섬): 어깨 → 목 → 얼굴(아주 조금 밝은 그늘) → 정수리에서 얼굴 양옆으로 갈라져 가슴 앞까지 곧게 내려온 긴 생머리.
  // 고개를 조금 기울임
  const g = CX;
  const body = `M${g - 34} 410 C${g - 52} 412 ${g - 66} 418 ${g - 70} 434 C${g - 73} 450 ${g - 74} 466 ${g - 76} 488 L${g + 76} 488 C${g + 74} 466 ${g + 73} 450 ${g + 70} 434 C${g + 66} 418 ${g + 52} 412 ${g + 34} 410 Z`;
  const neck = `M${g - 11} 384 L${g - 12} 414 L${g + 12} 414 L${g + 11} 384 Z`;
  const face = `M${g - 24} 352 C${g - 24} 376 ${g - 12} 394 ${g} 395 C${g + 12} 394 ${g + 24} 376 ${g + 24} 352 C${g + 24} 336 ${g + 12} 330 ${g} 330 C${g - 12} 330 ${g - 24} 336 ${g - 24} 352 Z`;
  // 머리카락: 정수리 덮개 + 얼굴 양옆 장막 + 앞으로 내려온 두 다발(가운데는 목·가슴이 보임)
  const hairTop = `M${g} 318 C${g - 24} 318 ${g - 33} 334 ${g - 33} 354 L${g - 22} 356 C${g - 18} 342 ${g - 6} 338 ${g} 344 C${g + 6} 338 ${g + 18} 342 ${g + 22} 356 L${g + 33} 354 C${g + 33} 334 ${g + 24} 318 ${g} 318 Z`;
  const lock = d => `M${d * 33} 350 C${d * 34} 372 ${d * 32} 392 ${d * 34} 412 C${d * 38} 440 ${d * 42} 464 ${d * 46} 490 L${d * 24} 490 C${d * 22} 466 ${d * 20} 440 ${d * 17} 416 C${d * 15} 398 ${d * 19} 380 ${d * 21} 354 Z`;
  w += `<g transform="rotate(-5 ${g} 420)">`;
  w += P(body, '#2c1b22', 'none') + P(neck, '#22151a', 'none') + P(face, '#1c1216', 'none');
  w += `<g transform="translate(${g} 0)">` + P(lock(-1) + ' ' + lock(1), '#0b0709', 'none') + '</g>';
  w += P(hairTop, '#0b0709', 'none');
  // 머리카락 가장자리에 아주 얇게 비치는 빛(역광)
  w += P(`M${g - 20} 324 C${g - 8} 318 ${g + 8} 318 ${g + 20} 324 M${g - 33} 356 C${g - 34} 380 ${g - 33} 398 ${g - 35} 414 M${g + 33} 356 C${g + 34} 380 ${g + 33} 398 ${g + 35} 414`, 'none', '#f0dcb6', 1.6, 'opacity="0.5"');
  w += P(`M${g - 66} 422 C${g - 56} 414 ${g - 46} 411 ${g - 36} 410 M${g + 66} 422 C${g + 56} 414 ${g + 46} 411 ${g + 36} 410`, 'none', '#e9cfa2', 1.6, 'opacity="0.45"');
  w += '</g>';
  s += `<g clip-path="url(#tkLitWin)">${w}</g>`;
  s += P(quad(lu0, lu1, ly0, ly1), 'none', INK, 2.5);
  const ltr = ly0 + (ly1 - ly0) * 0.2;
  s += P(quad(lu0, lu1, ltr - 4, ltr + 4), '#5b4b3b', INK, 2);
  // 창턱에 떨어진 빛
  s += P(quad(lu0 - 14, lu1 + 14, ly1 + 4, ly1 + 14), '#c9ae84', INK, 2.5);
  s += P(quad(lu0 - 14, lu1 + 14, ly1 + 14, ly1 + 40), '#d9b77e', 'none', 0, 'opacity="0.16" filter="url(#tkB4)"');

  // ---------------- 운동장(28~72% 띠: 단순하고 어둡게) + 아주 옅은 검붉은 기운
  s += `<rect x="0" y="${GY}" width="${W}" height="${H - GY}" fill="url(#tkYard)"/>`;
  s += `<rect x="0" y="${GY - 40}" width="${W}" height="700" fill="url(#tkHaze)"/>`;
  s += `<rect x="0" y="${GY}" width="${W}" height="6" fill="#000" opacity="0.6"/>`;
  // 교문 바로 뒤 땅은 아주 조금 밝게(창살 실루엣이 읽히도록) — 72% 아래만
  s += `<rect x="0" y="1386" width="${W}" height="420" fill="url(#tkGateBack)"/>`;

  // ---------------- 앙상한 나무(양옆) — 줄기는 가장자리, 가지는 위쪽 구석으로
  const kL = (x, y) => awayFromWindow(x, y) && x < 470, kR = (x, y) => awayFromWindow(x, y) && x > 640;
  const treeL = P('M-30 1440 L50 1440 C46 1200 40 900 30 640 L-30 600 Z', '#05060a', 'none') +
    P(tree(7, 24, 700, -1.2, 230, 30, 6, kL) + ' ' + tree(12, 14, 640, -1.62, 260, 28, 6, kL) + ' ' + tree(3, 4, 900, -0.85, 200, 18, 5, kL), '#05060a', 'none');
  const treeR = P('M1030 1440 L1110 1440 L1110 560 C1080 600 1060 620 1056 700 C1050 900 1040 1200 1030 1440 Z', '#05060a', 'none') +
    P(tree(29, 1062, 660, -1.95, 250, 30, 6, kR) + ' ' + tree(44, 1074, 600, -1.5, 240, 26, 6, kR) + ' ' + tree(51, 1078, 860, -2.35, 210, 18, 5, kR), '#05060a', 'none');
  s += treeL + treeR;
  // 달빛을 받은 줄기 왼쪽 가장자리
  s += P('M48 1300 C44 1100 40 900 32 700 M1034 1300 C1040 1100 1046 900 1052 720', 'none', '#2b3856', 3, 'opacity="0.7"');

  // ---------------- 닫힌 철 교문 + 낮은 담(72% 아래)
  let gt = '';
  const GTOP = 1452;
  // 담
  gt += P(`M-10 1540 L150 1528 L150 ${H} L-10 ${H} Z M930 1528 L1090 1540 L1090 ${H} L930 ${H} Z`, '#030305', INK, 3);
  gt += P('M-10 1540 L150 1528 M930 1528 L1090 1540', 'none', '#33405c', 3, 'opacity="0.55"');
  // 문기둥(사각 콘크리트) + 갓돌
  for (const [x0, x1] of [[96, 196], [884, 984]]) {
    gt += P(`M${x0} 1400 L${x1} 1400 L${x1} ${H} L${x0} ${H} Z`, '#040407', INK, 3);
    gt += P(`M${x0 - 12} 1384 L${x1 + 12} 1384 L${x1 + 12} 1404 L${x0 - 12} 1404 Z`, '#06070b', INK, 3);
    gt += P(`M${x0 - 12} 1385 L${x1 + 12} 1385`, 'none', '#3a4865', 3, 'opacity="0.7"');
    gt += P(`M${x0 + 3} 1406 L${x0 + 3} 1600`, 'none', '#2b3650', 3, 'opacity="0.5"');
  }
  // 철문 두 짝: 가로대 + 굵은 세로살(촘촘하지 않게) + 창살 끝 뾰족
  const bars = [];
  for (let x = 236; x <= 850; x += 68) bars.push(x);
  let gate = '';
  gate += P(`M196 ${GTOP} L884 ${GTOP} L884 ${GTOP + 22} L196 ${GTOP + 22} Z M196 1640 L884 1640 L884 1660 L196 1660 Z`, '#020203', INK, 3);
  for (const x of bars) {
    gate += P(`M${x - 8} ${GTOP - 22} L${x + 8} ${GTOP - 22} L${x + 8} ${H} L${x - 8} ${H} Z`, '#020203', INK, 3);
    gate += P(`M${x - 13} ${GTOP - 22} L${x} ${GTOP - 54} L${x + 13} ${GTOP - 22} L${x} ${GTOP - 16} Z`, '#020203', INK, 3);
  }
  gate += P(`M537 ${GTOP - 30} L543 ${GTOP - 30} L543 ${H} L537 ${H} Z`, '#020203', INK, 3); // 두 짝이 맞닿는 선
  // 달빛이 닿은 위쪽 가장자리(아주 가늘게)
  gate += P(`M196 ${GTOP + 1} L884 ${GTOP + 1}`, 'none', '#4a5a7c', 2.5, 'opacity="0.6"');
  for (const x of bars) gate += P(`M${x - 10} ${GTOP - 24} L${x} ${GTOP - 49}`, 'none', '#5d6f96', 2.2, 'opacity="0.65"');
  gt += gate;
  s += gt;

  // ---------------- 비네트 + 맨 아래 검게
  s += `<rect width="${W}" height="${H}" fill="url(#tkVig)"/>`;
  s += `<rect x="0" y="1560" width="${W}" height="360" fill="url(#tkBottom)"/>`;
  return K.svg(s, { w: W, h: H, defs });
}
