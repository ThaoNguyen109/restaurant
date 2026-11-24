import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/pages/admin/OrdersPage.css'
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  updateOrderItemStatus,
} from '../../services/orderService'
import { getImageFullUrl } from '../../services/apiClient'
import { getRole } from '../../utils/auth'

const STATUS_CONFIG = {
  ALL:       { label: 'Tất cả',           key: 'ALL',       cls: 'st-all'       },
  PENDING:   { label: 'Chờ xác nhận',     key: 'PENDING',   cls: 'st-pending'   },
  CONFIRMED: { label: 'Đã nhận đơn',      key: 'CONFIRMED', cls: 'st-confirmed' },
  PREPARING: { label: 'Đang nấu',         key: 'PREPARING', cls: 'st-preparing' },
  SERVING:   { label: 'Đang phục vụ',     key: 'SERVING',   cls: 'st-serving'   },
  COMPLETED: { label: 'Hoàn tất',         key: 'COMPLETED', cls: 'st-completed' },
  CANCELLED: { label: 'Đã hủy',           key: 'CANCELLED', cls: 'st-cancelled' },
}

const ORDER_STEPS = [
  { key: 'PENDING',   label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã nhận đơn' },
  { key: 'PREPARING', label: 'Đang nấu' },
  { key: 'SERVING',   label: 'Đang phục vụ' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
]

const ITEM_STATUS_CONFIG = {
  PENDING:   { label: 'Chờ nấu',     cls: 'it-pending'   },
  COOKING:   { label: 'Đang nấu',    cls: 'it-cooking'   },
  SERVED:    { label: 'Đã lên món',  cls: 'it-served'    },
  CANCELLED: { label: 'Đã hủy',      cls: 'it-cancelled' },
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

function formatTimeOnly(isoString) {
  if (!isoString) return '--:--'
  const d = new Date(isoString)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatDateOnly(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getTimeAgo(isoString) {
  if (!isoString) return ''
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  if (diffMins < 1) return 'Vừa tạo'
  if (diffMins < 60) return `${diffMins} phút trước`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  return `${Math.floor(diffHours / 24)} ngày trước`
}

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
}


export default function OrdersPage() {
  const role = getRole()?.toUpperCase()
  const canAccessStaff   = !role || ['ADMIN', 'MANAGER', 'WAITER', 'STAFF'].includes(role)
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

  // Filters & Views
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [startDate, setStartDate]       = useState('')
  const [endDate, setEndDate]           = useState('')
  const [searchTerm, setSearchTerm]     = useState('')
  const [currentPage, setCurrentPage]   = useState(1)
  const pageSize = 12

  // Modals & Drawers
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showBillModal, setShowBillModal]     = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [selectedOrder, setSelectedOrder]     = useState(null)
  const [updatingItemStatusId, setUpdatingItemStatusId] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

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
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: searchTerm ? searchTerm.trim() : undefined,
        }),
        getOrderStats().catch(() => ({})),
      ])

      setOrders(ordersData || [])
      if (statsData) setStats(statsData)
      setCurrentPage(1)
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách đơn hàng', 'error')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, startDate, endDate, searchTerm])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Status Changes ───────────────────────────────────────────────
  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus)
      showToast(`Đã chuyển đơn #${orderId} sang "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o))
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updated)
      }
      getOrderStats().then(s => s && setStats(s)).catch(() => {})
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error')
    }
  }

  // ── Quick Change Item Status in Order Detail ──────────────────────
  const handleItemStatusChange = async (orderId, itemId, newStatus) => {
    try {
      setUpdatingItemStatusId(itemId)
      await updateOrderItemStatus(orderId, itemId, newStatus)
      const freshOrder = await getOrderById(orderId)
      setSelectedOrder(freshOrder)
      setOrders(prev => prev.map(o => o.id === orderId ? freshOrder : o))
      showToast('Đã cập nhật trạng thái món ăn')
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật trạng thái món', 'error')
    } finally {
      setUpdatingItemStatusId(null)
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

  // ── Pagination Calculation ────────────────────────────────────────
  const totalPages = Math.ceil(orders.length / pageSize) || 1
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return orders.slice(start, start + pageSize)
  }, [orders, currentPage, pageSize])

  // ── Counts per status ─────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { ALL: orders.length }
    Object.keys(STATUS_CONFIG).forEach(k => {
      if (k !== 'ALL') counts[k] = orders.filter(o => o.status === k).length
    })
    return counts
  }, [orders])

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      subtitle="Giám sát luồng đặt món & điều phối vận hành hệ thống"
      actions={
        <div className="ord-topbar-actions">
          {canAccessStaff && (
            <a href="/staff" className="ord-quick-link">
              Phục vụ
            </a>
          )}
          {canAccessKitchen && (
            <a href="/kitchen" className="ord-quick-link">
              Bếp
            </a>
          )}
          {canAccessCashier && (
            <a href="/cashier" className="ord-quick-link">
              Thu ngân
            </a>
          )}
          <button
            type="button"
            className="ord-btn-refresh"
            onClick={fetchData}
            title="Tải lại dữ liệu"
          >
            Làm mới
          </button>
        </div>
      }
    >
      <div className="orders-page">
        {/* ── 1. METRIC CARDS (Giữ 3 thẻ: Tổng đơn, Đã hoàn tất, Doanh thu) ── */}
        <div className="ord-metrics-grid" style={{ marginBottom: 16 }}>
          <div
            className={`ord-metric-card${startDate === getTodayString() && endDate === getTodayString() && statusFilter === 'ALL' ? ' active' : ''}`}
            onClick={() => {
              if (startDate === getTodayString() && endDate === getTodayString() && statusFilter === 'ALL') {
                setStartDate('')
                setEndDate('')
              } else {
                setStartDate(getTodayString())
                setEndDate(getTodayString())
                setStatusFilter('ALL')
              }
            }}
            title="Bấm để lọc đơn hôm nay / xem tất cả"
          >
            <div className="ord-metric-head">
              <span className="ord-metric-label">Tổng đơn hôm nay</span>
              <span className="ord-metric-badge neutral">Hôm nay</span>
            </div>
            <div className="ord-metric-value">{stats.totalOrdersToday || 0}</div>
            <div className="ord-metric-sub">Tất cả đơn phát sinh trong ngày</div>
          </div>

          <div
            className={`ord-metric-card${startDate === getTodayString() && endDate === getTodayString() && statusFilter === 'COMPLETED' ? ' active' : ''}`}
            onClick={() => {
              if (startDate === getTodayString() && endDate === getTodayString() && statusFilter === 'COMPLETED') {
                setStartDate('')
                setEndDate('')
                setStatusFilter('ALL')
              } else {
                setStartDate(getTodayString())
                setEndDate(getTodayString())
                setStatusFilter('COMPLETED')
              }
            }}
            title="Bấm để lọc đơn đã hoàn tất hôm nay"
          >
            <div className="ord-metric-head">
              <span className="ord-metric-label">Đã hoàn tất hôm nay</span>
              <span className="ord-metric-badge success">Thành công</span>
            </div>
            <div className="ord-metric-value text-emerald">{stats.completedOrdersToday || 0}</div>
            <div className="ord-metric-sub">Đơn đã hoàn thành và thanh toán</div>
          </div>

          <div className="ord-metric-card revenue">
            <div className="ord-metric-head">
              <span className="ord-metric-label">Doanh thu hôm nay</span>
              <span className="ord-metric-badge dark">Doanh số</span>
            </div>
            <div className="ord-metric-value text-dark money">
              {formatCurrency(stats.revenueToday)}
            </div>
            <div className="ord-metric-sub">Doanh thu tạm tính từ các đơn hôm nay</div>
          </div>
        </div>

        {/* ── 2. STATUS TABS (Dạng Tab chuẩn thanh ngang) ───────── */}
        <div className="admin-underline-tabs">
          {Object.values(STATUS_CONFIG).map(st => {
            const count = statusCounts[st.key] || 0
            const isActive = statusFilter === st.key
            let badgeCls = ''
            if (st.key === 'PENDING' && count > 0) badgeCls = ' warning'
            else if (st.key === 'COMPLETED') badgeCls = ' success'
            else if (st.key === 'CANCELLED' && count > 0) badgeCls = ' danger'
            else if ((st.key === 'PREPARING' || st.key === 'SERVING') && count > 0) badgeCls = ' info'

            return (
              <button
                key={st.key}
                type="button"
                className={`admin-line-tab${isActive ? ' active' : ''}`}
                onClick={() => setStatusFilter(st.key)}
              >
                <span>{st.label}</span>
                <span className={`admin-tab-count${badgeCls}`}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── 3. SEARCH & DATE FILTER ROW (Thanh tìm kiếm dài & nổi bật + Từ ngày đến ngày) ── */}
        <div className="admin-toolbar" style={{ alignItems: 'center', marginBottom: 16 }}>
          {/* Thanh tìm kiếm NỔI BẬT & DÀI ở bên trái */}
          <div className="admin-search-bar" style={{ minWidth: 320, flex: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="admin-search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Tìm kiếm mã đơn (#101), số bàn, món ăn, ghi chú..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearchTerm('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cụm lọc ngày & xóa lọc bên phải */}
          <div className="admin-toolbar-right">
            {/* Cụm chọn Từ ngày đến ngày */}
            <div className="admin-date-range-group" style={{ height: 44, borderRadius: 12 }}>
              <div className="admin-date-field">
                <span className="admin-date-label">Từ:</span>
                <input
                  type="date"
                  className="admin-date-picker"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  title="Chọn ngày bắt đầu"
                />
              </div>
              <span className="admin-date-arrow">→</span>
              <div className="admin-date-field">
                <span className="admin-date-label">Đến:</span>
                <input
                  type="date"
                  className="admin-date-picker"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  title="Chọn ngày kết thúc"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  className="admin-date-clear-btn"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  title="Xóa lọc khoảng ngày"
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '2px 7px',
                    fontSize: '0.82rem',
                    lineHeight: 1,
                    borderRadius: 6,
                    fontWeight: 'bold',
                    marginLeft: 2
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Nút Xóa lọc tổng */}
            {(searchTerm || statusFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                className="admin-btn-reset"
                style={{ height: 44, borderRadius: 12 }}
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('ALL')
                  setStartDate('')
                  setEndDate('')
                }}
              >
                ✕ Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* ── 3. DATA VIEW: TABLE ─────────────────────────────────── */}
        {loading ? (
          <div className="ord-state-box">
            <div className="ord-spinner" />
            <div className="ord-state-title">Đang tải danh sách đơn hàng...</div>
            <div className="ord-state-desc">Vui lòng chờ trong giây lát</div>
          </div>
        ) : orders.length === 0 ? (
          <div className="ord-state-box">
            <div className="ord-state-title">Không tìm thấy đơn hàng nào</div>
            <div className="ord-state-desc">
              {searchTerm || statusFilter !== 'ALL' || startDate || endDate
                ? 'Không có đơn nào khớp với bộ lọc hiện tại. Thử chọn lại trạng thái hoặc xóa từ khóa tìm kiếm.'
                : 'Chưa có đơn hàng nào được ghi nhận trong hệ thống.'}
            </div>
            {(searchTerm || statusFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                className="ord-btn-secondary"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('ALL')
                  setStartDate('')
                  setEndDate('')
                }}
              >
                Xem tất cả đơn
              </button>
            )}
          </div>
        ) : (
          /* ── TABLE VIEW ───────────────────────────────────────── */
          <div className="ord-table-wrapper table-card" style={{ padding: '16px 20px', overflowX: 'auto' }}>
            <table className="ord-table data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Mã đơn &amp; Bàn</th>
                  <th style={{ width: '150px' }}>Thời gian</th>
                  <th>Danh sách món</th>
                  <th style={{ width: '130px' }}>Tổng tiền</th>
                  <th style={{ width: '150px' }}>Trạng thái</th>
                  <th style={{ width: '170px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => {
                  const items = order.items || []
                  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING
                  return (
                    <tr
                      key={order.id}
                      className="ord-row clickable-row"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowDetailModal(true)
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Bấm để xem chi tiết và cập nhật đơn hàng"
                    >
                      {/* Cột 1: Mã đơn & Bàn */}
                      <td>
                        <div className="ord-code-cell">
                          <span className="ord-code">#{order.id}</span>
                          <span className="ord-table-pill">
                            Bàn {order.tableNumber || 'Mang đi'}
                          </span>
                        </div>
                      </td>

                      {/* Cột 2: Thời gian */}
                      <td>
                        <div className="ord-time-cell">
                          <span className="ord-time-main">{formatTimeOnly(order.createdAt)}</span>
                          <span className="ord-time-sub">{formatDateOnly(order.createdAt)}</span>
                          <span className="ord-time-ago">{getTimeAgo(order.createdAt)}</span>
                        </div>
                      </td>

                      {/* Cột 3: Danh sách món preview */}
                      <td>
                        <div className="ord-items-cell">
                          <div className="ord-items-tags">
                            {items.slice(0, 3).map((it, idx) => (
                              <span key={idx} className="ord-item-pill">
                                <strong className="ord-item-qty">{it.quantity}×</strong>
                                <span className="ord-item-name">{it.itemName || it.menuItemName || it.comboName}</span>
                              </span>
                            ))}
                            {items.length > 3 && (
                              <span className="ord-item-more">+{items.length - 3} món khác</span>
                            )}
                            {items.length === 0 && (
                              <span className="ord-item-empty">Chưa chọn món</span>
                            )}
                          </div>
                          {order.note && (
                            <div className="ord-note-hint">
                              <span className="ord-note-tag">Ghi chú:</span> {order.note}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Tổng tiền */}
                      <td>
                        <div className="ord-price-cell">
                          <span className="ord-price-amount">{formatCurrency(order.totalAmount)}</span>
                          <span className="ord-item-count">{items.length} món</span>
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái & Quick change */}
                      <td>
                        <div className="ord-status-cell">
                          <span className={`ord-badge ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                          <select
                            className="ord-quick-status-select"
                            value={order.status}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleOrderStatusChange(order.id, e.target.value)}
                            title="Đổi nhanh trạng thái"
                          >
                            <option value="PENDING">Chờ xác nhận</option>
                            <option value="CONFIRMED">Đã nhận đơn</option>
                            <option value="PREPARING">Đang nấu</option>
                            <option value="SERVING">Đang phục vụ</option>
                            <option value="COMPLETED">Hoàn tất</option>
                            <option value="CANCELLED">Đã hủy</option>
                          </select>
                        </div>
                      </td>

                      {/* Cột 6: Thao tác (Đã bỏ nút Chi tiết, bấm hàng để xem/sửa) */}
                      <td>
                        <div className="ord-action-buttons">
                          <button
                            type="button"
                            className="ord-btn-action"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrder(order)
                              setShowBillModal(true)
                            }}
                            title="Xem & in hóa đơn"
                          >
                            In bill
                          </button>
                          <button
                            type="button"
                            className="ord-btn-action danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirmId(order.id)
                            }}
                            title="Xóa đơn"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 4. PAGINATION FOOTER ───────────────────────────────── */}
        {!loading && orders.length > 0 && (
          <div className="ord-pagination-bar">
            <div className="ord-pagination-info">
              Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, orders.length)}</strong> đến{' '}
              <strong>{Math.min(currentPage * pageSize, orders.length)}</strong> trên tổng số{' '}
              <strong>{orders.length}</strong> đơn hàng
            </div>
            {totalPages > 1 && (
              <div className="ord-pagination-controls">
                <button
                  type="button"
                  className="ord-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    className={`ord-page-btn${currentPage === page ? ' active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  className="ord-page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── 5. MODAL: CHI TIẾT ĐƠN HÀNG CHUYÊN SÂU ──────────────── */}
        {showDetailModal && selectedOrder && (
          <div className="ord-modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="ord-modal-dialog" onClick={e => e.stopPropagation()}>
              {/* Modal Head */}
              <div className="ord-modal-header">
                <div>
                  <div className="ord-modal-headline">
                    <h2>Đơn hàng #{selectedOrder.id}</h2>
                    <span className="ord-table-badge">Bàn {selectedOrder.tableNumber || 'Mang đi'}</span>
                  </div>
                  <div className="ord-modal-subline">
                    Tạo lúc {formatDateTime(selectedOrder.createdAt)} ({getTimeAgo(selectedOrder.createdAt)})
                  </div>
                </div>
                <button
                  type="button"
                  className="ord-modal-close"
                  onClick={() => setShowDetailModal(false)}
                >
                  ✕
                </button>
              </div>

              {/* Order Status Progress Stepper */}
              <div className="ord-stepper-container">
                <div className="ord-stepper-title">Tiến trình xử lý đơn hàng</div>
                <div className="ord-stepper">
                  {ORDER_STEPS.map((step, idx) => {
                    const currentIndex = ORDER_STEPS.findIndex(s => s.key === selectedOrder.status)
                    const isDone = currentIndex >= idx
                    const isCurrent = selectedOrder.status === step.key
                    const isCancelled = selectedOrder.status === 'CANCELLED'
                    return (
                      <div
                        key={step.key}
                        className={`ord-step-item${isDone && !isCancelled ? ' done' : ''}${isCurrent ? ' current' : ''}`}
                        onClick={() => handleOrderStatusChange(selectedOrder.id, step.key)}
                        title={`Bấm để chuyển sang: ${step.label}`}
                      >
                        <div className="ord-step-dot">{idx + 1}</div>
                        <div className="ord-step-label">{step.label}</div>
                      </div>
                    )
                  })}
                </div>
                {selectedOrder.status === 'CANCELLED' && (
                  <div className="ord-cancelled-banner">
                    Đơn hàng này hiện đang ở trạng thái <strong>ĐÃ HỦY</strong>.
                  </div>
                )}
              </div>

              {/* Order Summary Stats */}
              <div className="ord-summary-bar">
                <div className="ord-summary-box">
                  <span className="lbl">Tổng thanh toán</span>
                  <span className="val price">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
                <div className="ord-summary-box">
                  <span className="lbl">Số món trong đơn</span>
                  <span className="val">{selectedOrder.items?.length || 0} món</span>
                </div>
                <div className="ord-summary-box">
                  <span className="lbl">Trạng thái hiện tại</span>
                  <div className="ord-status-row">
                    <span className={`ord-badge ${STATUS_CONFIG[selectedOrder.status]?.cls || ''}`}>
                      {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                    <select
                      className="ord-quick-status-select"
                      value={selectedOrder.status}
                      onChange={e => handleOrderStatusChange(selectedOrder.id, e.target.value)}
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CONFIRMED">Đã nhận đơn</option>
                      <option value="PREPARING">Đang nấu</option>
                      <option value="SERVING">Đang phục vụ</option>
                      <option value="COMPLETED">Hoàn tất</option>
                      <option value="CANCELLED">Đã hủy</option>
                    </select>
                  </div>
                </div>
                <div className="ord-summary-box">
                  <span className="lbl">Ghi chú</span>
                  <span className="val">{selectedOrder.note || 'Không có'}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="ord-items-detail-section">
                <div className="ord-section-header">
                  <h3>Danh sách món ăn chi tiết ({selectedOrder.items?.length || 0})</h3>
                </div>
                <div className="ord-detail-table-wrap">
                  <table className="ord-detail-table">
                    <thead>
                      <tr>
                        <th>Món ăn</th>
                        <th style={{ width: '120px' }}>Đơn giá</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Số lượng</th>
                        <th style={{ width: '130px' }}>Thành tiền</th>
                        <th style={{ width: '150px' }}>Trạng thái món</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map(item => {
                        const itemCfg = ITEM_STATUS_CONFIG[item.status] || ITEM_STATUS_CONFIG.PENDING
                        const isUpdating = updatingItemStatusId === item.id
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="ord-item-info-cell">
                                {item.image ? (
                                  <img
                                    src={getImageFullUrl(item.image)}
                                    alt=""
                                    className="ord-item-thumb"
                                  />
                                ) : (
                                  <div className="ord-item-thumb-placeholder">Món</div>
                                )}
                                <div>
                                  <div className="ord-item-main-title">{item.itemName || item.menuItemName || item.comboName}</div>
                                  {item.note && (
                                    <div className="ord-item-custom-note">
                                      Ghi chú: {item.note}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>
                              {item.quantity}
                            </td>
                            <td style={{ fontWeight: 700, color: '#0f172a' }}>
                              {formatCurrency(item.subtotal)}
                            </td>
                            <td>
                              <div className="ord-item-status-wrapper">
                                <span className={`ord-item-badge ${itemCfg.cls}`}>
                                  {itemCfg.label}
                                </span>
                                <select
                                  className="ord-item-status-select"
                                  value={item.status}
                                  disabled={isUpdating}
                                  onChange={e => handleItemStatusChange(selectedOrder.id, item.id, e.target.value)}
                                  title="Đổi trạng thái món"
                                >
                                  <option value="PENDING">Chờ nấu</option>
                                  <option value="COOKING">Đang nấu</option>
                                  <option value="SERVED">Đã lên món</option>
                                  <option value="CANCELLED">Đã hủy</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="ord-modal-footer">
                <div className="ord-modal-footer-left">
                  <button
                    type="button"
                    className="ord-btn-danger-outline"
                    onClick={() => setDeleteConfirmId(selectedOrder.id)}
                  >
                    Xóa đơn hàng
                  </button>
                </div>
                <div className="ord-modal-footer-right">
                  <button
                    type="button"
                    className="ord-btn-secondary"
                    onClick={() => setShowBillModal(true)}
                  >
                    Xem hóa đơn in
                  </button>
                  <button
                    type="button"
                    className="ord-btn-primary"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. MODAL: IN HÓA ĐƠN THANH TOÁN (BILL) ──────────────── */}
        {showBillModal && selectedOrder && (
          <div className="ord-modal-overlay" onClick={() => setShowBillModal(false)}>
            <div className="ord-bill-dialog" onClick={e => e.stopPropagation()}>
              <div className="ord-modal-header">
                <h2>Hóa đơn tạm tính</h2>
                <button
                  type="button"
                  className="ord-modal-close"
                  onClick={() => setShowBillModal(false)}
                >
                  ✕
                </button>
              </div>

              <div className="ord-receipt-sheet" id="printable-bill">
                <div className="ord-receipt-header">
                  <div className="ord-receipt-brand">LOTUS RESTAURANT</div>
                  <div className="ord-receipt-slogan">Ẩm Thực Đương Đại &amp; Trải Nghiệm Thượng Hạng</div>
                  <div className="ord-receipt-contact">Đ/c: 123 Đường Hoa Sen, TP. Hồ Chí Minh</div>
                  <div className="ord-receipt-contact">Hotline: 1900 6868 · www.lotusrestaurant.vn</div>
                </div>

                <div className="ord-receipt-divider" />

                <div className="ord-receipt-meta">
                  <div className="ord-receipt-row">
                    <span>Mã hóa đơn:</span>
                    <strong>#ORD-{selectedOrder.id}</strong>
                  </div>
                  <div className="ord-receipt-row">
                    <span>Bàn phục vụ:</span>
                    <strong>Bàn {selectedOrder.tableNumber || 'Mang về'}</strong>
                  </div>
                  <div className="ord-receipt-row">
                    <span>Thời gian:</span>
                    <span>{formatDateTime(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="ord-receipt-row">
                    <span>Trạng thái:</span>
                    <span>{STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}</span>
                  </div>
                </div>

                <div className="ord-receipt-divider" />

                <table className="ord-receipt-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Tên món</th>
                      <th style={{ textAlign: 'center', width: '40px' }}>SL</th>
                      <th style={{ textAlign: 'right', width: '80px' }}>Đơn giá</th>
                      <th style={{ textAlign: 'right', width: '90px' }}>T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || [])
                      .filter(i => i.status !== 'CANCELLED')
                      .map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div>{item.itemName || item.menuItemName || item.comboName}</div>
                            {item.note && <div className="ord-receipt-item-note">({item.note})</div>}
                          </td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                <div className="ord-receipt-divider" />

                <div className="ord-receipt-totals">
                  <div className="ord-receipt-total-row final">
                    <span>TỔNG CỘNG:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>

                <div className="ord-receipt-footer">
                  <p>Xin cảm ơn quý khách và hẹn gặp lại!</p>
                  <p className="ord-receipt-timestamp">In lúc: {new Date().toLocaleTimeString('vi-VN')} {new Date().toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="ord-modal-footer">
                <button
                  type="button"
                  className="ord-btn-secondary"
                  onClick={() => setShowBillModal(false)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  className="ord-btn-primary"
                  onClick={() => window.print()}
                >
                  In hóa đơn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. MODAL: XÁC NHẬN XÓA ĐƠN HÀNG ─────────────────────── */}
        {deleteConfirmId && (
          <div className="ord-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="ord-dialog-confirm" onClick={e => e.stopPropagation()}>
              <div className="ord-dialog-warning-icon">!</div>
              <h3>Xác nhận xóa đơn hàng?</h3>
              <p>
                Đơn hàng <strong>#{deleteConfirmId}</strong> sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
                Hành động này không thể hoàn tác.
              </p>
              <div className="ord-dialog-actions">
                <button
                  type="button"
                  className="ord-btn-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="ord-btn-danger"
                  onClick={handleDeleteOrderConfirm}
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. TOAST NOTIFICATIONS ──────────────────────────────── */}
        {toast && (
          <div className={`ord-toast-item ${toast.type}`}>
            <span className="ord-toast-dot" />
            <span className="ord-toast-msg">{toast.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
