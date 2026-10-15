// 그래픽 필터(WebGL 후처리): 10종 모두 컴파일·그리기, 필터마다 의도한 모양, 게임 화면에만 걸림(UI 위), WebGL이 없거나 잃으면 필터 없이 동작
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const start = async page => {
  await page.waitForSelector('.title-btn');
  await page.waitForTimeout(300);
  await page.locator('.title-btn').first().dispatchEvent('pointerdown');
  await skipDialogs(page);
};
const { browser, page, errors } = await openMobile();
await start(page);
check('WebGL 사용 가능(필터 지원)', await page.evaluate(() => __fx.supported));

// 게임 화면 대신 시험 그림(밝기 계단 + 색 띠 + 체크무늬)을 올려 필터 결과를 읽는다
const shot = (id, t = 1.25) => page.evaluate(([id, t]) => {
  const g = __game, fx = __fx, c = g.canvas, x = g.ctx, W = c.width, H = c.height;
  g.render(0);
  x.setTransform(1, 0, 0, 1, 0, 0);
  const cols = ['#ff3030', '#30ff30', '#3060ff', '#ffd040', '#ffffff', '#808080', '#202020', '#000000'];
  for (let i = 0; i < 8; i++) { x.fillStyle = cols[i]; x.fillRect(i * W / 8, 0, W / 8 + 1, H / 2); }
  for (let i = 0; i < 16; i++) { const v = Math.round(i * 17); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(i * W / 16, H / 2, W / 16 + 1, H / 4); }
  const s = Math.max(2, Math.round(g.view.px));
  for (let yy = Math.floor(H * 3 / 4); yy < H; yy += s) for (let xx = 0; xx < W; xx += s) { x.fillStyle = (Math.floor(xx / s) + Math.floor(yy / s)) % 2 ? '#e0e0e0' : '#303030'; x.fillRect(xx, yy, s, s); }
  const src = x.getImageData(0, 0, W, H).data;
  const prev = fx.id;
  fx.set(id);
  const t0 = performance.now();
  fx.render(g.view, t);
  const gl = fx.gl;
  const out = new Uint8Array(W * H * 4);
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, out);
  const ms = performance.now() - t0;
  const err = gl.getError();
  fx.set(prev);
  // 표본: 격자로 2000점. out은 아래부터라 뒤집어 비교
  const N = 2000, pts = [];
  for (let i = 0; i < N; i++) {
    const px = Math.floor(((i * 37) % 97) / 97 * W), py = Math.floor(((i * 61) % 89) / 89 * H);
    const a = (py * W + px) * 4, b = ((H - 1 - py) * W + px) * 4;
    pts.push([src[a], src[a + 1], src[a + 2], out[b], out[b + 1], out[b + 2], px / W, py / H]);
  }
  // 경계 대비: 옆 픽셀과의 밝기 차(체크무늬 구역) — 선명은 커지고 부드럽게는 작아진다
  let eS = 0, eO = 0;
  for (let yy = Math.floor(H * 0.8); yy < H * 0.95; yy += 3) for (let xx = 0; xx < W - 1; xx++) {
    const a = (yy * W + xx) * 4, b = ((H - 1 - yy) * W + xx) * 4;
    eS += Math.abs(src[a] - src[a + 4]); eO += Math.abs(out[b] - out[b + 4]);
  }
  let diff = 0, gray = 0, warm = 0, satS = 0, satO = 0;
  const pal = new Set();
  for (const [r, g2, b, R, G, B] of pts) {
    diff += (Math.abs(r - R) + Math.abs(g2 - G) + Math.abs(b - B)) / 3;
    gray = Math.max(gray, Math.max(Math.abs(R - G), Math.abs(G - B)));
    if (R + G + B > 60) warm += (R >= G - 2 && G >= B - 2) ? 1 : 0;
    satS += Math.max(r, g2, b) - Math.min(r, g2, b); satO += Math.max(R, G, B) - Math.min(R, G, B);
    pal.add(`${R},${G},${B}`);
  }
  const bright = pts.filter(p => p[3] + p[4] + p[5] > 60).length;
  const corner = (() => { const b = ((H - 1) * W) * 4; return out[b] + out[b + 1] + out[b + 2]; })(); // 왼쪽 위 모서리
  let hash = 0;
  for (let i = 0; i < out.length; i += 4093) hash = (hash * 31 + out[i]) >>> 0;
  return { hash, edge: +(eO / Math.max(1, eS)).toFixed(2), diff: +(diff / N).toFixed(1), gray, warm: +(warm / Math.max(1, bright)).toFixed(2), sat: +(satO / Math.max(1, satS)).toFixed(2), pal: pal.size, corner, ms: +ms.toFixed(1), err };
}, [id, t]);

const FILTERS = await page.evaluate(async () => (await import('./js/filters.js')).FILTERS.map(f => f.id));
check('필터 목록: 끄기 + 10종', FILTERS.length === 11 && FILTERS[0] === 'off', FILTERS.join(','));
const R = {};
for (const id of FILTERS.slice(1)) {
  R[id] = await shot(id);
  check(`${id}: 컴파일·그리기 오류 없음, 원본과 다름`, R[id].err === 0 && R[id].diff > 3, JSON.stringify(R[id]));
}
check('흑백(noir): 색이 없음', R.noir.gray <= 2, String(R.noir.gray));
check('세피아: 따뜻한 갈색 톤(R ≥ G ≥ B)', R.sepia.warm > 0.95, String(R.sepia.warm));
check('게임보이: 초록 4색만', R.dmg.pal <= 4, String(R.dmg.pal));
check('생생: 채도 높아짐', R.vivid.sat > 1.05, String(R.vivid.sat));
check('CRT: 화면이 볼록해 모서리는 검정', R.crt.corner === 0, String(R.crt.corner));
check('선명: 경계가 더 또렷 / 부드럽게: 경계가 덜 또렷', R.sharp.edge > 1.05 && R.smooth.edge < 0.95, `${R.sharp.edge} / ${R.smooth.edge}`);
// 오래 켜 둬도(시간 값이 커져도) 같은 그림: 셰이더에 넘기는 시간은 600초마다 되돌아간다(16비트 GPU에서 잡음·줄무늬 깨짐 방지)
for (const id of ['vhs', 'sepia', 'noir']) {
  const late = await shot(id, 36001.25);
  check(`${id}: 10시간 뒤에도 같은 그림(시간 값 되돌림)`, late.hash === R[id].hash && late.err === 0, `${R[id].hash} / ${late.hash}`);
}
console.log('INFO  필터 1프레임 시간(소프트웨어 WebGL, 실기기는 GPU로 훨씬 빠름): ' + FILTERS.slice(1).map(id => `${id} ${R[id].ms}ms`).join(', '));

// 실제 루프에서 켜기: 2D 캔버스는 숨기고 #fx 보임, UI(#ui)는 그 위, 끄면 원래대로
const state = () => page.evaluate(() => ({
  on: document.getElementById('app').classList.contains('fx-on'),
  game: getComputedStyle(document.getElementById('game')).opacity,
  fx: getComputedStyle(document.getElementById('fx')).display,
  uiAbove: !!(document.getElementById('fx').compareDocumentPosition(document.getElementById('ui')) & Node.DOCUMENT_POSITION_FOLLOWING),
  touchThrough: getComputedStyle(document.getElementById('fx')).pointerEvents === 'none',
  size: [__fx.cv.width, __fx.cv.height, __game.canvas.width, __game.canvas.height],
}));
await page.evaluate(() => __fx.set('crt'));
await page.waitForTimeout(300);
const on = await state();
check('켜면 WebGL 화면으로 바꿔 보여 줌', on.on && on.game === '0' && on.fx === 'block', JSON.stringify(on));
check('UI(대사·메뉴·버튼)는 필터 위(필터가 안 걸림), 터치는 통과', on.uiAbove && on.touchThrough);
check('필터 캔버스 크기 = 게임 캔버스', on.size[0] === on.size[2] && on.size[1] === on.size[3], JSON.stringify(on.size));
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(400);
const rot = await state();
check('돌려도(가로) 필터 캔버스가 따라감', rot.size[0] === rot.size[2] && rot.size[1] === rot.size[3] && rot.size[0] > rot.size[1], JSON.stringify(rot.size));
await page.setViewportSize({ width: 390, height: 664 });
await page.waitForTimeout(300);
const t0 = await page.evaluate(() => __game.t);
await page.waitForTimeout(500);
check('필터 켠 채로 게임 진행', (await page.evaluate(() => __game.t)) > t0);
await page.evaluate(() => __fx.set('nope'));
check('없는 필터 id는 끄기', (await page.evaluate(() => __fx.id)) === 'off' && !(await state()).on);

// WebGL을 잃으면(백그라운드·메모리 부족) 필터 없이 계속
await page.evaluate(() => __fx.set('vhs'));
await page.evaluate(() => { window.__lc = __fx.gl.getExtension('WEBGL_lose_context'); __lc.loseContext(); });
await page.waitForTimeout(400);
const lost = await state();
check('WebGL 잃으면 필터 끄고 원래 화면', !lost.on && lost.game === '1' && (await page.evaluate(() => __fx.id === 'off' && !__fx.supported)), JSON.stringify(lost));
const t1 = await page.evaluate(() => __game.t);
await page.waitForTimeout(400);
check('WebGL 잃은 뒤에도 게임 진행', (await page.evaluate(() => __game.t)) > t1);
await page.evaluate(() => __lc.restoreContext());
await page.waitForTimeout(400);
const back = await state();
check('WebGL이 돌아오면 고른 필터(VHS)로 다시', back.on && back.game === '0' && (await page.evaluate(() => __fx.id === 'vhs' && __fx.supported)), JSON.stringify(back));
const re = await shot('crt');
check('되살린 뒤에도 필터 그리기 정상', re.err === 0 && re.diff > 3, JSON.stringify(re));
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();

// WebGL이 없는 기기: 저장된 필터가 있어도 원래 화면, 옵션에 안내
const noGL = () => {
  localStorage.setItem('wd_topview_settings_v1', JSON.stringify({ filter: 'crt' }));
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : orig.call(this, t, ...a); };
};
const N = await openMobile({ init: noGL });
await start(N.page);
const ng = await N.page.evaluate(() => ({ sup: __fx.supported, id: __fx.id, on: document.getElementById('app').classList.contains('fx-on'), game: getComputedStyle(document.getElementById('game')).opacity }));
check('WebGL 없음: 저장된 필터가 있어도 원래 화면', !ng.sup && ng.id === 'off' && !ng.on && ng.game === '1', JSON.stringify(ng));
await N.page.locator('.btn-menu').dispatchEvent('pointerdown');
await N.page.waitForSelector('.phone-app');
await N.page.waitForTimeout(300);
await N.page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
await N.page.waitForSelector('.opt-filter');
check('WebGL 없음: 옵션에 사용 불가 안내', (await N.page.locator('.menu-layer').textContent()).includes('그래픽 필터를 쓸 수 없다'));
check('WebGL 없음: 콘솔 오류 없음', N.errors.length === 0, N.errors.slice(0, 3).join(' | '));
await N.browser.close();

const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
