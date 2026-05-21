import { describe, expect, it } from '@jest/globals'
import { buildStageSharePayload, buildTwitterIntentUrl, DEFAULT_SHARE_NICKNAME } from './share.utils'
import type { Chapter, Stage } from '../stage/stage.types'

const chapter: Chapter = {
  id: 'absolute_beginner_chapter_001',
  difficulty: 'absolute_beginner',
  order: 1,
  title: '기본 과일',
  description: '가장 쉬운 과일 단어부터 배워요.',
  stageIds: ['absolute-beginner.stage.003'],
  requiredChapterId: null,
}

const stage: Stage = {
  id: 'absolute-beginner.stage.003',
  difficulty: 'absolute_beginner',
  chapterId: 'absolute_beginner_chapter_001',
  order: 3,
  title: '포도 익히기',
  description: '포도 학습 목표를 10문제로 반복 학습한다',
  learningTarget: {
    id: 'absolute-beginner.target.fruit_grape',
    ko: '포도',
    en: 'grape',
    sentenceKo: '이것은 포도입니다',
    sentenceEn: 'This is a grape',
  },
  quizIds: [],
  requiredStageId: 'absolute-beginner.stage.002',
}

describe('share.utils', () => {
  it('builds current stage share text with nickname and stage label', () => {
    const payload = buildStageSharePayload({
      nickname: '포도러버',
      difficulty: 'absolute_beginner',
      chapter,
      stage,
      url: 'https://example.com/maraning',
    })

    expect(payload.nickname).toBe('포도러버')
    expect(payload.stageLabel).toBe('챕터1 : 3단계 포도 익히기')
    expect(payload.learningTargetLabel).toBe('포도 · grape')
    expect(payload.text).toContain('닉네임: 포도러버')
    expect(payload.text).toContain('현재 스테이지: 챕터1 : 3단계 포도 익히기')
  })

  it('falls back safely when there is no current stage', () => {
    const payload = buildStageSharePayload({
      difficulty: 'absolute_beginner',
    })

    expect(payload.nickname).toBe(DEFAULT_SHARE_NICKNAME)
    expect(payload.stageLabel).toBe('아직 진행 중인 스테이지가 없어요.')
    expect(payload.learningTargetLabel).toBeNull()
  })

  it('builds a twitter intent url with the encoded share text', () => {
    const payload = buildStageSharePayload({
      nickname: '포도러버',
      difficulty: 'absolute_beginner',
      chapter,
      stage,
      url: 'https://example.com/maraning',
    })

    expect(buildTwitterIntentUrl(payload)).toContain(
      'https://twitter.com/intent/tweet?text=',
    )
    expect(buildTwitterIntentUrl(payload)).toContain(
      encodeURIComponent(payload.text),
    )
  })
})
