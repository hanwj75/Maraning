export const difficultyKeys = [
  'absolute_beginner',
  'beginner',
  'intermediate',
  'advanced',
  'conversation',
  'toeic',
] as const

export type DifficultyKey = (typeof difficultyKeys)[number]

export function isDifficultyKey(value: string): value is DifficultyKey {
  return difficultyKeys.includes(value as DifficultyKey)
}

export const difficultyLabels: Record<DifficultyKey, string> = {
  absolute_beginner: '왕초보',
  beginner: '초보',
  intermediate: '중수',
  advanced: '고수',
  conversation: '회화',
  toeic: '토익',
}

export const difficultyStageDataFiles: Record<DifficultyKey, string> = {
  absolute_beginner: 'src/data/stages/absolute-beginner.stages.json',
  beginner: 'src/data/stages/beginner.stages.json',
  intermediate: 'src/data/stages/intermediate.stages.json',
  advanced: 'src/data/stages/advanced.stages.json',
  conversation: 'src/data/stages/conversation.stages.json',
  toeic: 'src/data/stages/toeic.stages.json',
}

export const difficultyChapterDataFiles: Record<DifficultyKey, string> = {
  absolute_beginner: 'src/data/chapters/absolute-beginner.chapters.json',
  beginner: 'src/data/chapters/beginner.chapters.json',
  intermediate: 'src/data/chapters/intermediate.chapters.json',
  advanced: 'src/data/chapters/advanced.chapters.json',
  conversation: 'src/data/chapters/conversation.chapters.json',
  toeic: 'src/data/chapters/toeic.chapters.json',
}

export const difficultyQuizDataFiles: Record<DifficultyKey, string> = {
  absolute_beginner: 'src/data/quizzes/absolute-beginner.quizzes.json',
  beginner: 'src/data/quizzes/beginner.quizzes.json',
  intermediate: 'src/data/quizzes/intermediate.quizzes.json',
  advanced: 'src/data/quizzes/advanced.quizzes.json',
  conversation: 'src/data/quizzes/conversation.quizzes.json',
  toeic: 'src/data/quizzes/toeic.quizzes.json',
}
