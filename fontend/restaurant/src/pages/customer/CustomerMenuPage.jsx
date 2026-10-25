import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CustomerMenuPage.css'
import { getAllCategories } from '../../services/categoryService'
import { getAllMenuItems } from '../../services/menuItemService'
import { getImageFullUrl } from '../../services/apiClient'
import CustomerChatBox from '../../components/customer/CustomerChatBox'

/* ── Format tiền VNĐ ── */
const fmt = (n) => (!n ? '0' : Number(n).toLocaleString('vi-VN'))

/* ═══════════════════════════════════════
   DISH DETAIL MODAL
═══════════════════════════════════════ */
function DishModal({ dish, onClose, onBook }) {
  // Đóng khi nhấn Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const fallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

  return (
    <div className="cmp-modal-bg" onClick={onClose}>
      <div className="cmp-modal" onClick={(e) => e.stopPropagation()}>

        {/* Ảnh trái */}
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
          <button className="cmp-modal-close" onClick={onClose} title="Đóng">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Nội dung phải */}
        <div className="cmp-modal-content">
          <div className="cmp-modal-top">
            <span className="cmp-modal-label">Món ăn đặc sắc</span>
            <h2 className="cmp-modal-name">{dish.name}</h2>

            {dish.mainIngredients && (
              <div className="cmp-modal-ingr-box">
                <div className="cmp-modal-ingr-title">Nguyên liệu chính</div>
                <p className="cmp-modal-ingr-text">{dish.mainIngredients}</p>
              </div>
            )}

            <p className="cmp-modal-desc">
              {dish.description || 'Món ăn tinh tế được chuẩn bị công phu bởi bếp trưởng nhà hàng, mang đến hương vị đậm đà và trải nghiệm ẩm thực khó quên.'}
            </p>
          </div>

          <div className="cmp-modal-footer">
            <div className="cmp-modal-price">
              {fmt(dish.price)} <small>VNĐ</small>
            </div>
            <button className="cmp-modal-cta" onClick={onBook}>
              Đặt bàn ngay
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
      {/* Thumb */}
      <div className="cmp-card-thumb">
        {item.image ? (
          <img
            src={getImageFullUrl(item.image)}
            alt={item.name}
            loading="lazy"
            onError={(e) => { e.target.src = fallback }}
          />
        ) : (
          <img src={fallback} alt={item.name} loading="lazy" />
        )}
        {item.categoryName && (
          <span className="cmp-card-cat-tag">{item.categoryName}</span>
        )}
      </div>

      {/* Body */}
      <div className="cmp-card-body">
        <h3 className="cmp-card-name">{item.name}</h3>

        {item.mainIngredients && (
          <div className="cmp-card-ingredients">
            <span>{item.mainIngredients}</span>
          </div>
        )}

        <p className="cmp-card-desc">
          {item.description || 'Món ăn đặc sản, thơm ngon, đậm đà phong vị Việt.'}
        </p>

        <div className="cmp-card-footer">
          <div className="cmp-card-price">
            {fmt(item.price)} <small>đ</small>
          </div>
          <button
            className="cmp-card-detail-btn"
            onClick={(e) => { e.stopPropagation(); onClick() }}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   MAIN PAGE
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

  /* ── Lọc & sắp xếp ── */
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
          <div className="cmp-nav-brand-icon">HS</div>
          <span className="cmp-nav-brand-name">Hoa Sen</span>
        </Link>

        <div className="cmp-nav-links">
          <Link to="/customer" className="cmp-nav-link">Trang chủ</Link>
          <Link to="/customer#about" className="cmp-nav-link">Giới thiệu</Link>
          <Link to="/customer#reservation" className="cmp-nav-btn">Đặt bàn ngay</Link>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <section className="cmp-hero">
        <div className="cmp-hero-inner">
          <div className="cmp-hero-text">
            <div className="cmp-hero-eyebrow">
              Thực Đơn Nhà Hàng Hoa Sen
            </div>
            <h1>
              Tinh Hoa <em>Ẩm Thực</em><br />Việt Nam
            </h1>
            <p className="cmp-hero-sub">
              Hương vị truyền thống, nguyên liệu thượng hạng, trải nghiệm đẳng cấp
            </p>
            <div className="cmp-hero-tags">
              <span className="cmp-hero-tag">Nguyên liệu tươi sạch</span>
              <span className="cmp-hero-tag">Bếp trưởng thượng hạng</span>
              <span className="cmp-hero-tag">10:00 – 22:30 hằng ngày</span>
            </div>
          </div>

          {/* Stats cards */}
          <div className="cmp-hero-stats">
            {[
              { num: menuItems.length || '—', label: 'Món ăn đang phục vụ' },
              { num: categories.length || '—', label: 'Danh mục ẩm thực' },
              { num: '14+', label: 'Năm kinh nghiệm' },
              { num: '4.9', label: 'Đánh giá khách hàng' },
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
                  placeholder="Tìm theo tên món, nguyên liệu đặc trưng..."
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
                <p style={{ color: 'var(--rose-light)', margin: 0 }}>Đang chuẩn bị thực đơn...</p>
              </div>
            ) : processedItems.length === 0 ? (
              <div className="cmp-empty">
                <div className="cmp-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--rose-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <h3>Không tìm thấy món ăn phù hợp</h3>
                <p>
                  {searchKw
                    ? `Không có món nào khớp với "${searchKw}". Hãy thử từ khóa khác!`
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
        <p>© 2026 <Link to="/customer">Nhà hàng Hoa Sen</Link>. Tất cả quyền được bảo lưu.</p>
        <p>Trung tâm TP. Hồ Chí Minh &nbsp;·&nbsp; (028) 3822 1234 &nbsp;·&nbsp; 10:00 – 22:30</p>
      </footer>
      <CustomerChatBox />
    </div>
  )
}
