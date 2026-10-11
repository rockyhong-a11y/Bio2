"""tiles 카테고리 — 바닥/벽/문 스프라이트 (docs/asset-spec.md 'tiles' 절).

실행: <venv>/bin/python tools/blender/tiles.py [-- key1 key2 ...]

이음매 없는 타일링 규칙
- 모든 질감은 월드 좌표 절차적 텍스처이며 x(벽·바닥)와 y(바닥·벽 윗면)에 대해 주기 1 로 반복한다.
  (노이즈/보로노이는 4D 토러스 매핑 cos/sin(2πx), cos/sin(2πy) 으로 주기화)
- 지오메트리는 셀 밖까지 연장하고, render_sprite(bounds=셀 정확 경계, pad=0) 으로 잘라서
  가장자리 픽셀이 반투명해지지 않게 한다 → 이웃 타일과 픽셀 단위로 맞물림.
- 바닥: 64x48 (앵커 0,48), 벽/문: 64x112 (앵커 0,112). 바깥으로 젖혀지는 문짝만 아래로 더 길다.
"""
import os
import sys
import json
import math

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import bmesh  # noqa: E402
import common as C  # noqa: E402

CAT = 'tiles'
WH = C.WALL_H
TAU = 2 * math.pi
FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
SAMPLES = 160
FRONT = -1.0           # 벽 남쪽 면 y
BACK = 0.12            # 벽 몸체를 북쪽으로 약간 연장(윗면 가장자리 픽셀 채움)
XL, XR = -0.12, 1.12   # 벽 몸체 좌우 연장


def lin(c):
    return C.hex_to_linear(c) if isinstance(c, str) else c


# ---------------------------------------------------------------- 셰이더 그래프 DSL
class G:
    def __init__(self, name):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        self.m, self.nt = m, m.node_tree
        self.N, self.Lk = self.nt.nodes, self.nt.links
        self.bsdf = self.N.get('Principled BSDF')
        self.outn = self.N.get('Material Output')
        geo = self.N.new('ShaderNodeNewGeometry')
        sep = self.N.new('ShaderNodeSeparateXYZ')
        self.Lk.new(geo.outputs['Position'], sep.inputs[0])
        self.x, self.y, self.z = sep.outputs[0], sep.outputs[1], sep.outputs[2]

    def S(self, sock, v):
        if isinstance(v, bpy.types.NodeSocket):
            self.Lk.new(v, sock)
        elif isinstance(v, str):
            sock.default_value = (*lin(v), 1)
        elif isinstance(v, (tuple, list)):
            v = tuple(v)
            if len(v) == 3 and len(sock.default_value) == 4:
                v = v + (1,)
            sock.default_value = v
        else:
            sock.default_value = v

    def M(self, op, a, b=None, c=None):
        n = self.N.new('ShaderNodeMath')
        n.operation = op
        for i, v in enumerate((a, b, c)):
            if v is not None:
                self.S(n.inputs[i], v)
        return n.outputs[0]

    def add(self, a, b): return self.M('ADD', a, b)
    def sub(self, a, b): return self.M('SUBTRACT', a, b)
    def mul(self, a, b): return self.M('MULTIPLY', a, b)
    def div(self, a, b): return self.M('DIVIDE', a, b)
    def fract(self, a): return self.M('FRACT', a)
    def floor(self, a): return self.M('FLOOR', a)
    def mod(self, a, b): return self.M('FLOORED_MODULO', a, b)
    def abs(self, a): return self.M('ABSOLUTE', a)
    def min(self, a, b): return self.M('MINIMUM', a, b)
    def max(self, a, b): return self.M('MAXIMUM', a, b)
    def sqrt(self, a): return self.M('SQRT', a)

    def mr(self, v, a, b, c=0.0, d=1.0, interp='LINEAR'):
        n = self.N.new('ShaderNodeMapRange')
        n.interpolation_type = interp
        n.clamp = True
        ins = {s.identifier: s for s in n.inputs}
        self.S(ins['Value'], v)
        ins['From Min'].default_value = a
        ins['From Max'].default_value = b
        ins['To Min'].default_value = c
        ins['To Max'].default_value = d
        return n.outputs['Result']

    def step(self, v, a, b):
        """smoothstep(a, b, v) (a<b)."""
        return self.mr(v, a, b, 0.0, 1.0, 'SMOOTHSTEP')

    def xyz(self, a, b, c):
        n = self.N.new('ShaderNodeCombineXYZ')
        for i, v in enumerate((a, b, c)):
            self.S(n.inputs[i], v)
        return n.outputs[0]

    def _torus(self, u, v, fu, fv, off, vper=True):
        a = self.mul(u, TAU)
        X = self.mul(self.M('COSINE', a), fu / TAU)
        Y = self.mul(self.M('SINE', a), fu / TAU)
        if vper:
            b = self.mul(v, TAU)
            Z = self.mul(self.M('COSINE', b), fv / TAU)
            W = self.M('MULTIPLY_ADD', self.M('SINE', b), fv / TAU, off)
        else:
            Z = self.mul(v, fv)
            W = off
        return self.xyz(X, Y, Z), W

    def pnoise(self, u, v, fu, fv, detail=3.0, rough=0.5, dist=0.0, off=0.0, vper=True):
        """u(와 vper 이면 v)에 대해 주기 1 인 노이즈. fu/fv = 주기당 대략의 특징 수."""
        vec, W = self._torus(u, v, fu, fv, off, vper)
        n = self.N.new('ShaderNodeTexNoise')
        n.noise_dimensions = '4D'
        self.S(n.inputs['Vector'], vec)
        self.S(n.inputs['W'], W)
        n.inputs['Scale'].default_value = 1.0
        n.inputs['Detail'].default_value = detail
        n.inputs['Roughness'].default_value = rough
        n.inputs['Distortion'].default_value = dist
        return n.outputs['Fac']

    def pvoronoi(self, u, v, fu, fv, off=0.0, vper=True, rand=1.0):
        vec, W = self._torus(u, v, fu, fv, off, vper)
        n = self.N.new('ShaderNodeTexVoronoi')
        n.voronoi_dimensions = '4D'
        self.S(n.inputs['Vector'], vec)
        self.S(n.inputs['W'], W)
        n.inputs['Scale'].default_value = 1.0
        n.inputs['Randomness'].default_value = rand
        return n.outputs['Distance'], self.bw(n.outputs['Color'])

    def bw(self, col):
        n = self.N.new('ShaderNodeRGBToBW')
        self.S(n.inputs[0], col)
        return n.outputs[0]

    def hash(self, a, b=0.0, c=0.0):
        n = self.N.new('ShaderNodeTexWhiteNoise')
        n.noise_dimensions = '3D'
        self.S(n.inputs['Vector'], self.xyz(a, b, c))
        return n.outputs['Value']

    def ramp(self, f, stops, interp='LINEAR'):
        n = self.N.new('ShaderNodeValToRGB')
        cr = n.color_ramp
        cr.interpolation = interp
        els = cr.elements
        els[0].position, els[0].color = stops[0][0], (*lin(stops[0][1]), 1)
        els[1].position, els[1].color = stops[-1][0], (*lin(stops[-1][1]), 1)
        for p, c in stops[1:-1]:
            e = els.new(p)
            e.color = (*lin(c), 1)
        self.S(n.inputs[0], f)
        return n.outputs['Color']

    def mix(self, f, a, b, blend='MIX'):
        n = self.N.new('ShaderNodeMix')
        n.data_type = 'RGBA'
        n.blend_type = blend
        n.clamp_factor = True
        ins = {s.identifier: s for s in n.inputs}
        self.S(ins['Factor_Float'], f)
        self.S(ins['A_Color'], a)
        self.S(ins['B_Color'], b)
        return {s.identifier: s for s in n.outputs}['Result_Color']

    def gline(self, v, period, hw, aa=0.006):
        """주기 period 의 격자선 마스크(선 위 1). hw=반폭(타일 단위)."""
        d = self.mul(self.abs(self.sub(self.fract(self.add(self.div(v, period), 0.5)), 0.5)), period)
        return self.sub(1.0, self.step(d, hw, hw + aa))

    def bump(self, h, strength=0.3, dist=0.02):
        n = self.N.new('ShaderNodeBump')
        n.inputs['Strength'].default_value = strength
        n.inputs['Distance'].default_value = dist
        self.S(n.inputs['Height'], h)
        return n.outputs['Normal']

    def done(self, color, rough=0.6, metal=0.0, normal=None, alpha=None, spec=0.5, emit=None, emit_str=1.0):
        b = self.bsdf
        self.S(b.inputs['Base Color'], color)
        self.S(b.inputs['Roughness'], rough)
        self.S(b.inputs['Metallic'], metal)
        b.inputs['Specular IOR Level'].default_value = spec
        if normal is not None:
            self.S(b.inputs['Normal'], normal)
        if alpha is not None:
            self.S(b.inputs['Alpha'], alpha)
        if emit is not None:
            self.S(b.inputs['Emission Color'], emit)
            b.inputs['Emission Strength'].default_value = emit_str
        return self.m

    def emission(self, color, strength=1.0):
        n = self.N.new('ShaderNodeEmission')
        self.S(n.inputs['Color'], color)
        n.inputs['Strength'].default_value = strength
        self.Lk.new(n.outputs[0], self.outn.inputs['Surface'])
        return self.m


# ---------------------------------------------------------------- 재질 라이브러리
_ML = {}


def MAT(key):
    if key not in _ML:
        _ML[key] = MATS[key]()
    return _ML[key]


def m_flat(name, col, rough=0.6, metal=0.0, nz=0.06, f=30, off=0.0):
    """약한 노이즈만 있는 단색(트림·프레임용)."""
    def f_():
        g = G(name)
        n = g.pnoise(g.x, g.z, f, f, detail=3, off=off + 3.7, vper=False)
        c = lin(col)
        dark = tuple(max(0.0, v * (1 - nz)) for v in c)
        lite = tuple(min(1.0, v * (1 + nz)) for v in c)
        return g.done(g.ramp(n, [(0.3, dark), (0.7, lite)]), rough, metal, normal=g.bump(n, 0.05, 0.01))
    return f_


def m_cap():
    g = G('cap')
    n1 = g.pnoise(g.x, g.y, 5, 5, detail=4, off=1.3)
    n2 = g.pnoise(g.x, g.y, 36, 36, detail=2, off=7.1)
    f = g.add(g.mul(n1, 0.7), g.mul(n2, 0.3))
    col = g.ramp(f, [(0.32, '#45423d'), (0.68, '#55514a')])
    return g.done(col, rough=0.92, normal=g.bump(n2, 0.12, 0.01))


def m_plaster(name, c0, c1, stain, off):
    def f_():
        g = G(name)
        n1 = g.pnoise(g.x, g.z, 5, 4, detail=4, off=off, vper=False)
        n2 = g.pnoise(g.x, g.z, 44, 44, detail=2, off=off + 1.1, vper=False)
        st = g.pnoise(g.x, g.z, 2.2, 1.8, detail=3, off=off + 2.3, vper=False)
        base = g.ramp(g.add(g.mul(n1, 0.75), g.mul(n2, 0.25)), [(0.3, c0), (0.7, c1)])
        sm = g.mul(g.step(st, 0.56, 0.72), 0.55)
        col = g.mix(sm, base, stain)
        return g.done(col, rough=0.88, normal=g.bump(n2, 0.1, 0.01))
    return f_


def m_paint_green():
    g = G('paint_green')
    n1 = g.pnoise(g.x, g.z, 6, 5, off=4.2, vper=False)
    sc = g.pnoise(g.x, g.z, 54, 30, detail=2, off=5.5, vper=False)
    base = g.ramp(n1, [(0.3, '#2c4535'), (0.7, '#355240')])
    scuff = g.mul(g.step(sc, 0.64, 0.70), 0.55)
    col = g.mix(scuff, base, '#5b6c5d')
    # 바닥 쪽 때
    gr = g.mul(g.sub(1.0, g.step(g.z, 0.0, 0.18)), 0.35)
    col = g.mix(gr, col, '#1f2b23')
    return g.done(col, rough=0.36, normal=g.bump(sc, 0.06, 0.01))


def wood_tex(g, u, v, n_boards, vper, c_dark, c_lite, seed, joints=False, groove='#2a1a10'):
    """판재 질감. u=판 가로방향(주기 1), v=결 방향. 반환 (color, height)."""
    bu = g.mul(u, n_boards)
    i = g.mod(g.floor(bu), n_boards)
    fu = g.fract(bu)
    h1 = g.hash(i, seed)
    h2 = g.hash(i, seed + 7.3)
    vv = v
    tone = h1
    joint = None
    if joints:
        t = g.add(v, h2)
        s = g.mod(g.floor(g.mul(t, 2.0)), 2.0)
        tone = g.hash(i, s, seed + 3.1)
        ft = g.fract(g.mul(t, 2.0))
        dj = g.mul(g.min(ft, g.sub(1.0, ft)), 0.5)
        joint = g.sub(1.0, g.step(dj, 0.004, 0.010))
        vv = g.add(v, g.mul(s, 0.37))
    grain = g.pnoise(g.add(u, g.mul(h2, 0.5)), vv, n_boards * 9, 2.2, detail=4, rough=0.6, dist=0.6,
                     off=seed, vper=vper)
    fine = g.pnoise(u, v, n_boards * 26, 4, detail=2, off=seed + 2, vper=vper)
    gf = g.add(g.mul(grain, 0.8), g.mul(fine, 0.2))
    col = g.ramp(gf, [(0.3, c_dark), (0.7, c_lite)])
    col = g.mix(g.mul(tone, 0.45), col, c_dark)
    du = g.div(g.min(fu, g.sub(1.0, fu)), n_boards)
    gmask = g.sub(1.0, g.step(du, 0.003, 0.009))
    if joint is not None:
        gmask = g.max(gmask, joint)
    col = g.mix(g.mul(gmask, 0.8), col, groove)
    height = g.sub(g.mul(gf, 0.15), gmask)
    return col, height


def m_wainscot():
    g = G('wainscot')
    col, h = wood_tex(g, g.x, g.z, 7, False, '#5c3f27', '#86613f', 11.0)
    return g.done(col, rough=0.5, normal=g.bump(h, 0.35, 0.02))


def m_wood_leaf(name, c_dark, c_lite, seed):
    def f_():
        g = G(name)
        col, h = wood_tex(g, g.x, g.z, 1, False, c_dark, c_lite, seed)
        return g.done(col, rough=0.55, normal=g.bump(h, 0.15, 0.02))
    return f_


def m_seal_wood():
    g = G('seal_wood')
    col, h = wood_tex(g, g.x, g.z, 10, False, '#3d2e22', '#6b5640', 31.0, groove='#1a120c')
    w = g.pnoise(g.x, g.z, 8, 6, detail=4, off=33, vper=False)
    col = g.mix(g.mul(g.step(w, 0.5, 0.75), 0.35), col, '#7a7468')   # 풍화된 회색 기
    return g.done(col, rough=0.8, normal=g.bump(h, 0.4, 0.02))


def m_wall_tile():
    g = G('wall_tile')
    rows = 8
    th = WH / rows
    u = g.mul(g.x, 8.0)
    v = g.div(g.z, th)
    ix = g.mod(g.floor(u), 8.0)
    iz = g.floor(v)
    tone = g.hash(ix, iz, 5.0)
    base = g.mix(g.mul(tone, 0.6), '#d9dbd5', '#c9ccc6')
    band = g.mul(g.step(iz, 2.5, 2.6), g.sub(1.0, g.step(iz, 3.4, 3.5)))   # 3번째 줄 띠
    base = g.mix(band, base, '#7fa3a6')
    low = g.sub(1.0, g.step(iz, 0.5, 0.6))
    base = g.mix(g.mul(low, 0.6), base, '#8c9894')
    gx = g.gline(g.x, 0.125, 0.004, 0.006)
    gz = g.gline(g.z, th, 0.0045, 0.006)
    gm = g.max(gx, gz)
    dirt = g.pnoise(g.x, g.z, 20, 20, off=6.0, vper=False)
    gcol = g.ramp(dirt, [(0.3, '#6f716b'), (0.7, '#8e9089')])
    col = g.mix(gm, base, gcol)
    sm = g.pnoise(g.x, g.z, 6, 6, off=7.0, vper=False)
    col = g.mix(g.mul(g.step(sm, 0.6, 0.8), 0.25), col, '#a9a58f')
    return g.done(col, rough=0.22, normal=g.bump(g.sub(1.0, gm), 0.25, 0.01))


def rivets(g, u, v, along_u_period, seam_off, r):
    """v=이음매 좌표(v=0 이 이음매, 주기 1), u=이음매를 따라가는 좌표.
    이음매 양쪽 seam_off 거리에 along_u_period 간격으로 리벳. 반환 (머리 마스크, 돔 높이 0..1)."""
    du = g.mul(g.sub(g.fract(g.add(g.div(u, along_u_period), 0.5)), 0.5), along_u_period)
    dv = g.sub(g.abs(g.sub(g.fract(g.add(v, 0.5)), 0.5)), seam_off)
    d = g.sqrt(g.add(g.mul(du, du), g.mul(dv, dv)))
    m = g.sub(1.0, g.step(d, r * 0.75, r))
    dome = g.sqrt(g.max(g.sub(1.0, g.mul(g.div(d, r), g.div(d, r))), 0.0))
    return m, dome


def m_galv(name, wall):
    """아연 도금 철판: 스팽글 무늬 + 판 이음매 + 이음매 양옆 리벳 줄."""
    def f_():
        g = G(name)
        a = g.x
        b = g.z if wall else g.y
        vp = not wall
        _, sp = g.pvoronoi(a, b, 9, 9 if vp else 6, off=41.0, vper=vp)
        fine = g.pnoise(a, b, 50, 50, detail=2, off=42.0, vper=vp)
        f = g.add(g.mul(sp, 0.55), g.mul(fine, 0.45))
        col = g.ramp(f, [(0.2, '#7c8386'), (0.8, '#a3a9ab')])
        grime = g.pnoise(a, b, 3, 3, detail=4, off=43.0, vper=vp)
        col = g.mix(g.mul(g.step(grime, 0.5, 0.72), 0.45), col, '#5f625c')
        rr = 0.026
        if wall:
            zs = WH * 0.5
            sv = g.gline(a, 1.0, 0.009, 0.006)
            sh = g.gline(g.sub(b, zs), 4.0, 0.009, 0.006)          # z=WH/2 한 줄
            r1, d1 = rivets(g, b, a, 0.126, 0.05, rr)                 # 세로 이음매(x=0) 양옆
            r2, d2 = rivets(g, a, g.sub(b, zs), 0.125, 0.05, rr)      # 가로 이음매 양옆
            low = g.mul(g.sub(1.0, g.step(b, 0.0, 0.35)), 0.55)
            col = g.mix(low, col, '#4f524c')
        else:
            sv = g.gline(a, 1.0, 0.009, 0.006)
            sh = g.gline(b, 1.0, 0.009, 0.006)
            r1, d1 = rivets(g, b, a, 0.2, 0.05, rr)
            r2, d2 = rivets(g, a, b, 0.2, 0.05, rr)
        seam = g.max(sv, sh)
        col = g.mix(g.mul(seam, 0.95), col, '#2e3233')
        rv = g.max(r1, r2)
        dome = g.max(d1, d2)
        col = g.mix(g.mul(rv, 0.85), col, g.ramp(dome, [(0.0, '#5d6264'), (0.6, '#b9bec0'), (1.0, '#dfe3e4')]))
        h = g.add(g.sub(g.mul(fine, 0.1), g.mul(seam, 1.5)), g.mul(dome, 1.6))
        return g.done(col, rough=0.42, metal=0.45, normal=g.bump(h, 0.6, 0.02))
    return f_


def m_wall_dark():
    g = G('wall_dark')
    n = g.pnoise(g.x, g.z, 6, 5, detail=4, off=51.0, vper=False)
    col = g.ramp(n, [(0.3, '#333436'), (0.7, '#3d3e40')])
    return g.done(col, rough=0.9)


def m_sky(name, frosted=False, interior=False):
    def f_():
        g = G(name)
        grad = g.mr(g.z, 0.6, 1.42)
        if interior:
            col = g.ramp(grad, [(0, '#1d2229'), (1, '#12151a')])
        elif frosted:
            col = g.ramp(grad, [(0, '#2f3f5e'), (1, '#1c2742')])
        else:
            col = g.ramp(grad, [(0, '#1e2d4e'), (1, '#0a1229')])
        s = g.fract(g.add(g.x, g.mul(g.z, 0.9)))
        streak = g.add(g.sub(1.0, g.step(g.abs(g.sub(s, 0.30)), 0.0, 0.06)),
                       g.mul(g.sub(1.0, g.step(g.abs(g.sub(s, 0.40)), 0.0, 0.025)), 0.7))
        col = g.mix(g.mul(streak, 0.22 if not interior else 0.16), col, '#7d8eb0')
        if frosted:
            n = g.pnoise(g.x, g.z, 40, 40, detail=2, off=61.0, vper=False)
            col = g.mix(g.mul(n, 0.25), col, '#4a5a7a')
        return g.emission(col, 1.0)
    return f_


def m_glass_door():
    g = G('glass_door')
    s = g.fract(g.add(g.x, g.mul(g.z, 0.9)))
    streak = g.sub(1.0, g.step(g.abs(g.sub(s, 0.32)), 0.0, 0.07))
    col = g.mix(g.mul(streak, 0.35), '#26343a', '#9fb2b8')
    alpha = g.add(0.36, g.mul(streak, 0.22))
    return g.done(col, rough=0.08, alpha=alpha, spec=0.6)


def m_shadow():
    g = G('pass_shadow')
    a = g.mr(g.y, -1.0, 0.05, 0.06, 0.40, 'SMOOTHSTEP')
    return g.done('#07080a', rough=1.0, alpha=a, spec=0.0)


def m_shutter():
    g = G('shutter')
    p = 0.07
    v = g.fract(g.div(g.z, p))
    tri = g.abs(g.sub(v, 0.5))           # 0..0.5
    groove = g.sub(1.0, g.step(tri, 0.38, 0.47))  # 주름 사이 홈 (1=판)
    n = g.pnoise(g.x, g.z, 24, 10, detail=3, off=71.0, vper=False)
    col = g.ramp(n, [(0.3, '#7f7d75'), (0.7, '#918e85')])
    col = g.mix(g.mul(g.sub(1.0, groove), 0.85), col, '#3e3d3a')
    hi = g.sub(1.0, g.step(g.abs(g.sub(v, 0.72)), 0.0, 0.12))
    col = g.mix(g.mul(hi, 0.3), col, '#b3b0a6')
    rust = g.pnoise(g.x, g.z, 10, 8, detail=4, off=72.0, vper=False)
    col = g.mix(g.mul(g.step(rust, 0.62, 0.75), 0.4), col, '#6a5a48')
    h = g.add(g.mul(g.sub(0.5, tri), 2.0), g.mul(groove, 0.3))
    return g.done(col, rough=0.5, metal=0.35, normal=g.bump(h, 0.6, 0.03))


# ---------- 바닥
def m_terrazzo():
    g = G('terrazzo')
    cl = g.pnoise(g.x, g.y, 3, 3, detail=4, off=11.0)
    f1 = g.pnoise(g.x, g.y, 40, 40, detail=1.5, off=12.0)
    f2 = g.pnoise(g.x, g.y, 40, 40, detail=1.5, off=13.5)
    f3 = g.pnoise(g.x, g.y, 24, 24, detail=1.5, off=14.7)
    base = g.ramp(cl, [(0.35, '#97a294'), (0.65, '#a4ae9f')])
    c = g.mix(g.step(f1, 0.64, 0.68), base, '#5c635a')
    c = g.mix(g.step(f2, 0.65, 0.69), c, '#cfd4c8')
    c = g.mix(g.mul(g.step(f3, 0.67, 0.71), 0.75), c, '#73866f')
    grid = g.max(g.gline(g.x, 1.0, 0.0045, 0.005), g.gline(g.y, 1.0, 0.0045, 0.005))
    c = g.mix(g.mul(grid, 0.85), c, '#6e6b57')
    wear = g.pnoise(g.x, g.y, 2, 2, detail=3, off=15.0)
    c = g.mix(g.mul(g.step(wear, 0.55, 0.75), 0.18), c, '#7d8478')
    return g.done(c, rough=0.4, normal=g.bump(g.sub(1.0, grid), 0.2, 0.01))


def m_floor_wood():
    g = G('floor_wood')
    col, h = wood_tex(g, g.x, g.y, 8, True, '#6b4c30', '#9a7550', 21.0, joints=True, groove='#2e1f13')
    return g.done(col, rough=0.48, normal=g.bump(h, 0.3, 0.02))


def m_floor_tile():
    g = G('floor_tile')
    u = g.mul(g.x, 4.0)
    v = g.mul(g.y, 4.0)
    ix = g.mod(g.floor(u), 4.0)
    iy = g.mod(g.floor(v), 4.0)
    tone = g.hash(ix, iy, 9.0)
    base = g.mix(g.mul(tone, 0.7), '#d6d8d2', '#c6c9c2')
    glaze = g.pnoise(g.x, g.y, 14, 14, detail=3, off=81.0)
    base = g.mix(g.mul(g.step(glaze, 0.55, 0.75), 0.3), base, '#b4b39f')
    gm = g.max(g.gline(g.x, 0.25, 0.0055, 0.006), g.gline(g.y, 0.25, 0.0065, 0.007))
    dirt = g.pnoise(g.x, g.y, 18, 18, off=82.0)
    gcol = g.ramp(dirt, [(0.3, '#6a6b64'), (0.7, '#878880')])
    col = g.mix(gm, base, gcol)
    return g.done(col, rough=0.2, normal=g.bump(g.sub(1.0, gm), 0.3, 0.01))


def m_floor_stone():
    g = G('floor_stone')
    cl = g.pnoise(g.x, g.y, 4, 4, detail=4, off=91.0)
    s1 = g.pnoise(g.x, g.y, 52, 52, detail=1.5, off=92.0)
    s2 = g.pnoise(g.x, g.y, 52, 52, detail=1.5, off=93.3)
    s3 = g.pnoise(g.x, g.y, 30, 30, detail=1.5, off=94.6)
    ix = g.mod(g.floor(g.mul(g.x, 2.0)), 2.0)
    iy = g.mod(g.floor(g.mul(g.y, 2.0)), 2.0)
    tone = g.hash(ix, iy, 95.0)
    base = g.ramp(cl, [(0.3, '#85837e'), (0.7, '#94928c')])
    base = g.mix(g.mul(tone, 0.35), base, '#6f6d68')
    c = g.mix(g.step(s1, 0.62, 0.66), base, '#3e3d3b')
    c = g.mix(g.step(s2, 0.64, 0.68), c, '#c9c7c0')
    c = g.mix(g.mul(g.step(s3, 0.66, 0.70), 0.6), c, '#8a7f74')
    jm = g.max(g.gline(g.x, 0.5, 0.005, 0.005), g.gline(g.y, 0.5, 0.006, 0.006))
    c = g.mix(g.mul(jm, 0.9), c, '#45433f')
    return g.done(c, rough=0.32, normal=g.bump(g.sub(1.0, jm), 0.3, 0.01))


def m_stair_tread():
    g = G('stair_tread')
    cl = g.pnoise(g.x, g.y, 3, 3, detail=4, off=101.0)
    f1 = g.pnoise(g.x, g.y, 40, 40, detail=1.5, off=102.0)
    f2 = g.pnoise(g.x, g.y, 40, 40, detail=1.5, off=103.5)
    base = g.ramp(cl, [(0.35, '#aeafa7'), (0.65, '#bbbcb4')])
    c = g.mix(g.step(f1, 0.64, 0.68), base, '#62635e')
    c = g.mix(g.step(f2, 0.65, 0.69), c, '#dcdcd5')
    # 발에 닳은 가운데 + 단 앞쪽(계단코 바로 뒤) 살짝 밝게
    wear = g.mul(g.sub(1.0, g.step(g.abs(g.sub(g.fract(g.x), 0.5)), 0.12, 0.38)), 0.18)
    c = g.mix(wear, c, '#cfd0c8')
    return g.done(c, rough=0.45)


def m_stair_riser():
    g = G('stair_riser')
    cl = g.pnoise(g.x, g.z, 6, 6, detail=4, off=111.0, vper=False)
    f1 = g.pnoise(g.x, g.z, 40, 40, detail=1.5, off=112.0, vper=False)
    base = g.ramp(cl, [(0.35, '#5e5f5a'), (0.65, '#6a6b65')])
    c = g.mix(g.step(f1, 0.64, 0.68), base, '#43443f')
    # 아래쪽(다음 단 디딤판과 만나는 곳) 때
    c = g.mix(g.mul(g.sub(1.0, g.step(g.z, -0.12, -0.02)), 0.6), c, '#393a36')
    return g.done(c, rough=0.6)


MATS = {
    'cap': m_cap,
    'plaster': m_plaster('plaster', '#c5bb9c', '#d2c9ab', '#a99d7c', 201.0),
    'plaster_w': m_plaster('plaster_w', '#cfc9b6', '#dbd5c3', '#b2a98f', 211.0),
    'green': m_paint_green,
    'wainscot': m_wainscot,
    'trim_wood': m_flat('trim_wood', '#4f3524', 0.45, f=40, off=1),
    'base_dark': m_flat('base_dark', '#232925', 0.5, off=2),
    'base_brown': m_flat('base_brown', '#2e2119', 0.5, off=3),
    'wall_tile': m_wall_tile,
    'wall_vent': m_galv('wall_vent', True),
    'wall_dark': m_wall_dark,
    'other': m_flat('other', '#2a2a2a', 0.9, off=4),
    'sill': m_flat('sill', '#a7a49b', 0.7, nz=0.1, f=20, off=5),
    'alu': m_flat('alu', '#a3a6a5', 0.35, metal=0.6, nz=0.04, off=6),
    'alu_dark': m_flat('alu_dark', '#5e6264', 0.4, metal=0.5, nz=0.04, off=7),
    'win_wood': m_flat('win_wood', '#5a3f2b', 0.5, f=40, off=8),
    'sky': m_sky('sky'),
    'sky_frost': m_sky('sky_frost', frosted=True),
    'interior': m_sky('interior', interior=True),
    'glass_door': m_glass_door,
    'shadow': m_shadow,
    'leaf_wood': m_wood_leaf('leaf_wood', '#6f4f33', '#977352', 301.0),
    'casing': m_flat('casing', '#3e2a1c', 0.45, f=40, off=9),
    'handle': m_flat('handle', '#1d1d1d', 0.4, metal=0.5, off=10),
    'chrome': m_flat('chrome', '#c8cbcc', 0.25, metal=0.9, nz=0.03, off=11),
    'steel_leaf': m_flat('steel_leaf', '#7a8187', 0.45, metal=0.35, nz=0.05, f=12, off=12),
    'steel_frame': m_flat('steel_frame', '#474c50', 0.45, metal=0.4, off=13),
    'wire_glass': m_sky('wire_glass', interior=True),
    'shutter': m_shutter,
    'shutter_box': m_flat('shutter_box', '#6f6e68', 0.55, metal=0.3, nz=0.06, f=16, off=14),
    'rail_steel': m_flat('rail_steel', '#55575a', 0.5, metal=0.4, off=15),
    'seal_wood': m_seal_wood,
    'seal_frame': m_wood_leaf('seal_frame', '#2f2219', '#4b3828', 311.0),
    'iron': m_flat('iron', '#2b2a28', 0.6, metal=0.6, nz=0.1, off=16),
    'seal_disc': m_flat('seal_disc', '#a48d6b', 0.7, nz=0.1, f=18, off=17),
    'carve': m_flat('carve', '#1b130d', 0.9, off=18),
    'terrazzo': m_terrazzo,
    'floor_wood': m_floor_wood,
    'floor_tile': m_floor_tile,
    'floor_stone': m_floor_stone,
    'floor_metal': m_galv('floor_metal', False),
    'stair_tread': m_stair_tread,
    'stair_riser': m_stair_riser,
    'nosing': m_flat('nosing', '#3a3b39', 0.5, metal=0.3, off=19),
}


# ---------------------------------------------------------------- 지오메트리 도우미
def bx(x0, x1, y0, y1, z0, z1, m, bevel=0.0, name='b'):
    o = C.box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
              MAT(m) if isinstance(m, str) else m, bevel=bevel)
    if bevel > 0:
        # 평평한 면은 플랫 셰이딩(스무스 보간으로 원기둥처럼 보이는 것 방지), 베벨 면만 스무스
        for p in o.data.polygons:
            n = p.normal
            p.use_smooth = max(abs(n.x), abs(n.y), abs(n.z)) < 0.999
    return o


def mbox(x0, x1, y0, y1, z0, z1, front, top=None, other='other', name='mb'):
    """면 방향별 재질 박스: 윗면(top), 남쪽면(front), 나머지(other)."""
    top = top or front
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5) * (x1 - x0)
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    mats = []
    for mm in (front, top, other):
        if mm not in mats:
            mats.append(mm)
    bm.normal_update()
    for f in bm.faces:
        n = f.normal
        if n.z > 0.5:
            f.material_index = mats.index(top)
        elif n.y < -0.5:
            f.material_index = mats.index(front)
        else:
            f.material_index = mats.index(other)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    for mm in mats:
        me.materials.append(MAT(mm))
    return o


def zone(x_lo, x_hi, z_lo, z_hi, front, holes=(), top=None, hole_bottom=None):
    """벽 몸체 한 구역(z_lo..z_hi). holes=[(x0,x1,z0,z1)] 는 같은 z 범위의 관통 구멍."""
    if top == 'cap' and abs(z_hi - WH) < 1e-6:
        # 윗면 앞 모서리의 얇은 턱: 정면 맨 위 1~2px 가 어두운 모서리선이 되어 윗면/정면 경계가 또렷하고,
        # 축소 필터가 경계에서 밝은 정면색을 윗면으로 번지게 하지 않는다.
        bx(x_lo, x_hi, FRONT - 0.012, FRONT, WH - 0.03, WH, 'cap', name='lip')
    if not holes:
        return [mbox(x_lo, x_hi, FRONT, BACK, z_lo, z_hi, front, top)]
    hz0, hz1 = holes[0][2], holes[0][3]
    out = []
    if hz0 > z_lo + 1e-6:
        out.append(mbox(x_lo, x_hi, FRONT, BACK, z_lo, hz0, front, hole_bottom or front))
    if hz1 < z_hi - 1e-6:
        out.append(mbox(x_lo, x_hi, FRONT, BACK, hz1, z_hi, front, top))
    xs = [x_lo]
    for h in sorted(holes):
        xs += [h[0], h[1]]
    xs.append(x_hi)
    for i in range(0, len(xs), 2):
        if xs[i + 1] - xs[i] > 1e-6:
            out.append(mbox(xs[i], xs[i + 1], FRONT, BACK, hz0, hz1, front))
    return out


def plane_y(x0, x1, z0, z1, y, m, name='pl'):
    return bx(x0, x1, y, y + 0.002, z0, z1, m, name=name)


def text_mesh(body, size, loc, m):
    cu = bpy.data.curves.new('txt', 'FONT')
    cu.body = body
    cu.font = bpy.data.fonts.load(FONT, check_existing=True)
    cu.size = size
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.extrude = 0.003
    o = bpy.data.objects.new('txt', cu)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (math.pi / 2, 0, 0)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    mo = bpy.data.objects.new('txtm', me)
    bpy.context.scene.collection.objects.link(mo)
    mo.matrix_world = o.matrix_world.copy()
    bpy.data.objects.remove(o, do_unlink=True)
    me.materials.append(MAT(m))
    return mo


def split_x(o, xs):
    """메시 오브젝트를 월드 x=xs 에서 잘라 (왼쪽, 오른쪽) 두 오브젝트로."""
    bpy.context.view_layer.update()
    mw = o.matrix_world.copy()
    res = []
    for keep_left in (True, False):
        me = o.data.copy()
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.transform(mw)
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(xs, 0, 0), plane_no=(1, 0, 0),
                               clear_outer=keep_left, clear_inner=not keep_left)
        bmesh.ops.holes_fill(bm, edges=bm.edges[:], sides=0)
        bm.to_mesh(me)
        bm.free()
        no = bpy.data.objects.new(o.name + ('L' if keep_left else 'R'), me)
        bpy.context.scene.collection.objects.link(no)
        res.append(no)
    bpy.data.objects.remove(o, do_unlink=True)
    return res


def hinge(objs, pivot, angle):
    e = C.empty('hinge', loc=pivot)
    bpy.context.view_layer.update()
    inv = e.matrix_world.inverted()
    for o in objs:
        o.parent = e
        o.matrix_parent_inverse = inv
    e.rotation_euler = (0, 0, angle)
    return e


def cyl_y(r, y0, y1, x, z, m, verts=32, name='cy'):
    """y 축 방향 원기둥(문 앞면에 붙는 원판)."""
    return C.cyl(name, r, y1 - y0, (x, (y0 + y1) / 2, z), MAT(m), verts=verts, rot=(math.pi / 2, 0, 0))


def ring_y(r0, r1, y0, y1, x, z, m, segs=40, name='ring'):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = []
    for i in range(segs):
        a = TAU * i / segs
        ca, sa = math.cos(a), math.sin(a)
        vs.append([bm.verts.new((x + r * ca, y, z + r * sa)) for r in (r0, r1) for y in (y0, y1)])
    for i in range(segs):
        a, b = vs[i], vs[(i + 1) % segs]
        # 인덱스: 0=(r0,y0) 1=(r0,y1) 2=(r1,y0) 3=(r1,y1)
        bm.faces.new((a[0], b[0], b[2], a[2]))  # 앞면(y0)
        bm.faces.new((a[3], b[3], b[1], a[1]))  # 뒷면
        bm.faces.new((a[2], b[2], b[3], a[3]))  # 바깥
        bm.faces.new((a[1], b[1], b[0], a[0]))  # 안쪽
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(MAT(m))
    return o


# ---------------------------------------------------------------- 바닥
def floor_plane(m):
    bx(-1.3, 2.3, -2.3, 1.3, -0.001, 0.0, m, name='floor')


def build_floor_stairs():
    """주기 1/3 의 톱니 단면: 챌판(남향 수직면)이 카메라를 향해 '북쪽으로 오르는' 계단으로 읽힌다."""
    p, d = 1.0 / 3.0, 0.12
    y0, n = -2.5 + 1.0 / 6.0, 12
    x0, x1 = -0.3, 1.3
    me = bpy.data.meshes.new('stairs')
    bm = bmesh.new()
    prof = []
    for k in range(n):
        yk = y0 + k * p
        prof += [(yk, -d), (yk, 0.0)]
    prof.append((y0 + n * p, -d))
    L = [bm.verts.new((x0, y, z)) for y, z in prof]
    R = [bm.verts.new((x1, y, z)) for y, z in prof]
    for i in range(len(prof) - 1):
        f = bm.faces.new((L[i], R[i], R[i + 1], L[i + 1]))
        f.material_index = 0 if prof[i + 1][1] < prof[i][1] else 1
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('stairs', me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(MAT('stair_tread'))
    me.materials.append(MAT('stair_riser'))
    # 논슬립(계단코)
    for k in range(n):
        yk = y0 + k * p
        bx(x0, x1, yk - 0.006, yk + 0.045, -0.016, 0.005, 'nosing', bevel=0.004, name='nose')


# ---------------------------------------------------------------- 벽
STYLE = {
    # lower(): 하단부 생성, 반환 = 상단 회벽 시작 높이
    'corridor': dict(upper='plaster'),
    'wood': dict(upper='plaster_w'),
    'tile': dict(upper='wall_tile'),
}


def lower_corridor(x_lo=XL, x_hi=XR):
    zone(x_lo, x_hi, -0.02, 0.52, 'green')
    bx(x_lo, x_hi, -1.022, -0.99, 0.50, 0.556, 'trim_wood', bevel=0.007, name='rail')
    bx(x_lo, x_hi, -1.012, -0.99, -0.02, 0.07, 'base_dark', bevel=0.004, name='base')
    return 0.52


def lower_wood(x_lo=XL, x_hi=XR):
    zone(x_lo, x_hi, -0.02, 0.62, 'wainscot')
    bx(x_lo, x_hi, -1.008, -0.99, -0.02, 0.62, 'wainscot', name='wainscot')
    bx(x_lo, x_hi, -1.034, -0.99, 0.60, 0.66, 'trim_wood', bevel=0.008, name='caprail')
    bx(x_lo, x_hi, -1.02, -0.99, -0.02, 0.06, 'base_brown', bevel=0.004, name='base')
    return 0.62


def lower_tile(x_lo=XL, x_hi=XR):
    return -0.02


LOWER = {'corridor': lower_corridor, 'wood': lower_wood, 'tile': lower_tile}


def build_wall(style):
    zl = LOWER[style]()
    zone(XL, XR, zl, WH, STYLE[style]['upper'], top='cap')


def build_wall_vent():
    zone(XL, XR, -0.02, WH, 'wall_vent', top='cap')
    # 아래쪽 보강 앵글
    bx(XL, XR, -1.02, -0.99, -0.02, 0.05, 'rail_steel', bevel=0.004, name='angle')


def build_wall_top():
    zone(XL, XR, -0.02, WH, 'wall_dark', top='cap')


def build_window(style):
    """바깥 창: 큰 알루미늄 미서기창, 유리 너머 밤하늘."""
    zl = LOWER[style]()
    hz0 = {'corridor': 0.64, 'wood': 0.71, 'tile': 0.66}[style]
    hz1 = 1.37
    wx0, wx1 = 0.06, 0.94
    up = STYLE[style]['upper']
    if zl < hz0:
        zone(XL, XR, zl, hz0, up, top='sill')
    zone(XL, XR, hz0, WH, up, holes=[(wx0, wx1, hz0, hz1)], top='cap')
    sky = 'sky_frost' if style == 'tile' else 'sky'
    plane_y(wx0 - 0.01, wx1 + 0.01, hz0 - 0.01, hz1 + 0.01, -0.90, sky, name='glass')
    yf0, yf1 = -0.95, -0.915
    a = 'alu'
    # 바깥 틀
    bx(wx0, wx0 + 0.028, yf0, yf1, hz0 + 0.032, hz1 - 0.028, a, bevel=0.004)
    bx(wx1 - 0.028, wx1, yf0, yf1, hz0 + 0.032, hz1 - 0.028, a, bevel=0.004)
    bx(wx0, wx1, yf0, yf1, hz1 - 0.028, hz1, a, bevel=0.004)
    bx(wx0, wx1, yf0, yf1, hz0, hz0 + 0.032, a, bevel=0.004)
    # 미서기 창짝 2장(앞/뒤 레일) + 가로살
    zt = hz0 + (hz1 - hz0) * 0.68
    for (sx0, sx1, yy) in ((wx0 + 0.02, 0.515, -0.955), (0.485, wx1 - 0.02, -0.935)):
        bx(sx0, sx0 + 0.022, yy - 0.012, yy, hz0 + 0.02, hz1 - 0.02, a, bevel=0.003)
        bx(sx1 - 0.022, sx1, yy - 0.012, yy, hz0 + 0.02, hz1 - 0.02, a, bevel=0.003)
        bx(sx0, sx1, yy - 0.012, yy, hz0 + 0.02, hz0 + 0.045, a, bevel=0.003)
        bx(sx0, sx1, yy - 0.012, yy, hz1 - 0.04, hz1 - 0.02, a, bevel=0.003)
        bx(sx0, sx1, yy - 0.012, yy, zt - 0.011, zt + 0.011, a, bevel=0.003)
    bx(0.488, 0.512, -0.972, -0.955, zt - 0.10, zt - 0.05, 'alu_dark', bevel=0.003, name='lock')
    # 창턱
    bx(wx0 - 0.03, wx1 + 0.03, -1.055, -0.93, hz0 - 0.03, hz0 + 0.004, 'sill', bevel=0.006, name='sill')
    if style == 'wood':
        # 교실: 한쪽에 묶어 둔 커튼
        bx(0.075, 0.17, -0.975, -0.955, hz0 + 0.06, hz1 - 0.01, MAT('curtain'), bevel=0.02, name='curtain')
        bx(0.07, 0.175, -0.985, -0.95, zt - 0.05, zt - 0.02, MAT('curtain_tie'), bevel=0.008, name='tie')


def build_inner_window(style):
    """복도-교실 사이 벽: 위쪽 절반에 작은 창 3개."""
    zl = LOWER[style]()
    hz0, hz1 = 0.82, 1.36
    up = STYLE[style]['upper']
    zone(XL, XR, zl, hz0, up, top='win_wood')
    zone(XL, XR, hz0, WH, up, holes=[(0.05, 0.95, hz0, hz1)], top='cap')
    plane_y(0.04, 0.96, hz0 - 0.01, hz1 + 0.01, -0.93, 'interior', name='glass')
    w = 'win_wood'
    yf0, yf1 = -0.975, -0.93
    bx(0.05, 0.085, yf0, yf1, hz0 + 0.035, hz1 - 0.035, w, bevel=0.004)
    bx(0.915, 0.95, yf0, yf1, hz0 + 0.035, hz1 - 0.035, w, bevel=0.004)
    bx(0.05, 0.95, yf0, yf1, hz1 - 0.035, hz1, w, bevel=0.004)
    bx(0.05, 0.95, yf0, yf1, hz0, hz0 + 0.035, w, bevel=0.004)
    inner = 0.95 - 0.085
    for k in (1, 2):
        xm = 0.085 + inner * k / 3
        bx(xm - 0.015, xm + 0.015, yf0, yf1, hz0 + 0.035, hz1 - 0.035, w, bevel=0.004)
    zm = (hz0 + hz1) / 2 + 0.02
    bx(0.05, 0.95, yf0 + 0.01, yf1, zm - 0.01, zm + 0.01, w, bevel=0.003)
    bx(0.03, 0.97, -1.03, -0.93, hz0 - 0.025, hz0 + 0.004, w, bevel=0.005, name='sill')


# ---------------------------------------------------------------- 문
# 문 스프라이트는 남쪽 바닥 종류와 무관하게 하나만 쓰이므로(복도 쪽 벽 / 교실 쪽 벽 모두),
# 문틀이 셀 폭 전체를 덮게 해서 옆 벽의 아랫단(초록 페인트·징두리널·타일)과 어디서든 맞물리게 한다.

def pass_shadow(x0, x1, y0=-1.0, y1=0.05):
    """통로 바닥 그림자: 단면 평면(반투명), 안쪽(북쪽)일수록 진함. 엔진이 그린 바닥이 비친다."""
    me = bpy.data.meshes.new('shadow')
    bm = bmesh.new()
    z = 0.0012
    vs = [bm.verts.new(p) for p in ((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z))]
    bm.faces.new(vs)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('shadow', me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(MAT('shadow'))
    return o


def door_wall(x0, x1, zt, casing='casing', head=0.06, plinth='base_brown', y_case=-1.026, upper='plaster'):
    """문 셀 벽: 통로 구멍 (x0..x1, 0..zt) + 셀 폭 전체 문틀(좌우 기둥·상인방) + 통로 그림자."""
    zone(XL, XR, -0.02, WH, upper, holes=[(x0, x1, -0.02, zt)], top='cap')
    if casing:
        bx(0.0, x0, y_case, -0.99, -0.01, zt, casing, bevel=0.006, name='jambL')
        bx(x1, 1.0, y_case, -0.99, -0.01, zt, casing, bevel=0.006, name='jambR')
        bx(0.0, 1.0, y_case, -0.99, zt, zt + head, casing, bevel=0.006, name='head')
        # 안쪽 멈춤 비드(문틀 깊이감)
        bx(x0 - 0.016, x0, y_case - 0.008, y_case + 0.01, -0.01, zt + 0.012, casing, bevel=0.003, name='beadL')
        bx(x1, x1 + 0.016, y_case - 0.008, y_case + 0.01, -0.01, zt + 0.012, casing, bevel=0.003, name='beadR')
        bx(x0, x1, y_case - 0.008, y_case + 0.01, zt - 0.004, zt + 0.012, casing, bevel=0.003, name='beadT')
        if plinth:
            for (a0, a1) in ((0.0, x0 - 0.016), (x1 + 0.016, 1.0)):
                bx(a0, a1, y_case - 0.004, -0.99, -0.01, 0.075, plinth, bevel=0.004, name='plinth')
    pass_shadow(x0, x1)


def leaf_panel(x0, x1, z0, z1, y0, y1, m, hole=None, glass=None, bevel=0.005):
    """문짝 판: hole=(hx0,hx1,hz0,hz1) 이면 유리 구멍을 내고 glass 재질 판을 뒤에 둔다."""
    objs = []
    if hole is None:
        objs.append(bx(x0, x1, y0, y1, z0, z1, m, bevel=bevel, name='leaf'))
        return objs
    hx0, hx1, hz0, hz1 = hole
    objs.append(bx(x0, x1, y0, y1, z0, hz0, m, bevel=bevel, name='leafB'))
    objs.append(bx(x0, x1, y0, y1, hz1, z1, m, bevel=bevel, name='leafT'))
    objs.append(bx(x0, hx0, y0 + 0.0015, y1 - 0.0015, hz0 - 0.01, hz1 + 0.01, m, bevel=bevel, name='leafL'))
    objs.append(bx(hx1, x1, y0 + 0.0015, y1 - 0.0015, hz0 - 0.01, hz1 + 0.01, m, bevel=bevel, name='leafR'))
    if glass:
        objs.append(plane_y(hx0 - 0.01, hx1 + 0.01, hz0 - 0.01, hz1 + 0.01, (y0 + y1) / 2, glass, name='lglass'))
    return objs


def build_classroom_door(open_):
    x0, x1, zt = 0.085, 0.915, 1.30
    door_wall(x0, x1, zt, head=0.055)
    # 미닫이 레일
    bx(x0, x1, -1.0, -0.92, 0.0, 0.007, 'alu_dark', name='track')
    yl0, yl1 = -0.982, -0.952
    dx = (x1 - x0) - 0.1 if open_ else 0.0      # 열림: 문짝이 오른쪽 벽 속으로 밀려 끝만 보임
    L0, L1 = x0 + dx, x1 + dx
    wz0, wz1 = 0.80, 1.17
    objs = leaf_panel(L0, L1, 0.004, zt, yl0, yl1, 'leaf_wood', hole=(L0 + 0.2, L1 - 0.2, wz0, wz1),
                      glass='interior')
    # 유리창 살(가운데 세로살) + 아래 판넬 몰딩 + 손잡이
    xm = (L0 + L1) / 2
    objs.append(bx(xm - 0.012, xm + 0.012, yl0 + 0.004, yl1, wz0, wz1, 'leaf_wood', name='mull'))
    objs.append(bx(L0 + 0.2, L1 - 0.2, yl0 + 0.004, yl1, (wz0 + wz1) / 2 - 0.01, (wz0 + wz1) / 2 + 0.01,
                   'leaf_wood', name='mullh'))
    for (a0, a1, b0, b1) in ((L0 + 0.115, L1 - 0.115, 0.13, 0.145), (L0 + 0.115, L1 - 0.115, 0.625, 0.64),
                             (L0 + 0.1, L0 + 0.115, 0.13, 0.64), (L1 - 0.115, L1 - 0.1, 0.13, 0.64)):
        objs.append(bx(a0, a1, yl0 - 0.008, yl0 + 0.002, b0, b1, 'casing', bevel=0.002, name='mold'))
    for hx in (L0 + 0.035, L1 - 0.06):
        objs.append(bx(hx, hx + 0.025, yl0 - 0.004, yl0 + 0.004, 0.55, 0.70, 'handle', bevel=0.003, name='pull'))


def build_glassdoor(open_):
    x0, x1, zt, ztr = 0.06, 0.94, 1.30, 1.44
    zone(XL, XR, -0.02, WH, 'plaster', holes=[(x0, x1, -0.02, ztr)], top='cap')
    pass_shadow(x0, x1)
    bx(x0, x1, -1.0, -0.9, 0.0, 0.008, 'alu_dark', name='threshold')
    a = 'alu'
    # 고정 틀(셀 폭 전체) + 상부 고정창
    bx(0.0, x0 + 0.005, -1.03, -0.95, -0.01, ztr, a, bevel=0.004)
    bx(x1 - 0.005, 1.0, -1.03, -0.95, -0.01, ztr, a, bevel=0.004)
    bx(0.0, 1.0, -1.03, -0.95, ztr, ztr + 0.03, a, bevel=0.004)
    bx(x0 + 0.005, x1 - 0.005, -1.03, -0.95, zt, zt + 0.04, a, bevel=0.004)
    bx(0.49, 0.51, -1.02, -0.95, zt + 0.04, ztr, a, bevel=0.003)
    for xx in (0.0, 1.0 - 0.02):
        bx(xx, xx + 0.02, -1.04, -1.02, -0.01, 0.075, 'alu_dark', bevel=0.003, name='foot')
    plane_y(x0, x1, zt + 0.03, ztr + 0.01, -0.975, 'interior', name='transom')
    # 문짝 2장
    yl0, yl1 = -0.99, -0.955
    leaves = []
    for side in (0, 1):
        lx0, lx1 = (x0 + 0.004, 0.498) if side == 0 else (0.502, x1 - 0.004)
        objs = []
        st = 0.04
        objs.append(bx(lx0, lx0 + st, yl0, yl1, 0.006, zt - 0.004, a, bevel=0.004))
        objs.append(bx(lx1 - st, lx1, yl0, yl1, 0.006, zt - 0.004, a, bevel=0.004))
        objs.append(bx(lx0 + st, lx1 - st, yl0, yl1, zt - 0.045, zt - 0.004, a, bevel=0.004))
        objs.append(bx(lx0 + st, lx1 - st, yl0, yl1, 0.006, 0.13, a, bevel=0.004))
        objs.append(plane_y(lx0 + st - 0.005, lx1 - st + 0.005, 0.12, zt - 0.04, (yl0 + yl1) / 2, 'glass_door',
                            name='gl'))
        # 세로 바 손잡이
        hx = lx1 - 0.075 if side == 0 else lx0 + 0.06
        objs.append(bx(hx, hx + 0.016, yl0 - 0.04, yl0 - 0.022, 0.42, 0.86, 'chrome', bevel=0.006, name='bar'))
        for hz in (0.47, 0.81):
            objs.append(bx(hx + 0.003, hx + 0.013, yl0 - 0.03, yl0, hz - 0.008, hz + 0.008, 'chrome', name='barpost'))
        leaves.append((objs, lx0, lx1))
    if open_:
        ang = math.radians(SWING)
        hinge(leaves[0][0], (leaves[0][1], yl1, 0), IN_SIGN * ang)
        hinge(leaves[1][0], (leaves[1][2], yl1, 0), -IN_SIGN * ang)


def build_metaldoor(open_):
    x0, x1, zt = 0.11, 0.89, 1.30
    door_wall(x0, x1, zt, casing='steel_frame', head=0.065, plinth='base_dark')
    bx(x0, x1, -1.0, -0.93, 0.0, 0.006, 'rail_steel', name='threshold')
    yl0, yl1 = -0.985, -0.955
    wx0, wx1, wz0, wz1 = 0.40, 0.60, 0.86, 1.14
    objs = leaf_panel(x0 + 0.004, x1 - 0.004, 0.006, zt - 0.004, yl0, yl1, 'steel_leaf',
                      hole=(wx0, wx1, wz0, wz1), glass='wire_glass', bevel=0.006)
    # 망입유리 철망
    for k in range(1, 4):
        xx = wx0 + (wx1 - wx0) * k / 4
        objs.append(bx(xx - 0.002, xx + 0.002, yl0 + 0.01, yl0 + 0.014, wz0, wz1, 'alu_dark', name='wire'))
    for k in range(1, 5):
        zz = wz0 + (wz1 - wz0) * k / 5
        objs.append(bx(wx0, wx1, yl0 + 0.01, yl0 + 0.014, zz - 0.002, zz + 0.002, 'alu_dark', name='wire'))
    # 루버(하단 환기 갤러리)
    objs.append(bx(0.31, 0.69, yl0 - 0.006, yl0 + 0.004, 0.1, 0.32, 'steel_frame', bevel=0.004, name='louverF'))
    for k in range(5):
        zz = 0.13 + k * 0.04
        objs.append(bx(0.325, 0.675, yl0 - 0.016, yl0 - 0.004, zz, zz + 0.022, 'steel_leaf', bevel=0.004, name='slat'))
    # 레버 손잡이 + 열쇠구멍 판
    objs.append(bx(0.795, 0.835, yl0 - 0.01, yl0, 0.50, 0.70, 'chrome', bevel=0.006, name='rose'))
    objs.append(bx(0.715, 0.825, yl0 - 0.04, yl0 - 0.01, 0.625, 0.65, 'chrome', bevel=0.008, name='lever'))
    objs.append(cyl_y(0.009, yl0 - 0.013, yl0 - 0.008, 0.815, 0.54, 'handle', name='keyhole'))
    # 경첩
    for hz in (0.18, 1.04):
        bx(x0 - 0.008, x0 + 0.012, yl0 - 0.012, yl0, hz, hz + 0.09, 'rail_steel', bevel=0.003, name='hingeplate')
    if open_:
        hinge(objs, (x0 + 0.004, yl1, 0), IN_SIGN * math.radians(SWING))


def build_shutter(open_):
    x0, x1, zt = 0.04, 0.96, 1.32
    zone(XL, XR, -0.02, WH, 'plaster', holes=[(x0, x1, -0.02, zt)], top='cap')
    pass_shadow(x0, x1)
    # 가이드 레일
    for (a0, a1) in ((-0.01, x0 + 0.03), (x1 - 0.03, 1.01)):
        bx(a0, a1, -1.045, -0.99, -0.01, zt + 0.02, 'rail_steel', bevel=0.005, name='guide')
    # 셔터 박스(감김통)
    bx(-0.01, 1.01, -1.075, -0.99, zt, WH - 0.035, 'shutter_box', bevel=0.012, name='box')
    bx(-0.01, 1.01, -1.08, -1.05, zt + 0.02, zt + 0.035, 'rail_steel', bevel=0.004, name='boxline')
    if not open_:
        bx(x0 + 0.02, x1 - 0.02, -1.03, -1.012, 0.04, zt + 0.01, 'shutter', name='curtain')
        bot = 0.0
    else:
        bot = zt - 0.075
    # 하단 바(좌대) + 손잡이
    bx(x0 + 0.015, x1 - 0.015, -1.04, -1.005, bot + 0.004, bot + 0.06, 'rail_steel', bevel=0.006, name='bottombar')
    bx(0.46, 0.54, -1.05, -1.035, bot + 0.012, bot + 0.05, 'iron', bevel=0.004, name='grip')
    # 경고 표지(노란 띠)
    if not open_:
        bx(0.36, 0.64, -1.034, -1.03, 0.62, 0.72, MAT('sign_yellow'), bevel=0.003, name='sign')
        bx(0.39, 0.61, -1.037, -1.033, 0.655, 0.685, 'iron', name='signtext')


def build_sealdoor(open_):
    x0, x1, zt = 0.09, 0.91, 1.30
    door_wall(x0, x1, zt, casing=None)
    # 굵은 문설주/인방(셀 폭 전체)
    bx(0.0, x0, -1.05, -0.99, -0.01, zt, 'seal_frame', bevel=0.01, name='postL')
    bx(x1, 1.0, -1.05, -0.99, -0.01, zt, 'seal_frame', bevel=0.01, name='postR')
    bx(0.0, 1.0, -1.06, -0.99, zt, zt + 0.1, 'seal_frame', bevel=0.012, name='lintel')
    bx(x0, x1, -1.02, -0.93, 0.0, 0.03, 'seal_frame', bevel=0.006, name='sill')
    yl0, yl1 = -0.985, -0.95
    zc, xc = 0.68, 0.5
    leaves = [[], []]
    for side in (0, 1):
        lx0, lx1 = (x0 + 0.003, xc - 0.002) if side == 0 else (xc + 0.002, x1 - 0.003)
        L = leaves[side]
        L.append(bx(lx0, lx1, yl0, yl1, 0.03, zt - 0.003, 'seal_wood', bevel=0.004, name='leaf'))
        # 문짝 테두리(띠장) + 쇠 띠
        L.append(bx(lx0, lx1, yl0 - 0.012, yl0, 0.03, 0.1, 'seal_wood', bevel=0.004, name='rail'))
        L.append(bx(lx0, lx1, yl0 - 0.012, yl0, zt - 0.07, zt - 0.003, 'seal_wood', bevel=0.004, name='rail'))
        for hz in (0.24, 1.08):
            L.append(bx(lx0 + 0.01, lx1 - 0.01, yl0 - 0.018, yl0, hz, hz + 0.045, 'iron', bevel=0.004, name='strap'))
            for k in range(4):
                sx = lx0 + 0.04 + k * (lx1 - lx0 - 0.08) / 3
                L.append(cyl_y(0.008, yl0 - 0.024, yl0 - 0.016, sx, hz + 0.0225, 'iron', verts=12, name='stud'))
        # 고리 손잡이
        hx = lx1 - 0.07 if side == 0 else lx0 + 0.07
        L.append(ring_y(0.022, 0.032, yl0 - 0.03, yl0 - 0.02, hx, 0.42, 'iron', segs=20, name='pullring'))
    # 가운데 둥근 홈 + 木 음각 (양쪽 문짝에 반씩)
    rr = 0.16
    parts = [
        ring_y(rr - 0.03, rr, yl0 - 0.022, yl0 - 0.004, xc, zc, 'iron', name='sealring'),
        cyl_y(rr - 0.028, yl0 - 0.012, yl0 + 0.002, xc, zc, 'seal_disc', verts=48, name='sealdisc'),
        text_mesh('木', 0.27, (xc, yl0 - 0.0135, zc), 'carve'),
    ]
    for o in parts:
        lo, ro = split_x(o, xc)
        leaves[0].append(lo)
        leaves[1].append(ro)
    if open_:
        ang = math.radians(SWING)
        hinge(leaves[0], (x0 + 0.003, yl1, 0), IN_SIGN * ang)
        hinge(leaves[1], (x1 - 0.003, yl1, 0), -IN_SIGN * ang)


# 문짝 회전: IN_SIGN=+1 이면 안쪽(북쪽)으로 열림, -1 이면 카메라 쪽(남쪽)으로 열림
SWING = 72.0
IN_SIGN = 1


# ---------------------------------------------------------------- 세로 벽 문 (_v)
# 남북 방향 벽의 문 셀은 남쪽 벽 셀이 나중에 그려지며 이 셀의 정면·바닥(화면상 윗면 아래쪽)을
# 모두 덮는다. 엔진에서 실제로 보이는 것은 '윗면 칸'(sy -1..-0.25, 렌더 48px) 뿐이므로
# 그 칸 안에 위에서 내려다본 문을 담는다:
#   벽 윗면보다 ZR 만큼 낮은 얕은 홈(통로) + 홈 바닥 = 복도 바닥재(통과 가능해 보이게)
#   + 북쪽 측면(문틀 안쪽 면) + 남·북 문틀 기둥 + (닫힘) 가운데 남북으로 선 문짝과 양옆 멈춤대.
# 홈 바닥에서 보이는 y 범위는 [-0.735, 0] 이라(그 남쪽은 남쪽 벽 윗면 뒤) 문 구성요소를 그 안에 배치.
# 정면(sy > -0.25)은 남쪽이 벽이면 가려지고, 드물게 남쪽이 바닥이면 '벽 끝 + 문틀'로 보인다.
ZR = 0.30
ZF = WH - ZR
YN, YS = -0.07, -0.70        # 북쪽 기둥 남면 / 남쪽 기둥 북면

V_KIND = {
    'door': dict(post='casing', reveal='casing', leaf='leaf_wood', stop='trim_wood', lw=0.17),
    'glassdoor': dict(post='alu', reveal='alu_dark', leaf='glass_edge', stop='alu', lw=0.13),
    'metaldoor': dict(post='steel_frame', reveal='steel_frame', leaf='steel_leaf', stop='steel_frame', lw=0.17),
}


def build_door_v(kind, open_):
    k = V_KIND[kind]
    # 몸체: 홈 바닥(ZF)까지 꽉 찬 블록 — 윗면 = 통로 바닥재, 정면 = 어두운 벽
    mbox(XL, XR, FRONT, 0.0, -0.02, ZF, 'wall_dark', top='terrazzo', name='vbody')
    # 북쪽 측면(북쪽 벽의 남쪽 면 = 문틀 안쪽 판)
    mbox(XL, XR, 0.0, BACK, -0.02, WH, k['reveal'], top='cap', name='reveal')
    bx(XL, XR, -0.012, 0.0, WH - 0.035, WH, k['post'], bevel=0.004, name='revealtrim')
    # 남쪽 테두리(정면 위 마감 — 남쪽이 바닥인 경우 홈 속이 정면으로 비치지 않게)
    mbox(XL, XR, FRONT, FRONT + 0.006, ZF - 0.01, WH, 'wall_dark', top='cap', name='rim')
    # 홈 바닥 그늘(북쪽 측면 아래)
    me = bpy.data.meshes.new('vshadow')
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((XL, YS - 0.1, ZF + 0.001), (XR, YS - 0.1, ZF + 0.001),
                                    (XR, 0.0, ZF + 0.001), (XL, 0.0, ZF + 0.001))]
    bm.faces.new(vs)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new('vshadow', me)
    bpy.context.scene.collection.objects.link(o)
    me.materials.append(MAT('vshadow'))
    # 문틀 기둥(남·북): 문짝보다 조금 넓은 얇은 판. 열림에서도 남아 문 자리를 알려 준다.
    lw = k['lw']
    p0, p1 = 0.5 - lw / 2 - 0.05, 0.5 + lw / 2 + 0.05
    for (y0, y1) in ((YN, 0.0), (YS - 0.06, YS)):
        bx(p0, p1, y0, y1, ZF - 0.01, WH - 0.02, k['post'], bevel=0.006, name='post')
    # 정면(남쪽이 바닥일 때만 보임): 문틀 끝면
    bx(p0, p1, FRONT - 0.012, FRONT, -0.01, WH - 0.02, k['post'], bevel=0.006, name='frontpost')
    if open_:
        return
    a0, a1 = 0.5 - lw / 2, 0.5 + lw / 2
    ztop = WH - 0.075
    if kind == 'glassdoor':
        # 양개 유리문: 가운데에서 맞닿는 두 짝, 위 레일은 알루미늄, 유리 단면은 청록
        ym = (YS + YN) / 2
        for (b0, b1) in ((YS, ym - 0.008), (ym + 0.008, YN)):
            bx(a0 + 0.012, a1 - 0.012, b0, b1, ZF, ztop - 0.012, 'glass_edge', bevel=0.004, name='vglass')
            for (c0, c1) in ((b0, b0 + 0.04), (b1 - 0.04, b1)):
                bx(a0 - 0.008, a1 + 0.008, c0, c1, ZF, ztop, 'alu', bevel=0.004, name='vstile')
        # 양쪽 면 세로 손잡이 바
        for sx in (-1, 1):
            xa = 0.5 + sx * (lw / 2 + 0.035)
            for (b0, b1) in ((ym - 0.16, ym - 0.04), (ym + 0.04, ym + 0.16)):
                bx(xa - 0.012, xa + 0.012, b0, b1, ZF + 0.10, ZF + 0.13, 'chrome', bevel=0.006, name='vbar')
        return
    # 나무문/철문: 가운데 남북으로 선 문짝 + 동서 양옆 얇은 멈춤대
    bx(a0, a1, YS, YN, ZF - 0.01, ztop, k['leaf'], bevel=0.007, name='vleaf')
    for sx in (-1, 1):
        xa = 0.5 + sx * lw / 2
        xb = xa + sx * 0.03
        bx(min(xa, xb), max(xa, xb), YS, YN, ZF - 0.01, ztop - 0.07, k['stop'], bevel=0.004, name='vstop')
    # 손잡이(문짝 남쪽 끝 가까이, 양면)
    for sx in (-1, 1):
        xa = 0.5 + sx * lw / 2
        xb = xa + sx * 0.075
        bx(min(xa, xb), max(xa, xb), YS + 0.09, YS + 0.17, ZF + 0.11, ZF + 0.145,
           'chrome' if kind == 'metaldoor' else 'handle', bevel=0.008, name='vknob')
    if kind == 'door':
        # 문짝 윗면 결 강조용 얇은 띠(밝은 마구리)
        bx(a0 + 0.02, a1 - 0.02, YS + 0.02, YN - 0.02, ztop - 0.01, ztop + 0.004, 'leaf_top', bevel=0.003,
           name='vtop')


def _extra_mats():
    MATS['curtain'] = m_flat('curtain', '#6f7a5c', 0.9, nz=0.12, f=30, off=20)
    MATS['curtain_tie'] = m_flat('curtain_tie', '#58624a', 0.9, off=21)
    MATS['sign_yellow'] = m_flat('sign_yellow', '#b39a3c', 0.6, off=22)
    MATS['sign_white'] = m_flat('sign_white', '#d9d6cb', 0.6, nz=0.05, off=25)
    MATS['glass_edge'] = m_flat('glass_edge', '#7fa79e', 0.12, nz=0.05, off=23)
    MATS['leaf_top'] = m_flat('leaf_top', '#a07a54', 0.5, nz=0.08, f=40, off=24)
    MATS['vshadow'] = m_vshadow


def m_vshadow():
    g = G('vshadow')
    a = g.mr(g.y, -0.35, 0.0, 0.0, 0.42, 'SMOOTHSTEP')
    return g.done('#0a0b0d', rough=1.0, alpha=a, spec=0.0)


_extra_mats()


# ---------------------------------------------------------------- 목록/렌더
SPRITES = [
    ('floor_corridor', 'floor', lambda: floor_plane('terrazzo')),
    ('floor_wood', 'floor', lambda: floor_plane('floor_wood')),
    ('floor_tile', 'floor', lambda: floor_plane('floor_tile')),
    ('floor_stone', 'floor', lambda: floor_plane('floor_stone')),
    ('floor_stairs', 'floor', build_floor_stairs),
    ('floor_metal', 'floor', lambda: floor_plane('floor_metal')),
    ('wall_corridor', 'wall', lambda: build_wall('corridor')),
    ('wall_wood', 'wall', lambda: build_wall('wood')),
    ('wall_tile', 'wall', lambda: build_wall('tile')),
    ('wall_vent', 'wall', build_wall_vent),
    ('wall_top', 'wall', build_wall_top),
    ('wall_window_corridor', 'wall', lambda: build_window('corridor')),
    ('wall_window_wood', 'wall', lambda: build_window('wood')),
    ('wall_window_tile', 'wall', lambda: build_window('tile')),
    ('wall_inner_window_corridor', 'wall', lambda: build_inner_window('corridor')),
    ('wall_inner_window_wood', 'wall', lambda: build_inner_window('wood')),
    ('door_closed', 'door', lambda: build_classroom_door(False)),
    ('door_open', 'door', lambda: build_classroom_door(True)),
    ('glassdoor', 'door', lambda: build_glassdoor(False)),
    ('glassdoor_open', 'door', lambda: build_glassdoor(True)),
    ('metaldoor', 'door', lambda: build_metaldoor(False)),
    ('metaldoor_open', 'door', lambda: build_metaldoor(True)),
    ('shutter', 'door', lambda: build_shutter(False)),
    ('shutter_open', 'door', lambda: build_shutter(True)),
    ('sealdoor', 'door', lambda: build_sealdoor(False)),
    ('sealdoor_open', 'door', lambda: build_sealdoor(True)),
    ('door_v', 'wall', lambda: build_door_v('door', False)),
    ('door_v_open', 'wall', lambda: build_door_v('door', True)),
    ('glassdoor_v', 'wall', lambda: build_door_v('glassdoor', False)),
    ('glassdoor_v_open', 'wall', lambda: build_door_v('glassdoor', True)),
    ('metaldoor_v', 'wall', lambda: build_door_v('metaldoor', False)),
    ('metaldoor_v_open', 'wall', lambda: build_door_v('metaldoor', True)),
]


def door_bounds():
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    pts = [C.project(p) for p in C._world_verts(objs)]
    y1 = max(p[1] for p in pts)
    return (0.0, -1.0, 1.0, max(0.75, math.ceil(y1 * C.PX - 1e-6) / C.PX))


def main():
    sel = C.only(None)
    sc = C.reset_scene(samples=SAMPLES)
    sc.cycles.use_denoising = False
    sc.cycles.max_bounces = 6
    # 상자 필터(1px): 픽셀 경계 밖 지오메트리가 번지지 않아 타일 이음매가 픽셀 단위로 깨끗하다
    sc.cycles.pixel_filter_type = 'BOX'
    sc.render.filter_size = 1.0
    meta_path = os.path.join(C.OUT, CAT + '.json')
    meta = {}
    if sel and os.path.exists(meta_path):
        meta = json.load(open(meta_path, encoding='utf-8'))
    for key, kind, fn in SPRITES:
        if sel and key not in sel:
            continue
        C.clear_meshes()
        fn()
        if kind == 'floor':
            b = (0.0, 0.0, 1.0, 0.75)
        elif kind == 'wall':
            b = (0.0, -1.0, 1.0, 0.75)
        else:
            b = door_bounds()
        m = C.render_sprite(f'{CAT}/{key}', anchor=(0, -1, 0), pad=0, bounds=b)
        m['file'] = f'{CAT}/{key}.png'
        meta[key] = m
        print('rendered', key, m)
    order = [k for k, _, _ in SPRITES]
    meta = {k: meta[k] for k in order if k in meta}
    C.write_meta(CAT, meta)


if __name__ == '__main__':
    main()
