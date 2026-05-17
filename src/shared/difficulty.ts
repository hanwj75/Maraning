export const difficultyOptions = [
  { id: 'absolute_beginner', label: '왕초보', shortDescription: '기초 단어부터 차근차근' },
  { id: 'beginner', label: '초보', shortDescription: '쉬운 문장에 익숙해지기' },
  { id: 'intermediate', label: '중수', shortDescription: '표현 연결 연습하기' },
  { id: 'advanced', label: '고수', shortDescription: '긴 문장도 자신 있게' },
  { id: 'conversation', label: '회화', shortDescription: '실전 말하기 감각 올리기' },
  { id: 'toeic', label: '토익', shortDescription: '문항 감각 가볍게 워밍업' },
] as const

export const difficultyLabelMap = Object.fromEntries(
  difficultyOptions.map((option) => [option.id, option.label]),
) as Record<(typeof difficultyOptions)[number]['id'], string>
