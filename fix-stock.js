const mongoose = require('mongoose');

async function fixStock() {
  await mongoose.connect('mongodb://localhost:27017/m1p13mean');
  const db = mongoose.connection.db;

  // Commandes DELIVERED sans stock_decremented
  const ordersToFix = await db.collection('orders').find({
    $or: [
      { 'current_status.status': 'DELIVERED' },
      { status: 'DELIVERED' }
    ],
    stock_decremented: { $ne: true }
  }).toArray();

  console.log('Commandes à corriger:', ordersToFix.length);

  for (const order of ordersToFix) {
    console.log('\nCommande:', order.order_number);

    for (const item of order.items) {
      // Récupérer le stock actuel
      const stock = await db.collection('stocks').findOne({
        product_id: item.product_id
      });

      if (stock) {
        const newQty = Math.max(0, stock.current_quantity - item.quantity);
        console.log('  ' + stock.product_name + ': ' + stock.current_quantity + ' -> ' + newQty + ' (-' + item.quantity + ')');

        // Mettre à jour le stock
        await db.collection('stocks').updateOne(
          { _id: stock._id },
          {
            $set: { current_quantity: newQty, updated_at: new Date() },
            $push: {
              recent_movements: {
                staff_name: 'Système',
                movement_type: 'OUT',
                quantity: item.quantity,
                reason: 'Commande livrée #' + order.order_number,
                created_at: new Date()
              }
            }
          }
        );
      }
    }

    // Marquer la commande comme corrigée
    await db.collection('orders').updateOne(
      { _id: order._id },
      { $set: { stock_decremented: true } }
    );
  }

  console.log('\n✅ Stock corrigé !');

  // Afficher les nouveaux stocks
  console.log('\n=== NOUVEAUX STOCKS ===');
  const stocks = await db.collection('stocks').find().toArray();
  for (const s of stocks) {
    console.log('  ' + (s.product_name || 'Unknown') + ': ' + s.current_quantity + ' unités');
  }

  await mongoose.disconnect();
}

fixStock().catch(console.error);
