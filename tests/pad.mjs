// 요구사항 검증: 모바일/PC 게임패드 + 키보드 조작
// 가짜 게임패드(표준 매핑)를 navigator.getGamepads로 주입해 실제 폴링 경로(gamepad.js → nav.js/input)로 조작한다.
import { openMobile } from './helpers.mjs';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const fakePad = () => {
  const pad = { id: 'QA pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  window.__pad = pad;
  navigator.getGamepads = () => [pad, null, null, null];
};
const { browser, page, errors } = await openMobile({ init: fakePad });
const A = 0, B = 1, X = 2, Y = 3, START = 9, UP = 12, DOWN = 13, LEFT = 14, RIGHT = 15;
const btn = async (i, ms = 110) => {
  await page.evaluate(i => { __pad.buttons[i].pressed = true; }, i);
  await page.waitForTimeout(ms);
  await page.evaluate(i => { __pad.buttons[i].pressed = false; }, i);
  await page.waitForTimeout(ms);
};
const hold = (i, v) => page.evaluate(([i, v]) => { __pad.buttons[i].pressed = v; }, [i, v]);
const stick = (x, y) => page.evaluate(([x, y]) => { __pad.axes[0] = x; __pad.axes[1] = y; }, [x, y]);
const focused = () => page.evaluate(() => document.querySelector('.nav-focus')?.textContent.trim() || null);
const mode = () => page.evaluate(() => document.body.className.match(/mode-(\w+)/)?.[1]);
const free = () => page.evaluate(() => !__game.busy && !__game.ui.modalCount);
const visible = sel => page.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, sel);

await page.waitForSelector('.title-btn');
await page.waitForTimeout(300);

// 1) 타이틀: 첫 A는 포커스 표시만, 두 번째 A로 '새 게임'
check('시작 시 터치 모드', (await mode()) === 'touch');
await btn(A);
check('패드 입력 → 패드 모드 + 첫 버튼 포커스(실행 안 함)', (await mode()) === 'pad' && (await focused()) === '새 게임' && (await page.locator('.title-layer').count()) === 1, `${await mode()} / ${await focused()}`);
check('패드 모드에서 화면 조작 버튼 숨김', !(await visible('.btn-a')) && !(await visible('.pad-zone')) && (await visible('.btn-menu')));
await btn(A);
check('A로 새 게임 시작', (await page.locator('.title-layer').count()) === 0);

// 2) 프롤로그: A로 대사 넘기기
for (let i = 0; i < 80 && !(await free()); i++) await btn(A, 90);
check('A로 프롤로그 대사 끝까지 넘기기', await free());

// 3) 이동·달리기
const y0 = await page.evaluate(() => __game.player.y);
await stick(0, -1);
await page.waitForTimeout(700);
await stick(0, 0);
await page.waitForTimeout(100);
const y1 = await page.evaluate(() => __game.player.y);
check('왼쪽 스틱으로 이동, 놓으면 정지', y1 < y0 - 0.5 && (await page.evaluate(() => __input.x === 0 && __input.y === 0)), `${y0.toFixed(2)} → ${y1.toFixed(2)}`);
await hold(B, true);
await page.waitForTimeout(100);
const running = await page.evaluate(() => __input.run);
await hold(B, false);
await page.waitForTimeout(100);
check('B 누르고 있으면 달리기, 떼면 해제', running && !(await page.evaluate(() => __input.run)));

// 4) 휴대폰 메뉴: Y 열기 → 방향패드 이동 → A 실행 → B 뒤로 → B 닫기
await btn(Y);
check('Y로 휴대폰 메뉴 열림 + 첫 앱 포커스', (await page.locator('.menu-layer').count()) === 1 && (await focused()) === '소지품', String(await focused()));
await btn(RIGHT);
check('방향패드 → 로 다음 앱', (await focused()) === '문서', String(await focused()));
await btn(DOWN);
check('방향패드 ↓ 로 아래 앱', (await focused()) === '저장', String(await focused())); // 소지품 문서 지도 / 목표 저장 옵션 / 종료
await btn(LEFT); await btn(UP);
await btn(A);
check('A로 앱 실행(소지품)', (await page.locator('.phone-title').textContent()) === '소지품');
await btn(B);
check('B로 뒤로(메뉴 홈)', (await page.locator('.phone-title').textContent()) === 'MENU');
await btn(B);
await page.waitForTimeout(150);
check('B로 휴대폰 닫기(다시 열리지 않음)', (await page.locator('.menu-layer').count()) === 0);
await btn(START);
check('Start로도 메뉴 열림', (await page.locator('.menu-layer').count()) === 1);
await btn(START);
check('Start로 메뉴 닫힘', (await page.locator('.menu-layer').count()) === 0);

// 5) 선택지·키패드·연타
await page.evaluate(() => { window.__pick = 'wait'; __game.ui.choice('q', ['가', '나', '다']).then(i => (window.__pick = i)); });
await page.waitForTimeout(250);
await btn(DOWN); await btn(DOWN); await btn(UP);
await btn(A);
check('선택지: 방향패드로 고르고 A로 결정', (await page.evaluate(() => window.__pick)) === 1, String(await page.evaluate(() => window.__pick)));
await page.evaluate(() => { window.__code = 'wait'; __game.ui.keypad('t', 4).then(c => (window.__code = c)); });
await page.waitForTimeout(250);
await btn(A); await btn(RIGHT); await btn(A); await btn(DOWN); await btn(A); await btn(RIGHT); await btn(A);
await page.waitForTimeout(300);
check('키패드: 방향패드+A로 번호 입력', (await page.evaluate(() => window.__code)) === '1256', String(await page.evaluate(() => window.__code)));
await page.evaluate(() => { window.__q = 'wait'; __game.ui.qte('x', 5, 10).then(v => (window.__q = v)); });
await page.waitForTimeout(250);
for (let i = 0; i < 5; i++) await btn(A, 70);
check('연타 QTE: A 연타로 성공', (await page.evaluate(() => window.__q)) === true);
await page.evaluate(() => { window.__k = 'wait'; __game.ui.keypad('t', 4).then(c => (window.__k = c)); });
await page.waitForTimeout(250);
await btn(B);
check('키패드: B로 취소', (await page.evaluate(() => window.__k)) === null);

await page.evaluate(() => { window.__doc = 'wait'; __game.ui.doc({ title: 't', body: Array(40).fill('긴 문서 문단입니다. 패드로 스크롤해야 끝까지 읽을 수 있다.').join('\n\n') }).then(() => (window.__doc = 'closed')); });
await page.waitForTimeout(250);
await btn(DOWN); await btn(DOWN);
await page.waitForTimeout(400);
const scrolled = await page.evaluate(() => document.querySelector('.doc-body').scrollTop);
await btn(A);
check('긴 문서: 방향패드 ↓로 스크롤, A로 닫기', scrolled > 100 && (await page.evaluate(() => window.__doc)) === 'closed', `scrollTop ${scrolled}`);

// 6) 키보드: 방향키·Enter로 선택지, Esc로 메뉴 열고 닫기
await page.evaluate(() => { window.__pick = 'wait'; __game.ui.choice('q', ['가', '나']).then(i => (window.__pick = i)); });
await page.waitForTimeout(250);
await page.keyboard.press('ArrowDown');
check('키보드 입력 → 키보드 모드', (await mode()) === 'key');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(100);
check('키보드: 방향키+Enter로 선택지', (await page.evaluate(() => window.__pick)) === 1, String(await page.evaluate(() => window.__pick)));
await page.keyboard.press('Escape');
await page.waitForTimeout(300); // 열린 직후 0.2초 연타 방지 구간 이후
check('키보드: Esc로 메뉴 열림', (await page.locator('.menu-layer').count()) === 1);
await page.keyboard.press('Escape');
await page.waitForTimeout(150);
check('키보드: Esc로 메뉴 닫힘(다시 열리지 않음)', (await page.locator('.menu-layer').count()) === 0);
const ky0 = await page.evaluate(() => __game.player.y);
await page.keyboard.down('ArrowDown');
await page.waitForTimeout(500);
await page.keyboard.up('ArrowDown');
check('키보드: 방향키로 이동', (await page.evaluate(() => __game.player.y)) > ky0 + 0.3);

// 7) 다시 터치하면 화면 버튼이 돌아온다
await page.touchscreen.tap(195, 300);
await page.waitForTimeout(150);
check('터치 → 터치 모드, 화면 버튼 다시 표시', (await mode()) === 'touch' && (await visible('.btn-a')) && (await visible('.pad-zone')));

check('콘솔 오류 없음', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const bad = results.filter(r => !r.ok).length;
console.log(`\n${results.length - bad}/${results.length} PASS`);
process.exit(bad ? 1 : 0);
