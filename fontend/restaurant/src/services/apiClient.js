import { buildApiUrl, API_CONFIG } from '../config/api'
import { logout } from '../utils/auth'

/**
 * Tạo header Authorization cho request API
 * @param {boolean} isFormData - true nếu request là multipart form data (bỏ Content-Type)
 */
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

/**
 * Xây dựng URL đầy đủ cho ảnh
 */
export function getImageFullUrl(imagePath) {
  if (!imagePath) return ''
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  return `${API_CONFIG.baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`
}

/**
 * Wrapper fetch có xử lý lỗi 401/403 tập trung.
 * Khi nhận 401 → token hết hạn → logout + redirect về login
 * Khi nhận 403 → không có quyền → thông báo + redirect về login
 *
 * @param {string} url - URL đầy đủ hoặc path API
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}) {
  // Nếu url là path, tự động build full URL
  const fullUrl = url.startsWith('http') ? url : buildApiUrl(url)

  const response = await fetch(fullUrl, options)

  if (response.status === 401) {
    // Token hết hạn hoặc chưa đăng nhập
    logout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  }

  if (response.status === 403) {
    // Không có quyền thực hiện thao tác này
    logout('Bạn không có quyền thực hiện thao tác này. Đã đăng xuất.')
    throw new Error('Bạn không có quyền thực hiện thao tác này.')
  }

  return response
}
