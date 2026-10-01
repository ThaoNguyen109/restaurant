import { useState, useEffect, useCallback } from 'react'
import './CashierPage.css'
import { getAllOrders, updateOrderStatus, getOrderStats } from '../../services/orderService'
import { getRole } from '../../utils/auth'

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

function CashierPage() {
  const role = getRole()?.toUpperCase()
  const canAccessStaff   = ['ADMIN', 'MANAGER', 'WAITER', 'STAFF'].includes(role)
  const canAccessKitchen = ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [stats, setStats] = useState({ completedOrdersToday: 0, revenueToday: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cashGiven, setCashGiven] = useState('')
  const [submittingCheckout, setSubmittingCheckout] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'))

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [allOrdersData, statsData] = await Promise.all([
        getAllOrders().catch(() => []),
        getOrderStats().catch(() => ({})),
      ])

      const activeUnpaid = (allOrdersData || []).filter(
        o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'
      )
      setOrders(activeUnpaid)
      if (statsData) setStats(statsData)

      if (selectedOrder) {
        const updatedSelected = activeUnpaid.find(o => o.id === selectedOrder.id)
        setSelectedOrder(updatedSelected || (activeUnpaid.length > 0 ? activeUnpaid[0] : null))
      } else if (activeUnpaid.length > 0) {
        setSelectedOrder(activeUnpaid[0])
      }
    } catch (err) {
      showToast('Lỗi tải dữ liệu: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const subtotal = selectedOrder ? (selectedOrder.totalAmount || 0) : 0
  const discountAmount = Math.round((subtotal * discountPercent) / 100)
  const finalTotal = Math.max(0, subtotal - discountAmount)
  const numCashGiven = Number(cashGiven) || 0
  const changeAmount = paymentMethod === 'CASH' ? Math.max(0, numCashGiven - finalTotal) : 0

  const handleCheckoutSubmit = async () => {
    if (!selectedOrder) return
    if (paymentMethod === 'CASH' && numCashGiven < finalTotal) {
      showToast('Số tiền khách đưa chưa đủ!')
      return
    }
    setSubmittingCheckout(true)
    try {
      await updateOrderStatus(selectedOrder.id, 'COMPLETED')
      showToast(`Thanh toán thành công đơn #${selectedOrder.id} - Bàn ${selectedOrder.tableNumber}!`)
      setShowBillModal(true)
      setCashGiven('')
      setDiscountPercent(0)
      fetchData()
    } catch (err) {
      showToast('Thanh toán thất bại: ' + (err.message || ''))
    } finally {
      setSubmittingCheckout(false)
    }
  }

  const filteredOrders = orders.filter(o => {
    const query = searchQuery.toLowerCase()
    return (
      o.id.toString().includes(query) ||
      (o.tableNumber?.toString() || '').includes(query) ||
      (o.note?.toLowerCase() || '').includes(query)
    )
  })

  return (
    <div className="cashier-container">
      {/* TOP BAR */}
      <header className="cashier-topbar">
        <div className="cashier-brand">
          <div className="cashier-brand-icon">💵</div>
          <div>
            <h1 className="cashier-title">QUẦY THU NGÂN</h1>
            <p className="cashier-subtitle">Thanh toán &amp; Xuất hóa đơn nhà hàng</p>
          </div>
        </div>

        <div className="cashier-topbar-center">
          <div className="cashier-shift-stat">
            <span>Đã thanh toán hôm nay:</span>
            <span className="val">{stats.completedOrdersToday || 0} đơn</span>
          </div>
          <div className="cashier-shift-stat">
            <span>Doanh thu hôm nay:</span>
            <span className="val gold">{formatCurrency(stats.revenueToday)}</span>
          </div>
        </div>

        <div className="cashier-topbar-right">
          <div className="cashier-clock">{currentTime}</div>
          <button className="cashier-link-btn" onClick={fetchData}>🔄 Làm mới</button>
          {canAccessStaff   && <a href="/staff"              className="cashier-link-btn">🍽️ Phục vụ</a>}
          {canAccessStaff   && <a href="/staff/reservations" className="cashier-link-btn">📅 Đặt bàn</a>}
          {canAccessKitchen && <a href="/kitchen"            className="cashier-link-btn">🍳 Bếp</a>}
          {canAccessAdmin   && <a href="/admin/orders"       className="cashier-link-btn">📊 Admin</a>}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="cashier-content">
        {/* CỘT TRÁI */}
        <div className="cashier-left-pane">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e3527' }}>
              Đơn chờ thanh toán ({orders.length})
            </h3>
          </div>

          <div className="cashier-search-box">
            <span className="cashier-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Tìm theo số bàn, mã đơn..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="cashier-orders-list">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Đang tải đơn hàng...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                Không có đơn hàng nào cần thanh toán.
              </div>
            ) : (
              filteredOrders.map(order => {
                const isSelected = selectedOrder && selectedOrder.id === order.id
                return (
                  <div
                    key={order.id}
                    className={`cashier-order-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => { setSelectedOrder(order); setCashGiven(''); setDiscountPercent(0) }}
                  >
                    <div className="cashier-order-card-top">
                      <div className="cashier-table-name">BÀN {order.tableNumber}</div>
                      <div className="cashier-order-code">#ORD-{order.id}</div>
                    </div>
                    <div className="cashier-order-card-bottom">
                      <div className="cashier-order-amount">{formatCurrency(order.totalAmount)}</div>
                      <span className={`cashier-status-pill ${order.status}`}>
                        {order.status === 'SERVING' ? 'Đang phục vụ'
                          : order.status === 'PREPARING' ? 'Đang nấu'
                          : 'Chờ xác nhận'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="cashier-right-pane">
          {selectedOrder ? (
            <>
              {/* BẢNG MÓN */}
              <div className="cashier-bill-details">
                <div className="cashier-bill-header">
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e3527' }}>
                      BÀN {selectedOrder.tableNumber} — Đơn #{selectedOrder.id}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Giờ vào: {formatDateTime(selectedOrder.createdAt)}
                    </span>
                  </div>
                  <button
                    className="cashier-print-btn"
                    style={{ width: 'auto', padding: '6px 14px' }}
                    onClick={() => setShowBillModal(true)}
                  >
                    🖨️ In phiếu tạm tính
                  </button>
                </div>

                <div className="cashier-items-table-wrapper">
                  <table className="cashier-items-table">
                    <thead>
                      <tr>
                        <th>Món ăn / Combo</th>
                        <th style={{ textAlign: 'center' }}>SL</th>
                        <th style={{ textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ textAlign: 'center' }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{item.itemName}</div>
                            {item.note && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📝 {item.note}</div>}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800 }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#b8860b' }}>
                            {formatCurrency(item.subtotal)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: item.status === 'SERVED' ? '#16a34a' : item.status === 'COOKING' ? '#d97706' : '#64748b'
                            }}>
                              {item.status === 'SERVED' ? '✅ Đã lên'
                                : item.status === 'COOKING' ? '🍳 Đang nấu'
                                : '⏳ Chờ nấu'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CỘT TÍNH TIỀN */}
              <div className="cashier-payment-column">
                <div className="cashier-calc-section">
                  <div className="cashier-calc-row">
                    <span>Tạm tính ({selectedOrder.items?.length || 0} món):</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="cashier-calc-row">
                    <span>Giảm giá (%):</span>
                    <select
                      value={discountPercent}
                      onChange={e => setDiscountPercent(Number(e.target.value))}
                      style={{ padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                      {[0, 5, 10, 15, 20, 25, 30].map(v => (
                        <option key={v} value={v}>{v}%</option>
                      ))}
                    </select>
                  </div>
                  {discountAmount > 0 && (
                    <div className="cashier-calc-row" style={{ color: '#ef4444' }}>
                      <span>Số tiền giảm:</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="cashier-calc-row final">
                    <span>CẦN THANH TOÁN:</span>
                    <span className="price">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                <div className="cashier-method-selector">
                  <span className="cashier-method-title">Hình thức thanh toán</span>
                  <div className="cashier-method-grid">
                    <button type="button"
                      className={`cashier-method-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('CASH')}>
                      💵 Tiền mặt
                    </button>
                    <button type="button"
                      className={`cashier-method-btn ${paymentMethod === 'QR' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('QR')}>
                      💳 Chuyển khoản QR
                    </button>
                  </div>
                </div>

                {paymentMethod === 'CASH' ? (
                  <div className="cashier-cash-input-group">
                    <label>Tiền khách đưa (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="Nhập số tiền..."
                      value={cashGiven}
                      onChange={e => setCashGiven(e.target.value)}
                    />
                    <div className="cashier-change-box">
                      <span>Tiền thừa trả khách:</span>
                      <span>{formatCurrency(changeAmount)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="cashier-qr-box">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BAN${selectedOrder.tableNumber}_${finalTotal}VND`}
                      alt="VietQR"
                      className="cashier-qr-img"
                    />
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      Quét QR — Số tiền: {formatCurrency(finalTotal)}
                    </span>
                  </div>
                )}

                <div className="cashier-actions">
                  <button
                    type="button"
                    className="cashier-checkout-btn"
                    disabled={submittingCheckout}
                    onClick={handleCheckoutSubmit}
                  >
                    {submittingCheckout ? 'Đang xử lý...' : '✅ THANH TOÁN & TRẢ BÀN'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '100px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '14px' }}>💵</div>
              <h3>Vui lòng chọn một đơn hàng bên trái để thực hiện thanh toán</h3>
            </div>
          )}
        </div>
      </main>

      {/* MODAL HÓA ĐƠN */}
      {showBillModal && selectedOrder && (
        <div className="cashier-modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="cashier-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e3527' }}>Phiếu hóa đơn</h3>
              <button
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}
                onClick={() => setShowBillModal(false)}
              >✕</button>
            </div>

            <div className="ord-bill-container">
              <div className="ord-bill-header">
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>LOTUS RESTAURANT</h3>
                <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>123 Đường Hoa Sen, TP. Hồ Chí Minh</p>
                <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>Hotline: 1900 6868</p>
              </div>
              <div className="ord-bill-meta">
                <div>
                  <div><strong>Hóa đơn:</strong> #ORD-{selectedOrder.id}</div>
                  <div><strong>Bàn:</strong> {selectedOrder.tableNumber}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Ngày:</strong> {formatDateTime(selectedOrder.createdAt)}</div>
                </div>
              </div>
              <table className="ord-bill-items">
                <thead>
                  <tr>
                    <th>Tên món</th>
                    <th style={{ textAlign: 'center' }}>SL</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.itemName}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ord-bill-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>Tạm tính:</span><span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', color: '#ef4444' }}>
                    <span>Giảm giá ({discountPercent}%):</span><span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="ord-bill-total-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #000' }}>
                  <span>TỔNG THANH TOÁN:</span><span>{formatCurrency(finalTotal)}</span>
                </div>
                {paymentMethod === 'CASH' && (
                  <div style={{ fontSize: '0.8rem', marginTop: '6px', color: '#475569' }}>
                    <div>Tiền khách đưa: {formatCurrency(numCashGiven)}</div>
                    <div>Tiền thừa: {formatCurrency(changeAmount)}</div>
                  </div>
                )}
                <p style={{ margin: '14px 0 0', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' }}>
                  Cảm ơn quý khách và hẹn gặp lại! 🙏
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="button" className="cashier-print-btn" style={{ flex: 1 }} onClick={() => setShowBillModal(false)}>
                Đóng
              </button>
              <button type="button" className="cashier-checkout-btn" style={{ flex: 1 }} onClick={() => window.print()}>
                🖨️ In ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="cashier-toast">✓ {toast}</div>}
    </div>
  )
}

export default CashierPage
