# Supabase Schema

## 목적

- 토스 로그인 사용자, 진행도, 젤리 지갑, 광고 보상, 결제 주문을 저장하기 위한 논리 스키마를 정의한다.
- 본 문서는 마이그레이션 SQL이 아니라 테이블 책임과 관계를 설명한다.

## 테이블

### users

- 역할: 앱 내부 사용자 마스터
- 주요 필드:
  - `id`
  - `provider`
  - `toss_user_key`
  - `nickname`
  - `status`
  - `last_login_at`
  - `created_at`
  - `updated_at`

### user_tokens

- 역할: Toss access/refresh token 저장
- 주요 필드:
  - `id`
  - `user_id`
  - `access_token_encrypted`
  - `refresh_token_encrypted`
  - `scope_raw`
  - `access_token_expires_at`
  - `refresh_token_expires_at`
  - `revoked_at`
  - `created_at`
  - `updated_at`

### user_wallets

- 역할: 서버 권위 재화 스냅샷
- 주요 필드:
  - `user_id`
  - `jelly_balance`
  - `jelly_max`
  - `last_daily_refill_date_key`
  - `updated_at`

### user_progress

- 역할: 난이도별 Chapter/Stage 진행도
- 주요 필드:
  - `id`
  - `user_id`
  - `difficulty_id`
  - `current_chapter_id`
  - `current_stage_id`
  - `unlocked_chapter_ids`
  - `completed_chapter_ids`
  - `unlocked_stage_ids_by_chapter`
  - `completed_stage_ids_by_chapter`
  - `last_played_at`
  - `updated_at`

### reward_ledger

- 역할: 젤리 증감 원장
- 주요 필드:
  - `id`
  - `user_id`
  - `event_type`
  - `delta_jelly`
  - `balance_after`
  - `reference_type`
  - `reference_id`
  - `idempotency_key`
  - `created_at`

### ad_reward_events

- 역할: 광고 보상 검증 기록
- 주요 필드:
  - `id`
  - `user_id`
  - `ad_network`
  - `ad_group_id`
  - `sdk_event_type`
  - `reward_unit_type`
  - `reward_unit_amount`
  - `client_request_id`
  - `reward_ledger_id`
  - `validated_at`
  - `created_at`

### payment_orders

- 역할: IAP/TossPay 주문과 지급 상태 기록
- 주요 필드:
  - `id`
  - `user_id`
  - `provider`
  - `provider_order_id`
  - `sku`
  - `status`
  - `amount`
  - `currency`
  - `verified_at`
  - `granted_at`
  - `reward_ledger_id`
  - `raw_payload`
  - `created_at`
  - `updated_at`

### auth_audit_logs

- 역할: 인증, 토큰 갱신, 연결 끊기, 실패 이력 기록
- 주요 필드:
  - `id`
  - `user_id`
  - `event_type`
  - `referrer`
  - `ip_hash`
  - `user_agent_hash`
  - `metadata`
  - `created_at`

## 관계

```text
users 1---1 user_wallets
users 1---N user_tokens
users 1---N user_progress
users 1---N reward_ledger
users 1---N ad_reward_events
users 1---N payment_orders
users 1---N auth_audit_logs
```

## 책임 분리

- `users`, `user_tokens`: 인증 도메인
- `user_wallets`, `reward_ledger`: 재화 도메인
- `user_progress`: 학습 진행도 도메인
- `ad_reward_events`: 광고 검증 도메인
- `payment_orders`: 결제/지급 도메인
- `auth_audit_logs`: 감사 도메인

## 보안 원칙

- `user_tokens`, `reward_ledger`, `ad_reward_events`, `payment_orders`, `auth_audit_logs` 는 서버 전용 접근을 기본으로 한다.
- 클라이언트 직접 쓰기는 허용하지 않는다.
