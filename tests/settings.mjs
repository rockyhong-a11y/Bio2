// 설정: 자동 달리기 — 휴대폰 메뉴 → 옵션에서 켜면 기본이 달리기, 달리기 버튼을 누르는 동안 걷기, 다시 열어도 유지
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, ctx, page, errors } = await openMobile();
const start = async () => {
  await page.waitForSelector('.title-btn');
  await page.waitForTimeout(300);
  await page.locator('.title-btn').first().dispatchEvent('pointerdown');
  await skipDialogs(page);
};
// 1층 복도(트인 곳)에서 오른쪽으로 0.45초 이동한 거리
const dash = run => page.evaluate(async run => {
  const g = __game, I = __input;
  g.player.x = 20.5; g.player.y = 10.5; g.player.dir = 'right';
  I.run = run; I.x = 1; I.y = 0;
  await new Promise(r => setTimeout(r, 450));
  I.x = 0; I.run = false;
  return g.player.x - 20.5;
}, run);
const toggleAutoRun = async () => {
  await page.locator('.btn-menu').dispatchEvent('pointerdown');
  await page.waitForSelector('.phone-app');
  await page.waitForTimeout(300);
  await page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
  await page.waitForSelector('.opt-autorun');
  await page.locator('.opt-autorun').dispatchEvent('pointerdown');
  const label = await page.locator('.opt-autorun').textContent();
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown'); // 뒤로
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown'); // 닫기
  await page.waitForTimeout(150);
  return label;
};
const runWord = () => page.locator('.btn-b .run-word').textContent();

await start();
check('기본은 꺼짐: 버튼 이름 달리기', (await runWord()) === '달리기');
const walk = await dash(false), run = await dash(true);
check('꺼짐: 버튼 누르면 달리기(빠름)', run > walk * 1.4, `걷기 ${walk.toFixed(2)} / 달리기 ${run.toFixed(2)}`);

const label = await toggleAutoRun();
check('옵션에서 켜기', label === '켜짐' && (await page.evaluate(() => JSON.parse(localStorage.getItem('wd_topview_settings_v1')).autoRun)) === true, label);
check('켜짐: 버튼·안내 이름이 걷기', (await runWord()) === '걷기' && (await page.locator('.hints .run-word').first().textContent()) === '걷기');
const auto = await dash(false), held = await dash(true);
check('켜짐: 버튼 안 눌러도 달리기', auto > walk * 1.4, `${auto.toFixed(2)}`);
check('켜짐: 버튼 누르는 동안 걷기', held < auto * 0.75 && Math.abs(held - walk) < walk * 0.3, `${held.toFixed(2)}`);
const noise = await page.evaluate(async () => {
  const g = __game, I = __input; g.player.x = 20.5; g.player.y = 10.5; I.run = false; I.x = 1;
  await new Promise(r => setTimeout(r, 200));
  const n = g.player.noise; I.x = 0; return n;
});
check('자동 달리기 중에는 발소리 큼(수위가 듣는다)', noise > 5, String(noise));
// 키보드: X로 휴대폰 메뉴를 닫고 X를 계속 누르고 있으면 걷기여야 한다 (메뉴가 X 입력을 가로채도 눌림 상태는 기록)
await page.evaluate(() => { __game.player.x = 20.5; __game.player.y = 10.5; });
await page.keyboard.press('Escape');
await page.waitForSelector('.menu-layer');
await page.waitForTimeout(300);
await page.keyboard.down('x');
await page.waitForSelector('.menu-layer', { state: 'detached' });
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(450);
const heldX = await page.evaluate(() => __game.player.x - 20.5);
await page.keyboard.up('ArrowRight');
await page.keyboard.up('x');
check('켜짐: X로 메뉴를 닫고 계속 누르면 걷기', heldX < auto * 0.75, `${heldX.toFixed(2)}`);

await page.reload();
await start();
check('다시 열어도 유지(이 기기 저장)', (await runWord()) === '걷기');
check('끄면 원래대로', (await toggleAutoRun()) === '꺼짐' && (await runWord()) === '달리기');
// 화면 확대: 1배(기본) → 2·4·6배 → 1배. 그림 배율 = 선택 배율, 보이는 폭 = 1/배율, 플레이어는 화면 가운데, 다시 열어도 유지
const view = () => page.evaluate(() => ({ scale: __game.scale, w: __game.cam.w, h: __game.cam.h }));
const cycleZoom = async () => {
  await page.locator('.btn-menu').dispatchEvent('pointerdown');
  await page.waitForSelector('.phone-app');
  await page.waitForTimeout(300);
  await page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
  await page.waitForSelector('.opt-zoom');
  await page.locator('.opt-zoom').dispatchEvent('pointerdown');
  const label = await page.locator('.opt-zoom').textContent();
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
  await page.waitForTimeout(150);
  return label;
};
const v1 = await view();
check('화면 확대 기본 1배(가로 9칸)', Math.abs(v1.w - 9 * 32) < 0.5, JSON.stringify(v1));
for (const z of [2, 4, 6]) {
  const label = await cycleZoom();
  const v = await view();
  check(`화면 확대 ${z}배: 그림 ${z}배, 보이는 폭 1/${z}`, label === `${z}배` && Math.abs(v.scale / v1.scale - z) < 0.01 && Math.abs(v.w * z - v1.w) < 0.5 && Math.abs(v.h * z - v1.h) < 0.5, `${label} scale×${(v.scale / v1.scale).toFixed(2)} 폭 ${v.w.toFixed(1)}`);
}
const centered = await page.evaluate(async () => {
  const g = __game; g.player.x = 20.5; g.player.y = 10.5;
  await new Promise(r => setTimeout(r, 1200));
  return Math.abs(g.player.x * 32 - g.cam.x - g.cam.w / 2);
});
check('6배에서도 플레이어가 화면 가운데', centered < 3, `${centered.toFixed(2)}px`);
await page.reload();
await start();
check('다시 열어도 6배 유지', Math.abs((await view()).scale / v1.scale - 6) < 0.01);
check('한 번 더 누르면 1배로', (await cycleZoom()) === '1배' && Math.abs((await view()).scale - v1.scale) < 0.01);
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
