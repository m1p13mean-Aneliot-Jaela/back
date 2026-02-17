const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkEmployee() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log('🔍 Searching for employee: marie@shop.com\n');

    const employee = await db.collection('employees').findOne({ email: 'marie@shop.com' });

    if (employee) {
      console.log('✅ Employee found:\n');
      console.log(JSON.stringify(employee, null, 2));
    } else {
      console.log('❌ Employee not found');
    }

    // Also check total employees in shop
    const count = await db.collection('employees').countDocuments({ 
      shop_id: new require('mongodb').ObjectId('69933da410d39c9c66fed26d') 
    });
    console.log(`\n📊 Total employees in shop: ${count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkEmployee();
