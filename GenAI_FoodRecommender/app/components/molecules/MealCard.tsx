import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { Meal } from '../../types'
import { Card, Badge } from '../atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'

interface MealCardProps {
  meal: Meal
  onPress?: () => void
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onPress }) => {
  const mealTypeLabel = meal.type.charAt(0).toUpperCase() + meal.type.slice(1)
  
  const getBudgetColor = (budget: string) => {
    switch (budget) {
      case 'low':
        return 'success'
      case 'medium':
        return 'info'
      case 'high':
        return 'warning'
      default:
        return 'neutral'
    }
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Badge label={mealTypeLabel} size="small" />
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.cuisine}>{meal.cuisine}</Text>
          </View>
          <Badge 
            label={`${meal.budget}`} 
            variant={getBudgetColor(meal.budget) as any}
            size="small"
          />
        </View>

        <View style={styles.nutrition}>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientLabel}>Calories</Text>
            <Text style={styles.nutrientValue}>{Math.round(meal.calories)}</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientLabel}>Carbs</Text>
            <Text style={styles.nutrientValue}>{meal.carbs}g</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientLabel}>Protein</Text>
            <Text style={styles.nutrientValue}>{meal.protein}g</Text>
          </View>
          <View style={styles.nutrientItem}>
            <Text style={styles.nutrientLabel}>Fat</Text>
            <Text style={styles.nutrientValue}>{meal.fat}g</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Nutrition Score</Text>
          <View style={styles.scoreBar}>
            <View 
              style={[
                styles.scoreBarFill,
                { width: `${(meal.nutritionScore / 10) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.scoreValue}>{meal.nutritionScore.toFixed(1)}/10</Text>
        </View>
      </Card>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  mealName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginTop: Spacing.sm,
  },
  cuisine: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  nutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  nutrientValue: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.primary,
  },
  scoreContainer: {
    marginTop: Spacing.md,
  },
  scoreLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  scoreBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
  },
  scoreValue: {
    fontSize: Typography.sizes.caption,
    color: Colors.primary,
    fontWeight: Typography.weights.semibold as any,
  },
})
