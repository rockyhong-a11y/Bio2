// 전체 지도: HUD 지도 버튼·휴대폰 '지도' 앱·Q 키·패드 Back 으로 열고 닫기,
// 탐색한 방은 밝게 / 미탐색은 어둡게 / 잠긴 문은 빨간 선(캔버스 픽셀로 확인), 다른 층은 들어가 본 곳만, 탐색 기록은 저장에 포함
import { openMobile, skipDialogs } from './helpers.mjs';
import * as story from '../data/story.js';
import { rooms, MAP_COLORS } from '../js/mapview.js';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

// ---- 데이터: 문과 방 나누기
const bad = [];
for (const def of Object.values(story.maps)) {
  const R = rooms(def);
  const at = (c, r) => (c < 0 || r < 0 || c >= R.cols || r >= R.rows ? -1 : R.id[r * R.cols + c]);
  const doorAt = new Set((def.doors || []).map(d => `${d.x},${d.y}`));
  def.grid.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'D' && !doorAt.has(`${c},${r}`)) bad.push(`${def.id} ${c},${r} 문 정의 없음`); }));
  for (const d of def.doors || []) {
    if (def.grid[d.y][d.x] !== 'D') { bad.push(`${def.id} ${d.x},${d.y} 문 칸이 아님`); continue; }
    const vertical = '#Ww'.includes(R.ch(d.x, d.y - 1)) && '#Ww'.includes(R.ch(d.x, d.y + 1));
    const [a, b] = vertical ? [at(d.x - 1, d.y), at(d.x + 1, d.y)] : [at(d.x, d.y - 1), at(d.x, d.y + 1)];
    if (a === b) bad.push(`${def.id} ${d.x},${d.y} 문 양쪽이 같은 방`);
  }
}
check('모든 문 칸에 문 정의가 있고, 문이 서로 다른 방(또는 바깥)을 나눈다', !bad.length, bad.slice(0, 5).join(' | '));
const R1 = rooms(story.maps.main1f);
const room1 = (c, r) => R1.id[r * R1.cols + c];
check('방 나누기: 교실 안은 한 방, 화장실 칸은 화장실, 유리문 양쪽 복도는 다른 방',
  room1(12, 3) === room1(18, 7) && room1(30, 17) === room1(32, 14) && room1(5, 10) !== room1(35, 10) && room1(5, 10) >= 0);

// ---- 화면
const fakePad = () => {
  const pad = { id: 'QA pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  window.__pad = pad;
  navigator.getGamepads = () => [pad, null, null, null];
};
const { browser, page, errors } = await openMobile({ init: fakePad });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);
await page.evaluate(() => { __game.qaSafe = true; });
const mapOpen = () => page.locator('.map-layer').count().then(n => n === 1);
const closeMap = async () => { await page.locator('.map-layer .btn-close').dispatchEvent('pointerdown'); await page.waitForTimeout(100); };
const openByButton = async () => { await page.locator('.btn-map').dispatchEvent('pointerdown'); await page.waitForSelector('.map-layer'); await page.waitForTimeout(250); };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const near = (p, h) => p && hex(h).every((v, i) => Math.abs(v - p[i]) < 6);
// 지도 캔버스의 칸 가운데 색 [r,g,b]
const px = (mapId, cells) => page.evaluate(([mapId, cells, cols]) => {
  const cv = document.querySelector(`.map-layer canvas[data-map="${mapId}"]`);
  if (!cv) return null;
  const s = cv.width / cols, x = cv.getContext('2d');
  return cells.map(([c, r]) => [...x.getImageData((c + 0.5) * s, (r + 0.5) * s, 1, 1).data.slice(0, 3)]);
}, [mapId, cells, rooms(story.maps[mapId]).cols]);
// 맵의 모든 방(각 방 첫 칸)이 탐색 기록과 같은 색인지
const roomColors = async mapId => {
  const R = rooms(story.maps[mapId]);
  const first = [];
  for (let n = 0; n < R.count; n++) { const i = R.id.indexOf(n); first.push([i % R.cols, Math.floor(i / R.cols)]); }
  const flags = await page.evaluate(() => __game.flags);
  const got = await px(mapId, first);
  const wrong = first.filter((_, n) => !near(got[n], flags[`seen:${mapId}:${n}`] ? MAP_COLORS.lit : MAP_COLORS.dark)).map(([c, r]) => `${c},${r}`);
  const lit = first.filter((_, n) => flags[`seen:${mapId}:${n}`]).length;
  return { wrong, lit, dark: R.count - lit };
};
const doorColors = async mapId => {
  const def = story.maps[mapId];
  const st = await page.evaluate(([mapId, doors]) => doors.map(d => (mapId === __game.mapId ? __game.world.door(d.x, d.y) : __game.doorState(mapId, d)).locked), [mapId, def.doors]);
  const got = await px(mapId, def.doors.map(d => [d.x, d.y]));
  const wrong = def.doors.filter((d, i) => near(got[i], MAP_COLORS.locked) !== !!st[i]).map(d => `${d.x},${d.y}`);
  return { wrong, locked: st.filter(Boolean).length };
};

check('HUD에 지도 버튼', await page.locator('.btn-map').isVisible());
await openByButton();
check('지도 버튼으로 전체 지도 열림 + 지금 층(1층)만 표시', (await mapOpen()) && (await page.locator('.map-layer canvas').count()) === 1 && (await page.locator('.map-layer canvas[data-map="main1f"]').count()) === 1);
let rc = await roomColors('main1f');
check('탐색한 방은 밝게, 미탐색은 어둡게(1층 모든 방)', !rc.wrong.length && rc.lit > 0 && rc.dark > 0, `밝음 ${rc.lit} / 어두움 ${rc.dark} ${rc.wrong.join(' ')}`);
let dc = await doorColors('main1f');
check('잠긴 문만 빨간 선(1층 모든 문)', !dc.wrong.length && dc.locked > 0, `잠김 ${dc.locked} ${dc.wrong.join(' ')}`);
check('현재 위치 표시', (await page.locator('.map-layer .map-me').count()) === 1);
await closeMap();
check('닫기', !(await mapOpen()));

// 새 방에 들어가면 밝아짐 (기계실습실)
const machine = room1(3, 6);
check('들어가기 전 기계실습실은 미탐색', !(await page.evaluate(k => __game.flags[k], `seen:main1f:${machine}`)));
await page.evaluate(() => { __game.player.x = 3.5; __game.player.y = 6.5; });
await page.waitForTimeout(150);
await openByButton();
check('기계실습실에 들어가면 지도에서 밝게', near((await px('main1f', [[3, 6]]))[0], MAP_COLORS.lit));
await closeMap();

// 문을 열면 빨간 선이 사라짐
await page.evaluate(() => __game.setDoor(5, 8, 'unlock'));
await openByButton();
check('잠금이 풀린 문은 빨간 선 없음', !near((await px('main1f', [[5, 8]]))[0], MAP_COLORS.locked));
await closeMap();

// 다른 층: 들어가 본 층만, 지금 층이 맨 위. 다른 층의 잠긴 문(저장된 문 상태)도 빨간 선
await page.evaluate(() => { __game.enterMap('main2f', 20.5, 10.5, 'down'); });
await skipDialogs(page); // 2층 첫 방문 서술
await page.waitForTimeout(150);
await page.evaluate(() => { __game.enterMap('main1f', 20.5, 10.5, 'down'); });
await page.waitForTimeout(150);
await openByButton();
const order = await page.locator('.map-layer canvas').evaluateAll(cs => cs.map(c => c.dataset.map));
check('들어가 본 층만 표시, 지금 층이 맨 위(환기구는 아직 없음)', order.join() === 'main1f,main2f', order.join());
rc = await roomColors('main2f');
dc = await doorColors('main2f');
check('다른 층도 탐색·잠긴 문 표시', !rc.wrong.length && rc.lit > 0 && !dc.wrong.length && dc.locked > 0, `밝음 ${rc.lit} 잠김 ${dc.locked} ${[...rc.wrong, ...dc.wrong].join(' ')}`);
await closeMap();

// 키보드 Q / Esc, 패드 Back
await page.keyboard.press('q');
await page.waitForSelector('.map-layer');
await page.waitForTimeout(250);
await page.keyboard.press('q');
await page.waitForTimeout(100);
check('키보드 Q로 열고 Q로 닫기', !(await mapOpen()));
await page.keyboard.press('q');
await page.waitForSelector('.map-layer');
await page.waitForTimeout(250);
await page.keyboard.press('Escape');
await page.waitForTimeout(100);
check('Esc로 닫기(휴대폰이 열리지 않음)', !(await mapOpen()) && (await page.locator('.menu-layer').count()) === 0);
const back = async () => {
  await page.evaluate(() => { __pad.buttons[8].pressed = true; });
  await page.waitForTimeout(110);
  await page.evaluate(() => { __pad.buttons[8].pressed = false; });
  await page.waitForTimeout(260);
};
await back();
const padOpened = await mapOpen();
await back();
check('패드 Back으로 열고 닫기', padOpened && !(await mapOpen()));

// Q·패드 Back은 지도만 닫는다: 키패드(번호 입력) 중에 눌러도 취소되지 않음
await page.evaluate(() => { window.__kp = 'open'; __game.ui.keypad('시험', 4).then(v => (window.__kp = v)); });
await page.waitForSelector('.keypad-layer');
await page.waitForTimeout(250);
await page.keyboard.press('q');
await back();
check('키패드 중 Q·패드 Back은 무시(번호 입력이 취소되지 않음)', (await page.locator('.keypad-layer').count()) === 1 && (await page.evaluate(() => window.__kp)) === 'open');
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
check('키패드가 닫힌 뒤 지도가 저절로 열리지 않음', !(await mapOpen()) && (await page.evaluate(() => window.__kp)) === null);

// 일시정지(앱 전환) 중에 누른 Q가 돌아왔을 때 지도를 열지 않음
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(200);
const paused = await page.evaluate(() => __game.paused);
await page.keyboard.press('q');
await page.waitForTimeout(100);
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(300);
check('일시정지 중 누른 Q는 복귀 후 지도를 열지 않음', paused && !(await mapOpen()));

// 키보드: 휴대폰 '지도' 앱으로 연 지도를 닫으면 포커스가 '지도' 앱으로 돌아감
await page.keyboard.press('Escape');
await page.waitForSelector('.phone-app');
await page.waitForTimeout(300);
for (const k of ['ArrowRight', 'ArrowRight']) await page.keyboard.press(k);
const onMapApp = await page.evaluate(() => document.querySelector('.nav-focus')?.textContent.trim());
await page.keyboard.press('Enter');
await page.waitForSelector('.map-layer');
await page.waitForTimeout(250);
await page.keyboard.press('q');
await page.waitForTimeout(150);
const refocus = await page.evaluate(() => document.querySelector('.nav-focus')?.textContent.trim());
check("휴대폰에서 연 지도를 닫으면 포커스가 '지도' 앱으로", onMapApp === '지도' && refocus === '지도' && !(await mapOpen()), `${onMapApp} → ${refocus}`);
await page.keyboard.press('Escape');
await page.waitForTimeout(150);

// 휴대폰 메뉴 '지도' 앱: 휴대폰 위에 열리고 닫으면 휴대폰으로
await page.evaluate(() => document.body.classList.replace('mode-key', 'mode-touch'));
await page.locator('.btn-menu').dispatchEvent('pointerdown');
await page.waitForSelector('.phone-app');
await page.waitForTimeout(300);
await page.locator('.phone-app', { hasText: '지도' }).dispatchEvent('pointerdown');
await page.waitForTimeout(250);
const fromPhone = await mapOpen();
await closeMap();
check("휴대폰 '지도' 앱으로 열고, 닫으면 휴대폰 메뉴로", fromPhone && (await page.locator('.menu-layer').count()) === 1);
await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
await page.waitForTimeout(100);

// 저장/불러오기: 탐색 기록 유지
const kept = await page.evaluate(k => { const s = JSON.parse(JSON.stringify(__game.snapshot())); __game.restore(s); return !!__game.flags[k]; }, `seen:main1f:${machine}`);
await page.waitForTimeout(150);
await openByButton();
check('저장한 뒤 불러와도 탐색 기록 유지', kept && near((await px('main1f', [[3, 6]]))[0], MAP_COLORS.lit));
await closeMap();

// 좁은 화면(320px)에서 긴 안내 문구(토스트)가 지도 버튼을 가리지 않음
await page.setViewportSize({ width: 320, height: 568 });
await page.waitForTimeout(200);
await page.evaluate(() => __game.ui.toast('숨었다 · 조사 버튼으로 나가기'));
const overlap = await page.evaluate(() => {
  const t = document.querySelector('.toast').getBoundingClientRect(), b = document.querySelector('.btn-map').getBoundingClientRect();
  return t.right > b.left && t.top < b.bottom && t.bottom > b.top ? `토스트 ${Math.round(t.left)}~${Math.round(t.right)} / 버튼 ${Math.round(b.left)}~` : '';
});
check('긴 안내 문구가 지도 버튼을 가리지 않음(320px)', !overlap, overlap);

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const fails = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
