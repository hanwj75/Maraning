# Chapter Data Schema

## Purpose

- 이 스키마는 `Chapter` 정의와 Chapter 진행 상태 계산에 필요한 필드를 규정한다.
- `Chapter = 큰 스테이지`, `Stage = Chapter 내부의 작은 스테이지`, `Quiz = Stage 내부 문제` 용어를 고정한다.
- 최종 목표 구조는 난이도별 `10 Chapter × 10 Stage × 10 Quiz` 다.
- 현재 seed 데이터는 최소 개수만 유지할 수 있지만 타입과 진행 규칙은 최종 구조를 기준으로 작성한다.

## Schema

```json
{
  "$schema": "https://example.com/schemas/chapter.schema.json",
  "id": "absolute_beginner_chapter_001",
  "difficulty": "absolute_beginner",
  "order": 1,
  "title": "기본 단어 배우기",
  "description": "가장 쉬운 단어부터 시작해요.",
  "stageIds": [
    "absolute-beginner.stage.001",
    "absolute-beginner.stage.002"
  ],
  "requiredChapterId": null
}
```

## Fields

- `id`: Chapter 고유 식별자다.
- `difficulty`: 이 Chapter 가 속한 난이도다.
- `order`: 같은 난이도 `ChapterMap` 안에서의 순서다.
- `title`: 사용자에게 보여줄 큰 스테이지 이름이다.
- `description`: Chapter 의 짧은 학습 설명이다.
- `stageIds`: 이 Chapter 에 포함된 작은 스테이지 목록이다.
- `requiredChapterId`: 현재 Chapter 가 열리기 전에 완료되어야 하는 이전 Chapter 다.

## Validation Rules

- `id` 는 같은 난이도 안에서 유일해야 한다.
- `difficulty` 는 상위 난이도 JSON 과 일치해야 한다.
- `order` 는 양의 정수이며 중복되면 안 된다.
- `title` 과 `description` 은 비어 있을 수 없다.
- `stageIds` 는 현재 난이도 안의 유효한 `Stage.id` 만 가져야 한다.
- `stageIds` 안의 각 `Stage.chapterId` 는 현재 `Chapter.id` 와 같아야 한다.
- `requiredChapterId` 가 존재하면 같은 난이도 안의 유효한 `Chapter.id` 여야 한다.
- 첫 번째 Chapter 는 `requiredChapterId = null` 일 수 있다.

## Progress Mapping

- 첫 번째 Chapter 는 기본 `unlocked` 상태다.
- 현재 Chapter 안의 모든 Stage 가 `completed` 되면 Chapter 도 `completed` 된다.
- Chapter 완료 후 다음 `requiredChapterId` 대상 Chapter 가 `unlocked` 된다.
- `locked Chapter` 는 접근할 수 없다.
