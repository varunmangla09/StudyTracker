# SwitchTrack

A installable PWA to track job-switch study time and daily habits. Built for **2 hours on weekdays** and **4–6 hours on weekends**, with topics, timers, habit streaks, goals, charts, and cloud sync.

## Features

- **Timer topics** – Start/stop tracking time on any topic (DSA, interviews, etc.)
- **Habit topics** – Tap once per day to build streaks (e.g. “drank morning water”)
- **Daily & monthly stats** per topic
- **Goal progress** – Weekday 2h / weekend 4–6h with progress bar and alerts
- **Weekly charts** and category breakdown
- **Dark theme**, categories, colors per topic
- **Export** all data as JSON
- **Reminders** via browser notifications
- **Account sync** via Supabase (phone + desktop)

## Quick start

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** → New query → paste and run `supabase/schema.sql`.
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open the URL shown (usually `http://localhost:5173`). Sign up with email/password.

> **Email confirmation:** In Supabase → Authentication → Providers → Email, you can disable “Confirm email” for faster local testing.

### 4. Install on your phone

**Production build (recommended for install):**

```bash
npm run build
npm run preview
```

Or deploy `dist/` to [Vercel](https://vercel.com), [Netlify](https://netlify.com), or any static host (HTTPS required for PWA).

- **iPhone:** Safari → Share → **Add to Home Screen**
- **Android:** Chrome → **Install app** or Add to Home screen

## Usage tips

| Goal | How |
|------|-----|
| Track study time | Add a **Timer** topic → Start/Stop on Home or Topics |
| Water / daily habit | Add a **Habit** topic → Tap once per day |
| See daily/monthly time | Topics → **Stats** on a timer topic |
| Change goals | Settings → Goals (defaults: 120 / 240 / 360 min) |
| Export backup | Settings → Export all data |

## Tech stack

- React + TypeScript + Vite
- Supabase (Auth + Postgres)
- Recharts
- vite-plugin-pwa

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
