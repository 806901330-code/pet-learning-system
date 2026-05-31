"""生成宝可梦精灵球图标 (.ico + .png)"""
from PIL import Image, ImageDraw
import math, os

SIZE = 256
OUT_DIR = 'public'

def draw_pokeball(size, filename):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    r = size // 2 - 4

    # 精灵球主体：上半红下半白
    # 红色上半球
    draw.pieslice([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=(238, 47, 56))
    # 白色下半球
    draw.pieslice([cx - r, cy - r, cx + r, cy + r], 0, 180, fill=(255, 255, 255))

    # 黑色边框大圆
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(48, 48, 48), width=6)

    # 中间横条
    bar_h = size // 16
    draw.rectangle([cx - r - 2, cy - bar_h // 2, cx + r + 2, cy + bar_h // 2], fill=(48, 48, 48))

    # 中间白色按钮圆
    btn_r = size // 6
    draw.ellipse([cx - btn_r, cy - btn_r, cx + btn_r, cy + btn_r],
                 fill=(255, 255, 255), outline=(48, 48, 48), width=4)

    # 按钮中心小圆
    inner_r = btn_r // 2
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
                 fill=(220, 220, 220), outline=(160, 160, 160), width=2)

    img.save(filename)
    print(f'✅ {filename} ({size}x{size})')

os.makedirs(OUT_DIR, exist_ok=True)

draw_pokeball(256, os.path.join(OUT_DIR, 'icon.png'))
draw_pokeball(32, os.path.join(OUT_DIR, 'icon_small.png'))
