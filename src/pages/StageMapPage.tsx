import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { appintosAds } from '../sdk/appintosAds'
import { BottomNav } from '../shared/components/BottomNav'
import { ConfirmDialog } from '../shared/components/ConfirmDialog'
import { JellyBadge } from '../shared/components/JellyBadge'
import { difficultyLabelMap } from '../shared/difficulty'
import { isDifficultyKey } from '../data/difficulties'
import {
  buildChapterMapPath,
  buildQuizPath,
} from '../features/stage/stage.routes'
import { getQuizzesByDifficulty } from '../features/quiz/quiz.data'
import {
  getChapterById,
  getStageState,
  getStagesByChapter,
  getStagesByDifficulty,
  getChaptersByDifficulty,
} from '../features/stage/stage.utils'
import { getOrderedQuizzesByIds } from '../features/quiz/quiz.utils'
import { maraningAssets } from '../shared/maraning-assets'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useQuizStore } from '../stores/quizStore'
import { useUiStore } from '../stores/ui-store'
import { StagePawNode } from '../shared/components/StagePawNode'

const TOP_OVERLAY_SPACE = 152
const BOTTOM_NAV_SPACE = 116
const STAGE_NODE_SIZE = 120
const HAMSTER_SIZE = 112
const CONTENT_BOTTOM_MARGIN = 20

const nodePositions = [
  { left: '40%', top: 24 },
  { left: '20%', top: 140 },
  { left: '0%', top: 256 },
  { left: '20%', top: 372 },
  { left: '40%', top: 488 },
  { left: '60%', top: 604 },
  { left: '40%', top: 720 },
  { left: '20%', top: 836 },
  { left: '0%', top: 952 },
  { left: '20%', top: 1068 },
] as const

const hamsterPosition = {
  right: '5%',
  top: 316,
} as const

const lastStageBottom = Math.max(
  ...nodePositions.map((node) => node.top + STAGE_NODE_SIZE),
)
const hamsterBottom = hamsterPosition.top + HAMSTER_SIZE
const stageContentHeight =
  TOP_OVERLAY_SPACE +
  Math.max(lastStageBottom, hamsterBottom) +
  BOTTOM_NAV_SPACE +
  CONTENT_BOTTOM_MARGIN

export function StageMapPage() {
  const navigate = useNavigate()
  const { difficultyId, chapterId } = useParams()
  const setSelectedDifficulty = useUiStore(
    (state) => state.setSelectedDifficulty,
  )
  const [jellyMessage, setJellyMessage] = useState<string | null>(null)
  const [showAdDialog, setShowAdDialog] = useState(false)
  const startSession = useQuizStore((state) => state.startSession)
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)
  const claimAdReward = useJellyStore((state) => state.claimAdReward)
  const resolvedDifficulty =
    difficultyId && isDifficultyKey(difficultyId)
      ? difficultyId
      : 'absolute_beginner'
  const isValidRoute =
    Boolean(chapterId) && Boolean(difficultyId && isDifficultyKey(difficultyId))
  const chapters = getChaptersByDifficulty(resolvedDifficulty)
  const allStages = getStagesByDifficulty(resolvedDifficulty)
  const chapter = chapterId
    ? getChapterById(resolvedDifficulty, chapterId)
    : undefined
  const stages = chapterId
    ? getStagesByChapter(resolvedDifficulty, chapterId)
    : []
  const quizzes = getQuizzesByDifficulty(resolvedDifficulty)
  const progress = useProgressStore(
    (state) => state.progressByDifficulty[resolvedDifficulty],
  )
  const ensureDifficultyProgress = useProgressStore(
    (state) => state.ensureDifficultyProgress,
  )

  useEffect(() => {
    if (!isValidRoute) {
      return
    }

    setSelectedDifficulty(resolvedDifficulty)
    void ensureDifficultyProgress(resolvedDifficulty, chapters, allStages)
  }, [
    allStages,
    chapters,
    ensureDifficultyProgress,
    isValidRoute,
    resolvedDifficulty,
    setSelectedDifficulty,
  ])

  useEffect(() => {
    appintosAds.preloadRewardAd()
  }, [])

  useEffect(() => {
    void syncDailyJelly()
  }, [syncDailyJelly])

  if (!isValidRoute || !chapterId) {
    return <Navigate to="/difficulty" replace />
  }

  const safeProgress =
    progress ??
    useProgressStore.getState().progressByDifficulty[resolvedDifficulty]

  if (!chapter) {
    return <Navigate to={buildChapterMapPath(resolvedDifficulty)} replace />
  }

  if (!safeProgress) {
    return null
  }

  const unlockedChapterIds = safeProgress.unlockedChapterIds

  if (!unlockedChapterIds.includes(chapter.id)) {
    return <Navigate to={buildChapterMapPath(resolvedDifficulty)} replace />
  }

  const completedStageIds =
    safeProgress.completedStageIdsByChapter[chapter.id] ?? []
  const unlockedStageIds =
    safeProgress.unlockedStageIdsByChapter[chapter.id] ?? []
  const currentStageLabel =
    stages.find((stage) => stage.id === safeProgress.currentStageId)?.title ??
    stages[0]?.title ??
    '스테이지'

  return (
    <main className="game-screen-shell">
      <div className="game-phone game-stage-map-shell">
        <div className="absolute inset-x-0 top-0 z-30 px-4 pt-4">
          <div className="flex items-center justify-end gap-1 px-1 pb-3">
            <JellyBadge
              count={currentJelly}
              className="min-w-0 max-w-[8.5rem] shrink"
            />
          </div>

          {jellyMessage ? (
            <div className="px-2 pb-2">
              <div className="rounded-full bg-white/88 px-4 py-2 text-center text-xs font-black text-[#8a5a3b] shadow-[0_10px_20px_rgba(155,108,74,0.12)]">
                {jellyMessage}
              </div>
            </div>
          ) : null}

          <div className="px-2">
            <div className="relative mx-auto h-[4.55rem] w-full max-w-[19.5rem]">
              <img
                src={maraningAssets.topbar}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-fill"
              />
              <Link
                to={buildChapterMapPath(resolvedDifficulty)}
                aria-label="뒤로가기"
                className="absolute left-[3.5%] top-1/2 z-10 block h-10 w-10 -translate-y-1/2 rounded-full transition-transform duration-100 active:scale-95"
              />
              <div className="absolute inset-0 overflow-hidden text-white">
                <span className="absolute inset-0 flex items-center justify-center overflow-hidden px-[4.4rem] text-center text-[0.95rem] font-black leading-none tracking-tight text-ellipsis whitespace-nowrap">
                  {difficultyLabelMap[resolvedDifficulty]} · {chapter.title} ·{' '}
                  {currentStageLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-4">
          <div className="pointer-events-auto">
            <BottomNav inFlow onAdClick={() => {
              if (!appintosAds.isRewardAdReady()) {
                setJellyMessage('광고를 준비 중이에요. 잠시 후 다시 시도해 주세요.')
                return
              }
              setShowAdDialog(true)
            }} />
          </div>
        </div>

        <div className="relative flex h-full min-h-0 flex-col px-4 py-4">
          <section className="relative min-h-0 flex-1 rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,250,241,0.28),rgba(245,220,191,0.26))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.32),_transparent_38%)]" />
            <div className="relative h-full min-h-0 overflow-y-auto px-3 py-3">
              <div
                className="relative"
                style={{ height: `${stageContentHeight}px` }}
              >
                {stages.slice(0, nodePositions.length).map((stage, index) => {
                  const position = nodePositions[index]

                  if (!position) {
                    return null
                  }

                  const state = getStageState({
                    stage,
                    completedStageIds,
                    unlockedStageIds,
                  })

                  return (
                    <StagePawNode
                      key={stage.id}
                      stageNumber={stage.order}
                      state={state}
                      to={buildQuizPath(
                        resolvedDifficulty,
                        chapter.id,
                        stage.id,
                      )}
                      className="absolute"
                      style={{
                        left: position.left,
                        top: `${TOP_OVERLAY_SPACE + position.top}px`,
                      }}
                      sizeClassName="h-[7.5rem] w-[7.5rem]"
                      onSelect={
                        state === 'locked'
                          ? undefined
                          : () => {
                              setJellyMessage(null)
                              startSession({
                                chapterId: chapter.id,
                                stageId: stage.id,
                                difficulty: resolvedDifficulty,
                                quizIds: stage.quizIds,
                                quizzes: getOrderedQuizzesByIds(
                                  quizzes.filter(
                                    (quiz) => quiz.stageId === stage.id,
                                  ),
                                  stage.quizIds,
                                ),
                              })
                              navigate(
                                buildQuizPath(
                                  resolvedDifficulty,
                                  chapter.id,
                                  stage.id,
                                ),
                              )
                            }
                      }
                    />
                  )
                })}

                <div
                  className="absolute"
                  style={{
                    right: hamsterPosition.right,
                    top: `${TOP_OVERLAY_SPACE + hamsterPosition.top}px`,
                  }}
                >
                  <img
                    src={maraningAssets.hamster}
                    alt=""
                    aria-hidden="true"
                    className="h-28 w-28 object-contain drop-shadow-[0_18px_24px_rgba(145,92,44,0.18)]"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <ConfirmDialog
          open={showAdDialog}
          message="광고를 보시겠습니까?"
          onConfirm={async () => {
            const rewardResult = await claimAdReward()

            if (!rewardResult.granted) {
              setJellyMessage(rewardResult.message ?? '광고 보상을 받지 못했어요.')
            } else if (rewardResult.current === rewardResult.previous) {
              setJellyMessage('젤리가 이미 가득 차 있어요.')
            } else {
              setJellyMessage(`젤리 ${rewardResult.added}개를 받았어요!`)
            }

            setShowAdDialog(false)
          }}
          onCancel={() => setShowAdDialog(false)}
        />
      </div>
    </main>
  )
}
