// 한소영: 허리까지 오는 곧은 청흑색 생머리, 눈썹 높이 일자 앞머리, 어깨 길이 옆머리(히메컷), 창백한 피부, 빨간 리본
import * as K from '../kit.js';

const SKIN = { base: '#fbece4', shade: '#e9cfc5', line: '#9a6a62', blush: '#f0a3a8', lip: '#a14652' };
const HAIR = { base: '#1c2134', shade: '#0e111c', hi: '#5a6a98', line: '#06070d' };
const IRIS = ['#11121d', '#2d3249', '#626a8c'];
// 평소 표정: 차갑고 경계하는 눈(눈꺼풀 살짝 내림)
const FACES = { ...K.FACES, default: { eye: { open: 0.94, lid: 0.08 }, brow: { dy: 2, inner: 3 }, mouth: 'neutral', blush: 0.18 } };

const back = K.path('M512 226 C398 228 332 300 328 420 C324 560 316 700 298 860 L282 1536 L742 1536 L726 860 C708 700 700 560 696 420 C692 300 626 228 512 226 Z', HAIR.base, HAIR.line, 4);
// 어깨 앞으로 흘러내린 긴 머리(옆머리 뒤)
const drapes =
  K.path('M358 640 C346 760 336 880 326 1000 C316 1120 306 1230 302 1352 L324 1316 L336 1370 L352 1300 C362 1180 374 1060 386 950 C396 850 400 740 394 650 Z', HAIR.base, HAIR.line, 4) +
  K.path('M666 640 C680 760 692 880 702 1000 C712 1120 722 1230 728 1352 L706 1316 L694 1370 L676 1300 C664 1180 652 1060 640 950 C630 850 626 740 632 650 Z', HAIR.shade, HAIR.line, 4) +
  K.path('M372 700 C362 860 346 1040 330 1250 M690 720 C700 900 712 1080 716 1260', 'none', HAIR.hi, 3, 'opacity="0.45"');
// 히메컷 옆머리: 어깨 높이에서 일자로
const sideLocks =
  K.path('M344 420 C336 520 336 660 338 800 L400 800 C400 690 398 560 388 440 Z', HAIR.base, HAIR.line, 4) +
  K.path('M684 420 C692 520 690 660 688 800 L626 800 C626 690 630 560 640 440 Z', HAIR.base, HAIR.line, 4) +
  K.path('M388 460 C398 580 400 700 400 798 L384 798 C384 690 382 570 374 470 Z', HAIR.shade, 'none', 0, 'opacity="0.8"') +
  K.path('M640 460 C630 580 626 700 626 798 L642 798 C642 690 646 570 652 470 Z', HAIR.shade, 'none', 0, 'opacity="0.8"');
// 머리 윗부분 + 일자 앞머리를 한 덩어리로(이음선 없이), 결은 정수리에서 퍼져 내려옴
const EDGE = 'L664 488 L644 482 L626 494 L604 484 L584 496 L560 485 L538 497 L514 487 L490 498 L468 486 L446 495 L424 484 L404 494 L384 483 L364 492';
const crown = 'M342 492 C330 380 368 262 440 228 C478 212 548 210 588 226 C664 258 700 380 686 492 ' + EDGE.replace('L664 488', 'L664 488') + ' Z';
const strands = [384, 404, 424, 446, 468, 490, 514, 538, 560, 584, 604, 626, 644].map((x, i) =>
  `M${512 + (x - 512) * 0.25} 236 Q${512 + (x - 512) * 0.85} ${300 + (i % 2) * 14} ${x} ${i % 2 ? 494 : 484}`).join(' ');
const bangs =
  K.path(crown, HAIR.base, HAIR.line, 4) +
  K.path('M366 468 L664 468 ' + EDGE + ' Z', HAIR.shade, 'none', 0, 'opacity="0.85"') +
  K.path(strands, 'none', HAIR.line, 2.5, 'opacity="0.45"') +
  // 천사의 고리(정수리 광택): 머리 곡면을 따라 끊어진 띠
  K.path('M384 382 Q512 300 642 382', 'none', HAIR.hi, 12, 'opacity="0.55" stroke-dasharray="38 14 26 12 44 16 22 12 40"') +
  K.path('M366 492 ' + EDGE.replace(/L/g, ' L').slice(1), 'none', HAIR.line, 4);

// 인물 그림(초상화 좌표 1024x1536, 확대 전). CG에서 재사용: <defs>${defs(pre)}</defs><g transform=…>${figure(face, pre)}</g>
export function figure(face = 'default', pre = 'so') {
  const f = K.F(FACES[face] ? FACES[face] : face);
  return back +
    K.uniform({ neck: 'ribbon' }) +
    K.skin(SKIN, { ears: 'none' }) +
    K.cheeks(SKIN, { blush: f.blush ?? 0.3, pale: f.pale }) +
    K.eyes(f, IRIS, { lidSkin: SKIN.base, pre }) +
    K.mouth(f, SKIN) +
    drapes + sideLocks + bangs +
    K.brows(f, '#3a3346');
}
export const defs = (pre = 'so') => K.DEFS + K.irisDefs(IRIS, pre);

export function draw(face = 'default') {
  return K.svg(K.figure(figure(face)), { defs: defs() });
}
