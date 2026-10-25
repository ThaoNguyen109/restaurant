import { useState, useEffect, useCallback, useMemo } from 'react'
import './StaffDashboard.css'
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

// ── KHU VỰC NHÀ HÀNG (ZONES / FLOORS) ──────────────────────────────
export const TABLE_AREAS = [
  { id: 'ALL', name: 'Tất cả khu vực', shortName: 'Tất cả', icon: '🌟' },
  { id: 'FLOOR_1', name: 'Tầng 1 (Sảnh chính)', shortName: 'Tầng 1', icon: '🏛️' },
  { id: 'FLOOR_2', name: 'Tầng 2 (Sân vườn)', shortName: 'Tầng 2', icon: '🌿' },
  { id: 'ROOFTOP', name: 'Sân thượng (Sky View)', shortName: 'Sân thượng', icon: '🌅' },
  { id: 'VIP', name: 'Phòng VIP Hoàng gia', shortName: 'Phòng VIP', icon: '👑' },
]

export function getTableArea(table) {
  if (table.area) return table.area
  const num = Number(table.tableNumber)
  if (num >= 100 && num < 200) return 'FLOOR_1'
  if (num >= 200 && num < 300) return 'FLOOR_2'
  if (num >= 300 && num < 400) return 'ROOFTOP'
  if (num >= 400 || num >= 800) return 'VIP'

  // Quy ước số bàn 1..30 thông dụng
  if (num <= 8) return 'FLOOR_1'
  if (num <= 16) return 'FLOOR_2'
  if (num <= 24) return 'ROOFTOP'
  return 'VIP'
}

export function getAreaInfo(areaId) {
  return TABLE_AREAS.find(a => a.id === areaId) || TABLE_AREAS[0]
}

// ── 4 TRẠNG THÁI MÀU SẮC TRỰC QUAN ────────────────────────────────
export const STATUS_CONFIG = {
  AVAILABLE: {
    key: 'AVAILABLE',
    label: 'Trống',
    icon: '🟢',
    badgeClass: 'status-available',
    desc: 'Sẵn sàng đón khách',
    color: '#22c55e',
  },
  OCCUPIED: {
    key: 'OCCUPIED',
    label: 'Đang phục vụ',
    icon: '🔴',
    badgeClass: 'status-occupied',
    desc: 'Đang có khách ngồi',
    color: '#ef4444',
  },
  RESERVED: {
    key: 'RESERVED',
    label: 'Đã đặt trước',
    icon: '🟡',
    badgeClass: 'status-reserved',
    desc: 'Bàn đã giữ chỗ',
    color: '#f59e0b',
  },
  BILLING_REQUESTED: {
    key: 'BILLING_REQUESTED',
    label: 'Yêu cầu thanh toán',
    icon: '🟣',
    badgeClass: 'status-billing',
    desc: 'Khách gọi tính tiền',
    color: '#a855f7',
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

  // ── Floor Plan & Lọc Bàn ──────────────────────────────────────────
  const [selectedArea, setSelectedArea] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTable, setSearchTable] = useState('')
  const [floorViewMode, setFloorViewMode] = useState('floorplan') // 'floorplan' | 'cards'

  // Selected table & Modal
  const [selectedTable, setSelectedTable] = useState(null)
  const [activeTableOrder, setActiveTableOrder] = useState(null)
  const [showTableModal, setShowTableModal] = useState(false)

  // ── Mobile POS Ordering State ─────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [menuTab, setMenuTab] = useState('dish') // 'dish' | 'combo'
  const [searchDish, setSearchDish] = useState('')
  const [cart, setCart] = useState([])
  const [orderNote, setOrderNote] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false) // Mobile cart drawer

  // Danh sách bàn đang yêu cầu thanh toán (Hỗ trợ fallback khi server chưa restart)
  const [billingTableIds, setBillingTableIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_billing_table_ids')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('pos_billing_table_ids', JSON.stringify(billingTableIds))
    } catch (e) {
      console.warn('Lỗi lưu localStorage:', e)
    }
  }, [billingTableIds])

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

    if (
      table.status === 'BILLING_REQUESTED' ||
      currentOrder?.status === 'BILLING_REQUESTED' ||
      billingTableIds.includes(table.id) ||
      (currentOrder?.note && currentOrder.note.includes('[YÊU CẦU THANH TOÁN]'))
    ) {
      return 'BILLING_REQUESTED'
    }
    if (table.status === 'OCCUPIED' || currentOrder) {
      return 'OCCUPIED'
    }
    if (table.status === 'RESERVED') {
      return 'RESERVED'
    }
    return 'AVAILABLE'
  }, [orders, billingTableIds])

  // ── Bàn lọc theo Khu vực & Trạng thái & Tìm kiếm ──────────────────
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      // Bỏ qua bàn ngừng hoạt động
      if (t.status === 'INACTIVE') return false

      // Lọc theo Khu vực
      const area = getTableArea(t)
      if (selectedArea !== 'ALL' && area !== selectedArea) return false

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
  }, [tables, selectedArea, statusFilter, searchTable, getTableEffectiveStatus])

  // ── Thống kê tổng số lượng bàn theo trạng thái ────────────────────
  const statusCounts = useMemo(() => {
    const counts = {
      TOTAL: 0,
      AVAILABLE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      BILLING_REQUESTED: 0,
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
    } else if (effStatus === 'OCCUPIED' || effStatus === 'BILLING_REQUESTED') {
      // Bàn đang phục vụ hoặc đang đòi tính tiền -> Mở modal chi tiết
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

  // ── Yêu cầu thanh toán (Đổi sang màu tím 🟣) ──────────────────────
  const handleRequestBilling = async (table, currentOrder) => {
    try {
      // 1. Đánh dấu ngay lập tức trên UI sang màu tím 🟣
      setBillingTableIds(prev => (prev.includes(table.id) ? prev : [...prev, table.id]))

      // 2. Thử gọi API backend cập nhật trạng thái
      try {
        if (currentOrder) {
          await updateOrderStatus(currentOrder.id, 'BILLING_REQUESTED')
        }
        await updateTableStatus(table.id, 'BILLING_REQUESTED')
      } catch (backendErr) {
        console.warn('Backend validation notice (đang dùng fallback chờ restart Spring Boot):', backendErr)
        // Fallback: Nếu backend chưa restart và báo "Dữ liệu không hợp lệ", lưu cờ vào ghi chú đơn hàng
        if (currentOrder) {
          const noteText = currentOrder.note || ''
          const updatedNote = noteText.includes('[YÊU CẦU THANH TOÁN]')
            ? noteText
            : (noteText ? `${noteText} • [YÊU CẦU THANH TOÁN]` : '[YÊU CẦU THANH TOÁN]')
          await updateOrder(currentOrder.id, { tableId: table.id, note: updatedNote }).catch(() => {})
        }
      }

      showToast(`Đã gửi Yêu cầu thanh toán cho Bàn ${table.tableNumber}! 🟣`)
      setShowTableModal(false)
      fetchData()
    } catch (err) {
      showToast('Lỗi gửi yêu cầu thanh toán: ' + (err.message || ''))
    }
  }

  // ── Hoàn tất / Trả bàn (Thu ngân & Giải phóng) ─────────────────────
  const handleCheckoutTable = async () => {
    if (!activeTableOrder) return
    if (!window.confirm(`Xác nhận thanh toán và giải phóng Bàn ${selectedTable?.tableNumber}?`)) return

    try {
      await updateOrderStatus(activeTableOrder.id, 'COMPLETED')
      if (selectedTable?.id) {
        setBillingTableIds(prev => prev.filter(id => id !== selectedTable.id))
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
      {/* ── 1. HEADER / TOPBAR (Mobile-First Compact Header) ───────── */}
      <header className="waiter-topbar">
        <div className="waiter-topbar-left">
          <div className="waiter-brand-logo">🍽️</div>
          <div>
            <h1 className="waiter-app-title">Phục Vụ (POS)</h1>
            <p className="waiter-app-subtitle">
              {viewMode === 'tables' ? 'Sơ đồ bàn & Trạng thái' : `Đang gọi món Bàn ${selectedTable?.tableNumber}`}
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
            🪑 Sơ đồ bàn
          </button>
          {selectedTable && (
            <button
              type="button"
              className={`waiter-tab-btn ${viewMode === 'ordering' ? 'active' : ''}`}
              onClick={() => setViewMode('ordering')}
            >
              📝 Bàn {selectedTable.tableNumber} {cartTotalQty > 0 ? `(${cartTotalQty})` : ''}
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
            🔄
          </button>
          <a href="/staff/reservations" className="waiter-link-btn res-btn" title="Quản lý đặt bàn">
            📅 Đặt bàn
          </a>
          {canAccessKitchen && <a href="/kitchen" className="waiter-link-btn" title="Bếp KDS">🍳 Bếp</a>}
          {canAccessCashier && <a href="/cashier" className="waiter-link-btn" title="Thu ngân">💰 Thu ngân</a>}
          {canAccessAdmin   && <a href="/admin/orders" className="waiter-link-btn admin-btn">📊 Admin</a>}
        </div>
      </header>

      {/* ── 2. NỘI DUNG CHÍNH ────────────────────────────────────────── */}
      <main className="waiter-main-content">
        {viewMode === 'tables' ? (
          /* ══════════════════════════════════════════════════════════════
             VIEW 1: SƠ ĐỒ BÀN TƯƠNG TÁC (VISUAL FLOOR PLAN)
             ══════════════════════════════════════════════════════════════ */
          <div className="floorplan-container">
            {/* ── KHU VỰC TABS (Tầng 1, Tầng 2, Sân thượng, Phòng VIP) ── */}
            <div className="floorplan-area-bar">
              <div className="area-tabs-scroll">
                {TABLE_AREAS.map(area => {
                  const areaCount = area.id === 'ALL'
                    ? tables.filter(t => t.status !== 'INACTIVE').length
                    : tables.filter(t => t.status !== 'INACTIVE' && getTableArea(t) === area.id).length

                  return (
                    <button
                      key={area.id}
                      type="button"
                      className={`area-tab-btn ${selectedArea === area.id ? 'active' : ''}`}
                      onClick={() => setSelectedArea(area.id)}
                    >
                      <span className="area-icon">{area.icon}</span>
                      <span className="area-name">{area.shortName}</span>
                      <span className="area-badge">{areaCount}</span>
                    </button>
                  )
                })}
              </div>

              {/* Ô tìm bàn & Chuyển chế độ hiển thị */}
              <div className="floorplan-quick-controls">
                <div className="table-search-box">
                  <span className="search-icon">🔍</span>
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
                    title="Sơ đồ bàn trực quan"
                  >
                    🗺️ Sơ đồ
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${floorViewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setFloorViewMode('cards')}
                    title="Lưới thẻ danh sách"
                  >
                    🗂️ Thẻ
                  </button>
                </div>
              </div>
            </div>

            {/* ── 4 TRẠNG THÁI MÀU SẮC TRỰC QUAN (STAT PILLS) ───────── */}
            <div className="floorplan-status-bar">
              <button
                type="button"
                className={`status-pill all ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                <span>Tất cả</span>
                <strong>{statusCounts.TOTAL}</strong>
              </button>

              <button
                type="button"
                className={`status-pill available ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
              >
                <span className="dot dot-available" />
                <span>🟢 Trống</span>
                <strong>{statusCounts.AVAILABLE}</strong>
              </button>

              <button
                type="button"
                className={`status-pill occupied ${statusFilter === 'OCCUPIED' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
              >
                <span className="dot dot-occupied" />
                <span>🔴 Đang phục vụ</span>
                <strong>{statusCounts.OCCUPIED}</strong>
              </button>

              <button
                type="button"
                className={`status-pill reserved ${statusFilter === 'RESERVED' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'RESERVED' ? 'ALL' : 'RESERVED')}
              >
                <span className="dot dot-reserved" />
                <span>🟡 Đã đặt trước</span>
                <strong>{statusCounts.RESERVED}</strong>
              </button>

              <button
                type="button"
                className={`status-pill billing ${statusFilter === 'BILLING_REQUESTED' ? 'active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === 'BILLING_REQUESTED' ? 'ALL' : 'BILLING_REQUESTED')}
              >
                <span className="dot dot-billing" />
                <span>🟣 Yêu cầu thanh toán</span>
                <strong>{statusCounts.BILLING_REQUESTED}</strong>
              </button>
            </div>

            {/* ── BẢN ĐỒ / LƯỚI BÀN ──────────────────────────────────── */}
            {loading ? (
              <div className="floorplan-loading">
                <div className="spinner-lg" />
                <p>Đang tải dữ liệu sơ đồ bàn...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="floorplan-empty">
                <span style={{ fontSize: '3rem' }}>🪑</span>
                <h3>Không tìm thấy bàn phù hợp</h3>
                <p>Thử đổi khu vực hoặc bộ lọc trạng thái phía trên.</p>
                <button
                  type="button"
                  className="reset-filter-btn"
                  onClick={() => {
                    setSelectedArea('ALL')
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
                  const area = getTableArea(table)
                  const areaInfo = getAreaInfo(area)
                  const capacity = table.capacity || 4

                  return (
                    <div
                      key={table.id}
                      className={`floor-table-node ${effStatus} ${area.toLowerCase()}`}
                      onClick={() => handleTableClick(table)}
                    >
                      {/* Biểu tượng ghế ngồi xung quanh bàn (Visual Seats) */}
                      {floorViewMode === 'floorplan' && (
                        <div className="visual-seats-ring" data-seats={capacity}>
                          {Array.from({ length: Math.min(capacity, 8) }).map((_, seatIdx) => (
                            <span key={seatIdx} className={`seat-dot seat-${seatIdx + 1}`} />
                          ))}
                        </div>
                      )}

                      {/* Mặt bàn chính */}
                      <div className="table-surface">
                        {/* Header của thẻ bàn */}
                        <div className="table-surface-header">
                          <span className="table-area-tag" title={areaInfo.name}>
                            {areaInfo.icon} {areaInfo.shortName}
                          </span>
                          <span className={`table-status-badge ${cfg.badgeClass}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>

                        {/* Số bàn chính giữa */}
                        <div className="table-surface-center">
                          <div className="table-number-label">
                            BÀN {table.tableNumber}
                          </div>
                          <div className="table-capacity-label">
                            👥 {capacity} ghế
                          </div>
                        </div>

                        {/* Thông tin đơn hàng / Hành động dưới mặt bàn */}
                        <div className="table-surface-footer">
                          {activeOrder ? (
                            <div className="table-order-preview">
                              <div className="order-price">
                                {formatCurrency(activeOrder.totalAmount)}
                              </div>
                              <div className="order-meta">
                                <span>{activeOrder.items?.length || 0} món</span>
                                <span>• #{activeOrder.id}</span>
                              </div>
                            </div>
                          ) : effStatus === 'RESERVED' ? (
                            <div className="reserved-preview">
                              <span>📋 Khách đặt trước</span>
                            </div>
                          ) : (
                            <div className="available-preview">
                              <span>+ Chạm mở bàn</span>
                            </div>
                          )}

                          {/* Quick Action Button */}
                          <div className="table-quick-action">
                            {effStatus === 'AVAILABLE' && (
                              <button
                                type="button"
                                className="action-chip available"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleTableClick(table)
                                }}
                              >
                                ➕ Mở bàn
                              </button>
                            )}
                            {effStatus === 'OCCUPIED' && (
                              <button
                                type="button"
                                className="action-chip billing-req"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRequestBilling(table, activeOrder)
                                }}
                                title="Báo khách xin tính tiền"
                              >
                                🟣 Xin bill
                              </button>
                            )}
                            {effStatus === 'BILLING_REQUESTED' && (
                              <span className="pulse-billing-tag">
                                ⚡ Chờ tính tiền
                              </span>
                            )}
                          </div>
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
             VIEW 2: MÀN HÌNH GỌI MÓN CẦM TAY (MOBILE POS ORDERING)
             ══════════════════════════════════════════════════════════════ */
          <div className="waiter-pos-layout">
            {/* ── BẢNG CHỌN MÓN (MENU PANE) ────────────────────────── */}
            <div className="waiter-menu-pane">
              {/* Header gọi món */}
              <div className="pos-table-header">
                <div className="pos-table-badge">
                  <span className="table-icon">🪑</span>
                  <div>
                    <div className="pos-table-title">
                      BÀN {selectedTable?.tableNumber}
                    </div>
                    <div className="pos-table-sub">
                      {getAreaInfo(getTableArea(selectedTable || {})).name} • {selectedTable?.capacity || 4} chỗ
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
                  >
                    ✕ Đổi bàn
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
                    🍲 Món ({menuItems.length})
                  </button>
                  <button
                    type="button"
                    className={`tab-pill ${menuTab === 'combo' ? 'active' : ''}`}
                    onClick={() => setMenuTab('combo')}
                  >
                    🍱 Combo ({combos.length})
                  </button>
                </div>

                <div className="dish-search-input-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Tìm tên món ăn, thức uống..."
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
                    Tất cả ({menuItems.length})
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
                        {cat.name} ({catCount})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Lưới hiển thị món ăn (Touch friendly mobile cards) */}
              <div className="waiter-dishes-grid">
                {menuTab === 'dish' ? (
                  filteredMenuItems.length === 0 ? (
                    <div className="menu-grid-empty">
                      <span>🍲</span>
                      <p>Không tìm thấy món ăn phù hợp</p>
                    </div>
                  ) : (
                    filteredMenuItems.map(dish => {
                      const inCart = cart.find(c => c.menuItemId === dish.id)
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
                              <div className="dish-thumb-placeholder">🍲</div>
                            )}

                            {/* Badge số lượng nếu đã có trong giỏ */}
                            {inCart && (
                              <span className="dish-in-cart-badge">
                                ✓ {inCart.quantity}
                              </span>
                            )}
                          </div>

                          <div className="dish-card-body">
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
                                title="Thêm vào giỏ"
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
                    <div className="menu-grid-empty">
                      <span>🍱</span>
                      <p>Không tìm thấy combo phù hợp</p>
                    </div>
                  ) : (
                    filteredCombos.map(combo => {
                      const inCart = cart.find(c => c.comboId === combo.id)
                      return (
                        <div
                          key={combo.id}
                          className={`pos-dish-card ${inCart ? 'in-cart' : ''}`}
                          onClick={() => handleAddToCart(combo, true)}
                        >
                          <div className="dish-card-thumb">
                            {combo.image ? (
                              <img
                                src={getImageFullUrl(combo.image)}
                                alt={combo.name}
                                loading="lazy"
                              />
                            ) : (
                              <div className="dish-thumb-placeholder">🍱</div>
                            )}
                            {inCart && (
                              <span className="dish-in-cart-badge">
                                ✓ {inCart.quantity}
                              </span>
                            )}
                          </div>

                          <div className="dish-card-body">
                            <h4 className="dish-name" title={combo.name}>{combo.name}</h4>
                            <div className="dish-bottom-row">
                              <span className="dish-price">{formatCurrency(combo.price)}</span>
                              <button
                                type="button"
                                className="dish-quick-add"
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

            {/* ── BẢNG GIỎ HÀNG (DESKTOP/TABLET SIDEBAR & MOBILE DRAWER) ── */}
            <div className={`waiter-cart-pane ${cartDrawerOpen ? 'drawer-open' : ''}`}>
              <div className="cart-pane-header">
                <div className="cart-title-wrap">
                  <span className="cart-icon">🛒</span>
                  <div>
                    <h3 className="cart-title">Đơn gọi món</h3>
                    <span className="cart-sub">BÀN {selectedTable?.tableNumber} ({cartTotalQty} món)</span>
                  </div>
                </div>

                {/* Nút đóng drawer trên mobile */}
                <button
                  type="button"
                  className="cart-close-drawer-btn"
                  onClick={() => setCartDrawerOpen(false)}
                >
                  ✕
                </button>
              </div>

              {/* Danh sách món trong giỏ */}
              <div className="cart-items-container">
                {cart.length === 0 ? (
                  <div className="cart-empty-state">
                    <span className="cart-empty-icon">🍽️</span>
                    <h4>Chưa chọn món nào</h4>
                    <p>Chạm vào các món bên cạnh để thêm vào đơn của bàn.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={item.key || idx} className="cart-item-card">
                      <div className="cart-item-top">
                        <div className="cart-item-info">
                          <span className="cart-item-name">{item.name}</span>
                          <span className="cart-item-price">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>

                        {/* Bộ nút tăng giảm số lượng */}
                        <div className="cart-stepper">
                          <button
                            type="button"
                            className="stepper-btn minus"
                            onClick={() => handleUpdateCartQty(idx, -1)}
                            title="Giảm 1"
                          >
                            −
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
                          <button
                            type="button"
                            className="stepper-btn delete"
                            onClick={() => handleRemoveFromCart(idx)}
                            title="Xóa món"
                          >
                            🗑️
                          </button>
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
                        placeholder="Ghi chú thêm (vd: ít ngọt, mang ra trước...)"
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
                  <input
                    type="text"
                    placeholder="Ghi chú chung cho đơn (nếu có)..."
                    value={orderNote}
                    onChange={e => setOrderNote(e.target.value)}
                    className="order-general-note-input"
                  />
                )}

                <div className="cart-total-row">
                  <span>TỔNG CỘNG:</span>
                  <span className="cart-total-amount">{formatCurrency(cartTotal)}</span>
                </div>

                <button
                  type="button"
                  className="cart-submit-btn"
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
                      <span>🚀 GỬI ĐƠN VÀO BẾP</span>
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
                  Gửi bếp 🚀
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
                  Khu vực: <strong>{getAreaInfo(getTableArea(selectedTable)).name}</strong>
                  {' • '}
                  Trạng thái: <strong style={{ color: activeTableOrder.status === 'BILLING_REQUESTED' ? '#a855f7' : '#ef4444' }}>
                    {activeTableOrder.status === 'BILLING_REQUESTED' ? '🟣 Yêu cầu thanh toán' : '🔴 Đang phục vụ'}
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
                className="modal-btn req-bill"
                onClick={() => handleRequestBilling(selectedTable, activeTableOrder)}
              >
                🟣 Yêu cầu thanh toán
              </button>

              <button
                type="button"
                className="modal-btn checkout"
                onClick={handleCheckoutTable}
              >
                💰 Thu tiền & Trả bàn
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
