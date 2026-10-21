// end_yew — 엔딩(주목, 죽음). 사람은 없다. 불 꺼진 복도가 어둠 속으로 끝없이 이어지고, 바닥 한가운데 주인을 잃은 책가방이
// 옆으로 쓰러져 열린 채(공책 한 권이 미끄러져 나옴) 놓여 있다. 화면 위 왼쪽에서 검푸른 주목 가지가 드리우고, 가지마다 컵 모양의
// 붉은 열매(가운데 검은 씨)가 맺혀 있다. 복도 끝 비상구 등의 희미한 초록과 창으로 드는 흐린 달빛 외엔 칠흑, 열매의 붉은빛만 또렷하다.
import * as K from '../kit.js';
import { rng } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const ID = 'eyw';

// ---------------------------------------------------------------- 한 점 투시 복도
const F = 760, VX = 560, VY = 640, CAMH = 1.3;
const pr = (x, y, z) => [VX + F * x / z, VY - F * (y - CAMH) / z];
const q = (...ps) => poly(ps.map(p => pr(...p)));
const W = 1.6, H = 3.0, Z1 = 40;
const INK = '#020205';

function corridor() {
  let s = `<rect width="1024" height="1536" fill="#040509"/>`;
  s += P(q([-W, H, 0.5], [W, H, 0.5], [W, H, Z1], [-W, H, Z1]), '#07080d');
  s += P(q([-W, 0, 0.5], [-W, H, 0.5], [-W, H, Z1], [-W, 0, Z1]), `url(#${ID}wallL)`);
  s += P(q([W, 0, 0.5], [W, H, 0.5], [W, H, Z1], [W, 0, Z1]), `url(#${ID}wallR)`);
  s += P(q([-W, 0, 0.5], [W, 0, 0.5], [W, 0, Z1], [-W, 0, Z1]), `url(#${ID}floor)`);
  // 바닥 타일 · 걸레받이
  let g = '';
  for (let z = 1; z < Z1; z *= 1.18) g += `M${pt(pr(-W, 0, z))} L${pt(pr(W, 0, z))} `;
  for (let x = -W; x <= W + 0.01; x += 0.4) g += `M${pt(pr(x, 0, 0.6))} L${pt(pr(x, 0, Z1))} `;
  s += P(g, 'none', '#0b0d14', 1.5);
  s += P(`M${pt(pr(-W, 0.12, 0.6))} L${pt(pr(-W, 0.12, Z1))} M${pt(pr(W, 0.12, 0.6))} L${pt(pr(W, 0.12, Z1))}`, 'none', '#020306', 4);
  // 왼쪽 창(달빛) · 오른쪽 교실 문
  for (let z = 2; z < Z1; z *= 1.55) {
    s += P(q([-W, 1.0, z], [-W, 2.5, z], [-W, 2.5, z * 1.3], [-W, 1.0, z * 1.3]), `url(#${ID}win)`, INK, 2);
    s += P(`M${pt(pr(-W, 1.75, z))} L${pt(pr(-W, 1.75, z * 1.3))} M${pt(pr(-W, 1.0, z * 1.15))} L${pt(pr(-W, 2.5, z * 1.15))}`, 'none', INK, 2);
    s += P(q([W, 0, z * 1.1], [W, 2.1, z * 1.1], [W, 2.1, z * 1.3], [W, 0, z * 1.3]), '#0c0e15', INK, 2);
    // 창에서 바닥으로 떨어진 흐린 달빛 사다리꼴
    s += P(q([-W, 0, z], [-W + 1.2, 0, z * 1.05], [-W + 1.2, 0, z * 1.35], [-W, 0, z * 1.3]), '#8ea4cc', 'none', 0, 'opacity="0.08"');
  }
  // 끝의 어둠 + 비상구 등
  const e = pr(0, 2.6, Z1 - 1);
  s += `<rect x="${f1(e[0] - 10)}" y="${f1(e[1] - 4)}" width="20" height="8" fill="#2a9a64"/><ellipse cx="${f1(e[0])}" cy="${f1(e[1])}" rx="70" ry="46" fill="url(#${ID}exit)"/>`;
  return s;
}

// 쓰러진 책가방(바닥 위, 옆으로 누워 덮개가 열림) + 미끄러져 나온 공책
function bag() {
  let s = `<ellipse cx="540" cy="1180" rx="230" ry="40" fill="#000" opacity="0.6" filter="url(#${ID}b12)"/>`;
  // 미끄러져 나온 공책(바닥에 비스듬히)
  s += P('M640 1150 L800 1128 L828 1186 L664 1210 Z', '#3a3446', INK, 2.5) + P('M664 1210 L828 1186 L830 1194 L666 1218 Z', '#d8d2c4', INK, 1.5);
  s += P('M660 1160 L790 1142', 'none', '#5a5266', 2, 'opacity="0.7"');
  // 가방 몸통(옆으로 누운 직육면체, 위가 둥긂)
  s += P('M380 1180 L380 1060 C380 1020 410 1000 450 1000 L640 1000 C680 1000 700 1020 700 1060 L700 1180 Z', '#1d2236', INK, 3);
  s += P('M700 1060 L740 1040 L740 1150 L700 1180 Z', '#141828', INK, 3); // 옆면(두께)
  s += P('M640 1000 C680 1000 700 1020 700 1060 L740 1040 C740 1004 720 984 680 984 L600 984 Z', '#252b42', INK, 2.5);
  // 열린 덮개(바닥으로 젖혀짐)
  s += P('M380 1100 C340 1110 300 1140 286 1190 L420 1206 C424 1180 410 1150 380 1140 Z', '#262c44', INK, 3);
  s += P('M300 1170 L410 1182', 'none', '#3a4262', 3, 'opacity="0.7"');
  // 앞주머니 · 지퍼 · 버클
  s += P('M430 1080 L650 1080 L650 1170 L430 1170 Z', '#232940', INK, 2.5);
  s += P('M430 1088 L650 1088', 'none', '#6a7088', 2, 'stroke-dasharray="4 3"');
  s += `<rect x="530" y="1072" width="22" height="30" rx="3" fill="#8a8e9c" stroke="${INK}" stroke-width="2"/>`;
  // 어깨끈(바닥에 늘어져 꼬임)
  s += P('M640 1004 C690 940 760 950 790 1000 C810 1036 800 1080 830 1110 C860 1140 900 1140 930 1130', 'none', INK, 18) + P('M640 1004 C690 940 760 950 790 1000 C810 1036 800 1080 830 1110 C860 1140 900 1140 930 1130', 'none', '#1a1e30', 13);
  // 매달린 작은 열쇠고리(흰 토끼 모양 장식)
  s += P('M470 1000 C466 1020 470 1036 478 1046', 'none', '#7a7e8c', 2);
  s += `<ellipse cx="482" cy="1060" rx="14" ry="16" fill="#cfcad0" stroke="${INK}" stroke-width="2"/><ellipse cx="476" cy="1040" rx="4" ry="10" fill="#cfcad0" stroke="${INK}" stroke-width="1.5"/><ellipse cx="488" cy="1040" rx="4" ry="10" fill="#cfcad0" stroke="${INK}" stroke-width="1.5"/>`;
  // 달빛 테두리
  s += P('M380 1060 C380 1020 410 1000 450 1000 L640 1000 M286 1190 C300 1140 340 1110 380 1100', 'none', '#9ab0d8', 2.5, 'opacity="0.5"');
  return s;
}

// ---------------------------------------------------------------- 주목 가지: 가는 잔가지 양옆으로 납작한 바늘잎이 빗살처럼, 끝마다 붉은 열매
function twig(pts, rnd, { leaf = '#14261c', leafHi = '#2c4a36', len = 30 } = {}) {
  let d = `M${pt(pts[0])}`;
  for (let i = 1; i < pts.length; i++) d += ` L${pt(pts[i])}`;
  let s = P(d, 'none', '#1a0f0c', 4);
  let needles = '', hi = '';
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const a = Math.atan2(y1 - y0, x1 - x0), segL = Math.hypot(x1 - x0, y1 - y0);
    for (let t = 0; t < segL; t += 9) {
      const x = x0 + Math.cos(a) * t, y = y0 + Math.sin(a) * t;
      for (const sd of [-1, 1]) {
        const b = a + sd * (1.15 + rnd() * 0.2) + 0.25, L = len * (0.8 + rnd() * 0.3);
        const ex = x + Math.cos(b) * L, ey = y + Math.sin(b) * L;
        const nx = -Math.sin(b) * 3.2, ny = Math.cos(b) * 3.2;
        needles += `M${f1(x)} ${f1(y)} Q${f1((x + ex) / 2 + nx)} ${f1((y + ey) / 2 + ny)} ${f1(ex)} ${f1(ey)} Q${f1((x + ex) / 2 - nx)} ${f1((y + ey) / 2 - ny)} ${f1(x)} ${f1(y)} Z `;
        if (sd < 0) hi += `M${f1(x)} ${f1(y)} L${f1(ex)} ${f1(ey)} `;
      }
    }
  }
  s += P(needles, leaf, '#050a07', 0.8) + P(hi, 'none', leafHi, 1, 'opacity="0.6"');
  return s;
}
// 컵 모양 붉은 열매(가운데 검은 씨가 보임)
function berry(x, y, r) {
  // 아래가 트인 컵: 몸통(붉은 과육) + 아래 끝 트인 구멍 속 검은 씨 끝
  return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.5)}" ry="${f1(r * 1.5)}" fill="#e02030" opacity="0.14" filter="url(#${ID}b6)"/>` +
    `<path d="M${f1(x - r)} ${f1(y - r * 0.2)} C${f1(x - r)} ${f1(y - r * 1.1)} ${f1(x + r)} ${f1(y - r * 1.1)} ${f1(x + r)} ${f1(y - r * 0.2)} C${f1(x + r)} ${f1(y + r * 0.7)} ${f1(x + r * 0.6)} ${f1(y + r * 1.05)} ${f1(x)} ${f1(y + r * 1.05)} C${f1(x - r * 0.6)} ${f1(y + r * 1.05)} ${f1(x - r)} ${f1(y + r * 0.7)} ${f1(x - r)} ${f1(y - r * 0.2)} Z" fill="url(#${ID}berry)" stroke="#2a0306" stroke-width="1.4"/>` +
    `<ellipse cx="${f1(x)}" cy="${f1(y + r * 0.9)}" rx="${f1(r * 0.4)}" ry="${f1(r * 0.16)}" fill="#7a0a14"/><ellipse cx="${f1(x)}" cy="${f1(y + r * 0.92)}" rx="${f1(r * 0.2)}" ry="${f1(r * 0.09)}" fill="#120608"/>` +
    `<ellipse cx="${f1(x - r * 0.38)}" cy="${f1(y - r * 0.38)}" rx="${f1(r * 0.18)}" ry="${f1(r * 0.1)}" fill="#ff9a9a" opacity="0.55"/>`;
}
function yew() {
  const rnd = rng(23);
  let s = '';
  // 굵은 가지(왼쪽 위 밖에서 들어옴)
  s += P('M-40 60 C80 110 200 140 320 200 C420 250 500 290 600 320', 'none', '#140b08', 18) + P('M-40 60 C80 110 200 140 320 200 C420 250 500 290 600 320', 'none', '#2a1812', 11);
  const twigs = [
    [[40, 82], [70, 200], [96, 320], [110, 430]],
    [[150, 120], [200, 230], [230, 350], [250, 470], [262, 560]],
    [[260, 170], [300, 120], [360, 70], [420, 40]],
    [[330, 206], [380, 300], [400, 400], [420, 500]],
    [[440, 262], [500, 200], [580, 170], [660, 160]],
    [[520, 296], [560, 380], [586, 460]],
    [[600, 320], [680, 330], [760, 360], [820, 410]],
    [[-20, 70], [-10, 200], [10, 300]],
    [[110, 100], [160, 40], [220, 0]],
  ];
  for (const t of twigs) s += twig(t, rnd, { len: 26 + rnd() * 10 });
  // 열매(잔가지 아래쪽에 매달림)
  const berries = [[112, 440, 11], [124, 452, 9], [264, 570, 12], [250, 560, 9], [420, 512, 11], [588, 470, 11], [600, 480, 8], [822, 424, 10]];
  for (const [x, y, r] of berries) s += P(`M${x} ${y - r - 10} L${x} ${y - r + 2}`, 'none', '#2c4a36', 2) + berry(x, y, r);
  return s;
}

export function draw() {
  const defs =
    `<filter id="${ID}b6" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}dof" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6"/></filter>` +
    `<filter id="${ID}near" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.8"/></filter>` +
    `<linearGradient id="${ID}wallL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#121624"/><stop offset="1" stop-color="#080a10"/></linearGradient>` +
    `<linearGradient id="${ID}wallR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#07080d"/><stop offset="1" stop-color="#0e111c"/></linearGradient>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060a"/><stop offset="1" stop-color="#141826"/></linearGradient>` +
    `<linearGradient id="${ID}win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a5c"/><stop offset="1" stop-color="#4a6088"/></linearGradient>` +
    `<radialGradient id="${ID}exit"><stop offset="0" stop-color="#2aa36a" stop-opacity="0.35"/><stop offset="1" stop-color="#2aa36a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}berry" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#e8404a"/><stop offset="0.6" stop-color="#a80c18"/><stop offset="1" stop-color="#4a0208"/></radialGradient>` +
    `<radialGradient id="${ID}moon" cx="300" cy="900" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8ea4cc" stop-opacity="0.12"/><stop offset="1" stop-color="#8ea4cc" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="540" cy="820" r="880" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.96"/></radialGradient>`;
  let s = `<g filter="url(#${ID}dof)">${corridor()}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}moon)" style="mix-blend-mode:screen"/>`;
  s += bag();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<g filter="url(#${ID}near)">${yew()}</g>`;
  return K.svg(s, { defs });
}
