import { useEffect, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated, hasRole, logout } from '../utils/auth'

/**
 * Component bảo vệ route:
 * - Nếu chưa đăng nhập hoặc token hết hạn → redirect về "/" kèm thông báo
 * - Nếu không có quyền → redirect về "/" kèm thông báo
 * - Nếu hợp lệ → render children
 *
 * @param {React.ReactNode} children - Component con cần bảo vệ
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập (rỗng = tất cả role)
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const checked = useRef(false)

  // Kiểm tra token có tồn tại và còn hạn
  if (!isAuthenticated()) {
    if (!checked.current) {
      checked.current = true
      sessionStorage.setItem('authMessage', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
    }
    return <Navigate to="/" replace />
  }

  // Kiểm tra role có quyền truy cập trang này không
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    if (!checked.current) {
      checked.current = true
      sessionStorage.setItem('authMessage', 'Bạn không có quyền truy cập trang này.')
    }
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
