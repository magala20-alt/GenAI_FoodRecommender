import { ChatMessage, ChatRecommendedMeal } from '../types'
import { apiClient } from './apiClient'
import { mockChatMessages } from '../mocks'

const USE_MOCK = false

type RecommendationResponse = {
  response: string
  retrievedMeals: Array<Record<string, unknown>>
  sources: string[]
  numMealsRetrieved: number
}

type SendMessageResult = {
  text: string
  retrievedMeals: ChatRecommendedMeal[]
  sources: string[]
}

type ParsedAssistantPayload = {
  summary?: string
  suggestedMeals?: Array<Record<string, unknown>>
}

const looksLikeJsonBlob = (text: string): boolean => {
  const value = text.trim()
  if (!value) return false
  if (value.startsWith('{') && value.endsWith('}')) return true
  return /"?sum+\w*"?\s*:|suggested_meals|suggestedMeals/i.test(value)
}

const toNumberOrUndefined = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const normalizeMeal = (meal: Record<string, unknown>): ChatRecommendedMeal => {
  return {
    mealId: typeof meal.meal_id === 'string' ? meal.meal_id : undefined,
    name: typeof meal.name === 'string' ? meal.name : 'Suggested meal',
    description: typeof meal.description === 'string' ? meal.description : undefined,
    cuisine: typeof meal.cuisine === 'string' ? meal.cuisine : undefined,
    calories: toNumberOrUndefined(meal.calories),
    proteinG: toNumberOrUndefined(meal.protein_g),
    carbsG: toNumberOrUndefined(meal.carbs_g),
    fatG: toNumberOrUndefined(meal.fat_g),
    instructions: typeof meal.instructions === 'string' ? meal.instructions : undefined,
    similarityScore: toNumberOrUndefined(meal.similarity_score),
  }
}

const extractJsonObject = (raw: string): Record<string, unknown> | null => {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  const withoutFence = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const normalized = withoutFence.replace(/^json\s*/i, '').trim()

  try {
    const parsed = JSON.parse(normalized)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    const first = normalized.indexOf('{')
    const last = normalized.lastIndexOf('}')
    if (first === -1 || last === -1 || last <= first) {
      return null
    }
    try {
      const parsed = JSON.parse(normalized.slice(first, last + 1))
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }
}

const parseAssistantPayload = (raw: string): ParsedAssistantPayload => {
  const parsed = extractJsonObject(raw)
  if (!parsed) {
    return {}
  }

  const summaryCandidates = ['summary', 'sumary', 'sumamary', 'summmary', 'overview']
  const summaryValue = summaryCandidates
    .map((key) => parsed[key])
    .find((value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      if (Array.isArray(value)) {
        return value.some((item) => String(item).trim().length > 0)
      }
      return false
    })

  const summary =
    typeof summaryValue === 'string'
      ? summaryValue.trim()
      : Array.isArray(summaryValue)
        ? summaryValue.map((item) => String(item).trim()).filter(Boolean).join(' ')
        : undefined

  const mealsCandidateKeys = ['suggested_meals', 'suggestedMeals', 'meals', 'recommendations']
  let suggestedMeals: Array<Record<string, unknown>> | undefined
  for (const key of mealsCandidateKeys) {
    const value = parsed[key]
    if (Array.isArray(value)) {
      suggestedMeals = value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
      break
    }
  }

  return {
    summary,
    suggestedMeals,
  }
}

export const chatService = {
  async sendMessageDetailed(message: string): Promise<SendMessageResult> {
    if (USE_MOCK) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            text: 'I found a few diabetes-friendly suggestions based on your request.',
            retrievedMeals: [],
            sources: [],
          })
        }, 1000)
      })
    }

    const result = await apiClient.post<RecommendationResponse>('/patient-rag/recommendations', {
      query: message,
      includeExamples: true,
      kRetrieved: 5,
    })

    const parsedPayload = parseAssistantPayload(result.response || '')
    const fallbackFriendly = 'I could not find exact cuisine matches yet, but here are the closest meal options and alternatives.'
    const rawBase = (parsedPayload.summary || result.response || '').trim()
    const base = rawBase ? (looksLikeJsonBlob(rawBase) ? fallbackFriendly : rawBase) : 'I could not find a strong recommendation from your current meal context.'
    const sources = result.sources || []
    const sourceSuffix = sources.length > 0 ? `\n\nSources: ${sources.slice(0, 3).join(', ')}` : ''
    const normalizedRetrievedMeals = Array.isArray(result.retrievedMeals) ? result.retrievedMeals.map(normalizeMeal) : []
    const normalizedParsedMeals = Array.isArray(parsedPayload.suggestedMeals)
      ? parsedPayload.suggestedMeals.map(normalizeMeal)
      : []

    return {
      text: `${base}${sourceSuffix}`,
      retrievedMeals: normalizedRetrievedMeals.length > 0 ? normalizedRetrievedMeals : normalizedParsedMeals,
      sources,
    }
  },

  async sendMessage(message: string): Promise<string> {
    const detailed = await this.sendMessageDetailed(message)
    return detailed.text
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

    return apiClient.get<string[]>('/patient-rag/chat/suggestions')
  },
}
