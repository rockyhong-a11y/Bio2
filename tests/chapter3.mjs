// 3장 공략 완주 테스트 (QA): 챕터 선택 → 3장(루트 선택) → 봇이 '공략만 보고' 실제 입력으로 차단기(3장 끝)까지 진행한다.
//   봇은 줄거리를 모른다. 매 단계 지도를 열어 공략 패널·목적지·이동 지점·아이템 표시를 확인한 뒤,
//   공략이 가리키는 곳(다른 층이면 이동 지점)으로 가서 밟거나 조사하고, 세계 시계·카드 복사기·차단기 답도 공략에 나온 값만 쓴다.
//   - 스피커 밀기: 공략 문구의 방향으로 민다 / 옥상 수영장: 화면에 반짝이는 칸(L로드 수맥 길)만 골라 밟고 건넌다
//   - 단서(시차표·테이프·별자리 메모·강당 전원 안내·괴담 쪽지)를 보기 전에는 답이 공략에 나오면 실패
//   - 동행과 '걷기'로만 이동: 정상 진행에서는 짜증(strikes)이 0이어야 한다
//   - 수위·귀신은 qaSafe로 정지(진행 경로 검증용). 탄·추격·발목·수맥 이탈 같은 실패 규칙은 tests/chapter3_rules.mjs
// 사용: node tests/chapter3.mjs [B|A]
import { openMobile } from './helpers.mjs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROUTE = (process.argv[2] || 'B').toUpperCase();
const here = path.dirname(fileURLToPath(import.meta.url));
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const { browser, page, errors } = await openMobile({ init: () => localStorage.setItem('wd_topview_settings_v1', JSON.stringify({ guide: true })) });
const T0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - T0) / 1000).toFixed(1)}s]`, ...a);
async function finish(extra) {
  if (extra) check(extra, false, JSON.stringify(await page.evaluate(() => ({ map: __game.mapId, x: __game.player.x.toFixed(1), y: __game.player.y.toFixed(1), hp: __game.hp, guide: __game.story.guide(__game)?.text }))));
  check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const bad = results.filter(r => !r.ok).length;
  console.log(`\n${results.length - bad}/${results.length} PASS (루트 ${ROUTE})`);
  process.exit(bad ? 1 : 0);
}
const guide = () => page.evaluate(() => __game.story.guide(__game));
const mapId = () => page.evaluate(() => __game.mapId);
const flag = k => page.evaluate(k => __game.flags[k], k);
const digits = s => (String(s).match(/\d/g) || []);
// 화면 제목 → 공략 '답' 줄
const codeFor = async title => {
  const key = title.includes('복사기') ? '카드 복사기' : title.includes('차단기') ? '차단기' : title.includes('시계') ? '세계 시계' : null;
  return key && (await guide())?.codes.find(c => c.label.includes(key))?.value;
};
const cgs = [];

// 열린 화면 처리. 선택지는 언제나 첫 번째(3장 선택지는 첫 번째가 진행)
async function settle(maxMs = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => {
      const L = [...document.querySelectorAll('#ui .layer')].pop();
      return { busy: __game.busy, modal: __game.ui.modalCount, cls: L?.className || '', title: L?.querySelector('.keypad-title')?.textContent || '', over: __game.over, age: L ? performance.now() - Number(L.dataset.t0) : 1e9 };
    });
    if (st.cls.includes('end')) return 'end';
    if (st.over || st.cls.includes('over-layer')) await finish('게임 오버 없이 진행');
    if (!st.modal && !st.busy) return 'free';
    if (st.age < 250) await page.waitForTimeout(250 - st.age); // 레이어 열린 직후 0.2초 탭 무시
    const L = '#ui .layer:last-of-type';
    if (st.cls.includes('cg-layer')) {
      cgs.push(await page.evaluate(() => document.querySelector('.cg-img')?.getAttribute('src')));
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('dialog-layer') || st.cls.includes('card-layer')) {
      await page.locator(L).dispatchEvent('pointerdown').catch(() => {});
    } else if (st.cls.includes('choice-layer')) {
      await page.locator(`${L} .choice-opt`).first().dispatchEvent('pointerdown');
    } else if (st.cls.includes('doc-layer') || st.cls.includes('save-layer')) {
      await page.locator(`${L} .btn-close`).first().dispatchEvent('pointerdown');
    } else if (st.cls.includes('qte-layer')) {
      for (let i = 0; i < 14; i++) { await page.locator(L).dispatchEvent('pointerdown'); await page.waitForTimeout(60); }
    } else if (st.cls.includes('keypad-layer') && (await page.locator(`${L} .dial-row`).count())) {
      const ans = String(await codeFor(st.title) || '');
      const rows = await page.locator(`${L} .dial-row`).count();
      log('다이얼', st.title, ans);
      for (let i = 0; i < rows; i++) {
        const row = page.locator(`${L} .dial-row`).nth(i);
        const label = await row.locator('.dial-label').textContent();
        const want = ans.match(new RegExp(`${label}\\s*(\\d+)시`))?.[1];
        if (want == null) await finish(`공략에 다이얼 답 없음: ${label}`);
        for (let k = 0; k < 30 && (await row.locator('.dial-value').textContent()) !== `${want}시`; k++) await row.locator('.dial-next').dispatchEvent('pointerdown');
      }
      await page.locator(`${L} .btn-close.ok`).dispatchEvent('pointerdown');
    } else if (st.cls.includes('keypad-layer') && (await page.locator(`${L} .keypad-grid`).count())) {
      const code = digits(await codeFor(st.title));
      if (code.length !== 4) await finish(`공략에 번호 없음: ${st.title}`);
      log('키패드', st.title, code.join(''));
      for (const ch of code) await page.locator(`${L} .key`, { hasText: new RegExp(`^${ch}$`) }).dispatchEvent('pointerdown');
      await page.waitForTimeout(300);
    } else if (st.cls.includes('keypad-layer')) {
      const on = digits(await codeFor(st.title));
      if (!on.length) await finish(`공략에 차단기 답 없음: ${st.title}`);
      log('차단기', on.join(','));
      for (const n of on) await page.locator(`${L} .switch`).nth(Number(n) - 1).dispatchEvent('pointerdown');
      await page.locator(`${L} .btn-close.ok`).dispatchEvent('pointerdown');
    } else await page.waitForTimeout(100);
    await page.waitForTimeout(60);
  }
  await finish('화면 처리 시간 초과');
}

// ---------------------------------------------------------------- 시작: 챕터 선택 → 3장 → 루트
await page.addScriptTag({ path: path.join(here, 'bot.js') });
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
await page.locator('.title-btn', { hasText: '챕터 선택' }).dispatchEvent('pointerdown');
await page.waitForSelector('.chapter-btn');
await page.waitForTimeout(300);
await page.locator('.chapter-btn').nth(2).dispatchEvent('pointerdown');
await page.waitForSelector('.chapter-route');
await page.waitForTimeout(600);
await page.locator('.chapter-route', { hasText: ROUTE === 'B' ? '소영' : '성아' }).dispatchEvent('pointerdown');
await page.waitForTimeout(300);
await page.evaluate(() => {
  const g = __game;
  g.qaSafe = true; g.timeScale = 2;
  window.__drags = 0; // 수맥 길을 벗어나 끌려간 횟수
  const run = g.run.bind(g);
  g.run = (n, ...a) => { if (n === 'poolDrag') window.__drags++; return run(n, ...a); };
});
await settle();
const hero = ROUTE === 'B' ? 'soyoung' : 'jihyeon';
const start = await page.evaluate(() => ({ map: __game.mapId, f: __game.flags.follower, ok: __game.actor(__game.flags.follower)?.constructor.name === 'Follower', ch2: __game.flags.ch2Clear, route: __game.flags.route }));
check(`3장 시작: 신관 1층 로비, ${hero} 동행, 2장 완료 상태`, start.map === 'shingwan_1f' && start.f === hero && start.ok && start.ch2 === ROUTE && start.route === ROUTE, JSON.stringify(start));

// ---------------------------------------------------------------- 지도 표시 검사(단계마다)
// 지도 버튼은 사건 진행 중(대사·이동 연출)엔 무시되므로, 막 시작된 사건이 끝난 뒤 다시 누른다
async function openMap() {
  for (let i = 0; i < 6; i++) {
    await settle();
    await page.locator('.btn-map').dispatchEvent('pointerdown');
    if (await page.waitForSelector('.map-layer', { timeout: 1500 }).then(() => true, () => false)) { await page.waitForTimeout(250); return; }
  }
  await finish('지도가 열리지 않음');
}
async function closeMap() { await page.locator('.map-layer .btn-close').dispatchEvent('pointerdown'); await page.waitForTimeout(120); }
const ui = { steps: 0, wrong: [], spoiler: [], codesShown: new Set() };
async function checkMap(G) {
  await openMap();
  if (keyOf(await guide()) !== keyOf(G)) { await closeMap(); return; } // 지도를 여는 사이 사건이 일어나 공략이 바뀜 → 다음 단계에서 검사
  const r = await page.evaluate(G => {
    const wrapOf = m => document.querySelector(`.map-layer canvas[data-map="${m}"]`)?.parentElement;
    const f = __game.flags, list = k => String(f[k] || '').split(',').filter(Boolean);
    return {
      panel: document.querySelector('.map-guide')?.textContent || '',
      goal: !!wrapOf(G.at[0])?.querySelector('.map-goal'),
      goals: document.querySelectorAll('.map-goal').length,
      via: G.via ? !!wrapOf(G.via[0])?.querySelector('.map-via') : document.querySelectorAll('.map-via').length === 0,
      items: document.querySelectorAll('.map-item').length,
      // 답 문자열과 그 답을 알려 주는 단서를 봤는지
      ans: {
        tape: [f.tapeCode, !!f.tapeHeard],
        power: [list('breakerCode').join(' · ') + '번', !!f.powerRead],
        stars: [list('lightSeq').map(n => '3-' + n).join(' → '), !!f.starRead],
        clock: ['(그리니치', !!f.clockRead],
        spider: [list('spiderList').map(n => '3-' + n).join(' → '), !!f.spiderActive],
      },
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
  for (const [k, [ans, seen]] of Object.entries(r.ans)) {
    if (!r.panel.includes(ans)) continue;
    if (seen) ui.codesShown.add(k); else ui.spoiler.push(`${k} 답이 단서 전에 보임 (${G.text})`);
  }
}

// ---------------------------------------------------------------- 공략 따라가기
async function tryGo(x, y) {
  const from = await mapId();
  for (let i = 0; i < 6; i++) {
    const r = await page.evaluate(([x, y]) => __bot.walkTo(x, y, false), [x, y]); // 걷기(동행 짜증 없이)
    if (r.ok) return true;
    if (r.reason !== 'modal') return false;
    if ((await settle()) === 'end') return true;
    if ((await mapId()) !== from) return true; // 계단으로 층이 바뀌면 멈춘다
  }
  return false;
}
// 목적지 칸을 조사할 수 있는 이웃 칸(갈 수 있고, 열쇠 없는 잠긴 문을 지나지 않는 것)을 가까운 순으로
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
const keyOf = G => JSON.stringify([G?.text, G?.at, G?.via]);
async function waitLaters() {
  for (let t = 0; t < 20; t++) {
    if (!(await page.evaluate(() => __game.laters.length))) return false;
    const r = await page.evaluate(() => __bot.idle(500));
    if (!r.ok && (await settle()) === 'end') return true;
  }
  return false;
}

// 옥상 수영장 건너기: 물가를 따라 걷다가 반짝이는 칸(L로드)이 보이면 그 칸만 이어 밟는다
const glows = () => page.evaluate(() => (__game.world.def.dynGlows?.(__game) || []).map(g => [Math.floor(g.x), Math.floor(g.y)]));
const tileOf = () => page.evaluate(() => [Math.floor(__game.player.x), Math.floor(__game.player.y)]);
const pool = { crossings: 0, steps: 0 };
async function crossPool(toNorth) {
  // deckRow: 물에 맞닿은 데크 줄, exitDy: 건너는 방향. 찾는 동안은 물에서 한 줄 떨어진 줄을 걷는다(길찾기가 물칸을 스치지 않게)
  const deckRow = toNorth ? 13 : 4, exitDy = toNorth ? -1 : 1, scanRow = deckRow - exitDy;
  let G = await glows();
  // 1) 데크를 따라 반짝이는 칸 찾기(지금 위치에서 가까운 쪽부터)
  const x0 = (await tileOf())[0];
  for (const dx of [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10, 12, -12, 14, -14, 16, -16, 18, -18, 20, -20, 22, -22, 24, -24, 26, -26]) {
    if (G.length) break;
    const x = x0 + dx;
    if (x < 1 || x > 28) continue;
    await tryGo(x + 0.5, scanRow + 0.5);
    G = await glows();
  }
  if (!G.length) return finish('물가를 다 걸어도 반짝이는 칸이 없음');
  // 2) 가장 가까운 반짝이는 칸 앞 물가로 가서 올라서기
  const [px, py] = await tileOf();
  const entry = G.filter(([c, r]) => r === deckRow + exitDy).sort((a, b) => Math.abs(a[0] - px) - Math.abs(b[0] - px))[0];
  if (!entry) return finish('물가에 붙은 반짝이는 칸이 없음');
  if (!(await tryGo(entry[0] + 0.5, deckRow + 0.5))) return finish('물가 진입 지점으로 못 감');
  const seen = new Set();
  let cur = entry;
  for (let i = 0; i < 60; i++) {
    if (!(await tryGo(cur[0] + 0.5, cur[1] + 0.5))) return finish(`반짝이는 칸으로 못 감 ${cur}`);
    pool.steps++;
    seen.add(cur.join(','));
    const next = (await glows()).find(([c, r]) => !seen.has(`${c},${r}`) && Math.abs(c - cur[0]) + Math.abs(r - cur[1]) === 1);
    if (next) { cur = next; continue; }
    // 더 이어지는 칸이 없으면 건너편 물가로 내려선다
    if (!(await tryGo(cur[0] + 0.5, cur[1] + exitDy + 0.5))) return finish('건너편 물가로 못 내려섬');
    pool.crossings++;
    return;
  }
  return finish('반짝이는 칸이 끝나지 않음');
}

let last = null, end = false;
for (let step = 0; step < 320 && !end; step++) {
  if ((await settle()) === 'end') { end = true; break; }
  const G = await guide();
  if (!G) await finish('공략이 비어 있음(3장 끝 전)');
  const key = keyOf(G);
  if (key !== last) { log('공략', G.text, G.via ? `→ ${G.via[3]}` : ''); await checkMap(G); last = key; }
  const [m, x, y] = G.via || G.at;
  if (m !== (await mapId())) await finish(`이동 지점이 지금 층에 없음: ${m}`);
  // 옥상: 물이 차 있으면 반대편으로 갈 때 수맥 길로 건넌다
  if (m === 'shingwan_roof' && !(await flag('poolDrained'))) {
    const py = await page.evaluate(() => __game.player.y);
    if (py > 12.5 && y < 5) await crossPool(true);
    else if (py < 5 && y > 12) await crossPool(false);
  }
  const pushDir = G.text.startsWith('스피커를') ? ({ 오른쪽: 'right', 왼쪽: 'left', 위: 'up', 아래: 'down' })[G.text.match(/^스피커를 (오른쪽|왼쪽|위|아래)로/)?.[1]] : null;
  // 그 칸에서 지금 살아 있는 사건이 '밟기'뿐이면 밟고, 아니면 이웃 칸에서 조사
  const touch = await page.evaluate(([m, x, y]) => {
    const live = (__game.story.maps[m].events || []).filter(e => { const [ex, ey] = e.at ? e.at(__game) : [e.x, e.y]; return x >= ex && x < ex + (e.w || 1) && y >= ey && y < ey + (e.h || 1) && !__game.evDone(e) && (!e.cond || e.cond(__game)); });
    return live.some(e => e.on === 'touch') && !live.some(e => e.on === 'act');
  }, [m, x, y]);
  let moved = false;
  if (touch) {
    if (await tryGo(x + 0.5, y + 0.5)) {
      for (let t = 0; t < 12 && keyOf(await guide()) === key; t++) {
        const r = await page.evaluate(() => __bot.idle(500));
        if (!r.ok && (await settle()) === 'end') { end = true; break; }
      }
      if (!end && (await waitLaters())) end = true;
      moved = end || keyOf(await guide()) !== key;
    }
  } else {
    for (const a of (await approaches(x, y)).filter(a => !pushDir || a.dir === pushDir)) {
      if (!(await tryGo(a.c + 0.5, a.r + 0.5))) continue;
      await page.evaluate(d => __bot.act(d), a.dir);
      if ((await settle()) === 'end' || (await waitLaters())) { end = true; break; }
      if (keyOf(await guide()) !== key) { moved = true; break; }
    }
  }
  if (!end && !moved) await finish(`공략대로 했는데 진행되지 않음: ${G.text}`);
}

// ---------------------------------------------------------------- 결과
const st = await page.evaluate(h => ({ f: { ...__game.flags }, strikes: __game.flags['strikes_' + h] || 0, drags: window.__drags, end: document.querySelector('.over-layer.end')?.textContent || '' }), hero);
check(`공략만 보고 3장 완주(루트 ${ROUTE})`, end && st.f.ch3Clear === ROUTE, `${ui.steps}단계`);
check('단계마다 지도에 공략 문구·목적지·이동 지점·아이템 표시', !ui.wrong.length, ui.wrong.slice(0, 4).join(' | '));
check('단서를 보기 전에는 답 비공개', !ui.spoiler.length, ui.spoiler.join(' | '));
check('단서를 본 뒤 답 공개(테이프·강당 전원·별자리·세계 시계·구석의 아이)', ui.codesShown.size === 5, [...ui.codesShown].join(','));
check(`엔딩 문구: 제3장 끝, ${ROUTE === 'B' ? '소영' : '성아·지현'} 루트, 4장 준비 중`, st.end.includes('제3장 끝') && st.end.includes(ROUTE === 'B' ? '소영 루트' : '성아·지현 루트') && st.end.includes('제4장'), st.end);
check('주요 사건 모두 거침(거울 3라운드·서고·세계 시계·복사기·오컬트부·레버·수영장·水의 문·은미 추락·차단기)',
  ['mirrorDone', 'fuseOn', 'clockDone', 'copierDone', 'occultDone', 'leverDone', 'poolDrained', 'mermaidDead', 'sealOpen', 'eunmiFell', 'breakerDone'].every(k => st.f[k]),
  ['mirrorDone', 'fuseOn', 'clockDone', 'copierDone', 'occultDone', 'leverDone', 'poolDrained', 'mermaidDead', 'sealOpen', 'eunmiFell', 'breakerDone'].filter(k => !st.f[k]).join(','));
check('선택 이벤트 3-03 구석의 아이 완료', !!st.f.spiderDone);
if (ROUTE === 'B') check('B루트: 4층에서 지현이 두 번째 동행으로 합류, 3-10 휴게실에서 캔커피 → 다이어리 순서(하얀 국화 조건)', st.f.follower2 === 'jihyeon' && st.f.jiFound && st.f.restDone && st.f.coffeeGiven && st.f.diaryGiven && st.f.restOrderOK && st.f.chrysanthemum, JSON.stringify({ f2: st.f.follower2, rest: st.f.restDone, order: st.f.restOrderOK, flower: st.f.chrysanthemum }));
else check('A루트: 지현이 역사관에서 달아났다가 4층에서 다시 동행, 신문고 투고', st.f.jiLost && st.f.jiFound && st.f.follower === 'jihyeon' && st.f.tapeSubmitted, JSON.stringify({ lost: st.f.jiLost, found: st.f.jiFound, f: st.f.follower, tape: st.f.tapeSubmitted }));
check('옥상: 반짝이는 칸만 밟아 수영장을 두 번 건넘(끌려가지 않음)', pool.crossings === 2 && st.drags === 0, JSON.stringify({ ...pool, drags: st.drags }));
const need = ['cg_mannequin', 'cg_mirror', 'cg_mermaid', 'cg_water', 'cg_eunmi', 'cg_fall'];
check('3장 CG 6장 모두 나옴', need.every(n => cgs.some(c => c?.includes(n))), need.filter(n => !cgs.some(c => c?.includes(n))).join(','));
check('걷기로 정상 진행: 동행 짜증 0', st.strikes === 0, String(st.strikes));
await finish();
