// 사용자 설정(이 기기에 저장, 저장 슬롯과 별개)
//   controls: 조작 방식 'pad'(버추얼 패드: 조이스틱 + 화면 버튼) | 'touch'(버튼 없음: 드래그 이동·탭 조사·더블 탭 지도·트리플 탭 라이터·길게 누르기 휴대폰)
//   guide: 공략 — 켜면 지도에 다음 목적지·필요한 아이템·퍼즐 답 표시 (data/story.js guide)
//   infiniteSave: 무한 세이브 — 켜면 사인펜 없이 저장(줄지 않음) + 휴대폰 '저장' 앱으로 어디서든(제한시간 중엔 불가)
//   zoomOut: 화면 축소 1(기본, 짧은 변 9칸)·2·4·6 — 한 화면에 그 배수만큼 넓게 / zoomIn: 화면 확대 1·2·3·4·5·6 — 그 배수만큼 크게
//     (둘 중 하나만: 한쪽을 켜면 다른 쪽은 1배로)
//   filter: 그래픽 필터(js/filters.js FILTERS의 id, 'off' = 끄기)
const KEY = 'wd_topview_settings_v1';
export const settings = { controls: 'pad', guide: false, zoomOut: 1, zoomIn: 1, infiniteSave: false, filter: 'off' };
export const ZOOMS = [1, 2, 4, 6];
export const ZOOMS_IN = [1, 2, 3, 4, 5, 6];
try { Object.assign(settings, JSON.parse(localStorage.getItem(KEY)) || {}); } catch {}
delete settings.autoRun; // 예전 '자동 달리기' 설정(삭제됨: 이제 조이스틱을 끝까지 밀면 달리기)
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
}
