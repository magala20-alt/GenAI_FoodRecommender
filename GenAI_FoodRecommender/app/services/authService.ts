import { AuthCredentials, AuthResponse, User, RegisterData, OnboardingSetupData } from '../types'
import { apiClient } from './apiClient'

interface BackendUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'patient' | 'clinician' | 'admin'
  onboardingCompleted: boolean
}

interface BackendAuthResponse {
  token: string
  refreshToken: string
  user: BackendUser
}

const mapUser = (user: BackendUser): User => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  userType: user.role === 'patient' ? 'patient' : 'doctor',
  onboardingCompleted: user.onboardingCompleted,
})

const mapAuthResponse = (response: BackendAuthResponse): AuthResponse => ({
  token: response.token,
  refreshToken: response.refreshToken,
  user: mapUser(response.user),
})

export const authService = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/auth/login', credentials)
    apiClient.setToken(response.token)
    return mapAuthResponse(response)
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/auth/register', data)
    apiClient.setToken(response.token)
    return mapAuthResponse(response)
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {})
    } finally {
      apiClient.setToken(null)
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<BackendAuthResponse>('/auth/refresh', { refreshToken })
    apiClient.setToken(response.token)
    return mapAuthResponse(response)
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<BackendUser>('/auth/me')
    return mapUser(response)
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<BackendUser>('/auth/profile', updates)
    return mapUser(response)
  },

  async completeOnboarding(data: OnboardingSetupData): Promise<User> {
    const payload = {
      ...data,
      weight: Number(data.weight),
      height: Number(data.height),
      bpSystolic: Number(data.bpSystolic),
      bpDiastolic: Number(data.bpDiastolic),
      targetWeight: data.targetWeight ? Number(data.targetWeight) : null,
    }

    const response = await apiClient.post<BackendUser>('/onboarding/complete', payload)
    return mapUser(response)
  },

  async requestPasswordReset(email: string): Promise<{ detail: string }> {
    return apiClient.post<{ detail: string }>('/auth/forgot-password', { email })
  },

  async verifyPasswordResetToken(token: string): Promise<{ valid: boolean }> {
    return apiClient.get<{ valid: boolean }>(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`)
  },

  async resetPassword(token: string, newPassword: string): Promise<{ detail: string }> {
    return apiClient.post<{ detail: string }>('/auth/reset-password', { token, newPassword })
  },
}
