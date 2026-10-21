/* ── Local progress persistence (localStorage) ── */

import type { WeaponId, PacingId } from './game-config'

const KEY = 'vidyasaathi-kq-v1'

export interface ChapterStats {
  plays: number
  victories: number
  bestAccuracy: number
  answered: number
  correct: number
  coins: number
  crystals: number
  lastPlayed: string
}

export interface RunRecord {
  chapterId: string
  mode: string
  outcome: 'victory' | 'defeat' | 'incomplete'
  answered: number
  correct: number
  coins: number
  healthLeft: number
  at: string
}

export interface KQSettings {
  weapon: WeaponId
  pacing: PacingId
  musicOn: boolean
  sfxOn: boolean
}

interface StoredData {
  chapters: Record<string, ChapterStats>
  mistakes: Record<string, string[]>
  settings: KQSettings
  history: RunRecord[]
}

const DEFAULTS: StoredData = {
  chapters: {},
  mistakes: {},
  settings: { weapon: 'fireball', pacing: 'cinematic', musicOn: true, sfxOn: true },
  history: [],
}

function read(): StoredData {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<StoredData>
    return {
      chapters: parsed.chapters ?? {},
      mistakes: parsed.mistakes ?? {},
      settings: { ...DEFAULTS.settings, ...parsed.settings },
      history: parsed.history ?? [],
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function write(d: StoredData) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* storage full/blocked — game continues without persistence */
  }
}

export function getChapterStats(chapterId: string): ChapterStats | null {
  return read().chapters[chapterId] ?? null
}

export function getMistakes(chapterId: string): string[] {
  return read().mistakes[chapterId] ?? []
}

export function getSettings(): KQSettings {
  return read().settings
}

export function saveSettings(patch: Partial<KQSettings>) {
  const d = read()
  d.settings = { ...d.settings, ...patch }
  write(d)
}

export interface RunResultInput {
  chapterId: string
  mode: string
  outcome: 'victory' | 'defeat' | 'incomplete'
  answered: number
  correct: number
  coins: number
  crystals: number
  healthLeft: number
  wrongIds: string[]
  rightIds: string[]
}

export function applyRunResult(r: RunResultInput) {
  const d = read()
  const prev = d.chapters[r.chapterId] ?? {
    plays: 0, victories: 0, bestAccuracy: 0, answered: 0, correct: 0, coins: 0, crystals: 0, lastPlayed: '',
  }
  const accuracy = r.answered > 0 ? r.correct / r.answered : 0
  d.chapters[r.chapterId] = {
    plays: prev.plays + 1,
    victories: prev.victories + (r.outcome === 'victory' ? 1 : 0),
    bestAccuracy: Math.max(prev.bestAccuracy, accuracy),
    answered: prev.answered + r.answered,
    correct: prev.correct + r.correct,
    coins: prev.coins + r.coins,
    crystals: prev.crystals + r.crystals,
    lastPlayed: new Date().toISOString(),
  }

  const mistakes = new Set(d.mistakes[r.chapterId] ?? [])
  for (const id of r.rightIds) mistakes.delete(id)
  for (const id of r.wrongIds) mistakes.add(id)
  d.mistakes[r.chapterId] = Array.from(mistakes).slice(0, 120)

  d.history.unshift({
    chapterId: r.chapterId,
    mode: r.mode,
    outcome: r.outcome,
    answered: r.answered,
    correct: r.correct,
    coins: r.coins,
    healthLeft: r.healthLeft,
    at: new Date().toISOString(),
  })
  d.history = d.history.slice(0, 20)
  write(d)
}

/** Best-effort server sync — never blocks gameplay. */
export function syncRunToServer(r: RunResultInput & { durationSec: number; monstersDefeated: number }) {
  try {
    void fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId: r.chapterId,
        mode: r.mode,
        outcome: r.outcome,
        totalQuestions: r.answered,
        correct: r.correct,
        coins: r.coins,
        crystals: r.crystals,
        healthLeft: r.healthLeft,
        accuracy: r.answered > 0 ? r.correct / r.answered : 0,
        durationSec: r.durationSec,
        monstersDefeated: r.monstersDefeated,
      }),
    }).catch(() => {})
  } catch {
    /* offline — fine */
  }
}
