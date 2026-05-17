import absoluteBeginnerStages from '../../data/stages/absolute-beginner.stages.json'
import advancedStages from '../../data/stages/advanced.stages.json'
import beginnerStages from '../../data/stages/beginner.stages.json'
import conversationStages from '../../data/stages/conversation.stages.json'
import intermediateStages from '../../data/stages/intermediate.stages.json'
import toeicStages from '../../data/stages/toeic.stages.json'
import type { DifficultyKey } from '../../data/difficulties'
import type { Quiz } from '../quiz/quiz.types'
import type { Stage, StageState } from './stage.types'

export const STAGE_QUIZ_COUNT = 10

export type StageValidationError = {
  stageId: string
  reason: string
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

export function validateStageData(
  stages: readonly Stage[],
  quizzes: readonly Quiz[],
): StageValidationError[] {
  const quizzesById = Object.fromEntries(quizzes.map((quiz) => [quiz.id, quiz]))

  return stages.flatMap((stage) => [
    ...validateStageQuizCount(stage),
    ...validateStageQuizReferences(stage, quizzesById),
  ])
}

const stagesByDifficulty: Record<DifficultyKey, readonly Stage[]> = {
  absolute_beginner: absoluteBeginnerStages as Stage[],
  beginner: beginnerStages as Stage[],
  intermediate: intermediateStages as Stage[],
  advanced: advancedStages as Stage[],
  conversation: conversationStages as Stage[],
  toeic: toeicStages as Stage[],
}

export function getStagesByDifficulty(difficulty: DifficultyKey): readonly Stage[] {
  return stagesByDifficulty[difficulty]
}

export function getStageById(difficulty: DifficultyKey, stageId: string): Stage | undefined {
  return getStagesByDifficulty(difficulty).find((stage) => stage.id === stageId)
}

export function getStageState(params: {
  stage: Stage
  clearedStageIds: readonly string[]
  unlockedStageIds: readonly string[]
}): StageState {
  const { stage, clearedStageIds, unlockedStageIds } = params

  if (clearedStageIds.includes(stage.id)) {
    return 'completed'
  }

  if (unlockedStageIds.includes(stage.id)) {
    return 'unlocked'
  }

  return 'locked'
}
