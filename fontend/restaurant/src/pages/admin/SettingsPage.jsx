import AdminLayout from '../../components/admin/AdminLayout'

function SettingsPage() {
  return (
    <AdminLayout
      title="Cài đặt hệ thống"
      subtitle="Cài đặt"
    >
      <div className="settings-container">
        <div className="settings-section">
          <h3>Thông tin nhà hàng</h3>
          <div className="form-group">
            <label>Tên nhà hàng</label>
            <input type="text" placeholder="Nhà hàng Hoa Sen" />
          </div>
          <div className="form-group">
            <label>Địa chỉ</label>
            <input type="text" placeholder="123 Đường ABC, TP HCM" />
          </div>
          <div className="form-group">
            <label>Số điện thoại</label>
            <input type="text" placeholder="0123456789" />
          </div>
          <button className="primary-btn">Lưu thay đổi</button>
        </div>

        <div className="settings-section">
          <h3>Cài đặt hệ thống</h3>
          <div className="form-group checkbox">
            <input type="checkbox" id="notifications" defaultChecked />
            <label htmlFor="notifications">Bật thông báo</label>
          </div>
          <div className="form-group checkbox">
            <input type="checkbox" id="backup" defaultChecked />
            <label htmlFor="backup">Sao lưu tự động hàng ngày</label>
          </div>
          <button className="primary-btn">Lưu cài đặt</button>
        </div>

        <div className="settings-section danger">
          <h3>Nguy hiểm</h3>
          <p>Các thao tác này không thể hoàn tác</p>
          <button className="danger-btn">Xóa tất cả dữ liệu</button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default SettingsPage
