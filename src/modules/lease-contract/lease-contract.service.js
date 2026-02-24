const { LeaseContract } = require('./lease-contract.model');
const { Shop } = require('../shop/shop.model');
const { NotFoundError, ValidationError } = require('../../shared/errors/custom-errors');
const mongoose = require('mongoose');

class LeaseContractService {
  /**
   * Get all lease contracts with optional filters
   */
  async getAllLeaseContracts(filters = {}) {
    const query = {};
    
    // Build query from filters
    if (filters.status) {
      query['current_status.status'] = filters.status;
    }
    if (filters.shop_id) {
      query.shop_id = filters.shop_id;
    }
    if (filters.payment_frequency) {
      query.payment_frequency = filters.payment_frequency;
    }
    
    // Date range filters
    if (filters.start_date_from) {
      query.start_date = { $gte: new Date(filters.start_date_from) };
    }
    if (filters.end_date_to) {
      query.end_date = { $lte: new Date(filters.end_date_to) };
    }
    
    const contracts = await LeaseContract.find(query)
      .populate('shop_id', 'shop_name mall_location current_status')
      .sort({ created_at: -1 })
      .lean();
    
    // Convert Decimal128 to numbers
    return contracts.map(contract => ({
      ...contract,
      rent_amount: contract.rent_amount ? parseFloat(contract.rent_amount.toString()) : 0
    }));
  }

  /**
   * Get lease contract by ID
   */
  async getLeaseContractById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid contract ID');
    }

    const contract = await LeaseContract.findById(id)
      .populate('shop_id', 'shop_name mall_location current_status logo');
    
    if (!contract) {
      throw new NotFoundError('Lease contract not found');
    }
    
    return contract;
  }

  /**
   * Get lease contracts by shop ID
   */
  async getLeaseContractsByShop(shopId) {
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      throw new ValidationError('Invalid shop ID');
    }

    const contracts = await LeaseContract.find({ shop_id: shopId })
      .sort({ created_at: -1 })
      .lean();
    
    return contracts.map(contract => ({
      ...contract,
      rent_amount: contract.rent_amount ? parseFloat(contract.rent_amount.toString()) : 0
    }));
  }

  /**
   * Create new lease contract
   */
  async createLeaseContract(data) {
    // Validate shop exists
    const shop = await Shop.findById(data.shop_id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (startDate >= endDate) {
      throw new ValidationError('End date must be after start date');
    }

    // Prepare contract data
    const contractData = {
      shop_id: data.shop_id,
      shop_name: shop.shop_name,
      start_date: startDate,
      end_date: endDate,
      rent_amount: mongoose.Types.Decimal128.fromString(data.rent_amount.toString()),
      payment_frequency: data.payment_frequency,
      special_conditions: data.special_conditions || '',
      current_status: {
        status: data.status || 'signed',
        reason: data.status_reason || '',
        updated_at: new Date()
      },
      status_history: [{
        status: data.status || 'signed',
        reason: data.status_reason || '',
        updated_at: new Date()
      }],
      created_at: new Date()
    };

    const contract = new LeaseContract(contractData);
    await contract.save();
    
    return contract;
  }

  /**
   * Update lease contract
   */
  async updateLeaseContract(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid contract ID');
    }

    const contract = await LeaseContract.findById(id);
    if (!contract) {
      throw new NotFoundError('Lease contract not found');
    }

    // Store update in history
    const updateRecord = {
      start_date: contract.start_date,
      end_date: contract.end_date,
      rent_amount: contract.rent_amount,
      payment_frequency: contract.payment_frequency,
      special_conditions: contract.special_conditions,
      updated_at: new Date()
    };

    // Update fields
    if (data.start_date) {
      contract.start_date = new Date(data.start_date);
    }
    if (data.end_date) {
      contract.end_date = new Date(data.end_date);
    }
    if (data.rent_amount !== undefined) {
      contract.rent_amount = mongoose.Types.Decimal128.fromString(data.rent_amount.toString());
    }
    if (data.payment_frequency) {
      contract.payment_frequency = data.payment_frequency;
    }
    if (data.special_conditions !== undefined) {
      contract.special_conditions = data.special_conditions;
    }

    // Update status if provided
    if (data.status) {
      contract.current_status = {
        status: data.status,
        reason: data.status_reason || '',
        updated_at: new Date()
      };

      // Add to status history
      if (!contract.status_history) {
        contract.status_history = [];
      }
      contract.status_history.push({
        status: data.status,
        reason: data.status_reason || '',
        updated_at: new Date()
      });
    }

    // Validate dates
    if (contract.start_date >= contract.end_date) {
      throw new ValidationError('End date must be after start date');
    }

    // Add to update history
    if (!contract.update_history) {
      contract.update_history = [];
    }
    contract.update_history.push(updateRecord);

    await contract.save();
    
    return contract;
  }

  /**
   * Update contract status
   */
  async updateContractStatus(id, status, reason = '') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid contract ID');
    }

    const validStatuses = ['active', 'expired', 'terminated', 'signed'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const contract = await LeaseContract.findById(id);
    if (!contract) {
      throw new NotFoundError('Lease contract not found');
    }

    // Update current status
    contract.current_status = {
      status,
      reason,
      updated_at: new Date()
    };

    // Add to status history
    if (!contract.status_history) {
      contract.status_history = [];
    }
    contract.status_history.push({
      status,
      reason,
      updated_at: new Date()
    });

    await contract.save();
    
    return contract;
  }

  /**
   * Delete lease contract
   */
  async deleteLeaseContract(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid contract ID');
    }

    const contract = await LeaseContract.findByIdAndDelete(id);
    if (!contract) {
      throw new NotFoundError('Lease contract not found');
    }
    
    return contract;
  }

  /**
   * Get expiring contracts (within next 30 days)
   */
  async getExpiringContracts(days = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const contracts = await LeaseContract.find({
      end_date: { $gte: today, $lte: futureDate },
      'current_status.status': 'active'
    })
      .populate('shop_id', 'shop_name mall_location')
      .sort({ end_date: 1 })
      .lean();
    
    return contracts.map(contract => ({
      ...contract,
      rent_amount: contract.rent_amount ? parseFloat(contract.rent_amount.toString()) : 0
    }));
  }

  /**
   * Get active contracts
   */
  async getActiveContracts() {
    const contracts = await LeaseContract.find({
      'current_status.status': 'active'
    })
      .populate('shop_id', 'shop_name mall_location current_status')
      .sort({ end_date: 1 })
      .lean();
    
    return contracts.map(contract => ({
      ...contract,
      rent_amount: contract.rent_amount ? parseFloat(contract.rent_amount.toString()) : 0
    }));
  }
}

module.exports = new LeaseContractService();
