import { Link } from 'react-router-dom'
import { PageFrame } from '../shared/components/PageFrame'

export function SplashPage() {
  return (
    <PageFrame showBottomNav={false} contentClassName="justify-center">
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-32 w-32 items-center justify-center rounded-[2.4rem] bg-gradient-to-b from-[#fff4da] to-[#ffd5af] text-7xl shadow-[inset_0_-14px_20px_rgba(255,188,136,0.34),0_18px_34px_rgba(188,127,84,0.22)]">
          🐹
        </div>
        <div className="space-y-3">
          <p className="text-sm font-black tracking-[0.3em] text-[#e18592]">MARANING</p>
          <h1 className="text-4xl font-black tracking-tight text-[#7a4d33]">귀여운 영어 미션</h1>
          <p className="text-sm font-semibold text-[#9d7051]">폭신한 발바닥 따라 오늘의 학습 시작!</p>
        </div>
        <Link to="/home" className="game-primary-button">
          시작하기
        </Link>
      </section>
    </PageFrame>
  )
}
