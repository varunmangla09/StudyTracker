import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { dateStr, todayStr } from '../lib/utils'
import { subDays, startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns'
import './MarkHabitModal.css'

export function MarkHabitModal() {
  const { 
    topics, 
    habitLogs, 
    pendingMarkHabitTopicId, 
    cancelMarkHabit, 
    confirmMarkHabit 
  } = useData()
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [saving, setSaving] = useState(false)

  const topic = topics.find((t) => t.id === pendingMarkHabitTopicId)
  const open = Boolean(pendingMarkHabitTopicId && topic)

  useEffect(() => {
    if (open) {
      setSelectedDate(new Date())
      setCurrentMonth(new Date())
      setSaving(false)
    }
  }, [open])

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date)
  }

  const handleConfirm = async () => {
    if (!selectedDate || !pendingMarkHabitTopicId) return
    setSaving(true)
    try {
      await confirmMarkHabit(pendingMarkHabitTopicId, dateStr(selectedDate))
    } finally {
      setSaving(false)
    }
  }

  const isDateMarked = (date: Date) => {
    const dateString = dateStr(date)
    return habitLogs.some((l) => l.topic_id === pendingMarkHabitTopicId && l.log_date === dateString)
  }

  const isDateSelected = selectedDate && dateStr(selectedDate) === dateStr(new Date(selectedDate))

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const firstDayOfMonth = daysInMonth[0].getDay()
  const emptyDays = Array(firstDayOfMonth).fill(null)

  if (!open || !topic) return null

  return (
    <div className="modal-overlay" onClick={() => !saving && cancelMarkHabit()}>
      <dialog className="modal mark-habit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Mark {topic.name}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={() => !saving && cancelMarkHabit()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="calendar-header">
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              disabled={saving}
            >
              ←
            </button>
            <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              disabled={saving}
            >
              →
            </button>
          </div>

          <div className="calendar">
            <div className="weekdays">
              {weekDays.map((day) => (
                <div key={day} className="weekday">
                  {day}
                </div>
              ))}
            </div>

            <div className="days-grid">
              {emptyDays.map((_, idx) => (
                <div key={`empty-${idx}`} className="day empty"></div>
              ))}
              {daysInMonth.map((date) => {
                const marked = isDateMarked(date)
                const isSelected = selectedDate && dateStr(selectedDate) === dateStr(date)
                const isCurrentDate = dateStr(date) === todayStr()
                
                return (
                  <button
                    key={dateStr(date)}
                    type="button"
                    className={`day${marked ? ' marked' : ''}${isSelected ? ' selected' : ''}${isCurrentDate ? ' today' : ''}`}
                    onClick={() => handleSelectDate(date)}
                    disabled={saving}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="selected-info">
              <p>
                Selected: <strong>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</strong>
              </p>
              {isDateMarked(selectedDate) && (
                <p className="already-marked">✓ Already marked for this date</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => !saving && cancelMarkHabit()}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={saving || !selectedDate}
          >
            {saving ? 'Saving...' : isDateMarked(selectedDate) ? 'Unmark' : 'Mark Done'}
          </button>
        </div>
      </dialog>
    </div>
  )
}
