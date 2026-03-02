import React, { useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Animated,
  ViewStyle,
} from 'react-native'
import { Colors, BorderRadius, Spacing } from '../../constants/theme'

interface SkeletonProps {
  width?: number | string
  height: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({
  width = '100%',
  height,
  borderRadius: br = BorderRadius.md,
  style,
}: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    ).start()
  }, [animatedValue])

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <View style={[styles.skeletonContainer, width === '100%' && { flex: 1 }]}>
      <Animated.View
        style={[
          styles.skeleton,
          {
            width: typeof width === 'number' ? width : undefined,
            height,
            borderRadius: br,
            opacity,
          },
          width === '100%' && { width: '100%' },
          style,
        ]}
      />
    </View>
  )
}

interface SkeletonLineProps {
  count?: number
  spacing?: number
}

export function SkeletonLines({
  count = 3,
  spacing = Spacing.md,
}: SkeletonLineProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          height={20}
          width="100%"
          style={{ marginBottom: i < count - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  skeletonContainer: {
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: Colors.border,
  },
})
