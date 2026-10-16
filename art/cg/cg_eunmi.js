// cg_eunmi — 3장 신관 중앙홀(가운데가 4층까지 뚫린 아트리움) 1층. 은미(중년 여성, 성아 어머니)가 두 손으로 머리를 쥐어뜯으며 비명을 지른다.
// 길고 헝클어진 검은 머리(한쪽 눈가를 가림), 잿빛 창백한 피부, 바랜 탁한 자주색 카디건 + 짙은 블라우스, 발목까지 오는 검은 긴 치마, 맨발.
// 뒤로는 층마다 난간이 둘린 아트리움이 위로 솟고 꼭대기 천창의 달빛이 그녀 위로 떨어진다. 앞 바닥엔 쓰러진 수위(손달수)의 어두운 실루엣,
// 떨어진 챙 모자, 바닥을 구르며 그녀의 발치를 비추는 손전등.
// 은미 머리(eunmiHead)·색(EM)은 cg_fall 이 같이 쓴다.
import * as K from '../kit.js';
import { taper } from './cg_hanging.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#050508';
const ID = 'em';

export const EM = {
  skin: { base: '#b3b5b4', shade: '#82878b', deep: '#596068', line: '#211c20', lip: '#5c4850' },
  hair: { base: '#0b0b0e', shade: '#040405', hi: '#5d677c', line: '#020203' },
  card: { base: '#5a4962', shade: '#3e3146', light: '#7b6a85', line: '#160f1a', rib: '#4a3b52' },
  blouse: { base: '#2a2930', line: '#0c0b0f' },
  skirt: { base: '#1b1a22', shade: '#0f0f15', light: '#34333f', line: '#06060a' },
};

// ---------------------------------------------------------------- 은미 머리(지역 좌표: 얼굴 가운데 0,0 · 정수리 y≈-78 · 턱 y≈+70)
// expr: 'scream'(눈 크게, 입 크게 벌림) | 'fall'(공포로 일그러짐, 입 벌림, 눈 위로)
export function eunmiHead(pre, expr = 'scream') {
  const S = EM.skin, H = EM.hair;
  let s = '';
  const FACE = 'M-50 -18 C-52 -58 -28 -80 2 -80 C32 -80 54 -58 52 -18 C51 12 44 40 30 58 C20 70 10 74 0 74 C-12 74 -22 68 -32 56 C-44 40 -50 12 -50 -18 Z';
  // 목(힘줄이 선 채)
  s += P('M-22 50 L-26 108 L26 108 L22 50 Z', S.base, S.line, 3);
  s += P('M-22 50 C-10 70 10 72 22 52 L24 74 C10 86 -10 86 -24 72 Z', S.shade, 'none', 0, 'opacity="0.8"'); // 턱 밑 그늘
  s += P('M-12 76 L-15 104 M12 76 L13 104', 'none', S.deep, 1.8, 'opacity="0.6"');
  s += P(FACE, `url(#${pre}face)`, S.line, 3.5);
  s += `<clipPath id="${pre}fc"><path d="${FACE}"/></clipPath><g clip-path="url(#${pre}fc)">`;
  // 꺼진 볼·광대 아래 그늘, 눈두덩·다크서클
  s += `<g filter="url(#${pre}b3)" opacity="0.6"><ellipse cx="-32" cy="28" rx="12" ry="22" fill="${S.deep}"/><ellipse cx="34" cy="28" rx="12" ry="22" fill="${S.deep}"/>` +
    `<ellipse cx="-20" cy="-8" rx="20" ry="13" fill="${S.deep}"/><ellipse cx="22" cy="-8" rx="20" ry="13" fill="${S.deep}"/></g>`;
  s += P('M30 -60 C50 -30 52 20 30 58 L60 60 L60 -60 Z', S.shade, 'none', 0, 'opacity="0.35"');
  s += '</g>';
  // 이마 주름(치켜든 눈썹 때문에 물결)
  s += P('M-26 -46 C-14 -52 -4 -48 4 -52 C14 -56 22 -50 30 -52 M-22 -38 C-12 -42 -2 -38 6 -42 C16 -45 22 -40 28 -42', 'none', S.line, 1.6, 'opacity="0.7"');
  // 눈: 크게 뜬 흰자 + 아주 작은 동공, 처진 다크서클
  const up = expr === 'fall' ? -3 : 0;
  for (const sd of [-1, 1]) {
    const ex = sd * 20, ey = -8;
    const eye = `M${ex - 14} ${ey + 2} C${ex - 9} ${ey - 10} ${ex + 9} ${ey - 10} ${ex + 14} ${ey + 1} C${ex + 9} ${ey + 10} ${ex - 9} ${ey + 10} ${ex - 14} ${ey + 2} Z`;
    s += P(eye, '#dcdad2', S.line, 2.2);
    s += `<circle cx="${ex + sd * 1}" cy="${ey + up}" r="3.6" fill="#141012"/>`;
    s += P(`M${ex - 15} ${ey + 1} C${ex - 9} ${ey - 12} ${ex + 9} ${ey - 12} ${ex + 15} ${ey}`, 'none', '#0c090b', 3);
    s += P(`M${ex - 12} ${ey + 13} C${ex - 4} ${ey + 18} ${ex + 6} ${ey + 18} ${ex + 13} ${ey + 12}`, 'none', S.line, 1.5, 'opacity="0.7"'); // 눈밑 주름
    // 눈썹: 안쪽 끝이 치켜 올라간 괴로운 눈썹
    s += P(`M${ex - sd * 12} ${ey - 20} C${ex - sd * 4} ${ey - 24} ${ex + sd * 6} ${ey - 22} ${ex + sd * 16} ${ey - 14}`, 'none', '#1d1a1c', 3.4);
  }
  // 코 · 팔자 주름 · 크게 벌린 입(비명)
  s += P('M0 0 C-2 12 -5 20 -8 25 C-4 29 4 29 8 25', 'none', S.line, 2.2);
  s += P('M-12 24 C-22 34 -26 46 -24 60 M12 24 C22 34 26 46 24 60', 'none', S.line, 1.8, 'opacity="0.8"');
  const mo = expr === 'fall' ? 'M-13 36 C-12 30 12 30 13 36 C15 50 9 62 0 63 C-9 62 -15 50 -13 36 Z' : 'M-16 34 C-14 27 14 27 16 34 C19 52 11 68 0 69 C-11 68 -19 52 -16 34 Z';
  s += P(mo, '#1a0a0f', S.line, 2.6);
  s += P(expr === 'fall' ? 'M-9 33 L9 33 L8 37 L-8 37 Z' : 'M-11 31 L11 31 L10 36 L-10 36 Z', '#c9c4b8', 'none', 0, 'opacity="0.85"'); // 윗니
  s += `<ellipse cx="0" cy="${expr === 'fall' ? 56 : 60}" rx="8" ry="5" fill="#4a1a22"/>`; // 혀
  s += P(mo, 'none', S.lip, 1.4, 'opacity="0.8"');
  // 얼굴 위 헝클어진 머리: 정수리 + 얼굴 오른쪽(그림 왼쪽) 눈가를 덮는 다발 + 흩날리는 잔머리
  s += P('M2 -84 C-34 -86 -58 -66 -60 -30 C-62 0 -58 30 -50 60 L-36 62 C-42 34 -44 4 -40 -22 C-36 -50 -18 -66 4 -70 C22 -68 40 -56 48 -34 C52 -10 52 20 46 52 L58 54 C64 20 66 -14 60 -40 C52 -70 30 -86 2 -84 Z', H.base, H.line, 3);
  s += P('M-40 -56 C-30 -40 -26 -20 -30 0 C-32 14 -24 28 -16 40 L-24 44 C-34 30 -40 14 -40 0 C-42 -16 -46 -36 -50 -48 Z', H.base, H.line, 2.2); // 눈가를 가린 다발
  s += P('M-8 -70 C-14 -54 -24 -40 -34 -30 M10 -72 C20 -58 30 -46 40 -40 M-20 -68 C-30 -60 -40 -46 -46 -30', 'none', H.base, 3.4);
  s += P('M-48 -40 C-40 -20 -36 0 -34 20 M42 -50 C50 -30 52 -6 50 20', 'none', H.hi, 1.4, 'opacity="0.5"');
  // 잔머리(제멋대로 뻗침)
  s += P('M-30 -80 C-44 -98 -40 -112 -54 -120 M-10 -84 C-10 -104 2 -116 -4 -132 M16 -82 C26 -100 22 -112 36 -124 M36 -74 C52 -86 62 -84 74 -98 M-46 -66 C-64 -74 -70 -90 -86 -92 M50 -60 C68 -62 78 -54 92 -62',
    'none', H.base, 2.2);
  s += P('M-56 -20 C-70 -10 -72 6 -84 14 M58 -16 C72 -8 76 8 88 12', 'none', H.base, 2);
  return s;
}
// 뒷머리 덩어리(머리 뒤에서 허리까지 헝클어져 늘어짐) — 같은 지역 좌표
export function eunmiBackHair() {
  const H = EM.hair;
  let s = P('M0 -88 C-50 -90 -78 -60 -82 -20 C-90 40 -110 100 -120 170 C-128 230 -122 290 -130 340 L-104 320 L-96 356 L-80 318 L-66 350 L-52 300 L52 300 L66 350 L80 318 L96 356 L104 320 L130 340 C122 290 128 230 120 170 C110 100 90 40 82 -20 C78 -60 50 -90 0 -88 Z', H.base, H.line, 3);
  s += P('M-74 0 C-88 80 -104 180 -112 300 M74 0 C88 80 104 180 112 300 M-50 40 C-60 120 -66 220 -70 300 M50 40 C60 120 66 220 70 300', 'none', H.hi, 1.4, 'opacity="0.3"');
  // 삐친 가닥
  s += P('M-84 -10 C-110 -4 -124 16 -146 18 M-100 120 C-124 128 -134 150 -156 156 M86 -10 C112 -2 124 20 148 24 M104 130 C128 136 140 160 162 166', 'none', H.base, 2.4);
  return s;
}
export const headDefs = pre =>
  `<filter id="${pre}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
  `<radialGradient id="${pre}face" cx="0.6" cy="0.62" r="0.8"><stop offset="0" stop-color="#cfd0cc"/><stop offset="0.6" stop-color="${EM.skin.base}"/><stop offset="1" stop-color="${EM.skin.shade}"/></radialGradient>`;

// ---------------------------------------------------------------- 아트리움(한 점 투시, 카메라 높이 1.0 m)
const F = 900, VX = 512, VY = 700, CAMH = 1.0;
const pr = (x, y, z) => [VX + F * x / z, VY - F * (y - CAMH) / z];
const AW = 3.6, ZF = 14, FH = 3.6; // 아트리움 반폭, 맞은편 벽 깊이, 층 높이

function atrium() {
  let s = `<rect width="1024" height="1536" fill="#07080c"/>`;
  // 맞은편 벽(층마다: 슬래브 띠 · 난간 · 복도 안쪽 문/창)
  const fw = (x0, x1, y0, y1, col) => P(poly([pr(x0, y0, ZF), pr(x1, y0, ZF), pr(x1, y1, ZF), pr(x0, y1, ZF)]), col);
  s += fw(-AW - 3, AW + 3, 0, FH * 4 + 2, '#0d1017');
  for (let f = 0; f < 4; f++) {
    const y = f * FH;
    // 복도 안쪽 벽의 문·창(어두움)
    for (let x = -AW + 0.5; x < AW - 0.5; x += 1.6) s += fw(x, x + 0.9, y + 0.2, y + 2.4, f === 0 ? '#14171f' : '#0a0c11');
    if (f > 0) {
      s += fw(-AW - 3, AW + 3, y - 0.35, y + 0.05, '#1c212b'); // 슬래브 단면
      s += P(`M${pt(pr(-AW - 3, y - 0.35, ZF))} L${pt(pr(AW + 3, y - 0.35, ZF))}`, 'none', '#05060a', 2);
      s += railing(-AW - 3, AW + 3, y + 0.05, ZF, ZF, 'front');
    }
  }
  // 옆 복도(양쪽): 층마다 슬래브 밑면(올려다봄) + 난간이 맞은편으로 모임
  for (const sd of [-1, 1]) {
    const X = sd * AW;
    s += P(poly([pr(X, 0, 3), pr(X, FH * 4 + 2, 3), pr(X, FH * 4 + 2, ZF), pr(X, 0, ZF)]), sd < 0 ? '#0b0d13' : '#0a0c11');
    for (let f = 1; f < 4; f++) {
      const y = f * FH;
      s += P(poly([pr(X, y - 0.35, 3), pr(X + sd * 3, y - 0.35, 3), pr(X + sd * 3, y - 0.35, ZF), pr(X, y - 0.35, ZF)]), '#12161e'); // 밑면
      s += P(poly([pr(X, y - 0.35, 3), pr(X, y + 0.05, 3), pr(X, y + 0.05, ZF), pr(X, y - 0.35, ZF)]), '#1b2029', INK, 1.5); // 슬래브 단면
      s += railing(X, X, y + 0.05, 3, ZF, 'side');
    }
    // 기둥
    for (const z of [6, 10]) s += P(poly([pr(X - sd * 0.0, 0, z), pr(X + sd * 0.5, 0, z), pr(X + sd * 0.5, FH * 4, z), pr(X, FH * 4, z)]), '#141922', INK, 2);
  }
  // 바닥(1층 홀): 반들한 돌 타일
  s += P(poly([pr(-AW - 3, 0, 1.0), pr(AW + 3, 0, 1.0), pr(AW + 3, 0, ZF), pr(-AW - 3, 0, ZF)]), `url(#${ID}floor)`);
  let g = '';
  for (let x = -6; x <= 6; x += 1.2) g += `M${pt(pr(x, 0, ZF))} L${pt(pr(x, 0, 0.9))} `;
  for (const z of [1.3, 1.8, 2.5, 3.5, 5, 7.5, 11]) g += `M${pt(pr(-8, 0, z))} L${pt(pr(8, 0, z))} `;
  s += P(g, 'none', '#1e2430', 2, 'opacity="0.7"');
  // 천창 달빛: 위에서 그녀 쪽으로 떨어지는 빛기둥 + 바닥의 빛 웅덩이
  s += `<g filter="url(#${ID}b24)"><path d="M330 -40 L660 -40 L640 1420 L300 1420 Z" fill="url(#${ID}shaft)"/></g>`;
  s += `<ellipse cx="470" cy="1420" rx="260" ry="40" fill="#a8bce0" opacity="0.22" filter="url(#${ID}b12)"/>`;
  return s;
}
// 난간: 위 손잡이 + 아래 띠 + 세로 살
function railing(x0, x1, y, z0, z1, kind) {
  let s = '';
  const top = (x, z) => pr(x, y + 1.05, z), bot = (x, z) => pr(x, y + 0.08, z);
  if (kind === 'front') {
    s += P(`M${pt(top(x0, z0))} L${pt(top(x1, z0))}`, 'none', '#5d6878', 4);
    s += P(`M${pt(bot(x0, z0))} L${pt(bot(x1, z0))}`, 'none', '#2a313c', 3);
    let b = '';
    for (let x = x0; x <= x1; x += 0.18) b += `M${pt(top(x, z0))} L${pt(bot(x, z0))} `;
    s += P(b, 'none', '#262c36', 1.6);
  } else {
    s += P(`M${pt(top(x0, z0))} L${pt(top(x0, z1))}`, 'none', '#5d6878', 5);
    s += P(`M${pt(bot(x0, z0))} L${pt(bot(x0, z1))}`, 'none', '#2a313c', 3);
    let b = '';
    for (let z = z0; z <= z1; z *= 1.06) b += `M${pt(top(x0, z))} L${pt(bot(x0, z))} `;
    s += P(b, 'none', '#262c36', 1.8);
  }
  return s;
}

// ---------------------------------------------------------------- 은미(무릎 아래까지 크게, 두 주먹으로 머리채를 움켜쥐고 잡아 뜯음)
// 지역 좌표: 얼굴 가운데 (0,0), 정수리 -80, 턱 +74, 발 +1000 — 화면에는 (EX, EY)에 EK 배율로
const EX = 452, EY = 336, EK = 1.13;
function eunmi() {
  const C = EM.card, B = EM.blouse, K2 = EM.skirt, S = EM.skin, H = EM.hair;
  let s = '';
  s += eunmiBackHair();
  // 치마: 허리에서 발목까지, 걸음에 살짝 흔들린 주름
  s += P('M-66 330 C-82 480 -104 680 -134 858 C-90 874 90 874 138 858 C110 680 86 480 66 330 Z', K2.base, K2.line, 3.5);
  s += P('M40 340 C62 480 88 680 114 862 L138 858 C110 680 86 480 66 330 Z', K2.shade, 'none', 0, 'opacity="0.9"');
  s += P('M-30 380 C-42 520 -54 690 -72 866 M4 370 C6 520 6 690 2 870 M34 380 C46 520 62 690 78 868', 'none', K2.line, 2.5, 'opacity="0.9"');
  s += P('M-14 400 C-20 540 -28 700 -38 864', 'none', K2.light, 3.5, 'opacity="0.45"');
  s += P('M-134 858 C-90 874 90 874 138 858', 'none', K2.light, 2.5, 'opacity="0.5"');
  // 맨발
  for (const [x, sd] of [[-46, -1], [46, 1]]) {
    s += P(`M${x - 24} 858 C${x - 30} 874 ${x - 28} 890 ${x - 14} 896 C${x} 900 ${x + 18} 900 ${x + 28} 892 C${x + 32} 882 ${x + 28} 868 ${x + 24} 858 Z`, S.shade, S.line, 3);
    s += P(`M${x - 10} 896 l0 -8 M${x} 898 l0 -9 M${x + 10} 897 l0 -9 M${x + 19} 894 l0 -7`, 'none', S.line, 1.5, 'opacity="0.8"');
  }
  // 블라우스(짙은 회색, 동그란 깃)
  s += P('M-34 96 L34 96 C40 200 46 280 48 340 L-48 340 C-46 280 -40 200 -34 96 Z', B.base, B.line, 3);
  s += P('M-24 98 C-14 114 14 114 24 98', 'none', '#4d4b55', 3);
  for (const y of [170, 220, 270]) s += `<circle cx="0" cy="${y}" r="4" fill="#4d4b55"/>`;
  // 카디건 몸판(팔을 들어 어깨가 치켜 올라가고 앞이 벌어짐, 엉덩이 아래까지 늘어짐)
  for (const sd of [-1, 1]) {
    const X = v => f1(sd * v);
    s += P(`M${X(22)} 92 C${X(48)} 98 ${X(76)} 106 ${X(94)} 120 C${X(104)} 180 ${X(96)} 260 ${X(86)} 330 C${X(90)} 380 ${X(96)} 430 ${X(98)} 470 L${X(34)} 478 C${X(38)} 420 ${X(40)} 340 ${X(36)} 260 C${X(32)} 200 ${X(28)} 150 ${X(22)} 92 Z`, sd < 0 ? C.base : C.shade, C.line, 3.5);
    s += P(`M${X(34)} 470 L${X(98)} 462 L${X(100)} 476 L${X(34)} 486 Z`, C.rib, C.line, 2);
    s += P(`M${X(30)} 130 C${X(38)} 240 ${X(40)} 360 ${X(36)} 478`, 'none', C.rib, 4, 'opacity="0.9"');
    for (const y of [190, 260, 330]) s += `<circle cx="${X(44)}" cy="${y}" r="4.5" fill="#251c2b" stroke="${C.line}" stroke-width="1.5"/>`;
    s += P(`M${X(66)} 170 C${X(72)} 260 ${X(70)} 360 ${X(74)} 460`, 'none', sd < 0 ? C.light : C.base, 2.5, 'opacity="0.5"');
    s += P(`M${X(56)} 140 C${X(62)} 150 ${X(66)} 166 ${X(66)} 180 M${X(80)} 300 C${X(70)} 304 ${X(60)} 300 ${X(52)} 292`, 'none', C.line, 2, 'opacity="0.7"'); // 늘어진 니트 주름
  }
  // 팔(소매): 어깨 → 팔꿈치(바깥 위) → 손목(머리 옆, 머리채를 쥔 주먹)
  for (const sd of [-1, 1]) {
    const X = v => sd * v, col = sd < 0 ? C.base : C.shade;
    const upper = `M${X(70)} 112 C${X(100)} 92 ${X(140)} 60 ${X(168)} 22 L${X(200)} 44 C${X(176)} 90 ${X(140)} 136 ${X(102)} 162 Z`;
    const fore = `M${X(168)} 22 C${X(150)} -10 ${X(124)} -36 ${X(102)} -52 L${X(84)} -26 C${X(110)} -4 ${X(150)} 30 ${X(200)} 44 Z`;
    s += P(upper, col, C.line, 3.5) + P(fore, col, C.line, 3.5);
    s += P(`M${X(106)} 120 C${X(130)} 100 ${X(150)} 76 ${X(166)} 50 M${X(176)} 30 C${X(160)} 10 ${X(140)} -10 ${X(118)} -26`, 'none', sd < 0 ? C.light : C.base, 2.5, 'opacity="0.55"');
    s += P(`M${X(186)} 30 C${X(192)} 36 ${X(196)} 40 ${X(200)} 44`, 'none', C.line, 2.5); // 팔꿈치 접힘
    s += P(`M${X(84)} -26 L${X(102)} -52 L${X(92)} -60 L${X(72)} -34 Z`, C.rib, C.line, 2.5); // 소맷부리
  }
  for (const sd of [-1, 1]) s += P(`M${sd * 200} 40 C${sd * 176} 10 ${sd * 140} -18 ${sd * 104} -46 M${sd * 96} 122 C${sd * 130} 98 ${sd * 156} 66 ${sd * 172} 36`, 'none', '#b9c8e6', 2.5, 'opacity="0.55"'); // 천창 달빛 테두리
  // 머리(얼굴) — 머리채가 주먹 쪽으로 팽팽히 당겨짐
  s += eunmiHead(ID, 'scream');
  s += P('M-52 -64 C-36 -86 -10 -94 14 -92 C36 -90 52 -78 60 -60', 'none', '#9fb2d6', 3, 'opacity="0.5" stroke-dasharray="26 10 40 12 20"');
  for (const sd of [-1, 1]) {
    const X = v => sd * v;
    s += P(`M${X(24)} -76 C${X(44)} -74 ${X(60)} -66 ${X(76)} -60 M${X(16)} -80 C${X(40)} -82 ${X(62)} -76 ${X(80)} -70 M${X(34)} -66 C${X(52)} -62 ${X(66)} -56 ${X(78)} -52`, 'none', H.base, 5);
    s += P(`M${X(30)} -78 C${X(48)} -76 ${X(62)} -70 ${X(76)} -64`, 'none', H.hi, 1.4, 'opacity="0.55"');
    // 주먹(손등이 보이고 손가락 마디가 머리채를 감아쥠) + 주먹 밖으로 삐져나온 머리칼
    let h = '';
    h += P('M-16 -8 C-20 -24 -10 -36 6 -36 C22 -36 30 -24 28 -8 C26 8 16 18 2 18 C-12 18 -14 6 -16 -8 Z', S.base, S.line, 3);
    for (const [x, y] of [[-12, -30], [0, -36], [12, -36], [23, -28]]) h += `<ellipse cx="${x}" cy="${y}" rx="7" ry="6" fill="${S.base}" stroke="${S.line}" stroke-width="2"/>`;
    h += P('M-14 -22 C-4 -26 10 -26 24 -20', 'none', S.deep, 1.8, 'opacity="0.7"');
    h += P('M-18 0 C-26 -6 -28 -18 -22 -26', 'none', S.line, 7) + P('M-18 0 C-26 -6 -28 -18 -22 -26', 'none', S.base, 4); // 엄지
    h += P('M2 -36 C6 -46 0 -54 6 -64 C10 -72 6 -78 10 -84 M10 -38 C16 -48 12 -58 20 -66 C26 -72 24 -80 30 -86 M18 -36 C26 -42 28 -52 38 -56 M24 -30 C34 -32 40 -38 50 -38 M-4 -34 C-8 -42 -4 -50 -10 -58', 'none', H.base, 2.4);
    s += `<g transform="translate(${X(86)} -52) scale(${sd} 1) rotate(-30)">${h}</g>`;
  }
  return s;
}

// ---------------------------------------------------------------- 쓰러진 수위(오른쪽 뒤 바닥, 어두운 실루엣) + 모자 + 손전등
function guard() {
  let g = '';
  // 지역 좌표: 머리 (0,0), 몸은 오른쪽으로 누움(옆으로 쓰러져 등이 이쪽), 한 팔은 손전등 쪽(왼쪽)으로 뻗음
  g += P('M-6 22 C-40 30 -80 34 -122 40 C-130 42 -132 52 -124 54 C-80 52 -40 48 -2 40 Z', '#0b0e18', INK, 2.5); // 뻗은 팔
  g += P('M-128 40 C-140 38 -150 44 -150 52 C-146 58 -136 58 -126 54 Z', '#5d4f45', INK, 2); // 손
  g += P('M14 -18 C50 -30 110 -32 160 -24 C180 -20 190 -4 186 14 C182 30 160 38 130 40 C80 44 40 44 14 34 C2 26 2 -10 14 -18 Z', '#0b0e18', INK, 3); // 몸통(점퍼)
  g += P('M160 -20 C210 -26 260 -22 300 -10 C320 -4 330 10 318 20 C280 22 230 20 180 22 Z', '#0a0c14', INK, 2.5); // 위쪽 다리(펴짐)
  g += P('M176 24 C210 30 236 50 252 74 C262 90 280 96 306 94 L310 108 C276 114 250 104 236 86 C220 64 200 50 172 44 Z', '#090b12', INK, 2.5); // 아래쪽 다리(구부림)
  g += P('M300 -12 L330 -16 L336 4 L318 20 Z M302 92 L330 88 L336 104 L308 110 Z', '#050507', INK, 2); // 신발
  g += `<ellipse cx="0" cy="0" rx="28" ry="24" fill="#0a0b10" stroke="${INK}" stroke-width="3"/>`; // 머리(짧은 머리 뒤통수)
  g += P('M-22 -12 C-10 -24 12 -26 26 -14 M20 -20 C60 -32 120 -34 170 -24 C200 -24 260 -24 300 -12', 'none', '#8ea6d0', 2.5, 'opacity="0.6"'); // 천창 빛 테두리
  g += P('M30 -8 C40 4 56 10 74 8', 'none', '#aab4c2', 1.4, 'opacity="0.45"'); // 호루라기 줄
  g += P('M72 4 L84 2 L86 12 L74 14 Z', '#7d8796', INK, 1.2);
  let s = `<g transform="translate(690 1040) rotate(-5) scale(1.55)">${g}</g>`;
  // 떨어진 챙 모자
  s += `<g transform="translate(838 1130) scale(1.5)">` + P('M-30 0 C-20 -16 12 -20 30 -10 C34 -2 30 6 16 8 C0 10 -20 10 -30 0 Z', '#121a30', INK, 2.5) +
    P('M-34 2 C-20 14 14 18 46 8 L42 16 C14 26 -20 22 -38 10 Z', '#0a0f1e', INK, 2) + P('M-26 -6 C-10 -14 12 -16 26 -8', 'none', '#8ea6d0', 1.5, 'opacity="0.5"') + `</g>`;
  // 손전등(바닥에 굴러 은미 발치 쪽을 비춤)
  s += `<g filter="url(#${ID}b12)"><path d="M586 1086 L250 1240 L330 1420 L592 1102 Z" fill="#ffe2ad" opacity="0.22"/></g>`;
  s += P('M588 1084 L646 1070 L652 1092 L594 1106 Z', '#2a2f38', INK, 2.5);
  s += P('M600 1080 L640 1071', 'none', '#7d8796', 2, 'opacity="0.7"');
  s += `<ellipse cx="590" cy="1095" rx="8" ry="13" fill="#fff6dc" stroke="${INK}" stroke-width="2"/>`;
  s += `<circle cx="590" cy="1095" r="26" fill="#fff0cc" opacity="0.5" filter="url(#${ID}b12)"/>`;
  return s;
}

export function draw() {
  const defs = headDefs(ID) +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1017"/><stop offset="1" stop-color="#1a1e27"/></linearGradient>` +
    `<linearGradient id="${ID}shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd0f0" stop-opacity="0.32"/><stop offset="1" stop-color="#bcd0f0" stop-opacity="0.08"/></linearGradient>` +
    `<radialGradient id="${ID}torch" cx="590" cy="1095" r="520" gradientUnits="userSpaceOnUse" gradientTransform="translate(590 1095) rotate(150) scale(1.1 0.55) translate(-590 -1095)"><stop offset="0" stop-color="#ffe6b8" stop-opacity="0.5"/><stop offset="0.4" stop-color="#c49a62" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="760" r="940" gradientUnits="userSpaceOnUse"><stop offset="0.38" stop-color="#000" stop-opacity="0"/><stop offset="0.74" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    `<linearGradient id="${ID}bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>` +
    `<linearGradient id="${ID}top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.7"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;
  let s = atrium();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  // 은미 + 천창 쪽 테두리 빛 후광
  s += guard();
  s += `<ellipse cx="${EX}" cy="700" rx="300" ry="560" fill="#7f97c4" opacity="0.14" filter="url(#${ID}b24)"/>`;
  s += `<g transform="translate(${EX} ${EY}) scale(${EK})">${eunmi()}</g>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}torch)" style="mix-blend-mode:screen"/>`;
  s += `<rect y="1300" width="1024" height="236" fill="url(#${ID}bot)"/>`;
  s += `<rect width="1024" height="240" fill="url(#${ID}top)"/>`;
  return K.svg(s, { defs });
}
