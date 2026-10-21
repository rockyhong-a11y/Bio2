// cg_stage — 강당 맨 뒤 위쪽 영사실 창으로 내려다본 강당. 어둠 속 객석 줄이 무대 쪽으로 내려가고,
// 천장 조명틀에서 떨어지는 단 하나의 스포트라이트가 무대 가운데에 쓰러진 소녀(긴 머리가 바닥에 부채꼴로 퍼짐)를 비춘다.
// 소녀는 빛 웅덩이 속 어두운 실루엣(얼굴은 보이지 않음). 앞쪽은 영사실 창틀·먼지 낀 유리·창턱 위 영사기 렌즈 실루엣.
// 쓰러진 소녀 그리기(lyingGirl)는 cg_maze 가 같이 쓴다.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#030407';
const ID = 'stg';

// ---------------------------------------------------------------- 카메라(영사실 창, 높은 곳에서 무대를 내려다봄)
const CAMP = [1.2, 8.6, -6.5], YAW = -3 * Math.PI / 180, PITCH = -19 * Math.PI / 180, FOC = 2050, C0 = [512, 640];
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
const q3 = ps => poly(ps.map(pr));
// 강당: 객석 바닥은 무대 쪽으로 내려가는 경사(z 0 → 높이 1.6, z 19 → 0), 무대 앞 z = ZS, 무대 높이 SH
const ZS = 13.5, SH = 1.1, HW = 8, ZB = 19.5, PH = 7.2; // 무대 앞선, 무대 높이, 반폭, 무대 뒷벽, 프로시니엄 높이
const floorY = z => Math.max(0, 1.6 * (1 - z / 12.5));

function hall() {
  let s = `<rect width="1024" height="1536" fill="#040408"/>`;
  // 옆벽·천장(거의 칠흑), 벽의 세로 흡음판 띠
  for (const sd of [-1, 1]) {
    const X = sd * HW;
    s += P(q3([[X, floorY(0), 0], [X, 12, 0], [X, 12, ZB], [X, 0, ZB]]), sd < 0 ? '#08080e' : '#07070c');
    let g = '';
    for (let z = 2; z < ZS; z += 2.2) g += `M${pt(pr([X, floorY(z) + 0.3, z]))} L${pt(pr([X, 9, z]))} `;
    s += P(g, 'none', '#0e0e16', 5);
    // 비상구 등(희미한 초록)
    const e = pr([X, 3.2, ZS - 2]);
    s += `<rect x="${f1(e[0] - 14)}" y="${f1(e[1] - 6)}" width="28" height="12" fill="#1f6b46" opacity="0.8"/><ellipse cx="${f1(e[0])}" cy="${f1(e[1])}" rx="40" ry="26" fill="#2aa36a" opacity="0.18" filter="url(#${ID}b12)"/>`;
  }
  // 객석 바닥(경사)
  s += P(q3([[-HW, floorY(0), 0], [HW, floorY(0), 0], [HW, 0, ZS], [-HW, 0, ZS]]), '#0b0a0f');
  return s;
}

function stage() {
  let s = '';
  // 무대 뒷벽 + 프로시니엄(무대 위 액자틀)
  s += P(q3([[-HW, 0, ZB], [HW, 0, ZB], [HW, 12, ZB], [-HW, 12, ZB]]), '#06060a');
  // 무대 바닥(나무 마루)
  s += P(q3([[-HW + 1.5, SH, ZS], [HW - 1.5, SH, ZS], [HW - 1.5, SH, ZB], [-HW + 1.5, SH, ZB]]), `url(#${ID}boards)`);
  let g = '';
  for (let x = -HW + 1.8; x < HW - 1.5; x += 0.32) g += `M${pt(pr([x, SH, ZS]))} L${pt(pr([x, SH, ZB]))} `;
  s += P(g, 'none', '#0c0a0c', 1.4, 'opacity="0.8"');
  // 무대 앞면(객석 쪽 벽)
  s += P(q3([[-HW + 1.5, 0, ZS], [HW - 1.5, 0, ZS], [HW - 1.5, SH, ZS], [-HW + 1.5, SH, ZS]]), '#0d0b10', INK, 2);
  s += P(`M${pt(pr([-HW + 1.5, SH, ZS]))} L${pt(pr([HW - 1.5, SH, ZS]))}`, 'none', '#3b3236', 3);
  // 뒤 막(내려진 커튼, 무대 깊숙이)
  const back = (x0, x1, z, col, fold) => {
    let c = P(q3([[x0, SH, z], [x1, SH, z], [x1, PH + 0.5, z], [x0, PH + 0.5, z]]), col);
    let f = '';
    for (let x = x0 + fold / 2; x < x1; x += fold) f += `M${pt(pr([x, SH, z]))} L${pt(pr([x, PH + 0.5, z]))} `;
    return c + P(f, 'none', '#1a0508', 5, 'opacity="0.9"');
  };
  s += back(-HW + 1.5, HW - 1.5, ZB - 0.5, '#2a0a10', 0.55);
  // 양옆 걷힌 막(무대 앞쪽, 드리워진 주름)
  for (const sd of [-1, 1]) {
    const x0 = sd * (HW - 1.5), x1 = sd * (HW - 3.6);
    let c = P(q3([[x0, SH, ZS + 0.4], [x1, SH, ZS + 0.4], [x1 + sd * 0.4, PH, ZS + 0.4], [x0, PH, ZS + 0.4]]), '#300b12', INK, 2);
    let f = '';
    for (let k = 1; k < 6; k++) { const x = x0 + (x1 - x0) * k / 6; f += `M${pt(pr([x, SH, ZS + 0.4]))} L${pt(pr([x + sd * 0.1 * k, PH, ZS + 0.4]))} `; }
    s += c + P(f, 'none', '#16040a', 5);
  }
  // 프로시니엄 벽(위 가로 + 양옆) — 막을 액자처럼 둘러쌈
  s += P(q3([[-HW, PH, ZS + 0.3], [HW, PH, ZS + 0.3], [HW, 12, ZS + 0.3], [-HW, 12, ZS + 0.3]]), '#09090e', INK, 2);
  s += P(q3([[-HW, 0, ZS + 0.3], [-HW + 1.5, 0, ZS + 0.3], [-HW + 1.5, PH, ZS + 0.3], [-HW, PH, ZS + 0.3]]), '#0a090f');
  s += P(q3([[HW - 1.5, 0, ZS + 0.3], [HW, 0, ZS + 0.3], [HW, PH, ZS + 0.3], [HW - 1.5, PH, ZS + 0.3]]), '#0a090f');
  // 위 막(보더) — 붉은 주름 띠
  s += P(q3([[-HW + 1.5, PH - 0.9, ZS + 0.5], [HW - 1.5, PH - 0.9, ZS + 0.5], [HW - 1.5, PH, ZS + 0.5], [-HW + 1.5, PH, ZS + 0.5]]), '#350c14', INK, 2);
  let sc = '';
  for (let x = -HW + 1.8; x < HW - 1.5; x += 0.7) sc += `M${pt(pr([x, PH - 0.9, ZS + 0.5]))} Q${pt(pr([x + 0.35, PH - 1.05, ZS + 0.5]))} ${pt(pr([x + 0.7, PH - 0.9, ZS + 0.5]))} `;
  s += P(sc, 'none', '#1b050a', 3);
  return s;
}

// 객석: 먼 줄부터, 줄마다 의자 등받이(둥근 윗변) + 가운데 통로
function seats() {
  let s = '';
  for (let z = 12.0; z >= 1.2; z -= 0.92) {
    const y = floorY(z);
    let row = '', hi = '';
    for (let x = -HW + 0.6; x < HW - 0.4; x += 0.56) {
      if (Math.abs(x + 0.28 - 0.9) < 0.6) continue; // 통로
      const a = pr([x + 0.04, y + 0.42, z]), b = pr([x + 0.52, y + 0.42, z]), c = pr([x + 0.52, y + 1.0, z]), d = pr([x + 0.04, y + 1.0, z]);
      const r = (c[1] - b[1]) * 0.3;
      row += `M${pt(a)} L${pt(b)} L${f1(c[0])} ${f1(c[1] - r)} Q${f1(c[0])} ${f1(c[1])} ${f1(c[0] - (c[0] - d[0]) / 2)} ${f1(c[1] + r * 0.2)} Q${f1(d[0])} ${f1(d[1])} ${f1(d[0])} ${f1(d[1] - r)} Z `;
      hi += `M${f1(d[0] + 2)} ${f1(d[1] - r * 0.4)} Q${f1((c[0] + d[0]) / 2)} ${f1(c[1] - r * 0.9)} ${f1(c[0] - 2)} ${f1(c[1] - r * 0.4)} `;
    }
    // 무대에 가까울수록 스포트라이트 반사로 아주 조금 밝음
    const t = Math.min(1, Math.max(0, (z - 4) / 8));
    const col = `rgb(${Math.round(12 + 16 * t)},${Math.round(6 + 4 * t)},${Math.round(9 + 5 * t)})`;
    s += P(row, col, INK, 1.6);
    s += P(hi, 'none', '#8a5a5a', 1.4, `opacity="${f1(0.06 + 0.3 * t)}"`);
  }
  return s;
}

// ---------------------------------------------------------------- 쓰러진 소녀(옆으로 쓰러져 무릎을 조금 굽힌 모습, 지역 좌표: 머리 가운데 0,0, 바닥선 y≈+30, 발끝 x≈420)
// 얼굴은 바닥 쪽으로 돌아가 머리카락에 가려 보이지 않는다. 바닥에 부채꼴로 퍼진 긴 머리.
export function lyingGirl({ lit = '#f4e6c8', body = '#0b0d18', skirt = '#0e1020', hair = '#030306', skin = '#2a2730', legs = '#08090f', litOp = 0.7, hairHi = '#5a5f74' } = {}) {
  let s = '';
  // 바닥에 퍼진 머리(머리 뒤로 넓은 물결 웅덩이 + 바닥 위 흩어진 가닥)
  s += P('M20 -22 C0 -44 -40 -52 -80 -48 C-110 -60 -150 -54 -168 -34 C-196 -30 -210 -8 -196 8 C-214 22 -204 44 -178 46 C-170 62 -138 66 -118 54 C-96 66 -60 62 -40 48 C-20 50 4 44 18 30 C30 10 30 -10 20 -22 Z', hair, '#000', 2);
  s += P('M-160 -44 C-172 -50 -184 -50 -192 -46 C-182 -44 -174 -40 -168 -36 Z M-196 22 C-204 28 -214 30 -222 28 C-214 24 -208 18 -204 12 Z', hair, '#000', 1);
  s += P('M-4 -30 C-50 -38 -110 -44 -170 -30 M-10 -12 C-70 -16 -140 -12 -200 0 M-14 6 C-70 12 -140 20 -196 30 M-6 22 C-50 36 -100 48 -150 54 M4 32 C-30 48 -70 56 -110 58', 'none', hairHi, 1.6, 'opacity="0.5"');
  // 아래쪽 다리(바닥에 닿음, 무릎 조금 굽힘) + 위쪽 다리(앞으로 더 굽힘) + 신발
  s += P('M240 2 C270 4 300 8 330 16 C350 22 372 24 400 22 L404 38 C376 42 350 40 326 34 C296 28 266 24 236 24 Z', legs, '#000', 2);
  s += P('M396 20 C408 18 420 20 426 26 C426 34 416 40 404 40 Z', '#020203', '#000', 1.5);
  s += P('M250 -20 C282 -18 312 -6 336 14 C350 28 366 44 388 50 C396 54 396 62 388 64 C362 62 342 50 324 36 C300 18 272 6 244 2 Z', legs, '#000', 2);
  s += P('M386 50 C398 50 410 54 414 60 C412 68 400 70 388 66 Z', '#020203', '#000', 1.5);
  s += P('M336 14 C340 18 344 22 348 26', 'none', '#2a2c3a', 2, 'opacity="0.7"'); // 무릎
  // 치마(엉덩이를 덮고 바닥으로 퍼짐, 주름)
  s += P('M172 -20 C196 -34 230 -38 256 -26 C276 -16 290 2 296 22 C298 30 292 34 284 34 L170 34 C162 10 164 -8 172 -20 Z', skirt, '#000', 2);
  s += P('M196 -28 L188 32 M220 -34 L216 32 M244 -30 L246 32 M266 -18 L272 32', 'none', '#000', 1.6, 'opacity="0.75"');
  s += P('M172 34 L292 34', 'none', '#1c2132', 2.5, 'opacity="0.8"');
  // 몸통(블레이저, 어깨 → 허리 잘록)
  s += P('M22 -16 C40 -32 70 -38 106 -34 C136 -30 158 -26 178 -18 C182 0 180 18 174 32 L30 32 C18 20 14 0 22 -16 Z', body, '#000', 2);
  s += P('M60 -30 C90 -28 130 -20 170 -10', 'none', '#22273a', 2, 'opacity="0.7"');
  // 바닥 쪽 팔(머리 위로 뻗어 머리카락 아래) — 손만 머리카락 밖으로
  s += P('M30 18 C0 28 -40 40 -70 50 L-66 62 C-36 54 4 42 34 32 Z', body, '#000', 1.8);
  s += P('M-70 50 C-84 52 -94 58 -94 64 C-88 68 -76 66 -66 62 Z', skin, '#000', 1.5);
  // 위쪽 팔(앞으로 떨어져 손이 얼굴 앞 바닥에 힘없이 놓임)
  s += P('M70 -26 C96 -14 112 6 112 26 C110 40 96 46 80 48 L76 36 C88 34 96 28 96 20 C94 4 80 -6 58 -14 Z', body, '#000', 1.8);
  s += P('M80 48 C66 52 50 54 40 50 C36 44 44 38 54 38 L76 36 Z', skin, '#000', 1.5);
  s += P('M40 50 C34 52 30 50 30 46 M46 52 C40 56 34 56 32 52', 'none', '#000', 1.2, 'opacity="0.7"');
  // 머리(바닥 쪽으로 돌아간 뒤통수) + 어깨를 타고 넘은 머리 가닥
  s += `<ellipse cx="2" cy="-2" rx="30" ry="28" fill="${hair}" stroke="#000" stroke-width="2"/>`;
  s += P('M14 -26 C40 -30 62 -26 80 -16 C62 -18 44 -14 30 -6 Z', hair, '#000', 1.5);
  s += P('M-22 -18 C-8 -28 12 -30 28 -20', 'none', hairHi, 2, 'opacity="0.6"');
  // 빛 테두리(위에서 떨어지는 빛: 몸 윗가장자리)
  s += P('M22 -16 C40 -32 70 -38 106 -34 C136 -30 158 -26 178 -18 M172 -20 C196 -34 230 -38 256 -26 C276 -16 290 2 296 22 M250 -20 C282 -18 312 -6 336 14 C350 28 366 44 388 50 M-30 -14 C-10 -32 14 -34 30 -24 M20 -22 C0 -44 -40 -52 -80 -48 C-110 -60 -150 -54 -168 -34', 'none', lit, 2.4, `opacity="${litOp}"`);
  return s;
}

// ---------------------------------------------------------------- 스포트라이트
function spotlight() {
  const top = pr([0.3, 10.5, 11.5]);
  const c = [0.9, SH, ZS + 2.3];
  const cc = pr(c), PRX = 250, PRY = 62; // 빛 웅덩이 화면 반지름
  const L = [cc[0] - PRX * 0.62, cc[1]], R = [cc[0] + PRX * 0.62, cc[1]];
  let s = '';
  // 조명틀(천장에 매달린 검은 등기구 실루엣)
  s += P(`M${f1(top[0] - 300)} ${f1(top[1] - 8)} L${f1(top[0] + 300)} ${f1(top[1] - 8)}`, 'none', '#0a0a10', 6);
  for (const dx of [-220, -120, 120, 220]) s += `<rect x="${f1(top[0] + dx - 9)}" y="${f1(top[1] - 4)}" width="18" height="22" rx="4" fill="#0b0b11"/>`;
  s += `<rect x="${f1(top[0] - 14)}" y="${f1(top[1] - 4)}" width="28" height="30" rx="5" fill="#15141b"/><ellipse cx="${f1(top[0])}" cy="${f1(top[1] + 26)}" rx="11" ry="5" fill="#fff6dc"/>`;
  // 빛기둥(먼지에 비친 원뿔)
  s += `<g filter="url(#${ID}b12)" style="mix-blend-mode:screen"><path d="M${f1(top[0] - 10)} ${f1(top[1] + 26)} L${f1(top[0] + 10)} ${f1(top[1] + 26)} L${f1(R[0])} ${f1(cc[1])} L${f1(L[0])} ${f1(cc[1])} Z" fill="url(#${ID}cone)"/></g>`;
  // 빛 웅덩이(무대 바닥 안으로만)
  s += `<g clip-path="url(#${ID}floorC)">`;
  s += `<ellipse cx="${f1(cc[0])}" cy="${f1(cc[1])}" rx="${PRX + 30}" ry="${PRY + 16}" fill="#ffe9bf" opacity="0.25" filter="url(#${ID}b12)"/>`;
  s += `<ellipse cx="${f1(cc[0])}" cy="${f1(cc[1])}" rx="${PRX}" ry="${PRY}" fill="url(#${ID}pool)"/></g>`;
  // 소녀(빛 웅덩이 가운데, 무대 앞쪽 비스듬히 누움)
  const k = 0.52;
  s += `<g transform="translate(${f1(cc[0] - 150 * k)} ${f1(cc[1] - 6)}) rotate(-5) scale(${f1(k * 100) / 100} ${f1(k * 82) / 100})">${lyingGirl()}</g>`;
  // 먼지 입자
  let d = '';
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    const t = rnd(), u = rnd() - 0.5;
    const y = top[1] + 30 + (cc[1] - top[1] - 40) * t;
    const hw = 10 + (R[0] - L[0]) / 2 * t;
    d += `<circle cx="${f1(top[0] + u * hw * 1.8)}" cy="${f1(y)}" r="${f1(0.8 + rnd() * 1.6)}" fill="#fff4dc" opacity="${f1(0.2 + rnd() * 0.5)}"/>`;
  }
  s += d;
  return s;
}

// ---------------------------------------------------------------- 영사실 창(앞쪽 틀)
const WX0 = 96, WX1 = 928, WY0 = 214, WY1 = 1176, MUL = 790;
function frame() {
  let s = '';
  // 창 밖으로 벽(어두운 콘크리트) — 창 구멍을 뚫음
  s += `<path d="M0 0 H1024 V1536 H0 Z M${WX0} ${WY0} V${WY1} H${WX1} V${WY0} Z" fill="url(#${ID}wall)" fill-rule="evenodd"/>`;
  // 창틀(두꺼운 나무, 안쪽 모서리)
  s += P(`M${WX0 - 30} ${WY0 - 30} L${WX1 + 30} ${WY0 - 30} L${WX1} ${WY0} L${WX0} ${WY0} Z`, '#17120f', INK, 3);
  s += P(`M${WX0 - 30} ${WY0 - 30} L${WX0} ${WY0} L${WX0} ${WY1} L${WX0 - 30} ${WY1 + 40} Z`, '#120e0c', INK, 3);
  s += P(`M${WX1 + 30} ${WY0 - 30} L${WX1} ${WY0} L${WX1} ${WY1} L${WX1 + 30} ${WY1 + 40} Z`, '#1a1411', INK, 3);
  // 가운데 세로 창살(유리 두 장)
  s += P(`M${MUL - 9} ${WY0} L${MUL + 9} ${WY0} L${MUL + 9} ${WY1} L${MUL - 9} ${WY1} Z`, '#120e0c', INK, 2.5);
  // 유리 반사·먼지(대각 줄무늬, 얼룩)
  s += `<g opacity="0.9" style="mix-blend-mode:screen">` +
    P(`M${WX0 + 40} ${WY0 + 300} L${WX0 + 300} ${WY0 + 40} L${WX0 + 340} ${WY0 + 40} L${WX0 + 80} ${WY0 + 300} Z`, '#7d8aa6', 'none', 0, 'opacity="0.06"') +
    P(`M${WX1 - 260} ${WY1 - 40} L${WX1 - 40} ${WY1 - 260} L${WX1 - 20} ${WY1 - 240} L${WX1 - 230} ${WY1 - 30} Z`, '#7d8aa6', 'none', 0, 'opacity="0.05"') + `</g>`;
  s += `<rect x="${WX0}" y="${WY0}" width="${WX1 - WX0}" height="${WY1 - WY0}" fill="url(#${ID}grime)"/>`;
  // 창턱(앞으로 튀어나온 판) + 그 위 영사기(오른쪽 아래 실루엣: 렌즈통)
  s += P(`M${WX0 - 60} ${WY1} L${WX1 + 60} ${WY1} L${WX1 + 120} ${WY1 + 90} L${WX0 - 120} ${WY1 + 90} Z`, '#1d1612', INK, 3);
  s += P(`M${WX0 - 120} ${WY1 + 90} L${WX1 + 120} ${WY1 + 90} L${WX1 + 120} ${WY1 + 112} L${WX0 - 120} ${WY1 + 112} Z`, '#0e0a08', INK, 2);
  s += P(`M${WX0 - 60} ${WY1} L${WX1 + 60} ${WY1}`, 'none', '#6e5a48', 2.5, 'opacity="0.6"');
  // 영사기(오른쪽 아래 앞, 어두운 실루엣): 몸통 + 창을 향한 렌즈통 + 위의 필름 릴
  s += P('M700 1536 L712 1300 C714 1284 726 1276 742 1276 L1024 1262 L1024 1536 Z', '#0a0a0e', INK, 3);
  s += P('M712 1300 C760 1294 900 1286 1024 1282', 'none', '#3c3f4c', 2.5, 'opacity="0.7"');
  s += P('M742 1276 L740 1236 C740 1222 750 1214 764 1214 L860 1212 L862 1272 Z', '#111117', INK, 3);
  s += `<ellipse cx="744" cy="1244" rx="22" ry="34" fill="#0d0e14" stroke="${INK}" stroke-width="3"/><ellipse cx="740" cy="1244" rx="13" ry="22" fill="#1d2536"/><ellipse cx="736" cy="1236" rx="4" ry="8" fill="#9db0d8" opacity="0.5"/>`;
  s += `<circle cx="930" cy="1180" r="92" fill="#0b0b10" stroke="${INK}" stroke-width="3"/><circle cx="930" cy="1180" r="70" fill="none" stroke="#1b1c24" stroke-width="3"/><circle cx="930" cy="1180" r="14" fill="#16171e" stroke="${INK}" stroke-width="2"/>`;
  s += P('M846 1150 C860 1110 900 1090 940 1090', 'none', '#555a6c', 2.5, 'opacity="0.55"');
  // 창턱 위 먼지 앉은 필름 통(납작한 원통) 하나
  s += `<ellipse cx="250" cy="1226" rx="74" ry="18" fill="#141110" stroke="${INK}" stroke-width="2.5"/><path d="M176 1226 L176 1212 A74 18 0 0 1 324 1212 L324 1226" fill="#1c1816" stroke="${INK}" stroke-width="2.5"/><ellipse cx="250" cy="1212" rx="74" ry="18" fill="#221d1a" stroke="${INK}" stroke-width="2.5"/><ellipse cx="250" cy="1212" rx="16" ry="4" fill="#0b0908"/>`;
  return s;
}

let defsExtra = '';
export function draw() {
  const defs =
    `<filter id="${ID}b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<linearGradient id="${ID}boards" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110d0e"/><stop offset="1" stop-color="#1d1514"/></linearGradient>` +
    `<linearGradient id="${ID}cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2d2" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0.22"/></linearGradient>` +
    `<radialGradient id="${ID}pool"><stop offset="0" stop-color="#fff0cf" stop-opacity="0.95"/><stop offset="0.65" stop-color="#e8c58e" stop-opacity="0.75"/><stop offset="1" stop-color="#b58a56" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${ID}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a0c"/><stop offset="1" stop-color="#050506"/></linearGradient>` +
    `<radialGradient id="${ID}grime" cx="512" cy="700" r="640" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1610" stop-opacity="0.55"/></radialGradient>` +
    `<radialGradient id="${ID}glow" cx="400" cy="600" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e9c48a" stop-opacity="0.18"/><stop offset="1" stop-color="#e9c48a" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="660" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>`;
  defsExtra = `<clipPath id="${ID}floorC"><path d="${q3([[-HW + 1.5, SH, ZS], [HW - 1.5, SH, ZS], [HW - 1.5, SH, ZB], [-HW + 1.5, SH, ZB]])}"/></clipPath>`;
  let s = hall() + stage() + seats();
  s += spotlight();
  s += `<rect width="1024" height="1536" fill="url(#${ID}glow)" style="mix-blend-mode:screen"/>`;
  s += frame();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs: defs + defsExtra });
}
