const Employee = require('./employee.model');

class EmployeeRepository {
  async create(employeeData) {
    const employee = new Employee(employeeData);
    return employee.save();
  }

  async findById(id) {
    return Employee.findById(id).select('-password');
  }

  async findByEmail(email) {
    return Employee.findOne({ email: email.toLowerCase() });
  }

  async findByShopId(shopId, filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { joined_at: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = { shop_id: shopId, ...filters };

    const employees = await Employee.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(query);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, updateData, updaterInfo = null) {
    // Store update history
    const employee = await Employee.findById(id);
    if (employee && updateData) {
      const historyEntry = {
        updated_at: new Date(),
        updated_by: updaterInfo
      };

      ['first_name', 'last_name', 'email', 'phone', 'role', 'active'].forEach(field => {
        if (updateData[field] !== undefined) {
          historyEntry[field] = updateData[field];
        }
      });

      if (Object.keys(historyEntry).length > 1) {
        if (!employee.update_history) employee.update_history = [];
        employee.update_history.push(historyEntry);
      }
    }

    return Employee.findByIdAndUpdate(
      id,
      { ...updateData, update_history: employee?.update_history },
      { new: true, runValidators: true }
    ).select('-password');
  }

  async updateStatus(id, active, reason = '', updaterInfo = null) {
    const employee = await Employee.findById(id);
    if (!employee) return null;

    const updateData = {
      active,
      $push: {
        update_history: {
          active,
          updated_at: new Date(),
          updated_by: updaterInfo
        }
      }
    };

    return Employee.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
  }

  async delete(id) {
    return Employee.findByIdAndDelete(id);
  }

  async exists(email) {
    const employee = await Employee.findOne({ email: email.toLowerCase() });
    return !!employee;
  }

  async count(shopId = null) {
    const filters = shopId ? { shop_id: shopId } : {};
    return Employee.countDocuments(filters);
  }

  async countByRole(shopId) {
    return Employee.aggregate([
      { $match: { shop_id: new mongoose.Types.ObjectId(shopId) } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
  }
}

module.exports = new EmployeeRepository();
