export const FONT_FAMILIES = {
  H: 'Helvetica, Arial, sans-serif',
  T: '"Times New Roman", serif',
  C: '"Courier New", monospace',
}

export const TOOLS = [
  { id: 'select', icon: '↖', label: 'Select' },
  { id: 'text', icon: 'T', label: 'Add Text' },
  { id: 'hl', icon: 'A', label: 'Highlight' },
  { id: 'ul', icon: 'U', label: 'Underline' },
  { id: 'st', icon: 'S', label: 'Strikeout' },
  { id: 'rect', icon: '▢', label: 'Rectangle' },
  { id: 'ellipse', icon: '◯', label: 'Ellipse' },
  { id: 'draw', icon: '✎', label: 'Draw' },
  { id: 'img', icon: '▧', label: 'Image' },
  { id: 'white', icon: '□', label: 'Whiteout' },
  { id: 'redact', icon: '■', label: 'Blackout' },
  { id: 'erase', icon: '⌫', label: 'Eraser' },
]

export const DEFAULT_COLORS = {
  text: '#000000', hl: '#fde047', ul: '#ef4444', st: '#ef4444',
  rect: '#2563eb', ellipse: '#2563eb', draw: '#16a34a',
  white: '#ffffff', redact: '#000000',
}

export const MARKUP_TOOLS = ['hl', 'ul', 'st']
export const estimateTextWidth = (object) =>
  object.modified || object.isNew ? object.size * 0.5 * object.text.length : object.originalWidth

export function getObjectBounds(object) {
  if (object.type === 'draw') {
    const xs = object.points.map(([x]) => x)
    const ys = object.points.map(([, y]) => y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y }
  }
  return { x: object.x, y: object.y, width: object.width, height: object.height }
}

export function moveObject(object, dx, dy) {
  if (object.type === 'draw') {
    return { ...object, points: object.points.map(([x, y]) => [x + dx, y + dy]) }
  }
  return {
    ...object,
    x: object.x + dx,
    y: object.y + dy,
    ...(object.type === 'text' ? { modified: true } : {}),
  }
}

export function getToolHint(tool) {
  const hints = {
    select: 'Click text to edit · drag anything to move it',
    text: 'Click on the page to add text',
    erase: 'Click an item to remove it',
    img: 'Click on the page to place the image',
    white: 'Drag to cover an area with white',
    redact: 'Drag to cover with black (underlying text stays in the file)',
  }
  if (hints[tool]) return hints[tool]
  return MARKUP_TOOLS.includes(tool) ? 'Drag over text, or click a word' : 'Drag on the page'
}