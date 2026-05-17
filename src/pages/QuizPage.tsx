import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../shared/components/ConfirmDialog'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { JellyBadge } from '../shared/components/JellyBadge'
import { PageFrame } from '../shared/components/PageFrame'
import { getQuizzesByDifficulty } from '../features/quiz/quiz.data'
import { buildQuizSessionAnswer, getOrderedQuizzesByIds, getQuizProgressLabel } from '../features/quiz/quiz.utils'
import { getStageById, getStagesByDifficulty } from '../features/stage/stage.utils'
import { maraningAssets } from '../shared/maraning-assets'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useQuizStore } from '../stores/quizStore'

export function QuizPage() {
  const navigate = useNavigate()
  const session = useQuizStore((state) => state.session)
  const submitQuizAnswer = useQuizStore((state) => state.submitQuizAnswer)
  const clearSession = useQuizStore((state) => state.clearSession)
  const completeStage = useProgressStore((state) => state.completeStage)
  const currentJelly = useJellyStore((state) => state.current)
  const syncDailyJelly = useJellyStore((state) => state.syncDailyJelly)
  const mockRewardJelly = useJellyStore((state) => state.mockRewardJelly)
  const tryConsumeForSubmission = useJellyStore((state) => state.tryConsumeForSubmission)
  const grantCleanSolveReward = useJellyStore((state) => state.grantCleanSolveReward)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [orderedChoiceIds, setOrderedChoiceIds] = useState<string[]>([])
  const [matchingPairs, setMatchingPairs] = useState<Array<{ leftId: string; rightId: string }>>([])
  const [pendingLeftId, setPendingLeftId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [showJellyRecoveryDialog, setShowJellyRecoveryDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)
  const shouldClearSessionOnUnmountRef = useRef(false)
  const sessionDifficulty = session?.difficulty ?? 'absolute_beginner'
  const sessionStageId = session?.stageId ?? ''
  const failLifeLabel = Array.from({ length: 3 }, (_, index) =>
    index < (session?.failLife ?? 0) ? '❤️' : '♡',
  ).join('')
  const quizzes = useMemo(
    () =>
      session
        ? getOrderedQuizzesByIds(
            getQuizzesByDifficulty(sessionDifficulty).filter((quiz) => quiz.stageId === sessionStageId),
            session.quizIds,
          )
        : [],
    [session, sessionDifficulty, sessionStageId],
  )
  const stages = useMemo(() => getStagesByDifficulty(sessionDifficulty), [sessionDifficulty])
  const stage = useMemo(
    () => (session ? getStageById(sessionDifficulty, sessionStageId) : undefined),
    [session, sessionDifficulty, sessionStageId],
  )
  const currentQuiz = session ? quizzes[session.currentQuizIndex] : undefined
  const progressLabel = session ? getQuizProgressLabel(session.currentQuizIndex, quizzes.length) : '0 / 10'
  const leftChoices = useMemo(
    () => currentQuiz?.choices.filter((choice) => choice.id.startsWith('l')) ?? [],
    [currentQuiz],
  )
  const rightChoices = useMemo(
    () => currentQuiz?.choices.filter((choice) => choice.id.startsWith('r')) ?? [],
    [currentQuiz],
  )

  const resetLocalState = () => {
    setSelectedChoiceId(null)
    setOrderedChoiceIds([])
    setMatchingPairs([])
    setPendingLeftId(null)
  }

  useEffect(() => {
    syncDailyJelly()
  }, [syncDailyJelly])

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }

      if (shouldClearSessionOnUnmountRef.current) {
        clearSession()
      }
    }
  }, [clearSession])

  if (!session) {
    return <Navigate to="/stages" replace />
  }

  if (!stage || !currentQuiz || quizzes.length !== 10) {
    return <Navigate to="/stages" replace />
  }

  const finalizeSubmission = (params: {
    isCorrect: boolean
    status: 'next' | 'finished' | 'retry' | 'failed'
    remainingFailLife: number
    cleanSolveRewardAmount?: number
    reason?: 'failed-life' | 'jelly-empty'
  }) => {
    const { isCorrect, status, remainingFailLife, cleanSolveRewardAmount, reason } = params
    let message = `오답이에요. 하트가 1개 줄었어요. (${remainingFailLife}/3)`

    if (reason === 'jelly-empty') {
      message = '젤리가 부족해요. 스테이지 맵으로 돌아가요.'
    } else if (status === 'failed') {
      message = '스테이지 실패! 스테이지 맵으로 돌아가요.'
    } else if (cleanSolveRewardAmount && isCorrect) {
      message = `완벽해요! 젤리 ${cleanSolveRewardAmount}개를 받았어요!`
    } else if (isCorrect) {
      message = '정답이에요!'
    }

    setFeedbackMessage(message)
    setIsSubmitting(true)

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedbackMessage(null)
      setIsSubmitting(false)
      resetLocalState()

      if (status === 'finished') {
        shouldClearSessionOnUnmountRef.current = true
        navigate('/result', { replace: true })
        return
      }

      if (status === 'failed') {
        shouldClearSessionOnUnmountRef.current = true
        navigate('/stages', { replace: true })
      }
    }, 850)
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

    if (currentQuiz.type === 'image_select' || currentQuiz.type === 'blank_fill') {
      const selectedChoice = currentQuiz.choices.find((choice) => choice.id === selectedChoiceId)

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
      const remainingFailLife = answer.isCorrect ? session.failLife : Math.max(session.failLife - 1, 0)
      const cleanSolveRewardAmount =
        answer.isCorrect && outcome.awardedCleanSolveBonus
          ? grantCleanSolveReward().rewarded
          : undefined

      if (outcome.status === 'finished') {
        completeStage(session.difficulty, session.stageId, stages)
      }

      finalizeSubmission({
        isCorrect: answer.isCorrect,
        status: outcome.status,
        remainingFailLife,
        cleanSolveRewardAmount,
        reason: outcome.status === 'failed' ? 'failed-life' : undefined,
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

      const orderedValues = orderedChoiceIds
        .map((choiceId) => currentQuiz.choices.find((choice) => choice.id === choiceId)?.text ?? '')

      const answer = buildQuizSessionAnswer(currentQuiz, {
        type: 'word_order',
        orderedValues,
      })
      const outcome = submitQuizAnswer(answer)
      const remainingFailLife = answer.isCorrect ? session.failLife : Math.max(session.failLife - 1, 0)
      const cleanSolveRewardAmount =
        answer.isCorrect && outcome.awardedCleanSolveBonus
          ? grantCleanSolveReward().rewarded
          : undefined

      if (outcome.status === 'finished') {
        completeStage(session.difficulty, session.stageId, stages)
      }

      finalizeSubmission({
        isCorrect: answer.isCorrect,
        status: outcome.status,
        remainingFailLife,
        cleanSolveRewardAmount,
        reason: outcome.status === 'failed' ? 'failed-life' : undefined,
      })

      return
    }

    if (matchingPairs.length !== leftChoices.length || leftChoices.length !== rightChoices.length) {
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
    const remainingFailLife = answer.isCorrect ? session.failLife : Math.max(session.failLife - 1, 0)
    const cleanSolveRewardAmount =
      answer.isCorrect && outcome.awardedCleanSolveBonus
        ? grantCleanSolveReward().rewarded
        : undefined

    if (outcome.status === 'finished') {
      completeStage(session.difficulty, session.stageId, stages)
    }

    finalizeSubmission({
      isCorrect: answer.isCorrect,
      status: outcome.status,
      remainingFailLife,
      cleanSolveRewardAmount,
      reason: outcome.status === 'failed' ? 'failed-life' : undefined,
    })
  }

  return (
    <PageFrame contentClassName="gap-5">
      <section className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CuteTopBar title={stage.title} backTo="/stages" variant="plain" />
        </div>
        <JellyBadge count={currentJelly} className="max-w-[8.5rem] shrink-0" />
      </section>

      <section className="game-card bg-gradient-to-br from-[#fff2db] to-[#fff9ef] px-5 py-5">
        <p className="text-sm font-black text-[#ed9b8f]">진행 상태 {progressLabel}</p>
        <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-[#7b4d32]">
          {currentQuiz.question}
        </h1>
        {currentQuiz.prompt !== currentQuiz.question ? (
          <p className="mt-3 rounded-[1.5rem] bg-white/72 px-4 py-3 text-base font-black leading-7 text-[#8b5d3c]">
            {currentQuiz.prompt}
          </p>
        ) : null}
        {feedbackMessage ? (
          <p className="mt-3 rounded-full bg-white/72 px-4 py-2 text-sm font-black text-[#7b4d32]">
            {feedbackMessage}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        {(currentQuiz.type === 'image_select' || currentQuiz.type === 'blank_fill') && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {currentQuiz.choices.map((choice) => {
              const selected = selectedChoiceId === choice.id

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedChoiceId(choice.id)}
                  className={`rounded-[1.9rem] px-5 py-6 text-left text-lg font-black shadow-[0_14px_26px_rgba(194,141,93,0.16)] transition-transform duration-100 active:scale-95 ${
                    selected ? 'bg-[#ffd7e1] text-[#7b4d32]' : 'bg-white/82 text-[#7b4d32]'
                  }`}
                >
                  <span className="block text-sm font-black text-[#ef9a8f]">선택지</span>
                  <span className="mt-2 block text-base leading-7 font-semibold text-[#9b6c4a]">{choice.text}</span>
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
                  <span className="text-sm font-semibold text-[#9b6c4a]">토큰을 순서대로 눌러주세요.</span>
                ) : (
                  orderedChoiceIds.map((choiceId) => {
                    const choice = currentQuiz.choices.find((item) => item.id === choiceId)
                    return (
                      <button
                        key={choiceId}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          setOrderedChoiceIds((prev) => prev.filter((item) => item !== choiceId))
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
              {currentQuiz.choices.map((choice) => {
                const alreadySelected = orderedChoiceIds.includes(choice.id)
                return (
                  <button
                    key={choice.id}
                    type="button"
                    disabled={alreadySelected || isSubmitting}
                    onClick={() => setOrderedChoiceIds((prev) => [...prev, choice.id])}
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
                  <span className="text-sm font-semibold text-[#9b6c4a]">왼쪽 카드와 오른쪽 카드를 차례대로 눌러 연결하세요.</span>
                ) : (
                  matchingPairs.map((pair) => {
                    const left = currentQuiz.choices.find((choice) => choice.id === pair.leftId)
                    const right = currentQuiz.choices.find((choice) => choice.id === pair.rightId)
                    return (
                      <div key={`${pair.leftId}-${pair.rightId}`} className="rounded-2xl bg-[#fff2db] px-3 py-2 text-sm font-black text-[#7b4d32]">
                        {left?.text} ↔ {right?.text}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                {leftChoices.map((choice) => {
                  const used = matchingPairs.some((pair) => pair.leftId === choice.id)
                  const selected = pendingLeftId === choice.id
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={used || isSubmitting}
                      onClick={() => setPendingLeftId(choice.id)}
                      className={`w-full rounded-[1.6rem] px-4 py-4 text-left text-base font-black ${
                        used
                          ? 'bg-[#f2e4d6] text-[#bc9b7f]'
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
                  const used = matchingPairs.some((pair) => pair.rightId === choice.id)
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={used || !pendingLeftId || isSubmitting}
                      onClick={() => {
                        if (!pendingLeftId) {
                          return
                        }
                        setMatchingPairs((prev) => [...prev, { leftId: pendingLeftId, rightId: choice.id }])
                        setPendingLeftId(null)
                      }}
                      className={`w-full rounded-[1.6rem] px-4 py-4 text-left text-base font-black ${
                        used || !pendingLeftId
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
            <span className="text-2xl font-black tracking-tight text-[#d96973]">{failLifeLabel}</span>
          </div>
          <img
            src={maraningAssets.hamster}
            alt="말랑이 캐릭터"
            className="h-28 w-28 object-contain drop-shadow-[0_14px_24px_rgba(189,128,82,0.18)]"
          />
        </div>
      </section>

      <ConfirmDialog
        open={showJellyRecoveryDialog}
        message="광고를 보면 젤리5개를 드려요!"
        onConfirm={() => {
          const rewardResult = mockRewardJelly(5)
          setFeedbackMessage(`젤리 ${rewardResult.added}개를 받았어요!`)
          setShowJellyRecoveryDialog(false)
        }}
        onCancel={() => {
          setShowJellyRecoveryDialog(false)
          shouldClearSessionOnUnmountRef.current = true
          navigate('/stages', { replace: true })
        }}
      />
    </PageFrame>
  )
}
