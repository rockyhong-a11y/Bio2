"""props_room — 교실/로비/사무실 소품 스프라이트 (docs/asset-spec.md 의 props_room 표).

실행: <venv>/bin/python tools/blender/props_room.py            # 전부
      <venv>/bin/python tools/blender/props_room.py -- desk sofa  # 일부만 (기존 메타와 병합)

규약
- 바닥 소품 w×h 셀: x∈[0,w], y∈[-h,0], 앵커 (0,-h,0)
- 벽걸이 소품: 벽 셀 남쪽 면 바로 앞 y∈[-1.06,-1.0], x∈[0,w], 앵커 (0,-1,0)
- 높이 기준: WALL_H≈1.512 (책상 ~0.45, 교탁 ~0.5, 사물함 ~0.9, 자판기 ~1.37, 학생 1.25)
"""
import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

import common as C  # noqa: E402

CAT = 'props_room'
FONT_PATH = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
PI = math.pi

# ---------------------------------------------------------------------------
# 지오메트리 헬퍼 (common 을 수정하지 않고 여기서 확장)
# ---------------------------------------------------------------------------


def _finish(me, smooth, sharp_deg=40):
    for p in me.polygons:
        p.use_smooth = smooth
    if smooth:
        me.set_sharp_from_angle(angle=math.radians(sharp_deg))


def _obj(name, me, loc, rot, material, scale=(1, 1, 1)):
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.rotation_euler = rot
    o.scale = scale
    bpy.context.scene.collection.objects.link(o)
    if material is not None:
        if isinstance(material, (list, tuple)):
            for m in material:
                me.materials.append(m)
        else:
            me.materials.append(material)
    return o


def rbox(name, size, loc, material=None, bevel=0.0, segs=2, rot=(0, 0, 0), smooth=False):
    """둥근 모서리 박스. size=(sx,sy,sz), loc=중심."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    if bevel > 0:
        off = min(bevel, min(size) * 0.49)
        bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=off, segments=segs,
                        affect='EDGES', profile=0.5)
    bm.to_mesh(me)
    bm.free()
    _finish(me, smooth, 50)
    return _obj(name, me, loc, rot, material)


def bx(name, x0, x1, y0, y1, z0, z1, material=None, bevel=0.0, segs=2, smooth=False):
    """경계로 지정하는 박스."""
    return rbox(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2),
                material, bevel, segs, smooth=smooth)


def cyl(name, r, depth, loc, material=None, verts=24, rot=(0, 0, 0), r2=None, cap=True):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=verts, radius1=r,
                          radius2=r if r2 is None else r2, depth=depth)
    bm.to_mesh(me)
    bm.free()
    _finish(me, True, 45)
    return _obj(name, me, loc, rot, material)


def sph(name, r, loc, material=None, scale=(1, 1, 1), segs=20, rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=max(6, segs // 2), radius=r)
    bm.to_mesh(me)
    bm.free()
    _finish(me, True, 80)
    return _obj(name, me, loc, rot, material, scale)


def tube(name, p0, p1, r, material=None, verts=10):
    """p0→p1 원기둥."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_euler()
    return cyl(name, r, d.length, (p0 + p1) / 2, material, verts, rot)


def disc_y(name, r, y0, y1, x, z, material=None, verts=32, r2=None):
    """벽면(XZ 평면)에 붙는 원판: y0~y1 두께, 정면 -Y."""
    return cyl(name, r, abs(y1 - y0), (x, (y0 + y1) / 2, z), material, verts, (PI / 2, 0, 0), r2)


def poly_mesh(name, verts, faces, material=None, loc=(0, 0, 0), rot=(0, 0, 0), smooth=True, solid=0.0):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    _finish(me, smooth, 70)
    o = _obj(name, me, loc, rot, material)
    if solid:
        mod = o.modifiers.new('solid', 'SOLIDIFY')
        mod.thickness = solid
        mod.offset = 0
    return o


_font = None


def text(name, body, loc, size, material, extrude=0.003, rot=(PI / 2, 0, 0), align='CENTER', bold=0.0):
    """한글 텍스트를 메시로 변환해 배치 (기본: 정면 -Y 를 향해 세움)."""
    global _font
    if _font is None:
        _font = bpy.data.fonts.load(FONT_PATH)
    cu = bpy.data.curves.new(name + '_c', 'FONT')
    cu.body = body
    cu.font = _font
    cu.size = size
    cu.align_x = align
    cu.align_y = 'CENTER'
    cu.extrude = extrude
    cu.offset = bold
    tmp = bpy.data.objects.new(name + '_t', cu)
    bpy.context.scene.collection.objects.link(tmp)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg))
    bpy.data.objects.remove(tmp, do_unlink=True)
    me.materials.clear()
    return _obj(name, me, loc, rot, material)


def clear():
    sc = bpy.context.scene
    for o in list(sc.objects):
        if o.type in ('LIGHT', 'CAMERA'):
            continue
        bpy.data.objects.remove(o, do_unlink=True)


# ---------------------------------------------------------------------------
# 절차적 머티리얼
# ---------------------------------------------------------------------------
_M = {}


def lin(c):
    return C.hex_to_linear(c) if isinstance(c, str) else c


def _new(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    return m, nt.nodes, nt.links, nt.nodes['Principled BSDF']


def _coord(N, L, scale=(1, 1, 1), rot=(0, 0, 0), space='Object'):
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = scale
    mp.inputs['Rotation'].default_value = rot
    L.new(tc.outputs[space], mp.inputs['Vector'])
    return mp.outputs['Vector']


def _ramp(N, L, fac, stops):
    r = N.new('ShaderNodeValToRGB')
    els = r.color_ramp.elements
    stops = sorted(stops)
    els[0].position = stops[0][0]
    els[1].position = stops[-1][0]
    for p, _ in stops[1:-1]:
        els.new(p)
    for e, (_, c) in zip(sorted(els, key=lambda e: e.position), stops):
        e.color = (*lin(c), 1)
    L.new(fac, r.inputs['Fac'])
    return r.outputs['Color']


def _noise(N, L, vec, scale, detail=4.0, rough=0.55, distort=0.0):
    n = N.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = scale
    n.inputs['Detail'].default_value = detail
    n.inputs['Roughness'].default_value = rough
    n.inputs['Distortion'].default_value = distort
    L.new(vec, n.inputs['Vector'])
    return n.outputs['Fac']


def _math(N, L, op, a, b):
    m = N.new('ShaderNodeMath')
    m.operation = op
    for i, v in enumerate((a, b)):
        if isinstance(v, (int, float)):
            m.inputs[i].default_value = v
        else:
            L.new(v, m.inputs[i])
    return m.outputs[0]


def _bump(N, L, bsdf, height, strength, dist=0.02):
    if strength <= 0:
        return
    b = N.new('ShaderNodeBump')
    b.inputs['Strength'].default_value = strength
    b.inputs['Distance'].default_value = dist
    L.new(height, b.inputs['Height'])
    L.new(b.outputs['Normal'], bsdf.inputs['Normal'])


def _set(bsdf, rough=0.6, metal=0.0, emit=None, es=0.0, alpha=1.0, coat=0.0):
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if emit is not None:
        bsdf.inputs['Emission Color'].default_value = (*lin(emit), 1)
        bsdf.inputs['Emission Strength'].default_value = es
    if alpha < 1:
        bsdf.inputs['Alpha'].default_value = alpha
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.15


def wood(name, light, dark, grain='X', scale=9.0, rough=0.55, bump=0.12, coat=0.0, mid=None):
    """나무결: 결 방향으로 늘린 고운 노이즈(결) + 완만한 물결(wave) 무늬 + 판재별 색 변화."""
    k = ('wood', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    st = {'X': (0.06, 1.0, 1.0), 'Y': (1.0, 0.06, 1.0), 'Z': (1.0, 1.0, 0.06)}[grain]
    fine = _noise(N, L, _coord(N, L, tuple(s * scale * 2.6 for s in st)), 1.0, detail=6, rough=0.6, distort=0.8)
    broad = _noise(N, L, _coord(N, L, tuple(s * 2.2 if s < 1 else 2.2 for s in st)), 1.0, detail=3, rough=0.5)
    w = N.new('ShaderNodeTexWave')
    w.wave_type = 'BANDS'
    w.bands_direction = {'X': 'Y', 'Y': 'X', 'Z': 'X'}[grain]
    w.inputs['Scale'].default_value = 0.5
    w.inputs['Distortion'].default_value = 8.0
    w.inputs['Detail'].default_value = 2.0
    w.inputs['Detail Scale'].default_value = 1.2
    L.new(_coord(N, L, tuple(s * scale for s in st)), w.inputs['Vector'])
    fac = _math(N, L, 'ADD', _math(N, L, 'MULTIPLY', fine, 0.45), _math(N, L, 'MULTIPLY', broad, 0.4))
    fac = _math(N, L, 'ADD', fac, _math(N, L, 'MULTIPLY', w.outputs['Fac'], 0.15))
    stops = [(0.22, dark), (0.78, light)]
    if mid:
        stops.insert(1, (0.5, mid))
    L.new(_ramp(N, L, fac, stops), b.inputs['Base Color'])
    _bump(N, L, b, fine, bump)
    _set(b, rough, coat=coat)
    _M[k] = m
    return m


def painted(name, color, var=0.07, scale=14.0, rough=0.5, metal=0.0, bump=0.04, dirt=None, coat=0.0,
            emit=None, es=0.0, stretch=(1, 1, 1)):
    """도장면/플라스틱: 저주파 얼룩(+선택적 때) 노이즈로 미세 변화."""
    k = ('paint', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    vec = _coord(N, L, tuple(scale * s for s in stretch))
    f = _noise(N, L, vec, 1.0, detail=5, rough=0.6)
    c = lin(color)
    lo = tuple(x * (1 - var) for x in c)
    hi = tuple(min(1, x * (1 + var)) for x in c)
    stops = [(0.35, lo), (0.65, hi)]
    if dirt:
        stops = [(0.28, lin(dirt)), (0.42, lo), (0.7, hi)]
    L.new(_ramp(N, L, f, stops), b.inputs['Base Color'])
    fine = _noise(N, L, _coord(N, L, (scale * 6,) * 3), 1.0, detail=2)
    _bump(N, L, b, fine, bump, 0.01)
    _set(b, rough, metal, emit, es, coat=coat)
    _M[k] = m
    return m


def metal(name, color, rough=0.35, metal_v=0.85, brushed='X', scale=6.0, var=0.12):
    """금속: 한 방향으로 늘린 노이즈(헤어라인)."""
    st = {'X': (0.08, 1, 1), 'Y': (1, 0.08, 1), 'Z': (1, 1, 0.08), None: (1, 1, 1)}[brushed]
    return painted(name, color, var=var, scale=scale * 8, rough=rough, metal=metal_v, bump=0.02, stretch=st)


def cork(name='cork'):
    k = ('cork', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    vec = _coord(N, L, (1, 1, 1))
    v = N.new('ShaderNodeTexVoronoi')
    v.inputs['Scale'].default_value = 90
    L.new(vec, v.inputs['Vector'])
    n = _noise(N, L, vec, 40, detail=6)
    fac = _math(N, L, 'ADD', _math(N, L, 'MULTIPLY', v.outputs['Distance'], 0.6), _math(N, L, 'MULTIPLY', n, 0.5))
    L.new(_ramp(N, L, fac, [(0.25, '#6e4f2f'), (0.5, '#a07b4f'), (0.8, '#c29d6a')]), b.inputs['Base Color'])
    _bump(N, L, b, fac, 0.5, 0.01)
    _set(b, 0.9)
    _M[k] = m
    return m


def leather(name, color, worn):
    k = ('leather', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    vec = _coord(N, L, (1, 1, 1))
    wear = _noise(N, L, vec, 4.5, detail=6, rough=0.65)
    v = N.new('ShaderNodeTexVoronoi')
    v.feature = 'DISTANCE_TO_EDGE'
    v.inputs['Scale'].default_value = 28
    L.new(vec, v.inputs['Vector'])
    crack = _math(N, L, 'LESS_THAN', v.outputs['Distance'], 0.035)
    base = _ramp(N, L, wear, [(0.45, color), (0.72, worn)])
    mix = N.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MIX'
    L.new(_math(N, L, 'MULTIPLY', crack, 0.55), mix.inputs['Factor'])
    L.new(base, mix.inputs[6])
    mix.inputs[7].default_value = (*lin(worn), 1)
    L.new(mix.outputs[2], b.inputs['Base Color'])
    fine = _noise(N, L, _coord(N, L, (1, 1, 1)), 60, detail=3)
    h = _math(N, L, 'SUBTRACT', fine, _math(N, L, 'MULTIPLY', crack, 0.6))
    _bump(N, L, b, h, 0.35, 0.01)
    _set(b, 0.42, coat=0.25)
    _M[k] = m
    return m


def chalkboard(name='board'):
    k = ('board', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    vec = _coord(N, L, (1.0, 1.0, 2.2))
    smear = _noise(N, L, vec, 2.2, detail=7, rough=0.62, distort=0.4)
    L.new(_ramp(N, L, smear, [(0.38, '#26402f'), (0.58, '#2f4c3a'), (0.78, '#4c6a58')]), b.inputs['Base Color'])
    _set(b, 0.92)
    _M[k] = m
    return m


def glass(name='glass', tint='#cfe3e6', alpha=0.16):
    k = ('glass', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    b.inputs['Base Color'].default_value = (*lin(tint), 1)
    _set(b, 0.04, alpha=alpha)
    b.inputs['Specular IOR Level'].default_value = 0.6
    _M[k] = m
    return m


def checker(name, c1, c2, scale):
    """체크 무늬(서류·출석부 표지 등 격자)."""
    k = ('checker', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    ch = N.new('ShaderNodeTexChecker')
    ch.inputs['Scale'].default_value = scale
    ch.inputs['Color1'].default_value = (*lin(c1), 1)
    ch.inputs['Color2'].default_value = (*lin(c2), 1)
    L.new(_coord(N, L, (1, 1, 1)), ch.inputs['Vector'])
    L.new(ch.outputs['Color'], b.inputs['Base Color'])
    _set(b, 0.75)
    _M[k] = m
    return m


def lines_paper(name, paper='#e9e5d8', ink='#8a9098', rows=9.0, vertical=True):
    """글줄이 인쇄된 종이: brick 노드(벽돌=단어, 줄눈=여백)로 표현. vertical=False 는 바닥에 놓인 종이."""
    k = ('paper', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    br = N.new('ShaderNodeTexBrick')
    br.inputs['Scale'].default_value = rows
    br.inputs['Mortar Size'].default_value = 0.2
    br.inputs['Brick Width'].default_value = 1.1
    br.inputs['Row Height'].default_value = 0.5
    br.offset = 0.4
    br.inputs['Color1'].default_value = (*lin(ink), 1)
    br.inputs['Color2'].default_value = tuple(min(1, x * 1.25) for x in lin(ink)) + (1,)
    br.inputs['Mortar'].default_value = (*lin(paper), 1)
    vec = _coord(N, L, (1, 1, 1), rot=(PI / 2, 0, 0) if vertical else (0, 0, 0))
    L.new(vec, br.inputs['Vector'])
    L.new(br.outputs['Color'], b.inputs['Base Color'])
    _set(b, 0.85)
    _M[k] = m
    return m


def flat(name, color, rough=0.6, metal_v=0.0, emit=None, es=0.0, alpha=1.0):
    k = ('flat', name)
    if k in _M:
        return _M[k]
    m, N, L, b = _new(name)
    b.inputs['Base Color'].default_value = (*lin(color), 1)
    _set(b, rough, metal_v, emit, es, alpha)
    _M[k] = m
    return m


def glow(name, color, es=2.0):
    return flat(name, color, 0.4, emit=color, es=es)


# ---------------------------------------------------------------------------
# 자주 쓰는 머티리얼
# ---------------------------------------------------------------------------

def M_desk_top():
    return wood('desk_top', '#c9a978', '#9b774b', grain='X', scale=8, coat=0.15)


def M_desk_wood_y():
    return wood('desk_top_y', '#c4a272', '#94704a', grain='Y', scale=8, coat=0.1)


def M_steel_green():
    return painted('steel_green', '#5f7268', var=0.1, rough=0.45, metal=0.35, dirt='#46524b')


def M_dark_wood():
    return wood('dark_wood', '#7a5434', '#4c2f1d', grain='X', scale=7, coat=0.2)


def M_dark_wood_z():
    return wood('dark_wood_z', '#7a5434', '#4c2f1d', grain='Z', scale=7, coat=0.2)


def M_mid_wood():
    return wood('mid_wood', '#a37a4c', '#6e4c2c', grain='X', scale=8, coat=0.1)


def M_mid_wood_z():
    return wood('mid_wood_z', '#a37a4c', '#6e4c2c', grain='Z', scale=8, coat=0.1)


def M_rubber():
    return flat('rubber', '#1f1f21', 0.8)


def M_chrome():
    return metal('chrome', '#c9ccce', rough=0.22, metal_v=1.0)


def M_alu():
    return metal('alu', '#a9adb0', rough=0.35, metal_v=0.9)


# ---------------------------------------------------------------------------
# 소품
# ---------------------------------------------------------------------------

def _desk_base():
    top = M_desk_top()
    steel = M_steel_green()
    # 상판 (높이 0.45)
    bx('top', 0.17, 0.83, -0.53, -0.08, 0.418, 0.45, top, bevel=0.008)
    bx('top_edge', 0.17, 0.83, -0.535, -0.525, 0.415, 0.447, painted('edge', '#7b6a55', rough=0.5), bevel=0.003)
    # 서랍칸(책 넣는 칸): 남쪽(의자 쪽)으로 열림
    bx('shelf_b', 0.21, 0.79, -0.49, -0.11, 0.322, 0.334, steel)
    bx('shelf_n', 0.21, 0.79, -0.12, -0.105, 0.322, 0.418, steel)
    for i, x in enumerate((0.205, 0.785)):
        bx(f'shelf_s{i}', x, x + 0.012, -0.49, -0.11, 0.322, 0.418, steel)
    bx('book_in', 0.28, 0.5, -0.44, -0.13, 0.334, 0.36, painted('book_in', '#4b5f7c'))
    # 다리 + 발걸이
    for i, (x, y) in enumerate(((0.2, -0.1), (0.8, -0.1), (0.2, -0.5), (0.8, -0.5))):
        tube(f'leg{i}', (x, y, 0.0), (x, y, 0.418), 0.016, steel)
        cyl(f'foot{i}', 0.019, 0.012, (x, y, 0.006), M_rubber())
    for i, x in enumerate((0.2, 0.8)):
        tube(f'rail{i}', (x, -0.1, 0.07), (x, -0.5, 0.07), 0.011, steel)
    tube('rail_n', (0.2, -0.1, 0.07), (0.8, -0.1, 0.07), 0.011, steel)
    # 의자 (남쪽, 북쪽을 향함)
    seat = M_desk_wood_y()
    bx('seat', 0.31, 0.69, -0.92, -0.58, 0.262, 0.284, seat, bevel=0.008)
    for i, (x, y) in enumerate(((0.33, -0.6), (0.67, -0.6))):
        tube(f'cleg{i}', (x, y, 0), (x, y, 0.262), 0.013, steel)
        cyl(f'cfoot{i}', 0.016, 0.01, (x, y, 0.005), M_rubber())
    for i, x in enumerate((0.33, 0.67)):
        tube(f'cpost{i}', (x, -0.9, 0), (x, -0.915, 0.56), 0.013, steel)
        cyl(f'cfootb{i}', 0.016, 0.01, (x, -0.9, 0.005), M_rubber())
        tube(f'crail{i}', (x, -0.6, 0.12), (x, -0.9, 0.12), 0.009, steel)
    back = rbox('cback', (0.4, 0.022, 0.13), (0.5, -0.918, 0.485), M_desk_wood_y(), bevel=0.008)
    back.rotation_euler = (math.radians(-6), 0, 0)


def build_desk():
    _desk_base()


def build_desk_candy():
    _desk_base()
    # 분홍 표지 일기장
    pink = painted('diary_pink', '#d98fa6', var=0.06, rough=0.55, coat=0.2)
    d = rbox('diary', (0.17, 0.22, 0.03), (0.34, -0.28, 0.465), pink, bevel=0.006)
    d.rotation_euler = (0, 0, math.radians(14))
    pg = rbox('diary_pages', (0.16, 0.205, 0.022), (0.343, -0.283, 0.465), flat('pages', '#efe9dc', 0.8), bevel=0.002)
    pg.rotation_euler = (0, 0, math.radians(14))
    s = rbox('diary_strap', (0.03, 0.225, 0.034), (0.405, -0.28, 0.465), painted('strap', '#a4566e'), bevel=0.004)
    s.rotation_euler = (0, 0, math.radians(14))
    # 리본 묶은 사탕 상자 (하늘색 상자 + 빨간 리본)
    boxm = painted('candy_box', '#9cc6d8', var=0.05, rough=0.45, coat=0.3)
    rib = painted('ribbon', '#c4313b', var=0.05, rough=0.35, coat=0.3)
    cx, cy, z0 = 0.63, -0.3, 0.45
    rbox('cbox', (0.19, 0.14, 0.075), (cx, cy, z0 + 0.0375), boxm, bevel=0.008)
    rbox('clid', (0.2, 0.15, 0.022), (cx, cy, z0 + 0.075), boxm, bevel=0.006)
    bx('rib_x', cx - 0.102, cx + 0.102, cy - 0.016, cy + 0.016, z0 - 0.0, z0 + 0.088, rib)
    bx('rib_y', cx - 0.016, cx + 0.016, cy - 0.077, cy + 0.077, z0 - 0.0, z0 + 0.088, rib)
    for i, ang in enumerate((-35, 35)):
        lp = sph(f'bow{i}', 0.035, (cx + (0.03 if i else -0.03), cy, z0 + 0.1), rib, scale=(1.2, 0.55, 0.7))
        lp.rotation_euler = (0, math.radians(ang), 0)
    sph('knot', 0.018, (cx, cy, z0 + 0.098), rib)
    for i, a in enumerate((-1, 1)):
        t = rbox(f'tail{i}', (0.018, 0.06, 0.006), (cx + 0.022 * a, cy - 0.06, z0 + 0.09), rib)
        t.rotation_euler = (math.radians(-25), 0, math.radians(20 * a))


def build_teacher_desk():
    w = M_dark_wood()
    wz = M_dark_wood_z()
    panel = wood('desk_panel', '#8a6340', '#5a3a23', grain='Z', scale=7, coat=0.15)
    # 상판
    bx('top', 0.12, 1.88, -0.8, -0.16, 0.465, 0.505, M_mid_wood(), bevel=0.012)
    # 몸통: 정면(남쪽) 앞판 + 양 옆판 + 걸레받이
    bx('front', 0.17, 1.83, -0.76, -0.73, 0.04, 0.465, wz, bevel=0.006)
    bx('side_l', 0.15, 0.19, -0.78, -0.2, 0.0, 0.465, w, bevel=0.006)
    bx('side_r', 1.81, 1.85, -0.78, -0.2, 0.0, 0.465, w, bevel=0.006)
    bx('plinth', 0.17, 1.83, -0.75, -0.25, 0.0, 0.05, flat('plinth', '#2e2620', 0.7))
    # 앞판 패널 장식(액자형 몰딩 2개) + 가운데 띠
    for i, (x0, x1) in enumerate(((0.26, 0.96), (1.04, 1.74))):
        bx(f'pf{i}', x0, x1, -0.772, -0.758, 0.1, 0.41, w, bevel=0.005)
        bx(f'pi{i}', x0 + 0.04, x1 - 0.04, -0.776, -0.765, 0.135, 0.375, panel, bevel=0.006)
    bx('trim', 0.17, 1.83, -0.775, -0.755, 0.43, 0.455, w, bevel=0.004)
    # 소품: 출석부, 분필통, 종이 묶음, 펜꽂이
    att = rbox('attend', (0.24, 0.31, 0.025), (0.62, -0.47, 0.518), painted('attend', '#2d4057', coat=0.2), bevel=0.005)
    att.rotation_euler = (0, 0, math.radians(-8))
    lab = rbox('attend_lab', (0.1, 0.06, 0.004), (0.62, -0.5, 0.532), flat('label', '#e9e3d2'))
    lab.rotation_euler = (0, 0, math.radians(-8))
    rbox('chalkbox', (0.14, 0.09, 0.06), (1.05, -0.42, 0.535), painted('chalkbox', '#dcd6c6'), bevel=0.006)
    for i, col in enumerate(('#f2f0e8', '#f2f0e8', '#e8d36a', '#e39aa0', '#f2f0e8')):
        cyl(f'chalk{i}', 0.009, 0.08, (1.0 + i * 0.024, -0.42, 0.568), flat(f'chalk_{col}', col, 0.9), 8, (PI / 2, 0, 0))
    papers = lines_paper('papers_flat', rows=14, vertical=False)
    for i in range(4):
        p = rbox(f'paper{i}', (0.2, 0.28, 0.004), (1.4 + i * 0.006, -0.47 - i * 0.004, 0.507 + i * 0.005), papers)
        p.rotation_euler = (0, 0, math.radians(6 - i * 5))
    cyl('pencup', 0.04, 0.11, (1.72, -0.3, 0.56), painted('pencup', '#5a6a79', coat=0.2), 16)
    for i, (dx, dy, col) in enumerate(((-0.012, 0.0, '#2b4f8a'), (0.012, 0.01, '#9a2a2a'), (0.0, -0.014, '#222222'))):
        tube(f'pen{i}', (1.72 + dx, -0.3 + dy, 0.56), (1.72 + dx * 3, -0.3 + dy * 3, 0.66), 0.006, flat(f'pen{col}', col, 0.4))


def build_blackboard():
    alu = M_alu()
    board = chalkboard()
    x0, x1, z0, z1 = 0.08, 2.92, 0.5, 1.32
    bx('board', x0, x1, -1.02, -1.0, z0, z1, board)
    f = 0.035
    bx('fr_t', x0 - f, x1 + f, -1.035, -1.0, z1, z1 + f, alu, bevel=0.005)
    bx('fr_b', x0 - f, x1 + f, -1.035, -1.0, z0 - f, z0, alu, bevel=0.005)
    bx('fr_l', x0 - f, x0, -1.035, -1.0, z0, z1, alu, bevel=0.005)
    bx('fr_r', x1, x1 + f, -1.035, -1.0, z0, z1, alu, bevel=0.005)
    # 분필 받침
    bx('tray', x0, x1, -1.06, -1.0, z0 - f - 0.012, z0 - f, alu, bevel=0.003)
    bx('tray_lip', x0, x1, -1.06, -1.052, z0 - f - 0.012, z0 - f + 0.016, alu, bevel=0.002)
    chalk_cols = ('#f2f0e8', '#f2f0e8', '#e8d36a', '#e39aa0', '#9cc0e0')
    for i, (x, col) in enumerate(((0.55, 0), (0.62, 1), (1.7, 2), (2.25, 3), (2.31, 4))):
        cyl(f'chalk{i}', 0.008, 0.07, (x, -1.03, z0 - f + 0.008), flat(f'chalk_{chalk_cols[col]}', chalk_cols[col], 0.9), 8, (0, PI / 2, 0))
    # 칠판지우개 2개
    for i, x in enumerate((1.0, 2.6)):
        bx(f'eraser{i}', x, x + 0.13, -1.05, -1.01, z0 - f, z0 - f + 0.03, painted('eraser_felt', '#3b4152'))
        bx(f'eraser_t{i}', x + 0.005, x + 0.125, -1.047, -1.013, z0 - f + 0.03, z0 - f + 0.042, M_mid_wood())
    # 분필 글씨 (날짜·주번) — 오른쪽 위
    chalk = flat('chalkwrite', '#d9dfd6', 0.95, alpha=0.82)
    text('date', '3월 13일 (화)', (2.48, -1.021, 1.21), 0.1, chalk, extrude=0.0006)
    text('duty', '주번', (2.62, -1.021, 1.06), 0.085, chalk, extrude=0.0006)
    text('duty2', '이희민', (2.62, -1.021, 0.95), 0.075, chalk, extrude=0.0006)
    # 지우다 만 흔적 몇 줄
    for i, (x, z, ww) in enumerate(((0.45, 1.1, 0.5), (0.5, 0.98, 0.65), (0.42, 0.86, 0.38))):
        bx(f'scribble{i}', x, x + ww, -1.0205, -1.02, z, z + 0.018, flat('chalkfaint', '#8fa597', 0.95, alpha=0.5))


def build_lockers():
    body = painted('locker_body', '#c8c1aa', var=0.06, rough=0.5, metal=0.2, dirt='#a59e88')
    doorm = [painted(f'locker_door{i}', c, var=0.07, rough=0.42, metal=0.25, dirt='#7d8a80')
             for i, c in enumerate(('#97a89c', '#8fa196', '#9aab9f'))]
    slot = flat('slot', '#2a2c2c', 0.8)
    x0, x1, y0, y1, H = 0.03, 0.97, -0.44, -0.03, 0.9
    bx('body', x0, x1, y0, y1, 0.05, H, body, bevel=0.01)
    bx('plinth', x0 + 0.02, x1 - 0.02, y0 + 0.02, y1, 0.0, 0.05, flat('plinth_dk', '#2b2a27', 0.7))
    bx('top', x0 - 0.01, x1 + 0.01, y0 - 0.01, y1, H - 0.015, H + 0.01, body, bevel=0.008)
    cols, rows = 3, 2
    gw = (x1 - x0 - 0.06) / cols
    gh = (H - 0.12) / rows
    rnd = random.Random(7)
    for r in range(rows):
        for c in range(cols):
            dx0 = x0 + 0.03 + c * gw + 0.008
            dx1 = dx0 + gw - 0.016
            dz0 = 0.08 + r * gh + 0.008
            dz1 = dz0 + gh - 0.016
            dm = doorm[(r * 3 + c * 2) % 3]
            bx(f'door{r}{c}', dx0, dx1, y0 - 0.014, y0 + 0.004, dz0, dz1, dm, bevel=0.006)
            # 통풍 슬릿 3줄
            for k in range(3):
                zz = dz1 - 0.05 - k * 0.028
                bx(f'vent{r}{c}{k}', dx0 + 0.06, dx1 - 0.06, y0 - 0.017, y0 - 0.012, zz, zz + 0.012, slot)
            # 손잡이 + 열쇠구멍
            bx(f'hdl{r}{c}', dx1 - 0.07, dx1 - 0.025, y0 - 0.03, y0 - 0.014, dz0 + 0.16, dz0 + 0.2, M_chrome(), bevel=0.004)
            cyl(f'key{r}{c}', 0.009, 0.006, (dx1 - 0.0475, y0 - 0.016, dz0 + 0.13), M_chrome(), 10, (PI / 2, 0, 0))
            # 이름표
            lab = '#e6e1d2' if rnd.random() < 0.8 else '#e8d68a'
            bx(f'lab{r}{c}', dx0 + 0.04, dx0 + 0.15, y0 - 0.017, y0 - 0.013, dz0 + 0.04, dz0 + 0.08, flat(f'lab_{lab}', lab, 0.8))
    # 위에 올려둔 물건: 책 더미, 체육복 가방, 농구공
    zt = H + 0.01
    for i, (col, th, dx, rot) in enumerate((('#3d4f6b', 0.035, 0.0, 4), ('#8a7a5a', 0.03, 0.01, -6), ('#6d3a33', 0.04, -0.005, 9))):
        o = rbox(f'tbook{i}', (0.2, 0.26, th), (0.2 + dx, -0.26, zt + th / 2), painted('book' + col, col, var=0.08, rough=0.6), bevel=0.005)
        o.rotation_euler = (0, 0, math.radians(rot))
        zt += th
    bag = rbox('bag', (0.3, 0.2, 0.13), (0.55, -0.22, H + 0.075), painted('gymbag', '#2f3d5c', var=0.12, rough=0.85), bevel=0.05, segs=3, smooth=True)
    bag.rotation_euler = (0, 0, math.radians(-8))
    tube('bag_strap', (0.43, -0.3, H + 0.14), (0.67, -0.16, H + 0.14), 0.012, painted('gymbag_strap', '#1f2533', rough=0.8))
    sph('ball', 0.1, (0.84, -0.24, H + 0.11), painted('ball', '#b0603a', var=0.1, rough=0.7))
    for i, rot in enumerate(((0, 0, 0), (PI / 2, 0, 0), (0, PI / 2, 0))):
        t = cyl(f'ball_l{i}', 0.1005, 0.006, (0.84, -0.24, H + 0.11), flat('ball_line', '#2a2220', 0.7), 24, rot, cap=False)


def build_shoe_cabinet():
    w = M_mid_wood()
    wz = M_mid_wood_z()
    inner = wood('cubby_in', '#5e4630', '#3e2c1d', grain='X', scale=8)
    x0, x1, y0, y1, H = 0.06, 1.94, -0.5, -0.04, 1.02
    cols, rows = 6, 4
    bx('back', x0, x1, y1 - 0.02, y1, 0.06, H, inner)
    bx('base', x0, x1, y0, y1, 0.0, 0.07, flat('plinth_dk', '#2b2a27', 0.7), bevel=0.004)
    bx('topb', x0 - 0.01, x1 + 0.01, y0 - 0.012, y1, H - 0.03, H, w, bevel=0.008)
    cw = (x1 - x0) / cols
    sh = (H - 0.1) / rows
    for r in range(rows + 1):
        z = 0.07 + r * sh
        bx(f'shelf{r}', x0, x1, y0, y1, z - 0.012, z + 0.012, w, bevel=0.004)
    for c in range(cols + 1):
        x = x0 + c * cw
        bx(f'div{c}', x - 0.013, x + 0.013, y0, y1, 0.06, H - 0.02, wz, bevel=0.004)
    # 칸 번호표
    for r in range(rows):
        for c in range(cols):
            z = 0.07 + r * sh
            bx(f'tag{r}{c}', x0 + c * cw + 0.11, x0 + c * cw + 0.2, y0 - 0.006, y0, z - 0.008, z + 0.01, flat('tag', '#e3dccb', 0.8))
    # 실내화(흰색, 발등 띠) / 운동화 — 뒤꿈치가 앞(남쪽)을 향하게 넣음
    rnd = random.Random(3)
    white = painted('shoe_white', '#e2ded4', var=0.07, rough=0.7, dirt='#bdb6a6')
    sole = flat('shoe_sole', '#8f8a80', 0.8)
    bands = [painted('band_b', '#46648f'), painted('band_r', '#9a4444'), painted('band_g', '#4f7a5c')]
    sneak = [painted('sneak_n', '#2f3a52', var=0.08, rough=0.7), painted('sneak_g', '#5c5f63', var=0.08, rough=0.7)]
    for r in range(rows):
        for c in range(cols):
            if rnd.random() < 0.3:
                continue
            z = 0.07 + r * sh + 0.012
            cx = x0 + c * cw + cw / 2 + rnd.uniform(-0.015, 0.015)
            kind = rnd.random()
            up = white if kind < 0.75 else sneak[rnd.randrange(2)]
            band = bands[rnd.randrange(3)]
            yb = y0 + 0.05 + rnd.uniform(0, 0.04)
            for s_ in (-1, 1):
                sx = cx + s_ * 0.05
                bx(f'sole{r}{c}{s_}', sx - 0.043, sx + 0.043, yb, yb + 0.28, z, z + 0.016, sole if up is white else white, bevel=0.01)
                rbox(f'shoe{r}{c}{s_}', (0.08, 0.27, 0.05), (sx, yb + 0.14, z + 0.035), up, bevel=0.022, segs=3, smooth=True)
                if up is white:
                    bx(f'band{r}{c}{s_}', sx - 0.041, sx + 0.041, yb + 0.12, yb + 0.17, z + 0.03, z + 0.064, band, bevel=0.008)


def build_clock():
    frame = wood('clock_frame', '#6b4a30', '#3e2819', grain='Z', scale=10, coat=0.4)
    face = flat('clock_face', '#ebe5d3', 0.5)
    ink = flat('clock_ink', '#1f1d1b', 0.5)
    cx, cz, R = 0.5, 1.02, 0.3
    disc_y('ring', R, -1.0, -1.05, cx, cz, frame, 48)
    disc_y('face', R - 0.04, -1.03, -1.052, cx, cz, face, 48)
    for i in range(60):
        a = i / 60 * 2 * PI
        big = i % 5 == 0
        L = 0.05 if big else 0.018
        r0 = R - 0.055 - L / 2
        o = rbox(f'tick{i}', (0.016 if big else 0.006, 0.004, L), (cx + math.sin(a) * r0, -1.054, cz + math.cos(a) * r0), ink)
        o.rotation_euler = (0, a, 0)
    # 바늘: 9시 41분에서 멈춘 시계 (data/chapter1.js 로비 시계 대사와 일치)
    for nm, ang, ln, wd, yy in (('hour', (9 + 41 / 60) / 12 * 2 * PI, 0.13, 0.022, -1.0555),
                                 ('min', 41 / 60 * 2 * PI, 0.2, 0.014, -1.057)):
        o = rbox(nm, (wd, 0.003, ln), (cx + math.sin(ang) * ln / 2.4, yy, cz + math.cos(ang) * ln / 2.4), ink)
        o.rotation_euler = (0, ang, 0)
    sec = 7 / 60 * 2 * PI  # 멈춘 초침(7초) — 시·분침과 겹치지 않는 오른쪽 위
    o = rbox('sec', (0.005, 0.002, 0.22), (cx + math.sin(sec) * 0.08, -1.0585, cz + math.cos(sec) * 0.08), flat('sec_red', '#a12b2b', 0.4))
    o.rotation_euler = (0, sec, 0)
    disc_y('cap', 0.017, -1.05, -1.06, cx, cz, M_chrome(), 16)
    # 유리 반사(살짝)


def build_bulletin():
    w = M_mid_wood()
    wz = M_mid_wood_z()
    x0, x1, z0, z1 = 0.12, 1.88, 0.56, 1.24
    f = 0.04
    bx('cork', x0, x1, -1.02, -1.0, z0, z1, cork())
    bx('fr_t', x0 - f, x1 + f, -1.04, -1.0, z1, z1 + f, w, bevel=0.006)
    bx('fr_b', x0 - f, x1 + f, -1.04, -1.0, z0 - f, z0, w, bevel=0.006)
    bx('fr_l', x0 - f, x0, -1.04, -1.0, z0, z1, wz, bevel=0.006)
    bx('fr_r', x1, x1 + f, -1.04, -1.0, z0, z1, wz, bevel=0.006)
    # 종이: (x중심, z중심, 폭, 높이, 기울기°, 재질)
    papers = [
        (0.36, 0.98, 0.3, 0.4, -3, lines_paper('notice_w')),
        (0.72, 1.04, 0.28, 0.3, 4, lines_paper('notice_y', '#e6d9a6', '#9a8f72', 10)),
        (0.7, 0.72, 0.24, 0.22, -6, lines_paper('notice_b', '#c4d6e0', '#7a8896', 12)),
        (1.12, 0.92, 0.36, 0.5, 1, None),  # 포스터
        (1.52, 1.06, 0.26, 0.24, -4, lines_paper('notice_w')),
        (1.6, 0.76, 0.3, 0.26, 5, lines_paper('notice_p', '#e6cccc', '#8f7676', 10)),
        (0.33, 0.68, 0.2, 0.16, 8, flat('memo', '#efe8c0', 0.8)),
    ]
    pins = [flat('pin_r', '#b03030', 0.3), flat('pin_b', '#2f58a0', 0.3), flat('pin_y', '#d8b030', 0.3), flat('pin_g', '#3a8a4a', 0.3)]
    rnd = random.Random(11)
    for i, (cx, cz, pw, ph, tilt, m) in enumerate(papers):
        y = -1.022 - i * 0.0015
        if m is None:
            # 포스터: 짙은 색 상단 + 글줄 + 원형 그림
            o = rbox(f'p{i}', (pw, 0.002, ph), (cx, y, cz), flat('poster_bg', '#ddd6c4', 0.8))
            o.rotation_euler = (0, math.radians(tilt), 0)
            o = rbox(f'p{i}h', (pw - 0.04, 0.002, 0.1), (cx, y - 0.002, cz + ph / 2 - 0.08), flat('poster_head', '#7a3a3a', 0.7))
            o.rotation_euler = (0, math.radians(tilt), 0)
            disc_y(f'p{i}c', 0.08, y - 0.002, y - 0.004, cx, cz - 0.02, flat('poster_circle', '#4f6e8a', 0.7), 24)
            o = rbox(f'p{i}l', (pw - 0.08, 0.002, 0.06), (cx, y - 0.002, cz - ph / 2 + 0.07), lines_paper('poster_lines', '#ddd6c4', '#6a665c', 24))
            o.rotation_euler = (0, math.radians(tilt), 0)
        else:
            o = rbox(f'p{i}', (pw, 0.002, ph), (cx, y, cz), m)
            o.rotation_euler = (0, math.radians(tilt), 0)
        a = math.radians(tilt)
        px = cx + math.sin(a) * (ph / 2 - 0.03)
        pz = cz + math.cos(a) * (ph / 2 - 0.03)
        sph(f'pin{i}', 0.014, (px, -1.034, pz), pins[rnd.randrange(4)], segs=10)


def build_extinguisher():
    red = painted('ext_red', '#b0312a', var=0.06, rough=0.3, coat=0.5)
    blk = flat('ext_black', '#1d1d1f', 0.5)
    cx, cy = 0.5, -0.17
    # 받침대
    bx('stand', cx - 0.12, cx + 0.12, cy - 0.1, cy + 0.1, 0.0, 0.03, painted('stand', '#8a2a24', rough=0.45), bevel=0.008)
    bx('stand_back', cx - 0.12, cx + 0.12, cy + 0.07, cy + 0.1, 0.03, 0.2, painted('stand', '#8a2a24', rough=0.45), bevel=0.006)
    cyl('body', 0.078, 0.31, (cx, cy, 0.03 + 0.155), red, 24)
    sph('dome', 0.078, (cx, cy, 0.34), red, scale=(1, 1, 0.45))
    # 라벨
    lab = cyl('label', 0.0795, 0.12, (cx, cy, 0.18), flat('ext_label', '#e8e2d0', 0.6), 24, cap=False)
    lab.rotation_euler = (0, 0, 0)
    bx('label_txt', cx - 0.04, cx + 0.04, cy - 0.081, cy - 0.078, 0.2, 0.22, flat('ext_txt', '#a12b2b', 0.6))
    bx('label_txt2', cx - 0.05, cx + 0.05, cy - 0.081, cy - 0.078, 0.15, 0.162, flat('ext_txt2', '#333333', 0.6))
    # 헤드: 밸브, 레버, 게이지
    cyl('neck', 0.028, 0.04, (cx, cy, 0.385), M_chrome(), 16)
    bx('valve', cx - 0.035, cx + 0.035, cy - 0.025, cy + 0.025, 0.4, 0.44, blk, bevel=0.006)
    lv = rbox('lever', (0.12, 0.024, 0.012), (cx + 0.035, cy, 0.46), M_chrome(), bevel=0.004)
    lv.rotation_euler = (0, math.radians(-12), 0)
    rbox('handle', (0.11, 0.024, 0.01), (cx + 0.03, cy, 0.425), M_chrome(), bevel=0.003)
    disc_y('gauge', 0.022, cy - 0.025, cy - 0.04, cx - 0.01, 0.43, flat('gauge', '#efece2', 0.4), 16)
    disc_y('gauge_g', 0.006, cy - 0.04, cy - 0.043, cx - 0.004, 0.432, flat('gauge_g', '#3c8a3c', 0.4), 8)
    # 호스: 헤드 옆에서 몸통을 따라 내려옴
    pts = [(cx - 0.035, cy - 0.01, 0.42), (cx - 0.075, cy - 0.04, 0.4), (cx - 0.095, cy - 0.06, 0.32), (cx - 0.095, cy - 0.065, 0.2), (cx - 0.085, cy - 0.07, 0.12)]
    for i in range(len(pts) - 1):
        tube(f'hose{i}', pts[i], pts[i + 1], 0.012, blk, 8)
    cyl('nozzle', 0.016, 0.05, (cx - 0.085, cy - 0.07, 0.1), blk, 10)


def build_trophy_case():
    """유리 진열장: 아래 나무 수납장 + 위 유리 상자(앞·옆·윗면 유리) — 위에서도 트로피가 보이게."""
    w = M_dark_wood()
    wz = M_dark_wood_z()
    felt = painted('felt', '#7a3438', var=0.12, rough=0.95)
    gl = glass('case_glass', '#e2eef0', 0.05)
    gold = painted('gold_t', '#d9b25a', var=0.08, rough=0.3, metal=0.55, coat=0.5)
    silver = painted('silver_t', '#c9ccd0', var=0.06, rough=0.3, metal=0.5, coat=0.5)
    marble = painted('trophy_base', '#3d4a42', var=0.15, rough=0.35, coat=0.4)
    ch = M_chrome()
    x0, x1, y0, y1 = 0.08, 1.92, -0.44, -0.05
    zc, H = 0.4, 1.08
    # 아래 수납장
    bx('base', x0, x1, y0, y1, 0.04, zc, w, bevel=0.01)
    bx('plinth', x0 + 0.02, x1 - 0.02, y0 + 0.02, y1, 0.0, 0.045, flat('plinth_dk', '#2b2a27', 0.7))
    for i, (a, b) in enumerate(((x0 + 0.04, 0.99), (1.01, x1 - 0.04))):
        bx(f'ldoor{i}', a, b, y0 - 0.012, y0, 0.07, zc - 0.03, wz, bevel=0.006)
        bx(f'ldoor_p{i}', a + 0.05, b - 0.05, y0 - 0.016, y0 - 0.011, 0.11, zc - 0.07, wood('door_inlay', '#8b6440', '#5c3c24', 'Z', 7), bevel=0.004)
        hx = b - 0.06 if i == 0 else a + 0.06
        cyl(f'knob{i}', 0.013, 0.02, (hx, y0 - 0.02, zc - 0.13), gold, 12, (PI / 2, 0, 0))
    bx('ledge', x0 - 0.01, x1 + 0.01, y0 - 0.015, y1, zc - 0.01, zc + 0.02, w, bevel=0.006)
    # 위 진열부: 펠트 뒤판·바닥, 뒤쪽 단(계단식 받침)
    bx('back', x0 + 0.01, x1 - 0.01, y1 - 0.02, y1, zc + 0.02, H, felt)
    bx('floor_in', x0 + 0.01, x1 - 0.01, y0, y1 - 0.02, zc + 0.02, zc + 0.03, felt)
    bx('riser', x0 + 0.03, x1 - 0.03, -0.25, y1 - 0.02, zc + 0.03, zc + 0.2, felt, bevel=0.01)
    # 프레임: 네 모서리 기둥 + 윗테
    for i, (xx, yy) in enumerate(((x0, y0), (x1, y0), (x0, y1), (x1, y1))):
        bx(f'post{i}', xx - 0.012, xx + 0.012, yy - 0.012, yy + 0.012, zc + 0.02, H + 0.02, ch)
    for i, yy in enumerate((y0, y1)):
        bx(f'topbar{i}', x0 - 0.012, x1 + 0.012, yy - 0.012, yy + 0.012, H, H + 0.025, ch)
    for i, xx in enumerate((x0, 1.0, x1)):
        bx(f'topbar_s{i}', xx - 0.012, xx + 0.012, y0, y1, H, H + 0.025, ch)
    bx('mullion', 0.99, 1.01, y0 - 0.012, y0 + 0.004, zc + 0.02, H, ch)
    # 트로피
    def cup(n, cx, cy, z, s, m):
        bx(f'{n}b', cx - 0.06 * s, cx + 0.06 * s, cy - 0.05 * s, cy + 0.05 * s, z, z + 0.07 * s, marble, bevel=0.005)
        cyl(f'{n}s', 0.014 * s, 0.1 * s, (cx, cy, z + 0.12 * s), m, 12)
        cyl(f'{n}c', 0.03 * s, 0.11 * s, (cx, cy, z + 0.225 * s), m, 20, r2=0.068 * s)
        for side in (-1, 1):
            tube(f'{n}h{side}', (cx + side * 0.05 * s, cy, z + 0.26 * s), (cx + side * 0.09 * s, cy, z + 0.2 * s), 0.01 * s, m, 8)
        cyl(f'{n}lid', 0.07 * s, 0.014 * s, (cx, cy, z + 0.287 * s), m, 20)
        sph(f'{n}k', 0.02 * s, (cx, cy, z + 0.305 * s), m, segs=10)

    def column(n, cx, cy, z, s, m):
        bx(f'{n}b', cx - 0.055 * s, cx + 0.055 * s, cy - 0.045 * s, cy + 0.045 * s, z, z + 0.06 * s, marble, bevel=0.005)
        bx(f'{n}c', cx - 0.028 * s, cx + 0.028 * s, cy - 0.028 * s, cy + 0.028 * s, z + 0.06 * s, z + 0.24 * s, m, bevel=0.004)
        sph(f'{n}f', 0.034 * s, (cx, cy, z + 0.29 * s), m, scale=(0.8, 0.6, 1.3), segs=12)
        sph(f'{n}fh', 0.02 * s, (cx, cy, z + 0.35 * s), m, segs=10)

    def plaque(n, cx, z, s):
        p = rbox(f'{n}', (0.2 * s, 0.025, 0.25 * s), (cx, y1 - 0.06, z + 0.125 * s), w, bevel=0.006)
        p.rotation_euler = (math.radians(-14), 0, 0)
        g = rbox(f'{n}g', (0.15 * s, 0.006, 0.18 * s), (cx, y1 - 0.075, z + 0.13 * s), gold)
        g.rotation_euler = (math.radians(-14), 0, 0)

    zf, zr = zc + 0.03, zc + 0.2
    # 앞줄 (바닥)
    cup('t1', 0.3, -0.34, zf, 1.1, gold)
    column('t2', 0.6, -0.34, zf, 0.95, silver)
    cup('t3', 1.0, -0.34, zf, 1.35, gold)
    column('t4', 1.38, -0.34, zf, 1.0, gold)
    cup('t5', 1.7, -0.34, zf, 1.0, silver)
    # 뒷줄 (단 위)
    plaque('pl1', 0.45, zr, 1.0)
    cup('t6', 0.8, -0.16, zr, 1.15, silver)
    column('t7', 1.2, -0.16, zr, 1.1, gold)
    plaque('pl2', 1.55, zr, 0.95)
    # 페넌트(삼각기) — 뒤판 위쪽
    pv = [(0, 0, 0), (0, 0, -0.12), (0.34, 0, -0.06)]
    poly_mesh('pennant', pv, [(0, 1, 2)], flat('pennant', '#2f4f7f', 0.7), loc=(0.16, y1 - 0.025, H - 0.05), solid=0.004)
    pv2 = [(0, 0, 0), (0, 0, -0.1), (-0.28, 0, -0.05)]
    poly_mesh('pennant2', pv2, [(0, 1, 2)], flat('pennant2', '#8a3030', 0.7), loc=(1.84, y1 - 0.025, H - 0.06), solid=0.004)
    # 유리: 앞, 옆, 윗면
    bx('glass_f', x0, x1, y0 - 0.004, y0 + 0.004, zc + 0.02, H, gl)
    bx('glass_t', x0, x1, y0, y1, H + 0.004, H + 0.012, gl)
    for i, xx in enumerate((x0, x1)):
        bx(f'glass_s{i}', xx - 0.004, xx + 0.004, y0, y1, zc + 0.02, H, gl)
    # 유리 반사 하이라이트 사선
    for i, (x, zz) in enumerate(((0.32, 0.78), (1.32, 0.74))):
        o = rbox(f'refl{i}', (0.035, 0.001, 0.42), (x, y0 - 0.006, zz), flat('refl', '#ffffff', 0.1, alpha=0.14))
        o.rotation_euler = (0, math.radians(35), 0)


def build_copier():
    body = painted('copier_body', '#c9c5b8', var=0.05, rough=0.45, dirt='#aaa597')
    dark = painted('copier_dark', '#55585b', var=0.06, rough=0.5)
    cover = painted('copier_cover', '#8e8f8b', var=0.05, rough=0.45)
    x0, x1, y0, y1 = 0.12, 0.88, -0.66, -0.06
    # 받침 캐비닛 + 바퀴
    bx('cab', x0 + 0.02, x1 - 0.02, y0 + 0.02, y1 - 0.02, 0.04, 0.3, body, bevel=0.01)
    for i, (x, y) in enumerate(((x0 + 0.06, y0 + 0.06), (x1 - 0.06, y0 + 0.06), (x0 + 0.06, y1 - 0.06), (x1 - 0.06, y1 - 0.06))):
        cyl(f'caster{i}', 0.025, 0.02, (x, y, 0.025), M_rubber(), 12, (0, PI / 2, 0))
    # 용지함 2단
    for i, z in enumerate((0.06, 0.18)):
        bx(f'tray{i}', x0 + 0.04, x1 - 0.04, y0 + 0.004, y0 + 0.022, z, z + 0.1, body, bevel=0.006)
        bx(f'tray_h{i}', 0.42, 0.58, y0 - 0.004, y0 + 0.006, z + 0.065, z + 0.085, dark, bevel=0.004)
        bx(f'tray_g{i}', 0.6, 0.66, y0 - 0.001, y0 + 0.006, z + 0.02, z + 0.05, glow('tray_led', '#79b878', 0.8))
    # 본체
    bx('main', x0, x1, y0, y1, 0.3, 0.6, body, bevel=0.015)
    bx('seam', x0 - 0.002, x1 + 0.002, y0 - 0.002, y1 + 0.002, 0.43, 0.44, dark)
    # 원고 덮개
    bx('cover', x0 + 0.01, x1 - 0.12, y0 + 0.1, y1 - 0.01, 0.6, 0.64, cover, bevel=0.012)
    bx('hinge', x0 + 0.1, x1 - 0.2, y1 - 0.03, y1 - 0.005, 0.6, 0.65, dark)
    # 조작 패널 (앞쪽 위, 기울어짐)
    p = rbox('panel', (0.36, 0.13, 0.03), (x1 - 0.19, y0 + 0.07, 0.615), dark, bevel=0.006)
    p.rotation_euler = (math.radians(14), 0, 0)
    lcd = rbox('lcd', (0.12, 0.06, 0.006), (x1 - 0.27, y0 + 0.07, 0.634), glow('lcd', '#9fd08a', 1.2))
    lcd.rotation_euler = (math.radians(14), 0, 0)
    for i in range(3):
        for j in range(3):
            b = rbox(f'key{i}{j}', (0.022, 0.018, 0.008), (x1 - 0.17 + i * 0.03, y0 + 0.045 + j * 0.026, 0.629 + j * 0.006), flat('key', '#d8d6cf', 0.5))
            b.rotation_euler = (math.radians(14), 0, 0)
    gb = rbox('start', (0.03, 0.03, 0.01), (x1 - 0.06, y0 + 0.06, 0.632), glow('start', '#4fae54', 1.0))
    gb.rotation_euler = (math.radians(14), 0, 0)
    # 배출 트레이 (왼쪽 옆)
    t = rbox('outtray', (0.12, 0.38, 0.012), (x0 - 0.04, -0.36, 0.48), dark, bevel=0.004)
    t.rotation_euler = (0, math.radians(-14), 0)
    s = rbox('outpaper', (0.1, 0.3, 0.012), (x0 - 0.04, -0.36, 0.495), flat('paper_white', '#efede6', 0.8))
    s.rotation_euler = (0, math.radians(-14), 0)
    # 앞판 로고 띠
    bx('logo', x0 + 0.05, x0 + 0.2, y0 - 0.002, y0 + 0.004, 0.53, 0.55, flat('logo', '#3a5f94', 0.5))


def build_file_cabinet():
    steel = painted('file_steel', '#8c9196', var=0.08, rough=0.42, metal=0.45, dirt='#6c7075')
    dk = flat('slot', '#2a2c2c', 0.8)
    x0, x1, y0, y1, H = 0.2, 0.8, -0.6, -0.04, 0.96
    bx('body', x0, x1, y0, y1, 0.03, H, steel, bevel=0.008)
    bx('base', x0 + 0.02, x1 - 0.02, y0 + 0.02, y1 - 0.02, 0.0, 0.03, M_rubber())
    n = 4
    dh = (H - 0.06) / n
    for i in range(n):
        z0 = 0.05 + i * dh
        bx(f'drawer{i}', x0 + 0.02, x1 - 0.02, y0 - 0.012, y0 + 0.002, z0 + 0.006, z0 + dh - 0.006, steel, bevel=0.007)
        # 손잡이 (가로 바) + 명함꽂이
        bx(f'hdl{i}', 0.42, 0.58, y0 - 0.032, y0 - 0.012, z0 + dh * 0.5 - 0.035, z0 + dh * 0.5 - 0.018, M_chrome(), bevel=0.005)
        bx(f'hdl_s{i}', 0.415, 0.585, y0 - 0.018, y0 - 0.011, z0 + dh * 0.5 - 0.04, z0 + dh * 0.5 - 0.012, dk)
        bx(f'card{i}', 0.45, 0.55, y0 - 0.016, y0 - 0.012, z0 + dh * 0.5 + 0.02, z0 + dh * 0.5 + 0.06, M_chrome(), bevel=0.003)
        bx(f'cardp{i}', 0.458, 0.542, y0 - 0.018, y0 - 0.016, z0 + dh * 0.5 + 0.026, z0 + dh * 0.5 + 0.054, flat('card_paper', '#e9e3cf', 0.8))
    # 상단 잠금 장치
    cyl('lock', 0.015, 0.012, (x1 - 0.06, y0 - 0.006, H - 0.04), M_chrome(), 12, (PI / 2, 0, 0))
    # 위에 서류 상자
    rbox('docbox', (0.36, 0.26, 0.12), (0.47, -0.3, H + 0.06), painted('docbox', '#b29a72', var=0.08, rough=0.8), bevel=0.006)
    rbox('docbox_lab', (0.12, 0.002, 0.05), (0.47, -0.431, H + 0.06), flat('label', '#e9e3d2'))


def build_key_cabinet():
    steel = painted('keycab', '#a7a69c', var=0.06, rough=0.4, metal=0.35, dirt='#85847b')
    dk = painted('keypad', '#3c3f42', var=0.05, rough=0.45)
    x0, x1, z0, z1 = 0.28, 0.72, 0.66, 1.18
    # 앞면 최전방 y=-1.0585 (규약 y∈[-1.06,-1.0] 안쪽, 함 깊이 0.048)
    bx('box', x0, x1, -1.048, -1.0, z0, z1, steel, bevel=0.008)
    bx('door', x0 + 0.02, x1 - 0.02, -1.056, -1.046, z0 + 0.02, z1 - 0.02, steel, bevel=0.006)
    # 'KEY' 명판
    bx('plate', 0.36, 0.52, -1.058, -1.055, z1 - 0.1, z1 - 0.05, flat('plate', '#d9d3be', 0.5))
    text('plate_t', '열쇠', (0.44, -1.0572, z1 - 0.075), 0.042, flat('ink', '#262422', 0.6), extrude=0.0004, bold=0.002)
    # 숫자 키패드 (3×4)
    bx('pad', 0.5, 0.67, -1.058, -1.055, z0 + 0.12, z0 + 0.36, dk, bevel=0.004)
    for r in range(4):
        for c in range(3):
            bx(f'k{r}{c}', 0.515 + c * 0.052, 0.555 + c * 0.052, -1.0585, -1.0565, z0 + 0.14 + r * 0.054, z0 + 0.177 + r * 0.054,
               flat('kbtn', '#cfcdc5', 0.45), bevel=0.003)
    bx('lcd', 0.515, 0.655, -1.0585, -1.0565, z0 + 0.375, z0 + 0.405, glow('keylcd', '#8ec486', 0.9))
    sph('led', 0.016, (0.37, -1.0555, z0 + 0.38), glow('led_red', '#d0302a', 2.5), scale=(1, 0.25, 1), segs=12)  # 문 앞면에 붙은 납작한 LED
    # 손잡이
    bx('hdl', 0.33, 0.36, -1.058, -1.055, z0 + 0.14, z0 + 0.26, M_chrome(), bevel=0.004)


def build_shelf():
    w = M_mid_wood()
    wz = M_mid_wood_z()
    back = wood('shelf_back', '#8e6b45', '#6a4b2e', grain='Z', scale=6)
    x0, x1, y0, y1, H = 0.08, 1.92, -0.42, -0.04, 1.16
    bx('back', x0, x1, y1 - 0.015, y1, 0.0, H, back)
    bx('side_l', x0, x0 + 0.035, y0, y1, 0.0, H, wz, bevel=0.005)
    bx('side_r', x1 - 0.035, x1, y0, y1, 0.0, H, wz, bevel=0.005)
    bx('mid', 0.985, 1.015, y0, y1, 0.0, H, wz, bevel=0.005)
    bx('top', x0 - 0.01, x1 + 0.01, y0 - 0.012, y1, H - 0.03, H, w, bevel=0.008)
    bx('kick', x0, x1, y0, y0 + 0.02, 0.0, 0.06, w)
    shelves = [0.06, 0.34, 0.62, 0.9]
    for i, z in enumerate(shelves):
        bx(f'sh{i}', x0, x1, y0, y1, z - 0.02, z, w, bevel=0.004)
    rnd = random.Random(5)
    book_cols = ['#6d3a33', '#3d4f6b', '#5a6b49', '#8a7a5a', '#2f3640', '#7c5a3c', '#a08c6a', '#4a3d55', '#8f4a3c', '#c7bea8']
    binder_cols = ['#2c4a74', '#222428', '#6b7076', '#3d5f4a', '#7a2e2e']
    bm = {c: painted('book' + c, c, var=0.08, rough=0.6) for c in book_cols}
    bnm = {c: painted('binder' + c, c, var=0.05, rough=0.4, coat=0.2) for c in binder_cols}
    lab = flat('spine_lab', '#e7e2d3', 0.7)
    n = 0
    for si, z in enumerate(shelves):
        for (sx0, sx1) in ((x0 + 0.04, 0.98), (1.02, x1 - 0.04)):
            x = sx0 + rnd.uniform(0.0, 0.03)
            kind = rnd.random()
            limit = sx1 - (rnd.uniform(0.05, 0.2) if rnd.random() < 0.6 else 0.0)
            binders = kind < 0.4 and si > 0
            while x < limit:
                n += 1
                if binders:
                    bw, bh, bd = rnd.uniform(0.055, 0.075), 0.25, 0.3
                    if x + bw > limit:
                        break
                    col = rnd.choice(binder_cols)
                    bx(f'bd{n}', x, x + bw, y0 + 0.02, y0 + 0.02 + bd, z, z + bh, bnm[col], bevel=0.006)
                    bx(f'bdl{n}', x + 0.012, x + bw - 0.012, y0 + 0.016, y0 + 0.02, z + 0.12, z + 0.2, lab)
                    cyl(f'bdr{n}', 0.009, 0.004, ((x * 2 + bw) / 2, y0 + 0.017, z + 0.06), flat('ring', '#1a1a1a', 0.6), 10, (PI / 2, 0, 0))
                    x += bw + 0.004
                else:
                    bw = rnd.uniform(0.028, 0.055)
                    bh = rnd.uniform(0.17, 0.25)
                    bd = rnd.uniform(0.22, 0.3)
                    if x + bw > limit:
                        break
                    col = rnd.choice(book_cols)
                    o = bx(f'bk{n}', x, x + bw, y0 + 0.025, y0 + 0.025 + bd, z, z + bh, bm[col], bevel=0.004)
                    if rnd.random() < 0.3:
                        bx(f'bkb{n}', x - 0.0005, x + bw + 0.0005, y0 + 0.022, y0 + 0.026, z + bh * 0.75, z + bh * 0.8, flat('gold_band', '#b89a52', 0.4))
                    x += bw + rnd.uniform(0.0, 0.006)
            # 남은 공간에 눕힌 책 더미 (가끔)
            if limit < sx1 - 0.1 and rnd.random() < 0.6:
                hz = z
                for k in range(rnd.randint(1, 3)):
                    col = rnd.choice(book_cols)
                    th = rnd.uniform(0.025, 0.04)
                    bx(f'fl{n}{k}', limit + 0.01, sx1 - 0.01, y0 + 0.04, y0 + 0.28, hz, hz + th, bm[col], bevel=0.004)
                    hz += th


def build_vending():
    """2001년식 캔 음료 자판기(약 1.8 m). 높이 1.37타일 — 학생(1.25)보다 머리 하나 크고 WALL_H(1.512)보다 낮음."""
    red = painted('vend_red', '#a8302b', var=0.06, rough=0.32, metal=0.2, coat=0.5, dirt='#7e2420')
    dk = painted('vend_dark', '#2e3033', var=0.05, rough=0.45)
    gry = painted('vend_grey', '#8d9093', var=0.05, rough=0.4, metal=0.5)
    x0, x1, y0, y1, H = 0.08, 0.92, -0.56, -0.04, 1.37
    wx0, wx1, wz0, wz1 = x0 + 0.05, 0.64, 0.6, H - 0.19   # 진열창 (z 0.6~1.18)
    D = 0.13  # 진열창 깊이
    # 몸통: 뒤 블록 + 진열창 둘레 앞 껍데기 (가운데가 파인 형태)
    bx('body', x0, x1, y0 + D - 0.01, y1, 0.04, H, red, bevel=0.015)
    bx('shell_l', x0, wx0, y0, y0 + D, 0.04, H, red, bevel=0.012)
    bx('shell_r', wx1, x1, y0, y0 + D, 0.04, H, red, bevel=0.012)
    bx('shell_b', wx0 - 0.01, wx1 + 0.01, y0, y0 + D, 0.04, wz0, red, bevel=0.012)
    bx('shell_t', wx0 - 0.01, wx1 + 0.01, y0, y0 + D, wz1, H, red, bevel=0.012)
    bx('feet', x0 + 0.03, x1 - 0.03, y0 + 0.03, y1 - 0.03, 0.0, 0.04, flat('plinth_dk', '#2b2a27', 0.7))
    # 상단 조명 간판
    bx('sign', x0 + 0.03, x1 - 0.03, y0 - 0.012, y0 + 0.01, H - 0.15, H - 0.03, glow('vend_sign', '#f2e9d6', 1.2), bevel=0.006)
    text('sign_t', '음료', (0.5, y0 - 0.014, H - 0.09), 0.095, flat('sign_ink', '#a8302b', 0.4), extrude=0.0008, bold=0.004)
    # 진열창 (왼쪽 2/3): 뒤판 발광 + 캔 4단 × 5열, 단마다 가격표 띠
    for i, (a, b, c, d) in enumerate(((wx0 - 0.02, wx1 + 0.02, wz1, wz1 + 0.02), (wx0 - 0.02, wx1 + 0.02, wz0 - 0.02, wz0),
                                      (wx0 - 0.02, wx0, wz0, wz1), (wx1, wx1 + 0.02, wz0, wz1))):
        bx(f'win_frame{i}', a, b, y0 - 0.01, y0 + 0.004, c, d, dk, bevel=0.004)
    bx('win_back', wx0, wx1, y0 + 0.12, y0 + 0.13, wz0, wz1, glow('vend_backlight', '#e8eef0', 0.9))
    can_cols = ['#c23a2e', '#2f5aa8', '#e0c040', '#3a8a4a', '#e6e2d6', '#d47a2a', '#6a3a8a', '#b0b4b8']
    tag = flat('vend_tag', '#e9e4d2', 0.6)
    rnd = random.Random(2)
    rows = 4
    rh = (wz1 - wz0) / rows
    for r in range(rows):
        zs = wz0 + r * rh
        bx(f'rack{r}', wx0, wx1, y0 + 0.01, y0 + 0.12, zs, zs + 0.012, gry)
        bx(f'ptag{r}', wx0 + 0.005, wx1 - 0.005, y0 + 0.006, y0 + 0.012, zs, zs + 0.022, tag)
        for c in range(5):
            cx = wx0 + 0.04 + c * (wx1 - wx0 - 0.08) / 4
            col = rnd.choice(can_cols)
            cyl(f'can{r}{c}', 0.024, 0.1, (cx, y0 + 0.06, zs + 0.062), painted('can' + col, col, var=0.05, rough=0.3, metal=0.4, coat=0.5), 14)
            cyl(f'cantop{r}{c}', 0.021, 0.006, (cx, y0 + 0.06, zs + 0.115), M_alu(), 12)
    bx('win_glass', wx0, wx1, y0 - 0.004, y0 + 0.004, wz0, wz1, glass('vend_glass', '#dde8ea', 0.12))
    # 선택 버튼 줄 (진열창 바로 아래)
    bz0, bz1 = wz0 - 0.09, wz0 - 0.03
    bx('btn_strip', wx0 - 0.02, wx1 + 0.02, y0 - 0.01, y0 + 0.004, bz0, bz1, dk, bevel=0.004)
    for c in range(5):
        cx = wx0 + 0.04 + c * (wx1 - wx0 - 0.08) / 4
        bx(f'btn{c}', cx - 0.02, cx + 0.02, y0 - 0.016, y0 - 0.008, bz0 + 0.015, bz1 - 0.015, glow('vend_btn', '#f0e4b0', 1.6), bevel=0.003)
    # 오른쪽 조작부: 표시창, 동전 투입구, 지폐 투입구, 반환 레버
    px0, px1 = 0.68, x1 - 0.04
    bx('panel', px0, px1, y0 - 0.01, y0 + 0.004, bz0, wz1, dk, bevel=0.006)
    bx('disp', px0 + 0.03, px1 - 0.03, y0 - 0.014, y0 - 0.008, wz1 - 0.12, wz1 - 0.05, glow('vend_disp', '#e05030', 1.4))
    bx('coin', px0 + 0.08, px0 + 0.1, y0 - 0.016, y0 - 0.01, 0.86, 0.94, gry, bevel=0.003)
    bx('bill', px0 + 0.03, px1 - 0.03, y0 - 0.016, y0 - 0.01, 0.72, 0.77, gry, bevel=0.004)
    bx('bill_slot', px0 + 0.05, px1 - 0.05, y0 - 0.018, y0 - 0.015, 0.74, 0.75, flat('slot', '#2a2c2c', 0.8))
    cyl('ret', 0.02, 0.02, ((px0 + px1) / 2, y0 - 0.02, bz0 + 0.04), M_chrome(), 12, (PI / 2, 0, 0))
    # 배출구
    bx('out_frame', x0 + 0.08, x1 - 0.08, y0 - 0.012, y0 + 0.004, 0.1, 0.33, dk, bevel=0.008)
    bx('out_flap', x0 + 0.11, x1 - 0.11, y0 - 0.02, y0 - 0.008, 0.13, 0.30, painted('vend_flap', '#1e2023', rough=0.3, coat=0.4), bevel=0.006)
    # 홍보 띠
    bx('stripe', x0 + 0.02, x1 - 0.02, y0 - 0.004, y0 + 0.004, 0.38, 0.41, flat('vend_stripe', '#e8dcc4', 0.5))


def build_sign_quiet():
    plate = painted('sign_plate', '#ece9e0', var=0.04, rough=0.4, coat=0.3)
    ink = flat('sign_ink_bk', '#1c1b1a', 0.5)
    x0, x1, z0, z1 = 0.16, 0.84, 1.0, 1.28
    bx('plate', x0, x1, -1.03, -1.0, z0, z1, plate, bevel=0.008)
    bx('border_t', x0 + 0.02, x1 - 0.02, -1.032, -1.03, z1 - 0.03, z1 - 0.02, ink)
    bx('border_b', x0 + 0.02, x1 - 0.02, -1.032, -1.03, z0 + 0.02, z0 + 0.03, ink)
    bx('border_l', x0 + 0.02, x0 + 0.03, -1.032, -1.03, z0 + 0.02, z1 - 0.02, ink)
    bx('border_r', x1 - 0.03, x1 - 0.02, -1.032, -1.03, z0 + 0.02, z1 - 0.02, ink)
    text('t', '정숙', (0.5, -1.033, (z0 + z1) / 2 - 0.004), 0.205, ink, extrude=0.002, bold=0.008)
    for i, x in enumerate((x0 + 0.045, x1 - 0.045)):
        disc_y(f'screw{i}', 0.008, -1.03, -1.035, x, (z0 + z1) / 2, M_chrome(), 10)


def build_console():
    top = painted('console_top', '#7c7a72', var=0.06, rough=0.5)
    body = wood('console_body', '#7d6a55', '#5a4a3a', grain='X', scale=8)
    bodyz = wood('console_body_z', '#7d6a55', '#5a4a3a', grain='Z', scale=8)
    blk = painted('equip_black', '#26282b', var=0.05, rough=0.4, metal=0.3)
    silver = painted('equip_silver', '#a8aaad', var=0.04, rough=0.35, metal=0.6)
    x0, x1, y0, y1 = 0.06, 1.94, -0.84, -0.12
    Z = 0.42
    bx('top', x0, x1, y0, y1, Z - 0.03, Z, top, bevel=0.008)
    bx('leg_l', x0 + 0.02, x0 + 0.06, y0 + 0.03, y1 - 0.02, 0.0, Z - 0.03, bodyz, bevel=0.005)
    bx('modesty', x0 + 0.06, 1.3, y1 - 0.06, y1 - 0.03, 0.08, Z - 0.03, body)
    # 오른쪽 아래 랙 (앞면이 보임): 앰프, 카세트데크, CD
    rx0, rx1 = 1.32, x1 - 0.02
    bx('rack', rx0, rx1, y0 + 0.03, y1 - 0.02, 0.0, Z - 0.03, bodyz, bevel=0.006)
    units = [(0.03, 0.13, silver, 'amp'), (0.14, 0.24, blk, 'tape'), (0.25, 0.35, blk, 'cd')]
    for i, (za, zb, m, kind) in enumerate(units):
        bx(f'u{i}', rx0 + 0.03, rx1 - 0.03, y0 + 0.02, y0 + 0.05, za, zb, m, bevel=0.005)
        if kind == 'amp':
            for k in range(4):
                cyl(f'amp_k{k}', 0.018, 0.02, (rx0 + 0.1 + k * 0.1, y0 + 0.012, (za + zb) / 2), blk, 14, (PI / 2, 0, 0))
            bx('amp_led', rx1 - 0.1, rx1 - 0.06, y0 + 0.016, y0 + 0.02, (za + zb) / 2 - 0.01, (za + zb) / 2 + 0.01, glow('led_green', '#5ad05a', 2.0))
        elif kind == 'tape':
            for k in range(2):
                bx(f'tape_w{k}', rx0 + 0.07 + k * 0.2, rx0 + 0.24 + k * 0.2, y0 + 0.016, y0 + 0.02, za + 0.02, zb - 0.02, flat('tape_win', '#4a4f55', 0.15, 0.3))
            bx('tape_vu', rx1 - 0.09, rx1 - 0.05, y0 + 0.016, y0 + 0.02, za + 0.03, zb - 0.03, glow('vu_amber', '#e0a040', 1.5))
        else:
            bx('cd_tray', rx0 + 0.06, rx0 + 0.36, y0 + 0.016, y0 + 0.02, za + 0.04, za + 0.06, silver)
            bx('cd_disp', rx1 - 0.15, rx1 - 0.05, y0 + 0.016, y0 + 0.02, za + 0.035, za + 0.07, glow('cd_disp', '#58c0d8', 1.4))
    # 믹서 (기울어진 판)
    mx0, mx1, my0, my1 = 0.42, 1.26, -0.72, -0.24
    mix = rbox('mixer', (mx1 - mx0, my1 - my0, 0.06), ((mx0 + mx1) / 2, (my0 + my1) / 2, Z + 0.06), blk, bevel=0.01)
    mix.rotation_euler = (math.radians(10), 0, 0)
    bx('mixer_front', mx0, mx1, my0 - 0.005, my0 + 0.03, Z, Z + 0.05, blk, bevel=0.006)
    tilt = math.radians(10)

    def on_mixer(nm, x, yy, size, m, h=0.01):
        # yy: 0(앞)~1(뒤) → 판 위 좌표
        ly = my0 + 0.03 + yy * (my1 - my0 - 0.06)
        lz = Z + 0.06 + 0.03 + (ly - (my0 + my1) / 2) * math.tan(tilt) + h / 2
        o = rbox(nm, (size[0], size[1], h), (x, ly, lz), m, bevel=min(size) * 0.25)
        o.rotation_euler = (tilt, 0, 0)
        return o
    strips = 8
    cap_cols = [flat('fader_w', '#dedcd4', 0.4), flat('fader_r', '#b03a32', 0.4), flat('fader_y', '#d0b040', 0.4)]
    for s in range(strips):
        x = mx0 + 0.07 + s * (mx1 - mx0 - 0.14) / (strips - 1)
        on_mixer(f'slot{s}', x, 0.2, (0.008, 0.16), flat('slot', '#2a2c2c', 0.8), 0.004)
        on_mixer(f'cap{s}', x, 0.12 + (s * 37 % 7) / 7 * 0.18, (0.03, 0.022), cap_cols[0 if s < 6 else (1 if s == 6 else 2)], 0.02)
        for k in range(3):
            on_mixer(f'knob{s}{k}', x, 0.55 + k * 0.14, (0.022, 0.022), flat('knob', '#c9c6bd', 0.4) if k else cap_cols[1], 0.018)
    # VU 미터 브리지
    bx('bridge', mx0 + 0.05, mx1 - 0.05, my1 - 0.06, my1 - 0.01, Z + 0.1, Z + 0.17, blk, bevel=0.006)
    for k in range(2):
        bx(f'vu{k}', mx0 + 0.2 + k * 0.28, mx0 + 0.38 + k * 0.28, my1 - 0.064, my1 - 0.06, Z + 0.112, Z + 0.158, glow('vu_amber', '#e0a040', 1.5))
    # 구즈넥 마이크
    mxp, myp = 0.22, -0.56
    cyl('mic_base', 0.07, 0.025, (mxp, myp, Z + 0.0125), blk, 20)
    pts = [(mxp, myp, Z + 0.02)]
    for i in range(1, 9):
        t = i / 8
        pts.append((mxp + 0.06 * t, myp - 0.1 * t, Z + 0.02 + 0.32 * math.sin(t * PI / 2)))
    for i in range(len(pts) - 1):
        tube(f'neck{i}', pts[i], pts[i + 1], 0.009, silver, 8)
    tube('mic_body', pts[-1], (pts[-1][0] + 0.02, pts[-1][1] - 0.07, pts[-1][2] - 0.02), 0.016, blk, 12)
    sph('mic_foam', 0.032, (pts[-1][0] + 0.025, pts[-1][1] - 0.09, pts[-1][2] - 0.025), painted('foam', '#2a2b2e', var=0.12, rough=0.95), scale=(1, 1.3, 1))
    sph('mic_led', 0.007, (mxp + 0.04, myp - 0.06, Z + 0.025), glow('led_red', '#d0302a', 2.5), segs=8)
    # 모니터 스피커 2대 (뒤쪽 모서리)
    for i, sx in enumerate((0.2, 1.75)):
        if i == 0:
            sy = -0.24
        else:
            sy = -0.3
        bx(f'spk{i}', sx - 0.1, sx + 0.1, sy - 0.12, sy + 0.1, Z, Z + 0.3, wood('spk_wood', '#3a3632', '#2a2725', 'Z', 9), bevel=0.01)
        disc_y(f'woof{i}', 0.065, sy - 0.12, sy - 0.135, sx, Z + 0.11, blk, 24)
        disc_y(f'woofc{i}', 0.025, sy - 0.135, sy - 0.145, sx, Z + 0.11, silver, 16)
        disc_y(f'tw{i}', 0.022, sy - 0.12, sy - 0.132, sx, Z + 0.24, silver, 16)
    # 헤드폰
    hp = cyl('hp_band', 0.075, 0.018, (1.4, -0.62, Z + 0.06), blk, 20, (PI / 2, 0, 0), cap=False)
    hp.modifiers.new('s', 'SOLIDIFY').thickness = 0.01
    for k in (-1, 1):
        cyl(f'hp_cup{k}', 0.04, 0.03, (1.4 + k * 0.075, -0.62, Z + 0.025), blk, 16, (0, PI / 2, 0))
    # 큐시트 종이
    p = rbox('cue', (0.18, 0.25, 0.003), (1.62, -0.66, Z + 0.002), lines_paper('papers_flat', rows=14, vertical=False))
    p.rotation_euler = (0, 0, math.radians(-10))


def _leaf_mesh(n, length, width, droop):
    verts, faces = [], []
    seg = 7
    for i in range(seg + 1):
        t = i / seg
        w = width * 0.5 * (math.sin(PI * min(1, t * 1.08)) ** 0.75)
        y = t * length
        z = -droop * length * t * t
        verts += [(-w, y, z - 0.25 * w), (0, y, z), (w, y, z - 0.25 * w)]
    for i in range(seg):
        a = 3 * i
        faces.append((a, a + 1, a + 4, a + 3))
        faces.append((a + 1, a + 2, a + 5, a + 4))
    return verts, faces


def build_plant():
    """관엽식물(고무나무류): 테라코타 화분 + 넓은 타원 잎."""
    pot = painted('pot', '#9c6a4e', var=0.08, rough=0.6, dirt='#7a5240')
    soil = painted('soil', '#3a2a1e', var=0.2, rough=0.95)
    leaves = [painted('leaf_dk', '#35552f', var=0.12, rough=0.5, coat=0.12), painted('leaf_lt', '#587d40', var=0.12, rough=0.5, coat=0.12),
              painted('leaf_md', '#46693a', var=0.12, rough=0.5, coat=0.12)]
    stem = painted('stem', '#5e5638', var=0.1, rough=0.7)
    cx, cy = 0.5, -0.42
    cyl('saucer', 0.15, 0.025, (cx, cy, 0.0125), painted('saucer', '#7e5844', rough=0.55), 28, r2=0.16)
    cyl('pot', 0.12, 0.24, (cx, cy, 0.025 + 0.12), pot, 28, r2=0.155)
    cyl('rim', 0.168, 0.05, (cx, cy, 0.265 + 0.025 - 0.02), pot, 28, r2=0.172)
    cyl('soil', 0.155, 0.01, (cx, cy, 0.285), soil, 28)
    rnd = random.Random(21)
    stems = [(cx - 0.05, cy + 0.03, 0.78), (cx + 0.06, cy - 0.02, 0.9), (cx + 0.01, cy + 0.06, 0.62)]
    for i, (sx, sy, top) in enumerate(stems):
        tube(f'stem{i}', (cx, cy, 0.28), (sx, sy, top), 0.016, stem, 8)
        nl = 7
        for k in range(nl):
            t = 0.3 + 0.7 * k / (nl - 1)
            px = cx + (sx - cx) * t
            py = cy + (sy - cy) * t
            pz = 0.28 + (top - 0.28) * t
            yaw = (k * 2.4 + i * 1.1) + rnd.uniform(-0.3, 0.3)
            top_leaf = k == nl - 1
            pitch = math.radians(rnd.uniform(5, 30) + (45 if top_leaf else 0))
            ln = rnd.uniform(0.2, 0.27) * (0.75 if top_leaf else 1.0)
            v, f = _leaf_mesh(k, ln, ln * 0.55, rnd.uniform(0.35, 0.7))
            poly_mesh(f'leaf{i}{k}', v, f, leaves[rnd.randrange(3)], loc=(px, py, pz), rot=(pitch, 0, yaw - PI / 2))


def build_mop():
    """청소도구: 물 양동이에 꽂힌 대걸레 + 벽에 기댄 빗자루."""
    blue = painted('bucket_blue', '#4c7390', var=0.08, rough=0.4, coat=0.2)
    handle = wood('mop_handle', '#b39a6e', '#8a7250', grain='Z', scale=10)
    strand = painted('mop_strand', '#c2bba9', var=0.15, rough=0.95, dirt='#8e8676')
    # 양동이
    bxp, byp = 0.6, -0.5
    me = bpy.data.meshes.new('bucket')
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=28, radius1=0.13, radius2=0.165, depth=0.28)
    top = max(bm.faces, key=lambda f: f.calc_center_median().z)
    bmesh.ops.delete(bm, geom=[top], context='FACES_ONLY')
    bm.to_mesh(me)
    bm.free()
    _finish(me, True, 45)
    b = _obj('bucket', me, (bxp, byp, 0.14), (0, 0, 0), blue)
    sm = b.modifiers.new('solid', 'SOLIDIFY')
    sm.thickness = 0.012
    cyl('bucket_rim', 0.172, 0.02, (bxp, byp, 0.28), blue, 28)
    cyl('water', 0.152, 0.004, (bxp, byp, 0.2), flat('water', '#5b5c4e', 0.15, alpha=0.9), 28)
    pts = []
    for i in range(9):
        a = PI * i / 8
        pts.append((bxp + math.cos(a) * 0.165, byp - math.sin(a) * 0.05, 0.28 + math.sin(a) * 0.1))
    for i in range(8):
        tube(f'bh{i}', pts[i], pts[i + 1], 0.006, M_alu(), 6)
    # 대걸레: 머리는 양동이 안, 자루는 북쪽 벽에 기댐
    base = Vector((bxp - 0.02, byp + 0.02, 0.22))
    top_pt = Vector((0.5, -0.03, 1.1))
    tube('handle', base, top_pt, 0.019, handle, 10)
    d = (top_pt - base).normalized()
    tube('cap', top_pt - d * 0.03, top_pt + d * 0.01, 0.022, flat('mop_cap', '#a63a32', 0.5), 10)
    rnd = random.Random(9)
    for i in range(34):
        a = rnd.uniform(0, 2 * PI)
        rr = rnd.uniform(0.04, 0.15)
        ex = bxp + math.cos(a) * rr
        ey = byp + math.sin(a) * rr * 0.85
        sz = 0.3 if rr > 0.12 else rnd.uniform(0.2, 0.27)
        mid = ((base.x + ex) / 2, (base.y + ey) / 2, 0.32)
        tube(f'st{i}a', (base.x, base.y, 0.27), mid, 0.016, strand, 6)
        tube(f'st{i}b', mid, (ex, ey, sz), 0.015, strand, 6)
        if rr > 0.13:  # 테두리 밖으로 늘어진 가닥
            tube(f'st{i}c', (ex, ey, sz), (bxp + math.cos(a) * 0.185, byp + math.sin(a) * 0.17, 0.2), 0.013, strand, 6)
    bx('clamp', base.x - 0.06, base.x + 0.06, base.y - 0.02, base.y + 0.02, 0.28, 0.33, M_alu(), bevel=0.008)
    # 빗자루 (왼쪽, 벽에 기댐)
    bhead = Vector((0.2, -0.24, 0.0))
    btop = Vector((0.13, -0.03, 1.05))
    tube('broom_h', bhead + Vector((0, 0, 0.17)), btop, 0.014, painted('broom_stick', '#6f8f6a', rough=0.45), 10)
    bristle = painted('bristle', '#b0503a', var=0.1, rough=0.8, stretch=(1, 1, 0.1))
    # 부채꼴 솔: 아래가 넓은 사다리꼴 판 (약간 기울어짐)
    v = [(-0.06, 0, 0.17), (0.06, 0, 0.17), (0.13, 0, 0.0), (-0.13, 0, 0.0)]
    vb = [(x, 0.035, z) for (x, _, z) in v]
    faces = [(0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    poly_mesh('broom_head', v + vb, faces, bristle, loc=(bhead.x, bhead.y - 0.02, 0.008), rot=(math.radians(-12), 0, 0), smooth=False)
    bx('broom_band', bhead.x - 0.065, bhead.x + 0.065, bhead.y - 0.03, bhead.y + 0.025, 0.15, 0.2, painted('broom_band', '#3c5a8a', rough=0.4), bevel=0.006)


def build_sofa():
    lea = leather('sofa_leather', '#55332a', '#7a5244')
    lea2 = leather('sofa_leather_dk', '#462a22', '#6a463a')
    x0, x1, y0, y1 = 0.08, 1.92, -0.74, -0.06
    # 다리
    for i, (x, y) in enumerate(((x0 + 0.06, y0 + 0.06), (x1 - 0.06, y0 + 0.06), (x0 + 0.06, y1 - 0.06), (x1 - 0.06, y1 - 0.06))):
        cyl(f'leg{i}', 0.022, 0.06, (x, y, 0.03), M_dark_wood(), 10, r2=0.016)
    # 베이스
    bx('base', x0, x1, y0, y1, 0.05, 0.2, lea2, bevel=0.03, segs=3, smooth=True)
    # 등받이
    bk = rbox('back', (x1 - x0 - 0.02, 0.18, 0.4), ((x0 + x1) / 2, y1 - 0.1, 0.38), lea2, bevel=0.06, segs=4, smooth=True)
    bk.rotation_euler = (math.radians(-6), 0, 0)
    for i, cx in enumerate((0.56, 1.0, 1.44)):
        pass
    # 등쿠션 2개
    for i, (a, b) in enumerate(((x0 + 0.17, 1.0), (1.0, x1 - 0.17))):
        c = rbox(f'bcush{i}', (b - a - 0.02, 0.14, 0.3), ((a + b) / 2, y1 - 0.22, 0.4), lea, bevel=0.06, segs=4, smooth=True)
        c.rotation_euler = (math.radians(-10), 0, 0)
    # 팔걸이
    for i, (a, b) in enumerate(((x0, x0 + 0.17), (x1 - 0.17, x1))):
        bx(f'arm{i}', a, b, y0, y1 - 0.02, 0.05, 0.42, lea2, bevel=0.07, segs=4, smooth=True)
    # 좌석 쿠션 2개 (하나는 눌려 꺼짐)
    for i, (a, b) in enumerate(((x0 + 0.17, 1.0), (1.0, x1 - 0.17))):
        hz = 0.12 if i == 0 else 0.135
        c = rbox(f'scush{i}', (b - a - 0.012, 0.5, hz), ((a + b) / 2, y0 + 0.27, 0.2 + hz / 2), lea, bevel=0.05, segs=4, smooth=True)
        if i == 0:
            c.rotation_euler = (math.radians(-2), math.radians(1.5), 0)
    # 해진 부분: 팔걸이 위 테이프 자국
    bx('tape', x1 - 0.14, x1 - 0.04, y0 + 0.18, y0 + 0.28, 0.418, 0.424, flat('tape', '#7d7766', 0.8))


BUILDERS = {
    'desk': (build_desk, 1, 1, False),
    'desk_candy': (build_desk_candy, 1, 1, False),
    'teacher_desk': (build_teacher_desk, 2, 1, False),
    'blackboard': (build_blackboard, 3, 1, True),
    'lockers': (build_lockers, 1, 1, False),
    'shoe_cabinet': (build_shoe_cabinet, 2, 1, False),
    'clock': (build_clock, 1, 1, True),
    'bulletin': (build_bulletin, 2, 1, True),
    'extinguisher': (build_extinguisher, 1, 1, False),
    'trophy_case': (build_trophy_case, 2, 1, False),
    'copier': (build_copier, 1, 1, False),
    'file_cabinet': (build_file_cabinet, 1, 1, False),
    'key_cabinet': (build_key_cabinet, 1, 1, True),
    'shelf': (build_shelf, 2, 1, False),
    'vending': (build_vending, 1, 1, False),
    'sign_quiet': (build_sign_quiet, 1, 1, True),
    'console': (build_console, 2, 1, False),
    'plant': (build_plant, 1, 1, False),
    'mop': (build_mop, 1, 1, False),
    'sofa': (build_sofa, 2, 1, False),
}


def _check_bounds(key, w, h, wall):
    pts = C._world_verts([o for o in bpy.context.scene.objects if o.type == 'MESH'])
    xs = [p.x for p in pts]
    ys = [p.y for p in pts]
    zs = [p.z for p in pts]
    lo_y, hi_y = (-1.0605, -0.9995) if wall else (-h - 1e-3, 1e-3)
    bad = min(xs) < -1e-3 or max(xs) > w + 1e-3 or min(ys) < lo_y or max(ys) > hi_y or min(zs) < -1e-3 or max(zs) > C.WALL_H
    print(f'  {key}: x[{min(xs):.3f},{max(xs):.3f}] y[{min(ys):.3f},{max(ys):.3f}] z[{min(zs):.3f},{max(zs):.3f}]' + ('  <-- OUT OF FOOTPRINT' if bad else ''))


def main():
    sel = C.only(None)
    C.reset_scene(samples=48)
    path = os.path.join(C.OUT, CAT + '.json')
    meta = {}
    if sel and os.path.exists(path):
        meta = json.load(open(path, encoding='utf-8'))
    for key, (fn, w, h, wall) in BUILDERS.items():
        if sel and key not in sel:
            continue
        clear()
        fn()
        _check_bounds(key, w, h, wall)
        anchor = (0, -1, 0) if wall else (0, -h, 0)
        m = C.render_sprite(f'{CAT}/{key}', anchor=anchor)
        m['file'] = f'{CAT}/{key}.png'
        meta[key] = m
    meta = {k: meta[k] for k in BUILDERS if k in meta}
    C.write_meta(CAT, meta)


if __name__ == '__main__':
    main()
