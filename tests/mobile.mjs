// 요구사항 1 검증: 모바일 세로 최적화 · 롱프레스 팝업(선택/복사/컨텍스트 메뉴) 금지 · 확대/축소 금지
import { openMobile } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);

// 1) viewport 메타
const vp = await page.$eval('meta[name=viewport]', m => m.content);
check('viewport: user-scalable=no, maximum-scale=1', /user-scalable=no/.test(vp) && /maximum-scale=1/.test(vp), vp);

// 2) CSS 방어선
const css = await page.evaluate(() => {
  const b = getComputedStyle(document.body), c = getComputedStyle(document.getElementById('game'));
  return { touch: b.touchAction, sel: b.userSelect || b.webkitUserSelect, callout: b.webkitTouchCallout, overscroll: b.overscrollBehavior || b.overscrollBehaviorY, canvasTouch: c.touchAction };
});
check('body touch-action: none', css.touch === 'none', css.touch);
check('canvas touch-action: none', css.canvasTouch === 'none', css.canvasTouch);
check('user-select: none', css.sel === 'none', css.sel);
check('-webkit-touch-callout: none', css.callout === 'none' || css.callout === undefined, String(css.callout));
check('overscroll-behavior: none', String(css.overscroll).includes('none'), css.overscroll);

// 3) 이벤트 차단 (defaultPrevented)
const prevented = await page.evaluate(() => {
  const fire = (type, init = {}, Ctor = Event) => { const e = new Ctor(type, { bubbles: true, cancelable: true, ...init }); document.getElementById('game').dispatchEvent(e); return e.defaultPrevented; };
  return {
    contextmenu: fire('contextmenu', {}, MouseEvent),
    selectstart: fire('selectstart'),
    dragstart: fire('dragstart'),
    gesturestart: fire('gesturestart'),
    gesturechange: fire('gesturechange'),
    dblclick: fire('dblclick', {}, MouseEvent),
    ctrlWheel: fire('wheel', { ctrlKey: true, deltaY: -100 }, WheelEvent),
    ctrlPlus: (() => { const e = new KeyboardEvent('keydown', { key: '+', ctrlKey: true, bubbles: true, cancelable: true }); document.dispatchEvent(e); return e.defaultPrevented; })(),
  };
});
for (const [k, v] of Object.entries(prevented)) check(`차단: ${k}`, v);

// 4) 실제 롱프레스(터치 900ms) 후 텍스트 선택이 생기지 않음 — 타이틀 글자 위에서
const cdp = await page.context().newCDPSession(page);
const box = await page.locator('.title-main').boundingBox();
const tp = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [tp] });
await page.waitForTimeout(900);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const sel = await page.evaluate(() => String(getSelection()));
check('롱프레스 후 선택된 텍스트 없음', sel === '', JSON.stringify(sel));

// 5) 두 손가락 핀치 → 확대 배율 변화 없음
const scale0 = await page.evaluate(() => visualViewport.scale);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 150, y: 400, id: 1 }, { x: 240, y: 400, id: 2 }] });
for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 150 - i * 12, y: 400, id: 1 }, { x: 240 + i * 12, y: 400, id: 2 }] });
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await page.waitForTimeout(300);
const scale1 = await page.evaluate(() => visualViewport.scale);
check('핀치 후 visualViewport.scale 유지', scale0 === scale1, `${scale0} → ${scale1}`);

// 6) 가로 스크롤 없음 / 화면 꽉 채움
const dims = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: innerWidth, sh: document.documentElement.scrollHeight, ch: innerHeight }));
check('가로 스크롤 없음', dims.sw <= dims.cw, JSON.stringify(dims));

// 7) 게임 중 롱프레스: 조작 영역에서도 선택/메뉴 없음
// (핀치 터치가 타이틀 버튼에 닿아 이미 시작됐을 수 있음)
for (const sel of ['.gallery-layer .btn-close', '.endings-layer .btn-close', '.chapter-layer .btn-close']) if (await page.locator(sel).count()) await page.locator(sel).last().dispatchEvent('pointerdown'); // 핀치 손가락이 타이틀 메뉴 버튼(챕터 선택·갤러리 등)을 눌러 목록이 열렸으면 닫는다
if (await page.locator('.title-btn').count()) await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await page.waitForTimeout(400);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 700 }] });
await page.waitForTimeout(900);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
check('게임 화면 롱프레스 후 선택 없음', (await page.evaluate(() => String(getSelection()))) === '');

// 9) 실제 터치(위치 판정 포함)로 조작이 되는가 — dispatchEvent가 아닌 touchscreen 입력
for (let i = 0; i < 60 && await page.evaluate(() => __game.busy || __game.ui.modalCount); i++) {
  await page.touchscreen.tap(195, 600);
  await page.waitForTimeout(120);
}
const free = await page.evaluate(() => !__game.busy && !__game.ui.modalCount);
check('실제 탭으로 프롤로그 대사 넘기기', free);
const hit = await page.evaluate(() => {
  const at = el => { const r = el.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); };
  const a = document.querySelector('.btn-a'), m = document.querySelector('.btn-menu'), pad = document.querySelector('.pad-zone');
  // 버튼 자신이나 그 안의 아이콘에 맞으면 터치가 버튼에 전달된다
  return { a: a.contains(at(a)), m: m.contains(at(m)), pad: pad.contains(at(pad)) };
});
check('조사·메뉴 버튼, 조이스틱 영역이 터치 최상단', hit.a && hit.m && hit.pad, JSON.stringify(hit));
const y0 = await page.evaluate(() => __game.player.y);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 90, y: 640, id: 7 }] });
for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 90, y: 640 - i * 10, id: 7 }] });
await page.waitForTimeout(700);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const y1 = await page.evaluate(() => __game.player.y);
check('조이스틱 드래그로 캐릭터 이동', y1 < y0 - 0.5, `${y0.toFixed(2)} → ${y1.toFixed(2)}`);
const mb = await page.locator('.btn-menu').boundingBox();
await page.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2);
await page.waitForTimeout(200);
check('☰ 탭으로 메뉴 열림', (await page.locator('.menu-layer').count()) === 1);
await page.locator('.menu-layer .btn-close').last().dispatchEvent('pointerdown');

// 10) 앱 전환(백그라운드) 동안 게임·제한시간 정지
const pause = await page.evaluate(async () => {
  const g = __game;
  g.timer = { left: 50, label: 't', onEnd: 'treeFail' };
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  document.dispatchEvent(new Event('visibilitychange'));
  let picked = null;
  g.ui.choice('q', ['a', 'b'], { timeout: 0.3, def: 1 }).then(i => (picked = i));
  await new Promise(r => setTimeout(r, 700));
  const whileHidden = { left: g.timer.left, picked, paused: g.paused };
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(r => setTimeout(r, 600));
  const after = { picked, paused: g.paused };
  g.timer = null; g.ui.timer(null);
  return { whileHidden, after };
});
check('백그라운드 중 제한시간·선택지 타이머 정지', pause.whileHidden.left === 50 && pause.whileHidden.picked === null && pause.whileHidden.paused === true, JSON.stringify(pause.whileHidden));
check('복귀 후 다시 진행(선택지 자동 결정)', pause.after.picked === 1 && pause.after.paused === false, JSON.stringify(pause.after));
await browser.close();

// 8) 가로 화면: 안내 없이 그대로 플레이(자세한 배치는 landscape.mjs)
const L = await openMobile({ landscape: true });
await L.page.waitForSelector('.title-btn');
await L.page.waitForTimeout(300);
check('가로 화면: 세로 전환 안내 없음', (await L.page.locator('#rotate').count()) === 0);
await L.page.locator('.title-btn').first().dispatchEvent('pointerdown');
await L.page.waitForTimeout(300);
const t0 = await L.page.evaluate(() => __game.t);
await L.page.waitForTimeout(800);
const t1 = await L.page.evaluate(() => __game.t);
check('가로 화면에서도 게임 진행(정지 안 함)', t1 > t0 && (await L.page.evaluate(() => __game.paused)) === false, `${t0} → ${t1}`);
await L.browser.close();

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
