// 2D 초상화 공용 그리기 도구 — 손으로 짠 SVG 벡터(셀 채색 + 선화)
// 좌표: 1024x1536, 허리 위 상반신, 몸은 그림 왼쪽(게임 화면 가운데 쪽)으로 살짝 돌아 있음.
// 같은 인물의 표정 그림은 얼굴·머리·몸이 같은 좌표를 쓰고 눈·눈썹·입만 바뀐다(표정 전환 시 화면이 튀지 않게).
export const W = 1024, H = 1536;
export const INK = '#2a1c22';

export const svg = (body, { w = W, h = H, defs = '' } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><defs>${defs}</defs>${body}</svg>`;
// 인물 전체를 1.16배(정수리 기준)로: 대화창 초상화에서 얼굴이 크게 보이게
export const figure = body => `<g transform="translate(512 150) scale(1.16) translate(-512 -150)">${body}</g>`;
export const path = (d, fill, stroke = 'none', sw = 0, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
export const poly = pts => 'M' + pts.map(p => p.join(' ')).join(' L') + ' Z';

// ---------------------------------------------------------------- 피부·얼굴
// 얼굴 윤곽(이마 위쪽은 머리카락이 덮는다). 그림 왼쪽으로 살짝 돌아 턱이 왼쪽으로 치우침
export const FACE = 'M372 420 C366 505 376 585 410 638 C440 684 472 712 500 713 C532 713 576 686 606 648 C640 604 656 520 652 420 C650 340 600 262 512 258 C424 262 376 340 372 420 Z';
export const EAR_R = 'M648 470 C678 460 688 500 680 536 C674 566 658 582 646 580 Z';
export const EAR_L = 'M377 484 C357 478 351 506 358 530 C363 550 371 558 380 556 Z';
export const NECK = 'M463 640 L457 812 L561 812 L556 632 Z';

export function skin(c, { ears = 'both' } = {}) {
  let s = '';
  if (ears !== 'none') s += path(EAR_R, c.base, c.line, 3.5) + path('M658 492 C670 500 670 530 660 548', 'none', c.line, 2.5);
  if (ears === 'both') s += path(EAR_L, c.shade, c.line, 3.5);
  s += path(NECK, c.base, c.line, 3.5);
  s += path('M458 662 C482 716 534 720 557 650 L557 735 C528 752 488 752 458 738 Z', c.shade); // 턱 아래 그림자
  s += path(FACE, c.base, c.line, 4);
  s += path('M606 648 C640 604 656 520 652 430 C640 520 622 600 596 650 Z', c.shade, 'none', 0, 'opacity="0.55"'); // 오른쪽 볼 그늘
  return s;
}

// 볼 홍조·코
export function cheeks(c, { blush = 0.32, pale = false } = {}) {
  let s = '';
  if (blush) s += `<g filter="url(#soft)" opacity="${blush}"><ellipse cx="428" cy="612" rx="38" ry="15" fill="${c.blush}"/><ellipse cx="592" cy="612" rx="40" ry="15" fill="${c.blush}"/></g>`;
  s += path('M500 600 C496 612 494 620 497 626 C502 628 507 627 510 625', 'none', c.line, 3); // 코
  if (pale) s += path('M380 470 C430 455 600 455 650 470 L650 560 C600 545 430 545 380 560 Z', '#6c7fb8', 'none', 0, 'opacity="0.16" filter="url(#soft)"');
  return s;
}

export const DEFS = `<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>`;

// ---------------------------------------------------------------- 표정
// open: 눈 세로 열림, iris: 눈동자 크기, tilt: 안쪽 눈꼬리 높이(+ 아래로 = 화남, - 위로 = 슬픔),
// lid: 윗눈꺼풀이 눈동자를 덮는 정도, bottom: 아랫눈꺼풀이 올라옴(웃는 눈), wet: 눈물 맺힘(반짝임 추가)
export const FACES = {
  default:   { eye: { open: 1 },                               brow: { dy: 0, inner: 0 },     mouth: 'neutral' },
  surprised: { eye: { open: 1.12, iris: 0.8 },                 brow: { dy: -18, inner: -4 },  mouth: 'o' },
  scared:    { eye: { open: 1.08, iris: 0.7, tilt: -6 },       brow: { dy: -12, inner: -18 }, mouth: 'scared', pale: true, blush: 0.1 },
  serious:   { eye: { open: 0.84, lid: 0.16, tilt: 5 },        brow: { dy: 6, inner: 9 },     mouth: 'firm' },
  sad:       { eye: { open: 0.86, lid: 0.14, tilt: -8, wet: true }, brow: { dy: -4, inner: -16 }, mouth: 'sad' },
  smile:     { eye: { open: 0.8, bottom: 0.2 },                brow: { dy: -5, inner: -4 },   mouth: 'smile' },
  angry:     { eye: { open: 0.82, lid: 0.12, tilt: 13 },       brow: { dy: 8, inner: 18 },    mouth: 'frown' },
  smirk:     { eye: { open: 0.78, lid: 0.24, asym: true },     brow: { dy: 0, inner: 6, raiseR: true }, mouth: 'smirk' },
  grin:      { eye: { open: 0.8, bottom: 0.18 },               brow: { dy: -6, inner: -2 },   mouth: 'grin' },
};
export const F = n => (typeof n === 'string' ? FACES[n] || FACES.default : n); // 표정 이름 또는 인물별 표정 객체
// 그림 왼쪽 눈(먼 쪽)은 조금 작다
const EYES = [{ cx: 438, cy: 556, w: 88, h: 108, side: -1 }, { cx: 584, cy: 556, w: 98, h: 112, side: 1 }];

function eye(e, o, irisC, k, lidSkin, pre, lash = 9, flick = true) {
  const { cx, cy, w, side } = e;
  const asymLid = o.asym && side === -1 ? 0.12 : 0;
  const h = e.h * (o.open ?? 1);
  const xi = cx - side * w / 2, xo = cx + side * w / 2;
  const tilt = o.tilt || 0;
  const top = cy - h * 0.5 + e.h * 0.02;
  const it = [xi, cy - h * 0.16 + tilt], ot = [xo, cy - h * 0.3 - tilt * 0.3];
  const bot = cy + h * (0.48 - (o.bottom || 0));
  const ob = [xo - side * w * 0.04, cy + h * 0.1 - (o.bottom || 0) * h * 0.5], ib = [xi, cy + h * 0.12 - (o.bottom || 0) * h * 0.3];
  const open = `M${it} Q${cx + side * w * 0.04} ${top - h * 0.14} ${ot} L${ob} Q${cx} ${bot + h * 0.06} ${ib} Z`;
  const id = `${pre}eye${k}`;
  const ir = (o.iris ?? 1), rx = w * 0.36 * ir, ry = e.h * 0.43 * ir, icx = cx + side * 2, icy = cy + e.h * 0.06;
  const lid = (o.lid || 0) + asymLid;
  let s = `<clipPath id="${id}"><path d="${open}"/></clipPath>`;
  s += `<g clip-path="url(#${id})">`;
  s += `<rect x="${cx - w}" y="${cy - e.h}" width="${w * 2}" height="${e.h * 2}" fill="#fff"/>`;
  s += `<ellipse cx="${icx}" cy="${icy}" rx="${rx}" ry="${ry}" fill="url(#${pre}iris${k})" stroke="${irisC[0]}" stroke-width="3"/>`;
  s += `<ellipse cx="${icx}" cy="${icy + ry * 0.08}" rx="${rx * 0.46}" ry="${ry * 0.5}" fill="${irisC[0]}"/>`;
  s += `<ellipse cx="${icx}" cy="${icy + ry * 0.45}" rx="${rx * 0.7}" ry="${ry * 0.3}" fill="${irisC[2]}" opacity="0.55"/>`;
  s += `<ellipse cx="${icx - w * 0.12}" cy="${icy - ry * 0.38}" rx="${w * 0.13}" ry="${e.h * 0.1}" fill="#fff"/>`;
  s += `<circle cx="${icx + w * 0.13}" cy="${icy + ry * 0.4}" r="${w * 0.045}" fill="#fff" opacity="0.9"/>`;
  if (o.wet) s += `<path d="M${icx - rx} ${icy + ry * 0.62} Q${icx} ${icy + ry * 0.95} ${icx + rx} ${icy + ry * 0.62}" fill="none" stroke="#fff" stroke-width="5" opacity="0.85"/>`;
  s += `<rect x="${cx - w}" y="${cy - e.h}" width="${w * 2}" height="${e.h * 0.62}" fill="url(#${pre}lidshade)"/>`; // 윗눈꺼풀 그림자
  s += `</g>`;
  // 윗눈꺼풀이 내려온 눈(무표정·화남·비웃음): 눈꺼풀 피부를 덮고 선을 그 위치로
  const lidY = lid ? top + h * lid * 1.15 : null;
  if (lid) {
    s += `<g clip-path="url(#${id})"><rect x="${cx - w}" y="${cy - e.h}" width="${w * 2}" height="${lidY - (cy - e.h)}" fill="${lidSkin}"/></g>`;
  }
  // 속눈썹(윗선 굵게 + 바깥 꼬리) · 쌍꺼풀 · 아랫선
  const lashY = lid ? lidY : null;
  const upper = lid
    ? `M${it[0]} ${Math.max(it[1], lashY - 4)} Q${cx} ${lashY - 8} ${ot[0]} ${Math.max(ot[1], lashY - 6)}`
    : `M${it} Q${cx + side * w * 0.04} ${top - h * 0.14} ${ot}`;
  s += path(upper, 'none', INK, lash);
  if (flick) s += path(`M${ot} l${side * 16} 9 l${-side * 14} 3 Z`, INK, INK, 3);
  s += path(`M${cx - side * w * 0.05} ${top - h * 0.2 - 6} Q${cx + side * w * 0.3} ${top - h * 0.16 - 4} ${xo + side * 4} ${ot[1] - 8}`, 'none', INK, 2.5, 'opacity="0.55"');
  s += path(`M${ob} Q${cx + side * w * 0.12} ${bot + h * 0.02} ${cx - side * w * 0.15} ${bot - h * 0.01}`, 'none', INK, 3.2, 'opacity="0.75"');
  return s;
}

// lash: 윗속눈썹 굵기, flick: 바깥 눈꼬리 속눈썹(남자는 lash 6, flick false 권장)
export function eyes(faceName, irisC, { lidSkin = '#f4d6c9', pre = 'p', lash = 9, flick = true } = {}) {
  const f = F(faceName);
  return EYES.map((e, i) => eye(e, f.eye, irisC, i ? 'b' : 'a', lidSkin, pre, lash, flick)).join('');
}

export const irisDefs = (irisC, pre = 'p') => ['a', 'b'].map(k =>
  `<linearGradient id="${pre}iris${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${irisC[0]}"/><stop offset="0.55" stop-color="${irisC[1]}"/><stop offset="1" stop-color="${irisC[2]}"/></linearGradient>`).join('') +
  `<linearGradient id="${pre}lidshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#8d86a8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;

// 눈썹(앞머리 위에 비쳐 보이게 머리카락 다음에 그린다)
export function brows(faceName, color, width = 7) {
  const b = F(faceName).brow;
  let s = '';
  EYES.forEach((e, i) => {
    const { cx, cy, w, side } = e;
    const dy = b.dy + (b.raiseR && side === 1 ? -14 : 0);
    const xi = cx - side * w * 0.48, xo = cx + side * w * 0.62;
    const yi = cy - 80 + dy + b.inner, yo = cy - 74 + dy * 0.6;
    const apex = cy - 95 + dy + b.inner * 0.3;
    s += path(`M${xi} ${yi} Q${cx + side * w * 0.1} ${apex} ${xo} ${yo}`, 'none', color, width, 'opacity="0.92"');
  });
  return s;
}

export function mouth(faceName, c) {
  const m = F(faceName).mouth;
  const L = c.lip || '#7d3440';
  switch (m) {
    case 'smile': return path('M482 648 Q504 668 530 646', 'none', L, 4);
    case 'grin': return path('M476 642 Q504 694 534 641 Q505 652 476 642 Z', '#8a2f3a', L, 3.5) + path('M480 645 Q505 655 530 644 L528 652 Q505 660 482 652 Z', '#fff');
    case 'o': return `<ellipse cx="503" cy="664" rx="12" ry="16" fill="#6c2330" stroke="${L}" stroke-width="3"/>`;
    case 'sad': return path('M488 663 Q504 652 522 662', 'none', L, 4);
    case 'frown': return path('M486 661 Q505 650 524 660', 'none', L, 4.5) + path('M495 664 L515 663', 'none', L, 2.5, 'opacity="0.6"');
    case 'smirk': return path('M486 655 Q506 660 526 644', 'none', L, 4) + path('M526 644 l6 -3', 'none', L, 3);
    case 'scared': return path('M486 662 Q494 652 503 659 Q512 667 522 657 Q514 676 502 673 Q490 673 486 662 Z', '#6c2330', L, 3);
    case 'firm': return path('M488 657 L522 655', 'none', L, 4.5);
    default: return path('M490 654 Q505 659 520 653', 'none', L, 3.8);
  }
}

// ---------------------------------------------------------------- 교복(남색 블레이저)
export const NAVY = { base: '#25305a', shade: '#18203f', light: '#34427a', line: '#0d1226' };
export const SHIRT = { base: '#f2eee5', shade: '#d6cfc0', line: '#6f6658' };
const BODY = 'M444 798 C392 808 334 824 302 852 C266 884 254 946 252 1030 L246 1536 L790 1536 L784 1030 C782 950 770 892 740 860 C706 828 640 808 586 798 Z';

// opts: neck 'tie' | 'ribbon', open: 블레이저를 연 채(성아)
export function uniform({ neck = 'tie', open = false } = {}) {
  let s = path(BODY, NAVY.base, NAVY.line, 4);
  // 팔과 몸통 경계 주름, 오른쪽(빛 반대쪽) 그늘
  s += path('M740 860 C770 892 782 950 784 1030 L790 1536 L702 1536 L698 1060 C698 980 716 912 740 860 Z', NAVY.shade, 'none', 0, 'opacity="0.85"');
  s += path('M334 1050 C330 1200 328 1380 326 1536', 'none', NAVY.line, 3.5) + path('M698 1060 C700 1220 702 1380 704 1536', 'none', NAVY.line, 3.5);
  s += path('M302 852 C282 890 272 950 274 1010', 'none', NAVY.light, 6, 'opacity="0.5"');
  // 셔츠(V자 안)
  const vBottom = open ? 1536 : 1185, vL = open ? 400 : 444, vR = open ? 630 : 586;
  s += path(open ? `M440 790 L590 790 L640 1536 L392 1536 Z` : `M440 790 L590 790 L512 ${vBottom} Z`, SHIRT.base, SHIRT.line, 3);
  if (open) s += path('M512 830 L512 1536', 'none', SHIRT.shade, 3) + [930, 1080, 1230, 1380].map(y => `<circle cx="512" cy="${y}" r="6" fill="#fff" stroke="${SHIRT.line}" stroke-width="2"/>`).join('');
  // 셔츠 깃
  s += path('M470 778 L440 800 L462 880 L507 822 Z', SHIRT.base, SHIRT.line, 3) + path('M554 778 L590 800 L566 880 L519 822 Z', SHIRT.base, SHIRT.line, 3);
  s += path('M462 880 L507 822 L512 830 L470 878 Z', SHIRT.shade, 'none', 0, 'opacity="0.7"');
  if (neck === 'tie') {
    s += path('M498 820 L528 820 L523 856 L503 856 Z', '#5e1b29', '#2c0b12', 3);
    s += path('M503 856 L491 1140 L512 1176 L533 1140 L523 856 Z', '#6b2131', '#2c0b12', 3);
    s += path('M512 860 L512 1170', 'none', '#4a1420', 3, 'opacity="0.6"') + path('M505 900 L520 940 M500 980 L524 1030 M497 1070 L527 1120', 'none', '#7f2b3d', 6, 'opacity="0.55"');
  } else {
    // 빨간 리본: 고리 두 개 + 매듭 + 꼬리
    const R = '#c4313b', RD = '#8e1f28', RL = '#4b0c12';
    s += path('M512 838 L470 905 L486 912 L512 862 Z', RD, RL, 3) + path('M512 838 L556 906 L540 913 L512 862 Z', RD, RL, 3);
    s += path('M512 834 C486 806 444 808 444 836 C444 862 484 866 512 846 Z', R, RL, 3.5) + path('M512 834 C538 806 580 808 580 836 C580 862 540 866 512 846 Z', R, RL, 3.5);
    s += path('M498 826 L526 826 L524 852 L500 852 Z', RD, RL, 3);
    s += path('M455 830 C466 820 482 822 496 834', 'none', '#e46a72', 4, 'opacity="0.7"');
  }
  // 라펠
  const lapelL = open ? 'M440 798 L360 880 L388 912 L366 942 L392 1536 L420 1536 L456 1010 Z' : 'M444 796 L376 874 L402 904 L382 932 L507 1180 L476 980 Z';
  const lapelR = open ? 'M590 798 L668 880 L640 912 L662 942 L636 1536 L606 1536 L572 1010 Z' : 'M584 796 L652 874 L626 904 L646 932 L517 1180 L548 980 Z';
  s += path(lapelL, NAVY.light, NAVY.line, 3.5) + path(lapelR, NAVY.base, NAVY.line, 3.5);
  if (!open) {
    s += path('M512 1182 C514 1300 513 1420 512 1536', 'none', NAVY.line, 3.5);
    for (const y of [1250, 1385]) s += `<circle cx="514" cy="${y}" r="12" fill="#c9a13c" stroke="#6e5011" stroke-width="3"/><circle cx="510" cy="${y - 4}" r="4" fill="#f3dc8a"/>`;
  } else {
    for (const y of [1250, 1385]) s += `<circle cx="372" cy="${y}" r="12" fill="#c9a13c" stroke="#6e5011" stroke-width="3"/>`;
  }
  // 명찰(흰색 무지, 글자 없음) — 왼쪽 가슴 = 그림 오른쪽
  s += `<rect x="604" y="1000" width="84" height="24" rx="3" fill="#fbfaf6" stroke="#5d5a55" stroke-width="2.5" transform="rotate(-2 646 1012)"/>`;
  return s;
}
