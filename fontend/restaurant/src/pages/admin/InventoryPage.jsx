import AdminLayout from '../../components/admin/AdminLayout'

function InventoryPage() {
  const inventory = [
    { id: 1, name: 'Thịt bò', unit: 'kg', quantity: 6, minLevel: 10, status: 'low' },
    { id: 2, name: 'Gạo', unit: 'kg', quantity: 24, minLevel: 15, status: 'ok' },
    { id: 3, name: 'Dầu ăn', unit: 'lít', quantity: 3, minLevel: 5, status: 'low' },
    { id: 4, name: 'Muối', unit: 'kg', quantity: 8, minLevel: 2, status: 'ok' },
  ]

  return (
    <AdminLayout
      title="Quản lý kho hàng"
      subtitle="Kho"
      actions={<button className="primary-btn">+ Nhập kho</button>}
    >
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên nguyên liệu</th>
              <th>Đơn vị</th>
              <th>Số lượng hiện tại</th>
              <th>Mức tối thiểu</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td><strong>{item.name}</strong></td>
                <td>{item.unit}</td>
                <td>{item.quantity}</td>
                <td>{item.minLevel}</td>
                <td>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status === 'low' ? 'Sắp hết' : 'Bình thường'}
                  </span>
                </td>
                <td>
                  <button className="action-btn">Cập nhật</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export default InventoryPage
