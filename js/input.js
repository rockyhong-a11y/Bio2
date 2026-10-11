// 입력: 왼쪽 하단 가상 조이스틱 + 오른쪽 하단 조사(A)/달리기(B) 버튼 + 키보드(데스크톱 테스트용)
// UI 디자인은 참조 스크린샷 수령 전 임시 배치.

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
  const btnB = el('div', 'btn btn-b', root); btnB.textContent = '달리기';
  const btnMenu = el('div', 'btn-menu', root); btnMenu.textContent = '☰';
  const btnL = el('div', 'btn btn-l hidden', root); btnL.textContent = '라이터';

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
  const runOff = () => { input.run = keys.has('shift'); btnB.classList.remove('on'); };
  btnB.addEventListener('pointerup', runOff);
  btnB.addEventListener('pointercancel', runOff);
  btnMenu.addEventListener('pointerdown', () => input.pressed.add('menu'));
  btnL.addEventListener('pointerdown', () => input.pressed.add('lighter'));

  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.repeat) return;
    keys.add(k);
    if ([' ', 'enter', 'z', 'e'].includes(k)) input.pressed.add('action');
    if (['escape', 'm', 'tab'].includes(k)) { input.pressed.add('menu'); e.preventDefault(); }
    if (k === 'shift' || k === 'x') input.run = true;
    if (k === 'l' || k === 'f') input.pressed.add('lighter');
    syncKeys();
  });
  addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    keys.delete(k);
    if (k === 'shift' || k === 'x') input.run = false;
    syncKeys();
  });
  addEventListener('blur', () => { keys.clear(); input.x = input.y = 0; input.run = false; });

  function syncKeys() {
    if (padId !== null) return;
    const h = (keys.has('arrowright') || keys.has('d')) - (keys.has('arrowleft') || keys.has('a'));
    const v = (keys.has('arrowdown') || keys.has('s')) - (keys.has('arrowup') || keys.has('w'));
    const n = Math.hypot(h, v) || 1;
    input.x = h / n; input.y = v / n;
  }

  return { setVisible(v) { root.classList.toggle('hidden', !v); } };
}
