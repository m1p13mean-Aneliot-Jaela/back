const User = require('../user/user.model');
const { Shop } = require('../shop/shop.model');
const { LeaseContract } = require('../lease-contract/lease-contract.model');
const { RentPayment } = require('../rent-payment/rent-payment.model');

class AdminService {
  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats() {
    const [
      userStats,
      shopStats,
      leaseStats,
      rentPaymentStats,
      recentActivity
    ] = await Promise.all([
      this.getUserStats(),
      this.getShopStats(),
      this.getLeaseContractStats(),
      this.getRentPaymentStats(),
      this.getRecentActivity()
    ]);

    return {
      users: userStats,
      shops: shopStats,
      leaseContracts: leaseStats,
      rentPayments: rentPaymentStats,
      recentActivity
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const [total, byType, byStatus] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$user_type', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$current_status.status', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id || 'active'] = item.count;
        return acc;
      }, {})
    };
  }

  /**
   * Get shop statistics
   */
  async getShopStats() {
    const [total, byStatus] = await Promise.all([
      Shop.countDocuments(),
      Shop.aggregate([
        { $group: { _id: '$current_status.status', count: { $sum: 1 } } }
      ])
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id || 'pending'] = item.count;
        return acc;
      }, {})
    };
  }



  /**
   * Get lease contract statistics
   */
  async getLeaseContractStats() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [total, byStatus, expiringSoon] = await Promise.all([
      LeaseContract.countDocuments(),
      LeaseContract.aggregate([
        { $group: { _id: '$current_status.status', count: { $sum: 1 } } }
      ]),
      LeaseContract.countDocuments({
        'current_status.status': 'active',
        end_date: { $gte: today, $lte: thirtyDaysFromNow }
      })
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id || 'signed'] = item.count;
        return acc;
      }, {}),
      expiringSoon
    };
  }

  /**
   * Get rent payment statistics
   */
  async getRentPaymentStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, byStatus, overdue, amounts] = await Promise.all([
      RentPayment.countDocuments(),
      RentPayment.aggregate([
        { $group: { _id: '$current_status.status', count: { $sum: 1 } } }
      ]),
      RentPayment.countDocuments({
        'current_status.status': 'PENDING',
        due_date: { $lt: today }
      }),
      RentPayment.aggregate([
        {
          $group: {
            _id: '$current_status.status',
            total: { $sum: { $toDouble: '$amount' } }
          }
        }
      ])
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id || 'PENDING'] = item.count;
        return acc;
      }, {}),
      overdue,
      amounts: amounts.reduce((acc, item) => {
        acc[item._id] = item.total;
        return acc;
      }, {})
    };
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    const [recentUsers, recentShops] = await Promise.all([
      User.find()
        .sort({ registered_at: -1 })
        .limit(5)
        .select('first_name last_name email user_type registered_at')
        .lean(),
      Shop.find()
        .sort({ created_at: -1 })
        .limit(5)
        .select('shop_name current_status created_at')
        .lean()
    ]);

    return {
      users: recentUsers,
      shops: recentShops
    };
  }
}

module.exports = new AdminService();
