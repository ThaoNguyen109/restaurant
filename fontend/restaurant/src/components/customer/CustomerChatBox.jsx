import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendChatMessage } from '../../services/chatService'
import '../../styles/components/CustomerChatBox.css'

/**
 * Hàm hỗ trợ định dạng text (hỗ trợ in đậm **tên món** và xuống dòng tự nhiên)
 */
function renderFormattedText(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, lineIdx) => {
    const parts = []
    let lastIndex = 0
    const boldRegex = /\*\*(.*?)\*\*/g
    let match

    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index))
      }
      parts.push(<strong key={`${lineIdx}-${match.index}`}>{match[1]}</strong>)
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex))
    }

    return (
      <span key={lineIdx} style={{ display: 'block', minHeight: line.trim() ? undefined : '0.4em' }}>
        {parts.length > 0 ? parts : '\u00A0'}
      </span>
    )
  })
}

export default function CustomerChatBox() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [unreadCount, setUnreadCount] = useState(1)
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Danh sách tin nhắn khởi tạo
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Kính chào quý khách! Em là Trợ lý Hoa Sen 🌸 được tích hợp trí tuệ nhân tạo. Em rất sẵn lòng hỗ trợ quý khách tư vấn món ngon, giải đáp về thực đơn hoặc hướng dẫn đặt bàn ạ!',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const chatBodyRef = useRef(null)
  const inputRef = useRef(null)

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, isTyping, isOpen])

  // Focus ô nhập khi mở chat trên desktop
  useEffect(() => {
    if (isOpen && !isMinimized && window.innerWidth > 640) {
      setTimeout(() => inputRef.current?.focus(), 250)
    }
  }, [isOpen, isMinimized])

  // Tự động ẩn tooltip chào sau 8 giây
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleOpenChat = () => {
    setIsOpen(true)
    setIsMinimized(false)
    setShowTooltip(false)
    setUnreadCount(0)
  }

  const handleToggleMinimize = () => {
    setIsMinimized((prev) => !prev)
  }

  const handleCloseChat = () => {
    setIsOpen(false)
  }

  // Quick replies
  const quickPrompts = [
    { label: '🍽️ Món ăn đặc sắc', query: 'Gợi ý cho tôi các món ăn đặc sắc và nổi bật nhất của nhà hàng Hoa Sen' },
    { label: '📅 Cách đặt bàn', query: 'Tôi muốn hướng dẫn đặt bàn trước' },
    { label: '🕒 Giờ mở cửa & Địa chỉ', query: 'Nhà hàng mở cửa lúc mấy giờ và ở đâu?' },
    { label: '🎁 Ưu đãi hôm nay', query: 'Nhà hàng hiện có những ưu đãi và combo hấp dẫn nào?' },
    { label: '🥗 Món thanh đạm / Chay', query: 'Nhà hàng có các món thanh đạm hoặc món chay nào không?' },
  ]

  const handleSend = async (overrideText) => {
    const textToSend = (overrideText || inputMessage).trim()
    if (!textToSend || isTyping) return

    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: nowStr,
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    if (!overrideText) setInputMessage('')
    setIsTyping(true)

    try {
      // Chuẩn bị ngữ cảnh 10 tin nhắn gần nhất
      const history = updatedMessages
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text,
        }))

      const response = await sendChatMessage(textToSend, history)

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actionText: response.actionText,
        actionUrl: response.actionUrl,
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (error) {
      console.error('Lỗi gọi Gemini AI chatbot:', error)
      const botErrMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Dạ, hiện tại đường truyền đang gián đoạn hoặc hệ thống đang được cập nhật. Quý khách có thể xem nhanh thực đơn hoặc liên hệ Hotline **(028) 3822 1234** để được tư vấn ngay ạ! 🌸',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actionText: 'Xem thực đơn',
        actionUrl: '/customer/menu',
      }
      setMessages((prev) => [...prev, botErrMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleActionClick = (url) => {
    if (!url) return
    if (url.startsWith('/customer#')) {
      const targetId = url.split('#')[1]
      navigate('/customer')
      setTimeout(() => {
        const el = document.getElementById(targetId)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    } else {
      navigate(url)
    }
    // Thu nhỏ chatbox trên di động sau khi chuyển trang
    if (window.innerWidth <= 640) {
      setIsOpen(false)
    }
  }

  return (
    <aside className="ccb-container" aria-label="Khung chat hỗ trợ khách hàng">
      {/* ── BONG BÓNG GỢI Ý CHÀO MỪNG (DESKTOP) ── */}
      {!isOpen && showTooltip && (
        <div className="ccb-welcome-bubble" onClick={handleOpenChat}>
          <div className="ccb-welcome-bubble-text">
            <strong>Trợ lý Hoa Sen 🌸</strong>
            <span>Em có thể giúp gì cho quý khách hôm nay ạ?</span>
          </div>
          <button
            className="ccb-welcome-bubble-close"
            onClick={(e) => {
              e.stopPropagation()
              setShowTooltip(false)
            }}
            title="Đóng gợi ý"
          >
            ×
          </button>
        </div>
      )}

      {/* ── NÚT NỔI LAUNCHER ── */}
      {!isOpen && (
        <button
          className="ccb-launcher-btn"
          onClick={handleOpenChat}
          title="Nhắn tin với Trợ lý AI Hoa Sen"
          aria-label="Mở khung trò chuyện hỗ trợ"
        >
          <div className="ccb-launcher-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="ccb-launcher-ripple" />
          {unreadCount > 0 && <span className="ccb-launcher-badge">{unreadCount}</span>}
        </button>
      )}

      {/* ── CỬA SỔ CHAT ── */}
      {isOpen && (
        <div className={`ccb-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Header */}
          <div className="ccb-header">
            <div className="ccb-header-info">
              <div className="ccb-avatar">
                <span>HS</span>
                <span className="ccb-online-dot" title="Đang trực tuyến" />
              </div>
              <div className="ccb-header-text">
                <div className="ccb-header-title">Trợ Lý Hoa Sen 🌸</div>
                <div className="ccb-header-status">
                  <span className="ccb-pulse-dot" />
                  Gemini AI · Trực tuyến 24/7
                </div>
              </div>
            </div>

            <div className="ccb-header-actions">
              <button
                className="ccb-header-btn"
                onClick={handleToggleMinimize}
                title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                aria-label="Thu nhỏ khung chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                className="ccb-header-btn ccb-header-close"
                onClick={handleCloseChat}
                title="Đóng chat"
                aria-label="Đóng khung chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body nội dung (ẩn khi minimize) */}
          {!isMinimized && (
            <>
              <div className="ccb-body" ref={chatBodyRef}>
                <div className="ccb-date-divider">Hôm nay</div>

                {messages.map((m) => (
                  <div key={m.id} className={`ccb-message-row ${m.sender}`}>
                    {m.sender === 'bot' && (
                      <div className="ccb-msg-avatar">HS</div>
                    )}
                    <div className="ccb-bubble-wrap">
                      <div className="ccb-bubble">
                        <div className="ccb-bubble-text">{renderFormattedText(m.text)}</div>
                        {m.actionText && (
                          <button
                            className="ccb-msg-action-btn"
                            onClick={() => handleActionClick(m.actionUrl)}
                          >
                            <span>{m.actionText}</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <span className="ccb-time">{m.time}</span>
                    </div>
                  </div>
                ))}

                {/* Hiệu ứng đang nhập tin nhắn */}
                {isTyping && (
                  <div className="ccb-message-row bot">
                    <div className="ccb-msg-avatar">HS</div>
                    <div className="ccb-bubble-wrap">
                      <div className="ccb-bubble ccb-typing-bubble">
                        <span className="ccb-dot" />
                        <span className="ccb-dot" />
                        <span className="ccb-dot" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick suggestions pills */}
              <div className="ccb-quick-prompts">
                <div className="ccb-quick-scroll">
                  {quickPrompts.map((p) => (
                    <button
                      key={p.label}
                      className="ccb-quick-chip"
                      onClick={() => handleSend(p.query)}
                      disabled={isTyping}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Footer */}
              <div className="ccb-footer">
                <div className="ccb-input-wrap">
                  <input
                    ref={inputRef}
                    type="text"
                    className="ccb-input"
                    placeholder="Hỏi về món ăn, giá tiền, đặt bàn..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping}
                  />
                  <button
                    className="ccb-send-btn"
                    onClick={() => handleSend()}
                    disabled={!inputMessage.trim() || isTyping}
                    title="Gửi tin nhắn"
                    aria-label="Gửi tin nhắn"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
                <div className="ccb-footer-sub">
                  Hotline đặt tiệc & hỗ trợ nhanh: <strong>(028) 3822 1234</strong>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
