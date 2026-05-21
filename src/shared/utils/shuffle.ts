export function shuffleArray<T>(items: readonly T[]): T[] {
  const nextItems = [...items]

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentItem = nextItems[index]

    nextItems[index] = nextItems[randomIndex]
    nextItems[randomIndex] = currentItem
  }

  return nextItems
}
