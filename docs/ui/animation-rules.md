# Animation Rules

## Motion Principles

- 애니메이션은 귀여운 UX 를 강화하되 학습 속도를 늦추면 안 된다.
- 모든 모션은 상태 변화 설명에 기여해야 한다.
- 반응은 즉시 느껴져야 하고 길게 남지 않아야 한다.
- 반복 학습 루프에 맞게 부담 없는 짧은 motion language 를 유지한다.

## Timing Rules

- `tap scale`: `80ms` to `120ms`
- `pop`: `160ms` to `220ms`
- `bounce`: `220ms` to `320ms`
- `shake`: `180ms` to `260ms`
- 화면 전환 기본 timing: `180ms` to `260ms`
- `Result` 와 `Reward` 진입 애니메이션은 `300ms` 를 넘기지 않는다.

## Transition Types

### tap scale

- 버튼, 선택지, Stage 노드 탭 반응에 사용한다.
- 눌림 감각을 즉시 주고 바로 원래 크기로 돌아와야 한다.

### pop

- 보상 배지, 정답 표시, 작은 상태 등장에 사용한다.
- 짧고 경쾌하게 나타나야 한다.

### bounce

- 캐릭터의 가벼운 성공 반응이나 `jelly` 회복 강조에 사용한다.
- 과도한 반복은 금지한다.

### shake

- 잘못된 선택, `locked` Stage 접근, `jelly` 부족 같은 거부 피드백에 사용한다.
- 위협적이지 않은 짧은 흔들림이어야 한다.

## Feedback Animations

- 정답 선택 시 `pop` 또는 작은 `bounce` 를 사용한다.
- 오답 선택 시 짧은 `shake` 로 즉시 피드백한다.
- CTA 버튼은 `tap scale` 을 기본 반응으로 사용한다.
- `Reward` 화면 진입 시 보상 카드나 캐릭터에 한 번의 `pop` 또는 `bounce` 를 사용할 수 있다.
- `Splash` 는 긴 로고 시퀀스보다 짧은 등장 애니메이션 하나로 끝내야 한다.

## Performance Constraints

- 애니메이션은 WebView 환경에서 부드럽게 동작해야 한다.
- 동시에 여러 큰 요소를 흔들거나 튀기지 않는다.
- 레이아웃 재계산이 큰 모션보다 transform 중심 모션을 우선한다.
- 연속 퀴즈 플레이 중 같은 애니메이션이 과하게 반복되어 피로를 주면 안 된다.

## Forbidden Motion

- 시험 앱처럼 딱딱한 무반응 전환은 피한다.
- 긴 인트로 애니메이션은 금지한다.
- 정답 확인 전에 과도한 축하 연출은 금지한다.
- 작은 버튼에 과한 bounce 를 넣어 조작성을 해치면 안 된다.
