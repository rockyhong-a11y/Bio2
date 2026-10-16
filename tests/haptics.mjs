// 진동(항상 켜짐): 휴대폰 진동(Vibration API) + 게임패드 진동, 소리를 꺼도 그대로. 아이폰(진동 API 없음)은 스위치 햅틱으로 대신.
// 실제 진동은 기기에서만 느낄 수 있으므로 여기서는 브라우저 진동 함수가 '어떤 패턴으로 불렸는지'를 기록해 확인한다.
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

// 휴대폰 진동 + 게임패드 두 개(크롬식 vibrationActuator, 파이어폭스식 hapticActuators) 기록
const stub = () => {
  window.__vib = []; window.__rumble = []; window.__pulse = [];
  navigator.vibrate = p => { __vib.push(p); return true; };
  const mk = (i, actuator) => ({ id: `QA pad ${i}`, index: i, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), ...actuator });
  const pads = [
    mk(0, { vibrationActuator: { type: 'dual-rumble', playEffect: (t, o) => { __rumble.push([t, o]); return Promise.resolve('complete'); } } }),
    mk(1, { hapticActuators: [{ pulse: (v, ms) => { __pulse.push([v, ms]); return Promise.resolve(true); } }] }),
  ];
  window.__pads = pads;
  navigator.getGamepads = () => [...pads, null, null];
};
const { browser, page, errors } = await openMobile({ init: stub });
const start = async p => {
  await p.waitForSelector('.title-btn');
  await p.waitForTimeout(300);
  await p.locator('.title-btn').first().dispatchEvent('pointerdown');
  await skipDialogs(p);
};
await start(page);
// 무작위 번개·천둥(배경 연출)이 중간에 진동을 내지 않게 멈춤
const quiet = () => page.evaluate(() => { __game.ambient.nextBolt = 1e9; __game.ambient.thunderIn = null; });
const settle = () => page.waitForTimeout(600); // 앞 진동이 끝날 때까지(우선순위: 울리는 중에는 더 약한 진동이 끊지 못함)
await quiet();
await page.evaluate(() => { __vib.length = 0; __rumble.length = 0; __pulse.length = 0; __haptics.log.length = 0; });
const take = () => page.evaluate(() => {
  const r = { vib: __vib.splice(0), rumble: __rumble.splice(0), pulse: __pulse.splice(0), log: __haptics.log.splice(0) };
  return r;
});

// 1) 맞음: 휴대폰 진동 패턴 + 두 패드 모두
await page.evaluate(() => (__game.invuln = 0, __game.hp = 9, __game.damage(1)));
await page.waitForTimeout(100);
let r = await take();
check('맞으면 휴대폰 진동(맞음 패턴)', r.vib.length === 1 && JSON.stringify(r.vib[0]) === '[90,40,140]', JSON.stringify(r.vib));
check('맞으면 게임패드 진동(dual-rumble 강하게)', r.rumble.length === 1 && r.rumble[0][0] === 'dual-rumble' && r.rumble[0][1].strongMagnitude >= 0.8 && r.rumble[0][1].duration > 0, JSON.stringify(r.rumble));
check('진동 모터 방식이 다른 패드(hapticActuators)도 진동', r.pulse.length === 1 && r.pulse[0][0] > 0.5, JSON.stringify(r.pulse));

// 2) 사건별 진동: 수위 발각·깜짝(스팅어)·천둥·잠긴 문, 진동 없는 소리
const kinds = {};
for (const n of ['whistle', 'stinger', 'thunder', 'locked', 'switch', 'door']) {
  await settle();
  kinds[n] = await page.evaluate(n => { __vib.length = 0; __game.audio.play(n); return __vib.splice(0); }, n);
}
check('수위에게 발각(호루라기) → 진동', kinds.whistle.length === 1, JSON.stringify(kinds.whistle));
check('깜짝 놀람(스팅어) → 긴 진동', kinds.stinger.length === 1 && kinds.stinger[0].reduce((a, b) => a + b, 0) > 300, JSON.stringify(kinds.stinger));
check('천둥 → 큰 진동', kinds.thunder.length === 1 && kinds.thunder[0][0] >= 200, JSON.stringify(kinds.thunder));
check('잠긴 문 → 가벼운 진동', kinds.locked.length === 1 && kinds.locked[0][0] < 40, JSON.stringify(kinds.locked));
check('라이터 켜기·문 열기 같은 잦은 소리는 진동 없음', !kinds.switch.length && !kinds.door.length);
await take();

// 2-1) 우선순위: 울리는 중에는 더 약한 진동이 끊지 못함(새 진동 호출이 앞 진동을 끊기 때문), 더 센 진동은 끊고 울림
const pri = async seq => {
  await settle();
  return page.evaluate(async seq => {
    __vib.length = 0; __rumble.length = 0;
    for (const [n, wait] of seq) { if (wait) await new Promise(r => setTimeout(r, wait)); n === 'beat' ? (__game.audio.beatT = 0, __game.audio.heartbeat(1)) : __game.audio.play(n); }
    return { vib: __vib.splice(0).map(p => JSON.stringify(p)), rumble: __rumble.splice(0).length };
  }, seq);
};
const spotBeat = await pri([['whistle'], ['beat', 5]]);
check('발각 진동 중 심장 박동이 끊지 않음(폰·패드)', spotBeat.vib.join() === '[40,70,40]' && spotBeat.rumble === 1, JSON.stringify(spotBeat));
const scareThud = await pri([['stinger'], ['thud']]);
check('깜짝(목매단 귀신) 진동을 바로 뒤 쿵이 끊지 않음', scareThud.vib.join() === '[60,40,60,40,240]', JSON.stringify(scareThud));
const spotHit = await pri([['whistle'], ['hit', 20]]);
check('발각 중 맞으면 맞음 진동은 울림(더 셈)', spotHit.vib.join(' ') === '[40,70,40] [90,40,140]', JSON.stringify(spotHit));
const after = await pri([['whistle'], ['beat', 300]]);
check('앞 진동이 끝나면 박동 진동 다시 울림', after.vib.join(' ') === '[40,70,40] [30]', JSON.stringify(after));
// 천둥: 휴대폰 220ms · 패드 350ms — 휴대폰이 멈춘 뒤의 박동은 휴대폰에서 울리고, 아직 울리는 패드는 끊지 않음
const heavyBeat = await pri([['thunder'], ['beat', 280]]);
check('휴대폰 진동이 끝나면 패드가 울리는 중이어도 휴대폰은 다시 울림', heavyBeat.vib.join(' ') === '[220] [30]' && heavyBeat.rumble === 1, JSON.stringify(heavyBeat));
await settle();
await take();

// 3) 소리를 꺼도 진동은 그대로
await page.evaluate(() => { if (!__game.audio.muted) __game.audio.toggle(); });
await page.evaluate(() => (__game.invuln = 0, __game.hp = 9, __game.damage(1)));
await page.waitForTimeout(100);
r = await take();
check('소리 꺼도 진동', (await page.evaluate(() => __game.audio.muted)) && r.vib.length === 1 && r.rumble.length === 1);
await page.evaluate(() => { if (__game.audio.muted) __game.audio.toggle(); });

// 4) 심장 박동: 추격 중(위험 큼)에만 박동마다 약하게, 위험이 작으면 없음
const beat = await page.evaluate(async () => {
  const a = __game.audio, res = {};
  for (const d of [0.3, 1]) {
    a.beatT = 0; __haptics.log.length = 0;
    const t0 = performance.now();
    while (performance.now() - t0 < 1300) { a.heartbeat(d); await new Promise(r => setTimeout(r, 30)); }
    res[d] = __haptics.log.filter(k => k === 'beat').length;
  }
  const ctx = a.ctx; a.ctx = null; a.beatT = 0; __haptics.log.length = 0; a.heartbeat(1); res.noAudio = __haptics.log.filter(k => k === 'beat').length; a.ctx = ctx;
  return res;
});
check('추격 중 심장 박동 진동(1.3초에 2~3번)', beat[1] >= 2 && beat[1] <= 3, JSON.stringify(beat));
check('위험이 작으면 박동 진동 없음', beat[0.3] === 0);

// 4-1) 추격 중이라도 휴대폰 메뉴·지도·대사가 열려 있으면(수위·제한시간이 멈춤) 박동 진동도 멈춤, 닫으면 다시
const beatsFor = ms => page.evaluate(async ms => { __haptics.log.length = 0; await new Promise(r => setTimeout(r, ms)); return __haptics.log.filter(k => k === 'beat').length; }, ms);
await settle();
const chaseSetup = await page.evaluate(() => {
  const g = __game, p = g.player;
  p.x = 20.5; p.y = 10.5;
  const j = g.actors.find(a => a.constructor.name === 'Janitor') || g.spawn({ id: 'qa_j', kind: 'janitor', x: 23.5, y: 10.5, dir: 'left', patrol: [[23.5, 10.5], [30.5, 10.5]] });
  if (!j) return false;
  j.x = p.x + 3; j.y = p.y; j.state = 'chase';
  g.invuln = 1e9; // 잡혀도 맞지 않게
  return true;
});
if (chaseSetup) {
  await page.evaluate(() => __game.ui.openMenu(__game));
  const inMenu = await beatsFor(1300);
  await page.evaluate(() => __game.ui.clear());
  await page.evaluate(() => { const g = __game, j = g.actors.find(a => a.constructor.name === 'Janitor'); j.x = g.player.x + 3; j.y = g.player.y; j.state = 'chase'; });
  const outside = await beatsFor(1300);
  check('추격 중 메뉴가 열려 있으면 박동 진동 없음, 닫으면 다시', inMenu === 0 && outside >= 2, `메뉴 ${inMenu}번 / 닫은 뒤 ${outside}번`);
  await page.evaluate(() => { const g = __game, j = g.actors.find(a => a.constructor.name === 'Janitor'); j.state = 'patrol'; j.x = 2; j.y = 2; g.invuln = 0; });
} else check('추격 중 메뉴가 열려 있으면 박동 진동 없음(수위 없음 — 시험 불가)', false);
check('소리(오디오)가 없어도 박동 진동', beat.noAudio === 1);
await take();

// 5) 연타(QTE): 누를 때마다 짧게
const qte = page.evaluate(() => __game.ui.qte('연타!', 4, 3));
await page.waitForSelector('.qte-btn');
await page.waitForTimeout(300);
for (let i = 0; i < 4; i++) { await page.locator('.qte-btn').dispatchEvent('pointerdown'); await page.waitForTimeout(60); }
await qte;
r = await take();
check('연타 누를 때마다 짧은 진동', r.log.filter(k => k === 'tap').length === 4 && r.vib.filter(p => p[0] <= 20).length === 4, JSON.stringify(r.log));

// 6) 패드 연결이 끊긴 것은 건너뜀, 진동 함수 오류가 게임을 멈추지 않음
await page.evaluate(() => {
  __pads[1].connected = false;
  __pads[0].vibrationActuator.playEffect = () => { throw new Error('busy'); };
  navigator.vibrate = () => { throw new Error('blocked'); };
});
await page.evaluate(() => (__game.invuln = 0, __game.hp = 9, __game.damage(1)));
await page.waitForTimeout(100);
r = await take();
const t0 = await page.evaluate(() => __game.t);
await page.waitForTimeout(300);
check('진동 오류·끊긴 패드에도 게임 계속', r.pulse.length === 0 && (await page.evaluate(() => __game.t)) > t0 && !errors.length, errors.join(' | '));
await browser.close();

// 7) 아이폰(Vibration API 없음): 스위치 햅틱(iOS 18+)으로 대신 — 숨은 스위치를 눌러 시스템 햅틱
const ios = () => {
  Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  delete Navigator.prototype.vibrate;
  window.__clicks = 0;
  addEventListener('click', e => { if (e.target.matches?.('input[switch]')) __clicks++; }, true);
};
const I = await openMobile({ init: ios });
await start(I.page);
const ir = await I.page.evaluate(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  __game.ambient.nextBolt = 1e9; __game.ambient.thunderIn = null;
  await wait(600); // 시작 연출의 진동이 끝날 때까지
  const before = __clicks;
  (__game.invuln = 0, __game.hp = 9, __game.damage(1));
  await wait(600);
  __game.audio.play('whistle');
  __game.audio.play('switch'); // 진동 없는 소리
  __game.audio.beatT = 0; __game.audio.heartbeat(1); // 발각 바로 뒤 박동: 스위치 햅틱은 한 번 '톡'이라 막지 않음
  const sw = document.querySelector('input[switch]');
  return { noApi: typeof navigator.vibrate, clicks: __clicks - before, hidden: sw && getComputedStyle(sw.parentElement).display === 'none', log: __haptics.log.slice(-2) };
});
check('아이폰: 진동 API 없으면 스위치 햅틱으로(사건마다 한 번, 앞 진동에 막히지 않음)', ir.noApi === 'undefined' && ir.clicks === 3 && ir.hidden, JSON.stringify(ir));
check('아이폰: 콘솔 오류 없음', I.errors.length === 0, I.errors.slice(0, 3).join(' | '));
await I.browser.close();

const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
