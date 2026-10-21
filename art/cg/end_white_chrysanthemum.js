// end_white_chrysanthemum — 엔딩(흰 국화). 새벽, 학교 운동장. 지친 소영을 희민이 곁에서 부축하고, 소영은 고개를 기대 학교 쪽을 돌아본다.
// 뒤로는 새벽 하늘(남빛 → 복숭앗빛) 아래 역광 속 교사(校舍) 실루엣, 창마다 하늘빛이 비친다. 오른쪽 지붕선 너머로 해가 막 떠오른다.
// 두 사람은 힉스필드 초상화(희민 미소 · 소영 슬픔)를 그대로 넣고 따뜻한 새벽 역광 테두리를 준다. 앞쪽은 이슬 맺힌 흰 국화 덤불이
// 초상화 아랫단을 가린다. 따뜻하고 희망적인 빛.
// 이 파일의 공용 도구(hfFig · lowerGirl · lowerBoy · school · gate · mum · candyBox · rng)는 다른 엔딩 그림들이 같이 쓴다.
import * as K from '../kit.js';

const P = K.path;
const f1 = v => Math.round(v * 10) / 10;
const pt = p => `${f1(p[0])} ${f1(p[1])}`;
const ID = 'ewc';

// ---------------------------------------------------------------- 공용: 난수
export function rng(seed = 1) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ---------------------------------------------------------------- 공용: 힉스필드 초상화를 장면에 넣기
// name: assets/hf/portrait_<name>.webp. cx: 화면에서 초상화 가운데 x, top: 초상화 위끝 y, s: 배율.
// flip: 좌우 뒤집기, rot: 기울기(도, 아래 가운데 기준), grade: feColorMatrix 값(장면 색), rim: 테두리 빛 색, rimDx/rimDy: 빛이 오는 반대 방향 오프셋,
// fade: [시작, 끝] 아랫단이 사라지는 높이 비율, over: [{ fill, op, blend }] 인물 위에만 칠하는 덧색(초상화 좌표의 그라디언트를 쓰려면 gradientUnits=userSpaceOnUse),
// under: 초상화 밑에 그릴 벡터(초상화 좌표: 폭 w, 높이 h — 몸 아랫부분 등), extra: 초상화 위에 그릴 벡터(초상화 좌표).
export function hfFig(id, name, { cx, top, s, flip = false, rot = 0, grade = '0.72 0.02 0 0 0  0 0.74 0.03 0 0.004  0 0.03 0.86 0 0.03  0 0 0 1 0',
  rim = '#cfe0ff', rimDx = 4, rimDy = 3, rimOp = 0.85, rimW = 1.5, rimTo = 0.62, fade = [0.82, 0.99], over = [], under = '', extra = '', opacity = 1 } = {}) {
  const p = K.hfPortrait(name);
  const { w, h } = p;
  const img = `<use href="#${id}I"/>`;
  const R = (fill, more = '') => `<rect x="-50" y="-50" width="${w + 100}" height="${h + 100}" fill="${fill}" ${more}/>`;
  const defs = `<image id="${id}I" href="${p.uri}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"/>` +
    `<mask id="${id}A" maskUnits="userSpaceOnUse" x="-400" y="-400" width="${w + 800}" height="${h + 1600}" style="mask-type:alpha">${img}</mask>` +
    `<linearGradient id="${id}FG" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(h * fade[0])}" x2="0" y2="${f1(h * fade[1])}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="${id}F" maskUnits="userSpaceOnUse" x="-400" y="-400" width="${w + 800}" height="${h + 1600}"><rect x="-400" y="-400" width="${w + 800}" height="${h + 1600}" fill="url(#${id}FG)"/></mask>` +
    `<linearGradient id="${id}RG" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${h}"><stop offset="0" stop-color="#fff"/><stop offset="${rimTo}" stop-color="#fff" stop-opacity="0.5"/><stop offset="${Math.min(1, rimTo + 0.12)}" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="${id}RM" maskUnits="userSpaceOnUse" x="-400" y="-400" width="${w + 800}" height="${h + 1600}"><rect x="-400" y="-400" width="${w + 800}" height="${h + 1600}" fill="url(#${id}RG)"/></mask>` +
    `<filter id="${id}G" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${grade}"/></filter>` +
    `<filter id="${id}R" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
    `<feMorphology in="SourceAlpha" operator="erode" radius="${rimW}" result="er"/><feOffset in="er" dx="${rimDx}" dy="${rimDy}" result="o"/>` +
    `<feComposite in="er" in2="o" operator="out" result="r"/><feGaussianBlur in="r" stdDeviation="1.2" result="rb"/>` +
    `<feFlood flood-color="${rim}" flood-opacity="${rimOp}"/><feComposite in2="rb" operator="in"/></filter>`;
  const tf = flip ? `translate(${f1(cx + w * s / 2)} ${f1(top)}) scale(${-s} ${s})` : `translate(${f1(cx - w * s / 2)} ${f1(top)}) scale(${s})`;
  let inner = under + `<g mask="url(#${id}F)"><g filter="url(#${id}G)">${img}</g>` +
    over.map(o => `<g mask="url(#${id}A)">${R(o.fill, `opacity="${o.op ?? 1}" ${o.blend ? `style="mix-blend-mode:${o.blend}"` : ''}`)}</g>`).join('') +
    (rimOp ? `<g mask="url(#${id}RM)"><g filter="url(#${id}R)">${img}</g></g>` : '') + `</g>` + extra;
  const body = `<g transform="rotate(${rot} ${f1(cx)} ${f1(top + h * s)})" opacity="${opacity}"><g transform="${tf}">${inner}</g></g>`;
  return { defs, body, w, h };
}

// 초상화 아래 몸(초상화 좌표, 아래 단 = h, 몸 폭 12..438). 짙은 그늘 속 실루엣. legs: 다리까지 그릴지
export function lowerGirl(w, h, { coat = '#0b0d18', skirt = '#0e1020', leg = '#07080e', hair = '', line = '#020205', legs = true, rim = '', torn = false, hand = '#2a2630', cuff = '#1d2134', shirt = '', feet = false } = {}) {
  const y = v => f1(h + v);
  const C = w / 2;
  let s = '';
  if (legs) {
    const tip = feet ? 1250 : 1160;
    const leg1 = `M${C - 84} ${y(520)} C${C - 88} ${y(720)} ${C - 82} ${y(940)} ${C - 70} ${y(1140)} C${C - 66} ${y(1190)} ${C - 56} ${y(tip - 30)} ${C - 48} ${y(tip)} C${C - 38} ${y(tip - 40)} ${C - 26} ${y(1180)} ${C - 22} ${y(1140)} C${C - 18} ${y(940)} ${C - 12} ${y(720)} ${C - 8} ${y(540)} Z`;
    const leg2 = `M${C + 8} ${y(540)} C${C + 12} ${y(720)} ${C + 18} ${y(940)} ${C + 22} ${y(1140)} C${C + 26} ${y(1180)} ${C + 38} ${y(tip - 40)} ${C + 48} ${y(tip)} C${C + 56} ${y(tip - 30)} ${C + 66} ${y(1190)} ${C + 70} ${y(1140)} C${C + 82} ${y(940)} ${C + 88} ${y(720)} ${C + 84} ${y(520)} Z`;
    s += P(leg1, leg, line, 3) + P(leg2, leg, line, 3);
  }
  // 주름치마
  let hem = torn ? `L${C + 210} ${y(560)} L${C + 170} ${y(520)} L${C + 140} ${y(580)} L${C + 96} ${y(530)} L${C + 60} ${y(600)} L${C + 20} ${y(540)} L${C - 30} ${y(590)} L${C - 70} ${y(530)} L${C - 110} ${y(586)} L${C - 150} ${y(526)} L${C - 196} ${y(570)} ` : `C${C + 130} ${y(586)} ${C - 130} ${y(586)} ${C - 220} ${y(548)} `;
  s += P(`M${C - 132} ${y(270)} L${C + 132} ${y(270)} C${C + 160} ${y(370)} ${C + 190} ${y(460)} ${C + 220} ${y(548)} ${hem}C${C - 190} ${y(460)} ${C - 160} ${y(370)} ${C - 132} ${y(270)} Z`, skirt, line, 3);
  s += P(`M${C - 96} ${y(286)} L${C - 132} ${y(560)} M${C - 48} ${y(286)} L${C - 64} ${y(574)} M${C} ${y(286)} L${C + 4} ${y(580)} M${C + 46} ${y(286)} L${C + 70} ${y(576)} M${C + 92} ${y(286)} L${C + 134} ${y(566)}`, 'none', '#1a1f30', 3, 'opacity="0.75"');
  // 블레이저 아랫부분(초상화 아랫단 폭 그대로에서 허리로 좁아짐) + 몸 옆으로 늘어진 팔(소매 · 손)
  s += P(`M${C - 214} ${y(-120)} L${C + 214} ${y(-120)} C${C + 200} ${y(0)} ${C + 168} ${y(60)} ${C + 156} ${y(120)} C${C + 148} ${y(170)} ${C + 150} ${y(230)} ${C + 158} ${y(300)} C${C + 76} ${y(318)} ${C - 76} ${y(318)} ${C - 158} ${y(300)} C${C - 150} ${y(230)} ${C - 148} ${y(170)} ${C - 156} ${y(120)} C${C - 168} ${y(60)} ${C - 200} ${y(0)} ${C - 214} ${y(-120)} Z`, coat, line, 3);
  for (const sd of [-1, 1]) {
    const X = v => f1(C + sd * v);
    s += P(`M${X(214)} ${y(-140)} L${X(150)} ${y(-140)} C${X(156)} ${y(0)} ${X(160)} ${y(140)} ${X(168)} ${y(270)} L${X(214)} ${y(266)} C${X(222)} ${y(120)} ${X(224)} ${y(0)} ${X(214)} ${y(-140)} Z`, coat, line, 3);
    s += P(`M${X(168)} ${y(270)} L${X(214)} ${y(266)} L${X(212)} ${y(286)} L${X(170)} ${y(290)} Z`, cuff, line, 2);
    s += P(`M${X(172)} ${y(290)} C${X(170)} ${y(320)} ${X(176)} ${y(350)} ${X(190)} ${y(356)} C${X(204)} ${y(352)} ${X(212)} ${y(320)} ${X(210)} ${y(288)} Z`, hand, line, 2);
  }
  if (shirt) s += P(`M${C - 56} ${y(-130)} L${C + 56} ${y(-130)} L${C + 6} ${y(110)} L${C - 6} ${y(110)} Z`, shirt, line, 2);
  s += P(`M${C} ${y(shirt ? 110 : -40)} L${C} ${y(312)}`, 'none', '#161a2c', 3);
  if (torn) s += P(`M${C - 120} ${y(40)} L${C - 90} ${y(90)} L${C - 110} ${y(140)} M${C + 100} ${y(160)} L${C + 130} ${y(220)} L${C + 110} ${y(290)}`, 'none', '#000', 3, 'opacity="0.8"');
  if (hair) {
    s += P(`M${C - 190} ${y(-170)} L${C - 110} ${y(-170)} C${C - 98} ${y(-60)} ${C - 102} ${y(20)} ${C - 108} ${y(80)} C${C - 114} ${y(140)} ${C - 112} ${y(180)} ${C - 106} ${y(220)} C${C - 130} ${y(200)} ${C - 150} ${y(150)} ${C - 164} ${y(80)} C${C - 176} ${y(10)} ${C - 180} ${y(-80)} ${C - 180} ${y(-170)} Z`, hair, line, 2);
    s += P(`M${C + 180} ${y(-170)} L${C + 100} ${y(-170)} C${C + 98} ${y(-60)} ${C + 102} ${y(20)} ${C + 108} ${y(80)} C${C + 114} ${y(140)} ${C + 112} ${y(180)} ${C + 106} ${y(220)} C${C + 130} ${y(200)} ${C + 150} ${y(150)} ${C + 164} ${y(80)} C${C + 176} ${y(10)} ${C + 180} ${y(-80)} ${C + 180} ${y(-170)} Z`, hair, line, 2);
  }
  if (rim) s += P(`M${C - 216} ${y(256)} C${C - 222} ${y(100)} ${C - 218} ${y(-40)} ${C - 200} ${y(-170)} M${C - 220} ${y(548)} C${C - 190} ${y(460)} ${C - 160} ${y(370)} ${C - 132} ${y(270)}`, 'none', rim, 3, 'opacity="0.5"');
  return s;
}
export function lowerBoy(w, h, { coat = '#0b0d18', pants = '#0c0d14', line = '#020205', rim = '' } = {}) {
  const y = v => f1(h + v);
  const C = w / 2;
  let s = '';
  s += P(`M${C - 130} ${y(280)} L${C + 130} ${y(280)} L${C + 120} ${y(1170)} L${C + 20} ${y(1170)} L${C} ${y(420)} L${C - 20} ${y(1170)} L${C - 120} ${y(1170)} Z`, pants, line, 3);
  s += P(`M${C - 216} ${y(-140)} L${C + 216} ${y(-140)} C${C + 204} ${y(0)} ${C + 178} ${y(120)} ${C + 172} ${y(330)} C${C + 80} ${y(344)} ${C - 80} ${y(344)} ${C - 172} ${y(330)} C${C - 178} ${y(120)} ${C - 204} ${y(0)} ${C - 216} ${y(-140)} Z`, coat, line, 3);
  for (const sd of [-1, 1]) {
    const X = v => f1(C + sd * v);
    s += P(`M${X(216)} ${y(-160)} L${X(160)} ${y(-160)} C${X(168)} ${y(20)} ${X(174)} ${y(180)} ${X(180)} ${y(320)} L${X(230)} ${y(316)} C${X(234)} ${y(140)} ${X(230)} ${y(-20)} ${X(216)} ${y(-160)} Z`, coat, line, 3);
    s += P(`M${X(182)} ${y(320)} C${X(180)} ${y(356)} ${X(188)} ${y(384)} ${X(204)} ${y(388)} C${X(222)} ${y(384)} ${X(230)} ${y(350)} ${X(228)} ${y(318)} Z`, '#2a2630', line, 2);
  }
  s += P(`M${C} ${y(-60)} L${C} ${y(336)}`, 'none', '#161a2c', 3);
  if (rim) s += P(`M${C + 230} ${y(296)} C${C + 234} ${y(120)} ${C + 230} ${y(-60)} ${C + 212} ${y(-200)}`, 'none', rim, 3, 'opacity="0.5"');
  return s;
}

// ---------------------------------------------------------------- 공용: 교사(4층, 가운데 계단탑) — 화면 좌표, 정면에서 조금 비껴 본 모습
// x0..x1: 건물 좌우, base: 바닥선, fh: 층 높이, opts: wall 색, win(창 유리 색 함수 i,j → 색), line, roof
export function school(x0, x1, base, fh, { wall = '#1a2238', wallHi = '#232c46', win = () => '#3a4a6e', frame = '#0c111e', line = '#05070d', floors = 4, tower = true, door = '#06080d' } = {}) {
  let s = '';
  const top = base - fh * floors;
  const mid = (x0 + x1) / 2, tw = (x1 - x0) * 0.12;
  s += P(`M${f1(x0)} ${f1(base)} L${f1(x0)} ${f1(top)} L${f1(x1)} ${f1(top)} L${f1(x1)} ${f1(base)} Z`, wall, line, 2);
  // 층 띠(슬래브)
  let g = '';
  for (let k = 1; k <= floors; k++) g += `M${f1(x0)} ${f1(base - fh * k + 3)} L${f1(x1)} ${f1(base - fh * k + 3)} `;
  s += P(g, 'none', wallHi, 4, 'opacity="0.8"');
  // 창
  const ww = fh * 0.62, wh = fh * 0.52, gap = fh * 0.2;
  let i = 0;
  for (let k = 0; k < floors; k++) {
    const wy = base - fh * (k + 1) + fh * 0.26;
    let j = 0;
    for (let x = x0 + gap; x + ww < x1 - gap; x += ww + gap, j++) {
      if (tower && Math.abs(x + ww / 2 - mid) < tw / 2 + ww * 0.5) continue;
      s += `<rect x="${f1(x)}" y="${f1(wy)}" width="${f1(ww)}" height="${f1(wh)}" fill="${win(k, j, x, wy, ww, wh)}" stroke="${frame}" stroke-width="2"/>`;
      s += P(`M${f1(x + ww / 2)} ${f1(wy)} L${f1(x + ww / 2)} ${f1(wy + wh)}`, 'none', frame, 2);
      i++;
    }
  }
  // 옥상 난간
  s += P(`M${f1(x0 - 4)} ${f1(top)} L${f1(x1 + 4)} ${f1(top)} L${f1(x1 + 4)} ${f1(top - fh * 0.12)} L${f1(x0 - 4)} ${f1(top - fh * 0.12)} Z`, wallHi, line, 2);
  if (tower) {
    const tt = top - fh * 0.9;
    s += P(`M${f1(mid - tw / 2)} ${f1(base)} L${f1(mid - tw / 2)} ${f1(tt)} L${f1(mid + tw / 2)} ${f1(tt)} L${f1(mid + tw / 2)} ${f1(base)} Z`, wallHi, line, 2);
    s += `<circle cx="${f1(mid)}" cy="${f1(tt + fh * 0.5)}" r="${f1(fh * 0.28)}" fill="#cfd3dc" stroke="${line}" stroke-width="2" opacity="0.85"/>`;
    s += P(`M${f1(mid)} ${f1(tt + fh * 0.5)} L${f1(mid)} ${f1(tt + fh * 0.32)} M${f1(mid)} ${f1(tt + fh * 0.5)} L${f1(mid + fh * 0.12)} ${f1(tt + fh * 0.56)}`, 'none', line, 2);
    // 계단탑 세로 창
    for (let k = 0; k < floors; k++) s += `<rect x="${f1(mid - tw * 0.18)}" y="${f1(base - fh * (k + 1) + fh * 0.18)}" width="${f1(tw * 0.36)}" height="${f1(fh * 0.66)}" fill="${win(k, -1, mid, 0, 0, 0)}" stroke="${frame}" stroke-width="2"/>`;
    // 현관(유리문 + 차양)
    s += P(`M${f1(mid - tw * 0.8)} ${f1(base - fh * 0.82)} L${f1(mid + tw * 0.8)} ${f1(base - fh * 0.82)} L${f1(mid + tw * 0.9)} ${f1(base - fh * 0.7)} L${f1(mid - tw * 0.9)} ${f1(base - fh * 0.7)} Z`, wallHi, line, 2);
    s += `<rect x="${f1(mid - tw * 0.38)}" y="${f1(base - fh * 0.7)}" width="${f1(tw * 0.76)}" height="${f1(fh * 0.7)}" fill="${door}" stroke="${frame}" stroke-width="2"/>`;
    s += P(`M${f1(mid)} ${f1(base - fh * 0.7)} L${f1(mid)} ${f1(base)}`, 'none', frame, 2);
  }
  return s;
}

// ---------------------------------------------------------------- 공용: 국화 한 송이(가운데 cx,cy · 반지름 r) — 안으로 말린 가는 꽃잎 여러 겹
export function mum(cx, cy, r, { petal = '#f4f1ea', shade = '#b9b4c8', line = '#4a4658', center = '#d8cf9a', rot = 0, tilt = 0.72, seed = 3 } = {}) {
  const rnd = rng(seed);
  let s = '';
  const layers = [[1, 22], [0.82, 18], [0.62, 14], [0.42, 10]];
  for (const [k, n] of layers) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rot + rnd() * 0.2 + k;
      const L = r * k * (0.9 + rnd() * 0.15), W = r * 0.11 * (0.8 + k * 0.4);
      const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L * tilt;
      const nx = -Math.sin(a) * W, ny = Math.cos(a) * W * tilt;
      const back = Math.sin(a) < -0.2; // 위쪽(먼 쪽) 꽃잎은 그늘
      s += P(`M${f1(cx + nx * 0.4)} ${f1(cy + ny * 0.4)} Q${f1((cx + ex) / 2 + nx * 1.4)} ${f1((cy + ey) / 2 + ny * 1.4)} ${f1(ex)} ${f1(ey)} Q${f1((cx + ex) / 2 - nx * 1.4)} ${f1((cy + ey) / 2 - ny * 1.4)} ${f1(cx - nx * 0.4)} ${f1(cy - ny * 0.4)} Z`,
        back && k > 0.5 ? shade : petal, line, 1.3);
    }
  }
  s += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r * 0.16)}" ry="${f1(r * 0.16 * tilt)}" fill="${center}" stroke="${line}" stroke-width="1.2"/>`;
  return s;
}
// 잎(톱니 진 국화잎 / 일반 잎)
export function leaf(x, y, len, ang, { fill = '#1f3a2a', line = '#0a140e', vein = '#4a6a52', wid = 0.38 } = {}) {
  const a = ang * Math.PI / 180, ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
  const nx = -Math.sin(a) * len * wid, ny = Math.cos(a) * len * wid;
  return P(`M${f1(x)} ${f1(y)} C${f1(x + (ex - x) * 0.3 + nx)} ${f1(y + (ey - y) * 0.3 + ny)} ${f1(x + (ex - x) * 0.75 + nx * 0.6)} ${f1(y + (ey - y) * 0.75 + ny * 0.6)} ${f1(ex)} ${f1(ey)} C${f1(x + (ex - x) * 0.75 - nx * 0.6)} ${f1(y + (ey - y) * 0.75 - ny * 0.6)} ${f1(x + (ex - x) * 0.3 - nx)} ${f1(y + (ey - y) * 0.3 - ny)} ${f1(x)} ${f1(y)} Z`, fill, line, 1.5) +
    P(`M${f1(x)} ${f1(y)} L${f1(ex)} ${f1(ey)}`, 'none', vein, 1.2, 'opacity="0.7"');
}

// ---------------------------------------------------------------- 공용: 리본 맨 사탕 상자(화면 좌표, 가운데 cx,cy · 폭 w, 살짝 기울임 rot) — 연한 하늘색 상자 + 빨간 리본
export function candyBox(cx, cy, w, { rot = 0, box = '#cdd6f0', side = '#9ea9d0', top = '#e6ebfa', rib = '#d2384c', ribD = '#97202f', line = '#38406a', dim = 1, open = false } = {}) {
  const h = w * 0.62, d = w * 0.28;
  let s = '';
  // 앞면 · 윗면 · 옆면(약간 위에서 본 상자)
  s += P(`M${-w / 2} ${-h / 2 + d * 0.5} L${w / 2} ${-h / 2 + d * 0.5} L${w / 2} ${h / 2} L${-w / 2} ${h / 2} Z`, box, line, 2.5);
  s += P(`M${-w / 2} ${-h / 2 + d * 0.5} L${-w / 2 + d * 0.6} ${-h / 2} L${w / 2 + d * 0.6} ${-h / 2} L${w / 2} ${-h / 2 + d * 0.5} Z`, top, line, 2.5);
  s += P(`M${w / 2} ${-h / 2 + d * 0.5} L${w / 2 + d * 0.6} ${-h / 2} L${w / 2 + d * 0.6} ${h / 2 - d * 0.5} L${w / 2} ${h / 2} Z`, side, line, 2.5);
  // 리본 띠(세로·가로) + 나비 매듭
  s += P(`M${-w * 0.06} ${-h / 2 + d * 0.5} L${w * 0.06} ${-h / 2 + d * 0.5} L${w * 0.06} ${h / 2} L${-w * 0.06} ${h / 2} Z`, rib, line, 1.5);
  s += P(`M${-w / 2} ${f1(h * 0.06)} L${w / 2} ${f1(h * 0.06)} L${w / 2} ${f1(h * 0.18)} L${-w / 2} ${f1(h * 0.18)} Z`, rib, line, 1.5);
  s += P(`M${-w * 0.06 + d * 0.3} ${-h / 2 + d * 0.25} L${w * 0.06 + d * 0.3} ${-h / 2 + d * 0.25}`, 'none', ribD, w * 0.1);
  const by = -h / 2 + d * 0.2, bx = d * 0.3;
  s += P(`M${f1(bx)} ${f1(by)} C${f1(bx - w * 0.12)} ${f1(by - w * 0.22)} ${f1(bx - w * 0.3)} ${f1(by - w * 0.1)} ${f1(bx - w * 0.2)} ${f1(by + w * 0.02)} Z`, rib, line, 2);
  s += P(`M${f1(bx)} ${f1(by)} C${f1(bx + w * 0.12)} ${f1(by - w * 0.22)} ${f1(bx + w * 0.3)} ${f1(by - w * 0.1)} ${f1(bx + w * 0.2)} ${f1(by + w * 0.02)} Z`, rib, line, 2);
  s += P(`M${f1(bx - w * 0.02)} ${f1(by)} L${f1(bx - w * 0.12)} ${f1(by + w * 0.16)} M${f1(bx + w * 0.02)} ${f1(by)} L${f1(bx + w * 0.14)} ${f1(by + w * 0.15)}`, 'none', ribD, w * 0.035);
  s += `<ellipse cx="${f1(bx)}" cy="${f1(by)}" rx="${f1(w * 0.05)}" ry="${f1(w * 0.04)}" fill="${ribD}" stroke="${line}" stroke-width="1.5"/>`;
  s += P(`M${-w / 2 + 4} ${-h / 2 + d * 0.5 + 6} L${-w / 2 + 4} ${h / 2 - 6}`, 'none', '#fff', 2, 'opacity="0.4"');
  void open;
  return `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${rot})" ${dim !== 1 ? `opacity="${dim}"` : ''}>${s}</g>`;
}

// ---------------------------------------------------------------- 이 그림
const SKY_H = 860;
function sky() {
  let s = `<rect width="1024" height="${SKY_H + 40}" fill="url(#${ID}sky)"/>`;
  // 떠오르는 해(오른쪽 지붕선 너머) + 햇무리
  s += `<circle cx="940" cy="${SKY_H - 250}" r="300" fill="#ffd9a8" opacity="0.5" filter="url(#${ID}b40)"/>`;
  s += `<circle cx="950" cy="${SKY_H - 236}" r="44" fill="#fff6e2"/>`;
  // 엷은 새벽 구름 띠
  const rnd = rng(5);
  let c = '';
  for (let i = 0; i < 9; i++) {
    const x = rnd() * 1100 - 40, y = 140 + rnd() * 400, w = 140 + rnd() * 260;
    c += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(w)}" ry="${f1(10 + rnd() * 14)}" fill="${y < 320 ? '#8d8fb6' : '#f0b9a0'}" opacity="${f1(0.25 + rnd() * 0.25)}"/>`;
  }
  s += `<g filter="url(#${ID}b6)">${c}</g>`;
  return s;
}
function ground() {
  let s = '';
  // 멀리 나무(역광 실루엣)
  const rnd = rng(9);
  let t = '';
  for (let x = -40; x < 1080; x += 34) {
    if (x > 120 && x < 900) continue;
    const h = 120 + rnd() * 80;
    t += `<ellipse cx="${f1(x)}" cy="${f1(SKY_H - 260 - h * 0.4)}" rx="${f1(40 + rnd() * 20)}" ry="${f1(h * 0.6)}" fill="#1e2238"/>`;
  }
  s += t;
  // 교사(역광, 창에 새벽 하늘이 비침)
  s += `<g filter="url(#${ID}far)">` + school(120, 900, SKY_H - 180, 74, {
    wall: '#232a44', wallHi: '#2e3654', frame: '#141a2c', line: '#0b0f1c',
    win: (k, j) => (j % 5 === 2 ? '#d9a99a' : k > 1 ? '#8d93ba' : '#6a7298'), door: '#151a2a',
  }) + '</g>';
  // 운동장(흙) + 트랙 선 + 이슬 빛
  s += `<path d="M0 ${SKY_H - 186} L1024 ${SKY_H - 186} L1024 1536 L0 1536 Z" fill="url(#${ID}field)"/>`;
  s += P(`M-40 ${SKY_H - 120} C300 ${SKY_H - 150} 700 ${SKY_H - 150} 1060 ${SKY_H - 110} M-40 ${SKY_H - 60} C300 ${SKY_H - 96} 700 ${SKY_H - 96} 1060 ${SKY_H - 50}`, 'none', '#e8d8c8', 3, 'opacity="0.35"');
  // 축구 골대(왼쪽 멀리)
  s += P(`M60 ${SKY_H - 186} L60 ${SKY_H - 236} L190 ${SKY_H - 236} L190 ${SKY_H - 186}`, 'none', '#d8d4dc', 3, 'opacity="0.7"');
  // 해에서 이쪽으로 길게 늘어진 빛 띠
  s += `<path d="M950 ${SKY_H - 186} L1024 ${SKY_H + 300} L540 ${SKY_H + 300} Z" fill="#ffd7a8" opacity="0.12" filter="url(#${ID}b40)"/>`;
  return s;
}
// 앞쪽 흰 국화 덤불
function mums() {
  let s = '';
  const rnd = rng(21);
  // 잎 덤불
  s += `<path d="M-20 1536 L-20 1150 C120 1080 260 1130 380 1100 C520 1060 660 1090 780 1060 C900 1040 980 1060 1044 1040 L1044 1536 Z" fill="#0b1410" filter="url(#${ID}b6)"/>`;
  for (let i = 0; i < 110; i++) {
    const x = rnd() * 1100 - 40, y = 1080 + rnd() * 460;
    s += leaf(x, y, 50 + rnd() * 60, -150 + rnd() * 120, { fill: rnd() < 0.5 ? '#17251f' : '#1f3129', line: '#060c09', vein: '#465e50' });
  }
  const flowers = [[90, 1290, 84], [270, 1390, 104], [470, 1320, 82], [650, 1420, 110], [840, 1310, 90], [980, 1420, 96], [-10, 1470, 90], [380, 1500, 86], [560, 1210, 62], [760, 1190, 60], [170, 1180, 64], [930, 1170, 66], [360, 1150, 52], [640, 1110, 46], [60, 1110, 50], [1000, 1080, 48], [820, 1490, 92], [140, 1520, 80]];
  flowers.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of flowers) {
    s += `<ellipse cx="${x}" cy="${y + r * 0.25}" rx="${r}" ry="${r * 0.4}" fill="#000" opacity="0.25" filter="url(#${ID}b6)"/>`;
    s += mum(x, y, r, { seed: x + y, rot: rnd() * 3, petal: '#f6f1ea', shade: '#c6bccd', line: '#5e5668', center: '#e2d49a' });
    // 이슬(햇빛 반짝임)
    s += `<circle cx="${f1(x - r * 0.3)}" cy="${f1(y - r * 0.25)}" r="3" fill="#fff" opacity="0.9"/>`;
  }
  return s;
}

export function draw() {
  // 소영(왼쪽, 희민 어깨 쪽으로 머리를 기울임) · 희민(오른쪽, 조금 뒤)
  const warmGrade = '0.84 0.04 0 0 0.02  0.02 0.76 0.02 0 0.01  0 0.03 0.8 0 0.03  0 0 0 1 0';
  const hm = hfFig(`${ID}h`, 'heemin_smile', {
    cx: 640, top: 336, s: 1.22, rot: -2, grade: warmGrade, rim: '#ffd6a6', rimDx: -5, rimDy: 4, rimOp: 0.95, fade: [0.8, 0.98],
    over: [{ fill: `url(#${ID}hShade)` }],
    under: lowerBoy(452, 654, { coat: '#141a30', pants: '#0e1018' }),
  });
  const so = hfFig(`${ID}s`, 'soyoung_sad', {
    cx: 372, top: 404, s: 1.2, rot: 7, grade: warmGrade, rim: '#ffd6a6', rimDx: -4, rimDy: 4, rimOp: 0.9, fade: [0.8, 0.98],
    over: [{ fill: `url(#${ID}sShade)` }],
    under: lowerGirl(446, 636, { coat: '#141a30', skirt: '#141628', hair: '#07070c' }),
  });
  const defs = hm.defs + so.defs +
    `<filter id="${ID}b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>` +
    `<filter id="${ID}b40" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="40"/></filter>` +
    `<filter id="${ID}far" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="1.2"/></filter>` +
    `<linearGradient id="${ID}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262c52"/><stop offset="0.25" stop-color="#5a5f8e"/><stop offset="0.5" stop-color="#c4919c"/><stop offset="0.68" stop-color="#f4b890"/><stop offset="0.8" stop-color="#ffdcae"/><stop offset="1" stop-color="#ffe6c0"/></linearGradient>` +
    `<linearGradient id="${ID}field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7470"/><stop offset="0.25" stop-color="#5a4a52"/><stop offset="1" stop-color="#1e1a24"/></linearGradient>` +
    // 인물 덧색: 해(오른쪽 뒤) 반대쪽 앞면은 조금 차갑고 어둡게
    `<linearGradient id="${ID}hShade" gradientUnits="userSpaceOnUse" x1="452" y1="0" x2="0" y2="654"><stop offset="0" stop-color="#2a2440" stop-opacity="0"/><stop offset="1" stop-color="#2a2440" stop-opacity="0.35"/></linearGradient>` +
    `<linearGradient id="${ID}sShade" gradientUnits="userSpaceOnUse" x1="446" y1="0" x2="0" y2="636"><stop offset="0" stop-color="#2a2440" stop-opacity="0"/><stop offset="1" stop-color="#2a2440" stop-opacity="0.4"/></linearGradient>` +
    `<radialGradient id="${ID}sun" cx="950" cy="${SKY_H - 236}" r="900" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe0b0" stop-opacity="0.4"/><stop offset="0.5" stop-color="#ffb890" stop-opacity="0.12"/><stop offset="1" stop-color="#ffb890" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${ID}vig" cx="512" cy="760" r="960" gradientUnits="userSpaceOnUse"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="0.85" stop-color="#0a0614" stop-opacity="0.45"/><stop offset="1" stop-color="#0a0614" stop-opacity="0.8"/></radialGradient>`;
  let s = sky() + ground();
  s += hm.body + so.body;
  s += `<rect width="1024" height="1536" fill="url(#${ID}sun)" style="mix-blend-mode:screen"/>`;
  s += mums();
  // 바람에 날리는 흰 꽃잎 몇 장
  const rnd = rng(77);
  for (let i = 0; i < 14; i++) {
    const x = rnd() * 1024, y = 300 + rnd() * 900, a = rnd() * 180;
    s += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="9" ry="3" fill="#fbf6ee" opacity="${f1(0.5 + rnd() * 0.4)}" transform="rotate(${f1(a)} ${f1(x)} ${f1(y)})"/>`;
  }
  s += `<rect width="1024" height="1536" fill="url(#${ID}vig)"/>`;
  return K.svg(s, { defs });
}
