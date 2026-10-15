"""도트 캐릭터 생성기: 머리·몸을 ASCII 도트 격자로 그려 합성 → 32x48 프레임(게임 픽셀 = 도트 1칸), 2배 최근접 확대로 저장.
사용: python3 tools/pixel_chars.py            (assets/sprites/chars_students, chars_others 에 쓰고 json 갱신)
      python3 tools/pixel_chars.py --preview 파일.png
  - 스프라이트 키는 기존과 같다: <skin>_<down|up|left|right>_<0|1|2> (0 서기, 1 왼발, 2 오른발), left = right 좌우 반전
  - 발바닥이 기존 앵커보다 2.5px 아래(기존 블렌더 스프라이트와 같은 발 위치), 바깥 1px 외곽선 자동
  - 색은 컷신 초상화(assets/hf/portrait_*): 남색 블레이저, 빨간 넥타이·리본, 머리색·안경·머리핀"""
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'sprites'
FW, FH = 32, 48
FEET = 45
LINE = (14, 12, 18)

BASE = {
    'S': (240, 205, 185), 's': (206, 160, 146), 'E': (40, 26, 30), 'm': (196, 120, 116),
    'B': (40, 52, 98), 'b': (27, 35, 70), 'n': (58, 74, 128),
    'T': (238, 238, 240), 't': (190, 192, 204),
    'R': (176, 38, 52), 'r': (120, 24, 36),
    'G': (92, 94, 108), 'g': (64, 66, 78),
    'K': (62, 62, 84), 'k': (40, 40, 58), 'j': (110, 74, 82),
    'O': (30, 26, 30), 'o': (70, 62, 66), 'V': (36, 40, 66),
    'Y': (222, 186, 70), 'P': (150, 40, 54),
}
PAL = {
    'heemin': {'H': (28, 28, 36), 'h': (14, 14, 20), 'L': (70, 74, 92)},
    'soyoung': {'H': (24, 26, 40), 'h': (12, 12, 22), 'L': (66, 74, 104), 'S': (246, 220, 210), 's': (214, 178, 170), 'E': (44, 52, 96)},
    'seonga': {'H': (92, 56, 40), 'h': (60, 34, 26), 'L': (140, 92, 64)},
    'jihyeon': {'H': (150, 92, 58), 'h': (108, 62, 40), 'L': (196, 138, 92), 'C': (126, 96, 52), 'X': (204, 60, 66)},
    # 수위 이봉구: 대머리, 올리브 작업복, 손전등, 방망이
    'janitor': {'S': (226, 178, 150), 's': (184, 132, 110), 'B': (92, 104, 72), 'b': (62, 72, 48), 'n': (120, 134, 94),
                'G': (80, 90, 62), 'g': (56, 64, 42), 'W': (236, 230, 200), 'F': (160, 164, 170), 'f': (100, 104, 112), 'Z': (150, 116, 74), 'z': (104, 78, 48), 'h': (96, 88, 84)},
    # 나영(목매단 귀신): 창백한 피부, 검은 긴 머리, 낡은 교복
    'naying': {'S': (206, 212, 214), 's': (150, 158, 164), 'H': (16, 16, 22), 'h': (6, 6, 10), 'L': (44, 46, 60),
               'B': (44, 50, 72), 'b': (30, 34, 50), 'n': (60, 68, 92), 'T': (200, 204, 210), 'K': (54, 56, 72), 'k': (36, 38, 50), 'j': (80, 66, 74), 'U': (120, 100, 70), 'u': (84, 68, 46)},
}


def grid(s):
    rows = s.strip('\n').split('\n')
    w = max(len(r) for r in rows)
    return [r.ljust(w, '.') for r in rows]


def paint(img, g, x0, y0, pal):
    for y, row in enumerate(g):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            if 0 <= x0 + x < img.width and 0 <= y0 + y < img.height:
                img.putpixel((x0 + x, y0 + y), pal[ch] + (255,))


def outline(img):
    w, h = img.size
    a = img.getchannel('A').load()
    px = img.load()
    for y in range(h):
        for x in range(w):
            if not a[x, y] and any(0 <= x + dx < w and 0 <= y + dy < h and a[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = LINE + (255,)
    return img


G = {}  # 이름 → 격자
def define(name, s):
    G[name] = grid(s)


# ================================================================ 몸 (원점 x 9)
define('boy_down', '''
...bBTTTTBb...
..bBBTRRTBBb..
.bBBBTRRTBBBb.
.BnBBBTRTBBBnB
.BnBBBTRTBBBnB
.BnBBBBRBBBBnB
.BbBBBBRBBBBbB
.BbBBBBBBBBBbB
.SbBBBBYBBBBbS
.SSbBBBBBBBbSS
...bBBBBBBBb..
''')
define('boy_up', '''
...bBBBBBBb...
..bBBBBBBBBb..
.bBBBBBBBBBBb.
.BnBBBBBBBBBnB
.BnBBBBBBBBBnB
.BnBBBBbBBBBnB
.BbBBBBbBBBBbB
.BbBBBBbBBBBbB
.SbBBBBbBBBBbS
.SSbBBBBBBBbSS
...bBBBBBBBb..
''')
define('boy_right', '''
.....bBTB.....
....bBBTRb....
....BBBBRB....
....BnBBBB....
....BnBBBB....
....BnBBBb....
....BnBBBb....
....BbBBBb....
....BbBBBb....
.....bBBb.....
.....bBBb.....
''')
define('girl_down', '''
...bBTTTTBb...
..bBRRrrRRBb..
.bBBPTrrTPBBb.
.BnBBPTTPBBBnB
.BnBBBPTPBBBnB
.BnBBBBPBBBBnB
.BbBBBBYBBBBbB
.BbBBBBBBBBBbB
.SbBBBBYBBBBbS
.SSbBBBBBBBbSS
''')
define('girl_up', '''
...bBBBBBBb...
..bBBBBBBBBb..
.bBBBBBBBBBBb.
.BnBBBBBBBBBnB
.BnBBBBBBBBBnB
.BnBBBBbBBBBnB
.BbBBBBbBBBBbB
.BbBBBBbBBBBbB
.SbBBBBbBBBBbS
.SSbBBBBBBBbSS
''')
define('girl_right', '''
.....bBTB.....
....bBBRRb....
....BBBBrB....
....BnBBPB....
....BnBBBB....
....BnBBBb....
....BnBBBb....
....BbBBBb....
....BbBBBb....
.....bBBb.....
''')
for d in ('down', 'up'):
    define(f'skirt_{d}', '''
...KKjKKjKKK..
..KKkjKKjkKK..
..KjKKjjKKjKK.
.KKjkKjjKkjKK.
''')
define('skirt_right', '''
....KKjKK.....
....KjKKjK....
...KKjKKjKK...
...KjkKKjkK...
''')

# 다리: [서기, 왼발, 오른발]
define('boylegs_down_0', '''
...GGGGGGGG...
...GGGgGGGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...gGg..gGg...
..OOOo..oOOO..
''')
define('boylegs_down_1', '''
...GGGGGGGG...
...GGGgGGGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...OOo..gGG...
..OOOo..gGG...
........gGg...
........oOOO..
''')
define('boylegs_down_2', '''
...GGGGGGGG...
...GGGgGGGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...GGg..oOO...
...GGg..oOOO..
...gGg........
..OOOo........
''')
define('boylegs_up_0', '''
...GGGGGGGG...
...GGGgGGGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...gGg..gGg...
...OOo..oOO...
''')
define('boylegs_up_1', '''
...GGGGGGGG...
...GGGgGGGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...OOo..gGG...
...OOo..gGG...
........gGg...
........oOO...
''')
define('boylegs_up_2', '''
...GGGGGGGG...
...GGGgGGGG...
...GGg..gGG...
...GGg..gGG...
...GGg..gGG...
...GGg..oOO...
...GGg..oOO...
...gGg........
...OOo........
''')
define('boylegs_right_0', '''
.....GGGG.....
.....GGGg.....
.....GGGg.....
.....GGGg.....
.....GGGg.....
.....GGGg.....
.....GGgg.....
.....gGgg.....
.....OOOOo....
''')
define('boylegs_right_1', '''
.....GGGG.....
....GGGGGg....
...GGg.GGg....
...GGg..GGg...
..GGg...GGg...
..GGg....GGg..
.GGg.....gGg..
.OOOo....OOOo.
..........OO..
''')
define('boylegs_right_2', '''
.....GGGG.....
....GGGGGg....
....GGgGGg....
...GGg.gGG....
...GGg..gGG...
..GGg....GGg..
..GGg....gGGg.
.OOOo.....OOOo
..............
''')
define('girllegs_down_0', '''
....SS..SS....
....SS..SS....
....VV..VV....
....VV..VV....
...OOo..oOO...
''')
define('girllegs_down_1', '''
....SS..SS....
....VV..SS....
...OOo..VV....
........VV....
........oOO...
''')
define('girllegs_down_2', '''
....SS..SS....
....SS..VV....
....VV..oOO...
....VV........
...OOo........
''')
define('girllegs_up_0', '''
....SS..SS....
....SS..SS....
....VV..VV....
....VV..VV....
....OO..OO....
''')
define('girllegs_up_1', '''
....SS..SS....
....VV..SS....
....OO..VV....
........VV....
........OO....
''')
define('girllegs_up_2', '''
....SS..SS....
....SS..VV....
....VV..OO....
....VV........
....OO........
''')
define('girllegs_right_0', '''
.....SSs......
.....SSs......
.....VVV......
.....VVV......
.....OOOOo....
''')
define('girllegs_right_1', '''
....SS..SS....
...SS....SS...
...VV.....VV..
..VV......VV..
.OOOo.....OOOo
''')
define('girllegs_right_2', '''
.....SS.SS....
....SS...SS...
....VV....VV..
...VV.....VV..
..OOOo....OOOo
''')
# 옆모습 팔(몸 원점): 0 내림, 1 앞, 2 뒤
define('arm_0', '''
..............
..............
......bB......
......bB......
......bB......
......bB......
......bB......
......SS......
''')
define('arm_1', '''
..............
..............
......bB......
......bBB.....
.......bBB....
........bBS...
.........SS...
''')
define('arm_2', '''
..............
..............
......bB......
.....bBB......
....bBb.......
...SBb........
...SS.........
''')

# ================================================================ 머리 (원점 x 9, 몸 위)
define('heemin_head_down', '''
.....H.HH.....
...HHHHHHHH...
..HHLLHHHHHH..
.HHLLHHHHHHHH.
.HHHHHHHHHHHHH
HHHhHHhHHhHHHH
HHhShHhSSHhShH
HhSSSShSSSSShH
.hSSESSSSESSh.
.hSSESSSSESSh.
..SSSSSSSSSS..
..sSSSmmSSSs..
...ssSSSSss...
.....sSSs.....
''')
define('heemin_head_up', '''
.....H.HH.....
...HHHHHHHH...
..HHLLHHHHHH..
.HHLLHHHHHHHH.
.HHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HhHHHHHHHHHHhH
.hHHhHHHHhHHh.
.hHHHhHHhHHHh.
..hHHHHHHHHh..
..shHHHHHHhs..
...ssSSSSss...
.....sSSs.....
''')
define('heemin_head_right', '''
......HH.H....
....HHHHHHH...
...HHLLHHHHH..
..HHLLHHHHHHH.
..HHHHHHHHHHH.
.HHHHHHHhHHHHH
.HHHHHhSShHHHH
.HHHHhSSSSSShH
..HHHSSSSSESh.
..hHHsSSSSESS.
...hhSSSSSSSS.
....sSSSSSmS..
.....sSSSSs...
......sSSs....
''')
define('soyoung_head_down', '''
....HHHHHH....
..HHHHHHHHHH..
.HHLLHHHHHHHH.
.HLLHHHHHHHHH.
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHhhhhhhhhhhHH
HHSSSSSSSSSSHH
HHSSESSSSESSHH
HHSSESSSSESSHH
HHSSSSSSSSSSHH
HHsSSSmmSSSsHH
HH.ssSSSSss.HH
HH...sSSs...HH
''')
define('soyoung_head_up', '''
....HHHHHH....
..HHHHHHHHHH..
.HHLLHHHHHHHH.
.HLLHHHHHHHHH.
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
''')
define('soyoung_head_right', '''
.....HHHHHH...
...HHHHHHHHHH.
..HHLLHHHHHHH.
..HLLHHHHHHHHH
.HHHHHHHHHHHHH
.HHHHHHHHhhhhH
.HHHHHHHSSSSSH
.HHHHHHSSSSESS
.HHHHHHSSSSESS
.HHHHHHsSSSSSS
.HHHHHHHsSSmS.
.HHHHHHH.sSSs.
.HHHHHHH..sSs.
.HHHHHHH......
''')
define('seonga_head_down', '''
....HHHHHH....
..HHHHHHHHHH..
.HHLLHHHHHHHH.
.HLLHHHHHHHHH.
HHHHHHHHHHHHHH
HYHHhHHHHhHHHH
HYhSSSHhSSShHH
HhSSSSShSSSShH
HhSSESSSSESShH
HhSSESSSSESShH
HhSSSSSSSSSShH
HHsSSSmmSSSsHH
HHhssSSSSsshHH
.Hh..sSSs..hH.
''')
define('seonga_head_up', '''
....HHHHHH....
..HHHHHHHHHH..
.HHLLHHHHHHHH.
.HLLHHHHHHHHH.
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHhHHHHHHHHhHH
HHhHHHHHHHHhHH
HHhHHHHHHHHhHH
HHhhHHHHHHhhHH
.Hh..sSSs..hH.
''')
define('seonga_head_right', '''
.....HHHHHH...
...HHHHHHHHHH.
..HHLLHHHHHHH.
..HLLHHHHHHHHH
.HHHHHHHHHHHHH
.HHHHHHHHhShhH
.HHHHHHYhSSSSH
.HHHHHHYSSSSES
.HHHHHHHSSSSES
.HHHHHHhsSSSSS
.HhHHHHh.sSmS.
.HhHHHh...sSs.
..hhhh....sSs.
''')
define('jihyeon_head_down', '''
..........XHH.
....HHHHHHXHH.
..HHHHHHHHHH..
.HHLLHHHHHHHH.
.HLLHHHHHHHHH.
HHHHHHHHHHHHHH
HHhhhhhhhhhhHH
HHSSSSSSSSSSHH
HHSCCCSSCCCSHH
HHSCECCCCECSHH
HHSSSSSSSSSSHH
HHsSSSmmSSSsHH
HH.ssSSSSss.HH
HH...sSSs...HH
''')
define('jihyeon_head_up', '''
..........XHH.
....HHHHHHXHH.
..HHHHHHHHHH..
.HHLLHHHHHHHH.
.HLLHHHHHHHHH.
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
''')
define('jihyeon_head_right', '''
.......XHH....
.....HHXHHHH..
...HHHHHHHHHH.
..HHLLHHHHHHH.
..HLLHHHHHHHHH
.HHHHHHHHhhhhH
.HHHHHHHSSSSSH
.HHHHHHCCCSCCC
.HHHHHHCSCCSEC
.HHHHHHsCCSCCC
.HHHHHHHsSSmS.
.HHHHHHH.sSSs.
.HHHHHHH..sSs.
.HHHHHHH......
''')
# 긴 머리(머리 원점에서 x-2, 폭 18): down 은 몸 뒤, up·right 는 몸 위
define('soyoung_long_down', '''
..................
..................
..................
..................
..HHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.hHHH........HHHh.
.hHHH........HHHh.
.hHHh........hHHh.
.hHHh........hHHh.
.hHHh........hHHh.
.hHHh........hHHh.
..hHh........hHh..
..hh..........hh..
''')
define('soyoung_long_up', '''
..................
..................
..................
..................
..HHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHhHHHHHHhHHHHH.
.HHHhHHHHHHhHHHHH.
.hHHhHHHHHHhHHHHh.
.hHHhHHHhHHhHHHHh.
.hHHhHHHhHHhHHHHh.
.hHHhHHHhHHhHHHHh.
..hHhHHHhHHhHHHh..
..hhhHHHhHHhHHhh..
....hhHHhHHhhh....
......hh..hh......
''')
define('soyoung_long_right', '''
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..HHHHHH..........
..HHHHHH..........
..HHHHHh..........
..HHHHHh..........
..hHHHHh..........
..hHHHh...........
..hHHHh...........
...hHHh...........
...hHh............
....h.............
''')
define('jihyeon_long_down', '''
..................
..................
..................
..................
..................
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.HHHH........HHHH.
.hHHH........HHHh.
.hHHh........hHHh.
.hHHh........hHHh.
..hHh........hHh..
..hh..........hh..
''')
define('jihyeon_long_up', '''
..................
..................
..................
..................
..................
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
.HHHhHHHHHHhHHHHH.
.HHHhHHHHHHhHHHHH.
.hHHhHHHhHHhHHHHh.
.hHHhHHHhHHhHHHHh.
..hHhHHHhHHhHHHh..
..hhhhHHhHHhhhhh..
......hh..hh......
''')
define('jihyeon_long_right', '''
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..HHHHHH..........
..HHHHHh..........
..hHHHHh..........
..hHHHh...........
...hHHh...........
...hhh............
''')

STUDENTS = ['heemin', 'soyoung', 'seonga', 'jihyeon']
GIRLS = {'soyoung', 'seonga', 'jihyeon'}


def student(skin, d, f):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    pal = {**BASE, **PAL[skin]}
    girl = skin in GIRLS
    bob = 1 if f else 0  # 걷는 프레임은 1px 내려앉음
    legs = G[f"{'girl' if girl else 'boy'}legs_{d}_{f}"]
    legs_y = FEET - len(legs) + 1
    if girl:
        skirt = G[f'skirt_{d}']
        skirt_y = legs_y - len(skirt) + bob
        body = G[f'girl_{d}']
        body_y = skirt_y - len(body) + 1
    else:
        body = G[f'boy_{d}']
        body_y = legs_y - len(body) + bob
    head = G[f'{skin}_head_{d}']
    head_y = body_y - len(head) + 1
    long = G.get(f'{skin}_long_{d}')
    if long and d == 'down':
        paint(img, long, 7, head_y, pal)
    paint(img, legs, 9, legs_y, pal)
    if girl:
        paint(img, skirt, 9, skirt_y, pal)
    paint(img, body, 9, body_y, pal)
    paint(img, head, 9, head_y, pal)
    if long and d != 'down':
        paint(img, long, 7, head_y, pal)
    if d == 'right':
        paint(img, G[f'arm_{f}'], 9, body_y, pal)
    return outline(img)


def frames(skin):
    """(키, 32x48 이미지) — right 를 반전해 left"""
    out = []
    for d in ('down', 'up', 'right'):
        for f in range(3):
            im = MAKERS[skin](skin, d, f)
            out.append((f'{skin}_{d}_{f}', im))
            if d == 'right':
                out.append((f'{skin}_left_{f}', im.transpose(Image.FLIP_LEFT_RIGHT)))
    return out


MAKERS = {s: student for s in STUDENTS}
FOLDER = {s: 'chars_students' for s in STUDENTS}


def anchor(skin, im):
    # 학생·수위: 발바닥 2.5px 위 / 나영(기어 옴): 몸 가운데(기존 블렌더 스프라이트와 같은 위치)
    if skin == 'naying':
        return im.width, 34
    return im.width, FEET * 2 - 5


def extra():
    """(폴더, 키, 이미지, ax, ay) — 목매단 나영(앵커는 그림 아래 3.5px), 머리 귀신(앵커는 그림 아래 1px)"""
    hang = Image.new('RGBA', (24, 34), (0, 0, 0, 0))
    paint(hang, G['naying_hang'], 0, 1, {**BASE, **PAL['naying']})
    hang = outline(hang)
    head = head_ghost()
    return [('chars_others', 'naying_hang', hang, 24, hang.height * 2 + 7), ('chars_others', 'head_ghost', head, 20, head.height * 2 + 2)]


def save(skins):
    by = {}
    def put(folder, key, im, ax, ay):
        meta = by.setdefault(folder, json.load(open(OUT / f'{folder}.json', encoding='utf-8')))
        im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(OUT / folder / f'{key}.png')
        meta[key] = {'file': f'{folder}/{key}.png', 'w': im.width * 2, 'h': im.height * 2, 'ax': ax, 'ay': ay}
    for skin in skins:
        for key, im in frames(skin):
            put(FOLDER[skin], key, im, *anchor(skin, im))
    if 'naying' in skins:
        for folder, key, im, ax, ay in extra():
            put(folder, key, im, ax, ay)
    for folder, meta in by.items():
        json.dump(meta, open(OUT / f'{folder}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('저장:', ', '.join(skins))


def preview(path, skins):
    cells = [im for s in skins for k, im in frames(s) if '_left_' not in k] + ([e[2] for e in extra()] if 'naying' in skins else [])
    cols = 9
    sheet = Image.new('RGBA', (cols * (FW + 2), ((len(cells) + cols - 1) // cols) * (FH + 2)), (70, 72, 84, 255))
    for i, c in enumerate(cells):
        sheet.alpha_composite(c, ((i % cols) * (FW + 2), (i // cols) * (FH + 2)))
    sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST).save(path)


# ================================================================ 수위 이봉구 (대머리, 올리브 작업복, 손전등·방망이)
define('janitor_head_down', '''
....ssssss....
..sSSSSSSSSs..
.sSSSSSSSSSSs.
.SSSSSSSSSSSS.
sSSSSSSSSSSSSs
sSssSSSSSSssSs
SSSEESSSSEESSS
sSSSESSSSESSSs
.SSSSSSSSSSSS.
.SSShhhhhhSSS.
..SSSSmmSSSS..
...sSSSSSSs...
.....sSSs.....
''')
define('janitor_head_up', '''
....ssssss....
..sSSSSSSSSs..
.sSSSSSSSSSSs.
.SSSSSSSSSSSS.
sSSSSSSSSSSSSs
sSSSSSSSSSSSSs
SSSSSSSSSSSSSS
sSSSSSSSSSSSSs
.sSSSSSSSSSSs.
.ssSSSSSSSSss.
..ssSSSSSSss..
...sSSSSSSs...
.....sSSs.....
''')
define('janitor_head_right', '''
.....ssssss...
...sSSSSSSSs..
..sSSSSSSSSSs.
..SSSSSSSSSSS.
.sSSSSSSSSSSSs
.sSSSSSSSssSSs
.SSsSSSSSSEESS
.SSsSSSSSSSESS
.sSSSSSSSSSSSS
..SSSSSSShhhS.
..sSSSSSSSmSS.
...sSSSSSSSs..
.....sSSSs....
''')
define('janitor_down', '''
...bBBBBBBb...
..bBBBnnBBBb..
.bBBBBnnBBBBb.
.BnBBBBBBBBBnB
.BnBWWBBBBBBnB
.BnBBBBBBBBBnB
.BbBBBBBBBBBbB
.BbgggggggggbB
.SbBBBBBBBBBbS
.SSbBBBBBBBbSS
...bBBBBBBBb..
''')
define('janitor_up', '''
...bBBBBBBb...
..bBBBBBBBBb..
.bBBBBBBBBBBb.
.BnBBBBBBBBBnB
.BnBBBBBBBBBnB
.BnBBBBbBBBBnB
.BbBBBBbBBBBbB
.BbgggggggggbB
.SbBBBBBBBBBbS
.SSbBBBBBBBbSS
...bBBBBBBBb..
''')
define('janitor_right', '''
.....bBBB.....
....bBBBBb....
....BBBBBB....
....BnBBWB....
....BnBBBB....
....BnBBBb....
....BnBBBb....
....Bgggggg...
....BbBBBb....
.....bBBb.....
.....bBBb.....
''')
# 손전등(F, 앞쪽 W) — 몸 원점 기준, 방망이(Z) — 다리 옆으로 늘어뜨림
define('janitor_tools_down', '''
..............Z.
..............Z.
..............Z.
..............Z.
..............Z.
..............Z.
..............Zz
.FF...........Zz
.FWW..........zZ
.FF............Z
...............Z
...............Z
...............Z
...............z
''')
define('janitor_tools_up', '''
Z...............
Z...............
Z...............
Z...............
Z...............
Z...............
zZ..............
zZ............FF
Zz............FF
Z...............
Z...............
Z...............
Z...............
z...............
''')
define('janitor_tools_right', '''
..............
..............
..............
..............
..............
..............
..............
.......FFFWW..
.......FFF....
..............
''')


def janitor(skin, d, f):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    pal = {**BASE, **PAL[skin], 'O': (24, 22, 20), 'o': (56, 50, 44)}
    bob = 1 if f else 0
    legs = G[f'boylegs_{d}_{f}']
    legs_y = FEET - len(legs) + 1
    body = G[f'janitor_{d}']
    body_y = legs_y - len(body) + bob
    head = G[f'janitor_head_{d}']
    head_y = body_y - len(head) + 1
    paint(img, legs, 9, legs_y, pal)
    if d == 'up':
        paint(img, G['janitor_tools_up'], 7, body_y, pal)
    paint(img, body, 9, body_y, pal)
    paint(img, head, 9, head_y, pal)
    if d == 'down':
        paint(img, G['janitor_tools_down'], 7, body_y, pal)
    if d == 'right':
        paint(img, G[f'arm_{f}'], 9, body_y, pal)
        paint(img, G['janitor_tools_right'], 9 + (2 if f == 1 else -1 if f == 2 else 0), body_y, pal)
    return outline(img)


# ================================================================ 나영: 기어 오는 모습(바닥, 머리카락이 얼굴을 덮음), 목매단 모습
CRAWL_W, CRAWL_H = 32, 32
define('naying_crawl_down_0', '''
....HHHHHHHH....
...HHHHHHHHHH...
..HHHLLHHHHHHH..
..HHhHHHHHHhHH..
.SHHhHHHHHHhHHS.
SSHHhHHHHHHhHHSS
S.HHhhHHHHhhHH.S
..HHHhHHHHhHHH..
..BhHHhHHhHHhB..
.BBBhHHHHHHhBBB.
.BBBBhHHHHhBBBB.
..BBBBBBBBBBBB..
...BBBBBBBBBB...
...KKKjKKjKKK...
..SSKKjKKjKKSS..
..ss........ss..
''')
define('naying_crawl_down_1', '''
....HHHHHHHH....
...HHHHHHHHHH...
.SHHHLLHHHHHHH..
SSHHhHHHHHHhHH..
S.HHhHHHHHHhHHS.
..HHhHHHHHHhHHSS
..HHhhHHHHhhHH.S
..HHHhHHHHhHHH..
..BhHHhHHhHHhB..
.BBBhHHHHHHhBBB.
.BBBBhHHHHhBBBB.
..BBBBBBBBBBBB..
...BBBBBBBBBB...
...KKKjKKjKKK...
..SSKKjKKjKKSS..
...ss......ss...
''')
define('naying_crawl_up_0', '''
...SS......SS...
..BBBBBBBBBBBB..
.BBBBBBBBBBBBBB.
.BBHHHHHHHHHHBB.
..HHHHHLLHHHHH..
..HHhHHHHHHhHH..
..HHhHHHHHHhHH..
...HHhHHHHhHH...
...KKKjKKjKKK...
..SSKKjKKjKKSS..
..ss........ss..
''')
define('naying_crawl_up_1', '''
..SS........SS..
..BBBBBBBBBBBB..
.BBBBBBBBBBBBBB.
.BBHHHHHHHHHHBB.
..HHHHHLLHHHHH..
..HHhHHHHHHhHH..
..HHhHHHHHHhHH..
...HHhHHHHhHH...
...KKKjKKjKKK...
...SSKjKKjKSS...
...ss......ss...
''')
define('naying_crawl_right_0', '''
.................HHHHH..
...............HHHHHHHH.
..........BBBBHHHLLHHHHH
.KKKjK..BBBBBBHHhHHHHHHH
SKKjKKKBBBBBBBBHhHHHHHhH
SSKKKKBBBBBBBBBBhHHHHhH.
.ss..SS........S.HhHHh..
.....ss........SS.hHh...
''')
define('naying_crawl_right_1', '''
.................HHHHH..
...............HHHHHHHH.
..........BBBBHHHLLHHHHH
.KKKjK..BBBBBBHHhHHHHHHH
SKKjKKKBBBBBBBBHhHHHHHhH
SSKKKKBBBBBBBBBBhHHHHhH.
..ss.SS.........SHhHHh..
......ss.........ShHh...
''')
define('naying_hang', '''
...........UU...........
...........Uu...........
...........UU...........
...........Uu...........
...........UU...........
...........Uu...........
...........UU...........
........HHHUuHHH........
.......HHHHUUHHHH.......
......HHHLLHHHHHHH......
......HHhHHHHHHhHH......
......HHhHHHHHHhHH......
......HHhHHHHHHhHH......
.....BHHhHHhhHHhHHB.....
....BBBHhHHHHHHhHBBB....
....BBBhHHHHHHHHhBBB....
....BnBhHHHHHHHHhBnB....
....BnBBhHHHHHHhBBnB....
....BbBBhHHHHHHhBBbB....
....SbBBBhHHHHhBBBbS....
....S.BBBBhhhhBBBB.S....
......BBBBBBBBBBBB......
......KKKjKKKjKKKK......
.....KKjKKKjKKKjKKK.....
.....KjKKKjKKKjKKjK.....
.......sS......Ss.......
.......SS......SS.......
.......SS......SS.......
.......SS......SS.......
.......Ss......sS.......
.......SS......SS.......
.......ss......ss.......
''')


def naying(skin, d, f):
    img = Image.new('RGBA', (CRAWL_W, CRAWL_H), (0, 0, 0, 0))
    pal = {**BASE, **PAL[skin]}
    key = f'naying_crawl_{d}_{0 if f == 0 else 1 if f == 1 else 0}'
    g = G[key]
    if d == 'right' and f == 2:
        g = G['naying_crawl_right_1']
    paint(img, g, (CRAWL_W - len(g[0])) // 2, CRAWL_H - len(g) - 6 + (f == 2), pal)
    return outline(img)


def head_ghost():
    img = Image.new('RGBA', (24, 20), (0, 0, 0, 0))
    pal = {**BASE, **PAL['naying'], 'E': (250, 250, 240), 'e': (10, 8, 8), 'R': (120, 20, 26)}
    paint(img, grid('''
....H..H.HH..H....
..HH.HHHHHHHH.HH..
.HHHHHHHHHHHHHHHH.
HH.HHHLLHHHHHH.HHH
.HHHhSSSSSSSShHHH.
HHHhSSSSSSSSSShHHH
.HhSSEESSSSEESShH.
.HhSEeESSSSEeEShH.
.HHSSEESSSSEESSHH.
..HSSSSSsSSSSSSH..
..HsSSSeeeeSSSsH..
...sSSeRRRReSSs...
...ssSSeeeeSSss...
.....sRsSSsRs.....
......R.ss.R......
''')
, 3, 3, pal)
    return outline(img)


MAKERS['janitor'] = janitor
FOLDER['janitor'] = 'chars_others'
MAKERS['naying'] = naying
FOLDER['naying'] = 'chars_others'


# ================================================================ 3장 신관 수위 손달수 (마른 체형, 남색 챙 모자, 날카로운 눈매, 차콜 제복 점퍼, 은색 호루라기 줄, 손전등)
PAL['dalsu'] = {
    'C': (40, 46, 82), 'c': (22, 26, 50), 'D': (64, 72, 114), 'Y': (196, 176, 92),
    'S': (226, 190, 164), 's': (180, 140, 122), 'E': (26, 18, 22), 'm': (150, 98, 92),
    'H': (26, 24, 30), 'h': (12, 12, 16),
    'B': (50, 56, 76), 'b': (32, 36, 50), 'n': (72, 80, 104), 'j': (38, 42, 58), 'k': (112, 116, 128),
    'w': (150, 154, 166), 'W': (226, 230, 236),
    'G': (52, 54, 62), 'g': (36, 38, 46), 'O': (20, 18, 20), 'o': (52, 48, 48),
    'F': (150, 154, 162), 'f': (96, 100, 110), 'X': (255, 238, 170),
}
define('dalsu_head_down', '''
....CCCCCC....
..CCCCCCCCCC..
.CCDCCCYYCCCC.
.CDCCCCYYCCCC.
.CCCCCCCCCCCC.
.cccccccccccc.
cccccccccccccc
.HssssssssssH.
.HSESSSSSSESH.
.hSSEESSEESSh.
..SSSSSSSSSS..
..sSSSmmSSSs..
...sSSSSSSs...
.....sSSs.....
''')
define('dalsu_head_up', '''
....CCCCCC....
..CCCCCCCCCC..
.CCDCCCCCCCCC.
.CDCCCCCCCCCC.
.CCCCCCCCCCCC.
.cCCCCCCCCCCc.
.cccccccccccc.
.HHHHHHHHHHHH.
.HHHHHHHHHHHH.
.hHHHHHHHHHHh.
..hHHHHHHHHh..
..shhhhhhhhs..
...sSSSSSSs...
.....sSSs.....
''')
define('dalsu_head_right', '''
.....CCCCC....
...CCCCCCCCC..
..CDCCCCCYYC..
..DCCCCCCYYCC.
..CCCCCCCCCCC.
..cCCCCCCCCCCc
..cccccccccccc
..HHHHHsssss..
.HHHHHsSSSEES.
.hHHHhSSSSSES.
..hHHsSSSSSSSS
...hsSSSSSSmS.
....sSSSSSSs..
.....sSSSs....
''')
define('dalsu_down', '''
....bnBBnb....
...bBwBBwBb...
..bBBBwwBBBb..
.BnBBBBWBBBnB.
.BnBBBBWkBBnB.
.BnBBBBkBBBnB.
.BbBBBBkBBBbB.
.BbjjjjjjjjbB.
.SbBBBBBBBBbS.
.SSbBBBBBBbSS.
...bBBBBBBb...
''')
define('dalsu_up', '''
....bBBBBb....
...bBBBBBBb...
..bBBBBBBBBb..
.BnBBBBBBBBnB.
.BnBBBBBBBBnB.
.BnBBBBbBBBnB.
.BbBBBBbBBBbB.
.BbjjjjjjjjbB.
.SbBBBBBBBBbS.
.SSbBBBBBBbSS.
...bBBBBBBb...
''')
define('dalsu_right', '''
.....bnB......
....bBBwBb....
....BBBBwB....
....BnBBWB....
....BnBBBB....
....BnBBBb....
....BnBBBb....
....Bjjjjj....
....BbBBBb....
.....bBBb.....
.....bBBb.....
''')
define('dalsu_torch_down', '''
fF
FF
FF
XX
''')
define('dalsu_torch_up', '''
ff
FF
''')
define('dalsu_torch_right', '''
fFFX
FFFX
''')


def dalsu(skin, d, f):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    pal = {**BASE, **PAL[skin]}
    bob = 1 if f else 0
    legs = G[f'boylegs_{d}_{f}']
    legs_y = FEET - len(legs) + 1
    body = G[f'dalsu_{d}']
    body_y = legs_y - len(body) + bob
    head = G[f'dalsu_head_{d}']
    head_y = body_y - len(head) + 1
    paint(img, legs, 9, legs_y, pal)
    if d == 'up':
        paint(img, G['dalsu_torch_up'], 21, body_y + 8, pal)
    paint(img, body, 9, body_y, pal)
    paint(img, head, 9, head_y, pal)
    if d == 'down':
        paint(img, G['dalsu_torch_down'], 8, body_y + 7, pal)
    if d == 'right':
        paint(img, G[f'arm_{f}'], 9, body_y, pal)
        hx, hy = {0: (16, 7), 1: (20, 5), 2: (13, 5)}[f]  # 손 위치(몸 원점 기준 손 격자 → 손전등)
        paint(img, G['dalsu_torch_right'], hx, body_y + hy, pal)
    return outline(img)


# ================================================================ 3장 은미(성아 어머니): 헝클어진 긴 검은 머리가 얼굴 반을 가림, 잿빛 피부, 바랜 자주색 카디건, 긴 검은 치마, 맨발
PAL['eunmi'] = {
    'H': (22, 20, 26), 'h': (8, 8, 12), 'L': (54, 50, 62),
    'S': (188, 190, 184), 's': (136, 138, 136), 'E': (14, 8, 10), 'r': (122, 46, 52), 'm': (92, 62, 68),
    'B': (102, 76, 100), 'b': (70, 50, 70), 'n': (126, 100, 122), 'T': (150, 146, 138), 't': (112, 108, 104),
    'K': (30, 28, 34), 'k': (16, 14, 20), 'j': (48, 44, 54),
}
define('eunmi_head_down', '''
...H.HHH.HH...
..HHHHHHHHHH..
.HHHLLHHHHHHH.
.HHLHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHhhhhHH
HHHHHHHhSSSSHH
HHHHHHHhSESShH
HHHHHHhSSErShH
HHHHHHHsSSSShH
HHHhHHHhsmmsHH
HHHHhHH.sSs.HH
HHhHHhH..s..hH
HhHHhHh.....Hh
''')
define('eunmi_head_up', '''
...H.HHH.HH...
..HHHHHHHHHH..
.HHHLLHHHHHHH.
.HHLHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHHHHHHHHHH
HHHHHhHHHHHHHH
HHHHHhHHHHhHHH
HHhHHhHHHHhHHH
HHhHHHhHHHhHHH
HHhHHHhHHHHhHH
HHhHHHhHHHHhHH
HhHHhHHhHHHhHh
''')
define('eunmi_head_right', '''
....H.HHH.H...
...HHHHHHHHH..
..HHLLHHHHHHH.
.HHLHHHHHHHHHH
.HHHHHHHHHHHHH
.HHHHHHHHHhhHH
.HHHHHHHHhSSHH
.HHHHHHHhSSESH
.HHHHHHHHSSrSH
.HHHHHHHhsSSSH
.HHHHHHHHHsmSH
.HHHHHHHHH.sSH
.HHHhHHHHH..HH
.HhHHhHHhH..Hh
''')
# 긴 머리(머리 원점에서 x-2, 폭 18): down 은 몸 뒤, up·right 는 몸 위 — 허리까지 헝클어져 늘어짐
define('eunmi_long_down', '''
..................
..................
..................
..................
..HHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
HHHHH........HHHHH
HHHHH........HHHHH
.HHHH........HHHH.
.HHHH........HHHHH
HHHHH........HHHH.
.HHHh........hHHH.
.HHHh........hHHHh
hHHHh........hHHH.
.hHHh........hHHh.
.hHHh........hHHh.
.hHh..........hHh.
.hHh..........hHHh
..hh..........hHh.
..h...........h.h.
..h............h..
''')
define('eunmi_long_up', '''
..................
..................
..................
..................
..HHHHHHHHHHHHHH..
.HHHHHHHHHHHHHHHH.
.HHHHHHHHHHHHHHHH.
HHHHHHHHHHHHHHHHHH
HHHHHHHHHHHHHHHHHH
.HHHHHHHHHHHHHHHH.
.HHHhHHHHHHhHHHHHH
HHHHhHHHHHHhHHHHH.
.HHHhHHHhHHhHHHHH.
.hHHhHHHhHHhHHHHHh
hHHHhHHHhHHHhHHHh.
.hHHhHHHhHHHhHHHh.
.hHHHhHHhHHHhHHHh.
..hHHhHHhHHhHHHh..
..hhHhHHhHHhhHHh..
...h.hHHhHh.hHh...
.....h.hh.h..h....
.......h.....h....
''')
define('eunmi_long_right', '''
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..................
..HHHHHHH.........
.HHHHHHH..........
.HHHHHHh..........
..HHHHHh..........
..hHHHHh..........
..hHHHHh..........
.hHHHHh...........
..hHHHh...........
..hHHhh...........
...hHh............
...h.h............
''')
define('eunmi_down', '''
...bBBTTBBb...
..bBBtTTtBBb..
.bBBBbTTbBBBb.
.BnBBbTTbBBBnB
.BnBBbTtbBBBnB
.BnBBbTTbBBBnB
.BbBBbtTbBBBbB
.BbBBbTTbBBBbB
.SbBBBbbBBBBbS
.SSbBBBBBBBbSS
.S...........S
''')
define('eunmi_up', '''
...bBBBBBBb...
..bBBBBBBBBb..
.bBBBBBBBBBBb.
.BnBBBBBBBBBnB
.BnBBBBBBBBBnB
.BnBBBBbBBBBnB
.BbBBBBbBBBBbB
.BbBBBBbBBBBbB
.SbBBBBbBBBBbS
.SSbBBBBBBBbSS
''')
define('eunmi_right', '''
.....bBTB.....
....bBBTtb....
....BBBTBB....
....BnBbBB....
....BnBBBB....
....BnBBBb....
....BnBBBb....
....BbBBBb....
....BbBBBb....
.....bBBb.....
''')
# 긴 치마 + 맨발(마지막 줄이 발바닥): 0 서기, 1 왼발, 2 오른발
define('eunmi_skirt_down_0', '''
..kKKKKKKKKk..
..KKKjKKjKKK..
..KKKjKKjKKK..
..KKjKKKKjKK..
.KKKjKKKKjKKK.
.KKKjKKKKjKKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKK.
KKKjKKKKKKjKKK
kkkkkkkkkkkkkk
...sSS..SSs...
...SSs..sSS...
''')
define('eunmi_skirt_down_1', '''
..kKKKKKKKKk..
..KKKjKKjKKK..
..KKKjKKjKKK..
..KKjKKKKjKK..
.KKKjKKKKjKKK.
.KKKjKKKKjKKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKKK
.kkkkkkkkkkkkk
...ss...SSs...
........sSS...
''')
define('eunmi_skirt_down_2', '''
..kKKKKKKKKk..
..KKKjKKjKKK..
..KKKjKKjKKK..
..KKjKKKKjKK..
.KKKjKKKKjKKK.
.KKKjKKKKjKKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKK.
KKKjKKKKKKjKK.
kkkkkkkkkkkkk.
...sSS...ss...
...SSs........
''')
define('eunmi_skirt_up_0', '''
..kKKKKKKKKk..
..KKKKKKKKKK..
..KKKjKKjKKK..
..KKKjKKjKKK..
.KKKjKKKKjKKK.
.KKKjKKKKjKKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKK.
KKKjKKKKKKjKKK
kkkkkkkkkkkkkk
...sSs..sSs...
...ss....ss...
''')
define('eunmi_skirt_up_1', '''
..kKKKKKKKKk..
..KKKKKKKKKK..
..KKKjKKjKKK..
..KKKjKKjKKK..
.KKKjKKKKjKKK.
.KKKjKKKKjKKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKKK
.kkkkkkkkkkkkk
...ss...sSs...
.........ss...
''')
define('eunmi_skirt_up_2', '''
..kKKKKKKKKk..
..KKKKKKKKKK..
..KKKjKKjKKK..
..KKKjKKjKKK..
.KKKjKKKKjKKK.
.KKKjKKKKjKKK.
.KKjKKKKKKjKK.
.KKjKKKKKKjKK.
KKKjKKKKKKjKK.
kkkkkkkkkkkkk.
...sSs...ss...
...ss.........
''')
define('eunmi_skirt_right_0', '''
....kKKKKk....
....KKjKKK....
....KKjKKKK...
...KKKjKKKK...
...KKjKKKKK...
...KKjKKKKKK..
..KKKjKKKKKK..
..KKjKKKKKKK..
..KKjKKKKKKKK.
..kkkkkkkkkkk.
......sSSs....
......SSSSSs..
''')
define('eunmi_skirt_right_1', '''
....kKKKKk....
....KKjKKK....
....KKjKKKK...
...KKKjKKKK...
...KKjKKKKKK..
..KKKjKKKKKK..
..KKjKKKKKKKK.
.KKKjKKKKKKKK.
.KKjKKKKKKKKKK
.kkkkkkkkkkkkk
...sS.....sSs.
..sSs.....SSSS
''')
define('eunmi_skirt_right_2', '''
....kKKKKk....
....KKjKKK....
....KKjKKKK...
...KKKjKKKK...
...KKjKKKKK...
..KKKjKKKKKK..
..KKjKKKKKKK..
..KKjKKKKKKKK.
.KKjKKKKKKKKK.
.kkkkkkkkkkkk.
....sS...sSs..
...sSs...SSSS.
''')


def eunmi(skin, d, f):
    img = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    pal = {**BASE, **PAL[skin]}
    bob = 1 if f else 0
    skirt = G[f'eunmi_skirt_{d}_{f}']
    skirt_y = FEET - len(skirt) + 1
    body = G[f'eunmi_{d}']
    body_y = skirt_y - len(body) + 2 + bob
    head = G[f'eunmi_head_{d}']
    head_y = body_y - len(head) + 1
    long = G[f'eunmi_long_{d}']
    if d == 'down':
        paint(img, long, 7, head_y, pal)
    paint(img, skirt, 9, skirt_y, pal)
    paint(img, body, 9, body_y, pal)
    paint(img, head, 9, head_y, pal)
    if d != 'down':
        paint(img, long, 7, head_y, pal)
    if d == 'right':
        paint(img, G[f'arm_{f}'], 9, body_y + 1, pal)
    return outline(img)


# ================================================================ 3장 도플갱어: 희민과 같은 도트, 팔레트만 바꿈(잿빛 청회색 피부, 검은 눈 + 붉은 점 눈동자, 탁한 교복)
PAL['doppel'] = {
    'H': (24, 24, 30), 'h': (10, 10, 14), 'L': (58, 62, 74),
    'S': (150, 160, 170), 's': (106, 114, 128), 'E': (6, 4, 8), 'X': (222, 34, 44), 'm': (84, 70, 82),
    'B': (52, 58, 76), 'b': (34, 38, 52), 'n': (70, 78, 98),
    'T': (184, 186, 190), 't': (140, 142, 150), 'R': (108, 52, 58), 'r': (76, 36, 42),
    'G': (78, 80, 88), 'g': (56, 58, 66), 'Y': (140, 132, 100),
}
for _d in ('down', 'up', 'right'):  # 희민 머리 격자를 그대로 쓰고 눈 아래 칸만 붉은 점(X)
    _g = list(G[f'heemin_head_{_d}'])
    _eyes = [i for i, row in enumerate(_g) if 'E' in row]
    if _eyes:
        _g[_eyes[-1]] = _g[_eyes[-1]].replace('E', 'X')
    G[f'doppel_head_{_d}'] = _g

MAKERS['dalsu'] = dalsu
FOLDER['dalsu'] = 'chars_others'
MAKERS['eunmi'] = eunmi
FOLDER['eunmi'] = 'chars_others'
MAKERS['doppel'] = student
FOLDER['doppel'] = 'chars_others'


if __name__ == '__main__':
    skins = [a for a in sys.argv[1:] if not a.startswith('--') and not a.endswith('.png')] or list(MAKERS)
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1], skins)
    else:
        save(skins)
