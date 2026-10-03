import './LoadingState.css'

const STEPS = [
  'Validating palm images…',
  'Extracting right hand features…',
  'Extracting left hand features…',
  'Comparing both hands…',
  'Analyzing personality…',
  'Reading major lines…',
  'Building career & finance insights…',
  'Mapping love & life timeline…',
  'Assembling full report…',
]

interface Props {
  progress: number // 0–1
}

export function LoadingState({ progress }: Props) {
  const stepIdx = Math.min(
    Math.floor(progress * STEPS.length),
    STEPS.length - 1
  )

  return (
    <div className="loading-state">
      <div className="palm-spinner">
        <div className="ring" />
        <div className="ring ring-2" />
        <span className="palm-icon">✋</span>
      </div>
      <p className="loading-step">{STEPS[stepIdx]}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="loading-hint">This may take a minute — deep analysis in progress</p>
    </div>
  )
}
