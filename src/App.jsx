import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import useAuthStore from './store/useAuthStore.js'
import useChatStore from './store/useChatStore.js'
import socketService from './services/socket.jsx'
import { userAPI } from './services/api'

// Components
import Layout from './components/Layout/Layout'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import Chat from './components/Chat/Chat'
import Profile from './components/Profile/Profile'
import Settings from './components/Settings/Settings'
import LoadingSpinner from './components/UI/LoadingSpinner'



function App() {
  const { isAuthenticated, token, logout, debug } = useAuthStore()
  const { setConversations } = useChatStore()
  
  // Debug auth state
  console.log('🔍 App render - Auth state:', { isAuthenticated, hasToken: !!token })
  debug()

  // Verify token and get user profile on app load
  const { isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userAPI.getProfile,
    enabled: !!token && isAuthenticated,
    retry: false,
    onError: () => {
      logout()
    }
  })

  // Load conversations when authenticated
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => import('./services/api').then(api => api.conversationAPI.getConversations()),
    enabled: isAuthenticated && !!token,
    onSuccess: (data) => {
      setConversations(data.data)
    }
  })

  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect()
    } else {
      socketService.disconnect()
    }

    return () => {
      socketService.disconnect()
    }
  }, [isAuthenticated, token])

  // Show loading spinner only while verifying authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Handle routing based on authentication state
  if (!isAuthenticated || !token) {
    console.log('🔍 Rendering public routes - not authenticated')
    return (
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    )
  }

  console.log('🔍 Rendering protected routes - authenticated')
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<Layout><Chat /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </div>
  )
}

export default App 