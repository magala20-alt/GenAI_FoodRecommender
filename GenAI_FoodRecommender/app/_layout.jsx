import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { AuthProvider } from './context/AuthContext'
import { MealPlanProvider } from './context/MealPlanContext'
import { ChatProvider } from './context/ChatContext'
import { RootNavigator } from './navigation'
import { Colors } from './constants/theme'

const RootLayout = () => {
  return (
    <AuthProvider>
      <MealPlanProvider>
        <ChatProvider>
          <RootNavigator />
        </ChatProvider>
      </MealPlanProvider>
    </AuthProvider>
  )
}

export default RootLayout
