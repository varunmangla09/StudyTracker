import { formatDurationShort } from '../lib/utils'
import { isWeekend } from 'date-fns'
import './GoalProgress.css'

interface Props {
  current: number
  min: number
  max: number
  percent: number
}

export function GoalProgress({ current, min, max, percent }: Props) {
  const weekend = isWeekend(new Date())
  const label = weekend
    ? `${formatDurationShort(min)} – ${formatDurationShort(max)}`
    : `${formatDurationShort(min)} goal`
  const ringPercent = Math.min(100, percent)
  const complete = percent >= 100
  const circumference = 2 * Math.PI * 52
  const strokeOffset = circumference - (ringPercent / 100) * circumference

  return (
    <section className={`goal-hero card card-glow${complete ? ' complete' : ''}`} aria-labelledby="goal-heading">
      <div className="goal-hero-grid">
        <div className="goal-ring-wrap" aria-hidden>
          <svg className="goal-ring" viewBox="0 0 120 120">
            <circle className="goal-ring-track" cx="60" cy="60" r="52" />
            <circle
              className="goal-ring-progress"
              cx="60"
              cy="60"
              r="52"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeOffset,
              }}
            />
          </svg>
          <div className="goal-ring-center">
            <span className="goal-ring-pct mono">{ringPercent}%</span>
            <span className="goal-ring-label">of min</span>
          </div>
        </div>

        <div className="goal-hero-copy">
          <div className="goal-hero-top">
            <div>
              <span className={`badge${complete ? ' badge-success' : ' badge-accent'}`}>
                {complete ? 'Goal reached' : weekend ? 'Weekend target' : 'Weekday target'}
              </span>
              <h2 id="goal-heading">Today&apos;s progress</h2>
            </div>
          </div>
          <p className="goal-time mono">
            <strong>{formatDurationShort(current)}</strong>
            <span className="goal-time-sep">/</span>
            <span>{label}</span>
          </p>
          <div className="goal-bar-track" role="progressbar" aria-valuenow={ringPercent} aria-valuemin={0} aria-valuemax={100}>
            <div className="goal-bar-fill" style={{ width: `${ringPercent}%` }} />
            {weekend && max > min && (
              <div
                className="goal-bar-min-marker"
                style={{ left: `${Math.min(100, (min / max) * 100)}%` }}
                title="Minimum weekend goal"
              />
            )}
          </div>
          {!complete && (
            <p className="hint goal-remaining">
              {formatDurationShort(Math.max(0, min - current))} left to hit your minimum today
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
