// 4장·5장 공략 완주 테스트 (QA): 챕터 선택 → 4장(루트 선택) → 봇이 '공략만 보고' 실제 입력으로 엔딩까지 진행한다.
//   봇은 줄거리를 모른다. 매 단계 지도를 열어 공략 패널·목적지·이동 지점을 확인한 뒤, 공략이 가리키는 곳으로 가서 밟거나 조사한다.
//   - 조종 패널 스위치는 공략에 나온 이름만 올린다(영사실 메모를 읽기 전에는 공략에 답이 나오면 실패)
//   - 선택지: B 소영은 '곁에 앉아 기다린다'·'안아 든다', A는 '지현에게 돌아간다' (나머지는 첫 번째)
//   - 귀신은 qaSafe로 정지, 제한 시간은 넉넉히 늘린다(진행 경로 검증용). 시간 초과·장벽·안기 감속 같은 규칙은 tests/chapter4_rules.mjs
// 사용: node tests/chapter4.mjs [B|A] [4|5]   →  B: 하얀 국화 / A: 민들레 / '5': 챕터 선택 5장(미궁)부터(B 전용)
import { openMobile } from './helpers.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROUTE = (process.argv[2] || 'B').toUpperCase();
const CH = Number(process.argv[3] || 4);
const here = path.dirname(fileURLToPath(import.meta.url));
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const { browser, page, errors } = await openMobile({ init: () => { localStorage.setItem('wd_topview_settings_v1', JSON.stringify({ guide: true })); localStorage.removeItem('wd_topview_endings_v1'); } });
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
async function finish(extra) {
  if (extra) check(extra, false, JSON.stringify(await page.evaluate(() => ({ map: __game.mapId, x: __game.player.x.toFixed(1), y: __game.player.y.toFixed(1), hp: __game.hp, guide: __game.story.guide(__game)?.text }))));
  check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const bad = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} PASS (루트 ${ROUTE}, ${CH}장부터)`);
  process.exit(bad ? 1 : 0);
}
const guide = () => page.evaluate(() => __game.story.guide(__game));
const mapId = () => page.evaluate(() => __game.mapId);
const PREFER = ['곁에 앉아', '안아 든다', '지현에게 돌아간다'];
const cgs = [];

async function settle(maxMs = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => {
      const L = [...document.querySelectorAll('#ui .layer')].pop();
      if (__game.timer && __game.timer.left < 1000) __game.timer.left = 3000; // 경로 검증: 시간 제한 끔
      return { busy: __game.busy, modal: __game.ui.modalCount, cls: L?.className || '', over: __game.over, age: L ? performance.now() - Number(L.dataset.t0) : 1e9 };
    });
    if (st.cls.includes('ending-layer')) return 'end';
    if (st.over || st.cls.includes('over-layer')) await finish('게임 오버 없이 진행');
    if (!st.modal && !st.busy) return 'free';
    if (st.age < 250) await page.waitForTimeout(250 - st.age);
    const L = '#ui .layer:last-of-type';
    if (st.cls.includes('cg-layer')) {
      cgs.push(await page.evaluate(() => document.querySelector('.cg-img')?.getAttribute('src')));
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('dialog-layer') || st.cls.includes('card-layer')) {
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('choice-layer')) {
      const opts = await page.locator(`${L} .choice-opt`).allTextContents();
      const i = Math.max(0, opts.findIndex(o => PREFER.some(p => o.includes(p))));
      await page.locator(`${L} .choice-opt`).nth(i).dispatchEvent('pointerdown');
    } else if (st.cls.includes('doc-layer') || st.cls.includes('save-layer')) {
      await page.locator(`${L} .btn-close`).first().dispatchEvent('pointerdown');
    } else if (st.cls.includes('keypad-layer')) {
      const ans = (await guide())?.codes.find(c => c.label.includes('조종 패널'))?.value || '';
      const labels = await page.locator(`${L} .switch-label`).allTextContents();
      const on = labels.map((l, i) => (ans.includes(l) ? i : -1)).filter(i => i >= 0);
      if (!on.length) await finish('공략에 조종 패널 답 없음');
      log('조종 패널', on.map(i => labels[i]).join(','));
      for (const i of on) await page.locator(`${L} .switch`).nth(i).dispatchEvent('pointerdown');
      await page.locator(`${L} .btn-close.ok`).dispatchEvent('pointerdown');
    } else await page.waitForTimeout(100);
    await page.waitForTimeout(60);
  }
  await finish('화면 처리 시간 초과');
}

// ---------------------------------------------------------------- 시작: 챕터 선택 → 4장 → 루트
await page.addScriptTag({ path: path.join(here, 'bot.js') });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn', { hasText: '챕터 선택' }).dispatchEvent('pointerdown');
await page.waitForSelector('.chapter-btn');
await page.waitForTimeout(300);
await page.locator('.chapter-btn').nth(CH - 1).dispatchEvent('pointerdown');
if (CH === 4) {
  await page.waitForSelector('.chapter-route');
  await page.waitForTimeout(600);
  await page.locator('.chapter-route', { hasText: ROUTE === 'B' ? '소영' : '성아' }).dispatchEvent('pointerdown');
}
await page.waitForTimeout(300);
await page.evaluate(() => { __game.qaSafe = true; __game.timeScale = 2; });
await settle();
const start = await page.evaluate(() => ({ map: __game.mapId, f: __game.flags.follower, f2: __game.flags.follower2, ch3: __game.flags.ch3Clear, seonga: !!__game.actor('seonga'), t: __game.timer && Math.round(__game.timer.left) }));
if (CH === 4) check('4장 시작: 강당 2층, 동행, 3장 완료 상태', start.map === 'auditorium_2f' && start.ch3 === ROUTE && (ROUTE === 'B' ? start.f === 'soyoung' && start.f2 === 'jihyeon' : start.f === 'jihyeon'), JSON.stringify(start));
else check('5장 시작(루트 선택 없음): 미궁 입구, 동행 없음, 성아는 말을 마치고 사라짐, 8분 타이머', start.map === 'maze' && !start.f && !start.seonga && start.t > 400, JSON.stringify(start));

// ---------------------------------------------------------------- 지도 표시 검사(단계마다)
async function openMap() {
  for (let i = 0; i < 6; i++) {
    await settle();
    await page.locator('.btn-map').dispatchEvent('pointerdown');
    if (await page.waitForSelector('.map-layer', { timeout: 1500 }).then(() => true, () => false)) { await page.waitForTimeout(250); return; }
  }
  await finish('지도가 열리지 않음');
}
async function closeMap() { await page.locator('.map-layer .btn-close').dispatchEvent('pointerdown'); await page.waitForTimeout(120); }
const keyOf = G => JSON.stringify([G?.text, G?.at, G?.via]);
const ui = { steps: 0, wrong: [], spoiler: [] };
async function checkMap(G) {
  await openMap();
  if (keyOf(await guide()) !== keyOf(G)) { await closeMap(); return; }
  const r = await page.evaluate(G => {
    const wrapOf = m => document.querySelector(`.map-layer canvas[data-map="${m}"]`)?.parentElement;
    return {
      panel: document.querySelector('.map-guide')?.textContent || '',
      goal: !!wrapOf(G.at[0])?.querySelector('.map-goal'),
      goals: document.querySelectorAll('.map-goal').length,
      via: G.via ? !!wrapOf(G.via[0])?.querySelector('.map-via') : document.querySelectorAll('.map-via').length === 0,
      code: String(__game.flags.panelCode || '').split(',').map(i => ['무대 조명', '객석 조명', '막', '방화 셔터', '환기'][+i - 1]).join(' · '),
      noteRead: !!__game.flags.noteRead,
    };
  }, G);
  await closeMap();
  ui.steps++;
  const bad = [];
  if (!r.panel.includes(G.text)) bad.push('패널 문구');
  if (!r.goal || r.goals !== 1) bad.push(`목적지 표시(${r.goals})`);
  if (!r.via) bad.push('이동 지점');
  if (bad.length) ui.wrong.push(`${G.text}: ${bad.join(', ')}`);
  if (r.code && r.panel.includes(r.code) && !r.noteRead) ui.spoiler.push(G.text);
}

// ---------------------------------------------------------------- 공략 따라가기
async function tryGo(x, y) {
  const from = await mapId();
  for (let i = 0; i < 6; i++) {
    const r = await page.evaluate(([x, y]) => __bot.walkTo(x, y, false), [x, y]);
    if (r.ok) return true;
    if (r.reason !== 'modal') return false;
    if ((await settle()) === 'end') return true;
    if ((await mapId()) !== from) return true;
  }
  return false;
}
const approaches = (x, y) => page.evaluate(([x, y]) => {
  const G = __game, W = G.world, p = G.player;
  const out = [];
  for (const [dx, dy, dir] of [[0, -1, 'down'], [0, 1, 'up'], [-1, 0, 'right'], [1, 0, 'left']]) {
    const c = x + dx, r = y + dy;
    if (W.isWall(c, r) || W.isSolid(c, r) || W.ch(c, r) === ' ' || W.ch(c, r) === 'D' || W.solidProps.has(c + ',' + r)) continue;
    W.pathDoors = true;
    const route = W.path(p.x, p.y, c + 0.5, r + 0.5);
    W.pathDoors = false;
    if (!route) continue;
    const blocked = route.some(([cc, rr]) => { const d = W.door(cc, rr); return d?.locked && !(typeof d.locked === 'string' && G.has(d.locked)); });
    if (!blocked) out.push({ c, r, dir, len: route.length });
  }
  return out.sort((a, b) => a.len - b.len);
}, [x, y]);

let last = null, end = false;
for (let step = 0; step < 200 && !end; step++) {
  if ((await settle()) === 'end') { end = true; break; }
  const G = await guide();
  if (!G) await finish('공략이 비어 있음(엔딩 전)');
  const key = keyOf(G);
  if (key !== last) { log('공략', G.text, G.via ? `→ ${G.via[3]}` : ''); await checkMap(G); last = key; }
  const [m, x, y] = G.via || G.at;
  if (m !== (await mapId())) await finish(`이동 지점이 지금 층에 없음: ${m}`);
  const touch = await page.evaluate(([m, x, y]) => {
    const live = (__game.story.maps[m].events || []).filter(e => x >= e.x && x < e.x + (e.w || 1) && y >= e.y && y < e.y + (e.h || 1) && !__game.evDone(e) && (!e.cond || e.cond(__game)));
    return live.some(e => e.on === 'touch') && !live.some(e => e.on === 'act');
  }, [m, x, y]);
  let moved = false;
  if (touch) {
    if (await tryGo(x + 0.5, y + 0.5)) {
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

// ---------------------------------------------------------------- 결과
const want = ROUTE === 'B' ? ['chrysanthemum', '하얀 국화'] : ['dandelion', '민들레'];
const st = await page.evaluate(() => ({ f: { ...__game.flags }, title: document.querySelector('.ending-layer .card-title')?.textContent || '', seen: JSON.parse(localStorage.getItem('wd_topview_endings_v1') || '[]') }));
check(`공략만 보고 엔딩까지 완주(루트 ${ROUTE})`, end, `${ui.steps}단계`);
check(`엔딩: ${want[1]} — 화면 제목·수집 기록`, st.title === want[1] && st.seen.includes(want[0]), JSON.stringify({ title: st.title, seen: st.seen }));
check('단계마다 지도에 공략 문구·목적지·이동 지점 표시', !ui.wrong.length, ui.wrong.slice(0, 4).join(' | '));
check('메모를 읽기 전에는 조종 패널 답 비공개', !ui.spoiler.length, ui.spoiler.join(' | '));
if (CH === 4) check('화재: 불 세 곳을 소화기로 끄고 스프링클러', ['out_f1', 'out_f2', 'out_f3', 'fireOut', 'doorsOpen', 'stageLit'].every(k => st.f[k]));
if (ROUTE === 'B') check('B: 미궁 다섯 패 → 붕괴 → 소영을 안고 탈출', st.f.mazeStep === 5 && st.f.collapsed && st.f.carrying && !st.f.soyoungAnnoyed, JSON.stringify({ step: st.f.mazeStep, carry: st.f.carrying }));
else check('A: 지현과 대화(따뜻하게 2번) → 성아 대신 지현', st.f.jhDialog === 2 && st.f.chooseJi, JSON.stringify({ jh: st.f.jhDialog }));
const need = [...(CH === 4 ? ['cg_stage', 'cg_fire'] : []), ...(ROUTE === 'B' ? ['cg_maze', 'end_white_chrysanthemum'] : ['end_dandelion'])];
check('CG 모두 나옴', need.every(n => cgs.some(c => c?.includes(n))), need.filter(n => !cgs.some(c => c?.includes(n))).join(','));
await finish();
