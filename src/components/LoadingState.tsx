import './LoadingState.css'

interface LoadingStateProps {
  label?: string
}

export function LoadingState({ label = 'Loading your workspace…' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden />
      <p>{label}</p>
    </div>
  )
}
