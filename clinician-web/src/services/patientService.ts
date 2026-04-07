import { apiClient } from './apiClient'
import { Patient, PatientMealPlan, PatientGlucoseReading, Intervention, AISummary } from '../types'

export interface ClinicianPatientListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  age: number | null
  riskLevel: 'High' | 'Medium' | 'Low' | null
  adherence: number | null
  alerts: string | null
  alertsCount: number
}

export interface AIPatientFilterResult {
  query: string
  filtersApplied: string[]
  reasoning: string
  matchingPatientIds: string[]
  matchedPatients: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    riskLevel: 'High' | 'Medium' | 'Low' | null
    adherence: number | null
    alertsCount: number
  }>
  patientsSearched: number
}

// this links used to link to the database schema
export interface ClinicianPatientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  age: number | null
  gender: string | null
  riskLevel: 'High' | 'Medium' | 'Low' | null
  riskScore: number | null
  adherence: number | null
  alerts: string | null
  mealsLogged: number | null
  streak: number | null
  sessions7d: number | null
  missedAppointments: number | null
  onboardedDate: string | null
  calorieTarget: number | null
  primaryGoal: string | null
  budgetPreference: string | null
  country: string | null
  weightKg: number | null
  heightCm: number | null
  targetWeightKg: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  heartRate: number | null
  bmi: number | null
  glucose: number | null
  cholesterolTotal: number | null
  hdlCholesterol: number | null
  ldlCholesterol: number | null
  triglycerides: number | null
  phoneNumber: string | null
  emergencyContactFullName: string | null
  emergencyContactRelationship: string | null
  emergencyContactPhone: string | null
  cuisinePreferences: string[]
  dietaryRestrictions: string[]
  prescribedMedications: string[]
  dailySteps: number | null
  targetHba1c: number | null
}

export interface CarePlanUpdatePayload {
  prescribedMedications?: string[]
  dietaryRestrictions?: string[]
  cuisinePreferences?: string[]
  calorieTarget?: number | null
  targetWeightKg?: number | null
  dailySteps?: number | null
  targetHba1c?: number | null
}

export interface InterventionMessageResponse {
  status: string
  detail: string
}

export interface PatientAlert {
  id: string
  patientId: string
  patientName: string
  alertType: string
  severity: 'High' | 'Medium' | 'Low' | string
  message: string
  llmReason: string | null
  riskScoreSnapshot: number | null
  status: 'Open' | 'Dismissed' | string
  createdAt: string
}

export interface AlertsSummary {
  openCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface ScheduleMeeting {
  id: string
  time: string
  period: 'AM' | 'PM' | string
  title: string
  detail: string
  borderTone: 'high' | 'medium' | 'low' | string
  badgeLabel: string | null
  badgeTone: 'now' | 'soon' | 'neutral' | string | null
}

export interface ScheduleTodo {
  id: string
  label: string
  done: boolean
  badgeLabel: string | null
  badgeTone: 'urgent' | 'today' | string | null
}

export interface ScheduleAppointmentRead {
  id: string
  patientId: string
  patientName: string
  scheduledAt: string
  title: string
  detail: string
  period: 'AM' | 'PM' | string
  dateLabel: string
}

export interface PatientAISummary {
  id: string
  patientId: string
  patientName: string
  clinicianId: string
  riskScore: number | null
  riskLevel: 'High' | 'Medium' | 'Low'
  generatedAt: string
  summaryText: string
  suggestedActions: string[]
}

export interface AISummariesRegenerateResponse {
  generatedCount: number
}

export interface ScheduleTodayResponse {
  dateLabel: string
  meetings: ScheduleMeeting[]
  todos: ScheduleTodo[]
}

export interface ScheduleAppointmentCreatePayload {
  patientId: string
  scheduledAt: string
  title: string
  detail?: string
}

export interface ScheduleTaskCreatePayload {
  description: string
  taskType?: string
  clinicianId?: string
}

export interface PatientMealLogItem {
  id: string
  mealName: string | null
  mealType: string | null
  cuisine: string | null
  calories: number | null
  budget: string | null
  loggedAt: string | null
  method: string | null
}

export interface PatientMealsSummary {
  consumedKcalToday: number | null
  calorieTarget: number | null
  remainingKcalToday: number | null
  mealsLogged: number
}

export interface PatientMealsResponse {
  summary: PatientMealsSummary
  logs: PatientMealLogItem[]
}

export interface PatientHealthReading {
  timestamp: string
  bmi: number | null
  systolicBp: number | null
  diastolicBp: number | null
  heartRate: number | null
  glucose: number | null
  cholesterolTotal: number | null
  hdlCholesterol: number | null
  ldlCholesterol: number | null
  triglycerides: number | null
}

export interface BloodWorkEntryPayload {
  timestamp?: string
  cholesterolTotal?: number | null
  hdlCholesterol?: number | null
  ldlCholesterol?: number | null
  triglycerides?: number | null
  glucose?: number | null
}

export interface BloodWorkSnapshotPayload {
  extractedText?: string
  imageDataUrl?: string
  fileName?: string
}

export interface BloodWorkSnapshotResponse {
  cholesterolTotal: number | null
  hdlCholesterol: number | null
  ldlCholesterol: number | null
  triglycerides: number | null
  glucose: number | null
  notes: string | null
}

// Mock data
const mockPatients: Patient[] = [
  {
    id: 'p1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0101',
    dateOfBirth: '1985-06-15',
    diabetesType: 'type2',
    assignedClinicianId: '1',
    lastReviewDate: '2024-02-20',
    status: 'active',
    riskLevel: 'medium',
    adherenceScore: 85,
  },
  {
    id: 'p2',
    firstName: 'Emma',
    lastName: 'Johnson',
    email: 'emma.j@example.com',
    phone: '+1-555-0102',
    dateOfBirth: '1992-03-22',
    diabetesType: 'type1',
    assignedClinicianId: '1',
    lastReviewDate: '2024-02-18',
    status: 'active',
    riskLevel: 'high',
    adherenceScore: 78,
  },
  {
    id: 'p3',
    firstName: 'Michael',
    lastName: 'Smith',
    email: 'michael.smith@example.com',
    phone: '+1-555-0103',
    dateOfBirth: '1978-11-30',
    diabetesType: 'type2',
    assignedClinicianId: '1',
    lastReviewDate: '2024-02-15',
    status: 'active',
    riskLevel: 'low',
    adherenceScore: 95,
  },
]

const mockMealPlans: Record<string, PatientMealPlan[]> = {
  p1: [
    {
      id: 'mp1',
      patientId: 'p1',
      date: '2024-02-26',
      meals: [
        { id: 'm1', name: 'Oatmeal with Berries', cuisine: 'American', calories: 280, carbs: 45, protein: 8, fat: 5, mealType: 'breakfast' },
        { id: 'm2', name: 'Grilled Chicken Salad', cuisine: 'Mediterranean', calories: 380, carbs: 25, protein: 35, fat: 12, mealType: 'lunch' },
        { id: 'm3', name: 'Salmon with Vegetables', cuisine: 'European', calories: 420, carbs: 20, protein: 38, fat: 18, mealType: 'dinner' },
      ],
      recommendedCalories: 1800,
      actualCalories: 1080,
      adherenceScore: 92,
      notes: 'Good adherence today',
    },
  ],
}

const mockGlucoseReadings: Record<string, PatientGlucoseReading[]> = {
  p1: [
    { id: 'gr1', patientId: 'p1', timestamp: '2024-02-26T08:00:00Z', reading: 145, notes: 'Fasting' },
    { id: 'gr2', patientId: 'p1', timestamp: '2024-02-26T12:30:00Z', reading: 168, notes: 'Post-lunch' },
    { id: 'gr3', patientId: 'p1', timestamp: '2024-02-26T18:00:00Z', reading: 152, notes: 'Pre-dinner' },
  ],
}

const mockInterventions: Record<string, Intervention[]> = {
  p1: [
    {
      id: 'int1',
      patientId: 'p1',
      clinicianId: '1',
      type: 'dietary',
      title: 'Reduce Carb Intake',
      description: 'Reduce daily carbohydrate intake to under 150g',
      createdAt: '2024-02-15T10:00:00Z',
      targetDate: '2024-03-15',
      status: 'in_progress',
      notes: 'Patient is progressing well',
    },
  ],
}

const USE_MOCK = false

export const patientService = {
  async getPatientListForClinician(): Promise<ClinicianPatientListItem[]> {
    return apiClient.get<ClinicianPatientListItem[]>('/patients')
  },

  async filterPatientsWithAI(query: string): Promise<AIPatientFilterResult> {
    return apiClient.post<AIPatientFilterResult>('/patient-rag/clinician/filter-patients', { query })
  },

  async getPatientProfileForClinician(patientId: string): Promise<ClinicianPatientProfile> {
    return apiClient.get<ClinicianPatientProfile>(`/patients/${patientId}`)
  },

  async getPatientHealthReadings(patientId: string, days = 60): Promise<PatientHealthReading[]> {
    return apiClient.get<PatientHealthReading[]>(`/patients/${patientId}/health-readings?days=${days}`)
  },

  async addPatientHealthReading(patientId: string, payload: BloodWorkEntryPayload): Promise<PatientHealthReading> {
    return apiClient.post<PatientHealthReading>(`/patients/${patientId}/health-readings`, payload)
  },

  async extractBloodworkSnapshot(
    patientId: string,
    payload: BloodWorkSnapshotPayload,
  ): Promise<BloodWorkSnapshotResponse> {
    return apiClient.post<BloodWorkSnapshotResponse>(`/patients/${patientId}/health-readings/extract-snapshot`, payload)
  },

  async getPatientMeals(patientId: string): Promise<PatientMealsResponse> {
    return apiClient.get<PatientMealsResponse>(`/patients/${patientId}/meals`)
  },

  async updatePatientCarePlan(patientId: string, payload: CarePlanUpdatePayload): Promise<ClinicianPatientProfile> {
    return apiClient.put<ClinicianPatientProfile>(`/patients/${patientId}/care-plan`, payload)
  },

  async sendInterventionMessage(patientId: string, message: string): Promise<InterventionMessageResponse> {
    return apiClient.post<InterventionMessageResponse>(`/patients/${patientId}/intervention-message`, { message })
  },

  async getPatientAlerts(patientId: string): Promise<PatientAlert[]> {
    return apiClient.get<PatientAlert[]>(`/patients/alerts/patient/${patientId}`)
  },

  async getAlerts(patientId?: string): Promise<PatientAlert[]> {
    const query = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : ''
    return apiClient.get<PatientAlert[]>(`/patients/alerts/all${query}`)
  },

  async getAlertsSummary(): Promise<AlertsSummary> {
    return apiClient.get<AlertsSummary>(`/patients/alerts/summary`)
  },

  async dismissAlert(alertId: number | string): Promise<PatientAlert> {
    return apiClient.post<PatientAlert>(`/patients/alerts/${alertId}/dismiss`)
  },

  async approveRescheduleRequest(alertId: number | string): Promise<PatientAlert> {
    return apiClient.post<PatientAlert>(`/patients/alerts/${alertId}/reschedule/approve`)
  },

  async disapproveRescheduleRequest(alertId: number | string): Promise<PatientAlert> {
    return apiClient.post<PatientAlert>(`/patients/alerts/${alertId}/reschedule/disapprove`)
  },

  async getScheduleToday(): Promise<ScheduleTodayResponse> {
    return apiClient.get<ScheduleTodayResponse>(`/patients/schedule/today`)
  },

  async getScheduleAppointments(): Promise<ScheduleAppointmentRead[]> {
    return apiClient.get<ScheduleAppointmentRead[]>(`/patients/schedule/appointments`)
  },

  async createScheduleAppointment(payload: ScheduleAppointmentCreatePayload): Promise<ScheduleMeeting> {
    return apiClient.post<ScheduleMeeting>('/patients/schedule/appointments', payload)
  },

  async createScheduleTask(payload: ScheduleTaskCreatePayload): Promise<ScheduleTodo> {
    return apiClient.post<ScheduleTodo>('/patients/schedule/tasks', payload)
  },

  async getPatients(): Promise<Patient[]> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return mockPatients
    }

    try {
      return await apiClient.get<Patient[]>('/patients')
    } catch (error) {
      throw error
    }
  },

  async getPatient(patientId: string): Promise<Patient> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      const patient = mockPatients.find(p => p.id === patientId)
      if (!patient) throw new Error('Patient not found')
      return patient
    }

    try {
      return await apiClient.get<Patient>(`/patients/${patientId}`)
    } catch (error) {
      throw error
    }
  },

  async getPatientMealPlans(patientId: string): Promise<PatientMealPlan[]> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return mockMealPlans[patientId] || []
    }

    try {
      return await apiClient.get<PatientMealPlan[]>(`/patients/${patientId}/meal-plans`)
    } catch (error) {
      throw error
    }
  },

  async getPatientGlucoseReadings(patientId: string): Promise<PatientGlucoseReading[]> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return mockGlucoseReadings[patientId] || []
    }

    try {
      return await apiClient.get<PatientGlucoseReading[]>(`/patients/${patientId}/glucose-readings`)
    } catch (error) {
      throw error
    }
  },

  async getPatientInterventions(patientId: string): Promise<Intervention[]> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400))
      return mockInterventions[patientId] || []
    }

    try {
      return await apiClient.get<Intervention[]>(`/patients/${patientId}/interventions`)
    } catch (error) {
      throw error
    }
  },

  async createIntervention(intervention: Omit<Intervention, 'id' | 'createdAt'>): Promise<Intervention> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        ...intervention,
        id: `int${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
    }

    try {
      return await apiClient.post<Intervention>(`/interventions`, intervention)
    } catch (error) {
      throw error
    }
  },

  async updateInterventionStatus(interventionId: string, status: Intervention['status']): Promise<void> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return
    }

    try {
      await apiClient.patch(`/interventions/${interventionId}`, { status })
    } catch (error) {
      throw error
    }
  },

  async getAISummary(patientId: string): Promise<AISummary> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        id: `summary-${patientId}`,
        patientId,
        clinicianId: '1',
        generatedAt: new Date().toISOString(),
        content: 'Patient shows good meal adherence with 92% compliance. Recent glucose readings are within target range. Continue current dietary plan.',
        keyFindings: [
          'Good meal plan adherence',
          'Stable glucose levels',
          'Consistent exercise patterns',
        ],
        recommendedActions: [
          'Maintain current meal plan',
          'Continue weekly glucose monitoring',
          'Follow-up in 2 weeks',
        ],
        riskAssessment: 'Low risk - patient is well-controlled',
      }
    }

    try {
      return await apiClient.get<AISummary>(`/patients/${patientId}/ai-summary`)
    } catch (error) {
      throw error
    }
  },

  async getAISummaries(): Promise<PatientAISummary[]> {
    return apiClient.get<PatientAISummary[]>(`/patients/summaries/ai`)
  },

  async regenerateAISummaries(): Promise<AISummariesRegenerateResponse> {
    return apiClient.post<AISummariesRegenerateResponse>(`/patients/summaries/ai/regenerate`)
  },

  async regeneratePatientAISummary(patientId: string): Promise<PatientAISummary> {
    return apiClient.post<PatientAISummary>(`/patients/${patientId}/ai-summary/regenerate`)
  },

  async getPatientAISummary(patientId: string): Promise<PatientAISummary> {
    try {
      return await apiClient.get<PatientAISummary>(`/patients/${patientId}/ai-summary`)
    } catch (error) {
      throw error
    }
  },
}
