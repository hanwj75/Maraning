import { AnimatePresence, motion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { DifficultySelectPage } from '../pages/DifficultySelectPage'
import { ChapterMapPage } from '../pages/ChapterMapPage'
import { HomePage } from '../pages/HomePage'
import { MyPage } from '../pages/MyPage'
import { QuizPage } from '../pages/QuizPage'
import { ResultPage } from '../pages/ResultPage'
import { RewardPage } from '../pages/RewardPage'
import { SplashPage } from '../pages/SplashPage'
import { StageMapPage } from '../pages/StageMapPage'

const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} {...pageTransition} className="min-h-dvh">
        <Routes location={location}>
          <Route path="/" element={<SplashPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/difficulty" element={<DifficultySelectPage />} />
          <Route path="/chapters/:difficultyId" element={<ChapterMapPage />} />
          <Route path="/stages/:difficultyId/:chapterId" element={<StageMapPage />} />
          <Route path="/quiz/:difficultyId/:chapterId/:stageId" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/reward" element={<RewardPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export function AppRouter() {
  return <AnimatedRoutes />
}
