import { buildApiUrl, API_CONFIG } from '../config/api'

export function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem('token')
  const headers = {}
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  
  return headers
}

export function getImageFullUrl(imagePath) {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${API_CONFIG.baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}
