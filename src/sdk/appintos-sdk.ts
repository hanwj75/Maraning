export type RewardAdResult = {
  awarded: boolean
}

export type AppIntosSdk = {
  isAvailable: () => boolean
  initialize: () => Promise<void>
  watchRewardAd: () => Promise<RewardAdResult>
}

export const appIntosSdk: AppIntosSdk = {
  isAvailable: () => false,
  initialize: async () => {},
  watchRewardAd: async () => ({ awarded: false }),
}
