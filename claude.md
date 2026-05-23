# CLAUDE.md

## 목적

이 문서는 Claude Code가 마라닝 프로젝트에서 작업할 때 따라야 할 행동 규칙과 프로젝트별 개발 규칙을 정의한다.

마라닝은 앱인토스 WebView 환경에서 실행되는 React + Vite 기반 영어 학습 앱이다.  
현재 목표는 앱인토스 제출을 위해 토스 로그인, Supabase 백엔드, 젤리/진행도 서버 동기화를 실제 동작하게 만드는 것이다.

---

## Behavioral Guidelines

These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State assumptions explicitly.
- If uncertain, ask.
- If multiple interpretations exist, present them instead of silently choosing one.
- If a simpler approach exists, say so.
- Push back when the requested approach is risky or overcomplicated.
- If something is unclear, stop, name what is confusing, and ask.

Do not guess hidden requirements.

---

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No flexibility or configurability that was not requested.
- No excessive error handling for impossible scenarios.
- If a solution is much longer than necessary, simplify it.

Ask:

> Would a senior engineer say this is overcomplicated?

If yes, simplify.

---

### 3. Surgical Changes

Touch only what is necessary. Clean up only your own mess.

When editing existing code:

- Do not improve adjacent code.
- Do not refactor unrelated code.
- Do not reformat unrelated files.
- Match the existing project style.
- If unrelated dead code is found, mention it but do not delete it.

When your changes create unused code:

- Remove imports, variables, and functions made unused by your own changes.
- Do not remove pre-existing dead code unless explicitly asked.

Every changed line should trace directly to the requested task.

---

### 4. Goal-Driven Execution

Define success criteria and verify.

Transform tasks into verifiable goals:

- "Add validation" means write or update validation checks and verify invalid inputs fail.
- "Fix bug" means reproduce or identify the bug, then verify the fix.
- "Refactor" means ensure behavior is unchanged before and after.

For multi-step tasks, use this pattern:

```txt
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```
