import { MealPlan, MealPreferences } from '../types'
import { apiClient } from './apiClient'
import { mockMealPlan } from '../mocks'

const USE_MOCK = true // Set to false when backend is ready

export const mealService = {
  async getTodaysMealPlan(): Promise<MealPlan> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return mockMealPlan
    }

    return apiClient.get<MealPlan>('/meals/today')
  },

  async getMealPlan(date: string): Promise<MealPlan> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return { ...mockMealPlan, date }
    }

    return apiClient.get<MealPlan>(`/meals/${date}`)
  },

  async regeneratePlan(preferences: MealPreferences): Promise<MealPlan> {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Simulate regenerated plan with some variation
      const newPlan = { ...mockMealPlan }
      newPlan.meals = newPlan.meals.map(meal => ({
        ...meal,
        id: Math.random().toString(),
      }))
      return newPlan
    }

    return apiClient.post<MealPlan>('/meals/regenerate', { preferences })
  },

  async updateMealPreferences(preferences: MealPreferences): Promise<void> {
    if (USE_MOCK) {
      return
    }

    await apiClient.put('/meals/preferences', preferences)
  },

  async getMealPreferences(): Promise<MealPreferences> {
    if (USE_MOCK) {
      return mockMealPlan.preferences || {
        cuisines: [],
        budget: 'medium',
        allergies: [],
        restrictions: [],
        diabetesFriendly: true,
      }
    }

    return apiClient.get<MealPreferences>('/meals/preferences')
  },

  async rateMeal(mealId: string, rating: number): Promise<void> {
    if (USE_MOCK) {
      return
    }

    await apiClient.post(`/meals/${mealId}/rate`, { rating })
  },

  async saveMeal(mealId: string): Promise<void> {
    if (USE_MOCK) {
      return
    }

    await apiClient.post(`/meals/${mealId}/save`, {})
  },
}
