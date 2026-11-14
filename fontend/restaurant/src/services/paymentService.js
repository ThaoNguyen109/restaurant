import { getAuthHeaders, apiFetch } from './apiClient'

/**
 * Tạo URL thanh toán VNPay Sandbox
 * @param {{ orderId: number, amount?: number, bankCode?: string, orderInfo?: string }} payload
 */
export async function createVNPayUrl(payload) {
  const response = await apiFetch('/api/payment/vnpay/create', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo liên kết thanh toán VNPay')
  }
  return data
}

/**
 * Xác thực kết quả thanh toán từ VNPay callback
 * @param {string} searchParamsString chuỗi query string (ví dụ: ?vnp_Amount=...&vnp_SecureHash=...)
 */
export async function verifyVNPayCallback(searchParamsString) {
  const endpoint = `/api/payment/vnpay/callback${searchParamsString.startsWith('?') ? searchParamsString : `?${searchParamsString}`}`
  const response = await apiFetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Lỗi kiểm tra trạng thái thanh toán VNPay')
  }
  return data
}

/**
 * Xử lý thanh toán hóa đơn (Tiền mặt / Chuyển khoản / Cà thẻ) và lưu vào bảng payments
 * @param {{ orderId: number, amount: number, paymentMethod: string, cashGiven?: number, changeAmount?: number, discountAmount?: number, discountPercent?: number, note?: string }} payload
 */
export async function processPaymentCheckout(payload) {
  const response = await apiFetch('/api/payment/checkout', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Thanh toán hóa đơn thất bại')
  }
  return data
}

/**
 * Lấy lịch sử giao dịch thanh toán của một đơn hàng
 * @param {number} orderId
 */
export async function getPaymentsByOrder(orderId) {
  const response = await apiFetch(`/api/payment/order/${orderId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải lịch sử thanh toán')
  }
  return data
}

/**
 * Lấy toàn bộ lịch sử thanh toán
 */
export async function getAllPayments() {
  const response = await apiFetch('/api/payment', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách thanh toán')
  }
  return data
}
