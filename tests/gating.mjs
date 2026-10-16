// 진행 차단(게이팅) 검증: 잠긴 문·고체 소품을 벽으로 보고 BFS — 열쇠 없이 다음 구역에 갈 수 없어야 한다
import { World } from '../js/world.js';
import * as story from '../data/story.js';
let bad = 0;
const check = (name, ok) => { if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); };

function reach(mapId, start, flags = {}, unlocked = [], items = []) {
  const def = story.maps[mapId];
  const st = { flags, has: id => items.includes(id), doorState: (m, d) => ({ open: false, locked: unlocked.includes(`${d.x},${d.y}`) ? null : (d.locked || null) }) };
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
// ---------------- 2장(본관 2구역)
R = reach('main2_1f', [34, 17]);
check('2장 1층: 입구에서 복도·교무실1·상담실·당직실·화장실 도달', R(20, 10) && R(16, 4) && R(35, 2) && R(3, 15) && R(12, 15));
check('2장 1층 잠김: 교장실(비밀번호)·행정실·본관 1구역 문 도달 불가', !R(25, 5) && !R(22, 15) && !R(34, 19));
check('2장 1층: 아래층 계단은 셔터로 막힘', !R(4, 2) && R(1, 2));
R = reach('main2_1f', [34, 17], {}, ['26,8']);
check('교장실 문 열면 교장실 도달', R(25, 5) && R(23, 2));
R = reach('main2_2f', [5, 5]);
check('2장 2층: 학생부실·휴게실·보건실·화장실 도달', R(10, 2) && R(20, 5) && R(15, 15) && R(5, 14));
check('2장 2층 잠김: 분실물보관실·제2교무실·인쇄실 도달 불가', !R(34, 15) && !R(28, 4) && !R(25, 15));
R = reach('main2_2f', [5, 5], {}, ['35,12', '23,4']);
check('열쇠로 분실물보관실·제2교무실(휴게실 안쪽 문) 도달', R(33, 16) && R(30, 4));
R = reach('main2_3f', [5, 5]);
check('2장 3층: 음악실·과학실·화장실 도달, 음악준비실·과학준비실 불가', R(14, 3) && R(10, 14) && R(21, 15) && !R(27, 3) && !R(34, 4));
R = reach('main2_4f', [2, 5]);
check('2장 4층: 휴게 공간·화장실 도달, 미술실·생물실·1학년 교실 불가', R(6, 15) && R(17, 15) && !R(15, 4) && !R(34, 4) && !R(28, 15));
check('2장 4층: 5층 계단은 쇠창살로 막힘', !R(1, 2) && R(4, 2));
R = reach('main2_4f', [2, 5], {}, ['9,8', '20,8']);
check('미술실 열쇠로 미술실 도달, 미술준비실은 아기를 달래기 전엔 불가', R(15, 4) && !R(26, 3));
R = reach('main2_4f', [2, 5], {}, ['9,8', '20,8', '23,3']);
check('아기를 달래면 미술준비실 도달', R(27, 2));
// ---------------- 3장(신관)
R = reach('shingwan_1f', [35, 16]);
check('3장 1층: 로비에서 복도·역사관·이사장실·매점·화장실 도달', R(20, 10) && R(10, 5) && R(18, 2) && R(6, 14) && R(12, 15));
check('3장 1층 잠김: 무용실(노란 카드)·음악감상실(소형 열쇠) 도달 불가, 아래층 셔터', !R(30, 4) && !R(18, 15) && !R(4, 2));
R = reach('shingwan_1f', [35, 16], {}, ['31,8', '20,13']);
check('노란 카드·노란 소형 열쇠로 무용실·음악감상실 도달', R(30, 4) && R(18, 15));
R = reach('shingwan_2f', [3, 5]);
check('3장 2층: 어학실·진로상담실·휴게실·보건실·화장실 도달, 水 결계문 너머 불가', R(10, 4) && R(17, 2) && R(28, 4) && R(13, 15) && R(36, 15) && !R(4, 13));
R = reach('shingwan_3f', [3, 5]);
check('3장 3층: 빨간 카드 없으면 위층 계단 셔터로 막힘, 교실·복도 도달, 전기실 불가', !R(1, 2) && R(4, 2) && R(9, 4) && R(50, 15) && R(25, 16) && !R(26, 3));
R = reach('shingwan_3f', [3, 5], {}, ['25,7'], ['card_red']);
check('빨간 카드로 위층 계단, 전기실 열쇠로 전기실 도달', R(1, 2) && R(26, 3));
check('3층 중앙홀은 뚫려 있어 건널 수 없음(난간)', !R(25, 10) && R(23, 10) && R(29, 10));
R = reach('shingwan_4f', [3, 5]);
check('3장 4층: 열람실·도서관1·2·컴퓨터실·자료실·차단기실 도달, 서고·오컬트부·옥상 계단 불가', R(10, 4) && R(19, 3) && R(28, 3) && R(5, 15) && R(12, 16) && R(27, 15) && !R(36, 3) && !R(18, 15) && !R(1, 2));
R = reach('shingwan_4f', [3, 5], {}, ['32,4', '20,13'], ['key_roof']);
check('서고 열쇠·파란 카드·옥상 열쇠로 서고·오컬트부·옥상 계단 도달', R(36, 3) && R(18, 15) && R(1, 2));
R = reach('shingwan_roof', [3, 14]);
check('옥상: 계단참에서 수영장 건너편 데크·밸브 손잡이 칸까지 이어짐(물에 들어가면 수맥 규칙)', R(20, 3) && R(5, 14) && R(14, 8));
// 장별 데이터를 합칠 때 같은 이름이 있으면 뒤 장이 앞 장 것을 조용히 덮어쓴다(3장 카드 복사기가 1장 기록실 복사기를 덮었던 문제)
const chs = await Promise.all([1, 2, 3].map(n => import(`../data/chapter${n}.js`)));
for (const k of ['items', 'docs', 'maps', 'scripts', 'onEnter']) {
  const seen = {};
  chs.forEach((c, i) => Object.keys(c[k] || {}).forEach(x => (seen[x] = seen[x] || []).push(i + 1)));
  const dup = Object.entries(seen).filter(([, v]) => v.length > 1).map(([x, v]) => `${x}(${v.join('·')}장)`);
  check(`장별 ${k} 이름 겹침 없음${dup.length ? ' — ' + dup.join(', ') : ''}`, !dup.length);
}
// 모든 '조사' 이벤트: 실제 조사 판정과 같은 방식으로 검사한다.
// 도달 가능한 칸 중앙에 서서 4방향을 바라볼 때, 탐침(0.6·0.9칸 앞)에 걸리는 첫 조사 대상이 그 이벤트인 위치가 있어야 한다.
// 조건식(cond)은 진행 상태 몇 가지(빈 상태 / 모두 참 / 중간 진행)로 평가한다.
const DONE = new Set(['safe1Looted', 'safe2Looted', 'plant1', 'plant2', 'plant3', 'treeDead', 'soyoungMet', 'hangingDone', 'workshopUnlocked', 'shutterOpen', 'keyCabOpen', 'alarmOff', 'copierRead', 'grateCut']);
const ALLT = new Proxy({}, { get: () => true });
const MID = new Proxy({}, { get: (_, k) => !DONE.has(k) && !String(k).startsWith('ev:') });
const starts = { main1f: [[14, 17], [1, 1]], main2f: [[39, 6]], vent: [[7, 12]], main2_1f: [[34, 17]], main2_2f: [[5, 5]], main2_3f: [[5, 5]], main2_4f: [[2, 5]],
  shingwan_1f: [[35, 16]], shingwan_2f: [[3, 5]], shingwan_3f: [[3, 5]], shingwan_4f: [[3, 5]], shingwan_roof: [[3, 14]] };
const DIRV = [[0, 1], [0, -1], [-1, 0], [1, 0]];
for (const [m, def] of Object.entries(story.maps)) {
  const allDoors = (def.doors || []).map(d => `${d.x},${d.y}`);
  const acts = (def.events || []).filter(e => e.on === 'act');
  const ok = new Set();
  for (const [flags, own] of [[{}, true], [ALLT, true], [MID, true], [{}, false], [{ mirrorRound: 1 }, true]]) { // own=false: 아이템이 없을 때만 나오는 조사 지점(2장 라이터) / mirrorRound: 3장 거울 스피커
    const st = { flags, has: () => own, doorState: () => ({ open: true, locked: null }) };
    const w = new World(def, st);
    const Rs = starts[m].map(p => reach(m, p, flags, allDoors));
    for (let r = 0; r < w.rows; r++) for (let c = 0; c < w.cols; c++) {
      if (!Rs.some(R => R(c, r)) || w.isSolid(c, r)) continue;
      const g = { flags, has: () => own, player: { x: c + 0.5, y: r + 0.5 } };
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
