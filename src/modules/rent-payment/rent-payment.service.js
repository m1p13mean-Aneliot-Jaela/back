const { RentPayment } = require('./rent-payment.model');
const { LeaseContract } = require('../lease-contract/lease-contract.model');
const { Shop } = require('../shop/shop.model');
const { NotFoundError, ValidationError } = require('../../shared/errors/custom-errors');
const mongoose = require('mongoose');

class RentPaymentService {
  /**
   * Get all rent payments with optional filters
   */
  async getAllRentPayments(filters = {}) {
    const query = {};
    
    // Build query from filters
    if (filters.status) {
      query['current_status.status'] = filters.status;
    }
    if (filters.contract_id) {
      query.contract_id = filters.contract_id;
    }
    if (filters.shop_id) {
      query.shop_id = filters.shop_id;
    }
    if (filters.method) {
      query.method = filters.method;
    }
    
    // Date range filters
    if (filters.due_date_from) {
      query.due_date = { ...query.due_date, $gte: new Date(filters.due_date_from) };
    }
    if (filters.due_date_to) {
      query.due_date = { ...query.due_date, $lte: new Date(filters.due_date_to) };
    }
    
    const payments = await RentPayment.find(query)
      .populate('contract_id', 'shop_name start_date end_date rent_amount payment_frequency current_status')
      .populate('shop_id', 'shop_name mall_location')
      .sort({ due_date: -1 })
      .lean();
    
    // Convert Decimal128 to numbers
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0
    }));
  }

  /**
   * Get rent payment by ID
   */
  async getRentPaymentById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid payment ID');
    }

    const payment = await RentPayment.findById(id)
      .populate('contract_id', 'shop_name start_date end_date rent_amount payment_frequency current_status')
      .populate('shop_id', 'shop_name mall_location logo');
    
    if (!payment) {
      throw new NotFoundError('Rent payment not found');
    }
    
    return payment;
  }

  /**
   * Get rent payments by contract ID
   */
  async getRentPaymentsByContract(contractId) {
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      throw new ValidationError('Invalid contract ID');
    }

    const payments = await RentPayment.find({ contract_id: contractId })
      .populate('shop_id', 'shop_name')
      .sort({ due_date: -1 })
      .lean();
    
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0
    }));
  }

  /**
   * Get rent payments by shop ID
   */
  async getRentPaymentsByShop(shopId) {
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      throw new ValidationError('Invalid shop ID');
    }

    const payments = await RentPayment.find({ shop_id: shopId })
      .populate('contract_id', 'start_date end_date rent_amount payment_frequency')
      .sort({ due_date: -1 })
      .lean();
    
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0
    }));
  }

  /**
   * Create new rent payment
   */
  async createRentPayment(data) {
    // Validate contract exists
    const contract = await LeaseContract.findById(data.contract_id);
    if (!contract) {
      throw new NotFoundError('Lease contract not found');
    }

    // Validate shop if provided
    if (data.shop_id) {
      const shop = await Shop.findById(data.shop_id);
      if (!shop) {
        throw new NotFoundError('Shop not found');
      }
    } else {
      // Use shop_id from contract
      data.shop_id = contract.shop_id;
    }

    // Validate due date
    if (new Date(data.due_date) < new Date()) {
      throw new ValidationError('Due date cannot be in the past');
    }

    // Prepare payment data
    const paymentData = {
      contract_id: data.contract_id,
      shop_id: data.shop_id,
      amount: data.amount,
      due_date: new Date(data.due_date),
      method: data.method,
      transaction_reference: data.transaction_reference,
      gateway_information: data.gateway_information,
      current_status: {
        status: data.status || 'PENDING',
        reason: data.reason,
        updated_at: new Date()
      },
      status_history: [{
        status: data.status || 'PENDING',
        reason: data.reason || 'Payment created',
        updated_at: new Date()
      }],
      created_at: new Date()
    };

    const payment = new RentPayment(paymentData);
    await payment.save();

    return await this.getRentPaymentById(payment._id);
  }

  /**
   * Update rent payment
   */
  async updateRentPayment(id, data) {
    const payment = await this.getRentPaymentById(id);

    // Update basic fields
    if (data.amount !== undefined) payment.amount = data.amount;
    if (data.due_date !== undefined) payment.due_date = new Date(data.due_date);
    if (data.method !== undefined) payment.method = data.method;
    if (data.transaction_reference !== undefined) payment.transaction_reference = data.transaction_reference;
    if (data.gateway_information !== undefined) payment.gateway_information = data.gateway_information;

    await payment.save();

    return await this.getRentPaymentById(id);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id, status, reason) {
    const payment = await this.getRentPaymentById(id);

    // Validate status transition
    const validStatuses = ['PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid payment status');
    }

    // Update current status
    payment.current_status = {
      status,
      reason,
      updated_at: new Date()
    };

    // Add to status history
    payment.status_history.push({
      status,
      reason,
      updated_at: new Date()
    });

    await payment.save();

    return await this.getRentPaymentById(id);
  }

  /**
   * Delete rent payment
   */
  async deleteRentPayment(id) {
    const payment = await this.getRentPaymentById(id);
    
    // Only allow deletion of pending payments
    if (payment.current_status.status !== 'PENDING') {
      throw new ValidationError('Only pending payments can be deleted');
    }

    await RentPayment.findByIdAndDelete(id);
    
    return { message: 'Rent payment deleted successfully' };
  }

  /**
   * Get pending payments
   */
  async getPendingPayments() {
    const payments = await RentPayment.find({ 'current_status.status': 'PENDING' })
      .populate('contract_id', 'shop_name')
      .populate('shop_id', 'shop_name')
      .sort({ due_date: 1 })
      .lean();
    
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0
    }));
  }

  /**
   * Get overdue payments
   */
  async getOverduePayments() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const payments = await RentPayment.find({
      'current_status.status': 'PENDING',
      due_date: { $lt: today }
    })
      .populate('contract_id', 'shop_name')
      .populate('shop_id', 'shop_name mall_location')
      .sort({ due_date: 1 })
      .lean();
    
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0
    }));
  }

  /**
   * Get upcoming payments (within specified days)
   */
  async getUpcomingPayments(days = 30) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);

    const payments = await RentPayment.find({
      'current_status.status': 'PENDING',
      due_date: { $gte: today, $lte: futureDate }
    })
      .populate('contract_id', 'shop_name')
      .populate('shop_id', 'shop_name mall_location')
      .sort({ due_date: 1 })
      .lean();
    
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0
    }));
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(filters = {}) {
    const query = {};
    
    if (filters.shop_id) {
      query.shop_id = filters.shop_id;
    }
    if (filters.contract_id) {
      query.contract_id = filters.contract_id;
    }
    
    const [total, pending, successful, failed, refunded, overdue] = await Promise.all([
      RentPayment.countDocuments(query),
      RentPayment.countDocuments({ ...query, 'current_status.status': 'PENDING' }),
      RentPayment.countDocuments({ ...query, 'current_status.status': 'SUCCESSFUL' }),
      RentPayment.countDocuments({ ...query, 'current_status.status': 'FAILED' }),
      RentPayment.countDocuments({ ...query, 'current_status.status': 'REFUNDED' }),
      RentPayment.countDocuments({ 
        ...query, 
        'current_status.status': 'PENDING',
        due_date: { $lt: new Date() }
      })
    ]);

    // Get total amounts
    const amounts = await RentPayment.aggregate([
      { $match: query },
      { $group: { 
          _id: '$current_status.status', 
          total: { $sum: { $toDouble: '$amount' } }
        }
      }
    ]);

    const amountByStatus = amounts.reduce((acc, item) => {
      acc[item._id] = item.total;
      return acc;
    }, {});

    return {
      total,
      pending,
      successful,
      failed,
      refunded,
      overdue,
      amounts: {
        pending: amountByStatus.PENDING || 0,
        successful: amountByStatus.SUCCESSFUL || 0,
        failed: amountByStatus.FAILED || 0,
        refunded: amountByStatus.REFUNDED || 0
      }
    };
  }
}

module.exports = new RentPaymentService();
