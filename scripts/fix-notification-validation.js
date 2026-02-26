const { MongoClient } = require('mongodb');
require('dotenv').config();

async function removeValidation() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shop';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Remove validation from notifications collection
    await db.command({
      collMod: 'notifications',
      validator: {},
      validationLevel: 'off'
    });
    
    console.log('✅ Validation removed from notifications collection');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

removeValidation();
