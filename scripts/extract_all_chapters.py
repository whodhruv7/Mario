"""Extract FULL text from all uploaded chapter PDFs into organized .txt files."""
import fitz
import os

base = "/home/z/my-project/upload"
outdir = "/home/z/my-project/download/text_sources"
os.makedirs(outdir, exist_ok=True)

# map: filename -> (book, chapter number, chapter title)
chapters = {
    "iest102.pdf": ("Geography", 2, "Shaping of the Earth's Surface"),
    "iest103.pdf": ("Geography", 3, "Atmosphere and Climate"),
    "iest104.pdf": ("History", 4, "Early Humans and Beginning of Civilisation"),
    "iest108.pdf": ("Economics", 8, "Building Blocks in Economics - The Problem of Choice"),
    "iest109.pdf": ("Economics", 9, "The Price Puzzle - What Drives the Market"),
    "5. State and Society up to 1000 CE.pdf": ("History", 5, "State and Society up to 1000 CE"),
    "6. Democracy.pdf": ("Civics", 6, "Democracy"),
    "7. Elections.pdf": ("Civics", 7, "Elections"),
}

for fname, (book, num, title) in chapters.items():
    path = os.path.join(base, fname)
    if not os.path.exists(path):
        print(f"SKIP (missing): {fname}")
        continue
    doc = fitz.open(path)
    full_text = []
    for i, page in enumerate(doc):
        full_text.append(f"\n===== PAGE {i+1} =====\n")
        full_text.append(page.get_text())
    text = "".join(full_text)
    out_name = f"{book}_Ch{num}_{title.replace(' ', '_').replace('-', '')}.txt"
    out_path = os.path.join(outdir, out_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK  {fname:>42}  ->  {out_name}  ({len(doc)} pages, {len(text)} chars)")
    doc.close()

print("\nAll text extracted to:", outdir)
