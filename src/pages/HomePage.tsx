import { useEffect } from 'react'
import { Link } from 'react-router-dom'
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
          오늘의 코스
        </div>
        <JellyBadge count={currentJelly} />
      </section>

      <section className="game-card flex min-h-[30rem] flex-col bg-gradient-to-br from-[#fff4dd] via-[#fff7ec] to-[#ffd8cb] px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-sm font-black text-[#f09a8d]">
              마라닝 영어 코스
            </p>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-[#7b4d32]">
              오늘도 영어
              <br />
              달려달려!
            </h1>
            <p className="text-sm font-semibold leading-6 text-[#96674a]">
              오늘도 달려볼까!
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

        <div className="mt-auto flex flex-col gap-3 pb-[15px]">
          <Link to="/difficulty" className="game-primary-button">
            코스 선택하기
          </Link>
        </div>
      </section>
    </PageFrame>
  )
}
