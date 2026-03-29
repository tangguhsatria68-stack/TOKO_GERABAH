import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import Sidebar from '../components/Sidebar';
import '../pages/ShoppingCart.css';

export default function ShoppingCart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useContext(CartContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('Keranjang kosong!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems,
          total: getTotalPrice()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Pesanan berhasil dibuat! No. Pesanan: ' + data.orderNumber);
        clearCart();
        navigate('/order-history');
      } else {
        alert('Gagal membuat pesanan: ' + data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="shopping-cart">
      <Sidebar />
      <div className="cart-content">
        <h1>🛒 Keranjang Belanja</h1>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <p>Keranjang Anda kosong</p>
            <button onClick={() => navigate('/dashboard')} className="btn-continue">
              Lanjutkan Belanja
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              <div className="cart-header">
                <span>Produk</span>
                <span>Harga</span>
                <span>Jumlah</span>
                <span>Subtotal</span>
                <span>Aksi</span>
              </div>

              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-name">
                    <strong>{item.name}</strong><br />
                    <small>{item.material} • {item.size}</small>
                  </div>
                  <div className="item-price">
                    Rp {Math.round(item.price * (1 - (item.discount || 0) / 100)).toLocaleString()}
                  </div>
                  <div className="item-quantity">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      min="1"
                    />
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="item-subtotal">
                    Rp {Math.round(item.price * (1 - (item.discount || 0) / 100) * item.quantity).toLocaleString()}
                  </div>
                  <button 
                    className="btn-remove"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>Rp {Math.round(getTotalPrice()).toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Ongkos Kirim:</span>
                <span>Gratis</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>Rp {Math.round(getTotalPrice()).toLocaleString()}</span>
              </div>

              <div className="cart-actions">
                <button 
                  className="btn-clear"
                  onClick={clearCart}
                >
                  Kosongkan Keranjang
                </button>
                <button 
                  className="btn-checkout"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
