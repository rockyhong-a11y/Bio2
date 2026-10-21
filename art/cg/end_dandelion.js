// end_dandelion — 엔딩(민들레). 불 꺼진 강당, 무대 앞 끝에 나란히 걸터앉은 두 사람. 지현은 붕대를 감은 발목을 늘어뜨린 채
// 희민의 어깨에 머리를 기대고, 희민은 리본 맨 사탕 상자를 그녀 쪽으로 내민다. 둘레로 민들레 홀씨처럼 연둣빛 반딧불 같은 빛들이
// 천천히 떠오른다. 따뜻하지만 뒤의 막은 굳게 내려져 있고 객석은 칠흑 — 갇힌 느낌.
// 인물은 힉스필드 초상화(지현 미소 · 희민 미소), 무대 끝에 늘어뜨린 다리는 벡터(지현 발목에 흰 붕대).
import * as K from '../kit.js';
import { hfFig, candyBox, rng } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const ID = 'edl';
const EDGE = 1186; // 무대 앞 모서리(무릎 높이)

function stage() {
  let s = `<rect width="1024" height="1536" fill="#060407"/>`;
  // 내려진 막(뒤, 어둡고 깊은 붉은빛 주름)
  s += `<rect width="1024" height="${EDGE - 120}" fill="url(#${ID}curt)"/>`;
  let f = '', hi = '';
  const rnd = rng(3);
  for (let x = 6; x < 1024; x += 52) { const w = (rnd() - 0.5) * 10; f += `M${x} 0 C${x + w} 400 ${x - w} 800 ${x} ${EDGE - 120} `; hi += `M${x + 24} 0 C${x + 24 + w} 400 ${x + 24 - w} 800 ${x + 24} ${EDGE - 120} `; }
  s += P(f, 'none', '#080204', 16, 'opacity="0.8"') + P(hi, 'none', '#5a1a24', 3, 'opacity="0.25"');
  // 막 아랫단이 바닥에 끌림
  s += P(`M0 ${EDGE - 130} Q256 ${EDGE - 110} 512 ${EDGE - 126} T1024 ${EDGE - 122} L1024 ${EDGE - 100} L0 ${EDGE - 100} Z`, '#1e0810');
  // 무대 바닥(마루, 위에서 본 얇은 띠)
  s += `<rect y="${EDGE - 104}" width="1024" height="104" fill="url(#${ID}boards)"/>`;
  let b = '';
  for (let x = -200; x < 1240; x += 70) b += `M${f1(512 + (x - 512) * 0.85)} ${EDGE - 104} L${x} ${EDGE} `;
  s += P(b, 'none', '#0e0806', 1.5, 'opacity="0.7"');
  // 무대 앞면(객석 쪽 나무 벽) + 모서리 몰딩
  s += `<rect y="${EDGE}" width="1024" height="${1536 - EDGE}" fill="url(#${ID}apron)"/>`;
  s += P(`M0 ${EDGE} L1024 ${EDGE}`, 'none', '#5a4030', 5) + P(`M0 ${EDGE + 6} L1024 ${EDGE + 6}`, 'none', '#140c08', 3);
  let pn = '';
  for (let x = 0; x < 1024; x += 170) pn += `M${x} ${EDGE + 10} L${x} 1536 `;
  s += P(pn, 'none', '#0c0806', 3, 'opacity="0.8"');
  return s;
}

// 무대 끝에 걸터앉아 늘어뜨린 다리(화면 좌표: 무릎 가운데 x, 무릎 높이 EDGE)
function legs(x, { kind = 'girl', bandage = false, swing = 0 } = {}) {
  let s = '';
  const L = '#030204';
  if (kind === 'girl') {
    // 무릎 위 치마 자락(무대 모서리 위로 살짝 넘어옴)
    s += P(`M${x - 130} ${EDGE - 90} C${x - 60} ${EDGE - 104} ${x + 60} ${EDGE - 104} ${x + 130} ${EDGE - 90} C${x + 128} ${EDGE - 30} ${x + 120} ${EDGE + 4} ${x + 104} ${EDGE + 20} C${x + 40} ${EDGE + 34} ${x - 40} ${EDGE + 34} ${x - 104} ${EDGE + 20} C${x - 120} ${EDGE + 4} ${x - 128} ${EDGE - 30} ${x - 130} ${EDGE - 90} Z`, '#11142a', L, 3);
    s += P(`M${x - 70} ${EDGE - 56} L${x - 76} ${EDGE + 28} M${x - 24} ${EDGE - 56} L${x - 26} ${EDGE + 32} M${x + 24} ${EDGE - 56} L${x + 26} ${EDGE + 32} M${x + 70} ${EDGE - 56} L${x + 76} ${EDGE + 28}`, 'none', '#0a0c18', 2.5);
    for (const [dx, sw, band] of [[-46, -6 + swing, false], [46, 8 - swing, bandage]]) {
      const kx = x + dx, ax = kx + sw, ay = EDGE + 290;
      s += P(`M${kx - 30} ${EDGE + 20} C${kx - 30} ${EDGE + 120} ${ax - 24} ${ay - 100} ${ax - 20} ${ay} L${ax + 20} ${ay} C${ax + 24} ${ay - 100} ${kx + 30} ${EDGE + 120} ${kx + 30} ${EDGE + 20} Z`, band ? '#7e6a66' : '#0c0c14', L, 2.5);
      if (band) {
        // 맨다리(스타킹 벗음) + 발목 붕대: 감긴 띠 여러 겹
        s += P(`M${kx + 18} ${EDGE + 60} C${kx + 18} ${EDGE + 140} ${ax + 12} ${ay - 80} ${ax + 14} ${ay - 40}`, 'none', '#b49890', 4, 'opacity="0.6"');
        let wr = '';
        for (let k = 0; k < 6; k++) { const yy = ay - 70 + k * 14; wr += P(`M${ax - 24} ${yy + 6} C${ax - 8} ${yy - 2} ${ax + 10} ${yy + 2} ${ax + 26} ${yy - 4} L${ax + 26} ${yy + 8} C${ax + 10} ${yy + 14} ${ax - 8} ${yy + 10} ${ax - 24} ${yy + 18} Z`, k % 2 ? '#e8e4dc' : '#f6f2ea', '#6a6460', 1.5); }
        s += wr;
      }
      // 실내화(앞코가 이쪽)
      s += P(`M${ax - 24} ${ay + (band ? 14 : 0)} C${ax - 28} ${ay + 40} ${ax - 18} ${ay + 70} ${ax} ${ay + 72} C${ax + 18} ${ay + 70} ${ax + 28} ${ay + 40} ${ax + 24} ${ay + (band ? 14 : 0)} Z`, '#d8d4cc', L, 2.5);
      s += P(`M${ax - 18} ${ay + 34} L${ax + 18} ${ay + 34}`, 'none', '#3a5a9a', 5);
    }
  } else {
    // 바지(무릎에서 꺾여 내려옴)
    for (const dx of [-60, 60]) s += P(`M${x + dx - 64} ${EDGE - 100} C${x + dx - 20} ${EDGE - 110} ${x + dx + 20} ${EDGE - 110} ${x + dx + 64} ${EDGE - 100} C${x + dx + 66} ${EDGE - 40} ${x + dx + 60} ${EDGE + 10} ${x + dx + 50} ${EDGE + 22} C${x + dx + 20} ${EDGE + 34} ${x + dx - 20} ${EDGE + 34} ${x + dx - 50} ${EDGE + 22} C${x + dx - 60} ${EDGE + 10} ${x + dx - 66} ${EDGE - 40} ${x + dx - 64} ${EDGE - 100} Z`, '#0c0e16', L, 3);
    for (const [dx, sw] of [[-60, -10 + swing], [60, 4 - swing]]) {
      const kx = x + dx, ax = kx + sw, ay = EDGE + 300;
      s += P(`M${kx - 50} ${EDGE + 10} C${kx - 46} ${EDGE + 120} ${ax - 36} ${ay - 100} ${ax - 34} ${ay} L${ax + 34} ${ay} C${ax + 36} ${ay - 100} ${kx + 46} ${EDGE + 120} ${kx + 50} ${EDGE + 10} Z`, '#0c0d14', L, 2.5);
      s += P(`M${ax - 36} ${ay - 6} C${ax - 40} ${ay + 40} ${ax - 26} ${ay + 70} ${ax} ${ay + 72} C${ax + 26} ${ay + 70} ${ax + 40} ${ay + 40} ${ax + 36} ${ay - 6} Z`, '#d0ccc4', L, 2.5);
    }
  }
  return s;
}

// 떠오르는 연둣빛 빛 알갱이(민들레 홀씨처럼 가는 꼬리)
function lights() {
  const rnd = rng(29);
  let s = '<g style="mix-blend-mode:screen">';
  for (let i = 0; i < 70; i++) {
    const x = rnd() * 1024, y = 120 + rnd() * 1300, r = 2.5 + rnd() * 5, a = 0.5 + rnd() * 0.5;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 2.4)}" fill="#a8f06a" opacity="${f1(a * 0.55)}" filter="url(#${ID}b6)"/>`;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#e8ffc8" opacity="${f1(a)}"/>`;
    if (rnd() < 0.5) s += P(`M${f1(x)} ${f1(y + r)} q${f1((rnd() - 0.5) * 10)} ${f1(14 + rnd() * 18)} ${f1((rnd() - 0.5) * 6)} ${f1(30 + rnd() * 20)}`, 'none', '#c8f09a', 1.2, `opacity="${f1(a * 0.5)}"`);
  }
  return s + '</g>';
}

export function draw() {
  const grade = '0.7 0.04 0 0 0.01  0.02 0.7 0.04 0 0.01  0 0.03 0.66 0 0.02  0 0 0 1 0';
  const jh = hfFig(`${ID}j`, 'jihyeon', {
    cx: 362, top: 386, s: 1.0, rot: 11, grade, rim: '#c8f0a0', rimDx: 4, rimDy: 3, rimOp: 0.75, fade: [0.72, 0.96], rimTo: 0.5,
    over: [{ fill: `url(#${ID}warm)`, blend: 'screen' }, { fill: `url(#${ID}jShade)` }],
  });
  const hm = hfFig(`${ID}h`, 'heemin_smile', {
    cx: 680, top: 330, s: 1.12, rot: -2, grade, rim: '#c8f0a0', rimDx: -4, rimDy: 3, rimOp: 0.75, fade: [0.74, 0.97], rimTo: 0.5,
    over: [{ fill: `url(#${ID}warmH)`, blend: 'screen' }, { fill: `url(#${ID}hShade)` }],
  });
  const defs = jh.defs + hm.defs +
    `<filter id="${ID}b6" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<linearGradient id="${ID}curt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0306"/><stop offset="1" stop-color="#2a0c14"/></linearGradient>` +
    `<linearGradient id="${ID}boards" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1410"/><stop offset="1" stop-color="#3a2a1e"/></linearGradient>` +
    `<linearGradient id="${ID}apron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c14"/><stop offset="1" stop-color="#060404"/></linearGradient>` +
    // 상자 쪽(두 사람 사이 아래)에서 올라오는 작은 따뜻한 빛
    `<radialGradient id="${ID}warm" gradientUnits="userSpaceOnUse" cx="440" cy="700" r="500"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0.22"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}warmH" gradientUnits="userSpaceOnUse" cx="60" cy="620" r="480"><stop offset="0" stop-color="#ffcf8a" stop-opacity="0.2"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${ID}jShade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="442" y2="810"><stop offset="0" stop-color="#0a0812" stop-opacity="0.35"/><stop offset="1" stop-color="#0a0812" stop-opacity="0.15"/></linearGradient>` +
    `<linearGradient id="${ID}hShade" gradientUnits="userSpaceOnUse" x1="452" y1="0" x2="0" y2="654"><stop offset="0" stop-color="#0a0812" stop-opacity="0.4"/><stop offset="1" stop-color="#0a0812" stop-opacity="0.15"/></linearGradient>` +
    `<radialGradient id="${ID}glow" cx="512" cy="1000" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9ae060" stop-opacity="0.16"/><stop offset="1" stop-color="#9ae060" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="820" r="860" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.65"/><stop offset="1" stop-color="#000" stop-opacity="0.97"/></radialGradient>`;
  let s = stage();
  s += `<rect width="1024" height="1536" fill="url(#${ID}glow)" style="mix-blend-mode:screen"/>`;
  // 앉은 몸(초상화 아랫단 → 무릎) 어둠
  s += `<ellipse cx="512" cy="${EDGE - 120}" rx="420" ry="200" fill="#07060a" opacity="0.9" filter="url(#${ID}b30)"/>`;
  s += hm.body + jh.body;
  // 무릎·다리
  s += legs(330, { kind: 'girl', bandage: true }) + legs(700, { kind: 'boy' });
  // 희민이 내민 사탕 상자(두 사람 사이 무릎 위) + 상자를 받친 손
  s += `<ellipse cx="520" cy="${EDGE - 70}" rx="160" ry="70" fill="#ffd28a" opacity="0.18" filter="url(#${ID}b30)"/>`;
  s += candyBox(540, EDGE - 98, 170, { rot: -6, box: '#9aa4c8', side: '#727ea8', top: '#b4bede', rib: '#d2384c', ribD: '#97202f', line: '#30385e' });
  s += P(`M626 ${EDGE - 50} C600 ${EDGE - 52} 560 ${EDGE - 46} 520 ${EDGE - 34} C500 ${EDGE - 26} 506 ${EDGE - 14} 524 ${EDGE - 16} C560 ${EDGE - 20} 600 ${EDGE - 22} 630 ${EDGE - 26} Z`, '#a88c80', '#3a2826', 2); // 상자를 받친 손(손바닥 위)
  s += lights();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
