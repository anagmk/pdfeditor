import { useRef, useState } from 'react'
import Toast from './components/Toast.jsx'
import { usePdfStudio } from './hooks/usePdfStudio.js'
import EditorWorkspace from './pages/EditorWorkspace.jsx'
import HomePage from './pages/HomePage.jsx'

function App() {
  const pdfInput = useRef(null)
  const imageInput = useRef(null)
  const studio = usePdfStudio({ imageInput })
  const [view, setView] = useState('home')

  const openFile = () => pdfInput.current?.click()
  const handlePdfFile = async (file) => {
    if (await studio.loadFile(file)) setView('editor')
  }
  const handlePdfChange = (event) => {
    handlePdfFile(event.target.files[0])
    event.target.value = ''
  }
  const handleImageChange = (event) => {
    studio.loadImage(event.target.files[0])
    event.target.value = ''
  }
  return (
    <div className="h-full min-h-0 bg-[var(--studio-bg)] text-[var(--studio-text)]">
      {view === 'editor' && studio.document ? (
        <EditorWorkspace
          studio={studio}
          onOpen={openFile}
          onHome={() => setView('home')}
          onFile={handlePdfFile}
        />
      ) : (
        <HomePage
          onOpen={openFile}
          onFile={handlePdfFile}
          busy={studio.message === 'Loading…'}
        />
      )}
      <input
        ref={pdfInput}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={handlePdfChange}
      />
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageChange}
      />
      <Toast message={studio.message} />
    </div>
  )
}

export default App
