# Stage Data Schema

## Purpose

- 이 스키마는 `Stage` 정의와 Stage 진행 상태 계산에 필요한 필드를 규정한다.
- 해금 규칙은 데이터 기반으로 해석 가능해야 한다.
- 기본 모델은 `linear progression` 과 `requiredStageId` 기반 해금이다.

## Schema

```json
{
  "$schema": "https://example.com/schemas/stage.schema.json",
  "id": "ab.stage.002",
  "difficulty": "absolute_beginner",
  "order": 2,
  "title": "사과 익히기",
  "description": "사과라는 단어와 기본 문장을 10문제로 반복 학습한다",
  "learningTarget": {
    "id": "lt.apple.basic",
    "ko": "사과",
    "en": "apple",
    "sentenceKo": "이것은 사과입니다",
    "sentenceEn": "This is an apple"
  },
  "quizIds": [
    "ab.quiz.011",
    "ab.quiz.012",
    "ab.quiz.013",
    "ab.quiz.014",
    "ab.quiz.015",
    "ab.quiz.016",
    "ab.quiz.017",
    "ab.quiz.018",
    "ab.quiz.019",
    "ab.quiz.020"
  ],
  "requiredStageId": "ab.stage.001"
}
```

## Fields

- `id`: Stage 고유 식별자다.
- `difficulty`: 이 Stage 가 속한 난이도다.
- `order`: 같은 난이도 StageMap 안에서의 순서다.
- `title`: 사용자에게 보여줄 Stage 이름이다.
- `description`: Stage 의 짧은 학습 설명이다.
- `learningTarget`: 이 Stage 가 반복 학습할 단일 목표다.
- `quizIds`: 이 Stage 에 포함된 `Quiz` 식별자 목록이다.
- `requiredStageId`: 현재 Stage 가 열리기 전에 완료되어야 하는 Stage 다.

## learningTarget Definition

- `learningTarget` 은 Stage 의 단일 학습 목표를 정의한다.
- 최소 필드는 다음을 포함한다.
  - `id`
  - `ko`
  - `en`
  - `sentenceKo`
  - `sentenceEn`
- 예시는 다음과 같다.

```json
{
  "id": "lt.apple.basic",
  "ko": "사과",
  "en": "apple",
  "sentenceKo": "이것은 사과입니다",
  "sentenceEn": "This is an apple"
}
```

## Quiz Count Policy

- 하나의 `Stage` 는 정확히 `10`개의 `quizIds` 를 가져야 한다.
- `quizIds` 는 비어 있을 수 없고 길이가 정확히 `10` 이어야 한다.
- `10`개의 `Quiz` 는 같은 `learningTarget` 을 반복 학습하는 데이터여야 한다.
- 하나의 `Stage` 안에서 여러 주제를 섞어서는 안 된다.

## Status Definition

- 허용 상태는 `locked`, `unlocked`, `completed` 세 가지다.
- `locked` 는 접근 불가 상태다.
- `unlocked` 는 진입 가능 상태다.
- `completed` 는 완료 및 replay 가능 상태다.

## Unlock Rule Definition

- `requiredStageId` 는 현재 Stage 가 열리기 전에 완료되어야 하는 Stage 를 가리킨다.
- 첫 번째 Stage 는 예외적으로 `requiredStageId` 가 `null` 일 수 있다.
- `requiredStageId` 가 충족되면 `next stage unlock` 이 발생한다.

## Validation Rules

- `id` 는 같은 난이도 트랙 안에서 유일해야 한다.
- `difficulty` 는 상위 난이도 JSON 의 `difficulty` 와 일치해야 한다.
- `order` 는 양의 정수이며 중복되면 안 된다.
- `title` 과 `description` 은 비어 있을 수 없다.
- `learningTarget.id` 는 같은 난이도 데이터셋 안에서 참조 가능해야 한다.
- `learningTarget.ko`, `learningTarget.en`, `learningTarget.sentenceKo`, `learningTarget.sentenceEn` 은 비어 있을 수 없다.
- `quizIds` 길이는 정확히 `10` 이어야 한다.
- `requiredStageId` 가 존재하면 같은 난이도 트랙 안의 유효한 `id` 여야 한다.
- `requiredStageId` 가 자기 자신을 가리키면 안 된다.
- `order` 가 더 큰 Stage 는 자신보다 뒤 순서의 Stage 를 `requiredStageId` 로 가질 수 없다.
- 같은 Stage 의 모든 `quizIds` 는 동일한 `stageId` 와 동일한 `learningTargetId` 또는 `targetKey` 를 참조해야 한다.
- 하나의 Stage 안에서는 난이도 일관성을 유지해야 하므로 해당 `Quiz` 들은 모두 같은 `difficulty` 를 가져야 한다.

## Progress Mapping

- Stage 상태 계산은 난이도별 `Progress` 와 연결된다.
- `locked` 여부는 `requiredStageId` 완료 여부로 계산한다.
- `completed` Stage 는 재진입 가능하지만 해금 계산상 여전히 완료 상태로 유지한다.
- 다른 난이도의 Progress 는 현재 Stage 상태 계산에 사용하지 않는다.

## Versioning

- 상태 집합이나 `unlockRule` 의미가 바뀌면 스키마 버전을 올린다.
- `requiredStageId` 정책 변경 시 Stage 데이터와 진행도 계산 문서를 함께 수정한다.
