const http = require('http');

// Configuration
const SHOP_ID = '69933da410d39c9c66fed26d';
const EMPLOYEE_DATA = {
  first_name: 'Marie',
  last_name: 'Dupont',
  email: 'marie@shop.com',
  password: 'password123',
  role: 'STAFF',
  phone: '+261 34 00 000 00'
};

const data = JSON.stringify(EMPLOYEE_DATA);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/shops/${SHOP_ID}/employees`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🚀 Creating employee...\n');
console.log('URL:', `http://localhost:3000/api/shops/${SHOP_ID}/employees`);
console.log('Data:', EMPLOYEE_DATA);
console.log('');

const req = http.request(options, (res) => {
  let body = '';
  
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  console.log('');
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Response:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
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
