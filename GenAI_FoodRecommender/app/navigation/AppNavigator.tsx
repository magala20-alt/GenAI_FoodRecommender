import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { MealPlanDashboard } from '../screens/dashboard/MealPlanDashboard'
import { AIChatScreen } from '../screens/chat/AIChatScreen'
import { Colors } from '../constants/theme'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Dashboard Stack
const DashboardStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="DashboardMain"
        component={MealPlanDashboard}
        options={{
          title: 'Dashboard',
        }}
      />
    </Stack.Navigator>
  )
}

// Chat Stack
const ChatStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ChatMain"
        component={AIChatScreen}
        options={{
          title: 'AI Chat',
        }}
      />
    </Stack.Navigator>
  )
}

// Main Tab Navigator
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.divider,
          borderTopWidth: 1,
          paddingBottom: 5,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Meals',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🍽️</Text>,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>💬</Text>,
        }}
      />
    </Tab.Navigator>
  )
}

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
      />
    </Stack.Navigator>
  )
}
