// cg_flashback — 2장 음악준비실 도자기 회상(B루트만). 1998년 7월 20일 밤 음악실의 의식을 바랜 사진처럼 붉은 갈색 단색으로.
// 바닥에 그린 원과 오각별, 꼭짓점마다 촛불 다섯 개. 가운데에 무릎 꿇고 앉은 긴 머리 여학생(나영), 왼쪽에 엎드려 흐느끼는 여자(은미),
// 오른쪽에 부적을 치켜든 남자(김지원). 모두 촛불 역광의 실루엣(얼굴 없음). 뒤로 피아노·칠판 윤곽. 필름 긁힘·잡티·비네트·사진 테두리.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'fb';
const DK = '#1a0c08';

// 바닥 원(타원 투시)
const CX = 512, CY = 1010, RX = 380, RY = 150;
const ring = a => [CX + RX * Math.cos(a), CY + RY * Math.sin(a)];

function floorSigil() {
  let s = '';
  s += `<ellipse cx="${CX}" cy="${CY}" rx="${RX}" ry="${RY}" fill="none" stroke="#e6b77a" stroke-width="5" opacity="0.75"/>`;
  s += `<ellipse cx="${CX}" cy="${CY}" rx="${RX - 26}" ry="${RY - 10}" fill="none" stroke="#e6b77a" stroke-width="2.5" opacity="0.5"/>`;
  const pts = Array.from({ length: 5 }, (_, i) => ring(-Math.PI / 2 + i * 2 * Math.PI / 5));
  const star = [0, 2, 4, 1, 3, 0].map(i => pts[i]);
  s += P('M' + star.map(pt).join(' L'), 'none', '#e6b77a', 4, 'opacity="0.7"');
  // 꼭짓점 촛불
  for (const [x, y] of pts) {
    s += `<g filter="url(#${ID}b18)"><circle cx="${f1(x)}" cy="${f1(y - 70)}" r="70" fill="#ffcf7a" opacity="0.5"/></g>`;
    s += P(`M${f1(x - 11)} ${f1(y)} L${f1(x - 11)} ${f1(y - 54)} L${f1(x + 11)} ${f1(y - 54)} L${f1(x + 11)} ${f1(y)} Z`, '#f2dcb4', DK, 3);
    s += P(`M${f1(x)} ${f1(y - 58)} C${f1(x - 9)} ${f1(y - 72)} ${f1(x - 4)} ${f1(y - 88)} ${f1(x)} ${f1(y - 98)} C${f1(x + 5)} ${f1(y - 86)} ${f1(x + 9)} ${f1(y - 72)} ${f1(x)} ${f1(y - 58)} Z`, '#fff1c6');
  }
  return s;
}

// 실루엣(촛불 역광 테두리)
function sil(d, rim = '') {
  return P(d, DK) + (rim ? P(rim, 'none', '#ffcf86', 4, 'opacity="0.85"') : '');
}

function figures() {
  let s = '';
  // 가운데: 무릎 꿇고 앉은 긴 머리 여학생(교복 치마), 두 손을 무릎 위에 모음
  s += sil('M512 690 C470 690 450 726 452 770 C454 820 440 880 430 930 C420 980 430 1010 470 1020 L556 1020 C596 1010 604 980 594 930 C584 880 570 820 572 770 C574 726 554 690 512 690 Z',
    'M458 760 C452 820 440 890 432 940');
  s += sil('M466 900 C430 930 400 980 404 1030 L620 1030 C624 980 594 930 558 900 Z', 'M410 1010 C420 970 440 940 466 910'); // 치마·무릎
  s += sil('M480 640 C480 610 498 594 516 594 C536 594 552 612 550 642 C548 670 534 690 514 690 C494 690 480 670 480 640 Z'); // 머리
  s += sil('M486 630 C470 700 460 790 466 860 L476 860 C482 790 492 700 506 640 Z M544 630 C556 700 562 790 556 860 L546 860 C540 790 532 700 520 640 Z'); // 늘어진 긴 머리
  // 왼쪽: 엎드려 흐느끼는 여자(은미), 얼굴을 두 손에 묻음
  s += sil('M150 1060 C140 1000 170 950 220 930 C260 914 300 920 330 944 C352 962 362 990 360 1020 L360 1070 L150 1070 Z', 'M168 990 C180 960 204 940 230 932');
  s += sil('M300 950 C320 920 352 912 372 930 C388 946 386 974 368 988 C350 1000 320 996 304 980 Z'); // 숙인 머리
  s += sil('M330 990 C350 1000 380 1004 400 996 L404 1012 C380 1022 346 1018 326 1006 Z'); // 손
  // 오른쪽: 서서 부적을 치켜든 남자(김지원)
  s += sil('M780 1060 L800 900 C790 850 790 790 806 760 C820 734 846 724 870 730 C896 738 908 770 906 810 C904 860 898 900 900 940 L920 1060 Z', 'M904 800 C906 860 900 920 904 980');
  s += sil('M824 712 C824 684 842 668 862 668 C884 668 898 686 896 714 C894 740 878 756 860 756 C840 756 824 740 824 712 Z'); // 머리
  s += sil('M812 780 C790 740 770 690 752 640 L770 632 C790 680 812 724 832 760 Z'); // 치켜든 팔
  s += P('M728 556 L780 548 L790 640 L738 648 Z', '#f0e0bc', DK, 3); // 부적
  s += P('M752 572 L768 570 M750 590 L772 588 M754 610 L766 608 M760 626 L764 600', 'none', '#7a1c12', 4);
  s += `<g filter="url(#${ID}b18)"><circle cx="760" cy="596" r="64" fill="#fff0c8" opacity="0.35"/></g>`;
  return s;
}

export function draw() {
  const defs =
    `<filter id="${ID}b18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>` +
    `<filter id="${ID}b4" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2"/></filter>` +
    `<filter id="${ID}grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0.9  0 0 0 0 0.75  0 0 0 0 0.55  0 0 0 0.5 -0.1"/></filter>` +
    `<radialGradient id="${ID}glow" cx="512" cy="930" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#b8743c" stop-opacity="0.7"/><stop offset="0.5" stop-color="#5a2a14" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="800" r="860" gradientUnits="userSpaceOnUse"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>`;
  let s = `<rect width="1024" height="1536" fill="#2a140b"/>`;
  // 방: 칠판·피아노 윤곽(뒤), 마루
  s += P('M0 0 L1024 0 L1024 820 L0 820 Z', '#24110a');
  s += P('M110 240 L700 240 L700 520 L110 520 Z', '#1d0d07', '#3a1e10', 4);
  s += P('M720 470 L1000 470 L1000 820 L720 820 Z', '#160905', '#3a1e10', 4); // 피아노
  s += P('M730 640 L990 640 L990 668 L730 668 Z', '#5b3420');
  s += P('M0 820 L1024 820 L1024 1536 L0 1536 Z', '#30180c');
  for (let i = 0; i < 12; i++) s += P(`M0 ${f1(820 + i * i * 4.6 + i * 10)} L1024 ${f1(820 + i * i * 4.6 + i * 10)}`, 'none', '#221008', 3);
  s += `<rect width="1024" height="1536" fill="url(#${ID}glow)" style="mix-blend-mode:screen"/>`;
  s += `<g filter="url(#${ID}b4)">${floorSigil()}${figures()}</g>`;
  // 바랜 사진: 잡티·긁힘·번짐
  s += `<rect width="1024" height="1536" filter="url(#${ID}grain)" opacity="0.55"/>`;
  for (const [x, y0, y1] of [[180, 0, 1536], [612, 200, 1100], [880, 600, 1536]]) s += P(`M${x} ${y0} L${x + 6} ${y1}`, 'none', '#e8c79a', 2, 'opacity="0.3"');
  for (const [x, y, r] of [[300, 300, 5], [770, 1240, 7], [520, 160, 4], [140, 1300, 6]]) s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8c79a" opacity="0.35"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<rect x="18" y="18" width="988" height="1500" fill="none" stroke="#c9a77a" stroke-width="10" opacity="0.35"/>`;
  s += `<text x="980" y="1490" font-family="monospace" font-size="30" fill="#e0b98a" opacity="0.6" text-anchor="end">'98 7 20</text>`;
  return K.svg(s, { defs });
}
