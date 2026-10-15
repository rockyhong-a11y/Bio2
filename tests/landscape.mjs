// 가로 화면: 안내·일시정지 없이 그대로 플레이. 캐릭터 크기는 세로와 같고(짧은 변 기준) 옆으로 넓게 보인다.
// 휴대폰을 돌리면(뷰포트 회전) 바로 맞춰지고, 대사·메뉴·지도·키패드·피아노·문서·저장·CG·연타·타이틀이 화면 안에 들어온다.
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const { browser, ctx, page, errors } = await openMobile();
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const portrait = page.viewportSize();
// 가로 화면 두 가지: 전체 화면(홈 화면 앱) 844×390, 사파리 주소창·툴바가 있는 750×340
const land = { width: 844, height: 390 }, safari = { width: 750, height: 340 };
// 화면 밖으로 나간 요소(선택자별) — 스크롤 영역 안에 있는 것은 그 영역이 화면 안이면 통과
const outside = sels => page.evaluate(sels => {
  const W = innerWidth, H = innerHeight, bad = [];
  for (const s of sels) {
    const els = [...document.querySelectorAll(s)];
    if (!els.length) bad.push(`${s}: 없음`);
    for (const e of els) {
      const sc = e.closest('.scroll, .choice, .save, .keypad');
      const r = (sc && sc !== e && sc.scrollHeight > sc.clientHeight + 1 ? sc : e).getBoundingClientRect();
      if (r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1 || r.width < 1) bad.push(`${s} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.right)},${Math.round(r.bottom)}`);
    }
  }
  if (document.documentElement.scrollWidth > W + 1) bad.push(`가로 스크롤 ${document.documentElement.scrollWidth}`);
  return bad;
}, sels);
const overlap = sels => page.evaluate(sels => {
  const rs = sels.map(s => [s, document.querySelector(s).getBoundingClientRect()]);
  const hit = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const [a, A] = rs[i], [b, B] = rs[j];
    if (A.left < B.right && B.left < A.right && A.top < B.bottom && B.top < A.bottom) hit.push(`${a}×${b}`);
  }
  return hit;
}, sels);

// 1) 타이틀·챕터 선택(가로)
await page.setViewportSize(land);
await page.waitForSelector('.title-btn');
await page.waitForTimeout(400);
let bad = await outside(['.title-main', '.title-btn']);
check('가로: 타이틀 버튼이 화면 안', !bad.length, bad.join(' | '));
await page.locator('.title-btn', { hasText: '챕터 선택' }).dispatchEvent('pointerdown');
await page.waitForSelector('.chapter-btn');
await page.waitForTimeout(250);
bad = await outside(['.chapter-btn']);
check('가로: 챕터 선택 버튼이 화면 안(또는 스크롤)', !bad.length, bad.join(' | '));
// 아주 낮은 가로 화면(안드로이드 주소창이 있는 800×280): 목록이 잘리면 손가락으로 끌어 스크롤
await page.setViewportSize({ width: 800, height: 280 });
await page.waitForTimeout(300);
const box = () => page.evaluate(() => {
  const b = document.querySelector('.chapter-layer .save'), c = b.querySelector('.btn-close').getBoundingClientRect(), r = b.getBoundingClientRect();
  return { st: Math.round(b.scrollTop), over: b.scrollHeight - b.clientHeight, backBottom: Math.round(c.bottom), boxBottom: Math.round(r.bottom) };
});
const b0 = await box();
const tr = await page.evaluate(() => { const r = document.querySelector('.chapter-layer .save-title').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await touch('touchStart', tr[0], tr[1]);
for (let i = 1; i <= 8; i++) { await touch('touchMove', tr[0], tr[1] - i * 12); await page.waitForTimeout(16); }
await touch('touchEnd');
await page.waitForTimeout(400);
const b1 = await box();
check('낮은 가로(800×280): 잘린 챕터 목록을 끌어 스크롤 → 돌아가기 버튼이 다 보임', b0.over > 0 && b1.st > 0 && b1.backBottom <= b1.boxBottom + 1, JSON.stringify({ b0, b1 }));
check('끌어 스크롤해도 챕터가 저절로 시작되지 않음', (await page.locator('.chapter-layer').count()) === 1 && (await page.locator('.title-layer').count()) === 1);
await page.setViewportSize(land);
await page.waitForTimeout(300);
await page.locator('.chapter-layer .btn-close').dispatchEvent('pointerdown');
await page.waitForTimeout(300);
check('챕터 선택 닫힘', (await page.locator('.chapter-layer').count()) === 0);
await page.setViewportSize(portrait);
await page.waitForTimeout(200);
await page.locator('.title-btn').first().dispatchEvent('pointerdown');
await skipDialogs(page);

// 2) 게임 화면: 세로에서 시작 → 돌리기
const view = () => page.evaluate(() => {
  const g = __game, c = g.canvas;
  return { scale: g.scale, w: g.cam.w, h: g.cam.h, cw: c.width, ch: c.height, iw: innerWidth * Math.min(2, devicePixelRatio), ih: innerHeight * Math.min(2, devicePixelRatio), r: innerWidth / innerHeight, paused: g.paused, t: g.t };
});
await page.evaluate(() => { __game.player.x = 20.5; __game.player.y = 10.5; });
const P = await view();
await page.setViewportSize(land);
await page.waitForTimeout(500);
const Lv = await view();
check('돌리면 캔버스가 가로 화면 크기로', Math.abs(Lv.cw - Lv.iw) < 2 && Math.abs(Lv.ch - Lv.ih) < 2 && Lv.cw > Lv.ch, JSON.stringify(Lv));
check('가로: 캐릭터 크기는 세로와 같음(짧은 변 기준 배율)', Math.abs(Lv.scale - P.scale) < 0.01, `${P.scale.toFixed(3)} / ${Lv.scale.toFixed(3)}`);
check('가로: 옆으로 넓게(보이는 높이 = 세로의 폭, 폭은 화면 비율만큼)', Math.abs(Lv.h - P.w) < 1 && Math.abs(Lv.w / Lv.h - Lv.r) < 0.01 && Lv.w > P.w * 2, `세로 ${P.w.toFixed(0)}×${P.h.toFixed(0)} → 가로 ${Lv.w.toFixed(0)}×${Lv.h.toFixed(0)}`);
await page.waitForTimeout(700);
const Lv2 = await view();
check('가로: 일시정지 없이 계속 진행', !Lv2.paused && Lv2.t > Lv.t, `${Lv.t.toFixed(2)} → ${Lv2.t.toFixed(2)}`);
check('가로: 세로 전환 안내 없음', (await page.locator('#rotate').count()) === 0);
const center = await page.evaluate(async () => {
  const g = __game; g.player.x = 20.5; g.player.y = 10.5;
  await new Promise(r => setTimeout(r, 1200));
  return { x: Math.abs(g.player.x * 32 - g.cam.x - g.cam.w / 2), y: Math.abs(g.player.y * 24 - g.cam.y - g.cam.h / 2) };
});
check('가로: 플레이어가 화면 가운데(위아래도)', center.x < 3 && center.y < 3, JSON.stringify(center));
const moved = await page.evaluate(async () => {
  const g = __game, I = __input; g.player.x = 20.5; g.player.y = 10.5;
  I.x = 1; await new Promise(r => setTimeout(r, 400)); I.x = 0;
  return g.player.x - 20.5;
});
check('가로: 이동 가능', moved > 0.5, moved.toFixed(2));

// 3) 버추얼 패드 버튼: 화면 안, 서로 안 겹침
await page.touchscreen.tap(600, 200);
await page.waitForTimeout(300);
await page.evaluate(() => { if (!__game.has('lighter')) __game.inv.push('lighter'); __game.ui.refreshHud(__game); });
const BTN = ['.btn-a', '.btn-l', '.btn-menu', '.btn-map'];
bad = await outside([...BTN, '.hud-loc']);
check('가로: 조작 버튼·HUD가 화면 안', !bad.length, bad.join(' | '));
const ov = await overlap(BTN);
check('가로: 조작 버튼끼리 안 겹침', !ov.length, ov.join(' '));
// 여러 가로 크기 + 노치·홈 바 안전 영역(아래 21px, 좌우 47px): 버튼이 화면 안, 버튼·HUD끼리 안 겹침
for (const [w, h, sb, sx] of [[750, 340, 21, 0], [667, 325, 21, 0], [844, 390, 21, 47], [932, 430, 21, 47], [780, 304, 0, 0], [780, 280, 0, 0], [780, 240, 0, 0]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate(([sb, sx]) => { const r = document.documentElement.style; r.setProperty('--safe-bottom', sb + 'px'); r.setProperty('--safe-left', sx + 'px'); r.setProperty('--safe-right', sx + 'px'); }, [sb, sx]);
  await page.waitForTimeout(250);
  const out = await outside(BTN), hit = await overlap([...BTN, '.hud']);
  check(`가로 ${w}×${h}(안전 영역 아래 ${sb}·좌우 ${sx}): 버튼 화면 안·버튼/HUD 안 겹침`, !out.length && !hit.length, [...out, ...hit].join(' '));
}
await page.evaluate(() => { const r = document.documentElement.style; for (const k of ['--safe-bottom', '--safe-left', '--safe-right']) r.removeProperty(k); });
await page.setViewportSize(land);
await page.waitForTimeout(300);

// 4) 화면(레이어)마다 화면 안에 들어오는지
const layers = [
  ['대사(초상화 포함)', () => { __game.ui.say('소영', '가로 화면에서 대사창과 초상화가 겹치지 않는지 확인한다. 조금 긴 대사도 두 줄 이상으로 들어가야 한다.'); }, ['.dialog', '.dialog-text']],
  ['선택지', () => { __game.ui.choice('어떻게 할까?', ['첫 번째 선택지', '두 번째 선택지', '세 번째 선택지', '네 번째 선택지']); }, ['.choice', '.choice-opt']],
  ['휴대폰 메뉴', () => { __game.ui.openMenu(__game); }, ['.phone', '.phone-app', '.menu-layer .btn-close']],
  ['지도', () => { __game.ui.openMap(__game); }, ['.map', '.map .btn-close']],
  ['키패드', () => { __game.ui.keypad('비밀번호', 4); }, ['.keypad', '.key']],
  ['피아노', () => { __game.ui.piano('피아노', 5, '계이름', () => {}); }, ['.piano-key']],
  ['문서', () => { __game.ui.doc(__game.docOf('magazine')); }, ['.doc', '.doc .btn-close']],
  ['저장', () => { __game.ui.saveMenu(__game); }, ['.save', '.save-slot']],
  ['연타', () => { __game.ui.qte('연타!', 8, 4); }, ['.qte-btn']],
];
const fitLayers = async (vp, tag) => {
  await page.setViewportSize(vp);
  await page.waitForTimeout(400);
  for (const [name, open, sels] of layers) {
    await page.evaluate(`(${open})()`);
    await page.waitForTimeout(450);
    const bad = await outside(sels);
    check(`${tag}: ${name} 화면 안`, !bad.length, bad.slice(0, 4).join(' | '));
    if (name.startsWith('대사')) {
      await page.waitForFunction(() => document.querySelector('.portrait')?.getBoundingClientRect().width > 0, null, { timeout: 3000 }).catch(() => {});
      const o = await page.evaluate(() => {
        const d = document.querySelector('.dialog').getBoundingClientRect(), p = document.querySelector('.portrait')?.getBoundingClientRect();
        return { d: Math.round(d.right), p: p && Math.round(p.left), pw: p && Math.round(p.width) };
      });
      check(`${tag}: 대사창이 초상화와 안 겹침`, o.pw > 0 && o.d <= o.p + 12, JSON.stringify(o));
    }
    await page.evaluate(() => __game.ui.clear());
    await page.waitForTimeout(100);
  }
  await page.evaluate(() => { __game.ui.cg('cg_prologue', '가로 화면 CG'); });
  await page.waitForSelector('.cg-img');
  await page.waitForFunction(() => document.querySelector('.cg-img').complete);
  await page.waitForTimeout(300);
  const bad = await outside(['.cg-img', '.cg-cap']);
  check(`${tag}: CG 화면 안`, !bad.length, bad.join(' | '));
  await page.evaluate(() => __game.ui.clear());
};
await fitLayers(land, '가로 844×390');
await fitLayers(safari, '가로 750×340(사파리)');

// 5) 다시 세로로
await page.setViewportSize(portrait);
await page.waitForTimeout(500);
const P2 = await view();
check('세로로 되돌리면 원래 화면', Math.abs(P2.scale - P.scale) < 0.01 && Math.abs(P2.w - P.w) < 1 && P2.ch > P2.cw && !P2.paused, JSON.stringify(P2));
bad = await outside(BTN);
check('세로: 조작 버튼 화면 안', !bad.length, bad.join(' | '));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const nbad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - nbad}/${results.length} PASS`);
process.exit(nbad ? 1 : 0);
