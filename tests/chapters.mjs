// 타이틀 → 챕터 선택: 1~4장 목록, 아직 없는 장(4장)은 딤드·누를 수 없음(실제 터치·키보드 포커스 모두),
// 1장 → 바로 프롤로그, 2장 → 루트 선택(돌아가기 가능) → B 소영 / A 지현 동행으로 본관 2구역 1층 입구,
// 3장 → 루트 선택 → 2장을 마친 상태로 신관 1층 로비, 돌아가기 → 타이틀
import { openMobile, skipDialogs } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };
const { browser, page, errors } = await openMobile();
const wait = ms => page.waitForTimeout(ms);
// 실제 터치(화면 위치)로 누른다 — 위에 다른 화면이 덮여 있으면 그 화면이 눌린다
const tapEl = async loc => { const b = await loc.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await wait(300); };
const title = async () => { await page.waitForSelector('.title-btn'); await wait(300); };
const openChapters = async () => { await tapEl(page.locator('.title-btn', { hasText: '챕터 선택' })); await page.waitForSelector('.chapter-layer'); await wait(250); };
const state = () => page.evaluate(() => ({
  title: !!document.querySelector('.title-layer'), layers: [...document.querySelectorAll('#ui .layer')].map(l => l.className.replace('layer ', '')),
  map: __game.mapId || null, follower: __game.flags.follower || null, route: __game.flags.route || null, obj: __game.flags.objective || '',
}));

await title();
const btns = await page.locator('.title-btn').allTextContents();
check('타이틀에 챕터 선택 버튼(새 게임·이어하기 다음)', btns.join('|') === '새 게임|이어하기|챕터 선택', btns.join('|'));
await openChapters();
const list = await page.evaluate(() => [...document.querySelectorAll('.chapter-btn')].map(b => ({ text: b.textContent, disabled: b.disabled, opacity: +getComputedStyle(b).opacity })));
check('1~4장 목록', list.length === 4 && list.every((c, i) => c.text.startsWith(`제${i + 1}장`)), list.map(c => c.text).join(' / '));
check('1·2·3장은 선택 가능(밝게)', list.slice(0, 3).every(c => !c.disabled && c.opacity === 1 && !c.text.includes('준비 중')), JSON.stringify(list.slice(0, 3)));
check('4장(미구현)은 딤드 + 준비 중 + 누를 수 없음', list[3].disabled && list[3].opacity < 0.5 && list[3].text.includes('준비 중'), JSON.stringify(list[3]));
// 딤드 항목을 실제로 터치해도 아무 일 없음
await tapEl(page.locator('.chapter-btn').nth(3));
let s = await state();
check('4장 터치: 그대로 챕터 목록(게임 시작 안 함)', s.title && s.layers.includes('save-layer chapter-layer') && !s.map, JSON.stringify(s));
// 키보드: 방향키 포커스가 딤드 항목을 건너뜀
await page.keyboard.press('ArrowDown');
await wait(150);
const seen = [];
for (let i = 0; i < 8; i++) { seen.push(await page.evaluate(() => document.querySelector('.nav-focus')?.textContent || '')); await page.keyboard.press('ArrowDown'); await wait(120); }
check('키보드 포커스는 1·2·3장·돌아가기만(딤드 건너뜀)', seen.every(t => !t.includes('준비 중')) && ['제1장', '제2장', '제3장'].every(c => seen.some(t => t.startsWith(c))) && seen.some(t => t === '돌아가기'), seen.join(' > '));
// 돌아가기(Esc) → 타이틀
await page.keyboard.press('Escape');
await wait(250);
s = await state();
check('돌아가기 → 타이틀(목록 닫힘)', s.title && !s.layers.some(l => l.includes('chapter')), JSON.stringify(s.layers));

// ---------------- 1장 → 바로 프롤로그
await page.locator('body').tap({ position: { x: 5, y: 5 } }).catch(() => {}); // 터치 모드로
await openChapters();
await tapEl(page.locator('.chapter-btn').first());
await skipDialogs(page);
s = await state();
check('1장 선택 → 본관 1구역 1층 프롤로그(동행 없음)', !s.title && s.map === 'main1f' && !s.follower && s.obj.includes('2-8반'), JSON.stringify(s));

// ---------------- 연타 보호: 제2장을 빠르게 두 번 눌러도(0.25초 간격) 두 번째 탭이 막 열린 루트 화면의 버튼을 누르지 않음
await page.reload();
await title();
await openChapters();
{
  const b = await page.locator('.chapter-btn').nth(1).boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height * 0.75; // 아래쪽 절반 = 루트 버튼과 겹치는 자리
  await page.touchscreen.tap(x, y);
  await wait(250);
  await page.touchscreen.tap(x, y);
  await wait(400);
  s = await state();
  check('제2장 두 번 연타(0.25초)해도 루트가 저절로 정해지지 않음(루트 선택 화면 유지)', s.title && !s.route && !!(await page.locator('.chapter-route').count()), JSON.stringify(s));
}

// ---------------- 2장 → 루트 선택(돌아가기) → B
for (const [route, hero] of [['B', 'soyoung'], ['A', 'jihyeon']]) {
  await page.reload();
  await title();
  await openChapters();
  await tapEl(page.locator('.chapter-btn').nth(1));
  await page.waitForSelector('.chapter-route');
  await wait(550); // 루트 선택 화면은 열린 뒤 0.5초 동안 탭 무시(연타 보호)
  const routes = await page.locator('.chapter-route').allTextContents();
  if (route === 'B') {
    check('2장 선택 → 루트 선택(소영 / 성아·지현)', routes.join('|') === '소영 루트|성아·지현 루트', routes.join('|'));
    await tapEl(page.locator('.chapter-layer').last().locator('.btn-close'));
    s = await state();
    check('루트 선택에서 돌아가기 → 챕터 목록', s.layers.filter(l => l.includes('chapter')).length === 1 && !!(await page.locator('.chapter-btn').count()), JSON.stringify(s.layers));
    await tapEl(page.locator('.chapter-btn').nth(1));
    await page.waitForSelector('.chapter-route');
    await wait(550);
  await wait(550); // 루트 선택 화면은 열린 뒤 0.5초 동안 탭 무시(연타 보호)
  }
  await tapEl(page.locator('.chapter-route').nth(route === 'B' ? 0 : 1));
  await skipDialogs(page, 300);
  await wait(300);
  s = await state();
  const inv = await page.evaluate(() => ({ lighter: __game.has('lighter'), pens: __game.count('pen'), clear: __game.flags.ch1Clear, guide: __game.story.guide(__game)?.text }));
  check(`2장 ${route}루트 → 본관 2구역 1층, ${hero} 동행, 목표 표시`, !s.title && s.map === 'main2_1f' && s.follower === hero && s.route === route && s.obj.includes('신관'), JSON.stringify(s));
  check(`2장 ${route}루트: 1장을 마친 상태(라이터·사인펜 2, 2장 공략)`, inv.lighter && inv.pens === 2 && inv.clear === route && /상담실/.test(inv.guide || ''), JSON.stringify(inv));
}
// ---------------- 3장 → 루트 선택 → 신관 1층 로비(2장을 마친 상태)
for (const [route, hero] of [['B', 'soyoung'], ['A', 'jihyeon']]) {
  await page.reload();
  await title();
  await openChapters();
  await tapEl(page.locator('.chapter-btn').nth(2));
  await page.waitForSelector('.chapter-route');
  await wait(550);
  const routes = await page.locator('.chapter-route').allTextContents();
  if (route === 'B') check('3장 선택 → 루트 선택(소영 / 성아·지현)', routes.join('|') === '소영 루트|성아·지현 루트', routes.join('|'));
  await tapEl(page.locator('.chapter-route').nth(route === 'B' ? 0 : 1));
  await skipDialogs(page, 300);
  await wait(300);
  s = await state();
  const inv = await page.evaluate(() => ({ cd: __game.has('cd'), tape: __game.has('backward_tape'), lighter: __game.has('lighter'), clear: [__game.flags.ch1Clear, __game.flags.ch2Clear], seonga: !!__game.actor('seonga'), guide: __game.story.guide(__game)?.text }));
  check(`3장 ${route}루트 → 신관 1층, ${hero} 동행, 목표 표시`, !s.title && s.map === 'shingwan_1f' && s.follower === hero && s.route === route && s.obj.includes('역사관'), JSON.stringify(s));
  check(`3장 ${route}루트: 2장을 마친 상태(CD·역재생 테이프·라이터, 3장 공략)${route === 'A' ? ', 성아는 따로 감' : ''}`, inv.cd && inv.tape && inv.lighter && inv.clear.every(c => c === route) && !inv.seonga && /역사관/.test(inv.guide || ''), JSON.stringify(inv));
}
// 2장에서 바로 저장 → 이어하기도 2장으로
await page.reload();
await title();
await openChapters();
await tapEl(page.locator('.chapter-btn').nth(1));
await page.waitForSelector('.chapter-route');
await wait(550);
await tapEl(page.locator('.chapter-route').nth(1));
await skipDialogs(page, 300);
await wait(300);
await page.evaluate(() => { localStorage.setItem('wd_topview_save_v1', JSON.stringify([{ ...__game.snapshot(), label: 'test' }])); });
await page.reload();
await title();
await tapEl(page.locator('.title-btn').nth(1));
await tapEl(page.locator('.save-slot').first());
s = await state();
check('챕터 선택으로 시작한 2장도 저장·이어하기 가능(동행 복원)', s.map === 'main2_1f' && s.follower === 'jihyeon', JSON.stringify(s));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
