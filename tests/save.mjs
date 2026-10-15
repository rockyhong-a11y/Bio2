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
// 무한 세이브(옵션): 끄면 휴대폰 '저장'은 게시판 안내만 / 켜면 사인펜 없이(0개여도·줄지 않음) 저장, 휴대폰 '저장' 앱으로 어디서든, 귀목 제한시간 중엔 거부
const openPhone = async () => {
  await page.locator('.btn-menu').dispatchEvent('pointerdown');
  await page.waitForSelector('.phone-app');
  await page.waitForTimeout(300);
};
const closePhone = async () => { while (await page.locator('.menu-layer').count()) { await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown'); await page.waitForTimeout(120); } };
const phoneSave = async () => {
  await openPhone();
  await page.locator('.phone-app', { hasText: '저장' }).dispatchEvent('pointerdown');
  await page.waitForTimeout(300);
  return page.evaluate(() => ({ layer: document.querySelectorAll('.save-layer').length, title: document.querySelector('.save-title')?.textContent || '', toast: [...document.querySelectorAll('.toast')].pop()?.textContent || '' }));
};
const off = await phoneSave();
check('무한 세이브 꺼짐: 휴대폰 저장은 게시판 안내만', off.layer === 0 && off.toast.includes('게시판'), JSON.stringify(off));
await closePhone();
await openPhone();
await page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
await page.waitForSelector('.opt-infsave');
await page.locator('.opt-infsave').dispatchEvent('pointerdown');
const infLabel = await page.locator('.opt-infsave').textContent();
await closePhone();
check('옵션에서 무한 세이브 켜기(이 기기에 저장)', infLabel === '켜짐' && (await page.evaluate(() => JSON.parse(localStorage.getItem('wd_topview_settings_v1')).infiniteSave)) === true, infLabel);
await page.evaluate(() => { const g = __game; while (g.has('pen')) g.take('pen'); g.player.x = 33.5; g.player.y = 10.5; });
const on = await phoneSave();
check('켜짐: 휴대폰 저장 앱으로 어디서든 저장 화면(사인펜 0개)', on.layer === 1 && on.title.includes('무한'), JSON.stringify(on));
await page.waitForTimeout(250);
await page.locator('.save-layer .save-slot').nth(1).dispatchEvent('pointerdown');
await page.waitForTimeout(200);
const slot2 = await page.evaluate(() => ({ s: JSON.parse(localStorage.getItem('wd_topview_save_v1'))[1], pens: __game.count('pen') }));
check('켜짐: 사인펜 없이 저장되고 사인펜은 그대로(0)', slot2.s?.map === 'main1f' && Math.abs(slot2.s.x - 33.5) < 0.01 && slot2.pens === 0, JSON.stringify({ x: slot2.s?.x, pens: slot2.pens }));
await closePhone();
await page.evaluate(() => { __game.player.x = 12.4; __game.player.y = 13.35; __game.player.dir = 'up'; __game.act(); }); // 로비 게시판
await page.waitForSelector('.choice-layer');
await page.waitForTimeout(250);
await page.locator('.choice-opt').first().dispatchEvent('pointerdown');
await page.waitForSelector('.save-layer');
await page.waitForTimeout(250);
await page.locator('.save-layer .save-slot').nth(2).dispatchEvent('pointerdown');
await page.waitForTimeout(200);
const slot3 = await page.evaluate(() => ({ s: !!JSON.parse(localStorage.getItem('wd_topview_save_v1'))[2], pens: __game.count('pen') }));
check('켜짐: 게시판에서도 사인펜 없이 저장', slot3.s && slot3.pens === 0, JSON.stringify(slot3));
await page.evaluate(() => { __game.timer = { left: 99, label: '소영', onEnd: 'treeFail' }; });
const during = await phoneSave();
check('켜짐: 귀목 제한시간 중에는 휴대폰 저장도 거부', during.layer === 0 && during.toast.includes('여유'), JSON.stringify(during));
await closePhone();
await page.evaluate(() => { __game.timer = null; __game.ui.timer(null); });
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
