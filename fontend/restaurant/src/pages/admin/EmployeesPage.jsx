import { useState, useMemo } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'

function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  const employees = [
    { id: 1, name: 'Nguyễn Văn A', role: 'Đầu bếp', status: 'Đang làm', shift: '08:00 - 16:00' },
    { id: 2, name: 'Trần Thị B', role: 'Phục vụ', status: 'Đang làm', shift: '08:00 - 16:00' },
    { id: 3, name: 'Phạm Văn C', role: 'Thu ngân', status: 'Nghỉ', shift: '16:00 - 00:00' },
  ]

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !searchTerm || 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.shift.toLowerCase().includes(searchTerm.toLowerCase())
      const matchRole = roleFilter === 'ALL' || emp.role === roleFilter
      return matchSearch && matchRole
    })
  }, [employees, searchTerm, roleFilter])

  return (
    <AdminLayout
      title="Quản lý nhân viên"
      subtitle="Nhân sự"
      actions={<button className="primary-btn">+ Thêm nhân viên</button>}
    >
      {/* ── UNIFIED TOOLBAR & SEARCH BAR ── */}
      <div className="admin-toolbar" style={{ alignItems: 'center', marginBottom: 16 }}>
        <div className="admin-search-bar" style={{ minWidth: 320, flex: 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="admin-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên nhân viên, chức vụ, ca làm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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

        <div className="admin-toolbar-right">
          <select
            className="admin-filter-select"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Tất cả chức vụ</option>
            <option value="Đầu bếp">Đầu bếp</option>
            <option value="Phục vụ">Phục vụ</option>
            <option value="Thu ngân">Thu ngân</option>
          </select>

          {(searchTerm || roleFilter !== 'ALL') && (
            <button
              type="button"
              className="admin-btn-reset"
              onClick={() => {
                setSearchTerm('')
                setRoleFilter('ALL')
              }}
            >
              ✕ Xóa lọc
            </button>
          )}
        </div>
      </div>

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
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b' }}>
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr
                  key={emp.id}
                  className="clickable-row"
                  style={{ cursor: 'pointer' }}
                  title="Bấm để xem và sửa thông tin nhân viên"
                >
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.role}</td>
                  <td>
                    <span className={`status-badge status-${emp.status === 'Đang làm' ? 'active' : 'inactive'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>{emp.shift}</td>
                  <td>
                    <button className="action-btn" onClick={e => e.stopPropagation()}>Sửa</button>
                    <button className="action-btn danger" onClick={e => e.stopPropagation()}>Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}

export default EmployeesPage
