import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import './MenuManagement.css'
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemStatus,
} from '../../services/menuItemService'
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categoryService'
import { getImageFullUrl } from '../../services/apiClient'

function MenuPage() {
  // viewMode: 'list' (danh sách) | 'item-form' (form thêm/sửa món ăn) | 'category-form' (form thêm/sửa danh mục)
  const [viewMode, setViewMode] = useState('list')
  const [activeTab, setActiveTab] = useState('items') // 'items' | 'categories'

  // Dữ liệu
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  // Bộ lọc
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Toast thông báo
  const [toast, setToast] = useState(null)

  // State Form Món ăn
  const [editingItem, setEditingItem] = useState(null)
  const [itemFormData, setItemFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    mainIngredients: '',
    description: '',
    status: 'ACTIVE',
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  // State Form Danh mục
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
  })

  // Modal Xác nhận Xóa
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { type: 'item' | 'category', id, name }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Tải dữ liệu từ API
  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, items] = await Promise.all([
        getAllCategories(),
        getAllMenuItems({
          categoryId: filterCategory || undefined,
          status: filterStatus || undefined,
          search: searchKeyword || undefined,
        }),
      ])
      setCategories(cats)
      setMenuItems(items)
    } catch (err) {
      showToast(err.message || 'Lỗi khi tải dữ liệu từ máy chủ', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'list') {
      loadData()
    }
  }, [viewMode, filterCategory, filterStatus, searchKeyword])

  // --- XỬ LÝ CHUYỂN SANG FORM MÓN ĂN ---

  const handleOpenCreateItem = () => {
    setEditingItem(null)
    setItemFormData({
      name: '',
      categoryId: categories.length > 0 ? categories[0].id : '',
      price: '',
      mainIngredients: '',
      description: '',
      status: 'ACTIVE',
    })
    setSelectedFile(null)
    setImagePreview(null)
    setViewMode('item-form')
  }

  const handleOpenEditItem = (item) => {
    setEditingItem(item)
    setItemFormData({
      name: item.name || '',
      categoryId: item.categoryId || '',
      price: item.price || '',
      mainIngredients: item.mainIngredients || '',
      description: item.description || '',
      status: item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    setSelectedFile(null)
    setImagePreview(item.image ? getImageFullUrl(item.image) : null)
    setViewMode('item-form')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        showToast('Vui lòng chọn định dạng ảnh hợp lệ (.jpg, .png, .webp, .gif)', 'error')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('Dung lượng file ảnh không được vượt quá 10MB', 'error')
        return
      }
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()

    if (!itemFormData.name.trim()) {
      showToast('Vui lòng nhập tên món ăn', 'error')
      return
    }
    if (!itemFormData.categoryId) {
      showToast('Vui lòng chọn danh mục cho món ăn', 'error')
      return
    }
    if (!itemFormData.price || Number(itemFormData.price) <= 0) {
      showToast('Giá bán phải lớn hơn 0', 'error')
      return
    }

    try {
      setFormSubmitting(true)
      const formData = new FormData()
      formData.append('name', itemFormData.name.trim())
      formData.append('categoryId', itemFormData.categoryId)
      formData.append('price', itemFormData.price)
      formData.append('mainIngredients', itemFormData.mainIngredients || '')
      formData.append('description', itemFormData.description || '')
      formData.append('status', itemFormData.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')

      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      if (editingItem) {
        await updateMenuItem(editingItem.id, formData)
        showToast(`Cập nhật món "${itemFormData.name}" thành công!`)
      } else {
        await createMenuItem(formData)
        showToast(`Thêm món "${itemFormData.name}" thành công!`)
      }

      setViewMode('list')
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu món ăn', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleQuickStatusChange = async (itemId, newStatus) => {
    try {
      await updateMenuItemStatus(itemId, newStatus)
      showToast('Đã cập nhật trạng thái hiển thị món ăn!')
      setMenuItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
      )
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái', 'error')
    }
  }

  // --- XỬ LÝ FORM DANH MỤC ---

  const handleOpenCreateCategory = () => {
    setEditingCategory(null)
    setCategoryFormData({
      name: '',
      description: '',
      status: 'ACTIVE',
    })
    setViewMode('category-form')
  }

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat)
    setCategoryFormData({
      name: cat.name || '',
      description: cat.description || '',
      status: cat.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    setViewMode('category-form')
  }

  const handleSaveCategory = async (e) => {
    e.preventDefault()

    if (!categoryFormData.name.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error')
      return
    }

    try {
      setFormSubmitting(true)
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryFormData)
        showToast(`Cập nhật danh mục "${categoryFormData.name}" thành công!`)
      } else {
        await createCategory(categoryFormData)
        showToast(`Tạo danh mục "${categoryFormData.name}" thành công!`)
      }

      setViewMode('list')
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu danh mục', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  // --- XỬ LÝ XÓA ---

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      setFormSubmitting(true)
      if (deleteTarget.type === 'item') {
        await deleteMenuItem(deleteTarget.id)
        showToast(`Đã xóa món "${deleteTarget.name}"`)
      } else if (deleteTarget.type === 'category') {
        await deleteCategory(deleteTarget.id)
        showToast(`Đã xóa danh mục "${deleteTarget.name}"`)
      }
      setDeleteModalOpen(false)
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi thực hiện xóa', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const formatCurrency = (val) => {
    if (!val) return '0 ₫'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  const totalItems = menuItems.length
  const activeCount = menuItems.filter((i) => i.status === 'ACTIVE' || !i.status).length
  const inactiveCount = menuItems.filter((i) => i.status === 'INACTIVE').length
  const totalCategories = categories.length

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(itemFormData.categoryId))

  return (
    <AdminLayout
      title={
        viewMode === 'item-form'
          ? editingItem
            ? 'Chỉnh sửa món ăn'
            : 'Thêm món ăn mới'
          : viewMode === 'category-form'
          ? editingCategory
            ? 'Chỉnh sửa danh mục'
            : 'Thêm danh mục mới'
          : 'Quản lý thực đơn & danh mục'
      }
      subtitle="Thực đơn"
      actions={
        viewMode === 'list' ? (
          activeTab === 'items' ? (
            <button className="btn-primary-large" onClick={handleOpenCreateItem}>
              + Thêm món ăn mới
            </button>
          ) : (
            <button className="btn-primary-large" onClick={handleOpenCreateCategory}>
              + Thêm danh mục mới
            </button>
          )
        ) : (
          <button className="btn-secondary" onClick={() => setViewMode('list')}>
            ← Quay lại danh sách
          </button>
        )
      }
    >
      <div className="menu-mgmt-container">
        {/* ========================================================
            VIEW 1: FORM THÊM / SỬA MÓN ĂN (GIAO DIỆN RỘNG RÃI, TO RÕ)
            ======================================================== */}
        {viewMode === 'item-form' && (
          <div className="form-page-card">
            <div className="form-page-header">
              <div className="form-page-header-title">
                <h2>{editingItem ? '✏️ Chỉnh sửa thông tin món ăn' : '🍲 Tạo món ăn mới'}</h2>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('list')}
                disabled={formSubmitting}
              >
                ← Quay lại danh sách
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="form-page-layout">
                {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
                <div className="form-column-main">
                  <div className="form-section-box">
                    <h4 className="form-section-title">📝 Thông tin cơ bản</h4>

                    <div className="form-group-large">
                      <label>Tên món ăn <span style={{ color: '#ef5350' }}>*</span></label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Bò lúc lắc sốt tiêu xanh"
                        value={itemFormData.name}
                        onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group-large">
                        <label>Danh mục <span style={{ color: '#ef5350' }}>*</span></label>
                        <select
                          value={itemFormData.categoryId}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, categoryId: e.target.value })
                          }
                          required
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group-large">
                        <label>Giá bán (VNĐ) <span style={{ color: '#ef5350' }}>*</span></label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 150000"
                          min="1000"
                          step="1000"
                          value={itemFormData.price}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, price: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group-large">
                      <label>Trạng thái hiển thị</label>
                      <select
                        value={itemFormData.status}
                        onChange={(e) => setItemFormData({ ...itemFormData, status: e.target.value })}
                      >
                        <option value="ACTIVE">🟢 Hiển thị</option>
                        <option value="INACTIVE">⚪ Ẩn</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-section-box">
                    <h4 className="form-section-title">🌿 Nguyên liệu & Mô tả</h4>

                    <div className="form-group-large">
                      <label>Thành phần chính</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Thịt bò Úc tươi, ớt chuông, hành tây, sốt bơ tỏi tiêu đen"
                        value={itemFormData.mainIngredients}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, mainIngredients: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-group-large">
                      <label>Mô tả món ăn</label>
                      <textarea
                        rows="4"
                        placeholder="Mô tả hương vị đặc trưng, độ cay hoặc lưu ý khi phục vụ..."
                        value={itemFormData.description}
                        onChange={(e) =>
                          setItemFormData({ ...itemFormData, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: UPLOAD HÌNH ẢNH & XEM TRƯỚC */}
                <div className="form-column-side">
                  <div className="form-section-box">
                    <h4 className="form-section-title">📷 Hình ảnh món ăn</h4>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />

                    {imagePreview ? (
                      <div className="image-preview-card-large">
                        <img src={imagePreview} alt="Xem trước ảnh món" />
                        <div className="preview-overlay-actions">
                          <button
                            type="button"
                            className="overlay-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            🔄 Đổi ảnh khác
                          </button>
                          <button
                            type="button"
                            className="overlay-btn danger"
                            onClick={handleRemoveImage}
                          >
                            ✕ Xóa ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="image-upload-dropzone-large"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="dropzone-icon-large">🖼️</span>
                        <span className="dropzone-text-large">Chọn 1 hình ảnh từ máy tính</span>
                        <span className="dropzone-subtext-large">
                          Hỗ trợ định dạng JPG, PNG, WEBP (Dung lượng tối đa 10MB)
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ marginTop: 8 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                          }}
                        >
                          📂 Duyệt file trên máy
                        </button>
                      </div>
                    )}
                  </div>

                  {/* KHUNG XEM TRƯỚC GIAO DIỆN (LIVE PREVIEW) */}
                  <div className="form-section-box">
                    <h4 className="form-section-title">👁️ Xem trước hiển thị trên Menu</h4>
                    <div className="live-preview-box">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="live-preview-img" />
                      ) : (
                        <div
                          className="live-preview-img"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.8rem',
                          }}
                        >
                          🥗
                        </div>
                      )}
                      <div className="live-preview-info">
                        <span className="live-preview-title">
                          {itemFormData.name || 'Tên món ăn'}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#6a7e71' }}>
                          🏷️ {selectedCategoryObj ? selectedCategoryObj.name : 'Danh mục'}
                        </span>
                        <span className="live-preview-price">
                          {itemFormData.price ? formatCurrency(itemFormData.price) : '0 ₫'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* NÚT THỰC HIỆN HÀNH ĐỘNG RÕ RÀNG Ở ĐÁY FORM */}
              <div className="form-page-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewMode('list')}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary-large" disabled={formSubmitting}>
                  {formSubmitting ? (
                    '⏳ Đang lưu dữ liệu...'
                  ) : editingItem ? (
                    '💾 Cập nhật món ăn'
                  ) : (
                    '✨ Thêm món ăn ngay'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            VIEW 2: FORM THÊM / SỬA DANH MỤC
            ======================================================== */}
        {viewMode === 'category-form' && (
          <div className="form-page-card" style={{ maxWidth: 700, margin: '0 auto' }}>
            <div className="form-page-header">
              <div className="form-page-header-title">
                <h2>{editingCategory ? '✏️ Chỉnh sửa danh mục' : '🏷️ Thêm danh mục mới'}</h2>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setViewMode('list')}
                disabled={formSubmitting}
              >
                ← Quay lại
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className="form-section-box">
                <div className="form-group-large">
                  <label>Tên danh mục <span style={{ color: '#ef5350' }}>*</span></label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Món Khai Vị, Món Chính, Đồ Uống, Tráng Miệng..."
                    value={categoryFormData.name}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group-large">
                  <label>Trạng thái danh mục</label>
                  <select
                    value={categoryFormData.status}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">Hoạt động (Hiển thị)</option>
                    <option value="INACTIVE">Tạm dừng (Ẩn)</option>
                  </select>
                </div>

                <div className="form-group-large">
                  <label>Mô tả danh mục</label>
                  <textarea
                    rows="4"
                    placeholder="Mô tả nhóm món ăn này phục vụ cho loại thực đơn nào..."
                    value={categoryFormData.description}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-page-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewMode('list')}
                  disabled={formSubmitting}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-primary-large" disabled={formSubmitting}>
                  {formSubmitting ? (
                    '⏳ Đang lưu...'
                  ) : editingCategory ? (
                    '💾 Cập nhật danh mục'
                  ) : (
                    '✨ Thêm danh mục ngay'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            VIEW 3: DANH SÁCH MÓN ĂN & DANH MỤC (LIST VIEW)
            ======================================================== */}
        {viewMode === 'list' && (
          <>
            {/* TABS CHUYỂN ĐỔI */}
            <div className="menu-tabs">
              <button
                className={`menu-tab-btn ${activeTab === 'items' ? 'active' : ''}`}
                onClick={() => setActiveTab('items')}
              >
                <span>🍽️ Danh sách món ăn</span>
                <span className="tab-badge">{totalItems}</span>
              </button>
              <button
                className={`menu-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                onClick={() => setActiveTab('categories')}
              >
                <span>🏷️ Quản lý danh mục</span>
                <span className="tab-badge">{totalCategories}</span>
              </button>
            </div>

            {/* STATS SUMMARY CHIPS */}
            <div className="menu-stats-row">
              <div className="stat-chip">
                <div className="stat-chip-icon green">🍲</div>
                <div className="stat-chip-info">
                  <span className="stat-chip-val">{totalItems}</span>
                  <span className="stat-chip-label">Tổng số món</span>
                </div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon blue">👁️</div>
                <div className="stat-chip-info">
                  <span className="stat-chip-val">{activeCount}</span>
                  <span className="stat-chip-label">Đang hiển thị</span>
                </div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon rose">🔒</div>
                <div className="stat-chip-info">
                  <span className="stat-chip-val">{inactiveCount}</span>
                  <span className="stat-chip-label">Đang ẩn</span>
                </div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon green">📁</div>
                <div className="stat-chip-info">
                  <span className="stat-chip-val">{totalCategories}</span>
                  <span className="stat-chip-label">Danh mục</span>
                </div>
              </div>
            </div>

            {/* TAB MÓN ĂN */}
            {activeTab === 'items' && (
              <>
                {/* Bộ lọc & Tìm kiếm */}
                <div className="filter-bar">
                  <div className="filter-left">
                    <div className="search-box">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder="Tìm theo tên món ăn, nguyên liệu..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                    </div>

                    <select
                      className="filter-select"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="">-- Tất cả danh mục --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="filter-select"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">-- Tất cả trạng thái --</option>
                      <option value="ACTIVE">🟢 Hiển thị</option>
                      <option value="INACTIVE">⚪ Ẩn</option>
                    </select>
                  </div>

                  <div className="filter-right">
                    {(filterCategory || filterStatus || searchKeyword) && (
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setFilterCategory('')
                          setFilterStatus('')
                          setSearchKeyword('')
                        }}
                      >
                        ✕ Xóa lọc
                      </button>
                    )}
                    <button className="btn-secondary" onClick={loadData} title="Làm mới">
                      🔄 Làm mới
                    </button>
                    <button className="btn-primary-large" onClick={handleOpenCreateItem}>
                      + Thêm món ăn mới
                    </button>
                  </div>
                </div>

                {/* Bảng món ăn */}
                <div className="table-card">
                  {loading ? (
                    <div className="table-loading-state">
                      <div className="spinner" />
                      <p>Đang tải danh sách món ăn...</p>
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="table-empty-state">
                      <div className="icon">🍲</div>
                      <p>Chưa có món ăn nào trong thực đơn.</p>
                      <button
                        className="btn-primary-large"
                        onClick={handleOpenCreateItem}
                        style={{ marginTop: 14 }}
                      >
                        + Thêm món ăn đầu tiên
                      </button>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '38%' }}>Món ăn & Nguyên liệu</th>
                          <th>Danh mục</th>
                          <th>Giá bán</th>
                          <th>Trạng thái</th>
                          <th style={{ textAlign: 'right' }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <div className="menu-item-row-cell">
                                <div className="item-thumb-wrapper">
                                  {item.image ? (
                                    <img
                                      src={getImageFullUrl(item.image)}
                                      alt={item.name}
                                      className="item-thumb-img"
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        if (e.target.nextSibling) {
                                          e.target.nextSibling.style.display = 'block'
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <span
                                    className="item-thumb-placeholder"
                                    style={{ display: item.image ? 'none' : 'block' }}
                                  >
                                    🥗
                                  </span>
                                </div>
                                <div className="item-meta">
                                  <span className="item-name">{item.name}</span>
                                  {item.mainIngredients && (
                                    <span
                                      className="item-ingredients"
                                      title={item.mainIngredients}
                                    >
                                      🌿 {item.mainIngredients}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="category-tag">
                                {item.categoryName || 'Chưa phân loại'}
                              </span>
                            </td>
                            <td className="price">{formatCurrency(item.price)}</td>
                            <td>
                              <select
                                className={`status-select-badge ${item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}`}
                                value={item.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
                                onChange={(e) =>
                                  handleQuickStatusChange(item.id, e.target.value)
                                }
                              >
                                <option value="ACTIVE">Hiển thị</option>
                                <option value="INACTIVE">Ẩn</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="action-btn"
                                onClick={() => handleOpenEditItem(item)}
                                title="Sửa món ăn"
                              >
                                Sửa
                              </button>
                              <button
                                className="action-btn danger"
                                onClick={() => {
                                  setDeleteTarget({
                                    type: 'item',
                                    id: item.id,
                                    name: item.name,
                                  })
                                  setDeleteModalOpen(true)
                                }}
                                title="Xóa món ăn"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* TAB DANH MỤC */}
            {activeTab === 'categories' && (
              <div className="table-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <button className="btn-primary-large" onClick={handleOpenCreateCategory}>
                    + Thêm danh mục mới
                  </button>
                </div>

                {loading ? (
                  <div className="table-loading-state">
                    <div className="spinner" />
                    <p>Đang tải danh mục...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="table-empty-state">
                    <div className="icon">🏷️</div>
                    <p>Chưa có danh mục nào.</p>
                    <button
                      className="btn-primary-large"
                      onClick={handleOpenCreateCategory}
                      style={{ marginTop: 14 }}
                    >
                      + Thêm danh mục ngay
                    </button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ID</th>
                        <th>Tên danh mục</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat) => (
                        <tr key={cat.id}>
                          <td>
                            <strong>#{cat.id}</strong>
                          </td>
                          <td>
                            <strong style={{ color: '#1e3527', fontSize: '0.95rem' }}>
                              {cat.name}
                            </strong>
                          </td>
                          <td style={{ color: '#6a7e71' }}>{cat.description || '—'}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                cat.status === 'INACTIVE' ? 'status-inactive' : 'status-active'
                              }`}
                            >
                              {cat.status === 'INACTIVE' ? 'Ẩn' : 'Hiển thị'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="action-btn"
                              onClick={() => handleOpenEditCategory(cat)}
                              title="Sửa danh mục"
                            >
                              Sửa
                            </button>
                            <button
                              className="action-btn danger"
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'category',
                                  id: cat.id,
                                  name: cat.name,
                                })
                                setDeleteModalOpen(true)
                              }}
                              title="Xóa danh mục"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================================
          MODAL: XÁC NHẬN XÓA AN TOÀN
          ======================================================== */}
      {deleteModalOpen && deleteTarget && (
        <div className="modal-overlay" onClick={() => !formSubmitting && setDeleteModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#ef5350' }}>⚠️ Xác nhận xóa</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteModalOpen(false)}
                disabled={formSubmitting}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, color: '#2c3e33', fontSize: '0.95rem' }}>
                Bạn có chắc chắn muốn xóa{' '}
                {deleteTarget.type === 'item' ? 'món ăn' : 'danh mục'}{' '}
                <strong>"{deleteTarget.name}"</strong> không?
              </p>
              {deleteTarget.type === 'item' && (
                <p style={{ margin: '6px 0 0', color: '#8b9c91', fontSize: '0.82rem' }}>
                  * File ảnh lưu trên server cũng sẽ được xóa an toàn.
                </p>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={formSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="action-btn danger"
                style={{ padding: '9px 20px', fontSize: '0.85rem' }}
                onClick={handleConfirmDelete}
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TOAST NOTIFICATION
          ======================================================== */}
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span>{toast.type === 'error' ? '❌' : '✅'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AdminLayout>
  )
}

export default MenuPage
