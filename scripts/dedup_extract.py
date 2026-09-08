#!/usr/bin/env python3
"""De-duplicate doubled characters from PDF text extraction and save clean text."""
import json
import re

def dedup_text(text: str) -> str:
    """Every char appears doubled; take every 2nd char. Fallback keeps singletons."""
    out = []
    i = 0
    n = len(text)
    while i < n:
        c = text[i]
        if i + 1 < n and text[i + 1] == c:
            out.append(c)
            i += 2
        else:
            out.append(c)
            i += 1
    return ''.join(out)

def clean_cid(text: str) -> str:
    return re.sub(r'\(cid:\d+\)', '—', text)

def process_file(src: str, dst: str):
    with open(src, 'r', encoding='utf-8') as f:
        data = json.load(f)
    pages = data['data']['pages']
    parts = []
    for p in pages:
        t = p.get('text', '')
        t = clean_cid(t)
        t = dedup_text(t)
        parts.append(f"===== PAGE {p['page']} =====\n{t}")
    clean = '\n\n'.join(parts)
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(clean)
    print(f"{src} -> {dst}: {len(clean)} chars, {len(pages)} pages")

if __name__ == '__main__':
    process_file('/home/z/my-project/extracted_history.txt', '/home/z/my-project/clean_history.txt')
    process_file('/home/z/my-project/extracted_civics1.txt', '/home/z/my-project/clean_civics1.txt')
    process_file('/home/z/my-project/extracted_civics2.txt', '/home/z/my-project/clean_civics2.txt')
