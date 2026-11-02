import { useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [preview, setPreview] = useState(false)
  const textarea = useRef<HTMLTextAreaElement>(null)

  function format(before: string, after = '', placeholder = 'texto') {
    const element = textarea.current
    if (!element) return
    const start = element.selectionStart
    const end = element.selectionEnd
    const selected = value.slice(start, end) || placeholder
    onChange(`${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`)
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  return <div className="field markdown-editor">
    <span className="field-label">Descrição (Markdown)</span>
    <div className="markdown-tools">
      <button type="button" disabled={preview} onClick={() => format('**', '**')} aria-label="Negrito"><strong>B</strong></button>
      <button type="button" disabled={preview} onClick={() => format('*', '*')} aria-label="Itálico"><em>I</em></button>
      <button type="button" disabled={preview} onClick={() => format('## ', '', 'Subtítulo')} aria-label="Subtítulo">H2</button>
      <button type="button" disabled={preview} onClick={() => format('- ', '', 'Item')} aria-label="Lista">• Lista</button>
      <button type="button" className="markdown-preview-toggle" onClick={() => setPreview((current) => !current)}>{preview ? 'Editar' : 'Prévia'}</button>
    </div>
    {preview ? <div className="markdown-preview"><ReactMarkdown>{value || 'A descrição aparecerá aqui.'}</ReactMarkdown></div> : <textarea ref={textarea} rows={7} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Descreva o veículo, condições e diferenciais..." />}
    <span className="field-hint">Use **negrito**, *itálico*, ## subtítulos e - listas. O catálogo mostra a formatação.</span>
  </div>
}
