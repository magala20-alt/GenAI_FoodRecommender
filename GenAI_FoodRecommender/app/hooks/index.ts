import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'
import { MealPlanContext } from '../context/MealPlanContext'
import { ChatContext } from '../context/ChatContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const useMealPlan = () => {
  const context = useContext(MealPlanContext)
  if (context === undefined) {
    throw new Error('useMealPlan must be used within MealPlanProvider')
  }
  return context
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
