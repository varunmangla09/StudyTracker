import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { GoalProgress } from '../components/GoalProgress'
import { ActiveTimer } from '../components/ActiveTimer'
import { TopicCard } from '../components/TopicCard'
import { PageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/LoadingState'
import { MarkHabitModal } from '../components/MarkHabitModal'
import { filterEntriesByDay, formatDurationShort, last7Days, sumEntrySeconds } from '../lib/utils'
import './Home.css'

export function Home() {
  const {
    topics,
    timeEntries,
    activeEntry,
    goalProgress,
    openStartSession,
    stopTimer,
    openMarkHabit,
    isHabitDoneToday,
    getHabitStreak,
    getTopicSeconds,
    loading,
  } = useData()

  const timerTopics = topics.filter((t) => t.type === 'timer')
  const habitTopics = topics.filter((t) => t.type === 'habit')
  const weeklyDays = useMemo(() => last7Days(), [])
  const weeklySeconds = useMemo(
    () => weeklyDays.reduce((sum, day) => sum + sumEntrySeconds(filterEntriesByDay(timeEntries, day)), 0),
    [timeEntries, weeklyDays]
  )
  const activeDays = useMemo(
    () => weeklyDays.filter((day) => sumEntrySeconds(filterEntriesByDay(timeEntries, day)) > 0).length,
    [timeEntries, weeklyDays]
  )
  const habitsDoneToday = habitTopics.filter((topic) => isHabitDoneToday(topic.id)).length
  const weeklyCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const entry of timeEntries) {
      const topic = topics.find((item) => item.id === entry.topic_id)
      if (!topic || topic.type !== 'timer') continue
      totals.set(topic.category, (totals.get(topic.category) ?? 0) + (entry.duration_seconds ?? 0))
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  }, [timeEntries, topics])

  const insight = useMemo(() => {
    if (topics.length === 0) {
      return {
        title: 'Start with one timer and one habit',
        body: 'Create a timer topic for focused study and a habit topic for the daily routine you want to keep consistent.',
        cta: { label: 'Create topics', to: '/topics' },
      }
    }

    if (goalProgress.current < goalProgress.min) {
      const remaining = formatDurationShort(goalProgress.min - goalProgress.current)
      return {
        title: 'You are still within reach of today’s goal',
        body: `${remaining} left to hit your minimum target. Start a short focus block now to keep momentum up.`,
        cta: { label: activeEntry ? 'Review topics' : 'Start a timer', to: activeEntry ? '/topics' : '/' },
      }
    }

    if (habitTopics.length > 0 && habitsDoneToday < habitTopics.length) {
      return {
        title: 'Close the loop on daily habits',
        body: `${habitTopics.length - habitsDoneToday} habit ${habitTopics.length - habitsDoneToday === 1 ? 'check-in is' : 'check-ins are'} still open for today.`,
        cta: { label: 'Finish habits', to: '/topics' },
      }
    }

    return {
      title: 'Your routine looks healthy',
      body: `You have logged time on ${activeDays} of the last 7 days${weeklyCategory ? `, with ${weeklyCategory[0]} leading your study mix.` : '.'}`,
      cta: { label: 'See trends', to: '/charts' },
    }
  }, [topics.length, goalProgress, activeEntry, habitTopics.length, habitsDoneToday, activeDays, weeklyCategory])

  if (loading) return <LoadingState />

  return (
    <div className="page home-page">
      <PageHeader
        title="Dashboard"
        subtitle="Study time, daily habits, and momentum for your job switch — all in one place."
      />

      <GoalProgress {...goalProgress} />
      <ActiveTimer />

      <section className="card highlight-card" aria-labelledby="overview-heading">
        <div className="panel-heading">
          <div>
            <h2 id="overview-heading">At a glance</h2>
            <p className="hint">Actionable summaries first, deeper detail when you need it.</p>
          </div>
          <Link to="/charts" className="btn btn-ghost">
            Review trends
          </Link>
        </div>
        <div className="stats-grid">
          <article className="stat-surface">
            <span className="label">Today</span>
            <strong>{formatDurationShort(goalProgress.current)}</strong>
            <span className="hint">{goalProgress.percent}% of your minimum goal</span>
          </article>
          <article className="stat-surface">
            <span className="label">Last 7 days</span>
            <strong>{formatDurationShort(weeklySeconds)}</strong>
            <span className="hint">{activeDays} active days this week</span>
          </article>
          <article className="stat-surface">
            <span className="label">Habits today</span>
            <strong>{habitTopics.length === 0 ? '0' : `${habitsDoneToday}/${habitTopics.length}`}</strong>
            <span className="hint">
              {habitTopics.length === 0 ? 'Add a habit topic to build a streak.' : 'Keep small wins visible.'}
            </span>
          </article>
        </div>
      </section>

      <section className="card insight-card" aria-labelledby="focus-insight-heading">
        <span className="badge badge-accent">Focus insight</span>
        <h2 id="focus-insight-heading" className="insight-title">
          {insight.title}
        </h2>
        <p className="hint insight-body">{insight.body}</p>
        <Link to={insight.cta.to} className="btn btn-primary">
          {insight.cta.label}
        </Link>
      </section>

      {habitTopics.length > 0 && (
        <section className="stack-section">
          <h2 className="section-title">Daily habits</h2>
          <div className="topic-list">
            {habitTopics.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                streak={getHabitStreak(t.id)}
                habitDone={isHabitDoneToday(t.id)}
                onHabitTap={() => openMarkHabit(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="stack-section">
        <h2 className="section-title">Timer topics</h2>
        {timerTopics.length === 0 ? (
          <div className="card empty-state">
            <p className="empty-hint">Add timer topics to start tracking focused study sessions.</p>
            <Link to="/topics" className="btn btn-primary">
              Create a timer topic
            </Link>
          </div>
        ) : (
          <div className="topic-list">
            {timerTopics.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                seconds={getTopicSeconds(t.id, new Date())}
                isActive={activeEntry?.topic_id === t.id}
                onStart={() => !activeEntry && openStartSession(t.id)}
                onStop={() => stopTimer()}
              />
            ))}
          </div>
        )}
      </section>
      <MarkHabitModal />
    </div>
  )
}
