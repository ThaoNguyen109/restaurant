import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import './ReservationsPage.css'
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
  PENDING:   { label: 'Chờ duyệt',    cls: 'res-pending',   icon: '⏳' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'res-confirmed', icon: '✅' },
  COMPLETED: { label: 'Hoàn thành',  cls: 'res-completed', icon: '🎉' },
  CANCELLED: { label: 'Đã hủy',      cls: 'res-cancelled', icon: '❌' },
  NO_SHOW:   { label: 'Vắng mặt',    cls: 'res-no_show',   icon: '⚠️' },
}

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  tableId: '',
  reservationDate: new Date().toISOString().split('T')[0],
  reservationTime: '18:00',
  numberOfGuests: 2,
  note: '',
  status: 'PENDING',
}

function ReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [todayCount, setTodayCount] = useState(0)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Toast
  const [toast, setToast] = useState(null)

  // Modals
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null) // null = Create, object = Edit
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // View detail modal
  const [detailItem, setDetailItem] = useState(null)

  // Confirm delete modal
  const [deleteItem, setDeleteItem] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── Toast helper ───────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Load Data ──────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (filterStatus) params.status = filterStatus
      if (filterDate) params.date = filterDate

      const [resData, countData, tableData] = await Promise.all([
        getAllReservations(params),
        getTodayReservationCount(),
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
  }, [search, filterStatus, filterDate])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Stats Calculation ──────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      all: reservations.length,
      today: todayCount,
      pending: reservations.filter((r) => r.status === 'PENDING').length,
      confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
      cancelled: reservations.filter((r) => r.status === 'CANCELLED').length,
    }
  }, [reservations, todayCount])

  // ── Handlers ───────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSearch('')
    setFilterStatus('')
    setFilterDate('')
  }

  const handleOpenCreate = () => {
    setEditItem(null)
    setFormData({
      ...EMPTY_FORM,
      reservationDate: new Date().toISOString().split('T')[0],
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleOpenEdit = (item) => {
    setEditItem(item)
    setFormData({
      customerName: item.customerName || '',
      customerPhone: item.customerPhone || '',
      customerEmail: item.customerEmail || '',
      tableId: item.tableId || '',
      reservationDate: item.reservationDate || '',
      reservationTime: item.reservationTime ? item.reservationTime.substring(0, 5) : '18:00',
      numberOfGuests: item.numberOfGuests || 2,
      note: item.note || '',
      status: item.status || 'PENDING',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditItem(null)
    setFormErrors({})
  }

  const handleQuickStatusChange = async (id, newStatus) => {
    try {
      await updateReservationStatus(id, newStatus)
      showToast(`Đã chuyển trạng thái sang "${STATUS_CONFIG[newStatus]?.label || newStatus}"`)
      loadData()
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error')
    }
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
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Vui lòng nhập email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail.trim())) {
      errors.customerEmail = 'Email không hợp lệ'
    }
    if (!formData.reservationDate) {
      errors.reservationDate = 'Vui lòng chọn ngày đặt bàn'
    }
    if (!formData.reservationTime) {
      errors.reservationTime = 'Vui lòng chọn giờ đặt bàn'
    }
    if (!formData.numberOfGuests || Number(formData.numberOfGuests) < 1) {
      errors.numberOfGuests = 'Số khách ít nhất là 1'
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
      customerEmail: formData.customerEmail.trim(),
      tableId: formData.tableId ? Number(formData.tableId) : null,
      reservationDate: formData.reservationDate,
      reservationTime: formData.reservationTime,
      numberOfGuests: Number(formData.numberOfGuests),
      note: formData.note ? formData.note.trim() : null,
      status: formData.status || 'PENDING',
    }

    try {
      setSubmitting(true)
      if (editItem) {
        await updateReservation(editItem.id, payload)
        showToast('Cập nhật thông tin đặt bàn thành công')
      } else {
        await createReservation(payload)
        showToast('Tạo đặt bàn mới thành công')
      }
      handleCloseModal()
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu đặt bàn', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    try {
      setDeleting(true)
      await deleteReservation(deleteItem.id)
      showToast('Đã xóa đặt bàn thành công')
      setDeleteItem(null)
      loadData()
    } catch (err) {
      showToast(err.message || 'Xóa đặt bàn thất bại', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout
      title="Quản lý đặt bàn"
      subtitle="Quản trị đặt chỗ & phân bổ bàn cho khách hàng"
      actions={
        <button className="res-add-btn" id="btn-add-reservation" onClick={handleOpenCreate}>
          <span>+</span>
          <span>Thêm đặt bàn mới</span>
        </button>
      }
    >
      <div className="reservations-page">
        {/* ── 1. STATS BAR ────────────────────────────────────────── */}
        <div className="res-stats-bar">
          <div className="res-stat-card">
            <div className="res-stat-icon all">📋</div>
            <div className="res-stat-info">
              <span className="res-stat-label">Tổng đặt bàn</span>
              <span className="res-stat-value">{stats.all}</span>
            </div>
          </div>
          <div className="res-stat-card">
            <div className="res-stat-icon today">📅</div>
            <div className="res-stat-info">
              <span className="res-stat-label">Hôm nay</span>
              <span className="res-stat-value">{stats.today}</span>
            </div>
          </div>
          <div className="res-stat-card">
            <div className="res-stat-icon pending">⏳</div>
            <div className="res-stat-info">
              <span className="res-stat-label">Chờ duyệt</span>
              <span className="res-stat-value">{stats.pending}</span>
            </div>
          </div>
          <div className="res-stat-card">
            <div className="res-stat-icon confirmed">✅</div>
            <div className="res-stat-info">
              <span className="res-stat-label">Đã xác nhận</span>
              <span className="res-stat-value">{stats.confirmed}</span>
            </div>
          </div>
          <div className="res-stat-card">
            <div className="res-stat-icon cancelled">❌</div>
            <div className="res-stat-info">
              <span className="res-stat-label">Đã hủy</span>
              <span className="res-stat-value">{stats.cancelled}</span>
            </div>
          </div>
        </div>

        {/* ── 2. TOOLBAR ─────────────────────────────────────────── */}
        <div className="res-toolbar">
          <div className="res-search-box">
            <span className="res-search-icon">🔍</span>
            <input
              type="text"
              id="res-search-input"
              placeholder="Tìm theo tên, SĐT hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="res-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">-- Tất cả trạng thái --</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
            <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            <option value="NO_SHOW">Vắng mặt (NO_SHOW)</option>
          </select>

          <input
            type="date"
            id="res-filter-date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            title="Lọc theo ngày đặt"
          />

          {(search || filterStatus || filterDate) && (
            <button className="btn-clear-filter" onClick={handleClearFilters}>
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>

        {/* ── 3. RESERVATIONS DATA TABLE ──────────────────────────── */}
        <div className="res-table-card">
          {loading ? (
            <div className="res-loading">
              <div className="res-spinner" />
              <span>Đang tải danh sách đặt bàn...</span>
            </div>
          ) : reservations.length === 0 ? (
            <div className="res-empty">
              <span className="empty-icon">🍽️</span>
              <p>Không tìm thấy lượt đặt bàn nào phù hợp.</p>
            </div>
          ) : (
            <table className="res-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Khách hàng</th>
                  <th>Ngày & Giờ</th>
                  <th>Số khách</th>
                  <th>Bàn gán</th>
                  <th>Trạng thái</th>
                  <th>Đổi trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => {
                  const cfg = STATUS_CONFIG[res.status] || {
                    label: res.status,
                    cls: 'res-pending',
                    icon: '•',
                  }
                  return (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 700, color: '#6b7280' }}>#{res.id}</td>
                      <td>
                        <div className="res-customer-cell">
                          <span className="res-customer-name">{res.customerName}</span>
                          <span className="res-customer-phone">📞 {res.customerPhone}</span>
                          {res.customerEmail && (
                            <span className="res-customer-email">✉️ {res.customerEmail}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="res-datetime">
                          <span className="res-date">{res.reservationDate}</span>
                          <span className="res-time">
                            ⏰ {res.reservationTime ? res.reservationTime.substring(0, 5) : '--'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="res-guests">👥 {res.numberOfGuests} người</span>
                      </td>
                      <td>
                        {res.tableNumber ? (
                          <span className="res-table-badge" title={`Bàn số ${res.tableNumber}`}>
                            Bàn {res.tableNumber}
                          </span>
                        ) : (
                          <span className="res-no-table">Chưa gán</span>
                        )}
                      </td>
                      <td>
                        <span className={`res-badge ${cfg.cls}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <select
                          className="res-status-select"
                          value={res.status}
                          onChange={(e) => handleQuickStatusChange(res.id, e.target.value)}
                        >
                          <option value="PENDING">Chờ duyệt</option>
                          <option value="CONFIRMED">Xác nhận</option>
                          <option value="COMPLETED">Hoàn thành</option>
                          <option value="CANCELLED">Hủy đặt</option>
                          <option value="NO_SHOW">Vắng mặt</option>
                        </select>
                      </td>
                      <td>
                        <div className="res-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="res-btn-icon view"
                            title="Xem chi tiết"
                            onClick={() => setDetailItem(res)}
                          >
                            👁️
                          </button>
                          <button
                            className="res-btn-icon edit"
                            title="Chỉnh sửa & Gán bàn"
                            onClick={() => handleOpenEdit(res)}
                          >
                            ✏️
                          </button>
                          <button
                            className="res-btn-icon delete"
                            title="Xóa đặt bàn"
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
          )}
        </div>
      </div>

      {/* ── MODAL: CREATE / EDIT RESERVATION ──────────────────────── */}
      {showModal && (
        <div className="res-modal-overlay" onClick={handleCloseModal}>
          <div className="res-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="res-modal-header">
              <h2>{editItem ? `Chỉnh sửa đặt bàn #${editItem.id}` : 'Thêm đặt bàn mới'}</h2>
              <button className="res-modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form className="res-modal-form" onSubmit={handleSubmit}>
              <div className="res-form-field">
                <label>Tên khách hàng *</label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
                {formErrors.customerName && (
                  <span className="field-error">{formErrors.customerName}</span>
                )}
              </div>

              <div className="res-form-row">
                <div className="res-form-field">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    placeholder="VD: 0912345678"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                  {formErrors.customerPhone && (
                    <span className="field-error">{formErrors.customerPhone}</span>
                  )}
                </div>

                <div className="res-form-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="VD: khachhang@gmail.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  />
                  {formErrors.customerEmail && (
                    <span className="field-error">{formErrors.customerEmail}</span>
                  )}
                </div>
              </div>

              <div className="res-form-row">
                <div className="res-form-field">
                  <label>Ngày dùng bữa *</label>
                  <input
                    type="date"
                    value={formData.reservationDate}
                    onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                  />
                  {formErrors.reservationDate && (
                    <span className="field-error">{formErrors.reservationDate}</span>
                  )}
                </div>

                <div className="res-form-field">
                  <label>Giờ dùng bữa *</label>
                  <input
                    type="time"
                    value={formData.reservationTime}
                    onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                  />
                  {formErrors.reservationTime && (
                    <span className="field-error">{formErrors.reservationTime}</span>
                  )}
                </div>
              </div>

              <div className="res-form-row">
                <div className="res-form-field">
                  <label>Số lượng khách *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.numberOfGuests}
                    onChange={(e) => setFormData({ ...formData, numberOfGuests: e.target.value })}
                  />
                  {formErrors.numberOfGuests && (
                    <span className="field-error">{formErrors.numberOfGuests}</span>
                  )}
                </div>

                <div className="res-form-field">
                  <label>Gán bàn phục vụ</label>
                  <select
                    value={formData.tableId}
                    onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                  >
                    <option value="">-- Chưa gán bàn --</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Bàn {t.tableNumber} ({t.capacity} chỗ - {t.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {editItem && (
                <div className="res-form-field">
                  <label>Trạng thái đặt bàn</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDING">Chờ duyệt (PENDING)</option>
                    <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
                    <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                    <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    <option value="NO_SHOW">Vắng mặt (NO_SHOW)</option>
                  </select>
                </div>
              )}

              <div className="res-form-field">
                <label>Ghi chú của khách hàng</label>
                <textarea
                  rows="3"
                  placeholder="Yêu cầu vị trí, dị ứng thức ăn, dịp kỷ niệm..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="res-modal-footer">
                <button type="button" className="res-btn-cancel" onClick={handleCloseModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="res-btn-submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editItem ? 'Cập nhật' : 'Tạo đặt bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW DETAILS ───────────────────────────────────── */}
      {detailItem && (
        <div className="res-modal-overlay" onClick={() => setDetailItem(null)}>
          <div className="res-detail-box" onClick={(e) => e.stopPropagation()}>
            <div className="res-modal-header">
              <h2>Chi tiết đặt bàn #{detailItem.id}</h2>
              <button className="res-modal-close" onClick={() => setDetailItem(null)}>
                ✕
              </button>
            </div>

            <div className="res-detail-grid">
              <div className="res-detail-item">
                <span className="detail-label">Khách hàng</span>
                <span className="detail-value">{detailItem.customerName}</span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Số điện thoại</span>
                <span className="detail-value">{detailItem.customerPhone}</span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{detailItem.customerEmail || '—'}</span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Số lượng khách</span>
                <span className="detail-value">{detailItem.numberOfGuests} người</span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Ngày dùng bữa</span>
                <span className="detail-value">{detailItem.reservationDate}</span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Giờ dùng bữa</span>
                <span className="detail-value">
                  {detailItem.reservationTime ? detailItem.reservationTime.substring(0, 5) : '—'}
                </span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Bàn được gán</span>
                <span className="detail-value">
                  {detailItem.tableNumber ? `Bàn số ${detailItem.tableNumber}` : 'Chưa gán'}
                </span>
              </div>
              <div className="res-detail-item">
                <span className="detail-label">Trạng thái</span>
                <span className="detail-value">
                  <span className={`res-badge ${STATUS_CONFIG[detailItem.status]?.cls || ''}`}>
                    {STATUS_CONFIG[detailItem.status]?.label || detailItem.status}
                  </span>
                </span>
              </div>
              <div className="res-detail-item full">
                <span className="detail-label">Ghi chú</span>
                <div className="res-detail-note">
                  {detailItem.note || 'Không có ghi chú nào.'}
                </div>
              </div>
            </div>

            <div className="res-modal-footer">
              <button
                type="button"
                className="res-btn-cancel"
                onClick={() => setDetailItem(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="res-btn-submit"
                onClick={() => {
                  const item = detailItem
                  setDetailItem(null)
                  handleOpenEdit(item)
                }}
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM DELETE ─────────────────────────────────── */}
      {deleteItem && (
        <div className="res-modal-overlay" onClick={() => setDeleteItem(null)}>
          <div className="res-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">🗑️</div>
            <h3>Xác nhận xóa đặt bàn</h3>
            <p>
              Bạn có chắc chắn muốn xóa đặt bàn của khách hàng{' '}
              <strong>{deleteItem.customerName}</strong> (Mã #{deleteItem.id})? Hành động này không thể hoàn tác.
            </p>
            <div className="res-confirm-btns">
              <button
                type="button"
                className="res-btn-cancel"
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

      {/* ── TOAST NOTIFICATION ────────────────────────────────────── */}
      {toast && (
        <div className={`res-toast ${toast.type}`}>
          {toast.type === 'success' ? '✅ ' : '⚠️ '}
          {toast.message}
        </div>
      )}
    </AdminLayout>
  )
}

export default ReservationsPage
