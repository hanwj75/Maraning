# Server Authoritative Jelly

## 목적

- 현재 `jelly` 는 클라이언트 store 중심이지만, 로그인/광고/결제가 들어오면 조작과 중복 지급 위험이 커진다.
- 젤리 잔액과 증감 확정을 서버에서만 수행하도록 경계를 정의한다.
- MVP 백엔드는 별도 유료 서버 없이 Supabase Edge Functions 와 Supabase Postgres 로만 운영한다.

## 원칙

- 젤리 변경은 서버에서만 확정한다.
- 클라이언트는 조회와 임시 표시만 담당한다.
- 모든 젤리 변경은 `reward_ledger` 에 기록한다.
- 같은 이벤트는 idempotency key로 중복 처리되지 않아야 한다.

## 서버 확정 대상

- 문제 제출 시 `-1`
- 일일 회복
- 광고 보상
- 결제 보상

## 처리 흐름

### 문제 제출 차감

- 프론트는 제출 요청과 함께 `quizId`, `stageId`, `idempotencyKey` 를 보낸다.
- 서버는 잔액을 확인한다.
- 차감 가능하면 `user_wallets` 와 `reward_ledger` 를 같은 트랜잭션으로 갱신한다.

### 일일 회복

- 서버는 `last_daily_refill_date_key` 와 현재 날짜를 비교한다.
- 잔액이 20 미만이면 20으로 회복한다.
- 회복도 원장에 기록한다.

### 광고 보상

- 프론트는 SDK 이벤트를 받더라도 직접 `+5` 를 확정하지 않는다.
- 서버가 광고 이벤트를 검증하고 승인 시 `reward_ledger` 에 `ad_reward` 를 기록한다.
- 현재 최소 검증은 `adEventId` 중복 방지, 하루 횟수 제한, 짧은 반복 요청 차단이다.
- 서버 function 성공 시에만 `jelly +5` 를 확정한다.

### 결제 보상

- 서버가 주문 상태를 검증한 뒤 SKU에 맞는 보상을 지급한다.
- 지급 성공 시 `payment_orders` 와 `reward_ledger` 를 함께 갱신한다.
- 실제 결제 검증이 연결되기 전까지는 `payments/verify` 가 `not_implemented` 또는 disabled 응답을 반환하고 젤리를 지급하지 않는다.

## API 예시 책임

- `GET /wallet`
- `POST /wallet/consume-for-quiz`
- `POST /wallet/claim-ad-reward`
- `POST /wallet/grant-purchase`

## 보안 원칙

- 클라이언트가 보낸 보상 수량을 신뢰하지 않는다.
- 광고/결제는 서버 검증 성공 후에만 지급한다.
- 원장 없는 잔액 변경을 허용하지 않는다.
- 로그인 상태에서는 `localStorage` 를 권위 데이터로 사용하지 않는다.
- 비로그인 또는 로컬 개발 mock 환경에서만 local fallback 을 허용한다.

## MVP에서 나중으로 미루는 것

- 게스트 모드와 로그인 계정 잔액 병합
- 운영자 수동 보정 도구
