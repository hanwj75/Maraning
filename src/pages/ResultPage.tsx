import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { buildChapterMapPath, buildStageMapPath } from '../features/stage/stage.routes'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { StageHamster } from '../shared/components/StageHamster'
import { useProgressStore } from '../stores/progressStore'
import { useQuizStore } from '../stores/quizStore'
import { useUiStore } from '../stores/ui-store'

export function ResultPage() {
  const result = useQuizStore((state) => state.result)
  const selectedDifficulty = useUiStore((state) => state.selectedDifficulty)
  const currentChapterId = useProgressStore(
    (state) => state.progressByDifficulty[selectedDifficulty]?.currentChapterId ?? null,
  )
  const [animationToken, setAnimationToken] = useState(0)
  const fallbackPath = currentChapterId
    ? buildStageMapPath(selectedDifficulty, currentChapterId)
    : buildChapterMapPath(selectedDifficulty)

  if (!result) {
    return <Navigate to={fallbackPath} replace />
  }

  const stageMapPath = buildStageMapPath(result.difficulty, result.chapterId)

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="정답 확인" backTo={stageMapPath} variant="plain" />

      <section className="game-card bg-gradient-to-br from-[#ddfff0] to-[#f7ffef] px-5 py-6 text-center">
        <p className="text-sm font-black text-[#55b486]">스테이지 클리어</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#4f6f49]">정말 잘했어요!</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#68825d]">
          {result.correctCount} / {result.totalCount} 문제를 맞혔어요.
        </p>
      </section>

      <button
        type="button"
        onClick={() => setAnimationToken((value) => value + 1)}
        className="game-card result-animation-shell flex min-h-[21rem] flex-1 items-center justify-center overflow-hidden px-4 py-4"
        aria-label="캐릭터 애니메이션 다시 재생"
      >
        <StageHamster
          shouldAnimate
          holdLastFrame
          animationToken={animationToken}
          className="h-[18rem] w-[13.5rem] max-w-full drop-shadow-[0_18px_24px_rgba(145,92,44,0.18)]"
        />
      </button>

      <Link to="/reward" className="game-primary-button mt-auto">
        보상 받기
      </Link>
    </PageFrame>
  )
}
