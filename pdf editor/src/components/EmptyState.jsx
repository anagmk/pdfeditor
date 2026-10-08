export default function EmptyState({ dragging, onOpen }) {
  return (
    <section className={`mx-auto my-[8vh] max-w-[500px] rounded-xl border-2 border-dashed bg-[var(--studio-panel)] px-6 py-10 transition-colors sm:px-12 ${dragging ? 'border-[var(--studio-orange)]' : 'border-[var(--studio-border)]'}`}>
      <div aria-hidden="true" className="mx-auto mb-5 grid size-14 place-items-center rounded-xl bg-[#eaf1f6] text-2xl text-[var(--studio-navy)]">▤</div>
      <h1 className="mb-2 text-xl font-semibold text-[var(--studio-text)]">Open a PDF to start editing</h1>
      <p className="mx-auto mb-5 max-w-sm text-sm leading-6 text-[var(--studio-muted)]">Edit and move text, highlight, draw, add shapes and images. Everything stays in your browser.</p>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--studio-orange)] px-4 text-sm font-semibold text-white transition hover:brightness-105"
        onClick={onOpen}
      >
        Choose PDF
      </button>
      <p className="mt-3 text-xs text-[var(--studio-muted)]">or drop a file here</p>
    </section>
  )
}