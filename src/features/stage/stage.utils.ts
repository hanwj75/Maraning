import absoluteBeginnerChapters from '../../data/chapters/absolute-beginner.chapters.json'
import advancedChapters from '../../data/chapters/advanced.chapters.json'
import beginnerChapters from '../../data/chapters/beginner.chapters.json'
import conversationChapters from '../../data/chapters/conversation.chapters.json'
import intermediateChapters from '../../data/chapters/intermediate.chapters.json'
import toeicChapters from '../../data/chapters/toeic.chapters.json'
import absoluteBeginnerStages from '../../data/stages/absolute-beginner.stages.json'
import advancedStages from '../../data/stages/advanced.stages.json'
import beginnerStages from '../../data/stages/beginner.stages.json'
import conversationStages from '../../data/stages/conversation.stages.json'
import intermediateStages from '../../data/stages/intermediate.stages.json'
import toeicStages from '../../data/stages/toeic.stages.json'
import type { DifficultyKey } from '../../data/difficulties'
import type { Quiz } from '../quiz/quiz.types'
import type { Chapter, ChapterState, Stage, StageState } from './stage.types'

export const CHAPTER_STAGE_COUNT = 10
export const STAGE_QUIZ_COUNT = 10

export type StageValidationError = {
  stageId: string
  reason: string
}

export type ChapterValidationError = {
  chapterId: string
  reason: string
}

function sortByOrder<T extends { order: number }>(items: readonly T[]): readonly T[] {
  return [...items].sort((a, b) => a.order - b.order)
}

export function validateStageQuizCount(stage: Stage): StageValidationError[] {
  if (stage.quizIds.length === STAGE_QUIZ_COUNT) {
    return []
  }

  return [
    {
      stageId: stage.id,
      reason: `Stage must include exactly ${STAGE_QUIZ_COUNT} quiz ids.`,
    },
  ]
}

export function validateStageQuizReferences(
  stage: Stage,
  quizzesById: Readonly<Record<string, Quiz>>,
): StageValidationError[] {
  return stage.quizIds.flatMap((quizId) => {
    const quiz = quizzesById[quizId]

    if (!quiz) {
      return [{ stageId: stage.id, reason: `Stage references missing quiz id: ${quizId}.` }]
    }

    if (quiz.difficulty !== stage.difficulty) {
      return [
        {
          stageId: stage.id,
          reason: `Stage difficulty ${stage.difficulty} does not match quiz ${quiz.id} difficulty ${quiz.difficulty}.`,
        },
      ]
    }

    if (quiz.stageId !== stage.id) {
      return [
        {
          stageId: stage.id,
          reason: `Stage ${stage.id} references quiz ${quiz.id}, but quiz.stageId is ${quiz.stageId}.`,
        },
      ]
    }

    return []
  })
}

export function validateChapterStageReferences(
  chapter: Chapter,
  stagesById: Readonly<Record<string, Stage>>,
): ChapterValidationError[] {
  return chapter.stageIds.flatMap((stageId) => {
    const stage = stagesById[stageId]

    if (!stage) {
      return [{ chapterId: chapter.id, reason: `Chapter references missing stage id: ${stageId}.` }]
    }

    const errors: ChapterValidationError[] = []

    if (stage.chapterId !== chapter.id) {
      errors.push({
        chapterId: chapter.id,
        reason: `Chapter ${chapter.id} references stage ${stage.id}, but stage.chapterId is ${stage.chapterId}.`,
      })
    }

    if (stage.difficulty !== chapter.difficulty) {
      errors.push({
        chapterId: chapter.id,
        reason: `Chapter difficulty ${chapter.difficulty} does not match stage ${stage.id} difficulty ${stage.difficulty}.`,
      })
    }

    return errors
  })
}

export function validateStageChapterReference(
  stage: Stage,
  chaptersById: Readonly<Record<string, Chapter>>,
): StageValidationError[] {
  const chapter = chaptersById[stage.chapterId]

  if (!chapter) {
    return [{ stageId: stage.id, reason: `Stage references missing chapter id: ${stage.chapterId}.` }]
  }

  if (chapter.difficulty !== stage.difficulty) {
    return [
      {
        stageId: stage.id,
        reason: `Stage difficulty ${stage.difficulty} does not match chapter ${chapter.id} difficulty ${chapter.difficulty}.`,
      },
    ]
  }

  return []
}

export function validateChapterData(
  chapters: readonly Chapter[],
  stages: readonly Stage[],
): ChapterValidationError[] {
  const stagesById = Object.fromEntries(stages.map((stage) => [stage.id, stage]))

  return chapters.flatMap((chapter) => validateChapterStageReferences(chapter, stagesById))
}

export function validateStageData(
  stages: readonly Stage[],
  quizzes: readonly Quiz[],
  chapters: readonly Chapter[],
): StageValidationError[] {
  const quizzesById = Object.fromEntries(quizzes.map((quiz) => [quiz.id, quiz]))
  const chaptersById = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter]))

  return stages.flatMap((stage) => [
    ...validateStageQuizCount(stage),
    ...validateStageQuizReferences(stage, quizzesById),
    ...validateStageChapterReference(stage, chaptersById),
  ])
}

const chaptersByDifficulty: Record<DifficultyKey, readonly Chapter[]> = {
  absolute_beginner: sortByOrder(absoluteBeginnerChapters as Chapter[]),
  beginner: sortByOrder(beginnerChapters as Chapter[]),
  intermediate: sortByOrder(intermediateChapters as Chapter[]),
  advanced: sortByOrder(advancedChapters as Chapter[]),
  conversation: sortByOrder(conversationChapters as Chapter[]),
  toeic: sortByOrder(toeicChapters as Chapter[]),
}

const stagesByDifficulty: Record<DifficultyKey, readonly Stage[]> = {
  absolute_beginner: absoluteBeginnerStages as Stage[],
  beginner: beginnerStages as Stage[],
  intermediate: intermediateStages as Stage[],
  advanced: advancedStages as Stage[],
  conversation: conversationStages as Stage[],
  toeic: toeicStages as Stage[],
}

export function getChaptersByDifficulty(difficulty: DifficultyKey): readonly Chapter[] {
  return chaptersByDifficulty[difficulty]
}

export function getChapterById(difficulty: DifficultyKey, chapterId: string): Chapter | undefined {
  return getChaptersByDifficulty(difficulty).find((chapter) => chapter.id === chapterId)
}

export function getStagesByDifficulty(difficulty: DifficultyKey): readonly Stage[] {
  return stagesByDifficulty[difficulty]
}

export function getStagesByChapter(difficulty: DifficultyKey, chapterId: string): readonly Stage[] {
  return getStagesByDifficulty(difficulty).filter((stage) => stage.chapterId === chapterId)
}

export function getStageById(difficulty: DifficultyKey, stageId: string): Stage | undefined {
  return getStagesByDifficulty(difficulty).find((stage) => stage.id === stageId)
}

export function getChapterState(params: {
  chapter: Chapter
  completedChapterIds: readonly string[]
  unlockedChapterIds: readonly string[]
}): ChapterState {
  const { chapter, completedChapterIds, unlockedChapterIds } = params

  if (completedChapterIds.includes(chapter.id)) {
    return 'completed'
  }

  if (unlockedChapterIds.includes(chapter.id)) {
    return 'unlocked'
  }

  return 'locked'
}

export function getStageState(params: {
  stage: Stage
  completedStageIds: readonly string[]
  unlockedStageIds: readonly string[]
}): StageState {
  const { stage, completedStageIds, unlockedStageIds } = params

  if (completedStageIds.includes(stage.id)) {
    return 'completed'
  }

  if (unlockedStageIds.includes(stage.id)) {
    return 'unlocked'
  }

  return 'locked'
}
