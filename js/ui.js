// DOM UI (적·흑 공포 테마): 대사창(오른쪽 큰 초상화), 선택지, 토스트, 문서, 키패드, 휴대폰 메뉴(2001년 폴더폰),
// 저장, 타이틀, 게임오버, 챕터 카드, CG, 연타 게이지, 컷신 레터박스.
// 닫기·취소 버튼은 data-back → 키보드 Esc·게임패드 B (nav.js)
import { hfImage, sprites } from './sprites.js';
import { input } from './input.js';
import { ICON } from './icons.js';
import { settings, saveSettings, runWord } from './settings.js';

const SAVE_KEY = 'wd_topview_save_v1';
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
// 레이어가 열린 직후 0.2초 안의 탭은 무시: 앞 대사를 넘기던 연타가 새 선택지·CG를 눌러 버리지 않게.
function tap(el, fn) {
  el.addEventListener('pointerdown', e => {
    e.stopPropagation();
    const L = el.closest('.layer');
    if (L && performance.now() - Number(L.dataset.t0 || 0) < 200) return;
    fn(e);
  });
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
      const hit = () => { n++; fill.style.width = Math.min(100, n / taps * 100) + '%'; btn.classList.toggle('pulse'); if (n >= taps) end(true); };
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
      for (const [k, label] of [['inv', '소지품'], ['doc', '문서'], ['obj', '목표'], ['save', '저장'], ['opt', '옵션'], ['exit', '종료']]) {
        const b = h('button', 'phone-app', grid);
        b.innerHTML = ICON[{ inv: 'bag', doc: 'doc', obj: 'pin', save: 'save', opt: 'gear', exit: 'power' }[k]];
        h('span', null, b, label);
        tap(b, () => open(k, label));
      }
    };
    const open = (k, label) => {
      if (k === 'save') { this.toast(`저장은 게시판에서 (${this.story.items[this.story.saveCost]?.name || ''} 1개)`); return; }
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
    const row = h('div', 'opt-row', page);
    h('span', null, row, '소리');
    const b = h('button', 'btn', row, g.audio?.muted ? '꺼짐' : '켜짐');
    tap(b, () => { g.audio?.toggle(); b.textContent = g.audio?.muted ? '꺼짐' : '켜짐'; });
    const run = h('div', 'opt-row', page);
    h('span', null, run, '자동 달리기');
    const r = h('button', 'btn opt-autorun', run, settings.autoRun ? '켜짐' : '꺼짐');
    tap(r, () => { settings.autoRun = !settings.autoRun; saveSettings(); r.textContent = settings.autoRun ? '켜짐' : '꺼짐'; this.syncRunLabels(); });
    h('div', 'phone-sub', page, '켜면 기본이 달리기. 달리기 버튼이 \'걷기\'로 바뀌고, 누르는 동안 걷는다. 달리면 발소리가 커서 수위가 잘 듣는다.');
  }

  // 자동 달리기면 달리기 버튼·버튼 안내가 '걷기'
  syncRunLabels() {
    for (const e of this.root.querySelectorAll('.run-word')) e.textContent = runWord();
  }

  // ---------- 저장 ----------
  saveMenu(g) {
    const { el, close } = this.layer('save-layer');
    const box = h('div', 'save', el);
    const cost = this.story.saveCost;
    h('div', 'save-title', box, cost ? `저장 (${this.story.items[cost].name} ${g.count(cost)}개 남음)` : '저장');
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
    h('div', 'title-sub', el, '학교라는 이름의 미궁');
    h('div', 'title-main', el, '화이트데이');
    h('div', 'title-tag', el, '탑뷰 어드벤처 · 1장 본관 1구역');
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
      h('div', 'title-note', el, '팬메이드 비공식 프로토타입 · 원작 대사 미사용');
    });
  }

  gameOver(reason, g) {
    const { el } = this.layer('over-layer');
    h('div', 'over-title', el, reason || '게임 오버');
    const menu = h('div', 'title-menu', el);
    const saves = loadSaves().filter(Boolean).sort((a, b) => b.at - a.at);
    if (g.checkpointData) tap(h('button', 'title-btn', menu, g.checkpointData.label || '체크포인트에서 다시'), () => { this.clear(); g.restore(g.checkpointData); });
    if (saves[0]) tap(h('button', 'title-btn', menu, '마지막 저장에서 다시'), () => { this.clear(); g.restore(saves[0]); });
    tap(h('button', 'title-btn', menu, '처음부터'), () => location.reload());
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
