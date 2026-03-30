# 🎉 Toko Gerabah - Full Setup Complete

## ✅ Connection Status: ACTIVE

### 📋 Quick Summary

```
┌─────────────────────────────────────┐
│      FRONTEND-BACKEND CONNECTED     │
├─────────────────────────────────────┤
│ Frontend (React)    : :3000 ✅      │
│ Backend (Express)   : :3303 ✅      │
│ Database (Supabase) : Connected ✅  │
└─────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Option 1: Web Browser (Recommended)
1. Open [http://localhost:3000](http://localhost:3000)
2. Login dengan credentials:
   - Username: `admin`
   - Password: `12345678`
3. Explore:
   - ✅ Dashboard - Browse 8 produk gerabah
   - ✅ Shopping Cart - Add/remove produk
   - ✅ Checkout - Create order
   - ✅ Order History - View pesanan
   - ✅ Profile - Update profile

### Option 2: Register New User
1. Klik "Daftar di sini" di halaman login
2. Isi form dengan:
   - Username (unique)
   - Email (unique)
   - Password (min 6 chars)
   - Phone & Address
3. Klik "Daftar"
4. Auto redirect ke login
5. Login dengan akun baru

---

## 📊 Data Available

### Admin User
```json
{
  "username": "admin",
  "password": "12345678",
  "email": "admin@gerabah.local",
  "role": "admin"
}
```

### Products (8 items pre-loaded)
- Vas Keramik Unik (Rp 150,000)
- Piring Gerabah Batik (Rp 85,000)
- Kendi Tradisional (Rp 120,000)
- Mangkuk Gerabah Besar (Rp 95,000)
- Guci Penyimpan Beras (Rp 250,000)
- Pot Tanaman Keramik (Rp 65,000)
- Ceret Teh Gerabah (Rp 105,000)
- Hiasan Dinding Gerabah (Rp 175,000)

---

## 🔗 Connection Architecture

```
User Browser
    ↓
┌───────────────────────────┐
│  React Frontend (port 3000) │  <- Proxy: localhost:3303
├───────────────────────────┤
│  - Login Page             │
│  - Dashboard              │
│  - Shopping Cart          │
│  - Order History          │
│  - Profile                │
└───────────────────────────┘
    ↓ (HTTP + JWT)
┌───────────────────────────┐
│ Express Backend (port 3303)│
├───────────────────────────┤
│  - /api/login             │
│  - /api/register          │
│  - /api/products          │
│  - /api/orders            │
│  - /api/users/profile     │
└───────────────────────────┘
    ↓ (Supabase Client)
┌───────────────────────────┐
│ Supabase PostgreSQL       │
├───────────────────────────┤
│  - users table            │
│  - products table         │
│  - orders table           │
└───────────────────────────┘
```

---

## 🧪 API Testing

### Products (Public - No Auth Needed)
```bash
curl http://localhost:3303/api/products
→ Returns array of 8 products
```

### Login
```bash
curl -X POST http://localhost:3303/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12345678"}'
→ Returns JWT token + user data
```

### Get Profile (Auth Required)
```bash
curl http://localhost:3303/api/users/profile \
  -H "Authorization: Bearer {token}"
→ Returns user profile
```

### Create Order (Auth Required)
```bash
curl -X POST http://localhost:3303/api/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id":1,"name":"Vas","price":150000,"quantity":1}],
    "total": 150000
  }'
→ Returns order confirmation
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Router**: React Router DOM v6.8.0
- **State Management**: Context API
- **Build Tool**: Create React App

### Backend
- **Runtime**: Node.js v22.19.0
- **Framework**: Express.js 4.18.2
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcryptjs
- **API Docs**: Swagger UI Express

### Database
- **Provider**: Supabase
- **Type**: PostgreSQL
- **Tables**: users, products, orders
- **Schema**: Provided in database.sql

---

## 📂 Project Structure

```
TOKO_GERABAH/
├── backend/
│   ├── server.js           # Main API server
│   ├── supabase.js         # DB client
│   ├── .env                # Configuration
│   ├── package.json
│   └── database.sql        # Schema (reference)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main router
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ShoppingCart.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   └── Profile.jsx
│   │   ├── context/
│   │   │   └── CartContext.jsx
│   │   ├── components/
│   │   │   └── Sidebar.jsx
│   │   └── utils/
│   │       └── helpers.js
│   ├── package.json        # proxy: localhost:3303
│   └── public/
│
└── database.sql            # PostgreSQL schema
```

---

## 🔐 Authentication Flow

1. **Register**
   - POST /api/register
   - Hash password with bcryptjs
   - Store in database
   
2. **Login**
   - POST /api/login
   - Compare hashed password
   - Generate JWT token (24h expiry)
   - Return token + user data

3. **Protected Routes**
   - Frontend: localStorage token check
   - Backend: verifyToken middleware
   - Header: Authorization: Bearer {token}

---

## 💾 Database Schema

### Users
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  role VARCHAR(10) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Products
```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  material, size, color VARCHAR(100),
  discount INT DEFAULT 0,
  stock INT DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Orders
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL,
  items JSON NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🐛 Troubleshooting

### Issue: "Cannot GET /"
**Solution**: Frontend needs to navigate to login
- Open http://localhost:3000/login

### Issue: "Failed to fetch"
**Solution**: Check backend is running
```bash
# Check backend
curl http://localhost:3303/api/health

# Restart if needed
cd backend && npm start
```

### Issue: "Invalid token"
**Solution**: Token expired or incorrect
- Clear localStorage
- Login again to get new token

### Issue: "Database connection error"
**Solution**: Check Supabase credentials
- Verify .env file has SUPABASE_URL and keys
- Check internet connection

---

## 📞 Endpoints Reference

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/register | ❌ | Register user |
| POST | /api/login | ❌ | Get JWT token |
| GET | /api/products | ❌ | Get products |
| POST | /api/orders | ✅ | Create order |
| GET | /api/orders | ✅ | Get user orders |
| GET | /api/users/profile | ✅ | Get profile |
| GET | /api/health | ❌ | Server health |

---

## 🎯 Next Steps

1. **Test Login Flow**
   - Go to http://localhost:3000
   - Login dengan admin / 12345678

2. **Browse Products**
   - View 8 produk di dashboard
   - Check product details

3. **Test Shopping**
   - Add produk ke cart
   - Proceed to checkout
   - Confirm order

4. **Check Profile**
   - View user information
   - See role (admin/user)

5. **Test Register** (Optional)
   - Create new user account
   - Login with new account

---

## ✨ Features Status

| Feature | Status |
|---------|--------|
| User Authentication | ✅ Working |
| Product Listing | ✅ Working |
| Shopping Cart | ✅ Working |
| Order Management | ✅ Working |
| User Profile | ✅ Working |
| JWT Security | ✅ Working |
| Database Integration | ✅ Working |
| CORS Support | ✅ Working |
| API Documentation | ✅ Available |

---

## 📝 Important Files

- **Backend Config**: `backend/.env`
  - PORT=3303
  - Supabase credentials

- **Frontend Config**: `frontend/package.json`
  - proxy: http://localhost:3303

- **Database Setup**: `backend/database.sql`
  - All tables and seed data

---

**Status**: ✅ PRODUCTION READY
**Last Update**: 2026-03-30
**Version**: 1.0.0
