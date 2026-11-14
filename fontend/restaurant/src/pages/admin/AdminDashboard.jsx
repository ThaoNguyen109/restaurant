import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/pages/admin/AdminDashboard.css'
import { getAllOrders } from '../../services/orderService'
import { getAllTables, getActiveTables } from '../../services/tableService'
import { getAllReservations } from '../../services/reservationService'
import { getAllMenuItems } from '../../services/menuItemService'
import { subscribeWebSocket } from '../../services/websocketService'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function isSameDate(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  // ── States ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [reservations, setReservations] = useState([])
  const [menuItems, setMenuItems] = useState([])

  // ── Load Real Data ────────────────────────────────────────────────
  const loadDashboardData = useCallback(async () => {
    try {
      const [ordersRes, tablesRes, resvRes, menuRes] = await Promise.allSettled([
        getAllOrders(),
        getAllTables().catch(() => getActiveTables()),
        getAllReservations(),
        getAllMenuItems(),
      ])

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
        setOrders(ordersRes.value)
      }
      if (tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value)) {
        setTables(tablesRes.value)
      }
      if (resvRes.status === 'fulfilled' && Array.isArray(resvRes.value)) {
        setReservations(resvRes.value)
      }
      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value)) {
        setMenuItems(menuRes.value)
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Lắng nghe cập nhật thời gian thực qua WebSocket
  useEffect(() => {
    const unsubOrders = subscribeWebSocket('/topic/orders', () => loadDashboardData())
    const unsubTables = subscribeWebSocket('/topic/tables', () => loadDashboardData())
    const unsubResv = subscribeWebSocket('/topic/reservations', () => loadDashboardData())

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders()
      if (typeof unsubTables === 'function') unsubTables()
      if (typeof unsubResv === 'function') unsubResv()
    }
  }, [loadDashboardData])

  // ── 1. Thống Kê 4 Card KPI (Hôm nay so với hôm qua) ───────────────
  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Đơn hôm nay & hôm qua
    const todayOrders = orders.filter(o => o.createdAt && isSameDate(new Date(o.createdAt), today))
    const yesterdayOrders = orders.filter(o => o.createdAt && isSameDate(new Date(o.createdAt), yesterday))

    // Doanh thu (từ các đơn COMPLETED)
    const todayCompleted = todayOrders.filter(o => o.status === 'COMPLETED')
    const yesterdayCompleted = yesterdayOrders.filter(o => o.status === 'COMPLETED')

    const todayRev = todayCompleted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    const yesterdayRev = yesterdayCompleted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    let revChange = 0
    let isRevUp = true
    if (yesterdayRev > 0) {
      revChange = ((todayRev - yesterdayRev) / yesterdayRev) * 100
      isRevUp = revChange >= 0
    } else if (todayRev > 0) {
      revChange = 100
      isRevUp = true
    }

    // Tổng đơn hàng
    let ordersChange = 0
    let isOrdersUp = true
    if (yesterdayOrders.length > 0) {
      ordersChange = ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
      isOrdersUp = ordersChange >= 0
    } else if (todayOrders.length > 0) {
      ordersChange = 100
      isOrdersUp = true
    }

    // Bàn đang phục vụ
    const activeTables = tables.filter(t => t.status !== 'INACTIVE')
    const totalTablesCount = activeTables.length || 20
    const occupiedCount = activeTables.filter(t => ['OCCUPIED', 'BILLING_REQUESTED'].includes(t.status)).length
    const capacityPercent = totalTablesCount > 0 ? Math.round((occupiedCount / totalTablesCount) * 100) : 0

    // Đặt bàn / Khách hàng hôm nay
    const todayResv = reservations.filter(r => r.reservationDate && isSameDate(new Date(r.reservationDate), today))
    const yesterdayResv = reservations.filter(r => r.reservationDate && isSameDate(new Date(r.reservationDate), yesterday))
    const totalGuestsToday = todayResv.reduce((sum, r) => sum + Number(r.numberOfGuests || 1), 0)
    const totalGuestsYesterday = yesterdayResv.reduce((sum, r) => sum + Number(r.numberOfGuests || 1), 0)

    let guestChange = 0
    let isGuestUp = true
    if (totalGuestsYesterday > 0) {
      guestChange = ((totalGuestsToday - totalGuestsYesterday) / totalGuestsYesterday) * 100
      isGuestUp = guestChange >= 0
    } else if (totalGuestsToday > 0) {
      guestChange = 100
      isGuestUp = true
    }

    return [
      {
        title: 'Doanh thu hôm nay',
        value: formatCurrency(todayRev),
        change: `${isRevUp ? '+' : ''}${revChange.toFixed(1)}%`,
        isUp: isRevUp,
        subtext: 'so với hôm qua',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        title: 'Tổng đơn hàng',
        value: `${todayOrders.length} đơn`,
        change: `${isOrdersUp ? '+' : ''}${ordersChange.toFixed(1)}%`,
        isUp: isOrdersUp,
        subtext: 'so với hôm qua',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        title: 'Bàn đang phục vụ',
        value: `${occupiedCount} / ${totalTablesCount}`,
        change: `${capacityPercent}% công suất`,
        isUp: capacityPercent > 0,
        subtext: 'sảnh chính',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="12" rx="2" />
            <line x1="6" y1="16" x2="6" y2="20" />
            <line x1="18" y1="16" x2="18" y2="20" />
            <line x1="4" y1="10" x2="20" y2="10" />
          </svg>
        ),
      },
      {
        title: 'Khách hàng đặt bàn',
        value: `${totalGuestsToday > 0 ? totalGuestsToday : todayResv.length} ${totalGuestsToday > 0 ? 'người' : 'lượt'}`,
        change: `${isGuestUp ? '+' : ''}${guestChange.toFixed(1)}%`,
        isUp: isGuestUp,
        subtext: 'so với hôm qua',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ]
  }, [orders, tables, reservations])

  // ── 2. Dữ liệu Biểu đồ Tuần này (T2 → CN) ────────────────────────
  const chartData = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDay()
    const distToMonday = currentDay === 0 ? 6 : currentDay - 1

    const monday = new Date(now)
    monday.setDate(now.getDate() - distToMonday)
    monday.setHours(0, 0, 0, 0)

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const result = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)

      const dayOrders = orders.filter(o => {
        if (!o.createdAt || o.status !== 'COMPLETED') return false
        return isSameDate(new Date(o.createdAt), d)
      })

      const dayRev = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
      const inMillions = Number((dayRev / 1000000).toFixed(1))

      result.push({
        day: dayLabels[i],
        value: inMillions,
        rawRevenue: dayRev,
        orderCount: dayOrders.length,
      })
    }

    const maxVal = Math.max(...result.map(r => r.value), 10)
    return { list: result, maxVal }
  }, [orders])

  // ── 3. Top Món Ăn Bán Chạy Nhất (Thống kê thực từ orderItems) ────
  const topDishes = useMemo(() => {
    const dishMap = new Map()

    orders.forEach(order => {
      if (order.status === 'CANCELLED') return
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.status === 'CANCELLED') return
          const name = item.menuItemName || item.comboName || item.itemName || 'Món ăn'
          const key = name.trim().toLowerCase()
          const qty = Number(item.quantity || 1)
          const price = Number(item.unitPrice || 0)

          if (!dishMap.has(key)) {
            dishMap.set(key, {
              name,
              sales: 0,
              price: price > 0 ? price : 0,
            })
          }
          const d = dishMap.get(key)
          d.sales += qty
          if (price > 0 && d.price === 0) d.price = price
        })
      }
    })

    let sorted = Array.from(dishMap.values()).sort((a, b) => b.sales - a.sales)

    // Nếu dữ liệu order còn ít, bổ sung các món trong thực đơn để danh sách tròn 4 món
    if (sorted.length < 4 && menuItems.length > 0) {
      const existing = new Set(sorted.map(s => s.name.toLowerCase()))
      for (const m of menuItems) {
        if (!existing.has(m.name.toLowerCase())) {
          sorted.push({
            name: m.name,
            sales: 0,
            price: Number(m.price || 0),
          })
          if (sorted.length >= 4) break
        }
      }
    }

    return sorted.slice(0, 4)
  }, [orders, menuItems])

  // ── 4. Danh sách Đơn Hàng Gần Đây ─────────────────────────────────
  const recentOrders = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tB - tA
    })

    return sorted.slice(0, 5).map(o => {
      let itemsText = ''
      if (Array.isArray(o.items) && o.items.length > 0) {
        itemsText = o.items
          .map(i => `${i.menuItemName || i.comboName || i.itemName || 'Món'} ${i.quantity > 1 ? `${i.quantity}x` : ''}`.trim())
          .join(', ')
      } else {
        itemsText = 'Chưa có món'
      }

      let tableName = 'Mang về'
      if (o.tableNumber) tableName = `Bàn ${String(o.tableNumber).padStart(2, '0')}`
      else if (o.table?.tableNumber) tableName = `Bàn ${String(o.table.tableNumber).padStart(2, '0')}`

      let statusKey = 'completed'
      let statusLabel = 'Hoàn thành'

      if (o.status === 'PREPARING' || o.status === 'CONFIRMED') {
        statusKey = 'preparing'
        statusLabel = 'Đang chế biến'
      } else if (o.status === 'SERVING') {
        statusKey = 'delivering'
        statusLabel = 'Đang phục vụ'
      } else if (o.status === 'BILLING_REQUESTED') {
        statusKey = 'billing'
        statusLabel = 'Chờ tính tiền'
      } else if (o.status === 'PENDING') {
        statusKey = 'pending'
        statusLabel = 'Chờ xác nhận'
      } else if (o.status === 'CANCELLED') {
        statusKey = 'cancelled'
        statusLabel = 'Đã hủy'
      }

      return {
        id: `#ORD-${o.id}`,
        table: tableName,
        items: itemsText,
        total: formatCurrency(o.totalAmount),
        status: statusKey,
        label: statusLabel,
      }
    })
  }, [orders])

  return (
    <AdminLayout
      title="Chào mừng trở lại, Quản trị viên"
      subtitle="DASHBOARD"
      actions={
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate('/admin/orders')}
        >
          + Tạo đơn mới
        </button>
      }
    >
      <div className="admin-dashboard">
        {/* 1. KHOẢNG THỐNG KÊ NHANH (CARDS) */}
        <div className="dashboard-metrics">
          {stats.map((item, idx) => (
            <div key={idx} className="metric-card">
              <div className="metric-header">
                <span className="metric-title">{item.title}</span>
                <span className="metric-icon">{item.icon}</span>
              </div>
              <div className="metric-value">{item.value}</div>
              <div className={`metric-change ${item.isUp ? 'up' : 'down'}`}>
                <span>{item.isUp ? '↑' : '↓'}</span> {item.change}
                <span className="metric-subtext"> {item.subtext}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. KHU VỰC BIỂU ĐỒ & TOP MÓN BÁN CHẠY */}
        <div className="dashboard-grid">
          {/* Biểu đồ doanh thu tuần này */}
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <h3>Doanh thu tuần này</h3>
              <span className="card-tag">Đơn vị: Triệu VNĐ</span>
            </div>
            <div className="bar-chart">
              {chartData.list.map((d, index) => {
                const heightPercent = chartData.maxVal > 0 ? (d.value / chartData.maxVal) * 100 : 0
                return (
                  <div key={index} className="bar-group">
                    <div
                      className="bar"
                      style={{ height: `${Math.max(heightPercent, 3)}%` }}
                      data-value={`${d.value}M`}
                    />
                    <span className="bar-label">{d.day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Món ăn bán chạy */}
          <div className="dashboard-card top-dishes-card">
            <div className="card-header">
              <h3>Món ăn bán chạy</h3>
              <button
                type="button"
                className="text-btn"
                onClick={() => navigate('/admin/menu')}
              >
                Xem tất cả
              </button>
            </div>
            <ul className="dishes-list">
              {topDishes.length === 0 ? (
                <li className="dish-empty-text">Chưa có dữ liệu món bán</li>
              ) : (
                topDishes.map((dish, i) => (
                  <li key={i} className="dish-item">
                    <span className="dish-rank">0{i + 1}</span>
                    <div className="dish-info">
                      <strong>{dish.name}</strong>
                      <small>{dish.sales} lượt gọi</small>
                    </div>
                    <span className="dish-price">{formatCurrency(dish.price)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* 3. BẢNG ĐƠN HÀNG GẦN ĐÂY */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h3>Đơn hàng gần đây</h3>
            <button
              type="button"
              className="primary-btn"
              onClick={() => navigate('/admin/orders')}
            >
              Xem tất cả đơn →
            </button>
          </div>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Vị trí / Bàn</th>
                  <th>Món ăn</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#6b7c70' }}>
                      Chưa có đơn hàng nào gần đây
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate('/admin/orders')}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="order-id">{order.id}</td>
                      <td><strong>{order.table}</strong></td>
                      <td className="order-items">{order.items}</td>
                      <td className="order-total">{order.total}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
