import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../styles/pages/customer/CustomerPage.css'
import { getAllCategories } from '../../services/categoryService'
import { getAllMenuItems } from '../../services/menuItemService'
import { getImageFullUrl } from '../../services/apiClient'
import CustomerChatBox from '../../components/customer/CustomerChatBox'

/* ── Format tiền VNĐ ── */
const fmt = (n) => (!n ? '0' : Number(n).toLocaleString('vi-VN'))

/* ── Lotus Logo SVG (Hồng Sen #d86888 & Lá Sen Ngọc) ── */
export function LotusLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="cp-lotus-svg">
      <defs>
        <linearGradient id="lotusPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4a7bc" />
          <stop offset="60%" stopColor="#d86888" />
          <stop offset="100%" stopColor="#b84d6e" />
        </linearGradient>
        <linearGradient id="lotusOuterPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbe0e8" />
          <stop offset="100%" stopColor="#d86888" />
        </linearGradient>
        <linearGradient id="lotusLeafCore" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#98cca9" />
          <stop offset="100%" stopColor="#3b7a57" />
        </linearGradient>
      </defs>
      {/* Cánh sen chính */}
      <path d="M22 6C19.5 13 13 18 13 25C13 30 17 34 22 34C27 34 31 30 31 25C31 18 24.5 13 22 6Z" fill="url(#lotusPinkGrad)" opacity="0.95" />
      {/* Cánh sen nở hai bên */}
      <path d="M22 13C16 17 8 22 8 28C8 32 11.5 35.5 15.5 35.5C18.5 35.5 20.8 33.5 22 30.5C23.2 33.5 25.5 35.5 28.5 35.5C32.5 35.5 36 32 36 28C36 22 28 17 22 13Z" fill="url(#lotusOuterPink)" opacity="0.75" />
      {/* Cánh sen lớp trong */}
      <path d="M22 20C17.5 23.5 12 27 12 30.5C12 33.5 14.8 35.5 18 35C19.5 32 20.5 28.5 22 25C23.5 28.5 24.5 32 26 35C29.2 35.5 32 33.5 32 30.5C32 27 26.5 23.5 22 20Z" fill="url(#lotusPinkGrad)" opacity="0.9" />
      {/* Tâm sen ngọc thanh tao */}
      <circle cx="22" cy="25" r="3.2" fill="url(#lotusLeafCore)" />
    </svg>
  )
}

/* ════════════════════════════════
   NAVBAR
════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`cp-navbar${scrolled ? ' scrolled' : ''}`} id="cp-navbar">
      <Link to="/customer" className="cp-nav-logo">
        <div className="cp-nav-logo-icon">
          <LotusLogo size={36} />
        </div>
        <div className="cp-nav-logo-text">
          <strong>Hoa Sen</strong>
          <small>Ẩm Thực Hà Thành · Tây Hồ</small>
        </div>
      </Link>

      <ul className={`cp-nav-links ${menuOpen ? 'open' : ''}`}>
        <li>
          <Link to="/customer" onClick={() => setMenuOpen(false)}>Trang chủ</Link>
        </li>
        <li>
          <a href="#about" onClick={(e) => { e.preventDefault(); setMenuOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) }}>
            Giới thiệu
          </a>
        </li>
        <li>
          <a href="#experiences" onClick={(e) => { e.preventDefault(); setMenuOpen(false); document.getElementById('experiences')?.scrollIntoView({ behavior: 'smooth' }) }}>
            Trải nghiệm
          </a>
        </li>
        <li>
          <Link to="/customer/menu" onClick={() => setMenuOpen(false)}>Thực đơn</Link>
        </li>
        <li>
          <Link to="/customer/reservation" onClick={() => setMenuOpen(false)} className="cp-nav-cta">
            Đặt bàn trực tuyến
          </Link>
        </li>
      </ul>

      <button
        className={`cp-nav-hamburger ${menuOpen ? 'active' : ''}`}
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
   HERO SECTION
════════════════════════════════ */
function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="cp-hero" id="hero">
      <div className="cp-hero-bg"></div>
      <div className="cp-hero-overlay"></div>

      <div className="cp-hero-content">
        <div className="cp-hero-badge">
          <span className="cp-badge-dot"></span>
          Nhà Hàng Hoa Sen · Ẩm Thực Hà Thành Bên Bờ Hồ Tây
        </div>

        <h1>
          Tinh Hoa Ẩm Thực<br />
          <em>Hà Thành</em>
        </h1>

        <p className="cp-hero-subtitle">
          Nét thanh lịch Tràng An hòa quyện cùng hương sen Bách Diệp Tây Hồ
        </p>

        <p className="cp-hero-desc">
          Thưởng thức mỹ vị truyền thống trong không gian biệt thự ven hồ thơ mộng.
          Mỗi món ăn là một bản hòa ca giữa nguyên liệu tươi lành chọn lọc mỗi sớm mai và bàn tay tài hoa của nghệ nhân ẩm thực Hà Nội.
        </p>

        <div className="cp-hero-tags">
          <span className="cp-hero-tag">Hương sen Bách Diệp Tây Hồ</span>
          <span className="cp-hero-tag">Mỹ vị Hà Thành gia truyền</span>
          <span className="cp-hero-tag">Biệt thự ven hồ thoáng đạt</span>
        </div>

        <div className="cp-hero-actions">
          <button className="cp-btn-primary" onClick={() => navigate('/customer/reservation')}>
            Đặt Bàn Trực Tuyến
          </button>
          <button className="cp-btn-secondary" onClick={() => navigate('/customer/menu')}>
            Khám Phá Thực Đơn
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   STATS SECTION
════════════════════════════════ */
function StatsSection() {
  const stats = [
    { number: '12+', label: 'Năm Gắn Bó', sub: 'Lưu giữ tinh hoa ẩm thực đất kinh kỳ' },
    { number: '100+', label: 'Món Ăn Tinh Tuyển', sub: 'Hương vị Tràng An thanh nhã cổ truyền' },
    { number: '60.000+', label: 'Thực Khách Hài Lòng', sub: 'Điểm hẹn ẩm thực quen thuộc ven Hồ Tây' },
    { number: '4.9 ★', label: 'Đánh Giá Ẩm Thực', sub: 'Phong cách đón tiếp ân cần, chu đáo' },
  ]

  return (
    <section className="cp-stats-section">
      <div className="cp-container">
        <div className="cp-stats-grid">
          {stats.map((s, i) => (
            <div className="cp-stat-box" key={i}>
              <div className="cp-stat-number">{s.number}</div>
              <div className="cp-stat-label">{s.label}</div>
              <div className="cp-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   ABOUT SECTION (Ảnh đổi thành ảnh cũ hero)
════════════════════════════════ */
function AboutSection() {
  const pillars = [
    {
      title: 'Hương Sen Bách Diệp Tây Hồ',
      desc: 'Sử dụng búp và gạo sen tươi hái lúc 5h sáng ven đầm Quảng Bá để ướp trà và chế biến món ăn thơm thảo.',
    },
    {
      title: 'Nghệ Nhân Ẩm Thực Hà Nội',
      desc: 'Đầu bếp gốc kinh kỳ với hơn 20 năm kinh nghiệm gìn giữ chuẩn vị phở, nem rán và các món canh đồng thanh mát.',
    },
    {
      title: 'Không Gian Biệt Thự Ven Hồ',
      desc: 'Kiến trúc Đông Dương thanh tịnh, ban công lộng gió ngắm sóng nước Hồ Tây và các phòng tiệc VIP riêng tư.',
    },
    {
      title: 'Đón Tiếp Thanh Lịch & Ân Cần',
      desc: 'Phong cách phục vụ nhẹ nhàng, trọng thị, mang trọn vẹn nét văn hóa giao tiếp nhã nhặn của người Tràng An.',
    },
  ]

  return (
    <section className="cp-about-section" id="about">
      <div className="cp-container">
        <div className="cp-about-grid">
          {/* Cột trái: Văn bản giới thiệu */}
          <div className="cp-about-content">
            <span className="cp-section-tag">Về Nhà Hàng Hoa Sen</span>
            <h2 className="cp-section-title">
              Hương Sen Tây Hồ &<br />Nét Đẹp Ẩm Thực Hà Thành
            </h2>
            <div className="cp-section-divider"></div>

            <p className="cp-about-lead">
              Nằm nép mình bên mặt nước Hồ Tây thơ mộng, Nhà Hàng Hoa Sen được dựng xây từ tình yêu sâu nặng
              với nét thanh tao của mảnh đất Thăng Long ngàn năm văn hiến.
            </p>

            <p className="cp-about-body">
              Tại Hoa Sen, mỗi món ăn không chỉ đơn thuần là ẩm thực, mà là một hành trình cảm xúc:
              từ bát phở nước dùng trong veo ngọt hậu ninh từ xương thảo mộc, đĩa nem cua bể bọc bánh đa giòn rụm,
              đến ấm trà sen ủ gạo đượm đà tình người đất Bắc.
            </p>

            <div className="cp-pillars-grid">
              {pillars.map((p, idx) => (
                <div className="cp-pillar-item" key={idx}>
                  <div className="cp-pillar-header">
                    <span className="cp-pillar-num">0{idx + 1}</span>
                    <h4>{p.title}</h4>
                  </div>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Ảnh hero cũ đưa sang đây theo yêu cầu */}
          <div className="cp-about-visual">
            <div className="cp-about-frame">
              <img
                src="/Gemini_Generated_Image_qig6m7qig6m7qig6.png"
                alt="Không gian Nhà Hàng Hoa Sen Tây Hồ Hà Nội"
                className="cp-about-img"
                onError={(e) => {
                  e.target.src = '/hero_restaurant.png'
                }}
              />
              <div className="cp-about-badge">
                <span className="cp-about-badge-val">12+</span>
                <span className="cp-about-badge-lbl">Năm Gắn Bó Tây Hồ</span>
              </div>
            </div>

            <div className="cp-about-quote-box">
              <p>
                “Ăn một miếng phở, nhấp một ngụm trà sen — thấy cả mùa thu Hà Nội dịu dàng trong lòng.”
              </p>
              <small>— Nghệ Nhân Bếp Trưởng Hoa Sen Hà Nội</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   EXPERIENCES SECTION (Thêm trải nghiệm thú vị)
════════════════════════════════ */
function ExperiencesSection() {
  const experiences = [
    {
      title: 'Thưởng Trà Sen Bách Diệp Sớm Mai',
      tag: 'Trải Nghiệm Độc Bản',
      desc: 'Đón ánh bình minh trên mặt Hồ Tây cùng ấm trà sen Tây Hồ ướp gạo thủ công, kèm kẹo lạc và bánh đậu xanh thơm bùi.',
      time: '09:30 – 11:30',
    },
    {
      title: 'Bữa Trưa Tràng An Thanh Nhã',
      tag: 'Thực Đơn Cơm Việt',
      desc: 'Set menu cơm truyền thống Hà Nội với cá lăng kho tộ, canh cua mồng tơi cà pháo, thịt luộc cà cuống thanh đạm.',
      time: '11:00 – 14:00',
    },
    {
      title: 'Hoàng Hôn Hồ Tây & Lẩu Sen Thảo Mộc',
      tag: 'Tiệc Chiều & Tối',
      desc: 'Chiêm ngưỡng hoàng hôn nhuộm hồng mặt hồ Tây lộng gió, quây quần bên nồi lẩu sen cá lăng ngọt thơm tự nhiên.',
      time: '17:30 – 21:30',
    },
    {
      title: 'Phòng VIP Biệt Thự Riêng Tư',
      tag: 'Tiệc Đối Tác & Gia Đình',
      desc: 'Không gian phòng riêng sang trọng với ban công hướng trọn Hồ Tây, phục vụ chuyên biệt theo sở thích từng thực khách.',
      time: 'Đặt trước theo lịch',
    },
  ]

  return (
    <section className="cp-exp-section" id="experiences">
      <div className="cp-container">
        <div className="cp-section-header">
          <span className="cp-section-tag">Trải Nghiệm Tại Hoa Sen</span>
          <h2 className="cp-section-title">Khoảnh Khắc Đẹp Bên Hồ Tây</h2>
          <div className="cp-section-divider"></div>
          <p className="cp-section-subtitle">
            Dù là buổi sáng tĩnh lặng bên chén trà sen hay bữa tối sum vầy bên gia đình, Hoa Sen luôn dành trọn sự chăm sóc tận tâm cho quý khách.
          </p>
        </div>

        <div className="cp-exp-grid">
          {experiences.map((exp, i) => (
            <div className="cp-exp-card" key={i}>
              <div className="cp-exp-tag">{exp.tag}</div>
              <h3>{exp.title}</h3>
              <p>{exp.desc}</p>
              <div className="cp-exp-footer">
                <span className="cp-exp-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {exp.time}
                </span>
                <Link to="/customer/reservation" className="cp-exp-link">
                  Đặt bàn
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   REAL MENU ITEMS FROM DATABASE
════════════════════════════════ */
function RealMenuSection() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('ALL')

  const fallbackImg = '/menu_pho.png'

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const [cats, items] = await Promise.all([
          getAllCategories().catch(() => []),
          getAllMenuItems({ status: 'ACTIVE' }).catch(() => []),
        ])
        setCategories(cats.filter((c) => c.status === 'ACTIVE' || !c.status))
        setMenuItems(items.filter((i) => i.status === 'ACTIVE' || !i.status))
      } catch (err) {
        console.error('Lỗi tải món ăn từ database:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Lọc món ăn theo category
  const filteredDishes = (() => {
    let list = menuItems
    if (activeCategory !== 'ALL') {
      list = list.filter(
        (dish) =>
          String(dish.categoryId) === String(activeCategory) ||
          dish.categoryName === activeCategory
      )
    }
    // Lấy tối đa 8 món để hiển thị đẹp mắt trên trang chủ
    return list.slice(0, 8)
  })()

  return (
    <section className="cp-real-menu-section" id="menu">
      <div className="cp-container">
        <div className="cp-section-header">
          <span className="cp-section-tag">Thực Đơn Tinh Tuyển</span>
          <h2 className="cp-section-title">Món Ăn Đặc Sắc Trong Ngày</h2>
          <div className="cp-section-divider"></div>
          <p className="cp-section-subtitle">
            Các món ăn được chế biến tươi mới mỗi ngày từ nguyên liệu tươi lành, chuẩn công thức gia truyền Hà Nội.
          </p>

          {/* Category Tabs từ DB */}
          <div className="cp-menu-filter-tabs">
            <button
              className={`cp-tab-btn ${activeCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveCategory('ALL')}
            >
              Tất Cả Món ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`cp-tab-btn ${String(activeCategory) === String(cat.id) ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách món ăn thật từ DB */}
        {loading ? (
          <div className="cp-menu-loading">
            <div className="cp-menu-spinner"></div>
            <p>Đang tải thực đơn từ nhà hàng...</p>
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="cp-menu-empty">
            <p>Hiện chưa có món ăn trong danh mục này.</p>
          </div>
        ) : (
          <div className="cp-dishes-grid">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className="cp-dish-item"
                onClick={() => navigate('/customer/menu')}
              >
                <div className="cp-dish-thumb">
                  <img
                    src={dish.image ? getImageFullUrl(dish.image) : fallbackImg}
                    alt={dish.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = fallbackImg
                    }}
                  />
                  {dish.categoryName && (
                    <span className="cp-dish-category-badge">{dish.categoryName}</span>
                  )}
                </div>

                <div className="cp-dish-info">
                  <h3 className="cp-dish-name">{dish.name}</h3>

                  {dish.mainIngredients && (
                    <div className="cp-dish-ingr">
                      <span>{dish.mainIngredients}</span>
                    </div>
                  )}

                  <p className="cp-dish-description">
                    {dish.description || 'Món ăn đặc sản tươi ngon chuẩn phong vị ẩm thực truyền thống Hà Thành.'}
                  </p>

                  <div className="cp-dish-bottom">
                    <span className="cp-dish-price">{fmt(dish.price)} đ</span>
                    <button
                      className="cp-dish-action-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate('/customer/menu')
                      }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nút xem toàn bộ thực đơn */}
        <div className="cp-menu-cta-bar">
          <div className="cp-menu-cta-text">
            <h4>Khám phá toàn bộ thực đơn hơn 100+ món ngon Hà Thành</h4>
            <p>Từ khai vị, phở, món chính, lẩu nướng đến trà sen và tráng miệng thanh mát.</p>
          </div>
          <button
            className="cp-btn-primary"
            onClick={() => navigate('/customer/menu')}
          >
            Xem Toàn Bộ Thực Đơn
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   CRAFT & STORY SECTION (Quy trình kỳ công)
════════════════════════════════ */
function CraftSection() {
  const steps = [
    {
      number: '1.000',
      unit: 'Bông sen Bách Diệp',
      title: 'Tách Gạo Sen Buổi Sớm',
      desc: 'Hoa sen được hái từ 5 giờ sáng khi sương còn đọng trên cánh sen Tây Hồ, nghệ nhân tách lấy từng hạt gạo sen li ti ngát hương.',
    },
    {
      number: '24',
      unit: 'Giờ ninh chậm',
      title: 'Nước Dùng Thảo Mộc',
      desc: 'Nồi phở và nước hầm tiềm được ninh từ xương ống bò, sá sùng, gừng nướng và thảo quả liên tục để có vị ngọt thanh không gắt.',
    },
    {
      number: '100%',
      unit: 'Nguyên liệu tự nhiên',
      title: 'Không Bột Ngọt Nhân Tạo',
      desc: 'Đề cao sức khỏe thực khách, vị ngọt thanh mát trong từng món ăn hoàn toàn đến từ củ sen tươi, tôm cá đầm và rau củ theo mùa.',
    },
  ]

  return (
    <section className="cp-craft-section">
      <div className="cp-container">
        <div className="cp-section-header">
          <span className="cp-section-tag">Nghệ Thuật Ẩm Thực</span>
          <h2 className="cp-section-title">Sự Kỳ Công Trong Từng Hương Vị</h2>
          <div className="cp-section-divider"></div>
          <p className="cp-section-subtitle">
            Chúng tôi tin rằng món ăn ngon không chỉ đến từ công thức, mà bắt đầu từ sự tôn trọng đối với đất trời và tấm lòng của người đầu bếp.
          </p>
        </div>

        <div className="cp-craft-grid">
          {steps.map((st, i) => (
            <div className="cp-craft-card" key={i}>
              <div className="cp-craft-stat">
                <span className="cp-craft-num">{st.number}</span>
                <span className="cp-craft-unit">{st.unit}</span>
              </div>
              <h3>{st.title}</h3>
              <p>{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   RESERVATION BANNER (Tách form sang trang riêng)
════════════════════════════════ */
function ReservationBanner() {
  const navigate = useNavigate()

  return (
    <section className="cp-book-banner-section">
      <div className="cp-container">
        <div className="cp-book-banner">
          <div className="cp-book-banner-content">
            <span className="cp-book-tag">Đặt Bàn Trước</span>
            <h2>Đặt Bàn Để Có Vị Trí Đẹp Nhất Bên Hồ Tây</h2>
            <p>
              Nhà hàng giữ bàn và chuẩn bị chu đáo vị trí ngồi thoáng đãng nhất cho quý khách.
              Phòng tiệc VIP hướng hồ luôn sẵn sàng cho các dịp sum vầy, sinh nhật và tiếp đãi đối tác.
            </p>

            <div className="cp-book-perks">
              <span>✓ Giữ bàn trước trong 15 phút</span>
              <span>✓ Ưu tiên bàn ban công ngắm hồ</span>
              <span>✓ Xác nhận nhanh trong 15 phút</span>
            </div>

            <div className="cp-book-btn-group">
              <button
                className="cp-btn-primary"
                onClick={() => navigate('/customer/reservation')}
              >
                Đặt Bàn Trực Tuyến Ngay
              </button>
              <a href="tel:02437198899" className="cp-btn-phone">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Hotline: (024) 3719 8899
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ════════════════════════════════
   TESTIMONIALS SECTION
════════════════════════════════ */
function ReviewsSection() {
  const reviews = [
    {
      name: 'Chị Hoàng Thùy Linh',
      role: 'Thực khách tại Ba Đình, Hà Nội',
      text: 'Không gian bên Hồ Tây rất yên bình và thoáng mát. Nước dùng phở bò thanh ngọt tự nhiên, trà sen Tây Hồ thì thơm nức mũi. Gia đình tôi rất ưng ý!',
      rating: '★★★★★',
    },
    {
      name: 'Anh Trần Quốc Bảo',
      role: 'Doanh nhân tại Cầu Giấy',
      text: 'Đặt phòng VIP tiếp đối tác nước ngoài ở đây rất sang trọng. Các bạn nhân viên phục vụ lịch thiệp, chu đáo. Nem cua bể và chả cá lăng làm rất khéo.',
      rating: '★★★★★',
    },
    {
      name: 'Cô Mai Lan',
      role: 'Thực khách thường xuyên tại Tây Hồ',
      text: 'Điểm hẹn quen thuộc của nhóm bạn mỗi dịp cuối tuần. Ngắm hoàng hôn buông xuống mặt hồ và thưởng thức nồi lẩu sen nóng hổi thật sự rất thi vị.',
      rating: '★★★★★',
    },
  ]

  return (
    <section className="cp-reviews-section">
      <div className="cp-container">
        <div className="cp-section-header">
          <span className="cp-section-tag">Cảm Nhận Thực Khách</span>
          <h2 className="cp-section-title">Những Chia Sẻ Yêu Thương</h2>
          <div className="cp-section-divider"></div>
        </div>

        <div className="cp-reviews-grid">
          {reviews.map((rv, idx) => (
            <div className="cp-review-card" key={idx}>
              <div className="cp-review-rating">{rv.rating}</div>
              <p className="cp-review-text">“{rv.text}”</p>
              <div className="cp-review-author">
                <strong>{rv.name}</strong>
                <span>{rv.role}</span>
              </div>
            </div>
          ))}
        </div>
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
      <div className="cp-container">
        <div className="cp-footer-grid">
          <div className="cp-footer-brand">
            <div className="cp-nav-logo">
              <div className="cp-nav-logo-icon">
                <LotusLogo size={34} />
              </div>
              <div className="cp-nav-logo-text">
                <strong>Hoa Sen</strong>
                <small>Ẩm Thực Hà Thành · Tây Hồ</small>
              </div>
            </div>
            <p className="cp-footer-desc">
              Trải nghiệm ẩm thực Thăng Long thanh lịch trong không gian biệt thự ven hồ thơ mộng.
              Mỗi món ăn là một bản hòa ca giữa đất trời Hà Thành và bàn tay tài hoa của người đầu bếp.
            </p>
            <div className="cp-footer-social">
              <a href="#facebook" aria-label="Facebook">f</a>
              <a href="#instagram" aria-label="Instagram">✦</a>
              <a href="#zalo" aria-label="Zalo">Z</a>
            </div>
          </div>

          <div className="cp-footer-col">
            <h4>Khám Phá Thực Đơn</h4>
            <ul>
              <li><Link to="/customer/menu">Toàn bộ thực đơn</Link></li>
              <li><Link to="/customer/menu">Món Khai Vị Hà Thành</Link></li>
              <li><Link to="/customer/menu">Phở Bò & Món Nước</Link></li>
              <li><Link to="/customer/menu">Món Chính & Lẩu Sen</Link></li>
              <li><Link to="/customer/menu">Trà Sen Bách Diệp</Link></li>
            </ul>
          </div>

          <div className="cp-footer-col">
            <h4>Thông Tin Liên Hệ</h4>
            <address>
              <strong>Địa chỉ:</strong> Số 68 Phố Quảng Bá, P. Quảng An, Q. Tây Hồ, Hà Nội<br />
              <strong>Hotline đặt bàn:</strong> (024) 3719 8899 · (024) 3828 1234<br />
              <strong>Email:</strong> reservation@hoasen-hanoi.vn<br />
              <strong>Giờ mở cửa:</strong> 09:30 – 22:30 tất cả các ngày
            </address>
          </div>

          <div className="cp-footer-col">
            <h4>Dịch Vụ & Sự Kiện</h4>
            <ul>
              <li><Link to="/customer/reservation">Đặt bàn trước trực tuyến</Link></li>
              <li><Link to="/customer/reservation">Phòng tiệc VIP riêng tư</Link></li>
              <li><Link to="/customer/reservation">Tiệc sinh nhật & gia đình</Link></li>
              <li><Link to="/customer/menu">Ưu đãi & Set menu theo mùa</Link></li>
            </ul>
          </div>
        </div>

        <div className="cp-footer-bottom">
          <p>© 2026 Nhà Hàng Hoa Sen Hà Nội. Tất cả quyền được bảo lưu.</p>
          <p>Gìn giữ nét thanh lịch Tràng An &amp; Hương sắc sen Hồ Tây</p>
        </div>
      </div>
    </footer>
  )
}

/* ════════════════════════════════
   MAIN CUSTOMER PAGE
════════════════════════════════ */
export default function CustomerPage() {
  return (
    <div className="customer-page">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <AboutSection />
        <ExperiencesSection />
        <RealMenuSection />
        <CraftSection />
        <ReservationBanner />
        <ReviewsSection />
      </main>
      <Footer />
      <CustomerChatBox />
    </div>
  )
}
