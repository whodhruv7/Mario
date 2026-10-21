'use client'

/* ── GameShell: orchestrates setup → briefing → play → result ──
 * Owns health, streaks, question flow, stats. The canvas engine is
 * presentation + platforming and reports events back here.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { CHAPTERS, getChapter, SUBJECTS } from '@/data/chapters'
import { MODES, MAX_HEALTH, coreQuestions, projectileMs, type RunSettings, type ModePreset } from '@/lib/game-config'
import {
  loadBank, loadBankMeta, selectRunQuestions, gradeAnswer,
  type Question, type Response, type BankMeta,
} from '@/lib/questions'
import {
  getSettings, applyRunResult, syncRunToServer, getMistakes, getChapterStats,
} from '@/lib/storage'
import type { EngineCallbacks, EngineConfig, KnowledgeQuestEngine, EncounterInfo } from '@/game/engine'
import { getAudio } from '@/game/audio'
import SetupScreen from './SetupScreen'
import HUD from './HUD'
import QuizPanel from './QuizPanel'
import TouchControls from './TouchControls'
import ResultScreen, { type ResultSummary } from './ResultScreen'

const GameCanvas = dynamic(() => import('./GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center bg-slate-900">
      <div className="font-pixel text-xs text-amber-300 animate-pulse">LOADING WORLD…</div>
    </div>
  ),
})

type Screen = 'setup' | 'briefing' | 'play' | 'result'
type Outcome = 'victory' | 'defeat' | 'incomplete'

interface EnemyDisplay {
  kind: 'monster' | 'boss'
  name: string
  title: string
  hpMax: number
  hpLeft: number
  index: number
  total: number
}

interface Runtime {
  chapterId: string
  settings: RunSettings
  questions: Question[]
  qIdx: number
  health: number
  coins: number
  crystals: number
  answered: number
  correct: number
  streak: number
  wrongIds: string[]
  rightIds: string[]
  enemy: EnemyDisplay | null
  monstersDefeated: number
  topicTally: Record<string, { right: number; wrong: number }>
  startedAt: number
  mistakesOnly: boolean
}

interface UiSnap {
  health: number
  coins: number
  crystals: number
  answered: number
  correct: number
  streak: number
  enemy: EnemyDisplay | null
  monstersDefeated: number
}

interface BannerData {
  kind: 'monster' | 'boss' | 'info'
  title: string
  sub: string
}

export default function GameShell() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [bank, setBank] = useState<Record<string, Question[]> | null>(null)
  const [meta, setMeta] = useState<BankMeta | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [settings, setSettings] = useState<RunSettings>({
    mode: 'adventure', monsters: 5, hitsPerMonster: 2, bossStreak: 10,
    weapon: 'fireball', pacing: 'cinematic', mistakesOnly: false,
  })
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [runKey, setRunKey] = useState(0)
  const [paused, setPaused] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [result, setResult] = useState<ResultSummary | null>(null)
  const [panelQ, setPanelQ] = useState<Question | null>(null)
  const [panelNum, setPanelNum] = useState(0)
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null)
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [ui, setUi] = useState<UiSnap | null>(null)
  const [engineReady, setEngineReady] = useState(false)
  const [statsVersion, setStatsVersion] = useState(0)

  const rt = useRef<Runtime | null>(null)
  const engineRef = useRef<KnowledgeQuestEngine | null>(null)
  const audio = useMemo(() => getAudio(), [])
  const submittedRef = useRef(false)

  /* ── load bank ── */
  useEffect(() => {
    let alive = true
    Promise.all([loadBank(), loadBankMeta()])
      .then(([b, m]) => {
        if (!alive) return
        setBank(b)
        setMeta(m)
      })
      .catch((e) => alive && setLoadError(String(e)))
    const s = getSettings()
    setSettings((prev) => ({ ...prev, weapon: s.weapon, pacing: s.pacing }))
    return () => { alive = false }
  }, [])

  /* ── banner auto-hide ── */
  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 2300)
    return () => clearTimeout(t)
  }, [banner])

  const snap = useCallback(() => {
    const r = rt.current
    if (!r) return
    setUi({
      health: r.health, coins: r.coins, crystals: r.crystals,
      answered: r.answered, correct: r.correct, streak: r.streak,
      enemy: r.enemy, monstersDefeated: r.monstersDefeated,
    })
  }, [])

  /* ── finish a run ── */
  const finishRun = useCallback((out: Outcome) => {
    const r = rt.current
    if (!r || outcome) return
    const durationSec = Math.round((Date.now() - r.startedAt) / 1000)
    const input = {
      chapterId: r.chapterId,
      mode: r.settings.mistakesOnly ? `${r.settings.mode}-practice` : r.settings.mode,
      outcome: out,
      answered: r.answered,
      correct: r.correct,
      coins: r.coins,
      crystals: r.crystals,
      healthLeft: r.health,
      wrongIds: r.wrongIds,
      rightIds: r.rightIds,
    }
    applyRunResult(input)
    syncRunToServer({ ...input, durationSec, monstersDefeated: r.monstersDefeated })
    const topics = Object.entries(r.topicTally).map(([topic, t]) => ({ topic, ...t }))
    setResult({
      outcome: out,
      chapterId: r.chapterId,
      answered: r.answered,
      correct: r.correct,
      coins: r.coins,
      crystals: r.crystals,
      healthLeft: r.health,
      monstersDefeated: r.monstersDefeated,
      monstersTotal: r.settings.mistakesOnly ? r.settings.monsters : r.settings.monsters,
      durationSec,
      streakBest: r.streak,
      topics,
      mistakesNow: getMistakes(r.chapterId).length,
      mode: input.mode,
    })
    setOutcome(out)
    setStatsVersion((v) => v + 1)
    setPanelQ(null)
    setFeedback(null)
    setScreen('result')
  }, [outcome])

  /* ── engine callbacks (stable wrappers → ref) ── */
  const cbRef = useRef<EngineCallbacks>({
    onEncounterIntro: () => {},
    onQuestionNeeded: () => {},
    onEncounterDefeated: () => {},
    onHeroDamaged: () => {},
    onPickup: () => {},
    onVictory: () => {},
    onDefeat: () => {},
    onAutoPause: () => {},
  })

  const liveCallbacks: EngineCallbacks = {
    onEncounterIntro: (info) => {
      const r = rt.current
      if (!r) return
      r.enemy = { ...info, hpLeft: info.hpMax, index: info.index, total: info.total }
      r.streak = 0
      snap()
      setBanner(
        info.kind === 'boss'
          ? { kind: 'boss', title: 'DRAVAK', sub: 'the Shadow Dragon — BOSS BATTLE!' }
          : { kind: 'monster', title: info.name.toUpperCase(), sub: `${info.title} — answer correctly to attack!` },
      )
    },
    onQuestionNeeded: () => {
      const r = rt.current
      if (!r) return
      if (r.qIdx >= r.questions.length) {
        finishRun('incomplete')
        return
      }
      submittedRef.current = false
      setPanelNum(r.qIdx + 1)
      setPanelQ(r.questions[r.qIdx])
      setFeedback(null)
    },
    onEncounterDefeated: (kind) => {
      const r = rt.current
      if (!r) return
      if (kind === 'monster') {
        r.monstersDefeated++
        setBanner({ kind: 'info', title: 'MONSTER DEFEATED!', sub: 'The path ahead is clear. Onward!' })
      } else {
        setBanner({ kind: 'info', title: 'DRAGON DEFEATED!', sub: 'Legendary! The Knowledge Crystal is yours!' })
      }
      snap()
    },
    onHeroDamaged: (dmg) => {
      const r = rt.current
      if (!r) return
      r.health = Math.max(0, r.health - dmg)
      snap()
      if (r.health <= 0) {
        setPanelQ(null)
        setFeedback(null)
        setTimeout(() => engineRef.current?.playDefeat(), 500)
      }
    },
    onPickup: (_kind, coins, crystals) => {
      const r = rt.current
      if (!r) return
      r.coins = coins
      r.crystals = crystals
      snap()
    },
    onVictory: () => finishRun('victory'),
    onDefeat: () => finishRun('defeat'),
    onAutoPause: () => {
      setPaused(true)
      engineRef.current?.setPaused(true)
    },
  }

  // keep the engine-wrapped ref pointing at the latest closures
  useEffect(() => {
    cbRef.current = liveCallbacks
  })

  const engineCallbacks = useMemo<EngineCallbacks>(
    () => ({
      onEncounterIntro: (...a) => cbRef.current.onEncounterIntro(...a),
      onQuestionNeeded: (...a) => cbRef.current.onQuestionNeeded(...a),
      onEncounterDefeated: (...a) => cbRef.current.onEncounterDefeated(...a),
      onHeroDamaged: (...a) => cbRef.current.onHeroDamaged(...a),
      onPickup: (...a) => cbRef.current.onPickup(...a),
      onVictory: (...a) => cbRef.current.onVictory(...a),
      onDefeat: (...a) => cbRef.current.onDefeat(...a),
      onAutoPause: (...a) => cbRef.current.onAutoPause(...a),
    }),
    [],
  )

  const handleEngineReady = useCallback((e: KnowledgeQuestEngine) => {
    engineRef.current = e
    setEngineReady(true)
  }, [])

  /* ── run control ── */
  const beginRun = useCallback((explicit?: RunSettings) => {
    if (!bank || !selectedChapter) return
    const s = explicit ?? settings
    const ch = getChapter(selectedChapter)!
    const pool = bank[ch.id] ?? []
    const core = coreQuestions(s)
    const questions = selectRunQuestions(pool, Math.max(core + 25, 60), {
      prioritiseIds: s.mistakesOnly ? getMistakes(ch.id) : [],
      fill: true,
    })
    rt.current = {
      chapterId: ch.id,
      settings: { ...s },
      questions,
      qIdx: 0,
      health: MAX_HEALTH,
      coins: 0,
      crystals: 0,
      answered: 0,
      correct: 0,
      streak: 0,
      wrongIds: [],
      rightIds: [],
      enemy: null,
      monstersDefeated: 0,
      topicTally: {},
      startedAt: Date.now(),
      mistakesOnly: settings.mistakesOnly,
    }
    setOutcome(null)
    setResult(null)
    setPanelQ(null)
    setFeedback(null)
    setPaused(false)
    setUi({
      health: MAX_HEALTH, coins: 0, crystals: 0, answered: 0, correct: 0,
      streak: 0, enemy: null, monstersDefeated: 0,
    })
    setRunKey((k) => k + 1)
    setScreen('play')
    setBanner({ kind: 'info', title: 'MISSION START', sub: ch.short })
  }, [bank, selectedChapter, settings])
  /* ── quiz answer flow ── */
  const handleResponse = useCallback(
    (resp: Response) => {
      const r = rt.current
      if (!r || !panelQ || submittedRef.current) return
      submittedRef.current = true
      const correct = gradeAnswer(panelQ, resp)
      r.answered++
      if (correct) {
        r.correct++
        r.rightIds.push(panelQ.id)
        if (r.enemy) r.enemy = { ...r.enemy, hpLeft: Math.max(0, r.enemy.hpLeft - 1) }
        if (r.enemy?.kind === 'boss') r.streak++
        audio.sfx('correct')
      } else {
        r.wrongIds.push(panelQ.id)
        if (r.enemy?.kind === 'boss') r.streak = 0
        audio.sfx('wrong')
      }
      const t = (r.topicTally[panelQ.topic] ??= { right: 0, wrong: 0 })
      if (correct) t.right++
      else t.wrong++
      snap()
      setFeedback({ correct })
      engineRef.current?.resolveAnswer(correct)
    },
    [panelQ, audio, snap],
  )

  const handleContinue = useCallback(() => {
    const r = rt.current
    if (!r) return
    r.qIdx++
    setPanelQ(null)
    setFeedback(null)
    engineRef.current?.continueAfterFeedback()
  }, [])

  /* ── pause / restart / quit ── */
  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p
      engineRef.current?.setPaused(next)
      return next
    })
  }, [])

  const restartRun = useCallback((explicit?: RunSettings) => {
    engineRef.current?.destroy()
    engineRef.current = null
    setEngineReady(false)
    if (explicit) setSettings(explicit)
    beginRun(explicit)
  }, [beginRun])

  const quitToSetup = useCallback(() => {
    engineRef.current?.destroy()
    engineRef.current = null
    setEngineReady(false)
    rt.current = null
    setPanelQ(null)
    setFeedback(null)
    setPaused(false)
    setScreen('setup')
  }, [])

  /* ── global keys (pause) ── */
  useEffect(() => {
    if (screen !== 'play') return
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!panelQ || feedback) togglePause()
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [screen, panelQ, feedback, togglePause])

  const chapter = selectedChapter ? getChapter(selectedChapter) : null
  const mode: ModePreset | undefined = MODES.find((m) => m.id === settings.mode)

  const engineCfg: EngineConfig | null = chapter && screen === 'play'
    ? {
        monsters: settings.monsters,
        hitsPerMonster: settings.hitsPerMonster,
        bossStreak: settings.bossStreak,
        weapon: settings.weapon,
        projectileMs: projectileMs(settings.weapon, settings.pacing),
        reducedMotion:
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }
    : null

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
      {/* ── SETUP ── */}
      {screen === 'setup' && (
        <SetupScreen
          bank={bank}
          meta={meta}
          loadError={loadError}
          settings={settings}
          onSettings={setSettings}
          selectedChapter={selectedChapter}
          onSelectChapter={setSelectedChapter}
          onStart={() => setScreen('briefing')}
          statsVersion={statsVersion}
        />
      )}

      {/* ── BRIEFING ── */}
      {screen === 'briefing' && chapter && (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="kq-card w-full max-w-2xl p-6 sm:p-8">
            <div className="font-pixel text-[10px] text-amber-400 sm:text-xs">MISSION BRIEFING</div>
            <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">{chapter.name}</h2>
            <div className="mt-1 text-sm text-slate-400">
              {chapter.part === 1 ? 'Exploring Society Part 1' : 'Exploring Society Part 2'} · {chapter.label}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="font-pixel text-[9px] text-emerald-300">ENEMY PLAN</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  <li>👾 {settings.monsters} alien monster{settings.monsters > 1 ? 's' : ''} — {settings.hitsPerMonster} correct answer{settings.hitsPerMonster > 1 ? 's' : ''} each</li>
                  <li>🐉 Dravak the Shadow Dragon — {settings.bossStreak} correct answers in a row</li>
                  <li>🎯 {coreQuestions(settings)} core questions to win</li>
                </ul>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                <div className="font-pixel text-[9px] text-rose-300">BATTLE RULES</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-200">
                  <li>❤️ You have {MAX_HEALTH} hearts. Wrong answer = monster hits you (−1)</li>
                  <li>🐲 Dragon attack costs −2 hearts and resets your streak</li>
                  <li>🪄 Weapon: {settings.weapon === 'fireball' ? 'Fireball (3s flight)' : 'Bow & Arrow (fast)'}</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-600/40 bg-slate-800/50 p-4 text-sm text-slate-300">
              <span className="font-pixel text-[9px] text-amber-300">CONTROLS</span>
              <span className="ml-3">
                Move: ← → / A D · Jump: Space · Touch buttons on mobile. Explanations appear after every answer —
                read them to learn!
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => { audio.init(); audio.resume(); beginRun() }}
                className="kq-btn-primary flex-1"
              >
                ▶ BEGIN MISSION
              </button>
              <button onClick={() => setScreen('setup')} className="kq-btn-ghost">
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAY ── */}
      {screen === 'play' && chapter && engineCfg && (
        <div className="relative flex w-full flex-1 flex-col items-center justify-center p-2 sm:p-4">
          <div className="relative w-full max-w-6xl">
            <div className="overflow-hidden rounded-xl border-2 border-amber-400/40 shadow-[0_0_60px_rgba(245,183,10,0.15)]">
              <GameCanvas
                key={runKey}
                cfg={engineCfg}
                callbacks={engineCallbacks}
                paused={paused}
                onReady={handleEngineReady}
              />
            </div>

            {/* HUD overlay */}
            {ui && (
              <HUD
                health={ui.health}
                coins={ui.coins}
                crystals={ui.crystals}
                answered={ui.answered}
                correct={ui.correct}
                streak={ui.streak}
                bossStreak={settings.bossStreak}
                enemy={ui.enemy}
                chapterShort={chapter.short}
                onPause={togglePause}
              />
            )}

            {/* encounter banner */}
            {banner && (
              <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex justify-center sm:top-24">
                <div className={`kq-banner ${banner.kind === 'boss' ? 'kq-banner-boss' : banner.kind === 'monster' ? 'kq-banner-monster' : 'kq-banner-info'}`}>
                  <div className="font-pixel text-sm sm:text-lg">{banner.title}</div>
                  <div className="mt-1 text-xs text-slate-200 sm:text-sm">{banner.sub}</div>
                </div>
              </div>
            )}

            {/* touch controls */}
            {engineReady && !panelQ && !paused && (
              <TouchControls onSet={(t) => engineRef.current?.setTouch(t)} />
            )}

            {/* pause overlay */}
            {paused && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                <div className="kq-card w-[min(92%,380px)] p-6 text-center">
                  <div className="font-pixel text-sm text-amber-300">PAUSED</div>
                  <div className="mt-6 space-y-3">
                    <button className="kq-btn-primary w-full" onClick={togglePause}>Resume</button>
                    <button className="kq-btn-ghost w-full" onClick={restartRun}>Restart Mission</button>
                    <button className="kq-btn-ghost w-full" onClick={quitToSetup}>Quit to Menu</button>
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audio.musicOn}
                        onChange={(e) => { audio.setMusic(e.target.checked) }}
                        className="accent-amber-400"
                      />
                      Music
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={audio.sfxOn}
                        onChange={(e) => { audio.sfxOn = e.target.checked }}
                        className="accent-amber-400"
                      />
                      Sound FX
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* quiz panel (below canvas on desktop, overlay on mobile) */}
          {panelQ && (
            <div className="fixed inset-x-0 bottom-0 z-50 px-2 pb-2 sm:px-4 sm:pb-4">
              <QuizPanel
                question={panelQ}
                num={panelNum}
                target={coreQuestions(settings)}
                enemyName={ui?.enemy?.name ?? 'Enemy'}
                feedback={feedback}
                onSubmit={handleResponse}
                onContinue={handleContinue}
              />
            </div>
          )}
        </div>
      )}

      {/* ── RESULT ── */}
      {screen === 'result' && result && (
        <ResultScreen
          summary={result}
          onRetry={() => restartRun({ ...settings, mistakesOnly: false })}
          onPractice={() => restartRun({ ...settings, mistakesOnly: true })}
          onNewMission={() => { setSettings((s) => ({ ...s, mistakesOnly: false })); quitToSetup() }}
        />
      )}

      {screen === 'play' && !panelQ && !paused && (
        <div className="pb-2 text-center text-[10px] text-slate-500 sm:text-xs">
          {SUBJECTS.length > 0 ? '' : ''}
          Press P or ⏸ to pause · Arrows/WASD to move · Space to jump
        </div>
      )}
    </div>
  )
}
