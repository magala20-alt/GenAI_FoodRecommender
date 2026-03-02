import React, { ReactNode } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
  shadow?: 'sm' | 'md' | 'lg'
  pressable?: boolean
  onPress?: () => void
}

export function Card({
  children,
  style,
  shadow = 'md',
  pressable = false,
  onPress,
}: CardProps) {
  const getShadowStyle = () => {
    switch (shadow) {
      case 'sm':
        return Shadows.sm
      case 'md':
        return Shadows.md
      case 'lg':
        return Shadows.lg
      default:
        return Shadows.md
    }
  }

  const cardContent = (
    <View
      style={[
        styles.card,
        getShadowStyle(),
        style,
      ]}
    >
      {children}
    </View>
  )

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
      >
        {cardContent}
      </TouchableOpacity>
    )
  }

  return cardContent
}

import { TouchableOpacity } from 'react-native'

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
})
