# Test Cases

## Functional Cases

- `Home` 에서 `DifficultySelect` 로 진입 가능해야 한다.
- 하단 내비게이션의 `마이페이지` 버튼으로 `/mypage` 진입 가능해야 한다.
- 하단 내비게이션의 `공유하기` 버튼으로 현재 스테이지 공유 모달을 열 수 있어야 한다.
- 난이도 선택 후 해당 난이도 `ChapterMap` 으로 이동해야 한다.
- 첫 Chapter 는 `unlocked`, 이후 Chapter 는 기본적으로 `locked` 여야 한다.
- 한 `Chapter` 를 완료해도 바로 다음 `Chapter` `1`개만 열리고 그 이후 `Chapter` 는 계속 `locked` 여야 한다.
- `unlocked` Chapter 를 선택하면 해당 `Chapter` 의 `StageMap` 으로 이동해야 한다.
- 첫 Stage 는 각 `unlocked Chapter` 안에서 `unlocked`, 이후 Stage 는 기본적으로 `locked` 여야 한다.
- 선행 Stage 완료 후 같은 Chapter 안의 다음 Stage 가 `unlocked` 되어야 한다.
- 현재 Chapter 의 Stage 를 모두 완료하면 다음 Chapter 가 `unlocked` 되어야 한다.
- `completed` Stage 는 replay 가능해야 한다.
- `image_select`, `matching`, `word_order`, `blank_fill` 각각이 결정론적으로 채점되어야 한다.
- 모든 choices 기반 문제는 `QuizSession` 시작 시 display 순서가 shuffle 되어야 한다.
- 문장 선택형 문제도 display sentence card 순서가 shuffle 되어야 한다.
- choices 기반 문제는 정답 위치가 바뀌어도 `answer value` 기준으로 정답 판정이 유지되어야 한다.
- `word_order` 는 display token 카드가 shuffle 되어야 하고 `answerTokens` 원본 순서는 유지되어야 한다.
- `word_order` 는 토큰이 최소 `4`개여야 하며 `3`개 이하인 문제는 유효하지 않다.
- `matching` 은 원본 pair 관계를 유지한 채 왼쪽 한국어 카드와 오른쪽 영어 카드 표시 순서만 각각 shuffle 되어야 한다.
- `matching` 에서 잘못 연결한 pair 는 제출 전에 다시 해제할 수 있어야 한다.
- `matching` 에서 왼쪽 카드를 다시 클릭하면 기존 연결이 해제되어야 한다.
- `matching` 에서 오른쪽 카드를 다시 클릭하면 기존 연결이 해제되어야 한다.
- `matching` 에서 이미 연결된 카드를 다른 카드와 연결하면 기존 연결이 교체되어야 한다.
- `blank_fill` 문제는 `question` 만 보고도 무엇을 넣어야 하는지 알 수 있도록 목표 한국어 의미나 문장 뜻을 포함해야 한다.
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
- `Reward` 후 방금 플레이한 `Chapter` 의 `StageMap` 으로 복귀 가능해야 한다.
- `MyPage` 에서 기본 사용자 이름 `말랑이 친구` 가 표시되어야 한다.
- `MyPage` 에서 현재 진행 중인 스테이지가 `챕터N : N스테이지` 형식으로 표시되어야 한다.
- 공유 모달에 기본 닉네임과 현재 스테이지가 표시되어야 한다.
- 공유 모달에는 카카오톡, 인스타그램, 트위터 버튼이 보여야 한다.
- 카카오톡과 인스타그램 공유는 최소한 공유 문구 복사 fallback 이 동작해야 한다.
- 트위터 공유는 intent URL 또는 복사 fallback 이 동작해야 한다.
- 로그인 상태에서는 wallet 조회가 Supabase `GET /wallet` 결과로 동기화되어야 한다.
- 로그인 상태에서는 stage complete 가 Supabase `POST /progress/stage-complete` 성공 후에만 반영되어야 한다.
- 광고 보상은 Supabase `POST /ad-reward/complete` 성공 후에만 `jelly +5` 가 반영되어야 한다.
- 결제 검증 미구현 상태에서는 `payments/verify` 가 젤리 지급 없이 disabled 응답을 반환해야 한다.

## Edge Cases

- `jelly = 0` 일 때 제출이 차단되어야 한다.
- 같은 StageSession 안에서는 오답 후 같은 문제를 다시 풀 때 보기 위치가 바뀌면 안 된다.
- `matching` 은 제출 전까지 오답 처리되지 않고 제출 시점에만 판정되어야 한다.
- `blank_fill` 에서 `This is a ___` 같은 prompt 만으로 정답 의미가 드러나지 않으면 `question` 에서 그 의미를 직접 설명해야 한다.
- `locked Chapter` 는 클릭할 수 없어야 한다.
- `locked Chapter` 를 직접 URL 로 열어도 `StageMap` 진입이 차단되어야 한다.
- `MyPage` 조회 시 `currentStageId` 또는 `currentChapterId` 가 유효하지 않아도 앱이 깨지지 않고 fallback 문구를 보여야 한다.
- 공유 모달에서도 현재 스테이지 정보가 없을 때 앱이 깨지지 않고 fallback 문구를 보여야 한다.
- 스테이지 클리어 또는 실패로 `Quiz` 화면을 벗어나면 실패 캐릭터 이미지는 기본 `hamster_char` 로 복구되고 진행 중 애니메이션 타이머는 정리되어야 한다.
- `jelly = 0` 일 때 제출하면 `광고를 보면 젤리5개를 드려요!` 팝업이 떠야 한다.
- 위 팝업에서 `yes`를 누르면 Quiz 화면을 유지한 채 `jelly` `5` 회복이 발생해야 한다.
- 위 팝업에서 `no`를 누르면 `StageMap` 으로 이동해야 한다.
- 날짜가 바뀌었고 `jelly < 20` 이면 `20`으로 회복되어야 한다.
- 날짜가 바뀌었고 `jelly >= 20` 이면 그대로 유지되어야 한다.
- 광고 또는 무실패 보상 후 `jelly` 가 내부 상한 `100` 을 넘지 않아야 한다.
- Quiz 와 StageMap 상단에서 `jelly` UI 가 한 번만 표시되고 `젤리 {current}` 한 줄 형식을 유지해야 한다.
- Quiz 화면에서 하트는 캐릭터 머리 위에 떠 있고 별도 박스나 설명 텍스트가 노출되지 않아야 한다.
- `StageMap` 은 현재 `chapterId` 에 속한 `Stage` 만 보여야 한다.
- 존재하지 않는 `requiredStageId` 는 데이터 오류로 처리되어야 한다.
- 존재하지 않는 `requiredChapterId` 는 데이터 오류로 처리되어야 한다.
- 다른 난이도의 completed state 가 현재 난이도 해금에 영향을 주면 안 된다.
- SDK 가 없는 환경에서도 로컬 흐름이 유지되어야 한다.
- `localStorage` 접근 실패 시에도 메모리 상태로 최소 동작이 가능해야 한다.
- production 로그인 상태에서 local fallback 이 서버 권위 데이터를 우회하면 안 된다.
- `VITE_` env 로 service role key 나 Toss secret 을 주입하지 않아야 한다.
- Toss `accessToken` / `refreshToken` 이 프론트 login 응답에 포함되면 안 된다.
- 광고 보상 중복 `adEventId`, 일일 제한 초과, 쿨다운 중에는 지급이 없어야 한다.

## Regression Cases

- 난이도 전환 후 기존 난이도 progress 가 유지되어야 한다.
- `Chapter` 실패나 `failLife = 0` 실패는 `Chapter` 와 `Stage` progress 를 바꾸면 안 된다.
- Stage replay 후에도 `completed` 상태가 유지되어야 한다.
- 오답 피드백이 결과를 모호하게 만들면 안 된다.
- SDK wrapper 변경 후 component direct SDK call 이 생기면 안 된다.
- 문서 규칙 변경 후 관련 acceptance criteria 와 changelog 누락이 없어야 한다.
- Supabase Edge Functions 전환 후 별도 Express/Nest/Railway/EC2 서버 전제 코드가 생기면 안 된다.

## Traceability

- 사용자 흐름 관련 테스트는 `docs/product/user-flow.md` 와 연결된다.
- 난이도 및 progress 테스트는 `docs/architecture/difficulty-policy.md`, `docs/architecture/stage-system.md` 와 연결된다.
- 퀴즈 판정 테스트는 `docs/architecture/quiz-engine.md`, `docs/data/quiz-data-schema.md` 와 연결된다.
- 상태 및 SDK 경계 테스트는 `docs/architecture/state-management.md`, `docs/architecture/appintos-webview-sdk.md` 와 연결된다.
- 보상과 캐릭터 관련 테스트는 `docs/architecture/reward-system.md`, `docs/architecture/character-system.md` 와 연결된다.
