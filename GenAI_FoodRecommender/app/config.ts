import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Configuration for API endpoints.
// EXPO_PUBLIC_API_URL is the primary source and should be set per environment.
const API_FROM_ENV = process.env.EXPO_PUBLIC_API_URL
const API_HOST_FROM_ENV = process.env.EXPO_PUBLIC_API_HOST?.trim()
const API_PORT_FROM_ENV = process.env.EXPO_PUBLIC_API_PORT?.trim() || '8000'
const API_FROM_HOST_PORT = API_HOST_FROM_ENV ? `http://${API_HOST_FROM_ENV}:${API_PORT_FROM_ENV}/api` : null

function extractHost(hostUri?: string | null): string | null {
  if (!hostUri) return null
  const trimmed = hostUri.trim()
  if (!trimmed) return null
  const withoutProtocol = trimmed.replace(/^https?:\/\//, '')
  return withoutProtocol.split(':')[0] || null
}

// SDK/runtime dependent host locations.
const hostFromExpoConfig = extractHost(Constants.expoConfig?.hostUri)
const hostFromExpoGo = extractHost((Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost)
const hostFromManifest = extractHost((Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost)
const hostFromManifest2 = extractHost(
  (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra?.expoClient?.hostUri,
)

const EXPO_HOST = hostFromExpoConfig || hostFromExpoGo || hostFromManifest || hostFromManifest2
const API_FALLBACK = EXPO_HOST
  ? `http://${EXPO_HOST}:8000/api`
  : Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://127.0.0.1:8000/api'

export const API_BASE_URL = API_FROM_ENV || API_FROM_HOST_PORT || API_FALLBACK

function withApiPath(url: string): string {
  return url.endsWith('/api') ? url : `${url}/api`
}

function normalizeApiUrl(url?: string | null): string | null {
  if (!url) return null
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!trimmed) return null
  return withApiPath(trimmed)
}

function buildApiBaseUrlCandidates(): string[] {
  const candidates = [
    API_FROM_ENV,
    API_FROM_HOST_PORT,
    EXPO_HOST ? `http://${EXPO_HOST}:8000/api` : null,
    'http://10.0.2.2:8000/api',
    'http://127.0.0.1:8000/api',
    'http://localhost:8000/api',
  ]

  const seen = new Set<string>()
  const result: string[] = []

  for (const candidate of candidates) {
    const normalized = normalizeApiUrl(candidate)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

export const API_BASE_URL_CANDIDATES = buildApiBaseUrlCandidates()

export const config = {
  apiBaseUrl: API_BASE_URL,
  apiBaseUrlCandidates: API_BASE_URL_CANDIDATES,
}

