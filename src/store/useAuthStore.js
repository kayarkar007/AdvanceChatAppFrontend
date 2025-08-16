import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Debug function to log current state
      debug: () => {
        const state = get()
        console.log('🔍 Auth store state:', {
          hasUser: !!state.user,
          hasToken: !!state.token,
          isAuthenticated: state.isAuthenticated,
          isLoading: state.isLoading
        })
        return state
      },
      
      login: (userData, token) => {
        console.log('🔍 Auth store login called with token:', token ? `${token.substring(0, 20)}...` : 'Missing')
        set({
          user: userData,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
        console.log('🔍 Auth store state updated')
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading })
      },
      
      updateUser: (userData) => {
        set({ user: userData })
      },
      
      updateToken: (token) => {
        set({ token })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore 