import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tossLogin } from '../api/authApi'
import { appintosAuth } from '../sdk/appintosAuth'
import { PageFrame } from '../shared/components/PageFrame'
import { useSessionStore } from '../stores/sessionStore'

const startPageAsset = '/assets/maraning/Maraning_start_page.png'

export function SplashPage() {
  const navigate = useNavigate()
  const setSession = useSessionStore((state) => state.setSession)
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn)
  const [showAgreementStep, setShowAgreementStep] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const handleStartClick = () => {
    setShowAgreementStep(true)
    setLoginError(null)
  }

  const handleAgreeAndStart = async () => {
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
      const loginBridgeResult = await appintosAuth.loginWithTossApp()
      const session = await tossLogin(loginBridgeResult)
      setSession(session)
      navigate('/difficulty')
    } catch (error) {
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

        <div className="flex w-full justify-center">
          <button
            type="button"
            onClick={handleStartClick}
            className="game-primary-button w-full max-w-[17rem]"
          >
            시작하기
          </button>
        </div>

        {showAgreementStep ? (
          <div className="flex w-full max-w-[17rem] flex-col gap-3">
            <p className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-center text-sm font-semibold leading-6 text-[#9b6c4a] shadow-[0_12px_24px_rgba(190,139,98,0.12)]">
              아래 버튼을 누르면 서비스 이용과 토스 로그인 진행에 동의한 것으로 안내돼요.
            </p>
            <button
              type="button"
              onClick={handleAgreeAndStart}
              disabled={isLoggingIn}
              className="game-primary-button"
            >
              {isLoggingIn ? '로그인 중이야...' : '동의하고 시작하기'}
            </button>
            {loginError ? (
              <p className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-center text-sm font-black text-[#c46b6b]">
                {loginError}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </PageFrame>
  )
}
