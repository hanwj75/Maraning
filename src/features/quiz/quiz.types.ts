import type { DifficultyKey } from '../../data/difficulties'

export const quizTypes = [
  'image_select',
  'matching',
  'word_order',
  'blank_fill',
  'sentence_choice',
  'vocabulary_choice',
  'grammar_choice',
] as const

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
      type:
        | 'image_select'
        | 'blank_fill'
        | 'sentence_choice'
        | 'vocabulary_choice'
        | 'grammar_choice'
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
  targetKo?: string
  targetEn?: string
}

export type MatchingDisplayOrder = {
  leftChoiceIds: string[]
  rightChoiceIds: string[]
}

export type QuizSession = {
  sessionId: string
  chapterId: string
  stageId: string
  difficulty: DifficultyKey
  quizIds: string[]
  displayChoiceIdsByQuizId: Record<string, string[]>
  matchingDisplayByQuizId: Record<string, MatchingDisplayOrder>
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
