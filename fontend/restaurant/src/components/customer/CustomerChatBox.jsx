import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './CustomerChatBox.css'

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
      text: 'Kính chào quý khách! Em là Trợ lý Hoa Sen 🌸. Em rất sẵn lòng hỗ trợ quý khách tư vấn món ngon, đặt bàn hoặc giải đáp thắc mắc ạ!',
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
    { label: '🍽️ Món ăn đặc sắc', query: 'Gợi ý món ăn đặc sắc của nhà hàng' },
    { label: '📅 Cách đặt bàn', query: 'Tôi muốn hướng dẫn đặt bàn trước' },
    { label: '🕒 Giờ mở cửa', query: 'Nhà hàng mở cửa lúc mấy giờ?' },
    { label: '🎁 Ưu đãi hôm nay', query: 'Nhà hàng đang có ưu đãi gì không?' },
    { label: '🥗 Có món chay không?', query: 'Nhà hàng có món chay không?' },
  ]

  // Trả lời thông minh
  const generateBotReply = (userText) => {
    const lower = userText.toLowerCase().trim()

    if (lower.includes('đặt bàn') || lower.includes('giữ chỗ') || lower.includes('booking') || lower.includes('bàn')) {
      return {
        text: 'Quý khách có thể đặt bàn trực tuyến rất nhanh tại mục "Đặt bàn ngay" hoặc liên hệ Hotline: (028) 3822 1234. Nhà hàng nhận đặt bàn tiệc gia đình, sinh nhật với nhiều ưu đãi hấp dẫn ạ!',
        actionText: 'Đặt bàn ngay bây giờ',
        actionUrl: '/customer#reservation',
      }
    }

    if (lower.includes('món') || lower.includes('thực đơn') || lower.includes('menu') || lower.includes('ăn gì') || lower.includes('gợi ý')) {
      return {
        text: 'Nhà hàng Hoa Sen nổi tiếng với các món trứ danh: Bò Tơ Cuộn Rau Rừng, Lẩu Cua Đồng Hoa Sen, Gỏi Ngó Sen Tôm Thịt, Nem Nướng Phố Cổ và Cá Chẽm Hấp Hồng Kông. Quý khách có thể xem toàn bộ thực đơn kèm ảnh và giá tại trang Thực đơn nhé!',
        actionText: 'Xem toàn bộ thực đơn',
        actionUrl: '/customer/menu',
      }
    }

    if (lower.includes('giờ') || lower.includes('mở cửa') || lower.includes('đóng cửa') || lower.includes('thời gian')) {
      return {
        text: 'Nhà hàng Hoa Sen mở cửa phục vụ từ 10:00 sáng đến 22:30 tối tất cả các ngày trong tuần (kể cả Thứ 7, Chủ nhật và ngày Lễ Tết) ạ!',
      }
    }

    if (lower.includes('ở đâu') || lower.includes('địa chỉ') || lower.includes('chi nhánh') || lower.includes('vị trí')) {
      return {
        text: 'Nhà hàng Hoa Sen tọa lạc tại Trung tâm TP. Hồ Chí Minh với không gian đỗ xe ô tô và xe máy rộng rãi, an toàn, có nhân viên hướng dẫn tận tình ạ!',
      }
    }

    if (lower.includes('khuyến mãi') || lower.includes('ưu đãi') || lower.includes('giảm giá') || lower.includes('voucher')) {
      return {
        text: 'Hiện tại Hoa Sen đang có ưu đãi: Tặng món tráng miệng đặc sắc cho bàn đặt trước từ 4 khách và giảm 10% cho khách hàng sinh nhật trong tháng khi đặt trước ạ!',
      }
    }

    if (lower.includes('chay') || lower.includes('rau') || lower.includes('thanh đạm')) {
      return {
        text: 'Dạ Hoa Sen có thực đơn chay thanh tịnh phong phú được chế biến từ các loại nấm tươi thượng hạng và rau củ hữu cơ tươi ngon mỗi ngày ạ!',
        actionText: 'Xem thực đơn',
        actionUrl: '/customer/menu',
      }
    }

    if (lower.includes('giá') || lower.includes('bao nhiêu') || lower.includes('chi phí')) {
      return {
        text: 'Các món ăn tại nhà hàng có mức giá dao động hợp lý từ 45.000đ – 380.000đ/món với nguyên liệu tươi ngon chọn lọc. Quý khách có thể xem giá chi tiết của từng món tại trang Thực đơn ạ!',
        actionText: 'Xem bảng giá thực đơn',
        actionUrl: '/customer/menu',
      }
    }

    if (lower.includes('chào') || lower.includes('hello') || lower.includes('hi')) {
      return {
        text: 'Chào quý khách ạ! Quý khách cần em tư vấn món ăn cho mấy người hay muốn đặt bàn cho dịp đặc biệt nào ạ?',
      }
    }

    if (lower.includes('cảm ơn') || lower.includes('thanks') || lower.includes('thank')) {
      return {
        text: 'Dạ không có gì ạ! Hoa Sen rất hân hạnh được phục vụ quý khách. Chúc quý khách một ngày tràn ngập niềm vui và ngon miệng! 🌸',
      }
    }

    return {
      text: 'Dạ em đã ghi nhận câu hỏi của quý khách. Chuyên viên tư vấn của Hoa Sen luôn sẵn sàng hỗ trợ trực tiếp qua Hotline (028) 3822 1234 hoặc quý khách có thể gửi câu hỏi tại đây ạ!',
    }
  }

  const handleSend = (overrideText) => {
    const textToSend = overrideText || inputMessage.trim()
    if (!textToSend) return

    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: nowStr,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!overrideText) setInputMessage('')
    setIsTyping(true)

    // Giả lập bot trả lời sau 600 - 1000ms
    setTimeout(() => {
      const replyData = generateBotReply(textToSend)
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyData.text,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        actionText: replyData.actionText,
        actionUrl: replyData.actionUrl,
      }
      setIsTyping(false)
      setMessages((prev) => [...prev, botMsg])
    }, 750)
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
          title="Nhắn tin với nhà hàng Hoa Sen"
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
                  Trực tuyến · Sẵn sàng hỗ trợ
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
                        <p className="ccb-bubble-text">{m.text}</p>
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
                    placeholder="Nhập câu hỏi hoặc yêu cầu..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    className="ccb-send-btn"
                    onClick={() => handleSend()}
                    disabled={!inputMessage.trim()}
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
