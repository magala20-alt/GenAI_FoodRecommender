import { apiClient } from './apiClient'

export type MealInputMode = 'photo' | 'voice' | 'manual'

export interface MealSnapshotExtractRequest {
  inputMode: MealInputMode
  imageDataUrl?: string
  transcript?: string
  mealDescription?: string
  mealType?: string
}

export interface MealSnapshotExtractResponse {
  mealName: string
  estimatedCalories: number
  confidence: number
  reasoning: string
  tags: string[]
  suggestedMealType?: string
}

export interface MealLogCreateRequest {
  mealName: string
  calories: number
  mealType?: string
  source?: string
  confidence?: number
  notes?: string
  consumedAt?: string
}

export interface MealLogItem {
  id: string
  mealName: string
  calories: number
  mealType?: string
  source?: string
  confidence?: number
  notes?: string
  consumedAt: string
}

export interface VitalLogCreateRequest {
  glucose?: number
  bmi?: number
  systolicBp?: number
  diastolicBp?: number
  heartRate?: number
  timestamp?: string
}

export interface VitalLogItem {
  id: string
  timestamp: string
  glucose?: number
  bmi?: number
  systolicBp?: number
  diastolicBp?: number
  heartRate?: number
}

interface MealLogCreateResponse {
  status: string
  item: MealLogItem
}

interface MealLogHistoryResponse {
  items: MealLogItem[]
}

interface VitalLogCreateResponse {
  status: string
  item: VitalLogItem
}

interface VitalLogHistoryResponse {
  items: VitalLogItem[]
}

export const mealLoggerService = {
  async extractSnapshot(payload: MealSnapshotExtractRequest): Promise<MealSnapshotExtractResponse> {
    return apiClient.post<MealSnapshotExtractResponse>('/patient-rag/meal-log/extract', payload)
  },

  async saveMealLog(payload: MealLogCreateRequest): Promise<MealLogItem> {
    const result = await apiClient.post<MealLogCreateResponse>('/patient-rag/meal-log', payload)
    return result.item
  },

  async getHistory(): Promise<MealLogItem[]> {
    const result = await apiClient.get<MealLogHistoryResponse | undefined>('/patient-rag/meal-log/history')
    return result?.items || []
  },

  async saveVitalsLog(payload: VitalLogCreateRequest): Promise<VitalLogItem> {
    const result = await apiClient.post<VitalLogCreateResponse>('/patient-rag/vitals-log', payload)
    return result.item
  },

  async getVitalsHistory(): Promise<VitalLogItem[]> {
    const result = await apiClient.get<VitalLogHistoryResponse | undefined>('/patient-rag/vitals-log/history')
    return result?.items || []
  },
}
