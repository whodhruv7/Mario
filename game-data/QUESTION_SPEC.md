# VidyaSaathi: The Knowledge Quest — Question Bank Fragment Spec (v1)

You are generating textbook-grounded questions for an educational platformer game.
Class 9 Social Science (NCERT-style "Exploring Society: India and Beyond").

## OUTPUT FILES

Write exactly 4 JSON fragment files per chapter, 25 questions each:

```
/home/z/my-project/game-data/questions/<chapterId>_a.json   -> questions 001-025
/home/z/my-project/game-data/questions/<chapterId>_b.json   -> questions 026-050
/home/z/my-project/game-data/questions/<chapterId>_c.json   -> questions 051-075
/home/z/my-project/game-data/questions/<chapterId>_d.json   -> questions 076-100
```

Fragment envelope (same for every file):

```json
{
  "chapterId": "<chapterId>",
  "fragment": "a",
  "questions": [ ...25 question objects... ]
}
```

## QUESTION OBJECT — REQUIRED FOR ALL TYPES

| Field | Type | Notes |
|---|---|---|
| id | string | `"<chapterId>-NNN"` zero-padded 3 digits, sequential across whole chapter (001-100) |
| type | string | one of: `mcq`, `truefalse`, `fillblank`, `match`, `order`, `multiselect`, `wrongstatement`, `assertion` |
| topic | string | short topic name, 2-6 words, from the chapter |
| difficulty | string | `easy`, `medium`, or `hard` |
| q | string | question text. For `fillblank` must contain `___` (3 underscores) |
| explanation | string | 1-2 full sentences teaching WHY the answer is correct. Must teach the concept, never just "Correct!" |
| fact | string | the short textbook fact/line the question is based on |
| hint | string | OPTIONAL. A nudge that helps reasoning without revealing the answer |

## TYPE-SPECIFIC RULES (STRICT)

### mcq
- `options`: array of exactly 4 strings (plausible distractors, exactly ONE correct)
- `answer`: integer index 0-3 of the correct option
- No "All of the above" / "None of the above".

### truefalse
- NO `options` field.
- `answer`: `"true"` or `"false"` (string).
- The statement in `q` must be clearly verifiable from the textbook.

### fillblank
- `q` contains `___` where the blank is.
- `answerVariants`: array of accepted answer strings, e.g. `["Meghragarh", "Mehrgarh"]` — include obvious spelling/case variants. Matching in-game is case-insensitive and trims spaces.
- NO `options` field. Keep the missing word(s) short (1-3 words).

### match
- `q`: short instruction, e.g. "Match each term with its correct meaning."
- `pairs`: array of EXACTLY 5 objects `{"l": "...", "r": "..."}` — l = left item (term), r = right item (meaning/associated thing). The game shuffles the right column.
- NO `options` / `answer` field.

### order
- `q`: instruction e.g. "Arrange these in the correct chronological order."
- `orderItems`: array of 3-5 strings listed in the CORRECT order (first = earliest/first step). Game shuffles them.
- NO `options` field.

### multiselect
- `options`: array of 4-5 strings.
- `answerIndices`: array of 2-3 integers = indices of ALL correct options.
- `q` must say "Select all correct..." clearly.

### wrongstatement
- `options`: exactly 4 statements. THREE are correct per the textbook, ONE is incorrect/distorted.
- `answer`: index of the INCORRECT statement.
- `q`: "Which of these statements is INCORRECT?"

### assertion
- `q`: `"Assertion (A): <assertion>\nReason (R): <reason>"` — use a literal \n between them.
- `options`: exactly these 4 standard choices in this order:
  1. "Both A and R are true, and R explains A"
  2. "Both A and R are true, but R does not explain A"
  3. "A is true, but R is false"
  4. "A is false, but R is true"
- `answer`: index 0-3.

## DISTRIBUTION PER 100 QUESTIONS

- mcq: ~30 | truefalse: ~15 | fillblank: ~12 | match: ~6 | order: ~6 | multiselect: ~8 | wrongstatement: ~8 | assertion: ~8
- Difficulty: ~40 easy, ~40 medium, ~20 hard.
- Subject flavour: History -> more `order` (chronology) and `assertion`; Geography -> more `match` (term-meaning, landform-process) and location mcq; Civics -> more `assertion` and `wrongstatement`; Economics -> scenario-based mcq.
- Spread questions across ALL topics of the chapter (intro, middle, end-of-chapter content). Do not cluster on one section.

## QUALITY RULES (NON-NEGOTIABLE)

1. Ground EVERY question ONLY in your assigned source text file. NEVER invent facts, dates, quotes or page numbers.
2. Exactly one correct answer for mcq/wrongstatement/assertion; exactly correct pairs for match; unambiguous correct order for order.
3. No duplicate or near-duplicate questions (same fact asked twice with different wording is STILL a duplicate — avoid).
4. Class 9 reading level. Unambiguous wording. No trick questions that depend on grammar.
5. Explanations must teach the concept so a student learns even after answering wrongly.
6. JSON must be strictly parseable: double quotes only, NO trailing commas, escape internal double quotes as \", no raw newlines inside strings (use \n), valid UTF-8 (₹ and diacritics are fine).
7. Do not write anything outside the specified files.

## VALIDATION BEFORE YOU FINISH

Run:

```bash
python3 /home/z/my-project/scripts/validate_fragments.py
```

Your chapter must show 100 questions and 0 errors. Fix and re-run until clean.
