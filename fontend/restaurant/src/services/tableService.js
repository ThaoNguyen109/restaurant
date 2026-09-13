import { getAuthHeaders, apiFetch } from './apiClient'

/**
 * Lấy danh sách bàn đang hoạt động (không bao gồm INACTIVE)
 * @param {string|null} status - lọc theo trạng thái (tuỳ chọn)
 */
export async function getActiveTables(status = null) {
  const endpoint = status
    ? `/api/tables?status=${encodeURIComponent(status)}`
    : '/api/tables'

  const response = await apiFetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) throw new Error(data.message || 'Không thể tải danh sách bàn')
  return data
}

/**
 * Lấy toàn bộ bàn (kể cả INACTIVE) – dành cho admin
 */
export async function getAllTables() {
  const response = await apiFetch('/api/tables/all', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) throw new Error(data.message || 'Không thể tải danh sách bàn')
  return data
}

/**
 * Lấy chi tiết bàn theo ID
 */
export async function getTableById(id) {
  const response = await apiFetch(`/api/tables/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không tìm thấy bàn')
  return data
}

/**
 * Thêm bàn mới
 * @param {{ tableNumber: number, capacity: number, status?: string }} payload
 */
export async function createTable(payload) {
  const response = await apiFetch('/api/tables', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join(', ')
      throw new Error(errorMsg || data.message || 'Thêm bàn thất bại')
    }
    throw new Error(data.message || 'Thêm bàn thất bại')
  }
  return data
}

/**
 * Cập nhật thông tin bàn
 * @param {number} id
 * @param {{ tableNumber: number, capacity: number, status?: string }} payload
 */
export async function updateTable(id, payload) {
  const response = await apiFetch(`/api/tables/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join(', ')
      throw new Error(errorMsg || data.message || 'Cập nhật bàn thất bại')
    }
    throw new Error(data.message || 'Cập nhật bàn thất bại')
  }
  return data
}

/**
 * Cập nhật nhanh trạng thái bàn
 * @param {number} id
 * @param {string} status - AVAILABLE | OCCUPIED | RESERVED | MAINTENANCE | INACTIVE
 */
export async function updateTableStatus(id, status) {
  const response = await apiFetch(`/api/tables/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Cập nhật trạng thái thất bại')
  return data
}

/**
 * Xóa mềm bàn (đặt trạng thái INACTIVE)
 * @param {number} id
 */
export async function deleteTable(id) {
  const response = await apiFetch(`/api/tables/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không thể xóa bàn')
  return data
}
