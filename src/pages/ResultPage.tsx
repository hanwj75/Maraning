import { Link, Navigate } from 'react-router-dom'
import { CharacterPanel } from '../shared/components/CharacterPanel'
import { CuteTopBar } from '../shared/components/CuteTopBar'
import { PageFrame } from '../shared/components/PageFrame'
import { useQuizStore } from '../stores/quizStore'

export function ResultPage() {
  const result = useQuizStore((state) => state.result)

  if (!result) {
    return <Navigate to="/stages" replace />
  }

  return (
    <PageFrame contentClassName="gap-5">
      <CuteTopBar title="정답 확인" backTo="/quiz" variant="plain" />

      <section className="game-card bg-gradient-to-br from-[#ddfff0] to-[#f7ffef] px-5 py-6 text-center">
        <p className="text-sm font-black text-[#55b486]">스테이지 클리어</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#4f6f49]">정말 잘했어요!</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#68825d]">
          {result.correctCount} / {result.totalCount} 문제를 맞혔어요.
        </p>
      </section>

      <section className="grid grid-cols-[1.15fr_0.85fr] gap-4">
        <div className="game-card flex items-center justify-between bg-white/78 px-5 py-4">
          <div>
            <p className="text-sm font-black text-[#f09d8d]">짧은 피드백</p>
            <p className="mt-1 text-xl font-black text-[#7b4d32]">총 {result.answers.length}개 답안을 저장했어요</p>
          </div>
          <div className="text-5xl">👍</div>
        </div>
        <CharacterPanel title="말랑이 칭찬" subtitle="정말 잘했어요! 다음 화면에서 보상을 확인해요." />
      </section>

      <Link to="/reward" className="game-primary-button">
        보상 받기
      </Link>
    </PageFrame>
  )
}
