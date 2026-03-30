import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Sidebar from '../components/Sidebar';
import '../pages/ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProduct();
  }, [id, navigate]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Produk tidak ditemukan');
      const data = await response.json();
      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    alert(`${quantity} produk ditambahkan ke keranjang!`);
    setQuantity(1);
  };

  const handleQuantityChange = (value) => {
    const num = parseInt(value) || 1;
    if (num > 0 && num <= product.stock) {
      setQuantity(num);
    }
  };

  if (loading) return <div className="product-detail"><Sidebar /><div className="loading">Memuat produk...</div></div>;
  if (error) return <div className="product-detail"><Sidebar /><div className="error">{error}</div></div>;
  if (!product) return <div className="product-detail"><Sidebar /><div className="error">Produk tidak ditemukan</div></div>;

  return (
    <div className="product-detail">
      <Sidebar />
      <div className="detail-content">
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Kembali ke Toko</button>

        <div className="detail-container">
          <div className="detail-image">
            <img 
              src={product.image || '/placeholder.jpg'} 
              alt={product.name}
              onError={(e) => e.target.src = '/placeholder.jpg'}
            />
            {product.discount > 0 && (
              <span className="discount-badge">-{product.discount}%</span>
            )}
          </div>

          <div className="detail-info">
            <h1>{product.name}</h1>

            <div className="product-rating">
              ⭐ {product.rating} ({product.reviews} ulasan)
            </div>

            <div className="product-description">
              <h3>Deskripsi Produk</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-specifications">
              <h3>Spesifikasi</h3>
              <div className="specs-grid">
                <div className="spec-item">
                  <label>Material</label>
                  <p>🏺 {product.material}</p>
                </div>
                <div className="spec-item">
                  <label>Ukuran</label>
                  <p>📐 {product.size}</p>
                </div>
                <div className="spec-item">
                  <label>Warna</label>
                  <p>🎨 {product.color}</p>
                </div>
                <div className="spec-item">
                  <label>Kategori</label>
                  <p>📦 {product.category}</p>
                </div>
              </div>
            </div>

            <div className="product-pricing">
              <div className="price-section">
                <span className="price-label">Harga:</span>
                <div className="price-values">
                  <span className="current-price">
                    Rp {Math.round(product.price * (1 - (product.discount || 0) / 100)).toLocaleString()}
                  </span>
                  {product.discount > 0 && (
                    <span className="original-price">
                      Rp {product.price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="stock-section">
                <span className={`stock-status ${product.stock > 0 ? 'available' : 'unavailable'}`}>
                  {product.stock > 0 ? `Stok: ${product.stock} unit` : 'Stok Habis'}
                </span>
              </div>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label>Jumlah:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  disabled={product.stock === 0}
                />
                <span className="max-quantity">Max: {product.stock}</span>
              </div>

              <button
                className="btn-add-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || quantity > product.stock}
              >
                🛒 Tambah ke Keranjang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
