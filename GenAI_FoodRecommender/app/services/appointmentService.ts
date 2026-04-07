import { apiClient } from './apiClient'

export interface PatientAppointment {
  id: string
  patientId: string
  patientName?: string | null
  scheduledAt: string
  title: string
  detail: string
  period: string
  dateLabel: string
  rescheduleStatus?: 'pending' | 'approved' | 'rejected' | null
  rescheduleReason?: string | null
  rescheduleAlertId?: string | null
}

interface NextAppointmentResponse {
  hasAppointment: boolean
  appointment: PatientAppointment | null
}

interface AppointmentRescheduleResponse {
  status: string
  detail: string
  appointment: PatientAppointment | null
}

export const appointmentService = {
  async getNextAppointment(): Promise<PatientAppointment | null> {
    const result = await apiClient.get<NextAppointmentResponse>('/patients/schedule/next')
    return result.hasAppointment ? result.appointment : null
  },

  async requestReschedule(reason: string): Promise<PatientAppointment | null> {
    const result = await apiClient.post<AppointmentRescheduleResponse>('/patients/schedule/reschedule-request', { reason })
    return result.appointment
  },
}
