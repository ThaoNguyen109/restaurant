import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/pages/admin/TablesPage.css'
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
  { value: 'ALL',         label: 'Tất cả' },
  { value: 'AVAILABLE',   label: 'Bàn trống',    cls: 'st-available'   },
  { value: 'OCCUPIED',    label: 'Đang dùng',    cls: 'st-occupied'    },
  { value: 'RESERVED',    label: 'Đặt trước',    cls: 'st-reserved'    },
  { value: 'MAINTENANCE', label: 'Bảo trì',      cls: 'st-maintenance' },
  { value: 'INACTIVE',    label: 'Ngừng dùng',   cls: 'st-inactive'    },
]

const STATUS_MAP = {
  AVAILABLE:   { label: 'Bàn trống',    cls: 'st-available'   },
  OCCUPIED:    { label: 'Đang dùng',    cls: 'st-occupied'    },
  RESERVED:    { label: 'Đặt trước',    cls: 'st-reserved'    },
  MAINTENANCE: { label: 'Bảo trì',      cls: 'st-maintenance' },
  INACTIVE:    { label: 'Ngừng dùng',   cls: 'st-inactive'    },
}

const EMPTY_FORM = { tableNumber: '', capacity: '', status: 'AVAILABLE' }

export default function TablesPage() {
  const [tables, setTables]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [viewMode, setViewMode]         = useState('grid') // 'grid' | 'table'
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [search, setSearch]             = useState('')
  const [toast, setToast]               = useState(null)

  // Modal Thêm / Sửa
  const [showForm, setShowForm]         = useState(false)
  const [editTarget, setEditTarget]     = useState(null) // null = add, object = edit
  const [formData, setFormData]         = useState(EMPTY_FORM)
  const [formErrors, setFormErrors]     = useState({})
  const [submitting, setSubmitting]     = useState(false)

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // ── Load data ──────────────────────────────────────────────────
  const loadTables = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllTables()
      setTables(Array.isArray(data) ? data : [])
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

  // ── Stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    all:         tables.length,
    available:   tables.filter(t => t.status === 'AVAILABLE').length,
    occupied:    tables.filter(t => t.status === 'OCCUPIED').length,
    reserved:    tables.filter(t => t.status === 'RESERVED').length,
    maintenance: tables.filter(t => t.status === 'MAINTENANCE').length,
  }), [tables])

  // ── Filtered list ──────────────────────────────────────────────
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      const matchStatus = filterStatus === 'ALL' || t.status === filterStatus
      const matchSearch = search.trim() === '' ||
        String(t.tableNumber).includes(search.trim()) ||
        STATUS_MAP[t.status]?.label.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [tables, filterStatus, search])

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
      errors.capacity = 'Sức chứa hợp lệ từ 1 đến 100 người'
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
        showToast(`Đã cập nhật Bàn ${payload.tableNumber} thành công`)
      } else {
        await createTable(payload)
        showToast(`Đã thêm Bàn ${payload.tableNumber} mới thành công`)
      }
      closeForm()
      loadTables()
    } catch (err) {
      showToast(err.message || 'Lưu bàn thất bại', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQuickStatus = async (tableId, newStatus, tableNumber) => {
    try {
      await updateTableStatus(tableId, newStatus)
      showToast(`Đã đổi trạng thái Bàn ${tableNumber} sang "${STATUS_MAP[newStatus]?.label}"`)
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: newStatus } : t))
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái', 'error')
    }
  }

  const openDeleteConfirm = (table) => { setDeleteTarget(table) }
  const closeDeleteConfirm = () => { setDeleteTarget(null) }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteTable(deleteTarget.id)
      showToast(`Đã xóa Bàn ${deleteTarget.tableNumber} khỏi hệ thống`)
      closeDeleteConfirm()
      loadTables()
    } catch (err) {
      showToast(err.message || 'Xóa bàn thất bại', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout
      title="Quản lý bàn ăn"
      subtitle="Sơ đồ bố trí chỗ ngồi & quản trị trạng thái phục vụ"
      actions={
        <div className="tbl-topbar-actions">
          <a href="/staff" className="tbl-nav-link">
            Sơ đồ sảnh phục vụ
          </a>
          <button className="tbl-btn-refresh" onClick={loadTables} title="Tải lại danh sách">
            Làm mới
          </button>
          <button className="tbl-btn-primary" onClick={openAddForm}>
            + Thêm bàn mới
          </button>
        </div>
      }
    >
      <div className="tables-admin-page">
        {/* ── 1. METRIC CARDS ────────────────────────────────────── */}
        <div className="tbl-metrics-grid">
          <div
            className={`tbl-metric-card${filterStatus === 'ALL' ? ' active' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            <div className="tbl-metric-head">
              <span className="tbl-metric-label">Tổng số bàn</span>
              <span className="tbl-metric-pill neutral">Tất cả</span>
            </div>
            <div className="tbl-metric-val">{stats.all}</div>
            <div className="tbl-metric-sub">Toàn bộ bàn trong hệ thống</div>
          </div>

          <div
            className={`tbl-metric-card${filterStatus === 'AVAILABLE' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
          >
            <div className="tbl-metric-head">
              <span className="tbl-metric-label">Bàn đang trống</span>
              <span className="tbl-metric-pill success">Sẵn sàng</span>
            </div>
            <div className="tbl-metric-val text-emerald">{stats.available}</div>
            <div className="tbl-metric-sub">Sẵn sàng đón tiếp khách mới</div>
          </div>

          <div
            className={`tbl-metric-card${filterStatus === 'OCCUPIED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'OCCUPIED' ? 'ALL' : 'OCCUPIED')}
          >
            <div className="tbl-metric-head">
              <span className="tbl-metric-label">Đang có khách</span>
              <span className="tbl-metric-pill info">Đang dùng</span>
            </div>
            <div className="tbl-metric-val text-blue">{stats.occupied}</div>
            <div className="tbl-metric-sub">Đang phục vụ ẩm thực tại bàn</div>
          </div>

          <div
            className={`tbl-metric-card${filterStatus === 'RESERVED' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'RESERVED' ? 'ALL' : 'RESERVED')}
          >
            <div className="tbl-metric-head">
              <span className="tbl-metric-label">Đã đặt trước</span>
              <span className="tbl-metric-pill warning">Giữ chỗ</span>
            </div>
            <div className="tbl-metric-val text-amber">{stats.reserved}</div>
            <div className="tbl-metric-sub">Đã xác nhận đặt chỗ hẹn giờ</div>
          </div>

          <div
            className={`tbl-metric-card${filterStatus === 'MAINTENANCE' ? ' active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === 'MAINTENANCE' ? 'ALL' : 'MAINTENANCE')}
          >
            <div className="tbl-metric-head">
              <span className="tbl-metric-label">Bảo trì / Tạm ngưng</span>
              <span className="tbl-metric-pill dark">Bảo trì</span>
            </div>
            <div className="tbl-metric-val text-slate">{stats.maintenance}</div>
            <div className="tbl-metric-sub">Đang sửa chữa hoặc dọn dẹp</div>
          </div>
        </div>

        {/* ── 2. TOOLBAR & STATUS TABS ───────────────────────────── */}
        <div className="tbl-control-panel">
          {/* Status Tabs */}
          <div className="tbl-status-tabs">
            {STATUS_OPTIONS.map(opt => {
              const count = opt.value === 'ALL'
                ? stats.all
                : tables.filter(t => t.status === opt.value).length
              const isActive = filterStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`tbl-tab-btn${isActive ? ' active' : ''}`}
                  onClick={() => setFilterStatus(opt.value)}
                >
                  <span>{opt.label}</span>
                  <span className="tbl-tab-count">{count}</span>
                </button>
              )
            })}
          </div>

          {/* Search & View Toggle */}
          <div className="tbl-filter-row">
            <div className="tbl-search-box">
              <input
                type="text"
                placeholder="Tìm kiếm số bàn (vd: 1, 10) hoặc trạng thái..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="tbl-search-clear"
                  onClick={() => setSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="tbl-view-toggle">
              <button
                type="button"
                className={`tbl-view-btn${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Xem dạng thẻ sơ đồ"
              >
                Sơ đồ thẻ
              </button>
              <button
                type="button"
                className={`tbl-view-btn${viewMode === 'table' ? ' active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Xem dạng danh sách bảng"
              >
                Bảng
              </button>
            </div>

            {(search || filterStatus !== 'ALL') && (
              <button
                type="button"
                className="tbl-btn-reset"
                onClick={() => { setSearch(''); setFilterStatus('ALL') }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* ── 3. DATA VIEW: GRID OR TABLE ────────────────────────── */}
        {loading ? (
          <div className="tbl-state-box">
            <div className="tbl-spinner" />
            <div className="tbl-state-title">Đang tải danh sách bàn ăn...</div>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="tbl-state-box">
            <div className="tbl-state-title">Không tìm thấy bàn nào</div>
            <div className="tbl-state-desc">
              {search || filterStatus !== 'ALL'
                ? 'Không có bàn nào phù hợp với điều kiện tìm kiếm hiện tại.'
                : 'Chưa có bàn nào được cấu hình trong hệ thống.'}
            </div>
            <button type="button" className="tbl-btn-primary" onClick={openAddForm}>
              + Tạo bàn mới ngay
            </button>
          </div>
        ) : viewMode === 'grid' ? (

          /* ── GRID VIEW (Sơ đồ thẻ bàn ăn) ─────────────────────── */
          <div className="tbl-cards-grid">
            {filteredTables.map(table => {
              const st = STATUS_MAP[table.status] || STATUS_MAP.AVAILABLE
              return (
                <div key={table.id} className={`tbl-table-card ${st.cls}`}>
                  <div className="tbl-card-head">
                    <div className="tbl-card-number">Bàn {table.tableNumber}</div>
                    <span className={`tbl-status-badge ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="tbl-card-body">
                    <div className="tbl-card-capacity">
                      <span className="tbl-cap-val">{table.capacity}</span>
                      <span className="tbl-cap-lbl">chỗ ngồi</span>
                    </div>
                    <div className="tbl-quick-change">
                      <select
                        value={table.status}
                        onChange={e => handleQuickStatus(table.id, e.target.value, table.tableNumber)}
                        title="Đổi nhanh trạng thái"
                      >
                        <option value="AVAILABLE">Trống</option>
                        <option value="OCCUPIED">Đang dùng</option>
                        <option value="RESERVED">Đặt trước</option>
                        <option value="MAINTENANCE">Bảo trì</option>
                        <option value="INACTIVE">Ngừng dùng</option>
                      </select>
                    </div>
                  </div>

                  <div className="tbl-card-foot">
                    <button
                      type="button"
                      className="tbl-act-btn edit"
                      onClick={() => openEditForm(table)}
                    >
                      Chỉnh sửa
                    </button>
                    <button
                      type="button"
                      className="tbl-act-btn delete"
                      onClick={() => openDeleteConfirm(table)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

        ) : (

          /* ── TABLE VIEW (Danh sách dạng bảng) ─────────────────── */
          <div className="tbl-table-wrap">
            <table className="tbl-data-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Số bàn</th>
                  <th style={{ width: '140px' }}>Sức chứa</th>
                  <th>Trạng thái</th>
                  <th style={{ width: '180px' }}>Chuyển trạng thái nhanh</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.map(table => {
                  const st = STATUS_MAP[table.status] || STATUS_MAP.AVAILABLE
                  return (
                    <tr key={table.id}>
                      <td>
                        <span className="tbl-num-tag">Bàn {table.tableNumber}</span>
                      </td>
                      <td>
                        <span className="tbl-cap-text">{table.capacity} khách</span>
                      </td>
                      <td>
                        <span className={`tbl-status-badge ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td>
                        <select
                          className="tbl-quick-select"
                          value={table.status}
                          onChange={e => handleQuickStatus(table.id, e.target.value, table.tableNumber)}
                        >
                          <option value="AVAILABLE">Trống</option>
                          <option value="OCCUPIED">Đang dùng</option>
                          <option value="RESERVED">Đặt trước</option>
                          <option value="MAINTENANCE">Bảo trì</option>
                          <option value="INACTIVE">Ngừng dùng</option>
                        </select>
                      </td>
                      <td>
                        <div className="tbl-actions-cell">
                          <button
                            type="button"
                            className="tbl-act-btn edit"
                            onClick={() => openEditForm(table)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="tbl-act-btn delete"
                            onClick={() => openDeleteConfirm(table)}
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

        {/* ── 4. MODAL: THÊM / SỬA BÀN ───────────────────────────── */}
        {showForm && (
          <div className="tbl-modal-overlay" onClick={closeForm}>
            <div className="tbl-modal-dialog" onClick={e => e.stopPropagation()}>
              <div className="tbl-modal-header">
                <h2>{editTarget ? `Chỉnh sửa Bàn ${editTarget.tableNumber}` : 'Thêm bàn mới'}</h2>
                <button type="button" className="tbl-modal-close" onClick={closeForm}>✕</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="tbl-modal-body">
                  <div className="tbl-form-group">
                    <label>Số bàn <span className="req">*</span></label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ví dụ: 1, 2, 12..."
                      value={formData.tableNumber}
                      onChange={e => setFormData({ ...formData, tableNumber: e.target.value })}
                      autoFocus
                    />
                    {formErrors.tableNumber && (
                      <span className="tbl-form-err">{formErrors.tableNumber}</span>
                    )}
                  </div>

                  <div className="tbl-form-group">
                    <label>Sức chứa (số khách tối đa) <span className="req">*</span></label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Ví dụ: 4, 6, 10..."
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                    />
                    {formErrors.capacity && (
                      <span className="tbl-form-err">{formErrors.capacity}</span>
                    )}
                  </div>

                  <div className="tbl-form-group">
                    <label>Trạng thái khởi tạo</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="AVAILABLE">Bàn trống (Sẵn sàng phục vụ)</option>
                      <option value="OCCUPIED">Đang có khách dùng</option>
                      <option value="RESERVED">Đã đặt trước</option>
                      <option value="MAINTENANCE">Bảo trì / Vệ sinh</option>
                      <option value="INACTIVE">Tạm ngưng phục vụ</option>
                    </select>
                  </div>
                </div>

                <div className="tbl-modal-footer">
                  <button
                    type="button"
                    className="tbl-btn-secondary"
                    onClick={closeForm}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="tbl-btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang lưu...' : editTarget ? 'Cập nhật bàn' : 'Tạo bàn'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 5. MODAL: XÁC NHẬN XÓA BÀN ─────────────────────────── */}
        {deleteTarget && (
          <div className="tbl-modal-overlay" onClick={closeDeleteConfirm}>
            <div className="tbl-dialog-confirm" onClick={e => e.stopPropagation()}>
              <div className="tbl-dialog-warning-icon">!</div>
              <h3>Xác nhận xóa Bàn {deleteTarget.tableNumber}?</h3>
              <p>
                Bàn này cùng lịch sử liên quan sẽ bị xóa khỏi hệ thống.
                Hành động này không thể hoàn tác.
              </p>
              <div className="tbl-dialog-actions">
                <button
                  type="button"
                  className="tbl-btn-secondary"
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="tbl-btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. TOAST NOTIFICATIONS ─────────────────────────────── */}
        {toast && (
          <div className={`tbl-toast-item ${toast.type}`}>
            <span className="tbl-toast-dot" />
            <span className="tbl-toast-msg">{toast.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
