import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShareStageModal } from '../../features/share/ShareStageModal'
import { buildStageSharePayload, DEFAULT_SHARE_NICKNAME, shareStageToPlatform } from '../../features/share/share.utils'
import { getChapterById, getStageById } from '../../features/stage/stage.utils'
import { useProgressStore } from '../../stores/progressStore'
import { useUiStore } from '../../stores/ui-store'
import { maraningAssets } from '../maraning-assets'

const navItems = [
  {
    label: '홈',
    icon: maraningAssets.homeButton,
    type: 'link' as const,
    to: '/home',
  },
  { label: '광고보기', icon: maraningAssets.adButton, type: 'button' as const },
  {
    label: '공유하기',
    icon: maraningAssets.shareButton,
    type: 'button' as const,
  },
  {
    label: '마이페이지',
    icon: maraningAssets.mypageButton,
    type: 'link' as const,
    to: '/mypage',
  },
]

type BottomNavProps = {
  inFlow?: boolean
  onAdClick?: () => void
}

export function BottomNav({ inFlow = false, onAdClick }: BottomNavProps) {
  const location = useLocation()
  const selectedDifficulty = useUiStore((state) => state.selectedDifficulty)
  const progress = useProgressStore(
    (state) => state.progressByDifficulty[selectedDifficulty] ?? null,
  )
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareFeedbackMessage, setShareFeedbackMessage] = useState<string | null>(
    null,
  )
  const currentChapter = progress?.currentChapterId
    ? getChapterById(selectedDifficulty, progress.currentChapterId)
    : undefined
  const currentStage = progress?.currentStageId
    ? getStageById(selectedDifficulty, progress.currentStageId)
    : undefined
  const sharePayload = useMemo(
    () =>
      buildStageSharePayload({
        nickname: DEFAULT_SHARE_NICKNAME,
        difficulty: selectedDifficulty,
        chapter: currentChapter,
        stage: currentStage,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }),
    [currentChapter, currentStage, selectedDifficulty],
  )

  return (
    <>
      <nav
        className={
          inFlow ? 'game-bottom-nav game-bottom-nav--flow' : 'game-bottom-nav'
        }
      >
        {navItems.map((item) => {
          const active = item.type === 'link' && location.pathname === item.to
          const commonClassName = `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.4rem] px-2 py-2 text-center transition-transform duration-100 active:scale-95 ${
            active ? 'bg-white/80 shadow-[0_10px_18px_rgba(194,143,86,0.16)]' : ''
          }`

          if (item.type === 'button') {
            const handleClick =
              item.label === '광고보기'
                ? onAdClick
                : item.label === '공유하기'
                  ? () => {
                      setShareFeedbackMessage(null)
                      setShowShareModal(true)
                    }
                  : undefined

            return (
              <button
                key={item.label}
                type="button"
                onClick={handleClick}
                className={commonClassName}
                aria-label={item.label}
              >
                <img
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  className="h-10 w-10 object-contain"
                />
                <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-black tracking-tight text-[#7a5031]">
                  {item.label}
                </span>
              </button>
            )
          }

          return (
            <Link key={item.label} to={item.to} className={commonClassName}>
              <img
                src={item.icon}
                alt=""
                aria-hidden="true"
                className="h-10 w-10 object-contain"
              />
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-black tracking-tight text-[#7a5031]">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
      <ShareStageModal
        open={showShareModal}
        payload={sharePayload}
        feedbackMessage={shareFeedbackMessage}
        onClose={() => setShowShareModal(false)}
        onShare={(platform) => {
          shareStageToPlatform({
            platform,
            payload: sharePayload,
          })
            .then((message) => {
              setShareFeedbackMessage(message)
            })
            .catch(() => {
              setShareFeedbackMessage('공유 문구를 준비하지 못했어요. 다시 시도해 주세요.')
            })
        }}
      />
    </>
  )
}
