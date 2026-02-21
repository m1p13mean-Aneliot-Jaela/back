const userRepository = require('./user.repository');
const { ValidationError, NotFoundError } = require('../../shared/errors/custom-errors');

class UserService {
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getUserByEmail(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getAllUsers(filters = {}, options = {}) {
    return userRepository.findAll(filters, options);
  }

  async createUser(userData) {
    // Check if user already exists
    const existingUser = await userRepository.exists(userData.email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    return userRepository.create(userData);
  }

  async updateUser(id, updateData) {
    const user = await userRepository.update(id, updateData);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async updateUserStatus(id, status, reason = '') {
    const validStatuses = ['active', 'suspended', 'blocked'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const user = await userRepository.updateStatus(id, status, reason);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async deleteUser(id) {
    const user = await userRepository.delete(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getUserStats() {
    const stats = {
      total: await userRepository.count(),
      byType: {
        admin: await userRepository.count({ user_type: 'admin' }),
        shop: await userRepository.count({ user_type: 'shop' }),
        buyer: await userRepository.count({ user_type: 'buyer' })
      },
      byStatus: {
        active: await userRepository.count({ 'current_status.status': 'active' }),
        suspended: await userRepository.count({ 'current_status.status': 'suspended' }),
        blocked: await userRepository.count({ 'current_status.status': 'blocked' })
      }
    };
    return stats;
  }
}

module.exports = new UserService();
