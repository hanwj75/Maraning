import { describe, expect, it } from '@jest/globals'
import type { Quiz, QuizSessionAnswer } from '../features/quiz/quiz.types'
import { INITIAL_FAIL_LIFE, applyQuizSubmission, createQuizSession } from './quizStore'

const stageQuizzes: Quiz[] = Array.from({ length: 10 }, (_, index) => ({
  id: `quiz.${index + 1}`,
  stageId: 'absolute-beginner.stage.001',
  difficulty: 'absolute_beginner',
  type: 'image_select',
  question: `question ${index + 1}`,
  prompt: `prompt ${index + 1}`,
  choices: [
    { id: 'a', text: 'apple' },
    { id: 'b', text: 'cat' },
    { id: 'c', text: 'dog' },
    { id: 'd', text: 'book' },
  ],
  answer: { correctChoiceId: 'a' },
  explanation: 'apple이 정답입니다.',
}))

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
      chapterId: 'absolute_beginner_chapter_001',
      stageId: 'absolute-beginner.stage.001',
      difficulty: 'absolute_beginner',
      quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
      quizzes: stageQuizzes,
    })

    expect(session.failLife).toBe(INITIAL_FAIL_LIFE)
    expect(session.noFailStreak).toBe(0)
  })

  it('reduces failLife by 1 and keeps the same quiz index on an incorrect answer', () => {
    const nextState = applyQuizSubmission({
      session: createQuizSession({
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
        quizzes: stageQuizzes,
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
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
        quizzes: stageQuizzes,
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
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
        quizzes: stageQuizzes,
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
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
        quizzes: stageQuizzes,
      }),
      currentQuizIndex: 4,
      noFailStreak: 4,
    }

    const nextState = applyQuizSubmission({
      session,
      result: {
        stageId: session.stageId,
        chapterId: session.chapterId,
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
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
        quizzes: stageQuizzes,
      }),
      currentQuizIndex: 9,
    }

    const nextState = applyQuizSubmission({
      session,
      result: {
        stageId: session.stageId,
        chapterId: session.chapterId,
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

  it('stores display choices once per session and keeps them on retry', () => {
    const originalRandom = Math.random
    let callCount = 0
    Math.random = () => {
      callCount += 1
      return callCount === 1 ? 0.1 : 0
    }

    try {
      const session = createQuizSession({
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: Array.from({ length: 10 }, (_, index) => `quiz.${index + 1}`),
        quizzes: stageQuizzes,
      })

      const firstDisplay = session.displayChoiceIdsByQuizId['quiz.1']
      const nextState = applyQuizSubmission({
        session,
        result: null,
        answer: incorrectAnswer,
      })

      expect(firstDisplay).not.toEqual(['a', 'b', 'c', 'd'])
      expect(nextState.session?.displayChoiceIdsByQuizId['quiz.1']).toEqual(firstDisplay)
      expect(nextState.session?.currentQuizIndex).toBe(0)
    } finally {
      Math.random = originalRandom
    }
  })

  it('stores shuffled display tokens for word_order quizzes in the session', () => {
    const originalRandom = Math.random
    let callCount = 0
    Math.random = () => {
      callCount += 1
      return callCount === 1 ? 0.1 : 0
    }

    try {
      const session = createQuizSession({
        chapterId: 'absolute_beginner_chapter_001',
        stageId: 'absolute-beginner.stage.001',
        difficulty: 'absolute_beginner',
        quizIds: ['quiz.word'],
        quizzes: [
          {
            id: 'quiz.word',
            stageId: 'absolute-beginner.stage.001',
            difficulty: 'absolute_beginner',
            type: 'word_order',
            question: '순서를 맞추세요.',
            prompt: '문장을 배열하세요.',
            choices: [
              { id: 't1', text: 'This' },
              { id: 't2', text: 'is' },
              { id: 't3', text: 'an' },
              { id: 't4', text: 'apple' },
            ],
            answer: { orderedTokens: ['This', 'is', 'an', 'apple'] },
            explanation: 'This is an apple이 정답입니다.',
          },
        ],
      })

      expect(session.displayChoiceIdsByQuizId['quiz.word']).not.toEqual([
        't1',
        't2',
        't3',
        't4',
      ])
    } finally {
      Math.random = originalRandom
    }
  })
})
