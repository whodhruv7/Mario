'use client'

/* ── HUD overlay: hearts, enemy info, streak, coins, pause ── */

interface EnemyDisplay {
  kind: 'monster' | 'boss'
  name: string
  title: string
  hpMax: number
  hpLeft: number
  index: number
  total: number
}

interface Props {
  health: number
  coins: number
  crystals: number
  answered: number
  correct: number
  streak: number
  bossStreak: number
  enemy: EnemyDisplay | null
  chapterShort: string
  onPause: () => void
}

function Heart({ filled, pulse }: { filled: boolean; pulse: boolean }) {
  return (
    <svg
      viewBox="0 0 16 14"
      className={`h-4 w-4 sm:h-5 sm:w-5 ${pulse && filled ? 'animate-pulse' : ''}`}
      aria-hidden
    >
      <path
        d="M4 1h3v1h2V1h3v1h1v4h-1v1h-1v1h-1v1h-1v1h-1v1H8v1H7v-1H6v-1H5V9H4V8H3V7H2V3h1V2h1V1z"
        fill={filled ? '#F0426B' : 'rgba(255,255,255,0.15)'}
        stroke={filled ? '#FF9DB4' : 'rgba(255,255,255,0.25)'}
        strokeWidth="0.6"
        style={pulse && filled ? { filter: 'drop-shadow(0 0 3px #F0426B)' } : undefined}
      />
    </svg>
  )
}

export default function HUD({
  health, coins, crystals, answered, correct, streak, bossStreak, enemy, chapterShort, onPause,
}: Props) {
  const low = health <= 3
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2 sm:p-3">
      <div className="flex items-start justify-between gap-2">
        {/* hearts */}
        <div className="kq-hud-chip flex flex-col gap-1.5">
          <div className="flex items-center gap-0.5" role="meter" aria-valuenow={health} aria-valuemin={0} aria-valuemax={10} aria-label="health">
            {Array.from({ length: 10 }, (_, i) => (
              <Heart key={i} filled={i < health} pulse={low} />
            ))}
          </div>
          <div className="font-pixel text-[8px] text-rose-300 sm:text-[9px]">
            {low ? 'LOW HEALTH!' : `${health}/10 HEARTS`}
          </div>
        </div>

        {/* center: chapter + enemy */}
        <div className="flex max-w-[46%] flex-col items-center gap-1.5">
          <div className="kq-hud-chip font-pixel text-[8px] text-amber-200 sm:text-[10px]">{chapterShort.toUpperCase()}</div>
          {enemy && (
            <div className={`kq-hud-chip ${enemy.kind === 'boss' ? 'border-fuchsia-400/60' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm">
                  {enemy.kind === 'boss' ? '🐉' : '👾'} <span className="font-bold text-white">{enemy.name}</span>
                  {enemy.kind === 'boss' && (
                    <span className="ml-1 text-[10px] text-fuchsia-300">BOSS</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">
                  {enemy.kind === 'monster' ? `${enemy.index + 1}/${enemy.total}` : ''}
                </span>
              </div>
              {enemy.kind === 'boss' ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-pixel text-[8px] text-fuchsia-300">STREAK</span>
                  <div className="h-2.5 w-24 overflow-hidden rounded-full bg-slate-700/80 sm:w-32">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (streak / bossStreak) * 100)}%` }}
                    />
                  </div>
                  <span className="font-pixel text-[8px] text-white">{streak}/{bossStreak}</span>
                </div>
              ) : (
                <div className="mt-1 flex gap-1">
                  {Array.from({ length: enemy.hpMax }, (_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 w-4 rounded-sm ${i < enemy.hpLeft ? 'bg-emerald-400' : 'bg-slate-700/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* right: coins + stats + pause */}
        <div className="kq-hud-chip flex flex-col items-end gap-1">
          <div className="pointer-events-auto flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-amber-300 sm:text-sm">🪙 {coins}</span>
            <span className="flex items-center gap-1 text-xs font-bold text-cyan-300 sm:text-sm">💎 {crystals}</span>
            <button
              onClick={onPause}
              className="rounded-md border border-white/20 bg-slate-800/90 px-2 py-0.5 text-xs text-white hover:bg-slate-700"
              aria-label="Pause game"
            >
              ⏸
            </button>
          </div>
          <div className="text-[10px] text-slate-400 sm:text-xs">
            Q {answered} · ✅ {correct}
          </div>
        </div>
      </div>
    </div>
  )
}
