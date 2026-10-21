/* ── Entities: hero, monsters, dragon, projectiles, particles ── */

import { heroSprite, monsterSprite, dragonSprites, tinted, coinSprite, crystalSprite, MONSTER_DEFS, type Sprite } from './sprites'
import type { Solid } from './level'

export interface InputState {
  left: boolean
  right: boolean
  jump: boolean
}

const GRAVITY = 2500
const MOVE_ACC = 2600
const MAX_SPEED = 330
const FRICTION_GROUND = 2400
const FRICTION_AIR = 500
const JUMP_V = 840
const COYOTE = 0.1
const JUMP_BUFFER = 0.12

export type HeroState =
  | 'idle' | 'run' | 'jump' | 'fall' | 'cast' | 'shoot' | 'hurt' | 'victory' | 'defeat'

export class Player {
  x: number
  y: number
  vx = 0
  vy = 0
  w = 36
  h = 64
  facing: 1 | -1 = 1
  onGround = false
  state: HeroState = 'idle'
  stateTimer = 0
  animTimer = 0
  iframes = 0
  coyote = 0
  jumpBuf = 0
  locked = false // battle: no control
  autoWalkTarget: number | null = null

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  get cx() { return this.x + this.w / 2 }
  get cy() { return this.y + this.h / 2 }

  update(dt: number, input: InputState, solids: Solid[], onJump?: () => void, onLand?: () => void) {
    this.animTimer += dt
    if (this.iframes > 0) this.iframes -= dt
    if (this.stateTimer > 0) {
      this.stateTimer -= dt
      if (this.stateTimer <= 0 && (this.state === 'cast' || this.state === 'shoot' || this.state === 'hurt')) {
        this.state = this.onGround ? 'idle' : 'fall'
      }
    }

    const control = !this.locked && this.state !== 'defeat' && this.state !== 'victory'

    // horizontal
    let dir = 0
    if (control) {
      if (input.left) dir -= 1
      if (input.right) dir += 1
    }
    if (this.autoWalkTarget !== null) {
      const d = this.autoWalkTarget - this.x
      dir = Math.abs(d) > 8 ? (d > 0 ? 1 : -1) : 0
      if (Math.abs(d) <= 8) this.autoWalkTarget = null
    }
    if (dir !== 0) {
      this.vx += dir * MOVE_ACC * dt
      this.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.vx))
      this.facing = dir > 0 ? 1 : -1
    } else {
      const fr = (this.onGround ? FRICTION_GROUND : FRICTION_AIR) * dt
      if (Math.abs(this.vx) <= fr) this.vx = 0
      else this.vx -= Math.sign(this.vx) * fr
    }

    // jump buffering + coyote
    if (control && input.jump) this.jumpBuf = JUMP_BUFFER
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt)
    if (this.onGround) this.coyote = COYOTE
    else this.coyote = Math.max(0, this.coyote - dt)

    if (this.jumpBuf > 0 && this.coyote > 0 && control) {
      this.vy = -JUMP_V
      this.onGround = false
      this.coyote = 0
      this.jumpBuf = 0
      onJump?.()
    }
    if (!input.jump && this.vy < -250) this.vy *= 0.94 // variable jump height

    this.vy += GRAVITY * dt
    this.vy = Math.min(this.vy, 1150)

    // move + collide X
    this.x += this.vx * dt
    for (const s of solids) {
      if (this.overlaps(s)) {
        if (this.vx > 0) this.x = s.x - this.w
        else if (this.vx < 0) this.x = s.x + s.w
        this.vx = 0
      }
    }
    this.x = Math.max(0, this.x)

    // move + collide Y
    const wasGround = this.onGround
    this.onGround = false
    this.y += this.vy * dt
    for (const s of solids) {
      if (this.overlaps(s)) {
        if (this.vy > 0) {
          this.y = s.y - this.h
          this.onGround = true
          if (!wasGround && this.vy > 500) onLand?.()
          this.vy = 0
        } else if (this.vy < 0) {
          this.y = s.y + s.h
          this.vy = 0
        }
      }
    }

    // state machine (visual)
    if (this.state === 'cast' || this.state === 'shoot' || this.state === 'hurt' || this.state === 'defeat' || this.state === 'victory') {
      // keep explicit state
    } else if (!this.onGround) {
      this.state = this.vy < 0 ? 'jump' : 'fall'
    } else if (Math.abs(this.vx) > 40) {
      this.state = 'run'
    } else {
      this.state = 'idle'
    }
  }

  private overlaps(s: Solid) {
    return this.x < s.x + s.w && this.x + this.w > s.x && this.y < s.y + s.h && this.y + this.h > s.y
  }

  draw(g: CanvasRenderingContext2D, camX: number, t: number) {
    let frame = 'idle'
    switch (this.state) {
      case 'idle': frame = Math.floor(t * 2) % 2 === 0 ? 'idle' : 'idle2'; break
      case 'run': {
        const c = Math.floor(this.animTimer * 10) % 4
        frame = c === 0 ? 'run1' : c === 1 ? 'run2' : c === 2 ? 'run3' : 'run2'
        break
      }
      case 'jump': frame = 'jump'; break
      case 'fall': frame = 'jump'; break
      case 'cast': frame = 'cast'; break
      case 'shoot': frame = 'shoot'; break
      case 'hurt': frame = 'idle'; break
      case 'victory': frame = Math.floor(t * 3) % 2 === 0 ? 'victory' : 'idle2'; break
      case 'defeat': frame = 'idle'; break
    }
    let spr: Sprite = heroSprite(frame as 'idle')
    if (this.iframes > 0 && Math.floor(this.iframes * 12) % 2 === 0) {
      spr = tinted(spr, '#FF5252', 0.55)
    }
    if (this.state === 'hurt') spr = tinted(spr, '#FF5252', 0.6)
    if (this.state === 'defeat') spr = tinted(spr, '#333344', 0.5)
    const dx = Math.round(this.x - camX - 10)
    const dy = Math.round(this.y - 16)
    if (this.facing === 1) {
      g.drawImage(spr, dx, dy)
    } else {
      g.save()
      g.translate(dx + spr.width, dy)
      g.scale(-1, 1)
      g.drawImage(spr, 0, 0)
      g.restore()
    }
  }
}

/* ───────────────────────── monsters ───────────────────────── */

export type EnemyState = 'hidden' | 'intro' | 'idle' | 'attack' | 'hurt' | 'dying' | 'dead'

export class Monster {
  key: string
  x: number
  y: number
  hp: number
  hpMax: number
  state: EnemyState = 'hidden'
  timer = 0
  bob = Math.random() * 10
  lungeT = -1

  constructor(key: string, x: number, groundY: number, hp: number) {
    this.key = key
    this.x = x
    this.y = groundY - 48
    this.hp = hp
    this.hpMax = hp
  }

  get def() { return MONSTER_DEFS.find((m) => m.key === this.key) ?? MONSTER_DEFS[0] }
  get cx() { return this.x + 24 }
  get cy() { return this.y + 24 }

  update(dt: number) {
    this.timer += dt
    this.bob += dt
    if (this.state === 'dying' && this.timer > 0.9) this.state = 'dead'
    if (this.lungeT >= 0) {
      this.lungeT += dt
      if (this.lungeT > 0.55) this.lungeT = -1
    }
  }

  hurt() {
    this.hp = Math.max(0, this.hp - 1)
    if (this.hp <= 0) {
      this.state = 'dying'
      this.timer = 0
    } else {
      this.state = 'hurt'
      this.timer = 0
    }
  }

  attack() {
    this.state = 'attack'
    this.timer = 0
    this.lungeT = 0
  }

  settle() {
    if (this.state === 'hurt' || this.state === 'attack' || this.state === 'intro') this.state = 'idle'
  }

  draw(g: CanvasRenderingContext2D, camX: number, t: number) {
    if (this.state === 'hidden' || this.state === 'dead') return
    let frame: 'idle' | 'idle2' | 'attack' = Math.floor(t * 2.4 + this.bob) % 2 === 0 ? 'idle' : 'idle2'
    if (this.state === 'intro' || this.state === 'attack' || this.lungeT >= 0) frame = 'attack'
    let spr = monsterSprite(this.key, frame)
    if (this.state === 'hurt') spr = tinted(spr, '#FF5252', 0.6)
    if (this.state === 'dying') {
      const p = this.timer / 0.9
      spr = tinted(spr, '#FFFFFF', 0.7)
      g.save()
      g.globalAlpha = 1 - p
      const squeeze = 1 - p * 0.6
      g.translate(Math.round(this.x - camX + 24), Math.round(this.y + 48))
      g.scale(squeeze, 2 - squeeze)
      g.drawImage(spr, -24, -48)
      g.restore()
      return
    }
    let dx = this.x
    let dy = this.y + Math.sin(this.bob * 2.2) * 3
    if (this.lungeT >= 0) {
      const p = Math.sin((this.lungeT / 0.55) * Math.PI)
      dx -= p * 90
      dy -= p * 10
    }
    g.drawImage(spr, Math.round(dx - camX), Math.round(dy))
  }
}

/* ───────────────────────── dragon boss ───────────────────────── */

export class Dragon {
  x: number
  y: number
  hp: number
  hpMax: number
  state: EnemyState = 'hidden'
  timer = 0
  breathT = -1

  constructor(x: number, groundY: number, hp: number) {
    this.x = x
    this.y = groundY - 118
    this.hp = hp
    this.hpMax = hp
  }

  get cx() { return this.x + 96 }
  get cy() { return this.y + 64 }

  update(dt: number) {
    this.timer += dt
    if (this.state === 'dying' && this.timer > 2.4) this.state = 'dead'
    if (this.breathT >= 0) {
      this.breathT += dt
      if (this.breathT > 1.1) this.breathT = -1
    }
  }

  hurt() {
    this.hp = Math.max(0, this.hp - 1)
    if (this.hp <= 0) {
      this.state = 'dying'
      this.timer = 0
    } else {
      this.state = 'hurt'
      this.timer = 0
    }
  }

  attack() {
    this.state = 'attack'
    this.timer = 0
    this.breathT = 0
  }

  settle() {
    if (this.state === 'hurt' || this.state === 'attack' || this.state === 'intro') this.state = 'idle'
  }

  draw(g: CanvasRenderingContext2D, camX: number, t: number) {
    if (this.state === 'hidden' || this.state === 'dead') return
    const s = dragonSprites()
    let spr = Math.floor(t * 1.6) % 2 === 0 ? s.idle : s.idle2
    if (this.state === 'attack' || this.breathT >= 0) spr = s.attack
    if (this.state === 'hurt') spr = tinted(spr, '#FF5252', 0.55)
    const dy = this.y + Math.sin(t * 1.3) * 6
    g.save()
    if (this.state === 'dying') {
      const p = Math.min(1, this.timer / 2.4)
      g.globalAlpha = 1 - p
      g.translate(Math.round(this.x - camX + 112), Math.round(dy + 72))
      g.rotate(p * 0.5)
      g.drawImage(spr, -112, -72)
      g.restore()
      return
    }
    g.drawImage(spr, Math.round(this.x - camX), Math.round(dy))
    g.restore()
  }
}

/* ───────────────────────── projectiles ───────────────────────── */

export class Projectile {
  kind: 'fireball' | 'arrow'
  x0: number
  y0: number
  x1: number
  y1: number
  t = 0
  dur: number
  done = false
  onTrail?: (x: number, y: number) => void

  constructor(kind: 'fireball' | 'arrow', x0: number, y0: number, x1: number, y1: number, dur: number) {
    this.kind = kind
    this.x0 = x0
    this.y0 = y0
    this.x1 = x1
    this.y1 = y1
    this.dur = dur / 1000
  }

  update(dt: number) {
    this.t += dt
    if (this.onTrail && this.t < this.dur) {
      const [x, y] = this.pos()
      this.onTrail(x, y)
    }
    if (this.t >= this.dur) this.done = true
  }

  pos(): [number, number] {
    const p = Math.min(1, this.t / this.dur)
    const x = this.x0 + (this.x1 - this.x0) * p
    let y = this.y0 + (this.y1 - this.y0) * p
    if (this.kind === 'fireball') y -= Math.sin(p * Math.PI) * 90
    return [x, y]
  }

  draw(g: CanvasRenderingContext2D, camX: number) {
    const [x, y] = this.pos()
    const p = Math.min(1, this.t / this.dur)
    if (this.kind === 'fireball') {
      const r = 12 + Math.sin(this.t * 22) * 2
      const grad = g.createRadialGradient(x - camX, y, 2, x - camX, y, r + 8)
      grad.addColorStop(0, '#FFF3C4')
      grad.addColorStop(0.4, '#FFB13D')
      grad.addColorStop(0.8, '#F55B1A')
      grad.addColorStop(1, 'rgba(245,91,26,0)')
      g.fillStyle = grad
      g.beginPath()
      g.arc(x - camX, y, r + 8, 0, Math.PI * 2)
      g.fill()
      // flickering tail
      g.fillStyle = 'rgba(255,177,61,0.7)'
      for (let i = 1; i <= 3; i++) {
        const tx = x - camX - i * 14 * Math.sign(this.x1 - this.x0 || 1)
        g.beginPath()
        g.arc(tx, y + Math.sin(this.t * 18 + i) * 4, r * (1 - i * 0.25), 0, Math.PI * 2)
        g.fill()
      }
    } else {
      // arrow with slight rotation along path
      const angle = Math.atan2(this.y1 - this.y0, this.x1 - this.x0) + Math.sin(p * Math.PI) * 0.25
      g.save()
      g.translate(x - camX, y)
      g.rotate(angle)
      g.strokeStyle = '#8A5A30'
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(-18, 0)
      g.lineTo(14, 0)
      g.stroke()
      g.fillStyle = '#E8EAF0'
      g.beginPath()
      g.moveTo(22, 0)
      g.lineTo(12, -4)
      g.lineTo(12, 4)
      g.closePath()
      g.fill()
      g.fillStyle = '#F5B70A'
      g.fillRect(-20, -5, 6, 10)
      g.restore()
    }
  }
}

/* ───────────────────────── particles ───────────────────────── */

interface P {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  grav: number
  shape: 'rect' | 'circle'
}

export class ParticleSystem {
  private ps: P[] = []

  spawn(x: number, y: number, opts: Partial<P> & { count?: number; spread?: number; speed?: number } = {}) {
    const count = opts.count ?? 8
    const spread = opts.spread ?? Math.PI * 2
    const speed = opts.speed ?? 160
    for (let i = 0; i < count; i++) {
      const a = spread === Math.PI * 2 ? Math.random() * Math.PI * 2 : -Math.PI / 2 + (Math.random() - 0.5) * spread
      const v = speed * (0.4 + Math.random() * 0.8)
      this.ps.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0,
        maxLife: opts.maxLife ?? 0.7 + Math.random() * 0.4,
        color: opts.color ?? '#FFD65C',
        size: opts.size ?? 4 + Math.random() * 4,
        grav: opts.grav ?? 600,
        shape: opts.shape ?? 'rect',
      })
    }
  }

  update(dt: number) {
    for (const p of this.ps) {
      p.life += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += p.grav * dt
    }
    this.ps = this.ps.filter((p) => p.life < p.maxLife)
  }

  draw(g: CanvasRenderingContext2D, camX: number) {
    for (const p of this.ps) {
      g.globalAlpha = Math.max(0, 1 - p.life / p.maxLife)
      g.fillStyle = p.color
      if (p.shape === 'circle') {
        g.beginPath()
        g.arc(p.x - camX, p.y, p.size / 2, 0, Math.PI * 2)
        g.fill()
      } else {
        g.fillRect(p.x - camX - p.size / 2, p.y - p.size / 2, p.size, p.size)
      }
    }
    g.globalAlpha = 1
  }

  clear() { this.ps = [] }
}

/* pickup drawing */
export function drawPickup(g: CanvasRenderingContext2D, kind: 'coin' | 'crystal', x: number, y: number, camX: number, t: number, bob: number) {
  const dy = y + Math.sin(t * 3 + bob) * 4
  if (kind === 'coin') {
    g.drawImage(coinSprite(Math.floor(t * 8 + bob) % 4), Math.round(x - camX - 15), Math.round(dy))
  } else {
    g.save()
    g.shadowColor = '#22D3EE'
    g.shadowBlur = 14
    g.drawImage(crystalSprite(), Math.round(x - camX - 13), Math.round(dy - 18))
    g.restore()
  }
}
