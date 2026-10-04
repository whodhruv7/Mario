"""Identify the 5 newly uploaded SST PDFs: extract first pages + page count."""
import fitz
import os

files = ["iest102.pdf", "iest103.pdf", "iest104.pdf", "iest108.pdf", "iest109.pdf"]
base = "/home/z/my-project/upload"

for f in files:
    path = os.path.join(base, f)
    doc = fitz.open(path)
    print("=" * 70)
    print(f"FILE: {f}  |  pages: {len(doc)}")
    print("=" * 70)
    # extract first 2 pages text to identify chapter
    for i in range(min(2, len(doc))):
        text = doc[i].get_text().strip()
        print(f"--- page {i+1} ---")
        print(text[:800])
        print()
    doc.close()
