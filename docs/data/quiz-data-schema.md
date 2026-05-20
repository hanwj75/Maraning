# Quiz Data Schema

## Purpose

- 이 스키마는 `Quiz` 데이터 구조와 validator 가 필요로 하는 필드를 정의한다.
- 지원 문제 타입은 `image_select`, `matching`, `word_order`, `blank_fill` 이다.
- `typing` 은 MVP 에서 비활성 상태이므로 포함하지 않는다.

## Base Schema

```json
{
  "$schema": "https://example.com/schemas/quiz.schema.json",
  "quizId": "ab.quiz.001",
  "difficulty": "absolute_beginner",
  "stageId": "ab.stage.001",
  "learningTargetId": "lt.apple.basic",
  "targetKey": "apple_basic",
  "quizType": "image_select",
  "question": "\"사과\"는 영어로 무엇일까요?",
  "prompt": "\"사과\"는 영어로 무엇일까요?",
  "validation": {
    "mode": "deterministic",
    "caseInsensitive": true
  },
  "content": {},
  "answer": {}
}
```

## Common Fields

- `quizId`: 퀴즈 고유 식별자다.
- `difficulty`: 퀴즈가 속한 난이도다.
- `stageId`: 퀴즈가 속한 `Stage` 식별자다.
- `Chapter` 는 `Stage` 를 통해 간접 참조되며, 필요 시 `chapterId` 를 추가할 수 있지만 현재 로딩 기준은 `stageId` 다.
- `learningTargetId`: Stage 의 학습 목표 식별자다.
- `targetKey`: 학습 목표를 간단히 참조하는 키다.
- `quizType`: 문제 타입이다.
- `question`: 사용자에게 먼저 보여줄 질문 문구다.
- `prompt`: 문제 본문 또는 보조 문장이다.
- `validation`: 판정 규칙 메타데이터다.
- `content`: 화면 렌더링용 문제 데이터다.
- `answer`: 결정론적 판정용 정답 데이터다.
- `choices`: 선택지가 있는 문제에서 사용하는 보기 목록이다.

## Stage Learning Target Link

- 모든 `Quiz` 는 반드시 `stageId` 와 함께 `learningTargetId` 또는 `targetKey` 로 Stage 목표와 연결되어야 한다.
- 한 `Stage` 안의 `10`문제는 모두 같은 `learningTargetId` 또는 같은 의미의 `targetKey` 를 가져야 한다.
- `Quiz` 단위에서 다른 목표를 가리키면 해당 Stage 데이터는 잘못된 것으로 간주한다.
- 이 연결은 같은 목표를 여러 문제 형식으로 반복 학습하기 위한 핵심 참조다.

## Stage Quiz Count Policy

- Stage 하나는 정확히 `10`개의 `Quiz` 로 구성된다.
- `Stage` 는 반드시 하나의 `Chapter` 에 속하고, `Quiz` 는 그 `Stage` 를 따라 같은 `Chapter` 컨텍스트 안에서 사용된다.
- `Quiz` 스키마는 단건 구조를 정의하지만, Stage 레벨에서 정확히 `10`개가 묶여야 한다.
- 그 `10`개는 같은 목표를 반복해야 하며, 여러 주제를 섞어서는 안 된다.

## Validation Object

- `validation.mode` 는 항상 `deterministic` 이어야 한다.
- `validation.caseInsensitive` 는 대소문자 무시 허용 여부를 나타낸다.
- `validation` 은 LLM, semantic, fuzzy 같은 모드를 허용하지 않는다.
- 문자열 입력 비교 시 앞뒤 공백 제거와 동일한 대소문자 정규화를 양쪽에 적용한다.

## Type Schemas

### image_select

```json
{
  "quizType": "image_select",
  "question": "\"사과\"는 영어로 무엇일까요?",
  "prompt": "\"사과\"는 영어로 무엇일까요?",
  "content": {
    "options": [
      { "id": "a", "label": "apple", "imageUrl": "/images/apple.png" },
      { "id": "b", "label": "orange", "imageUrl": "/images/orange.png" },
      { "id": "c", "label": "cat", "imageUrl": "/images/cat.png" },
      { "id": "d", "label": "book", "imageUrl": "/images/book.png" }
    ]
  },
  "answer": {
    "correctOptionId": "a"
  }
}
```

### matching

```json
{
  "quizType": "matching",
  "question": "영어 단어와 한국어 뜻을 연결해 주세요.",
  "content": {
    "leftItems": [
      { "id": "l1", "text": "apple" },
      { "id": "l2", "text": "cat" },
      { "id": "l3", "text": "dog" }
    ],
    "rightItems": [
      { "id": "r1", "text": "사과" },
      { "id": "r2", "text": "고양이" },
      { "id": "r3", "text": "강아지" }
    ]
  },
  "answer": {
    "pairs": [
      { "leftId": "l1", "rightId": "r1" },
      { "leftId": "l2", "rightId": "r2" },
      { "leftId": "l3", "rightId": "r3" }
    ]
  }
}
```

### word_order

```json
{
  "quizType": "word_order",
  "question": "단어를 올바른 순서로 배열해 주세요.",
  "learningTargetId": "lt.apple.basic",
  "validation": {
    "mode": "deterministic",
    "caseInsensitive": true
  },
  "content": {
    "tokens": ["This", "is", "an", "apple"]
  },
  "answer": {
    "orderedTokens": ["This", "is", "an", "apple"]
  }
}
```

### blank_fill

```json
{
  "quizType": "blank_fill",
  "question": "빈칸에 알맞은 영어 단어를 넣어 문장을 완성해 주세요.",
  "learningTargetId": "lt.apple.basic",
  "validation": {
    "mode": "deterministic",
    "caseInsensitive": true
  },
  "content": {
    "template": "This is an ___."
  },
  "choices": [
    "apple",
    "cat",
    "dog",
    "book"
  ],
  "answer": {
    "acceptedAnswers": ["apple"]
  }
}
```

## Validator Rules

- 모든 `Quiz` 는 `validation.mode = deterministic` 이어야 한다.
- 정답 판정은 `answer` 객체에 정의된 데이터만 사용해야 한다.
- `LLM validation` 은 허용하지 않는다.
- `quizType` 별 필수 필드가 모두 존재해야 한다.
- `caseInsensitive = true` 인 경우 입력과 정답에 동일한 대소문자 정규화를 적용한다.
- `caseInsensitive = false` 인 경우 원문 기준으로 비교한다.
- 의미 유사도, 오타 허용, 자유 해석 판정은 허용하지 않는다.
- 한 `Stage` 안의 `Quiz` 들은 모두 같은 학습 목표를 반복해야 한다.
- `Quiz` 는 자기 `stageId` 가 가리키는 `Stage.learningTarget` 과 무관한 답안을 가져서는 안 된다.
- `question` 은 비어 있을 수 없고, Stage 설명을 그대로 재사용하면 안 된다.
- `image_select` 와 선택형 `blank_fill` 은 선택지 `4~6`개를 가져야 한다.
- `word_order` 의 token 목록은 선택지 개수 규칙에서 제외한다.
- `matching` 은 최소 `3`쌍의 pair 를 가져야 하며 왼쪽은 영어, 오른쪽은 한국어여야 한다.
- `blank_fill` 의 영어 문장 템플릿과 영어 선택지 규칙을 깨면 안 된다.
- 문제와 보기 모두 한국어만 있는 조합은 금지한다.

## Validation Rules

- `quizId` 는 전체 데이터셋에서 유일해야 한다.
- `difficulty` 는 상위 난이도 트랙과 일치해야 한다.
- `stageId` 는 같은 난이도 안의 유효한 Stage 를 가리켜야 한다.
- `learningTargetId` 또는 `targetKey` 는 `stageId` 가 가리키는 Stage 목표와 일치해야 한다.
- `quizType` 은 `image_select`, `matching`, `word_order`, `blank_fill` 중 하나여야 한다.
- `typing` 은 허용 값에 포함하지 않는다.
- `question` 과 `prompt` 는 비어 있을 수 없다.
- `image_select.answer.correctOptionId` 는 `content.options.id` 중 하나여야 한다.
- `matching.answer.pairs` 는 좌우 항목 id 만 참조해야 하며 중복 pair 를 허용하지 않는다.
- `matching.answer.pairs.length` 는 최소 `3`이어야 한다.
- `word_order.answer.orderedTokens` 길이는 `content.tokens` 길이와 일치해야 한다.
- `blank_fill.answer.acceptedAnswers` 는 비어 있을 수 없다.
- `image_select.choices.length` 와 선택형 `blank_fill.choices.length` 는 `4~6` 범위여야 한다.
- `blank_fill.prompt` 는 영어 문장이어야 한다.
- `blank_fill.choices` 는 영어 보기여야 한다.
- 같은 Stage 의 `10`개 `Quiz` 는 모두 동일한 `difficulty` 를 유지해야 한다.
- 같은 Stage 의 `10`개 `Quiz` 는 모두 동일한 `learningTargetId` 또는 동일 의미의 `targetKey` 를 가져야 한다.

## Versioning

- 문제 타입 추가나 판정 의미 변경 시 스키마 버전을 올린다.
- `validation` 구조 변경 시 퀴즈 엔진 문서와 함께 수정한다.
