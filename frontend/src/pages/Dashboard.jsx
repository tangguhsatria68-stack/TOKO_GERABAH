import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Sidebar from '../components/Sidebar';
import '../pages/Dashboard.css';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Gagal mengambil produk');
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    alert('Produk ditambahkan ke keranjang!');
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>🏺 Toko Gerabah</h1>
          <p>Selamat datang, <strong>{user.username}</strong>!</p>
        </div>

        <div className="products-section">
          <h2>Koleksi Gerabah Kami</h2>
          
          {loading ? (
            <div className="loading">Memuat produk...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img 
                      src={product.image || '/placeholder.jpg'} 
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                      loading="lazy"
                    />
                    {product.discount > 0 && (
                      <span className="discount-badge">-{product.discount}%</span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="description">{product.description}</p>
                    <div className="product-specs">
                      <span>📐 {product.size}</span>
                      <span>🎨 {product.color}</span>
                      <span>🏺 {product.material}</span>
                    </div>
                    <div className="product-rating">
                      ⭐ {product.rating} ({product.reviews} ulasan)
                    </div>
                    <div className="product-footer">
                      <div className="price">
                        <span className="price-value">
                          Rp {Math.round(product.price * (1 - (product.discount || 0) / 100)).toLocaleString()}
                        </span>
                        {product.discount > 0 && (
                          <span className="original-price">Rp {product.price.toLocaleString()}</span>
                        )}
                      </div>
                      <button 
                        className="btn-add-cart"
                        onClick={() => handleAddToCart(product)}
                      >
                        Tambah Keranjang
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
