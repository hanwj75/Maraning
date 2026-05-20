# Changelog

## Version History

- 모든 의미 있는 규칙 변경, 문서 변경, 구현 변경은 기록 대상이다.
- changelog 는 최신 항목이 위에 오도록 유지한다.
- 날짜, 변경 범위, 변경 이유를 함께 남긴다.

## Entry Format

- 권장 형식은 `date`, `scope`, `type`, `summary`, `docs/tests updated` 다.
- `type` 예시는 `docs`, `architecture`, `data`, `ui`, `quality`, `implementation`, `fix` 다.
- 한 항목은 짧고 명확해야 한다.

## Document Changes

- 문서만 수정해도 changelog 에 남긴다.
- 규칙 변경 문서는 구현 이전이라도 기록한다.
- 아키텍처 또는 품질 기준 변경은 영향 범위를 요약해야 한다.

## Product Changes

- 사용자 흐름, `jelly` 정책, 난이도 구조, Stage 해금 규칙, 퀴즈 판정 규칙 변경은 반드시 기록한다.
- SDK boundary 또는 상태 저장 구조 변경도 제품 영향이 있으면 기록한다.

## Rules

- 작은 단위 변경마다 항목을 남긴다.
- 테스트 없는 기능은 완료가 아니므로 완료 항목으로 기록하지 않는다.
- 관련 문서와 테스트 갱신 여부를 함께 적는다.
- changelog 없이 규칙을 바꾸지 않는다.

## Example Entry

```md
- 2026-05-14 | scope: quiz-engine | type: docs | deterministic validation 규칙 명시 | docs/tests updated: docs/architecture/quiz-engine.md, docs/data/quiz-data-schema.md
```

## Entries

- 2026-05-20 | scope: chapter-map-title-above-line-layout | type: ui | `ChapterMapPage` 에서 `chapter_hurdle` 사용을 제거하고 각 chapter row의 제목을 `chapter_line` 위쪽 절대 배치로 옮겨 긴 제목이 줄바꿈되더라도 line 위치를 밀지 않게 조정했으며, `finish_line` 은 마지막 chapter row 아래에만 보이도록 정리했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx
- 2026-05-20 | scope: chapter-row-click-target | type: ui | `ChapterMapPage` 에서 챕터 제목 캡슐과 `chapter_line` 을 하나의 버튼 영역으로 묶어 unlocked/completed 챕터는 row 전체를 눌렀을 때 해당 `StageMap` 으로 이동하도록 클릭 범위를 확장했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx
- 2026-05-20 | scope: chapter-map-header-and-width-cleanup | type: ui | `ChapterMapPage` 에서 상단 안내 카드를 제거하고 상단 제목을 `{난이도명} 챕터` 형식으로 변경했으며, 모든 챕터 제목 캡슐 폭을 1번 카드 기준으로 고정해 locked 챕터를 포함한 모든 카드가 중앙 트랙 안에서만 보이도록 정리했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx
- 2026-05-20 | scope: chapter-title-capsule-above-line | type: ui | `ChapterMapPage` 에서 흰색 폼이 `chapter_line` 전체를 감싸지 않도록 수정하고, 상태와 챕터 제목 안내만 별도 반투명 흰색 캡슐로 `chapter_line` 위에 배치해 `[제목]` 다음에 line이 보이는 구조로 가시성을 정리했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx
- 2026-05-20 | scope: chapter-card-lock-policy | type: implementation | `ChapterMapPage` 를 반투명 흰색 Chapter 카드 UI로 정리해 상태, 잠금 안내, `chapter_line` slice를 카드 내부에만 배치하고, `progressStore` persisted progress 보정 로직을 추가해 첫 Chapter만 기본 해금되고 이전 Chapter 완료 시 바로 다음 Chapter 하나와 그 첫 Stage만 열리도록 고정했다 | docs/tests updated: docs/architecture/stage-system.md, docs/architecture/state-management.md, docs/quality/acceptance-criteria.md, docs/quality/test-cases.md, docs/quality/changelog.md, src/pages/ChapterMapPage.tsx, src/stores/progressStore.ts, src/stores/progressStore.test.ts
- 2026-05-20 | scope: chapter-line-sprite-slice | type: ui | `ChapterMapPage` 에서 `chapter_line` 전체 이미지를 row마다 통째로 쓰던 방식을 제거하고 `ChapterLineSlice` 컴포넌트로 sprite의 해당 번호 줄만 잘라 보여주도록 수정해 각 chapter row에 자기 line 한 줄만 보이게 정리했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx, src/pages/ChapterLineSlice.tsx
- 2026-05-20 | scope: chapter-map-track-row-correction | type: ui | `ChapterMapPage` 의 Chapter 트랙을 row 반복 구조로 다시 정리해 `chapter_background` 는 배경으로만 사용하고, `chapter_line` 은 10개 row 각각에 반복 배치하며 `chapter_hurdle` 은 1~9번 row, `finish_line` 은 10번 row에 함께 보이도록 수정했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx
- 2026-05-20 | scope: chapter-map-track-ui | type: ui | `ChapterMapPage` 를 세로 스크롤형 러닝 트랙 UI로 바꾸고 `chapter_background`, `chapter_line`, `chapter_hurdle`, `finish_line` 에셋을 사용해 Chapter 선, 허들, 마지막 도착선을 배치했으며 locked/unlocked/completed 클릭 정책은 그대로 유지했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ChapterMapPage.tsx
- 2026-05-19 | scope: chapter-map-stage-structure | type: implementation | 기존 `Difficulty -> Stage -> Quiz` 구조를 `Difficulty -> Chapter -> Stage -> Quiz` 구조로 확장하고 난이도 선택 뒤 `ChapterMap` 화면을 추가했으며, Stage progress 를 Chapter-aware progress 로 확장하고 현재 Chapter 안 Stage만 보이도록 라우팅·스토어·문서·테스트를 갱신했다 | docs/tests updated: docs/architecture/domain-model.md, docs/architecture/stage-system.md, docs/architecture/state-management.md, docs/data/stage-data-schema.md, docs/data/quiz-data-schema.md, docs/data/chapter-data-schema.md, docs/ui/screen-spec.md, docs/quality/acceptance-criteria.md, docs/quality/test-cases.md, docs/quality/changelog.md, src/data/chapters/*, src/data/stages/*, src/features/stage/stage.types.ts, src/features/stage/stage.utils.ts, src/features/stage/stage.routes.ts, src/pages/ChapterMapPage.tsx, src/pages/StageMapPage.tsx, src/pages/DifficultySelectPage.tsx, src/pages/QuizPage.tsx, src/pages/ResultPage.tsx, src/pages/RewardPage.tsx, src/stores/progressStore.ts, src/stores/quizStore.ts, src/stores/ui-store.ts, src/features/stage/stage.utils.test.ts, src/features/stage/stage-flow.test.ts, src/stores/progressStore.test.ts, src/stores/quizStore.test.ts
- 2026-05-19 | scope: fail-life-state1-sheet-restoration | type: fix | `hamster_fail_life_state1` 이 이전 작업의 잘못된 `3 x 2 / 6프레임` 가정으로 되돌아가 있던 부분을 제거하고 실제 자산 기준인 `5 x 2 / 10프레임` 스프라이트 재생으로 복구했으며, Quiz 하단 표시 박스도 프레임 비율에 맞게 조정해 슬라이드처럼 보이지 않도록 바로잡았다 | docs/tests updated: docs/quality/changelog.md, docs/architecture/character-system.md, docs/quality/test-cases.md, src/shared/maraning-assets.ts, src/pages/QuizPage.tsx, src/styles/globals.css
- 2026-05-19 | scope: workflow-minimal-change-and-dead-code-rule | type: docs | 작업 원칙 문서에 이전 수정 흔적과 데드 코드를 먼저 점검하고 현재 작업과 무관해진 코드는 같은 작업 안에서 즉시 제거하도록 명시했으며, 요청과 직접 관련 없는 기능은 수정하지 않는 최소 변경 원칙을 추가했다 | docs/tests updated: AGENTS.md, docs/development/cursor-codex-workflow.md, docs/quality/changelog.md
- 2026-05-19 | scope: fail-life-state2-sheet-correction | type: fix | `hamster_fail_life_state2` 에 이전 작업의 `5 x 2 / 10프레임` 가정이 남아 있던 부분을 제거하고 실제 자산 크기 `1536 x 1024`, 즉 `4 x 2 / 8프레임` 스프라이트 시트 기준으로 재생하도록 바로잡았으며 `state1` 도 실제 `3 x 2 / 6프레임` 구성으로 분리해 정정했다 | docs/tests updated: docs/quality/changelog.md, docs/architecture/character-system.md, docs/quality/test-cases.md, src/shared/maraning-assets.ts, src/pages/QuizPage.tsx, src/styles/globals.css
- 2026-05-19 | scope: fail-life-sprite-frame-playback | type: fix | `hamster_fail_life_state1`, `hamster_fail_life_state2` 실패 애니메이션을 전체 이미지 슬라이드처럼 보이던 방식에서 `5 x 2` 총 `10`프레임 스프라이트 시트 재생 방식으로 정정하고 캐릭터 프레임 비율에 맞는 표시 폭으로 조정해 한 번에 하나의 프레임만 보이도록 맞췄다 | docs/tests updated: docs/quality/changelog.md, docs/architecture/character-system.md, docs/quality/test-cases.md, src/shared/maraning-assets.ts, src/pages/QuizPage.tsx, src/styles/globals.css
- 2026-05-19 | scope: quiz-fail-life-character-states | type: fix | Quiz 오답 시 기존 하트 감소 로직은 유지한 채 `nextLife === 2` 에서는 `hamster_fail_life_state2` 애니메이션 후 `hamster_char_fail1`, `nextLife === 1` 에서는 `hamster_fail_life_state1` 애니메이션 후 `hamster_char_fail2` 정적 이미지를 유지하도록 단계별 실패 캐릭터 상태를 추가했고 스테이지 이탈 시 기본 캐릭터와 타이머를 정리하도록 보강했다 | docs/tests updated: docs/quality/changelog.md, docs/architecture/character-system.md, docs/quality/test-cases.md, src/shared/maraning-assets.ts, src/pages/QuizPage.tsx, src/styles/globals.css
- 2026-05-18 | scope: result-sprite-frame-alignment | type: fix | 결과 화면의 스프라이트 캐릭터를 원본 프레임 비율 `3:4`에 맞춰 렌더링하고 스프라이트 박스 자체를 프레임처럼 잘라 쓰도록 조정해 애니메이션 시작 시 왼쪽에 이전 프레임 손발이 비치거나 캐릭터가 오른쪽으로 쏠려 보이는 문제를 줄였다 | docs/tests updated: docs/quality/changelog.md, src/pages/ResultPage.tsx, src/styles/globals.css
- 2026-05-18 | scope: result-animation-replay-on-click | type: fix | 결과 화면의 캐릭터 애니메이션 영역을 클릭하면 `hamster_stage_clear` 스프라이트 애니메이션이 다시 재생되도록 결과 화면 전용 재생 트리거를 추가했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ResultPage.tsx, src/shared/components/StageHamster.tsx
- 2026-05-18 | scope: result-animation-layout-stability | type: fix | 결과 화면에서 `짧은 피드백` 카드와 내용을 제거하고 전체 공간을 스테이지 클리어 캐릭터 애니메이션에 사용하도록 바꿨으며, 애니메이션 종료 후 마지막 프레임을 유지하고 버튼은 하단 고정으로 배치해 재생 중 위아래로 흔들리지 않게 조정했다 | docs/tests updated: docs/quality/changelog.md, src/pages/ResultPage.tsx, src/shared/components/StageHamster.tsx, src/styles/globals.css
- 2026-05-18 | scope: result-stage-clear-animation-relocation | type: fix | 결과 화면의 `말랑이 칭찬` 캐릭터 카드 영역을 제거하고 `hamster_stage_clear` 스프라이트 애니메이션을 그 자리에 배치했으며, StageMap 복귀 후 재생되던 같은 애니메이션은 제거해 결과 화면에서 바로 보이도록 옮겼다 | docs/tests updated: docs/quality/changelog.md, src/pages/ResultPage.tsx, src/pages/RewardPage.tsx, src/pages/StageMapPage.tsx
- 2026-05-18 | scope: stage-clear-sprite-animation | type: fix | 스테이지 클리어 후 StageMap 복귀 시 재생하던 `hamster_char1~8` 순차 이미지 애니메이션을 `hamster_stage_clear` 스프라이트 시트를 사용하는 CSS/JS 기반 재생 방식으로 교체했다 | docs/tests updated: docs/quality/changelog.md, src/shared/maraning-assets.ts, src/shared/components/StageHamster.tsx, src/pages/StageMapPage.tsx, src/styles/globals.css
- 2026-05-18 | scope: currency-text-outline | type: fix | 재화 UI 텍스트가 화면마다 같은 톤으로 보이도록 젤리 배지와 스테이지맵 상단 카운터를 흰색 글씨와 검은색 외곽선 스타일로 통일해 밝은 배경에서도 가독성을 유지하도록 조정했다 | docs/tests updated: docs/quality/changelog.md, src/shared/components/JellyBadge.tsx, src/styles/globals.css
- 2026-05-18 | scope: jelly-badge-chrome-removal | type: fix | 젤리 표시가 별도 흰색 배지 폼에 쌓여 보이지 않도록 `JellyBadge`의 배경, 테두리, 그림자를 제거하고 아이콘과 텍스트만 남기도록 정리했다 | docs/tests updated: docs/quality/changelog.md, src/shared/components/JellyBadge.tsx
- 2026-05-18 | scope: ad-confirm-and-zero-jelly-popup | type: fix | 하단 광고보기 버튼이 즉시 지급되지 않고 `광고를 보시겠습니까?` 확인 팝업의 `yes` 이후에만 mock `jelly +5`를 지급하도록 바꾸고, Quiz 제출 시 `jelly = 0`이면 즉시 StageMap으로 보내지 않고 회복 팝업에서 `yes / no`를 고르게 수정했다 | docs/tests updated: docs/quality/changelog.md, docs/architecture/reward-system.md, docs/quality/acceptance-criteria.md, docs/quality/test-cases.md, src/shared/components/ConfirmDialog.tsx, src/shared/components/PageFrame.tsx, src/pages/StageMapPage.tsx, src/pages/QuizPage.tsx
- 2026-05-18 | scope: quiz-topbar-and-mock-ad-ui | type: fix | Quiz 상단 Jelly 중복을 제거하고 StageMap 광고보기 mock 보상을 +5로 조정했으며 상단 배지를 한 줄 `젤리 {current}` 형식으로 고정하고 Quiz 하단 캐릭터/하트를 무박스 구조로 단순화해 설명 텍스트 없이 유지하도록 문서와 테스트 기준을 함께 갱신했고, 기존 빌드를 막던 타입 오류도 동작 변경 없이 정리했다 | docs/tests updated: docs/quality/changelog.md, docs/architecture/reward-system.md, docs/architecture/state-management.md, docs/architecture/appintos-webview-sdk.md, docs/ui/screen-spec.md, docs/ui/cute-design-rules.md, docs/quality/acceptance-criteria.md, docs/quality/test-cases.md, src/features/quiz/quiz.utils.ts, src/shared/components/StageHamster.tsx, src/stores/jellyStore.test.ts, src/stores/progressStore.test.ts
- 2026-05-17 | scope: quiz-session-jelly-and-question-patch | type: implementation | Jelly 정책을 Stage 시작 차감에서 문제 제출 차감으로 옮기고 일일 20 미만 회복·내부 상한 100·5문제 무실패 랜덤 보상을 추가했으며 Quiz JSON 전체에 question 필드를 보강하고 matching 카드 선택 방식/Quiz 레이아웃/하트 UI를 문서와 테스트까지 함께 정리 | docs/tests updated: docs/quality/changelog.md, docs/architecture/reward-system.md, docs/architecture/state-management.md, docs/architecture/quiz-engine.md, docs/data/quiz-data-schema.md, docs/ui/screen-spec.md, docs/ui/cute-design-rules.md, docs/quality/test-cases.md, docs/quality/acceptance-criteria.md, src/stores/jellyStore.test.ts, src/stores/quizStore.test.ts, src/features/stage/stage-flow.test.ts, src/features/quiz/quiz.utils.test.ts
- 2026-05-17 | scope: result-page-state-retention | type: fix | quizStore의 clearSession이 result까지 함께 지우던 구조를 분리해 `/result` 진입 직후 StageMap으로 튕기던 문제를 수정하고 RewardPage 이탈 시점에만 result를 정리하도록 변경 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: quiz-finish-result-navigation | type: fix | 마지막 10번째 문제 정답 시 `/result` 경로 자체는 유지하되 quizStore가 세션을 즉시 비우지 않도록 조정하고 QuizPage unmount 시 세션을 정리하도록 변경해 완료 직후 `/quiz`에서 멈추거나 빈 화면이 남는 문제를 수정 | docs/tests updated: docs/quality/changelog.md, src/stores/quizStore.test.ts
- 2026-05-17 | scope: quiz-fail-stage-navigation | type: fix | failLife 0으로 Stage 실패 시 QuizPage에서 세션을 먼저 비우지 않고 StageMap으로 먼저 이동한 뒤 unmount 시 세션을 정리하도록 변경해 빈 페이지가 남는 라우팅 충돌을 수정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: quiz-fail-life-and-data-quality | type: implementation | QuizSession에 failLife 3 시스템과 오답 재시도·Stage 실패 흐름을 추가하고 제출 버튼을 제출하기로 통일했으며 전 난이도 Quiz 데이터를 영어 노출, choices 4~6개, matching 3쌍 규칙에 맞게 보강하고 관련 validator·테스트·문서를 갱신 | docs/tests updated: docs/quality/changelog.md, docs/architecture/quiz-engine.md, docs/architecture/state-management.md, docs/data/quiz-data-schema.md, src/features/quiz/quiz.utils.test.ts, src/features/stage/stage.utils.test.ts, src/features/stage/stage-flow.test.ts, src/stores/quizStore.test.ts
- 2026-05-17 | scope: stage-quiz-flow-validation | type: fix | QuizPage가 stage.quizIds 순서대로 10문제를 로드하도록 보정하고 전체 난이도 Stage/Quiz 데이터 검증, 핵심 Stage-Jelly-Complete-Unlock 흐름 검증 테스트를 추가 | docs/tests updated: docs/quality/changelog.md, src/features/quiz/quiz.utils.test.ts, src/features/stage/stage.utils.test.ts, src/features/stage/stage-flow.test.ts
- 2026-05-17 | scope: jelly-stage-entry | type: implementation | 전역 jellyStore를 localStorage 영속화와 일일 20개 리셋 규칙으로 추가하고 Stage 시작 시 1 차감, jelly 0 진입 차단, 광고보기 mock +3 지급, Home/Reward/StageMap 표시값 동기화 및 jellyStore 테스트를 구현 | docs/tests updated: docs/quality/changelog.md, src/stores/jellyStore.test.ts
- 2026-05-17 | scope: stage-clear-unlock | type: implementation | 10문제 완료 시 정답 수와 무관하게 같은 difficulty의 Stage를 cleared 처리하고 다음 Stage를 unlocked 하도록 progressStore를 확장했으며 ResultPage의 스테이지 클리어 표시와 진행도 테스트를 추가 | docs/tests updated: docs/quality/changelog.md, src/stores/progressStore.test.ts
- 2026-05-17 | scope: quiz-type-ui-validation | type: implementation | image_select, matching, word_order, blank_fill 최소 UI와 결정론적 정답 판정을 구현하고 정답/오답 짧은 피드백 및 quiz.utils 테스트를 추가 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: quiz-session-progression | type: implementation | QuizPage에서 10문제를 순서대로 제출하며 진행하고 각 제출 결과를 quizStore에 저장한 뒤 마지막 문제 후 ResultPage로 이동하도록 구현 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: stage-quiz-session-start | type: implementation | selectedDifficulty 기준으로 Stage 목록을 로드하고 unlocked/completed Stage 선택 시 quizStore에 stageId와 10개 quizIds를 저장한 뒤 QuizPage로 이동하도록 연결 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: remaining-difficulty-stage-seed | type: data | beginner, intermediate, advanced, conversation, toeic 난이도에 각 2개 Stage와 Stage당 10문제 seed Quiz 데이터를 추가하고 선형 requiredStageId 및 stageId 연결을 구성 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: absolute-beginner-stage-seed | type: data | 왕초보 난이도에 apple, cat, dog 학습 목표 기반 Stage 3개와 각 Stage당 10문제 seed 데이터를 추가하고 선형 requiredStageId 및 quizIds 연결을 구성 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: stage-quiz-data-implementation | type: implementation | 난이도별 stage/quiz JSON 파일, Stage·LearningTarget·Quiz 타입, Stage 10문제 및 quiz 참조 검증 유틸을 추가 | docs/tests updated: docs/quality/changelog.md
- 2026-05-17 | scope: stage-quiz-learning-policy | type: docs | Stage당 정확히 10문제, 단일 학습 목표, 반복형 학습, Stage-Quiz learningTarget 연결 정책을 stage-system, quiz-engine, stage-data-schema, quiz-data-schema 문서에 반영 | docs/tests updated: docs/architecture/stage-system.md, docs/architecture/quiz-engine.md, docs/data/stage-data-schema.md, docs/data/quiz-data-schema.md
- 2026-05-16 | scope: stage-content-height | type: fix | 스테이지 노드와 캐릭터의 실제 좌표를 기준으로 콘텐츠 높이를 계산하도록 변경해 10번 발판 아래 불필요한 빈 스크롤 영역을 제거하고 마지막 요소 기준으로 자연스럽게 스크롤이 끝나도록 조정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-16 | scope: stage-character-animation | type: implementation | 스테이지 영역 캐릭터를 hamster_char1~8 프레임 애니메이션으로 구성하고 보상 화면에서 스테이지로 복귀할 때 한 번 재생 후 기본 hamster_char로 복귀하도록 구현 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-scroll-lock | type: fix | 스테이지 페이지 높이를 100dvh로 고정하고 내부 발판 영역만 스크롤되도록 min-height 제약을 조정해 topbar, 재화, 하단 메뉴가 브라우저 스크롤 영향 없이 고정되게 보정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-overlay-pinning | type: fix | 스테이지 페이지에서 topbar, 재화 3종, 하단 메뉴를 발판 스크롤 레이어 밖의 상단·하단 오버레이로 분리해 가시영역에서 사라지지 않도록 고정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-page-scroll | type: fix | 스테이지 페이지의 스크롤 기준을 내부 section이 아닌 페이지 전체로 변경해 topbar, 재화, 하단 메뉴가 같은 흐름으로 함께 움직이도록 수정하고 공용 상단바의 메뉴 아이콘 기본값 제거 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-scroll-sync | type: fix | 스테이지 페이지에서 topbar, 우측 재화 카운터, 하단 메뉴를 모두 스크롤 콘텐츠 안으로 이동해 드래그 시 함께 움직이도록 수정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-topbar-simplify | type: fix | stage topbar에서 난이도 문구를 제거하고 현재 단계 문구만 중앙에 배치하도록 단순화 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-topbar-layout | type: fix | stage topbar 텍스트를 중앙 배치 대신 화살표 오른쪽 좌측 정렬 레이아웃으로 재배치하고 난이도·단계 문구 위치를 기준 이미지처럼 절대 좌표로 보정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-topbar-alignment | type: fix | stage topbar 안 텍스트가 경계선에 붙지 않도록 난이도 글자 크기를 더 줄이고 단계 문구를 안쪽 여백으로 이동해 정렬 보정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-topbar-overlay | type: fix | topbar 이미지 위 화살표 오버레이를 완전히 제거하고 좌측 클릭 영역만 남겼으며 난이도·스테이지 텍스트 크기와 패딩을 줄여 상자 밖으로 넘치지 않도록 조정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-topbar-copy | type: fix | 스테이지 topbar의 검은 텍스트 화살표를 제거하고 SVG 뒤로가기 아이콘으로 교체했으며 난이도와 현재 스테이지를 2줄 구조로 분리해 topbar 안에 표시 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-topbar-container | type: fix | 스테이지 topbar를 화면 바깥 헤더에서 제거하고 스테이지 영역 폼 내부 스크롤 컨테이너로 이동해 맵 구조 안에서 보이도록 조정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-scroll-layout | type: fix | 스테이지 맵에서 메뉴 버튼을 제거하고 topbar 제목이 한 줄로 안정적으로 들어가도록 조정했으며 발바닥 노드를 확대하고 드래그로 다음 스테이지가 보이는 세로 스크롤 구조로 변경 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-ui-restore | type: fix | 스테이지 화면 하단 이동 UI를 복구하고 말랑이 가이드 카드와 텍스트를 제거해 햄스터 배경형 캐릭터만 유지 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: ui-shell | type: implementation | 홈, 난이도 선택, 스테이지맵, 퀴즈, 결과, 보상 화면을 한국어 기반 귀여운 모바일 게임 UI로 재구성하고 StageMap 배경 레퍼런스 자산 및 공용 UI 컴포넌트 추가 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: maraning-assets | type: implementation | maraning_assets_final.zip 이미지를 public/assets/maraning으로 등록하고 홈, 난이도 선택, 스테이지맵, 퀴즈, 결과, 보상 화면 및 공용 컴포넌트에 topbar, 햄스터, 발바닥, 하단 내비게이션, 체력 에셋 적용 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-ui-fix | type: fix | topbar 이미지를 StageMap 전용으로 제한하고 광고보기·공유하기 라우팅 제거, 스테이지 노드와 캐릭터 배치를 재조정해 순차 진행 상태가 보이도록 수정 | docs/tests updated: docs/quality/changelog.md
- 2026-05-15 | scope: stage-map-layout | type: fix | 메뉴 버튼을 독립 토글용 버튼으로 분리하고 StageMap 상단 상태 아이콘, 발판 순서, 햄스터, 보상 상자 위치를 레퍼런스 구도에 맞춰 재배치 | docs/tests updated: docs/quality/changelog.md

## Pending Notes

- 아직 구현 전 단계에서는 문서 기준선 확정 내역을 우선 기록 대상으로 본다.
- 구현이 시작되면 문서 변경과 실제 동작 변경을 구분해 기록한다.
