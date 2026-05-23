import { useMemo } from 'react'
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
    <section className="active-timer card" style={{ borderColor: topic.color }}>
      <div className="active-timer-dot" style={{ background: topic.color }} />
      <div className="active-timer-info">
        <span className="active-label">Recording</span>
        <strong>{topic.name}</strong>
        <span className="active-time">{formatDuration(seconds)}</span>
      </div>
      <button type="button" className="btn btn-danger" onClick={() => stopTimer()}>
        Stop
      </button>
    </section>
  )
}
