'use client'

import dynamic from 'next/dynamic'

const GameShell = dynamic(() => import('@/components/game/GameShell'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950">
      <div className="font-pixel animate-pulse text-xs text-amber-300">VIDYASAATHI</div>
      <div className="text-sm text-slate-400">Loading The Knowledge Quest…</div>
    </div>
  ),
})

export default function Home() {
  return <GameShell />
}
