import { create } from 'zustand'

type DifficultyKey =
  | 'absolute_beginner'
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'conversation'
  | 'toeic'

type UiStore = {
  selectedDifficulty: DifficultyKey
  jellyPreview: number
  setSelectedDifficulty: (difficulty: DifficultyKey) => void
}

export const useUiStore = create<UiStore>((set) => ({
  selectedDifficulty: 'absolute_beginner',
  jellyPreview: 20,
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),
}))
