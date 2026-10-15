// cg_piano — 2장 3층 음악실. 형광등이 켜지자 피아노 앞에 앉은 '누군가'(음악 교사 김지원의 혼)가 피 묻은 손가락으로 건반을 내리찍는다.
// 등을 보인 채 구부정하게 앉은 검은 양복의 남자, 창백한 목덜미, 어깨 위로 치켜든 두 손. 건반·피아노 앞판에 핏자국과 흘러내린 자국.
// 보면대에는 숫자 악보(3 · 2 · 4 · 5 · 4). 왼쪽 아래 앞: 놀라 굳은 희민(힉스필드 초상화 합성, 차갑게 어둡게 + 형광등 쪽 테두리 빛).
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const INK = '#06070a';
const ID = 'pn';

// 피아노(정면) 상자
const PX0 = 250, PX1 = 990, PTOP = 520, KEY = 880, PBOT = 1120;

function room() {
  let s = '';
  s += `<rect width="1024" height="1536" fill="#151b1f"/>`;
  s += P('M0 0 L1024 0 L1024 1060 L0 1060 Z', '#1b2328'); // 벽
  s += P('M0 1060 L1024 1060 L1024 1536 L0 1536 Z', '#2a1e16'); // 마루
  for (let i = 0; i < 14; i++) { const y = 1060 + i * i * 2.9 + i * 6; s += P(`M0 ${f1(y)} L1024 ${f1(y)}`, 'none', '#1c140e', 3); }
  for (let i = -8; i < 12; i++) s += P(`M${512 + i * 30} 1060 L${512 + i * 150} 1536`, 'none', '#22180f', 2);
  // 칠판(오선)
  s += P('M60 150 L760 150 L760 470 L60 470 Z', '#1d3027', INK, 5);
  s += P('M60 470 L760 470 L760 486 L60 486 Z', '#3b2b1d', INK, 3);
  for (const y0 of [200, 330]) for (let i = 0; i < 5; i++) s += P(`M90 ${y0 + i * 16} L730 ${y0 + i * 16}`, 'none', '#9fb3a6', 2, 'opacity="0.45"');
  s += P('M110 186 C96 214 124 236 110 262 C100 280 118 296 128 278', 'none', '#b9c9bd', 4, 'opacity="0.5"'); // 높은음자리표 흉내
  for (const [x, y] of [[220, 222], [300, 214], [380, 238], [470, 206], [560, 230]]) s += `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="#b9c9bd" opacity="0.5"/>` + P(`M${x + 10} ${y} L${x + 10} ${y - 44}`, 'none', '#b9c9bd', 3, 'opacity="0.5"');
  // 오른쪽 창(검은 밤)
  s += P('M820 120 L1000 120 L1000 470 L820 470 Z', '#05080d', '#2c3338', 8);
  s += P('M910 120 L910 470 M820 296 L1000 296', 'none', '#2c3338', 6);
  // 천장 형광등(화면 위 바깥) 빛
  s += `<rect width="1024" height="1536" fill="url(#${ID}tube)" style="mix-blend-mode:screen"/>`;
  return s;
}

function piano() {
  let s = '';
  s += P(`M${PX0} ${PTOP} L${PX1} ${PTOP} L${PX1} ${PBOT} L${PX0} ${PBOT} Z`, '#0e0a09', INK, 5);
  s += P(`M${PX0 - 14} ${PTOP - 26} L${PX1 + 14} ${PTOP - 26} L${PX1 + 14} ${PTOP} L${PX0 - 14} ${PTOP} Z`, '#1d1512', INK, 4); // 뚜껑
  s += P(`M${PX0 - 14} ${PTOP - 26} L${PX1 + 14} ${PTOP - 26}`, 'none', '#b4c3cc', 3, 'opacity="0.5"');
  s += P(`M${PX0 + 40} ${PTOP + 40} L${PX1 - 40} ${PTOP + 40} L${PX1 - 40} ${KEY - 80} L${PX0 + 40} ${KEY - 80} Z`, '#150f0d', '#2a201b', 3); // 윗판 장식
  s += P(`M${PX0 + 40} ${PTOP + 40} L${PX1 - 40} ${PTOP + 40}`, 'none', '#d6e3ea', 3, 'opacity="0.35"');
  // 보면대 숫자 악보
  s += P('M470 610 L760 610 L760 760 L470 760 Z', '#d9d3c2', INK, 3);
  for (let i = 0; i < 5; i++) s += P(`M490 ${640 + i * 9} L740 ${640 + i * 9}`, 'none', '#8e8878', 1.5);
  s += `<text x="615" y="728" font-family="serif" font-size="40" font-weight="700" fill="#2a2420" text-anchor="middle" letter-spacing="4">3·2·4·5·4</text>`;
  s += P('M462 760 L768 760 L768 774 L462 774 Z', '#2a201b', INK, 3);
  // 건반 받침·건반
  s += P(`M${PX0} ${KEY - 40} L${PX1} ${KEY - 40} L${PX1} ${KEY} L${PX0} ${KEY} Z`, '#1a1310', INK, 4);
  s += P(`M${PX0 + 10} ${KEY} L${PX1 - 10} ${KEY} L${PX1 + 6} ${KEY + 54} L${PX0 - 6} ${KEY + 54} Z`, '#e9e5da', INK, 3);
  const n = 36, kw = (PX1 - PX0 + 12) / n;
  for (let i = 1; i < n; i++) {
    const x = PX0 - 6 + i * kw;
    s += P(`M${f1(x + (i - n / 2) * 0.15)} ${KEY} L${f1(x)} ${KEY + 54}`, 'none', '#8f8a80', 1.5);
    if (![0, 3].includes(i % 7)) s += P(`M${f1(x - kw * 0.3)} ${KEY} L${f1(x + kw * 0.3)} ${KEY} L${f1(x + kw * 0.3)} ${KEY + 32} L${f1(x - kw * 0.3)} ${KEY + 32} Z`, '#0b0908');
  }
  s += P(`M${PX0} ${KEY + 54} L${PX1} ${KEY + 54} L${PX1} ${KEY + 70} L${PX0} ${KEY + 70} Z`, '#120d0b', INK, 3);
  // 아랫판 + 페달
  s += P(`M${PX0 + 40} ${KEY + 110} L${PX1 - 40} ${KEY + 110} L${PX1 - 40} ${PBOT - 40} L${PX0 + 40} ${PBOT - 40} Z`, '#120d0b', '#2a201b', 3);
  for (const x of [570, 620, 670]) s += `<rect x="${x - 12}" y="${PBOT - 22}" width="24" height="12" rx="4" fill="#9c8a52" stroke="${INK}" stroke-width="2"/>`;
  // 핏자국: 건반 위 + 앞판으로 흘러내림
  let b = '';
  for (const [x, w, d] of [[330, 46, 120], [420, 28, 60], [700, 60, 170], [800, 34, 90], [880, 40, 140], [560, 22, 40]]) {
    b += P(`M${x} ${KEY + 4} C${x + w * 0.3} ${KEY - 6} ${x + w * 0.8} ${KEY + 2} ${x + w} ${KEY + 10} L${x + w * 0.9} ${KEY + 40} C${x + w * 0.6} ${KEY + 48} ${x + w * 0.3} ${KEY + 44} ${x + 4} ${KEY + 36} Z`, '#8d0d14');
    b += P(`M${x + w * 0.45} ${KEY + 40} L${x + w * 0.42} ${KEY + 40 + d} C${x + w * 0.4} ${KEY + 52 + d} ${x + w * 0.56} ${KEY + 52 + d} ${x + w * 0.54} ${KEY + 40 + d} L${x + w * 0.56} ${KEY + 42} Z`, '#6f0a10');
  }
  for (const [x, y, r] of [[360, 1180, 10], [720, 1200, 14], [760, 1170, 7], [890, 1220, 11], [410, 1150, 6]]) b += `<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.6}" fill="#5c080d"/>`;
  s += b;
  return s;
}

// 귀신: 등을 보이고 앉아 두 손을 어깨 위로 치켜듦. 아래로 갈수록 몸이 흐려져 어둠에 녹는다
function ghost() {
  let g = '';
  const cx = 640;
  // 의자
  g += P(`M${cx - 150} 1000 L${cx + 150} 1000 L${cx + 160} 1040 L${cx - 160} 1040 Z`, '#1c1411', INK, 4);
  g += P(`M${cx - 140} 1040 L${cx - 132} 1150 M${cx + 140} 1040 L${cx + 132} 1150`, 'none', '#140e0c', 12);
  let b = '';
  // 등·어깨(검은 양복, 한쪽으로 기운 구부정한 자세)
  b += P(`M${cx - 128} 1000 C${cx - 150} 900 ${cx - 160} 810 ${cx - 140} 752 C${cx - 112} 700 ${cx - 58} 684 ${cx - 4} 686 C${cx + 64} 688 ${cx + 118} 708 ${cx + 146} 760 C${cx + 168} 820 ${cx + 156} 916 ${cx + 134} 1000 Z`, '#0c0f17', INK, 5);
  b += P(`M${cx - 100} 760 C${cx - 70} 790 ${cx - 40} 800 ${cx - 6} 800 M${cx + 100} 770 C${cx + 70} 800 ${cx + 40} 806 ${cx + 6} 804`, 'none', '#1a2030', 4); // 등 주름
  b += P(`M${cx - 2} 700 C${cx + 2} 800 ${cx - 2} 900 ${cx + 2} 1000`, 'none', '#05060a', 4);
  b += P(`M${cx - 140} 770 C${cx - 156} 830 ${cx - 156} 910 ${cx - 132} 990`, 'none', '#9cbbe6', 3, 'opacity="0.6"');
  b += P(`M${cx + 146} 776 C${cx + 160} 840 ${cx + 154} 920 ${cx + 136} 990`, 'none', '#9cbbe6', 2, 'opacity="0.35"');
  // 치켜든 팔: 소매 → 흰 셔츠 소맷부리 → 앙상한 손목·손(손가락이 갈고리처럼 아래로)
  for (const sd of [-1, 1]) {
    const sx = cx + sd * 128, sy = 752, ex = cx + sd * 238, ey = 640, wx = cx + sd * 214, wy = 548;
    b += P(`M${sx} ${sy} C${sx + sd * 66} ${sy - 30} ${ex + sd * 6} ${ey + 46} ${ex} ${ey} C${ex - sd * 6} ${ey - 40} ${wx + sd * 16} ${wy + 34} ${wx} ${wy + 14}`, 'none', '#0c0f17', 46);
    b += P(`M${sx} ${sy} C${sx + sd * 66} ${sy - 30} ${ex + sd * 6} ${ey + 46} ${ex} ${ey}`, 'none', '#9cbbe6', 2.5, 'opacity="0.45"');
    b += P(`M${wx - 22} ${wy + 18} L${wx + 22} ${wy + 10} L${wx + 20} ${wy - 4} L${wx - 22} ${wy + 4} Z`, '#c9d2dc', INK, 3); // 소맷부리
    b += P(`M${wx - 10} ${wy} C${wx - 12} ${wy - 20} ${wx - 8} ${wy - 34} ${wx} ${wy - 40} C${wx + 10} ${wy - 34} ${wx + 12} ${wy - 18} ${wx + 10} ${wy}`, '#b7c3cf', INK, 3); // 손목
    const hx = wx, hy = wy - 54;
    b += P(`M${hx - 26} ${hy + 10} C${hx - 28} ${hy - 8} ${hx - 14} ${hy - 18} ${hx} ${hy - 18} C${hx + 16} ${hy - 18} ${hx + 28} ${hy - 8} ${hx + 26} ${hy + 10} C${hx + 18} ${hy + 22} ${hx - 18} ${hy + 22} ${hx - 26} ${hy + 10} Z`, '#c3ced9', INK, 3); // 손등
    for (let k = 0; k < 4; k++) {
      const fx = hx - 21 + k * 14, len = [46, 58, 56, 44][k];
      b += P(`M${fx} ${hy - 6} C${fx - 4} ${hy - 30} ${fx + sd * 2} ${hy - len} ${fx + sd * 10} ${hy - len - 4} C${fx + sd * 16} ${hy - len - 2} ${fx + sd * 16} ${hy - len + 10} ${fx + sd * 14} ${hy - len + 18}`, 'none', INK, 11);
      b += P(`M${fx} ${hy - 6} C${fx - 4} ${hy - 30} ${fx + sd * 2} ${hy - len} ${fx + sd * 10} ${hy - len - 4} C${fx + sd * 16} ${hy - len - 2} ${fx + sd * 16} ${hy - len + 10} ${fx + sd * 14} ${hy - len + 18}`, 'none', '#c3ced9', 7);
      b += P(`M${fx + sd * 12} ${hy - len - 2} L${fx + sd * 14} ${hy - len + 18}`, 'none', '#8d0d14', 8); // 피 묻은 손끝
    }
    b += P(`M${hx + sd * 6} ${hy + 18} C${hx + sd * 4} ${hy + 70} ${hx + sd * 8} ${hy + 130} ${hx + sd * 4} ${hy + 180}`, 'none', '#7a0c12', 5, 'opacity="0.9"'); // 손목 따라 흘러내리는 피
    b += `<circle cx="${hx + sd * 4}" cy="${hy + 196}" r="6" fill="#7a0c12"/>`;
  }
  // 목덜미·귀·머리(헝클어진 짧은 검은 머리, 앞으로 숙임)
  b += P(`M${cx - 36} 700 L${cx - 32} 640 L${cx + 34} 640 L${cx + 38} 700 Z`, '#b3bfcb', INK, 4);
  b += P(`M${cx - 30} 660 C${cx - 10} 668 ${cx + 12} 668 ${cx + 32} 660`, 'none', '#8996a4', 3);
  for (const sd of [-1, 1]) b += P(`M${cx + sd * 78} 590 C${cx + sd * 100} 584 ${cx + sd * 104} 620 ${cx + sd * 84} 634 Z`, '#aab6c3', INK, 3);
  b += P(`M${cx - 84} 620 C${cx - 96} 560 ${cx - 70} 506 ${cx - 6} 500 C${cx + 64} 502 ${cx + 96} 556 ${cx + 86} 622 C${cx + 70} 652 ${cx + 40} 662 ${cx} 662 C${cx - 44} 662 ${cx - 72} 650 ${cx - 84} 620 Z`, '#090a0e', INK, 4);
  for (let i = 0; i < 12; i++) {
    const x = cx - 78 + i * 14, y = 520 + Math.abs(i - 5.5) * 6;
    b += P(`M${x} ${y} C${x + 6} ${y + 40} ${x - 4} ${y + 80} ${x + 4 + (i % 2) * 6} ${650 + (i % 3) * 8}`, 'none', i % 3 ? '#151820' : '#232837', 3);
  }
  b += P(`M${cx - 70} 540 C${cx - 50} 512 ${cx - 20} 504 ${cx + 10} 504`, 'none', '#9cbbe6', 3, 'opacity="0.55"');
  for (const [x, y, dx, dy] of [[cx + 40, 506, 14, -16], [cx - 10, 500, -6, -20], [cx + 70, 530, 20, -8]]) b += P(`M${x} ${y} l${dx} ${dy}`, 'none', '#0c0e14', 3); // 삐친 머리카락
  g += `<g mask="url(#${ID}gFade)">${b}</g>`;
  return `<g filter="url(#${ID}b30)" opacity="0.45">${P(`M${cx - 210} 1000 C${cx - 250} 800 ${cx - 230} 520 ${cx} 440 C${cx + 230} 520 ${cx + 250} 800 ${cx + 210} 1000 Z`, '#6f93c9')}</g><g opacity="0.95">${g}</g>`;
}

export function draw() {
  const hm = K.hfPortrait('heemin_scared');
  const pz = K.portraitIn(`${ID}h`, hm, -70, 1010, 1.06, { tint: '#060c1a', dark: 0.62, rim: '#d9e6ff', rimDx: 7, fade: 0.72 });
  const defs = pz.defs +
    `<radialGradient id="${ID}tube" cx="560" cy="-120" r="1100" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8f2ff" stop-opacity="0.34"/><stop offset="0.5" stop-color="#9fb8d8" stop-opacity="0.1"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<linearGradient id="${ID}gFadeG" gradientUnits="userSpaceOnUse" x1="0" y1="860" x2="0" y2="1010"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/></linearGradient>` +
    `<mask id="${ID}gFade" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}gFadeG)"/></mask>` +
    `<radialGradient id="${ID}vig" cx="600" cy="760" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></radialGradient>` +
    `<linearGradient id="${ID}low" x1="0" y1="0" x2="0" y2="1"><stop offset="0.7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></linearGradient>`;
  let s = room() + piano() + ghost();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += pz.body;
  s += `<rect width="1024" height="1536" fill="url(#${ID}low)"/>`;
  return K.svg(s, { defs });
}
