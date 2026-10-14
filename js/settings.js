// 사용자 설정(이 기기에 저장, 저장 슬롯과 별개)
//   autoRun: 자동 달리기 — 켜면 기본이 달리기, 달리기 버튼(화면 버튼·Shift·패드 B)을 누르는 동안은 걷기
const KEY = 'wd_topview_settings_v1';
export const settings = { autoRun: false };
try { Object.assign(settings, JSON.parse(localStorage.getItem(KEY)) || {}); } catch {}
export function saveSettings() {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {}
}
// 달리기 버튼·버튼 안내에 쓰는 이름 (자동 달리기면 누르는 동안 걷기)
export const runWord = () => (settings.autoRun ? '걷기' : '달리기');
