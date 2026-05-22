import { appLogin } from '@apps-in-toss/web-framework'

export type TossLoginBridgeResult = {
  authorizationCode: string
  referrer: string
}

function isLocalDevEnvironment() {
  return (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')
  )
}

export const appintosAuth = {
  async loginWithTossApp(): Promise<TossLoginBridgeResult> {
    if (isLocalDevEnvironment()) {
      return {
        authorizationCode: 'mock-authorization-code',
        referrer: 'sandbox',
      }
    }

    const result = (await appLogin()) as Partial<TossLoginBridgeResult> | null

    if (!result?.authorizationCode || !result?.referrer) {
      throw new Error('토스 로그인 정보를 가져오지 못했어요.')
    }

    return {
      authorizationCode: result.authorizationCode,
      referrer: result.referrer,
    }
  },
  async loginWithToss(): Promise<TossLoginBridgeResult> {
    return this.loginWithTossApp()
  },
}
