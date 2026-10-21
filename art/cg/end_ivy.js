// end_ivy — 엔딩(아이비). 새벽, 학교 정문. 소영은 등을 보인 채 열린 정문 밖 새벽빛 속으로 걸어 나가고(작은 뒷모습, 긴 머리),
// 앞에는 남겨진 희민이 고개를 조금 숙인 채 끝내 열지 못한 리본 사탕 상자를 두 손으로 들고 서 있다(뒤돌아보지 않는다).
// 정문 기둥과 담장을 담쟁이(아이비)가 뒤덮었고, 화면 위 왼쪽 가장자리에서 담쟁이 덩굴이 늘어진다. 역광의 서늘한 새벽, 씁쓸한 여운.
// 희민은 힉스필드 초상화(heemin_serious), 소영 뒷모습은 벡터(backGirl — end_ebony 가 같이 쓴다).
import * as K from '../kit.js';
import { hfFig, lowerBoy, candyBox, rng } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const ID = 'eiv';

// ---------------------------------------------------------------- 공용: 걸어가는 소녀 뒷모습(지역 좌표: 정수리 0,0 · 발끝 y≈760, 폭 ±80)
// 긴 검은 머리가 허리까지, 남색 블레이저, 주름치마, 검은 스타킹. 한쪽 다리를 뒤로 디딘 걸음. rim: 테두리 빛 색(역광)
export function backGirl({ hair = '#06060a', coat = '#121628', skirt = '#141830', leg = '#0a0a10', skin = '#3a3036', line = '#020204', rim = '#ffd9b0', rimOp = 0.8, hairHi = '#4a4c60', shortHair = false } = {}) {
  let s = '';
  // 다리(왼발 앞 · 오른발 뒤로 들림) + 신발
  s += P('M-34 450 C-36 540 -38 620 -40 700 L-16 702 C-14 620 -10 540 -6 452 Z', leg, line, 2);
  s += P('M-42 698 L-14 700 L-12 718 L-46 716 Z', '#050507', line, 1.5);
  s += P('M8 452 C14 540 22 610 34 680 L58 674 C46 600 34 530 30 450 Z', leg, line, 2);
  s += P('M34 676 L60 670 L66 688 L40 694 Z', '#050507', line, 1.5);
  // 치마
  s += P('M-58 300 L58 300 C66 360 76 420 84 470 C40 486 -40 486 -84 470 C-76 420 -66 360 -58 300 Z', skirt, line, 2);
  s += P('M-40 310 L-56 470 M-14 310 L-20 480 M14 310 L20 480 M40 310 L56 470', 'none', '#05060c', 2, 'opacity="0.7"');
  // 팔(몸 옆으로 늘어짐, 걸음에 살짝 흔들림) + 손
  s += P('M-64 112 C-76 180 -82 250 -84 316 L-62 320 C-58 250 -52 190 -46 120 Z', coat, line, 2);
  s += P('M-84 316 C-88 334 -84 348 -74 350 C-64 348 -60 334 -62 320 Z', skin, line, 1.5);
  s += P('M64 112 C76 176 86 240 96 300 L74 306 C64 246 54 186 46 120 Z', coat, line, 2);
  s += P('M96 300 C102 318 98 332 88 334 C78 332 72 318 74 306 Z', skin, line, 1.5);
  // 블레이저 몸통(어깨 → 허리)
  s += P('M-62 104 C-30 92 30 92 62 104 C66 170 62 240 58 310 L-58 310 C-62 240 -66 170 -62 104 Z', coat, line, 2);
  s += P('M0 230 L0 310', 'none', '#05060c', 2, 'opacity="0.6"'); // 뒤트임
  // 뒷머리
  if (shortHair) {
    s += P('M-46 4 C-56 40 -58 80 -50 110 C-30 118 30 118 50 110 C58 80 56 40 46 4 C30 -14 -30 -14 -46 4 Z', hair, line, 2);
  } else {
    s += P('M-44 10 C-58 60 -66 140 -66 220 C-66 260 -60 290 -54 300 L-40 286 L-30 304 L-16 288 L0 306 L16 288 L30 304 L40 286 L54 300 C60 290 66 260 66 220 C66 140 58 60 44 10 C30 -8 -30 -8 -44 10 Z', hair, line, 2);
    s += P('M-30 30 C-40 100 -44 180 -44 270 M0 20 C0 100 0 190 2 290 M30 30 C40 100 44 180 44 270', 'none', hairHi, 1.5, 'opacity="0.5"');
  }
  // 정수리(둥근 뒤통수)
  s += `<ellipse cx="0" cy="40" rx="46" ry="48" fill="${hair}" stroke="${line}" stroke-width="2"/>`;
  s += P('M-30 10 C-14 -2 14 -2 30 10', 'none', hairHi, 2, 'opacity="0.6"');
  // 역광 테두리(양 가장자리)
  if (rim) s += P('M-46 20 C-58 60 -66 140 -66 220 M46 20 C58 60 66 140 66 220 M-84 316 C-82 250 -76 180 -64 112 M84 470 C76 420 66 360 58 300 M-84 470 C-76 420 -66 360 -58 300 M-40 700 C-38 620 -36 540 -34 450 M58 674 C46 600 34 530 30 450', 'none', rim, 2.5, `opacity="${rimOp}"`);
  return s;
}

// ---------------------------------------------------------------- 담쟁이 잎(손바닥 모양 세 갈래)
function ivyLeaf(x, y, r, ang, col, line = '#06100a', vein = '#3c5a44') {
  const d = `M0 0 C${-r * 0.6} ${-r * 0.05} ${-r * 1.05} ${-r * 0.35} ${-r * 0.92} ${-r * 0.72} C${-r * 0.8} ${-r * 0.82} ${-r * 0.55} ${-r * 0.8} ${-r * 0.42} ${-r * 0.86} C${-r * 0.4} ${-r * 1.1} ${-r * 0.15} ${-r * 1.3} 0 ${-r * 1.36} C${r * 0.15} ${-r * 1.3} ${r * 0.4} ${-r * 1.1} ${r * 0.42} ${-r * 0.86} C${r * 0.55} ${-r * 0.8} ${r * 0.8} ${-r * 0.82} ${r * 0.92} ${-r * 0.72} C${r * 1.05} ${-r * 0.35} ${r * 0.6} ${-r * 0.05} 0 0 Z`;
  return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})">` + P(d, col, line, 1.4) + P(`M0 0 L0 ${-r * 1.15} M0 ${-r * 0.3} L${-r * 0.7} ${-r * 0.65} M0 ${-r * 0.3} L${r * 0.7} ${-r * 0.65}`, 'none', vein, 1, 'opacity="0.7"') + '</g>';
}
// 덩굴 한 가닥(점들을 잇는 줄기 + 줄기 따라 잎)
function vine(pts, rnd, { r0 = 16, r1 = 26, cols = ['#1d3324', '#26432e', '#2f5236'], density = 1 } = {}) {
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += ` Q${f1((pts[i - 1][0] + pts[i][0]) / 2 + (rnd() - 0.5) * 30)} ${f1((pts[i - 1][1] + pts[i][1]) / 2)} ${f1(pts[i][0])} ${f1(pts[i][1])}`;
  let s = P(d, 'none', '#1a1410', 2.5);
  for (let i = 1; i < pts.length; i++) {
    const n = Math.round(3 * density);
    for (let k = 0; k < n; k++) {
      const t = rnd();
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t + (rnd() - 0.5) * 24, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t + (rnd() - 0.5) * 16;
      s += ivyLeaf(x, y, r0 + rnd() * (r1 - r0), -60 + rnd() * 120 + 180 * (rnd() < 0.3), cols[Math.floor(rnd() * cols.length)]);
    }
  }
  return s;
}

// ---------------------------------------------------------------- 배경: 운동장 끝의 정문(담장·기둥), 열린 문 너머 새벽 거리
const HZ = 760; // 지평선
function scene() {
  let s = `<rect width="1024" height="${HZ + 10}" fill="url(#${ID}sky)"/>`;
  // 문 밖 거리: 먼 아파트·전봇대 실루엣, 해가 막 뜨는 쪽(문 가운데 너머)
  s += `<circle cx="560" cy="${HZ - 60}" r="300" fill="#ffe2b8" opacity="0.55" filter="url(#${ID}b40)"/>`;
  s += `<circle cx="560" cy="${HZ - 40}" r="40" fill="#fff6e4"/>`;
  s += P(`M330 ${HZ} L330 ${HZ - 150} L400 ${HZ - 150} L400 ${HZ - 110} L470 ${HZ - 110} L470 ${HZ} Z M640 ${HZ} L640 ${HZ - 180} L720 ${HZ - 180} L720 ${HZ} Z`, '#8b7d92', 'none', 0, 'opacity="0.8"');
  s += P(`M610 ${HZ} L612 ${HZ - 230} M592 ${HZ - 210} L632 ${HZ - 212} M612 ${HZ - 214} C660 ${HZ - 200} 700 ${HZ - 196} 760 ${HZ - 200}`, 'none', '#6d6276', 3);
  // 땅(문 밖 길은 밝고, 운동장 쪽은 어두워짐)
  s += `<rect y="${HZ}" width="1024" height="${1536 - HZ}" fill="url(#${ID}ground)"/>`;
  // 문 밖에서 들어오는 빛 띠(바닥)
  s += `<path d="M400 ${HZ} L720 ${HZ} L1000 1536 L60 1536 Z" fill="#ffdcb0" opacity="0.16" filter="url(#${ID}b12)"/>`;
  // 담장(문 양쪽, 붉은 벽돌 + 담쟁이)
  const rnd = rng(31);
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? -20 : 724, x1 = sd < 0 ? 300 : 1044, top = HZ - 250, bot = HZ + 30;
    s += P(`M${x0} ${bot} L${x0} ${top} L${x1} ${top + (sd < 0 ? 30 : -30) * 0} L${x1} ${bot} Z`, '#4a2a2a', '#120808', 2);
    let b = '';
    for (let y = top + 18; y < bot; y += 18) b += `M${x0} ${y} L${x1} ${y} `;
    s += P(b, 'none', '#2a1616', 1.5, 'opacity="0.7"');
    // 담쟁이가 담을 덮음
    for (let k = 0; k < 7; k++) {
      const sx = x0 + rnd() * (x1 - x0), pts = [[sx, top - 10]];
      for (let j = 1; j < 5; j++) pts.push([sx + (rnd() - 0.5) * 80, top + j * 60]);
      s += vine(pts, rnd, { r0: 10, r1: 18, density: 1.4, cols: ['#2b3f34', '#34503e', '#3f5e46'] });
    }
  }
  // 문 기둥(두 개, 각진 콘크리트 + 위 갓돌) + 열려 한쪽으로 밀린 철문
  for (const [x, w] of [[300, 64], [660, 64]]) {
    s += P(`M${x} ${HZ + 40} L${x} ${HZ - 330} L${x + w} ${HZ - 330} L${x + w} ${HZ + 40} Z`, '#3a3238', '#0c0a0c', 2.5);
    s += P(`M${x - 8} ${HZ - 330} L${x + w + 8} ${HZ - 330} L${x + w + 8} ${HZ - 350} L${x - 8} ${HZ - 350} Z`, '#4a4048', '#0c0a0c', 2.5);
    s += P(`M${x + w - 6} ${HZ + 40} L${x + w - 6} ${HZ - 330}`, 'none', '#ffd2a8', 3, 'opacity="0.5"');
    const pts = [[x + 10, HZ - 340]];
    for (let j = 1; j < 7; j++) pts.push([x + w / 2 + (rnd() - 0.5) * 50, HZ - 340 + j * 60]);
    s += vine(pts, rnd, { r0: 12, r1: 20, density: 1.6, cols: ['#2b3f34', '#34503e', '#3f5e46'] });
  }
  // 오른쪽 담 쪽으로 밀어 둔 철문(세로 창살)
  let bars = '';
  for (let x = 730; x < 900; x += 14) bars += `M${x} ${HZ + 30} L${x} ${HZ - 160} `;
  s += P(bars, 'none', '#1a1618', 4) + P(`M724 ${HZ - 160} L904 ${HZ - 160} M724 ${HZ + 10} L904 ${HZ + 10}`, 'none', '#1a1618', 6);
  return s;
}

// 앞쪽 담쟁이(화면 위 왼쪽 가장자리에서 늘어진 덩굴 · 오른쪽 아래 덤불) — 어둡게(역광)
function foreIvy() {
  const rnd = rng(55);
  let s = '';
  const dark = ['#0e1a14', '#13231a', '#182b20'];
  for (let k = 0; k < 6; k++) {
    const sx = -20 + k * 46, pts = [[sx, -20]];
    const len = 3 + Math.floor(rnd() * 4);
    for (let j = 1; j <= len; j++) pts.push([sx + (rnd() - 0.3) * 50 + j * 6, j * 90]);
    s += vine(pts, rnd, { r0: 22, r1: 38, cols: dark, density: 1.6 });
  }
  for (let k = 0; k < 4; k++) {
    const sx = 1050, pts = [[sx, 20 + k * 40]];
    for (let j = 1; j < 4; j++) pts.push([sx - j * 50 - rnd() * 40, 20 + k * 40 + j * 40 + rnd() * 40]);
    s += vine(pts, rnd, { r0: 20, r1: 34, cols: dark, density: 1.4 });
  }
  return s;
}

export function draw() {
  // 소영 뒷모습(정문 사이, 문 밖으로 막 나섬)
  const girl = `<g transform="translate(506 ${HZ - 420}) scale(0.6)">${backGirl({ rim: '#ffe6c4', rimOp: 1, coat: '#1a2040', skirt: '#1c2038' })}</g>`;
  const hmGrade = '0.6 0.02 0 0 0  0 0.62 0.03 0 0.004  0 0.03 0.74 0 0.03  0 0 0 1 0';
  const hm = hfFig(`${ID}h`, 'heemin_serious', {
    cx: 560, top: 640, s: 1.34, rot: -1, grade: hmGrade, rim: '#ffd9b0', rimDx: -3, rimDy: 4, rimOp: 0.95, fade: [0.86, 1.0], rimTo: 0.5,
    over: [{ fill: `url(#${ID}hShade)` }],
    under: lowerBoy(450, 656, { coat: '#121628', pants: '#0b0c12' }),
  });
  const defs = hm.defs +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>` +
    `<filter id="${ID}dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6"/></filter>` +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4166"/><stop offset="0.45" stop-color="#9a8aa6"/><stop offset="0.8" stop-color="#f1c2a2"/><stop offset="1" stop-color="#ffe2c0"/></linearGradient>` +
    `<linearGradient id="${ID}ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a8a8e"/><stop offset="0.25" stop-color="#4a424e"/><stop offset="1" stop-color="#16141c"/></linearGradient>` +
    `<linearGradient id="${ID}hShade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="656"><stop offset="0" stop-color="#1a1830" stop-opacity="0.15"/><stop offset="1" stop-color="#1a1830" stop-opacity="0.45"/></linearGradient>` +
    `<radialGradient id="${ID}vig" cx="540" cy="700" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#05040a" stop-opacity="0.55"/><stop offset="1" stop-color="#05040a" stop-opacity="0.9"/></radialGradient>`;
  let s = `<g filter="url(#${ID}dof)">${scene()}${girl}</g>`;
  // 소영 발밑 긴 그림자(이쪽으로)
  s += `<path d="M512 ${HZ + 46} L540 ${HZ + 46} L600 ${HZ + 260} L560 ${HZ + 262} Z" fill="#1a1622" opacity="0.5" filter="url(#${ID}b12)"/>`;
  s += hm.body;
  // 희민 손에 든 사탕 상자(가슴 앞, 아래쪽 — 역광이라 어둑함) + 상자 양옆을 감싼 손가락
  const bx = 560, by = 1400, bw = 250;
  for (const sd of [-1, 1]) s += P(`M${bx + sd * 100} 1536 C${bx + sd * 110} 1480 ${bx + sd * 120} 1440 ${bx + sd * 130} 1410 L${bx + sd * 190} 1420 C${bx + sd * 190} 1460 ${bx + sd * 186} 1500 ${bx + sd * 180} 1536 Z`, '#121628', '#05060c', 2.5); // 소매
  s += candyBox(bx, by, bw, { rot: -2, box: '#8790b2', side: '#636c92', top: '#a3abca', rib: '#a02a38', ribD: '#6c1822', line: '#1c2140' });
  for (const sd of [-1, 1]) {
    const ex = bx + sd * (bw / 2 - 6);
    let f = '';
    for (let k = 0; k < 4; k++) {
      const fy = by - 14 + k * 19;
      f += P(`M${ex + sd * 12} ${fy} C${ex - sd * 4} ${fy - 1} ${ex - sd * 16} ${fy + 2} ${ex - sd * 18} ${fy + 9} C${ex - sd * 16} ${fy + 16} ${ex - sd * 4} ${fy + 18} ${ex + sd * 12} ${fy + 17} Z`, '#8f7a74', '#33231f', 2);
    }
    s += P(`M${ex + sd * 2} ${by - 30} C${ex + sd * 26} ${by - 26} ${ex + sd * 34} ${by + 40} ${ex + sd * 22} ${by + 80} L${ex + sd * 4} ${by + 76} Z`, '#8e766f', '#3a2826', 2) + f; // 손바닥 옆면 + 손가락
  }
  s += foreIvy();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
