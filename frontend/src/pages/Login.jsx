import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { setAuthToken } from '../utils/helpers';
import '../pages/Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login gagal');
        return;
      }

      setAuthToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      setError('Error koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏺 Toko Gerabah</h1>
        <h2>Masuk</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-login">
            {loading ? 'Sedang Masuk...' : 'Masuk'}
          </button>
        </form>

        <div className="login-footer">
          <p>Belum punya akun? <Link to="/register">Daftar di sini</Link></p>
          <p className="demo-login">Demo: admin / 12345678</p>
        </div>
      </div>
    </div>
  );
}
