// end_althea — 엔딩(무궁화). 강당 무대. 지현의 발목에 감던 붕대는 끝내 바닥에 풀려 흩어지고, 그녀 뒤 어둠에서 성아가 나타나
// 창백한 팔로 지현을 끌어안아 어둠 속으로 끌고 간다. 성아는 지현 어깨 너머로 이쪽(희민)을 노려본다. 지현은 겁에 질려 뒤로 끌려가며,
// 화면 오른쪽 아래에서 희민의 손(남색 소매)이 뻗어 나오지만 닿지 않는다. 바닥에 떨어진 무궁화 꽃송이와 흩날리는 꽃잎.
// 인물은 힉스필드 초상화(지현 scared · 성아 angry 를 창백하게), 팔·손·붕대·꽃은 벡터.
import * as K from '../kit.js';
import { hfFig, rng } from './end_white_chrysanthemum.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const ID = 'eal';
const FLOOR = 1130; // 무대 바닥 시작(화면 y)

// ---------------------------------------------------------------- 무궁화 한 송이(가운데 cx,cy · 반지름 r): 다섯 장 분홍 꽃잎 + 짙은 붉은 속 + 흰 암술대
export function althea(cx, cy, r, { rot = 0, tilt = 0.8, petal = '#d98ab8', vein = '#a84a86', heart = '#8a1030', line = '#3a1430', dim = 1 } = {}) {
  let s = '';
  for (let k = 0; k < 5; k++) {
    const a = rot + k / 5 * Math.PI * 2;
    const ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r * tilt;
    const nx = -Math.sin(a) * r * 0.62, ny = Math.cos(a) * r * 0.62 * tilt;
    const d = `M${f1(cx)} ${f1(cy)} C${f1(cx + (ex - cx) * 0.3 + nx)} ${f1(cy + (ey - cy) * 0.3 + ny)} ${f1(ex + nx * 0.7)} ${f1(ey + ny * 0.7)} ${f1(ex)} ${f1(ey)} C${f1(ex - nx * 0.7)} ${f1(ey - ny * 0.7)} ${f1(cx + (ex - cx) * 0.3 - nx)} ${f1(cy + (ey - cy) * 0.3 - ny)} ${f1(cx)} ${f1(cy)} Z`;
    s += P(d, petal, line, 1.6);
    s += P(`M${f1(cx)} ${f1(cy)} L${f1(cx + (ex - cx) * 0.8)} ${f1(cy + (ey - cy) * 0.8)} M${f1(cx + (ex - cx) * 0.2)} ${f1(cy + (ey - cy) * 0.2)} L${f1(cx + (ex - cx) * 0.6 + nx * 0.3)} ${f1(cy + (ey - cy) * 0.6 + ny * 0.3)}`, 'none', vein, 1, 'opacity="0.6"');
  }
  s += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r * 0.36)}" ry="${f1(r * 0.36 * tilt)}" fill="${heart}" opacity="0.9" filter="url(#${ID}b3)"/>`;
  s += P(`M${f1(cx)} ${f1(cy)} L${f1(cx + r * 0.1)} ${f1(cy - r * 0.42)}`, 'none', '#f4ecd8', 3) + `<circle cx="${f1(cx + r * 0.1)}" cy="${f1(cy - r * 0.44)}" r="${f1(r * 0.07)}" fill="#f8e8a0"/>`;
  return dim !== 1 ? `<g opacity="${dim}">${s}</g>` : s;
}

function stage() {
  let s = `<rect width="1024" height="1536" fill="#030204"/>`;
  // 뒤쪽 막(거의 어둠, 왼쪽만 희미한 붉은 결)
  let f = '';
  for (let x = 0; x < 600; x += 50) f += `M${x} 0 C${x + 6} 400 ${x - 6} 800 ${x} ${FLOOR} `;
  s += `<rect width="1024" height="${FLOOR}" fill="url(#${ID}curt)"/>` + P(f, 'none', '#3a0e18', 4, 'opacity="0.35"');
  // 바닥(마루, 위에서 비스듬히 떨어지는 작업등 빛 웅덩이)
  s += `<rect y="${FLOOR}" width="1024" height="${1536 - FLOOR}" fill="url(#${ID}floor)"/>`;
  let b = '';
  for (let y = FLOOR + 20, k = 1; y < 1536; y += 20 + k * 6, k++) b += `M0 ${y} L1024 ${y} `;
  s += P(b, 'none', '#0a0706', 2, 'opacity="0.7"');
  s += `<ellipse cx="380" cy="${FLOOR + 220}" rx="420" ry="150" fill="#e8d6c0" opacity="0.13" filter="url(#${ID}b30)"/>`;
  return s;
}

// 풀려 흩어진 붕대(바닥 위 물결치는 흰 띠, 한쪽 끝은 말린 두루마리)
function bandage() {
  const path = 'M230 1420 C300 1400 340 1440 420 1430 C500 1420 520 1380 580 1384 C650 1390 690 1350 760 1360';
  let s = P(path, 'none', '#0c0a08', 20, 'opacity="0.7" transform="translate(0 6)"');
  s += P(path, 'none', '#cfc8bb', 14) + P(path, 'none', '#ece6da', 9) + P(path, 'none', '#a49c8e', 1.2, 'stroke-dasharray="3 9" opacity="0.8"');
  // 두루마리(굴러간 끝)
  s += `<g transform="translate(772 1356)"><ellipse cx="0" cy="0" rx="22" ry="18" fill="#ece6da" stroke="#4a443c" stroke-width="2"/><ellipse cx="0" cy="0" rx="14" ry="11" fill="none" stroke="#b8b0a2" stroke-width="1.5"/><ellipse cx="0" cy="0" rx="6" ry="5" fill="#8a8274"/></g>`;
  return s;
}

// 가늘고 끝이 뾰족해지는 손가락(밑동 x,y · 방향 ang 도 · 길이 len · 굵기 w · 마디에서 굽음 bend)
function finger(x, y, ang, len, w, bend, fill, line) {
  const a = ang * Math.PI / 180, b = (ang + bend) * Math.PI / 180;
  const mx = x + Math.cos(a) * len * 0.55, my = y + Math.sin(a) * len * 0.55;
  const ex = mx + Math.cos(b) * len * 0.45, ey = my + Math.sin(b) * len * 0.45;
  const n = (t, ww) => [-Math.sin(t) * ww, Math.cos(t) * ww];
  const [n0x, n0y] = n(a, w / 2), [n1x, n1y] = n((a + b) / 2, w * 0.42), [n2x, n2y] = n(b, w * 0.2);
  return P(`M${f1(x + n0x)} ${f1(y + n0y)} L${f1(mx + n1x)} ${f1(my + n1y)} L${f1(ex + n2x)} ${f1(ey + n2y)} Q${f1(ex + Math.cos(b) * w * 0.3)} ${f1(ey + Math.sin(b) * w * 0.3)} ${f1(ex - n2x)} ${f1(ey - n2y)} L${f1(mx - n1x)} ${f1(my - n1y)} L${f1(x - n0x)} ${f1(y - n0y)} Z`, fill, line, 1.8);
}
// 성아의 창백한 팔(어둠에서 나와 지현 쇄골 앞을 감고 먼 쪽 어깨를 움켜쥠) + 다른 손(가까운 어깨 위)
function arms() {
  const L = '#000', SK = `url(#${ID}arm)`, HS = '#17141c', RIM = '#9a9cc0';
  let s = `<g filter="url(#${ID}soft)">`;
  // 어둠에서 뻗어 나온 그림자 팔: 지현 쇄골 앞을 감고 먼 쪽 어깨를 움켜쥠
  s += P('M800 850 C700 846 640 880 560 912 C480 944 400 962 330 964 C318 966 306 968 302 972 L304 992 C320 996 340 996 360 994 C440 986 520 966 600 940 C680 914 740 912 800 920 Z', SK, L, 1.5);
  s += P('M308 962 C290 952 268 948 252 952 C240 958 238 976 246 986 C262 996 286 1000 306 996 Z', HS, L, 1.5);
  for (const [x, y, ang, len, bend] of [[252, 952, 196, 66, -34], [246, 962, 180, 76, -38], [244, 974, 166, 70, -40], [250, 986, 150, 56, -38]]) s += finger(x, y, ang, len, 14, bend, HS, L);
  s += finger(290, 996, 120, 42, 14, 26, HS, L);
  s += '</g>';
  // 희미한 테두리 빛(무대 작업등 쪽 윗가장자리)
  s += P('M640 880 C560 912 480 944 400 962 C360 966 330 966 306 966 M252 952 C232 946 210 944 190 950', 'none', RIM, 1.6, 'opacity="0.45"');
  // 팔 둘레 검은 연기
  s += `<g filter="url(#${ID}b12)" opacity="0.7"><ellipse cx="780" cy="884" rx="110" ry="60" fill="#000"/></g>`;
  return s;
}

export function draw() {
  const ghost = '0.42 0.26 0.14 0 0.06  0.24 0.44 0.16 0 0.07  0.24 0.26 0.46 0 0.1  0 0 0 1 0'; // 탈색 + 푸르스름하게
  const se = hfFig(`${ID}a`, 'seonga_angry', {
    cx: 640, top: 250, s: 1.12, rot: -6, grade: ghost, rim: '#b8c6e8', rimDx: 4, rimDy: 3, rimOp: 0.6, fade: [0.5, 0.85], rimTo: 0.4,
    over: [{ fill: `url(#${ID}aEye)` }, { fill: `url(#${ID}aDark)` }],
  });
  const jgrade = '0.72 0.03 0 0 0.01  0.02 0.7 0.03 0 0.01  0 0.03 0.78 0 0.02  0 0 0 1 0';
  const jh = hfFig(`${ID}j`, 'jihyeon_scared', {
    cx: 400, top: 470, s: 1.0, rot: -9, grade: jgrade, rim: '#e8dcc8', rimDx: -4, rimDy: 3, rimOp: 0.8, fade: [0.74, 0.97], rimTo: 0.5,
    over: [{ fill: `url(#${ID}jDark)` }],
  });
  const defs = se.defs + jh.defs +
    `<filter id="${ID}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<linearGradient id="${ID}curt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a070c"/><stop offset="0.6" stop-color="#07030a"/><stop offset="1" stop-color="#020103"/></linearGradient>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140e0c"/><stop offset="1" stop-color="#2a201a"/></linearGradient>` +
    // 성아: 눈 위 그늘 + 아래·오른쪽이 어둠에 먹힘
    `<linearGradient id="${ID}aEye" gradientUnits="userSpaceOnUse" x1="0" y1="140" x2="0" y2="300"><stop offset="0" stop-color="#05040a" stop-opacity="0.6"/><stop offset="0.8" stop-color="#05040a" stop-opacity="0.15"/><stop offset="1" stop-color="#05040a" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${ID}aDark" gradientUnits="userSpaceOnUse" x1="100" y1="0" x2="448" y2="200"><stop offset="0" stop-color="#020104" stop-opacity="0"/><stop offset="1" stop-color="#020104" stop-opacity="0.55"/></linearGradient>` +
    `<linearGradient id="${ID}jDark" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="442" y2="0"><stop offset="0" stop-color="#05040a" stop-opacity="0.05"/><stop offset="1" stop-color="#05040a" stop-opacity="0.55"/></linearGradient>` +
    `<linearGradient id="${ID}arm" gradientUnits="userSpaceOnUse" x1="800" y1="0" x2="300" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#1c1824"/></linearGradient>` +
    `<linearGradient id="${ID}arm2" gradientUnits="userSpaceOnUse" x1="0" y1="700" x2="0" y2="890"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#1c1824"/></linearGradient>` +
    `<filter id="${ID}soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter>` +
    `<radialGradient id="${ID}void" cx="760" cy="620" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000" stop-opacity="0.9"/><stop offset="0.6" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="440" cy="800" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.8" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.96"/></radialGradient>`;
  let s = stage();
  // 성아(어둠에서 떠오름) — 뒤 어둠 덩어리가 그녀를 감쌈
  s += `<rect width="1024" height="1536" fill="url(#${ID}void)"/>`;
  s += se.body;
  // 지현(뒤로 끌려가며 기울어짐) + 몸 아래를 삼키는 어둠
  s += jh.body;
  s += `<ellipse cx="520" cy="1180" rx="480" ry="170" fill="#030204" opacity="0.92" filter="url(#${ID}b30)"/>`;
  s += arms();
  // 무궁화(바닥에 떨어진 송이 · 흩날리는 꽃잎)
  s += bandage();
  const rnd = rng(19);
  for (const [x, y, r, dim] of [[120, 1330, 58, 1], [930, 1430, 64, 0.95], [680, 1480, 46, 0.9], [60, 1500, 50, 0.85], [980, 1220, 40, 0.7]]) s += althea(x, y, r, { rot: rnd() * 6, dim, tilt: 0.62 });
  for (let i = 0; i < 18; i++) {
    const x = rnd() * 1024, y = 200 + rnd() * 1100, a = rnd() * 180;
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="11" ry="6" fill="#d98ab8" opacity="${f1(0.4 + rnd() * 0.5)}" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})"/>`;
  }
  // 희민의 손(오른쪽 아래에서 뻗음, 닿지 않음)
  s += `<g transform="translate(0 -150)">`;
  s += P('M1060 1700 L1060 1330 C1020 1300 970 1270 930 1250 L896 1300 C940 1330 980 1380 1000 1700 Z', '#151a32', '#04050a', 3);
  s += P('M930 1250 L896 1300 L880 1290 L914 1240 Z', '#e8e4dc', '#4a4640', 2); // 셔츠 소맷부리
  s += P('M914 1240 C896 1222 870 1206 846 1198 C832 1196 826 1206 836 1214 L860 1226 C842 1222 820 1222 806 1228 C796 1236 804 1246 818 1246 C834 1246 850 1248 862 1252 C846 1256 830 1262 822 1272 C818 1282 828 1288 840 1282 C856 1276 868 1274 878 1276 C870 1284 862 1292 864 1298 C868 1306 880 1302 888 1294 L896 1288 Z', '#c8a898', '#3a2826', 2.5);
  s += '</g>';
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
