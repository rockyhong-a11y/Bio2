// 2장 규칙 검증: 동행 히로인 짜증(멀리 두고 감·몸으로 막음·말 반복·계단 혼자 이동·앞장설 때 앞지름, 쿨다운, 수위 추격 중 면제),
// 문 열고 따라오기·잠긴 문 너머로 옮겨 붙기·저장 복원, 그리고 실패 조건(교장실 문을 열어 둔 채 서랍 → 수위 난입,
// 인형 없이 아기 접근 → 즉사, 5분 초과 → 게임오버·체크포인트, 틀린 개수대·틀린 연주, 의자 막힘 → 제자리로)
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const { browser, page, errors } = await openMobile();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);
await page.evaluate(() => {
  const g = __game;
  Object.assign(g.flags, { route: 'B', ch1Clear: 'B', janitorOn: true, headGhost: true });
  g.give('lighter');
  g.qaSafe = true;
  g.run('ch2Start');
});
await page.waitForTimeout(300);
await skipDialogs(page, 400);

const st = () => page.evaluate(() => {
  const g = __game, a = g.actor('soyoung');
  return { strikes: g.flags.strikes_soyoung || 0, aff: g.flags.aff_soyoung || 0, map: g.mapId, d: a ? Math.hypot(a.x - g.player.x, a.y - g.player.y) : null, busy: g.busy, text: document.querySelector('.dialog-text')?.textContent || '', toast: [...document.querySelectorAll('.toast')].map(t => t.textContent).join('|') };
});
const frames = ms => page.waitForTimeout(ms);
// 대사창이 뜰 때까지(최대 ms) 기다렸다가 내용을 돌려준다
const waitDialog = async (ms = 6000) => { await page.waitForSelector('.dialog-text', { timeout: ms }).catch(() => {}); await frames(700); return st(); };
// 대사(글자가 다 찍힌 상태)·선택지(첫 번째)·문서를 한 번씩 눌러 넘긴다 — 이미 닫힌 창을 다시 누르며 기다리지 않게
const skip = async (max = 100) => {
  for (let i = 0; i < max; i++) {
    const t = await page.evaluate(() => ({ busy: __game.busy, cls: [...document.querySelectorAll('#ui .layer')].pop()?.className || '', age: (() => { const l = [...document.querySelectorAll('#ui .layer')].pop(); return l ? performance.now() - Number(l.dataset.t0) : 1e9; })() }));
    if (!t.cls && !t.busy) return;
    if (t.age < 250) { await frames(260 - t.age); continue; }
    if (t.cls.includes('dialog-layer')) await page.locator('.dialog-layer').dispatchEvent('pointerdown', {}, { timeout: 1000 }).catch(() => {});
    else if (t.cls.includes('choice-layer')) await page.locator('.choice-opt').first().dispatchEvent('pointerdown', {}, { timeout: 1000 }).catch(() => {});
    else if (t.cls.includes('doc-layer')) await page.locator('.doc .btn-close').dispatchEvent('pointerdown', {}, { timeout: 1000 }).catch(() => {});
    await frames(120);
  }
};
const answer = async idx => { await page.waitForSelector('.choice-opt'); await frames(260); await page.locator('.choice-opt').nth(idx).dispatchEvent('pointerdown'); };

// ---------------- 멀리 두고 감: 6칸 넘게 3초 → 짜증 1(호감도 -1), 대사 + 토스트
await page.evaluate(() => { const g = __game, a = g.actor('soyoung'); g.enterMap('main2_1f', 14.5, 10.5, 'right'); });
await frames(200);
await page.evaluate(() => { const a = __game.actor('soyoung'); a.x = 3.5; a.y = 10.5; a.cool = 0; });
const keepAway = (ms, gap) => page.evaluate(([ms, gap]) => new Promise(done => {
  const g = __game, t0 = performance.now();
  const tick = () => {
    const a = g.actor('soyoung');
    if (performance.now() - t0 > ms || g.busy) return done();
    g.player.x = Math.min(38, a.x + gap); g.player.y = 10.5;
    requestAnimationFrame(tick);
  };
  tick();
}), [ms, gap]);
await keepAway(4500, 9);
let s = await waitDialog();
check('멀리 두고 가면(6칸 넘게 3초) 짜증 +1, 호감도 -1', s.strikes === 1 && s.aff === -1 && s.text.includes('혼자'), JSON.stringify(s));
await skip();
await frames(300);
s = await st();
check('짜증 토스트 표시', s.toast.includes('기분이 상했다'), s.toast);

// ---------------- 쿨다운: 짜증 직후 10초 안에는 또 짜증 내지 않음
await keepAway(4000, 9);
await frames(300);
s = await st();
check('쿨다운: 10초 안에 다시 멀어져도 추가 짜증 없음', s.strikes === 1 && !s.busy, JSON.stringify(s));

// ---------------- 수위 추격 중에는 '멀리 두고 감' 면제
await page.evaluate(() => {
  const g = __game, a = g.actor('soyoung');
  a.cool = 0; a.farT = 0;
  const j = g.spawn({ id: 'bonggu', kind: 'janitor', x: 37, y: 10.5 });
  j.state = 'chase'; j.lastSeen = [37, 10.5];
});
await keepAway(4500, 9);
await frames(300);
s = await st();
check('수위에게 쫓기는 중에는 앞서 뛰어도 짜증 없음', s.strikes === 1 && !s.busy, JSON.stringify(s));
await page.evaluate(() => __game.despawn('bonggu'));

// ---------------- 몸으로 막고 밀침: 0.6칸 안에 2.5초
await page.evaluate(() => new Promise(done => {
  const g = __game, a = g.actor('soyoung'), t0 = performance.now();
  a.cool = 0; a.blockT = 0; a.farT = 0;
  const tick = () => { if (performance.now() - t0 > 3200 || g.busy) return done(); g.player.x = a.x + 0.2; g.player.y = a.y; requestAnimationFrame(tick); };
  tick();
}));
s = await waitDialog();
check('몸으로 막고 계속 부딪히면 짜증 +1', s.strikes === 2 && s.text.includes('비켜'), JSON.stringify(s));
await skip();

// ---------------- 말 반복: 20초 안에 세 번 → 세 번째에 짜증. 첫 번째는 지금 목표를 알려 줌
await page.evaluate(() => { __game.flags.objective = '테스트 목표'; __game.ui.objective('테스트 목표'); });
const talk = () => page.evaluate(() => { const g = __game, a = g.actor('soyoung'); g.player.x = a.x; g.player.y = a.y + 1; g.player.dir = 'up'; g.act(); });
await talk();
s = await waitDialog();
check('말 걸기 1번째: 지금 목표를 알려 줌(짜증 없음)', s.text.includes('테스트 목표') && s.strikes === 2, s.text);
await skip();
await talk();
s = await waitDialog();
check('말 걸기 2번째: 짧은 대답', s.text.includes('듣고 있어') && s.strikes === 2, s.text);
await skip();
await talk();
s = await waitDialog();
check('말 걸기 3번째(20초 안): 짜증 +1', s.strikes === 3 && s.text.includes('그만'), JSON.stringify(s));
await skip();

// ---------------- 조사 우선순위: 동행이 바로 앞에 있어도 문 조사가 먼저
const focus = await page.evaluate(() => {
  const g = __game, a = g.actor('soyoung');
  g.player.x = 9.5; g.player.y = 9.4; g.player.dir = 'up';
  a.x = 9.5; a.y = 8.9; a.follow = false;
  const f = g.focus(); a.follow = true;
  return f?.kind;
});
check('동행이 문 앞에 서 있어도 조사 = 문(실수로 말 걸지 않음)', focus === 'door', focus);

// ---------------- 계단: 동행을 멀리 두고 계단을 오르면 도착 후 짜증, 동행은 옆에 다시 나타남
await page.evaluate(() => { const g = __game, a = g.actor('soyoung'); Object.assign(g.flags, { seen22: true, seen23: true, seen24: true }); a.x = 30.5; a.y = 10.5; a.follow = false; g.player.x = 2; g.player.y = 2.4; g.player.dir = 'up'; });
await page.evaluate(() => { __game.actor('soyoung').follow = true; __game.player.y = 1.5; });
s = await waitDialog(8000);
check('동행을 멀리 두고 계단 이동 → 도착 후 짜증 +1, 동행은 곁에', s.map === 'main2_2f' && s.strikes === 4 && s.d < 2 && s.text.includes('혼자'), JSON.stringify(s));
await skip();

// ---------------- 닫힌 문은 열고 따라온다 / 잠긴 문 너머로는 옮겨 붙는다
await page.evaluate(() => {
  const g = __game, a = g.actor('soyoung');
  g.setDoor(9, 8, 'closed');
  a.x = 9.5; a.y = 10.5; a.path = null; a.cool = 99;
  g.player.x = 9.5; g.player.y = 2.5;
});
await frames(2500);
const door = await page.evaluate(() => ({ open: __game.world.door(9, 8).open, flag: __game.flags['door:main2_2f:9,8'], d: Math.hypot(__game.actor('soyoung').x - __game.player.x, __game.actor('soyoung').y - __game.player.y) }));
check('닫힌 문(잠기지 않음)은 열고 따라 들어온 뒤 다시 닫음', !door.open && door.flag === 'closed' && door.d < 1.6, JSON.stringify(door));
await page.evaluate(() => { const g = __game, a = g.actor('soyoung'); a.x = 30.5; a.y = 10.5; a.path = null; g.player.x = 33.5; g.player.y = 15.5; });
await frames(600);
const locked = await page.evaluate(() => ({ locked: !!__game.world.door(35, 12).locked, d: Math.hypot(__game.actor('soyoung').x - __game.player.x, __game.actor('soyoung').y - __game.player.y) }));
check('잠긴 문 너머(길 없음)면 플레이어 곁으로 옮겨 붙고, 문은 그대로 잠김', locked.locked && locked.d < 1.5, JSON.stringify(locked));

// ---------------- 앞장설 때 앞질러 가면 짜증
await page.evaluate(() => { const g = __game, a = g.actor('soyoung'); g.player.x = 4.5; g.player.y = 10.5; a.x = 3.5; a.y = 10.4; a.cool = 0; a.lead = [[18.5, 10.2], [18.5, 9.5]]; a.onLead = null; });
await page.evaluate(() => new Promise(done => {
  const g = __game, a = g.actor('soyoung'), t0 = performance.now();
  const tick = () => { if (performance.now() - t0 > 2600 || g.busy) return done(); g.player.x = Math.min(17, a.x + 2.5); g.player.y = 10.3; requestAnimationFrame(tick); };
  tick();
}));
s = await waitDialog();
check('앞장선 동행을 앞질러 가면 짜증 +1', s.strikes === 5 && s.text.includes('앞서'), JSON.stringify(s));
await skip();
await page.evaluate(() => { const a = __game.actor('soyoung'); a.lead = null; });

// ---------------- 키보드·방향패드(늘 달리기)로 다녀도 동행이 처지지 않음
const run1 = await page.evaluate(async () => {
  const g = __game, a = g.actor('soyoung'), I = __input;
  g.player.x = 8.5; g.player.y = 10.4; a.x = 3.5; a.y = 10.4; a.cool = 0; a.path = null; a.farT = 0;
  const s0 = g.flags.strikes_soyoung || 0, d0 = Math.hypot(a.x - g.player.x, a.y - g.player.y);
  I.x = 1; I.y = 0;
  await new Promise(r => setTimeout(r, 2000));
  I.x = 0;
  return { d0: +d0.toFixed(2), d1: +Math.hypot(a.x - g.player.x, a.y - g.player.y).toFixed(2), moved: +(g.player.x - 8.5).toFixed(2), strikes: (g.flags.strikes_soyoung || 0) - s0 };
});
check('달리는 플레이어를 동행이 따라잡음(5칸 뒤에서 2초 달려도 거리가 늘지 않음, 짜증 없음)', run1.moved > 6 && run1.d1 <= run1.d0 && run1.strikes === 0, JSON.stringify(run1));

// ---------------- 동행이 앞장서는 동안은 끝까지 눌러도 뒤에 붙어 걷기, 수위에게 쫓기면 달릴 수 있음
const esc = await page.evaluate(async () => {
  const g = __game, a = g.actor('soyoung'), I = __input, wait = ms => new Promise(r => setTimeout(r, ms));
  g.player.x = 4.5; g.player.y = 10.4; a.x = 9.5; a.y = 10.4; a.cool = 0; a.lead = [[18.5, 10.2]]; a.onLead = null;
  const s0 = g.flags.strikes_soyoung || 0;
  I.x = 1; I.y = 0;
  await wait(300);
  const walkNoise = g.player.noise, x0 = g.player.x;
  await wait(400);
  const sp = (g.player.x - x0) / 0.4;
  const j = g.spawn({ id: 'qa_j2', kind: 'janitor', x: 1.5, y: 10.4, dir: 'right', patrol: [[1.5, 10.4], [2.5, 10.4]] });
  j.state = 'chase';
  await wait(120);
  const runNoise = g.player.noise, chase = j.state;
  I.x = 0;
  g.despawn('qa_j2');
  a.lead = null;
  return { walkNoise, sp: +sp.toFixed(2), runNoise, chase, strikes: (g.flags.strikes_soyoung || 0) - s0 };
});
check('동행이 앞장서는 동안은 끝까지 눌러도 걷기(발소리 작음·걷기 속도)', esc.walkNoise < 2 && esc.sp < 2.6 && esc.strikes === 0, JSON.stringify(esc));
check('앞장설 때도 수위에게 쫓기면 달릴 수 있음', esc.chase === 'chase' && esc.runNoise > 5, JSON.stringify(esc));
await skip();

// ---------------- 저장 → 불러오기: 동행이 플레이어 곁에 다시 나타남
const restored = await page.evaluate(() => {
  const g = __game; g.player.x = 20.5; g.player.y = 10.5;
  const snap = g.snapshot(); g.restore(snap);
  const a = g.actor('soyoung');
  return { kind: a?.constructor.name, follow: a?.follow, d: a && Math.hypot(a.x - g.player.x, a.y - g.player.y), strikes: g.flags.strikes_soyoung };
});
check('불러오기: 동행 복원(곁에서 따라옴), 짜증 기록 유지', restored.kind === 'Follower' && restored.follow && restored.d < 1.5 && restored.strikes === 5, JSON.stringify(restored));

// ---------------- 교장실: 문을 열어 둔 채 서랍을 열면 수위가 들이닥친다
await page.evaluate(() => {
  const g = __game; g.flags.principalOpen = true;
  g.enterMap('main2_1f', 26.5, 4.4, 'up'); g.setDoor(26, 8, 'open'); g.act();
});
await waitDialog();
await skip();
const intr = await page.evaluate(() => ({ on: !!__game.flags.janitor2On, chase: __game.actor('bonggu')?.state, drawer: !!__game.flags.drawerOpen }));
check('문 열어 둔 채 서랍 → 수위 난입(추격), 서랍은 안 열림, 수위 활동 시작', intr.on && intr.chase === 'chase' && !intr.drawer, JSON.stringify(intr));
await page.evaluate(() => { const g = __game; g.despawn('bonggu'); g.setDoor(26, 8, 'closed'); g.player.x = 26.5; g.player.y = 4.4; g.player.dir = 'up'; g.act(); });
await waitDialog();
await skip();
check('문을 닫고 다시 열면 나무 손잡이·비디오테이프', await page.evaluate(() => __game.has('wood_handle') && __game.has('videotape') && __game.flags.shelfMoved));

// ---------------- 의자: 벽에 막히면 '원래 자리로'
await page.evaluate(() => { const g = __game; g.flags.cctvSeen = true; g.flags.chairPos = '20,5'; g.world.refresh(); g.player.x = 19.5; g.player.y = 5.5; g.player.dir = 'right'; g.act(); });
await answer(1);
await skip();
check('의자가 벽에 막혔을 때 원래 자리로 되돌리기', await page.evaluate(() => __game.flags.chairPos == null));

// ---------------- 틀린 연주 · 틀린 개수대
await page.evaluate(() => { const g = __game; Object.assign(g.flags, { musicLight: true, scoreRead: true, solfegeRead: true }); g.enterMap('main2_3f', 12.5, 2.4, 'up'); g.act(); });
await page.waitForSelector('.piano-layer');
await frames(260);
for (const i of [0, 1, 2, 3, 4]) await page.locator('.piano-key').nth(i).dispatchEvent('pointerdown');
await frames(500);
await skip();
check('틀린 연주(도레미파솔)로는 의자 열쇠가 나오지 않음', await page.evaluate(() => !__game.has('key_chair') && !__game.flags.pianoDone));
await page.evaluate(() => { const g = __game; g.give('doll_hot'); g.player.x = 6.5; g.player.y = 14.4; g.player.dir = 'up'; g.act(); });
await waitDialog();
await skip();
check('첫 번째 개수대: 물이 안 나와 인형이 식지 않음', await page.evaluate(() => __game.has('doll_hot') && !__game.has('doll_done')));
await page.evaluate(() => __game.take('doll_hot'));

// ---------------- 아기: 인형 없이 다가가면 즉사
const before = await page.evaluate(() => { const g = __game; Object.assign(g.flags, { kilnDone: true }); g.give('key_art'); g.enterMap('main2_4f', 8.5, 4.5, 'up'); return true; });
await skip();
await page.evaluate(() => { const g = __game; Object.assign(g.flags, { 'ev:babyWarn': true, 'ev:artIn': true }); g.player.y = 2.5; });
await page.waitForSelector('.over-layer', { timeout: 8000 }).catch(() => {});
await skip(20);
const over = await page.evaluate(() => ({ over: __game.over, text: document.querySelector('.over-title')?.textContent || '' }));
check('완성된 인형 없이 아기에게 다가가면 즉사(게임오버)', before && over.over && over.text.includes('아기'), JSON.stringify(over));

// ---------------- 5분 초과 → 게임오버, 체크포인트(가마에서 꺼내기 직전)부터 다시
await page.evaluate(() => {
  const g = __game; const snap = g.snapshot(); g.ui.clear(); g.restore({ ...snap, map: 'main2_4f', x: 20.5, y: 2.4, dir: 'up' }); g.over = false;
  g.act();
});
await waitDialog();
await skip();
const timer = await page.evaluate(() => ({ t: __game.timer?.label, left: __game.timer?.left, hot: __game.has('doll_hot'), cp: __game.checkpointData?.label }));
check('구운 인형을 꺼내면 5분 제한 + 체크포인트', timer.t === '아기' && timer.left > 290 && timer.hot && !!timer.cp, JSON.stringify(timer));
await page.evaluate(() => { __game.timer.left = 0.3; });
await page.waitForSelector('.over-layer', { timeout: 8000 }).catch(() => {});
await skip(20);
const btn = page.locator('.over-layer .title-btn').first();
const label = await btn.textContent().catch(() => '');
check('제한시간 초과 → 게임오버, 체크포인트 버튼', label.includes('가마'), label);
await frames(250);
await btn.dispatchEvent('pointerdown');
await frames(400);
const back = await page.evaluate(() => ({ over: __game.over, kiln: __game.flags.kilnDone, hot: __game.has('doll_hot'), timer: __game.timer }));
check('체크포인트에서 다시: 가마에서 꺼내기 직전(제한시간 없음)', !back.over && back.kiln && !back.hot && !back.timer, JSON.stringify(back));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
