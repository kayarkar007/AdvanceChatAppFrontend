import axios from 'axios'
import useAuthStore from '../store/useAuthStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Debug function to check token status
const debugToken = () => {
  try {
    const storeToken = useAuthStore.getState().token
    const localStorageData = localStorage.getItem('auth-storage')
    const parsedData = localStorageData ? JSON.parse(localStorageData) : null
    
    console.log('🔍 Token Debug Info:')
    console.log('Store token:', storeToken ? 'Present' : 'Missing')
    console.log('LocalStorage data:', parsedData ? 'Present' : 'Missing')
    if (parsedData) {
      console.log('LocalStorage token:', parsedData.state?.token ? 'Present' : 'Missing')
      console.log('LocalStorage isAuthenticated:', parsedData.state?.isAuthenticated)
    }
    
    // Also check the current state
    const currentState = useAuthStore.getState()
    console.log('🔍 Current auth state:', {
      isAuthenticated: currentState.isAuthenticated,
      hasToken: !!currentState.token,
      hasUser: !!currentState.user
    })
  } catch (error) {
    console.error('Error debugging token:', error)
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🔍 Request interceptor called for:', config.url)
    
    try {
      const token = useAuthStore.getState().token
      console.log('🔍 Token from store:', token ? 'Present' : 'Missing')
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔍 Authorization header set:', `Bearer ${token.substring(0, 20)}...`)
      } else {
        console.log('🔍 No token in store, trying localStorage fallback')
        // Fallback to localStorage
        const fallbackToken = localStorage.getItem('auth-storage') ? 
          JSON.parse(localStorage.getItem('auth-storage')).state?.token : null
        if (fallbackToken) {
          config.headers.Authorization = `Bearer ${fallbackToken}`
          console.log('🔍 Fallback token used:', `Bearer ${fallbackToken.substring(0, 20)}...`)
        } else {
          console.log('🔍 No fallback token found either')
          debugToken()
        }
      }
    } catch (error) {
      console.warn('Failed to get token from store:', error)
      // Fallback to localStorage
      const fallbackToken = localStorage.getItem('auth-storage') ? 
        JSON.parse(localStorage.getItem('auth-storage')).state?.token : null
      if (fallbackToken) {
        config.headers.Authorization = `Bearer ${fallbackToken}`
        console.log('🔍 Error fallback token used:', `Bearer ${fallbackToken.substring(0, 20)}...`)
      } else {
        debugToken()
      }
    }
    
    console.log('🔍 Final headers:', config.headers)
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized request, logging out user')
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updateAvatar: (formData) => api.put('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  searchUsers: (query) => api.get(`/users/search?q=${query}`),
  getUserById: (userId) => api.get(`/users/${userId}`),
  getOnlineUsers: () => api.get('/users/online'),
  updateStatus: (status) => api.put('/users/status', { status }),
  blockUser: (userId) => api.post(`/users/${userId}/block`),
  unblockUser: (userId) => api.delete(`/users/${userId}/block`),
}

// Conversation API
export const conversationAPI = {
  getConversations: () => api.get('/conversations'),
  getConversation: (conversationId) => api.get(`/conversations/${conversationId}`),
  createConversation: (participants) => api.post('/conversations', { participants }),
  updateConversation: (conversationId, updates) => api.put(`/conversations/${conversationId}`, updates),
  deleteConversation: (conversationId) => api.delete(`/conversations/${conversationId}`),
  markAsRead: (conversationId) => api.put(`/conversations/${conversationId}/read`),
  addParticipants: (conversationId, participants) => api.post(`/conversations/${conversationId}/participants`, { participants }),
  removeParticipant: (conversationId, participantId) => api.delete(`/conversations/${conversationId}/participants/${participantId}`),
  leaveConversation: (conversationId) => api.post(`/conversations/${conversationId}/leave`),
}

// Message API
export const messageAPI = {
  getMessages: (conversationId, page = 1, limit = 50) => 
    api.get(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
  sendMessage: (conversationId, messageData) => 
    api.post(`/conversations/${conversationId}/messages`, messageData),
  updateMessage: (messageId, updates) => api.put(`/messages/${messageId}`, updates),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  reactToMessage: (messageId, reaction) => api.post(`/messages/${messageId}/reactions`, { reaction }),
  removeReaction: (messageId, reaction) => api.delete(`/messages/${messageId}/reactions/${reaction}`),
  forwardMessage: (messageId, conversationIds) => api.post(`/messages/${messageId}/forward`, { conversationIds }),
  searchMessages: (conversationId, query) => api.get(`/conversations/${conversationId}/messages/search?q=${query}`),
}

// File API
export const fileAPI = {
  uploadFile: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  getFile: (fileId) => api.get(`/files/${fileId}`),
}

// Notification API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  updateSettings: (settings) => api.put('/notifications/settings', settings),
}

// Call API
export const callAPI = {
  initiateCall: (conversationId, type) => api.post('/calls/initiate', { conversationId, type }),
  acceptCall: (callId) => api.post(`/calls/${callId}/accept`),
  rejectCall: (callId) => api.post(`/calls/${callId}/reject`),
  endCall: (callId) => api.post(`/calls/${callId}/end`),
  getCallHistory: () => api.get('/calls/history'),
}

export default api 