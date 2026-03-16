import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { AuthContextType, AuthCredentials, User, RegisterData, OnboardingSetupData } from '../types'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'
import { AsyncStorageKeys } from '../utils'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requiresOnboarding, setRequiresOnboarding] = useState(false)

  const persistSession = useCallback(async (nextToken: string, refreshToken: string, nextUser: User) => {
    apiClient.setToken(nextToken)
    setToken(nextToken)
    setUser(nextUser)
    setRequiresOnboarding(nextUser.userType === 'patient' && !nextUser.onboardingCompleted)

    await AsyncStorage.multiSet([
      [AsyncStorageKeys.AUTH_TOKEN, nextToken],
      [AsyncStorageKeys.REFRESH_TOKEN, refreshToken],
      [AsyncStorageKeys.USER_DATA, JSON.stringify(nextUser)],
    ])
  }, [])

  const clearSession = useCallback(async () => {
    apiClient.setToken(null)
    setToken(null)
    setUser(null)
    setRequiresOnboarding(false)

    await AsyncStorage.multiRemove([
      AsyncStorageKeys.AUTH_TOKEN,
      AsyncStorageKeys.REFRESH_TOKEN,
      AsyncStorageKeys.USER_DATA,
    ])
  }, [])

  // Initialize auth state from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [[, savedToken]] = await AsyncStorage.multiGet([AsyncStorageKeys.AUTH_TOKEN])

        if (!savedToken) {
          return
        }

        apiClient.setToken(savedToken)
        const currentUser = await authService.getCurrentUser()

        setToken(savedToken)
        setUser(currentUser)
        setRequiresOnboarding(currentUser.userType === 'patient' && !currentUser.onboardingCompleted)
        await AsyncStorage.setItem(AsyncStorageKeys.USER_DATA, JSON.stringify(currentUser))
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        await clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [clearSession])

  const login = useCallback(async (credentials: AuthCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)
      await persistSession(response.token, response.refreshToken, response.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [persistSession])

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)
      await persistSession(response.token, response.refreshToken, response.user)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [persistSession])

  const completeOnboarding = useCallback(async (data: OnboardingSetupData) => {
    setIsLoading(true)
    try {
      const updatedUser = await authService.completeOnboarding(data)
      setUser(updatedUser)
      setRequiresOnboarding(false)
      await AsyncStorage.setItem(AsyncStorageKeys.USER_DATA, JSON.stringify(updatedUser))
    } catch (error) {
      console.error('Onboarding completion failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
      await clearSession()
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [clearSession])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    requiresOnboarding,
    login,
    logout,
    register,
    completeOnboarding,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
