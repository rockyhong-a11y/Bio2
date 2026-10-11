"""props_story — 퍼즐/이벤트 소품 스프라이트 (docs/asset-spec.md 의 props_story 표).

실행: <blender-venv>/bin/python tools/blender/props_story.py [-- key1 key2 ...]
변형(on/off/open/dead 등)은 같은 bounds 로 렌더해 w/h/ax/ay 가 완전히 같다.
"""
import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402
from common import box, cyl, sphere, mat, hex_to_linear  # noqa: E402

import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Vector  # noqa: E402

CAT = 'props_story'
FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc'
WH = C.WALL_H
TAU = math.tau
rad = math.radians


# ---------------------------------------------------------------- 공용 헬퍼
def link(o):
    bpy.context.scene.collection.objects.link(o)
    return o


def lin(c):
    return hex_to_linear(c) if isinstance(c, str) else c


def _fac(node):
    for n in ('Factor', 'Fac', 'Distance'):
        if n in node.outputs:
            return node.outputs[n]
    return node.outputs[0]


def _tex(N, kind, detail, distortion, wave_dir, wave_type, voronoi, rough_tex=0.55):
    if kind == 'noise':
        t = N.new('ShaderNodeTexNoise')
        t.inputs['Detail'].default_value = detail
        t.inputs['Roughness'].default_value = rough_tex
        t.inputs['Distortion'].default_value = distortion
    elif kind == 'wave':
        t = N.new('ShaderNodeTexWave')
        t.wave_type = wave_type
        if wave_type == 'BANDS':
            t.bands_direction = wave_dir
        else:
            t.rings_direction = wave_dir if wave_dir in ('X', 'Y', 'Z', 'SPHERICAL') else 'SPHERICAL'
        t.inputs['Distortion'].default_value = distortion
        t.inputs['Detail'].default_value = detail
        t.inputs['Detail Scale'].default_value = 1.5
    elif kind == 'voronoi':
        t = N.new('ShaderNodeTexVoronoi')
        t.feature = voronoi
        t.inputs['Randomness'].default_value = 1.0
    elif kind == 'checker':
        t = N.new('ShaderNodeTexChecker')
        t.inputs['Color1'].default_value = (1, 1, 1, 1)
        t.inputs['Color2'].default_value = (0, 0, 0, 1)
    else:
        raise ValueError(kind)
    if 'Scale' in t.inputs:
        t.inputs['Scale'].default_value = 1.0
    return t


def pmat(name, ramp, tex='noise', scale=5.0, detail=4.0, rough=0.6, metal=0.0, bump=0.0, bdist=0.01,
         distortion=0.0, wave_dir='X', wave_type='BANDS', voronoi='F1', loc=(0, 0, 0), rot=(0, 0, 0),
         tex2=None, mix2=0.35, scale2=20.0, rough2=None, emit=None, emit_strength=0.0, emit_ramp=None,
         coat=0.0, sss=0.0, rough_tex=0.55, alpha=1.0):
    """절차적 재질: (좌표→Mapping→텍스처[+2차 노이즈]→ColorRamp→Base Color, 같은 값으로 범프/러프니스)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = N.get('Principled BSDF')
    tc = N.new('ShaderNodeTexCoord')
    mp = N.new('ShaderNodeMapping')
    sc = scale if isinstance(scale, (tuple, list)) else (scale,) * 3
    mp.inputs['Scale'].default_value = sc
    mp.inputs['Location'].default_value = loc
    mp.inputs['Rotation'].default_value = rot
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    t1 = _tex(N, tex, detail, distortion, wave_dir, wave_type, voronoi, rough_tex)
    L.new(mp.outputs['Vector'], t1.inputs['Vector'])
    fac = _fac(t1)
    if tex2:
        mp2 = N.new('ShaderNodeMapping')
        sc2 = scale2 if isinstance(scale2, (tuple, list)) else (scale2,) * 3
        mp2.inputs['Scale'].default_value = sc2
        L.new(tc.outputs['Object'], mp2.inputs['Vector'])
        t2 = _tex(N, tex2, 4.0, 0.0, 'X', 'BANDS', 'F1')
        L.new(mp2.outputs['Vector'], t2.inputs['Vector'])
        m1 = N.new('ShaderNodeMath'); m1.operation = 'MULTIPLY'
        L.new(fac, m1.inputs[0]); m1.inputs[1].default_value = 1 - mix2
        m2 = N.new('ShaderNodeMath'); m2.operation = 'MULTIPLY_ADD'
        L.new(_fac(t2), m2.inputs[0]); m2.inputs[1].default_value = mix2
        L.new(m1.outputs[0], m2.inputs[2])
        fac = m2.outputs[0]
    cr = N.new('ShaderNodeValToRGB')
    els = cr.color_ramp.elements
    while len(els) < len(ramp):
        els.new(0.5)
    for e, (pos, col) in zip(els, ramp):
        e.position = pos
        e.color = (*lin(col), 1)
    L.new(fac, cr.inputs['Fac'])
    L.new(cr.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    if rough2 is not None:
        mr = N.new('ShaderNodeMapRange')
        L.new(fac, mr.inputs['Value'])
        mr.inputs['To Min'].default_value = rough
        mr.inputs['To Max'].default_value = rough2
        L.new(mr.outputs['Result'], b.inputs['Roughness'])
    b.inputs['Metallic'].default_value = metal
    if bump:
        bn = N.new('ShaderNodeBump')
        bn.inputs['Strength'].default_value = bump
        bn.inputs['Distance'].default_value = bdist
        L.new(fac, bn.inputs['Height'])
        L.new(bn.outputs['Normal'], b.inputs['Normal'])
    if emit is not None:
        b.inputs['Emission Color'].default_value = (*lin(emit), 1)
        b.inputs['Emission Strength'].default_value = emit_strength
    if emit_ramp is not None:
        # fac 가 높은 곳만 발광 (갈라진 틈의 불씨 등)
        er = N.new('ShaderNodeValToRGB')
        e = er.color_ramp.elements
        e[0].position, e[0].color = emit_ramp[0], (0, 0, 0, 1)
        e[1].position, e[1].color = emit_ramp[1], (*lin(emit_ramp[2]), 1)
        L.new(fac, er.inputs['Fac'])
        L.new(er.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = emit_ramp[3]
    if coat:
        b.inputs['Coat Weight'].default_value = coat
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m


def smooth_obj(o, on=True):
    for p in o.data.polygons:
        p.use_smooth = on
    return o


def mesh_obj(name, me, material=None, smooth=True, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, me)
    o.location = loc
    link(o)
    if material is not None:
        o.data.materials.append(material)
    return smooth_obj(o, smooth)


def catmull(pts, n=6):
    P = [Vector(p) for p in pts]
    if len(P) == 2:
        return [P[0].lerp(P[1], k / n) for k in range(n + 1)]
    out = []
    for i in range(len(P) - 1):
        p1, p2 = P[i], P[i + 1]
        p0 = P[i - 1] if i > 0 else p1 + (p1 - p2)
        p3 = P[i + 2] if i + 2 < len(P) else p2 + (p2 - p1)
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                              + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return out


def tube(name, ctrl, radii, material, n=6, bevel_res=2, squash=None, caps=True, smooth=True):
    """제어점(Catmull-Rom 보간)을 따라가는 관. radii = 제어점별 반지름 리스트 또는 (시작, 끝)."""
    pts = catmull(ctrl, n)
    m = len(pts)
    if len(radii) == len(ctrl) and len(ctrl) != 2:
        rs = []
        for i in range(m):
            f = i / (m - 1) * (len(ctrl) - 1)
            j = min(int(f), len(ctrl) - 2)
            rs.append(radii[j] + (radii[j + 1] - radii[j]) * (f - j))
    else:
        rs = [radii[0] + (radii[-1] - radii[0]) * i / (m - 1) for i in range(m)]
    cu = bpy.data.curves.new(name + '_cu', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_mode = 'ROUND'
    cu.bevel_depth = 1.0
    cu.bevel_resolution = bevel_res
    cu.use_fill_caps = caps
    sp = cu.splines.new('POLY')
    sp.points.add(m - 1)
    for i, (p, r) in enumerate(zip(pts, rs)):
        sp.points[i].co = (p.x, p.y, p.z, 1.0)
        sp.points[i].radius = max(r, 0.0005)
    co = link(bpy.data.objects.new(name + '_c', cu))
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(co.evaluated_get(dg))
    bpy.data.objects.remove(co, do_unlink=True)
    if squash:
        axis, center, f = squash
        for v in me.vertices:
            v.co[axis] = center + (v.co[axis] - center) * f
    return mesh_obj(name, me, material, smooth)


def orient(d, axis='Z'):
    d = Vector(d).normalized()
    up = 'Y' if abs(d.y) < 0.9 else 'X'
    if axis == up:
        up = 'Z'
    return d.to_track_quat(axis, up).to_euler()


def seg(name, p0, p1, w, h, material, bevel=0.0):
    """p0→p1 방향의 가는 각재 (단면 w×h)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    return box(name, (d.length, w, h), tuple((p0 + p1) / 2), material, bevel=bevel, rot=orient(d, 'X'))


def cone_to(name, base, direction, r, length, material, verts=6):
    d = Vector(direction).normalized()
    loc = Vector(base) + d * (length / 2)
    return cyl(name, r, length, tuple(loc), material, verts=verts, rot=orient(d, 'Z'), r2=0.0)


def ring_flat(name, cx, cy, r, w, z, material, segs=96, h=0.0006):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    ri, ro = r - w / 2, r + w / 2
    top_i, top_o, bot_i, bot_o = [], [], [], []
    for k in range(segs):
        a = k / segs * TAU
        c, s = math.cos(a), math.sin(a)
        top_i.append(bm.verts.new((cx + ri * c, cy + ri * s, z)))
        top_o.append(bm.verts.new((cx + ro * c, cy + ro * s, z)))
        bot_i.append(bm.verts.new((cx + ri * c, cy + ri * s, z - h)))
        bot_o.append(bm.verts.new((cx + ro * c, cy + ro * s, z - h)))
    for k in range(segs):
        j = (k + 1) % segs
        bm.faces.new((top_i[k], top_o[k], top_o[j], top_i[j]))
        bm.faces.new((top_o[k], bot_o[k], bot_o[j], top_o[j]))
    bm.to_mesh(me)
    bm.free()
    return mesh_obj(name, me, material, smooth=False)


def ngon_flat(name, cx, cy, r, n, z, material, rot0=math.pi / 2, h=0.0006):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new((cx + r * math.cos(rot0 + k * TAU / n), cy + r * math.sin(rot0 + k * TAU / n), z)) for k in range(n)]
    bm.faces.new(vs)
    bm.to_mesh(me)
    bm.free()
    return mesh_obj(name, me, material, smooth=False)


def text_mesh(name, body, size, loc, material, offset=0.0, rot=(0, 0, 0), extrude=0.0):
    font = bpy.data.fonts.load(FONT, check_existing=True)
    cu = bpy.data.curves.new(name + '_t', 'FONT')
    cu.body = body
    cu.font = font
    cu.size = size
    cu.align_x = 'CENTER'
    cu.align_y = 'CENTER'
    cu.offset = offset
    cu.extrude = extrude
    co = link(bpy.data.objects.new(name + '_tc', cu))
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(co.evaluated_get(dg))
    bpy.data.objects.remove(co, do_unlink=True)
    o = mesh_obj(name, me, material, smooth=False, loc=loc)
    o.rotation_euler = rot
    return o


def boolean(target, cutter, op='DIFFERENCE'):
    cutter.hide_render = True
    md = target.modifiers.new('bool', 'BOOLEAN')
    md.operation = op
    md.object = cutter
    md.solver = 'EXACT'
    md.material_mode = 'TRANSFER'
    return md


def galv(name='galv', s=14.0):
    return pmat(name, [(0, '#8a9198'), (0.45, '#a7aeb4'), (1, '#7b838a')], tex='voronoi', scale=s,
                rough=0.35, rough2=0.5, metal=0.75, bump=0.03)


def chrome(name='chrome'):
    return pmat(name, [(0, '#9a9fa4'), (1, '#c9cdd1')], scale=(3, 3, 40), rough=0.22, metal=0.9)


def bark_mat(name='bark'):
    return pmat(name, [(0, '#0e0506'), (0.42, '#26090b'), (0.68, '#4b1014'), (1, '#7c1e1e')],
                tex='noise', scale=(9, 9, 1.6), detail=8, distortion=0.6, rough=0.45, rough2=0.8,
                bump=0.45, bdist=0.02, tex2='wave', scale2=(1, 1, 7), mix2=0.3, coat=0.25)


# ---------------------------------------------------------------- 렌더 관리
META = {}


def scene_bounds():
    objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and not o.hide_render]
    bpy.context.view_layer.update()
    pts = [C.project(p) for p in C._world_verts(objs)]
    return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))


def render_set(variants, anchor, samples=48, bounds_fn=None):
    """variants: [(key, build_fn)] — 모두 같은 bounds 로 렌더. bounds_fn: 계산된 bounds 를 고치는 함수(잘라내기 등)."""
    sel = C.only(None)
    if sel and not any(k in sel for k, _ in variants):
        return
    seed = variants[0][0]
    sc = bpy.context.scene
    sc.cycles.samples = samples
    bounds = None
    if len(variants) > 1:
        bs = []
        for k, fn in variants:
            C.clear_meshes(); random.seed(seed); fn()
            bs.append(scene_bounds())
        bounds = (min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs))
    elif bounds_fn is not None:
        C.clear_meshes(); random.seed(seed); variants[0][1]()
        bounds = scene_bounds()
    if bounds_fn is not None:
        bounds = bounds_fn(bounds)
    for k, fn in variants:
        C.clear_meshes(); random.seed(seed); fn()
        META[k] = C.render_sprite(CAT + '/' + k, anchor=anchor, bounds=bounds)
        print('rendered', k, META[k])
    sc.cycles.samples = 48


# ---------------------------------------------------------------- 금고
def build_safe(opened):
    paint = pmat('safe_paint', [(0, '#435048'), (0.5, '#56665a'), (1, '#6b7c70')], scale=(14, 14, 14), detail=6,
                 rough=0.42, rough2=0.6, metal=0.22, bump=0.06, tex2='noise', scale2=90, mix2=0.25)
    inner = pmat('safe_in', [(0, '#313437'), (1, '#4d5155')], scale=12, rough=0.85)
    steel = chrome('safe_chrome')
    brass = pmat('brass', [(0, '#7a5f2a'), (1, '#b8944a')], scale=30, rough=0.3, metal=0.85)
    dark = mat('safe_dark', '#141414', rough=0.6)
    # 몸체를 북쪽(벽 쪽)으로 붙여서 열린 문(-80°)이 셀 남쪽 경계 근처에서 멈추게 함
    x0, x1, yb, yf, z0, z1 = 0.18, 0.82, -0.03, -0.50, 0.05, 0.86
    body = box('safe_body', (x1 - x0, yb - yf, z1 - z0), ((x0 + x1) / 2, (yb + yf) / 2, (z0 + z1) / 2), paint, bevel=0.025)
    cut = box('safe_cut', (0.5, 0.46, 0.66), (0.5, -0.33, 0.46), inner)
    boolean(body, cut)
    box('safe_plinth', (0.58, 0.42, 0.05), (0.5, -0.265, 0.025), dark, bevel=0.01)
    # 빈 내부 선반
    box('safe_shelf', (0.5, 0.42, 0.02), (0.5, -0.31, 0.44), pmat('shelf', [(0, '#3e4144'), (1, '#525659')], scale=20, rough=0.6))
    hx, hy = 0.235, yf
    hinge = C.empty('safe_hinge', (hx, hy, 0))
    hinge.rotation_euler = (0, 0, rad(-80) if opened else 0)
    dw = 0.53
    box('door', (dw, 0.05, 0.69), (dw / 2, -0.025, 0.46), paint, bevel=0.012, parent=hinge)
    box('door_panel', (dw - 0.08, 0.012, 0.6), (dw / 2, -0.055, 0.46), paint, bevel=0.005, parent=hinge)
    box('door_back', (dw - 0.1, 0.012, 0.56), (dw / 2, 0.006, 0.46), pmat('steel_back', [(0, '#5d6266'), (1, '#80868b')], scale=(4, 4, 30), rough=0.4, metal=0.7), parent=hinge)
    for zz in (0.24, 0.68):
        cyl('hinge', 0.022, 0.12, (0.0, -0.03, zz), steel, parent=hinge)
    # 다이얼
    dz = 0.58
    cyl('dial_ring', 0.095, 0.02, (dw / 2, -0.07, dz), steel, rot=(rad(90), 0, 0), verts=32, parent=hinge)
    cyl('dial_face', 0.075, 0.03, (dw / 2, -0.085, dz), dark, rot=(rad(90), 0, 0), verts=32, parent=hinge)
    white = mat('tick', '#d8d4c8', rough=0.5)
    for k in range(12):
        a = k / 12 * TAU
        box('tick', (0.008, 0.006, 0.02 if k % 3 else 0.03), (dw / 2 + 0.062 * math.sin(a), -0.1, dz + 0.062 * math.cos(a)),
            white, rot=(0, -a, 0), parent=hinge)
    cyl('dial_knob', 0.035, 0.035, (dw / 2, -0.11, dz), steel, rot=(rad(90), 0, 0), verts=24, parent=hinge)
    box('dial_mark', (0.012, 0.01, 0.03), (dw / 2, -0.08, dz + 0.1), mat('mark', '#b02a20'), parent=hinge)
    # 3갈래 핸들
    hz = 0.34
    cyl('hub', 0.03, 0.05, (dw / 2, -0.08, hz), steel, rot=(rad(90), 0, 0), parent=hinge)
    for k in range(3):
        a = rad(90 + k * 120)
        e = (dw / 2 + 0.1 * math.cos(a), -0.1, hz + 0.1 * math.sin(a))
        seg('spoke', (dw / 2, -0.1, hz), e, 0.02, 0.02, steel).parent = hinge
        sphere('knob', 0.024, e, steel, parent=hinge)
    box('plate', (0.17, 0.01, 0.045), (dw / 2, -0.064, 0.735), brass, bevel=0.004, parent=hinge)
    # 문 옆 손잡이 (몸체 쪽) 경첩 블록
    box('hinge_block', (0.03, 0.03, 0.62), (hx - 0.01, hy - 0.01, 0.46), paint, bevel=0.008)


# ---------------------------------------------------------------- 배전반 (벽걸이)
def build_switchboard(on):
    paint = pmat('sb_paint', [(0, '#6f746d'), (0.5, '#80857d'), (1, '#8f938a')], scale=40, detail=5,
                 rough=0.5, metal=0.25, bump=0.08, bdist=0.004)
    paint2 = pmat('sb_paint2', [(0, '#868a82'), (1, '#9a9e95')], scale=40, rough=0.48, metal=0.2, bump=0.05)
    steel = chrome('sb_chrome')
    dark = mat('sb_dark', '#1b1c1e', rough=0.55)
    box('sb_body', (0.68, 0.05, 0.86), (0.5, -1.025, 0.87), paint, bevel=0.012)
    box('sb_door', (0.62, 0.012, 0.8), (0.5, -1.056, 0.87), paint2, bevel=0.004)
    # 전선관
    for x in (0.31, 0.69):
        cyl('conduit', 0.026, WH - 1.28, (x, -1.03, (1.28 + WH) / 2), galv('sb_galv', 30))
        cyl('conduit_nut', 0.036, 0.03, (x, -1.03, 1.3), steel, verts=6)
    # 라벨
    box('label', (0.48, 0.006, 0.055), (0.5, -1.064, 1.2), mat('label', '#d9d3bf', rough=0.7))
    for k in range(5):
        box('label_txt', (0.05, 0.004, 0.012), (0.33 + k * 0.085, -1.068, 1.2), dark)
    # 램프 4개
    if on:
        lamp = mat('lamp_on', '#b8ffbe', rough=0.2, emit='#4dff6a', emit_strength=9.0)
    else:
        lamp = mat('lamp_off', '#1d2e22', rough=0.15, metal=0.1)
    for k in range(4):
        x = 0.29 + k * 0.14
        cyl('bezel', 0.045, 0.014, (x, -1.068, 1.1), steel, rot=(rad(90), 0, 0), verts=24)
        sphere('lamp', 0.033, (x, -1.074, 1.1), lamp, scale=(1, 0.7, 1))
    # 차단기 줄
    box('breaker_bed', (0.5, 0.01, 0.11), (0.5, -1.066, 0.95), dark, bevel=0.004)
    for k in range(6):
        x = 0.31 + k * 0.076
        box('breaker', (0.05, 0.02, 0.08), (x, -1.075, 0.95), mat('brk', '#2c2d30', rough=0.4), bevel=0.004)
        box('toggle', (0.018, 0.02, 0.025), (x, -1.088, 0.965 if on else 0.935), mat('tog', '#e0ddd4', rough=0.4), bevel=0.003)
    # 메인 레버
    box('lever_house', (0.15, 0.03, 0.22), (0.5, -1.075, 0.66), dark, bevel=0.01)
    piv = C.empty('lever_piv', (0.5, -1.09, 0.66))
    piv.rotation_euler = (rad(-25) if on else rad(-155), 0, 0)
    box('lever_arm', (0.03, 0.025, 0.14), (0, 0, 0.07), steel, bevel=0.006, parent=piv)
    box('lever_grip', (0.07, 0.04, 0.05), (0, 0, 0.15), mat('grip', '#9a2620', rough=0.4), bevel=0.012, parent=piv)
    # 경고 삼각형
    tri = ngon_flat('warn', 0.25, 0, 0.055, 3, 0, mat('warn', '#d8b021', rough=0.5))
    tri.rotation_euler = (rad(90), 0, 0)
    tri.location = (0, -1.0635, 0.66)
    tri2 = ngon_flat('warn2', 0.25, 0, 0.028, 3, 0, dark)
    tri2.rotation_euler = (rad(90), 0, 0)
    tri2.location = (0, -1.065, 0.655)
    # 열쇠 구멍
    cyl('keyhole', 0.02, 0.01, (0.76, -1.066, 0.68), steel, rot=(rad(90), 0, 0))
    box('keyslot', (0.006, 0.01, 0.022), (0.76, -1.072, 0.68), dark)
    # 경첩
    for zz in (0.6, 1.14):
        cyl('hinge', 0.012, 0.07, (0.19, -1.062, zz), steel)


# ---------------------------------------------------------------- 배관/밸브
def pipe_path(y=-0.40, h=0.24, xa=0.12, xb=0.88):
    return [(xa, y, -0.02), (xa, y, h - 0.12), (xa, y, h - 0.04), (xa + 0.03, y, h - 0.005), (xa + 0.1, y, h),
            (xb - 0.1, y, h), (xb - 0.03, y, h - 0.005), (xb, y, h - 0.04), (xb, y, h - 0.12), (xb, y, -0.02)]


def pipe_base(name, y, h, burst=False):
    g = galv(name + '_galv', 12)
    iron = pmat(name + '_iron', [(0, '#2e2a28'), (0.6, '#423b37'), (1, '#5a4c40')], scale=18, rough=0.7, metal=0.35, bump=0.1)
    pr = 0.07
    tube(name + '_pipe', pipe_path(y, h), (pr, pr), g, n=4, bevel_res=3)
    for x in (0.12, 0.88):
        cyl(name + '_ff', 0.115, 0.03, (x, y, 0.015), iron, verts=24)
        for k in range(4):
            a = k * TAU / 4 + TAU / 8
            cyl('bolt', 0.016, 0.03, (x + 0.085 * math.cos(a), y + 0.085 * math.sin(a), 0.03), iron, verts=6)
        cyl(name + '_collar', 0.085, 0.05, (x, y, 0.12), iron, verts=24)
    # 배관 고정 밴드
    for x in (0.3, 0.7):
        cyl('band', pr + 0.012, 0.035, (x, y, h), iron, rot=(0, rad(90), 0), verts=20)
    return g, iron


def build_valve(closed):
    """볼 밸브: 스템이 카메라(-Y) 쪽으로 나와 레버가 화면 평면에서 돈다.
    열림 = 레버가 배관과 나란히(가로), 잠김 = 90° 돌아 위로 선 레버(세로) + 노란 꼬리표."""
    y, h = -0.40, 0.24
    g, iron = pipe_base('vl', y, h)
    red = pmat('vl_red', [(0, '#8e231c'), (0.5, '#b02d24'), (1, '#c4392e')], scale=20, rough=0.35, bump=0.03)
    steel = chrome('vl_chrome')
    sphere('vbody', 0.13, (0.5, y, h), iron, scale=(1.0, 0.95, 0.9), segs=24)
    for x in (0.37, 0.63):
        cyl('vflange', 0.112, 0.035, (x, y, h), iron, rot=(0, rad(90), 0), verts=24)
        for k in range(4):
            a = k * TAU / 4 + TAU / 8
            cyl('vbolt', 0.014, 0.05, (x, y + 0.085 * math.cos(a), h + 0.085 * math.sin(a)), steel, rot=(0, rad(90), 0), verts=6)
    # 보닛 + 스템: 카메라를 향해(앞쪽 위로 비스듬히) 나와 레버 회전면이 화면과 평행 → 두 상태 모두 길이 그대로 보임
    base = C.empty('vbase', (0.5, y, h))
    base.rotation_euler = (-C.ELEV, 0, 0)          # 로컬 -Y = 카메라 방향, 로컬 +Z = 화면 위
    cyl('bonnet', 0.062, 0.11, (0, -0.15, 0), iron, rot=(rad(90), 0, 0), verts=6, parent=base)
    cyl('stem', 0.022, 0.06, (0, -0.22, 0), steel, rot=(rad(90), 0, 0), parent=base)
    # 회전 멈춤쇠(스톱) 두 개: 열림/잠김 위치
    box('stop', (0.028, 0.02, 0.028), (0.075, -0.2, 0.075), iron, bevel=0.006, parent=base)
    piv = C.empty('vpiv', (0, -0.255, 0), parent=base)
    # 열림: 레버가 +X(배관 방향), 잠김: 로컬 Y축 기준 90° 돌아 화면 위쪽(+Z)
    piv.rotation_euler = (0, rad(-90) if closed else 0, 0)
    L_ = 0.4
    box('arm', (L_, 0.03, 0.075), (L_ / 2, 0, 0), red, bevel=0.014, parent=piv)
    box('grip', (0.15, 0.05, 0.1), (L_ - 0.06, -0.005, 0), mat('vgrip', '#6e1814', rough=0.55), bevel=0.028, parent=piv)
    cyl('hubp', 0.05, 0.035, (0, 0, 0), red, rot=(rad(90), 0, 0), verts=20, parent=piv)
    cyl('nut', 0.03, 0.03, (0, -0.025, 0), steel, verts=6, rot=(rad(90), 0, 0), parent=piv)
    if closed:
        # 잠금 꼬리표 (세운 레버에 매단 노란 표)
        tag = mat('vl_tag', '#d6b43a', rough=0.6)
        tagd = mat('vl_tagd', '#3a2a10')
        tube('tag_wire', [(0.5 + 0.025, y - 0.21, h + 0.42), (0.5 + 0.06, y - 0.235, h + 0.36), (0.5 + 0.08, y - 0.25, h + 0.32)],
             (0.004, 0.004), steel, n=3, bevel_res=1)
        trot = (-C.ELEV, rad(-8), 0)
        box('tag', (0.075, 0.008, 0.11), (0.5 + 0.085, y - 0.255, h + 0.26), tag, bevel=0.004, rot=trot)
        for dz in (0.02, -0.005):
            box('tag_line', (0.045, 0.004, 0.009), (0.5 + 0.085, y - 0.262, h + 0.27 + dz), tagd, rot=trot)
    # 압력계 (잠그면 바늘이 0 으로)
    gx = 0.22
    cyl('g_stem', 0.016, 0.16, (gx, y, h + 0.1), steel)
    gt = rad(41.4)
    cyl('g_body', 0.07, 0.035, (gx, y - 0.01, h + 0.22), steel, rot=(gt, 0, 0), verts=32)
    cyl('g_face', 0.058, 0.04, (gx, y - 0.012, h + 0.222), mat('g_face', '#e6e1d3', rough=0.4), rot=(gt, 0, 0), verts=32)
    nrm = Vector((0, -math.sin(gt), math.cos(gt)))
    upv = Vector((0, math.cos(gt), math.sin(gt)))
    p0 = Vector((gx, y - 0.012, h + 0.222)) + nrm * 0.022
    nd = Vector((-0.03, 0, 0)) - upv * 0.02 if closed else Vector((0.03, 0, 0)) + upv * 0.03
    seg('needle', p0, p0 + nd, 0.009, 0.004, mat('needle', '#b0201a'))


# ---------------------------------------------------------------- 증기
def steam_mat(name='steam', r0=0.07, rk=0.27, H=1.3, bf=0.06, dens=26.0, nscale=(4.5, 4.5, 2.6), lo=0.38, hi=0.72,
              glow=0.0, top_pow=0.6, rad_pow=0.8):
    """원뿔/원기둥 볼륨용 증기 밀도장. 오브젝트 원점 = 기둥 바닥 중심.
    반지름 rmax(z) = r0 + rk*z, 위로 H 에서 0, 바닥 bf 구간에서 페이드인.
    glow: 밀도에 비례하는 흰 발광 (밀도에 비례 → 두꺼운 곳이 '흰 알베도'처럼 밝아짐)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    N.remove(N.get('Principled BSDF'))
    out = N.get('Material Output')
    tc = N.new('ShaderNodeTexCoord')
    sep = N.new('ShaderNodeSeparateXYZ')
    L.new(tc.outputs['Object'], sep.inputs[0])
    comb = N.new('ShaderNodeCombineXYZ')
    L.new(sep.outputs['X'], comb.inputs['X'])
    L.new(sep.outputs['Y'], comb.inputs['Y'])
    vlen = N.new('ShaderNodeVectorMath'); vlen.operation = 'LENGTH'
    L.new(comb.outputs[0], vlen.inputs[0])

    def math_node(op, a, b=None, clamp=False):
        n = N.new('ShaderNodeMath'); n.operation = op; n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L.new(v, n.inputs[i])
        return n.outputs[0]
    hz = sep.outputs['Z']
    rmax = math_node('MULTIPLY_ADD', hz, rk)
    rmax.node.inputs[2].default_value = r0
    q = math_node('DIVIDE', vlen.outputs['Value'], rmax)
    radial = math_node('SUBTRACT', 1.0, q, clamp=True)
    radial = math_node('POWER', radial, rad_pow)
    top = math_node('SUBTRACT', 1.0, math_node('DIVIDE', hz, H), clamp=True)
    top = math_node('POWER', top, top_pow)
    bot = math_node('DIVIDE', hz, bf, clamp=True) if bf > 0 else math_node('GREATER_THAN', hz, 0.0)
    # 위로 흐르는 소용돌이 노이즈
    mp = N.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = nscale
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    nz = N.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 1.0
    nz.inputs['Detail'].default_value = 6.0
    nz.inputs['Roughness'].default_value = 0.6
    nz.inputs['Distortion'].default_value = 0.6
    L.new(mp.outputs['Vector'], nz.inputs['Vector'])
    cr = N.new('ShaderNodeMapRange')
    cr.inputs['From Min'].default_value = lo
    cr.inputs['From Max'].default_value = hi
    L.new(_fac(nz), cr.inputs['Value'])
    d = math_node('MULTIPLY', radial, cr.outputs['Result'])
    d = math_node('MULTIPLY', d, top)
    d = math_node('MULTIPLY', d, bot)
    d = math_node('MULTIPLY', d, dens)
    vol = N.new('ShaderNodeVolumePrincipled')
    vol.inputs['Color'].default_value = (0.97, 0.98, 0.99, 1)
    vol.inputs['Anisotropy'].default_value = 0.15
    L.new(d, vol.inputs['Density'])
    if glow > 0:
        vol.inputs['Emission Color'].default_value = (0.93, 0.95, 0.98, 1)
        L.new(math_node('MULTIPLY', d, glow), vol.inputs['Emission Strength'])
    L.new(vol.outputs[0], out.inputs['Volume'])
    return m


def vol_cone(name, r1, r2, depth, loc, material):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=32, radius1=r1, radius2=r2, depth=depth)
    for v in bm.verts:
        v.co.z += depth / 2
    bm.to_mesh(me); bm.free()
    return mesh_obj(name, me, material, loc=loc)


def build_steam():
    """파열된 배관에서 뿜는 하얀 증기 기둥: 셀 한가운데~남쪽을 채우는 넓은 기둥 + 바닥에 깔린 증기."""
    y, h = -0.46, 0.20
    g, iron = pipe_base('st', y, h)
    # 파열부: 찢어진 철판 꽃잎 + 검은 틈
    dark = mat('st_hole', '#0a0a0a', rough=1)
    sphere('st_hole', 0.05, (0.5, y, h + 0.055), dark, scale=(1.3, 0.8, 0.35))
    for k in range(6):
        a = k * TAU / 6 + 0.3
        base = Vector((0.5 + 0.055 * math.cos(a), y + 0.04 * math.sin(a), h + 0.06))
        dvec = Vector((math.cos(a), math.sin(a), 1.1))
        seg('petal', base, base + dvec.normalized() * random.uniform(0.04, 0.07), 0.035, 0.006, g)
    # 증기 기둥 (볼륨): 원점이 기둥 바닥
    pc = (0.5, -0.52)
    vol_cone('steam_vol', 0.4, 0.66, 1.42, (pc[0], pc[1], h + 0.03),
             steam_mat('steam', r0=0.37, rk=0.18, H=1.42, bf=0.03, dens=28.0, lo=0.36, hi=0.7, glow=0.4, top_pow=1.1,
                       rad_pow=1.3))
    # 바닥에 깔려 퍼지는 증기 (통로를 막는 느낌)
    vol_cone('steam_mist', 0.6, 0.42, 0.36, (pc[0], pc[1] - 0.03, 0.0),
             steam_mat('steam_mist', r0=0.58, rk=-0.45, H=0.36, bf=0.0, dens=20.0, nscale=(5, 5, 4), lo=0.34, hi=0.68,
                       glow=0.4, top_pow=1.2))
    sc = bpy.context.scene
    try:
        sc.cycles.volume_step_rate = 0.5
        sc.cycles.volume_max_steps = 512
    except Exception:
        pass


# ---------------------------------------------------------------- 환풍구 철망 (벽걸이)
def diag_lines(x0, x1, z0, z1, sp):
    """사각형 안의 ±45° 대각선 세그먼트 목록."""
    out = []
    for sgn in (1, -1):
        # 선: z - sgn*x = c
        cs = [z0 - sgn * x1, z0 - sgn * x0, z1 - sgn * x0, z1 - sgn * x1]
        cmin, cmax = min(cs), max(cs)
        c = cmin + sp / 2
        while c < cmax:
            pts = []
            for x in (x0, x1):
                z = c + sgn * x
                if z0 - 1e-9 <= z <= z1 + 1e-9:
                    pts.append((x, z))
            for z in (z0, z1):
                x = (z - c) * sgn
                if x0 - 1e-9 <= x <= x1 + 1e-9:
                    pts.append((x, z))
            pts = sorted(set((round(p[0], 6), round(p[1], 6)) for p in pts))
            if len(pts) >= 2:
                a, b = pts[0], pts[-1]
                if math.dist(a, b) > 0.01:
                    out.append((a, b))
            c += sp
    return out


def build_vent_grate(cut):
    g = pmat('vg_galv', [(0, '#8f969c'), (0.5, '#aab0b5'), (1, '#7f878e')], tex='voronoi', scale=30, rough=0.4, metal=0.7, bump=0.03)
    wire = pmat('vg_wire', [(0, '#9da4aa'), (1, '#c3c8cc')], scale=20, rough=0.35, metal=0.75)
    # 구멍 안쪽: 아래(가까운 덕트 바닥)는 짙은 철판, 위로 갈수록 검정
    hole = bpy.data.materials.new('vg_hole'); hole.use_nodes = True
    N, L = hole.node_tree.nodes, hole.node_tree.links
    b = N.get('Principled BSDF')
    tc = N.new('ShaderNodeTexCoord'); sp = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], sp.inputs[0])
    mr = N.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -0.25; mr.inputs['From Max'].default_value = 0.2
    L.new(sp.outputs['Z'], mr.inputs['Value'])
    cr = N.new('ShaderNodeValToRGB'); e = cr.color_ramp.elements
    e[0].color = (*lin('#30353a'), 1); e[1].position = 0.8; e[1].color = (*lin('#050506'), 1)
    L.new(mr.outputs['Result'], cr.inputs['Fac']); L.new(cr.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.9
    x0, x1, z0, z1 = 0.15, 0.85, 0.05, 0.6
    t = 0.04
    box('vg_hole', (x1 - x0 - 0.02, 0.004, z1 - z0 - 0.02), (0.5, -1.002, (z0 + z1) / 2), hole)
    box('vg_top', (x1 - x0, 0.045, t), (0.5, -1.0225, z1 - t / 2), g, bevel=0.006)
    box('vg_bot', (x1 - x0, 0.045, t), (0.5, -1.0225, z0 + t / 2), g, bevel=0.006)
    box('vg_l', (t, 0.045, z1 - z0), (x0 + t / 2, -1.0225, (z0 + z1) / 2), g, bevel=0.006)
    box('vg_r', (t, 0.045, z1 - z0), (x1 - t / 2, -1.0225, (z0 + z1) / 2), g, bevel=0.006)
    steel = chrome('vg_chrome')
    for x in (x0 + 0.02, x1 - 0.02):
        for z in (z0 + 0.02, z1 - 0.02):
            cyl('screw', 0.011, 0.01, (x, -1.048, z), steel, rot=(rad(90), 0, 0), verts=8)
    ix0, ix1, iz0, iz1 = x0 + t - 0.005, x1 - t + 0.005, z0 + t - 0.005, z1 - t + 0.005
    lines = diag_lines(ix0, ix1, iz0, iz1, 0.072)
    yw = -1.026
    if not cut:
        for a, bb in lines:
            seg('wire', (a[0], yw, a[1]), (bb[0], yw, bb[1]), 0.013, 0.013, wire)
        return
    # 잘린 철망: 테두리에서 짧게 남은 철사 (일부는 바깥으로 휨)
    for a, bb in lines:
        pa, pb = Vector((a[0], yw, a[1])), Vector((bb[0], yw, bb[1]))
        d = (pb - pa).normalized()
        for p, dd in ((pa, d), (pb, -d)):
            L_ = random.uniform(0.025, 0.09)
            if random.random() < 0.15:
                continue
            q = p + dd * L_
            if random.random() < 0.55:
                q = q + Vector((0, -random.uniform(0.02, 0.06), random.uniform(-0.03, 0.0)))
            seg('stub', p, q, 0.012, 0.012, wire)
    # 뜯겨 바닥에 떨어진 철망 조각
    pcx, pcy, pt = 0.6, -1.17, rad(14)
    for a, bb in diag_lines(-0.17, 0.17, -0.09, 0.09, 0.072):
        q = [(pcx + u * math.cos(pt) - v * math.sin(pt), pcy + u * math.sin(pt) + v * math.cos(pt), 0.008 + 0.02 * (u + 0.17))
             for u, v in (a, bb)]
        seg('pwire', q[0], q[1], 0.012, 0.012, wire)
    for u0, v0, u1, v1 in ((-0.17, -0.09, 0.17, -0.09), (-0.17, 0.09, 0.17, 0.09)):
        q = [(pcx + u * math.cos(pt) - v * math.sin(pt), pcy + u * math.sin(pt) + v * math.cos(pt), 0.008 + 0.02 * (u + 0.17))
             for u, v in ((u0, v0), (u1, v1))]
        seg('pwire', q[0], q[1], 0.012, 0.012, wire)


# ---------------------------------------------------------------- 사다리
def build_ladder():
    alu = pmat('alu', [(0, '#959ba1'), (0.5, '#b3b8bd'), (1, '#c9cdd1')], scale=(3, 3, 60), detail=3,
               rough=0.3, metal=0.85)
    rubber = mat('rubber', '#1c1c1d', rough=0.8)
    cap = mat('ladcap', '#3a3d40', rough=0.6)
    y0, y1, ztop = -0.56, -0.045, 1.44
    v = Vector((0, y1 - y0, ztop))
    L_ = v.length
    tilt = -math.atan2(y1 - y0, ztop)
    root = C.empty('lad', (0.5, y0, 0.0))
    root.rotation_euler = (tilt, 0, 0)
    for sx in (-1, 1):
        box('rail', (0.035, 0.075, L_), (sx * 0.205, 0.0, L_ / 2), alu, bevel=0.006, parent=root)
        box('foot', (0.05, 0.1, 0.05), (sx * 0.205, 0.0, 0.025), rubber, bevel=0.012, parent=root)
        box('cap', (0.04, 0.08, 0.04), (sx * 0.205, 0.0, L_ - 0.02), cap, bevel=0.01, parent=root)
    n = 6
    for k in range(n):
        zz = 0.2 + k * (L_ - 0.32) / (n - 1)
        cyl('rung', 0.022, 0.38, (0, 0.0, zz), alu, rot=(0, rad(90), 0), verts=12, parent=root)
        for sx in (-1, 1):
            cyl('rivet', 0.03, 0.01, (sx * 0.19, 0.0, zz), alu, rot=(0, rad(90), 0), verts=12, parent=root)
    box('sticker', (0.008, 0.055, 0.14), (-0.225, 0.0, 0.62), mat('sticker', '#c48a1c', rough=0.5), parent=root)


# ---------------------------------------------------------------- 공구함 + 공구벨트
def build_toolbox():
    red = pmat('tb_red', [(0, '#4b4642'), (0.3, '#4b4642'), (0.34, '#8a241e'), (0.7, '#a12d24'), (1, '#b0362b')],
               scale=16, detail=7, rough=0.45, rough2=0.4, metal=0.2, bump=0.04, tex2='noise', scale2=60, mix2=0.3)
    steel = chrome('tb_chrome')
    dark = mat('tb_dark', '#151515', rough=0.7)
    leather = pmat('leather', [(0, '#4c3020'), (0.5, '#6b4429'), (1, '#86593a')], scale=24, detail=6, rough=0.6, bump=0.12)
    leather2 = pmat('leather2', [(0, '#3d2618'), (1, '#5c3a23')], scale=30, rough=0.65, bump=0.1)
    cx, cy = 0.5, -0.52
    box('tb_body', (0.64, 0.32, 0.22), (cx, cy, 0.12), red, bevel=0.012)
    box('tb_seam', (0.646, 0.326, 0.012), (cx, cy, 0.232), dark, bevel=0.003)
    box('tb_lid', (0.65, 0.33, 0.07), (cx, cy, 0.272), red, bevel=0.02)
    box('tb_lidtop', (0.6, 0.28, 0.02), (cx, cy, 0.305), red, bevel=0.008)
    for x in (0.27, 0.73):
        box('latch', (0.05, 0.016, 0.07), (x, cy - 0.168, 0.235), steel, bevel=0.005)
    box('sidehandle_l', (0.016, 0.1, 0.03), (cx - 0.33, cy, 0.18), steel, bevel=0.005)
    box('sidehandle_r', (0.016, 0.1, 0.03), (cx + 0.33, cy, 0.18), steel, bevel=0.005)
    # 공구벨트: 뚜껑 위에 둥글게 감긴 가죽 벨트
    zt = 0.33
    ring = [(cx - 0.05 + 0.22 * math.cos(a), cy + 0.105 * math.sin(a), zt) for a in [k / 16 * TAU for k in range(17)]]
    tube('belt', ring, (0.022, 0.022), leather, n=3, squash=(2, zt, 0.35))
    # 늘어진 벨트 끝 (앞쪽으로 흘러내림)
    tube('belt_end', [(cx - 0.2, cy - 0.09, zt), (cx - 0.22, cy - 0.15, zt - 0.01), (cx - 0.23, cy - 0.175, zt - 0.06),
                      (cx - 0.235, cy - 0.18, zt - 0.14)], (0.02, 0.02), leather, n=4, squash=(1, cy - 0.175, 0.5))
    box('buckle', (0.06, 0.016, 0.05), (cx - 0.12, cy - 0.105, zt + 0.0), steel, bevel=0.006)
    box('buckle_in', (0.035, 0.02, 0.026), (cx - 0.12, cy - 0.106, zt + 0.0), leather)
    # 주머니 + 꽂힌 공구
    px, py = cx + 0.17, cy + 0.0
    box('pouch', (0.15, 0.1, 0.14), (px, py, zt + 0.07), leather2, bevel=0.025)
    box('flap', (0.155, 0.02, 0.07), (px, py - 0.052, zt + 0.1), leather, bevel=0.01)
    cyl('sd_handle', 0.02, 0.1, (px - 0.035, py + 0.01, zt + 0.19), mat('sdh', '#d4a21e', rough=0.3), rot=(rad(-10), rad(-12), 0), verts=6)
    cyl('sd_tip', 0.008, 0.05, (px - 0.045, py + 0.018, zt + 0.26), steel, rot=(rad(-10), rad(-12), 0), verts=8)
    cyl('hm_handle', 0.016, 0.14, (px + 0.035, py + 0.01, zt + 0.19), pmat('hmw', [(0, '#7a5530'), (1, '#9c7448')], tex='wave', scale=(30, 30, 3), rough=0.5), rot=(rad(8), rad(10), 0), verts=10)
    box('hm_head', (0.035, 0.11, 0.035), (px + 0.05, py + 0.025, zt + 0.27), pmat('hmh', [(0, '#3a3c3e'), (1, '#5b5f63')], scale=40, rough=0.4, metal=0.8), bevel=0.006, rot=(rad(8), rad(10), 0))


# ---------------------------------------------------------------- 작업대 (2×1)
def wood_mat(name, off, base='#8a6a48'):
    return pmat(name, [(0, '#5f4229'), (0.45, '#7d5c3c'), (0.75, base), (1, '#a3815a')], tex='wave', wave_type='RINGS',
                wave_dir='X', scale=(0.6, 9, 9), distortion=5.0, detail=3, loc=off, rough=0.6, bump=0.05,
                tex2='noise', scale2=(2, 40, 40), mix2=0.25)


def build_workbench():
    frame = pmat('wb_frame', [(0, '#34403a'), (0.5, '#43514a'), (1, '#52605a')], scale=30, rough=0.5, metal=0.3, bump=0.05)
    steel = chrome('wb_chrome')
    vise = pmat('vise', [(0, '#334a60'), (0.5, '#3f5a73'), (1, '#4f6a82')], scale=40, rough=0.45, metal=0.35, bump=0.08)
    dsteel = pmat('dsteel', [(0, '#3d4044'), (1, '#62676c')], scale=(5, 5, 50), rough=0.35, metal=0.85)
    ztop = 0.66
    ys = [-0.21, -0.385, -0.56, -0.735]
    for i, yy in enumerate(ys):
        box('plank', (1.86, 0.172, 0.07), (1.0, yy, ztop - 0.035), wood_mat('wbw%d' % i, (i * 3.7, i * 1.3, 0.0)), bevel=0.008)
    for x in (0.12, 1.88):
        for yy in (-0.18, -0.77):
            box('leg', (0.055, 0.055, ztop - 0.07), (x, yy, (ztop - 0.07) / 2), frame, bevel=0.006)
    for yy in (-0.165, -0.785):
        box('apron', (1.8, 0.035, 0.07), (1.0, yy, ztop - 0.105), frame, bevel=0.005)
    for x in (0.12, 1.88):
        box('apron_s', (0.035, 0.6, 0.07), (x, -0.475, ztop - 0.105), frame, bevel=0.005)
    box('shelf', (1.78, 0.6, 0.02), (1.0, -0.475, 0.13), frame, bevel=0.004)
    # 아래 선반 물건
    box('shelf_box', (0.32, 0.22, 0.14), (0.45, -0.45, 0.21), pmat('sbox', [(0, '#6b6e5f'), (1, '#7e8270')], scale=20, rough=0.6), bevel=0.01)
    for k in range(3):
        cyl('rod', 0.015, 0.6, (1.3, -0.35 - k * 0.04, 0.155), dsteel, rot=(0, rad(90), rad(4 * k)), verts=10)
    # 바이스 (오른쪽 앞)
    vx = 1.58
    box('v_base', (0.2, 0.18, 0.03), (vx, -0.66, ztop + 0.015), vise, bevel=0.008)
    box('v_body', (0.15, 0.24, 0.09), (vx, -0.72, ztop + 0.075), vise, bevel=0.02)
    box('v_fixed', (0.22, 0.06, 0.1), (vx, -0.63, ztop + 0.14), vise, bevel=0.015)
    box('v_move', (0.22, 0.06, 0.1), (vx, -0.84, ztop + 0.13), vise, bevel=0.015)
    box('jaw1', (0.2, 0.012, 0.035), (vx, -0.664, ztop + 0.17), dsteel)
    box('jaw2', (0.2, 0.012, 0.035), (vx, -0.806, ztop + 0.16), dsteel)
    cyl('screw', 0.016, 0.12, (vx, -0.92, ztop + 0.11), steel, rot=(rad(90), 0, 0), verts=12)
    cyl('tbar', 0.011, 0.26, (vx, -0.975, ztop + 0.11), steel, rot=(0, rad(90), 0), verts=10)
    for sx in (-1, 1):
        sphere('tball', 0.02, (vx + sx * 0.13, -0.975, ztop + 0.11), steel, segs=12)
    box('clamped', (0.34, 0.035, 0.035), (vx - 0.02, -0.735, ztop + 0.19), dsteel, bevel=0.004)
    # 작업대 위 물건
    wood_h = pmat('hammer_w', [(0, '#7a5530'), (1, '#a07a4c')], tex='wave', scale=(3, 30, 30), rough=0.5)
    cyl('hm_handle', 0.018, 0.32, (0.48, -0.42, ztop + 0.02), wood_h, rot=(0, rad(90), rad(-18)), verts=10)
    box('hm_head', (0.045, 0.14, 0.045), (0.64, -0.47, ztop + 0.03), dsteel, bevel=0.006, rot=(0, 0, rad(-18)))
    box('wrench', (0.28, 0.032, 0.012), (0.95, -0.3, ztop + 0.008), steel, bevel=0.004, rot=(0, 0, rad(25)))
    cyl('wrench_end', 0.03, 0.012, (1.077, -0.24, ztop + 0.008), steel, verts=14)
    box('block', (0.16, 0.1, 0.07), (0.25, -0.65, ztop + 0.035), wood_mat('blockw', (2, 5, 1), '#b08c5e'), bevel=0.006)
    for k in range(4):
        box('offcut', (random.uniform(0.05, 0.1), random.uniform(0.03, 0.05), 0.015),
            (1.15 + random.uniform(-0.1, 0.15), -0.55 + random.uniform(-0.1, 0.1), ztop + 0.008), dsteel,
            rot=(0, 0, random.uniform(0, 3)))
    box('square', (0.22, 0.03, 0.006), (0.8, -0.66, ztop + 0.004), steel, rot=(0, 0, rad(5)))
    box('square2', (0.03, 0.15, 0.006), (0.7, -0.6, ztop + 0.004), steel, rot=(0, 0, rad(5)))


# ---------------------------------------------------------------- 공작기계 (드릴 프레스)
def build_machine():
    green = pmat('mc_green', [(0, '#4e6355'), (0.5, '#5c7263'), (1, '#6a8070')], scale=45, detail=5, rough=0.45,
                 metal=0.2, bump=0.08, bdist=0.004)
    green2 = pmat('mc_green2', [(0, '#5b7262'), (1, '#6f8676')], scale=45, rough=0.42, metal=0.2, bump=0.06)
    steel = chrome('mc_chrome')
    dark = mat('mc_dark', '#1c1d1e', rough=0.6)
    box('mc_base', (0.52, 0.5, 0.08), (0.5, -0.52, 0.04), green, bevel=0.02)
    for k in range(2):
        box('slot', (0.3, 0.025, 0.01), (0.5, -0.58 - k * 0.08, 0.081), dark)
    for x in (0.28, 0.72):
        for yy in (-0.31, -0.73):
            cyl('anchor', 0.02, 0.02, (x, yy, 0.085), steel, verts=6)
    colx, coly = 0.5, -0.36
    cyl('column', 0.045, 1.1, (colx, coly, 0.08 + 0.55), steel, verts=20)
    cyl('col_foot', 0.08, 0.06, (colx, coly, 0.11), green, verts=20)
    # 테이블
    cyl('collar', 0.07, 0.1, (colx, coly, 0.5), green, verts=20)
    box('t_arm', (0.08, 0.22, 0.06), (colx, coly - 0.13, 0.5), green, bevel=0.015)
    cyl('table', 0.17, 0.04, (colx, -0.6, 0.54), green, verts=32)
    cyl('table_top', 0.16, 0.012, (colx, -0.6, 0.564), steel, verts=32)
    cyl('crank', 0.012, 0.12, (colx + 0.1, coly - 0.05, 0.47), steel, rot=(0, rad(90), 0))
    # 헤드
    box('head', (0.26, 0.4, 0.22), (colx, -0.47, 1.05), green, bevel=0.05)
    box('beltguard', (0.29, 0.44, 0.1), (colx, -0.45, 1.21), green2, bevel=0.045)
    cyl('motor', 0.09, 0.24, (colx, -0.2, 1.09), pmat('motor', [(0, '#4a5a4f'), (1, '#5d6e62')], tex='wave', wave_dir='Z', scale=40, rough=0.5, metal=0.3), verts=20)
    cyl('motor_cap', 0.07, 0.03, (colx, -0.2, 0.96), dark, verts=20)
    cyl('quill_house', 0.055, 0.12, (colx, -0.6, 0.9), green, verts=20)
    cyl('quill', 0.035, 0.08, (colx, -0.6, 0.81), steel, verts=16)
    cyl('chuck', 0.045, 0.07, (colx, -0.6, 0.74), steel, verts=16, r2=0.032)
    cyl('bit', 0.008, 0.12, (colx, -0.6, 0.65), mat('bit', '#2a2a2a', rough=0.3, metal=0.9), verts=8)
    # 이송 핸들 3갈래
    hx = colx + 0.15
    cyl('hub', 0.04, 0.05, (hx, -0.55, 0.98), steel, rot=(0, rad(90), 0), verts=16)
    for k in range(3):
        a = rad(-60 + k * 120)
        e = (hx + 0.03, -0.55 + 0.17 * math.cos(a), 0.98 + 0.17 * math.sin(a))
        seg('spoke', (hx + 0.02, -0.55, 0.98), e, 0.016, 0.016, steel)
        sphere('ball', 0.028, e, dark, segs=14)
    # 스위치
    box('sw_box', (0.1, 0.03, 0.12), (colx - 0.07, -0.68, 1.05), dark, bevel=0.01)
    cyl('btn_g', 0.018, 0.02, (colx - 0.07, -0.698, 1.08), mat('btn_g', '#2f8a3a', rough=0.3), rot=(rad(90), 0, 0))
    cyl('btn_r', 0.022, 0.025, (colx - 0.07, -0.7, 1.025), mat('btn_r', '#b8231c', rough=0.3), rot=(rad(90), 0, 0))
    box('warn', (0.07, 0.006, 0.05), (colx + 0.07, -0.671, 1.08), mat('mc_warn', '#d1a428', rough=0.5))
    # 전원 케이블
    tube('cable', [(colx, -0.12, 1.0), (colx + 0.02, -0.08, 0.7), (colx + 0.05, -0.1, 0.3), (colx + 0.1, -0.2, 0.02), (colx + 0.3, -0.25, 0.02)],
         (0.012, 0.012), dark, n=4)


# ---------------------------------------------------------------- 金 원진 (바닥 데칼 2×2)
def build_sigil():
    cx, cy = 1.0, -1.0
    # 희미한 금빛: 어둡고 채도 낮은 금색 + 약한 발광, 반투명이라 바닥이 비쳐 '새겨진' 느낌
    gold = pmat('sig_gold', [(0, '#6e5a30'), (0.5, '#8c7340'), (1, '#a8894a')], scale=8, detail=4, rough=0.45,
                metal=0.25, emit='#c99a48', emit_strength=0.4, alpha=0.82)
    groove = mat('sig_groove', '#17130d', rough=0.9, alpha=0.55)
    zg, zd = 0.0022, 0.0012

    def ring2(name, r, w):
        ring_flat(name + '_d', cx, cy, r, w + 0.026, zd, groove)
        ring_flat(name, cx, cy, r, w, zg, gold)

    def line2(name, p0, p1, w):
        seg(name + '_d', (p0[0], p0[1], zd - 0.0003), (p1[0], p1[1], zd - 0.0003), w + 0.026, 0.0006, groove)
        seg(name, (p0[0], p0[1], zg - 0.0003), (p1[0], p1[1], zg - 0.0003), w, 0.0006, gold)

    ring2('r_out', 0.93, 0.04)
    ring2('r_mid', 0.76, 0.022)
    ring2('r_in', 0.44, 0.03)
    # 띠 안 문양: 막대 + 점 교대
    nmark = 30
    for k in range(nmark):
        a = math.pi / 2 + k * TAU / nmark
        c, s = math.cos(a), math.sin(a)
        if k % 2 == 0:
            line2('mk', (cx + 0.795 * c, cy + 0.795 * s), (cx + 0.885 * c, cy + 0.885 * s), 0.02)
        else:
            ngon_flat('dot_d', cx + 0.84 * c, cy + 0.84 * s, 0.03, 4, zd, groove, rot0=a)
            ngon_flat('dot', cx + 0.84 * c, cy + 0.84 * s, 0.017, 4, zg, gold, rot0=a)
    # 오각별
    R = 0.76
    pts = [(cx + R * math.cos(math.pi / 2 + k * TAU / 5), cy + R * math.sin(math.pi / 2 + k * TAU / 5)) for k in range(5)]
    for k in range(5):
        a, b = Vector(pts[k]), Vector(pts[(k + 2) % 5])
        # 안쪽 원 안은 비워 글자가 보이게
        d = (b - a)
        L_ = d.length
        dn = d / L_
        # 원 r_in 과의 교점 구간을 잘라냄
        ac = a - Vector((cx, cy))
        bq = 2 * ac.dot(dn); cq = ac.dot(ac) - 0.46 ** 2
        disc = bq * bq - 4 * cq
        if disc > 0:
            t1 = (-bq - math.sqrt(disc)) / 2; t2 = (-bq + math.sqrt(disc)) / 2
            line2('star', a, a + dn * t1, 0.024)
            line2('star', a + dn * t2, b, 0.024)
        else:
            line2('star', a, b, 0.024)
    # 꼭짓점 작은 원
    for p in pts:
        ring_flat('vr_d', p[0], p[1], 0.07, 0.045, zd, groove, segs=32)
        ring_flat('vfill', p[0], p[1], 0.05, 0.1, zd + 0.0001, groove, segs=32)
        ring_flat('vr', p[0], p[1], 0.07, 0.02, zg, gold, segs=32)
        ngon_flat('vdot', p[0], p[1], 0.025, 12, zg, gold)
    # 가운데 '金'
    text_mesh('kanji_d', '金', 0.62, (cx, cy + 0.01, zd), groove, offset=0.014)
    text_mesh('kanji', '金', 0.62, (cx, cy + 0.01, zg), gold)


# ---------------------------------------------------------------- 이상한 화분
def build_weird_plant(dead):
    cx, cy = 0.5, -0.5
    pot = pmat('wp_pot', [(0, '#3d2a22'), (0.5, '#5a3b2c'), (1, '#6e4a36')], scale=(10, 10, 3), detail=6, rough=0.35,
               rough2=0.6, bump=0.08, tex2='voronoi', scale2=12, mix2=0.25, coat=0.3)
    saucer = pmat('wp_saucer', [(0, '#3a271f'), (1, '#4e3428')], scale=20, rough=0.5)
    soil = pmat('wp_soil', [(0, '#1b130e'), (0.6, '#2b1f17'), (1, '#3b2b20')], scale=40, detail=6, rough=0.95, bump=0.3)
    cyl('saucer', 0.2, 0.03, (cx, cy, 0.015), saucer, verts=32)
    cyl('pot', 0.15, 0.3, (cx, cy, 0.18), pot, verts=32, r2=0.19)
    cyl('rim', 0.205, 0.045, (cx, cy, 0.335), pot, verts=32)
    cyl('soil', 0.185, 0.02, (cx, cy, 0.35), soil, verts=32)
    if not dead:
        stem = pmat('wp_stem', [(0, '#140405'), (0.5, '#330a0d'), (0.8, '#561017'), (1, '#7a1a20')], tex='wave',
                    wave_dir='Z', scale=(8, 8, 3), distortion=6, detail=4, rough=0.3, rough2=0.5, bump=0.15, coat=0.4)
        bud = pmat('wp_bud', [(0, '#4a0508'), (0.5, '#8a0d14'), (1, '#b51a1f')], scale=18, detail=5, distortion=1.5,
                   rough=0.22, bump=0.12, coat=0.6, sss=0.15)
        leaf = pmat('wp_leaf', [(0, '#1c0a10'), (1, '#3a1420')], tex='wave', wave_dir='X', scale=30, rough=0.4, coat=0.3)
    else:
        stem = pmat('wp_dstem', [(0, '#1d1815'), (0.5, '#2f2722'), (1, '#4a3e36')], tex='wave', wave_dir='Z',
                    scale=(10, 10, 4), distortion=8, detail=5, rough=0.85, bump=0.4)
        bud = pmat('wp_dbud', [(0, '#1e1210'), (1, '#3f2620')], scale=30, detail=6, rough=0.9, bump=0.5)
        leaf = pmat('wp_dleaf', [(0, '#2a221c'), (1, '#4a3c30')], scale=30, rough=0.9, bump=0.3)
    thorn_m = mat('wp_thorn', '#0f0607', rough=0.4)
    n = 5
    for i in range(n):
        a0 = i * TAU / n + random.uniform(-0.3, 0.3)
        H = random.uniform(0.62, 1.05)
        tw = random.uniform(2.5, 4.0) * random.choice([-1, 1])
        lean = random.uniform(0.08, 0.16)
        r0 = random.uniform(0.03, 0.08)
        ctrl, rr = [], []
        steps = 7
        for k in range(steps + 1):
            t = k / steps
            z = 0.35 + (H - 0.35) * t
            ang = a0 + tw * t
            rad_ = r0 + lean * t + 0.04 * math.sin(t * 6 + i)
            ctrl.append((cx + rad_ * math.cos(ang), cy + rad_ * math.sin(ang) * 0.85, z))
            rr.append(0.028 - 0.016 * t)
        tip_dir = Vector(ctrl[-1]) - Vector(ctrl[-2])
        if dead:
            # 위로 자라다 꺾여 화분 밖으로 축 늘어짐
            ctrl = ctrl[:4]
            rr = rr[:4]
            last = Vector(ctrl[-1])
            out = Vector((math.cos(a0), math.sin(a0) * 0.85, 0)).normalized()
            ctrl += [tuple(last + out * 0.08 + Vector((0, 0, 0.05))), tuple(last + out * 0.17 + Vector((0, 0, -0.02))),
                     tuple(last + out * 0.22 + Vector((0, 0, -0.16)))]
            rr += [0.011, 0.009, 0.006]
            tip_dir = Vector(ctrl[-1]) - Vector(ctrl[-2])
        tube('stem%d' % i, ctrl, rr, stem, n=5, bevel_res=2)
        tip = Vector(ctrl[-1])
        d = tip_dir.normalized()
        if dead:
            b = sphere('bud', 0.032, tuple(tip + d * 0.02), bud, scale=(0.75, 0.75, 1.25), segs=12, rot=orient(d))
            for k in range(3):
                cone_to('sepal', tip, (d + Vector((math.cos(k * 2.1), math.sin(k * 2.1), 0)) * 0.6), 0.008, 0.04, bud)
        else:
            b = sphere('bud', 0.06, tuple(tip + d * 0.045), bud, scale=(0.85, 0.85, 1.3), segs=20, rot=orient(d))
            cone_to('budtip', tip + d * 0.1, d, 0.02, 0.05, bud, verts=10)
            for k in range(4):
                sd = (d + Vector((math.cos(k * 1.57 + i), math.sin(k * 1.57 + i), -0.3)) * 1.1).normalized()
                cone_to('sepal', tip + d * 0.01, sd, 0.018, 0.07, stem, verts=6)
        # 가시
        pts = catmull(ctrl, 4)
        for j in range(3, len(pts) - 3, 3):
            p = pts[j]
            tang = (pts[j + 1] - pts[j - 1]).normalized()
            side = tang.cross(Vector((random.uniform(-1, 1), random.uniform(-1, 1), 0.2))).normalized()
            cone_to('thorn', p, (side + tang * 0.5), 0.008, 0.04, thorn_m, verts=5)
        # 잎
        if i % 2 == 0:
            p = Vector(ctrl[2])
            ang = a0 + 0.8
            lv = Vector((math.cos(ang), math.sin(ang), -0.25 if not dead else -1.2)).normalized()
            sphere('leaf', 0.09, tuple(p + lv * 0.08), leaf, scale=(1.0, 0.35, 0.07) if not dead else (0.8, 0.25, 0.06),
                   segs=12, rot=orient(lv, 'X'))
    if dead:
        for k in range(5):
            a = random.uniform(0, TAU)
            r = random.uniform(0.08, 0.2)
            sphere('debris', 0.025, (cx + r * math.cos(a), cy + r * math.sin(a) * 0.9, 0.37 if r < 0.17 else 0.035),
                   leaf, scale=(1.2, 0.6, 0.25), segs=8, rot=(0, 0, a))


# ---------------------------------------------------------------- 나무 귀신 (2×2)
def build_tree(dead):
    cx, cy = 1.0, -0.98
    if dead:
        barkm = char_mat()
    else:
        barkm = bark_mat('tg_bark')
    # 교실 마루(floor_wood) 톤의 판재. 결(RINGS, X축)이 판재 긴 축(로컬 X)을 따라 흐름
    wood = [pmat('tg_board%d' % k, [(0, '#5a3d28'), (0.45, '#6e4f37'), (0.75, c), (1, '#8a6748')], tex='wave',
                 wave_type='RINGS', wave_dir='X', scale=(0.6, 9, 9), distortion=5.0, detail=3, loc=(k * 2.3, k * 1.7, 0.0),
                 rough=0.6, bump=0.05, tex2='noise', scale2=(2, 40, 40), mix2=0.25)
            for k, c in enumerate(('#7b5b40', '#835f43', '#74573d'))]
    end_m = mat('tg_endgrain', '#4a3626', rough=0.9)
    dark = mat('tg_void', '#050404', rough=1.0)
    # 바닥 구멍: 들쭉날쭉한 검은 구멍
    rng = random.Random(7)
    hole_r = [0.5 + rng.uniform(-0.06, 0.08) for _ in range(14)]
    me = bpy.data.meshes.new('hole')
    bm = bmesh.new()
    vs = [bm.verts.new((cx + r * math.cos(k * TAU / 14), cy + r * 0.92 * math.sin(k * TAU / 14), 0.002))
          for k, r in enumerate(hole_r)]
    bm.faces.new(vs)
    bm.to_mesh(me); bm.free()
    mesh_obj('hole', me, dark, smooth=False)
    # 들린/부러진 마루 판재: 실제 마루처럼 남북(Y) 방향으로 나란히, 구멍 가장자리에서 끊겨 안쪽 끝이 들림
    bw = 0.125
    xs = [cx - 0.5625 + i * bw for i in range(10)]
    for i, xc in enumerate(xs):
        dx = xc - cx
        R = 0.5 + rng.uniform(-0.03, 0.06)
        if abs(dx) >= R - 0.02:
            continue
        hh = math.sqrt(R * R - dx * dx) * 0.92
        for side in (1, -1):
            u = rng.random()
            if u < 0.18:
                continue            # 빠져 없어진 판재
            L_ = rng.uniform(0.14, 0.38)
            lift = 0.0 if u < 0.38 else rng.uniform(0.12, 0.62)   # 일부는 바닥에 그대로, 일부는 크게 들림
            yaw = rng.uniform(-0.12, 0.12) if lift > 0 else rng.uniform(-0.04, 0.04)
            wb = bw - 0.008 - rng.uniform(0, 0.012)
            inner_y = cy + side * (hh - rng.uniform(-0.02, 0.06))
            # 판재: 로컬 X = 긴 축. 바깥 끝은 바닥(z≈0), 안쪽 끝(구멍 쪽)이 들림
            ca = math.cos(lift)
            mid_y = inner_y + side * (L_ / 2) * ca
            mid_z = 0.015 + math.sin(lift) * L_ / 2
            o = box('board', (L_, wb, 0.03), (xc, mid_y, mid_z), wood[(i + (side > 0)) % 3], bevel=0.004)
            # 로컬 +X → 바깥쪽(±Y): Z ±90°. Y 축 +lift 로 +X(바깥) 끝이 내려가고 안쪽 끝이 들림
            o.rotation_euler = (0, lift, (math.pi / 2 if side > 0 else -math.pi / 2) + yaw)
            # 부러진 안쪽 끝: 뾰족한 나뭇결 조각 2개
            tip = Vector((xc, inner_y, 0.015 + math.sin(lift) * L_))
            for s_ in (-1, 1):
                if rng.random() < 0.35:
                    continue
                cone_to('splinter', tuple(tip + Vector((s_ * wb * 0.25, 0, 0))),
                        (s_ * 0.25 + rng.uniform(-0.2, 0.2), -side * 1.0, 0.25 + math.sin(lift)), 0.022,
                        rng.uniform(0.05, 0.11), wood[(i + 1) % 3], verts=4)
            box('endgrain', (0.012, wb * 0.9, 0.026), tuple(tip + Vector((0, side * 0.006, -0.003))), end_m,
                rot=(0, 0, math.pi / 2 + yaw))
    # (이전 판재 루프가 쓰던 전역 난수 60회를 그대로 소모 → 나무 모양은 리뷰 통과본과 동일하게 유지)
    for _ in range(60):
        random.random()
    # 줄기 가닥: 뿌리(바닥) → 꼬인 몸통 → 천장으로 뻗는 가지
    branch_angles = [rad(a) for a in (8, 48, 88, 128, 172, 212, 328)]
    random.shuffle(branch_angles)
    N = 7
    twist = 2.7
    strands = []
    for i in range(N):
        a = i * TAU / N + random.uniform(-0.2, 0.2)
        R0 = random.uniform(0.55, 0.78)
        ctrl, rr = [], []
        ctrl.append((cx + R0 * math.cos(a), cy + R0 * math.sin(a), -0.03)); rr.append(0.03)
        ctrl.append((cx + R0 * 0.72 * math.cos(a + 0.1), cy + R0 * 0.72 * math.sin(a + 0.1), 0.06)); rr.append(0.06)
        ctrl.append((cx + 0.3 * math.cos(a + 0.2), cy + 0.3 * math.sin(a + 0.2), 0.17)); rr.append(0.085)
        for z in (0.3, 0.45, 0.6, 0.75, 0.9, 1.0):
            ang = a + 0.2 + twist * (z - 0.3)
            r = 0.15 - 0.05 * (z - 0.3)
            ctrl.append((cx + r * math.cos(ang), cy + r * math.sin(ang), z)); rr.append(0.1 - 0.035 * (z - 0.3))
        be = branch_angles[i]
        Lb = random.uniform(0.62, 0.85) if math.sin(be) > -0.3 else random.uniform(0.5, 0.62)
        zs = [1.1, 1.22, 1.34, 1.45]
        for k, f in enumerate((0.3, 0.55, 0.8, 1.0)):
            ang = be + random.uniform(-0.2, 0.2)
            r = 0.15 + Lb * f
            ctrl.append((cx + r * math.cos(ang), cy + r * math.sin(ang) * 0.95, zs[k] + random.uniform(-0.04, 0.04)))
            rr.append(0.07 - 0.055 * f)
        strands.append((ctrl, rr, be))
    if dead:
        # 몸통이 둘로 쪼개져 양옆으로 기울어짐, 가지는 부러져 짧음
        from mathutils import Matrix
        out = []
        for ctrl, rr, be in strands:
            side = 1 if (Vector(ctrl[5]).x - cx) >= 0 else -1
            Rm = Matrix.Rotation(rad(13) * side, 3, 'Y')
            piv = Vector((cx + side * 0.05, cy, 0.15))
            nc = []
            for p in ctrl:
                p = Vector(p)
                if p.z > 0.15:
                    p = piv + Rm @ (p - piv)
                    p.x += side * 0.06
                nc.append(tuple(p))
            keep = len(nc) - 4 + random.choice([1, 2])
            out.append((nc[:keep], rr[:keep], be))
        strands = out
    for i, (ctrl, rr, be) in enumerate(strands):
        tube('strand%d' % i, ctrl, rr, barkm, n=5, bevel_res=3)
        tip = Vector(ctrl[-1]); prev = Vector(ctrl[-2])
        if dead:
            cone_to('broken', tip, tip - prev, rr[-1] * 0.9, 0.05, barkm, verts=5)
            continue
        # 잔가지
        for f in (0.45, 0.75):
            j = len(ctrl) - 4 + int(f * 3)
            p = Vector(ctrl[j])
            d = (Vector(ctrl[j]) - Vector(ctrl[j - 1])).normalized()
            side = d.cross(Vector((0, 0, 1))).normalized() * random.choice([-1, 1])
            q1 = p + (d * 0.5 + side * 0.7 + Vector((0, 0, 0.35))).normalized() * random.uniform(0.15, 0.24)
            q2 = q1 + (d * 0.3 + side * 0.5 + Vector((0, 0, 0.5))).normalized() * random.uniform(0.08, 0.14)
            tube('twig', [tuple(p), tuple(q1), tuple(q2)], (0.03, 0.006), barkm, n=4, bevel_res=1)
        cone_to('tipthorn', tip, tip - prev, rr[-1], 0.08, barkm, verts=6)
        # 늘어진 잔뿌리
        if i % 2 == 0:
            p = Vector(ctrl[-3])
            hang = [tuple(p), tuple(p + Vector((0.02, -0.01, -0.12))), tuple(p + Vector((-0.02, 0.0, -0.25))),
                    tuple(p + Vector((0.01, 0.01, -0.33)))]
            tube('tendril', hang, (0.012, 0.003), barkm, n=4, bevel_res=1)
    # 몸통 심 (가닥 사이 빈틈 메움)
    if dead:
        for side in (-1, 1):
            tube('core', [(cx + side * 0.06, cy, 0.0), (cx + side * 0.09, cy, 0.4), (cx + side * 0.2, cy, 0.85)],
                 (0.13, 0.08), barkm, n=5)
        # 갈라진 틈: 숯이 된 속살 + 희미한 불씨
        ember = pmat('ember', [(0, '#0a0605'), (0.55, '#1a0d08'), (0.8, '#5a1e08'), (1, '#c2440f')], scale=(20, 20, 6),
                     detail=6, rough=0.9, emit_ramp=(0.6, 1.0, '#ff5a14', 3.0))
        box('crack', (0.05, 0.22, 0.75), (cx, cy - 0.03, 0.42), ember, rot=(0, 0, 0))
        # 부러져 떨어진 가지
        for k, (dx, dy, ang) in enumerate(((-0.62, -0.62, 0.4), (0.55, -0.45, -0.9))):
            p = Vector((cx + dx, cy + dy, 0.04))
            d = Vector((math.cos(ang), math.sin(ang), 0))
            tube('fallen', [tuple(p), tuple(p + d * 0.2 + Vector((0, 0, 0.02))), tuple(p + d * 0.42 + Vector((0, 0.04, 0.0)))],
                 (0.045, 0.02), barkm, n=4)
        for k in range(10):
            a = random.uniform(0, TAU); r = random.uniform(0.3, 0.85)
            box('ash', (0.05, 0.04, 0.012), (cx + r * math.cos(a), cy + r * math.sin(a), 0.006),
                mat('ashm', '#3a3633', rough=1), rot=(0, 0, a))
    else:
        tube('core', [(cx, cy, 0.0), (cx, cy, 0.5), (cx, cy - 0.01, 1.0)], (0.15, 0.1), barkm, n=5)
    # 얼굴 옹이: 살아있을 때만 붉게 빛나는 눈
    fy = cy - 0.15
    if dead:
        fx = cx - 0.11
        face = sphere('face', 0.2, (fx - 0.02, fy - 0.01, 0.6), barkm, scale=(0.8, 0.6, 1.25), segs=28, rot=(0, rad(13), 0))
        cuts = [((fx - 0.05, fy - 0.12, 0.74), (0.04, 0.08, 0.05)), ((fx - 0.02, fy - 0.12, 0.5), (0.04, 0.08, 0.09))]
    else:
        fx = cx
        face = sphere('face', 0.2, (fx, fy, 0.66), barkm, scale=(1.1, 0.62, 1.45), segs=32)
        cuts = [((fx - 0.085, fy - 0.12, 0.8), (0.05, 0.09, 0.06)), ((fx + 0.085, fy - 0.12, 0.79), (0.05, 0.09, 0.06)),
                ((fx, fy - 0.12, 0.56), (0.055, 0.09, 0.12))]
    for k, (loc, sc) in enumerate(cuts):
        cu = sphere('facecut%d' % k, 1.0, loc, dark, scale=sc, segs=20,
                    rot=(0, (rad(-22) if loc[0] < fx else rad(22)) if k < 2 and not dead else 0, 0))
        boolean(face, cu)
    if not dead:
        glow = mat('tg_eye', '#ff2a14', rough=0.5, emit='#ff1608', emit_strength=6.0)
        for sx in (-1, 1):
            sphere('eyeglow', 0.018, (fx + sx * 0.08, fy - 0.075, 0.785), glow, segs=12)
        sphere('mouthglow', 0.022, (fx, fy - 0.07, 0.53), mat('tg_mouth', '#5a0805', emit='#a01005', emit_strength=2.5), segs=12)
        # 얼굴을 감싸는 굵은 덩굴 2 가닥
        for sx in (-1, 1):
            tube('brow', [(fx + sx * 0.24, fy + 0.02, 0.98), (fx + sx * 0.14, fy - 0.07, 0.93), (fx + sx * 0.03, fy - 0.12, 0.87)],
                 (0.05, 0.025), barkm, n=4)


def char_mat():
    """검게 탄 숯 껍질: 노이즈 색 + 보로노이 균열(범프) + 균열 일부에 희미한 불씨."""
    m = pmat('char', [(0, '#070606'), (0.45, '#121010'), (0.75, '#262220'), (1, '#4c4642')], scale=(12, 12, 3),
             detail=8, rough=0.85, bump=0.3, bdist=0.02)
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N.get('Principled BSDF')
    tc = [n for n in N if n.bl_idname == 'ShaderNodeTexCoord'][0]
    mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (9, 9, 3.5)
    L.new(tc.outputs['Object'], mp.inputs['Vector'])
    vo = N.new('ShaderNodeTexVoronoi'); vo.feature = 'DISTANCE_TO_EDGE'
    L.new(mp.outputs['Vector'], vo.inputs['Vector'])
    # 균열 = 가장자리 거리 작음 → 마스크
    mr = N.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = 0.0; mr.inputs['From Max'].default_value = 0.05
    mr.inputs['To Min'].default_value = 1.0; mr.inputs['To Max'].default_value = 0.0
    L.new(vo.outputs['Distance'], mr.inputs['Value'])
    # 일부 균열만 불씨 (큰 노이즈로 마스크)
    nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    m2 = N.new('ShaderNodeMapRange'); m2.inputs['From Min'].default_value = 0.52; m2.inputs['From Max'].default_value = 0.62
    L.new(_fac(nz), m2.inputs['Value'])
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
    L.new(mr.outputs['Result'], mul.inputs[0]); L.new(m2.outputs['Result'], mul.inputs[1])
    b.inputs['Emission Color'].default_value = (*lin('#ff4a12'), 1)
    L.new(mul.outputs[0], b.inputs['Emission Strength'])
    # 균열 범프 추가
    bn = N.new('ShaderNodeBump'); bn.inputs['Strength'].default_value = 0.6; bn.inputs['Distance'].default_value = 0.02
    L.new(vo.outputs['Distance'], bn.inputs['Height'])
    old = [n for n in N if n.bl_idname == 'ShaderNodeBump' and n != bn][0]
    L.new(old.outputs['Normal'], bn.inputs['Normal'])
    L.new(bn.outputs['Normal'], b.inputs['Normal'])
    return m


# ---------------------------------------------------------------- 뿌리·가시덩굴 (1×1)
def thorny_vine(name, pts_ctrl, r, vine, thorn_m, every=3, tlen=(0.07, 0.1), tr=0.02, rng=None):
    """가시 덩굴 한 가닥: 관 + 바깥으로 뻗은 큰 가시."""
    rng = rng or random
    tube(name, pts_ctrl, r, vine, n=4, bevel_res=2)
    sp = catmull(pts_ctrl, 4)
    for j in range(1, len(sp) - 1, every):
        p = sp[j]
        tang = (sp[j + 1] - sp[j - 1]).normalized()
        side = tang.cross(Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 1)))).normalized()
        if side.length < 0.5:
            continue
        cone_to('thorn', tuple(p), side + tang * 0.35, tr, rng.uniform(*tlen), thorn_m, verts=5)


def build_roots():
    """문을 막은 굵은 뿌리 + 가시 덩굴. 비대칭으로 바닥에서 솟아 벽(문) 쪽으로 기대어 엉킴."""
    barkm = pmat('rt_bark', [(0, '#1c0c0a'), (0.45, '#3c1914'), (0.7, '#5e291e'), (1, '#86432f')], tex='noise',
                 scale=(10, 10, 2), detail=8, distortion=0.8, rough=0.5, rough2=0.85, bump=0.5, bdist=0.02,
                 tex2='wave', scale2=(2, 2, 8), mix2=0.3, coat=0.2)
    vine = pmat('rt_vine', [(0, '#3b3a22'), (0.6, '#575334'), (1, '#77704a')], tex='wave', wave_dir='Z', scale=20,
                distortion=4, rough=0.5, bump=0.2)
    thorn_m = pmat('rt_thorn', [(0, '#8c7a5c'), (1, '#b8a682')], scale=30, rough=0.4)
    rng = random.Random(11)
    # (제어점, 반지름(시작,끝)) — 모두 손으로 배치한 비대칭 곡선
    thick = [
        # 왼쪽: 바닥에서 솟아 뒤(벽)로 기대며 휘어 오름
        ([(0.2, -0.56, -0.03), (0.17, -0.48, 0.14), (0.1, -0.33, 0.42), (0.12, -0.17, 0.78), (0.26, -0.09, 1.12), (0.36, -0.05, 1.36)], (0.095, 0.03)),
        # 가운데: 가장 굵고 높음, S자로 꼬임
        ([(0.5, -0.64, -0.03), (0.53, -0.54, 0.12), (0.6, -0.38, 0.38), (0.5, -0.24, 0.66), (0.44, -0.13, 0.98), (0.58, -0.07, 1.25), (0.66, -0.04, 1.46)], (0.11, 0.03)),
        # 오른쪽: 낮고 짧게, 바깥으로 휘었다 돌아옴
        ([(0.86, -0.5, -0.03), (0.92, -0.4, 0.15), (0.97, -0.26, 0.42), (0.88, -0.14, 0.7), (0.8, -0.08, 0.92)], (0.085, 0.025)),
        # 비스듬히 가로지르는 뿌리 (왼쪽 아래 → 오른쪽 위), 가운데가 처짐
        ([(0.0, -0.36, 0.12), (0.18, -0.36, 0.26), (0.42, -0.31, 0.36), (0.66, -0.23, 0.6), (0.86, -0.15, 0.94), (1.0, -0.1, 1.18)], (0.075, 0.035)),
        # 오른쪽 위에서 내려와 가운데 뿌리에 감기는 뿌리
        ([(1.0, -0.12, 1.05), (0.82, -0.17, 0.98), (0.64, -0.2, 0.86), (0.5, -0.22, 0.76), (0.38, -0.26, 0.62)], (0.06, 0.03)),
        # 기울고 휜 가로 뿌리 (왼쪽 낮고 오른쪽 높게)
        ([(0.0, -0.17, 0.48), (0.22, -0.23, 0.55), (0.42, -0.22, 0.52), (0.62, -0.18, 0.62), (0.8, -0.13, 0.72), (1.0, -0.09, 0.8)], (0.055, 0.045)),
    ]
    paths = []
    for k, (ctrl, r) in enumerate(thick):
        tube('root%d' % k, ctrl, r, barkm, n=6, bevel_res=3)
        paths.append((catmull(ctrl, 6), r))
        # 끝을 뾰족하게 (잘린 통나무처럼 보이지 않게)
        tip, prev = Vector(ctrl[-1]), Vector(ctrl[-2])
        cone_to('rtip%d' % k, tuple(tip - (tip - prev).normalized() * 0.01), tip - prev, r[1] * 1.02, 0.1, barkm, verts=10)
        if ctrl[0][2] > 0.05:   # 공중에서 시작하는 뿌리는 시작 끝도 뾰족하게
            s0, s1 = Vector(ctrl[0]), Vector(ctrl[1])
            cone_to('rtip0_%d' % k, tuple(s0 - (s0 - s1).normalized() * 0.01), s0 - s1, r[0] * 1.02, 0.12, barkm, verts=10)
    # 바닥 위 뿌리: 굵은 뿌리 밑동에서 이어져 바닥을 기어 나감 (떠 있지 않게 밑동과 연결)
    surface = [
        ([(0.2, -0.54, 0.05), (0.1, -0.6, 0.06), (0.0, -0.68, 0.035), (-0.08, -0.74, 0.01)], (0.075, 0.016)),
        ([(0.5, -0.62, 0.05), (0.6, -0.71, 0.06), (0.74, -0.76, 0.04), (0.88, -0.84, 0.01)], (0.08, 0.016)),
        ([(0.86, -0.5, 0.04), (0.97, -0.53, 0.05), (1.07, -0.6, 0.012)], (0.065, 0.015)),
        ([(0.48, -0.62, 0.04), (0.4, -0.72, 0.045), (0.27, -0.79, 0.01)], (0.055, 0.013)),
    ]
    for k, (ctrl, r) in enumerate(surface):
        tube('sroot%d' % k, ctrl, r, barkm, n=6, bevel_res=3)
    # 밑동 혹(바닥에서 솟는 부분을 굵게 이어 줌)
    for (x, y_, rr) in ((0.2, -0.55, 0.12), (0.5, -0.62, 0.14), (0.87, -0.49, 0.1)):
        sphere('flare', rr, (x, y_, 0.0), barkm, scale=(1.15, 1.0, 0.55), segs=16)
    # 가는 곁뿌리
    for k in range(7):
        pts, r = paths[rng.choice((0, 1, 2, 3))]
        j = rng.randint(len(pts) // 4, len(pts) * 3 // 4)
        p = pts[j]
        d = Vector((rng.uniform(-1, 1), rng.uniform(-0.6, 0.1), rng.uniform(-0.3, 0.6))).normalized()
        q1 = p + d * rng.uniform(0.08, 0.13)
        q2 = q1 + (d + Vector((rng.uniform(-0.6, 0.6), 0, rng.uniform(-0.5, 0.3)))).normalized() * rng.uniform(0.06, 0.1)
        tube('rootlet%d' % k, [tuple(p), tuple(q1), tuple(q2)], (0.025, 0.005), barkm, n=4, bevel_res=1)
    # 가시 덩굴: 굵은 뿌리 몇 개를 느슨하게 감음 (밝은 올리브 갈색, 굵게)
    for k in (0, 1, 3):
        pts, r = paths[k]
        m = len(pts)
        ph = rng.uniform(0, TAU)
        spiral = []
        for j in range(0, m, 2):
            t = j / (m - 1)
            p = pts[j]
            tang = (pts[min(j + 1, m - 1)] - pts[max(j - 1, 0)]).normalized()
            u = tang.cross(Vector((0, 0, 1)))
            if u.length < 1e-3:
                u = Vector((1, 0, 0))
            u.normalize()
            w = tang.cross(u).normalized()
            rr = (r[0] + (r[1] - r[0]) * t) + 0.024
            a = ph + t * 9
            spiral.append(tuple(p + (u * math.cos(a) + w * math.sin(a)) * rr))
        thorny_vine('vine%d' % k, spiral, (0.024, 0.016), vine, thorn_m, every=3, rng=rng)
    # 뿌리 사이를 가로지르며 늘어진 덩굴 두 가닥
    thorny_vine('vineX0', [(0.0, -0.3, 0.3), (0.22, -0.42, 0.2), (0.45, -0.46, 0.3), (0.7, -0.4, 0.22), (1.0, -0.3, 0.38)],
                (0.022, 0.018), vine, thorn_m, every=3, rng=rng)
    thorny_vine('vineX1', [(0.08, -0.15, 1.0), (0.3, -0.2, 0.88), (0.52, -0.2, 0.95), (0.7, -0.16, 1.12), (0.9, -0.1, 1.2)],
                (0.02, 0.016), vine, thorn_m, every=3, rng=rng)


# ---------------------------------------------------------------- 패 꽂는 돌 홈 (벽걸이)
def pent_prism(name, cx, cz, r_back, r_front, y_back, y_front, material, bevel=0.0):
    """벽면(XZ)에 선 오각 기둥/절두체 — 꼭짓점이 위(+Z). y_back 이 벽 쪽, y_front 가 카메라 쪽."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    back, front = [], []
    for k in range(5):
        a = math.pi / 2 + k * TAU / 5
        back.append(bm.verts.new((cx + r_back * math.cos(a), y_back, cz + r_back * math.sin(a))))
        front.append(bm.verts.new((cx + r_front * math.cos(a), y_front, cz + r_front * math.sin(a))))
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    for k in range(5):
        j = (k + 1) % 5
        bm.faces.new((back[k], back[j], front[j], front[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=2, affect='EDGES')
    bm.to_mesh(me)
    bm.free()
    return mesh_obj(name, me, material, smooth=False)


def build_seal_slot():
    stone = pmat('ss_stone', [(0, '#5e5d58'), (0.4, '#7a7871'), (0.75, '#8d8a82'), (1, '#a3a097')], scale=22, detail=8,
                 rough=0.85, bump=0.25, bdist=0.004, tex2='voronoi', scale2=60, mix2=0.3)
    stone2 = pmat('ss_stone2', [(0, '#55544f'), (0.5, '#6d6b65'), (1, '#83817a')], scale=22, detail=8, rough=0.9, bump=0.3)
    # 오각 테두리: 밝은 화강암 톤 (판석보다 확실히 밝게)
    rim_m = pmat('ss_rim', [(0, '#a4a092'), (0.5, '#bdb8a9'), (1, '#d2cdbd')], scale=26, detail=6, rough=0.75, bump=0.15,
                 bdist=0.003)
    inner = pmat('ss_in', [(0, '#0e0d0c'), (1, '#1e1c1a')], scale=30, rough=0.95, bump=0.2)
    moss = pmat('ss_moss', [(0, '#2c3324'), (1, '#4a5236')], scale=50, rough=1.0, bump=0.3)
    zc = 0.86
    box('ss_slab', (0.56, 0.05, 0.66), (0.5, -1.025, zc), stone, bevel=0.02)
    box('ss_cap', (0.64, 0.075, 0.075), (0.5, -1.0375, zc + 0.365), stone2, bevel=0.015)
    box('ss_ledge', (0.62, 0.075, 0.065), (0.5, -1.0375, zc - 0.36), stone2, bevel=0.015)
    # 오각형 홈 (꼭짓점 위): 경사진 밝은 테두리(돌출) + 깊고 검은 구멍
    pc = (0.5, zc + 0.01)
    rim = pent_prism('ss_rim', pc[0], pc[1], 0.215, 0.185, -1.045, -1.088, rim_m, bevel=0.008)
    cut = pent_prism('ss_cut', pc[0], pc[1], 0.15, 0.15, -1.012, -1.12, inner)
    boolean(rim, cut)
    slab = [o for o in bpy.context.scene.objects if o.name.startswith('ss_slab')][0]
    cut2 = pent_prism('ss_cut2', pc[0], pc[1], 0.15, 0.15, -1.012, -1.12, inner)
    boolean(slab, cut2)
    # 구멍 바닥(안쪽 끝)을 확실히 검게
    pent_prism('ss_back', pc[0], pc[1], 0.152, 0.152, -1.01, -1.016, inner)
    # 테두리 바깥 음각 오각선
    for k in range(5):
        a0 = math.pi / 2 + k * TAU / 5
        a1 = a0 + TAU / 5
        rr = 0.255
        p0 = (pc[0] + rr * math.cos(a0), -1.0505, pc[1] + rr * math.sin(a0))
        p1 = (pc[0] + rr * math.cos(a1), -1.0505, pc[1] + rr * math.sin(a1))
        seg('ss_engr', p0, p1, 0.004, 0.012, inner)
    # 이끼/얼룩
    for k in range(4):
        sphere('moss', 0.03, (random.uniform(0.3, 0.7), -1.05, random.choice((zc - 0.32, zc + 0.33)) + random.uniform(-0.01, 0.01)),
               moss, scale=(1.6, 0.4, 0.5), segs=10)


# ---------------------------------------------------------------- 끊어진 밧줄
ROPE_TOP = WH + 0.25   # 밧줄은 스프라이트 위 가장자리(벽 높이)에서 잘려 나가 '천장에서 내려옴'으로 읽히게


def rope_bounds(b):
    """밧줄 스프라이트 위쪽을 벽 높이(z=WH)에서 자른다 — 위 끝(마감면)이 보이지 않게."""
    x0, y0, x1, y1 = b
    return (x0, C.project((0, -0.5, WH))[1] + 2.0 / C.PX, x1, y1)   # +pad(2px) → 잘린 면이 정확히 z=WH


def build_rope():
    hemp = pmat('hemp', [(0, '#7a6442'), (0.5, '#a48a5e'), (1, '#c4a978')], tex='wave', wave_dir='Z', scale=(14, 14, 14),
                distortion=1.0, detail=2, rot=(rad(35), 0, 0), rough=0.9, bump=0.5, bdist=0.01,
                tex2='noise', scale2=80, mix2=0.3)
    fray = pmat('fray', [(0, '#b39b70'), (1, '#dcc89e')], scale=40, rough=0.95)
    x, y = 0.5, -0.5
    zb = 0.5        # 끊어진 끝 높이 (바닥에서 떠 있음)
    # 살짝 휘고 흔들린 줄: 위는 고정, 아래로 갈수록 옆으로 밀림
    ctrl = [(x, y, ROPE_TOP), (x + 0.005, y, WH - 0.1), (x + 0.03, y - 0.005, 1.15), (x + 0.075, y - 0.015, 0.9),
            (x + 0.1, y - 0.02, 0.7), (x + 0.095, y - 0.025, zb + 0.06)]
    tube('rope', ctrl, (0.046, 0.046, 0.046, 0.047, 0.05, 0.056), hemp, n=6, bevel_res=3)
    # 끊어진 끝: 감아 묶은 마디 없이 굵게 풀어져 벌어진 가닥
    end = Vector(ctrl[-1])
    sphere('end_bulge', 0.062, tuple(end + Vector((0, 0, -0.01))), hemp, scale=(1, 1, 0.9), segs=16)
    # 끊어진 끝: 아래로 벌어지는 붓 모양 가닥(밝은 색) + 옆으로 삐친 짧은 올
    for k in range(16):
        a = k * TAU / 16 + random.uniform(-0.2, 0.2)
        stray = k % 5 == 0
        sp = random.uniform(0.09, 0.13) if stray else random.uniform(0.05, 0.1)
        L_ = random.uniform(0.06, 0.1) if stray else random.uniform(0.13, 0.22)
        p0 = end + Vector((math.cos(a) * 0.04, math.sin(a) * 0.04, -0.02))
        p1 = end + Vector((math.cos(a) * sp * 0.6, math.sin(a) * sp * 0.6, -0.02 - L_ * 0.45))
        p2 = end + Vector((math.cos(a) * sp, math.sin(a) * sp, -0.02 - L_))
        tube('strand', [tuple(p0), tuple(p1), tuple(p2)], (0.022, 0.007), fray, n=4, bevel_res=1)


# ---------------------------------------------------------------- 실행
def main():
    C.reset_scene()
    F = (0, -1, 0)      # 1×1 바닥 / 벽걸이 앵커
    F1 = (0, -1, 0)
    F2 = (0, -2, 0)     # 2×2
    render_set([('safe', lambda: build_safe(False)), ('safe_open', lambda: build_safe(True))], F)
    render_set([('switchboard', lambda: build_switchboard(False)), ('switchboard_on', lambda: build_switchboard(True))], F)
    render_set([('valve', lambda: build_valve(False)), ('valve_closed', lambda: build_valve(True))], F)
    render_set([('steam', build_steam)], F, samples=160)
    render_set([('vent_grate', lambda: build_vent_grate(False)), ('vent_grate_cut', lambda: build_vent_grate(True))], F)
    render_set([('ladder_prop', build_ladder)], F)
    render_set([('toolbox', build_toolbox)], F)
    render_set([('workbench', build_workbench)], F1)
    render_set([('machine', build_machine)], F)
    render_set([('sigil_metal', build_sigil)], F2)
    render_set([('weird_plant', lambda: build_weird_plant(False)), ('weird_plant_dead', lambda: build_weird_plant(True))], F)
    render_set([('tree_ghost', lambda: build_tree(False)), ('tree_ghost_dead', lambda: build_tree(True))], F2, samples=64)
    render_set([('roots', build_roots)], F)
    render_set([('seal_slot', build_seal_slot)], F)
    render_set([('rope', build_rope)], F, bounds_fn=rope_bounds)
    # 기존 메타와 병합 (부분 렌더 지원)
    path = os.path.join(C.OUT, CAT + '.json')
    meta = {}
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            meta = json.load(f)
    meta.update(META)
    C.write_meta(CAT, meta)


if __name__ == '__main__':
    main()
