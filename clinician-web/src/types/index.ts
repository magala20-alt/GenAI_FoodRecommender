// ============ Auth Types ============
export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'clinician' | 'admin'
  specialty?: string
  licenseNumber?: string
  hospitalId?: string
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  logout: () => void
}

// ============ Patient Types ============
export interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  diabetesType: 'type1' | 'type2' | 'gestational'
  assignedClinicianId: string
  lastReviewDate?: string
  status: 'active' | 'inactive' | 'discharged'
  riskLevel: 'low' | 'medium' | 'high'
}

export interface PatientMealPlan {
  id: string
  patientId: string
  date: string
  meals: PatientMeal []
  recommendedCalories: number
  actualCalories?: number
  adherenceScore?: number
  notes?: string
}

export interface PatientMeal {
  id: string
  name: string
  cuisine: string
  calories: number
  carbs: number
  protein: number
  fat: number
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

export interface PatientGlucoseReading {
  id: string
  patientId: string
  timestamp: string
  reading: number // mg/dL
  notes?: string
}

// ============ AI Summary Types ============
export interface AISummary {
  id: string
  patientId: string
  clinicianId: string
  generatedAt: string
  content: string
  keyFindings: string[]
  recommendedActions: string[]
  riskAssessment: string
}

export interface MealAdherenceAnalysis {
  patientId: string
  period: 'week' | 'month'
  adherencePercentage: number
  trends: string[]
  recommendations: string[]
}

// ============ Intervention Types ============
export interface Intervention {
  id: string
  patientId: string
  clinicianId: string
  type: 'dietary' | 'lifestyle' | 'medication' | 'monitoring'
  title: string
  description: string
  createdAt: string
  targetDate: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes?: string
  outcome?: string
}

export interface InterventionNote {
  id: string
  interventionId: string
  content: string
  createdAt: string
  createdBy: User
}

// ============ Clinical Notes ============
export interface PatientNote {
  id: string
  patientId: string
  clinicianId: string
  content: string
  timestamp: string
  type: 'observation' | 'recommendation' | 'follow_up'
}

// ============ Dashboard Types ============
export interface DashboardStats {
  totalPatients: number
  activePatients: number
  patientsWith HighRisk: number
  averageAdherence: number
  pendingInterventions: number
  thisWeekReviews: number
}

export interface PatientContextType {
  patients: Patient[]
  selectedPatient: Patient | null
  isLoading: boolean
  error: string | null
  fetchPatients: () => Promise<void>
  selectPatient: (patient: Patient) => void
  getPatientMealPlans: (patientId: string) => Promise<PatientMealPlan[]>
  getPatientGlucoseReadings: (patientId: string) => Promise<PatientGlucoseReading[]>
  getPatientInterventions: (patientId: string) => Promise<Intervention[]>
  createIntervention: (intervention: Omit<Intervention, 'id' | 'createdAt'>) => Promise<void>
  updateInterventionStatus: (interventionId: string, status: Intervention['status']) => Promise<void>
}
