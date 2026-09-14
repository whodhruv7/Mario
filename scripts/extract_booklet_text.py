#!/usr/bin/env python3
"""Extract plain text content from the 3 booklet HTML sources for compression."""
import re, html as htmllib

FILES = [
    "/home/z/my-project/download/html_sources/History_Ch5_notes.html",
    "/home/z/my-project/download/html_sources/Civics_Ch6_Democracy_notes.html",
    "/home/z/my-project/download/html_sources/Civics_Ch7_Elections_notes.html",
]

def extract(path):
    with open(path, encoding="utf-8") as f:
        doc = f.read()
    # Remove styles/scripts
    doc = re.sub(r"<style[\s\S]*?</style>", "", doc)
    doc = re.sub(r"<script[\s\S]*?</script>", "", doc)
    # Mark structural boundaries
    doc = re.sub(r"<(h[1-6]|div|li|tr|p|table)[^>]*>", "\n", doc)
    doc = re.sub(r"<(td|th)[^>]*>", " | ", doc)
    doc = re.sub(r"<[^>]+>", " ", doc)
    doc = htmllib.unescape(doc)
    # Collapse whitespace per line
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in doc.split("\n")]
    lines = [ln for ln in lines if ln and ln != "|"]
    return "\n".join(lines)

for f in FILES:
    txt = extract(f)
    out = f.replace("html_sources/", "").replace(".html", "_content.txt").replace(
        "/home/z/my-project/download/", "/home/z/my-project/")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(txt)
    print(f"{out}: {len(txt)} chars, {txt.count(chr(10))+1} lines")
