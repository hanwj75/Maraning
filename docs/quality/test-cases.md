# Test Cases

## Functional Cases

- `Home` 에서 `DifficultySelect` 로 진입 가능해야 한다.
- 난이도 선택 후 해당 난이도 `StageMap` 으로 이동해야 한다.
- 첫 Stage 는 `unlocked`, 이후 Stage 는 기본적으로 `locked` 여야 한다.
- 선행 Stage 완료 후 다음 Stage 가 `unlocked` 되어야 한다.
- `completed` Stage 는 replay 가능해야 한다.
- `image_select`, `matching`, `word_order`, `blank_fill` 각각이 결정론적으로 채점되어야 한다.
- `word_order` 와 `blank_fill` 은 대소문자 무시 옵션을 지원해야 한다.
- Stage 시작만으로는 `jelly` 감소가 발생하지 않아야 한다.
- 문제 제출 `1`회마다 `jelly` `1` 감소가 발생해야 한다.
- `failLife` 감소 없이 `5`문제 해결 시 `jelly` `1~3` 보상이 발생해야 한다.
- 광고보기 mock 클릭 시 `jelly` `5` 회복이 발생해야 한다.
- 광고보기 버튼 클릭만으로는 즉시 지급되지 않고 `광고를 보시겠습니까?` 팝업의 `yes` 이후에만 `jelly` `5` 회복이 발생해야 한다.
- 오답 후 `failLife` 가 `2`가 되면 `hamster_fail_life_state2` 애니메이션이 실행되고 하트 아래 캐릭터는 `hamster_char_fail1` 상태로 유지되어야 한다.
- 오답 후 `failLife` 가 `1`이 되면 `hamster_fail_life_state1` 애니메이션이 실행되고 하트 아래 캐릭터는 `hamster_char_fail2` 상태로 유지되어야 한다.
- 실패 애니메이션은 실제 시트 기준으로 `state1 = 5 x 2 / 10프레임`, `state2 = 4 x 2 / 8프레임`을 한 프레임씩 재생해야 하며 이전 또는 다음 프레임이 동시에 보이면 안 된다.
- `Reward` 후 동일 난이도 `StageMap` 으로 복귀 가능해야 한다.

## Edge Cases

- `jelly = 0` 일 때 제출이 차단되어야 한다.
- 스테이지 클리어 또는 실패로 `Quiz` 화면을 벗어나면 실패 캐릭터 이미지는 기본 `hamster_char` 로 복구되고 진행 중 애니메이션 타이머는 정리되어야 한다.
- `jelly = 0` 일 때 제출하면 `광고를 보면 젤리5개를 드려요!` 팝업이 떠야 한다.
- 위 팝업에서 `yes`를 누르면 Quiz 화면을 유지한 채 `jelly` `5` 회복이 발생해야 한다.
- 위 팝업에서 `no`를 누르면 `StageMap` 으로 이동해야 한다.
- 날짜가 바뀌었고 `jelly < 20` 이면 `20`으로 회복되어야 한다.
- 날짜가 바뀌었고 `jelly >= 20` 이면 그대로 유지되어야 한다.
- 광고 또는 무실패 보상 후 `jelly` 가 내부 상한 `100` 을 넘지 않아야 한다.
- Quiz 와 StageMap 상단에서 `jelly` UI 가 한 번만 표시되고 `젤리 {current}` 한 줄 형식을 유지해야 한다.
- Quiz 화면에서 하트는 캐릭터 머리 위에 떠 있고 별도 박스나 설명 텍스트가 노출되지 않아야 한다.
- 존재하지 않는 `requiredStageId` 는 데이터 오류로 처리되어야 한다.
- 다른 난이도의 completed state 가 현재 난이도 해금에 영향을 주면 안 된다.
- SDK 가 없는 환경에서도 로컬 흐름이 유지되어야 한다.
- `localStorage` 접근 실패 시에도 메모리 상태로 최소 동작이 가능해야 한다.

## Regression Cases

- 난이도 전환 후 기존 난이도 progress 가 유지되어야 한다.
- Stage replay 후에도 `completed` 상태가 유지되어야 한다.
- 오답 피드백이 결과를 모호하게 만들면 안 된다.
- SDK wrapper 변경 후 component direct SDK call 이 생기면 안 된다.
- 문서 규칙 변경 후 관련 acceptance criteria 와 changelog 누락이 없어야 한다.

## Traceability

- 사용자 흐름 관련 테스트는 `docs/product/user-flow.md` 와 연결된다.
- 난이도 및 progress 테스트는 `docs/architecture/difficulty-policy.md`, `docs/architecture/stage-system.md` 와 연결된다.
- 퀴즈 판정 테스트는 `docs/architecture/quiz-engine.md`, `docs/data/quiz-data-schema.md` 와 연결된다.
- 상태 및 SDK 경계 테스트는 `docs/architecture/state-management.md`, `docs/architecture/appintos-webview-sdk.md` 와 연결된다.
- 보상과 캐릭터 관련 테스트는 `docs/architecture/reward-system.md`, `docs/architecture/character-system.md` 와 연결된다.
