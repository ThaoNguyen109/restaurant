import React, { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import '../../styles/pages/admin/AdminPages.css'
import '../../styles/pages/admin/CustomersPage.css'
import {
  getCustomers,
  getCustomerStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerPoints,
} from '../../services/customerService'

const TierIcon = ({ tier, size = 14 }) => {
  if (tier === 'VIP') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
      </svg>
    )
  }
  if (tier === 'GOLD') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ flexShrink: 0 }}>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    )
  }
  if (tier === 'SILVER') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    )
  }
  // BRONZE
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}

const TIER_CONFIG = {
  BRONZE: { label: 'Đồng', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  SILVER: { label: 'Bạc', color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
  GOLD:   { label: 'Vàng', color: '#d97706', bg: '#fffbeb', border: '#fef08a' },
  VIP:    { label: 'VIP Kim Cương', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
}

const formatBirthDate = (str) => {
  if (!str) return ''
  const parts = str.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return str
}

const GENDER_LABEL = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

const INITIAL_FORM = {
  name: '',
  phone: '',
  email: '',
  birthday: '',
  gender: 'MALE',
  address: '',
  tier: 'BRONZE',
  loyaltyPoints: 0,
  note: '',
  status: 'ACTIVE',
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState('ALL') // 'ALL' | 'BRONZE' | 'SILVER' | 'GOLD' | 'VIP'
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Modal create/edit
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Detail modal
  const [detailCustomer, setDetailCustomer] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Delete modal
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Quick points modal
  const [pointsModalCustomer, setPointsModalCustomer] = useState(null)
  const [pointsOrderAmount, setPointsOrderAmount] = useState('')
  const [addingPoints, setAddingPoints] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Load stats
  const fetchStats = async () => {
    try {
      const data = await getCustomerStats()
      setStats(data)
    } catch (err) {
      console.error('Lỗi khi tải thống kê:', err)
    }
  }

  // Load customer list
  const fetchCustomers = async (targetPage = page) => {
    setLoading(true)
    try {
      const res = await getCustomers({
        keyword: searchTerm,
        tier: selectedTier === 'ALL' ? '' : selectedTier,
        page: targetPage,
        size: 10,
      })
      setCustomers(res.content || [])
      setTotalPages(res.totalPages || 0)
      setTotalElements(res.totalElements || 0)
      setPage(targetPage)
    } catch (err) {
      console.error('Lỗi khi tải khách hàng:', err)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchCustomers(0)
  }, [searchTerm, selectedTier])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCustomer(null)
    setFormData(INITIAL_FORM)
    setFormError('')
    setShowModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      birthday: customer.birthday || '',
      gender: customer.gender || 'MALE',
      address: customer.address || '',
      tier: customer.tier || 'BRONZE',
      loyaltyPoints: customer.loyaltyPoints || 0,
      note: customer.note || '',
      status: customer.status || 'ACTIVE',
    })
    setFormError('')
    setShowModal(true)
  }

  // Submit Create / Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập họ và tên khách hàng')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData)
        showToast('Cập nhật khách hàng thành công!')
      } else {
        await createCustomer(formData)
        showToast('Tạo mới khách hàng thành công!')
      }
      setShowModal(false)
      fetchCustomers(page)
      fetchStats()
    } catch (err) {
      setFormError(err.message || 'Có lỗi xảy ra, vui lòng thử lại!')
    } finally {
      setSaving(false)
    }
  }

  // View Customer Detail
  const handleViewDetail = async (id) => {
    setLoadingDetail(true)
    try {
      const data = await getCustomerById(id)
      setDetailCustomer(data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  // Delete Customer
  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return
    setDeleting(true)
    try {
      await deleteCustomer(customerToDelete.id)
      showToast(`Đã xóa khách hàng: ${customerToDelete.name}`)
      setCustomerToDelete(null)
      fetchCustomers(0)
      fetchStats()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // Add Points
  const handleAddPoints = async (e) => {
    e.preventDefault()
    if (!pointsModalCustomer || !pointsOrderAmount) return
    setAddingPoints(true)
    try {
      await addCustomerPoints(pointsModalCustomer.id, Number(pointsOrderAmount))
      showToast(`Đã tích điểm cho ${pointsModalCustomer.name}!`)
      setPointsModalCustomer(null)
      setPointsOrderAmount('')
      fetchCustomers(page)
      fetchStats()
      if (detailCustomer && detailCustomer.id === pointsModalCustomer.id) {
        handleViewDetail(detailCustomer.id)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setAddingPoints(false)
    }
  }

  const formatVND = (num) => {
    return Number(num || 0).toLocaleString('vi-VN') + ' đ'
  }

  return (
    <AdminLayout
      title="Quản lý khách hàng"
      subtitle="Khách hàng"
      actions={
        <button className="primary-btn" onClick={handleOpenCreate}>
          + Thêm khách hàng
        </button>
      }
    >
      <div className="cust-page-container">
        {/* ── TOOLBAR: TABS LỌC THEO HẠNG & TÌM KIẾM ── */}
        <div className="admin-toolbar">
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab-item ${selectedTier === 'ALL' ? 'active' : ''}`}
              onClick={() => setSelectedTier('ALL')}
            >
              <span>Tất cả</span>
              <span className="admin-tab-count">{stats?.totalCustomers || 0}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${selectedTier === 'BRONZE' ? 'active' : ''}`}
              onClick={() => setSelectedTier('BRONZE')}
            >
              <TierIcon tier="BRONZE" size={13} />
              <span>Đồng</span>
              <span className="admin-tab-count">{stats?.bronzeCount || 0}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${selectedTier === 'SILVER' ? 'active' : ''}`}
              onClick={() => setSelectedTier('SILVER')}
            >
              <TierIcon tier="SILVER" size={13} />
              <span>Bạc</span>
              <span className="admin-tab-count">{stats?.silverCount || 0}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${selectedTier === 'GOLD' ? 'active' : ''}`}
              onClick={() => setSelectedTier('GOLD')}
            >
              <TierIcon tier="GOLD" size={13} />
              <span>Vàng</span>
              <span className="admin-tab-count warning">{stats?.goldCount || 0}</span>
            </button>
            <button
              type="button"
              className={`admin-tab-item ${selectedTier === 'VIP' ? 'active' : ''}`}
              onClick={() => setSelectedTier('VIP')}
            >
              <TierIcon tier="VIP" size={13} />
              <span>VIP</span>
              <span className="admin-tab-count vip">{stats?.vipCount || 0}</span>
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
                placeholder="Tìm theo tên, số điện thoại, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            {(selectedTier !== 'ALL' || searchTerm) && (
              <button
                type="button"
                className="admin-btn-reset"
                onClick={() => {
                  setSelectedTier('ALL')
                  setSearchTerm('')
                }}
              >
                ✕ Xóa lọc
              </button>
            )}
          </div>
        </div>

        {/* ── BẢNG DỮ LIỆU ĐỒNG BỘ ── */}
        <div className="table-card cust-table-card">
          <div className="cust-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Mã KH</th>
                  <th style={{ minWidth: '150px' }}>Khách hàng</th>
                  <th style={{ minWidth: '130px' }}>Liên hệ</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Hạng thẻ</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Điểm tích lũy</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Tổng chi tiêu</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Số lần đến</th>
                  <th style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ textAlign: 'right', width: '160px', whiteSpace: 'nowrap' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="cust-empty-cell">
                    <div className="cust-inline-spinner" /> Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="cust-empty-cell">
                    Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const tierInfo = TIER_CONFIG[c.tier] || TIER_CONFIG.BRONZE
                  const isActive = c.status === 'ACTIVE'

                  return (
                    <tr
                      key={c.id}
                      className="clickable-row"
                      onClick={() => handleViewDetail(c.id)}
                      title="Bấm vào hàng để xem chi tiết và chỉnh sửa"
                    >
                      {/* ID */}
                      <td className="cust-col-code">#{c.id}</td>

                      {/* Khách hàng */}
                      <td>
                        <div className="cust-name-cell">
                          <strong className="cust-full-name">
                            {c.name}
                          </strong>
                          <div className="cust-sub-details">
                            {c.gender && (
                              <span className="cust-tag-gender">{GENDER_LABEL[c.gender] || c.gender}</span>
                            )}
                            {c.birthday && (
                              <span className="cust-text-muted">🎂 {formatBirthDate(c.birthday)}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Liên hệ */}
                      <td>
                        <div className="cust-contact-block">
                          <span className="cust-phone-num">{c.phone || '—'}</span>
                          {c.email && <span className="cust-email-str">{c.email}</span>}
                        </div>
                      </td>

                      {/* Hạng thẻ */}
                      <td>
                        <span
                          className="cust-tier-pill"
                          style={{
                            color: tierInfo.color,
                            background: tierInfo.bg,
                            borderColor: tierInfo.border,
                          }}
                        >
                          <TierIcon tier={c.tier} size={13} /> {tierInfo.label}
                        </span>
                      </td>

                      {/* Điểm tích lũy */}
                      <td>
                        <div className="cust-points-row">
                          <strong className="cust-points-num">
                            {(c.loyaltyPoints || 0).toLocaleString('vi-VN')}
                          </strong>
                          <button
                            type="button"
                            className="cust-add-pts-btn"
                            title="Tích thêm điểm thưởng"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPointsModalCustomer(c)
                              setPointsOrderAmount('')
                            }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Tổng chi tiêu */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong className="price" style={{ whiteSpace: 'nowrap' }}>
                          {formatVND(c.totalSpent)}
                        </strong>
                      </td>

                      {/* Số lần đến */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span className="cust-visits-badge">{c.visitCount || 0} lần</span>
                      </td>

                      {/* Trạng thái */}
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span
                          className={`status-badge ${
                            isActive ? 'status-active' : c.status === 'BLOCKED' ? 'status-low' : 'status-inactive'
                          }`}
                        >
                          {isActive ? 'Hoạt động' : c.status === 'BLOCKED' ? 'Tạm khóa' : 'Ngừng'}
                        </span>
                      </td>

                      {/* Hành động (Đã bỏ nút Chi tiết, bấm hàng để xem/sửa) */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="cust-tbl-actions">
                          <button
                            type="button"
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(c)
                            }}
                            title="Chỉnh sửa thông tin"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCustomerToDelete(c)
                            }}
                            title="Xóa khách hàng"
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

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="cust-pagination-bar">
              <span className="cust-pagination-info">
                Hiển thị {customers.length} / {totalElements} khách hàng
              </span>
              <div className="cust-pagination-ctrls">
                <button
                  type="button"
                  className="cust-page-nav-btn"
                  disabled={page === 0}
                  onClick={() => fetchCustomers(page - 1)}
                >
                  ← Trước
                </button>
                <span className="cust-page-current">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  className="cust-page-nav-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => fetchCustomers(page + 1)}
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── MODAL THÊM / CHỈNH SỬA KHÁCH HÀNG ── */}
        {showModal && (
          <div className="promo-modal-backdrop" onClick={() => !saving && setShowModal(false)}>
            <div className="promo-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="promo-modal-header">
                <h3>{editingCustomer ? 'Chỉnh sửa thông tin khách hàng' : 'Thêm mới khách hàng'}</h3>
                <button
                  type="button"
                  className="promo-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>

              {formError && <div className="cust-form-alert">{formError}</div>}

              <form onSubmit={handleSubmitForm} className="promo-modal-form">
                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Họ và tên <span className="req">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn An"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="form-item">
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      placeholder="0901234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-item">
                    <label>Ngày sinh</label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Giới tính</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>

                  <div className="form-item">
                    <label>Hạng thẻ thành viên</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    >
                      <option value="BRONZE">🥉 Hạng Đồng (Mặc định)</option>
                      <option value="SILVER">🥈 Hạng Bạc (≥2M hoặc ≥10 lần)</option>
                      <option value="GOLD">🥇 Hạng Vàng (≥10M hoặc ≥30 lần)</option>
                      <option value="VIP">👑 VIP Kim Cương (≥50M / Chỉ định)</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid two-col">
                  <div className="form-item">
                    <label>Điểm tích lũy (Lotus Points)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.loyaltyPoints}
                      onChange={(e) =>
                        setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>

                  <div className="form-item">
                    <label>Trạng thái tài khoản</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                      <option value="BLOCKED">Tạm khóa (BLOCKED)</option>
                    </select>
                  </div>
                </div>

                <div className="form-item">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Số nhà, đường, quận/huyện..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-item">
                  <label>Ghi chú (Sở thích, món ưa chuộng, dị ứng...)</label>
                  <textarea
                    rows="2"
                    placeholder="VD: Thích ngồi bàn gần cửa sổ, hay đi cùng gia đình..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                <div className="promo-modal-footer">
                  <button
                    type="button"
                    className="promo-btn-cancel"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? 'Đang lưu...' : editingCustomer ? 'Lưu thay đổi' : 'Tạo khách hàng'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL CHI TIẾT KHÁCH HÀNG & LỊCH SỬ ĐƠN ── */}
        {detailCustomer && (
          <div className="promo-modal-backdrop" onClick={() => setDetailCustomer(null)}>
            <div className="promo-modal-card cust-detail-card" onClick={(e) => e.stopPropagation()}>
              <div className="promo-modal-header">
                <div className="cust-detail-head-info">
                  <div className="cust-detail-avatar">
                    {detailCustomer.name ? detailCustomer.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3>{detailCustomer.name}</h3>
                    <div className="cust-detail-tags">
                      <span
                        className="cust-tier-pill"
                        style={{
                          color: (TIER_CONFIG[detailCustomer.tier] || TIER_CONFIG.BRONZE).color,
                          background: (TIER_CONFIG[detailCustomer.tier] || TIER_CONFIG.BRONZE).bg,
                        }}
                      >
                        <TierIcon tier={detailCustomer.tier} size={13} />{' '}
                        {(TIER_CONFIG[detailCustomer.tier] || TIER_CONFIG.BRONZE).label}
                      </span>
                      <span className="cust-text-muted">#{detailCustomer.id}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="promo-modal-close"
                  onClick={() => setDetailCustomer(null)}
                >
                  ✕
                </button>
              </div>

              <div className="cust-detail-body">
                {/* 3 Metric Summary */}
                <div className="cust-metric-summary">
                  <div className="cust-metric-box">
                    <span>Tổng chi tiêu</span>
                    <strong>{formatVND(detailCustomer.totalSpent)}</strong>
                  </div>
                  <div className="cust-metric-box">
                    <span>Điểm tích lũy</span>
                    <strong style={{ color: '#d97706' }}>
                      {(detailCustomer.loyaltyPoints || 0).toLocaleString('vi-VN')} pts
                    </strong>
                  </div>
                  <div className="cust-metric-box">
                    <span>Lượt ghé thăm</span>
                    <strong>{detailCustomer.visitCount || 0} lần</strong>
                  </div>
                </div>

                {/* Thông tin cá nhân */}
                <div className="cust-detail-section">
                  <h4>Thông tin cá nhân</h4>
                  <div className="cust-info-grid">
                    <div>
                      <span className="lbl">Số điện thoại:</span>
                      <strong>{detailCustomer.phone || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span className="lbl">Email:</span>
                      <strong>{detailCustomer.email || 'Chưa cập nhật'}</strong>
                    </div>
                    <div>
                      <span className="lbl">Giới tính:</span>
                      <strong>{GENDER_LABEL[detailCustomer.gender] || detailCustomer.gender || '—'}</strong>
                    </div>
                    <div>
                      <span className="lbl">Ngày sinh:</span>
                      <strong>{detailCustomer.birthday || '—'}</strong>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span className="lbl">Địa chỉ:</span>
                      <strong>{detailCustomer.address || '—'}</strong>
                    </div>
                    {detailCustomer.note && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span className="lbl">Ghi chú phục vụ:</span>
                        <p className="cust-note-box">{detailCustomer.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lịch sử đơn hàng gần đây */}
                <div className="cust-detail-section">
                  <div className="cust-section-title-bar">
                    <h4>Lịch sử đơn hàng gần đây</h4>
                    <small>Tổng {detailCustomer.totalOrders || 0} đơn</small>
                  </div>

                  {!detailCustomer.recentOrders || detailCustomer.recentOrders.length === 0 ? (
                    <div className="cust-empty-sub">Chưa có lịch sử đơn hàng nào</div>
                  ) : (
                    <div className="cust-orders-list">
                      {detailCustomer.recentOrders.map((ord) => (
                        <div key={ord.orderId} className="cust-ord-item">
                          <div>
                            <strong className="order-id">Đơn #{ord.orderId}</strong>
                            <span className="cust-ord-table"> • Bàn {ord.tableNumber}</span>
                          </div>
                          <div className="cust-ord-time">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleString('vi-VN') : '—'}
                          </div>
                          <div className="cust-ord-amount">
                            {formatVND(ord.finalAmount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="promo-modal-footer">
                <button
                  type="button"
                  className="promo-btn-cancel"
                  onClick={() => {
                    const c = detailCustomer
                    setDetailCustomer(null)
                    handleOpenEdit(c)
                  }}
                >
                  ✏️ Sửa thông tin
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    const c = detailCustomer
                    setDetailCustomer(null)
                    setPointsModalCustomer(c)
                  }}
                >
                  ⭐ Tích điểm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL XÁC NHẬN XÓA ── */}
        {customerToDelete && (
          <div className="promo-modal-backdrop" onClick={() => !deleting && setCustomerToDelete(null)}>
            <div className="promo-confirm-card" onClick={(e) => e.stopPropagation()}>
              <div className="promo-confirm-icon">⚠️</div>
              <h3>Xác nhận xóa khách hàng?</h3>
              <p>
                Bạn có chắc chắn muốn xóa khách hàng <strong>{customerToDelete.name}</strong> (#{customerToDelete.id})?
                Các đơn hàng trước đây sẽ được giữ nguyên nhưng không còn liên kết.
              </p>
              <div className="promo-confirm-actions">
                <button
                  type="button"
                  className="promo-btn-cancel"
                  onClick={() => setCustomerToDelete(null)}
                  disabled={deleting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="action-btn danger"
                  onClick={handleDeleteCustomer}
                  disabled={deleting}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL TÍCH ĐIỂM THƯỞNG ── */}
        {pointsModalCustomer && (
          <div className="promo-modal-backdrop" onClick={() => !addingPoints && setPointsModalCustomer(null)}>
            <div className="promo-confirm-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="promo-modal-header" style={{ border: 'none', padding: '0 0 12px' }}>
                <h3 style={{ textAlign: 'left' }}>Tích điểm thưởng Lotus</h3>
                <button
                  type="button"
                  className="promo-modal-close"
                  onClick={() => setPointsModalCustomer(null)}
                >
                  ✕
                </button>
              </div>
              <p style={{ textAlign: 'left', margin: '0 0 14px' }}>
                Khách hàng: <strong>{pointsModalCustomer.name}</strong> ({pointsModalCustomer.phone || `#${pointsModalCustomer.id}`})
              </p>

              <form onSubmit={handleAddPoints} style={{ textAlign: 'left' }}>
                <div className="form-item">
                  <label>Số tiền hóa đơn (VNĐ)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="VD: 350000"
                    value={pointsOrderAmount}
                    onChange={(e) => setPointsOrderAmount(e.target.value)}
                    required
                  />
                  <small className="field-hint">Tỷ lệ: Mỗi 10.000 đ = 1 điểm. Hệ thống tự động nâng hạng thẻ.</small>
                </div>

                {pointsOrderAmount > 0 && (
                  <div className="cust-pts-preview">
                    <span>Điểm cộng:</span>
                    <strong>+{Math.floor(Number(pointsOrderAmount) / 10000)} pts</strong>
                  </div>
                )}

                <div className="promo-modal-footer" style={{ marginTop: '16px' }}>
                  <button
                    type="button"
                    className="promo-btn-cancel"
                    onClick={() => setPointsModalCustomer(null)}
                    disabled={addingPoints}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="primary-btn" disabled={addingPoints}>
                    {addingPoints ? 'Đang lưu...' : 'Xác nhận tích điểm'}
                  </button>
                </div>
              </form>
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
