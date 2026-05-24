# Appintos Release Checklist

## 현재 완료 상태 (2026-05-24 기준)

| 단계 | 항목 | 상태 |
|------|------|------|
| Step 1 | Supabase 프로젝트 생성 (`zydetishxxvnrxzqmcuo`) | ✅ 완료 |
| Step 2 | CLI 로그인 | ✅ 완료 |
| Step 3 | 프로젝트 link | ✅ 완료 |
| Step 4 | DB migration 적용 (테이블 8개) | ✅ 완료 |
| Step 5 | Secrets 설정 (`APP_SESSION_JWT_SECRET`) | ✅ 완료 |
| Step 6 | Edge Functions 배포 6개 (`--no-verify-jwt`) | ✅ 완료 |
| Step 7 | Function URL 확인 | ✅ 완료 |
| Step 8 | `.env.local` + AIT 빌드 env 설정, `npm run build` 통과 | ✅ 완료 |
| Step 9 | 앱인토스 sandbox 테스트 (실기기 토스앱) | ⬜ 미완료 |
| Step 10 | 최종 빌드 확인 | ✅ 완료 |

> **다음 단계**: 실기기(토스앱)에서 Step 9 sandbox 테스트만 남음.

---

## 체크리스트 재검증 결과 (2026-05-24 최종)

### 실패 → 해결 완료 항목

| 항목 | 구현 방법 | 상태 |
|------|-----------|------|
| 토스 로그인 연결 끊기 후 재접속 | `toss-unlink-callback` v6 ACTIVE. 재접속 시 `verifyActiveAppSession` → `login_status` DB 체크 → 401 → `expireSession()` → 세션+로컬스토리지 초기화 → "로그인 연결이 해제되어..." 안내 | ✅ 해결 |
| 인앱 광고 사전 로딩 | `preloadRewardAd()` 화면 진입 시 호출, 버튼 클릭 시 `showPreloadedRewardAd()`만 호출. 준비 전 클릭 시 안내 메시지. show 완료 후 다음 preload 자동 시작 | ✅ 해결 |

### 위험 → 환경 플래그로 대응 완료

| 항목 | 구현 방법 | 상태 |
|------|-----------|------|
| 토스 네이티브 뒤로가기와 앱 뒤로가기 중복 | `VITE_USE_APPINTOS_NATIVE_NAV=true` (.env.local 설정 완료) → `CuteTopBar` 자체 ← 버튼 빌드 시 제거. 샌드박스에서 토스 네이티브 뒤로가기 확인됨 | ✅ 대응 완료 |

### 기존 통과 항목 이상 없음 확인

| 항목 | 확인 방법 | 상태 |
|------|-----------|------|
| CSR 방식 | `index.html` → `<script type="module">` 단독, SSR 없음 | ✅ |
| eval 미사용 | `src/` 전체 grep — 없음 | ✅ |
| window.location.replace 미사용 | `src/` 전체 grep — 없음 | ✅ |
| 자사 로그인 없음 | mock 로그인은 `isLocalDevEnvironment()` (localhost only) 조건부만 동작 | ✅ |
| 라이트 모드 | `globals.css`·`index.html` 에 `prefers-color-scheme: dark` 없음 | ✅ |
| 접속 즉시 바텀시트 자동 열림 없음 | 자동 open 코드 없음 | ✅ |
| 서비스 이용 동의 후 진입 | SplashPage — 버튼 클릭 필수 | ✅ |
| 인앱 결제 비활성화 | `payments/verify` → 501 + `payment_verification_not_implemented` | ✅ |

### Edge Functions 배포 상태 (MCP 확인)

| Function | Version | Status | verify_jwt |
|----------|---------|--------|------------|
| toss-login | v13 | ACTIVE | false |
| wallet | v10 | ACTIVE | false |
| progress | v9 | ACTIVE | false |
| ad-reward | v9 | ACTIVE | false |
| payments | v9 | ACTIVE | false |
| toss-unlink-callback | v6 | ACTIVE | false |

---

## Current Backend Status

- `toss-login`: 구현됨. `authorizationCode/referrer -> generate-token -> login-me -> app sessionToken 반환` 흐름 존재
- `toss-unlink-callback`: 구현됨. Toss 연결 해제 콜백(GET+POST). `userKey`+`referrer` → `app_users.login_status` 갱신(unlinked/withdrawn), `toss_oauth_tokens` null 처리, 감사 로그 기록. **Toss 콘솔 설정 URL: `https://zydetishxxvnrxzqmcuo.supabase.co/functions/v1/toss-unlink-callback`**
- `wallet`: 구현됨. `GET /wallet`, `POST /wallet/consume` 동작, 일일 회복과 원장 기록 포함
- `progress`: 구현됨. `GET /progress`, `POST /progress/stage-complete` 동작
- `ad-reward`: 구현됨. `adEventId` 중복 방지, 일일 제한, 쿨다운, 성공 시에만 `jelly +5`. **프론트 preload 아키텍처 적용**: 화면 진입 시 `preloadRewardAd()`, 클릭 시 `showPreloadedRewardAd()`만 호출. 앱인토스 체크리스트 "인앱 광고는 사전에 로딩돼 있어요" 충족.
- `payments`: 골격만 구현됨. `create-order` 가능, `verify` 는 disabled/not implemented 상태, 젤리 지급 없음

## Backend Mode

- MVP 백엔드는 별도 Express/Nest/Railway/EC2 서버 없이 `Supabase Edge Functions + Supabase Postgres` 로만 운영한다.
- 프론트 API 호출 기본 대상이 Supabase Functions URL 인지 확인한다.
- `VITE_` prefix 가 붙은 값에는 secret 이 없는지 확인한다.

## Frontend Env

- `VITE_SUPABASE_URL` 설정 (필수 — Edge Functions URL 자동 유도에 사용)
- `VITE_SUPABASE_ANON_KEY` 설정 (현재 미사용 — 프론트에서 Supabase 클라이언트를 직접 사용하지 않음)
- `VITE_API_BASE_URL` 이 비어 있으면 `VITE_SUPABASE_URL/functions/v1` 로 유도되는지 확인
- `VITE_API_BASE_URL` 을 직접 쓸 경우 실제 Supabase Functions URL 인지 확인
- production 빌드에서 mock login 경로가 아니라 실제 `toss-login` function 호출 경로를 타는지 확인

## Supabase Secrets

아래 값들은 프론트 `.env` 가 아니라 Supabase secrets 로만 관리한다.
배포: Supabase 대시보드 > Project Settings > Edge Functions > Secrets
로컬: `supabase secrets set KEY=VALUE`

**필수 (현재 Edge Functions 동작에 필요)**
- `SUPABASE_URL` — 배포 환경에서 자동 주입됨, 로컬에서만 직접 설정 필요
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_SESSION_JWT_SECRET`

**선택 (기본값 있음)**
- `TOSS_API_BASE_URL` — 기본값: `https://apps-in-toss-api.toss.im`

**미사용 (향후 기능 구현 시 필요)**
- `TOSS_CLIENT_ID` — IAP 연동 시 필요
- `TOSS_DECRYPTION_KEY` — 토스 개인정보 복호화 시 필요
- `TOSS_DECRYPTION_AAD` — 토스 개인정보 복호화 시 필요

## Missing Env To Fill Before Submission

- 프론트 `.env`
  - `VITE_SUPABASE_URL` (필수)
  - `VITE_API_BASE_URL` 또는 `VITE_SUPABASE_URL` 기반 자동 유도 확인
- Supabase secrets (필수)
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `APP_SESSION_JWT_SECRET`
- Supabase secrets (선택, 기본값 있음)
  - `TOSS_API_BASE_URL` — 기본값 `https://apps-in-toss-api.toss.im` 으로 동작
- Toss 개인정보 복호화가 실제로 필요해질 때만 추가
  - `TOSS_DECRYPTION_KEY`
  - `TOSS_DECRYPTION_AAD`
- 향후 IAP 연동 시 확인
  - `TOSS_CLIENT_ID`

## Supabase 실제 배포 절차

순서대로 진행한다. 각 단계마다 verify 항목을 확인한 뒤 다음 단계로 넘어간다.

### 1. Supabase 프로젝트 생성

- Supabase 대시보드(supabase.com)에서 새 프로젝트 생성
- 프로젝트 이름, 데이터베이스 비밀번호, 리전(Northeast Asia — ap-northeast-1 권장) 설정
- 생성 완료 후 Project Settings > General 에서 `Reference ID` 메모
- verify: 대시보드에서 프로젝트 상태가 Active인지 확인

### 2. Supabase CLI 로그인

```sh
supabase login
```

- 브라우저가 열리면 Supabase 계정으로 인증
- verify: `supabase projects list` 로 방금 만든 프로젝트가 목록에 보이는지 확인

### 3. 프로젝트 link

```sh
supabase link --project-ref <reference-id>
```

- `<reference-id>` 는 1단계에서 메모한 값으로 교체
- 데이터베이스 비밀번호 입력 요청 시 1단계에서 설정한 비밀번호 입력
- verify: `supabase status` 실행 후 linked project 가 올바른 ref 인지 확인

### 4. Migration 적용

```sh
supabase db push
```

- `supabase/migrations/` 하위 파일들이 순서대로 실행됨
- verify: 대시보드 Table Editor 에서 `app_users`, `wallets`, `user_progress`, `payment_orders`, `ad_reward_events` 테이블이 생성되었는지 확인

### 5. Secrets 설정

아래 명령을 한 줄씩 실행한다. 실제 값은 `.env.example` 주석 참고.

```sh
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<값>
supabase secrets set APP_SESSION_JWT_SECRET=<값>
```

선택 (기본값 있음, 변경 필요 시만):

```sh
supabase secrets set TOSS_API_BASE_URL=https://apps-in-toss-api.toss.im
```

- verify: `supabase secrets list` 에서 `SUPABASE_SERVICE_ROLE_KEY`, `APP_SESSION_JWT_SECRET` 이 표시되는지 확인
- 주의: 값 자체는 list 에 노출되지 않는 것이 정상

### 6. Edge Functions 배포

```sh
npx supabase functions deploy toss-login --no-verify-jwt
npx supabase functions deploy toss-unlink-callback --no-verify-jwt
npx supabase functions deploy wallet --no-verify-jwt
npx supabase functions deploy progress --no-verify-jwt
npx supabase functions deploy ad-reward --no-verify-jwt
npx supabase functions deploy payments --no-verify-jwt
```

- **중요**: `--no-verify-jwt` 플래그가 반드시 필요하다. 이 앱은 커스텀 `APP_SESSION_JWT_SECRET`으로 서명한 토큰을 사용하므로 Supabase 플랫폼 JWT 검증을 우회해야 한다. 플래그 없이 배포하면 모든 요청이 401로 차단된다.
- `toss-unlink-callback`은 Toss가 직접 호출하므로 `--no-verify-jwt`가 특히 중요하다.
- 각 명령 실행 후 `Deployed: <function-name>` 메시지 확인
- verify: 대시보드 Edge Functions 탭에서 6개 함수가 모두 Active 상태인지 확인

### 7. Function URL 확인

```sh
supabase functions list
```

- URL 형식: `https://<project-ref>.supabase.co/functions/v1/<function-name>`
- 또는 대시보드 Edge Functions 탭에서 각 함수의 엔드포인트 URL 확인
- verify: `toss-login`, `toss-unlink-callback`, `wallet`, `progress`, `ad-reward`, `payments` 6개 URL이 모두 조회되는지 확인

### 8. VITE_API_BASE_URL 설정

로컬 빌드용 `.env.local` (이미 생성됨):

```sh
VITE_SUPABASE_URL=https://zydetishxxvnrxzqmcuo.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
# VITE_API_BASE_URL 은 비워도 됨 — VITE_SUPABASE_URL/functions/v1 로 자동 유도
```

앱인토스 빌드 환경에서 동일한 값을 설정해야 한다 (앱인토스 대시보드 빌드 환경변수).

- verify: `npm run build` 후 웹 번들에 `zydetishxxvnrxzqmcuo` 문자열이 포함되는지 확인
- verify: 번들에 `service_role` 문자열이 포함되지 않는지 확인
- verify: `.env.local` 에 `SERVICE_ROLE_KEY` 또는 `JWT_SECRET` 가 포함되지 않는지 확인

### 9. 앱인토스 sandbox 테스트

실기기(토스앱) 또는 앱인토스 sandbox 환경에서 아래 흐름을 순서대로 검증한다.

- [ ] 시작하기 → 동의하고 시작하기 → `toss-login` function 호출 성공 및 sessionToken 발급 확인
- [ ] 로그인 후 `GET /wallet`, `GET /progress` 응답으로 마이페이지 hydrate 확인
- [ ] Quiz 제출 시 `POST /wallet/consume` 호출 및 jelly 감소 확인
- [ ] Stage 완료 시 `POST /progress/stage-complete` 호출 및 다음 stage unlock 확인
- [ ] 광고 시청 완료 후 `POST /ad-reward/complete` 호출 및 jelly +5 확인
- [ ] `POST /payments/verify` 호출 시 501 + `payment_verification_not_implemented` 응답 확인 (jelly 미지급)
- [ ] 로그아웃 후 재로그인 시 서버 기준 jelly/progress 가 복원되는지 확인
- [ ] 토스 앱 설정에서 마라닝 앱 연결 해제 → `toss-unlink-callback` 콜백이 Toss로부터 수신되어 `app_users.login_status = unlinked` 로 변경되는지 확인
- [ ] 연결 해제 후 미니앱 재접속 → 시작하기 클릭 시 "로그인 연결이 해제되어 다시 로그인이 필요해요." 메시지와 로그인 버튼이 표시되는지 확인
- [ ] 연결 해제 후 미니앱 재접속 → 앱에 이전 사용자 데이터(jelly/progress)가 남아 있지 않은지 확인
- [ ] **네이티브 내비게이션 바 확인**: 토스 앱 상단에 네이티브 내비게이션 바(뒤로가기 포함)가 표시되는지 확인
  - 네이티브 뒤로가기 버튼이 보이면 → 앱인토스 빌드 환경변수에 `VITE_USE_APPINTOS_NATIVE_NAV=true` 추가 후 재빌드
  - 네이티브 바가 없으면 → `false` 유지 (앱 내부 ← 버튼 사용)
  - 앱 내부 ← 버튼과 토스 네이티브 뒤로가기가 동시에 보이면 **실패** — `VITE_USE_APPINTOS_NATIVE_NAV=true`로 해결

> **Toss 콘솔 UNLINK 콜백 URL 등록 필요**: `https://zydetishxxvnrxzqmcuo.supabase.co/functions/v1/toss-unlink-callback`

### 10. Build/Deploy 전 최종 확인

```sh
npm run build
```

- [ ] 빌드 오류 없음
- [ ] `VITE_API_BASE_URL` 이 실제 Supabase Functions URL 로 설정됨
- [ ] mock login 경로가 아닌 실제 `toss-login` 호출 경로를 타는지 확인
- [ ] service role key 가 프론트 번들에 포함되지 않음
- [ ] Toss `accessToken` / `refreshToken` 을 프론트 응답으로 내리지 않음
- [ ] `payments/verify` 가 여전히 disabled 상태임
- [ ] changelog 최신화 확인

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
- `toss-login`, `toss-unlink-callback`, `wallet`, `progress`, `ad-reward`, `payments` deploy
- **Toss 콘솔에 UNLINK 콜백 URL 등록**: `https://zydetishxxvnrxzqmcuo.supabase.co/functions/v1/toss-unlink-callback`
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
