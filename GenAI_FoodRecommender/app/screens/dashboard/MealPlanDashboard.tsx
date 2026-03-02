import React, { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  RefreshControl,
  FlatList,
} from 'react-native'
import { useMealPlan, useAuth } from '../../hooks'
import { MealCard, FilterChipGroup } from '../../components/molecules'
import { Button } from '../../components/atoms'
import { SkeletonLines } from '../../components/atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { formatDate, getGreeting } from '../../utils'

export function MealPlanDashboard() {
  const { user } = useAuth()
  const {
    todaysPlan,
    isLoading,
    error,
    preferences,
    fetchTodaysPlan,
    regeneratePlan,
    updatePreferences,
  } = useMealPlan()

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    preferences.cuisines,
  )
  const [selectedBudget, setSelectedBudget] = useState<string>(preferences.budget)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Fetch meal plan on mount
  useEffect(() => {
    fetchTodaysPlan()
  }, [])

  const handleRegeneratePlan = async () => {
    setIsRegenerating(true)
    try {
      const newPreferences = {
        ...preferences,
        cuisines: selectedCuisines,
        budget: selectedBudget as 'low' | 'medium' | 'high',
      }
      await regeneratePlan(newPreferences)
      updatePreferences(newPreferences)
    } catch (err) {
      console.error('Failed to regenerate plan:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCuisineSelect = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      setSelectedCuisines(selectedCuisines.filter(c => c !== cuisine))
    } else {
      setSelectedCuisines([...selectedCuisines, cuisine])
    }
  }

  const handleBudgetSelect = (budget: string) => {
    setSelectedBudget(budget)
  }

  const mealsByType = todaysPlan?.meals.reduce(
    (acc, meal) => {
      const type = meal.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(meal)
      return acc
    },
    {} as Record<string, any[]>,
  ) || {}

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.firstName}! 👋
          </Text>
          <Text style={styles.date}>{formatDate(new Date())}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !selectedCuisines}
            onRefresh={fetchTodaysPlan}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error State */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              label="Retry"
              onPress={fetchTodaysPlan}
              variant="secondary"
              size="small"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        )}

        {/* Loading State */}
        {isLoading && !todaysPlan ? (
          <View style={styles.loadingSection}>
            <SkeletonLines count={4} spacing={Spacing.lg} />
          </View>
        ) : (
          <>
            {/* Filters */}
            <View style={styles.filtersSection}>
              <FilterChipGroup
                label="Cuisine Preference"
                options={['Mediterranean', 'Asian', 'American', 'European', 'Latin']}
                selected={selectedCuisines}
                onSelect={handleCuisineSelect}
                horizontal
              />

              <View style={styles.spacer} />

              <FilterChipGroup
                label="Budget"
                options={['low', 'medium', 'high']}
                selected={[selectedBudget]}
                onSelect={handleBudgetSelect}
                horizontal
              />

              <Button
                label={isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}
                onPress={handleRegeneratePlan}
                loading={isRegenerating}
                disabled={isRegenerating || !selectedCuisines.length}
                size="medium"
                style={styles.regenerateButton}
              />
            </View>

            {/* Meals */}
            {todaysPlan && todaysPlan.meals.length > 0 ? (
              <View style={styles.mealsSection}>
                <Text style={styles.sectionTitle}>Your Meal Plan</Text>

                {mealTypes.map(mealType => {
                  const meals = mealsByType[mealType] || []
                  if (meals.length === 0) return null

                  return (
                    <View key={mealType} style={styles.mealTypeGroup}>
                      <Text style={styles.mealTypeTitle}>
                        {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                      </Text>
                      {meals.map(meal => (
                        <MealCard
                          key={meal.id}
                          meal={meal}
                          onPress={() => {
                            // Navigate to meal detail screen
                            console.log('View meal details:', meal.id)
                          }}
                        />
                      ))}
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No meals available</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Try adjusting your preferences
                </Text>
                <Button
                  label="Regenerate Plan"
                  onPress={handleRegeneratePlan}
                  style={styles.emptyStateButton}
                />
              </View>
            )}

            {/* Doctor's Note Banner (if exists) */}
            {false && (
              <View style={styles.doctorNoteBanner}>
                <Text style={styles.doctorNoteTitle}>📋 Doctor's Note</Text>
                <Text style={styles.doctorNoteContent}>
                  Keep up the great work with your meal plans! Your recent glucose readings show good improvement.
                </Text>
                <Text style={styles.doctorNoteFrom}>— Dr. John Smith</Text>
              </View>
            )}

            {/* Daily Stats */}
            {todaysPlan && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Daily Summary</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {Math.round(
                        todaysPlan.meals.reduce((sum, m) => sum + m.calories, 0),
                      )}
                    </Text>
                    <Text style={styles.statLabel}>Total Calories</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {todaysPlan.meals.reduce((sum, m) => sum + m.carbs, 0).toFixed(0)}g
                    </Text>
                    <Text style={styles.statLabel}>Carbs</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {todaysPlan.meals.reduce((sum, m) => sum + m.protein, 0).toFixed(0)}g
                    </Text>
                    <Text style={styles.statLabel}>Protein</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {todaysPlan.meals.reduce((sum, m) => sum + m.fat, 0).toFixed(0)}g
                    </Text>
                    <Text style={styles.statLabel}>Fat</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsSection}>
              <Button
                label="Chat with AI"
                onPress={() => console.log('Navigate to chat')}
                variant="outline"
                size="large"
              />
              <Button
                label="View History"
                onPress={() => console.log('Navigate to history')}
                variant="outline"
                size="large"
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  greeting: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
  },
  date: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  errorBanner: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.body,
  },
  loadingSection: {
    marginVertical: Spacing.lg,
  },
  filtersSection: {
    marginBottom: Spacing.xl,
  },
  spacer: {
    height: Spacing.md,
  },
  regenerateButton: {
    marginTop: Spacing.md,
  },
  mealsSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  mealTypeGroup: {
    marginBottom: Spacing.lg,
  },
  mealTypeTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  emptyStateButton: {
    marginTop: Spacing.md,
  },
  doctorNoteBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  doctorNoteTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.inverse,
    marginBottom: Spacing.sm,
  },
  doctorNoteContent: {
    fontSize: Typography.sizes.body,
    color: Colors.text.inverse,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  doctorNoteFrom: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.inverse,
    fontStyle: 'italic',
  },
  statsSection: {
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  actionsSection: {
    marginBottom: Spacing.xl,
  },
})
