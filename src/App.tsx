import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { HouseProvider } from './context/HouseContext'
import { SeasonProvider } from './context/SeasonContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TodayPage from './pages/TodayPage'
import FocusPage from './pages/FocusPage'
import TasksPage from './pages/TasksPage'
import TaskAddPage from './pages/TaskAddPage'
import TaskEditPage from './pages/TaskEditPage'
import RoomsPage from './pages/RoomsPage'
import SeasonsPage from './pages/SeasonsPage'
import SeasonCreatePage from './pages/SeasonCreatePage'
import HouseListPage from './pages/HouseListPage'
import HouseCreatePage from './pages/HouseCreatePage'
import JoinHousePage from './pages/JoinHousePage'
import InvitePage from './pages/InvitePage'
import AIWizardPage from './pages/AIWizardPage'
import SettingsPage from './pages/SettingsPage'
import SchedulePage from './pages/SchedulePage'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

function UnauthorizedPage() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold mb-2">אין גישה</h1>
      <p className="text-on-surface-muted mb-6">
        אין לך הרשאה לאפליקציה הזו. פנה למנהל המערכת.
      </p>
      <button
        onClick={signOut}
        className="bg-gray-100 text-on-surface-muted px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
      >
        התנתקות
      </button>
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { firebaseUser, loading, authorized } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  if (!firebaseUser) {
    return <Navigate to="/login" replace />
  }

  if (authorized === false) {
    return <UnauthorizedPage />
  }

  return children
}

function AppRoutes() {
  const { firebaseUser, loading, authorized } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={firebaseUser && authorized ? <Navigate to="/" replace /> : firebaseUser && authorized === false ? <UnauthorizedPage /> : <LoginPage />}
      />
      <Route
        path="/join/:code?"
        element={
          <RequireAuth>
            <JoinHousePage />
          </RequireAuth>
        }
      />
      <Route
        path="/houses"
        element={
          <RequireAuth>
            <HouseListPage />
          </RequireAuth>
        }
      />
      <Route
        path="/houses/new"
        element={
          <RequireAuth>
            <HouseCreatePage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <HouseProvider>
              <SeasonProvider>
                <Layout />
              </SeasonProvider>
            </HouseProvider>
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/new" element={<TaskAddPage />} />
        <Route path="tasks/:taskId/edit" element={<TaskEditPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="seasons" element={<SeasonsPage />} />
        <Route path="seasons/new" element={<SeasonCreatePage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="ai" element={<AIWizardPage />} />
        <Route path="invite" element={<InvitePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
