import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { AuthContextType, AuthCredentials, User, RegisterData } from '../types'
import { authService } from '../services/authService'
import { AsyncStorageKeys } from '../utils'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // In a real app, retrieve token and user from AsyncStorage
        // For now, we'll just set loading to false
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize auth:', error)
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
      // In a real app, store token and user in AsyncStorage
      setIsLoading(false)
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
      throw error
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)
      setToken(response.token)
      setUser(response.user)
      // In a real app, store token and user in AsyncStorage
      setIsLoading(false)
    } catch (error) {
      console.error('Registration failed:', error)
      setIsLoading(false)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      setToken(null)
      setUser(null)
      // In a real app, clear AsyncStorage
      setIsLoading(false)
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoading(false)
      throw error
    }
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
