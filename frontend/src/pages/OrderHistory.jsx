import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../pages/OrderHistory.css';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [navigate, token]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal mengambil pesanan');
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-history">
      <Sidebar />
      <div className="history-content">
        <h1>📦 Riwayat Pesanan</h1>

        {loading ? (
          <div className="loading">Memuat pesanan...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <p>Anda belum memiliki pesanan</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-number">{order.order_number}</span>
                  <span className={`status status-${order.status.toLowerCase().replace(' ', '-')}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-details">
                  <p><strong>Tanggal:</strong> {new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                  <p><strong>Jumlah Item:</strong> {JSON.parse(order.items).length}</p>
                  <p><strong>Total:</strong> Rp {Math.round(order.total).toLocaleString()}</p>
                </div>
                <div className="order-items">
                  <strong>Produk yang dipesan:</strong>
                  <ul>
                    {JSON.parse(order.items).map((item, idx) => (
                      <li key={idx}>
                        {item.name} x {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
