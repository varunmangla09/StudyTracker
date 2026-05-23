import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Layout } from './components/Layout'

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })))
const Topics = lazy(() => import('./pages/Topics').then((module) => ({ default: module.Topics })))
const TopicDetail = lazy(() =>
  import('./pages/TopicDetail').then((module) => ({ default: module.TopicDetail }))
)
const Charts = lazy(() => import('./pages/Charts').then((module) => ({ default: module.Charts })))
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })))
const Auth = lazy(() => import('./pages/Auth').then((module) => ({ default: module.Auth })))
const ResetPassword = lazy(() =>
  import('./pages/ResetPassword').then((module) => ({ default: module.ResetPassword }))
)

function RouteLoader() {
  return (
    <div className="loading-screen">
      <p>Loading…</p>
    </div>
  )
}

function AppRoutes() {
  const { user, loading, configured, isPasswordRecovery } = useAuth()

  if (!configured) return <Suspense fallback={<RouteLoader />}><Auth /></Suspense>
  if (loading) return <RouteLoader />
  if (isPasswordRecovery) {
    return <Suspense fallback={<RouteLoader />}><ResetPassword /></Suspense>
  }
  if (!user) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Auth />} />
        </Routes>
      </Suspense>
    )
  }

  return (
    <DataProvider>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="topics" element={<Topics />} />
            <Route path="topics/:id" element={<TopicDetail />} />
            <Route path="charts" element={<Charts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </DataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
