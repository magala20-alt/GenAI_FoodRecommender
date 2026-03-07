import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/auth/LoginScreen'
import { OnboardingSetupScreen } from '../screens/auth/OnboardingSetupScreen'

const Stack = createNativeStackNavigator()

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          cardStyle: { backgroundColor: '#fff' },
        }}
      />
      <Stack.Screen
        name="OnboardingSetup"
        component={OnboardingSetupScreen}
        options={{
          cardStyle: { backgroundColor: '#FAFAF9' },
        }}
      />
    </Stack.Navigator>
  )
}
