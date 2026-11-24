import { getAuthHeaders, apiFetch } from './apiClient'

// 1. Lấy danh sách khuyến mãi đang hoạt động (Public / Customer / Staff)
export async function getActivePromotions() {
  const response = await apiFetch('/api/promotions', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách khuyến mãi')
  }
  return data
}

// 2. Lấy toàn bộ danh sách khuyến mãi (Dành cho Admin / Manager)
export async function getAllPromotions() {
  const response = await apiFetch('/api/promotions/all', {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách khuyến mãi')
  }
  return data
}

// 3. Chi tiết khuyến mãi theo ID
export async function getPromotionById(id) {
  const response = await apiFetch(`/api/promotions/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải thông tin khuyến mãi')
  }
  return data
}

// 4. Tạo mới khuyến mãi
export async function createPromotion(payload) {
  const response = await apiFetch('/api/promotions', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo chương trình khuyến mãi')
  }
  return data
}

// 5. Cập nhật khuyến mãi
export async function updatePromotion(id, payload) {
  const response = await apiFetch(`/api/promotions/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật chương trình khuyến mãi')
  }
  return data
}

// 6. Xóa khuyến mãi
export async function deletePromotion(id) {
  const response = await apiFetch(`/api/promotions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể xóa khuyến mãi')
  }
  return true
}

// 7. Bật / Tắt trạng thái khuyến mãi (ACTIVE / INACTIVE)
export async function togglePromotionStatus(id) {
  const response = await apiFetch(`/api/promotions/${id}/toggle-status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể đổi trạng thái khuyến mãi')
  }
  return data
}

// 8. Tính toán giảm giá theo Strategy Pattern (Public / Realtime)
export async function calculatePromotion({ code, orderTotal, orderId }) {
  const response = await apiFetch('/api/promotions/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: code ? code.trim() : '',
      orderTotal: Number(orderTotal) || 0,
      orderId: orderId || null,
    }),
  })
  const data = await response.json().catch(() => ({}))
  return data
}

// 9. Áp dụng mã khuyến mãi vào đơn hàng
export async function applyPromotionToOrder(orderId, code) {
  const response = await apiFetch(`/api/promotions/order/${orderId}/apply?code=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể áp dụng mã khuyến mãi vào đơn hàng')
  }
  return data
}
