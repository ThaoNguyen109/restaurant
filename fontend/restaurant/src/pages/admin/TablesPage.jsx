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

  // QR Code Modal
  const [qrTable, setQrTable]           = useState(null)
  const [qrServerIp, setQrServerIp]     = useState(
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '192.168.1.227'
      : (typeof window !== 'undefined' ? window.location.hostname : 'localhost')
  )

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
        <div className="tbl-metrics-grid" style={{ marginBottom: 16 }}>
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

        {/* ── 2. STATUS TABS (Hàng trạng thái bàn) ──────────────── */}
        <div style={{ marginBottom: 12 }}>
          <div className="admin-tabs">
            {STATUS_OPTIONS.map(opt => {
              const count = opt.value === 'ALL'
                ? stats.all
                : tables.filter(t => t.status === opt.value).length
              const isActive = filterStatus === opt.value
              let countCls = ''
              if (opt.value === 'AVAILABLE') countCls = ' success'
              else if (opt.value === 'OCCUPIED') countCls = ' info'
              else if (opt.value === 'RESERVED') countCls = ' warning'
              else if (opt.value === 'MAINTENANCE') countCls = ' danger'

              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`admin-tab-item${isActive ? ' active' : ''}`}
                  onClick={() => setFilterStatus(opt.value)}
                >
                  <span>{opt.label}</span>
                  <span className={`admin-tab-count${countCls}`}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── 2. SEARCH & CONTROLS TOOLBAR (Thanh tìm kiếm bên trái dài & đẹp) ── */}
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
              placeholder="Tìm kiếm số bàn (vd: 1, 10)..."
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

          {/* Right Controls: View Toggle & Reset */}
          <div className="admin-toolbar-right">
            {/* View Mode Toggle */}
            <div className="admin-segmented-group" style={{ height: 42, borderRadius: 12 }}>
              <button
                type="button"
                className={`admin-segmented-btn${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Xem dạng thẻ sơ đồ"
              >
                Sơ đồ thẻ
              </button>
              <button
                type="button"
                className={`admin-segmented-btn${viewMode === 'table' ? ' active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Xem dạng danh sách bảng"
              >
                Bảng
              </button>
            </div>

            {/* Clear Filters Button */}
            {(search || filterStatus !== 'ALL') && (
              <button
                type="button"
                className="admin-btn-reset"
                style={{ height: 42, borderRadius: 12 }}
                onClick={() => { setSearch(''); setFilterStatus('ALL') }}
              >
                ✕ Xóa lọc
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
                      className="tbl-act-btn qr"
                      onClick={() => setQrTable(table)}
                      title="Xem mã QR gọi món"
                      style={{ background: '#fdf2f8', color: '#be185d', borderColor: '#fbcfe8' }}
                    >
                      📱 QR
                    </button>
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
                    <tr
                      key={table.id}
                      className="clickable-row"
                      onClick={() => openEditForm(table)}
                      style={{ cursor: 'pointer' }}
                      title="Bấm để xem chi tiết và chỉnh sửa bàn"
                    >
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
                          onClick={e => e.stopPropagation()}
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
                            className="tbl-act-btn qr"
                            onClick={(e) => {
                              e.stopPropagation()
                              setQrTable(table)
                            }}
                            title="Xem mã QR gọi món"
                            style={{ background: '#fdf2f8', color: '#be185d', borderColor: '#fbcfe8' }}
                          >
                            QR
                          </button>
                          <button
                            type="button"
                            className="tbl-act-btn edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditForm(table)
                            }}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="tbl-act-btn delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteConfirm(table)
                            }}
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

        {/* ── MODAL: MÃ QR GỌI MÓN CỦA BÀN ────────────────────────── */}
        {qrTable && (() => {
          const currentPort = window.location.port ? `:${window.location.port}` : ''
          const currentProtocol = window.location.protocol || 'http:'
          const baseUrl = `${currentProtocol}//${qrServerIp.trim() || 'localhost'}${currentPort}`
          const qrUrl = `${baseUrl}/order?tableId=${qrTable.id}&tableNumber=${qrTable.tableNumber}`
          const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`

          return (
            <div className="tbl-modal-overlay" onClick={() => setQrTable(null)}>
              <div className="tbl-modal-dialog" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
                <div className="tbl-modal-header">
                  <h2>Mã QR Gọi Món - Bàn {qrTable.tableNumber}</h2>
                  <button type="button" className="tbl-modal-close" onClick={() => setQrTable(null)}>✕</button>
                </div>
                <div className="tbl-modal-body" style={{ textAlign: 'center' }}>
                  <div style={{
                    border: '2px solid #fbcfe8',
                    borderRadius: '16px',
                    padding: '20px',
                    background: '#fff',
                    boxShadow: '0 4px 12px rgba(216, 104, 136, 0.08)',
                    marginBottom: '16px',
                  }}>
                    <h3 style={{ margin: '0 0 4px 0', color: '#b84d6e', fontSize: '18px', fontWeight: 'bold' }}>
                      NHÀ HÀNG HOA SEN
                    </h3>
                    <p style={{ margin: '0 0 14px 0', color: '#64748b', fontSize: '12px' }}>
                      Quét mã bằng camera điện thoại để gọi món tại bàn
                    </p>
                    <img
                      src={qrImgUrl}
                      alt={`QR Code Bàn ${qrTable.tableNumber}`}
                      style={{ width: '200px', height: '200px', display: 'block', margin: '0 auto' }}
                    />
                    <div style={{
                      marginTop: '14px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#2d6a4f',
                      background: '#d8f3dc',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      display: 'inline-block',
                    }}>
                      BÀN SỐ {qrTable.tableNumber}
                    </div>
                  </div>

                  {/* Cấu hình IP cho điện thoại */}
                  <div style={{ textAlign: 'left', marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>
                        🌐 Host / IP cho điện thoại quét:
                      </label>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', color: '#be185d', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => setQrServerIp('192.168.1.227')}
                      >
                        Dùng IP máy (192.168.1.227)
                      </button>
                    </div>
                    <input
                      type="text"
                      value={qrServerIp}
                      onChange={e => setQrServerIp(e.target.value)}
                      placeholder="Nhập IP LAN máy tính (VD: 192.168.1.227)"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        background: '#fff',
                        boxSizing: 'border-box',
                      }}
                    />
                    <small style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                      Điện thoại cùng Wi-Fi sẽ truy cập link theo IP này.
                    </small>
                  </div>

                  <div style={{ textAlign: 'left', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Link gọi món:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        readOnly
                        value={qrUrl}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          fontSize: '12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          background: '#f8fafc',
                        }}
                      />
                      <button
                        type="button"
                        className="tbl-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          navigator.clipboard.writeText(qrUrl)
                          showToast('Đã sao chép liên kết gọi món!', 'success')
                        }}
                      >
                        Sao chép
                      </button>
                    </div>
                  </div>
                </div>
                <div className="tbl-modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    className="tbl-btn-secondary"
                    onClick={() => window.open(qrUrl, '_blank')}
                  >
                    ↗ Mở thử nghiệm
                  </button>
                  <button
                    type="button"
                    className="tbl-btn-primary"
                    style={{ background: 'linear-gradient(135deg, #d86888, #b84d6e)' }}
                    onClick={() => {
                      const printWin = window.open('', '_blank')
                      printWin.document.write(`
                        <html>
                          <head>
                            <title>Mã QR Bàn ${qrTable.tableNumber} - Hoa Sen</title>
                            <style>
                              body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                              .card { border: 2px solid #d86888; border-radius: 16px; padding: 24px; text-align: center; width: 260px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                              h2 { margin: 0 0 6px 0; color: #b84d6e; font-size: 20px; }
                              p { margin: 0 0 16px 0; color: #64748b; font-size: 13px; }
                              img { width: 200px; height: 200px; }
                              .table-num { margin-top: 14px; font-size: 22px; font-weight: bold; color: #2d6a4f; }
                            </style>
                          </head>
                          <body onload="window.print(); window.close();">
                            <div class="card">
                              <h2>NHÀ HÀNG HOA SEN</h2>
                              <p>Quét mã để gọi món tại bàn</p>
                              <img src="${qrImgUrl}" />
                              <div class="table-num">BÀN SỐ ${qrTable.tableNumber}</div>
                            </div>
                          </body>
                        </html>
                      `)
                      printWin.document.close()
                    }}
                  >
                    🖨️ In mã dán bàn
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

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
