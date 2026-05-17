import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { maraningAssets } from '../maraning-assets'

type StagePawNodeProps = {
  stageNumber: number
  state: 'locked' | 'unlocked' | 'completed'
  to?: string
  className?: string
  sizeClassName?: string
  style?: CSSProperties
  onSelect?: () => void
}

function PawContent({
  stageNumber,
  state,
  sizeClassName,
}: Pick<StagePawNodeProps, 'stageNumber' | 'state' | 'sizeClassName'>) {
  const source = state === 'locked' ? maraningAssets.pawLocked : maraningAssets.pawActive

  return (
    <div
      className={`relative ${sizeClassName ?? 'h-24 w-24'} ${
        state === 'completed' ? 'drop-shadow-[0_0_16px_rgba(73,187,255,0.65)]' : ''
      }`}
    >
      <img src={source} alt="" aria-hidden="true" className="h-full w-full object-contain" />
      <span className="absolute inset-x-0 bottom-[0.55rem] text-center text-sm font-black text-[#7d4d2f]">
        {stageNumber}
      </span>
    </div>
  )
}

export function StagePawNode({
  stageNumber,
  state,
  to = '/quiz',
  className = '',
  sizeClassName,
  style,
  onSelect,
}: StagePawNodeProps) {
  const content = <PawContent stageNumber={stageNumber} state={state} sizeClassName={sizeClassName} />

  if (state === 'locked') {
    return <div className={className} style={style}>{content}</div>
  }

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        style={style}
        className={`block transition-transform duration-100 active:scale-95 ${className}`}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      to={to}
      style={style}
      className={`block transition-transform duration-100 active:scale-95 ${className}`}
    >
      {content}
    </Link>
  )
}
