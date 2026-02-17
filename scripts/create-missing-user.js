const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function createMissingUser() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const email = 'test@gmail.com';

    console.log('🔧 Creating missing user for:', email, '\n');

    // Get employee data
    const employee = await db.collection('employees').findOne({ email });
    if (!employee) {
      console.log('❌ Employee not found');
      return;
    }

    console.log('✅ Employee found:', employee.first_name, employee.last_name);

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      console.log('✅ User already exists, syncing password...');
      await db.collection('users').updateOne(
        { _id: existingUser._id },
        { $set: { password: employee.password } }
      );
      console.log('✅ Password synced');
      return;
    }

    // Create new user
    const hashedPassword = employee.password; // Already hashed

    const newUser = {
      _id: new ObjectId(),
      email: employee.email,
      password: hashedPassword,
      first_name: employee.first_name,
      last_name: employee.last_name,
      phone: employee.phone,
      user_type: 'shop',
      registered_at: new Date(),
      current_status: {
        status: 'active',
        updated_at: new Date()
      },
      status_history: []
    };

    await db.collection('users').insertOne(newUser);
    console.log('✅ User created successfully!');
    console.log('   ID:', newUser._id.toString());
    console.log('   Email:', newUser.email);
    console.log('   User type:', newUser.user_type);

    console.log('\n🎉 You can now login with:');
    console.log('   Email: test@gmail.com');
    console.log('   Password: newpass123 (or whatever was set)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

createMissingUser();
