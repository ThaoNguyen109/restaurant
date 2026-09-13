import { useState, useEffect, useCallback } from 'react'
import './KitchenPage.css'
import { getRole } from '../../utils/auth'
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderItemStatus,
} from '../../services/orderService'
import { getAllMenuItems, updateMenuItemStatus } from '../../services/menuItemService'
import { getImageFullUrl } from '../../services/apiClient'

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
      // Lấy các đơn chưa hoàn tất/hủy
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
    // Auto refresh KDS every 10s
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [fetchOrders, fetchMenuItems])

  // ── Handlers: Item Status Changes ─────────────────────────────────
  const handleItemStatusChange = async (orderId, itemId, newStatus) => {
    try {
      await updateOrderItemStatus(orderId, itemId, newStatus)
      showToast(`Đã chuyển món sang ${newStatus === 'COOKING' ? 'ĐANG NẤU' : 'ĐÃ LÊN MÓN'}`)

      // If item becomes COOKING, also ensure order is PREPARING
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
      showToast(`Đã bắt đầu nấu tất cả món bàn ${order.tableNumber}`)
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
      showToast(`Đã ${newStatus === 'OUT_OF_STOCK' ? 'BÁO HẾT MÓN' : 'MỞ LẠI MÓN'}: ${item.name}`)
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
          <div className="kds-logo-icon">🍳</div>
          <div>
            <h1 className="kds-title">LOTUS KITCHEN (KDS)</h1>
            <p className="kds-subtitle">Hệ thống điều phối Bếp & Pha chế</p>
          </div>
        </div>

        <div className="kds-topbar-center">
          <button
            className={`kds-nav-btn ${activeTab === 'kds' ? 'active' : ''}`}
            onClick={() => setActiveTab('kds')}
          >
            📋 Màn hình Bếp ({orders.length} đơn)
          </button>
          <button
            className={`kds-nav-btn ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            🚫 Báo hết món ({menuItems.filter(m => m.status === 'OUT_OF_STOCK').length} món hết)
          </button>
        </div>

        <div className="kds-topbar-right">
          <div className="kds-clock">{currentTime}</div>
          <button className="kds-nav-btn" onClick={fetchOrders} title="Làm mới">
            🔄
          </button>
          {canAccessStaff   && <a href="/staff"   className="kds-role-link">🍽️ Phục vụ</a>}
          {canAccessCashier && <a href="/cashier" className="kds-role-link">💰 Thu ngân</a>}
          {canAccessAdmin   && <a href="/admin/orders" className="kds-role-link">📊 Admin</a>}
        </div>
      </header>

      {/* 2. MAIN CONTENT */}
      <main className="kds-content">
        {activeTab === 'kds' ? (
          <>
            {/* Metrics */}
            <div className="kds-metrics">
              <div className="kds-metric-box">
                <span className="kds-metric-label">Đơn đang hoạt động</span>
                <span className="kds-metric-value">{orders.length}</span>
              </div>
              <div className="kds-metric-box">
                <span className="kds-metric-label">Món chờ nấu</span>
                <span className="kds-metric-value pending">{totalPendingItems}</span>
              </div>
              <div className="kds-metric-box">
                <span className="kds-metric-label">Món đang nấu</span>
                <span className="kds-metric-value cooking">{totalCookingItems}</span>
              </div>
              <div className="kds-metric-box">
                <span className="kds-metric-label">Đã lên món</span>
                <span className="kds-metric-value done">{totalServedItems}</span>
              </div>
            </div>

            {/* Orders Grid */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                Đang tải dữ liệu bếp...
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>✨</div>
                <h2 style={{ color: '#cbd5e1', margin: 0 }}>Hiện không có món nào cần nấu</h2>
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
                        <div>
                          <div className="kds-table-title">
                            BÀN {order.tableNumber || '?'}
                          </div>
                          <div className="kds-order-num">#ORD-{order.id}</div>
                        </div>

                        <div className={`kds-timer-badge ${elapsed >= 20 ? 'danger' : elapsed >= 10 ? 'warning' : ''}`}>
                          ⏱️ {elapsed} phút trước
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="kds-card-body">
                        {order.note && (
                          <div className="kds-order-note">
                            📝 Đơn: {order.note}
                          </div>
                        )}

                        <div className="kds-items-list">
                          {(order.items || []).map(item => (
                            <div key={item.id} className={`kds-item-row ${item.status}`}>
                              <div className="kds-item-main">
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <span className="kds-item-qty">{item.quantity}x</span>
                                  <div>
                                    <span className="kds-item-name">{item.itemName}</span>
                                    {item.note && (
                                      <div>
                                        <span className="kds-item-note">📝 {item.note}</span>
                                      </div>
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
                                  🍳 Bắt đầu nấu
                                </button>
                              )}

                              {item.status === 'COOKING' && (
                                <button
                                  className="kds-item-btn finish"
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'SERVED')}
                                >
                                  ✅ Nấu xong / Lên món
                                </button>
                              )}

                              {item.status === 'SERVED' && (
                                <div className="kds-item-btn done-badge">
                                  ✓ Đã lên món
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer: Batch Actions */}
                      <div className="kds-card-footer">
                        <button
                          className="kds-batch-btn"
                          onClick={() => handleStartAllItems(order)}
                        >
                          🍳 Nấu tất cả
                        </button>
                        <button
                          className="kds-batch-btn complete-all"
                          onClick={() => handleCompleteAllItems(order)}
                        >
                          ✅ Xong toàn bộ
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
                placeholder="🔍 Tìm kiếm món ăn để bật/tắt hết hàng..."
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
              />
              <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                Tổng {menuItems.length} món
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
                        <div className="kds-stock-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                          🍲
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {item.categoryName || 'Món ăn'}
                        </div>
                      </div>
                    </div>

                    <button
                      className={`kds-stock-toggle-btn ${isOutOfStock ? 'out' : 'active'}`}
                      onClick={() => handleToggleStockStatus(item)}
                    >
                      {isOutOfStock ? '🔴 ĐANG HẾT HÀNG (Bấm mở lại)' : '🟢 ĐANG PHỤC VỤ (Bấm báo hết)'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <div className="kds-toast">⚡ {toast}</div>}
    </div>
  )
}

export default KitchenPage
