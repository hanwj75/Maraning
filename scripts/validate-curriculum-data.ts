/// <reference types="node" />

import fs from 'node:fs'
import path from 'node:path'

type DifficultyKey =
  | 'absolute_beginner'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'conversation'
  | 'toeic'

type Chapter = {
  id: string
  difficulty: DifficultyKey
  order: number
  title: string
  description: string
  stageIds: string[]
  requiredChapterId: string | null
}

type LearningTarget = {
  id: string
  ko: string
  en: string
  sentenceKo: string
  sentenceEn: string
}

type Stage = {
  id: string
  difficulty: DifficultyKey
  chapterId: string
  order: number
  title: string
  description: string
  learningTarget: LearningTarget
  quizIds: string[]
  requiredStageId: string | null
}

type QuizChoice = {
  id: string
  text: string
  matchKey?: string
}

type Quiz = {
  id: string
  stageId: string
  difficulty: DifficultyKey
  type: string
  question: string
  prompt: string
  choices: QuizChoice[]
  answer: Record<string, unknown>
  explanation: string
  learningTargetId?: string
  targetKey?: string
  targetKo?: string
  targetEn?: string
  validation?: {
    mode?: string
  }
}

const rootDir = path.resolve(process.cwd())
const chaptersDir = path.join(rootDir, 'src', 'data', 'chapters')
const stagesDir = path.join(rootDir, 'src', 'data', 'stages')
const quizzesDir = path.join(rootDir, 'src', 'data', 'quizzes')

const difficulties: Array<{ key: DifficultyKey; slug: string }> = [
  { key: 'absolute_beginner', slug: 'absolute-beginner' },
  { key: 'beginner', slug: 'beginner' },
  { key: 'intermediate', slug: 'intermediate' },
  { key: 'advanced', slug: 'advanced' },
  { key: 'conversation', slug: 'conversation' },
  { key: 'toeic', slug: 'toeic' },
]

const allowedQuizTypes = new Set(['image_select', 'matching', 'word_order', 'blank_fill'])

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function hasEnglishText(value: string): boolean {
  return /[A-Za-z]/.test(value)
}

function hasKoreanText(value: string): boolean {
  return /[가-힣]/.test(value)
}

function normalized(value: string): string {
  return value.trim().toLowerCase()
}

function containsForbiddenAnswerIndex(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsForbiddenAnswerIndex)
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).some(
      ([key, nestedValue]) => key.toLowerCase().includes('answerindex') || containsForbiddenAnswerIndex(nestedValue),
    )
  }

  return false
}

function fail(errors: string[]): never {
  for (const error of errors) {
    console.error(error)
  }
  process.exit(1)
}

function validateChapterData(
  difficulty: DifficultyKey,
  chapters: Chapter[],
  stages: Stage[],
  errors: string[],
): void {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]))

  if (chapters.length !== 10) {
    errors.push(`[chapters/${difficulty}] expected 10 chapters but found ${chapters.length}`)
  }

  const orderedChapters = [...chapters].sort((a, b) => a.order - b.order)

  orderedChapters.forEach((chapter, index) => {
    const expectedOrder = index + 1

    if (chapter.order !== expectedOrder) {
      errors.push(`[chapters/${difficulty}] chapter ${chapter.id} has order ${chapter.order}, expected ${expectedOrder}`)
    }

    if (chapter.stageIds.length !== 10) {
      errors.push(`[chapters/${difficulty}] chapter ${chapter.id} must include 10 stageIds, found ${chapter.stageIds.length}`)
    }

    const expectedRequiredChapterId =
      index === 0 ? null : orderedChapters[index - 1]?.id ?? null

    if (chapter.requiredChapterId !== expectedRequiredChapterId) {
      errors.push(
        `[chapters/${difficulty}] chapter ${chapter.id} has requiredChapterId=${chapter.requiredChapterId}, expected ${expectedRequiredChapterId}`,
      )
    }

    for (const stageId of chapter.stageIds) {
      const stage = stageById.get(stageId)

      if (!stage) {
        errors.push(`[chapters/${difficulty}] chapter ${chapter.id} references missing stageId ${stageId}`)
        continue
      }

      if (stage.chapterId !== chapter.id) {
        errors.push(`[chapters/${difficulty}] stage ${stage.id} chapterId=${stage.chapterId} does not match chapter ${chapter.id}`)
      }
    }
  })
}

function validateStageData(
  difficulty: DifficultyKey,
  chapters: Chapter[],
  stages: Stage[],
  quizzes: Quiz[],
  errors: string[],
): void {
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]))
  const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]))

  if (stages.length !== 100) {
    errors.push(`[stages/${difficulty}] expected 100 stages but found ${stages.length}`)
  }

  const stagesByChapterId = new Map<string, Stage[]>()
  for (const stage of stages) {
    const list = stagesByChapterId.get(stage.chapterId) ?? []
    list.push(stage)
    stagesByChapterId.set(stage.chapterId, list)
  }

  for (const chapter of chapters) {
    const chapterStages = [...(stagesByChapterId.get(chapter.id) ?? [])].sort((a, b) => a.order - b.order)

    if (chapterStages.length !== 10) {
      errors.push(`[stages/${difficulty}] chapter ${chapter.id} must include 10 stages, found ${chapterStages.length}`)
    }

    chapterStages.forEach((stage, index) => {
      const expectedOrder = index + 1
      const expectedRequiredStageId = index === 0 ? null : chapterStages[index - 1]?.id ?? null

      if (stage.order !== expectedOrder) {
        errors.push(`[stages/${difficulty}] stage ${stage.id} in chapter ${chapter.id} has order ${stage.order}, expected ${expectedOrder}`)
      }

      if (stage.requiredStageId !== expectedRequiredStageId) {
        errors.push(
          `[stages/${difficulty}] stage ${stage.id} has requiredStageId=${stage.requiredStageId}, expected ${expectedRequiredStageId}`,
        )
      }

      if (stage.quizIds.length !== 10) {
        errors.push(`[stages/${difficulty}] stage ${stage.id} must include exactly 10 quizIds, found ${stage.quizIds.length}`)
      }

      if (stage.difficulty !== difficulty) {
        errors.push(`[stages/${difficulty}] stage ${stage.id} difficulty=${stage.difficulty} does not match file difficulty ${difficulty}`)
      }

      if (!chapterById.has(stage.chapterId)) {
        errors.push(`[stages/${difficulty}] stage ${stage.id} references missing chapterId ${stage.chapterId}`)
      }

      if (
        !stage.learningTarget ||
        !stage.learningTarget.id ||
        !stage.learningTarget.ko ||
        !stage.learningTarget.en ||
        !stage.learningTarget.sentenceKo ||
        !stage.learningTarget.sentenceEn
      ) {
        errors.push(`[stages/${difficulty}] stage ${stage.id} has incomplete learningTarget`)
      }

      for (const quizId of stage.quizIds) {
        const quiz = quizzesById.get(quizId)
        if (!quiz) {
          errors.push(`[stages/${difficulty}] stage ${stage.id} references missing quizId ${quizId}`)
          continue
        }
        if (quiz.stageId !== stage.id) {
          errors.push(`[stages/${difficulty}] quiz ${quiz.id} stageId=${quiz.stageId} does not match stage ${stage.id}`)
        }
      }
    })
  }
}

function validateQuizData(
  difficulty: DifficultyKey,
  stages: Stage[],
  quizzes: Quiz[],
  errors: string[],
  globalQuizIds: Set<string>,
): void {
  const stageById = new Map(stages.map((stage) => [stage.id, stage]))

  if (quizzes.length !== 1000) {
    errors.push(`[quizzes/${difficulty}] expected 1000 quizzes but found ${quizzes.length}`)
  }

  for (const quiz of quizzes) {
    if (globalQuizIds.has(quiz.id)) {
      errors.push(`[quizzes/${difficulty}] duplicate quiz id detected: ${quiz.id}`)
    }
    globalQuizIds.add(quiz.id)

    if (!allowedQuizTypes.has(quiz.type)) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} has unsupported type ${quiz.type}`)
    }

    if (quiz.type === 'typing') {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} must not use typing`)
    }

    if (quiz.difficulty !== difficulty) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} difficulty=${quiz.difficulty} does not match file difficulty ${difficulty}`)
    }

    const stage = stageById.get(quiz.stageId)
    if (!stage) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} references missing stageId ${quiz.stageId}`)
      continue
    }

    if (!quiz.question?.trim()) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} question is empty`)
    }

    if (!quiz.prompt?.trim()) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} prompt is empty`)
    }

    if (quiz.targetKey !== undefined && quiz.targetKey !== stage.learningTarget.id.replace(`${difficultyFilesSlug(difficulty)}.target.`, '')) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} targetKey=${quiz.targetKey} does not match stage learning target`)
    }

    if (quiz.learningTargetId && quiz.learningTargetId !== stage.learningTarget.id) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} learningTargetId=${quiz.learningTargetId} does not match stage learningTarget.id ${stage.learningTarget.id}`)
    }

    if (containsForbiddenAnswerIndex(quiz)) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} contains forbidden answerIndex-based field`)
    }

    if (quiz.validation?.mode && quiz.validation.mode !== 'deterministic') {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} validation.mode must be deterministic`)
    }

    if (quiz.type === 'image_select' || quiz.type === 'blank_fill') {
      if (quiz.choices.length < 4 || quiz.choices.length > 6) {
        errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} must include 4-6 choices, found ${quiz.choices.length}`)
      }
    }

    const promptHasEnglish = hasEnglishText(quiz.prompt)
    const choiceHasEnglish = quiz.choices.some((choice) => hasEnglishText(choice.text))
    if (!promptHasEnglish && !choiceHasEnglish) {
      errors.push(`[quizzes/${difficulty}] quiz ${quiz.id} prompt and choices cannot both be Korean-only`)
    }

    if (quiz.type === 'matching') {
      const pairs = Array.isArray(quiz.answer.pairs) ? (quiz.answer.pairs as Array<{ leftId: string; rightId: string }>) : []
      if (pairs.length < 3) {
        errors.push(`[quizzes/${difficulty}] matching quiz ${quiz.id} must include at least 3 pairs`)
      }
      const choicesById = new Map(quiz.choices.map((choice) => [choice.id, choice]))
      for (const pair of pairs) {
        const left = choicesById.get(pair.leftId)
        const right = choicesById.get(pair.rightId)
        if (!left || !right) {
          errors.push(`[quizzes/${difficulty}] matching quiz ${quiz.id} has pair with missing choice id`)
          continue
        }
        if (!hasEnglishText(left.text) || !hasKoreanText(right.text)) {
          errors.push(`[quizzes/${difficulty}] matching quiz ${quiz.id} must connect English left choices to Korean right choices`)
        }
      }
    }

    if (quiz.type === 'word_order') {
      const orderedTokens = Array.isArray(quiz.answer.orderedTokens) ? (quiz.answer.orderedTokens as string[]) : []
      if (orderedTokens.length !== quiz.choices.length) {
        errors.push(`[quizzes/${difficulty}] word_order quiz ${quiz.id} choices length and orderedTokens length must match`)
      }
    }

    if (quiz.type === 'blank_fill') {
      const acceptedAnswers = Array.isArray(quiz.answer.acceptedAnswers)
        ? (quiz.answer.acceptedAnswers as string[])
        : []

      if (acceptedAnswers.length === 0) {
        errors.push(`[quizzes/${difficulty}] blank_fill quiz ${quiz.id} must include acceptedAnswers`)
      }

      if (!hasEnglishText(quiz.prompt) || !quiz.prompt.includes('___')) {
        errors.push(`[quizzes/${difficulty}] blank_fill quiz ${quiz.id} prompt must be an English sentence containing ___`)
      }

      if (quiz.choices.some((choice) => !hasEnglishText(choice.text))) {
        errors.push(`[quizzes/${difficulty}] blank_fill quiz ${quiz.id} choices must be English`)
      }

      const targetMeaning = quiz.targetKo?.trim() || stage.learningTarget.sentenceKo.trim()
      if (!quiz.question.includes(targetMeaning)) {
        errors.push(`[quizzes/${difficulty}] blank_fill quiz ${quiz.id} question must include targetKo or sentenceKo meaning`)
      }

      if (quiz.targetEn && !acceptedAnswers.some((answer) => normalized(answer) === normalized(quiz.targetEn ?? ''))) {
        errors.push(`[quizzes/${difficulty}] blank_fill quiz ${quiz.id} targetEn must be included in acceptedAnswers`)
      }
    }
  }

  const quizzesByStageId = new Map<string, Quiz[]>()
  for (const quiz of quizzes) {
    const list = quizzesByStageId.get(quiz.stageId) ?? []
    list.push(quiz)
    quizzesByStageId.set(quiz.stageId, list)
  }

  for (const stage of stages) {
    const stageQuizzes = quizzesByStageId.get(stage.id) ?? []
    if (stageQuizzes.length !== 10) {
      errors.push(`[quizzes/${difficulty}] stage ${stage.id} must own 10 quizzes, found ${stageQuizzes.length}`)
    }
  }
}

function difficultyFilesSlug(difficulty: DifficultyKey): string {
  return difficulty === 'absolute_beginner' ? 'absolute-beginner' : difficulty
}

function main(): void {
  const errors: string[] = []
  const globalQuizIds = new Set<string>()
  const summary: Array<{ difficulty: DifficultyKey; chapters: number; stages: number; quizzes: number }> = []

  for (const { key, slug } of difficulties) {
    const chaptersPath = path.join(chaptersDir, `${slug}.chapters.json`)
    const stagesPath = path.join(stagesDir, `${slug}.stages.json`)
    const quizzesPath = path.join(quizzesDir, `${slug}.quizzes.json`)

    const chapters = readJson<Chapter[]>(chaptersPath)
    const stages = readJson<Stage[]>(stagesPath)
    const quizzes = readJson<Quiz[]>(quizzesPath)

    validateChapterData(key, chapters, stages, errors)
    validateStageData(key, chapters, stages, quizzes, errors)
    validateQuizData(key, stages, quizzes, errors, globalQuizIds)

    summary.push({
      difficulty: key,
      chapters: chapters.length,
      stages: stages.length,
      quizzes: quizzes.length,
    })
  }

  if (errors.length > 0) {
    fail(errors)
  }

  const totalChapters = summary.reduce((sum, item) => sum + item.chapters, 0)
  const totalStages = summary.reduce((sum, item) => sum + item.stages, 0)
  const totalQuizzes = summary.reduce((sum, item) => sum + item.quizzes, 0)

  console.table(summary)
  console.log(`Chapter count: ${totalChapters}`)
  console.log(`Stage count: ${totalStages}`)
  console.log(`Quiz count: ${totalQuizzes}`)
  console.log('Curriculum validation passed')
}

main()
