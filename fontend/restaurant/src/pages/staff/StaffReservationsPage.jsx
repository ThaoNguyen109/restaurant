import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import './StaffReservationsPage.css'
import {
  getAllReservations,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getTodayReservationCount,
} from '../../services/reservationService'
import { getActiveTables } from '../../services/tableService'
import { getRole, logout } from '../../utils/auth'
import { subscribeWebSocket, isWebSocketConnected } from '../../services/websocketService'
import { playReservationAlert } from '../../utils/soundNotification'
import { buildApiUrl } from '../../config/api'

// ────────────────────────────────────────────────────────────────
// Trạng thái cấu hình & nhãn hiển thị
// ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ duyệt',    cls: 'PENDING',   icon: '⏳' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'CONFIRMED', icon: '✅' },
  COMPLETED: { label: 'Đã đến / Xong',cls: 'COMPLETED', icon: '🎉' },
  CANCELLED: { label: 'Đã hủy',      cls: 'CANCELLED', icon: '❌' },
  NO_SHOW:   { label: 'Vắng mặt',    cls: 'NO_SHOW',   icon: '⚠️' },
}

const NOTE_SUGGESTIONS = [
  'Gần cửa sổ',
  'Ghế trẻ em',
  'Tiệc sinh nhật',
  'Yêu cầu phòng riêng',
  'Kỷ niệm ngày cưới',
  'Khách quen',
]

const TIME_PRESETS = [
  '11:00', '11:30', '12:00', '12:30', '13:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
]

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  try {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  } catch {
    return dateStr
  }
}

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  tableId: '',
  reservationDate: getTodayString(),
  reservationTime: '18:30',
  numberOfGuests: 4,
  note: '',
  status: 'CONFIRMED', // Mặc định đã xác nhận khi nhân viên tạo qua điện thoại
}

export default function StaffReservationsPage() {
  const role = getRole()?.toUpperCase()
  const canAccessStaff   = ['ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'RECEPTIONIST'].includes(role)
  const canAccessKitchen = ['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF'].includes(role)
  const canAccessCashier = ['ADMIN', 'MANAGER', 'CASHIER'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  // ── Realtime & Sound States ───────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('reservation_sound_enabled') !== 'false'
  })
  const [newBookingAlert, setNewBookingAlert] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)

  // Stable refs so WS callback always sees latest values without re-subscribing
  const soundEnabledRef = useRef(soundEnabled)
  const loadDataRef = useRef(null)

  // ── States ────────────────────────────────────────────────────────
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayCount, setTodayCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'))

  // Filter & Search
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateMode, setDateMode] = useState('ALL') // 'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'
  const [customDate, setCustomDate] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'

  // Modals
  const [showFormModal, setShowFormModal] = useState(false)
  const [editItem, setEditItem] = useState(null) // null = Create, object = Edit
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Delete Confirm Modal
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Detail Modal
  const [detailItem, setDetailItem] = useState(null)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Clock ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Load Data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (filterStatus) params.status = filterStatus

      if (dateMode === 'TODAY') {
        params.date = getTodayString()
      } else if (dateMode === 'TOMORROW') {
        params.date = getTomorrowString()
      } else if (dateMode === 'CUSTOM' && customDate) {
        params.date = customDate
      }

      const [resList, countData, tableList] = await Promise.all([
        getAllReservations(params),
        getTodayReservationCount().catch(() => ({ count: 0 })),
        getActiveTables().catch(() => []),
      ])

      setReservations(Array.isArray(resList) ? resList : [])
      setTodayCount(countData?.count || 0)
      setTables(Array.isArray(tableList) ? tableList : [])
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách đặt bàn', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, dateMode, customDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Keep refs up to date
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { loadDataRef.current = loadData }, [loadData])

  // ── WebSocket connection status indicator ─────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setWsConnected(isWebSocketConnected())
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  // ── Realtime WebSocket Listener for New Reservations ─────────────
  // NOTE: deps array is [] so we subscribe ONCE and never re-subscribe on filter/search changes.
  // We use refs to always access latest soundEnabled and loadData.
  useEffect(() => {
    const unsub = subscribeWebSocket('/topic/reservations', (event) => {
      console.log('[WS] Reservation event:', event?.eventType, event)
      if (event?.eventType === 'RESERVATION_CREATED') {
        const resData = event.data
        // Play sound (check ref for latest value)
        if (soundEnabledRef.current) {
          playReservationAlert()
        }
        setNewBookingAlert({
          id: resData?.id,
          customerName: resData?.customerName || 'Khách hàng',
          customerPhone: resData?.customerPhone || '',
          numberOfGuests: resData?.numberOfGuests || 2,
          reservationTime: resData?.reservationTime,
          reservationDate: resData?.reservationDate,
          tableNumber: resData?.tableNumber,
          note: resData?.note,
        })
        // Show toast
        setToast({
          message: `🔔 Khách ${resData?.customerName || ''} vừa đặt bàn (${resData?.numberOfGuests || 2} khách)!`,
          type: 'success',
        })
        setTimeout(() => setToast(null), 5000)
        // Reload list via ref
        if (loadDataRef.current) loadDataRef.current()
      } else if (['RESERVATION_STATUS_CHANGED', 'RESERVATION_UPDATED', 'RESERVATION_DELETED'].includes(event?.eventType)) {
        if (loadDataRef.current) loadDataRef.current()
      }
    })

    return () => {
      if (unsub) unsub()
    }
  }, []) // ← empty deps: subscribe once on mount

  // ── Sound Handlers ────────────────────────────────────────────────
  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('reservation_sound_enabled', String(next))
      if (next) {
        playReservationAlert()
        showToast('🔔 Đã bật chuông thông báo khi có khách đặt bàn', 'success')
      } else {
        showToast('🔕 Đã tắt chuông thông báo', 'warning')
      }
      return next
    })
  }

  const handleTestSound = async () => {
    // 1. Luôn phát chuông cục bộ ngay lập tức để kiểm tra loa
    playReservationAlert()
    showToast('🔔 Đang thử loa cục bộ & gửi lệnh test tới Server qua WebSocket...', 'success')

    // 2. Kích hoạt server broadcast event thật qua WebSocket để kiểm tra kết nối 2 chiều
    try {
      await fetch(buildApiUrl('/api/reservations/test-notify'), { method: 'POST' })
    } catch (e) {
      console.warn('Test server notify error:', e)
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      all: reservations.length,
      today: todayCount,
      pending: reservations.filter(r => r.status === 'PENDING').length,
      confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
      completed: reservations.filter(r => r.status === 'COMPLETED').length,
      cancelled: reservations.filter(r => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length,
    }
  }, [reservations, todayCount])

  // ── Form Handlers ─────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditItem(null)
    setFormData({
      ...EMPTY_FORM,
      reservationDate: getTodayString(),
      reservationTime: '18:30',
      status: 'CONFIRMED',
    })
    setFormErrors({})
    setShowFormModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditItem(item)
    setFormData({
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      customerEmail: item.customerEmail || '',
      tableId: item.tableId ? String(item.tableId) : '',
      reservationDate: item.reservationDate || getTodayString(),
      reservationTime: item.reservationTime ? item.reservationTime.substring(0, 5) : '18:30',
      numberOfGuests: item.numberOfGuests || 4,
      note: item.note || '',
      status: item.status || 'CONFIRMED',
    })
    setFormErrors({})
    setShowFormModal(true)
  }

  const handleCloseModal = () => {
    setShowFormModal(false)
    setEditItem(null)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.customerName.trim()) {
      errors.customerName = 'Vui lòng nhập tên khách hàng'
    }
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(\+84|0)[0-9]{8,10}$/.test(formData.customerPhone.trim())) {
      errors.customerPhone = 'Số điện thoại không hợp lệ (VD: 0912345678)'
    }
    if (formData.customerEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) {
        errors.customerEmail = 'Email không hợp lệ'
      }
    }
    if (!formData.reservationDate) {
      errors.reservationDate = 'Vui lòng chọn ngày đặt bàn'
    }
    if (!formData.reservationTime) {
      errors.reservationTime = 'Vui lòng chọn giờ đặt bàn'
    }
    if (!formData.numberOfGuests || Number(formData.numberOfGuests) < 1) {
      errors.numberOfGuests = 'Số khách tối thiểu là 1 người'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const payload = {
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      customerEmail: formData.customerEmail.trim() || null,
      tableId: formData.tableId ? Number(formData.tableId) : null,
      reservationDate: formData.reservationDate,
      reservationTime: formData.reservationTime,
      numberOfGuests: Number(formData.numberOfGuests),
      note: formData.note ? formData.note.trim() : null,
      status: formData.status || 'CONFIRMED',
    }

    try {
      setSubmitting(true)
      if (editItem) {
        await updateReservation(editItem.id, payload)
        showToast(`Đã cập nhật đặt bàn của ${payload.customerName}!`)
      } else {
        await createReservation(payload)
        showToast(`Đã tạo đơn đặt bàn cho khách ${payload.customerName} thành công!`)
      }
      handleCloseModal()
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu thông tin đặt bàn', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Quick Status Change ───────────────────────────────────────────
  const handleQuickStatusChange = async (id, newStatus, customerName) => {
    try {
      await updateReservationStatus(id, newStatus)
      const label = STATUS_CONFIG[newStatus]?.label || newStatus
      showToast(`Đã chuyển đặt bàn của ${customerName || ''} sang "${label}"`)
      loadData()
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error')
    }
  }

  // ── Delete Handler ────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setDeleting(true)
      await deleteReservation(deleteItem.id)
      showToast(`Đã xóa đặt bàn của ${deleteItem.customerName}`)
      setDeleteItem(null)
      loadData()
    } catch (err) {
      showToast(err.message || 'Xóa đặt bàn thất bại', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── Relative Time Helper ──────────────────────────────────────────
  const getRelativeTimeBadge = (resDate, resTime) => {
    const today = getTodayString()
    const tomorrow = getTomorrowString()

    if (resDate === today) {
      return <span className="staff-card-date-badge today">Hôm nay</span>
    } else if (resDate === tomorrow) {
      return <span className="staff-card-date-badge tomorrow">Ngày mai</span>
    } else {
      return <span className="staff-card-date-badge">{formatDateDisplay(resDate)}</span>
    }
  }

  return (
    <div className="staff-res-container">
      {/* ── 1. TOPBAR DÀNH CHO NHÂN VIÊN ───────────────────────────── */}
      <header className="staff-res-topbar">
        <div className="staff-res-brand">
          <div className="staff-res-brand-logo">📅</div>
          <div>
            <h1 className="staff-res-title">QUẢN LÝ ĐẶT BÀN</h1>
            <p className="staff-res-subtitle">Tiếp nhận cuộc gọi & Điều phối chỗ ngồi nhà hàng</p>
          </div>
        </div>

        <div className="staff-res-topbar-center">
          {canAccessStaff && (
            <a href="/staff" className="staff-res-nav-btn">
              🪑 Sơ đồ bàn (POS)
            </a>
          )}
          <button className="staff-res-nav-btn active">
            📅 Đặt bàn
          </button>
          {canAccessKitchen && (
            <a href="/kitchen" className="staff-res-nav-btn">
              🍳 Bếp (KDS)
            </a>
          )}
          {canAccessCashier && (
            <a href="/cashier" className="staff-res-nav-btn">
              💰 Thu ngân
            </a>
          )}
          {canAccessAdmin && (
            <a href="/admin/orders" className="staff-res-nav-btn">
              📊 Admin
            </a>
          )}
        </div>

        <div className="staff-res-topbar-right">
          <button
            type="button"
            className={`staff-res-sound-btn ${soundEnabled ? 'enabled' : 'disabled'}`}
            onClick={toggleSound}
            title={soundEnabled ? 'Đang bật chuông thông báo (Bấm để tắt)' : 'Đang tắt chuông thông báo (Bấm để bật)'}
          >
            <span>{soundEnabled ? '🔔' : '🔕'}</span>
            <span>{soundEnabled ? 'Chuông: BẬT' : 'Chuông: TẮT'}</span>
          </button>
          <button
            type="button"
            className="staff-res-nav-btn"
            onClick={handleTestSound}
            title="Thử âm thanh chuông thông báo"
          >
            🔊 Thử chuông
          </button>
          <div className="staff-res-clock">
            <span
              className={`ws-dot ${wsConnected ? 'ws-dot-on' : 'ws-dot-off'}`}
              title={wsConnected ? 'Realtime: Đang kết nối ✓' : 'Realtime: Mất kết nối – đang thử lại…'}
            />
            {currentTime}
          </div>
          <button
            className="staff-res-btn-primary"
            id="btn-staff-new-reservation"
            onClick={handleOpenCreate}
          >
            <span>📞</span>
            <span>+ Đặt bàn mới</span>
          </button>
          <button
            className="staff-res-nav-btn"
            onClick={loadData}
            title="Tải lại danh sách"
          >
            🔄
          </button>
          <button
            className="staff-res-nav-btn"
            onClick={() => logout('Đã đăng xuất thành công')}
            title="Đăng xuất"
          >
            🚪
          </button>
        </div>
      </header>

      {/* ── 2. NỘI DUNG CHÍNH ──────────────────────────────────────── */}
      <main className="staff-res-content">
        {/* REALTIME NEW RESERVATION ALERT BANNER */}
        {newBookingAlert && (
          <div className="staff-res-alert-banner">
            <div className="staff-alert-bell">🛎️</div>
            <div className="staff-alert-content">
              <h3 className="staff-alert-title">
                <span>CÓ KHÁCH VỪA ĐẶT BÀN MỚI!</span>
                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                  Vừa xong
                </span>
              </h3>
              <p className="staff-alert-desc">
                <strong>{newBookingAlert.customerName}</strong> ({newBookingAlert.customerPhone}) •{' '}
                <strong>{newBookingAlert.numberOfGuests} khách</strong> lúc{' '}
                <strong>{newBookingAlert.reservationTime?.substring(0, 5)}</strong> ngày{' '}
                <strong>{formatDateDisplay(newBookingAlert.reservationDate)}</strong>
                {newBookingAlert.tableNumber && ` • Bàn ${newBookingAlert.tableNumber}`}
                {newBookingAlert.note && ` — "${newBookingAlert.note}"`}
              </p>
            </div>
            <div className="staff-alert-actions">
              {newBookingAlert.id && (
                <button
                  type="button"
                  className="staff-alert-btn view"
                  onClick={() => {
                    handleQuickStatusChange(newBookingAlert.id, 'CONFIRMED', newBookingAlert.customerName)
                    setNewBookingAlert(null)
                  }}
                >
                  ✅ Xác nhận ngay
                </button>
              )}
              <button
                type="button"
                className="staff-alert-btn dismiss"
                onClick={() => setNewBookingAlert(null)}
              >
                ✕ Đóng
              </button>
            </div>
          </div>
        )}
        {/* STATS OVERVIEW */}
        <div className="staff-res-stats">
          <div
            className={`staff-stat-card ${dateMode === 'ALL' && !filterStatus ? 'active' : ''}`}
            onClick={() => { setDateMode('ALL'); setFilterStatus('') }}
          >
            <div className="staff-stat-icon total">📋</div>
            <div className="staff-stat-info">
              <span className="staff-stat-val">{stats.all}</span>
              <span className="staff-stat-lbl">Tất cả đặt bàn</span>
            </div>
          </div>

          <div
            className={`staff-stat-card ${dateMode === 'TODAY' ? 'active' : ''}`}
            onClick={() => { setDateMode('TODAY'); setFilterStatus('') }}
          >
            <div className="staff-stat-icon today">📅</div>
            <div className="staff-stat-info">
              <span className="staff-stat-val">{stats.today}</span>
              <span className="staff-stat-lbl">Hôm nay</span>
            </div>
          </div>

          <div
            className={`staff-stat-card ${filterStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING')}
          >
            <div className="staff-stat-icon pending">⏳</div>
            <div className="staff-stat-info">
              <span className="staff-stat-val">{stats.pending}</span>
              <span className="staff-stat-lbl">Chờ duyệt</span>
            </div>
          </div>

          <div
            className={`staff-stat-card ${filterStatus === 'CONFIRMED' ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'CONFIRMED' ? '' : 'CONFIRMED')}
          >
            <div className="staff-stat-icon confirmed">✅</div>
            <div className="staff-stat-info">
              <span className="staff-stat-val">{stats.confirmed}</span>
              <span className="staff-stat-lbl">Đã xác nhận</span>
            </div>
          </div>

          <div
            className={`staff-stat-card ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'COMPLETED' ? '' : 'COMPLETED')}
          >
            <div className="staff-stat-icon completed">🎉</div>
            <div className="staff-stat-info">
              <span className="staff-stat-val">{stats.completed}</span>
              <span className="staff-stat-lbl">Khách đã đến</span>
            </div>
          </div>

          <div
            className={`staff-stat-card ${filterStatus === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'CANCELLED' ? '' : 'CANCELLED')}
          >
            <div className="staff-stat-icon cancelled">❌</div>
            <div className="staff-stat-info">
              <span className="staff-stat-val">{stats.cancelled}</span>
              <span className="staff-stat-lbl">Đã hủy / vắng</span>
            </div>
          </div>
        </div>

        {/* TOOLBAR: SEARCH & FILTERS */}
        <div className="staff-res-toolbar">
          <div className="staff-res-toolbar-row1">
            <div className="staff-res-search-wrap">
              <span className="staff-res-search-icon">🔍</span>
              <input
                type="text"
                className="staff-res-search-input"
                placeholder="Tìm khách hàng theo tên, số điện thoại, ghi chú..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Bộ lọc ngày */}
            <div className="staff-res-date-filters">
              <button
                type="button"
                className={`staff-res-chip ${dateMode === 'ALL' ? 'active' : ''}`}
                onClick={() => setDateMode('ALL')}
              >
                Mọi ngày
              </button>
              <button
                type="button"
                className={`staff-res-chip ${dateMode === 'TODAY' ? 'active' : ''}`}
                onClick={() => setDateMode('TODAY')}
              >
                Hôm nay
              </button>
              <button
                type="button"
                className={`staff-res-chip ${dateMode === 'TOMORROW' ? 'active' : ''}`}
                onClick={() => setDateMode('TOMORROW')}
              >
                Ngày mai
              </button>
              <input
                type="date"
                className="staff-res-date-picker"
                value={dateMode === 'CUSTOM' ? customDate : ''}
                onChange={e => {
                  setDateMode('CUSTOM')
                  setCustomDate(e.target.value)
                }}
                title="Chọn ngày cụ thể"
              />
            </div>

            {/* Chuyển đổi hiển thị Thẻ / Bảng */}
            <div className="staff-res-view-toggle">
              <button
                type="button"
                className={`staff-view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Dạng thẻ trực quan"
              >
                🗂️ Thẻ
              </button>
              <button
                type="button"
                className={`staff-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Dạng bảng chi tiết"
              >
                📑 Bảng
              </button>
            </div>
          </div>

          <div className="staff-res-toolbar-row2">
            {/* Lọc trạng thái */}
            <div className="staff-status-pills">
              <button
                type="button"
                className={`staff-status-pill-btn ${!filterStatus ? 'active' : ''}`}
                onClick={() => setFilterStatus('')}
              >
                Tất cả
                <span className="pill-badge">{reservations.length}</span>
              </button>
              {Object.entries(STATUS_CONFIG).map(([stKey, stVal]) => {
                const count = reservations.filter(r => r.status === stKey).length
                return (
                  <button
                    key={stKey}
                    type="button"
                    className={`staff-status-pill-btn ${filterStatus === stKey ? 'active' : ''}`}
                    onClick={() => setFilterStatus(filterStatus === stKey ? '' : stKey)}
                  >
                    <span>{stVal.icon}</span>
                    <span>{stVal.label}</span>
                    <span className="pill-badge">{count}</span>
                  </button>
                )
              })}
            </div>

            {(search || filterStatus || dateMode !== 'ALL') && (
              <button
                type="button"
                className="staff-reset-btn"
                onClick={() => {
                  setSearch('')
                  setFilterStatus('')
                  setDateMode('ALL')
                  setCustomDate('')
                }}
              >
                ✕ Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── 3. DANH SÁCH ĐẶT BÀN ─────────────────────────────────── */}
        {loading ? (
          <div className="staff-empty-state">
            <div className="staff-empty-icon">⏳</div>
            <div className="staff-empty-title">Đang tải danh sách đặt bàn...</div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="staff-empty-state">
            <div className="staff-empty-icon">📭</div>
            <div className="staff-empty-title">Không tìm thấy đơn đặt bàn nào</div>
            <div className="staff-empty-sub">
              {search || filterStatus || dateMode !== 'ALL'
                ? 'Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Chưa có đơn đặt bàn nào trong hệ thống.'}
            </div>
            <button className="staff-res-btn-primary" onClick={handleOpenCreate} style={{ margin: '0 auto' }}>
              📞 Tiếp nhận đặt bàn mới ngay
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* ── VIEW 1: DẠNG THẺ (CARDS) ── */
          <div className="staff-cards-grid">
            {reservations.map(res => {
              const cfg = STATUS_CONFIG[res.status] || { label: res.status, cls: '', icon: '📌' }
              return (
                <div
                  key={res.id}
                  className={`staff-res-card ${res.status.toLowerCase()}`}
                >
                  {/* Card Header */}
                  <div className="staff-card-header">
                    <div className="staff-card-time-group">
                      <span className="staff-card-time">
                        {res.reservationTime ? res.reservationTime.substring(0, 5) : '--:--'}
                      </span>
                      {getRelativeTimeBadge(res.reservationDate, res.reservationTime)}
                    </div>
                    <span className={`staff-status-badge ${cfg.cls}`}>
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="staff-card-body">
                    <div className="staff-card-cust-name">{res.customerName}</div>

                    <div className="staff-card-meta-row">
                      <div className="staff-card-meta-item">
                        <span>📞</span>
                        <a href={`tel:${res.customerPhone}`} className="staff-phone-link">
                          {res.customerPhone}
                        </a>
                      </div>

                      <div className="staff-card-guests-pill">
                        <span>👥</span>
                        <span>{res.numberOfGuests} khách</span>
                      </div>

                      {res.tableNumber ? (
                        <div className="staff-card-table-pill">
                          <span>🪑</span>
                          <span>Bàn {res.tableNumber}</span>
                        </div>
                      ) : (
                        <div className="staff-card-table-pill unassigned">
                          <span>⚠️</span>
                          <span>Chưa xếp bàn</span>
                        </div>
                      )}
                    </div>

                    {res.customerEmail && (
                      <div className="staff-card-meta-item" style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        <span>✉️</span>
                        <span>{res.customerEmail}</span>
                      </div>
                    )}

                    {res.note && (
                      <div className="staff-card-note">
                        💬 "{res.note}"
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="staff-card-actions">
                    <div className="staff-quick-actions">
                      {res.status === 'PENDING' && (
                        <button
                          type="button"
                          className="staff-action-btn confirm"
                          onClick={() => handleQuickStatusChange(res.id, 'CONFIRMED', res.customerName)}
                        >
                          ✅ Xác nhận
                        </button>
                      )}

                      {res.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          className="staff-action-btn arrive"
                          onClick={() => handleQuickStatusChange(res.id, 'COMPLETED', res.customerName)}
                        >
                          🎉 Khách đến
                        </button>
                      )}

                      {['PENDING', 'CONFIRMED'].includes(res.status) && (
                        <button
                          type="button"
                          className="staff-action-btn cancel"
                          onClick={() => handleQuickStatusChange(res.id, 'CANCELLED', res.customerName)}
                        >
                          ❌ Hủy
                        </button>
                      )}

                      {res.status === 'CONFIRMED' && (
                        <button
                          type="button"
                          className="staff-action-btn"
                          style={{ color: '#78716c' }}
                          onClick={() => handleQuickStatusChange(res.id, 'NO_SHOW', res.customerName)}
                        >
                          ⚠️ Vắng
                        </button>
                      )}

                      <button
                        type="button"
                        className="staff-action-btn edit"
                        onClick={() => handleOpenEdit(res)}
                      >
                        ✏️ Sửa
                      </button>
                    </div>

                    <button
                      type="button"
                      className="staff-action-btn delete"
                      title="Xóa vĩnh viễn đơn đặt bàn này"
                      onClick={() => setDeleteItem(res)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* ── VIEW 2: DẠNG BẢNG (TABLE) ── */
          <div className="staff-table-wrap">
            <table className="staff-res-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Số khách</th>
                  <th>Bàn xếp</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => {
                  const cfg = STATUS_CONFIG[res.status] || { label: res.status, cls: '', icon: '' }
                  return (
                    <tr key={res.id}>
                      <td>
                        <strong style={{ fontSize: '0.98rem' }}>
                          {res.reservationTime ? res.reservationTime.substring(0, 5) : '--:--'}
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {formatDateDisplay(res.reservationDate)}
                        </div>
                      </td>
                      <td>
                        <strong>{res.customerName}</strong>
                        {res.customerEmail && (
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{res.customerEmail}</div>
                        )}
                      </td>
                      <td>
                        <a href={`tel:${res.customerPhone}`} className="staff-phone-link">
                          {res.customerPhone}
                        </a>
                      </td>
                      <td>
                        <span className="staff-card-guests-pill">👥 {res.numberOfGuests}</span>
                      </td>
                      <td>
                        {res.tableNumber ? (
                          <span className="staff-card-table-pill">🪑 Bàn {res.tableNumber}</span>
                        ) : (
                          <span className="staff-card-table-pill unassigned">⚠️ Chưa gán</span>
                        )}
                      </td>
                      <td>
                        <span className={`staff-status-badge ${cfg.cls}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>{res.note || '-'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {res.status === 'PENDING' && (
                            <button
                              type="button"
                              className="staff-action-btn confirm"
                              onClick={() => handleQuickStatusChange(res.id, 'CONFIRMED', res.customerName)}
                            >
                              ✅ Xác nhận
                            </button>
                          )}
                          {res.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              className="staff-action-btn arrive"
                              onClick={() => handleQuickStatusChange(res.id, 'COMPLETED', res.customerName)}
                            >
                              🎉 Đến
                            </button>
                          )}
                          <button
                            type="button"
                            className="staff-action-btn edit"
                            onClick={() => handleOpenEdit(res)}
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            type="button"
                            className="staff-action-btn delete"
                            onClick={() => setDeleteItem(res)}
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
          </div>
        )}
      </main>

      {/* ── 4. MODAL: TẠO / SỬA ĐẶT BÀN ───────────────────────────── */}
      {showFormModal && (
        <div className="staff-modal-backdrop" onClick={handleCloseModal}>
          <div className="staff-modal-box" onClick={e => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h2 className="staff-modal-title">
                {editItem ? '✏️ Cập nhật thông tin đặt bàn' : '📞 Tiếp nhận đặt bàn mới (Khách gọi điện / Trực tiếp)'}
              </h2>
              <button className="staff-modal-close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="staff-modal-body">
                <div className="staff-form-grid">
                  {/* Họ và tên khách hàng */}
                  <div className="staff-form-group full-width">
                    <label className="staff-form-label">
                      <span>Tên khách hàng <span className="staff-req-star">*</span></span>
                    </label>
                    <input
                      type="text"
                      className={`staff-form-input ${formErrors.customerName ? 'has-error' : ''}`}
                      placeholder="VD: Anh Nam, Chị Linh..."
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      autoFocus
                    />
                    {formErrors.customerName && (
                      <span className="staff-field-error">{formErrors.customerName}</span>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="staff-form-group">
                    <label className="staff-form-label">
                      <span>Số điện thoại <span className="staff-req-star">*</span></span>
                    </label>
                    <input
                      type="tel"
                      className={`staff-form-input ${formErrors.customerPhone ? 'has-error' : ''}`}
                      placeholder="VD: 0912345678"
                      value={formData.customerPhone}
                      onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    />
                    {formErrors.customerPhone && (
                      <span className="staff-field-error">{formErrors.customerPhone}</span>
                    )}
                  </div>

                  {/* Email khách (tuỳ chọn) */}
                  <div className="staff-form-group">
                    <label className="staff-form-label">
                      <span>Email khách hàng</span>
                      <span className="staff-opt-hint">(Không bắt buộc)</span>
                    </label>
                    <input
                      type="email"
                      className={`staff-form-input ${formErrors.customerEmail ? 'has-error' : ''}`}
                      placeholder="VD: khach@gmail.com"
                      value={formData.customerEmail}
                      onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    />
                    {formErrors.customerEmail && (
                      <span className="staff-field-error">{formErrors.customerEmail}</span>
                    )}
                  </div>

                  {/* Ngày đặt bàn */}
                  <div className="staff-form-group">
                    <label className="staff-form-label">
                      <span>Ngày đặt <span className="staff-req-star">*</span></span>
                    </label>
                    <input
                      type="date"
                      className="staff-form-input"
                      value={formData.reservationDate}
                      onChange={e => setFormData({ ...formData, reservationDate: e.target.value })}
                    />
                    <div className="staff-quick-pills-row">
                      <button
                        type="button"
                        className={`staff-mini-pill ${formData.reservationDate === getTodayString() ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, reservationDate: getTodayString() })}
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        className={`staff-mini-pill ${formData.reservationDate === getTomorrowString() ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, reservationDate: getTomorrowString() })}
                      >
                        Ngày mai
                      </button>
                    </div>
                  </div>

                  {/* Giờ hẹn */}
                  <div className="staff-form-group">
                    <label className="staff-form-label">
                      <span>Giờ hẹn <span className="staff-req-star">*</span></span>
                    </label>
                    <input
                      type="time"
                      className="staff-form-input"
                      value={formData.reservationTime}
                      onChange={e => setFormData({ ...formData, reservationTime: e.target.value })}
                    />
                    <div className="staff-quick-pills-row">
                      {['11:30', '12:00', '18:00', '18:30', '19:00', '19:30'].map(t => (
                        <button
                          key={t}
                          type="button"
                          className={`staff-mini-pill ${formData.reservationTime === t ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, reservationTime: t })}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Số lượng khách */}
                  <div className="staff-form-group">
                    <label className="staff-form-label">
                      <span>Số khách <span className="staff-req-star">*</span></span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="staff-mini-pill"
                        style={{ padding: '8px 14px', fontSize: '1rem' }}
                        onClick={() => setFormData({ ...formData, numberOfGuests: Math.max(1, Number(formData.numberOfGuests) - 1) })}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="staff-form-input"
                        style={{ textAlign: 'center', fontWeight: 'bold' }}
                        value={formData.numberOfGuests}
                        onChange={e => setFormData({ ...formData, numberOfGuests: Number(e.target.value) })}
                      />
                      <button
                        type="button"
                        className="staff-mini-pill"
                        style={{ padding: '8px 14px', fontSize: '1rem' }}
                        onClick={() => setFormData({ ...formData, numberOfGuests: Number(formData.numberOfGuests) + 1 })}
                      >
                        +
                      </button>
                    </div>
                    <div className="staff-quick-pills-row">
                      {[2, 4, 6, 8, 10, 12].map(num => (
                        <button
                          key={num}
                          type="button"
                          className={`staff-mini-pill ${Number(formData.numberOfGuests) === num ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, numberOfGuests: num })}
                        >
                          {num} người
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chọn bàn */}
                  <div className="staff-form-group">
                    <label className="staff-form-label">
                      <span>Gán bàn phục vụ</span>
                      <span className="staff-opt-hint">(Có thể gán sau)</span>
                    </label>
                    <select
                      className="staff-form-select"
                      value={formData.tableId}
                      onChange={e => setFormData({ ...formData, tableId: e.target.value })}
                    >
                      <option value="">-- Chưa xếp bàn cụ thể --</option>
                      {tables.map(t => (
                        <option key={t.id} value={t.id}>
                          Bàn {t.tableNumber} ({t.capacity} chỗ) {t.status === 'AVAILABLE' ? '• Trống' : `• (${t.status})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái đặt bàn */}
                  <div className="staff-form-group full-width">
                    <label className="staff-form-label">
                      <span>Trạng thái đơn</span>
                    </label>
                    <div className="staff-quick-pills-row">
                      <button
                        type="button"
                        className={`staff-mini-pill ${formData.status === 'CONFIRMED' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'CONFIRMED' })}
                      >
                        ✅ Đã xác nhận (Khuyên dùng khi nghe điện thoại)
                      </button>
                      <button
                        type="button"
                        className={`staff-mini-pill ${formData.status === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, status: 'PENDING' })}
                      >
                        ⏳ Chờ duyệt
                      </button>
                      {editItem && (
                        <>
                          <button
                            type="button"
                            className={`staff-mini-pill ${formData.status === 'COMPLETED' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, status: 'COMPLETED' })}
                          >
                            🎉 Khách đã đến
                          </button>
                          <button
                            type="button"
                            className={`staff-mini-pill ${formData.status === 'CANCELLED' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, status: 'CANCELLED' })}
                          >
                            ❌ Đã hủy
                          </button>
                          <button
                            type="button"
                            className={`staff-mini-pill ${formData.status === 'NO_SHOW' ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, status: 'NO_SHOW' })}
                          >
                            ⚠️ Vắng mặt
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ghi chú đặc biệt */}
                  <div className="staff-form-group full-width">
                    <label className="staff-form-label">
                      <span>Ghi chú của khách / Lưu ý phục vụ</span>
                    </label>
                    <textarea
                      rows="2"
                      className="staff-form-textarea"
                      placeholder="VD: Khách cần chuẩn bị ghế cho bé, ngồi gần cửa sổ..."
                      value={formData.note}
                      onChange={e => setFormData({ ...formData, note: e.target.value })}
                    />
                    <div className="staff-tag-cloud">
                      {NOTE_SUGGESTIONS.map(tag => (
                        <span
                          key={tag}
                          className="staff-tag-item"
                          onClick={() => {
                            const current = formData.note ? `${formData.note}, ${tag}` : tag
                            setFormData({ ...formData, note: current })
                          }}
                        >
                          + {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="staff-modal-footer">
                <button
                  type="button"
                  className="staff-btn-cancel"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="staff-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Đang lưu...' : editItem ? '💾 Cập nhật đặt bàn' : '📞 Lưu đơn đặt bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MODAL: XÁC NHẬN XÓA ─────────────────────────────────── */}
      {deleteItem && (
        <div className="staff-modal-backdrop" onClick={() => setDeleteItem(null)}>
          <div className="staff-modal-box" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h2 className="staff-modal-title" style={{ color: '#dc2626' }}>
                ⚠️ Xác nhận xóa đặt bàn
              </h2>
              <button className="staff-modal-close-btn" onClick={() => setDeleteItem(null)}>✕</button>
            </div>
            <div className="staff-modal-body">
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                Bạn có chắc chắn muốn xóa đơn đặt bàn của{' '}
                <strong>{deleteItem.customerName}</strong> lúc{' '}
                <strong>{deleteItem.reservationTime}</strong> ngày{' '}
                <strong>{formatDateDisplay(deleteItem.reservationDate)}</strong>?
              </p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>
                Nếu bàn đang được giữ trước, hệ thống sẽ tự động giải phóng bàn về trạng thái Trống. Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="staff-modal-footer">
              <button
                type="button"
                className="staff-btn-cancel"
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="staff-btn-submit"
                style={{ background: '#dc2626' }}
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : '🗑️ Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. FLOATING TOAST NOTIFICATION ─────────────────────────── */}
      {toast && (
        <div className={`staff-toast ${toast.type}`}>
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
