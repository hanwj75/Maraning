# Backend Implementation Order

## 목표

- 토스 로그인, Supabase DB, 계정 동기화, 서버 권위 젤리, 광고/결제 검증을 단계적으로 도입한다.
- 현재 학습 루프를 깨지 않는 순서로 진행한다.
- MVP 는 별도 Express/Nest/Railway/EC2 서버 없이 `Supabase Edge Functions + Supabase Postgres` 만으로 운영한다.

## 1단계: Supabase 환경 구성

- Supabase 프로젝트 생성
- 환경 변수 분리
- service role key를 서버 전용으로 격리
- `VITE_` prefix 값과 server secret 을 분리
- Edge Functions secrets 에 아래 값 설정
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TOSS_API_BASE_URL`
  - `TOSS_CLIENT_ID`
  - `TOSS_DECRYPTION_KEY`
  - `TOSS_DECRYPTION_AAD`
  - `APP_SESSION_JWT_SECRET`

## 2단계: 토스 로그인 백엔드

- `appLogin -> authorizationCode/referrer -> generate-token -> login-me` 흐름 구현
- `users`, `user_tokens`, `auth_audit_logs` 저장
- 앱 세션 발급

## 3단계: 사용자 기본 데이터 초기화

- `user_wallets`, `user_progress` 기본 행 생성
- 기본 닉네임 `말랑이 친구` 저장

## 4단계: 읽기 전용 동기화

- 로그인 사용자의 wallet/progress를 서버에서 조회
- 클라이언트 store hydrate

## 5단계: 서버 권위 젤리

- 문제 제출 차감 서버화
- 일일 회복 서버화
- `reward_ledger` 기록

## 6단계: 광고 보상 서버 검증

- 광고 이벤트 정규화
- 서버 `claim-ad-reward` API 도입
- 중복 지급 방지

## 7단계: 인앱결제 주문 저장

- `payment_orders` 도입
- SKU 정책 정의
- 미결 주문 복원 흐름 연결

## 8단계: TossPay 결제 실행

- 서버 payToken 생성
- 인증 후 서버 결제 실행
- 주문/원장 기록

## 9단계: 진행도 서버 동기화

- 난이도별 chapter/stage 진행도 저장
- 다중 기기 복원 준비

## 10단계: 운영 안정화

- 토큰 갱신 모니터링
- 연결 끊기 콜백 처리
- 광고/결제 실패 로그 정리

## Supabase 배포 순서

1. `supabase login`
2. `supabase link --project-ref <project-ref>`
3. `supabase db push`
4. `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`
5. `supabase secrets set TOSS_API_BASE_URL=...`
6. `supabase secrets set TOSS_CLIENT_ID=...`
7. `supabase secrets set TOSS_DECRYPTION_KEY=...`
8. `supabase secrets set TOSS_DECRYPTION_AAD=...`
9. `supabase secrets set APP_SESSION_JWT_SECRET=...`
10. `supabase functions deploy toss-login`
11. `supabase functions deploy wallet`
12. `supabase functions deploy progress`
13. `supabase functions deploy ad-reward`
14. `supabase functions deploy payments`

## 운영 기준선

- 프론트 API 기본 대상은 Supabase Edge Functions URL 이다.
- 별도 유료 서버는 MVP 배포 전제에 포함하지 않는다.
- Free Tier 한도 초과 시에만 Supabase 유료 플랜 또는 별도 서버 분리를 검토한다.
- `payments/verify` 는 실제 검증 구현 전까지 지급 disabled 상태를 유지한다.

## 이번 단계에서 하지 않을 것

- 개인정보 복호화 기반 이름 표시
- 관리자 페이지
- 수동 정산 도구
