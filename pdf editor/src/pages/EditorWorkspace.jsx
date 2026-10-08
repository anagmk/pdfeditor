import { useState } from 'react'
import PdfPage from '../components/PdfPage.jsx'
import StudioHeader from '../components/StudioHeader.jsx'
import ToolPalette from '../components/ToolPalette.jsx'
import ToolProperties from '../components/ToolProperties.jsx'

export default function EditorWorkspace({ studio, onOpen, onHome, onFile }) {
  const [draggingFile, setDraggingFile] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--studio-bg)] text-[var(--studio-text)]">
      <StudioHeader
        document={studio.document}
        scale={studio.scale}
        setScale={studio.setScale}
        canUndo={studio.history.canUndo}
        canRedo={studio.history.canRedo}
        onUndo={studio.undo}
        onRedo={studio.redo}
        onOpen={onOpen}
        onSave={studio.save}
        onHome={onHome}
      />
      <ToolPalette activeTool={studio.tool} disabled={false} onSelect={studio.pickTool} />
      <ToolProperties
        state={studio.style}
        selected={studio.selectedObject}
        tool={studio.tool}
        hint={studio.hint}
        onChange={studio.changeStyle}
        onDelete={studio.deleteSelected}
        onRestore={studio.restoreText}
      />
      {studio.hint && (
        <div className="border-b border-[var(--studio-border)] bg-[var(--studio-panel)] px-3 py-1.5 text-[11px] text-[var(--studio-muted)] sm:hidden">
          {studio.hint}
        </div>
      )}
      <main
        className={`min-h-0 flex-1 overflow-auto px-2 py-4 text-center sm:px-5 sm:py-6 ${draggingFile ? 'bg-[#e4e3ff]' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDraggingFile(true)
        }}
        onDragLeave={() => setDraggingFile(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDraggingFile(false)
          const file = event.dataTransfer.files[0]
          if (file) onFile(file)
        }}
      >
        <div className="mx-auto flex w-fit min-w-full flex-col items-center">
          {studio.document.pages.map((pageInfo, index) => (
            <PdfPage
              key={`${studio.document.name}-${index}`}
              index={index}
              info={pageInfo}
              scale={studio.scale}
              objects={studio.objects.filter((object) => object.pageIndex === index)}
              actions={studio.pageActions}
            />
          ))}
        </div>
      </main>
      {draggingFile && (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-20 rounded-xl border border-[var(--studio-blue)] bg-white/95 px-4 py-3 text-center text-sm font-semibold text-[var(--studio-blue)] shadow-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
          Drop a PDF to open it
        </div>
      )}
    </div>
  )
}