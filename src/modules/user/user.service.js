const userRepository = require('./user.repository');
const { ValidationError, NotFoundError } = require('../../shared/errors/custom-errors');
const { Shop } = require('../shop/shop.model');

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

  async assignUserToShop(userId, assignmentData) {
    const { shop_id, role } = assignmentData;
    const Employee = require('../employee/employee.model');
    const mongoose = require('mongoose');

    // Verify user exists
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify shop exists
    const shop = await Shop.findById(shop_id);
    if (!shop) {
      throw new NotFoundError('Shop not found');
    }

    // Check if user is already assigned to this shop
    const existingAssignment = shop.users.find(
      u => u.user_id.toString() === userId
    );

    if (existingAssignment) {
      // Update role if already assigned
      existingAssignment.role = role;
      existingAssignment.assigned_at = new Date();
      existingAssignment.first_name = user.first_name;
      existingAssignment.last_name = user.last_name;
    } else {
      // Add new user assignment
      shop.users.push({
        user_id: userId,
        role: role,
        assigned_at: new Date(),
        first_name: user.first_name,
        last_name: user.last_name
      });
    }

    await shop.save();

    // Create employee entity
    // Map shop role to employee role: owner/manager/MANAGER_SHOP -> MANAGER_SHOP, others -> STAFF
    const employeeRole = ['owner', 'manager', 'manager_shop'].includes(role.toLowerCase()) ? 'MANAGER_SHOP' : 'STAFF';
    
    // Check if employee already exists for this email
    const existingEmployee = await Employee.findOne({ email: user.email });
    
    if (!existingEmployee) {
      // Create new employee with already-hashed password
      // Insert directly to bypass pre-save hook that would re-hash the password
      const employeeData = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        password: user.password, // Already hashed from User model
        shop_id: new mongoose.Types.ObjectId(shop_id),
        shop_name: shop.shop_name,
        role: employeeRole,
        active: true,
        joined_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        update_history: []
      };
      
      await Employee.collection.insertOne(employeeData);
    } else if (existingEmployee.shop_id.toString() !== shop_id.toString()) {
      // Employee exists for another shop - update shop_id
      existingEmployee.shop_id = shop_id;
      existingEmployee.shop_name = shop.shop_name;
      existingEmployee.role = employeeRole;
      await existingEmployee.save();
    }

    return shop;
  }
}

module.exports = new UserService();
