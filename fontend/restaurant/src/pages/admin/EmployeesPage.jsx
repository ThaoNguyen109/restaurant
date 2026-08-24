import AdminLayout from '../../components/admin/AdminLayout'

function EmployeesPage() {
  const employees = [
    { id: 1, name: 'Nguyễn Văn A', role: 'Đầu bếp', status: 'Đang làm', shift: '08:00 - 16:00' },
    { id: 2, name: 'Trần Thị B', role: 'Phục vụ', status: 'Đang làm', shift: '08:00 - 16:00' },
    { id: 3, name: 'Phạm Văn C', role: 'Thu ngân', status: 'Nghỉ', shift: '16:00 - 00:00' },
  ]

  return (
    <AdminLayout
      title="Quản lý nhân viên"
      subtitle="Nhân sự"
      actions={<button className="primary-btn">+ Thêm nhân viên</button>}
    >
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên nhân viên</th>
              <th>Chức vụ</th>
              <th>Trạng thái</th>
              <th>Ca làm</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td><strong>{emp.name}</strong></td>
                <td>{emp.role}</td>
                <td>
                  <span className={`status-badge status-${emp.status === 'Đang làm' ? 'active' : 'inactive'}`}>
                    {emp.status}
                  </span>
                </td>
                <td>{emp.shift}</td>
                <td>
                  <button className="action-btn">Sửa</button>
                  <button className="action-btn danger">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export default EmployeesPage
