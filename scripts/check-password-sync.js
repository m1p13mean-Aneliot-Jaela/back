const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkPasswords() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    const email = 'test@gmail.com';

    console.log('🔍 Checking passwords for:', email, '\n');

    // Check in employees collection
    const employee = await db.collection('employees').findOne({ email });
    if (employee) {
      console.log('✅ Employee found:');
      console.log('   ID:', employee._id.toString());
      console.log('   Password hash:', employee.password ? employee.password.substring(0, 30) + '...' : 'NOT SET');
      console.log('   Shop ID:', employee.shop_id?.toString());
    } else {
      console.log('❌ Employee not found');
    }

    // Check in users collection
    const user = await db.collection('users').findOne({ email });
    if (user) {
      console.log('\n✅ User found:');
      console.log('   ID:', user._id.toString());
      console.log('   Password hash:', user.password ? user.password.substring(0, 30) + '...' : 'NOT SET');
      console.log('   User type:', user.user_type);
    } else {
      console.log('\n❌ User not found');
    }

    // Check if passwords match
    if (employee && user) {
      if (employee.password === user.password) {
        console.log('\n✅ Passwords are synchronized');
      } else {
        console.log('\n❌ Passwords are DIFFERENT');
        console.log('   Employee password length:', employee.password?.length);
        console.log('   User password length:', user.password?.length);
      }
    }

    // Try to manually sync if different
    if (employee && user && employee.password !== user.password) {
      console.log('\n🔧 Syncing passwords...');
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: employee.password } }
      );
      console.log('✅ Passwords synchronized manually');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkPasswords();
