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
    console.log('[appintosAuth] loginWithTossApp: start')

    if (isLocalDevEnvironment()) {
      console.log('[appintosAuth] loginWithTossApp: local dev mock path')
      return {
        authorizationCode: 'mock-authorization-code',
        referrer: 'sandbox',
      }
    }

    console.log('[appintosAuth] appLogin: calling')
    const result = (await appLogin()) as Partial<TossLoginBridgeResult> | null
    console.log('[appintosAuth] appLogin: returned, authCode exists:', !!result?.authorizationCode, 'referrer:', result?.referrer ?? '(none)')

    if (!result?.authorizationCode || !result?.referrer) {
      console.error('[appintosAuth] appLogin: missing authorizationCode or referrer')
      throw new Error('토스 로그인 정보를 가져오지 못했어요.')
    }

    console.log('[appintosAuth] loginWithTossApp: success, authCode prefix:', result.authorizationCode.slice(0, 6))
    return {
      authorizationCode: result.authorizationCode,
      referrer: result.referrer,
    }
  },
  async loginWithToss(): Promise<TossLoginBridgeResult> {
    return this.loginWithTossApp()
  },
}
