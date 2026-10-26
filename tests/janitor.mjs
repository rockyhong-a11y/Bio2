// 수위(이봉구) AI 검증: 순찰 · 시야 발견/추격 · 타격 피해 · 소음 반응 · 라이터 시야 · 화장실 칸 숨기
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await page.waitForTimeout(300);
// 프롤로그 건너뛰기: 대화창을 계속 넘김
if (!(await skipDialogs(page))) { console.log('FAIL 프롤로그를 넘기지 못함'); process.exit(1); }

// 공통 준비: 동쪽 복도, 수위 배치
async function setup(px, py, jx, jy, jdir, extra = '') {
  await page.evaluate(([px, py, jx, jy, jdir, extra]) => {
    const g = __game;
    g.flags.janitorOn = true; g.flags.headGhost = false;
    g.enterMap('main1f', px, py, 'left');
    g.hp = 100; g.lighter = false; g.player.hidden = false; g.player.visible = true;
    g.actors = [];
    const j = g.spawn({ id: 'bonggu', kind: 'janitor', x: jx, y: jy, dir: jdir, patrol: [[jx, jy], [jx - 10, jy]] });
    if (extra) eval(extra);
  }, [px, py, jx, jy, jdir, extra]);
}
const J = () => page.evaluate(() => { const j = __game.actor('bonggu'); return { x: j.x, y: j.y, state: j.state, hp: __game.hp }; });

// 1) 순찰: 플레이어가 멀리(서무실) 있을 때 경로를 따라 이동
await setup(31.5, 2.0, 45.5, 10.5, 'left');
const a0 = await J(); await page.waitForTimeout(2500); const a1 = await J();
check('순찰 이동', Math.hypot(a1.x - a0.x, a1.y - a0.y) > 1.5 && a1.state !== 'chase', `${a0.x.toFixed(1)}→${a1.x.toFixed(1)} ${a1.state}`);

// 2) 시야 발견 → 추격 (정면 4타일, 시야 확보)
await setup(41.5, 10.5, 45.5, 10.5, 'left');
await page.waitForTimeout(400);
check('정면 시야 발견 → 추격', (await J()).state === 'chase', (await J()).state);

// 3) 붙잡히면 타격(25) — 플레이어 정지
await page.waitForTimeout(3000);
const hp = (await J()).hp;
check('타격 피해 (25 단위)', hp < 100 && (100 - hp) % 25 === 0, `hp=${hp}`);

// 4) 등 뒤(시야 밖) 3타일: 걸으면 안 들키고, 달리면 소리로 조사하러 온다
const noise = await page.evaluate(() => {
  const g = __game, j = g.actor('bonggu'), p = g.player;
  j.state = 'patrol'; j.dir = 'left'; j.lookAng = 0; j.x = 40.5; j.y = 10.5; p.x = 43.5; p.y = 10.5; p.hidden = false;
  p.noise = 1.6; const walk = j.sees(g, p) || j.hears(g, p);
  p.noise = 6.5; const run = j.hears(g, p);
  return { walk, run };
});
check('등 뒤에서 걷기: 감지 안 됨', !noise.walk);
check('등 뒤에서 달리기: 소리로 감지', noise.run);

// 5) 라이터: 정면 8타일 — 끄면 안 보이고, 켜면 보인다
const lit = await page.evaluate(() => {
  const g = __game, j = g.actor('bonggu'), p = g.player;
  j.x = 44.5; j.y = 10.5; j.dir = 'left'; j.lookAng = 0; p.x = 36.5; p.y = 10.5;
  g.lighter = false; const off = j.sees(g, p);
  g.lighter = true; const on = j.sees(g, p);
  g.lighter = false;
  return { off, on };
});
check('라이터 꺼짐: 8타일 밖 미발견', !lit.off);
check('라이터 켜짐: 8타일에서 발견', lit.on);

// 6) 벽 너머는 못 본다 (학적부실 안 ↔ 복도)
const wall = await page.evaluate(() => {
  const g = __game, j = g.actor('bonggu'), p = g.player;
  j.x = 31.5; j.y = 9.6; j.dir = 'up'; p.x = 31.5; p.y = 6.5;
  g.setDoor(31, 8, 'closed');
  return j.sees(g, p);
});
check('닫힌 문/벽 너머 미발견', !wall);

// 7) 화장실 칸에 숨으면 수위가 화장실을 순찰해도 발견 못 함
await setup(30.5, 16.4, 32.5, 10.5, 'down');
await page.evaluate(() => {
  const g = __game; g.setDoor(32, 12, 'open');
  g.hide(30.5, 18.4);
  const j = g.actor('bonggu'); j.patrol = [[32.5, 14.5], [31.5, 16.2], [32.5, 10.5]]; j.state = 'patrol'; j.pi = 0; j.path = null;
});
await page.waitForTimeout(6000);
const hid = await J();
check('화장실 칸 숨기: 발견/피해 없음', hid.state !== 'chase' && hid.hp === 100, `${hid.state} hp=${hid.hp}`);

// 8) 추격 중 보는 앞에서 숨으면 들킨다
await setup(30.5, 16.4, 31.5, 14.5, 'down');
const caught = await page.evaluate(() => {
  const g = __game, j = g.actor('bonggu');
  g.setDoor(32, 12, 'open');
  j.state = 'chase'; j.dir = 'down';
  const ok = g.hide(30.5, 18.4);
  return { ok, hp: g.hp };
});
check('추격 중 눈앞에서 숨기 → 들킴', caught.ok === false && caught.hp === 75, JSON.stringify(caught));

// 추격 연출: 쫓기면 화면이 붉게 조여들고(라이트맵 비네트 + 붉은 안개 레이어), 벗어나면 원래대로
const look = await page.evaluate(() => {
  const g = __game, el = document.querySelector('.danger');
  g.qaSafe = true; g.paused = true; g.t = 12.15;
  const W = g.canvas.width, H = g.canvas.height, band = Math.round(H * 0.12);
  const tone = () => { // 비네트가 작용하는 위아래 가장자리 띠의 붉은 정도(빨강 ÷ 초록)
    g.render(0);
    let r = 0, gr = 0;
    for (const y of [0, H - band]) {
      const d = g.ctx.getImageData(0, y, W, band).data;
      for (let i = 0; i < d.length; i += 4 * 7) { r += d[i]; gr += d[i + 1]; }
    }
    return +(r / gr).toFixed(3);
  };
  const fog = () => ({ a: +el.style.opacity, beat: el.style.getPropertyValue('--beat'), on: el.classList.contains('on') });
  g.danger = 0; g.ui.danger(0); const safe = tone(), fSafe = fog();
  g.danger = 1; g.ui.danger(1); const chase = tone(), fChase = fog();
  g.danger = 0; g.ui.danger(0); const back = tone(), fBack = fog();
  g.paused = false;
  return { safe, chase, back, fSafe, fChase, fBack };
});
check('추격 중 화면이 붉게 조여들고 벗어나면 돌아옴', look.chase > look.safe * 1.03 && Math.abs(look.back - look.safe) < 0.005, JSON.stringify([look.safe, look.chase, look.back]));
check('붉은 안개가 추격 중에만 켜지고 심장 박동 박자를 따라감', !look.fSafe.on && look.fChase.on && look.fChase.a > look.fSafe.a
  && parseFloat(look.fChase.beat) < parseFloat(look.fSafe.beat) && !look.fBack.on, JSON.stringify([look.fSafe, look.fChase, look.fBack]));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
