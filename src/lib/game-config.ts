/* ── VidyaSaathi: The Knowledge Quest — central game configuration ────────── */

export const MAX_HEALTH = 10

/** Damage values — every hit processed exactly once (see engine i-frames). */
export const DAMAGE = {
  wrongAnswerMonster: 1, // monster counterattack after a wrong answer
  dragonAttack: 2, // dragon counterattack after a wrong answer
  pitFall: 1, // falling into a pit while exploring
} as const

export const IFRAMES_MS = 1400

/** Projectile travel times (ms). Fireball's 3s is the signature cinematic attack. */
export const PROJECTILE_MS = {
  fireball: 3000,
  fireballQuick: 1000,
  arrow: 1100,
} as const

export type WeaponId = 'fireball' | 'bow'
export type PacingId = 'cinematic' | 'quick'

export interface ModePreset {
  id: 'quick' | 'standard' | 'adventure' | 'challenge' | 'custom'
  name: string
  tagline: string
  monsters: number
  hitsPerMonster: number
  bossStreak: number
  get core(): number
  estMinutes: number
  badge: string
}

function preset(
  id: ModePreset['id'],
  name: string,
  tagline: string,
  monsters: number,
  hitsPerMonster: number,
  bossStreak: number,
  estMinutes: number,
  badge: string,
): ModePreset {
  return {
    id, name, tagline, monsters, hitsPerMonster, bossStreak, estMinutes, badge,
    get core() {
      return monsters * hitsPerMonster + bossStreak
    },
  }
}

export const MODES: ModePreset[] = [
  preset('quick', 'Quick Quest', 'A fast warm-up sprint', 1, 2, 3, 4, '5 Q'),
  preset('standard', 'Standard Quest', 'The balanced mission', 2, 2, 6, 8, '10 Q'),
  preset('adventure', 'Adventure', 'The classic knowledge battle', 5, 2, 10, 15, '20 Q'),
  preset('challenge', 'Challenge Mode', 'Boss marathon for legends', 10, 2, 20, 30, '40 Q'),
]

export const CUSTOM_LIMITS = { monstersMin: 1, monstersMax: 12, bossMin: 2, bossMax: 25 }

export interface RunSettings {
  mode: ModePreset['id']
  monsters: number
  hitsPerMonster: number
  bossStreak: number
  weapon: WeaponId
  pacing: PacingId
  mistakesOnly: boolean
}

export const coreQuestions = (s: RunSettings) => s.monsters * s.hitsPerMonster + s.bossStreak

/** Encounter plan shown on the briefing screen. */
export function encounterPlan(s: RunSettings) {
  return {
    monsters: s.monsters,
    hitsPerMonster: s.hitsPerMonster,
    monsterQuestions: s.monsters * s.hitsPerMonster,
    bossStreak: s.bossStreak,
    core: coreQuestions(s),
  }
}

export function projectileMs(weapon: WeaponId, pacing: PacingId) {
  if (weapon === 'bow') return PROJECTILE_MS.arrow
  return pacing === 'quick' ? PROJECTILE_MS.fireballQuick : PROJECTILE_MS.fireball
}
