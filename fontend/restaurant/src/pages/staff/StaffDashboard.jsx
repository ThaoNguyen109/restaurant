import { useState, useEffect, useCallback } from 'react'
import './StaffDashboard.css'
import {
  getAllTables,
  updateTableStatus,
} from '../../services/tableService'
import {
  getAllOrders,
  createOrder,
  addOrderItem,
  deleteOrderItem,
  updateOrderStatus,
} from '../../services/orderService'
import { getAllMenuItems } from '../../services/menuItemService'
import { getAllCombos } from '../../services/comboService'
import { getAllCategories } from '../../services/categoryService'
import { getImageFullUrl } from '../../services/apiClient'
import { getRole } from '../../utils/auth'
import { subscribeWebSocket } from '../../services/websocketService'
import { playStaffNotification, playReservationAlert } from '../../utils/soundNotification'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function StaffDashboard() {
  // ── View Mode ─────────────────────────────────────────────────────
  // 'tables' (Sơ đồ bàn) | 'ordering' (Gọi món cho bàn)
  const [viewMode, setViewMode] = useState('tables')

  const role = getRole()?.toUpperCase()
  const canAccessKitchen = ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'].includes(role)
  const canAccessCashier = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  // ── States ────────────────────────────────────────────────────────
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [combos, setCombos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Selected table for ordering or viewing
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeTableOrder, setActiveTableOrder] = useState(null)
  const [showTableModal, setShowTableModal] = useState(false)

  // Ordering State
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [menuTab, setMenuTab] = useState('dish') // 'dish' | 'combo'
  const [searchDish, setSearchDish] = useState('')
  const [cart, setCart] = useState([])
  const [orderNote, setOrderNote] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Data Fetching ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [tablesData, ordersData, itemsData, combosData, catsData] = await Promise.all([
        getAllTables().catch(() => []),
        getAllOrders().catch(() => []),
        getAllMenuItems().catch(() => []),
        getAllCombos().catch(() => []),
        getAllCategories().catch(() => []),
      ])

      setTables(tablesData || [])
      setOrders(ordersData || [])

      // CHỈ HIỂN THỊ MÓN ĐANG HOẠT ĐỘNG (status === 'ACTIVE')
      const activeItems = (itemsData || []).filter(item => item.status === 'ACTIVE')
      setMenuItems(activeItems)

      // Lọc combo nếu có
      const activeCombos = (combosData || []).filter(c => !c.status || c.status === 'ACTIVE')
      setCombos(activeCombos)

      setCategories(catsData || [])
    } catch (err) {
      console.error('Staff fetch error', err)
      showToast('Lỗi tải dữ liệu: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Realtime subscription for order updates (from kitchen, staff, etc.)
    const unsubOrders = subscribeWebSocket('/topic/orders', (event) => {
      console.log('[Staff Realtime Order Event]:', event)
      if (event?.message) {
        showToast(`⚡ ${event.message}`)
      }
      playStaffNotification()

      // If active table modal is open with this order, update it immediately in place
      if (event?.data?.id) {
        setActiveTableOrder(prev => (prev && prev.id === event.data.id ? event.data : prev))
      }

      fetchData()
    })

    // Realtime subscription for table status changes
    const unsubTables = subscribeWebSocket('/topic/tables', (event) => {
      console.log('[Staff Realtime Table Event]:', event)
      fetchData()
    })

    // Realtime subscription for guest reservations
    const unsubReservations = subscribeWebSocket('/topic/reservations', (event) => {
      console.log('[Staff Realtime Reservation Event]:', event)
      if (event?.eventType === 'RESERVATION_CREATED') {
        playReservationAlert()
        if (event?.message) {
          showToast(`🔔 ${event.message}`)
        }
      } else {
        playStaffNotification()
      }
      fetchData()
    })

    return () => {
      unsubOrders()
      unsubTables()
      unsubReservations()
    }
  }, [fetchData])

  // ── Table Selection Handlers ─────────────────────────────────────
  const handleTableClick = (table) => {
    // Tìm đơn đang hoạt động của bàn
    const currentOrder = orders.find(
      o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
    )

    if (table.status === 'AVAILABLE') {
      // Bàn trống -> Mở màn hình gọi món mới
      setSelectedTable(table)
      setActiveTableOrder(null)
      setCart([])
      setOrderNote('')
      setViewMode('ordering')
    } else if (table.status === 'OCCUPIED' || currentOrder) {
      // Bàn đang có khách -> Mở popup chi tiết bàn & các món đang gọi
      setSelectedTable(table)
      setActiveTableOrder(currentOrder || null)
      setShowTableModal(true)
    } else {
      showToast(`Bàn ${table.tableNumber} hiện đang ở trạng thái ${table.status}`)
    }
  }

  // Chuyển sang gọi thêm món cho bàn đang có khách
  const handleAddMoreItems = () => {
    setShowTableModal(false)
    setCart([])
    setOrderNote('')
    setViewMode('ordering')
  }

  // ── Cart Handlers ────────────────────────────────────────────────
  const handleAddToCart = (product, isCombo = false) => {
    setCart(prev => {
      const key = isCombo ? `combo_${product.id}` : `dish_${product.id}`
      const existingIdx = prev.findIndex(item => isCombo ? item.comboId === product.id : item.menuItemId === product.id)

      if (existingIdx > -1) {
        return prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
        )
      } else {
        return [
          ...prev,
          {
            key,
            menuItemId: !isCombo ? product.id : undefined,
            comboId: isCombo ? product.id : undefined,
            name: product.name,
            price: product.price,
            quantity: 1,
            note: '',
            image: product.image,
          },
        ]
      }
    })
  }

  const handleUpdateCartQty = (index, delta) => {
    setCart(prev => {
      const target = prev[index]
      if (!target) return prev
      const newQty = target.quantity + delta
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index)
      }
      return prev.map((item, i) =>
        i === index ? { ...item, quantity: newQty } : item
      )
    })
  }

  const handleUpdateCartNote = (index, note) => {
    setCart(prev =>
      prev.map((item, i) => (i === index ? { ...item, note } : item))
    )
  }

  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  // ── Submit Order to Kitchen ──────────────────────────────────────
  const handleSubmitOrder = async () => {
    if (!selectedTable) return
    if (cart.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 món ăn!')
      return
    }

    setSubmittingOrder(true)
    try {
      if (activeTableOrder) {
        // Đã có đơn của bàn -> Gọi thêm từng món vào đơn
        for (const item of cart) {
          await addOrderItem(activeTableOrder.id, {
            menuItemId: item.menuItemId,
            comboId: item.comboId,
            quantity: item.quantity,
            note: item.note ? item.note.trim() : undefined,
          })
        }
        showToast(`Đã gọi thêm món cho Bàn ${selectedTable.tableNumber} thành công!`)
      } else {
        // Bàn trống mới -> Tạo đơn hàng mới
        await createOrder({
          tableId: selectedTable.id,
          note: orderNote.trim() || undefined,
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            comboId: item.comboId,
            quantity: item.quantity,
            note: item.note ? item.note.trim() : undefined,
          })),
        })
        showToast(`Đã mở Bàn ${selectedTable.tableNumber} và gửi đơn vào bếp!`)
      }

      // Refresh data & quay lại sơ đồ bàn
      await fetchData()
      setViewMode('tables')
      setSelectedTable(null)
      setActiveTableOrder(null)
      setCart([])
    } catch (err) {
      showToast('Lỗi gửi đơn: ' + (err.message || ''))
    } finally {
      setSubmittingOrder(false)
    }
  }

  // ── Xóa món khỏi đơn (CHỈ KHI CHƯA CHẾ BIẾN - PENDING) ────────────
  const handleDeleteItem = async (itemId, itemStatus, itemName) => {
    if (itemStatus !== 'PENDING') {
      showToast(`Món "${itemName}" đã ở bước [${itemStatus}], không thể xóa!`)
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn hủy món "${itemName}" không?`)) return

    try {
      const updatedOrder = await deleteOrderItem(activeTableOrder.id, itemId)
      showToast(`Đã hủy món "${itemName}" khỏi đơn`)
      setActiveTableOrder(updatedOrder)
      fetchData()
    } catch (err) {
      showToast('Lỗi xóa món: ' + (err.message || ''))
    }
  }

  // ── Hoàn tất / Trả bàn ───────────────────────────────────────────
  const handleCheckoutTable = async () => {
    if (!activeTableOrder) return
    if (!window.confirm(`Xác nhận thanh toán và giải phóng Bàn ${selectedTable?.tableNumber}?`)) return

    try {
      await updateOrderStatus(activeTableOrder.id, 'COMPLETED')
      showToast(`Bàn ${selectedTable?.tableNumber} đã hoàn tất và thanh toán!`)
      setShowTableModal(false)
      fetchData()
    } catch (err) {
      showToast('Lỗi thanh toán: ' + (err.message || ''))
    }
  }

  // ── Filtered Dishes for Ordering ─────────────────────────────────
  const filteredMenuItems = menuItems.filter(item => {
    const matchCat = selectedCategory === 'ALL' || item.categoryId === Number(selectedCategory)
    const matchSearch = !searchDish || item.name?.toLowerCase().includes(searchDish.toLowerCase())
    return matchCat && matchSearch
  })

  const filteredCombos = combos.filter(item =>
    !searchDish || item.name?.toLowerCase().includes(searchDish.toLowerCase())
  )

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)

  return (
    <div className="waiter-container">
      {/* 1. TOP BAR */}
      <header className="waiter-topbar">
        <div className="waiter-brand">
          <div className="waiter-brand-logo">🍽️</div>
          <div>
            <h1 className="waiter-title">PHỤC VỤ & GỌI MÓN (POS)</h1>
          </div>
        </div>

        <div className="waiter-topbar-center">
          <button
            className={`waiter-tab-btn ${viewMode === 'tables' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('tables')
              setSelectedTable(null)
              setActiveTableOrder(null)
            }}
          >
            🪑 Sơ đồ bàn
          </button>
          {selectedTable && (
            <button
              className={`waiter-tab-btn ${viewMode === 'ordering' ? 'active' : ''}`}
              onClick={() => setViewMode('ordering')}
            >
              📝 Gọi món (Bàn {selectedTable.tableNumber})
            </button>
          )}
        </div>

        <div className="waiter-topbar-right">
          <a href="/staff/reservations" className="waiter-link-btn" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0', fontWeight: 800 }}>
            📅 Đặt bàn
          </a>
          <button className="waiter-tab-btn" onClick={fetchData} title="Làm mới">
            🔄 Làm mới
          </button>
          {canAccessKitchen && <a href="/kitchen" className="waiter-link-btn">🍳 Bếp (KDS)</a>}
          {canAccessCashier && <a href="/cashier" className="waiter-link-btn">💰 Thu ngân</a>}
          {canAccessAdmin   && <a href="/admin/orders" className="waiter-link-btn">📊 Admin</a>}
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="waiter-content">
        {viewMode === 'tables' ? (
          /* ── VIEW 1: SƠ ĐỒ BÀN ─────────────────────────────────── */
          <>
            <div className="waiter-table-stats">
              <div className="waiter-stat-pill">
                <span className="waiter-dot available" />
                <span>Bàn trống ({tables.filter(t => t.status === 'AVAILABLE').length})</span>
              </div>
              <div className="waiter-stat-pill">
                <span className="waiter-dot occupied" />
                <span>Đang phục vụ ({tables.filter(t => t.status === 'OCCUPIED').length})</span>
              </div>
              <div className="waiter-stat-pill">
                <span className="waiter-dot reserved" />
                <span>Đã đặt trước ({tables.filter(t => t.status === 'RESERVED').length})</span>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                Đang tải sơ đồ bàn...
              </div>
            ) : (
              <div className="waiter-tables-grid">
                {tables.map(table => {
                  const activeOrder = orders.find(
                    o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
                  )

                  return (
                    <div
                      key={table.id}
                      className={`waiter-table-card ${table.status}`}
                      onClick={() => handleTableClick(table)}
                    >
                      <div className="waiter-table-card-top">
                        <div>
                          <div className="waiter-table-num">BÀN {table.tableNumber}</div>
                          <div className="waiter-table-cap">{table.capacity} chỗ ngồi</div>
                        </div>
                        <span className={`waiter-table-status-tag ${table.status}`}>
                          {table.status === 'AVAILABLE' ? 'Trống' : table.status === 'OCCUPIED' ? 'Có khách' : table.status}
                        </span>
                      </div>

                      <div className="waiter-table-card-bottom">
                        {activeOrder ? (
                          <>
                            <div className="waiter-active-amount">
                              {formatCurrency(activeOrder.totalAmount)}
                            </div>
                            <div className="waiter-active-count">
                              {activeOrder.items?.length || 0} món • #{activeOrder.id}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: '#16a34a', fontWeight: 700 }}>
                            + Chạm để mở bàn
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* ── VIEW 2: MÀN HÌNH GỌI MÓN (POS ORDERING) ───────────── */
          <div className="waiter-pos-layout">
            {/* CỘT TRÁI: MENU CHỌN MÓN (CHỈ MÓN ACTIVE) */}
            <div className="waiter-menu-pane">
              <div className="waiter-menu-header">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`waiter-cat-btn ${menuTab === 'dish' ? 'active' : ''}`}
                    onClick={() => setMenuTab('dish')}
                  >
                    🍲 Món ăn ({menuItems.length})
                  </button>
                  <button
                    type="button"
                    className={`waiter-cat-btn ${menuTab === 'combo' ? 'active' : ''}`}
                    onClick={() => setMenuTab('combo')}
                  >
                    🍱 Combo ({combos.length})
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="🔍 Tìm món nhanh..."
                  value={searchDish}
                  onChange={e => setSearchDish(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              {/* Danh mục filter */}
              {menuTab === 'dish' && (
                <div className="waiter-category-pills">
                  <button
                    type="button"
                    className={`waiter-cat-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('ALL')}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`waiter-cat-btn ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(String(cat.id))}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Grid Món ăn */}
              <div className="waiter-dishes-grid">
                {menuTab === 'dish' ? (
                  filteredMenuItems.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Không có món ăn khả dụng
                    </div>
                  ) : (
                    filteredMenuItems.map(dish => {
                      const inCart = cart.find(c => c.menuItemId === dish.id)
                      return (
                        <div
                          key={dish.id}
                          className={`waiter-dish-card ${inCart ? 'in-cart' : ''}`}
                          onClick={() => handleAddToCart(dish, false)}
                        >
                          <div className="waiter-dish-thumb-wrap">
                            {dish.image ? (
                              <img
                                src={getImageFullUrl(dish.image)}
                                alt={dish.name}
                                className="waiter-dish-thumb"
                                loading="lazy"
                              />
                            ) : (
                              <div className="waiter-dish-no-thumb">
                                🍲
                              </div>
                            )}
                            {inCart && (
                              <span className="waiter-dish-badge">
                                ✓ {inCart.quantity}
                              </span>
                            )}
                          </div>
                          <div className="waiter-dish-info">
                            <div className="waiter-dish-name" title={dish.name}>{dish.name}</div>
                            <div className="waiter-dish-bottom">
                              <div className="waiter-dish-price">{formatCurrency(dish.price)}</div>
                              <button
                                type="button"
                                className="waiter-dish-add-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToCart(dish, false)
                                }}
                                title="Thêm món"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )
                ) : (
                  filteredCombos.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Không có combo khả dụng
                    </div>
                  ) : (
                    filteredCombos.map(combo => {
                      const inCart = cart.find(c => c.comboId === combo.id)
                      return (
                        <div
                          key={combo.id}
                          className={`waiter-dish-card ${inCart ? 'in-cart' : ''}`}
                          onClick={() => handleAddToCart(combo, true)}
                        >
                          <div className="waiter-dish-thumb-wrap">
                            {combo.image ? (
                              <img
                                src={getImageFullUrl(combo.image)}
                                alt={combo.name}
                                className="waiter-dish-thumb"
                                loading="lazy"
                              />
                            ) : (
                              <div className="waiter-dish-no-thumb">
                                🍱
                              </div>
                            )}
                            {inCart && (
                              <span className="waiter-dish-badge">
                                ✓ {inCart.quantity}
                              </span>
                            )}
                          </div>
                          <div className="waiter-dish-info">
                            <div className="waiter-dish-name" title={combo.name}>{combo.name}</div>
                            <div className="waiter-dish-bottom">
                              <div className="waiter-dish-price">{formatCurrency(combo.price)}</div>
                              <button
                                type="button"
                                className="waiter-dish-add-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToCart(combo, true)
                                }}
                                title="Thêm combo"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )
                )}
              </div>
            </div>

            {/* CỘT PHẢI: GIỎ HÀNG ĐẶT MÓN */}
            <div className="waiter-cart-pane">
              <div className="waiter-cart-header">
                <div className="waiter-cart-table-badge">
                  🪑 BÀN {selectedTable?.tableNumber}
                </div>
                <button
                  type="button"
                  style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setViewMode('tables')}
                >
                  ✕ Đổi bàn
                </button>
              </div>

              <div className="waiter-cart-items-list">
                {cart.length === 0 ? (
                  <div className="waiter-cart-empty">
                    <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🛒</span>
                    <div>Chưa chọn món nào.</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      Nhấn vào món bên trái để thêm vào đơn.
                    </div>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={item.key || idx} className="waiter-cart-item">
                      <div className="waiter-cart-item-row">
                        <div className="waiter-cart-item-info">
                          <span className="waiter-cart-item-name">{item.name}</span>
                          <span className="waiter-cart-item-price">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                        <div className="waiter-cart-stepper">
                          <button
                            type="button"
                            className="waiter-stepper-btn"
                            onClick={() => handleUpdateCartQty(idx, -1)}
                            title="Giảm 1"
                          >
                            −
                          </button>
                          <span className="waiter-stepper-qty">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="waiter-stepper-btn"
                            onClick={() => handleUpdateCartQty(idx, 1)}
                            title="Tăng 1"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            className="waiter-cart-del-btn"
                            onClick={() => handleRemoveFromCart(idx)}
                            title="Xóa món"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Ghi chú món (vd: ít cay, không hành...)"
                        value={item.note || ''}
                        onChange={e => handleUpdateCartNote(idx, e.target.value)}
                        className="waiter-cart-note-input"
                      />
                    </div>
                  ))
                )}
              </div>

              <div className="waiter-cart-footer">
                {!activeTableOrder && (
                  <input
                    type="text"
                    placeholder="Ghi chú chung cho đơn (nếu có)..."
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                    }}
                  />
                )}

                <div className="waiter-total-row">
                  <span>TỔNG CỘNG:</span>
                  <span style={{ color: '#b8860b' }}>{formatCurrency(cartTotal)}</span>
                </div>

                <button
                  type="button"
                  className="waiter-submit-btn"
                  disabled={submittingOrder || cart.length === 0}
                  onClick={handleSubmitOrder}
                >
                  {submittingOrder ? 'Đang gửi đơn...' : '🚀 GỬI ĐƠN VÀO BẾP'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: CHI TIẾT BÀN ĐANG PHỤC VỤ (OCCUPIED) ────────────── */}
      {showTableModal && selectedTable && activeTableOrder && (
        <div className="waiter-modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="waiter-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3527' }}>
                  BÀN {selectedTable.tableNumber} — Đơn #{activeTableOrder.id}
                </h2>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                  Trạng thái: <strong>{activeTableOrder.status}</strong>
                </p>
              </div>
              <button
                type="button"
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' }}
                onClick={() => setShowTableModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Bảng danh sách món */}
            <div>
              <table className="waiter-table-items">
                <thead>
                  <tr>
                    <th>Món ăn</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th>Thành tiền</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'right' }}>Hủy món</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTableOrder.items || []).map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{item.itemName}</div>
                        {item.note && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📝 {item.note}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{item.quantity}</td>
                      <td style={{ fontWeight: 700, color: '#b8860b' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          {item.status === 'PENDING' ? '⏳ Chờ nấu' : item.status === 'COOKING' ? '🍳 Đang nấu' : item.status === 'SERVED' ? '✅ Đã lên món' : item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {item.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="waiter-cancel-btn"
                            onClick={() => handleDeleteItem(item.id, item.status, item.itemName)}
                          >
                            ✕ Hủy món
                          </button>
                        ) : (
                          <span className="waiter-locked-badge">
                            {item.status === 'COOKING' ? '🔒 Đang nấu (Khóa)' : '✅ Đã lên món'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '2px dashed #cbd5e1' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Tổng tiền hiện tại:</span>
              <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#b8860b' }}>
                {formatCurrency(activeTableOrder.totalAmount)}
              </span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                className="waiter-submit-btn"
                style={{ flex: 1, background: '#2a4736' }}
                onClick={handleAddMoreItems}
              >
                + Gọi thêm món vào bàn
              </button>
              <button
                type="button"
                className="waiter-submit-btn"
                style={{ flex: 1, background: 'linear-gradient(135deg, #15803d, #166534)' }}
                onClick={handleCheckoutTable}
              >
                💰 Thanh toán & Trả bàn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="waiter-toast">✓ {toast}</div>}
    </div>
  )
}

export default StaffDashboard
