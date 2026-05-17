import { create } from 'zustand'
import type { DifficultyKey } from '../data/difficulties'
import type { Stage } from '../features/stage/stage.types'

export type DifficultyProgress = {
  currentStageId: string | null
  clearedStageIds: string[]
  unlockedStageIds: string[]
}

export function createInitialDifficultyProgress(stages: readonly Stage[]): DifficultyProgress {
  const firstStageId = stages[0]?.id ?? null

  return {
    currentStageId: firstStageId,
    clearedStageIds: [],
    unlockedStageIds: firstStageId ? [firstStageId] : [],
  }
}

export function applyStageCompletion(params: {
  progress: DifficultyProgress
  stages: readonly Stage[]
  stageId: string
}): DifficultyProgress {
  const { progress, stages, stageId } = params
  const currentStage = stages.find((stage) => stage.id === stageId)

  if (!currentStage) {
    return progress
  }

  const nextStage = stages.find((stage) => stage.requiredStageId === stageId)
  const clearedStageIds = progress.clearedStageIds.includes(stageId)
    ? progress.clearedStageIds
    : [...progress.clearedStageIds, stageId]
  const unlockedStageIds = [stageId, ...(nextStage ? [nextStage.id] : []), ...progress.unlockedStageIds]
    .filter((value, index, array) => array.indexOf(value) === index)

  return {
    currentStageId: nextStage?.id ?? currentStage.id,
    clearedStageIds,
    unlockedStageIds,
  }
}

type ProgressStore = {
  progressByDifficulty: Partial<Record<DifficultyKey, DifficultyProgress>>
  ensureDifficultyProgress: (difficulty: DifficultyKey, stages: readonly Stage[]) => void
  completeStage: (difficulty: DifficultyKey, stageId: string, stages: readonly Stage[]) => void
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progressByDifficulty: {},
  ensureDifficultyProgress: (difficulty, stages) => {
    if (get().progressByDifficulty[difficulty]) {
      return
    }

    set((state) => ({
      progressByDifficulty: {
        ...state.progressByDifficulty,
        [difficulty]: createInitialDifficultyProgress(stages),
      },
    }))
  },
  completeStage: (difficulty, stageId, stages) => {
    const existingProgress =
      get().progressByDifficulty[difficulty] ?? createInitialDifficultyProgress(stages)

    set((state) => ({
      progressByDifficulty: {
        ...state.progressByDifficulty,
        [difficulty]: applyStageCompletion({
          progress: existingProgress,
          stages,
          stageId,
        }),
      },
    }))
  },
}))
