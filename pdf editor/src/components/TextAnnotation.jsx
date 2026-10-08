import { useEffect, useLayoutEffect, useRef } from 'react'
import { estimateTextWidth, FONT_FAMILIES } from '../lib/editor.js'

export default function TextAnnotation({ object, scale, pageHeight, actions }) {
  const elementRef = useRef(null)
  const editingRef = useRef(false)
  const fontSize = object.size * scale
  const showText = object.modified || object.isNew

  useLayoutEffect(() => {
    if (!editingRef.current && elementRef.current) elementRef.current.textContent = object.text
  }, [object.text])

  const startEditing = (selectAll) => {
    const element = elementRef.current
    if (!element) return
    editingRef.current = true
    element.contentEditable = 'true'
    element.classList.add('is-editing')
    element.focus()
    const range = window.document.createRange()
    range.selectNodeContents(element)
    if (!selectAll) range.collapse(false)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }

  useEffect(() => {
    if (actions.editId === object.id) {
      startEditing(true)
      actions.setEditId(null)
    }
  }, [actions.editId, actions, object.id])

  const finishEditing = () => {
    if (!editingRef.current) return
    const element = elementRef.current
    editingRef.current = false
    element.contentEditable = 'false'
    element.classList.remove('is-editing')
    actions.finishText(object, element.innerText.replace(/\n$/, ''))
  }

  return (
    <div
      ref={elementRef}
      data-object="true"
      className={`text-annotation${actions.selectedId === object.id ? ' is-selected' : ''}`}
      style={{
        left: object.x * scale,
        top: (pageHeight - object.y) * scale - fontSize * 0.82,
        fontSize,
        fontFamily: FONT_FAMILIES[object.font],
        fontWeight: object.bold ? 700 : 400,
        color: showText ? object.color : 'transparent',
        minWidth: object.isNew ? 0 : estimateTextWidth(object) * scale,
        pointerEvents: actions.tool === 'select' || actions.tool === 'erase' ? 'auto' : 'none',
      }}
      onPointerDown={(event) => {
        if (editingRef.current) return
        if (actions.tool === 'erase') {
          actions.eraseObject(object)
          return
        }
        event.preventDefault()
        event.stopPropagation()
        actions.selectObject(object.id)
        actions.beginDrag(event, object, () => startEditing(false))
      }}
      onBlur={finishEditing}
      onKeyDown={(event) => {
        if (event.key === 'Escape') elementRef.current.blur()
      }}
    />
  )
}