"""도트 소품·데칼 생성기(원작 반영 오브젝트와 배경 디테일) → assets/sprites/props_pixel/ + props_pixel.json
사용: python3 tools/pixel_props.py [--preview 파일.png]
  - 벽걸이(wall): 벽 칸 앞면(높이 32px)에 붙는다 — 앵커는 칸 아래 선 기준
  - 바닥 소품(floor): 칸 아래쪽에 선다 / 데칼(decal): 바닥·벽에 겹쳐 그리는 얼룩·종이·금(외곽선 없음)
  - blackboard_kr: 도트화한 칠판 위에 태극기 액자를 얹은 교실 앞 칠판(원작 교실 분위기)"""
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'sprites' / 'props_pixel'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_chars import grid, paint, outline  # noqa: E402

PAL = {
    'K': (20, 18, 22), 'k': (58, 56, 62), 'W': (236, 234, 226), 'w': (196, 194, 186), 'T': (170, 172, 176), 't': (124, 126, 132),
    'G': (92, 124, 108), 'g': (62, 88, 76), 'D': (168, 204, 170), 'd': (120, 150, 124),
    'R': (186, 40, 44), 'r': (126, 26, 30), 'B': (44, 70, 160), 'Y': (220, 184, 74), 'y': (150, 120, 44),
    'N': (126, 84, 52), 'n': (86, 56, 34), 'M': (164, 118, 78), 'L': (122, 184, 110), 'l': (70, 120, 64),
    'S': (150, 156, 162), 's': (104, 108, 116), 'A': (210, 206, 192), 'a': (160, 154, 140),
    'P': (214, 170, 160), 'p': (170, 110, 104), 'C': (130, 170, 210), 'c': (82, 116, 150),
    'O': (66, 60, 52, 150), 'o': (40, 36, 30, 110), 'Q': (232, 226, 206, 220), 'q': (200, 192, 170, 200), 'X': (24, 20, 18, 170),
}

SPRITES = {}  # 키 → (격자, 종류, 옵션)


def sprite(key, kind, g, **opt):
    SPRITES[key] = (grid(g), kind, opt)


# ---------------------------------------------------------------- 벽걸이
sprite('payphone', 'wall', '''
.GGGGGGGGGG.
GgggggggggGg
GgDDDDDDDgGg
GgDdddddDgGg
GgggggggggGg
GgKKKKKKkgGg
GgKkkkkKKgGg
GgggggggggGg
GggTTgTTggGg
GggTTgTTggGg
GggTTgTTggGg
GgYYYYggggGg
GgggggggggGg
.gGGGGGGGGg.
....Kk......
.....KK.....
''', top=28)
sprite('hydrant', 'wall', '''
RRRRRRRRRRRR
RrrrrrrrrrrR
RrWWWWWWWWrR
RrWRRWWRRWrR
RrWWWWWWWWrR
RrrrrrrrrrrR
RrTTTTTTTTrR
RrTsRRRRsTrR
RrTRRrrRRTrR
RrTsRRRRsTrR
RrTTTTTTTTrR
RrrrrrrrrrrR
RRRRRRRRRRRR
''', top=26)
sprite('map_board', 'wall', '''
NNNNNNNNNNNNNNNNNNNN
NAAAAAAAAAAAAAAAAAAN
NAKKKKKKKKKKKKKKKKAN
NAKAAAKAAAKAAAAAKKAN
NAKAAAKAAAKAAAAAKKAN
NAKKKKKKKKKKKKKKKKAN
NAKAAAAAAAAAAAARKKAN
NAKKKKKKKKKKKKKKKKAN
NAAAAAaaAAAAaaAAAAAN
NNNNNNNNNNNNNNNNNNNN
''', top=28)
sprite('exit_sign', 'wall', '''
LLLLLLLLLLLL
LWWWWWWWWWWL
LWlWWlllWWWL
LWllWlWlWlWL
LWlWWlllWlWL
LWWWWWWWWWWL
LLLLLLLLLLLL
''', top=31)
sprite('poster_0', 'wall', '''
WWWWWWWWW
WRRRRRRRW
WwwwwwwwW
WKwKKwKwW
WwwwwwwwW
WKKwKwKKW
WwwwwwwwW
WBBwwwBBW
WWWWWWWWW
''', top=27)
sprite('poster_1', 'wall', '''
QQQQQQQQ
QCCCCCCQ
QCccccCQ
QqqqqqqQ
QkqkkqkQ
QqqqqqqQ
QkkqkqkQ
QQQQQQQQ
''', top=26)
sprite('poster_2', 'wall', '''
YYYYYYYYYY
YWWWWWWWWY
YWKKWKKKWY
YWWWWWWWWY
YWRRRRRRWY
YWWWWWWWWY
YWkWkWkWWY
YYYYYYYYYY
''', top=27)
sprite('timetable', 'wall', '''
NNNNNNNNNNNN
NWWWWWWWWWWN
NWkWkWkWkWkN
NWWWWWWWWWWN
NWkWkWkWkWkN
NWWWWWWWWWWN
NWkWkWkWkWkN
NWWWWWWWWWWN
NNNNNNNNNNNN
''', top=27)
sprite('flag_frame', 'part', '''
nnnnnnnnnnnn
nWWWWWWWWWWn
nWKWWWWWWKWn
nWWWWRRWWWWn
nWWWRRBBWWWn
nWWWWBBWWWWn
nWKWWWWWWKWn
nWWWWWWWWWWn
nnnnnnnnnnnn
''')
sprite('motto_frame', 'part', '''
nnnnnnnnnnnnnnnn
nWWWWWWWWWWWWWWn
nWkkWkkWkkWkkWWn
nWWWWWWWWWWWWWWn
nnnnnnnnnnnnnnnn
''')

# ---------------------------------------------------------------- 바닥 소품
sprite('trash_can', 'floor', '''
.SSSSSSSS.
SsssssssSS
SSSSSSSSSS
SsSsSsSsSs
SsSsSsSsSs
SsSsSsSsSs
SsSsSsSsSs
SsSsSsSsSs
.ssssssss.
''')
sprite('umbrella_stand', 'floor', '''
..B.....R...
..B..C..R...
.BB..C..RR..
..B.CC..R...
..BB.C.RR...
.TTTTTTTTTT.
TtttttttttTT
TTTTTTTTTTTT
TtTtTtTtTtTT
TtTtTtTtTtTT
TtTtTtTtTtTT
.tttttttttt.
''')
sprite('sink', 'floor', '''
.....SS.........
.....Ss.........
.....sS.........
AAAAAAAAAAAAAAAA
AWWWWWWWWWWWWWWa
AWwwwwwwwwwwwwWa
AWwCcccccccccwWa
AWwwwwwwwwwwwwWa
AAAAAAAAAAAAAAAa
......Aaaa......
......Aaaa......
......Aaaa......
......aaaa......
''')
sprite('radiator', 'floor', '''
.SSSSSSSSSSSSSSSSSSSSSSSSSS.
SsSsSsSsSsSsSsSsSsSsSsSsSsSs
SsSsSsSsSsSsSsSsSsSsSsSsSsSs
SsSsSsSsSsSsSsSsSsSsSsSsSsSs
SsSsSsSsSsSsSsSsSsSsSsSsSsSs
SsSsSsSsSsSsSsSsSsSsSsSsSsSs
.ssssssssssssssssssssssssss.
..s.......................s.
''')
sprite('cleaning_box', 'floor', '''
GGGGGGGGGGGG
GggggggggggG
GgKKKKKKKKgG
GgggggggggGG
GgggggggYgGG
GgggggggggGG
GgggggggggGG
GgggggggggGG
GgggggggggGG
GGGGGGGGGGGG
''')

# ---------------------------------------------------------------- 데칼(외곽선 없음)
sprite('decal_stain_0', 'decal', '''
...OOOO.....
.OOOOOOOO...
OOOooOOOOO..
.OOOOOOooOO.
..OOOOOOOO..
....OOO.....
''')
sprite('decal_stain_1', 'decal', '''
..OO......
.OOOO.OO..
OOOOOOOOO.
.OOooOOO..
...OOO....
''')
sprite('decal_paper_0', 'decal', '''
QQQQQQ.
QqqqqQQ
QQQQQQQ
QqqqQQQ
.QQQQQQ
''')
sprite('decal_paper_1', 'decal', '''
..QQQQ.
.QqqQQQ
QQQQqqQ
QqQQQQ.
.QQQ...
''')
sprite('decal_crack_0', 'decal', '''
X.........
.X........
..XX......
....X.X...
.....X.XX.
........X.
''')
sprite('decal_crack_1', 'decal', '''
....X...
...X....
..XX....
..X.X...
.X...X..
X.....X.
''')
sprite('decal_leaves', 'decal', '''
.l......
lLl...L.
.l...lLl
......l.
''')
sprite('wall_crack', 'decal', '''
...X....
...X....
..XX....
..X.X...
.X...XX.
.X......
X.......
''')
sprite('wall_stain', 'decal', '''
.OOOOO..
OOOOOOO.
.OOOOOO.
..OOOOO.
..OOOO..
...OO...
...O....
''')


def render(key):
    g, kind, opt = SPRITES[key]
    w, h = len(g[0]), len(g)
    pad = 0 if kind == 'decal' else 1
    img = Image.new('RGBA', (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    for y, row in enumerate(g):
        for x, ch in enumerate(row):
            if ch != '.':
                c = PAL[ch]
                img.putpixel((x + pad, y + pad), c if len(c) == 4 else c + (255,))
    if kind != 'decal':
        img = outline(img)
    return img, kind, opt


def anchor(img, kind, opt):
    """2배 좌표 앵커. 벽걸이: 칸 가운데, 위 끝이 벽 아래선에서 top px 위 / 바닥: 칸 가운데, 아래 끝이 아래선 4px 위"""
    w, h = img.size
    ax = -(32 - w) // 2
    if kind == 'wall':
        return ax * 2, opt.get('top', 28) * 2
    if kind == 'floor':
        return ax * 2, (h + 4) * 2
    return ax * 2, h * 2  # 데칼: 그리는 쪽에서 위치를 정한다


def blackboard_kr():
    """도트화한 칠판(assets/sprites/props_room/blackboard.png) 위 가운데에 태극기 액자, 오른쪽에 급훈 액자"""
    board = Image.open(ROOT / 'assets' / 'sprites' / 'props_room' / 'blackboard.png').convert('RGBA')
    small = board.resize((board.width // 2, board.height // 2), Image.NEAREST)
    flag, _, _ = render('flag_frame')
    motto, _, _ = render('motto_frame')
    canvas = Image.new('RGBA', (small.width, small.height + 6), (0, 0, 0, 0))
    canvas.alpha_composite(small, (0, 6))
    canvas.alpha_composite(flag, ((small.width - flag.width) // 2, 0))
    canvas.alpha_composite(motto, (small.width - motto.width - 6, 2))
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for key, (g, kind, opt) in SPRITES.items():
        if kind == 'part':
            continue
        img, kind, opt = render(key)
        img.resize((img.width * 2, img.height * 2), Image.NEAREST).save(OUT / f'{key}.png')
        ax, ay = anchor(img, kind, opt)
        meta[key] = {'file': f'props_pixel/{key}.png', 'w': img.width * 2, 'h': img.height * 2, 'ax': ax, 'ay': ay}
    bb = blackboard_kr()
    bb.resize((bb.width * 2, bb.height * 2), Image.NEAREST).save(OUT / 'blackboard_kr.png')
    meta['blackboard_kr'] = {'file': 'props_pixel/blackboard_kr.png', 'w': bb.width * 2, 'h': bb.height * 2, 'ax': 0, 'ay': 60 + 12}
    json.dump(meta, open(OUT.parent / 'props_pixel.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(meta), '소품·데칼')
    return meta


def preview(path):
    imgs = [render(k)[0] for k in SPRITES if SPRITES[k][1] != 'part'] + [blackboard_kr()]
    W = sum(i.width + 3 for i in imgs)
    sheet = Image.new('RGBA', (W, max(i.height for i in imgs) + 4), (70, 72, 84, 255))
    x = 2
    for i in imgs:
        sheet.alpha_composite(i, (x, 2))
        x += i.width + 3
    sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST).save(path)


if __name__ == '__main__':
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1])
    else:
        main()
