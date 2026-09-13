# Blender 4.2 compositor Keying → PNG RGBA sequence.
# Usage:
#   blender -b --python scripts/blender-chest-chroma.py -- \
#     assets/ui/festival/fx/chest-open.mp4 /tmp/key-chest
import bpy
import os
import sys

argv = sys.argv[sys.argv.index('--') + 1:]
src, out_dir = argv[0], argv[1]
os.makedirs(out_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.use_nodes = True
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 480
scene.render.resolution_y = 480
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.film_transparent = True
scene.render.use_compositing = True
scene.render.use_sequencer = False
scene.render.fps = 60
scene.render.filepath = os.path.join(out_dir, 'frame_')
scene.view_settings.view_transform = 'Standard'
scene.display_settings.display_device = 'sRGB'

img = bpy.data.images.load(os.path.abspath(src))
img.source = 'MOVIE'
frames = max(1, int(img.frame_duration))
img.reload()

scene.frame_start = 1
scene.frame_end = min(frames, 180)
scene.frame_step = 1

tree = scene.node_tree
tree.nodes.clear()
nt = tree.nodes

image_node = nt.new('CompositorNodeImage')
image_node.image = img
image_node.frame_duration = frames
image_node.frame_start = 1
image_node.frame_offset = 0
image_node.use_auto_refresh = True

key = nt.new('CompositorNodeKeying')
key.inputs['Key Color'].default_value = (1.0, 0.0, 1.0, 1.0)
key.screen_balance = 0.5
key.clip_black = 0.28
key.clip_white = 0.68
key.dilate_distance = -2
key.feather_falloff = 'SMOOTH'
key.feather_distance = 2
key.despill_factor = 1.2
key.despill_balance = 0.5
key.blur_pre = 1
key.blur_post = 1

comp = nt.new('CompositorNodeComposite')
tree.links.new(image_node.outputs['Image'], key.inputs['Image'])
tree.links.new(key.outputs['Image'], comp.inputs['Image'])

bpy.ops.render.render(animation=True)
