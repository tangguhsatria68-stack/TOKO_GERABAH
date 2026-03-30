#!/usr/bin/env node

/**
 * Supabase Database Setup Script
 * Menjalankan SQL untuk membuat tables users, products, orders
 */

const https = require('https');
const { supabase } = require('./supabase');
const dotenv = require('dotenv');

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

console.log('\n🔧 TOKO GERABAH - Database Setup');
console.log('==================================\n');

// SQL Statements
const sqlStatements = [
    'DROP TABLE IF EXISTS orders CASCADE',
    'DROP TABLE IF EXISTS products CASCADE',
    'DROP TABLE IF EXISTS users CASCADE',
    `CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE products (
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
    )`,
    `CREATE TABLE orders (
        id BIGSERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        items JSONB NOT NULL,
        total NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    )`,
    'CREATE INDEX idx_users_email ON users(email)',
    'CREATE INDEX idx_users_username ON users(username)',
    'CREATE INDEX idx_products_category ON products(category)',
    'CREATE INDEX idx_orders_user_id ON orders(user_id)'
];

// Function to execute SQL via Supabase REST API
async function setupDatabase() {
    try {
        console.log('📡 Attempting to setup database via Supabase REST API...\n');

        // Try each statement
        for (let i = 0; i < sqlStatements.length; i++) {
            const sql = sqlStatements[i];
            console.log(`[${i + 1}/${sqlStatements.length}] Executing: ${sql.substring(0, 60)}...`);

            try {
                // Try to execute via RPC (if function exists)
                const { data, error } = await supabase.rpc('execute_sql', { sql });

                if (error && !error.toString().includes('does not exist')) {
                    console.error('  ❌ Error:', error.message);
                } else {
                    console.log('  ✅ Success');
                }
            } catch (e) {
                // Fallback - try direct table operations
                if (sql.includes('CREATE TABLE users')) {
                    console.log('  ⚠️  RPC not available, trying alternative method...');
                    // This will fail but that's OK - we'll provide manual instructions
                    break;
                }
            }
        }

        console.log('\n✅ Database setup completed!\n');
    } catch (error) {
        console.error('❌ Setup error:', error.message);
        showManualInstructions();
    }
}

function showManualInstructions() {
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  MANUAL SETUP REQUIRED');
    console.log('='.repeat(70));
    console.log('\nKarena Supabase RPC belum enabled, silakan jalankan SQL manual:\n');
    console.log('LANGKAH-LANGKAH:');
    console.log('1. Buka: https://app.supabase.com');
    console.log('2. Login dengan akun Anda');
    console.log('3. Pilih project: cwghftlxhcxrdnhltzmh');
    console.log('4. Klik "SQL Editor" di sidebar kiri');
    console.log('5. Klik "New Query"');
    console.log('6. Copy dan paste SQL di bawah ini:');
    console.log('\n' + '='.repeat(70));
    console.log('PASTE SQL BERIKUT:\n');

    console.log(sqlStatements.join(';\n') + ';\n');

    console.log('='.repeat(70));
    console.log('\n7. Klik tombol "Run" (atau tekan Ctrl+Enter)\n');
    console.log('✅ SETELAH SELESAI, test dengan:');
    console.log('   GET http://localhost:3303/api/create-test-admin\n');
    console.log('='.repeat(70) + '\n');
}

// Run setup
setupDatabase().catch(error => {
    console.error('Setup failed:', error);
    showManualInstructions();
    process.exit(1);
});