// cg_prologue — 1장 첫 컷: 아직 열려 있는 현관 유리문을 등지고 선 희민(무릎 위, 크게).
// 분홍 일기장과 리본 맨 사탕 상자를 두 손에 들고 내려다본다(설렘 + 긴장). 한쪽 어깨에 가방.
// 뒤에서 들어오는 차가운 달빛이 머리·어깨 테두리를 비추고, 문 위 초록 비상구 표시등, 양옆 신발장,
// 한쪽에 붉게 희미한 음료 자판기, 벽에 기대 세운 접이식 사다리, 가장자리의 어두운 복도 입구.
import * as K from '../kit.js';
import { figure as heeminFigure, defs as heeminDefs } from '../chars/heemin.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'pr'; // 이 그림의 id 접두어
const EINK = '#05060a'; // 배경 선

// ---------------------------------------------------------------- 한 점 투시(소실점 = 희민의 눈높이)
// 뒷벽(현관문 벽) 평면 좌표 (x, y)를 깊이 배율 s(1 = 뒷벽, 클수록 가까움)로 옮긴다
const VP = [536, 337];
const at = (s, x, y) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
const c = (s, x, y) => pt(at(s, x, y));
const quad = (a, b, d, e) => `M${a} L${b} L${d} L${e} Z`;
const WL = 100, WR = 900, WT = 40, FB = 760; // 뒷벽 왼쪽·오른쪽·위, 바닥선
const DL = 350, DR = 832, DT = 196; // 현관문(양쪽 문짝) 틀 안쪽
const DM = (DL + DR) / 2;

// ---------------------------------------------------------------- 희민 배치(초상화 좌표 → 그림 좌표)
const FS = 0.6, FX = 548, FY = 132; // 배율, 몸 중심 x, 정수리 높이
const FT = `translate(${f1(FX - 512 * FS)} ${f1(FY - 214 * FS)}) scale(${FS})`;

const NAVY = K.NAVY, SHIRT = K.SHIRT;
const SLACK = { base: '#3d3f49', shade: '#2a2c34', light: '#4f525e', line: '#0e0f14' };
const SKIN = { base: '#fae7d9', shade: '#e9c9b6', line: '#9a6a5c' };
const PINK = { base: '#ee9cb6', shade: '#c97391', light: '#fbd0dd', line: '#6e2c45' };
const BOX = { base: '#d6d0ee', shade: '#a59ecb', top: '#ece9f9', line: '#3e3760' };
const RIB = { base: '#d2384c', shade: '#97202f', hi: '#f28c99', line: '#4b0c14' };
const BAG = { base: '#2c2b30', shade: '#18171b', line: '#050506' };

// 설렘 섞인 긴장: 눈을 내리깔고(눈동자 아래로), 눈썹 안쪽은 걱정스레 올라감, 수줍은 작은 미소와 짙은 홍조
const FACE = { eye: { open: 0.7 }, brow: { dy: -2, inner: -12 }, mouth: 'smile', blush: 0.6 };
// 작은 미소의 입꼬리가 살짝 떨림(긴장)
const SHY_MOUTH = 'M488 651 Q499 661 511 656 Q519 652 525 655';

// 눈동자만 아래로(내려다보는 시선)
const gazeDown = (svg, dx, dy) =>
  svg.replace(/(<rect [^>]*fill="#fff"\/>)([\s\S]*?)(<rect [^>]*lidshade)/g, `$1<g transform="translate(${dx} ${dy})">$2</g>$3`);

// 블레이저 아랫단 + 바지(초상화 좌표, 몸통 그림 아래로 이어 그림)
function lowerBody() {
  let s = '';
  // 바지: 두 다리(살짝 벌림), 무릎 아래는 그림 밖
  const legL = 'M338 1760 C330 1960 330 2200 338 2460 L344 2640 L508 2640 L510 2460 C512 2260 512 2060 512 1860 Z';
  const legR = 'M512 1860 C514 2060 520 2260 528 2460 L534 2640 L702 2640 L704 2460 C710 2200 708 1960 700 1760 Z';
  s += P(legL, SLACK.base, SLACK.line, 4) + P(legR, SLACK.shade, SLACK.line, 4);
  s += P('M424 1960 C422 2200 424 2420 426 2640 M616 1960 C618 2200 616 2420 614 2640', 'none', SLACK.line, 2.5, 'opacity="0.5"'); // 바지 주름선
  s += P('M338 1820 C334 2040 336 2300 344 2640 L362 2640 C354 2300 352 2040 356 1820 Z', SLACK.light, 'none', 0, 'opacity="0.45"');
  s += P('M470 2360 Q490 2378 504 2372 M548 2366 Q570 2380 590 2370', 'none', SLACK.line, 2.5, 'opacity="0.45"'); // 무릎 위 주름
  // 블레이저 아랫단(엉덩이까지): 둘째 단추 아래로 앞자락이 둥글게 벌어짐
  const hemL = 'M290 1430 C294 1580 302 1730 312 1888 C380 1914 450 1920 494 1916 C502 1820 508 1640 512 1400 Z';
  const hemR = 'M512 1400 C518 1640 526 1820 536 1916 C590 1920 664 1914 726 1888 C736 1730 744 1580 748 1430 Z';
  s += P(hemL, NAVY.base, NAVY.line, 4) + P(hemR, NAVY.shade, NAVY.line, 4);
  s += P('M290 1430 C294 1580 302 1730 312 1888 C324 1893 336 1897 348 1900 C336 1740 330 1580 330 1430 Z', NAVY.light, 'none', 0, 'opacity="0.4"');
  s += P('M748 1430 C744 1580 736 1730 726 1888 C712 1894 700 1898 688 1900 C702 1740 708 1580 708 1430 Z', NAVY.line, 'none', 0, 'opacity="0.35"');
  s += P('M512 1400 C510 1600 504 1800 494 1916', 'none', NAVY.line, 3.5);
  return s;
}

// 가방: 그림 오른쪽 어깨에 멘 끈 + 몸 뒤로 비어져 나온 가방 몸통
function bag() {
  let s = P('M772 1180 C816 1176 850 1192 862 1232 L878 1640 C872 1676 842 1690 806 1688 L764 1680 Z', BAG.base, BAG.line, 4);
  s += P('M816 1190 C840 1202 854 1230 856 1260 L870 1640 C862 1664 846 1676 826 1680 Z', BAG.shade, 'none', 0, 'opacity="0.8"');
  s += P('M800 1290 L862 1296 M808 1420 L868 1424', 'none', '#47454c', 3);
  return s;
}
const strap = () =>
  P('M640 800 C662 806 682 816 698 830 C716 900 726 1010 732 1120 L694 1128 C690 1020 680 920 664 846 C656 830 648 818 640 800 Z', BAG.base, BAG.line, 3.5) +
  P('M696 1010 l32 -4 l2 24 l-33 4 Z', '#5d5a52', BAG.line, 2.5) + // 길이 조절 고리
  P('M700 834 C714 900 722 1000 726 1100', 'none', '#4a4950', 3, 'opacity="0.7"');

// 일기장(분홍 하드커버)을 쟁반처럼 평평하게 들고 그 위에 사탕 상자: 눈높이에서 비스듬히 내려다본 모습
// 일기장 윗면(먼 변 y0, 가까운 변 y1), 두께 th
const DY0 = 1604, DY1 = 1772, DTH = 44;
const DXF = [324, 700], DXN = [298, 726]; // 먼 변·가까운 변 x 범위
function items() {
  let s = '';
  // 두께(책장 면 + 아래 표지)
  s += P(`M${DXN[0]} ${DY1} L${DXN[1]} ${DY1} L${DXN[1] - 2} ${DY1 + DTH} L${DXN[0] + 2} ${DY1 + DTH} Z`, '#f3ece0', PINK.line, 3.5);
  s += P(`M${DXN[0] + 10} ${DY1 + 13} L${DXN[1] - 10} ${DY1 + 13} M${DXN[0] + 10} ${DY1 + 24} L${DXN[1] - 10} ${DY1 + 24}`, 'none', '#cbbfae', 2);
  s += P(`M${DXN[0]} ${DY1 + DTH - 9} L${DXN[1]} ${DY1 + DTH - 9} L${DXN[1] - 2} ${DY1 + DTH} L${DXN[0] + 2} ${DY1 + DTH} Z`, PINK.shade, PINK.line, 3);
  // 앞표지(윗면) + 테두리 장식 + 책등 쪽 그늘
  s += P(`M${DXF[0]} ${DY0} L${DXF[1]} ${DY0} L${DXN[1]} ${DY1} L${DXN[0]} ${DY1} Z`, PINK.base, PINK.line, 4);
  s += P(`M${DXF[0] + 34} ${DY0 + 14} L${DXF[1] - 26} ${DY0 + 14} L${DXN[1] - 30} ${DY1 - 16} L${DXN[0] + 40} ${DY1 - 16} Z`, 'none', PINK.light, 4);
  s += P(`M${DXF[0]} ${DY0} L${DXF[0] + 22} ${DY0} L${DXN[0] + 24} ${DY1} L${DXN[0]} ${DY1} Z`, PINK.shade, 'none', 0, 'opacity="0.85"');
  // 잠금 띠(오른쪽 옆)
  s += P(`M${DXN[1] - 8} ${DY1 - 50} L${DXN[1] + 12} ${DY1 - 50} L${DXN[1] + 12} ${DY1 + 32} L${DXN[1] - 6} ${DY1 + 32} Z`, PINK.shade, PINK.line, 3);
  s += `<circle cx="${DXN[1] + 3}" cy="${DY1 + 4}" r="8" fill="#e8c56a" stroke="#6e5011" stroke-width="2.5"/>`;
  // 표지 앞쪽 가운데 눌린 하트 무늬(글자 없음)
  s += P('M512 1752 C494 1740 482 1732 484 1722 C486 1712 502 1710 512 1720 C522 1710 538 1712 540 1722 C542 1732 530 1740 512 1752 Z', PINK.light, PINK.line, 2.5);
  // 사탕 상자: 표지 뒤쪽 절반에 얹힘(앞면 + 윗면), 십자 리본 + 나비 매듭
  const bx0 = 430, bx1 = 606, by0 = 1610, by1 = 1696, bt = 34, bi = 10;
  s += `<ellipse cx="${(bx0 + bx1) / 2 + 6}" cy="${by1 + 2}" rx="${(bx1 - bx0) / 2 + 12}" ry="11" fill="${PINK.shade}"/>`; // 표지에 진 그림자
  s += P(`M${bx0} ${by0} L${bx1} ${by0} L${bx1 - bi} ${by0 - bt} L${bx0 + bi} ${by0 - bt} Z`, BOX.top, BOX.line, 3.5);
  s += P(`M${bx0} ${by0} L${bx1} ${by0} L${bx1} ${by1} L${bx0} ${by1} Z`, BOX.base, BOX.line, 4);
  s += P(`M${bx1 - 30} ${by0 + 3} L${bx1 - 3} ${by0 + 3} L${bx1 - 3} ${by1 - 3} L${bx1 - 30} ${by1 - 3} Z`, BOX.shade, 'none', 0, 'opacity="0.7"');
  const rx = (bx0 + bx1) / 2;
  s += P(`M${rx - 9} ${by0} L${rx + 9} ${by0} L${rx + 9} ${by1} L${rx - 9} ${by1} Z`, RIB.base, RIB.line, 2.5); // 세로 리본(앞면)
  s += P(`M${rx - 8} ${by0 - bt} L${rx + 8} ${by0 - bt} L${rx + 9} ${by0} L${rx - 9} ${by0} Z`, RIB.base, RIB.line, 2.5); // 세로 리본(윗면)
  s += P(`M${bx0 + bi / 2} ${by0 - bt / 2 - 6} L${bx1 - bi / 2} ${by0 - bt / 2 - 6} L${bx1 - bi / 2 + 1} ${by0 - bt / 2 + 6} L${bx0 + bi / 2 - 1} ${by0 - bt / 2 + 6} Z`, RIB.base, RIB.line, 2.5); // 가로 리본(윗면)
  // 나비 매듭(윗면 가운데)
  const ky = by0 - bt / 2;
  s += P(`M${rx} ${ky} C${rx - 26} ${ky - 34} ${rx - 60} ${ky - 32} ${rx - 60} ${ky - 12} C${rx - 60} ${ky + 8} ${rx - 26} ${ky + 6} ${rx} ${ky + 2} Z`, RIB.base, RIB.line, 3);
  s += P(`M${rx} ${ky} C${rx + 26} ${ky - 34} ${rx + 60} ${ky - 32} ${rx + 60} ${ky - 12} C${rx + 60} ${ky + 8} ${rx + 26} ${ky + 6} ${rx} ${ky + 2} Z`, RIB.shade, RIB.line, 3);
  s += P(`M${rx - 4} ${ky + 2} L${rx - 28} ${ky + 44} L${rx - 16} ${ky + 48} L${rx} ${ky + 12} Z M${rx + 4} ${ky + 2} L${rx + 28} ${ky + 44} L${rx + 16} ${ky + 48} L${rx} ${ky + 12} Z`, RIB.shade, RIB.line, 2.5);
  s += `<ellipse cx="${rx}" cy="${ky}" rx="12" ry="10" fill="${RIB.base}" stroke="${RIB.line}" stroke-width="2.5"/>`;
  s += P(`M${rx - 50} ${ky - 16} Q${rx - 36} ${ky - 26} ${rx - 20} ${ky - 12}`, 'none', RIB.hi, 3.5, 'opacity="0.85"');
  return s;
}

// 팔: 팔꿈치를 옆구리에 붙이고 아래팔은 앞으로(짧게 보임) → 일기장 양옆을 받쳐 듦
const mirrorX = (d, side) => side < 0 ? d : d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f1(1024 - x)} ${y}`);
function arms() {
  let s = '';
  for (const side of [-1, 1]) { // -1 = 그림 왼쪽(오른팔)
    const m = d => mirrorX(d, side);
    const C = side < 0 ? NAVY.base : NAVY.shade;
    s += P(m('M248 1360 C246 1440 250 1500 262 1552 C270 1600 278 1636 290 1664 L348 1668 C354 1636 354 1596 348 1560 C342 1520 338 1470 334 1400 Z'), C, NAVY.line, 4);
    s += P(m('M262 1552 C270 1600 278 1636 290 1664 L306 1666 C294 1630 288 1590 284 1548 Z'), side < 0 ? NAVY.light : NAVY.line, 'none', 0, 'opacity="0.4"');
    s += P(m('M290 1500 Q312 1524 338 1520'), 'none', NAVY.line, 3, 'opacity="0.7"'); // 팔꿈치 주름
    s += `<ellipse cx="${side < 0 ? 319 : 705}" cy="1668" rx="32" ry="12" fill="${SHIRT.shade}" stroke="${SHIRT.line}" stroke-width="3"/>`; // 소맷부리
  }
  return s;
}

// 손: 엄지는 표지 위, 손바닥은 일기장 옆 모서리를 감싸고, 나머지 손가락 끝이 일기장 밑에서 살짝 보임
function hands() {
  let s = '';
  for (const side of [-1, 1]) {
    const m = d => mirrorX(d, side);
    s += P(m('M304 1670 C290 1696 284 1736 288 1776 C292 1802 306 1814 322 1812 L342 1806 L344 1676 Z'), SKIN.base, SKIN.line, 3.5);
    s += P(m('M292 1730 C292 1764 298 1790 312 1806'), 'none', SKIN.shade, 6, 'opacity="0.9"');
    s += P(m('M290 1744 Q300 1748 312 1744 M292 1772 Q302 1776 316 1770'), 'none', SKIN.line, 2.2, 'opacity="0.7"'); // 말아 쥔 손가락 마디
    s += P(m('M318 1810 C318 1824 332 1828 340 1818 Z M338 1812 C340 1826 354 1828 360 1816 Z'), SKIN.base, SKIN.line, 2.5);
    s += P(m('M328 1694 C346 1690 368 1698 386 1712 C394 1718 392 1730 382 1730 C364 1730 344 1722 330 1714 Z'), SKIN.base, SKIN.line, 3);
    s += P(m('M378 1714 C384 1717 386 1722 383 1726'), 'none', SKIN.line, 2, 'opacity="0.6"'); // 엄지손톱
  }
  return s;
}

// 희민 전체(초상화 좌표 그대로, 배치 변환은 바깥에서)
function boyBody() {
  const fig = gazeDown(heeminFigure(FACE, `${ID}h`), -3, 15).replace('M482 648 Q504 668 530 646', SHY_MOUTH);
  // 몸통 그림의 맨 아래 가로선(초상화 잘린 선)은 아랫단 그림이 덮는다
  return bag() + lowerBody() + fig + strap() + arms() + items() + hands();
}

// ---------------------------------------------------------------- 배경
function outside() {
  // 문틀 안으로 보이는 바깥: 남색 밤하늘, 달빛 받은 운동장, 먼 담장과 나무 실루엣
  let s = `<rect x="${DL}" y="${DT}" width="${DR - DL}" height="${FB - DT}" fill="url(#${ID}sky)"/>`;
  s += `<ellipse cx="${DR - 60}" cy="${DT + 40}" rx="140" ry="90" fill="#9fb6dc" opacity="0.35" filter="url(#${ID}b20)"/>`; // 문 위쪽 너머 달무리
  s += P(`M${DL} 356 C420 348 520 354 600 350 C680 346 760 354 ${DR} 352 L${DR} ${FB} L${DL} ${FB} Z`, `url(#${ID}yard)`);
  // 먼 담장 + 철망 기둥
  s += P(`M${DL} 334 L${DR} 334 L${DR} 356 L${DL} 356 Z`, '#2a3755');
  s += P(`M${DL} 322 L${DR} 322`, 'none', '#3c4c6e', 2);
  let posts = '';
  for (let x = DL + 20; x < DR; x += 46) posts += `M${x} 322 L${x} 336 `;
  s += P(posts, 'none', '#34425f', 2);
  // 앙상한 나무(먼 실루엣)
  s += P(`M392 336 L396 262 L384 236 M396 262 L410 228 M396 288 L374 262 M760 336 L756 244 L772 214 M756 270 L734 238 M758 294 L788 270 M812 336 L814 276 L828 254`, 'none', '#1a2236', 4);
  // 운동장 흙의 달빛 결
  s += P(`M${DL} 430 L${DR} 418 M${DL} 540 L${DR} 520 M${DL} 660 L${DR} 636`, 'none', '#b4c6e4', 2, 'opacity="0.22"');
  return s;
}

function doors() {
  let s = '';
  const fr = '#3a4254', frD = '#1c212c';
  // 왼쪽 문짝(닫힘): 유리 너머 바깥이 흐릿하게 + 반사
  s += P(`M${DL} ${DT} L${DM} ${DT} L${DM} ${FB} L${DL} ${FB} Z`, '#0b1222', 'none', 0, 'opacity="0.45"');
  s += P(`M${DL + 40} ${DT + 30} L${DL + 90} ${DT + 30} L${DL + 20} ${FB - 60} L${DL + 14} ${FB - 60} Z M${DL + 120} ${DT + 30} L${DL + 142} ${DT + 30} L${DL + 70} ${FB - 100} L${DL + 60} ${FB - 100} Z`, '#c8d8f2', 'none', 0, 'opacity="0.12"');
  s += P(`M${DL} ${DT} L${DM} ${DT} L${DM} ${FB} L${DL} ${FB} Z M${DL + 18} ${DT + 18} L${DM - 14} ${DT + 18} L${DM - 14} ${FB - 70} L${DL + 18} ${FB - 70} Z`, fr, EINK, 3, 'fill-rule="evenodd"');
  s += P(`M${DL + 30} 520 L${DM - 26} 520 L${DM - 26} 534 L${DL + 30} 534 Z`, '#55607a', EINK, 2.5);
  // 오른쪽 문짝(바깥으로 반쯤 열림): 문틀 밖으로 비스듬히 밀려 나가 좁고 짧아 보임
  const hx = DR, ox = DM + 110; // 경첩 쪽(오른쪽 문틀), 열린 문 끝
  s += P(`M${hx} ${DT} L${ox} ${DT + 44} L${ox} ${FB - 28} L${hx} ${FB} Z`, '#0d1628', 'none', 0, 'opacity="0.38"');
  s += P(`M${hx} ${DT} L${ox} ${DT + 44} L${ox} ${FB - 28} L${hx} ${FB} Z M${hx - 12} ${DT + 18} L${ox + 10} ${DT + 56} L${ox + 10} ${FB - 90} L${hx - 12} ${FB - 70} Z`, fr, EINK, 3, 'fill-rule="evenodd"');
  s += P(`M${ox + 4} ${DT + 44} L${ox + 4} ${FB - 28}`, 'none', '#c4d6f4', 3, 'opacity="0.85"'); // 열린 문 모서리에 맺힌 달빛
  s += P(`M${ox + 20} 510 L${hx - 20} 518 L${hx - 20} 530 L${ox + 20} 524 Z`, '#55607a', EINK, 2);
  // 바깥 문틀 + 가운데 기둥 + 문턱
  s += P(`M${DL - 16} ${DT - 16} L${DR + 16} ${DT - 16} L${DR + 16} ${FB} L${DR} ${FB} L${DR} ${DT} L${DL} ${DT} L${DL} ${FB} L${DL - 16} ${FB} Z`, frD, EINK, 3);
  s += P(`M${DM} ${DT} L${DM} ${FB}`, 'none', frD, 8);
  s += P(`M${DL - 16} ${FB - 4} L${DR + 16} ${FB - 4} L${DR + 16} ${FB + 8} L${DL - 16} ${FB + 8} Z`, '#2a3040', EINK, 2.5);
  return s;
}

function exitSign() {
  // 초록 비상구 표시등(뛰어나가는 사람 그림, 글자 없음): 문 위 오른쪽
  const x = 694, y = 120, w = 104, h = 46;
  let s = `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="120" ry="70" fill="#3ddc84" opacity="0.2" filter="url(#${ID}b20)"/>`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#2fb36a" stroke="${EINK}" stroke-width="3"/>`;
  s += `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" fill="#7af0ae"/>`;
  s += `<rect x="${x + 64}" y="${y + 10}" width="22" height="26" fill="#1f8a4f"/>`;
  s += `<circle cx="${x + 40}" cy="${y + 14}" r="4.5" fill="#1f8a4f"/>`;
  s += P(`M${x + 38} ${y + 19} L${x + 34} ${y + 30} M${x + 36} ${y + 24} L${x + 46} ${y + 22} L${x + 50} ${y + 27} M${x + 36} ${y + 24} L${x + 28} ${y + 22} M${x + 34} ${y + 30} L${x + 42} ${y + 35} M${x + 34} ${y + 30} L${x + 26} ${y + 36}`, 'none', '#1f8a4f', 3.4);
  s += P(`M${x + 52} ${y + 24} L${x + 60} ${y + 24}`, 'none', '#1f8a4f', 3);
  // 초록 빛이 문틀 위에 살짝 번짐
  s += P(`M${x - 40} ${DT - 16} L${x + w + 40} ${DT - 16}`, 'none', '#4fd08a', 3, 'opacity="0.35"');
  return s;
}

function walls() {
  let s = '';
  s += P(quad(c(1, WL, WT), c(1, WR, WT), c(4, WR, WT), c(4, WL, WT)), '#07090f', EINK, 3);
  s += P(quad(c(1, WL, WT), c(1, WL, FB), c(4, WL, FB), c(4, WL, WT)), '#0c1019', EINK, 3);
  s += P(quad(c(1, WR, WT), c(1, WR, FB), c(4, WR, FB), c(4, WR, WT)), '#0e121c', EINK, 3);
  s += P(quad(c(1, WL, WT), c(1, WR, WT), c(1, WR, FB), c(1, WL, FB)), '#10151f', EINK, 3);
  // 걸레받이
  s += P(`M${WL} ${FB - 16} L${DL - 16} ${FB - 16} M${DR + 16} ${FB - 16} L${WR} ${FB - 16}`, 'none', '#070a10', 4);
  // 천장의 꺼진 형광등
  for (const sd of [1.2, 1.7]) s += P(quad(c(sd, DM - 110, WT), c(sd, DM + 110, WT), c(sd + 0.1, DM + 110, WT), c(sd + 0.1, DM - 110, WT)), '#1a1f2b', EINK, 2);
  return s;
}

function floor() {
  let s = P(quad(c(1, WL, FB), c(1, WR, FB), c(4, WR, FB), c(4, WL, FB)), '#131925', EINK, 3);
  let g = '';
  for (let x = WL - 700; x <= WR + 700; x += 92) g += `M${c(1, x, FB)} L${c(4, x, FB)} `;
  for (const sd of [1.09, 1.2, 1.34, 1.52, 1.76, 2.08, 2.52, 3.16]) g += `M${c(sd, WL - 400, FB)} L${c(sd, WR + 400, FB)} `;
  s += `<g clip-path="url(#${ID}floorClip)">` + P(g, 'none', '#06080d', 2.5);
  // 열린 문틈과 유리로 쏟아져 들어온 달빛(바닥에 길게)
  s += P(quad(c(1, DM + 120, FB), c(1, DR, FB), c(2.9, DR - 70, FB), c(2.9, DM + 30, FB)), '#90b0e2', 'none', 0, `opacity="0.36" filter="url(#${ID}b4)"`);
  s += P(quad(c(1, DL + 20, FB), c(1, DM - 16, FB), c(2.9, DM - 90, FB), c(2.9, DL - 50, FB)), '#7f9dd0', 'none', 0, `opacity="0.15" filter="url(#${ID}b4)"`);
  s += P(quad(c(1, DM + 140, FB), c(1, DM + 190, FB), c(1.5, DM + 170, FB), c(1.5, DM + 128, FB)), '#cfe0fb', 'none', 0, `opacity="0.16" filter="url(#${ID}b4)"`);
  // 자판기의 붉은 빛이 바닥에 번짐
  s += `<ellipse cx="270" cy="840" rx="220" ry="80" fill="#c2303a" opacity="0.22" filter="url(#${ID}b20)"/>`;
  s += '</g>';
  return s;
}

// 신발장(옆 벽에 붙은 나무 칸칸이): side -1 = 왼쪽 벽, 1 = 오른쪽 벽
function shoeCabinet(side, s0, s1, rows, cols) {
  const wx = side < 0 ? WL : WR, fx = wx - side * 84, topY = 430;
  let s = '';
  s += P(quad(c(s0, wx, topY), c(s1, wx, topY), c(s1, fx, topY), c(s0, fx, topY)), '#3a2a20', EINK, 2.5);
  s += P(quad(c(s0, fx, topY), c(s1, fx, topY), c(s1, fx, FB), c(s0, fx, FB)), '#2a1e16', EINK, 3);
  s += P(quad(c(s0, fx, topY), c(s0, fx + side * 14, topY), c(s0, fx + side * 14, FB), c(s0, fx, FB)), '#352619', EINK, 2);
  let holes = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const a0 = s0 + (s1 - s0) * (i + 0.12) / cols, a1 = s0 + (s1 - s0) * (i + 0.88) / cols;
    const y0 = topY + 14 + (FB - topY - 40) * j / rows, y1 = topY + 14 + (FB - topY - 40) * (j + 0.8) / rows;
    holes += quad(c(a0, fx, y0), c(a1, fx, y0), c(a1, fx, y1), c(a0, fx, y1)) + ' ';
  }
  s += P(holes, '#0a0705', '#160f0a', 1.5);
  for (const [i, j] of [[1, 2], [2, 1], [0, 3], [1, 0], [2, 3]].filter(([i]) => i < cols)) {
    const a = s0 + (s1 - s0) * (i + 0.5) / cols, y = topY + 14 + (FB - topY - 40) * (j + 0.68) / rows;
    const p = at(a, fx, y);
    s += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(5 * a)}" ry="${f1(4 * a)}" fill="#6e6a64" opacity="0.55"/>`; // 실내화 앞코
  }
  s += P(`M${c(s0, fx, topY)} L${c(s1, fx, topY)}`, 'none', '#8ea6cf', 2, 'opacity="0.45"');
  return s;
}

function vendingMachine() {
  // 문 왼쪽 뒷벽에 붙은 음료 자판기: 어두운 붉은 몸통, 위쪽 견본 진열창이 희미하게 붉게 빛남, 동전 투입구, 아래 꺼내는 곳
  // 앞면은 깊이 SF(뒷벽보다 조금 앞), 오른쪽 옆면이 뒷벽까지 이어짐
  const SF = 1.06, X0 = 186, X1 = 324, Y0 = 290;
  const F = (x, y) => at(SF, x, y), Q = (x0, y0, x1, y1) => quad(pt(F(x0, y0)), pt(F(x1, y0)), pt(F(x1, y1)), pt(F(x0, y1)));
  const [fx0, fy0] = F(X0, Y0), [fx1, fy1] = F(X1, FB);
  let s = `<rect x="${f1(fx0 - 60)}" y="${f1(fy0 - 40)}" width="${f1(fx1 - fx0 + 120)}" height="${f1(fy1 - fy0 + 60)}" fill="#ff4b4f" opacity="0.1" filter="url(#${ID}b20)"/>`;
  s += P(quad(c(SF, X1, Y0), c(1, X1, Y0), c(1, X1, FB), c(SF, X1, FB)), '#2c0a0e', EINK, 2.5); // 오른쪽 옆면
  s += P(quad(c(SF, X0, Y0), c(1, X0, Y0), c(1, X1, Y0), c(SF, X1, Y0)), '#1c0609', EINK, 2); // 윗면(눈높이보다 위라 거의 안 보임)
  s += P(Q(X0, Y0, X1, FB), '#521419', EINK, 3);
  s += P(Q(X0 + 3, Y0 + 4, X0 + 12, FB - 4), '#6e1d24', 'none', 0, 'opacity="0.8"');
  // 견본 진열창(3단): 안쪽에서 흐린 분홍빛
  s += P(Q(X0 + 12, Y0 + 18, X1 - 12, Y0 + 200), '#b8585c', EINK, 2.5);
  const canC = ['#8e2a31', '#a5652a', '#33507e', '#b3ab9c', '#3e6e44'];
  let cans = '';
  for (let j = 0; j < 3; j++) {
    const cy = Y0 + 30 + j * 58;
    for (let i = 0; i < 5; i++) {
      const cx = X0 + 22 + i * 22.6;
      cans += P(Q(cx, cy, cx + 15, cy + 32), canC[(i + j * 2) % 5], EINK, 1.5);
      const b = F(cx + 7.5, cy + 42);
      cans += `<circle cx="${f1(b[0])}" cy="${f1(b[1])}" r="3" fill="#d9a59a" stroke="${EINK}" stroke-width="1"/>`;
    }
  }
  s += cans;
  s += P(Q(X0 + 12, Y0 + 18, X1 - 12, Y0 + 200), '#ff8f8a', 'none', 0, 'opacity="0.18"');
  const g0 = F(X0 + 12, Y0 + 18), g1 = F(X0 + 50, Y0 + 18), g2 = F(X0 + 26, Y0 + 200), g3 = F(X0 + 12, Y0 + 200);
  s += P(`M${pt(g0)} L${pt(g1)} L${pt(g2)} L${pt(g3)} Z`, '#fff', 'none', 0, 'opacity="0.1"'); // 유리 반사
  // 동전 투입구·반환 레버, 꺼내는 곳
  s += P(Q(X1 - 50, Y0 + 222, X1 - 18, Y0 + 274), '#360c11', EINK, 2);
  s += P(Q(X1 - 38, Y0 + 230, X1 - 31, Y0 + 248), '#100406', 'none');
  s += P(Q(X0 + 22, FB - 100, X1 - 22, FB - 50), '#130406', EINK, 2.5);
  return s;
}

function ladder(sA, sB) {
  // 오른쪽 벽에 기대 세운 접이식 알루미늄 사다리(접힌 채)
  const top = 248, foot = 110;
  const a = at(sA, WR - 8, top), b = at(sB, WR - 8, top), d = at(sB + 0.03, WR - foot, FB), e = at(sA + 0.03, WR - foot, FB);
  let s = P(`M${pt(a)} L${pt(e)}`, 'none', '#6d7486', 9) + P(`M${pt(b)} L${pt(d)}`, 'none', '#555c6c', 9);
  s += P(`M${pt(a)} L${pt(e)} M${pt(b)} L${pt(d)}`, 'none', EINK, 2);
  let rungs = '';
  for (let k = 1; k < 8; k++) {
    const t = k / 8;
    const p = [a[0] + (e[0] - a[0]) * t, a[1] + (e[1] - a[1]) * t], q = [b[0] + (d[0] - b[0]) * t, b[1] + (d[1] - b[1]) * t];
    rungs += `M${pt(p)} L${pt(q)} `;
  }
  s += P(rungs, 'none', '#4d5363', 5);
  s += P(`M${pt(a)} L${pt(e)}`, 'none', '#b5c6e6', 2, 'opacity="0.5"');
  return s;
}

function corridorOpening(side, s0, s1) {
  // 가장자리의 어두운 복도 입구(옆 벽에 뚫린 큰 개구부)
  const wx = side < 0 ? WL : WR, top = 150;
  let s = P(quad(c(s0, wx, top), c(s1, wx, top), c(s1, wx, FB), c(s0, wx, FB)), '#010102', EINK, 3);
  s += P(quad(c(s0, wx, top), c(s0, wx - side * 70, top), c(s0, wx - side * 70, FB), c(s0, wx, FB)), '#090c13', EINK, 2);
  return s;
}

export function draw() {
  const defs = heeminDefs(`${ID}h`) +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a4c"/><stop offset="0.24" stop-color="#3c5683"/><stop offset="0.3" stop-color="#4e6a99"/></linearGradient>` +
    `<linearGradient id="${ID}yard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f86ad"/><stop offset="0.5" stop-color="#9db3d6"/><stop offset="1" stop-color="#7b92ba"/></linearGradient>` +
    `<filter id="${ID}b4" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>` +
    `<filter id="${ID}b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>` +
    `<clipPath id="${ID}floorClip"><path d="${quad(c(1, WL, FB), c(1, WR, FB), c(4, WR, FB), c(4, WL, FB))}"/></clipPath>` +
    // 인물 조명: 앞면은 역광으로 어둡고 푸르게(색은 남김)
    `<filter id="${ID}dark" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` +
    `<feColorMatrix type="matrix" values="0.66 0 0 0 0.01  0 0.68 0 0 0.02  0 0 0.78 0 0.05  0 0 0 1 0"/></filter>` +
    // 달빛 테두리: 실루엣 위쪽·양옆 가장자리(먹선 바로 안쪽)만 가늘게
    `<filter id="${ID}rim" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">` +
    `<feMorphology in="SourceAlpha" operator="erode" radius="2.2" result="er"/>` +
    `<feOffset in="er" dx="3.5" dy="5" result="o1"/><feOffset in="er" dx="-3.5" dy="5" result="o2"/>` +
    `<feComposite in="er" in2="o1" operator="out" result="r1"/><feComposite in="er" in2="o2" operator="out" result="r2"/>` +
    `<feMerge result="rim"><feMergeNode in="r1"/><feMergeNode in="r2"/></feMerge>` +
    `<feFlood flood-color="#c8dcfa"/><feComposite in2="rim" operator="in"/></filter>` +
    `<linearGradient id="${ID}rimG" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="760"><stop offset="0" stop-color="#fff"/><stop offset="0.75" stop-color="#fff" stop-opacity="0.8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="${ID}rimM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}rimG)"/></mask>` +
    `<mask id="${ID}boyM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536" style="mask-type:alpha"><use href="#${ID}boy"/></mask>` +
    `<linearGradient id="${ID}redG" gradientUnits="userSpaceOnUse" x1="330" y1="0" x2="470" y2="0"><stop offset="0" stop-color="#d23c44" stop-opacity="0.22"/><stop offset="1" stop-color="#d23c44" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${ID}legG" gradientUnits="userSpaceOnUse" x1="0" y1="1000" x2="0" y2="1400"><stop offset="0" stop-color="#05070c" stop-opacity="0"/><stop offset="1" stop-color="#05070c" stop-opacity="0.6"/></linearGradient>` +
    `<g id="${ID}boy" transform="${FT}">${boyBody()}</g>` +
    `<radialGradient id="${ID}vig" cx="540" cy="620" r="980" gradientUnits="userSpaceOnUse"><stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.72" stop-color="#000" stop-opacity="0.62"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    `<linearGradient id="${ID}bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>` +
    `<radialGradient id="${ID}door" cx="${DM + 80}" cy="540" r="440" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9fbbe8" stop-opacity="0.32"/><stop offset="1" stop-color="#9fbbe8" stop-opacity="0"/></radialGradient>`;

  let s = `<rect width="1024" height="1536" fill="#05070b"/>`;
  s += walls() + outside() + doors() + floor();
  s += corridorOpening(-1, 1.27, 1.6) + corridorOpening(1, 1.26, 1.6);
  s += vendingMachine() + shoeCabinet(-1, 1.03, 1.3, 5, 3);
  s += ladder(1.03, 1.08) + shoeCabinet(1, 1.11, 1.25, 5, 2);
  s += exitSign();
  // 문으로 스며든 달빛이 공기에 번짐
  s += `<rect width="1024" height="1536" fill="url(#${ID}door)" style="mix-blend-mode:screen"/>`;
  // 희민: 역광으로 어둡게 → 자판기 쪽 붉은 반사광 → 다리 쪽은 더 어둡게 → 머리·어깨 달빛 테두리
  s += `<use href="#${ID}boy" filter="url(#${ID}dark)"/>`;
  s += `<g mask="url(#${ID}boyM)"><rect width="1024" height="1536" fill="url(#${ID}redG)"/><rect width="1024" height="1536" fill="url(#${ID}legG)"/></g>`;
  s += `<g mask="url(#${ID}rimM)"><use href="#${ID}boy" filter="url(#${ID}rim)"/></g>`;
  // 비네트·아래 가장자리
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<rect y="1250" width="1024" height="286" fill="url(#${ID}bot)"/>`;
  return K.svg(s, { defs });
}
