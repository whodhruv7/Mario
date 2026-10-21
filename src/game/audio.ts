/* ── VidyaSaathi: The Knowledge Quest — procedural chiptune audio ──
 * All music & SFX are synthesized original compositions (Web Audio API).
 */

type SfxName =
  | 'jump' | 'coin' | 'crystal' | 'click' | 'tick'
  | 'fireball' | 'arrow' | 'impact' | 'hurt' | 'correct' | 'wrong'
  | 'monsterDown' | 'roar' | 'dragonHit' | 'victory' | 'defeat' | 'heartLost'

type MusicTheme = 'adventure' | 'battle' | 'boss' | null

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

/** note rows: [midi, startBeat, lenBeats] */
type NoteRow = [number, number, number]

const THEMES: Record<'adventure' | 'battle' | 'boss', { bpm: number; lead: NoteRow[]; bass: NoteRow[] }> = {
  // Bright, bouncy overworld march (C major)
  adventure: {
    bpm: 132,
    lead: [
      [76, 0, 0.5], [76, 0.5, 0.5], [79, 1, 1], [72, 2, 1],
      [74, 3, 0.5], [76, 3.5, 0.5], [79, 4, 1], [84, 5, 0.5], [83, 5.5, 0.5],
      [79, 6, 1], [76, 7, 1], [74, 8, 0.5], [72, 8.5, 0.5], [74, 9, 1],
      [76, 10, 0.5], [74, 10.5, 0.5], [72, 11, 1], [67, 12, 2],
      [72, 14, 0.5], [74, 14.5, 0.5], [76, 15, 1], [79, 16, 1],
      [81, 17, 0.5], [79, 17.5, 0.5], [76, 18, 1], [72, 19, 1],
      [74, 20, 0.5], [76, 20.5, 0.5], [79, 21, 1], [76, 22, 2], [72, 24, 2],
    ],
    bass: [
      [48, 0, 1], [55, 1, 1], [48, 2, 1], [55, 3, 1],
      [45, 4, 1], [52, 5, 1], [45, 6, 1], [52, 7, 1],
      [43, 8, 1], [50, 9, 1], [43, 10, 1], [50, 11, 1],
      [48, 12, 1], [55, 13, 1], [48, 14, 1], [55, 15, 1],
      [48, 16, 1], [55, 17, 1], [45, 18, 1], [52, 19, 1],
      [43, 20, 1], [50, 21, 1], [48, 22, 2], [48, 24, 2],
    ],
  },
  // Tense but playful battle groove (A minor)
  battle: {
    bpm: 148,
    lead: [
      [69, 0, 0.5], [72, 0.5, 0.5], [76, 1, 0.5], [72, 1.5, 0.5],
      [69, 2, 0.5], [67, 2.5, 0.5], [69, 3, 1],
      [72, 4, 0.5], [76, 4.5, 0.5], [79, 5, 1], [76, 6, 0.5], [72, 6.5, 0.5],
      [71, 7, 1], [69, 8, 0.5], [72, 8.5, 0.5], [76, 9, 0.5], [79, 9.5, 0.5],
      [81, 10, 1], [79, 11, 0.5], [76, 11.5, 0.5], [72, 12, 2],
      [74, 14, 0.5], [76, 14.5, 0.5], [77, 15, 1], [76, 16, 2],
    ],
    bass: [
      [45, 0, 0.5], [45, 0.75, 0.25], [45, 1.5, 0.5], [52, 2, 1],
      [41, 3, 1], [45, 4, 0.5], [45, 4.75, 0.25], [45, 5.5, 0.5], [52, 6, 1],
      [48, 7, 1], [45, 8, 0.5], [45, 8.75, 0.25], [45, 9.5, 0.5], [52, 10, 1],
      [44, 11, 1], [45, 12, 2], [41, 14, 1], [40, 15, 1], [45, 16, 2],
    ],
  },
  // Heavy boss theme (D minor, driving)
  boss: {
    bpm: 160,
    lead: [
      [62, 0, 0.5], [65, 0.5, 0.5], [69, 1, 0.5], [74, 1.5, 0.5],
      [72, 2, 0.5], [69, 2.5, 0.5], [65, 3, 0.5], [62, 3.5, 0.5],
      [61, 4, 0.5], [65, 4.5, 0.5], [68, 5, 0.5], [73, 5.5, 0.5],
      [72, 6, 0.5], [68, 6.5, 0.5], [65, 7, 0.5], [61, 7.5, 0.5],
      [62, 8, 1], [74, 9, 0.5], [72, 9.5, 0.5], [69, 10, 1],
      [65, 11, 0.5], [69, 11.5, 0.5], [74, 12, 2],
      [75, 14, 0.5], [74, 14.5, 0.5], [72, 15, 0.5], [69, 15.5, 0.5], [74, 16, 2],
    ],
    bass: [
      [38, 0, 0.5], [38, 0.75, 0.25], [38, 1.5, 0.5], [45, 2, 1],
      [37, 3, 1], [38, 4, 0.5], [38, 4.75, 0.25], [38, 5.5, 0.5], [45, 6, 1],
      [36, 7, 1], [38, 8, 0.5], [38, 8.75, 0.25], [38, 9.5, 0.5], [45, 10, 1],
      [41, 11, 1], [38, 12, 2], [34, 14, 1], [36, 15, 1], [38, 16, 2],
    ],
  },
}

export class KQAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private theme: MusicTheme = null
  private schedTimer: ReturnType<typeof setInterval> | null = null
  private nextBeat = 0
  private loopStart = 0
  musicOn = true
  sfxOn = true

  /** Must be called from a user gesture. */
  init() {
    if (this.ctx) return
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.55
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.5
    this.musicGain.connect(this.master)
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = 0.8
    this.sfxGain.connect(this.master)
  }

  resume() {
    this.ctx?.resume()
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    when = 0,
    dest?: GainNode,
    slideTo?: number,
  ) {
    if (!this.ctx || !this.sfxGain) return
    const t = this.ctx.currentTime + when
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(dest ?? this.sfxGain)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  private noise(dur: number, gain: number, when = 0, low = false) {
    if (!this.ctx || !this.sfxGain) return
    const t = this.ctx.currentTime + when
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(gain, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    let node: AudioNode = g
    if (low) {
      const f = this.ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 400
      g.connect(f)
      node = f
    }
    src.connect(g)
    node.connect(this.sfxGain)
    src.start(t)
    src.stop(t + dur)
  }

  sfx(name: SfxName) {
    if (!this.ctx || !this.sfxOn) return
    switch (name) {
      case 'jump': this.tone(280, 0.18, 'square', 0.18, 0, undefined, 620); break
      case 'coin': this.tone(midi(88), 0.07, 'square', 0.16); this.tone(midi(95), 0.22, 'square', 0.16, 0.07); break
      case 'crystal': this.tone(midi(93), 0.1, 'triangle', 0.22); this.tone(midi(100), 0.12, 'triangle', 0.2, 0.09); this.tone(midi(104), 0.25, 'triangle', 0.18, 0.19); break
      case 'click': this.tone(660, 0.05, 'square', 0.08); break
      case 'tick': this.tone(980, 0.03, 'square', 0.05); break
      case 'fireball': this.noise(0.35, 0.2); this.tone(340, 0.5, 'sawtooth', 0.16, 0, undefined, 90); break
      case 'arrow': this.tone(1200, 0.08, 'square', 0.12, 0, undefined, 300); this.noise(0.06, 0.08, 0.02); break
      case 'impact': this.noise(0.25, 0.3); this.tone(140, 0.25, 'sine', 0.3, 0, undefined, 50); break
      case 'hurt': this.tone(220, 0.2, 'sawtooth', 0.24, 0, undefined, 90); this.noise(0.12, 0.14); break
      case 'heartLost': this.tone(196, 0.3, 'triangle', 0.2, 0, undefined, 98); break
      case 'correct': [72, 76, 79, 84].forEach((m, i) => this.tone(midi(m), 0.16, 'square', 0.16, i * 0.07)); break
      case 'wrong': this.tone(150, 0.28, 'square', 0.2); this.tone(110, 0.3, 'square', 0.18, 0.1); break
      case 'monsterDown': [76, 72, 67, 60].forEach((m, i) => this.tone(midi(m), 0.14, 'square', 0.18, i * 0.08)); this.noise(0.3, 0.12, 0.3); break
      case 'roar': this.tone(90, 0.9, 'sawtooth', 0.3, 0, undefined, 45); this.noise(0.8, 0.2, 0.05, true); this.tone(60, 0.9, 'square', 0.14, 0.1, undefined, 40); break
      case 'dragonHit': this.noise(0.2, 0.26); this.tone(110, 0.3, 'sawtooth', 0.22, 0, undefined, 60); break
      case 'victory': [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => this.tone(midi(m), 0.22, 'square', 0.18, i * 0.12)); [48, 52, 55, 60].forEach((m, i) => this.tone(midi(m), 0.3, 'triangle', 0.16, i * 0.24)); break
      case 'defeat': [69, 65, 62, 57].forEach((m, i) => this.tone(midi(m), 0.3, 'triangle', 0.2, i * 0.18)); break
    }
  }

  /* ---- music ---- */

  setMusic(on: boolean) {
    this.musicOn = on
    if (!on) this.stopMusic()
    else if (this.theme) {
      const t = this.theme
      this.theme = null
      this.playTheme(t)
    }
  }

  playTheme(theme: Exclude<MusicTheme, null>) {
    if (!this.ctx || !this.musicGain) return
    if (this.theme === theme) return
    this.stopMusic()
    if (!this.musicOn) {
      this.theme = theme
      return
    }
    this.theme = theme
    const t = THEMES[theme]
    const beat = 60 / t.bpm
    this.loopStart = this.ctx.currentTime + 0.1
    this.nextBeat = 0
    const totalBeats = Math.max(
      ...t.lead.map((n) => n[1] + n[2]),
      ...t.bass.map((n) => n[1] + n[2]),
    )
    const schedule = () => {
      if (!this.ctx || this.theme !== theme) return
      const ahead = this.ctx.currentTime + 0.45
      while (this.loopStart + this.nextBeat * beat < ahead) {
        const b = this.nextBeat
        for (const [m, start, len] of t.lead) {
          if (start === b) this.tone(midi(m), len * beat * 0.9, 'square', 0.075, this.loopStart + start * beat - this.ctx.currentTime, this.musicGain)
        }
        for (const [m, start, len] of t.bass) {
          if (start === b) this.tone(midi(m), len * beat * 0.9, 'triangle', 0.12, this.loopStart + start * beat - this.ctx.currentTime, this.musicGain)
        }
        this.nextBeat++
        if (this.nextBeat >= totalBeats) {
          this.nextBeat = 0
          this.loopStart += totalBeats * beat
        }
      }
    }
    schedule()
    this.schedTimer = setInterval(schedule, 120)
  }

  stopMusic() {
    if (this.schedTimer) clearInterval(this.schedTimer)
    this.schedTimer = null
    this.theme = null
  }
}

let singleton: KQAudio | null = null
export function getAudio(): KQAudio {
  if (!singleton) singleton = new KQAudio()
  return singleton
}
