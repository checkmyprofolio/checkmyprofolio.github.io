from pathlib import Path

try:
    from PIL import Image
except Exception as exc:
    raise SystemExit(
        "Pillow (PIL) is required to generate icon.ico. Install with: pip install pillow"
    ) from exc

SRC = Path(r"c:\Coding\LLM\Agent\installer\app\assets\logo.png")
DST = Path(r"c:\Coding\LLM\Agent\installer\build\icon.ico")

if not SRC.exists():
    raise SystemExit(f"Source logo not found: {SRC}")

img = Image.open(SRC).convert("RGBA")
min_size = 256
size = max(max(img.size), min_size)
canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
canvas.paste(img, ((size - img.size[0]) // 2, (size - img.size[1]) // 2))

sizes = [16, 24, 32, 48, 64, 128, 256]

DST.parent.mkdir(parents=True, exist_ok=True)
canvas.save(DST, format="ICO", sizes=[(s, s) for s in sizes])
print(f"[icon] Wrote {DST} ({size}x{size})")
