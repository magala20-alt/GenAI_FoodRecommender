import { apiClient } from './apiClient'

export interface InterventionMessage {
  id: string
  patientId: string
  clinicianId?: string | null
  clinicianName?: string | null
  message: string
  createdAt: string
}

interface LatestInterventionMessageResponse {
  hasMessage: boolean
  message: InterventionMessage | null
}

export const interventionService = {
  async getLatestForPatient(patientId: string): Promise<InterventionMessage | null> {
    const result = await apiClient.get<LatestInterventionMessageResponse>(
      `/patients/${encodeURIComponent(patientId)}/intervention-message/latest`,
    )

    if (!result?.hasMessage || !result.message) {
      return null
    }

    return result.message
  },
}
