import { ChatMessage } from '../types'
import { apiClient } from './apiClient'
import { mockChatMessages } from '../mocks'

const USE_MOCK = false

type RecommendationResponse = {
  response: string
  retrievedMeals: Array<Record<string, unknown>>
  sources: string[]
  numMealsRetrieved: number
}

export const chatService = {
  async sendMessage(message: string): Promise<string> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const responses = [
            'That\'s a great question! Here are some tips...',
            'Based on your diabetes management, I recommend...',
            'I\'ve analyzed your meal history. Consider trying...',
            'That meal sounds delicious! The nutrition profile is excellent for your goals.',
            'Would you like me to suggest some variations on that?',
          ]
          const randomResponse = responses[Math.floor(Math.random() * responses.length)]
          resolve(randomResponse)
        }, 1000)
      })
    }

    const result = await apiClient.post<RecommendationResponse>('/patient-rag/recommendations', {
      query: message,
      includeExamples: true,
      kRetrieved: 5,
    })

    const base = (result.response || '').trim() || 'I could not find a strong recommendation from your current meal context.'
    if (!result.sources || result.sources.length === 0) {
      return base
    }

    const sourceList = result.sources.slice(0, 3).join(', ')
    return `${base}\n\nSources: ${sourceList}`
  },

  async *streamMessage(message: string): AsyncGenerator<string> {
    if (USE_MOCK) {
      const responses = [
        'I\'d be happy to help with your meal planning!',
        'Here are some diabetes-friendly options that fit your budget:',
        '1. Mediterranean Quinoa Bowl - High in fiber and protein',
        '2. Stir-fried vegetables with brown rice - Low glycemic index',
        '3. Grilled chicken with sweet potato - Balanced macros',
        '\nWhich sounds most appealing to you?',
      ]

      for (const chunk of responses) {
        yield chunk
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      return
    }

    const full = await this.sendMessage(message)
    yield full
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    if (USE_MOCK) {
      return mockChatMessages
    }

    return apiClient.get<ChatMessage[]>('/chat/history')
  },

  async clearChatHistory(): Promise<void> {
    if (USE_MOCK) {
      return
    }

    await apiClient.delete('/chat/history')
  },

  async getSuggestedPrompts(): Promise<string[]> {
    if (USE_MOCK) {
      return [
        'Suggest a low-budget lunch',
        'What can I eat tonight?',
        'Show me gluten-free options',
        'Recommend high-protein meals',
        'What should I avoid?',
        'Create a weekly meal plan',
      ]
    }

    return apiClient.get<string[]>('/chat/suggestions')
  },
}
