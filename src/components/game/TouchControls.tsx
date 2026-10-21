'use client'

/* ── Touch controls for phones/tablets (shown on coarse pointers) ── */

import { useRef } from 'react'

interface Props {
  onSet: (t: { left: boolean; right: boolean; jump: boolean } | null) => void
}

export default function TouchControls({ onSet }: Props) {
  const state = useRef({ left: false, right: false, jump: false })
  const emit = () => onSet({ ...state.current })

  const bind = (key: 'left' | 'right' | 'jump') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      state.current[key] = true
      emit()
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault()
      state.current[key] = false
      emit()
    },
    onPointerLeave: () => {
      state.current[key] = false
      emit()
    },
    onPointerCancel: () => {
      state.current[key] = false
      emit()
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  const btn =
    'flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-slate-900/70 text-xl font-black text-white backdrop-blur-sm active:bg-amber-500/80 active:border-amber-300 select-none touch-none'

  return (
    <div className="kq-touch-controls pointer-events-none absolute inset-x-0 bottom-2 z-30">
      <div className="pointer-events-auto absolute bottom-2 left-3 flex gap-3">
        <button className={btn} aria-label="Move left" {...bind('left')}>◀</button>
        <button className={btn} aria-label="Move right" {...bind('right')}>▶</button>
      </div>
      <div className="pointer-events-auto absolute bottom-2 right-3">
        <button className={`${btn} h-16 w-16 border-amber-300/50 bg-amber-600/60`} aria-label="Jump" {...bind('jump')}>
          ⤒
        </button>
      </div>
    </div>
  )
}
