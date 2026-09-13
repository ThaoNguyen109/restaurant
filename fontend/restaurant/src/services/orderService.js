import { getAuthHeaders, apiFetch } from './apiClient'

/**
 * Lấy danh sách đơn hàng với bộ lọc (status, date, search, tableId)
 */
export async function getAllOrders(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.status && params.status !== 'ALL') queryParams.append('status', params.status)
  if (params.date) queryParams.append('date', params.date)
  if (params.search) queryParams.append('search', params.search)
  if (params.tableId) queryParams.append('tableId', params.tableId)

  const qs = queryParams.toString()
  const endpoint = qs ? `/api/orders?${qs}` : '/api/orders'

  const response = await apiFetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) throw new Error(data.message || 'Không thể tải danh sách đơn hàng')
  return data
}

/**
 * Lấy chi tiết đơn hàng theo ID
 */
export async function getOrderById(id) {
  const response = await apiFetch(`/api/orders/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không tìm thấy đơn hàng')
  return data
}

/**
 * Tạo đơn hàng mới
 * @param {{ tableId: number, note?: string, items?: Array<{ menuItemId?: number, comboId?: number, quantity: number, note?: string }> }} payload
 */
export async function createOrder(payload) {
  const response = await apiFetch('/api/orders', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join('\n')
      throw new Error(errorMsg || data.message || 'Tạo đơn hàng thất bại')
    }
    throw new Error(data.message || 'Tạo đơn hàng thất bại')
  }
  return data
}

/**
 * Cập nhật thông tin cơ bản của đơn (bàn, ghi chú)
 */
export async function updateOrder(id, payload) {
  const response = await apiFetch(`/api/orders/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Cập nhật đơn hàng thất bại')
  return data
}

/**
 * Cập nhật trạng thái đơn hàng (PENDING, CONFIRMED, PREPARING, SERVING, COMPLETED, CANCELLED)
 */
export async function updateOrderStatus(id, status) {
  const response = await apiFetch(`/api/orders/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Cập nhật trạng thái đơn thất bại')
  return data
}

/**
 * Xóa đơn hàng
 */
export async function deleteOrder(id) {
  const response = await apiFetch(`/api/orders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Xóa đơn hàng thất bại')
  return data
}

/**
 * Thống kê đơn hàng tổng quan
 */
export async function getOrderStats() {
  const response = await apiFetch('/api/orders/stats/summary', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return {
      totalOrdersToday: 0,
      pendingOrders: 0,
      preparingOrders: 0,
      servingOrders: 0,
      completedOrdersToday: 0,
      revenueToday: 0,
    }
  }
  return data
}

/**
 * Lấy đơn hàng đang hoạt động theo bàn
 */
export async function getActiveOrdersByTable(tableId) {
  const response = await apiFetch(`/api/orders/active-by-table/${tableId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) throw new Error(data.message || 'Không thể tải đơn hàng của bàn')
  return data
}

/**
 * Thêm món vào đơn hàng hiện có
 * @param {number} orderId
 * @param {{ menuItemId?: number, comboId?: number, quantity: number, note?: string }} itemPayload
 */
export async function addOrderItem(orderId, itemPayload) {
  const response = await apiFetch(`/api/orders/${orderId}/items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(itemPayload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      throw new Error(Object.values(data.errors).join('\n') || data.message)
    }
    throw new Error(data.message || 'Thêm món vào đơn thất bại')
  }
  return data
}

/**
 * Cập nhật số lượng / ghi chú của món trong đơn
 */
export async function updateOrderItem(orderId, itemId, payload) {
  const response = await apiFetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Cập nhật món thất bại')
  return data
}

/**
 * Cập nhật trạng thái của món trong đơn (PENDING, COOKING, SERVED, CANCELLED)
 */
export async function updateOrderItemStatus(orderId, itemId, status) {
  const response = await apiFetch(`/api/orders/${orderId}/items/${itemId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Cập nhật trạng thái món thất bại')
  return data
}

/**
 * Xóa món khỏi đơn hàng
 */
export async function deleteOrderItem(orderId, itemId) {
  const response = await apiFetch(`/api/orders/${orderId}/items/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Xóa món thất bại')
  return data
}
