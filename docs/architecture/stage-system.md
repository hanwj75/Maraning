# Stage System

## Stage Structure

- `Chapter` 는 큰 스테이지고, `Stage` 는 `Chapter` 내부의 작은 스테이지다.
- 각 난이도는 최종 목표 기준 `10`개의 `Chapter` 를 가진다.
- 각 `Chapter` 는 최종 목표 기준 `10`개의 `Stage` 를 가진다.
- 각 `Stage` 는 고유한 `id`, `chapterId`, 표시 순서, 제목, 설명, `learningTarget`, `Quiz` 집합, 잠금 해제 규칙을 가진다.
- `Chapter` 와 `Stage` 는 난이도별 JSON 안에서 정의되며 다른 난이도 트랙과 공유되지 않는다.
- 하나의 `Stage` 는 정확히 하나의 학습 목표만 가진다.
- 하나의 `Stage` 는 정확히 `10`개의 `Quiz` 로 구성된다.
- 한 `Stage` 안의 `10`문제는 서로 다른 주제로 흩어지지 않고 같은 학습 목표를 반복 학습해야 한다.

## Learning Target Policy

- `Stage` 하나는 하나의 학습 목표를 가진다.
- 학습 목표는 단어 또는 문장 단위로 정의할 수 있다.
- 예시는 다음과 같다.
  - `apple = 사과`
  - `This is an apple = 이것은 사과입니다`
  - `I am a student = 나는 학생입니다`
- 한 `Stage` 안의 모든 `Quiz` 는 이 단일 학습 목표와 연결되어야 한다.
- `learningTarget` 은 최소한 한국어 표현, 영어 표현, 확장 문장 예시를 포함해야 한다.

## Repetition Policy

- `Stage` 는 정확히 `10`개의 문제를 가진다.
- `10`개의 문제는 같은 학습 목표를 여러 문제 형식으로 반복 학습시키는 구성이어야 한다.
- 같은 `Stage` 안에서는 `image_select`, `matching`, `word_order`, `blank_fill` 를 조합할 수 있다.
- 문제 형식이 달라도 학습 목표는 유지되어야 한다.
- 예를 들어 `apple` Stage 에서 갑자기 `banana` 나 다른 문장 목표가 섞이면 안 된다.
- 반복 학습은 같은 목표를 인지, 연결, 배열, 빈칸 채우기 방식으로 다시 확인하는 구조를 뜻한다.

## Difficulty Consistency

- 하나의 `Stage` 안에서는 난이도 일관성을 유지해야 한다.
- `absolute_beginner` Stage 에서는 단어 수준 또는 매우 짧은 문장 수준을 유지한다.
- 같은 `Stage` 안에서 갑자기 더 높은 난이도의 어휘나 문장 구조를 섞지 않는다.
- `Quiz` 난이도는 `Stage.difficulty` 에 종속되며 별도로 이탈할 수 없다.

## Stage States

### locked

- `locked` 상태의 `Stage` 는 아직 진입 조건을 만족하지 못한 상태다.
- 사용자는 `locked` Stage 에 접근할 수 없다.
- UI 에서는 존재를 보여줄 수 있지만 시작은 불가해야 한다.

### unlocked

- `unlocked` 상태의 `Stage` 는 현재 진입 가능한 상태다.
- 사용자는 해당 Stage 에 입장할 수 있고, `Jelly` 는 문제 제출 시 차감된다.
- 아직 완료하지 않은 다음 학습 목표로 취급한다.

### completed

- `completed` 상태의 `Stage` 는 최소 한 번 정상 완료된 상태다.
- `completed` Stage 는 replay 가능하다.
- replay 가능 여부는 유지하되, 완료 사실 자체는 사라지지 않는다.

## Progression Rules

- 기본 진행 방식은 `linear progression` 이다.
- 각 난이도 트랙은 `Chapter` 단위와 `Stage` 단위 모두 순서대로 연다.
- 첫 번째 `Chapter` 는 초기 상태에서 `unlocked` 여야 한다.
- 두 번째 이후 `Chapter` 는 기본적으로 모두 `locked` 여야 한다.
- `unlocked` 된 각 `Chapter` 의 첫 번째 `Stage` 는 초기 상태에서 `unlocked` 여야 한다.
- 같은 `Chapter` 안의 다음 `Stage` 는 직전 필수 `Stage` 완료 후 `unlocked` 된다.
- 현재 `Chapter` 의 모든 `Stage` 완료 후 바로 다음 `Chapter` `1`개만 `unlocked` 된다.
- 현재 `Chapter` 를 완료해도 그 다음 이후 `Chapter` 들은 연쇄적으로 한 번에 열리면 안 된다.

## requiredStageId Policy

- 각 `Stage` 는 필요 시 `requiredStageId` 를 가진다.
- `requiredStageId` 는 현재 Stage 가 열리기 위해 먼저 완료되어야 하는 Stage 를 뜻한다.
- 선형 진행에서는 일반적으로 직전 Stage 의 `stageId` 를 가리킨다.
- `requiredStageId` 가 충족되지 않으면 Stage 는 `locked` 상태를 유지한다.
- `requiredStageId` 는 같은 난이도 트랙 안의 Stage 만 참조할 수 있다.

## requiredChapterId Policy

- 각 `Chapter` 는 필요 시 `requiredChapterId` 를 가진다.
- `requiredChapterId` 는 현재 `Chapter` 가 열리기 전에 먼저 완료되어야 하는 `Chapter` 를 뜻한다.
- 선형 진행에서는 일반적으로 직전 `Chapter` 의 `chapterId` 를 가리킨다.
- `requiredChapterId` 가 충족되지 않으면 `Chapter` 는 `locked` 상태를 유지한다.

## State Transitions

- 초기 상태:
  첫 번째 `Chapter` 는 `unlocked`, 그 안의 첫 번째 `Stage` 는 `unlocked`, 나머지는 `locked` 가 기본값이다.
- `locked -> unlocked`:
  `requiredStageId` 로 지정된 선행 `Stage` 가 `completed` 되면 같은 `Chapter` 안의 다음 `Stage` 가 열린다.
- `Chapter locked -> unlocked`:
  현재 `Chapter` 안의 모든 `Stage` 가 `completed` 되면 다음 `requiredChapterId` 대상 `Chapter` 가 열린다.
- `unlocked -> completed`:
  사용자가 `Stage` 를 정상 완료하면 전환된다.
- `completed -> completed`:
  replay 후에도 상태는 `completed` 로 유지된다.
- `locked -> completed` 같은 건너뛰기 전환은 허용하지 않는다.

## Access Rules

- `locked` Stage 는 진입 불가다.
- `unlocked` Stage 는 진입 가능하다.
- `Jelly` 는 Stage 입장 시가 아니라 문제 제출 시 감소한다.
- `completed` Stage 는 replay 가능하다.
- `locked` Chapter 는 진입 불가다.
- `locked` Chapter 는 직접 URL 로 접근해도 `StageMap` 진입이 차단되어야 한다.
- `completed` Chapter 도 다시 들어갈 수 있다.
- replay 는 진행도 해금 순서를 되돌리거나 다른 난이도 진행도에 영향을 주지 않는다.
- `Jelly` 는 문제 제출 시 `1` 감소하는 공통 체력 재화다.

## Stage Field Contract

- `Stage` 는 다음 필드를 가져야 한다.
  - `id`
  - `difficulty`
  - `chapterId`
  - `order`
  - `title`
  - `description`
  - `learningTarget`
  - `quizIds`
  - `requiredStageId`

## Stage Completion Contract

- Stage 클리어 기준은 해당 `Stage` 에 연결된 `10`문제를 모두 정상 완료하는 것이다.
- `failLife = 0` 이면 Stage 실패로 처리되고 `Stage` 와 `Chapter` 진행도는 바뀌지 않는다.
- Stage 완료 후에만 같은 `Chapter` 안의 다음 `requiredStageId` 대상 `Stage` 가 해금될 수 있다.
- 현재 `Chapter` 의 모든 `Stage` 가 완료되면 현재 `Chapter` 는 완료 상태가 되고 다음 `Chapter` 가 해금된다.
- `ChapterMap -> StageMap -> Quiz(10문제) -> Result -> Reward -> StageMap` 흐름은 하나의 Stage 완료 사이클을 이룬다.

## Unlock Evaluation

- 해금 계산은 난이도별 `Progress` 안에서만 처리한다.
- 어떤 난이도의 Stage 완료도 다른 난이도의 `next stage unlock` 에 영향을 주지 않는다.
- 어떤 난이도의 `Chapter` 완료도 다른 난이도의 `Chapter` 또는 `Stage` 에 영향을 주지 않는다.
- 해금 판정은 데이터 기반으로 결정론적으로 계산한다.

## Open Questions

- replay 완료 시 추가 보상을 줄지 여부.
- 첫 Stage 외에 예외적으로 동시에 여러 Stage 를 열어둘 필요가 있는지 여부.
