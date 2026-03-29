-- Supabase Schema untuk Toko Gerabah
-- Setup tables yang diperlukan

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  material VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  image TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes untuk performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- RLS Policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can read own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Users can read all products
CREATE POLICY "Anyone can read products" 
  ON products FOR SELECT 
  USING (true);

-- Only admins can insert/update/delete products
CREATE POLICY "Only admins can manage products" 
  ON products FOR ALL 
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Users can read/insert their own orders
CREATE POLICY "Users can read own orders" 
  ON orders FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders" 
  ON orders FOR INSERT 
  WITH CHECK (user_id = auth.uid());
