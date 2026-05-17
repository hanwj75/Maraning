# MVP Scope

## Goal

- Appintos WebView 안에서 짧게 반복할 수 있는 영어 학습 루프를 제공한다.
- 사용자는 빠르게 난이도를 고르고, Stage 에 입장해, 짧은 퀴즈를 풀고, 즉시 보상과 피드백을 받는다.
- MVP 는 게임을 크게 확장하는 것이 아니라 Appintos 안의 비게임 피쳐 단위로 가볍게 소비되는 학습 경험을 만드는 데 집중한다.

## In Scope

- 핵심 흐름 `Home -> DifficultySelect -> StageMap -> Quiz -> Reward`.
- 난이도별 독립 StageMap 구조.
- JSON 기반 stage/quiz 데이터.
- 문제 타입 `image_select`, `matching`, `word_order`, `blank_fill`.
- `jelly` 체력 시스템.
- 귀여운 캐릭터 피드백과 가벼운 보상 경험.
- Appintos WebView 환경에 맞는 짧은 세션 길이.

## Out of Scope

- `typing` 문제.
- AI 회화 기능.
- 서버 기능.
- 실제 결제.
- 랭킹.
- 멀티플레이.

## Product Rules

- `jelly` 는 하루 `20`개를 기준으로 운영한다.
- Stage 입장 시 `jelly` `1`개를 차감한다.
- 사용자는 난이도를 먼저 선택한 뒤 해당 난이도의 StageMap 안에서만 진행한다.
- 정답 판정은 항상 결정론적 규칙으로 처리한다.
- React 화면은 Appintos SDK 를 직접 호출하지 않는다.

## Success Criteria

- 사용자가 몇 초 안에 학습을 시작할 수 있어야 한다.
- 한 번의 학습 루프가 짧고 명확해야 한다.
- 난이도 선택, Stage 진입, 퀴즈 진행, 보상 수령 흐름이 끊기지 않아야 한다.
- 귀여운 UX 가 학습 피드백을 부드럽게 전달해야 한다.
