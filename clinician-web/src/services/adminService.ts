import { apiClient } from './apiClient'

interface CreateDoctorAccountRequest {
  firstName: string
  lastName: string
  email: string
  temporaryPassword?: string
}

interface CreateDoctorAccountResponse {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    onboardingCompleted: boolean
    mustChangePassword: boolean
  }
  temporaryPassword: string
}

export const adminService = {
  async createDoctorAccount(payload: CreateDoctorAccountRequest): Promise<CreateDoctorAccountResponse> {
    return apiClient.post<CreateDoctorAccountResponse>('/auth/admin/clinicians', payload)
  },
}
