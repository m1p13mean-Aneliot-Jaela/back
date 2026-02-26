const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mall');
    
    const db = mongoose.connection.db;
    
    console.log('\n=== STOCKS ===');
    const stocks = await db.collection('stocks').find().limit(10).toArray();
    if (stocks.length === 0) {
      console.log('Aucun stock trouvé!');
    } else {
      for (const s of stocks) {
        console.log(`  ${s.product_name || 'Unknown'}: ${s.current_quantity} unités (ID: ${s._id})`);
        if (s.recent_movements && s.recent_movements.length > 0) {
          console.log(`    Dernier mouvement: ${s.recent_movements[s.recent_movements.length-1].reason}`);
        }
      }
    }
    
    console.log('\n=== COMMANDES ===');
    const orders = await db.collection('orders').find().sort({created_at: -1}).limit(5).toArray();
    if (orders.length === 0) {
      console.log('Aucune commande trouvée!');
    } else {
      for (const o of orders) {
        const status = o.current_status?.status || o.status || 'Unknown';
        console.log(`\n  ${o.order_number} | Status: ${status} | Stock decremented: ${o.stock_decremented || false}`);
        if (o.items) {
          for (const item of o.items) {
            console.log(`    - ${item.product_name || item.product_id}: ${item.quantity} unités`);
          }
        }
      }
    }
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

checkDatabase();
