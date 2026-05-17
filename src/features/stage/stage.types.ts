import type { DifficultyKey } from '../../data/difficulties'

export type LearningTarget = {
  id: string
  ko: string
  en: string
  sentenceKo: string
  sentenceEn: string
}

export type Stage = {
  id: string
  difficulty: DifficultyKey
  order: number
  title: string
  description: string
  learningTarget: LearningTarget
  quizIds: string[]
  requiredStageId: string | null
}

export type StageState = 'locked' | 'unlocked' | 'completed'
