import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams, useParams, useNavigate } from 'react-router-dom'
import '../../styles/pages/customer/CustomerOrderPage.css'
import { getAllCategories } from '../../services/categoryService'
import { getAllMenuItems } from '../../services/menuItemService'
import { getAllCombos } from '../../services/comboService'
import { getActivePromotions, calculatePromotion } from '../../services/promotionService'
import { getActiveTables, getTableById } from '../../services/tableService'
import { createCustomerOrder, getCustomerActiveOrders } from '../../services/orderService'
import { getImageFullUrl } from '../../services/apiClient'
import { subscribeWebSocket } from '../../services/websocketService'
import CustomerChatBox from '../../components/customer/CustomerChatBox'
import { LotusLogo } from './CustomerPage'

/* ── Format tiền VNĐ ── */
const fmt = (n) => (!n ? '0' : Number(n).toLocaleString('vi-VN'))

/* ═══════════════════════════════════════════════════════════════
   MODAL GHI CHÚ MÓN
═══════════════════════════════════════════════════════════════ */
function NoteModal({ item, initialNote, onSave, onClose }) {
  const [note, setNote] = useState(initialNote || '')

  const QUICK_TAGS = ['Không cay', 'Ít cay', 'Không hành', 'Ít đá', 'Không đường', 'Mang ra cùng lúc']

  const handleAddTag = (tag) => {
    if (!note) {
      setNote(tag)
    } else if (!note.includes(tag)) {
      setNote(`${note}, ${tag}`)
    }
  }

  return (
    <div className="cop-modal-overlay" onClick={onClose}>
      <div className="cop-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="cop-modal-header">
          <h3>Ghi chú cho món: <em>{item.name}</em></h3>
          <button className="cop-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="cop-modal-body">
          <label className="cop-modal-label">Yêu cầu đặc biệt cho đầu bếp:</label>
          <textarea
            className="cop-modal-textarea"
            rows="3"
            placeholder="Ví dụ: Không cho ớt, xin thêm nước chấm..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoFocus
          />

          <div className="cop-quick-tags">
            <span className="cop-quick-label">Gợi ý nhanh:</span>
            <div className="cop-quick-list">
              {QUICK_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className="cop-quick-tag-btn"
                  onClick={() => handleAddTag(tag)}
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cop-modal-footer">
          <button className="cop-btn-outline" onClick={onClose}>Hủy</button>
          <button
            className="cop-btn-primary"
            onClick={() => {
              onSave(note.trim())
              onClose()
            }}
          >
            Lưu ghi chú
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODAL XEM CHI TIẾT MÓN ĂN & COMBO (KHÁCH HÀNG GỌI MÓN)
═══════════════════════════════════════════════════════════════ */
function ItemDetailModal({ item, isCombo, inCart, onAddToCart, onUpdateQuantity, onClose }) {
  const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'

  return (
    <div className="cop-modal-overlay" onClick={onClose}>
      <div className="cop-modal-box cop-detail-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="cop-modal-header">
          <div className="cop-detail-modal-header-info">
            {isCombo && <span className="cop-tag-combo">Combo ưu đãi</span>}
            <h3 className="cop-detail-modal-title">{item.name}</h3>
          </div>
          <button className="cop-modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="cop-modal-body cop-detail-modal-body">
          <div className="cop-detail-img-wrap">
            <img
              src={item.image ? getImageFullUrl(item.image) : fallbackImg}
              alt={item.name}
              onError={(e) => { e.target.src = fallbackImg }}
            />
          </div>

          <div className="cop-detail-price-row">
            <span className="cop-detail-price">{fmt(item.price)} <small>đ</small></span>
            {item.categoryName && <span className="cop-detail-cat-badge">{item.categoryName}</span>}
          </div>

          {item.description && (
            <p className="cop-detail-desc">{item.description}</p>
          )}

          {!isCombo && item.mainIngredients && (
            <div className="cop-detail-ingredients">
              <span className="cop-detail-ing-label">Nguyên liệu chính:</span> {item.mainIngredients}
            </div>
          )}

          {/* Nếu là Combo: Hiển thị danh sách các món thành phần trong Combo */}
          {isCombo && (
            <div className="cop-detail-combo-section">
              <h4 className="cop-detail-combo-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Gói Combo gồm các món ({item.items?.length || 0} món):
              </h4>
              {item.items && item.items.length > 0 ? (
                <div className="cop-detail-combo-list">
                  {item.items.map((ci, idx) => (
                    <div key={idx} className="cop-detail-combo-card">
                      {ci.menuItemImage ? (
                        <img
                          src={getImageFullUrl(ci.menuItemImage)}
                          alt={ci.menuItemName}
                          className="cop-detail-combo-thumb"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <div className="cop-detail-combo-thumb placeholder">🍽️</div>
                      )}
                      <div className="cop-detail-combo-info">
                        <span className="cop-detail-combo-name">{ci.menuItemName}</span>
                        <span className="cop-detail-combo-qty">
                          Số lượng: <strong>{ci.quantity}x</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="cop-empty-hint">Chưa có danh sách món chi tiết.</p>
              )}
            </div>
          )}
        </div>

        <div className="cop-modal-footer cop-detail-modal-footer">
          <button className="cop-btn-outline" onClick={onClose}>Đóng</button>
          {!inCart ? (
            <button
              className="cop-btn-primary"
              onClick={() => {
                onAddToCart(item, isCombo)
                onClose()
              }}
            >
              + Thêm vào giỏ ({fmt(item.price)} đ)
            </button>
          ) : (
            <div className="cop-modal-cart-control">
              <span className="cop-modal-cart-label">Đã chọn ({inCart.quantity} phần):</span>
              <div className="cop-cart-control">
                <button
                  className="cop-qty-btn"
                  onClick={() => onUpdateQuantity(inCart.key, -1)}
                >
                  -
                </button>
                <span className="cop-qty-num">{inCart.quantity}</span>
                <button
                  className="cop-qty-btn"
                  onClick={() => onUpdateQuantity(inCart.key, 1)}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: CUSTOMER ORDER PAGE
═══════════════════════════════════════════════════════════════ */
export default function CustomerOrderPage() {
  const [searchParams] = useSearchParams()
  const routeParams = useParams()
  const navigate = useNavigate()

  // 1. Xác định bàn từ Query params (?tableId=...&tableNumber=...) hoặc URL param (/order/:tableId)
  const paramTableId = routeParams.tableId || searchParams.get('tableId')
  const paramTableNumber = searchParams.get('tableNumber')

  const [tableId, setTableId] = useState(paramTableId ? Number(paramTableId) : null)
  const [tableInfo, setTableInfo] = useState(null)
  const [tablesList, setTablesList] = useState([])

  // 2. Tab điều hướng: 'menu' (Gọi món mới) | 'ordered' (Món đã gọi của bàn)
  const [activeTab, setActiveTab] = useState('menu')

  // 3. Dữ liệu thực đơn
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)

  // 4. Bộ lọc thực đơn
  const [selectedCat, setSelectedCat] = useState('ALL') // 'ALL' | 'COMBOS' | categoryId
  const [searchKw, setSearchKw] = useState('')

  // 5. Giỏ hàng (Cart)
  const [cart, setCart] = useState([])
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [orderGeneralNote, setOrderGeneralNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 6. Ghi chú cho từng món
  const [noteModalTarget, setNoteModalTarget] = useState(null)
  // Modal xem chi tiết món / Combo
  const [detailModalItem, setDetailModalItem] = useState(null) // { item, isCombo }

  // 6.1 Chương trình khuyến mãi & Voucher
  const [availablePromos, setAvailablePromos] = useState([])
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [calculatingPromo, setCalculatingPromo] = useState(false)

  // 7. Danh sách món đã gọi của bàn này (từ Server)
  const [orderedOrders, setOrderedOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // 8. Thông báo (Toast)
  const [toast, setToast] = useState(null)
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Khởi tạo & nạp giỏ hàng từ LocalStorage ───────────────────────
  useEffect(() => {
    if (tableId) {
      try {
        const saved = localStorage.getItem(`lotus_cart_table_${tableId}`)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) setCart(parsed)
        }
      } catch (err) {
        console.error('Lỗi đọc giỏ hàng từ localStorage:', err)
      }
    }
  }, [tableId])

  // Lưu giỏ hàng vào LocalStorage mỗi khi giỏ thay đổi
  useEffect(() => {
    if (tableId) {
      try {
        localStorage.setItem(`lotus_cart_table_${tableId}`, JSON.stringify(cart))
      } catch (err) {
        console.error('Lỗi lưu giỏ hàng:', err)
      }
    }
  }, [cart, tableId])

  // ── Lấy thông tin bàn ăn ──────────────────────────────────────────
  useEffect(() => {
    if (tableId) {
      getTableById(tableId)
        .then((data) => {
          setTableInfo(data)
        })
        .catch(() => {
          if (paramTableNumber) {
            setTableInfo({ id: tableId, tableNumber: paramTableNumber })
          }
        })
    } else {
      // Nếu không có tableId trong URL, tải danh sách bàn để khách chọn
      getActiveTables().then((list) => {
        setTablesList(Array.isArray(list) ? list : [])
      }).catch(console.error)
    }
  }, [tableId, paramTableNumber])

  // ── Tải danh mục, món ăn, combo ──────────────────────────────────
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        setLoading(true)
        const [cats, items, coms, promos] = await Promise.all([
          getAllCategories().catch(() => []),
          getAllMenuItems({ status: 'ACTIVE' }).catch(() => []),
          getAllCombos().catch(() => []),
          getActivePromotions().catch(() => []),
        ])

        if (isMounted) {
          setCategories(cats.filter((c) => c.status === 'ACTIVE' || !c.status))
          setMenuItems(items.filter((i) => i.status === 'ACTIVE' || !i.status))
          setCombos(coms.filter((c) => c.status === 'ACTIVE' || !c.status))
          setAvailablePromos(promos || [])
        }
      } catch (e) {
        console.error('Lỗi tải dữ liệu thực đơn:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    })()

    return () => { isMounted = false }
  }, [])

  // ── Tải danh sách món đã gọi của bàn này ─────────────────────────
  const fetchActiveOrders = useCallback(async () => {
    if (!tableId) return
    try {
      setLoadingOrders(true)
      const data = await getCustomerActiveOrders(tableId)
      setOrderedOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi tải danh sách món đã gọi:', err)
    } finally {
      setLoadingOrders(false)
    }
  }, [tableId])

  useEffect(() => {
    if (tableId) {
      fetchActiveOrders()
    }
  }, [tableId, fetchActiveOrders])

  // ── Lắng nghe WebSocket để cập nhật trạng thái món đã gọi thời gian thực ──
  useEffect(() => {
    if (!tableId) return

    const unsubKitchen = subscribeWebSocket('/topic/kitchen', (event) => {
      // Khi có sự kiện liên quan tới bàn này -> tự động làm mới
      fetchActiveOrders()
      if (event && event.message && event.message.includes(`Bàn ${tableInfo?.tableNumber || tableId}`)) {
        showToast(event.message, 'info')
      }
    })

    const unsubOrders = subscribeWebSocket('/topic/orders', () => {
      fetchActiveOrders()
    })

    return () => {
      if (typeof unsubKitchen === 'function') unsubKitchen()
      if (typeof unsubOrders === 'function') unsubOrders()
    }
  }, [tableId, tableInfo, fetchActiveOrders])

  // ── Xử lý thêm/bớt giỏ hàng ──────────────────────────────────────
  const handleAddToCart = (product, isCombo = false) => {
    const key = isCombo ? `combo_${product.id}` : `menu_${product.id}`
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.key === key)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [
        ...prev,
        {
          key,
          itemType: isCombo ? 'COMBO' : 'MENU_ITEM',
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
          note: '',
        },
      ]
    })
  }

  const handleUpdateQuantity = (key, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.key === key) {
            const nextQty = i.quantity + delta
            return nextQty > 0 ? { ...i, quantity: nextQty } : null
          }
          return i
        })
        .filter(Boolean)
    )
  }

  const handleRemoveFromCart = (key) => {
    setCart((prev) => prev.filter((i) => i.key !== key))
  }

  const handleSaveItemNote = (key, note) => {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, note } : i))
    )
  }

  // ── Tính tổng giỏ hàng ───────────────────────────────────────────
  const cartStats = useMemo(() => {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = cart.reduce((sum, item) => sum + item.quantity * Number(item.price), 0)
    return { totalCount, totalPrice }
  }, [cart])

  // Áp dụng mã khuyến mãi bằng Strategy Pattern từ Backend
  const handleApplyPromo = useCallback(async (codeToApply) => {
    const code = (codeToApply || promoCodeInput).trim().toUpperCase()
    if (!code) {
      showToast('Vui lòng nhập mã khuyến mãi!', 'error')
      return
    }
    if (cartStats.totalPrice <= 0) {
      showToast('Giỏ hàng chưa có món ăn để áp dụng khuyến mãi!', 'error')
      return
    }

    try {
      setCalculatingPromo(true)
      const res = await calculatePromotion({
        code,
        orderTotal: cartStats.totalPrice,
      })

      if (res.valid) {
        setAppliedPromo(res)
        setPromoCodeInput(code)
        showToast(res.message || 'Áp dụng mã khuyến mãi thành công!', 'success')
      } else {
        setAppliedPromo(null)
        showToast(res.message || 'Mã khuyến mãi không hợp lệ!', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Lỗi kiểm tra mã khuyến mãi', 'error')
    } finally {
      setCalculatingPromo(false)
    }
  }, [promoCodeInput, cartStats.totalPrice])

  // Tự động tính toán lại mức giảm giá khi giỏ hàng thay đổi
  useEffect(() => {
    if (appliedPromo && appliedPromo.promotion) {
      if (cartStats.totalPrice <= 0) {
        setAppliedPromo(null)
      } else {
        calculatePromotion({
          code: appliedPromo.promotion.code,
          orderTotal: cartStats.totalPrice,
        }).then((res) => {
          if (res.valid) {
            setAppliedPromo(res)
          } else {
            setAppliedPromo(null)
            showToast(`Mã ${appliedPromo.promotion.code} không còn đủ điều kiện: ${res.message}`, 'error')
          }
        }).catch(() => {})
      }
    }
  }, [cartStats.totalPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoCodeInput('')
    showToast('Đã hủy áp dụng mã khuyến mãi')
  }

  // ── Lọc thực đơn hiển thị ────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const kw = searchKw.trim().toLowerCase()

    // 1. Nếu chọn Combo
    if (selectedCat === 'COMBOS') {
      let list = [...combos]
      if (kw) {
        list = list.filter((c) =>
          c.name.toLowerCase().includes(kw) ||
          (c.description && c.description.toLowerCase().includes(kw))
        )
      }
      return { type: 'COMBOS', list }
    }

    // 2. Món ăn theo danh mục hoặc tất cả
    let list = [...menuItems]
    if (selectedCat !== 'ALL') {
      list = list.filter((i) => String(i.categoryId) === String(selectedCat))
    }
    if (kw) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(kw) ||
          (i.mainIngredients && i.mainIngredients.toLowerCase().includes(kw)) ||
          (i.description && i.description.toLowerCase().includes(kw))
      )
    }

    return { type: 'ITEMS', list }
  }, [selectedCat, searchKw, menuItems, combos])

  // ── Gửi đơn gọi món lên Bếp ───────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!tableId) {
      showToast('Vui lòng chọn số bàn trước khi gọi món!', 'error')
      return
    }

    if (cart.length === 0) {
      showToast('Giỏ hàng đang trống, vui lòng chọn món!', 'error')
      return
    }

    try {
      setSubmitting(true)

      let finalNote = orderGeneralNote.trim()
      if (appliedPromo && appliedPromo.promotion) {
        const promoNote = `[Ưu đãi: ${appliedPromo.promotion.code} - Giảm ${fmt(appliedPromo.discountAmount)}đ]`
        finalNote = finalNote ? `${finalNote} | ${promoNote}` : promoNote
      }

      const payload = {
        tableId: Number(tableId),
        note: finalNote || undefined,
        items: cart.map((i) => ({
          menuItemId: i.itemType === 'MENU_ITEM' ? i.id : undefined,
          comboId: i.itemType === 'COMBO' ? i.id : undefined,
          quantity: i.quantity,
          note: i.note || undefined,
        })),
      }

      await createCustomerOrder(payload)

      // Thành công: Xóa giỏ hàng & đóng modal
      setCart([])
      setAppliedPromo(null)
      setPromoCodeInput('')
      localStorage.removeItem(`lotus_cart_table_${tableId}`)
      setShowCartDrawer(false)
      setOrderGeneralNote('')

      showToast('Đã gửi gọi món thành công tới Nhà Bếp!', 'success')

      // Chuyển sang xem danh sách món đã gọi
      setActiveTab('ordered')
      fetchActiveOrders()
    } catch (err) {
      showToast(err.message || 'Không thể gửi gọi món, vui lòng thử lại!', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Tổng hợp các món đã gọi từ danh sách đơn của bàn ──────────────
  const aggregatedOrderedItems = useMemo(() => {
    const list = []
    orderedOrders.forEach((ord) => {
      if (Array.isArray(ord.items)) {
        ord.items.forEach((item) => {
          list.push({
            ...item,
            orderId: ord.id,
            orderCreatedAt: ord.createdAt,
          })
        })
      }
    })
    return list
  }, [orderedOrders])

  // Trạng thái hiển thị tiếng Việt
  const getItemStatusBadge = (st) => {
    switch (st) {
      case 'PENDING':
        return <span className="cop-badge cop-badge-pending">Chờ Bếp nhận</span>
      case 'COOKING':
        return <span className="cop-badge cop-badge-cooking">Bếp đang nấu</span>
      case 'SERVED':
        return <span className="cop-badge cop-badge-served">Đã lên món</span>
      case 'CANCELLED':
        return <span className="cop-badge cop-badge-cancelled">Đã hủy</span>
      default:
        return <span className="cop-badge cop-badge-default">{st}</span>
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Nếu chưa có bàn, hiển thị màn hình chọn bàn
  // ─────────────────────────────────────────────────────────────────
  if (!tableId) {
    return (
      <div className="cop-wrapper">
        <header className="cop-header">
          <div className="cop-header-brand">
            <LotusLogo size={32} />
            <div>
              <h1 className="cop-brand-title">Nhà Hàng Hoa Sen</h1>
              <p className="cop-brand-sub">Quét mã QR gọi món tại bàn</p>
            </div>
          </div>
        </header>

        <main className="cop-no-table-container">
          <div className="cop-no-table-card">
            <h2>Chào Mừng Quý Khách Đến Với Hoa Sen</h2>
            <p>
              Vui lòng dùng máy ảnh điện thoại <strong>quét mã QR dán trên mặt bàn</strong> để hệ thống tự động nhận diện bàn ăn của bạn.
            </p>

            <div className="cop-divider"><span>HOẶC CHỌN BÀN THỦ CÔNG</span></div>

            <div className="cop-table-selector">
              <label>Chọn bàn bạn đang ngồi:</label>
              <select
                className="cop-select"
                onChange={(e) => {
                  const val = e.target.value
                  if (val) {
                    setTableId(Number(val))
                    navigate(`/order?tableId=${val}`)
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>-- Nhấp để chọn số bàn --</option>
                {tablesList.map((t) => (
                  <option key={t.id} value={t.id}>
                    Bàn {t.tableNumber} ({t.capacity} chỗ - {t.status === 'AVAILABLE' ? 'Bàn trống' : 'Đang phục vụ'})
                  </option>
                ))}
              </select>
            </div>

            <Link to="/customer" className="cop-btn-link">
              ← Về trang chủ Nhà hàng Hoa Sen
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Giao diện gọi món tại bàn
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="cop-wrapper">
      {/* Toast Notification */}
      {toast && (
        <div className={`cop-toast cop-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* ── TOP STICKY WRAPPER: HEADER + CATEGORY TABS CỐ ĐỊNH Ở ĐẦU TRANG ── */}
      <div className="cop-top-sticky">
        <header className="cop-header">
          <div className="cop-header-brand">
            <LotusLogo size={30} />
            <div>
              <h1 className="cop-brand-title">Hoa Sen Restaurant</h1>
              <p className="cop-table-pill">
                Quý khách đang ngồi: <strong>Bàn {tableInfo?.tableNumber || tableId}</strong>
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="cop-header-tabs">
            <button
              className={`cop-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              Thực đơn
            </button>
            <button
              className={`cop-tab-btn ${activeTab === 'ordered' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('ordered')
                fetchActiveOrders()
              }}
            >
              Món đã gọi
              {aggregatedOrderedItems.length > 0 && (
                <span className="cop-tab-badge">{aggregatedOrderedItems.length}</span>
              )}
            </button>
          </div>
        </header>

        {/* Thanh tìm kiếm & Danh mục dính liền đầu trang khi lướt */}
        {activeTab === 'menu' && (
          <div className="cop-sticky-filter-bar">
            {/* Search Box */}
            <div className="cop-search-bar">
              <svg className="cop-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                placeholder="Tìm món ngon, nguyên liệu..."
                value={searchKw}
                onChange={(e) => setSearchKw(e.target.value)}
              />
              {searchKw && (
                <button className="cop-search-clear" onClick={() => setSearchKw('')}>&times;</button>
              )}
            </div>

            {/* Category Pills */}
            <div className="cop-category-scroll">
              <button
                className={`cop-cat-pill ${selectedCat === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedCat('ALL')}
              >
                Tất cả ({menuItems.length})
              </button>

              <button
                className={`cop-cat-pill ${selectedCat === 'COMBOS' ? 'active' : ''}`}
                onClick={() => setSelectedCat('COMBOS')}
              >
                Combo Ưu Đãi ({combos.length})
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`cop-cat-pill ${String(selectedCat) === String(c.id) ? 'active' : ''}`}
                  onClick={() => setSelectedCat(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── NỘI DUNG CHÍNH ── */}
      <main className="cop-main">
        {/* =========================================================
            TAB 1: THỰC ĐƠN CHỌN MÓN (MENU & ADD TO CART)
        ========================================================= */}
        {activeTab === 'menu' && (
          <div className="cop-menu-tab">
            {/* Product Grid */}
            {loading ? (
              <div className="cop-loading-state">
                <div className="cop-spinner" />
                <p>Đang chuẩn bị thực đơn Hoa Sen...</p>
              </div>
            ) : filteredProducts.list.length === 0 ? (
              <div className="cop-empty-state">
                <p>Không tìm thấy món ăn nào phù hợp với tìm kiếm của bạn.</p>
              </div>
            ) : (
              <div className="cop-product-grid">
                {filteredProducts.list.map((prod) => {
                  const isCombo = filteredProducts.type === 'COMBOS'
                  const key = isCombo ? `combo_${prod.id}` : `menu_${prod.id}`
                  const cartItem = cart.find((i) => i.key === key)
                  const fallbackImg = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80'

                  return (
                    <div
                      key={key}
                      className={`cop-product-card ${cartItem ? 'in-cart' : ''}`}
                      onClick={() => setDetailModalItem({ item: prod, isCombo, inCart: cartItem })}
                      title="Bấm để xem chi tiết món ăn"
                    >
                      <div className="cop-product-img-wrap">
                        <img
                          src={prod.image ? getImageFullUrl(prod.image) : fallbackImg}
                          alt={prod.name}
                          loading="lazy"
                          onError={(e) => { e.target.src = fallbackImg }}
                        />
                        {isCombo && <span className="cop-tag-combo">Combo</span>}
                      </div>

                      <div className="cop-product-info">
                        <h3 className="cop-product-name">{prod.name}</h3>
                        {prod.mainIngredients && (
                          <p className="cop-product-ingredients">{prod.mainIngredients}</p>
                        )}
                        <p className="cop-product-desc">
                          {prod.description || 'Hương vị đậm đà, thơm ngon đặc trưng ẩm thực Hà Thành.'}
                        </p>

                        {/* Gợi ý bấm xem chi tiết món trong combo */}
                        {isCombo && (
                          <div className="cop-combo-preview-btn">
                            <span>Xem {prod.items?.length || 0} món gồm có &rsaquo;</span>
                          </div>
                        )}

                        <div className="cop-product-bottom">
                          <div className="cop-product-price">
                            {fmt(prod.price)} <small>đ</small>
                          </div>

                          {/* Controller Giỏ hàng */}
                          {!cartItem ? (
                            <button
                              className="cop-btn-add-cart"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddToCart(prod, isCombo)
                              }}
                              title="Thêm vào giỏ"
                            >
                              + Thêm
                            </button>
                          ) : (
                            <div className="cop-cart-control" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="cop-qty-btn"
                                onClick={() => handleUpdateQuantity(key, -1)}
                              >
                                -
                              </button>
                              <span className="cop-qty-num">{cartItem.quantity}</span>
                              <button
                                className="cop-qty-btn"
                                onClick={() => handleUpdateQuantity(key, 1)}
                              >
                                +
                              </button>
                              <button
                                className={`cop-note-btn ${cartItem.note ? 'has-note' : ''}`}
                                title="Ghi chú"
                                onClick={() => setNoteModalTarget(cartItem)}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                  <path d="m15 5 4 4"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Ghi chú đang áp dụng cho món */}
                        {cartItem && cartItem.note && (
                          <div
                            className="cop-item-note-preview"
                            onClick={(e) => {
                              e.stopPropagation()
                              setNoteModalTarget(cartItem)
                            }}
                          >
                            <span>Ghi chú: {cartItem.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: DANH SÁCH MÓN ĐÃ GỌI CỦA BÀN
        ========================================================= */}
        {activeTab === 'ordered' && (
          <div className="cop-ordered-tab">
            <div className="cop-ordered-header">
              <h2>Món Đang Phục Vụ Tại Bàn {tableInfo?.tableNumber || tableId}</h2>
              <button
                className="cop-refresh-btn"
                onClick={fetchActiveOrders}
                disabled={loadingOrders}
              >
                {loadingOrders ? 'Đang cập nhật...' : 'Làm mới'}
              </button>
            </div>

            {loadingOrders && aggregatedOrderedItems.length === 0 ? (
              <div className="cop-loading-state">
                <div className="cop-spinner" />
                <p>Đang kiểm tra đơn món của bàn...</p>
              </div>
            ) : aggregatedOrderedItems.length === 0 ? (
              <div className="cop-empty-ordered">
                <h3>Bàn chưa có món nào được gọi</h3>
                <p>Quý khách vui lòng chuyển sang tab <strong>Thực đơn</strong> để chọn món và gửi đến bếp!</p>
                <button className="cop-btn-primary" onClick={() => setActiveTab('menu')}>
                  Xem thực đơn ngay
                </button>
              </div>
            ) : (
              <div className="cop-ordered-list">
                <div className="cop-ordered-notice">
                  <span>Trạng thái chế biến được cập nhật trực tiếp theo thời gian thực từ Nhà Bếp.</span>
                </div>

                {aggregatedOrderedItems.map((item, idx) => (
                  <div key={`${item.id || idx}`} className="cop-ordered-card">
                    <div className="cop-ordered-card-info">
                      <div className="cop-ordered-card-title">
                        <h4>{item.itemName || item.menuItemName || item.comboName || 'Món ăn'}</h4>
                        <span className="cop-ordered-qty">x{item.quantity}</span>
                      </div>
                      <div className="cop-ordered-price">
                        {fmt(item.subtotal || item.unitPrice * item.quantity)} đ
                      </div>
                      {item.note && (
                        <div className="cop-ordered-note">
                          <span>Ghi chú: {item.note}</span>
                        </div>
                      )}
                    </div>
                    <div className="cop-ordered-status-wrap">
                      {getItemStatusBadge(item.status)}
                    </div>
                  </div>
                ))}

                <div className="cop-ordered-footer-actions">
                  <button className="cop-btn-outline" onClick={() => setActiveTab('menu')}>
                    + Tiếp tục gọi thêm món
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── THANH GIỎ HÀNG NỔI (STICKY BOTTOM BAR) ── */}
      {cartStats.totalCount > 0 && activeTab === 'menu' && (
        <div className="cop-sticky-cart-bar">
          <div className="cop-sticky-cart-left" onClick={() => setShowCartDrawer(true)}>
            <div className="cop-cart-badge-wrap">
              <svg className="cop-cart-svg-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
              <span className="cop-cart-badge">{cartStats.totalCount}</span>
            </div>
            <div className="cop-cart-summary-text">
              <div className="cop-cart-total-price">{fmt(cartStats.totalPrice)} đ</div>
              <small className="cop-cart-items-count">{cartStats.totalCount} món đang chọn</small>
            </div>
          </div>

          <button
            className="cop-sticky-submit-btn"
            onClick={() => setShowCartDrawer(true)}
          >
            Xem giỏ & Gọi món →
          </button>
        </div>
      )}

      {/* ── MODAL / DRAWER GIỎ HÀNG ── */}
      {showCartDrawer && (
        <div className="cop-drawer-overlay" onClick={() => setShowCartDrawer(false)}>
          <div className="cop-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cop-drawer-header">
              <div className="cop-drawer-title-group">
                <h3>Giỏ Hàng Gọi Món</h3>
                <span className="cop-drawer-table-tag">Bàn {tableInfo?.tableNumber || tableId}</span>
              </div>
              <button className="cop-drawer-close" onClick={() => setShowCartDrawer(false)}>
                &times;
              </button>
            </div>

            <div className="cop-drawer-body">
              {cart.length === 0 ? (
                <div className="cop-drawer-empty">
                  <p>Giỏ hàng đang trống. Quý khách vui lòng chọn món ăn từ thực đơn!</p>
                </div>
              ) : (
                <div className="cop-drawer-items">
                  {cart.map((item) => (
                    <div key={item.key} className="cop-drawer-item">
                      <div className="cop-drawer-item-info">
                        <div className="cop-drawer-item-name">{item.name}</div>
                        <div className="cop-drawer-item-price">
                          {fmt(item.price)} đ × {item.quantity} = <strong>{fmt(item.price * item.quantity)} đ</strong>
                        </div>
                        {item.note && (
                          <div className="cop-drawer-item-note">
                            <span>Ghi chú: {item.note}</span>
                          </div>
                        )}
                      </div>

                      <div className="cop-drawer-item-actions">
                        <div className="cop-cart-control mini">
                          <button
                            className="cop-qty-btn"
                            onClick={() => handleUpdateQuantity(item.key, -1)}
                          >
                            -
                          </button>
                          <span className="cop-qty-num">{item.quantity}</span>
                          <button
                            className="cop-qty-btn"
                            onClick={() => handleUpdateQuantity(item.key, 1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="cop-drawer-item-edit-note"
                          onClick={() => setNoteModalTarget(item)}
                          title="Sửa ghi chú"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                          </svg>
                        </button>
                        <button
                          className="cop-drawer-item-delete"
                          onClick={() => handleRemoveFromCart(item.key)}
                          title="Xóa món"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Ghi chú chung cho đơn */}
                  <div className="cop-drawer-general-note">
                    <label>Ghi chú chung cho Nhà Bếp (nếu có):</label>
                    <textarea
                      rows="2"
                      placeholder="Ví dụ: Đem món khai vị ra trước, ăn cay ít..."
                      value={orderGeneralNote}
                      onChange={(e) => setOrderGeneralNote(e.target.value)}
                    />
                  </div>

                  {/* Mục Mã Khuyến Mãi / Voucher (Strategy Pattern) */}
                  <div className="cop-drawer-promo-section">
                    <div className="cop-drawer-promo-title">
                      <span>🎟️ Ưu đãi & Voucher giảm giá</span>
                    </div>

                    {!appliedPromo ? (
                      <div className="cop-promo-input-group">
                        <input
                          type="text"
                          className="cop-promo-input"
                          placeholder="Nhập mã voucher (VD: LOTUS10, GIAM30K)..."
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase().replace(/\s/g, ''))}
                        />
                        <button
                          type="button"
                          className="cop-btn-apply-promo"
                          onClick={() => handleApplyPromo()}
                          disabled={calculatingPromo || !promoCodeInput.trim()}
                        >
                          {calculatingPromo ? '...' : 'Áp dụng'}
                        </button>
                      </div>
                    ) : (
                      <div className="cop-promo-applied-badge">
                        <div className="cop-promo-applied-info">
                          <span className="cop-promo-code-tag">{appliedPromo.promotion?.code}</span>
                          <span className="cop-promo-saved-text">
                            Tiết kiệm: -{fmt(appliedPromo.discountAmount)} đ
                          </span>
                        </div>
                        <button
                          type="button"
                          className="cop-promo-remove-btn"
                          onClick={handleRemovePromo}
                          title="Hủy mã này"
                        >
                          &times;
                        </button>
                      </div>
                    )}

                    {/* Danh sách voucher gợi ý có sẵn */}
                    {availablePromos.length > 0 && !appliedPromo && (
                      <div className="cop-promo-quick-list">
                        <span className="cop-promo-quick-label">Gợi ý cho bạn:</span>
                        <div className="cop-promo-chips">
                          {availablePromos.slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="cop-promo-chip"
                              onClick={() => handleApplyPromo(p.code)}
                            >
                              🎁 {p.code} ({p.type === 'PERCENTAGE' ? `-${p.discountValue}%` : `-${fmt(p.discountValue)}đ`})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cop-drawer-footer">
                <div className="cop-drawer-calc-box">
                  <div className="cop-drawer-total-row">
                    <span>Tạm tính ({cartStats.totalCount} món):</span>
                    <span>{fmt(cartStats.totalPrice)} đ</span>
                  </div>
                  {appliedPromo && appliedPromo.discountAmount > 0 && (
                    <div className="cop-drawer-total-row promo-discount-row">
                      <span>Ưu đãi ({appliedPromo.promotion?.code}):</span>
                      <span>-{fmt(appliedPromo.discountAmount)} đ</span>
                    </div>
                  )}
                  <div className="cop-drawer-total-row final-row">
                    <span>Tổng cần thanh toán:</span>
                    <strong className="cop-drawer-total-val">
                      {fmt(appliedPromo ? appliedPromo.finalAmount : cartStats.totalPrice)} VNĐ
                    </strong>
                  </div>
                </div>

                <div className="cop-drawer-btns">
                  <button
                    className="cop-btn-outline"
                    onClick={() => setCart([])}
                    disabled={submitting}
                  >
                    Xóa giỏ
                  </button>
                  <button
                    className="cop-btn-primary cop-btn-order"
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                  >
                    {submitting ? 'Đang gửi Bếp...' : 'Xác nhận Gọi Món Ngay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL SỬA GHI CHÚ MÓN ── */}
      {noteModalTarget && (
        <NoteModal
          item={noteModalTarget}
          initialNote={noteModalTarget.note}
          onSave={(newNote) => handleSaveItemNote(noteModalTarget.key, newNote)}
          onClose={() => setNoteModalTarget(null)}
        />
      )}

      {/* ── MODAL XEM CHI TIẾT MÓN ĂN & COMBO ── */}
      {detailModalItem && (
        <ItemDetailModal
          item={detailModalItem.item}
          isCombo={detailModalItem.isCombo}
          inCart={cart.find((i) => i.key === (detailModalItem.isCombo ? `combo_${detailModalItem.item.id}` : `menu_${detailModalItem.item.id}`))}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onClose={() => setDetailModalItem(null)}
        />
      )}

      {/* ── TRỢ LÝ ẢO GEMINI AI HỖ TRỢ KHÁCH HÀNG ── */}
      <CustomerChatBox />
    </div>
  )
}
