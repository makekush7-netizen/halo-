import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

// Pages
import LandingPage from './pages/LandingPage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import JoinPage from './pages/JoinPage.jsx'
import LobbyPage from './pages/LobbyPage.jsx'
import CockpitPage from './pages/CockpitPage.jsx'
import SessionPage from './pages/SessionPage.jsx'
import ReportPage from './pages/ReportPage.jsx'

// Protected Route Wrapper
function ProtectedRoute({ children, allowRoles = [] }) {
  const { user, loading } = useAuth()
  if (loading) return null // or a spinner
  if (!user) return <Navigate to="/login" />
  if (allowRoles.length > 0 && !allowRoles.includes(user.role)) return <Navigate to="/" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  const role = user?.role || 'member'
  const canAccessCockpit = role === 'admin' || role === 'co-admin' || role === 'member'

  return (
    <Routes>
      {/* Public / Landing */}
      <Route path="/" element={user && canAccessCockpit ? <Navigate to="/cockpit" /> : <LandingPage />} />
      
      {/* Auth */}
      <Route path="/login" element={user && canAccessCockpit ? <Navigate to="/cockpit" /> : <AuthPage mode="login" />} />
      <Route path="/signup" element={user && canAccessCockpit ? <Navigate to="/cockpit" /> : <AuthPage mode="signup" />} />
      
      {/* Participant Join Flow (No Auth Required) */}
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/join/:roomCode" element={<JoinPage />} />

      {/* Live Session Video Call - Mixed Auth (Host vs Guest) */}
      <Route path="/session/:roomId" element={<SessionPage />} />

      {/* Admin Protected Routes */}
      <Route path="/cockpit" element={<ProtectedRoute allowRoles={['admin', 'co-admin', 'member']}><CockpitPage /></ProtectedRoute>} />
      <Route path="/report/:sessionId" element={<ProtectedRoute allowRoles={['admin', 'co-admin']}><ReportPage /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
