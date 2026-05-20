# State Management

## State Domains

- 상태 관리는 `Zustand` 기반으로 설계한다.
- 전역 상태는 화면 표현용 임시 상태와 도메인 진행 상태를 구분해야 한다.
- 핵심 도메인 상태는 `difficulty selection`, `chapter/stage progress`, `jelly`, `current session`, `ui feedback` 로 나눈다.

## Progress Structure

- `Progress` 는 난이도별로 분리된 구조를 가진다.
- 각 난이도는 자신의 `DifficultyTrack` 진행도만 저장한다.
- 권장 구조는 난이도 키 기준 맵 형태다.

```json
{
  "selectedDifficulty": "absolute_beginner",
  "jelly": {
    "current": 18,
    "max": 100,
    "lastRefillDateKey": "2026-05-17"
  },
  "progressByDifficulty": {
    "absolute_beginner": {
      "currentChapterId": "absolute_beginner_chapter_001",
      "currentStageId": "ab.stage.002",
      "unlockedChapterIds": ["absolute_beginner_chapter_001"],
      "completedChapterIds": [],
      "unlockedStageIdsByChapter": {
        "absolute_beginner_chapter_001": ["ab.stage.001", "ab.stage.002"]
      },
      "completedStageIdsByChapter": {
        "absolute_beginner_chapter_001": ["ab.stage.001"]
      },
      "lastPlayedAt": "2026-05-19T10:00:00.000Z"
    },
    "beginner": {
      "currentChapterId": "beginner_chapter_001",
      "currentStageId": "bg.stage.001",
      "unlockedChapterIds": ["beginner_chapter_001"],
      "completedChapterIds": [],
      "unlockedStageIdsByChapter": {
        "beginner_chapter_001": ["bg.stage.001"]
      },
      "completedStageIdsByChapter": {},
      "lastPlayedAt": null
    }
  },
  "session": {
    "activeStageId": null,
    "activeQuizId": null,
    "failLife": 3,
    "noFailStreak": 0
  }
}
```

## Store Boundaries

- `selectedDifficulty` 는 현재 사용자가 보고 있는 난이도 컨텍스트다.
- `progressByDifficulty` 는 난이도별 독립 진행도를 저장한다.
- 각 난이도 진행도는 `Chapter` 해금/완료와 `Stage` 해금/완료를 함께 저장한다.
- `jelly` 는 모든 난이도가 공유하는 전역 자원 상태다.
- `session` 은 현재 플레이 중인 Stage 와 Quiz 같은 휘발성 상태다.
- 캐릭터 반응과 일시 UI 상태는 도메인 진행도와 분리해 다룬다.

## Update Rules

- `selectedDifficulty` 변경은 다른 난이도의 `Progress` 를 수정하지 않는다.
- Stage 완료 시 현재 난이도의 해당 `Chapter` 안 `completedStageIdsByChapter`, `unlockedStageIdsByChapter` 만 갱신한다.
- 현재 `Chapter` 의 모든 `Stage` 완료 시 `completedChapterIds` 와 `unlockedChapterIds` 가 갱신된다.
- `unlockedChapterIds` 는 첫 `Chapter` 와, 직전 `Chapter` 가 완료된 바로 다음 `Chapter` 까지만 포함해야 한다.
- 어떤 시점에도 아직 선행 `Chapter` 를 완료하지 않은 뒤쪽 `Chapter` 가 미리 열리면 안 된다.
- Stage 시작 시 `jelly.current` 는 감소하지 않는다.
- 답안 제출 시 `jelly.current` 를 `1` 감소시킨다.
- 오답 제출 시 `session.failLife` 를 `1` 감소시키고 같은 문제에 머문다.
- 정답 제출 시 `session.noFailStreak` 를 `1` 증가시킨다.
- 오답 제출 시 `session.noFailStreak` 는 `0`으로 초기화된다.
- `session.noFailStreak = 5` 가 되면 `jelly` `1~3`개를 보상하고 streak 를 `0`으로 초기화한다.
- `session.failLife = 0` 이 되면 현재 Stage 세션을 종료하고 StageMap 으로 되돌린다.
- `session.failLife = 0` 이 되더라도 `Chapter` 와 `Stage` 진행도는 바뀌지 않는다.
- `jelly = 0` 이면 제출을 차단하고 StageMap 또는 회복 안내 CTA 로 보낸다.
- 광고보기 mock 보상 클릭 시 `jelly.current` 를 `5` 증가시키되 `jelly.max` 를 넘기지 않는다.
- 날짜가 바뀐 뒤 첫 상태 동기화 시 `jelly.current < 20` 이면 `20`으로 회복하고, `20` 이상이면 유지한다.
- `Progress` 업데이트는 항상 난이도 경계 안에서만 일어나야 한다.
- 퀴즈 판정 결과는 결정론적 엔진 결과를 입력으로 받아 상태에 반영한다.

## Persistence Boundaries

- 기본 영속화 대상은 `selectedDifficulty`, `progressByDifficulty`, `jelly` 다.
- `session` 상태는 기본적으로 영속화하지 않는다.
- 영속 저장 기본 수단은 `localStorage fallback` 이다.
- SDK 저장소가 없거나 사용할 수 없을 때도 `localStorage` 만으로 핵심 루프가 유지되어야 한다.
- `localStorage` 키 설계는 앱 버전 충돌을 피할 수 있게 namespaced 되어야 한다.

## Zustand Policy

- 화면 컴포넌트는 `Zustand` store 의 selector 를 통해서만 상태를 읽는다.
- 상태 갱신은 store action 으로만 수행한다.
- SDK 이벤트가 상태를 바꿔야 할 경우에도 component 가 아니라 wrapper 또는 adapter 가 store action 을 호출한다.
- 난이도별 `Progress` 와 `jelly` 는 같은 store 안에 있어도 책임은 분리한다.

## Failure Handling

- 저장 복원 실패 시 기본 초기 상태로 안전하게 되돌아갈 수 있어야 한다.
- 잘못된 난이도 key 나 존재하지 않는 `stageId` 는 무시하거나 초기화 대상이 된다.
- 구버전 `clearedStageIds / unlockedStageIds` 형식이 남아 있으면 현재 `Chapter` 구조로 변환하거나 초기 상태로 fallback 한다.
- `localStorage` 접근이 실패해도 앱은 메모리 상태로 최소 동작해야 한다.

## Open Questions

- Zustand store 를 단일 store 로 둘지, 도메인별 slice 로 나눌지 여부.
- `session` 상태 일부를 새로고침 복구 대상으로 포함할지 여부.
