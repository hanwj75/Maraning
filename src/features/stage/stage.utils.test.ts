import { describe, expect, it } from '@jest/globals'
import { difficultyKeys } from '../../data/difficulties'
import { getQuizzesByDifficulty } from '../quiz/quiz.data'
import { areQuizIdsUnique, getQuizzesForStage, validateQuizData } from '../quiz/quiz.utils'
import {
  STAGE_QUIZ_COUNT,
  getChaptersByDifficulty,
  getStageById,
  validateChapterData,
  getStagesByDifficulty,
  validateStageData,
  validateStageQuizCount,
} from './stage.utils'

describe('stage.utils data validation', () => {
  it('keeps every difficulty data set valid', () => {
    for (const difficulty of difficultyKeys) {
      const chapters = getChaptersByDifficulty(difficulty)
      const stages = getStagesByDifficulty(difficulty)
      const quizzes = getQuizzesByDifficulty(difficulty)

      expect(validateChapterData(chapters, stages)).toEqual([])
      expect(validateStageData(stages, quizzes, chapters)).toEqual([])
      expect(validateQuizData(quizzes)).toEqual([])
      expect(areQuizIdsUnique(quizzes)).toBe(true)
    }
  })

  it('ensures every stage owns exactly 10 quizzes from the same difficulty', () => {
    for (const difficulty of difficultyKeys) {
      const stages = getStagesByDifficulty(difficulty)
      const quizzes = getQuizzesByDifficulty(difficulty)

      for (const stage of stages) {
        expect(validateStageQuizCount(stage)).toEqual([])
        expect(stage.quizIds).toHaveLength(STAGE_QUIZ_COUNT)
        expect(stage.chapterId).toBeTruthy()

        const stageQuizzes = getQuizzesForStage(quizzes, stage.id)

        expect(stageQuizzes).toHaveLength(STAGE_QUIZ_COUNT)
        expect(stageQuizzes.every((quiz) => quiz.difficulty === difficulty)).toBe(true)
      }
    }
  })

  it('does not mix stage ids across other difficulties', () => {
    const absoluteBeginnerStage = getStageById('absolute_beginner', 'absolute-beginner.stage.001')
    const beginnerStage = getStageById('beginner', 'absolute-beginner.stage.001')

    expect(absoluteBeginnerStage?.difficulty).toBe('absolute_beginner')
    expect(beginnerStage).toBeUndefined()
  })

  it('keeps chapter ids isolated by difficulty', () => {
    const absoluteBeginnerChapter = getChaptersByDifficulty('absolute_beginner')[0]
    const beginnerChapter = getChaptersByDifficulty('beginner')[0]

    expect(absoluteBeginnerChapter.difficulty).toBe('absolute_beginner')
    expect(beginnerChapter.id).not.toBe(absoluteBeginnerChapter.id)
  })
})
