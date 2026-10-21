/* ── VidyaSaathi: The Knowledge Quest — procedural pixel-art sprite factory ──
 * All characters are ORIGINAL creations drawn as pixel matrices.
 * Hero: "Veer", a young explorer with flight goggles & scarf.
 * Small monsters: the alien Grubbles family. Boss: Dravak the Shadow Dragon.
 */

export type Sprite = HTMLCanvasElement

const cache = new Map<string, Sprite>()

/** Build a sprite canvas from string rows + palette. Resilient: pads/truncates rows. */
export function px(
  rows: string[],
  palette: Record<string, string>,
  scale = 4,
  w?: number,
): Sprite {
  const width = w ?? Math.max(...rows.map((r) => r.length))
  const height = rows.length
  const c = document.createElement('canvas')
  c.width = width * scale
  c.height = height * scale
  const g = c.getContext('2d')!
  for (let y = 0; y < height; y++) {
    const row = rows[y]
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? '.'
      if (ch === '.' || ch === ' ') continue
      const col = palette[ch]
      if (!col) continue
      g.fillStyle = col
      g.fillRect(x * scale, y * scale, scale, scale)
    }
  }
  return c
}

function mirror(rows: string[]): string[] {
  return rows.map((r) => r.split('').reverse().join(''))
}

/* ══════════════════════════ HERO — "Veer" ══════════════════════════ */
/* 14×20 grid. Original character: goggles up on forehead, flowing scarf,
   teal explorer jacket, cargo pants, boots. Faces RIGHT. */

const HERO_PAL = {
  k: '#232331', // outline / eyes
  h: '#7A4A2B', // hair
  d: '#5A3319', // hair shade
  s: '#F2C9A0', // skin
  g: '#F5B70A', // goggles gold
  l: '#9BEFE6', // goggles lens
  t: '#2FA8A0', // jacket teal
  u: '#1F7A74', // jacket shade
  y: '#5BC9C1', // jacket light
  c: '#D9E0EA', // scarf light
  v: '#97A3B4', // scarf shade
  p: '#3E4450', // pants
  b: '#8A5A30', // boots
  n: '#5E3A1D', // boots dark
  f: '#F5B70A', // feather accent
}

const HERO_IDLE = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  '..ssssssssss..',
  '..ssksskssss..',
  '..sssssssss...',
  '...cccccccc...',
  '..cvccccccvc..',
  '..tttttttttt..',
  '.utttttttttu..',
  '.uttuuuuuttu..',
  '..ttttttttt...',
  '..ppppppppp...',
  '..ppp..pppp...',
  '..ppp..pppp...',
  '..bbb..bbbb...',
  '.nbbb..bbbbn..',
]

const HERO_IDLE2 = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  '..ssssssssss..',
  '..ssksskssss..',
  '..sssssssss...',
  '..vccccccccv..',
  '..cccccccccc..',
  '..tttttttttt..',
  '.utttttttttu..',
  '.uttuuuuuttu..',
  '..ttttttttt...',
  '..ppppppppp...',
  '..ppp..pppp...',
  '..ppp..pppp...',
  '..bbb..bbbb...',
  '.nbbb..bbbbn..',
]

const HERO_RUN1 = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  '..ssssssssss..',
  '..ssksskssss..',
  '..sssssssss...',
  '...cccccccc...',
  '..cvccccccvc..',
  '..tttttttttt..',
  '.uttttttttu...',
  '.uttuuuuuttf..',
  '..ttttttttt...',
  '..ppppppppp...',
  '.ppp....pppp..',
  '.pp......ppp..',
  '.bbb.....bbbb.',
  'nbbb......bbbn',
]

const HERO_RUN2 = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  '..ssssssssss..',
  '..ssksskssss..',
  '..sssssssss...',
  '...cccccccc...',
  '..cvccccccvc..',
  '..tttttttttt..',
  '.utttttttttu..',
  '.uttuuuuuttu..',
  '..ttttttttt...',
  '..ppppppppp...',
  '...pppppppp...',
  '...ppp..ppp...',
  '...bbb..bbb...',
  '..nbbb..bbbn..',
]

const HERO_RUN3 = mirror(HERO_RUN1).map((r) =>
  // keep the face reading rightwards after mirror: restore eye row + goggles
  r,
)

const HERO_JUMP = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  'c.ssssssssss..',
  'cv.sskssksss...',
  '.c.sssssssss..',
  '..ccccccccc...',
  '..cccccccccc..',
  '..tttttttttt..',
  '.uttttttttu...',
  '.uttuuuuuttf..',
  '..ttttttttt...',
  '..ppppppppp...',
  '..pppp.pppp...',
  '..bppp.bppp...',
  '.bbbb..bbbb...',
  '..bb....bb....',
]

const HERO_CAST = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  '..ssssssssss..',
  '..ssksskssss..',
  '..sssssssss...',
  '...cccccccc...',
  '..cvccccccvc..',
  '..tttttttttts.',
  '.utttttttttss.',
  '.uttuuuuuttf..',
  '..ttttttttt...',
  '..ppppppppp...',
  '..ppp..pppp...',
  '..ppp..pppp...',
  '..bbb..bbbb...',
  '.nbbb..bbbbn..',
]

const HERO_SHOOT = [
  '...hhhhhh.....',
  '..hhhhhhhhh...',
  '.hhhhhhhhhhh..',
  '.hgggggggggh..',
  '.hglllllllgh..',
  '.dhhhhhhhhhd..',
  '..ssssssssss..',
  '..ssksskssss..',
  '..sssssssss...',
  '...cccccccc...',
  '..cvccccccvc..',
  '..ttttttttttss',
  '.uttttttttusss',
  '.uttuuuuuttf..',
  '..ttttttttt...',
  '..ppppppppp...',
  '..ppp..pppp...',
  '..ppp..pppp...',
  '..bbb..bbbb...',
  '.nbbb..bbbbn..',
]

const HERO_VICTORY = [
  's...hhhhhh...s.',
  's..hhhhhhhhh.s.',
  's.hhhhhhhhhhh.s',
  '.shggggggggghs.',
  '.shglllllllgs..',
  '.d.hhhhhhhhh.d.',
  'c.sssssssssss..',
  'cv.ssksskssss..',
  '.c.sssssssss...',
  '...cccccccc....',
  '..cccccccccc...',
  '..tttttttttt...',
  '.utttttttttu...',
  '.uttuuuuuttuf..',
  '..ttttttttt....',
  '..ppppppppp....',
  '..ppp..pppp....',
  '..ppp..pppp....',
  '..bbb..bbbb....',
  '.nbbb..bbbbn...',
]

const HERO_FRAMES: Record<string, string[]> = {
  idle: HERO_IDLE,
  idle2: HERO_IDLE2,
  run1: HERO_RUN1,
  run2: HERO_RUN2,
  run3: HERO_RUN3,
  jump: HERO_JUMP,
  cast: HERO_CAST,
  shoot: HERO_SHOOT,
  victory: HERO_VICTORY,
}

export function heroSprite(frame: keyof typeof HERO_FRAMES | 'fall'): Sprite {
  const key = `hero:${frame}`
  if (cache.has(key)) return cache.get(key)!
  const rows = frame === 'fall' ? HERO_JUMP : HERO_FRAMES[frame] ?? HERO_IDLE
  const s = px(rows, HERO_PAL, 4, 14)
  cache.set(key, s)
  return s
}

/* ══════════════════════════ SMALL MONSTERS — alien family ══════════════════════════ */

export interface MonsterDef {
  key: string
  name: string
  title: string
  palette: Record<string, string>
  idle: string[]
  idle2: string[]
  attack: string[]
}

const K = '#1C1B2E'

export const MONSTER_DEFS: MonsterDef[] = [
  {
    key: 'grubble',
    name: 'Grubble',
    title: 'the One-Eyed Blob',
    palette: { k: K, G: '#5CB85C', D: '#3E8E3E', W: '#FFFFFF', P: '#1C1B2E', M: '#2F6B2F' },
    idle: [
      '.....kkkkkk.....',
      '...kkGGGGGGkk...',
      '..kGGGGGGGGGGk..',
      '.kGGGGGGGGGGGGk.',
      '.kGGGWWWWGGGGGk.',
      'kGGGWWPPWWGGGGGk',
      'kGGGWWPPWWGGGGGk',
      'kGGGGWWWWGGGGGGk',
      'kGGGGGGGGGGGGGGk',
      'kGGGkkkkkkGGGGGk',
      'kGGGGGGGGGGGGGGk',
      '.kGGGGGGGGGGGGk.',
      '.kGGGGGGGGGGGGk.',
      '..kGGGGGGGGGGk..',
      '...kkkkkkkkkk...',
      '..kk..kk..kk....',
    ],
    idle2: [
      '................',
      '.....kkkkkk.....',
      '...kkGGGGGGkk...',
      '..kGGGGGGGGGGk..',
      '.kGGGGGGGGGGGGk.',
      '.kGGGWWWWGGGGGk.',
      'kGGGWWPPWWGGGGGk',
      'kGGGWWPPWWGGGGGk',
      'kGGGGWWWWGGGGGGk',
      'kGGGGGGGGGGGGGGk',
      'kGGGkkkkkkGGGGGk',
      'kGGGGGGGGGGGGGGk',
      '.kGGGGGGGGGGGGk.',
      '.kGGGGGGGGGGGGk.',
      '..kGGGGGGGGGGk..',
      '..kkk.kkk..kk...',
    ],
    attack: [
      '.....kkkkkk.....',
      '...kkGGGGGGkk...',
      '..kGGGGGGGGGGk..',
      '.kGGGGGGGGGGGGk.',
      '.kGGGWWWWGGGGGk.',
      'kGGGWWPPWWGGGGGk',
      'kGGGWWPPWWGGGGGk',
      'kGGGGWWWWGGGGGGk',
      'kGGGGGGGGGGGGGGk',
      'kGkkkkkkkkkkkkGk',
      'kGDGDGDGDGDGDGDk',
      'kGGGGGGGGGGGGGGk',
      '.kGGGGGGGGGGGGk.',
      '.kGGGGGGGGGGGGk.',
      '..kGGGGGGGGGGk..',
      '.kk...kk...kk...',
    ],
  },
  {
    key: 'zapper',
    name: 'Zapper',
    title: 'the Storm Sprite',
    palette: { k: K, G: '#F5D442', D: '#C9A227', W: '#FFFFFF', P: '#1C1B2E', E: '#7DF2FF' },
    idle: [
      '.......k........',
      '......kEk.......',
      '.....kEEEk......',
      '....kkGGGkk.....',
      '...kGGGGGGGk....',
      '..kGGGGGGGGGk...',
      '.kGGWWGGGWWGGk..',
      '.kGGWPGGGPWGGk..',
      '.kGGGGGGGGGGGk..',
      '.kGGGkEkkEkGGk..',
      '.kGGGGkEkGGGGk..',
      '..kGGGGGGGGGk...',
      '...kGGGGGGGk....',
      '....kGGGGGk.....',
      '.....kkkkk......',
      '...kk..kk..kk...',
    ],
    idle2: [
      '.......k........',
      '......kEk.......',
      '.....kEEEk......',
      '....kkGGGkk.....',
      '...kGGGGGGGk....',
      '..kGGGGGGGGGk...',
      '.kGGWWGGGWWGGk..',
      '.kGGWPGGGPWGGk..',
      '.kGGGGGGGGGGGk..',
      '.kGGkEkGGkEkGk..',
      '.kGGGkEkGGkGGk..',
      '..kGGGGGGGGGk...',
      '...kGGGGGGGk....',
      '....kGGGGGk.....',
      '.....kkkkk......',
      '....kk.kk.kk....',
    ],
    attack: [
      '.......k........',
      '......kEk.......',
      '.....kEEEk......',
      '....kkGGGkk.....',
      '...kGGGGGGGk....',
      '..kGGGGGGGGGk...',
      '.kGGWWGGGWWGGk..',
      '.kGGWPGGGPWGGk..',
      '.kGGGGGGGGGGGk..',
      '.kGkEkEkEkEkGk..',
      '.kGkEkEkEkEkGk..',
      '..kGGGGGGGGGk...',
      '...kGGGGGGGk....',
      '....kGGGGGk.....',
      '.....kkkkk......',
      '..kk...kk...kk..',
    ],
  },
  {
    key: 'mawzor',
    name: 'Mawzor',
    title: 'the Spike Fiend',
    palette: { k: K, G: '#9B59D0', D: '#6C3FA4', W: '#FFFFFF', P: '#1C1B2E', R: '#E85D5D', T: '#FFFFFF' },
    idle: [
      '..k...k...k.....',
      '.kDk.kDk.kDk....',
      '.kDDkkDDkkDDk...',
      '..kDDDDDDDDk....',
      '.kGGGGGGGGGGk...',
      'kGGGGGGGGGGGGk..',
      'kGWWPGGGGPWWGk..',
      'kGWWPGGGGPWWGk..',
      'kGGGGGGGGGGGGk..',
      'kGkTkTkTkTkTkGk.',
      'kGTkTkTkTkTkTGk.',
      '.kGGGGGGGGGGk...',
      '..kGGGGGGGGk....',
      '...kGGGGGGk.....',
      '....kkkkkk......',
      '...kk..kk..kk...',
    ],
    idle2: [
      '................',
      '..k...k...k.....',
      '.kDk.kDk.kDk....',
      '.kDDkkDDkkDDk...',
      '..kDDDDDDDDk....',
      '.kGGGGGGGGGGk...',
      'kGGGGGGGGGGGGk..',
      'kGWWPGGGGPWWGk..',
      'kGWWPGGGGPWWGk..',
      'kGGGGGGGGGGGGk..',
      'kGkTkTkTkTkTkGk.',
      'kGTkTkTkTkTkTGk.',
      '.kGGGGGGGGGGk...',
      '..kGGGGGGGGk....',
      '...kGGGGGGk.....',
      '....kk.kk.kk....',
    ],
    attack: [
      '..k...k...k.....',
      '.kDk.kDk.kDk....',
      '.kDDkkDDkkDDk...',
      '..kDDDDDDDDk....',
      '.kGGGGGGGGGGk...',
      'kGGGGGGGGGGGGk..',
      'kGWWPGGGGPWWGk..',
      'kGWWPGGGGPWWGk..',
      'kGGGGGGGGGGGGk..',
      'kRRRRRRRRRRRRk..',
      'kRTRTRTRTRTRTRk.',
      '.kGGGGGGGGGGk...',
      '..kGGGGGGGGk....',
      '...kGGGGGGk.....',
      '....kkkkkk......',
      '..kk...kk...kk..',
    ],
  },
  {
    key: 'frostik',
    name: 'Frostik',
    title: 'the Ice Gremlin',
    palette: { k: K, G: '#5FB8E8', D: '#3B8FC4', W: '#FFFFFF', P: '#1C1B2E', I: '#CFF2FF' },
    idle: [
      '..k..k..k..k....',
      '.kIkkIkkIkkIk...',
      '..kIIIIIIIIk....',
      '.kGGGGGGGGGGk...',
      'kGGGGGGGGGGGGk..',
      'kGWWPGGGGPWWGk..',
      'kGWWPGGGGPWWGk..',
      'kGGGGGGGGGGGGk..',
      'kGGGkGGGGkGGGk..',
      'kGGGGGGGGGGGGk..',
      '.kGGGGGGGGGGk...',
      '..kIIIIIIIIk....',
      '...kGGGGGGk.....',
      '....kGGGGk......',
      '.....kkkk.......',
      '...kk..kk..kk...',
    ],
    idle2: [
      '................',
      '..k..k..k..k....',
      '.kIkkIkkIkkIk...',
      '..kIIIIIIIIk....',
      '.kGGGGGGGGGGk...',
      'kGGGGGGGGGGGGk..',
      'kGWWPGGGGPWWGk..',
      'kGWWPGGGGPWWGk..',
      'kGGGGGGGGGGGGk..',
      'kGGGkGGGGkGGGk..',
      'kGGGGGGGGGGGGk..',
      '.kGGGGGGGGGGk...',
      '..kIIIIIIIIk....',
      '...kGGGGGGk.....',
      '....kGGGGk......',
      '....kk.kk.kk....',
    ],
    attack: [
      '..k..k..k..k....',
      '.kIkkIkkIkkIk...',
      '..kIIIIIIIIk....',
      '.kGGGGGGGGGGk...',
      'kGGGGGGGGGGGGk..',
      'kGWWPGGGGPWWGk..',
      'kGWWPGGGGPWWGk..',
      'kGGGGGGGGGGGGk..',
      'kGIkIkIkIkIkGk..',
      'kGGGGGGGGGGGGk..',
      '.kGGGGGGGGGGk...',
      '..kIIIIIIIIk....',
      '...kGGGGGGk.....',
      '....kGGGGk......',
      '.....kkkk.......',
      '..kk...kk...kk..',
    ],
  },
  {
    key: 'embit',
    name: 'Embit',
    title: 'the Ember Hopper',
    palette: { k: K, G: '#E8703A', D: '#B54E22', W: '#FFFFFF', P: '#1C1B2E', F: '#FFC53D', Y: '#FFE08A' },
    idle: [
      '......kFk.......',
      '.....kFYFk......',
      '....kFFYFFk.....',
      '.....kkkkk......',
      '...kGGGGGGGk....',
      '..kGGGGGGGGGk...',
      '.kGWWPGGGPWWGk..',
      '.kGWWPGGGPWWGk..',
      '.kGGGGGGGGGGGk..',
      '.kGGGkkkkkGGGk..',
      '.kGGGGGGGGGGGk..',
      '..kGGGGGGGGGk...',
      '...kGGGGGGGk....',
      '....kGGGGGk.....',
      '.....kkkkk......',
      '...kk..kk..kk...',
    ],
    idle2: [
      '.......kFk......',
      '......kFYFk.....',
      '.....kFYFFk.....',
      '......kkkk......',
      '...kGGGGGGGk....',
      '..kGGGGGGGGGk...',
      '.kGWWPGGGPWWGk..',
      '.kGWWPGGGPWWGk..',
      '.kGGGGGGGGGGGk..',
      '.kGGGkkkkkGGGk..',
      '.kGGGGGGGGGGGk..',
      '..kGGGGGGGGGk...',
      '...kGGGGGGGk....',
      '....kGGGGGk.....',
      '.....kkkkk......',
      '....kk.kk.kk....',
    ],
    attack: [
      '....kFkFkFk.....',
      '...kFYFYFYFk....',
      '..kFFYFFYFFk....',
      '.....kkkkk......',
      '...kGGGGGGGk....',
      '..kGGGGGGGGGk...',
      '.kGWWPGGGPWWGk..',
      '.kGWWPGGGPWWGk..',
      '.kGGGGGGGGGGGk..',
      '.kGkkkkkkkkkGk..',
      '.kGGGGGGGGGGGk..',
      '..kGGGGGGGGGk...',
      '...kGGGGGGGk....',
      '....kGGGGGk.....',
      '.....kkkkk......',
      '..kk...kk...kk..',
    ],
  },
]

export function monsterSprite(key: string, frame: 'idle' | 'idle2' | 'attack'): Sprite {
  const sk = `monster:${key}:${frame}`
  if (cache.has(sk)) return cache.get(sk)!
  const def = MONSTER_DEFS.find((m) => m.key === key) ?? MONSTER_DEFS[0]
  const s = px(def[frame], def.palette, 3)
  cache.set(sk, s)
  return s
}

/* ══════════════════════════ DRAGON — "Dravak" ══════════════════════════ */
/* Code-drawn at low resolution (56×36) for a big, expressive boss that faces LEFT. */

export interface DragonSprites {
  idle: Sprite
  idle2: Sprite
  attack: Sprite
  wings: Sprite
}

export function dragonSprites(): DragonSprites {
  if (cache.has('dragon:all')) return cache.get('dragon:all') as DragonSprites
  const W = 56, H = 36, S = 4

  const make = (wingUp: boolean, attack: boolean): Sprite => {
    const c = document.createElement('canvas')
    c.width = W * S
    c.height = H * S
    const g = c.getContext('2d')!
    g.imageSmoothingEnabled = false
    const rect = (x: number, y: number, w: number, h: number, col: string) => {
      g.fillStyle = col
      g.fillRect(Math.round(x) * S, Math.round(y) * S, Math.round(w) * S, Math.round(h) * S)
    }
    const tri = (pts: number[][], col: string) => {
      g.fillStyle = col
      g.beginPath()
      pts.forEach(([x, y], i) => (i ? g.lineTo(x * S, y * S) : g.moveTo(x * S, y * S)))
      g.closePath()
      g.fill()
    }
    const P = '#7C3AAD', D = '#5B2B86', L = '#9B59D0', B = '#E8C86A', E = '#7DF27A', HO = '#EDE9FE', M = '#A855F7', k = '#241B33', F = '#FF6B1A'

    // tail (right side, curls up)
    tri([[44, 26], [54, 20], [52, 28]], D)
    tri([[42, 24], [50, 14], [48, 26]], P)
    tri([[50, 14], [54, 12], [52, 18]], D)

    // wing (behind body)
    if (wingUp) {
      tri([[24, 14], [34, 0], [36, 14]], M)
      tri([[24, 14], [30, 2], [24, 8]], D)
      tri([[26, 12], [33, 6], [33, 13]], M)
    } else {
      tri([[24, 12], [36, 16], [28, 20]], M)
      tri([[24, 12], [34, 14], [26, 18]], D)
    }

    // body
    rect(20, 16, 22, 10, P)
    rect(22, 18, 18, 6, L)
    // belly plates
    for (let i = 0; i < 6; i++) rect(22 + i * 3, 22 + (i % 2), 2, 3, B)
    // back spikes
    for (let i = 0; i < 5; i++) tri([[24 + i * 4, 16], [26 + i * 4, 12], [28 + i * 4, 16]], D)

    // legs + claws
    rect(24, 26, 5, 6, D)
    rect(34, 26, 5, 6, D)
    rect(23, 31, 7, 2, P)
    rect(33, 31, 7, 2, P)
    tri([[23, 32], [21, 34], [24, 33]], HO)
    tri([[33, 32], [31, 34], [34, 33]], HO)

    // neck (rises to the left)
    rect(12, 8, 10, 12, P)
    rect(13, 10, 8, 9, L)

    // head (left, facing player)
    rect(2, 4, 14, 9, P)
    rect(3, 6, 12, 5, L)
    // snout
    rect(0, 8, 6, 4, P)
    rect(0, 10, 3, 1, D)
    // horns
    tri([[8, 4], [7, 0], [11, 4]], HO)
    tri([[13, 4], [15, 0], [15, 5]], HO)
    // eye (green, glowing)
    rect(4, 6, 4, 3, k)
    rect(5, 7, 2, 2, E)
    if (attack) {
      // open mouth + fire glow
      rect(0, 12, 8, 4, k)
      tri([[0, 12], [8, 12], [4, 16]], F)
      tri([[0, 16], [6, 15], [2, 18]], '#FFC53D')
      rect(2, 5, 4, 2, '#FF9E5E')
    } else {
      // closed mouth line
      rect(0, 11, 7, 1, k)
    }
    // nostril
    rect(1, 9, 1, 1, k)

    // chest scar detail
    rect(26, 17, 2, 1, D)

    return c
  }

  const all: DragonSprites = {
    idle: make(true, false),
    idle2: make(false, false),
    attack: make(true, true),
    wings: make(false, true),
  }
  cache.set('dragon:all', all)
  return all
}

/* ══════════════════════════ WORLD TILES & PROPS ══════════════════════════ */

export function groundTile(w = 48, h = 48): Sprite {
  const key = `tile:${w}x${h}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  g.fillStyle = '#8B5A2B'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#7A4E24'
  for (let i = 0; i < 14; i++) {
    g.fillRect(Math.random() * w, 10 + Math.random() * (h - 10), 3, 3)
  }
  g.fillStyle = '#3FA33C'
  g.fillRect(0, 0, w, 9)
  g.fillStyle = '#57C04F'
  g.fillRect(0, 0, w, 4)
  g.fillStyle = '#2E7D32'
  for (let x = 0; x < w; x += 6) g.fillRect(x, 9, 2, 3)
  cache.set(key, c)
  return c
}

export function platformSprite(w = 96): Sprite {
  const key = `plat:${w}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = w
  c.height = 30
  const g = c.getContext('2d')!
  g.fillStyle = '#6B4226'
  g.fillRect(0, 8, w, 22)
  g.fillStyle = '#8B5A2B'
  g.fillRect(0, 8, w, 8)
  g.fillStyle = '#3FA33C'
  g.fillRect(0, 0, w, 10)
  g.fillStyle = '#57C04F'
  g.fillRect(0, 0, w, 4)
  g.fillStyle = '#5D3A1A'
  for (let x = 8; x < w - 6; x += 18) g.fillRect(x, 18, 8, 6)
  cache.set(key, c)
  return c
}

export function bushSprite(seed = 1): Sprite {
  const key = `bush:${seed}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = 72
  c.height = 34
  const g = c.getContext('2d')!
  const blob = (x: number, y: number, r: number, col: string) => {
    g.fillStyle = col
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  blob(20, 24, 13, '#2E7D32')
  blob(38, 20, 16, '#3FA33C')
  blob(54, 25, 12, '#2E7D32')
  blob(30, 16, 11, '#57C04F')
  cache.set(key, c)
  return c
}

export function treeSprite(seed = 1): Sprite {
  const key = `tree:${seed}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = 96
  c.height = 110
  const g = c.getContext('2d')!
  g.fillStyle = '#6B4226'
  g.fillRect(42, 60, 14, 50)
  g.fillStyle = '#5D3A1A'
  g.fillRect(54, 60, 4, 50)
  const blob = (x: number, y: number, r: number, col: string) => {
    g.fillStyle = col
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  blob(48, 34, 30, '#2E7D32')
  blob(30, 44, 20, '#3FA33C')
  blob(66, 44, 20, '#3FA33C')
  blob(48, 24, 18, '#57C04F')
  cache.set(key, c)
  return c
}

export function cloudSprite(seed = 1): Sprite {
  const key = `cloud:${seed}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = 120
  c.height = 52
  const g = c.getContext('2d')!
  g.fillStyle = 'rgba(255,255,255,0.92)'
  const blob = (x: number, y: number, r: number) => {
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  blob(30, 34, 16)
  blob(56, 24, 22)
  blob(84, 32, 18)
  blob(100, 38, 12)
  blob(16, 40, 10)
  cache.set(key, c)
  return c
}

export function coinSprite(frame: number): Sprite {
  const key = `coin:${frame}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = 30
  c.height = 30
  const g = c.getContext('2d')!
  const widths = [24, 18, 8, 18]
  const w = widths[frame % 4]
  g.fillStyle = '#F5B70A'
  g.beginPath()
  g.ellipse(15, 15, w / 2, 12, 0, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#FFD65C'
  g.beginPath()
  g.ellipse(15, 15, Math.max(2, w / 2 - 4), 8, 0, 0, Math.PI * 2)
  g.fill()
  if (frame % 4 === 0) {
    g.fillStyle = '#FFF3C4'
    g.fillRect(11, 8, 3, 6)
  }
  cache.set(key, c)
  return c
}

export function crystalSprite(): Sprite {
  if (cache.has('crystal')) return cache.get('crystal')!
  const c = document.createElement('canvas')
  c.width = 26
  c.height = 36
  const g = c.getContext('2d')!
  const poly = (pts: number[][], col: string) => {
    g.fillStyle = col
    g.beginPath()
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.closePath()
    g.fill()
  }
  poly([[13, 0], [24, 12], [13, 36], [2, 12]], '#22D3EE')
  poly([[13, 0], [24, 12], [13, 20]], '#67E8F9')
  poly([[13, 0], [2, 12], [13, 20]], '#0891B2')
  poly([[13, 2], [18, 10], [13, 16], [8, 10]], '#A5F3FC')
  cache.set('crystal', c)
  return c
}

export function flagSprite(color = '#F5B70A'): Sprite {
  const key = `flag:${color}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = 14
  c.height = 96
  const g = c.getContext('2d')!
  g.fillStyle = '#D9E0EA'
  g.fillRect(2, 0, 4, 96)
  g.fillStyle = color
  g.beginPath()
  g.moveTo(6, 4)
  g.lineTo(14, 10)
  g.lineTo(6, 16)
  g.closePath()
  g.fill()
  g.fillStyle = '#F5B70A'
  g.beginPath()
  g.arc(4, 2, 4, 0, Math.PI * 2)
  g.fill()
  cache.set(key, c)
  return c
}

export function gateSprite(): Sprite {
  if (cache.has('gate')) return cache.get('gate')!
  const c = document.createElement('canvas')
  c.width = 110
  c.height = 130
  const g = c.getContext('2d')!
  g.fillStyle = '#8A8F98'
  g.fillRect(6, 16, 18, 114)
  g.fillRect(86, 16, 18, 114)
  g.fillRect(0, 0, 110, 22)
  g.fillStyle = '#6E7480'
  g.fillRect(6, 30, 18, 6)
  g.fillRect(6, 60, 18, 6)
  g.fillRect(6, 90, 18, 6)
  g.fillRect(86, 30, 18, 6)
  g.fillRect(86, 60, 18, 6)
  g.fillRect(86, 90, 18, 6)
  g.fillRect(0, 6, 110, 5)
  g.fillStyle = '#F5B70A'
  g.fillRect(52, 22, 6, 10)
  g.fillStyle = '#FFD65C'
  g.fillRect(50, 20, 10, 4)
  cache.set('gate', c)
  return c
}

export function chestSprite(open = false): Sprite {
  const key = `chest:${open}`
  if (cache.has(key)) return cache.get(key)!
  const c = document.createElement('canvas')
  c.width = 48
  c.height = 40
  const g = c.getContext('2d')!
  g.fillStyle = '#8A5A30'
  g.fillRect(2, 14, 44, 24)
  if (open) {
    g.fillStyle = '#FFD65C'
    g.fillRect(6, 10, 36, 8)
    g.fillStyle = '#F5B70A'
    g.fillRect(6, 4, 36, 8)
  } else {
    g.fillStyle = '#8A5A30'
    g.fillRect(2, 4, 44, 12)
  }
  g.fillStyle = '#F5B70A'
  g.fillRect(2, 18, 44, 4)
  g.fillRect(20, 14, 8, 10)
  g.fillStyle = '#6E7480'
  g.fillRect(22, 17, 4, 5)
  cache.set(key, c)
  return c
}

/** Tinted copy of a sprite (for hurt flashes). */
export function tinted(src: Sprite, color: string, alpha = 0.6): Sprite {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  const g = c.getContext('2d')!
  g.drawImage(src, 0, 0)
  g.globalAlpha = alpha
  g.globalCompositeOperation = 'source-atop'
  g.fillStyle = color
  g.fillRect(0, 0, c.width, c.height)
  return c
}
