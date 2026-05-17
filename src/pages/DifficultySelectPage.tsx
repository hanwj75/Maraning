import { useNavigate } from 'react-router-dom'
import { CharacterPanel } from '../shared/components/CharacterPanel'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { difficultyLabelMap, difficultyOptions } from '../shared/difficulty'
import { useUiStore } from '../stores/ui-store'

export function DifficultySelectPage() {
  const navigate = useNavigate()
  const { selectedDifficulty, setSelectedDifficulty } = useUiStore()

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="난이도 선택" backTo="/home" variant="plain" />

      <section className="game-card bg-white/78 px-5 py-5">
        <p className="text-sm font-black text-[#ee9d92]">오늘의 발바닥 코스</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#7b4d32]">
          지금 기분에 맞는 레벨을 골라줘
        </h1>
        <p className="mt-2 text-sm font-semibold text-[#9a6d4d]">짧고 말랑한 설명만 준비했어요.</p>
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
                navigate('/stages')
              }}
              className={`rounded-[1.8rem] px-4 py-5 text-left shadow-[0_14px_28px_rgba(198,140,95,0.18)] transition-transform duration-100 active:scale-95 ${
                active
                  ? 'bg-gradient-to-br from-[#ffb3c2] to-[#ff8fb5] text-white'
                  : 'bg-white/84 text-[#7a4d31]'
              }`}
            >
              <p className="text-lg font-black tracking-tight">{difficulty.label}</p>
              <p className={`mt-2 text-xs font-semibold leading-5 ${active ? 'text-white/90' : 'text-[#9a6d4d]'}`}>
                {difficulty.shortDescription}
              </p>
            </button>
          )
        })}
      </section>

      <section className="grid grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="game-card flex items-center justify-between bg-gradient-to-r from-[#fff5df] to-[#fffaf1] px-5 py-4">
          <div>
            <p className="text-sm font-black text-[#f09d8c]">선택된 난이도</p>
            <p className="mt-1 text-xl font-black text-[#7b4d32]">
              {difficultyLabelMap[selectedDifficulty]}
            </p>
          </div>
          <div className="rounded-full bg-[#ffe0c9] px-4 py-2 text-sm font-black text-[#9c6640]">
            바로 출발
          </div>
        </div>
        <CharacterPanel title="말랑이 한마디" subtitle="어려워 보여도 한 단계씩 가면 돼!" />
      </section>
    </PageFrame>
  )
}
