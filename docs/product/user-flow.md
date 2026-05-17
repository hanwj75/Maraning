# User Flow

## Entry Points

- 사용자는 Appintos 안에서 영어 학습 기능으로 진입한다.
- 첫 진입 화면은 `Home` 이다.
- `Home` 에서는 학습 시작과 현재 학습 분위기를 빠르게 이해할 수 있어야 한다.

## Core Journey

### Home

- 사용자는 학습 시작 진입점을 본다.
- 귀여운 캐릭터와 현재 학습 상태가 가볍게 노출된다.
- 다음 단계는 `DifficultySelect` 이다.

### DifficultySelect

- 사용자는 `absolute_beginner`, `beginner`, `intermediate`, `advanced`, `conversation`, `toeic` 중 하나를 선택한다.
- 선택 후 해당 난이도의 독립 StageMap 으로 이동한다.

### StageMap

- 사용자는 현재 난이도에서 열려 있는 Stage 를 확인한다.
- Stage 입장 전 `jelly` 보유 상태를 확인한다.
- Stage 입장 시 `jelly` `1`개를 차감하고 `Quiz` 로 이동한다.

### Quiz

- 사용자는 짧은 문제 묶음을 푼다.
- 문제는 `image_select`, `matching`, `word_order`, `blank_fill` 로 구성된다.
- 정답 판정은 결정론적 규칙으로 즉시 처리된다.
- 진행 중에는 귀여운 피드백이 학습 긴장을 완화한다.

### Reward

- 사용자는 Stage 결과와 보상을 확인한다.
- 캐릭터 피드백을 통해 성취감을 받는다.
- 다음 선택지는 같은 난이도의 `StageMap` 복귀 또는 다음 학습 루프 진입이다.

## Resource Rules

- `jelly` 는 하루 `20`개를 기본으로 제공한다.
- Stage 입장 시마다 `jelly` `1`개를 소모한다.
- `jelly` 가 없으면 Stage 진입은 막고, 사용자는 `StageMap` 또는 안내 상태에 머문다.

## Failure Paths

- 사용자가 난이도를 선택하지 않으면 Quiz 로 진입하지 않는다.
- `jelly` 가 부족하면 Stage 시작이 거부된다.
- 정답이 틀려도 판정은 즉시 끝나며, 애매한 해석은 허용하지 않는다.
- 플랫폼 연동 이슈가 있더라도 핵심 학습 루프의 구조는 단순하게 유지한다.

## Completion Paths

- 정상 완료 시 `Reward` 에서 결과를 확인하고 동일 난이도 `StageMap` 으로 돌아간다.
- 사용자는 같은 난이도에서 다음 Stage 를 선택하거나, 다시 난이도를 선택해 새 루프를 시작할 수 있다.
- 전체 흐름은 항상 `Home -> DifficultySelect -> StageMap -> Quiz -> Reward` 축을 유지한다.
