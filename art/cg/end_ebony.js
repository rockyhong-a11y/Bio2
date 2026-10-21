// end_ebony — 엔딩(흑단). 이른 새벽, 중앙 현관. "소영"이 희민과 나란히 학교를 나서며 웃지만 그 웃음은 성아의 것이다.
// 어긋남은 작게: 소영의 푸른 눈이 성아 같은 탁한 호박빛으로 바뀌어 있고, 문밖 빛에 뒷벽으로 길게 드리운 그녀의 그림자는
// 긴 머리가 아니라 성아의 짧은 단발이다. 뒤쪽 현관 유리문 한 짝에는 안에 갇힌 진짜 소영의 흐릿한 손바닥과 긴 머리 그림자.
// 흑단처럼 검고 윤기 도는 나무 벽·신발장, 온통 어두운 갈색·검정 톤. 인물은 힉스필드 초상화(소영 미소 · 희민 미소).
import * as K from '../kit.js';
import { hfFig, lowerGirl, lowerBoy, rng } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const ID = 'eeb';

// ---------------------------------------------------------------- 배경: 흑단빛 나무 벽(세로 판재) + 오른쪽 뒤 현관 유리문 + 바닥
const DX0 = 560, DX1 = 1000, DY0 = 120, DY1 = 1000; // 유리문 두 짝 영역
function scene() {
  let s = `<rect width="1024" height="1536" fill="#0c0806"/>`;
  // 나무 벽(판재 결 + 윤기 띠)
  s += `<rect x="0" y="0" width="${DX0 - 20}" height="1000" fill="url(#${ID}wood)"/>`;
  let g = '';
  for (let x = 0; x < DX0 - 20; x += 46) g += `M${x} 0 L${x} 1000 `;
  s += P(g, 'none', '#050302', 3, 'opacity="0.9"');
  const rnd = rng(17);
  let grain = '';
  for (let i = 0; i < 60; i++) { const x = rnd() * (DX0 - 30), y = rnd() * 1000; grain += `M${f1(x)} ${f1(y)} C${f1(x + 4)} ${f1(y + 40)} ${f1(x - 3)} ${f1(y + 80)} ${f1(x + 2)} ${f1(y + 130)} `; }
  s += P(grain, 'none', '#3a2418', 1.5, 'opacity="0.5"');
  s += P(`M0 ${980} L${DX0 - 20} 980`, 'none', '#2a1a12', 10); // 걸레받이
  // 현관 유리문(검은 나무 틀 두 짝) — 바깥은 새벽 안개(희뿌염)
  s += `<rect x="${DX0 - 20}" y="0" width="${1044 - DX0}" height="1000" fill="#120b08"/>`;
  s += `<rect x="${DX0}" y="${DY0}" width="${DX1 - DX0}" height="${DY1 - DY0}" fill="url(#${ID}out)"/>`;
  // 바깥 풍경(흐릿한 나무·담 실루엣)
  s += P(`M${DX0} 760 C${DX0 + 80} 700 ${DX0 + 160} 720 ${DX0 + 230} 690 C${DX0 + 300} 660 ${DX0 + 380} 690 ${DX1} 670 L${DX1} ${DY1} L${DX0} ${DY1} Z`, '#5a4c4a', 'none', 0, 'opacity="0.6"');
  const mid = (DX0 + DX1) / 2;
  s += P(`M${DX0} ${DY0} L${DX1} ${DY0} L${DX1} ${DY1} L${DX0} ${DY1} Z M${mid - 14} ${DY0} L${mid + 14} ${DY0} L${mid + 14} ${DY1} L${mid - 14} ${DY1} Z`, 'none', '#050302', 6);
  s += `<rect x="${mid - 14}" y="${DY0}" width="28" height="${DY1 - DY0}" fill="#1a100b"/>`;
  s += `<rect x="${DX0 - 26}" y="${DY0 - 26}" width="${DX1 - DX0 + 52}" height="26" fill="#1e130d"/><rect x="${DX0 - 26}" y="${DY0}" width="26" height="${DY1 - DY0}" fill="#1e130d"/><rect x="${DX1}" y="${DY0}" width="40" height="${DY1 - DY0}" fill="#1e130d"/>`;
  s += P(`M${mid - 40} 560 L${mid - 40} 640 M${mid + 40} 560 L${mid + 40} 640`, 'none', '#8a7a62', 6); // 손잡이
  // 바닥(어두운 돌, 문 쪽에서 빛이 비침)
  s += `<rect y="1000" width="1024" height="536" fill="url(#${ID}floor)"/>`;
  s += `<path d="M${DX0} 1000 L${DX1} 1000 L1024 1536 L300 1536 Z" fill="#d8c4a8" opacity="0.08"/>`;
  return s;
}
// 유리문 안쪽에 갇힌 진짜 소영: 왼쪽 문짝 위쪽에 짚은 흐린 손바닥 + 유리 너머 긴 머리 그림자
function trappedHand() {
  const x = DX0 + 100, y = 300;
  let s = `<g opacity="0.55">`;
  s += P(`M${x - 70} ${y - 60} C${x - 76} ${y + 60} ${x - 86} ${y + 220} ${x - 96} ${y + 380} L${x + 60} ${y + 380} C${x + 52} ${y + 220} ${x + 50} ${y + 60} ${x + 46} ${y - 60} C${x + 30} ${y - 110} ${x - 54} ${y - 110} ${x - 70} ${y - 60} Z`, '#120c10', 'none', 0, `filter="url(#${ID}b6)"`);
  s += '</g>';
  const d = 'M-22 30 C-26 10 -26 -8 -20 -20 L-30 -56 C-32 -64 -22 -66 -20 -58 L-10 -26 L-12 -70 C-12 -78 -2 -78 -2 -70 L0 -28 L8 -72 C10 -80 20 -78 18 -70 L12 -26 L24 -60 C26 -68 36 -64 34 -56 L22 -16 C30 -12 40 -16 46 -24 C52 -30 60 -24 54 -16 C44 0 34 14 22 30 C10 40 -12 40 -22 30 Z';
  s += `<g transform="translate(${x + 40} ${y + 30}) rotate(10) scale(1.05)">` +
    `<path d="${d}" fill="#d9dce8" opacity="0.32" filter="url(#${ID}b3)"/>` + P(d, 'none', '#e8ecf6', 1.5, 'opacity="0.5"') + '</g>';
  // 손바닥 둘레 김 서림
  s += `<ellipse cx="${x + 44}" cy="${y + 20}" rx="70" ry="80" fill="#c8ccd8" opacity="0.1" filter="url(#${ID}b12)"/>`;
  return s;
}
// 뒷벽에 드리운 그림자: 희민(짧은 머리) · "소영" — 그림자는 성아의 단발
function shadows() {
  let s = '';
  // 소영 자리의 그림자(왼쪽 벽 · 단발 + 어깨)
  const bob = 'M0 0 C-60 0 -96 40 -100 100 C-104 150 -110 200 -112 222 L-70 230 C-60 260 -50 270 -40 276 L-150 330 C-200 350 -220 400 -224 520 L224 520 C220 400 200 350 150 330 L40 276 C50 270 60 260 70 230 L112 222 C110 200 104 150 100 100 C96 40 60 0 0 0 Z';
  s += `<g transform="translate(150 360) scale(1.0) skewX(-6)" opacity="0.6" filter="url(#${ID}b4)"><path d="${bob}" fill="#000"/></g>`;
  return s;
}

export function draw() {
  const grade = '0.6 0.04 0 0 0.02  0.02 0.52 0.02 0 0.01  0 0.02 0.46 0 0.01  0 0 0 1 0';
  const so = hfFig(`${ID}s`, 'soyoung_smile', {
    cx: 380, top: 470, s: 1.3, rot: 1, grade, rim: '#f0d6b4', rimDx: -5, rimDy: 3, rimOp: 0.85, fade: [0.82, 0.99], rimTo: 0.55,
    over: [{ fill: `url(#${ID}sShade)` }],
    under: lowerGirl(446, 636, { coat: '#120d10', skirt: '#140f12', hair: '#050304' }),
    // 눈동자 색을 성아의 탁한 호박빛으로(밝기는 그대로, 색만) + 동공 속 아주 작은 붉은 반짝임
    extra: `<g style="mix-blend-mode:color" opacity="0.8"><ellipse cx="176" cy="229" rx="14" ry="11" fill="#6a3c1c"/><ellipse cx="268" cy="229" rx="14" ry="11" fill="#6a3c1c"/></g>` +
      `<circle cx="178" cy="231" r="1.8" fill="#ff5a48" opacity="0.7"/><circle cx="270" cy="231" r="1.8" fill="#ff5a48" opacity="0.7"/>`,
  });
  const hm = hfFig(`${ID}h`, 'heemin_smile', {
    cx: 790, top: 560, s: 1.02, rot: -1, grade, rim: '#f0d6b4', rimDx: -5, rimDy: 3, rimOp: 0.85, fade: [0.8, 0.99], rimTo: 0.55,
    over: [{ fill: `url(#${ID}hShade)` }],
    under: lowerBoy(454, 656, { coat: '#120d10', pants: '#0b0808' }),
  });
  const defs = so.defs + hm.defs +
    `<filter id="${ID}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}dof" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.3"/></filter>` +
    `<linearGradient id="${ID}wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a100b"/><stop offset="0.6" stop-color="#2a1a12"/><stop offset="1" stop-color="#3a2618"/></linearGradient>` +
    `<linearGradient id="${ID}out" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c6470"/><stop offset="0.6" stop-color="#a8968a"/><stop offset="1" stop-color="#c8b49c"/></linearGradient>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1e18"/><stop offset="1" stop-color="#080504"/></linearGradient>` +
    `<linearGradient id="${ID}sShade" gradientUnits="userSpaceOnUse" x1="446" y1="0" x2="0" y2="636"><stop offset="0" stop-color="#140a06" stop-opacity="0.05"/><stop offset="1" stop-color="#140a06" stop-opacity="0.5"/></linearGradient>` +
    `<linearGradient id="${ID}hShade" gradientUnits="userSpaceOnUse" x1="454" y1="0" x2="0" y2="656"><stop offset="0" stop-color="#140a06" stop-opacity="0.1"/><stop offset="1" stop-color="#140a06" stop-opacity="0.5"/></linearGradient>` +
    `<radialGradient id="${ID}door" cx="${(DX0 + DX1) / 2}" cy="500" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8cfa8" stop-opacity="0.22"/><stop offset="1" stop-color="#e8cfa8" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="520" cy="740" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#050302" stop-opacity="0.6"/><stop offset="1" stop-color="#050302" stop-opacity="0.95"/></radialGradient>`;
  let s = `<g filter="url(#${ID}dof)">${scene()}${trappedHand()}${shadows()}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}door)" style="mix-blend-mode:screen"/>`;
  s += hm.body + so.body;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
