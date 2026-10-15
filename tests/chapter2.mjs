// 2장 자동 완주 테스트 (QA): 1장 끝(결계문) 상태에서 2장 시작 → 봇이 실제 입력으로 土 결계문(2장 끝)까지 진행한다.
// 사용: node tests/chapter2.mjs [B|A] [스크린샷 폴더]
//   - 동행 히로인을 데리고 '걷기'로만 이동: 정상 진행에서는 짜증(strikes)이 0이어야 한다
//   - 수위·머리귀신은 qaSafe로 정지(진행 경로 검증용). 짜증 판정·수위 난입은 tests/companion.mjs에서 따로 검증
import { openMobile } from './helpers.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROUTE = (process.argv[2] || 'B').toUpperCase();
const OUT = process.argv[3] || null;
const here = path.dirname(fileURLToPath(import.meta.url));
const { browser, page, errors } = await openMobile();
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const cgs = [];
let shot = 0;

async function fail(msg) {
  log('FAIL', msg);
  if (OUT) await page.screenshot({ path: `${OUT}/ch2_fail.png` });
  const st = await page.evaluate(() => ({ map: __game.mapId, x: __game.player.x, y: __game.player.y, obj: __game.flags.objective, hp: __game.hp, layer: [...document.querySelectorAll('#ui .layer')].pop()?.className }));
  console.log(JSON.stringify(st), errors.slice(0, 5));
  await browser.close();
  process.exit(1);
}

// 열린 모달 처리: 대사·선택지·문서·키패드(비밀번호)·피아노·QTE·카드·CG
async function settle(maxMs = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => {
      const L = [...document.querySelectorAll('#ui .layer')].pop();
      return { busy: __game.busy, modal: __game.ui.modalCount, cls: L?.className || '', title: L?.querySelector('.keypad-title')?.textContent || '', age: L ? performance.now() - Number(L.dataset.t0) : 1e9, over: __game.over };
    });
    if (st.cls.includes('end')) return 'end';
    if (st.over || st.cls.includes('over-layer')) await fail('게임 오버 발생');
    if (!st.modal && !st.busy) return 'free';
    if (st.age < 250) await page.waitForTimeout(250 - st.age);
    const L = '#ui .layer:last-of-type';
    if (st.cls.includes('dialog-layer')) {
      await page.locator(L).dispatchEvent('pointerdown');
      await page.waitForTimeout(30);
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('choice-layer')) {
      await page.locator(`${L} .choice-opt`).first().dispatchEvent('pointerdown');
    } else if (st.cls.includes('doc-layer')) {
      await page.locator(`${L} .btn-close`).dispatchEvent('pointerdown');
    } else if (st.cls.includes('qte-layer')) {
      for (let i = 0; i < 14; i++) { await page.locator(L).dispatchEvent('pointerdown'); await page.waitForTimeout(60); }
    } else if (st.cls.includes('piano-layer')) {
      log('피아노: 미 레 파 솔 파');
      for (const i of [2, 1, 3, 4, 3]) { await page.locator(`${L} .piano-key`).nth(i).dispatchEvent('pointerdown'); await page.waitForTimeout(40); }
      await page.waitForTimeout(450);
    } else if (st.cls.includes('keypad-layer')) {
      const code = await page.evaluate(t => (t.includes('교장실') ? __game.flags.principalCode : __game.flags.prepCode), st.title);
      log('키패드', st.title, code);
      for (const ch of code) await page.locator(`${L} .key`, { hasText: new RegExp(`^${ch}$`) }).dispatchEvent('pointerdown');
      await page.waitForTimeout(300);
    } else if (st.cls.includes('cg-layer')) {
      cgs.push(await page.evaluate(() => document.querySelector('.cg-img')?.getAttribute('src')));
      await page.locator(L).dispatchEvent('pointerdown');
    } else if (st.cls.includes('save-layer')) {
      await page.locator(`${L} .btn-close`).dispatchEvent('pointerdown');
    } else await page.waitForTimeout(100);
    await page.waitForTimeout(60);
  }
  await fail('모달 처리 시간 초과');
}

async function go(x, y, label = '') {
  for (let i = 0; i < 40; i++) {
    const r = await page.evaluate(([x, y]) => __bot.walkTo(x, y, false), [x, y]);
    if (r.ok) return;
    if (r.reason !== 'modal') await fail(`이동 실패 ${label}: ${r.reason}`);
    if ((await settle()) === 'end') return 'end';
  }
  await fail(`이동 반복 초과 ${label}`);
}

// 계단: 왼쪽(위층)·오른쪽(아래층) 계단 맨 윗칸을 밟는다
async function stairs(target) {
  const order = ['main2_1f', 'main2_2f', 'main2_3f', 'main2_4f'];
  for (let i = 0; i < 20; i++) {
    const now = await page.evaluate(() => __game.mapId);
    if (now === target) { await settle(); return; }
    const up = order.indexOf(target) > order.indexOf(now);
    const r = await page.evaluate(x => __bot.walkTo(x, 1.4, false), up ? 2 : 5);
    if (!r.ok && r.reason !== 'modal') await fail('계단 이동 실패: ' + r.reason);
    await page.waitForFunction(() => !__game.busy || __game.ui.modalCount, null, { timeout: 10000 }).catch(() => {});
    await settle();
  }
  await fail('계단 도착 실패 ' + target);
}

async function act(dir, expect) {
  const r = await page.evaluate(d => __bot.act(d), dir);
  if (expect && r.focus !== expect) await fail(`조사 대상 불일치: 기대 ${expect}, 실제 ${r.focus}`);
  return settle();
}

async function wait(ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const r = await page.evaluate(m => __bot.idle(m), Math.min(ms, 500));
    if (!r.ok) await settle();
  }
}

async function snap(name) { if (OUT) await page.screenshot({ path: `${OUT}/ch2_${String(++shot).padStart(2, '0')}_${name}.png` }); }
const has = id => page.evaluate(i => __game.has(i), id);
const flag = k => page.evaluate(k => __game.flags[k], k);
async function expectItem(id) { if (!(await has(id))) await fail(`아이템 없음: ${id}`); log('획득', id); }
const follower = () => page.evaluate(() => {
  const id = __game.flags.follower, a = id && __game.actor(id), p = __game.player;
  return { id, ok: !!a && a.constructor.name === 'Follower', d: a ? +Math.hypot(a.x - p.x, a.y - p.y).toFixed(2) : null, map: __game.mapId };
});

// ---------------------------------------------------------------- 시작: 1장 끝 상태 → 2장
await page.addScriptTag({ path: path.join(here, 'bot.js') });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await settle();
await page.evaluate(r => {
  const g = __game;
  Object.assign(g.flags, { route: r, ch1Clear: r, janitorOn: true, headGhost: true });
  g.give('lighter');
  g.qaSafe = true; g.timeScale = 2;
  g.run('ch2Start');
}, ROUTE);
await page.waitForTimeout(300);
await settle();
const hero = ROUTE === 'B' ? 'soyoung' : 'jihyeon';
let fo = await follower();
check(`2장 시작: 본관 2구역 1층, ${hero} 동행`, fo.map === 'main2_1f' && fo.id === hero && fo.ok, JSON.stringify(fo));
await snap('start');

log('2-01 상담실 조사 보고서');
await go(35.5, 4.4, '상담실 탁자');
await act('up', 'report');
check('조사 보고서 읽음', await flag('reportRead'));
fo = await follower();
check('동행이 방 안까지 따라옴(3칸 이내)', fo.ok && fo.d < 3, JSON.stringify(fo));

log('2-02 교무실1 분실물보관실 열쇠');
await go(9.5, 2.4, '컴퓨터 옆 테이블');
await act('up', 'keyLost');
await expectItem('key_lost');

log('2-03 2층 분실물보관실 흙인형');
await stairs('main2_2f');
fo = await follower();
check('계단을 올라가도 동행이 따라옴', fo.ok && fo.map === 'main2_2f' && fo.d < 2, JSON.stringify(fo));
await go(32.5, 16.3, '분실물 선반');
await act('down', 'doll');
await expectItem('doll');

log('2-04 학생부실: 불 끄고 라이터');
await go(10.5, 7.3, '학생부실 스위치');
await act('down', 'stuSwitch');
check('학생부실 불 꺼짐', !(await flag('stuLightOn')));
await page.evaluate(() => __input.pressed.add('lighter'));
await page.waitForTimeout(100);
await go(10.5, 1.4, '칠판');
await act('up', 'riddle');
check('수수께끼(교장실 비밀번호) 읽음', await flag('riddleRead'));
const riddle = await page.evaluate(() => __game.docOf('riddle').body);
const code = await flag('principalCode');
const want = [...code].map(d => ({ 1: '不 − 小', 2: '示 − 小', 4: '西 − 一', 8: '分 − 刀' })[d]);
check('수수께끼 줄 순서 = 비밀번호 순서({1,2,4,8})', [...code].sort().join('') === '1248' && want.every((w, i) => riddle.indexOf(w) >= 0 && (i === 0 || riddle.indexOf(w) > riddle.indexOf(want[i - 1]))), code);
await page.evaluate(() => __input.pressed.add('lighter'));

log('2-05 교장실');
await stairs('main2_1f');
await go(26.5, 9.4, '교장실 문');
await act('up', 'principalDoor');
check('교장실 비밀번호로 열림', await flag('principalOpen'));
await go(24.5, 5.4, '교장실 안');
await go(26.5, 7.3, '교장실 문 안쪽');
for (let i = 0; i < 10 && (await page.evaluate(() => __game.world.door(26, 8).open)); i++) { await act('down'); await wait(400); }
check('교장실 문을 닫음', !(await page.evaluate(() => __game.world.door(26, 8).open)));
await go(26.5, 4.4, '책상 오른쪽 서랍');
await act('up', 'drawer');
await expectItem('wood_handle');
check('문을 닫고 열면 수위가 들어오지 않음', !(await flag('janitor2On')));
await go(22.5, 2.4, '숨은 모니터');
await act('up', 'cctv');
check('CCTV 녹화 확인 → 수위 활동 시작', (await flag('cctvSeen')) && (await flag('janitor2On')));
fo = await follower();
if (ROUTE === 'A') check('A루트: 노랫소리에 홀린 지현이 사라짐', !fo.id && !(await page.evaluate(() => __game.actor('jihyeon'))), JSON.stringify(fo));
else check('B루트: 소영은 계속 동행', fo.ok, JSON.stringify(fo));
await snap('cctv');

log('2-06 의자 밀기');
await page.evaluate(() => { __game.player.dir = 'up'; });
for (const [x, y, dir] of [[15.5, 5.5, 'right'], [16.5, 5.5, 'right'], [17.5, 5.5, 'right'], [19.5, 6.5, 'up'], [19.5, 5.5, 'up'], [19.5, 4.5, 'up']]) {
  await go(x, y, '의자 뒤');
  await act(dir, 'chair');
}
check('의자를 캐비닛 앞(19,2)까지 밂', (await flag('chairPos')) === '19,2', await flag('chairPos'));
await go(19.5, 3.5, '의자 앞');
await act('up', 'chair');
await expectItem('key_office2');

log('2-07~2-08 제2교무실');
await stairs('main2_2f');
if (ROUTE === 'B') {
  await settle();
  check('B루트: 2층 계단에서 소영의 계단 이야기', !!(await flag('ev:stairsTalk')));
  // 소영 바로 뒤에 붙어 걷기: 앞장선 소영을 1.6칸 뒤에서 따라간다
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    const st = await page.evaluate(() => {
      const a = __game.actor('soyoung'), p = __game.player, I = __input;
      if (!a?.lead) { I.x = I.y = 0; return 'done'; }
      if (__game.busy || __game.ui.modalCount) { I.x = I.y = 0; return 'modal'; }
      const dx = a.x - p.x, dy = a.y - p.y, d = Math.hypot(dx, dy);
      if (d > 1.6) { I.x = dx / d; I.y = dy / d; } else { I.x = I.y = 0; }
      I.run = false;
      return 'walk';
    });
    if (st === 'done') break;
    if (st === 'modal') await settle();
    await page.waitForTimeout(30);
  }
  await settle();
  check('소영 뒤에 붙어 걷기 완료(짜증 없음)', (await flag('stairWalkDone')) && !(await flag('strikes_soyoung')), String(await flag('strikes_soyoung')));
}
await go(21.5, 4.5, '휴게실 안쪽 문 앞');
await go(26.5, 4.5, '제2교무실');
await settle();
check('제2교무실: 쓰러진 지현 발견', await flag('office2Seen'));
await go(30.5, 3.4, '카세트');
await act('up', 'cassette');
await expectItem('backward_tape');
fo = await follower();
if (ROUTE === 'A') check('A루트: 지현이 다시 동행', fo.id === 'jihyeon' && fo.ok, JSON.stringify(fo));
else check('B루트: 지현은 따로 가고 소영이 동행', fo.id === 'soyoung' && !(await page.evaluate(() => __game.actor('jihyeon'))), JSON.stringify(fo));

log('2-09 음악실');
await stairs('main2_3f');
await go(10.5, 7.3, '음악실 스위치');
await act('down', 'musicSwitch');
check('피아노 귀신 → 숫자 악보', (await flag('pianoBlood')) && (await flag('scoreRead')));
await go(17.5, 1.4, '칠판 계이름');
await act('up', 'solfege');
await go(12.5, 2.4, '피아노');
await act('up', 'piano');
await expectItem('key_chair');
await go(13.5, 3.4, '피아노 의자');
await act('up', 'bench');
await expectItem('picture_piece');
await go(26.5, 9.4, '음악준비실 자물쇠');
await act('up', 'prepLock');
check('그림 조각 뒷면 숫자로 음악준비실 열림', await flag('prepOpen'));
await go(24.5, 2.4, 'CD');
await act('up', 'cd');
await expectItem('key_art');
await go(28.5, 4.4, '일기');
await act('up', 'kimDiary');
await go(25.5, 6.4, '도자기');
await act('up', 'pottery');
await expectItem('pottery');
const flash = cgs.some(c => c?.includes('cg_flashback'));
check(ROUTE === 'B' ? 'B루트: 도자기 회상(1998년 의식) 연출' : 'A루트: 회상 없음(일기만)', ROUTE === 'B' ? flash || !(await page.evaluate(() => fetch('assets/hf/manifest.json').then(r => r.json()).then(f => f.some(n => n.startsWith('cg_flashback'))))) : !flash);

log('2-10 가마');
await stairs('main2_4f');
await go(20.5, 7.3, '미술실');
await settle();
await go(20.5, 2.4, '가마');
await act('up', 'kiln');
check('가마에 흙인형을 넣고 굽기 시작', await flag('kilnBaking'));
await wait(9000);
check('가마 완료', await flag('kilnDone'));
await act('up', 'kiln');
await expectItem('doll_hot');
check('아기 제한시간 시작(5분)', await page.evaluate(() => __game.timer?.label === '아기' && __game.timer.left > 280));
await stairs('main2_3f');
await go(10.5, 14.4, '세 번째 개수대');
await act('up', 'sink3');
await expectItem('doll_done');

log('2-11 아기 귀신');
await stairs('main2_4f');
await go(9.5, 3.6, '아기 근처');
await settle();
await go(8.4, 2.6, '아기에게');
await settle();
check('인형을 건네 아기 성불 · 제한시간 종료', (await flag('babyDone')) && !(await page.evaluate(() => __game.timer)));

log('2-12 土의 패 → 결계문');
await go(27.5, 2.4, '미술준비실 선반');
await act('up', 'tabletEarth');
await expectItem('tablet_earth');
await stairs('main2_3f');
await stairs('main2_2f');
await go(36.5, 9.4, '土 결계문');
await snap('seal');
const end = await act('up', 'sealEarth');
check('2장 끝 화면', end === 'end');
const text = await page.evaluate(() => document.querySelector('.over-layer.end')?.textContent || '');
check(`엔딩 문구: ${ROUTE === 'B' ? '소영' : '성아·지현'} 루트`, text.includes(ROUTE === 'B' ? '소영 루트' : '성아·지현 루트'), text);
const strikes = await page.evaluate(h => __game.flags['strikes_' + h] || 0, hero);
check('걷기로 정상 진행: 동행 짜증 0', strikes === 0, String(strikes));
log('CG', cgs.join(', ') || '(등록된 CG 없음)');
check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS (루트 ${ROUTE})`);
process.exit(bad ? 1 : 0);
