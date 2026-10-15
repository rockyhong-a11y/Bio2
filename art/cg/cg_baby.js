// cg_baby — 2장 4층 미술실 구석. 울던 아기 귀신이 구워 식힌 흙인형을 작은 두 팔로 꼭 끌어안고, 몸 가장자리부터 흙먼지처럼 부서져 흩어진다.
// 회청색 창백한 피부, 커다란 머리, 검게 꺼진 눈에서 흘러내린 눈물 자국. 오른쪽 뒤 가마의 주황빛, 이젤·석고상 실루엣, 바닥의 물감 얼룩.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const INK = '#0b0a0c';
const ID = 'bb';
const SK = { base: '#b9c6cc', shade: '#8796a0', deep: '#5d6b76', line: '#2a3138' };

function room() {
  let s = `<rect width="1024" height="1536" fill="#110f10"/>`;
  s += P('M0 0 L1024 0 L1024 940 L0 940 Z', '#1a1718'); // 벽 모서리
  s += P('M0 0 L300 0 L300 980 L0 1060 Z', '#141213');
  s += P('M0 940 L1024 940 L1024 1536 L0 1536 Z', '#241d18'); // 바닥
  for (let i = 0; i < 12; i++) s += P(`M0 ${f1(940 + i * i * 3.8 + i * 12)} L1024 ${f1(940 + i * i * 3.8 + i * 12)}`, 'none', '#1a1410', 3);
  // 물감 얼룩
  for (const [x, y, rx, c] of [[200, 1300, 60, '#3a2a4a'], [760, 1380, 80, '#4a2a22'], [880, 1180, 40, '#2a3a2a']]) s += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.35}" fill="${c}" opacity="0.6"/>`;
  // 이젤(왼쪽 뒤), 석고상(가운데 뒤), 가마(오른쪽)
  s += P('M120 520 L60 960 M120 520 L180 960 M120 520 L120 900', 'none', '#2b211a', 10);
  s += P('M40 560 L210 560 L210 760 L40 760 Z', '#cfc8b8', INK, 4, 'opacity="0.35"');
  s += `<ellipse cx="470" cy="610" rx="44" ry="52" fill="#d6d2c8" opacity="0.28"/>` + P('M410 660 C420 720 520 720 530 660 L560 760 L380 760 Z', '#d6d2c8', 'none', 0, 'opacity="0.24"');
  s += P('M396 760 L546 760 L546 940 L396 940 Z', '#2a201a');
  s += P('M780 430 L1024 430 L1024 960 L780 960 Z', '#3a3530', INK, 4); // 가마
  s += P('M810 500 L1000 500 L1000 900 L810 900 Z', '#2e2a26', INK, 3);
  s += P('M810 500 L1000 500 M810 900 L1000 900 M810 500 L810 900 M1000 500 L1000 900', 'none', '#ff8a3a', 4, 'opacity="0.8"');
  s += `<circle cx="905" cy="640" r="28" fill="#ffb05a"/><circle cx="905" cy="640" r="16" fill="#fff0c0"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}kiln)" style="mix-blend-mode:screen"/>`;
  return s;
}

// 아기: 웅크려 앉아 고개를 숙이고 품의 인형을 내려다본다(눈을 감아 가는 꺼진 눈두덩, 눈물 자국). 가마 쪽(오른쪽)에서 따뜻한 빛, 왼쪽은 차가운 그늘
function baby() {
  let s = '';
  const cx = 480, cy = 1010;
  // 그림자
  s += `<ellipse cx="${cx + 20}" cy="${cy + 236}" rx="230" ry="42" fill="#000" opacity="0.55"/>`;
  // 접은 다리(통통한 허벅지·발)
  s += P(`M${cx - 190} ${cy + 214} C${cx - 230} ${cy + 150} ${cx - 190} ${cy + 80} ${cx - 120} ${cy + 90} C${cx - 60} ${cy + 100} ${cx - 30} ${cy + 170} ${cx - 50} ${cy + 220} C${cx - 90} ${cy + 246} ${cx - 160} ${cy + 240} ${cx - 190} ${cy + 214} Z`, `url(#${ID}skin)`, SK.line, 4);
  s += P(`M${cx + 200} ${cy + 214} C${cx + 240} ${cy + 150} ${cx + 200} ${cy + 80} ${cx + 130} ${cy + 90} C${cx + 70} ${cy + 100} ${cx + 40} ${cy + 170} ${cx + 60} ${cy + 220} C${cx + 100} ${cy + 246} ${cx + 170} ${cy + 240} ${cx + 200} ${cy + 214} Z`, `url(#${ID}skin)`, SK.line, 4);
  for (const [x, sd] of [[cx - 70, -1], [cx + 80, 1]]) s += P(`M${x} ${cy + 196} C${x + sd * 30} ${cy + 190} ${x + sd * 64} ${cy + 210} ${x + sd * 60} ${cy + 236} C${x + sd * 40} ${cy + 252} ${x} ${cy + 246} ${x - sd * 6} ${cy + 226} Z`, '#a9b6bd', SK.line, 3); // 발
  // 몸통(둥근 배, 웅크려 앞으로 굽음)
  s += P(`M${cx - 170} ${cy + 120} C${cx - 196} ${cy + 20} ${cx - 160} ${cy - 90} ${cx - 70} ${cy - 120} C${cx} ${cy - 140} ${cx + 80} ${cy - 130} ${cx + 150} ${cy - 90} C${cx + 210} ${cy - 30} ${cx + 210} ${cy + 70} ${cx + 176} ${cy + 130} C${cx + 100} ${cy + 180} ${cx - 100} ${cy + 180} ${cx - 170} ${cy + 120} Z`, `url(#${ID}skin)`, SK.line, 5);
  // 흙인형(구운 테라코타 포대기 인형) — 가슴에 안음
  const dx = cx + 10, dy = cy + 20;
  s += `<ellipse cx="${dx}" cy="${dy + 40}" rx="92" ry="104" fill="url(#${ID}clay)" stroke="${INK}" stroke-width="4"/>`;
  s += P(`M${dx - 78} ${dy} C${dx - 20} ${dy + 60} ${dx + 40} ${dy + 86} ${dx + 86} ${dy + 70} M${dx + 80} ${dy - 10} C${dx + 20} ${dy + 66} ${dx - 30} ${dy + 104} ${dx - 82} ${dy + 96}`, 'none', '#6e3418', 5, 'opacity="0.8"');
  s += `<circle cx="${dx + 4}" cy="${dy - 68}" r="50" fill="url(#${ID}clay)" stroke="${INK}" stroke-width="4"/>`;
  s += P(`M${dx - 14} ${dy - 70} l8 0 M${dx + 16} ${dy - 70} l8 0 M${dx - 2} ${dy - 50} C${dx + 4} ${dy - 45} ${dx + 10} ${dy - 45} ${dx + 16} ${dy - 50}`, 'none', '#5a2a16', 4); // 잠든 얼굴
  // 인형을 감싼 팔(앙상하지 않은 아기 팔, 손가락이 인형을 움켜쥠)
  for (const sd of [-1, 1]) {
    const sx = cx + sd * 150, sy = cy - 40;
    s += P(`M${sx} ${sy} C${sx + sd * 30} ${sy + 70} ${sx - sd * 10} ${sy + 140} ${dx + sd * 40} ${dy + 90}`, 'none', SK.line, 64);
    s += P(`M${sx} ${sy} C${sx + sd * 30} ${sy + 70} ${sx - sd * 10} ${sy + 140} ${dx + sd * 40} ${dy + 90}`, 'none', sd < 0 ? '#93a2ad' : '#b7c3c9', 54);
    for (let k = 0; k < 3; k++) s += `<ellipse cx="${dx + sd * (20 + k * 14)}" cy="${dy + 92 - k * 8}" rx="11" ry="14" fill="${sd < 0 ? '#93a2ad' : '#b7c3c9'}" stroke="${SK.line}" stroke-width="3"/>`;
  }
  // 머리: 크고 둥근 머리를 앞으로 숙임(정수리·이마가 크게, 얼굴은 아래쪽)
  const hx = cx + 6, hy = cy - 250;
  s += `<ellipse cx="${hx}" cy="${hy}" rx="176" ry="168" fill="url(#${ID}head)" stroke="${SK.line}" stroke-width="5"/>`;
  s += P(`M${hx - 150} ${hy + 30} C${hx - 120} ${hy + 140} ${hx + 120} ${hy + 140} ${hx + 156} ${hy + 30} C${hx + 120} ${hy + 168} ${hx - 120} ${hy + 168} ${hx - 150} ${hy + 30} Z`, '#7c8a95', 'none', 0, 'opacity="0.55"'); // 숙인 얼굴 아래 그늘
  // 꺼진 눈두덩(감기는 눈) + 눈물 자국
  for (const sd of [-1, 1]) {
    const ex = hx + sd * 64, ey = hy + 70;
    s += `<ellipse cx="${ex}" cy="${ey}" rx="46" ry="34" fill="url(#${ID}socket)"/>`;
    s += P(`M${ex - 32} ${ey - 2} C${ex - 12} ${ey + 14} ${ex + 12} ${ey + 14} ${ex + 32} ${ey - 2}`, 'none', '#0b0d10', 5); // 감은 눈꺼풀 선
    s += P(`M${ex + sd * 14} ${ey + 14} C${ex + sd * 18} ${ey + 50} ${ex + sd * 12} ${ey + 86} ${ex + sd * 16} ${ey + 120}`, 'none', '#46525e', 6, 'opacity="0.75"');
    s += P(`M${ex + sd * 15} ${ey + 20} C${ex + sd * 18} ${ey + 50} ${ex + sd * 13} ${ey + 86} ${ex + sd * 16} ${ey + 118}`, 'none', '#e6f0f5', 2, 'opacity="0.5"');
  }
  s += P(`M${hx - 16} ${hy + 132} C${hx - 6} ${hy + 138} ${hx + 6} ${hy + 138} ${hx + 16} ${hy + 132}`, 'none', '#3a2a30', 5); // 다문 입
  s += P(`M${hx - 6} ${hy + 98} C${hx - 2} ${hy + 108} ${hx + 6} ${hy + 108} ${hx + 8} ${hy + 100}`, 'none', '#5d6b76', 4); // 코
  // 정수리 솜털·숨골 그늘·핏줄
  for (let i = 0; i < 9; i++) s += P(`M${hx - 60 + i * 14} ${hy - 160} C${hx - 66 + i * 15} ${hy - 186} ${hx - 50 + i * 16} ${hy - 200} ${hx - 40 + i * 16} ${hy - 206}`, 'none', '#55626c', 2.5);
  s += P(`M${hx - 90} ${hy - 60} C${hx - 60} ${hy - 80} ${hx - 70} ${hy - 30} ${hx - 40} ${hy - 40} M${hx + 40} ${hy - 110} C${hx + 70} ${hy - 90} ${hx + 50} ${hy - 60} ${hx + 84} ${hy - 50}`, 'none', '#6c5a72', 2.5, 'opacity="0.5"');
  // 테두리 빛(가마 쪽, 오른쪽)
  s += P(`M${hx + 120} ${hy - 120} C${hx + 180} ${hy - 50} ${hx + 186} ${hy + 50} ${hx + 140} ${hy + 120}`, 'none', '#ffb070', 6, 'opacity="0.75"');
  s += P(`M${cx + 160} ${cy - 70} C${cx + 210} ${cy} ${cx + 214} ${cy + 80} ${cx + 180} ${cy + 130}`, 'none', '#ffb070', 5, 'opacity="0.6"');
  return s;
}

// 흙먼지: 아기 몸 왼쪽 가장자리부터 부서져 위로 흩날림(작은 사각 조각)
function dust() {
  let s = '', seed = 11;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 140; i++) {
    const t = r(), x = 250 - t * 230 + r() * 120, y = 1180 - r() * 900 - t * 200, w = 4 + r() * 14;
    s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(w * (0.6 + r() * 0.6))}" fill="${r() > 0.5 ? SK.base : '#c89a70'}" opacity="${f1(0.25 + (1 - t) * 0.6)}" transform="rotate(${f1(r() * 90)} ${f1(x)} ${f1(y)})"/>`;
  }
  return s;
}

export function draw() {
  const defs =
    `<radialGradient id="${ID}kiln" cx="900" cy="660" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff8a3a" stop-opacity="0.55"/><stop offset="0.45" stop-color="#a04a1a" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}skin" cx="620" cy="880" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#cdd6db"/><stop offset="0.55" stop-color="#9eacb5"/><stop offset="1" stop-color="#5d6b76"/></radialGradient>` +
    `<radialGradient id="${ID}head" cx="560" cy="660" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d4dde1"/><stop offset="0.6" stop-color="#a4b2ba"/><stop offset="1" stop-color="#606e79"/></radialGradient>` +
    `<radialGradient id="${ID}socket"><stop offset="0" stop-color="#14181d"/><stop offset="0.6" stop-color="#2e3740" stop-opacity="0.9"/><stop offset="1" stop-color="#6d7b86" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}clay" cx="0.65" cy="0.35" r="0.8"><stop offset="0" stop-color="#d4884f"/><stop offset="0.6" stop-color="#a95c34"/><stop offset="1" stop-color="#6a3216"/></radialGradient>` +
    `<radialGradient id="${ID}halo" cx="470" cy="860" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d6e2ea" stop-opacity="0.22"/><stop offset="1" stop-color="#d6e2ea" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${ID}crumble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.1"/><stop offset="0.38" stop-color="#fff" stop-opacity="1"/></linearGradient>` +
    `<mask id="${ID}crumbleM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}crumble)"/></mask>` +
    `<radialGradient id="${ID}vig" cx="520" cy="860" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>`;
  let s = room();
  s += `<rect width="1024" height="1536" fill="url(#${ID}halo)" style="mix-blend-mode:screen"/>`;
  s += `<g mask="url(#${ID}crumbleM)">${baby()}</g>`;
  s += dust();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
