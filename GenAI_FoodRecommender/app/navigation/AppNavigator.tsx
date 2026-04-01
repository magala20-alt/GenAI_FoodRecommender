import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DashboardScreen } from '../screens/dashboard/DashboardScreen'
import { DiaryScreen } from '../screens/diary/DiaryScreen'
import { ProgressScreen } from '../screens/progress/ProgressScreen'
import { AIChatScreen } from '../screens/chat/AIChatScreen'
import { SettingsScreen } from '../screens/settings/SettingsScreen'
import { Colors, Spacing, Typography, scale } from '../constants/theme'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
  </Stack.Navigator>
)

// Diary Stack
const DiaryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DiaryMain" component={DiaryScreen} />
  </Stack.Navigator>
)

// Progress Stack
const ProgressStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProgressMain" component={ProgressScreen} />
  </Stack.Navigator>
)

// Chat Stack
const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatMain" component={AIChatScreen} />
  </Stack.Navigator>
)

// Settings Stack
const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
  </Stack.Navigator>
)

// Tab Badge Icon Component
const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={{ fontSize: Typography.sizes.h3 }}>{emoji}</Text>
)

// Main Tab Navigator
const TabNavigator = () => {
  const insets = useSafeAreaInsets()

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
          paddingTop: Spacing.xs,
          paddingBottom: Math.max(insets.bottom, Spacing.xs),
          height: scale(58) + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: Typography.sizes.caption,
          fontWeight: '600',
          marginTop: -Spacing.xs,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="Diary"
        component={DiaryStack}
        options={{
          tabBarLabel: 'Diary',
          tabBarIcon: () => <TabIcon emoji="📔" />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressStack}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: () => <TabIcon emoji="📊" />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStack}
        options={{
          tabBarLabel: 'AI Chat',
          tabBarIcon: () => <TabIcon emoji="💬" />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <TabIcon emoji="⚙️" />,
        }}
      />
    </Tab.Navigator>
  )
}

export const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={TabNavigator} />
  </Stack.Navigator>
)
