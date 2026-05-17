# Screen Spec

## Screen List

- `Splash`
- `Home`
- `DifficultySelect`
- `StageMap`
- `Quiz`
- `Result`
- `Reward`

## Screen Responsibilities

### Splash

- 앱 진입 직후 로딩과 브랜드 분위기를 짧게 전달한다.
- 상태 복원, SDK 준비 여부, 초기 라우팅 판단의 대기 화면 역할을 가진다.
- 체류 시간은 매우 짧아야 한다.

### Home

- 학습 진입점 역할을 한다.
- 현재 `jelly` 상태와 귀여운 캐릭터 분위기를 빠르게 보여준다.
- 다음 행동은 `DifficultySelect` 진입이어야 한다.

### DifficultySelect

- 사용자가 난이도 트랙을 고르는 화면이다.
- 각 난이도는 독립 진행이라는 점이 시각적으로 드러나야 한다.
- 선택 후 해당 난이도 `StageMap` 으로 이동한다.

### StageMap

- 현재 난이도의 Stage 진행 구조를 보여준다.
- 각 Stage 의 `locked`, `unlocked`, `completed` 상태를 명확히 구분한다.
- 사용자는 여기서 Stage 시작, replay, `jelly` 상태 확인을 한다.

### Quiz

- 실제 문제 풀이 화면이다.
- 문제는 한 번에 한 핵심 과제만 보여야 한다.
- 선택, 정렬, 매칭, 빈칸 입력 등 상호작용은 즉시 이해 가능해야 한다.
- 권장 순서는 `상단 바 -> 질문 카드 -> 보기/입력 영역 -> 제출하기 버튼 -> 캐릭터/하트 영역` 이다.
- 상단 `jelly` 표시는 한 화면에 하나만 허용하며 `젤리 {current}` 한 줄만 노출한다.
- 캐릭터와 하트는 제출하기 버튼 아래에 위치해야 하며 보기 영역을 가리면 안 된다.
- 캐릭터 영역은 별도 카드 없이 이미지와 하트만 남기고, 캐릭터 아래 설명 텍스트를 두지 않는다.
- `matching` 은 카드 선택 기반으로 동작해야 하며 별도의 선이나 화살표를 그리지 않는다.

### Result

- 개별 문제 또는 짧은 문제 묶음의 판정 결과를 짧게 보여주는 화면이다.
- 정답 여부와 캐릭터 반응을 빠르게 보여주고 다음 진행으로 넘긴다.
- 체류 시간은 길지 않아야 하며 학습 흐름을 끊지 않아야 한다.

### Reward

- Stage 완료 후 진행 성과와 다음 행동을 보여준다.
- 해금 결과, 완료 감각, 보상 관련 안내를 여기서 처리한다.
- 사용자를 같은 난이도 `StageMap` 또는 다음 루프로 되돌린다.

## Navigation Rules

- 기본 축은 `Splash -> Home -> DifficultySelect -> StageMap -> Quiz -> Result -> Reward` 다.
- `Result` 는 짧은 중간 판정 계층이며, 필요 시 `Quiz` 내부 오버레이 또는 별도 화면으로 해석할 수 있다.
- `Reward` 이후에는 동일 난이도 `StageMap` 으로 돌아가는 흐름을 기본값으로 둔다.
- `locked` Stage 는 `StageMap` 에서 보이더라도 진입할 수 없다.
- `completed` Stage 는 replay 가능해야 한다.

## Role Rules

- `Splash` 는 정보 전달보다 준비 상태 전환이 우선이다.
- `Home` 은 설명 화면이 아니라 시작 화면이다.
- `DifficultySelect` 는 비교보다 선택 속도가 우선이다.
- `StageMap` 은 진행 구조를 보여주되 복잡한 메타 정보는 줄여야 한다.
- `Quiz` 는 학습 핵심 화면이므로 잡음 요소를 최소화해야 한다.
- `Result` 와 `Reward` 는 분명히 다르다.
  `Result` 는 즉시 판정 피드백, `Reward` 는 Stage 완료 후 성과 정리다.

## Edge States

- `jelly` 부족 시 `StageMap` 에서 Stage 시작 불가 상태를 명확히 보여준다.
- SDK 준비 실패가 있더라도 `Home` 진입과 로컬 학습 흐름은 가능한 범위에서 유지한다.
- 데이터 로드 중에는 `Splash` 또는 경량 로딩 상태를 사용한다.
- 긴 설명 모달로 문제를 해결하려 하지 않는다.
