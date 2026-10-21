// DOM UI (적·흑 공포 테마): 대사창(오른쪽 큰 초상화), 선택지, 토스트, 문서, 키패드, 휴대폰 메뉴(2001년 폴더폰), 전체 지도,
// 저장, 타이틀, 게임오버, 챕터 카드, CG, 연타 게이지, 컷신 레터박스.
// 닫기·취소 버튼은 data-back → 키보드 Esc·게임패드 B (nav.js)
import { hfImage, sprites } from './sprites.js';
import { input, applyControls } from './input.js';
import { ICON } from './icons.js';
import { settings, saveSettings, ZOOMS, ZOOMS_IN } from './settings.js';
import { FILTERS } from './filters.js';
import { haptic } from './haptics.js';
import { rooms, explored, drawMap, MAP_COLORS } from './mapview.js';
import { ENDINGS, endingOf, seenEndings } from '../data/endings.js';

const SAVE_KEY = 'wd_topview_save_v1';
const NOTES = ['도', '레', '미', '파', '솔', '라', '시', '도'];
const SLOTS = 3;

function h(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  parent?.appendChild(e);
  return e;
}
const back = e => { e.dataset.back = 1; return e; };

// 포인터 다운으로 즉시 반응 (모바일 click 지연/더블탭 차단 영향 없음).
// 레이어가 열린 직후 0.2초(data-guard면 그 ms) 안의 탭은 무시: 앞 대사를 넘기던 연타가 새 선택지·CG를 눌러 버리지 않게.
// 낮은 화면에서 넘쳐 스크롤되는 패널(선택지·저장/챕터 목록·키패드) 안의 손가락 터치는 손을 뗄 때 실행하고, 끌면(스크롤) 취소
function tap(el, fn) {
  let live = false, sx = 0, sy = 0;
  el.addEventListener('pointerdown', e => {
    e.stopPropagation();
    const L = el.closest('.layer');
    if (L && performance.now() - Number(L.dataset.t0 || 0) < Number(L.dataset.guard || 200)) return;
    const sc = e.pointerType === 'touch' && el.closest('.choice, .save, .keypad');
    if (sc && sc.scrollHeight > sc.clientHeight + 1) { live = true; sx = e.clientX; sy = e.clientY; return; }
    fn(e);
  });
  el.addEventListener('pointermove', e => { if (live && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) live = false; });
  el.addEventListener('pointercancel', () => { live = false; });
  el.addEventListener('pointerup', e => { if (live) { live = false; fn(e); } });
}

// 스크롤 목록 안의 항목: 손가락을 뗄 때 실행하고, 스크롤(이동·취소)이면 무시
function tapScroll(el, fn) {
  let sx = 0, sy = 0, live = false;
  el.addEventListener('pointerdown', e => { e.stopPropagation(); sx = e.clientX; sy = e.clientY; live = true; });
  el.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 8) live = false; });
  el.addEventListener('pointercancel', () => { live = false; });
  el.addEventListener('pointerup', e => { if (live) { live = false; fn(e); } });
}

// 키보드: 한글 입력 상태에서도 동작하도록 e.code 기준
const ADVANCE = ['Space', 'Enter', 'NumpadEnter', 'KeyZ', 'KeyE'];

export function loadSaves() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch { return []; }
}
function writeSaves(arr) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(arr)); return true; } catch { return false; }
}

export class UI {
  constructor(root, story) {
    this.root = root;
    this.story = story;
    this.modalCount = 0;
    this.deadlines = new Set(); // 일시정지(앱 전환·가로 화면) 시 멈추는 제한시간
    this.paused = false;
    this.hud = h('div', 'hud', root);
    this.hp = h('div', 'hud-hp', this.hud);
    this.hp.innerHTML = ICON.bolt;
    this.hpSegs = Array.from({ length: 10 }, () => h('i', null, this.hp)); // 1칸 = 체력 10
    this.loc = h('div', 'hud-loc', this.hud);
    this.obj = h('div', 'hud-obj', this.hud);
    this.cinemaEl = h('div', 'cinema', root);
    this.picCache = new Map();
    this.timerEl = h('div', 'hud-timer hidden', root);
    this.dangerEl = h('div', 'danger', root);
    this.hurtEl = h('div', 'hurt', root);
    this.toastWrap = h('div', 'toasts', root);
    this.fadeEl = h('div', 'fade', root);
    this.controls = h('div', 'controls', root);
  }

  get modal() { return this.modalCount > 0; }

  layer(cls) {
    const el = h('div', 'layer ' + cls, this.root);
    el.dataset.t0 = performance.now();
    this.modalCount++;
    input.x = input.y = 0;
    return { el, close: () => { el.remove(); this.modalCount = Math.max(0, this.modalCount - 1); } };
  }

  // 일시정지 가능한 제한시간
  deadline(ms, fn) {
    const d = { left: ms, id: null, start: 0 };
    const arm = () => { d.start = performance.now(); d.id = setTimeout(() => { this.deadlines.delete(d); fn(); }, d.left); };
    d.pause = () => { clearTimeout(d.id); d.left -= performance.now() - d.start; };
    d.resume = arm;
    d.cancel = () => { clearTimeout(d.id); this.deadlines.delete(d); };
    this.deadlines.add(d);
    if (!this.paused) arm();
    return d;
  }

  setPaused(v) {
    if (v === this.paused) return;
    this.paused = v;
    for (const d of this.deadlines) (v ? d.pause : d.resume)();
    document.body.classList.toggle('paused', v);
  }

  clear() {
    for (const d of this.deadlines) d.cancel();
    for (const el of this.root.querySelectorAll('.layer')) el.remove();
    this.modalCount = 0;
    this.timer(null);
    this.danger(0);
    this.cinema(false);
    this.fadeEl.style.opacity = 0;
  }

  // 컷신 레터박스: 위아래 검은 띠, HUD·조작 버튼 숨김 (스크립트가 끝나면 game.run이 끈다)
  cinema(on) { this.root.classList.toggle('cinematic', !!on); }

  // ---------- HUD ----------
  setLocation(name) { this.loc.textContent = name || ''; }
  objective(text) { this.obj.textContent = text ? '목표 · ' + text : ''; }
  refreshHud(g) {
    this.lighterBtn ??= this.root.querySelector('.btn-l');
    this.lighterBtn?.classList.toggle('hidden', !g.has('lighter'));
    this.lighterBtn?.classList.toggle('on', !!g.lighter);
    for (const e of this.root.querySelectorAll('.hint-l')) e.classList.toggle('hidden', !g.has('lighter'));
    this.hpSegs.forEach((e, i) => e.classList.toggle('on', g.hp > i * 10));
    this.hp.classList.toggle('low', g.hp <= 30);
  }
  timer(t) {
    if (!t) { this.timerEl.classList.add('hidden'); return; }
    this.timerEl.classList.remove('hidden');
    const s = Math.max(0, Math.ceil(t.left));
    this.timerEl.textContent = `${t.label || ''} ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    this.timerEl.classList.toggle('urgent', s <= 30);
  }
  danger(v) { this.dangerEl.style.opacity = (v * 0.85).toFixed(2); }
  hurt() {
    this.hurtEl.classList.remove('on');
    void this.hurtEl.offsetWidth;
    this.hurtEl.classList.add('on');
  }
  showControls(v) { this.controls.classList.toggle('hidden', !v); this.hud.classList.toggle('hidden', !v); }

  // ---------- 대사 ----------
  async portrait(who, face) {
    const id = this.story.speakers?.[who];
    if (!id) return null;
    const url = (face && await hfImage(`portrait_${id}_${face}`)) || await hfImage(`portrait_${id}`);
    if (url) return url;
    const m = sprites.meta[`portrait_${id}`];
    return m ? 'assets/sprites/' + m.file : null;
  }

  // 같은 인물이 이어서 말하면 초상화를 그대로 두고, 화자가 바뀌면 옆에서 밀려 들어온다.
  // 서술(who 없음)에 표정이 있으면 주인공(story.narrator)의 반응 초상화를 이름표 없이 보여 준다
  say(who, text, face) {
    const { el, close } = this.layer('dialog-layer' + (who ? '' : ' narration'));
    const pid = who || (face ? this.story.narrator : null);
    const same = pid && pid === this.lastWho && performance.now() - this.lastSayEnd < 400;
    const pic = h('img', 'portrait hidden' + (same ? ' still' : ''), el);
    pic.draggable = false;
    const box = h('div', 'dialog', el);
    if (who) h('div', 'dialog-name', box, who);
    const body = h('div', 'dialog-text', box);
    const more = h('div', 'dialog-more', box, '▼');
    const show = url => { if (url) { pic.src = url; pic.classList.remove('hidden'); } };
    const key = `${pid}|${face || ''}`;
    if (this.picCache.has(key)) show(this.picCache.get(key));
    else this.portrait(pid, face).then(url => { this.picCache.set(key, url); show(url); });
    return new Promise(done => {
      let i = 0, full = false;
      const chars = [...text];
      const tick = setInterval(() => {
        i += 1;
        body.textContent = chars.slice(0, i).join('');
        if (i >= chars.length) finish();
      }, 28);
      const finish = () => { clearInterval(tick); body.textContent = text; full = true; more.classList.add('on'); };
      const onKey = e => {
        if (!el.isConnected) { removeEventListener('keydown', onKey, true); clearInterval(tick); return; }
        if (e.repeat || !ADVANCE.includes(e.code)) return;
        e.preventDefault(); e.stopPropagation(); next();
      };
      const next = () => {
        if (!full) return finish();
        removeEventListener('keydown', onKey, true);
        this.lastWho = pid;
        this.lastSayEnd = performance.now();
        close(); done();
      };
      addEventListener('keydown', onKey, true);
      tap(el, next);
    });
  }

  // timeout(초)이 지나면 def 번 선택지로 자동 결정
  choice(q, opts, { timeout, def = 0 } = {}) {
    const { el, close } = this.layer('choice-layer');
    const box = h('div', 'choice', el);
    if (q) h('div', 'choice-q', box, q);
    return new Promise(done => {
      let to = null;
      const pick = i => { to?.cancel(); close(); done(i); };
      opts.forEach((o, i) => tap(h('button', 'choice-opt', box, o), () => pick(i)));
      if (timeout) {
        const bar = h('div', 'choice-bar', box);
        bar.style.animationDuration = timeout + 's';
        to = this.deadline(timeout * 1000, () => pick(def));
      }
    });
  }

  // 연타 QTE: sec 초 안에 taps 번 누르면 성공
  qte(label, taps = 8, sec = 4) {
    const { el, close } = this.layer('qte-layer');
    h('div', 'qte-label', el, label);
    const bar = h('div', 'qte-bar', el);
    const fill = h('i', null, bar);
    const btn = h('button', 'qte-btn', el, '연타!');
    h('div', 'qte-press', el).innerHTML = 'PRESS <b class="k-touch">TAP</b><b class="k-key">Z</b><b class="k-pad">Ⓐ</b>';
    return new Promise(done => {
      let n = 0;
      const end = ok => { to.cancel(); removeEventListener('keydown', key, true); close(); done(ok); };
      const hit = () => { haptic('tap'); n++; fill.style.width = Math.min(100, n / taps * 100) + '%'; btn.classList.toggle('pulse'); if (n >= taps) end(true); };
      const key = e => { if (ADVANCE.includes(e.code)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) hit(); } };
      addEventListener('keydown', key, true);
      tap(el, hit);
      const to = this.deadline(sec * 1000, () => end(false));
    });
  }

  // 스위치 퍼즐: labels 개수만큼 ON/OFF 토글 → 확인 시 상태 배열, 취소 시 null
  switches(title, labels, hint) {
    const { el, close } = this.layer('keypad-layer');
    const box = h('div', 'keypad', el);
    h('div', 'keypad-title', box, title);
    if (hint) h('div', 'switch-hint', box, hint);
    const row = h('div', 'switch-row', box);
    const st = labels.map(() => false);
    labels.forEach((lb, i) => {
      const b = h('button', 'switch', row);
      h('span', 'switch-lamp', b);
      h('span', 'switch-label', b, lb);
      tap(b, () => { st[i] = !st[i]; b.classList.toggle('on', st[i]); });
    });
    const foot = h('div', 'switch-foot', box);
    return new Promise(done => {
      tap(back(h('button', 'btn-close', foot, '취소')), () => { close(); done(null); });
      tap(h('button', 'btn-close ok', foot, '전원 연결'), () => { close(); done([...st]); });
    });
  }

  // 다이얼: 줄마다 ◀ 값 ▶ (세계 시계 맞추기 등). rows = [{ label, value, min, max, fmt }] → 확인하면 값 배열, 취소 null
  dials(title, rows, hint) {
    const { el, close } = this.layer('keypad-layer');
    const box = h('div', 'keypad', el);
    h('div', 'keypad-title', box, title);
    if (hint) h('div', 'switch-hint', box, hint);
    const vals = rows.map(r => r.value ?? r.min);
    rows.forEach((r, i) => {
      const row = h('div', 'dial-row', box);
      h('span', 'dial-label', row, r.label);
      const prev = h('button', 'btn dial-prev', row, '◀');
      const v = h('span', 'dial-value', row, (r.fmt || String)(vals[i]));
      const next = h('button', 'btn dial-next', row, '▶');
      const n = r.max - r.min + 1;
      const step = d => { vals[i] = r.min + (((vals[i] - r.min + d) % n) + n) % n; v.textContent = (r.fmt || String)(vals[i]); };
      tap(prev, () => step(-1));
      tap(next, () => step(1));
    });
    const foot = h('div', 'switch-foot', box);
    return new Promise(done => {
      tap(back(h('button', 'btn-close', foot, '취소')), () => { close(); done(null); });
      tap(h('button', 'btn-close ok', foot, '맞추기'), () => { close(); done([...vals]); });
    });
  }

  // 피아노: 건반 8개(도~높은 도). len 음을 치면 친 순서(0 = 도 … 7 = 높은 도)를 돌려준다. 그만두면 null
  piano(title, len, hint, onKey) {
    const { el, close } = this.layer('piano-layer');
    const box = h('div', 'keypad', el);
    h('div', 'keypad-title', box, title);
    if (hint) h('div', 'switch-hint', box, hint);
    const disp = h('div', 'keypad-disp', box);
    const keys = h('div', 'piano-keys', box);
    const seq = [];
    const show = () => { disp.textContent = Array.from({ length: len }, (_, i) => (seq[i] != null ? NOTES[seq[i]] : '_')).join(' '); };
    show();
    return new Promise(done => {
      let sent = false;
      NOTES.forEach((n, i) => tap(h('button', 'piano-key', keys, n), () => {
        if (sent) return;
        onKey?.(i);
        seq.push(i);
        show();
        if (seq.length === len) { sent = true; setTimeout(() => { close(); done([...seq]); }, 350); }
      }));
      const foot = h('div', 'switch-foot', box);
      tap(back(h('button', 'btn-close', foot, '그만두기')), () => { if (!sent) { sent = true; close(); done(null); } });
      tap(h('button', 'btn-close', foot, '처음부터'), () => { if (!sent) { seq.length = 0; show(); } });
    });
  }

  toast(text) {
    const t = h('div', 'toast', this.toastWrap, text);
    setTimeout(() => t.classList.add('out'), 1800);
    setTimeout(() => t.remove(), 2300);
    return new Promise(r => setTimeout(r, 650));
  }

  doc(d) {
    const { el, close } = this.layer('doc-layer');
    const box = h('div', 'doc', el);
    h('div', 'doc-title', box, d?.title || '');
    const body = h('div', 'doc-body scroll', box);
    for (const para of (d?.body || '').split('\n\n')) h('p', null, body, para);
    const btn = back(h('button', 'btn-close', box, '닫기'));
    return new Promise(done => tap(btn, () => { close(); done(); }));
  }

  fade(to, s = 0.6) {
    this.fadeEl.style.transition = `opacity ${s}s`;
    this.fadeEl.style.opacity = to;
    return new Promise(r => setTimeout(r, s * 1000 + 30));
  }

  card(title, sub) {
    const { el, close } = this.layer('card-layer');
    h('div', 'card-title', el, title);
    if (sub) h('div', 'card-sub', el, sub);
    return new Promise(r => setTimeout(() => { el.classList.add('out'); setTimeout(() => { close(); r(); }, 700); }, 2600));
  }

  // 힉스필드 CG 슬롯: 이미지가 등록돼 있을 때만 보여 주고, 없으면 그냥 넘어간다
  async cg(key, caption) {
    const url = await hfImage(key);
    if (!url) return;
    const { el, close } = this.layer('cg-layer');
    const im = h('img', 'cg-img', el);
    im.src = url;
    im.draggable = false;
    if (caption) h('div', 'cg-cap', el, caption);
    return new Promise(done => tap(el, () => { close(); done(); }));
  }

  keypad(title, len = 4) {
    const { el, close } = this.layer('keypad-layer');
    const box = h('div', 'keypad', el);
    h('div', 'keypad-title', box, title);
    const disp = h('div', 'keypad-disp', box);
    const grid = h('div', 'keypad-grid', box);
    let v = '', sent = false;
    const show = () => { disp.textContent = v.padEnd(len, '_').split('').join(' '); };
    show();
    return new Promise(done => {
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '취소', '0', '←']) {
        const b = h('button', 'key', grid, k);
        if (k === '취소') back(b);
        tap(b, () => {
          if (sent) return;
          if (k === '취소') { sent = true; close(); return done(null); }
          if (k === '←') v = v.slice(0, -1);
          else if (v.length < len) v += k;
          show();
          if (v.length === len) { sent = true; const code = v; setTimeout(() => { close(); done(code); }, 180); }
        });
      }
    });
  }

  // ---------- 휴대폰 메뉴 (2001년 폴더폰) ----------
  openMenu(g) {
    const { el, close } = this.layer('menu-layer');
    const phone = h('div', 'phone', el);
    const lid = h('div', 'phone-lid', phone);
    h('div', 'phone-speaker', lid);
    const scr = h('div', 'phone-screen', lid);
    const bar = h('div', 'phone-bar', scr);
    const min = 21 * 60 + 30 + Math.floor(g.t / 60); // 밤 9시 30분부터
    h('span', null, bar, '▂▄▆ 희민');
    h('span', null, bar, `${Math.floor(min / 60) % 24}:${String(min % 60).padStart(2, '0')} ▮▮▯`);
    const title = h('div', 'phone-title', scr);
    const page = h('div', 'phone-page scroll', scr);
    const soft = h('div', 'phone-soft', scr);
    h('span', null, soft, '선택');
    const backBtn = back(h('button', 'btn-close', soft));
    h('div', 'phone-hinge', phone);
    const keys = h('div', 'phone-keys', h('div', 'phone-base', phone));
    for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']) h('span', null, keys, k);

    let sub = null;
    const home = () => {
      sub = null;
      title.textContent = 'MENU';
      backBtn.textContent = '닫기';
      page.textContent = '';
      const grid = h('div', 'phone-apps', page);
      for (const [k, label] of [['inv', '소지품'], ['doc', '문서'], ['map', '지도'], ['obj', '목표'], ['save', '저장'], ['opt', '옵션'], ['exit', '종료']]) {
        const b = h('button', 'phone-app', grid);
        b.innerHTML = ICON[{ inv: 'bag', doc: 'doc', map: 'map', obj: 'pin', save: 'save', opt: 'gear', exit: 'power' }[k]];
        h('span', null, b, label);
        tap(b, () => open(k, label));
      }
    };
    const open = (k, label) => {
      if (k === 'map') { this.openMap(g); return; } // 휴대폰 위에 열고, 닫으면 휴대폰으로
      if (k === 'save') {
        // 무한 세이브(옵션)면 어디서든 저장. 제한시간 중에는 게시판처럼 거부
        if (!settings.infiniteSave) this.toast(`저장은 게시판에서 (${this.story.items[this.story.saveCost]?.name || ''} 1개)`);
        else if (g.timer) this.toast('지금은 한가하게 기록할 여유가 없다');
        else this.saveMenu(g);
        return;
      }
      sub = k;
      title.textContent = label;
      backBtn.textContent = '뒤로';
      page.textContent = '';
      if (k === 'inv') this.invPage(page, g, close);
      if (k === 'doc') this.docPage(page, g);
      if (k === 'opt') this.optPage(page, g);
      if (k === 'obj') {
        h('div', 'phone-note', page, g.flags.objective || '—');
        h('div', 'phone-sub', page, `위치 · ${this.story.maps[g.mapId]?.name || ''}`);
      }
      if (k === 'exit') {
        h('div', 'phone-note', page, '타이틀 화면으로 돌아갈까?\n저장하지 않은 진행은 사라진다.');
        tap(h('button', 'btn wide', page, '타이틀로'), () => { close(); location.reload(); });
      }
    };
    tap(backBtn, () => (sub ? home() : close()));
    home();
  }

  // ---------- 전체 지도: 지금 층이 맨 위, 다른 층은 한 번이라도 들어가 본 곳만 ----------
  // 공략(옵션)을 켜면 위에 다음 할 일·필요한 아이템·퍼즐 답, 지도에 목적지·아이템·이동 지점 표시(목적지가 있는 층은 안 가 봤어도 표시)
  openMap(g) {
    const { el, close } = this.layer('map-layer');
    const box = h('div', 'map', el);
    h('div', 'map-title', box, '지도');
    const G = settings.guide ? this.story.guide?.(g) : null;
    const list = h('div', 'map-list scroll', box);
    if (G) this.guidePanel(h('div', 'map-guide', list), G, g); // 지도와 함께 스크롤(낮은 화면에서 지도를 밀어내지 않게)
    const here = g.world.def;
    const widest = Math.max(...Object.values(this.story.maps).map(d => rooms(d).cols)); // 모든 층을 같은 칸 크기로
    const marked = G ? [G.at, ...G.items.map(i => i.at)].map(a => a[0]) : [];
    for (const def of [here, ...Object.values(this.story.maps).filter(d => d !== here && (explored(g, d) || marked.includes(d.id)))]) {
      h('div', 'map-name', list, def === here ? `${def.name} · 현재` : def.name);
      const wrap = h('div', 'map-wrap', list);
      wrap.style.width = (rooms(def).cols / widest) * 100 + '%';
      const cv = h('canvas', null, wrap);
      cv.dataset.map = def.id;
      drawMap(cv, g, def);
      const pin = (cls, x, y) => {
        const m = h('i', cls, wrap);
        m.style.left = (x / rooms(def).cols) * 100 + '%';
        m.style.top = (y / rooms(def).rows) * 100 + '%';
      };
      for (const it of G?.items || []) if (it.at[0] === def.id) pin('map-item', it.at[1] + 0.5, it.at[2] + 0.5);
      if (G?.via?.[0] === def.id) pin('map-via', G.via[1] + 0.5, G.via[2] + 0.5);
      if (G?.at[0] === def.id) pin('map-goal', G.at[1] + 0.5, G.at[2] + 0.5);
      if (def === here) pin('map-me', g.player.x, g.player.y);
    }
    const legend = h('div', 'map-legend', box);
    const keys = [['lit', '탐색함'], ['dark', '미탐색'], ['locked', '잠긴 문'], ['me', '현재 위치'], ...(G ? [['goal', '목적지'], ['item', '아이템'], ['via', '이동 지점']] : [])];
    for (const [cls, label] of keys) {
      const item = h('span', null, legend);
      const i = h('i', cls, item);
      if (MAP_COLORS[cls]) i.style.background = MAP_COLORS[cls];
      item.append(label);
    }
    tap(back(h('button', 'btn-close', box, '닫기')), close);
  }

  guidePanel(el, G, g) {
    const row = (cls, label, text) => { const p = h('p', cls, el); h('b', null, p, label); p.append(text); };
    row('g-next', '다음', G.at[0] === g.mapId ? G.text : `${G.text} (${this.story.maps[G.at[0]].name})`);
    if (G.via) row('g-via', '이동', G.via[3]);
    const by = new Map(); // 같은 곳의 아이템은 한 번에 (서무실 열쇠보관함: 강당통로 열쇠, 빨간 소형 열쇠)
    for (const i of G.items) by.set(i.where, [...(by.get(i.where) || []), i.name]);
    if (by.size) row('g-items', '아이템', [...by].map(([where, names]) => `${names.join(', ')} — ${where}`).join(' · '));
    for (const c of G.codes) row('g-code', c.label, c.value);
  }

  invPage(page, g, closeMenu) {
    const counts = new Map();
    for (const id of g.inv) counts.set(id, (counts.get(id) || 0) + 1);
    if (!counts.size) { h('div', 'empty', page, '가진 것이 없다.'); return; }
    const grid = h('div', 'inv-grid', page);
    const info = h('div', 'inv-info', page);
    for (const [id, n] of counts) {
      const it = this.story.items[id] || { name: id };
      const cell = h('button', 'inv-cell', grid);
      const m = sprites.meta['item_' + (it.icon || id)]; // icon: 같은 그림을 쓰는 아이템(열쇠류)
      if (m) { const im = h('img', null, cell); im.src = 'assets/sprites/' + m.file; im.draggable = false; }
      else h('span', 'inv-fallback', cell, it.name.slice(0, 2));
      if (n > 1) h('b', 'inv-n', cell, n);
      tapScroll(cell, () => {
        for (const c of grid.children) c.classList.remove('on');
        cell.classList.add('on');
        info.textContent = '';
        h('div', 'inv-name', info, it.name);
        h('div', 'inv-desc', info, (typeof it.desc === 'function' ? it.desc(g) : it.desc) || '');
        if (it.use) tapScroll(h('button', 'btn', info, '사용'), () => { closeMenu(); g.run(this.story.scripts[it.use]); });
      });
    }
  }

  docPage(page, g) {
    if (!g.docs.length) { h('div', 'empty', page, '읽은 문서가 없다.'); return; }
    for (const id of g.docs) {
      const d = this.story.docs[id];
      tapScroll(h('button', 'doc-item', page, d?.title || id), () => this.doc(g.docOf(id)));
    }
  }

  optPage(page, g) {
    const row = (label, cls, text, fn, note) => {
      const r = h('div', 'opt-row', page);
      h('span', null, r, label);
      const b = h('button', 'btn ' + cls, r, text());
      tap(b, () => { fn(); saveSettings(); b.textContent = text(); });
      if (note) h('div', 'phone-sub', page, note);
      return b;
    };
    const onoff = v => (v ? '켜짐' : '꺼짐');
    row('소리', 'opt-sound', () => onoff(!g.audio?.muted), () => g.audio?.toggle());
    row('조작 방식', 'opt-controls', () => (settings.controls === 'touch' ? '터치' : '버추얼 패드'),
      () => { settings.controls = settings.controls === 'touch' ? 'pad' : 'touch'; applyControls(); },
      '버추얼 패드: 왼쪽 아래를 끌어 이동, 조사·라이터·휴대폰·지도 버튼. 터치: 버튼 없이 화면 어디든 끌어 이동, 탭 = 조사, 두 번 탭 = 지도, 세 번 탭 = 라이터, 길게 누르기 = 휴대폰. 조이스틱을 끝까지 밀면 달리기(발소리가 커서 수위가 잘 듣는다), 살짝 밀면 걷기.');
    row('공략', 'opt-guide', () => onoff(settings.guide), () => { settings.guide = !settings.guide; },
      '켜면 지도에 다음 목적지·필요한 아이템·퍼즐 답이 나온다. 비밀번호는 단서를 찾아 읽은 뒤에 보인다.');
    row('무한 세이브', 'opt-infsave', () => onoff(settings.infiniteSave), () => { settings.infiniteSave = !settings.infiniteSave; },
      '켜면 사인펜 없이 몇 번이든 저장하고, 휴대폰 → 저장으로 어디서든 저장한다(제한시간 중에는 불가).');
    // 화면 축소·확대: 둘 중 하나만(한쪽을 바꾸면 다른 쪽은 1배)
    let zin = null;
    const zout = row('화면 축소', 'opt-zoom', () => `${settings.zoomOut}배`, () => {
      settings.zoomOut = ZOOMS[(ZOOMS.indexOf(settings.zoomOut) + 1) % ZOOMS.length];
      if (settings.zoomOut !== 1) settings.zoomIn = 1;
      zin.textContent = `${settings.zoomIn}배`;
      g.resize();
    }, '한 화면에 2배·4배·6배 넓게 본다(캐릭터·배경은 그만큼 작게). 6배면 한 층 전체가 한 화면에 들어온다.');
    zin = row('화면 확대', 'opt-zoomin', () => `${settings.zoomIn}배`, () => {
      settings.zoomIn = ZOOMS_IN[(ZOOMS_IN.indexOf(settings.zoomIn) + 1) % ZOOMS_IN.length];
      if (settings.zoomIn !== 1) settings.zoomOut = 1;
      zout.textContent = `${settings.zoomOut}배`;
      g.resize();
    }, '캐릭터·배경을 2~6배 크게 본다(보이는 범위는 그만큼 좁게). 화면 축소와 함께 쓸 수 없다.');
    // 그래픽 필터: ◀ 이름 ▶
    const fr = h('div', 'opt-row', page);
    h('span', null, fr, '그래픽 필터');
    const fbox = h('div', 'opt-cycle', fr);
    const name = () => FILTERS.find(f => f.id === settings.filter)?.name || '끄기';
    const prev = h('button', 'btn opt-filter-prev', fbox, '◀');
    const cur = h('span', 'opt-filter', fbox, name());
    const next = h('button', 'btn opt-filter-next', fbox, '▶');
    const step = d => {
      const i = Math.max(0, FILTERS.findIndex(f => f.id === settings.filter));
      settings.filter = FILTERS[(i + d + FILTERS.length) % FILTERS.length].id;
      saveSettings();
      this.fx?.set(settings.filter);
      cur.textContent = name();
    };
    tap(prev, () => step(-1));
    tap(next, () => step(1));
    h('div', 'phone-sub', page, this.fx && !this.fx.supported ? '이 기기에서는 그래픽 필터를 쓸 수 없다(WebGL 없음).'
      : 'CRT·선명·생생·부드럽게·LCD·흑백·세피아·VHS·게임보이·빛 번짐. 게임 화면에만 걸리고 대사창·메뉴는 그대로.');
  }

  // ---------- 저장 ----------
  saveMenu(g) {
    const { el, close } = this.layer('save-layer');
    const box = h('div', 'save', el);
    const cost = settings.infiniteSave ? null : this.story.saveCost; // 무한 세이브면 사인펜 없이
    h('div', 'save-title', box, cost ? `저장 (${this.story.items[cost].name} ${g.count(cost)}개 남음)` : settings.infiniteSave ? '저장 (무한 세이브)' : '저장');
    const saves = loadSaves();
    return new Promise(done => {
      for (let i = 0; i < SLOTS; i++) {
        const s = saves[i];
        const b = h('button', 'save-slot', box, s ? `${i + 1}. ${s.label}` : `${i + 1}. — 비어 있음 —`);
        tap(b, () => {
          if (cost && !g.has(cost)) { this.toast(`${this.story.items[cost].name}이(가) 없다`); return; }
          const snap = g.snapshot();
          if (cost) snap.inv.splice(snap.inv.indexOf(cost), 1);
          snap.label = `${this.story.maps[snap.map].name} · ${new Date(snap.at).toLocaleString('ko-KR', { hour12: false, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
          const prev = saves[i];
          saves[i] = snap;
          const ok = writeSaves(saves);
          if (ok) { if (cost) g.take(cost); } else saves[i] = prev;
          this.toast(ok ? '저장했다' : '저장 실패 (저장 공간 없음)');
          close(); done(ok);
        });
      }
      tap(back(h('button', 'btn-close', box, '그만두기')), () => { close(); done(false); });
    });
  }

  loadMenu() {
    const { el, close } = this.layer('save-layer');
    const box = h('div', 'save', el);
    h('div', 'save-title', box, '이어하기');
    const saves = loadSaves();
    return new Promise(done => {
      for (let i = 0; i < SLOTS; i++) {
        const s = saves[i];
        const b = h('button', 'save-slot', box, s ? `${i + 1}. ${s.label}` : `${i + 1}. — 비어 있음 —`);
        if (s) tap(b, () => { close(); done(s); }); else b.disabled = true;
      }
      tap(back(h('button', 'btn-close', box, '돌아가기')), () => { close(); done(null); });
    });
  }

  // ---------- 타이틀/게임오버/챕터 ----------
  title() {
    const { el, close } = this.layer('title-layer');
    const bg = h('div', 'title-bg', el);
    hfImage('title_keyart').then(url => { if (url) bg.style.backgroundImage = `url(${url})`; });
    h('div', 'title-main', el, '하얀날');
    h('div', 'title-sub', el, '- 미궁 학교 -');
    h('div', 'title-tag', el, '탑뷰 어드벤처 · 1~5장 · 엔딩 8종');
    const menu = h('div', 'title-menu', el);
    const has = loadSaves().some(Boolean);
    return new Promise(done => {
      tap(h('button', 'title-btn', menu, '새 게임'), () => { close(); done('new'); });
      const c = h('button', 'title-btn', menu, '이어하기');
      let open = false;
      if (has) tap(c, async () => {
        if (open) return;
        open = true;
        const s = await this.loadMenu();
        open = false;
        if (s) { close(); done(s); }
      });
      else c.disabled = true;
      tap(h('button', 'title-btn', menu, '챕터 선택'), async () => {
        if (open) return;
        open = true;
        const pick = await this.chapterMenu();
        open = false;
        if (pick) { close(); done(pick); }
      });
      tap(h('button', 'title-btn', menu, '엔딩 수집'), async () => {
        if (open) return;
        open = true;
        await this.endingsMenu();
        open = false;
      });
      tap(h('button', 'title-btn', menu, '갤러리'), async () => {
        if (open) return;
        open = true;
        await this.galleryMenu();
        open = false;
      });
      h('div', 'title-note', el, '팬메이드 비공식 프로토타입 · 원작 대사 미사용');
    });
  }

  // 챕터 선택: 있는 장은 바로 시작, 아직 없는 장은 딤드(누를 수 없음). 루트가 갈리는 장은 루트를 고른 뒤 → { chapter, route } / 돌아가기 null
  chapterMenu() {
    const { el, close } = this.layer('save-layer chapter-layer');
    const box = h('div', 'save', el);
    h('div', 'save-title', box, '챕터 선택');
    return new Promise(done => {
      for (const c of this.story.chapters || []) {
        const b = h('button', 'save-slot chapter-btn', box);
        h('b', null, b, `제${c.n}장`);
        b.append(` · ${c.title} (${c.seal})`);
        if (!c.ready) { h('span', 'chapter-soon', b, '준비 중'); b.disabled = true; continue; }
        tap(b, async () => {
          const route = c.routes ? await this.routeMenu(c) : null;
          if (c.routes && !route) return;
          close(); done({ chapter: c.n, route });
        });
      }
      tap(back(h('button', 'btn-close', box, '돌아가기')), () => { close(); done(null); });
    });
  }

  routeMenu(c) {
    const { el, close } = this.layer('save-layer chapter-layer');
    el.dataset.guard = 500; // 장 버튼 연타의 두 번째 탭이 바로 아래 겹친 루트 버튼을 눌러 루트가 저절로 정해지지 않게
    const box = h('div', 'save', el);
    h('div', 'save-title', box, `제${c.n}장 · 루트 선택`);
    h('div', 'chapter-note', box, '1장 끝(방송실)에서 고르는 분기 — 동행하는 인물과 이야기가 달라진다');
    return new Promise(done => {
      for (const [id, label] of c.routes) tap(h('button', 'save-slot chapter-route', box, label), () => { close(); done(id); });
      tap(back(h('button', 'btn-close', box, '돌아가기')), () => { close(); done(null); });
    });
  }

  gameOver(reason, g) {
    const { el } = this.layer('over-layer');
    h('div', 'over-title', el, reason || '게임 오버');
    const yew = endingOf('yew');
    h('div', 'ending-flower', el, `엔딩 · ${yew.name} (${yew.en}) — ${yew.mean}`);
    const menu = h('div', 'title-menu', el);
    const saves = loadSaves().filter(Boolean).sort((a, b) => b.at - a.at);
    if (g.checkpointData) tap(h('button', 'title-btn', menu, g.checkpointData.label || '체크포인트에서 다시'), () => { this.clear(); g.restore(g.checkpointData); });
    if (saves[0]) tap(h('button', 'title-btn', menu, '마지막 저장에서 다시'), () => { this.clear(); g.restore(saves[0]); });
    tap(h('button', 'title-btn', menu, '처음부터'), () => location.reload());
  }

  // 엔딩: CG → 꽃 카드 + 에필로그 → 엔딩 수집·타이틀로
  async ending(id, g) {
    const { el, close } = await this.endingCard(id, 'over-layer end ending-layer');
    h('div', 'ending-count', el, `엔딩 수집 ${seenEndings().length} / ${ENDINGS.length}`);
    const menu = h('div', 'title-menu', el);
    return new Promise(done => {
      tap(h('button', 'title-btn', menu, '엔딩 수집'), () => this.endingsMenu());
      tap(h('button', 'title-btn', menu, '타이틀로'), () => { close(); done(); location.reload(); });
    });
  }

  // 엔딩 CG → 꽃 카드(꽃 이름·꽃말·에필로그) 레이어. 엔딩 화면과 갤러리가 같이 쓴다
  async endingCard(id, cls) {
    const e = endingOf(id);
    await this.cg(e.cg);
    const L = this.layer(cls);
    h('div', 'ending-flower', L.el, `${e.who} 엔딩`);
    h('div', 'card-title', L.el, e.name);
    h('div', 'card-sub', L.el, `${e.en} · 「${e.mean}」`);
    const box = h('div', 'ending-text scroll', L.el);
    for (const t of e.text) h('p', null, box, t);
    return L;
  }

  // 갤러리: 잠금 없이 모든 컷신·엔딩 다시 보기(엔딩 수집 기록은 바뀌지 않음)
  galleryMenu() {
    const { el, close } = this.layer('save-layer gallery-layer');
    const box = h('div', 'save', el);
    h('div', 'save-title', box, '갤러리');
    const list = h('div', 'scroll', box);
    let busy = false;
    const view = fn => async () => { if (busy) return; busy = true; await fn(); busy = false; };
    h('div', 'gallery-head', list, `컷신 ${this.story.cutscenes.length}`);
    for (const [ch, key, name] of this.story.cutscenes) {
      const b = h('button', 'save-slot gallery-cg', list);
      h('b', null, b, `${ch}장`);
      b.append(` · ${name}`);
      tap(b, view(() => this.cg(key)));
    }
    h('div', 'gallery-head', list, `엔딩 ${ENDINGS.length}`);
    for (const e of ENDINGS) {
      const b = h('button', 'save-slot gallery-ending', list);
      h('b', null, b, e.name);
      h('span', 'ending-meta', b, `${e.who} · ${e.mean}`);
      tap(b, view(async () => {
        const L = await this.endingCard(e.id, 'over-layer end gallery-view');
        const menu = h('div', 'title-menu', L.el);
        await new Promise(done => tap(back(h('button', 'title-btn', menu, '닫기')), () => { L.close(); done(); }));
      }));
    }
    return new Promise(done => tap(back(h('button', 'btn-close', box, '닫기')), () => { close(); done(); }));
  }

  // 엔딩 수집: 본 엔딩만 꽃 이름·꽃말 공개
  endingsMenu() {
    const { el, close } = this.layer('save-layer endings-layer');
    const box = h('div', 'save', el);
    const seen = seenEndings();
    h('div', 'save-title', box, `엔딩 수집 ${seen.length} / ${ENDINGS.length}`);
    const list = h('div', 'scroll', box);
    for (const e of ENDINGS) {
      const ok = seen.includes(e.id), b = h('div', 'save-slot ending-slot' + (ok ? '' : ' locked'), list);
      h('b', null, b, ok ? e.name : '???');
      h('span', 'ending-meta', b, ok ? `${e.who} · ${e.mean}` : `${e.who} 엔딩`);
    }
    return new Promise(done => tap(back(h('button', 'btn-close', box, '닫기')), () => { close(); done(); }));
  }

  endChapter(title, sub, g) {
    const { el, close } = this.layer('over-layer end');
    h('div', 'card-title', el, title);
    if (sub) h('div', 'card-sub', el, sub);
    const menu = h('div', 'title-menu', el);
    return new Promise(done => {
      tap(h('button', 'title-btn', menu, '타이틀로'), () => { close(); done(); location.reload(); });
    });
  }
}
