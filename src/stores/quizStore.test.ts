import { describe, expect, it } from '@jest/globals'
import type { QuizSessionAnswer } from '../features/quiz/quiz.types'
import { INITIAL_FAIL_LIFE, applyQuizSubmission, createQuizSession } from './quizStore'

const correctAnswer: QuizSessionAnswer = {
  quizId: 'quiz.001',
  submission: {
    type: 'image_select',
    choiceId: 'a',
    value: 'apple',
  },
  isCorrect: true,
}

const incorrectAnswer: QuizSessionAnswer = {
  quizId: 'quiz.001',
  submission: {
    type: 'image_select',
    choiceId: 'b',
    value: 'cat',
  },
  isCorrect: false,
}

describe('quizStore helpers', () => {
  it('starts every stage session with failLife 3', () => {
    const session = createQuizSession({
      stageId: 'absolute-beginner.stage.001',
      difficulty: 'absolute_beginner',
      quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
    })

    expect(session.failLife).toBe(INITIAL_FAIL_LIFE)
    expect(session.noFailStreak).toBe(0)
  })

  it('reduces failLife by 1 and keeps the same quiz index on an incorrect answer', () => {
    const nextState = applyQuizSubmission({
      session: createQuizSession({
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
      }),
      result: null,
      answer: incorrectAnswer,
    })

    expect(nextState.status).toBe('retry')
    expect(nextState.awardedCleanSolveBonus).toBe(false)
    expect(nextState.session?.failLife).toBe(2)
    expect(nextState.session?.noFailStreak).toBe(0)
    expect(nextState.session?.currentQuizIndex).toBe(0)
  })

  it('moves to the next quiz only when the answer is correct', () => {
    const nextState = applyQuizSubmission({
      session: createQuizSession({
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
      }),
      result: null,
      answer: correctAnswer,
    })

    expect(nextState.status).toBe('next')
    expect(nextState.awardedCleanSolveBonus).toBe(false)
    expect(nextState.session?.currentQuizIndex).toBe(1)
    expect(nextState.session?.failLife).toBe(3)
    expect(nextState.session?.noFailStreak).toBe(1)
  })

  it('fails the stage when failLife reaches 0', () => {
    const session = {
      ...createQuizSession({
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
      }),
      failLife: 1,
    }

    const nextState = applyQuizSubmission({
      session,
      result: null,
      answer: incorrectAnswer,
    })

    expect(nextState.status).toBe('failed')
    expect(nextState.awardedCleanSolveBonus).toBe(false)
    expect(nextState.session?.failLife).toBe(0)
    expect(nextState.session?.noFailStreak).toBe(0)
    expect(nextState.result).toBeNull()
  })

  it('awards a clean solve bonus trigger on every 5th correct answer without failures', () => {
    const session = {
      ...createQuizSession({
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
      }),
      currentQuizIndex: 4,
      noFailStreak: 4,
    }

    const nextState = applyQuizSubmission({
      session,
      result: {
        stageId: session.stageId,
        difficulty: session.difficulty,
        totalCount: 10,
        correctCount: 4,
        answers: Array.from({ length: 4 }, (_, index) => ({
          quizId: `quiz.${index + 1}`,
          submission: {
            type: 'image_select' as const,
            choiceId: 'a',
            value: 'apple',
          },
          isCorrect: true,
        })),
      },
      answer: correctAnswer,
    })

    expect(nextState.status).toBe('next')
    expect(nextState.awardedCleanSolveBonus).toBe(true)
    expect(nextState.session?.noFailStreak).toBe(0)
  })

  it('keeps the session alive until result navigation after the 10th correct answer', () => {
    const session = {
      ...createQuizSession({
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
      }),
      currentQuizIndex: 9,
    }

    const nextState = applyQuizSubmission({
      session,
      result: {
        stageId: session.stageId,
        difficulty: session.difficulty,
        totalCount: 10,
        correctCount: 9,
        answers: Array.from({ length: 9 }, (_, index) => ({
          quizId: `quiz.${index + 1}`,
          submission: {
            type: 'image_select' as const,
            choiceId: 'a',
            value: 'apple',
          },
          isCorrect: true,
        })),
      },
      answer: correctAnswer,
    })

    expect(nextState.status).toBe('finished')
    expect(nextState.awardedCleanSolveBonus).toBe(false)
    expect(nextState.session?.currentQuizIndex).toBe(9)
    expect(nextState.result?.answers).toHaveLength(10)
  })
})
