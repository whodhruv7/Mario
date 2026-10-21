#!/usr/bin/env python3
"""Render preview PNGs of the History Workbook PDF at 110 DPI."""
import fitz, os

PDF = "/home/z/my-project/download/History_Workbook_Ch4_Ch5.pdf"
OUT = "/home/z/my-project/download/previews"
os.makedirs(OUT, exist_ok=True)

# page (1-indexed) -> filename tag
PAGES = {
    1: "p1_cover",
    2: "p2_howto_ch4open",
    4: "p4_ch4_notes",
    7: "p7_diffzone",
    9: "p9_mcq",
    12: "p12_ch5_notes",
    19: "p19_varna_jati",
    24: "p24_end",
}

doc = fitz.open(PDF)
zoom = 110 / 72  # 110 DPI
mat = fitz.Matrix(zoom, zoom)
for pno, tag in PAGES.items():
    page = doc[pno - 1]
    pix = page.get_pixmap(matrix=mat)
    path = os.path.join(OUT, f"HistWB_{tag}.png")
    pix.save(path)
    print(f"saved {path} ({pix.width}x{pix.height})")
print("done")
