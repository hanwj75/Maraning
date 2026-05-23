import { ApiClientError, apiRequest } from './client'

export type AdRewardRequest = {
  adEventId: string
  adUnitId?: string
}

export type AdRewardResponse = {
  wallet: {
    jelly: number
    updatedAt?: string
  }
  rewardAmount: number
}

export class RewardApiError extends ApiClientError {}

export async function completeAdReward(payload: AdRewardRequest): Promise<AdRewardResponse> {
  try {
    return await apiRequest<AdRewardResponse>(
      { path: '/ad-reward/complete', method: 'POST', body: payload },
      '광고 보상을 받지 못했어요.',
    )
  } catch (error) {
    throw error instanceof ApiClientError
      ? new RewardApiError(error.message, {
          code: error.code,
          status: error.status,
          details: error.details,
        })
      : error
  }
}

export const claimAdReward = completeAdReward
