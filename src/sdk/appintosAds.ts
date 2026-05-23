import { GoogleAdMob } from '@apps-in-toss/web-framework'

export type RewardAdBridgeResult = {
  awarded: boolean
  adEventId?: string
  message?: string
}

function isLocalDevEnvironment() {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  )
}

function createAdEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `ad-${Date.now()}`
}

const AD_GROUP_ID = import.meta.env.VITE_AD_GROUP_ID as string | undefined

export const appintosAds = {
  async showRewardAd(): Promise<RewardAdBridgeResult> {
    if (isLocalDevEnvironment()) {
      return {
        awarded: true,
        adEventId: createAdEventId(),
      }
    }

    const adGroupId = AD_GROUP_ID

    if (!adGroupId) {
      return {
        awarded: false,
        message: '광고 설정이 올바르지 않아요.',
      }
    }

    if (!GoogleAdMob.loadAppsInTossAdMob.isSupported()) {
      return {
        awarded: false,
        message: '광고를 지금은 사용할 수 없어요.',
      }
    }

    try {
      await new Promise<void>((resolve, reject) => {
        let cleanup: (() => void) | undefined
        cleanup = GoogleAdMob.loadAppsInTossAdMob({
          options: { adGroupId },
          onEvent(event) {
            if (event.type === 'loaded') {
              cleanup?.()
              resolve()
            }
          },
          onError(err) {
            cleanup?.()
            reject(err instanceof Error ? err : new Error('광고를 불러오지 못했어요.'))
          },
        })
      })

      const earned = await new Promise<boolean>((resolve) => {
        let rewarded = false
        let cleanup: (() => void) | undefined
        cleanup = GoogleAdMob.showAppsInTossAdMob({
          options: { adGroupId },
          onEvent(event) {
            if (event.type === 'userEarnedReward') {
              rewarded = true
            } else if (event.type === 'dismissed' || event.type === 'failedToShow') {
              cleanup?.()
              resolve(rewarded)
            }
          },
          onError() {
            cleanup?.()
            resolve(false)
          },
        })
      })

      if (!earned) {
        return {
          awarded: false,
          message: '광고 시청이 완료되지 않았어요.',
        }
      }

      return {
        awarded: true,
        adEventId: createAdEventId(),
      }
    } catch {
      return {
        awarded: false,
        message: '광고를 불러오지 못했어요.',
      }
    }
  },
}
