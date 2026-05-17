# Difficulty Policy

## Difficulty Tiers

- 지원 난이도는 `absolute_beginner`, `beginner`, `intermediate`, `advanced`, `conversation`, `toeic` 이다.
- 각 난이도는 별도의 학습 목적과 별도의 StageMap 을 가진다.
- 난이도는 단순 레이블이 아니라 독립 진행 단위다.

## Track Separation

- 각 난이도는 독립적인 `DifficultyTrack` 으로 운영한다.
- 각 `DifficultyTrack` 은 전용 JSON 데이터로 정의한다.
- 난이도별 `Stage` 목록은 서로 공유하지 않는다.
- 난이도별 `Progress` 는 서로 참조하거나 병합하지 않는다.

## Progress Isolation Rules

- 사용자는 난이도마다 별도의 진행도를 가진다.
- 한 난이도의 완료 여부가 다른 난이도의 현재 위치를 자동 변경하지 않는다.
- 난이도 전환은 허용하지만, 진행 상태 이전은 허용하지 않는다.
- 난이도별 잠금 해제 상태는 해당 난이도 안에서만 계산한다.

## Shared Resource Rules

- `Jelly` 는 모든 난이도가 공통으로 사용하는 전역 자원이다.
- 사용자는 하루 기준 `20`개의 `Jelly` 를 가진다.
- 어떤 난이도의 `Stage` 든 입장할 때 `Jelly` `1`개를 소모한다.
- `Jelly` 부족 시 난이도와 무관하게 새 `Stage` 진입은 막힌다.

## Balancing Constraints

- `absolute_beginner` 는 가장 낮은 진입 장벽을 가져야 한다.
- `beginner` 와 `intermediate` 는 문항 구조를 유지하면서 인지 부담을 점진적으로 높인다.
- `advanced` 는 더 긴 문맥과 더 높은 정확도를 요구한다.
- `conversation` 은 실제 표현 흐름 중심으로 구성한다.
- `toeic` 은 시험형 문항 감각을 유지하되, MVP 문제 타입 안에서만 다룬다.
- 어떤 난이도도 LLM 판정에 의존하지 않는다.

## Data Policy

- 난이도 데이터는 난이도별 JSON 로 분리한다.
- 각 JSON 은 하나의 `DifficultyTrack` 만 정의한다.
- `Difficulty`, `Stage`, `Quiz` 식별자는 JSON 안에서 명확해야 한다.
- 데이터 구조는 결정론적 판정에 필요한 정보만 포함해야 한다.

## Open Questions

- 난이도 간 추천 순서를 UI 에서 강제할지 여부.
- `conversation` 과 `toeic` 의 초반 Stage 길이를 동일하게 맞출지 여부.
