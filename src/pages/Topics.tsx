import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { TOPIC_COLORS, CATEGORIES, type TopicType } from '../lib/types'
import { TopicCard } from '../components/TopicCard'
import './Topics.css'

export function Topics() {
  const {
    topics,
    addTopic,
    removeTopic,
    activeEntry,
    startTimer,
    stopTimer,
    toggleHabit,
    isHabitDoneToday,
    getHabitStreak,
    getTopicSeconds,
    loading,
  } = useData()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<TopicType>('timer')
  const [color, setColor] = useState(TOPIC_COLORS[0])
  const [category, setCategory] = useState(CATEGORIES[0])
  const [saving, setSaving] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await addTopic({ name: name.trim(), type, color, category })
      setName('')
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="loading">Loading…</p>

  return (
    <div className="page topics-page">
      <header className="page-header row">
        <div>
          <h1>Topics</h1>
          <p className="subtitle">{topics.length} total</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </header>

      {showForm && (
        <form className="add-form card" onSubmit={handleAdd}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. LeetCode, Morning water" required />
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as TopicType)}>
              <option value="timer">Timer – track time spent</option>
              <option value="habit">Habit – tap daily for streak</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <fieldset className="color-picker">
            <legend>Color</legend>
            <div className="colors">
              {TOPIC_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </fieldset>
          <button type="submit" className="btn btn-primary full" disabled={saving}>
            {saving ? 'Saving…' : 'Create topic'}
          </button>
        </form>
      )}

      <div className="topic-list">
        {topics.map((t) =>
          t.type === 'habit' ? (
            <div key={t.id} className="topic-row-wrap">
              <TopicCard
                topic={t}
                streak={getHabitStreak(t.id)}
                habitDone={isHabitDoneToday(t.id)}
                onHabitTap={() => toggleHabit(t.id)}
              />
              <button type="button" className="btn-icon delete" onClick={() => removeTopic(t.id)} title="Delete">×</button>
            </div>
          ) : (
            <div key={t.id} className="topic-row-wrap">
              <TopicCard
                topic={t}
                seconds={getTopicSeconds(t.id, new Date())}
                isActive={activeEntry?.topic_id === t.id}
                onStart={() => !activeEntry && startTimer(t.id)}
                onStop={() => stopTimer()}
              />
              <div className="topic-actions">
                <Link to={`/topics/${t.id}`} className="btn btn-ghost small">Stats</Link>
                <button type="button" className="btn-icon delete" onClick={() => removeTopic(t.id)} title="Delete">×</button>
              </div>
            </div>
          )
        )}
      </div>

      {topics.length === 0 && !showForm && (
        <p className="empty-hint">Create your first topic – use Timer for study time or Habit for daily check-ins like water.</p>
      )}
    </div>
  )
}
