// cg_hanging — 강당 통로 모퉁이: 천장 배관 아래 매달린 한나영의 귀신이 천천히 고개를 돌린다.
// 눈높이 시점(올려다보지 않음), 귀신 자신의 차가운 푸른 빛 외에는 거의 칠흑. 목·매듭·상처는 보이지 않는다.
// 귀신 그리기(ghost)는 cg_recording 과 같이 쓴다(머리·피부·여름 교복·한쪽 눈이 같게).
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;

// ---------------------------------------------------------------- 귀신(한나영) 공용
// 지역 좌표: 정수리 (0,0), 발끝 y≈764. 머리 ~140, 몸은 정면, 팔은 길고 가늘게 늘어뜨림.
export const GC = {
  skin: { base: '#a2aab3', shade: '#7c8694', line: '#1c2029', mottle: '#5d6f8c' },
  hair: { base: '#0a0c12', shade: '#040509', hi: '#7c95bb', wet: '#b4c8e6', line: '#010102' },
  blouse: { base: '#bdbba8', shade: '#7b7d79', line: '#2e302d', stain: '#8f7f55' },
  ribbon: { base: '#5c1a28', shade: '#3a0e18', line: '#1a060b' },
  skirt: { base: '#28314b', shade: '#181e31', band: '#626a7b', line: '#0a0d17' },
  nail: '#4a3d5e', eye: '#d7dbda',
};
const LW = 3; // 귀신 외곽선 굵기

// 뒷머리: 머리 뒤에서 허리 아래까지, 끝이 젖은 다발로 갈라짐
const BACK_HAIR = 'M0 -2 C40 -2 66 26 68 72 C70 116 90 160 106 214 C122 262 130 330 132 392 ' +
  'L124 430 L116 398 L106 446 L96 404 L84 440 L74 402 L62 432 L50 398 L36 400 ' +
  'L-36 400 L-50 400 L-62 434 L-74 402 L-86 444 L-96 404 L-108 440 L-118 398 L-126 428 L-132 390 ' +
  'C-130 330 -122 262 -106 214 C-90 160 -70 116 -68 72 C-66 26 -40 -2 0 -2 Z';
// 얼굴을 덮은 앞머리 장막(바깥) + 왼눈(그림 오른쪽)이 보이는 좁은 틈(안쪽, evenodd)
const CURTAIN_OUT = 'M0 2 C36 2 60 28 62 74 C63 102 64 126 66 150 ' +
  'L61 184 L56 160 L50 204 L44 168 L38 196 L31 170 L24 186 L17 164 L10 178 L3 162 L-4 176 L-11 160 L-18 182 L-25 166 ' +
  'L-32 198 L-39 170 L-46 206 L-53 166 L-59 190 L-63 158 L-66 150 ' +
  'C-64 126 -63 102 -62 74 C-60 28 -36 2 0 2 Z';
const GAP = 'M24 36 C8 62 8 104 27 136 C46 104 51 64 33 36 Z';
// 어깨 앞으로 흘러내린 두 다발(가슴 가운데는 비워 리본이 보이게)
const LOCK_R = 'M28 122 C38 156 42 204 41 262 C40 320 42 378 44 428 L52 408 L58 448 L66 414 L73 442 L80 402 C78 340 76 280 74 222 C72 182 70 150 64 122 Z';
const LOCK_L = 'M-28 122 C-38 156 -43 204 -42 262 C-41 322 -42 380 -45 432 L-53 410 L-60 450 L-67 414 L-74 440 L-81 400 C-79 340 -77 280 -75 222 C-73 182 -70 150 -64 122 Z';
const TORSO = 'M-34 160 C-52 163 -70 171 -82 186 L-72 256 C-66 282 -62 306 -60 338 L60 338 C62 306 66 282 72 256 L82 186 C70 171 52 163 34 160 Z';
const SLEEVE_R = 'M58 166 C72 170 82 176 88 188 C96 208 101 228 105 250 L99 247 L96 256 L90 250 L85 258 L80 251 L75 258 L70 252 C70 232 68 210 63 192 Z';
const ARM_R = 'M74 236 C78 300 82 380 84 468 L97 468 C98 380 99 300 98 236 Z';
const PALM_R = 'M83 462 C79 478 79 496 82 510 C88 515 96 515 101 508 C103 494 101 478 97 462 Z';
const FINGERS_R = [
  [[85, 506], [83, 530], [82, 552], [85, 573]],
  [[90, 510], [89, 536], [89, 561], [92, 584]],
  [[95, 510], [95, 534], [96, 557], [99, 577]],
  [[99.5, 505], [101, 526], [102, 544], [104.5, 561]],
];
const THUMB_R = [[84, 482], [80, 496], [78, 512], [80, 527]];
// 해진 단: 불규칙한 톱니
const HEM = [[69, 522], [63, 513], [56, 524], [49, 512], [41, 520], [35, 511], [27, 526], [20, 513], [12, 521], [5, 512], [-3, 523], [-10, 511], [-18, 519], [-25, 512], [-32, 527], [-39, 513], [-47, 521], [-54, 511], [-61, 524], [-68, 513]];
const SKIRT = 'M-60 334 L60 334 L76 512 ' + HEM.map(p => `L${p[0]} ${p[1]}`).join(' ') + ' L-76 512 Z';
const LEG_R = 'M8 506 L33 506 C35 548 33 600 29 680 C32 700 33 726 31 750 C30 760 26 766 21 764 C17 763 14 758 14 748 C13 726 14 700 16 680 C13 630 10 576 8 506 Z';
const FOOT_R = 'M14 748 C14 758 17 764 22 764 C27 766 31 760 31 750 L29 740 L16 740 Z';
const mirror = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f1(-x)} ${y}`);
const LEG_L = mirror(LEG_R), FOOT_L = mirror(FOOT_R), ARM_L = mirror(ARM_R), PALM_L = mirror(PALM_R), SLEEVE_L = mirror(SLEEVE_R);


const curve = p => `M${pt(p[0])} C${pt(p[1])} ${pt(p[2])} ${pt(p[3])}`;
// 가운데가 굵고 양끝이 뾰족한 선(젖은 머리 광택 등): 3차 베지어를 따라 폭 w
export function taper(p, w) {
  const bz = (t, i) => (1 - t) ** 3 * p[0][i] + 3 * (1 - t) ** 2 * t * p[1][i] + 3 * (1 - t) * t * t * p[2][i] + t ** 3 * p[3][i];
  const N = 14, A = [], Bk = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N, x = bz(t, 0), y = bz(t, 1);
    const t2 = Math.min(1, t + 0.01), t1 = Math.max(0, t - 0.01);
    let dx = bz(t2, 0) - bz(t1, 0), dy = bz(t2, 1) - bz(t1, 1);
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const h = Math.sin(Math.PI * t) ** 0.8 * w / 2;
    A.push([x - dy * h, y + dx * h]); Bk.push([x + dy * h, y - dx * h]);
  }
  return 'M' + [...A, ...Bk.reverse()].map(pt).join(' L') + ' Z';
}
const streaks = (list, w) => list.map(q => taper(q, w)).join(' ');
// 손: 손바닥 + 가늘고 긴 손가락(먹선 굵게 → 피부 가늘게) + 짙은 회보라 손톱
function hand(side) {
  const m = p => [p[0] * side, p[1]];
  const fs = FINGERS_R.map(f => f.map(m)), th = THUMB_R.map(m);
  let s = '';
  for (const f of [th, ...fs]) s += P(curve(f), 'none', GC.skin.line, 8.5);
  s += P(side > 0 ? PALM_R : PALM_L, GC.skin.base, GC.skin.line, LW);
  for (const f of [th, ...fs]) s += P(curve(f), 'none', GC.skin.base, 4.6);
  for (const f of [th, ...fs]) {
    const a = f[2], b = f[3], t = 0.55;
    const n0 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    s += P(`M${pt(n0)} L${pt(b)}`, 'none', GC.nail, 4.6);
  }
  return s;
}

// 머리 앞부분(얼굴 피부 + 눈 + 장막). look: 'turn'(정면을 똑바로) | 'down'(내려다보며 울먹임)
function head(pre, look) {
  const C = GC;
  let s = '';
  // 얼굴(틈으로만 보임)
  s += `<ellipse cx="4" cy="84" rx="48" ry="55" fill="${C.skin.base}"/>`;
  s += `<g clip-path="url(#${pre}gap)" filter="url(#${pre}b4)">` +
    `<ellipse cx="22" cy="58" rx="40" ry="20" fill="${C.skin.shade}"/><ellipse cx="38" cy="128" rx="10" ry="16" fill="${C.skin.mottle}" opacity="0.5"/>` +
    `<ellipse cx="12" cy="104" rx="7" ry="14" fill="${C.skin.mottle}" opacity="0.45"/></g>`;
  // 눈(크게 뜬 탁한 흰자 + 아주 작은 검은 동공)
  const down = look === 'down';
  const sclera = 'M14.5 83 C18 70 38 67 44.5 80 C40 92.5 22 95 14.5 83 Z';
  s += `<clipPath id="${pre}scl"><path d="${sclera}"/></clipPath>`;
  s += P('M11 92 C20 104 40 102 48 87', 'none', '#3c3650', 6, 'opacity="0.45"'); // 눈 밑 그늘
  s += P(sclera, C.eye, 'none');
  s += `<g clip-path="url(#${pre}scl)"><rect x="10" y="62" width="40" height="${down ? 15 : 9}" fill="#8a93a3" opacity="0.6"/></g>`;
  s += `<circle cx="${down ? 28.5 : 29.5}" cy="${down ? 86.5 : 81.5}" r="2.7" fill="#050506"/>`;
  if (down) {
    // 윗눈꺼풀을 조금 내리고 안쪽 눈꼬리를 올림(슬픔), 동공은 아래(내려다봄)
    s += `<g clip-path="url(#${pre}scl)">${P('M8 60 L52 60 L52 83 C40 74 24 72 12 79 Z', C.skin.shade)}</g>`;
    s += P('M13.5 80.5 C22 72 37 73 45.8 82.5', 'none', C.skin.line, 3.6);
    s += P('M17 89 C24 94 36 94 42 87', 'none', '#e9f0f6', 1.8, 'opacity="0.75"'); // 맺힌 눈물
    s += P('M22 93 C21 106 23 118 25 132', 'none', '#cfe0f2', 2.2, 'opacity="0.6"'); // 눈물 자국
  } else {
    s += P('M13.5 84 C18 69 38 65 45.5 80', 'none', C.skin.line, 3.4);
  }
  s += P('M18 71 C26 64 37 64 43 71', 'none', C.skin.line, 1.6, 'opacity="0.55"');
  s += P('M18 89 C25 95 37 94 43 84', 'none', C.skin.line, 1.6, 'opacity="0.7"');
  // 얼굴 장막(틈은 evenodd로 뚫음)
  s += P(CURTAIN_OUT + ' ' + GAP, C.hair.base, C.hair.line, LW, 'fill-rule="evenodd"');
  // 젖은 결: 가르마에서 흘러내리는 가닥 + 끊어진 광택
  const strands = [-50, -38, -26, -14, -4, 6, 46, 56].map((x, i) =>
    `M${f1(x * 0.3)} 8 Q${f1(x * 0.95)} 50 ${f1(x)} ${150 + (i % 3) * 8}`).join(' ');
  s += P(strands, 'none', C.hair.hi, 1.6, 'opacity="0.38"');
  s += P('M-46 40 Q-6 10 46 40', 'none', C.hair.hi, 7, 'opacity="0.5" stroke-dasharray="20 7 13 6 24 8 12"');
  s += P(streaks([[[-30, 54], [-31, 80], [-33, 104], [-36, 128]], [[52, 62], [54, 86], [55, 108], [57, 132]], [[-12, 70], [-12, 96], [-11, 120], [-13, 150]], [[-50, 60], [-52, 86], [-54, 110], [-56, 140]]], 3.4), C.hair.wet, 'none', 0, 'opacity="0.6"');
  // 틈 가장자리 그늘선(머리카락이 피부에 드리운 그림자)
  s += P('M24 36 C8 62 8 104 27 136', 'none', C.hair.shade, 3, 'opacity="0.8"');
  return s;
}

// opts.pre: id 접두어, opts.look: 'turn' | 'down', opts.tilt: 머리 기울기(도)
export function ghost({ pre = 'gh', look = 'turn', tilt = -4, headDy = 0, sway = 0, legEnd = '#707070', tint = '' } = {}) {
  const C = GC;
  const defs =
    `<filter id="${pre}b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${pre}b8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>` +
    `<clipPath id="${pre}gap"><path d="${GAP}"/></clipPath>` +
    `<clipPath id="${pre}arms"><path d="${ARM_R}"/><path d="${ARM_L}"/><path d="${PALM_R}"/><path d="${PALM_L}"/></clipPath>` +
    `<clipPath id="${pre}legs"><path d="${LEG_R}"/><path d="${LEG_L}"/><path d="${FOOT_R}"/><path d="${FOOT_L}"/></clipPath>` +
    `<clipPath id="${pre}skirt"><path d="${SKIRT}"/></clipPath>` +
    `<clipPath id="${pre}body">${[TORSO, SLEEVE_R, SLEEVE_L, ARM_R, ARM_L, PALM_R, PALM_L, SKIRT, LEG_R, LEG_L].map(d => `<path d="${d}"/>`).join('')}</clipPath>` +
    `<clipPath id="${pre}torso"><path d="${TORSO}"/><path d="${SLEEVE_R}"/><path d="${SLEEVE_L}"/></clipPath>` +
    // 무릎 아래가 어둠 속으로 사라지게(다리 부분만 흐려지는 마스크)
    `<linearGradient id="${pre}fadeG" gradientUnits="userSpaceOnUse" x1="0" y1="520" x2="0" y2="770">` +
    `<stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="#262626"/><stop offset="1" stop-color="${legEnd}"/></linearGradient>` +
    `<mask id="${pre}fade" maskUnits="userSpaceOnUse" x="-400" y="-300" width="800" height="1300">` +
    `<rect x="-400" y="-300" width="800" height="1300" fill="#fff"/><rect x="-62" y="512" width="124" height="400" fill="#000"/>` +
    `<rect x="-62" y="512" width="124" height="400" fill="url(#${pre}fadeG)"/></mask>`;
  let s = '';
  // 뒷머리(고개를 돌리는 쪽 반대로 끝이 살짝 처짐)
  s += `<g transform="skewX(${sway})">`;
  s += P(BACK_HAIR, C.hair.base, C.hair.line, LW);
  s += P('M70 90 C84 160 104 240 118 330 L126 392 L104 400 C100 320 92 230 66 130 Z M-70 90 C-84 160 -104 240 -118 330 L-128 390 L-106 398 C-102 320 -94 230 -66 130 Z', C.hair.shade, 'none', 0, 'opacity="0.9"');
  s += P('M60 120 C80 200 100 300 108 420 M-60 120 C-80 200 -100 300 -110 420 M46 160 C60 260 66 340 68 410 M-48 160 C-62 260 -68 340 -70 410', 'none', C.hair.hi, 1.6, 'opacity="0.3"');
  s += P(streaks([[[94, 210], [104, 250], [110, 290], [114, 330]], [[-98, 220], [-108, 260], [-114, 300], [-118, 344]], [[116, 340], [118, 360], [120, 380], [121, 400]]], 3.6), C.hair.wet, 'none', 0, 'opacity="0.5"');
  s += '</g>';
  // 다리(무릎 아래는 어둠 속으로)
  s += P(LEG_R, C.skin.base, C.skin.line, LW) + P(LEG_L, C.skin.base, C.skin.line, LW);
  s += P('M19 762 L19 752 M25 763 L25 753 M-19 762 L-19 752 M-25 763 L-25 753 M29 690 Q26 694 29 698 M-29 690 Q-26 694 -29 698', 'none', C.skin.line, 1.5, 'opacity="0.7"');
  s += P('M28 520 C28 600 25 650 24 690 L27 690 C30 650 32 600 32 520 Z', C.skin.shade, 'none', 0, 'opacity="0.7"');
  s += P('M-12 520 C-12 600 -14 650 -15 690 L-11 690 C-10 650 -8 600 -8 520 Z', C.skin.shade, 'none', 0, 'opacity="0.7"');
  // 팔(소매 밑에서 길게) + 얼룩덜룩한 푸른 회색
  s += P(ARM_R, C.skin.base, C.skin.line, LW) + P(ARM_L, C.skin.base, C.skin.line, LW);
  s += P('M90 240 C92 300 94 380 94 466 L97 466 C98 380 99 300 98 240 Z', C.skin.shade, 'none', 0, 'opacity="0.8"');
  s += P('M-76 240 C-79 300 -82 380 -84 466 L-88 466 C-87 380 -85 300 -82 240 Z', C.skin.shade, 'none', 0, 'opacity="0.8"');
  s += P('M84 352 Q90 356 95 352 M-84 352 Q-90 356 -95 352', 'none', C.skin.line, 1.6, 'opacity="0.6"'); // 팔꿈치
  s += hand(1) + hand(-1);
  s += `<g clip-path="url(#${pre}arms)" filter="url(#${pre}b8)" opacity="0.55">` +
    [[90, 300, 7, 18], [86, 410, 6, 14], [-88, 280, 6, 16], [-90, 390, 7, 20], [92, 490, 8, 10], [-92, 480, 7, 12]]
      .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${C.skin.mottle}"/>`).join('') + '</g>';
  // 블라우스(누렇게 바랜 반소매) + 물 얼룩
  s += P(TORSO, C.blouse.base, C.blouse.line, LW);
  s += P('M34 160 C52 163 70 171 82 186 L72 256 C66 282 62 306 60 338 L40 338 C46 290 52 240 54 190 Z', C.blouse.shade, 'none', 0, 'opacity="0.55"');
  s += `<g clip-path="url(#${pre}torso)" filter="url(#${pre}b4)" opacity="0.4">` +
    `<path d="M-30 268 C-44 260 -50 282 -40 296 C-30 308 -14 300 -18 286 C-20 276 -24 272 -30 268 Z" fill="${C.blouse.stain}"/>` +
    `<path d="M14 214 C4 214 2 232 12 240 C24 248 34 236 30 224 Z" fill="${C.blouse.stain}"/>` +
    `<path d="M20 300 C10 304 12 322 24 330 C36 334 44 318 36 306 Z" fill="${C.blouse.stain}"/></g>`;
  s += `<g clip-path="url(#${pre}torso)" opacity="0.45">` +
    P('M-30 268 C-44 260 -50 282 -40 296 C-30 308 -14 300 -18 286', 'none', C.blouse.stain, 2) +
    P('M14 214 C4 214 2 232 12 240 C24 248 34 236 30 224', 'none', C.blouse.stain, 2) + '</g>';
  s += P('M0 198 L0 336', 'none', C.blouse.line, 2, 'opacity="0.7"');
  s += `<circle cx="0" cy="246" r="3.2" fill="#e8e4d4" stroke="${C.blouse.line}" stroke-width="1.5"/><circle cx="0" cy="296" r="3.2" fill="#e8e4d4" stroke="${C.blouse.line}" stroke-width="1.5"/>`;
  s += P('M-60 338 C-30 330 30 330 60 338', 'none', C.blouse.line, 2, 'opacity="0.5"');
  // 소매(해진 끝단)
  s += P(SLEEVE_R, C.blouse.base, C.blouse.line, LW) + P(SLEEVE_L, C.blouse.shade, C.blouse.line, LW);
  s += P('M99 247 l2 9 M90 250 l1 10 M80 251 l0 9 M-99 247 l-2 9 M-90 250 l-1 10 M-80 251 l0 9', 'none', C.blouse.line, 1.4, 'opacity="0.7"');
  s += P('M86 196 C92 214 96 230 98 246', 'none', C.blouse.shade, 4, 'opacity="0.8"');
  // 깃 + 검붉은 작은 나비 리본
  s += P('M2 166 L32 158 L26 192 Z', C.blouse.base, C.blouse.line, 2.4) + P('M-2 166 L-32 158 L-26 192 Z', C.blouse.base, C.blouse.line, 2.4);
  s += P('M-1 194 L-12 218 L-5 220 L1 200 Z', C.ribbon.shade, C.ribbon.line, 2) + P('M1 194 L12 218 L5 220 L-1 200 Z', C.ribbon.shade, C.ribbon.line, 2);
  s += P('M0 188 C-8 176 -25 176 -25 188 C-25 200 -8 198 0 193 Z', C.ribbon.base, C.ribbon.line, 2.2) + P('M0 188 C8 176 25 176 25 188 C25 200 8 198 0 193 Z', C.ribbon.base, C.ribbon.line, 2.2);
  s += `<rect x="-5" y="183" width="10" height="12" rx="2" fill="${C.ribbon.shade}" stroke="${C.ribbon.line}" stroke-width="2"/>`;
  // 치마(무릎 길이, 남색·회색 체크 주름, 해진 단)
  s += P(SKIRT, C.skirt.base, C.skirt.line, LW);
  const pleats = [-45, -30, -15, 0, 15, 30, 45];
  let sk = '';
  for (let i = 0; i < pleats.length - 1; i += 2) {
    const a = pleats[i], b = pleats[i + 1];
    sk += P(`M${a} 334 L${b} 334 L${f1(b * 1.27)} 525 L${f1(a * 1.27)} 525 Z`, C.skirt.shade, 'none', 0, 'opacity="0.75"');
  }
  sk += `<rect x="-90" y="382" width="180" height="11" fill="${C.skirt.band}" opacity="0.55"/><rect x="-90" y="452" width="180" height="11" fill="${C.skirt.band}" opacity="0.55"/>`;
  for (const x of [-37, -7, 23]) sk += P(`M${x} 334 L${f1(x * 1.27)} 525`, 'none', C.skirt.band, 7, 'opacity="0.45"');
  sk += `<rect x="-90" y="334" width="180" height="12" fill="${C.skirt.shade}"/>`;
  s += `<g clip-path="url(#${pre}skirt)">${sk}</g>`;
  s += P(pleats.map(x => `M${x} 346 L${f1(x * 1.27)} 516`).join(' '), 'none', C.skirt.line, 1.8, 'opacity="0.8"');
  s += P('M-60 346 L60 346', 'none', C.skirt.line, 2);
  s += P('M-68 518 l-1 8 M-52 516 l1 9 M-36 519 l-1 7 M-18 516 l0 9 M2 519 l1 8 M20 516 l-1 9 M38 519 l1 7 M54 516 l0 9 M68 518 l1 8', 'none', C.skirt.band, 1.4, 'opacity="0.8"');
  // 역광 등으로 몸 앞면을 어둡게(선택)
  if (tint) s += `<rect x="-200" y="100" width="400" height="700" fill="${tint}" clip-path="url(#${pre}body)"/>`;
  // 머리카락이 블라우스에 드리운 그늘
  s += `<g clip-path="url(#${pre}torso)">` + P('M30 196 C34 230 36 280 37 340 L50 340 C50 260 46 200 40 150 Z M-31 196 C-36 230 -38 280 -40 340 L-52 340 C-52 260 -47 200 -41 150 Z', C.blouse.shade, 'none', 0, 'opacity="0.75"') + '</g>';
  // 머리(앞 다발 → 얼굴 장막)
  s += `<g transform="skewX(${sway * 0.6})">`;
  s += P(LOCK_R, C.hair.base, C.hair.line, LW) + P(LOCK_L, C.hair.base, C.hair.line, LW);
  s += P('M50 170 C56 260 58 340 62 420 M-52 170 C-58 260 -60 340 -63 420', 'none', C.hair.hi, 1.6, 'opacity="0.35"');
  s += P(streaks([[[64, 190], [67, 230], [69, 270], [71, 316]], [[-46, 214], [-47, 250], [-47, 290], [-48, 330]], [[72, 330], [73, 350], [74, 370], [75, 396]], [[-49, 350], [-50, 370], [-50, 390], [-51, 412]]], 3.6), C.hair.wet, 'none', 0, 'opacity="0.62"');
  s += '</g>';
  s += `<g transform="translate(0 ${headDy}) rotate(${tilt} 0 120)">${head(pre, look)}</g>`;
  // 실루엣(후광·테두리 빛용): 몸과 같은 변형을 적용
  const sil = attr => `<path transform="skewX(${sway})" d="${BACK_HAIR}" ${attr}/>` +
    [TORSO, SLEEVE_R, SLEEVE_L, ARM_R, ARM_L, PALM_R, PALM_L, SKIRT, LEG_R, LEG_L, FOOT_R, FOOT_L].map(d => `<path d="${d}" ${attr}/>`).join('') +
    `<path transform="skewX(${sway * 0.6})" d="${LOCK_R}" ${attr}/><path transform="skewX(${sway * 0.6})" d="${LOCK_L}" ${attr}/>` +
    `<path transform="translate(0 ${headDy}) rotate(${tilt} 0 120)" d="${CURTAIN_OUT}" ${attr}/>`;
  return { defs, svg: s, sil, mask: `url(#${pre}fade)` };
}

// ---------------------------------------------------------------- 장면
// 한 점 투시: 소실점 VP, 귀신이 있는 깊이(s=1)에서의 통로 단면 L·R·T·B
const VP = [420, 680];
const at = (s, x, y) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
const c = (s, x, y) => pt(at(s, x, y));
const quad = (a, b, d, e) => `M${a} L${b} L${d} L${e} Z`;
const L = 150, R = 930, T = 250, B = 1450, SF = 0.3, SN = 3;
const GX = 585, GY = 392, GK = 1.18; // 귀신 정수리 위치·배율
const PIPE_Y = 298, PIPE_R = 22;
const INK = '#020306';

export function draw() {
  const g = ghost({ pre: 'ghA', look: 'turn', tilt: -4, sway: -1.6, tint: 'url(#ghTint)' });
  const defs = g.defs +
    `<linearGradient id="ghTint" gradientUnits="userSpaceOnUse" x1="0" y1="170" x2="0" y2="620"><stop offset="0" stop-color="#16233f" stop-opacity="0.05"/><stop offset="1" stop-color="#16233f" stop-opacity="0.5"/></linearGradient>` +
    `<radialGradient id="ghLight" cx="${GX}" cy="800" r="560" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#88acdf" stop-opacity="0.6"/><stop offset="0.32" stop-color="#4f6fa0" stop-opacity="0.28"/><stop offset="0.7" stop-color="#1c2944" stop-opacity="0.07"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="ghVig" cx="${GX - 30}" cy="760" r="920" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0.3" stop-color="#000" stop-opacity="0"/><stop offset="0.66" stop-color="#000" stop-opacity="0.66"/><stop offset="1" stop-color="#000" stop-opacity="0.97"/></radialGradient>` +
    `<linearGradient id="ghBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></linearGradient>` +
    `<linearGradient id="ghTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="ghEdge" x1="0" y1="0" x2="0" y2="1"><stop offset="0.1" stop-color="#030406"/><stop offset="0.52" stop-color="#2a374e"/><stop offset="0.9" stop-color="#030406"/></linearGradient>` +
    `<filter id="ghB30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="ghB14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>`;

  let s = `<rect width="1024" height="1536" fill="#040508"/>`;
  // 통로 면(천장·벽·바닥·막다른 벽)
  const ceil = quad(c(SF, L, T), c(SF, R, T), c(SN, R, T), c(SN, L, T));
  const wallL = quad(c(SF, L, T), c(SF, L, B), c(SN, L, B), c(SN, L, T));
  const wallR = quad(c(SF, R, T), c(SF, R, B), c(SN, R, B), c(SN, R, T));
  const floor = quad(c(SF, L, B), c(SF, R, B), c(SN, R, B), c(SN, L, B));
  const far = quad(c(SF, L, T), c(SF, R, T), c(SF, R, B), c(SF, L, B));
  s += P(ceil, '#0a0d13', INK, 3) + P(wallL, '#0b0e15', INK, 3) + P(wallR, '#0d1119', INK, 3) + P(floor, '#08090e', INK, 3) + P(far, '#0a0d13', INK, 3);
  // 콘크리트 거푸집 이음선·폼타이 구멍
  let seams = '';
  for (const sd of [0.4, 0.52, 0.68, 0.9, 1.22, 1.7, 2.4]) {
    seams += `M${c(sd, L, T)} L${c(sd, L, B)} M${c(sd, R, T)} L${c(sd, R, B)} M${c(sd, L, T)} L${c(sd, R, T)} `;
  }
  for (const y of [540, 830, 1120]) seams += `M${c(SF, L, y)} L${c(SN, L, y)} M${c(SF, R, y)} L${c(SN, R, y)} `;
  s += P(seams, 'none', '#030407', 2.5);
  let holes = '';
  for (const sd of [0.46, 0.6, 0.79, 1.06, 1.46, 2.05]) for (const y of [395, 685, 975, 1265]) {
    for (const x of [L, R]) { const p = at(sd, x, y); holes += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${f1(3.4 * sd)}" fill="#030407"/>`; }
  }
  s += holes;
  // 벽을 타고 흘러내린 물 얼룩, 바닥의 젖은 자국
  s += P(`M${c(1.1, R, T)} L${c(1.1, R, 700)} L${c(1.16, R, 860)} L${c(1.22, R, 760)} L${c(1.26, R, T)} Z M${c(0.7, R, T)} L${c(0.7, R, 600)} L${c(0.74, R, 660)} L${c(0.77, R, T)} Z M${c(0.9, L, T)} L${c(0.9, L, 560)} L${c(0.95, L, 610)} L${c(0.98, L, T)} Z`, '#05070a', 'none', 0, 'opacity="0.7"');
  // 막다른 곳의 잠긴 철문(걸쇠 + 자물쇠)
  const d0 = at(SF, 200, B), d1 = at(SF, 480, 680);
  const dw = d1[0] - d0[0], dh = d0[1] - d1[1];
  s += `<rect x="${f1(d0[0] - 5)}" y="${f1(d1[1] - 5)}" width="${f1(dw + 10)}" height="${f1(dh + 5)}" fill="#06080b"/>`;
  s += `<rect x="${f1(d0[0])}" y="${f1(d1[1])}" width="${f1(dw)}" height="${f1(dh)}" fill="#161d27" stroke="${INK}" stroke-width="2.5"/>`;
  s += `<rect x="${f1(d0[0] + 7)}" y="${f1(d1[1] + 10)}" width="${f1(dw - 14)}" height="${f1(dh * 0.36)}" fill="none" stroke="#080a0f" stroke-width="2"/>`;
  s += `<rect x="${f1(d0[0] + 7)}" y="${f1(d1[1] + dh * 0.5)}" width="${f1(dw - 14)}" height="${f1(dh * 0.44)}" fill="none" stroke="#080a0f" stroke-width="2"/>`;
  const hy = d1[1] + dh * 0.47;
  s += `<rect x="${f1(d1[0] - 22)}" y="${f1(hy - 3)}" width="28" height="6" fill="#465061" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<path d="M${f1(d1[0] - 15)} ${f1(hy + 3)} a5 5 0 0 1 10 0" fill="none" stroke="#5f6a7b" stroke-width="2"/><rect x="${f1(d1[0] - 17)}" y="${f1(hy + 3)}" width="14" height="12" rx="2" fill="#5d6576" stroke="${INK}" stroke-width="1.5"/>`;
  // 귀신의 빛을 받은 면(가산 합성)
  s += `<rect width="1024" height="1536" fill="url(#ghLight)" style="mix-blend-mode:screen"/>`;
  s += `<ellipse cx="${GX}" cy="1395" rx="220" ry="40" fill="#7e9fcc" opacity="0.3" filter="url(#ghB14)"/>`;
  s += `<ellipse cx="${GX}" cy="1395" rx="110" ry="18" fill="#a9c2e6" opacity="0.25" filter="url(#ghB14)"/>`;
  // 천장 배관(통로를 따라 길게) + 받침쇠 + 아래쪽 반사광
  s += P(quad(c(SF, GX, PIPE_Y - PIPE_R), c(SN, GX, PIPE_Y - PIPE_R), c(SN, GX, PIPE_Y + PIPE_R), c(SF, GX, PIPE_Y + PIPE_R)), '#232a37', INK, 3);
  s += P(`M${c(SF, GX, PIPE_Y + 6)} L${c(SN, GX, PIPE_Y + 6)}`, 'none', '#141922', 9);
  s += P(`M${c(SF, GX, PIPE_Y + PIPE_R - 4)} L${c(SN, GX, PIPE_Y + PIPE_R - 4)}`, 'none', '#86a7d6', 4, 'opacity="0.7"');
  for (const sd of [0.45, 0.62, 1.3, 1.9]) {
    s += P(quad(c(sd, GX - 7, T), c(sd, GX + 7, T), c(sd, GX + 7, PIPE_Y - PIPE_R), c(sd, GX - 7, PIPE_Y - PIPE_R)), '#1b212b', INK, 2);
    s += P(quad(c(sd - 0.02, GX, PIPE_Y - PIPE_R - 3), c(sd + 0.02, GX, PIPE_Y - PIPE_R - 3), c(sd + 0.02, GX, PIPE_Y + PIPE_R + 3), c(sd - 0.02, GX, PIPE_Y + PIPE_R + 3)), '#323b4c', INK, 2);
  }
  // 오래되어 해진 밧줄: 배관에서 내려와 긴 머리카락 뒤로 사라짐
  const rx = GX + 3, rTop = PIPE_Y - PIPE_R - 1, rBot = GY + 46;
  s += P(`M${rx - 7} ${rTop} L${rx + 7} ${rTop} L${rx + 8} ${PIPE_Y + PIPE_R + 1} L${rx - 6} ${PIPE_Y + PIPE_R + 1} Z`, '#4f4e4a', INK, 2.5);
  s += P(`M${rx - 6} ${PIPE_Y + PIPE_R} L${rx + 6} ${PIPE_Y + PIPE_R} L${rx + 5.5} ${rBot} L${rx - 5.5} ${rBot} Z`, '#5a5953', INK, 2.5);
  let tw = '';
  for (let y = PIPE_Y + PIPE_R + 6; y < rBot - 4; y += 9) tw += `M${rx - 4.5} ${y + 4} L${rx + 4.5} ${y - 2} `;
  s += P(tw, 'none', '#23231f', 1.7, 'opacity="0.85"');
  s += P(`M${rx + 5} ${PIPE_Y + 40} l9 5 M${rx - 5} ${PIPE_Y + 58} l-8 7 M${rx + 5} ${PIPE_Y + 74} l7 -2 M${rx - 6} ${PIPE_Y + 30} l-6 -5 M${rx + 6} ${PIPE_Y + 86} l5 6`, 'none', '#6a675e', 1.4);
  s += P(`M${rx - 2} ${PIPE_Y + PIPE_R + 2} L${rx - 2} ${rBot - 6}`, 'none', '#9cb3d6', 1.6, 'opacity="0.45"');
  // 귀신: 뒤쪽 후광 → 몸
  s += `<g transform="translate(${GX} ${GY}) scale(${GK})"><g mask="${g.mask}">`;
  s += `<g filter="url(#ghB30)" opacity="0.5">${g.sil('fill="#7da6dc"')}</g>`;
  s += `<g opacity="0.5">${g.sil('fill="none" stroke="#a9c6ec" stroke-width="5" stroke-linejoin="round"')}</g>`;
  s += g.svg;
  s += `</g></g>`;
  // 비네트 + 위·아래 가장자리 어둡게(아래 10%는 비움)
  s += `<rect width="1024" height="1536" fill="url(#ghVig)"/>`;
  s += `<rect y="1300" width="1024" height="236" fill="url(#ghBot)"/>`;
  s += `<rect width="1024" height="220" fill="url(#ghTop)"/>`;
  // 앞쪽 벽 모서리(그림 왼쪽을 막음): 통로 쪽으로 꺾인 면만 귀신의 빛을 희미하게 받음
  s += P('M0 0 L118 0 L118 1536 L0 1536 Z', '#020304');
  s += P('M118 0 L150 0 L150 1536 L118 1536 Z', 'url(#ghEdge)', INK, 3);
  s += P('M150 330 L150 1180', 'none', '#86a6d6', 2.5, 'opacity="0.45"');
  s += P('M150 610 l-8 14 l5 16 l3 4 M150 1010 l-7 9 l7 8 M150 420 l-5 6 l5 5', '#020304', INK, 2);
  s += P('M126 520 l10 3 M130 760 l12 -2 M124 880 l9 4', 'none', '#04060a', 2);
  return K.svg(s, { defs });
}
