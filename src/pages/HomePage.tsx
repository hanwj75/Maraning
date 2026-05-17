import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CharacterPanel } from '../shared/components/CharacterPanel'
import { JellyBadge } from '../shared/components/JellyBadge'
import { PageFrame } from '../shared/components/PageFrame'
import { maraningAssets } from '../shared/maraning-assets'
import { useJellyStore } from '../stores/jellyStore'

export function HomePage() {
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)

  useEffect(() => {
    syncDailyJelly()
  }, [syncDailyJelly])

  return (
    <PageFrame contentClassName="gap-5">
      <section className="flex items-center justify-between">
        <div className="rounded-full bg-white/75 px-4 py-2 text-sm font-black tracking-[0.18em] text-[#e48c97] shadow-[0_10px_24px_rgba(207,150,114,0.16)]">
          오늘의 미션
        </div>
        <JellyBadge count={currentJelly} />
      </section>

      <section className="game-card bg-gradient-to-br from-[#fff4dd] via-[#fff7ec] to-[#ffd8cb] px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-black text-[#f09a8d]">햄찌 영어 탐험</p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-[#7b4d32]">
              오늘도 영어 미션
              <br />
              갈까?
            </h1>
            <p className="text-sm font-semibold leading-6 text-[#96674a]">
              말랑이랑 같이 공부해요!
            </p>
          </div>
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] bg-white/75 shadow-[0_14px_28px_rgba(197,139,96,0.2)]">
            <img
              src={maraningAssets.hamster}
              alt=""
              aria-hidden="true"
              className="h-24 w-24 object-contain"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link to="/difficulty" className="game-primary-button">
            난이도 선택하기
          </Link>
          <Link to="/stages" className="game-secondary-button">
            학습 시작
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-[1.25fr_0.95fr] gap-4">
        <div className="game-card bg-white/82 px-4 py-5">
          <p className="text-sm font-black text-[#ef9a8f]">오늘의 한마디</p>
          <p className="mt-3 text-lg font-black leading-8 text-[#7b4d32]">
            젤리 {currentJelly}개로
            <br />
            발바닥 코스를 출발!
          </p>
        </div>
        <CharacterPanel title="말랑이 응원단" subtitle="짧게 배우고 말랑하게 칭찬 받아요!" />
      </section>
    </PageFrame>
  )
}
