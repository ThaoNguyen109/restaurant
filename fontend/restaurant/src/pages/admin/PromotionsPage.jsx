import { useState, useEffect, useCallback, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/pages/admin/AdminPages.css'
import '../../styles/pages/admin/PromotionsPage.css'
import {
  getAllPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
} from '../../services/promotionService'

const fmt = (n) => (!n ? '0' : Number(n).toLocaleString('vi-VN'))

const EMPTY_FORM = {
  code: '',
  title: '',
  description: '',
  type: 'PERCENTAGE',
  discountValue: '',
  maxDiscount: '',
  minOrderAmount: '',
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  usageLimit: '',
  status: 'ACTIVE',
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL') // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  // Modal Thêm / Sửa
  const [showModal, setShowModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // Confirm delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getAllPromotions()
      setPromotions(data || [])
    } catch (err) {
      showToastMsg(err.message || 'Lỗi tải danh sách khuyến mãi', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  // Lọc khuyến mãi
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchSearch =
        search.trim() === '' ||
        p.code?.toLowerCase().includes(search.toLowerCase()) ||
        p.title?.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (filterStatus === 'ALL') return true
      if (filterStatus === 'ACTIVE') return p.status === 'ACTIVE' && !p.isExpired
      if (filterStatus === 'INACTIVE') return p.status === 'INACTIVE'
      if (filterStatus === 'EXPIRED') return p.isExpired || p.status === 'EXPIRED'
      return true
    })
  }, [promotions, search, filterStatus])

  // Đếm theo từng trạng thái
  const counts = useMemo(() => {
    const all = promotions.length
    const active = promotions.filter((p) => p.status === 'ACTIVE' && !p.isExpired).length
    const inactive = promotions.filter((p) => p.status === 'INACTIVE').length
    const expired = promotions.filter((p) => p.isExpired || p.status === 'EXPIRED').length
    return { all, active, inactive, expired }
  }, [promotions])

  // Mở form thêm mới
  const handleOpenCreate = () => {
    setEditingPromo(null)
    setFormData({
      ...EMPTY_FORM,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    })
    setShowModal(true)
  }

  // Mở form chỉnh sửa
  const handleOpenEdit = (promo) => {
    setEditingPromo(promo)
    setFormData({
      code: promo.code,
      title: promo.title,
      description: promo.description || '',
      type: promo.type,
      discountValue: promo.discountValue,
      maxDiscount: promo.maxDiscount || '',
      minOrderAmount: promo.minOrderAmount || '',
      startDate: promo.startDate ? promo.startDate.slice(0, 16) : '',
      endDate: promo.endDate ? promo.endDate.slice(0, 16) : '',
      usageLimit: promo.usageLimit || '',
      status: promo.status || 'ACTIVE',
    })
    setShowModal(true)
  }

  // Submit form Thêm / Sửa
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.code.trim()) {
      showToastMsg('Vui lòng nhập mã khuyến mãi', 'error')
      return
    }
    if (!formData.title.trim()) {
      showToastMsg('Vui lòng nhập tên chương trình', 'error')
      return
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      showToastMsg('Giá trị giảm giá phải lớn hơn 0', 'error')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        discountValue: Number(formData.discountValue),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        status: formData.status,
      }

      if (editingPromo) {
        await updatePromotion(editingPromo.id, payload)
        showToastMsg('Cập nhật chương trình khuyến mãi thành công!')
      } else {
        await createPromotion(payload)
        showToastMsg('Tạo mới chương trình khuyến mãi thành công!')
      }

      setShowModal(false)
      fetchPromotions()
    } catch (err) {
      showToastMsg(err.message || 'Lỗi thao tác khuyến mãi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Đổi trạng thái Bật / Tắt
  const handleToggleStatus = async (promo) => {
    try {
      await togglePromotionStatus(promo.id)
      showToastMsg(`Đã đổi trạng thái mã ${promo.code}`)
      fetchPromotions()
    } catch (err) {
      showToastMsg(err.message || 'Lỗi đổi trạng thái', 'error')
    }
  }

  // Xóa khuyến mãi
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deletePromotion(deleteTarget.id)
      showToastMsg(`Đã xóa chương trình ${deleteTarget.code}`)
      setDeleteTarget(null)
      fetchPromotions()
    } catch (err) {
      showToastMsg(err.message || 'Không thể xóa khuyến mãi', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code)
    showToastMsg(`Đã sao chép mã "${code}"!`)
  }

  return (
    <AdminLayout
      title="Chương trình Khuyến mãi & Voucher"
      subtitle="Khuyến mãi"
      actions={
        <button className="primary-btn" onClick={handleOpenCreate}>
          + Thêm khuyến mãi
        </button>
      }
    >
      <div className="promo-page-container">
        {/* ── TOOLBAR: TABS LỌC & TÌM KIẾM ── */}
        <div className="admin-toolbar">
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab-item ${filterStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ALL')}
            >
              <span>Tất cả</span>
              <span className="admin-tab-count">{counts.all}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ACTIVE')}
            >
              <span>Đang chạy</span>
              <span className="admin-tab-count success">{counts.active}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${filterStatus === 'INACTIVE' ? 'active' : ''}`}
              onClick={() => setFilterStatus('INACTIVE')}
            >
              <span>Tạm dừng</span>
              <span className="admin-tab-count">{counts.inactive}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${filterStatus === 'EXPIRED' ? 'active' : ''}`}
              onClick={() => setFilterStatus('EXPIRED')}
            >
              <span>Đã hết hạn</span>
              <span className="admin-tab-count danger">{counts.expired}</span>
            </button>
          </div>

          <div className="admin-toolbar-right">
            <div className="admin-search-bar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="admin-search-icon">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Tìm theo mã voucher hoặc tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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

            {(filterStatus !== 'ALL' || search) && (
              <button
                type="button"
                className="admin-btn-reset"
                onClick={() => {
                  setFilterStatus('ALL')
                  setSearch('')
                }}
              >
                ✕ Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* ── BẢNG DỮ LIỆU ĐỒNG BỘ ── */}
        <div className="table-card promo-table-card">
          <div className="promo-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '110px', whiteSpace: 'nowrap' }}>Mã Voucher</th>
                  <th style={{ minWidth: '160px' }}>Tên chương trình</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Loại giảm giá</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Giá trị giảm</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Đơn tối thiểu</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Hạn dùng</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Lượt dùng</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: '160px', whiteSpace: 'nowrap' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="promo-empty-cell">
                    <div className="promo-inline-spinner" /> Đang tải dữ liệu khuyến mãi...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan="9" className="promo-empty-cell">
                    Không tìm thấy chương trình khuyến mãi nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((p) => {
                  const isPercent = p.type === 'PERCENTAGE'
                  const isExpired = p.isExpired
                  const isActive = p.status === 'ACTIVE' && !isExpired

                  return (
                    <tr
                      key={p.id}
                      className="clickable-row"
                      onClick={() => handleOpenEdit(p)}
                      title="Bấm vào hàng để xem chi tiết và chỉnh sửa khuyến mãi"
                    >
                      {/* Mã Voucher */}
                      <td>
                        <span
                          className="promo-code-pill"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyCode(p.code)
                          }}
                          title="Bấm để sao chép mã"
                        >
                          {p.code}
                        </span>
                      </td>

                      {/* Tên chương trình */}
                      <td>
                        <div className="promo-name-block">
                          <strong className="promo-main-title">{p.title}</strong>
                          {p.description && (
                            <span className="promo-desc-sub">{p.description}</span>
                          )}
                        </div>
                      </td>

                      {/* Loại giảm giá */}
                      <td>
                        <span className={`promo-type-badge ${isPercent ? 'percent' : 'fixed'}`}>
                          {isPercent ? 'Giảm %' : 'Giảm tiền'}
                        </span>
                      </td>

                      {/* Giá trị giảm */}
                      <td>
                        <span className="promo-val-highlight">
                          {isPercent ? `${p.discountValue}%` : `${fmt(p.discountValue)} đ`}
                        </span>
                        {p.maxDiscount && (
                          <small className="promo-max-hint"> (Tối đa {fmt(p.maxDiscount)}đ)</small>
                        )}
                      </td>

                      {/* Đơn tối thiểu */}
                      <td>
                        {p.minOrderAmount > 0 ? `${fmt(p.minOrderAmount)} đ` : 'Không giới hạn'}
                      </td>

                      {/* Hạn dùng */}
                      <td>
                        {p.endDate
                          ? new Date(p.endDate).toLocaleDateString('vi-VN')
                          : 'Vô thời hạn'}
                      </td>

                      {/* Lượt dùng */}
                      <td>
                        <strong>{p.usedCount || 0}</strong> / {p.usageLimit || '∞'}
                      </td>

                      {/* Trạng thái */}
                      <td>
                        <span
                          className={`status-badge ${
                            isActive
                              ? 'status-active'
                              : isExpired
                              ? 'status-inactive'
                              : 'status-low'
                          }`}
                        >
                          {isActive ? 'Đang chạy' : isExpired ? 'Đã hết hạn' : 'Tạm dừng'}
                        </span>
                      </td>

                      {/* Hành động */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="promo-tbl-actions">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(p)
                            }}
                            title={isActive ? 'Tạm dừng mã này' : 'Kích hoạt lại mã này'}
                            style={{
                              background: isActive ? '#f1f5f9' : '#e8f5e9',
                              color: isActive ? '#475569' : '#2e7d32',
                            }}
                          >
                            {isActive ? 'Tạm dừng' : 'Bật'}
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(p)
                            }}
                            title="Chỉnh sửa khuyến mãi"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteTarget(p)
                            }}
                            title="Xóa khuyến mãi"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* ── MODAL THÊM / CHỈNH SỬA KHUYẾN MÃI ── */}
        {showModal && (
          <div className="promo-modal-backdrop" onClick={() => !submitting && setShowModal(false)}>
            <div className="promo-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="promo-modal-header">
                <h3>{editingPromo ? 'Chỉnh sửa chương trình khuyến mãi' : 'Thêm mới khuyến mãi'}</h3>
                <button
                  type="button"
                  className="promo-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="promo-modal-form">
                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Mã Voucher <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="VD: LOTUS20, GIAM50K..."
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase().replace(/\s/g, ''),
                        })
                      }
                    />
                    <small className="field-hint">Mã viết liền không dấu, tự động viết hoa</small>
                  </div>

                  <div className="form-item">
                    <label>Loại hình ưu đãi <span className="req">*</span></label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</option>
                    </select>
                  </div>
                </div>

                <div className="form-item">
                  <label>Tên chương trình ưu đãi <span className="req">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ưu đãi tri ân khách hàng thân thiết..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="form-item">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    rows="2"
                    placeholder="Ghi chú điều kiện hoặc quyền lợi dành cho khách hàng..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>
                      {formData.type === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}{' '}
                      <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={formData.type === 'PERCENTAGE' ? 'VD: 15' : 'VD: 30000'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    />
                  </div>

                  {formData.type === 'PERCENTAGE' ? (
                    <div className="form-item">
                      <label>Giảm tối đa (VNĐ)</label>
                      <input
                        type="number"
                        placeholder="Để trống nếu không giới hạn"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="form-item">
                      <label>Đơn hàng tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        placeholder="VD: 150000 (0 nếu không yêu cầu)"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {formData.type === 'PERCENTAGE' && (
                  <div className="form-item">
                    <label>Đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="VD: 150000 (0 nếu không yêu cầu)"
                      value={formData.minOrderAmount}
                      onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Ngày bắt đầu <span className="req">*</span></label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-item">
                    <label>Ngày kết thúc <span className="req">*</span></label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Giới hạn số lượt dùng</label>
                    <input
                      type="number"
                      placeholder="Để trống nếu không giới hạn"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    />
                  </div>

                  <div className="form-item">
                    <label>Trạng thái kích hoạt</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="INACTIVE">Tạm dừng (INACTIVE)</option>
                    </select>
                  </div>
                </div>

                <div className="promo-modal-footer">
                  <button
                    type="button"
                    className="promo-btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={submitting}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? 'Đang lưu...' : editingPromo ? 'Lưu thay đổi' : 'Tạo khuyến mãi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL XÁC NHẬN XÓA ── */}
        {deleteTarget && (
          <div className="promo-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
            <div className="promo-confirm-card" onClick={(e) => e.stopPropagation()}>
              <div className="promo-confirm-icon">⚠️</div>
              <h3>Xác nhận xóa khuyến mãi?</h3>
              <p>
                Bạn có chắc chắn muốn xóa mã <strong>{deleteTarget.code}</strong> ({deleteTarget.title})?
                Thao tác này không thể hoàn tác.
              </p>
              <div className="promo-confirm-actions">
                <button
                  type="button"
                  className="promo-btn-cancel"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast thông báo */}
        {toast && (
          <div className={`promo-toast-msg ${toast.type}`}>
            {toast.type === 'error' ? '❌' : '✓'} {toast.message}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
