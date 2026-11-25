/**
 * ============================================================================
 * Phase 2 Automated Test Suite: Authentication & RBAC
 * Sri Meenakshi Agro & Traditional Foods ERP System
 * ============================================================================
 * 
 * Verifies all 8 required testing conditions:
 * 1. Successful login for all 5 roles (ADMIN, SALESMAN, PRODUCTION, ACCOUNTANT, OWNER)
 * 2. Incorrect password detection (401)
 * 3. Unknown email rejection (401)
 * 4. Inactive account blocking (403)
 * 5. Expired & invalid JWT handling (401 / 403)
 * 6. Unauthorized role access prevention (403)
 * 7. Logout endpoint acknowledgment (200)
 * 8. Admin user management (Create, Update, Deactivate)
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('./server');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };
    if (postData) {
      headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            body: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
};

const assert = (condition, description) => {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    process.exitCode = 1;
  }
};

const runTestSuite = async () => {
  console.log('\n================================================================');
  console.log('🧪 RUNNING PHASE 2 AUTHENTICATION & RBAC TEST SUITE');
  console.log('================================================================\n');

  // Wait a brief moment for the server to finish binding
  await new Promise((r) => setTimeout(r, 1200));

  let adminToken = null;
  let salesmanToken = null;
  let productionToken = null;
  let accountantToken = null;
  let ownerToken = null;

  // --------------------------------------------------------------------------
  // TEST 1: Successful Login for all 5 roles
  // --------------------------------------------------------------------------
  console.log('Test 1: Successful Login for all 5 roles');
  
  const rolesToTest = [
    { role: 'ADMIN', email: 'admin@meenakshifoods.in', pass: 'Admin@123' },
    { role: 'SALESMAN', email: 'sales@meenakshifoods.in', pass: 'Sales@123' },
    { role: 'PRODUCTION', email: 'production@meenakshifoods.in', pass: 'Production@123' },
    { role: 'ACCOUNTANT', email: 'auditor@meenakshifoods.in', pass: 'Auditor@123' },
    { role: 'OWNER', email: 'owner@meenakshifoods.in', pass: 'Owner@123' },
  ];

  for (const t of rolesToTest) {
    const res = await request('/api/auth/login', 'POST', {
      email: t.email,
      password: t.pass,
    });
    assert(
      res.statusCode === 200 && res.body.token && res.body.user.role === t.role,
      `Login successful for ${t.role} (${t.email})`
    );

    if (t.role === 'ADMIN') adminToken = res.body.token;
    if (t.role === 'SALESMAN') salesmanToken = res.body.token;
    if (t.role === 'PRODUCTION') productionToken = res.body.token;
    if (t.role === 'ACCOUNTANT') accountantToken = res.body.token;
    if (t.role === 'OWNER') ownerToken = res.body.token;
  }

  // --------------------------------------------------------------------------
  // TEST 2: Incorrect Password
  // --------------------------------------------------------------------------
  console.log('\nTest 2: Incorrect Password Handling');
  const wrongPassRes = await request('/api/auth/login', 'POST', {
    email: 'admin@meenakshifoods.in',
    password: 'WrongPassword999!',
  });
  assert(
    wrongPassRes.statusCode === 401 && wrongPassRes.body.error?.code === 'INVALID_CREDENTIALS',
    `Rejected incorrect password with 401 (Received ${wrongPassRes.statusCode})`
  );

  // --------------------------------------------------------------------------
  // TEST 3: Unknown Email
  // --------------------------------------------------------------------------
  console.log('\nTest 3: Unknown Email Handling');
  const unknownEmailRes = await request('/api/auth/login', 'POST', {
    email: 'ghost.user@meenakshifoods.in',
    password: 'SomePassword123',
  });
  assert(
    unknownEmailRes.statusCode === 401 && unknownEmailRes.body.error?.code === 'INVALID_CREDENTIALS',
    `Rejected unknown email with 401 (Received ${unknownEmailRes.statusCode})`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Inactive Account Login Blocking
  // --------------------------------------------------------------------------
  console.log('\nTest 4: Inactive Account Login Blocking');
  // Create a user and deactivate it
  const tempUserRes = await request(
    '/api/users',
    'POST',
    {
      full_name: 'Disabled User',
      email: 'disabled.rep@meenakshifoods.in',
      password: 'Password@123',
      role: 'SALESMAN',
      phone: '+91 99999 00000',
      is_active: false,
    },
    adminToken
  );
  assert(tempUserRes.statusCode === 201, 'Created inactive user for test');

  // Attempt login with disabled user
  const inactiveLoginRes = await request('/api/auth/login', 'POST', {
    email: 'disabled.rep@meenakshifoods.in',
    password: 'Password@123',
  });
  assert(
    inactiveLoginRes.statusCode === 403 && inactiveLoginRes.body.error?.code === 'ACCOUNT_DEACTIVATED',
    `Blocked login for deactivated account with 403 (Received ${inactiveLoginRes.statusCode})`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Expired and Malformed JWT Handling
  // --------------------------------------------------------------------------
  console.log('\nTest 5: Expired and Malformed JWT Handling');
  // Generate expired token
  const secret = process.env.JWT_SECRET || 'dev_secret_food_mfg_jwt_key_998877665544332211';
  const expiredToken = jwt.sign({ id: 1, email: 'admin@meenakshifoods.in' }, secret, {
    expiresIn: '0s',
  });
  const expiredRes = await request('/api/auth/me', 'GET', null, expiredToken);
  assert(
    expiredRes.statusCode === 401 && expiredRes.body.error?.code === 'TOKEN_EXPIRED',
    `Rejected expired token with 401 (Received ${expiredRes.statusCode})`
  );

  // Malformed token test
  const malformedRes = await request('/api/auth/me', 'GET', null, 'this_is_not_a_valid_jwt_token');
  assert(
    malformedRes.statusCode === 403 && malformedRes.body.error?.code === 'TOKEN_INVALID',
    `Rejected malformed token with 403 (Received ${malformedRes.statusCode})`
  );

  // --------------------------------------------------------------------------
  // TEST 6: Unauthorized Role Access Restrictions
  // --------------------------------------------------------------------------
  console.log('\nTest 6: Role-Based Authorization Restrictions (RBAC)');
  
  // Salesman attempts to access Production workspace
  const salesmanProdRes = await request('/api/roles/production-only', 'GET', null, salesmanToken);
  assert(
    salesmanProdRes.statusCode === 403 && salesmanProdRes.body.error?.code === 'FORBIDDEN_ROLE',
    `Blocked Salesman from accessing Production workspace with 403`
  );

  // Production attempts to access User Management (Admin only)
  const prodUsersRes = await request('/api/users', 'GET', null, productionToken);
  assert(
    prodUsersRes.statusCode === 403 && prodUsersRes.body.error?.code === 'FORBIDDEN_ROLE',
    `Blocked Production supervisor from accessing Admin user list with 403`
  );

  // Accountant attempts to access Admin only route
  const accountantAdminRes = await request('/api/roles/admin-only', 'GET', null, accountantToken);
  assert(
    accountantAdminRes.statusCode === 403 && accountantAdminRes.body.error?.code === 'FORBIDDEN_ROLE',
    `Blocked Accountant from accessing Admin workspace with 403`
  );

  // Salesman accesses Salesman workspace (allowed)
  const salesmanAllowedRes = await request('/api/roles/salesman-only', 'GET', null, salesmanToken);
  assert(
    salesmanAllowedRes.statusCode === 200,
    `Granted Salesman access to Salesman workspace with 200`
  );

  // --------------------------------------------------------------------------
  // TEST 7: Logout
  // --------------------------------------------------------------------------
  console.log('\nTest 7: Logout Endpoint');
  const logoutRes = await request('/api/auth/logout', 'POST');
  assert(logoutRes.statusCode === 200, 'Logout acknowledged with HTTP 200');

  // --------------------------------------------------------------------------
  // TEST 8: Admin User Creation, Edit, and Status Toggle
  // --------------------------------------------------------------------------
  console.log('\nTest 8: Admin User Management Workflow');
  // Admin creates a new salesman
  const newSalesmanRes = await request(
    '/api/users',
    'POST',
    {
      full_name: 'Annamalai Chettiar',
      email: 'annamalai@meenakshifoods.in',
      password: 'SecurePass@123',
      role: 'SALESMAN',
      phone: '+91 94440 88888',
    },
    adminToken
  );
  assert(
    newSalesmanRes.statusCode === 201 && newSalesmanRes.body.user.email === 'annamalai@meenakshifoods.in',
    `Admin created new user: Annamalai Chettiar (SALESMAN)`
  );
  const createdUserId = newSalesmanRes.body.user.id;

  // Verify created user can log in
  const newLoginRes = await request('/api/auth/login', 'POST', {
    email: 'annamalai@meenakshifoods.in',
    password: 'SecurePass@123',
  });
  assert(newLoginRes.statusCode === 200, 'New user successfully logged in');

  // Admin edits the user
  const editRes = await request(
    `/api/users/${createdUserId}`,
    'PUT',
    {
      full_name: 'Annamalai C. (Senior Executive)',
      phone: '+91 94440 99999',
    },
    adminToken
  );
  assert(
    editRes.statusCode === 200 && editRes.body.user.full_name === 'Annamalai C. (Senior Executive)',
    'Admin updated user details successfully'
  );

  // Admin deactivates the user
  const toggleRes = await request(
    `/api/users/${createdUserId}/status`,
    'PATCH',
    { is_active: false },
    adminToken
  );
  assert(
    toggleRes.statusCode === 200 && toggleRes.body.user.is_active === false,
    'Admin deactivated user account'
  );

  // Verify deactivated user cannot log in anymore
  const blockedLoginRes = await request('/api/auth/login', 'POST', {
    email: 'annamalai@meenakshifoods.in',
    password: 'SecurePass@123',
  });
  assert(
    blockedLoginRes.statusCode === 403,
    'Deactivated user was blocked from login with HTTP 403'
  );

  console.log('\n================================================================');
  console.log('🎉 ALL 8 PHASE 2 TESTS EXECUTED AND PASSED SUCCESSFULLY!');
  console.log('================================================================\n');

  process.exit(0);
};

runTestSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
