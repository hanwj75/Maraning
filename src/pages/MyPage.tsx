import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { difficultyLabels, difficultyKeys, type DifficultyKey } from '../data/difficulties'
import { fetchProgress } from '../api/progressApi'
import { fetchWallet } from '../api/walletApi'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { buildStageMapPath } from '../features/stage/stage.routes'
import { PageFrame } from '../shared/components/PageFrame'
import { useUiStore } from '../stores/ui-store'
import { useJellyStore } from '../stores/jellyStore'
import { useProgressStore } from '../stores/progressStore'
import { useSessionStore } from '../stores/sessionStore'
import { getChapterById, getStageById } from '../features/stage/stage.utils'

const DEFAULT_USER_NAME = '말랑이 친구'

export function MyPage() {
  const navigate = useNavigate()
  const selectedDifficulty = useUiStore((state) => state.selectedDifficulty)
  const sessionToken = useSessionStore((state) => state.sessionToken)
  const sessionUser = useSessionStore((state) => state.user)
  const isLoggedIn = useSessionStore((state) => state.isLoggedIn)
  const logout = useSessionStore((state) => state.logout)
  const setWallet = useSessionStore((state) => state.setWallet)
  const currentJelly = useJellyStore((state) => state.current)
  const setFromServerWallet = useJellyStore((state) => state.setFromServerWallet)
  const progressByDifficulty = useProgressStore((state) => state.progressByDifficulty)
  const setAllProgressFromServer = useProgressStore((state) => state.setAllProgressFromServer)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoggedIn || !sessionToken) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const [walletResponse, progressResponse] = await Promise.all([
          fetchWallet(),
          fetchProgress(),
        ])

        if (cancelled) {
          return
        }

        setFromServerWallet(walletResponse.wallet)
        setWallet({ jelly: walletResponse.wallet.jelly })
        setAllProgressFromServer(progressResponse.progress)
        setLoadError(null)
      } catch (error) {
        if (cancelled) {
          return
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : '마이페이지 정보를 불러오지 못했어요.',
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, sessionToken, setAllProgressFromServer, setFromServerWallet, setWallet])

  const resolvedDifficulty = difficultyKeys.reduce<DifficultyKey>(
    (latestDifficulty, difficulty) => {
      const latestProgress = progressByDifficulty[latestDifficulty]
      const candidateProgress = progressByDifficulty[difficulty]

      if (!candidateProgress?.currentChapterId || !candidateProgress.currentStageId) {
        return latestDifficulty
      }

      if (!latestProgress?.lastPlayedAt) {
        return difficulty
      }

      if (!candidateProgress.lastPlayedAt) {
        return latestDifficulty
      }

      return new Date(candidateProgress.lastPlayedAt).getTime() >
        new Date(latestProgress.lastPlayedAt).getTime()
        ? difficulty
        : latestDifficulty
    },
    selectedDifficulty,
  )

  const progress = progressByDifficulty[resolvedDifficulty] ?? null
  const currentChapter = progress?.currentChapterId
    ? getChapterById(resolvedDifficulty, progress.currentChapterId)
    : undefined
  const currentStage = progress?.currentStageId
    ? getStageById(resolvedDifficulty, progress.currentStageId)
    : undefined

  const currentStageLabel =
    currentChapter && currentStage
      ? `${difficultyLabels[resolvedDifficulty]} · 챕터${currentChapter.order} : ${currentStage.order}스테이지 · ${currentStage.title}`
      : currentChapter
        ? `${difficultyLabels[resolvedDifficulty]} · 챕터${currentChapter.order} 진행 중`
        : '아직 진행 중인 스테이지가 없어요.'
  const currentStagePath =
    currentChapter && currentStage
      ? buildStageMapPath(resolvedDifficulty, currentChapter.id)
      : null
  const displayUserName = sessionUser?.nickname || DEFAULT_USER_NAME
  const jellyLabel = isLoggedIn ? String(currentJelly) : '아직 젤리 정보가 없어요.'

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="내 정보" backTo="/home" variant="plain" />

      <section className="game-card bg-white/82 px-5 py-5">
        <p className="text-sm font-black text-[#ef9a8f]">사용자 이름</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-[#7b4d32]">
          {displayUserName}
        </h1>
        <p className="mt-2 text-sm font-semibold text-[#9b6c4a]">
          {isLoggedIn ? '토스 로그인 연결됨' : '아직 로그인하지 않았어요.'}
        </p>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => { logout(); navigate('/') }}
            className="mt-4 rounded-full bg-[#fff3e4] px-4 py-2 text-sm font-black text-[#9b6c4a] shadow-[0_10px_18px_rgba(194,143,86,0.12)] transition-transform duration-100 active:scale-[0.985]"
          >
            로그아웃
          </button>
        ) : null}
      </section>

      <section className="game-card bg-white/82 px-5 py-5">
        <p className="text-sm font-black text-[#ef9a8f]">보유 젤리</p>
        <p className="mt-3 text-2xl font-black tracking-tight text-[#7b4d32]">
          {jellyLabel}
        </p>
      </section>

      <section className="game-card bg-white/82 px-5 py-5">
        <p className="text-sm font-black text-[#ef9a8f]">현재 진행 중인 코스</p>
        {currentStagePath ? (
          <Link
            to={currentStagePath}
            className="mt-3 block rounded-[1.4rem] bg-[#fff3e4] px-4 py-4 text-lg font-black leading-8 text-[#7b4d32] shadow-[0_12px_22px_rgba(194,143,86,0.14)] transition-transform duration-100 active:scale-[0.985]"
          >
            {currentStageLabel}
          </Link>
        ) : (
          <p className="mt-3 text-lg font-black leading-8 text-[#7b4d32]">
            {currentStageLabel}
          </p>
        )}
        {loadError ? (
          <p className="mt-3 text-sm font-semibold text-[#c56b52]">{loadError}</p>
        ) : null}
      </section>
    </PageFrame>
  )
}
