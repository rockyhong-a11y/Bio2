// 이야기 전체: 1장(본관 1구역) + 2장(본관 2구역). 게임·UI·테스트는 이 모듈만 본다.
// 아이템·문서·맵·스크립트는 장별 파일을 합치고, 공략은 1장을 마치면(ch1Clear) 2장 공략으로 넘어간다.
import * as ch1 from './chapter1.js';
import * as ch2 from './chapter2.js';

export const { saveCost, headGhost, speakers, narrator, newGame } = ch1;
export const items = { ...ch1.items, ...ch2.items };
export const docs = { ...ch1.docs, ...ch2.docs };
export const maps = { ...ch1.maps, ...ch2.maps };
export const scripts = { ...ch1.scripts, ...ch2.scripts };
export const onEnter = { ...ch1.onEnter, ...ch2.onEnter };
export const guide = g => (g.flags.ch1Clear ? ch2.guide(g) : ch1.guide(g));
