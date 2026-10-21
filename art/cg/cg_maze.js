// cg_maze — 하얗게 바랜 끝없는 미로. 학교 복도 벽(창틀·교실 문·걸레받이)이 그대로인데 모든 것이 표백된 듯 희고,
// 복도는 갈래갈래 꺾이며 끝없이 이어진다(먼 쪽은 흰 안개). 가운데 공중에 성아가 떠 있다 — 드러난 진짜 모습:
// 핏기 없이 창백한 얼굴, 텅 빈 검은 눈(아래로 번진 검은 눈물 자국), 찢기고 해진 교복, 발끝이 아래로 늘어진 채 바닥에서 떠 있다.
// 그녀 뒤로 천장에서 내려온 흐린 올가미 밧줄의 그림자. 그 발치 바닥에 소영이 쓰러져 있다(긴 머리가 흰 바닥에 퍼짐).
// 성아는 힉스필드 초상화(seonga)를 창백하게 눌러 쓰고, 소영은 cg_stage 의 lyingGirl 을 쓴다.
import * as K from '../kit.js';
import { hfFig, lowerGirl } from './end_white_chrysanthemum.js';
import { lyingGirl } from './cg_stage.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const ID = 'mz';

// ---------------------------------------------------------------- 한 점 투시(눈높이 1.4 m)
const F = 900, VX = 512, VY = 376, CAMH = 1.4;
const pr = (x, y, z) => [VX + F * x / z, VY - F * (y - CAMH) / z];
const q = (...ps) => poly(ps.map(p => pr(...p)));
const W = 2.0, H = 3.0; // 복도 반폭, 높이
const LINE = '#b9b8c2', LINE2 = '#d2d1d8';

// 한 구간 복도(z0..z1)의 벽: 왼쪽 벽엔 창, 오른쪽 벽엔 교실 문. gaps: [[side, za, zb]] 옆 갈래 입구
function corridor(z0, z1, gaps, ox = 0) {
  let s = '';
  const X = v => v + ox;
  // 바닥 · 천장
  s += P(q([X(-W), 0, z0], [X(W), 0, z0], [X(W), 0, z1], [X(-W), 0, z1]), `url(#${ID}floor)`);
  s += P(q([X(-W), H, z0], [X(W), H, z0], [X(W), H, z1], [X(-W), H, z1]), '#e6e5ea');
  // 천장 형광등(길게 이어진 판)
  for (let z = z0 + 1; z < z1 - 0.5; z += 2.6) s += P(q([X(-0.25), H - 0.01, z], [X(0.25), H - 0.01, z], [X(0.25), H - 0.01, z + 1.2], [X(-0.25), H - 0.01, z + 1.2]), '#ffffff', LINE2, 1);
  // 바닥 타일 줄
  let g = '';
  for (let z = Math.ceil(z0); z <= z1; z += 1) g += `M${pt(pr(X(-W), 0, z))} L${pt(pr(X(W), 0, z))} `;
  for (let x = -W; x <= W + 0.01; x += 0.5) g += `M${pt(pr(X(x), 0, z0))} L${pt(pr(X(x), 0, z1))} `;
  s += P(g, 'none', LINE2, 1.2, 'opacity="0.7"');
  for (const sd of [-1, 1]) {
    const x = X(sd * W);
    // 벽면(갈래 입구를 빼고 조각조각)
    const cuts = gaps.filter(g2 => g2[0] === sd).map(g2 => [g2[1], g2[2]]).sort((a, b) => a[0] - b[0]);
    let za = z0;
    const segs = [];
    for (const [ga, gb] of cuts) { segs.push([za, ga]); za = gb; }
    segs.push([za, z1]);
    for (const [a, b] of segs) {
      if (b <= a) continue;
      s += P(q([x, 0, a], [x, H, a], [x, H, b], [x, 0, b]), sd < 0 ? `url(#${ID}wallL)` : `url(#${ID}wallR)`, LINE, 1.2);
      // 걸레받이 · 허리 몰딩
      s += P(`M${pt(pr(x, 0.12, a))} L${pt(pr(x, 0.12, b))} M${pt(pr(x, 1.0, a))} L${pt(pr(x, 1.0, b))}`, 'none', LINE, 1.5);
      // 왼쪽: 창(희게 바랜 유리) · 오른쪽: 교실 문(작은 창 + 빈 명패)
      for (let z = a + 0.4; z + 1.3 < b; z += 2.2) {
        if (sd < 0) {
          s += P(q([x, 1.1, z], [x, 2.5, z], [x, 2.5, z + 1.5], [x, 1.1, z + 1.5]), '#fbfbfd', LINE, 1.4);
          s += P(`M${pt(pr(x, 1.1, z + 0.75))} L${pt(pr(x, 2.5, z + 0.75))} M${pt(pr(x, 1.8, z))} L${pt(pr(x, 1.8, z + 1.5))}`, 'none', LINE, 1.2);
        } else {
          s += P(q([x, 0, z], [x, 2.1, z], [x, 2.1, z + 0.95], [x, 0, z + 0.95]), '#e9e8ee', LINE, 1.4);
          s += P(q([x, 1.3, z + 0.2], [x, 1.85, z + 0.2], [x, 1.85, z + 0.6], [x, 1.3, z + 0.6]), '#fdfdff', LINE, 1.2);
          s += P(q([x, 2.25, z + 0.1], [x, 2.45, z + 0.1], [x, 2.45, z + 0.7], [x, 2.25, z + 0.7]), '#f6f5f8', LINE, 1);
        }
      }
    }
    // 갈래 입구: 안쪽으로 꺾여 들어간 옆 복도(바닥·안쪽 벽이 조금 더 그늘짐)
    for (const [a, b] of cuts) {
      const xx = x + sd * 2.6;
      s += P(q([x, 0, a], [xx, 0, a], [xx, 0, b], [x, 0, b]), '#ecebf0');
      s += P(q([xx, 0, a], [xx, H, a], [xx, H, b], [xx, 0, b]), '#dddce4', LINE, 1);
      s += P(q([x, 0, b], [xx, 0, b], [xx, H, b], [x, H, b]), '#e4e3ea', LINE, 1); // 갈래 먼 쪽 벽
      s += P(q([x, H, a], [xx, H, a], [xx, H, b], [x, H, b]), '#dcdbe2');
      s += P(`M${pt(pr(x, 0, a))} L${pt(pr(x, H, a))}`, 'none', LINE, 2);
    }
  }
  return s;
}

function maze() {
  let s = `<rect width="1024" height="1536" fill="#f4f4f7"/>`;
  // 가장 먼 것부터: 셋째 구간(안개 속) → 둘째 → 첫째
  s += `<g opacity="0.55">${corridor(24, 40, [[1, 28, 30], [-1, 33, 35]])}</g>`;
  s += P(q([-W, 0, 40], [W, 0, 40], [W, H, 40], [-W, H, 40]), '#f7f7f9');
  s += `<g opacity="0.8">${corridor(12, 24, [[-1, 15, 17], [1, 19, 21]])}</g>`;
  // 둘째 구간 끝 벽(가운데만 뚫려 다음 구간이 보임)
  s += P(`${q([-W, 0, 24], [-0.9, 0, 24], [-0.9, H, 24], [-W, H, 24])} ${q([0.9, 0, 24], [W, 0, 24], [W, H, 24], [0.9, H, 24])} ${q([-0.9, 2.3, 24], [0.9, 2.3, 24], [0.9, H, 24], [-0.9, H, 24])}`, '#eeedf2', LINE, 1.2);
  s += `<rect width="1024" height="1536" fill="url(#${ID}fogFar)"/>`;
  s += corridor(0.7, 12, [[-1, 3.2, 4.8], [1, 6.4, 8.0], [-1, 9.4, 10.6]]);
  // 첫 구간 끝 벽(왼쪽만 뚫림 → 갈래)
  s += P(`${q([-0.6, 0, 12], [W, 0, 12], [W, H, 12], [-0.6, H, 12])} ${q([-W, 2.3, 12], [-0.6, 2.3, 12], [-0.6, H, 12], [-W, H, 12])}`, '#efeef3', LINE, 1.4);
  s += P(`M${pt(pr(-0.6, 0.12, 12))} L${pt(pr(W, 0.12, 12))} M${pt(pr(-0.6, 1.0, 12))} L${pt(pr(W, 1.0, 12))}`, 'none', LINE, 1.4);
  return s;
}

// 성아 뒤: 천장에서 내려온 올가미 밧줄의 흐린 그림자 + 오른쪽 벽에 비친 매달린 형체 그림자
function ropeShadow() {
  let s = `<g opacity="0.32" filter="url(#${ID}b3)">`;
  s += P('M506 -20 C508 60 504 130 507 196', 'none', '#6a6878', 7);
  s += `<ellipse cx="507" cy="226" rx="40" ry="30" fill="none" stroke="#6a6878" stroke-width="8"/>`;
  s += P('M507 196 C500 204 498 214 500 222 M507 196 C514 204 516 214 514 222', 'none', '#6a6878', 6);
  s += '</g>';
  // 오른쪽 벽 위의 비스듬한 그림자(빛은 왼쪽 앞 창에서)
  const a = pr(W, 2.95, 2.6), b = pr(W, 0.7, 3.0);
  s += `<g opacity="0.16" filter="url(#${ID}b6)"><path d="M${pt(a)} L${f1(b[0])} ${f1(b[1] - 260)}" stroke="#4a4858" stroke-width="5" fill="none"/>` +
    `<ellipse cx="${f1(b[0])}" cy="${f1(b[1] - 236)}" rx="16" ry="24" fill="#4a4858"/><path d="M${f1(b[0] - 20)} ${f1(b[1] - 214)} L${f1(b[0] + 20)} ${f1(b[1] - 214)} L${f1(b[0] + 18)} ${f1(b[1] - 40)} L${f1(b[0] - 14)} ${f1(b[1] - 40)} Z" fill="#4a4858"/></g>`;
  return s;
}

export function draw() {
  // 성아(공중에 뜸): 창백한 회백색으로 누르고, 눈은 텅 빈 검은 구멍 + 아래로 번진 검은 눈물
  const pale = '0.5 0.32 0.16 0 0.13  0.3 0.5 0.16 0 0.13  0.3 0.32 0.52 0 0.17  0 0 0 1 0';
  const eyes = [[168, 243], [281, 243]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="30" ry="16" fill="#08070c" filter="url(#${ID}b2)"/><ellipse cx="${x}" cy="${y}" rx="24" ry="12" fill="#000"/>` +
    `<path d="M${x - 6} ${y + 14} C${x - 8} ${y + 40} ${x - 2} ${y + 60} ${x - 6} ${y + 92}" stroke="#1a1820" stroke-width="5" fill="none" opacity="0.7" filter="url(#${ID}b2)"/>` +
    `<circle cx="${x + 4}" cy="${y - 3}" r="2" fill="#d8dae8" opacity="0.6"/>`).join('');
  const lower = `<g mask="url(#${ID}legFade)">` + lowerGirl(448, 792, { coat: '#3c3e50', skirt: '#46485a', leg: '#c6c8d0', line: '#20222c', torn: true, hand: '#d4d6de', cuff: '#2c2e3c', shirt: '#c4c6d0', feet: true }) + '</g>';
  const se = hfFig(`${ID}a`, 'seonga', {
    cx: 512, top: 136, s: 0.52, grade: pale, rim: '#ffffff', rimDx: 3, rimDy: 3, rimOp: 0.5, fade: [0.86, 1.0], rimTo: 0.5,
    over: [{ fill: `url(#${ID}aShade)` }],
    under: lower,
    extra: eyes +
      // 찢긴 블레이저 자락 · 해진 실밥(초상화 아랫부분 위)
      P('M60 700 L90 760 L70 792 M380 690 L360 750 L392 792 M200 620 L214 660 L204 700', 'none', '#3a3c48', 3, 'opacity="0.7"') +
      `<path d="M120 650 L146 690 L124 716 L112 684 Z M330 664 L348 700 L326 726 L318 690 Z" fill="#14151c" opacity="0.75"/>`,
  });
  const defs = se.defs +
    `<filter id="${ID}b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>` +
    `<filter id="${ID}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f2f5"/><stop offset="1" stop-color="#d8d7df"/></linearGradient>` +
    `<linearGradient id="${ID}wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2e1e8"/><stop offset="1" stop-color="#f4f4f7"/></linearGradient>` +
    `<linearGradient id="${ID}wallR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f1f1f5"/><stop offset="1" stop-color="#d9d8e0"/></linearGradient>` +
    `<radialGradient id="${ID}fogFar" cx="${VX}" cy="${VY}" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}fogNear" cx="${VX}" cy="${VY}" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity="0.5"/><stop offset="0.4" stop-color="#fff" stop-opacity="0.1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${ID}aShade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="792"><stop offset="0" stop-color="#3a3c50" stop-opacity="0.12"/><stop offset="1" stop-color="#3a3c50" stop-opacity="0.3"/></linearGradient>` +
    // 다리는 아래로 갈수록 희미해짐(초상화 좌표)
    `<linearGradient id="${ID}legFadeG" gradientUnits="userSpaceOnUse" x1="0" y1="${792 + 560}" x2="0" y2="${792 + 1260}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.15"/></linearGradient>` +
    `<mask id="${ID}legFade" maskUnits="userSpaceOnUse" x="-400" y="-400" width="1300" height="2800"><rect x="-400" y="-400" width="1300" height="2800" fill="url(#${ID}legFadeG)"/></mask>` +
    `<radialGradient id="${ID}vig" cx="512" cy="700" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#8a88a0" stop-opacity="0"/><stop offset="1" stop-color="#5a5870" stop-opacity="0.55"/></radialGradient>`;
  let s = maze();
  s += `<rect width="1024" height="1536" fill="url(#${ID}fogNear)"/>`;
  s += ropeShadow();
  // 성아 아래 바닥의 흐린 그림자(떠 있음)
  s += `<ellipse cx="512" cy="1250" rx="120" ry="22" fill="#8a889a" opacity="0.35" filter="url(#${ID}b6)"/>`;
  // 성아 둘레 차가운 기운
  s += `<ellipse cx="512" cy="600" rx="220" ry="480" fill="#c8cce0" opacity="0.35" filter="url(#${ID}b20)"/>`;
  s += se.body;
  // 소영: 성아 발치 바닥에 쓰러짐(머리는 왼쪽, 긴 머리가 흰 바닥에 퍼짐)
  s += `<ellipse cx="520" cy="1352" rx="300" ry="40" fill="#7a788a" opacity="0.35" filter="url(#${ID}b6)"/>`;
  s += `<g transform="translate(330 1318) rotate(4) scale(0.82 0.74)">${lyingGirl({ lit: '#ffffff', litOp: 0.55, body: '#28304e', skirt: '#232a44', hair: '#0a0a10', skin: '#d6c2ba', legs: '#1c1c26', hairHi: '#6a6c80' })}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
