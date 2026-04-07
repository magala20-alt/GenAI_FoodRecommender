import { apiClient } from './apiClient'

interface OnboardingStatusResponse {
  onboardingCompleted: boolean
  completedAt: string | null
}

export interface OnboardingDetails {
  userId: string
  budgetPreference: string
  country: string | null
  weightKg: number | null
  heightCm: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  primaryGoal: string
  targetWeightKg: number | null
  cuisinePreferences: string[]
  calorieTarget: number | null
  completedAt?: string | null
  updatedAt: string
}

export interface OnboardingDetailsUpdatePayload {
  budgetPreference?: string
  country?: string
  weightKg?: number
  heightCm?: number
  bpSystolic?: number
  bpDiastolic?: number
  primaryGoal?: string
  targetWeightKg?: number
  calorieTarget?: number
  cuisinePreferences?: string[]
  dailyStepGoal?: number
}

export const onboardingService = {
  async getStatus(): Promise<OnboardingStatusResponse> {
    return apiClient.get<OnboardingStatusResponse>('/onboarding/me')
  },

  async getDetails(): Promise<OnboardingDetails> {
    return apiClient.get<OnboardingDetails>('/onboarding/me/details')
  },

  async updateDetails(payload: OnboardingDetailsUpdatePayload): Promise<OnboardingDetails> {
    return apiClient.put<OnboardingDetails>('/onboarding/me/details', payload)
  },
}
