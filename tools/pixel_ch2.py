"""2장(본관 2구역) 도트 소품·귀신·아이템 아이콘 → assets/sprites/props_ch2/ + props_ch2.json
사용: python3 tools/pixel_ch2.py [--preview 파일.png]
  - 게임 픽셀 = 도트 1칸, 2배 최근접 확대로 저장(아이콘은 4배 = 128px). 바깥 1px 외곽선 자동(pixel_chars.outline)
  - 바닥 소품: cells 칸 너비 가운데, 아래 끝이 칸 아래선 4px 위(tools/pixel_props.py 와 같은 규칙)
  - 귀신(baby_ghost·piano_ghost)·쓰러진 지현(jihyeon_faint): 앵커 = 발(몸) 아래 가운데"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'sprites' / 'props_ch2'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_chars import outline  # noqa: E402

C = {
    'K': (20, 18, 22), 'k': (44, 40, 46), 'j': (64, 60, 68),
    'W': (236, 234, 226), 'w': (196, 194, 186), 'A': (210, 202, 182), 'a': (160, 152, 134),
    'S': (150, 156, 162), 's': (104, 108, 116), 'T': (178, 182, 188), 't': (78, 82, 90),
    'N': (126, 84, 52), 'n': (86, 56, 34), 'M': (164, 118, 78), 'm': (60, 38, 24),
    'R': (186, 40, 44), 'r': (120, 22, 26), 'Y': (240, 196, 80), 'y': (220, 120, 40), 'O': (255, 150, 60),
    'G': (92, 124, 108), 'g': (62, 88, 76), 'D': (150, 210, 170), 'B': (44, 54, 92), 'b': (28, 34, 60),
    'C': (120, 150, 190), 'c': (70, 92, 124), 'P': (206, 212, 214), 'p': (150, 158, 166), 'q': (110, 118, 128),
    'E': (12, 10, 14), 'L': (120, 96, 72), 'l': (96, 74, 54), 'U': (176, 100, 60), 'u': (130, 70, 40),
}

SPR = {}  # 키 → (그리기 함수, 종류, 옵션)


def sprite(key, kind, w, h, **opt):
    def deco(fn):
        SPR[key] = (fn, kind, w, h, opt)
        return fn
    return deco


class Pen:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def r(self, x, y, w, h, c):  # 채운 사각형 (x, y, 너비, 높이)
        if w > 0 and h > 0:
            self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=C[c] + (255,))

    def px(self, x, y, c):
        self.im.putpixel((x, y), C[c] + (255,))

    def ln(self, x0, y0, x1, y1, c):
        self.d.line([x0, y0, x1, y1], fill=C[c] + (255,))

    def el(self, x, y, w, h, c):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], fill=C[c] + (255,))

    def grid(self, x0, y0, s):
        for y, row in enumerate(s.strip('\n').split('\n')):
            for x, ch in enumerate(row):
                if ch != '.':
                    self.px(x0 + x, y0 + y, ch)


def desk_body(p, x, y, w, top=7, front=12):
    """3/4 시점 나무 책상: 윗면(밝은 나무) + 앞면(서랍) + 다리"""
    p.r(x, y, w, top, 'M')
    p.r(x, y, w, 1, 'L')
    p.r(x, y + top, w, front, 'N')
    p.r(x, y + top, w, 1, 'n')
    for dx in (3, w // 2 + 2):
        p.r(x + dx, y + top + 3, w // 2 - 6, 4, 'n')
        p.r(x + dx + w // 4 - 4, y + top + 4, 3, 1, 'Y')
    p.r(x + 1, y + top + front, 3, 4, 'n')
    p.r(x + w - 4, y + top + front, 3, 4, 'n')


# ---------------------------------------------------------------- 1층
@sprite('stair_gate', 'floor', 62, 30, cells=2)
def stair_gate(p):
    p.r(0, 0, 62, 5, 'S'); p.r(0, 4, 62, 1, 's')  # 셔터 통
    for y in range(5, 28, 3):
        p.r(1, y, 60, 2, 'T'); p.r(1, y + 2, 60, 1, 's')
    p.r(0, 27, 62, 3, 't')
    for x in (20, 40):
        p.r(x, 12, 3, 3, 'R')


@sprite('pc_desk', 'floor', 60, 36, cells=2)
def pc_desk(p):
    desk_body(p, 0, 15, 60)
    p.r(6, 0, 22, 17, 'A'); p.r(6, 0, 22, 1, 'W'); p.r(26, 1, 2, 16, 'a')  # 모니터(CRT)
    p.r(9, 2, 15, 11, 'k'); p.r(10, 3, 13, 9, 'g'); p.r(11, 4, 4, 1, 'D')
    p.r(12, 17, 10, 2, 'a')
    p.r(32, 16, 18, 3, 'w'); p.r(33, 17, 16, 1, 'a')  # 키보드
    p.r(52, 15, 5, 4, 'A')  # 마우스


@sprite('tall_cabinet', 'floor', 26, 46)
def tall_cabinet(p):
    p.r(0, 0, 26, 4, 'T'); p.r(2, 1, 6, 1, 'W'); p.r(16, 1, 5, 1, 'w')  # 윗면(먼지)
    p.r(0, 4, 26, 42, 'S'); p.r(0, 4, 26, 1, 't')
    p.r(12, 5, 2, 40, 's')
    for x in (9, 15):
        p.r(x, 20, 2, 6, 'k')
    p.r(3, 8, 6, 2, 'W'); p.r(18, 8, 5, 2, 'W')  # 이름표
    p.r(0, 44, 26, 2, 't')


@sprite('chair', 'floor', 18, 24)
def chair(p):
    p.r(2, 0, 14, 10, 'N'); p.r(2, 0, 14, 1, 'M'); p.r(3, 2, 12, 1, 'n')  # 등받이
    p.r(1, 8, 2, 10, 't'); p.r(15, 8, 2, 10, 't')
    p.r(0, 11, 18, 5, 'M'); p.r(0, 11, 18, 1, 'L'); p.r(0, 15, 18, 1, 'n')  # 앉는 판
    p.r(1, 16, 2, 8, 't'); p.r(15, 16, 2, 8, 't'); p.r(5, 16, 1, 6, 's'); p.r(12, 16, 1, 6, 's')


@sprite('cctv_monitor', 'floor', 60, 42, cells=2)
def cctv_monitor(p):
    p.r(0, 0, 60, 42, 'k'); p.r(2, 2, 56, 38, 'E')  # 벽 속 오목한 칸
    p.r(2, 26, 56, 3, 'n'); p.r(2, 26, 56, 1, 'M')  # 선반
    p.r(18, 4, 24, 20, 'A'); p.r(18, 4, 24, 1, 'W'); p.r(40, 5, 2, 19, 'a')  # 모니터
    p.r(21, 6, 17, 13, 'k'); p.r(22, 7, 15, 11, 'c')
    for y in (8, 11, 14, 16):
        p.r(22, y, 15, 1, 'C')
    p.r(24, 20, 3, 2, 'R')
    p.r(16, 30, 28, 6, 'K'); p.r(18, 32, 14, 2, 'j'); p.r(38, 32, 2, 1, 'D')  # 비디오 플레이어
    p.r(4, 6, 10, 18, 'n'); p.r(5, 7, 2, 16, 'R'); p.r(8, 7, 2, 16, 'B'); p.r(11, 7, 2, 16, 'G')  # 테이프 꽂이


@sprite('bed', 'floor', 62, 26, cells=2)
def bed(p):
    p.r(0, 0, 3, 24, 't'); p.r(59, 6, 3, 18, 't')  # 머리판·발판
    p.r(3, 6, 56, 10, 'W'); p.r(3, 6, 56, 1, 'W')  # 매트리스 윗면
    p.r(18, 6, 41, 10, 'C'); p.r(18, 6, 41, 1, 'T'); p.r(18, 6, 2, 10, 'c')  # 이불
    p.r(5, 7, 11, 7, 'w'); p.r(6, 8, 9, 4, 'W')  # 베개
    p.r(3, 16, 56, 5, 'c'); p.r(3, 16, 56, 1, 'B')  # 이불 앞자락
    p.r(3, 21, 56, 2, 't'); p.r(4, 23, 2, 3, 't'); p.r(56, 23, 2, 3, 't')


@sprite('tv', 'floor', 24, 30)
def tv(p):
    p.r(1, 0, 22, 18, 'k'); p.r(1, 0, 22, 1, 'j'); p.r(21, 1, 2, 17, 'K')
    p.r(3, 2, 15, 12, 'c'); p.r(4, 3, 13, 10, 'q')
    for y in (4, 7, 10):
        p.r(4, y, 13, 1, 'p')
    p.r(19, 4, 2, 2, 'S'); p.r(19, 8, 2, 2, 'S')
    p.r(0, 18, 24, 4, 'M'); p.r(0, 18, 24, 1, 'L')  # 받침대
    p.r(0, 22, 24, 7, 'N'); p.r(3, 24, 18, 3, 'n')


@sprite('railing', 'floor', 94, 20, cells=3)
def railing(p):
    p.r(0, 0, 94, 3, 'S'); p.r(0, 0, 94, 1, 'T')
    p.r(0, 15, 94, 2, 's')
    for x in range(4, 92, 6):
        p.r(x, 3, 2, 12, 's')
    for x in (0, 46, 91):
        p.r(x, 0, 3, 20, 'T'); p.r(x + 2, 1, 1, 19, 't')


@sprite('cassette_desk', 'floor', 60, 32, cells=2)
def cassette_desk(p):
    desk_body(p, 0, 12, 60)
    p.r(14, 0, 32, 14, 'k'); p.r(14, 0, 32, 1, 'j')  # 카세트 플레이어
    p.el(16, 2, 9, 9, 'K'); p.el(18, 4, 5, 5, 's'); p.el(35, 2, 9, 9, 'K'); p.el(37, 4, 5, 5, 's')
    p.r(26, 3, 8, 6, 'q'); p.r(27, 5, 2, 2, 'k'); p.r(31, 5, 2, 2, 'k')
    p.r(27, 10, 2, 2, 'R'); p.r(31, 10, 5, 1, 'S')
    p.r(20, -1 + 1, 20, 1, 'S')  # 손잡이


def piano_body(p, blood):
    p.r(0, 0, 90, 5, 'n'); p.r(0, 0, 90, 1, 'M')  # 뚜껑
    p.r(0, 5, 90, 20, 'm'); p.r(4, 8, 82, 13, 'n'); p.r(5, 9, 80, 11, 'm')
    p.r(36, 10, 18, 7, 'A'); p.r(37, 11, 16, 5, 'W')  # 보면대 악보
    p.r(38, 12, 12, 1, 'k'); p.r(38, 14, 9, 1, 'k')
    p.r(0, 25, 90, 3, 'n')
    p.r(3, 28, 84, 7, 'W')  # 건반
    for x in range(3, 87, 4):
        p.r(x, 28, 1, 7, 'w')
    for x in range(5, 85, 4):
        if (x // 4) % 7 not in (2, 6):
            p.r(x, 28, 2, 4, 'K')
    p.r(0, 35, 90, 4, 'm'); p.r(0, 39, 90, 3, 'n')
    p.r(40, 39, 3, 3, 'Y'); p.r(46, 39, 3, 3, 'Y')  # 페달
    p.r(1, 28, 2, 11, 'n'); p.r(87, 28, 2, 11, 'n')
    if blood:
        for x, w, d in ((14, 6, 6), (31, 9, 8), (47, 5, 4), (60, 8, 9), (74, 4, 5)):
            p.r(x, 29, w, 3, 'R'); p.r(x + 1, 32, 2, d, 'r'); p.r(x + w - 2, 31, 1, 3, 'r')
        p.r(70, 1, 6, 2, 'r')


@sprite('piano', 'floor', 90, 42, cells=3)
def piano(p):
    piano_body(p, False)


@sprite('piano_blood', 'floor', 90, 42, cells=3)
def piano_blood(p):
    piano_body(p, True)


@sprite('piano_bench', 'floor', 26, 14)
def piano_bench(p):
    p.r(0, 0, 26, 5, 'n'); p.r(0, 0, 26, 1, 'M')
    p.r(0, 5, 26, 4, 'm'); p.r(11, 6, 4, 2, 'Y')  # 수납칸 자물쇠
    p.r(1, 9, 3, 5, 'm'); p.r(22, 9, 3, 5, 'm')


@sprite('piano_bench_open', 'floor', 26, 20)
def piano_bench_open(p):
    p.r(0, 0, 26, 7, 'n'); p.r(0, 0, 26, 1, 'M'); p.r(1, 6, 24, 1, 'm')  # 들어 올린 뚜껑
    p.r(0, 7, 26, 4, 'K'); p.r(2, 8, 22, 2, 'E')
    p.r(0, 11, 26, 4, 'm')
    p.r(1, 15, 3, 5, 'm'); p.r(22, 15, 3, 5, 'm')


@sprite('speaker', 'floor', 18, 32)
def speaker(p):
    p.r(0, 0, 18, 32, 'k'); p.r(0, 0, 18, 1, 'j')
    p.el(4, 3, 10, 10, 'K'); p.el(6, 5, 6, 6, 's'); p.el(8, 7, 2, 2, 'T')
    p.el(2, 15, 14, 14, 'K'); p.el(4, 17, 10, 10, 's'); p.el(7, 20, 4, 4, 'T')


# ---------------------------------------------------------------- 4층 미술실
def kiln_body(p, hot):
    p.r(0, 0, 58, 6, 'T'); p.r(0, 0, 58, 1, 'W')  # 윗면
    p.r(0, 6, 58, 34, 'A'); p.r(0, 6, 58, 1, 'a')
    p.r(4, 9, 38, 28, 'a'); p.r(5, 10, 36, 26, 'A')  # 문
    p.r(4, 9, 38, 1, 'O' if hot else 'a'); p.r(4, 36, 38, 1, 'O' if hot else 'a')
    p.r(4, 9, 1, 28, 'O' if hot else 'a'); p.r(41, 9, 1, 28, 'O' if hot else 'a')
    p.el(19, 17, 8, 8, 'Y' if hot else 'k'); p.el(21, 19, 4, 4, 'O' if hot else 'E')  # 들여다보는 창
    p.el(34, 20, 5, 5, 'n' if hot else 't'); p.r(36, 22, 1, 1, 'K')  # 손잡이 자리(빈 구멍 / 끼운 손잡이)
    p.r(46, 10, 9, 14, 's'); p.r(47, 11, 7, 4, 'k'); p.r(48, 12, 3, 2, 'R' if hot else 't')  # 조작판
    p.el(48, 17, 5, 5, 'K'); p.r(50, 18, 1, 2, 'W')
    for y in (28, 31, 34):
        p.r(46, y, 9, 1, 's')
    p.r(2, 40, 4, 2, 't'); p.r(52, 40, 4, 2, 't')


@sprite('kiln', 'floor', 58, 42, cells=2)
def kiln(p):
    kiln_body(p, False)


@sprite('kiln_hot', 'floor', 58, 42, cells=2)
def kiln_hot(p):
    kiln_body(p, True)


@sprite('easel', 'floor', 22, 36)
def easel(p):
    p.ln(11, 0, 2, 35, 'n'); p.ln(11, 0, 20, 35, 'n'); p.ln(11, 0, 11, 30, 'm')
    p.r(2, 4, 18, 17, 'W'); p.r(2, 4, 18, 1, 'w'); p.r(19, 5, 1, 16, 'w')  # 캔버스
    p.ln(5, 16, 9, 9, 'a'); p.ln(9, 9, 14, 15, 'a'); p.el(12, 7, 4, 4, 'p')  # 스케치
    p.r(0, 21, 22, 2, 'N')


@sprite('plaster_bust', 'floor', 18, 34)
def plaster_bust(p):
    p.el(4, 0, 10, 12, 'W'); p.r(5, 6, 1, 3, 'w'); p.r(12, 3, 1, 6, 'w')
    p.r(6, 5, 2, 1, 'w'); p.r(10, 5, 2, 1, 'w'); p.r(8, 8, 2, 1, 'a')
    p.r(7, 11, 4, 3, 'w')
    p.el(1, 12, 16, 9, 'W'); p.r(1, 17, 16, 4, 'W'); p.r(13, 13, 3, 8, 'w')
    p.r(3, 21, 12, 3, 'w')
    p.r(2, 24, 14, 10, 'N'); p.r(2, 24, 14, 1, 'M'); p.r(4, 27, 10, 4, 'n')


# ---------------------------------------------------------------- 귀신·인물
@sprite('baby_ghost', 'char', 22, 20)
def baby_ghost(p):
    # 웅크린 갓난아기: 숙인 큰 머리, 검게 꺼진 눈, 벌린 입, 회녹색 피부, 무릎을 끌어안은 앙상한 팔
    p.grid(0, 0, '''
......qqpppqq.........
....qpPPPPPPPpq.......
...qPPPPPPPPPPPq......
..qPPPPPPPPPPPPPq.....
..pPPKKKPPPKKKPPp.....
..pPKKEKKPKKEKKPp.....
..pPPKKKPPPKKKPPp.....
..pPPPKPPPPPKPPPp.....
..qpPPPPPKKPPPPpq.....
...qpPPPKEEKPPpq......
....qqppPKKPppq.......
..qqppPPpppPPppqq.....
.qpPPPqPPPPPqPPPpq....
qpPPPqPPPPPPPqPPPPq...
qPPPPqPPPPPPPqPPPPpq..
qpPPPPqqPPPqqPPPPPpq..
.qpPPPPPPPPPPPPPPpq...
..qqpPPqqpPqqPPpqq....
....qqq...qq..qqq.....
''')


@sprite('piano_ghost', 'char', 24, 38)
def piano_ghost(p):
    # 피아노 앞에 앉은 뒷모습: 짧은 검은 머리, 구부정한 어깨의 검은 양복, 건반 위로 뻗은 피 묻은 손
    p.grid(0, 0, '''
.........KKKKKK.........
.......KKkkkkkKKK.......
......KkkkkkkkkkkK......
......KkkkkkkkkkkK......
......KkkkkkkkkkkK......
.......KkkkkkkkkK.......
........KPPPPPPK........
.........pPPPPp.........
....bbbbbbbbbbbbbbbb....
..bbBBBBBBBBBBBBBBBBbb..
.bBBBBBBBBBBBBBBBBBBBBb.
.bBBBBBBBbBBbBBBBBBBBBb.
bBBBBBBBBBbBbBBBBBBBBBBb
bBBBBBBBBBBbBBBBBBBBBBBb
bBBBBBBBBBBbBBBBBBBBBBBb
bBBBBBBBBBBbBBBBBBBBBBBb
.bBBBBBBBBBbBBBBBBBBBBb.
.bBBBBBBBBBbBBBBBBBBBBb.
.bBBBBBBBBBbBBBBBBBBBBb.
..bBBBBBBBBbBBBBBBBBBb..
..bBBBBBBBBbBBBBBBBBBb..
..bbBBBBBBBbBBBBBBBBbb..
...bbbbbbbbbbbbbbbbbb...
..kkkkkkkkkkkkkkkkkkkk..
..kjjjjjjjjjjjjjjjjjjk..
..kkkkkkkkkkkkkkkkkkkk..
...k................k...
...k................k...
''')
    for x, y in ((1, 9), (2, 8), (21, 8), (22, 9)):  # 어깨 위로 뻗은 손(피)
        p.px(x, y, 'R')
    p.px(0, 8, 'r'); p.px(23, 8, 'r'); p.px(1, 7, 'P'); p.px(22, 7, 'P')


# ---------------------------------------------------------------- 아이템 아이콘(30x30 → 외곽선 32x32 → 4배 128)
@sprite('item_doll', 'icon', 30, 30)
def item_doll(p):
    doll(p, ('a', 'L', 'l'))


@sprite('item_doll_hot', 'icon', 30, 30)
def item_doll_hot(p):
    doll(p, ('O', 'y', 'r'))
    for x, y in ((6, 3), (23, 5), (4, 14), (25, 18)):
        p.px(x, y, 'Y')


@sprite('item_doll_done', 'icon', 30, 30)
def item_doll_done(p):
    doll(p, ('U', 'u', 'm'))
    p.r(12, 21, 6, 1, 'Y')


def doll(p, cols):
    hi, mid, dark = cols
    p.el(9, 2, 12, 12, mid); p.el(10, 3, 9, 8, hi)  # 머리
    p.r(12, 7, 2, 2, dark); p.r(16, 7, 2, 2, dark); p.r(14, 10, 2, 1, dark)
    p.el(6, 12, 18, 16, mid); p.el(8, 13, 12, 12, hi)  # 포대기
    p.ln(9, 17, 21, 23, dark); p.ln(21, 16, 10, 25, dark)
    p.el(7, 13, 5, 5, mid); p.el(18, 13, 5, 5, mid)


@sprite('item_wood_handle', 'icon', 30, 30)
def item_wood_handle(p):
    p.el(4, 4, 20, 20, 'N'); p.el(6, 5, 15, 15, 'M'); p.el(8, 6, 6, 5, 'L')
    p.r(20, 18, 6, 6, 'n'); p.r(23, 21, 6, 6, 'S'); p.r(24, 22, 4, 4, 's')


@sprite('item_videotape', 'icon', 30, 30)
def item_videotape(p):
    p.r(1, 7, 28, 17, 'k'); p.r(1, 7, 28, 1, 'j')
    p.r(4, 10, 22, 7, 'K'); p.el(6, 11, 5, 5, 'w'); p.el(19, 11, 5, 5, 'w')
    p.r(11, 13, 8, 1, 's')
    p.r(4, 19, 22, 3, 'W'); p.r(5, 20, 12, 1, 'a')


@sprite('item_backward_tape', 'icon', 30, 30)
def item_backward_tape(p):
    p.r(2, 7, 26, 17, 'S'); p.r(2, 7, 26, 1, 'T')
    p.r(4, 9, 22, 9, 'W'); p.r(5, 10, 10, 1, 'R')
    p.r(8, 12, 14, 5, 'k'); p.el(9, 13, 4, 4, 'T'); p.el(17, 13, 4, 4, 'T')
    p.r(9, 20, 12, 4, 's'); p.r(11, 21, 2, 2, 'K'); p.r(17, 21, 2, 2, 'K')


@sprite('item_picture_piece', 'icon', 30, 30)
def item_picture_piece(p):
    p.grid(3, 3, '''
WWWWWWWWWWWWWWWW.....
WCCCCCCCCCCCCCCWW....
WCCCCCCCCCCCCCCCWW...
WCCCcCCCCCCYYCCCCW...
WCCcccCCCCCYYCCCCWW..
WCcccccCCCCCCCCCCCW..
WGGGGGGGGGGGGGGGGGWW.
WGGgGGGGGGGGGGgGGGGW.
WGGGGGGGGrrGGGGGGGGW.
WGGGGGGGrRRrGGGGGGGWW
WGGgGGGGGrrGGGGGgGGGW
WGGGGGGGGGGGGGGGGGWW.
WgggGGGGGGGGGGGGGW...
WWWWgGGGGGGGGGGGWW...
...WWWgGGGGGGGWW.....
.....WWWWGGGGWW......
.........WWWW........
''')


@sprite('item_cd', 'icon', 30, 30)
def item_cd(p):
    p.r(2, 2, 24, 24, 'T'); p.r(2, 2, 24, 1, 'W'); p.r(4, 4, 20, 20, 'k')
    p.el(5, 5, 18, 18, 'w'); p.el(7, 7, 14, 14, 'C'); p.el(9, 8, 6, 5, 'D'); p.el(14, 14, 6, 5, 'Y')
    p.el(11, 11, 6, 6, 'w'); p.el(13, 13, 2, 2, 'k')
    p.r(20, 19, 9, 9, 'S'); p.r(22, 22, 5, 4, 's'); p.r(21, 20, 7, 1, 'T')  # 뒷면 열쇠 머리


@sprite('item_pottery', 'icon', 30, 30)
def item_pottery(p):
    p.r(11, 2, 8, 3, 'p'); p.r(12, 3, 6, 1, 'q')
    p.el(5, 5, 20, 22, 'p'); p.el(7, 6, 15, 18, 'P'); p.el(9, 8, 5, 6, 'W')
    p.r(6, 16, 18, 2, 'c')
    for x, y in ((10, 20), (16, 12), (19, 19), (13, 23)):
        p.px(x, y, 'W')
    p.r(9, 26, 12, 2, 'q')


@sprite('item_tablet_earth', 'icon', 30, 30)
def item_tablet_earth(p):
    p.grid(0, 0, '''
..............uu..............
............uuYYuu............
..........uuYYYYYYuu..........
........uuYYYYYYYYYYuu........
......uuYYYYYYYYYYYYYYuu......
....uuYYYYYyyyyyyyYYYYYYuu....
..uuYYYYYyyyyyyyyyyyYYYYYYuu..
.uYYYYYYyyyyyyyyyyyyyyYYYYYYu.
.uYYYYYyyyyyyyyyyyyyyyyYYYYYu.
.uYYYYyyyyyyyyuuyyyyyyyyYYYYu.
..uYYYyyyyyyyyuuyyyyyyyyYYYu..
..uYYYyyyyyyyyuuyyyyyyyyYYYu..
..uYYYyyyyuuuuuuuuuuyyyyYYYu..
..uYYYyyyyuuuuuuuuuuyyyyYYYu..
...uYYyyyyyyyyuuyyyyyyyyYYu...
...uYYyyyyyyyyuuyyyyyyyyYYu...
...uYYyuuuuuuuuuuuuuuuuyYYu...
...uYYyuuuuuuuuuuuuuuuuyYYu...
....uYYyyyyyyyyyyyyyyyyYYu....
....uYYYyyyyyyyyyyyyyyYYYu....
....uYYYYYYYYYYYYYYYYYYYYu....
.....uuuuuuuuuuuuuuuuuuuu.....
''')


@sprite('item_can_coffee', 'icon', 30, 30)
def item_can_coffee(p):
    p.r(9, 2, 12, 2, 'T'); p.r(10, 1, 10, 1, 'S')
    p.r(8, 4, 14, 22, 'N'); p.r(8, 4, 2, 22, 'M'); p.r(20, 4, 2, 22, 'n')
    p.r(8, 10, 14, 9, 'A'); p.r(10, 12, 9, 2, 'n'); p.r(10, 15, 6, 1, 'u')
    p.r(9, 26, 12, 2, 'S')


# ---------------------------------------------------------------- 저장
def render(key):
    fn, kind, w, h, opt = SPR[key]
    p = Pen(w, h)
    fn(p)
    img = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
    img.alpha_composite(p.im, (1, 1))
    return outline(img), kind, opt


def jihyeon_faint():
    """쓰러진 지현: 서 있는 도트(앞모습 0번)를 옆으로 눕힌다"""
    im = Image.open(ROOT / 'assets' / 'sprites' / 'chars_students' / 'jihyeon_down_0.png').convert('RGBA')
    im = im.resize((im.width // 2, im.height // 2), Image.NEAREST).rotate(90, expand=True)
    return im.crop(im.getbbox())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for key in SPR:
        img, kind, opt = render(key)
        k = 4 if kind == 'icon' else 2
        img.resize((img.width * k, img.height * k), Image.NEAREST).save(OUT / f'{key}.png')
        w, h = img.width * k, img.height * k
        if kind == 'icon':
            ax, ay = w // 2, h // 2
        elif kind == 'char':
            ax, ay = w // 2, h - 2
        else:  # 바닥 소품: cells 칸 가운데, 아래 끝이 아래선 4px 위
            ax, ay = -((32 * opt.get('cells', 1) - img.width) // 2) * 2, (img.height + 4) * 2
        meta[key] = {'file': f'props_ch2/{key}.png', 'w': w, 'h': h, 'ax': ax, 'ay': ay}
    jf = jihyeon_faint()
    jf.resize((jf.width * 2, jf.height * 2), Image.NEAREST).save(OUT / 'jihyeon_faint.png')
    meta['jihyeon_faint'] = {'file': 'props_ch2/jihyeon_faint.png', 'w': jf.width * 2, 'h': jf.height * 2, 'ax': jf.width, 'ay': jf.height * 2 - 4}
    json.dump(meta, open(OUT.parent / 'props_ch2.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(meta), '2장 소품·귀신·아이콘')


def preview(path):
    imgs = [render(k)[0] for k in SPR] + [jihyeon_faint()]
    W = sum(i.width + 3 for i in imgs)
    sheet = Image.new('RGBA', (W + 2, max(i.height for i in imgs) + 4), (70, 72, 84, 255))
    x = 2
    for i in imgs:
        sheet.alpha_composite(i, (x, 2))
        x += i.width + 3
    sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(path)


if __name__ == '__main__':
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1])
    else:
        main()
