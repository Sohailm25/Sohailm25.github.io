"""ABOUTME: Generates the three mahaclinic PWA icons from Instrument Serif 'Rx'.
ABOUTME: Run once; commit the PNGs."""

from PIL import Image, ImageDraw, ImageFont
import pathlib

OUT = pathlib.Path("content/extra/mahaclinic/icons")
OUT.mkdir(exist_ok=True, parents=True)

PAPER = (250, 245, 233)   # #faf5e9
MOSS = (58, 79, 42)        # #3A4F2A

CANDIDATES = [
    "/Library/Fonts/Instrument Serif Italic.ttf",
    "/Library/Fonts/Instrument Serif-Italic.ttf",
    "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf",
    "/System/Library/Fonts/NewYork.ttf",
    "/System/Library/Fonts/Times.ttc",
]

FONT_PATH = None
for cand in CANDIDATES:
    if pathlib.Path(cand).exists():
        FONT_PATH = cand
        break
if not FONT_PATH:
    raise SystemExit("No suitable italic serif font found. Install Instrument Serif or fall back to Times.")
print(f"Using font: {FONT_PATH}")


def make_icon(size: int, out_path: pathlib.Path, padded: bool = False):
    img = Image.new("RGB", (size, size), PAPER)
    draw = ImageDraw.Draw(img)
    glyph_size = int(size * (0.45 if padded else 0.7))
    font = ImageFont.truetype(FONT_PATH, glyph_size)
    bbox = draw.textbbox((0, 0), "Rx", font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text(
        ((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]),
        "Rx", fill=MOSS, font=font,
    )
    img.save(out_path, "PNG")
    print(f"Wrote {out_path}")


make_icon(192, OUT / "icon-192.png")
make_icon(512, OUT / "icon-512.png", padded=True)
make_icon(180, OUT / "apple-touch-icon.png")
