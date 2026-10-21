/* ── VidyaSaathi: The Knowledge Quest — game engine ──
 * Canvas presentation + platforming + encounter choreography.
 * React (GameShell) owns health/streak/question flow; this engine renders
 * the world and plays combat animations, reporting events via callbacks.
 */

import { buildLevel, type LevelData, type Zone } from './level'
import { Player, Monster, Dragon, Projectile, ParticleSystem, drawPickup } from './entities'
import { groundTile, platformSprite, bushSprite, treeSprite, cloudSprite, flagSprite, gateSprite, chestSprite } from './sprites'
import { getAudio } from './audio'
import type { WeaponId } from '@/lib/game-config'
import { DAMAGE } from '@/lib/game-config'

export const VIEW_W = 960
export const VIEW_H = 540

export interface EngineConfig {
  monsters: number
  hitsPerMonster: number
  bossStreak: number
  weapon: WeaponId
  projectileMs: number
  reducedMotion: boolean
}

export interface EncounterInfo {
  kind: 'monster' | 'boss'
  index: number
  total: number
  name: string
  title: string
  hpMax: number
}

export interface EngineCallbacks {
  onEncounterIntro(info: EncounterInfo): void
  onQuestionNeeded(): void
  onEncounterDefeated(kind: 'monster' | 'boss', index: number): void
  onHeroDamaged(dmg: number, cause: 'wrong-answer' | 'pit'): void
  onPickup(kind: 'coin' | 'crystal', coins: number, crystals: number): void
  onVictory(): void
  onDefeat(): void
  onAutoPause(): void
}

type Phase =
  | 'explore'
  | 'encounter-intro'
  | 'battle-idle'
  | 'attack-anim'
  | 'counter-anim'
  | 'battle-resolved'
  | 'encounter-end'
  | 'boss-defeat'
  | 'victory-walk'
  | 'defeat'
  | 'done'

export class KnowledgeQuestEngine {
  private canvas: HTMLCanvasElement
  private g: CanvasRenderingContext2D
  private cfg: EngineConfig
  private cb: EngineCallbacks
  level: LevelData
  private player: Player
  private monsters: Monster[] = []
  private dragon: Dragon
  private projectiles: Projectile[] = []
  private particles = new ParticleSystem()
  private clouds: { x: number; y: number; layer: number; seed: number }[] = []
  private camX = 0
  private camTargetX = 0
  private phase: Phase = 'explore'
  private phaseT = 0
  private zoneIdx = -1
  private activeZone: Zone | null = null
  private currentCheckpoint = 0
  private coins = 0
  private crystals = 0
  private shake = { t: 0, mag: 0 }
  private slowmo = 0
  private raf = 0
  private lastT = 0
  private acc = 0
  private time = 0
  private paused = false
  private running = false
  private pendingAfterResolve = false
  private keys = { left: false, right: false, jump: false }
  private touch = { left: false, right: false, jump: false }
  private onKey: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void
  private onVis: () => void
  private audio = getAudio()

  constructor(canvas: HTMLCanvasElement, cfg: EngineConfig, cb: EngineCallbacks) {
    this.canvas = canvas
    this.canvas.width = VIEW_W
    this.canvas.height = VIEW_H
    this.g = canvas.getContext('2d')!
    this.g.imageSmoothingEnabled = false
    this.cfg = cfg
    this.cb = cb
    this.level = buildLevel(cfg.monsters)
    this.player = new Player(60, this.level.groundY - 200)

    for (const z of this.level.zones) {
      if (z.kind === 'monster') {
        this.monsters.push(new Monster(z.monsterKey, z.enemySpotX, this.level.groundY, cfg.hitsPerMonster))
      }
    }
    const bossZone = this.level.zones.find((z) => z.kind === 'boss')!
    this.dragon = new Dragon(bossZone.enemySpotX, this.level.groundY, cfg.bossStreak)

    // clouds along the world
    let cx = 0
    let i = 0
    while (cx < this.level.width) {
      this.clouds.push({ x: cx, y: 30 + Math.random() * 90, layer: i % 2 === 0 ? 0.25 : 0.45, seed: 1 + (i % 3) })
      cx += 260 + Math.random() * 240
      i++
    }

    const keyMatches = (e: KeyboardEvent, codes: string[], keys: string[]) =>
      codes.includes(e.code) || keys.includes(e.key)

    this.onKey = (e) => {
      if (keyMatches(e, ['ArrowLeft', 'KeyA'], ['ArrowLeft', 'a', 'A'])) this.keys.left = true
      if (keyMatches(e, ['ArrowRight', 'KeyD'], ['ArrowRight', 'd', 'D'])) this.keys.right = true
      if (keyMatches(e, ['Space', 'ArrowUp', 'KeyW'], [' ', 'ArrowUp', 'w', 'W'])) {
        this.keys.jump = true
        e.preventDefault()
      }
    }
    this.onKeyUp = (e) => {
      if (keyMatches(e, ['ArrowLeft', 'KeyA'], ['ArrowLeft', 'a', 'A'])) this.keys.left = false
      if (keyMatches(e, ['ArrowRight', 'KeyD'], ['ArrowRight', 'd', 'D'])) this.keys.right = false
      if (keyMatches(e, ['Space', 'ArrowUp', 'KeyW'], [' ', 'ArrowUp', 'w', 'W'])) this.keys.jump = false
    }
    this.onVis = () => {
      if (document.hidden && this.running && !this.paused) this.cb.onAutoPause()
    }
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('visibilitychange', this.onVis)
  }

  /* ── lifecycle ── */

  start() {
    this.running = true
    this.lastT = performance.now()
    this.audio.playTheme('adventure')
    const loop = (t: number) => {
      if (!this.running) return
      this.raf = requestAnimationFrame(loop)
      let dt = (t - this.lastT) / 1000
      this.lastT = t
      if (this.paused) {
        this.render()
        return
      }
      dt = Math.min(dt, 0.05)
      if (this.slowmo > 0) {
        this.slowmo -= dt
        dt *= 0.35
      }
      this.acc += dt
      const step = 1 / 60
      let guard = 0
      while (this.acc >= step && guard < 5) {
        this.update(step)
        this.acc -= step
        guard++
      }
      this.render()
    }
    this.raf = requestAnimationFrame(loop)
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('visibilitychange', this.onVis)
    this.audio.stopMusic()
  }

  setPaused(p: boolean) {
    this.paused = p
    if (p) this.audio.stopMusic()
    else {
      this.lastT = performance.now()
      this.syncMusic()
    }
  }

  setTouch(t: { left: boolean; right: boolean; jump: boolean } | null) {
    this.touch = t ?? { left: false, right: false, jump: false }
  }

  /* ── update ── */

  private update(dt: number) {
    this.time += dt
    this.phaseT += dt
    if (this.shake.t > 0) this.shake.t -= dt

    const input = {
      left: this.keys.left || this.touch.left,
      right: this.keys.right || this.touch.right,
      jump: this.keys.jump || this.touch.jump,
    }

    const battleLock = this.phase !== 'explore' && this.phase !== 'victory-walk'
    this.player.locked = battleLock

    this.player.update(
      dt,
      input,
      this.level.solids,
      () => this.audio.sfx('jump'),
      () => this.particles.spawn(this.player.cx, this.player.y + this.player.h, { count: 4, color: '#D9C9A8', speed: 80, maxLife: 0.4, grav: 300 }),
    )

    // camera
    if (this.phase === 'explore' || this.phase === 'victory-walk' || this.phase === 'encounter-intro') {
      this.camTargetX = this.player.cx - 380
    } else if (this.activeZone) {
      this.camTargetX = this.activeZone.arenaStart - (this.activeZone.kind === 'boss' ? 60 : 120)
    }
    this.camX += (Math.max(0, Math.min(this.level.width - VIEW_W, this.camTargetX)) - this.camX) * Math.min(1, dt * 6)

    // pickups
    if (this.phase === 'explore' || this.phase === 'victory-walk') {
      for (const p of this.level.pickups) {
        if (p.taken) continue
        const dx = p.x - this.player.cx
        const dy = p.y - this.player.cy
        if (dx * dx + dy * dy < 45 * 45) {
          p.taken = true
          if (p.kind === 'coin') {
            this.coins++
            this.audio.sfx('coin')
            this.particles.spawn(p.x, p.y, { count: 6, color: '#FFD65C', speed: 120, maxLife: 0.5, grav: 200 })
          } else {
            this.crystals++
            this.audio.sfx('crystal')
            this.particles.spawn(p.x, p.y, { count: 14, color: '#67E8F9', speed: 190, maxLife: 0.8, grav: 150, shape: 'circle' })
          }
          this.cb.onPickup(p.kind, this.coins, this.crystals)
        }
      }
    }

    // pit fall
    if (this.player.y > VIEW_H + 160 && this.phase === 'explore') {
      const cp = this.level.checkpoints.reduce((best, x) => (x <= this.player.x ? x : best), 0)
      this.currentCheckpoint = cp
      this.player.x = cp
      this.player.y = this.level.groundY - 240
      this.player.vy = 0
      this.player.iframes = 1.4
      this.player.state = 'fall'
      this.doShake(6)
      this.audio.sfx('hurt')
      this.cb.onHeroDamaged(DAMAGE.pitFall, 'pit')
    }

    // zone triggers — take the furthest zone whose trigger the player passed
    if (this.phase === 'explore') {
      let zi = -1
      for (let i = 0; i < this.level.zones.length; i++) {
        if (this.player.x > this.level.zones[i].triggerX) zi = i
      }
      if (zi >= 0 && zi !== this.zoneIdx) {
        this.zoneIdx = zi
        this.beginEncounter(this.level.zones[zi])
      }
    }

    // phase timelines
    this.updatePhase(dt)

    // entities
    for (const m of this.monsters) m.update(dt)
    this.dragon.update(dt)
    for (const pr of this.projectiles) {
      pr.onTrail = (x, y) => {
        if (this.cfg.reducedMotion) return
        this.particles.spawn(x, y, { count: 1, color: Math.random() > 0.5 ? '#FFB13D' : '#F55B1A', speed: 26, maxLife: 0.45, grav: -60, shape: 'circle', size: 6 })
      }
      pr.update(dt)
    }
    for (const pr of this.projectiles.filter((p) => p.done)) this.onProjectileHit(pr)
    this.projectiles = this.projectiles.filter((p) => !p.done)
    this.particles.update(dt)

    // dragon breath stream during counter
    if (this.phase === 'counter-anim' && this.activeZone?.kind === 'boss' && this.dragon.breathT >= 0 && this.dragon.breathT < 0.75) {
      const mouthX = this.dragon.cx - 70
      const mouthY = this.dragon.cy + 10
      const hx = this.player.cx
      const hy = this.player.cy
      const ang = Math.atan2(hy - mouthY, hx - mouthX) + (Math.random() - 0.5) * 0.5
      const sp = 420 + Math.random() * 200
      this.particles.spawn(mouthX, mouthY, {
        count: 2,
        color: Math.random() > 0.4 ? '#FF6B1A' : '#FFC53D',
        speed: sp,
        maxLife: 0.6,
        grav: -80,
        shape: 'circle',
        size: 10,
      })
      void ang
    }
  }

  private beginEncounter(z: Zone) {
    this.activeZone = z
    this.phase = 'encounter-intro'
    this.phaseT = 0
    this.pendingAfterResolve = false
    this.player.autoWalkTarget = z.battleSpotX
    this.doShake(z.kind === 'boss' ? 7 : 3)
    if (z.kind === 'boss') {
      this.dragon.state = 'intro'
      this.audio.sfx('roar')
      this.audio.playTheme('boss')
    } else {
      const m = this.monsters[z.index]
      m.state = 'intro'
      this.audio.playTheme('battle')
    }
  }

  private updatePhase(dt: number) {
    switch (this.phase) {
      case 'encounter-intro': {
        const boss = this.activeZone?.kind === 'boss'
        const dur = boss ? 2.3 : 1.7
        if (this.phaseT === dt || this.phaseT < dt * 1.5) {
          // fire intro event once, right at start
          const z = this.activeZone!
          const def = this.monsters[z.index]?.def
          this.cb.onEncounterIntro({
            kind: z.kind,
            index: z.index,
            total: z.kind === 'boss' ? 1 : this.cfg.monsters,
            name: z.kind === 'boss' ? 'Dravak' : def?.name ?? 'Alien',
            title: z.kind === 'boss' ? 'the Shadow Dragon' : def?.title ?? '',
            hpMax: z.kind === 'boss' ? this.cfg.bossStreak : this.cfg.hitsPerMonster,
          })
        }
        if (this.phaseT >= dur) {
          this.phase = 'battle-idle'
          this.phaseT = 0
          if (this.activeZone?.kind === 'boss') this.dragon.settle()
          else this.monsters[this.activeZone!.index]?.settle()
          this.cb.onQuestionNeeded()
        }
        break
      }
      case 'counter-anim': {
        const boss = this.activeZone?.kind === 'boss'
        if (this.phaseT >= (boss ? 1.35 : 1.05)) {
          this.phase = 'battle-resolved'
          this.phaseT = 0
          this.maybeProceed()
        } else if (this.phaseT >= (boss ? 0.8 : 0.42) && this.player.state !== 'hurt' && this.player.iframes <= 0) {
          this.player.state = 'hurt'
          this.player.stateTimer = boss ? 0.7 : 0.5
          this.player.iframes = 1.4
          const dmg = boss ? DAMAGE.dragonAttack : DAMAGE.wrongAnswerMonster
          this.cb.onHeroDamaged(dmg, 'wrong-answer')
          this.audio.sfx(boss ? 'dragonHit' : 'hurt')
          this.audio.sfx('heartLost')
          this.doShake(boss ? 10 : 5)
        }
        break
      }
      case 'encounter-end': {
        // If Continue was clicked during the attack/death animation, complete
        // the transition automatically (victory walk or back to exploring).
        if (this.pendingAfterResolve) {
          this.pendingAfterResolve = false
          const wasBoss = this.activeZone?.kind === 'boss'
          if (wasBoss) {
            this.phase = 'victory-walk'
            this.phaseT = 0
            this.player.autoWalkTarget = this.level.victoryX
            this.audio.playTheme('adventure')
          } else {
            this.phase = 'explore'
            this.phaseT = 0
            this.activeZone = null
            this.audio.playTheme('adventure')
          }
        }
        break
      }
      case 'boss-defeat': {
        if (this.phaseT < dt * 1.5) this.slowmo = 1.0
        if (this.phaseT >= 2.6) {
          this.phase = 'encounter-end'
          this.phaseT = 0
        }
        break
      }
      case 'victory-walk': {
        if (this.player.x >= this.level.victoryX - 20) {
          this.phase = 'done'
          this.player.state = 'victory'
          this.player.vx = 0
          this.audio.sfx('victory')
          this.celebrate()
          this.cb.onVictory()
        }
        break
      }
      case 'defeat': {
        if (this.phaseT >= 1.9) {
          this.phase = 'done'
          this.cb.onDefeat()
        }
        break
      }
    }
  }

  private celebrate() {
    if (this.cfg.reducedMotion) return
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.particles.spawn(200 + Math.random() * 560, -20, {
          count: 10,
          color: ['#FFD65C', '#FF6B9E', '#67E8F9', '#9B59D0', '#7DF27A'][Math.floor(Math.random() * 5)],
          speed: 60,
          spread: 0.6,
          maxLife: 2.2,
          grav: 260,
          size: 7,
          shape: 'rect',
        })
      }, i * 160)
    }
  }

  /** If React already acknowledged (Continue clicked during the attack
   *  animation), proceed to the next question as soon as we resolve. */
  private maybeProceed() {
    if (!this.pendingAfterResolve || this.phase !== 'battle-resolved') return
    this.pendingAfterResolve = false
    this.phase = 'battle-idle'
    this.phaseT = 0
    const boss = this.activeZone?.kind === 'boss'
    if (boss) this.dragon.settle()
    else this.monsters[this.activeZone!.index]?.settle()
    this.cb.onQuestionNeeded()
  }

  private doShake(mag: number) {
    if (this.cfg.reducedMotion) return
    this.shake = { t: 0.3, mag }
  }

  /* ── combat API (called by React) ── */

  resolveAnswer(correct: boolean) {
    if (this.phase !== 'battle-idle') return
    const boss = this.activeZone?.kind === 'boss'
    const enemy = boss ? this.dragon : this.monsters[this.activeZone!.index]
    if (!enemy) return

    if (correct) {
      this.phase = 'attack-anim'
      this.phaseT = 0
      this.player.facing = 1
      if (this.cfg.weapon === 'bow') {
        this.player.state = 'shoot'
        this.player.stateTimer = 0.5
        this.audio.sfx('arrow')
      } else {
        this.player.state = 'cast'
        this.player.stateTimer = 0.55
        this.audio.sfx('fireball')
      }
      const from = { x: this.player.cx + 20, y: this.player.cy - 6 }
      const to = boss ? { x: this.dragon.cx - 30, y: this.dragon.cy + 20 } : { x: enemy.cx, y: enemy.cy }
      setTimeout(() => {
        if (!this.running || this.paused) return
        this.projectiles.push(new Projectile(this.cfg.weapon === 'bow' ? 'arrow' : 'fireball', from.x, from.y, to.x, to.y, this.cfg.projectileMs))
      }, 320)
    } else {
      this.phase = 'counter-anim'
      this.phaseT = 0
      if (boss) {
        this.dragon.attack()
        this.audio.sfx('roar')
        this.doShake(8)
      } else {
        enemy.attack()
        this.audio.sfx('wrong')
      }
    }
  }

  private onProjectileHit(pr: Projectile) {
    const boss = this.activeZone?.kind === 'boss'
    const enemy = boss ? this.dragon : this.monsters[this.activeZone!.index]
    if (!enemy || enemy.state === 'dying' || enemy.state === 'dead') return
    const [hx, hy] = pr.pos()
    this.particles.spawn(hx, hy, {
      count: pr.kind === 'fireball' ? 18 : 10,
      color: pr.kind === 'fireball' ? '#FFB13D' : '#E8EAF0',
      speed: 220,
      maxLife: 0.6,
      grav: 400,
      shape: 'circle',
    })
    this.audio.sfx(pr.kind === 'fireball' ? 'impact' : 'impact')
    this.doShake(5)
    enemy.hurt()
    if (enemy.hp <= 0) {
      if (boss) {
        this.phase = 'boss-defeat'
        this.phaseT = 0
        this.audio.stopMusic()
        this.audio.sfx('roar')
        this.audio.sfx('monsterDown')
        this.cb.onEncounterDefeated('boss', 0)
      } else {
        this.audio.sfx('monsterDown')
        this.particles.spawn(enemy.cx, enemy.cy, { count: 16, color: '#9BEFE6', speed: 240, maxLife: 0.8, grav: 300 })
        this.phase = 'encounter-end'
        this.phaseT = 0
        this.cb.onEncounterDefeated('monster', this.activeZone!.index)
      }
    } else {
      this.phase = 'battle-resolved'
      this.phaseT = 0
      this.maybeProceed()
    }
  }

  /** React calls this when the student closes the feedback panel. */
  continueAfterFeedback() {
    // Attack/counter animation still playing: queue the continue and proceed
    // automatically the moment the animation resolves (prevents dead-ends
    // from double Enter presses or fast continues).
    if (this.phase === 'attack-anim' || this.phase === 'counter-anim' || this.phase === 'boss-defeat') {
      this.pendingAfterResolve = true
      return
    }
    if (this.phase === 'battle-resolved') {
      // resolution already finished — proceed immediately
      this.pendingAfterResolve = true
      this.maybeProceed()
      return
    }
    if (this.phase === 'encounter-end') {
      const wasBoss = this.activeZone?.kind === 'boss'
      if (wasBoss) {
        this.phase = 'victory-walk'
        this.phaseT = 0
        this.player.autoWalkTarget = this.level.victoryX
        this.audio.playTheme('adventure')
      } else {
        this.phase = 'explore'
        this.phaseT = 0
        this.activeZone = null
        this.audio.playTheme('adventure')
        // reward sparkle trail
        this.particles.spawn(this.player.cx, this.player.cy, { count: 10, color: '#FFD65C', speed: 160, maxLife: 0.7, grav: 200 })
      }
      return
    }
    if (this.phase === 'battle-idle') {
      this.cb.onQuestionNeeded()
    }
  }

  /** React calls this when health reaches 0. */
  playDefeat() {
    if (this.phase === 'defeat' || this.phase === 'done') return
    this.phase = 'defeat'
    this.phaseT = 0
    this.pendingAfterResolve = false
    this.player.state = 'defeat'
    this.player.vx = 0
    this.audio.stopMusic()
    this.audio.sfx('defeat')
    this.doShake(6)
  }

  private syncMusic() {
    if (this.phase === 'boss-defeat' || this.phase === 'victory-walk' || this.phase === 'defeat' || this.phase === 'done') return
    if (this.phase === 'battle-idle' || this.phase === 'attack-anim' || this.phase === 'counter-anim' || this.phase === 'battle-resolved' || this.phase === 'encounter-end') {
      this.audio.playTheme(this.activeZone?.kind === 'boss' ? 'boss' : 'battle')
    } else {
      this.audio.playTheme('adventure')
    }
  }

  /* ── rendering ── */

  private render() {
    const g = this.g
    g.save()
    if (this.shake.t > 0) {
      const m = this.shake.mag * (this.shake.t / 0.3)
      g.translate((Math.random() - 0.5) * m * 2, (Math.random() - 0.5) * m * 2)
    }

    // sky
    const sky = g.createLinearGradient(0, 0, 0, VIEW_H)
    sky.addColorStop(0, '#69B7FF')
    sky.addColorStop(0.6, '#A7D8FF')
    sky.addColorStop(1, '#D8F0FF')
    g.fillStyle = sky
    g.fillRect(-20, -20, VIEW_W + 40, VIEW_H + 40)

    // sun
    const sunX = 800 - this.camX * 0.05
    g.save()
    g.shadowColor = 'rgba(255,235,150,0.9)'
    g.shadowBlur = 40
    g.fillStyle = '#FFF3B0'
    g.beginPath()
    g.arc(sunX, 78, 38, 0, Math.PI * 2)
    g.fill()
    g.restore()

    // far mountains
    this.drawRidge(0.12, 300, '#8FA8C8', 560, 260)
    this.drawRidge(0.2, 200, '#7A94BC', 480, 200)

    // clouds
    for (const c of this.clouds) {
      const sx = c.x - this.camX * c.layer
      if (sx < -140 || sx > VIEW_W + 60) continue
      g.globalAlpha = c.layer === 0.25 ? 0.75 : 0.95
      g.drawImage(cloudSprite(c.seed), Math.round(sx), Math.round(c.y))
    }
    g.globalAlpha = 1

    // hills
    this.drawHills(0.42, '#7EC850', 140)
    this.drawHills(0.62, '#5DAF48', 90)

    // decor (bushes/trees)
    for (const d of this.level.decor) {
      const sx = d.x - this.camX
      if (sx < -120 || sx > VIEW_W + 40) continue
      if (d.kind === 'tree') g.drawImage(treeSprite(d.seed), Math.round(sx), Math.round(d.y - 110))
      else if (d.kind === 'bush') g.drawImage(bushSprite(d.seed), Math.round(sx), Math.round(d.y - 34))
    }

    // checkpoints flags
    for (const cp of this.level.checkpoints) {
      const sx = cp - this.camX
      if (sx < -30 || sx > VIEW_W + 10) continue
      const passed = cp <= this.currentCheckpoint + 1
      g.drawImage(flagSprite(passed ? '#7DF27A' : '#F5B70A'), Math.round(sx), Math.round(this.level.groundY - 96))
    }

    // boss gate
    const gx = this.level.gateX - this.camX
    if (gx > -140 && gx < VIEW_W + 40) g.drawImage(gateSprite(), Math.round(gx), Math.round(this.level.groundY - 130))

    // chest
    const chx = this.level.chestX - this.camX
    if (chx > -80 && chx < VIEW_W + 40) {
      const open = this.phase === 'done' && this.player.x >= this.level.victoryX - 40
      g.drawImage(chestSprite(open), Math.round(chx), Math.round(this.level.groundY - 40))
    }

    // solids
    for (const s of this.level.solids) {
      const sx = s.x - this.camX
      if (sx > VIEW_W + 60 || sx + s.w < -60) continue
      if (s.kind === 'ground') {
        const tile = groundTile(48, 48)
        const startX = Math.floor(s.x / 48) * 48
        for (let tx = startX; tx < s.x + s.w; tx += 48) {
          const dx = tx - this.camX
          if (dx > VIEW_W + 48 || dx < -48) continue
          const rows = Math.ceil((s.h + (this.level.groundY - s.y)) / 48)
          for (let ty = 0; ty < rows; ty++) {
            g.drawImage(tile, Math.round(dx), Math.round(s.y + ty * 48))
          }
        }
      } else {
        g.drawImage(platformSprite(s.w), Math.round(sx), Math.round(s.y))
      }
    }

    // pickups
    for (const p of this.level.pickups) {
      if (p.taken) continue
      const sx = p.x - this.camX
      if (sx < -40 || sx > VIEW_W + 40) continue
      drawPickup(g, p.kind, p.x, p.y, this.camX, this.time, p.bob)
    }

    // enemies
    for (const m of this.monsters) m.draw(g, this.camX, this.time)
    this.dragon.draw(g, this.camX, this.time)

    // player
    this.player.draw(g, this.camX, this.time)

    // projectiles
    for (const pr of this.projectiles) pr.draw(g, this.camX)

    // particles
    this.particles.draw(g, this.camX)

    // defeat fade
    if (this.phase === 'defeat' || (this.phase === 'done' && this.player.state === 'defeat')) {
      g.fillStyle = `rgba(10,8,20,${Math.min(0.55, this.phaseT * 0.4)})`
      g.fillRect(0, 0, VIEW_W, VIEW_H)
    }

    g.restore()

    // vignette
    const vg = g.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.55, VIEW_W / 2, VIEW_H / 2, VIEW_H * 1.05)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(10,20,40,0.22)')
    g.fillStyle = vg
    g.fillRect(0, 0, VIEW_W, VIEW_H)
  }

  private drawRidge(par: number, baseY: number, col: string, amp: number, wl: number) {
    const g = this.g
    g.fillStyle = col
    g.beginPath()
    g.moveTo(0, VIEW_H)
    const off = this.camX * par
    for (let x = -40; x <= VIEW_W + 40; x += 20) {
      const wx = x + off
      const y = baseY - Math.abs(Math.sin(wx / wl)) * amp
      g.lineTo(x, y)
    }
    g.lineTo(VIEW_W, VIEW_H)
    g.closePath()
    g.fill()
  }

  private drawHills(par: number, col: string, r: number) {
    const g = this.g
    g.fillStyle = col
    const off = this.camX * par
    const step = r * 1.8
    const first = Math.floor(off / step) * step
    for (let wx = first - step; wx < off + VIEW_W + step; wx += step) {
      const sx = wx - off
      g.beginPath()
      g.arc(sx, this.level.groundY + r * 0.55, r, Math.PI, 0)
      g.closePath()
      g.fill()
    }
  }
}
