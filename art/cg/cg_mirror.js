// cg_mirror — 3장 신관 무용실. 벽 한 면을 채운 큰 거울 앞, 발레 바 너머로 거울 속 '희민'이 바깥의 희민과 다르게 웃고 있다.
// 거울 속 희민(도플갱어)은 힉스필드 초상화(portrait_heemin_smile)를 잿빛으로 눌러 넣고 눈을 검게, 동공을 붉게 칠했으며 입꼬리가 귀 쪽으로 찢어져 올라간다.
// 바깥의 진짜 희민(portrait_heemin_scared)은 거울을 등지고 왼쪽 아래 바로 앞에서 겁에 질려 있다 — 거울은 그의 뒷모습이 아니라
// 이쪽을 보고 웃는 얼굴을 비춘다. 거울 속에는 카메라 뒤쪽 벽의 달빛 창이 비치고(가운데 창이 거울 속 희민의 머리 뒤), 거울 오른쪽 위에서 금이 거미줄처럼 번지기 시작한다.
// 바닥(나무 마루)에는 검은 스피커, 거울 앞을 가로지르는 발레 바와 그 반사.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#04060a';
const ID = 'mr';

// 한 점 투시: 카메라는 거울 벽(z = D)을 정면으로, 눈높이 1.5 m
const FL = 1372, VX = 512, VY = 569, EYE = 1.5, D = 3.0;
const pr = (x, y, z) => [VX + FL * x / z, VY - FL * (y - EYE) / z];
const MT = 2.35, MB = 0.35; // 거울 위·아래 높이(m)
const MY0 = pr(0, MT, D)[1], MY1 = pr(0, MB, D)[1]; // ≈180, ≈1095
const ZB = 8; // 거울 속 맞은편 벽(카메라 뒤 2 m 벽의 반사)

// 도플갱어(초상화) 배치
const HM = K.hfPortrait('heemin_smile');
const PS = 0.95, PX = 602 - HM.w * PS / 2, PY = 214;
// 초상화 안 좌표(portrait_heemin_smile 기준): 눈·입꼬리
const EYE_L = 'M159 230 Q178 215 201 236 Q182 246 159 230 Z';
const EYE_R = 'M251 239 Q272 221 298 232 Q277 251 251 239 Z';
const IRIS = [[181, 233], [274, 238]];
const CRACK0 = [806, 352]; // 금이 시작된 점

// ---------------------------------------------------------------- 거울 속(반사된 방)
function reflected() {
  let s = '';
  const wT = pr(0, 3.2, ZB)[1], wB = pr(0, 0, ZB)[1];
  s += `<rect x="0" y="${f1(MY0)}" width="1024" height="${f1(wT - MY0)}" fill="#0b0e14"/>`; // 천장
  s += `<rect x="0" y="${f1(wT)}" width="1024" height="${f1(wB - wT)}" fill="#121823"/>`; // 맞은편 벽
  s += P(`M0 ${f1(wB)} L1024 ${f1(wB)} L1024 ${f1(MY1)} L0 ${f1(MY1)} Z`, `url(#${ID}rfloor)`); // 마루
  // 천장 형광등(꺼짐)
  for (const z of [4.4, 6]) for (const x of [-1.2, 1.2]) {
    const a = pr(x - 0.5, 3.2, z), b = pr(x + 0.5, 3.2, z + 0.25);
    s += `<rect x="${f1(a[0])}" y="${f1(b[1])}" width="${f1(b[0] - a[0])}" height="${f1(Math.max(4, a[1] - b[1]))}" fill="#1b212b" stroke="${INK}" stroke-width="2"/>`;
  }
  // 마루 널 이음(소실점으로)
  let pl = '';
  for (let x = -6; x <= 6; x += 0.2) pl += `M${pt(pr(x, 0, ZB))} L${pt(pr(x, 0, 3.9))} `;
  s += P(pl, 'none', '#0e0b09', 2, 'opacity="0.8"');
  // 맞은편 벽: 달빛 창 셋(가운데 창이 도플갱어 머리 뒤)
  for (const cx of [-2.6, 0.3, 3.2]) {
    const a = pr(cx - 0.6, 2.6, ZB), b = pr(cx + 0.6, 1.0, ZB);
    s += `<rect x="${f1(a[0] - 6)}" y="${f1(a[1] - 6)}" width="${f1(b[0] - a[0] + 12)}" height="${f1(b[1] - a[1] + 12)}" fill="#1c232d" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="${f1(a[0])}" y="${f1(a[1])}" width="${f1(b[0] - a[0])}" height="${f1(b[1] - a[1])}" fill="url(#${ID}sky)"/>`;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    s += P(`M${f1(mx)} ${f1(a[1])} L${f1(mx)} ${f1(b[1])} M${f1(a[0])} ${f1(my)} L${f1(b[0])} ${f1(my)}`, 'none', '#1c232d', 6);
    // 창으로 든 달빛이 마루에 떨어진 자국(사다리꼴)
    const f0 = pr(cx - 0.6, 0, ZB - 0.3), f1_ = pr(cx + 0.6, 0, ZB - 0.3), g0 = pr(cx - 0.2, 0, ZB - 2.6), g1 = pr(cx + 1.0, 0, ZB - 2.6);
    s += P(poly([f0, f1_, g1, g0]), '#9fb9e6', 'none', 0, `opacity="0.13" filter="url(#${ID}b6)"`);
  }
  // 오른쪽 구석: 반사된 출입문(닫힘)
  const d0 = pr(4.6, 0, ZB), d1 = pr(5.5, 2.1, ZB);
  s += `<rect x="${f1(d0[0])}" y="${f1(d1[1])}" width="${f1(d1[0] - d0[0])}" height="${f1(d0[1] - d1[1])}" fill="#191512" stroke="${INK}" stroke-width="2"/>`;
  // 반사된 스피커 뒷면(진짜 스피커 바로 뒤, 대부분 가려짐)
  const sp0 = pr(0.42, 0.5, 3.55), sp1 = pr(0.74, 0, 3.55);
  s += `<rect x="${f1(sp0[0])}" y="${f1(sp0[1])}" width="${f1(sp1[0] - sp0[0])}" height="${f1(sp1[1] - sp0[1])}" fill="#08090b" stroke="#2a2f38" stroke-width="2"/>`;
  return s;
}

// 도플갱어: 잿빛으로 누른 초상화 + 검은 눈·붉은 동공 + 찢어진 입꼬리, 아래로 어둠 속 몸통
function doppel() {
  const w = HM.w * PS, h = HM.h * PS;
  let s = '';
  // 몸통 아랫부분(초상화 잘린 단 아래): 탁한 남색 블레이저가 어둠으로
  const yb = PY + h * 0.86, X = u => f1(PX + w * u);
  s += P(`M${X(0.03)} ${f1(yb - 40)} L${X(0.97)} ${f1(yb - 40)} C${X(0.99)} ${f1(yb + 80)} ${X(0.97)} ${f1(yb + 200)} ${X(0.93)} ${f1(MY1)} L${X(0.07)} ${f1(MY1)} C${X(0.03)} ${f1(yb + 200)} ${X(0.01)} ${f1(yb + 80)} ${X(0.03)} ${f1(yb - 40)} Z`, `url(#${ID}torso)`);
  s += P(`M${X(0.2)} ${f1(yb)} C${X(0.22)} ${f1(yb + 120)} ${X(0.2)} ${f1(yb + 200)} ${X(0.19)} ${f1(MY1)} M${X(0.8)} ${f1(yb)} C${X(0.78)} ${f1(yb + 120)} ${X(0.8)} ${f1(yb + 200)} ${X(0.81)} ${f1(MY1)}`, 'none', '#05070b', 4, 'opacity="0.7"'); // 팔과 몸통 사이
  // 초상화 아래로 이어지는 블레이저 앞판: 라펠이 단추로 모이고 넥타이·주머니 덮개·앞자락
  s += P(`M${X(0.36)} ${f1(yb - 30)} L${X(0.505)} ${f1(yb + 90)} L${X(0.66)} ${f1(yb - 30)}`, 'none', '#0b0e15', 3.5, 'opacity="0.9"');
  s += P(`M${X(0.475)} ${f1(yb - 40)} L${X(0.535)} ${f1(yb - 40)} L${X(0.525)} ${f1(yb + 70)} L${X(0.505)} ${f1(yb + 84)} L${X(0.485)} ${f1(yb + 70)} Z`, '#2a2f3a', '#0b0e15', 2);
  s += P(`M${X(0.505)} ${f1(yb + 90)} L${X(0.48)} ${f1(MY1)} M${X(0.505)} ${f1(yb + 90)} L${X(0.535)} ${f1(MY1)}`, 'none', '#0b0e15', 3, 'opacity="0.85"');
  s += `<circle cx="${X(0.51)}" cy="${f1(yb + 128)}" r="6" fill="#3a404c" stroke="#0b0e15" stroke-width="2"/><circle cx="${X(0.51)}" cy="${f1(yb + 196)}" r="6" fill="#30353f" stroke="#0b0e15" stroke-width="2"/>`;
  s += P(`M${X(0.25)} ${f1(yb + 160)} L${X(0.42)} ${f1(yb + 156)} M${X(0.6)} ${f1(yb + 156)} L${X(0.77)} ${f1(yb + 160)}`, 'none', '#0b0e15', 3, 'opacity="0.8"');
  s += P(`M${X(0.62)} ${f1(yb - 34)} C${X(0.7)} ${f1(yb + 40)} ${X(0.74)} ${f1(yb + 120)} ${X(0.76)} ${f1(MY1)}`, 'none', '#3c4352', 2, 'opacity="0.4"');
  // 머리 뒤 창빛이 실루엣 둘레에 번짐(아래쪽 잘린 단은 빼고)
  s += `<g mask="url(#${ID}fadeM)"><g filter="url(#${ID}b24)" opacity="0.55"><use href="#${ID}hm" filter="url(#${ID}sil)"/></g></g>`;
  s += `<g mask="url(#${ID}fadeM)"><use href="#${ID}hm" filter="url(#${ID}grey)"/>` +
    `<rect x="${f1(PX)}" y="${f1(PY)}" width="${f1(w)}" height="${f1(h)}" fill="url(#${ID}pshade)" mask="url(#${ID}hmA)"/></g>`;
  // 얼굴 위 덧칠(초상화 좌표)
  let f = '';
  f += `<g filter="url(#${ID}b3)" opacity="0.75"><ellipse cx="180" cy="234" rx="30" ry="18" fill="#141019"/><ellipse cx="275" cy="238" rx="31" ry="18" fill="#141019"/></g>`; // 꺼진 눈두덩
  f += P(EYE_L + ' ' + EYE_R, '#050407', '#020203', 1.5);
  for (const [x, y] of IRIS) {
    f += `<circle cx="${x}" cy="${y}" r="12" fill="#ff1d2e" opacity="0.55" filter="url(#${ID}b3)"/>`;
    f += `<circle cx="${x}" cy="${y}" r="5.2" fill="#e01426"/><circle cx="${x}" cy="${y}" r="2" fill="#ffb4a8"/>`;
  }
  // 입꼬리: 귀 쪽으로 찢어져 올라간 가는 선 + 입 안 그늘
  f += P('M196 305 C188 302 181 297 174 287 M250 309 C259 306 266 300 274 290', 'none', '#1c070b', 2.6);
  f += P('M196 305 C189 302 183 298 177 290 M250 309 C258 306 264 301 271 293', 'none', '#8a2a36', 1.2, 'opacity="0.7"');
  f += P('M200 306 Q224 326 248 310 Q224 318 200 306 Z', '#1a0a0e', 'none', 0, 'opacity="0.55"');
  s += `<g transform="translate(${f1(PX)} ${f1(PY)}) scale(${PS})">${f}</g>`;
  return s;
}

// 발레 바(진짜: 거울 앞 0.25 m) + 그 반사(거울 뒤 0.25 m)
function barre(z, real) {
  const y = pr(0, 1.0, z)[1], r = FL * 0.022 / z;
  let s = '';
  s += `<rect x="-10" y="${f1(y - r)}" width="1044" height="${f1(r * 2)}" fill="${real ? `url(#${ID}wood)` : '#3a2c22'}" stroke="${INK}" stroke-width="${real ? 3 : 2}"/>`;
  s += P(`M-10 ${f1(y - r * 0.45)} L1034 ${f1(y - r * 0.45)}`, 'none', real ? '#d9c2a0' : '#8a7a68', real ? 2.5 : 1.5, `opacity="${real ? 0.55 : 0.4}"`);
  for (const x of [-0.82, 0.86]) {
    const a = pr(x, 1.0, z), w = FL * 0.03 / z;
    const b = pr(x, 1.0, real ? D : D);
    s += P(`M${f1(a[0] - w)} ${f1(a[1])} L${f1(b[0] - w * 0.9)} ${f1(b[1] - r * 0.4)} L${f1(b[0] - w * 0.9)} ${f1(b[1] + r * 1.6)} L${f1(a[0] - w)} ${f1(a[1] + r * 1.4)} Z`, real ? '#7d838c' : '#3d4249', INK, 2);
    s += `<rect x="${f1(a[0] - w * 1.4)}" y="${f1(a[1] - r * 1.1)}" width="${f1(w * 2.8)}" height="${f1(r * 2.2)}" rx="3" fill="${real ? '#9aa1aa' : '#4a5058'}" stroke="${INK}" stroke-width="2"/>`;
  }
  return s;
}

// 금: 한 점에서 뻗는 줄 여럿 + 안쪽 고리(거미줄의 시작)
function cracks() {
  let q = 23;
  const rnd = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; };
  const [cx, cy] = CRACK0;
  let dark = '', lit = '';
  const spokes = [];
  const N = 11;
  for (let i = 0; i < N; i++) {
    let a = i * 2 * Math.PI / N + (rnd() - 0.5) * 0.4, x = cx, y = cy;
    const L = 90 + rnd() * (i % 3 === 0 ? 420 : 220), pts = [[x, y]];
    let d = 0;
    while (d < L) {
      const st = 18 + rnd() * 34; a += (rnd() - 0.5) * 0.5; x += Math.cos(a) * st; y += Math.sin(a) * st; d += st;
      pts.push([x, y]);
      if (rnd() < 0.18) { // 곁가지
        let bx = x, by = y, ba = a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.5);
        const bp = [[bx, by]];
        for (let k = 0; k < 3; k++) { const bs = 14 + rnd() * 22; ba += (rnd() - 0.5) * 0.4; bx += Math.cos(ba) * bs; by += Math.sin(ba) * bs; bp.push([bx, by]); }
        dark += 'M' + bp.map(pt).join(' L') + ' '; lit += 'M' + bp.map(p => pt([p[0] + 1, p[1] - 1])).join(' L') + ' ';
      }
    }
    spokes.push(pts);
    dark += 'M' + pts.map(pt).join(' L') + ' ';
    lit += 'M' + pts.map(p => pt([p[0] + 1.2, p[1] - 1.2])).join(' L') + ' ';
  }
  // 고리: 이웃한 바큇살을 잇는 짧은 선(반지름 두 단)
  for (const rr of [1, 3]) {
    for (let i = 0; i < N; i++) {
      const A = spokes[i], B = spokes[(i + 1) % N];
      if (A.length > rr && B.length > rr && rnd() < 0.8) {
        const p = A[rr], r2 = B[rr];
        const m = [(p[0] + r2[0]) / 2 + (rnd() - 0.5) * 10, (p[1] + r2[1]) / 2 + (rnd() - 0.5) * 10];
        dark += `M${pt(p)} L${pt(m)} L${pt(r2)} `; lit += `M${pt([p[0] + 1, p[1] - 1])} L${pt([m[0] + 1, m[1] - 1])} L${pt([r2[0] + 1, r2[1] - 1])} `;
      }
    }
  }
  let s = P(dark, 'none', '#020305', 3.6, 'opacity="0.85"');
  s += P(lit, 'none', '#e6f0ff', 1.3, 'opacity="0.62"');
  // 깨진 점: 작은 별 모양 하얀 부스러짐 + 빛
  s += `<circle cx="${cx}" cy="${cy}" r="26" fill="#dfeaff" opacity="0.3" filter="url(#${ID}b6)"/>`;
  s += P(`M${cx - 9} ${cy - 2} L${cx - 2} ${cy - 3} L${cx} ${cy - 10} L${cx + 3} ${cy - 2} L${cx + 10} ${cy + 1} L${cx + 2} ${cy + 3} L${cx - 1} ${cy + 10} L${cx - 3} ${cy + 3} Z`, '#f2f7ff', 'none', 0, 'opacity="0.9"');
  return s;
}

// 거울 테(은빛)와 세로 이음
function frame() {
  let s = '';
  const t = 16;
  s += `<rect x="-10" y="${f1(MY0 - t)}" width="1044" height="${t}" fill="url(#${ID}silver)" stroke="${INK}" stroke-width="2.5"/>`;
  s += `<rect x="-10" y="${f1(MY1)}" width="1044" height="${t}" fill="url(#${ID}silver)" stroke="${INK}" stroke-width="2.5"/>`;
  for (const x of [-1.62, 1.62]) {
    const X = pr(x, 0, D)[0];
    s += `<rect x="${f1(X - 6)}" y="${f1(MY0)}" width="12" height="${f1(MY1 - MY0)}" fill="url(#${ID}silverV)" stroke="${INK}" stroke-width="2"/>`;
  }
  // 거울 면의 희미한 사선 반사광
  s += `<g opacity="0.08">${P(`M80 ${f1(MY0)} L200 ${f1(MY0)} L-40 ${f1(MY1)} L-160 ${f1(MY1)} Z M260 ${f1(MY0)} L300 ${f1(MY0)} L60 ${f1(MY1)} L20 ${f1(MY1)} Z`, '#dfe9ff')}</g>`;
  return s;
}

// 앞쪽 벽(거울 아래 걸레받이 판) · 마루 · 스피커
function room() {
  let s = '';
  const wb = pr(0, 0, D)[1];
  s += `<rect x="0" y="0" width="1024" height="${f1(MY0)}" fill="#0c0f14"/>`;
  s += `<rect x="0" y="${f1(MY1)}" width="1024" height="${f1(wb - MY1)}" fill="#14181e"/>`;
  s += `<rect x="0" y="${f1(wb - 22)}" width="1024" height="22" fill="#0a0c0f"/>`;
  s += P(`M0 ${f1(wb - 22)} L1024 ${f1(wb - 22)}`, 'none', '#3a4250', 2, 'opacity="0.6"');
  // 마루(진짜)
  s += P(`M0 ${f1(wb)} L1024 ${f1(wb)} L1024 1536 L0 1536 Z`, `url(#${ID}floor)`);
  let pl = '';
  for (let x = -3; x <= 3; x += 0.16) pl += `M${pt(pr(x, 0, D))} L${pt(pr(x, 0, 0.9))} `;
  for (const z of [2.75, 2.5, 2.28]) pl += `M${pt(pr(-1.6, 0, z))} L${pt(pr(-0.6, 0, z))} M${pt(pr(0.2, 0, z - 0.06))} L${pt(pr(1.4, 0, z - 0.06))} `;
  s += P(pl, 'none', '#140f0b', 2, 'opacity="0.85"');
  // 거울이 비춘 창빛이 마루에 번짐
  s += `<ellipse cx="560" cy="${f1(wb + 30)}" rx="420" ry="60" fill="#9cb6e0" opacity="0.12" filter="url(#${ID}b24)"/>`;
  return s;
}

function speaker() {
  let s = '';
  const x0 = 0.42, x1 = 0.74, z0 = 2.45, z1 = 2.75, h = 0.5;
  const fa = [pr(x0, 0, z0), pr(x1, 0, z0), pr(x1, h, z0), pr(x0, h, z0)];
  const top = [pr(x0, h, z0), pr(x1, h, z0), pr(x1, h, z1), pr(x0, h, z1)];
  const side = [pr(x0, 0, z0), pr(x0, h, z0), pr(x0, h, z1), pr(x0, 0, z1)];
  s += `<ellipse cx="${f1((fa[0][0] + fa[1][0]) / 2)}" cy="${f1(fa[0][1] + 4)}" rx="${f1((fa[1][0] - fa[0][0]) * 0.75)}" ry="14" fill="#000" opacity="0.6" filter="url(#${ID}b6)"/>`;
  s += P(poly(side), '#060708', INK, 3);
  s += P(poly(top), '#1d2026', INK, 3);
  s += P(poly(fa), '#0d0e11', INK, 3.5);
  s += P(`M${pt(top[3])} L${pt(top[2])}`, 'none', '#7f8ea6', 2, 'opacity="0.5"');
  const cxs = (fa[0][0] + fa[1][0]) / 2, w = fa[1][0] - fa[0][0], H = fa[0][1] - fa[3][1];
  // 우퍼·트위터
  s += `<circle cx="${f1(cxs)}" cy="${f1(fa[3][1] + H * 0.66)}" r="${f1(w * 0.34)}" fill="#16181c" stroke="#2c3038" stroke-width="3"/>`;
  s += `<circle cx="${f1(cxs)}" cy="${f1(fa[3][1] + H * 0.66)}" r="${f1(w * 0.22)}" fill="#0a0b0d" stroke="#3a3f48" stroke-width="2"/>`;
  s += `<circle cx="${f1(cxs)}" cy="${f1(fa[3][1] + H * 0.66)}" r="${f1(w * 0.08)}" fill="#22252b"/>`;
  s += `<circle cx="${f1(cxs)}" cy="${f1(fa[3][1] + H * 0.24)}" r="${f1(w * 0.12)}" fill="#16181c" stroke="#2c3038" stroke-width="2"/>`;
  s += P(`M${f1(cxs - w * 0.34)} ${f1(fa[3][1] + H * 0.66 - w * 0.3)} A${f1(w * 0.34)} ${f1(w * 0.34)} 0 0 1 ${f1(cxs + w * 0.2)} ${f1(fa[3][1] + H * 0.66 - w * 0.34)}`, 'none', '#8a9ab4', 2, 'opacity="0.5"');
  s += `<circle cx="${f1(fa[1][0] - 14)}" cy="${f1(fa[2][1] + 14)}" r="3.5" fill="#ff3b3b"/><circle cx="${f1(fa[1][0] - 14)}" cy="${f1(fa[2][1] + 14)}" r="9" fill="#ff3b3b" opacity="0.35" filter="url(#${ID}b3)"/>`;
  // 바닥을 기는 전선
  s += P(`M${pt(side[0])} C${f1(side[0][0] - 60)} ${f1(side[0][1] + 10)} ${f1(side[0][0] - 90)} ${f1(side[0][1] + 60)} ${f1(side[0][0] - 180)} ${f1(side[0][1] + 70)} C${f1(side[0][0] - 260)} ${f1(side[0][1] + 78)} ${f1(side[0][0] - 300)} ${f1(side[0][1] + 40)} ${f1(side[0][0] - 380)} ${f1(side[0][1] + 52)}`, 'none', '#050506', 6);
  return s;
}

export function draw() {
  const w = HM.w * PS, h = HM.h * PS;
  const real = K.portraitIn(`${ID}r`, K.hfPortrait('heemin_scared'), -96, 968, 1.08, { tint: '#060c1a', dark: 0.55, rim: '#cfe0ff', rimDx: 6, fade: 0.7 });
  const lin = (id, x1, y1, x2, y2, stops, abs = true) => `<linearGradient id="${ID}${id}" ${abs ? 'gradientUnits="userSpaceOnUse" ' : ''}x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">` +
    stops.map(([o, col, op = 1]) => `<stop offset="${o}" stop-color="${col}" stop-opacity="${op}"/>`).join('') + '</linearGradient>';
  const defs = real.defs +
    `<filter id="${ID}b1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.5"/></filter>` +
    `<filter id="${ID}b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b24" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24"/></filter>` +
    // 잿빛: 채도를 거의 빼고 푸른 회색으로, 조금 어둡게
    `<filter id="${ID}grey" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="` +
    `0.3 0.4 0.08 0 0  0.24 0.48 0.1 0 0.01  0.24 0.42 0.2 0 0.04  0 0 0 1 0"/></filter>` +
    `<filter id="${ID}sil" x="0" y="0" width="1" height="1"><feFlood flood-color="#8fb0e6"/><feComposite in2="SourceAlpha" operator="in"/></filter>` +
    `<image id="${ID}hm" href="${HM.uri}" x="${f1(PX)}" y="${f1(PY)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="none"/>` +
    `<mask id="${ID}hmA" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536" style="mask-type:alpha"><use href="#${ID}hm"/></mask>` +
    lin('fadeG', 0, PY + h * 0.8, 0, PY + h * 0.97, [[0, '#fff'], [1, '#fff', 0]]) +
    `<mask id="${ID}fadeM" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1536"><rect width="1024" height="1536" fill="url(#${ID}fadeG)"/></mask>` +
    lin('pshade', PX, PY, PX + w, PY + h, [[0, '#0a1020', 0.05], [0.6, '#0a1020', 0.3], [1, '#0a1020', 0.6]]) +
    lin('torso', 0, PY + h * 0.8, 0, MY1, [[0, '#2b303b'], [0.45, '#151922'], [1, '#05070b']]) +
    lin('sky', 0, 0, 0, 1, [[0, '#1d2c4c'], [0.6, '#40598a'], [1, '#5b74a3']], false) +
    lin('rfloor', 0, pr(0, 0, ZB)[1], 0, MY1, [[0, '#1a140f'], [1, '#2c2118']]) +
    lin('floor', 0, pr(0, 0, D)[1], 0, 1536, [[0, '#2a2018'], [1, '#100c09']]) +
    lin('wood', 0, 0, 0, 1, [[0, '#b08a60'], [0.5, '#6e4f33'], [1, '#2e2016']], false) +
    lin('silver', 0, 0, 0, 1, [[0, '#d6dde6'], [0.5, '#7d8794'], [1, '#3a414b']], false) +
    lin('silverV', 0, 0, 1, 0, [[0, '#3a414b'], [0.5, '#a9b3c0'], [1, '#3a414b']], false) +
    `<clipPath id="${ID}glass"><rect x="0" y="${f1(MY0)}" width="1024" height="${f1(MY1 - MY0)}"/></clipPath>` +
    `<radialGradient id="${ID}cold" cx="600" cy="420" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8fb0e6" stop-opacity="0.22"/><stop offset="1" stop-color="#8fb0e6" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="560" cy="620" r="940" gradientUnits="userSpaceOnUse"><stop offset="0.38" stop-color="#000" stop-opacity="0"/><stop offset="0.72" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.95"/></radialGradient>` +
    lin('low', 0, 0, 0, 1, [[0, '#000', 0], [1, '#000', 0.75]], false) +
    lin('glassTint', 0, MY0, 0, MY1, [[0, '#7f9cc8', 0.06], [1, '#0a0f18', 0.25]]);

  let s = `<rect width="1024" height="1536" fill="#05070a"/>`;
  s += room();
  // 거울 속
  s += `<g clip-path="url(#${ID}glass)">`;
  s += reflected();
  s += `<rect width="1024" height="1536" fill="url(#${ID}cold)" style="mix-blend-mode:screen"/>`;
  s += doppel();
  s += barre(D + 0.25, false);
  s += `<rect x="0" y="${f1(MY0)}" width="1024" height="${f1(MY1 - MY0)}" fill="url(#${ID}glassTint)"/>`;
  s += cracks();
  s += `</g>`;
  s += frame();
  s += barre(D - 0.25, true);
  s += speaker();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  s += real.body;
  s += `<rect y="1200" width="1024" height="336" fill="url(#${ID}low)"/>`;
  return K.svg(s, { defs });
}
