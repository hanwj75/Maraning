# Backend Auth

## 목적

- 토스 로그인, 광고 보상, 결제 지급, 계정 동기화를 로컬 상태만으로 운영하면 위변조와 중복 지급을 막기 어렵다.
- 이 문서는 React WebView와 Supabase 기반 백엔드 사이의 인증 책임을 정의한다.
- MVP 는 별도 Express/Nest/Railway/EC2 서버 없이 `Supabase Edge Functions + Supabase Postgres` 조합으로 운영한다.

## 전체 아키텍처

```text
React/Vite WebView
  -> SDK wrapper layer
  -> Supabase Edge Functions
  -> Supabase DB
  -> Toss Login API
  -> Appintos 광고/결제 SDK
```

- React/Vite WebView는 사용자 입력과 SDK 호출 시작만 담당한다.
- SDK wrapper는 Appintos bridge와 이벤트 정규화만 담당한다.
- Supabase Edge Functions 는 토스 인가 코드 교환, 사용자 동기화, 앱 세션 발급, 젤리 확정, 광고/결제 검증을 담당한다.
- Supabase DB는 사용자, 토큰, 지갑, 진행도, 원장, 주문, 감사 로그를 저장한다.
- Supabase Free Tier 한도 안에서 MVP 를 운영하고, 한도 초과 시에만 유료 플랜 또는 별도 서버 전환을 검토한다.

## 로그인 흐름

### 1. appLogin 호출

- 프론트는 wrapper를 통해 `appLogin` 을 호출한다.
- 결과로 `authorizationCode` 와 `referrer` 를 받는다.
- 인가 코드는 유효시간 10분이므로 즉시 백엔드로 전달한다.

### 2. generate-token 교환

- 프론트는 `authorizationCode`, `referrer` 를 백엔드에 전달한다.
- 백엔드는 Toss `generate-token` API를 호출한다.
- 백엔드는 `accessToken`, `refreshToken`, `expiresIn`, `scope` 를 받는다.
- `accessToken` 유효시간은 1시간, `refreshToken` 유효시간은 14일이다.

### 3. login-me 조회

- 백엔드는 Toss `login-me` API를 호출한다.
- `userKey`, `scope`, `agreedTerms` 를 가져온다.
- 이름, 전화번호, 생년월일 등 개인정보는 암호화된 형태로 내려오므로 기본 전략은 원문 복호화 없이 저장하지 않는 것이다.

### 4. users upsert

- `users` 에 `provider=toss`, `toss_user_key`, `nickname`, `status`, `last_login_at` 를 기준으로 upsert 한다.
- 최초 로그인 시 `user_wallets`, `user_progress` 초기 행도 함께 만든다.
- MVP 기본 닉네임은 `말랑이 친구` 다.

### 5. 앱 세션 발급

- 백엔드는 앱 내부 세션을 발급한다.
- 프론트는 이 앱 세션만 저장한다.
- 토스 `accessToken` 과 `refreshToken` 은 프론트에 저장하지 않는다.

## 토큰 정책

- 토스 토큰은 `user_tokens` 에 서버 전용으로 저장한다.
- 토큰은 암호화 저장을 전제로 한다.
- access token 만료 시 백엔드는 refresh token 으로 갱신을 시도한다.
- refresh token 갱신 실패 시 사용자 재로그인을 요구한다.

## 로그인 연결 끊기

- 사용자 요청 로그아웃 시 백엔드가 Toss 연결 끊기 API를 호출한다.
- Toss 콜백은 `userKey`, `referrer` 를 전달하므로 백엔드는 해당 사용자의 세션과 토큰을 비활성화한다.
- 콜백 사유는 `auth_audit_logs` 에 기록한다.

## 보안 원칙

- Supabase service role key는 서버에서만 사용한다.
- 토스 토큰은 프론트에 저장하지 않는다.
- 복호화 키와 AAD도 서버에서만 사용한다.
- `userKey` 는 외부 식별자이고, 앱 내부에서는 별도 `user_id` 를 진실 원천으로 사용한다.
- `VITE_` prefix 가 붙은 값은 프론트에 노출되므로 secret 을 넣지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`, `APP_SESSION_JWT_SECRET`, Toss 복호화 키는 Supabase Function secrets 로만 관리한다.

## 현재 MVP에서 제외

- 개인정보 복호화 기반 이름 표시
- 관리자 페이지
- 다중 로그인 제공자 통합
