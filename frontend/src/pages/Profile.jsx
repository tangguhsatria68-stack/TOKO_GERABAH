import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../pages/Profile.css';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [navigate, token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal mengambil profil');
      
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <Sidebar />
      <div className="profile-content">
        <h1>👤 Profil Pengguna</h1>

        {loading ? (
          <div className="loading">Memuat profil...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="profile-card">
            <div className="profile-info">
              <div className="info-group">
                <label>Username</label>
                <p>{profile.username}</p>
              </div>

              <div className="info-group">
                <label>Email</label>
                <p>{profile.email}</p>
              </div>

              <div className="info-group">
                <label>Nomor Telepon</label>
                <p>{profile.phone || '-'}</p>
              </div>

              <div className="info-group">
                <label>Alamat</label>
                <p>{profile.address || '-'}</p>
              </div>

              <div className="info-group">
                <label>Role</label>
                <p>
                  <span className={`role-badge role-${profile.role}`}>
                    {profile.role === 'admin' ? 'Administrator' : 'Pengguna Biasa'}
                  </span>
                </p>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn-edit">✏️ Edit Profil</button>
              <button className="btn-logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
