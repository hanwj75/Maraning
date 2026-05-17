type ConfirmDialogProps = {
  open: boolean
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel = 'yes',
  cancelLabel = 'no',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(86,58,39,0.24)] px-5 backdrop-blur-[2px]">
      <div className="w-full max-w-[18rem] rounded-[1.8rem] bg-white/96 px-5 py-5 text-center shadow-[0_18px_36px_rgba(145,92,44,0.24)]">
        <p className="text-base font-black leading-7 text-[#7b4d32]">{message}</p>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onConfirm} className="game-primary-button min-h-12 flex-1">
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel} className="game-secondary-button min-h-12 flex-1">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
