import { buildApiUrl } from '../config/api'

export async function loginUser(credentials) {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại')
  }

  return data
}
