// 복셀 연출(js/voxel.js): 강제 연출 구간에서 탑다운 대신 복셀 3D가 나오는지, 카메라가 대상을 잡는지,
// 프레임 부담이 상한 안인지, 갤러리에서 다시 볼 수 있는지.
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(400);

// ---------- 1) 갤러리: 연출 목록이 있고, 하나를 열면 복셀 화면이 돈다
await page.locator('.title-btn', { hasText: '갤러리' }).dispatchEvent('pointerdown');
await page.waitForSelector('.gallery-vox');
await page.waitForTimeout(400); // .layer 는 열린 뒤 200ms 동안 입력을 막는다
const listed = await page.locator('.gallery-vox').count();
const defs = await page.evaluate(async () => (await import('../data/cinema.js')).CINEMA.map(d => d.id));
check('갤러리에 연출 목록이 있다', listed > 0 && listed === defs.length, `${listed}개`);
check('연출 id 가 겹치지 않는다', new Set(defs).size === defs.length);

await page.locator('.gallery-vox').first().dispatchEvent('pointerdown');
await page.waitForSelector('.vox-cv', { timeout: 5000 });
await page.waitForTimeout(900);
const lit = await page.evaluate(() => {
  const c = document.querySelector('.vox-cv');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let on = 0, n = 0;
  for (let i = 0; i < d.length; i += 4 * 53) { if (d[i] + d[i + 1] + d[i + 2] > 60) on++; n++; }
  return { w: c.width, h: c.height, lit: +(on / n).toFixed(3) };
});
check('연출을 열면 복셀 화면이 그려진다(검은 화면 아님)', lit.w > 0 && lit.lit > 0.05, JSON.stringify(lit));
await page.locator('.vox-view .title-btn').dispatchEvent('pointerdown');
await page.waitForTimeout(300);
check('닫으면 갤러리로 돌아온다', (await page.locator('.gallery-vox').count()) === listed);

// ---------- 2) 모든 연출이 오류 없이 장면을 세운다(대상이 화면 안에 들어오는지까지)
const all = await page.evaluate(async () => {
  const [{ CINEMA }, { World }, { Actor, Janitor, Ghost }, { Voxel, PRESETS }] = await Promise.all([
    import('../data/cinema.js'), import('./js/world.js'), import('./js/actors.js'), import('./js/voxel.js'),
  ]);
  const stub = { flags: {}, has: () => false, count: () => 0, doorState: (i, d) => ({ open: !!d.open, locked: d.locked }) };
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 160;
  const ctx = cv.getContext('2d');
  const out = [];
  for (const def of CINEMA) {
    try {
      const world = new World(__game.ui.story.maps[def.map], stub);
      const g = {
        world, mapId: def.map, lighter: false, view: {},
        player: new Actor({ x: def.me[0], y: def.me[1], dir: def.me[2], skin: 'heemin' }),
        actors: (def.cast || []).map(a => new (a.skin === 'janitor' ? Janitor : a.sprite ? Ghost : Actor)({ ...a })),
      };
      const vox = new Voxel();
      vox.set(true, def.shot, g, def.at);
      vox.t = 3.5;
      const t0 = performance.now();
      for (let i = 0; i < 8; i++) vox.draw(ctx, g, 1 / 30);
      const ms = (performance.now() - t0) / 8;
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let on = 0, n = 0;
      for (let i = 0; i < d.length; i += 4 * 17) { if (d[i] + d[i + 1] + d[i + 2] > 60) on++; n++; }
      out.push({ id: def.id, shot: def.shot, okShot: !!PRESETS[def.shot], faces: vox.faces.length + vox.act.length, lit: +(on / n).toFixed(3), ms: +ms.toFixed(2) });
    } catch (e) { out.push({ id: def.id, err: String(e).slice(0, 120) }); }
  }
  return out;
});
const bad = all.filter(r => r.err);
check('연출을 전부 오류 없이 세운다', !bad.length, JSON.stringify(bad.slice(0, 2)));
check('프리셋 이름이 전부 실재한다', all.every(r => r.err || r.okShot), all.filter(r => !r.err && !r.okShot).map(r => r.shot).join(','));
const dark = all.filter(r => !r.err && r.lit < 0.04);
check('연출마다 화면에 무언가 보인다(암전 아님)', !dark.length, dark.map(r => `${r.id} ${r.lit}`).join(', '));
const heavy = all.filter(r => !r.err && r.ms > 12);
check('프레임 12ms 이하', !heavy.length, all.map(r => r.ms).filter(Boolean).sort((a, b) => b - a).slice(0, 3).join(' / ') + 'ms');
const big = all.filter(r => !r.err && r.faces > 12000);
check('면 수가 예산(12000) 안', !big.length, Math.max(...all.map(r => r.faces || 0)) + '개');

// ---------- 3) 게임 안: cinema(true) 로 복셀, cinema(false) 로 탑다운
await page.locator('.vox-view .btn-close, .gallery-layer .btn-close').first().dispatchEvent('pointerdown').catch(() => {});
await page.waitForTimeout(300);
await page.reload();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);
const live = await page.evaluate(async () => {
  const g = __game;
  g.qaSafe = true; g.player.x = 19.5; g.player.y = 10.5; g.snapCamera();
  const grab = () => { g.render(0); g.render(0); const d = g.ctx.getImageData(0, 0, g.canvas.width, g.canvas.height).data; let s = 0; for (let i = 0; i < d.length; i += 4 * 97) s += d[i] + d[i + 1] + d[i + 2]; return s; };
  const api = g.api();
  const flat = grab();
  api.cinema(true, 'dutch');
  const on = g.vox.active, voxPix = grab();
  api.cinema(false);
  const off = g.vox.active, back = grab();
  // 비·먼지 같은 움직이는 배경 때문에 프레임 합이 매번 똑같지는 않다 — '복셀보다 탑다운에 가까운가'로 본다
  return { on, off, flat, voxPix, back, same: Math.abs(back - flat) < Math.abs(back - voxPix) };
});
check('cinema(true) 가 복셀 화면을 켠다', live.on === true && live.voxPix > 0);
check('cinema(false) 가 탑다운으로 돌아온다', live.off === false && live.same, JSON.stringify([live.flat, live.voxPix, live.back]));
check('복셀 화면은 탑다운과 다른 그림이다', Math.abs(live.voxPix - live.flat) / Math.max(1, live.flat) > 0.1);

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const fail = results.filter(r => !r).length;
console.log(`\n${results.length - fail}/${results.length} PASS`);
process.exit(fail ? 1 : 0);
