import { AuthCredentials, AuthResponse, User, RegisterData } from '../types'
import { apiClient } from './apiClient'
import { mockAuthResponse, mockUser } from '../mocks'

const USE_MOCK = true // Set to false when backend is ready

export const authService = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Validate credentials
      if (credentials.email === 'patient@example.com' && credentials.password === 'password') {
        return { ...mockAuthResponse }
      }
      throw new Error('Invalid email or password')
    }

    return apiClient.post<AuthResponse>('/auth/login', credentials)
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 800))
      const newUser: User = {
        id: '2',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType || 'patient',
      }
      return {
        token: mockAuthResponse.token,
        refreshToken: mockAuthResponse.refreshToken,
        user: newUser,
      }
    }

    return apiClient.post<AuthResponse>('/auth/register', data)
  },

  async logout(): Promise<void> {
    if (USE_MOCK) {
      return
    }
    await apiClient.post('/auth/logout', {})
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    if (USE_MOCK) {
      return { ...mockAuthResponse }
    }
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
  },

  async getCurrentUser(): Promise<User> {
    if (USE_MOCK) {
      return mockUser
    }
    return apiClient.get<User>('/auth/me')
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (USE_MOCK) {
      return { ...mockUser, ...updates }
    }
    return apiClient.put<User>('/auth/profile', updates)
  },
}
