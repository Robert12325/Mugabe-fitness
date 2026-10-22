"""
Renders the app's icon, splash and in-app mark from the website's "M"
monogram (src/components/brand-mark.tsx), so the app and the site share one
mark. Run from apps/mobile:  python scripts/render-brand-assets.py

Needs Pillow (pip install pillow). The output PNGs are committed, so this
only has to run again if the mark changes.
"""

from pathlib import Path

from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "assets"

BLACK = (5, 5, 5, 255)
# The admin's metallic gold: light, mid, dark along the diagonal.
GOLD = [(0xF8, 0xDF, 0x8A), (0xD4, 0xAF, 0x37), (0x8C, 0x6A, 0x17)]

# The website's path on its 48x48 grid, with its tiny corner arcs taken
# as straight joins (invisible at icon sizes).
OUTLINE = [
    (4, 41), (4, 9.6), (6.6, 8.3), (24, 21.6), (41.4, 8.3), (44, 9.6),
    (44, 41), (35, 41), (35, 25), (25.4, 32.4), (22.6, 32.4), (13, 25), (13, 41),
]
CREASE = [(13, 25), (24, 33.5), (35, 25)]

SUPERSAMPLE = 4


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def gradient(size):
    """A diagonal light -> mid -> dark gold, top-left to bottom-right."""
    img = Image.new("RGBA", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            colour = lerp(GOLD[0], GOLD[1], t * 2) if t < 0.5 else lerp(GOLD[1], GOLD[2], (t - 0.5) * 2)
            px[x, y] = colour + (255,)
    return img


def mark(size, colour=None):
    """The monogram filling `size` square, on transparency."""
    big = size * SUPERSAMPLE
    scale = big / 48

    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).polygon([(x * scale, y * scale) for x, y in OUTLINE], fill=255)

    fill = Image.new("RGBA", (big, big), colour + (255,)) if colour else gradient(big)
    out = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    out.paste(fill, (0, 0), mask)

    if not colour:
        # The darker crease where the two strokes of the M meet.
        crease = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        ImageDraw.Draw(crease).line(
            [(x * scale, y * scale) for x, y in CREASE],
            fill=(0, 0, 0, round(255 * 0.35)),
            width=max(1, round(1.4 * scale)),
            joint="curve",
        )
        out = Image.alpha_composite(out, crease)

    return out.resize((size, size), Image.LANCZOS)


def on_canvas(size, mark_fraction, background=None, colour=None):
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))
    inner = round(size * mark_fraction)
    m = mark(inner, colour)
    offset = (size - inner) // 2
    canvas.alpha_composite(m, (offset, offset))
    return canvas


def save(img, name, opaque=False):
    path = ASSETS / name
    (img.convert("RGB") if opaque else img).save(path, optimize=True)
    print(f"wrote {path.name} {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    ASSETS.mkdir(exist_ok=True)

    # iOS rejects app icons with transparency, so this one is opaque.
    save(on_canvas(1024, 0.62, BLACK), "icon.png", opaque=True)

    # Android adaptive icon: the system masks to a circle or squircle and
    # only guarantees the middle ~61%, so the mark sits well inside it.
    save(on_canvas(1024, 0.44), "android-icon-foreground.png")
    save(Image.new("RGBA", (1024, 1024), BLACK), "android-icon-background.png", opaque=True)
    save(on_canvas(1024, 0.44, colour=(255, 255, 255)), "android-icon-monochrome.png")

    save(on_canvas(1024, 0.5), "splash-icon.png")
    save(on_canvas(48, 0.8, BLACK), "favicon.png", opaque=True)

    # The in-app mark, sharp at 3x for sizes up to ~64pt.
    save(mark(192), "brand-mark.png")
