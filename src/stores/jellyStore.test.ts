import { describe, expect, it } from '@jest/globals'
import {
  JELLY_AD_REWARD,
  JELLY_DAILY_MIN,
  JELLY_MAX,
  consumeJellyForSubmission,
  createInitialJellyState,
  getRandomJellyReward,
  getTodayDateKey,
  grantAdReward,
  grantJellyReward,
  syncDailyJellyState,
} from './jellyStore'

describe('jellyStore helpers', () => {
  it('creates jelly state with daily visible baseline and internal max 100', () => {
    const jellyState = createInitialJellyState(new Date('2026-05-17T09:00:00+09:00'))

    expect(jellyState).toEqual({
      current: 20,
      max: 100,
      lastRefillDateKey: '2026-05-17',
    })
  })

  it('refills only up to 20 when the date changes and jelly is below 20', () => {
    const synced = syncDailyJellyState(
      {
        current: 4,
        max: 100,
        lastRefillDateKey: '2026-05-16',
      },
      '2026-05-17',
    )

    expect(synced).toEqual({
      current: JELLY_DAILY_MIN,
      max: 100,
      lastRefillDateKey: '2026-05-17',
    })
  })

  it('keeps jelly unchanged on a new day when it is already 20 or more', () => {
    const synced = syncDailyJellyState(
      {
        current: 21,
        max: 100,
        lastRefillDateKey: '2026-05-16',
      },
      '2026-05-17',
    )

    expect(synced.current).toBe(21)
  })

  it('consumes exactly 1 jelly on each quiz submission', () => {
    const { nextState, consumed } = consumeJellyForSubmission({
      current: 7,
      max: 100,
      lastRefillDateKey: '2026-05-17',
    })

    expect(consumed).toBe(true)
    expect(nextState.current).toBe(6)
  })

  it('blocks submission when jelly is 0', () => {
    const { nextState, consumed } = consumeJellyForSubmission({
      current: 0,
      max: 100,
      lastRefillDateKey: '2026-05-17',
    })

    expect(consumed).toBe(false)
    expect(nextState.current).toBe(0)
  })

  it('adds 5 jelly from mock ad reward without exceeding 100', () => {
    const rewarded = grantAdReward({
      current: 96,
      max: JELLY_MAX,
      lastRefillDateKey: '2026-05-17',
    })

    expect(rewarded.current).toBe(100)
  })

  it('uses the configured ad reward amount by default', () => {
    const rewarded = grantAdReward({
      current: 10,
      max: JELLY_MAX,
      lastRefillDateKey: '2026-05-17',
    })

    expect(rewarded.current).toBe(10 + JELLY_AD_REWARD)
  })

  it('clamps clean solve rewards to the internal max 100', () => {
    const rewarded = grantJellyReward({
      current: 99,
      max: JELLY_MAX,
      lastRefillDateKey: '2026-05-17',
    }, 3)

    expect(rewarded.current).toBe(100)
  })

  it('builds a deterministic 1 to 3 jelly reward from the injected rng', () => {
    expect(getRandomJellyReward(() => 0)).toBe(1)
    expect(getRandomJellyReward(() => 0.45)).toBe(2)
    expect(getRandomJellyReward(() => 0.95)).toBe(3)
  })

  it('formats date keys in yyyy-mm-dd format', () => {
    expect(getTodayDateKey(new Date('2026-05-07T09:00:00+09:00'))).toBe('2026-05-07')
  })
})
