# Payment And Ad Reward

## 목적

- 광고 보상과 결제 지급은 수익과 재화에 직접 연결되므로 서버 검증이 필요하다.
- 이 문서는 Appintos SDK, TossPay, IAP, Supabase 사이의 책임 분리를 정리한다.

## 전체 원칙

- SDK는 사용자 상호작용과 이벤트 수신만 담당한다.
- 지급 확정은 서버가 담당한다.
- 광고 보상과 결제 주문은 각각 독립 원장 기록을 남긴다.

## 광고 보상

### 프론트 책임

- `loadFullScreenAd`, `showFullScreenAd` 호출
- `loaded`, `show`, `impression`, `dismissed`, `userEarnedReward` 이벤트 정규화
- `userEarnedReward` 시 서버에 보상 요청

### 서버 책임

- 허용된 `adGroupId` 인지 확인
- 중복 이벤트 여부 확인
- 보상 수량 정책 확인
- 검증 성공 시 `ad_reward_events` 와 `reward_ledger` 기록

### 중요한 규칙

- `dismissed` 만으로 보상 지급 금지
- `userEarnedReward` 가 지급 후보의 최소 조건
- 실제 지급은 서버 검증 성공 후

## 인앱결제 IAP

### 프론트 책임

- 상품 목록 표시
- `createOneTimePurchaseOrder` 호출
- 미결 주문 복원 시 `getPendingOrders`, `completeProductGrant` 호출 연결

### 서버 책임

- SKU별 실제 보상 정책 보관
- 주문 상태 조회
- 지급 여부 확정
- 환불/중복 주문 방지

### 중요한 규칙

- `processProductGrant` 는 서버 지급 확인 이후 성공 처리되어야 한다.
- 동일 `orderId` 중복 지급 금지

## TossPay

- `checkoutPayment` 는 사용자 인증만 수행한다.
- 결제 생성과 실행은 서버가 한다.

권장 흐름:
- 서버가 `payToken` 생성
- 프론트가 TossPay 인증 수행
- 인증 성공 후 서버가 결제 실행
- 서버가 주문 상태와 지급을 확정

## 현재 MVP에서 제외

- 실제 SDK 실연동 코드
- 관리자 환불/정산 도구
- 영수증 세부 검증 구현
