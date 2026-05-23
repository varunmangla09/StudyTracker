# SwitchTrack — Complete Study Guide

Read this file from top to bottom. It explains **what** the app does, **how** each part is built, and **how you could code it yourself**.

---

## Table of contents

1. [What is this project?](#1-what-is-this-project)
2. [Tech stack (what each tool does)](#2-tech-stack-what-each-tool-does)
3. [Project folder map](#3-project-folder-map)
4. [How the app boots (startup flow)](#4-how-the-app-boots-startup-flow)
5. [Architecture diagram](#5-architecture-diagram)
6. [Database design (Supabase / PostgreSQL)](#6-database-design-supabase--postgresql)
7. [Environment variables](#7-environment-variables)
8. [Layer 1: `src/lib` — pure logic & API](#8-layer-1-srclib--pure-logic--api)
9. [Layer 2: React Context — global state](#9-layer-2-react-context--global-state)
10. [Layer 3: Pages — screens](#10-layer-3-pages--screens)
11. [Layer 4: Components — reusable UI](#11-layer-4-components--reusable-ui)
12. [Routing & who sees what](#12-routing--who-sees-what)
13. [Authentication deep dive](#13-authentication-deep-dive)
14. [Timer feature — step by step](#14-timer-feature--step-by-step)
15. [Habit & streak feature](#15-habit--streak-feature)
16. [Goals & progress bar](#16-goals--progress-bar)
17. [Charts page](#17-charts-page)
18. [PWA (install on phone)](#18-pwa-install-on-phone)
19. [CSS & dark theme](#19-css--dark-theme)
20. [Common patterns you should learn](#20-common-patterns-you-should-learn)
21. [Coding exercises (do these yourself)](#21-coding-exercises-do-these-yourself)
22. [How to add a new feature](#22-how-to-add-a-new-feature)
23. [Debugging checklist](#23-debugging-checklist)
24. [Glossary](#24-glossary)

---

## 1. What is this project?

**SwitchTrack** is a web app for someone preparing for a **job switch**:

- Track **how long** you study (LeetCode, system design, etc.)
- Track **daily habits** with one tap (e.g. “drank morning water”) and **streaks**
- See **daily / monthly** time per topic
- Hit **goals**: 2 hours on weekdays, 4–6 hours on weekends
- **Sync** data across devices via login (Supabase)
- **Install** on phone like an app (PWA)

You are **not** learning a random tutorial app — you are learning a **real client + backend** structure used in many products.

---

## 2. Tech stack (what each tool does)

| Technology | Role in this project |
|------------|----------------------|
| **HTML** | One page (`index.html`) with `<div id="root">` — React draws everything inside it |
| **TypeScript** | JavaScript + types — catches mistakes before run time |
| **React 19** | UI library — components, state, re-render when data changes |
| **Vite** | Dev server + bundler — fast `npm run dev`, builds `dist/` for production |
| **React Router** | Multiple “pages” without full page reload (`/`, `/topics`, etc.) |
| **Supabase** | Backend-as-a-service: Postgres database + Auth + REST API |
| **date-fns** | Date math (today, this month, streaks) without pain |
| **Recharts** | Bar charts for weekly stats |
| **vite-plugin-pwa** | Service worker + manifest so phone can “install” the app |

**Mental model:**

```
Browser (React UI)  ←→  Supabase JS client  ←→  Supabase cloud (DB + Auth)
```

You did **not** write a custom Node.js server. The browser talks to Supabase directly (with Row Level Security protecting data).

---

## 3. Project folder map

```
cursor study app/
├── index.html              # Entry HTML, loads main.tsx
├── vite.config.ts          # Vite + PWA plugin config
├── package.json            # Dependencies & scripts
├── .env                    # Secrets (NOT in git): Supabase URL + key
├── .env.example            # Template for .env
├── supabase/
│   └── schema.sql          # Database tables + security policies
├── public/
│   ├── favicon.svg
│   └── pwa-192.png         # Icons for phone install
└── src/
    ├── main.tsx            # React entry: mounts <App />
    ├── App.tsx             # Router + auth gates
    ├── index.css           # Global styles (colors, buttons)
    ├── vite-env.d.ts       # Types for import.meta.env
    ├── lib/                # No React — reusable logic
    │   ├── supabase.ts     # Create Supabase client
    │   ├── api.ts          # All database calls
    │   ├── types.ts        # TypeScript interfaces
    │   ├── utils.ts        # Time formatting, streaks, goals
    │   ├── authRedirect.ts # Password reset URLs
    │   └── notifications.ts
    ├── context/            # Global React state
    │   ├── AuthContext.tsx # User login / signup / reset
    │   └── DataContext.tsx # Topics, timers, habits, settings
    ├── pages/              # Full screens
    │   ├── Auth.tsx
    │   ├── ResetPassword.tsx
    │   ├── Home.tsx
    │   ├── Topics.tsx
    │   ├── TopicDetail.tsx
    │   ├── Charts.tsx
    │   └── Settings.tsx
    └── components/         # Smaller UI pieces
        ├── Layout.tsx      # Bottom navigation
        ├── GoalProgress.tsx
        ├── ActiveTimer.tsx
        └── TopicCard.tsx
```

**Rule of thumb:**

- **`lib/`** = “how to talk to DB / compute things”
- **`context/`** = “what the whole app knows”
- **`pages/`** = “one screen”
- **`components/`** = “building blocks used on screens”

---

## 4. How the app boots (startup flow)

### Step 1: Browser loads `index.html`

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

### Step 2: `main.tsx` runs

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- `createRoot` attaches React to the DOM.
- `StrictMode` runs extra checks in development (helps find bugs).

### Step 3: `App.tsx` wraps everything

```tsx
<BrowserRouter>      {/* Enables useNavigate, Routes, etc. */}
  <AuthProvider>     {/* Provides user, signIn, signUp, ... */}
    <AppRoutes />    {/* Decides which screen to show */}
  </AuthProvider>
</BrowserRouter>
```

### Step 4: `AppRoutes` decides the screen

Rough logic:

```
if Supabase not configured     → show setup message (Auth page variant)
if still loading session       → "Loading…"
if password recovery in URL    → ResetPassword page
if no user logged in           → Auth (sign in / sign up)
else                           → Main app (Home, Topics, …) inside DataProvider
```

**Important:** `DataProvider` only wraps the app **after** login. So `useData()` is only valid on authenticated screens.

---

## 5. Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (Browser)                        │
├─────────────────────────────────────────────────────────────┤
│  Pages (Home, Topics, …)                                     │
│       ↓ useData() / useAuth()                                │
│  Context (DataContext, AuthContext)                          │
│       ↓ calls                                                │
│  lib/api.ts  ──────────────────→  Supabase Client            │
│  lib/utils.ts (local math)              │                    │
└────────────────────────────────────────│────────────────────┘
                                         ↓
                              ┌──────────────────────┐
                              │  Supabase Cloud        │
                              │  - auth.users          │
                              │  - public.topics       │
                              │  - public.time_entries │
                              │  - public.habit_logs   │
                              │  - public.user_settings│
                              └──────────────────────┘
```

**Data flow example (Start timer):**

1. User clicks **Start** on `TopicCard` → calls `startTimer(topicId)` from `useData()`
2. `DataContext.startTimer` calls `api.startTimer(userId, topicId)`
3. `api.ts` runs `supabase.from('time_entries').insert({...})`
4. Postgres saves row; RLS checks `user_id = auth.uid()`
5. `DataContext` calls `refresh()` → re-fetches all data
6. React re-renders → UI shows active timer

---

## 6. Database design (Supabase / PostgreSQL)

### Table: `topics`

One row = one thing you track (either timer or habit).

| Column | Type | Meaning |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Owner (links to auth.users) |
| name | text | e.g. "LeetCode" |
| type | text | `'timer'` or `'habit'` |
| color | text | Hex color for UI |
| category | text | Grouping for charts |
| created_at | timestamptz | When created |

### Table: `time_entries`

One row = one study session (start → stop).

| Column | Type | Meaning |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| topic_id | uuid | Which topic |
| started_at | timestamptz | When timer started |
| ended_at | timestamptz | When stopped (null = still running) |
| duration_seconds | integer | Filled when stopped |

**Active timer** = row where `ended_at IS NULL` (at most one per user in our app logic).

### Table: `habit_logs`

One row = “I did this habit on this calendar day.”

| Column | Type | Meaning |
|--------|------|---------|
| topic_id | uuid | Which habit |
| log_date | date | e.g. `2026-05-23` |
| unique (user_id, topic_id, log_date) | | Can only log once per day |

### Table: `user_settings`

One row per user (created automatically on signup via SQL trigger).

| Column | Default | Meaning |
|--------|---------|---------|
| weekday_goal_minutes | 120 | 2 hours |
| weekend_min_goal_minutes | 240 | 4 hours |
| weekend_max_goal_minutes | 360 | 6 hours |
| reminder_enabled | false | Daily notification |
| reminder_time | '09:00' | When to remind |
| goal_alert_enabled | true | Notify when goal hit |

### Row Level Security (RLS)

Every table has policies like:

```sql
create policy "topics_own" on public.topics
  for all using (auth.uid() = user_id);
```

**Meaning:** You can only read/write rows where `user_id` matches your logged-in user id. Even with the anon key in the browser, users cannot see each other's data.

### Trigger on signup

```sql
after insert on auth.users
  → insert into user_settings (user_id) values (new.id);
```

So every new account gets default goals automatically.

---

## 7. Environment variables

File: `.env` (never commit to GitHub)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

**Rules:**

- Must start with `VITE_` for Vite to expose them to the browser.
- URL is **only** `https://PROJECT.supabase.co` — **NOT** `/rest/v1`.
- After changing `.env`, restart `npm run dev`.

In code:

```ts
import.meta.env.VITE_SUPABASE_URL
```

`src/lib/supabase.ts` creates the client:

```ts
export const supabase = createClient(url, key)
```

---

## 8. Layer 1: `src/lib` — pure logic & API

These files do **not** import React. You could reuse them in a Node script or tests.

### `types.ts`

Defines shapes of data from the database:

```ts
export type TopicType = 'timer' | 'habit'

export interface Topic {
  id: string
  user_id: string
  name: string
  type: TopicType
  // ...
}
```

**Why?** TypeScript autocomplete and errors if you typo `topic.nmae`.

### `api.ts` — every database operation

Pattern used everywhere:

```ts
const { data, error } = await supabase
  .from('topics')
  .select('*')
  .eq('user_id', userId)

if (error) throw error
return data ?? []
```

| Function | SQL idea |
|----------|----------|
| `fetchTopics` | SELECT * FROM topics WHERE user_id = ? |
| `createTopic` | INSERT INTO topics ... |
| `startTimer` | INSERT time_entries (started_at = now, ended_at = null) |
| `stopTimer` | UPDATE time_entries SET ended_at, duration_seconds |
| `toggleHabitLog` | INSERT or DELETE habit_logs for today |
| `upsertSettings` | INSERT or UPDATE user_settings |

**Try coding:** Open `api.ts` and trace `startTimer` → what columns are sent?

### `utils.ts` — calculations in the browser

| Function | Purpose |
|----------|---------|
| `formatDuration(3661)` | `"1h 1m 1s"` |
| `filterEntriesByDay(entries, date)` | Only sessions that started today |
| `sumEntrySeconds(entries)` | Total seconds |
| `entrySeconds(entry)` | If timer still running, use `now - started_at` |
| `calcStreak(dates[])` | Consecutive days with logs |
| `getDayGoal(date, settings)` | Weekday vs weekend min/max seconds |
| `todayStr()` | `"2026-05-23"` for habit comparisons |

**Why `void tick` in DataContext?**

```ts
const todaySeconds = useMemo(() => {
  void tick  // forces recalc every second when timer running
  // ...
}, [timeEntries, tick])
```

When a timer is active, `tick` increments every second so the displayed time updates live.

### `authRedirect.ts`

- `getAuthRedirectUrl('/reset-password')` → `http://localhost:5173/reset-password`
- `isRecoveryHash()` → reads `#type=recovery` from URL
- `clearAuthHashFromUrl()` → removes `#access_token=...` from address bar after reset

### `notifications.ts`

Uses browser `Notification` API (optional permission). Not true push when app is closed — that would need Firebase or similar.

---

## 9. Layer 2: React Context — global state

### What is Context?

Normally: parent passes props → child → grandchild (prop drilling).

**Context** = a “global bag” any descendant can read:

```tsx
const { topics, startTimer } = useData()
```

### `AuthContext.tsx`

**State:**

- `user` — logged-in user or null
- `session` — JWT session from Supabase
- `loading` — still checking session on first load?
- `isPasswordRecovery` — must show reset form even if session exists

**On mount:**

```ts
supabase.auth.getSession()           // read existing login
supabase.auth.onAuthStateChange(...) // listen for login/logout/reset
```

**Functions you call from UI:**

- `signUp(email, password)`
- `signIn(email, password)`
- `resetPassword(email)` — sends email with link
- `updatePassword(password)` — after clicking email link
- `signOut()`

### `DataContext.tsx`

**State loaded from API:**

- `topics`, `timeEntries`, `habitLogs`, `settings`

**Derived (computed, not stored in DB):**

- `activeEntry` — first entry with `ended_at === null`
- `todaySeconds` — sum of today's timer seconds
- `goalProgress` — `{ current, min, max, percent }`

**`refresh()`**

Fetches all 4 tables in parallel with `Promise.all`, then `setTopics`, etc.

Called after every mutation (add topic, stop timer, …) so UI stays in sync.

**Business rules in context:**

```ts
const startTimer = async (topicId: string) => {
  if (!user || activeEntry) return  // only one timer at a time
  await api.startTimer(user.id, topicId)
  await refresh()
}
```

---

## 10. Layer 3: Pages — screens

### `Auth.tsx`

- Modes: `signin` | `signup` | `forgot`
- Local state: `email`, `password`, `error`, `message`
- On submit → calls `signIn` / `signUp` / `resetPassword` from context

### `ResetPassword.tsx`

Shown when `isPasswordRecovery === true`.

User sets new password → `updatePassword` → navigates to `/`.

### `Home.tsx`

Main dashboard:

- `GoalProgress` — today's bar
- `ActiveTimer` — if something is recording
- Habit topics — tap to toggle
- Timer topics — start/stop

Uses: `const { topics, startTimer, ... } = useData()`

Filters: `topics.filter(t => t.type === 'timer')`

### `Topics.tsx`

- List all topics
- Form to add new (name, type, color, category)
- Delete button
- Link to stats for timer topics

### `TopicDetail.tsx`

Route: `/topics/:id`

Uses `useParams()` to get `id`, then filters `timeEntries` for that topic.

Shows today + this month totals and per-day breakdown.

### `Charts.tsx`

Uses **Recharts**:

```tsx
<BarChart data={chartData}>
  <Bar dataKey="minutes" fill="var(--accent)" />
</BarChart>
```

`chartData` built in `useMemo` from last 7 days of `timeEntries`.

### `Settings.tsx`

- Form for goal minutes, reminders
- Export JSON button
- Sign out
- Install instructions

---

## 11. Layer 4: Components — reusable UI

### `Layout.tsx`

- Renders `<Outlet />` — child route content
- Bottom `<nav>` with `NavLink` to `/`, `/topics`, `/charts`, `/settings`
- `NavLink` adds `.active` class when URL matches

### `TopicCard.tsx`

Two completely different UIs based on `topic.type`:

- **habit** → Tap button, streak display
- **timer** → Start/Stop, link to stats

Props are **callbacks** from parent: `onStart`, `onHabitTap` — child doesn't call API directly (good separation).

### `GoalProgress.tsx`

Presentational only — receives numbers, draws bar. No `useData()`.

### `ActiveTimer.tsx`

Finds topic name from `activeEntry.topic_id`, shows live seconds via `entrySeconds(activeEntry)`.

---

## 12. Routing & who sees what

File: `App.tsx`

```tsx
<Routes>
  <Route element={<Layout />}>       {/* wraps children with nav */}
    <Route index element={<Home />} />
    <Route path="topics" element={<Topics />} />
    ...
  </Route>
</Routes>
```

| URL | Page | Needs login? |
|-----|------|----------------|
| `/` | Home | Yes |
| `/topics` | Topics | Yes |
| `/topics/abc-uuid` | TopicDetail | Yes |
| `/charts` | Charts | Yes |
| `/settings` | Settings | Yes |
| `/reset-password` | ResetPassword | Special (recovery) |

---

## 13. Authentication deep dive

### Sign up flow

1. User submits email + password
2. `supabase.auth.signUp({ email, password })`
3. Supabase creates row in `auth.users`
4. SQL trigger creates `user_settings` row
5. User may need to confirm email (if enabled in Supabase)

### Sign in flow

1. `supabase.auth.signInWithPassword({ email, password })`
2. Supabase returns session (access token in memory)
3. `onAuthStateChange` fires → `user` set → app shows main screens

### Password reset flow (fixed behavior)

1. User requests reset → email with link to  
   `http://localhost:5173/reset-password#access_token=...&type=recovery`
2. Supabase client reads hash → creates temporary session
3. App sets `isPasswordRecovery = true` (from hash or `PASSWORD_RECOVERY` event)
4. **Even though user is “logged in”,** app shows `ResetPassword` not Home
5. User submits new password → `updateUser({ password })`
6. `clearPasswordRecovery()` → normal app

### Supabase dashboard settings you must configure

**Authentication → URL configuration:**

- Site URL: `http://localhost:5173` (local) or your Vercel URL (production)
- Redirect URLs: `http://localhost:5173/**`

---

## 14. Timer feature — step by step

### User clicks Start

```
TopicCard onStart
  → DataContext.startTimer(topicId)
    → api.startTimer(userId, topicId)
      → INSERT time_entries { started_at: now, ended_at: null }
    → refresh()
      → fetchTimeEntries()
  → activeEntry = that row
  → useEffect starts setInterval every 1s → tick++
  → todaySeconds & UI update
```

### User clicks Stop

```
stopTimer()
  → api.stopTimer(entryId, startedAt)
    → duration = now - started_at
    → UPDATE ended_at, duration_seconds
  → refresh()
  → activeEntry = null
  → interval cleared
```

### If user closes browser mid-timer

Row still has `ended_at = null`. Next visit:

- `entrySeconds` calculates live duration from `started_at` to now
- User should stop timer to save final duration to DB

**Exercise idea:** Add “auto-stop after 8 hours” or warn if timer > 4h.

---

## 15. Habit & streak feature

### Toggle today

```ts
const today = todayStr()  // "2026-05-23"
const exists = habitLogs.some(l => l.topic_id === topicId && l.log_date === today)

if (exists) DELETE habit_logs ...
else INSERT habit_logs { log_date: today }
```

### Streak algorithm (`calcStreak`)

1. Sort unique dates descending (newest first)
2. Start from today (or yesterday if today not done yet)
3. Count consecutive calendar days backward
4. Stop at first gap

**Example:** Logs on Mon, Tue, Wed → streak 3. Logs Mon, Wed (skip Tue) → streak 1 from Wed only if today is Wed.

---

## 16. Goals & progress bar

```ts
getDayGoal(new Date(), settings)
```

- Saturday/Sunday → min = 240 min, max = 360 min (seconds in code)
- Monday–Friday → min = max = 120 min

```ts
percent = min(100, round(todaySeconds / min * 100))
```

Weekend bar can show marker at min toward max (see `GoalProgress.css`).

---

## 17. Charts page

**`useMemo`** recalculates only when `timeEntries` changes (performance).

```ts
last7Days().map(day => ({
  name: format(day, 'EEE'),  // Mon, Tue, ...
  minutes: sum(entries that day) / 60
}))
```

Category chart: loop all entries, group by `topic.category`, sum minutes.

---

## 18. PWA (install on phone)

`vite.config.ts`:

```ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: { name, icons, theme_color, display: 'standalone' },
})
```

Build generates:

- `manifest.webmanifest` — app name, icons
- `sw.js` — service worker caches JS/CSS for offline **shell** (data still needs network for Supabase)

**Install requires HTTPS** (localhost is exception for dev).

---

## 19. CSS & dark theme

`index.css` defines **CSS variables**:

```css
:root {
  --bg: #0f1419;
  --surface: #1a2332;
  --accent: #6366f1;
  /* ... */
}
```

Components use `var(--accent)` so one place changes the whole theme.

Each component often has its own `.css` file imported in the `.tsx` file.

**Layout:** max-width 480px centered — feels like a phone app on desktop too.

---

## 20. Common patterns you should learn

### 1. Controlled inputs

```tsx
<input value={email} onChange={(e) => setEmail(e.target.value)} />
```

React state is the source of truth.

### 2. `useState`

```tsx
const [topics, setTopics] = useState<Topic[]>([])
```

### 3. `useEffect`

Run when component mounts or when dependencies change:

```tsx
useEffect(() => {
  if (user) refresh()
}, [user, refresh])
```

### 4. `useMemo`

Expensive calculation cached until dependencies change:

```tsx
const activeEntry = useMemo(
  () => timeEntries.find(e => !e.ended_at) ?? null,
  [timeEntries]
)
```

### 5. `useCallback`

Stable function reference for `useEffect` dependencies:

```tsx
const refresh = useCallback(async () => { ... }, [user])
```

### 6. Async handlers

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    await signIn(email, password)
  } finally {
    setLoading(false)
  }
}
```

### 7. Conditional rendering

```tsx
{error && <p className="auth-error">{error}</p>}
{loading ? <p>Loading…</p> : <MainApp />}
```

---

## 21. Coding exercises (do these yourself)

Start easy, then harder. Do them in order.

### Exercise 1 — Read the code

1. Run `npm run dev`
2. Open DevTools → Network tab
3. Sign in, add a topic, start/stop timer
4. Find Supabase requests — what URL? what method?

### Exercise 2 — Change copy

Change app title on Home from "SwitchTrack" to your own name.  
Files: `Home.tsx`, `index.html`, `vite.config.ts` (manifest name).

### Exercise 3 — New category

Add `"Networking"` to `CATEGORIES` in `types.ts`.  
Rebuild — it should appear in the Topics dropdown.

### Exercise 4 — Show total time on Home

Under the goal bar, display:  
`Total all-time: X hours`  
Hint: sum all `timeEntries` with `entrySeconds`, use `formatDurationShort`.

### Exercise 5 — Edit topic name

On Topics page, add an "Edit" button that lets you change the name.  
Use existing `updateTopic` from `useData()`.

### Exercise 6 — Notes on timer stop

Add optional `notes` column to `time_entries` in SQL.  
On stop, prompt for a note.  
Update `api.stopTimer`, types, and UI.

### Exercise 7 — Weekly goal

Add `weekly_goal_minutes` to `user_settings`.  
Show progress on Charts page for current week.

### Exercise 8 — Build from scratch (mini version)

Without looking, create a new Vite+React app that:

- Has one button "Start" / "Stop"
- Stores sessions in `localStorage` only (no Supabase)
- Shows total minutes today

Then compare your code to SwitchTrack's `DataContext` timer logic.

---

## 22. How to add a new feature

Checklist:

1. **Database** — add column/table in `schema.sql`, run in Supabase SQL editor
2. **types.ts** — update interfaces
3. **api.ts** — add fetch/create/update functions
4. **DataContext** — load data, expose function to UI
5. **Page/Component** — buttons and display
6. **Test** — sign in, use feature, refresh page, check data persists

Example: “Pomodoro 25 min default timer”

- Could be UI-only countdown on top of existing timer
- Or new `pomodoro_sessions` table if you want history

---

## 23. Debugging checklist

| Problem | Check |
|---------|--------|
| Blank white screen | Browser Console (F12) for red errors |
| "Setup required" | `.env` exists, correct `VITE_` names, restart dev server |
| "Invalid path" on auth | URL must NOT include `/rest/v1` |
| Can't sign up | Supabase Auth settings, email confirmation on/off |
| Reset link opens Home | Pull latest code — `isPasswordRecovery` fix |
| Data not saving | Supabase Table Editor — rows appearing? RLS policies? |
| CORS errors | Wrong Supabase URL |
| Old code on phone | Hard refresh or redeploy Vercel |

**Useful:**

```ts
console.log('topics', topics)
```

In component body (remove before production).

---

## 24. Glossary

| Term | Meaning |
|------|---------|
| **Component** | Function that returns JSX (UI) |
| **Props** | Inputs to a component |
| **State** | Data that changes over time inside a component |
| **Context** | Shared state for many components |
| **Hook** | `useState`, `useEffect`, etc. — functions starting with `use` |
| **JSX** | HTML-like syntax inside JavaScript |
| **Route** | URL path → which page to show |
| **CRUD** | Create, Read, Update, Delete |
| **RLS** | Row Level Security — database enforces per-user access |
| **JWT / Session** | Proof you're logged in; Supabase stores it |
| **PWA** | Progressive Web App — installable website |
| **Anon key** | Public API key safe in browser (with RLS) |
| **Service role key** | Admin key — NEVER put in frontend |

---

## Suggested study plan (2 weeks)

| Day | Focus |
|-----|--------|
| 1–2 | Read sections 1–7, run app, click everything |
| 3–4 | Read `lib/` — types, api, utils — trace one API call in Network tab |
| 5–6 | Read `AuthContext` + `Auth.tsx` — sign up/in/out yourself on paper |
| 7–8 | Read `DataContext` — trace start/stop timer on paper |
| 9 | Read all `pages/` |
| 10 | Read all `components/` |
| 11–12 | Exercises 1–5 |
| 13–14 | Exercises 6–8 or one feature you invent |

---

## Key files to open in this order

1. `src/main.tsx`
2. `src/App.tsx`
3. `src/lib/supabase.ts`
4. `src/context/AuthContext.tsx`
5. `src/context/DataContext.tsx`
6. `src/lib/api.ts`
7. `src/pages/Home.tsx`
8. `src/components/TopicCard.tsx`
9. `supabase/schema.sql`

When you can explain each file's job without looking, you understand the project.

---

*This guide matches the SwitchTrack codebase in this repository. When you change code, update this file or add notes for yourself.*
