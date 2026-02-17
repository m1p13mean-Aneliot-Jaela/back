const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createFirstEmployee() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    // Configuration
    const SHOP_NAME = 'Ma Boutique Test';
    const EMPLOYEE_EMAIL = 'manager@shop.com';
    const EMPLOYEE_PASSWORD = 'password123';
    const FIRST_NAME = 'Jean';
    const LAST_NAME = 'Manager';
    const PHONE = '+261 34 00 000 00';

    console.log('🔧 Creating first employee...\n');

    // 1. Create or find shop
    let shop = await db.collection('shops').findOne({ shop_name: SHOP_NAME });
    let shopId;

    if (!shop) {
      shopId = new ObjectId();
      await db.collection('shops').insertOne({
        _id: shopId,
        shop_name: SHOP_NAME,
        description: 'Boutique de test',
        brand_id: new ObjectId(),
        created_at: new Date(),
        users: [],
        current_status: {
          status: 'active',
          updated_at: new Date()
        }
      });
      console.log('✅ Shop created:', shopId.toString());
    } else {
      shopId = shop._id;
      console.log('✅ Shop found:', shopId.toString());
    }

    // 2. Check if user exists
    const existingUser = await db.collection('users').findOne({ email: EMPLOYEE_EMAIL });
    if (existingUser) {
      console.log('⚠️  User already exists:', EMPLOYEE_EMAIL);
      console.log('   Shop ID:', shopId.toString());
      return;
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(EMPLOYEE_PASSWORD, 10);

    // 4. Create user
    const userId = new ObjectId();
    await db.collection('users').insertOne({
      _id: userId,
      email: EMPLOYEE_EMAIL,
      password: hashedPassword,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      phone: PHONE,
      user_type: 'shop',
      registered_at: new Date(),
      current_status: {
        status: 'active',
        updated_at: new Date()
      },
      status_history: []
    });
    console.log('✅ User created:', userId.toString());

    // 5. Create employee
    const employeeId = new ObjectId();
    await db.collection('employees').insertOne({
      _id: employeeId,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      email: EMPLOYEE_EMAIL,
      password: hashedPassword,
      phone: PHONE,
      shop_id: shopId,
      shop_name: SHOP_NAME,
      role: 'MANAGER_SHOP',
      active: true,
      joined_at: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Employee created:', employeeId.toString());

    console.log('\n🎉 First employee created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('   Email:', EMPLOYEE_EMAIL);
    console.log('   Password:', EMPLOYEE_PASSWORD);
    console.log('   Shop ID:', shopId.toString());
    console.log('\n🔑 Role: MANAGER_SHOP (full access)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createFirstEmployee();
