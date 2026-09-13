import './AdminLayout.css';
import '../../pages/admin/AdminPages.css';
import { useNavigate, useLocation } from 'react-router-dom';

function AdminLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Tổng quan', path: '/admin' },
    { label: 'Quản lý nhân viên', path: '/admin/employees' },
    { label: 'Đơn hàng', path: '/admin/orders' },
    { label: 'Quản lý bàn', path: '/admin/tables' },
    { label: 'Quản lý đặt bàn', path: '/admin/reservations' },
    { label: 'Kho nguyên liệu', path: '/admin/inventory' },
    { label: 'Thực đơn', path: '/admin/menu' },
    { label: 'Báo cáo', path: '/admin/reports' },
    { label: 'Cài đặt', path: '/admin/settings' },
  ];
  return (
    <div className="admin-layout">
      {/* 1. SIDEBAR */}
      <aside className="admin-layout__sidebar">
        <div className="admin-layout__brand">
          <div className="admin-layout__brand-mark">L</div>
          <div className="admin-layout__brand-text">
            <h2>Lotus Admin</h2>
            <p>Operations & Management</p>
          </div>
        </div>

        <nav className="admin-layout__nav" aria-label="Sidebar menu">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-bullet" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-layout__footer">
          <span className="shift-label">Ca làm hiện tại</span>
          <span className="shift-time">08:00 — 16:00</span>
        </div>
      </aside>

      {/* 2. MAIN WRAPPER */}
      <div className="admin-layout__wrapper">
        <header className="admin-layout__topbar">
          {/* Thay thế thanh tìm kiếm bằng Status / Time widget */}
          <div className="admin-layout__status-bar">
            <div className="status-item">
              <span className="status-dot online" />
              <span className="status-label">Hệ thống:</span>
              <span className="status-value">Hoạt động</span>
            </div>
            <div className="status-divider" />
            <div className="status-item">
              <span className="status-label">Cơ sở:</span>
              <span className="status-value">Hoa Sen Central</span>
            </div>
          </div>

          <div className="admin-layout__topbar-right">
            {/* Nút thông báo hình quả chuông SVG chuẩn luxury */}
            <button className="notification-btn" aria-label="Thông báo">
  <svg
    className="bell-icon"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
  <span className="badge">3</span>
</button>

            <div className="user-profile">
              <div className="avatar">AD</div>
              <div className="user-info">
                <span className="name">Quản lý</span>
                <span className="role">Nhà hàng Hoa Sen</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-layout__main">
          <div className="admin-layout__header">
            <div className="admin-layout__title">
              {subtitle && <p className="subtitle">{subtitle}</p>}
              <h1>{title}</h1>
            </div>
            {actions && <div className="admin-layout__actions">{actions}</div>}
          </div>

          <div className="admin-layout__content">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;