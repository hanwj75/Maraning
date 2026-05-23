# Supabase 실제 프로젝트 연결 가이드

## 현재 상태 (2026-05-24 기준)

| 항목 | 상태 |
|------|------|
| Supabase CLI (전역) | 미설치 — `npx supabase` 로 사용 가능 (v2.101.0) |
| `supabase/config.toml` | 존재 (`project_id = "Maraning"`, 각 함수 `verify_jwt = false` 설정됨) |
| 실제 프로젝트 link | **완료** — `supabase/.temp/project-ref` 에 저장됨 |
| Project Ref | `zydetishxxvnrxzqmcuo` |
| Project Name | `Maraning` |
| `supabase/functions/` | 5개 함수 구현·배포 완료 (v3, `--no-verify-jwt`) |
| `supabase/migrations/` | 2개 파일, 원격 적용 완료 |

## 배포 완료 상태 (2026-05-24)

```
[x] Step 4. supabase db push          — migrations 2개 원격 적용 완료
[x] Step 5. supabase secrets set      — APP_SESSION_JWT_SECRET 설정 완료
                                        (SUPABASE_SERVICE_ROLE_KEY는 플랫폼 자동 주입)
[x] Step 6. supabase functions deploy — 5개 함수 ACTIVE (--no-verify-jwt)
[x] Step 7. functions list 확인       — toss-login, wallet, progress, ad-reward, payments 확인
[x] Step 8. CORS/응답 테스트          — OPTIONS 200, 인증 오류 401, toss-login 유효성 400 확인
[ ] Step 9. VITE_SUPABASE_URL 설정   — 프론트 빌드 환경변수 (앱인토스 빌드 시 설정 필요)
```

### 주의: verify_jwt = false 가 필요한 이유

Supabase Edge Functions는 기본적으로 플랫폼 레벨에서 Supabase 자체 JWT secret으로 토큰을 검증한다.
이 앱은 커스텀 `APP_SESSION_JWT_SECRET`으로 서명한 sessionToken을 사용하므로, 플랫폼 JWT 검증을 우회해야 한다.
각 함수 내부에서 `verifyAppSession()`으로 직접 인증을 처리한다(`toss-login`은 로그인 전 호출이므로 인증 없음).

재배포 시 반드시 `--no-verify-jwt` 플래그를 포함해야 한다:

```sh
npx supabase functions deploy <function-name> --no-verify-jwt
```

## 배포된 Functions URL

Base: `https://zydetishxxvnrxzqmcuo.supabase.co/functions/v1`

| Function | URL |
|----------|-----|
| toss-login | `.../toss-login` |
| wallet (GET) | `.../wallet` |
| wallet/consume | `.../wallet/consume` |
| progress (GET) | `.../progress` |
| progress/stage-complete | `.../progress/stage-complete` |
| ad-reward/complete | `.../ad-reward/complete` |
| payments/create-order | `.../payments/create-order` |
| payments/verify | `.../payments/verify` (disabled) |

## 남은 설정

프론트 빌드/배포 환경변수 (앱인토스 대시보드 또는 `.env`):

```
VITE_SUPABASE_URL=https://zydetishxxvnrxzqmcuo.supabase.co
# VITE_API_BASE_URL 은 비워도 됨 — VITE_SUPABASE_URL/functions/v1 로 자동 유도
```

## Migration 파일 이름 변경 이력

배포 과정에서 Supabase CLI v2가 파일명의 첫 번째 `_` 이전 숫자만 version으로 파싱해  
두 파일이 동일 version `20260522`로 충돌하는 문제를 발견했다.  
파일명을 14자리 연속 숫자로 변경해 해결했다:

- `20260522_000001_create_auth_wallet_progress_tables.sql` → `20260522000001_create_auth_wallet_progress_tables.sql`
- `20260522_000002_wallet_rpc.sql` → `20260522000002_wallet_rpc.sql`

---

## 배포 전 준비 — 사용자가 제공해야 하는 값

아래 값이 없으면 어떤 배포 명령도 실행할 수 없다.

### 필수 (없으면 진행 불가)

| 값 | 어디서 확인 | 용도 |
|----|------------|------|
| **Supabase Project Ref** | 대시보드 > Project Settings > General > Reference ID | `supabase link`, `supabase functions deploy` |
| **Supabase Project URL** | 대시보드 > Project Settings > API > Project URL | `VITE_SUPABASE_URL`, `SUPABASE_URL` secret |
| **Supabase service_role key** | 대시보드 > Project Settings > API > Project API keys > service_role | `SUPABASE_SERVICE_ROLE_KEY` secret — **절대 프론트에 노출 금지** |
| **APP_SESSION_JWT_SECRET** | 직접 생성 (32자 이상 랜덤 문자열) | `APP_SESSION_JWT_SECRET` secret |

### 선택 (기본값 있음)

| 값 | 기본값 | 용도 |
|----|--------|------|
| **Supabase anon public key** | — | 현재 미사용 (Supabase 클라이언트를 프론트에서 직접 쓰지 않음) |
| **TOSS_API_BASE_URL** | `https://apps-in-toss-api.toss.im` | 변경 필요 시만 |
| **VITE_AD_GROUP_ID** | — | 앱인토스 AdMob 광고 그룹 ID (미설정 시 광고 비활성) |

### CLI 로그인 (미로그인 시 필요)

Supabase 계정 인증이 필요하다:

```sh
npx supabase login
```

브라우저가 열리면 Supabase 계정으로 인증한다.

---

## 연결 절차 (순서 중요)

### Step 1. CLI 로그인 확인

```sh
npx supabase projects list
```

프로젝트 목록이 나오면 로그인된 상태다.  
목록이 비어 있거나 오류가 나면:

```sh
npx supabase login
```

### Step 2. 실제 프로젝트에 link ✅ 완료

```sh
npx supabase link --project-ref zydetishxxvnrxzqmcuo
```

link 정보는 `supabase/.temp/project-ref` 에 저장된다 (`.supabase/` 가 아님 — CLI v2 변경 사항).

### Step 3. link 확인 ✅ 완료

```sh
npx supabase migration list
```

결과: 로컬 migrations 2개, 원격 미적용 상태 확인.

---

## 연결 후 배포 절차

link가 완료되면 [appintos-release-checklist.md](./appintos-release-checklist.md)의 4단계부터 진행한다.

### 빠른 참조

```sh
# 4. Migration 적용
npx supabase db push

# 5. Secrets 설정
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<값>
npx supabase secrets set APP_SESSION_JWT_SECRET=<값>

# 6. Edge Functions 배포
npx supabase functions deploy toss-login
npx supabase functions deploy wallet
npx supabase functions deploy progress
npx supabase functions deploy ad-reward
npx supabase functions deploy payments

# 7. 배포 확인
npx supabase functions list
```

---

## npx vs 전역 설치

현재 환경에서는 `supabase` 전역 명령이 없다. 모든 명령에 `npx supabase`를 사용한다.

전역 설치를 원하면:

```sh
# Windows (Scoop)
scoop install supabase

# Windows (winget)
winget install Supabase.CLI

# npm (전역)
npm install -g supabase
```

설치 후에는 `npx` 없이 `supabase` 직접 사용 가능하다.

---

## 참고 파일

- `supabase/config.toml` — 로컬 개발 설정 (`project_id = "Maraning"`)
- `supabase/migrations/` — DB 스키마 정의 (2개 파일)
- `supabase/functions/` — Edge Functions 소스 (5개)
- `.env.example` — 프론트 환경변수 예시
- `docs/development/appintos-release-checklist.md` — 전체 배포 체크리스트
- `docs/architecture/supabase-schema.md` — DB 스키마 문서
