/* eslint-disable react-refresh/only-export-components */
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
  pendingStartTopicId: string | null
  openStartSession: (topicId: string) => void
  cancelStartSession: () => void
  confirmStartSession: (note?: string) => Promise<void>
  pendingMarkHabitTopicId: string | null
  openMarkHabit: (topicId: string) => void
  cancelMarkHabit: () => void
  confirmMarkHabit: (topicId: string, logDate: string) => Promise<void>
  pendingEditEntryId: string | null
  openEditSession: (entryId: string) => void
  cancelEditSession: () => void
  confirmEditSession: (entryId: string, updates: { started_at: string; ended_at: string; duration_seconds: number; note: string | null }) => Promise<void>
  deleteSession: (entryId: string) => Promise<void>
  stopTimer: () => Promise<void>
  toggleHabit: (topicId: string, logDate?: string) => Promise<void>
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
  const [pendingStartTopicId, setPendingStartTopicId] = useState<string | null>(null)
  const [pendingMarkHabitTopicId, setPendingMarkHabitTopicId] = useState<string | null>(null)
  const [pendingEditEntryId, setPendingEditEntryId] = useState<string | null>(null)

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
    if (user) {
      queueMicrotask(() => {
        void refresh()
      })
    } else {
      queueMicrotask(() => {
        setTopics([])
        setTimeEntries([])
        setHabitLogs([])
        setSettings(null)
        setLoading(false)
      })
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

  const openStartSession = useCallback((topicId: string) => {
    if (activeEntry) return
    setPendingStartTopicId(topicId)
  }, [activeEntry])

  const cancelStartSession = useCallback(() => {
    setPendingStartTopicId(null)
  }, [])

  const confirmStartSession = async (note?: string) => {
    if (!user || !pendingStartTopicId || activeEntry) return
    await api.startTimer(user.id, pendingStartTopicId, note)
    setPendingStartTopicId(null)
    await refresh()
  }

  const openMarkHabit = useCallback((topicId: string) => {
    setPendingMarkHabitTopicId(topicId)
  }, [])

  const cancelMarkHabit = useCallback(() => {
    setPendingMarkHabitTopicId(null)
  }, [])

  const confirmMarkHabit = async (topicId: string, logDate: string) => {
    if (!user) return
    const exists = habitLogs.some((l) => l.topic_id === topicId && l.log_date === logDate)
    await api.toggleHabitLog(user.id, topicId, logDate, exists)
    setPendingMarkHabitTopicId(null)
    await refresh()
  }

  const stopTimer = async () => {
    if (!activeEntry) return
    await api.stopTimer(activeEntry.id, activeEntry.started_at)
    await refresh()
  }

  const toggleHabit = async (topicId: string, logDate?: string) => {
    if (!user) return
    const date = logDate || todayStr()
    const exists = habitLogs.some((l) => l.topic_id === topicId && l.log_date === date)
    await api.toggleHabitLog(user.id, topicId, date, exists)
    await refresh()
  }

  const openEditSession = useCallback((entryId: string) => {
    setPendingEditEntryId(entryId)
  }, [])

  const cancelEditSession = useCallback(() => {
    setPendingEditEntryId(null)
  }, [])

  const confirmEditSession = async (
    entryId: string,
    updates: { started_at: string; ended_at: string; duration_seconds: number; note: string | null }
  ) => {
    await api.updateTimeEntry(entryId, updates)
    setPendingEditEntryId(null)
    await refresh()
  }

  const deleteSession = async (entryId: string) => {
    await api.deleteTimeEntry(entryId)
    setPendingEditEntryId(null)
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
        pendingStartTopicId,
        openStartSession,
        cancelStartSession,
        confirmStartSession,
        pendingMarkHabitTopicId,
        openMarkHabit,
        cancelMarkHabit,
        confirmMarkHabit,
        pendingEditEntryId,
        openEditSession,
        cancelEditSession,
        confirmEditSession,
        deleteSession,
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
