import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import * as api from '../lib/api'
import type { Topic, TimeEntry, HabitLog, UserSettings, TopicType } from '../lib/types'
import {
  todayStr,
  sumEntrySeconds,
  filterEntriesByDay,
  filterEntriesByMonth,
  calcStreak,
  getDayGoal,
  entrySeconds,
} from '../lib/utils'
import { scheduleDailyReminder, notifyGoalReached } from '../lib/notifications'

interface DataContextValue {
  loading: boolean
  topics: Topic[]
  timeEntries: TimeEntry[]
  habitLogs: HabitLog[]
  settings: UserSettings | null
  activeEntry: TimeEntry | null
  todaySeconds: number
  goalProgress: { current: number; min: number; max: number; percent: number }
  refresh: () => Promise<void>
  addTopic: (p: { name: string; type: TopicType; color: string; category: string }) => Promise<void>
  updateTopic: (id: string, p: Partial<Pick<Topic, 'name' | 'color' | 'category'>>) => Promise<void>
  removeTopic: (id: string) => Promise<void>
  startTimer: (topicId: string) => Promise<void>
  stopTimer: () => Promise<void>
  toggleHabit: (topicId: string) => Promise<void>
  isHabitDoneToday: (topicId: string) => boolean
  getHabitStreak: (topicId: string) => number
  getTopicSeconds: (topicId: string, day?: Date, month?: Date) => number
  saveSettings: (s: Partial<UserSettings>) => Promise<void>
  exportData: () => Promise<object>
}

const DataContext = createContext<DataContextValue | null>(null)

const defaultSettings: Omit<UserSettings, 'user_id' | 'updated_at'> = {
  weekday_goal_minutes: 120,
  weekend_min_goal_minutes: 240,
  weekend_max_goal_minutes: 360,
  reminder_enabled: false,
  reminder_time: '09:00',
  goal_alert_enabled: true,
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<Topic[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [tick, setTick] = useState(0)

  const activeEntry = useMemo(
    () => timeEntries.find((e) => !e.ended_at) ?? null,
    [timeEntries]
  )

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [t, te, hl, s] = await Promise.all([
        api.fetchTopics(user.id),
        api.fetchTimeEntries(user.id),
        api.fetchHabitLogs(user.id),
        api.fetchSettings(user.id),
      ])
      setTopics(t)
      setTimeEntries(te)
      setHabitLogs(hl)
      setSettings(s ?? ({ user_id: user.id, ...defaultSettings, updated_at: new Date().toISOString() } as UserSettings))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) refresh()
    else {
      setTopics([])
      setTimeEntries([])
      setHabitLogs([])
      setSettings(null)
      setLoading(false)
    }
  }, [user, refresh])

  useEffect(() => {
    if (!activeEntry) return
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [activeEntry])

  useEffect(() => {
    if (!settings) return
    scheduleDailyReminder(settings.reminder_time, settings.reminder_enabled)
  }, [settings])

  const todaySeconds = useMemo(() => {
    void tick
    const today = filterEntriesByDay(timeEntries, new Date())
    return sumEntrySeconds(today)
  }, [timeEntries, tick])

  const goalProgress = useMemo(() => {
    const s = settings ?? ({ ...defaultSettings } as UserSettings)
    const { min, max } = getDayGoal(new Date(), s)
    const current = todaySeconds
    const target = min
    const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
    return { current, min, max, percent }
  }, [todaySeconds, settings])

  useEffect(() => {
    if (!settings?.goal_alert_enabled) return
    const { min, max } = getDayGoal(new Date(), settings)
    if (todaySeconds >= min && todaySeconds < min + 60) {
      notifyGoalReached(`You've hit your ${Math.round(min / 60)} min daily goal!`)
    }
    if (todaySeconds >= max && max > min) {
      notifyGoalReached(`Amazing! You've reached ${Math.round(max / 60)} min today!`)
    }
  }, [todaySeconds, settings])

  const addTopic = async (p: { name: string; type: TopicType; color: string; category: string }) => {
    if (!user) return
    await api.createTopic(user.id, p)
    await refresh()
  }

  const updateTopicFn = async (id: string, p: Partial<Pick<Topic, 'name' | 'color' | 'category'>>) => {
    await api.updateTopic(id, p)
    await refresh()
  }

  const removeTopic = async (id: string) => {
    await api.deleteTopic(id)
    await refresh()
  }

  const startTimer = async (topicId: string) => {
    if (!user || activeEntry) return
    await api.startTimer(user.id, topicId)
    await refresh()
  }

  const stopTimer = async () => {
    if (!activeEntry) return
    await api.stopTimer(activeEntry.id, activeEntry.started_at)
    await refresh()
  }

  const toggleHabit = async (topicId: string) => {
    if (!user) return
    const today = todayStr()
    const exists = habitLogs.some((l) => l.topic_id === topicId && l.log_date === today)
    await api.toggleHabitLog(user.id, topicId, today, exists)
    await refresh()
  }

  const isHabitDoneToday = (topicId: string) =>
    habitLogs.some((l) => l.topic_id === topicId && l.log_date === todayStr())

  const getHabitStreak = (topicId: string) => {
    const dates = habitLogs.filter((l) => l.topic_id === topicId).map((l) => l.log_date)
    return calcStreak(dates)
  }

  const getTopicSeconds = (topicId: string, day?: Date, month?: Date) => {
    let entries = timeEntries.filter((e) => e.topic_id === topicId)
    if (day) entries = filterEntriesByDay(entries, day)
    if (month) entries = filterEntriesByMonth(entries, month)
    void tick
    return entries.reduce((s, e) => s + entrySeconds(e), 0)
  }

  const saveSettings = async (partial: Partial<UserSettings>) => {
    if (!user) return
    const updated = await api.upsertSettings(user.id, partial)
    setSettings(updated)
  }

  const exportData = async () => {
    if (!user) throw new Error('Not signed in')
    return api.exportUserData(user.id)
  }

  return (
    <DataContext.Provider
      value={{
        loading,
        topics,
        timeEntries,
        habitLogs,
        settings,
        activeEntry,
        todaySeconds,
        goalProgress,
        refresh,
        addTopic,
        updateTopic: updateTopicFn,
        removeTopic,
        startTimer,
        stopTimer,
        toggleHabit,
        isHabitDoneToday,
        getHabitStreak,
        getTopicSeconds,
        saveSettings,
        exportData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
