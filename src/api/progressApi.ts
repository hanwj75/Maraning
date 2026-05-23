import type { DifficultyKey } from '../data/difficulties'
import { ApiClientError, apiRequest } from './client'

export type ServerDifficultyProgress = {
  id: string
  user_id: string
  difficulty: DifficultyKey
  unlocked_chapter_ids: string[]
  completed_chapter_ids: string[]
  unlocked_stage_ids_by_chapter: Record<string, string[]>
  completed_stage_ids_by_chapter: Record<string, string[]>
  current_chapter_id: string | null
  current_stage_id: string | null
  updated_at: string
}

export class ProgressApiError extends ApiClientError {}

type StageCompletePayload = {
  difficulty: DifficultyKey
  chapterId: string
  stageId: string
}

function normalizeProgressList(value: ServerDifficultyProgress[] | ServerDifficultyProgress) {
  return Array.isArray(value) ? value : [value]
}

export async function fetchProgress(): Promise<{ progress: ServerDifficultyProgress[] }> {
  let data: { progress: ServerDifficultyProgress[] | ServerDifficultyProgress }

  try {
    data = await apiRequest<{
      progress: ServerDifficultyProgress[] | ServerDifficultyProgress
    }>({ path: '/progress', method: 'GET' }, '진행 정보를 불러오지 못했어요.')
  } catch (error) {
    throw error instanceof ApiClientError
      ? new ProgressApiError(error.message, {
          code: error.code,
          status: error.status,
          details: error.details,
        })
      : error
  }

  return { progress: normalizeProgressList(data.progress) }
}

export async function completeStageProgress(payload: StageCompletePayload): Promise<{
  progress: ServerDifficultyProgress
}> {
  let data: { progress: ServerDifficultyProgress[] | ServerDifficultyProgress }

  try {
    data = await apiRequest<{
      progress: ServerDifficultyProgress[] | ServerDifficultyProgress
    }>(
      { path: '/progress/stage-complete', method: 'POST', body: payload },
      '스테이지 진행도를 저장하지 못했어요.',
    )
  } catch (error) {
    throw error instanceof ApiClientError
      ? new ProgressApiError(error.message, {
          code: error.code,
          status: error.status,
          details: error.details,
        })
      : error
  }

  return { progress: normalizeProgressList(data.progress)[0] }
}
