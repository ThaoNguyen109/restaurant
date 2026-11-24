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

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function formatDateTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${time} ${formatDate(date)}`
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  // ── States ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [reservations, setReservations] = useState([])
  const [menuItems, setMenuItems] = useState([])

  // Bộ lọc thời gian: TODAY | 7DAYS | THIS_MONTH | LAST_MONTH | THIS_YEAR | CUSTOM
  const [filterPeriod, setFilterPeriod] = useState('TODAY')
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split('T')[0]
  })
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Bộ lọc đơn hàng chi tiết
  const [orderSearchText, setOrderSearchText] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  // Bộ lọc món bán chạy
  const [dishCategoryFilter, setDishCategoryFilter] = useState('ALL')

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
      console.error('Lỗi khi tải dữ liệu báo cáo thống kê:', err)
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

  // ── Tính toán khung thời gian lọc & kỳ so sánh đối ứng ─────────────
  const timeBounds = useMemo(() => {
    const now = new Date()
    let start, end, prevStart, prevEnd, label

    if (filterPeriod === 'TODAY') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      prevStart = new Date(start)
      prevStart.setDate(prevStart.getDate() - 1)
      prevEnd = new Date(end)
      prevEnd.setDate(prevEnd.getDate() - 1)
      label = `Hôm nay (${formatDate(start)})`
    } else if (filterPeriod === '7DAYS') {
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0)
      const diffDays = 7
      prevEnd = new Date(start)
      prevEnd.setMilliseconds(-1)
      prevStart = new Date(prevEnd)
      prevStart.setDate(prevStart.getDate() - diffDays + 1)
      prevStart.setHours(0, 0, 0, 0)
      label = `7 ngày qua (${formatDate(start)} - ${formatDate(end)})`
    } else if (filterPeriod === 'THIS_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      label = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`
    } else if (filterPeriod === 'LAST_MONTH') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0)
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999)
      label = `Tháng trước (${start.getMonth() + 1}/${start.getFullYear()})`
    } else if (filterPeriod === 'THIS_YEAR') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0)
      prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
      label = `Năm ${now.getFullYear()}`
    } else {
      // CUSTOM
      const s = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      s.setHours(0, 0, 0, 0)
      const e = customEndDate ? new Date(customEndDate) : new Date()
      e.setHours(23, 59, 59, 999)
      start = s
      end = e
      const durationMs = end.getTime() - start.getTime()
      prevEnd = new Date(start.getTime() - 1)
      prevStart = new Date(prevEnd.getTime() - durationMs)
      label = `Tùy chọn (${formatDate(start)} - ${formatDate(end)})`
    }

    return { start, end, prevStart, prevEnd, label }
  }, [filterPeriod, customStartDate, customEndDate])

  // ── Lọc danh sách Đơn hàng & Đặt bàn theo thời gian ────────────────
  const { filteredOrders, prevOrders, filteredReservations, prevReservations } = useMemo(() => {
    const { start, end, prevStart, prevEnd } = timeBounds

    const fOrders = orders.filter(o => {
      if (!o.createdAt) return false
      const t = new Date(o.createdAt).getTime()
      return t >= start.getTime() && t <= end.getTime()
    })

    const pOrders = orders.filter(o => {
      if (!o.createdAt) return false
      const t = new Date(o.createdAt).getTime()
      return t >= prevStart.getTime() && t <= prevEnd.getTime()
    })

    const fResv = reservations.filter(r => {
      if (!r.reservationDate) return false
      const t = new Date(r.reservationDate).getTime()
      return t >= start.getTime() && t <= end.getTime()
    })

    const pResv = reservations.filter(r => {
      if (!r.reservationDate) return false
      const t = new Date(r.reservationDate).getTime()
      return t >= prevStart.getTime() && t <= prevEnd.getTime()
    })

    return {
      filteredOrders: fOrders,
      prevOrders: pOrders,
      filteredReservations: fResv,
      prevReservations: pResv,
    }
  }, [orders, reservations, timeBounds])

  // ── 1. Thống Kê 6 Thẻ KPI Cốt Lõi Nhà Hàng ────────────────────────
  const kpiStats = useMemo(() => {
    // 1. Doanh thu thuần (chỉ tính đơn COMPLETED)
    const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED')
    const currentRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    const prevCompletedOrders = prevOrders.filter(o => o.status === 'COMPLETED')
    const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

    let revChange = 0
    let isRevUp = true
    if (prevRevenue > 0) {
      revChange = ((currentRevenue - prevRevenue) / prevRevenue) * 100
      isRevUp = revChange >= 0
    } else if (currentRevenue > 0) {
      revChange = 100
      isRevUp = true
    }

    // 2. Tổng số đơn hàng & tỷ lệ hoàn thành/hủy
    const totalOrdersCount = filteredOrders.length
    const cancelledOrders = filteredOrders.filter(o => o.status === 'CANCELLED')
    const cancelRate = totalOrdersCount > 0 ? ((cancelledOrders.length / totalOrdersCount) * 100).toFixed(1) : 0

    let orderCountChange = 0
    let isOrderCountUp = true
    if (prevOrders.length > 0) {
      orderCountChange = ((totalOrdersCount - prevOrders.length) / prevOrders.length) * 100
      isOrderCountUp = orderCountChange >= 0
    } else if (totalOrdersCount > 0) {
      orderCountChange = 100
      isOrderCountUp = true
    }

    // 3. Giá trị đơn trung bình (AOV - Average Order Value)
    const aov = completedOrders.length > 0 ? Math.round(currentRevenue / completedOrders.length) : 0
    const prevAov = prevCompletedOrders.length > 0 ? Math.round(prevRevenue / prevCompletedOrders.length) : 0
    let aovChange = 0
    let isAovUp = true
    if (prevAov > 0) {
      aovChange = ((aov - prevAov) / prevAov) * 100
      isAovUp = aovChange >= 0
    } else if (aov > 0) {
      aovChange = 100
      isAovUp = true
    }

    // 4. Công suất bàn
    const activeTables = tables.filter(t => t.status !== 'INACTIVE')
    const totalTablesCount = activeTables.length || 20
    const occupiedCount = activeTables.filter(t => ['OCCUPIED', 'BILLING_REQUESTED'].includes(t.status)).length
    const capacityPercent = totalTablesCount > 0 ? Math.round((occupiedCount / totalTablesCount) * 100) : 0

    // 5. Khách hàng & Đặt bàn
    const totalGuests = filteredReservations.reduce((sum, r) => sum + Number(r.numberOfGuests || 1), 0)
    const prevGuests = prevReservations.reduce((sum, r) => sum + Number(r.numberOfGuests || 1), 0)
    let guestChange = 0
    let isGuestUp = true
    if (prevGuests > 0) {
      guestChange = ((totalGuests - prevGuests) / prevGuests) * 100
      isGuestUp = guestChange >= 0
    } else if (totalGuests > 0) {
      guestChange = 100
      isGuestUp = true
    }

    // 6. Cơ cấu thanh toán
    let cashTotal = 0
    let vnpayTotal = 0
    completedOrders.forEach(o => {
      const amt = Number(o.totalAmount || 0)
      const method = String(o.paymentMethod || '').toUpperCase()
      if (method.includes('VNPAY') || method.includes('BANK') || method.includes('CARD') || method.includes('ONLINE')) {
        vnpayTotal += amt
      } else {
        cashTotal += amt
      }
    })
    const vnpayShare = currentRevenue > 0 ? Math.round((vnpayTotal / currentRevenue) * 100) : 0
    const cashShare = currentRevenue > 0 ? 100 - vnpayShare : 0

    return {
      currentRevenue,
      prevRevenue,
      revChange: Math.abs(revChange).toFixed(1),
      isRevUp,
      totalOrdersCount,
      completedCount: completedOrders.length,
      cancelledCount: cancelledOrders.length,
      cancelRate,
      orderCountChange: Math.abs(orderCountChange).toFixed(1),
      isOrderCountUp,
      aov,
      aovChange: Math.abs(aovChange).toFixed(1),
      isAovUp,
      occupiedCount,
      totalTablesCount,
      capacityPercent,
      totalGuests,
      resvCount: filteredReservations.length,
      guestChange: Math.abs(guestChange).toFixed(1),
      isGuestUp,
      cashTotal,
      vnpayTotal,
      cashShare,
      vnpayShare,
    }
  }, [filteredOrders, prevOrders, tables, filteredReservations, prevReservations])

  // ── 2. Dữ liệu Biểu đồ Doanh Thu Thông Minh Theo Mốc Lọc ───────────
  const chartData = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED' && o.createdAt)

    if (filterPeriod === 'TODAY') {
      // Nhóm theo các khung 2 giờ trong ngày: 08:00 đến 22:00
      const slots = [
        { label: '08:00', startH: 7, endH: 9 },
        { label: '10:00', startH: 9, endH: 11 },
        { label: '12:00', startH: 11, endH: 13 },
        { label: '14:00', startH: 13, endH: 15 },
        { label: '16:00', startH: 15, endH: 17 },
        { label: '18:00', startH: 17, endH: 19 },
        { label: '20:00', startH: 19, endH: 21 },
        { label: '22:00', startH: 21, endH: 24 },
      ]

      const list = slots.map(s => {
        const slotOrders = completedOrders.filter(o => {
          const h = new Date(o.createdAt).getHours()
          return h >= s.startH && h < s.endH
        })
        const slotRev = slotOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
        return {
          label: s.label,
          revenue: slotRev,
          orderCount: slotOrders.length,
          valueInM: Number((slotRev / 1000000).toFixed(2)),
        }
      })
      const maxRev = Math.max(...list.map(l => l.revenue), 100000)
      return { type: 'HOURLY', list, maxRev, unit: 'Triệu VNĐ' }
    } else if (filterPeriod === 'THIS_YEAR') {
      // 12 Tháng
      const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
      const list = months.map((m, idx) => {
        const mOrders = completedOrders.filter(o => new Date(o.createdAt).getMonth() === idx)
        const mRev = mOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
        return {
          label: m,
          revenue: mRev,
          orderCount: mOrders.length,
          valueInM: Number((mRev / 1000000).toFixed(1)),
        }
      })
      const maxRev = Math.max(...list.map(l => l.revenue), 1000000)
      return { type: 'MONTHLY', list, maxRev, unit: 'Triệu VNĐ' }
    } else {
      // 7 Ngày hoặc các ngày trong tháng / tùy chọn
      const { start, end } = timeBounds
      const daysDiff = Math.max(1, Math.min(31, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))))
      const list = []

      for (let i = 0; i < daysDiff; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        const dayOrders = completedOrders.filter(o => {
          const od = new Date(o.createdAt)
          return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate()
        })
        const dayRev = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        const dayLabel = daysDiff <= 7 ? `${dayNames[d.getDay()]} (${d.getDate()})` : `${d.getDate()}/${d.getMonth() + 1}`

        list.push({
          label: dayLabel,
          revenue: dayRev,
          orderCount: dayOrders.length,
          valueInM: Number((dayRev / 1000000).toFixed(2)),
        })
      }
      const maxRev = Math.max(...list.map(l => l.revenue), 500000)
      return { type: 'DAILY', list, maxRev, unit: 'Triệu VNĐ' }
    }
  }, [filteredOrders, filterPeriod, timeBounds])

  // ── 3. Phân Tích Giờ Cao Điểm (Peak Hours Analysis) ───────────────
  const peakHours = useMemo(() => {
    const slots = [
      { name: 'Ca sáng (08:00 - 11:00)', start: 8, end: 11, count: 0, revenue: 0, tag: 'Bữa sáng / Cà phê' },
      { name: 'Ca trưa (11:00 - 14:00)', start: 11, end: 14, count: 0, revenue: 0, tag: 'Cao điểm trưa ⭐' },
      { name: 'Ca chiều (14:00 - 17:00)', start: 14, end: 17, count: 0, revenue: 0, tag: 'Trà chiều / Ăn nhẹ' },
      { name: 'Ca tối (17:00 - 22:00)', start: 17, end: 22, count: 0, revenue: 0, tag: 'Cao điểm tối ⭐' },
    ]

    filteredOrders.forEach(o => {
      if (o.status === 'CANCELLED' || !o.createdAt) return
      const h = new Date(o.createdAt).getHours()
      const amt = Number(o.totalAmount || 0)
      for (const s of slots) {
        if (h >= s.start && h < s.end) {
          s.count += 1
          s.revenue += amt
          break
        }
      }
    })

    const maxCount = Math.max(...slots.map(s => s.count), 1)
    return slots.map(s => ({
      ...s,
      percent: Math.round((s.count / maxCount) * 100),
    }))
  }, [filteredOrders])

  // ── 4. Thống Kê Chi Tiết Top Món Ăn & Combo Bán Chạy ──────────────
  const topDishesRanking = useMemo(() => {
    const map = new Map()

    filteredOrders.forEach(order => {
      if (order.status === 'CANCELLED') return
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.status === 'CANCELLED') return
          const isCombo = Boolean(item.comboId || item.comboName)
          const name = item.menuItemName || item.comboName || item.itemName || 'Món ăn'
          const key = `${isCombo ? 'COMBO' : 'ITEM'}_${name.trim().toLowerCase()}`
          const qty = Number(item.quantity || 1)
          const price = Number(item.unitPrice || 0)
          const totalAmt = qty * price

          if (!map.has(key)) {
            map.set(key, {
              name,
              isCombo,
              type: isCombo ? 'Combo' : 'Món lẻ',
              sales: 0,
              revenue: 0,
              price: price > 0 ? price : 0,
            })
          }
          const entry = map.get(key)
          entry.sales += qty
          entry.revenue += totalAmt
          if (price > 0 && entry.price === 0) entry.price = price
        })
      }
    })

    let list = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)

    // Nếu chưa có đơn nào bán, bổ sung một số món thực tế từ menu để trang sinh động
    if (list.length === 0 && menuItems.length > 0) {
      list = menuItems.slice(0, 5).map(m => ({
        name: m.name,
        isCombo: false,
        type: 'Món lẻ',
        sales: 0,
        revenue: 0,
        price: Number(m.price || 0),
      }))
    }

    // Lọc theo danh mục (Tất cả / Món lẻ / Combo)
    if (dishCategoryFilter === 'COMBO') {
      list = list.filter(d => d.isCombo)
    } else if (dishCategoryFilter === 'ITEM') {
      list = list.filter(d => !d.isCombo)
    }

    const totalDishRevenue = list.reduce((sum, d) => sum + d.revenue, 0) || 1

    return list.map((d, index) => ({
      ...d,
      rank: index + 1,
      revShare: Math.round((d.revenue / totalDishRevenue) * 100),
    }))
  }, [filteredOrders, menuItems, dishCategoryFilter])

  // ── 5. Danh Sách Đơn Hàng Chi Tiết Trong Kỳ ────────────────────────
  const detailedOrders = useMemo(() => {
    let result = [...filteredOrders]

    // Lọc theo trạng thái
    if (orderStatusFilter !== 'ALL') {
      result = result.filter(o => o.status === orderStatusFilter)
    }

    // Lọc theo từ khóa tìm kiếm
    if (orderSearchText.trim()) {
      const q = orderSearchText.trim().toLowerCase()
      result = result.filter(o => {
        const idMatch = String(o.id).toLowerCase().includes(q)
        const tableMatch = String(o.tableNumber || o.table?.tableNumber || '').toLowerCase().includes(q)
        const itemsMatch = Array.isArray(o.items) && o.items.some(i => (i.menuItemName || i.comboName || '').toLowerCase().includes(q))
        return idMatch || tableMatch || itemsMatch
      })
    }

    // Sắp xếp đơn mới nhất lên đầu
    result.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return tB - tA
    })

    return result.map(o => {
      let itemsSummary = 'Chưa có món'
      if (Array.isArray(o.items) && o.items.length > 0) {
        itemsSummary = o.items
          .map(i => `${i.menuItemName || i.comboName || 'Món'} ${i.quantity > 1 ? `x${i.quantity}` : ''}`)
          .join(', ')
      }

      let tableName = 'Mang về'
      if (o.tableNumber) tableName = `Bàn ${String(o.tableNumber).padStart(2, '0')}`
      else if (o.table?.tableNumber) tableName = `Bàn ${String(o.table.tableNumber).padStart(2, '0')}`

      let paymentText = 'Tiền mặt'
      const pm = String(o.paymentMethod || '').toUpperCase()
      if (pm.includes('VNPAY')) paymentText = 'VNPay QR'
      else if (pm.includes('BANK')) paymentText = 'Chuyển khoản'

      let statusBadge = { key: 'completed', text: 'Hoàn thành' }
      if (o.status === 'PREPARING' || o.status === 'CONFIRMED') {
        statusBadge = { key: 'preparing', text: 'Đang nấu' }
      } else if (o.status === 'SERVING') {
        statusBadge = { key: 'delivering', text: 'Đang phục vụ' }
      } else if (o.status === 'BILLING_REQUESTED') {
        statusBadge = { key: 'billing', text: 'Chờ thanh toán' }
      } else if (o.status === 'PENDING') {
        statusBadge = { key: 'pending', text: 'Chờ xác nhận' }
      } else if (o.status === 'CANCELLED') {
        statusBadge = { key: 'cancelled', text: 'Đã hủy' }
      }

      return {
        id: o.id,
        code: `#ORD-${String(o.id).padStart(4, '0')}`,
        table: tableName,
        createdAt: formatDateTime(o.createdAt),
        items: itemsSummary,
        itemCount: Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0,
        total: formatCurrency(o.totalAmount),
        payment: paymentText,
        status: statusBadge.key,
        statusLabel: statusBadge.text,
      }
    })
  }, [filteredOrders, orderStatusFilter, orderSearchText])

  // In báo cáo
  const handlePrintReport = () => {
    window.print()
  }

  return (
    <AdminLayout
      title="Báo cáo & Thống kê"
      subtitle="ANALYTICS & REPORTS"
      actions={
        <div className="report-action-buttons">
          <button
            type="button"
            className="secondary-btn print-btn"
            onClick={handlePrintReport}
            title="In hoặc xuất file PDF báo cáo kinh doanh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            In / Xuất báo cáo
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate('/admin/orders')}
          >
            + Tạo đơn mới
          </button>
        </div>
      }
    >
      <div className="admin-reports-dashboard">
        {/* --- HEADER IN ẤN (Chỉ hiện khi in PDF / ra máy in) --- */}
        <div className="print-report-header">
          <div className="print-brand">
            <h2>NHÀ HÀNG HOA SEN</h2>
            <p>Hệ Thống Quản Lý & Điều Hành Nhà Hàng</p>
          </div>
          <div className="print-meta">
            <h1>BÁO CÁO KINH DOANH VÀ THỐNG KÊ CHI TIẾT</h1>
            <p><strong>Kỳ báo cáo:</strong> {timeBounds.label}</p>
            <p><strong>Ngày xuất báo cáo:</strong> {formatDateTime(new Date())}</p>
            <p><strong>Người xuất:</strong> Quản trị viên (Administrator)</p>
          </div>
        </div>

        {/* --- BỘ LỌC THỜI GIAN CHUYÊN NGHIỆP --- */}
        <div className="reports-filter-bar no-print">
          <div className="filter-presets">
            <span className="filter-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Thời gian:
            </span>
            {[
              { key: 'TODAY', label: 'Hôm nay' },
              { key: '7DAYS', label: '7 ngày qua' },
              { key: 'THIS_MONTH', label: 'Tháng này' },
              { key: 'LAST_MONTH', label: 'Tháng trước' },
              { key: 'THIS_YEAR', label: 'Năm nay' },
              { key: 'CUSTOM', label: 'Tùy chọn ngày' },
            ].map(p => (
              <button
                key={p.key}
                type="button"
                className={`filter-chip ${filterPeriod === p.key ? 'active' : ''}`}
                onClick={() => setFilterPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {filterPeriod === 'CUSTOM' && (
            <div className="custom-date-picker">
              <div className="date-input-group">
                <label>Từ ngày:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                />
              </div>
              <div className="date-input-group">
                <label>Đến ngày:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="current-period-tag">
            <span>Đang xem:</span> <strong>{timeBounds.label}</strong>
          </div>
        </div>

        {/* --- 1. HỆ THỐNG 6 THẺ KPI TỔNG QUAN --- */}
        <div className="kpi-grid">
          {/* KPI 1: Doanh thu thuần */}
          <div className="kpi-card highlight-revenue">
            <div className="kpi-header">
              <span className="kpi-title">Doanh thu thuần</span>
              <span className="kpi-icon-circle rev-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
            </div>
            <div className="kpi-value">{formatCurrency(kpiStats.currentRevenue)}</div>
            <div className="kpi-footer">
              <span className={`kpi-badge ${kpiStats.isRevUp ? 'up' : 'down'}`}>
                {kpiStats.isRevUp ? '↑' : '↓'} {kpiStats.revChange}%
              </span>
              <span className="kpi-subtext">so với kỳ trước ({formatCurrency(kpiStats.prevRevenue)})</span>
            </div>
          </div>

          {/* KPI 2: Tổng đơn & Tỷ lệ hủy */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Tổng đơn hàng</span>
              <span className="kpi-icon-circle order-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </span>
            </div>
            <div className="kpi-value">{kpiStats.totalOrdersCount} <small>đơn</small></div>
            <div className="kpi-footer">
              <span className="kpi-detail-item success-text">✓ {kpiStats.completedCount} hoàn thành</span>
              <span className="kpi-detail-item danger-text">✕ {kpiStats.cancelledCount} hủy ({kpiStats.cancelRate}%)</span>
            </div>
          </div>

          {/* KPI 3: Giá trị trung bình mỗi đơn (AOV) */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Đơn trung bình (AOV)</span>
              <span className="kpi-icon-circle aov-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
            </div>
            <div className="kpi-value">{formatCurrency(kpiStats.aov)}</div>
            <div className="kpi-footer">
              <span className={`kpi-badge ${kpiStats.isAovUp ? 'up' : 'down'}`}>
                {kpiStats.isAovUp ? '↑' : '↓'} {kpiStats.aovChange}%
              </span>
              <span className="kpi-subtext">mức chi tiêu trung bình / bàn</span>
            </div>
          </div>

          {/* KPI 4: Công suất phục vụ bàn */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Công suất phục vụ bàn</span>
              <span className="kpi-icon-circle table-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="12" rx="2" />
                  <line x1="6" y1="16" x2="6" y2="20" />
                  <line x1="18" y1="16" x2="18" y2="20" />
                </svg>
              </span>
            </div>
            <div className="kpi-value">{kpiStats.occupiedCount} / {kpiStats.totalTablesCount} <small>bàn đang dùng</small></div>
            <div className="kpi-footer">
              <div className="kpi-progress-bar">
                <div className="kpi-progress-fill" style={{ width: `${kpiStats.capacityPercent}%` }} />
              </div>
              <span className="kpi-subtext font-bold">{kpiStats.capacityPercent}% công suất</span>
            </div>
          </div>

          {/* KPI 5: Lượt khách & Đặt bàn */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Lượt khách & Đặt bàn</span>
              <span className="kpi-icon-circle guest-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
            </div>
            <div className="kpi-value">{kpiStats.totalGuests} <small>khách đặt</small></div>
            <div className="kpi-footer">
              <span className="kpi-detail-item highlight-text">📋 {kpiStats.resvCount} lượt đặt trước</span>
              <span className={`kpi-badge ${kpiStats.isGuestUp ? 'up' : 'down'}`}>
                {kpiStats.isGuestUp ? '↑' : '↓'} {kpiStats.guestChange}%
              </span>
            </div>
          </div>

          {/* KPI 6: Tỷ trọng Thanh Toán */}
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Hình thức thanh toán</span>
              <span className="kpi-icon-circle payment-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </span>
            </div>
            <div className="kpi-value payment-split-value">
              <span className="vnpay-text">{kpiStats.vnpayShare}% <small>Online</small></span>
              <span className="divider">/</span>
              <span className="cash-text">{kpiStats.cashShare}% <small>Tiền mặt</small></span>
            </div>
            <div className="kpi-footer">
              <div className="dual-progress-bar">
                <div className="vnpay-fill" style={{ width: `${kpiStats.vnpayShare}%` }} title={`VNPay / Online: ${formatCurrency(kpiStats.vnpayTotal)}`} />
                <div className="cash-fill" style={{ width: `${kpiStats.cashShare}%` }} title={`Tiền mặt: ${formatCurrency(kpiStats.cashTotal)}`} />
              </div>
              <span className="kpi-subtext">Online: {formatCurrency(kpiStats.vnpayTotal)}</span>
            </div>
          </div>
        </div>

        {/* --- 2. BIỂU ĐỒ DOANH THU & PHÂN TÍCH GIỜ CAO ĐIỂM --- */}
        <div className="analytics-grid">
          {/* Biểu đồ doanh thu thông minh */}
          <div className="analytics-card chart-card">
            <div className="card-header">
              <div>
                <h3>Biểu đồ doanh thu kinh doanh</h3>
                <p className="card-subtitle">
                  {chartData.type === 'HOURLY'
                    ? 'Phân bổ doanh thu theo khung giờ trong ngày'
                    : chartData.type === 'MONTHLY'
                    ? 'Diễn biến doanh thu 12 tháng qua'
                    : 'Doanh thu từng ngày theo chu kỳ lọc'}
                </p>
              </div>
              <div className="chart-legend">
                <span className="legend-dot" />
                <span className="legend-label">Doanh thu hoàn tất ({chartData.unit})</span>
              </div>
            </div>

            <div className="chart-stage">
              <div className="bar-chart-container">
                {chartData.list.map((d, index) => {
                  const heightPercent = chartData.maxRev > 0 ? (d.revenue / chartData.maxRev) * 100 : 0
                  return (
                    <div key={index} className="bar-column">
                      <div className="bar-wrapper">
                        <div
                          className="bar-fill"
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                        >
                          <div className="bar-tooltip">
                            <span className="tt-label">{d.label}</span>
                            <strong className="tt-rev">{formatCurrency(d.revenue)}</strong>
                            <span className="tt-count">{d.orderCount} đơn hoàn thành</span>
                          </div>
                        </div>
                      </div>
                      <span className="bar-x-label">{d.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="chart-summary-bar">
              <div className="cs-item">
                <span className="cs-label">Tổng doanh thu kỳ:</span>
                <strong className="cs-val text-brand">{formatCurrency(kpiStats.currentRevenue)}</strong>
              </div>
              <div className="cs-item">
                <span className="cs-label">Đơn hoàn thành:</span>
                <strong className="cs-val">{kpiStats.completedCount} đơn</strong>
              </div>
              <div className="cs-item">
                <span className="cs-label">Doanh thu trung bình/mốc:</span>
                <strong className="cs-val">
                  {chartData.list.length > 0
                    ? formatCurrency(Math.round(kpiStats.currentRevenue / chartData.list.length))
                    : '0 đ'}
                </strong>
              </div>
            </div>
          </div>

          {/* Phân tích khung giờ cao điểm (Peak Hours) */}
          <div className="analytics-card peak-hours-card">
            <div className="card-header">
              <div>
                <h3>Khung giờ cao điểm</h3>
                <p className="card-subtitle">Mật độ khách ăn tại nhà hàng</p>
              </div>
            </div>

            <div className="peak-hours-list">
              {peakHours.map((slot, idx) => (
                <div key={idx} className="peak-hour-row">
                  <div className="ph-info">
                    <div className="ph-title-group">
                      <strong>{slot.name}</strong>
                      <span className="ph-tag">{slot.tag}</span>
                    </div>
                    <div className="ph-stats">
                      <span className="ph-count">{slot.count} đơn</span>
                      <span className="ph-rev">{formatCurrency(slot.revenue)}</span>
                    </div>
                  </div>
                  <div className="ph-bar-track">
                    <div
                      className={`ph-bar-fill ${slot.percent >= 75 ? 'peak-high' : slot.percent >= 40 ? 'peak-medium' : 'peak-low'}`}
                      style={{ width: `${Math.max(slot.percent, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="operational-tips">
              <div className="tip-icon">💡</div>
              <div className="tip-content">
                <strong>Gợi ý vận hành:</strong> Khung giờ <strong>11:00 - 14:00</strong> và <strong>17:00 - 21:00</strong> thường xuyên chiếm hơn 70% doanh thu. Hãy bố trí đầy đủ nhân sự bếp và sảnh trong hai khung giờ này.
              </div>
            </div>
          </div>
        </div>

        {/* --- 3. BẢNG XẾP HẠNG TOP MÓN ĂN & COMBO BÁN CHẠY --- */}
        <div className="analytics-card ranking-card">
          <div className="card-header">
            <div>
              <h3>Bảng xếp hạng món ăn & Combo hiệu quả nhất</h3>
              <p className="card-subtitle">Thống kê số lượng bán ra và tỷ trọng đóng góp vào tổng doanh thu</p>
            </div>
            <div className="ranking-controls no-print">
              <div className="filter-chip-group">
                <button
                  type="button"
                  className={`chip-btn ${dishCategoryFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setDishCategoryFilter('ALL')}
                >
                  Tất cả ({topDishesRanking.length})
                </button>
                <button
                  type="button"
                  className={`chip-btn ${dishCategoryFilter === 'ITEM' ? 'active' : ''}`}
                  onClick={() => setDishCategoryFilter('ITEM')}
                >
                  Món lẻ
                </button>
                <button
                  type="button"
                  className={`chip-btn ${dishCategoryFilter === 'COMBO' ? 'active' : ''}`}
                  onClick={() => setDishCategoryFilter('COMBO')}
                >
                  Combo ưu đãi
                </button>
              </div>
              <button
                type="button"
                className="secondary-btn small-btn"
                onClick={() => navigate('/admin/menu')}
              >
                Quản lý thực đơn →
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Hạng</th>
                  <th>Tên món / Combo</th>
                  <th>Phân loại</th>
                  <th style={{ textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ textAlign: 'center' }}>Số lượng bán</th>
                  <th style={{ textAlign: 'right' }}>Tổng doanh thu</th>
                  <th style={{ width: '160px' }}>Đóng góp doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {topDishesRanking.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      Chưa ghi nhận món ăn nào bán ra trong khoảng thời gian này
                    </td>
                  </tr>
                ) : (
                  topDishesRanking.map((dish) => (
                    <tr key={dish.rank}>
                      <td>
                        <span className={`rank-badge rank-${dish.rank <= 3 ? dish.rank : 'normal'}`}>
                          {dish.rank <= 3 ? `0${dish.rank}` : dish.rank}
                        </span>
                      </td>
                      <td>
                        <strong className="dish-name-cell">{dish.name}</strong>
                      </td>
                      <td>
                        <span className={`type-tag ${dish.isCombo ? 'type-combo' : 'type-item'}`}>
                          {dish.type}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '500' }}>
                        {formatCurrency(dish.price)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="sales-pill">{dish.sales} suất</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#1e3527' }}>
                        {formatCurrency(dish.revenue)}
                      </td>
                      <td>
                        <div className="share-cell">
                          <div className="share-bar">
                            <div className="share-fill" style={{ width: `${dish.revShare}%` }} />
                          </div>
                          <span className="share-text">{dish.revShare}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- 4. BẢNG CHI TIẾT CÁC ĐƠN HÀNG TRONG KỲ --- */}
        <div className="analytics-card orders-log-card">
          <div className="card-header">
            <div>
              <h3>Danh sách đơn hàng trong kỳ báo cáo</h3>
              <p className="card-subtitle">Hiển thị {detailedOrders.length} đơn hàng phát sinh trong khoảng thời gian chọn</p>
            </div>
            <div className="order-filters-row no-print">
              <div className="search-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, bàn, tên món..."
                  value={orderSearchText}
                  onChange={e => setOrderSearchText(e.target.value)}
                />
              </div>

              <select
                className="select-filter"
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="SERVING">Đang phục vụ</option>
                <option value="BILLING_REQUESTED">Chờ tính tiền</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>

              <button
                type="button"
                className="primary-btn small-btn"
                onClick={() => navigate('/admin/orders')}
              >
                Trang quản lý đơn →
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Thời gian</th>
                  <th>Bàn / Vị trí</th>
                  <th>Chi tiết món ăn</th>
                  <th>Thanh toán</th>
                  <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                  <th style={{ textAlign: 'center' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {detailedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  detailedOrders.slice(0, 15).map(o => (
                    <tr
                      key={o.id}
                      onClick={() => navigate('/admin/orders')}
                      style={{ cursor: 'pointer' }}
                    >
                      <td><strong className="order-code">{o.code}</strong></td>
                      <td className="order-date-text">{o.createdAt}</td>
                      <td><span className="order-table-badge">{o.table}</span></td>
                      <td className="order-items-summary" title={o.items}>
                        {o.items}
                      </td>
                      <td>
                        <span className={`payment-method-pill ${o.payment.includes('VNPay') ? 'pm-vnpay' : 'pm-cash'}`}>
                          {o.payment}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#1e3527' }}>
                        {o.total}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge status-${o.status}`}>
                          {o.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {detailedOrders.length > 15 && (
            <div className="table-more-footer no-print">
              <span>Đang hiển thị 15 / {detailedOrders.length} đơn hàng. Để quản lý đầy đủ, vui lòng truy cập trang Quản lý đơn hàng.</span>
              <button
                type="button"
                className="text-btn"
                onClick={() => navigate('/admin/orders')}
              >
                Xem toàn bộ đơn hàng →
              </button>
            </div>
          )}
        </div>

        {/* --- CHỮ KÝ BÁO CÁO KHI IN --- */}
        <div className="print-signatures-footer">
          <div className="sign-col">
            <p><strong>Người lập báo cáo</strong></p>
            <span>(Ký, ghi rõ họ tên)</span>
          </div>
          <div className="sign-col">
            <p><strong>Kế toán trưởng / Thu ngân</strong></p>
            <span>(Ký, ghi rõ họ tên)</span>
          </div>
          <div className="sign-col">
            <p><strong>Giám đốc / Chủ nhà hàng</strong></p>
            <span>(Ký, đóng dấu)</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
