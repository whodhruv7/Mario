#!/usr/bin/env python3
"""Render cover + sample pages of the 3 revision booklet PDFs as PNG previews
so the user can SEE them on screen in the chat."""
import fitz  # PyMuPDF
import os

PDFS = [
    ("/home/z/my-project/download/History_Ch5_State_and_Society_up_to_1000CE_Short_Notes.pdf",
     "History_Ch5_cover"),
    ("/home/z/my-project/download/Civics_Ch6_Democracy_Short_Notes.pdf",
     "Civics_Ch6_cover"),
    ("/home/z/my-project/download/Civics_Ch7_Elections_Short_Notes.pdf",
     "Civics_Ch7_cover"),
]

OUT = "/home/z/my-project/download/previews"
os.makedirs(OUT, exist_ok=True)

for path, name in PDFS:
    doc = fitz.open(path)
    print(f"{os.path.basename(path)}: {len(doc)} pages")
    # Render cover (page 0) at 110 DPI for a crisp on-screen preview
    pix = doc[0].get_pixmap(dpi=110)
    out = f"{OUT}/{name}.png"
    pix.save(out)
    print(f"  -> saved {out} ({pix.width}x{pix.height})")
    doc.close()

print("DONE")
