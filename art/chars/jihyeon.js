// 설지현: 어깨에 닿는 부드러운 밤색 머리(끝이 살짝 바깥으로 뻗음), 윗머리를 뒤통수에서 작게 묶은 반묶음(짙은 와인색 머리끈,
// 그림 오른쪽 위 뒤통수에 작은 매듭과 짧은 꽁지가 보임), 부드러운 일자 앞머리, 가는 금테 둥근 안경(렌즈에 흰 반사),
// 동그랗고 짙은 눈, 밝고 따뜻한 복숭앗빛 피부, 빨간 리본 교복. 수줍고 겁 많은 착한 아이.
import * as K from '../kit.js';

const SKIN = { base: '#fde3d2', shade: '#f0c3ad', line: '#a6695a', blush: '#f2918c', lip: '#b44e58' };
const HAIR = { base: '#7c4b33', shade: '#583222', hi: '#c99674', line: '#2a140b' };
const IRIS = ['#22120b', '#5a3322', '#b47c58'];
const BROW = '#64392a';
const TIE = { base: '#6d1d2d', shade: '#4a111e', hi: '#a03e50', line: '#25060d' };
const GOLD = { rim: '#b48a34', hi: '#f1d98f', line: '#5a3f12' };

// 표정: look = [가로, 세로] 시선 이동(-세로 = 위를 봄), tears = 눈물 맺힘 정도(눈 안쪽 물기 띠 + 반짝임, true = 1)
const FACES = {
  ...K.FACES,
  // 기본: 겁먹고 쭈뼛쭈뼛, 눈만 들어 수줍게 올려다봄, 눈썹 안쪽이 올라감, 작게 다문 입(웃지 않음)
  default: { eye: { open: 0.98, tilt: -6 },                   brow: { dy: -2, inner: -12 }, mouth: 'shy', blush: 0.34, look: [-2, -7] },
  // 겁먹음: 크게 뜬 눈물 어린 눈, 눈썹 가운데가 확 올라감, 말을 더듬느라 벌어진 입, 창백
  scared:  { eye: { open: 1.1, iris: 0.72, tilt: -8, wet: true }, brow: { dy: -14, inner: -24 }, mouth: 'stammer', pale: true, blush: 0.1, tears: true },
  // 안도의 미소: 살짝 눈물 어린 부드러운 눈, 작게 벌린 웃는 입
  smile:   { eye: { open: 0.96, bottom: 0.12, tilt: -8, wet: true }, brow: { dy: -6, inner: -14 }, mouth: 'relief', blush: 0.46, tears: 0.5 },
  // 슬픔: 걱정스럽게 내리깐 눈, 안쪽으로 모여 올라간 눈썹, 꾹 다문 입
  sad:     { eye: { open: 0.86, lid: 0.1, tilt: -18, wet: true }, brow: { dy: 4, inner: -28, knit: 6 }, mouth: 'pressed', blush: 0.24, look: [-3, 10] },
};

// ---------------------------------------------------------------- 머리카락
// 반묶음 매듭(뒤통수, 그림 오른쪽 위): 정수리 덩어리 뒤에 그려서 바깥으로 나온 부분만 보임.
// 머리 중심에서 바깥(오른쪽 위)으로 향하는 축을 x로 하는 지역 좌표: 머리끈(띠) → 동그란 매듭 → 아래로 처진 짧은 꽁지
const KNOT_AT = [695, 286], KNOT_ROT = -38;
const knot =
  `<g transform="translate(${KNOT_AT}) rotate(${KNOT_ROT})">` +
  // 짧은 꽁지(매듭 아래쪽에서 나와 뒤통수를 따라 아래로 처짐, 끝 두 갈래)
  K.path('M40 10 C60 26 58 56 38 78 Q33 68 27 66 Q22 75 13 81 C18 60 16 42 8 26 Z', HAIR.base, HAIR.line, 4) +
  K.path('M20 34 C26 50 26 66 27 66 Q22 75 13 81 C18 60 16 42 8 26 Z', HAIR.shade, 'none', 0, 'opacity="0.8"') +
  // 동그란 매듭
  K.path('M6 -4 C6 -28 24 -34 38 -28 C54 -20 56 4 44 18 C32 30 8 24 6 -4 Z', HAIR.base, HAIR.line, 4) +
  K.path('M10 12 C22 24 40 22 48 8 C50 20 42 28 30 28 C20 28 12 22 10 12 Z', HAIR.shade, 'none', 0, 'opacity="0.85"') +
  K.path('M16 -20 Q26 -28 38 -24', 'none', HAIR.hi, 5, 'opacity="0.6"') +
  // 와인색 머리끈: 묶은 뿌리를 감은 짧은 띠
  `<rect x="-10" y="-19" width="20" height="38" rx="7" fill="${TIE.base}" stroke="${TIE.line}" stroke-width="3.5"/>` +
  `<rect x="-5" y="-14" width="5" height="22" rx="2.5" fill="${TIE.hi}"/><rect x="3" y="-14" width="4" height="30" rx="2" fill="${TIE.shade}"/>` +
  `</g>`;

// 뒷머리(얼굴·목 뒤, 어깨 아래는 블레이저가 가림)
const back = K.path('M332 470 C324 380 368 262 452 228 C512 206 606 212 658 248 C704 282 716 380 714 470 L720 920 L316 920 Z', HAIR.shade, HAIR.line, 4);

// 끝 덩어리 잇기(seonga.js 와 같은 방식). hook 'R': 끝이 오른쪽을 향함, 'L': 왼쪽을 향함
function teeth(start, pts, hook) {
  let d = '', v = start;
  for (const [tx, ty, nx, ny] of pts) {
    if (hook === 'R') {
      d += ` Q${v[0] - 2} ${v[1] + (ty - v[1]) * 0.6} ${tx} ${ty}`;
      d += ` Q${tx - (tx - nx) * 0.62} ${ty - (ty - ny) * 0.12} ${nx} ${ny}`;
    } else {
      d += ` Q${v[0] - (v[0] - tx) * 0.3} ${ty + 2} ${tx} ${ty}`;
      d += ` Q${tx + (nx - tx) * 0.1 + 2} ${ty - (ty - ny) * 0.55} ${nx} ${ny}`;
    }
    v = [nx, ny];
  }
  return d;
}
// 부드러운 일자 앞머리: 눈썹 높이에서 끝이 가늘어지는 덩어리 6개(오른쪽 → 왼쪽). [끝 x, 끝 y, 다음 골 x, 다음 골 y]
const RJ = [652, 448];
const BANG = [
  [634, 466, 616, 434],
  [596, 474, 578, 436],
  [556, 469, 538, 438],
  [516, 478, 496, 434],
  [472, 470, 456, 437],
  [432, 466, 416, 440],
  [398, 462, 384, 446],
];
function bangEdge(start, pts) {
  let d = '', v = start;
  for (const [tx, ty, nx, ny] of pts) {
    d += ` C${v[0]} ${v[1] + (ty - v[1]) * 0.55} ${tx + 5} ${ty - 7} ${tx} ${ty}`;    // 오른쪽 면: 볼록하게 내려와 살짝 뾰족한 끝으로
    d += ` C${tx - 3} ${ty - 9} ${nx + 3} ${ny + (ty - ny) * 0.45} ${nx} ${ny}`;     // 왼쪽 면: 끝에서 부드럽게 골로
    v = [nx, ny];
  }
  return d;
}
const EDGE = bangEdge(RJ, BANG);
// 오른쪽(가까운 쪽) 옆머리: 바깥 끝(어깨 위에서 바깥으로 뻗음) → 끝 덩어리 → 볼을 따라 앞머리 이음점으로
const RIGHT_LOCK = teeth([770, 832], [[736, 854, 718, 828], [700, 854, 684, 828], [648, 840, 648, 840]], 'R') +
  ' C636 780 634 700 642 620 C648 560 654 500 ' + RJ.join(' ');
// 왼쪽(먼 쪽) 옆머리: 앞머리 끝 → 얼굴 옆을 따라 내려감 → 끝 덩어리(바깥으로 뻗음)
const LEFT_LOCK = ' C378 520 382 630 394 720 C400 770 404 800 406 830' +
  teeth([406, 830], [[378, 848, 364, 822], [338, 852, 326, 830], [278, 842, 278, 842]], 'L');
const OUTER = 'M278 842 C300 818 322 780 324 716 C326 640 310 560 314 470 C318 370 368 266 452 230 C492 212 556 208 602 222 C664 242 708 300 716 380 C726 470 730 560 722 660 C716 740 732 800 770 832';
const crownPath = OUTER + RIGHT_LOCK + EDGE + LEFT_LOCK + ' Z';

// 결: 앞머리는 이마 위에서 골로 내려오고, 윗머리는 관자놀이·정수리에서 뒤통수 매듭 쪽으로 모임
const strands =
  BANG.filter((_, i) => i % 2 === 0 || i === 3).map(([, , x, y]) => `M${480 + (x - 480) * 0.6} ${318} Q${x + (x - 500) * 0.1} ${384} ${x} ${y - 4}`).join(' ') +
  ' M548 232 Q632 236 680 284 M604 300 Q652 292 682 292 M650 430 Q664 350 684 300' + // 윗머리 → 매듭
  ' M708 450 C714 580 710 700 732 826 M676 540 C680 650 680 750 696 834 M346 440 C334 570 340 700 320 820 M366 580 C370 670 378 760 366 834'; // 옆머리

const frontDefs = pre =>
  `<clipPath id="${pre}hc"><path d="${crownPath}"/></clipPath>` +
  `<mask id="${pre}hb" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><path d="${crownPath}" fill="#fff"/><path d="${crownPath}" fill="#000" transform="translate(-3 -20)"/></mask>`;

const front = pre =>
  K.path(crownPath, HAIR.base, HAIR.line, 4) +
  `<g clip-path="url(#${pre}hc)">` +
  `<path d="${crownPath}" fill="${HAIR.shade}" opacity="0.7" mask="url(#${pre}hb)"/>` +
  // 옆머리 안쪽(볼 쪽) 그늘, 뒤통수 쪽 그늘
  K.path('M650 470 C664 580 664 690 656 860 L610 860 L628 470 Z', HAIR.shade, 'none', 0, 'opacity="0.7"') +
  K.path('M384 450 C368 560 372 670 386 860 L422 860 L400 450 Z', HAIR.shade, 'none', 0, 'opacity="0.7"') +
  K.path('M660 256 C708 296 730 370 730 470 L780 470 L780 256 Z', HAIR.shade, 'none', 0, 'opacity="0.4"') +
  K.path(strands, 'none', HAIR.line, 2.5, 'opacity="0.42"') +
  // 천사의 고리(정수리 광택)
  K.path('M388 352 Q500 296 652 330', 'none', HAIR.hi, 11, 'opacity="0.5" stroke-dasharray="34 12 26 10 40 14 22 12 30"') +
  `</g>` +
  K.path(crownPath, 'none', HAIR.line, 4);

// ---------------------------------------------------------------- 얼굴
const faceClip = pre => `<clipPath id="${pre}fc"><path d="${K.FACE}"/></clipPath>`;
const inFace = (pre, body) => `<g clip-path="url(#${pre}fc)">${body}</g>`;
const foreheadShadow = pre => inFace(pre, K.path(crownPath, SKIN.shade, 'none', 0, 'transform="translate(4 10)"'));

// 볼 홍조(안경알 아래 가장자리 쯤) + 코·창백함은 키트
function cheeks(f, pre) {
  const b = f.blush ?? 0.32;
  let s = '';
  if (b) s += `<g filter="url(#soft)" opacity="${b}"><ellipse cx="432" cy="630" rx="40" ry="14" fill="${SKIN.blush}"/><ellipse cx="596" cy="630" rx="42" ry="14" fill="${SKIN.blush}"/></g>`;
  if (f.pale) s += `<rect x="360" y="440" width="300" height="110" fill="url(#${pre}pale)"/>`; // 겁에 질려 핏기가 가심(이마 → 볼로 옅어짐)
  return s + K.cheeks(SKIN, { blush: 0 });
}

// 키트의 눈 좌표(눈물 띠를 같은 자리에 얹기 위해)
const EYES = [{ cx: 438, cy: 556, w: 88, h: 108, side: -1 }, { cx: 584, cy: 556, w: 98, h: 112, side: 1 }];
// 시선 이동: 흰자 안의 눈동자·반짝임만
function lookAt(svg, look) {
  if (!look) return svg;
  return svg.replace(/(<rect [^>]*fill="#fff"\/>)([\s\S]*?)(<rect [^>]*lidshade)/g, `$1<g transform="translate(${look[0]} ${look[1]})">$2</g>$3`);
}
// 눈꺼풀을 내린 눈: 바깥 눈꼬리 속눈썹을 내려온 속눈썹 끝으로(seonga.js 와 같은 보정)
const fixFlick = svg => svg.replace(
  /(d="M[-\d.]+ [-\d.]+ Q[-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+)"[^>]*\/><path d=")M[-\d.]+,[-\d.]+ l/g,
  (m, head, x, y) => `${head}M${x},${y} l`);
// 눈물 맺힘: 아랫눈꺼풀을 따라 옅은 물기 띠 + 작은 반짝임(눈 윤곽 안쪽에만)
function tears(e, o, k, pre, amt = 1) {
  const h = e.h * (o.open ?? 1), { cx, cy, w, side } = e;
  const bt = o.bottom || 0, bot = cy + h * (0.48 - bt); // 키트 eye()와 같은 아랫눈꺼풀(웃는 눈이면 올라감)
  const xi = cx - side * w / 2, xo = cx + side * w / 2;
  const ob = [xo - side * w * 0.04, cy + h * 0.1 - bt * h * 0.5], ib = [xi, cy + h * 0.12 - bt * h * 0.3];
  return `<g clip-path="url(#${pre}eye${k})">` +
    K.path(`M${ob} Q${cx} ${bot + h * 0.06} ${ib}`, 'none', '#cfe7f8', 12, `opacity="${0.75 * amt}"`) +
    K.path(`M${cx - w * 0.26} ${bot - h * 0.1} Q${cx} ${bot - h * 0.02} ${cx + w * 0.26} ${bot - h * 0.1}`, 'none', '#fff', 3.5, `opacity="${Math.min(1, 0.9 * amt + 0.2)}"`) +
    `</g>`;
}
// 안경알(근시용 오목렌즈) 너머라 눈이 아주 조금 작아 보임: 눈마다 제 중심에서 ES배
const ES = 0.92;
function eyes(f, pre) {
  let s = K.eyes(f, IRIS, { lidSkin: SKIN.base, pre, lash: 9.2 });
  if (f.eye.lid) s = fixFlick(s);
  s = lookAt(s, f.look);
  const cut = s.indexOf(`<clipPath id="${pre}eyeb"`);
  return [s.slice(0, cut), s.slice(cut)].map((part, i) => {
    const e = EYES[i];
    return `<g transform="translate(${e.cx} ${e.cy}) scale(${ES}) translate(${-e.cx} ${-e.cy})">` +
      part + (f.tears ? tears(e, f.eye, i ? 'b' : 'a', pre, f.tears === true ? 1 : f.tears) : '') + `</g>`;
  }).join('');
}
// 눈썹(키트 모양, 부드러운 갈색)
function brows(f) {
  const b = f.brow;
  return EYES.map(({ cx, cy, w, side }) => {
    const xi = cx - side * (w * 0.48 + (b.knit || 0)), xo = cx + side * w * 0.62; // knit: 눈썹 안쪽 끝을 미간 쪽으로 모음
    const yi = cy - 80 + b.dy + b.inner, yo = cy - 74 + b.dy * 0.6;
    const apex = cy - 95 + b.dy + b.inner * 0.3;
    return K.path(`M${xi} ${yi} Q${cx + side * w * 0.1} ${apex} ${xo} ${yo}`, 'none', BROW, 6.5, 'opacity="0.95"');
  }).join('');
}

function mouth(f, pre) {
  const L = SKIN.lip, IN = '#6a2630';
  switch (f.mouth) {
    case 'shy': // 작게 다문 입(웃지 않음)
      return K.path('M494 656 Q504 660 515 655', 'none', L, 3.8) + K.path('M499 667 Q505 669 511 667', 'none', L, 2.4, 'opacity="0.45"');
    case 'stammer': { // 더듬느라 벌어진 입: 윗입술이 물결
      const d = 'M490 663 Q497 654 505 659 Q513 663 519 656 Q520 675 505 678 Q491 677 490 663 Z';
      return `<clipPath id="${pre}mo"><path d="${d}"/></clipPath>` + K.path(d, IN) +
        `<g clip-path="url(#${pre}mo)">${K.path('M486 652 Q496 651 505 658 Q513 662 522 652 L522 660 Q513 666 505 663 Q496 658 486 662 Z', '#f8f2ee')}` +
        `<ellipse cx="505" cy="680" rx="11" ry="7" fill="#c85c66"/></g>` +
        K.path(d, 'none', L, 3);
    }
    case 'relief': { // 안도의 작은 웃음(살짝 벌림)
      const d = 'M485 650 Q503 658 523 648 Q518 671 504 672 Q490 671 485 650 Z';
      return `<clipPath id="${pre}mo"><path d="${d}"/></clipPath>` + K.path(d, IN) +
        `<g clip-path="url(#${pre}mo)"><ellipse cx="505" cy="673" rx="15" ry="9" fill="#d46a72"/></g>` +
        K.path(d, 'none', L, 3.4);
    }
    case 'pressed': // 꾹 다문 입술
      return K.path('M491 664 Q497 657 504 659 Q512 660 518 662', 'none', L, 4) + K.path('M499 671 Q505 673 511 671', 'none', L, 2.4, 'opacity="0.5"');
    default: return K.mouth(f, SKIN);
  }
}

// ---------------------------------------------------------------- 안경(가는 금테, 둥근 알)
// 먼 쪽(그림 왼쪽) 알은 고개가 돌아간 만큼 조금 좁게
const LENS = [{ cx: 434, cy: 560, rx: 54, ry: 61 }, { cx: 587, cy: 560, rx: 60, ry: 63 }];
const ell = ({ cx, cy, rx, ry }, dx = 0, dy = 0) => `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${rx}" ry="${ry}"`;
// 테두리를 따라 도는 호(각도: 0 = 오른쪽, 90 = 아래)
function arc({ cx, cy, rx, ry }, a0, a1, inset) {
  const p = a => [cx + (rx - inset) * Math.cos(a * Math.PI / 180), cy + (ry - inset) * Math.sin(a * Math.PI / 180)].map(v => v.toFixed(1)).join(' ');
  return `M${p(a0)} A${rx - inset} ${ry - inset} 0 0 1 ${p(a1)}`;
}
const [LL, LR] = LENS;
// 렌즈 아래 볼에 드리운 안경테 그림자(얼굴 안쪽만)
const frameShadow = pre => inFace(pre, LENS.map(l => ell(l, 4, 9) + ` fill="none" stroke="${SKIN.shade}" stroke-width="5" opacity="0.75"/>`).join(''));
// 가까운 쪽 안경다리: 옆머리 밑으로 들어감(머리카락보다 먼저 그림)
const ARM = `M${LR.cx + LR.rx - 2} ${LR.cy - 14} L${LR.cx + LR.rx + 48} ${LR.cy - 20}`;
const templeArm = K.path(ARM, 'none', GOLD.line, 7) + K.path(ARM, 'none', GOLD.rim, 3.5);
function glasses() {
  let s = '';
  // 렌즈 반사: 오른쪽 아래 테두리를 따라 도는 흰 호 두 줄 + 왼쪽 아래 짧은 호(눈은 가리지 않음)
  for (const l of LENS) {
    s += K.path(arc(l, 10, 72, 8), 'none', '#fff', 6, 'opacity="0.85"');
    s += K.path(arc(l, 26, 56, 17), 'none', '#fff', 3.5, 'opacity="0.55"');
    s += K.path(arc(l, 114, 136, 8), 'none', '#fff', 4, 'opacity="0.5"');
  }
  // 코받침 다리(브리지): 두 알 사이, 코 위로 살짝 둥글게
  const bridge = `M${LL.cx + LL.rx - 1} ${LL.cy - 12} Q${(LL.cx + LL.rx + LR.cx - LR.rx) / 2} ${LL.cy - 28} ${LR.cx - LR.rx + 1} ${LR.cy - 12}`;
  s += K.path(bridge, 'none', GOLD.line, 7) + K.path(bridge, 'none', GOLD.rim, 3.5);
  // 테: 짙은 선 + 금색 + 위쪽 광택
  s += LENS.map(l => ell(l) + ` fill="none" stroke="${GOLD.line}" stroke-width="7"/>`).join('');
  s += LENS.map(l => ell(l) + ` fill="none" stroke="${GOLD.rim}" stroke-width="3.5"/>`).join('');
  s += LENS.map(l => K.path(arc(l, 205, 250, 0), 'none', GOLD.hi, 2, 'opacity="0.9"')).join('');
  // 경첩(테 바깥 끝의 작은 금속)
  const hx = LL.cx - LL.rx, rx = LR.cx + LR.rx;
  s += K.path(`M${hx + 2} ${LL.cy - 20} l-7 -1 l0 11 l7 1 Z`, GOLD.rim, GOLD.line, 2.5);
  s += K.path(`M${rx - 2} ${LR.cy - 20} l9 -1 l0 11 l-9 1 Z`, GOLD.rim, GOLD.line, 2.5);
  return s;
}

// 인물 그림(초상화 좌표 1024x1536, 확대 전). CG에서 재사용: <defs>${defs(pre)}</defs><g transform=…>${figure(face, pre)}</g>
export function figure(face = 'default', pre = 'jh') {
  const f = K.F(FACES[face] ? FACES[face] : face);
  return faceClip(pre) + frontDefs(pre) +
    knot + back +
    K.uniform({ neck: 'ribbon' }) +
    K.skin(SKIN, { ears: 'none' }) +
    inFace(pre, cheeks(f, pre)) +
    foreheadShadow(pre) +
    frameShadow(pre) +
    eyes(f, pre) +
    mouth(f, pre) +
    templeArm +
    front(pre) +
    brows(f) +
    glasses();
}
export const defs = (pre = 'jh') => K.DEFS + K.irisDefs(IRIS, pre) +
  `<linearGradient id="${pre}pale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d6fae" stop-opacity="0.3"/><stop offset="1" stop-color="#5d6fae" stop-opacity="0"/></linearGradient>`;

export function draw(face = 'default') {
  return K.svg(K.figure(figure(face)), { defs: defs() });
}
