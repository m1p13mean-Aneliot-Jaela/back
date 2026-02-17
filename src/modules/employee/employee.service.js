const employeeRepository = require('./employee.repository');
const userRepository = require('../user/user.repository');
const { ValidationError, NotFoundError } = require('../../shared/errors/custom-errors');

class EmployeeService {
  async createEmployee(employeeData, creatorInfo = null) {
    // Check if email already exists in employees
    const exists = await employeeRepository.exists(employeeData.email);
    if (exists) {
      throw new ValidationError('Email already in use');
    }

    // Validate role
    if (employeeData.role && !['MANAGER_SHOP', 'STAFF'].includes(employeeData.role)) {
      throw new ValidationError('Invalid role. Must be MANAGER_SHOP or STAFF');
    }

    // Create employee
    const employee = await employeeRepository.create(employeeData);

    // Also create user in users collection for authentication
    const userExists = await userRepository.findByEmail(employeeData.email);
    if (!userExists) {
      await userRepository.create({
        email: employeeData.email,
        password: employeeData.password, // Already hashed by employeeRepository
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        phone: employeeData.phone,
        user_type: 'shop',
        current_status: { status: 'active', updated_at: new Date() }
      });
    }

    return employee;
  }

  async getEmployeeById(id) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    return employee;
  }

  async getEmployeesByShop(shopId, filters = {}, options = {}) {
    return employeeRepository.findByShopId(shopId, filters, options);
  }

  async updateEmployee(id, updateData, updaterInfo = null) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Check email uniqueness if changing email
    if (updateData.email && updateData.email !== employee.email) {
      const exists = await employeeRepository.exists(updateData.email);
      if (exists) {
        throw new ValidationError('Email already in use');
      }
    }

    // Validate role
    if (updateData.role && !['MANAGER_SHOP', 'STAFF'].includes(updateData.role)) {
      throw new ValidationError('Invalid role. Must be MANAGER_SHOP or STAFF');
    }

    // Handle password update - validate length and hash
    if (updateData.password) {
      if (updateData.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
      }
      // Hash the password before saving
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(updateData.password, 10);
      
      // Also update password in users collection for login
      // Use updateOne to avoid the pre-save hook that would re-hash the password
      const User = require('../user/user.model');
      await User.updateOne(
        { email: employee.email },
        { $set: { password: updateData.password } }
      );
    }

    return employeeRepository.update(id, updateData, updaterInfo);
  }

  async updateEmployeeStatus(id, active, updaterInfo = null) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return employeeRepository.updateStatus(id, active, '', updaterInfo);
  }

  async deleteEmployee(id) {
    const employee = await employeeRepository.delete(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }
    return employee;
  }

  async getEmployeeStats(shopId = null) {
    const stats = {
      total: await employeeRepository.count(shopId),
      byRole: {}
    };

    if (shopId) {
      const roleCounts = await employeeRepository.countByRole(shopId);
      roleCounts.forEach(item => {
        stats.byRole[item._id] = item.count;
      });
    }

    return stats;
  }

  // Gestion des permissions basée sur le rôle
  getPermissions(role) {
    const permissions = {
      MANAGER_SHOP: {
        view_products: true,
        edit_products: true,
        delete_products: true,
        view_orders: true,
        process_orders: true,
        cancel_orders: true,
        view_sales: true,
        view_reports: true,
        manage_employees: true,
        manage_stock: true,
        manage_promotions: true
      },
      STAFF: {
        view_products: true,
        edit_products: false,
        delete_products: false,
        view_orders: true,
        process_orders: true,
        cancel_orders: false,
        view_sales: false,
        view_reports: false,
        manage_employees: false,
        manage_stock: true,  // Peut faire des mouvements de stock
        manage_promotions: false
      }
    };

    return permissions[role] || permissions.STAFF;
  }

  async checkPermission(employeeId, permission) {
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const permissions = this.getPermissions(employee.role);
    return permissions[permission] === true;
  }
}

module.exports = new EmployeeService();
