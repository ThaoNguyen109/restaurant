import { getAllOrders } from './orderService'
import { getAllTables, getActiveTables } from './tableService'
import { getAllReservations } from './reservationService'

/**
 * Lấy toàn bộ dữ liệu thật từ các API hiện có để phục vụ Dashboard
 */
export async function fetchDashboardData() {
  const [ordersRes, tablesRes, reservationsRes] = await Promise.allSettled([
    getAllOrders(),
    getAllTables().catch(() => getActiveTables()),
    getAllReservations(),
  ])

  const orders = ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : []
  const tables = tablesRes.status === 'fulfilled' && Array.isArray(tablesRes.value) ? tablesRes.value : []
  const reservations = reservationsRes.status === 'fulfilled' && Array.isArray(reservationsRes.value) ? reservationsRes.value : []

  return { orders, tables, reservations }
}

/**
 * Format tiền tệ VND
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

/**
 * Format ngày giờ hiển thị
 */
export function formatDateTime(isoString) {
  if (!isoString) return '-'
  const d = new Date(isoString)
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatTimeOnly(isoString) {
  if (!isoString) return '--:--'
  const d = new Date(isoString)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function getTimeAgo(isoString) {
  if (!isoString) return ''
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Vừa tạo'
  if (diffMins < 60) return `${diffMins} phút trước`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  return `${Math.floor(diffHours / 24)} ngày trước`
}

/**
 * Kiểm tra xem ngày có khớp với ngày hôm nay / hôm qua không
 */
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Lọc đơn hàng theo khoảng thời gian được chọn
 * @param {Array} orders
 * @param {'today'|'week'|'month'|'all'} timeRange
 */
export function filterOrdersByTimeRange(orders, timeRange = 'today') {
  if (!Array.isArray(orders)) return []
  if (timeRange === 'all') return orders

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  if (timeRange === 'today') {
    return orders.filter(o => {
      if (!o.createdAt) return false
      const d = new Date(o.createdAt)
      return d >= todayStart
    })
  }

  if (timeRange === 'week') {
    const sevenDaysAgo = new Date(todayStart)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    return orders.filter(o => {
      if (!o.createdAt) return false
      const d = new Date(o.createdAt)
      return d >= sevenDaysAgo
    })
  }

  if (timeRange === 'month') {
    const thirtyDaysAgo = new Date(todayStart)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    return orders.filter(o => {
      if (!o.createdAt) return false
      const d = new Date(o.createdAt)
      return d >= thirtyDaysAgo
    })
  }

  return orders
}

/**
 * Tính toán các chỉ số thống kê tổng quan (KPIs)
 */
export function calculateKpis(orders = [], tables = [], reservations = [], timeRange = 'today') {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // 1. Lọc đơn hôm nay vs hôm qua
  const todayOrders = orders.filter(o => o.createdAt && isSameDay(new Date(o.createdAt), today))
  const yesterdayOrders = orders.filter(o => o.createdAt && isSameDay(new Date(o.createdAt), yesterday))

  // Đơn hoàn tất
  const todayCompleted = todayOrders.filter(o => o.status === 'COMPLETED')
  const yesterdayCompleted = yesterdayOrders.filter(o => o.status === 'COMPLETED')

  // Doanh thu hôm nay vs hôm qua
  const todayRevenue = todayCompleted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  const yesterdayRevenue = yesterdayCompleted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  // Tỷ lệ tăng trưởng doanh thu
  let revenueChangePercent = 0
  if (yesterdayRevenue > 0) {
    revenueChangePercent = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
  } else if (todayRevenue > 0) {
    revenueChangePercent = 100
  }

  // Tỷ lệ tăng trưởng số đơn
  let orderChangePercent = 0
  if (yesterdayOrders.length > 0) {
    orderChangePercent = ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length) * 100
  } else if (todayOrders.length > 0) {
    orderChangePercent = 100
  }

  // Doanh thu trung bình trên mỗi đơn hoàn tất (AOV)
  const avgOrderValue = todayCompleted.length > 0 ? Math.round(todayRevenue / todayCompleted.length) : 0

  // 2. Thống kê bàn
  const activeTablesList = tables.filter(t => t.status !== 'INACTIVE')
  const totalTables = activeTablesList.length
  const occupiedTables = activeTablesList.filter(t => t.status === 'OCCUPIED').length
  const billingTables = activeTablesList.filter(t => t.status === 'BILLING_REQUESTED').length
  const reservedTables = activeTablesList.filter(t => t.status === 'RESERVED').length
  const availableTables = activeTablesList.filter(t => t.status === 'AVAILABLE').length

  const inServiceTables = occupiedTables + billingTables
  const occupancyRate = totalTables > 0 ? Math.round((inServiceTables / totalTables) * 100) : 0

  // 3. Thống kê đặt bàn hôm nay
  const todayReservations = reservations.filter(r => {
    if (!r.reservationDate) return false
    const d = new Date(r.reservationDate)
    return isSameDay(d, today)
  })
  const totalGuestsToday = todayReservations.reduce((sum, r) => sum + Number(r.numberOfGuests || 0), 0)
  const confirmedReservations = todayReservations.filter(r => ['CONFIRMED', 'COMPLETED'].includes(r.status)).length

  // 4. Các đơn đang hoạt động (cần phục vụ / đang trong bếp)
  const pendingCount = orders.filter(o => o.status === 'PENDING').length
  const preparingCount = orders.filter(o => o.status === 'PREPARING').length
  const servingCount = orders.filter(o => o.status === 'SERVING').length
  const billingOrdersCount = orders.filter(o => o.status === 'BILLING_REQUESTED').length
  const activeOrdersCount = pendingCount + preparingCount + servingCount + billingOrdersCount

  // Doanh thu & đơn theo bộ lọc timeRange hiện tại (nếu khác today)
  const filteredOrders = filterOrdersByTimeRange(orders, timeRange)
  const filteredCompleted = filteredOrders.filter(o => o.status === 'COMPLETED')
  const rangeRevenue = filteredCompleted.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  const rangeOrdersCount = filteredOrders.length

  return {
    todayRevenue,
    yesterdayRevenue,
    revenueChangePercent,
    avgOrderValue,
    todayOrdersCount: todayOrders.length,
    todayCompletedCount: todayCompleted.length,
    orderChangePercent,
    totalTables,
    inServiceTables,
    occupiedTables,
    billingTables,
    reservedTables,
    availableTables,
    occupancyRate,
    todayReservationsCount: todayReservations.length,
    totalGuestsToday,
    confirmedReservations,
    activeOrdersCount,
    pendingCount,
    preparingCount,
    servingCount,
    rangeRevenue,
    rangeOrdersCount,
  }
}

/**
 * Tính toán dữ liệu biểu đồ doanh thu theo 7 ngày qua hoặc 30 ngày qua
 * @param {Array} orders
 * @param {7|30} days
 */
export function calculateRevenueChart(orders = [], days = 7) {
  const result = []
  const now = new Date()

  // Thứ trong tuần tiếng Việt
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  for (let i = days - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayLabel = dayNames[targetDate.getDay()]
    const dateFormatted = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}`

    // Lọc các đơn hoàn tất trong ngày này
    const dayOrders = orders.filter(o => {
      if (!o.createdAt || o.status !== 'COMPLETED') return false
      return isSameDay(new Date(o.createdAt), targetDate)
    })

    const dayRevenue = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
    const orderCount = dayOrders.length

    result.push({
      date: dateFormatted,
      dayLabel,
      fullDate: targetDate.toISOString().split('T')[0],
      revenue: dayRevenue,
      revenueInMillions: Number((dayRevenue / 1000000).toFixed(2)),
      orderCount,
    })
  }

  // Tìm giá trị max để vẽ tỷ lệ thanh bar
  const maxRevenue = Math.max(...result.map(d => d.revenue), 1)
  const maxOrders = Math.max(...result.map(d => d.orderCount), 1)

  return {
    items: result,
    maxRevenue,
    maxOrders,
    totalRevenue: result.reduce((sum, d) => sum + d.revenue, 0),
    totalOrders: result.reduce((sum, d) => sum + d.orderCount, 0),
  }
}

/**
 * Tính toán Top món ăn bán chạy nhất từ các đơn hàng thực tế
 */
export function calculateTopDishes(orders = [], limit = 5) {
  const dishMap = new Map()

  orders.forEach(order => {
    // Chỉ tính các đơn không bị hủy
    if (order.status === 'CANCELLED') return
    if (!Array.isArray(order.items)) return

    order.items.forEach(item => {
      if (item.status === 'CANCELLED') return

      const isCombo = item.itemType === 'COMBO' || Boolean(item.comboId)
      const idKey = isCombo ? `combo_${item.comboId || item.id}` : `menu_${item.menuItemId || item.id}`
      const name = item.menuItemName || item.comboName || item.itemName || 'Món ăn'
      const image = item.menuItemImage || item.comboImage || item.image || ''
      const price = Number(item.unitPrice || 0)
      const qty = Number(item.quantity || 1)
      const subtotal = Number(item.subtotal || price * qty)

      if (!dishMap.has(idKey)) {
        dishMap.set(idKey, {
          id: idKey,
          name,
          image,
          isCombo,
          price,
          quantity: 0,
          totalRevenue: 0,
        })
      }

      const dish = dishMap.get(idKey)
      dish.quantity += qty
      dish.totalRevenue += subtotal
      if (!dish.image && image) dish.image = image
    })
  })

  // Sắp xếp theo số lượng bán giảm dần
  const sorted = Array.from(dishMap.values()).sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity
    return b.totalRevenue - a.totalRevenue
  })

  return sorted.slice(0, limit)
}

/**
 * Thống kê đơn theo khung giờ cao điểm trong ngày
 */
export function calculatePeakHours(orders = []) {
  const slots = [
    { key: 'morning', label: 'Sáng (07:00 - 11:00)', startHour: 7, endHour: 11, count: 0, revenue: 0 },
    { key: 'lunch', label: 'Trưa (11:00 - 14:00)', startHour: 11, endHour: 14, count: 0, revenue: 0 },
    { key: 'afternoon', label: 'Chiều (14:00 - 17:00)', startHour: 14, endHour: 17, count: 0, revenue: 0 },
    { key: 'dinner', label: 'Tối (17:00 - 22:00)', startHour: 17, endHour: 22, count: 0, revenue: 0 },
    { key: 'late', label: 'Khuya (22:00 - 24:00)', startHour: 22, endHour: 24, count: 0, revenue: 0 },
  ]

  orders.forEach(order => {
    if (!order.createdAt || order.status === 'CANCELLED') return
    const hour = new Date(order.createdAt).getHours()
    const amount = Number(order.totalAmount || 0)

    for (const slot of slots) {
      if (hour >= slot.startHour && hour < slot.endHour) {
        slot.count += 1
        slot.revenue += amount
        break
      }
    }
  })

  const maxCount = Math.max(...slots.map(s => s.count), 1)

  return slots.map(slot => ({
    ...slot,
    percentage: Math.round((slot.count / maxCount) * 100),
  }))
}

/**
 * Lấy danh sách đơn hàng mới nhất
 */
export function getRecentOrders(orders = [], limit = 6) {
  if (!Array.isArray(orders)) return []

  const sorted = [...orders].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return timeB - timeA
  })

  return sorted.slice(0, limit).map(order => {
    // Tóm tắt món
    let itemsSummary = ''
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsSummary = order.items
        .map(i => `${i.menuItemName || i.comboName || i.itemName || 'Món'} (x${i.quantity})`)
        .join(', ')
    } else {
      itemsSummary = 'Chưa có món'
    }

    return {
      ...order,
      itemsSummary,
      tableName: order.tableNumber ? `Bàn ${order.tableNumber}` : (order.table?.tableNumber ? `Bàn ${order.table.tableNumber}` : 'Mang về'),
    }
  })
}

/**
 * Lấy danh sách đặt bàn hôm nay
 */
export function getTodayReservations(reservations = [], limit = 5) {
  if (!Array.isArray(reservations)) return []

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

  const filtered = reservations.filter(r => {
    if (!r.reservationDate) return false
    return isSameDay(new Date(r.reservationDate), today)
  })

  // Sắp xếp theo giờ đặt tăng dần
  filtered.sort((a, b) => {
    const timeA = a.reservationTime || ''
    const timeB = b.reservationTime || ''
    return timeA.localeCompare(timeB)
  })

  return filtered.slice(0, limit)
}

