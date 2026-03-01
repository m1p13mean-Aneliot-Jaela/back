const mongoose = require('mongoose');
const config = require('../src/config/env');

async function fixOrderValidator() {
  try {
    // Connect to MongoDB
    const uri = config.mongodb.uri;
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Drop the old validator and set to 'off' or update to match Mongoose schema
    console.log('🔧 Updating orders collection validator...');
    
    await db.command({
      collMod: 'orders',
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['shop_id', 'subtotal', 'total_amount'],
          properties: {
            user_id: { bsonType: 'objectId' },
            shop_id: { bsonType: 'objectId' },
            order_number: { bsonType: 'string' },
            customer: {
              bsonType: 'object',
              required: ['name', 'phone'],
              properties: {
                name: { bsonType: 'string' },
                email: { bsonType: 'string' },
                phone: { bsonType: 'string' },
                address: {
                  bsonType: 'object',
                  properties: {
                    street: { bsonType: 'string' },
                    city: { bsonType: 'string' },
                    postal_code: { bsonType: 'string' }
                  }
                }
              }
            },
            items: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['product_id', 'product_name', 'quantity', 'unit_price', 'total_price'],
                properties: {
                  product_id: { bsonType: 'objectId' },
                  product_name: { bsonType: 'string' },
                  quantity: { bsonType: ['int', 'double'] },
                  unit_price: { bsonType: ['int', 'double', 'decimal'] },
                  total_price: { bsonType: ['int', 'double', 'decimal'] }
                }
              }
            },
            subtotal: { bsonType: ['int', 'double', 'decimal'] },
            shipping_fee: { bsonType: ['int', 'double', 'decimal'] },
            discount: { bsonType: ['int', 'double', 'decimal'] },
            total_amount: { bsonType: ['int', 'double', 'decimal'] },
            status: { 
              enum: ['PENDING', 'CONFIRMED', 'PAYMENT_REQUESTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'] 
            },
            status_history: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                properties: {
                  status: { 
                    enum: ['PENDING', 'CONFIRMED', 'PAYMENT_REQUESTED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'] 
                  },
                  changed_at: { bsonType: 'date' },
                  changed_by: { bsonType: 'objectId' },
                  note: { bsonType: 'string' }
                }
              }
            },
            delivery: {
              bsonType: 'object',
              properties: {
                delivery_id: { bsonType: 'objectId' },
                tracking_number: { bsonType: 'string' },
                estimated_delivery: { bsonType: 'date' },
                actual_delivery: { bsonType: 'date' }
              }
            },
            payment: {
              bsonType: 'object',
              properties: {
                method: { enum: ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'] },
                status: { enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'] },
                paid_at: { bsonType: 'date' }
              }
            },
            stock_decremented: { bsonType: 'bool' },
            customer_note: { bsonType: 'string' },
            internal_note: { bsonType: 'string' },
            created_at: { bsonType: 'date' },
            updated_at: { bsonType: 'date' }
          }
        }
      },
      validationLevel: 'moderate',
      validationAction: 'error'
    });

    console.log('✅ Orders collection validator updated successfully');
    console.log('📝 New validator matches the Mongoose Order model');
    
  } catch (error) {
    console.error('❌ Error fixing order validator:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixOrderValidator();
