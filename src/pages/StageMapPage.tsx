import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from '../shared/components/BottomNav'
import { ConfirmDialog } from '../shared/components/ConfirmDialog'
import { JellyBadge } from '../shared/components/JellyBadge'
import { StageHamster } from '../shared/components/StageHamster'
import { StagePawNode } from '../shared/components/StagePawNode'
import { difficultyLabelMap } from '../shared/difficulty'
import { getStageState, getStagesByDifficulty } from '../features/stage/stage.utils'
import { maraningAssets } from '../shared/maraning-assets'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useQuizStore } from '../stores/quizStore'
import { useUiStore } from '../stores/ui-store'

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

const lastStageBottom = Math.max(...nodePositions.map((node) => node.top + STAGE_NODE_SIZE))
const hamsterBottom = hamsterPosition.top + HAMSTER_SIZE
const stageContentHeight =
  TOP_OVERLAY_SPACE +
  Math.max(lastStageBottom, hamsterBottom) +
  BOTTOM_NAV_SPACE +
  CONTENT_BOTTOM_MARGIN

export function StageMapPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { selectedDifficulty } = useUiStore()
  const stages = getStagesByDifficulty(selectedDifficulty)
  const difficultyLabel = difficultyLabelMap[selectedDifficulty]
  const [shouldAnimateHamster, setShouldAnimateHamster] = useState(false)
  const [jellyMessage, setJellyMessage] = useState<string | null>(null)
  const [showAdDialog, setShowAdDialog] = useState(false)
  const progress = useProgressStore((state) => state.progressByDifficulty[selectedDifficulty])
  const ensureDifficultyProgress = useProgressStore((state) => state.ensureDifficultyProgress)
  const startSession = useQuizStore((state) => state.startSession)
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)
  const mockRewardJelly = useJellyStore((state) => state.mockRewardJelly)
  const currentStageLabel =
    stages.find((stage) => stage.id === progress?.currentStageId)?.title ?? stages[0]?.title ?? '스테이지'

  useEffect(() => {
    ensureDifficultyProgress(selectedDifficulty, stages)
  }, [ensureDifficultyProgress, selectedDifficulty, stages])

  useEffect(() => {
    syncDailyJelly()
  }, [syncDailyJelly])

  useEffect(() => {
    const playCharacterAnimation = Boolean(
      (location.state as { playCharacterAnimation?: boolean } | null)?.playCharacterAnimation,
    )

    if (!playCharacterAnimation) {
      return
    }

    setShouldAnimateHamster(true)

    const resetAnimationFlag = window.setTimeout(() => {
      setShouldAnimateHamster(false)
      navigate(location.pathname, { replace: true, state: null })
    }, 120 * maraningAssets.hamsterFrames.length + 80)

    return () => window.clearTimeout(resetAnimationFlag)
  }, [location.pathname, location.state, navigate])

  return (
    <main className="game-screen-shell">
      <div className="game-phone game-stage-map-shell">
        <div className="absolute inset-x-0 top-0 z-30 px-4 pt-4">
          <div className="flex items-center justify-end gap-1 px-1 pb-3">
            <div className="stage-map-counter">
              <img
                src={maraningAssets.numberOfDaysConnected}
                alt=""
                aria-hidden="true"
                className="h-7 w-6 object-contain"
              />
              <span>0</span>
            </div>
            <div className="stage-map-counter">
              <img
                src={maraningAssets.feedstuff}
                alt=""
                aria-hidden="true"
                className="h-7 w-7 object-contain"
              />
              <span>630</span>
            </div>
            <JellyBadge count={currentJelly} className="min-w-0 max-w-[8.5rem] shrink" />
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
                to="/difficulty"
                aria-label="뒤로가기"
                className="absolute left-[3.5%] top-1/2 z-10 block h-10 w-10 -translate-y-1/2 rounded-full transition-transform duration-100 active:scale-95"
              />
              <div className="absolute inset-0 overflow-hidden text-white">
                <span className="absolute inset-0 flex items-center justify-center overflow-hidden px-[5.1rem] text-center text-[1rem] font-black leading-none tracking-tight text-ellipsis whitespace-nowrap">
                  {difficultyLabel} · {currentStageLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-4">
          <div className="pointer-events-auto">
            <BottomNav
              inFlow
              onAdClick={() => setShowAdDialog(true)}
            />
          </div>
        </div>

        <div className="relative flex h-full min-h-0 flex-col px-4 py-4">
          <section className="relative min-h-0 flex-1 rounded-[2.2rem] bg-[linear-gradient(180deg,rgba(255,250,241,0.28),rgba(245,220,191,0.26))] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.32),_transparent_38%)]" />
            <div className="relative h-full min-h-0 overflow-y-auto px-3 py-3">
              <div className="relative" style={{ height: `${stageContentHeight}px` }}>
                {stages.slice(0, nodePositions.length).map((stage, index) => {
                  const position = nodePositions[index]

                  if (!position || !progress) {
                    return null
                  }

                  const state = getStageState({
                    stage,
                    clearedStageIds: progress.clearedStageIds,
                    unlockedStageIds: progress.unlockedStageIds,
                  })

                  return (
                    <StagePawNode
                      key={stage.id}
                      stageNumber={stage.order}
                      state={state}
                      to="/quiz"
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
                                stageId: stage.id,
                                difficulty: selectedDifficulty,
                                quizIds: stage.quizIds,
                              })
                              navigate('/quiz')
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
                  <StageHamster
                    shouldAnimate={shouldAnimateHamster}
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
          onConfirm={() => {
            const rewardResult = mockRewardJelly(5)

            if (rewardResult.current === rewardResult.previous) {
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
