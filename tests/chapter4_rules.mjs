// 4장(강당)·5장(미궁)·엔딩 규칙 검증: 타이틀 → 챕터 선택 → 4장으로 시작해 상태를 만들고 스크립트·입력으로 규칙을 확인한다.
//  · 4-02 화재: 1층에 처음 내려서면 불(복도 세 곳·강당 문 앞)·5분 타이머·불 귀신 은미(길 찾아 추격, 닿으면 -25)·체크포인트
//    소화기 없이는 못 끔 / 소화기 하나 = 불 한 곳(다 쓰면 사라짐) / 강당 문 앞 불은 소화기로 안 꺼짐
//    5분이 지나면 폭발 → 게임 오버(주목 엔딩 기록) → 체크포인트에서 다시(불·타이머·은미 그대로)
//    밸브 핸들 + 소방 배관 → 스프링클러: 불·은미·타이머가 모두 사라지고 로비로 → B 소영이 쓰러짐
//  · 4-03 B: 흔들어 깨우기 3번이면 짜증(호감 -2) — 깨어나면 소영·지현이 다시 동행
//  · 5장 미궁: 火의 패 → 미궁·8분·체크포인트·동행 없음 / 차례가 아닌 패 앞은 빛의 장벽(막힘) / 화면이 점점 하얗게(overlay)
//    다섯 패 → 붕괴(2분) / 소영을 안으면 이동 속도 절반 / 시간이 다 되면 게임 오버
//  · 엔딩 분기: B 안고 나옴 → 하얀 국화(모든 조건)·아이비(조건 하나라도 빠짐) / 두고 나옴 → 히아신스
//    A 성아의 손 → 튜베로즈(테이프 투고)·흑단목 / 지현 + 구급상자 → 민들레(따뜻한 대화 2번)·접시꽃
//  · 엔딩 화면(꽃 이름·꽃말·에필로그·수집 수) · 타이틀 '엔딩 수집'(본 것만 공개, 나머지 ???)
//  · 콘솔 오류 없음
import { openMobile } from './helpers.mjs';

const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const J = o => JSON.stringify(o);
const { browser, page, errors } = await openMobile({ init: () => { if (!sessionStorage.getItem('qa4')) { sessionStorage.setItem('qa4', '1'); localStorage.removeItem('wd_topview_endings_v1'); } } });
const ev = (fn, arg) => page.evaluate(fn, arg);

// 페이지 안 도우미: 스크립트 실행 + 화면 처리(선택지는 choose 글자 우선)
function qaInstall() {
  const G = window.__game;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pd = el => el && el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  const top = () => { const ls = document.querySelectorAll('#ui .layer'); return ls[ls.length - 1] || null; };
  window.__qa = {
    async settle(choose = [], max = 30000) {
      const t0 = performance.now(), out = { texts: [], choices: [], cgs: [] };
      let idle = 0;
      while (performance.now() - t0 < max) {
        const L = top();
        if (!L) { if (!G.busy && !G.ui.modalCount && ++idle > 2) return { state: G.over ? 'over' : 'free', ...out }; await sleep(30); continue; }
        idle = 0;
        const cls = L.className;
        if (cls.includes('over-layer')) return { state: cls.includes('ending-layer') ? 'end' : 'over', ...out };
        const age = performance.now() - Number(L.dataset.t0 || 0);
        if (age < 205) { await sleep(207 - age); continue; }
        if (cls.includes('dialog-layer')) { pd(L); out.texts.push(L.querySelector('.dialog-text')?.textContent || ''); if (L.isConnected) pd(L); }
        else if (cls.includes('choice-layer')) {
          const opts = [...L.querySelectorAll('.choice-opt')];
          out.choices.push(opts.map(e => e.textContent));
          let pick = null;
          for (const c of choose) { pick = opts.find(e => e.textContent.includes(c)); if (pick) break; }
          pd(pick || opts[0]);
        } else if (cls.includes('cg-layer')) { out.cgs.push(L.querySelector('.cg-img')?.getAttribute('src') || ''); pd(L); }
        else if (cls.includes('doc-layer') || cls.includes('save-layer')) pd(L.querySelector('.btn-close'));
        else await sleep(60);
        await sleep(30);
      }
      return { state: 'timeout', ...out };
    },
    async run(name, choose) { G.run(name); await sleep(50); return window.__qa.settle(choose); },
    async fire(id, choose) { G.fire(G.world.def.events.find(e => e.id === id)); await sleep(50); return window.__qa.settle(choose); },
    async enter(map, x, y, choose) { G.enterMap(map, x, y, 'down'); await sleep(50); return window.__qa.settle(choose); },
    solid: (c, r) => G.world.isSolid(c, r),
    endingView: () => { const L = document.querySelector('.ending-layer'); return L && { flower: L.querySelector('.ending-flower')?.textContent, title: L.querySelector('.card-title')?.textContent, sub: L.querySelector('.card-sub')?.textContent, paras: L.querySelectorAll('.ending-text p').length, count: L.querySelector('.ending-count')?.textContent, btns: [...L.querySelectorAll('.title-btn')].map(b => b.textContent) }; },
  };
}

async function startCh4(route) {
  await page.waitForSelector('.title-btn');
  await page.waitForTimeout(300);
  await page.locator('.title-btn', { hasText: '챕터 선택' }).dispatchEvent('pointerdown');
  await page.waitForSelector('.chapter-btn');
  await page.waitForTimeout(300);
  await page.locator('.chapter-btn').nth(3).dispatchEvent('pointerdown');
  await page.waitForSelector('.chapter-route');
  await page.waitForTimeout(600);
  await page.locator('.chapter-route', { hasText: route === 'B' ? '소영' : '성아' }).dispatchEvent('pointerdown');
  await page.waitForTimeout(300);
  await ev(qaInstall);
  await ev(() => __qa.settle());
}
async function restart(route) { await page.reload(); await startCh4(route); }

// ================================================================ B: 화재
await startCh4('B');
await ev(() => { __game.flags.doorsOpen = true; __game.give('valve_wheel'); });
let r = await ev(() => __qa.enter('auditorium_1f', 37.5, 15.5));
let s = await ev(() => { const G = __game, e = G.actor('eunmi'); return { t: G.timer && Math.round(G.timer.left), label: G.timer?.label, e: e && { chase: e.chase, pf: e.pathfind, sp: e.speed, dmg: e.dmg }, cp: !!G.checkpointData, fires: [[7, 12], [8, 12], [31, 12], [32, 12], [31, 6], [32, 6], [19, 13], [20, 13]].map(([c, r]) => __qa.solid(c, r)) }; });
check('화재 시작: 5분 타이머·불 귀신 은미(길 찾아 추격 2.6·피해 25)·불 8칸이 막음·체크포인트', s.t === 300 && s.e?.chase && s.e.pf && s.e.sp === 2.6 && s.e.dmg === 25 && s.fires.every(Boolean) && s.cp && r.cgs.some(c => c.includes('cg_fire')), J(s));

await ev(() => { __game.qaSafe = true; });
r = await ev(() => __qa.fire('douse_f1'));
s = await ev(() => ({ out: !!__game.flags.out_f1, solid: __qa.solid(7, 12) }));
check('소화기 없이는 불을 못 끔', !s.out && s.solid && r.texts.some(t => t.includes('소화기')), J(s));
await ev(() => __game.give('extinguisher'));
await ev(() => __qa.fire('hallFire'));
s = await ev(() => ({ ext: __game.count('extinguisher'), solid: __qa.solid(19, 13) }));
check('강당 문 앞 불은 소화기로 안 꺼짐(소화기 그대로)', s.ext === 1 && s.solid, J(s));
await ev(() => __qa.fire('douse_f1'));
s = await ev(() => ({ out: !!__game.flags.out_f1, a: __qa.solid(7, 12), b: __qa.solid(8, 12), ext: __game.count('extinguisher'), other: __qa.solid(31, 12) }));
check('소화기 하나 = 불 한 곳(두 칸이 열리고 소화기는 사라짐, 다른 불은 그대로)', s.out && !s.a && !s.b && s.ext === 0 && s.other, J(s));

// 은미 추격·접촉
await ev(() => { const G = __game; G.qaSafe = false; G.player.x = 26.5; G.player.y = 15.5; const e = G.actor('eunmi'); e.x = 20.5; e.y = 15.5; e.stun = 0; G.invuln = 0; });
const d0 = await ev(() => Math.hypot(__game.actor('eunmi').x - __game.player.x, __game.actor('eunmi').y - __game.player.y));
await page.waitForTimeout(1200);
const d1 = await ev(() => Math.hypot(__game.actor('eunmi').x - __game.player.x, __game.actor('eunmi').y - __game.player.y));
const hp0 = await ev(() => __game.hp);
await page.waitForTimeout(2000);
s = await ev(() => ({ hp: __game.hp }));
check('은미가 다가와 닿으면 -25', d1 < d0 - 1 && s.hp <= hp0 - 25, J({ d0: d0.toFixed(1), d1: d1.toFixed(1), hp0, hp: s.hp }));
await ev(() => { __game.qaSafe = true; __game.hp = 100; });

// 5분 초과 → 폭발 사망(주목) → 체크포인트
await ev(() => { __game.timer.left = 0.05; });
r = await ev(() => __qa.settle());
s = await ev(() => ({ over: !!document.querySelector('.over-layer:not(.end)'), title: document.querySelector('.over-title')?.textContent, yew: document.querySelector('.over-layer .ending-flower')?.textContent, seen: JSON.parse(localStorage.getItem('wd_topview_endings_v1') || '[]') }));
check('5분이 지나면 폭발 → 게임 오버, 주목 엔딩 표시·기록', r.state === 'over' && s.over && s.title.includes('불길') && s.yew?.includes('주목') && s.seen.includes('yew'), J(s));
await page.waitForTimeout(1300);
await page.locator('.over-layer .title-btn', { hasText: '강당 화재' }).dispatchEvent('pointerdown');
await page.waitForTimeout(600);
await ev(() => __qa.settle());
s = await ev(() => ({ map: __game.mapId, t: __game.timer && Math.round(__game.timer.left), e: !!__game.actor('eunmi'), out: !!__game.flags.out_f1, fire: __qa.solid(7, 12) }));
check('체크포인트에서 다시: 불·5분 타이머·은미 그대로', s.map === 'auditorium_1f' && s.t >= 295 && s.e && !s.out && s.fire, J(s));

// 스프링클러
await ev(() => { if (!__game.has('valve_wheel')) __game.give('valve_wheel'); });
r = await ev(() => __qa.fire('pipe', ['돌린다']));
s = await ev(() => ({ out: !!__game.flags.fireOut, timer: __game.timer, e: !!__game.actor('eunmi'), fires: [[7, 12], [31, 12], [31, 6], [19, 13]].some(([c, r]) => __qa.solid(c, r)), y: __game.player.y, down: !!__game.flags.soyoungDown, f: __game.flags.follower, cp: __game.checkpointData }));
check('밸브 핸들 + 소방 배관 → 스프링클러: 불·은미·타이머 사라짐, 로비에서 소영이 쓰러짐(동행 해제)', s.out && !s.timer && !s.e && !s.fires && s.down && !s.f && !s.cp && s.y > 13, J(s));

// 4-03 흔들어 깨우기 3번 → 짜증
const aff0 = await ev(() => __game.flags.aff_soyoung || 0);
await ev(() => __qa.fire('soyoungDown', ['흔들어']));
await ev(() => __qa.fire('soyoungDown', ['흔들어']));
s = await ev(() => ({ down: !!__game.flags.soyoungDown }));
await ev(() => __qa.fire('soyoungDown', ['흔들어']));
const s2 = await ev(() => ({ down: !!__game.flags.soyoungDown, ann: !!__game.flags.soyoungAnnoyed, aff: __game.flags.aff_soyoung, f: __game.flags.follower, f2: __game.flags.follower2, a: __game.actor('soyoung')?.constructor.name }));
check('흔들어 깨우기: 2번까지는 그대로, 3번째에 깨지만 짜증(호감 -2), 소영·지현 다시 동행', s.down && !s2.down && s2.ann && s2.aff === aff0 - 2 && s2.f === 'soyoung' && s2.f2 === 'jihyeon' && s2.a === 'Follower', J({ ...s2, aff0 }));

// ================================================================ 5장 미궁
await ev(() => { __game.flags.soyoungAnnoyed = false; __game.give('tablet_fire'); });
await ev(() => __qa.enter('auditorium_2f', 36.5, 7.5));
r = await ev(() => __qa.fire('sealFire', ['끼운다']));
const M = await ev(async () => { const m = await import('./data/chapter4.js'); return { T: m.TABLETS, S: m.SOYOUNG_AT, X: m.MAZE_EXIT }; });
s = await ev(() => ({ map: __game.mapId, t: __game.timer && Math.round(__game.timer.left), f: __game.flags.follower, f2: __game.flags.follower2, n: __game.actors.length, cp: __game.checkpointData?.label }));
check('火의 패 → 미궁: 8분 타이머·동행 없음·체크포인트', s.map === 'maze' && s.t === 480 && !s.f && !s.f2 && s.n === 0 && s.cp?.includes('미궁') && r.cgs.some(c => c.includes('cg_maze')), J(s));
s = await ev(T => T.map(([c, r]) => __qa.solid(c, r)), M.T);
check('차례가 아닌 패(土·金·水·木) 앞은 장벽으로 막힘, 火 앞은 열림', !s[0] && s.slice(1).every(Boolean), J(s));
r = await ev(() => __qa.fire('mzb2'));
s = await ev(() => __game.flags.mazeStep || 0);
check('장벽 조사: 다음 차례(火) 안내, 진행 없음', s === 0 && r.texts.some(t => t.includes('火')), J(r.texts));
const ov = await ev(() => { const G = __game, a = () => Number(G.world.def.overlay(G).match(/,([\d.]+)\)$/)[1]); const x = a(); G.timer.left = 120; const y = a(); G.timer.left = 480; return [x, y]; });
check('시간이 흐를수록 화면이 하얗게 바램(overlay)', ov[1] > ov[0] + 0.2, J(ov));
await ev(T => { const p = __game.player; p.x = T[4][0] + 0.5; p.y = T[4][1] + 0.5; }, M.T); // 입구(흰 빛) 칸에서 떨어져서
for (let i = 0; i < 5; i++) await ev(i => __qa.fire('mz' + i), i);
s = await ev(T => ({ step: __game.flags.mazeStep, col: !!__game.flags.collapsed, t: __game.timer && Math.round(__game.timer.left), bar: T.some(([c, r]) => __qa.solid(c, r)) }), M.T);
check('다섯 패를 차례로 → 붕괴, 2분 타이머, 장벽 모두 사라짐', s.step === 5 && s.col && s.t === 120 && !s.bar, J(s));

// 안기 감속
const speed = async () => ev(async () => {
  const G = __game, p = G.player, I = window.__input;
  const [x0, y0] = [p.x, p.y];
  I.x = 1; I.y = 0;
  await new Promise(r => setTimeout(r, 400));
  const [x1, y1] = [p.x, p.y];
  I.x = I.y = 0;
  return Math.hypot(x1 - x0, y1 - y0);
});
// 가로로 긴 길(맨 아래 줄 x 1~17)에서 잰다
await ev(() => { const p = __game.player; p.x = 2.5; p.y = 19.5; });
const v0 = await speed();
await ev(() => { __game.flags.carrying = true; const p = __game.player; p.x = 2.5; p.y = 19.5; });
const v1 = await speed();
check('소영을 안으면 이동 속도 절반', v0 > 0.5 && Math.abs(v1 / v0 - 0.5) < 0.12, J({ v0: v0.toFixed(2), v1: v1.toFixed(2) }));
await ev(() => { __game.flags.carrying = false; });

// 엔딩 판정(안고/두고 · 하얀 국화 조건)
s = await ev(async () => {
  const { bEnding } = await import('./data/chapter4.js');
  const base = { carrying: true, chrysanthemum: true, diary_answer: 'diary', strikes_soyoung: 0, aff_soyoung: 2, soyoungAnnoyed: false };
  const E = o => bEnding({ flags: { ...base, ...o } });
  return [E({}), E({ chrysanthemum: false }), E({ diary_answer: 'candy' }), E({ strikes_soyoung: 1 }), E({ aff_soyoung: 1 }), E({ soyoungAnnoyed: true }), E({ carrying: false })];
});
check('B 엔딩 판정: 모든 조건 → 하얀 국화 / 하나라도 빠지면 아이비 / 두고 나오면 히아신스', J(s) === J(['chrysanthemum', 'ivy', 'ivy', 'ivy', 'ivy', 'ivy', 'hyacinth']), J(s));

// 미궁 시간 초과
await ev(() => { __game.timer.left = 0.05; });
r = await ev(() => __qa.settle());
s = await ev(() => document.querySelector('.over-title')?.textContent);
check('미궁 시간이 다 되면 게임 오버', r.state === 'over' && s?.includes('미궁'), s);
await page.waitForTimeout(1300);
await page.locator('.over-layer .title-btn', { hasText: '미궁 입구' }).dispatchEvent('pointerdown');
await page.waitForTimeout(600);
await ev(() => __qa.settle());

// 두고 나오기 → 히아신스 엔딩 화면
await ev(T => { const p = __game.player; p.x = T[4][0] + 0.5; p.y = T[4][1] + 0.5; }, M.T);
for (let i = 0; i < 5; i++) await ev(i => __qa.fire('mz' + i), i);
await ev(() => __qa.fire('mzSoyoung', ['두고']));
await ev(X => { const p = __game.player; p.x = X[0] + 0.5; p.y = X[1] + 0.5; }, M.X);
r = await ev(() => __qa.settle([], 15000));
s = await ev(() => __qa.endingView());
check('두고 입구의 흰 빛으로 → 히아신스 엔딩 화면(꽃 이름·꽃말·에필로그·수집 수·버튼)', r.state === 'end' && s?.title === '히아신스' && s.sub.includes('나를 용서해 줘') && s.paras >= 2 && s.count.includes('/ 8') && s.btns.join() === '엔딩 수집,타이틀로' && r.cgs.some(c => c.includes('end_hyacinth')), J(s));

// ================================================================ A 루트 엔딩
async function aSetup(extra) {
  await restart('A');
  await ev(extra => { Object.assign(__game.flags, { fireOn: true, fireOut: true, jiHurt: true, follower: null }, extra); }, extra || {});
  await ev(() => __qa.enter('auditorium_1f', 20.5, 4.5));
}
await aSetup({ tapeSubmitted: true });
s = await ev(() => !!__game.actor('seonga'));
r = await ev(() => __qa.run('seongaTalk', ['성아의 손']));
check('A: 무대 위 성아 → 손을 잡으면(테이프 투고) 튜베로즈', s && r.state === 'end' && (await ev(() => __qa.endingView()))?.title === '튜베로즈');
await aSetup({ tapeSubmitted: false });
r = await ev(() => __qa.run('seongaTalk', ['성아의 손']));
check('A: 테이프를 투고하지 않았으면 흑단목', r.state === 'end' && (await ev(() => __qa.endingView()))?.title === '흑단목');
await aSetup();
await ev(() => __qa.fire('jhTalk', ['조심', '위험해']));
r = await ev(() => __qa.run('seongaTalk', ['지현에게']));
s = await ev(() => ({ ji: !!__game.flags.chooseJi, seonga: !!__game.actor('seonga'), dlg: __game.flags.jhDialog }));
const r2 = await ev(() => __qa.fire('jhTalk'));
check('A: 지현에게 돌아가면 성아는 떠나고, 구급상자 없이는 엔딩 없음', r.state === 'free' && s.ji && !s.seonga && s.dlg === 0 && r2.state === 'free', J(s));
await ev(() => __game.give('first_aid'));
r = await ev(() => __qa.fire('jhTalk'));
check('A: 차갑게 대한 뒤 구급상자 → 접시꽃', r.state === 'end' && (await ev(() => __qa.endingView()))?.title === '접시꽃');
await aSetup();
await ev(() => __qa.fire('jhTalk', ['옆에 있을게', '지키려는']));
await ev(() => __qa.run('seongaTalk', ['지현에게']));
await ev(() => __game.give('first_aid'));
r = await ev(() => __qa.fire('jhTalk'));
check('A: 따뜻한 대화 2번 + 구급상자 → 민들레', r.state === 'end' && (await ev(() => __qa.endingView()))?.title === '민들레');

// ================================================================ 타이틀 엔딩 수집
await page.reload();
await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);
s = await ev(() => [...document.querySelectorAll('.title-btn')].map(b => b.textContent));
await page.locator('.title-btn', { hasText: '엔딩 수집' }).dispatchEvent('pointerdown');
await page.waitForSelector('.endings-layer');
await page.waitForTimeout(300);
s = { btns: s, ...(await ev(() => ({ head: document.querySelector('.endings-layer .save-title')?.textContent, slots: [...document.querySelectorAll('.ending-slot')].map(e => e.querySelector('b').textContent), locked: document.querySelectorAll('.ending-slot.locked').length }))) };
const seen = ['히아신스', '튜베로즈', '흑단목', '접시꽃', '민들레', '주목'];
check('타이틀 엔딩 수집: 본 6종만 이름 공개, 나머지 2종 ???', s.btns.includes('엔딩 수집') && s.head === '엔딩 수집 6 / 8' && seen.every(n => s.slots.includes(n)) && s.locked === 2 && s.slots.filter(n => n === '???').length === 2, J(s));
await page.locator('.endings-layer .btn-close').dispatchEvent('pointerdown');
await page.waitForTimeout(200);
check('엔딩 수집 닫기', !(await ev(() => !!document.querySelector('.endings-layer'))));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(x => !x).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
