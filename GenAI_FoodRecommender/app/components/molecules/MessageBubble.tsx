import React, { useMemo, useState } from 'react'
import { StyleSheet, View, Text, ScrollView, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { ChatRecommendedMeal } from '../../types'
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme'

interface MessageBubbleProps {
  message: string
  role: 'user' | 'assistant'
  timestamp?: string
  retrievedMeals?: ChatRecommendedMeal[]
}

export function MessageBubble({
  message,
  role,
  timestamp,
  retrievedMeals = [],
}: MessageBubbleProps) {
  const isUser = role === 'user'
  const { width } = useWindowDimensions()
  const [activeCard, setActiveCard] = useState(0)

  const cardWidth = Math.min(width - Spacing.lg * 2.4, 380)
  const meals = useMemo(
    () => (isUser ? [] : retrievedMeals.filter((meal) => Boolean(meal?.name))),
    [isUser, retrievedMeals]
  )

  const onCarouselScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + Spacing.md))
    setActiveCard(Math.max(0, Math.min(index, meals.length - 1)))
  }

  const formatGrams = (value?: number) => (typeof value === 'number' ? `${Math.round(value)}g` : '--')
  const formatCalories = (value?: number) => (typeof value === 'number' ? `${Math.round(value)}` : '--')

  const inferGlycemicLoad = (carbs?: number): string => {
    if (typeof carbs !== 'number') return 'Unknown'
    if (carbs <= 15) return `Low (${Math.round(carbs)})`
    if (carbs <= 30) return `Medium (${Math.round(carbs)})`
    return `High (${Math.round(carbs)})`
  }

  const instructionLines = (instructions?: string): string[] => {
    if (!instructions || !instructions.trim()) {
      return ['No preparation instructions available for this meal.']
    }

    if (instructions.trim().startsWith('[') && instructions.trim().endsWith(']')) {
      try {
        const parsed = JSON.parse(instructions)
        if (Array.isArray(parsed)) {
          return parsed.map((line) => String(line).trim()).filter(Boolean)
        }
      } catch {
        // Fall through to newline split parsing below.
      }
    }

    const splitLines = instructions
      .split(/\r?\n|\s*\d+\.\s+/)
      .map((line) => line.trim().replace(/^[-*]\s*/, ''))
      .filter(Boolean)

    return splitLines.length > 0 ? splitLines : [instructions.trim()]
  }

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          !isUser ? styles.assistantBubbleWide : null,
        ]}
      >
        <Text
          style={[
            styles.message,
            isUser ? styles.userMessage : styles.assistantMessage,
          ]}
        >
          {message}
        </Text>

        {!isUser && meals.length > 0 && (
          <View style={styles.carouselWrapper}>
            <ScrollView
              horizontal
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={cardWidth + Spacing.md}
              snapToAlignment="start"
              disableIntervalMomentum
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onCarouselScrollEnd}
              contentContainerStyle={styles.carouselContent}
            >
              {meals.map((meal, index) => (
                <View key={`${meal.mealId || meal.name}-${index}`} style={[styles.mealCard, { width: cardWidth }]}> 
                  <Text style={styles.mealCardTitle}>{index === 0 ? 'Recommended Pick' : `Suggestion ${index + 1}`}</Text>
                  <Text style={styles.mealName}>{meal.name}</Text>

                  <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionPill}>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                      <Text style={styles.nutritionValue}>{formatGrams(meal.carbsG)}</Text>
                    </View>
                    <View style={styles.nutritionPill}>
                      <Text style={styles.nutritionLabel}>Fats</Text>
                      <Text style={styles.nutritionValue}>{formatGrams(meal.fatG)}</Text>
                    </View>
                    <View style={styles.nutritionPill}>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                      <Text style={styles.nutritionValue}>{formatCalories(meal.calories)}</Text>
                    </View>
                    <View style={styles.nutritionPill}>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Text style={styles.nutritionValue}>{formatGrams(meal.proteinG)}</Text>
                    </View>
                  </View>

                  <View style={styles.glycemicRow}>
                    <Text style={styles.glycemicLabel}>Glycemic Load</Text>
                    <Text style={styles.glycemicValue}>{inferGlycemicLoad(meal.carbsG)}</Text>
                  </View>

                  <Text style={styles.instructionsTitle}>Instructions</Text>
                  <ScrollView style={styles.instructionsBox} nestedScrollEnabled>
                    {instructionLines(meal.instructions).map((line, lineIndex) => (
                      <Text key={lineIndex} style={styles.instructionsText}>{`${lineIndex + 1}. ${line}`}</Text>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </ScrollView>

            {meals.length > 1 && (
              <View style={styles.pagination}>
                {meals.map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.paginationDot, idx === activeCard ? styles.paginationDotActive : null]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
      {timestamp && (
        <Text style={styles.timestamp}>
          {new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
    flexDirection: 'column',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'stretch',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  userBubble: {
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    backgroundColor: Colors.surfaceLight,
  },
  assistantBubbleWide: {
    maxWidth: '100%',
    width: '100%',
  },
  message: {
    fontSize: Typography.sizes.body,
    lineHeight: 22,
  },
  userMessage: {
    color: Colors.text.inverse,
  },
  assistantMessage: {
    color: Colors.text.primary,
  },
  carouselWrapper: {
    marginTop: Spacing.md,
  },
  carouselContent: {
    gap: Spacing.md,
    paddingRight: Spacing.sm,
  },
  mealCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  mealCardTitle: {
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  mealName: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  nutritionPill: {
    width: '47%',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  nutritionLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
  },
  nutritionValue: {
    marginTop: 2,
    fontSize: Typography.sizes.bodySmall,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
  },
  glycemicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  glycemicLabel: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
  },
  glycemicValue: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold as any,
  },
  instructionsTitle: {
    fontSize: Typography.sizes.bodySmall,
    color: Colors.text.primary,
    fontWeight: Typography.weights.semibold as any,
    marginBottom: Spacing.xs,
  },
  instructionsBox: {
    maxHeight: 190,
    backgroundColor: Colors.primaryTint,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  instructionsText: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.bodySmall,
    lineHeight: 21,
    marginBottom: Spacing.xs,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: BorderRadius.circular,
    backgroundColor: Colors.text.tertiary,
    opacity: 0.4,
  },
  paginationDotActive: {
    backgroundColor: Colors.primary,
    opacity: 1,
  },
  timestamp: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
})
