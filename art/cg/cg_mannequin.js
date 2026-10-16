// cg_mannequin — 3장 신관 1층 역사관. 낮은 유리 진열장 속 하얀 학교 모형(본관·신관·강당), 진열장 윗유리 위에 노란 카드키.
// 그 뒤에 서 있던 옛 교복(검은 윗옷 + 흰 칼라, 남색 주름치마) 차림의 창백한 마네킹이 진열장 쪽으로 기울어 쓰러지는 순간 —
// 앞으로 휘두른 뻣뻣한 팔이 윗유리를 깨뜨려 파편이 튄다. 얼굴 없는 달걀 머리. 손전등 빛이 진열장과 마네킹만 비추고
// 나머지 전시실(옛 졸업 사진 액자, 연혁 게시판, 상패 진열장)은 어둠 속. 마네킹 뒤로 쓰러지는 궤적의 잔상.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#07080b';
const ID = 'mq';

// 진열장 투시(눈높이 1.7 m, 살짝 내려다봄)
const FL = 1000, VX = 512, VY = 600, EYE = 1.7;
const pr = (x, y, z) => [VX + FL * x / z, VY - FL * (y - EYE) / z];
const CX0 = -0.75, CX1 = 0.75, CZ0 = 2.0, CZ1 = 2.6, CB = 0.6, CT = 0.95; // 진열장 폭·깊이, 받침 높이, 유리 윗면 높이

// 마네킹: 발 기준(0,0) 위로 선 자세를 그린 뒤 PIV 에서 TILT 만큼 기울인다
const PIV = [706, 1196], TILT = -24;
const rot = (p, a = TILT) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [PIV[0] + p[0] * c - p[1] * s, PIV[1] + p[0] * s + p[1] * c]; };
const MQ = { skin: '#d9d6cf', shade: '#9ea4ad', deep: '#6b7380', line: '#23262c', coat: '#14161d', coatL: '#2a2e3a', collar: '#e4e2da', collarS: '#a9adb5', skirt: '#1b2133', skirtS: '#10141f', btn: '#b39248' };
const ARM_R = 9; // 앞으로 휘두른 팔(그림 왼쪽) 각도
const SH_R = [-112, -748], HAND_LEN = 470;

function mannequin() {
  const C = MQ;
  let s = '';
  // 받침대 막대 + 둥근 받침(진열장 뒤에 거의 가려짐)
  s += P('M-6 -470 L6 -470 L6 0 L-6 0 Z', '#4a4f57', INK, 2);
  s += `<ellipse cx="0" cy="4" rx="90" ry="18" fill="#2a2d33" stroke="${INK}" stroke-width="3"/>`;
  // 다리(매끈한 마네킹 다리, 무릎 아래만 조금 보임)
  for (const sd of [-1, 1]) {
    s += P(`M${sd * 24} -500 C${sd * 30} -400 ${sd * 40} -300 ${sd * 40} -210 C${sd * 40} -140 ${sd * 34} -80 ${sd * 30} -30 L${sd * 58} -30 C${sd * 64} -90 ${sd * 72} -150 ${sd * 74} -220 C${sd * 76} -320 ${sd * 78} -420 ${sd * 80} -500 Z`, sd < 0 ? C.skin : C.shade, C.line, 3);
    s += P(`M${sd * 26} -30 L${sd * 64} -30 L${sd * 70} -4 L${sd * 18} -4 Z`, '#0c0c0f', INK, 2.5); // 검은 구두
  }
  // 주름치마(무릎 위까지)
  s += P('M-104 -560 L104 -560 L150 -318 L-150 -318 Z', C.skirt, C.line, 3.5);
  for (let i = -4; i <= 4; i++) s += P(`M${i * 22} -556 L${i * 33} -320`, 'none', i % 2 ? C.skirtS : '#2a3248', i % 2 ? 6 : 2, 'opacity="0.9"');
  // 몸통(검은 윗옷)
  s += P('M-120 -760 C-132 -700 -128 -620 -112 -560 L112 -560 C128 -620 132 -700 120 -760 C80 -782 -80 -782 -120 -760 Z', C.coat, C.line, 3.5);
  s += P('M60 -770 C96 -760 118 -740 120 -700 C126 -650 122 -600 112 -560 L80 -560 C92 -620 92 -700 60 -770 Z', '#0b0c11', 'none', 0, 'opacity="0.9"');
  s += P('M0 -690 L0 -566', 'none', '#05060a', 3);
  for (const y of [-656, -612]) s += `<circle cx="10" cy="${y}" r="7" fill="${C.btn}" stroke="#4a3a14" stroke-width="2"/>`;
  // 흰 칼라(넓게 어깨를 덮고 앞에서 V)
  s += P('M-34 -800 C-80 -800 -124 -786 -132 -762 C-126 -740 -98 -722 -64 -716 L0 -684 L64 -716 C98 -722 126 -740 132 -762 C124 -786 80 -800 34 -800 L0 -760 Z', C.collar, C.line, 3);
  s += P('M34 -800 L0 -760 L-34 -800 L0 -790 Z', '#1a1c22', 'none');
  s += P('M64 -716 C98 -722 126 -740 132 -762 C110 -750 90 -742 60 -738 Z', C.collarS, 'none', 0, 'opacity="0.8"');
  s += P('M-120 -758 C-100 -742 -80 -734 -60 -730', 'none', C.collarS, 2.5, 'opacity="0.8"');
  // 목(이음매 고리)
  s += P('M-26 -846 L-28 -790 L28 -790 L26 -846 Z', C.skin, C.line, 3);
  s += P('M-27 -812 C-10 -806 10 -806 27 -812', 'none', C.deep, 2.5);
  // 뒤로 남은 팔(그림 오른쪽): 몸 옆으로 조금 뒤처짐
  s += arm([112, -748], -16, 'back');
  // 머리: 얼굴 없는 달걀(눈두덩·콧등·턱만 희미한 음영) — 앞으로 쏠려 조금 크게
  s += `<g transform="translate(0 -930) scale(1.12)">`;
  s += P('M0 -98 C52 -98 76 -54 74 -4 C72 44 44 86 0 88 C-44 86 -72 44 -74 -4 C-76 -54 -52 -98 0 -98 Z', `url(#${ID}head)`, C.line, 3.5);
  s += `<ellipse cx="-26" cy="-6" rx="20" ry="10" fill="${C.deep}" opacity="0.14" filter="url(#${ID}b6)"/><ellipse cx="26" cy="-6" rx="20" ry="10" fill="${C.deep}" opacity="0.14" filter="url(#${ID}b6)"/>`;
  s += P('M6 -8 C10 8 12 22 8 32 C4 36 0 36 -2 34 C2 24 4 10 6 -8 Z', C.deep, 'none', 0, `opacity="0.18" filter="url(#${ID}b1)"`); // 콧등 그늘만 아주 희미하게
  s += P('M60 -60 C72 -30 74 10 64 40', 'none', '#f4f2ec', 4, 'opacity="0.6"'); // 정수리 쪽 빛
  s += P('M-70 6 C-66 -40 -46 -78 -6 -90', 'none', '#fff', 3, 'opacity="0.35"');
  s += `</g>`;
  // 앞으로 휘두른 팔(그림 왼쪽) — 진열장 윗유리를 내리친다
  s += arm(SH_R, ARM_R, 'front');
  return s;
}

// 팔: 어깨 sh, 아래로 늘어진 방향에서 ang 도(+ = 그림 왼쪽으로 휘두름). 소매(검은 윗옷) → 소맷부리 → 매끈한 손(손가락이 붙은 마네킹 손)
function arm(sh, ang, kind) {
  const C = MQ, r = ang * Math.PI / 180, dx = -Math.sin(r), dy = Math.cos(r), nx = -dy, ny = dx;
  const at = (t, o = 0) => [sh[0] + dx * t + nx * o, sh[1] + dy * t + ny * o];
  let s = '';
  // 소매
  s += P(poly([at(0, -34), at(0, 34), at(300, 26), at(318, 22), at(318, -22), at(300, -26)]), C.coat, C.line, 3);
  s += P(poly([at(10, 8), at(300, 8), at(300, 24), at(10, 30)]), '#0a0b10', 'none', 0, 'opacity="0.8"');
  s += P(poly([at(296, -27), at(296, 27), at(322, 24), at(322, -24)]), C.collar, C.line, 2.5); // 흰 소맷부리
  // 손목 이음매 + 손
  s += P(poly([at(322, -15), at(322, 15), at(350, 14), at(350, -14)]), C.skin, C.line, 2.5);
  s += P(`M${pt(at(338, -15))} L${pt(at(338, 15))}`, 'none', C.deep, 2);
  const hand = `M${pt(at(346, -20))} C${pt(at(380, -28))} ${pt(at(420, -24))} ${pt(at(HAND_LEN - 10, -12))} C${pt(at(HAND_LEN + 2, -6))} ${pt(at(HAND_LEN + 2, 8))} ${pt(at(HAND_LEN - 12, 12))} ` +
    `C${pt(at(430, 22))} ${pt(at(400, 30))} ${pt(at(380, 30))} C${pt(at(372, 44))} ${pt(at(356, 46))} ${pt(at(350, 34))} Z`;
  s += P(hand, kind === 'front' ? C.skin : C.shade, C.line, 3);
  s += P(`M${pt(at(392, -6))} L${pt(at(HAND_LEN - 14, -4))} M${pt(at(396, 6))} L${pt(at(HAND_LEN - 18, 6))}`, 'none', C.deep, 1.8, 'opacity="0.6"'); // 붙은 손가락 홈
  return s;
}

// ---------------------------------------------------------------- 진열장 + 학교 모형 + 카드키
function caseBack() {
  // 진열장 뒤쪽 유리 모서리·안쪽 바닥(마네킹보다 앞이지만 모형보다 뒤)
  let s = '';
  const fl = [pr(CX0, CB, CZ0), pr(CX1, CB, CZ0), pr(CX1, CB, CZ1), pr(CX0, CB, CZ1)];
  // 뒷유리 면: 그 너머(마네킹 다리)를 어둡게 누른다
  s += P(poly([pr(CX0, CB, CZ1), pr(CX1, CB, CZ1), pr(CX1, CT, CZ1), pr(CX0, CT, CZ1)]), '#0b1018', 'none', 0, 'opacity="0.9"');
  s += P(poly(fl), '#2b3a33', INK, 2.5); // 모형 받침(잔디색 판)
  return s;
}

function model() {
  let s = '';
  const box = (x0, x1, z0, z1, h, roof = 'flat') => {
    const y0 = CB + 0.01, y1 = y0 + h;
    const F = [pr(x0, y0, z0), pr(x1, y0, z0), pr(x1, y1, z0), pr(x0, y1, z0)];
    const T = [pr(x0, y1, z0), pr(x1, y1, z0), pr(x1, y1, z1), pr(x0, y1, z1)];
    const Sd = x0 > 0 ? [pr(x0, y0, z0), pr(x0, y0, z1), pr(x0, y1, z1), pr(x0, y1, z0)] : [pr(x1, y0, z0), pr(x1, y0, z1), pr(x1, y1, z1), pr(x1, y1, z0)];
    let g = P(poly(Sd), '#9aa0a6', INK, 1.6) + P(poly(F), '#e8e6df', INK, 1.8);
    if (roof === 'arch') {
      const a = pr(x0, y1, z0), b = pr(x1, y1, z0), c = pr(x1, y1, z1), d = pr(x0, y1, z1), up = (b[0] - a[0]) * 0.18;
      g += P(`M${pt(a)} Q${f1((a[0] + d[0]) / 2)} ${f1((a[1] + d[1]) / 2 - up)} ${pt(d)} L${pt(c)} Q${f1((b[0] + c[0]) / 2)} ${f1((b[1] + c[1]) / 2 - up)} ${pt(b)} Z`, '#c9c7c0', INK, 1.8);
      g += P(`M${pt(a)} Q${f1((a[0] + b[0]) / 2)} ${f1(a[1] - up)} ${pt(b)}`, '#f4f2ec', INK, 1.8);
    } else g += P(poly(T), '#f4f2ec', INK, 1.8);
    // 창 줄
    const rows = Math.max(2, Math.round(h / 0.045));
    let w = '';
    for (let r = 1; r < rows; r++) {
      const yy = y0 + h * r / rows;
      for (let x = x0 + 0.02; x < x1 - 0.02; x += 0.035) { const p = pr(x, yy, z0), q = pr(x + 0.018, yy - h / rows * 0.45, z0); w += `M${pt(p)} L${pt([q[0], p[1]])} L${pt(q)} L${pt([p[0], q[1]])} Z `; }
    }
    g += P(w, '#7b8794', 'none', 0, 'opacity="0.75"');
    return g;
  };
  // 운동장(모래색) + 나무
  s += P(poly([pr(-0.62, CB + 0.005, 2.08), pr(-0.08, CB + 0.005, 2.08), pr(-0.08, CB + 0.005, 2.3), pr(-0.62, CB + 0.005, 2.3)]), '#8a7c62', INK, 1.5);
  s += box(-0.2, 0.3, 2.42, 2.54, 0.11, 'arch'); // 강당
  s += box(-0.66, -0.12, 2.34, 2.46, 0.16); // 본관
  s += box(0.12, 0.3, 2.1, 2.36, 0.19); // 신관
  for (const [x, z] of [[0.4, 2.12], [0.5, 2.2], [0.45, 2.36], [-0.7, 2.12], [0.58, 2.44], [-0.02, 2.14]]) {
    const b = pr(x, CB + 0.01, z), t = pr(x, CB + 0.07, z);
    s += P(`M${pt(b)} L${pt(t)}`, 'none', '#3a2a1c', 2) + `<circle cx="${f1(t[0])}" cy="${f1(t[1])}" r="${f1(FL * 0.022 / z)}" fill="#3f5a3c" stroke="${INK}" stroke-width="1.5"/>`;
  }
  return s;
}

function caseFront(hole) {
  let s = '';
  // 받침(어두운 나무 상자)
  const b = [pr(CX0, 0, CZ0), pr(CX1, 0, CZ0), pr(CX1, CB, CZ0), pr(CX0, CB, CZ0)];
  s += P(poly(b), `url(#${ID}woodF)`, INK, 4);
  s += P(poly([pr(CX0 + 0.06, 0.08, CZ0), pr(CX1 - 0.06, 0.08, CZ0), pr(CX1 - 0.06, CB - 0.08, CZ0), pr(CX0 + 0.06, CB - 0.08, CZ0)]), 'none', '#120c08', 3);
  s += P(`M${pt(pr(CX0, CB - 0.01, CZ0))} L${pt(pr(CX1, CB - 0.01, CZ0))}`, 'none', '#b49870', 2.5, 'opacity="0.5"');
  let gr = '';
  for (const [y, x0, x1] of [[0.5, -0.6, 0.2], [0.44, -0.2, 0.62], [0.2, -0.64, -0.1], [0.14, 0.1, 0.6], [0.32, 0.3, 0.64]]) gr += `M${pt(pr(x0, y, CZ0))} C${pt(pr(x0 + (x1 - x0) * 0.3, y + 0.012, CZ0))} ${pt(pr(x0 + (x1 - x0) * 0.6, y - 0.012, CZ0))} ${pt(pr(x1, y, CZ0))} `;
  s += P(gr, 'none', '#3c2a1a', 2, 'opacity="0.7"');
  // 작은 놋쇠 명판(글자 없음)
  const n0 = pr(-0.16, 0.36, CZ0), n1 = pr(0.16, 0.26, CZ0);
  s += `<rect x="${f1(n0[0])}" y="${f1(n0[1])}" width="${f1(n1[0] - n0[0])}" height="${f1(n1[1] - n0[1])}" fill="#8a7440" stroke="${INK}" stroke-width="2"/>`;
  // 유리: 앞면·윗면(옅은 푸른 반사), 모서리 금속 테
  const gf = [pr(CX0, CB, CZ0), pr(CX1, CB, CZ0), pr(CX1, CT, CZ0), pr(CX0, CT, CZ0)];
  const gt = [pr(CX0, CT, CZ0), pr(CX1, CT, CZ0), pr(CX1, CT, CZ1), pr(CX0, CT, CZ1)];
  s += P(poly(gf), `url(#${ID}glassF)`, 'none');
  s += `<g mask="url(#${ID}holeM)">${P(poly(gt), `url(#${ID}glassT)`, 'none')}</g>`;
  s += P(`M${pt(gf[3])} L${f1(gf[3][0] + 150)} ${f1(gf[3][1])} L${f1(gf[0][0] + 60)} ${f1(gf[0][1])} L${pt(gf[0])} Z`, '#dfeaff', 'none', 0, 'opacity="0.07"');
  s += P(`M${f1(gf[2][0] - 260)} ${f1(gf[2][1])} L${f1(gf[2][0] - 220)} ${f1(gf[2][1])} L${f1(gf[1][0] - 300)} ${f1(gf[1][1])} L${f1(gf[1][0] - 340)} ${f1(gf[1][1])} Z`, '#dfeaff', 'none', 0, 'opacity="0.08"');
  const edges = [[gf[0], gf[3]], [gf[1], gf[2]], [gf[3], gf[2]], [gt[3], gt[2]], [gt[2], gt[1]], [pr(CX1, CB, CZ1), gt[2]]];
  s += P(edges.map(([a, c]) => `M${pt(a)} L${pt(c)}`).join(' '), 'none', '#1a1d22', 5);
  s += P(edges.map(([a, c]) => `M${pt(a)} L${pt(c)}`).join(' '), 'none', '#aab4c0', 2, 'opacity="0.75"');
  // 깨진 윗유리 왼쪽 뒤: 들쭉날쭉한 구멍 테두리 + 방사형 금
  s += P(hole, 'none', '#e8f2ff', 2, 'opacity="0.85"');
  return s;
}

// 카드키(윗유리 위에 납작하게 놓임, 노란 카드 + 줄무늬 + 칩)
function card() {
  const y = CT + 0.004, x0 = 0.16, x1 = 0.36, z0 = 2.16, z1 = 2.28;
  const q = [pr(x0, y, z0), pr(x1, y, z0 + 0.02), pr(x1 - 0.01, y, z1 + 0.02), pr(x0 - 0.01, y, z1)];
  let s = `<g filter="url(#${ID}b6)">${P(poly(q), '#ffd84a', 'none', 0, 'opacity="0.6"')}</g>`;
  s += P(poly(q), '#f2c430', '#3a2a06', 2.5);
  const L = (u, v) => [q[0][0] + (q[1][0] - q[0][0]) * u + (q[3][0] - q[0][0]) * v, q[0][1] + (q[1][1] - q[0][1]) * u + (q[3][1] - q[0][1]) * v];
  s += P(poly([L(0, 0.2), L(1, 0.2), L(1, 0.38), L(0, 0.38)]), '#7a5a10', 'none', 0, 'opacity="0.8"');
  s += P(poly([L(0.12, 0.55), L(0.3, 0.55), L(0.3, 0.85), L(0.12, 0.85)]), '#c9a43a', '#5a420c', 1.5);
  s += P(`M${pt(L(0.05, 0.08))} L${pt(L(0.6, 0.08))}`, 'none', '#fff6c8', 2, 'opacity="0.8"');
  // 반짝
  const g = L(0.85, 0.15);
  s += P(`M${f1(g[0] - 16)} ${f1(g[1])} L${f1(g[0] + 16)} ${f1(g[1])} M${f1(g[0])} ${f1(g[1] - 16)} L${f1(g[0])} ${f1(g[1] + 16)}`, 'none', '#fffbe6', 2.5, 'opacity="0.9"');
  return s;
}

// 유리 파편: 손이 내리친 점에서 위·앞으로 부채꼴로 튄다
function shards(I) {
  let q = 41, s = '', streak = '';
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  const shard = (x, y, r, big) => {
    const ra = rnd() * Math.PI;
    const pts = Array.from({ length: 3 + (rnd() < 0.4 ? 1 : 0) }, (_, k) => { const t = ra + k * 2.1 + rnd() * 0.8, rr = r * (0.45 + rnd() * 0.7); return [x + Math.cos(t) * rr, y + Math.sin(t) * rr * (0.55 + rnd() * 0.5)]; });
    let g = `<path d="${poly(pts)}" fill="#bcd6f4" fill-opacity="${big ? 0.14 : 0.28}" stroke="#9fb8d8" stroke-width="${big ? 1.6 : 1}" stroke-linejoin="round" stroke-opacity="0.7"/>`;
    g += P(`M${pt(pts[0])} L${pt(pts[1])}`, 'none', '#ffffff', big ? 3 : 1.6, 'opacity="0.95"'); // 한 변만 번쩍
    return big ? `<g filter="url(#${ID}b1)">${g}</g>` : g;
  };
  // 위로 튀는 작은 조각(부채꼴)
  for (let i = 0; i < 64; i++) {
    const a = -Math.PI * (0.04 + rnd() * 0.92), d = 30 + rnd() * rnd() * 460;
    const x = I[0] + Math.cos(a) * d * 1.3, y = I[1] + Math.sin(a) * d;
    s += shard(x, y, 4 + rnd() * 13, false);
    if (rnd() < 0.6) { const tl = 12 + rnd() * 30; streak += `M${f1(x)} ${f1(y)} L${f1(x - Math.cos(a) * tl * 1.3)} ${f1(y - Math.sin(a) * tl)} `; }
  }
  // 앞(보는 쪽)으로 날아오는 큰 조각 몇 개
  for (const [dx, dy, r] of [[-170, 250, 34], [120, 300, 28], [-40, 430, 44], [260, 180, 22], [-260, 120, 26], [40, 160, 18]]) s += shard(I[0] + dx, I[1] + dy, r, true);
  return P(streak, 'none', '#cfe2ff', 1.2, 'opacity="0.45"') + s;
}

function room() {
  let s = `<rect width="1024" height="1536" fill="#090b0f"/>`;
  const wb = pr(0, 0, 4.2)[1]; // 뒷벽 밑선
  s += `<rect x="0" y="0" width="1024" height="${f1(wb)}" fill="#11141a"/>`;
  s += P(`M0 ${f1(wb)} L1024 ${f1(wb)} L1024 1536 L0 1536 Z`, `url(#${ID}floor)`);
  s += `<rect x="0" y="${f1(wb - 18)}" width="1024" height="18" fill="#08090c"/>`;
  s += P(`M0 ${f1(pr(0, 1.0, 4.2)[1])} L1024 ${f1(pr(0, 1.0, 4.2)[1])}`, 'none', '#1d222b', 4);
  // 옛 졸업 사진 액자(두 줄)
  let q = 5;
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  for (const [x, y, w, h] of [[40, 150, 170, 120], [236, 150, 170, 120], [432, 130, 210, 140], [40, 300, 170, 120], [236, 300, 170, 120]]) {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a241c" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="${h - 24}" fill="#4a4a46"/>`;
    let heads = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) heads += `<circle cx="${f1(x + 22 + c * (w - 44) / 7)}" cy="${f1(y + 32 + r * (h - 54) / 2)}" r="${f1(4 + rnd())}" fill="#1e1e1c"/>`;
    s += `<g opacity="0.7">${heads}</g>`;
  }
  // 연혁 게시판(오른쪽 위, 글줄만)
  s += `<rect x="676" y="140" width="320" height="250" fill="#1f2a24" stroke="${INK}" stroke-width="4"/>`;
  s += `<rect x="688" y="152" width="296" height="226" fill="none" stroke="#5b4b2c" stroke-width="3"/>`;
  let lines = '';
  for (let i = 0; i < 9; i++) { const y = 182 + i * 22; lines += `M704 ${y} L736 ${y} M748 ${y} L${f1(760 + rnd() * 200)} ${y} `; }
  s += P(lines, 'none', '#9aa69a', 3, 'opacity="0.45"');
  // 상패 진열장(오른쪽 뒤)
  s += `<rect x="830" y="430" width="200" height="${f1(wb - 430)}" fill="#0d1014" stroke="${INK}" stroke-width="4"/>`;
  for (const y of [520, 640, 760]) s += P(`M836 ${y} L1024 ${y}`, 'none', '#2b3038', 4);
  for (const [x, y, h] of [[870, 520, 50], [930, 520, 34], [980, 520, 44], [880, 640, 40], [960, 640, 56], [900, 760, 46]]) s += P(`M${x - 12} ${y} L${x + 12} ${y} L${x + 6} ${y - h * 0.4} L${x + 14} ${y - h} L${x - 14} ${y - h} L${x - 6} ${y - h * 0.4} Z`, '#6d5c32', INK, 2);
  s += P('M836 430 L1024 430', 'none', '#7b8796', 2, 'opacity="0.4"');
  // 꺼진 레일 조명
  s += P('M60 40 L960 40', 'none', '#1c2027', 8);
  for (const x of [180, 420, 660, 900]) s += P(`M${x} 44 L${x - 10} 70 L${x + 14} 76 Z`, '#232831', INK, 2);
  return s;
}

export function draw() {
  // 휘두른 손 끝(지역 → 화면) = 윗유리를 깬 점
  const r = ARM_R * Math.PI / 180;
  const sh = rot(SH_R), tip = rot([SH_R[0] - Math.sin(r) * HAND_LEN, SH_R[1] + Math.cos(r) * HAND_LEN]);
  const GY = pr(0, CT, 2.3)[1], t = (GY - sh[1]) / (tip[1] - sh[1]);
  const I = [sh[0] + (tip[0] - sh[0]) * t, GY]; // 팔이 윗유리 면을 뚫고 지나가는 점
  // 윗유리 구멍(깬 점 둘레의 들쭉날쭉한 고리)
  let q = 9;
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  const holePts = Array.from({ length: 14 }, (_, k) => { const a = k / 14 * Math.PI * 2, rr = 40 + rnd() * 40; return [I[0] + Math.cos(a) * rr * 1.4, I[1] + Math.sin(a) * rr * 0.42]; });
  const hole = poly(holePts) + ' ' + holePts.filter((_, k) => k % 2 === 0).map(p => `M${pt(p)} L${pt([I[0] + (p[0] - I[0]) * 2.1, I[1] + (p[1] - I[1]) * 2.1])}`).join(' ');

  const defs =
    `<filter id="${ID}b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>` +
    `<filter id="${ID}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>` +
    `<radialGradient id="${ID}head" cx="0.62" cy="0.3" r="0.85"><stop offset="0" stop-color="#f3f1eb"/><stop offset="0.55" stop-color="#cfcdc6"/><stop offset="1" stop-color="#7d8590"/></radialGradient>` +
    `<linearGradient id="${ID}floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14171d"/><stop offset="1" stop-color="#07080a"/></linearGradient>` +
    `<linearGradient id="${ID}woodF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2014"/><stop offset="0.5" stop-color="#1a120b"/><stop offset="1" stop-color="#0a0705"/></linearGradient>` +
    `<linearGradient id="${ID}glassF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c4e6" stop-opacity="0.18"/><stop offset="1" stop-color="#2a3a50" stop-opacity="0.32"/></linearGradient>` +
    `<linearGradient id="${ID}glassT" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe0f7" stop-opacity="0.32"/><stop offset="1" stop-color="#cfe0f7" stop-opacity="0.12"/></linearGradient>` +
    `<mask id="${ID}holeM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="#fff"/><path d="${poly(holePts)}" fill="#000"/></mask>` +
    `<radialGradient id="${ID}torch" cx="470" cy="820" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#dfe8f6" stop-opacity="0.32"/><stop offset="0.45" stop-color="#8ea4c4" stop-opacity="0.12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}dark" cx="470" cy="820" r="760" gradientUnits="userSpaceOnUse"><stop offset="0.3" stop-color="#030406" stop-opacity="0"/><stop offset="0.7" stop-color="#030406" stop-opacity="0.6"/><stop offset="1" stop-color="#030406" stop-opacity="0.95"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="470" cy="760" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.42" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>` +
    `<linearGradient id="${ID}bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.85"/></linearGradient>`;

  let s = room();
  s += `<rect width="1024" height="1536" fill="url(#${ID}dark)"/>`;
  // 쓰러지는 궤적의 잔상(덜 기운 자세로 옅게)
  const m = mannequin();
  for (const [a, o] of [[TILT + 11, 0.05], [TILT + 5.5, 0.09]]) s += `<g transform="rotate(${a} ${PIV[0]} ${PIV[1]}) translate(${PIV[0]} ${PIV[1]})" opacity="${o}">${m}</g>`;
  // 바닥 그림자
  s += `<ellipse cx="560" cy="${f1(pr(0, 0, CZ1)[1] + 6)}" rx="460" ry="40" fill="#000" opacity="0.6" filter="url(#${ID}b18)"/>`;
  s += `<g transform="rotate(${TILT} ${PIV[0]} ${PIV[1]}) translate(${PIV[0]} ${PIV[1]})">${m}</g>`;
  // 진열장(마네킹 다리는 유리 너머로 흐리게 보이고 받침이 가림)
  s += caseBack() + model();
  s += caseFront(hole);
  s += card();
  // 손전등 빛
  s += `<rect width="1024" height="1536" fill="url(#${ID}torch)" style="mix-blend-mode:screen"/>`;
  // 깬 점의 번쩍임 + 파편
  s += `<ellipse cx="${f1(I[0])}" cy="${f1(I[1])}" rx="120" ry="50" fill="#dfeeff" opacity="0.35" filter="url(#${ID}b18)"/>`;
  s += shards(I);
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += `<rect y="1240" width="1024" height="296" fill="url(#${ID}bot)"/>`;
  return K.svg(s, { defs });
}
