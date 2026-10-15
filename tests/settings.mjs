// 설정(휴대폰 메뉴 → 옵션): 달리기는 스틱 세기로 자동(옵션 없음) · 조작 방식 · 화면 축소/확대 · 그래픽 필터, 다시 열어도 유지
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
// 1층 복도(트인 곳)에서 오른쪽으로 0.45초 이동한 거리·발소리. m = 스틱을 민 정도(0..1)
const dash = m => page.evaluate(async m => {
  const g = __game, I = __input;
  g.player.x = 20.5; g.player.y = 10.5; g.player.dir = 'right';
  I.x = m; I.y = 0;
  await new Promise(r => setTimeout(r, 450));
  const noise = g.player.noise;
  I.x = 0;
  return { d: g.player.x - 20.5, noise };
}, m);
// 옵션 화면을 열고 fn(옵션 화면) 실행 후 닫기
const inOptions = async fn => {
  await page.locator('.btn-menu').dispatchEvent('pointerdown');
  await page.waitForSelector('.phone-app');
  await page.waitForTimeout(300);
  await page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
  await page.waitForSelector('.opt-zoom');
  const r = await fn();
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown'); // 뒤로
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown'); // 닫기
  await page.waitForTimeout(150);
  return r;
};
const press = async sel => { await page.locator(sel).dispatchEvent('pointerdown'); return page.locator(sel).textContent(); };
const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('wd_topview_settings_v1') || '{}'));

await start();
// 1) 달리기 = 스틱 세기(달리기 버튼·자동 달리기 옵션 없음)
const slow = await dash(0.3), walk = await dash(0.6), run = await dash(1);
check('스틱 끝까지 = 달리기(빠름)', run.d > walk.d * 1.4, `걷기 ${walk.d.toFixed(2)} / 달리기 ${run.d.toFixed(2)}`);
check('살짝 밀면 더 천천히 걷기', slow.d < walk.d * 0.8 && slow.d > 0.05, slow.d.toFixed(2));
check('달리면 발소리 큼(수위가 듣는다), 걸으면 작음', run.noise > 5 && walk.noise < run.noise, `${walk.noise} / ${run.noise}`);
await page.evaluate(() => { __game.player.x = 20.5; __game.player.y = 10.5; });
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(450);
await page.keyboard.up('ArrowRight');
const kb = await page.evaluate(() => __game.player.x - 20.5);
check('키보드 방향키는 늘 달리기', Math.abs(kb - run.d) < run.d * 0.25, kb.toFixed(2));
check('달리기 버튼·자동 달리기 옵션 없음', (await page.locator('.btn-b').count()) === 0
  && (await inOptions(() => page.locator('.opt-autorun').count())) === 0);

// 2) 조작 방식: 버추얼 패드(기본) ↔ 터치
await page.touchscreen.tap(195, 60); // 키보드를 쓰면 화면 버튼이 숨으므로(입력 방식 표시) 화면을 눌러 터치 입력으로 되돌림
await page.waitForTimeout(400);
const ctl = () => page.evaluate(() => ({ cls: document.querySelector('.controls').className, a: getComputedStyle(document.querySelector('.btn-a')).display }));
check('기본 조작 방식 = 버추얼 패드(버튼 보임)', /ctl-pad/.test((await ctl()).cls) && (await ctl()).a !== 'none');
const toTouch = await inOptions(() => press('.opt-controls'));
check('옵션에서 터치로: 화면 버튼 숨김 + 저장', toTouch === '터치' && /ctl-touch/.test((await ctl()).cls) && (await ctl()).a === 'none' && (await saved()).controls === 'touch', toTouch);
// 화면 축소: 1배(기본, 가로 9칸) → 2·4·6배 넓게 → 1배. 그림 배율 = 1/배율, 보이는 폭 = 배율배, 다시 열어도 유지
const view = () => page.evaluate(() => ({ scale: __game.scale, w: __game.cam.w, h: __game.cam.h, smooth: (__game.render(0), __game.ctx.imageSmoothingEnabled) }));
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
check('화면 축소 기본 1배(가로 9칸, 선명한 도트)', Math.abs(v1.w - 9 * 32) < 0.5 && !v1.smooth, JSON.stringify(v1));
for (const z of [2, 4, 6]) {
  const label = await cycleZoom();
  const v = await view();
  check(`화면 축소 ${z}배: 그림 1/${z}, 보이는 폭 ${z}배`, label === `${z}배` && Math.abs(v1.scale / v.scale - z) < 0.01 && Math.abs(v.w - v1.w * z) < 0.5 && Math.abs(v.h - v1.h * z) < 0.5, `${label} 폭 ${(v.w / 32).toFixed(1)}칸`);
  if (z === 2) {
    const centered = await page.evaluate(async () => {
      const g = __game; g.player.x = 20.5; g.player.y = 10.5;
      await new Promise(r => setTimeout(r, 1200));
      return Math.abs(g.player.x * 32 - g.cam.x - g.cam.w / 2);
    });
    check('2배: 플레이어가 화면 가운데', centered < 3, `${centered.toFixed(2)}px`);
  }
  if (z === 4) check('4배: 도트가 빠지지 않게 부드럽게 그림', v.smooth);
}
const whole = await page.evaluate(() => {
  const g = __game, W = g.world.cols * 32, H = g.world.rows * 24;
  const t0 = performance.now(); for (let i = 0; i < 30; i++) g.render(1 / 60);
  return { fits: g.cam.x <= 0.5 && g.cam.x + g.cam.w >= W - 0.5 && g.cam.y <= 0.5 && g.cam.y + g.cam.h >= H - 0.5, ms: +((performance.now() - t0) / 30).toFixed(1) };
});
check('6배: 한 층 전체가 한 화면에', whole.fits, JSON.stringify(whole));
check('6배: 렌더 프레임당 33ms 이하', whole.ms < 33, `${whole.ms}ms`);
await page.reload();
await start();
check('다시 열어도 6배 유지', Math.abs(v1.scale / (await view()).scale - 6) < 0.01);
check('다시 열어도 터치 조작 유지', /ctl-touch/.test((await ctl()).cls));
check('한 번 더 누르면 1배로', (await cycleZoom()) === '1배' && Math.abs((await view()).scale - v1.scale) < 0.01);
check('터치 → 버추얼 패드로 되돌리기', (await inOptions(() => press('.opt-controls'))) === '버추얼 패드' && /ctl-pad/.test((await ctl()).cls));

// 3) 화면 확대 2~6배: 그림 z배, 보이는 범위 1/z. 화면 축소와 함께 못 씀(한쪽을 켜면 다른 쪽 1배)
for (const z of [2, 3, 4, 5, 6]) {
  const label = await inOptions(() => press('.opt-zoomin'));
  const v = await view();
  check(`화면 확대 ${z}배: 그림 ${z}배, 보이는 폭 1/${z}`, label === `${z}배` && Math.abs(v.scale / v1.scale - z) < 0.01 && Math.abs(v.w - v1.w / z) < 0.5 && !v.smooth, `${label} 폭 ${(v.w / 32).toFixed(2)}칸`);
}
const centeredIn = await page.evaluate(async () => {
  const g = __game; g.player.x = 20.5; g.player.y = 10.5;
  await new Promise(r => setTimeout(r, 1200));
  return Math.abs(g.player.x * 32 - g.cam.x - g.cam.w / 2);
});
check('확대 6배: 플레이어가 화면 가운데', centeredIn < 2, `${centeredIn.toFixed(2)}px`);
const excl = await inOptions(async () => {
  const out = await press('.opt-zoom'); // 축소 2배 → 확대는 1배로
  const inLabel = await page.locator('.opt-zoomin').textContent();
  const st1 = await saved();
  const inAgain = await press('.opt-zoomin'); // 확대 2배 → 축소는 1배로
  const outLabel = await page.locator('.opt-zoom').textContent();
  const st2 = await saved();
  return { out, inLabel, st1, inAgain, outLabel, st2 };
});
check('축소를 켜면 확대는 1배로', excl.out === '2배' && excl.inLabel === '1배' && excl.st1.zoomOut === 2 && excl.st1.zoomIn === 1, JSON.stringify(excl));
check('확대를 켜면 축소는 1배로', excl.inAgain === '2배' && excl.outLabel === '1배' && excl.st2.zoomIn === 2 && excl.st2.zoomOut === 1);
check('확대 2배 화면 반영', Math.abs((await view()).scale / v1.scale - 2) < 0.01);
await page.reload();
await start();
check('다시 열어도 확대 2배 유지', Math.abs((await view()).scale / v1.scale - 2) < 0.01);
for (let i = 0; i < 5; i++) await inOptions(() => press('.opt-zoomin'));
check('확대를 끝까지 돌리면 1배로', Math.abs((await view()).scale - v1.scale) < 0.01 && (await saved()).zoomIn === 1);

// 4) 그래픽 필터: ◀ ▶ 로 끄기 + 10종 순환, 저장
const names = await inOptions(async () => {
  const seen = [await page.locator('.opt-filter').textContent()];
  for (let i = 0; i < 11; i++) { await page.locator('.opt-filter-next').dispatchEvent('pointerdown'); seen.push(await page.locator('.opt-filter').textContent()); }
  await page.locator('.opt-filter-prev').dispatchEvent('pointerdown');
  seen.push(await page.locator('.opt-filter').textContent());
  return seen;
});
check('필터: 끄기 + 10종을 ▶로 순환해 다시 끄기', names[0] === '끄기' && new Set(names.slice(1, 11)).size === 10 && !names.slice(1, 11).includes('끄기') && names[11] === '끄기', names.join(','));
check('필터: ◀로 거꾸로(끄기 → 빛 번짐), 저장', names[12] === '빛 번짐' && (await saved()).filter === 'bloom' && (await page.evaluate(() => document.getElementById('app').classList.contains('fx-on'))));
await page.reload();
await start();
check('다시 열어도 필터 유지', (await page.evaluate(() => __fx.id)) === 'bloom');
await inOptions(() => page.locator('.opt-filter-next').dispatchEvent('pointerdown'));
check('필터 끄면 원래 화면', (await page.evaluate(() => __fx.id)) === 'off' && !(await page.evaluate(() => document.getElementById('app').classList.contains('fx-on'))));
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
