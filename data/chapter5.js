// 제5장 · 미궁(B 루트 전용) — 원작 리메이크판 진행 순서를 따른 탑뷰 각색(docs/story-bible.md 4-04B·M-01·M-02). 대사는 모두 새로 썼다.
//
// 흐름: 4장 火 결계문 → 흰 빛이 소영을 삼킴 → 미궁(cg_maze): 미궁의 주인 = 성아가 본모습을 드러내고 사연을 들려준 뒤 사라진다
//   M-01 한쪽 벽 미로(8분). 벽의 오행 패를 火→土→金→水→木 차례로(차례가 아닌 패 앞은 빛의 장벽), 화면이 점점 하얗게 바랜다.
//        성아의 목소리가 때때로 들린다(공격하지 않음 — 리메이크 기준)
//   M-02 다섯 패 + 태극패 → 붕괴(2분): 길 밖의 바닥이 차례로 무너진다(입구·소영으로 가는 길은 무너지지 않는다)
//        → 쓰러진 소영을 안고(느려짐)/두고 입구의 흰 빛으로 → 하얀 국화·아이비 / 히아신스. 시간을 넘기면 주목
const F = k => g => !!g.flags[k];

// ---------------------------------------------------------------- 미궁(한쪽 벽 미로) — 고정 시드로 만들어 늘 같은 모양
const MW = 15, MH = 10;
function rng(seed) {
  return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function buildMaze() {
  const R = rng(1414), g = Array.from({ length: MH * 2 + 1 }, () => Array(MW * 2 + 1).fill('#'));
  const seen = new Set(['0,0']), st = [[0, 0]];
  g[1][1] = '.';
  while (st.length) {
    const [cx, cy] = st[st.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < MW && y < MH && !seen.has(x + ',' + y));
    if (!nb.length) { st.pop(); continue; }
    const [nx, ny] = nb[Math.floor(R() * nb.length)];
    seen.add(nx + ',' + ny);
    g[cy * 2 + 1 + (ny - cy)][cx * 2 + 1 + (nx - cx)] = '.';
    g[ny * 2 + 1][nx * 2 + 1] = '.';
    st.push([nx, ny]);
  }
  return g;
}
const MAZE = buildMaze();
const open = (c, r) => MAZE[r]?.[c] === '.';
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 입구(1,1)에서의 거리·경로
const PREV = new Map(), DIST = new Map([['1,1', 0]]);
{ const q = [[1, 1]]; while (q.length) { const [c, r] = q.shift(); for (const [dx, dy] of N4) { const k = `${c + dx},${r + dy}`; if (open(c + dx, r + dy) && !DIST.has(k)) { DIST.set(k, DIST.get(`${c},${r}`) + 1); PREV.set(k, [c, r]); q.push([c + dx, r + dy]); } } } }
// 패 자리: 막다른 칸(위가 벽 — 패는 그 벽에 걸린다) 가운데 입구에서 고르게 떨어진 다섯 곳. 차례는 거리순이 아니게 섞는다
const DEAD = [...DIST.keys()].map(k => k.split(',').map(Number))
  .filter(([c, r]) => !(c === 1 && r === 1) && N4.filter(([dx, dy]) => open(c + dx, r + dy)).length === 1 && !open(c, r - 1))
  .sort((a, b) => DIST.get(a.join(',')) - DIST.get(b.join(',')));
const SPREAD = [0.2, 0.4, 0.6, 0.8, 1].map(q => DEAD[Math.max(0, Math.round(DEAD.length * q) - 1)]);
export const ELEMENTS = [['fire', '火', '불'], ['earth', '土', '흙'], ['metal', '金', '쇠'], ['water', '水', '물'], ['wood', '木', '나무']];
export const TABLETS = [1, 3, 0, 4, 2].map(i => SPREAD[i]); // TABLETS[i] = i번째(火·土·金·水·木) 패 앞 칸
// 붕괴 뒤 소영이 쓰러져 있는 칸: 木 패에서 입구로 가는 길의 한가운데
const pathToStart = ([c, r]) => { const out = [[c, r]]; let k = `${c},${r}`; while (PREV.has(k)) { const p = PREV.get(k); out.push(p); k = p.join(','); } return out; };
export const SOYOUNG_AT = (P => P[Math.floor(P.length / 2)])(pathToStart(TABLETS[4]));
export const MAZE_EXIT = [1, 1];
const EXIT_STEP = [[2, 1], [1, 2]].find(([c, r]) => open(c, r)); // 흰 빛 앞에서 돌아설 때 물러나는 칸
const MAZE_TIME = 480, COLLAPSE_TIME = 120;


// ---------------------------------------------------------------- 붕괴: 무너진 칸(flags.holes = "c,r;c,r…")
const HOLE_CACHE = { key: null, set: new Set() };
function holesOf(g) {
  const key = typeof g.flags.holes === 'string' ? g.flags.holes : '';
  if (key !== HOLE_CACHE.key) { HOLE_CACHE.key = key; HOLE_CACHE.set = new Set(key ? key.split(';') : []); }
  return HOLE_CACHE.set;
}
// 무너진 칸을 피해 a → b 최단 경로의 칸들
function pathCells(holes, [ac, ar], [bc, br]) {
  const prev = new Map([[`${ac},${ar}`, null]]), q = [[ac, ar]];
  while (q.length) {
    const [c, r] = q.shift();
    if (c === bc && r === br) break;
    for (const [dx, dy] of N4) {
      const k = `${c + dx},${r + dy}`;
      if (open(c + dx, r + dy) && !holes.has(k) && !prev.has(k)) { prev.set(k, `${c},${r}`); q.push([c + dx, r + dy]); }
    }
  }
  const out = new Set();
  for (let k = `${bc},${br}`; k && prev.has(k); k = prev.get(k)) out.add(k);
  return out;
}
const CRUMBLE_EVERY = 6, CRUMBLE_N = 14;
// 붕괴 한 번: 플레이어가 입구(와 아직 안지 않은 소영)로 가는 길, 소영 → 입구 길은 남기고, 플레이어에서 3칸 넘게 떨어진 칸만 무너진다
export function crumble(g) {
  const holes = holesOf(g), p = [Math.floor(g.player.x), Math.floor(g.player.y)];
  const keep = new Set([...pathCells(holes, p, MAZE_EXIT), ...pathCells(holes, SOYOUNG_AT, MAZE_EXIT), `${p[0]},${p[1]}`]);
  if (!g.flags.carrying) for (const k of pathCells(holes, p, SOYOUNG_AT)) keep.add(k);
  const cand = [...DIST.keys()].filter(k => !holes.has(k) && !keep.has(k)).map(k => k.split(',').map(Number))
    .filter(([c, r]) => Math.abs(c - p[0]) + Math.abs(r - p[1]) > 3)
    .sort((a, b) => DIST.get(b.join(',')) - DIST.get(a.join(','))); // 입구에서 먼 곳부터
  const add = cand.slice(0, CRUMBLE_N).map(c => c.join(','));
  if (!add.length) return 0;
  g.flags.holes = [...holes, ...add].join(';');
  return add.length;
}
// 성아의 목소리(남은 시간에 따라 한 번씩)
const VOICES = [
  [420, '…들려? 여기는 내 학교야. 아무도 나를 찾지 않았던 학교.'],
  [300, '패를 모으면 뭐가 달라질 것 같아? 넌 여기서 하얗게 지워질 거야.'],
  [180, '소영이는 따뜻해. 그 몸이면… 나도 아침을 볼 수 있어.'],
  [90, '서둘러야지, 전학생. 하얀 게 네 발끝까지 왔어.'],
];
function mazeTick(g, dt) {
  if (!g.timer) return;
  if (!g.flags.collapsed) {
    const i = g.flags.voiceN || 0;
    if (VOICES[i] && g.timer.left <= VOICES[i][0]) { g.flags.voiceN = i + 1; g.ui.toast(`성아의 목소리 — 「${VOICES[i][1]}」`); }
    return;
  }
  g.flags.crumbleT = (g.flags.crumbleT || 0) + dt;
  if (g.flags.crumbleT < CRUMBLE_EVERY) return;
  g.flags.crumbleT = 0;
  if (crumble(g)) { g.audio?.play('thud'); g.shake = 0.35; }
}

// ---------------------------------------------------------------- 맵
export const maps = {
  maze: {
    id: 'maze',
    name: '미궁',
    grid: MAZE.map(r => r.join('')),
    ambient: '#6e6e7c', // 하얀 미궁: 라이터 없이도 벽·바닥·무너진 구멍이 보이게
    doors: [],
    props: [
      ...ELEMENTS.map(([el], i) => ({ s: 'maze_tablet_' + el, x: TABLETS[i][0], y: TABLETS[i][1] - 1, lift: 6 })),
      ...TABLETS.slice(1).map(([c, r], k) => ({ s: 'barrier', x: c, y: r, solid: true, when: g => (g.flags.mazeStep || 0) <= k })), // 火(첫 패) 앞에는 장벽 없음
      { s: 'soyoung_lying', x: SOYOUNG_AT[0], y: SOYOUNG_AT[1], w: 2, when: g => g.flags.collapsed && !g.flags.carrying },
      { s: g => 'white_light_' + (Math.floor(g.t * 3) % 2), x: MAZE_EXIT[0], y: MAZE_EXIT[1], floor: true, when: F('collapsed') },
    ],
    holes: g => holesOf(g),
    // 시간에 따라: 성아의 목소리(공격하지 않음) / 붕괴 중에는 길 밖의 바닥이 무너진다
    tick: (g, dt) => mazeTick(g, dt),
    lights: [],
    dynGlows: g => [
      ...TABLETS.filter((_, i) => i < (g.flags.mazeStep || 0)).map(([c, r]) => ({ x: c + 0.5, y: r - 0.2, color: '255,255,255', pulse: true })),
      ...TABLETS.slice(1).filter((_, k) => (g.flags.mazeStep || 0) <= k).map(([c, r]) => ({ x: c + 0.5, y: r + 0.8, color: '150,190,255', pulse: true })), // 빛의 장벽
      ...(g.flags.collapsed ? [{ x: MAZE_EXIT[0] + 0.5, y: MAZE_EXIT[1] + 0.8, color: '255,255,255', pulse: true }] : []),
    ],
    // 시간이 흐를수록 화면이 하얗게 바랜다(붕괴 중에는 숨 쉬듯 일렁임)
    overlay: g => {
      if (!g.timer) return null;
      const a = g.flags.collapsed ? 0.32 + Math.sin(g.t * 3) * 0.06 : 0.04 + 0.28 * Math.min(1, Math.max(0, 1 - g.timer.left / MAZE_TIME));
      return `rgba(238,238,246,${a.toFixed(3)})`;
    },
    events: [
      ...TABLETS.map(([c, r], i) => ({ id: 'mz' + i, on: 'act', x: c, y: r - 1, run: s => mazeTablet(s, i) })),
      ...TABLETS.map(([c, r], i) => ({ id: 'mzb' + i, on: 'act', x: c, y: r, run: s => mazeBarrier(s, i), cond: g => (g.flags.mazeStep || 0) < i })).slice(1),
      { id: 'mzSoyoung', on: 'act', x: SOYOUNG_AT[0], y: SOYOUNG_AT[1], run: 'soyoungMaze', cond: g => g.flags.collapsed && !g.flags.carrying },
      { id: 'mzExit', on: 'touch', x: MAZE_EXIT[0], y: MAZE_EXIT[1], run: 'mazeExit', cond: F('collapsed') },
    ],
  },
};

// ---------------------------------------------------------------- 오행 패
async function mazeBarrier(s, i) {
  const [, h] = ELEMENTS[i], step = s.flag('mazeStep') || 0;
  s.sfx('fuse');
  await s.narrate(`희뿌연 빛의 장벽이 막아선다. 너머 벽에 '${h}' 자가 어른거린다.`, 'serious');
  await s.say('희민', `(아직 '${h}'의 차례가 아닌 것 같다. 다음은… '${ELEMENTS[step][1]}'.)`, 'serious');
}

async function mazeTablet(s, i) {
  const [, h, ko] = ELEMENTS[i];
  if ((s.flag('mazeStep') || 0) > i) return s.narrate(`'${h}' 패가 하얗게 빛나고 있다.`, 'default');
  s.sfx('bell');
  s.flag('mazeStep', i + 1);
  s.refresh();
  await s.narrate(`벽의 '${h}'(${ko}) 패에 손을 대자, 패가 하얗게 타올랐다. (${i + 1}/5)`, 'serious');
  if (i < 4) { s.objective(`오행 패 밝히기 — 다음은 '${ELEMENTS[i + 1][1]}' (火→土→金→水→木)`); return; }
  // 다섯 패 → 붕괴
  s.cinema(true);
  s.flag('collapsed', true);
  s.refresh();
  s.sfx('rumble');
  s.shake(1.4);
  await s.narrate('다섯 패가 한꺼번에 울렸다. 품속의 태극패가 뜨겁게 달아오르더니, 미궁의 벽이 하얗게 바스러지기 시작했다.', 'surprised');
  s.timer(COLLAPSE_TIME, '미궁 붕괴까지', 'mazeDeath');
  s.flag('crumbleT', 0);
  await s.say('성아', '…태극패? 그런 걸 어디서…! 안 돼, 내 미궁이…!', 'angry');
  await s.narrate('…입구 쪽에서 흰 빛이 새어 나온다. 그 길 위에 누군가 쓰러져 있다. 발밑의 바닥이 하나둘 무너져 내린다.', 'serious');
  s.objective('쓰러진 소영을 찾아 입구의 흰 빛으로 — 미궁이 무너진다');
}

// B 엔딩: 안고 나왔으면 아이비 / 하얀 국화(3장 커피→다이어리 · 1장 다이어리 대답 · 짜증 0 · 호감 2 이상 · 4장에서 흔들어 깨우지 않음), 두고 나왔으면 히아신스
export function bEnding(g) {
  const f = g.flags;
  if (!f.carrying) return 'hyacinth';
  const white = f.chrysanthemum && f.diary_answer === 'diary' && (f.strikes_soyoung || 0) === 0 && (f.aff_soyoung || 0) >= 2 && !f.soyoungAnnoyed;
  return white ? 'chrysanthemum' : 'ivy';
}


// ---------------------------------------------------------------- 공략
export function guide(g) {
  const f = g.flags;
  if (g.mapId !== 'maze') return null;
  const S = (text, at, codes = []) => ({ text, at, codes, via: null, items: [] });
  const oheng = { label: '오행 패', value: '火 → 土 → 金 → 水 → 木 (차례가 아닌 패 앞은 빛의 장벽)' };
  const step = f.mazeStep || 0;
  if (step < 5) { const [c, r] = TABLETS[step]; return S(`'${ELEMENTS[step][1]}' 패 밝히기 (${step + 1}/5)`, ['maze', c, r - 1], [oheng]); }
  if (!f.carrying && !f.leftHer) return S('쓰러진 소영에게', ['maze', ...SOYOUNG_AT], [{ label: '붕괴', value: '입구와 소영에게 가는 길은 무너지지 않는다' }]);
  return S('입구의 흰 빛으로', ['maze', ...MAZE_EXIT]);
}

// ---------------------------------------------------------------- 챕터 선택으로 바로 시작(B 루트 전용)
// 4장을 마친 상태(火의 패를 끼운 직후, 1~4장 선택 조건은 좋은 쪽)를 만든 뒤 5장 오프닝부터
export function newGame(g) {
  g.checkpointData = null;
  for (const id of ['candy', 'pen', 'pen', 'lighter', 'taeguk']) g.give(id);
  Object.assign(g.flags, { route: 'B', ch1Clear: 'B', ch2Clear: 'B', ch3Clear: 'B', ch4Start: true, breakerDone: true, jiFound: true, diary_answer: 'diary', chrysanthemum: true, aff_soyoung: 3, fireOut: true, sealFire: true });
  g.run('ch5Start');
}

// ---------------------------------------------------------------- 스크립트
export const scripts = {
  // 4장 火 결계문에서 이어진다(4-04B 미궁의 주인)
  ch5Start: async s => {
    s.cinema(true);
    s.flag('sealFire', true);
    await s.card('제5장 · 미궁', '다섯 기운의 길');
    await s.warp('maze', 1.5, 1.5, 'down');
    s.cinema(true);
    await s.narrate('사방이 하얀 벽. 끝없이 갈라지는 복도… 미궁이다.', 'serious');
    await s.cg('cg_maze');
    s.spawn({ id: 'seonga', kind: 'ghost', skin: 'seonga', x: 1.5, y: 3.4, dir: 'up', alpha: 0.75, glow: '200,220,255' });
    s.sfx('laugh');
    await s.say('성아', '어서 와, 전학생. 여기가 내 집이야.', 'smirk');
    await s.say('성아', '나는 이 학교에서 죽었어. 아무도 찾으러 오지 않았지. 학교에 갇힌 애들의 원망을 하나씩 삼키다 보니… 이 미궁의 주인이 돼 있더라.');
    await s.say('성아', '다섯 패가 모이면 고리가 닫혀. 이제 나도 나갈 수 있어. 살아 있는 몸 하나만 있으면.', 'smile');
    await s.say('희민', '…처음부터 소영이를 노린 거였어?', 'serious');
    await s.say('성아', '소영이는 데려갈게. 너는 여기서 하얗게 지워지면 돼.', 'angry');
    s.despawn('seonga');
    await s.narrate('성아의 웃음소리가 하얀 벽에 부딪혀 사방에서 되울렸다.', 'scared');
    await s.say('희민', '(서고의 수업 자료… 묶인 것을 풀 때는 누르는 차례, 다시 일으킬 때는 살리는 차례. 火에서 시작해 土, 金, 水, 木. 그리고 태극패.)', 'serious');
    s.timer(MAZE_TIME, '미궁이 하얗게 지워지기까지', 'mazeDeath');
    s.objective("오행 패 밝히기 — 먼저 '火' (火→土→金→水→木)");
    s.checkpoint('미궁 입구부터');
    await s.toast('8분 — 화면이 하얗게 바래기 전에');
  },

  mazeDeath: async s => {
    s.cinema(true);
    await s.narrate('사방이 새하얗게 지워졌다. 내 손도, 발도, 이름도.', 'scared');
    s.gameOver('미궁에 삼켜졌다…');
  },

  soyoungMaze: async s => {
    const c = await s.choice('소영이 쓰러져 있다. 눈을 뜨지 않는다.', ['안아 든다 (느려진다)', '두고 간다']);
    if (c === 1) {
      s.flag('leftHer', true);
      return s.narrate('…희민은 소영에게서 등을 돌렸다.', 'serious');
    }
    s.flag('carrying', true);
    s.flag('leftHer', false);
    s.refresh();
    await s.narrate('소영을 안아 들었다. 생각보다 가볍다. …하지만 발걸음이 무거워졌다.', 'serious');
    s.objective('소영을 안고 입구의 흰 빛으로');
  },

  mazeExit: async s => {
    if (!s.flag('carrying') && !s.flag('leftHer')) {
      const c = await s.choice('흰 빛이 일렁인다. 소영은… 아직 미궁 안에 있다.', ['혼자 빛 속으로', '돌아간다']);
      if (c) return s.move('player', EXIT_STEP[0] + 0.5, EXIT_STEP[1] + 0.5, 2.5); // 칸을 벗어나야 다시 닿는다
    }
    s.cinema(true);
    s.sfx('bell');
    await s.fade(1, 1.2);
    await s.fade(0, 0.1);
    await s.ending(bEnding(s.g));
  },
};
