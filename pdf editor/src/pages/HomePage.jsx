import { useState } from 'react'

function UploadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-9" fill="none">
      <path d="M14 6.75h13l8 8v24.5A2.75 2.75 0 0 1 32.25 42h-18.5A2.75 2.75 0 0 1 11 39.25v-29.5A3 3 0 0 1 14 6.75Z" fill="#f2a17d" />
      <path d="M27 7v8h8" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M24 33V22m0 0-4.5 4.5M24 22l4.5 4.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function HomePage({ onOpen, onFile, busy }) {
  const [dragging, setDragging] = useState(false)

  return (
    <div className="home-shell home-pattern flex min-h-full flex-col overflow-auto text-[var(--studio-text)]">
      <header className="relative z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-[var(--studio-border)]/70 bg-white/75 px-5 backdrop-blur-md sm:px-10">
        <a href="#home" className="flex items-center gap-2.5 text-inherit no-underline" aria-label="PDF Studio home">
          <span className="grid size-9 place-items-center rounded-[11px] bg-[var(--studio-blue)] text-sm font-bold text-white shadow-[0_5px_14px_rgba(98,95,224,0.25)]">P</span>
          <span className="text-[15px] font-bold tracking-normal">paper<span className="text-[var(--studio-blue)]">work</span></span>
        </a>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="hidden items-center gap-1.5 text-xs text-[var(--studio-muted)] sm:flex">
            <span className="size-1.5 rounded-full bg-[#65b58a]" /> Private by design
          </span>
          <button type="button" className="rounded-full border border-[var(--studio-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--studio-text)] transition hover:border-[var(--studio-blue)]" onClick={onOpen}>
            Open a PDF
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center px-5 pb-14 pt-12 text-center sm:px-8 sm:pt-[72px]">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#deddf7] bg-white/75 px-3 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-[var(--studio-blue)] shadow-sm">
          <span className="size-1.5 rounded-full bg-[var(--studio-orange)]" /> YOUR PDF WORKSPACE
        </div>
        <h1 className="max-w-[720px] text-[36px] font-semibold leading-[1.12] tracking-[-0.025em] text-[#292c43] sm:text-[52px]">
          A little more clarity.
          <br className="hidden sm:block" /> A lot less PDF friction.
        </h1>
        <p className="mt-4 max-w-[480px] text-sm leading-6 text-[var(--studio-muted)] sm:text-base">
          Make the small edits, notes, and markups that keep your work moving.
        </p>

        <section
          aria-label="Upload a PDF"
          className={`upload-zone mt-9 flex min-h-[248px] w-full max-w-[650px] flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-8 transition sm:mt-10 sm:min-h-[270px] ${dragging ? 'border-[var(--studio-blue)] bg-[#f2f2ff]' : 'border-[#c9c9e6]'}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files[0]
            if (file) onFile(file)
          }}
        >
          <div className="mb-3 grid size-[62px] place-items-center rounded-[18px] bg-[#f6e9e4]">
            <UploadIcon />
          </div>
          <h2 className="text-base font-semibold">Drop your PDF here</h2>
          <p className="mt-1 text-xs text-[var(--studio-muted)]">A good place to start. Your file stays on this device.</p>
          <button
            type="button"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--studio-blue)] px-5 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(98,95,224,0.2)] transition hover:bg-[#5350c9] disabled:cursor-wait disabled:opacity-65"
            onClick={onOpen}
            disabled={busy}
          >
            {busy ? 'Opening PDF…' : 'Choose a file'}
            {!busy && <span aria-hidden="true">↗</span>}
          </button>
          <span className="mt-3 text-[11px] text-[#9294a8]">PDF files only · No account needed</span>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--studio-muted)]">
          <span className="inline-flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-white text-[10px] text-[#6b9a7b]">✓</span>Private on your device</span>
          <span className="inline-flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-white text-[10px] text-[var(--studio-blue)]">↗</span>Works on mobile</span>
          <span className="inline-flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-white text-[10px] text-[var(--studio-orange)]">⌁</span>Simple to use</span>
        </div>
      </main>

      <footer className="flex min-h-[56px] shrink-0 flex-col items-center justify-center gap-1 border-t border-[var(--studio-border)]/70 bg-white/45 px-5 py-3 text-[11px] text-[var(--studio-muted)] sm:flex-row sm:justify-between sm:px-10">
        <span>© 2026 Paperwork Studio</span>
        <span>Files are processed locally in your browser</span>
      </footer>
    </div>
  )
}