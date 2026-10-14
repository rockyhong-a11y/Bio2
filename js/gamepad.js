// 게임패드(표준 매핑, 모바일·PC 공통). 매 프레임 폴링.
//   게임 중: 왼쪽 스틱/방향패드 이동, A 조사, B·RB·RT 달리기(누르고 있기), X 라이터, Y·Start 휴대폰, Back(Select) 지도
//   화면이 열려 있으면: 방향 = 포커스 이동, A = 선택(대사 넘기기·연타), B·Start = 뒤로(Back은 지도만 닫기)
import { input } from './input.js';
import { nav, setMode } from './nav.js';

const DEAD = 0.35;
let prev = [];
let held = null, repeatAt = 0;
let moving = false, running = false;

export function pollGamepad(now) {
  const gp = [...(navigator.getGamepads?.() || [])].find(p => p && p.connected);
  if (!gp) return;
  const b = i => !!gp.buttons[i]?.pressed;
  const down = i => b(i) && !prev[i];
  let x = gp.axes[0] || 0, y = gp.axes[1] || 0;
  if (Math.hypot(x, y) < DEAD) x = y = 0;
  if (b(14)) x = -1; else if (b(15)) x = 1;
  if (b(12)) y = -1; else if (b(13)) y = 1;
  const revealed = (x || y || gp.buttons.some((_, i) => down(i))) && setMode('pad');

  if (nav.open()) {
    if (moving) { input.x = input.y = 0; moving = false; }
    if (running) { input.run = running = false; }
    const dir = x || y ? (Math.abs(x) > Math.abs(y) ? [Math.sign(x), 0] : [0, Math.sign(y)]) : null;
    const key = dir?.join();
    if (!key) held = null;
    else if (key !== held) { held = key; repeatAt = now + 380; if (!revealed) nav.move(...dir); }
    else if (now >= repeatAt) { repeatAt = now + 120; nav.move(...dir); }
    if (!revealed) {
      if (down(0)) nav.activate();
      if (down(1) || down(9) || (down(8) && nav.is('.map-layer'))) nav.cancel(); // Back(지도 버튼)은 지도만 닫는다
    }
  } else {
    held = null;
    if (x || y) { input.x = x; input.y = y; moving = true; }
    else if (moving) { input.x = input.y = 0; moving = false; }
    const run = b(1) || b(5) || b(7);
    if (run !== running) input.run = running = run;
    if (down(0)) input.pressed.add('action');
    if (down(2)) input.pressed.add('lighter');
    if (down(3) || down(9)) input.pressed.add('menu');
    if (down(8)) input.pressed.add('map');
  }
  prev = gp.buttons.map(p => p.pressed);
}
