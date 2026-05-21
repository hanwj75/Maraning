import { maraningAssets } from '../../shared/maraning-assets'
import type { SharePlatform, StageSharePayload } from './share.types'

type ShareStageModalProps = {
  open: boolean
  payload: StageSharePayload
  feedbackMessage: string | null
  onClose: () => void
  onShare: (platform: SharePlatform) => void
}

const shareButtons: Array<{ platform: SharePlatform; label: string }> = [
  { platform: 'kakao', label: '카카오톡 공유' },
  { platform: 'instagram', label: '인스타그램 공유' },
  { platform: 'twitter', label: '트위터 공유' },
]

export function ShareStageModal({
  open,
  payload,
  feedbackMessage,
  onClose,
  onShare,
}: ShareStageModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(86,58,39,0.24)] px-5 backdrop-blur-[2px]">
      <div className="w-full max-w-[20rem] rounded-[1.8rem] bg-white/96 px-5 py-5 text-center shadow-[0_18px_36px_rgba(145,92,44,0.24)]">
        <p className="text-base font-black leading-7 text-[#7b4d32]">
          {payload.title}
        </p>
        <img
          src={maraningAssets.shareChar}
          alt=""
          aria-hidden="true"
          className="mx-auto mt-4 h-24 w-24 object-contain"
        />
        <p className="mt-3 text-sm font-black leading-6 text-[#8a5a3b]">
          {payload.introText}
        </p>
        <p className="mt-2 text-base font-black leading-7 text-[#7b4d32]">
          {payload.stageLabel}
        </p>
        {payload.learningTargetLabel ? (
          <p className="mt-1 text-sm font-semibold leading-6 text-[#94684a]">
            학습 목표: {payload.learningTargetLabel}
          </p>
        ) : null}
        {feedbackMessage ? (
          <p className="mt-3 rounded-[1.2rem] bg-[#fff3e4] px-3 py-2 text-xs font-black leading-5 text-[#8a5a3b]">
            {feedbackMessage}
          </p>
        ) : null}
        <div className="mt-4 grid gap-3">
          {shareButtons.map((button) => (
            <button
              key={button.platform}
              type="button"
              onClick={() => onShare(button.platform)}
              className="game-primary-button min-h-12"
            >
              {button.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="game-secondary-button mt-3 min-h-12 w-full"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
