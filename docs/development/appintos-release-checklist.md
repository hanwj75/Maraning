# Appintos Release Checklist

## Current Backend Status

- `toss-login`: 구현됨. `authorizationCode/referrer -> generate-token -> login-me -> app sessionToken 반환` 흐름 존재
- `wallet`: 구현됨. `GET /wallet`, `POST /wallet/consume` 동작, 일일 회복과 원장 기록 포함
- `progress`: 구현됨. `GET /progress`, `POST /progress/stage-complete` 동작
- `ad-reward`: 구현됨. `adEventId` 중복 방지, 일일 제한, 쿨다운, 성공 시에만 `jelly +5`
- `payments`: 골격만 구현됨. `create-order` 가능, `verify` 는 disabled/not implemented 상태, 젤리 지급 없음

## Backend Mode

- MVP 백엔드는 별도 Express/Nest/Railway/EC2 서버 없이 `Supabase Edge Functions + Supabase Postgres` 로만 운영한다.
- 프론트 API 호출 기본 대상이 Supabase Functions URL 인지 확인한다.
- `VITE_` prefix 가 붙은 값에는 secret 이 없는지 확인한다.

## Frontend Env

- `VITE_SUPABASE_URL` 설정
- `VITE_SUPABASE_ANON_KEY` 설정
- `VITE_API_BASE_URL` 이 비어 있으면 `VITE_SUPABASE_URL/functions/v1` 로 유도되는지 확인
- `VITE_API_BASE_URL` 을 직접 쓸 경우 실제 Supabase Functions URL 인지 확인
- production 빌드에서 mock login 경로가 아니라 실제 `toss-login` function 호출 경로를 타는지 확인

## Supabase Secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `TOSS_API_BASE_URL`
- `TOSS_CLIENT_ID`
- `TOSS_DECRYPTION_KEY`
- `TOSS_DECRYPTION_AAD`
- `APP_SESSION_JWT_SECRET`

위 값들은 프론트 `.env` 가 아니라 Supabase secrets 로만 관리한다.

## Missing Env To Fill Before Submission

- 프론트 `.env`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_BASE_URL` 또는 `VITE_SUPABASE_URL` 기반 자동 유도 확인
- Supabase secrets
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `TOSS_API_BASE_URL`
  - `APP_SESSION_JWT_SECRET`
- Toss 개인정보 복호화가 실제로 필요해질 때만 추가
  - `TOSS_DECRYPTION_KEY`
  - `TOSS_DECRYPTION_AAD`
- 향후 콘솔/앱 식별값 연동 시 확인
  - `TOSS_CLIENT_ID`

## DB / Functions Deploy

1. `supabase login`
2. `supabase link --project-ref <project-ref>`
3. `supabase db push`
4. `supabase functions deploy toss-login`
5. `supabase functions deploy wallet`
6. `supabase functions deploy progress`
7. `supabase functions deploy ad-reward`
8. `supabase functions deploy payments`

## Security Check

- service role key 가 프론트 번들에 포함되지 않는지 확인
- Toss `accessToken` / `refreshToken` 을 프론트 응답으로 내리지 않는지 확인
- 로그인 상태에서 jelly / progress 가 서버 응답 기준으로 갱신되는지 확인
- 광고 보상은 function 성공 후에만 `jelly +5` 인지 확인
- 결제 검증 미구현 상태에서는 `payments/verify` 가 지급 없이 disabled 응답을 반환하는지 확인
- 로그인 상태에서 `localStorage` 값만 바꿔도 jelly/progress 가 우회되지 않는지 확인
- mock login fallback 은 로컬 개발에서만 사용하고 제출 빌드에서는 실제 토스앱 로그인으로 점검

## Submission Critical TODO

- Supabase project 생성 및 migrations 반영
- Supabase secrets 설정
- `toss-login`, `wallet`, `progress`, `ad-reward`, `payments` deploy
- 토스앱 실기기에서 `시작하기 -> 동의하고 시작하기 -> toss-login` 성공 확인
- 로그인 후 `GET /wallet`, `GET /progress` 응답으로 프론트 hydrate 확인
- Quiz 제출 시 `POST /wallet/consume` 호출과 젤리 감소 확인
- Stage 완료 시 `POST /progress/stage-complete` 호출과 다음 stage unlock 확인
- 광고 보상 성공 시에만 `POST /ad-reward/complete` 후 젤리 증가 확인
- `payments/verify` 가 여전히 지급 없이 disabled 인지 확인

## Release Gate

- `npm run build`
- `npm run test`
- Supabase functions deploy 완료
- changelog 최신화 확인
