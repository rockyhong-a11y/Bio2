// 이희민(주인공): 짧고 곧은 새까만 머리, 눈썹 바로 위에서 들쭉날쭉한 앞머리, 귀가 보이게 단정히 쳐 올린 옆·뒷머리,
// 짙은 갈색 눈, 밝고 따뜻한 피부, 버건디 넥타이. 조용하고 평범한 인상의 부드러운 얼굴.
import * as K from '../kit.js';

const SKIN = { base: '#fae7d9', shade: '#e9c9b6', line: '#9a6a5c', blush: '#ec9f94', lip: '#8e4b4b' };
const HAIR = { base: '#212027', shade: '#111015', hi: '#6a6878', line: '#050507' };
const IRIS = ['#1b110d', '#4a2f24', '#8c6551'];
const BROW = '#241c20';
// 평소 표정: 차분하고 진지하지만 속으로 긴장(눈썹 안쪽이 아주 살짝 올라감). look = 시선 가로 이동(-: 그림 왼쪽)
const FACES = {
  ...K.FACES,
  default:   { eye: { open: 0.94, lid: 0.04 },             brow: { dy: 0, inner: -5 },   mouth: 'flat', blush: 0.13 },
  surprised: { eye: { open: 1.12, iris: 0.78 },            brow: { dy: -20, inner: -6 }, mouth: 'o', blush: 0.1 },
  scared:    { eye: { open: 1.08, iris: 0.68, tilt: -6 },  brow: { dy: -12, inner: -18 }, mouth: 'scared', pale: true, blush: 0.05, sweat: true },
  serious:   { eye: { open: 0.86, lid: 0.17, tilt: 4 },    brow: { dy: 5, inner: 12 },   mouth: 'firm', blush: 0.1, look: -6 },
};

// ---------------------------------------------------------------- 머리카락
// 뒷머리(귀·얼굴 뒤, 그늘색): 그림 오른쪽이 뒤통수. 귀 뒤로 목덜미까지 짧게 쳐서 끝이 뾰족하게 갈라짐
const back = K.path('M372 540 C356 500 346 450 348 400 C352 300 410 226 494 216 C586 206 668 244 692 326 C704 376 708 440 703 492 C700 526 694 552 686 570 Q682 584 674 592 Q671 580 665 576 Q660 590 649 598 C652 570 654 520 652 470 L380 470 Z', HAIR.shade, HAIR.line, 4);

// 앞머리: 골(V)과 끝(T)을 오른쪽 → 왼쪽 순으로. 끝은 왼쪽으로 살짝 휘어(머리를 그림 왼쪽으로 빗음) 길이가 들쭉날쭉
const R0 = [638, 452];
const CLUMPS = [ // [끝 x, 끝 y, 다음 골 x, 다음 골 y]
  [624, 462, 606, 424],
  [590, 448, 574, 400],
  [552, 466, 536, 420],
  [513, 488, 497, 414],
  [478, 456, 460, 426],
  [440, 446, 424, 418],
  [404, 462, 390, 432],
];
function bangEdge() {
  let d = '', v = R0;
  for (const [tx, ty, nx, ny] of CLUMPS) {
    d += ` Q${v[0] + 1} ${v[1] + (ty - v[1]) * 0.85} ${tx} ${ty}`;              // 덩어리 오른쪽 면: 볼록하게 내려와 끝으로
    d += ` Q${tx - (tx - nx) * 0.18} ${ny + (ty - ny) * 0.3} ${nx} ${ny}`;       // 왼쪽 면: 끝에서 가파르게 올라가 골로(갈고리 끝)
    v = [nx, ny];
  }
  return d;
}
const EDGE = bangEdge();
// 바깥 윤곽(그림 왼쪽 관자놀이 → 정수리 → 뒤통수 → 귀 위). 둥근 바가지 모양이 되지 않게
// 덩어리마다 살짝 부풀고, 왼쪽 위·뒤통수에 짧은 삐침 끝이 실루엣 밖으로 나온다.
const OUTER = 'M352 472 Q338 446 341 410 Q336 399 331 389 Q342 387 347 372' +
  ' C350 310 396 246 458 224 Q484 206 520 207 Q552 198 588 210 Q598 196 616 190 Q608 204 614 220' +
  ' C650 234 678 264 692 300 Q704 318 711 333 Q701 339 701 356 C708 398 707 440 700 470';
// 귀 위(그림 오른쪽): 귀 윗부분을 살짝 덮는 짧은 덩어리 두 개 → 귀 앞 가는 구레나룻 → 앞머리 시작(R0)
const RIGHT_SIDE = ' Q696 486 686 496 Q682 480 674 476 Q670 490 662 496 Q662 484 660 474 Q663 504 654 534 Q643 500 638 452';
// 왼쪽: 앞머리 마지막 골 → 관자놀이로 내려온 뾰족한 덩어리 두 개(안쪽이 더 길다) → 바깥 윤곽 시작
const LEFT_SIDE = ' Q393 478 381 510 Q374 492 364 480 Q358 494 350 500 Q348 486 352 472';
const crownPath = OUTER + RIGHT_SIDE + EDGE + LEFT_SIDE + ' Z';
const hairClip = pre => `<clipPath id="${pre}hc"><path d="${crownPath}"/></clipPath>`;
const inHair = (pre, body) => `<g clip-path="url(#${pre}hc)">${body}</g>`;
// 앞머리 끝 그늘: 골마다 위로 뾰족하게 올라가는 띠(위 경계는 왼쪽 → 오른쪽, 아래 경계는 앞머리 끝선)
function shadeTop() {
  const pts = [[R0[0] + 8, R0[1] - 40]];
  let v = R0;
  for (const [tx, ty, nx, ny] of CLUMPS) {
    pts.push([tx + (v[0] - tx) * 0.45, ty - 30], [nx + 3, ny - 34]);
    v = [nx, ny];
  }
  pts.push([376, 418]);
  return 'M' + pts.reverse().map(p => p.join(' ')).join(' L') + ` L${R0[0]} ${R0[1]}`;
}
const shadeBand = shadeTop() + EDGE + ' Z';
// 결: 정수리(가마, 그림 오른쪽 뒤)에서 앞머리 골로 퍼짐 + 관자놀이 덩어리 결
const CROWN = [588, 230];
const strands = [R0, ...CLUMPS.map(c => [c[2], c[3]])].map(([vx, vy], i) =>
  `M${CROWN[0] + (vx - CROWN[0]) * 0.25} ${CROWN[1] + 10} Q${CROWN[0] + (vx - CROWN[0]) * 0.9} ${296 + (i % 2) * 20} ${vx} ${vy - 6}`).join(' ') +
  ' M364 392 Q372 440 368 478 M684 360 Q690 420 680 470';
// 그늘(머리 모양으로 잘라 칠함): 뒤통수 쪽(빛 반대쪽) + 관자놀이·귀 위 덩어리 아래쪽
const hairShade = pre => inHair(pre,
  K.path('M626 214 C664 246 688 320 686 400 C685 440 678 462 666 470 L670 520 L760 520 L760 180 Z', HAIR.shade, 'none', 0, 'opacity="0.75"') +
  K.path('M330 438 Q360 446 392 440 L400 530 L330 530 Z', HAIR.shade, 'none', 0, 'opacity="0.85"') +
  K.path(shadeBand, HAIR.shade, 'none', 0, 'opacity="0.85"') +
  K.path(strands, 'none', HAIR.line, 2.5, 'opacity="0.5"') +
  // 천사의 고리(정수리 광택)
  K.path('M372 362 Q492 280 664 340', 'none', HAIR.hi, 11, 'opacity="0.55" stroke-dasharray="34 12 22 10 40 14 20 12 30"'));
const front = pre =>
  K.path(crownPath, HAIR.base, HAIR.line, 4) +
  hairShade(pre) +
  K.path('M700 470' + RIGHT_SIDE + EDGE + LEFT_SIDE, 'none', HAIR.line, 4);

// 눈썹: 앞머리 위에 비쳐 보이게(애니 기법) 머리카락 위에 그리고, 머리카락과 겹친 부분만 피부색으로 옅게 둘러 읽히게
const brows = (pre, f) => inHair(pre, `<g clip-path="url(#${pre}bz)"><g opacity="0.55" filter="url(#${pre}bb)">${K.brows(f, SKIN.base, 20)}</g></g>`) + K.brows(f, BROW, 9);
// 눈썹 비침은 앞머리 가운데(관자놀이 덩어리·구레나룻 제외)에만
const browZone = pre => `<clipPath id="${pre}bz"><rect x="398" y="380" width="236" height="110"/></clipPath>`;

// 얼굴 안쪽만 칠하는 클립: 앞머리 그림자, 겁먹은 창백함, 식은땀 광택
const faceClip = pre => `<clipPath id="${pre}fc"><path d="${K.FACE}"/></clipPath>` +
  `<clipPath id="${pre}sk"><path d="${K.FACE} ${K.EAR_R} ${K.EAR_L} ${K.NECK}"/></clipPath>`;
const inFace = (pre, body) => `<g clip-path="url(#${pre}fc)">${body}</g>`;
// 앞머리가 이마에 드리우는 그림자(질린 얼굴에서는 조금 식은 색)
const foreheadShadow = (pre, pale) => inFace(pre, K.path(crownPath, pale ? '#e3cfc8' : SKIN.shade, 'none', 0, 'transform="translate(5 11)"'));
// 겁먹은 얼굴: 핏기가 가셔 살짝 희고 차갑게. 얼굴·귀·목에 같이(얼굴만 하얗게 뜨지 않게), 얼굴 위쪽만 조금 더
const paleSkin = pre => `<g clip-path="url(#${pre}sk)"><rect x="340" y="250" width="360" height="570" fill="url(#${pre}pale)"/></g>`;
// 셔츠 깃·넥타이 매듭을 목 위에 다시 그려 깃이 목을 감싸게(목 아랫선이 깃 위에 떠 보이지 않게)
const collar = () =>
  K.path('M470 778 L440 800 L462 880 L507 822 Z', K.SHIRT.base, K.SHIRT.line, 3) +
  K.path('M554 778 L590 800 L566 880 L519 822 Z', K.SHIRT.base, K.SHIRT.line, 3) +
  K.path('M462 880 L507 822 L512 830 L470 878 Z', K.SHIRT.shade, 'none', 0, 'opacity="0.7"') +
  K.path('M498 820 L528 820 L523 856 L503 856 Z', '#5e1b29', '#2c0b12', 3);
// 관자놀이의 식은땀 한 방울(얼굴 안에 칠한 광택, 떠 있는 기호가 아님): 눈썹 끝과 눈꼬리 사이
const sweat = pre => inFace(pre,
  K.path('M631 480 C627 489 625 496 628 500 C632 503 636 499 635 492 C634 487 633 484 631 480 Z', '#fdfaf7', SKIN.line, 1.8, 'opacity="0.85"') +
  `<circle cx="629.6" cy="495" r="1.6" fill="#fff"/>`);

// 입: 남자 아이라 벌린 입은 작고 어두운 갈색 톤으로(립스틱처럼 빨갛지 않게)
function mouth(f) {
  const L = SKIN.lip, IN = '#5a2b2d';
  if (f.mouth === 'o') return K.path('M492 658 Q503 650 515 657 Q517 671 504 674 Q491 672 492 658 Z', IN, L, 3);
  if (f.mouth === 'scared') return K.path('M488 661 Q503 656 519 660 Q514 671 503 671 Q492 670 488 661 Z', IN, '#6e3a3a', 2.8);
  if (f.mouth === 'flat') return K.path('M491 656 Q505 659 519 655', 'none', L, 3.8);
  return K.mouth(f, SKIN);
}
// 시선 이동: 흰자 안의 눈동자·반짝임만 가로로 옮긴다(눈 윤곽은 그대로)
function lookAt(eyesSvg, dx) {
  if (!dx) return eyesSvg;
  return eyesSvg.replace(/(<rect [^>]*fill="#fff"\/>)([\s\S]*?)(<rect [^>]*lidshade)/g, `$1<g transform="translate(${dx} 0)">$2</g>$3`);
}

// 인물 그림(초상화 좌표 1024x1536, 확대 전). CG에서 재사용: <defs>${defs(pre)}</defs><g transform=…>${figure(face, pre)}</g>
export function figure(face = 'default', pre = 'hm') {
  const f = K.F(FACES[face] ? FACES[face] : face);
  return faceClip(pre) + hairClip(pre) + browZone(pre) + back +
    K.uniform({ neck: 'tie' }) +
    K.skin(SKIN, { ears: 'both' }) +
    (f.pale ? paleSkin(pre) : '') +
    collar() +
    inFace(pre, K.cheeks(SKIN, { blush: f.blush ?? 0.14 })) + // 홍조 번짐이 얼굴 밖(투명 배경)으로 새지 않게
    foreheadShadow(pre, f.pale) +
    lookAt(K.eyes(f, IRIS, { lidSkin: SKIN.base, pre, lash: 6, flick: false }), f.look) +
    mouth(f) +
    (f.sweat ? sweat(pre) : '') +
    front(pre) +
    brows(pre, f);
}
export const defs = (pre = 'hm') => K.DEFS + K.irisDefs(IRIS, pre) +
  `<filter id="${pre}bb" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>` +
  `<linearGradient id="${pre}pale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe4f3" stop-opacity="0.34"/><stop offset="0.45" stop-color="#e4e8f4" stop-opacity="0.2"/><stop offset="1" stop-color="#e4e8f4" stop-opacity="0.12"/></linearGradient>`;

export function draw(face = 'default') {
  return K.svg(K.figure(figure(face)), { defs: defs() });
}
