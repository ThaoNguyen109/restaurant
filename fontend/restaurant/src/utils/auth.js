/**
 * Helpers xác thực - parse JWT token phía client, kiểm tra quyền, đăng xuất
 */

/**
 * Lấy token từ localStorage
 */
export function getToken() {
  return localStorage.getItem('token')
}

/**
 * Lấy role của user hiện tại
 */
export function getRole() {
  return localStorage.getItem('userRole') || null
}

/**
 * Lấy username của user hiện tại
 */
export function getUsername() {
  return localStorage.getItem('username') || null
}

/**
 * Parse payload của JWT token (không verify signature phía client)
 */
function parseJwtPayload(token) {
  try {
    const base64 = token.split('.')[1]
    const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Kiểm tra token có hết hạn chưa (kiểm tra phía client)
 * @returns {boolean} true nếu token đã hết hạn hoặc không hợp lệ
 */
export function isTokenExpired() {
  const token = getToken()
  if (!token) return true

  const payload = parseJwtPayload(token)
  if (!payload || !payload.exp) return true

  // exp là Unix timestamp tính bằng giây
  return Date.now() >= payload.exp * 1000
}

/**
 * Kiểm tra user đã đăng nhập và token còn hợp lệ
 */
export function isAuthenticated() {
  return getToken() !== null && !isTokenExpired()
}

/**
 * Kiểm tra user có role được phép không
 * @param {string[]} allowedRoles - Danh sách role được phép
 */
export function hasRole(allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  const role = getRole()
  if (!role) return false
  return allowedRoles.includes(role.toUpperCase())
}

/**
 * Đăng xuất: xóa dữ liệu trong localStorage
 * @param {string} [reason] - Lý do đăng xuất (sẽ hiển thị ở trang Login)
 */
export function logout(reason) {
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  localStorage.removeItem('username')

  if (reason) {
    sessionStorage.setItem('authMessage', reason)
  }

  // Redirect về trang login
  window.location.href = '/'
}
