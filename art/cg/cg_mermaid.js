// cg_mermaid — 3장 신관 옥상 수영장, 밤. 검은 물 위로 젖은 긴 머리의 인어가 허리 위를 드러내고 이쪽을 본다.
// 창백한 푸른 회색 얼굴(커다란 흐린 눈, 푸른 입술), 머리카락이 어깨·가슴을 덮고 물 위로 퍼져 떠 있으며 허리께 물결선 위로 비늘이 비친다.
// 물속엔 꼬리의 검은 그림자, 뒤쪽에서 꼬리지느러미가 수면을 치며 물보라. 오른쪽 위 달과 수면의 부서진 달빛 기둥,
// 먼 쪽 수영장 가장자리·다이빙대·철망 울타리·물탱크 실루엣. 앞쪽 가장자리(젖은 타일) 위로 L자 막대 두 개를 쥔 두 손(남색 소매) —
// 막대 끝이 인어를 향해 엇갈린다.
import * as K from '../kit.js';
import { taper } from './cg_hanging.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#04070a';
const ID = 'mm';

const FAR = 610, NEAR = 1388; // 먼 쪽 / 앞쪽 수영장 가장자리(수면 높이)
const MX = 452, WL = 1000; // 인어 가운데 x, 허리의 물높이
const MOON = [780, 196];
const SK = { base: '#b9c7cf', shade: '#8395a2', deep: '#55687a', line: '#1a232c', lip: '#55728a' };
const HR = { base: '#06090d', shade: '#020304', hi: '#6f8fb6', wet: '#a9c4e6' };

function sky() {
  let s = `<rect width="1024" height="${FAR}" fill="url(#${ID}sky)"/>`;
  s += `<circle cx="${MOON[0]}" cy="${MOON[1]}" r="190" fill="#9fb6dc" opacity="0.18" filter="url(#${ID}b30)"/>`;
  s += `<circle cx="${MOON[0]}" cy="${MOON[1]}" r="62" fill="#e8eef6"/><circle cx="${MOON[0] + 14}" cy="${MOON[1] - 10}" r="14" fill="#c9d3df" opacity="0.6"/><circle cx="${MOON[0] - 20}" cy="${MOON[1] + 18}" r="9" fill="#c9d3df" opacity="0.5"/>`;
  s += P(`M560 250 C620 230 700 240 760 262 C820 280 900 270 960 250 L960 268 C900 290 820 300 760 284 C700 266 620 258 560 270 Z`, '#1a2338', 'none', 0, 'opacity="0.8"'); // 달을 가로지르는 구름
  // 먼 도시 불빛(아주 흐리게)
  let q = 3, st = '';
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  for (let i = 0; i < 40; i++) st += `<circle cx="${f1(rnd() * 1024)}" cy="${f1(rnd() * 360)}" r="${f1(0.8 + rnd() * 1.4)}" fill="#cfd9ea" opacity="${f1(0.2 + rnd() * 0.5)}"/>`;
  s += st;
  s += P('M0 520 L80 512 L120 530 L200 520 L260 534 L340 526 L420 540 L1024 536 L1024 560 L0 560 Z', '#0b1220', 'none', 0, 'opacity="0.9"');
  // 물탱크(왼쪽 뒤) · 철망 울타리
  s += P('M60 300 L220 300 L220 520 L60 520 Z', '#0c1119', INK, 3);
  s += `<ellipse cx="140" cy="300" rx="80" ry="16" fill="#141b26" stroke="${INK}" stroke-width="3"/>`;
  s += P('M80 520 L80 560 M200 520 L200 560 M60 380 L220 380 M60 450 L220 450', 'none', '#05080c', 4);
  s += P('M216 310 L216 510', 'none', '#7f97bd', 2, 'opacity="0.4"');
  let fence = '';
  for (let x = 0; x <= 1024; x += 92) fence += `M${x} 430 L${x} ${FAR - 30} `;
  fence += `M0 432 L1024 432 M0 ${FAR - 40} L1024 ${FAR - 40}`;
  s += P(fence, 'none', '#05070b', 5);
  let mesh = '';
  for (let x = -200; x < 1100; x += 16) mesh += `M${x} 432 L${x + 140} ${FAR - 40} M${x + 140} 432 L${x} ${FAR - 40} `;
  s += P(mesh, 'none', '#0f1724', 1.2, 'opacity="0.8"');
  return s;
}

function poolFar() {
  let s = '';
  // 먼 쪽 데크 + 가장자리 타일 + 다이빙대
  s += `<rect x="0" y="${FAR - 40}" width="1024" height="40" fill="#1a222c"/>`;
  s += `<rect x="0" y="${FAR - 10}" width="1024" height="12" fill="#5d6f82" stroke="${INK}" stroke-width="2"/>`;
  let tl = '';
  for (let x = 0; x < 1024; x += 26) tl += `M${x} ${FAR - 10} L${x} ${FAR + 2} `;
  s += P(tl, 'none', '#2b3846', 1.5);
  s += P(`M820 ${FAR - 26} L1024 ${FAR - 34} L1024 ${FAR - 24} L824 ${FAR - 16} Z`, '#8796a6', INK, 2.5);
  s += P(`M860 ${FAR - 18} L860 ${FAR - 2} M960 ${FAR - 22} L960 ${FAR - 2}`, 'none', '#1a222c', 6);
  return s;
}

function water() {
  let s = `<rect x="0" y="${FAR}" width="1024" height="${NEAR - FAR}" fill="url(#${ID}water)"/>`;
  // 바닥 레인 줄(물밑으로 흔들리게)
  let ln = '';
  for (const x of [-0.6, 0, 0.6]) {
    const x0 = 512 + x * 520, x1 = 512 + x * 1500;
    let d = `M${f1(x0)} ${FAR + 6}`;
    for (let k = 1; k <= 10; k++) { const t = k / 10, y = FAR + 6 + (NEAR - FAR) * t, xx = x0 + (x1 - x0) * t + Math.sin(k * 1.7) * 6 * t; d += ` L${f1(xx)} ${f1(y)}`; }
    ln += d + ' ';
  }
  s += P(ln, 'none', '#14303c', 10, 'opacity="0.55"');
  // 물결: 가로 짧은 빛줄(멀수록 촘촘·가늘게)
  let q = 17, rp = '';
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  for (let i = 0; i < 220; i++) {
    const t = rnd(), y = FAR + 8 + (NEAR - FAR) * t * t, x = rnd() * 1024, w = 10 + 80 * t * t + rnd() * 30;
    rp += `M${f1(x)} ${f1(y)} q${f1(w / 2)} ${f1(-2 - 3 * t)} ${f1(w)} 0 `;
  }
  s += P(rp, 'none', '#6c8fb4', 1.6, 'opacity="0.28"');
  // 부서진 달빛 기둥
  let mb = '';
  for (let i = 0; i < 60; i++) {
    const t = i / 60, y = FAR + 10 + (NEAR - FAR - 30) * t * t, spread = 18 + t * 160, x = MOON[0] - 60 * t + (rnd() - 0.5) * spread, w = 12 + t * 70 * rnd();
    mb += `M${f1(x - w / 2)} ${f1(y)} q${f1(w / 2)} ${f1(-2 - 2 * t)} ${f1(w)} 0 `;
  }
  s += P(mb, 'none', '#e6eefa', 3, 'opacity="0.7"');
  s += `<g filter="url(#${ID}b12)"><path d="M${MOON[0] - 18} ${FAR} L${MOON[0] + 18} ${FAR} L${MOON[0] + 60} ${NEAR - 200} L${MOON[0] - 180} ${NEAR - 200} Z" fill="#9fb6dc" opacity="0.18"/></g>`;
  return s;
}

// ---------------------------------------------------------------- 인어
// 물속 꼬리 그림자 + 뒤쪽 꼬리지느러미 물보라(몸보다 먼저)
function tail() {
  let s = '';
  s += `<g filter="url(#${ID}b12)" opacity="0.75">${P(`M${MX - 90} ${WL + 10} C${MX - 60} ${WL - 70} ${MX + 120} ${WL - 150} ${MX + 260} ${WL - 190} C${MX + 320} ${WL - 205} ${MX + 360} ${WL - 230} ${MX + 380} ${WL - 250} L${MX + 400} ${WL - 230} C${MX + 360} ${WL - 180} ${MX + 200} ${WL - 90} ${MX + 110} ${WL + 30} Z`, '#020608')}</g>`;
  // 꼬리지느러미: 수면을 뚫고 세로로 치솟은 갈래 지느러미(반투명 청록, 결 무늬, 물줄기)
  const fx = MX + 360, fy = WL - 214;
  let fin = '';
  fin += P('M-15 4 C-17 -30 -11 -60 -9 -84 L9 -84 C11 -60 17 -30 15 4 Z', '#2c5560', SK.line, 3);
  for (let k = 0; k < 4; k++) fin += P(`M-13 ${-8 - k * 18} q13 9 26 0`, 'none', '#8fcfcf', 1.4, 'opacity="0.5"');
  const lobes = 'M-9 -80 C-44 -100 -84 -146 -100 -200 C-74 -176 -40 -156 0 -136 C40 -158 72 -180 102 -206 C86 -146 44 -100 9 -80 Z';
  fin += P(lobes, `url(#${ID}fin)`, SK.line, 3);
  let rays = '';
  for (const [x, y] of [[-96, -196], [-78, -176], [-56, -160], [-30, -146], [30, -148], [56, -164], [80, -182], [100, -202]]) rays += `M0 -84 L${x * 0.92} ${y * 0.95} `;
  fin += P(rays, 'none', '#a9e0de', 1.5, 'opacity="0.55"');
  fin += P('M102 -206 C86 -146 44 -100 9 -80', 'none', '#e2f2f6', 2.5, 'opacity="0.7"');
  // 지느러미에서 떨어지는 물줄기
  fin += P('M-96 -190 C-98 -150 -94 -110 -96 -70 M-60 -150 C-62 -120 -58 -90 -60 -60 M96 -196 C98 -160 96 -120 98 -80', 'none', '#cfe2f4', 2, 'opacity="0.55" stroke-dasharray="14 8 6 10"');
  s += `<g transform="translate(${fx} ${fy}) rotate(10)">${fin}</g>`;
  // 물보라
  let q = 29, sp = '';
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  for (let i = 0; i < 30; i++) { const a = -Math.PI * (0.08 + rnd() * 0.84), d = 20 + rnd() * 110, x = fx + Math.cos(a) * d * 1.3, y = fy + 4 + Math.sin(a) * d * 0.9; sp += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(1.5 + rnd() * 4)}" fill="#dbe8f6" opacity="${f1(0.35 + rnd() * 0.5)}"/>`; }
  s += sp;
  s += `<ellipse cx="${fx}" cy="${fy + 6}" rx="120" ry="16" fill="none" stroke="#bcd2ec" stroke-width="2.5" opacity="0.55"/>`;
  s += `<ellipse cx="${fx}" cy="${fy + 6}" rx="190" ry="24" fill="none" stroke="#9fb8d8" stroke-width="1.8" opacity="0.3"/>`;
  s += `<ellipse cx="${fx}" cy="${fy + 6}" rx="60" ry="9" fill="#dbe8f6" opacity="0.3"/>`;
  return s;
}

// 머리·얼굴은 kit.js 초상화 얼굴(희민·소영 등과 같은 선화)을 작게 줄여 쓴다: kit 좌표 (512,485) → 화면 (MX, HY)
const HY = 575, HS = 0.44;
const KX = v => MX + (v - 512) * HS, KY = v => HY + (v - 485) * HS;
const FSKIN = { base: '#c4d0d7', shade: '#93a4b1', line: '#26313b', blush: '#7d93a8', lip: '#4b6378' };
const FIRIS = ['#1d2a2c', '#6f8c88', '#c9dcd6'];
const STARE = { eye: { open: 1.06, iris: 0.58 }, brow: { dy: -2, inner: -8 }, mouth: 'neutral', blush: 0 };

function face() {
  let s = '';
  // 뒤로 넘어간 젖은 머리(정수리 가르마에서 두피에 착 붙어 양옆 턱선까지)
  const capL = 'M512 232 C414 230 344 300 338 410 C332 500 340 590 352 676 L392 690 C382 600 380 512 388 440 C396 360 438 300 504 290 Z';
  const capR = 'M512 232 C610 230 680 300 686 410 C692 500 684 590 672 676 L632 690 C642 600 644 512 636 440 C628 360 586 300 520 290 Z';
  s += K.skin(FSKIN, { ears: 'none' });
  s += K.cheeks(FSKIN, { blush: 0.18 });
  s += `<g opacity="0.55" filter="url(#soft)"><ellipse cx="438" cy="560" rx="58" ry="40" fill="#4f6474"/><ellipse cx="586" cy="560" rx="62" ry="42" fill="#4f6474"/></g>`; // 꺼진 눈두덩
  // 눈: 생기 없는 흐린 눈(반짝임을 지우고 흰자를 잿빛으로)
  s += K.eyes(STARE, FIRIS, { lidSkin: FSKIN.base, pre: `${ID}e`, lash: 8 })
    .replace(/<ellipse cx="[^"]+" cy="[^"]+" rx="[^"]+" ry="[^"]+" fill="#fff"\/>/g, '')
    .replace(/<circle cx="[^"]+" cy="[^"]+" r="[^"]+" fill="#fff" opacity="0.9"\/>/g, '')
    .replace(/fill="#fff"/g, 'fill="#c9d4d2"');
  // 살짝 벌어진 푸른 입술
  s += P('M474 652 C490 646 520 646 536 652 C520 664 490 664 474 652 Z', '#0d1418', '#2a3a48', 3);
  s += P('M478 668 C494 678 516 678 532 668', 'none', '#6d8aa0', 5, 'opacity="0.75"');
  s += P('M482 648 C494 642 516 642 528 648', 'none', '#5a7488', 3.5, 'opacity="0.7"');
  s += P(capL, HR.base, HR.shade, 4) + P(capR, HR.base, HR.shade, 4);
  s += P('M512 236 L512 300', 'none', '#2a3a50', 3, 'opacity="0.8"'); // 가르마
  s += P('M500 248 C430 252 380 300 362 380 M524 248 C594 252 644 300 662 380', 'none', HR.hi, 7, 'opacity="0.55" stroke-dasharray="40 14 60 18 30"');
  s += P(taper([[600, 270], [650, 330], [668, 420], [668, 540]], 12) + ' ' + taper([[420, 268], [372, 330], [356, 430], [358, 560]], 10), HR.wet, 'none', 0, 'opacity="0.5"');
  // 이마·볼에 붙은 젖은 가닥
  s += P('M470 300 C452 360 446 420 452 470 M560 296 C590 350 606 420 600 470 M392 520 C404 580 400 640 420 700', 'none', HR.base, 7);
  s += K.brows(STARE, '#2a333c', 5);
  return s;
}

function body(faceSvg) {
  let s = '';
  const B = (sd, x) => f1(MX + sd * x);
  // 물 위로 퍼져 떠 있는 머리카락(몸 양옆으로)
  s += P(`M${MX - 70} ${WL - 6} C${MX - 160} ${WL - 4} ${MX - 250} ${WL + 30} ${MX - 300} ${WL + 10} C${MX - 260} ${WL - 20} ${MX - 220} ${WL - 26} ${MX - 160} ${WL - 26} C${MX - 230} ${WL - 50} ${MX - 270} ${WL - 40} ${MX - 330} ${WL - 52} C${MX - 260} ${WL - 70} ${MX - 160} ${WL - 52} ${MX - 80} ${WL - 30} Z`, HR.base, HR.shade, 2);
  s += P(`M${MX + 80} ${WL - 10} C${MX + 170} ${WL - 6} ${MX + 240} ${WL + 26} ${MX + 300} ${WL + 14} C${MX + 250} ${WL - 16} ${MX + 200} ${WL - 30} ${MX + 140} ${WL - 32} Z`, HR.base, HR.shade, 2);
  s += P(`M${MX - 290} ${WL - 44} C${MX - 230} ${WL - 52} ${MX - 170} ${WL - 40} ${MX - 120} ${WL - 26} M${MX + 160} ${WL - 24} C${MX + 210} ${WL - 14} ${MX + 250} ${WL + 4} ${MX + 286} ${WL + 10}`, 'none', HR.hi, 1.6, 'opacity="0.5"');
  // 뒷머리(머리 뒤에서 어깨 뒤로)
  s += P(`M${MX} ${KY(226)} C${B(-1, 92)} ${KY(232)} ${B(-1, 122)} ${KY(400)} ${B(-1, 120)} ${KY(560)} C${B(-1, 130)} ${HY + 150} ${B(-1, 160)} ${HY + 200} ${B(-1, 164)} ${WL - 4} L${B(1, 164)} ${WL - 4} C${B(1, 160)} ${HY + 200} ${B(1, 130)} ${HY + 150} ${B(1, 120)} ${KY(560)} C${B(1, 122)} ${KY(400)} ${B(1, 92)} ${KY(232)} ${MX} ${KY(226)} Z`, HR.base, HR.shade, 3);
  s += faceSvg; // 얼굴·목(몸통이 목 아랫단을 덮도록 먼저)
  // 어깨·팔·몸통(가는 체형). 위팔은 몸 옆으로 내려 물에 잠김
  const yN = KY(800), yS = yN + 34, yD = yN + 72, yA = yN + 96;
  for (const sd of [-1, 1]) {
    s += P(`M${B(sd, 26)} ${f1(yN - 30)} C${B(sd, 50)} ${f1(yN)} ${B(sd, 90)} ${f1(yS - 8)} ${B(sd, 118)} ${f1(yS)} C${B(sd, 142)} ${f1(yS + 10)} ${B(sd, 150)} ${f1(yD)} ${B(sd, 146)} ${f1(yD + 40)} C${B(sd, 142)} ${f1(yD + 110)} ${B(sd, 140)} ${WL - 60} ${B(sd, 138)} ${WL + 8} L${B(sd, 98)} ${WL + 8} C${B(sd, 98)} ${WL - 80} ${B(sd, 100)} ${f1(yA + 60)} ${B(sd, 100)} ${f1(yA)} Z`, sd < 0 ? `url(#${ID}skinL)` : `url(#${ID}skin)`, SK.line, 3);
  }
  s += P(`M${B(-1, 100)} ${f1(yA - 6)} C${B(-1, 96)} ${f1(yA + 80)} ${B(-1, 90)} ${WL - 60} ${B(-1, 86)} ${WL + 8} L${B(1, 86)} ${WL + 8} C${B(1, 90)} ${WL - 60} ${B(1, 96)} ${f1(yA + 80)} ${B(1, 100)} ${f1(yA - 6)} L${B(1, 44)} ${f1(yN)} L${B(1, 26)} ${f1(yN - 34)} L${B(-1, 26)} ${f1(yN - 34)} L${B(-1, 44)} ${f1(yN)} Z`, `url(#${ID}skin)`, 'none');
  s += P(`M${B(-1, 100)} ${f1(yA - 6)} C${B(-1, 96)} ${f1(yA + 80)} ${B(-1, 90)} ${WL - 60} ${B(-1, 86)} ${WL + 8} M${B(1, 100)} ${f1(yA - 6)} C${B(1, 96)} ${f1(yA + 80)} ${B(1, 90)} ${WL - 60} ${B(1, 86)} ${WL + 8}`, 'none', SK.line, 3);
  s += P(`M${B(-1, 36)} ${f1(yN + 8)} C${B(-1, 16)} ${f1(yN + 18)} ${B(1, 16)} ${f1(yN + 18)} ${B(1, 36)} ${f1(yN + 8)}`, 'none', SK.deep, 2.5, 'opacity="0.6"'); // 쇄골
  // 비늘: 갈비뼈 아래부터 물결선까지
  let sc = '';
  for (let r = 0; r < 7; r++) for (let c = -5; c <= 5; c++) {
    const x = MX + c * 18 + (r % 2) * 9, y = WL - 4 - r * 13;
    sc += `M${f1(x - 9)} ${f1(y)} q9 10 18 0 `;
  }
  s += `<g clip-path="url(#${ID}torsoClip)">${P(`M${MX - 110} ${WL - 110} L${MX + 110} ${WL - 110} L${MX + 110} ${WL + 10} L${MX - 110} ${WL + 10} Z`, `url(#${ID}scaleG)`)}${P(sc, 'none', '#a6e4e0', 1.5, 'opacity="0.55"')}</g>`;
  // 앞머리 다발: 턱 옆에서 어깨를 넘어 가슴을 덮고(가운데서 겹침) 허리께 갈라져 물로
  for (const sd of [-1, 1]) {
    const clump = `M${B(sd, 54)} ${KY(620)} C${B(sd, 44)} ${f1(yN)} ${B(sd, 16)} ${f1(yS + 26)} ${B(-sd, 6)} ${f1(yA + 40)} C${B(-sd, 8)} ${f1(yA + 86)} ${B(sd, 4)} ${WL - 120} ${B(sd, 24)} ${WL - 76} ` +
      `L${B(sd, 30)} ${WL - 2} L${B(sd, 42)} ${WL - 52} L${B(sd, 58)} ${WL - 4} L${B(sd, 70)} ${WL - 30} L${B(sd, 80)} ${WL - 2} L${B(sd, 88)} ${WL - 44} L${B(sd, 96)} ${WL - 2} C${B(sd, 104)} ${WL - 120} ${B(sd, 114)} ${f1(yA + 40)} ${B(sd, 104)} ${f1(yS)} C${B(sd, 96)} ${f1(yN - 10)} ${B(sd, 84)} ${KY(640)} ${B(sd, 70)} ${KY(560)} Z`;
    s += P(clump, HR.base, HR.shade, 2.5);
    s += P(taper([[MX + sd * 54, KY(640)], [MX + sd * 40, yS], [MX + sd * 30, yA + 60], [MX + sd * 44, WL - 50]], 7) + ' ' + taper([[MX + sd * 76, KY(650)], [MX + sd * 84, yS + 20], [MX + sd * 80, yA + 80], [MX + sd * 82, WL - 30]], 5), HR.wet, 'none', 0, 'opacity="0.42"');
    s += P(`M${B(sd, 60)} ${KY(640)} C${B(sd, 50)} ${f1(yS)} ${B(sd, 56)} ${f1(yA + 100)} ${B(sd, 62)} ${WL - 8} M${B(sd, 90)} ${f1(yN)} C${B(sd, 98)} ${f1(yA)} ${B(sd, 96)} ${WL - 100} ${B(sd, 90)} ${WL - 10}`, 'none', HR.hi, 1.3, 'opacity="0.35"');
  }
  // 물방울(머리끝·턱에서)
  for (const [x, y, r] of [[MX - 40, WL - 10, 4], [MX + 70, WL - 6, 3.5], [MX - 2, KY(740), 3.2], [MX - 100, WL - 26, 3]]) s += `<ellipse cx="${x}" cy="${f1(y)}" rx="${r * 0.7}" ry="${r}" fill="#dbe8f6" opacity="0.8"/>`;
  return s;
}

// 물결선: 몸 둘레 밝은 테 + 동심 물결
function waterline() {
  let s = '';
  s += `<ellipse cx="${MX + 4}" cy="${WL + 6}" rx="150" ry="16" fill="none" stroke="#c8daf0" stroke-width="3" opacity="0.6"/>`;
  for (const [rx, ry, o] of [[230, 26, 0.4], [310, 36, 0.28], [410, 48, 0.18]]) s += `<ellipse cx="${MX + 4}" cy="${WL + 10}" rx="${rx}" ry="${ry}" fill="none" stroke="#9fb8d8" stroke-width="2" opacity="${o}"/>`;
  // 물속으로 잠긴 몸(흐리게 굴절)
  s += `<g opacity="0.22" filter="url(#${ID}b12)">${P(`M${MX - 140} ${WL + 14} C${MX - 130} ${WL + 70} ${MX - 100} ${WL + 120} ${MX - 50} ${WL + 150} L${MX + 60} ${WL + 150} C${MX + 110} ${WL + 120} ${MX + 140} ${WL + 70} ${MX + 146} ${WL + 14} Z`, '#2f5a66')}</g>`;
  return s;
}

// ---------------------------------------------------------------- 앞쪽: 젖은 가장자리 타일 + L자 막대를 쥔 두 손
const SKIN = { base: '#b49686', shade: '#836a5f', line: '#2a1a15', rim: '#d8e4f2' };
const ROD_X = -26, ROD_TOP = -70; // 주먹 지역 좌표에서 막대가 나오는 점
// 주먹(막대를 세워 쥔 손을 뒤에서 내려다봄: 손바닥이 안쪽을 보고, 말아 쥔 네 손가락이 안쪽 옆면에 층층이, 엄지가 위를 덮음)
// side 1 = 오른손(화면 오른쪽, 손가락이 왼쪽), -1 = 왼손
function fist(side) {
  const m = d => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f1(x * side)} ${y}`);
  let s = '';
  // 소매 + 흰 소맷부리
  s += P(m('M14 34 C44 70 84 120 120 190 L240 190 C190 116 130 62 76 18 Z'), K.NAVY.base, K.NAVY.line, 4);
  s += P(m('M60 80 C90 116 120 150 140 190 L240 190 C190 116 140 72 100 44 Z'), K.NAVY.shade, 'none');
  s += P(m('M20 40 C30 30 50 14 64 4'), 'none', K.NAVY.light, 4, 'opacity="0.5"');
  s += P(m('M2 24 C18 44 40 60 58 70 L84 38 C66 30 46 16 28 0 Z'), K.SHIRT.base, K.SHIRT.line, 3);
  // 막대 아래 끝(새끼손가락 밑으로 삐져나옴)
  s += P(m(`M${ROD_X} 50 L${ROD_X} 84`), 'none', INK, 12) + P(m(`M${ROD_X} 50 L${ROD_X} 84`), 'none', '#9a958c', 7);
  // 손등(바깥쪽)
  s += P(m('M-8 -58 C18 -68 48 -62 60 -40 C72 -10 72 22 58 46 C42 64 14 66 -6 56 Z'), SKIN.base, SKIN.line, 3.5);
  s += P(m('M40 -56 C60 -40 70 -10 66 20 C62 40 52 54 36 60 C50 30 54 -10 40 -56 Z'), SKIN.shade, 'none', 0, 'opacity="0.6"');
  s += P(m('M14 -40 C22 -10 22 20 16 44'), 'none', SKIN.shade, 3, 'opacity="0.5"'); // 손등 힘줄
  // 말아 쥔 손가락 넷(안쪽 옆면에 층층이)
  for (let k = 0; k < 4; k++) {
    const y0 = -50 + k * 25, w = 46 - k * 4;
    s += P(m(`M-4 ${y0} C${-w * 0.6} ${y0 - 4} ${-w} ${y0 + 1} ${-w - 4} ${y0 + 11} C${-w - 6} ${y0 + 22} ${-w + 6} ${y0 + 27} -4 ${y0 + 25} Z`), SKIN.base, SKIN.line, 3);
    s += P(m(`M${-w + 2} ${y0 + 6} C${-w - 2} ${y0 + 12} ${-w} ${y0 + 20} ${-w + 6} ${y0 + 22}`), 'none', SKIN.shade, 2.5, 'opacity="0.8"');
  }
  // 엄지(검지 위를 덮고 막대에 닿음)
  s += P(m('M36 -52 C22 -72 -8 -80 -42 -72 C-56 -68 -58 -56 -46 -52 C-22 -56 4 -50 20 -38 Z'), SKIN.base, SKIN.line, 3);
  s += P(m('M-36 -70 C-48 -68 -52 -60 -46 -56 C-40 -58 -36 -62 -36 -70 Z'), '#c9b2a6', SKIN.line, 1.5); // 엄지손톱
  // 달빛 테두리(위쪽 가장자리)
  s += P(m('M-40 -74 C-8 -82 22 -74 38 -56 C50 -60 58 -50 62 -36'), 'none', SKIN.rim, 2.5, 'opacity="0.7"');
  return s;
}
const fistAt = (o, ang, side) => { const r = ang * Math.PI / 180, x = ROD_X * side, y = ROD_TOP; return [o[0] + x * Math.cos(r) - y * Math.sin(r), o[1] + x * Math.sin(r) + y * Math.cos(r)]; };

// L자 막대: 주먹 위로 짧은 세로 다리가 나와 꺾인 뒤, 긴 다리가 앞(화면 위쪽, 인어 쪽)으로 가늘어지며 뻗음
function rod(base, tip) {
  const bend = [base[0], base[1] - 56];
  let s = '';
  s += P(`M${pt(base)} L${pt(bend)}`, 'none', INK, 13) + P(`M${pt(base)} L${pt(bend)}`, 'none', '#a8a39a', 8);
  // 긴 다리: 굵기를 줄이며(원근) 뻗는다
  const dx = tip[0] - bend[0], dy = tip[1] - bend[1], L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const w0 = 6, w1 = 1.6;
  const body = poly([[bend[0] + nx * w0, bend[1] + ny * w0], [tip[0] + nx * w1, tip[1] + ny * w1], [tip[0] - nx * w1, tip[1] - ny * w1], [bend[0] - nx * w0, bend[1] - ny * w0]]);
  s += P(body, '#8f8a82', INK, 2.5);
  s += P(`M${pt([bend[0] + nx * 2, bend[1] + ny * 2])} L${pt(tip)}`, 'none', '#f2efe8', 2, 'opacity="0.8"');
  s += `<circle cx="${f1(bend[0])}" cy="${f1(bend[1])}" r="7.5" fill="#a8a39a" stroke="${INK}" stroke-width="2.5"/>`;
  return s;
}

function foreground() {
  let s = '';
  // 앞쪽 가장자리(젖은 하늘색 타일) — 수면보다 조금 높게
  s += `<rect x="0" y="${NEAR - 6}" width="1024" height="${1536 - NEAR + 6}" fill="url(#${ID}deck)"/>`;
  s += `<rect x="0" y="${NEAR - 6}" width="1024" height="22" fill="#7e94a8" stroke="${INK}" stroke-width="3"/>`;
  s += P(`M0 ${NEAR - 3} L1024 ${NEAR - 3}`, 'none', '#dfe9f4', 2, 'opacity="0.6"');
  let tl = '';
  for (let x = -40; x < 1100; x += 34) tl += `M${x} ${NEAR - 6} L${x} ${NEAR + 16} `;
  for (let i = 0; i < 5; i++) { const y = NEAR + 16 + i * i * 6 + i * 26; tl += `M0 ${f1(y)} L1024 ${f1(y)} `; }
  for (let i = -10; i <= 10; i++) tl += `M${512 + i * 60} ${NEAR + 16} L${512 + i * 150} 1536 `;
  s += P(tl, 'none', '#24323f', 2, 'opacity="0.85"');
  // 고인 물에 비친 달빛
  s += P(`M640 ${NEAR + 30} C700 ${NEAR + 24} 820 ${NEAR + 30} 900 ${NEAR + 46} C820 ${NEAR + 62} 700 ${NEAR + 60} 640 ${NEAR + 30} Z`, '#b7cbe6', 'none', 0, 'opacity="0.18"');
  // 수영장 사다리(왼쪽 가장자리, 크롬 손잡이)
  for (const x of [96, 176]) {
    s += P(`M${x} ${NEAR + 14} C${x} ${NEAR - 60} ${x + 6} ${NEAR - 100} ${x + 34} ${NEAR - 104} C${x + 60} ${NEAR - 106} ${x + 70} ${NEAR - 80} ${x + 70} ${NEAR - 40} L${x + 70} ${NEAR + 40}`, 'none', INK, 14);
    s += P(`M${x} ${NEAR + 14} C${x} ${NEAR - 60} ${x + 6} ${NEAR - 100} ${x + 34} ${NEAR - 104} C${x + 60} ${NEAR - 106} ${x + 70} ${NEAR - 80} ${x + 70} ${NEAR - 40} L${x + 70} ${NEAR + 40}`, 'none', '#aab8c8', 8);
    s += P(`M${x + 4} ${NEAR - 40} C${x + 6} ${NEAR - 86} ${x + 14} ${NEAR - 98} ${x + 34} ${NEAR - 100}`, 'none', '#f2f6fb', 2.5, 'opacity="0.8"');
  }
  // 두 손 + 막대(끝이 인어 앞에서 엇갈림)
  const R = [800, 1418], L = [230, 1428];
  s += rod(fistAt(R, -6, 1), [MX - 50, 1150]);
  s += rod(fistAt(L, 6, -1), [MX + 120, 1160]);
  s += `<g transform="translate(${R[0]} ${R[1]}) rotate(-6)">${fist(1)}</g>`;
  s += `<g transform="translate(${L[0]} ${L[1]}) rotate(6)">${fist(-1)}</g>`;
  return s;
}

export function draw() {
  const defs = K.DEFS + K.irisDefs(FIRIS, `${ID}e`) +
    `<linearGradient id="${ID}skinL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${SK.deep}"/><stop offset="1" stop-color="${SK.shade}"/></linearGradient>` +
    `<filter id="${ID}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05080f"/><stop offset="0.7" stop-color="#121c30"/><stop offset="1" stop-color="#1c2840"/></linearGradient>` +
    `<linearGradient id="${ID}water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3040"/><stop offset="0.25" stop-color="#0b1a24"/><stop offset="1" stop-color="#040a0e"/></linearGradient>` +
    `<linearGradient id="${ID}deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3e5162"/><stop offset="1" stop-color="#121a22"/></linearGradient>` +
    `<radialGradient id="${ID}skin" cx="${MX + 70}" cy="${HY + 170}" r="320" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d6e1e6"/><stop offset="0.6" stop-color="${SK.base}"/><stop offset="1" stop-color="${SK.deep}"/></radialGradient>` +
    `<radialGradient id="${ID}face" cx="0.62" cy="0.36" r="0.8"><stop offset="0" stop-color="#e6eef2"/><stop offset="0.6" stop-color="${SK.base}"/><stop offset="1" stop-color="${SK.shade}"/></radialGradient>` +
    `<linearGradient id="${ID}scaleG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f8a8e" stop-opacity="0"/><stop offset="0.5" stop-color="#3f7a80" stop-opacity="0.6"/><stop offset="1" stop-color="#1f4a52"/></linearGradient>` +
    `<linearGradient id="${ID}fin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f6a70" stop-opacity="0.95"/><stop offset="1" stop-color="#8fd0cf" stop-opacity="0.55"/></linearGradient>` +
    `<clipPath id="${ID}torsoClip"><path d="M${MX - 98} ${WL + 8} L${MX - 100} ${WL - 200} L${MX + 100} ${WL - 200} L${MX + 98} ${WL + 8} Z"/></clipPath>` +
    `<radialGradient id="${ID}moonL" cx="${MOON[0]}" cy="${MOON[1] + 200}" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9fb6dc" stop-opacity="0.22"/><stop offset="1" stop-color="#9fb6dc" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="520" cy="800" r="920" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="0.78" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>`;
  let s = sky() + poolFar() + water();
  s += tail();
  // 인어: 후광(달빛 테두리) → 몸 → 머리
  s += `<ellipse cx="${MX}" cy="${WL - 260}" rx="220" ry="330" fill="#7f9cc8" opacity="0.16" filter="url(#${ID}b30)"/>`;
  s += body(`<g transform="rotate(-5 ${MX} ${HY + 110}) translate(${f1(MX - 512 * HS)} ${f1(HY - 485 * HS)}) scale(${HS})">${face()}</g>`);
  s += P(`M${MX + 144} ${KY(800) + 60} C${MX + 152} ${KY(800) + 140} ${MX + 146} ${WL - 80} ${MX + 142} ${WL}`, 'none', '#cfe0f6', 3, 'opacity="0.55"'); // 달 쪽 테두리 빛
  s += waterline();
  s += `<rect width="1024" height="1536" fill="url(#${ID}moonL)" style="mix-blend-mode:screen"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += foreground();
  return K.svg(s, { defs });
}
