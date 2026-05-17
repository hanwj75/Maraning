# Difficulty Data Schema

## Purpose

- 이 스키마는 난이도별 JSON 구조를 정의한다.
- 하나의 JSON 파일은 하나의 `DifficultyTrack` 만 표현한다.
- 난이도별 진행 분리를 데이터 구조에서 강제한다.

## File Model

- 권장 구조는 난이도당 하나의 JSON 파일이다.
- 예시 파일 단위는 `absolute_beginner.json`, `beginner.json`, `intermediate.json`, `advanced.json`, `conversation.json`, `toeic.json` 이다.
- 공통 `Jelly` 는 난이도 JSON 안에 저장하지 않는다.

## Schema

```json
{
  "$schema": "https://example.com/schemas/difficulty-track.schema.json",
  "difficulty": "absolute_beginner",
  "trackId": "difficulty.absolute_beginner",
  "displayName": "Absolute Beginner",
  "version": 1,
  "stages": [
    {
      "stageId": "ab.stage.001",
      "order": 1,
      "title": "Stage Title",
      "quizIds": [
        "ab.quiz.001",
        "ab.quiz.002"
      ],
      "unlockRule": {
        "type": "sequential",
        "requiresStageId": null
      }
    }
  ]
}
```

## Fields

- `difficulty`: 지원 난이도 값 중 하나여야 한다.
- `trackId`: 해당 난이도 트랙의 고유 식별자다.
- `displayName`: UI 표시에 쓰는 이름이다.
- `version`: 데이터 버전이다.
- `stages`: 해당 난이도 전용 `Stage` 배열이다.
- `stageId`: `Stage` 고유 식별자다.
- `order`: StageMap 내 순서다.
- `title`: 사용자에게 보여줄 스테이지 이름이다.
- `quizIds`: 이 `Stage` 에 속한 `Quiz` 식별자 목록이다.
- `unlockRule`: 해당 `Stage` 의 잠금 해제 규칙이다.

## Validation Rules

- `difficulty` 는 `absolute_beginner`, `beginner`, `intermediate`, `advanced`, `conversation`, `toeic` 중 하나여야 한다.
- 하나의 JSON 파일에는 하나의 `difficulty` 값만 존재해야 한다.
- `trackId` 는 `difficulty` 와 일치하는 의미를 가져야 한다.
- `stages` 안의 `stageId` 는 해당 파일 안에서 유일해야 한다.
- `order` 는 양의 정수이며 중복되면 안 된다.
- `quizIds` 는 비어 있을 수 없다.
- `unlockRule.requiresStageId` 가 존재하면 같은 난이도 JSON 안의 `stageId` 를 가리켜야 한다.
- 다른 난이도의 `Stage` 나 `Quiz` 를 직접 참조하면 안 된다.

## Progress Mapping

- `Progress` 데이터는 난이도별로 `trackId` 에 매핑된다.
- 하나의 `Progress` 레코드는 하나의 `DifficultyTrack` 에만 연결된다.
- 다른 난이도 진행도와 공유 필드를 두지 않는다.
- 전역 `Jelly` 상태는 별도 저장소 또는 별도 상태 구조에서 관리한다.

## Versioning

- `version` 증가 없이 의미가 바뀌는 필드 수정은 허용하지 않는다.
- 난이도 구조 변경 시 관련 `Progress` 매핑 규칙도 함께 검토한다.
- 새 난이도 추가 시 기존 난이도 JSON 과 독립 파일로 추가한다.
