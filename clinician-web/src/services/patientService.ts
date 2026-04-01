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
  adherence: number | null
  alerts: string | null
  onboardedDate: string | null
  calorieTarget: number | null
  primaryGoal: string | null
  budgetPreference: string | null
  country: string | null
  weightKg: number | null
  heightCm: number | null
  bpSystolic: number | null
  bpDiastolic: number | null
  heartRate: number | null
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

  async getPatientProfileForClinician(patientId: string): Promise<ClinicianPatientProfile> {
    return apiClient.get<ClinicianPatientProfile>(`/patients/${patientId}`)
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
}
