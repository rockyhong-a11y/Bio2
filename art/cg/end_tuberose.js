// end_tuberose — 엔딩(월하향). 새벽, 성아와 희민이 함께 학교를 떠난다. 희민은 앞만 보고 걷고(조금 뒤, 오른쪽),
// 앞에 선 성아는 걸음을 멈추고 이쪽(보는 사람)을 향해 섬뜩하게 웃는다. 두 사람 뒤 교사 1층 교실 창 하나에 흐릿한 소영이
// 유리를 두드리며 무언가 외치지만 아무도 보지 못한다(유리에 짚은 두 손, 김 서린 숨). 앞쪽엔 밀랍처럼 흰 월하향 꽃대.
// 인물은 힉스필드 초상화(성아 smirk · 희민 기본 · 소영 surprised 를 흐리게)를 쓴다.
import * as K from '../kit.js';
import { hfFig, lowerGirl, lowerBoy, rng, leaf } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const ID = 'etb';

// ---------------------------------------------------------------- 월하향 꽃대(아래 x,y · 높이 h): 위로 갈수록 작은 흰 별꽃·봉오리
export function tuberose(x, y, h, { seed = 1, petal = '#f3efe6', shade = '#c9c0c8', line = '#4c4650', bud = '#d8d4c0' } = {}) {
  const rnd = rng(seed);
  let s = leaf(x, y, h * 0.5, -100 + rnd() * 20, { fill: '#1e2c24', line: '#08100c', vein: '#3c5a48', wid: 0.1 });
  s += leaf(x, y, h * 0.42, -75 - rnd() * 15, { fill: '#22322a', line: '#08100c', vein: '#3c5a48', wid: 0.1 });
  const lean = (rnd() - 0.5) * 0.2;
  s += P(`M${x} ${y} Q${f1(x + lean * h * 0.5)} ${f1(y - h * 0.5)} ${f1(x + lean * h)} ${f1(y - h)}`, 'none', '#2c4034', 4);
  for (let i = 0; i < 9; i++) {
    const t = 0.42 + i * 0.065, px = x + lean * h * t * t, py = y - h * t, sd = i % 2 ? 1 : -1;
    const fx = px + sd * 16, fy = py;
    if (i > 6) { s += `<ellipse cx="${f1(fx)}" cy="${f1(fy)}" rx="5" ry="10" fill="${bud}" stroke="${line}" stroke-width="1.2" transform="rotate(${sd * 25} ${f1(fx)} ${f1(fy)})"/>`; continue; }
    const r = 30 - i * 2.4;
    let st = '';
    for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + i, ex = fx + Math.cos(a) * r, ey = fy + Math.sin(a) * r * 0.8;
      const nx = -Math.sin(a) * r * 0.32, ny = Math.cos(a) * r * 0.32 * 0.8;
      st += P(`M${f1(fx)} ${f1(fy)} Q${f1((fx + ex) / 2 + nx)} ${f1((fy + ey) / 2 + ny)} ${f1(ex)} ${f1(ey)} Q${f1((fx + ex) / 2 - nx)} ${f1((fy + ey) / 2 - ny)} ${f1(fx)} ${f1(fy)} Z`, Math.sin(a) < -0.3 ? shade : petal, line, 1.1);
    }
    s += P(`M${f1(px)} ${f1(py)} L${f1(fx)} ${f1(fy + 4)}`, 'none', '#2c4034', 2.5) + st + `<circle cx="${f1(fx)}" cy="${f1(fy)}" r="2.6" fill="#e8dca0"/>`;
  }
  return s;
}

// ---------------------------------------------------------------- 배경: 가까운 교사 벽(1층 큰 교실 창이 줄지어) + 왼쪽 위로 새벽 하늘
const WALL_TOP = 120, WALL_BOT = 900;
const WINS = [[-60, 300], [420, 650], [790, 1020]]; // 창 x 범위(가운데 창에 소영)
const WY0 = 330, WY1 = 760;
function scene() {
  let s = `<rect width="1024" height="1536" fill="url(#${ID}sky)"/>`;
  // 교사 벽(콘크리트, 위쪽 2층 창 띠 일부) — 비스듬히 새벽빛
  s += `<rect x="0" y="${WALL_TOP}" width="1024" height="${WALL_BOT - WALL_TOP}" fill="url(#${ID}wall)"/>`;
  s += P(`M0 ${WALL_TOP} L1024 ${WALL_TOP}`, 'none', '#d9c0b8', 4, 'opacity="0.5"');
  s += `<rect x="0" y="${WALL_TOP - 40}" width="1024" height="40" fill="#3a3646"/>`; // 2층 슬래브
  for (const [x0, x1] of [[60, 280], [400, 640], [760, 980]]) s += `<rect x="${x0}" y="${WALL_TOP - 260}" width="${x1 - x0}" height="200" fill="#a8a2b8" stroke="#1a1824" stroke-width="5"/>`;
  // 1층 창(알루미늄 틀, 유리에 새벽 하늘 반사)
  for (const [x0, x1] of WINS) {
    s += `<rect x="${x0 - 14}" y="${WY0 - 14}" width="${x1 - x0 + 28}" height="${WY1 - WY0 + 28}" fill="#5c5868" stroke="#14121a" stroke-width="3"/>`;
    s += `<rect x="${x0}" y="${WY0}" width="${x1 - x0}" height="${WY1 - WY0}" fill="url(#${ID}glass)" stroke="#14121a" stroke-width="3"/>`;
  }
  // 창 아래 화단 턱 + 땅
  s += `<rect x="0" y="${WALL_BOT - 60}" width="1024" height="60" fill="#3e3a46"/>`;
  s += `<rect x="0" y="${WALL_BOT}" width="1024" height="${1536 - WALL_BOT}" fill="url(#${ID}ground)"/>`;
  return s;
}
// 창 반사(소영 앞에 덮임: 하늘빛 사선 반사) + 창살
function glassOver() {
  let s = '';
  for (const [x0, x1] of WINS) {
    s += `<clipPath id="${ID}c${x0}"><rect x="${x0}" y="${WY0}" width="${x1 - x0}" height="${WY1 - WY0}"/></clipPath>`;
    s += `<g clip-path="url(#${ID}c${x0})">` + P(`M${x0 - 100} ${WY1} L${x0 + 140} ${WY0} L${x0 + 220} ${WY0} L${x0 - 20} ${WY1} Z M${x0 + 120} ${WY1} L${x0 + 360} ${WY0} L${x0 + 390} ${WY0} L${x0 + 150} ${WY1} Z`, '#f4e2dc', 'none', 0, 'opacity="0.13"') + '</g>';
    const mx = x0 === WINS[1][0] ? x1 - 30 : (x0 + x1) / 2;
    s += P(`M${mx} ${WY0} L${mx} ${WY1} M${x0} ${WY0 + (WY1 - WY0) * 0.3} L${x1} ${WY0 + (WY1 - WY0) * 0.3}`, 'none', '#4a4656', 9) + P(`M${mx} ${WY0} L${mx} ${WY1}`, 'none', '#14121a', 2);
  }
  return s;
}
// 유리에 짚은 손바닥(손가락을 벌림) — 유리에 눌려 하얗게
function palm(x, y, s, rot) {
  const d = 'M-22 30 C-26 10 -26 -8 -20 -20 L-30 -56 C-32 -64 -22 -66 -20 -58 L-10 -26 L-12 -70 C-12 -78 -2 -78 -2 -70 L0 -28 L8 -72 C10 -80 20 -78 18 -70 L12 -26 L24 -60 C26 -68 36 -64 34 -56 L22 -16 C30 -12 40 -16 46 -24 C52 -30 60 -24 54 -16 C44 0 34 14 22 30 C10 40 -12 40 -22 30 Z';
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` + P(d, '#cfc6d6', '#5a5068', 2.5, 'opacity="0.6"') + '</g>';
}

export function draw() {
  const W = WINS[1];
  // 소영(창 안, 흐릿) — 놀라 외치는 얼굴
  const so = hfFig(`${ID}s`, 'soyoung_surprised', {
    cx: (W[0] + W[1]) / 2, top: WY0 + 30, s: 0.66, grade: '0.62 0.04 0.06 0 0.04  0.04 0.62 0.06 0 0.04  0.06 0.06 0.74 0 0.06  0 0 0 1 0',
    rimOp: 0, fade: [0.7, 0.98], opacity: 0.62, over: [{ fill: '#8a90b4', op: 0.25 }],
  });
  const seGrade = '0.68 0.02 0 0 0  0 0.7 0.03 0 0.004  0 0.03 0.82 0 0.03  0 0 0 1 0';
  const se = hfFig(`${ID}a`, 'seonga_smirk', {
    cx: 330, top: 520, s: 1.36, rot: 2, grade: seGrade, rim: '#ffd8bc', rimDx: -4, rimDy: 4, rimOp: 0.9, fade: [0.82, 0.99], rimTo: 0.5,
    over: [{ fill: `url(#${ID}eyeShade)` }, { fill: `url(#${ID}aShade)` }],
    under: lowerGirl(448, 792, { coat: '#121628', skirt: '#141830' }),
  });
  const hm = hfFig(`${ID}h`, 'heemin', {
    cx: 790, top: 560, s: 1.0, rot: -1, grade: seGrade, rim: '#ffd8bc', rimDx: -4, rimDy: 4, rimOp: 0.9, fade: [0.8, 0.99], rimTo: 0.5,
    over: [{ fill: `url(#${ID}hShade)` }],
    under: lowerBoy(452, 654, { coat: '#121628', pants: '#0b0c12' }),
  });
  const defs = so.defs + se.defs + hm.defs +
    `<filter id="${ID}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="${ID}dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.4"/></filter>` +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c7898"/><stop offset="0.3" stop-color="#d6aaa4"/><stop offset="1" stop-color="#f2c8a8"/></linearGradient>` +
    `<linearGradient id="${ID}wall" x1="0" y1="0" x2="1" y2="0.3"><stop offset="0" stop-color="#8e8496"/><stop offset="1" stop-color="#5c5668"/></linearGradient>` +
    `<linearGradient id="${ID}glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262634"/><stop offset="1" stop-color="#121220"/></linearGradient>` +
    `<linearGradient id="${ID}ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7e6e72"/><stop offset="0.3" stop-color="#4a3e48"/><stop offset="1" stop-color="#16121a"/></linearGradient>` +
    // 성아: 눈가에 드리운 그늘(위에서 아래로 스미는 어둠) — 웃음이 섬뜩해 보이게
    `<linearGradient id="${ID}eyeShade" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="300"><stop offset="0" stop-color="#140a1a" stop-opacity="0.55"/><stop offset="0.75" stop-color="#140a1a" stop-opacity="0.2"/><stop offset="1" stop-color="#140a1a" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${ID}aShade" gradientUnits="userSpaceOnUse" x1="448" y1="0" x2="0" y2="792"><stop offset="0" stop-color="#20182c" stop-opacity="0"/><stop offset="1" stop-color="#20182c" stop-opacity="0.4"/></linearGradient>` +
    `<linearGradient id="${ID}hShade" gradientUnits="userSpaceOnUse" x1="452" y1="0" x2="0" y2="654"><stop offset="0" stop-color="#20182c" stop-opacity="0.1"/><stop offset="1" stop-color="#20182c" stop-opacity="0.45"/></linearGradient>` +
    `<linearGradient id="${ID}dawn" x1="0" y1="0" x2="1" y2="0.6"><stop offset="0" stop-color="#ffb48a" stop-opacity="0.3"/><stop offset="0.5" stop-color="#ffb48a" stop-opacity="0.06"/><stop offset="1" stop-color="#ffb48a" stop-opacity="0"/></linearGradient>` +
    `<radialGradient id="${ID}vig" cx="460" cy="760" r="940" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#0c0612" stop-opacity="0.5"/><stop offset="1" stop-color="#0c0612" stop-opacity="0.88"/></radialGradient>`;
  // 배경 + 창 속 소영(유리 안쪽으로 잘림) + 두 손 + 김 서림
  const [x0, x1] = W;
  let bg = scene();
  bg += `<clipPath id="${ID}so"><rect x="${x0}" y="${WY0}" width="${x1 - x0}" height="${WY1 - WY0}"/></clipPath>`;
  bg += `<g clip-path="url(#${ID}so)">${so.body}` +
    `<ellipse cx="${(x0 + x1) / 2}" cy="${WY0 + 230}" rx="60" ry="34" fill="#e8e4ee" opacity="0.28" filter="url(#${ID}b6)"/>` +
    palm(x0 + 62, WY0 + 236, 0.62, -14) + palm(x1 - 66, WY0 + 222, 0.62, 12) + '</g>';
  bg += glassOver();
  let s = `<g filter="url(#${ID}dof)">${bg}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}dawn)" style="mix-blend-mode:screen"/>`;
  // 두 사람(희민은 뒤, 성아는 앞)
  s += hm.body + se.body;
  // 앞쪽 월하향
  const rnd = rng(61);
  for (const [x, h] of [[40, 520], [120, 440], [-10, 380], [930, 500], [1000, 430], [860, 360], [200, 300]]) s += tuberose(x, 1560, h, { seed: Math.floor(rnd() * 900) + 1 });
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
