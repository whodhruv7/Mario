"""Render preview PNGs of the Economics workbook for chat display."""
import fitz
import os

PDF = "/home/z/my-project/download/Economics_Workbook_Ch8_Ch9.pdf"
OUT = "/home/z/my-project/download/previews"
os.makedirs(OUT, exist_ok=True)

# pages to preview: cover, howto+ch8 opener, a notes page, defbank, MCQ, anskey, ch9 opener, QA, closer
targets = {
    0: "EconWB_p1_cover",
    1: "EconWB_p2_howto",
    3: "EconWB_p4_notes",
    8: "EconWB_p9_defbank",
    9: "EconWB_p10_mcq",
    10: "EconWB_p11_anskey",
    12: "EconWB_p13_ch9notes",
    15: "EconWB_p16_qa",
    17: "EconWB_p18_end",
}

doc = fitz.open(PDF)
print(f"PDF has {len(doc)} pages")
for pno, name in targets.items():
    page = doc[pno]
    pix = page.get_pixmap(dpi=110)
    path = os.path.join(OUT, f"{name}.png")
    pix.save(path)
    print(f"saved {path}  ({pix.width}x{pix.height})")
doc.close()
