// 움직이는 배경 디테일(js/ambient.js): 번개·형광등 깜빡임·사이렌 회전등·쥐·그림자(붉은 눈)·시계 초침·화분 떨림이 실제로 움직이고,
// 입자 수가 묶여 있고, 일시정지 때 멈추며, 렌더 시간이 크게 늘지 않는지. 콘솔 오류 없음.
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);
await page.evaluate(() => { __game.qaSafe = true; });
const at = (x, y) => page.evaluate(([x, y]) => { __game.player.x = x; __game.player.y = y; }, [x, y]);

// 번개: 실내 밝기(조명 앰비언트)가 잠깐 밝아졌다가 돌아옴
const bolt = await page.evaluate(async () => {
  const g = __game, A = g.ambient, base = g.world.def.ambient;
  A.strike();
  await new Promise(r => setTimeout(r, 30));
  const during = A.ambientColor(base);
  await new Promise(r => setTimeout(r, 900));
  return { base, during, after: A.ambientColor(base), windows: A.windows.length };
});
check('번개: 실내가 잠깐 밝아졌다 원래대로(창문 있는 맵)', bolt.windows > 0 && bolt.during !== bolt.base && bolt.after === bolt.base, JSON.stringify(bolt));

// 형광등 깜빡임·사이렌 회전등·이상한 화분 떨림
const fx = await page.evaluate(() => {
  const A = __game.ambient, lights = __game.world.def.lights;
  const fluo = lights.find(l => l.fx === 'fluo'), beacon = lights.find(l => l.fx === 'beacon');
  const t0 = A.t;
  const f = A.flick.get(fluo) || (A.light(fluo), A.flick.get(fluo));
  f.next = A.t - 0.001;
  const alphas = [];
  for (let i = 0; i < 40; i++) { A.t = t0 + i * 0.011; alphas.push(A.light(fluo).a); }
  A.t = f.until + 0.05; const calm = A.light(fluo).a; // 깜빡임이 끝난 뒤 다음 깜빡임 전
  A.t = t0; const b1 = A.light(beacon); A.t = t0 + 0.4; const b2 = A.light(beacon);
  const jit = Array.from({ length: 60 }, (_, i) => { A.t = t0 + i * 0.05; return A.jitter(); });
  A.t = t0;
  return { min: Math.min(...alphas), base: fluo.a, calm, moved: Math.hypot(b1.x - b2.x, b1.y - b2.y), jit: jit.filter(Boolean).length };
});
check('형광등이 가끔 깜빡이고 평소엔 그대로', fx.min < fx.base * 0.5 && fx.calm === fx.base, JSON.stringify(fx));
check('사이렌 회전등이 돈다', fx.moved > 0.2, fx.moved.toFixed(2));
check('이상한 화분 떨림(가끔 1px)', fx.jit > 0 && fx.jit < 60, String(fx.jit));

// 쥐·바퀴벌레: 복도에서 나타나 움직이다 사라짐, 수는 묶여 있음
await at(20.5, 10.5);
await page.waitForTimeout(200);
const critter = await page.evaluate(async () => {
  const A = __game.ambient;
  let ok = 0;
  for (let i = 0; i < 5; i++) ok += A.spawnCritter() ? 1 : 0;
  const x0 = A.critters.map(c => c.x);
  await new Promise(r => setTimeout(r, 200));
  const moved = A.critters.some((c, i) => Math.abs(c.x - x0[i]) > 0.3);
  await new Promise(r => setTimeout(r, 1100));
  return { ok, moved, left: A.critters.length };
});
check('쥐·바퀴벌레가 벽을 따라 지나가고 곧 사라짐', critter.ok > 0 && critter.moved && critter.left === 0, JSON.stringify(critter));

// 복도 끝 그림자의 붉은 눈: 실제 화면 픽셀이 붉다
const eyes = await page.evaluate(async () => {
  const g = __game, A = g.ambient;
  if (!A.spawnShadow()) return { spawned: false };
  A.shadow.t = 1.0; A.shadow.v = 0;
  g.render(0);
  const s = g.scale, x = Math.round(A.shadow.x * 32) - 2, y = Math.round(A.shadow.y * 24) - 28;
  const sx = Math.floor((x - g.cam.x + 0.5) * s), sy = Math.floor((y - g.cam.y + 0.5) * s);
  const d = g.ctx.getImageData(Math.max(0, sx), Math.max(0, sy), 1, 1).data;
  A.shadow = null;
  return { spawned: true, rgb: [...d.slice(0, 3)] };
});
check('복도 끝 그림자: 어둠 속 붉은 눈이 보임', eyes.spawned && eyes.rgb[0] > 120 && eyes.rgb[0] > eyes.rgb[1] * 2, JSON.stringify(eyes));

// 로비 벽시계 초침: 1초 뒤 시계 부분 픽셀이 바뀐다
await at(15.5, 13.6);
await page.waitForTimeout(300);
const hand = await page.evaluate(() => {
  const g = __game, A = g.ambient, clk = A.clocks[0];
  const grab = () => { g.render(0); const s = g.scale, x = (clk.x * 32 + 10 - g.cam.x) * s, y = ((clk.y + 1) * 24 - 27 - g.cam.y) * s; return [...g.ctx.getImageData(Math.floor(x), Math.floor(y), Math.ceil(12 * s), Math.ceil(12 * s)).data]; };
  const t0 = A.t; A.t = Math.floor(t0) + 0.2; const a = grab(); A.t = Math.floor(t0) + 15.2; const b = grab(); A.t = t0;
  let diff = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) > 30) diff++;
  return { clocks: A.clocks.length, diff };
});
check('로비 벽시계 초침이 움직인다', hand.clocks === 1 && hand.diff > 2, JSON.stringify(hand));

// 입자 수 상한 + 렌더 부담
const perf = await page.evaluate(() => {
  const g = __game, A = g.ambient;
  for (let i = 0; i < 6; i++) A.spawnCritter();
  A.strike();
  const time = n => { const t0 = performance.now(); for (let i = 0; i < n; i++) { A.update(1 / 60); g.render(1 / 60); } return (performance.now() - t0) / n; };
  time(10);
  const on = time(60);
  const keep = { collect: A.collect, drawFree: A.drawFree, drawAfterLight: A.drawAfterLight };
  A.collect = () => {}; A.drawFree = () => {}; A.drawAfterLight = () => {};
  const off = time(60);
  Object.assign(A, keep);
  return { dust: A.dust.length, critters: A.critters.length, on: +on.toFixed(2), off: +off.toFixed(2) };
});
check('입자 수 상한(먼지 26, 쥐·벌레 소수)', perf.dust <= 26 && perf.critters <= 8, JSON.stringify(perf));
check('렌더 부담: 프레임당 추가 3ms 이하', perf.on - perf.off < 3, `${perf.on}ms vs ${perf.off}ms`);

// 일시정지(앱 전환으로 화면이 가려짐) 중에는 멈춤
const t1 = await page.evaluate(() => __game.ambient.t);
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(600);
const t2 = await page.evaluate(() => __game.ambient.t);
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
await page.waitForTimeout(300);
check('일시정지 중에는 움직이지 않음', Math.abs(t2 - t1) < 0.15, `${t1.toFixed(2)} → ${t2.toFixed(2)}`);

// 2층·환기구: 맵마다 다시 모으고 오류 없음(환기구는 창문이 없어 번개 없음)
await page.evaluate(() => __game.enterMap('main2f', 20.5, 10.5, 'down'));
await skipDialogs(page);
await page.waitForTimeout(500);
await page.evaluate(() => __game.enterMap('vent', 7.5, 11.5, 'up'));
await skipDialogs(page);
await page.waitForTimeout(500);
const vent = await page.evaluate(() => ({ windows: __game.ambient.windows.length, curtains: __game.ambient.curtains.length }));
check('환기구: 창문·커튼 없음(번개 없음)', vent.windows === 0 && vent.curtains === 0, JSON.stringify(vent));
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
