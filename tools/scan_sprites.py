#!/usr/bin/env python3
"""Projeto Akai - inventory scanner for sprites/.

Reads image headers with the Python stdlib only (no Pillow available in this
environment): PNG IHDR, GIF logical screen descriptor, and generic file
metadata for the vector/source formats (AI/EPS/PSD/SCML/Aseprite).

Output: tools/out/sprite_inventory.json  (machine readable)
        stdout summary table

Non destructive: it never writes inside sprites/.
"""
import hashlib
import json
import os
import struct
import sys
from collections import Counter, defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPRITES = os.path.join(ROOT, "sprites")
OUT_DIR = os.path.join(ROOT, "tools", "out")

PNG_SIG = b"\x89PNG\r\n\x1a\n"
GIF_SIG = b"GIF8"
PSD_SIG = b"8BPS"


def read_png(fh):
    head = fh.read(8)
    if head != PNG_SIG:
        return None
    chunk = fh.read(8)
    if len(chunk) < 8:
        return None
    (length,) = struct.unpack(">I", chunk[:4])
    ctype = chunk[4:8]
    if ctype != b"IHDR" or length != 13:
        return None
    data = fh.read(13)
    w, h, bit_depth, color_type, compression, filt, interlace = struct.unpack(
        ">IIBBBBB", data
    )
    color_names = {0: "grayscale", 2: "rgb", 3: "indexed", 4: "gray+alpha", 6: "rgba"}
    return {
        "w": w,
        "h": h,
        "bitDepth": bit_depth,
        "colorType": color_names.get(color_type, str(color_type)),
        "alpha": color_type in (4, 6),
        "interlaced": bool(interlace),
    }


def read_gif(fh):
    head = fh.read(13)
    if head[:4] != GIF_SIG:
        return None
    w, h = struct.unpack("<HH", head[6:10])
    return {"w": w, "h": h, "bitDepth": 8, "colorType": "indexed", "alpha": True}


def read_psd_size(path):
    """PSD header: '8BPS', version, 6 reserved, channels, height, width, depth, mode."""
    with open(path, "rb") as fh:
        head = fh.read(26)
    if head[:4] != PSD_SIG:
        return None
    version, channels, height, width, depth, mode = struct.unpack(
        ">H6sHIIHH", head[4:26]
    )
    mode_names = {0: "bitmap", 1: "grayscale", 2: "indexed", 3: "rgb", 4: "cmyk",
                  7: "multichannel", 8: "duotone", 9: "lab"}
    return {
        "w": width,
        "h": height,
        "bitDepth": depth,
        "colorType": mode_names.get(mode, str(mode)),
        "alpha": channels == 4,
        "channels": channels,
        "psdVersion": version,
    }


def sha1(path, cap=None):
    h = hashlib.sha1()
    with open(path, "rb") as fh:
        while True:
            block = fh.read(1 << 20)
            if not block:
                break
            h.update(block)
    return h.hexdigest()


def main():
    entries = []
    hashes = {}
    for dirpath, dirnames, filenames in os.walk(SPRITES):
        dirnames.sort()
        for name in sorted(filenames):
            if name == ".DS_Store":
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, ROOT)
            ext = os.path.splitext(name)[1].lower().lstrip(".")
            try:
                size = os.path.getsize(full)
            except OSError as exc:
                entries.append({"path": rel, "error": str(exc)})
                continue
            info = None
            try:
                if ext == "png":
                    with open(full, "rb") as fh:
                        info = read_png(fh)
                elif ext == "gif":
                    with open(full, "rb") as fh:
                        info = read_gif(fh)
                elif ext == "psd":
                    info = read_psd_size(full)
            except Exception as exc:  # noqa: BLE001 - inventory must be resilient
                info = {"parseError": str(exc)}
            entry = {"path": rel, "ext": ext, "bytes": size}
            if info:
                entry.update(info)
            # Hash only raster assets that are plausible game candidates (<25 MB).
            if ext in ("png", "gif") and size < 25 * 1024 * 1024:
                digest = sha1(full)
                entry["sha1"] = digest
                hashes.setdefault(digest, []).append(rel)
            entries.append(entry)
    dupes = {k: v for k, v in hashes.items() if len(v) > 1}
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "sprite_inventory.json"), "w") as fh:
        json.dump({"root": "sprites/", "count": len(entries), "entries": entries}, fh, indent=1)
    with open(os.path.join(OUT_DIR, "sprite_duplicates.json"), "w") as fh:
        json.dump(dupes, fh, indent=1)
    print(f"scanned files: {len(entries)}")
    print(f"raster hashed: {len(hashes)}")
    print(f"exact duplicate groups: {len(dupes)} (files involved: {sum(len(v) for v in dupes.values())})")
    ext_count = Counter(e.get("ext") for e in entries)
    print("by extension:", dict(ext_count.most_common()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
