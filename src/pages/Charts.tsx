import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { useData } from '../context/DataContext'
import { last7Days, filterEntriesByDay, sumEntrySeconds, formatDurationShort } from '../lib/utils'
import { PageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/LoadingState'
import './Charts.css'

export function Charts() {
  const { timeEntries, topics, loading } = useData()

  const chartData = useMemo(() => {
    return last7Days().map((day) => {
      const entries = filterEntriesByDay(timeEntries, day)
      const total = sumEntrySeconds(entries)
      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        minutes: Math.round(total / 60),
        seconds: total,
      }
    })
  }, [timeEntries])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of timeEntries) {
      if (!entry.ended_at && entry.duration_seconds == null) continue
      const topic = topics.find((t) => t.id === entry.topic_id)
      const cat = topic?.category ?? 'Other'
      const sec = entry.duration_seconds ?? 0
      map.set(cat, (map.get(cat) ?? 0) + sec)
    }
    const allTimeTotal = [...map.values()].reduce((sum, value) => sum + value, 0)

    return [...map.entries()]
      .map(([name, seconds]) => ({
        name,
        minutes: Math.round(seconds / 60),
        percentage: allTimeTotal > 0 ? Math.round((seconds / allTimeTotal) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [timeEntries, topics])

  const weekTotal = chartData.reduce((s, d) => s + d.seconds, 0)
  const activeDays = chartData.filter((day) => day.seconds > 0).length
  const topDay = [...chartData].sort((a, b) => b.seconds - a.seconds)[0]
  const averageMinutes = chartData.length > 0 ? Math.round(chartData.reduce((sum, day) => sum + day.minutes, 0) / chartData.length) : 0

  if (loading) return <LoadingState />

  return (
    <div className="page charts-page">
      <PageHeader
        title="Weekly charts"
        subtitle={`Last 7 days · ${formatDurationShort(weekTotal)} total`}
      />

      {weekTotal === 0 ? (
        <section className="card empty-state">
          <h2>No study data yet</h2>
          <p className="hint">Start a timer topic and log your first session to unlock charts and category insights.</p>
          <Link to="/topics" className="btn btn-primary">
            Set up topics
          </Link>
        </section>
      ) : (
        <>
          <section className="card summary-card" aria-labelledby="week-summary-heading">
            <div className="panel-heading">
              <div>
                <h2 id="week-summary-heading">Week summary</h2>
                <p className="hint">Clear KPIs first, then detailed charts and category breakdown.</p>
              </div>
            </div>
            <div className="stats-grid">
              <article className="stat-surface">
                <span className="label">Total time</span>
                <strong>{formatDurationShort(weekTotal)}</strong>
                <span className="hint">Across the last 7 days</span>
              </article>
              <article className="stat-surface">
                <span className="label">Active days</span>
                <strong>{activeDays}/7</strong>
                <span className="hint">Consistency beats intensity</span>
              </article>
              <article className="stat-surface">
                <span className="label">Average day</span>
                <strong>{averageMinutes}m</strong>
                <span className="hint">
                  {topDay?.seconds ? `${topDay.fullDate} was your strongest day.` : 'Log more sessions for stronger trends.'}
                </span>
              </article>
            </div>
          </section>

          <section className="chart-section card" aria-labelledby="daily-chart-heading">
            <div className="panel-heading">
              <div>
                <h2 id="daily-chart-heading">Daily study time</h2>
                <p className="hint">Quick scan for cadence, spikes, and recovery days.</p>
              </div>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a8b0ff" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(43, 61, 90, 0.8)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#9cafc8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9cafc8', fontSize: 12 }} unit="m" axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(124, 131, 255, 0.08)' }}
                    contentStyle={{
                      background: '#182942',
                      border: '1px solid #415776',
                      borderRadius: 12,
                      boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                    }}
                    labelStyle={{ color: '#edf3fb', fontWeight: 600 }}
                    itemStyle={{ color: '#a8b0ff' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                    formatter={(value) => [`${value} min`, 'Study time']}
                  />
                  <Bar dataKey="minutes" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {byCategory.length > 0 && (
            <section className="chart-section card" aria-labelledby="category-chart-heading">
              <div className="panel-heading">
                <div>
                  <h2 id="category-chart-heading">All-time by category</h2>
                  <p className="hint">Highlights where your attention is actually going.</p>
                </div>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height={Math.max(160, byCategory.length * 36)}>
                  <BarChart data={byCategory} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} unit="m" />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                      formatter={(value) => [`${value} min`, 'Time']}
                    />
                    <Bar dataKey="minutes" fill="#9ca8ff" radius={[0, 8, 8, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ol className="category-list" aria-label="Category breakdown summary">
                {byCategory.map((item) => (
                  <li key={item.name} className="category-row">
                    <span>{item.name}</span>
                    <strong>{item.minutes}m</strong>
                    <span className="hint">{item.percentage}% of tracked time</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  )
}
