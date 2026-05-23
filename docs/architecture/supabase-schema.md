# Supabase Schema

## 목적

- 토스 로그인 사용자, 진행도, 젤리 지갑, 광고 보상, 결제 주문을 저장하기 위한 논리 스키마를 정의한다.
- 본 문서는 실제 migration SQL(`supabase/migrations/`)과 동기화된 테이블 책임과 관계를 설명한다.

## 테이블

### app_users

- 역할: 앱 내부 사용자 마스터
- 주요 필드:
  - `id` uuid PK
  - `toss_user_key` bigint UNIQUE — 토스 외부 식별자
  - `nickname` text
  - `display_name` text (nullable)
  - `login_status` text — `active | revoked | withdrawn | blocked`
  - `last_login_at` timestamptz
  - `created_at` / `updated_at` timestamptz

### toss_oauth_tokens

- 역할: Toss OAuth access/refresh token 저장 (서버 전용)
- 주의: 현재 평문 저장. 프로덕션 전 암호화 필요.
- 주요 필드:
  - `id` uuid PK
  - `user_id` uuid FK → `app_users.id` ON DELETE CASCADE
  - `access_token` text
  - `refresh_token` text
  - `scope` text
  - `expires_at` / `refresh_expires_at` timestamptz
  - `referrer` text
  - `created_at` / `updated_at` timestamptz

### user_wallets

- 역할: 서버 권위 재화 스냅샷
- 주요 필드:
  - `user_id` uuid PK+FK → `app_users.id` ON DELETE CASCADE
  - `jelly` integer CHECK `(jelly >= 0 AND jelly <= 100)` DEFAULT 20
  - `last_daily_refill_date` date
  - `updated_at` timestamptz

### user_progress

- 역할: 난이도별 Chapter/Stage 진행도
- 주요 필드:
  - `id` uuid PK
  - `user_id` uuid FK → `app_users.id` ON DELETE CASCADE
  - `difficulty` text
  - `unlocked_chapter_ids` jsonb DEFAULT `[]`
  - `completed_chapter_ids` jsonb DEFAULT `[]`
  - `unlocked_stage_ids_by_chapter` jsonb DEFAULT `{}`
  - `completed_stage_ids_by_chapter` jsonb DEFAULT `{}`
  - `current_chapter_id` / `current_stage_id` text
  - `updated_at` timestamptz
- 제약: UNIQUE `(user_id, difficulty)`

### reward_ledger

- 역할: 젤리 증감 원장 (서버 전용)
- 주요 필드:
  - `id` uuid PK
  - `user_id` uuid FK → `app_users.id` ON DELETE CASCADE
  - `type` text — `grant | consume`
  - `amount` integer — grant 시 양수, consume 시 음수
  - `reason` text — `daily_refill | quiz_submit | ad_reward | ...`
  - `source_id` text (nullable) — 중복 방지용 멱등 키
  - `metadata` jsonb
  - `created_at` timestamptz
- 제약: UNIQUE INDEX `(user_id, type, source_id) WHERE source_id IS NOT NULL`

### ad_reward_events

- 역할: 광고 보상 처리 기록
- 주요 필드:
  - `id` uuid PK
  - `user_id` uuid FK → `app_users.id` ON DELETE CASCADE
  - `ad_event_id` text — 클라이언트 전달 광고 이벤트 식별자
  - `status` text — `granted | duplicate | daily_limit_rejected | cooldown_rejected`
  - `reward_amount` integer DEFAULT 5
  - `created_at` timestamptz
- 제약: UNIQUE `(user_id, ad_event_id)`

### payment_orders

- 역할: IAP/TossPay 주문과 지급 상태 기록 (서버 전용)
- 주요 필드:
  - `id` uuid PK
  - `user_id` uuid FK → `app_users.id` ON DELETE CASCADE
  - `provider` text — `appintos_iap | tosspay | internal_pending`
  - `provider_order_id` text
  - `product_id` text — `jelly_10 | jelly_30 | jelly_50 | jelly_100`
  - `status` text — `pending | verification_pending | verification_disabled | ...`
  - `amount_krw` integer
  - `jelly_amount` integer
  - `raw_payload` jsonb
  - `created_at` / `updated_at` timestamptz
- 제약: UNIQUE `(provider, provider_order_id)`

### auth_audit_logs

- 역할: 인증, 로그인 성공/실패, 보안 이벤트 기록 (서버 전용)
- 주요 필드:
  - `id` uuid PK
  - `user_id` uuid FK → `app_users.id` ON DELETE SET NULL
  - `event` text — `toss_login_success | toss_login_failed | stage_fail | ...`
  - `referrer` text
  - `metadata` jsonb
  - `created_at` timestamptz

## 관계

```text
app_users 1---1 user_wallets
app_users 1---N toss_oauth_tokens
app_users 1---N user_progress
app_users 1---N reward_ledger
app_users 1---N ad_reward_events
app_users 1---N payment_orders
app_users 1---N auth_audit_logs
```

## RPC 함수 (migration 2)

모든 함수는 `SECURITY DEFINER`, `SET search_path = public` 으로 정의되며
`public`, `anon`, `authenticated` 역할에서 실행 권한이 박탈되고 `service_role` 전용이다.

| 함수 | 역할 |
|------|------|
| `sync_daily_wallet_refill(p_user_id, p_today)` | 일일 회복 적용 후 지갑 반환 |
| `consume_wallet_jelly(p_user_id, p_amount, p_reason, p_source_id)` | 젤리 차감, 부족 시 INSUFFICIENT_JELLY 예외 |
| `grant_wallet_jelly(p_user_id, p_amount, p_reason, p_source_id, p_metadata)` | 젤리 지급, source_id 중복 시 duplicate 반환 |

## RLS 정책

모든 테이블에 RLS가 활성화되어 있으며 클라이언트 접근 정책은 정의되지 않았다.
이 상태에서 `anon` / `authenticated` 역할은 어떠한 DML도 실행할 수 없다.
Edge Functions은 `service_role` 클라이언트를 사용하므로 RLS를 우회한다.

## 보안 원칙

- `toss_oauth_tokens`, `reward_ledger`, `payment_orders`, `auth_audit_logs` 는 서버 전용.
- 클라이언트 직접 쓰기/읽기는 허용하지 않는다.
- `VITE_` prefix 환경변수에는 절대 secret 을 포함하지 않는다.
