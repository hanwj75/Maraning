import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { BottomNav } from './BottomNav'
import { ConfirmDialog } from './ConfirmDialog'
import { useJellyStore } from '../../stores/jellyStore'

type PageFrameProps = PropsWithChildren<{
  className?: string
  contentClassName?: string
  showBottomNav?: boolean
}>

export function PageFrame({
  className = '',
  contentClassName = '',
  showBottomNav = true,
  children,
}: PageFrameProps) {
  const claimAdReward = useJellyStore((state) => state.claimAdReward)
  const [showAdDialog, setShowAdDialog] = useState(false)

  return (
    <main className={`game-screen-shell ${className}`}>
      <div className="game-phone">
        <div className={`game-phone-content ${contentClassName}`}>{children}</div>
        {showBottomNav ? <BottomNav onAdClick={() => setShowAdDialog(true)} /> : null}
        <ConfirmDialog
          open={showAdDialog}
          message="광고를 보시겠습니까?"
          onConfirm={async () => {
            const result = await claimAdReward()
            setShowAdDialog(false)

            if (!result.granted) {
              window.alert(result.message ?? '광고 보상을 받지 못했어요.')
            }
          }}
          onCancel={() => setShowAdDialog(false)}
        />
      </div>
    </main>
  )
}
