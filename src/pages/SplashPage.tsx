import { Link } from 'react-router-dom'
import { PageFrame } from '../shared/components/PageFrame'

const startPageAsset = '/assets/maraning/Maraning_start_page.png'

export function SplashPage() {
  return (
    <PageFrame showBottomNav={false} contentClassName="justify-center gap-0">
      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-2 py-4">
        <div className="w-full overflow-hidden rounded-[2.25rem] bg-[#fff7ec] shadow-[0_18px_34px_rgba(190,139,98,0.18)]">
          <img
            src={startPageAsset}
            alt="마라닝 시작 화면"
            className="h-auto w-full object-contain"
          />
        </div>

        <div className="flex w-full justify-center">
          <Link to="/home" className="game-primary-button w-full max-w-[17rem]">
            시작하기
          </Link>
        </div>
      </section>
    </PageFrame>
  )
}
