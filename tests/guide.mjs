// 공략(옵션): 휴대폰 → 옵션 → 공략 켜기/끄기, 그리고 '공략만 보고' 1장 완주.
//   봇은 줄거리를 모른다. 매 단계 지도를 열어 공략 패널·목적지·아이템·이동 지점 표시를 확인한 뒤,
//   공략이 가리키는 곳(다른 층이면 이동 지점)으로 가서 밟거나 조사하고, 비밀번호·배전반 답도 공략에 나온 값만 쓴다.
//   단서(공구벨트·낙서 쪽지)를 읽기 전에는 비밀번호가 화면에 나오면 실패.
// 사용: node tests/guide.mjs [A|B]   (수위·머리귀신은 qaSafe로 정지 — playthrough.mjs와 같음)
import { openMobile } from './helpers.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROUTE = (process.argv[2] || 'B').toUpperCase();
const here = path.dirname(fileURLToPath(import.meta.url));
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const { browser, page, errors } = await openMobile();
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
async function finish(extra) {
  if (extra) check(extra, false, JSON.stringify(await page.evaluate(() => ({ map: __game.mapId, x: __game.player.x.toFixed(1), y: __game.player.y.toFixed(1), guide: __game.story.guide(__game)?.text }))));
  check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const bad = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} PASS`);
  process.exit(bad ? 1 : 0);
}
const guide = () => page.evaluate(() => __game.story.guide(__game));
const mapId = () => page.evaluate(() => __game.mapId);
const digits = s => (String(s).match(/\d/g) || []);
const codeFor = async label => (await guide())?.codes.find(c => label.startsWith(c.label.split(' ')[0]))?.value;

// ---------------------------------------------------------------- 옵션 토글
await page.addScriptTag({ path: path.join(here, 'bot.js') });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await page.evaluate(() => { __game.qaSafe = true; __game.timeScale = 2; });

// 열린 화면 처리. 비밀번호·배전반은 공략에 나온 답만 쓴다
async function settle(maxMs = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => {
      const L = [...document.querySelectorAll('#ui .layer')].pop();
      return { busy: __game.busy, modal: __game.ui.modalCount, cls: L?.className || '', q: L?.querySelector('.choice-q')?.textContent || '', title: L?.querySelector('.keypad-title')?.textContent || '', over: __game.over, age: L ? performance.now() - Number(L.dataset.t0) : 1e9 };
    });
    if (st.cls.includes('end')) return 'end';
    if (st.over || st.cls.includes('over-layer')) await finish('게임 오버 없이 진행');
    if (!st.modal && !st.busy) return 'free';
    if (st.age < 250) await page.waitForTimeout(250 - st.age); // 레이어 열린 직후 0.2초 탭 무시
    const L = '#ui .layer:last-of-type';
    if (st.cls.includes('dialog-layer') || st.cls.includes('cg-layer') || st.cls.includes('card-layer')) {
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('choice-layer')) {
      const idx = st.q.includes('어떻게 할까') ? (ROUTE === 'A' ? 0 : 1) : st.q.includes('게시판') ? 1 : 0;
      await page.locator(`${L} .choice-opt`).nth(idx).dispatchEvent('pointerdown');
    } else if (st.cls.includes('doc-layer') || st.cls.includes('save-layer')) {
      await page.locator(`${L} .btn-close`).first().dispatchEvent('pointerdown');
    } else if (st.cls.includes('qte-layer')) {
      for (let i = 0; i < 14; i++) { await page.locator(L).dispatchEvent('pointerdown'); await page.waitForTimeout(60); }
    } else if (st.cls.includes('keypad-layer') && st.title.includes('비밀번호')) {
      const code = digits(await codeFor(st.title));
      if (code.length !== 4) await finish(`공략에 비밀번호 없음: ${st.title}`);
      log('키패드', st.title, code.join(''));
      for (const ch of code) await page.locator(`${L} .key`, { hasText: new RegExp(`^${ch}$`) }).dispatchEvent('pointerdown');
      await page.waitForTimeout(300);
    } else if (st.cls.includes('keypad-layer')) {
      const on = digits(await codeFor(st.title));
      if (!on.length) await finish(`공략에 배전반 답 없음: ${st.title}`);
      log('배전반', on.join(','));
      for (const n of on) await page.locator(`${L} .switch`).nth(Number(n) - 1).dispatchEvent('pointerdown');
      await page.locator(`${L} .btn-close.ok`).dispatchEvent('pointerdown');
    }
    await page.waitForTimeout(60);
  }
  await finish('화면 처리 시간 초과');
}
await settle();

const mapLayer = () => page.locator('.map-layer').count().then(n => n === 1);
async function openMap() { await page.locator('.btn-map').dispatchEvent('pointerdown'); await page.waitForSelector('.map-layer'); await page.waitForTimeout(250); }
async function closeMap() { await page.locator('.map-layer .btn-close').dispatchEvent('pointerdown'); await page.waitForTimeout(120); }
await openMap();
check('공략 기본 꺼짐: 지도에 공략 없음', (await page.locator('.map-guide').count()) === 0 && (await page.locator('.map-goal').count()) === 0);
await closeMap();
await page.locator('.btn-menu').dispatchEvent('pointerdown');
await page.waitForSelector('.phone-app');
await page.waitForTimeout(300);
await page.locator('.phone-app', { hasText: '옵션' }).dispatchEvent('pointerdown');
await page.locator('.opt-guide').dispatchEvent('pointerdown');
const label = await page.locator('.opt-guide').textContent();
await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
await page.locator('.menu-layer .btn-close').dispatchEvent('pointerdown');
await page.waitForTimeout(150);
check('옵션에서 공략 켜기(이 기기에 저장)', label === '켜짐' && (await page.evaluate(() => JSON.parse(localStorage.getItem('wd_topview_settings_v1')).guide)) === true, label);

// ---------------------------------------------------------------- 지도 표시 검사(단계마다)
const ui = { steps: 0, wrong: [], spoiler: [], codesShown: new Set(), otherFloor: 0 };
async function checkMap(G) {
  await openMap();
  const r = await page.evaluate(G => {
    const wrapOf = m => document.querySelector(`.map-layer canvas[data-map="${m}"]`)?.parentElement;
    const panel = document.querySelector('.map-guide')?.textContent || '';
    return {
      panel,
      goal: !!wrapOf(G.at[0])?.querySelector('.map-goal'),
      goals: document.querySelectorAll('.map-goal').length,
      via: G.via ? !!wrapOf(G.via[0])?.querySelector('.map-via') : document.querySelectorAll('.map-via').length === 0,
      items: document.querySelectorAll('.map-item').length,
      toolCode: __game.flags.toolCode, noteCode: __game.flags.noteCode,
      hasBelt: __game.has('toolbelt'), hasNote: __game.has('note'),
      unvisited: G.at[0] !== __game.mapId && !Object.keys(__game.flags).some(k => k.startsWith(`seen:${G.at[0]}:`)),
    };
  }, G);
  await closeMap();
  ui.steps++;
  const bad = [];
  if (!r.panel.includes(G.text)) bad.push('패널 문구');
  if (!r.goal || r.goals !== 1) bad.push(`목적지 표시(${r.goals})`);
  if (!r.via) bad.push('이동 지점');
  if (r.items !== G.items.length) bad.push(`아이템 ${r.items}/${G.items.length}`);
  if (bad.length) ui.wrong.push(`${G.text}: ${bad.join(', ')}`);
  if (r.panel.includes(r.toolCode) && !r.hasBelt) ui.spoiler.push(`열쇠보관함 번호가 공구벨트 전에 보임 (${G.text})`);
  if (r.panel.includes(r.noteCode) && !r.hasNote) ui.spoiler.push(`금고 번호가 쪽지 전에 보임 (${G.text})`);
  if (r.panel.includes(r.toolCode)) ui.codesShown.add('tool');
  if (r.panel.includes(r.noteCode)) ui.codesShown.add('note');
  if (r.unvisited && r.goal) ui.otherFloor++;
}

// ---------------------------------------------------------------- 공략 따라가기
async function tryGo(x, y) {
  const from = await mapId();
  for (let i = 0; i < 6; i++) {
    const r = await page.evaluate(([x, y]) => __bot.walkTo(x, y), [x, y]);
    if (r.ok) return true;
    if (r.reason !== 'modal') return false;
    if ((await settle()) === 'end') return true;
    if ((await mapId()) !== from) return true; // 계단·환풍구로 층이 바뀌면 멈춘다(도착한 층의 같은 좌표 계단을 다시 밟지 않게)
  }
  return false; // 잠긴 문 안내만 반복 = 이 길로는 못 간다
}
// 목적지 칸을 조사할 수 있는 이웃 칸(갈 수 있고, 열쇠 없는 잠긴 문을 지나지 않는 것)을 가까운 순으로
const approaches = (x, y) => page.evaluate(([x, y]) => {
  const G = __game, W = G.world, p = G.player;
  const out = [];
  for (const [dx, dy, dir] of [[0, -1, 'down'], [0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left']]) {
    const c = x + dx, r = y + dy;
    if (W.isWall(c, r) || W.ch(c, r) === ' ' || W.ch(c, r) === 'D' || W.solidProps.has(c + ',' + r)) continue;
    W.pathDoors = true;
    const route = W.path(p.x, p.y, c + 0.5, r + 0.5);
    W.pathDoors = false;
    if (!route) continue;
    const blocked = route.some(([cc, rr]) => { const d = W.door(cc, rr); return d?.locked && !(typeof d.locked === 'string' && G.has(d.locked)); });
    if (!blocked) out.push({ c, r, dir, len: route.length });
  }
  return out.sort((a, b) => a.len - b.len);
}, [x, y]);
const keyOf = G => JSON.stringify([G?.text, G?.at, G?.via]);

let last = null, end = false;
for (let step = 0; step < 150 && !end; step++) {
  if ((await settle()) === 'end') { end = true; break; }
  const G = await guide();
  if (!G) await finish('공략이 비어 있음(1장 끝 전)');
  const key = keyOf(G);
  if (key !== last) { log('공략', G.text, G.via ? `→ ${G.via[3]}` : ''); await checkMap(G); last = key; }
  const [m, x, y] = G.via || G.at;
  if (m !== (await mapId())) await finish(`이동 지점이 지금 층에 없음: ${m}`);
  // 그 칸에서 지금 살아 있는 사건이 '밟기'뿐이면 밟고, 아니면 이웃 칸에서 조사
  const touch = await page.evaluate(([m, x, y]) => {
    const live = (__game.story.maps[m].events || []).filter(e => x >= e.x && x < e.x + (e.w || 1) && y >= e.y && y < e.y + (e.h || 1) && !__game.evDone(e) && (!e.cond || e.cond(__game)));
    return live.some(e => e.on === 'touch') && !live.some(e => e.on === 'act');
  }, [m, x, y]);
  let moved = false;
  if (touch) {
    if (await tryGo(x + 0.5, y + 0.5)) {
      // 밟은 뒤 이어지는 사건(수위 추격 → 구출 등)이 끝날 때까지 잠깐 기다린다
      for (let t = 0; t < 12 && keyOf(await guide()) === key; t++) {
        const r = await page.evaluate(() => __bot.idle(500));
        if (!r.ok && (await settle()) === 'end') { end = true; break; }
      }
      moved = end || keyOf(await guide()) !== key;
    }
  } else {
    for (const a of await approaches(x, y)) {
      if (!(await tryGo(a.c + 0.5, a.r + 0.5))) continue;
      await page.evaluate(d => __bot.act(d), a.dir);
      if ((await settle()) === 'end') { end = true; break; }
      if (keyOf(await guide()) !== key) { moved = true; break; }
    }
  }
  if (!end && !moved) await finish(`공략대로 했는데 진행되지 않음: ${G.text}`);
}

check('공략만 보고 1장 완주(루트 ' + ROUTE + ')', end, `${ui.steps}단계`);
check('단계마다 지도에 공략 문구·목적지·이동 지점·아이템 표시', !ui.wrong.length, ui.wrong.slice(0, 4).join(' | '));
check('단서를 읽기 전에는 비밀번호 비공개', !ui.spoiler.length, ui.spoiler.join(' | '));
check('단서를 읽은 뒤 두 비밀번호 모두 공개', ui.codesShown.has('tool') && ui.codesShown.has('note'), [...ui.codesShown].join(','));
check('안 가 본 층의 목적지도 지도에 표시', ui.otherFloor > 0, `${ui.otherFloor}회`);

// 끄면 다시 지도에 공략 없음
await page.evaluate(() => { localStorage.setItem('wd_topview_settings_v1', JSON.stringify({ guide: false })); });
await page.reload();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await settle();
await openMap();
check('공략 끄면 지도에 공략 없음(다시 열어도 유지)', (await page.locator('.map-guide').count()) === 0 && (await page.locator('.map-goal, .map-item, .map-via').count()) === 0);
await finish();
