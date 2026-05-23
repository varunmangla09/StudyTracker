import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { TOPIC_COLORS, CATEGORIES, type Topic, type TopicType } from '../lib/types'
import { TopicCard } from '../components/TopicCard'
import { PageHeader } from '../components/PageHeader'
import { LoadingState } from '../components/LoadingState'
import './Topics.css'

export function Topics() {
  const {
    topics,
    addTopic,
    updateTopic,
    removeTopic,
    activeEntry,
    openStartSession,
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
  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | TopicType>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setName('')
    setType('timer')
    setColor(TOPIC_COLORS[0])
    setCategory(CATEGORIES[0])
    setEditingId(null)
    setFormError(null)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForm()
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (topic: Topic) => {
    setName(topic.name)
    setType(topic.type)
    setColor(topic.color)
    setCategory(topic.category)
    setEditingId(topic.id)
    setFormError(null)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setFormError(null)
    setSaving(true)
    try {
      if (editingId) {
        await updateTopic(editingId, { name: name.trim(), color, category })
      } else {
        await addTopic({ name: name.trim(), type, color, category })
      }
      closeForm()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (topic: Topic) => {
    const confirmed = window.confirm(`Delete "${topic.name}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      await removeTopic(topic.id)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to delete this topic right now.')
    }
  }

  const visibleTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return topics.filter((topic) => {
      const matchesQuery =
        !normalizedQuery ||
        topic.name.toLowerCase().includes(normalizedQuery) ||
        topic.category.toLowerCase().includes(normalizedQuery)
      const matchesType = filterType === 'all' || topic.type === filterType
      const matchesCategory = filterCategory === 'all' || topic.category === filterCategory
      return matchesQuery && matchesType && matchesCategory
    })
  }, [topics, query, filterType, filterCategory])

  if (loading) return <LoadingState />

  return (
    <div className="page topics-page">
      <PageHeader
        title="Topics"
        subtitle={`${visibleTopics.length} of ${topics.length} topics visible`}
        action={
          <button type="button" className="btn btn-primary" onClick={() => (showForm ? closeForm() : openCreateForm())}>
            {showForm ? 'Close editor' : '+ Add topic'}
          </button>
        }
      />

      <section className="card topics-toolbar" aria-label="Filter topics">
        <label>
          Search topics
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by topic or category"
          />
        </label>
        <label>
          Type
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | TopicType)}>
            <option value="all">All types</option>
            <option value="timer">Timer topics</option>
            <option value="habit">Habit topics</option>
          </select>
        </label>
        <label>
          Category
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </section>

      {showForm && (
        <form className="add-form card" onSubmit={handleSave}>
          <div className="panel-heading">
            <div>
              <h2>{editingId ? 'Edit topic' : 'Create a topic'}</h2>
              <p className="hint">
                {editingId
                  ? 'Update the name, category, and color. Type stays locked to preserve existing data.'
                  : 'Use timer topics for focus sessions and habit topics for once-per-day check-ins.'}
              </p>
            </div>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={openCreateForm}>
                New topic instead
              </button>
            )}
          </div>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. LeetCode, Morning water"
              required
            />
          </label>
          <label>
            Type
            <select value={type} onChange={(e) => setType(e.target.value as TopicType)} disabled={Boolean(editingId)}>
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
                  aria-label={`Choose ${c} as the topic color`}
                />
              ))}
            </div>
          </fieldset>
          {formError && (
            <p className="auth-error" aria-live="polite">
              {formError}
            </p>
          )}
          <button type="submit" className="btn btn-primary full" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create topic'}
          </button>
        </form>
      )}

      <div className="topic-list">
        {visibleTopics.map((t) =>
          t.type === 'habit' ? (
            <div key={t.id} className="topic-row-wrap">
              <TopicCard
                topic={t}
                streak={getHabitStreak(t.id)}
                habitDone={isHabitDoneToday(t.id)}
                onHabitTap={() => toggleHabit(t.id)}
              />
              <div className="topic-actions">
                <button type="button" className="btn btn-ghost small" onClick={() => openEditForm(t)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost small danger-text"
                  onClick={() => handleRemove(t)}
                  aria-label={`Delete ${t.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div key={t.id} className="topic-row-wrap">
              <TopicCard
                topic={t}
                seconds={getTopicSeconds(t.id, new Date())}
                isActive={activeEntry?.topic_id === t.id}
                onStart={() => !activeEntry && openStartSession(t.id)}
                onStop={() => stopTimer()}
              />
              <div className="topic-actions">
                <Link to={`/topics/${t.id}`} className="btn btn-ghost small">
                  Stats
                </Link>
                <button type="button" className="btn btn-ghost small" onClick={() => openEditForm(t)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost small danger-text"
                  onClick={() => handleRemove(t)}
                  aria-label={`Delete ${t.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {topics.length === 0 && !showForm && (
        <div className="card empty-state">
          <p className="empty-hint">
            Create your first topic. Use Timer for study time or Habit for daily check-ins like water.
          </p>
          <button type="button" className="btn btn-primary" onClick={openCreateForm}>
            Create your first topic
          </button>
        </div>
      )}

      {topics.length > 0 && visibleTopics.length === 0 && (
        <div className="card empty-state">
          <p className="empty-hint">No topics match the current filters.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setQuery('')
              setFilterType('all')
              setFilterCategory('all')
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
