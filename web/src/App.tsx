import { useState, useCallback } from 'react'
import { Sparkles, RotateCcw, AlertCircle } from 'lucide-react'
import { ImageUpload } from './components/ImageUpload'
import { ReportSection } from './components/ReportSection'
import { LoadingState } from './components/LoadingState'
import { requestPalmReading } from './api'
import type { UploadedImage, PalmReadingResult, ReadingStatus } from './types'
import './App.css'

const SECTION_META: { key: keyof NonNullable<PalmReadingResult['sections']>; num: number; title: string }[] = [
  { key: 'personality', num: 1, title: 'Core Personality' },
  { key: 'structure', num: 2, title: 'Hand Structure Analysis' },
  { key: 'lines', num: 3, title: 'Major Lines Analysis' },
  { key: 'career', num: 5, title: 'Career & Success' },
  { key: 'finance', num: 6, title: 'Financial Analysis' },
  { key: 'love', num: 7, title: 'Love & Relationships' },
  { key: 'timeline', num: 8, title: 'Life Timeline' },
]

export default function App() {
  const [right, setRight] = useState<UploadedImage | null>(null)
  const [left, setLeft] = useState<UploadedImage | null>(null)
  const [context, setContext] = useState('')
  const [status, setStatus] = useState<ReadingStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<PalmReadingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = right && left && status !== 'analyzing'

  const reset = useCallback(() => {
    if (right) URL.revokeObjectURL(right.preview)
    if (left) URL.revokeObjectURL(left.preview)
    setRight(null)
    setLeft(null)
    setContext('')
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError(null)
  }, [right, left])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!right || !left) return

    setStatus('analyzing')
    setProgress(0)
    setError(null)
    setResult(null)

    try {
      const data = await requestPalmReading(right, left, context, setProgress)
      if (data.error) {
        setError(data.error)
        setStatus('error')
      } else {
        setResult(data)
        setStatus('done')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          AI Palmistry
        </div>
        <h1>Palm Reading</h1>
        <p className="hero-sub">
          Upload clear photos of both palms. The system extracts features first,
          then interprets personality, lines, career, love, and your life timeline.
        </p>
      </header>

      {status === 'analyzing' && (
        <LoadingState progress={progress} />
      )}

      {(status === 'idle' || status === 'error') && (
        <form className="reading-form" onSubmit={handleSubmit}>
          <div className="uploads">
            <ImageUpload
              label="Right Hand"
              side="right"
              image={right}
              onChange={setRight}
              disabled={status === 'analyzing'}
            />
            <ImageUpload
              label="Left Hand"
              side="left"
              image={left}
              onChange={setLeft}
              disabled={status === 'analyzing'}
            />
          </div>

          <div className="context-field">
            <label htmlFor="context">Optional context</label>
            <textarea
              id="context"
              rows={2}
              placeholder="Age, dominant hand, specific questions…"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={status === 'analyzing'}
            />
          </div>

          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={!canSubmit}>
            <Sparkles size={18} />
            Read My Palms
          </button>

          <p className="disclaimer">
            For insight and reflection. Photos stay on the server only for the duration of the analysis.
          </p>
        </form>
      )}

      {status === 'done' && result && (
        <div className="results">
          <div className="results-toolbar">
            <h2>Your Reading</h2>
            <button type="button" className="reset-btn" onClick={reset}>
              <RotateCcw size={16} />
              New reading
            </button>
          </div>

          <div className="sections">
            {SECTION_META.map(({ key, num, title }) => {
              const content = result.sections?.[key]
              if (!content) return null
              return (
                <ReportSection
                  key={key}
                  number={num}
                  title={title}
                  content={content}
                  defaultOpen={key === 'personality'}
                />
              )
            })}

            {result.comparison && (
              <ReportSection
                number={4}
                title="Right Hand vs Left Hand Comparison"
                content={result.comparison}
              />
            )}
          </div>
        </div>
      )}

      <footer className="footer">
        Powered by LangGraph palmistry pipeline · Right = active path · Left = inner self
      </footer>
    </div>
  )
}
