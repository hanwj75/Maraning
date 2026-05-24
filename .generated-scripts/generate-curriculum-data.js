/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
const rootDir = path.resolve(process.cwd());
const curriculumDir = path.join(rootDir, 'src', 'data', 'curriculum');
const chaptersDir = path.join(rootDir, 'src', 'data', 'chapters');
const stagesDir = path.join(rootDir, 'src', 'data', 'stages');
const quizzesDir = path.join(rootDir, 'src', 'data', 'quizzes');
const difficultyFiles = {
    absolute_beginner: 'absolute-beginner',
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
    conversation: 'conversation',
    toeic: 'toeic',
};
function pad(value, length) {
    return String(value).padStart(length, '0');
}
function stripTerminalPunctuation(value) {
    return value.trim().replace(/[.!?]+$/u, '');
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function isSentenceTarget(stageSeed) {
    return (stripTerminalPunctuation(stageSeed.en).toLowerCase() ===
        stripTerminalPunctuation(stageSeed.sentenceEn).toLowerCase());
}
function tokenizeSentence(sentenceEn) {
    return stripTerminalPunctuation(sentenceEn)
        .split(/\s+/u)
        .map((token) => token.trim())
        .filter(Boolean);
}
function createChoiceIds(count) {
    return Array.from({ length: count }, (_, index) => String.fromCharCode(97 + index));
}
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}
function writeJson(filePath, value) {
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
function readCurriculumSeed(fileName) {
    return JSON.parse(fs.readFileSync(path.join(curriculumDir, fileName), 'utf8'));
}
function getSiblingDistractorSeeds(chapter, stageSeed) {
    const distractorSeeds = chapter.stages.filter((candidate) => candidate.targetKey !== stageSeed.targetKey);
    return distractorSeeds.slice(0, 5);
}
function createChoiceQuiz(params) {
    const optionTexts = [params.answerText, ...params.distractorTexts.slice(0, 3)];
    const choiceIds = createChoiceIds(optionTexts.length);
    const choices = optionTexts.map((text, index) => ({
        id: choiceIds[index],
        text,
    }));
    return {
        id: params.id,
        stageId: params.stageId,
        difficulty: params.difficulty,
        type: 'image_select',
        question: params.question,
        prompt: params.prompt,
        choices,
        answer: {
            correctChoiceId: choiceIds[0],
        },
        explanation: params.explanation,
        learningTargetId: params.learningTargetId,
        targetKey: params.targetKey,
        targetKo: params.targetKo,
        targetEn: params.targetEn,
    };
}
function createMatchingQuiz(params) {
    const choices = [];
    const answerPairs = [];
    params.pairs.forEach((pair, index) => {
        const pairId = index + 1;
        const leftId = `l${pairId}`;
        const rightId = `r${pairId}`;
        const matchKey = `m${pairId}`;
        choices.push({ id: leftId, text: pair.en, matchKey });
        choices.push({ id: rightId, text: pair.ko, matchKey });
        answerPairs.push({ leftId, rightId });
    });
    return {
        id: params.id,
        stageId: params.stageId,
        difficulty: params.difficulty,
        type: 'matching',
        question: params.question,
        prompt: params.prompt,
        choices,
        answer: {
            pairs: answerPairs,
        },
        explanation: params.explanation,
        learningTargetId: params.learningTargetId,
        targetKey: params.targetKey,
    };
}
function createWordOrderQuiz(params) {
    const orderedTokens = tokenizeSentence(params.sentenceEn);
    const rotatedTokens = orderedTokens.length > 1
        ? [orderedTokens[orderedTokens.length - 1], ...orderedTokens.slice(0, -1)]
        : orderedTokens;
    const choices = rotatedTokens.map((token, index) => ({
        id: `t${index + 1}`,
        text: token,
    }));
    return {
        id: params.id,
        stageId: params.stageId,
        difficulty: params.difficulty,
        type: 'word_order',
        question: '단어를 올바른 순서로 배열해 주세요.',
        prompt: '문장을 배열해주세요.',
        choices,
        answer: {
            orderedTokens,
        },
        explanation: params.explanation,
        learningTargetId: params.learningTargetId,
        targetKey: params.targetKey,
    };
}
function createBlankPrompt(stageSeed) {
    const sentenceEn = stageSeed.sentenceEn.trim();
    const normalizedTarget = stripTerminalPunctuation(stageSeed.en);
    const normalizedSentence = stripTerminalPunctuation(sentenceEn);
    if (normalizedTarget.toLowerCase() === normalizedSentence.toLowerCase()) {
        return {
            prompt: 'English sentence: ___.',
            acceptedAnswer: stageSeed.en,
        };
    }
    const replaced = sentenceEn.replace(new RegExp(escapeRegex(stageSeed.en), 'i'), '___');
    if (replaced !== sentenceEn) {
        return {
            prompt: replaced,
            acceptedAnswer: stageSeed.en,
        };
    }
    return {
        prompt: 'English sentence: ___.',
        acceptedAnswer: stageSeed.en,
    };
}
function createBlankFillQuiz(params) {
    const { prompt, acceptedAnswer } = createBlankPrompt(params.stageSeed);
    const choiceTexts = [acceptedAnswer, ...params.distractorSeeds.slice(0, 3).map((seed) => seed.en)];
    const choiceIds = createChoiceIds(choiceTexts.length);
    return {
        id: params.id,
        stageId: params.stageId,
        difficulty: params.difficulty,
        type: 'blank_fill',
        question: `문장이 "${stripTerminalPunctuation(params.stageSeed.sentenceKo)}"라는 뜻이 되도록 빈칸에 알맞은 영어 단어를 골라주세요.`,
        prompt,
        choices: choiceTexts.map((text, index) => ({
            id: choiceIds[index],
            text,
        })),
        answer: {
            acceptedAnswers: [acceptedAnswer],
        },
        explanation: params.explanation,
        learningTargetId: params.learningTargetId,
        targetKey: params.targetKey,
        targetKo: stripTerminalPunctuation(params.stageSeed.sentenceKo),
        targetEn: acceptedAnswer,
    };
}
function createStageTitle(chapterTitle, stageSeed) {
    const targetLabel = stripTerminalPunctuation(stageSeed.ko);
    return targetLabel.length <= 14 ? `${targetLabel} 익히기` : `${chapterTitle} ${pad(stageSeed.stageOrder, 2)}`;
}
function createQuizBatch(context, nextQuizId) {
    const sentenceTarget = isSentenceTarget(context.stageSeed);
    const wordPairs = [
        { ko: context.stageSeed.ko, en: context.stageSeed.en },
        ...context.distractorSeeds.slice(0, 2).map((seed) => ({ ko: seed.ko, en: seed.en })),
    ];
    const sentencePairs = [
        { ko: stripTerminalPunctuation(context.stageSeed.sentenceKo), en: stripTerminalPunctuation(context.stageSeed.sentenceEn) },
        ...context.distractorSeeds.slice(0, 2).map((seed) => ({
            ko: stripTerminalPunctuation(seed.sentenceKo),
            en: stripTerminalPunctuation(seed.sentenceEn),
        })),
    ];
    const wordDistractors = context.distractorSeeds.map((seed) => seed.en);
    const sentenceDistractors = context.distractorSeeds.map((seed) => stripTerminalPunctuation(seed.sentenceEn));
    const koreanDistractors = context.distractorSeeds.map((seed) => stripTerminalPunctuation(seed.sentenceKo));
    return [
        createChoiceQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            question: sentenceTarget
                ? `"${stripTerminalPunctuation(context.stageSeed.sentenceKo)}"에 맞는 영어 문장을 고르세요.`
                : `"${context.stageSeed.ko}"는 영어로 무엇일까요?`,
            prompt: sentenceTarget
                ? `"${stripTerminalPunctuation(context.stageSeed.sentenceKo)}"에 맞는 영어 문장을 고르세요.`
                : `"${context.stageSeed.ko}"는 영어로 무엇일까요?`,
            answerText: sentenceTarget ? stripTerminalPunctuation(context.stageSeed.sentenceEn) : context.stageSeed.en,
            distractorTexts: sentenceTarget ? sentenceDistractors : wordDistractors,
            explanation: sentenceTarget
                ? `핵심 문장을 영어 문장으로 다시 확인해요.`
                : `${context.stageSeed.ko}는 ${context.stageSeed.en}입니다.`,
            targetKo: stripTerminalPunctuation(context.stageSeed.sentenceKo),
            targetEn: sentenceTarget ? stripTerminalPunctuation(context.stageSeed.sentenceEn) : context.stageSeed.en,
        }),
        createMatchingQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            question: '영어 카드와 한국어 카드를 알맞게 연결해 주세요.',
            prompt: '영어와 뜻을 연결해주세요.',
            pairs: wordPairs,
            explanation: '핵심 단어와 뜻을 함께 익혀요.',
        }),
        createBlankFillQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            stageSeed: context.stageSeed,
            distractorSeeds: context.distractorSeeds,
            explanation: '영어 문장의 빈칸을 완성해요.',
        }),
        createWordOrderQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            sentenceEn: context.stageSeed.sentenceEn,
            explanation: '문장 어순을 반복 연습해요.',
        }),
        createChoiceQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            question: `"${stripTerminalPunctuation(context.stageSeed.sentenceKo)}"에 맞는 영어 문장을 고르세요.`,
            prompt: `"${stripTerminalPunctuation(context.stageSeed.sentenceKo)}"에 맞는 영어 문장을 고르세요.`,
            answerText: stripTerminalPunctuation(context.stageSeed.sentenceEn),
            distractorTexts: sentenceDistractors,
            explanation: '학습 문장을 영어로 다시 확인해요.',
            targetKo: stripTerminalPunctuation(context.stageSeed.sentenceKo),
            targetEn: stripTerminalPunctuation(context.stageSeed.sentenceEn),
        }),
        createMatchingQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            question: '영어 문장과 한국어 뜻을 알맞게 연결해 주세요.',
            prompt: '문장과 뜻을 연결해주세요.',
            pairs: sentencePairs,
            explanation: '핵심 문장과 뜻을 연결하며 익혀요.',
        }),
        createBlankFillQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            stageSeed: context.stageSeed,
            distractorSeeds: context.distractorSeeds.slice().reverse(),
            explanation: '같은 문장을 다른 보기 배치로 한 번 더 연습해요.',
        }),
        createWordOrderQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            sentenceEn: context.stageSeed.sentenceEn,
            explanation: '문장 배열을 한 번 더 연습해요.',
        }),
        createChoiceQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            question: `"${stripTerminalPunctuation(context.stageSeed.sentenceEn)}"의 뜻으로 알맞은 한국어를 고르세요.`,
            prompt: stripTerminalPunctuation(context.stageSeed.sentenceEn),
            answerText: stripTerminalPunctuation(context.stageSeed.sentenceKo),
            distractorTexts: koreanDistractors,
            explanation: '영어 문장의 한국어 의미를 확인해요.',
            targetKo: stripTerminalPunctuation(context.stageSeed.sentenceKo),
            targetEn: stripTerminalPunctuation(context.stageSeed.sentenceEn),
        }),
        createBlankFillQuiz({
            id: nextQuizId(),
            stageId: context.stageId,
            difficulty: context.difficulty,
            learningTargetId: context.learningTargetId,
            targetKey: context.stageSeed.targetKey,
            stageSeed: context.stageSeed,
            distractorSeeds: context.distractorSeeds,
            explanation: '빈칸 문제로 핵심 표현을 마지막으로 점검해요.',
        }),
    ];
}
function generateDifficultyData(seed) {
    const difficultySlug = difficultyFiles[seed.difficulty];
    const chapters = [];
    const stages = [];
    const quizzes = [];
    let stageIndex = 0;
    let quizIndex = 0;
    const nextQuizId = () => {
        quizIndex += 1;
        return `${difficultySlug}.quiz.${pad(quizIndex, 4)}`;
    };
    for (const chapterSeed of seed.chapters) {
        const chapterId = `${seed.difficulty}_chapter_${pad(chapterSeed.chapterOrder, 3)}`;
        const stageIds = [];
        for (const stageSeed of chapterSeed.stages) {
            stageIndex += 1;
            const stageId = `${difficultySlug}.stage.${pad(stageIndex, 3)}`;
            const learningTargetId = `${difficultySlug}.target.${stageSeed.targetKey}`;
            const distractorSeeds = getSiblingDistractorSeeds(chapterSeed, stageSeed);
            const stageQuizzes = createQuizBatch({
                difficulty: seed.difficulty,
                difficultySlug,
                chapter: chapterSeed,
                chapterId,
                stageSeed,
                stageId,
                learningTargetId,
                siblingSeeds: chapterSeed.stages,
                distractorSeeds,
            }, nextQuizId);
            const stage = {
                id: stageId,
                difficulty: seed.difficulty,
                chapterId,
                order: stageSeed.stageOrder,
                title: createStageTitle(chapterSeed.title, stageSeed),
                description: `${stripTerminalPunctuation(stageSeed.sentenceKo)} 학습 목표를 10문제로 반복 학습한다`,
                learningTarget: {
                    id: learningTargetId,
                    ko: stageSeed.ko,
                    en: stageSeed.en,
                    sentenceKo: stripTerminalPunctuation(stageSeed.sentenceKo),
                    sentenceEn: stripTerminalPunctuation(stageSeed.sentenceEn),
                },
                quizIds: stageQuizzes.map((quiz) => quiz.id),
                requiredStageId: stageSeed.stageOrder === 1 ? null : stageIds[stageIds.length - 1],
            };
            stageIds.push(stageId);
            stages.push(stage);
            quizzes.push(...stageQuizzes);
        }
        chapters.push({
            id: chapterId,
            difficulty: seed.difficulty,
            order: chapterSeed.chapterOrder,
            title: chapterSeed.title,
            description: chapterSeed.description,
            stageIds,
            requiredChapterId: chapterSeed.chapterOrder === 1
                ? null
                : `${seed.difficulty}_chapter_${pad(chapterSeed.chapterOrder - 1, 3)}`,
        });
    }
    return { chapters, stages, quizzes };
}
function main() {
    ensureDir(chaptersDir);
    ensureDir(stagesDir);
    ensureDir(quizzesDir);
    const summaries = [];
    for (const [difficulty, fileSlug] of Object.entries(difficultyFiles)) {
        const seed = readCurriculumSeed(`${fileSlug}.curriculum.json`);
        const generated = generateDifficultyData(seed);
        writeJson(path.join(chaptersDir, `${fileSlug}.chapters.json`), generated.chapters);
        writeJson(path.join(stagesDir, `${fileSlug}.stages.json`), generated.stages);
        writeJson(path.join(quizzesDir, `${fileSlug}.quizzes.json`), generated.quizzes);
        summaries.push({
            difficulty,
            chapters: generated.chapters.length,
            stages: generated.stages.length,
            quizzes: generated.quizzes.length,
        });
    }
    const totalChapters = summaries.reduce((sum, item) => sum + item.chapters, 0);
    const totalStages = summaries.reduce((sum, item) => sum + item.stages, 0);
    const totalQuizzes = summaries.reduce((sum, item) => sum + item.quizzes, 0);
    console.table(summaries);
    console.log(`TOTAL_CHAPTERS=${totalChapters}`);
    console.log(`TOTAL_STAGES=${totalStages}`);
    console.log(`TOTAL_QUIZZES=${totalQuizzes}`);
}
main();
