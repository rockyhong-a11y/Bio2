// 제1장 · 본관 1구역 — 원작 「화이트데이: 학교라는 이름의 미궁」 리메이크판 진행 순서를 따른 탑뷰 각색.
// 줄거리·인물·장소·사건은 원작을 따르되, 대사와 문서는 모두 새로 썼다(원작 대사 미사용).
//
// 흐름: 오프닝(현관 잠김) → 2-6반 불 켜기·교지 → 성아·지현 → 사이렌 → 사다리·와이어 커터 → 환기구(밸브 왼쪽→오른쪽)
//   → 기계실습실(金 문양, 배전반 3·4번) → 金의 패·가사실 열쇠 → 성아와 열쇠 교환(중앙통로문) → '정숙' 팻말에서 수위 추격
//   → 지현이 학적부실로 구출(라이터·추·괴담) → 셔터에 金의 패 → 2층 → 공구벨트 코드 → 서무실 열쇠보관함(강당통로·빨간 열쇠)
//   → 강당 통로 목매단 귀신 → 2-8반 소영 → 귀목(6분): 이상한 화분 3개 + 2-2반 나무 + 연타 → 木의 패
//   → 방송실 성아 → 분기(A: 성아를 쫓는다 / B: 울음소리 조사=소영 루트) → 계단(셔터) 옆 결계문에 木의 패 → 2장(data/chapter2.js)

const rnd4 = () => String(1000 + Math.floor(Math.random() * 9000));
const aff = (s, who, n) => s.flag('aff_' + who, (s.flag('aff_' + who) || 0) + n);
const F = k => g => !!g.flags[k];

export const saveCost = 'pen';
export const headGhost = { flag: 'headGhost', after: 70, sprite: 'head_ghost', dmg: 20 };

export const speakers = { 희민: 'heemin', 소영: 'soyoung', 성아: 'seonga', 지현: 'jihyeon', 수위: 'janitor' };
export const narrator = '희민'; // 서술(조사·사건) 때 반응 초상화를 보여 줄 주인공

// ---------------------------------------------------------------- 아이템
export const items = {
  diary: { name: '소영의 다이어리', desc: '공원 벤치에 놓여 있던 분홍색 다이어리. 주인에게 돌려줘야 한다.' },
  candy: { name: '화이트데이 사탕', desc: '리본으로 묶은 사탕 상자. 내일은 화이트데이다.' },
  pen: { name: '사인펜', desc: '게시판에 기록을 남겨 저장할 때 하나씩 쓴다.' },
  magazine: { name: '연두 교지', desc: '학교 잡지. 학교의 내력이 실려 있다.', use: 'readMagazine' },
  wirecutter: { name: '와이어 커터', desc: '철사나 철망을 끊을 수 있다.' },
  ladder: { name: '접이식 사다리', desc: '높은 곳에 손이 닿게 해 준다.' },
  tablet_metal: { name: '金의 패', desc: "'金' 자가 새겨진 오각형 금속 패. 손에 쥐면 묘하게 차갑다." },
  key_homeec: { name: '가사실습실 열쇠', desc: '가사실습실 문 열쇠.', icon: 'key' },
  key_central: { name: '중앙통로문 열쇠', desc: '1층 중앙 통로 유리문 열쇠. 성아에게 받았다.', icon: 'key' },
  lighter: { name: '라이터', desc: '켜면 주변을 밝힌다. 불빛은 수위의 눈에도 잘 띈다. (라이터 버튼)', use: 'useLighter' },
  weight: { name: '쇠 추', desc: '50g짜리 쇠 추. 어디에 쓰는 물건일까.' },
  coin: { name: '학교 동전', desc: '자판기에 넣을 수 있다.' },
  drink: { name: '음료수', desc: '마시면 기운이 난다. (체력 회복)', use: 'useDrink' },
  toolbelt: { name: '공구벨트', desc: '드라이버 손잡이 윗면에 숫자가 새겨져 있다.', use: 'readToolbelt' },
  key_hall: { name: '강당통로 열쇠', desc: '1층 강당 통로 철문 열쇠.', icon: 'key' },
  key_red: { name: '빨간 소형 열쇠', desc: '빨간 꼬리표가 달린 작은 열쇠. 2층 어딘가의 문.' },
  note: { name: '낙서 쪽지', desc: '구겨진 쪽지. 숫자가 적혀 있다.', use: 'readNote' },
  solvent: { name: '화학 용제', desc: g => `식물도 말려 죽일 만큼 독한 용제. (남은 양 ${g.flags.solventLeft ?? 0}번)` },
  spray: { name: '해충 스프레이', desc: '벌레를 쫓는 스프레이. 덩굴에도 들을까.' },
  tablet_wood: { name: '木의 패', desc: "'木' 자가 새겨진 오각형 나무 패. 미세하게 따뜻하다." },
};

// ---------------------------------------------------------------- 문서 (전부 새로 쓴 글)
export const docs = {
  magazine: {
    title: '연두 교지 — 우리 학교가 걸어온 길',
    body: `우리 연두고등학교가 자리한 언덕은 예로부터 기운이 센 땅이라 불렸다. 산세가 좋아 명당이라는 사람도 있었고, 너무 센 기운이 사람을 상하게 한다며 꺼리는 사람도 있었다.

학교가 들어서기 전 이곳의 내력에 대해서는 확인되지 않은 이야기가 많다. 일제강점기에 무언가를 가두던 시설이 있었다는 말, 전쟁 통에는 부상자를 수용하던 곳이었다는 말이 전해진다.

신관 자리에는 원래 연못이 있었다. 사고가 잦아 메우자는 의견이 많았으나 오래도록 반대에 부딪혔고, 결국 연못을 메운 뒤에야 신관이 지어졌다.

건축 당시에도 크고 작은 사고가 이어지자, 당시 교장 선생님께서는 지관(풍수가)을 모셔 학교의 기운을 바로잡았다고 한다. 그때 학교 곳곳에 다섯 개의 '패'를 두었다는 이야기가 있으나, 그 패가 지금 어디에 있는지 아는 학생은 거의 없다.

— 교지 편집부`,
  },
  memo_switch: {
    title: '작업대 위의 메모',
    body: `[기계실습실 배전반 사용 주의]

경보 계통이 오작동하면 배전반에서 3번, 4번 소켓만 연결할 것.
1번·2번은 과부하가 걸리니 절대 함께 연결하지 말 것.

— 실습 담당`,
  },
  ghost_body: {
    title: '괴담 — 내 몸을 찾아줘',
    body: `본관의 두 건물을 잇는 공사가 한창이던 해, 지지대가 무너지는 사고가 있었다. 사람들은 잔해 속에서 한 사람을 다 찾아내지 못했다고 한다. 머리만은 끝내 나오지 않았다고.

공사는 서둘러 마무리되었고, 그 위로 시멘트가 부어졌다.

그 뒤로 밤의 본관에서 한자리에 오래 머무는 사람 앞에는, 종소리가 네 번 울린 다음 무언가가 굴러온다고 한다. 자기 몸이 어디 있는지 묻기라도 하려는 듯이.

…소리가 들리면 멈추지 말 것. 반대쪽으로, 계속 움직일 것.`,
  },
  ghost_voice: {
    title: '괴담 — 나를 부르는 목소리',
    body: `강당으로 이어지는 통로에서, 밤이면 누군가 이름을 부른다고 한다. 아주 가까이서, 친한 친구의 목소리로.

몇 해 전 그 근처에서 스스로 목숨을 끊은 여학생이 있었다는 소문이 있다. 그 아이는 친구와 한 약속을 지키지 못했다고 한다. 그날 밤 혼자 기다리던 친구는 불 속에서 죽었고, 그 뒤로 그 아이는 밤마다 자기 이름을 부르는 친구의 목소리를 들었다고.

이름이 불려도 돌아보지 말 것. 대답하지 말 것.`,
  },
  ghost_math: {
    title: '괴담 — 풀리지 않는 수학 문제',
    body: `수학 문제 하나에 매달리던 학생이 있었다. 답이 나오지 않는 문제였다. 시험이 끝나고 방학이 와도 그 아이는 교실에 남아 칠판에 식을 쓰고 지우기를 되풀이했다.

그 아이가 떠난 뒤에도, 밤이 되면 2학년 4반 칠판에서 분필 긁히는 소리가 들린다고 한다.

문을 열어 답을 알려 주려 하지 말 것. 그 문제에는 답이 없다.`,
  },
  ghost_tree: {
    title: '괴담 — 피를 원하는 나무',
    body: `한문을 가르치던 B 선생은 교실 뒤편의 작은 나무를 유난히 아꼈다. 물을 주는 대신 다른 것을 주었다는 소문이 돌았다. 아이들이 다친 날이면 그 나무의 잎이 유난히 짙어졌다고.

선생이 학교를 떠난 뒤 나무는 치워졌지만, 바닥 아래로 뻗은 뿌리까지 뽑았는지는 아무도 모른다.

검붉은 꽃봉오리를 단 화분을 보면 가까이 가지 말 것. 꽃이 피면, 누군가 끌려간다.`,
  },
};

// ---------------------------------------------------------------- 수위
const BONGGU_1F = { id: 'bonggu', kind: 'janitor', x: 45.5, y: 10.5, dir: 'left', patrol: [[45.5, 10.5], [30.5, 10], [32.5, 14.5], [30.5, 10.5], [44.5, 9.5]] };
const BONGGU_2F = { id: 'bonggu', kind: 'janitor', x: 44.5, y: 10.5, dir: 'left', patrol: [[44.5, 10.5], [24.5, 10], [24, 14.5], [24.5, 10.5], [4.5, 10], [14.5, 10.5]] };
const treeActive = g => g.flags.treeEvent && !g.flags.treeDead;

// ---------------------------------------------------------------- 공통 조명
const moon = (x, y) => ({ x, y, r: 3.4, color: '120,140,200', a: 0.5 });
const vend = (x, y) => ({ x, y, r: 2, color: '255,110,110', a: 0.55, los: false, fx: 'vend' });

// ---------------------------------------------------------------- 맵
export const maps = {
  main1f: {
    id: 'main1f',
    name: '본관 1구역 1층',
    grid: [
      '##WWWWW####WW###WWW#WW###WWW####################',
      '#:::::::::#,,,,,,,,#,,,,,,,,#........#===#:::::#',
      '#:::::::::#,,,,,,,,#,,,,,,,,#........#===#:::::#',
      '#:::::::::#,,,,,,,,#,,,,,,,,#........#===#:::::#',
      '#:::::::::#,,,,,,,,#,,,,,,,,#####D####===#:::::#',
      '#:::::::::#,,,,,,,,#,,,,,,,,#........#:::#:::::#',
      '#:::::::::#,,,,,,,,#,,,,,,,,#........#:::#:::::#',
      '#:::::::::#,,,,,,,,#,,,,,,,,#........#:::#:::::#',
      '#####D#####wDwwwwDw#wDwwwwDw###D#######D####D###',
      '#...........................#..................#',
      '#...........................D..................#',
      '#...........................#..................#',
      '#####D########DD#####D####D#####D#####D##D######',
      '#,,,,,,,,,#::::::::#,,,,,,,,#_______#..#..######',
      '#,,,,,,,,,#::::::::#,,,,,,,,#_______#..#..######',
      '#,,,,,,,,,#::::::::#,,,,,,,,#_______#..#..######',
      '#,,,,,,,,,#::::::::#,,,,,,,,#_______#..#.......#',
      '#,,,,,,,,,#::::::::#,,,,,,,,##_#_#_##..#.......#',
      '#,,,,,,,,,#::::::::#,,,,,,,,##_#_#_##..#.......#',
      '#WWWWWWWWW#WWWDDWWW#WWWWWWWW#################D##',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 5, y: 8, sprite: 'metaldoor', locked: true, lockedText: '철문이 잠겨 있다. 안쪽에서 무언가가 울리고 있다.', lockedFace: 'serious' },
      { x: 12, y: 8 }, { x: 17, y: 8 }, { x: 21, y: 8 }, { x: 26, y: 8 },
      { x: 31, y: 8 },
      { x: 33, y: 4 },
      { x: 39, y: 8, sprite: 'shutter', locked: true, lockedText: '방화 셔터가 내려와 있다. 옆 벽에 오각형 홈이 파여 있다.', lockedFace: 'serious' },
      { x: 44, y: 8, sprite: 'sealdoor', locked: true, lockedText: "낡은 나무 문. 손잡이가 없다. 옆에 '木' 자가 새겨진 오각형 홈이 있다.", lockedFace: 'serious' },
      { x: 28, y: 10, sprite: 'glassdoor', locked: 'key_central', lockedText: '중앙 통로로 이어지는 유리문. 잠겨 있다.', lockedFace: 'serious' },
      { x: 5, y: 12, locked: 'key_homeec', lockedText: '가사실습실. 잠겨 있다.', lockedFace: 'default' },
      { x: 14, y: 12, sprite: 'glassdoor' }, { x: 15, y: 12, sprite: 'glassdoor' },
      { x: 21, y: 12, locked: true, lockedText: '2학년 4반. 잠겨 있다.', lockedFace: 'default' }, { x: 26, y: 12, locked: true, lockedText: '2학년 4반. 잠겨 있다.', lockedFace: 'default' },
      { x: 32, y: 12 },
      { x: 38, y: 12 },
      { x: 41, y: 12, sprite: 'metaldoor', locked: 'key_hall', lockedText: '강당 통로 철문. 잠겨 있다.', lockedFace: 'serious' },
      { x: 14, y: 19, sprite: 'glassdoor', locked: true, lockedText: '현관문. 아무리 밀어도 꿈쩍하지 않는다.', lockedFace: 'serious' },
      { x: 15, y: 19, sprite: 'glassdoor', locked: true, lockedText: '현관문. 아무리 밀어도 꿈쩍하지 않는다.', lockedFace: 'serious' },
      { x: 45, y: 19, sprite: 'metaldoor', locked: true, lockedText: '강당으로 이어지는 문. 굳게 잠겨 있다.', lockedFace: 'serious' },
    ],
    props: [
      // 기계실습실
      { s: 'workbench', x: 2, y: 3, w: 2, solid: true },
      { s: 'machine', x: 6, y: 2, solid: true },
      { s: 'machine', x: 8, y: 5, solid: true },
      { s: g => (g.flags.safe1Open ? 'safe_open' : 'safe'), x: 7, y: 1, solid: true },
      { s: g => (g.flags.alarmOff ? 'switchboard_on' : 'switchboard'), x: 8, y: 0 },
      { s: 'sigil_metal', x: 4, y: 4, w: 2, h: 2, floor: true, when: F('sigilMetal') },
      { s: 'vent_grate_cut', x: 1, y: 0 },
      // 2-5반
      { s: 'blackboard_kr', x: 13, y: 0, w: 3 },
      { s: 'lockers', x: 11, y: 1, solid: true }, { s: 'lockers', x: 12, y: 1, solid: true },
      ...desks(12, 3), ...desks(12, 5),
      // 2-6반
      { s: 'blackboard_kr', x: 22, y: 0, w: 3 },
      { s: 'teacher_desk', x: 22, y: 2, w: 2, solid: true },
      ...desks(21, 4), ...desks(21, 6),
      // 학적부실/서무실
      { s: 'file_cabinet', x: 29, y: 7, solid: true }, { s: 'file_cabinet', x: 30, y: 7, solid: true },
      { s: 'desk', x: 32, y: 6, solid: true }, { s: 'desk', x: 35, y: 6, solid: true },
      { s: 'copier', x: 36, y: 5, solid: true },
      { s: 'bulletin', x: 29, y: 4, w: 2 },
      { s: 'key_cabinet', x: 31, y: 0 },
      { s: 'shelf', x: 34, y: 1, w: 2, solid: true },
      { s: 'sofa', x: 29, y: 2, w: 2, solid: true },
      // 복도
      { s: g => (g.flags.grateCut ? 'vent_grate_cut' : 'vent_grate'), x: 8, y: 8, lift: 16 },
      { s: 'sign_quiet', x: 30, y: 8 },
      { s: 'seal_slot', x: 38, y: 8 },
      { s: 'seal_slot', x: 45, y: 8 },
      { s: 'extinguisher', x: 1, y: 9, solid: true },
      { s: 'toolbox', x: 36, y: 11, solid: true },
      { s: 'vending', x: 46, y: 11, solid: true },
      // 로비
      { s: 'clock', x: 16, y: 12 },
      { s: 'bulletin', x: 11, y: 12, w: 2 },
      { s: 'vending', x: 18, y: 13, solid: true },
      { s: 'ladder_prop', x: 13, y: 13, when: g => !g.flags['ev:ladder'] },
      { s: 'shoe_cabinet', x: 11, y: 17, w: 2, solid: true },
      { s: 'shoe_cabinet', x: 17, y: 17, w: 2, solid: true },
      { s: g => (g.flags.plant1 ? 'weird_plant_dead' : 'weird_plant'), x: 13, y: 16, solid: true, tremble: g => !g.flags.plant1, when: g => g.flags.treeEvent },
      // 화장실·창고·강당 통로
      { s: 'mop', x: 29, y: 13, solid: true },
      { s: 'mop', x: 37, y: 13, solid: true },
      { s: 'shelf', x: 37, y: 18, w: 2, solid: true },
      { s: 'rope', x: 45, y: 16, when: g => !g.flags['ev:hanging'] },
      // 원작 반영 소품·배경 디테일 (길·조사 지점을 막지 않는 자리)
      { s: 'payphone', x: 13, y: 12 },
      { s: 'map_board', x: 17, y: 12 },
      { s: 'umbrella_stand', x: 12, y: 18, solid: true },
      { s: 'hydrant', x: 2, y: 8 }, { s: 'hydrant', x: 36, y: 8 },
      { s: 'exit_sign', x: 1, y: 8 }, { s: 'exit_sign', x: 46, y: 8 },
      { s: 'poster_0', x: 19, y: 8 }, { s: 'poster_2', x: 34, y: 8 }, { s: 'poster_1', x: 41, y: 8 },
      { s: 'timetable', x: 35, y: 4 },
      { s: 'radiator', x: 17, y: 1, solid: true }, { s: 'radiator', x: 26, y: 1, solid: true },
      { s: 'trash_can', x: 11, y: 7, solid: true }, { s: 'trash_can', x: 27, y: 7, solid: true },
      { s: 'cleaning_box', x: 20, y: 7, solid: true },
      { s: 'sink', x: 34, y: 13, solid: true }, { s: 'sink', x: 35, y: 13, solid: true },
    ],
    lights: [
      moon(4, 1.5), moon(12, 1.5), moon(17.5, 1.5), moon(21, 1.5), moon(26.5, 1.5),
      moon(4, 18), moon(12, 18), moon(17.5, 18), moon(22, 18), moon(26, 18),
      { x: 24, y: 4.5, r: 7.5, color: '240,244,255', a: 0.95, flag: 'light_26', fx: 'fluo' },
      { x: 5, y: 4, r: 6, color: '255,60,50', a: 0.55, flag: 'alarm', fx: 'beacon' },
      { x: 5, y: 5, r: 2.6, color: '255,210,120', a: 0.6, flag: 'sigilMetal' },
      vend(18.5, 14.1), vend(46.5, 12),
    ],
    glows: [
      { x: 15, y: 19.15, color: '60,255,120' }, { x: 1.5, y: 8.6, color: '60,255,120' }, { x: 46.5, y: 8.6, color: '60,255,120' },
    ],
    loops: [{ flag: 'alarm', sfx: 'siren', every: 2.6 }],
    actors: [
      // 목매단 귀신 이후 소영을 만나기 전까지는 퇴장 (바이블 1-14)
      { ...BONGGU_1F, cond: g => g.flags.janitorOn && !treeActive(g) && (!g.flags['ev:hanging'] || g.flags.soyoungMet) },
    ],
    events: [
      // 저장 게시판
      { id: 'save_lobby', on: 'act', x: 11, y: 12, w: 2, run: 'savePoint' },
      { id: 'save_record', on: 'act', x: 29, y: 4, w: 2, run: 'savePoint', cond: g => g.player.y > 4 },
      // 자판기
      { id: 'vend_lobby', on: 'act', x: 18, y: 13, run: 'vending' },
      { id: 'vend_east', on: 'act', x: 46, y: 11, run: 'vending' },
      // 로비
      { id: 'clock', on: 'act', x: 16, y: 12, text: '로비의 큰 벽시계. 바늘이 9시 41분에 멈춰 있다.', face: 'serious' },
      { id: 'ladder', on: 'act', x: 13, y: 13, item: 'ladder', text: '벽에 접이식 사다리가 기대어 있다.', face: 'default', after: 'phoneRing' },
      { id: 'plant1', on: 'act', x: 13, y: 16, run: 'weirdPlant1', cond: g => g.flags.treeEvent && !g.flags.plant1 },
      // 2-5반
      { id: 'locker25', on: 'act', x: 12, y: 1, item: 'wirecutter', text: '사물함 하나가 덜 닫혀 있다. 안에 공구 몇 개가 굴러다닌다.', face: 'default' },
      { id: 'locker25b', on: 'act', x: 11, y: 1, text: '잠긴 사물함. 이름표에 \'2등\'이라는 낙서가 있다.', face: 'default' },
      // 2-6반
      { id: 'switch26', on: 'act', x: 22, y: 8, run: 'switch26', cond: g => g.player.y < 8 },
      { id: 'magazine', on: 'act', x: 25, y: 6, item: 'magazine', text: '뒷줄 책상 위에 학교 잡지가 놓여 있다.', face: 'default', cond: F('light_26'), after: s => s.doc('magazine') },
      { id: 'pen26', on: 'act', x: 22, y: 2, item: 'pen', text: '교탁 서랍에 사인펜이 하나 있다.', face: 'default' },
      { id: 'coin26', on: 'act', x: 23, y: 4, item: 'coin', text: '책상 위에 동전이 하나 떨어져 있다.', face: 'default' },
      { id: 'meet', on: 'touch', x: 1, y: 9, w: 27, h: 3, once: true, run: 'meet', cond: g => g.has('magazine') },
      { id: 'dark26', on: 'touch', x: 20, y: 5, w: 8, h: 3, once: true, text: '어둡다. 문 옆 벽 어딘가에 전등 스위치가 있을 텐데…', face: 'serious', cond: g => !g.flags.light_26 },
      // 환풍구·기계실습실
      { id: 'grate', on: 'act', x: 8, y: 8, run: 'grate' },
      { id: 'memo', on: 'act', x: 2, y: 3, w: 2, run: 'memo', cond: F('sigilMetal') },
      { id: 'switchboard', on: 'act', x: 8, y: 0, run: 'switchboard' },
      { id: 'safe1', on: 'act', x: 7, y: 1, run: 'safe1', cond: g => !g.flags.safe1Looted },
      { id: 'workshopDoor', on: 'act', x: 5, y: 8, run: 'workshopDoor', cond: g => g.player.y < 8 && !g.flags.workshopUnlocked },
      { id: 'swap', on: 'touch', x: 1, y: 9, w: 12, h: 3, once: true, run: 'seongaSwap', cond: F('safe1Looted') },
      // 동쪽
      { id: 'quiet', on: 'touch', x: 30, y: 9, w: 4, h: 3, once: true, run: 'chase', cond: g => !!g.flags['door:main1f:28,10'] },
      { id: 'lighter', on: 'act', x: 32, y: 6, item: 'lighter', text: '책상 위에 라이터가 놓여 있다.', face: 'default', after: 'lighterTip' },
      { id: 'weight', on: 'act', x: 35, y: 6, item: 'weight', text: '책상 밑에 무언가 묵직한 것이 굴러다닌다.', face: 'default' },
      { id: 'copier', on: 'act', x: 36, y: 5, run: 'copier' },
      { id: 'coinRec', on: 'act', x: 30, y: 2, item: 'coin', text: '소파 틈에 동전이 끼어 있다.', face: 'default', cond: g => g.player.y < 4 },
      { id: 'keycab', on: 'act', x: 31, y: 0, run: 'keyCabinet' },
      { id: 'shutterSlot', on: 'act', x: 38, y: 8, run: 'shutterSlot', cond: g => !g.flags.shutterOpen },
      { id: 'toolbox', on: 'act', x: 36, y: 11, run: 'toolbox' },
      { id: 'stairsUp', on: 'touch', x: 38, y: 1, w: 3, h: 2, run: s => s.warp('main2f', 39.5, 6.2, 'down') },
      { id: 'seal', on: 'act', x: 45, y: 8, run: 'sealDoor' },
      { id: 'math', on: 'touch', x: 20, y: 11, w: 8, h: 1, once: true, run: 'chalk', cond: F('janitorOn') },
      // 화장실 칸 (숨기)
      { id: 'stall1', on: 'act', x: 30, y: 17, run: s => s.hide(30.5, 18.4) },
      { id: 'stall2', on: 'act', x: 32, y: 17, run: s => s.hide(32.5, 18.4) },
      { id: 'stall3', on: 'act', x: 34, y: 17, run: s => s.hide(34.5, 18.4) },
      // 창고
      { id: 'penStore', on: 'act', x: 38, y: 17, item: 'pen', text: '선반 아래 상자에 사인펜이 들어 있다.', face: 'default' },
      { id: 'coinStore', on: 'act', x: 37, y: 15, item: 'coin', text: '바닥에 동전이 떨어져 있다.', face: 'default' },
      // 강당 통로
      { id: 'hanging', on: 'touch', x: 42, y: 16, w: 2, h: 3, once: true, run: 'hanging' },
      { id: 'hallDoor', on: 'act', x: 45, y: 18, text: '강당으로 이어지는 문. 굳게 잠겨 있다. 지금은 갈 수 없다.', face: 'serious' },
    ],
  },

  vent: {
    id: 'vent',
    name: '환기구',
    grid: [
      '################',
      '################',
      '#~~~~~~~~~~~~~##',
      '#######~########',
      '#######~########',
      '#######~########',
      '##~~~~~~~~~~~~##',
      '#######~########',
      '#######~########',
      '#######~########',
      '#######~########',
      '#######~########',
      '#######~########',
      '################',
    ],
    ambient: '#05060a',
    speedMul: 0.55,
    noHeadGhost: true,
    ambience: 'vent',
    doors: [],
    props: [
      { s: 'steam', x: 7, y: 4, solid: true, when: g => !g.flags.valveL },
      { s: 'steam', x: 4, y: 2, solid: true, when: g => !g.flags.valveR },
      { s: g => (g.flags.valveL ? 'valve_closed' : 'valve'), x: 2, y: 6, solid: true },
      { s: g => (g.flags.valveR ? 'valve_closed' : 'valve'), x: 13, y: 2, solid: true },
    ],
    lights: [
      { x: 7.5, y: 11, r: 2, color: '110,120,150', a: 0.45 },
      { x: 7.5, y: 6.5, r: 2, color: '110,120,150', a: 0.35 },
      { x: 1.5, y: 2.5, r: 2.2, color: '255,80,60', a: 0.5, flag: 'alarm', fx: 'beacon' },
    ],
    loops: [{ flag: 'alarm', sfx: 'siren', every: 3.4 }],
    events: [
      { id: 'ventKeys', on: 'touch', x: 7, y: 9, once: true, run: 'ventKeys' },
      { id: 'valveL', on: 'act', x: 2, y: 6, run: 'valveL' },
      { id: 'valveR', on: 'act', x: 13, y: 2, run: 'valveR' },
      { id: 'ventExit', on: 'touch', x: 1, y: 2, run: 'ventExit' },
      { id: 'ventBack', on: 'touch', x: 7, y: 12, run: s => s.warp('main1f', 8.5, 9.6, 'down'), cond: g => g.player.y > 12.6 },
    ],
  },

  main2f: {
    id: 'main2f',
    name: '본관 1구역 2층',
    grid: [
      '#WWWWWWWWW#WWWWWWWW#WWWWWWWW#WWWWWWWW###########',
      '#,,,,,,,,,#,,,,,,,,#,,,,,,,,#::::::::#===#.....#',
      '#,,,,,,,,,#,,,,,,,,#,,,,,,,,#::::::::#===#.....#',
      '#wwwwDwwww#,,,,,,,,#,,,,,,,,#::::::::#===#.....#',
      '#,,,,,,,,,#,,,,,,,,#,,,,,,,,#::::::::#===#.....#',
      '#,,,,,,,,,#,,,,,,,,#,,,,,,,,#::::::::#:::#.....#',
      '#,,,,,,,,,#,,,,,,,,#,,,,,,,,#::::::::#:::#.....#',
      '#,,,,,,,,,#,,,,,,,,#,,,,,,,,#::::::::#:::#.....#',
      '####D######wDwwwwDw#wDwwwwDw###D######:::###D###',
      '#..............................................#',
      '#..............................................#',
      '#..............................................#',
      '#####D######D########D####D###D#######........##',
      '#_________#,,,,,,,,#,,,,,,,,#,,,,,,,,#........##',
      '#_________#,,,,,,,,#,,,,,,,,#,,,,,,,,#........##',
      '#_________#,,,,,,,,#,,,,,,,,#,,,,,,,,#........##',
      '#_________#,,,,,,,,#,,,,,,,,#,,,,,,,,#........##',
      '##_#_#_#_##,,,,,,,,#,,,,,,,,#,,,,,,,,#WWWWWWWW##',
      '##_#_#_#_##,,,,,,,,#,,,,,,,,#,,,,,,,,###########',
      '###########WWWWWWWW#WWWWWWWW#WWWWWWWW###########',
    ],
    ambient: '#0a0c15',
    doors: [
      { x: 5, y: 3 },
      { x: 4, y: 8 },
      { x: 12, y: 8 }, { x: 17, y: 8 },
      { x: 21, y: 8, locked: true, lockedText: '2학년 8반. 잠겨 있다. 안에서 무언가 긁는 소리가 들린다…', lockedFace: 'scared' },
      { x: 26, y: 8, locked: true, lockedText: '2학년 8반. 잠겨 있다. 안에서 무언가 긁는 소리가 들린다…', lockedFace: 'scared' },
      { x: 31, y: 8, sprite: 'metaldoor', locked: 'key_red', lockedText: '산악부실. 빨간 꼬리표가 붙은 자물쇠가 걸려 있다.', lockedFace: 'serious' },
      { x: 44, y: 8 },
      { x: 5, y: 12 },
      { x: 12, y: 12, locked: true, lockedText: '2학년 1반. 잠겨 있다.', lockedFace: 'default' },
      { x: 21, y: 12 }, { x: 26, y: 12 },
      { x: 30, y: 12, locked: true, lockedText: '2학년 3반. 잠겨 있다.', lockedFace: 'default' },
    ],
    props: [
      // 방송실·녹음실
      { s: 'console', x: 2, y: 4, w: 2, solid: true },
      { s: 'shelf', x: 7, y: 4, w: 2, solid: true },
      { s: 'console', x: 2, y: 1, w: 2, solid: true },
      // 2-7반
      { s: 'blackboard_kr', x: 13, y: 0, w: 3 },
      ...desks(12, 3), ...desks(12, 5),
      { s: g => (g.flags.plant2 ? 'weird_plant_dead' : 'weird_plant'), x: 17, y: 6, solid: true, tremble: g => !g.flags.plant2, when: g => g.flags.treeEvent },
      // 2-8반
      { s: 'blackboard_kr', x: 22, y: 0, w: 3 },
      { s: 'desk', x: 21, y: 3, solid: true }, { s: 'desk', x: 23, y: 3, solid: true }, { s: 'desk', x: 25, y: 3, solid: true },
      { s: 'desk', x: 21, y: 5, solid: true }, { s: 'desk', x: 23, y: 5, solid: true }, { s: 'desk', x: 25, y: 5, solid: true },
      { s: 'roots', x: 21, y: 9, solid: true, when: treeActive },
      { s: 'roots', x: 26, y: 9, solid: true, when: treeActive },
      // 산악부실·과학준비실
      { s: 'shelf', x: 33, y: 1, w: 2, solid: true },
      { s: 'shelf', x: 42, y: 1, w: 2, solid: true },
      { s: g => (g.flags.safe2Open ? 'safe_open' : 'safe'), x: 45, y: 1, solid: true },
      { s: 'desk', x: 43, y: 4, solid: true },
      // 복도·휴게
      { s: 'bulletin', x: 33, y: 8, w: 2 },
      { s: 'extinguisher', x: 46, y: 9, solid: true },
      { s: g => (g.flags.plant3 ? 'weird_plant_dead' : 'weird_plant'), x: 8, y: 9, solid: true, tremble: g => !g.flags.plant3, when: g => g.flags.treeEvent },
      { s: 'vending', x: 45, y: 13, solid: true },
      { s: 'sofa', x: 40, y: 15, w: 2, solid: true },
      { s: 'plant', x: 38, y: 13, solid: true },
      // 2-2반
      { s: 'blackboard_kr', x: 22, y: 12, w: 3 },
      ...desks(21, 14).filter(d => d.x !== 23), ...desks(21, 17).filter(d => d.x !== 23),
      { s: 'plant', x: 23, y: 15, solid: true, when: g => !g.flags.treeEvent },
      { s: g => (g.flags.treeDead ? 'tree_ghost_dead' : 'tree_ghost'), x: 23, y: 15, w: 2, h: 2, solid: true, when: g => g.flags.treeEvent },
      // 화장실
      { s: 'mop', x: 9, y: 13, solid: true },
      // 원작 반영 소품·배경 디테일
      { s: 'hydrant', x: 7, y: 8 }, { s: 'hydrant', x: 36, y: 8 },
      { s: 'exit_sign', x: 1, y: 8 }, { s: 'exit_sign', x: 46, y: 8 },
      { s: 'poster_1', x: 19, y: 8 }, { s: 'poster_0', x: 29, y: 8 }, { s: 'poster_2', x: 42, y: 8 },
      { s: 'radiator', x: 16, y: 1, solid: true }, { s: 'radiator', x: 26, y: 1, solid: true },
      { s: 'trash_can', x: 11, y: 7, solid: true }, { s: 'trash_can', x: 27, y: 18, solid: true },
      { s: 'sink', x: 1, y: 13, solid: true }, { s: 'sink', x: 2, y: 13, solid: true },
    ],
    lights: [
      moon(4, 1.5), moon(12, 1.5), moon(17.5, 1.5), moon(21, 1.5), moon(26.5, 1.5), moon(32, 1.5),
      moon(13, 18), moon(22, 18), moon(26, 18), moon(32, 18), moon(41, 16),
      { x: 14.5, y: 4.5, r: 7.5, color: '240,244,255', a: 0.95, flag: 'light_27', fx: 'fluo' },
      { x: 23.5, y: 15.5, r: 3.5, color: '200,40,40', a: 0.5, flag: 'treeEvent', fx: 'pulse' },
      vend(45.5, 14.1),
    ],
    glows: [{ x: 1.5, y: 8.6, color: '60,255,120' }, { x: 46.5, y: 8.6, color: '60,255,120' }],
    actors: [
      { ...BONGGU_2F, cond: treeActive },
    ],
    events: [
      { id: 'stairsDown', on: 'touch', x: 38, y: 1, w: 3, h: 2, run: s => s.warp('main1f', 39.5, 6.2, 'down') },
      { id: 'coin2', on: 'act', x: 1, y: 10, item: 'coin', text: '복도 끝 바닥에 동전이 반짝인다.', face: 'default' },
      { id: 'save2', on: 'act', x: 33, y: 8, w: 2, run: 'savePoint', cond: g => g.player.y > 8 },
      { id: 'vend2', on: 'act', x: 45, y: 13, run: 'vending' },
      // 2-7반
      { id: 'switch27', on: 'act', x: 13, y: 8, run: 'switch27', cond: g => g.player.y < 8 },
      { id: 'note', on: 'act', x: 16, y: 3, item: 'note', text: '책상 서랍 사이에 구겨진 쪽지가 끼어 있다.', face: 'default', cond: F('light_27'), after: 'readNote' },
      { id: 'plant2', on: 'act', x: 17, y: 6, run: 'weirdPlant2', cond: g => g.flags.treeEvent && !g.flags.plant2 },
      // 2-8반
      { id: 'room28a', on: 'act', x: 21, y: 8, run: 'room28Locked', cond: g => !g.flags.hangingDone },
      { id: 'room28b', on: 'act', x: 26, y: 8, run: 'room28Locked', cond: g => !g.flags.hangingDone },
      { id: 'soyoungDesk', on: 'act', x: 25, y: 5, run: 'soyoungMeet', cond: g => !g.flags.soyoungMet },
      { id: 'saved', on: 'touch', x: 20, y: 1, w: 8, h: 7, once: true, run: 'soyoungSaved', cond: F('treeDead') },
      { id: 'tabletWood', on: 'act', x: 23, y: 2, item: 'tablet_wood', text: "부서진 뿌리 사이에 '木' 자가 새겨진 패가 떨어져 있다.", face: 'serious', cond: F('soyoungSavedDone'), after: 'gotWood' },
      // 산악부실·과학준비실
      { id: 'spray', on: 'act', x: 35, y: 2, item: 'spray', text: '캠핑 장비 사이에 해충 스프레이가 있다.', face: 'default' },
      { id: 'penClub', on: 'act', x: 30, y: 6, item: 'pen', text: '동아리 일지 옆에 사인펜이 굴러다닌다.', face: 'default' },
      { id: 'safe2', on: 'act', x: 45, y: 1, run: 'safe2', cond: g => !g.flags.safe2Looted },
      { id: 'sciShelf', on: 'act', x: 42, y: 1, w: 2, text: "약품 선반. '화학 용제 — 금고 보관'이라는 라벨만 붙어 있고 병은 없다.", face: 'serious' },
      { id: 'plant3', on: 'act', x: 8, y: 9, run: 'weirdPlant3', cond: g => g.flags.treeEvent && !g.flags.plant3 },
      // 2-2반
      { id: 'tree', on: 'act', x: 23, y: 15, w: 2, h: 2, run: 'tree', cond: treeActive },
      // 방송실
      { id: 'broadcast', on: 'touch', x: 1, y: 4, w: 9, h: 4, once: true, run: 'broadcast', cond: g => g.has('tablet_wood') },
      // 화장실 칸
      { id: 'stall21', on: 'act', x: 2, y: 17, run: s => s.hide(2.5, 18.4) },
      { id: 'stall22', on: 'act', x: 4, y: 17, run: s => s.hide(4.5, 18.4) },
      { id: 'stall23', on: 'act', x: 6, y: 17, run: s => s.hide(6.5, 18.4) },
      { id: 'stall24', on: 'act', x: 8, y: 17, run: s => s.hide(8.5, 18.4) },
    ],
  },
};

function desks(x0, y) {
  return [0, 2, 4].map(i => ({ s: 'desk', x: x0 + i, y, solid: true }));
}

export const onEnter = {
  main2f: async s => {
    if (s.flag('seen2f')) return;
    s.flag('seen2f', true);
    await s.narrate('2층. 복도 저 끝에서 무언가 희미하게 반짝인다.', 'default');
  },
  vent: async s => {
    if (s.flag('seenVent')) return;
    s.flag('seenVent', true);
    await s.narrate('좁고 어둡다. 무릎으로 기어서 갈 수밖에 없다.', 'serious');
  },
};

// ---------------------------------------------------------------- 공략 (휴대폰 → 옵션 → 공략: 지도에 표시)
// guide(g): 지금 진행 상태에서 다음에 할 일 → { text, at: [맵, x, y], via, items: [{ id, name, where, at }], codes: [{ label, value }] }
//   at·아이템 위치는 조사·이벤트 칸. 목적지가 다른 층이면 via = 지금 층의 이동 지점(계단·환풍구).
//   items = 지금 단계에 필요한(진행 필수) 아직 없는 아이템. 비밀번호·배전반 답은 단서를 읽은 뒤에만, 그 전에는 단서 위치.
const ITEM_AT = {
  magazine: ['main1f', 25, 6, '1층 2-6반 뒷줄 책상 (불을 켜야 보인다)'],
  ladder: ['main1f', 13, 13, '1층 로비 벽'],
  wirecutter: ['main1f', 12, 1, '1층 2-5반 사물함'],
  tablet_metal: ['main1f', 7, 1, '1층 기계실습실 금고'],
  toolbelt: ['main1f', 36, 11, '1층 동쪽 복도 빨간 공구함'],
  key_hall: ['main1f', 31, 0, '1층 서무실 열쇠보관함'],
  key_red: ['main1f', 31, 0, '1층 서무실 열쇠보관함'],
  spray: ['main2f', 35, 2, '2층 산악부실 (빨간 열쇠)'],
  note: ['main2f', 16, 3, '2층 2-7반 책상 서랍 (불을 켜야 보인다)'],
  solvent: ['main2f', 45, 1, '2층 과학준비실 금고'],
  tablet_wood: ['main2f', 23, 2, '2층 2-8반'],
};
const VIA = {
  'main1f>main2f': ['main1f', 39, 1, '계단으로 2층'],
  'main2f>main1f': ['main2f', 39, 1, '계단으로 1층'],
  'main1f>vent': ['main1f', 8, 8, '환풍구로 환기구'],
  'vent>main1f': ['vent', 7, 12, '아래 출구로 1층 복도'],
  'vent>main2f': ['vent', 7, 12, '아래 출구로 1층 복도 → 계단'],
};
const PLANTS = [['plant3', 'main2f', 8, 9, '2층 복도 서쪽'], ['plant2', 'main2f', 17, 6, '2층 2-7반'], ['plant1', 'main1f', 13, 16, '1층 로비']];

export function guide(g) {
  const f = g.flags, has = id => g.has(id);
  const S = (text, at, need = [], codes = []) => ({
    text, at, codes,
    via: at[0] === g.mapId ? null : VIA[`${g.mapId}>${at[0]}`] || null,
    items: need.filter(id => !has(id)).map(id => ({ id, name: items[id].name, where: ITEM_AT[id][3], at: ITEM_AT[id].slice(0, 3) })),
  });
  const at = id => ITEM_AT[id].slice(0, 3);
  const board = { label: '배전반', value: f.memoRead ? '3번·4번 소켓만 연결' : '작업대 위 메모에 적혀 있다 (1층 기계실습실)' };
  const valves = { label: '증기 밸브', value: '왼쪽 빨간 밸브 → 오른쪽 위 밸브 순서로 잠그기' };
  const toolCode = { label: '열쇠보관함 비밀번호', value: has('toolbelt') ? f.toolCode : `공구벨트에 새겨져 있다 (${ITEM_AT.toolbelt[3]})` };
  const noteCode = { label: '과학준비실 금고 비밀번호', value: has('note') ? f.noteCode : `낙서 쪽지에 적혀 있다 (${ITEM_AT.note[3]})` };
  const mash = { label: '귀목', value: '용제를 부으면 손들이 붙잡는다 — 버튼을 4초 안에 10번 연타' };
  const branch = { label: '분기 선택(8초)', value: '성아를 쫓는다 = A루트(성아·지현), 울음소리 조사 = B루트(소영), 시간 초과 = A루트' };
  // 화학 용제: 2-7반 불 → 낙서 쪽지(비밀번호) → 과학준비실 금고
  const solvent = need => {
    if (has('solvent') || f.safe2Open) return null;
    if (!has('note')) {
      if (!f.light_27) return S('2-7반 왼쪽 문 옆 벽의 전등 스위치 켜기 (교실 안에서)', ['main2f', 13, 8], [...need, 'note'], [noteCode]);
      return S('2-7반 책상 서랍의 낙서 쪽지 줍기 (금고 비밀번호)', at('note'), [...need, 'note'], [noteCode]);
    }
    return S('과학준비실 금고 열기 → 화학 용제', at('solvent'), need, [noteCode]);
  };
  const spray = need => (has('spray') ? null : S('산악부실(빨간 열쇠로 열기)에서 해충 스프레이 챙기기', at('spray'), need));

  if (f.ch1Clear) return null;
  // 1.1 2-6반 (경보는 배전반에서 다시 꺼지므로 성아·지현과 마주친 기록으로 판단)
  if (!f['ev:meet']) {
    if (!f.light_26) return S('2-6반 왼쪽 문 옆 벽의 전등 스위치 켜기 (교실 안에서)', ['main1f', 22, 8], ['magazine']);
    if (!has('magazine')) return S('2-6반 뒷줄 책상의 교지 줍기', at('magazine'), ['magazine']);
    return S('교지를 들고 복도로 나가기', ['main1f', 15, 10]);
  }
  // 1.2 환풍구 → 환기구 → 기계실습실
  if (!f.grateCut) {
    const need = ['ladder', 'wirecutter'];
    if (!has('ladder')) return S('로비 벽의 접이식 사다리 챙기기', at('ladder'), need);
    if (!has('wirecutter')) return S('2-5반 사물함의 와이어 커터 챙기기', at('wirecutter'), need);
    return S('복도 서쪽, 성아가 서 있던 곳 벽 위 환풍구 철망을 끊고 들어가기', ['main1f', 8, 8], need);
  }
  if (!f.sigilMetal) {
    if (!f.valveL) return S('왼쪽 빨간 밸브 잠그기', ['vent', 2, 6], [], [valves]);
    if (!f.valveR) return S('오른쪽 위 밸브 잠그기', ['vent', 13, 2], [], [valves]);
    return S('환기구 왼쪽 위 출구로 나가기', ['vent', 1, 2]);
  }
  if (!f.alarmOff) {
    if (!f.memoRead) return S('작업대 위 메모 읽기 (배전반 답)', ['main1f', 2, 3], [], [board]);
    return S('금고 옆 배전반의 소켓 연결해 경보 끄기', ['main1f', 8, 0], [], [board]);
  }
  if (!f.safe1Looted) return S('열린 금고 확인하기', ['main1f', 7, 1], ['tablet_metal']);
  if (!f.workshopUnlocked) return S('철문 걸쇠 풀기 (기계실습실 안쪽에서)', ['main1f', 5, 8]);
  if (!f['ev:swap']) return S('복도로 나가기 — 성아와 열쇠 교환', ['main1f', 6, 10]);
  // 1.3 수위
  if (!f.janitorOn) return S("중앙 통로 유리문(열쇠)을 지나 '정숙' 팻말 쪽으로 — 수위가 나타나면 도망", ['main1f', 31, 10]);
  // 1.4 셔터 → 열쇠보관함
  if (!f.shutterOpen) return S('계단 셔터 옆 오각형 홈에 金의 패 끼우기', ['main1f', 38, 8]);
  if (!f.keyCabOpen) {
    if (!has('toolbelt')) return S('동쪽 복도 빨간 공구함의 공구벨트 챙기기 (비밀번호 단서)', at('toolbelt'), ['toolbelt', 'key_hall', 'key_red'], [toolCode]);
    return S('서무실(학적부실 안쪽 방) 열쇠보관함 열기', ['main1f', 31, 0], ['key_hall', 'key_red'], [toolCode]);
  }
  // 1.5 강당 통로
  if (!f.hangingDone) return S('강당통로 열쇠로 철문을 열고 강당 통로 끝까지', ['main1f', 42, 17]);
  // 1.6 소영 — 자리를 조사하면 귀목 7분 제한이 시작되므로 스프레이·화학 용제를 먼저 준비
  if (!f.treeEvent) {
    return spray(['spray', 'solvent']) || solvent(['spray', 'solvent'])
      || S('2-8반 창가 맨 뒷자리(소영의 자리) 조사 — 7분 제한 시작', ['main2f', 25, 5]);
  }
  // 1.7~1.8 귀목: 이상한 화분 3개 → 2-2반 나무
  if (!f.treeDead) {
    const need = ['solvent', 'spray'];
    const floor = g.mapId === 'vent' ? 'main1f' : g.mapId; // 환기구 아래 출구 = 1층 복도
    const plants = PLANTS.filter(p => !f[p[0]]).sort((a, b) => (b[1] === floor) - (a[1] === floor));
    if (plants.length) {
      const [, m, x, y, where] = plants[0];
      return solvent(need) || S(`이상한 화분에 화학 용제 붓기 — ${where} (남은 ${plants.length}개: ${plants.map(p => p[4]).join(', ')})`, [m, x, y], need);
    }
    return spray(need) || S('2-2반 나무의 옹이 구멍에 용제 붓기', ['main2f', 23, 15], need, [mash]);
  }
  if (!f.soyoungSavedDone) return S('2-8반의 소영에게', ['main2f', 23, 4]);
  if (!has('tablet_wood') && !f.route) return S('2-8반 바닥의 木의 패 줍기', at('tablet_wood'), ['tablet_wood']);
  if (!f.route) return S('2층 서쪽 끝 방송실로', ['main2f', 5, 5], [], [branch]);
  return S('1층 계단(셔터) 옆 낡은 문의 홈에 木의 패 끼우기', ['main1f', 45, 8]);
}

// ---------------------------------------------------------------- 새 게임
export function newGame(g) {
  g.checkpointData = null;
  g.give('diary');
  g.give('candy');
  g.give('pen');
  g.flags.toolCode = rnd4();
  g.flags.noteCode = rnd4();
  g.enterMap('main1f', 14.5, 17.4, 'up');
  g.run('prologue');
}

// ---------------------------------------------------------------- 스크립트
export const scripts = {
  prologue: async s => {
    s.cinema(true, 'wide'); // 오프닝 — 텅 빈 로비에 혼자 선 희민
    await s.fade(1, 0);
    await s.card('제1장 · 본관 1구역', '2001년 3월 13일 밤 9시 30분, 연두고등학교');
    await s.cg('cg_prologue');
    await s.say('희민', '(내일은 화이트데이. …그래서 이런 시간에 학교에 몰래 들어왔다.)');
    await s.say('희민', '(한소영. 전학 온 날부터 자꾸 눈이 가던 아이.)', 'smile');
    await s.say('희민', '(공원 벤치에 그 애가 두고 간 다이어리. 이걸 돌려주면서, 사탕은 책상 속에 살짝 넣어 두자.)', 'smile');
    await s.fade(0, 1.2);
    s.sfx('thud');
    s.shake(0.3);
    await s.narrate('쿵— 등 뒤에서 현관문이 저절로 닫혔다.', 'surprised');
    await s.say('희민', '…잠겼어? 방금 열고 들어왔는데.', 'surprised');
    await s.say('희민', '(소영이네 반은 2학년 8반, 2층이었지. 일단 안으로 들어가 보자.)', 'serious');
    s.objective('2층 2-8반, 소영의 자리에 선물 두기');
  },

  savePoint: async s => {
    if (s.g.timer) return s.narrate('지금은 한가하게 기록할 여유가 없다.', 'serious');
    const c = await s.choice('게시판이다. 사인펜으로 기록을 남길까?', ['기록한다 (저장)', '그만둔다']);
    if (c === 0) await s.save();
  },

  vending: async s => {
    if (!s.has('coin')) return s.narrate('음료 자판기. 불빛이 깜빡인다. 동전이 있으면 뽑을 수 있겠다.', 'default');
    const c = await s.choice('음료 자판기. 동전을 넣을까?', ['넣는다', '그만둔다']);
    if (c) return;
    s.take('coin');
    s.sfx('coin');
    await s.wait(0.4);
    await s.give('drink');
  },

  useDrink: async s => {
    s.take('drink');
    s.sfx('drink');
    s.heal(35);
    await s.narrate('음료수를 단숨에 들이켰다. 조금 기운이 난다.', 'smile');
  },

  useLighter: async s => {
    s.lighterOn(!s.g.lighter);
    s.sfx('switch');
  },

  readMagazine: async s => s.doc('magazine'),

  readToolbelt: async s => s.narrate(`드라이버 손잡이 윗면에 숫자 네 개가 새겨져 있다. 「${s.flag('toolCode')}」`, 'serious'),

  readNote: async s => s.narrate(`구겨진 낙서 쪽지. 「과학준비실 금고 — 선생님 몰래 적어 둠: ${s.flag('noteCode')}」`, 'serious'),

  phoneRing: async s => {
    await s.wait(0.5);
    s.sfx('phone');
    await s.narrate('…따르릉. 어디선가 전화벨이 두 번 울리더니, 뚝 끊겼다.', 'surprised');
    await s.say('희민', '(…누가 이 시간에?)', 'scared');
  },

  lighterTip: async s => {
    await s.narrate('이제 어두운 곳을 밝힐 수 있다. (라이터 버튼으로 켜고 끄기)', 'smile');
    await s.narrate('…다만 불빛은 멀리서도 눈에 띈다. 수위가 가까이 있을 땐 꺼 두는 편이 좋겠다.', 'serious');
  },

  copier: async s => {
    if (s.flag('copierRead')) return s.doc('ghost_body');
    s.flag('copierRead', true);
    await s.narrate('복사기 덮개 밑에 종이 한 장이 끼어 있다.', 'default');
    await s.doc('ghost_body');
  },

  // ---- 1.1 2-6반
  switch26: async s => {
    if (s.flag('light_26')) return s.narrate('교실 전등 스위치. 이미 켜져 있다.', 'default');
    s.sfx('switch');
    s.flag('light_26', true);
    await s.narrate('딸깍. 형광등이 몇 번 깜빡이더니 교실이 밝아졌다.', 'default');
    await s.narrate('뒷줄 책상 위에 무언가 놓여 있다.', 'default');
  },

  // 교지를 읽고 복도로 나오면 성아·지현과 마주친다
  meet: async s => {
    const p = s.player();
    const y = Math.min(11.2, Math.max(9.4, p.y));
    s.spawn({ id: 'seonga', skin: 'seonga', x: 2, y: 10, dir: 'right' });
    s.spawn({ id: 'jihyeon', skin: 'jihyeon', x: 1.6, y: 10.8, dir: 'right' });
    s.cinema(true, 'push'); // 복도 축을 따라 성아·지현에게 다가간다
    await s.say('???', '거기 누구야?!');
    s.face('player', 'left');
    await Promise.all([s.move('seonga', Math.max(3, p.x - 1.6), y, 3.2), s.move('jihyeon', Math.max(2.4, p.x - 2.6), Math.min(11.4, y + 0.6), 2.6)]);
    await s.say('성아', '…뭐야, 우리 학교 애잖아. 이 시간에 여기서 뭐 해?');
    const c = await s.choice('', ['미안, 너희가 있는 줄 몰랐어.', '너희야말로 여기서 뭐 하는데?']);
    if (c === 0) { aff(s, 'jihyeon', 1); await s.say('지현', '아, 아니야… 우리도 놀랐을 뿐이야.', 'scared'); }
    else { aff(s, 'seonga', -1); aff(s, 'jihyeon', -1); await s.say('성아', '…뭐야, 말투 하고는.', 'angry'); await s.say('지현', '성, 성아야…', 'scared'); }
    await s.say('성아', '난 김성아. 얘는 설지현. 넌 처음 보는 얼굴인데?');
    await s.say('희민', '이희민. 얼마 전에 전학 왔어.');
    await s.say('지현', '…우, 우리도 두고 온 물건이 있어서. 금방 가려고 했는데 문이…', 'scared');
    await s.say('지현', '저기… 혹시 이따가 화장실 같이 가 줄 수 있어? 혼자는 좀…');
    await s.say('성아', '얘는 진짜, 겁도 많아.', 'smile');
    await s.say('성아', '흐음, 전학생이 이 밤에 학교를 다 오시고. 수상한걸?', 'smirk');
    s.flag('alarm', true);
    s.sfx('siren');
    s.shake(0.3);
    await s.narrate('위이이잉— 어디선가 귀를 찌르는 경보음이 울리기 시작했다.', 'surprised');
    await s.say('성아', '…!', 'surprised');
    await s.move('seonga', 8.5, 9.5, 4);
    s.face('seonga', 'up');
    await s.wait(0.7);
    await s.say('지현', '성아야? 왜 그래, 어디 가!', 'scared');
    s.door(12, 8, 'open');
    await s.move('seonga', 12.5, 9.3, 4.5);
    await s.move('seonga', 13.5, 4.4, 4.5);
    s.despawn('seonga');
    await s.say('지현', '나, 난 성아 따라가 볼게…! 너도 조심해!', 'scared');
    await s.move('jihyeon', 12.5, 9.3, 3.5);
    await s.move('jihyeon', 13.5, 4.4, 3.5);
    s.despawn('jihyeon');
    await s.say('희민', '(경보음은… 저 철문 너머, 기계실습실 쪽에서 울린다.)', 'serious');
    await s.say('희민', '(성아가 서 있던 곳, 벽 위쪽에 환풍구 철망이 있었다.)', 'serious');
    s.objective('경보가 울리는 기계실습실로 들어갈 방법 찾기');
  },

  // ---- 1.2 사이렌
  grate: async s => {
    if (s.flag('grateCut')) {
      const c = await s.choice('뜯어낸 환풍구. 안으로 들어갈까?', ['들어간다', '그만둔다']);
      if (c === 0) await s.warp('vent', 7.5, 12.4, 'up');
      return;
    }
    if (!s.flag('alarm')) return s.narrate('벽 위쪽 환풍구. 녹슨 철망이 나사로 단단히 고정되어 있다.', 'default');
    if (!s.has('ladder') || !s.has('wirecutter')) {
      await s.narrate('환풍구 철망. 위쪽 고정 나사까지는 손이 닿지 않고, 맨손으로 뜯을 수도 없다.', 'serious');
      await s.say('희민', '(딛고 올라설 것과, 철망을 끊을 도구가 있으면…)', 'serious');
      return;
    }
    s.take('ladder');
    s.sfx('switch');
    await s.narrate('사다리를 받치고 올라가 와이어 커터로 철망을 하나씩 끊어 냈다.', 'serious');
    s.flag('grateCut', true);
    s.refresh();
    const c = await s.choice('환풍구가 열렸다. 안으로 들어갈까?', ['들어간다', '나중에']);
    if (c === 0) await s.warp('vent', 7.5, 12.4, 'up');
    s.objective('환기구를 지나 기계실습실로');
  },

  ventKeys: async s => {
    s.sfx('keys');
    await s.narrate('…발밑 철망 아래로 손전등 불빛과 열쇠 꾸러미 소리가 천천히 지나간다.', 'scared');
    await s.say('희민', '(누군가 순찰을 돌고 있어. 숨죽이자.)', 'scared');
  },

  valveL: async s => {
    if (s.flag('valveL')) return s.narrate('빨간 밸브. 이미 잠갔다.', 'default');
    s.sfx('valve');
    s.flag('valveL', true);
    s.refresh();
    await s.narrate('끼익— 빨간 밸브를 끝까지 돌려 잠갔다. 위쪽 통로에서 뿜어지던 증기가 잦아든다.', 'serious');
  },

  valveR: async s => {
    if (s.flag('valveR')) return s.narrate('빨간 밸브. 이미 잠갔다.', 'default');
    s.sfx('valve');
    s.flag('valveR', true);
    s.refresh();
    await s.narrate('끼익— 두 번째 밸브를 잠갔다. 왼쪽 통로의 증기가 멎었다.', 'serious');
  },

  ventExit: async s => {
    await s.warp('main1f', 1.6, 1.6, 'down');
    if (s.flag('sigilMetal')) return;
    s.flag('sigilMetal', true);
    s.refresh();
    s.sfx('bell');
    s.shake(0.4);
    await s.narrate('환기구를 빠져나오자 귀를 찢는 벨 소리가 터졌다.', 'surprised');
    await s.narrate("바닥에… 무언가가 새겨져 있다. 희미하게 빛나는 원 한가운데에 '金' 자.", 'surprised');
    await s.cg('cg_sigil_metal');
    await s.say('희민', '(경보를 꺼야 해. 금고 옆에 배전반이 있다.)', 'serious');
    s.objective('경보 끄기 — 금고 옆 배전반');
  },

  memo: async s => {
    s.flag('memoRead', true);
    await s.doc('memo_switch');
  },

  switchboard: async s => {
    if (s.flag('alarmOff')) return s.narrate('배전반 램프 네 개가 초록색으로 켜져 있다.', 'default');
    if (!s.flag('sigilMetal')) return s.narrate('배전반이다.', 'default');
    const hint = s.flag('memoRead') ? '작업대 메모: 3번·4번 소켓만 연결할 것' : '어느 소켓을 연결해야 할까…';
    const r = await s.switches('배전반 — 소켓 전원', ['1', '2', '3', '4'], hint);
    if (!r) return;
    if (r.join() !== 'false,false,true,true') {
      s.sfx('hit');
      s.shake(0.2);
      await s.narrate('파직! 불꽃이 튀었다. 이 조합이 아닌 모양이다.', 'surprised');
      if (!s.flag('memoRead')) await s.say('희민', '(어디 설명서 같은 거라도 없을까… 작업대 위를 살펴보자.)', 'serious');
      return;
    }
    s.sfx('switch');
    s.flag('alarmOff', true);
    s.flag('alarm', false);
    s.flag('safe1Open', true);
    s.refresh();
    await s.narrate('찰칵. 램프가 하나씩 초록색으로 바뀌더니 경보가 뚝 멎었다.', 'smile');
    s.sfx('unlock');
    await s.narrate('옆의 금고에서 철컥, 잠금이 풀리는 소리가 났다.', 'surprised');
    s.objective('금고 확인하기');
  },

  safe1: async s => {
    if (!s.flag('safe1Open')) return s.narrate('묵직한 금고. 경보 장치와 연결되어 단단히 잠겨 있다.', 'serious');
    s.flag('safe1Looted', true);
    await s.narrate('금고 안에는 손바닥만 한 오각형 패와 열쇠 하나가 들어 있었다.', 'serious');
    await s.give('tablet_metal');
    await s.give('key_homeec');
    await s.say('희민', "('金'… 바닥 문양이랑 같은 글자다.)", 'serious');
    s.objective('기계실습실에서 나가기 (철문은 안쪽에서 열 수 있다)');
  },

  workshopDoor: async s => {
    s.sfx('unlock');
    s.flag('workshopUnlocked', true);
    s.door(5, 8, 'open');
    await s.narrate('안쪽 걸쇠를 풀자 철문이 열렸다.', 'default');
  },

  seongaSwap: async s => {
    const p = s.player();
    s.spawn({ id: 'seonga', skin: 'seonga', x: 12.5, y: 10.4, dir: 'left' });
    await s.move('seonga', Math.min(12, p.x + 1.4), Math.min(11.2, Math.max(9.4, p.y)), 3.5);
    s.face('player', 'right');
    await s.say('성아', '어? 전학생! 거기서 나오는 거야? …그거, 열쇠지?', 'smile');
    await s.say('성아', '가사실습실 열쇠다! 나 거기 두고 온 교과서가 있거든. 그거 나 줘.');
    await s.say('성아', '대신 이거 줄게. 중앙 통로 유리문 열쇠. 계단은 그쪽이니까 너한테 더 필요하잖아?');
    const c = await s.choice('', ['그래, 바꾸자.', '…아까는 왜 갑자기 도망갔어?']);
    if (c === 1) {
      await s.say('성아', '응? 아— 경보 소리에 놀라서. 수위 아저씨 올까 봐 무서웠거든.', 'smirk');
      await s.say('성아', '자, 자. 그런 건 됐고 바꾸자니까?');
    } else aff(s, 'seonga', 1);
    s.take('key_homeec');
    await s.give('key_central');
    await s.say('성아', '고마워, 전학생. …조심해. 이 학교, 밤에는 좀 이상하거든.');
    await s.move('seonga', 5.5, 11.3, 3.5);
    s.door(5, 12, 'open');
    await s.move('seonga', 5.5, 14, 3);
    s.door(5, 12, 'lock');
    s.despawn('seonga');
    s.objective('중앙 통로 유리문을 지나 계단으로');
  },

  // ---- 1.3 수위
  chase: async s => {
    s.cinema(true, 'loom'); // 수위가 복도 끝에서 덮쳐 온다
    await s.narrate("복도 벽에 '정숙' 팻말이 붙어 있다.", 'default');
    s.spawn({ ...BONGGU_1F, x: 46, y: 10.2, patrol: null });
    s.sfx('keys');
    await s.wait(0.6);
    await s.narrate('…철컹, 철컹. 절뚝이는 발소리와 함께 복도 끝에서 손전등 불빛이 다가온다.', 'scared');
    await s.cg('cg_janitor');
    await s.say('희민', '(수위 아저씨…? 아니야, 뭔가 이상해. 손에 방망이를—)', 'scared');
    const j = s.actor('bonggu');
    j.state = 'chase';
    j.lastSeen = [s.player().x, s.player().y];
    s.sfx('whistle');
    s.objective('도망쳐!');
    s.later(2.6, 'rescue');
  },

  rescue: async s => {
    s.cinema(true, 'low'); // 문 밑으로 지나가는 손전등을 바닥에서 본다
    const hp = s.player();
    if (hp.hidden) { hp.hidden = false; hp.visible = true; }
    s.door(31, 8, 'open');
    s.spawn({ id: 'jihyeon', skin: 'jihyeon', x: 31.5, y: 7.2, dir: 'down' });
    await s.say('지현', '이쪽! 빨리!', 'scared');
    await s.fade(1, 0.25);
    s.despawn('bonggu');
    const p = s.player();
    p.x = 31.5; p.y = 6.4; p.dir = 'up';
    s.actor('jihyeon').y = 5.6;
    s.door(31, 8, 'closed');
    await s.fade(0, 0.3);
    await s.narrate('지현이 팔을 잡아끌고 문을 닫았다. 문틈 아래로 손전등 불빛이 천천히 지나간다…', 'scared');
    s.sfx('keys');
    await s.wait(1.4);
    await s.say('지현', '…갔다. 휴우.', 'smile');
    await s.say('지현', '저 사람, 수위 이봉구 아저씨야. 낮에는 엄청 친절한데… 밤만 되면 딴사람 같아.');
    await s.say('지현', '눈에 띄면 호루라기를 불고 쫓아와. 잡히면 방망이로…', 'scared');
    const c = await s.choice('', ['고마워. 덕분에 살았어.', '여기서 뭐 하고 있었어?']);
    if (c === 0) { aff(s, 'jihyeon', 1); await s.say('지현', '아, 아니야. 나도 무서워서 숨어 있었던 거야.'); }
    else await s.say('지현', '성아를 찾다가… 저 아저씨 소리가 들려서 숨었어.');
    await s.say('지현', '난 저 아저씨가 멀어질 때까지 서무실에 좀 더 숨어 있을게. 숨을 데가 필요하면 화장실 칸도 괜찮을 거야.');
    s.door(33, 4, 'open');
    await s.move('jihyeon', 33.5, 3.2, 2.8);
    await s.move('jihyeon', 31.5, 2.0, 2.8);
    s.actor('jihyeon').talk = 'jihyeonHide';
    s.door(33, 4, 'closed');
    s.flag('janitorOn', true);
    s.flag('headGhost', true);
    s.spawn(BONGGU_1F);
    await s.say('희민', '(계단은 셔터로 막혀 있었지. 이 방에도 쓸 만한 게 있는지 살펴보자.)', 'serious');
    s.objective('계단 셔터를 열 방법 찾기 (학적부실 살펴보기)');
  },

  jihyeonHide: async s => {
    await s.say('지현', '쉿… 난 여기 조금만 더 있을게. 아저씨 열쇠 소리가 멀어지면 성아 찾으러 갈 거야.');
  },

  room28Locked: async s => {
    s.sfx('locked');
    await s.narrate('2학년 8반. 잠겨 있다. 안에서 무언가 긁는 소리가 들린다…', 'scared');
    if (s.has('key_hall')) await s.say('희민', '(1층 강당 통로 쪽도 아직 못 가 봤지. 그쪽부터 살펴볼까.)', 'serious');
  },

  // ---- 1.4 2층으로
  shutterSlot: async s => {
    if (!s.has('tablet_metal')) return s.narrate('셔터 옆 벽에 오각형 홈이 파여 있다. 무언가를 끼우는 자리 같다.', 'serious');
    const c = await s.choice("오각형 홈. 金의 패가 꼭 들어맞을 것 같다.", ['끼운다', '그만둔다']);
    if (c) return;
    s.take('tablet_metal');
    s.flag('shutterOpen', true);
    s.sfx('rumble');
    s.shake(0.6);
    await s.narrate('金의 패를 끼우자 덜컹— 셔터가 쇳소리를 내며 말려 올라갔다.', 'surprised');
    s.door(39, 8, 'open');
    await s.narrate('…동시에, 위층 어딘가에서 나무가 쩍 갈라지는 듯한 소리가 들렸다.', 'scared');
    s.objective(s.flag('hangingDone') ? '2층 2-8반으로 (계단)' : s.has('key_hall') ? '1층 강당 통로 조사' : '2층으로 (계단)');
  },

  toolbox: async s => {
    if (s.has('toolbelt')) return s.narrate('빨간 공구함. 더 쓸 만한 건 없다.', 'default');
    await s.narrate('빨간 공구함 위에 공구벨트가 걸려 있다.', 'default');
    await s.give('toolbelt');
    await s.narrate(`드라이버 손잡이 윗면에 숫자 네 개가 새겨져 있다. 「${s.flag('toolCode')}」`, 'serious');
    await s.say('희민', '(굳이 숫자를 새겨 둔 걸 보면… 어딘가의 비밀번호일지도.)', 'serious');
  },

  keyCabinet: async s => {
    if (s.flag('keyCabOpen')) return s.narrate('열쇠보관함. 비어 있다.', 'default');
    if (s.player().y > 4) return s.narrate('열쇠보관함.', 'default');
    const v = await s.keypad('열쇠보관함 — 비밀번호 4자리', 4);
    if (v == null) return;
    if (v !== s.flag('toolCode')) {
      s.sfx('locked');
      return s.narrate('삐빅. 틀렸다.', 'serious');
    }
    s.sfx('unlock');
    s.flag('keyCabOpen', true);
    await s.narrate('딸깍. 보관함이 열렸다.', 'default');
    await s.give('key_hall');
    await s.give('key_red');
    s.objective('강당 통로(1층) 또는 빨간 열쇠의 문(2층) 조사');
  },

  chalk: async s => {
    s.sfx('chalk');
    await s.narrate('…사각, 사각. 잠긴 2학년 4반 안에서 칠판에 분필로 무언가를 쓰는 소리가 난다.', 'scared');
    s.sfx('chalk');
    await s.narrate('문틈 아래로 누렇게 바랜 종이 한 장이 밀려 나왔다.', 'surprised');
    await s.doc('ghost_math');
  },

  // ---- 1.5 목매단 귀신
  hanging: async s => {
    s.cinema(true, 'low'); // 바닥을 기어 오는 것을 바닥 높이에서 본다
    s.despawn('bonggu');
    s.spawn({ id: 'nayoung', skin: 'naying', sprite: 'naying_hang', x: 45.5, y: 16.7 });
    s.sfx('creak');
    await s.narrate('모퉁이를 돌자… 천장에서 무언가가 늘어져 있었다.', 'surprised');
    await s.narrate('교복. 맨발. 얼굴을 덮은 긴 머리카락. 그것이 아주 천천히, 이쪽으로 고개를 돌렸다.', 'scared');
    await s.cg('cg_hanging');
    s.sfx('stinger');
    s.despawn('nayoung');
    s.refresh();
    s.sfx('thud');
    // 바이블 1-14: 기어 오다 멈추고 무언가를 가리킨 뒤 사라진다(공격하지 않는다)
    s.spawn({ id: 'nayoung', kind: 'ghost', skin: 'naying', x: 45.5, y: 17, dir: 'left', glow: '160,180,220' });
    await s.narrate('툭— 밧줄이 끊어지고, 그것이 바닥을 기어 오기 시작했다!', 'scared');
    await s.move('nayoung', Math.max(43.6, s.player().x + 1.6), 17, 1.6);
    s.face('nayoung', 'left');
    s.shake(0.3);
    await s.narrate('…그것은 손을 뻗으면 닿을 거리에서 멈췄다. 떨리는 손가락이 천장을, 그 위층을 가리킨다.', 'scared');
    s.sfx('creak');
    s.despawn('nayoung');
    await scripts.hangingEnd(s);
  },

  hangingEnd: async s => {
    if (s.flag('hangingDone')) return;
    await s.narrate('…눈을 깜빡이자 그것은 사라지고 없었다. 바닥에 젖은 종이 한 장이 남아 있다.', 'surprised');
    await s.doc('ghost_voice');
    s.flag('door:main2f:21,8', 'closed');
    s.flag('door:main2f:26,8', 'closed');
    s.flag('hangingDone', true);
    await s.say('희민', '(…2층에서 무언가가 열리는 소리가 들린 것 같다.)', 'serious');
    s.objective('2층 2-8반으로');
  },

  // ---- 1.6 소영
  soyoungMeet: async s => {
    s.cinema(true, 'over'); // 뿌리에 끌려가는 소영을 위에서 — 작고 무력하게
    s.checkpoint('귀목 이벤트 직전부터 다시');
    s.flag('soyoungMet', true);
    await s.narrate('창가 쪽 맨 뒷자리. 여기가… 소영의 자리.', 'smile');
    await s.narrate('가방에서 다이어리와 사탕 상자를 꺼내려는 순간—', 'smile');
    s.spawn({ id: 'soyoung', skin: 'soyoung', x: 21.5, y: 6.6, dir: 'right' });
    await s.say('소영', '…거기서 뭐 하는 거야?');
    s.face('player', 'left');
    await s.say('희민', '어? 한소영…? 너야말로 이 시간에 여길 어떻게…', 'surprised');
    await s.say('소영', '내가 먼저 물었어. 내 자리에서 뭘 하고 있었는지.', 'angry');
    const c = await s.choice('', ['다이어리를 돌려주려고…', '사탕을 주려고…', '그냥 지나가던 길이야.']);
    s.flag('diary_answer', ['diary', 'candy', 'none'][c]);
    if (c === 0) { aff(s, 'soyoung', 1); await s.say('소영', '…내 다이어리. 공원에서 잃어버린 줄 알았는데.', 'surprised'); }
    else if (c === 1) await s.say('소영', '…사탕? 지금, 이런 밤에?', 'surprised');
    else { aff(s, 'soyoung', -1); await s.say('소영', '거짓말이 서툴구나.', 'angry'); }
    await s.say('소영', '여긴 밤에 오면 안 되는 곳이야. 너는 아무것도 모르고 들어왔겠지만.');
    await s.say('희민', '현관문이 잠겨서, 나가려 해도…');
    await s.say('소영', '알아. 이제 쉽게는 못 나가.');
    s.sfx('rumble');
    s.shake(1.4);
    await s.narrate('쿠구궁— 교실 바닥이 갈라지며 시커먼 뿌리가 솟구쳤다!', 'surprised');
    s.sfx('burst');
    await s.say('소영', '…!', 'surprised');
    await s.cg('cg_tree');
    await s.move('soyoung', 23.5, 1.6, 5);
    s.despawn('soyoung');
    await s.narrate('뿌리가 소영의 발목을 휘감아 교실 안쪽 어둠 속으로 끌고 들어갔다.', 'scared');
    await s.fade(1, 0.3);
    s.flag('treeEvent', true);
    s.door(21, 8, 'lock');
    s.door(26, 8, 'lock');
    s.refresh();
    const p = s.player();
    p.x = 23.5; p.y = 10.4; p.dir = 'up';
    await s.fade(0, 0.6);
    await s.narrate('정신을 차려 보니 복도였다. 교실 문은 굵은 뿌리로 뒤덮여 꿈쩍도 하지 않는다.', 'surprised');
    await s.say('희민', '(소영이가 안에 있어…! 어떻게든 해야 해.)', 'serious');
    await s.narrate('어딘가에서 흙냄새와 함께, 무언가가 피어나려는 듯 꿈틀대는 소리가 들린다…', 'scared');
    s.spawn(BONGGU_2F);
    s.sfx('whistle');
    await s.narrate('…아래층에서 호루라기 소리. 수위도 2층으로 올라오고 있다.', 'scared');
    s.objective('이상한 화분 3개를 말려 죽이고, 뿌리의 근원 찾기');
    s.timer(420, '소영', 'treeFail');
  },

  treeFail: async s => {
    s.sfx('stinger');
    await s.narrate('이상한 화분의 봉오리가 일제히 터지며 핏빛 꽃이 피어났다. 멀리서 소영의 비명이 들렸다…', 'scared');
    s.gameOver('꽃이 피었다… 소영을 구하지 못했다.');
  },

  weirdPlant1: async s => weirdPlant(s, 'plant1'),
  weirdPlant2: async s => weirdPlant(s, 'plant2'),
  weirdPlant3: async s => weirdPlant(s, 'plant3'),

  safe2: async s => {
    if (s.flag('safe2Open')) return;
    const v = await s.keypad('과학준비실 금고 — 비밀번호 4자리', 4);
    if (v == null) return;
    if (v !== s.flag('noteCode')) {
      s.sfx('locked');
      return s.narrate('삐빅. 틀렸다.', 'serious');
    }
    s.sfx('unlock');
    s.flag('safe2Open', true);
    s.flag('safe2Looted', true);
    s.refresh();
    s.flag('solventLeft', 4);
    await s.narrate('금고 안에 갈색 약병이 들어 있다. 라벨: 「고농도 화학 용제 — 식물 사용 금지」', 'serious');
    await s.give('solvent');
  },

  switch27: async s => {
    if (s.flag('light_27')) return s.narrate('교실 전등 스위치. 이미 켜져 있다.', 'default');
    s.sfx('switch');
    s.flag('light_27', true);
    await s.narrate('딸깍. 형광등이 켜졌다. 책상 서랍 사이로 종이 끄트머리가 보인다.', 'default');
  },

  // ---- 1.7~1.8 귀목
  tree: async s => {
    const alive = ['plant1', 'plant2', 'plant3'].filter(k => !s.flag(k)).length;
    if (alive) {
      await s.narrate('거대한 나무가 교실 바닥을 뚫고 솟아 있다. 옹이 구멍이 숨을 쉬듯 벌름거린다.', 'scared');
      await s.narrate(`학교 어딘가에서 이 나무에 힘을 보태는 것들이 있다. (남은 이상한 화분: ${alive}개)`, 'serious');
      return;
    }
    if (!s.has('solvent')) return s.narrate('옹이 구멍 깊숙이 무언가를 부어 넣을 수 있을 것 같다.', 'serious');
    if (!s.has('spray')) {
      await s.narrate('나무 둘레의 바닥에서 손가락 같은 잔뿌리가 꿈틀거린다. 섣불리 다가갔다간 붙잡히겠다.', 'scared');
      await s.say('희민', '(벌레든 덩굴이든 쫓아낼 만한 걸 먼저 구해야겠어.)', 'serious');
      return;
    }
    await s.narrate('남은 용제를 옹이 구멍에 모두 쏟아부었다.', 'serious');
    s.take('solvent');
    s.flag('solventLeft', 0);
    s.sfx('burst');
    s.shake(1);
    await s.narrate('끼이이익— 나무 전체가 비명을 지르듯 뒤틀린다!', 'surprised');
    await s.narrate('바닥에서 시커먼 손들이 솟아올라 다리를 움켜쥐었다!', 'scared');
    for (;;) {
      const ok = await s.qte('해충 스프레이를 마구 뿌려라!', 10, 4);
      if (ok) break;
      s.damage(30);
      await s.narrate('손아귀가 발목을 짓누른다… 다시!', 'scared');
    }
    s.sfx('spray');
    await s.narrate('손들이 연기처럼 오그라들며 바닥으로 빨려 들어갔다.', 'serious');
    s.sfx('thud');
    s.shake(0.6);
    s.stopTimer();
    s.clearCheckpoint();
    s.flag('treeDead', true);
    s.flag('door:main2f:21,8', 'closed');
    s.flag('door:main2f:26,8', 'closed');
    s.g.world.doors.get('21,8').locked = null;
    s.g.world.doors.get('26,8').locked = null;
    s.refresh();
    s.despawn('bonggu');
    await s.narrate('나무가 쩍 갈라지며 검게 타 들어갔다. 2-8반 쪽에서 뿌리가 끊어지는 소리가 들린다.', 'surprised');
    await s.narrate('타 버린 밑동에서 누렇게 바랜 종이 한 장이 팔랑 떨어졌다.', 'serious');
    await s.doc('ghost_tree');
    s.objective('2-8반의 소영에게');
  },

  soyoungSaved: async s => {
    s.cinema(true, 'push'); // 주저앉은 소영에게 조용히 다가간다
    s.spawn({ id: 'soyoung', skin: 'soyoung', x: 23.5, y: 4.5, dir: 'down' });
    await s.narrate('부서진 뿌리 사이에 소영이 주저앉아 있었다.', 'serious');
    const c = await s.choice('', ['괜찮아? 어디 다친 곳은 없어?', '휴, 하마터면 큰일 날 뻔했잖아.']);
    if (c === 0) { aff(s, 'soyoung', 1); await s.say('소영', '…괜찮아. 조금 긁혔을 뿐이야.', 'sad'); }
    else await s.say('소영', '…그러게.');
    await s.say('소영', '고마워. 네가 아니었으면 저 나무에게 먹혔을 거야.', 'smile');
    await s.say('소영', '이 학교에는 다섯 개의 패가 있어. 그게 학교를… 이 미궁을 붙잡아 두고 있어.');
    await s.say('소영', '방금 그 나무가 지키던 게, 저기 떨어진 거야.');
    await s.say('희민', '아까 복도에서 성아랑 지현이도 봤어. 둘 다 아직 안에 있을 거야.', 'serious');
    await s.say('소영', '지현이가…? 그럼 찾아야 해. …너도 여기 너무 오래 있지 마.');
    await s.move('soyoung', 26.5, 7.4, 2.4);
    s.door(26, 8, 'open');
    await s.move('soyoung', 26.5, 10, 2.4);
    await s.move('soyoung', 38.5, 10, 2.6);
    s.despawn('soyoung');
    s.flag('soyoungSavedDone', true);
    s.objective('木의 패 줍기');
  },

  gotWood: async s => {
    await s.say('희민', "('木'의 패. 바닥에 새겨져 있던 金처럼… 또 다른 오행.)", 'serious');
    s.objective('방송실 쪽에서 인기척이 난다');
  },

  // ---- 분기: 방송실
  broadcast: async s => {
    s.cinema(true, 'dutch', [6.5, 5.2]); // 성아를 보는 기울어진 화면(귀신은 벽 너머라 카메라가 잡지 않는다)
    s.spawn({ id: 'seonga', skin: 'seonga', x: 6.5, y: 5.2, dir: 'down' });
    await s.say('성아', '어, 전학생! 살아 있었네?', 'smile');
    await s.say('성아', '방송이라도 해서 밖에 알릴까 했는데… 장비가 전부 먹통이야.');
    const c = await s.choice('', ['지현이가 너를 찾고 있었어.', '너 아까 왜 혼자 사라졌어?']);
    if (c === 0) { aff(s, 'seonga', 1); await s.say('성아', '지현이가? …걔는 꼭 이럴 때 겁도 없이 돌아다닌다니까.'); }
    else await s.say('성아', '사라지긴. 너야말로 소영이 뒤꽁무니나 쫓아다니던데?', 'smirk');
    s.sfx('cry');
    await s.narrate('그때— 어딘가에서 가늘게 흐느끼는 소리가 들려왔다.', 'surprised');
    await s.say('성아', '…! 저 소리…', 'surprised');
    s.door(4, 8, 'open');
    await s.move('seonga', 4.5, 7.4, 4.5);
    await s.move('seonga', 4.5, 10, 4.5);
    await s.move('seonga', 1.5, 10, 4.5);
    s.despawn('seonga');
    const r = await s.choice('어떻게 할까?', ['성아를 쫓아간다', '울음소리를 조사한다'], { timeout: 8, def: 0 });
    if (r === 0) {
      s.flag('route', 'A');
      await s.narrate('성아를 쫓아 복도로 뛰쳐나갔다.', 'serious');
      await s.narrate('…하지만 복도 어디에도 성아는 없었다. 계단 쪽에서 발소리만 멀어져 간다.', 'surprised');
    } else {
      s.flag('route', 'B');
      await s.narrate('흐느낌은… 방송실 안쪽, 녹음실에서 새어 나온다.', 'scared');
      s.door(5, 3, 'open');
      s.spawn({ id: 'nayoung', skin: 'naying', sprite: 'naying_hang', x: 3.5, y: 2.2 });
      s.sfx('stinger');
      await s.narrate('녹음실 유리창 너머… 천장에 매달린 소녀가 이쪽을 내려다보고 있었다.', 'scared');
      await s.cg('cg_recording');
      s.spawn({ id: 'soyoung', skin: 'soyoung', x: 4.5, y: 9.6, dir: 'up' });
      s.door(4, 8, 'open');
      await s.move('soyoung', 4.5, 6.6, 2.2);
      await s.say('소영', '…언니?', 'sad');
      await s.say('희민', '언니…? 저게, 소영이 너의…', 'surprised');
      s.despawn('nayoung');
      s.sfx('creak');
      await s.say('소영', '……3년 전에, 언니가 이 학교에서 죽었어. 내가 밤마다 여기 남아 있던 건 그래서야.', 'sad');
      await s.say('소영', '언니가 왜 그랬는지… 아직 여기 있는 거라면, 알아야 해.', 'sad');
      const w = await s.choice('', ['괜찮아? …혼자 감당하지 않아도 돼.', '…그런 사정이 있었구나.']);
      if (w === 0) { aff(s, 'soyoung', 1); await s.say('소영', '…이상한 애네, 너. 그래도 고마워.', 'smile'); }
      else await s.say('소영', '응.');
      await s.say('소영', "木의 패, 네가 가지고 있지? 1층 계단 옆 낡은 문. 그 옆 홈에 끼우면 본관 2구역으로 갈 수 있어.");
      await s.say('소영', '나도 같이 갈게. 문 앞에서 기다릴게.');
      await s.move('soyoung', 4.5, 10, 2.4);
      await s.move('soyoung', 38.5, 10, 2.6);
      s.despawn('soyoung');
    }
    s.objective("1층 계단(셔터) 옆 낡은 문(결계)에 木의 패 끼우기");
  },

  sealDoor: async s => {
    if (!s.has('tablet_wood')) return s.narrate("낡은 나무 문 옆의 오각형 홈. 가운데에 '木' 자가 새겨져 있다.", 'serious');
    if (!s.flag('route')) return s.say('희민', '(…아까 위층 방송실 쪽에서 인기척이 났었지. 먼저 확인해 보자.)', 'serious');
    s.cinema(true, 'low', [44.5, 8.5]); // 결계문을 올려다본다
    if (s.flag('route') === 'A' && !s.actor('jihyeon')) {
      s.spawn({ id: 'jihyeon', skin: 'jihyeon', x: 40.5, y: 10.6, dir: 'right' });
      s.spawn({ id: 'seonga', skin: 'seonga', x: 40.5, y: 9.6, dir: 'right' });
      await Promise.all([s.move('jihyeon', 43.5, 10.4, 2.6), s.move('seonga', 44, 9.6, 2.8)]);
      await s.say('지현', '희민아! 다행이다… 성아가 계단에 서 있길래 같이 내려왔어.', 'smile');
      await s.say('성아', '뭐야, 그 얼굴. 내가 귀신이라도 되는 줄 알았어?', 'smirk');
      await s.say('성아', '그나저나 소영이는? …걔, 원래 좀 이상한 애야. 너무 믿지 않는 게 좋을걸.');
      const c = await s.choice('', ['소영이를 그렇게 말하지 마.', '…그래, 조금 이상하긴 했어.']);
      if (c === 0) { aff(s, 'jihyeon', 1); aff(s, 'seonga', -1); await s.say('지현', '…응. 소영이는 나쁜 애가 아니야.'); await s.say('성아', '흥. 그래, 그렇다 치자.', 'angry'); }
      else { aff(s, 'seonga', 1); aff(s, 'jihyeon', -1); await s.say('성아', '거봐, 너도 느꼈지?', 'smirk'); await s.say('지현', '성아야…', 'sad'); }
      await s.say('지현', '…우리도 같이 가도 돼? 이대로는 도저히 못 있겠어.', 'sad');
    }
    if (s.flag('route') === 'B' && !s.actor('soyoung')) {
      s.spawn({ id: 'soyoung', skin: 'soyoung', x: 42.5, y: 9.6, dir: 'right' });
      await s.say('소영', '…왔구나. 이 문 너머가 본관 2구역이야.');
    }
    const c = await s.choice('木의 패를 홈에 끼울까?', ['끼운다', '그만둔다']);
    if (c) { for (const id of ['jihyeon', 'seonga', 'soyoung']) s.despawn(id); return; }
    s.take('tablet_wood');
    s.flag('ch1Clear', s.flag('route'));
    s.sfx('rumble');
    s.shake(1.2);
    await s.narrate("木의 패를 끼우자, 낡은 문에 새겨진 '木' 자가 푸르스름하게 빛났다.", 'surprised');
    s.door(44, 8, 'open');
    s.sfx('creak');
    await s.narrate('삐걱— 문이 저절로 열렸다. 그 너머로 본관 2구역의 어둠이 길게 이어져 있다.', 'serious');
    await s.cg('cg_seal');
    await s.g.story.scripts.ch2Start(s); // 제2장(data/chapter2.js)으로 이어진다
  },
};

// 이상한 화분: 화학 용제로 말려 죽인다
async function weirdPlant(s, key) {
  if (!s.has('solvent')) {
    await s.narrate('뒤틀린 줄기 끝에 검붉은 봉오리가 맥박치듯 부풀어 있다. 맨손으로는 어쩔 수 없다.', 'scared');
    await s.say('희민', '(이걸 말려 죽일 만큼 독한 게 필요해… 과학실 쪽이라면?)', 'serious');
    return;
  }
  s.sfx('spray');
  s.flag(key, true);
  s.flag('solventLeft', (s.flag('solventLeft') || 0) - 1);
  s.refresh();
  await s.narrate('화학 용제를 붓자 줄기가 쉭쉭 소리를 내며 검게 말라비틀어졌다.', 'serious');
  const left = ['plant1', 'plant2', 'plant3'].filter(k => !s.flag(k)).length;
  if (left) await s.narrate(`(남은 이상한 화분: ${left}개)`, 'serious');
  else {
    await s.narrate('…2-2반 쪽에서, 무언가 커다란 것이 고통스럽게 몸부림치는 소리가 들렸다.', 'scared');
    s.objective('뿌리의 근원 — 2-2반의 나무');
  }
}
