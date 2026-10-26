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
  { id: 'ch2_open', ch: 2, name: '본관 2구역 로비', map: 'main2_1f', shot: 'wide',
    me: [34.5, 17.2, 'up'], cast: [{ skin: 'soyoung', x: 33.4, y: 17.6, dir: 'up' }] },
  { id: 'ch2_caught', ch: 2, name: '교장실에 들이닥친 수위', map: 'main2_1f', shot: 'loom',
    me: [26, 3.4, 'down'], cast: [{ skin: 'janitor', x: 26.5, y: 8.4, dir: 'up' }] },
  { id: 'ch2_cctv', ch: 2, name: '책장 뒤 모니터', map: 'main2_1f', shot: 'push', at: [22.5, 1.6, 1.1],
    me: [22.6, 2.6, 'up'], cast: [{ skin: 'jihyeon', x: 26.5, y: 9.6, dir: 'down' }] },
  { id: 'ch2_stairs', ch: 2, name: '계단참의 소영', map: 'main2_2f', shot: 'arc',
    me: [3.5, 6.4, 'up'], cast: [{ skin: 'soyoung', x: 3.5, y: 5.2, dir: 'down' }] },
  { id: 'ch2_faint', ch: 2, name: '쓰러진 지현', map: 'main2_2f', shot: 'over',
    me: [28.5, 6.2, 'up'], cast: [{ skin: 'jihyeon', sprite: 'jihyeon_faint', x: 28.5, y: 4.6, dir: 'down' }] },
  { id: 'ch2_cassette', ch: 2, name: '멈춘 카세트', map: 'main2_2f', shot: 'close', at: [28.5, 4.6, 0.9],
    me: [30.5, 3.4, 'down'], cast: [{ skin: 'jihyeon', x: 28.5, y: 4.6, dir: 'up' }] },
  { id: 'ch2_piano', ch: 2, name: '피아노 앞의 것', map: 'main2_3f', shot: 'loom',
    me: [10.5, 7.6, 'down'], cast: [{ skin: 'ghost', sprite: 'piano_ghost', x: 13.5, y: 2.7, dir: 'down' }] },
  { id: 'ch2_flashback', ch: 2, name: '1998년의 회상', map: 'main2_3f', shot: 'dutch',
    me: [25.5, 5.8, 'up'], cast: [{ skin: 'soyoung', x: 24.4, y: 5.4, dir: 'right' }] },
  { id: 'ch2_baby_death', ch: 2, name: '고개를 드는 아기', map: 'main2_4f', shot: 'low',
    me: [8.5, 3.4, 'up'], cast: [{ skin: 'ghost', sprite: 'baby_ghost', x: 8, y: 2.3, dir: 'down' }] },
  { id: 'ch2_baby_give', ch: 2, name: '저절로 열리는 문', map: 'main2_4f', shot: 'push', at: [23.5, 3.6, 0.9],
    me: [21.5, 4.4, 'right'], cast: [] },
  { id: 'ch2_seal', ch: 2, name: '土의 결계문', map: 'main2_2f', shot: 'low', at: [36.5, 8.6, 0.8],
    me: [36.5, 9.8, 'up'], cast: [{ skin: 'soyoung', x: 35.1, y: 10.2, dir: 'right' }] },
];
