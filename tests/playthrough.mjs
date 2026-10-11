// 1장 자동 완주 테스트 (QA): 봇이 실제 입력으로 오프닝 → 결계문(1장 끝)까지 진행한다.
// 사용: node tests/playthrough.mjs [B|A] [스크린샷 폴더]
//   - 수위·머리귀신은 qaSafe로 정지(로직·진행 경로 검증용). 수위 AI는 tests/janitor.mjs에서 따로 검증.
import { openMobile } from './helpers.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROUTE = (process.argv[2] || 'B').toUpperCase();
const OUT = process.argv[3] || null;
const here = path.dirname(fileURLToPath(import.meta.url));
const { browser, page, errors } = await openMobile();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
const T0 = Date.now();
let shot = 0;

async function fail(msg) {
  log('FAIL', msg);
  if (OUT) await page.screenshot({ path: `${OUT}/fail.png` });
  const st = await page.evaluate(() => ({ map: __game.mapId, x: __game.player.x, y: __game.player.y, obj: __game.flags.objective, hp: __game.hp }));
  console.log(JSON.stringify(st));
  await browser.close();
  process.exit(1);
}

// 열린 모달을 모두 처리 (대사·선택지·문서·키패드·스위치·QTE·카드)
async function settle(maxMs = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => {
      const L = [...document.querySelectorAll('#ui .layer')].pop();
      return { busy: __game.busy, modal: __game.ui.modalCount, cls: L?.className || '', q: L?.querySelector('.choice-q')?.textContent || '', title: L?.querySelector('.keypad-title')?.textContent || '', over: __game.over };
    });
    if (st.cls.includes('end')) return 'end';
    if (st.over || st.cls.includes('over-layer')) await fail('게임 오버 발생');
    if (!st.modal && !st.busy) return 'free';
    const L = '#ui .layer:last-of-type';
    if (st.cls.includes('dialog-layer')) {
      await page.locator(L).dispatchEvent('pointerdown');
      await page.waitForTimeout(30);
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('choice-layer')) {
      const idx = st.q.includes('어떻게 할까') ? (ROUTE === 'A' ? 0 : 1) : 0;
      log('선택지', JSON.stringify(st.q), '→', idx);
      await page.locator(`${L} .choice-opt`).nth(idx).dispatchEvent('pointerdown');
    } else if (st.cls.includes('doc-layer')) {
      await page.locator(`${L} .btn-close`).dispatchEvent('pointerdown');
    } else if (st.cls.includes('qte-layer')) {
      for (let i = 0; i < 14; i++) { await page.locator(L).dispatchEvent('pointerdown'); await page.waitForTimeout(60); }
    } else if (st.cls.includes('keypad-layer') && st.title.includes('비밀번호')) {
      const code = await page.evaluate(t => (t.includes('과학') ? __game.flags.noteCode : __game.flags.toolCode), st.title);
      log('키패드', st.title, code);
      for (const ch of code) await page.locator(`${L} .key`, { hasText: new RegExp(`^${ch}$`) }).dispatchEvent('pointerdown');
      await page.waitForTimeout(300);
    } else if (st.cls.includes('keypad-layer')) {
      // 배전반 스위치: 3·4번만 켜고 연결
      await page.locator(`${L} .switch`).nth(2).dispatchEvent('pointerdown');
      await page.locator(`${L} .switch`).nth(3).dispatchEvent('pointerdown');
      await page.locator(`${L} .btn-close.ok`).dispatchEvent('pointerdown');
    } else if (st.cls.includes('save-layer')) {
      await page.locator(`${L} .btn-close`).dispatchEvent('pointerdown');
    }
    await page.waitForTimeout(60);
  }
  await fail('모달 처리 시간 초과');
}

async function go(x, y, label = '') {
  for (let i = 0; i < 40; i++) {
    const r = await page.evaluate(([x, y]) => __bot.walkTo(x, y), [x, y]);
    if (r.ok) return;
    if (r.reason !== 'modal') await fail(`이동 실패 ${label}: ${r.reason}`);
    if ((await settle()) === 'end') return 'end';
  }
  await fail(`이동 반복 초과 ${label}`);
}

// 계단: 목표 층에 도착할 때까지 계단 위쪽으로 걷는다(도착하면 반대 계단을 다시 밟지 않도록 즉시 멈춤)
async function stairs(target) {
  for (let i = 0; i < 20; i++) {
    if ((await page.evaluate(() => __game.mapId)) === target) { await settle(); return; }
    const r = await page.evaluate(() => __bot.walkTo(39.5, 1.6));
    if (!r.ok && r.reason !== 'modal') await fail('계단 이동 실패: ' + r.reason);
    await page.waitForFunction(() => !__game.busy || __game.ui.modalCount, null, { timeout: 10000 }).catch(() => {});
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

async function snap(name) {
  if (!OUT) return;
  await page.screenshot({ path: `${OUT}/pt_${String(++shot).padStart(2, '0')}_${name}.png` });
}

const has = id => page.evaluate(i => __game.has(i), id);
const flag = k => page.evaluate(k => __game.flags[k], k);
async function expectItem(id) { if (!(await has(id))) await fail(`아이템 없음: ${id}`); log('획득', id); }

// ---------------------------------------------------------------- 진행
await page.addScriptTag({ path: path.join(here, 'bot.js') });
await page.waitForSelector('.title-btn');
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await page.evaluate(() => { __game.qaSafe = true; __game.timeScale = 2; });
await settle();
await snap('start');
log('1.1 2-6반');
await go(21.5, 9.6, '2-6반 앞');
await go(22.5, 7.3, '2-6반 스위치 앞');
await act('down', 'switch26');
await go(25.5, 7.3, '교지 앞');
await act('up', 'magazine');
await expectItem('magazine');
await snap('26');
await go(21.5, 7.3);
await go(21.5, 9.6, '복도(성아·지현)');
if (!(await flag('alarm'))) await fail('사이렌 이벤트 미발생');
log('1.2 사다리·와이어 커터');
await go(13.5, 14.3, '사다리 앞');
await act('up', 'ladder');
await expectItem('ladder');
await go(12.5, 2.3, '2-5반 사물함');
await act('up', 'locker25');
await expectItem('wirecutter');
await go(8.5, 9.4, '환풍구');
await act('up', 'grate');
if ((await page.evaluate(() => __game.mapId)) !== 'vent') await fail('환기구 진입 실패');
await snap('vent');
await go(3.4, 6.5, '왼쪽 밸브');
await act('left', 'valveL');
await go(12.4, 2.5, '오른쪽 밸브');
await act('right', 'valveR');
await go(1.5, 2.5, '환기구 출구');
await settle();
await snap('workshop');
await go(2.5, 4.4, '작업대');
await act('up', 'memo');
await go(8.5, 1.5, '배전반');
await act('up', 'switchboard');
if (!(await flag('alarmOff'))) await fail('배전반 퍼즐 실패');
await go(7.5, 2.4, '금고');
await act('up', 'safe1');
await expectItem('tablet_metal');
await go(5.5, 7.3, '철문 안쪽');
await act('down', 'workshopDoor');
await go(5.5, 9.8, '복도(성아 열쇠 교환)');
await expectItem('key_central');
log('1.3 수위');
await go(26.5, 10.5);
await go(31.2, 10.5, '정숙 팻말');
await wait(4000);
if (!(await flag('janitorOn'))) await fail('지현 구출 이벤트 미발생');
await snap('record');
await go(32.5, 7.3); await act('up', 'lighter'); await expectItem('lighter');
await go(35.5, 7.3); await act('up', 'weight');
await go(36.5, 6.4); await act('up', 'copier');
log('1.4 2층으로');
await go(35.4, 11.5, '공구함'); await act('right', 'toolbox'); await expectItem('toolbelt');
await go(38.5, 9.4, '셔터 홈'); await act('up', 'shutterSlot');
if (!(await flag('shutterOpen'))) await fail('셔터 미개방');
await go(31.5, 1.4, '열쇠보관함'); await act('up', 'keycab');
await expectItem('key_hall'); await expectItem('key_red');
log('1.5 목매단 귀신');
await go(41.5, 14, '강당 통로');
await go(42.6, 17, '모퉁이');
await snap('hanging');
await go(41.5, 10.5, '도주');
await wait(11000);
if (!(await flag('hangingDone'))) await fail('목매단 귀신 이벤트 미종료');
await stairs('main2f');
await snap('2f');
await go(35.5, 3.3, '산악부실'); await act('up', 'spray'); await expectItem('spray');
await go(30.5, 7.3); await act('up', 'penClub');
await go(13.5, 7.3, '2-7반 스위치'); await act('down', 'switch27');
await go(16.5, 4.4, '쪽지'); await act('up', 'note'); await expectItem('note');
await go(45.5, 2.4, '과학준비실 금고'); await act('up', 'safe2'); await expectItem('solvent');
log('1.6 소영');
await go(25.5, 6.4, '소영 자리'); await act('up', 'soyoungDesk');
if (!(await flag('treeEvent'))) await fail('귀목 이벤트 미시작');
await snap('tree_start');
log('1.7 이상한 화분');
await go(9.5, 9.5); await act('left', 'plant3');
await go(17.5, 7.3); await act('up', 'plant2');
await stairs('main1f');
await go(13.5, 15.3, '로비 화분'); await act('down', 'plant1');
await stairs('main2f');
log('1.8 귀목');
await go(23.5, 14.3, '2-2반 나무'); await act('down', 'tree');
if (!(await flag('treeDead'))) await fail('귀목 퇴치 실패');
await snap('tree_dead');
await go(23.5, 6.6, '2-8반');
await settle();
await go(22.5, 2.5); await act('right', 'tabletWood');
await expectItem('tablet_wood');
log('분기: 방송실');
await go(4.5, 6.3, '방송실');
await settle();
if ((await flag('route')) !== ROUTE) await fail(`루트 불일치: ${await flag('route')}`);
await stairs('main1f');
await go(45.5, 9.4, '결계문'); const r = await act('up', 'seal');
await snap('end');
if (r !== 'end') await fail('1장 끝 화면 미표시');
const hp = await page.evaluate(() => __game.hp);
log(`PASS — 루트 ${ROUTE}, 체력 ${hp}, 콘솔 오류 ${errors.length}`);
if (errors.length) console.log(errors.slice(0, 10));
await browser.close();
process.exit(errors.length ? 1 : 0);
