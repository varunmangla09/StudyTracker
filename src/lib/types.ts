export type TopicType = 'timer' | 'habit'

export interface Topic {
  id: string
  user_id: string
  name: string
  type: TopicType
  color: string
  category: string
  created_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  topic_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  created_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  topic_id: string
  log_date: string
  created_at: string
}

export interface UserSettings {
  user_id: string
  weekday_goal_minutes: number
  weekend_min_goal_minutes: number
  weekend_max_goal_minutes: number
  reminder_enabled: boolean
  reminder_time: string
  goal_alert_enabled: boolean
  updated_at: string
}

export const TOPIC_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
]

export const CATEGORIES = [
  'General', 'DSA', 'System Design', 'Interview', 'Projects', 'Health', 'Other',
]
