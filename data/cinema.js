// 복셀 연출 목록 — 갤러리에서 다시 보기 위한 '그 순간'의 재현 정보.
// 게임 중에는 s.cinema(true, 샷, [대상]) 이 지금 월드를 그대로 복셀로 세우므로 이 표가 필요 없다.
// 갤러리는 게임을 시작하지 않고 맵과 인물만 세워 같은 화면을 보여 주려고 이 표를 쓴다.
//   map  = 맵 id (data/story.js maps)
//   me   = 플레이어 [칸x, 칸y, 방향]
//   cast = 같이 서 있는 인물 [{ skin, x, y, dir, sprite? }]
//   shot = js/voxel.js PRESETS 이름, at = 카메라가 볼 자리를 직접 줄 때 [칸x, 칸y, 높이?]
// 좌표는 각 장 스크립트의 spawn/warp 값에서 그대로 가져왔다.
export const CINEMA = [
  { id: 'ch1_prologue', ch: 1, name: '잠긴 현관', map: 'main1f', shot: 'wide',
    me: [14.5, 17.4, 'up'], cast: [] },
  { id: 'ch1_meet', ch: 1, name: '성아와 지현', map: 'main1f', shot: 'push',
    me: [16.5, 10.5, 'left'], cast: [
      { skin: 'seonga', x: 14.2, y: 10.2, dir: 'right' },
      { skin: 'jihyeon', x: 13.2, y: 10.9, dir: 'right' },
    ] },
  { id: 'ch1_chase', ch: 1, name: '수위 이봉구', map: 'main1f', shot: 'loom',
    me: [32.5, 10.5, 'right'], cast: [{ skin: 'janitor', x: 37.5, y: 10.2, dir: 'left' }] },
  { id: 'ch1_rescue', ch: 1, name: '문 밑의 손전등', map: 'main1f', shot: 'low',
    me: [31.5, 6.4, 'down'], cast: [{ skin: 'jihyeon', x: 31.5, y: 5.6, dir: 'down' }] },
  { id: 'ch1_hanging', ch: 1, name: '기어 오는 것', map: 'main1f', shot: 'low',
    me: [43, 17.2, 'right'], cast: [{ skin: 'naying', x: 44.6, y: 17, dir: 'left' }] },
  { id: 'ch1_tree', ch: 1, name: '소영을 끌고 가는 뿌리', map: 'main2f', shot: 'over',
    me: [23.5, 5.5, 'left'], cast: [{ skin: 'soyoung', x: 21.5, y: 6.6, dir: 'right' }] },
  { id: 'ch1_saved', ch: 1, name: '뿌리 사이의 소영', map: 'main2f', shot: 'push',
    me: [23.5, 6.4, 'up'], cast: [{ skin: 'soyoung', x: 23.5, y: 4.5, dir: 'down' }] },
  { id: 'ch1_broadcast', ch: 1, name: '녹음실 유리창 너머', map: 'main2f', shot: 'dutch', at: [6.5, 5.2],
    me: [6.5, 6.6, 'up'], cast: [
      { skin: 'seonga', x: 6.5, y: 5.2, dir: 'down' },
      { skin: 'naying', sprite: 'naying_hang', x: 3.5, y: 2.6, dir: 'down' },
    ] },
  { id: 'ch1_seal', ch: 1, name: '木의 결계문', map: 'main1f', shot: 'low', at: [44.5, 8.6, 0.8],
    me: [44.5, 9.8, 'up'], cast: [{ skin: 'soyoung', x: 42.5, y: 9.9, dir: 'right' }] },
];
