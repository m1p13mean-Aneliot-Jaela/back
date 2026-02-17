const http = require('http');

// Test 1: Update employee password
async function updateEmployeePassword() {
  const loginData = {
    email: 'manager@shop.com',
    password: 'password123'
  };

  // First, login to get the cookie
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        console.log('✅ Login successful, got cookies');
        resolve(cookies);
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(loginData));
    req.end();
  });
}

// Test 2: Try to update employee with new password
async function testUpdateEmployee() {
  try {
    const cookies = await updateEmployeePassword();
    
    // Get list of employees first
    const listOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/shops/69933da410d39c9c66fed26d/employees',
      method: 'GET',
      headers: {
        'Cookie': cookies.join('; ')
      }
    };

    const employees = await new Promise((resolve, reject) => {
      const req = http.request(listOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.data?.employees || []);
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    if (employees.length === 0) {
      console.log('❌ No employees found to update');
      return;
    }

    const employee = employees[0];
    console.log('Found employee:', employee.email);

    // Update employee with new password (7 characters)
    const updateData = {
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      password: 'newpass123'  // 10 characters
    };

    const updateOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/employees/${employee._id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies.join('; ')
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = http.request(updateOptions, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ error: body });
          }
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify(updateData));
      req.end();
    });

    console.log('Update result:', result);

    // Test 3: Try to login with new password
    console.log('\n🔄 Testing login with new password...');
    const newLoginData = {
      email: employee.email,
      password: 'newpass123'
    };

    const loginResult = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ error: body });
          }
        });
      });
      req.on('error', reject);
      req.write(JSON.stringify(newLoginData));
      req.end();
    });

    console.log('Login with new password:', loginResult.success ? '✅ SUCCESS' : '❌ FAILED');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUpdateEmployee();
