import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/AdminSidebar.css';

export default function AdminSidebar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>⚙️ Admin Panel</h2>
        <p>{user.username}</p>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => onTabChange('products')}
        >
          📦 Produk
        </button>
        <button
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => onTabChange('users')}
        >
          👥 Pengguna
        </button>
        <button
          className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => onTabChange('stats')}
        >
          📊 Statistik
        </button>
      </nav>

      <div className="sidebar-actions">
        <button
          className="btn-back"
          onClick={() => navigate('/dashboard')}
        >
          🏠 Kembali ke Toko
        </button>
        <button
          className="btn-logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
