import absoluteBeginnerQuizzes from '../../data/quizzes/absolute-beginner.quizzes.json'
import advancedQuizzes from '../../data/quizzes/advanced.quizzes.json'
import beginnerQuizzes from '../../data/quizzes/beginner.quizzes.json'
import conversationQuizzes from '../../data/quizzes/conversation.quizzes.json'
import intermediateQuizzes from '../../data/quizzes/intermediate.quizzes.json'
import toeicQuizzes from '../../data/quizzes/toeic.quizzes.json'
import type { DifficultyKey } from '../../data/difficulties'
import type { Quiz } from './quiz.types'

const quizzesByDifficulty: Record<DifficultyKey, readonly Quiz[]> = {
  absolute_beginner: absoluteBeginnerQuizzes as Quiz[],
  beginner: beginnerQuizzes as Quiz[],
  intermediate: intermediateQuizzes as Quiz[],
  advanced: advancedQuizzes as Quiz[],
  conversation: conversationQuizzes as Quiz[],
  toeic: toeicQuizzes as Quiz[],
}

export function getQuizzesByDifficulty(difficulty: DifficultyKey): readonly Quiz[] {
  return quizzesByDifficulty[difficulty]
}
