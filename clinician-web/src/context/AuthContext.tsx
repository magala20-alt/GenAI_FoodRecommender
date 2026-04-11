import { createContext, ReactNode, useCallback, useEffect, useState } from 'react'
import { User, AuthCredentials, AuthContextType } from '../types'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

const normalizeErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
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
      throw new Error(normalizeErrorMessage(error, 'Login failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsLoading(true)
    try {
      const updatedUser = await authService.changePassword(currentPassword, newPassword)
      setUser(updatedUser)
    } catch (error) {
      throw new Error(normalizeErrorMessage(error, 'Change password failed. Please try again.'))
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
      // Logout should not block the UI if the server request fails.
    }
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    changePassword,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
