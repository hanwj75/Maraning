import { useEffect, useRef, useState } from 'react'
import { hamsterStageClearAnimation, maraningAssets } from '../maraning-assets'

type StageHamsterProps = {
  shouldAnimate: boolean
  holdLastFrame?: boolean
  animationToken?: number
  className?: string
}

const STAGE_CLEAR_DURATION_MS =
  hamsterStageClearAnimation.frameCount * hamsterStageClearAnimation.frameDurationMs

export function StageHamster({
  shouldAnimate,
  holdLastFrame = false,
  animationToken = 0,
  className = '',
}: StageHamsterProps) {
  const [showSpriteAnimation, setShowSpriteAnimation] = useState(false)
  const [showLastSpriteFrame, setShowLastSpriteFrame] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const clearRunningTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    clearRunningTimer()

    if (!shouldAnimate) {
      setShowSpriteAnimation(false)
      setShowLastSpriteFrame(false)
      return clearRunningTimer
    }

    setShowSpriteAnimation(true)
    setShowLastSpriteFrame(false)

    timeoutRef.current = window.setTimeout(() => {
      clearRunningTimer()
      setShowSpriteAnimation(false)
      setShowLastSpriteFrame(holdLastFrame)
    }, STAGE_CLEAR_DURATION_MS + 20)

    return clearRunningTimer
  }, [animationToken, holdLastFrame, shouldAnimate])

  if (showSpriteAnimation) {
    return (
      <div
        aria-hidden="true"
        className={`game-stage-hamster-sprite ${className}`}
        style={{ backgroundImage: `url(${maraningAssets.hamsterStageClearSprite})` }}
      />
    )
  }

  if (showLastSpriteFrame) {
    return (
      <div
        aria-hidden="true"
        className={`game-stage-hamster-sprite game-stage-hamster-sprite--last ${className}`}
        style={{ backgroundImage: `url(${maraningAssets.hamsterStageClearSprite})` }}
      />
    )
  }

  return <img src={maraningAssets.hamster} alt="" aria-hidden="true" className={className} />
}
