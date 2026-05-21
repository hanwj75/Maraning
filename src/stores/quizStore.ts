import { create } from 'zustand'
import type { DifficultyKey } from '../data/difficulties'
import type {
  QuizSession,
  QuizSessionAnswer,
  QuizSessionResult,
  QuizSubmitOutcome,
  Quiz,
} from '../features/quiz/quiz.types'
import { createQuizDisplayState } from '../features/quiz/quiz.utils'

export const INITIAL_FAIL_LIFE = 3

export type QuizSubmitStatus = 'next' | 'finished' | 'retry' | 'failed'

export function createQuizSession(params: {
  chapterId: string
  stageId: string
  difficulty: DifficultyKey
  quizIds: string[]
  quizzes: readonly Quiz[]
}): QuizSession {
  const displayState = createQuizDisplayState(params.quizzes)

  return {
    chapterId: params.chapterId,
    stageId: params.stageId,
    difficulty: params.difficulty,
    quizIds: params.quizIds,
    displayChoiceIdsByQuizId: displayState.displayChoiceIdsByQuizId,
    matchingDisplayByQuizId: displayState.matchingDisplayByQuizId,
    currentQuizIndex: 0,
    failLife: INITIAL_FAIL_LIFE,
    noFailStreak: 0,
  }
}

export function applyQuizSubmission(params: {
  session: QuizSession
  result: QuizSessionResult | null
  answer: QuizSessionAnswer
}): {
  session: QuizSession | null
  result: QuizSessionResult | null
  status: QuizSubmitStatus
  awardedCleanSolveBonus: boolean
} {
  const { session, result, answer } = params
  const totalCount = session.quizIds.length
  const nextAnswers = [...(result?.answers ?? [])]
  nextAnswers[session.currentQuizIndex] = answer

  if (!answer.isCorrect) {
    const remainingFailLife = session.failLife - 1

    if (remainingFailLife <= 0) {
      return {
        session: {
          ...session,
          failLife: 0,
          noFailStreak: 0,
        },
        result: null,
        status: 'failed',
        awardedCleanSolveBonus: false,
      }
    }

    return {
      session: {
        ...session,
        failLife: remainingFailLife,
        noFailStreak: 0,
      },
      result,
      status: 'retry',
      awardedCleanSolveBonus: false,
    }
  }

  const nextNoFailStreak = session.noFailStreak + 1
  const awardedCleanSolveBonus = nextNoFailStreak >= 5
  const resetNoFailStreak = awardedCleanSolveBonus ? 0 : nextNoFailStreak

  const nextResult: QuizSessionResult = {
      stageId: session.stageId,
      chapterId: session.chapterId,
      difficulty: session.difficulty,
    totalCount,
    correctCount: nextAnswers.filter((item) => item?.isCorrect).length,
    answers: nextAnswers,
  }

  const isLastQuiz = session.currentQuizIndex >= totalCount - 1

  if (isLastQuiz) {
    return {
      session: {
        ...session,
        noFailStreak: resetNoFailStreak,
      },
      result: nextResult,
      status: 'finished',
      awardedCleanSolveBonus,
    }
  }

  return {
    session: {
      ...session,
      currentQuizIndex: session.currentQuizIndex + 1,
      noFailStreak: resetNoFailStreak,
    },
    result: nextResult,
    status: 'next',
    awardedCleanSolveBonus,
  }
}

type QuizStore = {
  session: QuizSession | null
  result: QuizSessionResult | null
  startSession: (params: {
    chapterId: string
    stageId: string
    difficulty: DifficultyKey
    quizIds: string[]
    quizzes: readonly Quiz[]
  }) => void
  submitQuizAnswer: (answer: QuizSessionAnswer) => QuizSubmitOutcome
  clearSession: () => void
  clearResult: () => void
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  session: null,
  result: null,
  startSession: ({ chapterId, stageId, difficulty, quizIds, quizzes }) =>
    set({
      session: createQuizSession({
        chapterId,
        stageId,
        difficulty,
        quizIds,
        quizzes,
      }),
      result: null,
    }),
  submitQuizAnswer: (answer) => {
    const session = get().session

    if (!session) {
      return {
        status: 'failed',
        awardedCleanSolveBonus: false,
      }
    }

    const nextState = applyQuizSubmission({
      session,
      result: get().result,
      answer,
    })

    set({
      session: nextState.session,
      result: nextState.result,
    })

    return {
      status: nextState.status,
      awardedCleanSolveBonus: nextState.awardedCleanSolveBonus,
    }
  },
  clearSession: () => set((state) => ({ ...state, session: null })),
  clearResult: () => set((state) => ({ ...state, result: null })),
}))
