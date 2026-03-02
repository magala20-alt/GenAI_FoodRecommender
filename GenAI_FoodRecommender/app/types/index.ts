// ============ Authentication ============
export interface AuthCredentials {
  email: string
  password: string
  userType?: 'patient' | 'doctor'
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: User
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: 'patient' | 'doctor'
  avatar?: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
}

export interface RegisterData extends AuthCredentials {
  firstName: string
  lastName: string
}

// ============ Meal Plans ============
export interface MealPlan {
  id: string
  date: string
  meals: Meal[]
  patientId: string
  createdAt: string
  updatedAt: string
  preferences?: MealPreferences
}

export interface Meal {
  id: string
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  cuisine: string
  calories: number
  carbs: number
  protein: number
  fat: number
  instructions: string[]
  image?: string
  budget: 'low' | 'medium' | 'high'
  nutritionScore: number
}

export interface MealPreferences {
  cuisines: string[]
  budget: 'low' | 'medium' | 'high'
  allergies: string[]
  restrictions: string[]
  diabetesFriendly: boolean
}

export interface MealPlanContextType {
  todaysPlan: MealPlan | null
  isLoading: boolean
  error: string | null
  preferences: MealPreferences
  fetchTodaysPlan: () => Promise<void>
  regeneratePlan: (preferences: MealPreferences) => Promise<void>
  updatePreferences: (preferences: MealPreferences) => void
}

// ============ Chat ============
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sourcePatientId?: string
}

export interface ChatStreamEvent {
  type: 'chunk' | 'complete' | 'error'
  data: string
  timestamp: string
}

export interface ChatContextType {
  messages: ChatMessage[]
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  clearChat: () => void
  getSuggestedPrompts: () => Promise<string[]>
}

// ============ Clinical Notes ============
export interface ClinicalNote {
  id: string
  patientId: string
  doctorId: string
  content: string
  type: 'intervention' | 'observation' | 'recommendation'
  createdAt: string
  read: boolean
}

export interface DoctorNote extends ClinicalNote {
  doctorName: string
  doctorAvatar?: string
}

// ============ API Error ============
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// ============ Loading State ============
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// ============ Pagination ============
export interface PaginationParams {
  page: number
  limit: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
