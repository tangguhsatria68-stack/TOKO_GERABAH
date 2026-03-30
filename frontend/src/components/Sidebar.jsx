import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import '../components/Sidebar.css';

export default function Sidebar() {
  const { cartItems } = useContext(CartContext);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cartCount = cartItems.length;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>🏺 TOKO GERABAH</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/dashboard" className="nav-item">
          <span>🏠</span> Beranda
        </Link>
        <Link to="/shopping-cart" className="nav-item">
          <span>🛒</span> Keranjang ({cartCount})
        </Link>
        <Link to="/order-history" className="nav-item">
          <span>📦</span> Pesanan
        </Link>
        <Link to="/profile" className="nav-item">
          <span>👤</span> Profil
        </Link>
        {user.role === 'admin' && (
          <Link to="/admin" className="nav-item admin-link">
            <span>⚙️</span> Admin Panel
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="username">{user.username}</p>
          <p className="email">{user.email}</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
