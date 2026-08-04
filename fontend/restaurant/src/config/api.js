const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  loginPath: '/api/auth/login',
}

export function buildApiUrl(path) {
  return `${API_CONFIG.baseUrl}${path}`
}
