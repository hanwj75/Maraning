import { maraningAssets } from '../maraning-assets'

type CharacterPanelProps = {
  title: string
  subtitle: string
  imageClassName?: string
}

export function CharacterPanel({
  title,
  subtitle,
  imageClassName = '',
}: CharacterPanelProps) {
  return (
    <aside className="game-card flex flex-col items-center gap-3 bg-white/72 px-4 py-5 text-center backdrop-blur">
      <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-b from-[#fff4dd] to-[#ffd3ae] shadow-[inset_0_-8px_16px_rgba(255,180,125,0.35),0_14px_30px_rgba(189,128,82,0.18)]">
        <img
          src={maraningAssets.hamster}
          alt=""
          aria-hidden="true"
          className={`h-24 w-24 object-contain ${imageClassName}`}
        />
      </div>
      <div className="space-y-1">
        <p className="text-base font-black text-[#7d4d2f]">{title}</p>
        <p className="text-xs font-semibold leading-5 text-[#9b6b48]">{subtitle}</p>
      </div>
    </aside>
  )
}
