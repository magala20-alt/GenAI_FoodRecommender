import React, { createContext, useState, useCallback, ReactNode } from 'react'
import { ChatContextType, ChatMessage } from '../types'
import { chatService } from '../services/chatService'

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
  children: ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (messageText: string) => {
    setIsLoading(true)
    setError(null)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Try streaming first
      setIsStreaming(true)
      let fullResponse = ''

      for await (const chunk of chatService.streamMessage(messageText)) {
        fullResponse += chunk
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      // Fallback to non-streaming
      try {
        const response = await chatService.sendMessage(messageText)

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        }

        setMessages(prev => [...prev, assistantMessage])
      } catch (fallbackErr) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to send message'
        setError(message)
        console.error('Send message error:', fallbackErr)
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [])

  const clearChat = useCallback(async () => {
    try {
      await chatService.clearChatHistory()
      setMessages([])
    } catch (err) {
      console.error('Clear chat error:', err)
    }
  }, [])

  const value: ChatContextType = {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    getSuggestedPrompts: chatService.getSuggestedPrompts,
  }

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  )
}
