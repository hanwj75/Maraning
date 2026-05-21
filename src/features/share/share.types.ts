import type { DifficultyKey } from '../../data/difficulties'

export type SharePlatform = 'kakao' | 'instagram' | 'twitter'

export type StageSharePayload = {
  nickname: string
  difficulty: DifficultyKey
  difficultyLabel: string
  title: string
  introText: string
  stageLabel: string
  learningTargetLabel: string | null
  text: string
  url: string
}
