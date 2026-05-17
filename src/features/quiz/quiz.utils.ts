import type { Quiz, QuizSessionAnswer, QuizSubmission } from './quiz.types'

export type QuizValidationError = {
  quizId: string
  reason: string
}

export function indexQuizzesById(quizzes: readonly Quiz[]): Record<string, Quiz> {
  return Object.fromEntries(quizzes.map((quiz) => [quiz.id, quiz]))
}

export function getQuizzesForStage(quizzes: readonly Quiz[], stageId: string): Quiz[] {
  return quizzes.filter((quiz) => quiz.stageId === stageId)
}

export function getOrderedQuizzesByIds(
  quizzes: readonly Quiz[],
  quizIds: readonly string[],
): Quiz[] {
  const quizzesById = indexQuizzesById(quizzes)

  return quizIds
    .map((quizId) => quizzesById[quizId])
    .filter((quiz): quiz is Quiz => Boolean(quiz))
}

export function areQuizIdsUnique(quizzes: readonly Quiz[]): boolean {
  const ids = quizzes.map((quiz) => quiz.id)
  return new Set(ids).size === ids.length
}

export function getQuizProgressLabel(currentQuizIndex: number, totalQuizCount: number): string {
  return `${currentQuizIndex + 1} / ${totalQuizCount}`
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function hasEnglishText(value: string): boolean {
  return /[A-Za-z]/.test(value)
}

function hasKoreanText(value: string): boolean {
  return /[가-힣]/.test(value)
}

export function validateQuizChoiceCount(quiz: Quiz): QuizValidationError[] {
  if (quiz.type !== 'image_select' && quiz.type !== 'blank_fill') {
    return []
  }

  if (quiz.choices.length >= 4 && quiz.choices.length <= 6) {
    return []
  }

  return [
    {
      quizId: quiz.id,
      reason: 'Choice-based quizzes must include between 4 and 6 choices.',
    },
  ]
}

export function validateQuizQuestion(quiz: Quiz): QuizValidationError[] {
  if (String(quiz.question ?? '').trim().length > 0) {
    return []
  }

  return [
    {
      quizId: quiz.id,
      reason: 'Quiz question cannot be empty.',
    },
  ]
}

export function validateQuizEnglishLearningExposure(quiz: Quiz): QuizValidationError[] {
  if (quiz.type !== 'image_select' && quiz.type !== 'blank_fill') {
    return []
  }

  const promptHasEnglish = hasEnglishText(quiz.prompt)
  const choiceHasEnglish = quiz.choices.some((choice) => hasEnglishText(choice.text))

  if (!promptHasEnglish && !choiceHasEnglish) {
    return [
      {
        quizId: quiz.id,
        reason: 'Quiz prompt and choices cannot both be Korean-only.',
      },
    ]
  }

  if (
    quiz.type === 'blank_fill' &&
    (!promptHasEnglish || quiz.choices.some((choice) => !hasEnglishText(choice.text)))
  ) {
    return [
      {
        quizId: quiz.id,
        reason: 'blank_fill must use an English prompt and English choices.',
      },
    ]
  }

  return []
}

export function validateMatchingQuizPairs(quiz: Quiz): QuizValidationError[] {
  if (quiz.type !== 'matching') {
    return []
  }

  if (
    typeof quiz.answer !== 'object' ||
    quiz.answer === null ||
    !('pairs' in quiz.answer) ||
    !Array.isArray(quiz.answer.pairs)
  ) {
    return [
      {
        quizId: quiz.id,
        reason: 'Matching quiz must define answer pairs.',
      },
    ]
  }

  if (quiz.answer.pairs.length < 3) {
    return [
      {
        quizId: quiz.id,
        reason: 'Matching quiz must include at least 3 pairs.',
      },
    ]
  }

  const choicesById = Object.fromEntries(quiz.choices.map((choice) => [choice.id, choice]))

  return quiz.answer.pairs.flatMap((pair) => {
    const leftChoice = choicesById[pair.leftId]
    const rightChoice = choicesById[pair.rightId]

    if (!leftChoice || !rightChoice) {
      return [
        {
          quizId: quiz.id,
          reason: 'Matching pair must reference existing left and right choices.',
        },
      ]
    }

    if (!hasEnglishText(leftChoice.text) || !hasKoreanText(rightChoice.text)) {
      return [
        {
          quizId: quiz.id,
          reason: 'Matching pairs must connect English text on the left to Korean text on the right.',
        },
      ]
    }

    return []
  })
}

export function validateQuizData(quizzes: readonly Quiz[]): QuizValidationError[] {
  return quizzes.flatMap((quiz) => [
    ...validateQuizQuestion(quiz),
    ...validateQuizChoiceCount(quiz),
    ...validateQuizEnglishLearningExposure(quiz),
    ...validateMatchingQuizPairs(quiz),
  ])
}

export function isQuizSubmissionCorrect(quiz: Quiz, submission: QuizSubmission): boolean {
  if (quiz.type !== submission.type) {
    return false
  }

  if (quiz.type === 'image_select') {
    const choiceSubmission = submission as Extract<QuizSubmission, { type: 'image_select' | 'blank_fill' }>

    return (
      typeof quiz.answer === 'object' &&
      quiz.answer !== null &&
      'correctChoiceId' in quiz.answer &&
      quiz.answer.correctChoiceId === choiceSubmission.choiceId
    )
  }

  if (quiz.type === 'blank_fill') {
    const choiceSubmission = submission as Extract<QuizSubmission, { type: 'image_select' | 'blank_fill' }>

    return (
      typeof quiz.answer === 'object' &&
      quiz.answer !== null &&
      'acceptedAnswers' in quiz.answer &&
      Array.isArray(quiz.answer.acceptedAnswers) &&
      quiz.answer.acceptedAnswers.some((answer) => normalizeText(answer) === normalizeText(choiceSubmission.value))
    )
  }

  if (quiz.type === 'word_order') {
    const wordOrderSubmission = submission as Extract<QuizSubmission, { type: 'word_order' }>

    return (
      typeof quiz.answer === 'object' &&
      quiz.answer !== null &&
      'orderedTokens' in quiz.answer &&
      Array.isArray(quiz.answer.orderedTokens) &&
      quiz.answer.orderedTokens.length === wordOrderSubmission.orderedValues.length &&
      quiz.answer.orderedTokens.every(
        (token, index) => normalizeText(token) === normalizeText(wordOrderSubmission.orderedValues[index] ?? ''),
      )
    )
  }

  if (quiz.type === 'matching') {
    const matchingSubmission = submission as Extract<QuizSubmission, { type: 'matching' }>

    return (
      typeof quiz.answer === 'object' &&
      quiz.answer !== null &&
      'pairs' in quiz.answer &&
      Array.isArray(quiz.answer.pairs) &&
      quiz.answer.pairs.length === matchingSubmission.pairs.length &&
      quiz.answer.pairs.every((pair) =>
        matchingSubmission.pairs.some(
          (submittedPair: { leftId: string; rightId: string }) =>
            submittedPair.leftId === pair.leftId && submittedPair.rightId === pair.rightId,
        ),
      )
    )
  }

  return false
}

export function buildQuizSessionAnswer(quiz: Quiz, submission: QuizSubmission): QuizSessionAnswer {
  return {
    quizId: quiz.id,
    submission,
    isCorrect: isQuizSubmissionCorrect(quiz, submission),
  }
}
