# Implementation Order

## Phase Overview

### Phase 1

- 문서 기준선 확정.
- 제품 흐름, 도메인 모델, 난이도 정책, Stage 시스템, Quiz 엔진, 상태 관리, SDK boundary 문서 정리.

### Phase 2

- 데이터 스키마 확정.
- difficulty, stage, quiz JSON 구조와 validation 규칙 정리.

### Phase 3

- UI 기준선 확정.
- 화면 역할, 귀여운 UX 규칙, 애니메이션 규칙 정리.

### Phase 4

- QA 기준 확정.
- acceptance criteria, test case, changelog 운영 규칙 정리.

### Phase 5

- 구현 시작.
- 가장 작은 핵심 루프부터 단계적으로 구현한다.

## Dependency Order

- `AGENTS.md` 와 `ARCHITECTURE.md` 가 최상위 기준이다.
- 제품 문서가 사용자 흐름 기준을 제공한다.
- 아키텍처 문서가 책임 분리와 규칙을 고정한다.
- 데이터 스키마가 구현 입력 형식을 고정한다.
- UI 문서가 화면 역할과 표현 원칙을 고정한다.
- 품질 문서가 완료 기준을 고정한다.
- 구현은 위 기준선 이후에만 시작한다.

## Recommended Build Order

1. 난이도 선택과 StageMap 진행 구조.
2. Quiz 데이터 로딩과 deterministic validator.
3. `jelly` 소모 및 회복 흐름.
4. Reward 와 character feedback.
5. Zustand 상태 저장과 `localStorage` fallback.
6. Appintos SDK wrapper 연결.

## Delivery Gates

- Gate 1:
  관련 문서가 존재하고 현재 규칙과 충돌하지 않아야 한다.
- Gate 2:
  데이터 스키마가 정의되어 있어야 한다.
- Gate 3:
  acceptance criteria 와 test case 가 준비되어 있어야 한다.
- Gate 4:
  구현이 작은 단위로 나뉘어 있어야 한다.
- Gate 5:
  테스트 없는 기능은 완료 처리하지 않는다.

## Completion Rules

- 구현 완료는 코드 작성만으로 성립하지 않는다.
- acceptance criteria 충족 확인이 있어야 한다.
- 관련 테스트 케이스가 존재해야 한다.
- changelog 가 갱신되어야 한다.

## Open Questions

- 구현 단계에서 가장 먼저 세울 최소 수동 테스트 세트를 어디까지로 잡을지 여부.
