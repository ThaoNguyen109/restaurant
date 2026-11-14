import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../../styles/pages/customer/CustomerMenuPage.css'
import { getAllCategories } from '../../services/categoryService'
import { getAllMenuItems } from '../../services/menuItemService'
import { getImageFullUrl } from '../../services/apiClient'
import CustomerChatBox from '../../components/customer/CustomerChatBox'
import { LotusLogo } from './CustomerPage'

/* ── Format tiền VNĐ ── */
const fmt = (n) => (!n ? '0' : Number(n).toLocaleString('vi-VN'))

/* ═══════════════════════════════════════
   DISH DETAIL MODAL
═══════════════════════════════════════ */
function DishModal({ dish, onClose, onBook }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

  return (
    <div className="cmp-modal-bg" onClick={onClose}>
      <div className="cmp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Cột ảnh trái */}
        <div className="cmp-modal-img-wrap">
          <img
            src={dish.image ? getImageFullUrl(dish.image) : fallback}
            alt={dish.name}
            className="cmp-modal-img"
            onError={(e) => { e.target.src = fallback }}
          />
          <div className="cmp-modal-img-overlay" />
          {dish.categoryName && (
            <span className="cmp-modal-img-cat">{dish.categoryName}</span>
          )}
          <button className="cmp-modal-close" onClick={onClose} title="Đóng modal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Cột thông tin phải */}
        <div className="cmp-modal-content">
          <div className="cmp-modal-top">
            <span className="cmp-modal-label">Món Ăn Đặc Sắc · Hoa Sen</span>
            <h2 className="cmp-modal-name">{dish.name}</h2>

            {dish.mainIngredients && (
              <div className="cmp-modal-ingr-box">
                <div className="cmp-modal-ingr-title">Nguyên liệu & Gia vị chính</div>
                <p className="cmp-modal-ingr-text">{dish.mainIngredients}</p>
              </div>
            )}

            <p className="cmp-modal-desc">
              {dish.description || 'Món ăn tinh tế được chuẩn bị công phu bởi bếp trưởng nhà hàng Hoa Sen, mang đến hương vị đậm đà và trải nghiệm ẩm thực trọn vẹn.'}
            </p>
          </div>

          <div className="cmp-modal-footer">
            <div className="cmp-modal-price">
              {fmt(dish.price)} <small>VNĐ</small>
            </div>
            <button className="cmp-modal-cta" onClick={onBook}>
              🌸 Đặt Bàn Ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   DISH CARD
═══════════════════════════════════════ */
function DishCard({ item, onClick }) {
  const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'

  return (
    <div className="cmp-card" onClick={onClick}>
      {/* Thumb image */}
      <div className="cmp-card-thumb">
        <img
          src={item.image ? getImageFullUrl(item.image) : fallback}
          alt={item.name}
          loading="lazy"
          onError={(e) => { e.target.src = fallback }}
        />
        {item.categoryName && (
          <span className="cmp-card-cat-tag">{item.categoryName}</span>
        )}
      </div>

      {/* Body info */}
      <div className="cmp-card-body">
        <h3 className="cmp-card-name">{item.name}</h3>

        {item.mainIngredients && (
          <div className="cmp-card-ingredients">
            <span>{item.mainIngredients}</span>
          </div>
        )}

        <p className="cmp-card-desc">
          {item.description || 'Món ăn đặc sản thơm ngon, đậm đà phong vị ẩm thực truyền thống Việt Nam.'}
        </p>

        <div className="cmp-card-footer">
          <div className="cmp-card-price">
            {fmt(item.price)} <small>đ</small>
          </div>
          <button
            className="cmp-card-detail-btn"
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN MENU PAGE
═══════════════════════════════════════ */
export default function CustomerMenuPage() {
  const navigate = useNavigate()

  const [categories, setCategories]       = useState([])
  const [menuItems, setMenuItems]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedCat, setSelectedCat]     = useState('ALL')
  const [searchKw, setSearchKw]           = useState('')
  const [sortBy, setSortBy]               = useState('DEFAULT')
  const [selectedDish, setSelectedDish]   = useState(null)

  /* ── Fetch API ── */
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
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  /* ── Filter & Sort ── */
  const processedItems = (() => {
    let list = [...menuItems]

    if (selectedCat !== 'ALL') {
      list = list.filter(
        (i) => String(i.categoryId) === String(selectedCat) || i.categoryName === selectedCat
      )
    }

    if (searchKw.trim()) {
      const kw = searchKw.toLowerCase()
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(kw) ||
          (i.mainIngredients && i.mainIngredients.toLowerCase().includes(kw)) ||
          (i.description && i.description.toLowerCase().includes(kw))
      )
    }

    if (sortBy === 'PRICE_ASC')  list.sort((a, b) => +a.price - +b.price)
    if (sortBy === 'PRICE_DESC') list.sort((a, b) => +b.price - +a.price)
    if (sortBy === 'NAME_ASC')   list.sort((a, b) => a.name.localeCompare(b.name, 'vi'))

    return list
  })()

  /* ── Count per category ── */
  const countForCat = (catId) =>
    menuItems.filter(
      (i) => String(i.categoryId) === String(catId) || i.categoryName === catId
    ).length

  return (
    <div className="cmp-page">

      {/* ── TOP NAV ── */}
      <nav className="cmp-nav">
        <Link to="/customer" className="cmp-nav-brand">
          <div className="cmp-nav-brand-icon">
            <LotusLogo size={32} />
          </div>
          <div className="cmp-nav-brand-text">
            <span className="cmp-nav-brand-name">Hoa Sen</span>
            <small className="cmp-nav-brand-sub">Ẩm Thực Hà Thành · Tây Hồ</small>
          </div>
        </Link>

        <div className="cmp-nav-links">
          <Link to="/customer" className="cmp-nav-link">Trang chủ</Link>
          <Link to="/customer#about" className="cmp-nav-link">Giới thiệu</Link>
          <Link to="/customer#reservation" className="cmp-nav-btn">
            🌸 Đặt bàn ngay
          </Link>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <section className="cmp-hero">
        <div className="cmp-hero-inner">
          <div className="cmp-hero-text">
            <div className="cmp-hero-eyebrow">
              Thực Đơn Nhà Hàng Hoa Sen · Mỹ Vị Hà Thành
            </div>
            <h1>
              Tinh Hoa Ẩm Thực<br /><em>Hà Thành</em>
            </h1>
            <p className="cmp-hero-sub">
              Hương vị Tràng An thanh nhã hòa quyện cùng nguyên liệu tinh tuyển từ đầm sen Tây Hồ
            </p>
            <div className="cmp-hero-tags">
              <span className="cmp-hero-tag">🌱 Nguyên liệu tươi lành</span>
              <span className="cmp-hero-tag">👨‍🍳 Nghệ nhân ẩm thực Hà Nội</span>
              <span className="cmp-hero-tag">🕒 09:30 – 22:30 hàng ngày</span>
            </div>
          </div>

          {/* Stats cards */}
          <div className="cmp-hero-stats">
            {[
              { num: menuItems.length || '—', label: 'Món ăn sẵn sàng' },
              { num: categories.length || '—', label: 'Danh mục ẩm thực' },
              { num: '12+', label: 'Năm đồng hành' },
              { num: '4.9 ★', label: 'Đánh giá món ăn' },
            ].map((s) => (
              <div className="cmp-hero-stat" key={s.label}>
                <span className="cmp-hero-stat-num">{s.num}</span>
                <span className="cmp-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MENU CATALOG SECTION ── */}
      <main className="cmp-main-section">
        <div className="cmp-container">

          {/* Filter & Search Header */}
          <div className="cmp-filter-section">
            {/* Category tabs */}
            <div className="cmp-cat-tabs">
              <button
                className={`cmp-cat-pill ${selectedCat === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedCat('ALL')}
              >
                Tất cả món
                <span className="cmp-cat-pill-count">{menuItems.length}</span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`cmp-cat-pill ${String(selectedCat) === String(cat.id) ? 'active' : ''}`}
                  onClick={() => setSelectedCat(cat.id)}
                >
                  {cat.name}
                  <span className="cmp-cat-pill-count">{countForCat(cat.id)}</span>
                </button>
              ))}
            </div>

            {/* Search & Sort toolbar */}
            <div className="cmp-toolbar">
              {/* Search box */}
              <div className="cmp-search-box">
                <svg className="cmp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                </svg>
                <input
                  type="text"
                  placeholder="Tìm món ăn, nguyên liệu, hương vị..."
                  value={searchKw}
                  onChange={(e) => setSearchKw(e.target.value)}
                />
                {searchKw && (
                  <button
                    className="cmp-search-clear"
                    onClick={() => setSearchKw('')}
                    title="Xóa tìm kiếm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
              </div>

              {/* Status count & reset */}
              <div className="cmp-toolbar-info">
                {!loading && (
                  <span className="cmp-toolbar-count">
                    Hiển thị <strong>{processedItems.length}</strong> / {menuItems.length} món
                    {searchKw && <> cho từ khóa "<strong>{searchKw}</strong>"</>}
                  </span>
                )}
                {(searchKw || selectedCat !== 'ALL' || sortBy !== 'DEFAULT') && (
                  <button
                    className="cmp-toolbar-reset"
                    onClick={() => { setSearchKw(''); setSelectedCat('ALL'); setSortBy('DEFAULT') }}
                  >
                    Đặt lại lọc
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="cmp-sort-box">
                <span className="cmp-sort-label">Sắp xếp:</span>
                <div className="cmp-sort-select-wrapper">
                  <select
                    className="cmp-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="DEFAULT">Mặc định</option>
                    <option value="PRICE_ASC">Giá tăng dần</option>
                    <option value="PRICE_DESC">Giá giảm dần</option>
                    <option value="NAME_ASC">Tên món A → Z</option>
                  </select>
                  <svg className="cmp-sort-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Dish Grid */}
          <div className="cmp-grid">
            {loading ? (
              <div className="cmp-loading">
                <div className="cmp-spinner" />
                <p style={{ color: 'var(--lotus-light)', margin: 0, fontWeight: 500 }}>Đang chuẩn bị thực đơn Hoa Sen...</p>
              </div>
            ) : processedItems.length === 0 ? (
              <div className="cmp-empty">
                <div className="cmp-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--lotus-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </div>
                <h3>Không tìm thấy món ăn phù hợp</h3>
                <p>
                  {searchKw
                    ? `Không có món nào khớp với "${searchKw}". Quý khách hãy thử từ khóa khác!`
                    : 'Danh mục này hiện chưa có món ăn nào.'}
                </p>
                {(searchKw || selectedCat !== 'ALL') && (
                  <button
                    className="cmp-reset-btn"
                    onClick={() => { setSearchKw(''); setSelectedCat('ALL') }}
                  >
                    Xem tất cả món ăn
                  </button>
                )}
              </div>
            ) : (
              processedItems.map((item) => (
                <DishCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedDish(item)}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── DISH DETAIL MODAL ── */}
      {selectedDish && (
        <DishModal
          dish={selectedDish}
          onClose={() => setSelectedDish(null)}
          onBook={() => {
            setSelectedDish(null)
            navigate('/customer#reservation')
          }}
        />
      )}

      {/* ── FOOTER ── */}
      <footer className="cmp-footer">
        <p>© 2026 <Link to="/customer">Nhà Hàng Hoa Sen Hà Nội</Link>. Tất cả quyền được bảo lưu.</p>
        <p>Số 68 Phố Quảng Bá, Q. Tây Hồ, Hà Nội &nbsp;·&nbsp; Hotline: (024) 3719 8899 &nbsp;·&nbsp; 09:30 – 22:30</p>
      </footer>

      <CustomerChatBox />
    </div>
  )
}
