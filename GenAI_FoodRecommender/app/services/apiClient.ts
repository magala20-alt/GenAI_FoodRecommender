import { API_BASE_URL } from '../config'

// Base API client with axios-like interface for React Native
export class ApiClient {
  private baseURL: string
  private token: string | null = null
  private headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`
    } else {
      delete this.headers['Authorization']
    }
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const options: RequestInit = {
        method,
        headers: this.headers,
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        let message = `HTTP ${response.status}`

        try {
          const errorPayload = await response.json()
          if (typeof errorPayload?.detail === 'string') {
            message = errorPayload.detail
          } else if (typeof errorPayload?.message === 'string') {
            message = errorPayload.message
          }
        } catch {
          // Ignore invalid error bodies.
        }

        if (response.status === 401) {
          throw new Error(message)
        }
        throw new Error(message)
      }

      const result = await response.json()
      return result as T
    } catch (error) {
      console.error(`[${method}] ${endpoint}:`, error)
      throw error
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint)
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('POST', endpoint, data)
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>('PUT', endpoint, data)
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint)
  }

  // Stream endpoint (for chat)
  async *stream(endpoint: string, data?: any): AsyncGenerator<string> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const options: RequestInit = {
        method: 'POST',
        headers: this.headers,
      }

      if (data) {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line)
              if (json.data) {
                yield json.data
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      if (buffer.trim()) {
        try {
          const json = JSON.parse(buffer)
          if (json.data) {
            yield json.data
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    } catch (error) {
      console.error(`[STREAM] ${endpoint}:`, error)
      throw error
    }
  }
}

// Create default instance
export const apiClient = new ApiClient()

