import { Link, useLocation } from 'react-router-dom'
import { maraningAssets } from '../maraning-assets'

const navItems = [
  { label: '메인페이지', icon: maraningAssets.homeButton, type: 'link' as const, to: '/home' },
  { label: '광고보기', icon: maraningAssets.adButton, type: 'button' as const },
  { label: '현재스테이지 공유하기', icon: maraningAssets.shareButton, type: 'button' as const },
  { label: '마이페이지', icon: maraningAssets.mypageButton, type: 'button' as const },
]

type BottomNavProps = {
  inFlow?: boolean
  onAdClick?: () => void
}

export function BottomNav({ inFlow = false, onAdClick }: BottomNavProps) {
  const location = useLocation()

  return (
    <nav className={inFlow ? 'game-bottom-nav game-bottom-nav--flow' : 'game-bottom-nav'}>
      {navItems.map((item) => {
        const active = item.type === 'link' && location.pathname === item.to
        const commonClassName = `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.4rem] px-2 py-2 text-center transition-transform duration-100 active:scale-95 ${
          active ? 'bg-white/80 shadow-[0_10px_18px_rgba(194,143,86,0.16)]' : ''
        }`

        if (item.type === 'button') {
          const handleClick = item.label === '광고보기' ? onAdClick : undefined

          return (
            <button
              key={item.label}
              type="button"
              onClick={handleClick}
              className={commonClassName}
              aria-label={item.label}
            >
              <img src={item.icon} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
              <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-black tracking-tight text-[#7a5031]">
                {item.label}
              </span>
            </button>
          )
        }

        return (
          <Link key={item.label} to={item.to} className={commonClassName}>
            <img src={item.icon} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
            <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-black tracking-tight text-[#7a5031]">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
