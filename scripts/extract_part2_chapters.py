"""Extract FULL text from Part 2 uploaded chapter PDFs (iest201-206) into organized .txt files."""
import fitz
import os

base = "/home/z/my-project/upload"
outdir = "/home/z/my-project/download/text_sources"
os.makedirs(outdir, exist_ok=True)

# map: filename -> (book, chapter number, chapter title)
chapters = {
    "iest201.pdf": ("Geography", 1, "Oceans and Life"),
    "iest202.pdf": ("Geography", 2, "Life on Earth"),
    "iest203.pdf": ("History", 3, "Resistance and Resilience 1000-1700 CE"),
    "iest204.pdf": ("Civics", 4, "Governance and Public Policy"),
    "iest205.pdf": ("Economics", 5, "Managing Your Personal Finances"),
    "iest206.pdf": ("Entrepreneurship", 6, "From Ideas to Startups"),
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
    out_name = f"P2_{book}_Ch{num}_{title.replace(' ', '_').replace('-', '').replace(':', '')}.txt"
    out_path = os.path.join(outdir, out_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK  {fname:>14}  ->  {out_name}  ({len(doc)} pages, {len(text)} chars)")
    doc.close()

print("\nAll Part 2 text extracted to:", outdir)
