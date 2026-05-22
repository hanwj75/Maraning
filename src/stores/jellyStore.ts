import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  consumeWallet,
  fetchWallet,
  WalletApiError,
} from '../api/walletApi'
import { completeAdReward } from '../api/rewardApi'
import { appintosAds } from '../sdk/appintosAds'
import { useSessionStore } from './sessionStore'

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
  syncDailyJelly: () => Promise<{ synced: boolean; message?: string }>
  tryConsumeForSubmission: (params: {
    sourceId: string
    reason?: string
  }) => Promise<{ consumed: boolean; message?: string }>
  addJelly: (amount: number) => { previous: number; current: number; added: number }
  mockRewardJelly: (amount: number) => { previous: number; current: number; added: number }
  grantMockAdReward: () => { previous: number; current: number; added: number }
  claimAdReward: (params?: {
    adUnitId?: string
  }) => Promise<{ previous: number; current: number; added: number; granted: boolean; message?: string }>
  grantCleanSolveReward: (rng?: () => number) => { previous: number; current: number; rewarded: number }
  setFromServerWallet: (wallet: { jelly: number; lastDailyRefillDate?: string | null }) => void
}

export const useJellyStore = create<JellyStore>()(
  persist(
    (set, get) => ({
      ...createInitialJellyState(),
      syncDailyJelly: async () => {
        const sessionState = useSessionStore.getState()

        if (!sessionState.serverSyncEnabled || !sessionState.sessionToken) {
          set((state) => syncDailyJellyState(state))
          return { synced: true as const }
        }

        try {
          const response = await fetchWallet(sessionState.sessionToken)
          get().setFromServerWallet(response.wallet)
          sessionState.setWallet({ jelly: response.wallet.jelly })

          return { synced: true as const }
        } catch (error) {
          return {
            synced: false as const,
            message:
              error instanceof Error
                ? error.message
                : '젤리 정보를 불러오지 못했어요.',
          }
        }
      },
      tryConsumeForSubmission: async ({ sourceId, reason = 'quiz_submit' }) => {
        const sessionState = useSessionStore.getState()

        if (!sessionState.serverSyncEnabled || !sessionState.sessionToken) {
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

          return {
            consumed,
            message: consumed ? undefined : '젤리가 부족해요.',
          }
        }

        try {
          const response = await consumeWallet(sessionState.sessionToken, {
            amount: JELLY_SUBMIT_COST,
            reason,
            sourceId,
          })
          get().setFromServerWallet(response.wallet)
          sessionState.setWallet({ jelly: response.wallet.jelly })

          return {
            consumed: response.consumed ?? response.duplicate ?? true,
          }
        } catch (error) {
          if (error instanceof WalletApiError) {
            return {
              consumed: false,
              message: error.message,
            }
          }

          return {
            consumed: false,
            message: '젤리 차감 중 오류가 발생했어요.',
          }
        }
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
      claimAdReward: async ({ adUnitId } = {}) => {
        const adResult = await appintosAds.showRewardAd()

        if (!adResult.awarded) {
          return {
            previous: get().current,
            current: get().current,
            added: 0,
            granted: false,
            message: adResult.message ?? '광고 보상을 받지 못했어요.',
          }
        }

        const sessionState = useSessionStore.getState()

        if (!sessionState.serverSyncEnabled || !sessionState.sessionToken) {
          const rewardResult = get().mockRewardJelly(JELLY_AD_REWARD)

          return {
            ...rewardResult,
            granted: rewardResult.added > 0,
          }
        }

        const previous = get().current

        try {
          const response = await completeAdReward(sessionState.sessionToken, {
            adEventId: adResult.adEventId ?? `ad-${Date.now()}`,
            adUnitId,
          })
          get().setFromServerWallet(response.wallet)
          sessionState.setWallet({ jelly: response.wallet.jelly })

          return {
            previous,
            current: response.wallet.jelly,
            added: response.wallet.jelly - previous,
            granted: true,
          }
        } catch (error) {
          return {
            previous,
            current: previous,
            added: 0,
            granted: false,
            message:
              error instanceof Error
                ? error.message
                : '광고 보상을 받지 못했어요.',
          }
        }
      },
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
      setFromServerWallet: (wallet) =>
        set((state) => ({
          ...state,
          max: JELLY_MAX,
          current: clampJelly(wallet.jelly, JELLY_MAX),
          lastRefillDateKey: wallet.lastDailyRefillDate ?? state.lastRefillDateKey,
        })),
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
