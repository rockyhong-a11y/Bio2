// 제4장 · 강당(火) + 제5장 · 미궁(B 루트) — 원작 리메이크판 진행 순서를 따른 탑뷰 각색(docs/story-bible.md 4-01~5장). 대사·문서는 모두 새로 썼다.
//
// 흐름: 신관 2층 水 결계문 너머 통로 → 강당 2층(영사실·조종실)
//   4-01 영사실 조명 콘솔 → 무대가 밝혀짐(cg_stage) / 영사실 책상 메모 → 조종실 패널 스위치(메모대로) → 방화 셔터가 올라가고 밸브 핸들
//   → 4-02 1층 로비에 내려서면 화재(cg_fire): 불 귀신 은미 추격 + 5분 제한(넘기면 폭발 사망 = 주목)
//      소화기 A(로비) → 서쪽 복도 불 → 소화기 B(남탈의실) → 동쪽 복도 불 → 소화기 C(여탈의실) → 대기실 앞 불
//      → 대기실 소방 배관에 밸브 핸들 → 스프링클러: 불·은미가 모두 사그라든다
//   → 4-03 B: 소영이 연기에 쓰러짐(흔들어 깨우기 3번 = 짜증) / A: 지현 발목 부상, 무대 위 성아
//   → 4-04A 성아의 손을 잡는다(튜베로즈·흑단목 — 3장 테이프 투고) / 지현에게 돌아가 구급상자(민들레·접시꽃 — 지현과의 대화)
//   → 4-04B 무대의 火의 패 → 2층 火 결계문 → 흰 빛이 소영을 삼킨다(cg_maze) → 제5장 미궁
//   5장: 한쪽 벽 미로(8분), 오행 패를 火→土→金→水→木 차례로(차례가 아닌 패 앞은 빛의 장벽), 화면이 점점 하얗게 바랜다
//        다섯 패를 밝히면 붕괴(2분) → 길 위에 쓰러진 소영을 안고(느려짐)/두고 입구의 흰 빛으로 → 하얀 국화·아이비 / 히아신스
import { aff } from './chapter2.js';

const F = k => g => !!g.flags[k];
const pick = (arr, n) => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).slice(0, n).map(v => v[1]);
const list = (g, k) => String(g.flags[k] || '').split(',').filter(Boolean);
const B_ = g => g.flags.route === 'B';
const fireOn = g => !!g.flags.fireOn && !g.flags.fireOut;
const fireAnim = g => 'fire_' + (Math.floor(g.t * 5) % 2);

// ---------------------------------------------------------------- 아이템
export const items = {
  valve_wheel: { name: '밸브 핸들', desc: '조종실 패널 아래 걸려 있던 둥근 쇠 핸들. 소방 배관 밸브에 맞을 것 같다.' },
  extinguisher: { name: '소화기', desc: '빨간 분말 소화기. 불 한 곳을 끌 만큼은 남아 있다.' },
  first_aid: { name: '구급상자', desc: '대기실 벽에 걸려 있던 구급상자. 붕대와 소독약이 들어 있다.' },
  tablet_fire: { name: '火의 패', desc: "'火' 자가 새겨진 오각형 패. 손바닥이 데일 듯 뜨겁다." },
};

// 조종실 패널 스위치(왼쪽부터 1~5)
const PANEL = ['무대 조명', '객석 조명', '막', '방화 셔터', '환기'];

// ---------------------------------------------------------------- 문서
export const docs = {
  control_note: {
    title: '공연 후 정리 순서 — 강당 관리',
    body: g => `공연 끝나면 조종실 패널은 아래 스위치만 올려 둘 것.
나머지는 내려 두지 않으면 셔터가 안 올라감! (작년에 그래서 하루 종일 갇힘)

  ${list(g, 'panelCode').map(i => PANEL[+i - 1]).join(' · ')}

※ 1층 대기실 소방 배관 핸들은 패널 아래 고리에. 잃어버리지 말 것.`,
  },
};

// ---------------------------------------------------------------- 5장 미궁(한쪽 벽 미로) — 고정 시드로 만들어 늘 같은 모양
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

// ---------------------------------------------------------------- 맵
const fireProps = (k, x, y, when) => [0, 1].flatMap(d => [
  { s: fireAnim, x: x + d, y, solid: true, when },
  { s: 'fire_out', x: x + d, y, floor: true, when: g => g.flags.fireOn && !when(g) },
]);
const FIRES = { f1: [7, 12], f2: [31, 12], f3: [31, 6] }; // 소화기로 끄는 불(각 2칸)
const fireLit = k => g => fireOn(g) && !g.flags['out_' + k];
const locker = (id, x, y) => ({ id, on: 'act', x, y, run: s => s.hide(x + 0.5, y + 0.6) });
const EUNMI_FIRE = { id: 'eunmi', kind: 'ghost', skin: 'eunmi', x: 20.5, y: 15.5, chase: true, phase: false, pathfind: true, speed: 2.6, dmg: 25, glow: '255,130,50' };
const moon = (x, y) => ({ x, y, r: 3.4, color: '120,140,200', a: 0.5 });
const flame = (x, y) => ({ x, y, r: 3.2, color: '255,130,50', a: 0.8, fx: 'flicker' });

export const maps = {
  auditorium_2f: {
    id: 'auditorium_2f',
    name: '강당 2층',
    grid: [
      '########################################',
      '#######,,,,,,,,,#,,,,,,,,,#######::::::#',
      '#######,,,,,,,,,#,,,,,,,,,#######::::::#',
      '#######,,,,,,,,,#,,,,,,,,,#######::::::#',
      '#######,,,,,,,,,#,,,,,,,,,#######::::::#',
      '#######,,,,,,,,,#,,,,,,,,,#######::::::#',
      '##########D########D################D###',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '############################====########',
      '############################====########',
      '############################====########',
      '########################################',
    ],
    ambient: '#0b0b14',
    doors: [
      { x: 10, y: 6 }, { x: 19, y: 6 },
      { x: 36, y: 6, sprite: 'sealdoor', locked: true, lockedText: "손잡이 없는 낡은 문. 옆에 '火' 자가 새겨진 오각형 홈이 있다.", lockedFace: 'serious' },
    ],
    props: [
      // 영사실
      { s: g => (g.flags.stageLit ? 'mixer_board_on' : 'mixer_board'), x: 8, y: 1, w: 2, solid: true },
      { s: 'projector', x: 12, y: 2, solid: true },
      { s: 'desk', x: 14, y: 4, solid: true },
      // 조종실
      { s: g => (g.flags.doorsOpen ? 'control_panel_open' : 'control_panel'), x: 20, y: 0, w: 2 },
      { s: 'file_cabinet', x: 24, y: 1, solid: true },
      // 복도
      { s: 'seal_slot', x: 37, y: 6 },
      { s: 'bulletin', x: 4, y: 6, w: 2 },
      { s: 'stair_gate', x: 28, y: 10, w: 2, solid: true, when: g => !g.flags.doorsOpen },
      { s: 'stair_gate', x: 30, y: 10, w: 2, solid: true, when: g => !g.flags.doorsOpen },
    ],
    lights: [
      moon(11, 1.5), moon(21, 1.5),
      { x: 9, y: 1.8, r: 2.6, color: '120,220,160', a: 0.5, flag: 'stageLit' }, // 콘솔 불빛
    ],
    actors: [],
    events: [
      { id: 'save41', on: 'act', x: 4, y: 6, w: 2, run: 'savePoint', cond: g => g.player.y > 6 },
      { id: 'mixer', on: 'act', x: 8, y: 1, w: 2, run: 'mixer' },
      { id: 'projector', on: 'act', x: 12, y: 2, text: '먼지 쌓인 영사기. 필름 대신 누군가의 머리카락이 릴에 감겨 있다.', face: 'scared' },
      { id: 'ctrlNote', on: 'act', x: 14, y: 4, run: 'ctrlNote' },
      { id: 'panel', on: 'act', x: 20, y: 0, w: 2, run: 'panel' },
      { id: 'cab41', on: 'act', x: 24, y: 1, text: '공연 대본이 빼곡한 캐비닛. 맨 위 대본의 제목은 「하얀 날」.', face: 'default' },
      { id: 'gate41', on: 'act', x: 28, y: 10, w: 4, text: '방화 셔터가 계단을 막고 있다. 조종실 패널로 올릴 수 있을 것 같다.', face: 'serious', cond: g => !g.flags.doorsOpen },
      { id: 'sdown41', on: 'touch', x: 28, y: 12, w: 4, h: 1, run: s => s.warp('auditorium_1f', 37.5, 15.5, 'down'), cond: F('doorsOpen') },
      { id: 'sealFire', on: 'act', x: 36, y: 6, run: 'sealFire', cond: g => !g.flags.sealFire },
    ],
  },

  auditorium_1f: {
    id: 'auditorium_1f',
    name: '강당 1층',
    grid: [
      '########################################',
      '#,,,,,#..#,,,,,,,,,,,,,,,,,,,,#..#,,,,,#',
      '#,,,,,#..#,,,,,,,,,,,,,,,,,,,,#..#,,,,,#',
      '#,,,,,D..#,,,,,,,,,,,,,,,,,,,,#..D,,,,,#',
      '#,,,,,#..#,,,,,,,,,,,,,,,,,,,,#..#,,,,,#',
      '#,,,,,#..#....................#..#,,,,,#',
      '#######..#....................#..#######',
      '#_____#..#....................#..#_____#',
      '#_____#..#....................#..#_____#',
      '#_____D..#....................#..D_____#',
      '#_____#..#....................#..#_____#',
      '#_____#..#....................#..#_____#',
      '#######..##########DD##########..#######',
      '#::::::::::::::::::::::::::::::::::::==#',
      '#::::::::::::::::::::::::::::::::::::==#',
      '#::::::::::::::::::::::::::::::::::::::#',
      '#::::::::::::::::::::::::::::::::::::::#',
      '#::::::::::::::::::::::::::::::::::::::#',
      '#WWWWWWWWWWWWWWWWWWDDWWWWWWWWWWWWWWWWWW#',
    ],
    ambient: '#0d0b12',
    doors: [
      { x: 6, y: 3 }, { x: 6, y: 9 }, { x: 33, y: 3 }, { x: 33, y: 9 },
      { x: 19, y: 12 }, { x: 20, y: 12 },
      { x: 19, y: 18, locked: true, lockedText: '강당 정문. 바깥에서 쇠사슬로 묶여 있다.', lockedFace: 'serious' },
      { x: 20, y: 18, locked: true, lockedText: '강당 정문. 바깥에서 쇠사슬로 묶여 있다.', lockedFace: 'serious' },
    ],
    props: [
      // 무대·객석
      { s: 'stage_curtain', x: 10, y: 0, w: 2 }, { s: 'stage_curtain', x: 28, y: 0, w: 2 },
      { s: 'tablet_fire_stage', x: 19, y: 2, when: g => g.flags.fireOut && !g.flags['ev:tabletFire'] },
      ...[6, 8, 10].flatMap(y => [11, 14, 23, 26].map(x => ({ s: 'audience_seats', x, y, w: 3, solid: true }))),
      // 창고·남탈의실
      { s: 'costume_rack', x: 2, y: 1, w: 2, solid: true },
      { s: 'lockers', x: 1, y: 7, solid: true },
      { s: 'fire_extinguisher', x: 1, y: 11, when: g => !g.flags['ev:extB'] },
      // 대기실·여탈의실
      { s: g => (g.flags.fireOut ? 'big_pipe_valve' : 'big_pipe'), x: 35, y: 0, w: 2 },
      { s: 'first_aid_kit', x: 37, y: 0, when: g => !g.flags['ev:firstAid'] },
      { s: 'bench', x: 35, y: 4, w: 2, solid: true },
      { s: 'dressing_mirror', x: 35, y: 6, w: 2 },
      { s: 'lockers', x: 38, y: 7, solid: true },
      { s: 'fire_extinguisher', x: 38, y: 11, when: g => !g.flags['ev:extC'] },
      // 로비
      { s: 'fire_extinguisher', x: 2, y: 14, when: g => !g.flags['ev:extA'] },
      { s: 'bulletin', x: 12, y: 12, w: 2 },
      // 불길
      ...Object.entries(FIRES).flatMap(([k, [x, y]]) => fireProps(k, x, y, fireLit(k))),
      ...fireProps('hall', 19, 13, fireOn),
      // 4-03 쓰러진 소영(B) / 발목을 다친 지현(A)
      { s: 'soyoung_lying', x: 17, y: 15, w: 2, when: F('soyoungDown') },
      { s: 'jihyeon_sitting', x: 17, y: 15, when: g => g.flags.jiHurt },
    ],
    lights: [
      moon(4, 17), moon(14, 17), moon(26, 17), moon(35, 17),
      { x: 19.5, y: 2.5, r: 5, color: '255,236,200', a: 0.6, flag: 'stageLit' }, // 무대 조명
    ],
    dynGlows: g => (fireOn(g) ? [...Object.entries(FIRES).filter(([k]) => !g.flags['out_' + k]).map(([, [x, y]]) => [x, y]), [19, 13]].map(([x, y]) => ({ x: x + 1, y: y + 0.8, color: '255,120,40', pulse: true })) : []),
    actors: [
      { ...EUNMI_FIRE, cond: fireOn },
      { id: 'jihyeon', skin: 'jihyeon', x: 20.5, y: 15.4, dir: 'left', talk: 'jiWait', cond: F('soyoungDown') },
      { id: 'seonga', skin: 'seonga', x: 20.5, y: 2.6, dir: 'down', talk: 'seongaTalk', cond: g => g.flags.fireOut && g.flags.route === 'A' && !g.flags.seongaLeft },
    ],
    events: [
      { id: 'sup41', on: 'touch', x: 37, y: 13, w: 2, h: 1, run: s => s.warp('auditorium_2f', 29.5, 9.4, 'up') },
      { id: 'save42', on: 'act', x: 12, y: 12, w: 2, run: 'savePoint', cond: g => g.player.y > 12 },
      // 4-02 소화기·불길
      { id: 'extA', on: 'act', x: 2, y: 14, item: 'extinguisher', text: '로비 벽에 소화기가 걸려 있다.', face: 'serious' },
      { id: 'extB', on: 'act', x: 1, y: 11, item: 'extinguisher', text: '탈의실 구석에 소화기가 있다.', face: 'serious' },
      { id: 'extC', on: 'act', x: 38, y: 11, item: 'extinguisher', text: '탈의실 구석에 소화기가 있다.', face: 'serious' },
      ...Object.entries(FIRES).map(([k, [x, y]]) => ({ id: 'douse_' + k, on: 'act', x, y, w: 2, run: s => douse(s, k), cond: fireLit(k) })),
      { id: 'hallFire', on: 'act', x: 19, y: 13, w: 2, text: '강당 문 앞이 불바다다. 소화기 하나로는 어림없다 — 건물 전체에 물을 뿌려야 한다.', face: 'scared', cond: fireOn },
      { id: 'pipe', on: 'act', x: 35, y: 0, w: 2, run: 'pipe' },
      { id: 'firstAid', on: 'act', x: 37, y: 0, item: 'first_aid', text: '대기실 벽에 구급상자가 걸려 있다.', face: 'default' },
      { id: 'mirror41', on: 'act', x: 35, y: 6, w: 2, text: '분장용 거울. 전구 몇 개가 아직 켜져 있다. 거울 속 대기실에는… 의자가 하나 더 있다.', face: 'scared' },
      { id: 'rack41', on: 'act', x: 2, y: 1, w: 2, text: '공연 의상이 걸린 행거. 하얀 드레스 한 벌만 젖어 있다.', face: 'scared' },
      locker('lock41', 1, 7), locker('lock42', 38, 7),
      // 4-03 ~ 4-04
      { id: 'soyoungDown', on: 'act', x: 17, y: 15, w: 2, run: 'soyoungWake', cond: F('soyoungDown') },
      { id: 'jhTalk', on: 'act', x: 17, y: 15, run: 'jhTalk', cond: F('jiHurt') },
      { id: 'tabletFire', on: 'act', x: 19, y: 2, item: 'tablet_fire', text: '무대 한가운데, 불에 그을린 자리에 오각형 패가 놓여 있다.', face: 'serious', cond: g => g.flags.fireOut && g.flags.route === 'B' && !g.flags.soyoungDown, after: 'gotFire' },
      { id: 'tabletFireA', on: 'act', x: 19, y: 2, text: '불에 그을린 오각형 패. 성아가 지키듯 그 앞에 서 있다.', face: 'serious', cond: g => g.flags.fireOut && g.flags.route === 'A' },
    ],
  },

  maze: {
    id: 'maze',
    name: '미궁',
    grid: MAZE.map(r => r.join('')),
    ambient: '#1c1c26',
    doors: [],
    props: [
      ...ELEMENTS.map(([el], i) => ({ s: 'maze_tablet_' + el, x: TABLETS[i][0], y: TABLETS[i][1] - 1, lift: 6 })),
      ...TABLETS.slice(1).map(([c, r], k) => ({ s: 'barrier', x: c, y: r, solid: true, when: g => (g.flags.mazeStep || 0) <= k })), // 火(첫 패) 앞에는 장벽 없음
      { s: 'soyoung_lying', x: SOYOUNG_AT[0], y: SOYOUNG_AT[1], w: 2, when: g => g.flags.collapsed && !g.flags.carrying },
      { s: g => 'white_light_' + (Math.floor(g.t * 3) % 2), x: MAZE_EXIT[0], y: MAZE_EXIT[1], floor: true, when: F('collapsed') },
    ],
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

// ---------------------------------------------------------------- 맵에 들어설 때
export const onEnter = {
  auditorium_2f: async s => {
    if (s.flag('seen41')) return;
    s.flag('seen41', true);
    await s.narrate('강당 2층. 영사실과 조종실이 나란히 붙어 있다. 아래층 계단은 방화 셔터로 막혀 있다.', 'serious');
  },
  auditorium_1f: async s => { if (s.flag('doorsOpen') && !s.flag('fireOn')) await s.g.story.scripts.fireStart(s); },
};

// 동행 대사: B 소영 / A 지현(지금 따라오는 사람만)
async function say2(s, B, A) {
  const id = s.flag('follower');
  if (id === 'soyoung' && B) await s.say('소영', ...B);
  else if (id === 'jihyeon' && A) await s.say('지현', ...A);
}

async function douse(s, k) {
  if (!s.has('extinguisher')) return s.narrate('불길이 복도를 꽉 막았다. 맨손으로는 어림없다 — 소화기가 필요하다.', 'scared');
  s.take('extinguisher');
  s.sfx('spray');
  s.flag('out_' + k, true);
  s.refresh();
  await s.narrate('치이익— 하얀 분말이 불길을 덮었다. 다 쓴 소화기를 내려놓았다.', 'serious');
  const left = Object.keys(FIRES).filter(f => !s.flag('out_' + f)).length;
  s.objective(left ? '불 너머 방에서 다음 소화기 찾기' : '대기실 소방 배관에 밸브 핸들 — 스프링클러');
}

// ---------------------------------------------------------------- 5장 미궁
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
  await s.narrate('…입구 쪽에서 흰 빛이 새어 나온다. 그 길 위에 누군가 쓰러져 있다.', 'serious');
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
const FLOOR_NAME = { auditorium_1f: '1층', auditorium_2f: '2층' };
export function guide(g) {
  const f = g.flags, has = id => g.has(id), B = f.route === 'B';
  const via = to => {
    if (to === g.mapId || !FLOOR_NAME[g.mapId] || !FLOOR_NAME[to]) return null;
    return g.mapId === 'auditorium_2f' ? [g.mapId, 29, 12, '복도 동쪽 계단으로 1층'] : [g.mapId, 37, 13, '로비 동쪽 계단으로 2층'];
  };
  const S = (text, at, codes = []) => ({ text, at, codes, via: via(at[0]), items: [] });
  const panel = { label: '조종 패널', value: f.noteRead ? list(g, 'panelCode').map(i => PANEL[+i - 1]).join(' · ') + '만 올리기' : '영사실 책상의 메모' };
  const fire = { label: '불길', value: `소화기 하나로 불 한 곳. 다음 소화기는 불 너머 방에 — 남은 시간 안에 스프링클러를` };
  const oheng = { label: '오행 패', value: '火 → 土 → 金 → 水 → 木 (차례가 아닌 패 앞은 빛의 장벽)' };
  const A = (x, y) => ['auditorium_1f', x, y];

  if (!f.stageLit) return S('2층 영사실의 조명 콘솔 켜기', ['auditorium_2f', 8, 1]);
  if (!f.noteRead) return S('영사실 책상의 메모 읽기', ['auditorium_2f', 14, 4]);
  if (!f.doorsOpen) return S('조종실 패널 스위치를 메모대로 (방화 셔터)', ['auditorium_2f', 20, 0], [panel]);
  if (!f.fireOn) return S('계단으로 1층 로비', A(37, 15));
  if (!f.fireOut) {
    if (!f.out_f1) return has('extinguisher') ? S('서쪽 복도의 불을 소화기로', A(7, 12), [fire]) : S('로비 벽의 소화기', A(2, 14), [fire]);
    if (!f.out_f2) return has('extinguisher') ? S('동쪽 복도의 불을 소화기로', A(31, 12), [fire]) : S('남탈의실(서쪽 복도) 구석의 소화기', A(1, 11), [fire]);
    if (!f.out_f3) return has('extinguisher') ? S('대기실 앞 복도의 불을 소화기로', A(31, 6), [fire]) : S('여탈의실(동쪽 복도) 구석의 소화기', A(38, 11), [fire]);
    return S('대기실 소방 배관에 밸브 핸들 끼우기 — 스프링클러', A(35, 0), [fire]);
  }
  if (B) {
    if (f.soyoungDown) return S('로비에 쓰러진 소영 살피기', A(17, 15));
    if (!f.sealFire) {
      if (!has('tablet_fire')) return S('무대 한가운데의 火의 패', A(19, 2));
      return S('2층 복도 동쪽 끝 火 결계문에 火의 패 끼우기', ['auditorium_2f', 36, 6]);
    }
    if (g.mapId !== 'maze') return null;
    const step = f.mazeStep || 0;
    if (step < 5) { const [c, r] = TABLETS[step]; return S(`'${ELEMENTS[step][1]}' 패 밝히기 (${step + 1}/5)`, ['maze', c, r - 1], [oheng]); }
    if (!f.carrying && !f.leftHer) return S('쓰러진 소영에게', ['maze', ...SOYOUNG_AT]);
    return S('입구의 흰 빛으로', ['maze', ...MAZE_EXIT]);
  }
  if (!f.jhTalked) return S('로비에 주저앉은 지현에게 말 걸기', A(17, 15));
  if (!f.chooseJi) return S('무대 위의 성아에게', A(20, 2));
  if (!has('first_aid')) return S('대기실 벽의 구급상자', A(37, 0));
  return S('지현에게 구급상자', A(17, 15));
}

// ---------------------------------------------------------------- 챕터 선택으로 바로 시작
// 3장을 마친 상태(루트, 기본 소지품 + 태극패, 3장 선택 조건은 좋은 쪽)를 만든 뒤 4장 오프닝부터
export function newGame(g, route = 'B') {
  g.checkpointData = null;
  for (const id of ['candy', 'pen', 'pen', 'lighter', 'taeguk']) g.give(id);
  Object.assign(g.flags, { route, ch1Clear: route, ch2Clear: route, breakerDone: true, jiFound: true, diary_answer: 'diary' });
  if (route === 'B') Object.assign(g.flags, { chrysanthemum: true, aff_soyoung: 3 });
  else g.flags.tapeSubmitted = true;
  g.run('ch4Start');
}

// ---------------------------------------------------------------- 스크립트
export const scripts = {
  // 3장 2층 水 결계문 너머 통로에서 이어진다
  ch4Start: async s => {
    const g = s.g, route = s.flag('route');
    s.cinema(true);
    await s.fade(1, 0.8);
    s.flag('ch3Clear', s.flag('ch3Clear') || route);
    s.flag('ch4Start', true);
    s.flag('panelCode', pick(['1', '2', '3', '4', '5'], 3).sort().join(','));
    if (route === 'B') { s.flag('follower', 'soyoung'); s.flag('follower2', s.flag('jiFound') ? 'jihyeon' : null); }
    else { s.flag('follower', 'jihyeon'); s.flag('follower2', null); }
    await s.card('제4장 · 강당', '불(火)의 결계');
    g.enterMap('auditorium_2f', 1.5, 8.5, 'right');
    await s.fade(0, 0.8);
    s.sfx('creak');
    await s.narrate('긴 통로 끝의 철문을 밀자, 탄내가 희미하게 섞인 공기가 밀려왔다. 강당 2층이다.', 'serious');
    if (route === 'B') {
      await s.say('소영', '…여기가 마지막이야. 불, 火의 패.', 'serious');
      await s.say('소영', '언니가 마지막으로 있었던 곳도… 여기였어.', 'sad');
    } else {
      await s.say('지현', '성아… 여기 있을 거야. 꼭.', 'sad');
    }
    s.objective('2층 영사실 살펴보기');
  },

  mixer: async s => {
    if (s.flag('stageLit')) return s.narrate('조명 콘솔의 초록 불이 깜빡인다. 무대는 아직 밝혀져 있다.', 'default');
    s.cinema(true);
    s.sfx('switch');
    s.flag('stageLit', true);
    s.refresh();
    await s.narrate('콘솔의 페이더를 끝까지 올리자, 창 너머 아래층 무대에 하얀 조명이 쏟아졌다.', 'serious');
    await s.cg('cg_stage');
    await s.narrate('텅 빈 무대 한가운데, 긴 머리의 소녀가 쓰러져 있다— 조명이 한 번 깜빡이자 아무도 없었다.', 'scared');
    await say2(s, ['…봤어? 무대 위에. 언니… 아니, 그럴 리 없어.', 'serious'], ['바, 방금… 누가 누워 있었지?', 'scared']);
    s.objective('아래층으로 — 방화 셔터는 조종실 패널 (영사실 책상의 메모)');
  },

  ctrlNote: async s => {
    s.flag('noteRead', true);
    await s.doc('control_note');
    if (!s.flag('doorsOpen')) s.objective('조종실 패널 스위치를 메모대로 올리기');
  },

  panel: async s => {
    if (s.flag('doorsOpen')) return s.narrate('조종 패널. 방화 셔터 표시등이 초록색이다.', 'default');
    if (!s.flag('noteRead')) {
      await s.narrate('스위치가 다섯 개 달린 조종 패널. 아무거나 올렸다간 셔터가 더 단단히 잠길 것 같다.', 'serious');
      return s.say('희민', '(영사실 책상에 메모 같은 게 있었는데…)', 'serious');
    }
    const st = await s.switches('조종 패널', PANEL, '메모에 적힌 스위치만 올린다');
    if (!st) return;
    const on = st.map((v, i) => (v ? String(i + 1) : null)).filter(Boolean).join(',');
    if (on !== s.flag('panelCode')) { s.sfx('fuse'); s.shake(0.3); return s.narrate('삐— 경고음과 함께 스위치가 전부 튕겨 내려갔다.', 'surprised'); }
    s.cinema(true);
    s.flag('doorsOpen', true);
    s.refresh();
    s.sfx('lever');
    await s.narrate('드르르륵— 복도 끝에서 방화 셔터가 말려 올라가는 소리가 들렸다.', 'serious');
    await s.narrate('패널 아래 고리에 둥근 쇠 핸들이 걸려 있다.', 'default');
    await s.give('valve_wheel');
    s.objective('계단으로 1층 로비');
  },

  // ---- 4-02 화재
  fireStart: async s => {
    s.cinema(true);
    s.flag('fireOn', true);
    s.sfx('rumble');
    s.shake(0.8);
    await s.narrate('로비에 내려서자 매캐한 연기가 코를 찔렀다. 강당 문틈으로 붉은 빛이 일렁인다.', 'scared');
    s.sfx('fuse');
    await s.cg('cg_fire');
    s.refresh();
    await s.narrate('콰앙— 강당 문이 안쪽에서 터지듯 열리고, 불길이 로비로 쏟아졌다. 불길 한가운데서… 은미가 걸어 나온다.', 'surprised');
    await say2(s, ['불이… 언니가 죽던 날처럼…! 희민아, 불부터 꺼야 해!', 'scared'], ['히익…! 불, 불이…!', 'scared']);
    await s.say('희민', '(대기실에 소방 배관이 있다고 했다. 밸브 핸들로 스프링클러를 돌리면…!)', 'serious');
    s.timer(300, '불길이 번지기까지', 'fireDeath');
    s.objective('소화기로 불길을 뚫고 대기실 소방 배관 — 스프링클러');
    s.checkpoint('강당 화재 직후부터');
    s.spawn(EUNMI_FIRE);
    s.sfx('laugh');
    await s.toast('5분 안에 스프링클러를 — 불 귀신에게 잡히지 마라');
  },

  fireDeath: async s => {
    s.cinema(true);
    s.sfx('rumble');
    s.shake(1.6);
    await s.narrate('콰광— 불길이 무대 장치의 가스통에 닿았다. 하얀 섬광이 모든 것을 삼켰다.', 'surprised');
    s.gameOver('불길에 휩싸였다…');
  },

  pipe: async s => {
    if (s.flag('fireOut')) return s.narrate('소방 배관. 밸브가 열린 채 물이 흐르는 소리가 난다.', 'default');
    if (!s.flag('fireOn')) return s.narrate('굵은 소방 배관. 밸브 핸들이 빠져 있다.', 'default');
    if (!s.has('valve_wheel')) return s.narrate('굵은 소방 배관. 밸브 핸들이 빠져 있다… 조종실에 있었던 것 같다.', 'serious');
    const c = await s.choice('밸브 핸들을 끼우고 돌릴까?', ['돌린다', '그만둔다']);
    if (c) return;
    s.cinema(true);
    s.take('valve_wheel');
    s.flag('fireOut', true);
    s.stopTimer();
    s.sfx('lever');
    s.refresh();
    await s.narrate('끼익, 끼이익— 녹슨 핸들이 돌아가자 배관이 쿵쿵 울렸다.', 'serious');
    s.sfx('splash');
    s.shake(0.6);
    s.despawn('eunmi');
    await s.narrate('촤아아— 천장의 스프링클러가 일제히 물을 뿜었다. 불길이 쉭쉭 소리를 내며 사그라들고, 은미의 비명도 함께 꺼져 갔다.', 'surprised');
    s.clearCheckpoint();
    const B = s.flag('route') === 'B';
    // 4-03: 로비에서 — B 소영이 쓰러짐 / A 지현이 발목을 다침
    s.flag('follower', null);
    s.flag('follower2', null);
    if (B) s.flag('soyoungDown', true);
    else s.flag('jiHurt', true);
    await s.warp('auditorium_1f', 19.5, 15.5, 'left');
    s.cinema(true);
    if (B) {
      await s.narrate('물에 젖은 로비로 나오자— 소영이 힘없이 무너져 내렸다. 연기를 너무 많이 마신 것 같다.', 'scared');
      await s.say('지현', '소, 소영아…! 희민아, 소영이가…!', 'scared');
      s.objective('쓰러진 소영 살피기');
    } else {
      await s.narrate('물에 젖은 로비로 나오자, 지현이 미끄러져 넘어졌다. 발목을 감싸 쥐고 얼굴을 찡그린다.', 'scared');
      await s.say('지현', '아야… 괜, 괜찮아. 그보다 희민아, 무대에…', 'sad');
      await s.narrate('강당 문 너머 무대 위에, 성아가 서 있다.', 'serious');
      s.objective('지현에게 말 걸기');
    }
  },

  // ---- 4-03 B: 쓰러진 소영. 흔들어 깨우기를 세 번 하면 짜증(하얀 국화 조건을 잃음)
  soyoungWake: async s => {
    const c = await s.choice('소영이 정신을 잃고 쓰러져 있다. 숨은 고르게 쉬고 있다.', ['어깨를 흔들어 깨운다', '곁에 앉아 기다린다']);
    if (c === 0) {
      const n = (s.flag('pokes') || 0) + 1;
      s.flag('pokes', n);
      if (n < 3) return s.narrate(n === 1 ? '소영은 미동도 없다…' : '조금 더 세게 흔들었다. 소영의 눈썹이 살짝 움찔했다.', 'serious');
      s.flag('soyoungAnnoyed', true);
      aff(s, 'soyoung', -2);
      await s.narrate('세게 흔들자 소영이 콜록거리며 눈을 떴다.', 'surprised');
      await s.say('소영', '…아파. 그렇게까지 흔들 건 없잖아.', 'angry');
    } else {
      await s.narrate('희민은 소영 곁에 가만히 앉았다. 스프링클러에서 떨어지는 물소리만 이어진다.', 'serious');
      await s.wait(1);
      await s.narrate('…한참 뒤, 소영이 천천히 눈을 떴다.', 'default');
      aff(s, 'soyoung', 1);
      await s.say('소영', '…계속 옆에 있어 준 거야? …고마워.', 'smile');
    }
    s.flag('soyoungDown', false);
    s.despawn('jihyeon');
    s.follow('soyoung');
    s.follow2('jihyeon');
    s.refresh();
    await s.say('소영', '무대 위에… 마지막 패가 있어. 가자.', 'serious');
    s.objective('무대 위 火의 패');
  },

  jiWait: async s => s.say('지현', '소영이… 숨은 쉬고 있어. 희민아, 깨워 줘…', 'scared'),

  gotFire: async s => {
    await s.say('소영', '그거야. 2층 복도 끝에 火 자가 새겨진 문이 있었어.', 'serious');
    s.objective('2층 복도 동쪽 끝 火 결계문에 火의 패 끼우기');
  },

  // ---- 4-03 ~ 4-04 A: 지현과 성아
  jhTalk: async s => {
    if (!s.flag('jhTalked')) {
      s.flag('jhTalked', true);
      await s.say('지현', '발목이… 삐었나 봐. 일어서려니까 찌릿해.', 'sad');
      let warm = 0;
      if ((await s.choice('', ['괜찮아, 내가 옆에 있을게.', '…조심 좀 하지 그랬어.'])) === 0) warm++;
      await s.say('지현', warm ? '…응. 희민이 있으니까 안 무서워.' : '…미안. 나 때문에 자꾸 늦어지네.', warm ? 'smile' : 'sad');
      await s.say('지현', '성아는… 어렸을 때부터 나만 지켜 줬어. 근데 오늘 밤 성아는 좀 무서워.', 'sad');
      if ((await s.choice('', ['성아는 지금도 널 지키려는 걸 거야.', '성아는 위험해. 가까이 가지 마.'])) === 0) warm++;
      await s.say('지현', warm === 2 ? '…그렇게 말해 줘서 고마워.' : '…그래도, 성아는 내 친구야.', warm === 2 ? 'smile' : 'sad');
      s.flag('jhDialog', warm);
      await s.say('지현', '성아한테 가 봐 줘. 나는… 대기실에 구급상자가 있었던 것 같아. 나중에 부탁해도 될까?', 'sad');
      s.objective('무대 위의 성아에게 (구급상자는 대기실)');
      return;
    }
    if (!s.flag('chooseJi')) return s.say('지현', '성아… 무대에 있어. 먼저 가 봐 줘.', 'sad');
    if (!s.has('first_aid')) return s.say('지현', '…구급상자, 대기실 벽에 걸려 있었어.', 'sad');
    s.cinema(true);
    s.take('first_aid');
    await s.narrate('지현의 발목에 붕대를 감았다.', 'serious');
    await s.ending((s.flag('jhDialog') || 0) >= 2 ? 'dandelion' : 'althea');
  },

  seongaTalk: async s => {
    s.cinema(true);
    await s.say('성아', '왔네, 전학생. 불은 네가 끈 거야? …제법이네.', 'smirk');
    await s.say('성아', '이 패만 있으면 이 학교에서 나갈 수 있어. 나도, 너도.');
    await s.say('성아', '같이 가자. 지현이는… 다리를 다쳤잖아. 데려가면 둘 다 못 나가.', 'smirk');
    const c = await s.choice('성아가 손을 내민다.', ['성아의 손을 잡는다', '지현에게 돌아간다']);
    if (c === 0) {
      await s.narrate('성아의 손은 얼음처럼 차가웠다. 성아가 처음으로, 소리 내어 웃었다.', 'serious');
      return s.ending(s.flag('tapeSubmitted') ? 'tuberose' : 'ebony');
    }
    s.flag('chooseJi', true);
    s.flag('seongaLeft', true);
    await s.say('성아', '…그래. 넌 그렇게 말할 줄 알았어.');
    s.despawn('seonga');
    s.refresh();
    await s.narrate('성아는 패를 무대 위에 내려놓고, 막 뒤 어둠 속으로 사라졌다.', 'serious');
    s.objective(s.has('first_aid') ? '지현에게 구급상자' : '대기실의 구급상자를 챙겨 지현에게');
  },

  // ---- 4-04 B: 火의 문 → 5장 미궁
  sealFire: async s => {
    if (!s.has('tablet_fire')) return s.narrate("손잡이 없는 낡은 문. 옆의 오각형 홈 가운데에 '火' 자가 새겨져 있다.", 'serious');
    const c = await s.choice('火의 패를 홈에 끼울까?', ['끼운다', '그만둔다']);
    if (c) return;
    s.cinema(true);
    s.take('tablet_fire');
    s.flag('sealFire', true);
    s.sfx('rumble');
    s.shake(1.2);
    await s.narrate("火의 패를 끼우자 '火' 자가 붉게, 이내 새하얗게 타올랐다.", 'surprised');
    s.door(36, 6, 'open');
    await s.narrate('문 너머에서 하얀 빛이 홍수처럼 쏟아졌다. 빛이 소영의 발목을 휘감는다.', 'scared');
    await s.say('소영', '희민아…!', 'surprised');
    await s.narrate('손을 뻗었지만— 소영은 빛 속으로 끌려 들어갔다.', 'scared');
    await s.cg('cg_maze');
    await s.narrate('끝없이 갈라지는 하얀 복도. 그 한가운데 창백한 소녀가 떠 있고, 발밑에 소영이 쓰러져 있다… 눈을 깜빡이자 둘 다 하얗게 지워졌다.', 'scared');
    if (s.flag('follower2') === 'jihyeon') await s.say('지현', '희, 희민아! 나, 나는 여기서 기다릴게…! 소영이 꼭 데려와!', 'scared');
    s.flag('follower', null);
    s.flag('follower2', null);
    await s.card('제5장 · 미궁', '다섯 기운의 길');
    await s.warp('maze', 1.5, 1.5, 'down');
    s.cinema(true);
    await s.narrate('사방이 하얀 벽. 미궁이다. 벽 어딘가에 오행의 패가 걸려 있다.', 'serious');
    await s.say('희민', '(서고의 수업 자료… 묶인 것을 풀 때는 누르는 차례, 다시 일으킬 때는 살리는 차례. 火에서 시작해 土, 金, 水, 木.)', 'serious');
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
