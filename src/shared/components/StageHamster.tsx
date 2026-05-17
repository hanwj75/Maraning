import { useEffect, useRef, useState } from 'react'
import { maraningAssets } from '../maraning-assets'

type StageHamsterProps = {
  shouldAnimate: boolean
  className?: string
}

const FRAME_INTERVAL_MS = 120

export function StageHamster({ shouldAnimate, className = '' }: StageHamsterProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(maraningAssets.hamster)
  const intervalRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const clearRunningTimers = () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    clearRunningTimers()

    if (!shouldAnimate) {
      setCurrentSrc(maraningAssets.hamster)
      return clearRunningTimers
    }

    let frameIndex = 0
    setCurrentSrc(maraningAssets.hamsterFrames[frameIndex])

    intervalRef.current = window.setInterval(() => {
      frameIndex += 1

      if (frameIndex >= maraningAssets.hamsterFrames.length) {
        clearRunningTimers()
        setCurrentSrc(maraningAssets.hamster)
        return
      }

      setCurrentSrc(maraningAssets.hamsterFrames[frameIndex])
    }, FRAME_INTERVAL_MS)

    timeoutRef.current = window.setTimeout(() => {
      clearRunningTimers()
      setCurrentSrc(maraningAssets.hamster)
    }, FRAME_INTERVAL_MS * maraningAssets.hamsterFrames.length + 20)

    return clearRunningTimers
  }, [shouldAnimate])

  return (
    <img
      src={currentSrc}
      alt=""
      aria-hidden="true"
      className={className}
    />
  )
}
