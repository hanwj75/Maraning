import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const JELLY_MAX = 100
export const JELLY_DAILY_MIN = 20
export const JELLY_SUBMIT_COST = 1
export const JELLY_AD_REWARD = 5

export type JellyState = {
  current: number
  max: number
  lastRefillDateKey: string
}

export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function clampJelly(value: number, max: number = JELLY_MAX): number {
  return Math.max(0, Math.min(max, value))
}

export function createInitialJellyState(date: Date = new Date()): JellyState {
  return {
    current: JELLY_DAILY_MIN,
    max: JELLY_MAX,
    lastRefillDateKey: getTodayDateKey(date),
  }
}

export function syncDailyJellyState(
  state: JellyState,
  todayDateKey: string = getTodayDateKey(),
): JellyState {
  if (state.lastRefillDateKey === todayDateKey) {
    return {
      ...state,
      max: JELLY_MAX,
      current: clampJelly(state.current, JELLY_MAX),
    }
  }

  return {
    ...state,
    max: JELLY_MAX,
    current: state.current < JELLY_DAILY_MIN ? JELLY_DAILY_MIN : clampJelly(state.current, JELLY_MAX),
    lastRefillDateKey: todayDateKey,
  }
}

export function consumeJellyForSubmission(state: JellyState): {
  nextState: JellyState
  consumed: boolean
} {
  if (state.current < JELLY_SUBMIT_COST) {
    return {
      nextState: state,
      consumed: false,
    }
  }

  return {
    nextState: {
      ...state,
      max: JELLY_MAX,
      current: clampJelly(state.current - JELLY_SUBMIT_COST, JELLY_MAX),
    },
    consumed: true,
  }
}

export function grantJellyReward(state: JellyState, amount: number): JellyState {
  return {
    ...state,
    max: JELLY_MAX,
    current: clampJelly(state.current + amount, JELLY_MAX),
  }
}

export function grantAdReward(state: JellyState, amount: number = JELLY_AD_REWARD): JellyState {
  return grantJellyReward(state, amount)
}

export function getRandomJellyReward(rng: () => number = Math.random): number {
  return Math.floor(rng() * 3) + 1
}

type JellyStore = JellyState & {
  syncDailyJelly: () => void
  tryConsumeForSubmission: () => boolean
  addJelly: (amount: number) => { previous: number; current: number; added: number }
  mockRewardJelly: (amount: number) => { previous: number; current: number; added: number }
  grantMockAdReward: () => { previous: number; current: number; added: number }
  grantCleanSolveReward: (rng?: () => number) => { previous: number; current: number; rewarded: number }
}

export const useJellyStore = create<JellyStore>()(
  persist(
    (set, get) => ({
      ...createInitialJellyState(),
      syncDailyJelly: () =>
        set((state) => syncDailyJellyState(state)),
      tryConsumeForSubmission: () => {
        const syncedState = syncDailyJellyState(get())

        if (
          syncedState.lastRefillDateKey !== get().lastRefillDateKey ||
          syncedState.current !== get().current
        ) {
          set(syncedState)
        }

        const { nextState, consumed } = consumeJellyForSubmission(syncedState)

        if (consumed) {
          set(nextState)
        }

        return consumed
      },
      addJelly: (amount) => {
        const syncedState = syncDailyJellyState(get())
        const rewardedState = grantJellyReward(syncedState, amount)

        set(rewardedState)

        return {
          previous: syncedState.current,
          current: rewardedState.current,
          added: rewardedState.current - syncedState.current,
        }
      },
      mockRewardJelly: (amount) => get().addJelly(amount),
      grantMockAdReward: () => get().mockRewardJelly(JELLY_AD_REWARD),
      grantCleanSolveReward: (rng = Math.random) => {
        const syncedState = syncDailyJellyState(get())
        const rewarded = getRandomJellyReward(rng)
        const rewardedState = grantJellyReward(syncedState, rewarded)

        set(rewardedState)

        return {
          previous: syncedState.current,
          current: rewardedState.current,
          rewarded: rewardedState.current - syncedState.current,
        }
      },
    }),
    {
      name: 'maraning-jelly-store',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<JellyState> | undefined

        return {
          ...currentState,
          ...persisted,
          max: JELLY_MAX,
          current: clampJelly(persisted?.current ?? currentState.current, JELLY_MAX),
        }
      },
      partialize: (state) => ({
        current: state.current,
        lastRefillDateKey: state.lastRefillDateKey,
      }),
    },
  ),
)
