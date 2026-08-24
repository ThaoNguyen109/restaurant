import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CustomerMenuPage.css'
import { getAllCategories } from '../../services/categoryService'
import { getAllMenuItems } from '../../services/menuItemService'
import { getImageFullUrl } from '../../services/apiClient'

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
            <span className="cmp-modal-img-cat">🏷️ {dish.categoryName}</span>
          )}
          <button className="cmp-modal-close" onClick={onClose} title="Đóng">✕</button>
        </div>

        {/* Nội dung phải */}
        <div className="cmp-modal-content">
          <div className="cmp-modal-top">
            <span className="cmp-modal-label">✦ Món ăn đặc sắc</span>
            <h2 className="cmp-modal-name">{dish.name}</h2>

            {dish.mainIngredients && (
              <div className="cmp-modal-ingr-box">
                <div className="cmp-modal-ingr-title">🌿 Nguyên liệu chính</div>
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
              🗓 Đặt bàn ngay
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
            <span>🌿</span>
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
          <div className="cmp-nav-brand-icon">🍜</div>
          <span className="cmp-nav-brand-name">Nhà Hàng Hoa Sen</span>
        </Link>

        <div className="cmp-nav-links">
          <Link to="/customer" className="cmp-nav-link">Trang chủ</Link>
          <Link to="/customer#about" className="cmp-nav-link">Giới thiệu</Link>
          <Link to="/customer#reservation" className="cmp-nav-btn">🗓 Đặt bàn ngay</Link>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <section className="cmp-hero">
        <div className="cmp-hero-inner">
          <div>
            <div className="cmp-hero-eyebrow">
              <span>✦</span> Thực Đơn Nhà Hàng Hoa Sen
            </div>
            <h1>
              Tinh Hoa <em>Ẩm Thực</em><br />Việt Nam
            </h1>
            <p className="cmp-hero-sub">
              Hương vị truyền thống, nguyên liệu thượng hạng, trải nghiệm đẳng cấp
            </p>

            {/* Search + sort */}
            <div className="cmp-search-wrap">
              <div className="cmp-search">
                <span className="cmp-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Tìm tên món, nguyên liệu đặc trưng..."
                  value={searchKw}
                  onChange={(e) => setSearchKw(e.target.value)}
                />
              </div>
              <select
                className="cmp-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="DEFAULT">Mặc định</option>
                <option value="PRICE_ASC">Giá tăng dần</option>
                <option value="PRICE_DESC">Giá giảm dần</option>
                <option value="NAME_ASC">Tên A → Z</option>
              </select>
            </div>
          </div>

          {/* Stats cards */}
          <div className="cmp-hero-stats">
            {[
              { num: menuItems.length || '—', label: 'Món ăn đang phục vụ' },
              { num: categories.length || '—', label: 'Danh mục ẩm thực' },
              { num: '14+', label: 'Năm kinh nghiệm' },
              { num: '4.9★', label: 'Đánh giá khách hàng' },
            ].map((s) => (
              <div className="cmp-hero-stat" key={s.label}>
                <span className="cmp-hero-stat-num">{s.num}</span>
                <span className="cmp-hero-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY: SIDEBAR + GRID ── */}
      <div className="cmp-body">

        {/* Sidebar – Categories */}
        <aside className="cmp-sidebar">
          <div className="cmp-sidebar-title">Danh mục món ăn</div>

          <button
            className={`cmp-cat-btn ${selectedCat === 'ALL' ? 'active' : ''}`}
            onClick={() => setSelectedCat('ALL')}
          >
            🍽️ Tất cả
            <span className="cmp-cat-count">{menuItems.length}</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cmp-cat-btn ${String(selectedCat) === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              🏷️ {cat.name}
              <span className="cmp-cat-count">{countForCat(cat.id)}</span>
            </button>
          ))}
        </aside>

        {/* Main grid */}
        <div>
          {/* Result header */}
          {!loading && (
            <div className="cmp-result-header">
              <p className="cmp-result-count">
                Hiển thị <strong>{processedItems.length}</strong> / {menuItems.length} món ăn
                {searchKw && <> cho từ khóa <strong>"{searchKw}"</strong></>}
              </p>
            </div>
          )}

          <div className="cmp-grid">
            {loading ? (
              <div className="cmp-loading">
                <div className="cmp-spinner" />
                <p style={{ color: 'var(--rose-light)', margin: 0 }}>Đang chuẩn bị thực đơn...</p>
              </div>
            ) : processedItems.length === 0 ? (
              <div className="cmp-empty">
                <div className="cmp-empty-icon">🍲</div>
                <h3>Không tìm thấy món ăn phù hợp</h3>
                <p>
                  {searchKw
                    ? `Không có món nào khớp với "${searchKw}". Hãy thử từ khóa khác!`
                    : 'Danh mục này chưa có món ăn nào.'}
                </p>
                {(searchKw || selectedCat !== 'ALL') && (
                  <button
                    className="cmp-reset-btn"
                    onClick={() => { setSearchKw(''); setSelectedCat('ALL') }}
                  >
                    🔄 Xem tất cả
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
      </div>

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
        <p>📍 Trung tâm TP. Hồ Chí Minh &nbsp;·&nbsp; 📞 (028) 3822 1234 &nbsp;·&nbsp; 🕐 10:00 – 22:30</p>
      </footer>
    </div>
  )
}
