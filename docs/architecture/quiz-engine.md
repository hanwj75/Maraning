# Quiz Engine

## Responsibilities

- `Quiz Engine` 은 `Quiz` 데이터를 읽고 사용자 입력을 해석한다.
- 지원 문제 타입은 `image_select`, `matching`, `word_order`, `blank_fill` 이다.
- MVP 에서 `typing` 문제는 비활성 상태이며 엔진 책임 범위에 포함하지 않는다.
- 엔진은 정답 판정, 입력 정규화, 결과 반환을 담당한다.
- 엔진은 LLM 호출 없이 데이터 기반 규칙만으로 동작해야 한다.
- 엔진은 `Quiz` 가 속한 `Stage` 의 학습 목표 일관성을 전제로 동작한다.
- 엔진은 Stage당 정확히 `10`개의 `Quiz` 가 연결된다는 정책과 충돌하지 않아야 한다.

## Stage Target Alignment

- 모든 `Quiz` 는 `stageId` 와 함께 `learningTargetId` 또는 `targetKey` 로 `Stage` 의 학습 목표와 연결되어야 한다.
- 모든 `Quiz` 는 별도의 `question` 필드를 가져야 하며, 학습 설명이나 Stage 설명을 질문 대신 재사용하면 안 된다.
- 하나의 `Stage` 안에서 `Quiz` 들이 서로 다른 학습 목표를 참조하면 안 된다.
- 엔진은 문제 타입이 달라도 같은 목표를 반복 학습하는 데이터 구성을 전제로 한다.
- `Quiz` 가 속한 `Stage.learningTarget` 과 무관한 정답 데이터는 허용하지 않는다.

## Repetition Learning Contract

- 한 `Stage` 는 정확히 `10`개의 `Quiz` 를 가진다.
- 이 `10`문제는 같은 목표를 다양한 형식으로 반복 확인하는 용도다.
- 예를 들어 `apple` Stage 라면 선택형, 매칭형, 순서 배열형, 빈칸형이 모두 `apple` 또는 해당 문장 목표를 강화해야 한다.
- 엔진은 문제 형식만 바꾸고 목표는 유지하는 구조를 처리해야 한다.
- Stage 내부에서 중구난방 주제 전환을 보정하거나 허용하지 않는다.

## Validator Rules

- 모든 정답 판정은 `deterministic validation` 이어야 한다.
- 같은 입력과 같은 정답 데이터는 항상 같은 결과를 반환해야 한다.
- `LLM validation` 은 금지한다.
- 외부 추론, 의미 유사도, 자유 해석 기반 판정은 허용하지 않는다.
- 필요한 경우 대소문자 무시는 허용한다.
- 대소문자 무시 여부는 문제 타입별 공통 규칙 또는 각 퀴즈 메타데이터로 제어할 수 있다.
- 문자열 비교 시 앞뒤 공백 제거와 대소문자 무시를 동일 규칙으로 적용한다.

## Fail Life Policy

- `QuizSession` 은 Stage 시작 시 `failLife = 3` 으로 시작한다.
- `QuizSession` 은 Stage 시작 시 `noFailStreak = 0` 으로 시작한다.
- 오답 제출 시 `failLife` 를 `1` 감소시킨다.
- 오답 제출 시 `noFailStreak` 를 `0`으로 초기화한다.
- 오답이어도 다음 문제로 자동 이동하지 않는다.
- `failLife > 0` 이면 같은 문제를 다시 풀 수 있어야 한다.
- `failLife = 0` 이 되는 순간 해당 Stage 는 실패 처리되고 세션은 종료된다.
- 정답 제출 시 `noFailStreak` 를 증가시키고, `5`문제 연속 무실패 해결 시 `jelly` `1~3` 랜덤 보상 트리거를 발생시킨다.
- Stage 실패는 `completed` 처리나 다음 Stage `unlock` 에 영향을 주지 않는다.

## Type Handling

### image_select

- 사용자는 여러 선택지 중 하나를 고른다.
- 원본 `choices` 데이터 순서는 저장용 기준일 뿐, 화면 표시 전에는 shuffle 된다.
- 판정은 화면 위치나 index 가 아니라 선택한 값과 정답 값의 일치 여부로 처리한다.
- 선택지는 항상 `4~6`개여야 한다.
- 영어 학습 목적상 문제 또는 선택지 중 최소 한쪽에는 영어가 포함되어야 한다.
- 한국어 문제와 한국어 선택지만으로 구성된 조합은 금지한다.

### matching

- 사용자는 좌우 항목의 연결 쌍을 만든다.
- 사용자는 왼쪽 한국어 카드 하나와 오른쪽 영어 카드 하나를 차례대로 선택해 pair 를 만든다.
- 제출 전까지 연결 상태를 자유롭게 수정할 수 있어야 한다.
- 이미 연결된 카드를 다시 클릭하면 해당 pair 연결이 해제되어야 한다.
- 이미 연결된 카드로 새 pair 를 만들면 기존 연결은 제거되고 새 연결로 교체되어야 한다.
- 하나의 카드는 동시에 여러 pair 에 포함될 수 없다.
- 정답 판정은 제출 버튼을 눌렀을 때만 실행되어야 한다.
- 별도의 선이나 화살표를 그리는 UI 는 만들지 않는다.
- 원본 `pairs` 관계는 유지한 채, 왼쪽 한국어 카드와 오른쪽 영어 카드 표시 순서만 각각 독립적으로 shuffle 한다.
- 판정은 제출된 모든 pair 집합이 정답 pair 집합과 정확히 일치하는지로 처리한다.
- `matching` 문제는 최소 `3`쌍의 pair 를 가져야 한다.
- 각 pair 는 왼쪽 영어 표현과 오른쪽 한국어 뜻을 연결해야 한다.
- 같은 Stage 의 학습 목표 pair 를 반드시 포함하고, 나머지는 distractor pair 로 구성한다.

### word_order

- 사용자는 주어진 토큰을 올바른 순서로 배열한다.
- 화면에 보이는 token 카드는 `QuizSession` 시작 시 shuffle 한다.
- 판정은 제출 순서 배열이 정답 순서 배열과 동일한지로 처리한다.
- `answer.orderedTokens` 원본 순서는 유지해야 하며, display token 순서로 덮어쓰면 안 된다.
- 대소문자 무시가 활성화되면 비교 전 정규화한다.
- `answer.orderedTokens.length` 는 최소 `4` 이어야 한다. 3토큰 이하의 문장은 배열 문제로 부적합하다.

### blank_fill

- 사용자는 빈칸에 문자열 답안을 입력하거나 선택한다.
- 선택형 `blank_fill` 의 `choices` 는 화면 표시 전에 shuffle 한다.
- `blank_fill` 의 `question` 은 사용자가 무엇을 넣어야 하는지 명확히 알려야 한다.
- 단어형이면 `"사과"` 같은 목표 한국어 의미를, 문장형이면 `"이것은 사과입니다"` 같은 전체 한국어 뜻을 `question` 에 포함해야 한다.
- `빈칸에 알맞은 영어 단어를 입력해 주세요` 같은 추상 문구만으로 `question` 을 구성하면 안 된다.
- Stage 설명이나 학습 목표 설명을 `question` 대용으로 생략해서는 안 되며, `question` 자체가 빈칸 목표 의미를 직접 설명해야 한다.
- 판정은 정규화된 사용자 입력과 허용 답안 목록의 일치 여부로 처리한다.
- 대소문자 무시가 활성화되면 비교 전 소문자 기준 등으로 정규화한다.
- `blank_fill` 문장 템플릿은 영어 문장이어야 한다.
- 선택형 `blank_fill` 은 영어 보기 `4~6`개를 제공해야 한다.
- 한국어 문장 빈칸 + 한국어 보기 조합은 금지한다.

### Other Choice-Based Types

- `sentence_choice`, `vocabulary_choice`, `grammar_choice` 같은 추가 선택형 문제도 동일한 정책을 따른다.
- 즉, 원본 `choices` 배열은 유지하고 화면 표시 순서만 shuffle 한다.
- 정답 판정은 위치나 index 가 아니라 값 기준으로 처리한다.

## Input Output Model

- 입력은 `quizType`, 문제 데이터, 사용자 응답으로 구성된다.
- 출력은 최소한 `isCorrect`, `normalizedAnswer`, `expectedAnswerRef`, `reasonCode` 를 포함해야 한다.
- `reasonCode` 는 UI 피드백과 디버깅을 위한 결정론적 결과 코드를 뜻한다.
- 출력은 난이도나 다른 Stage 진행 상태에 의존하지 않는다.
- 출력은 현재 `Quiz` 가 어떤 `Stage` 학습 목표에 연결되었는지 추적 가능한 참조를 유지하는 편이 바람직하다.

## Normalization Policy

- 문자열 비교가 필요한 타입은 비교 전에 정규화 단계를 거친다.
- MVP 허용 정규화는 앞뒤 공백 제거와 대소문자 무시로 제한한다.
- 구두점 제거, 의미 해석 확장은 기본값으로 허용하지 않는다.
- 정규화 규칙은 입력과 정답에 동일하게 적용해야 한다.

## Runtime Flow

- `Quiz` 데이터를 로드한다.
- `QuizSession` 시작 시 모든 선택형 문제의 `displayChoices`, `word_order` 의 display tokens, `matching` 의 좌우 표시 순서를 생성한다.
- 생성된 shuffle 결과는 같은 `QuizSession` 안에서 유지하고, 오답 후 같은 문제에 머무를 때도 바꾸지 않는다.
- 제출 전 현재 `jelly` 잔량을 확인한다.
- `jelly > 0` 이면 제출 시점에 `jelly` `1` 차감을 먼저 반영한다.
- `jelly = 0` 이면 제출을 차단하고 StageMap 또는 회복 안내로 보낸다.
- `quizType` 에 따라 전용 validator 를 선택한다.
- `stageId` 와 `learningTargetId` 또는 `targetKey` 연결을 확인한다.
- 필요한 정규화를 수행한다.
- 정답 데이터를 기준으로 비교한다.
- 오답이면 `failLife` 감소 후 같은 문제 유지 또는 Stage 실패를 계산한다.
- 결과 객체를 반환한다.
- 반환 결과는 보상, 피드백, 진행도 반영의 입력으로 사용된다.

## Non Goals

- 자유 서술형 문장의 의미 평가.
- LLM 또는 AI 기반 정답 추론.
- 오타 보정과 유사도 기반 채점.
- `typing` 문제 지원.

## Open Questions

- `blank_fill` 에서 복수 허용 답안을 어느 수준까지 허용할지 여부.
- `word_order` 에서 동일 의미 복수 정답 순서를 허용할지 여부.
