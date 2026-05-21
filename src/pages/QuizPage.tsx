import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { isDifficultyKey } from '../data/difficulties'
import { buildStageMapPath } from '../features/stage/stage.routes'
import { ConfirmDialog } from '../shared/components/ConfirmDialog'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { JellyBadge } from '../shared/components/JellyBadge'
import { PageFrame } from '../shared/components/PageFrame'
import { getQuizzesByDifficulty } from '../features/quiz/quiz.data'
import {
  buildQuizSessionAnswer,
  getDisplayChoicesForQuiz,
  getMatchingDisplayChoicesForQuiz,
  getOrderedQuizzesByIds,
  getQuizProgressLabel,
  removeMatchingPairByCardId,
  upsertMatchingPair,
} from '../features/quiz/quiz.utils'
import {
  getStageById,
  getStagesByDifficulty,
  getChaptersByDifficulty,
} from '../features/stage/stage.utils'
import {
  hamsterFailLifeState1Animation,
  hamsterFailLifeState2Animation,
  maraningAssets,
} from '../shared/maraning-assets'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useQuizStore } from '../stores/quizStore'

type QuizHamsterAnimation = 'fail-life-state1' | 'fail-life-state2' | null

export function QuizPage() {
  const navigate = useNavigate()
  const { difficultyId, chapterId, stageId } = useParams()
  const session = useQuizStore((state) => state.session)
  const submitQuizAnswer = useQuizStore((state) => state.submitQuizAnswer)
  const clearSession = useQuizStore((state) => state.clearSession)
  const completeStage = useProgressStore((state) => state.completeStage)
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)
  const mockRewardJelly = useJellyStore((state) => state.mockRewardJelly)
  const tryConsumeForSubmission = useJellyStore(
    (state) => state.tryConsumeForSubmission,
  )
  const grantCleanSolveReward = useJellyStore(
    (state) => state.grantCleanSolveReward,
  )
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [orderedChoiceIds, setOrderedChoiceIds] = useState<string[]>([])
  const [matchingPairs, setMatchingPairs] = useState<
    Array<{ leftId: string; rightId: string }>
  >([])
  const [pendingLeftChoiceId, setPendingLeftChoiceId] = useState<string | null>(
    null,
  )
  const [showJellyRecoveryDialog, setShowJellyRecoveryDialog] = useState(false)
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false)
  const [currentHamsterSrc, setCurrentHamsterSrc] = useState<string>(
    maraningAssets.hamster,
  )
  const [activeHamsterAnimation, setActiveHamsterAnimation] =
    useState<QuizHamsterAnimation>(null)
  const [hamsterAnimationToken, setHamsterAnimationToken] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const correctOverlayTimerRef = useRef<number | null>(null)
  const hamsterAnimationTimerRef = useRef<number | null>(null)
  const shouldClearSessionOnUnmountRef = useRef(false)
  const routeDifficulty =
    difficultyId && isDifficultyKey(difficultyId) ? difficultyId : null
  const sessionDifficulty =
    session?.difficulty ?? routeDifficulty ?? 'absolute_beginner'
  const sessionStageId = session?.stageId ?? stageId ?? ''
  const stageMapPath =
    routeDifficulty && chapterId
      ? buildStageMapPath(routeDifficulty, chapterId)
      : '/difficulty'
  const failLifeLabel = Array.from({ length: 3 }, (_, index) =>
    index < (session?.failLife ?? 0) ? '❤️' : '🖤',
  ).join('')
  const quizzes = useMemo(
    () =>
      session
        ? getOrderedQuizzesByIds(
            getQuizzesByDifficulty(sessionDifficulty).filter(
              (quiz) => quiz.stageId === sessionStageId,
            ),
            session.quizIds,
          )
        : [],
    [session, sessionDifficulty, sessionStageId],
  )
  const chapters = useMemo(
    () => getChaptersByDifficulty(sessionDifficulty),
    [sessionDifficulty],
  )
  const allStages = useMemo(
    () => getStagesByDifficulty(sessionDifficulty),
    [sessionDifficulty],
  )
  const stage = useMemo(
    () =>
      session ? getStageById(sessionDifficulty, sessionStageId) : undefined,
    [session, sessionDifficulty, sessionStageId],
  )
  const currentQuiz = session ? quizzes[session.currentQuizIndex] : undefined
  const progressLabel = session
    ? getQuizProgressLabel(session.currentQuizIndex, quizzes.length)
    : '0 / 10'
  const displayChoices = useMemo(
    () =>
      currentQuiz && session
        ? getDisplayChoicesForQuiz(
            currentQuiz,
            session.displayChoiceIdsByQuizId,
          )
        : [],
    [currentQuiz, session],
  )
  const matchingDisplay = useMemo(
    () =>
      currentQuiz && session
        ? getMatchingDisplayChoicesForQuiz(
            currentQuiz,
            session.matchingDisplayByQuizId,
          )
        : { leftChoiceIds: [], rightChoiceIds: [] },
    [currentQuiz, session],
  )
  const leftChoices = useMemo(
    () =>
      currentQuiz
        ? matchingDisplay.leftChoiceIds
            .map((choiceId) =>
              currentQuiz.choices.find((choice) => choice.id === choiceId),
            )
            .filter((choice): choice is (typeof currentQuiz.choices)[number] =>
              Boolean(choice),
            )
        : [],
    [currentQuiz, matchingDisplay.leftChoiceIds],
  )
  const rightChoices = useMemo(
    () =>
      currentQuiz
        ? matchingDisplay.rightChoiceIds
            .map((choiceId) =>
              currentQuiz.choices.find((choice) => choice.id === choiceId),
            )
            .filter((choice): choice is (typeof currentQuiz.choices)[number] =>
              Boolean(choice),
            )
        : [],
    [currentQuiz, matchingDisplay.rightChoiceIds],
  )

  const resetLocalState = () => {
    setSelectedChoiceId(null)
    setOrderedChoiceIds([])
    setMatchingPairs([])
    setPendingLeftChoiceId(null)
  }

  const clearHamsterAnimationTimer = useCallback(() => {
    if (hamsterAnimationTimerRef.current !== null) {
      window.clearTimeout(hamsterAnimationTimerRef.current)
      hamsterAnimationTimerRef.current = null
    }
  }, [])

  const resetHamsterState = useCallback(() => {
    clearHamsterAnimationTimer()
    setActiveHamsterAnimation(null)
    setCurrentHamsterSrc(maraningAssets.hamster)
  }, [clearHamsterAnimationTimer])

  const runFailLifeHamsterState = (nextLife: number) => {
    clearHamsterAnimationTimer()

    if (nextLife === 2) {
      setCurrentHamsterSrc(maraningAssets.hamsterFail1)
      setActiveHamsterAnimation('fail-life-state2')
      setHamsterAnimationToken((value) => value + 1)
      hamsterAnimationTimerRef.current = window.setTimeout(
        () => {
          setActiveHamsterAnimation(null)
          hamsterAnimationTimerRef.current = null
        },
        hamsterFailLifeState2Animation.frameCount *
          hamsterFailLifeState2Animation.frameDurationMs +
          20,
      )
      return
    }

    if (nextLife === 1) {
      setCurrentHamsterSrc(maraningAssets.hamsterFail2)
      setActiveHamsterAnimation('fail-life-state1')
      setHamsterAnimationToken((value) => value + 1)
      hamsterAnimationTimerRef.current = window.setTimeout(
        () => {
          setActiveHamsterAnimation(null)
          hamsterAnimationTimerRef.current = null
        },
        hamsterFailLifeState1Animation.frameCount *
          hamsterFailLifeState1Animation.frameDurationMs +
          20,
      )
      return
    }

    setActiveHamsterAnimation(null)
  }

  useEffect(() => {
    syncDailyJelly()
  }, [syncDailyJelly])

  useEffect(() => {
    return () => {
      if (correctOverlayTimerRef.current !== null) {
        window.clearTimeout(correctOverlayTimerRef.current)
      }

      resetHamsterState()

      if (shouldClearSessionOnUnmountRef.current) {
        clearSession()
      }
    }
  }, [clearSession, resetHamsterState])

  if (!routeDifficulty || !chapterId || !stageId) {
    return <Navigate to="/difficulty" replace />
  }

  if (!session) {
    return <Navigate to={stageMapPath} replace />
  }

  if (!stage || !currentQuiz || quizzes.length !== 10) {
    return <Navigate to={stageMapPath} replace />
  }

  if (stage.chapterId !== chapterId) {
    return <Navigate to={stageMapPath} replace />
  }

  const finalizeSubmission = (params: {
    isCorrect: boolean
    status: 'next' | 'finished' | 'retry' | 'failed'
    remainingFailLife: number
    preserveCurrentResponse?: boolean
  }) => {
    const { isCorrect, status, preserveCurrentResponse = false } = params

    if (!isCorrect) {
      if (!preserveCurrentResponse) {
        resetLocalState()
      }

      if (status === 'failed') {
        resetHamsterState()
        shouldClearSessionOnUnmountRef.current = true
        navigate(stageMapPath, { replace: true })
      }

      return
    }

    setIsSubmitting(true)
    setShowCorrectOverlay(true)

    correctOverlayTimerRef.current = window.setTimeout(() => {
      setShowCorrectOverlay(false)
      setIsSubmitting(false)
      resetLocalState()

      if (status === 'finished') {
        resetHamsterState()
        shouldClearSessionOnUnmountRef.current = true
        navigate('/result', { replace: true })
      }

      correctOverlayTimerRef.current = null
    }, 700)
  }

  const handleSubmit = () => {
    if (isSubmitting) {
      return
    }

    const consumeJellyOrFail = () => {
      const canSubmit = tryConsumeForSubmission()

      if (canSubmit) {
        return true
      }

      setShowJellyRecoveryDialog(true)

      return false
    }

    if (
      currentQuiz.type === 'image_select' ||
      currentQuiz.type === 'blank_fill' ||
      currentQuiz.type === 'sentence_choice' ||
      currentQuiz.type === 'vocabulary_choice' ||
      currentQuiz.type === 'grammar_choice'
    ) {
      const selectedChoice = currentQuiz.choices.find(
        (choice) => choice.id === selectedChoiceId,
      )

      if (!selectedChoiceId || !selectedChoice) {
        return
      }

      if (!consumeJellyOrFail()) {
        return
      }

      const answer = buildQuizSessionAnswer(currentQuiz, {
        type: currentQuiz.type,
        choiceId: selectedChoiceId,
        value: selectedChoice.text,
      })
      const outcome = submitQuizAnswer(answer)
      const remainingFailLife = answer.isCorrect
        ? session.failLife
        : Math.max(session.failLife - 1, 0)
      if (answer.isCorrect && outcome.awardedCleanSolveBonus) {
        grantCleanSolveReward()
      }

      if (outcome.status === 'finished') {
        completeStage(session.difficulty, session.stageId, chapters, allStages)
      }

      if (!answer.isCorrect) {
        runFailLifeHamsterState(remainingFailLife)
      }

      finalizeSubmission({
        isCorrect: answer.isCorrect,
        status: outcome.status,
        remainingFailLife,
      })

      return
    }

    if (currentQuiz.type === 'word_order') {
      if (orderedChoiceIds.length !== currentQuiz.choices.length) {
        return
      }

      if (!consumeJellyOrFail()) {
        return
      }

      const orderedValues = orderedChoiceIds.map(
        (choiceId) =>
          currentQuiz.choices.find((choice) => choice.id === choiceId)?.text ??
          '',
      )

      const answer = buildQuizSessionAnswer(currentQuiz, {
        type: 'word_order',
        orderedValues,
      })
      const outcome = submitQuizAnswer(answer)
      const remainingFailLife = answer.isCorrect
        ? session.failLife
        : Math.max(session.failLife - 1, 0)
      if (answer.isCorrect && outcome.awardedCleanSolveBonus) {
        grantCleanSolveReward()
      }

      if (outcome.status === 'finished') {
        completeStage(session.difficulty, session.stageId, chapters, allStages)
      }

      if (!answer.isCorrect) {
        runFailLifeHamsterState(remainingFailLife)
      }

      finalizeSubmission({
        isCorrect: answer.isCorrect,
        status: outcome.status,
        remainingFailLife,
      })

      return
    }

    if (
      matchingPairs.length !== leftChoices.length ||
      leftChoices.length !== rightChoices.length
    ) {
      return
    }

    if (!consumeJellyOrFail()) {
      return
    }

    const answer = buildQuizSessionAnswer(currentQuiz, {
      type: 'matching',
      pairs: matchingPairs,
    })
    const outcome = submitQuizAnswer(answer)
    const remainingFailLife = answer.isCorrect
      ? session.failLife
      : Math.max(session.failLife - 1, 0)
    if (answer.isCorrect && outcome.awardedCleanSolveBonus) {
      grantCleanSolveReward()
    }

    if (outcome.status === 'finished') {
      completeStage(session.difficulty, session.stageId, chapters, allStages)
    }

    if (!answer.isCorrect) {
      runFailLifeHamsterState(remainingFailLife)
    }

    finalizeSubmission({
      isCorrect: answer.isCorrect,
      status: outcome.status,
      remainingFailLife,
      preserveCurrentResponse: true,
    })
  }

  return (
    <PageFrame contentClassName="gap-5">
      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CuteTopBar
            title={stage.title}
            backTo={stageMapPath}
            variant="plain"
          />
        </div>
        <JellyBadge count={currentJelly} className="shrink-0" />
      </section>

      <section className="game-card bg-gradient-to-br from-[#fff2db] to-[#fff9ef] px-5 py-5">
        <p className="text-sm font-black text-[#ed9b8f]">
          진행 상태 {progressLabel}
        </p>
        <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#7b4d32]">
          {currentQuiz.question}
        </h1>
        {currentQuiz.prompt !== currentQuiz.question ? (
          <p className="mt-3 rounded-[1.5rem] bg-white/72 px-4 py-3 text-base font-black leading-7 text-[#8b5d3c]">
            {currentQuiz.prompt}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        {(currentQuiz.type === 'image_select' ||
          currentQuiz.type === 'blank_fill' ||
          currentQuiz.type === 'sentence_choice' ||
          currentQuiz.type === 'vocabulary_choice' ||
          currentQuiz.type === 'grammar_choice') && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayChoices.map((choice) => {
              const selected = selectedChoiceId === choice.id

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedChoiceId(choice.id)}
                  className={`rounded-[1.9rem] px-5 py-6 text-left text-lg font-black shadow-[0_14px_26px_rgba(194,141,93,0.16)] transition-transform duration-100 active:scale-95 ${
                    selected
                      ? 'bg-[#ffd7e1] text-[#7b4d32]'
                      : 'bg-white/82 text-[#7b4d32]'
                  }`}
                >
                  <span className="block text-sm font-black text-[#ef9a8f]">
                    선택지
                  </span>
                  <span className="mt-2 block text-base leading-7 font-semibold text-[#9b6c4a]">
                    {choice.text}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {currentQuiz.type === 'word_order' && (
          <>
            <div className="game-card min-h-24 bg-white/78 px-4 py-4">
              <p className="text-sm font-black text-[#ed9b8f]">현재 순서</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {orderedChoiceIds.length === 0 ? (
                  <span className="text-sm font-semibold text-[#9b6c4a]">
                    토큰을 순서대로 눌러주세요.
                  </span>
                ) : (
                  orderedChoiceIds.map((choiceId) => {
                    const choice = currentQuiz.choices.find(
                      (item) => item.id === choiceId,
                    )
                    return (
                      <button
                        key={choiceId}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          setOrderedChoiceIds((prev) =>
                            prev.filter((item) => item !== choiceId),
                          )
                        }
                        className="rounded-full bg-[#ffd7e1] px-3 py-2 text-sm font-black text-[#7b4d32]"
                      >
                        {choice?.text}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {displayChoices.map((choice) => {
                const alreadySelected = orderedChoiceIds.includes(choice.id)
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={alreadySelected || isSubmitting}
                    onClick={() =>
                      setOrderedChoiceIds((prev) => [...prev, choice.id])
                    }
                    className={`rounded-[1.7rem] px-4 py-5 text-left text-base font-black shadow-[0_14px_26px_rgba(194,141,93,0.16)] ${
                      alreadySelected
                        ? 'bg-[#f2e4d6] text-[#bc9b7f]'
                        : 'bg-white/82 text-[#7b4d32] transition-transform duration-100 active:scale-95'
                    }`}
                  >
                    {choice.text}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {currentQuiz.type === 'matching' && (
          <>
            <div className="game-card bg-white/78 px-4 py-4">
              <p className="text-sm font-black text-[#ed9b8f]">연결된 쌍</p>
              <div className="mt-3 space-y-2">
                {matchingPairs.length === 0 ? (
                  <span className="text-sm font-semibold text-[#9b6c4a]">
                    왼쪽 한국어 카드와 오른쪽 영어 카드를 차례대로 눌러
                    연결하세요.
                  </span>
                ) : (
                  matchingPairs.map((pair) => {
                    const left = currentQuiz.choices.find(
                      (choice) => choice.id === pair.leftId,
                    )
                    const right = currentQuiz.choices.find(
                      (choice) => choice.id === pair.rightId,
                    )
                    return (
                      <div
                        key={`${pair.leftId}-${pair.rightId}`}
                        className="rounded-2xl bg-[#fff2db] px-3 py-2 text-sm font-black text-[#7b4d32]"
                      >
                        {right?.text} ↔ {left?.text}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                {leftChoices.map((choice) => {
                  const used = matchingPairs.some(
                    (pair) => pair.rightId === choice.id,
                  )
                  const selected = pendingLeftChoiceId === choice.id
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (used) {
                          setMatchingPairs((prev) =>
                            removeMatchingPairByCardId(prev, choice.id),
                          )
                          setPendingLeftChoiceId((prev) =>
                            prev === choice.id ? null : choice.id,
                          )
                          return
                        }

                        setPendingLeftChoiceId((prev) =>
                          prev === choice.id ? null : choice.id,
                        )
                      }}
                      className={`w-full rounded-[1.6rem] px-4 py-4 text-left text-base font-black ${
                        used
                          ? 'bg-[#fff0df] text-[#7b4d32] shadow-[inset_0_0_0_2px_rgba(232,157,133,0.55)]'
                          : selected
                            ? 'bg-[#ffd7e1] text-[#7b4d32]'
                            : 'bg-white/82 text-[#7b4d32]'
                      }`}
                    >
                      {choice.text}
                    </button>
                  )
                })}
              </div>
              <div className="space-y-3">
                {rightChoices.map((choice) => {
                  const used = matchingPairs.some(
                    (pair) => pair.leftId === choice.id,
                  )
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        if (used && !pendingLeftChoiceId) {
                          setMatchingPairs((prev) =>
                            removeMatchingPairByCardId(prev, choice.id),
                          )
                          return
                        }

                        if (!pendingLeftChoiceId) {
                          return
                        }

                        setMatchingPairs((prev) =>
                          upsertMatchingPair(prev, {
                            leftId: choice.id,
                            rightId: pendingLeftChoiceId,
                          }),
                        )
                        setPendingLeftChoiceId(null)
                      }}
                      className={`w-full rounded-[1.6rem] px-4 py-4 text-left text-base font-black ${
                        used
                          ? 'bg-[#fff0df] text-[#7b4d32] shadow-[inset_0_0_0_2px_rgba(232,157,133,0.55)]'
                          : !pendingLeftChoiceId
                            ? 'bg-[#f2e4d6] text-[#bc9b7f]'
                            : 'bg-white/82 text-[#7b4d32] transition-transform duration-100 active:scale-95'
                      }`}
                    >
                      {choice.text}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </section>

      <button
        type="button"
        disabled={isSubmitting || showJellyRecoveryDialog}
        onClick={handleSubmit}
        className="game-primary-button"
      >
        제출하기
      </button>

      <section className="pb-2">
        <div className="character-area relative mx-auto flex w-full max-w-[11rem] justify-center pt-7">
          <div className="heart-row pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center">
            <span className="text-2xl font-black tracking-tight text-[#d96973]">
              {failLifeLabel}
            </span>
          </div>
          {activeHamsterAnimation ? (
            <div
              aria-hidden="true"
              key={`${activeHamsterAnimation}-${hamsterAnimationToken}`}
              className={`quiz-hamster-sprite ${
                activeHamsterAnimation === 'fail-life-state2'
                  ? 'quiz-hamster-sprite--fail-life-state2'
                  : 'quiz-hamster-sprite--fail-life-state1'
              } ${
                activeHamsterAnimation === 'fail-life-state1'
                  ? 'h-28 w-[4.25rem]'
                  : 'h-28 w-28'
              } drop-shadow-[0_14px_24px_rgba(189,128,82,0.18)]`}
              style={{
                backgroundImage: `url(${
                  activeHamsterAnimation === 'fail-life-state2'
                    ? maraningAssets.hamsterFailLifeState2Sprite
                    : maraningAssets.hamsterFailLifeState1Sprite
                })`,
              }}
            />
          ) : (
            <img
              src={currentHamsterSrc}
              alt="말랑이 캐릭터"
              className="h-28 w-28 object-contain drop-shadow-[0_14px_24px_rgba(189,128,82,0.18)]"
            />
          )}
        </div>
      </section>

      <ConfirmDialog
        open={showJellyRecoveryDialog}
        message="광고를 보면 젤리5개를 드려요!"
        onConfirm={() => {
          mockRewardJelly(5)
          setShowJellyRecoveryDialog(false)
        }}
        onCancel={() => {
          setShowJellyRecoveryDialog(false)
          shouldClearSessionOnUnmountRef.current = true
          navigate(stageMapPath, { replace: true })
        }}
      />

      {showCorrectOverlay ? (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-[#6b4d36]/26 px-6">
          <div className="rounded-[2rem] bg-white/92 px-8 py-7 text-center shadow-[0_20px_40px_rgba(120,76,41,0.22)]">
            <p className="text-[1.65rem] font-black tracking-tight text-[#7b4d32]">
              정답이야!
            </p>
          </div>
        </div>
      ) : null}
    </PageFrame>
  )
}
