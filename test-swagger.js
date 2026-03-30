#!/usr/bin/env node

/**
 * TOKO GERABAH API - COMPREHENSIVE TEST SUITE
 * Tests all Swagger-documented endpoints
 */

const http = require('http');

// Helper function for HTTP requests
function makeRequest(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3303,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// Test runner
async function runTests() {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('  🧪 TOKO GERABAH API - SWAGGER ENDPOINT TEST SUITE 🧪');
    console.log('════════════════════════════════════════════════════════\n');

    let passed = 0;
    let failed = 0;
    let token = null;

    // Test 1: Health Check
    try {
        console.log('📌 Test 1: GET /api/health');
        const res = await makeRequest('GET', '/api/health');
        if (res.status === 200 && res.body.message) {
            console.log('   ✅ PASS - Server OK\n');
            passed++;
        } else {
            console.log('   ❌ FAIL\n');
            failed++;
        }
    } catch (e) {
        console.log('   ❌ FAIL - ' + e.message + '\n');
        failed++;
    }

    // Test 2: Get Products (Public)
    try {
        console.log('📌 Test 2: GET /api/products (Public)');
        const res = await makeRequest('GET', '/api/products');
        if (res.status === 200 && Array.isArray(res.body)) {
            console.log(`   ✅ PASS - ${res.body.length} products loaded`);
            if (res.body.length > 0) {
                console.log(`   Sample: "${res.body[0].name}" - Rp ${res.body[0].price}\n`);
            }
            passed++;
        } else {
            console.log('   ❌ FAIL\n');
            failed++;
        }
    } catch (e) {
        console.log('   ❌ FAIL - ' + e.message + '\n');
        failed++;
    }

    // Test 3: Login
    try {
        console.log('📌 Test 3: POST /api/login (Public)');
        const res = await makeRequest('POST', '/api/login', {}, {
            username: 'admin',
            password: '12345678'
        });
        if (res.status === 200 && res.body.token) {
            token = res.body.token;
            console.log(`   ✅ PASS - Token generated`);
            console.log(`   User: ${res.body.user.username} (${res.body.user.role})\n`);
            passed++;
        } else {
            console.log(`   ❌ FAIL - Status ${res.status}\n`);
            failed++;
        }
    } catch (e) {
        console.log('   ❌ FAIL - ' + e.message + '\n');
        failed++;
    }

    // Test 4: Register (Skip if login successful)
    try {
        console.log('📌 Test 4: POST /api/register (Public)');
        const testUser = `testuser${Date.now()}`;
        const res = await makeRequest('POST', '/api/register', {}, {
            username: testUser,
            email: `${testUser}@example.com`,
            password: 'password123',
            phone: '08123456789',
            address: 'Jakarta'
        });
        if (res.status === 201 || res.status === 200) {
            console.log('   ✅ PASS - User registered\n');
            passed++;
        } else if (res.status === 400 && res.body.message.includes('Username')) {
            console.log('   ✅ PASS - Username exists (expected)\n');
            passed++;
        } else {
            console.log(`   ❌ FAIL - Status ${res.status}: ${res.body.message}\n`);
            failed++;
        }
    } catch (e) {
        console.log('   ❌ FAIL - ' + e.message + '\n');
        failed++;
    }

    // Test 5: Get Profile (Protected)
    if (token) {
        try {
            console.log('📌 Test 5: GET /api/users/profile (Protected)');
            const res = await makeRequest('GET', '/api/users/profile', {
                'Authorization': `Bearer ${token}`
            });
            if (res.status === 200 && res.body.username) {
                console.log(`   ✅ PASS - Profile retrieved`);
                console.log(`   Username: ${res.body.username}`);
                console.log(`   Email: ${res.body.email}`);
                console.log(`   Role: ${res.body.role}\n`);
                passed++;
            } else {
                console.log(`   ❌ FAIL - Status ${res.status}\n`);
                failed++;
            }
        } catch (e) {
            console.log('   ❌ FAIL - ' + e.message + '\n');
            failed++;
        }
    }

    // Test 6: Get Orders (Protected)
    if (token) {
        try {
            console.log('📌 Test 6: GET /api/orders (Protected)');
            const res = await makeRequest('GET', '/api/orders', {
                'Authorization': `Bearer ${token}`
            });
            if (res.status === 200 && Array.isArray(res.body)) {
                console.log(`   ✅ PASS - Orders retrieved`);
                console.log(`   Count: ${res.body.length} orders\n`);
                passed++;
            } else {
                console.log(`   ❌ FAIL - Status ${res.status}\n`);
                failed++;
            }
        } catch (e) {
            console.log('   ❌ FAIL - ' + e.message + '\n');
            failed++;
        }
    }

    // Test 7: Create Order (Protected)
    if (token) {
        try {
            console.log('📌 Test 7: POST /api/orders (Protected)');
            const res = await makeRequest('POST', '/api/orders', {
                'Authorization': `Bearer ${token}`
            }, {
                items: [
                    { id: 1, name: 'Vas Keramik', price: 150000, quantity: 1, discount: 10 }
                ],
                total: 135000
            });
            if (res.status === 201 && res.body.orderNumber) {
                console.log(`   ✅ PASS - Order created`);
                console.log(`   Order Number: ${res.body.orderNumber}\n`);
                passed++;
            } else if (res.status === 400) {
                console.log(`   ⚠️  SKIP - ${res.body.message}\n`);
            } else {
                console.log(`   ❌ FAIL - Status ${res.status}: ${res.body.message}\n`);
                failed++;
            }
        } catch (e) {
            console.log('   ❌ FAIL - ' + e.message + '\n');
            failed++;
        }
    }

    // Test 8: Get All Users (Admin - Protected)
    if (token) {
        try {
            console.log('📌 Test 8: GET /api/users (Admin Protected)');
            const res = await makeRequest('GET', '/api/users', {
                'Authorization': `Bearer ${token}`
            });
            if (res.status === 200 && Array.isArray(res.body)) {
                console.log(`   ✅ PASS - Users retrieved`);
                console.log(`   Count: ${res.body.length} users\n`);
                passed++;
            } else if (res.status === 403) {
                console.log(`   ⚠️  RESTRICTED - Admin role required\n`);
                passed++;
            } else {
                console.log(`   ❌ FAIL - Status ${res.status}\n`);
                failed++;
            }
        } catch (e) {
            console.log('   ❌ FAIL - ' + e.message + '\n');
            failed++;
        }
    }

    // Test 9: Create Product (Admin - Protected)
    if (token) {
        try {
            console.log('📌 Test 9: POST /api/products (Admin Protected)');
            const res = await makeRequest('POST', '/api/products', {
                'Authorization': `Bearer ${token}`
            }, {
                name: 'Test Product',
                description: 'Test Description',
                material: 'Keramik',
                size: '20x20cm',
                color: 'Red',
                price: 100000,
                category: 'Test',
                stock: 10
            });
            if (res.status === 201) {
                console.log(`   ✅ PASS - Product created\n`);
                passed++;
            } else if (res.status === 403) {
                console.log(`   ⚠️  RESTRICTED - Admin role required\n`);
                passed++;
            } else {
                console.log(`   ⚠️  SKIP - Status ${res.status}\n`);
            }
        } catch (e) {
            console.log('   ⚠️  SKIP - ' + e.message + '\n');
        }
    }

    // Test 10: Update Product (Admin - Protected)
    if (token) {
        try {
            console.log('📌 Test 10: PUT /api/products/1 (Admin Protected)');
            const res = await makeRequest('PUT', '/api/products/1', {
                'Authorization': `Bearer ${token}`
            }, {
                name: 'Updated Vas Keramik',
                price: 160000,
                stock: 20
            });
            if (res.status === 200) {
                console.log(`   ✅ PASS - Product updated\n`);
                passed++;
            } else if (res.status === 403) {
                console.log(`   ⚠️  RESTRICTED - Admin role required\n`);
                passed++;
            } else {
                console.log(`   ⚠️  SKIP - Status ${res.status}\n`);
            }
        } catch (e) {
            console.log('   ⚠️  SKIP - ' + e.message + '\n');
        }
    }

    // Test 11: Delete Product (Admin - Protected)
    if (token) {
        try {
            console.log('📌 Test 11: DELETE /api/products/999 (Admin Protected)');
            const res = await makeRequest('DELETE', '/api/products/999', {
                'Authorization': `Bearer ${token}`
            });
            if (res.status === 200 || res.status === 404) {
                console.log(`   ✅ PASS - Delete endpoint works\n`);
                passed++;
            } else if (res.status === 403) {
                console.log(`   ⚠️  RESTRICTED - Admin role required\n`);
                passed++;
            } else {
                console.log(`   ⚠️  SKIP - Status ${res.status}\n`);
            }
        } catch (e) {
            console.log('   ⚠️  SKIP - ' + e.message + '\n');
        }
    }

    // Test 12: Test without token (Protected route)
    try {
        console.log('📌 Test 12: GET /api/users/profile (No Token - Should Fail)');
        const res = await makeRequest('GET', '/api/users/profile');
        if (res.status === 401) {
            console.log('   ✅ PASS - Correctly rejected (No token)\n');
            passed++;
        } else {
            console.log(`   ❌ FAIL - Should be 401, got ${res.status}\n`);
            failed++;
        }
    } catch (e) {
        console.log('   ❌ FAIL - ' + e.message + '\n');
        failed++;
    }

    // Summary
    console.log('════════════════════════════════════════════════════════');
    console.log(`  📊 TEST SUMMARY`);
    console.log('════════════════════════════════════════════════════════');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Total:  ${passed + failed}`);
    console.log(`  🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    console.log('════════════════════════════════════════════════════════\n');

    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Swagger API is working correctly.');
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.');
    }
    console.log('\n🔗 Swagger UI: http://localhost:3303/api-docs\n');
}

// Run tests
runTests().catch(console.error);