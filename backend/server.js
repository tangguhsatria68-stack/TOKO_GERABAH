const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { supabase, supabaseAdmin } = require('./supabase');
const https = require('https');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Middleware
const verifyToken = (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization ? authorization.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'S3CR3T_K3Y');
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Swagger Documentation
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Toko Gerabah API',
            version: '1.0.0',
            description: 'API untuk Toko Gerabah Online',
            contact: {
                name: 'Support',
                email: 'support@tokogerabah.com'
            }
        },
        servers: [{
            url: `http://localhost:${process.env.PORT || 3303}`,
            description: 'Development Server'
        }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./server.js']
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ===== DATABASE AUTO-INITIALIZATION =====
async function initializeDatabase() {
    try {
        console.log('🔄 Checking database tables...');

        // Try to query users table to check if it exists
        const { data, error } = await supabase.from('users').select('count').limit(1);

        if (!error) {
            console.log('✅ Database tables already exist');
            return true;
        }

        if (!error.message.includes('Could not find')) {
            console.log('⚠️  Database check returned:', error.message);
            return false;
        }

        // Tables don't exist, try to create via Supabase REST API
        console.log('📡 Creating database tables via Supabase API...');

        const createTablesSQL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        `;

        // Use Supabase Admin SDK to run SQL - won't work, so we'll just warn user
        console.log('⚠️  Tables not found. Setup required at: http://localhost:3303/api/setup');
        return false;

    } catch (error) {
        console.error('⚠️  Database initialization check failed:', error.message);
        return false;
    }
}

// Call during startup
initializeDatabase().catch(console.error);

// ===== DATABASE SETUP INSTRUCTION =====
app.get('/api/setup', (req, res) => {
    res.json({
        message: 'TOKO GERABAH - Database Setup Required',
        instruction: 'Run the SQL below in Supabase SQL Editor',
        sql: `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        `
    });
});

// ===== DATABASE INITIALIZATION ENDPOINT =====
app.post('/api/db-init', async(req, res) => {
    try {
        console.log('[DB-INIT] Starting database initialization...');

        // Test tables existence by trying to query them
        const { error: usersError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        const { error: productsError } = await supabase
            .from('products')
            .select('count')
            .limit(1);

        const { error: ordersError } = await supabase
            .from('orders')
            .select('count')
            .limit(1);

        if (!usersError && !productsError && !ordersError) {
            console.log('[DB-INIT] All tables exist!');
            return res.json({ message: 'Database already initialized', status: 'ok' });
        }

        // If tables don't exist, return SQL for manual creation
        const setupSql = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
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
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);`;

        console.log('[DB-INIT] Tables need to be created manually');
        res.status(202).json({
            message: 'Database tables need manual setup',
            status: 'needs_setup',
            instruction: 'Run the SQL below in Supabase SQL Editor',
            url: 'https://app.supabase.com/project/cwghftlxhcxrdnhltzmh/editor/sql',
            sql: setupSql
        });
    } catch (error) {
        console.error('[DB-INIT] Error:', error);
        res.status(500).json({ message: 'Database initialization error', error: error.message });
    }
});

// ===== AUTHENTICATION ENDPOINTS =====

// Reset Admin (clear old admin for fresh creation)
app.get('/api/reset-admin', async(req, res) => {
    try {
        console.log('[RESET-ADMIN] Deleting old admin user...');

        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('username', 'admin');

        if (error) {
            console.error('[RESET-ADMIN] Error:', error);
            return res.status(500).json({ message: 'Error deleting admin', error: error.message });
        }

        res.json({ message: 'Admin berhasil direset', deleted: data });
    } catch (error) {
        console.error('[RESET-ADMIN] Catch error:', error);
        res.status(500).json({ message: 'Error resetting admin', error: error.message });
    }
});

// Create Test Admin (for initial setup)
app.get('/api/create-test-admin', async(req, res) => {
    try {
        console.log('[CREATE-TEST-ADMIN] Creating test admin user...');

        const hashedPassword = await bcrypt.hash('12345678', 10);

        // Insert directly into users table via direct Supabase insert
        const { data, error } = await supabase
            .from('users')
            .insert({
                username: 'admin',
                email: 'admin@gerabah.local',
                password: hashedPassword,
                phone: '08123456789',
                address: 'Jakarta, Indonesia',
                role: 'admin'
            })
            .select();

        if (error) {
            if (error.message.includes('users') && error.message.includes('does not exist')) {
                console.error('[CREATE-TEST-ADMIN] Error: Tables not created yet');
                return res.status(500).json({
                    message: 'Tabel database belum dibuat',
                    action: 'Run SQL di http://localhost:3303/api/setup',
                    manualSetup: 'https://app.supabase.com -> SQL Editor -> paste SQL',
                    error: error.message
                });
            }
            console.error('[CREATE-TEST-ADMIN] Insert error:', error);
            return res.status(400).json({ message: 'Error creating admin', error: error.message });
        }

        console.log('[CREATE-TEST-ADMIN] Admin created successfully!');
        res.json({
            message: 'Test admin berhasil dibuat!',
            credentials: {
                username: 'admin',
                password: '12345678',
                email: 'admin@gerabah.local',
                role: 'admin'
            },
            nextStep: 'Test login dengan credentials di atas'
        });
    } catch (error) {
        console.error('[CREATE-TEST-ADMIN] Error:', error);
        res.status(500).json({ message: 'Error creating test admin', error: error.message });
    }
});

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register user baru
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: User berhasil didaftarkan
 */
app.post('/api/register', async(req, res) => {
    try {
        const { username, email, password, phone, address } = req.body;
        console.log('[REGISTER] Attempting to register:', { username, email });

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, dan password harus diisi' });
        }

        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`);

        if (checkError) {
            console.error('[REGISTER] Error checking existing user:', checkError);
            // Assume table doesn't exist yet, continue
        }

        if (existingUsers && existingUsers.length > 0) {
            console.log('[REGISTER] User already exists:', username);
            return res.status(400).json({ message: 'Username atau Email sudah terdaftar' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user directly to database (id auto-generated by Supabase)
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                username,
                email,
                password: hashedPassword,
                phone: phone || null,
                address: address || null,
                role: 'user'
            })
            .select();

        if (insertError) {
            console.error('[REGISTER] Insert error:', insertError);
            return res.status(400).json({ message: 'Error menyimpan profil user', error: insertError.message });
        }

        console.log('[REGISTER] User registered successfully:', username);
        res.status(201).json({ message: 'User berhasil didaftarkan' });
    } catch (error) {
        console.error('[REGISTER] Catch error:', error);
        res.status(500).json({ message: 'Error registrasi', error: error.message });
    }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login berhasil
 */
app.post('/api/login', async(req, res) => {
    try {
        const { username, password } = req.body;
        console.log('[LOGIN] Attempting login for:', username);

        if (!username || !password) {
            return res.status(400).json({ message: 'Username dan password harus diisi' });
        }

        // Get user by username
        const { data: users, error: queryError } = await supabase
            .from('users')
            .select('id, username, email, password, role')
            .eq('username', username);

        if (queryError) {
            console.error('[LOGIN] Query error:', queryError);
            return res.status(500).json({ message: 'Error mengambil data user', error: queryError.message });
        }

        if (!users || users.length === 0) {
            console.log('[LOGIN] User not found:', username);
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        const user = users[0];
        console.log('[LOGIN] User found:', { id: user.id, email: user.email });

        // Compare password with stored hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log('[LOGIN] Password mismatch for user:', username);
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        console.log('[LOGIN] Password verified for:', username);

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'S3CR3T_K3Y', { expiresIn: '24h' }
        );

        console.log('[LOGIN] Login successful:', username);
        res.json({
            message: 'Login berhasil',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('[LOGIN] Catch error:', error);
        res.status(500).json({ message: 'Error login', error: error.message });
    }
});

// ===== PRODUCTS ENDPOINTS =====

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Dapatkan semua produk gerabah
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Daftar produk gerabah
 */
app.get('/api/products', async(req, res) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*');

        if (error) {
            return res.status(500).json({ message: 'Error mengambil produk', error: error.message });
        }

        res.json(products || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil produk', error: error.message });
    }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tambah produk baru (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               material: { type: string }
 *               size: { type: string }
 *               color: { type: string }
 *               price: { type: number }
 *               category: { type: string }
 *               image: { type: string }
 *               stock: { type: number }
 */
app.post('/api/products', verifyToken, async(req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat menambah produk' });
        }

        const { name, description, material, size, color, price, category, image, stock } = req.body;

        const { data: newProduct, error } = await supabase
            .from('products')
            .insert({
                name,
                description,
                material,
                size,
                color,
                price,
                category,
                image,
                stock,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) {
            return res.status(400).json({ message: 'Error menambah produk', error: error.message });
        }

        res.status(201).json({ message: 'Produk berhasil ditambahkan', product: newProduct && newProduct.length > 0 ? newProduct[0] : null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error menambah produk', error: error.message });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Ambil detail produk berdasarkan ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detail produk
 */
app.get('/api/products/:id', async(req, res) => {
    try {
        const { id } = req.params;

        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !product) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil produk', error: error.message });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update produk (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 */
app.put('/api/products/:id', verifyToken, async(req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat mengupdate produk' });
        }

        const { id } = req.params;
        const { name, description, material, size, color, price, category, image, stock } = req.body;

        const { data: updatedProduct, error } = await supabase
            .from('products')
            .update({
                name,
                description,
                material,
                size,
                color,
                price,
                category,
                image,
                stock,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) {
            return res.status(400).json({ message: 'Error mengupdate produk', error: error.message });
        }

        res.json({ message: 'Produk berhasil diupdate', product: updatedProduct && updatedProduct.length > 0 ? updatedProduct[0] : null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengupdate produk', error: error.message });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Hapus produk (admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 */
app.delete('/api/products/:id', verifyToken, async(req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat menghapus produk' });
        }

        const { id } = req.params;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(400).json({ message: 'Error menghapus produk', error: error.message });
        }

        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error menghapus produk', error: error.message });
    }
});

// ===== ORDERS ENDPOINTS =====

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Buat order baru
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items: { type: array }
 *               total: { type: number }
 */
app.post('/api/orders', verifyToken, async(req, res) => {
    try {
        const { items, total } = req.body;
        const orderNumber = 'ORD-' + Date.now();

        const { data: newOrder, error } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                user_id: req.userId,
                items: JSON.stringify(items),
                total,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select();

        if (error) {
            return res.status(400).json({ message: 'Error membuat order', error: error.message });
        }

        res.status(201).json({
            message: 'Order berhasil dibuat',
            orderNumber,
            order: newOrder && newOrder.length > 0 ? newOrder[0] : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error membuat order', error: error.message });
    }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Dapatkan order user
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 */
app.get('/api/orders', verifyToken, async(req, res) => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', req.userId);

        if (error) {
            return res.status(500).json({ message: 'Error mengambil orders', error: error.message });
        }

        res.json(orders || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil orders', error: error.message });
    }
});

// ===== USER ENDPOINTS =====

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Dapatkan profil user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
app.get('/api/users/profile', verifyToken, async(req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, phone, address, role')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil profil', error: error.message });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Dapatkan semua user (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
app.get('/api/users', verifyToken, async(req, res) => {
    try {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat melihat daftar user' });
        }

        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, phone, address, role');

        if (error) {
            return res.status(500).json({ message: 'Error mengambil users', error: error.message });
        }

        res.json(users || []);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error mengambil users', error: error.message });
    }
});

// Database Setup Endpoint
app.get('/api/db-setup', async(req, res) => {
    try {
        console.log('[DB-SETUP] Starting database initialization...');

        // SQL to create all tables
        const setupSQL = `
        DROP TABLE IF EXISTS orders CASCADE;
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        
        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            phone VARCHAR(20),
            address TEXT,
            role VARCHAR(20) DEFAULT 'customer',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE products (
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

        CREATE TABLE orders (
            id BIGSERIAL PRIMARY KEY,
            order_number VARCHAR(50) UNIQUE NOT NULL,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            items JSONB NOT NULL,
            total NUMERIC(10, 2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_users_username ON users(username);
        CREATE INDEX idx_products_category ON products(category);
        CREATE INDEX idx_orders_user_id ON orders(user_id);
        `;

        // Execute each statement separately
        const statements = setupSQL.split(';').filter(s => s.trim());

        for (const statement of statements) {
            const trimmed = statement.trim();
            if (!trimmed) continue;

            console.log('[DB-SETUP] Executing:', trimmed.substring(0, 50) + '...');
            const { data, error } = await supabase.rpc('execute_sql', { sql: trimmed });

            if (error && !error.message.includes('does not exist')) {
                console.error('[DB-SETUP] Error:', error);
            }
        }

        console.log('[DB-SETUP] Database initialization completed!');
        res.json({
            message: 'Database setup berhasil',
            note: 'Tables users, products, orders sudah dibuat. Silakan register dan login.'
        });
    } catch (error) {
        console.error('[DB-SETUP] Error:', error);
        res.json({
            message: 'Gagal auto-setup via RPC. Jalankan SQL manual di Supabase SQL Editor',
            instruction: 'Buka Supabase Dashboard → SQL Editor → paste SQL dari endpoint /api/setup',
            error: error.message,
            url: 'https://app.supabase.com'
        });
    }
});

// Setup Info Endpoint
app.get('/api/setup', (req, res) => {
    const setupSQL = `-- Run this in Supabase SQL Editor
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
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

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_user_id ON orders(user_id);`;

    res.json({
        message: 'TOKO GERABAH - Database Setup Required',
        instruction: 'Run the SQL below in Supabase SQL Editor',
        sql: setupSQL,
        steps: [
            '1. Go to https://app.supabase.com',
            '2. Select project: cwghftlxhcxrdnhltzmh',
            '3. Go to SQL Editor',
            '4. Paste the SQL above and execute',
            '5. Then test register at POST /api/register'
        ]
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server Toko Gerabah berjalan dengan baik' });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 3303;
app.listen(PORT, () => {
    console.log(`✅ Server Toko Gerabah berjalan di http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});