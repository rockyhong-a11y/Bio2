// 조작 방식: 버추얼 패드(반투명 버튼·라이터 그림) / 터치(버튼 없음 — 드래그 이동, 탭 조사, 더블 탭 지도, 트리플 탭 라이터, 길게 누르기 휴대폰)
// 실제 손가락 입력(CDP 터치 이벤트)으로 화면을 눌러 확인한다.
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, ctx, page, errors } = await openMobile();
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const tapAt = async (x, y, hold = 40) => { await touch('touchStart', x, y); await page.waitForTimeout(hold); await touch('touchEnd'); };
const taps = async (n, x = 195, y = 420, gap = 120, hold = 40) => { for (let i = 0; i < n; i++) { await tapAt(x, y, hold); if (i < n - 1) await page.waitForTimeout(gap); } };
// 입력이 낸 명령 기록(시각 포함)
const fired = () => page.evaluate(() => window.__fired.splice(0));
const free = () => page.evaluate(() => !__game.busy && !__game.ui.modalCount);
// 열린 화면 닫기(막 열린 화면은 0.2초 동안 탭을 무시하므로 닫힐 때까지 다시 누름)
const closeLayer = async () => {
  for (let i = 0; i < 10 && (await page.locator('#ui .layer').count()); i++) {
    await page.locator('#ui .layer .btn-close').last().dispatchEvent('pointerdown').catch(() => {});
    await page.waitForTimeout(150);
  }
};
const opt = async () => { // 옵션 → 조작 방식 한 번 바꾸기
  await page.keyboard.press('Escape');
  await page.waitForSelector('.phone-app');
  await page.waitForTimeout(300);
  await page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
  await page.waitForSelector('.opt-controls');
  await page.locator('.opt-controls').dispatchEvent('pointerdown');
  const label = await page.locator('.opt-controls').textContent();
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
  await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
  await page.waitForTimeout(200);
  return label;
};

await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);
await page.evaluate(() => {
  window.__fired = [];
  const set = __input.pressed, add = set.add.bind(set);
  set.add = n => { window.__fired.push([n, performance.now()]); return add(n); };
  if (!__game.has('lighter')) __game.inv.push('lighter');
  __game.player.x = 20.5; __game.player.y = 10.5; __game.player.dir = 'down'; // 1층 복도(조사할 것 없음)
});

// 1) 버추얼 패드(기본): 반투명 버튼, 누르는 동안 진하게, 라이터는 그림
const look = () => page.evaluate(() => {
  const op = s => +getComputedStyle(document.querySelector(s)).opacity;
  const img = document.querySelector('.btn-l img');
  return { a: op('.btn-a'), menu: op('.btn-menu'), map: op('.btn-map'), img: img ? { src: img.getAttribute('src'), ok: img.complete && img.naturalWidth > 0 } : null, b: !!document.querySelector('.btn-b') };
});
const L = await look();
check('패드: 조사·휴대폰·지도 버튼 반투명', L.a < 0.6 && L.menu < 0.6 && L.map < 0.6, JSON.stringify(L));
check('패드: 라이터 버튼은 라이터 그림(아이템 아이콘)', L.img?.ok && /item_lighter/.test(L.img.src), JSON.stringify(L.img));
check('패드: 달리기 버튼 없음', !L.b);
await page.evaluate(() => __game.ui.refreshHud(__game));
const pressedOpacity = await page.evaluate(async () => {
  const b = document.querySelector('.btn-a');
  b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await new Promise(r => setTimeout(r, 200));
  const o = +getComputedStyle(b).opacity;
  b.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  await new Promise(r => setTimeout(r, 200));
  return [o, +getComputedStyle(b).opacity];
});
check('패드: 누르는 동안만 진하게', pressedOpacity[0] > 0.95 && pressedOpacity[1] < 0.6, JSON.stringify(pressedOpacity));
await fired();
await taps(1, 300, 300); // 패드 방식: 화면 오른쪽 위를 탭해도 아무 명령 없음
await page.waitForTimeout(450);
check('패드: 빈 화면 탭은 명령 없음', (await fired()).length === 0);

// 2) 터치 방식으로 바꾸기
check('옵션: 조작 방식 → 터치', (await opt()) === '터치');
await page.touchscreen.tap(195, 420); // 키보드로 옵션을 열었으므로 화면 입력 방식으로 되돌림(이 탭도 조사로 들어감)
await page.waitForTimeout(500);
await fired();
const hidden = await page.evaluate(() => ['.btn-a', '.btn-l', '.btn-menu', '.btn-map'].every(s => getComputedStyle(document.querySelector(s)).display === 'none'));
const zone = await page.evaluate(() => { const r = document.querySelector('.pad-zone').getBoundingClientRect(); return [r.width, r.height, innerWidth, innerHeight]; });
check('터치: 화면 버튼 모두 숨김', hidden);
check('터치: 화면 전체가 입력 영역', zone[0] >= zone[2] - 1 && zone[1] >= zone[3] - 1, JSON.stringify(zone));

// 탭 = 조사(0.3초 뒤)
const t0 = await page.evaluate(() => performance.now());
await taps(1);
await page.waitForTimeout(150);
const early = await fired();
await page.waitForTimeout(350);
const one = await fired();
check('탭 → 조사, 0.3초 기다린 뒤(더블 탭과 구분)', early.length === 0 && one.length === 1 && one[0][0] === 'action' && one[0][1] - t0 >= 290, JSON.stringify(one.map(([n, t]) => [n, Math.round(t - t0)])));

// 더블 탭 = 지도
await taps(2);
await page.waitForTimeout(500);
const two = await fired();
check('더블 탭 → 지도(조사 없음)', two.length === 1 && two[0][0] === 'map' && (await page.locator('.map-layer').count()) === 1, JSON.stringify(two.map(f => f[0])));
await closeLayer();
await page.waitForTimeout(300);
// 손가락을 조금 오래(0.16초) 대고 0.22초 간격으로 두 번: 뗀 뒤 다음 닿기까지가 0.3초 안이면 더블 탭
await taps(2, 195, 420, 220, 160);
await page.waitForTimeout(500);
const slowTwo = await fired();
check('천천히 누른 더블 탭도 지도', slowTwo.map(f => f[0]).join() === 'map', JSON.stringify(slowTwo.map(f => f[0])));
await closeLayer();
await page.waitForTimeout(300);
// 탭 직후 드래그: 기다리던 탭(조사)이 먼저 확정되고 이동
await tapAt(195, 420);
await page.waitForTimeout(100);
await touch('touchStart', 195, 420);
for (let i = 1; i <= 4; i++) { await touch('touchMove', 195 + i * 15, 420); await page.waitForTimeout(16); }
const tapDrag = await fired();
await touch('touchEnd');
await page.waitForTimeout(400);
check('탭 직후 드래그: 조사 확정 후 이동', tapDrag.map(f => f[0]).join() === 'action' && (await fired()).length === 0, JSON.stringify(tapDrag.map(f => f[0])));

// 트리플 탭 = 라이터(켜기/끄기)
const lit0 = await page.evaluate(() => __game.lighter);
await taps(3);
await page.waitForTimeout(500);
const three = await fired();
const lit1 = await page.evaluate(() => __game.lighter);
check('트리플 탭 → 라이터(지도·조사 없음)', three.length === 1 && three[0][0] === 'lighter' && lit1 === !lit0 && (await page.locator('.map-layer').count()) === 0, JSON.stringify(three.map(f => f[0])));
await taps(3);
await page.waitForTimeout(500);
await fired();
check('트리플 탭 한 번 더 → 라이터 원래대로', (await page.evaluate(() => __game.lighter)) === lit0);

// 천천히 두 번 = 조사 두 번(지도 아님)
await taps(2, 195, 420, 450);
await page.waitForTimeout(500);
const slow = await fired();
check('간격이 길면 탭 두 번 = 조사 두 번', slow.map(f => f[0]).join() === 'action,action', JSON.stringify(slow.map(f => f[0])));

// 길게 누르기 = 휴대폰(떼어도 조사 없음)
await touch('touchStart', 195, 420);
await page.waitForTimeout(500);
const notYet = await page.locator('.menu-layer').count();
await page.waitForTimeout(250);
const opened = await page.locator('.menu-layer').count();
await touch('touchEnd');
await page.waitForTimeout(450);
const lp = await fired();
check('길게 누르기(0.6초) → 휴대폰 메뉴', notYet === 0 && opened === 1 && lp.map(f => f[0]).join() === 'menu', JSON.stringify(lp.map(f => f[0])));
await page.locator('.menu-layer .btn-close').last().dispatchEvent('pointerdown');
await page.waitForTimeout(300);
check('메뉴 닫힘', await free());

// 드래그 = 조이스틱(어디서든), 떼면 정지, 조사 없음. 끝까지 = 달리기, 조금 = 걷기
const drag = async (x, y, dx, ms) => {
  await page.evaluate(() => { __game.player.x = 20.5; __game.player.y = 10.5; });
  await touch('touchStart', x, y);
  for (let i = 1; i <= 4; i++) { await touch('touchMove', x + dx * i / 4, y); await page.waitForTimeout(16); }
  const base = await page.evaluate(() => document.querySelector('.pad-base').classList.contains('active'));
  await page.waitForTimeout(ms);
  const mid = await page.evaluate(() => ({ x: __game.player.x - 20.5, ix: __input.x }));
  await touch('touchEnd');
  await page.waitForTimeout(450);
  const after = await page.evaluate(() => ({ x: __game.player.x - 20.5, ix: __input.x, iy: __input.y }));
  return { base, mid, after, f: (await fired()).map(f => f[0]) };
};
const full = await drag(260, 300, 70, 450);
check('드래그(화면 위쪽 어디서든) → 이동', full.base && full.mid.x > 0.5 && full.mid.ix > 0.95, JSON.stringify(full.mid));
check('손을 떼면 정지, 조사 안 함', full.after.ix === 0 && full.after.iy === 0 && Math.abs(full.after.x - full.mid.x) < 0.25 && full.f.length === 0, JSON.stringify(full));
const part = await drag(100, 600, 26, 450);
check('조금만 끌면 걷기(느림)', part.mid.x > 0.1 && part.mid.x < full.mid.x * 0.7, `걷기 ${part.mid.x.toFixed(2)} / 달리기 ${full.mid.x.toFixed(2)}`);
const tiny = await drag(195, 420, 8, 100);
check('아주 조금(12px 미만) 움직인 손가락은 탭(조사)', !tiny.base && tiny.f.join() === 'action', JSON.stringify(tiny.f));

// 대사창이 떠 있을 때 탭은 대사 넘기기(조사 명령 아님)
await page.evaluate(() => { __game.ui.say?.('테스트', '대사 확인'); });
await page.waitForTimeout(300);
const hasDialog = await page.locator('.dialog-layer').count();
if (hasDialog) {
  await taps(1);
  await page.waitForTimeout(500);
  check('대사창 탭은 대사로(조사 명령 없음)', (await fired()).length === 0);
  await skipDialogs(page);
}

// 대사를 닫던 연타의 남은 탭: 다시 조사(같은 대사가 또 열림)·지도·라이터가 되지 않음 — 잠긴 문 앞에서
const toDoor = () => page.evaluate(() => {
  const g = __game, d = [...g.world.doors.values()].find(d => d.locked);
  for (const [dx, dy, dir] of [[0, 1, 'up'], [0, -1, 'down'], [1, 0, 'left'], [-1, 0, 'right']]) {
    g.player.x = d.x + 0.5 + dx * 0.9; g.player.y = d.y + 0.5 + dy * 0.9; g.player.dir = dir;
    const f = g.focus();
    if (f && f.kind === 'door' && f.d === d) return true;
  }
  return false;
});
check('잠긴 문 앞에 섬(조사 대상)', await toDoor());
await page.evaluate(() => { window.__opens = []; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains('layer')) __opens.push(n.className); }).observe(document.getElementById('ui'), { childList: true }); });
const opens = () => page.evaluate(() => __opens.splice(0));
const lit2 = await page.evaluate(() => __game.lighter);
for (const [n, gap] of [[2, 120], [2, 250], [3, 110], [4, 110]]) {
  await taps(1);
  await page.waitForTimeout(1500); // 조사 → 잠긴 문 대사가 다 나올 때까지
  const opened = (await opens()).some(c => c.includes('dialog-layer'));
  await fired();
  await taps(n, 195, 500, gap); // 첫 탭이 대사를 닫고 나머지는 남는 탭
  await page.waitForTimeout(900);
  const o = await opens(), f = await fired();
  const st = await page.evaluate(() => ({ layers: document.querySelectorAll('#ui > .layer').length, lighter: __game.lighter }));
  check(`대사를 닫던 ${n}연타(${gap}ms 간격)의 남은 탭은 무시`, opened && !o.length && !f.length && !st.layers && st.lighter === lit2, JSON.stringify({ opened, o, f, st }));
  await skipDialogs(page);
}
await page.waitForTimeout(500);
await taps(1);
await page.waitForTimeout(500);
const again = await fired();
check('닫고 잠시 뒤(0.5초) 탭은 다시 조사', again.map(x => x[0]).join() === 'action' && (await page.locator('.dialog-layer').count()) === 1, JSON.stringify(again));
await skipDialogs(page);
// 손가락을 오래(0.18초) 대고 0.24초 간격으로 4연타해 대사를 닫아도(남은 탭은 뗀 뒤 0.4초 안) 지도·라이터 없음
await page.waitForTimeout(500);
await taps(1);
await page.waitForTimeout(1500);
await opens(); await fired();
await taps(4, 195, 500, 240, 180);
await page.waitForTimeout(900);
const slowMash = { o: await opens(), f: await fired(), lighter: await page.evaluate(() => __game.lighter) };
check('느린 연타(0.18초 누름·0.24초 간격)로 대사를 닫아도 남은 탭 무시', !slowMash.o.length && !slowMash.f.length && slowMash.lighter === lit2, JSON.stringify(slowMash));
await skipDialogs(page);
// 대사를 닫고 0.3초 뒤 짧게 끌어 방향만 바꾼 다음 바로 탭: 끌기는 연타가 아니므로 그 뒤 탭은 조사
await page.waitForTimeout(500);
await taps(1);
await page.waitForTimeout(1500);
await opens(); await fired();
await taps(1, 195, 500);
await page.waitForTimeout(300);
await touch('touchStart', 195, 420);
for (let i = 1; i <= 4; i++) { await touch('touchMove', 195, 420 - i * 5); await page.waitForTimeout(16); }
await touch('touchEnd');
await page.waitForTimeout(100);
await toDoor();
await taps(1);
await page.waitForTimeout(500);
const afterFlick = (await fired()).map(x => x[0]);
check('닫은 뒤 짧게 끌고 바로 탭하면 조사(끌기는 연타 아님)', afterFlick.includes('action'), JSON.stringify(afterFlick));
await skipDialogs(page);
await page.evaluate(() => { __game.player.x = 20.5; __game.player.y = 10.5; __game.player.dir = 'down'; });

// 키보드를 쓴 뒤 첫 터치도 바로 동작(입력 방식이 키보드로 바뀌어도 조이스틱 영역은 남아 있음)
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(200);
const kbMode = await page.evaluate(() => document.body.className);
const firstDrag = await drag(260, 300, 70, 400);
check('키보드 뒤 첫 드래그로 바로 이동(터치)', /mode-key/.test(kbMode) && firstDrag.base && firstDrag.mid.x > 0.4, JSON.stringify({ kbMode, mid: firstDrag.mid }));
await page.keyboard.press('KeyX');
await page.waitForTimeout(200);
await taps(1);
await page.waitForTimeout(500);
check('키보드 뒤 첫 탭으로 바로 조사(터치)', (await fired()).map(x => x[0]).join() === 'action');
await skipDialogs(page);
// 방향키를 누른 채 화면을 탭해도 계속 이동(손을 떼면 누르고 있는 키로 돌아감)
await page.evaluate(() => { __game.player.x = 20.5; __game.player.y = 10.5; });
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(150);
await taps(1, 195, 300);
await page.waitForTimeout(400);
const held = await page.evaluate(() => ({ ix: __input.x, x: __game.player.x - 20.5 }));
await page.keyboard.up('ArrowRight');
await page.waitForTimeout(600);
await fired();
await skipDialogs(page);
check('방향키를 누른 채 화면을 탭해도 계속 이동', held.ix === 1 && held.x > 1, JSON.stringify(held));

// 다시 버추얼 패드로
check('옵션: 조작 방식 → 버추얼 패드', (await opt()) === '버추얼 패드');
await page.touchscreen.tap(300, 300);
await page.waitForTimeout(400);
check('패드: 버튼 다시 보임', await page.evaluate(() => getComputedStyle(document.querySelector('.btn-a')).display !== 'none'));
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(200);
const padFirst = await drag(80, 560, 60, 400);
check('패드: 키보드 뒤 첫 드래그(왼쪽 아래)로 바로 이동', padFirst.base && padFirst.mid.x > 0.4, JSON.stringify(padFirst.mid));
// 패드: 조사 버튼 자리(손가락) — 키보드 뒤 첫 탭도 바로 조사, 대사를 닫던 연타가 조사 버튼에 남아도 같은 대사가 다시 열리지 않음
const aBox = await page.evaluate(() => { const r = document.querySelector('.btn-a').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await toDoor();
await page.keyboard.press('ArrowLeft');
await toDoor();
await page.waitForTimeout(200);
await fired();
await tapAt(aBox[0], aBox[1]);
await page.waitForTimeout(300);
check('패드: 키보드 뒤 첫 탭(조사 버튼)으로 바로 조사', (await fired()).map(x => x[0]).join() === 'action' && (await page.locator('.dialog-layer').count()) === 1);
await page.waitForTimeout(1500);
await opens(); await fired();
for (let i = 0; i < 3; i++) { await tapAt(aBox[0], aBox[1]); await page.waitForTimeout(200); }
await page.waitForTimeout(700);
const padMash = { o: await opens(), f: (await fired()).map(x => x[0]) };
check('패드: 조사 버튼 위에서 대사를 연타로 닫아도 같은 대사가 다시 열리지 않음', !padMash.o.length && !padMash.f.length, JSON.stringify(padMash));
await skipDialogs(page);

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
