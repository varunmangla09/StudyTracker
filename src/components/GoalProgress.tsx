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
    ? `${formatDurationShort(min)} – ${formatDurationShort(max)} goal`
    : `${formatDurationShort(min)} weekday goal`

  return (
    <section className="goal-card card">
      <div className="goal-header">
        <h2>Today&apos;s progress</h2>
        <span className="goal-pct">{percent}%</span>
      </div>
      <div className="goal-bar-track">
        <div className="goal-bar-fill" style={{ width: `${percent}%` }} />
        {weekend && max > min && (
          <div
            className="goal-bar-min-marker"
            style={{ left: `${Math.min(100, (min / max) * 100)}%` }}
            title="Minimum weekend goal"
          />
        )}
      </div>
      <p className="goal-stats">
        <strong>{formatDurationShort(current)}</strong> / {label}
      </p>
    </section>
  )
}
