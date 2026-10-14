// UI 포커스 이동: 키보드(방향키·Enter·Esc)와 게임패드로 타이틀·선택지·휴대폰 메뉴·키패드 등을 조작한다.
// 입력 방식(body.mode-touch|key|pad)에 따라 화면 조작 버튼·포커스 표시·버튼 안내를 바꾼다.
const FOCUS = 'nav-focus';
const MOVE = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0] };
const ACT = ['Space', 'Enter', 'NumpadEnter', 'KeyZ', 'KeyE'];
const BACK = ['Escape', 'Backspace', 'KeyX', 'KeyM', 'Tab'];
const SELF_KEYS = '.dialog-layer, .qte-layer'; // 자체 키 처리(대사 넘기기·연타)

let root = null;
const lastFocus = new WeakMap(); // 레이어별 마지막 포커스: 위에 열린 화면(휴대폰 → 지도·문서)을 닫으면 그 자리로 돌아간다
let mode = 'touch';

const top = () => [...root.querySelectorAll(':scope > .layer')].pop() || null;
const focusables = L => [...L.querySelectorAll('button:not(:disabled)')].filter(e => e.getClientRects().length);
const current = L => { const e = L.querySelector('.' + FOCUS); return e && !e.disabled && e.getClientRects().length ? e : null; };

function focus(el) {
  root.querySelector('.' + FOCUS)?.classList.remove(FOCUS);
  el.classList.add(FOCUS);
  lastFocus.set(el.closest('.layer'), el);
  el.scrollIntoView?.({ block: 'nearest' });
}

// 키보드·패드로 바꾸는 순간 포커스를 보여 준다. 처음 누른 입력은 포커스 표시만 하고 실행하지 않도록 true 반환
export function setMode(m) {
  if (m === mode) return false;
  const was = mode;
  mode = m;
  document.body.classList.remove('mode-touch', 'mode-key', 'mode-pad');
  document.body.classList.add('mode-' + m);
  if (m === 'touch') { root.querySelector('.' + FOCUS)?.classList.remove(FOCUS); return false; }
  return was === 'touch' && autoFocus();
}
export const getMode = () => mode;

function autoFocus() {
  const L = top();
  if (!L || current(L)) return false;
  const list = focusables(L);
  if (!list.length) return false;
  const prev = lastFocus.get(L);
  focus(list.includes(prev) ? prev : list[0]);
  return true;
}

function press(el) {
  const r = el.getBoundingClientRect();
  const o = { bubbles: true, cancelable: true, pointerId: 99, isPrimary: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
  el.dispatchEvent(new PointerEvent('pointerdown', o));
  el.dispatchEvent(new PointerEvent('pointerup', o));
}

export const nav = {
  open: () => !!top(),
  is: sel => !!top()?.matches(sel),

  // 가장 가까운 방향의 버튼으로 (진행 방향 거리 + 옆 방향 거리×2 가 가장 작은 것).
  // 위아래에 버튼이 없으면 스크롤 영역(긴 문서 등)을 굴린다
  move(dx, dy) {
    const L = top();
    if (!L) return;
    const list = focusables(L);
    const cur = current(L);
    if (!cur) { if (list.length) focus(list[0]); return; }
    const c = cur.getBoundingClientRect();
    const ax = c.x + c.width / 2, ay = c.y + c.height / 2;
    let best = null, bs = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect();
      const vx = r.x + r.width / 2 - ax, vy = r.y + r.height / 2 - ay;
      const along = vx * dx + vy * dy;
      if (along <= 1) continue;
      const s = along + Math.abs(vx * dy + vy * dx) * 2;
      if (s < bs) { bs = s; best = el; }
    }
    if (best) focus(best);
    else if (dy) L.querySelector('.scroll')?.scrollBy({ top: dy * 120, behavior: 'smooth' });
  },

  // 포커스된 버튼 실행. 버튼이 없는 화면(대사·연타·CG)은 화면 탭과 같다
  activate() {
    const L = top();
    if (!L) return;
    const list = focusables(L);
    if (!list.length || L.matches(SELF_KEYS)) return press(L);
    const cur = current(L);
    if (cur) press(cur); else focus(list[0]);
  },

  // 뒤로/닫기/취소 버튼(data-back)
  cancel() {
    const b = top()?.querySelector('[data-back]:not(:disabled)');
    if (b) press(b);
  },
};

export function installNav(uiRoot) {
  root = uiRoot;
  document.body.classList.add('mode-touch');
  addEventListener('pointerdown', e => { if (e.isTrusted) setMode('touch'); }, true);
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const revealed = setMode('key');
    const L = top();
    if (!L || L.matches(SELF_KEYS)) return;
    const dir = MOVE[e.code];
    const back = BACK.includes(e.code) || (e.code === 'KeyQ' && L.matches('.map-layer')); // Q(지도 키)는 지도만 닫는다
    if (!dir && !ACT.includes(e.code) && !back) return;
    e.preventDefault();
    e.stopPropagation(); // 게임 입력(조사·메뉴·이동)으로 넘어가지 않게
    if (revealed) return;
    if (dir) nav.move(...dir);
    else if (e.repeat) return;
    else if (ACT.includes(e.code)) nav.activate();
    else nav.cancel();
  }, true);
  // 키보드·패드 사용 중에 새 화면이 열리면 첫 버튼에 포커스
  new MutationObserver(() => { if (mode !== 'touch') autoFocus(); }).observe(root, { childList: true, subtree: true });
}
