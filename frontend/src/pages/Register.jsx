import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../pages/Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Daftar gagal');
        return;
      }

      setSuccess('Daftar berhasil! Silakan login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError('Error koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>🏺 Toko Gerabah</h1>
        <h2>Daftar Akun</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Pilih username"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Pilih password"
              required
            />
          </div>

          <div className="form-group">
            <label>Konfirmasi Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Konfirmasi password"
              required
            />
          </div>

          <div className="form-group">
            <label>Nomor Telepon</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nomor telepon (opsional)"
            />
          </div>

          <div className="form-group">
            <label>Alamat</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Alamat lengkap (opsional)"
              rows="3"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-register">
            {loading ? 'Sedang Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <div className="register-footer">
          <p>Sudah punya akun? <Link to="/login">Login di sini</Link></p>
        </div>
      </div>
    </div>
  );
}
