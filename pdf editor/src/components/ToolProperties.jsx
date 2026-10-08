function PropertyLabel({ children, className = '' }) {
  return <label className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[var(--studio-muted)] ${className}`}>{children}</label>
}

function ColorOption({ value, onChange }) {
  return (
    <PropertyLabel>
      Colour
      <input
        aria-label="Annotation colour"
        className="h-7 w-8 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0.5"
        type="color"
        value={value}
        onChange={(event) => onChange({ color: event.target.value })}
      />
    </PropertyLabel>
  )
}

function FontOption({ value, onChange }) {
  return (
    <select
      aria-label="Text font"
      className="h-8 rounded-md border border-[var(--studio-border)] bg-[var(--studio-panel)] px-2 text-sm text-[var(--studio-text)]"
      value={value}
      onChange={(event) => onChange({ font: event.target.value })}
    >
      <option value="H">Helvetica</option>
      <option value="T">Times</option>
      <option value="C">Courier</option>
    </select>
  )
}

function NumberOption({ label, value, min, max, onChange }) {
  return (
    <PropertyLabel>
      {label}
      <input
        aria-label={label}
        className="h-8 w-[68px] rounded-md border border-[var(--studio-border)] bg-[var(--studio-panel)] px-2 text-sm text-[var(--studio-text)]"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const nextValue = Number.parseFloat(event.target.value)
          if (nextValue > 0) onChange(nextValue)
        }}
      />
    </PropertyLabel>
  )
}

function PropertyButton({ children, disabled, onClick, active = false, label }) {
  return (
    <button
      type="button"
      className={`studio-button h-8 min-h-8 text-sm ${active ? 'border-[var(--studio-blue)] bg-[var(--studio-blue)] text-white' : ''}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}

export default function ToolProperties({ state, selected, tool, hint, onChange, onDelete, onRestore }) {
  const isText = (selected && selected.type === 'text') || (!selected && tool === 'text')
  const hasStrokeWidth = selected
    ? selected.type !== 'text' && selected.type !== 'img'
    : ['ul', 'st', 'rect', 'ellipse', 'draw'].includes(tool)
  const canRestore = selected?.type === 'text' && !selected.isNew && selected.modified
  return (
    <section aria-label="Tool settings" className="tool-properties-scroll flex min-h-12 flex-nowrap items-center gap-2.5 overflow-x-auto border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-3 py-2 sm:flex-wrap sm:gap-3 sm:px-4">
      <ColorOption value={state.color} onChange={onChange} />
      {isText && (
        <>
          <FontOption value={state.font} onChange={onChange} />
          <PropertyButton label="Bold" active={state.bold} onClick={() => onChange({ bold: !state.bold })}><b>B</b></PropertyButton>
          <NumberOption label="Size" value={Math.round(state.size * 10) / 10} min={4} max={200} onChange={(size) => onChange({ size })} />
        </>
      )}
      {hasStrokeWidth && (
        <NumberOption label="Width" value={state.strokeWidth} min={1} max={30} onChange={(strokeWidth) => onChange({ strokeWidth })} />
      )}
      <PropertyButton label="Delete selected object" disabled={!selected} onClick={onDelete}>Delete</PropertyButton>
      <PropertyButton label="Restore original text" disabled={!canRestore} onClick={onRestore}>Restore text</PropertyButton>
      {hint && <span className="hidden min-w-0 flex-1 text-left text-xs text-[var(--studio-muted)] sm:block">{hint}</span>}
    </section>
  )
}