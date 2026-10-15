// 제2장 · 본관 2구역(土) — 원작 리메이크판 진행 순서를 따른 탑뷰 각색(docs/story-bible.md 2-01~2-12). 대사·문서는 모두 새로 썼다.
//
// 흐름: 木 결계문 → 1층 입구(B: 소영 / A: 성아·지현, 성아는 따로) → 상담실 조사 보고서 → 교무실1 분실물보관실 열쇠
//   → 2층 분실물보관실 흙인형(아기 울음) → 학생부실: 불 끄고 라이터 → 칠판 한자 수수께끼(교장실 비밀번호, {1,2,4,8} 무작위)
//   → 교장실: 문을 닫고 오른쪽 서랍(나무 손잡이·비디오테이프, 열어 두면 수위가 들이닥침) → 책장 뒤 모니터(수위가 열쇠 숨기는 녹화)
//     = 이때부터 수위 활동. A: 녹화 속 노랫소리에 홀린 지현이 사라짐
//   → 교무실1 의자 밀기 → 캐비닛 위 제2교무실 열쇠 → (B) 2층 계단에서 소영의 계단 이야기, 소영 뒤에 붙어 걷기
//   → 휴게실 안쪽 문 → 제2교무실: 저절로 도는 카세트 멈춤, 지현 깨어남, 역재생 테이프(A: 지현 합류 / B: 지현 따로)
//   → 3층 음악실 불 → 피아노 귀신 → 숫자 악보 3-2-4-5-4 = 미레파솔파 → 의자 열쇠 → 그림 조각(뒷면 4자리) → 음악준비실
//     (CD 뒷면 미술실 열쇠, 김지원의 일기, 도자기 — B만 1998년 의식 회상)
//   → 4층 미술실 가마(나무 손잡이)에 흙인형 굽기(수위 순찰) → 꺼내면 5분 제한 → 3층 과학실 세 번째 개수대에서 식힘
//   → 미술실 구석 아기 귀신에게 건넴(연타) → 미술준비실 土의 패(수위 다시 움직임) → 2층 土 결계문 → 루트 확인 → 2장 끝
// 동행 히로인(game.setFollower): 따라온다. 멀리 두고 가거나, 몸으로 막거나, 앞장설 때 앞질러 가거나, 자꾸 말을 걸면 짜증(strikes_<id>, 호감도 -1).

const rnd4 = () => String(1000 + Math.floor(Math.random() * 9000));
const aff = (s, who, n) => s.flag('aff_' + who, (s.flag('aff_' + who) || 0) + n);
const F = k => g => !!g.flags[k];
const NAME = { soyoung: '소영', jihyeon: '지현', seonga: '성아' };
const DIRS = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

// ---------------------------------------------------------------- 아이템
export const items = {
  key_lost: { name: '분실물보관실 열쇠', desc: '2층 분실물보관실 열쇠. 교무실1 컴퓨터 옆 테이블에 있었다.', icon: 'key' },
  doll: { name: '흙인형', desc: '갓난아기만 한 흙인형. 아직 굽지 않아 눅눅하다.' },
  wood_handle: { name: '나무 손잡이', desc: '어딘가의 문에 끼우는 둥근 나무 손잡이. 교장실 서랍에 있었다.' },
  videotape: { name: '비디오테이프', desc: '라벨 없는 비디오테이프. 교장실 서랍에 있었다.' },
  key_office2: { name: '제2교무실 열쇠', desc: '수위가 교무실1 캐비닛 위에 숨겨 둔 열쇠.', icon: 'key' },
  backward_tape: { name: '역재생 테이프', desc: '제2교무실 카세트에서 꺼낸 테이프. 거꾸로 돌린 듯한 소녀의 목소리가 녹음되어 있다.' },
  key_chair: { name: '피아노 의자 열쇠', desc: '피아노 의자 수납칸 열쇠.', icon: 'key' },
  picture_piece: { name: '그림 조각', desc: g => `찢어진 그림의 한 조각. 뒷면에 숫자가 적혀 있다. 「${g.flags.prepCode}」`, use: 'readPiece' },
  cd: { name: '음악 교사의 CD', desc: "케이스에 손글씨로 '김지원'. 뒷면에 열쇠가 테이프로 붙어 있었다." },
  key_art: { name: '미술실 열쇠', desc: '4층 미술실 열쇠. CD 뒷면에 붙어 있었다.', icon: 'key' },
  pottery: { name: '도자기', desc: '음악준비실에 있던 작은 도자기. 유약 사이로 하얀 가루가 섞여 있다.' },
  doll_hot: { name: '뜨거운 흙인형', desc: '가마에서 막 꺼낸 인형. 손이 데일 듯 뜨겁다. 어서 식혀야 한다.' },
  doll_done: { name: '완성된 흙인형', desc: '굽고 식힌 흙인형. 단단하고, 아직 조금 따뜻하다.' },
  tablet_earth: { name: '土의 패', desc: "'土' 자가 새겨진 오각형 흙 패. 묵직하고 따뜻하다." },
  can_coffee: { name: '캔커피', desc: '따지 않은 캔커피. 누군가에게 건네면 좋아할지도.' },
};

// ---------------------------------------------------------------- 문서 (전부 새로 쓴 글)
// 교장실 비밀번호 {1,2,4,8}: 숫자마다 '글자 빼기' 한 줄. 줄 순서가 매번 무작위인 비밀번호 순서
const RIDDLE = { 1: '不 − 小', 2: '示 − 小', 4: '西 − 一', 8: '分 − 刀' };
const ORD = ['첫째', '둘째', '셋째', '넷째'];
export const docs = {
  report: {
    title: '조사 보고서 — 가사실습실 화재 이후',
    body: `[대외비] 연두고등학교 사고 경위 조사 (교무부 작성)

1998년 3월 13일 밤, 본관 1구역 가사실습실에서 원인을 알 수 없는 화재가 발생. 실습실 안에 혼자 남아 있던 2학년 김○○ 학생이 연기를 마시고 천식 발작을 일으켜 사망. 함께 있기로 했다는 친구는 그날 학교에 오지 않았음.

같은 해 봄부터 야간에 학교에 남은 학생들이 '누가 이름을 불렀다', '닫힌 교실에서 분필 소리가 났다'는 이야기를 잇달아 전함. 비슷한 소문이 짧은 기간에 한꺼번에 퍼진 점이 특이함.

같은 해 여름, 화재 당일 오지 않았던 학생(한○○)이 학교 안에서 숨진 채 발견됨. 이어서 음악 담당 교사가 사직서를 남기고 연락이 끊김.

교장 선생님의 지시로 이후 야간 출입을 전면 금지하고, 수위 근무를 강화함. 학교 곳곳의 '패'에는 손대지 말 것.

— 이 보고서는 외부로 반출하지 않는다.`,
  },
  riddle: {
    title: '학생부실 칠판 — 보이지 않는 분필',
    body: g => `不 — 아닐 불.
아닌 것을 덜어 내면, 남는 것이 문을 연다.

${[...String(g.flags.principalCode || '1248')].map((d, i) => `${ORD[i]} — ${RIDDLE[d]}`).join('\n')}

(덜어 내고 남은 글자를 숫자로 읽을 것)`,
  },
  solfege: {
    title: '음악실 칠판 — 계이름',
    body: `계이름에 번호를 붙여 외웁시다.

도 = 1   레 = 2   미 = 3   파 = 4
솔 = 5   라 = 6   시 = 7   (높은) 도 = 8

숫자 악보는 이 번호대로 칩니다.`,
  },
  score: {
    title: '피아노 위의 숫자 악보',
    body: `누렇게 바랜 오선지에 음표 대신 숫자만 적혀 있다.

3 · 2 · 4 · 5 · 4

아래 귀퉁이에 작은 글씨: 「의자는 이 노래를 기억한다」`,
  },
  kim_diary: {
    title: '김지원의 일기',
    body: `6월 26일
교장의 부탁을 받고 이 학교에 온 지 석 달. 부적 다섯 개 중 하나의 기운이 흐트러져 있다. 밤마다 학생들이 남아 있으면 일이 더 어려워진다. 아이들이 밤에 학교를 꺼리도록 이야기를 몇 개 지어 퍼뜨렸다. 선생이 할 짓은 아니지만, 아이들을 위해서다.

7월 1일
한 어머니가 찾아왔다. 봄의 화재로 딸을 잃었다고 했다. 이 학교의 기운을 거꾸로 쓰면 아이를 되돌릴 수 있지 않느냐고, 내 앞에서 무릎을 꿇었다. 나는 할 수 없다고 대답했다. …할 수 없다고, 대답했어야 했다.

7월 20일
음악실. 촛불 다섯 개. 진은 그렸고, 결계는 내가 연다. 그릇이 될 아이는 스스로 오겠다고 했다. 친구를 혼자 죽게 한 죗값이라며.
이 일기를 읽는 사람이 있다면, 그날 밤 무슨 일이 있었는지 나는 끝내 적지 못했다는 것만 알아 두길.`,
  },
  ghost_baby: {
    title: '괴담 — 미술실의 울음소리',
    body: `미술준비실에는 아무도 쓰지 않는 가마가 하나 있었다고 한다. 어느 해 겨울, 그 방에서 누군가 몰래 아기를 낳았다는 소문이 돌았다. 아기가 어떻게 되었는지는 아무도 말하지 않았다.

그 뒤로 밤의 미술실에서는 아기 울음소리가 들린다고 한다. 우는 아기에게 맨손으로 다가간 사람은 돌아오지 못했다고.

…아기에게 필요한 건 안아 줄 무언가였다. 흙으로 빚어 불에 구운, 따뜻한 것.`,
  },
};

// ---------------------------------------------------------------- 수위 (층마다 따로 순찰)
const BONGGU = (x, y, patrol) => ({ id: 'bonggu', kind: 'janitor', x, y, dir: 'left', patrol });
const P1 = [[35.5, 10.5], [3.5, 10.5], [10.5, 6.5], [18.5, 10.2], [34.5, 5.5]];
const P4 = [[36.5, 10.5], [3.5, 10.5], [18.5, 5.5], [36.5, 10.2]];
const earthTaken = g => !!g.flags['ev:tabletEarth'] && !g.flags.ch2Clear;

// ---------------------------------------------------------------- 맵 공통
const moon = (x, y) => ({ x, y, r: 3.4, color: '120,140,200', a: 0.5 });
const vend = (x, y) => ({ x, y, r: 2, color: '255,110,110', a: 0.55, los: false, fx: 'vend' });
const EXIT = [{ x: 1.5, y: 8.6, color: '60,255,120' }, { x: 38.5, y: 8.6, color: '60,255,120' }];
// 계단: 왼쪽 계단(1~2열) = 위층, 오른쪽 계단(4~5열) = 아래층. 맨 윗칸을 밟으면 이동, 도착은 반대쪽 계단 아래
const FLOORS = ['main2_1f', 'main2_2f', 'main2_3f', 'main2_4f'];
const stairsTo = to => async s => {
  const id = s.flag('follower'), a = id && s.actor(id), p = s.player();
  const left = a && Math.hypot(a.x - p.x, a.y - p.y) > 6; // 동행을 멀리 두고 계단을 오르내리면 짜증
  const up = FLOORS.indexOf(to) > FLOORS.indexOf(s.g.mapId);
  await s.warp(to, up ? 5 : 2, 4.6, 'down');
  if (left) await upset(s, id, 'left');
};
const stairEvents = n => [
  ...(n < 4 ? [{ id: 'up' + n, on: 'touch', x: 1, y: 1, w: 2, h: 1, run: stairsTo(FLOORS[n]) }] : []),
  ...(n > 1 ? [{ id: 'down' + n, on: 'touch', x: 4, y: 1, w: 2, h: 1, run: stairsTo(FLOORS[n - 2]) }] : []),
];
const stall = (id, x, y) => ({ id, on: 'act', x, y, run: s => s.hide(x + 0.5, y + 1.4) });
const desks = (x0, y) => [0, 2, 4].map(i => ({ s: 'desk', x: x0 + i, y, solid: true }));

// 교무실1 의자(밀기 퍼즐): 처음 (16,5) → 캐비닛 앞 (19,2)
const CHAIR0 = [16, 5], CHAIR_T = [19, 2];
const chairAt = g => (typeof g.flags.chairPos === 'string' ? g.flags.chairPos.split(',').map(Number) : CHAIR0);
// 교무실1(7~20열, 1~7행) 안에서 의자를 밀 수 없는 칸: 방 밖이거나 다른 가구
let officeSolid = null;
const officeBlocked = (x, y) => {
  officeSolid ??= new Set(maps.main2_1f.props.filter(p => p.solid && p.s !== 'chair').flatMap(p => Array.from({ length: p.w || 1 }, (_, i) => `${p.x + i},${p.y}`)));
  return x < 7 || x > 20 || y < 1 || y > 7 || officeSolid.has(`${x},${y}`);
};

// ---------------------------------------------------------------- 맵
export const maps = {
  main2_1f: {
    id: 'main2_1f',
    name: '본관 2구역 1층',
    grid: [
      '#######WWWWWWWWWWWWWW#WWWWWWWW#WWWWWWWW#',
      '#==#==#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '#==#==#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '#==#==#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,#,,,,,,,,#,,,,,,,,#',
      '##:::##wwDwwwwwwwwDww#####D####D########',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '####D#####D#########D############:::####',
      '#,,,,,,,,#________#,,,,,,,,,,#:::::::::#',
      '#,,,,,,,,#________#,,,,,,,,,,#:::::::::#',
      '#,,,,,,,,#________#,,,,,,,,,,#:::::::::#',
      '#,,,,,,,,#________#,,,,,,,,,,#:::::::::#',
      '#,,,,,,,,##_#_#_###,,,,,,,,,,#:::::::::#',
      '#,,,,,,,,##_#_#_###,,,,,,,,,,#:::::::::#',
      '#WWWWWWWW#WWWWWWWW#WWWWWWWWWW#WWWWDWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 9, y: 8 }, { x: 18, y: 8 },
      { x: 26, y: 8, locked: true, lockedText: '교장실. 손잡이 위에 숫자 버튼이 달린 잠금장치가 있다.', lockedFace: 'serious' },
      { x: 31, y: 8 },
      { x: 4, y: 12 }, { x: 10, y: 12 },
      { x: 20, y: 12, locked: true, lockedText: '행정실. 잠겨 있다.', lockedFace: 'default' },
      { x: 34, y: 19, sprite: 'sealdoor', locked: true, lockedText: '본관 1구역으로 이어지는 낡은 문. 다시는 꿈쩍도 하지 않는다.', lockedFace: 'serious' },
    ],
    props: [
      // 계단: 1층에서 아래로는 내려갈 수 없다(셔터)
      { s: 'stair_gate', x: 4, y: 3, w: 2, solid: true },
      // 교무실1
      { s: 'pc_desk', x: 7, y: 1, w: 2, solid: true },
      { s: 'desk', x: 9, y: 1, solid: true },
      { s: 'teacher_desk', x: 8, y: 3, w: 2, solid: true }, { s: 'teacher_desk', x: 11, y: 3, w: 2, solid: true },
      { s: 'teacher_desk', x: 8, y: 5, w: 2, solid: true }, { s: 'teacher_desk', x: 11, y: 5, w: 2, solid: true },
      { s: 'file_cabinet', x: 14, y: 1, solid: true }, { s: 'file_cabinet', x: 15, y: 1, solid: true },
      { s: 'tall_cabinet', x: 19, y: 1, solid: true },
      { s: 'chair', x: CHAIR0[0], y: CHAIR0[1], at: chairAt, solid: true },
      { s: 'trash_can', x: 13, y: 7, solid: true },
      // 교장실
      { s: 'shelf', x: 22, y: 1, w: 2, at: g => (g.flags.shelfMoved ? [24, 1] : [22, 1]), solid: true },
      { s: 'cctv_monitor', x: 22, y: 1, w: 2, solid: true, when: F('shelfMoved') },
      { s: 'teacher_desk', x: 25, y: 3, w: 2, solid: true },
      { s: 'trophy_case', x: 28, y: 1, w: 2, solid: true },
      { s: 'sofa', x: 23, y: 6, w: 2, solid: true },
      // 상담실
      { s: 'desk', x: 35, y: 3, solid: true },
      { s: 'sofa', x: 34, y: 5, w: 2, solid: true },
      { s: 'file_cabinet', x: 38, y: 1, solid: true },
      { s: 'plant', x: 31, y: 1, solid: true },
      // 복도
      { s: 'bulletin', x: 23, y: 8, w: 2 },
      { s: 'hydrant', x: 6, y: 8 }, { s: 'exit_sign', x: 1, y: 8 }, { s: 'exit_sign', x: 38, y: 8 },
      { s: 'poster_2', x: 29, y: 8 }, { s: 'clock', x: 33, y: 8 },
      { s: 'extinguisher', x: 38, y: 9, solid: true },
      // 당직실
      { s: 'bed', x: 6, y: 15, w: 2, solid: true },
      { s: 'lockers', x: 1, y: 13, solid: true },
      { s: 'tv', x: 8, y: 13, solid: true },
      { s: 'desk', x: 2, y: 17, solid: true }, { s: 'desk', x: 6, y: 17, solid: true },
      // 화장실
      { s: 'sink', x: 11, y: 13, solid: true }, { s: 'sink', x: 12, y: 13, solid: true },
      // 입구(로비)
      { s: 'railing', x: 31, y: 15, w: 3, solid: true },
      { s: 'vending', x: 38, y: 13, solid: true },
      { s: 'umbrella_stand', x: 31, y: 18, solid: true },
      { s: 'seal_slot', x: 35, y: 19 },
    ],
    lights: [
      moon(10, 1.5), moon(17, 1.5), moon(25, 1.5), moon(34, 1.5),
      moon(4, 18), moon(14, 18), moon(24, 18), moon(36, 18),
      vend(38.5, 14.1),
    ],
    glows: EXIT,
    actors: [{ ...BONGGU(35.5, 10.5, P1), cond: g => g.flags.janitor2On && !g.flags.babyTimer && !g.flags['ev:tabletEarth'] }],
    events: [
      ...stairEvents(1),
      { id: 'gate1', on: 'act', x: 4, y: 3, w: 2, text: '아래층으로 내려가는 계단. 녹슨 셔터가 내려와 있다.', face: 'default' },
      { id: 'save21', on: 'act', x: 23, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      { id: 'vend21', on: 'act', x: 38, y: 13, run: 'vending' },
      { id: 'coinRail', on: 'act', x: 32, y: 15, item: 'coin', text: '난간 아래 틈에 동전이 끼어 있다.', face: 'default' },
      { id: 'sealBack', on: 'act', x: 35, y: 19, text: "낡은 문 옆의 홈. 木의 패는 문과 함께 굳어 버린 듯 빠지지 않는다.", face: 'serious' },
      // 상담실
      { id: 'report', on: 'act', x: 35, y: 3, run: 'report' },
      // 교무실1
      { id: 'keyLost', on: 'act', x: 9, y: 1, item: 'key_lost', text: '컴퓨터 옆 작은 테이블 위에 꼬리표 달린 열쇠가 놓여 있다.', face: 'default', after: s => s.objective('2층 분실물보관실 살펴보기') },
      { id: 'pc', on: 'act', x: 7, y: 1, w: 2, text: '낡은 컴퓨터. 전원이 들어오지 않는다.', face: 'default' },
      { id: 'cabinet', on: 'act', x: 19, y: 1, run: 'highCabinet' },
      { id: 'chair', on: 'act', x: CHAIR0[0], y: CHAIR0[1], at: chairAt, run: 'pushChair', cond: F('cctvSeen') },
      // 교장실
      { id: 'principalDoor', on: 'act', x: 26, y: 8, run: 'principalDoor', cond: g => !g.flags.principalOpen },
      { id: 'principalIn', on: 'touch', x: 22, y: 4, w: 8, h: 3, once: true, run: 'principalIn' },
      { id: 'drawerL', on: 'act', x: 25, y: 3, text: '책상 왼쪽 서랍. 결재 서류뿐이다.', face: 'default' },
      { id: 'drawer', on: 'act', x: 26, y: 3, run: 'drawer' },
      { id: 'cctv', on: 'act', x: 22, y: 1, w: 2, run: 'cctv', cond: F('shelfMoved') },
      { id: 'trophy', on: 'act', x: 28, y: 1, w: 2, text: '상패와 트로피. 맨 위 칸에 오래된 학교 모형이 놓여 있다.', face: 'default' },
      // 당직실
      { id: 'closet21', on: 'act', x: 1, y: 13, run: s => s.hide(1.5, 13.6) },
      { id: 'pen21', on: 'act', x: 2, y: 17, item: 'pen', text: '당직 일지 옆에 사인펜이 있다.', face: 'default' },
      // 1장에서 라이터를 줍지 않았으면 여기서(학생부실 칠판 퍼즐에 필요)
      { id: 'lighter21', on: 'act', x: 6, y: 17, item: 'lighter', text: '당직 책상 위 재떨이 옆에 일회용 라이터가 있다.', face: 'default', after: 'lighterTip', cond: g => !g.has('lighter') },
      { id: 'tv21', on: 'act', x: 8, y: 13, text: '작은 텔레비전. 화면 가득 지지직거리는 빗금뿐이다.', face: 'serious' },
      // 화장실 칸
      stall('stall211', 11, 17), stall('stall212', 13, 17), stall('stall213', 15, 17),
    ],
  },

  main2_2f: {
    id: 'main2_2f',
    name: '본관 2구역 2층',
    grid: [
      '#######WWWWWWWWW#WWWWWW#WWWWWWWWWW######',
      '#==#==#,,,,,,,,,#,,,,,,#,,,,,,,,,,######',
      '#==#==#,,,,,,,,,#,,,,,,#,,,,,,,,,,######',
      '#==#==#,,,,,,,,,#,,,,,,#,,,,,,,,,,######',
      '#:::::#,,,,,,,,,#,,,,,,D,,,,,,,,,,######',
      '#:::::#,,,,,,,,,#,,,,,,#,,,,,,,,,,######',
      '#:::::#,,,,,,,,,#,,,,,,#,,,,,,,,,,######',
      '#:::::#,,,,,,,,,#,,,,,,#,,,,,,,,,,######',
      '##:::####D########D#########D#######D###',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '####D#########D##########D#########D####',
      '#________#,,,,,,,,,,#,,,,,,,,,#,,,,,,,,#',
      '#________#,,,,,,,,,,#,,,,,,,,,#,,,,,,,,#',
      '#________#,,,,,,,,,,#,,,,,,,,,#,,,,,,,,#',
      '#________#,,,,,,,,,,#,,,,,,,,,#,,,,,,,,#',
      '##_#_#_###,,,,,,,,,,#,,,,,,,,,#,,,,,,,,#',
      '##_#_#_###,,,,,,,,,,#,,,,,,,,,#,,,,,,,,#',
      '#WWWWWWWW#WWWWWWWWWW#WWWWWWWWW#WWWWWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 9, y: 8 }, { x: 18, y: 8 },
      { x: 23, y: 4, locked: 'key_office2', lockedText: '제2교무실로 이어지는 안쪽 문. 잠겨 있다.', lockedFace: 'serious' },
      { x: 28, y: 8, locked: true, lockedText: '제2교무실. 안쪽에서 걸쇠가 걸려 있다. 옆 휴게실 쪽 문으로 들어가야 할 것 같다.', lockedFace: 'serious' },
      { x: 36, y: 8, sprite: 'sealdoor', locked: true, lockedText: "손잡이 없는 낡은 문. 옆에 '土' 자가 새겨진 오각형 홈이 있다.", lockedFace: 'serious' },
      { x: 4, y: 12 }, { x: 14, y: 12 },
      { x: 25, y: 12, locked: true, lockedText: '인쇄실. 잠겨 있다. 문틈으로 잉크 냄새가 난다.', lockedFace: 'default' },
      { x: 35, y: 12, locked: 'key_lost', lockedText: '분실물보관실. 잠겨 있다.', lockedFace: 'default' },
    ],
    props: [
      // 학생부실
      { s: 'blackboard_kr', x: 9, y: 0, w: 3 },
      { s: 'teacher_desk', x: 13, y: 2, w: 2, solid: true },
      ...desks(8, 4), { s: 'file_cabinet', x: 15, y: 6, solid: true },
      // 교무실 휴게실
      { s: 'sofa', x: 17, y: 2, w: 2, solid: true },
      { s: 'tv', x: 21, y: 1, solid: true },
      { s: 'plant', x: 22, y: 7, solid: true },
      // 제2교무실
      { s: 'teacher_desk', x: 26, y: 2, w: 2, solid: true }, { s: 'teacher_desk', x: 26, y: 6, w: 2, solid: true },
      { s: 'cassette_desk', x: 30, y: 2, w: 2, solid: true },
      { s: 'file_cabinet', x: 33, y: 1, solid: true }, { s: 'teacher_desk', x: 31, y: 6, w: 2, solid: true },
      // 복도
      { s: 'bulletin', x: 12, y: 8, w: 2 },
      { s: 'seal_slot', x: 37, y: 8 },
      { s: 'hydrant', x: 6, y: 8 }, { s: 'exit_sign', x: 1, y: 8 }, { s: 'poster_0', x: 21, y: 8 }, { s: 'poster_1', x: 32, y: 8 },
      // 화장실·보건실·분실물보관실
      { s: 'sink', x: 1, y: 13, solid: true }, { s: 'sink', x: 2, y: 13, solid: true },
      { s: 'bed', x: 10, y: 14, w: 2, solid: true }, { s: 'bed', x: 10, y: 17, w: 2, solid: true },
      { s: 'desk', x: 18, y: 15, solid: true }, { s: 'file_cabinet', x: 19, y: 13, solid: true },
      { s: 'shelf', x: 31, y: 13, w: 2, solid: true }, { s: 'shelf', x: 37, y: 13, w: 2, solid: true },
      { s: 'shelf', x: 32, y: 17, w: 2, solid: true }, { s: 'shelf', x: 36, y: 17, w: 2, solid: true },
    ],
    lights: [
      { x: 11, y: 4, r: 6.5, color: '240,244,255', a: 0.95, flag: 'stuLightOn', fx: 'fluo' },
      moon(20, 1.5), moon(29, 1.5), moon(14, 18), moon(25, 18), moon(34, 18), moon(5, 18),
      { x: 30.5, y: 2.6, r: 1.6, color: '255,90,70', a: 0.6, flag: 'tapePlaying', fx: 'pulse' },
    ],
    glows: [EXIT[0]],
    loops: [{ flag: 'tapePlaying', sfx: 'tape', every: 2.4 }],
    actors: [{ ...BONGGU(30.5, 10.5, [[30.5, 10.5], [12.5, 10.5]]), cond: earthTaken }],
    events: [
      ...stairEvents(2),
      { id: 'save22', on: 'act', x: 12, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      // 학생부실
      { id: 'stuSwitch', on: 'act', x: 10, y: 8, run: 'stuSwitch', cond: g => g.player.y < 8 },
      { id: 'riddle', on: 'act', x: 9, y: 0, w: 3, run: 'riddle' },
      // 교무실 휴게실 → 제2교무실
      { id: 'stairsTalk', on: 'touch', x: 1, y: 4, w: 5, h: 4, once: true, run: 'stairsTalk', cond: g => g.flags.route === 'B' && g.has('key_office2') && !g.flags.tapeStopped },
      { id: 'tv22', on: 'act', x: 21, y: 1, text: '휴게실 텔레비전. 꺼진 화면에 내 얼굴이 비친다.', face: 'default' },
      { id: 'office2In', on: 'touch', x: 24, y: 1, w: 10, h: 7, once: true, run: 'office2In' },
      { id: 'cassette', on: 'act', x: 30, y: 2, w: 2, run: 'cassette' },
      // 土 결계문
      { id: 'sealEarth', on: 'act', x: 36, y: 8, w: 2, run: 'sealEarth', cond: g => g.player.y > 8 },
      // 보건실·분실물보관실
      { id: 'drink22', on: 'act', x: 18, y: 15, item: 'drink', text: '보건실 책상 위에 음료수가 하나 있다.', face: 'default' },
      { id: 'pen22', on: 'act', x: 19, y: 13, item: 'pen', text: '서류함 위에 사인펜이 굴러다닌다.', face: 'default' },
      { id: 'doll', on: 'act', x: 32, y: 17, w: 2, item: 'doll', text: '상자 더미 맨 아래에 갓난아기만 한 흙인형이 놓여 있다.', face: 'surprised', after: 'dollCry' },
      { id: 'lostShelf', on: 'act', x: 31, y: 13, w: 2, text: "'분실물' 꼬리표가 붙은 상자들. 체육복, 우산, 짝 잃은 실내화…", face: 'default' },
      stall('stall221', 2, 17), stall('stall222', 4, 17), stall('stall223', 6, 17),
    ],
  },

  main2_3f: {
    id: 'main2_3f',
    name: '본관 2구역 3층',
    grid: [
      '#######WWWWWWWWWWWWWWWW#WWWWWW#WWWWWWWW#',
      '#==#==#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#==#==#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#==#==#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '##:::##wwDwwwwwwwwwwDww###D#######D#####',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '####D########D####D#########D#####D#####',
      '#,,,,,,,,,,,,,,,,#________#,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,#________#,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,#________#,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,#________#,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,##_#_#_###,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,##_#_#_###,,,,,,,,,,,,#',
      '#WWWWWWWWWWWWWWWW#WWWWWWWW#WWWWWWWWWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 9, y: 8 }, { x: 20, y: 8 },
      { x: 26, y: 8, sprite: 'metaldoor', locked: true, lockedText: '음악준비실. 숫자 네 개를 맞추는 자물쇠가 걸려 있다.', lockedFace: 'serious' },
      { x: 34, y: 8, locked: true, lockedText: '과학준비실. 잠겨 있다. 문틈으로 약품 냄새가 새어 나온다.', lockedFace: 'default' },
      { x: 4, y: 12 }, { x: 13, y: 12 }, { x: 18, y: 12 },
      { x: 28, y: 12, locked: true, lockedText: '시청각실. 잠겨 있다.', lockedFace: 'default' },
      { x: 34, y: 12, locked: true, lockedText: '시청각실. 잠겨 있다.', lockedFace: 'default' },
    ],
    props: [
      // 음악실
      { s: g => (g.flags.pianoBlood ? 'piano_blood' : 'piano'), x: 12, y: 1, w: 3, solid: true },
      { s: g => (g.flags.benchOpen ? 'piano_bench_open' : 'piano_bench'), x: 13, y: 2, solid: true },
      { s: 'blackboard_kr', x: 17, y: 0, w: 3 },
      ...desks(8, 5).filter(d => d.x !== 12), ...desks(15, 4), ...desks(15, 6),
      { s: 'speaker', x: 22, y: 1, solid: true },
      // 음악준비실
      { s: 'shelf', x: 24, y: 1, w: 2, solid: true },
      { s: 'desk', x: 28, y: 3, solid: true },
      { s: 'desk', x: 25, y: 5, solid: true },
      { s: 'file_cabinet', x: 29, y: 6, solid: true },
      // 복도
      { s: 'bulletin', x: 30, y: 8, w: 2 },
      { s: 'hydrant', x: 6, y: 8 }, { s: 'exit_sign', x: 1, y: 8 }, { s: 'exit_sign', x: 38, y: 8 }, { s: 'poster_2', x: 24, y: 8 },
      // 과학실: 개수대 4개(왼쪽부터 1~4번), 실험대
      { s: 'sink', x: 6, y: 13, solid: true }, { s: 'sink', x: 8, y: 13, solid: true },
      { s: 'sink', x: 10, y: 13, solid: true }, { s: 'sink', x: 15, y: 13, solid: true },
      { s: 'workbench', x: 3, y: 15, w: 2, solid: true }, { s: 'workbench', x: 8, y: 15, w: 2, solid: true }, { s: 'workbench', x: 13, y: 15, w: 2, solid: true },
      { s: 'blackboard_kr', x: 1, y: 12, w: 3 },
      // 화장실
      { s: 'sink', x: 20, y: 13, solid: true }, { s: 'sink', x: 21, y: 13, solid: true },
    ],
    lights: [
      { x: 14.5, y: 4.5, r: 7.5, color: '240,244,255', a: 0.95, flag: 'musicLight', fx: 'fluo' },
      moon(10, 1.5), moon(19, 1.5), moon(27, 1.5), moon(34, 1.5),
      moon(5, 18), moon(12, 18), moon(22, 18), moon(32, 18),
    ],
    glows: EXIT,
    actors: [{ ...BONGGU(30.5, 10.5, [[30.5, 10.5], [8.5, 10.5]]), cond: earthTaken }],
    events: [
      ...stairEvents(3),
      { id: 'save23', on: 'act', x: 30, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      // 음악실
      { id: 'musicSwitch', on: 'act', x: 10, y: 8, run: 'musicSwitch', cond: g => g.player.y < 8 },
      { id: 'piano', on: 'act', x: 12, y: 1, w: 3, run: 'piano' },
      { id: 'bench', on: 'act', x: 13, y: 2, run: 'bench' },
      { id: 'solfege', on: 'act', x: 17, y: 0, w: 3, run: s => { s.flag('solfegeRead', true); return s.doc('solfege'); } },
      // 음악준비실
      { id: 'prepLock', on: 'act', x: 26, y: 8, run: 'prepLock', cond: g => !g.flags.prepOpen },
      { id: 'cd', on: 'act', x: 24, y: 1, w: 2, run: 'gotCd', cond: g => !g.flags.cdTaken },
      { id: 'kimDiary', on: 'act', x: 28, y: 3, run: s => { s.flag('kimDiaryRead', true); return s.doc('kim_diary'); } },
      { id: 'pottery', on: 'act', x: 25, y: 5, run: 'pottery', cond: g => !g.flags.potteryTaken },
      // 과학실
      { id: 'sink1', on: 'act', x: 6, y: 13, run: 'sinkDry' },
      { id: 'sink2', on: 'act', x: 8, y: 13, run: 'sinkDry' },
      { id: 'sink3', on: 'act', x: 10, y: 13, run: 'sink3' },
      { id: 'sink4', on: 'act', x: 15, y: 13, run: 'sinkDry' },
      { id: 'sciBoard', on: 'act', x: 1, y: 12, w: 3, text: "칠판 구석에 분필로 크게: 「개수대 고장! 세 번째 것만 물 나옴 — 과학부」", face: 'default', cond: g => g.player.y > 12 },
      stall('stall231', 19, 17), stall('stall232', 21, 17), stall('stall233', 23, 17),
    ],
  },

  main2_4f: {
    id: 'main2_4f',
    name: '본관 2구역 4층',
    grid: [
      '#######WWWWWWWWWWWWWWWW#WWWWWW#WWWWWWWW#',
      '#==#==#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#==#==#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#==#==#,,,,,,,,,,,,,,,,D,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '#:::::#,,,,,,,,,,,,,,,,#,,,,,,#,,,,,,,,#',
      '##:::##wwDwwwwwwwwwwDww#########D#######',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#####...######D########D########D#######',
      '#,,,,,,,,,,,,#________#,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,#________#,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,#________#,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,#________#,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,##_#_#_###,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,##_#_#_###,,,,,,,,,,,,,,,,#',
      '#WWWWWWWWWWWW#WWWWWWWW#WWWWWWWWWWWWWWWW#',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 9, y: 8, locked: 'key_art', lockedText: '미술실. 잠겨 있다. 안에서… 아기 울음소리?', lockedFace: 'scared' },
      { x: 20, y: 8, locked: 'key_art', lockedText: '미술실. 잠겨 있다. 안에서… 아기 울음소리?', lockedFace: 'scared' },
      { x: 23, y: 3, locked: true, lockedText: '미술준비실. 안쪽에서 무언가가 누르고 있는 듯 꿈쩍도 하지 않는다.', lockedFace: 'scared' },
      { x: 32, y: 8, locked: true, lockedText: '생물실. 잠겨 있다. 유리창 너머로 인체모형의 실루엣이 보인다…', lockedFace: 'scared' },
      { x: 14, y: 12 },
      { x: 23, y: 12, locked: true, lockedText: '1학년 교실. 잠겨 있다.', lockedFace: 'default' },
      { x: 32, y: 12, locked: true, lockedText: '1학년 교실. 잠겨 있다.', lockedFace: 'default' },
    ],
    props: [
      { s: 'stair_gate', x: 1, y: 3, w: 2, solid: true },
      // 미술실
      { s: g => (g.flags.kilnBaking ? 'kiln_hot' : 'kiln'), x: 20, y: 1, w: 2, solid: true },
      { s: 'workbench', x: 12, y: 3, w: 2, solid: true }, { s: 'workbench', x: 16, y: 3, w: 2, solid: true },
      { s: 'easel', x: 12, y: 6, solid: true }, { s: 'easel', x: 14, y: 6, solid: true }, { s: 'easel', x: 17, y: 6, solid: true },
      { s: 'plaster_bust', x: 22, y: 6, solid: true },
      // 미술준비실
      { s: 'shelf', x: 27, y: 1, w: 2, solid: true },
      { s: 'shelf', x: 24, y: 5, w: 2, solid: true },
      // 복도
      { s: 'bulletin', x: 25, y: 8, w: 2 },
      { s: 'hydrant', x: 6, y: 8 }, { s: 'exit_sign', x: 38, y: 8 }, { s: 'poster_1', x: 29, y: 8 },
      // 휴게 공간
      { s: 'sofa', x: 2, y: 15, w: 2, solid: true },
      { s: 'desk', x: 6, y: 16, solid: true },
      { s: 'vending', x: 11, y: 13, solid: true },
      { s: 'plant', x: 1, y: 18, solid: true },
      // 화장실
      { s: 'sink', x: 15, y: 13, solid: true }, { s: 'sink', x: 16, y: 13, solid: true },
    ],
    lights: [
      moon(10, 1.5), moon(16, 1.5), moon(27, 1.5), moon(34, 1.5),
      moon(4, 18), moon(9, 18), moon(28, 18),
      { x: 21, y: 2, r: 3.2, color: '255,120,40', a: 0.75, flag: 'kilnBaking', fx: 'pulse' },
      { x: 8, y: 2, r: 2.2, color: '200,90,90', a: 0.45, flag: 'babyCry', fx: 'pulse' },
      vend(11.5, 14.1),
    ],
    glows: [EXIT[1]],
    actors: [
      { id: 'baby', kind: 'ghost', sprite: 'baby_ghost', x: 8, y: 2.3, glow: '200,120,120', cond: g => !g.flags.babyDone },
      { ...BONGGU(36.5, 10.5, P4), cond: g => (g.flags.janitor2On && !g.flags.babyTimer && !g.flags.babyDone) || earthTaken(g) },
    ],
    events: [
      ...stairEvents(4),
      { id: 'gate4', on: 'act', x: 1, y: 3, w: 2, text: '5층으로 가는 계단. 쇠창살 문이 굳게 잠겨 있다.', face: 'default' },
      { id: 'save24', on: 'act', x: 25, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      // 미술실: 구석의 아기(가까이 가면 즉사, 완성된 인형이 있으면 건넴) → 경고 → 가마
      { id: 'babyTouch', on: 'touch', x: 7, y: 1, w: 2, h: 2, run: 'babyApproach', cond: g => !g.flags.babyDone },
      { id: 'babyWarn', on: 'touch', x: 7, y: 1, w: 4, h: 4, once: true, run: 'babyWarn', cond: g => !g.flags.babyDone },
      { id: 'artIn', on: 'touch', x: 7, y: 5, w: 16, h: 3, once: true, run: 'artIn', cond: g => !g.flags.babyDone },
      { id: 'kiln', on: 'act', x: 20, y: 1, w: 2, run: 'kiln' },
      { id: 'bust', on: 'act', x: 22, y: 6, text: '석고상. 눈동자가 없는 하얀 눈이 이쪽을 보고 있다.', face: 'scared' },
      // 미술준비실
      { id: 'tabletEarth', on: 'act', x: 27, y: 1, w: 2, item: 'tablet_earth', text: "선반 위에 '土' 자가 새겨진 오각형 패가 놓여 있다.", face: 'serious', after: 'gotEarth' },
      { id: 'prepShelf', on: 'act', x: 24, y: 5, w: 2, text: '유약 병과 굳어 버린 붓들. 구석에 낡은 배내옷 한 벌이 개켜져 있다.', face: 'serious' },
      // 휴게 공간
      { id: 'coffee', on: 'act', x: 6, y: 16, item: 'can_coffee', text: '탁자 위에 따지 않은 캔커피가 하나 놓여 있다.', face: 'default' },
      { id: 'vend24', on: 'act', x: 11, y: 13, run: 'vending' },
      stall('stall241', 15, 17), stall('stall242', 17, 17), stall('stall243', 19, 17),
    ],
  },
};

export const onEnter = {
  main2_2f: async s => {
    if (s.flag('seen22')) return;
    s.flag('seen22', true);
    await s.narrate('2층. 교무실들이 늘어선 복도. 공기가 무겁게 가라앉아 있다.', 'serious');
  },
  main2_3f: async s => {
    if (s.flag('seen23')) return;
    s.flag('seen23', true);
    await s.narrate('3층. …어디선가 피아노 소리가 희미하게 들린 것 같다.', 'scared');
  },
  main2_4f: async s => {
    if (s.flag('seen24')) return;
    s.flag('seen24', true);
    s.sfx('baby');
    await s.narrate('4층. …아기 울음소리? 복도 저편, 미술실 쪽이다.', 'scared');
  },
};

// ---------------------------------------------------------------- 동행 히로인: 짜증(strikes)과 대화
const UPSET = {
  soyoung: {
    far: ['…혼자 가 버리면 어떡해.', 'angry'],
    left: ['왜 혼자 가? 같이 다니자고 했잖아.', 'angry'],
    block: ['…좀 비켜 줄래? 자꾸 부딪히잖아.', 'angry'],
    pass: ['앞서가지 말라고 했지. 내 뒤에 있어.', 'angry'],
    talk: ['그만 좀 불러. 지금 그럴 때야?', 'angry'],
  },
  jihyeon: {
    far: ['희, 희민아…! 같이 가…!', 'scared'],
    left: ['나, 나 두고 가지 마…', 'sad'],
    block: ['앗… 미, 미안. 길 좀…', 'scared'],
    pass: ['희민아, 너무 빨라…', 'sad'],
    talk: ['으, 응…? 왜 자꾸 불러… 무섭게.', 'sad'],
  },
};
async function upset(s, id, reason) {
  if (!UPSET[id]) return;
  s.flag('strikes_' + id, (s.flag('strikes_' + id) || 0) + 1);
  aff(s, id, -1);
  const [line, face] = UPSET[id][reason] || UPSET[id].far;
  await s.say(NAME[id], line, face);
  await s.toast(`${NAME[id]}의 기분이 상했다`);
}

// ---------------------------------------------------------------- 공략 (휴대폰 → 옵션 → 공략)
const ITEM_AT = {
  key_lost: ['main2_1f', 9, 1, '1층 교무실1 컴퓨터 옆 테이블'],
  lighter: ['main2_1f', 6, 17, '1층 당직실 책상'],
  doll: ['main2_2f', 32, 17, '2층 분실물보관실 (열쇠로 열기)'],
  wood_handle: ['main2_1f', 26, 3, '1층 교장실 책상 오른쪽 서랍'],
  videotape: ['main2_1f', 26, 3, '1층 교장실 책상 오른쪽 서랍'],
  key_office2: ['main2_1f', 19, 1, '1층 교무실1 높은 캐비닛 위'],
  key_chair: ['main2_3f', 12, 1, '3층 음악실 피아노 연주'],
  key_art: ['main2_3f', 24, 1, '3층 음악준비실 선반의 CD 뒷면'],
  tablet_earth: ['main2_4f', 27, 1, '4층 미술준비실 선반'],
};
const FLOOR_NAME = { main2_1f: '1층', main2_2f: '2층', main2_3f: '3층', main2_4f: '4층' };

export function guide(g) {
  const f = g.flags, has = id => g.has(id);
  const via = to => {
    const a = FLOORS.indexOf(g.mapId), b = FLOORS.indexOf(to);
    if (a < 0 || b < 0 || a === b) return null;
    return b > a ? [g.mapId, 1, 1, `왼쪽 계단으로 위층 (${FLOOR_NAME[to]})`] : [g.mapId, 4, 1, `오른쪽 계단으로 아래층 (${FLOOR_NAME[to]})`];
  };
  const S = (text, at, need = [], codes = []) => ({
    text, at, codes,
    via: at[0] === g.mapId ? null : via(at[0]),
    items: need.filter(id => !has(id)).map(id => ({ id, name: g.story.items[id].name, where: ITEM_AT[id][3], at: ITEM_AT[id].slice(0, 3) })),
  });
  const at = id => ITEM_AT[id].slice(0, 3);
  const code = { label: '교장실 비밀번호', value: f.riddleRead ? f.principalCode : '2층 학생부실 칠판 — 불을 끄고 라이터로 비추면 보인다' };
  const piano = { label: '피아노', value: f.scoreRead ? '미 · 레 · 파 · 솔 · 파 (숫자 악보 3·2·4·5·4 = 계이름 번호)' : '음악실 불을 켜면 악보가 나타난다' };
  const prep = { label: '음악준비실 자물쇠', value: has('picture_piece') ? f.prepCode : '그림 조각 뒷면 (피아노 의자 수납칸)' };
  const chair = { label: '의자 밀기', value: '조사 버튼 = 바라보는 쪽으로 한 칸. 오른쪽으로 3칸 → 위로 3칸 = 캐비닛 바로 앞에서 올라서기' };
  const baby = { label: '아기 귀신', value: '구석의 아기에게 완성된 인형 없이 다가가면 즉사. 건넬 때 4초 안에 10번 연타' };

  if (f.ch2Clear) return null;
  // 2-01~2-03
  if (!f.reportRead) return S('1층 상담실 탁자 위 조사 보고서 읽기', ['main2_1f', 35, 3]);
  if (!f['ev:doll']) {
    if (!has('key_lost')) return S('1층 교무실1 컴퓨터 옆 테이블의 분실물보관실 열쇠', at('key_lost'), ['key_lost', 'doll']);
    return S('2층 분실물보관실의 흙인형', at('doll'), ['doll']);
  }
  // 2-04 학생부실 → 2-05 교장실
  if (!f.principalOpen) {
    if (f.riddleRead) return S('1층 교장실 문에 비밀번호 입력', ['main2_1f', 26, 8], [], [code]);
    if (!has('lighter')) return S('1층 당직실 책상의 라이터 챙기기 (칠판 퍼즐에 필요)', at('lighter'), ['lighter'], [code]);
    if (f.stuLightOn) return S('2층 학생부실 문 옆 전등 스위치를 끄기 (교실 안에서)', ['main2_2f', 10, 8], [], [code]);
    return S(g.lighter ? '어두운 학생부실 칠판을 라이터 불빛으로 조사' : '라이터를 켜고(라이터 버튼) 학생부실 칠판 조사', ['main2_2f', 10, 0], [], [code]);
  }
  if (!f.drawerOpen) return S('교장실 문을 닫고 책상 오른쪽 서랍 열기 (문이 열려 있으면 수위가 들어온다)', ['main2_1f', 26, 3], ['wood_handle', 'videotape'], [code]);
  if (!f.cctvSeen) return S('책장 뒤에 나온 모니터로 비디오테이프 보기', ['main2_1f', 22, 1]);
  // 2-06~2-08
  if (!has('key_office2') && !f.office2Seen) {
    // 의자 밀기: 지금 의자 위치에서 다음 한 칸(오른쪽 → 위), 막혔으면 원래 자리로
    const [cx, cy] = chairAt(g), [tx, ty] = CHAIR_T, here = ['main2_1f', cx, cy];
    if (cx === tx && cy === ty) return S('캐비닛 앞에 붙인 의자에 올라서기 (의자 조사)', here, ['key_office2']);
    if (cx === tx && cy > ty && !officeBlocked(cx, cy - 1)) return S(`교무실1 의자를 위로 밀기 — 의자 아래에서 조사 (남은 ${cy - ty}칸)`, here, ['key_office2'], [chair]);
    if (cx < tx && cy > ty && !officeBlocked(cx + 1, cy)) return S(`교무실1 의자를 오른쪽으로 밀기 — 의자 왼쪽에서 조사 (남은 ${tx - cx}칸)`, here, ['key_office2'], [chair]);
    return S('의자가 막혔다 — 의자를 조사해 원래 자리로 되돌리기', here, ['key_office2'], [chair]);
  }
  if (!f.tapeStopped) return S('2층 휴게실 안쪽 문(제2교무실 열쇠) → 제2교무실 카세트 멈추기', ['main2_2f', 30, 2], ['key_office2']);
  // 2-09
  if (!has('key_art') && !f.cdTaken) {
    if (!f.musicLight) return S('3층 음악실 왼쪽 문 옆 전등 스위치 켜기 (교실 안에서)', ['main2_3f', 10, 8], [], [piano]);
    if (!f.pianoDone) return S('피아노로 숫자 악보 연주하기', ['main2_3f', 12, 1], ['key_chair'], [piano]);
    if (!f.benchOpen) return S('피아노 의자 수납칸을 의자 열쇠로 열기', ['main2_3f', 13, 2], ['key_chair']);
    if (!f.prepOpen) return S('음악준비실 자물쇠 열기', ['main2_3f', 26, 8], [], [prep]);
    return S('음악준비실 선반의 CD (뒷면에 미술실 열쇠)', at('key_art'), ['key_art']);
  }
  // 2-10~2-11
  if (!f.babyDone) {
    if (f.kilnBaking) return S('가마에서 인형이 구워질 때까지 기다리기 (수위 조심)', ['main2_4f', 20, 1], [], [baby]);
    if (f.kilnDone) return S('가마에서 구운 인형 꺼내기 — 꺼내면 5분 제한 시작', ['main2_4f', 20, 1], [], [baby]);
    if (has('doll_hot')) return S('3층 과학실 세 번째 개수대(왼쪽부터)에서 인형 식히기', ['main2_3f', 10, 13], [], [baby]);
    if (has('doll_done')) return S('4층 미술실 구석의 아기에게 인형 건네기', ['main2_4f', 8, 2], [], [baby]);
    return S('4층 미술실(미술실 열쇠) 가마에 나무 손잡이를 끼우고 흙인형 굽기', ['main2_4f', 20, 1], ['doll', 'wood_handle', 'key_art'], [baby]);
  }
  // 2-12
  if (!has('tablet_earth')) return S('미술준비실 선반의 土의 패', at('tablet_earth'), ['tablet_earth']);
  return S('2층 복도 동쪽 끝 土 결계문에 土의 패 끼우기 (수위를 피해서)', ['main2_2f', 37, 8]);
}

// ---------------------------------------------------------------- 챕터 선택으로 바로 시작
// 1장을 마친 상태(고른 루트, 기본 소지품: 다이어리·사탕·사인펜 2·라이터)를 만든 뒤 2장 오프닝부터
export function newGame(g, route = 'B') {
  g.checkpointData = null;
  for (const id of ['diary', 'candy', 'pen', 'pen', 'lighter']) g.give(id);
  Object.assign(g.flags, { route, ch1Clear: route, janitorOn: true, headGhost: true });
  g.run('ch2Start');
}

// ---------------------------------------------------------------- 스크립트
export const scripts = {
  // 1장 결계문(木)에서 이어진다: 2장 카드 → 본관 2구역 1층 입구
  ch2Start: async s => {
    const g = s.g, route = s.flag('route');
    s.cinema(true);
    await s.fade(1, 0.8);
    s.flag('principalCode', [...'1248'].sort(() => Math.random() - 0.5).join(''));
    s.flag('prepCode', rnd4());
    s.flag('stuLightOn', true);
    await s.card('제2장 · 본관 2구역', '흙(土)의 결계');
    g.enterMap('main2_1f', 34.5, 17.2, 'up');
    if (route === 'B') s.spawn({ id: 'soyoung', skin: 'soyoung', x: 33.5, y: 16.6, dir: 'up' });
    else {
      s.spawn({ id: 'jihyeon', skin: 'jihyeon', x: 33.5, y: 16.8, dir: 'up' });
      s.spawn({ id: 'seonga', skin: 'seonga', x: 35.6, y: 16.6, dir: 'up' });
    }
    await s.fade(0, 0.8);
    s.sfx('thud');
    await s.narrate('등 뒤에서 낡은 문이 스르르 닫혔다. 손잡이 없는 문은 다시는 꿈쩍도 하지 않는다.', 'surprised');
    if (route === 'B') {
      s.face('soyoung', 'left');
      await s.say('소영', '여기가 본관 2구역. 교무실이랑 교장실이 있는 건물이야.');
      await s.say('소영', '다음 패는 흙, 土. 이 건물 어딘가에 흙의 기운이 고여 있을 거야.');
      await s.say('소영', '…같이 다니자. 대신 너무 앞서가지 마. 혼자 뛰어가 버리는 거, 싫어.');
      s.follow('soyoung');
    } else {
      await s.say('성아', '흐음, 여기가 2구역이구나. 교무실 냄새 나네.', 'smirk');
      await s.say('성아', '난 따로 좀 둘러볼게. 둘이 같이 다녀. 지현이 잘 챙겨, 전학생.', 'smile');
      await s.say('지현', '서, 성아야! 또 혼자…', 'scared');
      await s.move('seonga', 34.5, 11, 3.2);
      await s.move('seonga', 3.5, 10.5, 3.6);
      s.despawn('seonga');
      await s.say('지현', '…희민아, 나 너 옆에 꼭 붙어 있을게. 두고 가면 안 돼.', 'sad');
      s.follow('jihyeon');
    }
    await s.toast(`${route === 'B' ? '소영' : '지현'}이 따라온다 — 앞서 뛰거나, 몸으로 막거나, 자꾸 말을 걸면 기분이 상한다`);
    s.objective('신관으로 가는 길 찾기 — 1층 상담실부터 살펴보기');
  },

  // 대화: 지금 목표를 알려 준다. 20초 안에 세 번 말을 걸면 짜증
  companionTalk: async s => {
    const id = s.flag('follower');
    if (!UPSET[id]) return;
    const now = s.g.t;
    const n = now - (s.flag('talkT') ?? -99) < 20 ? (s.flag('talkN') || 0) + 1 : 1;
    s.flag('talkT', now);
    s.flag('talkN', n);
    if (n >= 3) { s.flag('talkN', 0); return upset(s, id, 'talk'); }
    if (n === 2) return s.say(NAME[id], id === 'soyoung' ? '…응. 듣고 있어.' : '으, 응?', id === 'soyoung' ? undefined : 'scared');
    const obj = s.flag('objective');
    if (id === 'soyoung') return s.say('소영', obj ? `지금은… ${obj}. 그것부터 하자.` : '…가자.');
    return s.say('지현', obj ? `희민아… 우리 지금 ${obj}, 맞지? 빨리 끝내고 나가자.` : '희민아… 무서워.', 'scared');
  },

  companionUpset: (s, id, reason) => upset(s, id, reason),

  readPiece: async s => s.narrate(`찢어진 그림 조각. 뒷면에 숫자 네 개가 적혀 있다. 「${s.flag('prepCode')}」`, 'serious'),

  // ---- 2-01 조사 보고서
  report: async s => {
    if (!s.flag('reportRead')) await s.narrate('탁자 위에 \'대외비\' 도장이 찍힌 서류철이 펼쳐져 있다.', 'serious');
    await s.doc('report');
    if (s.flag('reportRead')) return;
    s.flag('reportRead', true);
    if (s.flag('follower') === 'soyoung') await s.say('소영', '1998년… 언니가 이 학교에 다니던 해야.', 'sad');
    else if (s.flag('follower') === 'jihyeon') await s.say('지현', '화재… 성아가 가끔 그 얘기를 했었는데…', 'scared');
    await s.say('희민', '(교무실 쪽에 뭔가 더 있을지도 몰라. 교무실1부터 살펴보자.)', 'serious');
    s.objective('1층 교무실1 살펴보기');
  },

  // ---- 2-03 흙인형
  dollCry: async s => {
    await s.wait(0.4);
    s.sfx('baby');
    await s.narrate('…응애. 어디선가 아주 가느다란 아기 울음소리가 들렸다.', 'scared');
    if (s.flag('follower') === 'soyoung') await s.say('소영', '…지금, 아기 울음소리 아니었어? 위층 같았는데.', 'surprised');
    else if (s.flag('follower') === 'jihyeon') await s.say('지현', '히익…! 희, 희민아, 들었어…?', 'scared');
    await s.say('희민', '(흙인형이라… 왠지 버리면 안 될 것 같다.)', 'serious');
    if (!s.flag('principalOpen')) s.objective('1층 교장실 조사 (비밀번호 단서 찾기)');
  },

  // ---- 2-04 학생부실: 불 끄고 라이터
  stuSwitch: async s => {
    s.sfx('switch');
    const on = !s.flag('stuLightOn');
    s.flag('stuLightOn', on);
    await s.narrate(on ? '딸깍. 형광등이 다시 켜졌다.' : '딸깍. 학생부실이 캄캄해졌다.', 'default');
  },

  riddle: async s => {
    if (s.flag('stuLightOn')) {
      await s.narrate('칠판은 깨끗이 지워져 있다. 오른쪽 아래 구석에 작은 글씨가 남아 있다.', 'default');
      await s.narrate('「불을 끄고, 작은 불로 비춰 볼 것」', 'serious');
      return;
    }
    if (!s.g.lighter) {
      await s.narrate('어두워서 칠판이 보이지 않는다.', 'serious');
      if (s.has('lighter')) await s.say('희민', '(라이터를 켜 볼까?)', 'serious');
      return;
    }
    if (!s.flag('riddleRead')) {
      s.sfx('chalk');
      await s.narrate('라이터 불빛이 닿자, 깨끗하던 칠판 위로 희끄무레한 분필 글씨가 떠올랐다!', 'surprised');
      s.flag('riddleRead', true);
    }
    await s.doc('riddle');
    if (!s.flag('principalOpen')) s.objective('1층 교장실 — 칠판의 수수께끼가 비밀번호');
  },

  // ---- 2-05 교장실
  principalDoor: async s => {
    const v = await s.keypad('교장실 — 비밀번호 4자리', 4);
    if (v == null) return;
    if (v !== s.flag('principalCode')) {
      s.sfx('locked');
      await s.narrate('삐빅. 틀렸다.', 'serious');
      if (!s.flag('riddleRead')) await s.say('희민', '(아무 숫자나 눌러서는 안 되겠어. 어딘가에 단서가 있을 거야.)', 'serious');
      return;
    }
    s.sfx('unlock');
    s.flag('principalOpen', true);
    s.door(26, 8, 'open');
    await s.narrate('딸깍. 교장실 문이 열렸다.', 'default');
  },

  principalIn: async s => {
    await s.narrate('두꺼운 카펫, 커다란 책상, 벽을 가득 채운 책장. 교장실이다.', 'default');
    await s.say('희민', '(문을 열어 두면 소리가 복도로 샐 것 같다. 문을 닫고 살펴보자.)', 'serious');
  },

  drawer: async s => {
    if (s.flag('drawerOpen')) return s.narrate('비어 있는 오른쪽 서랍.', 'default');
    if (s.g.world.door(26, 8).open) {
      // 문을 열어 둔 채 서랍을 열면 수위가 들이닥친다(바이블 2-05)
      s.cinema(true);
      s.sfx('keys');
      await s.narrate('서랍에 손을 대는 순간— 열린 문 너머로 철컹, 철컹, 열쇠 꾸러미 소리가 다가왔다!', 'scared');
      s.flag('janitor2On', true);
      if (!s.actor('bonggu')) s.spawn(BONGGU(26.5, 10.2, P1));
      const j = s.actor('bonggu');
      j.state = 'chase';
      j.lastSeen = [s.player().x, s.player().y];
      s.sfx('whistle');
      await s.say('희민', '(문을 닫아 뒀어야 했어…!)', 'scared');
      s.objective('수위를 피하기 — 교장실 서랍은 문을 닫고 다시');
      return;
    }
    s.flag('drawerOpen', true);
    await s.narrate('오른쪽 서랍 깊숙이 둥근 나무 손잡이와 비디오테이프가 들어 있다.', 'default');
    await s.give('wood_handle');
    await s.give('videotape');
    s.sfx('rumble');
    s.shake(0.5);
    await s.narrate('서랍을 끝까지 당기자 덜컥— 벽의 책장이 옆으로 밀려났다!', 'surprised');
    s.flag('shelfMoved', true);
    s.refresh();
    await s.narrate('책장 뒤에 작은 모니터와 비디오 플레이어가 숨겨져 있다.', 'serious');
    s.objective('숨겨진 모니터로 비디오테이프 보기');
  },

  cctv: async s => {
    if (s.flag('cctvSeen')) return s.narrate('꺼진 모니터. 검은 화면에 내 얼굴이 희미하게 비친다.', 'default');
    s.cinema(true);
    s.take('videotape');
    await s.narrate('비디오테이프를 넣자 지지직— 모니터에 흑백 화면이 떠올랐다.', 'serious');
    await s.cg('cg_cctv');
    await s.narrate('녹화 화면 속 교무실1. 절뚝이는 수위가 의자를 딛고 올라서서, 높은 캐비닛 위에 열쇠를 올려놓는다.', 'serious');
    await s.narrate('화면 구석의 날짜는… 오늘 밤이다.', 'surprised');
    await s.say('희민', '(제2교무실 열쇠…? 수위가 일부러 숨긴 거야.)', 'serious');
    s.flag('cctvSeen', true);
    s.sfx('tape');
    await s.narrate('…녹화가 끝난 화면에서, 거꾸로 감기는 듯한 여자아이의 노랫소리가 새어 나왔다.', 'scared');
    if (s.flag('follower') === 'jihyeon') {
      // A: 노랫소리에 홀린 지현이 사라진다 → 제2교무실에서 쓰러진 채 발견
      const j = s.actor('jihyeon');
      s.follow(null);
      await s.say('지현', '…이 노래. 누가… 날 부르고 있어.', 'scared');
      await s.say('희민', '지현아? 왜 그래!', 'surprised');
      s.door(26, 8, 'open');
      await s.move('jihyeon', 26.5, 9.6, 3.4);
      await s.move('jihyeon', 3.5, 10.2, 4);
      s.despawn('jihyeon');
      if (j) await s.narrate('뒤쫓아 복도로 나갔지만, 지현은 어디에도 없었다. 계단 쪽에서 노랫소리만 멀어져 간다…', 'scared');
    } else if (s.flag('follower') === 'soyoung') {
      await s.say('소영', '…이 노래, 어디서 들어 본 것 같아.');
    }
    if (!s.flag('janitor2On')) {
      s.flag('janitor2On', true);
      s.spawn(BONGGU(35.5, 10.5, P1));
      s.sfx('keys');
      await s.narrate('…복도 어딘가에서 철컹, 열쇠 꾸러미 소리가 울리기 시작했다.', 'scared');
    }
    s.objective('교무실1 높은 캐비닛 위의 열쇠 — 의자를 밀어 올라서기');
  },

  // ---- 2-06 높은 곳의 열쇠: 의자 밀기
  highCabinet: async s => {
    if (s.has('key_office2') || s.flag('office2Seen')) return s.narrate('높은 캐비닛. 위는 이제 먼지뿐이다.', 'default');
    await s.narrate('천장에 닿을 듯 높은 캐비닛. 위쪽은 손이 닿지 않는다.', 'default');
    if (s.flag('cctvSeen')) await s.say('희민', '(딛고 올라설 게 필요해. 저 의자를 밀어 오면…)', 'serious');
  },

  pushChair: async s => {
    const [cx, cy] = chairAt(s.g);
    if (cx === CHAIR_T[0] && cy === CHAIR_T[1]) {
      if (s.has('key_office2') || s.flag('office2Seen')) return s.narrate('캐비닛 앞에 붙여 둔 의자.', 'default');
      s.sfx('drag');
      await s.narrate('의자를 딛고 올라서자, 캐비닛 위 먼지 속에서 열쇠가 손에 잡혔다.', 'smile');
      await s.give('key_office2');
      s.objective('2층 교무실 휴게실 → 안쪽 문으로 제2교무실');
      return;
    }
    const [dx, dy] = DIRS[s.player().dir];
    const nx = cx + dx, ny = cy + dy, w = s.g.world;
    if (officeBlocked(nx, ny) || w.isSolid(nx, ny)) {
      const c = await s.choice('의자가 더 밀리지 않는다.', ['그만둔다', '의자를 원래 자리로 끌어다 놓는다']);
      if (c === 1) { s.flag('chairPos', null); s.refresh(); s.sfx('drag'); }
      return;
    }
    s.flag('chairPos', `${nx},${ny}`);
    s.refresh();
    s.sfx('drag');
    if (nx === CHAIR_T[0] && ny === CHAIR_T[1]) await s.narrate('의자를 캐비닛 바로 앞에 붙였다. 올라설 수 있겠다.', 'smile');
  },

  // ---- 2-07 (B) 계단 이야기: 소영 바로 뒤에 붙어 걷기
  stairsTalk: async s => {
    s.cinema(true);
    await s.say('소영', '…이 계단, 밤에 세어 보면 한 칸이 늘어나 있다는 소문 알아?');
    const c = await s.choice('', ['들어 본 것 같아.', '그런 걸 믿어?']);
    if (c === 0) await s.say('소영', '그치. 다들 알아. 이상할 만큼.');
    else await s.say('소영', '믿는다기보다… 이상해서.');
    await s.say('소영', '이 학교 괴담들, 다 비슷한 때에 한꺼번에 퍼졌대. 누가 일부러 지어서 퍼뜨린 것처럼.');
    await s.say('소영', '누군가… 사람들이 밤에 학교에 오지 않기를 바랐던 거야.');
    await s.say('소영', '휴게실은 이쪽이야. 내 바로 뒤에 붙어서 와. 혼자 앞서가지 말고.');
    s.flag('strikesAtWalk', s.flag('strikes_soyoung') || 0);
    s.lead('soyoung', [[3, 10.4], [18.5, 10.2], [18.5, 9.5]], 'stairsTalkEnd');
    s.objective('소영 바로 뒤에 붙어 걷기');
  },

  stairsTalkEnd: async s => {
    s.face('soyoung', 'up');
    const clean = (s.flag('strikes_soyoung') || 0) === s.flag('strikesAtWalk');
    if (clean) { aff(s, 'soyoung', 1); await s.say('소영', '…잘 따라와 줬네. 고마워.', 'smile'); }
    else await s.say('소영', '…여기야.');
    s.flag('stairWalkDone', true);
    s.objective('2층 교무실 휴게실 → 안쪽 문으로 제2교무실');
  },

  // ---- 2-08 지현
  office2In: async s => {
    s.cinema(true);
    s.flag('office2Seen', true);
    s.flag('tapePlaying', true);
    s.spawn({ id: 'jihyeon', skin: 'jihyeon', sprite: 'jihyeon_faint', x: 28.5, y: 4.6, dir: 'down' });
    await s.narrate('책상 사이 바닥에 누군가 쓰러져 있다. …지현이다!', 'surprised');
    await s.narrate('책상 위 카세트 플레이어가 혼자 돌아가며, 거꾸로 감기는 듯한 노랫소리를 흘리고 있다.', 'scared');
    if (s.flag('follower') === 'soyoung') await s.say('소영', '저 소리가 지현이를 붙잡고 있어. 멈춰야 해!', 'surprised');
    s.objective('저절로 돌아가는 카세트 멈추기');
  },

  cassette: async s => {
    if (!s.flag('tapePlaying')) return s.narrate('멈춘 카세트 플레이어.', 'default');
    s.cinema(true);
    s.sfx('switch');
    s.flag('tapePlaying', false);
    s.flag('tapeStopped', true);
    await s.narrate('정지 버튼을 꾹 누르자 노랫소리가 뚝 끊겼다.', 'serious');
    await s.narrate('꺼낸 테이프에는 아무 라벨도 없다. 거꾸로 돌린 듯한 목소리가 녹음된 테이프.', 'serious');
    await s.give('backward_tape');
    const j = s.actor('jihyeon');
    j.sprite = null;
    j.dir = 'up';
    s.face('player', 'down');
    await s.say('지현', '…으, 응…? 희민아…? 여기가… 어디야?', 'scared');
    await s.say('지현', '노래 같은 게 들려서… 따라왔는데… 그다음이 기억이 안 나.', 'sad');
    if (s.flag('route') === 'B') {
      await s.say('소영', '지현아, 괜찮아? 다친 데는?', 'surprised');
      await s.say('지현', '…소영이도 있었구나. 응, 괜찮아.', 'sad');
      await s.say('지현', '나… 성아를 찾아야 해. 혼자 가 볼게. 너희 둘은… 같이 다녀.', 'sad');
      const c = await s.choice('', ['혼자는 위험해.', '…조심해.']);
      if (c === 0) { aff(s, 'jihyeon', 1); await s.say('지현', '고마워, 희민아. 그래도… 나중에 꼭 다시 만나.', 'smile'); }
      else await s.say('지현', '응. 너희도.', 'sad');
      await s.move('jihyeon', 24.5, 4.5, 2.6);
      await s.move('jihyeon', 18.5, 9.4, 2.6);
      s.despawn('jihyeon');
    } else {
      const c = await s.choice('', ['무사해서 다행이야.', '갑자기 사라져서 얼마나 찾았는데!']);
      if (c === 0) { aff(s, 'jihyeon', 1); await s.say('지현', '…응. 찾아 줘서 고마워.', 'smile'); }
      else await s.say('지현', '미, 미안해… 이번엔 꼭 붙어 다닐게.', 'sad');
      s.follow('jihyeon');
    }
    s.objective('3층 음악실 살펴보기');
  },

  // ---- 2-09 음악실
  musicSwitch: async s => {
    if (s.flag('musicLight')) return s.narrate('음악실 전등 스위치. 켜져 있다.', 'default');
    s.cinema(true);
    s.sfx('switch');
    s.flag('musicLight', true);
    s.spawn({ id: 'pianoGhost', kind: 'ghost', sprite: 'piano_ghost', x: 13.5, y: 2.7, glow: '150,170,230', alpha: 0.85 });
    await s.narrate('딸깍. 형광등이 켜지자— 피아노 앞에 누군가 앉아 있었다.', 'surprised');
    s.sfx('piano');
    s.shake(0.4);
    await s.cg('cg_piano');
    await s.narrate('피 묻은 손가락이 건반을 내리찍는다. 끔찍한 불협화음이 음악실을 가득 채웠다.', 'scared');
    s.despawn('pianoGhost');
    s.flag('pianoBlood', true);
    s.refresh();
    await s.narrate('…눈을 깜빡이자 아무도 없었다. 피아노 보면대에 숫자가 적힌 악보 쪽지 한 장이 남아 있다.', 'serious');
    s.flag('scoreRead', true);
    await s.doc('score');
    if (s.flag('follower') === 'soyoung') await s.say('소영', '…음악 선생님 얘기, 들은 적 있어. 몇 년 전에 갑자기 사라졌다는.');
    s.objective('숫자 악보대로 피아노 치기 (칠판에 계이름 번호)');
  },

  piano: async s => {
    if (!s.flag('musicLight')) return s.narrate('어둠 속의 피아노. 뚜껑 위에 먼지가 소복하다.', 'default');
    if (s.flag('pianoDone')) return s.narrate('피 묻은 건반. 다시 치고 싶지 않다.', 'serious');
    const r = await s.piano('피아노 — 다섯 음', 5, s.flag('scoreRead') ? '악보 쪽지: 3 · 2 · 4 · 5 · 4' : '');
    if (!r) return;
    if (r.join() !== '2,1,3,4,3') {
      await s.narrate('…아무 일도 일어나지 않는다.', 'default');
      if (!s.flag('solfegeRead')) await s.say('희민', '(숫자가 계이름 번호인가? 칠판에 뭔가 적혀 있었던 것 같은데.)', 'serious');
      return;
    }
    s.flag('pianoDone', true);
    s.sfx('unlock');
    await s.narrate('마지막 음이 길게 울리자, 의자 쪽에서 딸깍 소리가 났다. 의자 밑에 작은 열쇠가 떨어져 있다.', 'surprised');
    await s.give('key_chair');
    s.objective('피아노 의자 수납칸 열기');
  },

  bench: async s => {
    if (s.flag('benchOpen')) return s.narrate('비어 있는 의자 수납칸.', 'default');
    if (!s.has('key_chair')) return s.narrate('피아노 의자. 앉는 판 아래 수납칸에 작은 자물쇠가 달려 있다.', 'default');
    s.take('key_chair');
    s.sfx('unlock');
    s.flag('benchOpen', true);
    s.refresh();
    await s.narrate('의자 수납칸을 열자, 찢어진 그림 한 조각이 들어 있다.', 'default');
    await s.give('picture_piece');
    await s.narrate(`뒷면에 숫자 네 개가 적혀 있다. 「${s.flag('prepCode')}」`, 'serious');
    s.objective('음악준비실 자물쇠 열기 (그림 조각 뒷면 숫자)');
  },

  prepLock: async s => {
    const v = await s.keypad('음악준비실 자물쇠 — 4자리', 4);
    if (v == null) return;
    if (v !== s.flag('prepCode')) { s.sfx('locked'); return s.narrate('철컥. 자물쇠는 꿈쩍도 하지 않는다.', 'serious'); }
    s.sfx('unlock');
    s.flag('prepOpen', true);
    s.door(26, 8, 'open');
    await s.narrate('딸깍. 자물쇠가 풀렸다.', 'default');
  },

  gotCd: async s => {
    s.flag('cdTaken', true);
    await s.narrate("선반에 CD 한 장. 케이스에 손글씨로 '김지원'이라고 적혀 있다.", 'serious');
    await s.give('cd');
    await s.narrate('뒤집어 보니 케이스 뒷면에 열쇠 하나가 테이프로 붙어 있다.', 'surprised');
    await s.give('key_art');
    s.objective('4층 미술실 — 가마');
  },

  pottery: async s => {
    s.flag('potteryTaken', true);
    await s.narrate('탁자 위에 작은 도자기. 유약 사이로 하얀 가루 같은 것이 섞여 있다.', 'serious');
    await s.give('pottery');
    if (s.flag('route') !== 'B') return s.say('희민', '(…묘하게 차갑다. 왜인지 내려놓고 싶지 않다.)', 'serious');
    // B: 1998년 음악실의 의식 회상(요약 연출)
    s.cinema(true);
    s.sfx('stinger');
    await s.narrate('도자기를 쥔 순간— 손끝이 얼음처럼 차가워졌다.', 'surprised');
    await s.fade(1, 0.4);
    await s.cg('cg_flashback');
    await s.narrate('…촛불 다섯 개. 음악실 바닥에 그려진 진. 그리고 세 사람의 그림자.', 'scared');
    await s.say('???', '…그 아이를 다시 부를 수 있습니다. 대신, 그릇이 필요합니다.');
    await s.narrate('긴 머리의 여학생이 떨리는 손으로 진 가운데에 앉는다. 곁에서 한 여자가 누군가의 이름을 부르며 흐느낀다.', 'scared');
    await s.fade(0, 0.6);
    await s.say('소영', '…방금 그거, 너도 봤어?', 'sad');
    await s.say('소영', '가운데 앉아 있던 사람… 우리 언니였어.', 'sad');
    const c = await s.choice('', ['…괜찮아? 잠깐 쉬었다 가자.', '언니가 왜 그런 일을…']);
    if (c === 0) { aff(s, 'soyoung', 1); await s.say('소영', '…괜찮아. 지금 멈추면 다시는 못 갈 것 같아.', 'sad'); }
    else await s.say('소영', '나도 몰라. 그러니까… 끝까지 알아내야 해.');
  },

  // ---- 2-10 가마와 개수대
  artIn: async s => {
    s.sfx('baby');
    s.flag('babyCry', true);
    await s.narrate('미술실 구석에… 무언가 웅크리고 있다. 아기…? 가느다란 울음소리가 그쪽에서 들려온다.', 'scared');
    await s.say('희민', '(가까이 가면 안 될 것 같다. 절대로.)', 'scared');
  },

  babyWarn: async s => {
    s.sfx('baby');
    await s.narrate('울음소리가 귀 바로 옆에서 들린다. 더 다가가면 안 된다…!', 'scared');
  },

  babyApproach: async s => {
    if (s.has('doll_done')) return scripts.babyGive(s);
    s.cinema(true);
    s.sfx('stinger');
    await s.narrate('아기가 천천히 고개를 들었다. 텅 빈 눈구멍이 이쪽을—', 'scared');
    s.gameOver('아기 귀신에게 맨손으로 다가갔다…');
  },

  kiln: async s => {
    if (s.flag('babyDone') || s.has('doll_hot') || s.has('doll_done')) return s.narrate('식어 가는 가마.', 'default');
    if (s.flag('kilnBaking')) return s.narrate('가마 안에서 불길이 웅웅거린다. 조금만 더 기다리자.', 'serious');
    if (s.flag('kilnDone')) {
      s.checkpoint('가마에서 인형을 꺼내기 직전부터 다시');
      s.flag('kilnDone', false);
      s.flag('babyTimer', true);
      s.despawn('bonggu');
      await s.narrate('가마 문을 열고 구워진 흙인형을 꺼냈다. 손이 데일 듯 뜨겁다.', 'surprised');
      await s.give('doll_hot');
      s.sfx('baby');
      s.shake(0.4);
      await s.narrate('…응애, 응애! 구석의 아기 울음소리가 갑자기 커졌다. 학교 전체가 울리는 것 같다!', 'scared');
      await s.say('희민', '(빨리 식혀야 해. 물… 3층 과학실 개수대!)', 'serious');
      s.timer(300, '아기', 'babyFail');
      s.objective('3층 과학실 세 번째 개수대에서 인형 식히기 → 아기에게');
      return;
    }
    if (!s.has('wood_handle')) {
      await s.narrate('커다란 전기 가마. 문 손잡이가 빠져 있어 열 수가 없다.', 'default');
      return s.say('희민', '(끼울 만한 손잡이가 있으면…)', 'serious');
    }
    if (!s.has('doll')) return s.narrate('가마. 손잡이를 끼우면 열 수 있겠다. 무엇을 구울까…', 'default');
    const c = await s.choice('나무 손잡이를 끼워 가마를 열고, 흙인형을 넣어 구울까?', ['넣고 굽는다', '그만둔다']);
    if (c) return;
    s.take('wood_handle');
    s.take('doll');
    s.flag('kilnBaking', true);
    s.refresh();
    s.sfx('kiln');
    await s.narrate('흙인형을 넣고 불을 올렸다. 가마가 웅— 하고 달아오른다.', 'serious');
    await s.say('희민', '(다 구워질 때까지 조금 기다려야 해. 수위를 조심하자.)', 'serious');
    s.later(15, 'kilnDone');
    s.objective('가마에서 인형이 구워질 때까지 기다리기');
  },

  kilnDone: async s => {
    s.flag('kilnBaking', false);
    s.flag('kilnDone', true);
    s.refresh();
    s.sfx('bell');
    await s.narrate('…띵. 4층 미술실 쪽에서 가마 불이 꺼지는 소리가 났다.', 'surprised');
    s.objective('가마에서 구운 인형 꺼내기 — 꺼내면 아기가 깨어난다');
  },

  sinkDry: async s => s.narrate('수도꼭지를 돌려도 물이 나오지 않는다.', 'default'),

  sink3: async s => {
    if (!s.has('doll_hot')) return s.narrate('세 번째 개수대. 이것만 물이 잘 나온다.', 'default');
    s.take('doll_hot');
    s.sfx('water');
    await s.narrate('물을 틀자 콸콸 쏟아졌다. 치익— 뜨거운 인형이 하얀 김을 뿜으며 식어 간다.', 'serious');
    await s.give('doll_done');
    s.objective('4층 미술실 — 아기에게 인형 건네기');
  },

  babyFail: async s => {
    s.sfx('stinger');
    await s.narrate('울음소리가 비명으로 바뀌었다. 복도 끝에서부터 무언가가 기어 오는 소리가…', 'scared');
    s.gameOver('아기의 울음이 학교를 삼켰다…');
  },

  // ---- 2-11 아기 귀신
  babyGive: async s => {
    s.cinema(true);
    await s.narrate('식힌 흙인형을 두 팔로 안고, 울고 있는 아기에게 다가갔다.', 'serious');
    for (;;) {
      const ok = await s.qte('인형을 건네라!', 10, 4);
      if (ok) break;
      s.damage(30);
      await s.narrate('울음소리가 귀를 찢는다… 다시!', 'scared');
    }
    s.take('doll_done');
    s.stopTimer();
    s.clearCheckpoint();
    s.flag('babyTimer', false);
    s.flag('babyCry', false);
    s.flag('babyDone', true);
    await s.cg('cg_baby');
    await s.narrate('아기가 작은 팔로 인형을 꼭 끌어안았다. 울음소리가 천천히 잦아든다.', 'serious');
    await s.narrate('…그리고 아기는 흙먼지처럼 부서져, 조용히 흩어졌다.', 'serious');
    s.despawn('baby');
    s.refresh();
    s.sfx('creak');
    s.door(23, 3, 'open');
    await s.narrate('삐걱— 미술준비실 문이 저절로 열렸다.', 'surprised');
    await s.doc('ghost_baby');
    if (s.flag('follower') === 'soyoung') await s.say('소영', '…이제 안 울어. 다행이다.', 'sad');
    else if (s.flag('follower') === 'jihyeon') await s.say('지현', '…잘 자. 아가.', 'sad');
    s.objective('미술준비실 조사');
  },

  // ---- 2-12 土의 문
  gotEarth: async s => {
    s.sfx('whistle');
    s.shake(0.3);
    await s.narrate('패를 집어 든 순간— 복도 쪽에서 호루라기 소리가 날카롭게 울렸다!', 'scared');
    await s.say('희민', '(수위가 다시 움직인다…! 2층 土 결계문까지 가야 해.)', 'serious');
    s.spawn(BONGGU(36.5, 10.5, P4));
    const j = s.actor('bonggu');
    j.state = 'investigate';
    j.lastSeen = [21.5, 9.6];
    s.objective('2층 복도 끝 土 결계문에 土의 패 끼우기 — 수위를 피해서');
  },

  sealEarth: async s => {
    if (!s.has('tablet_earth')) return s.narrate("낡은 문 옆 오각형 홈. 가운데에 '土' 자가 새겨져 있다.", 'serious');
    const c = await s.choice('土의 패를 홈에 끼울까?', ['끼운다', '그만둔다']);
    if (c) return;
    s.cinema(true);
    s.take('tablet_earth');
    s.despawn('bonggu');
    const route = s.flag('route');
    s.flag('ch2Clear', route);
    s.sfx('rumble');
    s.shake(1.2);
    await s.narrate("土의 패를 끼우자, 홈 둘레에 새겨진 '土' 자가 누렇게 빛났다.", 'surprised');
    s.door(36, 8, 'open');
    s.sfx('creak');
    await s.cg('cg_earth');
    await s.narrate('문 너머로 연결 통로가 끝없이 길게 늘어져 있다. 그 끝에… 신관의 불빛이 희미하게 보인다.', 'serious');
    const p = s.player();
    if (route === 'A') {
      s.spawn({ id: 'seonga', skin: 'seonga', x: 30.5, y: 10.6, dir: 'right' });
      await s.move('seonga', Math.max(31, p.x - 1.4), 10.4, 3);
      await s.say('성아', '역시 여기 있었네, 전학생. 지현이도 무사하고.', 'smile');
      await s.say('지현', '성아야! 어디 갔었어…', 'sad');
      await s.say('성아', '여기저기. …이 너머가 신관이야. 같이 가자.', 'smirk');
      const c2 = await s.choice('', ['성아와 이야기한다', '지현이를 챙긴다']);
      if (c2 === 0) { aff(s, 'seonga', 1); await s.say('성아', '뭐야, 나한테 궁금한 거라도 있어? …나중에. 가면서 얘기해 줄게.', 'smile'); }
      else { aff(s, 'jihyeon', 1); await s.say('지현', '…고마워. 난 괜찮아. 같이 가자.', 'smile'); }
    } else {
      await s.say('소영', '이 너머가 신관이야. 언니가… 마지막까지 있었던 곳.', 'sad');
      const c2 = await s.choice('', ['소영을 따라간다', '…잠깐 숨 좀 돌리자']);
      if (c2 === 0) { aff(s, 'soyoung', 1); await s.say('소영', '…응. 같이 가.', 'smile'); }
      else await s.say('소영', '그래. 하지만 오래는 안 돼.');
    }
    const name = { A: '성아·지현 루트', B: '소영 루트' }[route];
    await s.endChapter('제2장 끝', `${name}로 진행 — 제3장 「신관」은 준비 중입니다`);
  },
};
