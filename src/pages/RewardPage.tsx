import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { buildChapterMapPath, buildStageMapPath } from '../features/stage/stage.routes'
import { CharacterPanel } from '../shared/components/CharacterPanel'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { JellyBadge } from '../shared/components/JellyBadge'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useQuizStore } from '../stores/quizStore'
import { useUiStore } from '../stores/ui-store'

export function RewardPage() {
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)
  const result = useQuizStore((state) => state.result)
  const clearResult = useQuizStore((state) => state.clearResult)
  const selectedDifficulty = useUiStore((state) => state.selectedDifficulty)
  const currentChapterId = useProgressStore(
    (state) => state.progressByDifficulty[selectedDifficulty]?.currentChapterId ?? null,
  )

  useEffect(() => {
    syncDailyJelly()
  }, [syncDailyJelly])

  useEffect(() => {
    return () => {
      clearResult()
    }
  }, [clearResult])

  const fallbackPath = currentChapterId
    ? buildStageMapPath(selectedDifficulty, currentChapterId)
    : buildChapterMapPath(selectedDifficulty)
  const stageMapPath = result ? buildStageMapPath(result.difficulty, result.chapterId) : fallbackPath

  if (!result) {
    return <Navigate to={fallbackPath} replace />
  }

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
          <div className="game-card flex items-center justify-between gap-3 bg-white/78 px-4 py-5">
            <div>
              <p className="text-sm font-black text-[#f0a084]">젤리 상태</p>
              <p className="text-base font-black text-[#7b4d32]">다음 미션 준비 완료</p>
            </div>
            <JellyBadge count={currentJelly} />
          </div>
        </div>
        <CharacterPanel title="기쁜 말랑이" subtitle="간식도 챙기고 다음 발바닥 코스로 떠나요!" />
      </section>

      <div className="flex gap-3">
        <Link to={stageMapPath} className="game-primary-button flex-1">
          스테이지로
        </Link>
        <Link to="/home" className="game-secondary-button flex-1">
          메인으로
        </Link>
      </div>
    </PageFrame>
  )
}
