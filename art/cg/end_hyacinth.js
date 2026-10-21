// end_hyacinth — 엔딩(보라 히아신스). 밤. 희민 혼자 겁에 질려 교문 밖으로 뛰쳐나온다(문 밖 길에서 교문 안쪽을 본 시점).
// 뒤로는 불 꺼진 교사, 3층 창 하나만 흐린 보랏빛 — 그 안에 목을 맨 소녀의 검은 그림자가 이쪽을 노려본다(희게 번뜩이는 두 눈).
// 앞쪽 길바닥에는 떨어뜨린 선물 상자가 리본이 풀린 채 옆으로 굴러 있고, 문 옆 화단의 보라 히아신스가 어둠 속에 핀다. 전체가 보랏빛.
// 희민은 힉스필드 초상화(heemin_scared)에 달리는 아랫몸(벡터)을 이어 붙인다.
import * as K from '../kit.js';
import { hfFig, school, candyBox, rng, leaf } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const ID = 'ehy';
const HZ = 860; // 교문 안 바닥선(운동장 끝)

// ---------------------------------------------------------------- 히아신스 한 대(꽃줄기 아래 x,y · 높이 h): 별 모양 작은 꽃이 촘촘히 달린 이삭
export function hyacinth(x, y, h, { col = '#9462d6', dark = '#4a2a78', hi = '#dcc2ff', line = '#140a22', seed = 1 } = {}) {
  const rnd = rng(seed);
  let s = '';
  // 잎(줄기 아래 길고 좁은 잎)
  for (const a of [-110, -80, -70, -100]) s += leaf(x, y, h * (0.55 + rnd() * 0.2), a + (rnd() - 0.5) * 20, { fill: '#18241e', line: '#060a08', vein: '#2e4a3a', wid: 0.12 });
  s += P(`M${x} ${y} L${x} ${y - h * 0.5}`, 'none', '#1e3024', 6);
  // 꽃송이(아래에서 위로, 위쪽이 작아짐)
  const n = 26;
  for (let i = 0; i < n; i++) {
    const t = i / n, yy = y - h * 0.38 - t * h * 0.62, ww = (1 - t * 0.6) * h * 0.13;
    const xx = x + (rnd() - 0.5) * ww * 2, r = h * 0.045 * (1 - t * 0.4);
    const back = rnd() < 0.4;
    let st = '';
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + rnd(); st += `${k ? 'L' : 'M'}${f1(xx + Math.cos(a) * r)} ${f1(yy + Math.sin(a) * r)} L${f1(xx + Math.cos(a + 0.52) * r * 0.45)} ${f1(yy + Math.sin(a + 0.52) * r * 0.45)} `; }
    s += P(st + 'Z', back ? dark : col, line, 1.2);
    if (!back) s += `<circle cx="${f1(xx - r * 0.2)}" cy="${f1(yy - r * 0.2)}" r="${f1(r * 0.22)}" fill="${hi}" opacity="0.7"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- 목맨 소녀의 그림자(창 안, 지역 좌표: 정수리 0,0 · 발끝 y≈420)
function hangingShadow() {
  let s = '';
  s += P('M0 -200 L0 10', 'none', '#000', 5); // 줄
  const B = '#000';
  s += P('M-16 330 L-14 420 L-4 420 L-4 330 Z M4 330 L4 420 L14 420 L16 330 Z', B); // 다리(발끝이 아래로)
  s += P('M-30 200 L30 200 C38 240 44 280 46 330 L-46 330 C-44 280 -38 240 -30 200 Z', B); // 치마
  s += P('M-42 92 C-20 84 20 84 42 92 C44 130 36 170 30 210 L-30 210 C-36 170 -44 130 -42 92 Z', B); // 몸통
  s += P('M-42 94 C-50 150 -52 210 -50 270 L-40 272 C-40 210 -38 150 -32 100 Z M42 94 C50 150 52 210 50 270 L40 272 C40 210 38 150 32 100 Z', B); // 늘어진 팔
  s += P('M-26 30 C-32 70 -36 120 -32 160 L-22 150 L-12 166 L0 152 L12 166 L22 150 L32 160 C36 120 32 70 26 30 Z', B); // 앞으로 흘러내린 머리
  s += `<ellipse cx="0" cy="34" rx="26" ry="30" fill="${B}"/>`;
  // 머리카락 틈으로 노려보는 눈 — 희게 번뜩임
  for (const x of [-10, 10]) s += `<ellipse cx="${x}" cy="58" rx="14" ry="9" fill="#e2ccff" opacity="0.6" filter="url(#${ID}b4)"/><path d="M${x - 8} 58 Q${x} 51 ${x + 8} 59 Q${x} 62 ${x - 8} 58 Z" fill="#fbf6ff"/><circle cx="${x + (x < 0 ? 1.5 : -1.5)}" cy="57.5" r="2.2" fill="#000"/>`;
  return s;
}
let LIT = null;
function litWindow() {
  const [wx, wy, ww, wh] = LIT;
  let s = `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="url(#${ID}litWin)"/>`;
  s += `<svg x="${wx}" y="${wy}" width="${ww}" height="${wh}" viewBox="0 0 ${ww} ${wh}" overflow="hidden"><g transform="translate(${ww * 0.44} 14) scale(0.28)">${hangingShadow()}</g></svg>`;
  s += P(`M${wx + ww / 2 + 30} ${wy} L${wx + ww / 2 + 30} ${wy + wh} M${wx} ${wy + wh * 0.62} L${wx + ww} ${wy + wh * 0.62}`, 'none', '#0b0812', 4);
  s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="none" stroke="#0b0812" stroke-width="5"/>`;
  return s;
}

// ---------------------------------------------------------------- 배경: 밤하늘 · 교사 · 교문 기둥과 담 · 길
function scene() {
  let s = `<rect width="1024" height="${HZ}" fill="url(#${ID}sky)"/>`;
  const rnd = rng(13);
  for (let i = 0; i < 40; i++) s += `<circle cx="${f1(rnd() * 1024)}" cy="${f1(rnd() * 420)}" r="${f1(0.6 + rnd() * 1.4)}" fill="#e6dcff" opacity="${f1(0.3 + rnd() * 0.5)}"/>`;
  // 교사 본관(멀리, 불 꺼짐)
  s += school(40, 700, HZ - 30, 96, { wall: '#18122a', wallHi: '#201a34', frame: '#0b0812', line: '#050308', door: '#07050b', win: k => (k === 0 ? '#100c18' : '#15102a') });
  // 오른쪽 가까운 별관(큰 창 3층) — 3층 가운데 창만 흐린 보랏빛(창 속 그림자는 litWindow 가 선명하게 다시 그림)
  const X0 = 560, X1 = 1060, FH = 190, BASE = HZ - 20;
  s += P(`M${X0} ${BASE} L${X0} ${BASE - FH * 3 - 30} L${X1} ${BASE - FH * 3 - 30} L${X1} ${BASE} Z`, '#1d1630', '#050308', 3);
  s += P(`M${X0 - 6} ${BASE - FH * 3 - 30} L${X1} ${BASE - FH * 3 - 30} L${X1} ${BASE - FH * 3 - 50} L${X0 - 6} ${BASE - FH * 3 - 50} Z`, '#271e3c', '#050308', 3);
  let lit = null;
  for (let k = 0; k < 3; k++) {
    s += P(`M${X0} ${BASE - FH * k} L${X1} ${BASE - FH * k}`, 'none', '#2a2140', 6);
    for (let j = 0; j < 3; j++) {
      const wx = X0 + 40 + j * 160, wy = BASE - FH * (k + 1) + 40, ww = 120, wh = 120;
      const isLit = k === 2 && j === 1;
      if (isLit) lit = [wx, wy, ww, wh];
      s += `<rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" fill="${isLit ? `url(#${ID}litWin)` : k === 0 ? '#0d0a16' : '#130e24'}" stroke="#0b0812" stroke-width="4"/>`;
    }
  }
  const [wx, wy, ww, wh] = lit;
  s += `<rect x="${wx - 60}" y="${wy - 50}" width="${ww + 120}" height="${wh + 100}" fill="#a77ae8" opacity="0.3" filter="url(#${ID}b30)"/>`;
  LIT = lit;
  // 운동장(어둠) + 교문 안쪽 길
  s += `<rect y="${HZ - 32}" width="1024" height="${1536 - HZ + 32}" fill="url(#${ID}ground)"/>`;
  // 교문 기둥(문 밖 가까이에서 봐 크다) + 담
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? -40 : 830, x1 = sd < 0 ? 194 : 1064;
    s += P(`M${x0} 1180 L${x0} ${HZ - 140} L${x1} ${HZ - 140} L${x1} 1180 Z`, '#231a2c', '#07050a', 3);
    let b = '';
    for (let y = HZ - 120; y < 1180; y += 26) b += `M${x0} ${y} L${x1} ${y} `;
    s += P(b, 'none', '#150f1c', 2, 'opacity="0.8"');
    const px = sd < 0 ? 150 : 830;
    s += P(`M${px} 1230 L${px} ${HZ - 330} L${px + 64} ${HZ - 330} L${px + 64} 1230 Z`, '#2c2236', '#07050a', 3);
    s += P(`M${px - 10} ${HZ - 330} L${px + 74} ${HZ - 330} L${px + 74} ${HZ - 356} L${px - 10} ${HZ - 356} Z`, '#3a2e46', '#07050a', 3);
    s += P(`M${sd < 0 ? px + 62 : px + 2} 1230 L${sd < 0 ? px + 62 : px + 2} ${HZ - 330}`, 'none', '#9c84d0', 2.5, 'opacity="0.4"');
  }
  // 반쯤 열린 철문(오른쪽 담 앞)
  let bars = '';
  for (let x = 700; x < 830; x += 15) bars += `M${x} 1170 L${x} ${HZ - 60} `;
  s += P(bars, 'none', '#120c18', 5) + P(`M694 ${HZ - 60} L834 ${HZ - 60} M694 1150 L834 1150`, 'none', '#120c18', 7);
  // 문 밖 길(앞쪽 아스팔트, 가로등 빛 웅덩이)
  s += `<path d="M0 1180 L1024 1180 L1024 1536 L0 1536 Z" fill="url(#${ID}road)"/>`;
  s += P('M-20 1300 L1044 1300', 'none', '#6c5a8a', 3, 'opacity="0.25" stroke-dasharray="60 40"');
  return s;
}

export function draw() {
  const grade = '0.58 0.04 0.06 0 0.01  0.02 0.5 0.06 0 0  0.06 0.04 0.8 0 0.04  0 0 0 1 0';
  const hm = hfFig(`${ID}h`, 'heemin_scared', {
    cx: 400, top: 560, s: 1.22, rot: -8, grade, rim: '#c9a8ff', rimDx: 4, rimDy: 4, rimOp: 0.9, fade: [0.68, 0.97], rimTo: 0.55,
    over: [{ fill: `url(#${ID}hShade)` }],
  });
  const defs = hm.defs +
    `<filter id="${ID}b4" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="${ID}dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.3"/></filter>` +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07050e"/><stop offset="0.6" stop-color="#1a1230"/><stop offset="1" stop-color="#2c1f48"/></linearGradient>` +
    `<linearGradient id="${ID}ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1528"/><stop offset="1" stop-color="#0a0710"/></linearGradient>` +
    `<linearGradient id="${ID}road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1628"/><stop offset="1" stop-color="#0b0812"/></linearGradient>` +
    `<radialGradient id="${ID}litWin" cx="0.5" cy="0.5" r="0.7"><stop offset="0" stop-color="#cdb2ff"/><stop offset="1" stop-color="#6a48a8"/></radialGradient>` +
    `<linearGradient id="${ID}hShade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="452" y2="656"><stop offset="0" stop-color="#140a26" stop-opacity="0.1"/><stop offset="1" stop-color="#140a26" stop-opacity="0.5"/></linearGradient>` +
    `<radialGradient id="${ID}lamp" cx="900" cy="1180" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b88ae8" stop-opacity="0.32"/><stop offset="1" stop-color="#b88ae8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="760" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#05020a" stop-opacity="0.6"/><stop offset="1" stop-color="#05020a" stop-opacity="0.95"/></radialGradient>`;
  let s = `<g filter="url(#${ID}dof)">${scene()}</g>` + litWindow();
  // 희민(달려 나옴) + 속도선
  s += `<ellipse cx="400" cy="1000" rx="320" ry="420" fill="#000" opacity="0.35" filter="url(#${ID}b30)"/>`;
  s += hm.body;
  s += P('M110 700 L20 716 M100 840 L10 864 M110 980 L30 1004 M690 760 L780 750 M700 900 L800 896', 'none', '#b9a2ea', 3, 'opacity="0.3"');
  // 떨어뜨린 선물 상자(길바닥, 옆으로 굴러 리본이 풀림) + 그림자
  s += `<ellipse cx="770" cy="1418" rx="150" ry="30" fill="#000" opacity="0.6" filter="url(#${ID}b12)"/>`;
  s += candyBox(770, 1372, 210, { rot: 24, box: '#4c4870', side: '#36325a', top: '#605c86', rib: '#8e2a4a', ribD: '#5a1630', line: '#16122a' });
  const rb = 'M712 1396 C680 1420 640 1430 600 1446 C570 1458 540 1452 506 1470';
  s += P(rb, 'none', '#16122a', 11) + P(rb, 'none', '#8e2a4a', 8);
  // 앞쪽 화단의 보라 히아신스(양옆)
  const rnd = rng(41);
  const fl = [[60, 1536, 420], [150, 1536, 340], [-20, 1500, 360], [230, 1560, 280], [980, 1536, 420], [1040, 1500, 340], [900, 1560, 300]];
  for (const [x, y, h] of fl) s += hyacinth(x, y, h, { seed: Math.floor(rnd() * 999) + 1 });
  s += `<rect width="1024" height="1536" fill="url(#${ID}lamp)" style="mix-blend-mode:screen"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
