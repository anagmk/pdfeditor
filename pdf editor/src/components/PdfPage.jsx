import { useEffect, useRef, useState } from 'react'
import Annotation from './Annotation.jsx'
import TextAnnotation from './TextAnnotation.jsx'
import { MARKUP_TOOLS } from '../lib/editor.js'

export default function PdfPage({ index, info, scale, objects, actions }) {
  const { page, width: pageWidth, height: pageHeight } = info
  const canvasRef = useRef(null)
  const pageRef = useRef(null)
  const gestureRef = useRef(null)
  const touchPointsRef = useRef(new Map())
  const pinchRef = useRef(null)
  const [gesture, setGesture] = useState(null)

  useEffect(() => {
    const deviceScale = window.devicePixelRatio || 1
    const viewport = page.getViewport({ scale })
    const canvas = canvasRef.current
    canvas.width = viewport.width * deviceScale
    canvas.height = viewport.height * deviceScale
    const renderTask = page.render({
      canvasContext: canvas.getContext('2d'),
      viewport,
      transform: deviceScale !== 1 ? [deviceScale, 0, 0, deviceScale, 0, 0] : null,
    })
    renderTask.promise.catch(() => {})
    return () => renderTask.cancel()
  }, [page, scale])

  const getPoint = (event) => {
    const bounds = pageRef.current.getBoundingClientRect()
    return [(event.clientX - bounds.left) / scale, pageHeight - (event.clientY - bounds.top) / scale]
  }

  const tool = actions.tool
  const creating = tool !== 'select' && tool !== 'erase'
  const beginTouchPinch = (event) => {
    if (event.pointerType !== 'touch') return
    const touchPoints = touchPointsRef.current
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touchPoints.size < 2) return
    const [first, second] = [...touchPoints.values()]
    const startDistance = Math.hypot(second.x - first.x, second.y - first.y)
    if (!startDistance) return
    event.preventDefault()
    event.stopPropagation()
    pinchRef.current = { startDistance, startScale: scale }
    gestureRef.current = null
    setGesture(null)
  }

  const moveTouchPinch = (event) => {
    if (event.pointerType !== 'touch' || !touchPointsRef.current.has(event.pointerId)) return
    const touchPoints = touchPointsRef.current
    touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (!pinchRef.current || touchPoints.size < 2) return
    event.preventDefault()
    event.stopPropagation()
    const [first, second] = [...touchPoints.values()]
    const distance = Math.hypot(second.x - first.x, second.y - first.y)
    const nextScale = pinchRef.current.startScale * distance / pinchRef.current.startDistance
    actions.setScale(Math.max(0.5, Math.min(3, nextScale)))
  }

  const endTouchPinch = (event) => {
    if (event.pointerType !== 'touch') return
    const wasPinching = Boolean(pinchRef.current)
    touchPointsRef.current.delete(event.pointerId)
    if (touchPointsRef.current.size < 2) pinchRef.current = null
    if (wasPinching) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const beginGesture = (event) => {
    event.preventDefault()
    const point = getPoint(event)
    if (tool === 'text') {
      const id = actions.addObject({
        type: 'text', pageIndex: index, x: point[0], y: point[1] - actions.style.size * 0.8,
        size: actions.style.size, text: 'New text', color: actions.style.color,
        font: actions.style.font, bold: actions.style.bold, isNew: true,
      })
      actions.setEditId(id)
      actions.setTool('select')
      return
    }
    if (tool === 'img') {
      if (!actions.image) return
      const objectWidth = Math.min(160, pageWidth / 2)
      actions.addObject({
        type: 'img', pageIndex: index, x: point[0], y: point[1] - objectWidth * actions.image.ratio,
        width: objectWidth, height: objectWidth * actions.image.ratio, source: actions.image.source,
      })
      actions.setTool('select')
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    const initialGesture = { start: point, end: point, points: [point] }
    gestureRef.current = initialGesture
    setGesture(initialGesture)
  }

  const updateGesture = (event) => {
    const currentGesture = gestureRef.current
    if (!currentGesture) return
    const point = getPoint(event)
    const nextGesture = {
      ...currentGesture,
      end: point,
      points: tool === 'draw' ? [...currentGesture.points, point] : currentGesture.points,
    }
    gestureRef.current = nextGesture
    setGesture(nextGesture)
  }

  const finishGesture = () => {
    const completedGesture = gestureRef.current
    if (!completedGesture) return
    gestureRef.current = null
    setGesture(null)
    const { start, end, points } = completedGesture
    const x = Math.min(start[0], end[0])
    const y = Math.min(start[1], end[1])
    const objectWidth = Math.abs(start[0] - end[0])
    const objectHeight = Math.abs(start[1] - end[1])
    const annotation = {
      type: tool,
      pageIndex: index,
      color: actions.style.color,
      strokeWidth: actions.style.strokeWidth,
    }
    if (tool === 'draw') {
      if (points.length > 1) actions.addObject({ ...annotation, points })
      return
    }
    if (objectWidth > 3 || objectHeight > 3) {
      actions.addObject({ ...annotation, x, y, width: objectWidth, height: objectHeight })
    } else if (MARKUP_TOOLS.includes(tool)) {
      const textObject = objects.find((object) => object.type === 'text'
        && !object.deleted
        && start[0] >= object.x
        && start[0] <= object.x + (object.modified || object.isNew ? object.size * 0.5 * object.text.length : object.originalWidth)
        && start[1] >= object.y - object.size * 0.25
        && start[1] <= object.y + object.size)
      if (textObject) {
        const textWidth = textObject.modified || textObject.isNew
          ? textObject.size * 0.5 * textObject.text.length
          : textObject.originalWidth
        actions.addObject({
          ...annotation,
          x: textObject.x,
          y: textObject.y - textObject.size * 0.2,
          width: textWidth,
          height: textObject.size * 1.2,
        })
      }
    }
  }

  let preview = null
  if (gesture && tool === 'draw') {
    preview = { type: 'draw', points: gesture.points, color: actions.style.color, strokeWidth: actions.style.strokeWidth }
  } else if (gesture) {
    preview = {
      type: tool,
      x: Math.min(gesture.start[0], gesture.end[0]),
      y: Math.min(gesture.start[1], gesture.end[1]),
      width: Math.abs(gesture.start[0] - gesture.end[0]),
      height: Math.abs(gesture.start[1] - gesture.end[1]),
      color: actions.style.color,
      strokeWidth: actions.style.strokeWidth,
    }
  }

  const textObjects = objects.filter((object) => object.type === 'text')
  return (
    <div
      ref={pageRef}
      className="page"
      style={{ width: pageWidth * scale, height: pageHeight * scale }}
      onPointerDownCapture={beginTouchPinch}
      onPointerMoveCapture={moveTouchPinch}
      onPointerUpCapture={endTouchPinch}
      onPointerCancelCapture={endTouchPinch}
      onPointerDown={(event) => {
        if (!event.target.closest('[data-object]')) actions.selectObject(null)
      }}
    >
      <canvas ref={canvasRef} />
      <svg width={pageWidth * scale} height={pageHeight * scale} style={{ pointerEvents: 'none' }}>
        {objects.filter((object) => object.type !== 'text').map((object) => (
          <Annotation
            key={object.id}
            object={object}
            scale={scale}
            pageHeight={pageHeight}
            tool={tool}
            selected={actions.selectedId === object.id}
            onPointerDown={(event) => {
              if (tool === 'erase') {
                actions.eraseObject(object)
                return
              }
              event.stopPropagation()
              actions.selectObject(object.id)
              actions.beginDrag(event, object)
            }}
          />
        ))}
        {preview && <Annotation object={preview} scale={scale} pageHeight={pageHeight} tool={tool} ghost />}
      </svg>
      {textObjects.filter((object) => !object.isNew && (object.modified || object.deleted)).map((object) => (
        <div
          key={`cover-${object.id}`}
          className="text-cover"
          style={{
            left: (object.originalX - 1) * scale,
            top: (pageHeight - object.originalY - object.originalSize) * scale,
            width: (object.originalWidth + 2) * scale,
            height: object.originalSize * 1.25 * scale,
          }}
        />
      ))}
      {textObjects.filter((object) => !object.deleted).map((object) => (
        <TextAnnotation key={object.id} object={object} scale={scale} pageHeight={pageHeight} actions={actions} />
      ))}
      {creating && (
        <div
          className="page-capture"
          onPointerDown={beginGesture}
          onPointerMove={updateGesture}
          onPointerUp={finishGesture}
        />
      )}
    </div>
  )
}