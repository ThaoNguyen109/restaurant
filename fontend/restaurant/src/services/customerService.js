import { getAuthHeaders, apiFetch } from './apiClient'

/**
 * 1. Danh sách khách hàng phân trang & tìm kiếm
 */
export async function getCustomers({ keyword = '', tier = '', status = '', page = 0, size = 10 } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.append('keyword', keyword)
  if (tier) params.append('tier', tier)
  if (status) params.append('status', status)
  params.append('page', page)
  params.append('size', size)

  const response = await apiFetch(`/api/customers?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({ content: [], totalElements: 0 }))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách khách hàng')
  }
  return data
}

/**
 * 2. Lấy toàn bộ danh sách khách hàng không phân trang
 */
export async function getAllCustomers({ keyword = '', tier = '', status = '' } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.append('keyword', keyword)
  if (tier) params.append('tier', tier)
  if (status) params.append('status', status)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const response = await apiFetch(`/api/customers/all${queryString}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách khách hàng')
  }
  return data
}

/**
 * 3. Thống kê tổng quan khách hàng
 */
export async function getCustomerStats() {
  const response = await apiFetch('/api/customers/stats', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải thống kê khách hàng')
  }
  return data
}

/**
 * 4. Xem chi tiết khách hàng và lịch sử đơn hàng
 */
export async function getCustomerById(id) {
  const response = await apiFetch(`/api/customers/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải thông tin khách hàng')
  }
  return data
}

/**
 * 5. Tra cứu khách hàng theo SĐT (dành cho thu ngân/order)
 */
export async function getCustomerByPhone(phone) {
  const response = await apiFetch(`/api/customers/phone/${encodeURIComponent(phone)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || 'Không tìm thấy khách hàng')
  }
  return data
}

/**
 * 6. Tạo mới khách hàng
 */
export async function createCustomer(payload) {
  const response = await apiFetch('/api/customers', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo mới khách hàng')
  }
  return data
}

/**
 * 7. Cập nhật thông tin khách hàng
 */
export async function updateCustomer(id, payload) {
  const response = await apiFetch(`/api/customers/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật thông tin khách hàng')
  }
  return data
}

/**
 * 8. Xóa khách hàng
 */
export async function deleteCustomer(id) {
  const response = await apiFetch(`/api/customers/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể xóa khách hàng')
  }
  return data
}

/**
 * 9. Tích điểm cho khách hàng
 */
export async function addCustomerPoints(id, amount) {
  const response = await apiFetch(`/api/customers/${id}/points`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cộng điểm tích lũy')
  }
  return data
}
