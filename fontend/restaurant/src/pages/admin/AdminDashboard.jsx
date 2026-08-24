
import './AdminDashboard.css';
import AdminLayout from '../../components/admin/AdminLayout';

function AdminDashboard() {
  // Dữ liệu giả lập thống kê
  const stats = [
    { title: 'Doanh thu hôm nay', value: '18.450.000 ₫', change: '+12.5%', isUp: true, icon: '💰' },
    { title: 'Tổng đơn hàng', value: '128 đơn', change: '+8.2%', isUp: true, icon: '🧾' },
    { title: 'Bàn đang phục vụ', value: '14 / 20', change: '70% công suất', isUp: true, icon: '🍽️' },
    { title: 'Khách hàng mới', value: '34 người', change: '-2.1%', isUp: false, icon: '👥' },
  ];

  // Dữ liệu doanh thu tuần (đơn vị: triệu VNĐ)
  const chartData = [
    { day: 'T2', value: 12 },
    { day: 'T3', value: 15 },
    { day: 'T4', value: 14 },
    { day: 'T5', value: 18 },
    { day: 'T6', value: 22 },
    { day: 'T7', value: 28 },
    { day: 'CN', value: 25 },
  ];

  // Danh sách đơn hàng mới nhất
  const recentOrders = [
    { id: '#ORD-1024', table: 'Bàn 04', items: 'Lẩu sen đồng, Trà sen 2x', total: '680.000 ₫', status: 'completed', label: 'Hoàn thành' },
    { id: '#ORD-1023', table: 'Bàn 12', items: 'Cơm hấp lá sen, Gỏi ngó sen', total: '450.000 ₫', status: 'preparing', label: 'Đang chế biến' },
    { id: '#ORD-1022', table: 'Mang về', items: 'Vịt nấu chao, Xôi hạt sen', total: '380.000 ₫', status: 'delivering', label: 'Đang giao' },
    { id: '#ORD-1021', table: 'Bàn 02', items: 'Chả giỏ hoa sen, Trà đá 4x', total: '290.000 ₫', status: 'completed', label: 'Hoàn thành' },
  ];

  // Top món bán chạy
  const topDishes = [
    { name: 'Cơm hấp lá sen', sales: 142, price: '120.000 ₫' },
    { name: 'Lẩu nấm hoa sen', sales: 98, price: '350.000 ₫' },
    { name: 'Gỏi ngó sen tôm thịt', sales: 85, price: '150.000 ₫' },
    { name: 'Trà cúc củ sen', sales: 210, price: '45.000 ₫' },
  ];

  return (
    <AdminLayout
      title="Chào mừng trở lại, Quản trị viên"
      subtitle="Dashboard"
      actions={<button className="primary-btn">+ Tạo báo cáo</button>}
    >
      <div className="admin-dashboard">
        {/* 1. KHOẢNG THỐNG KÊ NHANH (CARDS) */}
        <div className="dashboard-metrics">
          {stats.map((item, idx) => (
            <div key={idx} className="metric-card">
              <div className="metric-header">
                <span className="metric-title">{item.title}</span>
                <span className="metric-icon">{item.icon}</span>
              </div>
              <div className="metric-value">{item.value}</div>
              <div className={`metric-change ${item.isUp ? 'up' : 'down'}`}>
                <span>{item.isUp ? '↑' : '↓'}</span> {item.change}
                <span className="metric-subtext"> so với hôm qua</span>
              </div>
            </div>
          ))}
        </div>

        {/* 2. KHU VỰC BIỂU ĐỒ & TOP MÓN BÁN CHẠY */}
        <div className="dashboard-grid">
          {/* Biểu đồ doanh thu */}
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <h3>Doanh thu tuần này</h3>
              <span className="card-tag">Đơn vị: Triệu VNĐ</span>
            </div>
            <div className="bar-chart">
              {chartData.map((d, index) => (
                <div key={index} className="bar-group">
                  <div 
                    className="bar" 
                    style={{ height: `${(d.value / 30) * 100}%` }}
                    data-value={`${d.value}M`}
                  ></div>
                  <span className="bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Món ăn bán chạy */}
          <div className="dashboard-card top-dishes-card">
            <div className="card-header">
              <h3>Món ăn bán chạy</h3>
              <button className="text-btn">Xem tất cả</button>
            </div>
            <ul className="dishes-list">
              {topDishes.map((dish, i) => (
                <li key={i} className="dish-item">
                  <span className="dish-rank">0{i + 1}</span>
                  <div className="dish-info">
                    <strong>{dish.name}</strong>
                    <small>{dish.sales} lượt gọi</small>
                  </div>
                  <span className="dish-price">{dish.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. BẢNG ĐƠN HÀNG GẦN ĐÂY */}
        <div className="dashboard-card orders-card">
          <div className="card-header">
            <h3>Đơn hàng gần đây</h3>
            <button className="primary-btn">Tạo đơn mới +</button>
          </div>
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Vị trí / Bàn</th>
                  <th>Món ăn</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id}</td>
                    <td><strong>{order.table}</strong></td>
                    <td className="order-items">{order.items}</td>
                    <td className="order-total">{order.total}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;