// cg_fire — 강당 무대 위. 은미가 두 팔을 벌리고 고개를 젖힌 채 웃고, 무대 앞 바닥에서 불길과 가스가 솟는다.
// 카메라는 맨 앞 객석 눈높이에서 무대를 조금 올려다본다. 양옆 걷힌 막이 아래부터 타오르고, 위 막(보더)에 불티가 번진다.
// 무대 바닥을 기어오르는 누런 초록 가스 안개, 천장 쪽으로 검은 연기. 빛은 오직 아래 불길에서(주황 역광·밑에서 올려 비춤).
// 은미 머리·뒷머리·색은 cg_eunmi 의 eunmiHead / eunmiBackHair / EM 을 그대로 쓴다.
import * as K from '../kit.js';
import { EM, eunmiHead, eunmiBackHair, headDefs } from './cg_eunmi.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#050304';
const ID = 'fi';

// ---------------------------------------------------------------- 화면 배치(망원으로 당겨 본 무대: 뒷막 · 무대 바닥 · 앞선 · 양옆 막)
const FLOOR_BACK = 1050, FLOOR_FRONT = 1236; // 무대 바닥 뒤끝(뒷막 아래) · 앞선(객석 쪽 모서리)
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------------------------------------------------------------- 불꽃 한 줄기(아래 가운데 x,y · 높이 h · 폭 w): 바깥 검붉음 → 주황 → 노란 속
function flame(x, y, h, w, lean = 0) {
  const tip = [x + lean * h, y - h];
  const shape = (k, dy = 0) => {
    const W = w * k, H = h * k;
    const t = [x + lean * H, y - H + dy];
    const wob = (rnd() - 0.5) * W * 0.6;
    return `M${f1(x - W)} ${f1(y)} C${f1(x - W * 1.1)} ${f1(y - H * 0.35)} ${f1(x - W * 0.3 + wob)} ${f1(y - H * 0.6)} ${pt(t)} C${f1(x + W * 0.5 + wob)} ${f1(y - H * 0.55)} ${f1(x + W * 1.15)} ${f1(y - H * 0.3)} ${f1(x + W)} ${f1(y)} Z`;
  };
  void tip;
  return P(shape(1), '#a8260f', 'none', 0, 'opacity="0.92"') + P(shape(0.72), '#f2661c') + P(shape(0.45), '#ffc04a') + P(shape(0.22), '#fff1b8');
}
function flameRow(x0, x1, y, hMin, hMax, n, lean = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + rnd() * 0.8) / n;
    s += flame(x, y + rnd() * 10, hMin + rnd() * (hMax - hMin), 16 + rnd() * 22, lean + (rnd() - 0.5) * 0.25);
  }
  return s;
}

// ---------------------------------------------------------------- 무대
function stage() {
  let s = `<rect width="1024" height="1536" fill="#070405"/>`;
  // 뒷막(붉은 막, 아래가 불빛에 물듦) + 주름
  s += `<rect width="1024" height="${FLOOR_BACK}" fill="url(#${ID}back)"/>`;
  let fold = '', hi = '';
  for (let x = 10; x < 1024; x += 46) {
    const w = (rnd() - 0.5) * 8;
    fold += `M${f1(x)} 0 C${f1(x + w)} 400 ${f1(x - w)} 700 ${f1(x + w * 0.5)} ${FLOOR_BACK} `;
    hi += `M${f1(x + 20)} 0 C${f1(x + 20 + w)} 400 ${f1(x + 20 - w)} 700 ${f1(x + 20 + w * 0.5)} ${FLOOR_BACK} `;
  }
  s += P(fold, 'none', '#1a0407', 14, 'opacity="0.75"');
  s += P(hi, 'none', '#c2482a', 3, 'opacity="0.14"');
  // 무대 바닥(마루, 불빛 반사)
  s += P(`M0 ${FLOOR_BACK} L1024 ${FLOOR_BACK} L1024 ${FLOOR_FRONT} L0 ${FLOOR_FRONT} Z`, `url(#${ID}floor)`);
  let g = '';
  for (let x = -400; x <= 1424; x += 64) g += `M${f1(512 + (x - 512) * 0.82)} ${FLOOR_BACK} L${f1(x)} ${FLOOR_FRONT} `;
  s += P(g, 'none', '#1a0c0a', 1.6, 'opacity="0.7"');
  // 무대 앞면(객석 쪽 벽)
  s += `<rect y="${FLOOR_FRONT}" width="1024" height="${1536 - FLOOR_FRONT}" fill="url(#${ID}apron)"/>`;
  s += P(`M0 ${FLOOR_FRONT} L1024 ${FLOOR_FRONT}`, 'none', '#ffab62', 3, 'opacity="0.7"');
  return s;
}

// 양옆 걷힌 막(화면 가장자리, 앞쪽) — 아래에서부터 타오름 + 위 막(보더)
function curtains() {
  let s = '';
  for (const sd of [-1, 1]) {
    const X = v => f1(sd < 0 ? v : 1024 - v);
    s += P(`M${X(-20)} 0 L${X(170)} 0 C${X(150)} 300 ${X(110)} 700 ${X(130)} ${FLOOR_FRONT + 20} L${X(-20)} ${FLOOR_FRONT + 20} Z`, `url(#${ID}curt)`, INK, 3);
    let fold = '';
    for (const v of [20, 56, 92, 124]) fold += `M${X(v + 18)} 0 C${X(v + 10)} 300 ${X(v * 0.8)} 700 ${X(v * 0.9)} ${FLOOR_FRONT + 20} `;
    s += P(fold, 'none', '#1d0407', 9, 'opacity="0.85"');
    s += `<rect x="${sd < 0 ? -20 : 874}" y="${FLOOR_FRONT - 520}" width="170" height="540" fill="url(#${ID}char)"/>`;
    // 막을 타고 오르는 불길
    const x0 = sd < 0 ? -10 : 884, x1 = sd < 0 ? 140 : 1034;
    s += `<g filter="url(#${ID}glow)">` + flameRow(x0, x1, FLOOR_FRONT - 80, 300, 560, 4, sd * -0.04) + '</g>';
    s += flameRow(x0, x1, FLOOR_FRONT - 60, 260, 500, 5, sd * -0.04);
  }
  // 위 막(보더) — 불티가 옮겨붙은 아랫단
  s += `<rect width="1024" height="110" fill="#2a080d"/>`;
  let sc = '';
  for (let x = -20; x < 1044; x += 64) sc += `M${f1(x)} 110 Q${f1(x + 32)} 128 ${f1(x + 64)} 110 `;
  s += P(`M-20 0 L1044 0 L1044 110 ${sc.replace(/M/g, 'L')} Z`, '#2a080d');
  s += P(sc, 'none', '#ff7a32', 2.5, 'opacity="0.55"');
  let vf = '';
  for (let x = 0; x < 1024; x += 32) vf += `M${x} 0 L${x} 112 `;
  s += P(vf, 'none', '#140306', 5, 'opacity="0.7"');
  return s;
}

// ---------------------------------------------------------------- 은미(지역 좌표: 얼굴 가운데 0,0, 발 +900) — 두 팔을 벌려 손바닥을 위로, 고개를 젖히고 웃음
function eunmi() {
  const C = EM.card, B = EM.blouse, K2 = EM.skirt, S = EM.skin, H = EM.hair;
  let s = '';
  s += eunmiBackHair();
  // 치마(아래 불기운에 자락이 들려 펄럭)
  s += P('M-66 330 C-86 480 -112 680 -150 852 C-120 880 -60 866 -20 878 C20 866 90 884 150 852 C116 680 88 480 66 330 Z', K2.base, K2.line, 3.5);
  s += P('M40 340 C62 480 90 680 120 860 L150 852 C116 680 88 480 66 330 Z', K2.shade, 'none', 0, 'opacity="0.9"');
  s += P('M-30 380 C-44 520 -60 690 -82 868 M4 370 C6 520 6 690 0 874 M34 380 C48 520 64 690 84 870', 'none', K2.line, 2.5, 'opacity="0.9"');
  // 블라우스
  s += P('M-34 96 L34 96 C40 200 46 280 48 340 L-48 340 C-46 280 -40 200 -34 96 Z', B.base, B.line, 3);
  s += P('M-24 98 C-14 114 14 114 24 98', 'none', '#4d4b55', 3);
  for (const y of [170, 220, 270]) s += `<circle cx="0" cy="${y}" r="4" fill="#4d4b55"/>`;
  // 카디건 몸판(앞이 열려 불길의 더운 바람에 뒤로 날림)
  for (const sd of [-1, 1]) {
    const X = v => f1(sd * v);
    s += P(`M${X(22)} 92 C${X(48)} 98 ${X(76)} 104 ${X(92)} 114 C${X(104)} 180 ${X(100)} 260 ${X(96)} 330 C${X(108)} 380 ${X(122)} 430 ${X(136)} 466 L${X(40)} 482 C${X(40)} 420 ${X(40)} 340 ${X(36)} 260 C${X(32)} 200 ${X(28)} 150 ${X(22)} 92 Z`, sd < 0 ? C.base : C.shade, C.line, 3.5);
    s += P(`M${X(40)} 474 L${X(134)} 458 L${X(140)} 472 L${X(40)} 490 Z`, C.rib, C.line, 2);
    s += P(`M${X(30)} 130 C${X(38)} 240 ${X(40)} 360 ${X(40)} 482`, 'none', C.rib, 4, 'opacity="0.9"');
    for (const y of [190, 260, 330]) s += `<circle cx="${X(46)}" cy="${y}" r="4.5" fill="#251c2b" stroke="${C.line}" stroke-width="1.5"/>`;
    s += P(`M${X(70)} 170 C${X(76)} 260 ${X(80)} 360 ${X(100)} 450`, 'none', sd < 0 ? C.light : C.base, 2.5, 'opacity="0.5"');
  }
  // 팔: 어깨 → 바깥 아래로 벌렸다가 → 손바닥을 위로 펼침(불을 끌어안듯)
  for (const sd of [-1, 1]) {
    const X = v => sd * v, col = sd < 0 ? C.base : C.shade;
    const upper = `M${X(64)} 106 C${X(100)} 112 ${X(140)} 150 ${X(176)} 200 L${X(150)} 226 C${X(120)} 186 ${X(90)} 160 ${X(70)} 150 Z`;
    const fore = `M${X(176)} 200 C${X(210)} 210 ${X(250)} 204 ${X(290)} 186 L${X(296)} 214 C${X(254)} 236 ${X(204)} 244 ${X(150)} 226 Z`;
    s += P(upper, col, C.line, 3.5) + P(fore, col, C.line, 3.5);
    s += P(`M${X(290)} 182 L${X(306)} 180 L${X(312)} 212 L${X(296)} 216 Z`, C.rib, C.line, 2.5); // 소맷부리
    // 손(손바닥이 위를 향해 펼쳐짐, 손가락이 갈고리처럼 휨)
    let h = P('M0 -14 C14 -18 30 -16 40 -8 C48 -2 50 8 44 12 C30 16 12 16 0 14 Z', S.base, S.line, 2.5);
    for (const [x, y, a] of [[40, -10, -30], [46, -2, -12], [46, 6, 6], [40, 12, 22]]) h += P(`M${x} ${y} c8 -4 16 -2 22 ${f1(a * 0.3)}`, 'none', S.line, 7) + P(`M${x} ${y} c8 -4 16 -2 22 ${f1(a * 0.3)}`, 'none', S.base, 4.2);
    h += P('M6 -14 C2 -26 8 -34 16 -36', 'none', S.line, 7) + P('M6 -14 C2 -26 8 -34 16 -36', 'none', S.base, 4.2); // 엄지
    s += `<g transform="translate(${X(310)} 196) scale(${sd} 1) rotate(-14)">${h}</g>`;
  }
  // 머리: 뒤로 젖혀 크게 웃음(입을 한껏 벌림), 얼굴 아래쪽이 불빛을 받음
  s += `<g transform="rotate(-6 0 60) translate(0 -2)">${eunmiHead(ID, 'scream')}` +
    // 웃음 주름: 눈 밑이 밀려 올라가고 볼이 솟음
    P('M-34 6 C-26 14 -14 16 -6 12 M34 6 C26 14 14 16 6 12', 'none', EM.skin.line, 1.8, 'opacity="0.8"') +
    P('M-30 20 C-24 26 -20 34 -20 42 M30 20 C24 26 20 34 20 42', 'none', EM.skin.line, 1.6, 'opacity="0.6"') + '</g>';
  return s;
}
const EX = 512, EY = 330, EK = 0.95;

// ---------------------------------------------------------------- 가스·연기·불티
function gas() {
  let s = `<g filter="url(#${ID}b30)">`;
  for (let i = 0; i < 16; i++) {
    const x = rnd() * 1024, y = 1020 + rnd() * 240, r = 80 + rnd() * 120;
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.6)}" ry="${f1(r * 0.5)}" fill="${i % 3 ? '#8fa24a' : '#b7b85a'}" opacity="${f1(0.08 + rnd() * 0.1)}"/>`;
  }
  s += '</g>';
  return s;
}
function smoke() {
  let s = `<g filter="url(#${ID}b30)">`;
  for (let i = 0; i < 14; i++) {
    const x = rnd() * 1024, y = 40 + rnd() * 340, r = 120 + rnd() * 160;
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r)}" ry="${f1(r * 0.55)}" fill="#120a0a" opacity="${f1(0.5 + rnd() * 0.3)}"/>`;
  }
  return s + '</g>';
}
// 맨 앞 객석 의자 등받이(카메라 바로 앞, 검은 실루엣 + 불빛 윗테)
function seatsFront() {
  let s = '';
  for (let i = -1; i < 6; i++) {
    const x = i * 190 + 40, y = 1390 + (i % 2) * 6;
    const d = `M${x} 1536 L${x} ${y + 30} C${x} ${y} ${x + 20} ${y - 12} ${x + 85} ${y - 12} C${x + 150} ${y - 12} ${x + 170} ${y} ${x + 170} ${y + 30} L${x + 170} 1536 Z`;
    s += P(d, '#0b0506', INK, 3) + P(`M${x + 4} ${y + 22} C${x + 10} ${y} ${x + 40} ${y - 8} ${x + 85} ${y - 8} C${x + 130} ${y - 8} ${x + 160} ${y} ${x + 166} ${y + 22}`, 'none', '#ff9a52', 3, 'opacity="0.55"');
  }
  return s;
}
// 바닥을 기는 누런 초록 가스(말려 오르는 띠)
function gasWisps() {
  let s = `<g filter="url(#${ID}b4)" style="mix-blend-mode:screen">`;
  for (let i = 0; i < 9; i++) {
    const x = rnd() * 1024, y = FLOOR_BACK + 40 + rnd() * 170, w = 120 + rnd() * 200;
    s += P(`M${f1(x - w)} ${f1(y)} C${f1(x - w * 0.5)} ${f1(y - 40)} ${f1(x - w * 0.2)} ${f1(y + 20)} ${f1(x)} ${f1(y - 30)} C${f1(x + w * 0.3)} ${f1(y - 70)} ${f1(x + w * 0.6)} ${f1(y - 10)} ${f1(x + w)} ${f1(y - 50)}`, 'none', '#a7c25a', 10 + rnd() * 14, `opacity="${f1(0.14 + rnd() * 0.12)}"`);
  }
  return s + '</g>';
}
function embers() {
  let s = '';
  for (let i = 0; i < 90; i++) {
    const x = rnd() * 1024, y = 120 + rnd() * 1100, r = 1 + rnd() * 2.6, l = 6 + rnd() * 16, a = (rnd() - 0.5) * 0.8;
    s += P(`M${f1(x)} ${f1(y)} l${f1(a * l)} ${f1(-l)}`, 'none', rnd() < 0.5 ? '#ffcf6a' : '#ff8a3a', r, `opacity="${f1(0.4 + rnd() * 0.6)}"`);
  }
  return s;
}

export function draw() {
  const fig = `<g transform="translate(${EX} ${EY}) scale(${EK})">${eunmi()}</g>`;
  const defs = headDefs(ID) +
    `<filter id="${ID}b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="${ID}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>` +
    `<linearGradient id="${ID}back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080203"/><stop offset="0.45" stop-color="#1e0609"/><stop offset="0.75" stop-color="#4a120f"/><stop offset="1" stop-color="#9a3414"/></linearGradient>` +
    `<linearGradient id="${ID}curt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c0508"/><stop offset="0.6" stop-color="#5a1218"/><stop offset="1" stop-color="#a8381c"/></linearGradient>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a18"/><stop offset="1" stop-color="#2a1210"/></linearGradient>` +
    `<linearGradient id="${ID}apron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0e0a"/><stop offset="0.4" stop-color="#0c0405"/><stop offset="1" stop-color="#030102"/></linearGradient>` +
    `<g id="${ID}fig">${fig}</g>` +
    `<mask id="${ID}figA" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536" style="mask-type:alpha"><use href="#${ID}fig"/></mask>` +
    // 불빛: 아래가 주황으로 달아오르고 위는 어둠 속
    `<linearGradient id="${ID}under" gradientUnits="userSpaceOnUse" x1="0" y1="${EY - 120}" x2="0" y2="${EY + 860}"><stop offset="0" stop-color="#140408" stop-opacity="0.35"/><stop offset="0.35" stop-color="#ff6a2a" stop-opacity="0.08"/><stop offset="0.75" stop-color="#ff7a2a" stop-opacity="0.32"/><stop offset="1" stop-color="#ffa040" stop-opacity="0.55"/></linearGradient>` +
    `<filter id="${ID}warm" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0.6 0.06 0 0 0.01  0.01 0.44 0 0 0  0 0 0.52 0 0.01  0 0 0 1 0"/></filter>` +
    // 아래 가장자리 불빛 테두리(빛이 아래에서 오므로 아래쪽 가장자리)
    `<filter id="${ID}rim" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
    `<feMorphology in="SourceAlpha" operator="erode" radius="2" result="er"/><feOffset in="er" dx="0" dy="-6" result="o"/>` +
    `<feComposite in="er" in2="o" operator="out" result="r"/><feGaussianBlur in="r" stdDeviation="1.6" result="rb"/>` +
    `<feFlood flood-color="#ffc07a" flood-opacity="1"/><feComposite in2="rb" operator="in"/></filter>` +
    `<linearGradient id="${ID}char" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0304" stop-opacity="0"/><stop offset="0.5" stop-color="#0a0304" stop-opacity="0.7"/><stop offset="1" stop-color="#0a0304" stop-opacity="0.9"/></linearGradient>` +
    `<radialGradient id="${ID}faceL" cx="${EX}" cy="${EY + 60}" r="110" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb070" stop-opacity="0.42"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}fireL" cx="512" cy="1260" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff8a32" stop-opacity="0.55"/><stop offset="0.5" stop-color="#c2421a" stop-opacity="0.18"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="760" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>`;
  let s = stage();
  s += smoke();
  // 뒷불(은미 뒤 무대 바닥에서 번지는 불)
  s += `<g filter="url(#${ID}glow)" opacity="0.85">` + flameRow(140, 900, FLOOR_BACK + 30, 70, 200, 12) + '</g>';
  s += flameRow(170, 870, FLOOR_BACK + 32, 50, 160, 11);
  s += `<ellipse cx="512" cy="${FLOOR_BACK}" rx="480" ry="140" fill="#ff7a2a" opacity="0.28" filter="url(#${ID}b30)" style="mix-blend-mode:screen"/>`;
  // 은미(어둡게 + 아래에서 주황 불빛 + 아래쪽 가장자리 불빛 테두리)
  s += `<ellipse cx="512" cy="820" rx="250" ry="430" fill="#000" opacity="0.4" filter="url(#${ID}b30)"/>`;
  s += `<g filter="url(#${ID}warm)"><use href="#${ID}fig"/></g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}under)" mask="url(#${ID}figA)"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}faceL)" mask="url(#${ID}figA)" style="mix-blend-mode:screen"/>`;
  s += `<use href="#${ID}fig" filter="url(#${ID}rim)"/>`;
  s += curtains();
  s += gas() + gasWisps();
  // 앞불(무대 앞선을 따라 솟는 불길 — 발치를 가림)
  s += `<g filter="url(#${ID}glow)">` + flameRow(-40, 1064, FLOOR_FRONT + 6, 120, 280, 15) + '</g>';
  s += flameRow(-20, 1044, FLOOR_FRONT + 8, 90, 240, 17);
  s += flameRow(330, 700, FLOOR_FRONT + 10, 70, 150, 6);
  s += `<rect width="1024" height="1536" fill="url(#${ID}fireL)" style="mix-blend-mode:screen"/>`;
  s += embers();
  s += seatsFront();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
