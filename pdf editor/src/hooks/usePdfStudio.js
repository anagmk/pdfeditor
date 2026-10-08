import { useCallback, useEffect, useRef, useState } from 'react'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  DEFAULT_COLORS,
  getToolHint,
  moveObject,
} from '../lib/editor.js'

let nextObjectId = 0

export function usePdfStudio({ imageInput }) {
  const [document, setDocument] = useState(null)
  const [objects, setObjects] = useState([])
  const [scale, setScale] = useState(1.3)
  const [tool, setTool] = useState('select')
  const [selectedId, setSelectedId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [image, setImage] = useState(null)
  const [message, setMessage] = useState('')
  const [style, setStyle] = useState({ color: '#000000', size: 14, strokeWidth: 2, font: 'H', bold: false })
  const [historyStatus, setHistoryStatus] = useState({ canUndo: false, canRedo: false })
  const objectsRef = useRef(objects)
  const bytesRef = useRef(null)
  const historyRef = useRef({ past: [], future: [] })
  const apiRef = useRef({ undo: () => {}, redo: () => {}, deleteSelected: () => {} })
  const toastTimeout = useRef(null)

  const toast = (text) => {
    setMessage(text)
    window.clearTimeout(toastTimeout.current)
    toastTimeout.current = window.setTimeout(() => setMessage(''), 2800)
  }

  useEffect(() => () => window.clearTimeout(toastTimeout.current), [])

  const commit = (nextObjects) => {
    historyRef.current.past.push(objectsRef.current)
    historyRef.current.future = []
    setHistoryStatus({ canUndo: true, canRedo: false })
    objectsRef.current = nextObjects
    setObjects(nextObjects)
  }

  const undo = useCallback(() => {
    const history = historyRef.current
    if (!history.past.length) return
    history.future.push(objectsRef.current)
    const previous = history.past.pop()
    setHistoryStatus({ canUndo: history.past.length > 0, canRedo: true })
    objectsRef.current = previous
    setObjects(previous)
    setSelectedId(null)
  }, [])

  const redo = useCallback(() => {
    const history = historyRef.current
    if (!history.future.length) return
    history.past.push(objectsRef.current)
    const next = history.future.pop()
    setHistoryStatus({ canUndo: true, canRedo: history.future.length > 0 })
    objectsRef.current = next
    setObjects(next)
    setSelectedId(null)
  }, [])

  const updateObject = (id, patch) => {
    commit(objectsRef.current.map((object) => object.id === id ? { ...object, ...patch } : object))
  }

  const addObject = (object) => {
    const withId = { ...object, id: ++nextObjectId }
    commit([...objectsRef.current, withId])
    return withId.id
  }

  const eraseObject = (object) => {
    if (object.type === 'text' && !object.isNew) updateObject(object.id, { deleted: true })
    else commit(objectsRef.current.filter((item) => item.id !== object.id))
    setSelectedId(null)
  }

  const finishText = (object, text) => {
    if (!text.trim()) {
      eraseObject(object)
      return
    }
    if (text !== object.text) updateObject(object.id, { text, modified: true })
  }

  const selectObject = (id) => {
    setSelectedId(id)
    const object = objectsRef.current.find((item) => item.id === id)
    if (object) {
      setStyle((current) => ({
        ...current,
        color: object.color || current.color,
        size: object.type === 'text' ? object.size : current.size,
        strokeWidth: object.strokeWidth || current.strokeWidth,
        font: object.font || current.font,
        bold: object.bold ?? current.bold,
      }))
    }
  }

  const beginDrag = (event, object, onTap) => {
    const startX = event.clientX
    const startY = event.clientY
    const baseObjects = objectsRef.current
    let moved = false
    const onMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      if (!moved && Math.hypot(dx, dy) < 4) return
      moved = true
      const nextObjects = baseObjects.map((item) => item.id === object.id
        ? moveObject(item, dx / scale, -dy / scale)
        : item)
      objectsRef.current = nextObjects
      setObjects(nextObjects)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      if (moved) {
        historyRef.current.past.push(baseObjects)
        historyRef.current.future = []
        setHistoryStatus({ canUndo: true, canRedo: false })
      } else if (onTap) onTap()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const selectedObject = objects.find((object) => object.id === selectedId)
  const changeStyle = (patch) => {
    setStyle((current) => ({ ...current, ...patch }))
    if (!selectedObject) return
    const update = {}
    if (selectedObject.type === 'text') {
      for (const key of ['color', 'size', 'font', 'bold']) {
        if (key in patch) update[key] = patch[key]
      }
      update.modified = true
    } else {
      if ('color' in patch) update.color = patch.color
      if ('strokeWidth' in patch) update.strokeWidth = patch.strokeWidth
    }
    if (Object.keys(update).length && !(selectedObject.type !== 'text' && 'size' in patch)) {
      updateObject(selectedObject.id, update)
    }
  }

  const pickTool = (nextTool) => {
    if (nextTool === 'img') {
      imageInput.current?.click()
      return
    }
    setTool(nextTool)
    setSelectedId(null)
    if (DEFAULT_COLORS[nextTool]) {
      setStyle((current) => ({ ...current, color: DEFAULT_COLORS[nextTool] }))
    }
  }

  const deleteSelected = useCallback(() => {
    const object = objectsRef.current.find((item) => item.id === selectedId)
    if (!object) return
    const nextObjects = object.type === 'text' && !object.isNew
      ? objectsRef.current.map((item) => item.id === object.id ? { ...item, deleted: true } : item)
      : objectsRef.current.filter((item) => item.id !== object.id)
    historyRef.current.past.push(objectsRef.current)
    historyRef.current.future = []
    objectsRef.current = nextObjects
    setObjects(nextObjects)
    setHistoryStatus({ canUndo: true, canRedo: false })
    setSelectedId(null)
  }, [selectedId])

  const restoreText = () => {
    if (!selectedObject || selectedObject.type !== 'text' || selectedObject.isNew) return
    updateObject(selectedObject.id, {
      x: selectedObject.originalX,
      y: selectedObject.originalY,
      size: selectedObject.originalSize,
      text: selectedObject.originalText,
      color: '#000000',
      font: 'H',
      bold: false,
      modified: false,
      deleted: false,
    })
  }

  useEffect(() => {
    apiRef.current = { undo, redo, deleteSelected }
  }, [deleteSelected, redo, undo])

  useEffect(() => {
    const onKeyDown = (event) => {
      const active = window.document.activeElement
      if (active && (active.isContentEditable || /INPUT|SELECT|TEXTAREA/.test(active.tagName))) return
      const modifier = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (modifier && key === 'z') {
        event.preventDefault()
        event.shiftKey ? apiRef.current.redo() : apiRef.current.undo()
      } else if (modifier && key === 'y') {
        event.preventDefault()
        apiRef.current.redo()
      } else if (key === 'delete' || key === 'backspace') {
        event.preventDefault()
        apiRef.current.deleteSelected()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const loadFile = async (file) => {
    if (!file) return false
    try {
      toast('Loading…')
      const bytes = new Uint8Array(await file.arrayBuffer())
      bytesRef.current = bytes
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker
      const pdf = await pdfjsLib.getDocument({ data: bytes.slice() }).promise
      const pages = []
      const extractedObjects = []
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })
        const textContent = await page.getTextContent()
        pages.push({ page, width: viewport.width, height: viewport.height })
        for (const item of textContent.items) {
          if (!item.str || !item.str.trim()) continue
          const size = Math.hypot(item.transform[0], item.transform[1]) || item.height || 10
          extractedObjects.push({
            id: ++nextObjectId,
            type: 'text',
            pageIndex: pageNumber - 1,
            originalX: item.transform[4],
            originalY: item.transform[5],
            originalWidth: item.width,
            originalSize: size,
            originalText: item.str,
            x: item.transform[4],
            y: item.transform[5],
            size,
            text: item.str,
            color: '#000000',
            font: 'H',
            bold: false,
            modified: false,
            deleted: false,
          })
        }
      }
      historyRef.current = { past: [], future: [] }
      setHistoryStatus({ canUndo: false, canRedo: false })
      const widestPage = Math.max(...pages.map((page) => page.width))
      setScale(Math.min(1.3, (window.innerWidth - 32) / widestPage))
      objectsRef.current = extractedObjects
      setObjects(extractedObjects)
      setSelectedId(null)
      setDocument({ pages, name: file.name })
      toast(extractedObjects.length
        ? `${pdf.numPages} page(s), ${extractedObjects.length} text blocks loaded`
        : 'No selectable text (scanned PDF?) — you can still annotate')
      return true
    } catch (error) {
      console.error(error)
      toast('Could not open that PDF')
      return false
    }
  }

  const loadImage = (file) => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const imageElement = new Image()
    imageElement.onload = () => {
      const canvas = window.document.createElement('canvas')
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      canvas.getContext('2d').drawImage(imageElement, 0, 0)
      setImage({ source: canvas.toDataURL('image/png'), ratio: imageElement.naturalHeight / imageElement.naturalWidth })
      setTool('img')
      setSelectedId(null)
      URL.revokeObjectURL(objectUrl)
      toast('Click on the page to place the image')
    }
    imageElement.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      toast('Could not open that image')
    }
    imageElement.src = objectUrl
  }

  const save = async () => {
    if (!document || !bytesRef.current) return
    try {
      toast('Building PDF…')
      const { LineCapStyle, PDFDocument, rgb, StandardFonts } = await import('pdf-lib')
      const colorFromHex = (hex) => {
        const value = Number.parseInt(hex.slice(1), 16)
        return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255)
      }
      const pdf = await PDFDocument.load(bytesRef.current, { ignoreEncryption: true })
      const pages = pdf.getPages()
      const embeddedFonts = {}
      const fontNames = {
        H: ['Helvetica', 'HelveticaBold'],
        T: ['TimesRoman', 'TimesRomanBold'],
        C: ['Courier', 'CourierBold'],
      }
      const getFont = async (font, bold) => {
        const key = `${font}${bold}`
        if (!embeddedFonts[key]) {
          embeddedFonts[key] = await pdf.embedFont(StandardFonts[fontNames[font][bold ? 1 : 0]])
        }
        return embeddedFonts[key]
      }
      let lossyText = false
      for (const object of objects) {
        const page = pages[object.pageIndex]
        const color = object.color && colorFromHex(object.color)
        if (object.type === 'text') {
          if (!(object.modified || object.deleted)) continue
          if (!object.isNew) {
            page.drawRectangle({
              x: object.originalX - 1,
              y: object.originalY - object.originalSize * 0.25,
              width: object.originalWidth + 2,
              height: object.originalSize * 1.25,
              color: rgb(1, 1, 1),
              borderWidth: 0,
            })
          }
          if (object.deleted || !object.text) continue
          const font = await getFont(object.font, object.bold)
          object.text.split('\n').forEach((line, lineIndex) => {
            const safeText = [...line].map((character) => {
              try {
                font.encodeText(character)
                return character
              } catch {
                lossyText = true
                return '?'
              }
            }).join('')
            page.drawText(safeText, {
              x: object.x,
              y: object.y - lineIndex * object.size * 1.15,
              size: object.size,
              font,
              color,
            })
          })
        } else if (object.type === 'hl') {
          page.drawRectangle({ x: object.x, y: object.y, width: object.width, height: object.height, color, opacity: 0.4 })
        } else if (object.type === 'ul') {
          page.drawLine({ start: { x: object.x, y: object.y }, end: { x: object.x + object.width, y: object.y }, thickness: object.strokeWidth, color })
        } else if (object.type === 'st') {
          page.drawLine({ start: { x: object.x, y: object.y + object.height / 2 }, end: { x: object.x + object.width, y: object.y + object.height / 2 }, thickness: object.strokeWidth, color })
        } else if (object.type === 'rect') {
          page.drawRectangle({ x: object.x, y: object.y, width: object.width, height: object.height, borderColor: color, borderWidth: object.strokeWidth })
        } else if (object.type === 'ellipse') {
          page.drawEllipse({ x: object.x + object.width / 2, y: object.y + object.height / 2, xScale: object.width / 2, yScale: object.height / 2, borderColor: color, borderWidth: object.strokeWidth })
        } else if (object.type === 'white' || object.type === 'redact') {
          page.drawRectangle({ x: object.x, y: object.y, width: object.width, height: object.height, color, borderWidth: 0 })
        } else if (object.type === 'draw') {
          for (let index = 1; index < object.points.length; index += 1) {
            page.drawLine({
              start: { x: object.points[index - 1][0], y: object.points[index - 1][1] },
              end: { x: object.points[index][0], y: object.points[index][1] },
              thickness: object.strokeWidth,
              color,
              lineCap: LineCapStyle.Round,
            })
          }
        } else if (object.type === 'img') {
          const embeddedImage = await pdf.embedPng(object.source)
          page.drawImage(embeddedImage, { x: object.x, y: object.y, width: object.width, height: object.height })
        }
      }
      const output = await pdf.save()
      const filename = document.name.replace(/\.pdf$/i, '') + '-edited.pdf'
      const downloadUrl = URL.createObjectURL(new Blob([output], { type: 'application/pdf' }))
      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.click()
      URL.revokeObjectURL(downloadUrl)
      toast(lossyText ? 'Saved — some non-Latin characters became “?”' : 'Saved')
    } catch (error) {
      console.error(error)
      toast('Could not save the PDF')
    }
  }

  const pageActions = {
    tool,
    setTool,
    setScale,
    style,
    selectedId,
    selectObject,
    addObject,
    eraseObject,
    beginDrag,
    finishText,
    editId,
    setEditId,
    image,
  }
  const isTextTool = (selectedObject && selectedObject.type === 'text') || (!selectedObject && tool === 'text')
  const hasStrokeWidth = selectedObject
    ? selectedObject.type !== 'text' && selectedObject.type !== 'img'
    : ['ul', 'st', 'rect', 'ellipse', 'draw'].includes(tool)

  return {
    document,
    objects,
    scale,
    setScale,
    tool,
    style,
    selectedObject,
    selectedId,
    message,
    history: historyStatus,
    hint: document ? getToolHint(tool) : '',
    isTextTool,
    hasStrokeWidth,
    pageActions,
    undo,
    redo,
    save,
    loadFile,
    loadImage,
    pickTool,
    changeStyle,
    deleteSelected,
    restoreText,
  }
}