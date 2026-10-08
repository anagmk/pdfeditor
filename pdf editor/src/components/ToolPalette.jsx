import { TOOLS } from '../lib/editor.js'

function ToolOption({ tool, active, disabled, onSelect }) {
  return (
    <button
      type="button"
      className={`tool-option flex min-h-12 min-w-[68px] flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs transition ${active ? 'bg-white text-[var(--studio-navy)]' : 'text-white/80 hover:bg-white/10'} disabled:cursor-not-allowed disabled:opacity-35`}
      aria-label={tool.label}
      aria-pressed={active}
      title={tool.label}
      disabled={disabled}
      onClick={() => onSelect(tool.id)}
    >
      <span className={`grid h-6 place-items-center text-[17px] font-semibold leading-none ${tool.id === 'hl' ? 'rounded-sm bg-yellow-300 px-1 text-slate-900' : ''}`}>
        {tool.icon}
      </span>
      <span>{tool.label}</span>
    </button>
  )
}

export default function ToolPalette({ activeTool, disabled, onSelect }) {
  return (
    <nav aria-label="PDF annotation tools" className="tool-scroll flex gap-1 overflow-x-auto border-t border-white/10 bg-[var(--studio-navy)] px-2 pb-2 pt-1.5">
      {TOOLS.map((tool) => (
        <ToolOption key={tool.id} tool={tool} active={activeTool === tool.id} disabled={disabled} onSelect={onSelect} />
      ))}
    </nav>
  )
}