import { buildApiUrl } from '../config/api'
import { getAuthHeaders, apiFetch } from './apiClient'

/**
 * Khách hàng đặt bàn – KHÔNG cần token
 * @param {{ customerName, customerPhone, customerEmail?, tableId?, reservationDate, reservationTime, numberOfGuests, note? }} payload
 */
export async function createReservation(payload) {
  // Public endpoint - dùng fetch gốc, không cần auth
  const response = await fetch(buildApiUrl('/api/reservations'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join('\n')
      throw new Error(errorMsg || data.message || 'Đặt bàn thất bại')
    }
    throw new Error(data.message || 'Đặt bàn thất bại')
  }
  return data
}

/**
 * Admin – Lấy danh sách đặt bàn (có lọc)
 * @param {{ status?, date?, search? }} params
 */
export async function getAllReservations(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.status) queryParams.append('status', params.status)
  if (params.date)   queryParams.append('date', params.date)
  if (params.search) queryParams.append('search', params.search)

  const qs = queryParams.toString()
  const endpoint = qs ? `/api/reservations?${qs}` : '/api/reservations'

  const response = await apiFetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) throw new Error(data.message || 'Không thể tải danh sách đặt bàn')
  return data
}

/**
 * Lấy chi tiết một đặt bàn
 */
export async function getReservationById(id) {
  const response = await apiFetch(`/api/reservations/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không tìm thấy đặt bàn')
  return data
}

/**
 * Admin – Cập nhật thông tin đặt bàn
 */
export async function updateReservation(id, payload) {
  const response = await apiFetch(`/api/reservations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).join('\n') || data.message)
    }
    throw new Error(data.message || 'Cập nhật đặt bàn thất bại')
  }
  return data
}

/**
 * Admin – Cập nhật nhanh trạng thái
 * @param {number} id
 * @param {string} status - PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
 */
export async function updateReservationStatus(id, status) {
  const response = await apiFetch(`/api/reservations/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Cập nhật trạng thái thất bại')
  return data
}

/**
 * Admin – Xoá đặt bàn
 */
export async function deleteReservation(id) {
  const response = await apiFetch(`/api/reservations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Xoá đặt bàn thất bại')
  return data
}

/**
 * Đếm đặt bàn hôm nay
 */
export async function getTodayReservationCount() {
  const response = await apiFetch('/api/reservations/stats/today', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({ count: 0 }))
  if (!response.ok) return { count: 0 }
  return data
}
