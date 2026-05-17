import { describe, expect, it } from '@jest/globals'
import type { Stage } from '../features/stage/stage.types'
import { applyStageCompletion, createInitialDifficultyProgress } from './progressStore'

const stages: Stage[] = [
  {
    id: 'absolute-beginner-stage-1',
    difficulty: 'absolute_beginner',
    order: 1,
    title: '1단계',
    description: '첫 번째 스테이지',
    learningTarget: {
      id: 'absolute-beginner-target-1',
      ko: '사과',
      en: 'apple',
      sentenceKo: '이것은 사과입니다',
      sentenceEn: 'This is an apple',
    },
    quizIds: Array.from({ length: 10 }, (_, index) => `stage-1-quiz-${index + 1}`),
    requiredStageId: null,
  },
  {
    id: 'absolute-beginner-stage-2',
    difficulty: 'absolute_beginner',
    order: 2,
    title: '2단계',
    description: '두 번째 스테이지',
    learningTarget: {
      id: 'absolute-beginner-target-2',
      ko: '고양이',
      en: 'cat',
      sentenceKo: '이것은 고양이입니다',
      sentenceEn: 'This is a cat',
    },
    quizIds: Array.from({ length: 10 }, (_, index) => `stage-2-quiz-${index + 1}`),
    requiredStageId: 'absolute-beginner-stage-1',
  },
  {
    id: 'absolute-beginner-stage-3',
    difficulty: 'absolute_beginner',
    order: 3,
    title: '3단계',
    description: '세 번째 스테이지',
    learningTarget: {
      id: 'absolute-beginner-target-3',
      ko: '강아지',
      en: 'dog',
      sentenceKo: '이것은 강아지입니다',
      sentenceEn: 'This is a dog',
    },
    quizIds: Array.from({ length: 10 }, (_, index) => `stage-3-quiz-${index + 1}`),
    requiredStageId: 'absolute-beginner-stage-2',
  },
]

describe('progressStore helpers', () => {
  it('creates initial progress with only the first stage unlocked', () => {
    expect(createInitialDifficultyProgress(stages)).toEqual({
      currentStageId: 'absolute-beginner-stage-1',
      clearedStageIds: [],
      unlockedStageIds: ['absolute-beginner-stage-1'],
    })
  })

  it('marks a completed stage as cleared and unlocks only the next stage', () => {
    const nextProgress = applyStageCompletion({
      progress: createInitialDifficultyProgress(stages),
      stages,
      stageId: 'absolute-beginner-stage-1',
    })

    expect(nextProgress).toEqual({
      currentStageId: 'absolute-beginner-stage-2',
      clearedStageIds: ['absolute-beginner-stage-1'],
      unlockedStageIds: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
    })
  })

  it('keeps the last cleared stage replayable without unlocking other difficulties', () => {
    const progressed = applyStageCompletion({
      progress: {
        currentStageId: 'absolute-beginner-stage-2',
        clearedStageIds: ['absolute-beginner-stage-1'],
        unlockedStageIds: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
      },
      stages,
      stageId: 'absolute-beginner-stage-3',
    })

    expect(progressed.currentStageId).toBe('absolute-beginner-stage-3')
    expect(progressed.clearedStageIds).toContain('absolute-beginner-stage-3')
    expect(progressed.unlockedStageIds).toContain('absolute-beginner-stage-3')
    expect(progressed.unlockedStageIds).not.toContain('beginner-stage-1')
  })
})
