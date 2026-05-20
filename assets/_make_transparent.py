"""One-shot: take logo-concept-nano.png, drop its near-white background to
transparent, recolor the dark mark to the site's deep-navy ink, and save
as logo.png. Run from site/assets/."""
from PIL import Image
from pathlib import Path

SRC = Path(__file__).parent / "logo-concept-nano.png"
OUT = Path(__file__).parent / "logo.png"

BRAND = (10, 26, 61, 255)        # site --deep-navy #0a1a3d
LUM_BG_THRESHOLD = 200           # pixels above this luminance => background
LUM_FG_THRESHOLD = 120           # pixels below this => recolor to brand navy

im = Image.open(SRC).convert("RGBA")
px = im.load()
w, h = im.size

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        # perceptual luminance approximation
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        if lum >= LUM_BG_THRESHOLD:
            # background → fully transparent
            px[x, y] = (0, 0, 0, 0)
        elif lum <= LUM_FG_THRESHOLD:
            # solid dark mark → recolor to site brand navy, keep edge alpha
            px[x, y] = BRAND
        else:
            # antialiased edge → keep darkness, blend alpha by inverse luminance
            alpha = int(max(0, min(255, (255 - lum) * 2)))
            px[x, y] = (BRAND[0], BRAND[1], BRAND[2], alpha)

# Trim transparent margins so the logo sits snug in the layout
bbox = im.getbbox()
if bbox:
    # Add a small breathing margin (4% of longer side) so corners don't kiss text
    pad = max(int(0.04 * max(im.size)), 4)
    l, t, r2, b2 = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r2 = min(w, r2 + pad)
    b2 = min(h, b2 + pad)
    im = im.crop((l, t, r2, b2))

im.save(OUT, "PNG", optimize=True)
print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes, size={im.size})")
