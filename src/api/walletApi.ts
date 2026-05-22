import { ApiClientError, apiRequest } from './client'

export type WalletApiResponse = {
  wallet: {
    jelly: number
    lastDailyRefillDate?: string | null
    updatedAt?: string
    refilledToday?: boolean
  }
}

export type WalletConsumeRequest = {
  amount: number
  reason: string
  sourceId: string
}

export type WalletConsumeResponse = WalletApiResponse & {
  duplicate?: boolean
  consumed?: boolean
}

export class WalletApiError extends ApiClientError {}

export async function fetchWallet(sessionToken: string): Promise<WalletApiResponse> {
  try {
    return await apiRequest<WalletApiResponse>(
      {
        path: '/wallet',
        method: 'GET',
        sessionToken,
      },
      '젤리 정보를 불러오지 못했어요.',
    )
  } catch (error) {
    throw error instanceof ApiClientError
      ? new WalletApiError(error.message, {
          code: error.code,
          status: error.status,
        })
      : error
  }
}

export async function consumeWallet(
  sessionToken: string,
  payload: WalletConsumeRequest,
): Promise<WalletConsumeResponse> {
  try {
    return await apiRequest<WalletConsumeResponse>(
      {
        path: '/wallet/consume',
        method: 'POST',
        sessionToken,
        body: payload,
      },
      '젤리를 차감하지 못했어요.',
    )
  } catch (error) {
    throw error instanceof ApiClientError
      ? new WalletApiError(error.message, {
          code: error.code,
          status: error.status,
        })
      : error
  }
}
