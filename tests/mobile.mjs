// 요구사항 1 검증: 모바일 세로 최적화 · 롱프레스 팝업(선택/복사/컨텍스트 메뉴) 금지 · 확대/축소 금지
import { openMobile } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');

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
if (await page.locator('.title-btn').count()) await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await page.waitForTimeout(400);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 700 }] });
await page.waitForTimeout(900);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
check('게임 화면 롱프레스 후 선택 없음', (await page.evaluate(() => String(getSelection()))) === '');
await browser.close();

// 8) 가로 화면: 세로 전환 안내 표시
const L = await openMobile({ landscape: true });
await L.page.waitForSelector('.title-btn');
const rot = await L.page.$eval('#rotate', e => getComputedStyle(e).display);
check('가로 화면에서 세로 전환 안내 표시', rot === 'flex', rot);
await L.browser.close();

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
