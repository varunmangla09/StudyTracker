import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns'
import { useData } from '../context/DataContext'
import { formatDurationShort, filterEntriesByDay, sumEntrySeconds } from '../lib/utils'
import './TopicDetail.css'

export function TopicDetail() {
  const { id } = useParams<{ id: string }>()
  const { topics, timeEntries, getTopicSeconds, loading } = useData()

  const topic = topics.find((t) => t.id === id)
  const month = useMemo(() => startOfMonth(new Date()), [])

  const topicEntries = useMemo(
    () => timeEntries.filter((e) => e.topic_id === id),
    [timeEntries, id]
  )

  const dailyBreakdown = useMemo(() => {
    const days = eachDayOfInterval({ start: month, end: endOfMonth(month) })
    return days
      .map((day) => {
        const entries = filterEntriesByDay(topicEntries, day)
        const seconds = sumEntrySeconds(entries)
        return { day, seconds }
      })
      .filter((d) => d.seconds > 0)
      .reverse()
  }, [topicEntries, month])

  const todaySec = getTopicSeconds(id!, new Date())
  const monthSec = getTopicSeconds(id!, undefined, month)

  if (loading) return <p className="loading">Loading…</p>
  if (!topic) {
    return (
      <div className="page">
        <p>Topic not found.</p>
        <Link to="/topics">← Back</Link>
      </div>
    )
  }

  return (
    <div className="page topic-detail-page">
      <Link to="/topics" className="back-link">← Topics</Link>
      <header className="topic-detail-header">
        <div className="topic-dot" style={{ background: topic.color }} />
        <div>
          <span className="topic-category">{topic.category}</span>
          <h1>{topic.name}</h1>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card card">
          <span className="stat-label">Today</span>
          <strong>{formatDurationShort(todaySec)}</strong>
        </div>
        <div className="stat-card card">
          <span className="stat-label">{format(month, 'MMMM')}</span>
          <strong>{formatDurationShort(monthSec)}</strong>
        </div>
      </div>

      <section>
        <h2 className="section-title">This month by day</h2>
        {dailyBreakdown.length === 0 ? (
          <p className="empty-hint">No time logged this month yet.</p>
        ) : (
          <ul className="day-list">
            {dailyBreakdown.map(({ day, seconds }) => (
              <li key={day.toISOString()} className="day-row card">
                <span>{format(day, 'EEE, MMM d')}</span>
                <strong>{formatDurationShort(seconds)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
