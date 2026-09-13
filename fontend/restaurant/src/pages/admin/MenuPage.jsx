import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import './MenuManagement.css'
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  updateMenuItemStatus,
} from '../../services/menuItemService'
import {
  getAllCategories,
  createCategory,
  updateCategory,
} from '../../services/categoryService'
import {
  getAllCombos,
  createCombo,
  updateCombo,
} from '../../services/comboService'
import { getImageFullUrl } from '../../services/apiClient'

function MenuPage() {
  // viewMode: 'list' (danh sách) | 'item-form' (form món) | 'category-form' (form danh mục) | 'combo-form' (form combo)
  const [viewMode, setViewMode] = useState('list')
  const [activeTab, setActiveTab] = useState('items') // 'items' | 'categories' | 'combos'

  // Dữ liệu
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(false)

  // Bộ lọc Món ăn
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // Bộ lọc Combo
  const [filterComboStatus, setFilterComboStatus] = useState('')
  const [searchComboKeyword, setSearchComboKeyword] = useState('')

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

  // State Form Combo & Combo Items
  const [editingCombo, setEditingCombo] = useState(null)
  const [comboFormData, setComboFormData] = useState({
    name: '',
    price: '',
    description: '',
    status: 'ACTIVE',
  })
  const [comboSelectedFile, setComboSelectedFile] = useState(null)
  const [comboImagePreview, setComboImagePreview] = useState(null)
  const [selectedComboItems, setSelectedComboItems] = useState([]) // [{ menuItemId, quantity, menuItemName, menuItemPrice, menuItemImage }]
  const [addMenuItemId, setAddMenuItemId] = useState('')
  const [addMenuItemQty, setAddMenuItemQty] = useState(1)
  const comboFileInputRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Tải dữ liệu từ API (Tải toàn bộ gồm cả ACTIVE và INACTIVE)
  const loadData = async () => {
    try {
      setLoading(true)
      const [catsResult, itemsResult, comboResult] = await Promise.allSettled([
        getAllCategories(),
        getAllMenuItems({
          categoryId: filterCategory || undefined,
          status: filterStatus || undefined,
          search: searchKeyword || undefined,
        }),
        getAllCombos(),
      ])

      if (catsResult.status === 'fulfilled') {
        setCategories(Array.isArray(catsResult.value) ? catsResult.value : [])
      }
      if (itemsResult.status === 'fulfilled') {
        setMenuItems(Array.isArray(itemsResult.value) ? itemsResult.value : [])
      }
      if (comboResult.status === 'fulfilled') {
        setCombos(Array.isArray(comboResult.value) ? comboResult.value : [])
      }

      if (catsResult.status === 'rejected' && itemsResult.status === 'rejected') {
        const err = catsResult.reason || itemsResult.reason
        showToast(err?.message || 'Lỗi khi tải dữ liệu từ máy chủ', 'error')
      }
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

  // --- XỬ LÝ FORM MÓN ĂN ---

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
      showToast('Đã cập nhật trạng thái món ăn!')
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
      setActiveTab('categories')
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu danh mục', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleQuickCategoryStatusChange = async (cat, newStatus) => {
    try {
      await updateCategory(cat.id, {
        name: cat.name,
        description: cat.description,
        status: newStatus,
      })
      showToast('Đã cập nhật trạng thái danh mục!')
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, status: newStatus } : c))
      )
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái danh mục', 'error')
    }
  }

  // --- XỬ LÝ FORM COMBO & MÓN ĂN TRONG COMBO ---

  const handleOpenCreateCombo = () => {
    setEditingCombo(null)
    setComboFormData({
      name: '',
      price: '',
      description: '',
      status: 'ACTIVE',
    })
    setComboSelectedFile(null)
    setComboImagePreview(null)
    setSelectedComboItems([])
    setAddMenuItemId('')
    setAddMenuItemQty(1)
    setViewMode('combo-form')
  }

  const handleOpenEditCombo = (combo) => {
    setEditingCombo(combo)
    setComboFormData({
      name: combo.name || '',
      price: combo.price || '',
      description: combo.description || '',
      status: combo.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    })
    setComboSelectedFile(null)
    setComboImagePreview(combo.image ? getImageFullUrl(combo.image) : null)

    // Map combo items
    const existingItems = (combo.items || []).map((i) => ({
      menuItemId: i.menuItemId,
      quantity: i.quantity || 1,
      menuItemName: i.menuItemName,
      menuItemPrice: i.menuItemPrice,
      menuItemImage: i.menuItemImage,
    }))
    setSelectedComboItems(existingItems)
    setAddMenuItemId('')
    setAddMenuItemQty(1)
    setViewMode('combo-form')
  }

  const handleAddDishToCombo = () => {
    if (!addMenuItemId) {
      showToast('Vui lòng chọn món ăn cần thêm vào combo', 'error')
      return
    }

    const dish = menuItems.find((m) => String(m.id) === String(addMenuItemId))
    if (!dish) return

    setSelectedComboItems((prev) => {
      const idx = prev.findIndex((i) => String(i.menuItemId) === String(dish.id))
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx].quantity += Number(addMenuItemQty)
        return updated
      } else {
        return [
          ...prev,
          {
            menuItemId: dish.id,
            quantity: Number(addMenuItemQty),
            menuItemName: dish.name,
            menuItemPrice: dish.price,
            menuItemImage: dish.image,
          },
        ]
      }
    })

    setAddMenuItemId('')
    setAddMenuItemQty(1)
    showToast(`Đã thêm món "${dish.name}" vào danh sách combo`)
  }

  const handleUpdateComboItemQty = (index, delta) => {
    setSelectedComboItems((prev) => {
      const updated = [...prev]
      const newQty = updated[index].quantity + delta
      if (newQty <= 0) {
        updated.splice(index, 1)
      } else {
        updated[index].quantity = newQty
      }
      return updated
    })
  }

  const handleRemoveDishFromCombo = (index) => {
    setSelectedComboItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleComboFileChange = (e) => {
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
      setComboSelectedFile(file)
      setComboImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveComboImage = () => {
    setComboSelectedFile(null)
    setComboImagePreview(null)
    if (comboFileInputRef.current) {
      comboFileInputRef.current.value = ''
    }
  }

  const handleSaveCombo = async (e) => {
    e.preventDefault()

    if (!comboFormData.name.trim()) {
      showToast('Vui lòng nhập tên combo', 'error')
      return
    }
    if (!comboFormData.price || Number(comboFormData.price) <= 0) {
      showToast('Giá bán combo phải lớn hơn 0', 'error')
      return
    }

    try {
      setFormSubmitting(true)
      const formData = new FormData()
      formData.append('name', comboFormData.name.trim())
      formData.append('price', comboFormData.price)
      formData.append('description', comboFormData.description || '')
      formData.append('status', comboFormData.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE')

      if (comboSelectedFile) {
        formData.append('image', comboSelectedFile)
      }

      // Đưa danh sách combo items vào form
      const itemsPayload = selectedComboItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }))
      formData.append('itemsJson', JSON.stringify(itemsPayload))

      if (editingCombo) {
        await updateCombo(editingCombo.id, formData)
        showToast(`Cập nhật combo "${comboFormData.name}" thành công!`)
      } else {
        await createCombo(formData)
        showToast(`Thêm combo "${comboFormData.name}" thành công!`)
      }

      setViewMode('list')
      setActiveTab('combos')
      loadData()
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu combo', 'error')
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleQuickComboStatusChange = async (combo, newStatus) => {
    try {
      const formData = new FormData()
      formData.append('name', combo.name)
      formData.append('price', combo.price)
      formData.append('description', combo.description || '')
      formData.append('status', newStatus)

      await updateCombo(combo.id, formData)
      showToast('Đã cập nhật trạng thái combo!')
      setCombos((prev) =>
        prev.map((c) => (c.id === combo.id ? { ...c, status: newStatus } : c))
      )
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái combo', 'error')
    }
  }

  const formatCurrency = (val) => {
    if (!val) return '0 ₫'
    return Number(val).toLocaleString('vi-VN') + ' ₫'
  }

  // Tính tổng giá tiền gốc các món trong combo
  const totalOriginalDishPrice = selectedComboItems.reduce(
    (sum, item) => sum + (item.menuItemPrice || 0) * item.quantity,
    0
  )
  const savingsAmount = totalOriginalDishPrice - (Number(comboFormData.price) || 0)

  // Thống kê
  const totalItems = menuItems.length
  const activeCount = menuItems.filter((i) => i.status === 'ACTIVE' || !i.status).length
  const totalCategories = categories.length
  const totalCombos = combos.length
  const activeCombosCount = combos.filter((c) => c.status === 'ACTIVE' || !c.status).length

  // Lọc danh sách combo ở giao diện
  const filteredCombos = combos.filter((c) => {
    const matchStatus =
      !filterComboStatus ||
      (filterComboStatus === 'ACTIVE' ? c.status !== 'INACTIVE' : c.status === 'INACTIVE')
    const matchSearch =
      !searchComboKeyword ||
      c.name.toLowerCase().includes(searchComboKeyword.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchComboKeyword.toLowerCase()))
    return matchStatus && matchSearch
  })

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
            : viewMode === 'combo-form'
              ? editingCombo
                ? 'Chỉnh sửa Combo'
                : 'Thêm Combo mới'
              : 'Quản lý thực đơn & danh mục'
      }
      subtitle="Thực đơn"
      actions={
        viewMode === 'list' ? (
          activeTab === 'items' ? (
            <button className="btn-primary-large" onClick={handleOpenCreateItem}>
              + Thêm món ăn mới
            </button>
          ) : activeTab === 'categories' ? (
            <button className="btn-primary-large" onClick={handleOpenCreateCategory}>
              + Thêm danh mục mới
            </button>
          ) : (
            <button className="btn-primary-large" onClick={handleOpenCreateCombo}>
              + Thêm combo mới
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
            VIEW 1: FORM THÊM / SỬA MÓN ĂN
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

                  {/* LIVE PREVIEW */}
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
            VIEW 3: FORM THÊM / SỬA COMBO (VỚI QUẢN LÝ COMBO ITEMS)
            ======================================================== */}
        {viewMode === 'combo-form' && (
          <div className="form-page-card">
            <div className="form-page-header">
              <div className="form-page-header-title">
                <h2>{editingCombo ? '✏️ Chỉnh sửa thông tin Combo' : '🍱 Tạo Combo mới'}</h2>
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

            <form onSubmit={handleSaveCombo}>
              <div className="form-page-layout">
                {/* CỘT TRÁI: THÔNG TIN CHI TIẾT & CHỌN MÓN VÀO COMBO */}
                <div className="form-column-main">
                  <div className="form-section-box">
                    <h4 className="form-section-title">📝 Thông tin cơ bản</h4>

                    <div className="form-group-large">
                      <label>Tên Combo <span style={{ color: '#ef5350' }}>*</span></label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Combo Gia Đình Hạnh Phúc 4 Người"
                        value={comboFormData.name}
                        onChange={(e) => setComboFormData({ ...comboFormData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div className="form-group-large">
                        <label>Giá Combo (VNĐ) <span style={{ color: '#ef5350' }}>*</span></label>
                        <input
                          type="number"
                          placeholder="Ví dụ: 499000"
                          min="1000"
                          step="1000"
                          value={comboFormData.price}
                          onChange={(e) =>
                            setComboFormData({ ...comboFormData, price: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="form-group-large">
                        <label>Trạng thái hiển thị</label>
                        <select
                          value={comboFormData.status}
                          onChange={(e) => setComboFormData({ ...comboFormData, status: e.target.value })}
                        >
                          <option value="ACTIVE">🟢 Hiển thị</option>
                          <option value="INACTIVE">⚪ Ẩn</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* QUẢN LÝ CÁC MÓN ĂN TRONG COMBO (COMBO ITEMS) */}
                  <div className="form-section-box">
                    <h4 className="form-section-title">🍱 Danh sách món ăn trong Combo</h4>

                    <div className="combo-items-builder">
                      <div className="combo-item-add-row">
                        <select
                          value={addMenuItemId}
                          onChange={(e) => setAddMenuItemId(e.target.value)}
                        >
                          <option value="">-- Chọn món ăn để thêm vào Combo --</option>
                          {menuItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({formatCurrency(item.price)})
                            </option>
                          ))}
                        </select>

                        <div className="qty-input-box">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => setAddMenuItemQty((q) => Math.max(1, q - 1))}
                          >
                            -
                          </button>
                          <span className="qty-val">{addMenuItemQty}</span>
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => setAddMenuItemQty((q) => q + 1)}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ background: '#2a4736', color: '#ffffff' }}
                          onClick={handleAddDishToCombo}
                        >
                          + Thêm vào Combo
                        </button>
                      </div>

                      {/* BẢNG CÁC MÓN ĐÃ CHỌN TRONG COMBO */}
                      {selectedComboItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '16px', color: '#8b9c91', fontSize: '0.88rem' }}>
                          💡 Chưa có món ăn nào được chọn. Hãy chọn món ở trên để đưa vào Combo!
                        </div>
                      ) : (
                        <>
                          <table className="combo-selected-items-table">
                            <thead>
                              <tr>
                                <th>Tên món ăn</th>
                                <th>Đơn giá gốc</th>
                                <th style={{ textAlign: 'center' }}>Số lượng</th>
                                <th>Thành tiền</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedComboItems.map((item, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <strong style={{ color: '#1e3527' }}>{item.menuItemName}</strong>
                                  </td>
                                  <td style={{ color: '#6a7e71' }}>{formatCurrency(item.menuItemPrice)}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <div className="qty-input-box" style={{ display: 'inline-flex' }}>
                                      <button
                                        type="button"
                                        className="qty-btn"
                                        style={{ width: 28, height: 28 }}
                                        onClick={() => handleUpdateComboItemQty(idx, -1)}
                                      >
                                        -
                                      </button>
                                      <span className="qty-val" style={{ width: 30, fontSize: '0.85rem' }}>
                                        {item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        className="qty-btn"
                                        style={{ width: 28, height: 28 }}
                                        onClick={() => handleUpdateComboItemQty(idx, 1)}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  <td style={{ fontWeight: 700, color: '#1e3527' }}>
                                    {formatCurrency((item.menuItemPrice || 0) * item.quantity)}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      className="action-btn danger"
                                      style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                                      onClick={() => handleRemoveDishFromCombo(idx)}
                                    >
                                      ✕ Bỏ món
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* SO SÁNH GIÁ & SỐ TIỀN TIẾT KIỆM */}
                          <div className="combo-price-compare-box">
                            <div>
                              <span>Tổng giá gốc các món: </span>
                              <strong style={{ textDecoration: 'line-through', color: '#8d6e63' }}>
                                {formatCurrency(totalOriginalDishPrice)}
                              </strong>
                            </div>
                            <div>
                              {savingsAmount > 0 ? (
                                <span style={{ color: '#2e7d32', fontWeight: 700 }}>
                                  🎉 Tiết kiệm cho khách hàng: {formatCurrency(savingsAmount)}
                                </span>
                              ) : (
                                <span style={{ color: '#ef6c00' }}>
                                  Giá bán Combo: {formatCurrency(comboFormData.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="form-section-box">
                    <h4 className="form-section-title">📝 Ghi chú & Mô tả khác</h4>

                    <div className="form-group-large">
                      <label>Mô tả bổ sung (Khẩu phần, lưu ý phục vụ, ưu đãi đi kèm...)</label>
                      <textarea
                        rows="3"
                        placeholder="Mô tả thêm lưu ý phục vụ hoặc quà tặng đính kèm nếu có..."
                        value={comboFormData.description}
                        onChange={(e) =>
                          setComboFormData({ ...comboFormData, description: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* CỘT PHẢI: UPLOAD HÌNH ẢNH & XEM TRƯỚC COMBO */}
                <div className="form-column-side">
                  <div className="form-section-box">
                    <h4 className="form-section-title">📷 Hình ảnh Combo</h4>

                    <input
                      type="file"
                      ref={comboFileInputRef}
                      accept="image/png, image/jpeg, image/webp, image/gif"
                      style={{ display: 'none' }}
                      onChange={handleComboFileChange}
                    />

                    {comboImagePreview ? (
                      <div className="image-preview-card-large">
                        <img src={comboImagePreview} alt="Xem trước ảnh combo" />
                        <div className="preview-overlay-actions">
                          <button
                            type="button"
                            className="overlay-btn"
                            onClick={() => comboFileInputRef.current?.click()}
                          >
                            🔄 Đổi ảnh khác
                          </button>
                          <button
                            type="button"
                            className="overlay-btn danger"
                            onClick={handleRemoveComboImage}
                          >
                            ✕ Xóa ảnh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="image-upload-dropzone-large"
                        onClick={() => comboFileInputRef.current?.click()}
                      >
                        <span className="dropzone-icon-large">🍱</span>
                        <span className="dropzone-text-large">Chọn hình ảnh cho Combo</span>
                        <span className="dropzone-subtext-large">
                          Hỗ trợ định dạng JPG, PNG, WEBP (Dung lượng tối đa 10MB)
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ marginTop: 8 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            comboFileInputRef.current?.click()
                          }}
                        >
                          📂 Duyệt file trên máy
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LIVE PREVIEW COMBO */}
                  <div className="form-section-box">
                    <h4 className="form-section-title">👁️ Xem trước hiển thị Combo</h4>
                    <div className="live-preview-box" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        {comboImagePreview ? (
                          <img src={comboImagePreview} alt="Preview Combo" className="live-preview-img" />
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
                            🍱
                          </div>
                        )}
                        <div className="live-preview-info">
                          <span className="live-preview-title">
                            {comboFormData.name || 'Tên Combo'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#ef6c00', fontWeight: 600 }}>
                            🔥 COMBO TIẾT KIỆM ({selectedComboItems.length} món)
                          </span>
                          <span className="live-preview-price">
                            {comboFormData.price ? formatCurrency(comboFormData.price) : '0 ₫'}
                          </span>
                        </div>
                      </div>

                      {/* HIỂN THỊ CÁC MÓN ĂN ĐÃ CHỌN TRONG PREVIEW */}
                      {selectedComboItems.length > 0 && (
                        <div className="combo-dishes-tags" style={{ marginTop: 10, borderTop: '1px solid #edf2ee', paddingTop: 10 }}>
                          {selectedComboItems.map((item, i) => (
                            <span key={i} className="dish-pill-badge">
                              <span className="qty">{item.quantity}x</span> {item.menuItemName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                    '⏳ Đang lưu dữ liệu...'
                  ) : editingCombo ? (
                    '💾 Cập nhật Combo'
                  ) : (
                    '✨ Thêm Combo ngay'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            VIEW 4: DANH SÁCH MÓN ĂN, DANH MỤC & COMBO (LIST VIEW)
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
                className={`menu-tab-btn ${activeTab === 'combos' ? 'active' : ''}`}
                onClick={() => setActiveTab('combos')}
              >
                <span>🍱 Quản lý Combo</span>
                <span className="tab-badge">{totalCombos}</span>
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
                  <span className="stat-chip-label">Tổng món ({activeCount} hiển thị)</span>
                </div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon orange">🍱</div>
                <div className="stat-chip-info">
                  <span className="stat-chip-val">{totalCombos}</span>
                  <span className="stat-chip-label">Tổng Combo ({activeCombosCount} hiển thị)</span>
                </div>
              </div>
              <div className="stat-chip">
                <div className="stat-chip-icon blue">📁</div>
                <div className="stat-chip-info">
                  <span className="stat-chip-val">{totalCategories}</span>
                  <span className="stat-chip-label">Danh mục món</span>
                </div>
              </div>
            </div>

            {/* TAB 1: MÓN ĂN */}
            {activeTab === 'items' && (
              <>
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
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* TAB 2: QUẢN LÝ COMBO */}
            {activeTab === 'combos' && (
              <>
                <div className="filter-bar">
                  <div className="filter-left">
                    <div className="search-box">
                      <span className="search-icon">🔍</span>
                      <input
                        type="text"
                        placeholder="Tìm theo tên combo, mô tả món..."
                        value={searchComboKeyword}
                        onChange={(e) => setSearchComboKeyword(e.target.value)}
                      />
                    </div>

                    <select
                      className="filter-select"
                      value={filterComboStatus}
                      onChange={(e) => setFilterComboStatus(e.target.value)}
                    >
                      <option value="">-- Tất cả trạng thái --</option>
                      <option value="ACTIVE">🟢 Hiển thị</option>
                      <option value="INACTIVE">⚪ Ẩn</option>
                    </select>
                  </div>

                  <div className="filter-right">
                    {(filterComboStatus || searchComboKeyword) && (
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setFilterComboStatus('')
                          setSearchComboKeyword('')
                        }}
                      >
                        ✕ Xóa lọc
                      </button>
                    )}
                    <button className="btn-secondary" onClick={loadData} title="Làm mới">
                      🔄 Làm mới
                    </button>
                    <button className="btn-primary-large" onClick={handleOpenCreateCombo}>
                      + Thêm combo mới
                    </button>
                  </div>
                </div>

                <div className="table-card">
                  {loading ? (
                    <div className="table-loading-state">
                      <div className="spinner" />
                      <p>Đang tải danh sách combo...</p>
                    </div>
                  ) : filteredCombos.length === 0 ? (
                    <div className="table-empty-state">
                      <div className="icon">🍱</div>
                      <p>
                        {combos.length === 0
                          ? 'Chưa có Combo nào được tạo trong hệ thống.'
                          : 'Không tìm thấy Combo nào phù hợp với bộ lọc.'}
                      </p>
                      <button
                        className="btn-primary-large"
                        onClick={handleOpenCreateCombo}
                        style={{ marginTop: 14 }}
                      >
                        + Tạo Combo đầu tiên ngay
                      </button>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '48%' }}>Combo & Danh sách món bao gồm</th>
                          <th>Giá Combo</th>
                          <th>Trạng thái</th>
                          <th style={{ textAlign: 'right' }}>Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCombos.map((combo) => (
                          <tr key={combo.id}>
                            <td>
                              <div className="menu-item-row-cell" style={{ alignItems: 'flex-start' }}>
                                <div className="item-thumb-wrapper" style={{ borderColor: 'rgba(239, 108, 0, 0.2)', marginTop: 4 }}>
                                  {combo.image ? (
                                    <img
                                      src={getImageFullUrl(combo.image)}
                                      alt={combo.name}
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
                                    style={{ display: combo.image ? 'none' : 'block' }}
                                  >
                                    🍱
                                  </span>
                                </div>
                                <div className="item-meta">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="item-name">{combo.name}</span>
                                    <span
                                      style={{
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        color: '#ef6c00',
                                        background: '#fff3e0',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                      }}
                                    >
                                      COMBO
                                    </span>
                                  </div>
                                  {combo.description && (
                                    <span
                                      className="item-ingredients"
                                      title={combo.description}
                                      style={{ maxWidth: 380 }}
                                    >
                                      📝 {combo.description}
                                    </span>
                                  )}
                                  {/* CÁC MÓN ĂN TRONG COMBO */}
                                  {combo.items && combo.items.length > 0 && (
                                    <div className="combo-dishes-tags">
                                      {combo.items.map((item, idx) => (
                                        <span key={idx} className="dish-pill-badge">
                                          <span className="qty">{item.quantity}x</span> {item.menuItemName}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="price" style={{ color: '#ef6c00', fontWeight: 800 }}>
                              {formatCurrency(combo.price)}
                            </td>
                            <td>
                              <select
                                className={`status-select-badge ${combo.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}`}
                                value={combo.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
                                onChange={(e) =>
                                  handleQuickComboStatusChange(combo, e.target.value)
                                }
                              >
                                <option value="ACTIVE">Hiển thị</option>
                                <option value="INACTIVE">Ẩn</option>
                              </select>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="action-btn"
                                onClick={() => handleOpenEditCombo(combo)}
                                title="Sửa combo"
                              >
                                Sửa
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

            {/* TAB 3: DANH MỤC */}
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
                            <select
                              className={`status-select-badge ${cat.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}`}
                              value={cat.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'}
                              onChange={(e) =>
                                handleQuickCategoryStatusChange(cat, e.target.value)
                              }
                            >
                              <option value="ACTIVE">Hiển thị</option>
                              <option value="INACTIVE">Ẩn</option>
                            </select>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="action-btn"
                              onClick={() => handleOpenEditCategory(cat)}
                              title="Sửa danh mục"
                            >
                              Sửa
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
