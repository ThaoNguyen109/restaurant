import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CustomerPage.css'
import { createReservation } from '../../services/reservationService'

/* ── Helpers ── */
function scrollToSection(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

/* ════════════════════════════════
   NAVBAR
════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`cp-navbar${scrolled ? ' scrolled' : ''}`} id="cp-navbar">
      <Link to="/customer" className="cp-nav-logo">
        <div className="cp-nav-logo-icon">🍜</div>
        <span className="cp-nav-logo-text">Nhà Hàng Hoa Sen</span>
      </Link>

      <ul className={`cp-nav-links ${menuOpen ? 'open' : ''}`}>
        <li>
          <a href="#hero" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollToSection('hero') }}>
            Trang chủ
          </a>
        </li>
        <li>
          <a href="#about" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollToSection('about') }}>
            Giới thiệu
          </a>
        </li>
        <li>
          <Link to="/menu" onClick={() => setMenuOpen(false)} style={{ color: 'var(--gold-light)', fontWeight: 600 }}>
            📖 Thực đơn
          </Link>
        </li>
        <li>
          <a
            href="#reservation"
            onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollToSection('reservation') }}
            className="cp-nav-cta"
          >
            🗓 Đặt bàn
          </a>
        </li>
      </ul>

      <button
        className="cp-nav-hamburger"
        id="cp-hamburger-btn"
        aria-label="Mở menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span><span></span><span></span>
      </button>
    </nav>
  )
}

/* ════════════════════════════════
   HERO
════════════════════════════════ */
function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="cp-hero" id="hero">
      <div className="cp-hero-bg"></div>
      <div className="cp-hero-overlay"></div>

      <div className="cp-hero-content">
        <div className="cp-hero-badge">
          <span></span>
          Nhà hàng Hoa Sen – Tinh hoa ẩm thực
        </div>
        <h1>
          Tinh Hoa Ẩm Thực<br />Việt Nam
        </h1>
        <p className="cp-hero-subtitle">Nơi hương vị truyền thống gặp gỡ nghệ thuật hiện đại</p>
        <p className="cp-hero-desc">
          Chúng tôi mang đến những trải nghiệm ẩm thực độc đáo với nguyên liệu tươi ngon chọn lọc
          mỗi ngày và không gian sang trọng ấm cúng giữa lòng thành phố.
        </p>
        <div className="cp-hero-actions">
          <button className="cp-btn-primary" id="cp-hero-book-btn" onClick={() => scrollToSection('reservation')}>
            🗓 Đặt Bàn Ngay
          </button>
          <button className="cp-btn-secondary" id="cp-hero-menu-btn" onClick={() => navigate('/menu')}>
            📖 Khám Phá Thực Đơn →
          </button>
        </div>
      </div>

      <div className="cp-hero-scroll">
        <div className="cp-scroll-line"></div>
        Cuộn xuống
      </div>
    </section>
  )
}

/* ── Stats Bar ── */
function StatsBar() {
  const stats = [
    { number: '14+', label: 'Năm hoạt động' },
    { number: '100+', label: 'Món ăn đặc sắc' },
    { number: '50K+', label: 'Khách hàng hài lòng' },
    { number: '4.9★', label: 'Đánh giá trung bình' },
  ]

  return (
    <div className="cp-stats" id="cp-stats">
      {stats.map((s, i) => (
        <div className="cp-stat-item" key={i}>
          <div className="cp-stat-number">{s.number}</div>
          <div className="cp-stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ════════════════════════════════
   ABOUT
════════════════════════════════ */
function AboutSection() {
  const features = [
    { icon: '🌿', title: 'Nguyên liệu tươi', desc: 'Chọn lọc mỗi buổi sáng từ các nhà cung cấp uy tín nhất' },
    { icon: '👨‍🍳', title: 'Đầu bếp 5 sao', desc: 'Đội ngũ đầu bếp tâm huyết hơn 15 năm kinh nghiệm ẩm thực' },
    { icon: '🏡', title: 'Không gian riêng tư', desc: 'Phòng VIP sang trọng và không gian lý tưởng cho mọi dịp' },
    { icon: '🎵', title: 'Âm nhạc sống', desc: 'Biểu diễn nhạc truyền thống mỗi tối từ 18:00 - 21:00' },
  ]

  return (
    <section className="cp-about" id="about">
      <div className="cp-about-grid">
        <div className="cp-about-text">
          <span className="cp-section-tag">Về chúng tôi</span>
          <h2 className="cp-section-title">
            Câu Chuyện Về<br />Nhà Hàng Hoa Sen
          </h2>
          <div className="cp-section-divider"></div>
          <p>
            Thành lập từ năm 2010, Nhà hàng Hoa Sen tự hào là điểm đến ẩm thực hàng đầu tại trung
            tâm thành phố. Chúng tôi mang sứ mệnh bảo tồn và phát huy những giá trị ẩm thực truyền
            thống Việt Nam trong từng món ăn.
          </p>
          <p>
            Mỗi món ăn là một tác phẩm được chăm chút tỉ mỉ từ khâu lựa chọn nguyên liệu, nêm nếm
            gia vị đến phong cách trình bày đẳng cấp.
          </p>
          <div className="cp-about-features">
            {features.map((f, i) => (
              <div className="cp-feature-card" key={i}>
                <div className="cp-feature-icon">{f.icon}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="cp-about-image">
          <img
            src="/hero_restaurant.png"
            alt="Không gian nhà hàng Hoa Sen"
            className="cp-about-img-main"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
            }}
          />
          <div className="cp-about-img-badge">
            <div className="number">14+</div>
            <div className="label">Năm phát triển</div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   MENU CTA SECTION (ĐẸP, KHÔNG TẢI API)
════════════════════════════════ */
function MenuCTASection() {
  const navigate = useNavigate()

  const highlights = [
    { icon: '🍜', name: 'Phở Bò Đặc Biệt', cat: 'Món chính' },
    { icon: '🥗', name: 'Gỏi Cuốn Tôm Thịt', cat: 'Khai vị' },
    { icon: '🍲', name: 'Lẩu Thái Hải Sản', cat: 'Đặc biệt' },
    { icon: '🍵', name: 'Trà Hoa Sen Đặc Biệt', cat: 'Đồ uống' },
  ]

  return (
    <section className="cp-menu-cta" id="menu">
      <div className="cp-menu-cta-inner">
        {/* Cột trái – text */}
        <div className="cp-menu-cta-text">
          <span className="cp-section-tag">Thực đơn đặc sắc</span>
          <h2 className="cp-section-title">
            Hương Vị Tinh Tuyển<br />Dành Cho Thực Khách
          </h2>
          <div className="cp-section-divider"></div>
          <p className="cp-menu-cta-desc">
            Khám phá hàng trăm món ăn trứ danh được chế biến từ nguồn nguyên liệu thượng hạng
            chọn lọc mỗi ngày. Từ khai vị thanh đạm đến món chính đậm đà — mỗi tác phẩm ẩm thực
            đều là một hành trình hương vị tuyệt vời.
          </p>

          <div className="cp-menu-cta-pills">
            {['Khai vị', 'Món chính', 'Lẩu & Nướng', 'Đồ uống', 'Tráng miệng'].map((c) => (
              <span key={c} className="cp-menu-cta-pill">{c}</span>
            ))}
          </div>

          <button
            className="cp-btn-primary"
            style={{ marginTop: '32px', padding: '14px 40px', fontSize: '15px' }}
            onClick={() => navigate('/menu')}
            id="cp-menu-cta-btn"
          >
            📖 Xem Toàn Bộ Thực Đơn →
          </button>
        </div>

        {/* Cột phải – cards nổi */}
        <div className="cp-menu-cta-visual">
          {highlights.map((h, i) => (
            <div
              key={h.name}
              className="cp-menu-cta-card"
              style={{ '--delay': `${i * 0.1}s` }}
              onClick={() => navigate('/menu')}
            >
              <span className="cp-menu-cta-card-icon">{h.icon}</span>
              <div>
                <p className="cp-menu-cta-card-name">{h.name}</p>
                <small className="cp-menu-cta-card-cat">{h.cat}</small>
              </div>
              <span className="cp-menu-cta-card-arrow">→</span>
            </div>
          ))}
          <div className="cp-menu-cta-badge">
            <span className="cp-menu-cta-badge-num">100+</span>
            <span>Món ngon</span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   RESERVATION
════════════════════════════════ */
function ReservationSection() {
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Vui lòng nhập họ và tên của bạn'
    }

    if (!form.phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(\+84|0)[0-9]{8,10}$/.test(form.phone.trim())) {
      errs.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)'
    }

    if (!form.email.trim()) {
      errs.email = 'Vui lòng nhập địa chỉ email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Định dạng email không hợp lệ (VD: name@domain.com)'
    }

    if (!form.date) {
      errs.date = 'Vui lòng chọn ngày dùng bữa'
    }

    if (!form.time) {
      errs.time = 'Vui lòng chọn giờ dùng bữa'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!validate()) {
      return
    }

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
    } catch (err) {
      setErrorMsg(err.message || 'Đặt bàn không thành công. Vui lòng thử lại sau.')
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
    <section className="cp-reservation" id="reservation">
      <div className="cp-reservation-overlay"></div>
      <div className="cp-reservation-card">
        <div className="cp-reservation-header">
          <span className="cp-section-tag">Đặt bàn trực tuyến</span>
          <h2 className="cp-section-title">
            Trải Nghiệm
            <br />
            Ẩm Thực Hoàn Hảo
          </h2>
          <div className="cp-section-divider"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7' }}>
            Đặt bàn trước để được giữ chỗ ngồi ưng ý và nhà hàng phục vụ chu đáo nhất.
          </p>
        </div>

        {bookingSuccess ? (
          <div className="cp-reservation-success-card">
            <div className="cp-success-icon">🎉</div>
            <h3>Đặt Bàn Thành Công!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Cảm ơn quý khách <strong>{bookingSuccess.customerName}</strong> đã lựa chọn Nhà Hàng Hoa Sen.
            </p>
            <div className="cp-success-code">
              Mã đặt bàn: #{bookingSuccess.id}
            </div>

            <div className="cp-success-grid">
              <div className="cp-success-item">
                <span className="label">Số điện thoại</span>
                <span className="val">{bookingSuccess.customerPhone}</span>
              </div>
              <div className="cp-success-item">
                <span className="label">Email</span>
                <span className="val">{bookingSuccess.customerEmail || '—'}</span>
              </div>
              <div className="cp-success-item">
                <span className="label">Thời gian</span>
                <span className="val">
                  {bookingSuccess.reservationTime?.substring(0, 5)} ngày {bookingSuccess.reservationDate}
                </span>
              </div>
              <div className="cp-success-item">
                <span className="label">Số lượng khách</span>
                <span className="val">{bookingSuccess.numberOfGuests} người</span>
              </div>
            </div>

            <p className="cp-success-note">
              Nhân viên chăm sóc khách hàng của chúng tôi sẽ gọi điện hoặc gửi email xác nhận trong thời gian sớm nhất.
            </p>

            <button type="button" className="cp-btn-primary" onClick={handleReset}>
              ✨ Đặt thêm bàn khác
            </button>
          </div>
        ) : (
          <form className="cp-reservation-form" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="cp-alert-error">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="cp-form-row">
              <div className="cp-form-group">
                <label>Họ và tên *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                />
                {errors.name && <span className="cp-field-error">{errors.name}</span>}
              </div>
              <div className="cp-form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                />
                {errors.phone && <span className="cp-field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="cp-form-group">
              <label>Địa chỉ Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
              />
              {errors.email && <span className="cp-field-error">{errors.email}</span>}
            </div>

            <div className="cp-form-row">
              <div className="cp-form-group">
                <label>Ngày dùng bữa *</label>
                <input
                  type="date"
                  name="date"
                  min={todayStr}
                  value={form.date}
                  onChange={handleChange}
                />
                {errors.date && <span className="cp-field-error">{errors.date}</span>}
              </div>
              <div className="cp-form-group">
                <label>Giờ dùng bữa *</label>
                <select name="time" value={form.time} onChange={handleChange}>
                  <option value="">-- Chọn giờ --</option>
                  <optgroup label="Buổi trưa">
                    <option value="11:00">11:00 (Trưa)</option>
                    <option value="11:30">11:30 (Trưa)</option>
                    <option value="12:00">12:00 (Trưa)</option>
                    <option value="12:30">12:30 (Trưa)</option>
                    <option value="13:00">13:00 (Trưa)</option>
                    <option value="13:30">13:30 (Trưa)</option>
                  </optgroup>
                  <optgroup label="Buổi tối">
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
                {errors.time && <span className="cp-field-error">{errors.time}</span>}
              </div>
            </div>

            <div className="cp-form-group">
              <label>Số lượng khách *</label>
              <select name="guests" value={form.guests} onChange={handleChange}>
                <option value="1">1 người (Bàn đơn)</option>
                <option value="2">2 người (Cặp đôi)</option>
                <option value="3">3 người</option>
                <option value="4">4 người (Gia đình nhỏ)</option>
                <option value="5">5 người</option>
                <option value="6">6 người (Gia đình / Nhóm bạn)</option>
                <option value="8">8 người (Tiệc thân mật)</option>
                <option value="10">10 người (Bàn dài)</option>
                <option value="15">15 người (Phòng riêng)</option>
                <option value="20">20+ người (Tiệc đoàn)</option>
              </select>
            </div>

            <div className="cp-form-group">
              <label>Ghi chú đặc biệt (Tùy chọn)</label>
              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                rows="3"
                placeholder="Yêu cầu vị trí bàn gần cửa sổ, ăn chay, kỷ niệm sinh nhật, đặt hoa..."
              />
            </div>

            <button type="submit" className="cp-btn-primary cp-btn-full" disabled={submitting}>
              {submitting ? '⏳ Đang gửi thông tin...' : '✨ Xác Nhận Đặt Bàn Ngay'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

/* ════════════════════════════════
   FOOTER
════════════════════════════════ */
function Footer() {
  return (
    <footer className="cp-footer" id="footer">
      <div className="cp-footer-grid">
        <div className="cp-footer-brand">
          <div className="cp-nav-logo">
            <div className="cp-nav-logo-icon">🍜</div>
            <span className="cp-nav-logo-text">Hoa Sen Restaurant</span>
          </div>
          <p>Trải nghiệm tinh hoa ẩm thực Việt Nam trong không gian kiến trúc sang trọng và ấm cúng.</p>
        </div>

        <div className="cp-footer-col">
          <h4>Thực đơn</h4>
          <ul>
            <li><Link to="/menu">Xem toàn bộ thực đơn</Link></li>
            <li><Link to="/menu">Món khai vị</Link></li>
            <li><Link to="/menu">Món chính & Lẩu</Link></li>
            <li><Link to="/menu">Đồ uống & Tráng miệng</Link></li>
          </ul>
        </div>

        <div className="cp-footer-col">
          <h4>Liên hệ</h4>
          <address>
            📍 Trung tâm TP. Hồ Chí Minh<br />
            📞 (028) 3822 1234<br />
            ✉️ contact@hoasen.restaurant<br />
            🕐 10:00 – 22:30 hàng ngày
          </address>
        </div>
      </div>

      <div className="cp-footer-bottom">
        <p>© 2026 Nhà hàng Hoa Sen. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  )
}

/* ════════════════════════════════
   MAIN PAGE
════════════════════════════════ */
export default function CustomerPage() {
  return (
    <div className="customer-page">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <AboutSection />
        <MenuCTASection />
        <ReservationSection />
      </main>
      <Footer />
    </div>
  )
}
