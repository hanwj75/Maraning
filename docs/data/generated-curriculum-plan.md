# Generated Curriculum Plan

## 목적

- 이 문서는 현재 repo 의 실제 Chapter / Stage / Quiz 스키마와 validator 제약을 먼저 정리하고, 이후 난이도별 대량 JSON 생성 작업의 기준선을 고정하기 위한 계획 문서다.
- 이번 단계에서는 생성 전략만 정의한다.
- 이번 단계에서는 `6,000`개 Quiz JSON 을 실제로 생성하지 않는다.

## 1. 현재 Repo 실제 데이터 구조 요약

### 현재 파일 구조

- Chapter 데이터: `src/data/chapters/{difficulty}.chapters.json`
- Stage 데이터: `src/data/stages/{difficulty}.stages.json`
- Quiz 데이터: `src/data/quizzes/{difficulty}.quizzes.json`
- 난이도별로 Chapter / Stage / Quiz 파일이 각각 1개씩 존재한다.

### 현재 seed 분포

| difficulty | chapters | stages | quizzes |
| --- | ---: | ---: | ---: |
| `absolute_beginner` | 1 | 3 | 30 |
| `beginner` | 1 | 2 | 20 |
| `intermediate` | 1 | 2 | 20 |
| `advanced` | 1 | 2 | 20 |
| `conversation` | 1 | 2 | 20 |
| `toeic` | 1 | 2 | 20 |

### 목표 구조

- Difficulty `6`개
- Difficulty 당 Chapter `10`개
- Chapter 당 Stage `10`개
- Stage 당 Quiz `10`개
- 최종 목표 총합:
  - Stage `600`
  - Quiz `6,000`

### 현재 타입/스키마 기준

- `Chapter` 필수 필드:
  - `id`
  - `difficulty`
  - `order`
  - `title`
  - `description`
  - `stageIds`
  - `requiredChapterId`
- `Stage` 필수 필드:
  - `id`
  - `difficulty`
  - `chapterId`
  - `order`
  - `title`
  - `description`
  - `learningTarget`
  - `quizIds`
  - `requiredStageId`
- `learningTarget` 필수 필드:
  - `id`
  - `ko`
  - `en`
  - `sentenceKo`
  - `sentenceEn`
- `Quiz` 필수 필드:
  - `id`
  - `stageId`
  - `difficulty`
  - `type`
  - `question`
  - `prompt`
  - `choices`
  - `answer`
  - `explanation`
  - optional: `learningTargetId`, `targetKey`, `targetKo`, `targetEn`

### 현재 validator / engine 기준 핵심 규칙

- `Stage` 하나는 정확히 하나의 `learningTarget` 만 가진다.
- `Stage` 하나는 정확히 `10`개의 `quizIds` 를 가져야 한다.
- `Quiz` 는 `stageId` 로 자기 `Stage` 와 연결되어야 한다.
- `Quiz` 는 `learningTargetId` 또는 `targetKey` 로 같은 `Stage` 목표를 반복해야 한다.
- 허용 문제 타입은 현재 실사용 기준:
  - `image_select`
  - `matching`
  - `word_order`
  - `blank_fill`
- `typing` 은 금지다.
- 선택형 문제는 `4~6`개의 `choices` 를 가져야 한다.
- `matching` 은 최소 `3`쌍이어야 한다.
- `blank_fill.question` 은 목표 한국어 의미를 직접 설명해야 한다.
- 정답 판정은 `deterministic validation` 이어야 한다.
- `answerIndex` 기반 판정은 금지다.
- JSON 의 `choices` / `word_order` token 순서는 정답 위치를 의미하지 않는다.
- 실제 화면 표시 순서는 `QuizSession` 시작 시 shuffle 된다.

## 2. 생성할 파일 목록

### Chapter 파일

- `src/data/chapters/absolute-beginner.chapters.json`
- `src/data/chapters/beginner.chapters.json`
- `src/data/chapters/intermediate.chapters.json`
- `src/data/chapters/advanced.chapters.json`
- `src/data/chapters/conversation.chapters.json`
- `src/data/chapters/toeic.chapters.json`

### Stage 파일

- `src/data/stages/absolute-beginner.stages.json`
- `src/data/stages/beginner.stages.json`
- `src/data/stages/intermediate.stages.json`
- `src/data/stages/advanced.stages.json`
- `src/data/stages/conversation.stages.json`
- `src/data/stages/toeic.stages.json`

### Quiz 파일

- `src/data/quizzes/absolute-beginner.quizzes.json`
- `src/data/quizzes/beginner.quizzes.json`
- `src/data/quizzes/intermediate.quizzes.json`
- `src/data/quizzes/advanced.quizzes.json`
- `src/data/quizzes/conversation.quizzes.json`
- `src/data/quizzes/toeic.quizzes.json`

### 생성 스크립트 권장 위치

- `scripts/generate-curriculum.ts`
또는
- `scripts/generate-curriculum.mjs`

### 중간 산출물 권장 위치

- `scripts/curriculum/templates/`
- `scripts/curriculum/catalog/`
- `scripts/curriculum/output/` 는 사용하지 않고 최종 JSON 을 직접 `src/data/*` 에 덮어쓰는 방식 권장

## 3. difficulty별 커리큘럼 방향

### absolute_beginner

- 초핵심 단어와 매우 짧은 문장 중심
- 예:
  - 사물
  - 동물
  - 색깔
  - 숫자
  - 기본 인사
- `sentenceEn` 은 가능한 짧게 유지

### beginner

- 자기소개, 직업, 일상 기본 문장 중심
- 예:
  - `I am a student`
  - `She is a teacher`
  - `This is my book`

### intermediate

- 선호, 취미, 상태 설명 같은 문장 확장
- 예:
  - `I like apples`
  - `He plays soccer`
  - `We go to school`

### advanced

- 시간, 빈도, 이유, 복합 설명이 들어간 긴 문장
- 예:
  - `I usually study English in the morning`
  - `She reads books after dinner`

### conversation

- 실전 회화 발화와 응답
- 예:
  - 인사
  - 감사
  - 부탁
  - 길 묻기
- `sentenceKo` / `sentenceEn` 은 회화 intent 기준으로 잡는다.

### toeic

- 업무, 일정, 보고, 회의, 공지 중심
- 예:
  - meeting
  - report
  - submission
  - schedule
- 문장형 학습목표 비중을 높인다.

## 4. generator script 설계

### 목표

- 수작업이 아니라 규칙 기반 생성으로 `10 Chapter × 10 Stage × 10 Quiz` 구조를 확장한다.
- 단, 생성 결과는 현재 타입과 validator 를 통과해야 한다.

### 권장 입력 구조

- 난이도별 curriculum catalog
- 예:

```ts
type CurriculumTarget = {
  chapterOrder: number
  chapterTitle: string
  chapterDescription: string
  stageOrder: number
  stageTitle: string
  stageDescription: string
  learningTargetId: string
  ko: string
  en: string
  sentenceKo: string
  sentenceEn: string
  distractorPool: string[]
}
```

### 생성 순서

1. 난이도별 chapter catalog 정의
2. chapter 당 10개 stage target catalog 정의
3. 각 stage target 에 대해 quiz 10개 생성
4. `chapter.stageIds`, `stage.quizIds`, `quiz.stageId` 참조 연결
5. 전체 validator 실행
6. 통과한 JSON 만 `src/data/*` 에 기록

### ID 생성 규칙 권장

- Chapter:
  - `{difficulty}_chapter_{001..010}`
- Stage:
  - `{difficulty}.stage.{001..100}`
  - 또는 chapter 가 드러나는 형태:
    - `{difficulty}_chapter_{001}_stage_{001}`
- Quiz:
  - `{difficulty}.quiz.{0001..1000}`
  - 또는 stage 가 드러나는 형태:
    - `{stageId}.quiz.{01..10}`

현재 repo 는 `absolute-beginner.stage.001`, `absolute-beginner.quiz.001` 같은 패턴을 사용 중이므로, generator 는 기존 패턴과 충돌 없이 확장 가능한 규칙을 우선 따라야 한다.

### Quiz 생성 템플릿 권장

각 Stage 는 아래 10문제 패턴을 기본 템플릿으로 사용한다.

1. `image_select`
2. `matching`
3. `blank_fill`
4. `word_order`
5. `image_select`
6. `matching`
7. `blank_fill`
8. `word_order`
9. `image_select`
10. `blank_fill`

이유:

- 현재 seed 와 가장 유사한 구성이다.
- Stage당 정확히 10문제를 유지하기 쉽다.
- 현재 UI / engine / validator 와 충돌이 적다.

### blank_fill 생성 규칙

- `question` 에 반드시 `sentenceKo` 또는 `ko` 를 넣는다.
- 예:
  - `문장이 "이것은 사과입니다"라는 뜻이 되도록 빈칸에 알맞은 영어 단어를 골라주세요.`
- `targetKo`, `targetEn` 를 함께 채운다.
- `prompt` 는 영어 문장 빈칸 형태로 유지한다.

### matching 생성 규칙

- `answer.pairs` 는 원본 정답 관계를 유지한다.
- pair 는 최소 `3`쌍
- 좌우 카드 표시는 session 단계에서 shuffle 되므로 JSON 에서 정답 위치를 암시하지 않는다.
- 현재 UI 는 왼쪽 한국어, 오른쪽 영어 표시를 전제로 한다.

### word_order 생성 규칙

- `choices` 에는 정답 token 집합을 넣되, JSON 순서를 정답 위치처럼 믿지 않는다.
- 실제 표시는 session 단계에서 shuffle 된다.
- `answer.orderedTokens` 만 정답 순서의 기준이다.

## 5. validation 체크리스트

### Chapter 체크리스트

- `difficulty` 별 Chapter 수가 최종 목표 기준 `10`개인지
- `order` 가 `1..10` 연속인지
- `requiredChapterId` 가 선형 구조인지
- `stageIds.length === 10` 인지

### Stage 체크리스트

- `difficulty` 별 Stage 수가 최종 목표 기준 `100`개인지
- 각 Chapter 당 Stage 수가 `10`개인지
- 각 `Stage.chapterId` 가 실제 Chapter 와 일치하는지
- `requiredStageId` 가 같은 Chapter 내 선형 구조인지
- `learningTarget` 필드가 모두 채워졌는지
- `quizIds.length === 10` 인지

### Quiz 체크리스트

- `difficulty` 별 Quiz 수가 최종 목표 기준 `1000`개인지
- 각 Stage 당 Quiz 수가 `10`개인지
- 각 Quiz 의 `stageId` 가 실제 Stage 와 일치하는지
- 각 Quiz 의 `difficulty` 가 Stage 와 일치하는지
- `learningTargetId` 또는 `targetKey` 가 Stage 목표와 일치하는지
- `question` 이 비어 있지 않은지
- `image_select` / `blank_fill` / 추가 선택형의 `choices.length` 가 `4~6`인지
- `matching.answer.pairs.length >= 3` 인지
- `blank_fill.question` 이 추상 문구가 아닌지
- `blank_fill.targetKo` 가 있으면 `question` 이 그 값을 포함하는지
- `word_order.answer.orderedTokens` 길이가 token 수와 일치하는지

### 생성 후 실행할 실제 코드 검증

- `validateChapterData(...)`
- `validateStageData(...)`
- `validateQuizData(...)`
- 필요 시 `areQuizIdsUnique(...)`
- 필요 시 stage / quiz 참조 무결성 추가 스크립트

## 6. 이번 작업에서 변경하지 않을 것

- 실제 `6,000`개 Quiz JSON 생성
- React UI 변경
- `QuizPage` 동작 변경
- `Jelly` 정책 변경
- `failLife` 정책 변경
- `Result / Reward` 흐름 변경
- `validator` 로직 변경
- `Stage / Chapter` 진행 로직 변경
- Appintos SDK 관련 코드 변경
- 기존 asset 삭제

## 실행 제안

1. `generated-curriculum-plan.md` 를 기준선으로 승인
2. 난이도별 curriculum catalog 초안 작성
3. generator script 구현
4. 난이도 1개로 dry-run 생성
5. validator 통과 확인
6. 전체 6난이도 확장 생성
