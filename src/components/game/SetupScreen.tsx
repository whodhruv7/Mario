'use client'

/* ── SetupScreen: mission select — subject → chapter → mode → start ── */

import { useMemo, useState } from 'react'
import { CHAPTERS, CHAPTERS_BY_SUBJECT, SUBJECTS, getChapter, type SubjectId } from '@/data/chapters'
import { MODES, CUSTOM_LIMITS, coreQuestions, type RunSettings } from '@/lib/game-config'
import type { BankMeta, Question } from '@/lib/questions'
import { getChapterStats, getMistakes } from '@/lib/storage'
import { heroSprite, dragonSprites, monsterSprite } from '@/game/sprites'

interface Props {
  bank: Record<string, Question[]> | null
  meta: BankMeta | null
  loadError: string | null
  settings: RunSettings
  onSettings: (s: RunSettings) => void
  selectedChapter: string | null
  onSelectChapter: (id: string | null) => void
  onStart: () => void
  statsVersion: number
}

export default function SetupScreen({
  bank, meta, loadError, settings, onSettings, selectedChapter, onSelectChapter, onStart, statsVersion,
}: Props) {
  const [subject, setSubject] = useState<SubjectId | null>(null)

  // This component only renders client-side (ssr:false), so generating
  // sprite data-urls during first render is safe.
  const { heroImg, dragonImg, monsterImgs } = useMemo(() => {
    try {
      const toUrl = (src: HTMLCanvasElement) => {
        const c = document.createElement('canvas')
        c.width = src.width
        c.height = src.height
        c.getContext('2d')!.drawImage(src, 0, 0)
        return c.toDataURL()
      }
      const h = heroSprite('idle')
      const big = document.createElement('canvas')
      big.width = h.width * 1.5
      big.height = h.height * 1.5
      const g = big.getContext('2d')!
      g.imageSmoothingEnabled = false
      g.drawImage(h, 0, 0, big.width, big.height)
      return {
        heroImg: big.toDataURL(),
        dragonImg: toUrl(dragonSprites().idle2),
        monsterImgs: ['grubble', 'zapper', 'mawzor', 'frostik', 'embit'].map((k) => toUrl(monsterSprite(k, 'idle'))),
      }
    } catch {
      return { heroImg: null, dragonImg: null, monsterImgs: [] as string[] }
    }
  }, [])

  const chapters = subject ? CHAPTERS_BY_SUBJECT(subject) : []
  const chapter = selectedChapter ? getChapter(selectedChapter) : null
  const mistakes = chapter ? getMistakes(chapter.id).length : 0
  const totalQuestions = useMemo(
    () => (meta ? Object.values(meta.chapters).reduce((a, c) => a + c.count, 0) : 0),
    [meta],
  )

  const setMode = (m: typeof MODES[number]) => {
    onSettings({
      ...settings,
      mode: m.id,
      monsters: m.monsters,
      hitsPerMonster: m.hitsPerMonster,
      bossStreak: m.bossStreak,
      mistakesOnly: false,
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:pt-10">
      {/* ── header ── */}
      <header className="relative overflow-hidden rounded-2xl border-2 border-amber-400/40 bg-gradient-to-b from-sky-500/25 via-slate-900 to-emerald-900/40 p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute -left-4 bottom-0 hidden opacity-90 sm:block">
          {heroImg && <img src={heroImg} alt="Veer, the Knowledge Quest hero" className="kq-pixel-img h-40" />}
        </div>
        <div className="pointer-events-none absolute -right-6 bottom-0 hidden opacity-80 sm:block">
          {dragonImg && <img src={dragonImg} alt="Dravak the Shadow Dragon" className="kq-pixel-img h-28" />}
        </div>
        <div className="font-pixel text-[10px] tracking-widest text-amber-300">VIDYASAATHI PRESENTS</div>
        <h1 className="font-pixel mt-4 text-xl leading-relaxed text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] sm:text-3xl">
          THE KNOWLEDGE<br />QUEST
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-slate-300">
          Run, jump and blast aliens with your textbook knowledge. Defeat 5 monsters, face the dragon,
          and master your chapter.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="kq-chip bg-amber-400 text-slate-900">❤️ 10 hearts</span>
          <span className="kq-chip border border-white/20 bg-slate-800/80 text-slate-200">📚 {totalQuestions || '…'} textbook questions</span>
          <span className="kq-chip border border-white/20 bg-slate-800/80 text-slate-200">🎮 14 chapters</span>
          <span className="kq-chip border border-white/20 bg-slate-800/80 text-slate-200">📱 phone + laptop</span>
        </div>
        {loadError && (
          <div className="mt-4 rounded-lg border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-300">
            Could not load the question bank ({loadError}). Refresh the page to retry.
          </div>
        )}
        {monsterImgs.length > 0 && (
          <div className="mt-5 flex items-end justify-center gap-2 opacity-90 sm:gap-4">
            {monsterImgs.map((src, i) => (
              <img key={i} src={src} alt="alien monster" className="kq-pixel-img h-8 sm:h-10" style={{ animation: `kq-float 2.2s ease-in-out ${i * 0.3}s infinite` }} />
            ))}
          </div>
        )}
      </header>

      {/* ── step 1: subject ── */}
      <section className="mt-8">
        <h2 className="font-pixel mb-3 text-[10px] text-amber-300">1 · CHOOSE YOUR SUBJECT</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SUBJECTS.map((s) => {
            const count = CHAPTERS_BY_SUBJECT(s.id).length
            const active = subject === s.id
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSubject(s.id)
                  onSelectChapter(null)
                }}
                className={`rounded-xl border-2 p-3 text-left transition-all ${
                  active
                    ? 'scale-[1.02] border-amber-300 bg-amber-400/15 shadow-[0_0_20px_rgba(245,183,10,0.25)]'
                    : 'border-white/10 bg-slate-800/60 hover:border-white/30'
                }`}
                style={active ? { boxShadow: `0 0 22px ${s.color}55` } : undefined}
              >
                <div className="text-2xl">{SUBJECT_ICONS[s.icon]}</div>
                <div className="mt-1 text-sm font-bold text-white">{s.name}</div>
                <div className="text-[10px] text-slate-400">{s.tagline}</div>
                <div className="mt-1 text-[10px] text-slate-500">{count} chapters</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── step 2: chapter ── */}
      {subject && (
        <section className="mt-8">
          <h2 className="font-pixel mb-3 text-[10px] text-amber-300">2 · CHOOSE YOUR CHAPTER</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {chapters.map((c) => {
              const qCount = meta?.chapters[c.id]?.count ?? bank?.[c.id]?.length ?? 0
              const stats = getChapterStats(c.id)
              const wrong = getMistakes(c.id).length
              const active = selectedChapter === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectChapter(c.id)
                    onSettings({ ...settings, mistakesOnly: false })
                  }}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    active
                      ? 'border-amber-300 bg-amber-400/15'
                      : 'border-white/10 bg-slate-800/60 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      Part {c.part} · {c.label}
                    </span>
                    <span className="text-[10px] text-slate-500">{qCount} questions</span>
                  </div>
                  <div className="mt-2 text-sm font-bold leading-snug text-white">{c.name}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                    {stats && stats.plays > 0 && (
                      <>
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
                          best {Math.round(stats.bestAccuracy * 100)}%
                        </span>
                        <span>{stats.plays} runs</span>
                        <span>🏆 {stats.victories}</span>
                      </>
                    )}
                    {wrong > 0 && (
                      <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">{wrong} to revise</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* ── step 3: mission config ── */}
      {chapter && (
        <section className="mt-8">
          <h2 className="font-pixel mb-3 text-[10px] text-amber-300">3 · CONFIGURE THE MISSION</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {MODES.map((m) => {
              const active = settings.mode === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m)}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    active ? 'border-amber-300 bg-amber-400/15' : 'border-white/10 bg-slate-800/60 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{m.name}</span>
                    <span className="font-pixel rounded bg-amber-400 px-1.5 py-0.5 text-[8px] text-slate-900">{m.badge}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-400">{m.tagline}</div>
                  <div className="mt-2 text-[10px] text-slate-300">
                    {m.monsters} monsters × 2 + {m.bossStreak} dragon streak
                  </div>
                  <div className="text-[10px] text-slate-500">~{m.estMinutes} min</div>
                </button>
              )
            })}
          </div>

          {/* custom sliders */}
          <button
            onClick={() => onSettings({ ...settings, mode: 'custom' })}
            className={`mt-3 w-full rounded-xl border-2 p-3 text-left transition-all ${
              settings.mode === 'custom' ? 'border-amber-300 bg-amber-400/15' : 'border-white/10 bg-slate-800/60 hover:border-white/30'
            }`}
          >
            <div className="text-sm font-bold text-white">⚙️ Custom Battle {settings.mode === 'custom' && <span className="text-[10px] text-amber-300">(active)</span>}</div>
          </button>
          {settings.mode === 'custom' && (
            <div className="mt-3 grid gap-4 rounded-xl border border-white/10 bg-slate-800/60 p-4 sm:grid-cols-2">
              <label className="block text-xs text-slate-300">
                Monsters: <span className="font-pixel ml-2 text-amber-300">{settings.monsters}</span>
                <input
                  type="range"
                  min={CUSTOM_LIMITS.monstersMin}
                  max={CUSTOM_LIMITS.monstersMax}
                  value={settings.monsters}
                  onChange={(e) => onSettings({ ...settings, monsters: +e.target.value })}
                  className="mt-2 w-full accent-amber-400"
                />
              </label>
              <label className="block text-xs text-slate-300">
                Dragon streak: <span className="font-pixel ml-2 text-amber-300">{settings.bossStreak}</span>
                <input
                  type="range"
                  min={CUSTOM_LIMITS.bossMin}
                  max={CUSTOM_LIMITS.bossMax}
                  value={settings.bossStreak}
                  onChange={(e) => onSettings({ ...settings, bossStreak: +e.target.value })}
                  className="mt-2 w-full accent-amber-400"
                />
              </label>
            </div>
          )}

          {/* weapon + pacing + practice */}
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <div className="font-pixel text-[8px] text-slate-400">WEAPON</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onSettings({ ...settings, weapon: 'fireball' })}
                  className={`flex-1 rounded-lg border-2 py-2 text-xs ${
                    settings.weapon === 'fireball' ? 'border-orange-400 bg-orange-500/20 text-orange-200' : 'border-white/15 text-slate-400'
                  }`}
                >
                  🔥 Fireball
                </button>
                <button
                  onClick={() => onSettings({ ...settings, weapon: 'bow' })}
                  className={`flex-1 rounded-lg border-2 py-2 text-xs ${
                    settings.weapon === 'bow' ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200' : 'border-white/15 text-slate-400'
                  }`}
                >
                  🏹 Bow
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <div className="font-pixel text-[8px] text-slate-400">ATTACK SPEED</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => onSettings({ ...settings, pacing: 'cinematic' })}
                  className={`flex-1 rounded-lg border-2 py-2 text-xs ${
                    settings.pacing === 'cinematic' ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'border-white/15 text-slate-400'
                  }`}
                >
                  🎬 3s epic
                </button>
                <button
                  onClick={() => onSettings({ ...settings, pacing: 'quick' })}
                  className={`flex-1 rounded-lg border-2 py-2 text-xs ${
                    settings.pacing === 'quick' ? 'border-amber-400 bg-amber-500/20 text-amber-200' : 'border-white/15 text-slate-400'
                  }`}
                >
                  ⚡ fast
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/60 p-3">
              <div className="font-pixel text-[8px] text-slate-400">FOCUS</div>
              <button
                disabled={mistakes === 0}
                onClick={() => onSettings({ ...settings, mistakesOnly: !settings.mistakesOnly })}
                className={`mt-2 w-full rounded-lg border-2 py-2 text-xs disabled:opacity-40 ${
                  settings.mistakesOnly ? 'border-rose-400 bg-rose-500/20 text-rose-200' : 'border-white/15 text-slate-300'
                }`}
              >
                🎯 Practise my mistakes ({mistakes})
              </button>
            </div>
          </div>

          {/* start */}
          <button
            onClick={onStart}
            disabled={!chapter}
            className="kq-btn-primary mt-6 w-full py-4 text-base"
          >
            ▶ NEXT: MISSION BRIEFING — {coreQuestions(settings)} core questions
            {settings.mistakesOnly ? ' (mistakes practice)' : ''}
          </button>
        </section>
      )}

      <footer className="mt-10 text-center text-[10px] text-slate-600">
        VidyaSaathi · The Knowledge Quest · an original educational adventure · {CHAPTERS.length} chapters from your Class 9 SST textbooks
      </footer>
    </div>
  )
}

const SUBJECT_ICONS: Record<string, string> = {
  landmark: '🏛️', globe: '🌍', scale: '⚖️', coins: '💰', rocket: '🚀',
}
