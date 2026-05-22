import { appIntosSdk } from './appintos-sdk'

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

export const appintosAds = {
  async showRewardAd(): Promise<RewardAdBridgeResult> {
    if (isLocalDevEnvironment()) {
      return {
        awarded: true,
        adEventId: createAdEventId(),
      }
    }

    if (!appIntosSdk.isAvailable()) {
      return {
        awarded: false,
        message: '광고를 지금은 사용할 수 없어요.',
      }
    }

    try {
      const result = await appIntosSdk.watchRewardAd()

      if (!result.awarded) {
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
