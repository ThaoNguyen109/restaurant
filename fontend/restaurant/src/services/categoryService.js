import { buildApiUrl } from '../config/api'
import { getAuthHeaders } from './apiClient'

// 1. Lấy tất cả danh mục
export async function getAllCategories() {
  const response = await fetch(buildApiUrl('/api/categories'), {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách danh mục')
  }
  return data
}

// 2. Lấy chi tiết danh mục theo ID
export async function getCategoryById(id) {
  const response = await fetch(buildApiUrl(`/api/categories/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải thông tin danh mục')
  }
  return data
}

// 3. Tạo danh mục mới
export async function createCategory(categoryData) {
  const response = await fetch(buildApiUrl('/api/categories'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tạo danh mục')
  }
  return data
}

// 4. Cập nhật danh mục
export async function updateCategory(id, categoryData) {
  const response = await fetch(buildApiUrl(`/api/categories/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(categoryData),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật danh mục')
  }
  return data
}

// 5. Xóa danh mục
export async function deleteCategory(id) {
  const response = await fetch(buildApiUrl(`/api/categories/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể xóa danh mục')
  }
  return true
}
