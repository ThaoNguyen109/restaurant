import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import '../../styles/pages/staff/StaffReservationsPage.css'
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
const STATUS_CONFIG = {
  PENDING:   { label: 'Chờ duyệt',    cls: 'st-pending'   },
  CONFIRMED: { label: 'Đã xác nhận',  cls: 'st-confirmed' },
  COMPLETED: { label: 'Đã đến',       cls: 'st-completed' },
  CANCELLED: { label: 'Đã hủy',       cls: 'st-cancelled' },
  NO_SHOW:   { label: 'Vắng mặt',     cls: 'st-noshow'    },
}

const NOTE_SUGGESTIONS = [
  'Gần cửa sổ', 'Ghế trẻ em', 'Tiệc sinh nhật',
  'Phòng riêng', 'Kỷ niệm ngày cưới', 'Khách quen',
]

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
}

function getTomorrowString() {
  const d = new Date(); d.setDate(d.getDate()+1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDate(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

const EMPTY_FORM = {
  customerName: '', customerPhone: '', customerEmail: '',
  tableId: '',
  reservationDate: getTodayString(),
  reservationTime: '18:30',
  numberOfGuests: 4,
  note: '', status: 'CONFIRMED',
}

export default function StaffReservationsPage() {
  const role = getRole()?.toUpperCase()
  const canAccessStaff   = ['ADMIN','MANAGER','WAITER','STAFF','RECEPTIONIST'].includes(role)
  const canAccessKitchen = ['ADMIN','MANAGER','KITCHEN','CHEF'].includes(role)
  const canAccessCashier = ['ADMIN','MANAGER','CASHIER'].includes(role)
  const canAccessAdmin   = ['ADMIN'].includes(role)

  // ── Realtime ───────────────────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(() =>
    localStorage.getItem('reservation_sound_enabled') !== 'false'
  )
  const [newBookingAlert, setNewBookingAlert] = useState(null)
  const [wsConnected, setWsConnected]         = useState(false)
  const soundEnabledRef = useRef(soundEnabled)
  const loadDataRef     = useRef(null)

  // ── States ─────────────────────────────────────────────────────
  const [reservations, setReservations] = useState([])
  const [tables, setTables]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [todayCount, setTodayCount]     = useState(0)
  const [currentTime, setCurrentTime]   = useState(new Date().toLocaleTimeString('vi-VN'))

  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [dateMode, setDateMode]       = useState('ALL')
  const [customDate, setCustomDate]   = useState('')
  const [viewMode, setViewMode]       = useState('cards')

  const [showFormModal, setShowFormModal] = useState(false)
  const [editItem, setEditItem]           = useState(null)
  const [formData, setFormData]           = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]       = useState({})
  const [submitting, setSubmitting]       = useState(false)

  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [toast, setToast]           = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Clock ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('vi-VN')), 1000)
    return () => clearInterval(t)
  }, [])

  // ── Load Data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (filterStatus)  params.status = filterStatus
      if (dateMode === 'TODAY')    params.date = getTodayString()
      if (dateMode === 'TOMORROW') params.date = getTomorrowString()
      if (dateMode === 'CUSTOM' && customDate) params.date = customDate

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

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { soundEnabledRef.current = soundEnabled }, [soundEnabled])
  useEffect(() => { loadDataRef.current = loadData }, [loadData])

  // ── WebSocket status ───────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setWsConnected(isWebSocketConnected()), 1500)
    return () => clearInterval(t)
  }, [])

  // ── WebSocket listener ─────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeWebSocket('/topic/reservations', (event) => {
      if (event?.eventType === 'RESERVATION_CREATED') {
        const d = event.data
        if (soundEnabledRef.current) playReservationAlert()
        setNewBookingAlert({
          id: d?.id, customerName: d?.customerName || 'Khách hàng',
          customerPhone: d?.customerPhone || '', numberOfGuests: d?.numberOfGuests || 2,
          reservationTime: d?.reservationTime, reservationDate: d?.reservationDate,
          tableNumber: d?.tableNumber, note: d?.note,
        })
        setToast({ message: `Khách ${d?.customerName || ''} vừa đặt bàn (${d?.numberOfGuests || 2} khách)!`, type: 'success' })
        setTimeout(() => setToast(null), 5000)
        if (loadDataRef.current) loadDataRef.current()
      } else if (['RESERVATION_STATUS_CHANGED','RESERVATION_UPDATED','RESERVATION_DELETED'].includes(event?.eventType)) {
        if (loadDataRef.current) loadDataRef.current()
      }
    })
    return () => { if (unsub) unsub() }
  }, [])

  // ── Sound ──────────────────────────────────────────────────────
  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev
      localStorage.setItem('reservation_sound_enabled', String(next))
      if (next) { playReservationAlert(); showToast('Đã bật chuông thông báo') }
      else showToast('Đã tắt chuông thông báo')
      return next
    })
  }

  const handleTestSound = async () => {
    playReservationAlert()
    showToast('Đang kiểm tra âm thanh thông báo...')
    try { await fetch(buildApiUrl('/api/reservations/test-notify'), { method: 'POST' }) } catch {}
  }

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    all:       reservations.length,
    today:     todayCount,
    pending:   reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    completed: reservations.filter(r => r.status === 'COMPLETED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length,
  }), [reservations, todayCount])

  // ── Form helpers ───────────────────────────────────────────────
  const setField = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  const handleOpenCreate = () => {
    setEditItem(null)
    setFormData({ ...EMPTY_FORM, reservationDate: getTodayString(), status: 'CONFIRMED' })
    setFormErrors({})
    setShowFormModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditItem(item)
    setFormData({
      customerName:    item.customerName || '',
      customerPhone:   item.customerPhone || '',
      customerEmail:   item.customerEmail || '',
      tableId:         item.tableId ? String(item.tableId) : '',
      reservationDate: item.reservationDate || getTodayString(),
      reservationTime: item.reservationTime ? item.reservationTime.substring(0,5) : '18:30',
      numberOfGuests:  item.numberOfGuests || 4,
      note:            item.note || '',
      status:          item.status || 'CONFIRMED',
    })
    setFormErrors({})
    setShowFormModal(true)
  }

  const handleCloseModal = () => { setShowFormModal(false); setEditItem(null); setFormErrors({}) }

  const validateForm = () => {
    const e = {}
    if (!formData.customerName.trim()) e.customerName = 'Vui lòng nhập tên khách hàng'
    if (!formData.customerPhone.trim()) e.customerPhone = 'Vui lòng nhập số điện thoại'
    else if (!/^(\+84|0)[0-9]{8,10}$/.test(formData.customerPhone.trim())) e.customerPhone = 'Số điện thoại không hợp lệ'
    if (formData.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) e.customerEmail = 'Email không hợp lệ'
    if (!formData.reservationDate) e.reservationDate = 'Vui lòng chọn ngày'
    if (!formData.reservationTime) e.reservationTime = 'Vui lòng chọn giờ'
    if (!formData.numberOfGuests || Number(formData.numberOfGuests) < 1) e.numberOfGuests = 'Số khách tối thiểu là 1'
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validateForm()) return
    const payload = {
      customerName:    formData.customerName.trim(),
      customerPhone:   formData.customerPhone.trim(),
      customerEmail:   formData.customerEmail.trim() || null,
      tableId:         formData.tableId ? Number(formData.tableId) : null,
      reservationDate: formData.reservationDate,
      reservationTime: formData.reservationTime,
      numberOfGuests:  Number(formData.numberOfGuests),
      note:            formData.note ? formData.note.trim() : null,
      status:          formData.status || 'CONFIRMED',
    }
    try {
      setSubmitting(true)
      if (editItem) {
        await updateReservation(editItem.id, payload)
        showToast(`Đã cập nhật đặt bàn của ${payload.customerName}`)
      } else {
        await createReservation(payload)
        showToast(`Đã tạo đặt bàn cho ${payload.customerName}`)
      }
      handleCloseModal()
      loadData()
    } catch (err) { showToast(err.message || 'Lỗi khi lưu', 'error') }
    finally { setSubmitting(false) }
  }

  const handleQuickStatus = async (id, newStatus, name) => {
    try {
      await updateReservationStatus(id, newStatus)
      showToast(`Đã cập nhật trạng thái: ${STATUS_CONFIG[newStatus]?.label}`)
      loadData()
    } catch (err) { showToast(err.message || 'Cập nhật thất bại', 'error') }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setDeleting(true)
      await deleteReservation(deleteItem.id)
      showToast(`Đã xóa đặt bàn của ${deleteItem.customerName}`)
      setDeleteItem(null)
      loadData()
    } catch (err) { showToast(err.message || 'Xóa thất bại', 'error') }
    finally { setDeleting(false) }
  }

  const getDateLabel = (resDate) => {
    if (resDate === getTodayString()) return <span className="sr-date-pill today">Hôm nay</span>
    if (resDate === getTomorrowString()) return <span className="sr-date-pill tomorrow">Ngày mai</span>
    return <span className="sr-date-pill">{formatDate(resDate)}</span>
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="sr-container">

      {/* ── TOPBAR ────────────────────────────────────────────── */}
      <header className="sr-topbar">
        {/* Brand */}
        <div className="sr-brand">
          <div className="sr-brand-mark">RM</div>
          <div>
            <div className="sr-brand-name">Quản lý đặt bàn</div>
            <div className="sr-brand-sub">Tiếp nhận &amp; điều phối chỗ ngồi</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sr-nav">
          {canAccessStaff   && <a href="/staff"        className="sr-nav-btn">Sơ đồ bàn</a>}
          <button className="sr-nav-btn sr-nav-active">Đặt bàn</button>
          {canAccessKitchen && <a href="/kitchen"      className="sr-nav-btn">Bếp</a>}
          {canAccessCashier && <a href="/cashier"      className="sr-nav-btn">Thu ngân</a>}
          {canAccessAdmin   && <a href="/admin/orders" className="sr-nav-btn">Admin</a>}
        </nav>

        {/* Right controls */}
        <div className="sr-topbar-right">
          <button
            className={`sr-sound-btn${soundEnabled ? ' on' : ''}`}
            onClick={toggleSound}
            title={soundEnabled ? 'Tắt chuông' : 'Bật chuông'}
          >
            <span className={`sr-sound-dot${soundEnabled ? ' on' : ''}`} />
            {soundEnabled ? 'Chuông: Bật' : 'Chuông: Tắt'}
          </button>

          <button className="sr-nav-btn sr-nav-btn-muted" onClick={handleTestSound}>Thử chuông</button>

          <div className="sr-clock">
            <span className={`sr-ws-dot${wsConnected ? ' on' : ''}`} title={wsConnected ? 'Realtime: Đang kết nối' : 'Realtime: Mất kết nối'} />
            {currentTime}
          </div>

          <button className="sr-btn-primary" onClick={handleOpenCreate}>
            + Đặt bàn mới
          </button>

          <button className="sr-nav-btn sr-nav-icon-btn" onClick={loadData} title="Làm mới dữ liệu">Làm mới</button>

          <button className="sr-nav-btn sr-nav-btn-muted" onClick={() => logout('Đã đăng xuất')} title="Đăng xuất">Đăng xuất</button>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────── */}
      <main className="sr-main">

        {/* New booking alert banner */}
        {newBookingAlert && (
          <div className="sr-alert">
            <div className="sr-alert-bar" />
            <div className="sr-alert-body">
              <div className="sr-alert-title">Có khách vừa đặt bàn!</div>
              <div className="sr-alert-desc">
                <strong>{newBookingAlert.customerName}</strong> ({newBookingAlert.customerPhone})
                {' · '}<strong>{newBookingAlert.numberOfGuests} khách</strong>
                {' lúc '}<strong>{newBookingAlert.reservationTime?.substring(0,5)}</strong>
                {' ngày '}<strong>{formatDate(newBookingAlert.reservationDate)}</strong>
                {newBookingAlert.tableNumber && ` · Bàn ${newBookingAlert.tableNumber}`}
                {newBookingAlert.note && ` — "${newBookingAlert.note}"`}
              </div>
            </div>
            <div className="sr-alert-actions">
              {newBookingAlert.id && (
                <button
                  className="sr-alert-btn-confirm"
                  onClick={() => { handleQuickStatus(newBookingAlert.id,'CONFIRMED',newBookingAlert.customerName); setNewBookingAlert(null) }}
                >
                  Xác nhận
                </button>
              )}
              <button className="sr-alert-btn-dismiss" onClick={() => setNewBookingAlert(null)}>Đóng</button>
            </div>
          </div>
        )}

        {/* ── STATS ─────────────────────────────────────────── */}
        <div className="sr-stats">
          <div
            className={`sr-stat${dateMode==='ALL' && !filterStatus ? ' active' : ''}`}
            onClick={() => { setDateMode('ALL'); setFilterStatus('') }}
          >
            <div className="sr-stat-num">{stats.all}</div>
            <div className="sr-stat-lbl">Tổng đặt bàn</div>
          </div>
          <div
            className={`sr-stat${dateMode==='TODAY' ? ' active' : ''}`}
            onClick={() => { setDateMode('TODAY'); setFilterStatus('') }}
          >
            <div className="sr-stat-num">{stats.today}</div>
            <div className="sr-stat-lbl">Hôm nay</div>
          </div>
          <div
            className={`sr-stat${filterStatus==='PENDING' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus==='PENDING' ? '' : 'PENDING')}
          >
            <div className="sr-stat-num sr-col-pending">{stats.pending}</div>
            <div className="sr-stat-lbl">Chờ duyệt</div>
          </div>
          <div
            className={`sr-stat${filterStatus==='CONFIRMED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus==='CONFIRMED' ? '' : 'CONFIRMED')}
          >
            <div className="sr-stat-num sr-col-confirmed">{stats.confirmed}</div>
            <div className="sr-stat-lbl">Đã xác nhận</div>
          </div>
          <div
            className={`sr-stat${filterStatus==='COMPLETED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus==='COMPLETED' ? '' : 'COMPLETED')}
          >
            <div className="sr-stat-num sr-col-completed">{stats.completed}</div>
            <div className="sr-stat-lbl">Khách đã đến</div>
          </div>
          <div
            className={`sr-stat${filterStatus==='CANCELLED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus==='CANCELLED' ? '' : 'CANCELLED')}
          >
            <div className="sr-stat-num sr-col-cancelled">{stats.cancelled}</div>
            <div className="sr-stat-lbl">Đã hủy / vắng</div>
          </div>
        </div>

        {/* ── TOOLBAR ─────────────────────────────────────────── */}
        <div className="sr-toolbar">
          <div className="sr-toolbar-row1">
            <input
              className="sr-search"
              type="text"
              placeholder="Tìm khách hàng theo tên, số điện thoại, ghi chú..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="sr-date-chips">
              {[
                { key: 'ALL',      label: 'Mọi ngày' },
                { key: 'TODAY',    label: 'Hôm nay'  },
                { key: 'TOMORROW', label: 'Ngày mai' },
              ].map(d => (
                <button
                  key={d.key}
                  className={`sr-chip${dateMode===d.key ? ' active' : ''}`}
                  onClick={() => setDateMode(d.key)}
                >
                  {d.label}
                </button>
              ))}
              <input
                type="date"
                className="sr-date-input"
                value={dateMode==='CUSTOM' ? customDate : ''}
                onChange={e => { setDateMode('CUSTOM'); setCustomDate(e.target.value) }}
              />
            </div>

            <div className="sr-view-toggle">
              <button className={`sr-view-btn${viewMode==='cards' ? ' active' : ''}`} onClick={() => setViewMode('cards')}>Thẻ</button>
              <button className={`sr-view-btn${viewMode==='table' ? ' active' : ''}`} onClick={() => setViewMode('table')}>Bảng</button>
            </div>
          </div>

          <div className="sr-toolbar-row2">
            <div className="sr-status-tabs">
              <button
                className={`sr-tab${!filterStatus ? ' active' : ''}`}
                onClick={() => setFilterStatus('')}
              >
                Tất cả <span className="sr-tab-count">{reservations.length}</span>
              </button>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                const cnt = reservations.filter(r => r.status === k).length
                return (
                  <button
                    key={k}
                    className={`sr-tab${filterStatus===k ? ' active' : ''}`}
                    onClick={() => setFilterStatus(filterStatus===k ? '' : k)}
                  >
                    {v.label}
                    {cnt > 0 && <span className="sr-tab-count">{cnt}</span>}
                  </button>
                )
              })}
            </div>

            {(search || filterStatus || dateMode !== 'ALL') && (
              <button className="sr-btn-clear" onClick={() => { setSearch(''); setFilterStatus(''); setDateMode('ALL'); setCustomDate('') }}>
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── LIST ────────────────────────────────────────────── */}
        {loading ? (
          <div className="sr-empty">
            <div className="sr-spinner" />
            <p>Đang tải danh sách đặt bàn...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="sr-empty">
            <div className="sr-empty-title">Không có đặt bàn nào</div>
            <div className="sr-empty-sub">
              {search || filterStatus || dateMode !== 'ALL'
                ? 'Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Chưa có đơn đặt bàn nào trong hệ thống.'}
            </div>
            <button className="sr-btn-primary" onClick={handleOpenCreate}>Tiếp nhận đặt bàn mới</button>
          </div>
        ) : viewMode === 'cards' ? (

          /* ── CARDS VIEW ─────────────────────────────────────── */
          <div className="sr-cards">
            {reservations.map(res => {
              const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.PENDING
              return (
                <div key={res.id} className="sr-card">
                  {/* Card header */}
                  <div className="sr-card-head">
                    <div className="sr-card-time-wrap">
                      <span className="sr-card-time">
                        {res.reservationTime ? res.reservationTime.substring(0,5) : '--:--'}
                      </span>
                      {getDateLabel(res.reservationDate)}
                    </div>
                    <span className={`sr-badge ${cfg.cls}`}>{cfg.label}</span>
                  </div>

                  {/* Card body */}
                  <div className="sr-card-body">
                    <div className="sr-card-customer">
                      <h4 className="sr-card-name">{res.customerName}</h4>
                      {res.customerEmail && (
                        <span className="sr-card-email">{res.customerEmail}</span>
                      )}
                    </div>

                    <div className="sr-card-meta">
                      <a href={`tel:${res.customerPhone}`} className="sr-card-phone" title="Gọi điện">
                        {res.customerPhone}
                      </a>
                      <span className="sr-meta-dot">·</span>
                      <span className="sr-card-guests">{res.numberOfGuests} khách</span>
                      <span className="sr-meta-dot">·</span>
                      {res.tableNumber ? (
                        <span className="sr-card-table">Bàn {res.tableNumber}</span>
                      ) : (
                        <span className="sr-card-unassigned">Chưa xếp bàn</span>
                      )}
                    </div>

                    {res.note && (
                      <div className="sr-card-note">
                        <span className="sr-note-prefix">Ghi chú:</span> {res.note}
                      </div>
                    )}
                  </div>

                  {/* Card actions */}
                  <div className="sr-card-foot">
                    <div className="sr-card-actions">
                      {res.status === 'PENDING' && (
                        <button className="sr-act-btn sr-act-confirm" onClick={() => handleQuickStatus(res.id,'CONFIRMED',res.customerName)}>
                          Xác nhận
                        </button>
                      )}
                      {res.status === 'CONFIRMED' && (
                        <button className="sr-act-btn sr-act-arrive" onClick={() => handleQuickStatus(res.id,'COMPLETED',res.customerName)}>
                          Khách đến
                        </button>
                      )}
                      <button className="sr-act-btn sr-act-edit" onClick={() => handleOpenEdit(res)}>
                        Sửa
                      </button>
                      {['PENDING','CONFIRMED'].includes(res.status) && (
                        <button className="sr-act-btn sr-act-cancel" onClick={() => handleQuickStatus(res.id,'CANCELLED',res.customerName)}>
                          Hủy
                        </button>
                      )}
                      {res.status === 'CONFIRMED' && (
                        <button className="sr-act-btn sr-act-noshow" onClick={() => handleQuickStatus(res.id,'NO_SHOW',res.customerName)}>
                          Vắng
                        </button>
                      )}
                    </div>
                    <button className="sr-act-delete" onClick={() => setDeleteItem(res)} title="Xóa đặt bàn">
                      Xóa
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        ) : (

          /* ── TABLE VIEW ─────────────────────────────────────── */
          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Số khách</th>
                  <th>Bàn</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => {
                  const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.PENDING
                  return (
                    <tr key={res.id}>
                      <td>
                        <div className="sr-tbl-time">{res.reservationTime ? res.reservationTime.substring(0,5) : '--:--'}</div>
                        <div className="sr-tbl-date">{formatDate(res.reservationDate)}</div>
                      </td>
                      <td>
                        <div className="sr-tbl-name">{res.customerName}</div>
                        {res.customerEmail && <div className="sr-tbl-email">{res.customerEmail}</div>}
                      </td>
                      <td><a href={`tel:${res.customerPhone}`} className="sr-card-phone">{res.customerPhone}</a></td>
                      <td><span className="sr-card-pill sr-pill-guests">{res.numberOfGuests} khách</span></td>
                      <td>
                        {res.tableNumber
                          ? <span className="sr-card-pill sr-pill-table">Bàn {res.tableNumber}</span>
                          : <span className="sr-card-pill sr-pill-unassigned">Chưa gán</span>}
                      </td>
                      <td><span className={`sr-badge ${cfg.cls}`}>{cfg.label}</span></td>
                      <td><span className="sr-tbl-note">{res.note || '—'}</span></td>
                      <td>
                        <div className="sr-tbl-actions">
                          {res.status === 'PENDING'    && <button className="sr-act-btn sr-act-confirm" onClick={() => handleQuickStatus(res.id,'CONFIRMED',res.customerName)}>Xác nhận</button>}
                          {res.status === 'CONFIRMED'  && <button className="sr-act-btn sr-act-arrive"  onClick={() => handleQuickStatus(res.id,'COMPLETED',res.customerName)}>Đến</button>}
                          <button className="sr-act-btn sr-act-edit"   onClick={() => handleOpenEdit(res)}>Sửa</button>
                          <button className="sr-act-btn sr-act-cancel" onClick={() => setDeleteItem(res)}>Xóa</button>
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

      {/* ── MODAL: TẠO / SỬA ────────────────────────────────────── */}
      {showFormModal && (
        <div className="sr-overlay" onClick={handleCloseModal}>
          <div className="sr-modal" onClick={e => e.stopPropagation()}>
            <div className="sr-modal-head">
              <h2>{editItem ? `Chỉnh sửa đặt bàn #${editItem.id}` : 'Tiếp nhận đặt bàn mới'}</h2>
              <button className="sr-modal-close" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="sr-form-scroll">
              <div className="sr-form-grid">

                {/* Tên */}
                <div className="sr-field full">
                  <label>Tên khách hàng <span className="req">*</span></label>
                  <input
                    type="text"
                    className={formErrors.customerName ? 'err' : ''}
                    placeholder="VD: Anh Nam, Chị Linh..."
                    value={formData.customerName}
                    onChange={e => setField('customerName', e.target.value)}
                    autoFocus
                  />
                  {formErrors.customerName && <span className="field-err">{formErrors.customerName}</span>}
                </div>

                {/* Phone + Email */}
                <div className="sr-field">
                  <label>Số điện thoại <span className="req">*</span></label>
                  <input
                    type="tel"
                    className={formErrors.customerPhone ? 'err' : ''}
                    placeholder="0912345678"
                    value={formData.customerPhone}
                    onChange={e => setField('customerPhone', e.target.value)}
                  />
                  {formErrors.customerPhone && <span className="field-err">{formErrors.customerPhone}</span>}
                </div>

                <div className="sr-field">
                  <label>Email <span className="sr-opt">(không bắt buộc)</span></label>
                  <input
                    type="email"
                    className={formErrors.customerEmail ? 'err' : ''}
                    placeholder="khach@gmail.com"
                    value={formData.customerEmail}
                    onChange={e => setField('customerEmail', e.target.value)}
                  />
                  {formErrors.customerEmail && <span className="field-err">{formErrors.customerEmail}</span>}
                </div>

                {/* Ngày + Giờ */}
                <div className="sr-field">
                  <label>Ngày đặt <span className="req">*</span></label>
                  <input
                    type="date"
                    value={formData.reservationDate}
                    onChange={e => setField('reservationDate', e.target.value)}
                  />
                  <div className="sr-quick-row">
                    <button type="button" className={`sr-mini${formData.reservationDate===getTodayString()?' active':''}`}
                      onClick={() => setField('reservationDate', getTodayString())}>Hôm nay</button>
                    <button type="button" className={`sr-mini${formData.reservationDate===getTomorrowString()?' active':''}`}
                      onClick={() => setField('reservationDate', getTomorrowString())}>Ngày mai</button>
                  </div>
                </div>

                <div className="sr-field">
                  <label>Giờ hẹn <span className="req">*</span></label>
                  <input
                    type="time"
                    value={formData.reservationTime}
                    onChange={e => setField('reservationTime', e.target.value)}
                  />
                  <div className="sr-quick-row">
                    {['11:30','12:00','18:00','18:30','19:00','19:30'].map(t => (
                      <button key={t} type="button" className={`sr-mini${formData.reservationTime===t?' active':''}`}
                        onClick={() => setField('reservationTime', t)}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Số khách */}
                <div className="sr-field">
                  <label>Số khách <span className="req">*</span></label>
                  <div className="sr-counter">
                    <button type="button" className="sr-counter-btn"
                      onClick={() => setField('numberOfGuests', Math.max(1, Number(formData.numberOfGuests)-1))}>−</button>
                    <input
                      type="number" min="1" max="100"
                      className="sr-counter-input"
                      value={formData.numberOfGuests}
                      onChange={e => setField('numberOfGuests', Number(e.target.value))}
                    />
                    <button type="button" className="sr-counter-btn"
                      onClick={() => setField('numberOfGuests', Number(formData.numberOfGuests)+1)}>+</button>
                  </div>
                  <div className="sr-quick-row">
                    {[2,4,6,8,10,12].map(n => (
                      <button key={n} type="button" className={`sr-mini${Number(formData.numberOfGuests)===n?' active':''}`}
                        onClick={() => setField('numberOfGuests', n)}>{n}</button>
                    ))}
                  </div>
                </div>

                {/* Bàn */}
                <div className="sr-field">
                  <label>Gán bàn <span className="sr-opt">(có thể gán sau)</span></label>
                  <select value={formData.tableId} onChange={e => setField('tableId', e.target.value)}>
                    <option value="">-- Chưa xếp bàn --</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>
                        Bàn {t.tableNumber} ({t.capacity} chỗ){t.status === 'AVAILABLE' ? ' · Trống' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Trạng thái */}
                <div className="sr-field full">
                  <label>Trạng thái</label>
                  <div className="sr-quick-row">
                    {[
                      { k:'CONFIRMED', l:'Đã xác nhận (khuyên dùng)' },
                      { k:'PENDING',   l:'Chờ duyệt' },
                      ...(editItem ? [
                        { k:'COMPLETED', l:'Khách đã đến' },
                        { k:'CANCELLED', l:'Đã hủy'      },
                        { k:'NO_SHOW',   l:'Vắng mặt'   },
                      ] : [])
                    ].map(s => (
                      <button key={s.k} type="button"
                        className={`sr-mini${formData.status===s.k?' active':''}`}
                        onClick={() => setField('status', s.k)}
                      >{s.l}</button>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                <div className="sr-field full">
                  <label>Ghi chú khách / Yêu cầu đặc biệt</label>
                  <textarea
                    rows="2"
                    placeholder="VD: Ghế trẻ em, ngồi gần cửa sổ, dịp sinh nhật..."
                    value={formData.note}
                    onChange={e => setField('note', e.target.value)}
                  />
                  <div className="sr-tags">
                    {NOTE_SUGGESTIONS.map(tag => (
                      <span key={tag} className="sr-tag"
                        onClick={() => setField('note', formData.note ? `${formData.note}, ${tag}` : tag)}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              <div className="sr-modal-foot">
                <button type="button" className="sr-btn-secondary" onClick={handleCloseModal} disabled={submitting}>Đóng</button>
                <button type="submit" className="sr-btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editItem ? 'Cập nhật đặt bàn' : 'Lưu đặt bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: XÁC NHẬN XÓA ─────────────────────────────────── */}
      {deleteItem && (
        <div className="sr-overlay" onClick={() => setDeleteItem(null)}>
          <div className="sr-confirm" onClick={e => e.stopPropagation()}>
            <div className="sr-confirm-icon">!</div>
            <h3>Xác nhận xóa?</h3>
            <p>
              Đơn đặt bàn của <strong>{deleteItem.customerName}</strong> lúc{' '}
              <strong>{deleteItem.reservationTime?.substring(0,5)}</strong> ngày{' '}
              <strong>{formatDate(deleteItem.reservationDate)}</strong> sẽ bị xóa vĩnh viễn.
            </p>
            <div className="sr-confirm-btns">
              <button className="sr-btn-secondary" onClick={() => setDeleteItem(null)} disabled={deleting}>Hủy</button>
              <button className="sr-btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Xóa đặt bàn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ───────────────────────────────────────────────── */}
      {toast && (
        <div className={`sr-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  )
}
