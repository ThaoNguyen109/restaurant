import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { loginUser } from '../../services/authService'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'error' | 'warning' | 'success'
  const [loading, setLoading] = useState(false)

  // Hiển thị thông báo nếu bị redirect về từ trang khác (hết hạn / không quyền)
  useEffect(() => {
    const authMessage = sessionStorage.getItem('authMessage')
    if (authMessage) {
      setMessage(authMessage)
      setMessageType('warning')
      sessionStorage.removeItem('authMessage')
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.username || !formData.password) {
      setMessage('Vui lòng nhập tên đăng nhập và mật khẩu.')
      setMessageType('error')
      return
    }

    try {
      setLoading(true)
      setMessage('')
      const response = await loginUser({
        username: formData.username,
        password: formData.password,
      })

      localStorage.setItem('token', response.token)
      localStorage.setItem('userRole', response.role || 'STAFF')
      localStorage.setItem('username', response.username || formData.username)

      const role = (response.role || 'STAFF').toUpperCase()
      if (role === 'ADMIN') {
        navigate('/admin')
      } else if (role === 'MANAGER') {
        navigate('/manager')
      } else if (role === 'KITCHEN' || role === 'CHEF') {
        navigate('/kitchen')
      } else if (role === 'CASHIER') {
        navigate('/cashier')
      } else if (role === 'WAITER' || role === 'STAFF') {
        navigate('/staff')
      } else {
        navigate('/staff')
      }

      setMessage(`Đăng nhập thành công. Chào ${response.username}!`)
      setMessageType('success')
    } catch (error) {
      setMessage(error.message || 'Đăng nhập thất bại')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand">
          <div className="brand-badge">RM</div>
          <div>
            <p className="eyebrow">Restaurant Management</p>
            <h1>Đăng nhập</h1>
          </div>
        </div>

        <p className="subtitle">Quản lý nhà hàng của bạn một cách dễ dàng.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Tên đăng nhập</span>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="username"
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              inputMode="text"
              autoComplete="current-password"
              maxLength={100}
            />
          </label>

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Ghi nhớ tôi</span>
            </label>
            <a href="#">Quên mật khẩu?</a>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {message && (
          <p className={`status ${messageType}`}>
            {messageType === 'warning' && '⚠️ '}
            {messageType === 'error' && '❌ '}
            {messageType === 'success' && '✅ '}
            {message}
          </p>
        )}
      </section>
    </main>
  )
}

export default Login
