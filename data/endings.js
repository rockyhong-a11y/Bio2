// 엔딩 8종(바이블 6장, 확장 유지민 루트 제외). 꽃 이름·꽃말 카드 + 짧은 에필로그(모두 새로 쓴 글) + 엔딩 CG.
// 본 엔딩은 이 기기에 기록(타이틀 → 엔딩 수집). 사망(주목)은 게임오버 화면에서 기록한다.
export const ENDINGS = [
  { id: 'chrysanthemum', name: '하얀 국화', en: 'White Chrysanthemum', mean: '진실', who: '소영', cg: 'end_white_chrysanthemum',
    text: ['새벽빛이 운동장을 물들였다. 쓰러져 있던 소영이 희민의 부축을 받고 천천히 일어섰다.',
      '사탕 상자를 건네자, 소영은 학교를 돌아보며 작게 언니를 불렀다.',
      '「…고마워. 오늘 밤은 평생 잊지 못할 거야.」 소영은 사탕 하나를 희민의 손에 되돌려 놓았다.',
      '「지현이 찾으러 가자. …성아도, 혼자서 많이 외로웠을 거야.」'] },
  { id: 'ivy', name: '아이비', en: 'Ivy', mean: '우정', who: '소영', cg: 'end_ivy',
    text: ['소영은 학교 입구에서 눈을 떴다. 「…고마워.」 그 한마디뿐이었다.',
      '소영은 지현을 찾으러 먼저 걸어갔다. 담벼락의 담쟁이가 새벽바람에 흔들렸다.',
      '희민의 주머니 속 사탕 상자는 끝내 꺼내지지 않았다.'] },
  { id: 'hyacinth', name: '히아신스', en: 'Hyacinth', mean: '나를 용서해 줘', who: '소영', cg: 'end_hyacinth',
    text: ['희민은 학교 뒤뜰에서 혼자 눈을 떴다. 손이 비어 있었다.',
      '어두운 창 너머에서 검은 그림자가 이쪽을 노려보고 있었다. 그림자가 움직였다.',
      '희민은 선물 상자를 떨어뜨린 채 교문 밖으로 달렸다. 뒤를 돌아보지 못했다.'] },
  { id: 'tuberose', name: '튜베로즈', en: 'Tuberose', mean: '위험한 쾌락', who: '성아', cg: 'end_tuberose',
    text: ['성아가 희민의 손을 잡고 교문을 나섰다. 아침 햇살이 둘을 비췄다.',
      '어딘가에서 들려 준 누군가의 목소리 덕분일까. 성아는 처음으로 웃는 법을 떠올린 얼굴이었다.',
      '…창 안에서 누군가 유리를 두드리고 있었다. 「도와줘…!」 희민의 눈에는 빈 창문뿐이었다.',
      '성아가 돌아보며, 아주 조금 웃었다.'] },
  { id: 'ebony', name: '흑단목', en: 'Ebony', mean: '위선', who: '성아', cg: 'end_ebony',
    text: ['교문을 나서는 사람은 분명 소영의 얼굴이었다.',
      '그런데 웃는 입꼬리가, 눈빛이— 희민만은 알아볼 수 있었다. 저건 성아의 미소다.',
      '등 뒤 창문 안에서, 진짜 소영의 하얀 손이 몇 번이고 유리를 두드렸다.'] },
  { id: 'dandelion', name: '민들레', en: 'Dandelion', mean: '행복', who: '지현', cg: 'end_dandelion',
    text: ['붕대를 감아 주자 지현의 발목 언저리에서 반딧불 같은 초록빛이 피어올랐다.',
      '지현은 희민의 어깨에 가만히 기댔다. 희민은 사탕 상자를 지현에게 내밀었다.',
      '「…나한테? 고마워.」 지현이 웃었다. 강당 밖은 아직, 밤이었다.'] },
  { id: 'althea', name: '접시꽃', en: 'Althea', mean: '열렬한 사랑', who: '지현', cg: 'end_althea',
    text: ['붕대를 감았지만 지현의 다리는 차갑게 식어 갈 뿐이었다.',
      '어둠 속에서 성아가 나타나 지현의 손을 잡았다. 성아는 희민을 똑바로 노려보았다.',
      '두 사람은 어둠 속으로 사라졌다. 아무것도, 끝나지 않았다.'] },
  { id: 'yew', name: '주목', en: 'Yew', mean: '죽음', who: '희민', cg: 'end_yew',
    text: ['희민의 화이트데이는 여기서 끝났다.'] },
];
const KEY = 'wd_topview_endings_v1';
export function seenEndings() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
export function recordEnding(id) {
  const s = seenEndings();
  if (!s.includes(id)) { s.push(id); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }
}
export const endingOf = id => ENDINGS.find(e => e.id === id);
