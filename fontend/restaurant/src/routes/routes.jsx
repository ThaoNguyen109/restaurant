import { createBrowserRouter } from 'react-router-dom'
import Login from '../pages/auth/Login'
import AdminDashboard from '../pages/admin/AdminDashboard'
import ManagerDashboard from '../pages/manager/ManagerDashboard'
import StaffDashboard from '../pages/staff/StaffDashboard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/manager',
    element: <ManagerDashboard />,
  },
  {
    path: '/staff',
    element: <StaffDashboard />,
  },
])
