// Configuration for API endpoints
// For development: use your machine's IP address
// Get your IP by running: ipconfig (Windows) or ifconfig (Mac/Linux)

// Development IP - update this with your machine's IP when testing on physical devices
const API_DEV_HOST = '10.231.28.226' // Your school WiFi IP from .env.local
const API_PORT = '8000'

export const API_BASE_URL = `http://${API_DEV_HOST}:${API_PORT}/api`

export const config = {
  apiBaseUrl: API_BASE_URL,
}

