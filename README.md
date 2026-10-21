# 🎮 VidyaSaathi: The Knowledge Quest

An original educational side-scrolling adventure game for Class 9 Social Science — students battle alien monsters and a Shadow Dragon boss using real textbook questions.

> Run. Jump. Answer. Attack. Learn.

![genre](https://img.shields.io/badge/genre-educational_platformer-f59e0b) ![questions](https://img.shields.io/badge/question_bank-1400_-22c55e) ![chapters](https://img.shields.io/badge/chapters-14-3b82f6) ![platforms](https://img.shields.io/badge/platforms-phone_+_laptop-a855f7)

## 🕹️ What is this?

A Mario-style platformer where combat runs on **knowledge**:

- ❤️ The hero **Veer** (an original goggled explorer) starts every run with **10 hearts**
- 👾 **Small alien monsters** — each takes **2 correct answers** to defeat
- 🐉 **Dravak the Shadow Dragon** — needs a **streak of consecutive correct answers** (10 in Adventure mode); its attacks cost **−2 hearts** and reset your streak
- 🔥 **Fireball** (3-second cinematic flight) and 🏹 **bow & arrow** attacks, triggered by correct answers
- ❌ Wrong answers trigger enemy counterattacks — with a full explanation so you learn from every mistake

## 📚 Content

- **1,400 validated questions** across **14 chapters** of the Class 9 SST textbook
  (*Exploring Society: India and Beyond*, Parts 1 & 2) — History, Geography, Civics, Economics, Entrepreneurship
- **8 interactive exercise types**: MCQ, True/False, Fill in the Blank, Match the Following, Arrange in Order, Select All Correct, Find the Incorrect, Assertion & Reason
- Every question carries an explanation + the textbook fact it is grounded in

## 🎯 Modes

| Mode | Monsters | Dragon streak | Core questions |
|---|---|---|---|
| Quick Quest | 1 × 2 hits | 3 | 5 |
| Standard | 2 × 2 hits | 6 | 10 |
| Adventure | 5 × 2 hits | 10 | 20 |
| Challenge | 10 × 2 hits | 20 | 40 |
| Custom | 1–12 | 2–25 | your call |

Plus **Practise My Mistakes** — a mode that replays exactly the questions you previously got wrong.

## 🏗️ Tech

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS 4**
- Custom **Canvas 2D game engine** (`src/game/`) — fixed-timestep loop, AABB physics, parallax world, particles, screen shake
- **100% procedural pixel art** (`src/game/sprites.ts`) — original characters drawn as pixel matrices, no external assets
- **Procedural chiptune audio** (`src/game/audio.ts`) — Web Audio API synthesized SFX + 3 original music themes
- Question bank: JSON fragments → merged bank in `public/data/question-bank.json`, validated by `scripts/validate_fragments.py`
- Persistence: localStorage (progress, mistakes, settings) + optional Prisma/SQLite run analytics at `POST /api/runs`
- Works on desktop (keyboard) and phones (touch controls)

## 🚀 Run it

```bash
bun install        # or npm install
bun run dev        # or npm run dev
```

Open http://localhost:3000 — pick a subject, a chapter, a mission, and fight.

### Rebuild the question bank

```bash
python3 scripts/validate_fragments.py   # validate game-data/questions/*.json
python3 scripts/build_question_bank.py  # merge -> public/data/question-bank.json
```

## 🧪 Verified gameplay loop

Browser-tested end-to-end: setup → briefing → run/jump → monster encounter → all 8 exercise types → fireball & arrow combat → damage/i-frames → dragon streak → victory sequence → result stats → mistakes practice.

## 📁 Key paths

```
src/game/            engine, entities, level gen, sprites, audio
src/components/game/ GameShell, SetupScreen, HUD, QuizPanel, TouchControls, ResultScreen
src/lib/             questions (grading/selection), storage, game-config
src/data/            chapter registry
game-data/questions/ source question fragments (56 files, 1400 questions)
public/data/         merged question bank served to the client
```

---

Made with ❤️ for VidyaSaathi — an original IP. All characters, art, music and code are original creations.
