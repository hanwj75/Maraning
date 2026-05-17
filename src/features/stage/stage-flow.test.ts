import { describe, expect, it } from '@jest/globals'
import { getQuizzesByDifficulty } from '../quiz/quiz.data'
import { getOrderedQuizzesByIds } from '../quiz/quiz.utils'
import { applyStageCompletion, createInitialDifficultyProgress } from '../../stores/progressStore'
import { consumeJellyForSubmission, createInitialJellyState } from '../../stores/jellyStore'
import { applyQuizSubmission, createQuizSession } from '../../stores/quizStore'
import { getStageState, getStagesByDifficulty } from './stage.utils'

describe('stage and quiz core flow', () => {
  it('starts from the first unlocked stage and blocks later locked stages', () => {
    const stages = getStagesByDifficulty('absolute_beginner')
    const progress = createInitialDifficultyProgress(stages)

    expect(
      getStageState({
        stage: stages[0],
        clearedStageIds: progress.clearedStageIds,
        unlockedStageIds: progress.unlockedStageIds,
      }),
    ).toBe('unlocked')

    expect(
      getStageState({
        stage: stages[1],
        clearedStageIds: progress.clearedStageIds,
        unlockedStageIds: progress.unlockedStageIds,
      }),
    ).toBe('locked')
  })

  it('keeps stage entry free, consumes jelly on submit, completes the stage after 10 quizzes, and unlocks the next stage', () => {
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
      progress: createInitialDifficultyProgress(stages),
      stages,
      stageId: stage.id,
    })

    expect(jellyResult.consumed).toBe(true)
    expect(jellyResult.nextState.current).toBe(19)
    expect(orderedQuizzes).toHaveLength(10)
    expect(nextProgress.clearedStageIds).toContain(stage.id)
    expect(nextProgress.unlockedStageIds).toContain(stages[1].id)
  })

  it('allows replay of a completed stage while keeping other difficulties independent', () => {
    const absoluteBeginnerStages = getStagesByDifficulty('absolute_beginner')
    const beginnerStages = getStagesByDifficulty('beginner')
    const completedProgress = applyStageCompletion({
      progress: createInitialDifficultyProgress(absoluteBeginnerStages),
      stages: absoluteBeginnerStages,
      stageId: absoluteBeginnerStages[0].id,
    })
    const beginnerProgress = createInitialDifficultyProgress(beginnerStages)

    expect(
      getStageState({
        stage: absoluteBeginnerStages[0],
        clearedStageIds: completedProgress.clearedStageIds,
        unlockedStageIds: completedProgress.unlockedStageIds,
      }),
    ).toBe('completed')

    expect(
      getStageState({
        stage: beginnerStages[1],
        clearedStageIds: beginnerProgress.clearedStageIds,
        unlockedStageIds: beginnerProgress.unlockedStageIds,
      }),
    ).toBe('locked')
  })

  it('does not complete or unlock a stage when the session fails', () => {
    const stages = getStagesByDifficulty('absolute_beginner')
    const progress = createInitialDifficultyProgress(stages)
    const failedSession = applyQuizSubmission({
      session: {
        ...createQuizSession({
          stageId: stages[0].id,
          difficulty: 'absolute_beginner',
          quizIds: stages[0].quizIds,
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
    expect(progress.clearedStageIds).toEqual([])
    expect(progress.unlockedStageIds).toEqual(['absolute-beginner.stage.001'])
  })
})
