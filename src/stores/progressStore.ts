import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DifficultyKey } from '../data/difficulties'
import { completeStageProgress, fetchProgress, type ServerDifficultyProgress } from '../api/progressApi'
import { getChaptersByDifficulty, getStagesByDifficulty } from '../features/stage/stage.utils'
import type { Chapter, Stage } from '../features/stage/stage.types'
import { useSessionStore } from './sessionStore'

export type DifficultyProgress = {
  currentChapterId: string | null
  currentStageId: string | null
  unlockedChapterIds: string[]
  completedChapterIds: string[]
  unlockedStageIdsByChapter: Record<string, string[]>
  completedStageIdsByChapter: Record<string, string[]>
  lastPlayedAt: string | null
}

type LegacyDifficultyProgress = {
  currentStageId: string | null
  clearedStageIds: string[]
  unlockedStageIds: string[]
}

function unique(values: readonly string[]): string[] {
  return values.filter((value, index, array) => array.indexOf(value) === index)
}

function getStagesForChapter(stages: readonly Stage[], chapterId: string): readonly Stage[] {
  return stages
    .filter((stage) => stage.chapterId === chapterId)
    .sort((a, b) => a.order - b.order)
}

function getFirstStageIdForChapter(stages: readonly Stage[], chapterId: string): string | null {
  return getStagesForChapter(stages, chapterId)[0]?.id ?? null
}

function getStrictUnlockedChapterIds(
  chapters: readonly Chapter[],
  completedChapterIds: readonly string[],
): string[] {
  if (chapters.length === 0) {
    return []
  }

  return chapters.reduce<string[]>((unlocked, chapter, index) => {
    if (index === 0) {
      return [chapter.id]
    }

    const previousChapter = chapters[index - 1]

    if (completedChapterIds.includes(previousChapter.id)) {
      unlocked.push(chapter.id)
    }

    return unlocked
  }, [])
}

function enforceDifficultyProgressPolicy(params: {
  progress: DifficultyProgress
  chapters: readonly Chapter[]
  stages: readonly Stage[]
}): DifficultyProgress {
  const { progress, chapters, stages } = params
  const validChapterIds = new Set(chapters.map((chapter) => chapter.id))
  const filteredCompletedChapterIds = unique(progress.completedChapterIds).filter((chapterId) =>
    validChapterIds.has(chapterId),
  )
  const unlockedChapterIds = getStrictUnlockedChapterIds(chapters, filteredCompletedChapterIds)
  const unlockedChapterIdSet = new Set(unlockedChapterIds)
  const unlockedStageIdsByChapter = Object.fromEntries(
    chapters.flatMap((chapter) => {
      if (!unlockedChapterIdSet.has(chapter.id)) {
        return []
      }

      const chapterStageIds = new Set(getStagesForChapter(stages, chapter.id).map((stage) => stage.id))
      const firstStageId = getFirstStageIdForChapter(stages, chapter.id)
      const unlockedStageIds = unique([
        ...(progress.unlockedStageIdsByChapter[chapter.id] ?? []).filter((stageId) => chapterStageIds.has(stageId)),
        ...(progress.completedStageIdsByChapter[chapter.id] ?? []).filter((stageId) => chapterStageIds.has(stageId)),
        ...(firstStageId ? [firstStageId] : []),
      ])

      return [[chapter.id, unlockedStageIds]]
    }),
  )
  const completedStageIdsByChapter = Object.fromEntries(
    chapters.flatMap((chapter) => {
      const chapterStageIds = new Set(getStagesForChapter(stages, chapter.id).map((stage) => stage.id))
      const completedStageIds = unique(progress.completedStageIdsByChapter[chapter.id] ?? []).filter((stageId) =>
        chapterStageIds.has(stageId),
      )

      return completedStageIds.length > 0 ? [[chapter.id, completedStageIds]] : []
    }),
  )
  const firstUnlockedChapterId = unlockedChapterIds[0] ?? null
  const currentChapterId =
    progress.currentChapterId && unlockedChapterIdSet.has(progress.currentChapterId)
      ? progress.currentChapterId
      : firstUnlockedChapterId
  const currentStageId =
    currentChapterId && progress.currentStageId && (unlockedStageIdsByChapter[currentChapterId] ?? []).includes(progress.currentStageId)
      ? progress.currentStageId
      : currentChapterId
        ? (unlockedStageIdsByChapter[currentChapterId] ?? [])[0] ?? null
        : null

  return {
    ...progress,
    currentChapterId,
    currentStageId,
    unlockedChapterIds,
    completedChapterIds: filteredCompletedChapterIds,
    unlockedStageIdsByChapter,
    completedStageIdsByChapter,
  }
}

function isDifficultyProgress(value: unknown): value is DifficultyProgress {
  if (!value || typeof value !== 'object') {
    return false
  }

  const progress = value as Partial<DifficultyProgress>

  return (
    Array.isArray(progress.unlockedChapterIds) &&
    Array.isArray(progress.completedChapterIds) &&
    typeof progress.unlockedStageIdsByChapter === 'object' &&
    progress.unlockedStageIdsByChapter !== null &&
    typeof progress.completedStageIdsByChapter === 'object' &&
    progress.completedStageIdsByChapter !== null
  )
}

function convertLegacyProgress(
  value: LegacyDifficultyProgress | undefined,
  chapters: readonly Chapter[],
  stages: readonly Stage[],
): DifficultyProgress {
  if (!value) {
    return createInitialDifficultyProgress(chapters, stages)
  }

  const firstChapterId = chapters[0]?.id ?? null
  const firstStageId = firstChapterId ? getFirstStageIdForChapter(stages, firstChapterId) : null
  const legacyCompleted = value.clearedStageIds ?? []
  const legacyUnlocked = value.unlockedStageIds ?? []
  const stageGroups = Object.fromEntries(
    chapters.map((chapter) => [
      chapter.id,
      {
        completed: legacyCompleted.filter((stageId) =>
          getStagesForChapter(stages, chapter.id).some((stage) => stage.id === stageId),
        ),
        unlocked: unique([
          ...legacyUnlocked.filter((stageId) =>
            getStagesForChapter(stages, chapter.id).some((stage) => stage.id === stageId),
          ),
          ...(chapter.id === firstChapterId && firstStageId ? [firstStageId] : []),
        ]),
      },
    ]),
  )
  const completedChapterIds = chapters
    .filter((chapter) => {
      const chapterStages = getStagesForChapter(stages, chapter.id)

      return chapterStages.length > 0 && chapterStages.every((stage) => stageGroups[chapter.id].completed.includes(stage.id))
    })
    .map((chapter) => chapter.id)
  const nextProgress = {
    currentChapterId: firstChapterId,
    currentStageId: value.currentStageId ?? firstStageId,
    unlockedChapterIds: getStrictUnlockedChapterIds(chapters, completedChapterIds),
    completedChapterIds,
    unlockedStageIdsByChapter: Object.fromEntries(
      chapters.map((chapter) => [chapter.id, stageGroups[chapter.id].unlocked]),
    ),
    completedStageIdsByChapter: Object.fromEntries(
      chapters.map((chapter) => [chapter.id, stageGroups[chapter.id].completed]),
    ),
    lastPlayedAt: null,
  }

  return enforceDifficultyProgressPolicy({
    progress: nextProgress,
    chapters,
    stages,
  })
}

export function createInitialDifficultyProgress(
  chapters: readonly Chapter[],
  stages: readonly Stage[],
): DifficultyProgress {
  const firstChapterId = chapters[0]?.id ?? null
  const firstStageId = firstChapterId ? getFirstStageIdForChapter(stages, firstChapterId) : null

  return {
    currentChapterId: firstChapterId,
    currentStageId: firstStageId,
    unlockedChapterIds: firstChapterId ? [firstChapterId] : [],
    completedChapterIds: [],
    unlockedStageIdsByChapter: firstChapterId && firstStageId ? { [firstChapterId]: [firstStageId] } : {},
    completedStageIdsByChapter: {},
    lastPlayedAt: null,
  }
}

export function applyStageCompletion(params: {
  progress: DifficultyProgress
  chapters: readonly Chapter[]
  stages: readonly Stage[]
  stageId: string
  now?: Date
}): DifficultyProgress {
  const { progress, chapters, stages, stageId, now = new Date() } = params
  const currentStage = stages.find((stage) => stage.id === stageId)

  if (!currentStage) {
    return progress
  }

  const chapter = chapters.find((item) => item.id === currentStage.chapterId)

  if (!chapter) {
    return progress
  }

  const chapterStages = getStagesForChapter(stages, chapter.id)
  const nextStage = chapterStages.find((stage) => stage.requiredStageId === stageId)
  const previousCompletedStageIds = progress.completedStageIdsByChapter[chapter.id] ?? []
  const nextCompletedStageIds = unique([...previousCompletedStageIds, stageId])
  const previousUnlockedStageIds = progress.unlockedStageIdsByChapter[chapter.id] ?? []
  const nextUnlockedStageIds = unique([
    ...previousUnlockedStageIds,
    stageId,
    ...(nextStage ? [nextStage.id] : []),
  ])
  const completedStageIdsByChapter = {
    ...progress.completedStageIdsByChapter,
    [chapter.id]: nextCompletedStageIds,
  }
  const unlockedStageIdsByChapter = {
    ...progress.unlockedStageIdsByChapter,
    [chapter.id]: nextUnlockedStageIds,
  }
  const isChapterCompleted =
    chapterStages.length > 0 && chapterStages.every((stage) => nextCompletedStageIds.includes(stage.id))
  const completedChapterIds = isChapterCompleted
    ? unique([...progress.completedChapterIds, chapter.id])
    : progress.completedChapterIds

  let unlockedChapterIds = progress.unlockedChapterIds.includes(chapter.id)
    ? progress.unlockedChapterIds
    : [...progress.unlockedChapterIds, chapter.id]
  let currentChapterId = chapter.id
  let currentStageId = nextStage?.id ?? currentStage.id

  if (isChapterCompleted) {
    const nextChapter = chapters.find((item) => item.requiredChapterId === chapter.id)

    if (nextChapter) {
      unlockedChapterIds = unique([...unlockedChapterIds, nextChapter.id])
      currentChapterId = nextChapter.id

      const nextChapterFirstStageId = getFirstStageIdForChapter(stages, nextChapter.id)

      if (nextChapterFirstStageId) {
        unlockedStageIdsByChapter[nextChapter.id] = unique([
          ...(unlockedStageIdsByChapter[nextChapter.id] ?? []),
          nextChapterFirstStageId,
        ])
        currentStageId = nextChapterFirstStageId
      }
    }
  }

  return {
    currentChapterId,
    currentStageId,
    unlockedChapterIds,
    completedChapterIds,
    unlockedStageIdsByChapter,
    completedStageIdsByChapter,
    lastPlayedAt: now.toISOString(),
  }
}

function serverStageIdToFrontendId(serverStageId: string, stages: readonly Stage[]): string {
  const match = serverStageId.match(/_stage_(\d+)$/)
  if (!match) return serverStageId
  const order = parseInt(match[1], 10)
  const chapterId = serverStageId.slice(0, serverStageId.lastIndexOf('_stage_'))
  return stages.find((s) => s.chapterId === chapterId && s.order === order)?.id ?? serverStageId
}

function mapServerProgressRowToDifficultyProgress(
  row: ServerDifficultyProgress,
): DifficultyProgress {
  const stages = getStagesByDifficulty(row.difficulty)
  const toFrontend = (id: string) => serverStageIdToFrontendId(id, stages)
  return {
    currentChapterId: row.current_chapter_id,
    currentStageId: row.current_stage_id ? toFrontend(row.current_stage_id) : null,
    unlockedChapterIds: unique(row.unlocked_chapter_ids),
    completedChapterIds: unique(row.completed_chapter_ids),
    unlockedStageIdsByChapter: Object.fromEntries(
      Object.entries(row.unlocked_stage_ids_by_chapter).map(([chapterId, ids]) => [
        chapterId,
        ids.map(toFrontend),
      ]),
    ),
    completedStageIdsByChapter: Object.fromEntries(
      Object.entries(row.completed_stage_ids_by_chapter).map(([chapterId, ids]) => [
        chapterId,
        ids.map(toFrontend),
      ]),
    ),
    lastPlayedAt: row.updated_at,
  }
}

type ProgressStore = {
  progressByDifficulty: Partial<Record<DifficultyKey, DifficultyProgress>>
  ensureDifficultyProgress: (
    difficulty: DifficultyKey,
    chapters: readonly Chapter[],
    stages: readonly Stage[],
  ) => Promise<void>
  completeStage: (
    difficulty: DifficultyKey,
    stageId: string,
    chapters: readonly Chapter[],
    stages: readonly Stage[],
  ) => Promise<{ synced: boolean; message?: string }>
  setDifficultyProgressFromServer: (
    difficulty: DifficultyKey,
    value: ServerDifficultyProgress,
    chapters: readonly Chapter[],
    stages: readonly Stage[],
  ) => void
  setAllProgressFromServer: (values: ServerDifficultyProgress[]) => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      progressByDifficulty: {},
      ensureDifficultyProgress: async (difficulty, chapters, stages) => {
        const existingValue = get().progressByDifficulty[difficulty]

        if (!existingValue || !isDifficultyProgress(existingValue)) {
          set((state) => ({
            progressByDifficulty: {
              ...state.progressByDifficulty,
              [difficulty]: normalizePersistedDifficultyProgress({
                value: existingValue,
                chapters,
                stages,
              }),
            },
          }))
        }

        const sessionState = useSessionStore.getState()

        if (!sessionState.serverSyncEnabled || !sessionState.sessionToken) {
          return
        }

        try {
          const response = await fetchProgress()
          const serverRow = response.progress.find((row) => row.difficulty === difficulty)

          if (!serverRow) {
            return
          }

          get().setDifficultyProgressFromServer(difficulty, serverRow, chapters, stages)
        } catch {
          return
        }
      },
      completeStage: async (difficulty, stageId, chapters, stages) => {
        const existingProgress =
          get().progressByDifficulty[difficulty] ?? createInitialDifficultyProgress(chapters, stages)
        const currentStage = stages.find((stage) => stage.id === stageId)
        const sessionState = useSessionStore.getState()

        if (!sessionState.serverSyncEnabled || !sessionState.sessionToken || !currentStage) {
          set((state) => ({
            progressByDifficulty: {
              ...state.progressByDifficulty,
              [difficulty]: applyStageCompletion({
                progress: existingProgress,
                chapters,
                stages,
                stageId,
              }),
            },
          }))

          return { synced: true as const }
        }

        try {
          const serverStageId = `${currentStage.chapterId}_stage_${String(currentStage.order).padStart(3, '0')}`
          const response = await completeStageProgress({
            difficulty,
            chapterId: currentStage.chapterId,
            stageId: serverStageId,
          })

          get().setDifficultyProgressFromServer(
            difficulty,
            response.progress,
            chapters,
            stages,
          )

          return { synced: true as const }
        } catch (error) {
          return {
            synced: false as const,
            message:
              error instanceof Error
                ? error.message
                : '스테이지 진행도를 저장하지 못했어요.',
          }
        }
      },
      setDifficultyProgressFromServer: (difficulty, value, chapters, stages) =>
        set((state) => ({
          progressByDifficulty: {
            ...state.progressByDifficulty,
            [difficulty]: normalizePersistedDifficultyProgress({
              value: mapServerProgressRowToDifficultyProgress(value),
              chapters,
              stages,
            }),
          },
        })),
      setAllProgressFromServer: (values) =>
        set((state) => ({
          progressByDifficulty: values.reduce<Partial<Record<DifficultyKey, DifficultyProgress>>>(
            (next, value) => {
              const difficulty = value.difficulty
              const chapters = getChaptersByDifficulty(difficulty)
              const stages = getStagesByDifficulty(difficulty)

              next[difficulty] = normalizePersistedDifficultyProgress({
                value: mapServerProgressRowToDifficultyProgress(value),
                chapters,
                stages,
              })

              return next
            },
            { ...state.progressByDifficulty },
          ),
        })),
    }),
    {
      name: 'maraning-progress-store',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProgressStore> | undefined

        return {
          ...currentState,
          ...persisted,
          progressByDifficulty: persisted?.progressByDifficulty ?? currentState.progressByDifficulty,
        }
      },
      partialize: (state) => ({
        progressByDifficulty: state.progressByDifficulty,
      }),
    },
  ),
)

export function normalizePersistedDifficultyProgress(params: {
  value: unknown
  chapters: readonly Chapter[]
  stages: readonly Stage[]
}): DifficultyProgress {
  const { value, chapters, stages } = params

  if (isDifficultyProgress(value)) {
    return enforceDifficultyProgressPolicy({
      progress: value,
      chapters,
      stages,
    })
  }

  return convertLegacyProgress(value as LegacyDifficultyProgress | undefined, chapters, stages)
}
