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
// 뒷머리(귀·얼굴 뒤): 그림 오른쪽이 뒤통수, 목덜미 쪽은 짧게 쳐서 끝이 작게 갈라짐
const back = K.path('M372 540 C356 500 346 450 348 400 C352 300 410 226 494 216 C586 206 668 244 692 326 C702 376 702 440 698 486 C694 512 690 534 684 552 Q676 546 668 552 Q660 568 648 576 C652 550 654 520 652 470 L380 470 Z', HAIR.shade, HAIR.line, 4);

// 앞머리: 골(V)과 끝(T)을 오른쪽 → 왼쪽 순으로. 끝은 왼쪽으로 살짝 휘어(머리를 그림 왼쪽으로 빗음) 길이가 들쭉날쭉
const R0 = [638, 452];
const CLUMPS = [ // [끝 x, 끝 y, 다음 골 x, 다음 골 y]
  [624, 458, 606, 424],
  [590, 452, 574, 400],
  [552, 462, 536, 420],
  [514, 476, 498, 416],
  [478, 458, 460, 426],
  [440, 450, 424, 418],
  [404, 460, 388, 436],
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
// 정수리 + 앞머리 + 옆머리(왼쪽 관자놀이 덩어리, 오른쪽 귀 위 덩어리와 구레나룻)를 한 덩어리로
// 오른쪽: 뒤통수 쪽 덩어리 → 귀 윗부분을 살짝 덮는 덩어리 → 귀 앞 구레나룻 → 앞머리 시작(R0)
const RIGHT_SIDE = 'Q692 458 688 460 Q684 474 672 484 Q666 472 660 470 Q662 498 654 526 Q642 496 638 452';
// 왼쪽: 앞머리 끝 → 관자놀이 덩어리 → 바깥 덩어리
const LEFT_SIDE = ' Q388 484 364 506 Q358 486 356 468 Q350 474 344 478';
const crownPath = 'M344 478 Q340 440 344 400 C350 300 410 226 494 214 C540 206 570 204 592 210 Q598 196 616 190 Q608 204 614 220 C656 240 682 280 692 316 C698 346 700 380 699 410 Q701 440 697 468 ' + RIGHT_SIDE + EDGE + LEFT_SIDE + ' Z';
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
// 결: 정수리(가마, 그림 오른쪽 뒤)에서 앞머리 골로 퍼짐
const CROWN = [588, 230];
const strands = [R0, ...CLUMPS.map(c => [c[2], c[3]])].map(([vx, vy], i) =>
  `M${CROWN[0] + (vx - CROWN[0]) * 0.25} ${CROWN[1] + 10} Q${CROWN[0] + (vx - CROWN[0]) * 0.9} ${296 + (i % 2) * 20} ${vx} ${vy - 6}`).join(' ');
const front =
  K.path(crownPath, HAIR.base, HAIR.line, 4) +
  // 오른쪽(빛 반대쪽) 그늘
  K.path('M630 236 C668 262 696 320 699 410 Q701 440 697 468 ' + RIGHT_SIDE.split(' Q662 498')[0] + ' C668 400 664 300 630 236 Z', HAIR.shade, 'none', 0, 'opacity="0.75"') +
  K.path(shadeBand, HAIR.shade, 'none', 0, 'opacity="0.85"') +
  K.path(strands, 'none', HAIR.line, 2.5, 'opacity="0.5"') +
  // 천사의 고리(정수리 광택)
  K.path('M372 362 Q492 280 664 340', 'none', HAIR.hi, 11, 'opacity="0.55" stroke-dasharray="34 12 22 10 40 14 20 12 30"') +
  K.path('M697 468 ' + RIGHT_SIDE + EDGE + LEFT_SIDE, 'none', HAIR.line, 4);
// 얼굴 안쪽만 칠하는 클립: 앞머리 그림자, 겁먹은 창백함, 식은땀 광택
const faceClip = pre => `<clipPath id="${pre}fc"><path d="${K.FACE}"/></clipPath>`;
const inFace = (pre, body) => `<g clip-path="url(#${pre}fc)">${body}</g>`;
// 앞머리가 이마에 드리우는 그림자(질린 얼굴에서는 차가운 회보라)
const foreheadShadow = (pre, pale) => inFace(pre, K.path(crownPath, pale ? '#cbc6d6' : SKIN.shade, 'none', 0, 'transform="translate(5 11)"'));
// 겁먹은 얼굴: 얼굴 전체가 핏기 없이 희고 차갑게(띠 모양이 생기지 않게 고르게, 위쪽만 조금 더)
const paleFace = pre => inFace(pre, `<rect x="360" y="250" width="300" height="470" fill="url(#${pre}pale)"/>`);
// 관자놀이의 식은땀 한 방울(얼굴 안에 칠한 광택, 떠 있는 기호가 아님)
const sweat = pre => inFace(pre,
  K.path('M641 528 C636 538 634 546 638 551 C642 554 647 550 646 542 C645 536 643 532 641 528 Z', '#fdfaf7', SKIN.line, 1.8, 'opacity="0.85"') +
  `<circle cx="639.5" cy="546" r="1.8" fill="#fff"/>`);

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
  return faceClip(pre) + back +
    K.uniform({ neck: 'tie' }) +
    K.skin(SKIN, { ears: 'both' }) +
    inFace(pre, K.cheeks(SKIN, { blush: f.blush ?? 0.14 })) + // 홍조 번짐이 얼굴 밖(투명 배경)으로 새지 않게
    foreheadShadow(pre, f.pale) +
    (f.pale ? paleFace(pre) : '') +
    lookAt(K.eyes(f, IRIS, { lidSkin: SKIN.base, pre, lash: 6, flick: false }), f.look) +
    mouth(f) +
    (f.sweat ? sweat(pre) : '') +
    front +
    K.brows(f, BROW, 9);
}
export const defs = (pre = 'hm') => K.DEFS + K.irisDefs(IRIS, pre) +
  `<linearGradient id="${pre}pale" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ddf1" stop-opacity="0.5"/><stop offset="0.6" stop-color="#e2e7f4" stop-opacity="0.32"/><stop offset="1" stop-color="#e2e7f4" stop-opacity="0.24"/></linearGradient>`;

export function draw(face = 'default') {
  return K.svg(K.figure(figure(face)), { defs: defs() });
}
