import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import './CashierPage.css'
import { getAllOrders, updateOrderStatus, getOrderStats, getOrderById } from '../../services/orderService'
import { getRole } from '../../utils/auth'
import { createVNPayUrl } from '../../services/paymentService'
import { subscribeWebSocket } from '../../services/websocketService'

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
  const location = useLocation()
  const role = getRole()?.toUpperCase()
  const canAccessStaff   = ['ADMIN', 'MANAGER', 'WAITER', 'STAFF'].includes(role)
  const canAccessKitchen = ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [completedOrder, setCompletedOrder] = useState(null)
  const completedOrderRef = useRef(null)
  completedOrderRef.current = completedOrder

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

      setSelectedOrder(prev => {
        // Nếu đã có đơn vừa thanh toán hoàn tất thì không tự động chuyển đơn
        if (completedOrderRef.current) return null
        if (prev) {
          const updated = activeUnpaid.find(o => o.id === prev.id)
          return updated || (activeUnpaid.length > 0 ? activeUnpaid[0] : null)
        }
        return activeUnpaid.length > 0 ? activeUnpaid[0] : null
      })
    } catch (err) {
      showToast('Lỗi tải dữ liệu: ' + (err.message || ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Tiếp nhận đơn hàng vừa hoàn tất khi chuyển hướng từ VNPay Return
  useEffect(() => {
    if (location.state?.completedOrderId) {
      const ordId = location.state.completedOrderId
      setVnpayUrl('')
      setVnpayLoading(false)
      getOrderById(ordId)
        .then(ord => {
          if (ord) {
            const completedData = {
              ...ord,
              status: 'COMPLETED',
              paymentMethod: 'VNPAY',
              finalTotal: ord.totalAmount,
              discountPercent: 0,
              discountAmount: 0,
              paidAt: new Date().toISOString()
            }
            completedOrderRef.current = completedData
            setCompletedOrder(completedData)
            setSelectedOrder(null)
            showToast(`Đã nhận thanh toán đơn #${ord.id} qua VNPay. Sẵn sàng in hóa đơn!`)
          }
        })
        .catch(console.error)
    }
  }, [location.state])

  // Lắng nghe cập nhật thanh toán và đơn hàng theo thời gian thực (WebSocket)
  useEffect(() => {
    const unsubscribe = subscribeWebSocket('/topic/orders', (event) => {
      console.log('[Cashier] Order event received:', event)
      const eventData = event?.data || event?.order

      if (event?.eventType === 'PAYMENT_SUCCESS') {
        showToast(event.message || 'Thanh toán VNPay thành công!')
        setVnpayUrl('')
        setVnpayLoading(false)
        if (eventData) {
          const completedData = {
            ...eventData,
            status: 'COMPLETED',
            paymentMethod: 'VNPAY',
            finalTotal: eventData.totalAmount,
            discountPercent: 0,
            discountAmount: 0,
            paidAt: new Date().toISOString()
          }
          completedOrderRef.current = completedData
          setCompletedOrder(completedData)
          setSelectedOrder(null)
        } else if (event?.orderId) {
          getOrderById(event.orderId).then(ord => {
            if (ord) {
              const completedData = {
                ...ord,
                status: 'COMPLETED',
                paymentMethod: 'VNPAY',
                finalTotal: ord.totalAmount,
                discountPercent: 0,
                discountAmount: 0,
                paidAt: new Date().toISOString()
              }
              completedOrderRef.current = completedData
              setCompletedOrder(completedData)
              setSelectedOrder(null)
            }
          }).catch(console.error)
        }
        fetchData()
      } else if (event?.eventType === 'ORDER_STATUS_CHANGED') {
        if (eventData?.status === 'COMPLETED') {
          if (selectedOrder && selectedOrder.id === eventData.id) {
            setVnpayUrl('')
            setVnpayLoading(false)
            const completedData = {
              ...selectedOrder,
              ...eventData,
              status: 'COMPLETED',
              paymentMethod: paymentMethod === 'VNPAY' ? 'VNPAY' : 'CASH',
              finalTotal: eventData.totalAmount || selectedOrder.totalAmount,
              paidAt: new Date().toISOString()
            }
            completedOrderRef.current = completedData
            setCompletedOrder(completedData)
            setSelectedOrder(null)
            showToast(`Đơn #${eventData.id} đã hoàn tất thanh toán!`)
          }
        }
        fetchData()
      }
    })
    return () => unsubscribe()
  }, [fetchData, selectedOrder, paymentMethod])

  const isOrderPaid = Boolean(completedOrder) || selectedOrder?.status === 'COMPLETED'
  const activeOrder = completedOrder || selectedOrder

  const effectiveDiscountPercent = isOrderPaid
    ? (activeOrder.discountPercent || 0)
    : discountPercent
  const subtotal = activeOrder ? (activeOrder.totalAmount || 0) : 0
  const discountAmount = isOrderPaid
    ? (activeOrder.discountAmount || Math.round((subtotal * effectiveDiscountPercent) / 100))
    : Math.round((subtotal * effectiveDiscountPercent) / 100)
  const finalTotal = isOrderPaid
    ? (activeOrder.finalTotal ?? Math.max(0, subtotal - discountAmount))
    : Math.max(0, subtotal - discountAmount)
  const numCashGiven = isOrderPaid
    ? (activeOrder.cashGiven || 0)
    : (Number(cashGiven) || 0)
  const changeAmount = isOrderPaid
    ? (activeOrder.changeAmount || 0)
    : (paymentMethod === 'CASH' ? Math.max(0, numCashGiven - finalTotal) : 0)
  const effectivePaymentMethod = isOrderPaid
    ? (activeOrder.paymentMethod || 'CASH')
    : paymentMethod

  const handleCheckoutSubmit = async () => {
    if (!selectedOrder) return
    if (paymentMethod === 'CASH' && numCashGiven < finalTotal) {
      showToast('Số tiền khách đưa chưa đủ!')
      return
    }
    setSubmittingCheckout(true)
    try {
      const updated = await updateOrderStatus(selectedOrder.id, 'COMPLETED')
      showToast(`Thanh toán thành công đơn #${selectedOrder.id} - Bàn ${selectedOrder.tableNumber}!`)
      setVnpayUrl('')
      setVnpayLoading(false)
      const completedData = {
        ...selectedOrder,
        ...(updated || {}),
        status: 'COMPLETED',
        paymentMethod: 'CASH',
        discountPercent,
        discountAmount,
        finalTotal,
        cashGiven: numCashGiven,
        changeAmount,
        paidAt: new Date().toISOString()
      }
      completedOrderRef.current = completedData
      setCompletedOrder(completedData)
      setSelectedOrder(null)
      setCashGiven('')
      setDiscountPercent(0)
      fetchData()
    } catch (err) {
      showToast('Thanh toán thất bại: ' + (err.message || ''))
    } finally {
      setSubmittingCheckout(false)
    }
  }

  const handlePrintReceipt = () => {
    setShowBillModal(true)
    setTimeout(() => {
      window.print()
    }, 250)
  }

  const handleClearCompletedAndNext = () => {
    completedOrderRef.current = null
    setCompletedOrder(null)
    setVnpayUrl('')
    setVnpayLoading(false)
    if (orders.length > 0) {
      setSelectedOrder(orders[0])
    } else {
      setSelectedOrder(null)
    }
    setCashGiven('')
    setDiscountPercent(0)
  }

  const [vnpayUrl, setVnpayUrl] = useState('')
  const [vnpayLoading, setVnpayLoading] = useState(false)
  const [vnpayError, setVnpayError] = useState('')

  // Tự động kiểm tra trạng thái đơn hàng định kỳ khi đang chờ khách quét VNPay
  useEffect(() => {
    if (isOrderPaid || paymentMethod !== 'VNPAY' || !selectedOrder || selectedOrder.status === 'COMPLETED') {
      return
    }
    const targetOrderId = selectedOrder.id
    const pollTimer = setInterval(async () => {
      try {
        const orderData = await getOrderById(targetOrderId)
        if (orderData && orderData.status === 'COMPLETED') {
          console.log('[Cashier] Order completed detected by polling:', orderData)
          setVnpayUrl('')
          setVnpayLoading(false)
          const completedData = {
            ...orderData,
            status: 'COMPLETED',
            paymentMethod: 'VNPAY',
            finalTotal: orderData.totalAmount,
            discountPercent: 0,
            discountAmount: 0,
            paidAt: new Date().toISOString()
          }
          completedOrderRef.current = completedData
          setCompletedOrder(completedData)
          setSelectedOrder(null)
          showToast(`Đơn #${targetOrderId} đã thanh toán thành công!`)
          fetchData()
        }
      } catch (err) {
        // ignore poll errors
      }
    }, 2000)

    return () => clearInterval(pollTimer)
  }, [paymentMethod, selectedOrder?.id, isOrderPaid, fetchData])

  // Tự động tải liên kết & QR VNPay khi chọn phương thức VNPay (Chỉ tải khi CHƯA thanh toán)
  useEffect(() => {
    if (!isOrderPaid && paymentMethod === 'VNPAY' && selectedOrder && selectedOrder.status !== 'COMPLETED' && finalTotal > 0) {
      let isMounted = true
      setVnpayLoading(true)
      setVnpayError('')
      createVNPayUrl({
        orderId: selectedOrder.id,
        amount: finalTotal,
        orderInfo: `Thanh toan don ${selectedOrder.id} - Ban ${selectedOrder.tableNumber}`
      })
        .then(res => {
          if (isMounted) {
            setVnpayUrl(res.paymentUrl || '')
            setVnpayLoading(false)
          }
        })
        .catch(err => {
          if (isMounted) {
            setVnpayError(err.message || 'Lỗi kết nối API VNPay. Vui lòng kiểm tra và Restart Spring Boot Backend.')
            setVnpayLoading(false)
          }
        })
      return () => { isMounted = false }
    } else {
      setVnpayUrl('')
      setVnpayLoading(false)
      setVnpayError('')
    }
  }, [isOrderPaid, paymentMethod, selectedOrder?.id, selectedOrder?.status, finalTotal])

  const handleVNPayCheckout = async (openNewTab = false) => {
    if (!selectedOrder) return
    const url = vnpayUrl
    if (url) {
      if (openNewTab) {
        window.open(url, '_blank')
        showToast('Đang mở cổng VNPay Sandbox ở tab mới...')
      } else {
        window.location.href = url
      }
      return
    }

    setSubmittingCheckout(true)
    try {
      const res = await createVNPayUrl({
        orderId: selectedOrder.id,
        amount: finalTotal,
        orderInfo: `Thanh toan don ${selectedOrder.id} - Ban ${selectedOrder.tableNumber}`
      })
      if (res.paymentUrl) {
        setVnpayUrl(res.paymentUrl)
        if (openNewTab) {
          window.open(res.paymentUrl, '_blank')
          showToast('Đang mở cổng VNPay Sandbox ở tab mới...')
        } else {
          window.location.href = res.paymentUrl
        }
      }
    } catch (err) {
      showToast('Lỗi kết nối VNPay: ' + (err.message || ''))
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
                const isSelected = !isOrderPaid && selectedOrder && selectedOrder.id === order.id
                return (
                  <div
                    key={order.id}
                    className={`cashier-order-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      completedOrderRef.current = null
                      setCompletedOrder(null)
                      setVnpayUrl('')
                      setVnpayLoading(false)
                      setSelectedOrder(order)
                      setCashGiven('')
                      setDiscountPercent(0)
                    }}
                  >
                    <div className="cashier-order-card-top">
                      <div className="cashier-table-name">BÀN {order.tableNumber}</div>
                      <div className="cashier-order-code">#ORD-{order.id}</div>
                    </div>
                    <div className="cashier-order-card-bottom">
                      <div className="cashier-order-amount">{formatCurrency(order.totalAmount)}</div>
                      <span className={`cashier-status-pill ${order.status === 'BILLING_REQUESTED' || order.note?.includes('[YÊU CẦU THANH TOÁN]') ? 'BILLING_REQUESTED' : order.status}`}>
                        {order.status === 'BILLING_REQUESTED' || order.note?.includes('[YÊU CẦU THANH TOÁN]') ? '🟣 Yêu cầu thanh toán'
                          : order.status === 'SERVING' ? 'Đang phục vụ'
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
          {activeOrder ? (
            <>
              {/* BẢNG MÓN */}
              <div className="cashier-bill-details">
                <div className="cashier-bill-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e3527' }}>
                        BÀN {activeOrder.tableNumber} — Đơn #{activeOrder.id}
                      </h2>
                      {isOrderPaid && (
                        <span className="cashier-status-pill COMPLETED" style={{ background: '#dcfce7', color: '#15803d' }}>
                          ✅ ĐÃ THANH TOÁN
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Giờ vào: {formatDateTime(activeOrder.createdAt)}
                      {activeOrder.paidAt && ` | Hoàn tất: ${formatDateTime(activeOrder.paidAt)}`}
                    </span>
                  </div>
                  {isOrderPaid ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="cashier-print-btn"
                        style={{ width: 'auto', padding: '6px 14px', background: '#16a34a', color: '#fff' }}
                        onClick={handlePrintReceipt}
                      >
                        🖨️ In hóa đơn
                      </button>
                      <button
                        className="cashier-link-btn"
                        style={{ width: 'auto', padding: '6px 14px' }}
                        onClick={handleClearCompletedAndNext}
                      >
                        ➡️ Đơn tiếp theo
                      </button>
                    </div>
                  ) : (
                    <button
                      className="cashier-print-btn"
                      style={{ width: 'auto', padding: '6px 14px' }}
                      onClick={() => setShowBillModal(true)}
                    >
                      🖨️ In phiếu tạm tính
                    </button>
                  )}
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
                      {(activeOrder.items || []).map(item => (
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
                              color: isOrderPaid || item.status === 'SERVED' ? '#16a34a' : item.status === 'COOKING' ? '#d97706' : '#64748b'
                            }}>
                              {isOrderPaid || item.status === 'SERVED' ? '✅ Hoàn tất'
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

              {/* CỘT PHẢI: HOẶC FORM THANH TOÁN, HOẶC THÔNG TIN HÓA ĐƠN ĐÃ THANH TOÁN */}
              {isOrderPaid ? (
                <div className="cashier-paid-summary-box">
                  <div className="cashier-paid-badge">
                    <div className="cashier-paid-icon">✓</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#166534' }}>Thanh toán thành công</h3>
                      <span style={{ fontSize: '0.78rem', color: '#15803d' }}>Bàn {activeOrder.tableNumber} đã được giải phóng</span>
                    </div>
                  </div>

                  <div className="cashier-calc-section">
                    <div className="cashier-calc-row">
                      <span>Mã hóa đơn:</span>
                      <strong>#ORD-{activeOrder.id}</strong>
                    </div>
                    <div className="cashier-calc-row">
                      <span>Hình thức:</span>
                      <span className="cashier-paid-method-tag">
                        {activeOrder.paymentMethod === 'VNPAY' ? '🏦 Cổng VNPay' : '💵 Tiền mặt'}
                      </span>
                    </div>
                    <div className="cashier-calc-row">
                      <span>Tạm tính ({activeOrder.items?.length || 0} món):</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="cashier-calc-row" style={{ color: '#ef4444' }}>
                        <span>Giảm giá ({effectiveDiscountPercent}%):</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="cashier-calc-row final">
                      <span>TỔNG ĐÃ THU:</span>
                      <span className="price" style={{ color: '#16a34a' }}>{formatCurrency(finalTotal)}</span>
                    </div>

                    {activeOrder.paymentMethod === 'CASH' && numCashGiven > 0 && (
                      <div className="cashier-cash-summary">
                        <div className="cashier-calc-row">
                          <span>Tiền khách đưa:</span>
                          <span>{formatCurrency(numCashGiven)}</span>
                        </div>
                        <div className="cashier-calc-row">
                          <span>Tiền thừa:</span>
                          <strong style={{ color: '#16a34a' }}>{formatCurrency(changeAmount)}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="cashier-paid-actions">
                    <button
                      type="button"
                      className="cashier-print-now-btn"
                      onClick={handlePrintReceipt}
                    >
                      🖨️ IN HÓA ĐƠN NGAY
                    </button>
                    <button
                      type="button"
                      className="cashier-preview-btn"
                      onClick={() => setShowBillModal(true)}
                    >
                      👁️ Xem mẫu hóa đơn
                    </button>
                    <button
                      type="button"
                      className="cashier-next-order-btn"
                      onClick={handleClearCompletedAndNext}
                    >
                      ➡️ Tiếp tục thu ngân
                    </button>
                  </div>
                </div>
              ) : (
                <div className="cashier-payment-column">
                  <div className="cashier-calc-section">
                    <div className="cashier-calc-row">
                      <span>Tạm tính ({selectedOrder?.items?.length || 0} món):</span>
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
                        <span>💵</span>
                        <span>Tiền mặt</span>
                      </button>
                      <button type="button"
                        className={`cashier-method-btn ${paymentMethod === 'VNPAY' ? 'active vnpay-btn-active' : ''}`}
                        onClick={() => setPaymentMethod('VNPAY')}>
                        <span>🏦</span>
                        <span>VNPay</span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'CASH' && (
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
                  )}

                  {paymentMethod === 'VNPAY' && (
                    <div className="cashier-vnpay-box">
                      <div className="cashier-vnpay-header">
                        <strong style={{ fontSize: '0.88rem', color: '#0369a1' }}>🏦 Cổng VNPay Sandbox</strong>
                        <span className="cashier-vnpay-badge">Mã QR & Thẻ ảo</span>
                      </div>

                      {vnpayError ? (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '10px', fontSize: '0.78rem', color: '#b91c1c' }}>
                          <strong>⚠️ {vnpayError}</strong>
                          <div style={{ marginTop: '4px', color: '#7f1d1d' }}>
                            Nếu bạn vừa cập nhật code, hãy <strong>Restart/Chạy lại Spring Boot</strong> trong IDE để nạp API VNPay mới.
                          </div>
                        </div>
                      ) : vnpayLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#0284c7', fontSize: '0.85rem' }}>
                          ⏳ Đang tạo mã QR VNPay Sandbox...
                        </div>
                      ) : vnpayUrl ? (
                        <div style={{ textAlign: 'center', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(vnpayUrl)}`}
                            alt="VNPay QR"
                            className="cashier-qr-img"
                          />
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0369a1' }}>
                            📱 Quét mã bằng Camera điện thoại để mở VNPay
                          </div>
                        </div>
                      ) : null}

                      <div className="cashier-vnpay-card-info">
                        <div className="cashier-vnpay-card-row">
                          <span>Ngân hàng test:</span>
                          <strong>NCB (Quốc Dân)</strong>
                        </div>
                        <div className="cashier-vnpay-card-row">
                          <span>Số thẻ test:</span>
                          <div>
                            <strong>9704198526191432198</strong>
                            <button
                              type="button"
                              className="cashier-copy-btn"
                              style={{ marginLeft: '6px' }}
                              onClick={() => {
                                navigator.clipboard.writeText('9704198526191432198')
                                showToast('Đã copy số thẻ test!')
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="cashier-vnpay-card-row">
                          <span>Tên chủ thẻ / Ngày:</span>
                          <strong>NGUYEN VAN A (07/15)</strong>
                        </div>
                        <div className="cashier-vnpay-card-row">
                          <span>Mã OTP test:</span>
                          <strong>123456</strong>
                        </div>
                      </div>

                      <div className="cashier-vnpay-btn-group">
                        <button
                          type="button"
                          className="cashier-vnpay-open-btn"
                          disabled={submittingCheckout || vnpayLoading}
                          onClick={() => handleVNPayCheckout(false)}
                        >
                          {submittingCheckout ? 'Đang kết nối...' : `🚀 Mở VNPay (Máy tính)`}
                        </button>
                        <button
                          type="button"
                          className="cashier-vnpay-tab-btn"
                          disabled={submittingCheckout || vnpayLoading}
                          title="Mở sang tab mới để khách quét/nhập thẻ, tab thu ngân vẫn giữ nguyên"
                          onClick={() => handleVNPayCheckout(true)}
                        >
                          🔗 Tab mới
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod !== 'VNPAY' && (
                    <div className="cashier-actions">
                      <button
                        type="button"
                        className="cashier-checkout-btn"
                        disabled={submittingCheckout}
                        onClick={handleCheckoutSubmit}
                      >
                        {submittingCheckout ? 'Đang xử lý...' : '✅ XÁC NHẬN THANH TOÁN & TRẢ BÀN'}
                      </button>
                    </div>
                  )}
                </div>
              )}
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
      {showBillModal && activeOrder && (
        <div className="cashier-modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="cashier-modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e3527' }}>
                {isOrderPaid ? 'Hóa đơn thanh toán' : 'Phiếu tạm tính'}
              </h3>
              <button
                style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer' }}
                onClick={() => setShowBillModal(false)}
              >✕</button>
            </div>

            <div className="ord-bill-container" id="printable-bill">
              <div className="ord-bill-header">
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>LOTUS RESTAURANT</h3>
                <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>123 Đường Hoa Sen, TP. Hồ Chí Minh</p>
                <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>Hotline: 1900 6868</p>
              </div>
              <div className="ord-bill-meta">
                <div>
                  <div><strong>Hóa đơn:</strong> #ORD-{activeOrder.id}</div>
                  <div><strong>Bàn:</strong> {activeOrder.tableNumber}</div>
                  {isOrderPaid && (
                    <div><strong>Hình thức:</strong> {effectivePaymentMethod === 'VNPAY' ? 'VNPay' : 'Tiền mặt'}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Ngày vào:</strong> {formatDateTime(activeOrder.createdAt)}</div>
                  {activeOrder.paidAt && (
                    <div><strong>Thanh toán:</strong> {formatDateTime(activeOrder.paidAt)}</div>
                  )}
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
                  {(activeOrder.items || []).map((it, idx) => (
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
                    <span>Giảm giá ({effectiveDiscountPercent}%):</span><span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="ord-bill-total-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #000' }}>
                  <span>TỔNG THANH TOÁN:</span><span>{formatCurrency(finalTotal)}</span>
                </div>
                {effectivePaymentMethod === 'CASH' && numCashGiven > 0 && (
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
