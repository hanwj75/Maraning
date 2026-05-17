import { Link } from 'react-router-dom'
import { JellyBadge } from './JellyBadge'
import { maraningAssets } from '../maraning-assets'

type CuteTopBarProps = {
  title: string
  backTo?: string
  jellyCount?: number
  showJelly?: boolean
  showMenuIcon?: boolean
  variant?: 'stage' | 'plain'
}

export function CuteTopBar({
  title,
  backTo = '/home',
  jellyCount = 20,
  showJelly = false,
  showMenuIcon = false,
  variant = 'plain',
}: CuteTopBarProps) {
  const isStage = variant === 'stage'

  return (
    <div className="relative z-10 flex min-w-0 items-center gap-3">
      <Link
        to={backTo}
        aria-label="뒤로가기"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_10px_25px_rgba(64,131,206,0.18)] transition-transform duration-100 active:scale-95 ${
          isStage ? 'bg-white/88' : 'bg-white/92'
        }`}
      >
        {showMenuIcon ? (
          <img
            src={maraningAssets.menuButton}
            alt=""
            aria-hidden="true"
            className="h-8 w-8 object-contain"
          />
        ) : (
          <span className="text-2xl font-black text-[#2a8ee8]">←</span>
        )}
      </Link>

      {isStage ? (
        <div className="relative flex h-[4.2rem] min-w-0 flex-1 items-center justify-center">
          <img
            src={maraningAssets.topbar}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-fill"
          />
          <span className="relative z-10 max-w-[11rem] whitespace-nowrap px-8 text-center text-[1.55rem] font-black tracking-tight text-white">
            {title}
          </span>
        </div>
      ) : (
        <div className="game-plain-topbar flex min-h-16 min-w-0 flex-1 items-center justify-center overflow-hidden px-5 text-center text-xl font-black tracking-tight text-[#7b4d32]">
          {title}
        </div>
      )}

      {showJelly ? <JellyBadge count={jellyCount} className="shrink-0" /> : null}
    </div>
  )
}
