from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

root = Path(r"c:\Coding\LLM\Agent\desktop_frontend")
build_dir = root / "build"

wallpaper_candidates = [
    Path(r"c:\Coding\LLM\Agent\installer\app\assets\wallpaper.jpg"),
    root / "build" / "installer-page.bmp",
]

wallpaper_path = next((p for p in wallpaper_candidates if p.exists()), None)
if wallpaper_path is None:
    raise SystemExit("No wallpaper source found for NSIS theme.")

base = Image.open(wallpaper_path).convert("RGB")

def make(size):
    img = ImageOps.fit(base, size, method=Image.LANCZOS, centering=(0.5, 0.5))
    img = img.filter(ImageFilter.GaussianBlur(2))
    overlay = Image.new("RGB", size, (255, 255, 255))
    img = Image.blend(img, overlay, 0.12)
    return img

build_dir.mkdir(parents=True, exist_ok=True)

header = make((150, 57))
header.save(build_dir / "installer-header.bmp", format="BMP")

sidebar = make((164, 314))
sidebar.save(build_dir / "installer-welcome.bmp", format="BMP")

page = make((640, 360))
page.save(build_dir / "installer-page.bmp", format="BMP")

print("[nsis-theme] Updated installer-header.bmp, installer-welcome.bmp, and installer-page.bmp")
