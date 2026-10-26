// 사용자 설정(이 기기에 저장, 저장 슬롯과 별개)
//   controls: 조작 방식 'pad'(버추얼 패드: 조이스틱 + 화면 버튼) | 'touch'(버튼 없음: 드래그 이동·탭 조사·더블 탭 지도·트리플 탭 라이터·길게 누르기 휴대폰)
//   guide: 공략 — 켜면 지도에 다음 목적지·필요한 아이템·퍼즐 답 표시 (data/story.js guide)
//   infiniteSave: 무한 세이브 — 켜면 사인펜 없이 저장(줄지 않음) + 휴대폰 '저장' 앱으로 어디서든(제한시간 중엔 불가)
//   zoomIn: 화면 확대 1배(기본, 짧은 변 9칸)~6배를 0.2배 단위로 — 그 배수만큼 크게(보이는 범위는 그만큼 좁게)
//   filter: 그래픽 필터(js/filters.js FILTERS의 id, 'off' = 끄기)
//   bright: 밝기 0~4 (BRIGHTS 번호). 어두운 화면이 안 보이는 기기·밝은 곳에서 올린다 — 암부와 비네트만 바뀌고 게임 규칙은 그대로
const KEY = 'wd_topview_settings_v1';
export const settings = { controls: 'pad', guide: false, zoomIn: 1, infiniteSave: false, filter: 'off', bright: 2 };
export const BRIGHTS = [{ k: 0.8, name: '어둡게' }, { k: 0.9, name: '조금 어둡게' }, { k: 1, name: '기본' }, { k: 1.18, name: '조금 밝게' }, { k: 1.4, name: '밝게' }];
export const ZOOMS_IN = Array.from({ length: 26 }, (_, i) => Math.round((1 + i * 0.2) * 10) / 10); // 1 ~ 6배, 0.2배 단위
try { Object.assign(settings, JSON.parse(localStorage.getItem(KEY)) || {}); } catch {}
delete settings.autoRun; // 예전 '자동 달리기' 설정(삭제됨: 이제 조이스틱을 끝까지 밀면 달리기)
delete settings.zoomOut; // 예전 '화면 축소' 설정(삭제됨: 화면 확대만 쓴다)
if (!ZOOMS_IN.includes(settings.zoomIn)) settings.zoomIn = 1;
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
}
