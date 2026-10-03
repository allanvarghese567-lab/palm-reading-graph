import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import './ReportSection.css'

interface Props {
  number: number
  title: string
  content: string
  defaultOpen?: boolean
}

/** Renders markdown-ish content with basic formatting */
function formatContent(raw: string) {
  const lines = raw.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`ul-${elements.length}`}>
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(<h3 key={idx}>{trimmed.slice(3)}</h3>)
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(<h4 key={idx}>{trimmed.slice(4)}</h4>)
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2))
    } else if (trimmed === '') {
      flushList()
    } else {
      flushList()
      const parts = trimmed.split(/(\*\*[^*]+\*\*)/g)
      elements.push(
        <p key={idx}>
          {parts.map((p, i) =>
            p.startsWith('**') && p.endsWith('**') ? (
              <strong key={i}>{p.slice(2, -2)}</strong>
            ) : (
              p
            )
          )}
        </p>
      )
    }
  })
  flushList()
  return elements
}

export function ReportSection({ number, title, content, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`report-section ${open ? 'open' : ''}`}>
      <button
        type="button"
        className="section-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="section-num">{String(number).padStart(2, '0')}</span>
        <span className="section-title">{title}</span>
        <ChevronDown size={18} className="chevron" />
      </button>
      {open && (
        <div className="section-body">
          {formatContent(content)}
        </div>
      )}
    </div>
  )
}
