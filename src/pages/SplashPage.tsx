import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tossLogin } from '../api/authApi'
import { fetchProgress } from '../api/progressApi'
import { appintosAuth } from '../sdk/appintosAuth'
import { PageFrame } from '../shared/components/PageFrame'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useSessionStore } from '../stores/sessionStore'

const startPageAsset = '/assets/maraning/Maraning_start_page.png'

export function SplashPage() {
  const navigate = useNavigate()
  const setSession = useSessionStore((state) => state.setSession)
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn)
  const setFromServerWallet = useJellyStore((state) => state.setFromServerWallet)
  const setAllProgressFromServer = useProgressStore((state) => state.setAllProgressFromServer)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleAgreeAndStart = async () => {
    console.log('[SplashPage] 시작하기: clicked')

    if (isLoggingIn) {
      return
    }

    if (isLoggedIn) {
      navigate('/difficulty')
      return
    }

    setIsLoggingIn(true)
    setLoginError(null)

    try {
      console.log('[SplashPage] appintosAuth.loginWithTossApp: start')
      const loginBridgeResult = await appintosAuth.loginWithTossApp()
      console.log('[SplashPage] appintosAuth.loginWithTossApp: success, authCode prefix:', loginBridgeResult.authorizationCode.slice(0, 6), '| referrer:', loginBridgeResult.referrer)

      console.log('[SplashPage] tossLogin: start')
      const session = await tossLogin(loginBridgeResult)
      console.log('[SplashPage] tossLogin: success, userId:', session.user.id)

      setSession(session)
      setFromServerWallet({ jelly: session.wallet.jelly })
      void fetchProgress()
        .then((r) => setAllProgressFromServer(r.progress))
        .catch(() => {})
      navigate('/difficulty')
    } catch (error) {
      console.error('[SplashPage] login error:', error instanceof Error ? error.message : error)
      setLoginError(
        error instanceof Error
          ? error.message
          : '토스 로그인 중 문제가 발생했어요. 다시 시도해 주세요.',
      )
    } finally {
      setIsLoggingIn(false)
    }
  }

  return (
    <PageFrame showBottomNav={false} contentClassName="justify-center gap-0">
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-2 py-4">
        <div className="w-full overflow-hidden rounded-[2.25rem] bg-[#fff7ec] shadow-[0_18px_34px_rgba(190,139,98,0.18)]">
          <img
            src={startPageAsset}
            alt="마라닝 시작 화면"
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="flex w-full max-w-[17rem] flex-col gap-3">
          <button
            type="button"
            onClick={handleAgreeAndStart}
            disabled={isLoggingIn}
            className="game-primary-button w-full"
          >
            {isLoggingIn ? '로그인 중이야...' : '시작하기'}
          </button>
          {loginError ? (
            <p className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-center text-sm font-black text-[#c46b6b]">
              {loginError}
            </p>
          ) : null}
        </div>
      </section>
    </PageFrame>
  )
}
