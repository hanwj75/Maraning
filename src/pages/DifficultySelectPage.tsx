import { useNavigate } from 'react-router-dom'
import { buildChapterMapPath } from '../features/stage/stage.routes'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { difficultyOptions } from '../shared/difficulty'
import { useUiStore } from '../stores/ui-store'

export function DifficultySelectPage() {
  const navigate = useNavigate()
  const { selectedDifficulty, setSelectedDifficulty } = useUiStore()

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="난이도 선택" backTo="/home" variant="plain" />

      <section className="game-card bg-white/78 px-5 py-5">
        <p className="text-sm font-black text-[#ee9d92]">오늘의 마라닝 코스</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#7b4d32]">
          진행할 난이도를 골라봐!
        </h1>
        <p className="mt-2 text-sm font-semibold text-[#9a6d4d]"></p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {difficultyOptions.map((difficulty) => {
          const active = selectedDifficulty === difficulty.id

          return (
            <button
              key={difficulty.id}
              type="button"
              onClick={() => {
                setSelectedDifficulty(difficulty.id)
                navigate(buildChapterMapPath(difficulty.id))
              }}
              className={`rounded-[1.8rem] px-4 py-5 text-left shadow-[0_14px_28px_rgba(198,140,95,0.18)] transition-transform duration-100 active:scale-95 ${
                active
                  ? 'bg-gradient-to-br from-[#ffb3c2] to-[#ff8fb5] text-white'
                  : 'bg-white/84 text-[#7a4d31]'
              }`}
            >
              <p className="text-lg font-black tracking-tight">
                {difficulty.label}
              </p>
              <p
                className={`mt-2 text-xs font-semibold leading-5 ${active ? 'text-white/90' : 'text-[#9a6d4d]'}`}
              >
                {difficulty.shortDescription}
              </p>
            </button>
          )
        })}
      </section>
    </PageFrame>
  )
}
