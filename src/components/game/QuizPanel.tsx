'use client'

/* ── QuizPanel: the interactive bottom exercise panel — 8 exercise types ── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { TYPE_LABELS, correctAnswerText, type Question, type Response } from '@/lib/questions'

interface Props {
  question: Question
  num: number
  target: number
  enemyName: string
  feedback: { correct: boolean } | null
  onSubmit: (resp: Response) => void
  onContinue: () => void
}

const TYPE_ICON: Record<string, string> = {
  mcq: '🔤', truefalse: '⚖️', fillblank: '✏️', match: '🧩',
  order: '🔢', multiselect: '☑️', wrongstatement: '❌', assertion: '🧠',
}

const DIFF_STYLE: Record<string, string> = {
  easy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  hard: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
}

function shuffledIdx(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizPanel({ question, num, target, enemyName, feedback, onSubmit, onContinue }: Props) {
  const [text, setText] = useState('')
  const [multi, setMulti] = useState<number[]>([])
  const [selLeft, setSelLeft] = useState<number | null>(null)
  const [pairMap, setPairMap] = useState<Record<number, number>>({})
  const [order, setOrder] = useState<string[]>([])
  const [chosen, setChosen] = useState<Response | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  const continueRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const submitStampRef = useRef(0)

  const answered = feedback !== null

  const rightOrder = useMemo(() => shuffledIdx(5), [question.id])
  const initialOrder = useMemo(() => {
    const items = question.orderItems ?? []
    for (let attempt = 0; attempt < 12; attempt++) {
      const s = [...items].sort(() => Math.random() - 0.5)
      if (s.join('¦') !== items.join('¦') || items.length < 3) return s
    }
    return [...items].sort(() => Math.random() - 0.5)
  }, [question.id, question.orderItems])

  useEffect(() => {
    setText('')
    setMulti([])
    setSelLeft(null)
    setPairMap({})
    setOrder(initialOrder)
    setChosen(null)
    setHintOpen(false)
    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [question.id, initialOrder])

  const submit = (resp: Response) => {
    if (answered) return
    submitStampRef.current = performance.now()
    setChosen(resp)
    onSubmit(resp)
  }

  /* keyboard shortcuts */
  useEffect(() => {
    const keyIs = (e: KeyboardEvent, ...names: string[]) => names.includes(e.key) || names.includes(e.code)
    const h = (e: KeyboardEvent) => {
      if (answered) {
        // Guard: the SAME key event that submitted the answer must not also
        // trigger Continue (React flushes discrete events synchronously, so
        // this handler may already see answered=true while the event bubbles).
        if (performance.now() - submitStampRef.current < 350) return
        if (keyIs(e, 'Enter', ' ', 'NumpadEnter')) {
          e.preventDefault()
          onContinue()
        }
        return
      }
      if (document.activeElement?.tagName === 'INPUT') return
      const digit = ['1', '2', '3', '4', '5'].indexOf(e.key) >= 0
        ? ['1', '2', '3', '4', '5'].indexOf(e.key)
        : ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].indexOf(e.code)
      if (question.type === 'truefalse') {
        if (keyIs(e, 't', 'T')) submit({ kind: 'index', value: 0 })
        if (keyIs(e, 'f', 'F')) submit({ kind: 'index', value: 1 })
        return
      }
      if (digit >= 0) {
        if (question.type === 'mcq' || question.type === 'wrongstatement' || question.type === 'assertion') {
          if (digit < (question.options?.length ?? 0)) submit({ kind: 'index', value: digit })
        } else if (question.type === 'multiselect') {
          if (digit < (question.options?.length ?? 0)) {
            setMulti((m) => (m.includes(digit) ? m.filter((x) => x !== digit) : [...m, digit]))
          }
        }
      }
      if (question.type === 'multiselect' && keyIs(e, 'Enter') && multi.length >= 1) {
        submit({ kind: 'indices', value: multi })
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [answered, question, multi, onContinue])

  useEffect(() => {
    if (answered) setTimeout(() => continueRef.current?.focus(), 80)
  }, [answered])

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOrder(next)
  }

  const optionRowClass = (idx: number) => {
    const base = 'flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all '
    if (answered) {
      if (question.type === 'truefalse') return base + 'border-white/10 bg-slate-800/60 opacity-70'
      const isCorrect = (question.answer as number) === idx
      const isChosen = chosen?.kind === 'index' && (chosen as { value: number }).value === idx
      if (isCorrect) return base + 'border-emerald-400 bg-emerald-500/20'
      if (isChosen) return base + 'border-rose-400 bg-rose-500/20'
      return base + 'border-white/10 bg-slate-800/60 opacity-60'
    }
    return base + 'border-white/15 bg-slate-800/70 hover:border-amber-300 hover:bg-slate-700/80 active:scale-[0.99] cursor-pointer'
  }

  const pairsDone = Object.keys(pairMap).length === 5

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="kq-panel">
        {/* header */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span className="font-pixel rounded-md bg-amber-400 px-2 py-1 text-[9px] text-slate-900">Q{num}</span>
          <span className="rounded-md border border-white/15 bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
            {TYPE_ICON[question.type]} {TYPE_LABELS[question.type]}
          </span>
          <span className={`rounded-md border px-2 py-1 text-[10px] ${DIFF_STYLE[question.difficulty]}`}>
            {question.difficulty.toUpperCase()}
          </span>
          <span className="hidden rounded-md border border-white/10 bg-slate-800/60 px-2 py-1 text-[10px] text-slate-400 sm:inline">
            📖 {question.topic}
          </span>
          <span className="ml-auto text-[10px] text-slate-500">vs {enemyName}</span>
        </div>

        {/* body */}
        <div className="kq-scroll max-h-[46vh] overflow-y-auto px-4 py-4">
          {/* question text */}
          {question.type === 'assertion' ? (
            <div className="space-y-2">
              {question.q.split('\n').map((line, i) => (
                <div key={i} className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10 p-3 text-sm text-slate-100 sm:text-base">
                  {line}
                </div>
              ))}
            </div>
          ) : question.type === 'fillblank' ? (
            <div className="text-sm leading-relaxed text-slate-100 sm:text-base">
              {question.q.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <input
                      ref={inputRef}
                      value={text}
                      disabled={answered}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && text.trim() && !answered) submit({ kind: 'text', value: text })
                      }}
                      placeholder="answer"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="mx-1 inline-block w-36 rounded-md border-2 border-amber-300/70 bg-slate-900 px-2 py-0.5 text-center text-sm text-amber-200 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-300/40 disabled:opacity-60 sm:w-44"
                    />
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-slate-100 sm:text-base">{question.q}</p>
          )}

          {/* ── interactive area per type ── */}
          <div className="mt-4">
            {/* MCQ / WRONGSTATEMENT / ASSERTION options */}
            {(question.type === 'mcq' || question.type === 'wrongstatement' || question.type === 'assertion') && (
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options?.map((opt, i) => (
                  <button
                    key={i}
                    disabled={answered}
                    onClick={() => submit({ kind: 'index', value: i })}
                    className={optionRowClass(i)}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400/90 text-xs font-black text-slate-900">
                      {'ABCD'[i]}
                    </span>
                    <span className="text-sm text-slate-100">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* TRUE / FALSE */}
            {question.type === 'truefalse' && (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((v) => (
                  <button
                    key={v}
                    disabled={answered}
                    onClick={() => submit({ kind: 'index', value: v })}
                    className={`${optionRowClass(v)} justify-center !p-4 text-center`}
                  >
                    <span className={`text-lg font-black ${v === 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {v === 0 ? '✔ TRUE' : '✘ FALSE'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* MATCH THE FOLLOWING */}
            {question.type === 'match' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="font-pixel mb-2 text-[8px] text-amber-300">TAP A TERM…</div>
                  <div className="space-y-1.5">
                    {question.pairs?.map((p, i) => {
                      const paired = pairMap[i] !== undefined
                      return (
                        <button
                          key={i}
                          disabled={answered}
                          onClick={() => {
                            if (paired) {
                              const next = { ...pairMap }
                              delete next[i]
                              setPairMap(next)
                              setSelLeft(i)
                            } else setSelLeft(selLeft === i ? null : i)
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg border-2 p-2 text-left text-xs transition-all sm:text-sm ${
                            paired
                              ? 'border-cyan-400/70 bg-cyan-500/15 text-cyan-200'
                              : selLeft === i
                                ? 'border-amber-300 bg-amber-400/20 text-white'
                                : 'border-white/15 bg-slate-800/70 text-slate-200 hover:border-amber-300/60'
                          }`}
                        >
                          <span className="font-pixel flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10 text-[9px]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{p.l}</span>
                          <span>{paired ? '🔗' : selLeft === i ? '👆' : ''}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <div className="font-pixel mb-2 text-[8px] text-cyan-300">…THEN ITS MATCH</div>
                  <div className="space-y-1.5">
                    {rightOrder.map((ri) => {
                      const usedBy = Object.entries(pairMap).find(([, v]) => v === ri)?.[0]
                      return (
                        <button
                          key={ri}
                          disabled={answered || selLeft === null}
                          onClick={() => {
                            if (selLeft === null) return
                            const next = { ...pairMap }
                            for (const k of Object.keys(next)) if (next[+k] === ri) delete next[+k]
                            next[selLeft] = ri
                            setPairMap(next)
                            setSelLeft(null)
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg border-2 p-2 text-left text-xs transition-all sm:text-sm ${
                            usedBy !== undefined
                              ? 'border-cyan-400/40 bg-slate-800/40 text-slate-400 line-through'
                              : selLeft !== null
                                ? 'border-amber-300/70 bg-slate-700/80 text-white hover:bg-slate-600/80'
                                : 'border-white/15 bg-slate-800/70 text-slate-300'
                          }`}
                        >
                          <span className="flex-1">{question.pairs?.[ri].r}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ORDERING */}
            {question.type === 'order' && (
              <div className="space-y-1.5">
                {order.map((item, i) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-lg border-2 border-white/15 bg-slate-800/70 p-2"
                  >
                    <span className="font-pixel flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-400/90 text-[9px] text-slate-900">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-xs text-slate-100 sm:text-sm">{item}</span>
                    <div className="flex gap-1">
                      <button
                        disabled={answered || i === 0}
                        onClick={() => move(i, -1)}
                        className="rounded-md border border-white/20 bg-slate-700 px-2 py-1 text-xs text-white disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <button
                        disabled={answered || i === order.length - 1}
                        onClick={() => move(i, 1)}
                        className="rounded-md border border-white/20 bg-slate-700 px-2 py-1 text-xs text-white disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MULTISELECT */}
            {question.type === 'multiselect' && (
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options?.map((opt, i) => {
                  const on = multi.includes(i)
                  return (
                    <button
                      key={i}
                      disabled={answered}
                      onClick={() => setMulti((m) => (on ? m.filter((x) => x !== i) : [...m, i]))}
                      className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                        on
                          ? 'border-amber-300 bg-amber-400/20'
                          : 'border-white/15 bg-slate-800/70 hover:border-amber-300/60'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-xs font-black ${
                          on ? 'border-amber-300 bg-amber-400 text-slate-900' : 'border-white/30 text-slate-400'
                        }`}
                      >
                        {on ? '✓' : ''}
                      </span>
                      <span className="text-sm text-slate-100">{opt}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* feedback */}
          {answered && feedback && (
            <div className="mt-4 space-y-3">
              <div
                className={`rounded-xl border-2 p-3 ${
                  feedback.correct
                    ? 'border-emerald-400 bg-emerald-500/15'
                    : 'border-rose-400 bg-rose-500/15'
                }`}
              >
                <div className={`font-pixel text-xs sm:text-sm ${feedback.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {feedback.correct ? '✔ CORRECT!' : '✘ WRONG!'}
                </div>
                <div className="mt-1 text-xs text-slate-200 sm:text-sm">
                  {feedback.correct
                    ? `Veer unleashes the attack on ${enemyName}! 💥`
                    : `${enemyName} strikes back — read why:`}
                </div>
              </div>
              {!feedback.correct && (
                <div className="rounded-lg border border-white/15 bg-slate-800/70 p-3 text-xs text-slate-200 sm:text-sm">
                  <span className="font-bold text-amber-300">Correct answer: </span>
                  {correctAnswerText(question)}
                </div>
              )}
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs leading-relaxed text-slate-100 sm:text-sm">
                <span className="font-pixel mr-2 text-[8px] text-cyan-300">LEARN</span>
                {question.explanation}
              </div>
              <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-slate-300 sm:text-xs">
                <span className="font-pixel mr-2 text-[8px] text-amber-300">TEXTBOOK</span>
                {question.fact}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3">
          {!answered ? (
            <>
              {question.hint ? (
                <button
                  onClick={() => setHintOpen((h) => !h)}
                  className="rounded-lg border border-white/20 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-300/60"
                >
                  💡 {hintOpen ? 'Hide hint' : 'Hint'}
                </button>
              ) : (
                <span className="text-[10px] text-slate-600">no hint — trust your brain 🧠</span>
              )}
              <span className="ml-auto text-[10px] text-slate-500">
                {question.type === 'fillblank' ? 'Type the answer + press Enter' : question.type === 'truefalse' ? 'Keys: T / F' : 'Keys: 1-4'}
              </span>
              {question.type === 'multiselect' && (
                <button
                  disabled={multi.length < 1}
                  onClick={() => submit({ kind: 'indices', value: multi })}
                  className="kq-btn-primary !py-1.5 !text-xs"
                >
                  Submit ({multi.length})
                </button>
              )}
              {question.type === 'match' && (
                <button
                  disabled={!pairsDone}
                  onClick={() =>
                    submit({
                      kind: 'pairs',
                      value: (question.pairs ?? []).map((_, i) => pairMap[i] ?? -1),
                    })
                  }
                  className="kq-btn-primary !py-1.5 !text-xs"
                >
                  Submit pairs ({Object.keys(pairMap).length}/5)
                </button>
              )}
              {question.type === 'order' && (
                <button
                  onClick={() => submit({ kind: 'order', value: order })}
                  className="kq-btn-primary !py-1.5 !text-xs"
                >
                  Submit order
                </button>
              )}
            </>
          ) : (
            <button ref={continueRef} onClick={onContinue} className="kq-btn-primary ml-auto">
              Continue ▶ <span className="ml-1 text-[10px] opacity-70">(Enter)</span>
            </button>
          )}
        </div>

        {hintOpen && question.hint && !answered && (
          <div className="border-t border-amber-400/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-200">
            💡 {question.hint}
          </div>
        )}
        {question.type === 'match' && !answered && selLeft !== null && (
          <div className="border-t border-cyan-400/20 bg-cyan-500/5 px-4 py-2 text-[11px] text-cyan-200">
            Now tap the match on the right side.
          </div>
        )}
        <div className="px-4 pb-2 text-right text-[9px] text-slate-600">target {target} core questions</div>
      </div>
    </div>
  )
}
