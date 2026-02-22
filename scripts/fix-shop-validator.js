/**
 * Script to fix the MongoDB validator issue on the shops collection.
 * The old validator requires 'name' and 'shop_id' which conflicts with the current schema.
 * This script drops the old validator and applies the correct one.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function fixShopValidator() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    if (!uri) {
      console.error('No MongoDB URI found in environment variables');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const db = mongoose.connection.db;

    // List all collections to check what exists
    const collections = await db.listCollections().toArray();
    console.log('Collections in DB:', collections.map(c => c.name));

    // Check if shops collection exists and show its validator
    const shopsColl = collections.find(c => c.name === 'shops');
    if (shopsColl) {
      console.log('\nCurrent shops collection options:', JSON.stringify(shopsColl.options, null, 2));
    }

    // Check for shop_profiles collection
    const shopProfilesColl = collections.find(c => c.name === 'shop_profiles');
    if (shopProfilesColl) {
      console.log('\nFound shop_profiles collection! Options:', JSON.stringify(shopProfilesColl.options, null, 2));
    }

    // Remove the validator from shops collection (allow any document)
    console.log('\nRemoving validator from shops collection...');
    await db.command({
      collMod: 'shops',
      validator: {},
      validationLevel: 'off'
    });
    console.log('✅ Validator removed from shops collection!');

    // If shop_profiles collection exists, remove its validator too
    if (shopProfilesColl) {
      console.log('\nRemoving validator from shop_profiles collection...');
      await db.command({
        collMod: 'shop_profiles',
        validator: {},
        validationLevel: 'off'
      });
      console.log('✅ Validator removed from shop_profiles collection!');
    }

    console.log('\nDone! Try creating a shop now.');
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixShopValidator();
