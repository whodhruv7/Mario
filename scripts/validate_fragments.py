#!/usr/bin/env python3
"""Validate question-bank fragments for VidyaSaathi: The Knowledge Quest."""
import json
import os
import sys
import collections

QDIR = "/home/z/my-project/game-data/questions"
TYPES = {"mcq", "truefalse", "fillblank", "match", "order", "multiselect", "wrongstatement", "assertion"}
DIFFS = {"easy", "medium", "hard"}
STD_ASSERTION = [
    "Both A and R are true, and R explains A",
    "Both A and R are true, but R does not explain A",
    "A is true, but R is false",
    "A is false, but R is true",
]


def check_question(q, ctx, errors, seen_ids, seen_texts):
    pid = ctx
    def err(msg):
        errors.append(f"{pid}: {msg}")

    for f in ("id", "type", "topic", "difficulty", "q", "explanation", "fact"):
        v = q.get(f)
        if v is None or (isinstance(v, str) and not v.strip()):
            err(f"missing/empty '{f}'")
    if q.get("type") not in TYPES:
        err(f"bad type '{q.get('type')}'")
        return
    if q.get("difficulty") not in DIFFS:
        err(f"bad difficulty '{q.get('difficulty')}'")
    if len(q.get("explanation", "")) < 15:
        err("explanation too short (must teach)")
    if len(q.get("fact", "")) < 5:
        err("fact too short")

    t = q["type"]
    if t in ("mcq", "wrongstatement", "assertion"):
        opts = q.get("options")
        if not isinstance(opts, list) or len(opts) != 4:
            err(f"{t}: needs exactly 4 options")
        elif len(set(o.strip() for o in opts if isinstance(o, str))) != 4:
            err(f"{t}: duplicate options")
        else:
            a = q.get("answer")
            if not isinstance(a, int) or isinstance(a, bool) or not (0 <= a < 4):
                err(f"{t}: answer must be int index 0-3, got {a!r}")
        if t == "assertion" and isinstance(opts, list) and opts != STD_ASSERTION:
            err("assertion: options must be the 4 standard choices (see spec)")
        if t == "assertion" and "\n" not in q.get("q", ""):
            err("assertion: q must contain A and R separated by \\n")
    elif t == "truefalse":
        if "options" in q:
            err("truefalse: must NOT have options")
        if q.get("answer") not in ("true", "false"):
            err("truefalse: answer must be \"true\" or \"false\"")
    elif t == "fillblank":
        if "options" in q:
            err("fillblank: must NOT have options")
        if "___" not in q.get("q", ""):
            err("fillblank: q must contain ___")
        av = q.get("answerVariants")
        if not isinstance(av, list) or len(av) == 0:
            err("fillblank: answerVariants required (non-empty list)")
    elif t == "match":
        if "options" in q or "answer" in q:
            err("match: must NOT have options/answer")
        p = q.get("pairs")
        if not isinstance(p, list) or len(p) != 5:
            err("match: needs exactly 5 pairs")
        else:
            for pr in p:
                if not isinstance(pr, dict) or set(pr.keys()) != {"l", "r"} or not str(pr.get("l", "")).strip() or not str(pr.get("r", "")).strip():
                    err("match: each pair must be {\"l\": ..., \"r\": ...} non-empty")
    elif t == "order":
        if "options" in q:
            err("order: must NOT have options")
        oi = q.get("orderItems")
        if not isinstance(oi, list) or not (3 <= len(oi) <= 5):
            err("order: orderItems must have 3-5 items")
        elif len(set(oi)) != len(oi):
            err("order: orderItems must be unique")
    elif t == "multiselect":
        opts = q.get("options")
        if not isinstance(opts, list) or not (4 <= len(opts) <= 5):
            err("multiselect: needs 4-5 options")
        ai = q.get("answerIndices")
        if not isinstance(ai, list) or len(ai) < 2:
            err("multiselect: answerIndices must list 2+ correct indices")
        elif isinstance(opts, list) and any((not isinstance(x, int)) or x < 0 or x >= len(opts) for x in ai):
            err("multiselect: answerIndices out of range")
        elif isinstance(ai, list) and len(set(ai)) != len(ai):
            err("multiselect: duplicate indices")

    qid = q.get("id", "")
    if qid:
        if qid in seen_ids:
            err(f"duplicate id '{qid}'")
        seen_ids.add(qid)
    key = " ".join(str(q.get("q", "")).lower().split())[:90]
    if key:
        if key in seen_texts:
            err(f"duplicate question text: '{key[:50]}...'")
        seen_texts.add(key)


def main():
    if not os.path.isdir(QDIR):
        print(f"NO fragments dir: {QDIR}")
        sys.exit(1)
    files = sorted(f for f in os.listdir(QDIR) if f.endswith(".json"))
    if not files:
        print("NO fragment files found")
        sys.exit(1)

    errors = []
    per_chapter = collections.defaultdict(lambda: {"n": 0, "types": collections.Counter(), "diff": collections.Counter(), "topics": set()})
    seen_ids, seen_texts = set(), set()

    for fn in files:
        path = os.path.join(QDIR, fn)
        try:
            with open(path, "r", encoding="utf-8") as fh:
                data = json.load(fh)
        except Exception as e:
            errors.append(f"{fn}: JSON PARSE ERROR: {e}")
            continue
        ch = data.get("chapterId", "?")
        qs = data.get("questions")
        if not isinstance(qs, list):
            errors.append(f"{fn}: 'questions' must be a list")
            continue
        for i, q in enumerate(qs):
            if not isinstance(q, dict):
                errors.append(f"{fn}[{i}]: not an object")
                continue
            check_question(q, f"{fn}[{i}]", errors, seen_ids, seen_texts)
            if q.get("type") in TYPES:
                per_chapter[ch]["n"] += 1
                per_chapter[ch]["types"][q["type"]] += 1
                per_chapter[ch]["diff"][q.get("difficulty", "?")] += 1
                per_chapter[ch]["topics"].add(q.get("topic", "?"))

    print("=" * 78)
    print("QUESTION BANK VALIDATION REPORT")
    print("=" * 78)
    total = 0
    for ch in sorted(per_chapter):
        s = per_chapter[ch]
        total += s["n"]
        status = "OK " if s["n"] == 100 else ("LOW" if s["n"] < 100 else "OVER")
        print(f"\n[{status}] {ch}: {s['n']} questions, {len(s['topics'])} topics")
        print(f"      types : {dict(s['types'])}")
        print(f"      diff  : {dict(s['diff'])}")
    print(f"\nTOTAL: {total} questions across {len(per_chapter)} chapters, {len(files)} files")
    if errors:
        print(f"\nERRORS ({len(errors)}):")
        for e in errors[:80]:
            print("  -", e)
        if len(errors) > 80:
            print(f"  ... and {len(errors) - 80} more")
        sys.exit(1)
    print("\nALL FRAGMENTS VALID (0 errors)")
    sys.exit(0)


if __name__ == "__main__":
    main()
