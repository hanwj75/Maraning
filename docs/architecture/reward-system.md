# Reward System

## Reward Types

- 보상 시스템은 학습 완료 직후 사용자에게 짧은 성취 피드백을 제공한다.
- MVP 보상은 복잡한 재화 경제보다 `jelly` 흐름과 완료 피드백에 집중한다.
- 핵심 보상 타입은 `Stage completion feedback`, `progress confirmation`, `jelly recovery opportunity` 다.

## Jelly Flow

- `jelly` 는 앱 전체에서 공통으로 사용하는 전역 체력 자원이다.
- 사용자는 날짜 변경 후 첫 진입 시 `jelly < 20` 인 경우에만 `20`까지 회복한다.
- `jelly` 내부 최대 보유량은 `100`개다.
- Stage 시작만으로는 `jelly` 를 차감하지 않는다.
- 문제를 `1`회 제출할 때마다 `jelly` `1`개를 차감한다.
- 광고보기 mock 버튼 클릭 시 `jelly` `5`개를 회복한다.
- 광고보기 버튼은 즉시 지급하지 않고 `광고를 보시겠습니까?` 확인 팝업의 `yes`를 거친 뒤에만 보상을 지급한다.
- 같은 StageSession 안에서 `failLife` 감소 없이 `5`문제를 해결하면 `jelly` `1~3`개를 랜덤 보상한다.
- 광고 또는 무실패 보상으로 회복하더라도 현재 보유량은 내부 상한 `100`개를 넘을 수 없다.

## Reward Flow

- 사용자는 `Quiz` 완료 후 `Reward` 단계로 이동한다.
- `Reward` 화면은 Stage 완료 여부, 다음 진행 가능 상태, 짧은 캐릭터 반응을 보여준다.
- Stage 완료 자체는 다음 Stage 해금 계산의 입력이 된다.
- `jelly` 보상은 광고 회복과 `5`문제 무실패 보상 두 경로로만 회복된다.
- `Reward` 는 사용자를 동일 난이도 `StageMap` 으로 자연스럽게 되돌려 다음 루프를 이어 주어야 한다.

## Trigger Rules

- `Stage start`:
  `jelly` 차감은 발생하지 않는다.
- `Quiz submit`:
  정답 여부와 관계없이 `jelly` `1` 차감이 발생한다.
- `Stage completed`:
  완료 피드백과 진행도 반영이 발생한다.
- `5 clean solves in one session`:
  `jelly` `1~3` 랜덤 보상이 발생하고 streak 는 `0`으로 초기화된다.
- `Mock ad reward tapped`:
  `jelly` `5` 회복이 발생한다.
- `jelly = 0 on submit`:
  `광고를 보면 젤리5개를 드려요!` 팝업을 먼저 보여주고 `yes`면 제자리 회복, `no`면 `StageMap` 으로 이동한다.
- `jelly at max`:
  추가 회복은 무시되거나 상한 `100`에서 고정된다.

## Economy Constraints

- `jelly` 는 난이도별로 분리되지 않는다.
- 어떤 난이도에서든 문제 제출 비용은 동일하게 `1`이다.
- 보상 구조는 짧은 학습 루프를 지원해야 하며 과도한 체류 설계를 만들지 않는다.
- 광고 회복은 학습 흐름을 완전히 끊지 않는 보조 수단이어야 한다.
- 보상 시스템은 서버나 실제 결제에 의존하지 않는다.

## State Rules

- `jelly = 0` 이면 새 제출은 불가하다.
- `jelly > 0` 이면 `unlocked` 또는 `completed` Stage 에 진입하고 문제 제출을 진행할 수 있다.
- 광고 회복은 전역 `jelly` 상태에만 영향을 준다.
- Stage 완료는 난이도별 `Progress` 를 갱신하지만 `jelly` 최대치는 바꾸지 않는다.

## Open Questions

- 광고 시청 진입 지점을 `Reward` 에만 둘지, `StageMap` 에도 둘지 여부.
- Stage 완료 시 별도의 시각 배지나 연출을 둘지 여부.
