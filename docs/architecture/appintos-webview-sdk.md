# AppIntos WebView SDK

## Integration Scope

- Appintos 연동은 `SDK wrapper layer` 를 통해서만 수행한다.
- wrapper 는 WebView bridge 호출, 이벤트 수신, 오류 방어, 앱 내부 인터페이스 변환을 담당한다.
- React component 는 SDK 객체나 bridge API 를 직접 참조하지 않는다.

## SDK Boundary

- component direct SDK call 은 금지한다.
- 화면 계층은 wrapper 가 노출하는 안전한 메서드 또는 hook 만 사용한다.
- wrapper 는 Appintos 의 불안정한 외부 인터페이스를 앱 내부의 안정된 계약으로 변환한다.
- SDK 관련 예외 처리도 wrapper 경계 안에서 끝내야 한다.

## Wrapper Responsibilities

- SDK 초기화 가능 여부 확인.
- bridge method 호출 래핑.
- 이벤트 payload 정규화.
- 실패 시 fallback 경로 선택.
- 앱 내부 상태 관리 계층과의 연결.

## Bridge Events

- 광고 시청 완료 이벤트는 wrapper 가 수신하고, 내부적으로 mock 단계에서는 `jelly +5` 흐름으로 연결한다.
- 앱 lifecycle 또는 visibility 이벤트가 있으면 wrapper 가 해석해 store action 으로 전달한다.
- SDK 에서 전달되는 데이터는 그대로 component 로 보내지 않고 wrapper 가 정규화한 뒤 전달한다.

## Client Responsibilities

- component 는 wrapper 결과만 소비한다.
- store action 은 wrapper 가 전달한 정규화 이벤트만 반영한다.
- 화면 로직은 SDK 호출 성공 여부보다 사용자 흐름 유지에 우선순위를 둔다.
- SDK 기능이 실패해도 `Home -> DifficultySelect -> StageMap -> Quiz -> Reward` 핵심 루프가 가능한 범위는 유지해야 한다.

## Fallback Policy

- SDK 가 없거나 초기화 실패 시 앱은 degraded mode 로 동작해야 한다.
- 저장 관련 기능은 `localStorage fallback` 으로 유지한다.
- 광고 보상 같은 SDK 의존 기능은 실패 시 안전하게 비활성화하거나 재시도 가능한 상태로 남긴다.
- fallback 동작은 component 마다 중복 구현하지 않고 wrapper 에서 통합한다.

## Recommended Interface Shape

- `isAvailable()`: SDK 사용 가능 여부 반환.
- `initialize()`: SDK 연결 초기화.
- `watchRewardAd()`: 광고 시청 요청.
- `subscribe(eventName, handler)`: SDK 이벤트 구독.
- `unsubscribe(eventName, handler)`: SDK 이벤트 해제.

## State Integration

- wrapper 는 직접 UI 상태를 가지지 않는다.
- wrapper 는 store action 을 호출할 수 있는 adapter 또는 service 계층과 연결된다.
- `jelly`, `progress`, `selectedDifficulty` 같은 핵심 상태는 SDK 내부가 아니라 앱 store 가 진실의 원천이어야 한다.

## Open Questions

- 광고 시청 결과를 wrapper 내부 promise 기반으로만 다룰지, 이벤트 기반으로 통일할지 여부.
- Appintos lifecycle 이벤트 중 실제로 store 반영이 필요한 범위를 어디까지 둘지 여부.
