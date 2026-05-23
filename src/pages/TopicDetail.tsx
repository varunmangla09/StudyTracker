import { useMemo, type CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format, startOfMonth, eachDayOfInterval, endOfMonth } from 'date-fns'
import { useData } from '../context/DataContext'
import { formatDurationShort, filterEntriesByDay, sumEntrySeconds } from '../lib/utils'
import { LoadingState } from '../components/LoadingState'
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

  const recentSessions = useMemo(
    () =>
      topicEntries
        .filter((entry) => (entry.duration_seconds ?? 0) > 0)
        .slice(0, 5),
    [topicEntries]
  )

  const activeDaysThisMonth = dailyBreakdown.length

  const todaySec = getTopicSeconds(id!, new Date())
  const monthSec = getTopicSeconds(id!, undefined, month)

  if (loading) return <LoadingState />
  if (!topic) {
    return (
      <div className="page">
        <div className="card empty-state">
          <h2>Topic not found</h2>
          <p className="empty-hint">It may have been deleted or the link is invalid.</p>
          <Link to="/topics" className="btn btn-primary">
            Back to topics
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page topic-detail-page">
      <Link to="/topics" className="back-link">
        ← Topics
      </Link>
      <header
        className="topic-detail-hero card"
        style={{ '--topic-color': topic.color } as CSSProperties}
      >
        <span className="topic-hero-avatar" style={{ background: topic.color }}>
          {topic.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <span className="topic-category">{topic.category}</span>
          <h1>{topic.name}</h1>
        </div>
      </header>

      <div className="stats-grid">
        <article className="stat-surface">
          <span className="label">Today</span>
          <strong className="mono">{formatDurationShort(todaySec)}</strong>
        </article>
        <article className="stat-surface">
          <span className="label">{format(month, 'MMMM')}</span>
          <strong className="mono">{formatDurationShort(monthSec)}</strong>
        </article>
        <article className="stat-surface">
          <span className="label">Active days</span>
          <strong className="mono">{activeDaysThisMonth}</strong>
        </article>
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

      <section>
        <h2 className="section-title">Recent sessions</h2>
        {recentSessions.length === 0 ? (
          <p className="empty-hint">No completed sessions yet for this topic.</p>
        ) : (
          <ul className="session-list">
            {recentSessions.map((entry) => (
              <li key={entry.id} className="session-row card">
                <div>
                  <strong>{format(new Date(entry.started_at), 'EEE, MMM d')}</strong>
                  <p className="hint">{format(new Date(entry.started_at), 'p')}</p>
                  {entry.note && <p className="session-note">{entry.note}</p>}
                </div>
                <strong className="mono">{formatDurationShort(entry.duration_seconds ?? 0)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
