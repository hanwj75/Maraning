import type { DifficultyKey } from '../../data/difficulties'

export const quizTypes = ['image_select', 'matching', 'word_order', 'blank_fill'] as const

export type QuizType = (typeof quizTypes)[number]

export type QuizChoice = {
  id: string
  text: string
  imageUrl?: string
  matchKey?: string
}

export type QuizAnswer =
  | string
  | string[]
  | {
      correctChoiceId?: string
      correctChoiceIds?: string[]
      pairs?: Array<{ leftId: string; rightId: string }>
      orderedTokens?: string[]
      acceptedAnswers?: string[]
    }

export type QuizSubmission =
  | {
      type: 'image_select' | 'blank_fill'
      choiceId: string
      value: string
    }
  | {
      type: 'word_order'
      orderedValues: string[]
    }
  | {
      type: 'matching'
      pairs: Array<{ leftId: string; rightId: string }>
    }

export type Quiz = {
  id: string
  stageId: string
  difficulty: DifficultyKey
  type: QuizType
  question: string
  prompt: string
  choices: QuizChoice[]
  answer: QuizAnswer
  explanation: string
  learningTargetId?: string
  targetKey?: string
}

export type QuizSession = {
  chapterId: string
  stageId: string
  difficulty: DifficultyKey
  quizIds: string[]
  currentQuizIndex: number
  failLife: number
  noFailStreak: number
}

export type QuizSessionAnswer = {
  quizId: string
  submission: QuizSubmission
  isCorrect: boolean
}

export type QuizSessionResult = {
  chapterId: string
  stageId: string
  difficulty: DifficultyKey
  totalCount: number
  correctCount: number
  answers: QuizSessionAnswer[]
}

export type QuizSubmitOutcome = {
  status: 'next' | 'finished' | 'retry' | 'failed'
  awardedCleanSolveBonus: boolean
}
