#!/usr/bin/env python3
"""Recompress fundo_*.png in place to ≤500KB, keeping .png filenames."""
from __future__ import annotations

import io
import sys
from pathlib import Path

TARGET = 512_000
MAX_W = 1920

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow missing", file=sys.stderr)
    sys.exit(1)

IMG_DIR = Path("/app/netsys-apps/cac/apps/www/public/images")
files = sorted(IMG_DIR.glob("fundo_*.png"))
if not files:
    print(f"No files in {IMG_DIR}", file=sys.stderr)
    sys.exit(1)

print("BEFORE:")
for p in files:
    print(f"  {p.name}: {p.stat().st_size} bytes")


def encode_png(img: Image.Image, colors: int | None) -> bytes:
    buf = io.BytesIO()
    if colors is not None:
        # Adaptive palette PNG for size; photos still OK as hero backgrounds
        q = img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
        q.save(buf, format="PNG", optimize=True)
    else:
        img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


results = []
for src in files:
    before = src.stat().st_size
    img = Image.open(src).convert("RGB")
    w, h = img.size
    if w > MAX_W:
        nh = int(h * MAX_W / w)
        img = img.resize((MAX_W, nh), Image.Resampling.LANCZOS)
        print(f"  resized {src.name}: {w}x{h} -> {MAX_W}x{nh}")

    # Try full RGB PNG first after resize, then palette depths, then further downscale
    data = None
    label = None
    for colors in (None, 256, 192, 128, 96, 64):
        candidate = encode_png(img, colors)
        print(f"  try {src.name} colors={colors}: {len(candidate)} bytes")
        if len(candidate) <= TARGET:
            data = candidate
            label = f"colors={colors}"
            break

    if data is None:
        scale = 0.9
        cur = img
        while scale >= 0.45:
            nw = max(1, int(img.size[0] * scale))
            nh = max(1, int(img.size[1] * scale))
            cur = img.resize((nw, nh), Image.Resampling.LANCZOS)
            for colors in (256, 128, 64):
                candidate = encode_png(cur, colors)
                print(f"  try {src.name} {nw}x{nh} colors={colors}: {len(candidate)} bytes")
                if len(candidate) <= TARGET:
                    data = candidate
                    label = f"{nw}x{nh} colors={colors}"
                    break
            if data is not None:
                break
            scale -= 0.1

    if data is None:
        print(f"ERROR: could not compress {src.name} under {TARGET}", file=sys.stderr)
        sys.exit(2)

    tmp = src.with_suffix(".png.tmp")
    tmp.write_bytes(data)
    tmp.replace(src)
    after = src.stat().st_size
    results.append((src.name, before, after, label))
    print(f"  wrote {src.name}: {before} -> {after} ({label})")

print("\nAFTER:")
for name, before, after, label in results:
    print(f"  {name}: {before} -> {after} ({label})")
print("DONE")
