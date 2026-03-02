import { apiClient } from './apiClient'
import { AuthCredentials, AuthResponse, User } from '../types'

// Mock data for development
const mockUser: User = {
  id: '1',
  firstName: 'Dr.',
  lastName: 'Sarah',
  email: 'clinician@example.com',
  role: 'clinician',
  specialty: 'Endocrinology',
  licenseNumber: 'MD123456',
  hospitalId: 'hospital-1',
}

const mockAuthResponse: AuthResponse = {
  token: 'mock-jwt-token-clinician',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
}

const USE_MOCK = true

export const authService = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    if (USE_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))
      if (credentials.email === 'clinician@example.com' && credentials.password === 'password') {
        return mockAuthResponse
      }
      throw new Error('Invalid credentials')
    }

    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
      apiClient.setToken(response.token)
      return response
    } catch (error) {
      throw error
    }
  },

  async logout(): Promise<void> {
    apiClient.clearToken()
    if (!USE_MOCK) {
      await apiClient.post('/auth/logout', {})
    }
  },

  async getCurrentUser(): Promise<User> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockUser
    }

    try {
      return await apiClient.get<User>('/auth/me')
    } catch (error) {
      throw error
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return { ...mockUser, ...updates }
    }

    try {
      return await apiClient.put<User>('/auth/profile', updates)
    } catch (error) {
      throw error
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return mockAuthResponse
    }

    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
      apiClient.setToken(response.token)
      return response
    } catch (error) {
      throw error
    }
  },
}
