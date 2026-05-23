import { useMemo } from 'react'
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
    return [...map.entries()]
      .map(([name, seconds]) => ({ name, minutes: Math.round(seconds / 60) }))
      .sort((a, b) => b.minutes - a.minutes)
  }, [timeEntries, topics])

  const weekTotal = chartData.reduce((s, d) => s + d.seconds, 0)

  if (loading) return <p className="loading">Loading…</p>

  return (
    <div className="page charts-page">
      <header className="page-header">
        <h1>Weekly charts</h1>
        <p className="subtitle">Last 7 days · {formatDurationShort(weekTotal)} total</p>
      </header>

      <section className="chart-section card">
        <h2>Daily study time</h2>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} unit="m" />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                formatter={(value) => [`${value} min`, 'Time']}
              />
              <Bar dataKey="minutes" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {byCategory.length > 0 && (
        <section className="chart-section card">
          <h2>All-time by category</h2>
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
                <Bar dataKey="minutes" fill="var(--accent-light)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}
