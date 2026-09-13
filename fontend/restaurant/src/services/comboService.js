import { getAuthHeaders, apiFetch } from './apiClient'

// 1. Lấy danh sách combo
export async function getAllCombos() {
  const response = await apiFetch('/api/combos', {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải danh sách combo')
  }
  return data
}

// 2. Lấy chi tiết combo theo ID
export async function getComboById(id) {
  const response = await apiFetch(`/api/combos/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải thông tin combo')
  }
  return data
}

// 3. Thêm combo mới (FormData: name, description, price, status, image, itemsJson)
export async function createCombo(formData) {
  const response = await apiFetch('/api/combos', {
    method: 'POST',
    headers: getAuthHeaders(true), // isFormData = true để trình duyệt tự set multipart boundary
    body: formData,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join(', ')
      throw new Error(errorMsg || data.message || 'Thêm combo thất bại')
    }
    throw new Error(data.message || 'Thêm combo thất bại')
  }
  return data
}

// 4. Cập nhật combo (FormData)
export async function updateCombo(id, formData) {
  const response = await apiFetch(`/api/combos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(true),
    body: formData,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (data.errors) {
      const errorMsg = Object.values(data.errors).join(', ')
      throw new Error(errorMsg || data.message || 'Cập nhật combo thất bại')
    }
    throw new Error(data.message || 'Cập nhật combo thất bại')
  }
  return data
}

// 5. Xóa mềm combo
export async function deleteCombo(id) {
  const response = await apiFetch(`/api/combos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể xóa combo')
  }
  return true
}

// 6. Lấy danh sách món trong combo
export async function getComboItems(comboId) {
  const response = await apiFetch(`/api/combos/${comboId}/items`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể tải món trong combo')
  }
  return data
}

// 7. Thêm 1 món vào combo
export async function addComboItem(comboId, menuItemId, quantity = 1) {
  const response = await apiFetch(`/api/combos/${comboId}/items`, {
    method: 'POST',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ menuItemId, quantity }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể thêm món vào combo')
  }
  return data
}

// 8. Cập nhật số lượng món trong combo
export async function updateComboItemQuantity(comboId, menuItemId, quantity) {
  const response = await apiFetch(`/api/combos/${comboId}/items/${menuItemId}`, {
    method: 'PUT',
    headers: getAuthHeaders(false),
    body: JSON.stringify({ quantity }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật số lượng món')
  }
  return data
}

// 9. Xóa món khỏi combo
export async function removeComboItem(comboId, menuItemId) {
  const response = await apiFetch(`/api/combos/${comboId}/items/${menuItemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Không thể xóa món khỏi combo')
  }
  return true
}

// 10. Đặt/Thay thế tất cả món trong combo
export async function setComboItems(comboId, items) {
  const response = await apiFetch(`/api/combos/${comboId}/items`, {
    method: 'PUT',
    headers: getAuthHeaders(false),
    body: JSON.stringify(items),
  })

  const data = await response.json().catch(() => [])
  if (!response.ok) {
    throw new Error(data.message || 'Không thể cập nhật danh sách món trong combo')
  }
  return data
}
