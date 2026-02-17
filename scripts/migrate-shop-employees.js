const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateShopsEmployees() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();

    // ============================================================================
    // MIGRATION : Ajouter email, phone, active aux employés existants
    // ============================================================================
    console.log('\n🔄 Migrating shops employees...');

    const result = await db.collection('shops').updateMany(
      { 'users': { $exists: true } },
      {
        $set: {
          'users.$[user].active': true,
          'users.$[user].email': '',
          'users.$[user].phone': ''
        }
      },
      {
        arrayFilters: [{ 'user.user_id': { $exists: true } }]
      }
    );

    console.log(`✓ ${result.modifiedCount} shop(s) migrated`);
    console.log(`✓ ${result.matchedCount} shop(s) matched`);

    // ============================================================================
    // UPDATE SCHEMA VALIDATOR (optionnel - si tu veux valider les nouveaux champs)
    // ============================================================================
    console.log('\n🔄 Updating schema validator...');
    
    try {
      await db.command({
        collMod: 'shops',
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_name', 'brand_id', 'created_at'],
            properties: {
              shop_name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              logo: { bsonType: 'string' },
              mall_location: { bsonType: 'string' },
              opening_time: {
                bsonType: 'object',
                properties: {
                  monday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } },
                  tuesday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } },
                  wednesday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } },
                  thursday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } },
                  friday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } },
                  saturday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } },
                  sunday: { bsonType: 'object', properties: { open: { bsonType: 'string' }, close: { bsonType: 'string' } } }
                }
              },
              created_at: { bsonType: 'date' },
              brand_id: { bsonType: 'objectId' },
              brand_name: { bsonType: 'string' },
              brand_logo: { bsonType: 'string' },
              users: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['user_id', 'role', 'assigned_at'],
                  properties: {
                    user_id: { bsonType: 'objectId' },
                    role: { enum: ['MANAGER_SHOP', 'STAFF'] },
                    assigned_at: { bsonType: 'date' },
                    first_name: { bsonType: 'string' },
                    last_name: { bsonType: 'string' },
                    email: { bsonType: 'string' },        // ← AJOUTÉ
                    phone: { bsonType: 'string' },          // ← AJOUTÉ
                    active: { bsonType: 'bool' }            // ← AJOUTÉ
                  }
                }
              },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['pending', 'validated', 'active', 'deactivated', 'suspended'] },
                  reason: { bsonType: 'string' },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['pending', 'validated', 'active', 'deactivated', 'suspended'] },
                    reason: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              },
              categories: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    category_id: { bsonType: 'objectId' },
                    name: { bsonType: 'string' },
                    assigned_at: { bsonType: 'date' }
                  }
                }
              },
              update_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    shop_name: { bsonType: 'string' },
                    description: { bsonType: 'string' },
                    logo: { bsonType: 'string' },
                    mall_location: { bsonType: 'string' },
                    opening_time: { bsonType: 'object' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              },
              review_stats: {
                bsonType: 'object',
                properties: {
                  average_rating: { bsonType: 'number' },
                  total_reviews: { bsonType: 'number' }
                }
              }
            }
          }
        },
        validationLevel: 'moderate'
      });
      console.log('✓ Schema validator updated');
    } catch (err) {
      console.log('⚠ Schema validator update skipped (may require manual update)');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew fields added to employees:');
    console.log('  - email: string');
    console.log('  - phone: string');
    console.log('  - active: boolean (default: true)');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

migrateShopsEmployees();
