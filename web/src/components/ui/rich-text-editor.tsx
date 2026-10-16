'use client'

import { useRef, useCallback } from 'react'
import { Bold, Italic, List, ListOrdered, Link2, Heading2, Eye, Edit3 } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  label?: string
}

type ToolbarAction = {
  icon: React.ElementType
  title: string
  action: (selectedText: string, before: string, after: string) => { prefix: string; suffix: string; placeholder: string }
}

const TOOLBAR: ToolbarAction[] = [
  {
    icon: Bold,
    title: 'Negrito (Ctrl+B)',
    action: () => ({ prefix: '**', suffix: '**', placeholder: 'texto em negrito' }),
  },
  {
    icon: Italic,
    title: 'Itálico (Ctrl+I)',
    action: () => ({ prefix: '*', suffix: '*', placeholder: 'texto em itálico' }),
  },
  {
    icon: Heading2,
    title: 'Subtítulo',
    action: () => ({ prefix: '## ', suffix: '', placeholder: 'Subtítulo' }),
  },
  {
    icon: List,
    title: 'Lista com marcadores',
    action: () => ({ prefix: '- ', suffix: '', placeholder: 'Item da lista' }),
  },
  {
    icon: ListOrdered,
    title: 'Lista numerada',
    action: () => ({ prefix: '1. ', suffix: '', placeholder: 'Item da lista' }),
  },
  {
    icon: Link2,
    title: 'Link',
    action: (sel) => ({
      prefix: '[',
      suffix: `](${sel.startsWith('http') ? sel : 'https://'})`,
      placeholder: 'texto do link',
    }),
  },
]

export function RichTextEditor({ value, onChange, placeholder, rows = 8, label }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  const applyFormat = useCallback((action: ToolbarAction) => {
    const ta = textareaRef.current
    if (!ta) return

    const start = ta.selectionStart
    const end = ta.selectionEnd
    const before = value.slice(0, start)
    const selected = value.slice(start, end)
    const after = value.slice(end)

    const { prefix, suffix, placeholder: ph } = action.action(selected, before, after)
    const insert = selected || ph
    const newValue = `${before}${prefix}${insert}${suffix}${after}`

    onChange(newValue)

    requestAnimationFrame(() => {
      ta.focus()
      const cursorStart = before.length + prefix.length
      const cursorEnd = cursorStart + insert.length
      ta.setSelectionRange(cursorStart, cursorEnd)
    })
  }, [value, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); applyFormat(TOOLBAR[0]) }
      if (e.key === 'i') { e.preventDefault(); applyFormat(TOOLBAR[1]) }
    }
    // Auto-continue list on Enter
    if (e.key === 'Enter') {
      const ta = e.currentTarget
      const pos = ta.selectionStart
      const lineStart = value.lastIndexOf('\n', pos - 1) + 1
      const currentLine = value.slice(lineStart, pos)
      const bulletMatch = currentLine.match(/^(\s*)([-*]\s)/)
      const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s/)
      if (bulletMatch) {
        e.preventDefault()
        const insertion = `\n${bulletMatch[1]}${bulletMatch[2]}`
        const newVal = value.slice(0, pos) + insertion + value.slice(pos)
        onChange(newVal)
        requestAnimationFrame(() => {
          ta.setSelectionRange(pos + insertion.length, pos + insertion.length)
        })
      } else if (orderedMatch) {
        e.preventDefault()
        const nextNum = parseInt(orderedMatch[2]) + 1
        const insertion = `\n${orderedMatch[1]}${nextNum}. `
        const newVal = value.slice(0, pos) + insertion + value.slice(pos)
        onChange(newVal)
        requestAnimationFrame(() => {
          ta.setSelectionRange(pos + insertion.length, pos + insertion.length)
        })
      }
    }
  }, [value, onChange, applyFormat])

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-all">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/40">
          {TOOLBAR.map((item) => (
            <button
              key={item.title}
              type="button"
              title={item.title}
              onMouseDown={(e) => { e.preventDefault(); applyFormat(item) }}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            >
              <item.icon size={14} />
            </button>
          ))}
          <div className="flex-1" />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setPreview((p) => !p) }}
            title={preview ? 'Editar' : 'Pré-visualizar'}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            {preview ? <Edit3 size={13} /> : <Eye size={13} />}
            {preview ? 'Editar' : 'Preview'}
          </button>
        </div>

        {/* Editor / Preview */}
        {preview ? (
          <div className="px-3 py-2 min-h-[120px] text-sm text-foreground prose prose-sm max-w-none">
            {value ? (
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 text-sm text-muted-foreground leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5 text-sm text-muted-foreground">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5 text-sm text-muted-foreground">{children}</ol>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  a: ({ href, children }) => <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">{placeholder ?? 'Nenhum conteúdo ainda...'}</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none resize-none font-mono leading-relaxed"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Suporta markdown: **negrito**, *itálico*, ## título, - lista. Ctrl+B / Ctrl+I.
      </p>
    </div>
  )
}
