import { supabase } from './supabase'
import type { Topic, TimeEntry, HabitLog, UserSettings, TopicType } from './types'

function client() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

export async function fetchTopics(userId: string): Promise<Topic[]> {
  const { data, error } = await client()
    .from('topics')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createTopic(
  userId: string,
  payload: { name: string; type: TopicType; color: string; category: string }
): Promise<Topic> {
  const { data, error } = await client()
    .from('topics')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTopic(
  id: string,
  payload: Partial<Pick<Topic, 'name' | 'color' | 'category'>>
): Promise<Topic> {
  const { data, error } = await client().from('topics').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await client().from('topics').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTimeEntries(userId: string): Promise<TimeEntry[]> {
  const { data, error } = await client()
    .from('time_entries')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function startTimer(
  userId: string,
  topicId: string,
  note?: string | null
): Promise<TimeEntry> {
  const trimmed = note?.trim() || null
  const { data, error } = await client()
    .from('time_entries')
    .insert({
      user_id: userId,
      topic_id: topicId,
      started_at: new Date().toISOString(),
      note: trimmed,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function stopTimer(entryId: string, startedAt: string): Promise<TimeEntry> {
  const ended = new Date()
  const started = new Date(startedAt)
  const duration_seconds = Math.floor((ended.getTime() - started.getTime()) / 1000)
  const { data, error } = await client()
    .from('time_entries')
    .update({ ended_at: ended.toISOString(), duration_seconds })
    .eq('id', entryId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchHabitLogs(userId: string): Promise<HabitLog[]> {
  const { data, error } = await client()
    .from('habit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function toggleHabitLog(
  userId: string,
  topicId: string,
  logDate: string,
  exists: boolean
): Promise<void> {
  if (exists) {
    const { error } = await client()
      .from('habit_logs')
      .delete()
      .eq('user_id', userId)
      .eq('topic_id', topicId)
      .eq('log_date', logDate)
    if (error) throw error
  } else {
    const { error } = await client()
      .from('habit_logs')
      .insert({ user_id: userId, topic_id: topicId, log_date: logDate })
    if (error) throw error
  }
}

export async function fetchSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await client().from('user_settings').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function upsertSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
  const { data, error } = await client()
    .from('user_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function exportUserData(userId: string) {
  const [topics, timeEntries, habitLogs, settings] = await Promise.all([
    fetchTopics(userId),
    fetchTimeEntries(userId),
    fetchHabitLogs(userId),
    fetchSettings(userId),
  ])
  return { exportedAt: new Date().toISOString(), topics, timeEntries, habitLogs, settings }
}
