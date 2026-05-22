import { handleCorsPreflightRequest } from '../_shared/cors.ts'
import { jsonError, jsonSuccess } from '../_shared/response.ts'
import { verifyAppSession } from '../_shared/session.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

type DifficultyId =
  | 'absolute_beginner'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'conversation'
  | 'toeic'

type UserProgressRow = {
  id: string
  user_id: string
  difficulty: DifficultyId
  unlocked_chapter_ids: unknown
  completed_chapter_ids: unknown
  unlocked_stage_ids_by_chapter: unknown
  completed_stage_ids_by_chapter: unknown
  current_chapter_id: string | null
  current_stage_id: string | null
  updated_at: string
}

type StageCompleteRequest = {
  difficulty?: string
  chapterId?: string
  stageId?: string
}

const DEFAULT_DIFFICULTIES: readonly DifficultyId[] = [
  'absolute_beginner',
  'beginner',
  'intermediate',
  'advanced',
  'conversation',
  'toeic',
]

const CHAPTER_COUNT = 10
const STAGE_COUNT = 10

function isDifficultyId(value: unknown): value is DifficultyId {
  return (
    typeof value === 'string' &&
    DEFAULT_DIFFICULTIES.includes(value as DifficultyId)
  )
}

function formatOrder(order: number) {
  return String(order).padStart(3, '0')
}

function buildChapterId(difficulty: DifficultyId, chapterOrder: number) {
  return `${difficulty}_chapter_${formatOrder(chapterOrder)}`
}

function buildStageId(
  difficulty: DifficultyId,
  chapterOrder: number,
  stageOrder: number,
) {
  return `${difficulty}_chapter_${formatOrder(chapterOrder)}_stage_${formatOrder(stageOrder)}`
}

function parseChapterOrder(chapterId: string): number | null {
  const match = chapterId.match(/_chapter_(\d{3})$/)
  return match ? Number(match[1]) : null
}

function parseStageOrders(stageId: string): { chapterOrder: number; stageOrder: number } | null {
  const match = stageId.match(/_chapter_(\d{3})_stage_(\d{3})$/)
  if (!match) {
    return null
  }

  return {
    chapterOrder: Number(match[1]),
    stageOrder: Number(match[2]),
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function toStringArray(value: unknown): string[] {
  return isStringArray(value) ? value : []
}

function toStringArrayMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, rawValue]) => [key, toStringArray(rawValue)]),
  )
}

function unique(values: readonly string[]) {
  return values.filter((value, index, array) => array.indexOf(value) === index)
}

function createDefaultProgressRow(userId: string, difficulty: DifficultyId) {
  const firstChapterId = buildChapterId(difficulty, 1)
  const firstStageId = buildStageId(difficulty, 1, 1)

  return {
    user_id: userId,
    difficulty,
    unlocked_chapter_ids: [firstChapterId],
    completed_chapter_ids: [],
    unlocked_stage_ids_by_chapter: {
      [firstChapterId]: [firstStageId],
    },
    completed_stage_ids_by_chapter: {},
    current_chapter_id: firstChapterId,
    current_stage_id: firstStageId,
  }
}

async function getAuthenticatedUserId(request: Request) {
  const session = await verifyAppSession(request.headers.get('authorization'))
  return session.sub
}

async function ensureAllProgressRows(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('user_progress')
    .select(
      'id, user_id, difficulty, unlocked_chapter_ids, completed_chapter_ids, unlocked_stage_ids_by_chapter, completed_stage_ids_by_chapter, current_chapter_id, current_stage_id, updated_at',
    )
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to load user progress: ${error.message}`)
  }

  const existingRows = (data ?? []) as UserProgressRow[]
  const existingDifficultySet = new Set(existingRows.map((row) => row.difficulty))
  const missingDifficulties = DEFAULT_DIFFICULTIES.filter(
    (difficulty) => !existingDifficultySet.has(difficulty),
  )

  if (missingDifficulties.length > 0) {
    const { error: insertError } = await supabase
      .from('user_progress')
      .insert(missingDifficulties.map((difficulty) => createDefaultProgressRow(userId, difficulty)))

    if (insertError) {
      throw new Error(`Failed to create default progress rows: ${insertError.message}`)
    }

    const { data: reloadedRows, error: reloadError } = await supabase
      .from('user_progress')
      .select(
        'id, user_id, difficulty, unlocked_chapter_ids, completed_chapter_ids, unlocked_stage_ids_by_chapter, completed_stage_ids_by_chapter, current_chapter_id, current_stage_id, updated_at',
      )
      .eq('user_id', userId)

    if (reloadError) {
      throw new Error(`Failed to reload user progress: ${reloadError.message}`)
    }

    return (reloadedRows ?? []) as UserProgressRow[]
  }

  return existingRows
}

function normalizeProgressRow(row: UserProgressRow) {
  return {
    ...row,
    unlocked_chapter_ids: unique(toStringArray(row.unlocked_chapter_ids)),
    completed_chapter_ids: unique(toStringArray(row.completed_chapter_ids)),
    unlocked_stage_ids_by_chapter: toStringArrayMap(row.unlocked_stage_ids_by_chapter),
    completed_stage_ids_by_chapter: toStringArrayMap(row.completed_stage_ids_by_chapter),
  }
}

async function recordAuditEvent(params: {
  userId: string
  event: string
  metadata: Record<string, unknown>
}) {
  const supabase = getSupabaseAdmin()
  await supabase.from('auth_audit_logs').insert({
    user_id: params.userId,
    event: params.event,
    metadata: params.metadata,
  })
}

Deno.serve(async (request) => {
  const preflightResponse = handleCorsPreflightRequest(request)
  if (preflightResponse) {
    return preflightResponse
  }

  const url = new URL(request.url)

  try {
    const userId = await getAuthenticatedUserId(request)

    if (request.method === 'GET') {
      const rows = await ensureAllProgressRows(userId)

      return jsonSuccess({
        progress: rows.map((row) => normalizeProgressRow(row)),
      })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/stage-complete')) {
      const body = (await request.json()) as StageCompleteRequest

      if (!isDifficultyId(body.difficulty)) {
        return jsonError('difficulty is required', {
          status: 400,
          code: 'invalid_difficulty',
        })
      }

      if (typeof body.chapterId !== 'string' || body.chapterId.trim().length === 0) {
        return jsonError('chapterId is required', {
          status: 400,
          code: 'invalid_chapter_id',
        })
      }

      if (typeof body.stageId !== 'string' || body.stageId.trim().length === 0) {
        return jsonError('stageId is required', {
          status: 400,
          code: 'invalid_stage_id',
        })
      }

      const difficulty = body.difficulty
      const chapterId = body.chapterId.trim()
      const stageId = body.stageId.trim()
      const chapterOrder = parseChapterOrder(chapterId)
      const stageOrders = parseStageOrders(stageId)

      if (
        !chapterOrder ||
        !stageOrders ||
        stageOrders.chapterOrder !== chapterOrder ||
        chapterId !== buildChapterId(difficulty, chapterOrder) ||
        stageId !== buildStageId(difficulty, stageOrders.chapterOrder, stageOrders.stageOrder)
      ) {
        return jsonError('chapterId or stageId format is invalid', {
          status: 400,
          code: 'invalid_stage_reference',
        })
      }

      if (chapterOrder < 1 || chapterOrder > CHAPTER_COUNT) {
        return jsonError('chapterId is out of range', {
          status: 400,
          code: 'chapter_out_of_range',
        })
      }

      if (stageOrders.stageOrder < 1 || stageOrders.stageOrder > STAGE_COUNT) {
        return jsonError('stageId is out of range', {
          status: 400,
          code: 'stage_out_of_range',
        })
      }

      const rows = await ensureAllProgressRows(userId)
      const currentRow = rows.find((row) => row.difficulty === difficulty)

      if (!currentRow) {
        return jsonError('progress row not found', {
          status: 404,
          code: 'progress_not_found',
        })
      }

      const normalized = normalizeProgressRow(currentRow)

      if (!normalized.unlocked_chapter_ids.includes(chapterId)) {
        return jsonError('locked chapter cannot be completed', {
          status: 409,
          code: 'chapter_locked',
        })
      }

      const unlockedStageIds =
        normalized.unlocked_stage_ids_by_chapter[chapterId] ?? []

      if (!unlockedStageIds.includes(stageId)) {
        return jsonError('locked stage cannot be completed', {
          status: 409,
          code: 'stage_locked',
        })
      }

      const completedStageIds =
        normalized.completed_stage_ids_by_chapter[chapterId] ?? []
      const nextCompletedStageIds = unique([...completedStageIds, stageId])
      const nextUnlockedStageIds = unique([...unlockedStageIds, stageId])

      const nextStageOrder = stageOrders.stageOrder + 1
      if (nextStageOrder <= STAGE_COUNT) {
        nextUnlockedStageIds.push(
          buildStageId(difficulty, chapterOrder, nextStageOrder),
        )
      }

      const nextCompletedChapterIds = [...normalized.completed_chapter_ids]
      const nextUnlockedChapterIds = [...normalized.unlocked_chapter_ids]
      const nextUnlockedStageIdsByChapter = {
        ...normalized.unlocked_stage_ids_by_chapter,
        [chapterId]: unique(nextUnlockedStageIds),
      }
      const nextCompletedStageIdsByChapter = {
        ...normalized.completed_stage_ids_by_chapter,
        [chapterId]: nextCompletedStageIds,
      }

      let nextCurrentChapterId = chapterId
      let nextCurrentStageId =
        nextStageOrder <= STAGE_COUNT
          ? buildStageId(difficulty, chapterOrder, nextStageOrder)
          : stageId

      const isChapterCompleted = nextCompletedStageIds.length === STAGE_COUNT

      if (isChapterCompleted) {
        if (!nextCompletedChapterIds.includes(chapterId)) {
          nextCompletedChapterIds.push(chapterId)
        }

        const nextChapterOrder = chapterOrder + 1
        if (nextChapterOrder <= CHAPTER_COUNT) {
          const nextChapterId = buildChapterId(difficulty, nextChapterOrder)
          const nextChapterFirstStageId = buildStageId(
            difficulty,
            nextChapterOrder,
            1,
          )

          if (!nextUnlockedChapterIds.includes(nextChapterId)) {
            nextUnlockedChapterIds.push(nextChapterId)
          }

          nextUnlockedStageIdsByChapter[nextChapterId] = unique([
            ...(nextUnlockedStageIdsByChapter[nextChapterId] ?? []),
            nextChapterFirstStageId,
          ])
          nextCurrentChapterId = nextChapterId
          nextCurrentStageId = nextChapterFirstStageId
        }
      }

      const supabase = getSupabaseAdmin()
      const { data: updatedRow, error: updateError } = await supabase
        .from('user_progress')
        .update({
          unlocked_chapter_ids: unique(nextUnlockedChapterIds),
          completed_chapter_ids: unique(nextCompletedChapterIds),
          unlocked_stage_ids_by_chapter: nextUnlockedStageIdsByChapter,
          completed_stage_ids_by_chapter: nextCompletedStageIdsByChapter,
          current_chapter_id: nextCurrentChapterId,
          current_stage_id: nextCurrentStageId,
        })
        .eq('id', normalized.id)
        .select(
          'id, user_id, difficulty, unlocked_chapter_ids, completed_chapter_ids, unlocked_stage_ids_by_chapter, completed_stage_ids_by_chapter, current_chapter_id, current_stage_id, updated_at',
        )
        .single()

      if (updateError || !updatedRow) {
        throw new Error(`Failed to update progress row: ${updateError?.message ?? 'unknown error'}`)
      }

      return jsonSuccess({
        progress: normalizeProgressRow(updatedRow as UserProgressRow),
      })
    }

    if (request.method === 'POST' && url.pathname.endsWith('/stage-fail')) {
      const body = (await request.json()) as StageCompleteRequest

      await recordAuditEvent({
        userId,
        event: 'stage_fail',
        metadata: {
          difficulty: body.difficulty ?? null,
          chapterId: body.chapterId ?? null,
          stageId: body.stageId ?? null,
        },
      })

      return jsonSuccess({
        recorded: true,
      })
    }

    return jsonError('Not found', {
      status: 404,
      code: 'not_found',
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown progress function error'

    if (
      message.includes('Authorization') ||
      message.includes('session token') ||
      message.includes('signature')
    ) {
      return jsonError('인증이 필요해요.', {
        status: 401,
        code: 'unauthorized',
      })
    }

    return jsonError('progress 처리 중 오류가 발생했어요.', {
      status: 500,
      code: 'progress_internal_error',
      details: { message },
    })
  }
})
