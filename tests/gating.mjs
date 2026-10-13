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
// 모든 '조사' 이벤트: 실제 조사 판정과 같은 방식으로 검사한다.
// 도달 가능한 칸 중앙에 서서 4방향을 바라볼 때, 탐침(0.6·0.9칸 앞)에 걸리는 첫 조사 대상이 그 이벤트인 위치가 있어야 한다.
// 조건식(cond)은 진행 상태 몇 가지(빈 상태 / 모두 참 / 중간 진행)로 평가한다.
const DONE = new Set(['safe1Looted', 'safe2Looted', 'plant1', 'plant2', 'plant3', 'treeDead', 'soyoungMet', 'hangingDone', 'workshopUnlocked', 'shutterOpen', 'keyCabOpen', 'alarmOff', 'copierRead', 'grateCut']);
const ALLT = new Proxy({}, { get: () => true });
const MID = new Proxy({}, { get: (_, k) => !DONE.has(k) && !String(k).startsWith('ev:') });
const starts = { main1f: [[14, 17], [1, 1]], main2f: [[39, 6]], vent: [[7, 12]] };
const DIRV = [[0, 1], [0, -1], [-1, 0], [1, 0]];
for (const [m, def] of Object.entries(story.maps)) {
  const allDoors = (def.doors || []).map(d => `${d.x},${d.y}`);
  const acts = (def.events || []).filter(e => e.on === 'act');
  const ok = new Set();
  for (const flags of [{}, ALLT, MID]) {
    const st = { flags, has: () => true, doorState: () => ({ open: true, locked: null }) };
    const w = new World(def, st);
    const Rs = starts[m].map(p => reach(m, p, flags, allDoors));
    for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) {
      if (!Rs.some(R => R(c, r)) || w.isSolid(c, r)) continue;
      const g = { flags, has: () => true, player: { x: c + 0.5, y: r + 0.5 } };
      for (const [fx, fy] of DIRV) {
        for (const k of [0.6, 0.9]) {
          const tc = Math.floor(c + 0.5 + fx * k), tr = Math.floor(r + 0.5 + fy * k);
          const hit = acts.find(e => tc >= e.x && tc < e.x + (e.w || 1) && tr >= e.y && tr < e.y + (e.h || 1) && (!e.cond || e.cond(g)));
          if (hit) { ok.add(hit.id); break; }
          if (w.door(tc, tr)) break;
        }
      }
    }
  }
  const stuck = acts.filter(e => !ok.has(e.id)).map(e => e.id);
  check(`${m}: 조사 지점 ${acts.length}개 모두 실제 조사 판정으로 선택 가능${stuck.length ? ' — 불가: ' + stuck.join(', ') : ''}`, !stuck.length);
}
console.log(bad ? `\n${bad} FAIL` : '\nALL PASS');
process.exit(bad ? 1 : 0);
