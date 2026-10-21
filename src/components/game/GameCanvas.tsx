'use client'

/* ── GameCanvas: mounts the engine onto a <canvas> ── */

import { useEffect, useRef } from 'react'
import { KnowledgeQuestEngine, VIEW_W, VIEW_H, type EngineCallbacks, type EngineConfig } from '@/game/engine'
import { getAudio } from '@/game/audio'

interface Props {
  cfg: EngineConfig
  callbacks: EngineCallbacks
  paused: boolean
  onReady: (engine: KnowledgeQuestEngine) => void
}

export default function GameCanvas({ cfg, callbacks, paused, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<KnowledgeQuestEngine | null>(null)
  const cbRef = useRef(callbacks)
  const readyRef = useRef(onReady)

  useEffect(() => {
    cbRef.current = callbacks
    readyRef.current = onReady
  }, [callbacks, onReady])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const engine = new KnowledgeQuestEngine(canvas, cfg, {
      onEncounterIntro: (...a) => cbRef.current.onEncounterIntro(...a),
      onQuestionNeeded: (...a) => cbRef.current.onQuestionNeeded(...a),
      onEncounterDefeated: (...a) => cbRef.current.onEncounterDefeated(...a),
      onHeroDamaged: (...a) => cbRef.current.onHeroDamaged(...a),
      onPickup: (...a) => cbRef.current.onPickup(...a),
      onVictory: (...a) => cbRef.current.onVictory(...a),
      onDefeat: (...a) => cbRef.current.onDefeat(...a),
      onAutoPause: (...a) => cbRef.current.onAutoPause(...a),
    })
    engineRef.current = engine
    engine.start()
    readyRef.current(engine)
    if (process.env.NODE_ENV !== 'production') {
      ;(window as unknown as Record<string, unknown>).__kqEngine = engine
    }

    const activateAudio = () => {
      const a = getAudio()
      a.init()
      a.resume()
    }
    canvas.addEventListener('pointerdown', activateAudio)
    window.addEventListener('keydown', activateAudio, { once: true })

    return () => {
      canvas.removeEventListener('pointerdown', activateAudio)
      window.removeEventListener('keydown', activateAudio)
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setPaused(paused)
  }, [paused])

  return (
    <canvas
      ref={canvasRef}
      width={VIEW_W}
      height={VIEW_H}
      className="block w-full touch-none select-none bg-sky-300"
      style={{ imageRendering: 'pixelated', aspectRatio: `${VIEW_W}/${VIEW_H}` }}
      aria-label="Knowledge Quest game world"
      role="img"
    />
  )
}
