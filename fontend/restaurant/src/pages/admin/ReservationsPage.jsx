import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/pages/admin/ReservationsPage.css'
import {
  getAllReservations,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getTodayReservationCount,
} from '../../services/reservationService'
import { getActiveTables } from '../../services/tableService'

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  ALL:       { label: 'Tất cả',        key: '',          cls: 'st-all'       },
  PENDING:   { label: 'Chờ duyệt',     key: 'PENDING',   cls: 'st-pending'   },
  CONFIRMED: { label: 'Đã xác nhận',   key: 'CONFIRMED', cls: 'st-confirmed' },
  COMPLETED: { label: 'Hoàn thành',    key: 'COMPLETED', cls: 'st-completed' },
  CANCELLED: { label: 'Đã hủy',        key: 'CANCELLED', cls: 'st-cancelled' },
  NO_SHOW:   { label: 'Vắng mặt',      key: 'NO_SHOW',   cls: 'st-noshow'    },
}

const FILTER_TABS = [
  { key: '',          label: 'Tất cả' },
  { key: 'PENDING',   label: 'Chờ duyệt' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
  { key: 'NO_SHOW',   label: 'Vắng mặt' },
]

function getTodayString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
}

function getTomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  tableId: '',
  reservationDate: getTodayString(),
  reservationTime: '18:30',
  numberOfGuests: 2,
  note: '',
  status: 'CONFIRMED',
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [tables, setTables]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [todayCount, setTodayCount]     = useState(0)

  // Filters & Views
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate]     = useState('')
  const [datePreset, setDatePreset]     = useState('ALL') // ALL, TODAY, TOMORROW, CUSTOM

  // Toast
  const [toast, setToast]               = useState(null)

  // Modals
  const [showModal, setShowModal]       = useState(false)
  const [editItem, setEditItem]         = useState(null)
  const [formData, setFormData]         = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]     = useState({})
  const [submitting, setSubmitting]     = useState(false)

  const [detailItem, setDetailItem]     = useState(null)
  const [deleteItem, setDeleteItem]     = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // ── Toast helper ───────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Load Data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (filterStatus) params.status = filterStatus

      let resolvedDate = undefined
      if (datePreset === 'TODAY') resolvedDate = getTodayString()
      else if (datePreset === 'TOMORROW') resolvedDate = getTomorrowString()
      else if (datePreset === 'CUSTOM' && filterDate) resolvedDate = filterDate
      if (resolvedDate) params.date = resolvedDate

      const [resData, countData, tableData] = await Promise.all([
        getAllReservations(params),
        getTodayReservationCount().catch(() => ({ count: 0 })),
        getActiveTables().catch(() => []),
      ])

      setReservations(Array.isArray(resData) ? resData : [])
      setTodayCount(countData?.count || 0)
      setTables(Array.isArray(tableData) ? tableData : [])
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách đặt bàn', 'error')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, datePreset, filterDate])

  useEffect(() => { loadData() }, [loadData])

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    all:       reservations.length,
    today:     todayCount,
    pending:   reservations.filter(r => r.status === 'PENDING').length,
    confirmed: reservations.filter(r => r.status === 'CONFIRMED').length,
    completed: reservations.filter(r => r.status === 'COMPLETED').length,
    cancelled: reservations.filter(r => r.status === 'CANCELLED' || r.status === 'NO_SHOW').length,
  }), [reservations, todayCount])

  // ── Handlers ───────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setDatePreset('ALL')
    setFilterDate('')
  }

  const handleOpenCreate = () => {
    setEditItem(null)
    setFormData({ ...EMPTY_FORM, reservationDate: getTodayString(), status: 'CONFIRMED' })
    setFormErrors({})
    setShowModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditItem(item)
    setFormData({
      customerName:    item.customerName || '',
      customerPhone:   item.customerPhone || '',
      customerEmail:   item.customerEmail || '',
      tableId:         item.tableId || '',
      reservationDate: item.reservationDate || '',
      reservationTime: item.reservationTime ? item.reservationTime.substring(0, 5) : '18:30',
      numberOfGuests:  item.numberOfGuests || 2,
      note:            item.note || '',
      status:          item.status || 'CONFIRMED',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditItem(null)
    setFormErrors({})
  }

  const validateForm = () => {
    const errs = {}
    if (!formData.customerName.trim()) errs.customerName = 'Vui lòng nhập tên khách hàng'
    if (!formData.customerPhone.trim()) {
      errs.customerPhone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(\+84|0)[0-9]{8,10}$/.test(formData.customerPhone.trim())) {
      errs.customerPhone = 'Số điện thoại không hợp lệ (10 số)'
    }
    if (formData.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) {
      errs.customerEmail = 'Định dạng email không hợp lệ'
    }
    if (!formData.reservationDate) errs.reservationDate = 'Vui lòng chọn ngày đặt'
    if (!formData.reservationTime) errs.reservationTime = 'Vui lòng chọn giờ hẹn'
    if (!formData.numberOfGuests || Number(formData.numberOfGuests) < 1) {
      errs.numberOfGuests = 'Số khách tối thiểu là 1'
    }
    setFormErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const payload = {
      customerName:    formData.customerName.trim(),
      customerPhone:   formData.customerPhone.trim(),
      customerEmail:   formData.customerEmail.trim() || null,
      tableId:         formData.tableId ? Number(formData.tableId) : null,
      reservationDate: formData.reservationDate,
      reservationTime: formData.reservationTime,
      numberOfGuests:  Number(formData.numberOfGuests),
      note:            formData.note.trim() || null,
      status:          formData.status || 'CONFIRMED',
    }

    try {
      setSubmitting(true)
      if (editItem) {
        await updateReservation(editItem.id, payload)
        showToast(`Đã cập nhật đặt bàn của ${payload.customerName}`)
      } else {
        await createReservation(payload)
        showToast(`Đã tạo đặt bàn mới cho ${payload.customerName}`)
      }
      handleCloseModal()
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu thông tin đặt bàn', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickStatus = async (resId, newStatus, customerName) => {
    try {
      await updateReservationStatus(resId, newStatus)
      showToast(`Đã chuyển đơn của "${customerName}" sang ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
      setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: newStatus } : r))
      if (detailItem && detailItem.id === resId) {
        setDetailItem(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error')
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setDeleting(true)
      await deleteReservation(deleteItem.id)
      showToast(`Đã xóa đơn đặt bàn của ${deleteItem.customerName}`)
      setDeleteItem(null)
      loadData()
    } catch (err) {
      showToast(err.message || 'Xóa đặt bàn thất bại', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  return (
    <AdminLayout
      title="Quản lý đặt bàn"
      subtitle="Giám sát lượt đặt bàn & phân phối chỗ ngồi khách hàng"
      actions={
        <div className="res-topbar-actions">
          <a href="/staff/reservations" className="res-nav-link">
            Màn hình Lễ tân
          </a>
          <button className="res-btn-refresh" onClick={loadData} title="Tải lại danh sách">
            Làm mới
          </button>
          <button className="res-btn-primary" onClick={handleOpenCreate}>
            + Thêm đặt bàn
          </button>
        </div>
      }
    >
      <div className="reservations-admin-page">
        {/* ── 1. METRICS GRID ─────────────────────────────────────── */}
        <div className="res-metrics-grid" style={{ marginBottom: 16 }}>
          <div
            className={`res-metric-card${datePreset === 'ALL' && !filterStatus ? ' active' : ''}`}
            onClick={handleClearFilters}
          >
            <div className="res-metric-head">
              <span className="res-metric-label">Tổng đặt bàn</span>
              <span className="res-metric-pill neutral">Tất cả</span>
            </div>
            <div className="res-metric-val">{stats.all}</div>
            <div className="res-metric-sub">Toàn bộ lượt đặt trên hệ thống</div>
          </div>

          <div
            className={`res-metric-card${datePreset === 'TODAY' ? ' active' : ''}`}
            onClick={() => { setDatePreset('TODAY'); setFilterStatus(''); setFilterDate('') }}
          >
            <div className="res-metric-head">
              <span className="res-metric-label">Đặt bàn hôm nay</span>
              <span className="res-metric-pill info">Hôm nay</span>
            </div>
            <div className="res-metric-val text-blue">{stats.today}</div>
            <div className="res-metric-sub">Lượt khách đến nhà hàng trong ngày</div>
          </div>

          <div
            className={`res-metric-card${filterStatus === 'PENDING' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'PENDING' ? '' : 'PENDING')}
          >
            <div className="res-metric-head">
              <span className="res-metric-label">Chờ duyệt</span>
              {stats.pending > 0 && <span className="res-metric-pill warning">Cần duyệt</span>}
            </div>
            <div className="res-metric-val text-amber">{stats.pending}</div>
            <div className="res-metric-sub">Khách tự đặt qua Web cần gọi xác nhận</div>
          </div>

          <div
            className={`res-metric-card${filterStatus === 'CONFIRMED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'CONFIRMED' ? '' : 'CONFIRMED')}
          >
            <div className="res-metric-head">
              <span className="res-metric-label">Đã xác nhận</span>
              <span className="res-metric-pill success">Đã chốt bàn</span>
            </div>
            <div className="res-metric-val text-emerald">{stats.confirmed}</div>
            <div className="res-metric-sub">Đã giữ chỗ và chuẩn bị đón tiếp</div>
          </div>

          <div
            className={`res-metric-card${filterStatus === 'COMPLETED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'COMPLETED' ? '' : 'COMPLETED')}
          >
            <div className="res-metric-head">
              <span className="res-metric-label">Đã đến / Hoàn tất</span>
              <span className="res-metric-pill dark">Thành công</span>
            </div>
            <div className="res-metric-val text-slate">{stats.completed}</div>
            <div className="res-metric-sub">Khách đã vào bàn thưởng thức món</div>
          </div>
        </div>

        {/* ── 2. STATUS TABS (Hàng trạng thái) ──────────────────── */}
        <div style={{ marginBottom: 12 }}>
          <div className="admin-tabs">
            {FILTER_TABS.map(tab => {
              const count = tab.key === ''
                ? stats.all
                : reservations.filter(r => r.status === tab.key).length
              const isActive = filterStatus === tab.key
              let countCls = ''
              if (tab.key === 'PENDING') countCls = ' warning'
              else if (tab.key === 'CONFIRMED' || tab.key === 'COMPLETED') countCls = ' success'
              else if (tab.key === 'CANCELLED') countCls = ' danger'
              else if (tab.key === 'SEATED') countCls = ' info'

              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`admin-tab-item${isActive ? ' active' : ''}`}
                  onClick={() => setFilterStatus(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className={`admin-tab-count${countCls}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 2. SEARCH & DATE FILTER ROW (Thanh tìm kiếm bên trái dài & đẹp) ── */}
        <div className="admin-toolbar" style={{ alignItems: 'center', marginBottom: 16 }}>
          {/* Thanh tìm kiếm bên trái dài và đẹp */}
          <div className="admin-search-bar" style={{ minWidth: 320, flex: 1 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="admin-search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Tìm khách hàng theo tên, số điện thoại, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => setSearch('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cụm lọc ngày & xóa lọc bên phải */}
          <div className="admin-toolbar-right">
            <div className="admin-segmented-group" style={{ height: 42, borderRadius: 12 }}>
              <button
                type="button"
                className={`admin-segmented-btn${datePreset === 'ALL' ? ' active' : ''}`}
                onClick={() => { setDatePreset('ALL'); setFilterDate('') }}
              >
                Mọi ngày
              </button>
              <button
                type="button"
                className={`admin-segmented-btn${datePreset === 'TODAY' ? ' active' : ''}`}
                onClick={() => { setDatePreset('TODAY'); setFilterDate('') }}
              >
                Hôm nay
              </button>
              <button
                type="button"
                className={`admin-segmented-btn${datePreset === 'TOMORROW' ? ' active' : ''}`}
                onClick={() => { setDatePreset('TOMORROW'); setFilterDate('') }}
              >
                Ngày mai
              </button>
              <input
                type="date"
                className="admin-date-picker"
                style={{ height: 32, borderRadius: 8 }}
                value={datePreset === 'CUSTOM' ? filterDate : ''}
                onChange={e => {
                  setDatePreset('CUSTOM')
                  setFilterDate(e.target.value)
                }}
                title="Chọn ngày tùy ý"
              />
            </div>

            {(search || filterStatus || datePreset !== 'ALL' || filterDate) && (
              <button
                type="button"
                className="admin-btn-reset"
                style={{ height: 42, borderRadius: 12 }}
                onClick={handleClearFilters}
              >
                ✕ Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* ── 3. DATA VIEW: TABLE ─────────────────────────────────── */}
        {loading ? (
          <div className="res-state-box">
            <div className="res-spinner" />
            <div className="res-state-title">Đang tải danh sách đặt bàn...</div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="res-state-box">
            <div className="res-state-title">Không tìm thấy đơn đặt bàn nào</div>
            <div className="res-state-desc">
              {search || filterStatus || datePreset !== 'ALL'
                ? 'Không có đơn đặt bàn nào khớp với bộ lọc. Hãy thử làm mới hoặc xóa bộ lọc.'
                : 'Chưa có dữ liệu đặt bàn nào trong hệ thống.'}
            </div>
            <button type="button" className="res-btn-primary" onClick={handleOpenCreate}>
              + Tạo đặt bàn mới
            </button>
          </div>
        ) : (
          /* ── TABLE VIEW ───────────────────────────────────────── */
          <div className="res-table-wrap table-card" style={{ padding: '16px 20px', overflowX: 'auto' }}>
            <table className="res-data-table data-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Khách hàng</th>
                  <th style={{ width: '150px' }}>Thời gian hẹn</th>
                  <th style={{ width: '100px' }}>Số khách</th>
                  <th style={{ width: '120px' }}>Bàn phục vụ</th>
                  <th style={{ width: '130px' }}>Trạng thái</th>
                  <th style={{ width: '170px' }}>Đổi trạng thái</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => {
                  const cfg = STATUS_CONFIG[res.status] || STATUS_CONFIG.PENDING
                  const isToday = res.reservationDate === getTodayString()
                  return (
                    <tr
                      key={res.id}
                      className="clickable-row"
                      onClick={() => setDetailItem(res)}
                      style={{ cursor: 'pointer' }}
                      title="Bấm để xem chi tiết và chỉnh sửa đặt bàn"
                    >
                      {/* Khách hàng */}
                      <td>
                        <div className="res-customer-cell">
                          <span className="res-customer-name">{res.customerName}</span>
                          <a href={`tel:${res.customerPhone}`} className="res-customer-phone">
                            {res.customerPhone}
                          </a>
                          {res.customerEmail && (
                            <span className="res-customer-email">{res.customerEmail}</span>
                          )}
                        </div>
                      </td>

                      {/* Ngày & Giờ */}
                      <td>
                        <div className="res-time-cell">
                          <span className="res-time-hour">
                            {res.reservationTime ? res.reservationTime.substring(0, 5) : '--:--'}
                          </span>
                          <div className="res-time-date-row">
                            <span className="res-time-date">{formatDate(res.reservationDate)}</span>
                            {isToday && <span className="res-pill-today">Hôm nay</span>}
                          </div>
                        </div>
                      </td>

                      {/* Số khách */}
                      <td>
                        <span className="res-guests-tag">{res.numberOfGuests} khách</span>
                      </td>

                      {/* Bàn */}
                      <td>
                        {res.tableNumber ? (
                          <span className="res-table-tag assigned">Bàn {res.tableNumber}</span>
                        ) : (
                          <span className="res-table-tag unassigned">Chưa xếp bàn</span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td>
                        <span className={`res-badge ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Đổi trạng thái nhanh */}
                      <td>
                        <select
                          className="res-quick-status-select"
                          value={res.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => handleQuickStatus(res.id, e.target.value, res.customerName)}
                        >
                          <option value="PENDING">Chờ duyệt</option>
                          <option value="CONFIRMED">Đã xác nhận</option>
                          <option value="COMPLETED">Hoàn thành</option>
                          <option value="CANCELLED">Đã hủy</option>
                          <option value="NO_SHOW">Vắng mặt</option>
                        </select>
                      </td>

                      {/* Thao tác (Đã bỏ nút Xem, bấm hàng để xem chi tiết/sửa) */}
                      <td>
                        <div className="res-actions-cell">
                          <button
                            type="button"
                            className="res-act-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(res)
                            }}
                            title="Chỉnh sửa thông tin"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="res-act-btn danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteItem(res)
                            }}
                            title="Xóa đặt bàn"
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

        {/* ── 4. MODAL: TẠO / SỬA ĐẶT BÀN ────────────────────────── */}
        {showModal && (
          <div className="res-modal-overlay" onClick={handleCloseModal}>
            <div className="res-modal-dialog" onClick={e => e.stopPropagation()}>
              <div className="res-modal-header">
                <h2>{editItem ? `Chỉnh sửa đặt bàn #${editItem.id}` : 'Tiếp nhận đặt bàn mới'}</h2>
                <button type="button" className="res-modal-close" onClick={handleCloseModal}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="res-modal-body">
                  <div className="res-form-grid">
                    {/* Tên khách */}
                    <div className="res-form-field full">
                      <label>Tên khách hàng <span className="req">*</span></label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Anh Quân, Chị Ngọc..."
                        value={formData.customerName}
                        onChange={e => updateField('customerName', e.target.value)}
                        autoFocus
                      />
                      {formErrors.customerName && <span className="res-field-err">{formErrors.customerName}</span>}
                    </div>

                    {/* SĐT */}
                    <div className="res-form-field">
                      <label>Số điện thoại <span className="req">*</span></label>
                      <input
                        type="tel"
                        placeholder="0912345678"
                        value={formData.customerPhone}
                        onChange={e => updateField('customerPhone', e.target.value)}
                      />
                      {formErrors.customerPhone && <span className="res-field-err">{formErrors.customerPhone}</span>}
                    </div>

                    {/* Email */}
                    <div className="res-form-field">
                      <label>Email khách hàng</label>
                      <input
                        type="email"
                        placeholder="khachhang@gmail.com"
                        value={formData.customerEmail}
                        onChange={e => updateField('customerEmail', e.target.value)}
                      />
                      {formErrors.customerEmail && <span className="res-field-err">{formErrors.customerEmail}</span>}
                    </div>

                    {/* Ngày đặt */}
                    <div className="res-form-field">
                      <label>Ngày hẹn <span className="req">*</span></label>
                      <input
                        type="date"
                        value={formData.reservationDate}
                        onChange={e => updateField('reservationDate', e.target.value)}
                      />
                      {formErrors.reservationDate && <span className="res-field-err">{formErrors.reservationDate}</span>}
                    </div>

                    {/* Giờ hẹn */}
                    <div className="res-form-field">
                      <label>Giờ hẹn <span className="req">*</span></label>
                      <input
                        type="time"
                        value={formData.reservationTime}
                        onChange={e => updateField('reservationTime', e.target.value)}
                      />
                      {formErrors.reservationTime && <span className="res-field-err">{formErrors.reservationTime}</span>}
                    </div>

                    {/* Số khách */}
                    <div className="res-form-field">
                      <label>Số lượng khách <span className="req">*</span></label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.numberOfGuests}
                        onChange={e => updateField('numberOfGuests', e.target.value)}
                      />
                      {formErrors.numberOfGuests && <span className="res-field-err">{formErrors.numberOfGuests}</span>}
                    </div>

                    {/* Bàn gán */}
                    <div className="res-form-field">
                      <label>Gán bàn phục vụ</label>
                      <select
                        value={formData.tableId}
                        onChange={e => updateField('tableId', e.target.value)}
                      >
                        <option value="">-- Chưa gán bàn --</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>
                            Bàn {t.tableNumber} ({t.capacity} chỗ){t.status === 'AVAILABLE' ? ' · Trống' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trạng thái */}
                    <div className="res-form-field full">
                      <label>Trạng thái đặt bàn</label>
                      <select
                        value={formData.status}
                        onChange={e => updateField('status', e.target.value)}
                      >
                        <option value="CONFIRMED">Đã xác nhận (Khuyên dùng)</option>
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="COMPLETED">Đã đến nhà hàng</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="NO_SHOW">Khách vắng mặt</option>
                      </select>
                    </div>

                    {/* Ghi chú */}
                    <div className="res-form-field full">
                      <label>Ghi chú / Yêu cầu riêng</label>
                      <textarea
                        rows="3"
                        placeholder="VD: Bàn view cửa sổ, mang theo ghế trẻ em, dị ứng hải sản..."
                        value={formData.note}
                        onChange={e => updateField('note', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="res-modal-footer">
                  <button
                    type="button"
                    className="res-btn-secondary"
                    onClick={handleCloseModal}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="res-btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang lưu...' : editItem ? 'Cập nhật đặt bàn' : 'Tạo đặt bàn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 5. MODAL: XEM CHI TIẾT ĐẶT BÀN ─────────────────────── */}
        {detailItem && (
          <div className="res-modal-overlay" onClick={() => setDetailItem(null)}>
            <div className="res-modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
              <div className="res-modal-header">
                <h2>Chi tiết đặt bàn #{detailItem.id}</h2>
                <button type="button" className="res-modal-close" onClick={() => setDetailItem(null)}>✕</button>
              </div>

              <div className="res-modal-body">
                <div className="res-detail-list">
                  <div className="res-detail-row">
                    <span className="lbl">Khách hàng:</span>
                    <strong>{detailItem.customerName}</strong>
                  </div>
                  <div className="res-detail-row">
                    <span className="lbl">Số điện thoại:</span>
                    <a href={`tel:${detailItem.customerPhone}`}>{detailItem.customerPhone}</a>
                  </div>
                  {detailItem.customerEmail && (
                    <div className="res-detail-row">
                      <span className="lbl">Email:</span>
                      <span>{detailItem.customerEmail}</span>
                    </div>
                  )}
                  <div className="res-detail-row">
                    <span className="lbl">Thời gian hẹn:</span>
                    <strong>
                      {detailItem.reservationTime?.substring(0, 5)} ngày {formatDate(detailItem.reservationDate)}
                    </strong>
                  </div>
                  <div className="res-detail-row">
                    <span className="lbl">Số lượng khách:</span>
                    <span>{detailItem.numberOfGuests} người</span>
                  </div>
                  <div className="res-detail-row">
                    <span className="lbl">Bàn phục vụ:</span>
                    <span>{detailItem.tableNumber ? `Bàn ${detailItem.tableNumber}` : 'Chưa xếp bàn'}</span>
                  </div>
                  <div className="res-detail-row">
                    <span className="lbl">Trạng thái:</span>
                    <span className={`res-badge ${STATUS_CONFIG[detailItem.status]?.cls || ''}`}>
                      {STATUS_CONFIG[detailItem.status]?.label || detailItem.status}
                    </span>
                  </div>
                  {detailItem.note && (
                    <div className="res-detail-row full">
                      <span className="lbl">Ghi chú đặc biệt:</span>
                      <p className="res-detail-note">{detailItem.note}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="res-modal-footer">
                <button
                  type="button"
                  className="res-btn-secondary"
                  onClick={() => {
                    const item = detailItem
                    setDetailItem(null)
                    handleOpenEdit(item)
                  }}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  className="res-btn-primary"
                  onClick={() => setDetailItem(null)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. MODAL: XÁC NHẬN XÓA ─────────────────────────────── */}
        {deleteItem && (
          <div className="res-modal-overlay" onClick={() => setDeleteItem(null)}>
            <div className="res-dialog-confirm" onClick={e => e.stopPropagation()}>
              <div className="res-dialog-warning-icon">!</div>
              <h3>Xác nhận xóa đặt bàn?</h3>
              <p>
                Lượt đặt bàn của <strong>{deleteItem.customerName}</strong> lúc{' '}
                <strong>{deleteItem.reservationTime?.substring(0, 5)} ngày {formatDate(deleteItem.reservationDate)}</strong>{' '}
                sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu.
              </p>
              <div className="res-dialog-actions">
                <button
                  type="button"
                  className="res-btn-secondary"
                  onClick={() => setDeleteItem(null)}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="res-btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. TOAST NOTIFICATIONS ──────────────────────────────── */}
        {toast && (
          <div className={`res-toast-item ${toast.type}`}>
            <span className="res-toast-dot" />
            <span className="res-toast-msg">{toast.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
