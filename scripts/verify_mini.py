#!/usr/bin/env python3
"""Final verification for mini booklets:
1. Scan extracted text for corruption (U+FFFD / tofu)
2. Render preview PNGs (banner page + a middle page each) for on-screen display
"""
import fitz, os

BOOKLETS = [
    ("download/History_Ch5_5Page_Revision_Notes.pdf", "History_5p"),
    ("download/Civics_Ch6_5Page_Revision_Notes.pdf", "Democracy_5p"),
    ("download/Civics_Ch7_5Page_Revision_Notes.pdf", "Elections_5p"),
]
OUT = "download/previews"
os.makedirs(OUT, exist_ok=True)

ok = True
for path, name in BOOKLETS:
    doc = fitz.open(path)
    full = "".join(p.get_text() for p in doc)
    bad = full.count("\ufffd")
    print(f"{os.path.basename(path)}: {len(doc)} pages | corruption chars: {bad} | chars: {len(full)}")
    if bad:
        ok = False
    # previews: page 1 (banner) + last page (5-min revision / answer guide zone)
    for pno in (0, len(doc) - 1):
        pix = doc[pno].get_pixmap(dpi=100)
        tag = "p1" if pno == 0 else "last"
        pix.save(f"{OUT}/{name}_{tag}.png")
    doc.close()
print("TEXT SCAN:", "PASS" if ok else "FAIL")
