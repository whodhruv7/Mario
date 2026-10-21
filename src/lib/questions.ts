/* ── Question bank loader, run selection & grading ── */

export type QuestionType =
  | 'mcq' | 'truefalse' | 'fillblank' | 'match' | 'order'
  | 'multiselect' | 'wrongstatement' | 'assertion'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Question {
  id: string
  type: QuestionType
  topic: string
  difficulty: Difficulty
  q: string
  options?: string[]
  answer?: number | 'true' | 'false'
  answerVariants?: string[]
  pairs?: { l: string; r: string }[]
  orderItems?: string[]
  answerIndices?: number[]
  hint?: string
  explanation: string
  fact: string
}

export interface BankMetaChapter {
  count: number
  types: Record<string, number>
  difficulty: Record<string, number>
  topics: string[]
}

export interface BankMeta {
  version: number
  chapters: Record<string, BankMetaChapter>
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Choose the Correct',
  truefalse: 'True or False',
  fillblank: 'Fill in the Blank',
  match: 'Match the Following',
  order: 'Arrange in Order',
  multiselect: 'Select All Correct',
  wrongstatement: 'Find the Incorrect',
  assertion: 'Assertion & Reason',
}

let bankPromise: Promise<Record<string, Question[]>> | null = null
let metaPromise: Promise<BankMeta> | null = null

export function loadBank(): Promise<Record<string, Question[]>> {
  if (!bankPromise) {
    bankPromise = fetch('/data/question-bank.json')
      .then((r) => {
        if (!r.ok) throw new Error(`bank fetch failed: ${r.status}`)
        return r.json()
      })
      .then((data: { chapters: Record<string, Question[]> }) => {
        const out: Record<string, Question[]> = {}
        for (const [cid, qs] of Object.entries(data.chapters)) {
          out[cid] = qs.filter(isValidQuestion)
        }
        return out
      })
      .catch((e) => {
        bankPromise = null
        throw e
      })
  }
  return bankPromise
}

export function loadBankMeta(): Promise<BankMeta> {
  if (!metaPromise) {
    metaPromise = fetch('/data/bank-meta.json')
      .then((r) => r.json())
      .catch((e) => {
        metaPromise = null
        throw e
      })
  }
  return metaPromise
}

export function isValidQuestion(q: Question): boolean {
  if (!q || !q.id || !q.q || !q.explanation) return false
  switch (q.type) {
    case 'mcq':
    case 'wrongstatement':
    case 'assertion':
      return Array.isArray(q.options) && q.options.length === 4 && typeof q.answer === 'number' && q.answer >= 0 && q.answer < 4
    case 'truefalse':
      return q.answer === 'true' || q.answer === 'false'
    case 'fillblank':
      return Array.isArray(q.answerVariants) && q.answerVariants.length > 0 && q.q.includes('___')
    case 'match':
      return Array.isArray(q.pairs) && q.pairs.length === 5
    case 'order':
      return Array.isArray(q.orderItems) && q.orderItems.length >= 3 && q.orderItems.length <= 5
    case 'multiselect':
      return Array.isArray(q.options) && q.options.length >= 4 && Array.isArray(q.answerIndices) && q.answerIndices.length >= 2
    default:
      return false
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Interleave by type so consecutive questions rarely share a format. */
function interleave(pool: Question[]): Question[] {
  const byType = new Map<string, Question[]>()
  for (const q of shuffle(pool)) {
    const list = byType.get(q.type) ?? []
    list.push(q)
    byType.set(q.type, list)
  }
  const out: Question[] = []
  let remaining = pool.length
  while (remaining > 0) {
    for (const [t, list] of byType) {
      if (list.length) {
        out.push(list.shift()!)
        remaining--
      }
      void t
    }
  }
  return out
}

export interface SelectionOpts {
  /** question ids to prioritise (mistakes practice) */
  prioritiseIds?: string[]
  /** include non-prioritised questions to fill the run */
  fill?: boolean
}

export function selectRunQuestions(
  chapterPool: Question[],
  count: number,
  opts: SelectionOpts = {},
): Question[] {
  const prio = opts.prioritiseIds ?? []
  const prioSet = new Set(prio)
  const mistakes = shuffle(chapterPool.filter((q) => prioSet.has(q.id)))
  const others = interleave(chapterPool.filter((q) => !prioSet.has(q.id)))

  let picked: Question[]
  if (prio.length > 0 && opts.fill !== false) {
    picked = [...mistakes, ...others]
  } else if (prio.length > 0) {
    picked = mistakes
  } else {
    picked = others
  }

  if (picked.length >= count) return picked.slice(0, count)
  // exhausted pool (tiny mistake banks): cycle
  const out = [...picked]
  let i = 0
  while (out.length < count && chapterPool.length > 0) {
    out.push(chapterPool[i % chapterPool.length])
    i++
  }
  return out
}

/* ── grading ── */

export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?"'`]/g, '')
}

export type Response =
  | { kind: 'index'; value: number } // mcq / truefalse-as-index / wrongstatement / assertion
  | { kind: 'text'; value: string } // fillblank
  | { kind: 'indices'; value: number[] } // multiselect
  | { kind: 'pairs'; value: number[] } // match: for each left i, the chosen right ORIGINAL index
  | { kind: 'order'; value: string[] } // order: current arrangement

export function gradeAnswer(q: Question, resp: Response): boolean {
  switch (q.type) {
    case 'mcq':
    case 'wrongstatement':
    case 'assertion':
      return resp.kind === 'index' && resp.value === q.answer
    case 'truefalse':
      return resp.kind === 'index' && ((resp.value === 0 && q.answer === 'true') || (resp.value === 1 && q.answer === 'false'))
    case 'fillblank': {
      if (resp.kind !== 'text') return false
      const v = normalizeText(resp.value)
      return (q.answerVariants ?? []).some((a) => normalizeText(a) === v)
    }
    case 'multiselect': {
      if (resp.kind !== 'indices') return false
      const a = [...resp.value].sort((x, y) => x - y)
      const b = [...(q.answerIndices ?? [])].sort((x, y) => x - y)
      return a.length === b.length && a.every((v, i) => v === b[i])
    }
    case 'match': {
      if (resp.kind !== 'pairs') return false
      return resp.value.length === 5 && resp.value.every((ri, li) => ri === li)
    }
    case 'order': {
      if (resp.kind !== 'order') return false
      const correct = q.orderItems ?? []
      return correct.length === resp.value.length && correct.every((item, i) => item === resp.value[i])
    }
    default:
      return false
  }
}

/** Human-readable correct answer for feedback. */
export function correctAnswerText(q: Question): string {
  switch (q.type) {
    case 'mcq':
    case 'wrongstatement':
    case 'assertion':
      return q.options?.[q.answer as number] ?? ''
    case 'truefalse':
      return q.answer === 'true' ? 'TRUE' : 'FALSE'
    case 'fillblank':
      return q.answerVariants?.[0] ?? ''
    case 'match':
      return (q.pairs ?? []).map((p) => `${p.l} → ${p.r}`).join('  •  ')
    case 'order':
      return (q.orderItems ?? []).join(' → ')
    case 'multiselect':
      return (q.answerIndices ?? []).map((i) => q.options?.[i]).filter(Boolean).join('  •  ')
    default:
      return ''
  }
}
