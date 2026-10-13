// 김성아: 턱 길이의 아주 짙은 초콜릿 갈색 단발(끝이 살짝 바깥으로 뻗음), 그림 오른쪽(본인 왼쪽 눈썹)으로 비스듬히 넘긴 앞머리,
// 그림 왼쪽(본인 오른쪽 관자놀이) 위 머리를 넘겨 꽂은 작은 직사각형 금색 머리핀 1개, 건강하게 살짝 그을린 피부,
// 블레이저 단추를 풀어 연 교복 + 빨간 리본. 평소엔 자신만만하게 놀리는 듯한 반쯤 웃는 얼굴.
import * as K from '../kit.js';

const SKIN = { base: '#f1ceb2', shade: '#e0ae90', line: '#94604c', blush: '#ea8f7e', lip: '#a24c48' };
const HAIR = { base: '#36211a', shade: '#22130d', hi: '#87604e', line: '#120806' };
const IRIS = ['#1d0f09', '#543120', '#b67a4c'];
const BROW = '#2c1a14';
const CLIP = { base: '#e7b62e', shade: '#b8861a', hi: '#fbe48c', line: '#5c4110' };

// 표정: look = 시선 가로 이동(-: 그림 왼쪽), wink = 그림 왼쪽 눈 감아 윙크, browL/browR = 눈썹 한쪽만 추가 이동
const FACES = {
  ...K.FACES,
  default:   { eye: { open: 0.9, lid: 0.1, bottom: 0.08 },     brow: { dy: -2, inner: 3 }, browR: -6, mouth: 'half', blush: 0.24 },
  smile:     { eye: { open: 0.84, bottom: 0.2 },               brow: { dy: -8, inner: -4 }, mouth: 'grin', wink: true, blush: 0.38, browL: 8 },
  smirk:     { eye: { open: 0.74, lid: 0.26, asym: true },     brow: { dy: 0, inner: 7, raiseR: true }, mouth: 'smirk', blush: 0.2, look: 6, glint: true },
  angry:     { eye: { open: 0.8, lid: 0.16, tilt: 10 },        brow: { dy: 8, inner: 16 }, mouth: 'pout', blush: 0.34, look: -9 },
  surprised: { eye: { open: 1.12, iris: 0.66 },                brow: { dy: -18, inner: -7 }, mouth: 'gasp', blush: 0.12, look: -10 },
};

// ---------------------------------------------------------------- 머리카락
// 뒷머리(얼굴·목 뒤): 뒤가 조금 짧은 단발이라 턱 아래 목 양옆으로만 조금 보임
const back = K.path('M336 470 C334 380 372 270 452 232 C510 208 600 214 652 252 C700 290 712 380 708 470 L712 690 Q690 704 668 694 Q640 708 612 700 Q560 716 512 712 Q462 716 414 700 Q386 708 362 694 Q340 700 318 690 Z', HAIR.shade, HAIR.line, 4);

// 끝 덩어리 잇기(오른쪽 → 왼쪽으로 진행). pts = [[끝 x, 끝 y, 다음 골 x, 다음 골 y], ...]
// hook 'R': 끝이 오른쪽 아래를 향함(골에서 짧고 가파르게 내려와 끝, 끝에서 왼쪽 골로 길게 아래로 볼록)
// hook 'L': 끝이 왼쪽 아래를 향함(골에서 끝까지 길게 아래로 볼록, 끝에서 다음 골로 짧고 가파르게)
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
// 앞머리: 오른쪽 옆머리 안쪽 이음점(RJ)에서 시작, 그림 오른쪽(본인 왼쪽 눈썹)으로 쓸어 넘긴 덩어리 4개
const RJ = [650, 470];
const BANG = [
  [640, 504, 598, 446],
  [588, 488, 540, 424],
  [530, 462, 486, 404],
  [474, 438, 436, 390],
];
const EDGE = teeth(RJ, BANG, 'R');
// 왼쪽(넘겨 꽂은 쪽): 마지막 골에서 관자놀이를 따라 내려가는 이마선 → 왼쪽 옆머리 안쪽 → 끝(바깥으로 살짝 뻗음)
const LEFT_HAIRLINE = ' Q404 398 386 440';
const LEFT_LOCK = ' C380 520 382 610 396 704' + teeth([396, 704], [[372, 722, 360, 698], [334, 720, 324, 700], [296, 722, 296, 722]], 'L');
// 오른쪽 옆머리: 바깥 끝(바깥으로 뻗음) → 덩어리 끝들 → 볼을 따라 앞머리 이음점으로
const RIGHT_LOCK = teeth([746, 720], [[716, 724, 704, 700], [680, 726, 668, 702], [638, 718, 638, 718]], 'R') +
  ' C644 640 650 580 651 520 L' + RJ.join(' ');
const OUTER = 'M296 722 C316 660 326 570 328 480 C330 400 344 330 382 280 C420 230 472 212 530 212 C604 212 664 244 690 306 C708 352 708 420 706 480 C708 570 718 660 746 720';
const crownPath = OUTER + RIGHT_LOCK + EDGE + LEFT_HAIRLINE + LEFT_LOCK + ' Z';

// 결: 가르마(그림 왼쪽 위)에서 앞머리 골과 오른쪽으로 쓸려 퍼짐, 넘겨 꽂은 쪽은 이마선에서 머리핀 쪽으로 모임
const PART = [446, 236];
const CLIP_AT = [384, 384];
const strands =
  [[436, 390], [486, 404], [540, 424], [598, 446], [650, 470]].map(([x, y], i) =>
    `M${PART[0] + (x - PART[0]) * 0.25} ${PART[1] + 6} Q${PART[0] + (x - PART[0]) * 0.95 + 34} ${272 + i * 12} ${x} ${y - 8}`).join(' ') +
  ' M560 232 Q676 280 690 420 M600 240 Q700 330 700 520' +             // 정수리 → 오른쪽 옆머리
  ' M424 396 Q404 372 394 352 M404 418 Q388 396 376 376 M436 252 Q394 290 380 344' + // 이마선 → 머리핀
  ' M372 380 Q348 420 344 500 M356 470 Q350 590 330 700 M374 560 Q378 640 372 700' + // 왼쪽 옆머리
  ' M676 520 Q684 620 704 700 M662 560 Q664 640 662 700';                 // 오른쪽 옆머리

const frontDefs = pre =>
  `<clipPath id="${pre}hc"><path d="${crownPath}"/></clipPath>` +
  `<mask id="${pre}hb" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><path d="${crownPath}" fill="#fff"/><path d="${crownPath}" fill="#000" transform="translate(-4 -30)"/></mask>`;

// 머리핀(그림 왼쪽 관자놀이 위, 작은 직사각형 금색 바레트)
const clip =
  `<g transform="translate(${CLIP_AT}) rotate(-44)">` +
  `<rect x="-32" y="-10" width="64" height="20" rx="4" fill="${CLIP.base}" stroke="${CLIP.line}" stroke-width="3.5"/>` +
  `<rect x="-28" y="3" width="56" height="5" rx="2" fill="${CLIP.shade}"/>` +
  `<rect x="-26" y="-6" width="30" height="4" rx="2" fill="${CLIP.hi}"/>` +
  `</g>`;

const front = pre =>
  K.path(crownPath, HAIR.base, HAIR.line, 4) +
  `<g clip-path="url(#${pre}hc)">` +
  // 끝선 아래쪽 그늘 띠(앞머리 덩어리 밑, 옆머리 끝)
  `<path d="${crownPath}" fill="${HAIR.shade}" opacity="0.85" mask="url(#${pre}hb)"/>` +
  // 옆머리 안쪽(볼 쪽) 그늘, 오른쪽 뒤통수 쪽 그늘
  K.path('M651 470 C672 560 676 640 668 740 L620 740 L630 470 Z', HAIR.shade, 'none', 0, 'opacity="0.7"') +
  K.path('M384 446 C360 540 362 640 372 740 L410 740 L400 446 Z', HAIR.shade, 'none', 0, 'opacity="0.7"') +
  K.path('M640 236 C690 270 712 340 712 460 L760 460 L760 236 Z', HAIR.shade, 'none', 0, 'opacity="0.45"') +
  K.path(strands, 'none', HAIR.line, 2.5, 'opacity="0.45"') +
  // 천사의 고리(정수리 광택)
  K.path('M424 314 Q520 272 664 336', 'none', HAIR.hi, 11, 'opacity="0.55" stroke-dasharray="34 12 24 10 42 14 20 12 30"') +
  `</g>` +
  K.path(crownPath, 'none', HAIR.line, 4) +
  clip;

// ---------------------------------------------------------------- 얼굴
const faceClip = pre => `<clipPath id="${pre}fc"><path d="${K.FACE}"/></clipPath>`;
const inFace = (pre, body) => `<g clip-path="url(#${pre}fc)">${body}</g>`;
const foreheadShadow = pre => inFace(pre, K.path(crownPath, SKIN.shade, 'none', 0, 'transform="translate(5 11)"'));

// 시선 이동: 흰자 안의 눈동자·반짝임만 가로로
function lookAt(eyesSvg, dx) {
  if (!dx) return eyesSvg;
  return eyesSvg.replace(/(<rect [^>]*fill="#fff"\/>)([\s\S]*?)(<rect [^>]*lidshade)/g, `$1<g transform="translate(${dx} 0)">$2</g>$3`);
}
// 윙크: 그림 왼쪽 눈을 위로 볼록한 감은 눈(^)으로
const wink = () =>
  K.path('M396 566 Q436 530 482 562', 'none', K.INK, 8) +
  K.path('M398 566 l-14 8', 'none', K.INK, 5) +
  K.path('M408 584 Q438 594 468 582', 'none', SKIN.line, 3, 'opacity="0.6"');

// 눈꺼풀을 많이 내린 눈: 바깥 눈꼬리 속눈썹이 내려온 속눈썹 끝에 붙도록 옮김(키트는 원래 눈꼬리 높이에 그림)
const fixFlick = svg => svg.replace(
  /(d="M[-\d.]+ [-\d.]+ Q[-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+)"[^>]*\/><path d=")M[-\d.]+,[-\d.]+ l/g,
  (m, head, x, y) => `${head}M${x},${y} l`);
// 차가운 눈빛(비웃음): 큰 반짝임을 작고 날카롭게, 내려온 눈꺼풀 아래로
const glint = svg => svg.replace(/<ellipse cx="([-\d.]+)" cy="([-\d.]+)" rx="([-\d.]+)" ry="([-\d.]+)" fill="#fff"\/>/g,
  (m, x, y, rx, ry) => `<ellipse cx="${+x + 4}" cy="${+y + 10}" rx="${rx * 0.55}" ry="${ry * 0.5}" fill="#fff"/>`);
function eyes(f, pre) {
  let all = fixFlick(K.eyes(f, IRIS, { lidSkin: SKIN.base, pre }));
  if (f.glint) all = glint(all);
  all = lookAt(all, f.look);
  if (!f.wink) return all;
  return wink() + all.slice(all.indexOf(`<clipPath id="${pre}eyeb"`));
}
// 눈썹: 키트와 같은 모양, 한쪽만 더 내리거나 올릴 수 있게
const EYES = [{ cx: 438, cy: 556, w: 88, side: -1 }, { cx: 584, cy: 556, w: 98, side: 1 }];
function brows(f) {
  const b = f.brow;
  return EYES.map(({ cx, cy, w, side }) => {
    const dy = b.dy + (b.raiseR && side === 1 ? -14 : 0) + ((side === -1 ? f.browL : f.browR) || 0);
    const xi = cx - side * w * 0.48, xo = cx + side * w * 0.62;
    const yi = cy - 80 + dy + b.inner, yo = cy - 74 + dy * 0.6;
    const apex = cy - 95 + dy + b.inner * 0.3;
    return K.path(`M${xi} ${yi} Q${cx + side * w * 0.1} ${apex} ${xo} ${yo}`, 'none', BROW, 8.5, 'opacity="0.92"');
  }).join('');
}

const GRIN = 'M471 640 Q506 652 539 635 Q534 684 506 690 Q478 688 471 640 Z';
function mouth(f, pre) {
  const L = SKIN.lip, IN = '#6a2630';
  switch (f.mouth) {
    case 'half': return K.path('M489 654 Q505 662 526 646', 'none', L, 4) + K.path('M526 646 l5 -3', 'none', L, 3);
    case 'smirk': return K.path('M490 659 Q511 661 529 643', 'none', L, 4) + K.path('M529 643 l6 -3', 'none', L, 3);
    case 'pout': return K.path('M486 663 Q499 651 522 659', 'none', L, 4.4) + K.path('M494 671 Q506 678 517 670', 'none', L, 3, 'opacity="0.65"');
    case 'gasp': return K.path('M490 658 Q504 648 519 658 Q521 677 505 680 Q489 677 490 658 Z', IN, L, 3);
    case 'grin': // 활짝 벌린 장난스러운 웃음: 윗니 + 혀
      return `<clipPath id="${pre}mo"><path d="${GRIN}"/></clipPath>` + K.path(GRIN, IN) +
        `<g clip-path="url(#${pre}mo)">` + K.path('M470 640 Q506 654 542 634 L540 648 Q506 664 472 652 Z', '#fbf7f2') +
        `<ellipse cx="507" cy="686" rx="20" ry="11" fill="#d46a6e"/></g>` +
        K.path(GRIN, 'none', L, 3.5) + K.path('M471 640 l-5 -4 M539 635 l5 -5', 'none', L, 3);
    default: return K.mouth(f, SKIN);
  }
}

// 인물 그림(초상화 좌표 1024x1536, 확대 전). CG에서 재사용: <defs>${defs(pre)}</defs><g transform=…>${figure(face, pre)}</g>
export function figure(face = 'default', pre = 'sa') {
  const f = K.F(FACES[face] ? FACES[face] : face);
  return faceClip(pre) + frontDefs(pre) + back +
    K.uniform({ neck: 'ribbon', open: true }) +
    K.skin(SKIN, { ears: 'none' }) +
    inFace(pre, K.cheeks(SKIN, { blush: f.blush ?? 0.24 })) +
    foreheadShadow(pre) +
    eyes(f, pre) +
    mouth(f, pre) +
    front(pre) +
    brows(f);
}
export const defs = (pre = 'sa') => K.DEFS + K.irisDefs(IRIS, pre);

export function draw(face = 'default') {
  return K.svg(K.figure(figure(face)), { defs: defs() });
}
