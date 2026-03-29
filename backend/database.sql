-- Database untuk Toko Gerabah
CREATE DATABASE IF NOT EXISTS toko_gerabah;
USE toko_gerabah;

-- Tabel Users
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  profilePhoto LONGTEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Products (Gerabah)
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  material VARCHAR(100),
  size VARCHAR(100),
  color VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  image VARCHAR(500),
  rating DECIMAL(3,1) DEFAULT 0,
  reviews INT DEFAULT 0,
  discount INT DEFAULT 0,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel Orders
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  items JSON NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Dalam Pengiriman',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Data Default User Admin
INSERT INTO users (username, email, password, phone, address, role) VALUES
('admin', 'admin@tokogerabah.com', '$2b$10$YourHashedPasswordHere', '08123456789', 'Jl. Gerabah No. 1, Yogyakarta', 'admin');

-- Data Sample Gerabah
INSERT INTO products (name, description, material, size, color, price, category, rating, reviews, stock, discount) VALUES
('Vas Keramik Unik', 'Vas keramik buatan tangan dengan desain tradisional', 'Keramik', '30x25 cm', 'Merah Maroon', 150000, 'Dekorasi', 4.5, 12, 15, 10),
('Piring Gerabah Batik', 'Piring gerabah dengan motif batik tradisional Jawa', 'Gerabah Tanah Liat', '25 cm diameter', 'Coklat Natural', 85000, 'Peralatan Makan', 4.2, 8, 20, 0),
('Kendi Tradisional', 'Kendi untuk menyimpan air dengan desain klasik', 'Tanah Liat', '35x20 cm', 'Merah', 120000, 'Dekorasi', 4.8, 18, 10, 15),
('Mangkuk Gerabah Besar', 'Mangkuk gerabah dengan kapasitas besar', 'Gerabah', '30 cm diameter', 'Biru Celadon', 95000, 'Peralatan Makan', 4.3, 10, 25, 5),
('Guci Penyimpan Beras', 'Guci gerabah tradisional untuk penyimpan beras', 'Tanah Liat', '50 cm tinggi', 'Coklat', 250000, 'Penyimpanan', 4.6, 14, 8, 20),
('Pot Tanaman Keramik', 'Pot bunga keramik dengan lubang drainase', 'Keramik', '20x20 cm', 'Kuning Mustard', 65000, 'Dekorasi', 4.1, 6, 30, 0),
('Ceret Teh Gerabah', 'Ceret teh tradisional dari gerabah berkualitas', 'Gerabah', '15 cm tinggi', 'Hitam', 105000, 'Peralatan Minum', 4.4, 11, 16, 10),
('Hiasan Dinding Gerabah', 'Hiasan dinding berbentuk motif abstrak', 'Gerabah', '40x30 cm', 'Beige', 175000, 'Dekorasi', 4.7, 16, 12, 15);
