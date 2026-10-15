// cg_cctv — 2장 교장실. 밀려난 책장 뒤에 숨어 있던 CRT 모니터 정면 클로즈업.
// 흑백 녹화 화면(천장 구석 카메라 시점): 교무실1, 높은 캐비닛 앞 의자를 딛고 올라선 수위가 캐비닛 위에 열쇠를 올려놓는다.
// 화면에는 주사선·잡음·날짜(오늘 밤)·PLAY 표시. 모니터 아래 비디오 플레이어(초록 표시창), 양옆으로 책장 단면, 어둠 속 교장실.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const poly = ps => 'M' + ps.map(pt).join(' L') + ' Z';
const INK = '#07080a';
const ID = 'cc';

// 화면(유리) 영역
const SX = 150, SY = 360, SW = 724, SH = 560, SR = 46;

// ---------------------------------------------------------------- 녹화 속 교무실(천장 구석에서 내려다본 투시)
// 방 좌표 (x: 0~1 왼→오, z: 0~1 앞→안쪽, y: 높이 m) → 화면 좌표
const VP = [SX + SW * 0.5, SY + SH * 0.1];
function room(x, z, y = 0) {
  // 바닥 사다리꼴: 앞(z=0)은 화면 아래 넓게, 안쪽(z=1)은 소실점 쪽으로 좁게
  const k = 1 - 0.68 * z;
  const bx = VP[0] + (x - 0.5) * SW * 1.5 * k;
  const by = VP[1] + (SH * 1.08) * k;
  return [bx, by - y * 150 * k];
}
function footage() {
  let s = '';
  s += `<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" fill="#2a2c2c"/>`;
  // 벽·바닥
  s += P(poly([room(-0.2, 1, 3), room(1.25, 1, 3), room(1.25, 1, 0), room(-0.2, 1, 0)]), '#4a4d4c');
  s += P(poly([room(-0.2, 0, 0), room(1.25, 0, 0), room(1.25, 1, 0), room(-0.2, 1, 0)]), '#5d605e');
  for (let i = 1; i < 9; i++) { const z = i / 9; s += P(`M${pt(room(-0.2, z))} L${pt(room(1.25, z))}`, 'none', '#4f5251', 2); }
  for (let i = 0; i < 12; i++) { const x = -0.2 + i * 0.13; s += P(`M${pt(room(x, 0))} L${pt(room(x, 1))}`, 'none', '#525554', 2); }
  s += P(poly([room(1.25, 0, 0), room(1.25, 1, 0), room(1.25, 1, 3), room(1.25, 0, 3)]), '#3f4241');
  // 창(안쪽 벽, 밤이라 검다)
  for (const x of [0.02, 0.32]) s += P(poly([room(x, 1, 1.2), room(x + 0.22, 1, 1.2), room(x + 0.22, 1, 2.4), room(x, 1, 2.4)]), '#1c1e1e', '#303232', 3);
  // 책상 두 줄
  const desk = (x, z, w, d) => {
    let o = '';
    o += P(poly([room(x, z, 0.75), room(x + w, z, 0.75), room(x + w, z + d, 0.75), room(x, z + d, 0.75)]), '#8a8c8a', '#3a3c3b', 2);
    o += P(poly([room(x, z, 0.75), room(x + w, z, 0.75), room(x + w, z, 0), room(x, z, 0)]), '#545756', '#3a3c3b', 2);
    o += P(poly([room(x + 0.05, z + d * 0.3, 0.75), room(x + 0.15, z + d * 0.3, 0.75), room(x + 0.15, z + d * 0.3, 1.05), room(x + 0.05, z + d * 0.3, 1.05)]), '#a2a4a2', '#3a3c3b', 1.5); // 서류철
    return o;
  };
  for (const [x, z] of [[-0.12, 0.66], [0.16, 0.66], [-0.12, 0.36], [0.16, 0.36]]) s += desk(x, z, 0.24, 0.16);
  // 높은 캐비닛(오른쪽 안)
  const cx0 = 0.6, cx1 = 0.8, cz0 = 0.5, cz1 = 0.62;
  s += P(poly([room(cx0, cz0, 2.35), room(cx1, cz0, 2.35), room(cx1, cz1, 2.35), room(cx0, cz1, 2.35)]), '#b4b6b4', '#2c2e2d', 2.5); // 윗면
  s += P(poly([room(cx0, cz0, 2.35), room(cx1, cz0, 2.35), room(cx1, cz0, 0), room(cx0, cz0, 0)]), '#7b7e7c', '#2c2e2d', 2.5);
  s += P(`M${pt(room((cx0 + cx1) / 2, cz0, 2.3))} L${pt(room((cx0 + cx1) / 2, cz0, 0.05))}`, 'none', '#3c3e3d', 2.5);
  // 의자(캐비닛 앞)
  const ch0 = 0.63, ch1 = 0.75, chz0 = 0.36, chz1 = 0.46;
  s += P(poly([room(ch0, chz0, 0.45), room(ch1, chz0, 0.45), room(ch1, chz1, 0.45), room(ch0, chz1, 0.45)]), '#9a9c9a', '#2c2e2d', 2);
  for (const [x, z] of [[ch0, chz0], [ch1, chz0]]) s += P(`M${pt(room(x, z, 0.45))} L${pt(room(x, z, 0))}`, 'none', '#2c2e2d', 4);
  s += P(poly([room(ch0, chz1, 0.45), room(ch1, chz1, 0.45), room(ch1, chz1, 0.95), room(ch0, chz1, 0.95)]), '#6e706e', '#2c2e2d', 2); // 등받이
  // 수위: 의자 위에 서서 오른팔을 캐비닛 위로 뻗음(회색 실루엣, 등을 보임)
  const foot = room(0.69, 0.41, 0.45);
  const top = room(0.69, 0.41, 2.1);
  const hgt = foot[1] - top[1], w = hgt * 0.36;
  const bx = foot[0], by = foot[1];
  let j = '';
  j += P(`M${bx - w * 0.28} ${by} L${bx - w * 0.2} ${by - hgt * 0.45} L${bx + w * 0.22} ${by - hgt * 0.45} L${bx + w * 0.3} ${by} Z`, '#3d3f3e'); // 다리
  j += P(`M${bx - w * 0.5} ${by - hgt * 0.42} C${bx - w * 0.56} ${by - hgt * 0.62} ${bx - w * 0.5} ${by - hgt * 0.8} ${bx - w * 0.3} ${by - hgt * 0.84} L${bx + w * 0.34} ${by - hgt * 0.84} C${bx + w * 0.5} ${by - hgt * 0.78} ${bx + w * 0.52} ${by - hgt * 0.6} ${bx + w * 0.46} ${by - hgt * 0.42} Z`, '#4f5250'); // 작업복 상체
  j += P(`M${bx + w * 0.3} ${by - hgt * 0.8} C${bx + w * 0.6} ${by - hgt * 0.95} ${bx + w * 0.76} ${by - hgt * 1.12} ${bx + w * 0.86} ${by - hgt * 1.26}`, 'none', '#4f5250', w * 0.2); // 뻗은 팔
  j += `<ellipse cx="${f1(bx + w * 0.9)}" cy="${f1(by - hgt * 1.29)}" rx="${f1(w * 0.12)}" ry="${f1(w * 0.1)}" fill="#c9cbc9"/>`; // 손(밝게)
  j += P(`M${bx + w * 0.9} ${by - hgt * 1.3} l${w * 0.18} ${-w * 0.05} l${w * 0.04} ${w * 0.06}`, 'none', '#f0f2f0', 3); // 열쇠(반짝)
  j += P(`M${bx - w * 0.36} ${by - hgt * 0.76} C${bx - w * 0.5} ${by - hgt * 0.6} ${bx - w * 0.44} ${by - hgt * 0.5} ${bx - w * 0.34} ${by - hgt * 0.45}`, 'none', '#454746', w * 0.17); // 내린 팔
  j += P(`M${bx - w * 0.4} ${by - hgt * 0.42} L${bx - w * 0.46} ${by - hgt * 0.1}`, 'none', '#5a5c5b', w * 0.07); // 방망이
  j += `<ellipse cx="${f1(bx)}" cy="${f1(by - hgt * 0.94)}" rx="${f1(w * 0.2)}" ry="${f1(w * 0.23)}" fill="#8f918f"/>`; // 대머리(밝은 정수리)
  j += `<ellipse cx="${f1(bx - w * 0.03)}" cy="${f1(by - hgt * 0.98)}" rx="${f1(w * 0.1)}" ry="${f1(w * 0.07)}" fill="#c4c6c4"/>`;
  j += P(`M${bx - w * 0.2} ${by - hgt * 0.5} L${bx + w * 0.2} ${by - hgt * 0.5}`, 'none', '#2f3130', 3);
  for (let i = 0; i < 4; i++) j += `<circle cx="${f1(bx - w * 0.12 + i * w * 0.07)}" cy="${f1(by - hgt * 0.47)}" r="2.6" fill="#d5d7d5"/>`; // 열쇠 꾸러미
  s += j;
  // 손전등 빛(바닥에 놓아 둔 손전등이 캐비닛을 비춤)
  const fl = room(0.52, 0.2, 0);
  s += `<g style="mix-blend-mode:screen" filter="url(#${ID}b12)">${P(poly([fl, room(0.6, 0.5, 2.7), room(0.86, 0.5, 2.7)]), '#d9dbd9', 'none', 0, 'opacity="0.2"')}</g>`;
  s += `<rect x="${f1(fl[0] - 8)}" y="${f1(fl[1] - 6)}" width="16" height="9" fill="#e8eae8"/>`;
  return s;
}

export function draw() {
  const defs =
    `<pattern id="${ID}scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" opacity="0.38"/></pattern>` +
    `<filter id="${ID}noise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 -0.12"/></filter>` +
    `<filter id="${ID}b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12"/></filter>` +
    `<filter id="${ID}b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>` +
    `<filter id="${ID}soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.2"/></filter>` +
    `<clipPath id="${ID}glass"><rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="${SR}"/></clipPath>` +
    `<radialGradient id="${ID}curve" cx="${SX + SW / 2}" cy="${SY + SH / 2}" r="${SW * 0.62}" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/></radialGradient>` +
    `<linearGradient id="${ID}glare" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.02"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="${ID}bezel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a49d8a"/><stop offset="1" stop-color="#6d6758"/></linearGradient>` +
    `<radialGradient id="${ID}spill" cx="512" cy="640" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9fb0b4" stop-opacity="0.22"/><stop offset="1" stop-color="#9fb0b4" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="660" r="900" gradientUnits="userSpaceOnUse"><stop offset="0.4" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></radialGradient>`;
  let s = `<rect width="1024" height="1536" fill="#050506"/>`;
  // ---------------- 책장 단면(양옆) + 벽 속 칸
  s += P('M40 120 L984 120 L984 1300 L40 1300 Z', '#0d0c0b', INK, 4);
  for (const x of [0, 920]) {
    s += P(`M${x} 0 L${x + 104} 0 L${x + 104} 1536 L${x} 1536 Z`, '#1a120c', INK, 4);
    for (let y = 60; y < 1500; y += 210) {
      s += P(`M${x} ${y} L${x + 104} ${y} L${x + 104} ${y + 14} L${x} ${y + 14} Z`, '#2d2016', INK, 3);
      let bx = x + 8;
      for (let k = 0; bx < x + 96; k++) {
        const bw = 12 + ((k * 7 + y) % 9), bh = 120 + ((k * 13 + y) % 60);
        s += `<rect x="${bx}" y="${y - bh}" width="${bw}" height="${bh}" fill="${['#3a1d1a', '#1f2a36', '#2c2a1c', '#3b3328'][(k + y) % 4]}" stroke="${INK}" stroke-width="2"/>`;
        bx += bw + 2;
      }
    }
  }
  // ---------------- 모니터 몸체(베이지 CRT) + 화면
  s += `<rect x="96" y="290" width="832" height="720" rx="40" fill="url(#${ID}bezel)" stroke="${INK}" stroke-width="5"/>`;
  s += `<rect x="118" y="316" width="788" height="640" rx="54" fill="#2a2924" stroke="${INK}" stroke-width="4"/>`;
  s += `<g clip-path="url(#${ID}glass)"><g filter="url(#${ID}soft)">${footage()}</g>` +
    `<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" filter="url(#${ID}noise)" opacity="0.5"/>` +
    `<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" fill="url(#${ID}scan)"/>` +
    `<rect x="${SX}" y="${SY + SH * 0.62}" width="${SW}" height="16" fill="#fff" opacity="0.07"/>` + // 굴러가는 띠
    `<g font-family="monospace" font-weight="700" fill="#eef2ee"><text x="${SX + 34}" y="${SY + 56}" font-size="30">PLAY ▶</text>` +
    `<text x="${SX + SW - 34}" y="${SY + 56}" font-size="28" text-anchor="end">CAM 03</text>` +
    `<text x="${SX + 34}" y="${SY + SH - 34}" font-size="28">2001.03.13  PM 09:12:47</text></g>` +
    `<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" fill="url(#${ID}curve)"/>` +
    `<path d="M${SX} ${SY} L${SX + SW * 0.62} ${SY} L${SX} ${SY + SH * 0.7} Z" fill="url(#${ID}glare)"/></g>`;
  s += `<rect x="${SX}" y="${SY}" width="${SW}" height="${SH}" rx="${SR}" fill="none" stroke="#141310" stroke-width="10"/>`;
  // 모니터 아래 띠: 상표·전원 불·조절 노브
  s += P('M118 960 L906 960 L906 996 L118 996 Z', '#8c8574', INK, 3);
  s += `<text x="160" y="988" font-family="sans-serif" font-size="22" font-weight="700" fill="#4c473c" letter-spacing="3">CCTV MONITOR  14"</text>`;
  s += `<circle cx="860" cy="978" r="8" fill="#6cff8a"/><circle cx="860" cy="978" r="22" fill="#6cff8a" opacity="0.18"/>`;
  for (const x of [740, 790]) s += `<circle cx="${x}" cy="978" r="12" fill="#5d574a" stroke="${INK}" stroke-width="3"/>`;
  // ---------------- 비디오 플레이어
  s += P('M150 1040 L874 1040 L874 1140 L150 1140 Z', '#18191b', INK, 4);
  s += P('M150 1040 L874 1040 L874 1052 L150 1052 Z', '#2b2d31');
  s += P('M210 1076 L520 1076 L520 1100 L210 1100 Z', '#050506', '#2b2d31', 2); // 테이프 입구
  s += `<rect x="600" y="1068" width="200" height="44" rx="4" fill="#06140b"/>`;
  s += `<text x="700" y="1100" font-family="monospace" font-size="28" font-weight="700" fill="#5dff8f" text-anchor="middle">PLAY 0:21</text>`;
  s += `<circle cx="560" cy="1090" r="7" fill="#ff3b3b"/>`;
  // 화면 빛이 둘레를 물들임 + 비네트
  s += `<rect width="1024" height="1536" fill="url(#${ID}spill)" style="mix-blend-mode:screen"/>`;
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
