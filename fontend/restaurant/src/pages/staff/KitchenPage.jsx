import { useState, useEffect, useCallback } from 'react'
import '../../styles/pages/staff/KitchenPage.css'
import { getRole } from '../../utils/auth'
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderItemStatus,
} from '../../services/orderService'
import { getAllMenuItems, updateMenuItemStatus } from '../../services/menuItemService'
import { getImageFullUrl } from '../../services/apiClient'
import { subscribeWebSocket } from '../../services/websocketService'
import { playKitchenAlert } from '../../utils/soundNotification'

function getElapsedMinutes(dateString) {
  if (!dateString) return 0
  const created = new Date(dateString)
  const now = new Date()
  const diffMs = now - created
  return Math.max(0, Math.floor(diffMs / (1000 * 60)))
}

function KitchenPage() {
  // ── States ────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('kds') // 'kds' | 'stock'
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [stockSearch, setStockSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'))
  const [toast, setToast] = useState(null)

  const role = getRole()?.toUpperCase()
  const canAccessStaff   = ['ADMIN', 'MANAGER', 'WAITER', 'STAFF'].includes(role)
  const canAccessCashier = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // ── Clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Fetch Orders ──────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const data = await getAllOrders()
      const activeOrders = (data || []).filter(
        o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
      )
      setOrders(activeOrders)
    } catch (err) {
      console.error('KDS load orders error', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch Menu Items for Stock Out ────────────────────────────────
  const fetchMenuItems = useCallback(async () => {
    try {
      const data = await getAllMenuItems()
      setMenuItems(data || [])
    } catch (err) {
      console.error('KDS load menu error', err)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    fetchMenuItems()

    // Realtime WebSocket subscription for kitchen orders
    const unsubscribe = subscribeWebSocket('/topic/kitchen', (event) => {
      console.log('[KDS Realtime Event]:', event)
      if (event?.eventType === 'ORDER_CREATED' || event?.eventType === 'ITEM_ADDED') {
        playKitchenAlert()
        showToast(event.message || 'Có món mới cần nấu!')
      } else if (event?.message) {
        showToast(event.message)
      }

      fetchOrders()
    })

    const interval = setInterval(fetchOrders, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [fetchOrders, fetchMenuItems])

  // ── Handlers: Item Status Changes ─────────────────────────────────
  const handleItemStatusChange = async (orderId, itemId, newStatus) => {
    try {
      await updateOrderItemStatus(orderId, itemId, newStatus)
      showToast(`Đã chuyển món sang ${newStatus === 'COOKING' ? 'Đang nấu' : 'Đã hoàn thành'}`)

      if (newStatus === 'COOKING') {
        const order = orders.find(o => o.id === orderId)
        if (order && order.status === 'PENDING') {
          await updateOrderStatus(orderId, 'PREPARING')
        }
      }

      fetchOrders()
    } catch (err) {
      showToast('Lỗi cập nhật món: ' + (err.message || ''))
    }
  }

  const handleStartAllItems = async (order) => {
    try {
      const pendingItems = (order.items || []).filter(i => i.status === 'PENDING')
      for (const it of pendingItems) {
        await updateOrderItemStatus(order.id, it.id, 'COOKING')
      }
      await updateOrderStatus(order.id, 'PREPARING')
      showToast(`Bắt đầu nấu tất cả món bàn ${order.tableNumber}`)
      fetchOrders()
    } catch (err) {
      showToast('Lỗi thao tác: ' + (err.message || ''))
    }
  }

  const handleCompleteAllItems = async (order) => {
    try {
      const cookingItems = (order.items || []).filter(i => i.status !== 'SERVED' && i.status !== 'CANCELLED')
      for (const it of cookingItems) {
        await updateOrderItemStatus(order.id, it.id, 'SERVED')
      }
      await updateOrderStatus(order.id, 'SERVING')
      showToast(`Đã nấu xong toàn bộ món bàn ${order.tableNumber}`)
      fetchOrders()
    } catch (err) {
      showToast('Lỗi thao tác: ' + (err.message || ''))
    }
  }

  // ── Handlers: Toggle Stock Out ────────────────────────────────────
  const handleToggleStockStatus = async (item) => {
    const newStatus = item.status === 'OUT_OF_STOCK' ? 'ACTIVE' : 'OUT_OF_STOCK'
    try {
      await updateMenuItemStatus(item.id, newStatus)
      setMenuItems(prev =>
        prev.map(m => (m.id === item.id ? { ...m, status: newStatus } : m))
      )
      showToast(`Đã cập nhật trạng thái món: ${item.name}`)
    } catch (err) {
      showToast('Lỗi cập nhật trạng thái món: ' + (err.message || ''))
    }
  }

  // ── Stats Counting ────────────────────────────────────────────────
  let totalPendingItems = 0
  let totalCookingItems = 0
  let totalServedItems = 0

  orders.forEach(order => {
    (order.items || []).forEach(it => {
      if (it.status === 'PENDING') totalPendingItems += it.quantity
      if (it.status === 'COOKING') totalCookingItems += it.quantity
      if (it.status === 'SERVED') totalServedItems += it.quantity
    })
  })

  const filteredStockItems = menuItems.filter(m =>
    m.name?.toLowerCase().includes(stockSearch.toLowerCase())
  )

  return (
    <div className="kds-container">
      {/* 1. TOP BAR */}
      <header className="kds-topbar">
        <div className="kds-brand">
          <div className="kds-brand-text">
            <h1 className="kds-title">LOTUS KITCHEN</h1>
            <p className="kds-subtitle">Hệ thống điều phối Bếp & Pha chế</p>
          </div>
        </div>

        <div className="kds-topbar-center">
          <button
            className={`kds-nav-btn ${activeTab === 'kds' ? 'active' : ''}`}
            onClick={() => setActiveTab('kds')}
          >
            <span>Màn hình Bếp</span>
            <span className="kds-tab-counter">{orders.length}</span>
          </button>
          <button
            className={`kds-nav-btn ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <span>Báo hết món</span>
            <span className="kds-tab-counter warn">
              {menuItems.filter(m => m.status === 'OUT_OF_STOCK').length}
            </span>
          </button>
        </div>

        <div className="kds-topbar-right">
          <div className="kds-clock">{currentTime}</div>
          <button className="kds-refresh-btn" onClick={fetchOrders} title="Làm mới">
            Làm mới
          </button>
          <div className="kds-role-links">
            {canAccessStaff   && <a href="/staff"              className="kds-role-link">Phục vụ</a>}
            {canAccessStaff   && <a href="/staff/reservations" className="kds-role-link">Đặt bàn</a>}
            {canAccessCashier && <a href="/cashier"            className="kds-role-link">Thu ngân</a>}
            {canAccessAdmin   && <a href="/admin/orders"       className="kds-role-link">Quản trị</a>}
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="kds-content">
        {activeTab === 'kds' ? (
          <>
            {/* Metrics */}
            <div className="kds-metrics">
              <div className="kds-metric-box total">
                <span className="kds-metric-label">Đơn đang phục vụ</span>
                <span className="kds-metric-value">{orders.length}</span>
              </div>
              <div className="kds-metric-box pending">
                <span className="kds-metric-label">Món chờ nấu</span>
                <span className="kds-metric-value pending">{totalPendingItems}</span>
              </div>
              <div className="kds-metric-box cooking">
                <span className="kds-metric-label">Món đang nấu</span>
                <span className="kds-metric-value cooking">{totalCookingItems}</span>
              </div>
              <div className="kds-metric-box done">
                <span className="kds-metric-label">Đã lên món</span>
                <span className="kds-metric-value done">{totalServedItems}</span>
              </div>
            </div>

            {/* Orders Grid */}
            {loading ? (
              <div className="kds-loading">
                <div className="kds-spinner" />
                <p>Đang tải dữ liệu bếp...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="kds-empty">
                <div className="kds-empty-indicator" />
                <h2>Hiện không có món nào cần nấu</h2>
                <p>Các đơn hàng mới của nhân viên phục vụ sẽ hiển thị tại đây ngay lập tức.</p>
              </div>
            ) : (
              <div className="kds-grid">
                {orders.map(order => {
                  const elapsed = getElapsedMinutes(order.createdAt)
                  const isUrgent = elapsed >= 15

                  return (
                    <div
                      key={order.id}
                      className={`kds-card ${isUrgent ? 'urgent' : ''}`}
                    >
                      {/* Card Header */}
                      <div className="kds-card-header">
                        <div className="kds-card-header-left">
                          <span className="kds-table-title">BÀN {order.tableNumber || '?'}</span>
                          <span className="kds-order-num">#ORD-{order.id}</span>
                        </div>

                        <div className={`kds-timer-badge ${elapsed >= 20 ? 'danger' : elapsed >= 10 ? 'warning' : 'normal'}`}>
                          {elapsed} phút trước
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="kds-card-body">
                        {order.note && (
                          <div className="kds-order-note">
                            <span className="kds-note-title">Ghi chú:</span> {order.note}
                          </div>
                        )}

                        <div className="kds-items-list">
                          {(order.items || []).map(item => (
                            <div key={item.id} className={`kds-item-row ${item.status}`}>
                              <div className="kds-item-main">
                                <div className="kds-item-info">
                                  <span className="kds-item-qty">{item.quantity}x</span>
                                  <div className="kds-item-text">
                                    <span className="kds-item-name">{item.itemName}</span>
                                    {item.note && (
                                      <span className="kds-item-note">Ghi chú: {item.note}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Item Action Buttons */}
                              {item.status === 'PENDING' && (
                                <button
                                  className="kds-item-btn start"
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'COOKING')}
                                >
                                  Nấu món
                                </button>
                              )}

                              {item.status === 'COOKING' && (
                                <button
                                  className="kds-item-btn finish"
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'SERVED')}
                                >
                                  Hoàn thành
                                </button>
                              )}

                              {item.status === 'SERVED' && (
                                <div className="kds-item-btn done-badge">
                                  Đã lên món
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer: Batch Actions */}
                      <div className="kds-card-footer">
                        <button
                          className="kds-batch-btn start-all"
                          onClick={() => handleStartAllItems(order)}
                        >
                          Bắt đầu nấu tất cả
                        </button>
                        <button
                          className="kds-batch-btn complete-all"
                          onClick={() => handleCompleteAllItems(order)}
                        >
                          Hoàn thành tất cả
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* 3. STOCK OUT / BÁO HẾT MÓN TAB */
          <div className="kds-stock-container">
            <div className="kds-stock-toolbar">
              <input
                type="text"
                className="kds-stock-search"
                placeholder="Tìm kiếm món ăn để bật/tắt phục vụ..."
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
              />
              <span className="kds-stock-count">
                Tổng cộng {menuItems.length} món
              </span>
            </div>

            <div className="kds-stock-grid">
              {filteredStockItems.map(item => {
                const isOutOfStock = item.status === 'OUT_OF_STOCK'

                return (
                  <div key={item.id} className={`kds-stock-card ${isOutOfStock ? 'out' : ''}`}>
                    <div className="kds-stock-info">
                      {item.image ? (
                        <img
                          src={getImageFullUrl(item.image)}
                          alt={item.name}
                          className="kds-stock-thumb"
                        />
                      ) : (
                        <div className="kds-stock-thumb empty">
                          Món
                        </div>
                      )}
                      <div>
                        <div className="kds-stock-name">
                          {item.name}
                        </div>
                        <div className="kds-stock-cat">
                          {item.categoryName || 'Món ăn'}
                        </div>
                      </div>
                    </div>

                    <button
                      className={`kds-stock-toggle-btn ${isOutOfStock ? 'out' : 'active'}`}
                      onClick={() => handleToggleStockStatus(item)}
                    >
                      {isOutOfStock ? 'Hết hàng (Bấm để mở lại)' : 'Đang phục vụ (Bấm để báo hết)'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <div className="kds-toast">{toast}</div>}
    </div>
  )
}

export default KitchenPage
