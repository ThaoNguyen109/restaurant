import AdminLayout from '../../components/admin/AdminLayout'

function OrdersPage() {
  const orders = [
    { id: '#ORD-1025', table: 'Bàn 01', items: 'Lẩu sen đồng x2, Trà đá x3', total: '850.000 ₫', status: 'delivering' },
    { id: '#ORD-1026', table: 'Bàn 05', items: 'Cơm hấp lá sen, Gỏi ngó sen', total: '450.000 ₫', status: 'preparing' },
    { id: '#ORD-1027', table: 'Mang về', items: 'Vịt nấu chao, Xôi hạt sen', total: '380.000 ₫', status: 'completed' },
  ]

  return (
    <AdminLayout
      title="Quản lý đơn hàng"
      subtitle="Bán hàng"
      actions={<button className="primary-btn">+ Đơn hàng mới</button>}
    >
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Bàn / Vị trí</th>
              <th>Món ăn</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td className="order-id"><strong>{order.id}</strong></td>
                <td>{order.table}</td>
                <td>{order.items}</td>
                <td className="order-total">{order.total}</td>
                <td>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status === 'preparing' ? 'Đang chế biến' : order.status === 'delivering' ? 'Đang giao' : 'Hoàn thành'}
                  </span>
                </td>
                <td>
                  <button className="action-btn">Chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export default OrdersPage
