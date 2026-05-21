import { maraningAssets } from '../maraning-assets'

type JellyBadgeProps = {
  count: number
  className?: string
}

export function JellyBadge({ count, className = '' }: JellyBadgeProps) {
  return (
    <div
      className={`inline-flex max-w-full items-center gap-0 whitespace-nowrap ${className}`}
    >
      <img
        src={maraningAssets.learningHp}
        alt=""
        aria-hidden="true"
        className="h-7 w-7 object-contain"
      />
      <span className="game-currency-text whitespace-nowrap text-sm font-black tracking-tight">
        {count}
      </span>
    </div>
  )
}
