# Domain Model

## Core Entities

### Difficulty

- `Difficulty` 는 학습 난이도 구분 단위다.
- 지원 값은 `absolute_beginner`, `beginner`, `intermediate`, `advanced`, `conversation`, `toeic` 이다.
- 각 `Difficulty` 는 독립적인 StageMap 과 독립적인 진행 상태를 가진다.

### DifficultyTrack

- `DifficultyTrack` 은 특정 `Difficulty` 에 속한 학습 트랙 전체를 뜻한다.
- 하나의 `DifficultyTrack` 은 해당 난이도 전용 `Stage` 집합, 진행 규칙, 잠금 해제 순서를 가진다.
- `DifficultyTrack` 간 진행도는 서로 섞이지 않는다.

### Stage

- `Stage` 는 하나의 난이도 트랙 안에서 진입 가능한 학습 단위다.
- `Stage` 는 하나 이상의 `Quiz` 집합으로 구성된다.
- `Stage` 입장 시 전역 자원인 `Jelly` 를 `1` 소모한다.

### Quiz

- `Quiz` 는 사용자가 실제로 푸는 문제 단위다.
- 문제 타입은 `image_select`, `matching`, `word_order`, `blank_fill` 이다.
- 정답 판정은 항상 결정론적으로 처리된다.

### Jelly

- `Jelly` 는 전체 앱에서 공통으로 사용하는 체력 자원이다.
- `Jelly` 는 난이도별로 분리되지 않는다.
- 사용자는 하루 기준 `20`개의 `Jelly` 를 가진다.
- `Stage` 진입 시마다 `Jelly` `1`개를 소모한다.

### Progress

- `Progress` 는 사용자의 학습 진행 상태를 표현한다.
- `Progress` 는 난이도별로 분리되어 저장된다.
- 각 `DifficultyTrack` 은 자신의 `Progress` 만 읽고 갱신한다.
- 전역 `Jelly` 상태는 `Progress` 와 구분된 공통 자원 상태로 다룬다.

## Relationships

- 하나의 `Difficulty` 는 하나의 `DifficultyTrack` 과 연결된다.
- 하나의 `DifficultyTrack` 은 여러 `Stage` 를 가진다.
- 하나의 `Stage` 는 여러 `Quiz` 를 가진다.
- 하나의 사용자 상태는 여러 난이도별 `Progress` 를 가진다.
- 하나의 사용자 상태는 하나의 전역 `Jelly` 자원을 가진다.
- `Progress` 는 특정 `DifficultyTrack` 의 열린 `Stage`, 완료 `Stage`, 현재 위치를 추적한다.

## Aggregates

### Difficulty Progress Aggregate

- 루트는 `DifficultyTrack` 이다.
- 내부에는 해당 난이도의 `Stage` 목록과 그 난이도 전용 `Progress` 가 포함된다.
- 다른 난이도의 `Progress` 는 같은 aggregate 안에 포함되지 않는다.

### Session Resource Aggregate

- 루트는 `Jelly` 이다.
- `Jelly` 는 전역 자원이므로 모든 `DifficultyTrack` 이 참조할 수 있다.
- 단, `Jelly` 소모는 `Stage` 진입 규칙으로만 발생한다.

## Progress Isolation

- `absolute_beginner` 진행도는 `beginner` 진행도에 영향을 주지 않는다.
- `toeic` 진행도는 `conversation` 진행도와 분리된다.
- 어떤 난이도에서 `Stage` 를 완료해도 다른 난이도의 잠금 해제 상태는 바뀌지 않는다.
- 공통 자원은 `Jelly` 뿐이며, 진행 상태는 난이도별로 완전히 독립이다.

## Open Questions

- 난이도 변경 시 마지막 방문 `Stage` 를 저장할지 여부.
- `Jelly` 일일 리필 시점의 시간대 기준.
