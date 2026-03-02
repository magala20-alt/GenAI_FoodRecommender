import { MealPlan, Meal, User, ChatMessage, DoctorNote } from '../types'

export const mockUser: User = {
  id: '1',
  email: 'patient@example.com',
  firstName: 'Sarah',
  lastName: 'Johnson',
  userType: 'patient',
  avatar: 'https://i.pravatar.cc/150?img=1',
}

export const mockMeals: Meal[] = [
  {
    id: '1',
    type: 'breakfast',
    name: 'Oatmeal with Berries',
    cuisine: 'American',
    calories: 350,
    carbs: 55,
    protein: 10,
    fat: 8,
    instructions: ['Cook oatmeal', 'Top with berries', 'Add honey'],
    budget: 'low',
    nutritionScore: 8.5,
  },
  {
    id: '2',
    type: 'lunch',
    name: 'Grilled Chicken Salad',
    cuisine: 'Mediterranean',
    calories: 420,
    carbs: 20,
    protein: 40,
    fat: 15,
    instructions: ['Grill chicken', 'Prepare salad', 'Drizzle olive oil'],
    budget: 'medium',
    nutritionScore: 9.0,
  },
  {
    id: '3',
    type: 'dinner',
    name: 'Baked Salmon with Vegetables',
    cuisine: 'European',
    calories: 480,
    carbs: 35,
    protein: 45,
    fat: 18,
    instructions: ['Preheat oven', 'Season salmon', 'Bake at 400F for 20 mins'],
    budget: 'high',
    nutritionScore: 9.2,
  },
  {
    id: '4',
    type: 'snack',
    name: 'Greek Yogurt with Almonds',
    cuisine: 'Mediterranean',
    calories: 180,
    carbs: 15,
    protein: 18,
    fat: 8,
    instructions: ['Serve yogurt', 'Top with almonds'],
    budget: 'medium',
    nutritionScore: 8.8,
  },
]

export const mockMealPlan: MealPlan = {
  id: '1',
  date: new Date().toISOString().split('T')[0],
  meals: mockMeals,
  patientId: '1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  preferences: {
    cuisines: ['Mediterranean', 'American', 'European'],
    budget: 'medium',
    allergies: [],
    restrictions: ['no gluten'],
    diabetesFriendly: true,
  },
}

export const mockChatMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello Sarah! 👋 I\'m your AI nutrition assistant. I\'m here to help you with meal recommendations, answer questions about nutrition, and support your diabetes management journey.',
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: '2',
    role: 'user',
    content: 'Hi! Can you suggest a low-budget lunch for today?',
    timestamp: new Date(Date.now() - 45000).toISOString(),
  },
  {
    id: '3',
    role: 'assistant',
    content: 'Absolutely! Here are some affordable, diabetes-friendly lunch options:\n\n1. **Lentil Soup** - High in fiber, affordable, and great for blood sugar control\n2. **Brown Rice & Beans** - Complete protein, very budget-friendly\n3. **Vegetable Stir-fry** - Seasonal vegetables are often on sale\n\nWould you like recipes for any of these?',
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
]

export const mockDoctorNote: DoctorNote = {
  id: '1',
  patientId: '1',
  doctorId: 'doc1',
  doctorName: 'Dr. John Smith',
  doctorAvatar: 'https://i.pravatar.cc/150?img=10',
  content: 'Keep up the great work with your meal plans! Your recent glucose readings show good improvement. Continue the Mediterranean diet emphasis.',
  type: 'recommendation',
  createdAt: new Date().toISOString(),
  read: false,
}

// Mock auth response
export const mockAuthResponse = {
  token: 'mock_jwt_token_' + Date.now(),
  refreshToken: 'mock_refresh_token_' + Date.now(),
  user: mockUser,
}
