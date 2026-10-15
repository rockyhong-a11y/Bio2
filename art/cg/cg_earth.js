// cg_earth — 2장 마지막 컷. 土의 패를 끼우자 결계문이 열리고, 그 너머로 신관으로 가는 연결 통로가 끝없이 길게 늘어져 있다(A·B 루트 공용, 인물 없음).
// 한 점 투시: 앞쪽 양옆에 안쪽으로 열린 낡은 두짝문(문짝에 누렇게 빛나는 '土' 음각 원반), 통로 왼쪽 벽엔 밤하늘 창이 끝없이 반복되고
// 천장 등은 멀어질수록 흐려진다. 통로 끝 아주 작은 빛 = 신관. 바닥에 흙먼지가 깔리고 문틈에서 누런 빛 입자가 흘러나온다.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#06060a';
const ID = 'ea';

// 한 점 투시(눈높이 1.5 m)
const FL = 560, VX = 512, VY = 660, EYE = 1.5;
const pr = (x, y, z) => [VX + FL * x / z, VY - FL * (y - EYE) / z];
const XL = -1.1, XR = 1.1, CH = 2.8, Z0 = 1.6, ZE = 90; // 통로 폭·높이, 문 위치, 끝

function corridor() {
  let s = '';
  // 천장·바닥·양벽
  s += P(poly([pr(XL, CH, Z0), pr(XR, CH, Z0), pr(XR, CH, ZE), pr(XL, CH, ZE)]), '#14161d');
  s += P(poly([pr(XL, 0, Z0), pr(XR, 0, Z0), pr(XR, 0, ZE), pr(XL, 0, ZE)]), `url(#${ID}floor)`);
  s += P(poly([pr(XL, 0, Z0), pr(XL, CH, Z0), pr(XL, CH, ZE), pr(XL, 0, ZE)]), '#1a1c24');
  s += P(poly([pr(XR, 0, Z0), pr(XR, CH, Z0), pr(XR, CH, ZE), pr(XR, 0, ZE)]), '#16181f');
  // 반복: 왼쪽 창(밤하늘)·오른쪽 벽 기둥·천장 등·바닥 이음선 — 멀수록 어둡고 촘촘
  for (let z = 2.2; z < ZE; z *= 1.16) {
    const z1 = z * 1.08, fade = Math.max(0, 1 - Math.log(z / 2) / Math.log(ZE / 2));
    s += P(poly([pr(XL, 1.0, z), pr(XL, 2.2, z), pr(XL, 2.2, z1), pr(XL, 1.0, z1)]), '#26355a', 'none', 0, `opacity="${f1(0.25 + fade * 0.6)}"`);
    s += P(`M${pt(pr(XL, 1.6, z))} L${pt(pr(XL, 1.6, z1))}`, 'none', '#0b0d14', 2);
    s += P(`M${pt(pr(XR, 0, z))} L${pt(pr(XR, CH, z))}`, 'none', '#0c0d12', Math.max(1, 6 * fade));
    s += P(`M${pt(pr(XL, 0, z))} L${pt(pr(XR, 0, z))}`, 'none', '#3a2c1c', Math.max(1, 3 * fade), `opacity="${f1(0.6 * fade + 0.1)}"`);
    const [lx, ly] = pr(0, CH - 0.02, z * 1.04), lw = FL * 0.22 / z;
    s += `<rect x="${f1(lx - lw)}" y="${f1(ly - lw * 0.2)}" width="${f1(lw * 2)}" height="${f1(Math.max(1, lw * 0.25))}" fill="#dfe8ff" opacity="${f1(0.08 + fade * 0.45)}"/>`;
    s += `<g filter="url(#${ID}b12)"><ellipse cx="${f1(lx)}" cy="${f1(pr(0, 0, z * 1.04)[1])}" rx="${f1(lw * 3)}" ry="${f1(lw * 0.5)}" fill="#c8d4f0" opacity="${f1(fade * 0.08)}"/></g>`;
  }
  // 통로 끝: 신관의 작은 빛
  const [ex, ey] = pr(0, 1.2, ZE);
  s += `<g filter="url(#${ID}b12)"><circle cx="${f1(ex)}" cy="${f1(ey)}" r="26" fill="#fff2cc" opacity="0.9"/></g>`;
  s += `<rect x="${f1(ex - 6)}" y="${f1(ey - 10)}" width="12" height="20" fill="#fffbe8"/>`;
  return s;
}

// 문짝(안쪽으로 열림) + 土 원반
function doors() {
  let s = '';
  const DW = 1.1, H = 2.7, A = 70 * Math.PI / 180;
  for (const sd of [-1, 1]) {
    const hinge = sd * DW, tip = (a, h) => pr(hinge - sd * a * Math.cos(A), h, Z0 + a * Math.sin(A));
    const leaf = [tip(0, 0), tip(0, H), tip(DW, H), tip(DW, 0)];
    s += P(poly(leaf), sd < 0 ? '#2b1d14' : '#24180f', INK, 5);
    for (const h of [0.5, 2.2]) s += P(`M${pt(tip(0.04, h))} L${pt(tip(DW - 0.04, h))} L${pt(tip(DW - 0.04, h + 0.12))} L${pt(tip(0.04, h + 0.12))} Z`, '#3c3a36', INK, 3); // 쇠띠
    for (let i = 1; i < 5; i++) s += P(`M${pt(tip(DW * i / 5, 0.05))} L${pt(tip(DW * i / 5, H - 0.05))}`, 'none', '#1a110b', 3); // 판자 이음
    if (sd > 0) {
      // 土 원반(오른짝 자유단)
      const c = tip(DW * 0.82, 1.45), r = FL * 0.28 / (Z0 + DW * 0.82 * Math.sin(A));
      s += `<g filter="url(#${ID}b12)"><ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * 1.5)}" ry="${f1(r * 2)}" fill="#ffc35a" opacity="0.55"/></g>`;
      s += `<ellipse cx="${f1(c[0])}" cy="${f1(c[1])}" rx="${f1(r * 0.62)}" ry="${f1(r)}" fill="#3a3326" stroke="#c8a052" stroke-width="4"/>`;
      const q = (u, v) => `${f1(c[0] + u * r * 0.55)} ${f1(c[1] + v * r * 0.9)}`;
      s += P(`M${q(-0.5, -0.25)} L${q(0.5, -0.25)} M${q(0, -0.7)} L${q(0, 0.55)} M${q(-0.8, 0.55)} L${q(0.8, 0.55)}`, 'none', '#ffe08a', 8); // 土
    }
  }
  // 문틀
  s += P(poly([pr(XL - 0.25, 0, Z0), pr(XL, 0, Z0), pr(XL, CH, Z0), pr(XR, CH, Z0), pr(XR, 0, Z0), pr(XR + 0.25, 0, Z0), pr(XR + 0.25, CH + 0.25, Z0), pr(XL - 0.25, CH + 0.25, Z0)]), '#1f1712', INK, 5);
  // 문 앞 바닥(본관 2층 복도): 문지방 + 흙먼지
  const t0 = pr(XL - 0.25, 0, Z0), t1 = pr(XR + 0.25, 0, Z0);
  s += P(`M0 ${f1(t0[1])} L1024 ${f1(t1[1])} L1024 1536 L0 1536 Z`, `url(#${ID}near)`);
  s += P(`M${pt(t0)} L${pt(t1)} L${f1(t1[0] + 20)} ${f1(t1[1] + 26)} L${f1(t0[0] - 20)} ${f1(t0[1] + 26)} Z`, '#2a1f17', INK, 4);
  for (let i = 0; i < 6; i++) { const y = t0[1] + 60 + i * i * 14 + i * 30; s += P(`M0 ${f1(y)} L1024 ${f1(y)}`, 'none', '#15110e', 3); }
  // 문 바깥 벽(본관 2층 복도)
  s += P(`M0 0 L${pt(pr(XL - 0.25, CH + 0.25, Z0))} L${pt(pr(XL - 0.25, 0, Z0))} L0 1536 Z`, '#101117');
  s += P(`M1024 0 L${pt(pr(XR + 0.25, CH + 0.25, Z0))} L${pt(pr(XR + 0.25, 0, Z0))} L1024 1536 Z`, '#0d0e13');
  s += P(`M0 0 L1024 0 L${pt(pr(XR + 0.25, CH + 0.25, Z0))} L${pt(pr(XL - 0.25, CH + 0.25, Z0))} Z`, '#0b0c10');
  // 오른쪽 벽의 홈에 끼운 土 패
  const [sx, sy] = [905, 640];
  s += P(`M${sx} ${sy - 60} L${sx + 56} ${sy - 18} L${sx + 36} ${sy + 50} L${sx - 36} ${sy + 50} L${sx - 56} ${sy - 18} Z`, '#8a6a34', INK, 4);
  s += P(`M${sx - 18} ${sy - 4} L${sx + 18} ${sy - 4} M${sx} ${sy - 30} L${sx} ${sy + 30} M${sx - 30} ${sy + 30} L${sx + 30} ${sy + 30}`, 'none', '#ffe08a', 6);
  s += `<g filter="url(#${ID}b12)"><circle cx="${sx}" cy="${sy}" r="60" fill="#ffc35a" opacity="0.35"/></g>`;
  return s;
}

function motes() {
  let s = '', seed = 5;
  const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 90; i++) {
    const x = 300 + r() * 420, y = 300 + r() * 900, w = 2 + r() * 4;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(w)}" fill="#ffd98a" opacity="${f1(0.2 + r() * 0.5)}"/>`;
  }
  return s;
}

export function draw() {
  const defs =
    `<filter id="${ID}b12" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<linearGradient id="${ID}floor" gradientUnits="userSpaceOnUse" x1="0" y1="1536" x2="0" y2="${VY}"><stop offset="0" stop-color="#3a2a1a"/><stop offset="1" stop-color="#0d0b0a"/></linearGradient>` +
    `<linearGradient id="${ID}near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2c1e"/><stop offset="1" stop-color="#120e0b"/></linearGradient>` +
    `<radialGradient id="${ID}amber" cx="512" cy="900" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c58a3a" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="700" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></radialGradient>`;
  let s = `<rect width="1024" height="1536" fill="#07080b"/>`;
  s += corridor() + doors();
  s += `<rect width="1024" height="1536" fill="url(#${ID}amber)" style="mix-blend-mode:screen"/>`;
  s += motes();
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
