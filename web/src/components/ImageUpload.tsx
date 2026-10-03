import { useCallback, useRef } from 'react'
import { Upload, X, Hand } from 'lucide-react'
import type { UploadedImage } from '../types'
import './ImageUpload.css'

interface Props {
  label: string
  side: 'right' | 'left'
  image: UploadedImage | null
  onChange: (img: UploadedImage | null) => void
  disabled?: boolean
}

export function ImageUpload({ label, side, image, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null)
        return
      }
      if (!file.type.startsWith('image/')) return
      const preview = URL.createObjectURL(file)
      onChange({ file, preview })
    },
    [onChange]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="upload-card">
      <div className="upload-label">
        <Hand size={16} />
        <span>{label}</span>
        <span className="side-badge">{side === 'right' ? 'Active path' : 'Inner self'}</span>
      </div>

      {image ? (
        <div className="preview-wrap">
          <img src={image.preview} alt={`${side} palm`} />
          <button
            type="button"
            className="remove-btn"
            onClick={() => {
              URL.revokeObjectURL(image.preview)
              handleFile(null)
            }}
            disabled={disabled}
            aria-label="Remove image"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          className={`dropzone ${disabled ? 'disabled' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <Upload size={28} strokeWidth={1.5} />
          <p>Drop palm photo or click to upload</p>
          <span className="hint">Open palm, good lighting, full hand in frame</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  )
}
