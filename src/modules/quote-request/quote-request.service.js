const QuoteRequest = require('./quote-request.model');
const { NotFoundError, BadRequestError } = require('../../shared/errors/custom-errors');
const notificationService = require('../notification/notification.service');
const Shop = require('../shop/shop.model');

const quoteRequestService = {
  /**
   * Create a new quote request from client
   */
  createRequest: async function(data) {
    const quote = new QuoteRequest({
      client_name: data.client_name,
      client_phone: data.client_phone,
      client_email: data.client_email || '',
      client_address: {
        street: data.client_address?.street || '',
        city: data.client_address?.city || ''
      },
      client_id: data.client_id || null,
      shop_id: data.shop_id,
      shop_name: data.shop_name,
      requested_items: data.requested_items.map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        notes: item.notes || '',
        product_id: item.product_id || null
      }))
    });

    try {
      await quote.save();

      // Notify shop about new quote request
      try {
        const shop = await Shop.findById(data.shop_id);
        if (shop) {
          await notificationService.createNotification({
            recipient_id: shop._id,
            recipient_type: 'SHOP',
            type: 'QUOTE_REQUEST',
            title: 'Nouvelle demande de devis',
            message: `${data.client_name} a demandé un devis pour ${data.requested_items.length} produit(s)`,
            action_url: '/shop/quote-requests',
            icon: 'request_quote',
            color: 'info',
            priority: 'HIGH'
          });
        }
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }

      return quote;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get quote requests by client phone (for registered or guest clients)
   */
  getClientQuotes: async function(phone, clientId = null) {
    const query = clientId 
      ? { $or: [{ client_phone: phone }, { client_id: clientId }] }
      : { client_phone: phone };
    
    return QuoteRequest.find(query)
      .sort({ created_at: -1 })
      .populate('shop_id', 'shop_name logo')
      .populate('converted_order_id', 'order_number status');
  },

  /**
   * Get quote requests for a shop
   */
  getShopQuotes: async function(shopId, filters = {}) {
    const query = { shop_id: shopId };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.search) {
      query.$or = [
        { client_name: { $regex: filters.search, $options: 'i' } },
        { client_phone: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const quotes = await QuoteRequest.find(query)
      .sort({ created_at: -1 })
      .limit(filters.limit || 50);

    const total = await QuoteRequest.countDocuments({ shop_id: shopId });
    const pending = await QuoteRequest.countDocuments({ shop_id: shopId, status: 'PENDING' });
    const reviewing = await QuoteRequest.countDocuments({ shop_id: shopId, status: 'REVIEWING' });
    const quoteSent = await QuoteRequest.countDocuments({ shop_id: shopId, status: 'QUOTE_SENT' });
    const accepted = await QuoteRequest.countDocuments({ shop_id: shopId, status: 'ACCEPTED' });

    return { quotes, stats: { total, pending, reviewing, quoteSent, accepted } };
  },

  /**
   * Get a single quote request by ID
   */
  getQuoteById: async function(id) {
    const quote = await QuoteRequest.findById(id)
      .populate('shop_id', 'shop_name logo mall_location')
      .populate('handled_by', 'first_name last_name')
      .populate('converted_by_staff_id', 'first_name last_name')
      .populate('converted_order_id', 'order_number status current_status');
    
    if (!quote) {
      throw new NotFoundError('Demande de devis non trouvée');
    }
    
    return quote;
  },

  /**
   * Manager responds with a quote
   */
  managerRespond: async function(quoteId, response, managerId, managerName) {
    const quote = await QuoteRequest.findById(quoteId);
    
    if (!quote) {
      throw new NotFoundError('Demande de devis non trouvée');
    }

    if (!['PENDING', 'REVIEWING'].includes(quote.status)) {
      throw new BadRequestError('Cette demande ne peut plus recevoir de devis');
    }

    quote.manager_response = {
      message: response.message,
      calculated_total: response.calculated_total,
      items_confirmed: response.items_confirmed,
      shipping_fee: response.shipping_fee || 0,
      discount_amount: response.discount_amount || 0,
      discount_percent: response.discount_percent || 0,
      promotion_code: response.promotion_code || '',
      final_total: response.calculated_total || 0,
      valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    quote.confirmed_items = response.items_confirmed; // Save for order creation
    quote.status = 'QUOTE_SENT';
    quote.handled_by = managerId;
    quote.handled_by_name = managerName;
    quote.handled_at = new Date();

    await quote.save();

    // Notify client about quote response
    try {
      if (quote.client_id) {
        await notificationService.createNotification({
          recipient_id: quote.client_id,
          recipient_type: 'USER',
          type: 'QUOTE_RESPONSE',
          title: 'Devis reçu !',
          message: `${quote.shop_name} vous a envoyé un devis de ${response.calculated_total.toLocaleString()} Ar`,
          action_url: '/quote-requests',
          icon: 'receipt',
          color: 'success',
          priority: 'HIGH'
        });
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    return quote;
  },

  /**
   * Client accepts or rejects the quote
   */
  clientRespond: async function(quoteId, accepted, message = '') {
    const quote = await QuoteRequest.findById(quoteId);
    
    if (!quote) {
      throw new NotFoundError('Demande de devis non trouvée');
    }

    if (quote.status !== 'QUOTE_SENT') {
      throw new BadRequestError('Aucun devis en attente de réponse');
    }

    if (quote.expires_at && new Date() > quote.expires_at) {
      quote.status = 'EXPIRED';
      await quote.save();
      throw new BadRequestError('Ce devis a expiré');
    }

    quote.client_response = {
      accepted,
      message,
      responded_at: new Date()
    };
    quote.status = accepted ? 'ACCEPTED' : 'REJECTED';

    await quote.save();

    // Notify shop about client response
    try {
      const shop = await Shop.findById(quote.shop_id);
      if (shop) {
        const title = accepted ? 'Devis accepté !' : 'Devis refusé';
        const msg = accepted 
          ? `${quote.client_name} a accepté votre devis de ${quote.manager_response.calculated_total.toLocaleString()} Ar`
          : `${quote.client_name} a refusé votre devis`;
        
        await notificationService.createNotification({
          recipient_id: shop._id,
          recipient_type: 'SHOP',
          type: accepted ? 'QUOTE_ACCEPTED' : 'QUOTE_REJECTED',
          title,
          message: msg,
          action_url: '/shop/quote-requests',
          icon: accepted ? 'check_circle' : 'cancel',
          color: accepted ? 'success' : 'warning',
          priority: accepted ? 'HIGH' : 'NORMAL'
        });
      }
    } catch (notifErr) {
      console.error('Error creating notification:', notifErr);
    }

    return quote;
  },

  /**
   * Start reviewing a quote (manager takes ownership)
   */
  startReview: async function(quoteId, managerId, managerName) {
    const quote = await QuoteRequest.findById(quoteId);
    
    if (!quote) {
      throw new NotFoundError('Demande de devis non trouvée');
    }

    if (quote.status !== 'PENDING') {
      throw new BadRequestError('Cette demande est déjà en cours de traitement');
    }

    quote.status = 'REVIEWING';
    quote.handled_by = managerId;
    quote.handled_by_name = managerName;
    quote.handled_at = new Date();

    await quote.save();
    return quote;
  },

  /**
   * Convert accepted quote to order (manager action) - Creates order automatically
   */
  convertToOrder: async function(quoteId, managerId, assignedStaffId) {
    const quote = await QuoteRequest.findById(quoteId);
    
    if (!quote) {
      throw new NotFoundError('Demande de devis non trouvée');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new BadRequestError('La demande doit être acceptée par le client avant conversion');
    }

    // Import Order model
    const Order = require('../order/order.model');

    // Check if quote has confirmed items (manager must have responded first)
    if (!quote.confirmed_items || quote.confirmed_items.length === 0) {
      throw new BadRequestError('Le devis n\'a pas encore de produits confirmés. Veuillez d\'abord répondre au devis avec les prix.');
    }

    // Create order items from quote confirmed_items
    const orderItems = quote.confirmed_items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total,
      notes: item.notes || ''
    }));

    // Calculate totals with shipping and discounts
    const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    const shippingFee = quote.manager_response?.shipping_fee || 0;
    const discountAmount = quote.manager_response?.discount_amount || 0;
    const discountPercent = quote.manager_response?.discount_percent || 0;
    
    // Calculate discount
    let discount = discountAmount;
    if (discountPercent > 0) {
      discount += (subtotal * discountPercent / 100);
    }
    
    const total_amount = subtotal + shippingFee - discount;

    // Create the order
    const order = new Order({
      shop_id: quote.shop_id,
      user_id: quote.client_id,  // Use user_id for client orders lookup
      customer: {
        name: quote.client_name,
        phone: quote.client_phone,
        email: quote.client_email,
        address: {
          street: quote.client_address?.street,
          city: quote.client_address?.city
        }
      },
      items: orderItems,
      subtotal: subtotal,
      shipping_fee: shippingFee,
      discount: discount,
      total_amount: total_amount,
      status: 'PENDING',
      source: 'QUOTE',
      quote_request_id: quote._id,
      assigned_staff_id: assignedStaffId || null,
      created_by: managerId,
      created_at: new Date()
    });

    await order.save();

    // Update quote with order reference
    quote.converted_order_id = order._id;
    quote.converted_by_staff_id = managerId;
    quote.assigned_staff_id = assignedStaffId || null;
    quote.converted_at = new Date();
    quote.status = 'CONVERTED';

    await quote.save();

    // Notify client about order creation
    try {
      if (quote.client_id) {
        await notificationService.createNotification({
          recipient_id: quote.client_id,
          recipient_type: 'USER',
          user_id: quote.client_id,
          type: 'ORDER_CREATED',
          order_id: order._id,
          shop_id: order.shop_id,
          title: 'Commande créée !',
          message: `Votre demande de devis a été convertie en commande ${order.order_number}`,
          action_url: `/client/orders/${order._id}`,
          icon: 'shopping_bag',
          color: 'success',
          priority: 'HIGH'
        });
      }
    } catch (notifErr) {
      console.error('Error creating client notification:', notifErr);
    }

    // Notify manager who created the order
    try {
      await notificationService.createNotification({
        recipient_id: managerId,
        recipient_type: 'USER',
        user_id: managerId,
        type: 'ORDER_CREATED',
        order_id: order._id,
        shop_id: order.shop_id,
        title: 'Commande créée',
        message: `Vous avez créé la commande ${order.order_number} pour ${quote.client_name}`,
        action_url: `/shop/orders/${order._id}`,
        icon: 'check_circle',
        color: 'success',
        priority: 'MEDIUM'
      });
    } catch (notifErr) {
      console.error('Error creating manager notification:', notifErr);
    }

    // Notify assigned staff about new order
    if (assignedStaffId) {
      try {
        await notificationService.createNotification({
          recipient_id: assignedStaffId,
          recipient_type: 'USER',
          user_id: assignedStaffId,
          type: 'ORDER_ASSIGNED',
          order_id: order._id,
          shop_id: order.shop_id,
          title: 'Nouvelle commande assignée',
          message: `Une nouvelle commande de ${quote.client_name} vous a été assignée`,
          action_url: `/shop/orders/${order._id}`,
          icon: 'assignment_ind',
          color: 'info',
          priority: 'HIGH'
        });
      } catch (notifErr) {
        console.error('Error creating staff notification:', notifErr);
      }
    }

    return { quote, order };
  },

  /**
   * Get stats for shop dashboard
   */
  getStats: async function(shopId) {
    const stats = await QuoteRequest.aggregate([
      { $match: { shop_id: new require('mongoose').Types.ObjectId(shopId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      reviewing: 0,
      quoteSent: 0,
      accepted: 0,
      rejected: 0,
      converted: 0,
      expired: 0
    };

    stats.forEach(stat => {
      result.total += stat.count;
      switch(stat._id) {
        case 'PENDING': result.pending = stat.count; break;
        case 'REVIEWING': result.reviewing = stat.count; break;
        case 'QUOTE_SENT': result.quoteSent = stat.count; break;
        case 'ACCEPTED': result.accepted = stat.count; break;
        case 'REJECTED': result.rejected = stat.count; break;
        case 'CONVERTED': result.converted = stat.count; break;
        case 'EXPIRED': result.expired = stat.count; break;
      }
    });

    return result;
  }
};

module.exports = quoteRequestService;
