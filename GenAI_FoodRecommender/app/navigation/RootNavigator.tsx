import React from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { useAuth } from '../hooks'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'
import { OnboardingNavigator } from './OnboardingNavigator'
import { Colors } from '../constants/theme'

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? <AuthNavigator /> : requiresOnboarding ? <OnboardingNavigator /> : <AppNavigator />}
    </NavigationContainer>
  )
}
