"""生成宝可梦属性蛋 PNG 图片"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

# 12种属性对应的颜色和符号
EGG_TYPES = {
    'grass':    {'color': (120, 200, 80),   'dark': (40, 120, 20),   'symbol': '🌿', 'name': '草'},
    'fire':     {'color': (255, 140, 50),   'dark': (200, 60, 0),    'symbol': '🔥', 'name': '火'},
    'water':    {'color': (70, 160, 240),   'dark': (20, 80, 180),   'symbol': '💧', 'name': '水'},
    'bug':      {'color': (160, 200, 60),   'dark': (80, 120, 20),   'symbol': '🐛', 'name': '虫'},
    'flying':   {'color': (180, 140, 220),  'dark': (100, 60, 150),  'symbol': '🕊️', 'name': '飞'},
    'normal':   {'color': (200, 190, 170),  'dark': (140, 120, 100), 'symbol': '⭐', 'name': '普'},
    'electric': {'color': (255, 220, 60),   'dark': (200, 160, 0),   'symbol': '⚡', 'name': '电'},
    'ice':      {'color': (150, 220, 240),  'dark': (60, 140, 180),  'symbol': '❄️', 'name': '冰'},
    'fighting': {'color': (200, 80, 60),    'dark': (130, 40, 20),   'symbol': '🥊', 'name': '斗'},
    'ghost':    {'color': (140, 100, 180),  'dark': (70, 30, 110),   'symbol': '👻', 'name': '鬼'},
    'rock':     {'color': (190, 160, 130),  'dark': (120, 90, 60),   'symbol': '🪨', 'name': '岩'},
    'dragon':   {'color': (120, 100, 210),  'dark': (50, 30, 140),   'symbol': '🐉', 'name': '龙'},
}

SIZE = 200
OUT_DIR = 'public/pokemon'

os.makedirs(OUT_DIR, exist_ok=True)


def draw_egg(draw, cx, cy, rx, ry, color, dark_color):
    """绘制蛋形椭圆"""
    # 主体蛋形
    draw.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=color,
        outline=dark_color,
        width=3
    )

    # 顶部高光
    for i in range(5):
        hy = cy - ry * 0.55 + i * ry * 0.04
        alpha = int(80 - i * 15)
        h_color = (*[min(255, c + 60) for c in color],)
        draw.ellipse(
            [cx - rx * 0.28, hy, cx + rx * 0.28, hy + ry * 0.12],
            fill=h_color
        )

    # 底部阴影渐暗
    for i in range(3):
        sy = cy + ry * 0.45 + i * ry * 0.08
        shadow = (*[max(0, c - 30 - i * 20) for c in color],)
        draw.ellipse(
            [cx - rx * 0.5, sy, cx + rx * 0.5, sy + ry * 0.15],
            fill=shadow
        )

    # 斑纹斑点
    spots = [
        (cx - rx * 0.45, cy - ry * 0.25, 8),
        (cx + rx * 0.35, cy - ry * 0.15, 6),
        (cx - rx * 0.3, cy + ry * 0.2, 7),
        (cx + rx * 0.4, cy + ry * 0.3, 5),
        (cx - rx * 0.15, cy - ry * 0.45, 5),
        (cx + rx * 0.1, cy + ry * 0.5, 6),
    ]
    for sx, sy, r in spots:
        s_color = (*[max(0, c - 50) for c in color],)
        draw.ellipse([sx - r, sy - r, sx + r, sy + r], fill=s_color)

    # 中心大斑点（蛋的花纹）
    center_spot_color = (*[max(0, c - 30) for c in color],)
    draw.ellipse(
        [cx - rx * 0.2, cy - ry * 0.1, cx + rx * 0.2, cy + ry * 0.15],
        fill=center_spot_color
    )


for type_id, info in EGG_TYPES.items():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = SIZE // 2, SIZE // 2
    rx, ry = 68, 88  # 蛋形宽高

    # 底部阴影投影
    shadow_ellipse = [(cx - rx - 4, cy + ry - 6, cx + rx + 4, cy + ry + 6)]
    for sx0, sy0, sx1, sy1 in shadow_ellipse:
        draw.ellipse([sx0, sy0, sx1, sy1], fill=(0, 0, 0, 40))

    # 绘制蛋
    draw_egg(draw, cx, cy, rx, ry, info['color'], info['dark'])

    # 底部裂纹效果
    for i in range(3):
        lx = cx - rx * 0.3 + i * 30
        draw.line(
            [(lx, cy + ry * 0.4), (lx + 12, cy + ry * 0.55)],
            fill=info['dark'], width=1
        )

    # 顶部小裂纹（孵化迹象）
    crack_start_x = cx - 5
    draw.line(
        [(crack_start_x, cy - ry * 0.85), (crack_start_x + 8, cy - ry * 0.7)],
        fill=info['dark'], width=1
    )
    draw.line(
        [(crack_start_x + 1, cy - ry * 0.85), (crack_start_x - 5, cy - ry * 0.72)],
        fill=info['dark'], width=1
    )

    # 类型名称标签（底部文字）
    label = info['name']
    try:
        font = ImageFont.truetype('/System/Library/Fonts/PingFang.ttc', 24)
    except Exception:
        font = ImageFont.load_default()

    # 文字阴影
    try:
        bbox = draw.textbbox((0, 0), label, font=font)
    except Exception:
        bbox = (0, 0, 40, 28)
    tw = bbox[2] - bbox[0]
    tx = cx - tw // 2
    ty = cy + ry + 4

    # 半透明背景条
    draw.rounded_rectangle(
        [tx - 8, ty, tx + tw + 9, ty + 28],
        radius=10,
        fill=(*info['dark'], 200)
    )
    draw.text((tx + 1, ty + 1), label, fill=info['color'], font=font)

    # 保存
    out_path = os.path.join(OUT_DIR, f'egg_{type_id}.png')
    img.save(out_path, 'PNG')
    print(f'✅ {out_path}')

# 额外：生成 egg_default.png 作为兜底
img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)
cx, cy = SIZE // 2, SIZE // 2
draw_egg(draw, cx, cy, 68, 88, (220, 210, 190), (160, 140, 100))
try:
    fnt = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 28)
except Exception:
    fnt = ImageFont.load_default()
draw.text((cx - 10, cy + 95), '?', fill=(160, 140, 100), font=fnt)
img.save(os.path.join(OUT_DIR, 'egg_default.png'), 'PNG')
print(f'✅ egg_default.png')

print(f'\n🎉 共生成 {len(EGG_TYPES) + 1} 个蛋图片!')
