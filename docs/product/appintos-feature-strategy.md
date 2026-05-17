# AppIntos Feature Strategy

## Objectives

- Appintos 안에서 부담 없이 열어볼 수 있는 짧은 영어 학습 기능을 제공한다.
- 메인 앱 경험을 방해하지 않는 비게임 피쳐 단위의 학습 루프를 만든다.
- 반복 방문을 유도하되, 세션 길이는 짧게 유지한다.

## Feature Priorities

- 1순위는 진입 장벽이 낮은 학습 시작 경험이다.
- 2순위는 난이도별 StageMap 을 통한 명확한 진행 구조다.
- 3순위는 `jelly` 체력과 보상, 캐릭터 피드백으로 짧은 동기 부여를 만드는 것이다.
- 4순위는 Appintos WebView 에 안전하게 맞는 연동 구조를 유지하는 것이다.

## AppIntos Fit

- 이 앱은 장시간 몰입형 게임보다 짧은 반복형 학습 도구에 가깝다.
- 사용자는 Appintos 안에서 빠르게 열고, 한두 개 Stage 를 진행하고, 바로 종료할 수 있어야 한다.
- 따라서 모든 핵심 기능은 짧은 세션 안에 닫히는 구조를 우선한다.
- Stage 진입 비용으로 `jelly` 를 사용해 하루 학습 리듬을 만든다.

## Platform Constraints

- WebView 환경에서 복잡한 흐름보다 단순하고 예측 가능한 이동이 우선이다.
- SDK 연동은 wrapper 계층을 통해 제한적으로 사용한다.
- 네트워크나 서버 의존 없이도 MVP 루프가 성립해야 한다.
- 정답 판정은 LLM 없이 데이터 기반으로 끝나야 한다.

## Release Phases

- Phase 1: `Home`, `DifficultySelect`, 난이도별 `StageMap`, `Quiz`, `Reward` 의 기본 루프 확정.
- Phase 2: `jelly` 소모 규칙과 귀여운 피드백 경험 정제.
- Phase 3: 난이도별 콘텐츠 확장과 반복 플레이 감각 개선.
