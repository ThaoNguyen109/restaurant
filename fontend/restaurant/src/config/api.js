// Tự động nhận diện host: nếu truy cập qua IP LAN (điện thoại) thì gọi API theo IP đó
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${protocol}//${hostname}:8080`
}

const API_BASE_URL = getBaseUrl()

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  loginPath: '/api/auth/login',
}

export function buildApiUrl(path) {
  return `${API_CONFIG.baseUrl}${path}`
}
