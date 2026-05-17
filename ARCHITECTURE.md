# ARCHITECTURE

## 시스템 개요

- 애플리케이션은 React + Vite 기반의 Appintos WebView 영어 학습 앱이다.
- 핵심 흐름은 `Home -> DifficultySelect -> StageMap -> Quiz -> Reward` 이다.
- 난이도는 `absolute_beginner`, `beginner`, `intermediate`, `advanced`, `conversation`, `toeic` 으로 분리된다.
- 각 난이도는 독립적인 StageMap 진행 구조를 가진다.
- 퀴즈와 스테이지는 JSON 기반 데이터로 구동된다.
- 사용자는 `jelly` 체력 시스템 아래에서 문제를 풀고, 결과에 따라 귀여운 캐릭터 피드백과 보상 화면을 본다.
- 정답 판정은 항상 `deterministic validation` 규칙으로 처리한다.
- Appintos 연동은 직접 호출이 아니라 SDK wrapper 계층을 통해 수행한다.

## 책임 분리

### 화면 계층

- 화면 계층은 사용자 흐름과 상태 표시를 담당한다.
- `Home`, `DifficultySelect`, `StageMap`, `Quiz`, `Reward` 는 화면 전환과 표현 책임만 가진다.
- 화면 계층은 SDK 를 직접 호출하지 않는다.

### 도메인 계층

- 도메인 계층은 난이도, 스테이지 진행, `jelly` 체력, 보상, 캐릭터 피드백 규칙을 담당한다.
- 정답 판정 로직은 도메인 계층에서 결정론적으로 처리한다.
- 문제 타입 `image_select`, `matching`, `word_order`, `blank_fill` 은 공통 판정 규칙 아래에서 해석된다.

### 데이터 계층

- 데이터 계층은 quiz/stage/difficulty JSON 정의와 로딩 규칙을 담당한다.
- 난이도별 StageMap 분리는 데이터 구조에서도 명확히 드러나야 한다.

### 플랫폼 연동 계층

- Appintos SDK wrapper 는 WebView 브리지 호출, 이벤트 수신, 예외 방어를 담당한다.
- React 컴포넌트는 wrapper 가 제공하는 안전한 인터페이스만 사용한다.

## 변경 위치 지도

- 사용자 흐름을 바꾸려면 `docs/product/user-flow.md` 와 `docs/ui/screen-spec.md` 를 먼저 수정한다.
- 난이도 종류나 난이도 정책을 바꾸려면 `docs/architecture/difficulty-policy.md`, `docs/data/difficulty-data-schema.md` 를 수정한다.
- StageMap 구조를 바꾸려면 `docs/architecture/stage-system.md`, `docs/data/stage-data-schema.md` 를 수정한다.
- 퀴즈 타입, 판정 방식, 진행 규칙을 바꾸려면 `docs/architecture/quiz-engine.md`, `docs/data/quiz-data-schema.md` 를 수정한다.
- `jelly` 체력 및 보상 구조를 바꾸려면 `docs/architecture/reward-system.md` 와 관련 품질 문서를 수정한다.
- 캐릭터 반응과 화면 표현을 바꾸려면 `docs/architecture/character-system.md`, `docs/ui/cute-design-rules.md`, `docs/ui/animation-rules.md` 를 수정한다.
- Appintos 연동 방식을 바꾸려면 `docs/architecture/appintos-webview-sdk.md` 를 우선 수정한다.
- 상태 경계와 저장 방식을 바꾸려면 `docs/architecture/state-management.md` 를 수정한다.
- 작업 순서와 변경 원칙을 바꾸려면 `docs/development/cursor-codex-workflow.md`, `docs/development/implementation-order.md` 를 수정한다.

## 비목표

- MVP 에서 `typing` 문제는 다루지 않는다.
- AI 회화 기능은 다루지 않는다.
- 서버 기반 백엔드 구축은 다루지 않는다.
- 실제 결제 연동은 다루지 않는다.
- 랭킹과 멀티플레이는 다루지 않는다.
- LLM 기반 정답 판정은 허용하지 않는다.

## 설계 원칙

- 구조는 `difficulty` 중심으로 나누고, 각 난이도는 독립적인 StageMap 경험을 가진다.
- 문제 데이터와 진행 데이터는 JSON 중심으로 유지한다.
- 정답 검증은 항상 입력과 정답 데이터만으로 재현 가능한 `deterministic validation` 을 사용한다.
- Appintos SDK 접근은 반드시 wrapper 계층에 캡슐화한다.
- 구현은 MVP 범위 안에서 최소한으로 유지한다.
- 변경은 관련 문서, 테스트 기준, 품질 기준과 함께 움직여야 한다.
- 아키텍처 문서는 기능 설명보다 "어디를 수정해야 하는가" 를 더 빠르게 찾을 수 있어야 한다.
