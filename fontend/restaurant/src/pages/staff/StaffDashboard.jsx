import { useState, useEffect, useCallback, useMemo } from 'react'
import '../../styles/pages/staff/StaffDashboard.css'
import {
  getAllTables,
  updateTableStatus,
} from '../../services/tableService'
import {
  getAllOrders,
  createOrder,
  updateOrder,
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

// ── TƯƠNG THÍCH KHU VỰC (Đã lược bỏ tầng theo yêu cầu) ────────────
export const TABLE_AREAS = []
export function getTableArea() { return '' }
export function getAreaInfo() { return { id: '', name: '', shortName: '' } }

// ── 3 TRẠNG THÁI BÀN — TONE HOA SEN (LOTUS THEME) ────────────────
export const STATUS_CONFIG = {
  AVAILABLE: {
    key: 'AVAILABLE',
    label: 'Trống',
    badgeClass: 'status-available',
    desc: 'Sẵn sàng đón khách',
    color: '#16a34a',
  },
  OCCUPIED: {
    key: 'OCCUPIED',
    label: 'Đang phục vụ',
    badgeClass: 'status-occupied',
    desc: 'Đang có khách ngồi',
    color: '#d86888',
  },
  RESERVED: {
    key: 'RESERVED',
    label: 'Đã đặt trước',
    badgeClass: 'status-reserved',
    desc: 'Bàn đã giữ chỗ',
    color: '#d97706',
  },
}

// Gợi ý ghi chú 1-chạm cho nhân viên phục vụ
const QUICK_NOTES = [
  'Ít cay', 'Không ớt', 'Không hành', 'Ít ngọt', 'Nhiều đá', 'Không đá', 'Lên trước', 'Mang về'
]

function StaffDashboard() {
  // ── View Mode: 'tables' (Sơ đồ bàn) | 'ordering' (Gọi món cho bàn)
  const [viewMode, setViewMode] = useState('tables')

  const role = getRole()?.toUpperCase()
  const canAccessKitchen = ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'].includes(role)
  const canAccessCashier = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  // ── States Dữ liệu chính ──────────────────────────────────────────
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [combos, setCombos] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Lọc Bàn & Chế độ xem ─────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTable, setSearchTable] = useState('')
  const [floorViewMode, setFloorViewMode] = useState('floorplan') // 'floorplan' | 'cards'

  // Selected table & Modal
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeTableOrder, setActiveTableOrder] = useState(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [selectedComboDetail, setSelectedComboDetail] = useState(null) // Modal chi tiết combo cho phục vụ

  // ── Mobile POS Ordering State ─────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [menuTab, setMenuTab] = useState('dish') // 'dish' | 'combo'
  const [searchDish, setSearchDish] = useState('')
  const [cart, setCart] = useState([])
  const [orderNote, setOrderNote] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false) // Mobile cart drawer

  // Dọn dẹp cache lưu trạng thái chờ thanh toán cũ
  useEffect(() => {
    try {
      localStorage.removeItem('pos_billing_table_ids')
    } catch {}
  }, [])

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

      if (typeof setTables === 'function') setTables(tablesData || [])
      if (typeof setOrders === 'function') setOrders(ordersData || [])

      // Tự động giải phóng bàn nếu trong database từng bị kẹt ở BILLING_REQUESTED cũ
      if (Array.isArray(tablesData)) {
        tablesData.forEach(t => {
          if (t && t.status === 'BILLING_REQUESTED') {
            updateTableStatus(t.id, 'AVAILABLE').catch(() => {})
          }
        })
      }

      // CHỈ HIỂN THỊ MÓN ĐANG HOẠT ĐỘNG (status === 'ACTIVE')
      const activeItems = (itemsData || []).filter(item => item && item.status === 'ACTIVE')
      if (typeof setMenuItems === 'function') setMenuItems(activeItems)

      // Lọc combo nếu có
      const activeCombos = (combosData || []).filter(c => c && (!c.status || c.status === 'ACTIVE'))
      if (typeof setCombos === 'function') setCombos(activeCombos)

      if (typeof setCategories === 'function') setCategories(catsData || [])
    } catch (err) {
      console.error('Staff fetch error', err)
      showToast('Lỗi tải dữ liệu: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Realtime subscription for order updates
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

  // ── Tính trạng thái thực tế của bàn ──────────────────────────────
  const getTableEffectiveStatus = useCallback((table) => {
    const currentOrder = orders.find(
      o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
    )

    if (table.status === 'OCCUPIED' || currentOrder) {
      return 'OCCUPIED'
    }
    if (table.status === 'RESERVED') {
      return 'RESERVED'
    }
    return 'AVAILABLE'
  }, [orders])

  // ── Bàn lọc theo Trạng thái & Tìm kiếm (Đã bỏ lọc tầng) ───────────
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      // Bỏ qua bàn ngừng hoạt động
      if (t.status === 'INACTIVE') return false

      // Lọc theo Trạng thái
      const effStatus = getTableEffectiveStatus(t)
      if (statusFilter !== 'ALL' && effStatus !== statusFilter) return false

      // Lọc theo số bàn
      if (searchTable.trim()) {
        const query = searchTable.trim().toLowerCase()
        const matchNum = String(t.tableNumber).toLowerCase().includes(query)
        if (!matchNum) return false
      }

      return true
    })
  }, [tables, statusFilter, searchTable, getTableEffectiveStatus])

  // ── Thống kê tổng số lượng bàn theo trạng thái ────────────────────
  const statusCounts = useMemo(() => {
    const counts = {
      TOTAL: 0,
      AVAILABLE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
    }

    tables.forEach(t => {
      if (t.status === 'INACTIVE') return
      const effStatus = getTableEffectiveStatus(t)
      counts.TOTAL += 1
      if (counts[effStatus] !== undefined) {
        counts[effStatus] += 1
      }
    })

    return counts
  }, [tables, getTableEffectiveStatus])

  // ── Xử lý khi nhấn vào Bàn ───────────────────────────────────────
  const handleTableClick = (table) => {
    const effStatus = getTableEffectiveStatus(table)
    const currentOrder = orders.find(
      o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
    )

    setSelectedTable(table)

    if (effStatus === 'AVAILABLE') {
      // Bàn trống -> Vào thẳng màn hình gọi món Mobile POS
      setActiveTableOrder(null)
      setCart([])
      setOrderNote('')
      setViewMode('ordering')
      setCartDrawerOpen(false)
    } else if (effStatus === 'OCCUPIED') {
      // Bàn đang phục vụ -> Mở modal chi tiết
      setActiveTableOrder(currentOrder || null)
      setShowTableModal(true)
    } else if (effStatus === 'RESERVED') {
      // Bàn đặt trước
      if (window.confirm(`Bàn ${table.tableNumber} đã được đặt trước. Bạn có muốn nhận khách và mở bàn gọi món không?`)) {
        setActiveTableOrder(null)
        setCart([])
        setOrderNote('')
        setViewMode('ordering')
        setCartDrawerOpen(false)
      }
    } else {
      showToast(`Bàn ${table.tableNumber} hiện ở trạng thái: ${table.status}`)
    }
  }

  // Chuyển sang gọi thêm món cho bàn đang có khách
  const handleAddMoreItems = () => {
    setShowTableModal(false)
    setCart([])
    setOrderNote('')
    setViewMode('ordering')
    setCartDrawerOpen(false)
  }

  // ── Hoàn tất / Trả bàn (Thu ngân & Giải phóng) ─────────────────────
  const handleCheckoutTable = async () => {
    if (!activeTableOrder) return
    if (!window.confirm(`Xác nhận thanh toán và giải phóng Bàn ${selectedTable?.tableNumber}?`)) return

    try {
      await updateOrderStatus(activeTableOrder.id, 'COMPLETED')
      if (selectedTable?.id) {
        await updateTableStatus(selectedTable.id, 'AVAILABLE').catch(() => {})
      }
      showToast(`Bàn ${selectedTable?.tableNumber} đã hoàn tất và thanh toán!`)
      setShowTableModal(false)
      fetchData()
    } catch (err) {
      showToast('Lỗi thanh toán: ' + (err.message || ''))
    }
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

  const handleAppendQuickNote = (index, quickTag) => {
    setCart(prev =>
      prev.map((item, i) => {
        if (i !== index) return item
        const existingNote = item.note ? item.note.trim() : ''
        if (existingNote.includes(quickTag)) return item
        const newNote = existingNote ? `${existingNote}, ${quickTag}` : quickTag
        return { ...item, note: newNote }
      })
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
      setCartDrawerOpen(false)
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
  const cartTotalQty = cart.reduce((acc, curr) => acc + curr.quantity, 0)

  return (
    <div className="waiter-app-wrapper">
      {/* ── 1. HEADER / TOPBAR (Lotus Theme POS Navigation) ──────── */}
      <header className="waiter-topbar">
        <div className="waiter-topbar-left">
          <div className="waiter-brand-logo">🪷</div>
          <div>
            <h1 className="waiter-app-title">Phục Vụ POS</h1>
            <p className="waiter-app-subtitle">
              {viewMode === 'tables' ? 'Sơ đồ bàn & Trạng thái' : `Gọi món • Bàn ${selectedTable?.tableNumber}`}
            </p>
          </div>
        </div>

        {/* Chuyển View Mode nhanh */}
        <div className="waiter-topbar-center">
          <button
            type="button"
            className={`waiter-tab-btn ${viewMode === 'tables' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('tables')
              setCartDrawerOpen(false)
            }}
          >
            Sơ đồ bàn
          </button>
          {selectedTable && (
            <button
              type="button"
              className={`waiter-tab-btn ${viewMode === 'ordering' ? 'active' : ''}`}
              onClick={() => setViewMode('ordering')}
            >
              Bàn {selectedTable.tableNumber} {cartTotalQty > 0 ? `(${cartTotalQty})` : ''}
            </button>
          )}
        </div>

        {/* Nút hành động phải */}
        <div className="waiter-topbar-right">
          <button
            type="button"
            className="waiter-icon-btn"
            onClick={fetchData}
            title="Làm mới dữ liệu"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
          <a href="/staff/reservations" className="waiter-link-btn" title="Quản lý đặt bàn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Đặt bàn</span>
          </a>
          {canAccessKitchen && (
            <a href="/kitchen" className="waiter-link-btn" title="Bếp KDS">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
              <span>Bếp</span>
            </a>
          )}
          {canAccessCashier && (
            <a href="/cashier" className="waiter-link-btn" title="Thu ngân">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span>Thu ngân</span>
            </a>
          )}
          {canAccessAdmin && (
            <a href="/admin/orders" className="waiter-link-btn admin-btn" title="Trang quản trị">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Admin</span>
            </a>
          )}
        </div>
      </header>

      {/* ── 2. NỘI DUNG CHÍNH ────────────────────────────────────────── */}
      <main className="waiter-main-content">
        {viewMode === 'tables' ? (
          /* ══════════════════════════════════════════════════════════════
             VIEW 1: SƠ ĐỒ BÀN TƯƠNG TÁC (LOTUS THEME FLOOR PLAN)
             ══════════════════════════════════════════════════════════════ */
          <div className="floorplan-container">
            {/* ── THANH CÔNG CỤ ĐIỀU KHIỂN & LỌC TRẠNG THÁI (ĐÃ BỎ TẦNG) ── */}
            <div className="pos-unified-toolbar">
              <div className="pos-status-bar">
                <button
                  type="button"
                  className={`status-pill all ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                >
                  <span>Tất cả</span>
                  <span className="pill-badge">{statusCounts.TOTAL}</span>
                </button>

                <button
                  type="button"
                  className={`status-pill available ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
                  onClick={() => setStatusFilter(prev => prev === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
                >
                  <span className="dot dot-available" />
                  <span>Trống</span>
                  <span className="pill-badge">{statusCounts.AVAILABLE}</span>
                </button>

                <button
                  type="button"
                  className={`status-pill occupied ${statusFilter === 'OCCUPIED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter(prev => prev === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
                >
                  <span className="dot dot-occupied" />
                  <span>Đang phục vụ</span>
                  <span className="pill-badge">{statusCounts.OCCUPIED}</span>
                </button>

                <button
                  type="button"
                  className={`status-pill reserved ${statusFilter === 'RESERVED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter(prev => prev === 'RESERVED' ? 'ALL' : 'RESERVED')}
                >
                  <span className="dot dot-reserved" />
                  <span>Đã đặt</span>
                  <span className="pill-badge">{statusCounts.RESERVED}</span>
                </button>
              </div>

              {/* Ô tìm bàn & Chuyển chế độ hiển thị */}
              <div className="pos-quick-controls">
                <div className="table-search-box">
                  <span className="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm số bàn..."
                    value={searchTable}
                    onChange={e => setSearchTable(e.target.value)}
                  />
                  {searchTable && (
                    <button type="button" className="clear-search-btn" onClick={() => setSearchTable('')}>
                      ✕
                    </button>
                  )}
                </div>

                <div className="view-mode-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${floorViewMode === 'floorplan' ? 'active' : ''}`}
                    onClick={() => setFloorViewMode('floorplan')}
                    title="Chế độ sơ đồ bàn"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <span>Sơ đồ</span>
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${floorViewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setFloorViewMode('cards')}
                    title="Chế độ danh sách thẻ"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <circle cx="4" cy="6" r="1" />
                      <circle cx="4" cy="12" r="1" />
                      <circle cx="4" cy="18" r="1" />
                    </svg>
                    <span>Thẻ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── LƯỚI BÀN ──────────────────────────────────────────── */}
            {loading ? (
              <div className="floorplan-loading">
                <div className="spinner-lg" />
                <p>Đang tải sơ đồ bàn...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="floorplan-empty">
                <h3>Không tìm thấy bàn phù hợp</h3>
                <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button
                  type="button"
                  className="reset-filter-btn"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setSearchTable('')
                  }}
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className={`tables-layout ${floorViewMode}`}>
                {filteredTables.map(table => {
                  const effStatus = getTableEffectiveStatus(table)
                  const cfg = STATUS_CONFIG[effStatus] || STATUS_CONFIG.AVAILABLE
                  const activeOrder = orders.find(
                    o => o.tableId === table.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
                  )
                  const capacity = table.capacity || 4

                  return (
                    <div
                      key={table.id}
                      className={`floor-table-node ${effStatus}`}
                      onClick={() => handleTableClick(table)}
                    >
                      <div className="table-surface">
                        {/* Ribbon trạng thái */}
                        <div className={`table-status-ribbon ${cfg.badgeClass}`}>
                          {cfg.label}
                        </div>

                        {/* Số bàn + sức chứa */}
                        <div className="table-surface-center">
                          <div className="table-number-label">Bàn {table.tableNumber}</div>
                          <div className="table-capacity-label">{capacity} chỗ ngồi</div>
                        </div>

                        {/* Thông tin đơn / hành động */}
                        <div className="table-surface-footer">
                          {activeOrder ? (
                            <div className="table-order-info">
                              <span className="order-price">{formatCurrency(activeOrder.totalAmount)}</span>
                              <span className="order-meta">{activeOrder.items?.length || 0} món</span>
                            </div>
                          ) : effStatus === 'RESERVED' ? (
                            <div className="table-footer-hint reserved">Đã đặt trước</div>
                          ) : (
                            <button
                              type="button"
                              className="table-open-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTableClick(table)
                              }}
                            >
                              Mở bàn
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* ══════════════════════════════════════════════════════════════
             VIEW 2: MÀN HÌNH GỌI MÓN CHUYÊN NGHIỆP (RESTAURANT POS ORDERING)
             ══════════════════════════════════════════════════════════════ */
          <div className="waiter-pos-layout">
            {/* ── BẢNG CHỌN MÓN (MENU PANE) ────────────────────────── */}
            <div className="waiter-menu-pane">
              {/* Header gọi món */}
              <div className="pos-table-header">
                <div className="pos-table-badge">
                  <div className="pos-table-avatar">
                    <span className="table-prefix">BÀN</span>
                    <span className="table-num">{selectedTable?.tableNumber}</span>
                  </div>
                  <div className="pos-table-meta">
                    <div className="pos-table-title-row">
                      <h3 className="pos-table-title">Bàn {selectedTable?.tableNumber}</h3>
                      <span className={`pos-table-status-tag ${activeTableOrder ? 'occupied' : 'new'}`}>
                        {activeTableOrder ? 'Đang phục vụ' : 'Mở bàn mới'}
                      </span>
                    </div>
                    <div className="pos-table-sub">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <span>Sức chứa: {selectedTable?.capacity || 4} chỗ</span>
                    </div>
                  </div>
                </div>

                <div className="pos-header-actions">
                  <button
                    type="button"
                    className="change-table-btn"
                    onClick={() => {
                      setViewMode('tables')
                      setCartDrawerOpen(false)
                    }}
                    title="Quay lại danh sách bàn"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    <span>Đổi bàn khác</span>
                  </button>
                </div>
              </div>

              {/* Tabs chuyển món ăn / Combo & Ô tìm kiếm */}
              <div className="waiter-menu-search-bar">
                <div className="tab-pill-toggle">
                  <button
                    type="button"
                    className={`tab-pill ${menuTab === 'dish' ? 'active' : ''}`}
                    onClick={() => setMenuTab('dish')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                      <line x1="6" y1="1" x2="6" y2="4"></line>
                      <line x1="10" y1="1" x2="10" y2="4"></line>
                      <line x1="14" y1="1" x2="14" y2="4"></line>
                    </svg>
                    <span>Món lẻ</span>
                    <span className="tab-count-badge">{menuItems.length}</span>
                  </button>
                  <button
                    type="button"
                    className={`tab-pill ${menuTab === 'combo' ? 'active' : ''}`}
                    onClick={() => setMenuTab('combo')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <span>Gói Combo</span>
                    <span className="tab-count-badge">{combos.length}</span>
                  </button>
                </div>

                <div className="dish-search-input-wrap">
                  <span className="search-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên món, đồ uống..."
                    value={searchDish}
                    onChange={e => setSearchDish(e.target.value)}
                  />
                  {searchDish && (
                    <button type="button" className="clear-btn" onClick={() => setSearchDish('')}>
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Danh mục lọc cuộn ngang (Swipeable category chips) */}
              {menuTab === 'dish' && (
                <div className="waiter-category-pills">
                  <button
                    type="button"
                    className={`cat-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('ALL')}
                  >
                    <span>Tất cả</span>
                    <span className="cat-count-badge">{menuItems.length}</span>
                  </button>
                  {categories.map(cat => {
                    const catCount = menuItems.filter(m => m.categoryId === cat.id).length
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`cat-pill ${selectedCategory === String(cat.id) ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(String(cat.id))}
                      >
                        <span>{cat.name}</span>
                        <span className="cat-count-badge">{catCount}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Lưới hiển thị món ăn */}
              <div className="waiter-dishes-grid">
                {menuTab === 'dish' ? (
                  filteredMenuItems.length === 0 ? (
                    <div className="menu-grid-empty">
                      <div className="empty-dish-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                        </svg>
                      </div>
                      <h4>Không tìm thấy món phù hợp</h4>
                      <p>Hãy thử tìm bằng từ khóa khác hoặc chuyển danh mục.</p>
                    </div>
                  ) : (
                    filteredMenuItems.map(dish => {
                      const inCart = cart.find(c => c.menuItemId === dish.id)
                      const catName = categories.find(c => c.id === dish.categoryId)?.name
                      return (
                        <div
                          key={dish.id}
                          className={`pos-dish-card ${inCart ? 'in-cart' : ''}`}
                          onClick={() => handleAddToCart(dish, false)}
                        >
                          <div className="dish-card-thumb">
                            {dish.image ? (
                              <img
                                src={getImageFullUrl(dish.image)}
                                alt={dish.name}
                                loading="lazy"
                              />
                            ) : (
                              <div className="dish-thumb-placeholder">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                                  <line x1="6" y1="1" x2="6" y2="4"></line>
                                  <line x1="10" y1="1" x2="10" y2="4"></line>
                                  <line x1="14" y1="1" x2="14" y2="4"></line>
                                </svg>
                              </div>
                            )}

                            {/* Badge số lượng nếu đã có trong giỏ */}
                            {inCart && (
                              <span className="dish-in-cart-badge">
                                ×{inCart.quantity}
                              </span>
                            )}
                          </div>

                          <div className="dish-card-body">
                            {catName && <span className="dish-category-tag">{catName}</span>}
                            <h4 className="dish-name" title={dish.name}>{dish.name}</h4>
                            <div className="dish-bottom-row">
                              <span className="dish-price">{formatCurrency(dish.price)}</span>
                              <button
                                type="button"
                                className="dish-quick-add"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToCart(dish, false)
                                }}
                                title="Thêm vào đơn"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>Thêm</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )
                ) : (
                  filteredCombos.length === 0 ? (
                    <div className="menu-grid-empty">
                      <div className="empty-dish-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      </div>
                      <h4>Không tìm thấy combo phù hợp</h4>
                      <p>Hãy thử tìm bằng từ khóa khác.</p>
                    </div>
                  ) : (
                    filteredCombos.map(combo => {
                      const inCart = cart.find(c => c.comboId === combo.id)
                      return (
                        <div
                          key={combo.id}
                          className={`pos-dish-card ${inCart ? 'in-cart' : ''}`}
                          onClick={() => setSelectedComboDetail(combo)}
                          title="Bấm để xem chi tiết các món trong combo"
                        >
                          <div className="dish-card-thumb">
                            {combo.image ? (
                              <img
                                src={getImageFullUrl(combo.image)}
                                alt={combo.name}
                                loading="lazy"
                              />
                            ) : (
                              <div className="dish-thumb-placeholder">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                  <line x1="8" y1="21" x2="16" y2="21"></line>
                                  <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                              </div>
                            )}
                            {inCart && (
                              <span className="dish-in-cart-badge">
                                ×{inCart.quantity}
                              </span>
                            )}
                          </div>

                          <div className="dish-card-body">
                            <span className="dish-category-tag combo">Combo tiết kiệm</span>
                            <h4 className="dish-name" title={combo.name}>{combo.name}</h4>
                            
                            {/* Dòng bấm xem nhanh các món gồm có trong combo */}
                            <div className="combo-card-preview-btn">
                              <span>Xem {combo.items?.length || 0} món gồm có &rsaquo;</span>
                            </div>

                            <div className="dish-bottom-row">
                              <span className="dish-price">{formatCurrency(combo.price)}</span>
                              <button
                                type="button"
                                className="dish-quick-add"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddToCart(combo, true)
                                }}
                                title="Thêm nhanh combo vào đơn"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="12" y1="5" x2="12" y2="19"></line>
                                  <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>Thêm</span>
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

            {/* ── BẢNG GIỎ HÀNG (DESKTOP/TABLET SIDEBAR & MOBILE DRAWER) ── */}
            <div className={`waiter-cart-pane ${cartDrawerOpen ? 'drawer-open' : ''}`}>
              <div className="cart-pane-header">
                <div className="cart-title-wrap">
                  <div className="cart-header-icon-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="cart-title">Đơn gọi món</h3>
                    <span className="cart-sub">Bàn {selectedTable?.tableNumber} • {cartTotalQty} phần</span>
                  </div>
                </div>

                <div className="cart-header-actions">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      className="cart-clear-all-btn"
                      onClick={() => setCart([])}
                      title="Xóa tất cả món đã chọn"
                    >
                      Xóa hết
                    </button>
                  )}
                  {/* Nút đóng drawer trên mobile */}
                  <button
                    type="button"
                    className="cart-close-drawer-btn"
                    onClick={() => setCartDrawerOpen(false)}
                    title="Đóng giỏ hàng"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Danh sách món trong giỏ */}
              <div className="cart-items-container">
                {cart.length === 0 ? (
                  <div className="cart-empty-state">
                    <div className="cart-empty-illustration">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </div>
                    <h4>Chưa chọn món nào</h4>
                    <p>Chạm vào các món trong thực đơn để thêm vào đơn của Bàn {selectedTable?.tableNumber}.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={item.key || idx} className="cart-item-card">
                      <div className="cart-item-top">
                        {item.image && (
                          <div className="cart-item-thumb">
                            <img src={getImageFullUrl(item.image)} alt={item.name} />
                          </div>
                        )}
                        <div className="cart-item-info">
                          <span className="cart-item-name">{item.name}</span>
                          <span className="cart-item-unit-price">
                            {formatCurrency(item.price)}
                          </span>
                        </div>

                        {/* Bộ nút tăng giảm số lượng */}
                        <div className="cart-stepper">
                          <button
                            type="button"
                            className="stepper-btn minus"
                            onClick={() => handleUpdateCartQty(idx, -1)}
                            title={item.quantity === 1 ? "Xóa khỏi đơn" : "Giảm 1"}
                          >
                            {item.quantity === 1 ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            ) : '−'}
                          </button>
                          <span className="stepper-val">{item.quantity}</span>
                          <button
                            type="button"
                            className="stepper-btn plus"
                            onClick={() => handleUpdateCartQty(idx, 1)}
                            title="Tăng 1"
                          >
                            +
                          </button>
                        </div>

                        <div className="cart-item-line-total">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>

                      {/* Quick note tags 1-chạm */}
                      <div className="cart-quick-tags">
                        {QUICK_NOTES.slice(0, 4).map(tag => (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-chip ${(item.note || '').includes(tag) ? 'active' : ''}`}
                            onClick={() => handleAppendQuickNote(idx, tag)}
                          >
                            +{tag}
                          </button>
                        ))}
                      </div>

                      {/* Ô nhập ghi chú */}
                      <input
                        type="text"
                        placeholder="Ghi chú món (vd: ít đường, mang ra trước...)"
                        value={item.note || ''}
                        onChange={e => handleUpdateCartNote(idx, e.target.value)}
                        className="cart-note-input"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Footer giỏ hàng */}
              <div className="cart-pane-footer">
                {!activeTableOrder && (
                  <div className="order-general-note-wrap">
                    <span className="general-note-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Ghi chú chung cho toàn bàn..."
                      value={orderNote}
                      onChange={e => setOrderNote(e.target.value)}
                      className="order-general-note-input"
                    />
                  </div>
                )}

                <div className="cart-summary-rows">
                  <div className="summary-row">
                    <span className="summary-label">Tạm tính ({cartTotalQty} món)</span>
                    <span className="summary-val">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="summary-row total-highlight">
                    <span className="summary-label">TỔNG CỘNG</span>
                    <span className="summary-total-amount">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`cart-submit-btn ${cart.length === 0 ? 'disabled' : ''}`}
                  disabled={submittingOrder || cart.length === 0}
                  onClick={handleSubmitOrder}
                >
                  {submittingOrder ? (
                    <>
                      <span className="spinner-sm" />
                      <span>Đang gửi đơn...</span>
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                      <span>{activeTableOrder ? 'GỬI THÊM VÀO BẾP' : 'GỬI ĐƠN VÀO BẾP'}</span>
                      <span className="submit-qty">({cartTotalQty} món)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── MOBILE STICKY FLOATING CART BAR ──────────────────── */}
            {cart.length > 0 && !cartDrawerOpen && (
              <div
                className="mobile-floating-cart-bar"
                onClick={() => setCartDrawerOpen(true)}
              >
                <div className="floating-cart-info">
                  <span className="floating-badge">{cartTotalQty}</span>
                  <div>
                    <div className="floating-total">{formatCurrency(cartTotal)}</div>
                    <div className="floating-sub">Bàn {selectedTable?.tableNumber} • Nhấn để xem giỏ</div>
                  </div>
                </div>

                <button type="button" className="floating-submit-btn">
                  <span>Gửi bếp</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── 3. MODAL: CHI TIẾT BÀN ĐANG PHỤC VỤ (OCCUPIED / BILLING) ── */}
      {showTableModal && selectedTable && activeTableOrder && (
        <div className="waiter-modal-overlay" onClick={() => setShowTableModal(false)}>
          <div className="waiter-modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title-row">
                  <h2 className="modal-table-num">BÀN {selectedTable.tableNumber}</h2>
                  <span className="modal-order-id">#ORD-{activeTableOrder.id}</span>
                </div>
                <p className="modal-table-sub">
                  Sức chứa: <strong>{selectedTable?.capacity || 4} chỗ</strong>
                  {' • '}
                  Trạng thái: <strong style={{ color: '#d86888' }}>
                    Đang phục vụ
                  </strong>
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowTableModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Danh sách món đang gọi */}
            <div className="modal-items-scroll">
              <table className="modal-items-table">
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
                        <div className="item-name">{item.itemName}</div>
                        {item.note && <div className="item-note">📝 {item.note}</div>}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{item.quantity}</td>
                      <td style={{ fontWeight: 700, color: '#b8860b' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td>
                        <span className={`dish-status-chip ${item.status}`}>
                          {item.status === 'PENDING' ? '⏳ Chờ nấu'
                            : item.status === 'COOKING' ? '🍳 Đang nấu'
                            : item.status === 'SERVED' ? '✅ Đã lên món'
                            : item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {item.status === 'PENDING' ? (
                          <button
                            type="button"
                            className="cancel-item-btn"
                            onClick={() => handleDeleteItem(item.id, item.status, item.itemName)}
                          >
                            ✕ Hủy
                          </button>
                        ) : (
                          <span className="locked-badge">
                            {item.status === 'COOKING' ? '🔒 Đang nấu' : '✅ Đã lên'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tổng tiền */}
            <div className="modal-total-bar">
              <span className="total-label">Tổng hóa đơn hiện tại:</span>
              <span className="total-value">
                {formatCurrency(activeTableOrder.totalAmount)}
              </span>
            </div>

            {/* Nút thao tác nhanh của nhân viên phục vụ */}
            <div className="modal-action-buttons">
              <button
                type="button"
                className="modal-btn add-items"
                onClick={handleAddMoreItems}
              >
                ➕ Gọi thêm món
              </button>

              <button
                type="button"
                className="modal-btn checkout"
                onClick={handleCheckoutTable}
              >
                💰 Thu tiền &amp; Trả bàn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3.1 MODAL: CHI TIẾT COMBO DÀNH CHO PHỤC VỤ TƯ VẤN & GỌI MÓN ── */}
      {selectedComboDetail && (
        <div className="waiter-modal-overlay" onClick={() => setSelectedComboDetail(null)}>
          <div className="waiter-modal-box staff-combo-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="dish-category-tag combo">Gói Combo</span>
                <h2 className="modal-table-num">{selectedComboDetail.name}</h2>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedComboDetail(null)}
                title="Đóng"
              >
                &times;
              </button>
            </div>

            <div className="staff-combo-body">
              {selectedComboDetail.image && (
                <div className="staff-combo-img-wrap">
                  <img
                    src={getImageFullUrl(selectedComboDetail.image)}
                    alt={selectedComboDetail.name}
                    className="staff-combo-img"
                  />
                </div>
              )}

              <div className="staff-combo-price-row">
                <span className="staff-combo-price-label">Giá trọn gói:</span>
                <span className="staff-combo-price-val">{formatCurrency(selectedComboDetail.price)}</span>
              </div>

              {selectedComboDetail.description && (
                <div className="staff-combo-desc-box">
                  <strong>Mô tả:</strong> {selectedComboDetail.description}
                </div>
              )}

              <div className="staff-combo-items-section">
                <h4 className="staff-combo-section-title">
                  🍲 Món gồm có trong combo ({selectedComboDetail.items?.length || 0} món):
                </h4>

                {selectedComboDetail.items && selectedComboDetail.items.length > 0 ? (
                  <div className="staff-combo-items-grid">
                    {selectedComboDetail.items.map((ci, idx) => (
                      <div key={idx} className="staff-combo-item-chip">
                        {ci.menuItemImage ? (
                          <img
                            src={getImageFullUrl(ci.menuItemImage)}
                            alt={ci.menuItemName}
                            className="staff-combo-item-thumb"
                          />
                        ) : (
                          <span className="staff-combo-item-thumb placeholder">🍽️</span>
                        )}
                        <div className="staff-combo-item-text">
                          <span className="staff-combo-item-name">{ci.menuItemName}</span>
                          <span className="staff-combo-item-qty">Số lượng: <strong>{ci.quantity}x</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="combo-no-items">Combo này chưa được cấu hình danh sách món.</p>
                )}
              </div>
            </div>

            <div className="staff-combo-footer">
              <button
                type="button"
                className="modal-btn secondary"
                onClick={() => setSelectedComboDetail(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="modal-btn add-items"
                onClick={() => {
                  handleAddToCart(selectedComboDetail, true)
                  setSelectedComboDetail(null)
                  showToast(`Đã thêm ${selectedComboDetail.name} vào giỏ!`)
                }}
              >
                ➕ Thêm vào đơn ({formatCurrency(selectedComboDetail.price)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. MOBILE BOTTOM NAVIGATION BAR (Thumb Friendly) ───────── */}
      <nav className="mobile-bottom-nav">
        <button
          type="button"
          className={`nav-item ${viewMode === 'tables' ? 'active' : ''}`}
          onClick={() => {
            setViewMode('tables')
            setCartDrawerOpen(false)
          }}
        >
          <span className="nav-icon">🪑</span>
          <span className="nav-label">Sơ đồ bàn</span>
        </button>

        <button
          type="button"
          className={`nav-item ${viewMode === 'ordering' ? 'active' : ''}`}
          onClick={() => {
            if (selectedTable) {
              setViewMode('ordering')
            } else {
              showToast('Vui lòng chạm chọn 1 bàn để gọi món!')
            }
          }}
        >
          <span className="nav-icon">
            📝
            {cartTotalQty > 0 && <span className="nav-badge">{cartTotalQty}</span>}
          </span>
          <span className="nav-label">Gọi món</span>
        </button>

        <a href="/staff/reservations" className="nav-item">
          <span className="nav-icon">📅</span>
          <span className="nav-label">Đặt bàn</span>
        </a>

        <button
          type="button"
          className="nav-item"
          onClick={fetchData}
        >
          <span className="nav-icon">🔄</span>
          <span className="nav-label">Làm mới</span>
        </button>
      </nav>

      {/* Toast thông báo */}
      {toast && <div className="waiter-toast">⚡ {toast}</div>}
    </div>
  )
}

export default StaffDashboard
