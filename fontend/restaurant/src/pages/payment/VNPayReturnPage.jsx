import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import './VNPayReturnPage.css'
import { verifyVNPayCallback } from '../../services/paymentService'

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)
}

function formatVNPayDate(str) {
  if (!str || str.length !== 14) return str || '-'
  const y = str.substring(0, 4)
  const m = str.substring(4, 6)
  const d = str.substring(6, 8)
  const h = str.substring(8, 10)
  const mi = str.substring(10, 12)
  const s = str.substring(12, 14)
  return `${h}:${mi}:${s} - ${d}/${m}/${y}`
}

function VNPayReturnPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function verify() {
      try {
        if (!location.search) {
          setErrorMsg('Không tìm thấy thông tin giao dịch.')
          setLoading(false)
          return
        }
        const data = await verifyVNPayCallback(location.search)
        setResult(data)
      } catch (err) {
        setErrorMsg(err.message || 'Lỗi kiểm tra trạng thái thanh toán')
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, [location.search])

  if (loading) {
    return (
      <div className="vnpay-return-container">
        <div className="vnpay-card">
          <div className="vnpay-loading">
            <div className="vnpay-spinner"></div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>Đang xác thực giao dịch với VNPay...</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '8px' }}>
              Vui lòng đợi giây lát, hệ thống đang cập nhật trạng thái đơn hàng.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isSuccess = result?.success === true

  return (
    <div className="vnpay-return-container">
      <div className="vnpay-card">
        {/* Header */}
        <div className={`vnpay-card-header ${isSuccess ? 'success' : 'failure'}`}>
          <div className="vnpay-status-icon">
            {isSuccess ? '✓' : '✕'}
          </div>
          <h2 className="vnpay-title">
            {isSuccess ? 'Thanh Toán Thành Công!' : 'Thanh Toán Không Thành Công'}
          </h2>
          <p className="vnpay-subtitle">
            {result?.message || errorMsg || 'Đã có lỗi xảy ra trong quá trình thanh toán.'}
          </p>
          <span className="vnpay-badge-sandbox">VNPay Sandbox Test</span>
        </div>

        {/* Amount Box */}
        {result?.amount > 0 && (
          <div className="vnpay-amount-box">
            <span className="vnpay-amount-label">Số tiền thanh toán:</span>
            <span className="vnpay-amount-val">{formatCurrency(result.amount)}</span>
          </div>
        )}

        {/* Details */}
        <div className="vnpay-details-list">
          {result?.orderId && (
            <div className="vnpay-detail-row">
              <span className="vnpay-detail-label">Mã đơn hàng:</span>
              <span className="vnpay-detail-value">#{result.orderId}</span>
            </div>
          )}

          {result?.transactionNo && (
            <div className="vnpay-detail-row">
              <span className="vnpay-detail-label">Mã giao dịch VNPay:</span>
              <span className="vnpay-detail-value">{result.transactionNo}</span>
            </div>
          )}

          {result?.bankCode && (
            <div className="vnpay-detail-row">
              <span className="vnpay-detail-label">Ngân hàng thanh toán:</span>
              <span className="vnpay-detail-value">{result.bankCode}</span>
            </div>
          )}

          {result?.payDate && (
            <div className="vnpay-detail-row">
              <span className="vnpay-detail-label">Thời gian giao dịch:</span>
              <span className="vnpay-detail-value">{formatVNPayDate(result.payDate)}</span>
            </div>
          )}

          {result?.txnRef && (
            <div className="vnpay-detail-row">
              <span className="vnpay-detail-label">Mã tham chiếu (TxnRef):</span>
              <span className="vnpay-detail-value" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {result.txnRef}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="vnpay-actions">
          <button
            type="button"
            className="vnpay-btn vnpay-btn-primary"
            onClick={() => navigate('/cashier', { state: { completedOrderId: result?.orderId } })}
          >
            💳 Về màn hình Thu ngân & In hóa đơn
          </button>
          <Link to="/menu" className="vnpay-btn vnpay-btn-secondary">
            📖 Về Thực đơn
          </Link>
        </div>
      </div>
    </div>
  )
}

export default VNPayReturnPage
