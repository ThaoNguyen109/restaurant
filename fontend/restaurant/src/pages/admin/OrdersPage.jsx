import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import './OrdersPage.css'
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} from '../../services/orderService'
import { getImageFullUrl } from '../../services/apiClient'
import { getRole } from '../../utils/auth'

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã nhận đơn',
  PREPARING: 'Đang nấu',
  SERVING: 'Đang phục vụ',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
}

const ITEM_STATUS_LABELS = {
  PENDING: 'Chờ chế biến',
  COOKING: 'Đang nấu',
  SERVED: 'Đã lên món',
  CANCELLED: 'Đã hủy',
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function formatDateTime(isoString) {
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

function OrdersPage() {
  const role = getRole()?.toUpperCase()
  const canAccessStaff = !role || ['ADMIN', 'MANAGER', 'WAITER', 'STAFF'].includes(role)
  const canAccessKitchen = !role || ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'].includes(role)
  const canAccessCashier = !role || ['ADMIN', 'MANAGER', 'CASHIER'].includes(role)

  // ── States ────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    servingOrders: 0,
    completedOrdersToday: 0,
    revenueToday: 0,
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Toast
  const [toast, setToast] = useState(null)

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Data Fetching ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ordersData, statsData] = await Promise.all([
        getAllOrders({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          date: dateFilter || undefined,
          search: searchTerm || undefined,
        }),
        getOrderStats().catch(() => ({})),
      ])

      setOrders(ordersData || [])
      if (statsData) setStats(statsData)
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách đơn hàng', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFilter, searchTerm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Status Changes ───────────────────────────────────────────────
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus)
      showToast(`Đã chuyển đơn #${orderId} sang "${STATUS_LABELS[newStatus] || newStatus}"`)
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated)
      }
      getOrderStats().then(s => s && setStats(s)).catch(() => {})
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error')
    }
  }

  // ── Delete Order ──────────────────────────────────────────────────
  const handleDeleteOrderConfirm = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteOrder(deleteConfirmId)
      showToast('Đã xóa đơn hàng thành công')
      setOrders(prev => prev.filter(o => o.id !== deleteConfirmId))
      setDeleteConfirmId(null)
      if (selectedOrder && selectedOrder.id === deleteConfirmId) {
        setShowDetailModal(false)
        setSelectedOrder(null)
      }
      getOrderStats().then(s => s && setStats(s)).catch(() => {})
    } catch (err) {
      showToast(err.message || 'Xóa đơn hàng thất bại', 'error')
    }
  }

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      subtitle="Giám sát & Thống kê"
      actions={
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {canAccessStaff && (
            <a
              href="/staff"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#2a4736',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(42, 71, 54, 0.25)',
              }}
            >
              🍽️ Màn hình Phục vụ
            </a>
          )}
          {canAccessKitchen && (
            <a
              href="/kitchen"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#d97706',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
              }}
            >
              🍳 Màn hình Bếp
            </a>
          )}
          {canAccessCashier && (
            <a
              href="/cashier"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              }}
            >
              💰 Màn hình Thu ngân
            </a>
          )}
        </div>
      }
    >
      <div className="orders-page">
        {/* 1. STATS SUMMARY BAR */}
        <div className="ord-stats-bar">
          <div className="ord-stat-card">
            <div className="ord-stat-icon total">📋</div>
            <div className="ord-stat-info">
              <span className="ord-stat-label">Tổng đơn hôm nay</span>
              <span className="ord-stat-value">{stats.totalOrdersToday || 0}</span>
            </div>
          </div>

          <div className="ord-stat-card">
            <div className="ord-stat-icon pending">⏳</div>
            <div className="ord-stat-info">
              <span className="ord-stat-label">Chờ xác nhận</span>
              <span className="ord-stat-value">{stats.pendingOrders || 0}</span>
            </div>
          </div>

          <div className="ord-stat-card">
            <div className="ord-stat-icon cooking">🍳</div>
            <div className="ord-stat-info">
              <span className="ord-stat-label">Đang nấu / Phục vụ</span>
              <span className="ord-stat-value">{(stats.preparingOrders || 0) + (stats.servingOrders || 0)}</span>
            </div>
          </div>

          <div className="ord-stat-card">
            <div className="ord-stat-icon revenue">💰</div>
            <div className="ord-stat-info">
              <span className="ord-stat-label">Doanh thu hôm nay</span>
              <span className="ord-stat-value money">{formatCurrency(stats.revenueToday)}</span>
            </div>
          </div>
        </div>

        {/* 2. TOOLBAR & FILTERS */}
        <div className="ord-toolbar">
          <div className="ord-search-box">
            <span className="ord-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo mã đơn (#101), số bàn, ghi chú..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã nhận đơn</option>
            <option value="PREPARING">Đang nấu</option>
            <option value="SERVING">Đang phục vụ</option>
            <option value="COMPLETED">Hoàn tất / Đã thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            title="Lọc theo ngày"
          />

          {(searchTerm || statusFilter !== 'ALL' || dateFilter) && (
            <button
              className="ord-btn-clear"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setDateFilter('')
              }}
            >
              ✕ Xóa bộ lọc
            </button>
          )}

          <button className="ord-btn-refresh" onClick={fetchData} title="Làm mới">
            🔄 Làm mới
          </button>
        </div>

        {/* 3. ORDERS DATA TABLE */}
        <div className="ord-table-card">
          {loading ? (
            <div className="ord-loading">
              <div className="ord-spinner" />
              <p>Đang tải dữ liệu đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="ord-empty">
              <div className="empty-icon">🍽️</div>
              <p>Không có đơn hàng nào phù hợp với điều kiện tìm kiếm.</p>
            </div>
          ) : (
            <table className="ord-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Bàn</th>
                  <th>Món ăn</th>
                  <th>Tổng tiền</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const items = order.items || []
                  const statusKey = order.status ? order.status.toLowerCase() : 'pending'
                  return (
                    <tr key={order.id}>
                      {/* Mã đơn */}
                      <td>
                        <div className="ord-id-cell">
                          <span className="ord-code">#ORD-{order.id}</span>
                          {order.note && <span className="ord-time">📝 {order.note}</span>}
                        </div>
                      </td>

                      {/* Bàn */}
                      <td>
                        <span className="ord-table-badge">
                          Bàn {order.tableNumber || '?'}
                        </span>
                      </td>

                      {/* Món ăn preview */}
                      <td>
                        <div className="ord-items-preview">
                          {items.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="ord-item-chip">
                              <span className="ord-item-qty">{it.quantity}x</span>
                              <span>{it.itemName || it.menuItemName || it.comboName}</span>
                            </span>
                          ))}
                          {items.length > 2 && (
                            <span className="ord-more-items">
                              +{items.length - 2} món khác...
                            </span>
                          )}
                          {items.length === 0 && (
                            <span className="ord-more-items">Chưa chọn món</span>
                          )}
                        </div>
                      </td>

                      {/* Tổng tiền */}
                      <td>
                        <span className="ord-total-amount">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td>
                        <span className="ord-time">{formatDateTime(order.createdAt)}</span>
                      </td>

                      {/* Trạng thái */}
                      <td>
                        <span className={`ord-badge ${statusKey}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td>
                        <div className="ord-actions">
                          <button
                            className="ord-btn-icon view"
                            title="Xem chi tiết đơn hàng"
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowDetailModal(true)
                            }}
                          >
                            👁️
                          </button>
                          <button
                            className="ord-btn-icon print"
                            title="In hóa đơn tạm tính"
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowBillModal(true)
                            }}
                          >
                            🖨️
                          </button>
                          <button
                            className="ord-btn-icon delete"
                            title="Xóa đơn"
                            onClick={() => setDeleteConfirmId(order.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── MODAL: CHI TIẾT ĐƠN HÀNG (DÀNH CHO ADMIN XEM) ─────────── */}
        {showDetailModal && selectedOrder && (
          <div className="ord-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="ord-modal-box large" onClick={e => e.stopPropagation()}>
              <div className="ord-modal-header">
                <h2>
                  <span>Chi tiết đơn hàng #{selectedOrder.id}</span>
                  <span className="ord-table-badge">Bàn {selectedOrder.tableNumber}</span>
                </h2>
                <button className="ord-modal-close" onClick={() => setShowDetailModal(false)}>✕</button>
              </div>

              {/* Thông tin đầu trang */}
              <div className="ord-detail-top">
                <div className="ord-detail-field">
                  <span className="label">Thời gian tạo</span>
                  <span className="val">{formatDateTime(selectedOrder.createdAt)}</span>
                </div>
                <div className="ord-detail-field">
                  <span className="label">Tổng tiền</span>
                  <span className="val" style={{ color: '#b8860b', fontSize: '1.1rem' }}>
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
                <div className="ord-detail-field">
                  <span className="label">Trạng thái đơn</span>
                  <select
                    className="ord-status-select"
                    value={selectedOrder.status}
                    onChange={e => handleOrderStatusChange(selectedOrder.id, e.target.value)}
                  >
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã nhận đơn</option>
                    <option value="PREPARING">Đang nấu</option>
                    <option value="SERVING">Đang phục vụ</option>
                    <option value="COMPLETED">Hoàn tất / Đã thanh toán</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
                <div className="ord-detail-field">
                  <span className="label">Ghi chú đơn</span>
                  <span className="val">{selectedOrder.note || 'Không có'}</span>
                </div>
              </div>

              {/* Bảng danh sách món */}
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#1e3527' }}>
                  Danh sách món ăn ({selectedOrder.items?.length || 0})
                </h3>

                <table className="ord-detail-items-table">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th>Đơn giá</th>
                      <th style={{ textAlign: 'center' }}>Số lượng</th>
                      <th>Thành tiền</th>
                      <th>Trạng thái món</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.image ? (
                              <img src={getImageFullUrl(item.image)} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                            ) : (
                              <span>🍲</span>
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>{item.itemName}</div>
                              {item.note && <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>📝 {item.note}</div>}
                            </div>
                          </div>
                        </td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>
                          {item.quantity}
                        </td>
                        <td style={{ fontWeight: 700, color: '#b8860b' }}>
                          {formatCurrency(item.subtotal)}
                        </td>
                        <td>
                          <span className={`ord-item-status-chip ${item.status}`}>
                            {ITEM_STATUS_LABELS[item.status] || item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal footer */}
              <div className="res-modal-footer" style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="ord-btn-refresh"
                  onClick={() => setShowBillModal(true)}
                >
                  🖨️ Xem & In hóa đơn tạm tính
                </button>
                <button
                  type="button"
                  className="res-btn-cancel"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: IN & XEM HÓA ĐƠN TẠM TÍNH ──────────────────────── */}
        {showBillModal && selectedOrder && (
          <div className="ord-modal-overlay" onClick={() => setShowBillModal(false)}>
            <div className="ord-modal-box" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
              <div className="ord-modal-header">
                <h2>Hóa đơn thanh toán</h2>
                <button className="ord-modal-close" onClick={() => setShowBillModal(false)}>✕</button>
              </div>

              <div className="ord-bill-container" id="printable-bill">
                <div className="ord-bill-header">
                  <h3>LOTUS RESTAURANT</h3>
                  <p>Tinh hoa ẩm thực Việt</p>
                  <p>Đ/c: 123 Đường Hoa Sen, TP. Hồ Chí Minh</p>
                  <p>Hotline: 1900 6868</p>
                </div>

                <div className="ord-bill-meta">
                  <div>
                    <div><strong>Hóa đơn:</strong> #ORD-{selectedOrder.id}</div>
                    <div><strong>Bàn:</strong> {selectedOrder.tableNumber}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div><strong>Ngày:</strong> {formatDateTime(selectedOrder.createdAt)}</div>
                    <div><strong>Trạng thái:</strong> {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</div>
                  </div>
                </div>

                <table className="ord-bill-items">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th style={{ textAlign: 'center' }}>SL</th>
                      <th style={{ textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ textAlign: 'right' }}>T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || [])
                      .filter(i => i.status !== 'CANCELLED')
                      .map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.itemName}</td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div className="ord-bill-footer">
                  <div className="ord-bill-total-row">
                    <span>TỔNG CỘNG:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  <p style={{ margin: '8px 0 0', fontStyle: 'italic', fontSize: '0.8rem' }}>
                    Cảm ơn quý khách và hẹn gặp lại!
                  </p>
                </div>
              </div>

              <div className="res-modal-footer">
                <button
                  type="button"
                  className="res-btn-cancel"
                  onClick={() => setShowBillModal(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="res-btn-submit"
                  onClick={() => window.print()}
                >
                  🖨️ In ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: XÁC NHẬN XÓA ĐƠN HÀNG ─────────────────────────── */}
        {deleteConfirmId && (
          <div className="ord-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="res-confirm-box" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon">🗑️</div>
              <h3>Xác nhận xóa đơn hàng?</h3>
              <p>Đơn hàng #{deleteConfirmId} sẽ bị xóa vĩnh viễn khỏi hệ thống.</p>
              <div className="res-confirm-btns">
                <button
                  type="button"
                  className="res-btn-cancel"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="res-btn-danger"
                  onClick={handleDeleteOrderConfirm}
                >
                  Xóa đơn hàng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TOAST NOTIFICATION ───────────────────────────────────── */}
        {toast && (
          <div className={`ord-toast ${toast.type}`}>
            {toast.type === 'success' ? '✓ ' : '✕ '}
            {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default OrdersPage
