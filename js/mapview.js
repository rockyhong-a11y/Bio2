// 전체 지도: 맵 그리드의 바닥 칸을 벽·문으로 나눈 '방'(4방향으로 이어진 바닥) 단위로 탐색 여부를 기록하고 그린다.
//   탐색한 방 = 밝게, 미탐색 = 어둡게, 잠긴(막힌) 문 = 빨간 선. 화면(목록·현재 위치 점)은 ui.openMap
//   탐색 기록은 flags['seen:<맵>:<방 번호>'] → 저장 슬롯에 함께 저장된다.
const NOT_ROOM = new Set(['#', 'W', 'w', 'D', ' ', 'O']); // O = 뚫린 중앙홀(지나갈 수 없음)
const WALLS = new Set(['#', 'W', 'w']);
export const MAP_COLORS = { lit: '#c3cad3', dark: '#26262d', locked: '#ff2b2b' };
const S = 24; // 칸당 캔버스 픽셀(화면에서는 폭에 맞춰 축소)

const cache = new Map();
export function rooms(def) {
  if (cache.has(def.id)) return cache.get(def.id);
  const rows = def.grid.length, cols = Math.max(...def.grid.map(r => r.length));
  const ch = (c, r) => def.grid[r]?.[c] ?? ' ';
  const id = new Int16Array(cols * rows).fill(-1);
  let count = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (NOT_ROOM.has(ch(c, r)) || id[r * cols + c] >= 0) continue;
    id[r * cols + c] = count;
    const stack = [[c, r]];
    while (stack.length) {
      const [x, y] = stack.pop();
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (NOT_ROOM.has(ch(nx, ny)) || id[ny * cols + nx] >= 0) continue;
        id[ny * cols + nx] = count;
        stack.push([nx, ny]);
      }
    }
    count++;
  }
  const R = { cols, rows, id, count, ch };
  cache.set(def.id, R);
  return R;
}

const key = (mapId, n) => `seen:${mapId}:${n}`;

// 매 프레임: 플레이어가 서 있는 방을 탐색함으로 기록
export function markSeen(g) {
  const R = rooms(g.world.def);
  const n = R.id[Math.floor(g.player.y) * R.cols + Math.floor(g.player.x)];
  if (n >= 0) g.flags[key(g.mapId, n)] = true;
}

export const explored = (g, def) => Object.keys(g.flags).some(k => k.startsWith(`seen:${def.id}:`));

export function drawMap(cv, g, def) {
  const R = rooms(def), e = S * 0.35;
  cv.width = R.cols * S;
  cv.height = R.rows * S;
  const x = cv.getContext('2d');
  const seen = (c, r) => { const n = R.id[r * R.cols + c]; return n >= 0 && !!g.flags[key(def.id, n)]; };
  // 방: 칸을 벽 쪽으로 조금씩 넓혀 칠해 벽은 얇은 틈으로 보이게
  for (let r = 0; r < R.rows; r++) for (let c = 0; c < R.cols; c++) {
    if (R.id[r * R.cols + c] < 0) continue;
    x.fillStyle = seen(c, r) ? MAP_COLORS.lit : MAP_COLORS.dark;
    x.fillRect(c * S - e, r * S - e, S + 2 * e, S + 2 * e);
  }
  // 문: 지나갈 수 있으면 양쪽 방을 잇고(한쪽이라도 탐색했으면 밝게), 잠겨 있으면 벽 방향으로 빨간 선
  const locked = [];
  for (const d of def.doors || []) {
    const st = def.id === g.mapId ? g.world.door(d.x, d.y) : g.doorState(def.id, d);
    const vertical = WALLS.has(R.ch(d.x, d.y - 1)) && WALLS.has(R.ch(d.x, d.y + 1)); // 위아래가 벽 = 세로 벽의 문
    if (st.locked) { locked.push([d, vertical]); continue; }
    const lit = vertical ? seen(d.x - 1, d.y) || seen(d.x + 1, d.y) : seen(d.x, d.y - 1) || seen(d.x, d.y + 1);
    x.fillStyle = lit ? MAP_COLORS.lit : MAP_COLORS.dark;
    x.fillRect(d.x * S, d.y * S, S, S);
  }
  x.strokeStyle = MAP_COLORS.locked;
  x.lineWidth = S * 0.5;
  for (const [d, vertical] of locked) {
    x.beginPath();
    if (vertical) { x.moveTo((d.x + 0.5) * S, d.y * S); x.lineTo((d.x + 0.5) * S, (d.y + 1) * S); }
    else { x.moveTo(d.x * S, (d.y + 0.5) * S); x.lineTo((d.x + 1) * S, (d.y + 0.5) * S); }
    x.stroke();
  }
}
