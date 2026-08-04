import { useState } from 'react'
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
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.username || !formData.password) {
      setMessage('Vui lòng nhập tên đăng nhập và mật khẩu.')
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

      const role = (response.role || 'STAFF').toUpperCase()
      if (role === 'ADMIN') {
        navigate('/admin')
      } else if (role === 'MANAGER') {
        navigate('/manager')
      } else {
        navigate('/staff')
      }

      setMessage(`Đăng nhập thành công. Chào ${response.username}!`)
    } catch (error) {
      setMessage(error.message || 'Đăng nhập thất bại')
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
          <p className={`status ${message.includes('Vui lòng') ? 'error' : 'success'}`}>
            {message}
          </p>
        )}
      </section>
    </main>
  )
}

export default Login
