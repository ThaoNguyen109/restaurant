import { getAuthHeaders, apiFetch } from './apiClient'

// 1. Lấy danh sách món ăn (có thể lọc theo categoryId, search, status)
export async function getAllMenuItems(params = {}) {
  const queryParams = new URLSearchParams()
  if (params.categoryId) queryParams.append('categoryId', params.categoryId)
  if (params.search) queryParams.append('search', params.search)
  if (params.status) queryParams.append('status', params.status)

  const queryString = queryParams.toString()
  const endpoint = queryString ? `/api/menu-items?${queryString}` : '/api/menu-items'

  const response = await apiFetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách món ăn')
  }
  return data
}

// 2. Lấy chi tiết một món ăn
export async function getMenuItemById(id) {
  const response = await apiFetch(`/api/menu-items/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải thông tin món ăn')
  }
  return data
}

// 3. Thêm món ăn mới kèm file ảnh (FormData)
export async function createMenuItem(formData) {
  const response = await apiFetch('/api/menu-items', {
    method: 'POST',
    headers: getAuthHeaders(true), // isFormData = true
    body: formData,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join(', ')
      throw new Error(errorMsg || data.message || 'Thêm món ăn thất bại')
    }
    throw new Error(data.message || 'Thêm món ăn thất bại')
  }
  return data
}

// 4. Cập nhật món ăn (FormData)
export async function updateMenuItem(id, formData) {
  const response = await apiFetch(`/api/menu-items/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: formData,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join(', ')
      throw new Error(errorMsg || data.message || 'Cập nhật món ăn thất bại')
    }
    throw new Error(data.message || 'Cập nhật món ăn thất bại')
  }
  return data
}

// 5. Cập nhật nhanh trạng thái món ăn (ACTIVE, INACTIVE, OUT_OF_STOCK)
export async function updateMenuItemStatus(id, status) {
  const response = await apiFetch(`/api/menu-items/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ status }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Cập nhật trạng thái thất bại')
  }
  return data
}

// 6. Xóa món ăn
export async function deleteMenuItem(id) {
  const response = await apiFetch(`/api/menu-items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể xóa món ăn')
  }
  return true
}
