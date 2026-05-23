import { useMemo, type CSSProperties } from 'react'
import { useData } from '../context/DataContext'
import { entrySeconds, formatDuration } from '../lib/utils'
import './ActiveTimer.css'

export function ActiveTimer() {
  const { activeEntry, topics, stopTimer } = useData()

  const topic = useMemo(
    () => topics.find((t) => t.id === activeEntry?.topic_id),
    [topics, activeEntry]
  )

  const seconds = activeEntry ? entrySeconds(activeEntry) : 0

  if (!activeEntry || !topic) return null

  return (
    <section
      className="active-timer card card-glow"
      style={{ '--topic-color': topic.color } as CSSProperties}
      aria-live="polite"
    >
      <div className="active-timer-pulse" aria-hidden />
      <div className="active-timer-main">
        <div className="active-timer-badge">
          <span className="active-dot" />
          Recording
        </div>
        <div className="active-timer-topic">
          <span className="topic-swatch" style={{ background: topic.color }} />
          <div>
            <span className="active-category">{topic.category}</span>
            <strong>{topic.name}</strong>
            {activeEntry.note && (
              <span className="active-session-note">Working on: {activeEntry.note}</span>
            )}
          </div>
        </div>
        <p className="active-time mono">{formatDuration(seconds)}</p>
      </div>
      <button type="button" className="btn btn-danger active-stop" onClick={() => stopTimer()}>
        Stop session
      </button>
    </section>
  )
}
