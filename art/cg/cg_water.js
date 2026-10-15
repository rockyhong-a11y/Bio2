// cg_water — 3장 마지막 컷(cg_earth와 짝). 신관 2층, 水의 패를 오각형 홈에 끼우자 결계문이 안쪽으로 열린다(인물 없음).
// 한 점 투시: 앞쪽 양옆에 안쪽으로 열린 짙은 청회색 철판 두짝문(오른짝에 푸르게 빛나는 '水' 원반), 오른쪽 벽의 오각형 홈에서
// '水' 자가 가장 밝게 빛난다. 문 너머는 강당으로 이어지는 연결 통로: 양쪽 창 너머 밤비, 바닥엔 얕게 고인 물이 천장 등과 창을
// 비추고, 통로 끝에는 강당의 높은 두짝문이 희미하게 빛난다. 문턱 너머로 물이 번져 나오고 물방울이 거꾸로 떠오른다.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#05070b';
const ID = 'wa';

// 한 점 투시(눈높이 1.5 m) — cg_earth와 같은 틀
const FL = 560, VX = 512, VY = 660, EYE = 1.5;
const pr = (x, y, z) => [VX + FL * x / z, VY - FL * (y - EYE) / z];
const XL = -1.1, XR = 1.1, CH = 2.8, Z0 = 1.6, ZE = 26; // 통로 폭·높이, 문 위치, 강당 문

// '水' 자: 단위 상자(-1..1)의 획 네 개(가운데 갈고리 세로획, 왼쪽 가로-삐침, 오른쪽 위 삐침, 오른쪽 아래 파임)
const SU = [
  [[0.04, -0.98], [0.06, -0.3], [0.05, 0.4], [0.04, 0.86], [-0.22, 0.66]],
  [[-0.74, -0.36], [-0.3, -0.38], [-0.26, -0.32], [-0.48, 0.12], [-0.9, 0.56]],
  [[0.66, -0.6], [0.48, -0.36], [0.3, -0.2], [0.18, -0.12]],
  [[0.18, -0.12], [0.4, 0.22], [0.62, 0.52], [0.92, 0.78]],
];
// 화면 좌표로 옮긴 '水' 경로(map: (u,v) → [x,y])
const glyph = map => SU.map(st => 'M' + st.map(([u, v]) => pt(map(u, v))).join(' L')).join(' ');

function corridor() {
  let s = '';
  // 천장·바닥(고인 물)·양벽
  s += P(poly([pr(XL, CH, Z0), pr(XR, CH, Z0), pr(XR, CH, ZE), pr(XL, CH, ZE)]), '#10141b');
  s += P(poly([pr(XL, 0, Z0), pr(XR, 0, Z0), pr(XR, 0, ZE), pr(XL, 0, ZE)]), `url(#${ID}floor)`);
  s += P(poly([pr(XL, 0, Z0), pr(XL, CH, Z0), pr(XL, CH, ZE), pr(XL, 0, ZE)]), '#141a22');
  s += P(poly([pr(XR, 0, Z0), pr(XR, CH, Z0), pr(XR, CH, ZE), pr(XR, 0, ZE)]), '#11161d');
  // 양쪽 창(밤비) · 창틀 기둥 · 천장 등 · 바닥에 비친 창과 등 — 멀수록 어둡고 촘촘
  let k = 0, refl = '';
  for (let z = 2.1; z < ZE - 1; z *= 1.17, k++) {
    const z1 = z * 1.1, fade = Math.max(0, 1 - Math.log(z / 2) / Math.log(ZE / 2));
    for (const x of [XL, XR]) {
      s += P(poly([pr(x, 0.95, z), pr(x, 2.25, z), pr(x, 2.25, z1), pr(x, 0.95, z1)]), x < 0 ? '#22324f' : '#1d2b45', 'none', 0, `opacity="${f1(0.3 + fade * 0.6)}"`);
      s += P(`M${pt(pr(x, 1.6, z))} L${pt(pr(x, 1.6, z1))}`, 'none', '#0a0d14', 2);
      // 물에 비친 창(아래로 뒤집혀 흐림)
      refl += P(poly([pr(x * 0.97, 0, z * 1.01), pr(x * 0.97, 0, z1 * 0.99), pr(x * 0.72, 0, z1 * 0.99), pr(x * 0.72, 0, z * 1.01)]), '#5a7fb4', 'none', 0, `opacity="${f1(0.04 + fade * 0.14)}"`);
    }
    s += P(`M${pt(pr(XL, 0, z1))} L${pt(pr(XL, CH, z1))} M${pt(pr(XR, 0, z1))} L${pt(pr(XR, CH, z1))}`, 'none', '#090b10', Math.max(1, 7 * fade));
    // 창 너머 빗줄기(사선)
    if (k % 1 === 0) for (const x of [XL, XR]) {
      const a = pr(x, 2.2, z * 1.02), b = pr(x, 1.0, z * 1.08);
      s += P(`M${pt(a)} L${pt([b[0] + (x < 0 ? 4 : -4), b[1]])}`, 'none', '#9cb8e0', 1.2, `opacity="${f1(0.12 + fade * 0.25)}"`);
    }
    const [lx, ly] = pr(0, CH - 0.02, z * 1.05), lw = FL * 0.2 / z;
    s += `<rect x="${f1(lx - lw)}" y="${f1(ly - lw * 0.2)}" width="${f1(lw * 2)}" height="${f1(Math.max(1, lw * 0.25))}" fill="#d8ecff" opacity="${f1(0.06 + fade * 0.4)}"/>`;
    // 물에 비친 등: 바닥 위 세로로 길게 번진 빛
    const [fx, fy] = pr(0, 0, z * 1.05);
    refl += `<rect x="${f1(fx - lw * 0.7)}" y="${f1(fy - lw * 0.1)}" width="${f1(lw * 1.4)}" height="${f1(Math.max(1, lw * 0.22))}" fill="#bcd8ff" opacity="${f1(0.05 + fade * 0.35)}"/>`;
  }
  s += `<g filter="url(#${ID}b3)">${refl}</g>`;
  // 바닥 물결(가로로 흔들리는 가는 빛줄)
  let rip = '';
  for (let z = 1.8; z < ZE - 2; z *= 1.12) {
    const a = pr(XL * 0.9, 0, z), b = pr(XR * 0.9, 0, z), m = (a[0] + b[0]) / 2, w = (b[0] - a[0]);
    rip += `M${f1(a[0] + w * 0.08)} ${f1(a[1])} Q${f1(m - w * 0.2)} ${f1(a[1] - 3)} ${f1(m)} ${f1(a[1])} T${f1(b[0] - w * 0.12)} ${f1(a[1])} `;
  }
  s += P(rip, 'none', '#7fa8de', 1.6, 'opacity="0.28"');
  // 통로 끝: 강당의 높은 두짝문(틈으로 차가운 빛)
  const d0 = pr(-0.7, 0, ZE), d1 = pr(0.7, 2.5, ZE);
  s += P(poly([pr(XL, 0, ZE), pr(XR, 0, ZE), pr(XR, CH, ZE), pr(XL, CH, ZE)]), '#0d1219');
  s += `<rect x="${f1(d0[0] - 4)}" y="${f1(d1[1] - 4)}" width="${f1(d1[0] - d0[0] + 8)}" height="${f1(d0[1] - d1[1] + 4)}" fill="#05070a"/>`;
  s += `<rect x="${f1(d0[0])}" y="${f1(d1[1])}" width="${f1(d1[0] - d0[0])}" height="${f1(d0[1] - d1[1])}" fill="#1a2533" stroke="${INK}" stroke-width="2"/>`;
  s += `<g filter="url(#${ID}b12)"><rect x="${f1(VX - 10)}" y="${f1(d1[1])}" width="20" height="${f1(d0[1] - d1[1])}" fill="#bfe0ff" opacity="0.8"/></g>`;
  s += `<rect x="${f1(VX - 2)}" y="${f1(d1[1] + 2)}" width="4" height="${f1(d0[1] - d1[1] - 2)}" fill="#effaff"/>`;
  for (const sd of [-1, 1]) {
    const w0 = pr(sd * 0.48, 1.6, ZE), w1 = pr(sd * 0.22, 2.2, ZE);
    s += `<rect x="${f1(Math.min(w0[0], w1[0]))}" y="${f1(w1[1])}" width="${f1(Math.abs(w1[0] - w0[0]))}" height="${f1(w0[1] - w1[1])}" fill="#5e7fa8" opacity="0.55"/>`; // 문 위 작은 창
  }
  s += P(poly([pr(-0.9, 2.6, ZE), pr(0.9, 2.6, ZE), pr(0.9, 2.72, ZE), pr(-0.9, 2.72, ZE)]), '#22303f'); // 상인방
  s += `<g filter="url(#${ID}b12)"><ellipse cx="${VX}" cy="${f1(d0[1] + 8)}" rx="${f1((d1[0] - d0[0]) * 0.9)}" ry="14" fill="#9cc8ff" opacity="0.5"/></g>`;
  s += P(`M${f1(VX - 6)} ${f1(d0[1])} L${f1(VX + 6)} ${f1(d0[1])} L${f1(VX + 40)} ${f1(pr(0, 0, 4)[1])} L${f1(VX - 40)} ${f1(pr(0, 0, 4)[1])} Z`, '#a8d0ff', 'none', 0, `opacity="0.16" filter="url(#${ID}b6)"`); // 물에 비친 문틈 빛
  return s;
}

// 문짝(안쪽으로 열림, 짙은 청회색 철판·리벳·물때) + 오른짝의 水 원반
function doors() {
  let s = '';
  const DW = 1.1, H = 2.7, A = 66 * Math.PI / 180;
  for (const sd of [-1, 1]) {
    const hinge = sd * DW, tip = (a, h) => pr(hinge - sd * a * Math.cos(A), h, Z0 + a * Math.sin(A));
    const leaf = [tip(0, 0), tip(0, H), tip(DW, H), tip(DW, 0)];
    s += P(poly(leaf), sd < 0 ? '#1c2630' : '#18212a', INK, 5);
    // 철판 이음(가로) + 리벳
    for (const h of [0.9, 1.8]) {
      s += P(`M${pt(tip(0.03, h))} L${pt(tip(DW - 0.03, h))}`, 'none', '#0a0e13', 4);
      s += P(`M${pt(tip(0.03, h + 0.02))} L${pt(tip(DW - 0.03, h + 0.02))}`, 'none', '#46596b', 1.6, 'opacity="0.6"');
      for (let a = 0.08; a < DW; a += 0.16) { const c = tip(a, h + 0.06), r = FL * 0.016 / (Z0 + a * Math.sin(A)); s += `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${f1(r)}" fill="#3a4855" stroke="${INK}" stroke-width="1.5"/>`; }
    }
    // 테두리 홈
    s += P(poly([tip(0.06, 0.08), tip(0.06, H - 0.08), tip(DW - 0.06, H - 0.08), tip(DW - 0.06, 0.08)]), 'none', '#0d1218', 3);
    // 물때: 아래쪽에 흘러내린 얼룩
    for (const [a, h] of [[0.25, 0.9], [0.5, 0.7], [0.78, 1.1]]) s += P(`M${pt(tip(a, h))} L${pt(tip(a + 0.03, 0.1))} L${pt(tip(a + 0.07, 0.1))} L${pt(tip(a + 0.05, h - 0.2))} Z`, '#0b1218', 'none', 0, 'opacity="0.7"');
    s += P(poly([tip(0, 0), tip(DW, 0), tip(DW, 0.3), tip(0, 0.22)]), '#0a1016', 'none', 0, 'opacity="0.6"');
    // 자유단 가장자리: 원반 빛
    s += P(`M${pt(tip(DW - 0.01, 0.1))} L${pt(tip(DW - 0.01, H - 0.1))}`, 'none', '#7cc4ff', 2.5, 'opacity="0.55"');
    if (sd > 0) {
      const c = tip(DW * 0.8, 1.45), r = FL * 0.27 / (Z0 + DW * 0.8 * Math.sin(A));
      s += `<g filter="url(#${ID}b12)"><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * 1.4)}" ry="${f1(r * 1.9)}" fill="#4aa8ff" opacity="0.5"/></g>`;
      s += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * 0.66)}" ry="${f1(r)}" fill="#122436" stroke="#7fb4e0" stroke-width="4"/>`;
      s += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * 0.56)}" ry="${f1(r * 0.86)}" fill="none" stroke="#2f6aa0" stroke-width="2"/>`;
      const q = (u, v) => [c[0] + u * r * 0.42, c[1] + v * r * 0.66];
      s += P(glyph(q), 'none', '#2a6fb8', 12, 'opacity="0.7"');
      s += P(glyph(q), 'none', '#d8f0ff', 6.5);
    }
  }
  // 문틀(철제, 청회색)
  s += P(poly([pr(XL - 0.25, 0, Z0), pr(XL, 0, Z0), pr(XL, CH, Z0), pr(XR, CH, Z0), pr(XR, 0, Z0), pr(XR + 0.25, 0, Z0), pr(XR + 0.25, CH + 0.25, Z0), pr(XL - 0.25, CH + 0.25, Z0)]), '#1a222b', INK, 5);
  s += P(`M${pt(pr(XL - 0.22, 0.04, Z0))} L${pt(pr(XL - 0.22, CH + 0.22, Z0))} L${pt(pr(XR + 0.22, CH + 0.22, Z0))}`, 'none', '#3e4f60', 2.5, 'opacity="0.7"');
  // 문 앞 바닥(신관 2층 복도, 연회색 타일): 문지방 + 문틈에서 번져 나온 물
  const t0 = pr(XL - 0.25, 0, Z0), t1 = pr(XR + 0.25, 0, Z0);
  s += P(`M0 ${f1(t0[1])} L1024 ${f1(t1[1])} L1024 1536 L0 1536 Z`, `url(#${ID}near)`);
  for (let i = 0; i < 6; i++) { const y = t0[1] + 60 + i * i * 14 + i * 30; s += P(`M0 ${f1(y)} L1024 ${f1(y)}`, 'none', '#0e1217', 3); }
  for (let i = -6; i <= 6; i++) s += P(`M${f1(VX + i * 60)} ${f1(t0[1] + 26)} L${f1(VX + i * 260)} 1536`, 'none', '#0e1217', 2.5);
  // 번진 물웅덩이(문턱에서 앞으로 혀처럼)
  const py = t0[1] + 26;
  const pool = `M${f1(VX - 300)} ${f1(py)} L${f1(VX + 320)} ${f1(py)} C${f1(VX + 360)} ${f1(py + 60)} ${f1(VX + 250)} ${f1(py + 90)} ${f1(VX + 290)} ${f1(py + 150)} C${f1(VX + 330)} ${f1(py + 210)} ${f1(VX + 180)} ${f1(py + 230)} ${f1(VX + 150)} ${f1(py + 300)} C${f1(VX + 120)} ${f1(py + 370)} ${f1(VX + 10)} ${f1(py + 330)} ${f1(VX - 60)} ${f1(py + 360)} C${f1(VX - 160)} ${f1(py + 400)} ${f1(VX - 230)} ${f1(py + 300)} ${f1(VX - 190)} ${f1(py + 230)} C${f1(VX - 150)} ${f1(py + 170)} ${f1(VX - 360)} ${f1(py + 130)} ${f1(VX - 300)} ${f1(py)} Z`;
  s += `<g filter="url(#${ID}b6)">${P(pool, `url(#${ID}pool)`, 'none')}</g>`;
  s += P(pool, 'none', '#8ec4ff', 1.5, 'opacity="0.18"');
  s += P(`M${f1(VX - 34)} ${f1(t0[1] + 30)} L${f1(VX + 34)} ${f1(t0[1] + 30)} L${f1(VX + 60)} ${f1(t0[1] + 380)} L${f1(VX - 60)} ${f1(t0[1] + 380)} Z`, '#a8d0ff', 'none', 0, `opacity="0.14" filter="url(#${ID}b12)"`); // 웅덩이에 비친 통로 빛
  for (const [x, y, rx] of [[VX - 90, t0[1] + 150, 70], [VX + 120, t0[1] + 240, 54], [VX - 30, t0[1] + 340, 40]]) {
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${rx}" ry="${f1(rx * 0.22)}" fill="none" stroke="#a8d4ff" stroke-width="2" opacity="0.45"/>`;
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx * 0.5)}" ry="${f1(rx * 0.11)}" fill="none" stroke="#a8d4ff" stroke-width="1.5" opacity="0.35"/>`;
  }
  s += P(`M${pt(t0)} L${pt(t1)} L${f1(t1[0] + 20)} ${f1(t1[1] + 26)} L${f1(t0[0] - 20)} ${f1(t0[1] + 26)} Z`, '#1d252d', INK, 4);
  s += P(`M${f1(t0[0] - 10)} ${f1(t0[1] + 4)} L${f1(t1[0] + 10)} ${f1(t1[1] + 4)}`, 'none', '#7fb4e0', 2, 'opacity="0.5"');
  // 문 바깥 벽(신관 2층 복도: 아래 허리벽 타일, 위 페인트 벽)
  const wl = pr(XL - 0.25, CH + 0.25, Z0), wr = pr(XR + 0.25, CH + 0.25, Z0);
  s += P(`M0 0 L${pt(wl)} L${pt(t0)} L0 1536 Z`, '#0f141a');
  s += P(`M1024 0 L${pt(wr)} L${pt(t1)} L1024 1536 Z`, '#0d1217');
  s += P(`M0 0 L1024 0 L${pt(wr)} L${pt(wl)} Z`, '#0a0d11');
  // 허리벽 타일줄(앞벽)
  const wy = pr(0, 1.1, Z0)[1];
  s += P(`M0 ${f1(wy)} L${f1(t0[0])} ${f1(wy)} M${f1(t1[0])} ${f1(wy)} L1024 ${f1(wy)}`, 'none', '#05070a', 4);
  let tl = '';
  for (let y = wy + 34; y < t0[1]; y += 34) tl += `M0 ${f1(y)} L${f1(t0[0])} ${f1(y)} M${f1(t1[0])} ${f1(y)} L1024 ${f1(y)} `;
  for (let x = 17; x < t0[0]; x += 34) tl += `M${x} ${f1(wy)} L${x} ${f1(t0[1])} `;
  for (let x = t1[0] + 17; x < 1024; x += 34) tl += `M${f1(x)} ${f1(wy)} L${f1(x)} ${f1(t1[1])} `;
  s += P(tl, 'none', '#070a0d', 1.5, 'opacity="0.8"');
  return s;
}

// 오른쪽 벽: 돌 판의 오각형 홈에 끼운 水 패(가장 밝게 빛남)
function slot() {
  let s = '';
  const [sx, sy] = [902, 640];
  // 돌 판
  s += P(`M${sx - 92} ${sy - 120} L${sx + 92} ${sy - 116} L${sx + 96} ${sy + 118} L${sx - 90} ${sy + 122} Z`, '#1d242b', INK, 4);
  s += P(`M${sx - 92} ${sy - 120} L${sx + 92} ${sy - 116}`, 'none', '#55626e', 2.5, 'opacity="0.7"');
  // 홈에서 스며 나와 판을 타고 흘러내린 물자국
  for (const [x, len] of [[-34, 96], [-6, 120], [26, 84], [44, 104]]) s += P(`M${sx + x} ${sy + 50} C${sx + x + 2} ${sy + 50 + len * 0.4} ${sx + x - 2} ${sy + 50 + len * 0.7} ${sx + x + 1} ${sy + 50 + len}`, 'none', '#6fb6ff', 2.2, 'opacity="0.45"');
  s += P(`M${sx + 60} ${sy + 40} L${sx + 72} ${sy + 66} L${sx + 64} ${sy + 92} M${sx - 70} ${sy - 80} L${sx - 58} ${sy - 62}`, 'none', '#12171c', 2.5);
  // 오각형 홈 테(밝은 돌) → 홈 → 패
  const penta = (r, dy = 0) => Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; return [sx + Math.cos(a) * r, sy + dy + Math.sin(a) * r]; });
  s += `<g filter="url(#${ID}b18)"><circle cx="${sx}" cy="${sy}" r="96" fill="#3d9cff" opacity="0.55"/></g>`;
  s += P(poly(penta(74)), '#8e9aa6', INK, 4);
  s += P(poly(penta(60)), '#0a1420', INK, 3);
  s += P(poly(penta(55, 2)), '#16416e', '#9bd2ff', 3);
  s += P(poly([penta(55, 2)[0], penta(55, 2)[1], [sx, sy + 8]]), '#2a5f94', 'none', 0, 'opacity="0.6"');
  const q = (u, v) => [sx + u * 36, sy + 8 + v * 36];
  s += `<g filter="url(#${ID}b6)">${P(glyph(q), 'none', '#5ab8ff', 16)}</g>`;
  s += P(glyph(q), 'none', '#1b5aa0', 11);
  s += P(glyph(q), 'none', '#eaf8ff', 6);
  return s;
}

// 문틈에서 떠오르는 물방울(아래에서 위로, 거꾸로 흐르는 물)
function drops() {
  let s = '', seed = 7;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 80; i++) {
    const x = 300 + r() * 430, y = 260 + r() * 980, w = 2 + r() * 4.5, o = 0.2 + r() * 0.55;
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w * 0.75)}" ry="${f1(w)}" fill="#b6dcff" opacity="${f1(o)}"/>`;
    if (r() < 0.35) s += P(`M${f1(x)} ${f1(y + w)} L${f1(x)} ${f1(y + w + 6 + r() * 16)}`, 'none', '#b6dcff', 1.2, `opacity="${f1(o * 0.5)}"`);
  }
  return s;
}

export function draw() {
  const defs =
    `<filter id="${ID}b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>` +
    `<filter id="${ID}b6" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b12" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b18" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="18"/></filter>` +
    `<linearGradient id="${ID}floor" gradientUnits="userSpaceOnUse" x1="0" y1="1536" x2="0" y2="${VY}"><stop offset="0" stop-color="#132232"/><stop offset="1" stop-color="#05080c"/></linearGradient>` +
    `<linearGradient id="${ID}near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232b33"/><stop offset="1" stop-color="#0c0f12"/></linearGradient>` +
    `<linearGradient id="${ID}pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b5f92" stop-opacity="0.55"/><stop offset="1" stop-color="#16324f" stop-opacity="0.15"/></linearGradient>` +
    `<radialGradient id="${ID}blue" cx="512" cy="860" r="720" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3f8fe0" stop-opacity="0.3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}slotG" cx="902" cy="640" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#5ab4ff" stop-opacity="0.45"/><stop offset="0.4" stop-color="#2a6cb0" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="560" cy="700" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0.94"/></radialGradient>`;
  let s = `<rect width="1024" height="1536" fill="#06080b"/>`;
  s += corridor() + doors();
  s += `<rect width="1024" height="1536" fill="url(#${ID}blue)" style="mix-blend-mode:screen"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}slotG)" style="mix-blend-mode:screen"/>`;
  s += slot();
  s += drops();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
