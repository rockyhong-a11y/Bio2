// 이야기 전체: 1장(본관 1구역) + 2장(본관 2구역) + 3장(신관) + 4장(강당) + 5장(미궁, B 루트)·엔딩. 게임·UI·테스트는 이 모듈만 본다.
// 아이템·문서·맵·스크립트는 장별 파일을 합치고, 공략은 장을 마칠 때마다(ch1Clear·ch2Clear·ch3Clear) 다음 장 공략으로 넘어간다.
import * as ch1 from './chapter1.js';
import * as ch2 from './chapter2.js';
import * as ch3 from './chapter3.js';
import * as ch4 from './chapter4.js';
import * as ch5 from './chapter5.js';

export const { saveCost, headGhost, speakers, narrator, newGame } = ch1;
export const items = { ...ch1.items, ...ch2.items, ...ch3.items, ...ch4.items, ...ch5.items };
export const docs = { ...ch1.docs, ...ch2.docs, ...ch3.docs, ...ch4.docs, ...ch5.docs };
export const maps = { ...ch1.maps, ...ch2.maps, ...ch3.maps, ...ch4.maps, ...ch5.maps };
export const scripts = { ...ch1.scripts, ...ch2.scripts, ...ch3.scripts, ...ch4.scripts, ...ch5.scripts };
export const onEnter = { ...ch1.onEnter, ...ch2.onEnter, ...ch3.onEnter, ...ch4.onEnter, ...ch5.onEnter };
export const guide = g => (g.flags.sealFire ? ch5.guide(g) : g.flags.ch3Clear ? ch4.guide(g) : g.flags.ch2Clear ? ch3.guide(g) : g.flags.ch1Clear ? ch2.guide(g) : ch1.guide(g));

// 타이틀 → 챕터 선택. ready=false = 아직 없는 장(딤드, 누를 수 없음). routes가 있으면 루트를 고른 뒤 시작
export const chapters = [
  { n: 1, title: '본관 1구역', seal: '木', ready: true },
  { n: 2, title: '본관 2구역', seal: '土', ready: true, routes: [['B', '소영 루트'], ['A', '성아·지현 루트']] },
  { n: 3, title: '신관', seal: '水', ready: true, routes: [['B', '소영 루트'], ['A', '성아·지현 루트']] },
  { n: 4, title: '강당', seal: '火', ready: true, routes: [['B', '소영 루트'], ['A', '성아·지현 루트']] },
  { n: 5, title: '미궁 · 소영 루트', seal: '五行', ready: true },
];
// 타이틀 → 갤러리: 모든 컷신(장 순서). 엔딩은 data/endings.js
export const cutscenes = [
  [1, 'cg_prologue', '오프닝'], [1, 'cg_sigil_metal', '金의 문양'], [1, 'cg_janitor', '수위'], [1, 'cg_hanging', '목매단 귀신'], [1, 'cg_tree', '귀목'], [1, 'cg_recording', '녹음실'], [1, 'cg_seal', '木 결계문'],
  [2, 'cg_cctv', 'CCTV'], [2, 'cg_piano', '피아노'], [2, 'cg_flashback', '회상'], [2, 'cg_baby', '아기 귀신'], [2, 'cg_earth', '土 결계문'],
  [3, 'cg_mannequin', '마네킹'], [3, 'cg_mirror', '거울 속 희민'], [3, 'cg_mermaid', '수영장 인어'], [3, 'cg_water', '水 결계문'], [3, 'cg_eunmi', '은미'], [3, 'cg_fall', '난간 추락'],
  [4, 'cg_stage', '무대'], [4, 'cg_fire', '화재'], [5, 'cg_maze', '미궁'],
];
export function startChapter(g, n, route) {
  if (n === 1) return ch1.newGame(g);
  if (n === 2) return ch2.newGame(g, route);
  if (n === 3) return ch3.newGame(g, route);
  if (n === 4) return ch4.newGame(g, route);
  if (n === 5) return ch5.newGame(g);
}
