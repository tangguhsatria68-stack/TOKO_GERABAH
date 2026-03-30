const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY, {
        db: { schema: 'public' },
        auth: { persistSession: false }
    }
);

const sql = `
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
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
`;

async function setupDatabase() {
    try {
        console.log('🚀 Starting database setup...');

        // Since Supabase JS client doesn't support raw SQL, we'll use rpc or direct query
        // Let's try the RPC approach with a test first

        // Test connection
        const { data: testData, error: testError } = await supabaseAdmin.auth.admin.listUsers();
        if (testError) {
            console.error('❌ Connection failed:', testError.message);
            process.exit(1);
        }

        console.log('✅ Connected to Supabase');
        console.log('💡 Note: Supabase JS client does not support raw SQL.');
        console.log('📋 Please run the following SQL in Supabase Dashboard:');
        console.log('   1. Go to: https://app.supabase.com/project/[your-project]/sql');
        console.log('   2. Paste the SQL below');
        console.log('   3. Click "Run"');
        console.log('\n' + '='.repeat(80));
        console.log(sql);
        console.log('='.repeat(80) + '\n');

        console.log('📚 Or copy the SQL from: http://localhost:3303/api/setup');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

setupDatabase();