import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Colors, Typography, BorderRadius, Spacing } from '../../constants/theme'

interface MessageBubbleProps {
  message: string
  role: 'user' | 'assistant'
  timestamp?: string
}

export function MessageBubble({
  message,
  role,
  timestamp,
}: MessageBubbleProps) {
  const isUser = role === 'user'

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
    alignItems: 'flex-start',
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
  timestamp: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
})
