"""3장(신관, 水) 도트 귀신·바닥 타일·소품·아이템 아이콘 → assets/sprites/props_ch3/ + props_ch3.json
사용: python3 tools/pixel_ch3.py [--preview 파일.png]
  - 게임 픽셀 = 도트 1칸, 2배 최근접 확대로 저장(아이콘은 4배 = 128px). 바깥 1px 외곽선 자동(pixel_chars.outline)
  - 바닥 소품(floor): cells 칸 너비 가운데, 아래 끝이 칸 아래선 4px 위(tools/pixel_props.py·pixel_ch2.py 와 같은 규칙)
  - 벽 소품(wall): cells 칸 너비 가운데, 위 끝이 벽 아래선에서 top px 위(벽 앞면 32px 안, pixel_props.py 벽걸이와 같은 규칙)
  - 바닥 데칼(decal): cells x rows 칸 한가운데(바닥 소품처럼 floor: true 로 놓는다). speaker_target 은 스피커와 같은 바닥 소품 앵커
  - 바닥 타일(tile): 32x24, 외곽선 없음, 앵커 = 왼쪽 아래(tiles/floor_* 와 같음: c*32, (r+1)*24 에 그린다)
  - 귀신·움직이는 것(char): 앵커 = 발(몸) 아래 가운데(외곽선 포함 그림 아래 끝에서 1px 위, pixel_ch2.py 와 같음)"""
import json
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'sprites' / 'props_ch3'
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pixel_chars import outline  # noqa: E402

C = {
    # pixel_ch2.py 와 같은 기본색
    'K': (20, 18, 22), 'k': (44, 40, 46), 'j': (64, 60, 68),
    'W': (236, 234, 226), 'w': (196, 194, 186), 'A': (210, 202, 182), 'a': (160, 152, 134),
    'S': (150, 156, 162), 's': (104, 108, 116), 'T': (178, 182, 188), 't': (78, 82, 90),
    'N': (126, 84, 52), 'n': (86, 56, 34), 'M': (164, 118, 78), 'm': (60, 38, 24),
    'R': (186, 40, 44), 'r': (120, 22, 26), 'Y': (240, 196, 80), 'y': (220, 120, 40), 'O': (255, 150, 60),
    'G': (92, 124, 108), 'g': (62, 88, 76), 'D': (150, 210, 170), 'B': (44, 54, 92), 'b': (28, 34, 60),
    'C': (120, 150, 190), 'c': (70, 92, 124), 'P': (206, 212, 214), 'p': (150, 158, 166), 'q': (110, 118, 128),
    'E': (12, 10, 14), 'L': (120, 96, 72), 'l': (96, 74, 54), 'U': (176, 100, 60), 'u': (130, 70, 40),
    # 3장 추가: 머리카락·물·수영장 타일·자주·놋쇠·카드
    'H': (18, 18, 24), 'h': (6, 6, 10), 'F': (40, 40, 52),
    '1': (24, 62, 72), '2': (34, 82, 92), '3': (66, 124, 130), '4': (124, 180, 178),
    '5': (150, 182, 190), '6': (138, 170, 180), '7': (104, 128, 138), '8': (122, 132, 112), '9': (96, 104, 92),
    'V': (104, 70, 112), 'v': (66, 42, 74), 'X': (64, 112, 196), 'x': (40, 70, 140),
    'Z': (184, 150, 72), 'z': (132, 100, 44), 'I': (176, 206, 232), 'i': (112, 144, 190),
    'Q': (232, 226, 206, 220), 'J': (196, 222, 250, 170), 'f': (170, 200, 240, 110), '_': (0, 0, 0, 0),
}

SPR = {}  # 키 → (그리기 함수, 종류, 너비, 높이, 옵션)


def sprite(key, kind, w, h, **opt):
    def deco(fn):
        SPR[key] = (fn, kind, w, h, opt)
        return fn
    return deco


def col(c):
    v = C[c]
    return v if len(v) == 4 else v + (255,)


class Pen:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def r(self, x, y, w, h, c):  # 채운 사각형 (x, y, 너비, 높이)
        if w > 0 and h > 0:
            self.d.rectangle([x, y, x + w - 1, y + h - 1], fill=col(c))

    def box(self, x, y, w, h, c):  # 1px 테두리 사각형
        self.d.rectangle([x, y, x + w - 1, y + h - 1], outline=col(c))

    def px(self, x, y, c):
        if 0 <= x < self.im.width and 0 <= y < self.im.height:
            self.im.putpixel((x, y), col(c))

    def ln(self, x0, y0, x1, y1, c, w=1):
        self.d.line([x0, y0, x1, y1], fill=col(c), width=w)

    def el(self, x, y, w, h, c):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], fill=col(c))

    def ring(self, x, y, w, h, c):
        self.d.ellipse([x, y, x + w - 1, y + h - 1], outline=col(c))

    def poly(self, pts, c):
        self.d.polygon(pts, fill=col(c))

    def grid(self, x0, y0, s):
        for y, row in enumerate(s.strip('\n').split('\n')):
            for x, ch in enumerate(row):
                if ch != '.':
                    self.px(x0 + x, y0 + y, ch)


def desk_body(p, x, y, w, top=7, front=12):
    """3/4 시점 나무 책상: 윗면(밝은 나무) + 앞면(서랍) + 다리 (pixel_ch2.py 와 같음)"""
    p.r(x, y, w, top, 'M')
    p.r(x, y, w, 1, 'L')
    p.r(x, y + top, w, front, 'N')
    p.r(x, y + top, w, 1, 'n')
    for dx in (3, w // 2 + 2):
        p.r(x + dx, y + top + 3, w // 2 - 6, 4, 'n')
        p.r(x + dx + w // 4 - 4, y + top + 4, 3, 1, 'Y')
    p.r(x + 1, y + top + front, 3, 4, 'n')
    p.r(x + w - 4, y + top + front, 3, 4, 'n')


def table_body(p, x, y, w, top=8, apron=3, legs=10):
    """다리 네 개 짜리 3/4 시점 탁자(서랍 없음)"""
    p.r(x, y, w, top, 'M'); p.r(x, y, w, 1, 'L'); p.r(x + 1, y + top - 1, w - 2, 1, 'N')
    p.r(x, y + top, w, apron, 'N'); p.r(x, y + top + apron - 1, w, 1, 'n')
    for lx in (x + 1, x + w - 4):
        p.r(lx, y + top + apron, 3, legs, 'n'); p.r(lx, y + top + apron, 1, legs, 'N')
    for lx in (x + 6, x + w - 9):
        p.r(lx, y + top + apron, 3, legs - 3, 'm')


def headphones(p, x, y, c='k', pad='K'):
    """위에서 본 헤드폰: 머리띠 반원 + 귀컵 둘 (폭 10, 높이 7)"""
    p.ln(x + 1, y + 3, x + 2, y + 1, c); p.r(x + 3, y, 4, 1, c); p.ln(x + 7, y + 1, x + 8, y + 3, c)
    p.r(x, y + 3, 3, 4, pad); p.r(x + 7, y + 3, 3, 4, pad); p.px(x + 1, y + 4, 'j'); p.px(x + 8, y + 4, 'j')


# ================================================================ B. 귀신·움직이는 것
def limb(p, pts, c_up, c_lo):
    """2px 굵기 팔다리: 어깨/엉덩이 → 팔꿈치/무릎(c_up) → 손/발(c_lo)"""
    p.ln(*pts[0], *pts[1], c_up, 2); p.ln(*pts[1], *pts[2], c_lo, 2)
    p.r(pts[1][0] - 1, pts[1][1] - 1, 2, 2, c_up)


def spider_body(p, f):
    # 천장을 기는 소녀(위에서 내려다봄): f=0 왼팔·오른다리 앞, f=1 오른팔·왼다리 앞
    la, ra = (0, 5) if f == 0 else (5, 0)  # 손이 뒤로 처지는 정도
    ll, rl = (5, 0) if f == 0 else (0, 5)  # 발이 앞으로 오는 정도
    limb(p, [(15, 11), (6, 9 + la // 2), (5, 3 + la)], 'B', 'P')  # 왼팔(소매 → 팔뚝)
    limb(p, [(22, 11), (31, 9 + ra // 2), (32, 3 + ra)], 'B', 'P')  # 오른팔
    for hx, hy in ((5, 3 + la), (32, 3 + ra)):  # 벌린 손가락
        p.r(hx - 1, hy - 1, 3, 2, 'P'); p.px(hx - 2, hy - 2, 'p'); p.px(hx, hy - 3, 'p'); p.px(hx + 2, hy - 2, 'p'); p.px(hx, hy - 2, 'P')
    limb(p, [(16, 23), (7, 22 - ll // 2), (5, 28 - ll)], 'p', 'P')  # 왼다리
    limb(p, [(21, 23), (30, 22 - rl // 2), (32, 28 - rl)], 'p', 'P')  # 오른다리
    for fx, fy in ((5, 28 - ll), (32, 28 - rl)):  # 흰 양말 + 검은 구두
        p.r(fx - 1, fy - 1, 3, 1, 'w'); p.r(fx - 1, fy, 3, 2, 'K')
    p.r(14, 19, 10, 6, 'k'); p.r(13, 21, 12, 4, 'k')  # 주름치마
    for x in (15, 18, 21):
        p.r(x, 20, 1, 5, 'j')
    p.r(15, 8, 8, 12, 'B'); p.r(14, 10, 10, 9, 'B'); p.r(14, 10, 1, 9, 'b'); p.r(23, 10, 1, 9, 'b')  # 세라복 등
    p.r(14, 9, 10, 8, 'b'); p.r(14, 16, 10, 1, 'W'); p.r(14, 9, 1, 8, 'W'); p.r(23, 9, 1, 8, 'W')  # 네모난 등 깃(흰 줄)
    p.el(14, 0, 10, 9, 'H'); p.el(16, 1, 5, 3, 'F'); p.r(17, 1, 3, 1, 'j')  # 정수리
    for x0, x1, l in ((15, 11, 13), (16, 13, 15), (17, 15, 14), (18, 17, 12), (20, 21, 13), (21, 23, 15), (22, 25, 14), (23, 27, 11), (16, 9, 9), (22, 29, 9)):
        l += (f if x0 % 2 else -f)  # 어깨·등으로 흩어져 늘어진 머리카락
        p.ln(x0, 5, x1, l, 'H'); p.px(x1, l, 'h')
    p.r(15, 5, 8, 5, 'H')


@sprite('spider_girl_0', 'char', 38, 30)
def spider_girl_0(p):
    spider_body(p, 0)


@sprite('spider_girl_1', 'char', 38, 30)
def spider_girl_1(p):
    spider_body(p, 1)


@sprite('spider_girl_drop', 'char', 30, 38)
def spider_girl_drop(p):
    # 천장에서 떨어져 웅크린 소녀(앞모습): 숙인 머리, 얼굴을 덮고 바닥까지 늘어진 머리, 바닥을 짚은 손, 세운 무릎, 세라복
    p.r(9, 21, 12, 11, 'k'); p.r(11, 21, 1, 11, 'j'); p.r(18, 21, 1, 11, 'j')  # 무릎 사이 치마
    p.r(5, 8, 20, 9, 'B'); p.r(6, 16, 18, 5, 'B'); p.r(5, 8, 1, 9, 'b'); p.r(24, 8, 1, 9, 'b')  # 앞으로 숙인 몸
    p.ln(5, 9, 10, 7, 'W'); p.ln(24, 9, 19, 7, 'W')  # 어깨 깃 줄
    for x0, sx, hx in ((6, 3, 0), (21, 25, 25)):
        p.r(sx, 9, 2, 19, 'B'); p.r(sx if sx < 10 else sx + 1, 9, 1, 19, 'b')  # 늘어뜨린 소매
        p.r(sx, 28, 2, 3, 'P')
        p.r(hx, 31, 5, 2, 'P'); p.r(hx, 32, 5, 1, 'p')  # 바닥을 짚은 손(손가락 벌림)
        for i in range(3):
            p.px(hx + i * 2, 33, 'p')
        p.el(x0 - 1, 15, 5, 5, 'P'); p.px(x0, 16, 'W')  # 세운 무릎
        p.r(x0, 18, 3, 13, 'P'); p.r(x0 + 2 if x0 < 10 else x0, 19, 1, 12, 'p')  # 정강이
        p.r(x0, 31, 3, 1, 'w'); p.r(x0 - 1, 32, 5, 3, 'K'); p.r(x0, 32, 3, 1, 'j')
    p.el(9, 0, 12, 12, 'H'); p.el(11, 1, 6, 4, 'F'); p.r(12, 1, 3, 1, 'j')  # 숙인 정수리
    for x, l in ((9, 22), (10, 27), (11, 30), (12, 33), (13, 30), (14, 34), (15, 32), (16, 34), (17, 29), (18, 31), (19, 27), (20, 21)):
        p.r(x, 8, 1, l - 8, 'H')  # 얼굴을 덮고 늘어진 머리
        p.px(x, l, 'h')
    p.r(14, 14, 2, 4, 'p'); p.px(14, 15, 'E'); p.px(15, 15, 'R'); p.px(15, 20, 'r')  # 머리카락 틈의 창백한 얼굴·한쪽 눈


def mermaid_body(p, f):
    p.el(8, 15, 22, 11, 'P'); p.r(8, 20, 22, 6, 'P'); p.r(9, 22, 20, 4, 'p')  # 어깨·가슴(물 위)
    p.r(16, 13, 6, 4, 'p')  # 목
    p.el(14, 3, 10, 12, 'P'); p.r(15, 11, 8, 2, 'P'); p.r(16, 13, 6, 1, 'p')  # 얼굴
    p.r(15, 8, 3, 2, 'E'); p.r(20, 8, 3, 2, 'E'); p.px(16, 10, 'q'); p.px(21, 10, 'q')  # 검게 꺼진 눈
    p.r(18, 12, 2, 1, 'q')
    p.el(12, 0, 14, 8, 'H'); p.r(12, 4, 3, 14, 'H'); p.r(23, 4, 3, 14, 'H')  # 젖어 달라붙은 머리
    p.r(18, 3, 1, 5, 'H'); p.r(15, 4, 2, 3, 'H'); p.r(21, 4, 2, 2, 'H'); p.px(19, 3, 'h')  # 이마로 흘러내린 가닥
    for x, y0, l in ((10, 15, 25), (11, 14, 26), (13, 15, 25), (14, 16, 22), (24, 16, 23), (25, 15, 26), (27, 14, 25), (28, 15, 24)):
        p.r(x, y0, 1, l - y0, 'H')  # 어깨에 달라붙어 물속으로 늘어진 머리
    p.px(16, 20, 'H'); p.px(17, 21, 'H'); p.px(22, 19, 'H')
    p.r(13, 1, 4, 1, 'F'); p.px(12, 3, 'F')
    if f == 0:  # 오른쪽 뒤에서 솟은 꼬리지느러미
        p.poly([(31, 20), (32, 13), (34, 13), (34, 20)], '9')
        p.poly([(33, 14), (28, 6), (31, 6), (34, 11)], '8'); p.poly([(33, 14), (37, 4), (37, 9), (34, 13)], '8')
        p.ln(33, 13, 29, 7, '9'); p.ln(34, 12, 36, 6, '9')


def mermaid_ripples(p, f):
    """물결 고리(외곽선 없이 물 타일 위에 겹침)"""
    k = f * 2
    p.ring(1 - k // 2, 18 - k // 2, 36 + k, 11 + k // 2, '3'); p.ring(5, 20, 28, 8, '4')
    for x, y in ((3, 23), (34, 22), (1 + k, 27), (32 - k, 28)):
        p.px(x, y, '4')


C['wv'] = (34, 82, 92, 210)


def mermaid_water(p, f):
    """수면: 몸 아래쪽을 물에 잠기게 + 물보라"""
    p.r(6, 23, 26, 7, 'wv'); p.r(4, 25, 30, 5, 'wv')
    for x, n in ((6, 5), (14, 4), (21, 6), (29, 3)):
        p.r(x, 23 + (x % 2), n, 1, '3')
    p.px(12, 23, '4'); p.px(26, 24, '4')
    if f == 0:
        p.r(30, 20, 6, 2, 'wv'); p.r(30, 20, 6, 1, '3')
        for x, y in ((29, 9), (37, 2), (35, 1), (27, 4)):
            p.px(x, y, '4')
    else:  # 꼬리가 잠긴 자리의 물보라
        p.r(30, 18, 7, 2, '3'); p.r(32, 17, 3, 1, '4')
        for x, y in ((29, 14), (31, 12), (34, 13), (36, 15), (33, 10), (30, 9), (37, 11)):
            p.px(x, y, '4')


@sprite('mermaid_0', 'char', 38, 30, under=lambda p: mermaid_ripples(p, 0), over=lambda p: mermaid_water(p, 0))
def mermaid_0(p):
    mermaid_body(p, 0)


@sprite('mermaid_1', 'char', 38, 30, under=lambda p: mermaid_ripples(p, 1), over=lambda p: mermaid_water(p, 1))
def mermaid_1(p):
    mermaid_body(p, 1)


@sprite('mermaid_dead', 'char', 46, 22)
def mermaid_dead(p):
    # 물 빠진 바닥에 말라 쓰러진 인어: 왼쪽 머리(옆으로 누움), 잿빛 몸, 비늘 꼬리
    for x, y in ((0, 9), (1, 14), (2, 5), (0, 12), (3, 17)):  # 바닥에 흩어진 마른 머리카락
        p.ln(x + 7, y, x, y + 3, 'H')
    p.el(3, 4, 12, 14, 'H')
    p.el(7, 7, 8, 9, 'q'); p.r(8, 9, 3, 1, 'E'); p.r(8, 13, 3, 1, 'E'); p.px(12, 11, 's')  # 감은 눈·입
    p.el(13, 5, 15, 12, 'q'); p.r(15, 6, 10, 2, 'p'); p.r(15, 14, 11, 2, 's')  # 몸통
    p.ln(16, 15, 12, 19, 'q', 2); p.r(8, 19, 5, 2, 'p'); p.px(7, 20, 's')  # 바닥으로 뻗은 팔
    p.poly([(25, 6), (38, 8), (38, 15), (25, 16)], '9')  # 꼬리
    for x in range(26, 38, 3):
        for y in range(8, 16, 2):
            p.px(x + (y // 2) % 2, y, '8')
    p.r(25, 11, 13, 1, 's')
    p.poly([(38, 9), (45, 3), (43, 11), (45, 19), (38, 14)], '8'); p.ln(39, 10, 44, 5, '9'); p.ln(39, 13, 44, 17, '9')  # 꼬리지느러미
    p.px(42, 8, 'E'); p.px(43, 14, 'E')  # 찢긴 지느러미


HAND = {
    0: '''
.q.q.q...
.P.P.Pq..
.PpPpPPq.
qPPPPPPPq
qPPPPPPp.
.pPPPPPq.
..PPPPp..
..pPPPp..
..pPPPp..
..qPPPq..
..qPPPq..
..qpPpq..
..qpPpq..
''',
    1: '''
p..P.P...
P.pP.P.p.
P.PP.PpP.
PpPPpPPP.
pPPPPPPPq
.PPPPPPq.
.qPPPPPq.
..PPPPp..
..pPPPp..
..pPPPp..
..qPPPq..
..qPPPq..
..qpPpq..
..qpPpq..
..qpPpq..
''',
}


def ankle_hands(p, f):
    # 바닥 금에서 솟아 발목을 잡으려는 잿빛 손 두 개: f=0 손가락 오므림, f=1 펼쳐서 더 높이
    g = HAND[f]
    h = len(g.strip('\n').split('\n'))
    p.grid(2, 15 - h, g)
    flipped = '\n'.join(row[::-1] for row in g.strip('\n').split('\n'))
    p.grid(12, 16 - h + (1 - f), flipped)
    for pts in (((0, 15), (4, 14), (9, 15), (13, 14), (17, 15), (21, 14)),):  # 바닥 금(틈)
        for a, b in zip(pts, pts[1:]):
            p.ln(*a, *b, 'E', 2)
    p.r(2, 15, 18, 2, 'E'); p.r(0, 16, 22, 1, 'E')
    p.px(0, 17, 'k'); p.px(21, 17, 'k'); p.r(5, 17, 3, 1, 'k'); p.r(15, 17, 2, 1, 'k'); p.px(10, 17, 'E')


@sprite('ankle_hands_0', 'char', 22, 18)
def ankle_hands_0(p):
    ankle_hands(p, 0)


@sprite('ankle_hands_1', 'char', 22, 18)
def ankle_hands_1(p):
    ankle_hands(p, 1)


C['_e'] = (30, 4, 10, 120)  # 번진 가장자리(반투명)


def orb(p, f):
    # 검은 구슬 + 붉은 심, 가장자리 번짐(외곽선 없음)
    p.el(0, 0, 10, 10, '_e'); p.el(1, 1, 8, 8, 'K'); p.el(2, 2, 6, 6, 'E')
    p.el(3, 3, 4, 4, 'r' if f == 0 else 'R'); p.r(4, 4, 2, 2, 'R' if f == 0 else 'O')
    p.px(3, 2, 'j')


@sprite('orb_0', 'char', 10, 10, line=False)
def orb_0(p):
    orb(p, 0)


@sprite('orb_1', 'char', 10, 10, line=False)
def orb_1(p):
    orb(p, 1)


# ================================================================ C. 바닥 타일(32x24, 외곽선 없음, 이어 붙여도 이음매가 맞게)
C.update({'st': (132, 158, 160), 'w0': (31, 76, 86), 'v0': (11, 11, 15), 'v1': (19, 20, 26), 'v2': (15, 15, 20)})


@sprite('floor_pool', 'tile', 32, 24)
def floor_pool(p):
    p.r(0, 0, 32, 24, '2')
    for x in (0, 8, 16, 24):  # 물 아래로 희미한 타일 줄눈
        p.r(x, 0, 1, 24, 'w0')
    for y in (0, 8, 16):
        p.r(0, y, 32, 1, 'w0')
    for pts in (((2, 5), (7, 5), (9, 4), (12, 4)), ((15, 13), (19, 13), (21, 12), (25, 12), (26, 13)), ((27, 20), (31, 20)), ((0, 20), (3, 20), (5, 19), (8, 19))):
        for a, b in zip(pts, pts[1:]):  # 잔물결(긴 물결 선)
            p.ln(*a, *b, '3')
    p.r(4, 6, 3, 1, '1'); p.r(17, 14, 3, 1, '1'); p.r(1, 21, 3, 1, '1')  # 물결 그늘
    for x, y in ((10, 4), (22, 12), (6, 19)):
        p.px(x, y, '4')


@sprite('floor_pooldry', 'tile', 32, 24)
def floor_pooldry(p):
    p.r(0, 0, 32, 24, '5')
    for x, y in ((8, 0), (16, 8), (0, 16), (24, 16)):  # 조금 더 바랜 타일
        p.r(x, y, 7, 7, '6')
    for x in (7, 15, 23, 31):
        p.r(x, 0, 1, 24, '7')
    for y in (7, 15, 23):
        p.r(0, y, 32, 1, '7')
    p.r(2, 10, 5, 2, 'st'); p.r(3, 9, 3, 1, 'st'); p.r(4, 12, 4, 1, 'st'); p.px(8, 11, 'st')  # 물 마른 얼룩
    p.r(17, 6, 5, 1, '8'); p.r(15, 7, 1, 2, '8'); p.px(19, 5, 'st')  # 줄눈을 따라 낀 물때
    p.r(27, 21, 3, 1, 'st'); p.px(31, 18, '8'); p.px(31, 19, '8')
    p.r(12, 12, 2, 1, '6'); p.px(13, 13, '7')  # 이 빠진 타일


@sprite('floor_void', 'tile', 32, 24)
def floor_void(p):
    p.r(0, 0, 32, 24, 'v0')
    p.r(0, 14, 32, 1, 'v1'); p.r(10, 0, 1, 24, 'v2')  # 아래층 바닥선
    for x in (2, 10, 18, 26):  # 아래층 난간 그림자
        p.r(x, 5, 1, 3, 'v2')
    p.r(0, 8, 32, 1, 'v2')


def rail_h(p, y):
    """가로 난간: 손잡이(y..y+2) + 기둥 + 아래 가로대(y+9)"""
    p.r(0, y, 32, 1, 'T'); p.r(0, y + 1, 32, 1, 'S'); p.r(0, y + 2, 32, 1, 's')
    for x in (4, 12, 20, 28):
        p.r(x, y + 3, 1, 6, 'S'); p.r(x + 1, y + 3, 1, 6, 's')
    p.r(0, y + 8, 32, 1, 's')


def rail_v(p, x):
    """세로 난간(위에서 본 손잡이 + 기둥 머리)"""
    p.r(x, 0, 1, 24, 'T'); p.r(x + 1, 0, 1, 24, 'S'); p.r(x + 2, 0, 1, 24, 's')
    for y in (4, 12, 20):
        p.r(x - 1, y, 5, 2, 'T'); p.r(x - 1, y + 2, 5, 2, 's')


@sprite('rail_top', 'tile', 32, 24, rail=True)
def rail_top(p):
    rail_h(p, 0)


@sprite('rail_bottom', 'tile', 32, 24, rail=True)
def rail_bottom(p):
    rail_h(p, 13)


@sprite('rail_left', 'tile', 32, 24, rail=True)
def rail_left(p):
    rail_v(p, 1)


@sprite('rail_right', 'tile', 32, 24, rail=True)
def rail_right(p):
    rail_v(p, 28)


# ================================================================ D. 소품 — 1층 역사관
def glass(p, x, y, w, h, a=70):
    """진열장 유리: 안쪽 그림 위에 옅은 청백 막 + 비스듬한 반사광"""
    ov = Image.new('RGBA', p.im.size, (0, 0, 0, 0))
    ImageDraw.Draw(ov).rectangle([x, y, x + w - 1, y + h - 1], fill=(170, 200, 230, a))
    p.im.alpha_composite(ov)
    for i in range(0, w - 6, 26):
        p.ln(x + i + 2, y + h - 2, x + i + 7, y + 1, 'W')


def school_model(p, card):
    p.r(0, 27, 60, 13, 'N'); p.r(0, 27, 60, 2, 'M'); p.r(0, 27, 60, 1, 'L')  # 받침 장
    p.r(3, 31, 25, 6, 'n'); p.r(32, 31, 25, 6, 'n'); p.r(26, 33, 2, 2, 'Y'); p.r(32, 33, 2, 2, 'Y')
    p.r(0, 38, 60, 2, 'm')
    p.r(2, 5, 56, 22, 'E')  # 진열장 안(어두움)
    p.r(4, 19, 52, 7, 'g'); p.r(4, 19, 52, 1, 'G')  # 모형 판(잔디)
    p.r(6, 13, 22, 9, 'W'); p.r(6, 13, 22, 2, 'P'); p.r(6, 20, 22, 2, 'w')  # 본관
    for x in range(8, 27, 3):
        p.px(x, 16, 'q'); p.px(x, 18, 'q')
    p.r(31, 9, 13, 13, 'W'); p.r(31, 9, 13, 2, 'P'); p.r(31, 20, 13, 2, 'w')  # 신관(높음)
    for x in range(33, 43, 3):
        for y in (12, 14, 16):
            p.px(x, y, 'q')
    p.el(46, 12, 9, 6, 'P'); p.r(46, 15, 9, 7, 'W'); p.r(46, 20, 9, 2, 'w'); p.r(49, 17, 3, 4, 'q')  # 강당(둥근 지붕)
    p.r(28, 21, 3, 1, 'a'); p.r(44, 21, 2, 1, 'a')  # 이어진 복도
    glass(p, 2, 5, 56, 22)
    p.r(2, 5, 56, 1, 'T'); p.r(2, 10, 56, 1, 'S'); p.r(2, 26, 56, 1, 'S')  # 금속 테
    p.r(2, 5, 1, 22, 'T'); p.r(57, 5, 1, 22, 'S'); p.r(29, 10, 1, 17, 's')
    if card:  # 진열장 위 노란 카드키
        p.r(35, 5, 11, 5, 'Y'); p.r(35, 9, 11, 1, 'y'); p.r(37, 6, 4, 2, 'W'); p.px(44, 6, 'K')


@sprite('school_model', 'floor', 60, 40, cells=2)
def school_model_s(p):
    school_model(p, True)


@sprite('school_model_taken', 'floor', 60, 40, cells=2)
def school_model_taken(p):
    school_model(p, False)


def sailor_top(p, x, y, w, h):
    """옛 교복(세라복) 윗도리: 남색 + 흰 깃 줄 + 붉은 스카프"""
    p.r(x, y, w, h, 'B'); p.r(x, y, 1, h, 'b'); p.r(x + w - 1, y, 1, h, 'b')
    p.ln(x + 1, y, x + w // 2 - 1, y + 4, 'W'); p.ln(x + w - 2, y, x + w // 2, y + 4, 'W')
    p.r(x + w // 2 - 1, y + 4, 2, 3, 'R'); p.px(x + w // 2 - 2, y + 7, 'r'); p.px(x + w // 2 + 1, y + 7, 'r')


@sprite('mannequin', 'floor', 16, 44)
def mannequin(p):
    p.el(1, 39, 14, 5, 's'); p.el(2, 39, 12, 3, 'S')  # 받침
    p.r(5, 26, 2, 11, 'P'); p.r(9, 26, 2, 11, 'P'); p.r(10, 26, 1, 11, 'p'); p.r(6, 26, 1, 11, 'p')  # 다리
    p.r(5, 37, 2, 2, 'K'); p.r(9, 37, 2, 2, 'K'); p.r(7, 37, 2, 4, 't')  # 구두·지지대
    p.poly([(3, 26), (12, 26), (13, 19), (2, 19)], 'k'); p.r(5, 20, 1, 6, 'j'); p.r(9, 20, 1, 6, 'j')  # 주름치마
    sailor_top(p, 2, 9, 12, 11)
    p.r(0, 10, 2, 5, 'B'); p.r(14, 10, 2, 5, 'B'); p.r(0, 15, 2, 6, 'P'); p.r(14, 15, 2, 6, 'p')  # 팔
    p.r(7, 7, 2, 3, 'p')  # 목
    p.el(4, 0, 8, 9, 'P'); p.r(10, 2, 1, 5, 'p'); p.px(9, 7, 'p'); p.px(5, 2, 'W')  # 얼굴 없는 머리


def glass_shards(p):
    """바닥에 흩어진 깨진 유리 조각(외곽선 없음)"""
    for x, y, w in ((2, 18, 4), (12, 21, 3), (39, 20, 5), (50, 21, 3), (56, 16, 3), (28, 22, 4), (6, 13, 2), (45, 3, 3), (33, 1, 2)):
        p.ln(x, y, x + w, y - 1, 'I'); p.px(x + 1, y, 'W'); p.px(x + w - 1, y + 1, 'i')
    p.poly([(52, 8), (58, 6), (57, 12)], 'J'); p.ln(52, 8, 58, 6, 'W')  # 큰 유리 파편


@sprite('mannequin_fallen', 'floor', 60, 24, cells=2, over=glass_shards)
def mannequin_fallen(p):
    p.el(3, 7, 10, 9, 'P'); p.r(4, 13, 8, 2, 'p'); p.px(5, 8, 'W'); p.px(6, 8, 'W')  # 누운 머리(얼굴 없음)
    p.r(12, 10, 3, 3, 'p')  # 목
    sail = [(15, 6), (28, 6), (28, 17), (15, 17)]
    p.poly(sail, 'B'); p.r(15, 6, 14, 1, 'c'); p.r(15, 16, 14, 1, 'b')  # 세라복(옆으로 누움)
    p.ln(15, 7, 20, 11, 'W'); p.ln(15, 15, 20, 11, 'W'); p.r(20, 10, 3, 3, 'R'); p.px(23, 13, 'r')
    p.r(17, 17, 10, 2, 'B'); p.r(27, 17, 3, 2, 'P'); p.px(30, 18, 'p')  # 몸 옆으로 뻗은 팔
    p.poly([(28, 5), (38, 3), (38, 18), (28, 17)], 'k'); p.r(31, 5, 1, 12, 'j'); p.r(35, 4, 1, 14, 'j')  # 치마
    p.r(38, 6, 12, 3, 'P'); p.r(38, 8, 12, 1, 'p'); p.r(38, 11, 10, 3, 'P'); p.r(38, 13, 10, 1, 'p')  # 다리
    p.r(50, 5, 3, 4, 'K'); p.r(48, 10, 3, 4, 'K')  # 구두
    p.r(40, 15, 9, 2, 'P'); p.r(40, 16, 9, 1, 'p'); p.r(38, 15, 2, 2, 'B')  # 떨어져 나간 팔


@sprite('glass_case', 'floor', 26, 40)
def glass_case(p):
    p.r(0, 27, 26, 13, 'N'); p.r(0, 27, 26, 2, 'M'); p.r(0, 27, 26, 1, 'L'); p.r(3, 31, 20, 6, 'n'); p.r(12, 33, 2, 2, 'Y')
    p.r(0, 38, 26, 2, 'm')
    p.r(1, 4, 24, 23, 'E'); p.r(2, 22, 22, 4, 'v'); p.r(2, 22, 22, 1, 'V')  # 안쪽 + 벨벳 바닥
    p.el(3, 9, 9, 6, 'Y'); p.r(4, 9, 7, 2, 'z'); p.r(2, 10, 2, 3, 'y'); p.r(11, 10, 2, 3, 'y')  # 트로피 컵
    p.r(6, 15, 3, 4, 'y'); p.r(4, 19, 7, 3, 'n'); p.r(5, 20, 5, 1, 'Y')
    p.r(14, 7, 9, 11, 'L'); p.r(15, 8, 7, 9, 'a'); p.r(16, 9, 5, 4, 'U'); p.el(17, 9, 3, 3, 'A'); p.r(16, 13, 5, 3, 'l')  # 옛 사진 액자
    p.r(15, 19, 8, 3, 'Z'); p.r(16, 20, 6, 1, 'z')  # 상패
    glass(p, 1, 4, 24, 23)
    p.r(1, 4, 24, 1, 'T'); p.r(1, 8, 24, 1, 'S'); p.r(1, 4, 1, 23, 'T'); p.r(24, 4, 1, 23, 'S')


# ---------------------------------------------------------------- 벽 소품(벽 앞면)
@sprite('history_board', 'wall', 58, 22, cells=2, top=28)
def history_board(p):
    p.r(0, 0, 58, 22, 'n'); p.r(1, 1, 56, 20, 'N'); p.r(2, 2, 54, 18, 'A')
    p.r(2, 2, 54, 4, 'm'); p.r(19, 3, 20, 2, 'Z')  # 제목 판
    p.r(4, 13, 50, 1, 'n')  # 연표 줄
    for i, x in enumerate((5, 15, 25, 35, 45)):
        p.r(x, 7, 8, 5, 'a'); p.r(x + 1, 8, 6, 3, 'L' if i % 2 else 'l'); p.px(x + 3, 8, 'A')  # 옛 사진
        p.r(x + 3, 12, 2, 3, 'n'); p.r(x, 16, 8, 1, 'a'); p.r(x + 1, 18, 5, 1, 'a')  # 연도 점 + 글줄


def elock(p, band):
    p.r(0, 0, 9, 13, 'k'); p.r(0, 0, 9, 1, 'j'); p.r(8, 1, 1, 12, 'K')
    p.r(1, 2, 7, 2, band)  # 색 띠
    p.r(2, 6, 5, 1, 'E'); p.r(2, 7, 5, 1, 'j')  # 카드 투입구
    p.px(6, 10, 'R'); p.px(2, 10, 's')  # 작은 LED


@sprite('elock_yellow', 'wall', 9, 13, top=24)
def elock_yellow(p):
    elock(p, 'Y')


@sprite('elock_red', 'wall', 9, 13, top=24)
def elock_red(p):
    elock(p, 'R')


@sprite('elock_blue', 'wall', 9, 13, top=24)
def elock_blue(p):
    elock(p, 'X')


# ---------------------------------------------------------------- 2층 무용실
C.update({'m0': (30, 36, 54), 'm1': (44, 52, 74), 'm2': (70, 84, 110), 'm3': (150, 170, 196)})


def mirror(p, crack):
    p.r(0, 0, 124, 28, 'S'); p.r(0, 0, 124, 1, 'T'); p.r(0, 27, 124, 1, 's'); p.r(0, 0, 1, 28, 'T'); p.r(123, 0, 1, 28, 's')
    p.r(2, 2, 120, 24, 'm0')
    p.r(2, 15, 120, 11, 'm1')  # 비친 바닥
    for x in range(6, 120, 30):  # 비스듬한 반사광
        p.ln(x, 24, x + 10, 3, 'm2', 2); p.ln(x + 5, 24, x + 13, 7, 'm2')
    p.r(2, 2, 120, 1, 'm2')
    if crack >= 1:  # 한 줄 금
        pts = [(30, 2), (36, 8), (34, 12), (44, 17), (47, 25)]
        for a, b in zip(pts, pts[1:]):
            p.ln(*a, *b, 'm3')
        p.ln(36, 8, 40, 6, 'm3')
    if crack >= 2:  # 거미줄 금
        cx, cy = 82, 13
        for ex, ey in ((70, 2), (94, 2), (106, 10), (102, 25), (78, 25), (62, 18), (60, 6), (90, 25)):
            p.ln(cx, cy, ex, ey, 'm3')
        for rx, ry in ((6, 4), (12, 8)):
            pts = [(cx - rx, cy), (cx - rx // 2, cy - ry), (cx + rx // 2, cy - ry), (cx + rx, cy), (cx + rx // 2, cy + ry), (cx - rx // 2, cy + ry), (cx - rx, cy)]
            for a, b in zip(pts, pts[1:]):
                p.ln(*a, *b, 'm3')
        p.px(cx, cy, 'W')
    if crack >= 3:  # 깨져 떨어진 구멍(뒤는 검정)
        p.poly([(74, 6), (80, 3), (86, 7), (91, 5), (92, 12), (89, 19), (84, 22), (77, 20), (73, 14)], 'E')
        p.ln(74, 6, 80, 3, 'W'); p.ln(80, 3, 86, 7, 'm3'); p.ln(91, 5, 92, 12, 'W')


@sprite('dance_mirror', 'wall', 124, 28, cells=4, top=30)
def dance_mirror(p):
    mirror(p, 0)


@sprite('dance_mirror_crack1', 'wall', 124, 28, cells=4, top=30)
def dance_mirror_crack1(p):
    mirror(p, 1)


@sprite('dance_mirror_crack2', 'wall', 124, 28, cells=4, top=30)
def dance_mirror_crack2(p):
    mirror(p, 2)


@sprite('dance_mirror_broken', 'wall', 124, 28, cells=4, top=30)
def dance_mirror_broken(p):
    mirror(p, 3)


@sprite('ballet_barre', 'wall', 94, 9, cells=3, top=18)
def ballet_barre(p):
    for x in (4, 45, 87):  # 벽 받침쇠
        p.r(x, 0, 3, 9, 'S'); p.r(x, 0, 3, 1, 'T'); p.r(x + 2, 1, 1, 8, 's'); p.px(x + 1, 7, 's')
    p.r(0, 1, 94, 2, 'M'); p.r(0, 1, 94, 1, 'L'); p.r(0, 3, 94, 1, 'N'); p.r(0, 4, 94, 1, 'n')  # 둥근 나무 봉


@sprite('stereo', 'floor', 26, 30)
def stereo(p):
    p.r(0, 13, 26, 17, 'n'); p.r(0, 13, 26, 2, 'N'); p.r(2, 16, 22, 8, 'm')  # 낮은 랙
    for i, c in enumerate('rcgaBUjY'):
        p.r(3 + i * 2, 17, 1, 6, c)  # CD 꽂이
    p.r(1, 25, 2, 5, 'm'); p.r(23, 25, 2, 5, 'm'); p.r(0, 24, 26, 1, 'N')
    p.r(1, 2, 24, 12, 'k'); p.r(1, 2, 24, 3, 'j'); p.r(2, 2, 22, 1, 's')  # 오디오
    p.r(3, 6, 12, 1, 'E'); p.r(3, 7, 12, 1, 'j')  # CD 투입구
    p.r(3, 9, 7, 3, 'g'); p.r(4, 10, 4, 1, 'D')  # 표시창
    p.el(17, 6, 6, 6, 'K'); p.el(18, 7, 4, 4, 's'); p.px(20, 8, 'T')  # 볼륨 손잡이
    p.px(12, 10, 'R'); p.px(14, 10, 'D')  # 작은 불빛


@sprite('speaker_target', 'floor', 20, 34, line=False)
def speaker_target(p):
    # 거울 속 스피커 자리: 희미한 청백색 점선 윤곽(반투명, 2장 speaker 와 같은 크기·앵커)
    for x in range(0, 20, 2):
        p.px(x, 0, 'J'); p.px(x + 1, 33, 'J')
    for y in range(0, 34, 2):
        p.px(0, y + 1, 'J'); p.px(19, y, 'J')
    for cx, cy, r in ((10, 9, 5), (10, 23, 7)):
        for i in range(0, 360, 30):
            p.px(round(cx + r * math.cos(math.radians(i))), round(cy + r * math.sin(math.radians(i))), 'J')
        p.px(cx, cy, 'f')


# ---------------------------------------------------------------- 매점·음악 감상실·어학실
@sprite('meal_counter', 'floor', 92, 36, cells=3)
def meal_counter(p):
    for x in (3, 45, 87):  # 가림 유리 기둥
        p.r(x, 0, 2, 11, 'S')
    p.r(3, 0, 86, 1, 'T')
    p.r(0, 10, 92, 8, 'T'); p.r(0, 10, 92, 1, 'W'); p.r(0, 17, 92, 1, 'S')  # 스테인리스 배식대 윗면
    for x, c in ((20, 'W'), (36, 'U'), (52, 'r'), (68, 'G')):  # 반찬통
        p.r(x, 11, 14, 5, 's'); p.r(x + 1, 12, 12, 3, c); p.px(x + 3, 12, 'W' if c != 'W' else 'w')
    for i in range(4):  # 쌓인 식판
        p.r(2, 15 - i * 2, 15, 2, 'P' if i % 2 else 'p'); p.r(3, 15 - i * 2, 13, 1, 'T')
    p.r(4, 8, 4, 1, 's'); p.r(9, 8, 6, 1, 's')
    p.r(0, 18, 92, 14, 'S'); p.r(0, 18, 92, 1, 's')  # 앞판
    for x in range(15, 92, 15):
        p.r(x, 19, 1, 13, 's')
    for x in range(4, 90, 15):
        p.r(x, 22, 7, 1, 'T')
    p.r(0, 32, 92, 4, 't')
    glass(p, 3, 1, 86, 8, 50)


@sprite('lp_shelf', 'floor', 60, 44, cells=2)
def lp_shelf(p):
    p.r(0, 0, 60, 44, 'n'); p.r(0, 0, 60, 3, 'M'); p.r(0, 0, 60, 1, 'L')
    spines = 'kjrcgaBUmqyCkGVs'
    for row, y in enumerate((4, 17, 30)):
        p.r(2, y, 56, 11, 'm')
        x = 3
        i = row * 5
        while x < 57:
            c = spines[i % len(spines)]
            w = 1 + (i * 7 % 3 == 0)
            p.r(x, y + 1, w, 10, c)
            x += w + (i % 4 == 0)
            i += 1
        p.r(2, y + 11, 56, 2, 'N')
    p.el(46, 5, 10, 10, 'K'); p.ring(47, 6, 8, 8, 'k'); p.r(50, 9, 2, 2, 'A')  # 슬리브에서 반쯤 빠진 판
    p.r(38, 5, 11, 10, 'U'); p.r(38, 5, 11, 1, 'A'); p.r(40, 8, 7, 2, 'u'); p.r(40, 11, 4, 1, 'A')  # 앞으로 세운 LP 표지
    p.r(0, 43, 60, 1, 'm')


@sprite('listen_booth', 'floor', 60, 34, cells=2)
def listen_booth(p):
    desk_body(p, 0, 12, 60, top=8, front=10)
    p.r(6, 3, 28, 15, 'k'); p.r(6, 3, 28, 1, 's'); p.r(6, 16, 28, 2, 'K')  # 턴테이블
    p.el(8, 4, 18, 12, 'E'); p.ring(10, 5, 14, 10, 'k'); p.el(15, 8, 4, 4, 'R'); p.px(16, 9, 'W')  # 레코드
    p.ln(31, 5, 29, 13, 'T'); p.r(30, 4, 3, 2, 'S'); p.r(28, 13, 2, 2, 'S')  # 톤암
    headphones(p, 40, 8)
    p.r(38, 17, 12, 1, 'n')


@sprite('lab_desk', 'floor', 60, 34, cells=2)
def lab_desk(p):
    p.r(0, 0, 60, 12, 'A'); p.r(0, 0, 60, 1, 'W'); p.r(0, 11, 60, 1, 'a'); p.r(0, 0, 2, 12, 'a'); p.r(58, 0, 2, 12, 'a')  # 칸막이
    desk_body(p, 0, 12, 60, top=8, front=10)
    p.r(6, 7, 26, 10, 'k'); p.r(6, 7, 26, 1, 'j')  # 카세트 데크
    p.r(8, 9, 12, 5, 'K'); p.el(9, 10, 4, 4, 'w'); p.el(15, 10, 4, 4, 'w'); p.r(13, 11, 2, 1, 's')
    for i in range(4):
        p.r(22 + i * 2, 10, 1, 2, 'S')
    p.px(29, 14, 'R'); p.px(22, 14, 'D')
    p.r(46, 2, 2, 2, 'S')  # 고리
    headphones(p, 42, 3)
    p.ln(47, 10, 40, 16, 'K')  # 줄


@sprite('card_copier', 'floor', 26, 36)
def card_copier(p):
    p.r(0, 4, 26, 32, 'T'); p.r(0, 4, 26, 6, 'P'); p.r(0, 4, 26, 1, 'W'); p.r(24, 5, 2, 31, 'S')  # 몸체
    p.r(2, 5, 22, 3, 'S'); p.r(3, 6, 20, 1, 'q')  # 윗면 카드 받침
    p.r(2, 12, 11, 6, 'k'); p.r(3, 13, 9, 4, 'g'); p.r(4, 14, 5, 1, 'D'); p.r(4, 15, 3, 1, 'D')  # 화면
    for i in range(12):  # 숫자 패드
        p.r(15 + (i % 3) * 3, 11 + (i // 3) * 2, 2, 1, 'k' if i != 11 else 'R')
    for x, c, d in ((2, 'Y', 'y'), (10, 'R', 'r'), (18, 'X', 'x')):  # 색 슬롯 3개
        p.r(x, 21, 6, 4, c); p.r(x, 24, 6, 1, d); p.r(x + 1, 22, 4, 1, 'E')
    p.r(2, 28, 22, 3, 's'); p.r(3, 29, 20, 1, 'E')  # 배출구
    p.r(0, 34, 26, 2, 't')


# ---------------------------------------------------------------- 3층 도서관
@sprite('world_clocks', 'wall', 94, 22, cells=3, top=28)
def world_clocks(p):
    hands = (((0, -4), (3, 0)), ((3, -3), (0, 4)), ((-4, 0), (0, -5)), ((2, 3), (-3, -2)))
    for i, x in enumerate((3, 27, 51, 75)):
        p.el(x, 0, 16, 16, 'k'); p.el(x + 1, 1, 14, 14, 'W'); p.el(x + 2, 2, 12, 12, 'A')
        cx, cy = x + 7, 7
        for dx, dy in ((0, -5), (5, 0), (0, 5), (-5, 0)):
            p.px(cx + dx, cy + dy, 'k')
        (hx, hy), (mx, my) = hands[i]
        p.ln(cx, cy, cx + hx, cy + hy, 'K'); p.ln(cx, cy, cx + mx, cy + my, 'k'); p.px(cx, cy, 'R')
        p.r(x - 1, 17, 18, 5, 'm'); p.r(x, 18, 16, 3, 'n')  # 도시 이름 판
        for j in range(4 + i % 2):
            p.r(x + 2 + j * 3, 19, 2, 1, 'A')


@sprite('reading_table', 'floor', 94, 26, cells=3)
def reading_table(p):
    table_body(p, 0, 0, 94, top=10, apron=3, legs=12)
    p.r(18, 2, 15, 6, 'W'); p.r(25, 2, 1, 6, 'w'); p.r(18, 7, 15, 1, 'w')  # 펼친 책
    for y in (3, 5):
        p.r(19, y, 5, 1, 'a'); p.r(27, y, 5, 1, 'a')
    p.r(62, 3, 11, 5, 'r'); p.r(62, 3, 11, 1, 'R'); p.r(63, 7, 10, 1, 'A')  # 덮은 책


@sprite('bookcase', 'floor', 60, 56, cells=2)
def bookcase(p):
    p.r(0, 0, 60, 56, 'n'); p.r(0, 0, 60, 3, 'M'); p.r(0, 0, 60, 1, 'L')
    cols = 'rcgaBUmqyCkGVsLuj'
    for row, y in enumerate((4, 17, 30, 43)):
        p.r(2, y, 56, 11, 'm')
        x, i = 3, row * 4
        while x < 56:
            c = cols[i % len(cols)]
            w = 2 + (i * 5 % 3 == 0)
            h = 8 + (i * 3 % 3)
            if x + w > 57:
                break
            p.r(x, y + 11 - h, w, h, c)
            if i % 5 == 0:
                p.r(x, y + 11 - h, w, 1, 'A')
            x += w
            i += 1
        p.r(2, y + 11, 56, 2, 'N')
    p.r(0, 54, 60, 2, 'm')


@sprite('globe', 'floor', 18, 34)
def globe(p):
    p.el(2, 29, 14, 5, 'n'); p.el(3, 29, 12, 3, 'N')  # 받침
    p.r(8, 18, 2, 12, 'z'); p.r(8, 18, 1, 12, 'Z')
    p.el(2, 2, 14, 14, 'c'); p.el(3, 3, 11, 11, 'X')  # 지구
    p.r(5, 5, 4, 3, 'g'); p.r(6, 8, 2, 4, 'g'); p.r(10, 4, 3, 2, 'G'); p.r(10, 9, 3, 3, 'g'); p.px(4, 5, 'C'); p.px(5, 4, 'C')
    p.ln(1, 9, 3, 2, 'Z'); p.ln(3, 2, 9, 0, 'Z'); p.ln(9, 0, 15, 3, 'Z'); p.ln(16, 4, 16, 13, 'z'); p.ln(15, 14, 9, 18, 'z')  # 자오선 고리


@sprite('sinmungo', 'floor', 22, 36)
def sinmungo(p):
    p.poly([(0, 6), (11, 0), (21, 6)], 'm'); p.ln(0, 6, 11, 0, 'N'); p.ln(11, 0, 21, 6, 'n')  # 지붕
    p.r(1, 6, 20, 13, 'N'); p.r(1, 6, 20, 1, 'M'); p.r(20, 7, 1, 12, 'n')  # 상자
    p.r(5, 8, 12, 1, 'E')  # 투입구
    p.r(4, 11, 14, 6, 'A'); p.r(4, 11, 14, 1, 'D')  # '연두신문고' 이름표
    for x in (5, 8, 11, 14):
        p.r(x, 13, 2, 2, 'g')
    p.r(9, 19, 4, 14, 'n'); p.r(9, 19, 1, 14, 'N')  # 기둥
    p.r(4, 32, 14, 4, 'n'); p.r(4, 32, 14, 1, 'N')


# ---------------------------------------------------------------- 배전·냉방·전기
def fuse_panel(p, on):
    p.r(0, 0, 22, 26, 'S'); p.r(0, 0, 22, 1, 'T'); p.r(21, 1, 1, 25, 's'); p.r(0, 25, 22, 1, 's')
    p.r(2, 2, 18, 22, 'k')
    p.r(3, 3, 10, 2, 'Y'); p.r(4, 3, 1, 2, 'K'); p.px(6, 4, 'K')  # 전원 쪽 표시
    for y in (6, 18):  # 위 단자(전원) / 아래 단자
        p.r(4, y, 14, 3, 'A'); p.r(4, y + 2, 14, 1, 'a'); p.r(6, y + 1, 2, 1, 'u'); p.r(14, y + 1, 2, 1, 'u')
    if on:  # 퓨즈가 전원 쪽 단자에 꽂힘
        p.r(5, 9, 12, 3, 'W'); p.r(5, 9, 2, 3, 'T'); p.r(15, 9, 2, 3, 'T'); p.r(7, 10, 8, 1, 'w')
        p.r(17, 3, 2, 2, 'D'); p.px(16, 3, 'G')
    else:  # 퓨즈가 아래 칸에 빠져 있음
        p.r(5, 14, 12, 3, 'W'); p.r(5, 14, 2, 3, 'T'); p.r(15, 14, 2, 3, 'T'); p.r(7, 15, 8, 1, 'w')
        p.r(17, 3, 2, 2, 'r')


@sprite('fuse_panel', 'wall', 22, 26, top=29)
def fuse_panel_off(p):
    fuse_panel(p, False)


@sprite('fuse_panel_on', 'wall', 22, 26, top=29)
def fuse_panel_on(p):
    fuse_panel(p, True)


def aircon(p, on):
    p.r(0, 0, 56, 14, 'W'); p.r(0, 0, 56, 1, 'W'); p.r(0, 9, 56, 5, 'w'); p.r(55, 1, 1, 13, 'a')
    p.r(2, 2, 52, 1, 'w')
    p.r(3, 11, 50, 2, 'a'); p.r(3, 12, 50, 1, 'k')  # 바람 나오는 날개
    p.r(44, 4, 8, 3, 'k'); p.r(45, 5, 2, 1, 'D' if on else 'j'); p.r(48, 5, 3, 1, 'D' if on else 'j')  # 표시창


def aircon_wind(p):
    for x in (8, 20, 32):  # 바람 줄(외곽선 없음)
        p.ln(x, 15, x + 4, 17, 'f'); p.ln(x + 4, 17, x + 1, 20, 'f'); p.px(x + 4, 17, 'J')


@sprite('aircon', 'wall', 56, 22, cells=2, top=30)
def aircon_off(p):
    aircon(p, False)


@sprite('aircon_on', 'wall', 56, 22, cells=2, top=30, over=aircon_wind)
def aircon_on(p):
    aircon(p, True)


def breaker(p, on):
    p.r(0, 0, 52, 24, 'S'); p.r(0, 0, 52, 1, 'T'); p.r(51, 1, 1, 23, 's'); p.r(0, 23, 52, 1, 's')
    p.r(2, 2, 48, 3, 'Y'); p.r(2, 4, 48, 1, 'y')
    for x in range(2, 50, 6):  # 경고 줄무늬
        p.r(x, 2, 2, 2, 'K')
    p.r(2, 6, 48, 16, 'q'); p.r(2, 6, 48, 1, 's')
    for i in range(6):  # 차단기 레버
        x = 5 + i * 7
        p.r(x, 8, 5, 12, 'P'); p.r(x, 8, 5, 1, 'W'); p.r(x + 1, 12, 3, 4, 's')
        if on:
            p.r(x + 1, 9, 3, 4, 'K'); p.r(x + 1, 9, 3, 1, 'j')
        else:
            p.r(x + 1, 15, 3, 4, 'K'); p.r(x + 1, 15, 3, 1, 'j')
    p.el(45, 9, 4, 4, 'D' if on else 'r'); p.px(46, 10, 'W' if on else 'R')  # 표시등


@sprite('breaker_panel', 'wall', 52, 24, cells=2, top=29)
def breaker_panel_off(p):
    breaker(p, False)


@sprite('breaker_panel_on', 'wall', 52, 24, cells=2, top=29)
def breaker_panel_on(p):
    breaker(p, True)


def light_switch(p, on):
    p.r(0, 0, 8, 11, 'W'); p.r(7, 1, 1, 10, 'w'); p.r(0, 10, 8, 1, 'w')
    p.r(2, 2, 4, 7, 'w')
    if on:
        p.r(2, 2, 4, 3, 'A'); p.r(2, 2, 4, 1, 'W'); p.px(3, 7, 'Y')
    else:
        p.r(2, 6, 4, 3, 'a'); p.r(2, 8, 4, 1, 's')


@sprite('light_switch', 'wall', 8, 11, top=17)
def light_switch_off(p):
    light_switch(p, False)


@sprite('light_switch_on', 'wall', 8, 11, top=17)
def light_switch_on(p):
    light_switch(p, True)


def power_lever(p, down):
    p.r(1, 6, 18, 18, 'S'); p.r(1, 6, 18, 1, 'T'); p.r(18, 7, 1, 17, 's'); p.r(1, 23, 18, 1, 's')  # 함
    p.poly([(4, 21), (7, 15), (10, 21)], 'Y'); p.r(7, 17, 1, 2, 'K'); p.px(7, 20, 'K')  # 경고 표지
    p.r(12, 9, 3, 13, 'E')  # 레버 홈
    if down:
        p.r(12, 16, 3, 10, 'R'); p.r(12, 16, 1, 10, 'r'); p.r(10, 25, 7, 3, 'K'); p.r(10, 25, 7, 1, 'j')
    else:
        p.r(12, 3, 3, 12, 'R'); p.r(12, 3, 1, 12, 'r'); p.r(10, 0, 7, 3, 'K'); p.r(10, 0, 7, 1, 'j')


@sprite('power_lever', 'wall', 19, 28, top=30)
def power_lever_up(p):
    power_lever(p, False)


@sprite('power_lever_down', 'wall', 19, 28, top=30)
def power_lever_down(p):
    power_lever(p, True)


# ---------------------------------------------------------------- 자료실·오컬트 동아리
@sprite('archive_paper', 'decal', 18, 13)
def archive_paper(p):
    p.r(0, 0, 18, 13, 'I'); p.r(1, 1, 16, 11, 'W')  # 코팅 비닐 테 + 종이
    p.r(2, 2, 14, 2, 'B')
    for y in (5, 7, 9):
        p.r(2, y, 9 + (y % 3), 1, 'q')
    p.el(12, 6, 4, 4, 'R'); p.px(13, 7, 'W')  # 도장
    p.ln(1, 11, 7, 1, 'P')  # 비닐 반사


@sprite('occult_table', 'floor', 60, 34, cells=2)
def occult_table(p):
    p.r(0, 8, 60, 9, 'V'); p.r(0, 8, 60, 1, 'n')  # 자주 천 윗면
    p.r(0, 17, 60, 12, 'v'); p.r(0, 17, 60, 1, 'V')  # 늘어진 천
    for x in range(1, 60, 4):
        p.r(x, 28, 2, 2, 'Z')  # 술 장식
        if x % 8 == 1:
            p.r(x + 2, 18, 1, 9, 'V')
    p.r(3, 30, 3, 4, 'm'); p.r(54, 30, 3, 4, 'm')
    p.r(24, 12, 12, 3, 'z'); p.r(25, 12, 10, 1, 'Z')  # 수정구슬 받침
    p.el(23, 0, 14, 14, 'i'); p.el(24, 1, 12, 12, 'I'); p.el(26, 3, 4, 4, 'W'); p.px(32, 9, 'C')  # 수정구슬
    for x in (6, 50):  # 촛불
        p.r(x, 3, 3, 8, 'W'); p.r(x + 2, 4, 1, 7, 'w'); p.r(x - 1, 10, 5, 2, 'z')
        p.px(x + 1, 1, 'Y'); p.px(x + 1, 2, 'O')
    for x, y in ((11, 11), (15, 12), (41, 11)):  # 타로 카드
        p.r(x, y, 4, 5, 'A'); p.r(x + 1, y + 1, 2, 3, 'r')
    p.r(45, 12, 4, 4, 'A'); p.r(46, 13, 2, 2, 'Y')


@sprite('occult_rug', 'decal', 62, 46, cells=2, rows=2)
def occult_rug(p):
    p.r(0, 0, 62, 46, 'r'); p.box(1, 1, 60, 44, 'Z'); p.box(3, 3, 56, 40, 'z')
    for x in range(4, 59, 4):  # 테두리 무늬
        p.px(x, 2, 'R'); p.px(x + 2, 43, 'R')
    cx, cy, rx, ry = 31, 23, 22, 17
    p.ring(cx - rx, cy - ry, rx * 2 + 1, ry * 2 + 1, 'Z'); p.ring(cx - rx + 2, cy - ry + 2, rx * 2 - 3, ry * 2 - 3, 'z')
    pts = [(round(cx + (rx - 2) * math.sin(math.radians(a))), round(cy - (ry - 2) * math.cos(math.radians(a)))) for a in range(0, 360, 72)]
    for i in range(5):  # 오망성
        p.ln(*pts[i], *pts[(i + 2) % 5], 'Y')
    for x, y in pts:
        p.px(x, y, 'O')
    for x in (0, 61):  # 술
        for y in range(3, 44, 3):
            p.px(x, y, 'A')


# ---------------------------------------------------------------- 옥상 수영장
C.update({'tk': (84, 110, 128), 'tkl': (116, 142, 156), 'tkd': (58, 78, 94), 'vr': (214, 86, 80)})
@sprite('water_tank', 'floor', 60, 50, cells=2)
def water_tank(p):
    p.r(2, 42, 56, 3, 't'); p.r(4, 45, 3, 5, 't'); p.r(53, 45, 3, 5, 't'); p.r(28, 45, 3, 5, 't')  # 철제 받침
    p.r(4, 6, 52, 37, 'tk'); p.el(4, 37, 52, 9, 'tk'); p.r(4, 6, 3, 37, 'tkl'); p.r(51, 6, 5, 37, 'tkd')  # 원통 몸체
    for y in (16, 26, 36):
        p.r(4, y, 52, 1, 'tkd'); p.r(4, y + 1, 52, 1, 'tkl')
    p.el(4, 0, 52, 13, 'tkl'); p.el(6, 1, 48, 10, 'T'); p.el(22, 3, 16, 6, 'S'); p.el(24, 4, 12, 4, 'T'); p.r(28, 4, 4, 1, 's')  # 뚜껑·맨홀
    p.r(12, 20, 16, 7, 'W'); p.r(14, 22, 12, 1, 'q'); p.r(14, 24, 8, 1, 'q')  # 이름판
    for x in (38, 45):  # 사다리
        p.r(x, 4, 2, 40, 'S'); p.r(x + 1, 4, 1, 40, 's')
    for y in range(8, 42, 5):
        p.r(40, y, 5, 1, 'T')
    p.r(0, 34, 6, 3, 'S'); p.r(0, 34, 6, 1, 'T')  # 배관


@sprite('pool_ladder', 'floor', 22, 30)
def pool_ladder(p):
    for x in (2, 16):  # 휘어진 손잡이 두 개
        p.r(x, 4, 2, 6, 'S'); p.ln(x, 4, x + 2, 1, 'T'); p.r(x + 2, 0, 2, 2, 'T')
        p.r(x + 3, 2, 2, 27, 'T'); p.r(x + 4, 2, 1, 27, 'S')
    for y in (12, 18, 24):
        p.r(5, y, 13, 2, 'S'); p.r(5, y, 13, 1, 'T')  # 발판
    p.r(0, 9, 22, 2, 'a'); p.r(0, 9, 22, 1, 'A')  # 수영장 가장자리 턱
    p.r(5, 27, 13, 3, '3'); p.r(7, 28, 9, 1, '4')  # 물에 잠긴 부분


def valve_red(p, handle):
    p.r(8, 18, 6, 8, 's'); p.r(8, 18, 2, 8, 'S'); p.r(6, 23, 10, 3, 'S'); p.r(6, 23, 10, 1, 'T')  # 바닥 배관 + 플랜지
    p.r(5, 11, 12, 8, 'R'); p.r(5, 11, 12, 2, 'vr'); p.r(5, 17, 12, 2, 'r'); p.r(5, 11, 1, 8, 'r')  # 밸브 몸통
    p.px(7, 15, 'W'); p.px(14, 15, 'W')
    p.r(9, 5, 4, 7, 'T'); p.r(12, 5, 1, 7, 'S'); p.r(9, 5, 4, 1, 'W')  # 네모 축
    if handle:  # 끼운 원형 손잡이
        p.ring(0, 2, 22, 9, 'r'); p.ring(1, 2, 20, 8, 'R'); p.ring(1, 3, 20, 7, 'R')
        p.ln(3, 6, 18, 6, 'R'); p.ln(10, 3, 11, 10, 'R'); p.el(8, 4, 6, 4, 'r'); p.r(10, 5, 2, 2, 'T')


@sprite('valve_red', 'floor', 22, 26)
def valve_red_s(p):
    valve_red(p, False)


@sprite('valve_red_handle', 'floor', 22, 26)
def valve_red_handle(p):
    valve_red(p, True)


@sprite('diving_board', 'floor', 60, 26, cells=2)
def diving_board(p):
    p.r(0, 10, 16, 16, 'a'); p.r(0, 10, 16, 2, 'A'); p.r(15, 11, 1, 15, 'L')  # 콘크리트 받침
    p.r(26, 14, 6, 10, 'S'); p.r(26, 14, 6, 1, 'T'); p.el(25, 12, 8, 5, 's')  # 받침 굴대
    p.r(2, 5, 58, 6, 'C'); p.r(2, 5, 58, 1, 'P'); p.r(2, 10, 58, 2, 'c')  # 판
    for x in range(6, 58, 4):
        p.px(x, 7, 'P'); p.px(x + 2, 8, 'P')  # 미끄럼 방지 면
    p.r(56, 5, 4, 7, 'P')


# ================================================================ E. 아이템 아이콘(30x30 → 외곽선 32x32 → 4배 128)
C.update({'cy': (240, 200, 70), 'cyd': (178, 138, 40), 'pk': (190, 112, 124), 'pkd': (132, 70, 86), 'pkl': (226, 168, 172)})


def card(p, c, d, hi):
    p.r(3, 7, 24, 17, c); p.r(2, 8, 26, 15, c)  # 둥근 모서리 카드
    p.r(3, 7, 24, 1, hi); p.r(2, 22, 26, 1, d); p.r(3, 23, 24, 1, d); p.r(27, 8, 1, 14, d)
    p.r(2, 11, 26, 3, 'k')  # 자기띠
    p.r(5, 16, 11, 5, 'W'); p.r(6, 17, 7, 1, 'q'); p.r(6, 19, 5, 1, 'q')  # 이름 칸
    p.r(19, 16, 5, 4, 'Y' if c != 'cy' else 'A'); p.r(20, 17, 3, 2, 'y' if c != 'cy' else 'a')  # 칩
    p.r(22, 8, 2, 2, 'E')  # 끈 구멍


@sprite('item_card_yellow', 'icon', 30, 30)
def item_card_yellow(p):
    card(p, 'cy', 'cyd', 'W')


@sprite('item_card_red', 'icon', 30, 30)
def item_card_red(p):
    card(p, 'R', 'r', 'O')


@sprite('item_card_blue', 'icon', 30, 30)
def item_card_blue(p):
    card(p, 'X', 'x', 'C')


@sprite('item_weight50', 'icon', 30, 30)
def item_weight50(p):
    p.el(10, 1, 10, 7, 'Z'); p.el(11, 2, 5, 3, 'Y')  # 손잡이 구슬
    p.r(12, 7, 6, 5, 'z'); p.r(13, 7, 2, 5, 'Z')
    p.el(5, 10, 20, 6, 'Y')  # 윗면
    p.r(5, 13, 20, 13, 'Z'); p.el(5, 22, 20, 7, 'Z'); p.r(5, 13, 3, 13, 'Y'); p.r(21, 13, 4, 13, 'z')
    p.el(5, 10, 20, 6, 'Y'); p.el(8, 11, 14, 4, 'Z')
    p.grid(9, 17, '''
zzz.zzz
z...z.z
zzz.z.z
..z.z.z
zzz.zzz
''')  # 50


@sprite('item_pin', 'icon', 30, 30)
def item_pin(p):
    # 실핀(대각선): 곧은 다리 + 물결 다리, 오른쪽 위에서 둥글게 이어지고 왼쪽 아래 끝에 고무 방울
    for i in range(22):
        x, y = 4 + i, 25 - i
        p.px(x, y, 'k'); p.px(x + 1, y, 'k'); p.px(x, y - 1, 'S')  # 곧은 다리 + 광택
        a = 3 + (1 if (i // 3) % 2 else 0)  # 물결
        p.px(x + a, y + a, 'k'); p.px(x + a + 1, y + a, 'k')
    for x, y in ((26, 3), (27, 3), (28, 4), (29, 5), (29, 6), (29, 7), (28, 8)):  # 둥근 머리
        p.px(x, y, 'k')
    p.px(27, 4, 'S')
    p.el(2, 24, 4, 4, 'j'); p.el(6, 27, 4, 3, 'j'); p.px(3, 25, 's'); p.px(7, 27, 's')  # 끝 고무 방울


@sprite('item_lunchbox', 'icon', 30, 30)
def item_lunchbox(p):
    p.r(3, 11, 24, 16, 'pk'); p.r(2, 13, 26, 12, 'pk'); p.r(3, 25, 24, 2, 'pkd'); p.r(26, 12, 2, 13, 'pkd')  # 보자기 싼 상자
    p.r(3, 11, 24, 1, 'pkl')
    p.ln(3, 12, 12, 17, 'pkd'); p.ln(27, 12, 18, 17, 'pkd'); p.ln(14, 17, 14, 25, 'pkd')  # 접힌 주름
    for x, y in ((6, 19), (10, 23), (20, 22), (23, 18), (7, 14), (22, 14), (17, 20)):  # 꽃무늬
        p.px(x, y, 'pkl'); p.px(x + 1, y, 'W'); p.px(x, y + 1, 'W')
    p.poly([(12, 9), (3, 5), (1, 9), (5, 11)], 'pk'); p.poly([(18, 9), (27, 5), (29, 9), (25, 11)], 'pk')  # 양옆으로 늘어진 매듭 귀
    p.ln(3, 5, 1, 9, 'pkd'); p.ln(27, 5, 29, 9, 'pkd'); p.ln(3, 5, 12, 8, 'pkl'); p.ln(27, 5, 18, 8, 'pkl')
    p.el(11, 6, 8, 7, 'pkd'); p.el(12, 6, 6, 5, 'pk'); p.px(14, 7, 'pkl')  # 매듭


@sprite('item_archive_notice', 'icon', 30, 30)
def item_archive_notice(p):
    p.r(4, 1, 22, 28, 'I'); p.r(5, 2, 20, 26, 'W')  # 코팅 비닐 + 종이
    p.r(7, 4, 16, 3, 'B'); p.r(9, 5, 8, 1, 'C')
    for y in (9, 11, 13, 21, 23):
        p.r(7, y, 14 - (y % 3) * 2, 1, 'q')
    p.r(7, 15, 9, 5, 'w'); p.r(8, 16, 2, 2, 'q'); p.r(11, 16, 4, 1, 'q'); p.r(11, 18, 3, 1, 'q')  # 배치도
    p.el(17, 15, 6, 6, 'R'); p.el(18, 16, 4, 4, 'W'); p.r(19, 17, 2, 2, 'R')  # 도장
    p.ln(6, 27, 23, 3, 'P'); p.ln(7, 27, 24, 4, 'P')  # 비닐 반사광


@sprite('item_taeguk', 'icon', 30, 30)
def item_taeguk(p):
    p.el(1, 1, 28, 28, 'z'); p.el(2, 2, 26, 26, 'Z'); p.el(4, 4, 22, 22, 'W')  # 놋쇠 테
    p.el(6, 6, 18, 18, 'X')
    p.d.pieslice([6, 6, 23, 23], 180, 360, fill=C['R'] + (255,))  # 위 빨강 / 아래 파랑
    p.el(6, 10, 9, 9, 'R'); p.el(15, 10, 9, 9, 'X')  # 태극 소용돌이
    for x, y in ((8, 3), (21, 3), (3, 14), (26, 14), (8, 25), (21, 25)):
        p.px(x, y, 'z')
    p.px(9, 4, 'Y'); p.px(4, 9, 'Y')


@sprite('item_lrod', 'icon', 30, 30)
def item_lrod(p):
    for dx, dy in ((0, 0), (5, -8)):  # L자 금속 막대 두 개
        p.r(3 + dx, 18 + dy, 3, 10, 'N'); p.r(3 + dx, 18 + dy, 1, 10, 'M')  # 손잡이
        p.r(4 + dx, 16 + dy, 22 - dx, 2, 'T'); p.r(4 + dx, 17 + dy, 22 - dx, 1, 'S')
        p.r(4 + dx, 16 + dy, 1, 3, 'T'); p.px(25, 16 + dy, 'W')


@sprite('item_fox_bell', 'icon', 30, 30)
def item_fox_bell(p):
    p.ring(10, 0, 9, 9, 'R'); p.ring(11, 1, 7, 7, 'r')  # 붉은 끈 고리
    p.r(13, 7, 3, 4, 'R')
    p.el(7, 10, 16, 16, 'z'); p.el(8, 10, 14, 14, 'Z'); p.el(10, 12, 5, 4, 'Y')  # 방울
    p.r(8, 19, 14, 1, 'z'); p.el(13, 20, 4, 3, 'K'); p.r(14, 22, 2, 3, 'K')  # 홈·구멍
    p.ln(19, 9, 25, 20, 'R', 2); p.ln(19, 9, 27, 17, 'r'); p.r(24, 20, 3, 6, 'R'); p.px(24, 26, 'r'); p.px(26, 26, 'r')  # 늘어진 술


@sprite('item_valve_handle', 'icon', 30, 30)
def item_valve_handle(p):
    p.el(1, 1, 28, 28, 'r'); p.el(2, 2, 26, 26, 'R'); p.el(5, 5, 20, 20, 'r'); p.el(6, 6, 18, 18, '_')
    p.ln(7, 7, 22, 22, 'R', 3); p.ln(22, 7, 7, 22, 'R', 3)  # 바큇살
    p.el(10, 10, 10, 10, 'r'); p.el(11, 11, 8, 8, 'S'); p.r(13, 13, 4, 4, 'E')  # 가운데 네모 구멍
    p.ln(5, 9, 9, 4, 'O'); p.ln(4, 11, 4, 12, 'O')



@sprite('item_tablet_water', 'icon', 30, 30)
def item_tablet_water(p):
    # item_tablet_earth(2장 土 결계패)와 같은 오각형, 짙은 청색 + 물빛 테, '水'
    p.grid(0, 4, '''
..............bb..............
............bbCCbb............
..........bbCCIICCbb..........
........bbCCIICCCCCCbb........
......bbCCIICCCCCCCCCCbb......
....bbCCCCCXXXXXXXXCCCCCbb....
..bbCCCCCXXXXXXXXXXXXCCCCCbb..
.bCCCCCCXXXXXXXXXXXXXXCCCCCCb.
.bICCCCXXXXXXXXXXXXXXXXCCCCCb.
.bICCCXXXXXXXXXXXXXXXXXXCCCCb.
..bCCCXXXXXXXXXXXXXXXXXXCCCb..
..bICCXXXXXXXXXXXXXXXXXXCCCb..
..bICCXXXXXXXXXXXXXXXXXXCCCb..
..bCCCXXXXXXXXXXXXXXXXXXCCCb..
...bCCXXXXXXXXXXXXXXXXXXCCb...
...bCCXXXXXXXXXXXXXXXXXXCCb...
...bCCXXXXXXXXXXXXXXXXXXCCb...
...bCCXXXXXXXXXXXXXXXXXXCCb...
....bCCxxxxxxxxxxxxxxxxCCb....
....bCCCxxxxxxxxxxxxxxCCCb....
....bcCCCCCCCCCCCCCCCCCCcb....
.....bbbbbbbbbbbbbbbbbbbb.....
''')
    p.grid(7, 9, '''
.......II......
.......II......
.......II......
.......II...I..
.IIII..II..II..
....I..II.II...
...II..IIII....
...I...III.....
..II...II.I....
.II....II..II..
II.....II...III
.....I.II....II
......III......
''')


# ================================================================ 저장
def render(key):
    """외곽선까지 입힌 1배 이미지"""
    fn, kind, w, h, opt = SPR[key]
    p = Pen(w, h)
    fn(p)
    if kind == 'tile' and not opt.get('rail'):
        return p.im
    if opt.get('rail'):  # 난간: 외곽선을 입힌 뒤 32x24 로 잘라 옆 칸과 이어지게
        img = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
        img.alpha_composite(p.im, (1, 1))
        return outline(img).crop((1, 1, w + 1, h + 1))
    if opt.get('line', True):
        img = Image.new('RGBA', (w + 2, h + 2), (0, 0, 0, 0))
        img.alpha_composite(p.im, (1, 1))
        img, off = outline(img), 1
    else:
        img, off = p.im, 0
    for layer in ('under', 'over'):  # 외곽선 없이 겹치는 층(물결·물보라)
        if layer in opt:
            q = Pen(w, h)
            opt[layer](q)
            base = Image.new('RGBA', img.size, (0, 0, 0, 0))
            if layer == 'under':
                base.alpha_composite(q.im, (off, off)); base.alpha_composite(img)
            else:
                base.alpha_composite(img); base.alpha_composite(q.im, (off, off))
            img = base
    return img


def meta_for(key, img):
    """2배(아이콘 4배) 크기·앵커"""
    _, kind, _, _, opt = SPR[key]
    k = 4 if kind == 'icon' else 2
    w, h = img.width * k, img.height * k
    cells = opt.get('cells', 1)
    ax = -((32 * cells - img.width) // 2) * 2
    if kind == 'icon':
        ax, ay = w // 2, h // 2
    elif kind == 'char':  # 발(몸) 아래 가운데
        ax, ay = w // 2, h - (2 if opt.get('line', True) else 0)
    elif kind == 'tile':  # 왼쪽 아래
        ax, ay = 0, h
    elif kind == 'wall':  # 위 끝이 벽 아래선에서 top px 위
        ay = opt.get('top', 28) * 2
    elif kind == 'decal':  # cells x rows 칸 한가운데
        ay = (img.height + (24 * opt.get('rows', 1) - img.height) // 2) * 2
    else:  # 바닥 소품: 아래 끝이 칸 아래선 4px 위
        ay = (img.height + 4) * 2
    return k, {'file': f'props_ch3/{key}.png', 'w': w, 'h': h, 'ax': ax, 'ay': ay}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    meta = {}
    for key in SPR:
        img = render(key)
        k, m = meta_for(key, img)
        img.resize((img.width * k, img.height * k), Image.NEAREST).save(OUT / f'{key}.png')
        meta[key] = m
    json.dump(meta, open(OUT.parent / 'props_ch3.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(meta), '3장 귀신·타일·소품·아이콘')


def preview(path):
    imgs = [render(k) for k in SPR]
    cols, x, y, rh, pos = 900, 2, 2, 0, []
    for i in imgs:
        if x + i.width + 3 > cols:
            x, y, rh = 2, y + rh + 3, 0
        pos.append((x, y))
        x += i.width + 3
        rh = max(rh, i.height)
    sheet = Image.new('RGBA', (cols, y + rh + 2), (70, 72, 84, 255))
    for i, xy in zip(imgs, pos):
        sheet.alpha_composite(i, xy)
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save(path)


if __name__ == '__main__':
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1])
    else:
        main()
