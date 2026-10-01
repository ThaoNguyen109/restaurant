import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/auth/Login'
import AdminDashboard from '../pages/admin/AdminDashboard'
import EmployeesPage from '../pages/admin/EmployeesPage'
import OrdersPage from '../pages/admin/OrdersPage'
import InventoryPage from '../pages/admin/InventoryPage'
import MenuPage from '../pages/admin/MenuPage'
import ReportsPage from '../pages/admin/ReportsPage'
import SettingsPage from '../pages/admin/SettingsPage'
import TablesPage from '../pages/admin/TablesPage'
import ReservationsPage from '../pages/admin/ReservationsPage'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import StaffDashboard from '../pages/staff/StaffDashboard'
import KitchenPage from '../pages/staff/KitchenPage'
import CashierPage from '../pages/staff/CashierPage'
import CustomerPage from '../pages/customer/CustomerPage'
import CustomerMenuPage from '../pages/customer/CustomerMenuPage'
import StaffReservationsPage from '../pages/staff/StaffReservationsPage'
import ProtectedRoute from '../components/ProtectedRoute'

export const router = createBrowserRouter([
  // ── Trang đăng nhập (public) ──────────────────────────────────────
  {
    path: '/',
    element: <Login />,
  },

  // ── Trang khách hàng (public – không cần đăng nhập) ──────────────
  {
    path: '/menu',
    element: <CustomerMenuPage />,
  },
  {
    path: '/customer/menu',
    element: <CustomerMenuPage />,
  },
  {
    path: '/customer',
    element: <CustomerPage />,
  },

  // ── Admin (chỉ ADMIN) ─────────────────────────────────────────────
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/employees',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <EmployeesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/orders',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <OrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/inventory',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <InventoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/menu',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <MenuPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/tables',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <TablesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reservations',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <ReservationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <ReportsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/settings',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },

  // ── Manager (ADMIN + MANAGER) ─────────────────────────────────────
  {
    path: '/manager',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
        <ManagerDashboard />
      </ProtectedRoute>
    ),
  },

  // ── Nhân viên phục vụ (ADMIN + MANAGER + WAITER + STAFF + RECEPTIONIST) ──
  {
    path: '/staff',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'RECEPTIONIST']}>
        <StaffDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/waiter',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'RECEPTIONIST']}>
        <StaffDashboard />
      </ProtectedRoute>
    ),
  },

  // ── Quản lý đặt bàn cho nhân viên (ADMIN + MANAGER + WAITER + STAFF + RECEPTIONIST) ──
  {
    path: '/staff/reservations',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'RECEPTIONIST']}>
        <StaffReservationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reservations',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'WAITER', 'STAFF', 'RECEPTIONIST']}>
        <StaffReservationsPage />
      </ProtectedRoute>
    ),
  },

  // ── Bếp (ADMIN + MANAGER + KITCHEN + CHEF) ─────────────────────
  {
    path: '/kitchen',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF']}>
        <KitchenPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/staff/kitchen',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'KITCHEN', 'CHEF']}>
        <KitchenPage />
      </ProtectedRoute>
    ),
  },

  // ── Thu ngân (ADMIN + MANAGER + CASHIER) ─────────────────────────
  {
    path: '/cashier',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER']}>
        <CashierPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/staff/cashier',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'CASHIER']}>
        <CashierPage />
      </ProtectedRoute>
    ),
  },
])
