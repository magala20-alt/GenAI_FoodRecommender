import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme'
import { useAuth, useMealPlan } from '../../hooks'
import { Button } from '../../components/atoms'
import { MealCard } from '../../components/molecules'
import { formatDate, getGreeting } from '../../utils'

export function DashboardScreen() {
  const { user } = useAuth()
  const { todaysPlan, isLoading, error, fetchTodaysPlan, regeneratePlan } = useMealPlan()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    fetchTodaysPlan()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchTodaysPlan()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await regeneratePlan()
    } finally {
      setIsRegenerating(false)
    }
  }

  const todaysCalories = todaysPlan?.meals.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0
  const mealsCount = todaysPlan?.meals.length || 0
  const dailyStats = [
    { label: 'Calories', value: `${todaysCalories}`, target: '1,650 kcal', color: Colors.primary },
    { label: 'Meals', value: `${mealsCount}`, target: '3-4 meals', color: Colors.secondary },
    { label: 'Steps', value: '6,240', target: 'Daily goal 10K', color: Colors.success },
    { label: 'BP', value: '128/82', target: 'Normal', color: Colors.darkGray },
  ]

  const mealsByType = todaysPlan?.meals.reduce(
    (acc, meal) => {
      const type = meal.type || 'breakfast'
      if (!acc[type]) acc[type] = []
      acc[type].push(meal)
      return acc
    },
    {} as Record<string, any[]>,
  ) || {}

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
    >
      {/* Greeting Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Good morning 👋 {user?.firstName}
          </Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>5-day</Text>
        </View>
      </View>

      {/* Doctor's Note Banner (if any intervention) */}
      <View style={styles.doctorNoteBanner}>
        <Text style={styles.doctorIcon}>👨‍⚕️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.doctorTitle}>Dr. Johnson • Just now</Text>
          <Text style={styles.doctorMessage}>
            "Great progress this week Sarah! Try to add more vegetables to your lunch. Let's check in on Friday."
          </Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.dismissIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Summary Statistics */}
      <View style={styles.statsContainer}>
        {dailyStats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statTarget}>{stat.target}</Text>
          </View>
        ))}
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryLink}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's Meal Plan */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Meal Plan</Text>
          <TouchableOpacity onPress={handleRegenerate} disabled={isRegenerating}>
            <Text style={styles.regenerateButton}>
              {isRegenerating ? '⟳ Generating...' : '⟳ Regenerate'}
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.skeleton}>
            <View style={styles.skeletonBar} />
            <View style={styles.skeletonBar} />
          </View>
        ) : mealsCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No meals planned yet</Text>
            <Button
              label="Generate Meal Plan"
              onPress={handleRegenerate}
              size="small"
            />
          </View>
        ) : (
          ['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
            const meals = mealsByType[mealType] || []
            if (meals.length === 0) return null

            return (
              <View key={mealType}>
                <Text style={styles.mealTypeHeader}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                {meals.map((meal, idx) => (
                  <MealCard key={idx} meal={meal} />
                ))}
              </View>
            )
          })
        )}
      </View>

      {/* Encouragement Message */}
      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementIcon}>🌱</Text>
        <Text style={styles.encouragementText}>
          You're doing great! Keep up your 5-day streak by logging all meals today.
        </Text>
      </View>

      {/* Upcoming Appointment (if any) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Appointment</Text>
        <View style={styles.appointmentCard}>
          <Text style={styles.appointmentDate}>📅 March 15, 2026</Text>
          <Text style={styles.appointmentTime}>🕐 3:00 PM - Dr. Sarah Johnson</Text>
          <Button label="Reschedule" size="small" variant="outline" style={{ marginTop: Spacing.md }} />
        </View>
      </View>

      <View style={{ height: Spacing.xl }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  greeting: {
    fontSize: Typography.sizes.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  date: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
  },
  streakBadge: {
    backgroundColor: Colors.secondaryTint,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.circular,
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 20,
  },
  streakText: {
    fontSize: Typography.sizes.caption,
    fontWeight: 'bold',
    color: Colors.secondary,
  },

  doctorNoteBanner: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  doctorIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  doctorTitle: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  doctorMessage: {
    fontSize: Typography.sizes.body,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
  },
  dismissIcon: {
    fontSize: 20,
    color: Colors.white,
    fontWeight: 'bold',
  },

  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  statTarget: {
    fontSize: Typography.sizes.caption,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },

  errorBanner: {
    backgroundColor: Colors.dangerTint,
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.sizes.body,
    color: Colors.danger,
    flex: 1,
  },
  retryLink: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.danger,
    fontWeight: 'bold',
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  regenerateButton: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },

  mealTypeHeader: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: Spacing.md,
  },

  skeleton: {
    gap: Spacing.md,
  },
  skeletonBar: {
    height: 100,
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.lg,
  },

  emptyState: {
    backgroundColor: Colors.light,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },

  encouragementCard: {
    backgroundColor: Colors.primaryTint,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  encouragementIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  encouragementText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },

  appointmentCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  appointmentDate: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  appointmentTime: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
})
