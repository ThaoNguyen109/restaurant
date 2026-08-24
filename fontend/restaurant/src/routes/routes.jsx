import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/auth/Login'
import AdminDashboard from '../pages/admin/AdminDashboard'
import EmployeesPage from '../pages/admin/EmployeesPage'
import OrdersPage from '../pages/admin/OrdersPage'
import InventoryPage from '../pages/admin/InventoryPage'
import MenuPage from '../pages/admin/MenuPage'
import ReportsPage from '../pages/admin/ReportsPage'
import SettingsPage from '../pages/admin/SettingsPage'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import StaffDashboard from '../pages/staff/StaffDashboard'
import CustomerPage from '../pages/customer/CustomerPage'
import CustomerMenuPage from '../pages/customer/CustomerMenuPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/menu',
    element: <CustomerMenuPage />,
  },
  {
    path: '/customer/menu',
    element: <CustomerMenuPage />,
  },
  {
    path: '/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/employees',
    element: <EmployeesPage />,
  },
  {
    path: '/admin/orders',
    element: <OrdersPage />,
  },
  {
    path: '/admin/inventory',
    element: <InventoryPage />,
  },
  {
    path: '/admin/menu',
    element: <MenuPage />,
  },
  {
    path: '/admin/reports',
    element: <ReportsPage />,
  },
  {
    path: '/admin/settings',
    element: <SettingsPage />,
  },
  {
    path: '/manager',
    element: <ManagerDashboard />,
  },
  {
    path: '/staff',
    element: <StaffDashboard />,
  },
  {
    path: '/customer',
    element: <CustomerPage />,
  },
])
