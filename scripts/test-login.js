const http = require('http');

// Login credentials
const LOGIN_DATA = {
  email: 'manager@shop.com',
  password: 'password123'
};

const data = JSON.stringify(LOGIN_DATA);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🔐 Testing login...\n');
console.log('URL: http://localhost:3000/api/auth/login');
console.log('Email:', LOGIN_DATA.email);
console.log('');

const req = http.request(options, (res) => {
  let body = '';
  
  console.log('Status Code:', res.statusCode);
  console.log('');
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
      
      // Check for shop_id
      if (parsed.data && parsed.data.user && parsed.data.user.shop_id) {
        console.log('\n✅ SUCCESS! shop_id is present in response');
        console.log('   Shop ID:', parsed.data.user.shop_id);
        console.log('   Role:', parsed.data.user.role);
      } else {
        console.log('\n❌ WARNING! shop_id is missing in response');
      }
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error:', e.message);
  if (e.code === 'ECONNREFUSED') {
    console.error('   Is the backend running? (npm run dev)');
  }
});

req.write(data);
req.end();
