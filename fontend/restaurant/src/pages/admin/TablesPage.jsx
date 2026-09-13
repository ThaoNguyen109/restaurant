import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import './TablesPage.css'
import {
  getAllTables,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from '../../services/tableService'

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'AVAILABLE',    label: 'Trống',      icon: '🟢' },
  { value: 'OCCUPIED',     label: 'Đang dùng',  icon: '🔴' },
  { value: 'RESERVED',     label: 'Đặt trước',  icon: '🟡' },
  { value: 'MAINTENANCE',  label: 'Bảo trì',    icon: '🟣' },
  { value: 'INACTIVE',     label: 'Ngừng dùng', icon: '⚫' },
]

const STATUS_CSS = {
  AVAILABLE:   'available',
  OCCUPIED:    'occupied',
  RESERVED:    'reserved',
  MAINTENANCE: 'maintenance',
  INACTIVE:    'inactive',
}

const STATUS_LABEL = {
  AVAILABLE:   'Trống',
  OCCUPIED:    'Đang dùng',
  RESERVED:    'Đặt trước',
  MAINTENANCE: 'Bảo trì',
  INACTIVE:    'Ngừng dùng',
}

const TABLE_ICON = {
  AVAILABLE:   '🪑',
  OCCUPIED:    '🍽️',
  RESERVED:    '📋',
  MAINTENANCE: '🔧',
  INACTIVE:    '❌',
}

const EMPTY_FORM = { tableNumber: '', capacity: '', status: 'AVAILABLE' }

// ────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────
function TablesPage() {
  const [tables, setTables]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [viewMode, setViewMode]     = useState('grid')   // 'grid' | 'list'
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [search, setSearch]         = useState('')
  const [toast, setToast]           = useState(null)

  // Modal
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState(null)    // null = add, object = edit
  const [formData, setFormData]     = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // ── Load data ──────────────────────────────────────────────────
  const loadTables = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllTables()
      setTables(data)
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách bàn', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTables() }, [loadTables])

  // ── Toast helper ───────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Derived stats ──────────────────────────────────────────────
  const stats = {
    all:         tables.length,
    available:   tables.filter(t => t.status === 'AVAILABLE').length,
    occupied:    tables.filter(t => t.status === 'OCCUPIED').length,
    reserved:    tables.filter(t => t.status === 'RESERVED').length,
    maintenance: tables.filter(t => t.status === 'MAINTENANCE').length,
  }

  // ── Filtered list ──────────────────────────────────────────────
  const filteredTables = tables.filter(t => {
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus
    const matchSearch = search === '' ||
      String(t.tableNumber).includes(search) ||
      STATUS_LABEL[t.status]?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  // ── Form helpers ───────────────────────────────────────────────
  const openAddForm = () => {
    setEditTarget(null)
    setFormData(EMPTY_FORM)
    setFormErrors({})
    setShowForm(true)
  }

  const openEditForm = (table) => {
    setEditTarget(table)
    setFormData({
      tableNumber: String(table.tableNumber),
      capacity:    String(table.capacity),
      status:      table.status,
    })
    setFormErrors({})
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false) }

  const validateForm = () => {
    const errors = {}
    const num = parseInt(formData.tableNumber, 10)
    const cap = parseInt(formData.capacity, 10)
    if (!formData.tableNumber || isNaN(num) || num < 1) {
      errors.tableNumber = 'Số bàn phải là số nguyên dương'
    }
    if (!formData.capacity || isNaN(cap) || cap < 1 || cap > 100) {
      errors.capacity = 'Sức chứa từ 1 đến 100 người'
    }
    if (!formData.status) {
      errors.status = 'Vui lòng chọn trạng thái'
    }
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validateForm()
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }

    const payload = {
      tableNumber: parseInt(formData.tableNumber, 10),
      capacity:    parseInt(formData.capacity, 10),
      status:      formData.status,
    }

    try {
      setSubmitting(true)
      if (editTarget) {
        await updateTable(editTarget.id, payload)
        showToast(`Cập nhật bàn số ${payload.tableNumber} thành công`)
      } else {
        await createTable(payload)
        showToast(`Thêm bàn số ${payload.tableNumber} thành công`)
      }
      setShowForm(false)
      loadTables()
    } catch (err) {
      showToast(err.message || 'Thao tác thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Quick status change ────────────────────────────────────────
  const handleQuickStatus = async (id, newStatus, tableNumber) => {
    try {
      await updateTableStatus(id, newStatus)
      setTables(prev =>
        prev.map(t => t.id === id ? { ...t, status: newStatus } : t)
      )
      showToast(`Bàn ${tableNumber}: đổi sang "${STATUS_LABEL[newStatus]}"`)
    } catch (err) {
      showToast(err.message || 'Cập nhật trạng thái thất bại', 'error')
    }
  }

  // ── Delete helpers ─────────────────────────────────────────────
  const openDeleteConfirm = (table) => { setDeleteTarget(table) }
  const closeDeleteConfirm = () => { setDeleteTarget(null) }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteTable(deleteTarget.id)
      showToast(`Đã xóa bàn số ${deleteTarget.tableNumber}`)
      setDeleteTarget(null)
      loadTables()
    } catch (err) {
      showToast(err.message || 'Xóa bàn thất bại', 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────────────────────────────
  const renderStatusBadge = (status) => (
    <span className={`ts-badge ts-${STATUS_CSS[status] || 'inactive'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )

  const renderGridCard = (table) => (
    <div
      key={table.id}
      className={`table-card-item ${STATUS_CSS[table.status] || 'inactive'}`}
    >
      <div className="table-icon-wrap">
        {TABLE_ICON[table.status] || '🪑'}
      </div>
      <div className="table-card-number">Bàn {table.tableNumber}</div>
      <div className="table-card-capacity">
        <span>👥</span>
        <span>{table.capacity} người</span>
      </div>
      <div className={`table-card-status`}>
        {STATUS_LABEL[table.status] || table.status}
      </div>
      <div className="table-card-actions">
        <button
          className="btn-edit-sm"
          onClick={(e) => { e.stopPropagation(); openEditForm(table) }}
          title="Chỉnh sửa"
        >
          ✏️ Sửa
        </button>
        <button
          className="btn-delete-sm"
          onClick={(e) => { e.stopPropagation(); openDeleteConfirm(table) }}
          title="Xóa bàn"
        >
          🗑️ Xóa
        </button>
      </div>
    </div>
  )

  const renderListRow = (table) => (
    <tr key={table.id}>
      <td>
        <div className="table-num-badge">{table.tableNumber}</div>
      </td>
      <td>
        <div className="capacity-display">
          <span>👥</span>
          <span>{table.capacity} người</span>
        </div>
      </td>
      <td>{renderStatusBadge(table.status)}</td>
      <td>
        <select
          className="status-quick-select"
          value={table.status}
          onChange={(e) => handleQuickStatus(table.id, e.target.value, table.tableNumber)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="tbl-actions">
          <button
            className="btn-icon edit"
            onClick={() => openEditForm(table)}
            title="Chỉnh sửa bàn"
          >
            ✏️
          </button>
          <button
            className="btn-icon delete"
            onClick={() => openDeleteConfirm(table)}
            title="Xóa bàn"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  )

  // ────────────────────────────────────────────────────────────────
  // JSX
  // ────────────────────────────────────────────────────────────────
  return (
    <AdminLayout
      title="Quản lý bàn"
      subtitle="Nhà hàng"
      actions={
        <button className="add-table-btn" onClick={openAddForm} id="btn-add-table">
          <span>＋</span>
          <span>Thêm bàn mới</span>
        </button>
      }
    >
      <div className="tables-page">

        {/* ── Stats bar ─────────────────────────────────────────── */}
        <div className="tables-stats-bar">
          <div className="tstat-card">
            <div className="tstat-icon all">🪑</div>
            <div className="tstat-info">
              <span className="tstat-label">Tổng số bàn</span>
              <span className="tstat-value">{stats.all}</span>
            </div>
          </div>
          <div className="tstat-card">
            <div className="tstat-icon avail">✅</div>
            <div className="tstat-info">
              <span className="tstat-label">Bàn trống</span>
              <span className="tstat-value">{stats.available}</span>
            </div>
          </div>
          <div className="tstat-card">
            <div className="tstat-icon occupied">🍽️</div>
            <div className="tstat-info">
              <span className="tstat-label">Đang dùng</span>
              <span className="tstat-value">{stats.occupied}</span>
            </div>
          </div>
          <div className="tstat-card">
            <div className="tstat-icon reserved">📋</div>
            <div className="tstat-info">
              <span className="tstat-label">Đặt trước</span>
              <span className="tstat-value">{stats.reserved}</span>
            </div>
          </div>
          <div className="tstat-card">
            <div className="tstat-icon maint">🔧</div>
            <div className="tstat-info">
              <span className="tstat-label">Bảo trì</span>
              <span className="tstat-value">{stats.maintenance}</span>
            </div>
          </div>
        </div>

        {/* ── Toolbar ───────────────────────────────────────────── */}
        <div className="tables-toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              id="table-search"
              type="text"
              placeholder="Tìm bàn theo số bàn hoặc trạng thái..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            id="table-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>

          <div className="view-toggle">
            <button
              id="view-grid-btn"
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              ▦ Lưới
            </button>
            <button
              id="view-list-btn"
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              ☰ Danh sách
            </button>
          </div>
        </div>

        {/* ── Content ───────────────────────────────────────────── */}
        {loading ? (
          <div className="tables-loading">
            <div className="spinner" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="tables-empty">
            <div className="empty-icon">🪑</div>
            <p>
              {tables.length === 0
                ? 'Chưa có bàn nào. Hãy thêm bàn đầu tiên!'
                : 'Không tìm thấy bàn phù hợp.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="tables-grid">
            {filteredTables.map(renderGridCard)}
          </div>
        ) : (
          <div className="tables-list-card">
            <table className="tables-table">
              <thead>
                <tr>
                  <th>Số bàn</th>
                  <th>Sức chứa</th>
                  <th>Trạng thái</th>
                  <th>Đổi nhanh</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.map(renderListRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────── */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTarget ? `Chỉnh sửa Bàn ${editTarget.tableNumber}` : 'Thêm bàn mới'}</h2>
              <button className="modal-close" onClick={closeForm} aria-label="Đóng">✕</button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit} noValidate>
              {/* Số bàn */}
              <div className="form-field">
                <label htmlFor="field-table-number">Số bàn <span style={{ color: '#ef5350' }}>*</span></label>
                <input
                  id="field-table-number"
                  type="number"
                  min="1"
                  placeholder="Nhập số bàn (VD: 1, 2, 3...)"
                  value={formData.tableNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, tableNumber: e.target.value }))}
                />
                {formErrors.tableNumber && (
                  <span className="field-error">{formErrors.tableNumber}</span>
                )}
              </div>

              {/* Sức chứa */}
              <div className="form-field">
                <label htmlFor="field-capacity">Sức chứa (người) <span style={{ color: '#ef5350' }}>*</span></label>
                <input
                  id="field-capacity"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Số người tối đa (VD: 4, 6, 8...)"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                />
                {formErrors.capacity && (
                  <span className="field-error">{formErrors.capacity}</span>
                )}
              </div>

              {/* Trạng thái */}
              <div className="form-field">
                <label htmlFor="field-status">Trạng thái</label>
                <select
                  id="field-status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
                {formErrors.status && (
                  <span className="field-error">{formErrors.status}</span>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={closeForm}>
                  Huỷ
                </button>
                <button type="submit" className="btn-submit" disabled={submitting} id="btn-submit-table">
                  {submitting
                    ? 'Đang lưu...'
                    : editTarget ? 'Cập nhật' : 'Thêm bàn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>Xác nhận xóa bàn</h3>
            <p>
              Bạn có chắc muốn xóa <strong>Bàn số {deleteTarget.tableNumber}</strong>?<br />
              Bàn sẽ được đặt thành "Ngừng dùng" (có thể khôi phục).
            </p>
            <div className="confirm-btns">
              <button className="btn-cancel" onClick={closeDeleteConfirm}>
                Huỷ
              </button>
              <button
                className="btn-danger-confirm"
                onClick={confirmDelete}
                disabled={deleting}
                id="btn-confirm-delete"
              >
                {deleting ? 'Đang xóa...' : 'Xóa bàn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && (
        <div className={`toast-message ${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </AdminLayout>
  )
}

export default TablesPage
