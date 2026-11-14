import { buildApiUrl } from '../config/api'

/**
 * Gửi tin nhắn đến API Chatbot Gemini thông qua Backend Spring Boot
 * @param {string} message - Tin nhắn của khách hàng
 * @param {Array<{role: string, text: string}>} history - Lịch sử hội thoại
 * @returns {Promise<{reply: string, actionText?: string, actionUrl?: string}>}
 */
export async function sendChatMessage(message, history = []) {
  const url = buildApiUrl('/api/chat')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      history,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Lỗi máy chủ (${response.status})`)
  }

  return await response.json()
}
