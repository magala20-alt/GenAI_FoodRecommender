import React, { useEffect, useRef, useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useChat } from '../../hooks'
import { MessageBubble, FilterChipGroup, FilterChip } from '../../components/molecules'
import { Button } from '../../components/atoms'
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme'
import { getGreeting } from '../../utils'

export function AIChatScreen() {
  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    getSuggestedPrompts,
  } = useChat()

  const [newMessage, setNewMessage] = useState('')
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([])
  const flatListRef = useRef<FlatList>(null)
  const scrollViewRef = useRef<ScrollView>(null)

  // Load suggested prompts on mount
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const prompts = await getSuggestedPrompts()
        setSuggestedPrompts(prompts)
      } catch (err) {
        console.error('Failed to load suggested prompts:', err)
      }
    }
    loadPrompts()
  }, [])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages, isStreaming])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading || isStreaming) return

    const userMessage = newMessage
    setNewMessage('')

    try {
      // Send message and get response (streaming)
      await sendMessage(userMessage)
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleSuggestedPrompt = async (prompt: string) => {
    setNewMessage(prompt)
    // Optionally auto-send:
    try {
      await sendMessage(prompt)
    } catch (err) {
      console.error('Failed to send suggested prompt:', err)
    }
  }

  const handleClearChat = async () => {
    try {
      await clearChat()
      setSuggestedPrompts([])
    } catch (err) {
      console.error('Failed to clear chat:', err)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AI Assistant 🤖</Text>
          <Text style={styles.headerSubtitle}>
            Get personalized meal recommendations & health tips
          </Text>
        </View>
        <Button
          label="Clear"
          onPress={handleClearChat}
          variant="outline"
          size="small"
        />
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Messages List */}
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Welcome! 👋</Text>
          <Text style={styles.emptyStateSubtitle}>
            I'm your AI nutritionist assistant. Ask me anything about your meal plan,
            nutrition, or diabetes management.
          </Text>

          {/* Suggested Prompts */}
          {suggestedPrompts.length > 0 && (
            <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>Quick Suggestions</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedList}
              >
                {suggestedPrompts.map((prompt, index) => (
                  <FilterChip
                    key={index}
                    label={prompt}
                    selected={false}
                    onPress={() => handleSuggestedPrompt(prompt)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <MessageBubble
              message={item.content}
              role={item.role}
              timestamp={item.timestamp}
            />
          )}
          contentContainerStyle={styles.messagesList}
          bounces={false}
          scrollEventThrottle={16}
          ListFooterComponent={
            isStreaming ? (
              <View style={styles.typingIndicator}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.typingText}>AI is thinking...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Suggested Prompts (when messages exist and not empty) */}
      {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !isStreaming && (
        <View style={styles.suggestedSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestedList}
          >
            {suggestedPrompts.slice(0, 3).map((prompt, index) => (
              <FilterChip
                key={index}
                label={prompt}
                selected={false}
                onPress={() => handleSuggestedPrompt(prompt)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <RNTextInput
            style={styles.input}
            placeholder="Ask me anything..."
            placeholderTextColor={Colors.text.tertiary}
            value={newMessage}
            onChangeText={setNewMessage}
            editable={!isLoading && !isStreaming}
            multiline
            maxLength={500}
            scrollEnabled
          />
          <Button
            label={isStreaming ? '⏳' : '📤'}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isLoading || isStreaming}
            variant={newMessage.trim() ? 'primary' : 'outline'}
            size="small"
            style={styles.sendButton}
          />
        </View>
        <Text style={styles.characterCount}>
          {newMessage.length} / 500
        </Text>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Typography.sizes.h3,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    maxWidth: '90%',
  },
  errorBanner: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: Colors.text.inverse,
    fontSize: Typography.sizes.body,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.sizes.h2,
    fontWeight: Typography.weights.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  emptyStateSubtitle: {
    fontSize: Typography.sizes.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  typingText: {
    marginLeft: Spacing.md,
    color: Colors.text.secondary,
    fontSize: Typography.sizes.bodySmall,
    fontStyle: 'italic',
  },
  suggestedSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  suggestedTitle: {
    fontSize: Typography.sizes.body,
    fontWeight: Typography.weights.semibold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  suggestedList: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: Spacing.md,
  },
  characterCount: {
    fontSize: Typography.sizes.caption,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
  },
})
