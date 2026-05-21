import { describe, expect, it } from '@jest/globals'
import {
  buildQuizSessionAnswer,
  createQuizDisplayState,
  getDisplayChoicesForQuiz,
  getMatchingDisplayChoicesForQuiz,
  getOrderedQuizzesByIds,
  getQuizProgressLabel,
  isQuizSubmissionCorrect,
  validateMatchingQuizPairs,
  validateBlankFillQuestion,
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
  question: '"사과"에 해당하는 영어 단어를 빈칸에 넣어주세요.',
  prompt: 'This is an ___.',
  choices: [
    { id: 'a', text: 'apple' },
    { id: 'b', text: 'dog' },
  ],
  answer: { acceptedAnswers: ['apple'] },
  explanation: 'apple이 정답입니다.',
  targetKo: '사과',
  targetEn: 'apple',
}

const sentenceChoiceQuiz: Quiz = {
  id: 'quiz.sentence',
  stageId: 'stage.1',
  difficulty: 'absolute_beginner',
  type: 'sentence_choice',
  question: '"나는 사과를 좋아합니다"에 맞는 영어 문장을 골라주세요.',
  prompt: '알맞은 영어 문장을 고르세요.',
  choices: [
    { id: 's1', text: 'I like apples.' },
    { id: 's2', text: 'This is a cat.' },
    { id: 's3', text: 'I am a student.' },
    { id: 's4', text: 'She has a book.' },
  ],
  answer: { correctChoiceId: 's1' },
  explanation: 'I like apples.가 정답입니다.',
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

  it('builds shuffled display choices without mutating quiz data order', () => {
    const originalOrder = imageSelectQuiz.choices.map((choice) => choice.id)
    const originalRandom = Math.random
    let callCount = 0
    Math.random = () => {
      callCount += 1
      return callCount === 1 ? 0.1 : 0
    }

    try {
      const displayState = createQuizDisplayState([imageSelectQuiz])
      const displayChoices = getDisplayChoicesForQuiz(
        imageSelectQuiz,
        displayState.displayChoiceIdsByQuizId,
      )

      expect(imageSelectQuiz.choices.map((choice) => choice.id)).toEqual(originalOrder)
      expect(displayChoices.map((choice) => choice.id)).not.toEqual(originalOrder)
      expect(displayChoices.map((choice) => choice.id).sort()).toEqual([...originalOrder].sort())
    } finally {
      Math.random = originalRandom
    }
  })

  it('shuffles sentence choices through the same display choice policy', () => {
    const originalOrder = sentenceChoiceQuiz.choices.map((choice) => choice.id)
    const originalRandom = Math.random
    let callCount = 0
    Math.random = () => {
      callCount += 1
      return callCount === 1 ? 0.1 : 0
    }

    try {
      const displayState = createQuizDisplayState([sentenceChoiceQuiz])
      const displayChoices = getDisplayChoicesForQuiz(
        sentenceChoiceQuiz,
        displayState.displayChoiceIdsByQuizId,
      )

      expect(displayChoices.map((choice) => choice.id)).not.toEqual(originalOrder)
      expect(sentenceChoiceQuiz.choices.map((choice) => choice.id)).toEqual(originalOrder)
    } finally {
      Math.random = originalRandom
    }
  })

  it('keeps answer validation value-based even when display order changes', () => {
    expect(
      isQuizSubmissionCorrect(imageSelectQuiz, {
        type: 'image_select',
        choiceId: 'b',
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

  it('rejects generic blank_fill questions without target meaning', () => {
    expect(
      validateBlankFillQuestion({
        ...blankFillQuiz,
        question: '빈칸에 알맞은 영어 단어를 입력해 주세요.',
      }),
    ).toHaveLength(1)
  })

  it('requires blank_fill questions to include targetKo when it exists', () => {
    expect(
      validateBlankFillQuestion({
        ...blankFillQuiz,
        question: '문장이 자연스럽도록 빈칸을 채워주세요.',
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

  it('shuffles word_order display tokens without changing answer token order', () => {
    const originalOrder = wordOrderQuiz.choices.map((choice) => choice.id)
    const originalAnswer = [...(wordOrderQuiz.answer as { orderedTokens: string[] }).orderedTokens]
    const originalRandom = Math.random
    let callCount = 0
    Math.random = () => {
      callCount += 1
      return callCount === 1 ? 0.1 : 0
    }

    try {
      const displayState = createQuizDisplayState([wordOrderQuiz])
      const displayChoices = getDisplayChoicesForQuiz(
        wordOrderQuiz,
        displayState.displayChoiceIdsByQuizId,
      )

      expect(displayChoices.map((choice) => choice.id)).not.toEqual(originalOrder)
      expect(wordOrderQuiz.choices.map((choice) => choice.id)).toEqual(originalOrder)
      expect((wordOrderQuiz.answer as { orderedTokens: string[] }).orderedTokens).toEqual(originalAnswer)
    } finally {
      Math.random = originalRandom
    }
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

  it('creates separate shuffled left and right display cards for matching quizzes', () => {
    const originalRandom = Math.random
    let callCount = 0
    Math.random = () => {
      callCount += 1
      return callCount <= 2 ? 0.1 : 0
    }

    try {
      const displayState = createQuizDisplayState([matchingQuiz])
      const matchingDisplay = getMatchingDisplayChoicesForQuiz(
        matchingQuiz,
        displayState.matchingDisplayByQuizId,
      )

      expect(matchingDisplay.leftChoiceIds).not.toEqual(['r1', 'r2', 'r3'])
      expect(matchingDisplay.rightChoiceIds).not.toEqual(['l1', 'l2', 'l3'])
      expect([...matchingDisplay.leftChoiceIds].sort()).toEqual(['r1', 'r2', 'r3'])
      expect([...matchingDisplay.rightChoiceIds].sort()).toEqual(['l1', 'l2', 'l3'])
    } finally {
      Math.random = originalRandom
    }
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
