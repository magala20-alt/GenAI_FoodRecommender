import { createContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { User, AuthCredentials, AuthContextType } from '../types'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('authToken')
        if (savedToken) {
          apiClient.setToken(savedToken)
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
          setToken(savedToken)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        localStorage.removeItem('authToken')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (credentials: AuthCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('authToken', response.token)
      apiClient.setToken(response.token)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      setToken(null)
      setUser(null)
      localStorage.removeItem('authToken')
      apiClient.clearToken()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
