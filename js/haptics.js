// 진동(항상 켜짐): 휴대폰 진동(Vibration API — 안드로이드 크롬 등) + 게임패드 진동(Gamepad vibrationActuator / hapticActuators).
// 아이폰 사파리는 Vibration API가 없어서, iOS 18 이상의 '스위치' 체크박스를 누를 때 나는 시스템 햅틱을 한 번 울리는 방식을 쓴다
// (패턴 없이 짧게 한 번, 화면을 누른 동작에서만 확실히 울린다).
//   kind: 'hit' 맞음 · 'scare' 깜짝 놀람(스팅어·게임오버) · 'spot' 수위에게 발각 · 'heavy' 큰 충격(천둥·지진·가마) · 'thud' 쿵
//         'tap' 연타 한 번 · 'light' 가벼운 알림(잠김·획득) · 'beat' 심장 박동
const PATTERN = {
  hit: [90, 40, 140], scare: [60, 40, 60, 40, 240], spot: [40, 70, 40], heavy: [220], thud: [70],
  tap: [14], light: [22], beat: [30],
};
// 게임패드: [길이 ms, 강한 모터, 약한 모터]
const RUMBLE = {
  hit: [220, 0.9, 0.6], scare: [500, 0.7, 1], spot: [180, 0.4, 0.8], heavy: [350, 1, 0.4], thud: [120, 0.7, 0.3],
  tap: [40, 0, 0.6], light: [60, 0, 0.4], beat: [70, 0.35, 0],
};
// 우선순위: 진동 API는 새 진동이 울리던 진동을 끊으므로, 울리는 중에는 더 약한(낮은) 진동이 끊지 못하게 한다
//   (추격 중 심장 박동이 발각·맞음 진동을, 목매단 귀신의 쿵이 깜짝 진동을 끊던 문제)
const PRI = { beat: 0, tap: 1, light: 1, thud: 2, spot: 2, heavy: 2, hit: 3, scare: 4 };
let busyUntil = 0, busyPri = -1;
// 효과음 이름 → 진동 (audio.js가 소리를 낼 때 함께 — 소리를 꺼도 진동은 그대로)
export const SFX_HAPTIC = {
  hit: 'hit', stinger: 'scare', whistle: 'spot', thunder: 'heavy', rumble: 'heavy', burst: 'heavy', piano: 'heavy', kiln: 'thud',
  thud: 'thud', headbell: 'spot', locked: 'light', unlock: 'light', coin: 'light', phone: 'light', baby: 'light',
};

const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let iosSwitch = null;
function iosTick() {
  if (!iosSwitch) {
    iosSwitch = document.createElement('label');
    iosSwitch.setAttribute('aria-hidden', 'true');
    iosSwitch.style.display = 'none';
    const sw = document.createElement('input');
    sw.type = 'checkbox';
    sw.setAttribute('switch', '');
    iosSwitch.appendChild(sw);
    document.body.appendChild(iosSwitch);
  }
  iosSwitch.click();
}

export const haptics = { log: [] }; // log: 최근 진동 기록(QA 확인용, 최대 30개)

export function haptic(kind) {
  const p = PATTERN[kind];
  if (!p) return;
  const now = performance.now(), [ms, strong, weak] = RUMBLE[kind];
  if (now < busyUntil && PRI[kind] < busyPri) return;
  busyUntil = now + Math.max(p.reduce((a, b) => a + b, 0), ms);
  busyPri = PRI[kind];
  haptics.log.push(kind);
  if (haptics.log.length > 30) haptics.log.shift();
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(p);
    else if (isIOS) iosTick();
  } catch {}
  for (const gp of navigator.getGamepads?.() || []) {
    if (!gp?.connected) continue;
    try {
      if (gp.vibrationActuator?.playEffect) gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch?.(() => {});
      else gp.hapticActuators?.[0]?.pulse?.(Math.max(strong, weak), ms);
    } catch {}
  }
}
