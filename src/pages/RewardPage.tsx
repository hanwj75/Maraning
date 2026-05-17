import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CharacterPanel } from '../shared/components/CharacterPanel'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { JellyBadge } from '../shared/components/JellyBadge'
import { maraningAssets } from '../shared/maraning-assets'
import { useJellyStore } from '../stores/jellyStore'
import { useQuizStore } from '../stores/quizStore'

export function RewardPage() {
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)
  const clearResult = useQuizStore((state) => state.clearResult)

  useEffect(() => {
    syncDailyJelly()
  }, [syncDailyJelly])

  useEffect(() => {
    return () => {
      clearResult()
    }
  }, [clearResult])

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="보상 받기" backTo="/result" variant="plain" />

      <section className="game-card bg-gradient-to-br from-[#fff1d3] via-[#fff7e9] to-[#ffe0cc] px-5 py-6 text-center">
        <p className="text-sm font-black text-[#f0a084]">보상 화면</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#7b4d32]">
          오늘 미션 완료!
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#986848]">
          말랑이가 기뻐해요!
        </p>
      </section>

      <section className="grid grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="grid gap-4">
          <div className="game-card flex items-center gap-3 bg-white/78 px-4 py-5">
            <img
              src={maraningAssets.feedstuff}
              alt=""
              aria-hidden="true"
              className="h-12 w-12 object-contain"
            />
            <div>
              <p className="text-sm font-black text-[#f0a084]">보상 아이템</p>
              <p className="text-base font-black text-[#7b4d32]">말랑 간식 받기</p>
            </div>
          </div>
          <div className="game-card flex items-center justify-between gap-3 bg-white/78 px-4 py-5">
            <div>
              <p className="text-sm font-black text-[#f0a084]">체력 표시</p>
              <p className="text-base font-black text-[#7b4d32]">다음 미션 준비 완료</p>
            </div>
            <JellyBadge count={currentJelly} />
          </div>
        </div>
        <CharacterPanel title="기쁜 말랑이" subtitle="간식도 챙기고 다음 발바닥 코스로 떠나요!" />
      </section>

      <div className="flex gap-3">
        <Link to="/stages" state={{ playCharacterAnimation: true }} className="game-primary-button flex-1">
          스테이지로
        </Link>
        <Link to="/home" className="game-secondary-button flex-1">
          메인으로
        </Link>
      </div>
    </PageFrame>
  )
}
