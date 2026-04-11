import { apiClient, API_BASE_URL } from './apiClient'
import { AuthCredentials, AuthResponse, User } from '../types'

interface BackendUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'clinician' | 'admin' | 'patient'
  mustChangePassword?: boolean
  specialty?: string
  licenseNumber?: string
  hospitalId?: string
}

interface BackendAuthResponse {
  token: string
  refreshToken: string
  user: BackendUser
}

const mapUser = (user: BackendUser): User => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role === 'admin' ? 'admin' : 'clinician',
  mustChangePassword: user.mustChangePassword,
  specialty: user.specialty,
  licenseNumber: user.licenseNumber,
  hospitalId: user.hospitalId,
})

const mapAuthResponse = (response: BackendAuthResponse): AuthResponse => ({
  token: response.token,
  refreshToken: response.refreshToken,
  user: mapUser(response.user),
})

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: unknown } }).response
    const data = response?.data as { detail?: unknown; message?: unknown } | undefined

    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail
    }

    if (Array.isArray(data?.detail)) {
      const messages = data.detail
        .map(item => {
          if (typeof item === 'string') {
            return item
          }

          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg?: unknown }).msg || '')
          }

          return ''
        })
        .filter(Boolean)

      if (messages.length > 0) {
        return messages.join('. ')
      }
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message || '')
    if (message.toLowerCase().includes('network error')) {
      return `Cannot reach backend at ${API_BASE_URL}. Confirm backend is running and CORS allows this origin.`
    }
  }

  return error instanceof Error ? error.message : 'Request failed'
}

export const authService = {
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<BackendAuthResponse>('/auth/login', credentials)
      apiClient.setToken(response.token)
      return mapAuthResponse(response)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async logout(): Promise<void> {
    apiClient.clearToken()
    try {
      await apiClient.post('/auth/logout', {})
    } catch {
      // Ignore logout failures once local state is cleared.
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const user = await apiClient.get<BackendUser>('/auth/me')
      return mapUser(user)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const user = await apiClient.put<BackendUser>('/auth/profile', updates)
      return mapUser(user)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<BackendAuthResponse>('/auth/refresh', { refreshToken })
      apiClient.setToken(response.token)
      return mapAuthResponse(response)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<User> {
    try {
      const user = await apiClient.post<BackendUser>('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      return mapUser(user)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async requestPasswordReset(email: string): Promise<{ detail: string }> {
    try {
      return await apiClient.post<{ detail: string }>('/auth/forgot-password', { email })
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async verifyPasswordResetToken(token: string): Promise<{ valid: boolean }> {
    try {
      return await apiClient.get<{ valid: boolean }>(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`)
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ detail: string }> {
    try {
      return await apiClient.post<{ detail: string }>('/auth/reset-password', {
        token,
        newPassword,
      })
    } catch (error) {
      throw new Error(getErrorMessage(error))
    }
  },
}
