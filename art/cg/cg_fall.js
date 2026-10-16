// cg_fall — 3장 신관 4층 난간. 은미가 난간 너머로 뒤로 넘어가며 아트리움 아래로 떨어지는 순간.
// 카메라는 4층 복도에서 난간을 비스듬히 내려다본다(아래로 3개 층과 1층 바닥, 맞은편 복도 난간들). 은미는 허리가 난간에 걸린 채
// 몸이 뒤로 젖혀지고(머리는 허공 쪽), 맨발이 바닥에서 떨어져 들리며, 한 팔은 이쪽으로 허우적, 머리카락과 카디건 자락이 솟구친다.
// 그녀의 등 뒤 허공, 천창에서 떨어지는 달빛 기둥 속 어둠에 짧은 단발 소녀의 검은 실루엣이 떠 있다(얼굴은 보이지 않음).
// 은미 머리는 cg_eunmi 의 eunmiHead 를 쓴다.
import * as K from '../kit.js';
import { EM, eunmiHead, headDefs } from './cg_eunmi.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#040509';
const ID = 'fl';

// ---------------------------------------------------------------- 카메라(4층 복도, 난간을 비스듬히 내려다봄)
// 세계 좌표: 난간 = x 0 선(z 방향으로 뻗음), 허공 = x 0..AW, 우리 복도 = x < 0, 4층 바닥 y = 0
const CAMP = [-1.7, 1.6, -1.2], YAW = -30 * Math.PI / 180, PITCH = -13 * Math.PI / 180, FOC = 1250, C0 = [430, 600];
const FWD = [-Math.sin(YAW) * Math.cos(PITCH), Math.sin(PITCH), Math.cos(YAW) * Math.cos(PITCH)];
const RGT = [Math.cos(YAW), 0, Math.sin(YAW)];
const UP = [FWD[1] * RGT[2] - FWD[2] * RGT[1], FWD[2] * RGT[0] - FWD[0] * RGT[2], FWD[0] * RGT[1] - FWD[1] * RGT[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function pr(p) {
  const d = sub(p, CAMP), z = Math.max(0.05, dot(d, FWD));
  return [C0[0] + FOC * dot(d, RGT) / z, C0[1] - FOC * dot(d, UP) / z];
}
const depth = p => dot(sub(p, CAMP), FWD);
const q4 = (a, b, c, d) => poly([pr(a), pr(b), pr(c), pr(d)]);
const AW = 7.2, FH = 3.6, Z0 = -3, Z1 = 16; // 아트리움 폭, 층 높이, 앞·뒤 끝

function atrium() {
  let s = `<rect width="1024" height="1536" fill="#05060a"/>`;
  const GY = -3 * FH; // 1층 바닥
  // 맞은편 복도(x = AW): 층마다 슬래브 단면 + 난간 + 안쪽 벽(문)
  s += q4([AW, GY, Z0], [AW, 6, Z0], [AW, 6, Z1], [AW, GY, Z1]).replace(/^/, '') && P(q4([AW, GY, Z0], [AW, 6, Z0], [AW, 6, Z1], [AW, GY, Z1]), '#0b0d14');
  s += P(q4([0, GY, Z1], [AW, GY, Z1], [AW, 6, Z1], [0, 6, Z1]), '#090b11'); // 맨 끝 벽
  for (let f = 0; f <= 3; f++) {
    const y = -f * FH;
    for (let z = Z0 + 1; z < Z1 - 1; z += 2.2) s += P(q4([AW + 0.01, y + 0.2, z], [AW + 0.01, y + 2.3, z], [AW + 0.01, y + 2.3, z + 1], [AW + 0.01, y + 0.2, z + 1]), f === 3 ? '#151924' : '#10131b');
    if (f < 3) {
      s += P(q4([AW, y - 0.4, Z0], [AW, y, Z0], [AW, y, Z1], [AW, y - 0.4, Z1]), '#1b212b', INK, 1.5);
      s += rail([AW, y, Z0], [AW, y, Z1], 0.9, '#3d4757');
    }
    // 맨 끝 벽의 층 띠
    if (f < 3) s += P(q4([0, y - 0.4, Z1], [AW, y - 0.4, Z1], [AW, y, Z1], [0, y, Z1]), '#151a22');
  }
  // 1층 바닥(까마득히 아래) + 달빛 웅덩이
  s += P(q4([0, GY, Z0], [AW, GY, Z0], [AW, GY, Z1], [0, GY, Z1]), '#0e1118');
  const mp = [AW * 0.5, GY, 6.5];
  const mc = pr(mp);
  s += `<ellipse cx="${f1(mc[0])}" cy="${f1(mc[1])}" rx="140" ry="40" fill="#9fb4dc" opacity="0.28" filter="url(#${ID}b12)"/>`;
  // 우리 쪽 아래층 슬래브 단면(난간 바로 밑으로 보이는 층 띠)
  for (let f = 1; f < 3; f++) {
    const y = -f * FH;
    s += P(q4([0, y - 0.4, Z0], [0, y, Z0], [0, y, Z1], [0, y - 0.4, Z1]), '#151a23', INK, 1.2);
  }
  // 천창 달빛 기둥(허공 가운데로)
  const top = [pr([AW * 0.3, 9, 4]), pr([AW * 0.75, 9, 6])], bot = [pr([AW * 0.3, GY, 6]), pr([AW * 0.75, GY, 7.5])];
  s += `<g filter="url(#${ID}b30)"><path d="M${pt(top[0])} L${pt(top[1])} L${pt(bot[1])} L${pt(bot[0])} Z" fill="url(#${ID}shaft)"/></g>`;
  return s;
}
// 난간: 위 손잡이 + 아래 띠 + 세로 살
function rail(a, b, h, col, w = 4) {
  let s = '';
  const A = pr([a[0], a[1] + h, a[2]]), B = pr([b[0], b[1] + h, b[2]]);
  s += P(`M${pt(A)} L${pt(B)}`, 'none', col, w);
  s += P(`M${pt(pr([a[0], a[1] + 0.1, a[2]]))} L${pt(pr([b[0], b[1] + 0.1, b[2]]))}`, 'none', '#20262f', w * 0.7);
  let bs = '';
  const n = Math.round(Math.abs(b[2] - a[2]) / 0.25);
  for (let i = 0; i <= n; i++) { const z = a[2] + (b[2] - a[2]) * i / n; bs += `M${pt(pr([a[0], a[1] + 0.1, z]))} L${pt(pr([a[0], a[1] + h, z]))} `; }
  s += P(bs, 'none', '#1b2029', 1.4);
  return s;
}

// 우리 쪽 복도 바닥 + 4층 난간(가까움, 굵게)
function nearFloor() {
  let s = '';
  s += P(q4([-3.2, 0, Z0], [0, 0, Z0], [0, 0, Z1], [-3.2, 0, Z1]), `url(#${ID}floor)`);
  let g = '';
  for (let x = -3; x <= 0; x += 0.6) g += `M${pt(pr([x, 0, Z0]))} L${pt(pr([x, 0, Z1]))} `;
  for (let z = -1; z < Z1; z += 0.6) g += `M${pt(pr([-3.2, 0, z]))} L${pt(pr([0, 0, z]))} `;
  s += P(g, 'none', '#1a1f28', 1.6, 'opacity="0.8"');
  // 슬래브 단면(허공 쪽 가장자리)
  s += P(q4([0, -0.4, Z0], [0, 0, Z0], [0, 0, Z1], [0, -0.4, Z1]), '#1d232d', INK, 2);
  return s;
}
function nearRail(z0, z1) {
  let s = '';
  const H = 1.1;
  // 세로 살
  let bs = '';
  for (let z = z0; z <= z1; z += 0.13) bs += `M${pt(pr([0, 0.05, z]))} L${pt(pr([0, H, z]))} `;
  s += P(bs, 'none', '#11151c', 4);
  s += P(bs, 'none', '#3a4352', 1.4, 'opacity="0.7"');
  // 아래 띠 · 위 손잡이(둥근 쇠파이프, 위쪽에 달빛)
  s += P(`M${pt(pr([0, 0.1, z0]))} L${pt(pr([0, 0.1, z1]))}`, 'none', '#1a1f28', 8);
  s += P(`M${pt(pr([0, H, z0]))} L${pt(pr([0, H, z1]))}`, 'none', INK, 18);
  s += P(`M${pt(pr([0, H, z0]))} L${pt(pr([0, H, z1]))}`, 'none', '#4a5464', 12);
  s += P(`M${pt(pr([0, H + 0.02, z0]))} L${pt(pr([0, H + 0.02, z1]))}`, 'none', '#b9c8e2', 3, 'opacity="0.7"');
  return s;
}

// ---------------------------------------------------------------- 은미(뒤로 젖혀져 넘어감) — 지역 좌표: 엉덩이(난간에 걸친 점) 0,0, 서 있을 때 머리 위 -
const UPPER = 50, LOWER = 30; // 윗몸·다리가 시계 방향으로 젖혀진 각도
function eunmi() {
  const C = EM.card, B = EM.blouse, K2 = EM.skirt, S = EM.skin, H = EM.hair;
  let s = '';
  // 다리 + 치마(엉덩이 아래, 이쪽 위로 들림)
  let lg = '';
  lg += P('M-70 -10 C-92 140 -120 300 -150 430 C-100 470 60 470 120 430 C110 300 92 140 70 -10 Z', K2.base, K2.line, 3.5);
  lg += P('M30 0 C52 140 76 300 96 440 L120 430 C110 300 92 140 70 -10 Z', K2.shade, 'none', 0, 'opacity="0.9"');
  lg += P('M-30 20 C-44 160 -60 300 -80 450 M10 20 C12 160 14 300 12 456 M44 20 C56 160 70 300 84 448', 'none', K2.line, 2.4, 'opacity="0.9"');
  lg += P('M-150 430 C-130 446 -110 440 -96 452 C-70 446 -50 462 -20 456 C10 464 40 452 70 458 C90 450 110 446 120 430', 'none', K2.light, 3, 'opacity="0.6"'); // 펄럭이는 단
  // 맨발 둘(한 발은 더 들림)
  for (const [x, y, r] of [[-70, 470, -10], [40, 452, 14]]) {
    lg += `<g transform="translate(${x} ${y}) rotate(${r})">` + P('M-22 -8 C-28 8 -24 30 -10 36 C4 40 20 38 26 28 C30 14 26 0 22 -10 Z', S.shade, S.line, 3) +
      P('M-8 36 l0 -7 M2 38 l0 -8 M12 37 l0 -8 M20 33 l0 -7', 'none', S.line, 1.5, 'opacity="0.8"') + '</g>';
  }
  s += `<g transform="rotate(${LOWER})">${lg}</g>`;
  // 윗몸(시계 방향으로 젖혀짐): 블라우스 + 펄럭이는 카디건 + 팔 + 머리
  let ub = '';
  ub += P('M-46 0 C-48 -100 -42 -200 -34 -300 L34 -300 C42 -200 48 -100 46 0 Z', B.base, B.line, 3);
  // 카디건 앞자락(아래로 펄럭이며 벌어짐)
  ub += P('M-34 -306 C-70 -300 -94 -290 -100 -270 C-110 -200 -118 -100 -150 20 C-120 30 -80 26 -50 40 C-44 -60 -42 -180 -34 -306 Z', C.base, C.line, 3.5);
  ub += P('M34 -306 C70 -300 94 -290 100 -270 C110 -200 124 -100 160 10 C130 24 90 22 56 36 C46 -60 42 -180 34 -306 Z', C.shade, C.line, 3.5);
  ub += P('M-150 20 C-120 30 -80 26 -50 40 L-48 52 C-80 40 -120 44 -152 32 Z M160 10 C130 24 90 22 56 36 L58 48 C92 34 130 36 162 22 Z', C.rib, C.line, 2);
  ub += P('M-70 -270 C-80 -180 -90 -90 -110 0 M70 -270 C82 -180 96 -90 120 -4', 'none', C.light, 2.5, 'opacity="0.45"');
  // 허공 쪽으로 내던진 팔(그림 오른쪽 = 뒤)
  ub += P('M90 -280 C140 -300 190 -330 230 -380 L252 -360 C214 -306 160 -268 104 -248 Z', C.shade, C.line, 3);
  ub += P('M230 -380 C248 -404 262 -420 270 -444 C276 -452 286 -448 284 -438 C280 -416 270 -392 252 -360 Z', S.shade, S.line, 2.5);
  ub += P('M270 -444 l4 -22 M276 -440 l10 -18 M281 -434 l14 -12', 'none', S.line, 5) + P('M270 -444 l4 -22 M276 -440 l10 -18 M281 -434 l14 -12', 'none', S.shade, 2.6);
  // 머리(턱이 들려 허공 쪽으로 젖혀짐) — 뒷머리는 이쪽 위로 솟구침
  ub += `<g transform="translate(0 -404) rotate(-14)">`;
  ub += P('M-40 -60 C-80 -120 -110 -190 -170 -250 C-140 -240 -120 -220 -100 -200 C-130 -260 -150 -320 -200 -370 C-150 -340 -110 -300 -80 -250 C-80 -300 -96 -350 -120 -400 C-70 -360 -50 -300 -40 -240 C-20 -280 0 -320 20 -360 C20 -300 10 -230 10 -170 C30 -200 60 -230 80 -280 C80 -220 60 -140 40 -70 Z', H.base, H.line, 3);
  ub += P('M-60 -120 C-90 -180 -120 -230 -160 -270 M-30 -150 C-50 -220 -70 -290 -100 -350 M0 -160 C6 -220 10 -280 16 -330', 'none', H.hi, 1.6, 'opacity="0.45"');
  ub += eunmiHead(ID, 'fall');
  ub += `</g>`;
  // 이쪽으로 허우적대는 팔(그림 왼쪽 위로 뻗음, 손가락을 벌림)
  ub += P('M-90 -280 C-140 -320 -190 -380 -224 -440 L-200 -456 C-168 -400 -122 -346 -76 -312 Z', C.base, C.line, 3);
  ub += P('M-224 -440 C-240 -466 -248 -488 -252 -510 L-226 -514 C-224 -494 -216 -474 -200 -456 Z', S.base, S.line, 2.5);
  const fing = 'M-252 -510 C-262 -530 -268 -548 -272 -566 M-244 -514 C-250 -538 -252 -558 -252 -578 M-236 -514 C-236 -538 -232 -560 -228 -576 M-228 -512 C-222 -530 -214 -546 -206 -560 M-252 -500 C-268 -500 -282 -492 -292 -480';
  ub += P(fing, 'none', S.line, 8) + P(fing, 'none', S.base, 4.4);
  s += `<g transform="rotate(${UPPER})">${ub}</g>`;
  return s;
}

// ---------------------------------------------------------------- 단발 소녀 실루엣(허공에 떠 있음, 얼굴 없음)
function girl() {
  let g = '';
  // 지역 좌표: 정수리 0,0 → 발 760 (아래는 어둠으로 사라짐)
  g += P('M0 0 C-50 0 -78 34 -80 84 C-82 118 -78 142 -70 156 L-58 150 C-46 160 -30 164 -16 164 L16 164 C30 164 46 160 58 150 L70 156 C78 142 82 118 80 84 C78 34 50 0 0 0 Z'); // 단발
  g += P('M-18 160 L-20 196 L20 196 L18 160 Z'); // 목
  g += P('M-20 190 C-60 196 -96 210 -108 236 C-116 300 -118 380 -112 460 L112 460 C118 380 116 300 108 236 C96 210 60 196 20 190 Z'); // 윗옷
  g += P('M-108 240 C-124 320 -130 400 -128 470 L-106 470 C-108 400 -104 320 -96 250 Z M108 240 C124 320 130 400 128 470 L106 470 C108 400 104 320 96 250 Z'); // 팔
  g += P('M-128 466 C-132 490 -130 506 -120 512 L-108 506 L-106 470 Z M128 466 C132 490 130 506 120 512 L108 506 L106 470 Z'); // 손
  g += P('M-104 456 L104 456 L130 600 L-130 600 Z'); // 주름치마
  g += P('M-64 596 L-40 596 L-44 760 L-62 760 Z M40 596 L64 596 L62 760 L44 760 Z'); // 다리
  return g;
}

export function draw() {
  // 엉덩이(난간 위) 위치: 난간 손잡이의 z = HZ 지점 바로 위
  const HZ = 2.0, hip = pr([0.02, 1.16, HZ]);
  const sc = FOC / depth([0, 1.1, HZ]) / 540 * 1.1; // 지역 px → 화면 배율(지역 540 px ≈ 1 m, 살짝 크게)
  const gz = [1.7, 2.0, 3.6], gTop = pr(gz), gk = FOC / depth(gz) / 470;
  const defs = headDefs(ID) +
    `<filter id="${ID}b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<linearGradient id="${ID}shaft" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d4f2" stop-opacity="0.42"/><stop offset="1" stop-color="#c3d4f2" stop-opacity="0.08"/></linearGradient>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#151922"/><stop offset="1" stop-color="#0b0d12"/></linearGradient>` +
    `<linearGradient id="${ID}gfade" gradientUnits="userSpaceOnUse" x1="0" y1="440" x2="0" y2="760"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="${ID}gM" maskUnits="userSpaceOnUse" x="-400" y="-200" width="800" height="1200"><rect x="-400" y="-200" width="800" height="1200" fill="url(#${ID}gfade)"/></mask>` +
    `<radialGradient id="${ID}vig" cx="560" cy="700" r="920" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>`;
  let s = atrium();
  // 소녀: 달빛 기둥 속의 검은 실루엣 + 차가운 테두리
  const gs = girl();
  s += `<g transform="translate(${f1(gTop[0])} ${f1(gTop[1])}) scale(${f1(gk * 100) / 100})" mask="url(#${ID}gM)">` +
    `<g fill="#9fb6e0" opacity="0.55" transform="translate(4 -3)" filter="url(#${ID}b4)">${gs}</g><g fill="#020306">${gs}</g></g>`;
  s += nearFloor();
  s += nearRail(Z0, HZ - 0.25);
  // 은미(난간에 걸쳐 넘어감)
  s += `<g transform="translate(${f1(hip[0])} ${f1(hip[1])}) scale(${f1(sc * 100) / 100})">${eunmi()}</g>`;
  s += nearRail(HZ + 0.25, Z1);
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
