import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CHAPTER_IDS = new Set([
  'hist4', 'hist5', 'geo2', 'geo3', 'civ6', 'civ7', 'econ8', 'econ9',
  'p2geo1', 'p2geo2', 'p2hist3', 'p2civ4', 'p2econ5', 'p2ent6',
])
const OUTCOMES = new Set(['victory', 'defeat', 'incomplete'])

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const chapterId = String(body.chapterId ?? '')
    const outcome = String(body.outcome ?? '')
    if (!CHAPTER_IDS.has(chapterId) || !OUTCOMES.has(outcome)) {
      return NextResponse.json({ ok: false, error: 'invalid payload' }, { status: 400 })
    }
    const clampInt = (v: unknown, min: number, max: number) =>
      Math.max(min, Math.min(max, Math.floor(Number(v) || 0)))
    const run = await db.gameRun.create({
      data: {
        chapterId,
        mode: String(body.mode ?? 'adventure').slice(0, 40),
        outcome,
        totalQuestions: clampInt(body.totalQuestions, 0, 10000),
        correct: clampInt(body.correct, 0, 10000),
        coins: clampInt(body.coins, 0, 100000),
        crystals: clampInt(body.crystals, 0, 10000),
        healthLeft: clampInt(body.healthLeft, 0, 10),
        accuracy: Math.max(0, Math.min(1, Number(body.accuracy) || 0)),
        durationSec: clampInt(body.durationSec, 0, 86400),
        monstersDefeated: clampInt(body.monstersDefeated, 0, 50),
      },
    })
    return NextResponse.json({ ok: true, id: run.id })
  } catch {
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const runs = await db.gameRun.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
    return NextResponse.json({ ok: true, runs })
  } catch {
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 })
  }
}
