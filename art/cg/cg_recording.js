// cg_recording — (B루트) 방송실. 꺼진 방송 장비 너머 녹음 부스 유리창 안, 천장 가까이 매달린 귀신이 고개를 숙여 내려다보며 운다.
// 눈높이에서 유리 너머로 본다(올려다보지 않음). 부스의 작은 바깥 창으로 든 달빛이 뒤에서 비춘다. 소영·다른 사람·사람의 반사 없음.
// 귀신 모습은 cg_hanging 의 ghost()를 그대로 쓴다.
import * as K from '../kit.js';
import { ghost } from './cg_hanging.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const quad = (a, b, d, e) => `M${pt(a)} L${pt(b)} L${pt(d)} L${pt(e)} Z`;
const INK = '#030407';

// 한 점 투시(눈높이 = 소실점 y)
const VP = [500, 700];
const at = (s, x, y) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
// 유리창(방 벽에 난 안쪽 창)
const WIN = { x0: 104, y0: 176, x1: 880, y1: 1010, fr: 26 };
const GL = { x0: WIN.x0 + WIN.fr, y0: WIN.y0 + WIN.fr, x1: WIN.x1 - WIN.fr, y1: WIN.y1 - WIN.fr };
// 부스 단면(유리 깊이 s=1) — 유리보다 조금 크다. 뒷벽은 s=0.6
const BX0 = 70, BX1 = 930, BY0 = 120, BY1 = 1380, SB = 0.6;
// 귀신(유리 바로 안쪽, 천장 가까이)
const GX = 486, GY = 292, GK = 0.95;

export function draw() {
  const g = ghost({ pre: 'rcG', look: 'down', tilt: 8, headDy: 7, sway: 0.8, legEnd: '#000', tint: 'url(#rcTint)' });
  const defs = g.defs +
    `<pattern id="rcHoles" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="8.5" cy="8.5" r="2.3" fill="#000" opacity="0.55"/></pattern>` +
    `<pattern id="rcHolesS" width="11" height="11" patternUnits="userSpaceOnUse"><circle cx="5.5" cy="5.5" r="1.6" fill="#000" opacity="0.5"/></pattern>` +
    `<linearGradient id="rcTint" gradientUnits="userSpaceOnUse" x1="-110" y1="0" x2="120" y2="0">` +
    `<stop offset="0" stop-color="#070b16" stop-opacity="0.72"/><stop offset="0.6" stop-color="#070b16" stop-opacity="0.5"/><stop offset="1" stop-color="#070b16" stop-opacity="0.18"/></linearGradient>` +
    `<radialGradient id="rcMoon" cx="696" cy="456" r="470" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="#c6d8f2" stop-opacity="0.42"/><stop offset="0.3" stop-color="#7f9cc8" stop-opacity="0.16"/><stop offset="0.7" stop-color="#2b3c5a" stop-opacity="0.05"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="rcBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4e3f7" stop-opacity="0.32"/><stop offset="1" stop-color="#d4e3f7" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="rcDeskLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb8dc" stop-opacity="0.14"/><stop offset="1" stop-color="#9fb8dc" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="rcWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a281b"/><stop offset="1" stop-color="#1a120c"/></linearGradient>` +
    `<linearGradient id="rcTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3139"/><stop offset="0.4" stop-color="#171a20"/><stop offset="1" stop-color="#0b0d10"/></linearGradient>` +
    `<radialGradient id="rcVig" cx="500" cy="640" r="900" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0.36" stop-color="#000" stop-opacity="0"/><stop offset="0.7" stop-color="#000" stop-opacity="0.6"/><stop offset="1" stop-color="#000" stop-opacity="0.96"/></radialGradient>` +
    `<linearGradient id="rcBot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.9"/></linearGradient>` +
    `<linearGradient id="rcLegDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070c" stop-opacity="0"/><stop offset="1" stop-color="#05070c" stop-opacity="0.92"/></linearGradient>` +
    `<filter id="rcB30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="rcB18" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>` +
    `<filter id="rcB8" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>` +
    `<clipPath id="rcGlass"><rect x="${GL.x0}" y="${GL.y0}" width="${GL.x1 - GL.x0}" height="${GL.y1 - GL.y0}"/></clipPath>`;

  let s = `<rect width="1024" height="1536" fill="#06070a"/>`;

  // ---------------- 부스 안(유리 너머)
  let b = '';
  const bTL = at(SB, BX0, BY0), bTR = at(SB, BX1, BY0), bBR = at(SB, BX1, BY1), bBL = at(SB, BX0, BY1);
  const nTL = [BX0, BY0], nTR = [BX1, BY0], nBR = [BX1, BY1], nBL = [BX0, BY1];
  b += P(quad(nTL, nTR, bTR, bTL), '#07090d', INK, 2.5); // 천장
  b += P(quad(nTL, bTL, bBL, nBL), '#090c11', INK, 2.5); // 왼벽
  b += P(quad(nTR, bTR, bBR, nBR), '#080a0f', INK, 2.5); // 오른벽
  b += P(quad(bTL, bTR, bBR, bBL), '#0b0f16', INK, 2.5); // 뒷벽
  // 흡음판: 큰 사각 판 + 구멍 무늬
  const bw = bTR[0] - bTL[0], bh = bBL[1] - bTL[1];
  let panels = '';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
    const x = bTL[0] + 8 + i * bw / 3, y = bTL[1] + 8 + j * bh / 4;
    panels += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw / 3 - 16)}" height="${f1(bh / 4 - 16)}" fill="#0f141d" stroke="${INK}" stroke-width="2"/>`;
    panels += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(bw / 3 - 16)}" height="${f1(bh / 4 - 16)}" fill="url(#rcHoles)"/>`;
  }
  b += panels;
  // 옆벽 흡음판(원근 따라 세로 이음선)
  let side = '';
  for (const sd of [0.68, 0.78, 0.9]) {
    side += `M${pt(at(sd, BX0, BY0))} L${pt(at(sd, BX0, BY1))} M${pt(at(sd, BX1, BY0))} L${pt(at(sd, BX1, BY1))} `;
  }
  for (const y of [430, 760, 1090]) side += `M${pt(at(SB, BX0, y))} L${pt([BX0, y])} M${pt(at(SB, BX1, y))} L${pt([BX1, y])} `;
  b += P(quad(nTL, bTL, bBL, nBL), 'url(#rcHolesS)', 'none') + P(quad(nTR, bTR, bBR, nBR), 'url(#rcHolesS)', 'none');
  b += P(side, 'none', INK, 2.2);
  // 천장 흡음 타일 이음선
  let ceil = '';
  for (const x of [250, 430, 610, 790]) ceil += `M${pt([x, BY0])} L${pt(at(SB, x, BY0))} `;
  ceil += `M${pt(at(0.8, BX0, BY0))} L${pt(at(0.8, BX1, BY0))} `;
  b += P(ceil, 'none', INK, 2);
  // 부스의 작은 바깥 창(달빛) — 뒷벽 오른쪽 위
  const mw = { x0: 640, y0: 392, x1: 752, y1: 520 };
  b += `<rect x="${mw.x0 - 8}" y="${mw.y0 - 8}" width="${mw.x1 - mw.x0 + 16}" height="${mw.y1 - mw.y0 + 16}" fill="#0a0d12" stroke="${INK}" stroke-width="2.5"/>`;
  b += `<rect x="${mw.x0}" y="${mw.y0}" width="${mw.x1 - mw.x0}" height="${mw.y1 - mw.y0}" fill="#b9cdea"/>`;
  b += `<rect x="${mw.x0}" y="${mw.y0}" width="${mw.x1 - mw.x0}" height="${(mw.y1 - mw.y0) * 0.45}" fill="#dde9f8"/>`;
  b += P(`M${(mw.x0 + mw.x1) / 2} ${mw.y0} L${(mw.x0 + mw.x1) / 2} ${mw.y1} M${mw.x0} ${(mw.y0 + mw.y1) / 2} L${mw.x1} ${(mw.y0 + mw.y1) / 2}`, 'none', '#0a0d12', 7);
  b += `<circle cx="${mw.x0 + 30}" cy="${mw.y0 + 28}" r="11" fill="#f2f6fc"/>`; // 창 너머 달
  // 달빛이 부스 안을 채움 + 비스듬한 빛줄기(왼쪽 아래로)
  b += `<rect x="${GL.x0}" y="${GL.y0}" width="${GL.x1 - GL.x0}" height="${GL.y1 - GL.y0}" fill="url(#rcMoon)" style="mix-blend-mode:screen"/>`;
  b += `<g filter="url(#rcB8)">` +
    P(`M${mw.x0} ${mw.y0} L${mw.x1} ${mw.y0 + 10} L${GL.x0 + 380} ${GL.y1} L${GL.x0 + 40} ${GL.y1} Z`, 'url(#rcBeam)', 'none', 0, 'style="mix-blend-mode:screen"') + '</g>';
  // 빛을 받은 왼쪽 벽의 창 모양 빛 자국
  b += P(`M${pt(at(0.72, BX0, 700))} L${pt(at(0.86, BX0, 760))} L${pt(at(0.86, BX0, 980))} L${pt(at(0.72, BX0, 900))} Z`, '#a9bfe0', 'none', 0, 'opacity="0.16" filter="url(#rcB8)"');
  // 오래되어 해진 밧줄: 유리 위 가장자리(부스 천장 쪽)에서 내려와 긴 머리카락 뒤로 사라짐
  b += rope();
  // 귀신: 달빛 역광 테두리 → 희미한 자기 빛 → 몸
  b += `<g transform="translate(${GX} ${GY}) scale(${GK})"><g mask="${g.mask}">`;
  b += `<g filter="url(#rcB30)" opacity="0.4">${g.sil('fill="#7da6dc"')}</g>`;
  b += `<g transform="translate(3.2 -2.6)" opacity="0.9">${g.sil('fill="#cfe0f5"')}</g>`;
  b += g.svg;
  b += `</g></g>`;
  s += `<g clip-path="url(#rcGlass)">${b}</g>`;
  return finish(s, defs);
}

function rope() {
  // 정수리가 아니라 머리 왼쪽 뒤로 지나가 긴 머리카락 뒤로 사라진다(매듭·목은 보이지 않음)
  const rx = GX - 50 * GK, top = GL.y0 - 4, bot = GY + 110 * GK;
  let r = P(`M${rx - 6} ${top} L${rx + 6} ${top} L${rx + 5} ${bot} L${rx - 5} ${bot} Z`, '#47463f', INK, 2.5);
  let tw = '';
  for (let y = top + 8; y < bot - 4; y += 9) tw += `M${rx - 4.5} ${y + 4} L${rx + 4.5} ${y - 2} `;
  r += P(tw, 'none', '#1d1d19', 1.7, 'opacity="0.85"');
  r += P(`M${rx + 5} ${top + 22} l8 5 M${rx - 5} ${top + 44} l-8 6 M${rx + 5} ${top + 62} l6 -3 M${rx - 5} ${top + 12} l-6 -5`, 'none', '#5e5b52', 1.4);
  r += P(`M${rx + 3} ${top + 4} L${rx + 3} ${bot - 6}`, 'none', '#c8d8ee', 1.8, 'opacity="0.55"');
  return r;
}

// 유리 표면·방 벽·창틀·선반·콘솔·마이크·비네트
function finish(s, defs) {
  // ---------------- 유리: 옅은 반사·김 서림
  let gl = '';
  gl += `<rect x="${GL.x0}" y="${GL.y0}" width="${GL.x1 - GL.x0}" height="${GL.y1 - GL.y0}" fill="#9fb6d6" opacity="0.04"/>`;
  gl += P(`M${GL.x0} ${GL.y0 + 120} L${GL.x0 + 120} ${GL.y0} L${GL.x0 + 200} ${GL.y0} L${GL.x0} ${GL.y0 + 200} Z`, '#dfe9f6', 'none', 0, 'opacity="0.07"');
  gl += P(`M${GL.x0} ${GL.y0 + 260} L${GL.x0 + 260} ${GL.y0} L${GL.x0 + 290} ${GL.y0} L${GL.x0} ${GL.y0 + 290} Z`, '#dfe9f6', 'none', 0, 'opacity="0.05"');
  gl += P(`M${GL.x1} ${GL.y1 - 300} L${GL.x1 - 300} ${GL.y1} L${GL.x1 - 250} ${GL.y1} L${GL.x1} ${GL.y1 - 250} Z`, '#dfe9f6', 'none', 0, 'opacity="0.05"');
  gl += `<g filter="url(#rcB30)" opacity="0.5"><ellipse cx="${GL.x0 + 120}" cy="${GL.y1 - 40}" rx="230" ry="70" fill="#b8c8de" opacity="0.35"/><ellipse cx="${GL.x1 - 60}" cy="${GL.y1 - 70}" rx="160" ry="90" fill="#b8c8de" opacity="0.3"/><ellipse cx="${GL.x0 + 30}" cy="${GL.y0 + 380}" rx="60" ry="160" fill="#b8c8de" opacity="0.18"/></g>`;
  s += `<g clip-path="url(#rcGlass)">${gl}</g>`;
  // ---------------- 방 벽 + 창틀
  const wall = `M0 0 L1024 0 L1024 1536 L0 1536 Z M${WIN.x0} ${WIN.y0} L${WIN.x0} ${WIN.y1} L${WIN.x1} ${WIN.y1} L${WIN.x1} ${WIN.y0} Z`;
  s += P(wall, '#0b0c10', 'none', 0, 'fill-rule="evenodd"');
  s += P('M0 120 L1024 120', 'none', '#050608', 3);
  const fr = `M${WIN.x0} ${WIN.y0} L${WIN.x1} ${WIN.y0} L${WIN.x1} ${WIN.y1} L${WIN.x0} ${WIN.y1} Z M${GL.x0} ${GL.y0} L${GL.x0} ${GL.y1} L${GL.x1} ${GL.y1} L${GL.x1} ${GL.y0} Z`;
  s += P(fr, '#1d2129', INK, 3, 'fill-rule="evenodd"');
  s += P(`M${GL.x0} ${GL.y1} L${GL.x1} ${GL.y1} L${WIN.x1 - 6} ${WIN.y1 - 6} L${WIN.x0 + 6} ${WIN.y1 - 6} Z`, '#3a4352', 'none'); // 아래틀 윗면(달빛)
  s += P(`M${GL.x1} ${GL.y0} L${GL.x1} ${GL.y1}`, 'none', '#56637a', 3, 'opacity="0.7"');
  s += P(`M${GL.x0} ${GL.y0} L${GL.x1} ${GL.y0}`, 'none', '#0e1117', 4);
  // ---------------- 오른쪽: 카세트테이프 선반
  let sh = '';
  const SX = 900;
  sh += P(`M${SX} 140 L1024 140 L1024 1080 L${SX} 1080 Z`, '#140f0b', INK, 3);
  for (const y of [262, 378, 494, 610, 726, 842, 958]) {
    sh += P(`M${SX} ${y} L1024 ${y} L1024 ${y + 12} L${SX} ${y + 12} Z`, '#2e2117', INK, 2.5);
    let x = SX + 8, k = 0;
    while (x < 1020) {
      const w = 13, h = 68;
      const cols = ['#20242c', '#1a1d24', '#262321', '#1d212b'];
      sh += `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${cols[k % 4]}" stroke="${INK}" stroke-width="1.8"/>`;
      sh += `<rect x="${x + 3}" y="${y - h + 8}" width="${w - 6}" height="${h * 0.42}" fill="#4d545f" opacity="0.5"/>`;
      x += w + 1; k++;
      if (k % 6 === 5) x += 6;
    }
  }
  sh += P(`M${SX} 140 L${SX} 1080`, 'none', '#7d93b5', 2.5, 'opacity="0.45"');
  s += sh;
  // ---------------- 앞: 꺼진 믹싱 콘솔(회색 윗판 + 나무 몸체) — 불빛 없음
  let cs = '';
  const top0 = 1086, topW0 = [36, 988];
  const tp = (u, t) => { const k = 1 / (1 - 0.55 * t); return [500 + (u - 500) * k, VP[1] + (top0 - VP[1]) * k]; };
  cs += P(quad(tp(topW0[0], 0), tp(topW0[1], 0), tp(topW0[1], 1), tp(topW0[0], 1)), 'url(#rcTop)', INK, 3);
  // 채널 줄: 노브 4개 + 페이더 홈 + 페이더 손잡이
  for (let i = 0; i < 12; i++) {
    const u = 96 + i * 74;
    let col = '';
    for (const t of [0.05, 0.14, 0.23]) {
      const p = tp(u, t), k = 1 / (1 - 0.55 * t);
      col += `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="${f1(13 * k)}" ry="${f1(7 * k)}" fill="#14161a" stroke="${INK}" stroke-width="2"/>`;
      col += `<ellipse cx="${f1(p[0] - 2 * k)}" cy="${f1(p[1] - 2 * k)}" rx="${f1(5 * k)}" ry="${f1(2.6 * k)}" fill="#5d6570" opacity="0.45"/>`;
    }
    const a = tp(u, 0.4), z = tp(u, 0.78);
    col += P(`M${pt(a)} L${pt(z)}`, 'none', '#0a0b0e', 7 * (1 / (1 - 0.55 * 0.6)));
    const ft = 0.5 + ((i * 37) % 23) / 100, fp = tp(u, ft), fk = 1 / (1 - 0.55 * ft);
    col += `<rect x="${f1(fp[0] - 16 * fk)}" y="${f1(fp[1] - 7 * fk)}" width="${f1(32 * fk)}" height="${f1(14 * fk)}" rx="${f1(3 * fk)}" fill="#5d636c" stroke="${INK}" stroke-width="2"/>`;
    col += P(`M${pt(tp(u + 37, 0.02))} L${pt(tp(u + 37, 1))}`, 'none', '#1a1d22', 2);
    cs += col;
  }
  cs += P(quad(tp(topW0[0], 0), tp(topW0[1], 0), tp(topW0[1], 0.65), tp(topW0[0], 0.65)), 'url(#rcDeskLight)', 'none', 0, 'style="mix-blend-mode:screen"');
  // 나무 미터 브리지(바늘 미터, 불 꺼짐)
  cs += P(`M28 992 L996 992 L988 ${top0} L36 ${top0} Z`, 'url(#rcWood)', INK, 3);
  cs += P(`M28 992 L996 992 L994 1004 L30 1004 Z`, '#5a4430', INK, 2);
  for (let i = 0; i < 6; i++) {
    const x = 120 + i * 140;
    cs += `<rect x="${x}" y="1020" width="96" height="50" rx="4" fill="#26241f" stroke="${INK}" stroke-width="2.5"/>`;
    cs += P(`M${x + 12} 1060 Q${x + 48} 1030 ${x + 84} 1060`, 'none', '#4b473d', 2);
    cs += P(`M${x + 48} 1064 L${x + 26} 1042`, 'none', '#0b0b0b', 2.2);
  }
  // 나무 옆판(양쪽)
  cs += P(`M0 1000 L36 ${top0} L-60 1536 L0 1536 Z`, '#2a1d13', INK, 3);
  cs += P(`M1024 1000 L988 ${top0} L1084 1536 L1024 1536 Z`, '#24180f', INK, 3);
  s += cs;
  // ---------------- 왼쪽 앞: 스탠드 마이크(실루엣, 유리 빛에 테두리만)
  let mic = '';
  mic += `<ellipse cx="236" cy="1236" rx="66" ry="16" fill="#0b0c0f" stroke="${INK}" stroke-width="3"/>`;
  mic += P('M178 1230 C200 1222 270 1222 294 1230', 'none', '#56657e', 2, 'opacity="0.6"'); // 무거운 받침 윗면 가장자리
  mic += P('M231 1236 L231 930 L241 930 L241 1236 Z', '#121418', INK, 3);
  mic += P('M236 936 L300 846', 'none', INK, 13) + P('M236 936 L300 846', 'none', '#15171c', 7);
  mic += `<g transform="rotate(-34 312 820)"><rect x="296" y="752" width="34" height="96" rx="15" fill="#101216" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="296" y="752" width="34" height="46" rx="15" fill="#1a1d23" stroke="${INK}" stroke-width="3"/>` +
    P('M302 768 L324 768 M300 780 L326 780', 'none', '#2b3038', 2) +
    P('M330 770 L330 836', 'none', '#9cb2d4', 2.5, 'opacity="0.6"') + `</g>`;
  mic += P('M241 940 L241 1226', 'none', '#7f97bc', 2, 'opacity="0.45"');
  s += mic;
  // ---------------- 비네트 · 아래 10% 어둡게
  s += `<rect width="1024" height="1536" fill="url(#rcVig)"/>`;
  s += `<rect y="1160" width="1024" height="376" fill="url(#rcBot)"/>`;
  return K.svg(s, { defs });
}
