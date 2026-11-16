#!/usr/bin/env python3
"""Generate the site icons and the social card into docs/.

Run after changing the mark or palette: python3 tools/make-icons.py
It writes into src/static/, which the build copies into docs/.
The output is committed, so the build and CI do not need Pillow.
"""
import os
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "src", "static")
ART = os.path.join(ROOT, "src", "art")
NAVY_TOP, NAVY_BOT = (12, 30, 46), (5, 16, 13)
CREAM = (239, 231, 212)
AMBER = (255, 200, 97)
DARK = (27, 23, 18)
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def bg(size, radius):
    """Vertical gradient with rounded corners, drawn large then downsampled."""
    s = size * 4
    g = Image.new("RGB", (1, s))
    for y in range(s):
        t = y / (s - 1)
        g.putpixel((0, y), tuple(int(NAVY_TOP[i] + (NAVY_BOT[i] - NAVY_TOP[i]) * t) for i in range(3)))
    img = g.resize((s, s), Image.BILINEAR)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=radius * 4, fill=255)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


def mark(size):
    """A cream tower with an amber lamp on a dark sea; readable down to 16px."""
    k = size / 512
    img = bg(size, int(round(96 * k)))

    def sc(pts):
        return [(x * k, y * k) for x, y in pts]

    beam = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(beam, "RGBA")
    bd.polygon(sc([(256, 176), (-40, 96), (-40, 236)]), fill=AMBER + (70,))
    bd.polygon(sc([(256, 176), (552, 96), (552, 236)]), fill=AMBER + (70,))
    img.alpha_composite(beam.filter(ImageFilter.GaussianBlur(max(1, 6 * k))))

    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse(sc([(96, 452), (416, 500)]), fill=(9, 20, 17, 255))

    tower = sc([(196, 470), (316, 470), (292, 208), (220, 208)])
    d.polygon(tower, fill=CREAM + (255,))

    bandmask = Image.new("L", (size, size), 0)
    bd = ImageDraw.Draw(bandmask)
    for y0, y1 in ((300, 322), (368, 390), (436, 458)):
        bd.polygon(sc([(180, y0), (332, y0), (332, y1), (180, y1)]), fill=255)
    tower_mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(tower_mask).polygon(tower, fill=255)
    bandmask = ImageChops.multiply(bandmask, tower_mask)
    img.paste(DARK + (255,), (0, 0), bandmask)

    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle(sc([(210, 190), (302, 212)]), fill=DARK + (255,))
    d.rectangle(sc([(222, 156), (290, 208)]), fill=(24, 20, 16, 255))
    d.rectangle(sc([(230, 162), (282, 200)]), fill=AMBER + (255,))

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(sc([(196, 130), (316, 250)]), fill=AMBER + (90,))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(max(1, 10 * k))))

    d = ImageDraw.Draw(img, "RGBA")
    d.polygon(sc([(214, 156), (298, 156), (256, 118)]), fill=DARK + (255,))
    d.ellipse(sc([(250, 104), (262, 116)]), fill=AMBER + (255,))
    return img


def social():
    """1200x630 card: the painted beach, a dark scrim and the title."""
    W, H = 1200, 630
    plate = Image.open(os.path.join(ART, "beach.webp")).convert("RGB")
    pr = plate.size[0] / plate.size[1]
    if pr > W / H:
        nh, nw = H, int(H * pr)
    else:
        nw, nh = W, int(W / pr)
    plate = plate.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - W) // 2, (nh - H) // 2
    plate = plate.crop((left, top, left + W, top + H))
    scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for y in range(H):
        t = max(0.0, (y - H * 0.30) / (H * 0.70))
        sd.line([(0, y), (W, y)], fill=(4, 12, 10, int(232 * t ** 1.4)))
    img = Image.alpha_composite(plate.convert("RGBA"), scrim)
    d = ImageDraw.Draw(img)
    d.rectangle([64, 372, 152, 380], fill=AMBER)
    d.text((64, 400), "Lighthouse Hunter", font=ImageFont.truetype(BOLD, 96), fill=CREAM)
    d.text((66, 512), "A storm-wrecked island. Find the rope, the lantern, the light.",
           font=ImageFont.truetype(REG, 34), fill=(226, 214, 188))
    return img.convert("RGB")


if __name__ == "__main__":
    mark(512).save(os.path.join(DOCS, "icon-512.png"))
    mark(192).save(os.path.join(DOCS, "icon-192.png"))
    mark(180).convert("RGB").save(os.path.join(DOCS, "apple-touch-icon.png"))
    mark(64).save(os.path.join(DOCS, "favicon.png"))
    social().save(os.path.join(DOCS, "og.jpg"), quality=86, optimize=True, progressive=True)
    print("wrote icons and og.png")
