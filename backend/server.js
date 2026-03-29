const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { supabase, supabaseAdmin } = require('./supabase');

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
            description: 'API untuk Toko Gerabah Online'
        },
        servers: [{
            url: `http://localhost:${process.env.PORT || 7777}`,
            description: 'Development Server'
        }]
    },
    apis: ['./server.js']
};

const swaggerSpecs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// ===== AUTHENTICATION ENDPOINTS =====

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
        }

        if (existingUsers && existingUsers.length > 0) {
            console.log('[REGISTER] User already exists:', username);
            return res.status(400).json({ message: 'Username atau Email sudah terdaftar' });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            console.error('[REGISTER] Auth creation error:', authError);
            return res.status(400).json({ message: 'Error registrasi', error: authError.message });
        }

        console.log('[REGISTER] Auth user created:', authData.user.id);

        // Insert user profile to database
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                username,
                email,
                phone: phone || null,
                address: address || null,
                role: 'customer',
                created_at: new Date().toISOString()
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
            .select('id, username, email, role')
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

        // Sign in using Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password
        });

        if (authError) {
            console.error('[LOGIN] Auth error:', authError);
            return res.status(401).json({ message: 'Username atau password salah' });
        }

        console.log('[LOGIN] Auth successful for:', username);

        // Generate JWT token for backend use
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
const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
    console.log(`✅ Server Toko Gerabah berjalan di http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});