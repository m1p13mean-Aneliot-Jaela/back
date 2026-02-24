/**
 * Script to seed test orders into the database
 * Run: node scripts/seed-orders.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Import models
const Order = require('../src/modules/order/order.model');
const { Delivery } = require('../src/modules/delivery/delivery.model');
const { Shop } = require('../src/modules/shop/shop.model');
const Product = require('../src/modules/product/product.model');

async function seedOrders() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/m1p13mean';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Get all shops
    const shops = await Shop.find({}).lean();
    if (shops.length === 0) {
      console.error('❌ No shops found. Please create shops first.');
      process.exit(1);
    }
    console.log(`\nFound ${shops.length} shop(s)`);

    // Get products for each shop (or create dummy ones)
    let products = await Product.find({}).limit(20).lean();
    
    // If no products, create dummy product data
    if (products.length === 0) {
      console.log('⚠️ No products found, using dummy product data');
      products = [
        { _id: new ObjectId(), name: 'Produit A', price: 15000 },
        { _id: new ObjectId(), name: 'Produit B', price: 25000 },
        { _id: new ObjectId(), name: 'Produit C', price: 10000 },
        { _id: new ObjectId(), name: 'Produit D', price: 35000 },
        { _id: new ObjectId(), name: 'Produit E', price: 5000 },
      ];
    }
    console.log(`Found ${products.length} product(s)`);

    // Sample customers data
    const customers = [
      { name: 'Jean Dupont', email: 'jean@email.com', phone: '0341234567', address: { street: '123 Rue Principale', city: 'Antananarivo', postal_code: '101' } },
      { name: 'Marie Rakoto', email: 'marie@email.com', phone: '0339876543', address: { street: '456 Avenue de l\'Indépendance', city: 'Antananarivo', postal_code: '101' } },
      { name: 'Paul Randria', email: 'paul@email.com', phone: '0321112233', address: { street: '789 Boulevard Ratsimilaho', city: 'Toamasina', postal_code: '501' } },
      { name: 'Sophie Rasoa', email: 'sophie@email.com', phone: '0345556677', address: { street: '321 Rue du Commerce', city: 'Antsirabe', postal_code: '110' } },
      { name: 'Luc Andria', email: 'luc@email.com', phone: '0334445566', address: { street: '654 Avenue des Baobabs', city: 'Mahajanga', postal_code: '401' } },
    ];

    const orderStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELED'];
    const paymentMethods = ['CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER'];
    const deliveryStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    const ordersCreated = [];
    const deliveriesCreated = [];

    console.log('\n📝 Creating orders...\n');

    // Create orders for each shop
    for (const shop of shops) {
      const numOrders = Math.floor(Math.random() * 5) + 3; // 3 to 7 orders per shop
      
      for (let i = 0; i < numOrders; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Create order items (1 to 4 items per order)
        const numItems = Math.floor(Math.random() * 4) + 1;
        const items = [];
        let subtotal = 0;
        
        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 3) + 1;
          const unitPrice = product.price || Math.floor(Math.random() * 50000) + 5000;
          const totalPrice = unitPrice * quantity;
          
          items.push({
            product_id: product._id,
            product_name: product.name || `Produit ${String.fromCharCode(65 + j)}`,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice
          });
          
          subtotal += totalPrice;
        }

        // Calculate totals
        const shippingFee = Math.floor(Math.random() * 3) * 1000 + 2000; // 2000, 3000, or 4000
        const discount = Math.random() > 0.7 ? Math.floor(subtotal * 0.1) : 0; // 30% chance of discount
        const totalAmount = subtotal + shippingFee - discount;

        // Generate order number manually (pre-save hook may not work with validation)
        const date = new Date();
        const prefix = 'ORD';
        const timestamp = date.getFullYear().toString() +
                          String(date.getMonth() + 1).padStart(2, '0') +
                          String(date.getDate()).padStart(2, '0');
        const random = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `${prefix}-${timestamp}-${random}`;

        // Create order
        const orderData = {
          shop_id: shop._id,
          order_number: orderNumber,
          customer: customer,
          items: items,
          subtotal: subtotal,
          shipping_fee: shippingFee,
          discount: discount,
          total_amount: totalAmount,
          status: status,
          status_history: [{
            status: 'PENDING',
            changed_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // 0-7 days ago
          }],
          payment: {
            method: paymentMethod,
            status: Math.random() > 0.2 ? 'PAID' : 'PENDING', // 80% paid
            paid_at: Math.random() > 0.2 ? new Date() : null
          },
          customer_note: Math.random() > 0.7 ? 'Livrer après 14h s\'il vous plaît' : '',
          internal_note: Math.random() > 0.8 ? 'Client fidèle - priorité' : '',
          created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // 0-30 days ago
          updated_at: new Date()
        };

        // Add status history based on current status
        if (status !== 'PENDING') {
          orderData.status_history.push({
            status: status,
            changed_at: new Date(),
            note: 'Statut mis à jour automatiquement'
          });
        }

        const order = new Order(orderData);
        await order.save();
        ordersCreated.push(order);
        console.log(`  ✅ Order ${order.order_number} - ${customer.name} - ${totalAmount.toLocaleString()} Ar - ${status}`);

        // Create delivery for non-canceled orders (80% chance)
        if (status !== 'CANCELED' && Math.random() > 0.2) {
          const deliveryStatus = status === 'DELIVERED' ? 'DELIVERED' : 
                                status === 'SHIPPED' ? deliveryStatuses[Math.floor(Math.random() * 4) + 4] :
                                deliveryStatuses[Math.floor(Math.random() * 4)];

          const trackingNumber = `LIV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

          const deliveryData = {
            shop_id: shop._id,
            order_id: order._id,
            tracking_number: trackingNumber,
            carrier: {
              name: 'Internal',
              external_tracking_id: null,
              api_provider: null
            },
            status: deliveryStatus,
            status_history: [{
              status: 'PENDING',
              timestamp: order.created_at
            }],
            delivery_address: {
              recipient_name: customer.name,
              recipient_phone: customer.phone,
              address_line1: customer.address.street,
              city: customer.address.city,
              postal_code: customer.address.postal_code,
              country: 'MG'
            },
            zone_name: customer.address.city,
            delivery_fee: shippingFee,
            free_delivery_applied: false,
            estimated_delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // +2 days
            instructions: Math.random() > 0.8 ? 'Appeler avant de livrer' : '',
            created_at: order.created_at,
            updated_at: new Date()
          };

          if (deliveryStatus !== 'PENDING') {
            deliveryData.status_history.push({
              status: deliveryStatus,
              timestamp: new Date(),
              note: 'Statut livraison mis à jour'
            });
          }

          if (deliveryStatus === 'DELIVERED') {
            deliveryData.actual_delivery_date = new Date();
            deliveryData.proof_of_delivery = {
              signature_url: null,
              photo_url: null,
              recipient_name: customer.name,
              delivered_at: new Date()
            };
          }

          const delivery = new Delivery(deliveryData);
          await delivery.save();
          deliveriesCreated.push(delivery);
          
          // Update order with delivery reference
          order.delivery = {
            delivery_id: delivery._id,
            tracking_number: trackingNumber,
            estimated_delivery: deliveryData.estimated_delivery_date,
            actual_delivery: deliveryData.actual_delivery_date || null
          };
          await order.save();
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Orders created: ${ordersCreated.length}`);
    console.log(`  ✅ Deliveries created: ${deliveriesCreated.length}`);
    console.log(`\n🎉 Done! Test data seeded successfully.`);

    // Show breakdown by status
    const statusCounts = {};
    for (const order of ordersCreated) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }
    console.log('\n📈 Orders by status:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`   ${status}: ${count}`);
    }

  } catch (error) {
    console.error('\n❌ Error seeding orders:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the script
seedOrders();
