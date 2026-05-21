# Acceptance Criteria

## Product Acceptance

- 사용자는 `Home -> DifficultySelect -> ChapterMap -> StageMap -> Quiz -> Reward` 흐름을 끊김 없이 진행할 수 있어야 한다.
- 난이도는 `absolute_beginner`, `beginner`, `intermediate`, `advanced`, `conversation`, `toeic` 으로 분리되어야 한다.
- 각 난이도는 독립적인 `ChapterMap` / `StageMap` progress 를 가져야 한다.
- 난이도별 `Chapter` 는 최종 목표 기준 `10`개, `Chapter` 별 `Stage` 는 최종 목표 기준 `10`개, `Stage` 별 `Quiz` 는 정확히 `10`개라는 구조가 문서화되어야 한다.
- 현재 seed 데이터가 최소 개수여도 타입과 규칙은 `Difficulty -> Chapter -> Stage -> Quiz` 구조를 따라야 한다.
- `jelly` 는 전역 공통 자원으로 동작해야 한다.
- Stage 시작만으로는 `jelly` 가 감소하지 않아야 한다.
- 문제 제출 `1`회마다 `jelly` `1` 감소가 적용되어야 한다.
- `jelly` 가 `0` 이면 제출이 차단되어야 한다.
- `failLife` 감소 없이 `5`문제 해결 시 `jelly` `1~3` 보상이 적용되어야 한다.
- 광고보기 mock 클릭 시 `jelly` `5` 회복이 적용되어야 한다.
- 광고보기 버튼은 먼저 `광고를 보시겠습니까?` 팝업과 `yes / no` 를 보여야 하며 `yes`일 때만 `jelly` `5` 회복이 적용되어야 한다.
- `jelly` 는 내부 최대 `100`을 넘지 않아야 하지만 UI 에 최대값을 노출하지 않아야 한다.
- Quiz 제출 시 `jelly = 0` 이면 즉시 리다이렉트하지 않고 `광고를 보면 젤리5개를 드려요!` 팝업을 먼저 보여야 한다.
- 위 팝업에서 `yes`를 누르면 현재 Quiz 화면에서 `jelly` `5`가 회복되어야 하고 `no`를 누르면 `StageMap` 으로 이동해야 한다.

## UX Acceptance

- 각 화면의 핵심 행동은 빠르게 이해 가능해야 한다.
- 긴 설명 없이도 다음 행동을 알 수 있어야 한다.
- `locked`, `unlocked`, `completed` 상태가 시각적으로 구분되어야 한다.
- `ChapterMap` 에서 `locked Chapter` 는 클릭 불가, `unlocked` 와 `completed Chapter` 는 클릭 가능해야 한다.
- 각 난이도는 `Chapter 1`만 기본 `unlocked`, `Chapter 2~10`은 기본 `locked` 여야 한다.
- 이전 `Chapter` 의 모든 `Stage` 완료 전에는 다음 `Chapter` 로 들어갈 수 없어야 한다.
- 한 `Chapter` 완료 시 바로 다음 `Chapter` `1`개만 열려야 하며 그 이후 `Chapter` 는 계속 `locked` 여야 한다.
- 귀여운 UX 는 존재하되 학습 흐름을 방해하지 않아야 한다.
- 버튼은 충분히 크고 탭 가능해야 한다.
- Quiz 화면에서 캐릭터와 하트는 제출 버튼 아래에 위치하고 보기 영역을 가리지 않아야 한다.
- Quiz 와 StageMap 상단의 `jelly` 표시는 한 화면에 하나만 보여야 하며 항상 `젤리 {current}` 한 줄 형식이어야 한다.
- Quiz 화면의 캐릭터/하트는 별도 카드 없이 배경 위에 떠 있는 형태여야 하며 캐릭터 아래 설명 텍스트를 추가하지 않아야 한다.

## Data Acceptance

- difficulty, stage, quiz JSON 구조가 문서화된 스키마와 일치해야 한다.
- chapter JSON 구조가 문서화된 스키마와 일치해야 한다.
- 퀴즈 판정은 `deterministic validation` 이어야 한다.
- 모든 choices 기반 문제는 화면 표시 전에 shuffle 되더라도 정답 판정이 `answer value` 기준으로 유지되어야 한다.
- `word_order` 는 display token 카드만 shuffle 하고 `answerTokens` 원본 순서는 유지해야 한다.
- `matching` 문제는 정답 pair 관계를 유지하고 왼쪽 한국어 카드와 오른쪽 영어 카드 표시 순서만 각각 shuffle 해야 한다.
- 같은 `QuizSession` 안에서는 한 번 생성된 shuffle 결과가 유지되어야 한다.
- `blank_fill` 문제는 `question` 에 목표 한국어 의미 또는 전체 문장 뜻이 포함되어, 사용자가 prompt 만 보지 않고도 무엇을 채워야 하는지 알 수 있어야 한다.
- `LLM validation` 은 사용되지 않아야 한다.
- `requiredStageId` 기반 Stage 해금이 정상 동작해야 한다.
- `requiredChapterId` 기반 Chapter 해금이 정상 동작해야 한다.
- `locked Chapter` 를 URL 로 직접 열어도 `StageMap` 진입이 차단되어야 한다.
- 난이도 간 progress 오염이 없어야 한다.

## Technical Acceptance

- 상태 관리는 `Zustand` 기반이어야 한다.
- 핵심 progress 와 `jelly` 상태는 `localStorage fallback` 으로 유지 가능해야 한다.
- React component 에서 SDK 직접 호출이 없어야 한다.
- SDK 연동은 wrapper layer 를 통해서만 수행되어야 한다.

## Release Acceptance

- 테스트 케이스가 존재해야 한다.
- 테스트 없는 기능은 완료가 아니다.
- 관련 문서가 최신 상태여야 한다.
- changelog 에 의미 있는 변경 사항이 기록되어야 한다.
