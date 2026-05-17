import { maraningAssets } from '../maraning-assets'

type JellyBadgeProps = {
  count: number
  className?: string
}

export function JellyBadge({ count, className = '' }: JellyBadgeProps) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-2 whitespace-nowrap ${className}`}
    >
      <img
        src={maraningAssets.learningHp}
        alt=""
        aria-hidden="true"
        className="h-7 w-7 object-contain"
      />
      <span className="game-currency-text min-w-0 overflow-hidden text-ellipsis text-sm font-black tracking-tight">
        젤리 {count}
      </span>
    </div>
  )
}
