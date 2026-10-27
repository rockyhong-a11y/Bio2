// 설정(휴대폰 메뉴 → 옵션): 달리기는 스틱 세기로 자동(옵션 없음) · 조작 방식 · 조작 도움말 · 화면 확대(0.2배 단위) · 그래픽 필터 · 밝기, 다시 열어도 유지
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
  await page.waitForSelector('.opt-zoomin');
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
// 3) 화면 확대: 1배(기본, 가로 9칸) ~ 6배를 ◀ ▶ 로 0.2배씩. 그림 z배, 보이는 폭 1/z, 다시 열어도 유지
const view = () => page.evaluate(() => ({ scale: __game.scale, w: __game.cam.w, h: __game.cam.h, smooth: (__game.render(0), __game.ctx.imageSmoothingEnabled) }));
// 옵션 안에서 ▶(d=1)/◀(d=-1)를 n번 눌러 배율을 옮기고 마지막 라벨을 돌려준다
const zoomBy = (d, n = 1) => inOptions(async () => {
  const sel = d > 0 ? '.opt-zoomin-next' : '.opt-zoomin-prev';
  for (let i = 0; i < n; i++) await page.locator(sel).dispatchEvent('pointerdown');
  return page.locator('.opt-zoomin').textContent();
});
const v1 = await view();
check('화면 확대 기본 1배(가로 9칸, 선명한 도트)', Math.abs(v1.w - 9 * 32) < 0.5 && !v1.smooth, JSON.stringify(v1));
check('화면 축소 옵션은 없어짐', (await inOptions(() => page.locator('.opt-zoom').count())) === 0);

// 0.2배 단위
const fine = [];
for (let i = 0; i < 3; i++) fine.push({ label: await zoomBy(1), v: await view() });
check('0.2배 단위로 올라감(1.2 → 1.4 → 1.6배)', fine.map(f => f.label).join(',') === '1.2배,1.4배,1.6배'
  && fine.every((f, i) => Math.abs(f.v.scale / v1.scale - (1.2 + i * 0.2)) < 0.01), fine.map(f => f.label).join(','));
check('확대해도 도트는 선명(보간 없음)', fine.every(f => !f.v.smooth));
check('◀로 0.2배 내려감(1.6 → 1.4배)', (await zoomBy(-1)) === '1.4배' && Math.abs((await view()).scale / v1.scale - 1.4) < 0.01);

// 정수 배율: 그림 z배, 보이는 폭 1/z
for (const [z, n] of [[2, 3], [4, 10], [6, 10]]) {
  const label = await zoomBy(1, n);
  const v = await view();
  check(`화면 확대 ${z}배: 그림 ${z}배, 보이는 폭 1/${z}`, label === `${z}배` && Math.abs(v.scale / v1.scale - z) < 0.01 && Math.abs(v.w - v1.w / z) < 0.5 && !v.smooth, `${label} 폭 ${(v.w / 32).toFixed(2)}칸`);
}
const centeredIn = await page.evaluate(async () => {
  const g = __game; g.player.x = 20.5; g.player.y = 10.5;
  await new Promise(r => setTimeout(r, 1200));
  return Math.abs(g.player.x * 32 - g.cam.x - g.cam.w / 2);
});
check('확대 6배: 플레이어가 화면 가운데', centeredIn < 2, `${centeredIn.toFixed(2)}px`);
await page.reload();
await start();
check('다시 열어도 확대 6배 유지', Math.abs((await view()).scale / v1.scale - 6) < 0.01 && (await saved()).zoomIn === 6);
check('다시 열어도 터치 조작 유지', /ctl-touch/.test((await ctl()).cls));
check('끝(6배)에서 ▶ 한 번 더 = 1배로', (await zoomBy(1)) === '1배' && Math.abs((await view()).scale - v1.scale) < 0.01 && (await saved()).zoomIn === 1);
check('1배에서 ◀ = 6배로(거꾸로 한 바퀴)', (await zoomBy(-1)) === '6배' && Math.abs((await view()).scale / v1.scale - 6) < 0.01);
await zoomBy(1); // 1배로 되돌려 둔다
check('터치 → 버추얼 패드로 되돌리기', (await inOptions(() => press('.opt-controls'))) === '버추얼 패드' && /ctl-pad/.test((await ctl()).cls));

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
// 4-1) 밝기: 5단계 순환, 어두운 곳만 밝아지고 게임 규칙(빛 웅덩이·수위 시야)은 그대로
const brightNames = await inOptions(async () => {
  const seen = [await page.locator('.opt-bright').textContent()];
  for (let i = 0; i < 5; i++) { await page.locator('.opt-bright').dispatchEvent('pointerdown'); seen.push(await page.locator('.opt-bright').textContent()); }
  return seen;
});
check('밝기: 5단계를 한 바퀴 돌아 제자리', brightNames[0] === '기본' && brightNames[5] === '기본' && new Set(brightNames.slice(0, 5)).size === 5, brightNames.join(','));

// 어두운 화면이 실제로 밝아지는가 — 캔버스 전체 평균 밝기로 본다(암부·비네트만 바뀜)
const lum = await page.evaluate(async () => {
  const g = __game, s = (await import('./js/settings.js')).settings;
  const avg = () => {
    g.render(0);
    const d = g.ctx.getImageData(0, 0, g.canvas.width, g.canvas.height).data;
    let sum = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 97) { sum += d[i] + d[i + 1] + d[i + 2]; n++; }
    return sum / n / 3;
  };
  const out = [];
  for (const b of [0, 2, 4]) { s.bright = b; out.push(avg()); }
  s.bright = 2;
  return out;
});
check('밝기를 올리면 어두운 화면이 실제로 밝아진다', lum[0] < lum[1] && lum[1] < lum[2], lum.map(v => v.toFixed(1)).join(' < '));

// 규칙 불변: 플레이어 빛 웅덩이(맨눈·라이터)의 크기·세기는 밝기와 무관 — 밝기는 보이기만 바꾼다
const rules = await page.evaluate(async () => {
  const g = __game, s = (await import('./js/settings.js')).settings, was = g.lighter;
  g.lighter = true;
  const snap = () => JSON.stringify(g.lights().slice(0, 2).map(l => [l.r, l.color]));
  s.bright = 0; const dark = snap();
  s.bright = 4; const lit = snap();
  s.bright = 2; g.lighter = was;
  return { same: dark === lit, snap: dark };
});
check('밝기는 빛 웅덩이·수위 시야(게임 규칙)를 바꾸지 않는다', rules.same, JSON.stringify(rules));

await page.reload();
await start();
check('다시 열어도 밝기 유지(기본)', (await saved()).bright === 2 && (await page.evaluate(async () => (await import('./js/settings.js')).settings.bright)) === 2);

// 5) 크게 확대해도 머리 위 조사 표시(?)가 HUD 아래 화면 안에 보임(발 기준이면 4~6배에서 화면 밖), 발도 화면 안. 1·2배 구도는 그대로
const frame = () => page.evaluate(async () => {
  const g = __game, s = (await import('./js/settings.js')).settings, out = [];
  g.player.x = 20.5; g.player.y = 10.5;
  for (const z of [1, 2, 3, 4, 5, 6]) {
    s.zoomIn = z; g.resize(); g.snapCamera();
    await new Promise(r => setTimeout(r, 120));
    const k = g.scale / Math.min(2, devicePixelRatio), feet = (g.player.y * 24 - g.cam.y) * k, bubble = (g.player.y * 24 - 52 - g.cam.y) * k;
    const fits = (54 + 72 / k) <= g.cam.h - 2; // 표시 + HUD가 화면 높이에 들어갈 수 있는 배율인가
    const old = g.player.y * 24 - g.cam.h * (g.canvas.width > g.canvas.height ? 0.5 : 0.42); // 예전(발 기준) 카메라 목표
    out.push({ z, bubble: Math.round(bubble), feet: Math.round(feet), H: innerHeight, fits, same: Math.abs(g.camTargetY(g.player) - old) < 0.01 });
  }
  s.zoomIn = 1; g.resize(); g.snapCamera();
  return out;
});
for (const vp of [{ width: 390, height: 664 }, { width: 844, height: 390 }]) {
  await page.setViewportSize(vp);
  await page.waitForTimeout(400);
  const F = await frame(), tag = vp.width > vp.height ? '가로' : '세로';
  const bad = F.filter(f => f.feet > f.H || f.feet < 0 || (f.fits && f.bubble < 71));
  check(`${tag} 확대 1~6배: 조사 표시가 HUD 아래(들어갈 수 있으면)·발은 화면 안`, !bad.length, JSON.stringify(bad.length ? bad : F.map(f => [f.z, f.bubble, f.feet])));
  check(`${tag} 1배 구도 그대로(플레이어 ${tag === '세로' ? '조금 위' : '가운데'} — 카메라 목표가 예전과 같음)`, F[0].same, JSON.stringify(F[0]));
}
// 5-1) 가로 4·6배: 아래로 달리는 동안(카메라가 늦게 따라와도) 발이 화면 밖으로 나가지 않음
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(400);
const southRun = await page.evaluate(async () => {
  const g = __game, I = __input, s = (await import('./js/settings.js')).settings, w = g.world, out = [];
  let col = null; // 아래로 6칸 막힘 없는 자리
  for (let r = 1; r < w.rows - 7 && !col; r++) for (let c = 1; c < w.cols - 1 && !col; c++) {
    let ok = true;
    for (let i = 0; i < 7 && ok; i++) ok = !w.blocked(c + 0.5, r + i + 0.5, 0.3);
    if (ok) col = [c + 0.5, r + 0.5];
  }
  for (const z of [4, 6]) {
    s.zoomIn = z; g.resize();
    g.player.x = col[0]; g.player.y = col[1]; g.snapCamera();
    const y0 = g.player.y, k = g.scale / Math.min(2, devicePixelRatio);
    let worst = -1e9;
    I.x = 0; I.y = 1;
    const t0 = performance.now();
    while (performance.now() - t0 < 900) {
      await new Promise(r => requestAnimationFrame(r));
      worst = Math.max(worst, (g.player.y * 24 - g.cam.y) * k);
    }
    I.y = 0;
    out.push({ z, moved: +(g.player.y - y0).toFixed(2), worstFeet: Math.round(worst), H: innerHeight });
  }
  s.zoomIn = 1; g.resize(); g.snapCamera();
  return { col, out };
});
check('가로 확대 4·6배: 아래로 달려도 발이 화면 안', southRun.col && southRun.out.every(o => o.moved > 2 && o.worstFeet <= o.H), JSON.stringify(southRun));
await page.setViewportSize({ width: 390, height: 664 });
await page.waitForTimeout(300);

// ---- 조작 도움말: 기본 켜짐, 끄면 안내 글자만 사라지고 버튼·조이스틱 영역은 그대로
const hintState = () => page.evaluate(() => {
  const vis = sel => { const e = document.querySelector(sel); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const box = sel => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  return { line: vis('.hints'), touch: vis('.k-touch'), vpad: vis('.k-vpad'), key: vis('.k-key'),
    btnA: box('.btn-a'), pad: box('.pad-zone'), btnMap: box('.btn-map'),
    on: JSON.parse(localStorage.getItem('wd_topview_settings_v1') || '{}').hints };
});
const hOn = await hintState();
check('조작 도움말이 기본으로 켜져 있다(버추얼 패드 안내가 보인다)', hOn.line && hOn.vpad && !hOn.touch, JSON.stringify(hOn));
const hLabel = await inOptions(() => press('.opt-hints'));
const hOff = await hintState();
check('끄면 안내 글자가 사라진다', hLabel.trim() === '꺼짐' && !hOff.line && !hOff.vpad, hLabel + ' ' + JSON.stringify(hOff));
check('버튼·조이스틱 자리는 그대로다(조작성 유지)',
  JSON.stringify([hOff.btnA, hOff.pad, hOff.btnMap]) === JSON.stringify([hOn.btnA, hOn.pad, hOn.btnMap]),
  JSON.stringify([hOn.btnA, hOff.btnA]));
await page.reload();
await start();
const hKept = await hintState();
check('다시 열어도 꺼진 채로 유지된다', hKept.on === false && !hKept.line, JSON.stringify(hKept));
await inOptions(() => press('.opt-hints')); // 되돌리기
// 터치 조작에서는 제스처 안내가 나온다
await inOptions(async () => { await press('.opt-controls'); });
const hTouch = await hintState();
check('터치 조작에서는 제스처 안내로 바뀐다', hTouch.line && hTouch.touch && !hTouch.vpad, JSON.stringify(hTouch));
await inOptions(() => press('.opt-controls'));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
