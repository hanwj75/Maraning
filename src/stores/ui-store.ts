import { create } from 'zustand'
import type { DifficultyKey } from '../data/difficulties'

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
