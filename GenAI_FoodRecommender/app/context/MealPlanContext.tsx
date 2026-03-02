import React, { createContext, useState, useCallback, ReactNode } from 'react'
import { MealPlanContextType, MealPlan, MealPreferences } from '../types'
import { mealService } from '../services/mealService'

export const MealPlanContext = createContext<MealPlanContextType | undefined>(
  undefined,
)

const defaultPreferences: MealPreferences = {
  cuisines: ['Mediterranean', 'American'],
  budget: 'medium',
  allergies: [],
  restrictions: [],
  diabetesFriendly: true,
}

interface MealPlanProviderProps {
  children: ReactNode
}

export function MealPlanProvider({ children }: MealPlanProviderProps) {
  const [todaysPlan, setTodaysPlan] = useState<MealPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<MealPreferences>(
    defaultPreferences,
  )

  const fetchTodaysPlan = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const plan = await mealService.getTodaysMealPlan()
      setTodaysPlan(plan)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch meal plan'
      setError(message)
      console.error('Fetch meal plan error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const regeneratePlan = useCallback(async (newPreferences: MealPreferences) => {
    setIsLoading(true)
    setError(null)
    try {
      const plan = await mealService.regeneratePlan(newPreferences)
      setTodaysPlan(plan)
      setPreferences(newPreferences)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate meal plan'
      setError(message)
      console.error('Regenerate plan error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updatePreferences = useCallback((newPreferences: MealPreferences) => {
    setPreferences(newPreferences)
  }, [])

  const value: MealPlanContextType = {
    todaysPlan,
    isLoading,
    error,
    preferences,
    fetchTodaysPlan,
    regeneratePlan,
    updatePreferences,
  }

  return (
    <MealPlanContext.Provider value={value}>
      {children}
    </MealPlanContext.Provider>
  )
}
