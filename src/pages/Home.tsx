import { useData } from '../context/DataContext'
import { GoalProgress } from '../components/GoalProgress'
import { ActiveTimer } from '../components/ActiveTimer'
import { TopicCard } from '../components/TopicCard'
import './Home.css'

export function Home() {
  const {
    topics,
    activeEntry,
    goalProgress,
    startTimer,
    stopTimer,
    toggleHabit,
    isHabitDoneToday,
    getHabitStreak,
    getTopicSeconds,
    loading,
  } = useData()

  const timerTopics = topics.filter((t) => t.type === 'timer')
  const habitTopics = topics.filter((t) => t.type === 'habit')

  if (loading) return <p className="loading">Loading…</p>

  return (
    <div className="page home-page">
      <header className="page-header">
        <h1>SwitchTrack</h1>
        <p className="subtitle">Job switch focus time</p>
      </header>

      <GoalProgress {...goalProgress} />
      <ActiveTimer />

      {habitTopics.length > 0 && (
        <section>
          <h2 className="section-title">Daily habits</h2>
          <div className="topic-list">
            {habitTopics.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                streak={getHabitStreak(t.id)}
                habitDone={isHabitDoneToday(t.id)}
                onHabitTap={() => toggleHabit(t.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title">Timer topics</h2>
        {timerTopics.length === 0 ? (
          <p className="empty-hint">Add timer topics to start tracking study time.</p>
        ) : (
          <div className="topic-list">
            {timerTopics.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                seconds={getTopicSeconds(t.id, new Date())}
                isActive={activeEntry?.topic_id === t.id}
                onStart={() => !activeEntry && startTimer(t.id)}
                onStop={() => stopTimer()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
