#!/usr/bin/env python3
"""Merge question fragments into a single client-fetchable bank + meta."""
import json
import os
import collections
from datetime import datetime, timezone

SRC = "/home/z/my-project/game-data/questions"
OUT_DIR = "/home/z/my-project/public/data"

def main():
    chapters = collections.defaultdict(list)
    for fn in sorted(os.listdir(SRC)):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(SRC, fn), "r", encoding="utf-8") as fh:
            data = json.load(fh)
        cid = data["chapterId"]
        chapters[cid].extend(data["questions"])

    # sanity: no duplicate ids inside a chapter
    problems = []
    for cid, qs in chapters.items():
        ids = [q["id"] for q in qs]
        if len(ids) != len(set(ids)):
            dupes = [i for i, c in collections.Counter(ids).items() if c > 1]
            problems.append((cid, dupes))

    os.makedirs(OUT_DIR, exist_ok=True)
    bank = {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "chapters": {cid: chapters[cid] for cid in sorted(chapters)},
    }
    out_path = os.path.join(OUT_DIR, "question-bank.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(bank, fh, ensure_ascii=False, separators=(",", ":"))

    meta = {}
    for cid, qs in chapters.items():
        types = collections.Counter(q["type"] for q in qs)
        diff = collections.Counter(q["difficulty"] for q in qs)
        topics = sorted({q.get("topic", "General") for q in qs})
        meta[cid] = {"count": len(qs), "types": dict(types), "difficulty": dict(diff), "topics": topics}
    meta_path = os.path.join(OUT_DIR, "bank-meta.json")
    with open(meta_path, "w", encoding="utf-8") as fh:
        json.dump({"version": 2, "chapters": meta}, fh, ensure_ascii=False, indent=1)

    total = sum(len(qs) for qs in chapters.values())
    size_kb = os.path.getsize(out_path) // 1024
    print(f"OK: {total} questions / {len(chapters)} chapters -> {out_path} ({size_kb} KB)")
    for cid in sorted(chapters):
        print(f"  {cid}: {len(chapters[cid])}")
    if problems:
        print("DUPLICATE ID PROBLEMS:", problems)
        raise SystemExit(1)

if __name__ == "__main__":
    main()
