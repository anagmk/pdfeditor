import { getObjectBounds } from '../lib/editor.js'

export default function Annotation({ object, scale, pageHeight, tool, selected, onPointerDown, ghost = false }) {
  const toX = (value) => value * scale
  const toY = (value) => (pageHeight - value) * scale
  const bounds = getObjectBounds(object)
  const x = toX(bounds.x)
  const y = toY(bounds.y + bounds.height)
  const width = bounds.width * scale
  const height = bounds.height * scale
  const strokeWidth = Math.max(1, (object.strokeWidth || 2) * scale)
  const common = { stroke: object.color, strokeWidth }
  let shape = null

  if (object.type === 'hl') shape = <rect x={x} y={y} width={width} height={height} fill={object.color} opacity=".4" style={{ mixBlendMode: 'multiply' }} />
  if (object.type === 'ul') shape = <line x1={x} x2={x + width} y1={y + height} y2={y + height} {...common} />
  if (object.type === 'st') shape = <line x1={x} x2={x + width} y1={y + height / 2} y2={y + height / 2} {...common} />
  if (object.type === 'rect') shape = <rect x={x} y={y} width={width} height={height} fill="none" {...common} />
  if (object.type === 'ellipse') shape = <ellipse cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} fill="none" {...common} />
  if (object.type === 'white' || object.type === 'redact') shape = <rect x={x} y={y} width={width} height={height} fill={object.color} stroke={ghost ? '#888' : 'none'} />
  if (object.type === 'draw') {
    const points = object.points.map(([pointX, pointY]) => `${toX(pointX)},${toY(pointY)}`).join(' ')
    shape = <polyline points={points} fill="none" stroke={object.color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  }
  if (object.type === 'img') shape = <image href={object.source} x={x} y={y} width={width} height={height} preserveAspectRatio="none" />

  const isLive = !ghost && (tool === 'select' || tool === 'erase')
  return (
    <g
      data-object="true"
      onPointerDown={isLive ? onPointerDown : undefined}
      style={{ pointerEvents: isLive ? 'all' : 'none', cursor: tool === 'erase' ? 'pointer' : 'move' }}
    >
      {shape}
      {isLive && <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="transparent" />}
      {selected && <rect x={x - 3} y={y - 3} width={width + 6} height={height + 6} fill="none" stroke="#2672b8" strokeWidth="2" strokeDasharray="5 3" />}
    </g>
  )
}