import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createReservation } from '../../services/reservationService'
import CustomerChatBox from '../../components/customer/CustomerChatBox'
import { LotusLogo } from './CustomerPage'
import '../../styles/pages/customer/CustomerReservationPage.css'

export default function CustomerReservationPage() {
  const todayStr = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: todayStr,
    time: '18:30',
    guests: '2',
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(null)

  const quickNoteTags = [
    'Bàn view Hồ Tây lộng gió',
    'Phòng VIP riêng tư',
    'Thưởng trà sen Bách Diệp',
    'Tổ chức tiệc sinh nhật',
    'Kỷ niệm ngày cưới',
    'Có ghế trẻ em',
    'Thực đơn ăn chay thanh tịnh',
  ]

  // Cuộn lên đầu trang khi vào trang
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddQuickNote = (tag) => {
    setForm((prev) => {
      const current = prev.note.trim()
      if (!current) return { ...prev, note: tag }
      if (current.includes(tag)) return prev
      return { ...prev, note: `${current}, ${tag}` }
    })
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Vui lòng nhập họ và tên của quý khách'
    }

    if (!form.phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại liên lạc'
    } else if (!/^(\+84|0)[0-9]{8,10}$/.test(form.phone.trim())) {
      errs.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)'
    }

    if (!form.email.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email nhận xác nhận'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Email không hợp lệ (VD: hoasen.guest@gmail.com)'
    }

    if (!form.date) {
      errs.date = 'Vui lòng chọn ngày dùng bữa'
    }

    if (!form.time) {
      errs.time = 'Vui lòng chọn khung giờ đón tiếp'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim(),
        reservationDate: form.date,
        reservationTime: form.time,
        numberOfGuests: Number(form.guests),
        note: form.note.trim() || null,
      }

      const res = await createReservation(payload)
      setBookingSuccess(res)
      window.scrollTo({ top: 120, behavior: 'smooth' })
    } catch (err) {
      setErrorMsg(err.message || 'Đặt bàn không thành công. Quý khách vui lòng thử lại hoặc gọi hotline Tây Hồ.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setBookingSuccess(null)
    setForm({
      name: '',
      phone: '',
      email: '',
      date: todayStr,
      time: '18:30',
      guests: '2',
      note: '',
    })
    setErrors({})
    setErrorMsg('')
  }

  return (
    <div className="crp-page">
      {/* ── NAVBAR ── */}
      <nav className="crp-nav">
        <Link to="/customer" className="crp-nav-brand">
          <div className="crp-nav-brand-icon">
            <LotusLogo size={34} />
          </div>
          <div className="crp-nav-brand-text">
            <span className="crp-nav-brand-name">Hoa Sen</span>
            <small className="crp-nav-brand-sub">Ẩm Thực Hà Thành · Tây Hồ</small>
          </div>
        </Link>

        <div className="crp-nav-links">
          <Link to="/customer" className="crp-nav-link">Trang chủ</Link>
          <Link to="/customer#about" className="crp-nav-link">Giới thiệu</Link>
          <Link to="/customer/menu" className="crp-nav-link">Thực đơn</Link>
          <span className="crp-nav-badge">Đặt bàn trực tuyến</span>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <header className="crp-header">
        <div className="crp-header-container">
          <span className="crp-tag">Đặt bàn trực tuyến</span>
          <h1>Đặt Bàn Trải Nghiệm Ẩm Thực</h1>
          <p className="crp-header-desc">
            Kính mời quý khách đặt chỗ trước để Nhà Hàng Hoa Sen chuẩn bị vị trí ngồi đẹp nhất bên làn gió mát lành của Hồ Tây
          </p>
          <div className="crp-header-meta">
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Số 68 Phố Quảng Bá, Q. Tây Hồ, Hà Nội
            </span>
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Hotline: (024) 3719 8899 · (024) 3828 1234
            </span>
            <span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              09:30 – 22:30 hàng ngày
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="crp-main">
        <div className="crp-layout">
          {/* Cột trái: Form đặt bàn */}
          <div className="crp-form-card">
            {bookingSuccess ? (
              <div className="crp-success-view">
                <div className="crp-success-icon-wrap">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2>Đặt Bàn Thành Công!</h2>
                <p className="crp-success-intro">
                  Trân trọng cảm ơn quý khách <strong>{bookingSuccess.customerName}</strong> đã đặt bàn tại Nhà Hàng Hoa Sen Tây Hồ.
                </p>

                <div className="crp-ticket">
                  <div className="crp-ticket-code">
                    Mã đặt bàn: <strong>#{bookingSuccess.id}</strong>
                  </div>
                  <div className="crp-ticket-grid">
                    <div className="crp-ticket-item">
                      <span className="lbl">Số điện thoại</span>
                      <span className="val">{bookingSuccess.customerPhone}</span>
                    </div>
                    <div className="crp-ticket-item">
                      <span className="lbl">Email nhận tin</span>
                      <span className="val">{bookingSuccess.customerEmail || '—'}</span>
                    </div>
                    <div className="crp-ticket-item">
                      <span className="lbl">Ngày dùng bữa</span>
                      <span className="val">{bookingSuccess.reservationDate}</span>
                    </div>
                    <div className="crp-ticket-item">
                      <span className="lbl">Giờ đến</span>
                      <span className="val">{bookingSuccess.reservationTime?.substring(0, 5)}</span>
                    </div>
                    <div className="crp-ticket-item">
                      <span className="lbl">Số khách</span>
                      <span className="val">{bookingSuccess.numberOfGuests} người</span>
                    </div>
                    <div className="crp-ticket-item">
                      <span className="lbl">Ghi chú</span>
                      <span className="val">{bookingSuccess.note || 'Không có'}</span>
                    </div>
                  </div>
                </div>

                <div className="crp-success-reminder">
                  Nhân viên chăm sóc khách hàng của Hoa Sen sẽ gọi điện xác nhận trong vòng 15 phút. Nhà hàng giữ bàn cho quý khách trong 15 phút kể từ giờ hẹn.
                </div>

                <div className="crp-success-actions">
                  <button type="button" className="crp-btn-secondary" onClick={handleReset}>
                    Đặt Thêm Bàn Khác
                  </button>
                  <Link to="/customer/menu" className="crp-btn-primary">
                    Xem Thực Đơn Hà Thành
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="crp-form">
                <div className="crp-form-title-box">
                  <h3>Thông Tin Đặt Bàn</h3>
                  <p>Vui lòng điền thông tin để chúng tôi phục vụ chu đáo nhất</p>
                </div>

                {errorMsg && (
                  <div className="crp-error-banner">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="crp-form-row">
                  <div className="crp-field">
                    <label>Họ và tên của quý khách *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="VD: Nguyễn Tuấn Anh"
                    />
                    {errors.name && <span className="crp-field-error">{errors.name}</span>}
                  </div>

                  <div className="crp-field">
                    <label>Số điện thoại liên lạc *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="VD: 0912 345 678"
                    />
                    {errors.phone && <span className="crp-field-error">{errors.phone}</span>}
                  </div>
                </div>

                <div className="crp-field">
                  <label>Địa chỉ Email nhận thông tin xác nhận *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="VD: khachhang.hanoi@gmail.com"
                  />
                  {errors.email && <span className="crp-field-error">{errors.email}</span>}
                </div>

                <div className="crp-form-row">
                  <div className="crp-field">
                    <label>Ngày dùng bữa *</label>
                    <input
                      type="date"
                      name="date"
                      min={todayStr}
                      value={form.date}
                      onChange={handleChange}
                    />
                    {errors.date && <span className="crp-field-error">{errors.date}</span>}
                  </div>

                  <div className="crp-field">
                    <label>Khung giờ đón tiếp *</label>
                    <select name="time" value={form.time} onChange={handleChange}>
                      <option value="">-- Chọn khung giờ --</option>
                      <optgroup label="Buổi trưa (11:00 – 14:00)">
                        <option value="11:00">11:00 (Trưa)</option>
                        <option value="11:30">11:30 (Trưa)</option>
                        <option value="12:00">12:00 (Trưa)</option>
                        <option value="12:30">12:30 (Trưa)</option>
                        <option value="13:00">13:00 (Trưa)</option>
                        <option value="13:30">13:30 (Trưa)</option>
                      </optgroup>
                      <optgroup label="Buổi tối (17:30 – 21:30)">
                        <option value="17:30">17:30 (Tối)</option>
                        <option value="18:00">18:00 (Tối)</option>
                        <option value="18:30">18:30 (Tối)</option>
                        <option value="19:00">19:00 (Tối)</option>
                        <option value="19:30">19:30 (Tối)</option>
                        <option value="20:00">20:00 (Tối)</option>
                        <option value="20:30">20:30 (Tối)</option>
                        <option value="21:00">21:00 (Tối)</option>
                      </optgroup>
                    </select>
                    {errors.time && <span className="crp-field-error">{errors.time}</span>}
                  </div>
                </div>

                <div className="crp-field">
                  <label>Số lượng khách tham dự *</label>
                  <select name="guests" value={form.guests} onChange={handleChange}>
                    <option value="1">1 người (Bàn đơn thanh tịnh)</option>
                    <option value="2">2 người (Bàn đôi lãng mạn ngắm hồ)</option>
                    <option value="3">3 người</option>
                    <option value="4">4 người (Gia đình nhỏ ấm cúng)</option>
                    <option value="5">5 người</option>
                    <option value="6">6 người (Nhóm bạn / Gia đình)</option>
                    <option value="8">8 người (Tiệc thân mật)</option>
                    <option value="10">10 người (Bàn tiệc dài)</option>
                    <option value="15">15 người (Phòng riêng VIP Tây Hồ)</option>
                    <option value="20">20+ người (Tiệc đoàn / Sự kiện)</option>
                  </select>
                </div>

                <div className="crp-field">
                  <label>Yêu cầu hoặc ghi chú đặc biệt (Tùy chọn)</label>
                  <textarea
                    name="note"
                    rows="3"
                    value={form.note}
                    onChange={handleChange}
                    placeholder="VD: Bàn ngoài ban công ven hồ, chuẩn bị ghế trẻ em, kỷ niệm sinh nhật, thưởng trà sen..."
                  />
                  <div className="crp-quick-chips">
                    <span className="crp-chip-title">Gợi ý nhanh:</span>
                    {quickNoteTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="crp-chip"
                        onClick={() => handleAddQuickNote(tag)}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="submit" className="crp-submit-btn" disabled={submitting}>
                  {submitting ? 'Đang gửi thông tin...' : 'Xác Nhận Đặt Bàn Ngay'}
                </button>
              </form>
            )}
          </div>

          {/* Cột phải: Thông tin & Lợi ích */}
          <aside className="crp-aside">
            <div className="crp-info-card">
              <h4>Tại Sao Nên Đặt Bàn Trước?</h4>
              <ul className="crp-benefits">
                <li>
                  <div className="crp-benefit-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div>
                    <strong>Giữ vị trí đẹp nhất</strong>
                    <p>Ưu tiên sắp xếp bàn có tầm nhìn thoáng đãng hướng ra mặt nước Hồ Tây thơ mộng.</p>
                  </div>
                </li>
                <li>
                  <div className="crp-benefit-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div>
                    <strong>Chuẩn bị chu đáo, không phải chờ đợi</strong>
                    <p>Bếp và nhân viên phục vụ sẵn sàng đón tiếp ngay khi quý khách bước vào nhà hàng.</p>
                  </div>
                </li>
                <li>
                  <div className="crp-benefit-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <div>
                    <strong>Phòng tiệc VIP riêng tư</strong>
                    <p>Phù hợp cho các buổi tiệc gia đình, gặp mặt bạn bè và tiếp đãi đối tác quan trọng.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="crp-contact-box">
              <h4>Cần Hỗ Trợ Gấp?</h4>
              <p>Quý khách cần đặt tiệc đoàn trên 20 người hoặc yêu cầu đặc biệt, xin vui lòng liên hệ hotline trực tiếp:</p>
              <a href="tel:02437198899" className="crp-phone-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                (024) 3719 8899
              </a>
              <span className="crp-contact-sub">Phục vụ 24/7 từ thứ 2 đến Chủ nhật</span>
            </div>
          </aside>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="crp-footer">
        <p>© 2026 Nhà Hàng Hoa Sen Hà Nội. Tất cả quyền được bảo lưu.</p>
        <p>Số 68 Phố Quảng Bá, Q. Tây Hồ, Hà Nội &nbsp;·&nbsp; Hotline: (024) 3719 8899 &nbsp;·&nbsp; 09:30 – 22:30</p>
      </footer>

      <CustomerChatBox />
    </div>
  )
}
