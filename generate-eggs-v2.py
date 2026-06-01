"""
基于真实蛋图片，按宝可梦属性着色，生成各属性蛋。
向量化版本，速度快。
"""
from PIL import Image
import numpy as np
import os

# ── 12种属性目标颜色 ──
EGG_TYPES = {
    'grass':    {'color': (120, 200, 80),   'name': '草'},
    'fire':     {'color': (255, 140, 50),   'name': '火'},
    'water':    {'color': (70, 160, 240),   'name': '水'},
    'bug':      {'color': (160, 200, 60),   'name': '虫'},
    'flying':   {'color': (180, 140, 220),  'name': '飞'},
    'normal':   {'color': (200, 190, 170),  'name': '普'},
    'electric': {'color': (255, 220, 60),   'name': '电'},
    'ice':      {'color': (150, 220, 240),  'name': '冰'},
    'fighting': {'color': (200, 80, 60),    'name': '斗'},
    'ghost':    {'color': (140, 100, 180),  'name': '鬼'},
    'rock':     {'color': (190, 160, 130),  'name': '岩'},
    'dragon':   {'color': (120, 100, 210),  'name': '龙'},
}

SOURCE = '/Users/tzf/Downloads/鸡蛋(egg)_爱给网_aigei_com.png'
OUTPUT_SIZE = 200
OUT_DIRS = ['public/pokemon', 'dist/pokemon', 'docs/pokemon']


def rgb_to_hsl_vectorized(rgb):
    """向量化 RGB[0-255] → HSL, H[0-360], S[0-1], L[0-1]"""
    r, g, b = rgb[..., 0] / 255.0, rgb[..., 1] / 255.0, rgb[..., 2] / 255.0
    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin

    L = (cmax + cmin) / 2.0
    S = np.zeros_like(L)
    mask = delta > 1e-10
    S[mask] = delta[mask] / (1 - np.abs(2 * L[mask] - 1))

    H = np.zeros_like(L)
    # R is max
    mask_r = mask & (cmax == r)
    H[mask_r] = 60 * (((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6)
    # G is max
    mask_g = mask & (cmax == g) & ~mask_r
    H[mask_g] = 60 * (((b[mask_g] - r[mask_g]) / delta[mask_g]) + 2)
    # B is max
    mask_b = mask & (cmax == b) & ~mask_r & ~mask_g
    H[mask_b] = 60 * (((r[mask_b] - g[mask_b]) / delta[mask_b]) + 4)

    return H, S, L


def hsl_to_rgb_vectorized(H, S, L):
    """向量化 HSL → RGB[0-255]"""
    C = (1 - np.abs(2 * L - 1)) * S
    X = C * (1 - np.abs((H / 60) % 2 - 1))
    m = L - C / 2

    R = np.zeros_like(H)
    G = np.zeros_like(H)
    B = np.zeros_like(H)

    # 0-60
    mask = (H < 60)
    R[mask], G[mask], B[mask] = C[mask], X[mask], 0
    # 60-120
    mask = (H >= 60) & (H < 120)
    R[mask], G[mask], B[mask] = X[mask], C[mask], 0
    # 120-180
    mask = (H >= 120) & (H < 180)
    R[mask], G[mask], B[mask] = 0, C[mask], X[mask]
    # 180-240
    mask = (H >= 180) & (H < 240)
    R[mask], G[mask], B[mask] = 0, X[mask], C[mask]
    # 240-300
    mask = (H >= 240) & (H < 300)
    R[mask], G[mask], B[mask] = X[mask], 0, C[mask]
    # 300-360
    mask = (H >= 300) & (H < 360)
    R[mask], G[mask], B[mask] = C[mask], 0, X[mask]

    R = np.round((R + m) * 255)
    G = np.round((G + m) * 255)
    B = np.round((B + m) * 255)

    return np.stack([R, G, B], axis=-1).clip(0, 255).astype(np.uint8)


def colorize_egg(source_img, target_rgb, strength=0.80):
    """
    向量化颜色替换：将蛋色转向目标色，保持明暗纹理。
    """
    arr = np.array(source_img).astype(np.float64)
    A = arr[:, :, 3]
    mask = A > 10  # 非透明像素

    # 转HSL
    H, S, L = rgb_to_hsl_vectorized(arr[:, :, :3])
    # 计算目标HSL
    tr, tg, tb = target_rgb[0] / 255.0, target_rgb[1] / 255.0, target_rgb[2] / 255.0
    t_cmax = max(tr, tg, tb)
    t_cmin = min(tr, tg, tb)
    t_delta = t_cmax - t_cmin
    t_L = (t_cmax + t_cmin) / 2
    if t_delta < 1e-10:
        t_H, t_S = 0, 0
    else:
        t_S = t_delta / (1 - abs(2 * t_L - 1))
        if t_cmax == tr:
            t_H = 60 * (((tg - tb) / t_delta) % 6)
        elif t_cmax == tg:
            t_H = 60 * (((tb - tr) / t_delta) + 2)
        else:
            t_H = 60 * (((tr - tg) / t_delta) + 4)

    # 仅对非透明像素应用
    H_new = H.copy()
    S_new = S.copy()

    # 色相：向目标色相偏移
    h_diff = (t_H - H[mask] + 180) % 360 - 180  # 最短路径差值
    H_new[mask] = (H[mask] + h_diff * strength) % 360

    # 饱和度：向目标饱和偏移，但高光区域（L很高）保持低饱和
    sat_factor = (1 - np.abs(L[mask] - 0.92))  # 高光处减弱饱和度变化
    s_diff = t_S - S[mask]
    S_new[mask] = np.clip(S[mask] + s_diff * strength * sat_factor, 0, 1)

    # 转换回RGB
    rgb_new = hsl_to_rgb_vectorized(H_new, S_new, L)

    result = np.zeros_like(arr, dtype=np.uint8)
    result[:, :, :3] = rgb_new
    result[:, :, 3] = arr[:, :, 3].astype(np.uint8)

    return Image.fromarray(result, 'RGBA')


def main():
    source = Image.open(SOURCE).convert('RGBA')
    print(f'原始尺寸: {source.size}')

    # 缩放蛋高约185px，保持比例
    target_h = 185
    ratio = target_h / source.height
    new_w = int(source.width * ratio)
    source = source.resize((new_w, target_h), Image.LANCZOS)
    print(f'缩放后: {source.size}')

    Canvas = OUTPUT_SIZE

    for d in OUT_DIRS:
        os.makedirs(d, exist_ok=True)

    canvas_offset_x = (Canvas - new_w) // 2
    canvas_offset_y = (Canvas - target_h) // 2

    for type_id, info in EGG_TYPES.items():
        colored = colorize_egg(source, info['color'])

        canvas = Image.new('RGBA', (Canvas, Canvas), (0, 0, 0, 0))
        canvas.paste(colored, (canvas_offset_x, canvas_offset_y), colored)

        for out_dir in OUT_DIRS:
            fname = os.path.join(out_dir, f'egg_{type_id}.png')
            canvas.save(fname, 'PNG')
        print(f'✅ egg_{type_id}.png - {info["name"]}')

    # default
    default_canvas = Image.new('RGBA', (Canvas, Canvas), (0, 0, 0, 0))
    default_canvas.paste(source, (canvas_offset_x, canvas_offset_y), source)
    for out_dir in OUT_DIRS:
        default_canvas.save(os.path.join(out_dir, 'egg_default.png'), 'PNG')
    print('✅ egg_default.png')

    print(f'\n🎉 共生成 {len(EGG_TYPES) + 1} 张蛋图！')


if __name__ == '__main__':
    main()
