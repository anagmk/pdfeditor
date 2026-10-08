function HeaderButton({ children, label, disabled = false, onClick, primary = false }) {
  return (
    <button
      type="button"
      className={primary
        ? 'inline-flex h-9 items-center gap-2 rounded-md bg-[var(--studio-orange)] px-3.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45'
        : 'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-white/20 bg-white/10 px-2.5 text-sm text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40'}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function StudioHeader({ document, scale, setScale, canUndo, canRedo, onUndo, onRedo, onOpen, onSave, onHome }) {
  return (
    <header className="flex flex-col gap-2 bg-[var(--studio-navy)] px-3 py-2 text-white sm:flex-row sm:items-center sm:gap-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <button type="button" className="grid size-9 shrink-0 place-items-center rounded-md bg-white/12 text-base font-bold text-white" aria-label="Back to home" title="Back to home" onClick={onHome}>⌂</button>
        <span className="text-sm font-bold tracking-normal sm:text-base">PDF Studio</span>
        {document && <span className="min-w-0 flex-1 truncate text-xs text-white/70 sm:max-w-[24vw] sm:flex-none sm:text-sm">{document.name}</span>}
      </div>
      <div className="hidden flex-1 sm:block" />
      <div className="header-actions flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
        <HeaderButton label="Undo (⌘Z)" disabled={!canUndo} onClick={onUndo}>↶</HeaderButton>
        <HeaderButton label="Redo (⌘⇧Z)" disabled={!canRedo} onClick={onRedo}>↷</HeaderButton>
        <span className="mx-1 hidden h-6 border-l border-white/20 sm:block" />
        <HeaderButton label="Zoom out" disabled={scale <= 0.5} onClick={() => setScale(Math.max(0.5, scale - 0.2))}>−</HeaderButton>
        <span className="min-w-10 text-center text-xs tabular-nums">{Math.round(scale / 1.3 * 100)}%</span>
        <HeaderButton label="Zoom in" disabled={scale >= 3} onClick={() => setScale(Math.min(3, scale + 0.2))}>+</HeaderButton>
        <HeaderButton label="Open another PDF" onClick={onOpen}><span className="sm:hidden">↥</span><span className="hidden sm:inline">Open PDF</span></HeaderButton>
        <HeaderButton label="Download edited PDF" primary disabled={!document} onClick={onSave}>↓ <span className="hidden sm:inline">Download</span></HeaderButton>
      </div>
    </header>
  )
}