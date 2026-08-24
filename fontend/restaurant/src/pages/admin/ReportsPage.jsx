import AdminLayout from '../../components/admin/AdminLayout'

function ReportsPage() {
  return (
    <AdminLayout
      title="Báo cáo kinh doanh"
      subtitle="Báo cáo"
      actions={<button className="primary-btn">+ Tạo báo cáo mới</button>}
    >
      <div className="report-grid">
        <div className="report-card">
          <h3>Doanh thu theo ngày</h3>
          <p>Xem chi tiết doanh thu hàng ngày, so sánh với các kỳ trước</p>
          <button className="primary-btn">Xem báo cáo</button>
        </div>
        <div className="report-card">
          <h3>Báo cáo bán hàng</h3>
          <p>Phân tích các món ăn bán chạy, kém bán</p>
          <button className="primary-btn">Xem báo cáo</button>
        </div>
        <div className="report-card">
          <h3>Báo cáo nhân viên</h3>
          <p>Theo dõi hiệu suất, ca làm, lương thưởng</p>
          <button className="primary-btn">Xem báo cáo</button>
        </div>
        <div className="report-card">
          <h3>Báo cáo kho hàng</h3>
          <p>Theo dõi tồn kho, lịch sử nhập xuất</p>
          <button className="primary-btn">Xem báo cáo</button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default ReportsPage
