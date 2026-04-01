import React from 'react'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme'

interface BadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'small' | 'medium'
  style?: ViewStyle
}

export function Badge({
  label,
  variant = 'neutral',
  size = 'medium',
  style,
}: BadgeProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return { bg: Colors.success, text: Colors.text.inverse }
      case 'warning':
        return { bg: Colors.warning, text: Colors.text.inverse }
      case 'error':
        return { bg: Colors.danger, text: Colors.text.inverse }
      case 'info':
        return { bg: Colors.primary, text: Colors.text.inverse }
      case 'neutral':
        return { bg: Colors.border, text: Colors.text.primary }
      default:
        return { bg: Colors.primary, text: Colors.text.inverse }
    }
  }

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallBadge
      case 'medium':
        return styles.mediumBadge
      default:
        return styles.mediumBadge
    }
  }

  const { bg, text } = getVariantColors()

  return (
    <View
      style={[
        styles.badge,
        getSizeStyle(),
        { backgroundColor: bg },
        style,
      ]}
    >
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  smallBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  mediumBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: {
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.semibold as any,
  },
})
