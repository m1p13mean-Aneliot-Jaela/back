const { MongoClient } = require('mongodb');
require('dotenv').config();

async function setupDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/m1p13mean';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();

    // ============================================================================
    // 1. USERS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating users collection...');
    try {
      await db.createCollection('users', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['email', 'password', 'first_name', 'last_name', 'registered_at', 'user_type'],
            properties: {
              email: { bsonType: 'string', description: 'Unique email address' },
              password: { bsonType: 'string', description: 'Hashed password' },
              first_name: { bsonType: 'string' },
              last_name: { bsonType: 'string' },
              phone: { bsonType: 'string' },
              registered_at: { bsonType: 'date' },
              user_type: { enum: ['admin', 'shop', 'buyer'] },
              profile_photo: { bsonType: 'string' },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['active', 'suspended', 'blocked'] },
                  reason: { bsonType: 'string' },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['active', 'suspended', 'blocked'] },
                    reason: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              },
              update_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    email: { bsonType: 'string' },
                    password: { bsonType: 'string' },
                    first_name: { bsonType: 'string' },
                    last_name: { bsonType: 'string' },
                    phone: { bsonType: 'string' },
                    profile_photo: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      await db.collection('users').createIndex({ user_type: 1 });
      await db.collection('users').createIndex({ 'current_status.status': 1 });
      console.log('✓ Users collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Users collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 2. SHOP BOXES COLLECTION
    // ============================================================================
    console.log('\n📦 Creating shop_boxes collection...');
    try {
      await db.createCollection('shop_boxes', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['ref', 'created_at'],
            properties: {
              ref: { bsonType: 'string' },
              created_at: { bsonType: 'date' },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['occupied', 'free', 'under_repair'] },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['occupied', 'free', 'under_repair'] },
                    updated_at: { bsonType: 'date' }
                  }
                }
              },
              current_assignment: {
                bsonType: 'object',
                properties: {
                  shop_id: { bsonType: 'objectId' },
                  shop_name: { bsonType: 'string' },
                  assigned_at: { bsonType: 'date' }
                }
              }
            }
          }
        }
      });
      await db.collection('shop_boxes').createIndex({ ref: 1 }, { unique: true });
      await db.collection('shop_boxes').createIndex({ 'current_status.status': 1 });
      await db.collection('shop_boxes').createIndex({ 'current_assignment.shop_id': 1 });
      console.log('✓ Shop boxes collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Shop boxes collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 3. SHOP CATEGORIES COLLECTION
    // ============================================================================
    console.log('\n📦 Creating shop_categories collection...');
    try {
      await db.createCollection('shop_categories', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name'],
            properties: {
              name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              parent_category_id: { bsonType: ['objectId', 'null'] },
              ancestors: {
                bsonType: 'array',
                items: { bsonType: 'objectId' }
              }
            }
          }
        }
      });
      await db.collection('shop_categories').createIndex({ parent_category_id: 1 });
      await db.collection('shop_categories').createIndex({ ancestors: 1 });
      await db.collection('shop_categories').createIndex({ name: 1 });
      console.log('✓ Shop categories collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Shop categories collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 4. SHOPS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating shops collection...');
    try {
      await db.createCollection('shops', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_name', 'created_at'],
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
                    last_name: { bsonType: 'string' }
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
        }
      });
      await db.collection('shops').createIndex({ 'current_status.status': 1 });
      await db.collection('shops').createIndex({ 'categories.category_id': 1 });
      await db.collection('shops').createIndex({ 'users.user_id': 1 });
      await db.collection('shops').createIndex({ mall_location: 1 });
      console.log('✓ Shops collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Shops collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 5. SHOP REVIEWS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating shop_reviews collection...');
    try {
      await db.createCollection('shop_reviews', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_id', 'buyer_id', 'rating', 'created_at'],
            properties: {
              shop_id: { bsonType: 'objectId' },
              buyer_id: { bsonType: 'objectId' },
              buyer_name: { bsonType: 'string' },
              shop_name: { bsonType: 'string' },
              rating: { bsonType: 'int', minimum: 1, maximum: 5 },
              comment: { bsonType: 'string' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      });
      await db.collection('shop_reviews').createIndex({ shop_id: 1, created_at: -1 });
      await db.collection('shop_reviews').createIndex({ buyer_id: 1 });
      await db.collection('shop_reviews').createIndex({ rating: 1 });
      console.log('✓ Shop reviews collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Shop reviews collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 6. SHOP FAVORITES COLLECTION
    // ============================================================================
    console.log('\n📦 Creating shop_favorites collection...');
    try {
      await db.createCollection('shop_favorites', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['buyer_id', 'shop_id', 'created_at'],
            properties: {
              buyer_id: { bsonType: 'objectId' },
              shop_id: { bsonType: 'objectId' },
              shop_name: { bsonType: 'string' },
              shop_logo: { bsonType: 'string' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      });
      await db.collection('shop_favorites').createIndex({ buyer_id: 1, shop_id: 1 }, { unique: true });
      await db.collection('shop_favorites').createIndex({ shop_id: 1 });
      console.log('✓ Shop favorites collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Shop favorites collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 7. LEASE CONTRACTS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating lease_contracts collection...');
    try {
      await db.createCollection('lease_contracts', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_id', 'start_date', 'end_date', 'rent_amount', 'payment_frequency', 'created_at'],
            properties: {
              shop_id: { bsonType: 'objectId' },
              shop_name: { bsonType: 'string' },
              start_date: { bsonType: 'date' },
              end_date: { bsonType: 'date' },
              rent_amount: { bsonType: 'decimal' },
              payment_frequency: { enum: ['monthly', 'quarterly'] },
              special_conditions: { bsonType: 'string' },
              created_at: { bsonType: 'date' },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['active', 'expired', 'terminated', 'signed'] },
                  reason: { bsonType: 'string' },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['active', 'expired', 'terminated', 'signed'] },
                    reason: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              },
              update_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    start_date: { bsonType: 'date' },
                    end_date: { bsonType: 'date' },
                    rent_amount: { bsonType: 'decimal' },
                    payment_frequency: { enum: ['monthly', 'quarterly'] },
                    special_conditions: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('lease_contracts').createIndex({ shop_id: 1 });
      await db.collection('lease_contracts').createIndex({ 'current_status.status': 1 });
      await db.collection('lease_contracts').createIndex({ end_date: 1 });
      console.log('✓ Lease contracts collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Lease contracts collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 8. RENT PAYMENTS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating rent_payments collection...');
    try {
      await db.createCollection('rent_payments', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['contract_id', 'amount', 'due_date', 'method', 'created_at'],
            properties: {
              contract_id: { bsonType: 'objectId' },
              shop_id: { bsonType: 'objectId' },
              amount: { bsonType: 'decimal' },
              due_date: { bsonType: 'date' },
              method: { enum: ['CARD', 'PAYPAL', 'MOBILE_MONEY', 'BANK', 'CASH'] },
              transaction_reference: { bsonType: 'string' },
              gateway_information: { bsonType: 'object' },
              created_at: { bsonType: 'date' },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'] },
                  reason: { bsonType: 'string' },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'] },
                    reason: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('rent_payments').createIndex({ contract_id: 1, due_date: -1 });
      await db.collection('rent_payments').createIndex({ 'current_status.status': 1 });
      await db.collection('rent_payments').createIndex({ due_date: 1 });
      console.log('✓ Rent payments collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Rent payments collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 9. PRODUCT CATEGORIES COLLECTION
    // ============================================================================
    console.log('\n📦 Creating product_categories collection...');
    try {
      await db.createCollection('product_categories', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['name'],
            properties: {
              name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              parent_category_id: { bsonType: ['objectId', 'null'] },
              ancestors: {
                bsonType: 'array',
                items: { bsonType: 'objectId' }
              }
            }
          }
        }
      });
      await db.collection('product_categories').createIndex({ parent_category_id: 1 });
      await db.collection('product_categories').createIndex({ ancestors: 1 });
      console.log('✓ Product categories collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Product categories collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 10. PRODUCTS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating products collection...');
    try {
      await db.createCollection('products', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_id', 'name', 'unit_price', 'created_at'],
            properties: {
              shop_id: { bsonType: 'objectId' },
              shop_name: { bsonType: 'string' },
              name: { bsonType: 'string' },
              description: { bsonType: 'string' },
              unit_price: { bsonType: 'decimal' },
              cost_price: { bsonType: 'decimal' },
              image_url: { bsonType: 'string' },
              created_at: { bsonType: 'date' },
              images: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    image_url: { bsonType: 'string' },
                    created_at: { bsonType: 'date' }
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
              current_promo: {
                bsonType: 'object',
                properties: {
                  promo_price: { bsonType: 'decimal' },
                  start_date: { bsonType: 'date' },
                  end_date: { bsonType: 'date' },
                  created_at: { bsonType: 'date' }
                }
              },
              promo_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    promo_price: { bsonType: 'decimal' },
                    start_date: { bsonType: 'date' },
                    end_date: { bsonType: 'date' },
                    created_at: { bsonType: 'date' }
                  }
                }
              },
              is_banned: { bsonType: 'bool' },
              ban_info: {
                bsonType: 'object',
                properties: {
                  reason: { bsonType: 'string' },
                  created_at: { bsonType: 'date' }
                }
              },
              reports: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    cause: { bsonType: 'string' },
                    created_at: { bsonType: 'date' }
                  }
                }
              },
              update_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    name: { bsonType: 'string' },
                    description: { bsonType: 'string' },
                    unit_price: { bsonType: 'decimal' },
                    cost_price: { bsonType: 'decimal' },
                    image_url: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('products').createIndex({ shop_id: 1 });
      await db.collection('products').createIndex({ 'categories.category_id': 1 });
      await db.collection('products').createIndex({ name: 'text', description: 'text' });
      await db.collection('products').createIndex({ is_banned: 1 });
      await db.collection('products').createIndex({ 'current_promo.end_date': 1 });
      await db.collection('products').createIndex({ unit_price: 1 });
      console.log('✓ Products collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Products collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 11. PRODUCT FAVORITES COLLECTION
    // ============================================================================
    console.log('\n📦 Creating product_favorites collection...');
    try {
      await db.createCollection('product_favorites', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['buyer_id', 'product_id', 'created_at'],
            properties: {
              buyer_id: { bsonType: 'objectId' },
              product_id: { bsonType: 'objectId' },
              product_name: { bsonType: 'string' },
              product_image: { bsonType: 'string' },
              shop_name: { bsonType: 'string' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      });
      await db.collection('product_favorites').createIndex({ buyer_id: 1, product_id: 1 }, { unique: true });
      await db.collection('product_favorites').createIndex({ product_id: 1 });
      console.log('✓ Product favorites collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Product favorites collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 12. PROMOTIONS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating promotions collection...');
    try {
      await db.createCollection('promotions', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_id', 'title', 'type', 'value', 'start_date', 'end_date', 'created_at'],
            properties: {
              shop_id: { bsonType: 'objectId' },
              shop_name: { bsonType: 'string' },
              title: { bsonType: 'string' },
              description: { bsonType: 'string' },
              type: { enum: ['percentage', 'fixed_amount'] },
              value: { bsonType: 'decimal' },
              promo_code: { bsonType: ['string', 'null'] },
              start_date: { bsonType: 'date' },
              end_date: { bsonType: 'date' },
              conditions: { bsonType: 'string' },
              usage_limit: { bsonType: 'int' },
              usage_count: { bsonType: 'int' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      });
      await db.collection('promotions').createIndex({ promo_code: 1 }, { unique: true, sparse: true });
      await db.collection('promotions').createIndex({ shop_id: 1, end_date: -1 });
      await db.collection('promotions').createIndex({ start_date: 1, end_date: 1 });
      console.log('✓ Promotions collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Promotions collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 13. STOCKS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating stocks collection...');
    try {
      await db.createCollection('stocks', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['shop_id', 'product_id', 'current_quantity', 'updated_at'],
            properties: {
              shop_id: { bsonType: 'objectId' },
              product_id: { bsonType: 'objectId' },
              product_name: { bsonType: 'string' },
              current_quantity: { bsonType: 'int' },
              updated_at: { bsonType: 'date' },
              recent_movements: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    staff_id: { bsonType: 'objectId' },
                    staff_name: { bsonType: 'string' },
                    movement_type: { enum: ['IN', 'OUT', 'ADJUST'] },
                    quantity: { bsonType: 'int' },
                    reason: { bsonType: 'string' },
                    created_at: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('stocks').createIndex({ shop_id: 1, product_id: 1 }, { unique: true });
      await db.collection('stocks').createIndex({ current_quantity: 1 });
      console.log('✓ Stocks collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Stocks collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 14. STOCK MOVEMENTS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating stock_movements collection...');
    try {
      await db.createCollection('stock_movements', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['stock_id', 'shop_id', 'product_id', 'staff_id', 'movement_type', 'quantity', 'created_at'],
            properties: {
              stock_id: { bsonType: 'objectId' },
              shop_id: { bsonType: 'objectId' },
              product_id: { bsonType: 'objectId' },
              staff_id: { bsonType: 'objectId' },
              staff_name: { bsonType: 'string' },
              movement_type: { enum: ['IN', 'OUT', 'ADJUST'] },
              quantity: { bsonType: 'int' },
              reason: { bsonType: 'string' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      });
      await db.collection('stock_movements').createIndex({ stock_id: 1, created_at: -1 });
      await db.collection('stock_movements').createIndex({ shop_id: 1, created_at: -1 });
      console.log('✓ Stock movements collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Stock movements collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 15. ORDERS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating orders collection...');
    try {
      await db.createCollection('orders', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['order_number', 'buyer_id', 'shop_id', 'total_amount', 'final_amount', 'ordered_at'],
            properties: {
              order_number: { bsonType: 'string' },
              buyer_id: { bsonType: 'objectId' },
              buyer_name: { bsonType: 'string' },
              shop_id: { bsonType: 'objectId' },
              shop_name: { bsonType: 'string' },
              staff_id: { bsonType: 'objectId' },
              staff_name: { bsonType: 'string' },
              total_amount: { bsonType: 'decimal' },
              promo_amount: { bsonType: 'decimal' },
              final_amount: { bsonType: 'decimal' },
              ordered_at: { bsonType: 'date' },
              lines: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['product_id', 'quantity', 'unit_price', 'subtotal'],
                  properties: {
                    product_id: { bsonType: 'objectId' },
                    product_name: { bsonType: 'string' },
                    quantity: { bsonType: 'int' },
                    unit_price: { bsonType: 'decimal' },
                    applied_promo_price: { bsonType: 'decimal' },
                    subtotal: { bsonType: 'decimal' }
                  }
                }
              },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['CREATED', 'PAID', 'CANCELLED', 'DELIVERED'] },
                  reason: { bsonType: 'string' },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['CREATED', 'PAID', 'CANCELLED', 'DELIVERED'] },
                    reason: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              },
              payment: {
                bsonType: 'object',
                properties: {
                  amount: { bsonType: 'decimal' },
                  method: { enum: ['CARD', 'PAYPAL', 'MOBILE_MONEY', 'BANK', 'CASH'] },
                  transaction_reference: { bsonType: 'string' },
                  gateway_information: { bsonType: 'object' },
                  created_at: { bsonType: 'date' },
                  current_status: {
                    bsonType: 'object',
                    properties: {
                      status: { enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'] },
                      reason: { bsonType: 'string' },
                      updated_at: { bsonType: 'date' }
                    }
                  },
                  status_history: {
                    bsonType: 'array',
                    items: {
                      bsonType: 'object',
                      properties: {
                        status: { enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'] },
                        reason: { bsonType: 'string' },
                        updated_at: { bsonType: 'date' }
                      }
                    }
                  }
                }
              },
              delivery: {
                bsonType: 'object',
                properties: {
                  delivery_mode: { enum: ['shop_pickup', 'home_delivery'] },
                  delivery_address: { bsonType: 'string' },
                  shipping_date: { bsonType: 'date' },
                  delivery_date: { bsonType: 'date' },
                  delivery_person: { bsonType: 'string' },
                  delivery_person_phone: { bsonType: 'string' },
                  created_at: { bsonType: 'date' },
                  current_status: {
                    bsonType: 'object',
                    properties: {
                      status: { enum: ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] },
                      reason: { bsonType: 'string' },
                      updated_at: { bsonType: 'date' }
                    }
                  },
                  status_history: {
                    bsonType: 'array',
                    items: {
                      bsonType: 'object',
                      properties: {
                        status: { enum: ['PENDING', 'IN_PROGRESS', 'DELIVERED', 'CANCELLED'] },
                        reason: { bsonType: 'string' },
                        updated_at: { bsonType: 'date' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('orders').createIndex({ order_number: 1 }, { unique: true });
      await db.collection('orders').createIndex({ buyer_id: 1, ordered_at: -1 });
      await db.collection('orders').createIndex({ shop_id: 1, ordered_at: -1 });
      await db.collection('orders').createIndex({ 'current_status.status': 1 });
      await db.collection('orders').createIndex({ 'payment.current_status.status': 1 });
      await db.collection('orders').createIndex({ 'delivery.current_status.status': 1 });
      console.log('✓ Orders collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Orders collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 16. EVENTS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating events collection...');
    try {
      await db.createCollection('events', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['title', 'start_date', 'end_date', 'created_at'],
            properties: {
              title: { bsonType: 'string' },
              description: { bsonType: 'string' },
              start_date: { bsonType: 'date' },
              end_date: { bsonType: 'date' },
              location: { bsonType: 'string' },
              created_at: { bsonType: 'date' },
              images: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    image_url: { bsonType: 'string' },
                    created_at: { bsonType: 'date' }
                  }
                }
              },
              current_status: {
                bsonType: 'object',
                properties: {
                  status: { enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'CANCELLED', 'COMPLETED'] },
                  reason: { bsonType: 'string' },
                  updated_at: { bsonType: 'date' }
                }
              },
              status_history: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  properties: {
                    status: { enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'CANCELLED', 'COMPLETED'] },
                    reason: { bsonType: 'string' },
                    updated_at: { bsonType: 'date' }
                  }
                }
              }
            }
          }
        }
      });
      await db.collection('events').createIndex({ start_date: 1, end_date: 1 });
      await db.collection('events').createIndex({ 'current_status.status': 1 });
      console.log('✓ Events collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Events collection already exists');
      } else throw err;
    }

    // ============================================================================
    // 17. NOTIFICATIONS COLLECTION
    // ============================================================================
    console.log('\n📦 Creating notifications collection...');
    try {
      await db.createCollection('notifications', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['recipient_id', 'type', 'title', 'message', 'is_read', 'created_at'],
            properties: {
              recipient_id: { bsonType: 'objectId' },
              type: { enum: ['promotion', 'order', 'event', 'stock_alert', 'rent_alert', 'validation'] },
              title: { bsonType: 'string' },
              message: { bsonType: 'string' },
              link: { bsonType: 'string' },
              is_read: { bsonType: 'bool' },
              created_at: { bsonType: 'date' }
            }
          }
        }
      });
      await db.collection('notifications').createIndex({ recipient_id: 1, is_read: 1, created_at: -1 });
      await db.collection('notifications').createIndex({ type: 1 });
      await db.collection('notifications').createIndex({ created_at: 1 }, { expireAfterSeconds: 7776000 }); // TTL: 90 days
      console.log('✓ Notifications collection created with indexes');
    } catch (err) {
      if (err.code === 48) {
        console.log('⚠ Notifications collection already exists');
      } else throw err;
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Created 17 collections with validators and indexes:');
    console.log('   1. users\n   2. shop_boxes\n   3. shop_categories');
    console.log('   4. shops\n   5. shop_reviews\n   6. shop_favorites\n   7. lease_contracts');
    console.log('   8. rent_payments\n   9. product_categories\n  10. products\n  11. product_favorites');
    console.log('  12. promotions\n  13. stocks\n  14. stock_movements\n  15. orders');
    console.log('  16. events\n  17. notifications');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

setupDatabase();
