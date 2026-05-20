import { useEffect } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { difficultyLabelMap } from '../shared/difficulty'
import { isDifficultyKey } from '../data/difficulties'
import { buildStageMapPath } from '../features/stage/stage.routes'
import { getChapterState, getChaptersByDifficulty, getStagesByDifficulty } from '../features/stage/stage.utils'
import { useProgressStore } from '../stores/progressStore'
import { useUiStore } from '../stores/ui-store'
import { ChapterLineSlice } from './ChapterLineSlice'

const chapterBackgroundAsset = '/assets/maraning/chapter_background.png'
const finishLineAsset = '/assets/maraning/finish_line.png'

export function ChapterMapPage() {
  const navigate = useNavigate()
  const { difficultyId } = useParams()
  const setSelectedDifficulty = useUiStore((state) => state.setSelectedDifficulty)
  const resolvedDifficulty = difficultyId && isDifficultyKey(difficultyId) ? difficultyId : 'absolute_beginner'
  const isValidDifficulty = Boolean(difficultyId && isDifficultyKey(difficultyId))
  const chapters = getChaptersByDifficulty(resolvedDifficulty)
  const stages = getStagesByDifficulty(resolvedDifficulty)
  const progress = useProgressStore((state) => state.progressByDifficulty[resolvedDifficulty])
  const ensureDifficultyProgress = useProgressStore((state) => state.ensureDifficultyProgress)

  useEffect(() => {
    if (!isValidDifficulty) {
      return
    }

    setSelectedDifficulty(resolvedDifficulty)
    ensureDifficultyProgress(resolvedDifficulty, chapters, stages)
  }, [chapters, ensureDifficultyProgress, isValidDifficulty, resolvedDifficulty, setSelectedDifficulty, stages])

  if (!isValidDifficulty) {
    return <Navigate to="/difficulty" replace />
  }

  const safeProgress = progress ?? useProgressStore.getState().progressByDifficulty[resolvedDifficulty]

  if (!safeProgress) {
    return null
  }

  const chapterRows = Array.from({ length: 10 }, (_, index) => {
    const chapter = chapters[index]

    if (!chapter) {
      return {
        key: `placeholder-chapter-${index + 1}`,
        order: index + 1,
        title: '준비 중인 큰 스테이지',
        state: 'locked' as const,
        locked: true,
        chapterId: null,
      }
    }

    const state = getChapterState({
      chapter,
      completedChapterIds: safeProgress.completedChapterIds,
      unlockedChapterIds: safeProgress.unlockedChapterIds,
    })

    return {
      key: chapter.id,
      order: chapter.order,
      title: chapter.title,
      state,
      locked: state === 'locked',
      chapterId: chapter.id,
    }
  })

  return (
    <PageFrame className="game-phone--scroll" contentClassName="gap-0 pb-28">
      <div
        className="-mx-4 -mt-4 min-h-full px-4 pb-8"
        style={{
          backgroundColor: '#f3dfc6',
          backgroundImage: `linear-gradient(180deg, rgba(255,248,232,0.22), rgba(235,201,165,0.3)), url(${chapterBackgroundAsset})`,
          backgroundPosition: 'center top',
          backgroundRepeat: 'repeat-y',
          backgroundSize: 'cover, 100% auto',
        }}
      >
        <div className="pt-4">
          <CuteTopBar title={`${difficultyLabelMap[resolvedDifficulty]} 챕터`} backTo="/difficulty" variant="plain" />
        </div>

        <section className="relative mt-6 pb-10">
          {chapterRows.map((row) => {
            const statusLabel = row.state === 'completed' ? '완료' : row.state === 'locked' ? '잠금' : '진행 가능'
            const statusTone =
              row.state === 'completed'
                ? 'bg-[#e6f7eb] text-[#2d7a4f]'
                : row.state === 'locked'
                  ? 'bg-[#f2e6db] text-[#8f6d53]'
                  : 'bg-[#fff0df] text-[#c26b48]'
            const helperText =
              row.state === 'completed'
                ? '완료한 큰 스테이지예요. 다시 들어갈 수 있어요.'
                : row.state === 'locked'
                  ? '이전 큰 스테이지를 클리어하면 열려요'
                  : '지금 바로 들어갈 수 있어요'

            return (
              <div
                key={row.key}
                className="mx-auto w-full max-w-[22rem] py-5 first:pt-0"
              >
                <button
                  type="button"
                  disabled={row.locked || !row.chapterId}
                  onClick={() => {
                    if (!row.chapterId) {
                      return
                    }

                    setSelectedDifficulty(resolvedDifficulty)
                    navigate(buildStageMapPath(resolvedDifficulty, row.chapterId))
                  }}
                  className={`relative w-full ${row.locked ? 'cursor-not-allowed opacity-70 saturate-50' : 'active:scale-[0.985]'} transition-transform duration-100`}
                  aria-label={`${row.order}. ${row.title}`}
                >
                  <div className="relative z-10 mx-auto mb-3 flex min-h-[5.8rem] w-[15.5rem] max-w-[15.5rem] flex-col items-center text-center">
                    <span className={`rounded-full px-3 py-1 text-xs font-black tracking-tight shadow-[0_8px_16px_rgba(171,120,72,0.14)] ${statusTone}`}>
                      {row.state === 'locked' ? `🔒 ${statusLabel}` : statusLabel}
                    </span>
                    <div className="mt-2 w-full rounded-[1.25rem] bg-white/88 px-4 py-3 shadow-[0_12px_26px_rgba(171,120,72,0.16)] backdrop-blur-[2px]">
                      <h2 className="text-[1.1rem] font-black leading-snug tracking-tight text-[#6c4025]">
                        {row.order}. {row.title}
                      </h2>
                      <p className="mt-1 text-sm font-semibold leading-5 text-[#94684a]">
                        {helperText}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mx-auto flex h-[4.6rem] w-full items-center justify-center overflow-hidden rounded-[1.6rem] px-2 text-left"
                    style={{
                      filter:
                        row.state === 'completed'
                          ? 'drop-shadow(0 14px 28px rgba(92, 170, 124, 0.22))'
                          : 'drop-shadow(0 14px 28px rgba(171, 120, 72, 0.2))',
                    }}
                  >
                    <ChapterLineSlice
                      index={row.order}
                      className="mx-auto h-[4.1rem] w-full max-w-[19.5rem]"
                    />
                  </div>
                </button>
              </div>
            )
          })}

          <div className="mt-3 flex flex-col items-center gap-3 pb-4">
            <img
              src={finishLineAsset}
              alt=""
              aria-hidden="true"
              className="h-auto w-full max-w-[14rem] object-contain drop-shadow-[0_14px_24px_rgba(130,90,58,0.2)]"
            />
            <p className="text-sm font-black text-[#7b4d32]">이 난이도의 마지막 도착선</p>
          </div>
        </section>

        <div className="px-3">
          <Link
            to={
              safeProgress.currentChapterId
                ? buildStageMapPath(resolvedDifficulty, safeProgress.currentChapterId)
                : '/difficulty'
            }
            className="game-secondary-button"
          >
            현재 큰 스테이지로 이동
          </Link>
        </div>
      </div>
    </PageFrame>
  )
}
