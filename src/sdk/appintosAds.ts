import { GoogleAdMob } from '@apps-in-toss/web-framework'

export type RewardAdBridgeResult = {
  awarded: boolean
  adEventId?: string
  message?: string
}

type AdState = 'idle' | 'loading' | 'ready' | 'showing'

let adState: AdState = 'idle'
let preloadCleanup: (() => void) | undefined

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

function preloadRewardAd(): void {
  if (adState === 'loading' || adState === 'ready' || adState === 'showing') {
    return
  }

  if (isLocalDevEnvironment()) {
    adState = 'ready'
    return
  }

  const adGroupId = AD_GROUP_ID
  if (!adGroupId || !GoogleAdMob.loadAppsInTossAdMob.isSupported()) {
    return
  }

  adState = 'loading'
  preloadCleanup = GoogleAdMob.loadAppsInTossAdMob({
    options: { adGroupId },
    onEvent(event) {
      if (event.type === 'loaded') {
        preloadCleanup = undefined
        adState = 'ready'
      }
    },
    onError() {
      preloadCleanup = undefined
      adState = 'idle'
    },
  })
}

function isRewardAdReady(): boolean {
  return adState === 'ready'
}

async function showPreloadedRewardAd(): Promise<RewardAdBridgeResult> {
  if (isLocalDevEnvironment()) {
    adState = 'idle'
    preloadRewardAd()
    return { awarded: true, adEventId: createAdEventId() }
  }

  if (adState !== 'ready') {
    return {
      awarded: false,
      message: '광고를 준비 중이에요. 잠시 후 다시 시도해 주세요.',
    }
  }

  const adGroupId = AD_GROUP_ID
  if (!adGroupId) {
    return { awarded: false, message: '광고 설정이 올바르지 않아요.' }
  }

  adState = 'showing'

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

  adState = 'idle'
  preloadRewardAd()

  if (!earned) {
    return { awarded: false, message: '광고 시청이 완료되지 않았어요.' }
  }

  return { awarded: true, adEventId: createAdEventId() }
}

function resetRewardAdState(): void {
  preloadCleanup?.()
  preloadCleanup = undefined
  adState = 'idle'
}

export const appintosAds = {
  preloadRewardAd,
  isRewardAdReady,
  showPreloadedRewardAd,
  resetRewardAdState,
}
