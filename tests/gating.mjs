// 진행 차단(게이팅) 검증: 잠긴 문·고체 소품을 벽으로 보고 BFS — 열쇠 없이 다음 구역에 갈 수 없어야 한다
import { World } from '../js/world.js';
import * as story from '../data/chapter1.js';
let bad = 0;
const check = (name, ok) => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); };

function reach(mapId, start, flags = {}, unlocked = []) {
  const def = story.maps[mapId];
  const st = { flags, doorState: (m, d) => ({ open: false, locked: unlocked.includes(`${d.x},${d.y}`) ? null : (d.locked || null) }) };
  const w = new World(def, st);
  const seen = new Set([start.join()]), q = [start];
  while (q.length) {
    const [c, r] = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr, k = nc + ',' + nr;
      if (seen.has(k)) continue;
      const d = w.door(nc, nr);
      const pass = d ? !d.locked : !w.isSolid(nc, nr);
      if (!pass) continue;
      seen.add(k); q.push([nc, nr]);
    }
  }
  return (c, r) => seen.has(c + ',' + r);
}

const S = [14, 17]; // 시작: 로비
let R = reach('main1f', S);
check('시작: 서쪽 복도·2-5반·2-6반 도달', R(5, 10) && R(13, 4) && R(24, 4));
check('잠김: 기계실습실(철문) 도달 불가', !R(4, 4));
check('잠김: 중앙통로문 동쪽 도달 불가', !R(31, 10) && !R(31, 6));
check('잠김: 계단(셔터) 도달 불가', !R(39, 3));
check('잠김: 가사실습실·2-4반·강당 통로 도달 불가', !R(5, 15) && !R(23, 15) && !R(41, 15));
R = reach('main1f', S, {}, ['28,10']);
check('중앙통로문 열면: 학적부실·화장실·창고(동전·사인펜) 도달', R(31, 6) && R(32, 15) && R(37, 15) && R(38, 17));
check('중앙통로문 열어도: 셔터 너머·강당 통로·결계 너머 불가', !R(39, 3) && !R(41, 15) && !R(44, 4));
R = reach('main1f', S, {}, ['28,10', '39,8', '41,12']);
check('셔터·강당통로 열면 도달', R(39, 2) && R(44, 17));
check('결계 너머(본관 2구역)는 끝까지 불가', !R(44, 4));
// 기계실습실 내부(환기구 출구)에서 철문 안쪽까지 이어짐
R = reach('main1f', [1, 1]);
check('기계실습실 내부: 배전반·금고·철문 앞 도달', R(8, 1) && R(7, 2) && R(5, 7));
// 2층
R = reach('main2f', [39, 6]);
check('2층: 2-7반·과학준비실·2-2반·방송실 도달', R(14, 4) && R(45, 3) && R(23, 14) && R(5, 6));
check('2층 잠김: 2-8반·산악부실 도달 불가', !R(23, 4) && !R(33, 4));
R = reach('main2f', [39, 6], { treeEvent: true });
check('귀목 중: 2-8반 문 앞 뿌리로 막힘(복도는 통행)', !R(21, 9) && R(23, 10));
// 환기구: 밸브 순서
R = reach('vent', [7, 12]);
check('환기구: 처음엔 왼쪽 밸브만 도달', R(3, 6) && !R(12, 2));
R = reach('vent', [7, 12], { valveL: true });
check('왼쪽 밸브 후: 오른쪽 밸브 도달, 출구는 막힘', R(12, 2) && !R(1, 2));
R = reach('vent', [7, 12], { valveL: true, valveR: true });
check('두 밸브 후: 출구 도달', R(1, 2));
// 모든 '조사' 이벤트: 문을 다 연 상태에서 인접 칸 중 하나에 설 수 있어야 한다(소품·벽에 갇힌 조사 지점 없음)
const ALL = m => Object.values(story.maps[m].doors || {}).map(d => `${d.x},${d.y}`);
const starts = { main1f: [[14, 17], [1, 1]], main2f: [[39, 6]], vent: [[7, 12]] };
for (const [m, def] of Object.entries(story.maps)) {
  const rs = [];
  for (const flags of [{}, { treeEvent: true }, { valveL: true, valveR: true }]) for (const st of starts[m]) rs.push(reach(m, st, flags, ALL(m)));
  const stuck = [];
  for (const ev of def.events || []) {
    if (ev.on !== 'act') continue;
    const cells = [];
    for (let y = ev.y; y < ev.y + (ev.h || 1); y++) for (let x = ev.x; x < ev.x + (ev.w || 1); x++) cells.push([x, y]);
    const ok = cells.some(([x, y]) => [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([dx, dy]) => rs.some(R => R(x + dx, y + dy))));
    if (!ok) stuck.push(ev.id);
  }
  check(`${m}: 조사 지점 ${def.events.filter(e => e.on === 'act').length}개 모두 접근 가능${stuck.length ? ' — 불가: ' + stuck.join(', ') : ''}`, !stuck.length);
}
console.log(bad ? `\n${bad} FAIL` : '\nALL PASS');
process.exit(bad ? 1 : 0);
