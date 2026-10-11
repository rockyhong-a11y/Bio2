"""Blender(bpy) 공통 렌더 유틸 — 3/4 탑뷰 정사영 스프라이트.

좌표 규약
- 1 Blender unit = 1 타일. 게임 좌표 (gx, gy)는 Blender (x=gx, y=-gy). gy는 화면 아래(남쪽)로 증가.
- 카메라: 정사영, 북쪽(+Y)을 향해 고도각 ELEV 로 내려다봄.
  바닥의 1타일 깊이가 화면에서 0.75타일(32px 기준 24px)로 보이도록 sin(ELEV)=0.75.
- 화면 투영(타일 단위, 아래가 +): sx = X,  sy = -Y*SIN_E - Z*COS_E
- 렌더 해상도: PX 픽셀 / 타일 (기본 64 = 게임 논리 32px의 2배)

render_sprite()는 대상 오브젝트들의 투영 경계상자를 계산해 카메라를 맞추고,
앵커(월드 좌표 한 점)가 정수 픽셀에 오도록 스냅한 뒤 PNG와 메타데이터 {w,h,ax,ay}를 돌려준다.
게임은 앵커의 화면 위치에서 (ax, ay)를 빼서 그린다.
"""
import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector

SIN_E = 0.75
COS_E = math.sqrt(1 - SIN_E ** 2)  # 0.6614
ELEV = math.asin(SIN_E)
PX = 64
WALL_H = 1.0 / COS_E  # 정면 높이가 화면에서 정확히 1타일(64px)이 되는 벽 높이 ≈ 1.512

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'sprites')


def project(p):
    return p[0], -p[1] * SIN_E - p[2] * COS_E


def reset_scene(samples=48):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 4
    sc.render.film_transparent = True
    sc.render.filter_size = 1.0
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.render.resolution_percentage = 100

    world = bpy.data.worlds.new('world')
    sc.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.55, 0.57, 0.62, 1)
    bg.inputs['Strength'].default_value = 0.55

    # 키 라이트: 왼쪽 위 앞쪽에서, 필 라이트: 오른쪽 뒤
    key = bpy.data.lights.new('key', 'SUN'); key.energy = 3.2; key.angle = math.radians(12)
    ko = bpy.data.objects.new('key', key); sc.collection.objects.link(ko)
    ko.rotation_euler = (math.radians(38), math.radians(-28), math.radians(-20))
    fill = bpy.data.lights.new('fill', 'SUN'); fill.energy = 0.9
    fo = bpy.data.objects.new('fill', fill); sc.collection.objects.link(fo)
    fo.rotation_euler = (math.radians(-50), math.radians(30), 0)

    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_euler = (math.pi / 2 - ELEV, 0, 0)
    return sc


_mat_cache = {}


def mat(name, color, rough=0.7, metal=0.0, emit=None, emit_strength=1.0, alpha=1.0):
    """색은 sRGB 16진수 '#rrggbb' 또는 (r,g,b) 선형값."""
    key = (name, str(color), rough, metal, str(emit), emit_strength, alpha)
    if key in _mat_cache:
        return _mat_cache[key]
    if isinstance(color, str):
        color = hex_to_linear(color)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit is not None:
        if isinstance(emit, str):
            emit = hex_to_linear(emit)
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_strength
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    _mat_cache[key] = m
    return m


def hex_to_linear(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def _link(obj, material=None, parent=None):
    bpy.context.scene.collection.objects.link(obj)
    if material is not None:
        obj.data.materials.append(material)
    if parent is not None:
        obj.parent = parent
    return obj


def box(name, size, loc, material=None, bevel=0.0, parent=None, rot=(0, 0, 0)):
    """size=(sx,sy,sz), loc=박스 중심(Blender 좌표)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=2, affect='EDGES')
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = bevel > 0
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.rotation_euler = rot
    return _link(o, material, parent)


def cyl(name, r, depth, loc, material=None, verts=24, parent=None, rot=(0, 0, 0), r2=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.rotation_euler = rot
    return _link(o, material, parent)


def sphere(name, r, loc, material=None, scale=(1, 1, 1), parent=None, segs=24, rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs // 2, radius=r)
    bm.to_mesh(me); bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.scale = scale
    o.rotation_euler = rot
    return _link(o, material, parent)


def empty(name, loc=(0, 0, 0), parent=None):
    o = bpy.data.objects.new(name, None)
    o.location = loc
    return _link(o, None, parent)


def clear_meshes():
    for o in list(bpy.context.scene.objects):
        if o.type in ('MESH', 'EMPTY', 'CURVE') or (o.type == 'LIGHT' and o.name not in ('key', 'fill')):
            bpy.data.objects.remove(o, do_unlink=True)


def _world_verts(objs):
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in objs:
        if o.type != 'MESH':
            continue
        oe = o.evaluated_get(dg)
        me = oe.to_mesh()
        mw = oe.matrix_world
        pts.extend(mw @ v.co for v in me.vertices)
        oe.to_mesh_clear()
    return pts


def render_sprite(name, anchor=(0, 0, 0), objs=None, pad=2, bounds=None):
    """현재 씬의 메시(또는 objs)를 렌더해 OUT/name.png 저장. 반환: 메타데이터 dict.

    bounds: 고정 경계 (sx0, sy0, sx1, sy1) 타일 단위 — 애니메이션 프레임끼리 크기를 맞출 때 사용.
    """
    sc = bpy.context.scene
    bpy.context.view_layer.update()
    if objs is None:
        objs = [o for o in sc.objects if o.type == 'MESH' and not o.hide_render]
    ax_s, ay_s = project(anchor)
    if bounds is None:
        pts = [project(p) for p in _world_verts(objs)]
        x0 = min(p[0] for p in pts); x1 = max(p[0] for p in pts)
        y0 = min(p[1] for p in pts); y1 = max(p[1] for p in pts)
    else:
        x0, y0, x1, y1 = bounds
    # 앵커 기준 픽셀 정렬
    left = math.floor((x0 - ax_s) * PX) - pad
    right = math.ceil((x1 - ax_s) * PX) + pad
    top = math.floor((y0 - ay_s) * PX) - pad
    bottom = math.ceil((y1 - ay_s) * PX) + pad
    w, h = right - left, bottom - top
    sc.render.resolution_x = w
    sc.render.resolution_y = h
    cam = sc.camera
    cam.data.ortho_scale = max(w, h) / PX
    cx = ax_s + (left + right) / 2 / PX
    cy_down = ay_s + (top + bottom) / 2 / PX
    r = Vector((1, 0, 0))
    u = Vector((0, SIN_E, COS_E))
    d = Vector((0, COS_E, -SIN_E))
    cam.location = r * cx + u * (-cy_down) - d * 60
    cam.data.clip_end = 200
    os.makedirs(os.path.dirname(os.path.join(OUT, name)), exist_ok=True)
    sc.render.filepath = os.path.join(OUT, name + '.png')
    bpy.ops.render.render(write_still=True)
    return {'file': name + '.png', 'w': w, 'h': h, 'ax': -left, 'ay': -top}


def write_meta(category, meta):
    path = os.path.join(OUT, category + '.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    print('wrote', path, len(meta), 'sprites')


def only(argv_names):
    """`python script.py -- name1 name2` 로 일부만 렌더."""
    if '--' in sys.argv:
        return set(sys.argv[sys.argv.index('--') + 1:])
    return None
