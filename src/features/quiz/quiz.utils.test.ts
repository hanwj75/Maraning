import { describe, expect, it } from '@jest/globals'
import {
  buildQuizSessionAnswer,
  getOrderedQuizzesByIds,
  getQuizProgressLabel,
  isQuizSubmissionCorrect,
  validateMatchingQuizPairs,
  validateQuizChoiceCount,
  validateQuizEnglishLearningExposure,
  validateQuizQuestion,
} from './quiz.utils'
import type { Quiz } from './quiz.types'

const imageSelectQuiz: Quiz = {
  id: 'quiz.image',
  stageId: 'stage.1',
  difficulty: 'absolute_beginner',
  type: 'image_select',
  question: '사과에 맞는 영어 단어를 골라주세요.',
  prompt: '사과를 고르세요.',
  choices: [
    { id: 'a', text: '사과' },
    { id: 'b', text: '고양이' },
  ],
  answer: { correctChoiceId: 'a' },
  explanation: '사과가 정답입니다.',
}

const blankFillQuiz: Quiz = {
  id: 'quiz.blank',
  stageId: 'stage.1',
  difficulty: 'absolute_beginner',
  type: 'blank_fill',
  question: '빈칸에 알맞은 영어 단어를 넣어 주세요.',
  prompt: 'This is an ___.',
  choices: [
    { id: 'a', text: 'apple' },
    { id: 'b', text: 'dog' },
  ],
  answer: { acceptedAnswers: ['apple'] },
  explanation: 'apple이 정답입니다.',
}

const wordOrderQuiz: Quiz = {
  id: 'quiz.order',
  stageId: 'stage.1',
  difficulty: 'absolute_beginner',
  type: 'word_order',
  question: '단어를 올바른 순서로 배열해 주세요.',
  prompt: '문장을 배열하세요.',
  choices: [
    { id: 't1', text: 'This' },
    { id: 't2', text: 'is' },
    { id: 't3', text: 'an' },
    { id: 't4', text: 'apple' },
  ],
  answer: { orderedTokens: ['This', 'is', 'an', 'apple'] },
  explanation: 'This is an apple이 정답입니다.',
}

const matchingQuiz: Quiz = {
  id: 'quiz.match',
  stageId: 'stage.1',
  difficulty: 'absolute_beginner',
  type: 'matching',
  question: '영어 단어와 한국어 뜻을 연결해 주세요.',
  prompt: '연결하세요.',
  choices: [
    { id: 'l1', text: 'apple' },
    { id: 'r1', text: '사과' },
    { id: 'l2', text: 'cat' },
    { id: 'r2', text: '고양이' },
    { id: 'l3', text: 'dog' },
    { id: 'r3', text: '강아지' },
  ],
  answer: {
    pairs: [
      { leftId: 'l1', rightId: 'r1' },
      { leftId: 'l2', rightId: 'r2' },
      { leftId: 'l3', rightId: 'r3' },
    ],
  },
  explanation: 'apple ↔ 사과가 정답입니다.',
}

describe('quiz.utils', () => {
  it('formats quiz progress label', () => {
    expect(getQuizProgressLabel(0, 10)).toBe('1 / 10')
  })

  it('returns quizzes in the exact stage quizIds order', () => {
    expect(
      getOrderedQuizzesByIds([blankFillQuiz, imageSelectQuiz, wordOrderQuiz], [
        'quiz.order',
        'quiz.image',
      ]).map((quiz) => quiz.id),
    ).toEqual(['quiz.order', 'quiz.image'])
  })

  it('validates image_select deterministically', () => {
    expect(
      isQuizSubmissionCorrect(imageSelectQuiz, {
        type: 'image_select',
        choiceId: 'a',
        value: '사과',
      }),
    ).toBe(true)
  })

  it('validates choice-based quizzes to have between 4 and 6 choices', () => {
    expect(validateQuizChoiceCount(imageSelectQuiz)).toHaveLength(1)
  })

  it('requires every quiz to include a non-empty question', () => {
    expect(validateQuizQuestion({ ...imageSelectQuiz, question: '   ' })).toHaveLength(1)
  })

  it('rejects Korean-only prompt and choice combinations', () => {
    expect(
      validateQuizEnglishLearningExposure({
        ...imageSelectQuiz,
        prompt: '사과를 고르세요.',
        choices: [
          { id: 'a', text: '사과' },
          { id: 'b', text: '고양이' },
          { id: 'c', text: '강아지' },
          { id: 'd', text: '책' },
        ],
      }),
    ).toHaveLength(1)
  })

  it('validates blank_fill with case-insensitive trimmed comparison', () => {
    expect(
      isQuizSubmissionCorrect(blankFillQuiz, {
        type: 'blank_fill',
        choiceId: 'a',
        value: ' Apple ',
      }),
    ).toBe(true)
  })

  it('validates word_order token sequence', () => {
    expect(
      isQuizSubmissionCorrect(wordOrderQuiz, {
        type: 'word_order',
        orderedValues: ['This', 'is', 'an', 'apple'],
      }),
    ).toBe(true)
  })

  it('validates matching pairs', () => {
    expect(
      isQuizSubmissionCorrect(matchingQuiz, {
        type: 'matching',
        pairs: [
          { leftId: 'l1', rightId: 'r1' },
          { leftId: 'l2', rightId: 'r2' },
          { leftId: 'l3', rightId: 'r3' },
        ],
      }),
    ).toBe(true)
  })

  it('requires matching quizzes to include at least 3 pairs', () => {
    expect(
      validateMatchingQuizPairs({
        ...matchingQuiz,
        answer: {
          pairs: [{ leftId: 'l1', rightId: 'r1' }],
        },
      }),
    ).toHaveLength(1)
  })

  it('builds session answer with correctness', () => {
    expect(
      buildQuizSessionAnswer(imageSelectQuiz, {
        type: 'image_select',
        choiceId: 'b',
        value: '고양이',
      }),
    ).toEqual({
      quizId: 'quiz.image',
      submission: {
        type: 'image_select',
        choiceId: 'b',
        value: '고양이',
      },
      isCorrect: false,
    })
  })
})
