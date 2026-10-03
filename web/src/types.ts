export type ImageQuality = 'good' | 'fair' | 'poor'

export interface ImageCheck {
  right_is_palm: boolean
  left_is_palm: boolean
  right_quality: ImageQuality
  left_quality: ImageQuality
  issues: string
}

export interface LineReading {
  present: boolean
  depth: string
  length: string
  curvature_or_direction: string
  markings: string[]
  notes: string
}

export interface HandFeatures {
  palm_shape: string
  finger_length_and_spacing: string
  thumb: string
  mounts: Record<string, string>
  life_line: LineReading
  head_line: LineReading
  heart_line: LineReading
  fate_line: LineReading
  sun_line: LineReading
  mercury_line: LineReading
  marriage_lines: LineReading
  minor_markings: string[]
  skin_texture_and_color: string
  visibility_caveats: string
}

export interface PalmReadingResult {
  comparison: string
  sections: {
    personality?: string
    structure?: string
    lines?: string
    career?: string
    finance?: string
    love?: string
    timeline?: string
  }
  report?: string
  error?: string
}

export type ReadingStatus = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export interface UploadedImage {
  file: File
  preview: string
}
