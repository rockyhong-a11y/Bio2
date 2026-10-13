// 저장/불러오기 검증: 게시판 저장(사인펜 소모) → 새로고침 → 이어하기 → 위치·소지품·플래그·목표·제한시간 복원
//                  → 게임오버 → '마지막 저장에서 다시'
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const { browser, page, errors } = await openMobile();
await page.addScriptTag({ path: new URL('./bot.js', import.meta.url).pathname });
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.addScriptTag({ path: new URL('./bot.js', import.meta.url).pathname });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
check('저장 없을 때 이어하기 비활성', await page.locator('.title-btn').nth(1).isDisabled());
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);

// 진행 상태를 만든다: 2층 상태 일부 + 제한시간
await page.evaluate(() => {
  const g = __game;
  g.give('coin', 2); g.flags.light_26 = true; g.flags.objective = '테스트 목표'; g.ui.objective('테스트 목표');
  g.player.x = 12.4; g.player.y = 13.35; g.player.dir = 'up';
});
// 제한시간 중에는 게시판 저장 거부(재도전 불가능한 저장 방지)
await page.evaluate(() => { __game.timer = { left: 123, label: '소영', onEnd: 'treeFail' }; });
await page.evaluate(() => __bot.act('up'));
await page.waitForTimeout(200);
const refused = await page.evaluate(() => ({ choice: !!document.querySelector('.choice-layer'), text: document.querySelector('.dialog-text')?.textContent || '' }));
check('제한시간 중 저장 거부', !refused.choice, JSON.stringify(refused));
await skipDialogs(page);
await page.evaluate(() => { const g = __game; g.timer = null; g.ui.timer(null); g.laters.push({ t: 999, run: 'chalk' }); });
const pens0 = await page.evaluate(() => __game.count('pen'));
// 로비 게시판(11,12) 앞에서 조사 → 저장
await page.evaluate(() => __bot.act('up'));
await page.waitForTimeout(250); // 새 화면이 열린 직후 0.2초 탭 무시 보호
await page.locator('.choice-opt').first().dispatchEvent('pointerdown');
await page.waitForTimeout(250);
await page.locator('.save-slot').first().dispatchEvent('pointerdown');
await skipDialogs(page);
const pens1 = await page.evaluate(() => __game.count('pen'));
check('저장 시 사인펜 1개 소모', pens1 === pens0 - 1, `${pens0}→${pens1}`);
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('wd_topview_save_v1'))[0]);
check('저장 데이터 기록', !!saved && saved.map === 'main1f', saved?.label);

await page.reload();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
// 실제 터치(위치 판정)로 이어하기 → 슬롯: 목록이 타이틀 아래에 깔리면 여기서 실패한다
const tapEl = async loc => { const b = await loc.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
await tapEl(page.locator('.title-btn').nth(1));
await page.waitForTimeout(300);
const slotOnTop = await page.evaluate(() => { const b = document.querySelector('.save-slot'); const r = b.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === b; });
check('이어하기 목록이 화면 최상단(터치 가능)', slotOnTop);
await tapEl(page.locator('.save-slot').first());
await page.waitForTimeout(500);
const st = await page.evaluate(() => ({ map: __game.mapId, x: __game.player.x, y: __game.player.y, coins: __game.count('coin'), light: __game.flags.light_26, obj: document.querySelector('.hud-obj').textContent, laters: __game.laters, code: __game.flags.toolCode }));
check('위치 복원', st.map === 'main1f' && Math.abs(st.x - 12.4) < 0.01 && Math.abs(st.y - 13.35) < 0.01, `${st.map} ${st.x},${st.y}`);
check('소지품 복원', st.coins === 2);
check('플래그 복원', st.light === true);
check('목표 표시 복원', st.obj.includes('테스트 목표'), st.obj);
check('대기 중 이벤트(지연 실행) 복원', st.laters.some(L => L.run === 'chalk' && L.t > 990), JSON.stringify(st.laters));
check('무작위 코드 유지', st.code === saved.flags.toolCode);

// 게임오버 → 마지막 저장에서 다시
await page.evaluate(() => { __game.laters = []; __game.hp = 10; __game.damage(25); });
await page.waitForSelector('.over-layer');
check('체력 0 → 게임오버 화면', true);
await page.waitForTimeout(250);
await tapEl(page.locator('.over-layer .title-btn').first());
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({ over: __game.over, hp: __game.hp, x: __game.player.x, layers: document.querySelectorAll('#ui .layer').length }));
check('마지막 저장에서 다시: 복원', !after.over && after.hp === 100 && Math.abs(after.x - 12.4) < 0.01 && after.layers === 0, JSON.stringify(after));
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
