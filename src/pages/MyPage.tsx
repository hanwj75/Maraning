import { Link } from 'react-router-dom'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { buildStageMapPath } from '../features/stage/stage.routes'
import { PageFrame } from '../shared/components/PageFrame'
import { useUiStore } from '../stores/ui-store'
import { useProgressStore } from '../stores/progressStore'
import { getChapterById, getStageById } from '../features/stage/stage.utils'

const DEFAULT_USER_NAME = '말랑이 친구'

export function MyPage() {
  const selectedDifficulty = useUiStore((state) => state.selectedDifficulty)
  const progress = useProgressStore(
    (state) => state.progressByDifficulty[selectedDifficulty] ?? null,
  )

  const currentChapter = progress?.currentChapterId
    ? getChapterById(selectedDifficulty, progress.currentChapterId)
    : undefined
  const currentStage = progress?.currentStageId
    ? getStageById(selectedDifficulty, progress.currentStageId)
    : undefined

  const currentStageLabel =
    currentChapter && currentStage
      ? `챕터${currentChapter.order} : ${currentStage.order}스테이지 · ${currentStage.title}`
      : currentChapter
        ? `챕터${currentChapter.order} 진행 중`
        : '아직 진행 중인 스테이지가 없어요.'
  const currentStagePath =
    currentChapter && currentStage
      ? buildStageMapPath(selectedDifficulty, currentChapter.id)
      : null

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="내 정보" backTo="/home" variant="plain" />

      <section className="game-card bg-white/82 px-5 py-5">
        <p className="text-sm font-black text-[#ef9a8f]">사용자 이름</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-[#7b4d32]">
          {DEFAULT_USER_NAME}
        </h1>
      </section>

      <section className="game-card bg-white/82 px-5 py-5">
        <p className="text-sm font-black text-[#ef9a8f]">현재 진행 중인 코스</p>
        {currentStagePath ? (
          <Link
            to={currentStagePath}
            className="mt-3 block rounded-[1.4rem] bg-[#fff3e4] px-4 py-4 text-lg font-black leading-8 text-[#7b4d32] shadow-[0_12px_22px_rgba(194,143,86,0.14)] transition-transform duration-100 active:scale-[0.985]"
          >
            {currentStageLabel}
          </Link>
        ) : (
          <p className="mt-3 text-lg font-black leading-8 text-[#7b4d32]">
            {currentStageLabel}
          </p>
        )}
      </section>
    </PageFrame>
  )
}
