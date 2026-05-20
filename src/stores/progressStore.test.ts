import { describe, expect, it } from '@jest/globals'
import type { Chapter, Stage } from '../features/stage/stage.types'
import { applyStageCompletion, createInitialDifficultyProgress, normalizePersistedDifficultyProgress } from './progressStore'

const chapters: Chapter[] = [
  {
    id: 'absolute_beginner_chapter_001',
    difficulty: 'absolute_beginner',
    order: 1,
    title: '1장',
    description: '첫 번째 큰 스테이지',
    stageIds: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
    requiredChapterId: null,
  },
  {
    id: 'absolute_beginner_chapter_002',
    difficulty: 'absolute_beginner',
    order: 2,
    title: '2장',
    description: '두 번째 큰 스테이지',
    stageIds: ['absolute-beginner-stage-3'],
    requiredChapterId: 'absolute_beginner_chapter_001',
  },
  {
    id: 'absolute_beginner_chapter_003',
    difficulty: 'absolute_beginner',
    order: 3,
    title: '3장',
    description: '세 번째 큰 스테이지',
    stageIds: ['absolute-beginner-stage-4'],
    requiredChapterId: 'absolute_beginner_chapter_002',
  },
]

const stages: Stage[] = [
  {
    id: 'absolute-beginner-stage-1',
    difficulty: 'absolute_beginner',
    chapterId: 'absolute_beginner_chapter_001',
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
    chapterId: 'absolute_beginner_chapter_001',
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
    chapterId: 'absolute_beginner_chapter_002',
    order: 1,
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
  {
    id: 'absolute-beginner-stage-4',
    difficulty: 'absolute_beginner',
    chapterId: 'absolute_beginner_chapter_003',
    order: 1,
    title: '4단계',
    description: '네 번째 스테이지',
    learningTarget: {
      id: 'absolute-beginner-target-4',
      ko: '학교',
      en: 'school',
      sentenceKo: '여기는 학교입니다',
      sentenceEn: 'This is a school',
    },
    quizIds: Array.from({ length: 10 }, (_, index) => `stage-4-quiz-${index + 1}`),
    requiredStageId: 'absolute-beginner-stage-3',
  },
]

describe('progressStore helpers', () => {
  it('creates initial progress with only the first chapter and first stage unlocked', () => {
    expect(createInitialDifficultyProgress(chapters, stages)).toEqual({
      currentChapterId: 'absolute_beginner_chapter_001',
      currentStageId: 'absolute-beginner-stage-1',
      unlockedChapterIds: ['absolute_beginner_chapter_001'],
      completedChapterIds: [],
      unlockedStageIdsByChapter: {
        absolute_beginner_chapter_001: ['absolute-beginner-stage-1'],
      },
      completedStageIdsByChapter: {},
      lastPlayedAt: null,
    })
  })

  it('marks a completed stage as cleared and unlocks only the next stage', () => {
    const nextProgress = applyStageCompletion({
      progress: createInitialDifficultyProgress(chapters, stages),
      chapters,
      stages,
      stageId: 'absolute-beginner-stage-1',
      now: new Date('2026-05-19T10:00:00.000Z'),
    })

    expect(nextProgress.currentChapterId).toBe('absolute_beginner_chapter_001')
    expect(nextProgress.currentStageId).toBe('absolute-beginner-stage-2')
    expect(nextProgress.completedStageIdsByChapter.absolute_beginner_chapter_001).toEqual([
      'absolute-beginner-stage-1',
    ])
    expect(nextProgress.unlockedStageIdsByChapter.absolute_beginner_chapter_001).toEqual([
      'absolute-beginner-stage-1',
      'absolute-beginner-stage-2',
    ])
  })

  it('completes a chapter and unlocks the next chapter after all stages are cleared', () => {
    const progressed = applyStageCompletion({
      progress: applyStageCompletion({
        progress: createInitialDifficultyProgress(chapters, stages),
        chapters,
        stages,
        stageId: 'absolute-beginner-stage-1',
      }),
      chapters,
      stages,
      stageId: 'absolute-beginner-stage-2',
    })

    expect(progressed.completedChapterIds).toContain('absolute_beginner_chapter_001')
    expect(progressed.unlockedChapterIds).toContain('absolute_beginner_chapter_002')
    expect(progressed.unlockedChapterIds).not.toContain('absolute_beginner_chapter_003')
    expect(progressed.unlockedStageIdsByChapter.absolute_beginner_chapter_002).toEqual([
      'absolute-beginner-stage-3',
    ])
  })

  it('keeps the last cleared stage replayable without unlocking other difficulties', () => {
    const progressed = applyStageCompletion({
      progress: {
        currentChapterId: 'absolute_beginner_chapter_002',
        currentStageId: 'absolute-beginner-stage-2',
        unlockedChapterIds: ['absolute_beginner_chapter_001', 'absolute_beginner_chapter_002'],
        completedChapterIds: ['absolute_beginner_chapter_001'],
        unlockedStageIdsByChapter: {
          absolute_beginner_chapter_001: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
          absolute_beginner_chapter_002: ['absolute-beginner-stage-3'],
        },
        completedStageIdsByChapter: {
          absolute_beginner_chapter_001: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
        },
        lastPlayedAt: null,
      },
      chapters,
      stages,
      stageId: 'absolute-beginner-stage-3',
    })

    expect(progressed.currentStageId).toBe('absolute-beginner-stage-4')
    expect(progressed.completedStageIdsByChapter.absolute_beginner_chapter_002).toContain(
      'absolute-beginner-stage-3',
    )
    expect(progressed.unlockedStageIdsByChapter.absolute_beginner_chapter_002).toContain(
      'absolute-beginner-stage-3',
    )
    expect(progressed.unlockedChapterIds).not.toContain('beginner_chapter_001')
    expect(progressed.unlockedChapterIds).toContain('absolute_beginner_chapter_003')
  })

  it('normalizes persisted progress so only the immediate next chapter remains unlocked', () => {
    const normalized = normalizePersistedDifficultyProgress({
      value: {
        currentChapterId: 'absolute_beginner_chapter_003',
        currentStageId: 'absolute-beginner-stage-4',
        unlockedChapterIds: [
          'absolute_beginner_chapter_001',
          'absolute_beginner_chapter_002',
          'absolute_beginner_chapter_003',
        ],
        completedChapterIds: ['absolute_beginner_chapter_001'],
        unlockedStageIdsByChapter: {
          absolute_beginner_chapter_001: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
          absolute_beginner_chapter_002: ['absolute-beginner-stage-3'],
          absolute_beginner_chapter_003: ['absolute-beginner-stage-4'],
        },
        completedStageIdsByChapter: {
          absolute_beginner_chapter_001: ['absolute-beginner-stage-1', 'absolute-beginner-stage-2'],
        },
        lastPlayedAt: null,
      },
      chapters,
      stages,
    })

    expect(normalized.unlockedChapterIds).toEqual([
      'absolute_beginner_chapter_001',
      'absolute_beginner_chapter_002',
    ])
    expect(normalized.currentChapterId).toBe('absolute_beginner_chapter_001')
    expect(normalized.unlockedStageIdsByChapter.absolute_beginner_chapter_003).toBeUndefined()
  })
})
