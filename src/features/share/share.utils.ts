import type { DifficultyKey } from '../../data/difficulties'
import { difficultyLabelMap } from '../../shared/difficulty'
import type { Chapter, Stage } from '../stage/stage.types'
import type { SharePlatform, StageSharePayload } from './share.types'

export const DEFAULT_SHARE_NICKNAME = '말랑이 친구'

export function buildStageSharePayload(params: {
  nickname?: string | null
  difficulty: DifficultyKey
  chapter?: Chapter
  stage?: Stage
  url?: string
}): StageSharePayload {
  const nickname = params.nickname?.trim() || DEFAULT_SHARE_NICKNAME
  const difficultyLabel = difficultyLabelMap[params.difficulty]
  const title = '현재 스테이지 공유하기'
  const introText = `${nickname}님이 말랑이와 영어 공부 중이에요!`
  const url = params.url ?? ''

  if (!params.chapter || !params.stage) {
    const stageLabel = '아직 진행 중인 스테이지가 없어요.'
    return {
      nickname,
      difficulty: params.difficulty,
      difficultyLabel,
      title,
      introText,
      stageLabel,
      learningTargetLabel: null,
      text: `${introText}\n현재 난이도: ${difficultyLabel}\n현재 스테이지: ${stageLabel}`,
      url,
    }
  }

  const stageLabel = `챕터${params.chapter.order} : ${params.stage.order}단계 ${params.stage.title}`
  const learningTargetLabel = `${params.stage.learningTarget.ko} · ${params.stage.learningTarget.en}`

  return {
    nickname,
    difficulty: params.difficulty,
    difficultyLabel,
    title,
    introText,
    stageLabel,
    learningTargetLabel,
    text: [
      '말랑이와 함께 영어 공부 중!',
      `닉네임: ${nickname}`,
      `현재 난이도: ${difficultyLabel}`,
      `현재 스테이지: ${stageLabel}`,
      `현재 학습 목표: ${learningTargetLabel}`,
    ].join('\n'),
    url,
  }
}

export function buildTwitterIntentUrl(payload: StageSharePayload): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(payload.text)}${payload.url ? `&url=${encodeURIComponent(payload.url)}` : ''}`
}

async function copyShareText(payload: StageSharePayload): Promise<void> {
  const shareBody = payload.url ? `${payload.text}\n${payload.url}` : payload.text
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareBody)
    return
  }

  throw new Error('clipboard-unavailable')
}

export async function shareStageToPlatform(params: {
  platform: SharePlatform
  payload: StageSharePayload
}): Promise<string> {
  const { platform, payload } = params

  if (platform === 'twitter' && typeof window !== 'undefined') {
    const popup = window.open(
      buildTwitterIntentUrl(payload),
      '_blank',
      'noopener,noreferrer',
    )

    if (popup) {
      return '트위터 공유 화면을 열었어요!'
    }
  }

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  ) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url || undefined,
      })

      return '공유 창을 열었어요!'
    } catch {
      // fall through to clipboard fallback
    }
  }

  await copyShareText(payload)

  if (platform === 'instagram') {
    return '공유 문구를 복사했어요! 인스타그램에 붙여넣어 공유해 주세요.'
  }

  if (platform === 'kakao') {
    return '공유 문구를 복사했어요! 카카오톡에 붙여넣어 공유해 주세요.'
  }

  return '공유 문구를 복사했어요!'
}
