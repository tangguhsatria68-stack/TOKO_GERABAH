import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import '../pages/AdminDashboard.css';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    material: '',
    size: '',
    color: '',
    price: 0,
    category: '',
    image: '',
    stock: 0,
    discount: 0
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const resp = await fetch('/api/products');
        const data = await resp.json();
        setProducts(data || []);
      } else if (activeTab === 'users') {
        const resp = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        setUsers(data || []);
      }
    } catch (err) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  // Check admin permission
  useEffect(() => {
    if (!token || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    loadData();
  }, [token, user.role, navigate, loadData]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' || name === 'discount' ? parseInt(value) || 0 : value
    }));
  };

  // Add/Update product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Gagal menyimpan produk');

      setSuccess(editingProduct ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan');
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      material: product.material,
      size: product.size,
      color: product.color,
      price: product.price,
      category: product.category,
      image: product.image || '',
      stock: product.stock,
      discount: product.discount || 0
    });
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Yakin hapus produk ini?')) return;

    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Produk berhasil dihapus');
      loadData();
    } catch (err) {
      setError('Gagal hapus produk');
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      material: '',
      size: '',
      color: '',
      price: 0,
      category: '',
      image: '',
      stock: 0,
      discount: 0
    });
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    resetForm();
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="admin-content">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Kelola produk, pesanan, dan pengguna</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === 'products' && (
          <div className="admin-section">
            <div className="section-container">
              <div className="form-section">
                <h2>{editingProduct ? '✏️ Edit Produk' : '➕ Tambah Produk Baru'}</h2>
                <form onSubmit={handleSaveProduct} className="product-form">
                  <div className="form-row">
                    <input
                      type="text"
                      name="name"
                      placeholder="Nama Produk"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    <input
                      type="text"
                      name="category"
                      placeholder="Kategori"
                      value={formData.category}
                      onChange={handleInputChange}
                    />
                  </div>

                  <textarea
                    name="description"
                    placeholder="Deskripsi Produk"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                  />

                  <input
                    type="text"
                    name="image"
                    placeholder="URL Foto Produk (dari Google Images)"
                    value={formData.image}
                    onChange={handleInputChange}
                  />

                  {formData.image && (
                    <div className="image-preview">
                      <img src={formData.image} alt="Preview" onError={(e) => e.target.src = '/placeholder.jpg'} />
                    </div>
                  )}

                  <div className="form-row">
                    <input
                      type="text"
                      name="material"
                      placeholder="Material"
                      value={formData.material}
                      onChange={handleInputChange}
                    />
                    <input
                      type="text"
                      name="size"
                      placeholder="Ukuran"
                      value={formData.size}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="text"
                      name="color"
                      placeholder="Warna"
                      value={formData.color}
                      onChange={handleInputChange}
                    />
                    <input
                      type="number"
                      name="price"
                      placeholder="Harga"
                      value={formData.price}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  <div className="form-row">
                    <input
                      type="number"
                      name="stock"
                      placeholder="Stok"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                    />
                    <input
                      type="number"
                      name="discount"
                      placeholder="Diskon %"
                      value={formData.discount}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="form-buttons">
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? 'Menyimpan...' : editingProduct ? 'Update Produk' : 'Tambah Produk'}
                    </button>
                    {editingProduct && (
                      <button type="button" className="btn-cancel" onClick={resetForm}>
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="list-section">
                <h2>📦 Daftar Produk ({products.length})</h2>
                {loading ? (
                  <div className="loading">Memuat...</div>
                ) : products.length === 0 ? (
                  <div className="empty">Tidak ada produk</div>
                ) : (
                  <div className="products-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Foto</th>
                          <th>ID</th>
                          <th>Nama</th>
                          <th>Harga</th>
                          <th>Stok</th>
                          <th>Diskon</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map(product => (
                          <tr key={product.id}>
                            <td className="img-cell">
                              <img 
                                src={product.image || '/placeholder.jpg'} 
                                alt={product.name}
                                onError={(e) => e.target.src = '/placeholder.jpg'}
                              />
                            </td>
                            <td>#{product.id}</td>
                            <td><strong>{product.name}</strong></td>
                            <td>Rp {product.price.toLocaleString()}</td>
                            <td>{product.stock}</td>
                            <td>{product.discount}%</td>
                            <td>
                              <button
                                className="btn-edit"
                                onClick={() => handleEditProduct(product)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                🗑️ Hapus
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-section">
            <h2>👥 Daftar Pengguna ({users.length})</h2>
            {loading ? (
              <div className="loading">Memuat...</div>
            ) : users.length === 0 ? (
              <div className="empty">Tidak ada pengguna</div>
            ) : (
              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Telepon</th>
                      <th>Role</th>
                      <th>Terdaftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(userItem => (
                      <tr key={userItem.id}>
                        <td>#{userItem.id}</td>
                        <td><strong>{userItem.username}</strong></td>
                        <td>{userItem.email}</td>
                        <td>{userItem.phone || '-'}</td>
                        <td>
                          <span className={`role-badge role-${userItem.role}`}>
                            {userItem.role}
                          </span>
                        </td>
                        <td>{new Date(userItem.created_at).toLocaleDateString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="admin-section">
            <h2>📊 Statistik</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>📦 Total Produk</h3>
                <p className="stat-number">{products.length}</p>
              </div>
              <div className="stat-card">
                <h3>👥 Total Pengguna</h3>
                <p className="stat-number">{users.length}</p>
              </div>
              <div className="stat-card">
                <h3>💰 Harga Rata-rata</h3>
                <p className="stat-number">
                  Rp {products.length > 0 ? Math.round(products.reduce((a, b) => a + b.price, 0) / products.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>📈 Total Stok</h3>
                <p className="stat-number">{products.reduce((a, b) => a + b.stock, 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
