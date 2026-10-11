"""Original board and engraved face textures; no font file is redistributed."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1] / 'Assets' / 'Art'
root.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf', 150)
blue = ['', '楚', '士', '象', '馬', '車', '包', '卒']
red = ['', '漢', '士', '象', '馬', '車', '包', '兵']
for team, labels, base, ink in [('Blue', blue, '#d8e0e2', '#1c3846'), ('Red', red, '#d9b980', '#643d30')]:
    for kind in range(1, 8):
        image = Image.new('RGB', (256, 256), base)
        draw = ImageDraw.Draw(image)
        draw.regular_polygon((128, 128, 118), n_sides=8, rotation=22.5, outline=ink, width=3)
        draw.regular_polygon((128, 128, 111), n_sides=8, rotation=22.5, outline=ink, width=1)
        draw.text((128, 119), labels[kind], font=font, anchor='mm', fill=ink, stroke_width=1)
        image.save(root / f'{team}{kind}.png')

image = Image.new('RGB', (1800, 2048), '#17222c')
draw = ImageDraw.Draw(image)
# Fine brushed metal; deliberately no random state or external assets.
for y in range(2048):
    c = 218 + (y * 17 % 4)
    draw.line((0, y, 1800, y), fill=(c + 12, c + 5, c - 13))
def point(x, z):
    return ((x + 4.6) / 9.2 * 1800, (z + 5.1) / 10.2 * 2048)
def line(a, b, width=3, color='#888572'):
    draw.line((*point(*a), *point(*b)), fill=color, width=width)
# Faction motifs belong to the physical board, with a quiet playing grid.
for z, tint, accent in [(-4.5, '#cadbd5', '#4d8583'), (2.5, '#e7cebf', '#a66860')]:
    draw.rectangle((*point(-1, z), *point(1, z + 2)), fill=tint)
    for x in [-1.15, 1.15]:
        line((x, z + .15), (x, z + 1.85), 2, accent)
    for edge in [z + .15, z + 1.85]:
        line((-1.15, edge), (-.8, edge), 3, accent)
        line((.8, edge), (1.15, edge), 3, accent)
for x in [-4.23, 4.23]:
    for z, accent in [(-4.73, '#85b5b7'), (4.73, '#b58988')]:
        # Small inlaid diamond and fans at the outer corners, away from cells.
        d = .075
        draw.polygon([point(x, z-d), point(x+d, z), point(x, z+d), point(x-d, z)], fill=accent)
        sx, sz = (-1 if x > 0 else 1), (-1 if z > 0 else 1)
        for n in range(1, 4):
            line((x+sx*.13, z+sz*n*.05), (x+sx*(.13+n*.07), z+sz*n*.05), 2, accent)
for x in range(-4, 5): line((x, -4.5), (x, 4.5))
for row in range(10): line((-4, row - 4.5), (4, row - 4.5))
for z in [-4.5, 2.5]:
    line((-1, z), (1, z + 2)); line((1, z), (-1, z + 2))
for x in [-4.38, 4.38]: line((x, -4.9), (x, 4.9), 4, '#ac9364')
for z in [-4.9, 4.9]: line((-4.38, z), (4.38, z), 4, '#ac9364')
for row in [2, 3, 6, 7]:
    for col in ([1, 7] if row in [2, 7] else [0, 2, 4, 6, 8]):
        x, z = col - 4, row - 4.5
        for sx in [-1, 1]:
            for sz in [-1, 1]:
                if -4 <= x + sx * .12 <= 4:
                    line((x + sx * .08, z + sz * .17), (x + sx * .08, z + sz * .08), 2)
                    line((x + sx * .08, z + sz * .08), (x + sx * .17, z + sz * .08), 2)
image.save(root / 'BoardMetal.png')
assert all((root / f'{team}{kind}.png').is_file() for team in ['Blue', 'Red'] for kind in range(1, 8))
print('PASS: original metal board and 14 Hanja face textures')
