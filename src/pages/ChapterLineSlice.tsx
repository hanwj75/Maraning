const chapterLineAsset = '/assets/maraning/chapter_line.png'
const CHAPTER_LINE_ROW_COUNT = 10

type ChapterLineSliceProps = {
  index: number
  className?: string
}

export function ChapterLineSlice({
  index,
  className = '',
}: ChapterLineSliceProps) {
  const safeIndex = Math.min(Math.max(index, 1), CHAPTER_LINE_ROW_COUNT)
  const backgroundOffsetPercent =
    ((safeIndex - 1) / (CHAPTER_LINE_ROW_COUNT - 1)) * 100

  return (
    <div aria-hidden="true" className={`overflow-hidden ${className}`}>
      <div
        className="h-full w-full"
        style={{
          backgroundImage: `url(${chapterLineAsset})`,
          backgroundPosition: `center ${backgroundOffsetPercent}%`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `90% ${CHAPTER_LINE_ROW_COUNT * 100}%`,
        }}
      />
    </div>
  )
}
