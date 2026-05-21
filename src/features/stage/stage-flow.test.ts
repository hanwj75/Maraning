import { describe, expect, it } from '@jest/globals'
import { getQuizzesByDifficulty } from '../quiz/quiz.data'
import { getOrderedQuizzesByIds } from '../quiz/quiz.utils'
import { applyStageCompletion, createInitialDifficultyProgress } from '../../stores/progressStore'
import { consumeJellyForSubmission, createInitialJellyState } from '../../stores/jellyStore'
import { applyQuizSubmission, createQuizSession } from '../../stores/quizStore'
import { getChapterState, getChaptersByDifficulty, getStageState, getStagesByChapter, getStagesByDifficulty } from './stage.utils'

describe('stage and quiz core flow', () => {
  it('starts from the first unlocked chapter and first unlocked stage, and blocks later locked stages', () => {
    const chapters = getChaptersByDifficulty('absolute_beginner')
    const stages = getStagesByDifficulty('absolute_beginner')
    const chapterStages = getStagesByChapter('absolute_beginner', chapters[0].id)
    const progress = createInitialDifficultyProgress(chapters, stages)

    expect(
      getChapterState({
        chapter: chapters[0],
        completedChapterIds: progress.completedChapterIds,
        unlockedChapterIds: progress.unlockedChapterIds,
      }),
    ).toBe('unlocked')

    expect(
      getStageState({
        stage: chapterStages[0],
        completedStageIds: progress.completedStageIdsByChapter[chapters[0].id] ?? [],
        unlockedStageIds: progress.unlockedStageIdsByChapter[chapters[0].id] ?? [],
      }),
    ).toBe('unlocked')

    expect(
      getStageState({
        stage: chapterStages[1],
        completedStageIds: progress.completedStageIdsByChapter[chapters[0].id] ?? [],
        unlockedStageIds: progress.unlockedStageIdsByChapter[chapters[0].id] ?? [],
      }),
    ).toBe('locked')
  })

  it('keeps stage entry free, consumes jelly on submit, completes the stage after 10 quizzes, and unlocks the next stage', () => {
    const chapters = getChaptersByDifficulty('absolute_beginner')
    const stages = getStagesByDifficulty('absolute_beginner')
    const quizzes = getQuizzesByDifficulty('absolute_beginner')
    const jelly = createInitialJellyState(new Date('2026-05-17T09:00:00+09:00'))
    const stage = stages[0]

    const jellyResult = consumeJellyForSubmission(jelly)
    const orderedQuizzes = getOrderedQuizzesByIds(
      quizzes.filter((quiz) => quiz.stageId === stage.id),
      stage.quizIds,
    )
    const nextProgress = applyStageCompletion({
      progress: createInitialDifficultyProgress(chapters, stages),
      chapters,
      stages,
      stageId: stage.id,
    })

    expect(jellyResult.consumed).toBe(true)
    expect(jellyResult.nextState.current).toBe(19)
    expect(orderedQuizzes).toHaveLength(10)
    expect(nextProgress.completedStageIdsByChapter[stage.chapterId]).toContain(stage.id)
    expect(nextProgress.unlockedStageIdsByChapter[stage.chapterId]).toContain(stages[1].id)
  })

  it('allows replay of a completed stage while keeping other difficulties independent', () => {
    const absoluteBeginnerChapters = getChaptersByDifficulty('absolute_beginner')
    const beginnerChapters = getChaptersByDifficulty('beginner')
    const absoluteBeginnerStages = getStagesByDifficulty('absolute_beginner')
    const beginnerStages = getStagesByDifficulty('beginner')
    const completedProgress = applyStageCompletion({
      progress: createInitialDifficultyProgress(absoluteBeginnerChapters, absoluteBeginnerStages),
      chapters: absoluteBeginnerChapters,
      stages: absoluteBeginnerStages,
      stageId: absoluteBeginnerStages[0].id,
    })
    const beginnerProgress = createInitialDifficultyProgress(beginnerChapters, beginnerStages)

    expect(
      getStageState({
        stage: absoluteBeginnerStages[0],
        completedStageIds: completedProgress.completedStageIdsByChapter[absoluteBeginnerStages[0].chapterId] ?? [],
        unlockedStageIds: completedProgress.unlockedStageIdsByChapter[absoluteBeginnerStages[0].chapterId] ?? [],
      }),
    ).toBe('completed')

    expect(
      getStageState({
        stage: beginnerStages[1],
        completedStageIds: beginnerProgress.completedStageIdsByChapter[beginnerStages[1].chapterId] ?? [],
        unlockedStageIds: beginnerProgress.unlockedStageIdsByChapter[beginnerStages[1].chapterId] ?? [],
      }),
    ).toBe('locked')
  })

  it('does not complete or unlock a stage when the session fails', () => {
    const chapters = getChaptersByDifficulty('absolute_beginner')
    const stages = getStagesByDifficulty('absolute_beginner')
    const quizzes = getQuizzesByDifficulty('absolute_beginner')
    const progress = createInitialDifficultyProgress(chapters, stages)
    const failedSession = applyQuizSubmission({
      session: {
        ...createQuizSession({
          chapterId: stages[0].chapterId,
          stageId: stages[0].id,
          difficulty: 'absolute_beginner',
          quizIds: stages[0].quizIds,
          quizzes: getOrderedQuizzesByIds(
            quizzes.filter((quiz) => quiz.stageId === stages[0].id),
            stages[0].quizIds,
          ),
        }),
        failLife: 1,
      },
      result: null,
      answer: {
        quizId: stages[0].quizIds[0],
        submission: {
          type: 'image_select',
          choiceId: 'b',
          value: 'cat',
        },
        isCorrect: false,
      },
    })

    expect(failedSession.status).toBe('failed')
    expect(progress.completedStageIdsByChapter[stages[0].chapterId] ?? []).toEqual([])
    expect(progress.unlockedStageIdsByChapter[stages[0].chapterId]).toEqual(['absolute-beginner.stage.001'])
  })

  it('marks the current chapter completed after all stages in the chapter are completed', () => {
    const chapters = getChaptersByDifficulty('absolute_beginner')
    const stages = getStagesByDifficulty('absolute_beginner')
    const finalProgress = stages.reduce(
      (progress, stage) =>
        applyStageCompletion({
          progress,
          chapters,
          stages,
          stageId: stage.id,
        }),
      createInitialDifficultyProgress(chapters, stages),
    )

    expect(finalProgress.completedChapterIds).toContain(chapters[0].id)
  })
})
