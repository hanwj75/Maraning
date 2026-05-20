import type { DifficultyKey } from '../../data/difficulties'

export function buildChapterMapPath(difficulty: DifficultyKey): string {
  return `/chapters/${difficulty}`
}

export function buildStageMapPath(difficulty: DifficultyKey, chapterId: string): string {
  return `/stages/${difficulty}/${chapterId}`
}

export function buildQuizPath(difficulty: DifficultyKey, chapterId: string, stageId: string): string {
  return `/quiz/${difficulty}/${chapterId}/${stageId}`
}
