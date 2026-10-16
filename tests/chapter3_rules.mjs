// 3장(신관) 규칙 검증: 타이틀 → 챕터 선택 → 3장(소영 루트)으로 시작해, 플레이어처럼 걷고(가상 스틱·조사 버튼) 아래 규칙을 확인한다.
//  · 신관 수위 손달수: 학교 모형을 집으면 등장, 순찰 2.1·추격 3.55·시야 8·피해 34, 순찰 중 위험 신호는 휘파람(열쇠 소리 아님)
//  · 3-04 거울 도플갱어: CD → 1라운드, 무용실 안에서만 플레이어 쪽으로 탄(피해 8, 무적 중엔 피해 없음), 탄은 벽·수명에 사라짐,
//    스피커 밀기(한 칸, 구역 밖이면 처음 자리로 — 그 자리에 미는 플레이어가 서 있으면 밀리지 않고, 동행은 비켜 선다), 거울 속 자리에 맞으면 다음 라운드·탄 제거,
//    3라운드 → 빨간 카드키·추 50g
//  · 손달수 공격 간격: 맞은 뒤 무적 동안 휘두르지 않음 → 서 있으면 약 1.2초마다 34
//  · B 루트 두 번째 동행: 지현 합류(follower2, 소영 뒤를 줄지어), 걸어도 둘 다 곁에, 계단으로 층을 옮기면 둘 다 새 층에
//  · 세계 시계(시차표대로) · 카드 복사기(테이프 번호) · 차단기(은미 추락 + 안내문 뒤, 안내문 번호): 틀리면 아무 일 없음, 맞으면 진행
//  · 3-03 구석의 아이: 쪽지 교실을 작은 번호부터(건너뛰면 소녀가 떨어져 체력 -20·처음부터, 쪽지에 없는 교실은 상관없음)
//  · 3-11 교실 불: 틀린 차례면 전부 꺼짐(수위가 불 켜진 교실로), 다 켜기 전 레버는 헛손질, 차례대로 → 레버 → 옥상 열쇠, 3-9 스위치는 (23,13) 벽 안쪽
//  · 옥상 수영장: 수맥 길(POOL_PATH) 밖 물칸에 0.25초 넘게 → 끌려감(-15), 길 칸 중앙만 밟으면 무사, L로드는 가까운 길 칸만 반짝임,
//    밸브 손잡이 + 밸브 → 물 빠짐·인어 죽음·水의 패
//  · 발목 귀신 QTE: 연타 실패 -15 / 성공 피해 없음
//  · 3-10 휴게실(B): 캔커피 → 다이어리 순서여야 하얀 국화(다이어리를 건넨 순간) / A 루트 신문고: 앞으로 돌려 들은 테이프 투고
//  · 3-13~14 은미 추격(qaSafe 끔): 水의 패 → 추격·체크포인트, 닫힌 문을 열고 다가와 닿으면 -30, 숨은 동안은 멈춰 기다림,
//    체력 0 → 체크포인트에서 다시, 문 앞에서 달려 계단으로 올라가면 잡히지 않고 4층 난간 → 추락,
//    재등장 예약은 그 층에서만(곧바로 층을 옮기면 새 층 진입 2.2초 뒤 새 층 자리에)
//  · 콘솔 오류 없음
import { openMobile } from './helpers.mjs';

const T0 = Date.now();
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const J = o => JSON.stringify(o);
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const { browser, page, errors } = await openMobile();
const BOT = new URL('./bot.js', import.meta.url).pathname;
const frames = ms => page.waitForTimeout(ms);
const ev = (fn, arg) => page.evaluate(fn, arg);

// ---------------------------------------------------------------- 페이지 안 QA 도우미 + 관찰용 훅(게임 동작은 그대로)
function qaInstall() {
  const G = window.__game, A = G.audio;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const pd = el => el && el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  const top = () => { const ls = document.querySelectorAll('#ui .layer'); return ls[ls.length - 1] || null; };
  const isF = a => a.constructor.name === 'Follower';
  const qa = window.__qa = {
    runs: [], shots: [], hits: [], touches: [], audio: { wh: 0, whPatrol: 0, keys: 0 }, POOL_PATH: null,
    pd, top,
    // 동행 짜증 대사가 다른 판정 사이에 끼어들지 않게(짜증 규칙은 chapter2_rules.mjs에서 검증)
    calm() { for (const a of G.actors) if (isF(a)) { a.cool = 1e9; a.farT = 0; a.blockT = 0; } },
    // 조건 만들기용 순간이동: 동행은 플레이어 곁으로 같이 옮긴다
    tp(x, y, dir) {
      const p = G.player;
      p.x = x; p.y = y; p.route = null; p.moving = false;
      if (dir) p.dir = dir;
      for (const a of G.actors) if (isF(a)) G.placeFollower(a);
      qa.calm();
      G.snapCamera();
    },
    // 열린 모달 처리: 대사(다 찍힌 뒤 넘김)·선택지(choose 글자 우선, 없으면 첫 번째)·문서·CG·QTE(qte='tap' 연타 / 'none' 가만히).
    // 키패드·다이얼·스위치·게임오버·장 끝은 호출한 쪽이 처리하도록 멈춘다
    async settle(o = {}) {
      const t0 = performance.now(), max = o.max || 60000;
      const out = { texts: [], choices: [], docs: [], cgs: [], qtes: 0 };
      let idle = 0;
      while (performance.now() - t0 < max) {
        const L = top();
        if (!L) {
          // fast: 쫓기는 중에는 풀리자마자 돌려준다(가만히 서 있는 시간 없이)
          if (!G.busy && !G.ui.modalCount) { if (++idle > (o.fast ? 0 : 2)) { qa.calm(); return { state: G.over ? 'over' : 'free', ...out }; } }
          else idle = 0;
          await frame();
          continue;
        }
        idle = 0;
        const cls = L.className;
        if (cls.includes('over-layer')) return { state: cls.includes('end') ? 'end' : 'over', ...out };
        if (cls.includes('keypad-layer') || cls.includes('piano-layer')) return { state: 'keypad', title: L.querySelector('.keypad-title')?.textContent || '', ...out };
        const age = performance.now() - Number(L.dataset.t0 || 0);
        if (age < 205) { await sleep(207 - age); continue; } // 열린 직후 0.2초 탭 무시
        if (cls.includes('dialog-layer')) {
          pd(L); // 글자 다 찍기(이미 다 찍혔으면 닫힘)
          out.texts.push(L.querySelector('.dialog-text')?.textContent || '');
          if (L.isConnected) pd(L);
        } else if (cls.includes('choice-layer')) {
          const opts = [...L.querySelectorAll('.choice-opt')];
          out.choices.push(opts.map(e => e.textContent));
          let pick = null;
          for (const c of o.choose || []) { pick = opts.find(e => e.textContent.includes(c)); if (pick) break; }
          pd(pick || opts[0]);
        } else if (cls.includes('doc-layer')) {
          out.docs.push((L.querySelector('.doc-title')?.textContent || '') + '\n' + (L.querySelector('.doc-body')?.textContent || ''));
          pd(L.querySelector('.btn-close'));
        } else if (cls.includes('cg-layer')) {
          out.cgs.push(L.querySelector('.cg-img')?.getAttribute('src') || '');
          pd(L);
        } else if (cls.includes('qte-layer')) {
          out.qtes++;
          if (o.qte === 'none') { while (L.isConnected) await sleep(40); }
          else for (let i = 0; i < 16 && L.isConnected; i++) { pd(L); await sleep(35); }
        } else await sleep(60); // 장 카드 등 저절로 닫히는 것
        await frame();
      }
      return { state: 'timeout', ...out };
    },
    // 가상 스틱으로 경유점을 직선으로 차례차례(옥상 수맥 길처럼 칸 중앙을 따라 걸을 때). 목표 가까이서는 살살 밀어 지나치지 않게
    async stick(pts, fast = 0.7, glow = false) {
      const In = window.__input, p = G.player, glows = [];
      for (let i = 0; i < pts.length; i++) {
        const [tx, ty] = pts[i], t0 = performance.now(), pv = i ? pts[i - 1] : [p.x, p.y], nx = pts[i + 1];
        // 꺾이지 않는 경유점(일직선)은 멈추지 않고 지나간다
        const straight = !!nx && Math.abs((tx - pv[0]) * (nx[1] - ty) - (ty - pv[1]) * (nx[0] - tx)) < 1e-6 && (tx - pv[0]) * (nx[0] - tx) + (ty - pv[1]) * (nx[1] - ty) > 0;
        for (;;) {
          if (G.busy || G.ui.modalCount || G.over) { In.x = In.y = 0; return { ok: false, reason: 'modal', at: [p.x, p.y], i, glows }; }
          const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
          if (d < (straight ? 0.12 : 0.06)) break;
          if (performance.now() - t0 > 10000) { In.x = In.y = 0; return { ok: false, reason: 'timeout', at: [p.x, p.y], i, glows }; }
          const m = !straight && d < 0.2 ? 0.3 : fast;
          In.x = dx / d * m; In.y = dy / d * m;
          await frame();
        }
        if (glow) { const nx = pts[i + 1]; glows.push(qa.glowCheck(nx && [Math.floor(nx[0]), Math.floor(nx[1])])); }
      }
      In.x = In.y = 0;
      await frame();
      return { ok: true, at: [p.x, p.y], glows };
    },
    // L로드 표식(dynGlows): 표식 칸이 모두 수맥 길인지, 가까운지(3칸 안), 다음에 밟을 길 칸이 반짝이는지
    glowCheck(next) {
      const key = ([c, r]) => c + ',' + r, safe = new Set(qa.POOL_PATH.map(key));
      const tiles = (G.world.def.dynGlows?.(G) || []).map(o => [Math.round(o.x - 0.5), Math.round(o.y - 0.8)]);
      return {
        n: tiles.length,
        off: tiles.filter(t => !safe.has(key(t))).map(key),
        far: tiles.filter(([c, r]) => Math.hypot(c + 0.5 - G.player.x, r + 0.5 - G.player.y) > 3).map(key),
        next: next && safe.has(key(next)) ? tiles.some(t => key(t) === key(next)) : true,
      };
    },
  };
  // 관찰 훅: 실행된 스크립트 이름 / 탄 발사·명중 / 귀신 접촉 / 수위 신호음
  const orun = G.run.bind(G);
  G.run = fn => { if (typeof fn === 'string') qa.runs.push(fn); return orun(fn); };
  const ofb = G.fireBullet.bind(G);
  G.fireBullet = (from, o) => {
    const p = G.player, rec = { fx: from.x, fy: from.y, px: p.x, py: p.y, inZone: p.x >= 25 && p.x <= 39 && p.y >= 1 && p.y <= 8 };
    ofb(from, o);
    const b = G.actors[G.actors.length - 1];
    Object.assign(rec, { id: b.id, vx: b.vx, vy: b.vy, dmg: b.dmg });
    qa.shots.push(rec);
  };
  const obh = G.onBulletHit.bind(G);
  G.onBulletHit = b => { const rec = { id: b.id, dmg: b.dmg, before: G.hp, inv: G.invuln }; obh(b); rec.after = G.hp; rec.gone = !G.actor(b.id); qa.hits.push(rec); };
  // 조작 가능한 시간(지연 실행 laters가 흐르는 시간) 누계 · 맵 입장 · 은미 등장 기록
  qa.freeT = 0; qa.enters = []; qa.spawns = [];
  const otl = G.tickLaters.bind(G);
  G.tickLaters = dt => { qa.freeT += dt; return otl(dt); };
  const oem = G.enterMap.bind(G);
  G.enterMap = (id, ...rest) => { qa.enters.push({ map: id, free: qa.freeT }); return oem(id, ...rest); };
  const osp = G.spawn.bind(G);
  G.spawn = a => { if (a.id === 'eunmi') qa.spawns.push({ map: G.mapId, x: a.x, y: a.y, free: qa.freeT }); return osp(a); };
  qa.swings = []; // 수위가 휘두른 순간(게임 시각·무적 남은 시간·체력 전후)
  const ojh = G.onJanitorHit.bind(G);
  G.onJanitorHit = j => { const rec = { id: j?.id, t: G.t, inv: G.invuln, before: G.hp }; ojh(j); rec.after = G.hp; qa.swings.push(rec); };
  const ogt = G.onGhostTouch.bind(G);
  G.onGhostTouch = gh => { const rec = { id: gh.id, before: G.hp, inv: G.invuln, gx: gh.x, gy: gh.y }; ogt(gh); rec.after = G.hp; qa.touches.push(rec); };
  const owh = A.whistleTune.bind(A), okeys = A.keys.bind(A);
  A.whistleTune = (a, d) => { qa.audio.wh++; if (a.id === 'dalsu' && ['patrol', 'pause'].includes(a.state)) qa.audio.whPatrol++; return owh(a, d); };
  A.keys = (a, d) => { qa.audio.keys++; return okeys(a, d); };
}

const settle = (o = {}) => ev(o => __qa.settle(o), o);
const blank = () => ({ texts: [], choices: [], docs: [], cgs: [], qtes: 0, state: 'free' });
const merge = (acc, s) => { for (const k of ['texts', 'choices', 'docs', 'cgs']) acc[k].push(...(s[k] || [])); acc.qtes += s.qtes || 0; acc.state = s.state; return acc; };
// 봇으로 걷기(실제 스틱·조사 입력, 닫힌 문은 열고 지나감). 도중의 대사·선택지·QTE는 settle로 넘긴다
async function go(x, y, o = {}) {
  const acc = blank();
  const map0 = await ev(() => __game.mapId);
  for (let i = 0; i < 30; i++) {
    const r = await ev(([x, y, run]) => __bot.walkTo(x, y, run), [x, y, o.run !== false]);
    if (r.ok) return { ...acc, ok: true };
    if (r.reason !== 'modal') return { ...acc, ok: false, reason: r.reason };
    merge(acc, await settle(o));
    if (acc.state !== 'free') return { ...acc, ok: false, reason: acc.state };
    if (o.stopOnMap && (await ev(() => __game.mapId)) !== map0) return { ...acc, ok: true };
  }
  return { ...acc, ok: false, reason: 'loop' };
}
// 바라보는 방향으로 조사 버튼
async function act(dir, o = {}) { const f = await ev(d => __bot.act(d), dir); const s = await settle(o); return { ...s, focus: f.focus }; }
const tp = (x, y, dir) => ev(([x, y, dir]) => __qa.tp(x, y, dir), [x, y, dir]);
// 새로 열린 창의 0.2초 탭 무시 시간이 지나기를 기다린다
const ready = () => ev(async () => { const L = __qa.top(); const age = L ? performance.now() - Number(L.dataset.t0) : 1e9; if (age < 210) await new Promise(r => setTimeout(r, 210 - age)); });
const G = (fn, arg) => ev(fn, arg);

// ---------------------------------------------------------------- 시작: 타이틀 → 챕터 선택 → 제3장 → 루트
async function boot(routeText) {
  await page.addScriptTag({ path: BOT });
  await page.waitForSelector('.title-btn');
  await ev(qaInstall);
  await ev(async () => { __qa.POOL_PATH = (await import('./data/chapter3.js')).POOL_PATH; __game.timeScale = 3; __game.qaSafe = true; });
  await frames(300);
  await page.locator('.title-btn', { hasText: '챕터 선택' }).dispatchEvent('pointerdown');
  await page.waitForSelector('.chapter-btn');
  await frames(300);
  await page.locator('.chapter-btn').nth(2).dispatchEvent('pointerdown');
  await page.waitForSelector('.chapter-route');
  await frames(600);
  await page.locator('.chapter-route', { hasText: routeText }).dispatchEvent('pointerdown');
  await page.waitForFunction(() => __game.busy > 0 || __game.world, null, { timeout: 10000 });
  return settle();
}

let s = await boot('소영');
const st0 = await G(() => {
  const g = __game, f = g.flags, L = k => String(f[k] || '').split(',').filter(Boolean);
  return { map: g.mapId, follower: f.follower, f2: f.follower2, fa: g.actor('soyoung')?.constructor.name, route: f.route, gmt: f.gmt, tape: f.tapeCode, light: L('lightSeq'), spider: L('spiderList'), breaker: L('breakerCode'), cd: g.has('cd'), tape2: g.has('backward_tape') };
});
{
  const okSeq = (a, n, lo, hi) => a.length === n && new Set(a).size === n && a.every(v => +v >= lo && +v <= hi);
  const asc = a => a.every((v, i) => !i || +a[i - 1] < +v);
  check('챕터 선택 → 3장 소영 루트: 신관 1층 로비, 동행 소영, CD·역재생 테이프 소지',
    st0.map === 'shingwan_1f' && st0.route === 'B' && st0.follower === 'soyoung' && st0.fa === 'Follower' && !st0.f2 && st0.cd && st0.tape2, J(st0));
  check('무작위 퍼즐 값 생성(그리니치 0~23시, 번호 4자리, 교실 불 5개, 구석의 아이 4개 오름차순, 차단기 3개)',
    Number.isInteger(st0.gmt) && st0.gmt >= 0 && st0.gmt < 24 && /^\d{4}$/.test(st0.tape) && okSeq(st0.light, 5, 1, 12) && okSeq(st0.spider, 4, 1, 12) && asc(st0.spider) && okSeq(st0.breaker, 3, 1, 6) && asc(st0.breaker), J(st0));
}

// ================================================================ 손달수: 학교 모형 → 등장
await G(() => { __game.timeScale = 2; });
let w = await go(10.5, 4.5);
const quaked = w.texts.some(t => t.includes('흔들'));
s = await act('up');
const ds = await G(() => {
  const g = __game, j = g.actor('dalsu');
  return { card: g.has('card_yellow'), on: !!g.flags.dalsuOn, kind: j?.constructor.name, skin: j?.skin, ps: j?.patrolSpeed, cs: j?.chaseSpeed, view: j?.view, dmg: j?.dmg, signal: j?.signal };
});
check('1층 복도 흔들림(3-01) → 학교 모형에서 노란 카드키, 손달수 등장', quaked && s.focus === 'model' && ds.card && ds.on && ds.kind === 'Janitor' && ds.skin === 'dalsu', J({ quaked, focus: s.focus, ...ds }));
check('손달수 능력치: 순찰 2.1 · 추격 3.55 · 시야 8 · 피해 34', ds.ps === 2.1 && ds.cs === 3.55 && ds.view === 8 && ds.dmg === 34, J(ds));
const wh = await G(async () => {
  const j = __game.actor('dalsu');
  j.state = 'patrol';
  const a0 = { ...__qa.audio };
  let fps = 0;
  await new Promise(r => { const t0 = performance.now(); const f = t => { fps++; if (t - t0 < 700) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
  return { signal: j.signal, state: j.state, whistle: __qa.audio.whPatrol - a0.whPatrol, keys: __qa.audio.keys - a0.keys, fps: Math.round(fps / 0.7) };
});
check('순찰 중 위험 신호는 휘파람(whistleTune 호출, 열쇠 소리 keys 호출 없음)', wh.signal === 'whistle' && wh.whistle > 5 && wh.keys === 0, J(wh));
const tune = await G(() => {
  const A = __game.audio, j = __game.actor('dalsu'), proto = Object.getPrototypeOf(A), ctx0 = A.ctx, out = {};
  let n = 0;
  A.tone = () => { n++; };
  if (!A.ctx) A.ctx = {};
  for (const st of ['patrol', 'pause', 'investigate', 'chase']) { n = 0; j.state = st; j._whT = 0; proto.whistleTune.call(A, j, 3); out[st] = n; }
  delete A.tone; A.ctx = ctx0; j.state = 'patrol';
  return out;
});
check('휘파람 가락은 순찰·멈춤 중에만, 소리 확인·추격 중엔 그친다', tune.patrol > 0 && tune.pause > 0 && tune.investigate === 0 && tune.chase === 0, J(tune));

// ================================================================ 3-04 거울 도플갱어
w = await go(37.5, 2.5);
s = await act('up', { choose: ['넣는다'] });
const m1 = await G(() => {
  const g = __game, d = g.actor('doppel');
  return { round: g.flags.mirrorRound, spk: g.flags.spk, kind: d?.constructor.name, mirrorY: d?.mirrorY, shoot: d?.shoot, zone: d?.shootZone, cp: g.checkpointData?.label };
});
check('무용실 오디오에 CD → 1라운드, 거울 도플갱어(탄 1.4초마다·속도 4·피해 8)',
  w.ok && s.focus === 'stereo' && m1.round === 1 && m1.spk === '28,5' && m1.kind === 'Ghost' && m1.mirrorY === 1.5 && J(m1.shoot) === J({ every: 1.4, speed: 4, dmg: 8 }) && J(m1.zone) === J([25, 1, 39, 8]) && /무용실/.test(m1.cp || ''), J(m1));

// 탄: 무용실 안의 서 있는 플레이어 쪽으로
await go(31.5, 5.5);
await G(() => { const g = __game, j = g.actor('dalsu'); if (j) j.frozen = true; g.timeScale = 1; g.hp = 100; g.invuln = 0; __qa.shots = []; __qa.hits = []; __qa.calm(); g.qaSafe = false; });
await page.waitForFunction(() => __qa.hits.length >= 1, null, { timeout: 8000, polling: 'raf' }).catch(() => {});
const b1 = await G(() => { const r = { shots: __qa.shots.slice(), hits: __qa.hits.slice(), hp: __game.hp }; __game.invuln = 30; return r; });
{
  const sh = b1.shots[0] || {}, dx = sh.px - sh.fx, dy = sh.py - sh.fy, sp = Math.hypot(sh.vx, sh.vy);
  const cos = (sh.vx * dx + sh.vy * dy) / (sp * Math.hypot(dx, dy));
  check('도플갱어가 무용실 안의 플레이어 쪽으로 탄을 쏜다(bullet*, 속도 4)', b1.shots.length > 0 && /^bullet/.test(sh.id) && sh.inZone && cos > 0.999 && near(sp, 4, 0.01), J({ n: b1.shots.length, cos, sp, id: sh.id }));
  const h = b1.hits[0] || {};
  check('서 있는 플레이어에 탄이 닿으면 체력 -8(탄은 사라짐)', h.inv === 0 && h.dmg === 8 && h.before - h.after === 8 && h.gone, J(h));
}
await page.waitForFunction(() => __qa.hits.length >= 2, null, { timeout: 6000, polling: 'raf' }).catch(() => {});
const b2 = await G(() => { const r = __qa.hits[1] || null; __game.invuln = 0; return r; });
check('무적 시간 중에는 탄에 맞아도 피해 없음(탄은 사라짐)', b2 && b2.inv > 0 && b2.after === b2.before && b2.gone, J(b2));
// 무용실 밖(shootZone 밖)에서는 쏘지 않는다
await G(() => { const g = __game; for (const a of [...g.actors]) if (a.id?.startsWith('bullet')) g.despawn(a.id); __qa.tp(31.5, 10.5, 'up'); __qa.shots = []; });
await frames(1700);
const outZone = await G(() => ({ shots: __qa.shots.length, x: __game.player.x, y: __game.player.y, bullets: __game.actors.filter(a => a.id?.startsWith('bullet')).length }));
check('무용실(shootZone) 밖에서는 쏘지 않는다', outZone.shots === 0 && outZone.bullets === 0, J(outZone));
// 탄은 벽에 닿거나 수명이 다하면 사라진다
await G(() => {
  const g = __game; g.qaSafe = true; __qa.tp(33.5, 6.5, 'up'); __qa.hits = [];
  g.spawn({ id: 'bulletW', kind: 'bullet', x: 30.5, y: 3.5, vx: 0, vy: -6, dmg: 8 });
  g.spawn({ id: 'bulletL', kind: 'bullet', x: 26.5, y: 6.5, vx: 0, vy: 0, life: 0.6, dmg: 8 });
});
await frames(150);
const bw0 = await G(() => ({ w: __game.actor('bulletW') && +__game.actor('bulletW').y.toFixed(2), l: !!__game.actor('bulletL') }));
await frames(1000);
const bw1 = await G(() => ({ w: !!__game.actor('bulletW'), l: !!__game.actor('bulletL'), hits: __qa.hits.length }));
check('탄은 벽(거울 쪽 벽)에 닿으면 사라진다', bw0.w > 1 && !bw1.w && bw1.hits === 0, J({ bw0, bw1 }));
check('탄은 수명이 다하면 사라진다', bw0.l && !bw1.l, J({ bw0, bw1 }));

// 스피커 밀기(qaSafe: 탄 없이)
await G(() => { __game.timeScale = 2; });
async function push(x, y, dir) {
  const wk = await go(x, y);
  const a = await act(dir);
  const st = await G(() => ({ spk: __game.flags.spk, round: __game.flags.mirrorRound, done: !!__game.flags.mirrorDone }));
  return { ...st, walk: wk.ok, focus: a.focus, texts: a.texts };
}
let p = await push(28.5, 4.5, 'down');
check('스피커는 바라보는 방향으로 한 칸 밀린다', p.focus === 'speaker' && p.spk === '28,6', J(p));
p = await push(28.5, 5.5, 'down');
const p7 = p.spk;
// 처음 자리(28,5)에 동행 소영이 서 있어도 막지 않는다: 스피커는 처음 자리로, 동행은 스피커 밖으로 비켜 선다(막는 건 미는 플레이어뿐)
await go(28.5, 6.5);
await G(() => { const a = __game.actor('soyoung'); a.follow = false; a.path = null; a.x = 28.5; a.y = 5.5; });
p = await push(28.5, 6.5, 'down');
const fol = await G(() => { const a = __game.actor('soyoung'); return { x: +a.x.toFixed(2), y: +a.y.toFixed(2), on: a.x + a.rad > 28 && a.x - a.rad < 29 && a.y + a.rad > 5 && a.y - a.rad < 6, stuck: __game.world.blocked(a.x, a.y, a.rad) }; });
await G(() => { __game.actor('soyoung').follow = true; __qa.calm(); });
check('구역 밖으로 밀 때 처음 자리(28,5)에 동행이 서 있으면 동행이 비켜 서고 스피커는 처음 자리로', p7 === '28,7' && p.spk === '28,5' && p.texts.some(t => t.includes('처음 자리')) && !fol.on && !fol.stuck, J({ p7, p, fol }));
p = await push(28.5, 4.5, 'down');
p = await push(28.5, 5.5, 'down');
const p7b = p.spk;
p = await push(28.5, 6.5, 'down');
check('허용 구역(y 2~7) 밖으로 밀면(처음 자리가 비어 있으면) 라운드 시작 자리로 되돌아감', p7b === '28,7' && p.spk === '28,5' && p.texts.some(t => t.includes('처음 자리')), J({ p7b, p }));
const steps1 = [[27.5, 5.5, 'right', '29,5'], [28.5, 5.5, 'right', '30,5'], [30.5, 6.5, 'up', '30,4']];
let okSteps = true;
for (const [x, y, d, want] of steps1) { p = await push(x, y, d); okSteps &&= p.spk === want; }
await G(() => __game.spawn({ id: 'bulletD', kind: 'bullet', x: 26.5, y: 6.5, vx: 0, vy: 0, life: 999, dmg: 8 }));
p = await push(30.5, 5.5, 'up');
const r1 = await G(() => ({ round: __game.flags.mirrorRound, spk: __game.flags.spk, bullets: __game.actors.filter(a => a.id?.startsWith('bullet')).map(a => a.id), shoot: __game.actor('doppel')?.shoot }));
check('스피커가 거울 속 자리(30,3)에 맞으면 2라운드, 탄 제거, 더 빠른 탄', okSteps && r1.round === 2 && r1.spk === '35,5' && r1.bullets.length === 0 && r1.shoot?.every === 1.1 && r1.shoot?.speed === 5, J({ okSteps, r1 }));
okSteps = true;
for (const [x, y, d, want] of [[36.5, 5.5, 'left', '34,5'], [35.5, 5.5, 'left', '33,5'], [33.5, 6.5, 'up', '33,4'], [33.5, 5.5, 'up', '33,3']]) { p = await push(x, y, d); okSteps &&= p.spk === want; }
p = await push(33.5, 4.5, 'up');
const r2 = await G(() => ({ round: __game.flags.mirrorRound, spk: __game.flags.spk, shoot: __game.actor('doppel')?.shoot }));
check('2라운드(33,2) → 3라운드, 탄 0.9초마다', okSteps && r2.round === 3 && r2.spk === '31,6' && r2.shoot?.every === 0.9, J({ okSteps, r2 }));
// 3라운드 처음 자리(31,6) 바로 아래가 구역 끝(y 7): 플레이어가 처음 자리에 서서 아래로 밀면 스피커는 그대로(스피커에 갇히지 않게)
p = await push(31.5, 5.5, 'down');
const p31 = p.spk;
p = await push(31.5, 6.5, 'down');
const trap = await G(() => { const g = __game, pl = g.player; return { stuck: g.world.blocked(pl.x, pl.y, pl.rad), x: +pl.x.toFixed(2), y: +pl.y.toFixed(2) }; });
check('플레이어가 처음 자리(31,6)에 서서 구역 밖으로 밀면 스피커는 그대로(플레이어가 갇히지 않음)', p31 === '31,7' && p.spk === '31,7' && p.texts.some(t => t.includes('더는 밀리지')) && !p.texts.some(t => t.includes('처음 자리')) && !trap.stuck, J({ p31, p, trap }));
await go(30.5, 6.5);
await G(() => { __qa.tp(30.5, 6.5, 'right'); __game.flags.spk = '31,6'; __game.world.refresh(); }); // 다음 확인을 위해 3라운드 시작 자리로(문을 막은 스피커는 옆으로만 밀린다)
okSteps = true;
for (const [x, y, d, want] of [[30.5, 6.5, 'right', '32,6'], [31.5, 6.5, 'right', '33,6'], [32.5, 6.5, 'right', '34,6'], [33.5, 6.5, 'right', '35,6'], [35.5, 7.5, 'up', '35,5'], [35.5, 6.5, 'up', '35,4']]) { p = await push(x, y, d); okSteps &&= p.spk === want; }
p = await push(35.5, 5.5, 'up');
const r3 = await G(() => { const g = __game; return { done: !!g.flags.mirrorDone, doppel: !!g.actor('doppel'), red: g.has('card_red'), w50: g.has('weight50'), cp: g.checkpointData, speaker: g.world.props.some(q => q.s === 'speaker') }; });
check('3라운드 클리어 → 거울이 깨지고 빨간 카드키·추 50g, 도플갱어·스피커 사라짐', okSteps && r3.done && !r3.doppel && r3.red && r3.w50 && !r3.cp && !r3.speaker, J({ okSteps, r3 }));

// ================================================================ 계단으로 4층 → B 루트 지현 합류
const floors = [];
await tp(3.5, 9.5, 'up'); // 1층 계단 앞으로(계단 이동·셔터는 실제로)
for (let i = 0; i < 3; i++) { w = await go(1.5, 1.5, { stopOnMap: true }); floors.push(await G(() => __game.mapId)); }
const at4 = await G(() => { const g = __game, a = g.actor('soyoung'); return { map: g.mapId, d: a && Math.hypot(a.x - g.player.x, a.y - g.player.y), dalsu: !!g.actor('dalsu') }; });
check('계단으로 1층 → 2층 → 3층 → 4층(3층 셔터는 빨간 카드), 소영도 따라옴', J(floors) === J(['shingwan_2f', 'shingwan_3f', 'shingwan_4f']) && at4.d < 2.5, J({ floors, at4 }));
w = await go(28.5, 6.5);
const re = await G(() => {
  const g = __game, a = g.actor('jihyeon');
  return { f2: g.flags.follower2, found: !!g.flags.jiFound, kind: a?.constructor.name, followId: a?.followId, follow: a?.follow, x: a?.x, y: a?.y };
});
check('도서관2 재회(B): follower2 = jihyeon, 지현은 소영 뒤를 따라옴(followId)', w.texts.some(t => t.includes('셋이')) && re.f2 === 'jihyeon' && re.found && re.kind === 'Follower' && re.followId === 'soyoung' && re.follow, J(re));
w = await go(22.5, 10.5);
await frames(1000);
const walk6 = await G(() => {
  const g = __game, p = g.player, s = g.actor('soyoung'), j = g.actor('jihyeon');
  const d = a => +Math.hypot(a.x - p.x, a.y - p.y).toFixed(2);
  return { ds: d(s), dj: d(j), djs: +Math.hypot(j.x - s.x, j.y - s.y).toFixed(2) };
});
const moved = Math.hypot(re.x - 22.5, re.y - 10.5);
check('6칸 넘게 걸어도 두 동행 모두 곁에(소영 → 지현 줄지어)', w.ok && moved > 6 && walk6.ds < 3 && walk6.dj < 4.5 && walk6.djs < 3, J({ moved: +moved.toFixed(1), ...walk6 }));

// ================================================================ 4층: 세계 시계 · 카드 복사기 · 오컬트부 · 차단기(아직) · 신문고(B) · 발목 귀신 QTE
w = await go(6.5, 13.5);
s = await act('up');
const dialRows = await G(() => [...document.querySelectorAll('.keypad-layer .dial-row .dial-label')].map(e => e.textContent));
await ready();
await G(() => __qa.pd(__qa.top().querySelector('.btn-close.ok'))); // 모두 0시 그대로 맞추기
s = await settle();
const clockWrong = await G(() => ({ key: __game.has('key_elec'), done: !!__game.flags.clockDone }));
check('세계 시계: 틀린 시각(모두 0시)으로는 아무 일 없음(전기실 열쇠 없음)', J(dialRows) === J(['서울', '베이징', '모스크바', '뉴욕']) && !clockWrong.key && !clockWrong.done && s.texts.some(t => t.includes('틀린')), J({ dialRows, clockWrong }));
const clockDoc = await G(() => __game.story.docs.clock_table.body);
const offs = [...clockDoc.matchAll(/^\s*(\S+)\s+([+−-])(\d+)시간/gm)].map(m => [m[1], (m[2] === '+' ? 1 : -1) * +m[3]]);
const gmt = await G(() => __game.flags.gmt);
const want = dialRows.map(c => { const o = offs.find(([n]) => n === c); return o ? (((gmt + o[1]) % 24) + 24) % 24 : null; });
s = await act('up');
await ready();
await G(want => {
  const rows = [...__qa.top().querySelectorAll('.dial-row')];
  want.forEach((v, i) => { const fwd = v <= 12; for (let k = 0; k < (fwd ? v : 24 - v); k++) __qa.pd(rows[i].querySelector(fwd ? '.dial-next' : '.dial-prev')); });
}, want);
const shown = await G(() => [...document.querySelectorAll('.keypad-layer .dial-value')].map(e => e.textContent));
await G(() => __qa.pd(__qa.top().querySelector('.btn-close.ok')));
s = await settle();
const clockOk = await G(() => ({ key: __game.has('key_elec'), done: !!__game.flags.clockDone }));
check('세계 시계: 시차표(서울 +9·베이징 +8·모스크바 +3·뉴욕 −5, 24시간제)대로 맞추면 전기실 열쇠', offs.length === 4 && J(offs.map(o => o[1])) === J([9, 8, 3, -5]) && clockOk.key && clockOk.done, J({ gmt, want, shown, clockOk }));

w = await go(7.5, 10.5);
s = await act('up');
const tapeCode = await G(() => __game.flags.tapeCode);
const wrongCode = String((+tapeCode[0] + 1) % 10) + tapeCode.slice(1);
const keypad = async code => {
  await ready();
  await G(code => { const L = __qa.top(); for (const k of code) __qa.pd([...L.querySelectorAll('.key')].find(b => b.textContent === k)); }, code);
  await page.waitForFunction(() => !document.querySelector('.keypad-layer'), null, { timeout: 3000 }).catch(() => {}); // 4자리 뒤 0.18초 있다 닫힘
  return settle();
};
const copierDoc = s.docs.some(d => d.includes('카드 복사기'));
const kpTitle = s.title;
s = await keypad(wrongCode);
const cpWrong = await G(() => ({ blue: __game.has('card_blue'), done: !!__game.flags.copierDone }));
check('카드 복사기: 틀린 번호로는 파란 카드 없음', copierDoc && /카드 복사기/.test(kpTitle || '') && !cpWrong.blue && !cpWrong.done && s.texts.some(t => t.includes('틀렸다')), J({ kpTitle, wrongCode, cpWrong }));
s = await act('up');
s = await keypad(tapeCode);
const cpOk = await G(() => ({ blue: __game.has('card_blue'), done: !!__game.flags.copierDone, y: __game.has('card_yellow'), r: __game.has('card_red') }));
check('카드 복사기: 테이프의 확인 번호(flags.tapeCode)로 파란 카드키', cpOk.blue && cpOk.done, J({ tapeCode, cpOk }));

w = await go(18.5, 15.5);
s = await act('down');
const oc = await G(() => ({ lrod: __game.has('lrod'), bell: __game.has('fox_bell'), done: !!__game.flags.occultDone }));
check('오컬트부(파란 카드로 문 열기) → L로드·여우방울', w.ok && oc.lrod && oc.bell && oc.done, J({ w: w.reason, oc }));

w = await go(29.5, 13.5);
s = await act('up');
const brk0 = await G(() => ({ done: !!__game.flags.breakerDone }));
check('차단기: 은미 사건 전에는 손대지 않음(스위치 창 없음)', w.ok && s.state === 'free' && !brk0.done && s.texts.some(t => t.includes('함부로')), J({ state: s.state, texts: s.texts }));

w = await go(14.5, 10.5);
await G(() => { __game.flags.tapeHeard = true; });
s = await act('up');
const sinB = await G(() => ({ tape: __game.has('backward_tape'), sub: !!__game.flags.tapeSubmitted }));
check('B 루트 신문고: 테이프를 넣을 수 없음(선택지 없음, 테이프 그대로)', s.choices.length === 0 && sinB.tape && !sinB.sub, J({ choices: s.choices, sinB }));

await G(() => { const g = __game; g.hp = 100; g.invuln = 0; g.run('ankle'); });
s = await settle({ qte: 'none' });
const ankFail = await G(() => ({ hp: __game.hp, hands: !!__game.actor('hands') }));
check('발목 귀신 QTE 실패(연타 없음) → 체력 -15', s.qtes === 1 && ankFail.hp === 85 && !ankFail.hands, J({ qtes: s.qtes, ankFail }));
await G(() => { const g = __game; g.hp = 100; g.invuln = 0; g.run('ankle'); });
s = await settle({ qte: 'tap' });
const ankOk = await G(() => ({ hp: __game.hp, hands: !!__game.actor('hands') }));
check('발목 귀신 QTE 성공(연타) → 피해 없음', s.qtes === 1 && ankOk.hp === 100 && !ankOk.hands, J({ qtes: s.qtes, ankOk }));

// 계단으로 3층: 두 동행 모두 새 층에
w = await go(4.5, 1.5, { stopOnMap: true });
await frames(400);
const at3 = await G(() => {
  const g = __game, p = g.player, s = g.actor('soyoung'), j = g.actor('jihyeon');
  return { map: g.mapId, s: s && +Math.hypot(s.x - p.x, s.y - p.y).toFixed(2), j: j && +Math.hypot(j.x - p.x, j.y - p.y).toFixed(2), jk: j?.constructor.name, jf: j?.followId, strikes: g.flags.strikes_soyoung || 0 };
});
check('계단으로 층을 옮기면 두 동행 모두 새 층(3층)에 나타남', at3.map === 'shingwan_3f' && at3.s < 2.5 && at3.j < 2.5 && at3.jk === 'Follower' && at3.jf === 'soyoung' && at3.strikes === 0, J(at3));

// ================================================================ 3-03 구석의 아이(3층 교실 드나들기)
const ROOM_A = { 1: 7, 2: 14, 3: 32, 4: 39, 5: 46, 6: 1, 7: 8, 8: 15, 9: 22, 10: 31, 11: 38, 12: 45 };
const hallOf = n => (+n === 9 ? [22.5, 11.5] : +n <= 5 ? [ROOM_A[n] + 2.5, 9.5] : [ROOM_A[n] + 2.5, 11.5]);
const insideOf = n => (+n === 9 ? [25.5, 14.5] : +n <= 5 ? [ROOM_A[n] + 2.5, 6.5] : [ROOM_A[n] + 2.5, 13.5]);
async function visit(n) {
  const [hx, hy] = hallOf(n), [ix, iy] = insideOf(n);
  await tp(hx, hy, 'up');
  await frames(60);
  const n0 = await G(() => __qa.runs.length);
  const a = await go(ix, iy), b = await go(hx, hy);
  const st = await G(n0 => ({ runs: __qa.runs.slice(n0), step: __game.flags.spiderStep || 0, hp: __game.hp, done: !!__game.flags.spiderDone, at: __game.flags.spiderAt }), n0);
  return { ok: a.ok && b.ok, texts: [...a.texts, ...b.texts], ...st };
}
await G(() => { const g = __game; g.timeScale = 2; g.hp = 100; g.invuln = 0; g.run('spiderNote'); });
s = await settle();
const SL = await G(() => String(__game.flags.spiderList).split(','));
const other = Object.keys(ROOM_A).find(n => !SL.includes(n));
check('음악감상실 쪽지 → 구석의 아이 시작(쪽지에 교실 번호)', s.docs.some(d => SL.every(n => d.includes('3-' + n))) && (await G(() => !!__game.flags.spiderActive)), J({ SL, docs: s.docs.length }));
let v = await visit(SL[1]);
check('구석의 아이: 순서를 건너뛰면 천장에서 소녀가 떨어짐(체력 -20, 처음부터)', v.ok && v.runs.includes('spiderDrop') && v.hp === 80 && v.step === 0 && v.texts.some(t => t.includes('틀렸어')), J({ room: SL[1], ...v, texts: undefined }));
v = await visit(SL[0]);
const step1 = v.step === 1 && v.runs.includes('spiderGiggle');
await G(() => { __game.invuln = 0; });
v = await visit(other);
check('구석의 아이: 쪽지에 없는 교실은 상관없음(진행 유지, 아무 일 없음)', step1 && v.ok && v.step === 1 && v.runs.length === 0 && v.hp === 80, J({ other, step1, ...v, texts: undefined }));
const inv0 = await G(() => ({ coin: __game.count('coin'), drink: __game.count('drink') }));
v = await visit(SL[1]);
const st2 = v.step;
v = await visit(SL[2]);
const st3 = v.step;
v = await visit(SL[3]);
const inv1 = await G(() => ({ coin: __game.count('coin'), drink: __game.count('drink') }));
check('구석의 아이: 작은 번호부터 차례대로 → spiderDone, 동전·음료수', st2 === 2 && st3 === 3 && v.done && v.runs.includes('spiderFound') && inv1.coin === inv0.coin + 1 && inv1.drink === inv0.drink + 1 && v.hp === 80, J({ st2, st3, done: v.done, inv0, inv1 }));

// ================================================================ 3-11 교실 불(차례: 고정 3 → 9 → 12 → 1 → 7) → 전기실 레버
async function pressLight(n) {
  n = +n;
  const a = ROOM_A[n];
  if (n <= 5) await tp(a + 1.5, 9.4, 'up');
  else { const [hx, hy] = hallOf(n); await tp(hx, hy, 'up'); await go(n === 9 ? 23.5 : a + 1.5, n === 9 ? 14.5 : 13.5); }
  return act('up');
}
const lightsOn = () => G(() => Object.keys(__game.flags).filter(k => /^light_\d+$/.test(k) && __game.flags[k]).sort());
await G(() => { __game.flags.lightSeq = '3,9,12,1,7'; });
await tp(5.5, 9.4, 'up');
s = await act('up');
check('3층 게시판 별자리 메모: 교실 불 차례', s.focus === 'star' && s.docs.some(d => d.includes('3-3 → 3-9 → 3-12 → 3-1 → 3-7')) && (await G(() => !!__game.flags.starRead)), J(s.docs));
w = await go(27.5, 2.5);
s = await act('up', { choose: ['내린다'] });
const lev0 = await G(() => ({ lever: !!__game.flags.leverDone, key: !!__game.flags.keyDropped }));
check('불을 다 켜기 전에 레버 → 아무 일 없음(keyDropped 없음)', w.ok && s.focus === 'lever' && !lev0.lever && !lev0.key && s.texts.some(t => t.includes('아무 일도')), J({ w: w.reason, lev0 }));
await G(() => { const j = __game.actor('dalsu'); j.state = 'patrol'; j.lastSeen = null; });
s = await pressLight(3);
const l1 = await G(() => { const j = __game.actor('dalsu'); return { l3: !!__game.flags.light_3, step: __game.flags.lightStep, js: j?.state, ls: j?.lastSeen }; });
check('불을 켜면 손달수가 그 교실 쪽으로 온다(3-3 중앙 35,4.5 확인)', s.focus === 'sw3' && l1.l3 && l1.step === 1 && l1.js === 'investigate' && J(l1.ls) === J([35, 4.5]), J(l1));
s = await pressLight(12);
const l2 = { on: await lightsOn(), step: await G(() => __game.flags.lightStep) };
check('틀린 차례(3-9 대신 3-12)로 켜면 모든 교실 불·lightStep 초기화', s.focus === 'sw12' && l2.on.length === 0 && l2.step === 0 && s.texts.some(t => t.includes('차례가 틀린')), J(l2));
const sw9 = await G(() => {
  const g = __game, e = g.world.def.events.find(e => e.id === 'sw9'), prop = g.world.props.some(q => q.lift === 10 && q.x === 23 && q.y === 13);
  const p = g.player, keep = [p.x, p.y, p.dir];
  p.x = 23.5; p.y = 12.4; p.dir = 'down';
  const f = g.focus();
  [p.x, p.y, p.dir] = keep;
  return { ev: e && [e.x, e.y], prop, wall: g.world.isWall(23, 13), fromHall: f?.ev?.id || f?.kind || null };
});
const seqRes = [];
for (const n of [3, 9, 12, 1, 7]) { s = await pressLight(n); seqRes.push({ n, focus: s.focus, step: await G(() => __game.flags.lightStep) }); }
check('3-9 교실 스위치는 (23,13) 벽에 있고, 교실 안에서 조사해 켤 수 있다(복도 쪽에서는 아님)',
  J(sw9.ev) === J([23, 13]) && sw9.prop && sw9.wall && sw9.fromHall !== 'sw9' && seqRes[1].focus === 'sw9' && seqRes[1].step === 2, J({ sw9, s9: seqRes[1] }));
const allOn = await lightsOn();
check('메모 차례대로 다섯 교실 불을 켬(lightStep 5)', seqRes.map(r => r.step).join() === '1,2,3,4,5' && J(allOn) === J(['light_1', 'light_12', 'light_3', 'light_7', 'light_9']) && s.texts.some(t => t.includes('모두 밝혀졌다')), J({ seqRes, allOn }));
await tp(27.5, 2.5, 'up');
s = await act('up', { choose: ['내린다'] });
const lev1 = await G(() => ({ lever: !!__game.flags.leverDone, key: !!__game.flags.keyDropped }));
check('차례대로 다 켠 뒤 레버 → leverDone, 옥상 열쇠가 떨어짐(keyDropped)', lev1.lever && lev1.key, J(lev1));

// 손달수 공격 간격: 맞은 뒤 무적(1.2초) 동안은 휘두르지 않는다 → 서 있는 플레이어는 약 1.2초마다 34 (전에는 헛손질로 약 2초)
const jh = await G(() => new Promise(done => {
  const g = __game, j = g.actor('dalsu');
  __qa.tp(40.5, 10.5, 'left');
  Object.assign(j, { x: 41, y: 10.5, state: 'chase', lastSeen: [40.5, 10.5], path: null, hitCool: 0, frozen: false, dir: 'left' });
  g.timeScale = 1; g.hp = 100; g.invuln = 0; __qa.swings = []; g.qaSafe = false;
  const t0 = performance.now();
  const tick = () => {
    const dmg = __qa.swings.filter(s => s.after < s.before);
    if (dmg.length >= 2 || performance.now() - t0 > 5000) {
      g.qaSafe = true; // 세 번째(쓰러짐) 전에 멈춘다
      const out = { swings: __qa.swings.map(s => ({ t: +s.t.toFixed(3), inv: +s.inv.toFixed(2), before: s.before, after: s.after })), state: j.state };
      g.hp = 100; g.invuln = 0; j.state = 'patrol'; j.lastSeen = null; g.timeScale = 2;
      return done(out);
    }
    requestAnimationFrame(tick);
  };
  tick();
}));
{
  const dmg = jh.swings.filter(s => s.after < s.before), gap = dmg.length >= 2 ? +(dmg[1].t - dmg[0].t).toFixed(3) : null;
  check('손달수는 무적 중엔 휘두르지 않아 약 1.2초마다 34 피해(헛손질 없음)', dmg.length === 2 && jh.swings.length === 2 && dmg.every(s => s.before - s.after === 34 && s.inv === 0) && gap >= 1.15 && gap <= 1.4, J({ gap, ...jh }));
}

// 1층 중앙홀 옥상 열쇠 → 4층 계단 → 옥상
await G(() => { __game.enterMap('shingwan_1f', 19.5, 11.5, 'up'); });
await settle();
s = await act('up');
const rk = await G(() => ({ key: __game.has('key_roof'), taken: !!__game.flags.roofKeyTaken, js: __game.actor('dalsu')?.state, ls: __game.actor('dalsu')?.lastSeen }));
check('1층 중앙홀 옥상 열쇠를 주우면 손달수가 내려온다', s.focus === 'roofKey' && rk.key && rk.taken && rk.js === 'investigate' && J(rk.ls) === J([19.5, 10.5]), J(rk));
await G(() => { __game.enterMap('shingwan_4f', 3.5, 5.5, 'up'); });
await settle();
w = await go(1.5, 1.5, { stopOnMap: true });
const roof = await G(() => ({ map: __game.mapId, mermaid: __game.actor('mermaid')?.constructor.name, x: __game.player.x, y: __game.player.y }));
check('옥상 철문은 옥상 열쇠로 → 옥상(인어가 물 위를 맴돎)', roof.map === 'shingwan_roof' && roof.mermaid === 'Ghost' && w.cgs.some(c => c.includes('cg_mermaid')), J(roof));

// ================================================================ 옥상 수영장
await G(() => { const g = __game; g.despawn('mermaid'); g.hp = 100; g.invuln = 0; g.timeScale = 2; });
await tp(3.5, 14.2, 'up');
let n0 = await G(() => __qa.runs.length);
const drag = await G(() => __qa.stick([[3.5, 13.5], [3.5, 12.4]]));
await page.waitForFunction(() => __game.busy > 0 || __game.ui.modalCount > 0, null, { timeout: 3000, polling: 'raf' }).catch(() => {});
s = await settle();
const dr = await G(n0 => ({ runs: __qa.runs.slice(n0), hp: __game.hp, x: +__game.player.x.toFixed(2), y: +__game.player.y.toFixed(2) }), n0);
check('수맥 길이 아닌 물칸(3,12)에 0.25초 넘게 → 끌려감(체력 -15, 물가 6.5,14.2로)', dr.runs.includes('poolDrag') && dr.hp === 85 && near(dr.x, 6.5, 0.05) && near(dr.y, 14.2, 0.05) && s.texts.some(t => t.includes('끌어당겼다')), J({ drag: drag.reason, ...dr }));
await tp(6.5, 13.5, 'up');
const glow0 = await G(() => { const g = __game, had = g.has('lrod'), a = __qa.glowCheck([6, 12]); if (had) g.take('lrod'); const none = g.world.def.dynGlows(g).length; if (had) g.give('lrod'); return { ...a, had, none }; });
n0 = await G(() => __qa.runs.length);
const pathPts = [...(await G(() => __qa.POOL_PATH)).map(([c, r]) => [c + 0.5, r + 0.5]), [17.5, 4.5], [17.5, 3.5]];
const walk = await G(pts => __qa.stick(pts, 0.7, true), pathPts);
const after = await G(n0 => ({ runs: __qa.runs.slice(n0), hp: __game.hp, x: +__game.player.x.toFixed(2), y: +__game.player.y.toFixed(2) }), n0);
const gl = [glow0, ...walk.glows];
check('L로드: 가까운 수맥 길 칸만 반짝임(길 밖 칸·먼 칸 없음, 다음 칸은 늘 반짝임), L로드 없으면 표시 없음',
  glow0.had && glow0.none === 0 && gl.every(x => x.n > 0 && x.off.length === 0 && x.far.length === 0 && x.next), J({ glow0, bad: gl.filter(x => !(x.n > 0 && !x.off.length && !x.far.length && x.next)) }));
check('POOL_PATH 칸 중앙만 따라 건너면 끌려가지 않음(북쪽 데크 도착)', walk.ok && !after.runs.includes('poolDrag') && after.hp === 85 && near(after.x, 17.5, 0.1) && near(after.y, 3.5, 0.1), J({ walk: walk.reason, at: walk.at, ...after }));
w = await go(20.5, 3.5);
s = await act('up');
const vh = await G(() => __game.has('valve_handle'));
await tp(5.5, 14.5, 'up');
s = await act('up', { choose: ['돌린다'] });
const dry = await G(() => { const g = __game; return { drained: !!g.flags.poolDrained, dead: !!g.flags.mermaidDead, mermaid: !!g.actor('mermaid'), handle: g.has('valve_handle'), pick: g.pickups().map(e => e.id), style: g.world.floorStyle(3, 12), glows: g.world.def.dynGlows(g).length }; });
check('밸브 손잡이 + 빨간 밸브 → 물 빠짐, 인어 사라짐(mermaidDead), 水의 패 줍기 가능', vh && s.focus === 'valve' && dry.drained && dry.dead && !dry.mermaid && !dry.handle && dry.pick.includes('tabletWater') && dry.glows === 0, J(dry));
n0 = await G(() => __qa.runs.length);
await G(() => __qa.stick([[3.5, 14.5], [3.5, 12.5], [4.5, 11.5]]));
await frames(700);
const dry2 = await G(n0 => ({ runs: __qa.runs.slice(n0), hp: __game.hp, busy: __game.busy, cell: __game.world.ch(Math.floor(__game.player.x), Math.floor(__game.player.y)) }), n0);
check('물 빠진 뒤에는 길 밖 물칸도 마른 바닥(끌려가지 않음)', dry.style === 'pooldry' && dry2.cell === 'P' && !dry2.runs.includes('poolDrag') && dry2.hp === 85 && !dry2.busy, J(dry2));
w = await go(14.5, 9.5);
s = await act('up');
check('물 빠진 수영장 한가운데 水의 패 획득', s.focus === 'tabletWater' && (await G(() => __game.has('tablet_water'))), s.focus);

// ================================================================ 3-10 휴게실(B): 캔커피 → 다이어리 순서
await G(() => { __game.enterMap('shingwan_2f', 28.5, 10.5, 'up'); });
await settle();
await G(() => { if (!__game.has('coin')) __game.give('coin'); });
w = await go(28.5, 6.5);
const rest0 = await G(() => ({ resting: !!__game.flags.resting, talk: __game.actor('soyoung')?.talk }));
await G(() => { const j = __game.actor('jihyeon'); if (j) { j.follow = false; j.x = 30.5; j.y = 6.5; j.path = null; } });
w = await go(31.5, 2.5);
s = await act('up', { choose: ['캔커피'] });
const coffee = await G(() => __game.has('can_coffee'));
const talk = async pick => { await go(26.6, 5.3); return act('up', { choose: [pick] }); };
s = await talk('캔커피를 건넨다');
s = await talk('다이어리를 돌려준다');
const ord1 = await G(() => ({ ok: __game.flags.restOrderOK, chr: !!__game.flags.chrysanthemum, resting: !!__game.flags.resting })); // 하얀 국화는 다이어리를 건넨 순간(이제 가자 전)
s = await talk('이제 가자');
const rest1 = await G(() => ({ ok: __game.flags.restOrderOK, chr: !!__game.flags.chrysanthemum, done: !!__game.flags.restDone, coffee: __game.has('can_coffee'), diary: __game.has('diary'), follow: __game.actor('soyoung')?.follow }));
check('휴게실(B): 자판기 캔커피 → 소영에게 캔커피 → 다이어리 = restOrderOK·하얀 국화(이제 가자 전에 이미), 이제 가자 → 다시 따라옴', rest0.resting && rest0.talk === 'restTalk' && coffee && ord1.ok === true && ord1.chr && ord1.resting && rest1.ok === true && rest1.chr && rest1.done && !rest1.coffee && !rest1.diary && rest1.follow, J({ rest0, coffee, ord1, rest1 }));
await G(() => { const g = __game, f = g.flags; for (const k of ['restDone', 'resting', 'coffeeGiven', 'diaryGiven', 'restOrderOK', 'chrysanthemum']) delete f[k]; g.give('diary'); g.give('can_coffee'); });
s = await settle(); // 휴게실 안이라 바로 다시 쉬기 시작
s = await talk('다이어리를 돌려준다');
const ord2 = await G(() => __game.flags.restOrderOK);
s = await talk('캔커피를 건넨다');
s = await talk('이제 가자');
const rest2 = await G(() => ({ ok: __game.flags.restOrderOK, chr: !!__game.flags.chrysanthemum, done: !!__game.flags.restDone }));
check('휴게실(B): 다이어리를 먼저 주면 restOrderOK false, 하얀 국화 없음', ord2 === false && rest2.ok === false && !rest2.chr && rest2.done, J({ ord2, rest2 }));
await G(() => { const j = __game.actor('jihyeon'); if (j) j.follow = true; __qa.calm(); });

// ================================================================ 3-13~14 水의 문 → 은미 추격
w = await go(4.5, 11.4);
await G(() => { const g = __game; g.hp = 100; g.invuln = 0; g.timeScale = 1; g.qaSafe = false; __qa.touches = []; });
s = await act('down', { choose: ['끼운다'] });
const ch = await G(() => {
  const g = __game, e = g.actor('eunmi');
  return { chase: !!g.flags.eunmiChase, out: !!g.flags.janitorsOut, seal: !!g.flags.sealOpen, door: g.world.door(4, 12).open, tablet: g.has('tablet_water'), cp: g.checkpointData?.label, cpChase: g.checkpointData?.flags.eunmiChase, kind: e?.constructor.name, pf: e?.pathfind, ec: e?.chase, phase: e?.phase, speed: e?.speed, dmg: e?.dmg, dalsu: !!g.actor('dalsu') };
});
check('水의 패를 끼우면 문이 열리고 은미 추격 시작(체크포인트 저장, 수위 둘 다 기절)', s.focus === 'sealWater' && ch.chase && ch.out && ch.seal && ch.door && !ch.tablet && /水의 문/.test(ch.cp || '') && ch.cpChase && !ch.dalsu && s.cgs.some(c => c.includes('cg_eunmi')), J(ch));
check('은미: 길을 찾아 쫓는 귀신(pathfind, 벽 통과 없음) · 속도 3.2 · 피해 30', ch.kind === 'Ghost' && ch.pf === true && ch.ec === true && ch.phase === false && ch.speed === 3.2 && ch.dmg === 30, J(ch));
const ap = await G(() => new Promise(done => {
  const g = __game, e = g.actor('eunmi');
  __qa.tp(12.5, 14.5, 'up');
  g.setDoor(12, 12, 'closed');
  e.x = 12.5; e.y = 9.5; e.path = null; e.repath = 0; e.stun = 0;
  const t0 = performance.now(), n0 = __qa.touches.length, d0 = Math.hypot(e.x - g.player.x, e.y - g.player.y);
  let opened = null;
  const tick = () => {
    const d = g.world.door(12, 12);
    if (!opened && d.open) opened = { ey: +e.y.toFixed(2), t: Math.round(performance.now() - t0) };
    if (__qa.touches.length > n0 || performance.now() - t0 > 8000) return done({ d0, opened, touch: __qa.touches[n0] || null, flag: g.flags['door:shingwan_2f:12,12'] });
    requestAnimationFrame(tick);
  };
  tick();
}));
check('은미는 닫힌(잠기지 않은) 문을 열고 들어와, 닿으면 체력 -30', ap.opened && ap.opened.ey < 12.5 && ap.flag === 'open' && ap.touch?.id === 'eunmi' && ap.touch.inv === 0 && ap.touch.before - ap.touch.after === 30 && ap.touch.gy > 12.5, J(ap));
// 숨은 동안 은미는 멈춰 기다린다(2층 화장실 칸): 두 칸 앞에서 숨으면 다가오지도 닿지도 않고, 나오면 다시 쫓는다
await G(() => { const g = __game, e = g.actor('eunmi'); __qa.tp(35.5, 16.5, 'down'); Object.assign(e, { x: 35.5, y: 14.5, path: null, stun: 0 }); g.invuln = 0; });
s = await act('down');
const hd0 = await G(() => { const g = __game, e = g.actor('eunmi'); return { hidden: g.player.hidden, ex: e.x, ey: e.y, d: +Math.hypot(e.x - g.player.x, e.y - g.player.y).toFixed(2), n: __qa.touches.length, hp: g.hp }; });
await frames(1200);
const hd1 = await G(() => { const g = __game, e = g.actor('eunmi'); return { hidden: g.player.hidden, ex: e.x, ey: e.y, moving: e.moving, n: __qa.touches.length, hp: g.hp }; });
check('숨어 있는 동안 은미는 멈춰 기다린다(다가오지도·닿지도 않음)', s.focus === 'st33' && hd0.hidden && hd1.hidden && Math.hypot(hd1.ex - hd0.ex, hd1.ey - hd0.ey) < 0.01 && !hd1.moving && hd1.n === hd0.n && hd1.hp === hd0.hp, J({ focus: s.focus, hd0, hd1 }));
await G(() => { __game.hp = 30; __game.invuln = 0; __input.pressed.add('action'); }); // 칸에서 나오면 → 다시 쫓아와 닿음(체력 30 → 0)
await frames(350);
const hd2 = await G(h => { const g = __game, e = g.actor('eunmi'); return { hidden: g.player.hidden, moved: e ? +Math.hypot(e.x - h.ex, e.y - h.ey).toFixed(2) : null, n: __qa.touches.length }; }, hd1);
check('숨었다 나오면 은미가 다시 쫓아온다', !hd2.hidden && (hd2.moved > 0.3 || hd2.n > hd1.n), J({ hd1: { ex: hd1.ex, ey: hd1.ey }, hd2 }));
await page.waitForSelector('.over-layer', { timeout: 8000 }).catch(() => {});
const ov = await G(() => ({ over: __game.over, hp: __game.hp, title: document.querySelector('.over-title')?.textContent || '', btns: [...document.querySelectorAll('.over-layer .title-btn')].map(b => b.textContent) }));
check('체력 0 → 게임오버, 체크포인트에서 다시 버튼', ov.over && ov.hp === 0 && ov.title.includes('정신을 잃었다') && /水의 문/.test(ov.btns[0] || ''), J(ov));
await frames(260);
await page.locator('.over-layer .title-btn').first().dispatchEvent('pointerdown');
await frames(300);
const rs = await G(() => {
  const g = __game;
  return { over: g.over, layers: document.querySelectorAll('#ui .layer').length, map: g.mapId, x: +g.player.x.toFixed(2), y: +g.player.y.toFixed(2), hp: g.hp, chase: !!g.flags.eunmiChase, seal: !!g.flags.sealOpen, door: g.world.door(4, 12).open, tablet: g.has('tablet_water'), out: !!g.flags.janitorsOut, f: !!g.actor('soyoung'), f2: !!g.actor('jihyeon') };
});
await page.waitForFunction(() => !!__game.actor('eunmi'), null, { timeout: 6000, polling: 'raf' }).catch(() => {});
const eun2 = await G(() => { const e = __game.actor('eunmi'); return e && { chase: e.chase, pf: e.pathfind, x: +e.x.toFixed(2), y: +e.y.toFixed(2) }; });
check('체크포인트에서 다시: 水의 문 직후(추격 중, 패 없음, 문 열림), 잠시 뒤 은미가 중앙홀에 다시 나타남',
  !rs.over && rs.layers === 0 && rs.map === 'shingwan_2f' && near(rs.x, 4.5, 0.2) && near(rs.y, 11.4, 0.2) && rs.hp === 100 && rs.chase && rs.seal && rs.door && !rs.tablet && rs.out && rs.f && rs.f2 && eun2?.chase && eun2?.pf && near(eun2.x, 19.5, 0.3) && near(eun2.y, 8.5, 0.3), J({ rs, eun2 }));
// 水의 문을 연 직후와 같은 상황(플레이어는 문 앞, 은미는 중앙홀 19.5,8.5에서 막 나타남) → 스틱 끝까지(달리기) 계단으로 2층 → 3층 → 4층 난간
await G(() => {
  __qa.touches = []; __qa.spawns = []; __qa.enters = [];
  const T = __qa.track = { minD: 1e9, stop: false };
  const tick = () => {
    const g = __game, e = g.actor('eunmi');
    if (e && g.flags.eunmiChase && !g.busy && !g.ui.modalCount) T.minD = Math.min(T.minD, Math.hypot(e.x - g.player.x, e.y - g.player.y));
    if (!T.stop) requestAnimationFrame(tick);
  };
  tick();
});
const hpRun = await G(() => __game.hp);
const legs = [];
legs.push(await go(1.5, 1.5, { stopOnMap: true, qte: 'tap', fast: true })); // 2층 → 3층
legs.push(await go(1.5, 1.5, { stopOnMap: true, qte: 'tap', fast: true })); // 3층 → 4층
legs.push(await go(16.5, 10.5, { qte: 'tap', fast: true }));               // 4층 복도 → 중앙홀 난간
const esc = await G(() => {
  __qa.track.stop = true;
  const g = __game;
  // 층에 들어선 뒤(조작 가능한 시간 기준) 은미가 나타나기까지
  const delays = __qa.spawns.map(sp => {
    const ens = __qa.enters.filter(e => e.free <= sp.free), en = ens[ens.length - 1], prev = ens[ens.length - 2];
    return { map: sp.map, at: [sp.x, sp.y], afterEnter: en ? +(sp.free - en.free).toFixed(2) : null, afterPrevFloor: prev ? +(sp.free - prev.free).toFixed(2) : null };
  });
  return { over: g.over, hp: g.hp, map: g.mapId, fell: !!g.flags.eunmiFell, chase: !!g.flags.eunmiChase, cp: g.checkpointData, touches: __qa.touches.filter(t => t.id === 'eunmi').length, minD: +__qa.track.minD.toFixed(2), maps: __qa.enters.map(e => e.map), delays, a41: !!g.flags['ev:ankle41'], a42: !!g.flags['ev:ankle42'] };
});
const qtes = legs.reduce((n, l) => n + l.qtes, 0);
check('水의 문 앞에서 달려(스틱 끝까지) 도망치면 은미에게 잡히지 않고 계단으로 4층 난간까지(게임오버·피해 없음)',
  legs.every(l => l.ok) && !esc.over && esc.touches === 0 && esc.hp === hpRun && esc.fell && J(esc.maps) === J(['shingwan_3f', 'shingwan_4f']), J({ legs: legs.map(l => l.reason || 'ok'), ...esc, cp: !!esc.cp }));
check('추격 중 4층 복도 발목 귀신 두 번(연타로 뿌리침 → 피해 없음)', qtes === 2 && esc.a41 && esc.a42 && esc.hp === hpRun, J({ qtes, hpRun, hp: esc.hp }));
await frames(800);
const gone = await G(() => !__game.actor('eunmi'));
check('4층 난간 → 은미 추락(eunmiFell), 추격 끝, 체크포인트 지움, 은미 다시 안 나타남', esc.fell && !esc.chase && !esc.cp && gone && legs[2].cgs.some(c => c.includes('cg_fall')), J({ fell: esc.fell, chase: esc.chase, gone }));

// ================================================================ 3-15 차단기 → 3장 끝
await G(() => { __game.qaSafe = true; __game.timeScale = 2; });
w = await go(29.5, 13.5);
s = await act('up');
check('차단기: 강당 전원 안내를 읽기 전에는 스위치 창 없음', s.state === 'free' && s.texts.some(t => t.includes('시설과')) && !(await G(() => __game.flags.breakerDone)), J({ state: s.state, texts: s.texts }));
await G(() => { __game.run('powerDoc'); });
s = await settle();
const code = await G(() => String(__game.flags.breakerCode).split(','));
const powerDoc = s.docs.some(d => d.includes(code.join(' · ') + '번'));
const switches = async on => { await ready(); await G(on => { const L = __qa.top(), b = [...L.querySelectorAll('.switch')]; on.forEach(i => __qa.pd(b[i])); __qa.pd(L.querySelector('.btn-close.ok')); }, on); return settle(); };
s = await act('up');
const swTitle = s.title;
s = await switches([0, 1, 2, 3, 4, 5]);
const bw = await G(() => ({ done: !!__game.flags.breakerDone, clear: __game.flags.ch3Clear }));
check('차단기: 틀린 조합(6개 모두) → 파직, breakerDone 없음', powerDoc && /차단기/.test(swTitle || '') && s.state === 'free' && !bw.done && !bw.clear && s.texts.some(t => t.includes('파직')), J({ swTitle, bw }));
s = await act('up');
s = await switches(code.map(n => +n - 1));
const end = await G(() => ({ done: !!__game.flags.breakerDone, clear: __game.flags.ch3Clear, text: document.querySelector('.over-layer.end')?.textContent || '' }));
check('차단기: 강당 전원 안내 번호대로 → 제3장 끝', s.state === 'end' && end.done && end.clear === 'B' && end.text.includes('제3장 끝'), J({ code, end }));

// ================================================================ A 루트(새로 시작): 어학실 테이프 → 신문고 투고
await page.reload();
s = await boot('성아');
const a0 = await G(() => ({ route: __game.flags.route, follower: __game.flags.follower, f2: __game.flags.follower2, kind: __game.actor('jihyeon')?.constructor.name, seonga: !!__game.actor('seonga'), map: __game.mapId }));
check('챕터 선택 → 3장 성아·지현 루트: 동행 지현, 성아는 따로 감', a0.route === 'A' && a0.follower === 'jihyeon' && !a0.f2 && a0.kind === 'Follower' && !a0.seonga && a0.map === 'shingwan_1f', J(a0));
await G(() => { __game.timeScale = 2; __game.enterMap('shingwan_2f', 8.5, 3.5, 'up'); });
await settle();
s = await act('up', { choose: ['그대로 튼다'] });
const heard0 = await G(() => !!__game.flags.tapeHeard);
s = await act('up', { choose: ['반대로'] });
const tc = await G(() => __game.flags.tapeCode);
const heard1 = await G(() => !!__game.flags.tapeHeard);
check('어학실: 그대로 틀면 못 알아들음 / 반대로(앞으로) 돌리면 확인 번호', s.focus === 'langLab' && !heard0 && heard1 && s.texts.some(t => t.includes([...tc].join(', '))), J({ heard0, heard1, tc }));
await G(() => { __game.enterMap('shingwan_4f', 14.5, 10.5, 'up'); });
await settle();
s = await act('up', { choose: ['넣는다'] });
const sub = await G(() => ({ sub: !!__game.flags.tapeSubmitted, tape: __game.has('backward_tape') }));
check('A 루트 신문고: 테이프 투고 → tapeSubmitted, 테이프 없어짐', s.focus === 'sinmungo' && sub.sub && !sub.tape, J(sub));

// A: 도서관2에서 지현을 다시 만나지 않고 난간까지 가면 지현은 말하지 않고(곁에 없음), 나중에 만나도 목표(차단기실)는 그대로
await G(() => { const g = __game; Object.assign(g.flags, { jiLost: true, jiFound: false, follower: null, eunmiChase: true, sealOpen: true, janitorsOut: true, seen34: true }); g.enterMap('shingwan_4f', 14.5, 10.5, 'up'); });
await settle();
await G(() => { __game.run('eunmiFall'); });
s = await settle();
const fallObj = await G(() => __game.flags.objective);
check('A: 지현 없이 난간에 오면 지현 대사 없이 성아 장면만, 목표는 차단기실', !s.texts.some(t => t.includes('저, 저 아래') || t.includes('…성아야')) && s.texts.some(t => t.includes('성아는 한 번도')) && /차단기실/.test(fallObj), J({ texts: s.texts.slice(-4), fallObj }));
w = await go(28.5, 4.5);
const late = await G(() => ({ f: __game.flags.follower, found: !!__game.flags.jiFound, obj: __game.flags.objective }));
check('A: 늦게 도서관2에서 지현을 만나면 다시 동행, 목표(차단기실)는 그대로', w.ok && late.found && late.f === 'jihyeon' && /차단기실/.test(late.obj), J({ late, w: w.reason }));

// 은미 재등장 예약은 그 층에서만: 2.2초 안에 층을 또 옮기면 앞 층 예약은 버리고, 새 층 진입 2.2초 뒤 새 층 자리(벽 아님)에 나타난다
await G(() => {
  const g = __game; window.__elog = [];
  g.timeScale = 1; g.qaSafe = true;
  let free = 0; const otl = g.tickLaters.bind(g); g.tickLaters = dt => { free += dt; return otl(dt); };
  const oem = g.enterMap.bind(g); g.enterMap = (id, ...r) => { __elog.push({ ev: 'enter', map: id, free }); return oem(id, ...r); };
  const osp = g.spawn.bind(g); g.spawn = a => { if (a.id === 'eunmi') __elog.push({ ev: 'spawn', map: g.mapId, x: a.x, y: a.y, free, solid: g.world.isSolid(Math.floor(a.x), Math.floor(a.y)) }); return osp(a); };
  Object.assign(g.flags, { eunmiChase: true, eunmiFell: false, sealOpen: true, janitorsOut: true, seen32: true, seen33: true, seen34: true });
  g.give('card_red');
  g.enterMap('shingwan_2f', 2.5, 5.5, 'up');
});
await settle();
await frames(1000);
await G(() => __bot.walkTo(1.5, 1.5, true)); // 2층 계단 → 3층(2층 예약이 끝나기 전에)
await settle();
await frames(3000);
const elog = await G(() => __elog);
const e3 = elog.find(e => e.ev === 'enter' && e.map === 'shingwan_3f'), sp = elog.filter(e => e.ev === 'spawn');
check('은미 재등장: 층을 곧바로 옮기면 앞 층 예약은 버리고 새 층 진입 2.2초 뒤 새 층 자리(벽 아님)에', !!e3 && sp.length === 1 && sp[0].map === 'shingwan_3f' && !sp[0].solid && sp[0].free - e3.free >= 2.1, J(elog.map(e => ({ ...e, free: +e.free.toFixed(2) }))));

// ================================================================ B 휴게실(새로 시작): 쉬는 사이 생긴 목표 유지, 쉬는 중에 水의 문
await page.reload();
s = await boot('소영');
await G(() => { const g = __game; g.qaSafe = true; g.timeScale = 2; g.api().objective('4층 둘러보기 — 서고·컴퓨터실·오컬트부'); g.enterMap('shingwan_2f', 28.5, 9.5, 'up'); });
await settle();
w = await go(28.5, 4.5); // 휴게실(다이어리 소지) → 소영이 소파에 앉음
const rs0 = await G(() => ({ resting: !!__game.flags.resting, obj: __game.flags.objective }));
w = await go(8.5, 3.5);
s = await act('up', { choose: ['반대로'] }); // 같은 층 어학실 테이프 → 새 목표(확인 번호)
const tc2 = await G(() => __game.flags.tapeCode);
w = await go(1.5, 1.5, { stopOnMap: true }); // 계단 → 3층(휴식 끝)
await settle();
const rs1 = await G(() => ({ map: __game.mapId, resting: !!__game.flags.resting, obj: __game.flags.objective }));
check('B 휴게실: 쉬는 사이 생긴 새 목표(테이프 번호)는 층을 옮겨도 지워지지 않음', rs0.resting && rs0.obj === '(선택) 소파의 소영에게 말 걸기' && rs1.map === 'shingwan_3f' && !rs1.resting && rs1.obj.includes(tc2), J({ rs0, rs1, tc2 }));
await G(() => { const g = __game; g.give('tablet_water'); g.enterMap('shingwan_2f', 28.5, 9.5, 'up'); });
await settle();
w = await go(28.5, 4.5); // 다시 쉼
const rs2 = await G(() => !!__game.flags.resting);
w = await go(4.5, 11.5);
s = await act('down', { choose: ['끼운다'] });
const rs3 = await G(() => { const g = __game, a = g.actor('soyoung'); return { resting: !!g.flags.resting, follow: a?.follow, talk: a?.talk, f: g.flags.follower, chase: !!g.flags.eunmiChase, obj: g.flags.objective }; });
w = await go(1.5, 1.5, { stopOnMap: true, qte: 'tap' });
await settle({ qte: 'tap' });
const rs4 = await G(() => ({ map: __game.mapId, obj: __game.flags.objective }));
check('B: 쉬는 중에 水의 문을 열면 소영이 일어나 따라오고, 층을 옮겨도 추격 목표 유지', rs2 && !rs3.resting && rs3.follow === true && rs3.talk === 'companionTalk' && rs3.chase && /^은미에게서/.test(rs3.obj) && rs4.map === 'shingwan_3f' && /^은미에게서/.test(rs4.obj), J({ rs2, rs3, rs4 }));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS  (${((Date.now() - T0) / 1000).toFixed(1)}s)`);
process.exit(bad ? 1 : 0);
