// 입력: 왼쪽 하단 가상 조이스틱 + 오른쪽 하단 조사(A)/달리기(B)/라이터 버튼 + 오른쪽 위 휴대폰(메뉴) + 키보드
// 게임패드는 gamepad.js, 화면(대사·메뉴) 안의 키보드·패드 포커스 이동은 nav.js
import { ICON } from './icons.js';

const RADIUS = 52; // css px
const DEAD = 0.18;

export const input = {
  x: 0, y: 0,          // 이동 벡터 (-1..1)
  run: false,
  pressed: new Set(),  // 이번 프레임에 눌린 버튼: 'action' | 'menu' | 'back'
  enabled: true,
  consume(name) { return this.pressed.delete(name); },
  endFrame() { this.pressed.clear(); },
};

const keys = new Set();

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  parent.appendChild(e);
  return e;
}

export function installInput(root) {
  const pad = el('div', 'pad-zone', root);
  const base = el('div', 'pad-base', root);
  const knob = el('div', 'pad-knob', base);
  const btnA = el('div', 'btn btn-a', root); btnA.textContent = '조사';
  const btnB = el('div', 'btn btn-b', root); btnB.innerHTML = '<span class="run-word">달리기</span>';
  const btnMenu = el('div', 'btn-menu', root);
  btnMenu.innerHTML = `${ICON.phone}<b class="k-key">Esc</b><b class="k-pad">Y</b>`;
  const btnL = el('div', 'btn btn-l hidden', root); btnL.innerHTML = ICON.flame;
  // 키보드·게임패드 사용 중에는 화면 버튼 대신 버튼 안내 (body.mode-*)
  const hints = el('div', 'hints', root);
  hints.innerHTML = '<span class="k-key">Z 조사 · Shift <b class="run-word">달리기</b><i class="hint-l"> · L 라이터</i></span><span class="k-pad">Ⓐ 조사 · Ⓑ <b class="run-word">달리기</b><i class="hint-l"> · Ⓧ 라이터</i></span>';

  let padId = null, ox = 0, oy = 0;
  const restBase = () => { base.classList.remove('active'); knob.style.transform = ''; };

  pad.addEventListener('pointerdown', e => {
    if (padId !== null) return;
    padId = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    ox = e.clientX; oy = e.clientY;
    base.style.left = ox + 'px'; base.style.top = oy + 'px';
    base.classList.add('active');
  });
  pad.addEventListener('pointermove', e => {
    if (e.pointerId !== padId) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (d > RADIUS) { dx *= RADIUS / d; dy *= RADIUS / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const m = Math.min(d, RADIUS) / RADIUS;
    if (m < DEAD) { input.x = input.y = 0; return; }
    input.x = dx / RADIUS; input.y = dy / RADIUS;
  });
  const padUp = e => {
    if (e.pointerId !== padId) return;
    padId = null; input.x = input.y = 0; restBase();
  };
  pad.addEventListener('pointerup', padUp);
  pad.addEventListener('pointercancel', padUp);

  btnA.addEventListener('pointerdown', () => input.pressed.add('action'));
  btnB.addEventListener('pointerdown', e => { btnB.setPointerCapture(e.pointerId); input.run = true; btnB.classList.add('on'); });
  const runOff = () => { input.run = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX'); btnB.classList.remove('on'); };
  btnB.addEventListener('pointerup', runOff);
  btnB.addEventListener('pointercancel', runOff);
  btnMenu.addEventListener('pointerdown', () => input.pressed.add('menu'));
  btnL.addEventListener('pointerdown', () => input.pressed.add('lighter'));

  // e.code 기준: 한글 입력 상태(ㅈ/ㅁ…)에서도 같은 물리 키로 동작
  addEventListener('keydown', e => {
    const k = e.code;
    if (e.repeat) return;
    keys.add(k);
    if (['Space', 'Enter', 'NumpadEnter', 'KeyZ', 'KeyE'].includes(k)) input.pressed.add('action');
    if (['Escape', 'KeyM', 'Tab'].includes(k)) { input.pressed.add('menu'); e.preventDefault(); }
    if (['ShiftLeft', 'ShiftRight', 'KeyX'].includes(k)) input.run = true;
    if (['KeyL', 'KeyF'].includes(k)) input.pressed.add('lighter');
    syncKeys();
  });
  addEventListener('keyup', e => {
    const k = e.code;
    keys.delete(k);
    if (['ShiftLeft', 'ShiftRight', 'KeyX'].includes(k)) input.run = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX');
    syncKeys();
  });
  addEventListener('blur', () => { keys.clear(); input.x = input.y = 0; input.run = false; });

  function syncKeys() {
    if (padId !== null) return;
    const h = (keys.has('ArrowRight') || keys.has('KeyD')) - (keys.has('ArrowLeft') || keys.has('KeyA'));
    const v = (keys.has('ArrowDown') || keys.has('KeyS')) - (keys.has('ArrowUp') || keys.has('KeyW'));
    const n = Math.hypot(h, v) || 1;
    input.x = h / n; input.y = v / n;
  }

  return { setVisible(v) { root.classList.toggle('hidden', !v); } };
}
