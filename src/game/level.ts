/* ── Level generation for VidyaSaathi: The Knowledge Quest ──
 * A Mario-style side-scrolling world: start pad → travel chunks with
 * platforms/coins/pits → monster arenas → boss gate → dragon arena → victory gate.
 */

import { MONSTER_DEFS } from './sprites'

export interface Solid {
  x: number
  y: number
  w: number
  h: number
  kind: 'ground' | 'platform'
}

export interface Pickup {
  kind: 'coin' | 'crystal'
  x: number
  y: number
  taken: boolean
  bob: number
}

export interface DecorItem {
  kind: 'bush' | 'tree' | 'grass'
  x: number
  y: number
  seed: number
}

export interface Zone {
  kind: 'monster' | 'boss'
  index: number
  triggerX: number // walking past this starts the encounter
  arenaStart: number
  battleSpotX: number // where the hero stands
  enemySpotX: number // where the enemy stands
  monsterKey: string
}

export interface LevelData {
  width: number
  groundY: number
  solids: Solid[]
  pickups: Pickup[]
  decor: DecorItem[]
  zones: Zone[]
  checkpoints: number[]
  gateX: number
  victoryX: number
  chestX: number
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GROUND_Y = 460
const GROUND_H = 90

export function buildLevel(monsters: number, seed = Date.now()): LevelData {
  const rnd = mulberry32(seed)
  const solids: Solid[] = []
  const pickups: Pickup[] = []
  const decor: DecorItem[] = []
  const zones: Zone[] = []
  const checkpoints: number[] = [60]

  let x = 0
  const addGround = (w: number) => {
    solids.push({ x, y: GROUND_Y, w, h: GROUND_H, kind: 'ground' })
    x += w
  }
  const addGap = (w: number) => {
    x += w
  }

  const coinArc = (cx: number, cy: number, n: number) => {
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1)) * Math.PI
      pickups.push({ kind: 'coin', x: cx + Math.cos(Math.PI - a) * 90 - 90, y: cy - Math.sin(a) * 55, taken: false, bob: rnd() * 6 })
    }
  }
  const coinRow = (cx: number, cy: number, n: number) => {
    for (let i = 0; i < n; i++) pickups.push({ kind: 'coin', x: cx + i * 34, y: cy, taken: false, bob: rnd() * 6 })
  }

  // ── start pad ──
  addGround(520)
  decor.push({ kind: 'tree', x: 90, y: GROUND_Y, seed: 1 })
  decor.push({ kind: 'bush', x: 300, y: GROUND_Y, seed: 2 })
  coinRow(200, GROUND_Y - 70, 4)

  // ── monster chunks ──
  for (let i = 0; i < monsters; i++) {
    const monsterKey = MONSTER_DEFS[i % MONSTER_DEFS.length].key

    // travel chunk with a gap + platforms
    addGround(240 + rnd() * 120)
    const gapW = 100 + rnd() * 40
    coinArc(x - 40, GROUND_Y - 40, 5)
    addGap(gapW)
    addGround(200 + rnd() * 100)

    // floating platforms + crystal
    const p1x = x + 60
    solids.push({ x: p1x, y: GROUND_Y - 130, w: 96, h: 30, kind: 'platform' })
    solids.push({ x: p1x + 150, y: GROUND_Y - 210, w: 96, h: 30, kind: 'platform' })
    pickups.push({ kind: 'crystal', x: p1x + 150 + 34, y: GROUND_Y - 250, taken: false, bob: rnd() * 6 })
    coinRow(p1x + 8, GROUND_Y - 165, 2)
    decor.push({ kind: 'bush', x: x + 20, y: GROUND_Y, seed: 3 + i })

    // small second gap sometimes
    if (rnd() > 0.5) {
      addGround(140 + rnd() * 80)
      coinArc(x - 30, GROUND_Y - 40, 4)
      addGap(90 + rnd() * 30)
    }
    addGround(120 + rnd() * 80)
    decor.push({ kind: 'tree', x: x - 60, y: GROUND_Y, seed: 5 + i })

    // ── arena (flat, no gaps) ──
    const arenaStart = x
    addGround(470)
    const battleSpotX = arenaStart + 130
    const enemySpotX = arenaStart + 330
    zones.push({
      kind: 'monster',
      index: i,
      triggerX: arenaStart - 170,
      arenaStart,
      battleSpotX,
      enemySpotX,
      monsterKey,
    })
    checkpoints.push(arenaStart + 40)
    coinRow(arenaStart + 210, GROUND_Y - 60, 0) // arena stays clean
  }

  // ── boss gate + arena ──
  addGround(200)
  const gateX = x - 100
  coinRow(x - 180, GROUND_Y - 60, 3)
  const bossArenaStart = x
  addGround(820)
  zones.push({
    kind: 'boss',
    index: 0,
    triggerX: bossArenaStart - 150,
    arenaStart: bossArenaStart,
    battleSpotX: bossArenaStart + 170,
    enemySpotX: bossArenaStart + 560,
    monsterKey: 'dragon',
  })
  checkpoints.push(bossArenaStart + 60)
  decor.push({ kind: 'bush', x: bossArenaStart + 40, y: GROUND_Y, seed: 9 })

  // ── victory area ──
  const victoryStart = x
  addGround(520)
  const victoryX = victoryStart + 260
  const chestX = victoryStart + 380
  coinRow(victoryStart + 60, GROUND_Y - 60, 6)
  decor.push({ kind: 'tree', x: victoryStart + 440, y: GROUND_Y, seed: 11 })
  decor.push({ kind: 'bush', x: victoryStart + 120, y: GROUND_Y, seed: 12 })

  return {
    width: x + 80,
    groundY: GROUND_Y,
    solids,
    pickups,
    decor,
    zones,
    checkpoints,
    gateX,
    victoryX,
    chestX,
  }
}
