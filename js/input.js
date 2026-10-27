// 입력: 조작 방식(설정 controls) + 키보드. 게임패드는 gamepad.js, 화면(대사·메뉴) 안의 키보드·패드 포커스 이동은 nav.js
//   버추얼 패드: 왼쪽 아래 드래그 = 조이스틱, 오른쪽 아래 조사·라이터 버튼, 오른쪽 위 휴대폰·지도 버튼(반투명, 누르는 동안만 진하게)
//   터치: 버튼 없이 화면 어디든 — 드래그 = 조이스틱, 탭 = 조사(0.3초 뒤: 더블·트리플 탭과 구분), 더블 탭 = 지도,
//         트리플 탭 = 라이터, 길게 누르기(0.6초) = 휴대폰
//   달리기: 조이스틱(스틱)을 끝까지 밀면 달리기, 살짝 밀면 걷기 — 키보드 방향키는 늘 끝까지(달리기). 판정은 actors.js Player
import { ICON } from './icons.js';
import { settings } from './settings.js';

const RADIUS = 52; // css px
const DEAD = 0.18;
const TAP_MOVE = 12;  // 이만큼(css px) 움직이면 탭이 아니라 드래그
const TAP_GAP = 300;  // 손을 뗀 뒤 다음 탭(손가락 닿기)을 기다리는 시간(ms): 한 번 = 조사, 두 번 = 지도, 세 번 = 라이터
const LONG = 600;     // 길게 누르기 = 휴대폰

export const input = {
  x: 0, y: 0,          // 이동 벡터 (길이 0..1: 스틱을 민 정도)
  pressed: new Set(),  // 이번 프레임에 눌린 버튼: 'action' | 'menu' | 'map' | 'lighter' | 'walk'
  walk: false,         // 걷기 고정(키보드 Shift·패드 RB로 켜고 끔): 끝까지 밀어도 걷는다
  enabled: true,
  consume(name) { return this.pressed.delete(name); },
  endFrame() { this.pressed.clear(); },
};

const keys = new Set();
let ctlRoot = null;

function el(tag, cls, parent) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  parent.appendChild(e);
  return e;
}

// 설정의 조작 방식을 화면에 반영(옵션에서 바꾸면 바로)
export function applyControls() {
  ctlRoot?.classList.toggle('ctl-touch', settings.controls === 'touch');
  ctlRoot?.classList.toggle('ctl-pad', settings.controls !== 'touch');
  ctlRoot?.classList.toggle('no-hints', !settings.hints); // 조작 도움말 끄기 — 버튼은 그대로 두고 안내 글자만 숨긴다
}

export function installInput(root) {
  ctlRoot = root;
  const pad = el('div', 'pad-zone', root);
  const base = el('div', 'pad-base', root);
  const knob = el('div', 'pad-knob', base);
  const btnA = el('div', 'btn btn-a', root); btnA.textContent = '조사';
  const btnMenu = el('div', 'btn-menu', root);
  btnMenu.innerHTML = `${ICON.phone}<b class="k-key">Esc</b><b class="k-pad">Y</b>`;
  const btnMap = el('div', 'btn-map', root);
  btnMap.innerHTML = `${ICON.map}<b class="k-key">Q</b><b class="k-pad">Back</b>`;
  const btnL = el('div', 'btn btn-l hidden', root);
  btnL.innerHTML = '<img src="assets/sprites/items/item_lighter.png" alt="" draggable="false">'; // 라이터 그림(아이템 아이콘)
  // 조작 도움말: 지금 쓰는 입력 방식에 맞는 한 줄만 보인다(body.mode-* + ctl-*). 옵션으로 끌 수 있다
  const hints = el('div', 'hints', root);
  hints.innerHTML = '<span class="k-key">Z 조사<i class="hint-l"> · L 라이터</i> · Q 지도 · Esc 휴대폰 · Shift 걷기</span>'
    + '<span class="k-pad">Ⓐ 조사<i class="hint-l"> · Ⓧ 라이터</i> · Back 지도 · Ⓨ 휴대폰 · RB 걷기</span>'
    + '<span class="k-touch">끌어 이동 · 탭 조사 · 두 번 탭 지도<i class="hint-l"> · 세 번 탭 라이터</i> · 길게 휴대폰</span>'
    + '<span class="k-vpad">왼쪽 아래를 끌어 이동 · 끝까지 밀면 달리기</span>';
  applyControls();

  // ---- 조이스틱(버추얼 패드: 왼쪽 아래 영역 / 터치: 화면 전체, 손가락이 움직여야 시작)
  let padId = null, ox = 0, oy = 0, dragging = false, longT = null, longFired = false;
  let taps = 0, tapT = null;
  // 대사·메뉴를 닫던 연타의 남은 탭이 조사·지도·라이터가 되지 않게: 화면(레이어)을 누른 손가락을 뗀 뒤 0.4초 안에 닿은 탭은 무시.
  // 무시한 탭을 뗄 때마다 다시 0.4초(연타가 이어지는 동안 계속). 드래그·길게 누르기는 연타가 아니므로 늘리지 않는다
  let uiTap = -1e9, uiPid = null, skip = false;
  addEventListener('pointerdown', e => { if (e.target.closest?.('.layer')) { uiTap = e.timeStamp; uiPid = e.pointerId; } }, true);
  for (const t of ['pointerup', 'pointercancel']) addEventListener(t, e => { if (e.pointerId === uiPid) { uiTap = e.timeStamp; uiPid = null; } }, true);
  const touchMode = () => settings.controls === 'touch';
  const restBase = () => { base.classList.remove('active'); knob.style.transform = ''; };
  const startStick = () => { dragging = true; base.style.left = ox + 'px'; base.style.top = oy + 'px'; base.classList.add('active'); };
  const fire = name => input.pressed.add(name);
  // 기다리던 탭 확정(1 = 조사, 2 = 지도). 다음 손가락이 드래그·길게 누르기가 되면 그 전에 확정
  const flushTaps = () => { clearTimeout(tapT); if (taps) fire(taps === 1 ? 'action' : 'map'); taps = 0; };

  pad.addEventListener('pointerdown', e => {
    if (padId !== null) return;
    padId = e.pointerId;
    pad.setPointerCapture(e.pointerId);
    ox = e.clientX; oy = e.clientY;
    dragging = false; longFired = false;
    if (!touchMode()) { startStick(); return; }
    skip = e.timeStamp - uiTap < 400;
    clearTimeout(tapT); // 다음 탭이 시작됨: 이 손가락이 탭인지 볼 때까지 확정 보류
    clearTimeout(longT);
    longT = setTimeout(() => { if (padId !== null && !dragging) { longFired = true; flushTaps(); fire('menu'); } }, LONG);
  });
  pad.addEventListener('pointermove', e => {
    if (e.pointerId !== padId) return;
    let dx = e.clientX - ox, dy = e.clientY - oy;
    const d = Math.hypot(dx, dy);
    if (!dragging) {
      if (longFired || d < TAP_MOVE) return;
      clearTimeout(longT);
      flushTaps();
      startStick();
    }
    if (d > RADIUS) { dx *= RADIUS / d; dy *= RADIUS / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const m = Math.min(d, RADIUS) / RADIUS;
    if (m < DEAD) { input.x = input.y = 0; return; }
    input.x = dx / RADIUS; input.y = dy / RADIUS;
  });
  const padUp = e => {
    if (e.pointerId !== padId) return;
    padId = null; input.x = input.y = 0; restBase();
    syncKeys(); // 손을 떼도 아직 누르고 있는 방향키로 계속 이동
    clearTimeout(longT);
    if (!touchMode() || dragging || longFired) return;
    if (e.type === 'pointercancel') { flushTaps(); return; }
    if (skip) { uiTap = e.timeStamp; return; }
    // 탭: 세 번째면 바로 라이터, 아니면 다음 탭을 잠깐 기다렸다가 조사(1)·지도(2)
    taps++;
    if (taps >= 3) { taps = 0; fire('lighter'); return; }
    tapT = setTimeout(flushTaps, TAP_GAP);
  };
  pad.addEventListener('pointerup', padUp);
  pad.addEventListener('pointercancel', padUp);

  // 버튼: 누르는 동안 진하게(.down)
  for (const b of [btnA, btnMenu, btnMap, btnL]) {
    b.addEventListener('pointerdown', () => b.classList.add('down'));
    for (const t of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(t, () => b.classList.remove('down'));
  }
  // 조사·라이터 버튼도 대사를 닫던 연타의 남은 탭은 무시(버추얼 패드: 대사창이 조사 버튼 위에 겹친다)
  for (const [b, name] of [[btnA, 'action'], [btnL, 'lighter']]) {
    let stray = false;
    b.addEventListener('pointerdown', e => { stray = e.timeStamp - uiTap < 400; if (!stray) fire(name); });
    b.addEventListener('pointerup', e => { if (stray) uiTap = e.timeStamp; stray = false; });
  }
  btnMenu.addEventListener('pointerdown', () => fire('menu'));
  btnMap.addEventListener('pointerdown', () => fire('map'));

  // e.code 기준: 한글 입력 상태(ㅈ/ㅁ…)에서도 같은 물리 키로 동작
  addEventListener('keydown', e => {
    const k = e.code;
    if (e.repeat) return;
    keys.add(k);
    if (['Space', 'Enter', 'NumpadEnter', 'KeyZ', 'KeyE'].includes(k)) fire('action');
    if (['Escape', 'KeyM', 'Tab'].includes(k)) { fire('menu'); e.preventDefault(); }
    if (['KeyL', 'KeyF'].includes(k)) fire('lighter');
    if (k === 'KeyQ') fire('map');
    if (k === 'ShiftLeft' || k === 'ShiftRight') fire('walk');
    syncKeys();
  });
  addEventListener('keyup', e => { keys.delete(e.code); syncKeys(); });
  addEventListener('blur', () => { keys.clear(); input.x = input.y = 0; });

  function syncKeys() {
    if (padId !== null) return;
    const h = (keys.has('ArrowRight') || keys.has('KeyD')) - (keys.has('ArrowLeft') || keys.has('KeyA'));
    const v = (keys.has('ArrowDown') || keys.has('KeyS')) - (keys.has('ArrowUp') || keys.has('KeyW'));
    const n = Math.hypot(h, v) || 1;
    input.x = h / n; input.y = v / n;
  }

  return { setVisible(v) { root.classList.toggle('hidden', !v); } };
}
