import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme'
import { Button } from '../../components/atoms'

interface LoggedMeal {
  id: string
  name: string
  calories: number
  mealType: string
  time: string
}

interface Vital {
  label: string
  value: string | number
  icon: string
  unit: string
}

export function DiaryScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loggedMeals, setLoggedMeals] = useState<LoggedMeal[]>([
    { id: '1', name: 'Oat Porridge + Banana', calories: 320, mealType: 'Breakfast', time: '07:30' },
    { id: '2', name: 'Grilled Tilapia + Rice', calories: 480, mealType: 'Lunch', time: '12:45' },
  ])

  const vitals: Vital[] = [
    { label: 'Weight', value: 78.2, icon: '⚖️', unit: 'kg' },
    { label: 'BP', value: '128/82', icon: '💓', unit: 'mmHg' },
    { label: 'Glucose', value: 7.8, icon: '🩺', unit: 'mmol/L' },
    { label: 'Steps', value: 6240, icon: '👟', unit: 'steps' },
  ]

  const totalCalories = loggedMeals.reduce((sum, meal) => sum + meal.calories, 0)
  const targetCalories = 1650
  const caloriePercentage = (totalCalories / targetCalories) * 100

  // Date picker
  const getDatesForWeek = () => {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dates.push(date)
    }
    return dates
  }

  const isDateSelected = (date: Date) => {
    return selectedDate.toDateString() === date.toDateString()
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Diary</Text>
      </View>

      {/* Date Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dateScroller}
        contentContainerStyle={styles.dateScrollerContent}
      >
        {getDatesForWeek().map((date, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.dateButton,
              isDateSelected(date) && styles.dateButtonActive,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={styles.dateDay}>{date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3)}</Text>
            <Text
              style={[
                styles.dateNumber,
                isDateSelected(date) && styles.dateNumberActive,
              ]}
            >
              {date.getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Calories Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calories Today</Text>
        
        <View style={styles.calorieCard}>
          <View>
            <Text style={styles.calorieValue}>{totalCalories}</Text>
            <Text style={styles.calorieLabel}>/ {targetCalories} kcal</Text>
            <Text style={styles.calorieRemaining}>
              {totalCalories > targetCalories
                ? `${totalCalories - targetCalories} over target`
                : `${targetCalories - totalCalories} remaining`
              }
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(caloriePercentage, 100)}%`,
                  backgroundColor: caloriePercentage > 100 ? Colors.danger : Colors.success,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Meals Logged */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Meals Logged</Text>
          <TouchableOpacity>
            <Text style={styles.addMealButton}>+ Add Meal</Text>
          </TouchableOpacity>
        </View>

        {loggedMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyText}>No meals logged yet</Text>
          </View>
        ) : (
          loggedMeals.map(meal => (
            <View key={meal.id} style={styles.mealListItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealType}>{meal.mealType} • {meal.time}</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              <TouchableOpacity>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Today's Vitals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Vitals</Text>
          <TouchableOpacity>
            <Text style={styles.logVitalsButton}>+ Log Vitals</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.vitalsGrid}>
          {vitals.map((vital, idx) => (
            <View key={idx} style={styles.vitalCard}>
              <Text style={styles.vitalIcon}>{vital.icon}</Text>
              <Text style={styles.vitalValue}>{vital.value}{vital.unit !== 'steps' ? vital.unit : ''}</Text>
              <Text style={styles.vitalLabel}>{vital.label}</Text>
              <TouchableOpacity style={styles.vitalEditIcon}>
                <Text>✏️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* FAB Section Info */}
      <View style={styles.fabHint}>
        <Text style={styles.fabHintText}>💡 Tap the meal icon at bottom right to add a meal quickly</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },

  dateScroller: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dateScrollerContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  dateButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    alignItems: 'center',
    minWidth: 60,
  },
  dateButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDay: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  dateNumber: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  dateNumberActive: {
    color: Colors.white,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  calorieCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  calorieValue: {
    fontSize: Typography.sizes.h2,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  calorieLabel: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
  },
  calorieRemaining: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  addMealButton: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  logVitalsButton: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: 'bold',
  },

  mealListItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mealName: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  mealType: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  mealCalories: {
    fontSize: Typography.sizes.body,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  editLink: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.primary,
    fontWeight: '500',
  },

  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  vitalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  vitalIcon: {
    fontSize: 28,
    marginBottom: Spacing.sm,
  },
  vitalValue: {
    fontSize: Typography.sizes.h4,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  vitalLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  vitalEditIcon: {
    marginTop: Spacing.sm,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
  },

  fabHint: {
    backgroundColor: Colors.secondaryTint,
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  fabHintText: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.secondary,
  },
})
