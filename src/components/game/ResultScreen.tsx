'use client'

/* ── ResultScreen: victory/defeat + learning summary ── */

import { getChapter } from '@/data/chapters'

export interface ResultSummary {
  outcome: 'victory' | 'defeat' | 'incomplete'
  chapterId: string
  answered: number
  correct: number
  coins: number
  crystals: number
  healthLeft: number
  monstersDefeated: number
  monstersTotal: number
  durationSec: number
  streakBest: number
  topics: { topic: string; right: number; wrong: number }[]
  mistakesNow: number
  mode: string
}

interface Props {
  summary: ResultSummary
  onRetry: () => void
  onPractice: () => void
  onNewMission: () => void
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3 text-center">
      <div className={`text-xl font-black ${accent ?? 'text-white'}`}>{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}

export default function ResultScreen({ summary, onRetry, onPractice, onNewMission }: Props) {
  const chapter = getChapter(summary.chapterId)
  const accuracy = summary.answered > 0 ? Math.round((summary.correct / summary.answered) * 100) : 0
  const strong = summary.topics.filter((t) => t.right > 0 && t.wrong === 0).slice(0, 6)
  const revise = summary.topics.filter((t) => t.wrong > 0).slice(0, 6)

  const titles: Record<string, { title: string; sub: string; cls: string }> = {
    victory: {
      title: '🏆 VICTORY!',
      sub: 'Dravak is defeated and the Knowledge Crystal is yours!',
      cls: 'text-amber-300',
    },
    defeat: {
      title: '💥 DEFEATED',
      sub: 'Veer fell in battle — but every wrong answer taught you something. Retry!',
      cls: 'text-rose-400',
    },
    incomplete: {
      title: '📝 QUEST ENDED',
      sub: 'You ran out of questions for this mission. Here is what you learned.',
      cls: 'text-cyan-300',
    },
  }
  const t = titles[summary.outcome]

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-8">
      {summary.outcome === 'victory' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className="kq-confetti"
              style={{
                left: `${(i * 41) % 100}%`,
                animationDelay: `${(i % 8) * 0.35}s`,
                background: ['#FFD65C', '#FF6B9E', '#67E8F9', '#9B59D0', '#7DF27A'][i % 5],
              }}
            />
          ))}
        </div>
      )}

      <div className="kq-card relative p-6 sm:p-8">
        <div className={`font-pixel text-center text-lg sm:text-2xl ${t.cls}`}>{t.title}</div>
        <p className="mt-3 text-center text-sm text-slate-300">{t.sub}</p>
        <div className="mt-1 text-center text-xs text-slate-500">
          {chapter?.name} · {summary.mode} mode
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          <StatCard label="accuracy" value={`${accuracy}%`} accent={accuracy >= 70 ? 'text-emerald-300' : 'text-amber-300'} />
          <StatCard label="correct" value={`${summary.correct}/${summary.answered}`} />
          <StatCard label="monsters" value={`${summary.monstersDefeated}/${summary.monstersTotal}`} />
          <StatCard label="hearts left" value={`❤️ ${summary.healthLeft}`} accent={summary.healthLeft <= 3 ? 'text-rose-300' : undefined} />
          <StatCard label="coins" value={`🪙 ${summary.coins}`} />
          <StatCard label="time" value={`${Math.floor(summary.durationSec / 60)}m ${summary.durationSec % 60}s`} />
        </div>

        {/* learning summary */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="font-pixel text-[9px] text-emerald-300">💪 STRONGEST TOPICS</div>
            {strong.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {strong.map((tp) => (
                  <span key={tp.topic} className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] text-emerald-200">
                    {tp.topic} · {tp.right}✓
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Keep fighting to unlock your strengths!</p>
            )}
          </div>
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
            <div className="font-pixel text-[9px] text-rose-300">📖 REVISE THESE TOPICS</div>
            {revise.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {revise.map((tp) => (
                  <span key={tp.topic} className="rounded-full bg-rose-500/20 px-2.5 py-1 text-[11px] text-rose-200">
                    {tp.topic} · {tp.wrong}✗
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Flawless! No wrong answers this run.</p>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button onClick={onRetry} className="kq-btn-primary flex-1">
            ↻ Retry this chapter
          </button>
          <button
            onClick={onPractice}
            disabled={summary.mistakesNow === 0}
            className="kq-btn-ghost flex-1 disabled:opacity-40"
          >
            🎯 Practise my mistakes ({summary.mistakesNow})
          </button>
          <button onClick={onNewMission} className="kq-btn-ghost flex-1">
            ⌂ New mission
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-500">
          Learning is never locked: your mistakes are saved for practice, and every run is recorded locally on this device.
        </p>
      </div>
    </div>
  )
}
