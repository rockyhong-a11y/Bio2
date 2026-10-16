// 제3장 · 신관(水) — 원작 리메이크판 진행 순서를 따른 탑뷰 각색(docs/story-bible.md 3-01~3-15). 대사·문서는 모두 새로 썼다.
//
// 흐름: 土 결계문 너머 연결 통로 → 신관 1층 로비(B: 소영 / A: 성아·지현, 성아는 따로)
//   3-01 역사관 앞 흔들림 → 3-02 역사관 학교 모형의 노란 카드키(마네킹이 쓰러져 유리가 깨짐 → 신관 수위 손달수 순찰 시작, A: 지현이 놀라 달아남)
//   → 3-04 무용실(노란 카드): CD를 오디오에 → 거울 속 도플갱어, 탄을 피하며 스피커를 거울 속 자리로 3라운드 → 빨간 카드키·추 50g
//   → 3층 계단 유리문(빨간 카드) → 4층(3-05): 열람실 도시락·신문고, 도서관1 실핀, 도서관2 지현(B: 셋이 됨 / A: 다시 동행), 자료실 지구본 노란 소형 열쇠
//   → 3-06 배전판 퓨즈 → 서고 에어컨 바람에 안내문이 떨어짐 → 서고 문 아래로 밀어 넣고 실핀으로 열쇠를 떨어뜨려 빼냄 → 서고: 태극패·수업 자료·강당 전원 안내
//   → 3-07 컴퓨터실 세계 시계(그리니치 시각 무작위) → 전기실 열쇠
//   → 3-08 2층 어학실: 역재생 테이프를 바로 돌려 듣기(숫자 4개) → 4층 카드 복사기(노랑·빨강 + 번호) → 파란 카드키
//   → 3-09 오컬트부(파란 카드): L로드·여우방울
//   → 3-10 (선택) B: 2층 휴게실에서 소영에게 캔커피 → 다이어리(순서가 중요) / A: 4층 열람실 앞 신문고에 테이프 투고
//   → 3-03 (선택) 1층 음악감상실(노란 소형 열쇠)의 괴담 쪽지 → 3층 교실을 적힌 번호 순서대로 들어가기(틀리면 천장에서 소녀가 떨어짐)
//   → 3-11 3층 교실 불을 게시판 메모 순서대로 켜고 전기실 레버 → 옥상 열쇠가 1층 중앙홀로 떨어짐(줍는 순간 손달수가 내려온다)
//   → 3-12 옥상 수영장: L로드가 가리키는 수맥 길로만 건너 밸브 손잡이 → 빨간 밸브로 물 빼기 → 인어가 말라 죽음 → 水의 패·파란 소형 열쇠
//   → 3-13 2층 水 결계문 → 중앙홀에 나타난 은미의 비명에 수위 둘 다 기절 → 3-14 은미 추격(발목 귀신은 연타로 뿌리침) → 4층 난간에서 추락(자정)
//   → 3-15 4층 차단기실: 서고 '강당 전원 안내'의 차단기 3개 → 3장 끝
// 동행: 2장과 같은 짜증 규칙(data/chapter2.js upset). B 루트 4층부터 지현은 2번째 동행(game.setFollower2, 짜증 판정 없음).
import { aff, upset, NAME } from './chapter2.js';

const F = k => g => !!g.flags[k];
const rnd4 = () => String(1000 + Math.floor(Math.random() * 9000));
const pick = (arr, n) => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).slice(0, n).map(v => v[1]);
const ROOMS = ['3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8', '3-9', '3-10', '3-11', '3-12'];
const list = (g, k) => String(g.flags[k] || '').split(',').filter(Boolean);

// ---------------------------------------------------------------- 아이템
export const items = {
  card_yellow: { name: '노란 카드키', desc: '역사관 학교 모형 위에 있던 카드키. 노란 전자록을 연다.' },
  card_red: { name: '빨간 카드키', desc: '무용실 거울이 깨진 자리에서 나온 카드키. 빨간 전자록을 연다.' },
  card_blue: { name: '파란 카드키', desc: '카드 복사기에서 나온 새 카드키. 파란 전자록을 연다.' },
  weight50: { name: '추 50g', desc: '놋쇠로 된 50g짜리 저울추. 깨진 거울 조각 사이에 떨어져 있었다.' },
  pin: { name: '실핀', desc: '도서관1 책상 위에 있던 가느다란 실핀.' },
  key_small_yellow: { name: '노란 소형 열쇠', desc: "노란 꼬리표가 달린 작은 열쇠. 꼬리표에 '음감실'.", icon: 'key' },
  lunchbox: { name: '도시락', desc: '열람실 책상에 남겨진 보자기 도시락. 이상하게… 아직 따뜻하다. (먹으면 체력 회복)', use: 'eatLunch' },
  archive_notice: { name: '서고 안내문', desc: "코팅된 안내문. '서고 출입 시 반드시 사서 선생님께 말씀드릴 것'." },
  key_archive: { name: '서고 열쇠', desc: '서고 문 안쪽에 꽂혀 있던 열쇠.', icon: 'key' },
  taeguk: { name: '태극패', desc: '태극 문양이 새겨진 둥근 패. 서고 가장 안쪽 상자에 들어 있었다.' },
  key_elec: { name: '전기실 열쇠', desc: '3층 전기실 열쇠. 세계 시계 뒤에서 나왔다.', icon: 'key' },
  lrod: { name: 'L로드', desc: '수맥을 찾는 L자 막대 두 개. 물 위에서 막대가 벌어지는 쪽에 길이 있다고 한다.' },
  fox_bell: { name: '여우방울', desc: '붉은 끈에 달린 작은 방울. 흔들어도 소리가 나지 않는다.' },
  key_roof: { name: '옥상 열쇠', desc: "3층 전등 위에 걸려 있다가 떨어진 열쇠. 꼬리표에 '옥상'.", icon: 'key' },
  valve_handle: { name: '밸브 손잡이', desc: '빨간 원형 손잡이. 수영장 배수 밸브에 맞을 것 같다.' },
  tablet_water: { name: '水의 패', desc: "'水' 자가 새겨진 오각형 패. 차갑고, 손에 쥐면 물기가 배어 나온다." },
  key_small_blue: { name: '파란 소형 열쇠', desc: '물 빠진 수영장 구석에서 주운 작은 열쇠. 어디에 쓰는 걸까.', icon: 'key' },
};

// ---------------------------------------------------------------- 문서 (전부 새로 쓴 글)
export const docs = {
  history: {
    title: '연두고등학교 연혁 — 이사장실 보관용',
    body: `1959  사립 연두학원 설립. 본관 1구역 준공.
1971  본관 2구역 증축. 교정 동쪽에 연못 '청연지' 조성 — 초대 이사장의 뜻.
1983  연못에서 학생 익사 사고. 이후 해마다 봄이면 같은 자리에서 사고가 이어짐.
1990  학부모회의 요구로 연못을 메우기로 결정. 이사회 일부는 '연못이 있어야 학교의 기가 돈다'며 끝까지 반대.
1992  연못 자리에 신관 준공(3학년 교실·도서관·무용실). 옥상에 수영장 설치 — 반대하던 이사들이 내건 조건.
1998  본관 1구역 가사실습실 화재.
2000  야간 출입 전면 금지. 수위 2인 체제(본관 이봉구·신관 손달수).`,
  },
  oheng: {
    title: '[동양학 소양] 오행 — 교감 이상문',
    body: `만물은 나무(木)·불(火)·흙(土)·쇠(金)·물(水), 다섯 기운이 돌고 돌며 이루어진다.

상생(相生) — 서로 살린다
나무는 불을, 불은 흙을, 흙은 쇠를, 쇠는 물을, 물은 다시 나무를 살린다.
木 → 火 → 土 → 金 → 水 → 木

상극(相剋) — 서로 누른다
쇠는 나무를, 나무는 흙을, 흙은 물을, 물은 불을, 불은 쇠를 누른다.
金 → 木 → 土 → 水 → 火 → 金

※ 묶인 것을 풀 때는 누르는 차례를, 다시 일으킬 때는 살리는 차례를 따른다 — 옛 문헌의 한 구절. (시험에는 나오지 않음)`,
  },
  power_guide: {
    title: '강당 전원 안내 — 시설과',
    body: g => `강당 쪽 전원은 4층 차단기실 차단기 6개 가운데 아래 셋으로만 넣는다.
나머지를 함께 올리면 과부하로 신관 전체가 내려가니 절대 손대지 말 것.

  강당 전원: ${list(g, 'breakerCode').join(' · ')}번

(번호는 차단기 함 왼쪽부터 1~6)`,
  },
  clock_table: {
    title: '세계 시차표 — 컴퓨터부 전시물 설명서',
    body: `그리니치 표준시(GMT) 기준

  서울        +9시간
  베이징      +8시간
  모스크바    +3시간
  뉴욕        −5시간

벽시계는 24시간제. 가운데 그리니치 시계에 맞춰 나머지 넷을 맞추면 시계판 뒤 잠금이 풀린다.`,
  },
  copier_manual: {
    title: '카드 복사기 사용법 — 교무부',
    body: `1. 노란 카드와 빨간 카드를 양쪽 투입구에 꽂는다.
2. 확인 번호 4자리를 누른다.
3. 파란 카드가 나온다.

확인 번호는 2층 어학실 듣기 평가 테이프에 녹음되어 있음.
(테이프는 반드시 앞으로 돌려서 들을 것 — 거꾸로 들으면 엉뚱한 소리가 남)`,
  },
  star_memo: {
    title: '3층 게시판 — 별자리 메모',
    body: g => `전기실 레버를 내리기 전에, 아래 차례대로 교실 불을 켜야 한다. 차례가 틀리면 처음부터.

  ${list(g, 'lightSeq').map(n => '3-' + n).join(' → ')}

이렇게 켜 두면 운동장에서 신관을 올려다볼 때 별자리가 된다나.
(불이 켜지면 수위 아저씨가 금방 올라오니 빨리 할 것)`,
  },
  ghost_corner: {
    title: '학원 괴담 — 구석에서 노는 아이',
    body: g => `3학년 교실 천장 구석에는, 숨바꼭질을 하다 아무도 찾아 주지 않은 아이가 산다고 한다.
아이는 자기가 숨은 교실을 '차례대로' 찾아오는 사람만 반긴다.
차례를 건너뛰거나 거꾸로 찾아오면, 천장에서 거꾸로 떨어져 내려와 얼굴을 들이민다.

레코드 사이에 끼워져 있던 쪽지:
「${list(g, 'spiderList').map(n => '3-' + n).join(', ')} … 작은 번호부터 찾아와」`,
  },
  occult_note: {
    title: '오컬트부 활동 일지 — 3월 2일',
    body: `· L로드: 물 위에 서면 두 막대가 벌어지는 쪽으로 '물길'이 있다. 옥상 수영장에서 실험 예정(부장 허락 받을 것).
· 여우방울: 본관 2구역과 신관 사이 연결 통로에서만 운다. 방울이 있으면 '그 복도'에서 길을 잃지 않는다고 함.
· 옥상 수영장 물에는 밤에 절대 손대지 말 것. 물속에서 누가 머리를 빗고 있었다는 목격담만 세 건.`,
  },
};

// ---------------------------------------------------------------- 신관 수위 손달수(바이블 8-1: 이봉구보다 빠르고 시야가 넓고 공격이 빠르다, 3대에 쓰러짐, 휘파람)
const DALSU = (x, y, patrol) => ({ id: 'dalsu', kind: 'janitor', skin: 'dalsu', x, y, dir: 'left', patrol, patrolSpeed: 2.1, chaseSpeed: 3.55, view: 8, fov: 1.05, dmg: 34, hitRate: 1.0, signal: 'whistle' });
const dalsuOn = g => !!g.flags.dalsuOn && !g.flags.janitorsOut;
const PD1 = [[36.5, 10.5], [3.5, 10.5], [19.5, 8.5], [19.5, 12.4], [36.5, 10.2]];
const PD3 = [[50.5, 10.5], [8.5, 10.5], [25.5, 8.5], [25.5, 12.4], [50.5, 10.2]];
const PD4 = [[37.5, 10.5], [3.5, 10.5], [19.5, 8.5], [19.5, 12.4], [37.5, 10.2]];

// 은미(3-14): 길을 찾아 쫓는다. 플레이어보다 조금 느리다
const EUNMI = (x, y) => ({ id: 'eunmi', kind: 'ghost', skin: 'eunmi', x, y, chase: true, phase: false, pathfind: true, speed: 3.2, dmg: 30, glow: '220,120,170' });

// 무용실 도플갱어(3-04): 거울 앞 줄에서 플레이어의 x를 따라가며, 무용실 안에 있을 때만 탄을 쏜다. 라운드마다 빨라진다
const SHOTS = [null, { every: 1.4, speed: 4, dmg: 8 }, { every: 1.1, speed: 5, dmg: 8 }, { every: 0.9, speed: 6, dmg: 8 }];
const DOPPEL = n => ({ id: 'doppel', kind: 'ghost', skin: 'doppel', x: 31.5, y: 1.5, mirrorY: 1.5, mirrorX: [26, 37], speed: 2.4, alpha: 0.85, glow: '210,90,90', shoot: SHOTS[n], shootZone: [25, 1, 39, 8], cond: g => g.flags.mirrorRound === n && !g.flags.mirrorDone });
// 라운드: 스피커 시작 자리 → 거울 속 자리(바닥 표시)
const ROUNDS = [null, { from: [28, 5], to: [30, 3] }, { from: [35, 5], to: [33, 2] }, { from: [31, 6], to: [35, 3] }];
const speakerAt = g => (typeof g.flags.spk === 'string' ? g.flags.spk.split(',').map(Number) : ROUNDS[g.flags.mirrorRound || 1].from);
const mirrorOn = g => g.flags.mirrorRound > 0 && !g.flags.mirrorDone;

// ---------------------------------------------------------------- 맵 공통
const moon = (x, y) => ({ x, y, r: 3.4, color: '120,140,200', a: 0.5 });
const fluo = (x, y, flag, r = 4.6) => ({ x, y, r, color: '240,244,255', a: 0.9, flag, fx: 'fluo' });
const vend = (x, y) => ({ x, y, r: 2, color: '255,110,110', a: 0.55, los: false, fx: 'vend' });
const EXIT = [{ x: 1.5, y: 8.6, color: '60,255,120' }];
const stall = (id, x, y) => ({ id, on: 'act', x, y, run: s => s.hide(x + 0.5, y + 1.4) });
const locker = (id, x, y) => ({ id, on: 'act', x, y, run: s => s.hide(x + 0.5, y + 0.6) });
const desks4 = (x0, y0) => [[0, 0], [2, 0], [0, 2], [2, 2]].map(([dx, dy]) => ({ s: 'desk', x: x0 + dx, y: y0 + dy, solid: true }));

// 계단: 왼쪽(1~2열) 위층, 오른쪽(4~5열) 아래층. 3층 → 4층은 빨간 카드키(유리문), 4층 → 옥상은 옥상 열쇠
export const FLOORS = ['shingwan_1f', 'shingwan_2f', 'shingwan_3f', 'shingwan_4f'];
const stairsTo = to => async s => {
  const id = s.flag('follower'), a = id && s.actor(id), p = s.player();
  const left = a && a.follow && Math.hypot(a.x - p.x, a.y - p.y) > 6 && !s.flag('eunmiChase'); // 동행을 멀리 두고 층을 옮기면 짜증
  if (to === 'shingwan_roof') await s.warp(to, 3.5, 14.2, 'right');
  else if (s.g.mapId === 'shingwan_roof') await s.warp(to, 2, 4.6, 'down');
  else {
    const up = FLOORS.indexOf(to) > FLOORS.indexOf(s.g.mapId);
    await s.warp(to, up ? 5 : 2, 4.6, 'down');
  }
  if (left) await upset(s, id, 'left');
};
const GATES = {
  3: ['card_red', '4층으로 오르는 계단 앞 유리문. 손잡이 옆에 빨간 카드 리더기가 붙어 있다.'],
  4: ['key_roof', '옥상으로 오르는 철문. 굳게 잠겨 있다.'],
};
const stairEvents = n => {
  const ev = [], gate = GATES[n];
  const up = n < 4 ? FLOORS[n] : 'shingwan_roof';
  ev.push({ id: 'sup' + n, on: 'touch', x: 1, y: 1, w: 2, h: 1, run: stairsTo(up), cond: gate ? g => g.has(gate[0]) : null });
  if (gate) ev.push({ id: 'sgate' + n, on: 'act', x: 1, y: 3, w: 2, text: gate[1], face: 'serious', cond: g => !g.has(gate[0]) });
  if (n > 1) ev.push({ id: 'sdown' + n, on: 'touch', x: 4, y: 1, w: 2, h: 1, run: stairsTo(FLOORS[n - 2]) });
  else ev.push({ id: 'sgate1', on: 'act', x: 4, y: 3, w: 2, text: '아래로 내려가는 계단. 녹슨 셔터가 내려와 있다.', face: 'default' });
  return ev;
};
const stairGate = n => (GATES[n] ? [{ s: 'stair_gate', x: 1, y: 3, w: 2, solid: true, when: g => !g.has(GATES[n][0]) }] : []);

// 3층 교실: 이름 → [안쪽 왼쪽 끝 x, 오른쪽 끝 x, 위(true)/아래]
const ROOM3 = {
  1: [7, 12, true], 2: [14, 19, true], 3: [32, 37, true], 4: [39, 44, true], 5: [46, 51, true],
  6: [1, 6, false], 7: [8, 13, false], 8: [15, 20, false], 9: [22, 29, false], 10: [31, 36, false], 11: [38, 43, false], 12: [45, 51, false],
};
// 교실 안쪽 칸 범위(위 교실 1~7행, 아래 13~18행, 3-9는 홀 아래라 14~18행)
const roomRect = n => { const [a, b, top] = ROOM3[n]; return top ? [a, 1, b, 7] : +n === 9 ? [a, 14, b, 18] : [a, 13, b, 18]; };
// 전등 스위치: 위 교실은 복도 쪽 문 왼쪽 벽(복도에서 조사), 아래 교실은 교실 안 문 왼쪽 벽(교실 안에서 조사)
const switchAt = n => { const [a, , top] = ROOM3[n]; return top ? [a + 1, 8] : +n === 9 ? [23, 13] : [a + 1, 12]; };
const roomCenter = n => { const [x0, y0, x1, y1] = roomRect(n); return [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2]; };
const switchProps = () => Object.keys(ROOM3).map(n => { const [x, y] = switchAt(n); return { s: g => (g.flags['light_' + n] ? 'light_switch_on' : 'light_switch'), x, y, lift: 10 }; });

// 옥상 수영장 수맥 길(L로드가 가리키는 칸): 남쪽 데크 (6,13) → … → 북쪽 데크 (17,4)
export const POOL_PATH = [[6, 12], [6, 11], [6, 10], [7, 10], [8, 10], [9, 10], [9, 9], [9, 8], [10, 8], [11, 8], [12, 8], [12, 7], [13, 7], [14, 7], [14, 6], [15, 6], [16, 6], [17, 6], [17, 5]];
const SAFE = new Set(POOL_PATH.map(([c, r]) => `${c},${r}`));
const MERMAID_LOOP = [[1.5, 5.5], [28.5, 5.5], [28.5, 12.5], [1.5, 12.5]];

// ---------------------------------------------------------------- 맵
export const maps = {
  shingwan_1f: {
    id: 'shingwan_1f',
    name: '신관 1층',
    noiseMul: 1.25, // 시멘트 바닥: 발소리가 울린다
    grid: [
      '########################################',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,,,,,,,,#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,,,,,,,,#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,,,,,,,,#',
      '#:::::#,,,,,,,,D,,,,,,,,#,,,,,,,,,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,,,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,,,,,,,,#',
      '#:::::#,,,,,,,,##########,,,,,,,,,,,,,,#',
      '##:::######D####........#######D########',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#####D######D###........######:::#######',
      '#,,,,,,,,#_____#####D####::::::::::::::#',
      '#,,,,,,,,#_____#,,,,,,,,#::::::::::::::#',
      '#,,,,,,,,#_____#,,,,,,,,#::::::::::::::#',
      '#,,,,,,,,#_____#,,,,,,,,#::::::::::::::#',
      '#,,,,,,,,##_#_##,,,,,,,,#::::::::::::::#',
      '#,,,,,,,,##_#_##,,,,,,,,#::::::::::::::#',
      '#WWWWWWWWWWWWWWWWWWWWWWW#WWWWWWWWWDWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 11, y: 8 },
      { x: 15, y: 4 },
      { x: 31, y: 8, locked: 'card_yellow', lockedText: '무용실. 문 옆에 노란 카드 리더기가 붙어 있다.', lockedFace: 'serious' },
      { x: 5, y: 12 }, { x: 12, y: 12 },
      { x: 20, y: 13, locked: 'key_small_yellow', lockedText: "음악감상실. 작은 자물쇠가 걸려 있다. '음감실' 꼬리표가 달린 열쇠가 필요할 것 같다.", lockedFace: 'default' },
      { x: 34, y: 19, sprite: 'sealdoor', locked: true, lockedText: '연결 통로로 나가는 문.', lockedFace: 'serious' },
    ],
    props: [
      { s: 'stair_gate', x: 4, y: 3, w: 2, solid: true },
      // 역사관
      { s: 'history_board', x: 10, y: 0, w: 2 },
      { s: g => (g.flags.modelTaken ? 'school_model_taken' : 'school_model'), x: 10, y: 3, w: 2, solid: true },
      { s: 'glass_case', x: 7, y: 1, solid: true }, { s: 'glass_case', x: 14, y: 1, solid: true },
      { s: 'mannequin', x: 8, y: 5, solid: true },
      { s: 'mannequin', x: 13, y: 3, solid: true, when: g => !g.flags.mannequinFell },
      { s: 'mannequin_fallen', x: 12, y: 5, w: 2, when: F('mannequinFell') },
      // 이사장실
      { s: 'teacher_desk', x: 19, y: 2, w: 2, solid: true },
      { s: 'sofa', x: 17, y: 5, w: 2, solid: true },
      { s: 'file_cabinet', x: 23, y: 1, solid: true },
      // 무용실
      { s: g => (g.flags.mirrorDone ? 'dance_mirror_broken' : ['dance_mirror', 'dance_mirror', 'dance_mirror_crack1', 'dance_mirror_crack2'][g.flags.mirrorRound || 0]), x: 28, y: 0, w: 4 },
      { s: 'ballet_barre', x: 33, y: 0, w: 3 },
      { s: 'stereo', x: 37, y: 1, solid: true },
      { s: 'elock_yellow', x: 32, y: 8 },
      { s: 'speaker', x: 28, y: 5, at: speakerAt, solid: true, when: mirrorOn },
      { s: 'speaker_target', x: 30, y: 3, at: g => ROUNDS[g.flags.mirrorRound || 1].to, floor: true, when: mirrorOn },
      // 매점
      { s: 'meal_counter', x: 2, y: 13, w: 3, solid: true },
      ...desks4(3, 15),
      // 화장실
      { s: 'sink', x: 10, y: 13, solid: true }, { s: 'sink', x: 14, y: 13, solid: true },
      // 음악감상실
      { s: 'lp_shelf', x: 16, y: 14, w: 2, solid: true }, { s: 'lp_shelf', x: 22, y: 14, w: 2, solid: true },
      { s: 'listen_booth', x: 19, y: 16, w: 2, solid: true },
      // 로비
      { s: 'lockers', x: 26, y: 13, solid: true },
      { s: 'umbrella_stand', x: 25, y: 17, solid: true },
      { s: 'bulletin', x: 7, y: 8, w: 2 },
      { s: 'exit_sign', x: 1, y: 8 },
    ],
    lights: [
      moon(19.5, 10.2), moon(4, 18), moon(14, 18), moon(29, 18), moon(36, 18),
      { x: 10.5, y: 3, r: 3.2, color: '170,190,230', a: 0.45 }, // 역사관 진열장 비상등
      { x: 31.5, y: 2.5, r: 3.6, color: '150,170,230', a: 0.4 },  // 무용실 거울 반사
    ],
    glows: EXIT,
    actors: [
      { ...DALSU(36.5, 10.5, PD1), cond: dalsuOn },
      DOPPEL(1), DOPPEL(2), DOPPEL(3),
    ],
    events: [
      ...stairEvents(1),
      { id: 'save31', on: 'act', x: 7, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      // 3-01 흔들림 / 3-02 학교 모형
      { id: 'quake', on: 'touch', x: 7, y: 9, w: 8, h: 3, once: true, run: 'quake' },
      { id: 'model', on: 'act', x: 10, y: 3, w: 2, run: 'schoolModel' },
      { id: 'board31', on: 'act', x: 10, y: 0, w: 2, text: '학교 연혁을 적은 액자. 맨 아래 줄은 누가 긁어 지운 듯 하얗게 벗겨져 있다.', face: 'serious' },
      { id: 'case31', on: 'act', x: 7, y: 1, text: '옛 교복과 빛바랜 단체 사진이 든 진열장.', face: 'default' },
      { id: 'case32', on: 'act', x: 14, y: 1, text: '개교 기념 상패들. 유리에 손자국이 잔뜩 묻어 있다… 안쪽에서.', face: 'scared' },
      { id: 'mannequin31', on: 'act', x: 8, y: 5, text: '얼굴 없는 마네킹이 옛 교복을 입고 서 있다. 고개가… 아까보다 이쪽으로 돌아간 것 같다.', face: 'scared' },
      { id: 'history', on: 'act', x: 19, y: 2, w: 2, run: 'historyDoc' },
      // 3-04 무용실
      { id: 'stereo', on: 'act', x: 37, y: 1, run: 'stereo' },
      { id: 'speaker', on: 'act', x: 28, y: 5, at: speakerAt, run: 'pushSpeaker', cond: mirrorOn },
      { id: 'mirror', on: 'act', x: 28, y: 0, w: 4, run: 'mirrorLook' },
      // 3-11 → 옥상 열쇠
      { id: 'roofKey', on: 'act', x: 19, y: 10, item: 'key_roof', text: '중앙홀 바닥 한가운데, 열쇠 하나가 떨어져 있다.', face: 'default', cond: F('keyDropped'), after: 'roofKeyTaken' },
      // 매점·화장실
      { id: 'coin31', on: 'act', x: 3, y: 13, item: 'coin', text: '배식대 아래 틈에 동전이 하나 끼어 있다.', face: 'default' },
      { id: 'trays', on: 'act', x: 3, y: 15, text: '식판에 반찬이 그대로 남아 있다. 숟가락 자국 하나 없이, 오래전부터 그대로인 것처럼.', face: 'scared' },
      stall('st31', 11, 17), stall('st32', 13, 17),
      // 3-03 음악감상실
      { id: 'listen', on: 'act', x: 19, y: 16, w: 2, run: 'spiderNote' },
      { id: 'lp31', on: 'act', x: 16, y: 14, w: 2, text: '클래식 레코드가 빼곡하다. 한 장이 반쯤 빠져나와 있다.', face: 'default' },
      // 로비
      locker('lock31', 26, 13),
      { id: 'backDoor', on: 'act', x: 34, y: 19, run: 'backDoor' },
    ],
  },

  shingwan_2f: {
    id: 'shingwan_2f',
    name: '신관 2층',
    noiseMul: 1.25,
    grid: [
      '#######WWWWWWWW#WWWWWWWW#WWWWWWW#WWWWWW#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#####D####,,,,,,,#,,,,,,#',
      '##:::######D####........####D######D####',
      '#.................OOOO.................#',
      '#.................OOOO.................#',
      '#.................OOOO.................#',
      '####D#######D###........####D#######D###',
      '#::::::::#,,,,,#####D####,,,,,,,,#_____#',
      '#::::::::#,,,,,#,,,,,,,,#,,,,,,,,#_____#',
      '#::::::::#,,,,,#,,,,,,,,#,,,,,,,,#_____#',
      '#::::::::#,,,,,#,,,,,,,,#,,,,,,,,#_____#',
      '#::::::::#,,,,,#,,,,,,,,#,,,,,,,,##_#_##',
      '#::::::::#,,,,,#,,,,,,,,#,,,,,,,,##_#_##',
      '#########WWWWWWWWWWWWWWWWWWWWWWWW#######',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 11, y: 8 }, { x: 20, y: 7 }, { x: 28, y: 8 }, { x: 35, y: 8 },
      { x: 4, y: 12, sprite: 'sealdoor', locked: true, lockedText: "손잡이 없는 낡은 문. 옆에 '水' 자가 새겨진 오각형 홈이 있다.", lockedFace: 'serious' },
      { x: 12, y: 12 }, { x: 20, y: 13 }, { x: 28, y: 12 }, { x: 36, y: 12 },
    ],
    props: [
      // 어학실
      { s: 'lab_desk', x: 8, y: 2, w: 2, solid: true }, { s: 'lab_desk', x: 11, y: 2, w: 2, solid: true },
      { s: 'lab_desk', x: 8, y: 5, w: 2, solid: true }, { s: 'lab_desk', x: 11, y: 5, w: 2, solid: true },
      // 진로상담실
      { s: 'desk', x: 18, y: 2, solid: true }, { s: 'sofa', x: 20, y: 4, w: 2, solid: true }, { s: 'file_cabinet', x: 16, y: 1, solid: true },
      // 휴게실
      { s: 'sofa', x: 26, y: 3, w: 2, solid: true }, { s: 'vending', x: 31, y: 1, solid: true }, { s: 'plant', x: 25, y: 1, solid: true },
      // 3학년 교무실
      { s: 'teacher_desk', x: 34, y: 3, w: 2, solid: true }, { s: 'teacher_desk', x: 34, y: 5, w: 2, solid: true }, { s: 'file_cabinet', x: 38, y: 1, solid: true },
      // 복도
      { s: 'seal_slot', x: 5, y: 12 },
      { s: 'bulletin', x: 24, y: 8, w: 2 }, { s: 'exit_sign', x: 1, y: 8 },
      // 보건실·방송반·연구실·화장실
      { s: 'bed', x: 10, y: 14, w: 2, solid: true }, { s: 'bed', x: 10, y: 17, w: 2, solid: true }, { s: 'desk', x: 13, y: 16, solid: true },
      { s: 'speaker', x: 16, y: 14, solid: true }, { s: 'desk', x: 19, y: 15, solid: true }, { s: 'tv', x: 22, y: 14, solid: true },
      { s: 'teacher_desk', x: 26, y: 14, w: 2, solid: true }, { s: 'teacher_desk', x: 29, y: 14, w: 2, solid: true },
      { s: 'sink', x: 34, y: 13, solid: true }, { s: 'sink', x: 38, y: 13, solid: true },
    ],
    lights: [
      moon(10, 1.5), moon(19, 1.5), moon(28, 1.5), moon(35, 1.5),
      moon(12, 18), moon(20, 18), moon(29, 18),
      vend(31.5, 2.1),
    ],
    glows: EXIT,
    actors: [],
    events: [
      ...stairEvents(2),
      { id: 'save32', on: 'act', x: 24, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      { id: 'sealWater', on: 'act', x: 4, y: 12, run: 'sealWater', cond: g => !g.flags.sealOpen },
      { id: 'langLab', on: 'act', x: 8, y: 2, w: 2, run: 'langLab' },
      { id: 'lab32', on: 'act', x: 11, y: 2, w: 2, text: '헤드폰이 걸린 어학실 책상. 카세트 데크는 비어 있다.', face: 'default' },
      { id: 'coin32', on: 'act', x: 18, y: 2, item: 'coin', text: '진로상담실 책상 서랍에 동전이 굴러다닌다.', face: 'default' },
      { id: 'vend32', on: 'act', x: 31, y: 1, run: 'vending3' },
      { id: 'rest', on: 'touch', x: 25, y: 1, w: 7, h: 7, run: 'restStart', cond: g => g.flags.route === 'B' && g.flags.follower === 'soyoung' && !g.flags.restDone && !g.flags.resting && (g.has('can_coffee') || g.has('diary')) },
      { id: 'desk32', on: 'act', x: 34, y: 3, w: 2, text: "3학년 담임들의 책상. 모의고사 성적표 위에 '야간 자습 금지' 공문이 놓여 있다.", face: 'default' },
      { id: 'drink32', on: 'act', x: 13, y: 16, item: 'drink', text: '보건실 책상 위에 음료수가 한 병 남아 있다.', face: 'default' },
      { id: 'tv32', on: 'act', x: 22, y: 14, text: '방송반 모니터. 꺼져 있는데도 화면 속에 누군가 서 있는 것 같다.', face: 'scared' },
      stall('st33', 35, 17), stall('st34', 37, 17),
    ],
  },

  shingwan_3f: {
    id: 'shingwan_3f',
    name: '신관 3층',
    noiseMul: 1.25,
    grid: [
      '#######WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW#',
      '#==#==#,,,,,,#,,,,,,##,,,,,,,,##,,,,,,#,,,,,,#,,,,,,#',
      '#==#==#,,,,,,#,,,,,,##,,,,,,,,##,,,,,,#,,,,,,#,,,,,,#',
      '#==#==#,,,,,,#,,,,,,##,,,,,,,,##,,,,,,#,,,,,,#,,,,,,#',
      '#:::::#,,,,,,#,,,,,,##,,,,,,,,##,,,,,,#,,,,,,#,,,,,,#',
      '#:::::#,,,,,,#,,,,,,##,,,,,,,,##,,,,,,#,,,,,,#,,,,,,#',
      '#:::::#,,,,,,#,,,,,,##,,,,,,,,##,,,,,,#,,,,,,#,,,,,,#',
      '#:::::#,,,,,,#,,,,,,#####D######,,,,,,#,,,,,,#,,,,,,#',
      '##:::####D######D#####........####D######D######D####',
      '#.......................OOOO........................#',
      '#.......................OOOO........................#',
      '#.......................OOOO........................#',
      '###D######D######D####........###D######D######D#####',
      '#,,,,,,#,,,,,,#,,,,,,####D#####,,,,,,#,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,#,,,,,,#,,,,,,,,#,,,,,,#,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,#,,,,,,#,,,,,,,,#,,,,,,#,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,#,,,,,,#,,,,,,,,#,,,,,,#,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,#,,,,,,#,,,,,,,,#,,,,,,#,,,,,,#,,,,,,,#',
      '#,,,,,,#,,,,,,#,,,,,,#,,,,,,,,#,,,,,,#,,,,,,#,,,,,,,#',
      '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      ...[1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12].map(n => { const [a, , top] = ROOM3[n]; return { x: a + 2, y: top ? 8 : 12 }; }),
      { x: 25, y: 13 },
      { x: 25, y: 7, locked: 'key_elec', lockedText: "전기실. '관계자 외 출입 금지'. 잠겨 있다.", lockedFace: 'default' },
    ],
    props: [
      ...stairGate(3),
      { s: 'elock_red', x: 3, y: 3 }, // 계단 유리문 옆 빨간 카드 리더기
      ...[1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12].flatMap(n => { const [x0, y0] = roomRect(n); return desks4(x0 + 1, y0 + 2); }),
      ...desks4(23, 15), ...desks4(26, 15).slice(0, 2),
      ...switchProps(),
      { s: 'lockers', x: 12, y: 1, solid: true }, { s: 'lockers', x: 13, y: 13, solid: true }, { s: 'lockers', x: 43, y: 13, solid: true },
      { s: 'bulletin', x: 5, y: 8, w: 2 }, { s: 'bulletin', x: 12, y: 8, w: 2 }, { s: 'exit_sign', x: 1, y: 8 },
      // 전기실
      { s: 'tall_cabinet', x: 23, y: 1, solid: true },
      { s: g => (g.flags.leverDone ? 'power_lever_down' : 'power_lever'), x: 27, y: 1, solid: true },
    ],
    lights: [
      ...Object.keys(ROOM3).map(n => { const [cx, cy] = roomCenter(n); return fluo(cx, cy, 'light_' + n); }),
      moon(25.5, 10.2),
    ],
    glows: EXIT,
    actors: [{ ...DALSU(50.5, 10.5, PD3), cond: dalsuOn }],
    events: [
      ...stairEvents(3),
      { id: 'star', on: 'act', x: 5, y: 8, w: 2, run: 'starMemo', cond: g => g.player.y > 8 },
      { id: 'save33', on: 'act', x: 12, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      // 3-14 추격: 계단참 발목 귀신
      { id: 'ankle3', on: 'touch', x: 1, y: 5, w: 5, h: 2, once: true, run: 'ankle', cond: F('eunmiChase') },
      // 3-11 교실 불 스위치 / 3-03 교실 드나들기(스크립트 없이 바로 판정)
      ...Object.keys(ROOM3).map(n => { const [x, y] = switchAt(n), top = ROOM3[n][2]; return { id: 'sw' + n, on: 'act', x, y, run: s => lightSwitch(s, n), cond: g => (top ? g.player.y > 8 : g.player.y > y) }; }),
      ...Object.keys(ROOM3).map(n => { const [x0, y0, x1, y1] = roomRect(n); return { id: 'room' + n, on: 'touch', x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, sync: spiderEnter(n), cond: g => g.flags.spiderActive && !g.flags.spiderDone && g.flags.spiderAt !== n }; }),
      { id: 'hall3', on: 'touch', x: 1, y: 9, w: 51, h: 3, sync: g => { g.flags.spiderAt = 0; }, cond: g => !!g.flags.spiderAt },
      { id: 'lever', on: 'act', x: 27, y: 1, run: 'lever' },
      { id: 'cab33', on: 'act', x: 23, y: 1, text: '배선이 엉킨 철제 캐비닛. 손대지 않는 게 좋겠다.', face: 'default' },
      locker('lock33', 12, 1), locker('lock34', 13, 13), locker('lock35', 43, 13),
    ],
  },

  shingwan_4f: {
    id: 'shingwan_4f',
    name: '신관 4층',
    noiseMul: 1.25,
    grid: [
      '#######WWWWWWWW#WWWWWWWW#WWWWWWW########',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#==#==#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,D,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#:::::#,,,,,,,,#####D####,,,,,,,#,,,,,,#',
      '##:::######D####........####D###########',
      '#.................OOOO.................#',
      '#.................OOOO.................#',
      '#.................OOOO.................#',
      '####D#######D###........####D######D####',
      '#,,,,,,,,#,,,,,#####D####,,,,,,,#,,,,,,#',
      '#,,,,,,,,#,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#,,,,,,,,#,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#,,,,,,,,#,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#,,,,,,,,#,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#,,,,,,,,#,,,,,#,,,,,,,,#,,,,,,,#,,,,,,#',
      '#WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 11, y: 8 }, { x: 20, y: 7 }, { x: 28, y: 8 },
      { x: 32, y: 4, locked: 'key_archive', lockedText: '서고. 잠겨 있다. 문틈으로 서늘한 바람이 새어 나온다.', lockedFace: 'default' },
      { x: 4, y: 12 }, { x: 12, y: 12 },
      { x: 20, y: 13, locked: 'card_blue', lockedText: '오컬트부. 문 옆에 파란 카드 리더기가 붙어 있다.', lockedFace: 'serious' },
      { x: 28, y: 12 }, { x: 35, y: 12 },
    ],
    props: [
      ...stairGate(4),
      // 열람실
      { s: 'reading_table', x: 8, y: 3, w: 3, solid: true }, { s: 'reading_table', x: 8, y: 5, w: 3, solid: true },
      { s: 'bookcase', x: 12, y: 1, w: 2, solid: true },
      { s: 'sinmungo', x: 14, y: 9, solid: true },
      // 도서관1
      { s: 'bookcase', x: 16, y: 1, w: 2, solid: true }, { s: 'bookcase', x: 19, y: 1, w: 2, solid: true }, { s: 'bookcase', x: 22, y: 1, w: 2, solid: true },
      { s: 'reading_table', x: 18, y: 4, w: 3, solid: true },
      // 도서관2
      { s: 'bookcase', x: 25, y: 1, w: 2, solid: true }, { s: 'bookcase', x: 29, y: 1, w: 2, solid: true },
      { s: 'reading_table', x: 26, y: 5, w: 3, solid: true },
      { s: 'archive_paper', x: 31, y: 4, floor: true, when: g => g.flags.noticeFell && !g.flags['ev:notice'] },
      // 서고
      { s: g => (g.flags.fuseOn ? 'aircon_on' : 'aircon'), x: 35, y: 0, w: 2 },
      { s: 'bookcase', x: 33, y: 1, w: 2, solid: true }, { s: 'bookcase', x: 37, y: 1, w: 2, solid: true },
      { s: 'desk', x: 35, y: 5, solid: true }, { s: 'file_cabinet', x: 38, y: 6, solid: true },
      // 복도
      { s: g => (g.flags.fuseOn ? 'fuse_panel_on' : 'fuse_panel'), x: 34, y: 8 },
      { s: 'card_copier', x: 7, y: 9, solid: true },
      { s: 'bulletin', x: 24, y: 8, w: 2 }, { s: 'exit_sign', x: 1, y: 8 },
      // 컴퓨터실·자료실·오컬트부·차단기실·창고
      { s: 'pc_desk', x: 2, y: 14, w: 2, solid: true }, { s: 'pc_desk', x: 5, y: 14, w: 2, solid: true },
      { s: 'pc_desk', x: 2, y: 16, w: 2, solid: true }, { s: 'pc_desk', x: 5, y: 16, w: 2, solid: true },
      { s: 'world_clocks', x: 5, y: 12, w: 3 },
      { s: 'shelf', x: 10, y: 13, w: 2, solid: true }, { s: 'globe', x: 12, y: 15, solid: true },
      { s: 'occult_rug', x: 20, y: 15, w: 2, h: 2, floor: true },
      { s: 'occult_table', x: 17, y: 16, w: 2, solid: true }, { s: 'shelf', x: 22, y: 14, w: 2, solid: true },
      { s: g => (g.flags.breakerDone ? 'breaker_panel_on' : 'breaker_panel'), x: 27, y: 12, w: 2 },
      { s: 'desk', x: 29, y: 16, solid: true },
      { s: 'lockers', x: 33, y: 13, solid: true }, { s: 'trash_can', x: 37, y: 16, solid: true },
    ],
    lights: [
      moon(10, 1.5), moon(19, 1.5), moon(28, 1.5),
      moon(5, 18), moon(12, 18), moon(20, 18), moon(28, 18), moon(36, 18),
      { x: 35.5, y: 3, r: 3, color: '160,200,255', a: 0.5, flag: 'fuseOn' }, // 서고 에어컨 불빛
    ],
    glows: EXIT,
    actors: [
      { ...DALSU(37.5, 10.5, PD4), cond: dalsuOn },
      { id: 'jihyeon', skin: 'jihyeon', x: 30.5, y: 6.5, dir: 'left', cond: g => !g.flags.jiFound },
    ],
    events: [
      ...stairEvents(4),
      { id: 'save34', on: 'act', x: 24, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      // 3-05
      { id: 'lunch', on: 'act', x: 9, y: 3, item: 'lunchbox', text: '책상 위에 보자기로 싼 도시락이 놓여 있다. 손을 대 보니… 아직 따뜻하다.', face: 'scared' },
      { id: 'sinmungo', on: 'act', x: 14, y: 9, run: 'sinmungo' },
      { id: 'pin', on: 'act', x: 19, y: 4, item: 'pin', text: '책상 위에 실핀이 하나 떨어져 있다.', face: 'default' },
      { id: 'reunion', on: 'touch', x: 25, y: 1, w: 7, h: 7, once: true, run: 'reunion', cond: g => !g.flags.jiFound },
      { id: 'globe', on: 'act', x: 12, y: 15, run: 'globe' },
      // 3-06 서고
      { id: 'fuse', on: 'act', x: 34, y: 8, run: 'fuse', cond: g => g.player.y > 8 },
      { id: 'shelfTop', on: 'act', x: 25, y: 1, w: 2, run: 'shelfTop' },
      { id: 'notice', on: 'act', x: 31, y: 4, item: 'archive_notice', text: '서고 문 앞 바닥에 코팅된 안내문이 떨어져 있다.', face: 'default', cond: F('noticeFell') },
      { id: 'archiveDoor', on: 'act', x: 32, y: 4, run: 'archiveDoor', cond: g => !g.has('key_archive') },
      { id: 'taeguk', on: 'act', x: 37, y: 1, w: 2, item: 'taeguk', text: '책장 가장 안쪽, 오동나무 상자 속에 둥근 패가 들어 있다.', face: 'serious', after: 'gotTaeguk' },
      { id: 'oheng', on: 'act', x: 35, y: 5, run: 'ohengDoc' },
      { id: 'power', on: 'act', x: 38, y: 6, run: 'powerDoc' },
      // 3-07 세계 시계 / 3-08 카드 복사기
      { id: 'clocks', on: 'act', x: 5, y: 12, w: 3, run: 'worldClock', cond: g => g.player.y > 12 },
      { id: 'clockDoc', on: 'act', x: 2, y: 16, w: 2, run: 'clockDoc' },
      { id: 'copier', on: 'act', x: 7, y: 9, run: 'copier' },
      // 3-09 오컬트부
      { id: 'occult', on: 'act', x: 17, y: 16, w: 2, run: 'occult' },
      // 3-14 추격: 복도 발목 귀신, 중앙홀 난간
      { id: 'ankle41', on: 'touch', x: 8, y: 9, w: 1, h: 3, once: true, run: 'ankle', cond: F('eunmiChase') },
      { id: 'ankle42', on: 'touch', x: 12, y: 9, w: 1, h: 3, once: true, run: 'ankle', cond: F('eunmiChase') },
      { id: 'railing', on: 'touch', x: 16, y: 8, w: 8, h: 5, run: 'eunmiFall', cond: g => g.flags.eunmiChase && !g.flags.eunmiFell },
      // 3-15 차단기
      { id: 'breaker', on: 'act', x: 27, y: 12, w: 2, run: 'breaker', cond: g => g.player.y > 12 },
      locker('lock36', 33, 13),
    ],
  },

  shingwan_roof: {
    id: 'shingwan_roof',
    name: '신관 옥상',
    grid: [
      '##############################',
      '#::::::::::::::::::::::::::::#',
      '#::::::::::::::::::::::::::::#',
      '#::::::::::::::::::::::::::::#',
      '#::::::::::::::::::::::::::::#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#PPPPPPPPPPPPPPPPPPPPPPPPPPPP#',
      '#::::::::::::::::::::::::::::#',
      '#::::::::::::::::::::::::::::#',
      '#==::::::::::::::::::::::::::#',
      '#==::::::::::::::::::::::::::#',
      '##############################',
    ],
    ambient: '#121a2a',
    doors: [],
    props: [
      { s: g => (g.flags.valveFixed ? 'valve_red_handle' : 'valve_red'), x: 5, y: 13, solid: true },
      { s: 'pool_ladder', x: 7, y: 13 },
      { s: 'diving_board', x: 12, y: 4, w: 2 },
      { s: 'water_tank', x: 25, y: 1, w: 2, solid: true },
      { s: 'mermaid_dead', x: 13, y: 9, w: 2, floor: true, when: F('mermaidDead') },
    ],
    lights: [
      { x: 14.5, y: 8.5, r: 10, color: '130,150,210', a: 0.55 },
      { x: 4, y: 14.5, r: 4, color: '130,150,210', a: 0.45 },
    ],
    actors: [
      { id: 'mermaid', kind: 'ghost', anim: ['mermaid_0', 'mermaid_1'], noShadow: true, x: 14.5, y: 5.5, loop: MERMAID_LOOP, speed: 2.2, dmg: 15, reach: 0.7, glow: '120,200,220', cond: g => !g.flags.poolDrained },
    ],
    // L로드: 막대가 가리키는 수맥 길(가까운 칸)이 물 위에 반짝인다
    dynGlows: g => (!g.has('lrod') || g.flags.poolDrained ? [] : POOL_PATH.filter(([c, r]) => Math.hypot(c + 0.5 - g.player.x, r + 0.5 - g.player.y) < 2.7).map(([c, r]) => ({ x: c + 0.5, y: r + 0.8, color: '120,230,255', pulse: true }))),
    // 수맥 길을 벗어나 물에 0.25초 넘게 있으면 끌려간다
    tick: (g, dt) => {
      const p = g.player;
      if (g.flags.poolDrained || p.hidden) return;
      const c = Math.floor(p.x), r = Math.floor(p.y);
      if (g.world.ch(c, r) === 'P' && !SAFE.has(`${c},${r}`)) {
        g.poolOff = (g.poolOff || 0) + dt;
        if (g.poolOff > 0.25) { g.poolOff = 0; g.run('poolDrag'); }
      } else g.poolOff = 0;
    },
    events: [
      { id: 'sdownR', on: 'touch', x: 1, y: 16, w: 2, h: 1, run: stairsTo('shingwan_4f') },
      { id: 'valve', on: 'act', x: 5, y: 13, run: 'valve' },
      { id: 'handle', on: 'act', x: 20, y: 2, item: 'valve_handle', text: '데크 구석에 빨간 밸브 손잡이가 떨어져 있다.', face: 'default' },
      { id: 'tank', on: 'act', x: 25, y: 1, w: 2, text: '녹슨 물탱크. 안에서 물 출렁이는 소리가… 탱크는 비어 있을 텐데.', face: 'scared' },
      { id: 'tabletWater', on: 'act', x: 14, y: 8, item: 'tablet_water', text: '마른 수영장 한가운데, 인어가 쓰러진 자리에 오각형 패가 놓여 있다.', face: 'serious', cond: F('poolDrained'), after: 'gotWater' },
      { id: 'keyBlue', on: 'act', x: 2, y: 11, item: 'key_small_blue', text: '수영장 바닥 구석에 작은 열쇠가 떨어져 있다.', face: 'default', cond: F('poolDrained') },
    ],
  },
};

// ---------------------------------------------------------------- 층에 들어설 때
// 은미 추격 중이면 계단으로 따라 올라온다(조금 뒤, 2·1층은 중앙홀 쪽에서)
const eunmiBack = (s, x, y) => {
  if (!s.flag('eunmiChase') || s.flag('eunmiFell') || s.actor('eunmi')) return;
  s.later(2.2, s2 => {
    if (!s2.flag('eunmiChase') || s2.flag('eunmiFell') || s2.actor('eunmi')) return;
    s2.spawn(EUNMI(x, y));
    s2.sfx('laugh');
  });
};
const firstVisit = async (s, k, text, face) => {
  if (s.flag(k)) return;
  s.flag(k, true);
  await s.narrate(text, face);
};
export const onEnter = {
  shingwan_1f: async s => { endRest(s); eunmiBack(s, 19.5, 8.5); },
  shingwan_2f: async s => {
    endRest(s);
    eunmiBack(s, 19.5, 8.5);
    await firstVisit(s, 'seen32', '신관 2층. 가운데가 뻥 뚫린 중앙홀 너머로 아래층 바닥이 까마득히 내려다보인다.', 'serious');
  },
  shingwan_3f: async s => {
    endRest(s);
    eunmiBack(s, 2.5, 2.4);
    await firstVisit(s, 'seen33', '3층. 3학년 교실이 끝없이 늘어선 복도. 교실마다 캄캄하다.', 'serious');
  },
  shingwan_4f: async s => {
    endRest(s);
    eunmiBack(s, 2.5, 2.4);
    await firstVisit(s, 'seen34', '4층. 오래된 종이 냄새… 도서관이 있는 층이다.', 'default');
  },
  shingwan_roof: async s => {
    endRest(s);
    if (s.flag('seenRoof')) return;
    s.flag('seenRoof', true);
    s.cinema(true);
    await s.narrate('옥상. 밤바람이 차다. 철망 너머로 운동장이 까마득하다.', 'serious');
    s.sfx('splash');
    await s.cg('cg_mermaid');
    await s.narrate('수영장 검은 물 위로 무언가가 머리를 내밀었다. 젖어 늘어진 머리카락 사이로… 사람의 얼굴.', 'scared');
    await say2(s, ['…물가에 너무 붙지 마. 저건 가장자리를 맴돌아.', 'serious'], ['히익…! 희, 희민아, 저기 물속에…!', 'scared']);
    if (!s.has('lrod')) await s.say('희민', '(물에 함부로 들어가면 끌려갈 것 같다. 길을 알려 줄 무언가가 필요해.)', 'serious');
    else await s.say('희민', '(L로드가 떨린다… 막대가 가리키는 반짝이는 칸으로만 건너자.)', 'serious');
    s.objective('수영장 건너편 데크의 밸브 손잡이 → 빨간 밸브로 물 빼기');
  },
};

// 동행 대사: B 소영 / A 지현(지금 따라오는 사람만)
async function say2(s, B, A) {
  const id = s.flag('follower');
  if (id === 'soyoung' && B) await s.say('소영', ...B);
  else if (id === 'jihyeon' && A) await s.say('지현', ...A);
}

// ---------------------------------------------------------------- 3-11 교실 불(차례대로) / 3-03 교실 드나들기
async function lightSwitch(s, n) {
  if (s.flag('leverDone')) return s.narrate('…이제 불을 켤 필요는 없다.', 'default');
  if (s.flag('light_' + n)) return s.narrate(`3-${n} 교실 불은 이미 켜져 있다.`, 'default');
  s.sfx('switch');
  s.flag('light_' + n, true);
  const seq = list(s.g, 'lightSeq'), step = s.flag('lightStep') || 0;
  const [cx, cy] = roomCenter(n);
  if (s.actor('dalsu')) s.alert(cx, cy); // 켜진 불을 보고 수위가 몰려온다
  if (seq[step] === String(n)) {
    s.flag('lightStep', step + 1);
    if (step + 1 < seq.length) return s.toast(`3-${n} 교실 불이 켜졌다 (${step + 1}/${seq.length})`);
    await s.narrate(`딸깍. 3-${n} 교실까지, 메모에 적힌 교실이 모두 밝혀졌다.`, 'serious');
    s.objective('3층 전기실 레버 내리기 (전기실 열쇠)');
    return;
  }
  // 차례가 틀리면 전부 꺼진다
  s.flag('lightStep', 0);
  for (const k of Object.keys(ROOM3)) s.flag('light_' + k, false);
  s.sfx('fuse');
  await s.narrate('파직— 형광등이 일제히 깜빡이더니 전부 꺼져 버렸다. 차례가 틀린 것 같다.', 'surprised');
  if (!s.flag('starRead')) await s.say('희민', '(아무 교실이나 켜면 안 되는 모양이다. 계단 옆 게시판에 뭔가 붙어 있었는데…)', 'serious');
}

// 쪽지의 교실을 작은 번호부터 차례대로 들어가야 한다(쪽지에 없는 교실은 상관없음). 건너뛰거나 거꾸로 가면 천장에서 떨어진다
function spiderEnter(n) {
  return g => {
    g.flags.spiderAt = n;
    const L = list(g, 'spiderList'), i = L.indexOf(String(n)), step = g.flags.spiderStep || 0;
    if (i < 0) return;
    if (i === step) {
      g.flags.spiderStep = step + 1;
      g.run(step + 1 === L.length ? 'spiderFound' : 'spiderGiggle');
    } else {
      g.flags.spiderStep = 0;
      g.run('spiderDrop');
    }
  };
}

// 시계 정답(24시간제)
const CITIES = [['서울', 9], ['베이징', 8], ['모스크바', 3], ['뉴욕', -5]];
const clockAnswer = g => CITIES.map(([, d]) => (((g.flags.gmt || 0) + d) % 24 + 24) % 24);

// ---------------------------------------------------------------- 공략 (휴대폰 → 옵션 → 공략)
const ITEM_AT = {
  card_yellow: ['shingwan_1f', 10, 3, '1층 역사관 학교 모형 위'],
  cd: ['shingwan_1f', 37, 1, '2장 음악준비실에서 얻은 CD(가지고 있어야 한다)'],
  pin: ['shingwan_4f', 19, 4, '4층 도서관1 책상'],
  key_small_yellow: ['shingwan_4f', 12, 15, '4층 자료실 지구본 속'],
  archive_notice: ['shingwan_4f', 31, 4, '4층 도서관2 서고 문 앞(배전판 퓨즈를 옮기면 떨어진다)'],
  backward_tape: ['shingwan_2f', 8, 2, '2장 제2교무실에서 얻은 역재생 테이프(가지고 있어야 한다)'],
  lrod: ['shingwan_4f', 17, 16, '4층 오컬트부 탁자'],
  key_roof: ['shingwan_1f', 19, 10, '1층 중앙홀 바닥(3층 전기실 레버를 내리면 떨어진다)'],
  valve_handle: ['shingwan_roof', 20, 2, '옥상 수영장 건너편 데크'],
  can_coffee: ['shingwan_2f', 31, 1, '2층 휴게실 자판기(동전)'],
  coin: ['shingwan_1f', 3, 13, '1층 매점 배식대 아래'],
};
const FLOOR_NAME = { shingwan_1f: '1층', shingwan_2f: '2층', shingwan_3f: '3층', shingwan_4f: '4층', shingwan_roof: '옥상' };
const floorNo = id => (id === 'shingwan_roof' ? 4 : FLOORS.indexOf(id)); // 옥상 = 4층 위

export function guide(g) {
  const f = g.flags, has = id => g.has(id);
  if (f.ch3Clear) return null;
  const via = to => {
    if (to === g.mapId) return null;
    if (g.mapId === 'shingwan_roof') return [g.mapId, 1, 16, '왼쪽 아래 계단으로 4층'];
    if (to === 'shingwan_roof') return g.mapId === 'shingwan_4f' ? [g.mapId, 1, 1, '왼쪽 계단으로 옥상(옥상 열쇠)'] : [g.mapId, 1, 1, '왼쪽 계단으로 위층'];
    const a = floorNo(g.mapId), b = floorNo(to);
    if (a < 0 || b < 0) return null;
    return b > a ? [g.mapId, 1, 1, `왼쪽 계단으로 위층 (${FLOOR_NAME[FLOORS[a + 1]]})`] : [g.mapId, 4, 1, `오른쪽 계단으로 아래층 (${FLOOR_NAME[FLOORS[a - 1]]})`];
  };
  const S = (text, at, need = [], codes = []) => ({
    text, at, codes,
    via: via(at[0]),
    items: need.filter(id => !has(id) && ITEM_AT[id]).map(id => ({ id, name: g.story.items[id].name, where: ITEM_AT[id][3], at: ITEM_AT[id].slice(0, 3) })),
  });
  const B = f.route === 'B';
  const room = n => { const [a, , top] = ROOM3[n]; return top ? [a + 2, 7] : +n === 9 ? [25, 14] : [a + 2, 13]; }; // 교실 문 바로 안쪽 칸(가운데는 책상일 수 있다)
  const sw = n => switchAt(n);
  const dodge = { label: '도플갱어', value: '거울 앞의 도플갱어가 쏘는 검은 탄을 피하면서(움직이면 빗나간다) 스피커를 바닥의 희미한 자리로 민다' };
  const stars = { label: '교실 불 차례', value: f.starRead ? list(g, 'lightSeq').map(n => '3-' + n).join(' → ') : '3층 계단 옆 게시판의 별자리 메모' };
  const clock = { label: '세계 시계', value: f.clockRead ? CITIES.map(([c], i) => `${c} ${clockAnswer(g)[i]}시`).join(' · ') + ` (그리니치 ${f.gmt}시)` : '컴퓨터실 PC 책상의 세계 시차표' };
  const tape = { label: '카드 복사기 번호', value: f.tapeHeard ? f.tapeCode : '2층 어학실에서 테이프를 앞으로 돌려 듣기' };
  const power = { label: '강당 전원 차단기', value: f.powerRead ? list(g, 'breakerCode').join(' · ') + '번만 올리기' : '서고 서류함의 강당 전원 안내' };
  const lrod = { label: '수맥 길', value: 'L로드를 가지고 물가에 서면 밟아도 되는 칸이 반짝인다. 반짝이는 칸만 밟고 건너기(벗어나면 끌려가 피해)' };
  const spider = { label: '구석의 아이', value: f.spiderActive ? list(g, 'spiderList').map(n => '3-' + n).join(' → ') + ' (작은 번호부터, 쪽지에 없는 교실은 상관없음)' : '1층 음악감상실 감상 책상의 쪽지' };

  // 3-01 ~ 3-02
  if (!f.quakeDone) return S('1층 복도를 따라 역사관 앞으로', ['shingwan_1f', 11, 10]);
  if (!f.modelTaken) return S('1층 역사관 학교 모형 위의 노란 카드키', ['shingwan_1f', 10, 3]);
  // 3-04 도플갱어
  if (!f.mirrorDone) {
    if (!f.mirrorRound) return S('1층 무용실(노란 카드)의 오디오에 CD 넣기', ['shingwan_1f', 37, 1], ['cd'], [dodge]);
    const [sx, sy] = speakerAt(g), [tx, ty] = ROUNDS[f.mirrorRound].to;
    const here = ['shingwan_1f', sx, sy];
    const push = tx !== sx ? (tx > sx ? ['오른쪽', '왼쪽', tx - sx] : ['왼쪽', '오른쪽', sx - tx]) : ty < sy ? ['위', '아래', sy - ty] : ['아래', '위', ty - sy];
    return S(`스피커를 ${push[0]}로 밀기 — 스피커 ${push[1]}쪽에 서서 조사 (남은 ${push[2]}칸, ${f.mirrorRound}/3라운드)`, here, [], [dodge, { label: '스피커', value: '가로로 먼저 맞추고 세로로. 막히면 스피커를 조사해 처음 자리로' }]);
  }
  // 3-05 4층 · 지현
  if (!f.jiFound) return S(`4층 도서관2 살펴보기${B ? ' (지현을 찾기)' : ' (달아난 지현을 찾기)'} — 3층 계단 유리문은 빨간 카드`, ['shingwan_4f', 28, 4]);
  // 3-06 서고
  const archiveOpen = f['door:shingwan_4f:32,4'] === 'open' || has('taeguk');
  if (!archiveOpen) {
    if (!f.fuseOn) return S('4층 복도 서쪽 끝 배전판(서고 앞)의 퓨즈를 전원 쪽으로', ['shingwan_4f', 34, 8]);
    if (!has('archive_notice') && !has('key_archive')) return S('도서관2 서고 문 앞에 떨어진 안내문 줍기', ['shingwan_4f', 31, 4]);
    if (!has('pin') && !has('key_archive')) return S('4층 도서관1 책상의 실핀', ['shingwan_4f', 19, 4]);
    if (!has('key_archive')) return S('서고 문(도서관2 안쪽)을 조사: 안내문을 문 아래로, 실핀으로 열쇠 떨어뜨리기', ['shingwan_4f', 32, 4], ['archive_notice', 'pin']);
    return S('서고 문을 서고 열쇠로 열기', ['shingwan_4f', 32, 4]);
  }
  if (!has('taeguk')) return S('서고 안쪽 책장의 태극패', ['shingwan_4f', 37, 1]);
  if (!f.powerRead) return S('서고 서류함의 강당 전원 안내 읽기', ['shingwan_4f', 38, 6]);
  if (!f.ohengRead) return S('서고 책상의 수업 자료(오행) 읽기', ['shingwan_4f', 35, 5]);
  // 3-07 세계 시계
  if (!has('key_elec') && !f.leverDone) {
    if (!f.clockRead) return S('4층 컴퓨터실 PC 책상의 세계 시차표 읽기', ['shingwan_4f', 2, 16], [], [clock]);
    return S('컴퓨터실 벽의 세계 시계 맞추기', ['shingwan_4f', 5, 12], [], [clock]);
  }
  // 3-08 테이프 → 카드 복사기
  if (!has('card_blue') && !f.occultDone) {
    if (!f.tapeHeard) return S('2층 어학실 책상의 카세트 데크로 테이프를 앞으로 돌려 듣기', ['shingwan_2f', 8, 2], ['backward_tape'], [tape]);
    return S('4층 컴퓨터실 앞 카드 복사기에 확인 번호 입력 (노랑·빨강 카드)', ['shingwan_4f', 7, 9], [], [tape]);
  }
  // 3-09 오컬트부
  if (!f.occultDone) return S('4층 오컬트부(파란 카드) 탁자 살펴보기', ['shingwan_4f', 17, 16]);
  // 3-10 (선택)
  // B 휴게실: 캔커피를 먼저, 다이어리는 그다음(순서가 하얀 국화 조건) — 동전이 남아 있으면 캔커피부터 안내
  if (B && !f.restDone && f.follower === 'soyoung') {
    const coffee = has('can_coffee') || f.coffeeGiven;
    if (!coffee && has('coin')) return S('(선택) 2층 휴게실 자판기에서 캔커피 뽑기 (소영에게 줄 것)', ['shingwan_2f', 31, 1]);
    if (!coffee && !f['ev:coin32']) return S('(선택) 소영에게 줄 캔커피 — 2층 진로상담실 책상 서랍의 동전부터', ['shingwan_2f', 18, 2]);
    if (!coffee && !f['ev:coin31']) return S('(선택) 소영에게 줄 캔커피 — 1층 매점 배식대 아래의 동전부터', ['shingwan_1f', 3, 13]);
    if (f.resting) return S(has('can_coffee') ? '(선택) 소파의 소영에게 말 걸기 — 캔커피 먼저 건네기' : has('diary') ? '(선택) 소영에게 다이어리 돌려주기' : '(선택) 소영에게 말 걸고 이제 가자', ['shingwan_2f', 26, 4]);
    if (has('can_coffee') || has('diary')) return S('(선택) 소영과 2층 휴게실에 들어가 잠깐 쉬기', ['shingwan_2f', 28, 4]);
  }
  if (!B && f.tapeHeard && has('backward_tape') && !f.tapeSubmitted) return S('(선택) 4층 열람실 앞 연두신문고에 테이프 투고', ['shingwan_4f', 14, 9]);
  // 3-03 (선택) 구석의 아이
  if (!f.spiderDone) {
    if (!f.spiderActive) {
      if (!has('key_small_yellow')) return S('(선택) 4층 자료실 지구본 살펴보기', ['shingwan_4f', 12, 15], [], [spider]);
      return S('(선택) 1층 음악감상실(노란 소형 열쇠) 감상 책상의 쪽지', ['shingwan_1f', 19, 16], [], [spider]);
    }
    const next = list(g, 'spiderList')[f.spiderStep || 0];
    const [rx, ry] = room(next);
    return S(`(선택) 3층 3-${next} 교실에 들어가기 (${(f.spiderStep || 0) + 1}/${list(g, 'spiderList').length})`, ['shingwan_3f', rx, ry], [], [spider]);
  }
  // 3-11 교실 불 → 레버
  if (!f.leverDone) {
    if (!f.starRead) return S('3층 계단 옆 게시판의 별자리 메모 읽기', ['shingwan_3f', 5, 8], [], [stars]);
    const seq = list(g, 'lightSeq'), step = f.lightStep || 0;
    if (step < seq.length) { const [x, y] = sw(seq[step]); return S(`3층 3-${seq[step]} 교실 불 켜기 — 문 옆 스위치 (${step + 1}/${seq.length})`, ['shingwan_3f', x, y], [], [stars]); }
    return S('3층 전기실(전기실 열쇠)의 레버 내리기', ['shingwan_3f', 27, 1]);
  }
  if (!has('key_roof') && !f.roofKeyTaken) return S('1층 중앙홀 바닥에 떨어진 옥상 열쇠 줍기 (줍는 순간 수위가 내려온다)', ['shingwan_1f', 19, 10]);
  // 3-12 옥상
  if (!f.poolDrained) {
    if (!has('valve_handle') && !f.valveFixed) return S('옥상(4층 왼쪽 계단) 수영장을 L로드 수맥 길로 건너 건너편 데크의 밸브 손잡이', ['shingwan_roof', 20, 2], ['lrod'], [lrod]);
    return S('남쪽 데크의 빨간 밸브에 손잡이를 끼우고 물 빼기', ['shingwan_roof', 5, 13], [], [lrod]);
  }
  if (!has('tablet_water') && !f.sealOpen) return S('물 빠진 수영장 한가운데의 水의 패', ['shingwan_roof', 14, 8]);
  // 3-13 ~ 3-15
  if (!f.sealOpen) return S('2층 서쪽 끝 水 결계문에 水의 패 끼우기', ['shingwan_2f', 4, 12]);
  if (!f.eunmiFell) return S('은미에게서 도망쳐 4층 중앙홀 난간까지 (발목을 잡히면 연타)', ['shingwan_4f', 19, 8], [], [{ label: '은미', value: '왼쪽 계단으로 계속 위층 → 4층 복도를 동쪽으로' }]);
  return S('4층 차단기실의 차단기로 강당에 전원 넣기', ['shingwan_4f', 27, 12], [], [power]);
}

// ---------------------------------------------------------------- 챕터 선택으로 바로 시작
// 2장을 마친 상태(루트, 기본 소지품 + 2장의 CD·역재생 테이프)를 만든 뒤 3장 오프닝부터
export function newGame(g, route = 'B') {
  g.checkpointData = null;
  for (const id of ['diary', 'candy', 'pen', 'pen', 'lighter', 'backward_tape', 'cd']) g.give(id);
  Object.assign(g.flags, { route, ch1Clear: route, ch2Clear: route, janitorOn: true, headGhost: true, follower: route === 'B' ? 'soyoung' : 'jihyeon' });
  g.run('ch3Start');
}

// ---------------------------------------------------------------- 3-04 무용실: 라운드 클리어(스피커가 거울 속 자리에 맞음)
async function roundClear(s) {
  const g = s.g, n = g.flags.mirrorRound;
  for (const a of [...g.actors]) if (a.id?.startsWith('bullet')) s.despawn(a.id);
  s.sfx('mirror');
  s.shake(0.5);
  if (n < 3) {
    s.flag('mirrorRound', n + 1);
    s.flag('spk', ROUNDS[n + 1].from.join(','));
    s.refresh();
    const d = s.actor('doppel');
    if (d) d.shoot = SHOTS[n + 1];
    await s.narrate(n === 1 ? '쩍— 거울에 금이 갔다! 거울 속 스피커는 또 다른 자리로 옮겨 가 있다.' : '쩌적— 금이 거미줄처럼 번졌다. 거울 속 희민의 얼굴이 일그러진다.', 'surprised');
    s.objective(`탄을 피하며 스피커를 바닥의 희미한 자리로 밀기 (${n + 1}/3)`);
    return;
  }
  s.cinema(true);
  s.flag('mirrorDone', true);
  s.despawn('doppel');
  s.refresh();
  s.sfx('glass');
  s.shake(1);
  await s.narrate('와장창! 거울이 통째로 무너져 내렸다. 거울 속 희민은… 조각조각 흩어져 사라졌다.', 'surprised');
  s.clearCheckpoint();
  await s.narrate('깨진 거울 뒤 벽 틈에 무언가가 끼어 있다.', 'serious');
  await s.give('card_red');
  await s.give('weight50');
  await say2(s, ['…괜찮아? 거울 속의 너, 진짜 기분 나쁘게 웃더라.', 'sad'], null);
  s.objective('4층으로 — 3층 계단 유리문은 빨간 카드키');
}

const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const endRest = s => { if (s.flag('resting')) s.flag('resting', false); };

// ---------------------------------------------------------------- 스크립트
export const scripts = {
  // 2장 土 결계문에서 이어진다: 3장 카드 → 신관 1층 로비
  ch3Start: async s => {
    const g = s.g, route = s.flag('route');
    s.cinema(true);
    await s.fade(1, 0.8);
    s.flag('ch2Clear', s.flag('ch2Clear') || route);
    s.flag('gmt', Math.floor(Math.random() * 24));
    s.flag('tapeCode', rnd4());
    s.flag('lightSeq', pick(ROOMS.map(r => r.slice(2)), 5).join(','));
    s.flag('spiderList', pick(ROOMS.map(r => r.slice(2)), 4).sort((a, b) => a - b).join(','));
    s.flag('breakerCode', pick(['1', '2', '3', '4', '5', '6'], 3).sort().join(','));
    s.flag('follower', route === 'B' ? 'soyoung' : 'jihyeon');
    s.flag('follower2', null);
    await s.card('제3장 · 신관', '물(水)의 결계');
    g.enterMap('shingwan_1f', 35.5, 16.6, 'up');
    if (route === 'A') s.spawn({ id: 'seonga', skin: 'seonga', x: 33.5, y: 16.4, dir: 'up' });
    await s.fade(0, 0.8);
    s.sfx('thud');
    await s.narrate('끝없이 이어지던 연결 통로가 끝나고, 신관 로비에 들어섰다. 시멘트 바닥에 발소리가 크게 울린다.', 'serious');
    if (route === 'B') {
      await s.say('소영', '신관… 3학년 교실이랑 도서관이 있는 건물이야. 다음 패는 물, 水.');
      await s.say('소영', '그리고 여기 수위는 본관 아저씨랑 달라. 젊고, 빠르고, 휘파람을 불어.', 'serious');
      await s.say('소영', '휘파람이 뚝 그치면… 이쪽으로 오고 있다는 뜻이야.', 'serious');
    } else {
      await s.say('성아', '신관이네. 3학년 냄새 나. …난 또 따로 둘러볼게.', 'smirk');
      await s.say('지현', '성아야, 또…?', 'sad');
      await s.say('성아', '지현이 잘 부탁해, 전학생. 휘파람 소리 들리면 숨는 게 좋을 거야.', 'smile');
      await s.move('seonga', 31.5, 11, 3.2);
      await s.move('seonga', 3.5, 10.5, 3.6);
      s.despawn('seonga');
      await s.say('지현', '…성아는 왜 자꾸 혼자 가는 걸까. 희민아, 우리는 같이 다니자.', 'sad');
    }
    await s.toast('신관 수위는 빠르고 멀리 본다 — 휘파람이 멈추면 숨을 곳부터');
    s.objective('1층 역사관 살펴보기');
  },

  // B 루트 2번째 동행(지현)과 대화
  companionTalk2: async s => {
    const obj = s.flag('objective');
    await s.say('지현', obj ? `…${obj}. 응, 소영이랑 너 뒤에 꼭 붙어 갈게.` : '…무서워. 빨리 끝내자.', 'scared');
  },

  eatLunch: async s => {
    s.take('lunchbox');
    s.heal(40);
    await s.narrate('보자기를 풀자 따끈한 밥 냄새가 퍼졌다. …누가, 언제 싸 온 걸까. 생각하지 않기로 하고 몇 숟갈 떴다.', 'serious');
    await s.toast('체력이 회복되었다');
  },

  // ---- 3-01 흔들림
  quake: async s => {
    s.flag('quakeDone', true);
    s.sfx('rumble');
    s.shake(1.4);
    await s.narrate('쿠르릉— 발밑이 크게 흔들렸다. 진열장 유리가 덜컹거리고, 천장에서 먼지가 쏟아진다.', 'surprised');
    if (s.flag('route') === 'B') {
      await s.say('소영', '…지진? 아니야. 이 건물만 흔들린 거야.', 'surprised');
      await s.say('소영', '신관은 원래 연못이 있던 자리에 지은 거래. 연못을 메우면서… 뭔가를 같이 묻었다고.', 'serious');
      const c = await s.choice('', ['뭘 묻었는데?', '…일단 움직이자.']);
      if (c === 0) await s.say('소영', '나도 몰라. 언니가 그런 얘기를 했었어. 역사관에 가면 뭔가 있을지도.', 'sad');
      else { aff(s, 'soyoung', 1); await s.say('소영', '…응. 역사관부터 보자.'); }
    } else {
      await s.say('지현', '꺄악! 희, 희민아… 방금 흔들렸지? 나만 그런 거 아니지?', 'scared');
      await s.say('희민', '(건물 전체가 흔들렸다. …역사관부터 살펴보자.)', 'serious');
    }
    s.objective('1층 역사관 살펴보기');
  },

  // ---- 3-02 학교 모형 → 노란 카드키, 마네킹이 쓰러져 손달수가 깨어난다
  schoolModel: async s => {
    if (s.flag('modelTaken')) return s.narrate('유리 진열장 속 학교 모형. 본관, 신관, 강당… 신관 자리만 파랗게 칠해져 있다.', 'default');
    await s.narrate('유리 진열장 속에 학교 모형이 있다. 본관, 신관, 강당까지 정교하다. 진열장 위에 노란 카드키가 한 장 놓여 있다.', 'default');
    s.cinema(true);
    s.flag('modelTaken', true);
    s.refresh();
    await s.give('card_yellow');
    s.sfx('creak');
    await s.wait(0.5);
    s.flag('mannequinFell', true);
    s.refresh();
    s.sfx('glass');
    s.shake(0.8);
    await s.cg('cg_mannequin');
    await s.narrate('와장창! 뒤에 서 있던 마네킹이 진열장 쪽으로 쓰러지며 유리가 산산조각 났다!', 'surprised');
    s.flag('dalsuOn', true);
    if (!s.actor('dalsu')) { const j = s.spawn(DALSU(36.5, 10.5, PD1)); j.state = 'investigate'; j.lastSeen = [11.5, 9.6]; }
    s.sfx('whistle');
    await s.narrate('…복도 저편에서 날카로운 호루라기 소리. 이어서 휘파람 소리가 빠르게 가까워진다.', 'scared');
    if (s.flag('route') === 'A' && s.flag('follower') === 'jihyeon') {
      await s.say('지현', '시, 싫어… 싫어어!', 'scared');
      s.follow(null);
      if (s.actor('jihyeon')) { await s.move('jihyeon', 11.5, 9.6, 3.6); await s.move('jihyeon', 2.5, 9.6, 3.8); }
      s.despawn('jihyeon');
      s.flag('jiLost', true);
      await s.say('희민', '(지현이가 달아나 버렸다… 계단 쪽이었다. 일단 수위부터 피하자.)', 'serious');
    } else if (s.flag('route') === 'B') {
      await s.say('소영', '수위야…! 숨어, 빨리!', 'surprised');
    }
    await s.toast('신관 수위 손달수 — 휘파람이 그치면 다가오는 중');
    s.objective('1층 무용실 살펴보기 (노란 카드키)');
  },

  historyDoc: async s => {
    await s.narrate('이사장실 책상 위에 가죽 표지의 연혁 철이 펼쳐져 있다.', 'default');
    await s.doc('history');
    if (s.flag('historyRead')) return;
    s.flag('historyRead', true);
    await say2(s, ['연못을 메운 자리에 다시 물을 올려 둔 거네. …수영장.', 'serious'], ['1983년… 연못에서 익사 사고라니. 무서워…', 'scared']);
  },

  // ---- 3-04 거울 속의 나
  stereo: async s => {
    if (s.flag('mirrorDone')) return s.narrate('멈춘 오디오. 깨진 거울 조각에 스피커가 비친다.', 'default');
    if (s.flag('mirrorRound')) return s.say('희민', '(음악이 멈추지 않는다… 스피커를 거울 속 자리로 옮겨야 해!)', 'serious');
    if (!s.has('cd')) return s.narrate('무용실 오디오. CD를 넣는 칸이 비어 있다.', 'default');
    const c = await s.choice('오디오에 음악 교사의 CD를 넣을까?', ['넣는다', '그만둔다']);
    if (c) return;
    s.checkpoint('무용실 오디오에 CD를 넣기 직전부터 다시');
    s.cinema(true);
    s.sfx('piano');
    await s.narrate('딸깍. 피아노 연주가 흘러나온다. 김지원 선생님의… 그 곡이다.', 'serious');
    await s.cg('cg_mirror');
    await s.narrate('거울 속의 내가— 웃었다. 나는 웃지 않았는데.', 'scared');
    await s.narrate('거울 속 희민이 손을 들자, 검은 구슬 같은 것이 거울을 뚫고 날아왔다!', 'surprised');
    s.flag('mirrorRound', 1);
    s.flag('spk', ROUNDS[1].from.join(','));
    s.refresh();
    s.spawn(DOPPEL(1));
    await say2(s, ['거울 속 스피커 자리를 봐! 바닥에 비친 자리로 똑같이 옮기면 돼!', 'serious'], null);
    await s.say('희민', '(거울 속에서는 스피커가 다른 자리에 있다. 바닥에 희미하게 비친 그 자리로 스피커를 밀자.)', 'serious');
    s.objective('탄을 피하며 스피커를 바닥의 희미한 자리로 밀기 (1/3)');
  },

  // 바라보는 방향으로 한 칸 민다. 무용실 밖·거울 앞 줄·오디오로는 못 밀고, 막히면 처음 자리로
  pushSpeaker: async s => {
    const g = s.g, p = s.player(), [dx, dy] = DIRS[p.dir], [x, y] = speakerAt(g), r = ROUNDS[g.flags.mirrorRound];
    const nx = x + dx, ny = y + dy;
    if (nx < 25 || nx > 38 || ny < 2 || ny > 7) {
      s.flag('spk', r.from.join(','));
      s.refresh();
      s.sfx('drag');
      return s.narrate('더는 밀리지 않는다. 스피커를 처음 자리로 끌어다 놓았다.', 'default');
    }
    s.flag('spk', `${nx},${ny}`);
    s.refresh();
    s.sfx('drag');
    if (nx === r.to[0] && ny === r.to[1]) await roundClear(s);
  },

  mirrorLook: async s => s.narrate(s.flag('mirrorDone') ? '무너진 거울. 뒤의 벽이 드러나 있다.' : s.flag('mirrorRound') ? '거울 속의 내가 손을 들어 이쪽을 겨누고 있다!' : '벽 한 면을 차지한 커다란 거울. 비친 내 얼굴이 유난히 창백하다.', s.flag('mirrorRound') && !s.flag('mirrorDone') ? 'scared' : 'default'),

  // ---- 3-05 4층: 지현
  reunion: async s => {
    s.flag('jiFound', true);
    s.cinema(true);
    await s.narrate('책장 사이 구석에서 누군가 무릎을 끌어안고 떨고 있다.', 'serious');
    if (s.flag('route') === 'B') {
      await s.say('지현', '…희민이? 소영이도…! 다행이다… 혼자서 얼마나 무서웠는지 몰라…', 'sad');
      await s.say('소영', '지현아. 성아는?', 'serious');
      await s.say('지현', '몰라… 2구역에서 헤어졌어. 나도 같이 가도 돼…?', 'sad');
      const c = await s.choice('', ['당연하지. 같이 가자.', '…소영이 괜찮다면.']);
      if (c === 0) aff(s, 'jihyeon', 1);
      await s.say('소영', '…응. 셋이 다니자. 대신 꼭 붙어 있어.');
      s.follow2('jihyeon');
      await s.toast('지현이 소영의 뒤를 따라온다');
    } else {
      await s.say('지현', '희, 희민아…! 미안해, 미안해… 너무 무서워서 그만…', 'sad');
      const c = await s.choice('', ['괜찮아. 이제 같이 가자.', '혼자 가 버리면 어떡해.']);
      if (c === 0) { aff(s, 'jihyeon', 1); await s.say('지현', '…응. 이번엔 진짜로 안 떨어질게.', 'smile'); }
      else await s.say('지현', '…응. 미안해.', 'sad');
      s.follow('jihyeon');
    }
    s.objective('4층 둘러보기 — 서고·컴퓨터실·오컬트부');
  },

  globe: async s => {
    if (s.flag('globeOpen')) return s.narrate('반으로 갈라진 지구본. 속이 비어 있다.', 'default');
    await s.narrate('먼지 쌓인 지구본. 돌려 보니 적도를 따라 가느다란 틈이 있다.', 'default');
    const c = await s.choice('지구본을 비틀어 열어 볼까?', ['연다', '그만둔다']);
    if (c) return;
    s.flag('globeOpen', true);
    s.sfx('creak');
    await s.narrate('지구본이 위아래로 갈라지며 안에서 작은 열쇠가 굴러 나왔다.', 'surprised');
    await s.give('key_small_yellow');
  },

  // ---- 3-06 서고
  fuse: async s => {
    if (s.flag('fuseOn')) return s.narrate('퓨즈가 전원 쪽에 꽂혀 있다. 서고 쪽에서 에어컨이 웅웅거린다.', 'default');
    await s.narrate("복도 벽의 배전판. 퓨즈 하나가 '차단' 쪽에 빠져 있다. 아래에 '서고 냉방'.", 'default');
    const c = await s.choice('퓨즈를 전원 쪽으로 옮길까?', ['옮긴다', '그만둔다']);
    if (c) return;
    s.flag('fuseOn', true);
    s.sfx('fuse');
    await s.narrate('지직— 불꽃이 튀더니, 서고 안에서 에어컨이 웅— 하고 돌아가기 시작했다.', 'surprised');
    s.flag('noticeFell', true);
    s.refresh();
    await s.narrate('…도서관2 쪽에서 무언가 팔랑, 바닥에 떨어지는 소리가 났다.', 'serious');
    s.objective('도서관2 — 서고 문 앞에 떨어진 것 확인');
  },

  shelfTop: async s => s.narrate(s.flag('noticeFell') ? '책장 꼭대기. 끼어 있던 종이는 바람에 떨어지고 없다.' : '책장 꼭대기에 코팅된 종이 한 장이 끼어 있다. 손이 닿지 않는다. 서고 문틈에서 새는 바람에 끝만 팔랑거린다.', 'default'),

  archiveDoor: async s => {
    await s.narrate('서고 문. 잠겨 있다. 열쇠 구멍 너머 안쪽에 열쇠가 꽂힌 채로 보인다.', 'serious');
    if (!s.has('archive_notice')) return s.say('희민', '(안쪽 열쇠를 이쪽으로 떨어뜨릴 수만 있다면… 받칠 종이 같은 게 필요하다.)', 'serious');
    if (!s.has('pin')) return s.say('희민', '(안내문을 문 아래로 밀어 넣고, 열쇠 구멍을 찌를 가느다란 게 있으면…)', 'serious');
    const c = await s.choice('안내문을 문 아래로 밀어 넣고, 실핀으로 열쇠를 밀어낼까?', ['해 본다', '그만둔다']);
    if (c) return;
    s.take('archive_notice');
    s.sfx('switch');
    await s.narrate('안내문을 문틈 아래로 밀어 넣고, 열쇠 구멍에 실핀을 넣어 살살 밀었다.', 'serious');
    s.sfx('coin');
    await s.narrate('…툭. 열쇠가 떨어지는 소리. 안내문을 천천히 당기자, 그 위에 열쇠가 실려 나왔다.', 'surprised');
    s.take('pin');
    await s.give('key_archive');
    s.objective('서고 문을 서고 열쇠로 열기');
  },

  gotTaeguk: async s => say2(s, ['태극… 패가 다 모이면 필요할지도 몰라. 잘 챙겨.', 'serious'], ['예쁘다… 근데 이상하게 차가워.', 'sad']),
  ohengDoc: async s => { await s.doc('oheng'); s.flag('ohengRead', true); },
  powerDoc: async s => {
    await s.narrate("서류함 맨 위 칸에 '시설과' 철이 꽂혀 있다.", 'default');
    await s.doc('power_guide');
    s.flag('powerRead', true);
  },

  // ---- 3-07 세계 시계
  clockDoc: async s => {
    await s.narrate('PC 책상 위에 코팅된 설명서가 붙어 있다.', 'default');
    await s.doc('clock_table');
    s.flag('clockRead', true);
  },
  worldClock: async s => {
    if (s.flag('clockDone')) return s.narrate('세계 시계들이 모두 맞춰져 있다. 다섯 개의 초침이 한꺼번에 움직인다.', 'default');
    const gmt = s.flag('gmt');
    await s.narrate(`벽에 둥근 시계 다섯 개. 가운데 그리니치 시계만 ${gmt}시를 가리키고, 나머지 넷은 제멋대로다.`, 'default');
    const v = await s.dials('세계 시계 맞추기', CITIES.map(([c]) => ({ label: c, value: 0, min: 0, max: 23, fmt: h => `${h}시` })), `가운데 그리니치 시계: ${gmt}시 (24시간제)`);
    if (!v) return;
    const ans = clockAnswer(s.g);
    if (v.some((h, i) => h !== ans[i])) { s.sfx('locked'); return s.narrate('째깍… 아무 일도 일어나지 않는다. 어딘가 틀린 모양이다.', 'default'); }
    s.flag('clockDone', true);
    s.sfx('bell');
    await s.narrate('다섯 시계가 일제히 땡— 울리더니, 가운데 시계판이 덜컥 열렸다.', 'surprised');
    await s.give('key_elec');
    s.objective('3층 전기실 — 게시판 메모대로 교실 불을 켜고 레버');
  },

  // ---- 3-08 거꾸로 된 목소리 → 카드 복사기
  langLab: async s => {
    if (s.flag('tapeHeard')) return s.narrate(`카세트 데크. 듣기 평가 3번의 확인 번호는 「${s.flag('tapeCode')}」였다.`, 'default');
    if (!s.has('backward_tape')) return s.narrate('어학실 카세트 데크. 넣을 테이프가 없다.', 'default');
    await s.narrate('어학실 책상의 카세트 데크. 제2교무실에서 가져온 테이프가 들어갈 것 같다.', 'default');
    const c = await s.choice('역재생 테이프를 넣고 들어 볼까?', ['반대로(앞으로) 돌려서 튼다', '그대로 튼다', '그만둔다']);
    if (c === 2) return;
    s.sfx('tape');
    if (c === 1) { await s.narrate('…늘어진 목소리가 거꾸로 웅얼거린다. 알아들을 수가 없다.', 'scared'); return s.say('희민', '(거꾸로 녹음된 테이프다. 반대로 돌려야 해.)', 'serious'); }
    s.flag('tapeHeard', true);
    await s.narrate('지직… 테이프를 반대로 돌리자, 또렷한 소녀의 목소리가 흘러나왔다.', 'serious');
    await s.narrate('「…살고 싶어. 아직 하고 싶은 게 많은데… 누가 좀…」', 'scared');
    await s.narrate(`목소리가 끊기고 사무적인 남자 목소리. 「듣기 평가 3번. 카드 확인 번호는 ${[...s.flag('tapeCode')].join(', ')}.」`, 'serious');
    await say2(s, ['…방금 그 목소리. 어디서 들어 본 것 같아.', 'sad'], ['…이 목소리, 성아…? 아, 아니야. 그럴 리 없지.', 'scared']);
    s.objective(`4층 컴퓨터실 앞 카드 복사기 — 확인 번호 ${s.flag('tapeCode')}`);
  },

  copier: async s => {
    if (s.has('card_blue') || s.flag('copierDone')) return s.narrate('카드 복사기. 할 일은 끝났다.', 'default');
    if (!s.flag('copierRead')) { s.flag('copierRead', true); await s.doc('copier_manual'); }
    if (!s.has('card_yellow') || !s.has('card_red')) return s.narrate('카드 투입구가 둘. 노란 카드와 빨간 카드가 다 있어야 할 것 같다.', 'default');
    s.sfx('card');
    const code = await s.keypad('카드 복사기 — 확인 번호', 4);
    if (code == null) return;
    if (code !== s.flag('tapeCode')) { s.sfx('locked'); return s.narrate('삐— 번호가 틀렸다는 소리.', 'default'); }
    s.flag('copierDone', true);
    s.sfx('card');
    await s.narrate('위잉… 기계가 두 카드를 삼켰다 뱉어 내더니, 아래 칸으로 새 카드가 툭 떨어졌다.', 'surprised');
    await s.give('card_blue');
    s.objective('4층 오컬트부 (파란 카드키)');
  },

  // ---- 3-09 오컬트부
  occult: async s => {
    if (s.flag('occultDone')) return s.narrate('수정구슬 속에 내 얼굴이 거꾸로 비친다.', 'default');
    s.flag('occultDone', true);
    await s.narrate('촛농이 굳은 탁자 위에 수정구슬과 타로 카드, 그리고 낡은 활동 일지가 놓여 있다.', 'default');
    await s.doc('occult_note');
    await s.give('lrod');
    await s.give('fox_bell');
    await say2(s, ['L로드… 수맥 찾는 막대잖아. 옥상 수영장에 쓰면 될 것 같아.', 'serious'], ['이, 이 방울… 흔들어도 소리가 안 나. 이상해…', 'scared']);
    s.objective(s.has('key_roof') ? '옥상 수영장 (4층 왼쪽 계단 — 옥상 열쇠)' : '3층 — 교실 불을 켜고 전기실 레버 (옥상 열쇠)');
  },

  // ---- 3-10 (선택) 휴게실 · 신문고
  vending3: async s => {
    if (!s.has('coin')) return s.narrate('음료 자판기. 캔커피도 있다. 동전이 있으면 뽑을 수 있겠다.', 'default');
    const opts = s.flag('route') === 'B' ? ['캔커피', '음료수', '그만둔다'] : ['음료수', '캔커피', '그만둔다'];
    const c = await s.choice('자판기에 동전을 넣을까?', opts);
    if (opts[c] === '그만둔다') return;
    s.take('coin');
    s.sfx('coin');
    await s.wait(0.4);
    await s.give(opts[c] === '캔커피' ? 'can_coffee' : 'drink');
  },

  restStart: async s => {
    s.flag('resting', true);
    s.flag('objBeforeRest', s.flag('objective'));
    const a = s.actor('soyoung');
    await s.say('소영', '…잠깐만. 조금만 앉았다 가도 될까.', 'sad');
    if (a) {
      a.follow = false; a.path = null;
      await s.move('soyoung', 26.6, 4.4, 2.2);
      s.face('soyoung', 'down');
      a.talk = 'restTalk';
    }
    await s.narrate('소영이 소파에 털썩 앉았다. 처음으로 지친 얼굴이 보인다.', 'serious');
    s.objective('(선택) 소파의 소영에게 말 걸기');
  },

  restTalk: async s => {
    const opts = [];
    if (s.has('can_coffee')) opts.push(['coffee', '캔커피를 건넨다']);
    if (s.has('diary')) opts.push(['diary', '다이어리를 돌려준다']);
    opts.push(['go', '…이제 가자']);
    const k = opts[await s.choice('', opts.map(o => o[1]))][0];
    if (k === 'coffee') {
      s.take('can_coffee');
      s.flag('coffeeGiven', true);
      aff(s, 'soyoung', 1);
      await s.say('소영', '…고마워. 차갑다.', 'smile');
      await s.say('소영', '이런 거 받아 본 거, 되게 오랜만이야.', 'sad');
      return;
    }
    if (k === 'diary') {
      s.take('diary');
      s.flag('diaryGiven', true);
      const inOrder = !!s.flag('coffeeGiven'); // 캔커피를 먼저 건넸어야 한다(하얀 국화 조건)
      s.flag('restOrderOK', inOrder);
      if (inOrder) {
        aff(s, 'soyoung', 1);
        await s.say('소영', '…내 다이어리. 공원에서 잃어버린 줄 알았는데. 네가 갖고 있었구나.', 'surprised');
        await s.say('소영', '맨 뒤에 언니 사진이 있어. …이것만은 잃어버리면 안 됐는데.', 'sad');
        await s.say('소영', '고마워, 희민아.', 'smile');
      } else {
        await s.say('소영', '…! 이거, 내 다이어리…? 왜 네가…', 'surprised');
        await s.say('소영', '…안은 안 봤지? …됐어. 고마워.', 'angry');
      }
      return;
    }
    s.flag('resting', false);
    s.flag('restDone', true);
    if (s.flag('coffeeGiven') && s.flag('diaryGiven') && s.flag('restOrderOK')) s.flag('chrysanthemum', true); // B '하얀 국화' 엔딩의 조건
    await s.say('소영', '…응. 가자. 이제 괜찮아.');
    const a = s.actor('soyoung');
    if (a) { a.follow = true; a.talk = 'companionTalk'; }
    s.follow('soyoung');
    s.objective(s.flag('objBeforeRest') || '신관 둘러보기');
  },

  sinmungo: async s => {
    if (s.flag('tapeSubmitted')) return s.narrate('연두신문고. 테이프를 넣은 봉투가 투입구 안쪽에 걸려 있다.', 'default');
    if (s.flag('route') !== 'A' || !s.has('backward_tape') || !s.flag('tapeHeard')) return s.narrate("'연두신문고' 투고함. 학생들의 건의를 받는다고 적혀 있다.", 'default');
    await s.narrate("'연두신문고' 투고함. …테이프 속 소녀의 목소리가 귀에 맴돈다.", 'serious');
    const c = await s.choice('역재생 테이프를 신문고에 넣을까?', ['넣는다', '그만둔다']);
    if (c) return;
    s.take('backward_tape');
    s.flag('tapeSubmitted', true); // A '튜베로즈 / 흑단목' 갈림
    await s.narrate('테이프를 봉투에 넣어 투입구에 밀어 넣었다. …누군가 들어 주기를.', 'serious');
    await say2(s, null, ['…잘했어. 그 목소리, 누군가는 들어 줘야 할 것 같았어.', 'sad']);
  },

  // ---- 3-03 (선택) 구석에서 노는 아이
  spiderNote: async s => {
    await s.narrate('감상 책상 위, 레코드 사이에 쪽지 한 장이 끼워져 있다.', 'default');
    await s.doc('ghost_corner');
    if (s.flag('spiderActive')) return;
    s.flag('spiderActive', true);
    s.flag('spiderStep', 0);
    await s.say('희민', '(3학년 교실이라면 3층이다. …찾아 주길 기다리는 아이라.)', 'serious');
  },
  spiderGiggle: async s => {
    s.sfx('squeak');
    await s.narrate('천장 구석에서… 킥킥, 작은 웃음소리가 났다.', 'scared');
  },
  spiderDrop: async s => {
    const p = s.player();
    s.sfx('stinger');
    s.spawn({ id: 'spider', sprite: 'spider_girl_drop', x: p.x, y: p.y - 0.7, noShadow: true });
    s.shake(0.6);
    await s.narrate('툭— 천장에서 거꾸로 매달린 소녀가 얼굴을 들이밀었다! 「…틀렸어.」', 'scared');
    s.despawn('spider');
    s.damage(20);
    await s.narrate('소녀는 천장으로 스르르 사라졌다. 처음부터 다시 찾아야 할 것 같다.', 'serious');
  },
  spiderFound: async s => {
    s.cinema(true);
    const p = s.player();
    s.spawn({ id: 'spider', anim: ['spider_girl_0', 'spider_girl_1'], x: p.x + 1.2, y: p.y - 1.2, noShadow: true, alpha: 0.9 });
    s.sfx('squeak');
    await s.narrate('천장을 기던 소녀가 거꾸로 매달린 채 나를 내려다보았다. 「…찾았다. 이번엔, 네가 이겼어.」', 'scared');
    s.flag('spiderDone', true);
    await s.move('spider', p.x + 4, p.y - 3, 3);
    s.despawn('spider');
    await s.narrate('소녀가 사라진 자리에 무언가 떨어져 있었다.', 'serious');
    await s.give('drink');
    await s.give('coin');
  },

  // ---- 3-11 3학년 교실의 불빛
  starMemo: async s => {
    await s.narrate('게시판에 압정으로 꽂힌 메모. 별 그림이 그려져 있다.', 'default');
    await s.doc('star_memo');
    s.flag('starRead', true);
  },
  lever: async s => {
    if (s.flag('leverDone')) return s.narrate('내려간 레버. 3층 교실들이 환하다.', 'default');
    const c = await s.choice('전기실 레버를 내릴까?', ['내린다', '그만둔다']);
    if (c) return;
    s.sfx('lever');
    if ((s.flag('lightStep') || 0) < list(s.g, 'lightSeq').length) {
      s.shake(0.3);
      await s.narrate('덜컥. …아무 일도 일어나지 않는다. 레버가 도로 올라온다.', 'default');
      return s.say('희민', '(교실 불을 먼저 켜야 하는 것 같다. 게시판 메모대로.)', 'serious');
    }
    s.flag('leverDone', true);
    s.refresh();
    s.shake(0.6);
    await s.narrate('덜컹! 레버가 내려가자 복도 전등이 한꺼번에 깜빡였다.', 'surprised');
    s.sfx('coin');
    await s.narrate('…쨍그랑. 저 아래, 중앙홀 바닥으로 쇠붙이가 떨어지는 소리가 울려 퍼졌다.', 'serious');
    s.flag('keyDropped', true);
    await s.say('희민', '(전등 위에 걸려 있던 게 떨어졌나 보다. 1층 중앙홀이다. …위층에서 다 내려다보이는 자리인데.)', 'serious');
    s.objective('1층 중앙홀 바닥에 떨어진 것 줍기');
  },
  roofKeyTaken: async s => {
    s.flag('roofKeyTaken', true);
    if (!dalsuOn(s.g)) return s.objective('옥상 (4층 왼쪽 계단 — 옥상 열쇠)');
    s.sfx('whistle');
    const j = s.actor('dalsu') || s.spawn(DALSU(5, 6, PD1));
    j.state = 'investigate'; j.lastSeen = [19.5, 10.5]; j.path = null;
    await s.narrate('삐익—! 머리 위 어딘가에서 호루라기. 휘파람 대신, 계단을 뛰어 내려오는 발소리!', 'scared');
    await s.say('희민', '(들켰다…! 숨을 곳— 화장실 칸이나 로비 신발장!)', 'serious');
    s.objective('수위를 피한 뒤 옥상으로 (4층 왼쪽 계단 — 옥상 열쇠)');
  },

  // ---- 3-12 물그림자
  poolDrag: async s => {
    s.sfx('splash');
    s.shake(0.5);
    await s.narrate('발이 물에 잠기는 순간, 무언가 발목을 휘감아 물속으로 끌어당겼다!', 'scared');
    s.damage(15);
    const p = s.player();
    p.x = 6.5; p.y = 14.2; p.dir = 'up';
    s.g.snapCamera();
    s.sfx('splash');
    await s.narrate('…허우적거리다 정신을 차려 보니 물가에 내동댕이쳐져 있었다.', 'scared');
    if (!s.has('lrod')) await s.say('희민', '(아무 데나 밟으면 안 된다. 물길을 알려 줄 무언가가 필요해.)', 'serious');
    else await s.say('희민', '(L로드가 가리키는 반짝이는 칸만 밟아야 해.)', 'serious');
  },
  valve: async s => {
    if (s.flag('poolDrained')) return s.narrate('물이 다 빠진 수영장의 배수 밸브.', 'default');
    if (!s.flag('valveFixed') && !s.has('valve_handle')) return s.narrate('빨간 배수 밸브. 손잡이가 빠져 있어 돌릴 수가 없다. 건너편 데크에 빨간 게 보이는데…', 'default');
    const c = await s.choice('밸브를 돌려 수영장 물을 뺄까?', ['돌린다', '그만둔다']);
    if (c) return;
    s.cinema(true);
    if (!s.flag('valveFixed')) { s.take('valve_handle'); s.flag('valveFixed', true); s.refresh(); }
    s.sfx('valve');
    s.sfx('drain');
    s.shake(0.6);
    await s.narrate('끼익— 밸브를 힘껏 돌리자, 수영장 바닥 어딘가에서 꾸르륵, 물이 빨려 내려가기 시작했다.', 'serious');
    s.flag('poolDrained', true);
    await s.narrate('물 위를 맴돌던 인어가 미친 듯이 몸부림쳤다. 날카로운 비명. 수면이 점점 낮아진다.', 'scared');
    s.despawn('mermaid');
    s.flag('mermaidDead', true);
    s.refresh();
    s.sfx('stinger');
    await s.narrate('…물이 다 빠지자, 바닥에 말라 비틀어진 무언가가 쓰러져 있었다. 그 옆에서 무언가 반짝인다.', 'serious');
    await say2(s, ['…끝났어. 저기, 가운데.', 'serious'], ['…불쌍해. 물이 없으면 살 수 없었던 거구나.', 'sad']);
    s.objective('물 빠진 수영장 한가운데 확인');
  },
  gotWater: async s => {
    await s.narrate("손바닥에 차가운 물기가 배어 나온다. '水' — 세 번째 패다.", 'serious');
    s.objective('2층 서쪽 끝 水 결계문에 水의 패 끼우기');
  },

  // ---- 3-13 水의 문과 어머니 → 3-14 추격
  sealWater: async s => {
    if (!s.has('tablet_water')) return s.narrate("손잡이 없는 낡은 문. 옆의 오각형 홈 가운데에 '水' 자가 새겨져 있다.", 'serious');
    const c = await s.choice('水의 패를 홈에 끼울까?', ['끼운다', '그만둔다']);
    if (c) return;
    s.cinema(true);
    s.take('tablet_water');
    s.flag('sealOpen', true);
    s.sfx('rumble');
    s.shake(1.2);
    await s.narrate("水의 패를 끼우자, 홈 둘레에 새겨진 '水' 자가 푸르게 빛났다.", 'surprised');
    s.door(4, 12, 'open');
    s.sfx('creak');
    await s.cg('cg_water');
    await s.narrate('문 너머로 강당으로 이어지는 통로가 어둡게 뻗어 있다.', 'serious');
    s.sfx('scream');
    s.shake(0.9);
    await s.wait(0.6);
    await s.cg('cg_eunmi');
    await s.narrate('찢어지는 비명. 중앙홀 난간 앞에 헝클어진 머리의 여자가 서서, 누군가의 이름을 부르짖고 있다.', 'scared');
    s.flag('janitorsOut', true);
    s.despawn('dalsu');
    await s.narrate('…멀리서 무언가 털썩, 털썩 두 번 쓰러지는 소리. 휘파람도, 열쇠 꾸러미 소리도 더는 들리지 않는다.', 'serious');
    await say2(s, ['…저건 사람이 아니야. 희민아, 뛰어!', 'surprised'], ['히, 히익…! 희민아…!', 'scared']);
    s.flag('eunmiChase', true);
    s.checkpoint('水의 문을 연 직후부터 다시');
    s.spawn(EUNMI(19.5, 8.5));
    s.sfx('laugh');
    await s.toast('은미에게서 도망쳐라 — 위층으로!');
    s.objective('은미에게서 도망쳐라 — 위층으로, 4층 중앙홀까지');
  },

  ankle: async s => {
    const p = s.player();
    s.spawn({ id: 'hands', anim: ['ankle_hands_0', 'ankle_hands_1'], x: p.x, y: p.y + 0.1, noShadow: true });
    s.sfx('creak');
    await s.narrate('바닥 틈에서 잿빛 손이 솟아올라 발목을 움켜쥐었다!', 'scared');
    const ok = await s.qte('발목을 뿌리쳐라!', 7, 2.6);
    s.despawn('hands');
    if (!ok) { s.damage(15); await s.narrate('간신히 뿌리쳤지만 발목이 욱신거린다…', 'scared'); }
  },

  eunmiFall: async s => {
    s.cinema(true);
    s.flag('eunmiFell', true);
    s.flag('eunmiChase', false);
    const e = s.actor('eunmi');
    if (e) e.chase = false;
    s.sfx('laugh');
    await s.narrate('난간까지 몰렸다. 뒤에서 은미가 웃음소리를 흘리며 다가온다.', 'scared');
    await s.cg('cg_fall');
    s.despawn('eunmi');
    await s.narrate('그때— 은미의 몸이 휘청 뒤로 꺾이더니, 난간 너머 허공으로 넘어갔다.', 'surprised');
    await s.narrate('그 등 뒤 어둠 속에, 짧은 머리 소녀의 그림자가 서 있었던 것 같다. 눈을 깜빡이자 아무도 없었다.', 'serious');
    await s.wait(0.8);
    s.sfx('thud');
    s.shake(0.5);
    await s.narrate('…한참 뒤, 까마득한 아래층 바닥에서 둔탁한 소리가 올라왔다.', 'serious');
    s.clearCheckpoint();
    s.sfx('bell');
    await s.narrate('어디선가 괘종시계가 열두 번 울렸다. 자정. 3월 14일 — 화이트데이가 되었다.', 'serious');
    if (s.flag('route') === 'B') {
      await s.say('소영', '…방금 그 그림자, 봤어?', 'sad');
      const c = await s.choice('', ['…아무것도 못 봤어.', '짧은 머리의 여자애였어.']);
      if (c === 1) { aff(s, 'soyoung', 1); await s.say('소영', '…역시. 나만 본 게 아니구나.', 'serious'); }
      else await s.say('소영', '…그래. 그럼 됐어. 가자.', 'sad');
    } else {
      await s.say('지현', '희, 희민아… 저, 저 아래…', 'scared');
      await s.narrate('까마득한 1층 중앙홀. 쓰러진 은미 곁에 짧은 머리의 소녀가 무릎을 꿇고, 말없이 그녀를 안았다가… 조용히 눕혀 주었다.', 'serious');
      await s.narrate('소녀— 성아는 한 번도 위를 올려다보지 않고, 강당 쪽 어둠으로 걸어 들어갔다.', 'serious');
      await s.say('지현', '…성아야.', 'sad');
    }
    s.objective('4층 차단기실 — 강당에 전원 넣기 (서고의 강당 전원 안내)');
  },

  // ---- 3-15 차단기 → 3장 끝
  breaker: async s => {
    if (s.flag('breakerDone')) return s.narrate('강당 쪽 차단기가 올라가 있다.', 'default');
    if (!s.flag('eunmiFell')) return s.narrate('차단기 함. 레버가 여섯 개. 지금은 함부로 건드리지 않는 게 좋겠다.', 'default');
    if (!s.flag('powerRead')) {
      await s.narrate('…어느 차단기가 강당 쪽인지 모르겠다. 잘못 올리면 신관 전체가 내려갈 것 같다.', 'serious');
      return s.say('희민', '(서고에 시설과 안내문이 있었던 것 같다.)', 'serious');
    }
    const st = await s.switches('차단기 — 강당 전원', ['1', '2', '3', '4', '5', '6'], '강당 쪽 차단기만 올린다');
    if (!st) return;
    const on = st.map((v, i) => (v ? String(i + 1) : null)).filter(Boolean).join(',');
    if (on !== s.flag('breakerCode')) { s.sfx('fuse'); s.shake(0.3); return s.narrate('파직! 불꽃이 튀며 차단기가 도로 내려갔다.', 'surprised'); }
    s.cinema(true);
    s.flag('breakerDone', true);
    s.refresh();
    s.sfx('lever');
    await s.narrate('철컥, 철컥, 철컥. 웅— 멀리 강당 쪽에서 전기가 들어오는 낮은 소리가 들렸다.', 'serious');
    const route = s.flag('route');
    if (route === 'B') await s.say('소영', '강당… 다음은 불, 火야. 거기서 다 끝내자.', 'serious');
    else await s.say('지현', '…성아, 강당에 있을 거야. 가 보자.', 'sad');
    s.flag('ch3Clear', route);
    const name = { A: '성아·지현 루트', B: '소영 루트' }[route];
    await s.endChapter('제3장 끝', `${name}로 진행 — 제4장 「강당」은 준비 중입니다`);
  },

  backDoor: async s => {
    if (s.has('fox_bell')) {
      s.sfx('bell');
      return s.narrate('여우방울이 처음으로 딸랑— 울렸다. 이제 연결 통로에서 길을 잃지 않을 것 같다. …하지만 지금은 돌아갈 이유가 없다.', 'serious');
    }
    await s.narrate('연결 통로로 나가는 문. 문을 열자… 똑같은 복도가 끝없이 이어져 있다. 걸어도 걸어도 같은 자리.', 'scared');
    await s.narrate('…정신을 차려 보니 다시 신관 로비였다.', 'serious');
  },
};
