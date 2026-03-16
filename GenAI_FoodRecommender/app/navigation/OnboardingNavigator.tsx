import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { OnboardingSetupScreen } from '../screens/auth/OnboardingSetupScreen'

const Stack = createNativeStackNavigator()

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingSetup" component={OnboardingSetupScreen} />
    </Stack.Navigator>
  )
}